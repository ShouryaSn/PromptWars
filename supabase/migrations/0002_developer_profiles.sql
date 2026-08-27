-- One row per developer, holding the profile details shown to seekers in
-- the match pool (mirrors the shape of the mock Candidate template in
-- lib/candidates.ts). id is 1:1 with profiles.id (and therefore auth.users.id).
create table public.developer_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  title text not null,
  skills text[] not null default '{}',
  interests text[] not null default '{}',
  availability text not null,
  experience text not null check (experience in ('Junior', 'Mid', 'Senior', 'Lead')),
  bio text not null,
  location text not null,
  email text not null,
  phone text,
  linkedin_handle text,
  github_handle text,
  avatar_url text,
  opted_in boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.developer_profiles enable row level security;

create policy "developer profiles are viewable by their owner"
  on public.developer_profiles for select
  using (auth.uid() = id);

-- Opted-in profiles must also be readable by the matching API (which reads
-- as the anon role, not as the developer) so real developers actually show
-- up as candidates for seekers.
create policy "opted-in developer profiles are publicly viewable"
  on public.developer_profiles for select
  using (opted_in = true);

create policy "developer profiles are insertable by their owner"
  on public.developer_profiles for insert
  with check (auth.uid() = id);

create policy "developer profiles are updatable by their owner"
  on public.developer_profiles for update
  using (auth.uid() = id);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger developer_profiles_set_updated_at
  before update on public.developer_profiles
  for each row execute procedure public.set_updated_at();

-- One row per time a real developer profile is surfaced by the matching
-- API for a seeker's project — powers the developer-facing stats
-- ("suggested N times", "matched under these skills").
create table public.match_impressions (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.developer_profiles (id) on delete cascade,
  matched_at timestamptz not null default now(),
  match_score integer not null,
  was_top_pick boolean not null default false,
  required_roles text[] not null default '{}',
  required_skills text[] not null default '{}'
);

alter table public.match_impressions enable row level security;

create policy "match impressions are viewable by the matched developer"
  on public.match_impressions for select
  using (auth.uid() = developer_id);

-- Logged by the matching API (running as the seeker's session, not the
-- developer's) right after a real developer is picked, so it can't rely on
-- auth.uid() = developer_id. Scoped instead to only opted-in developers,
-- matching the same trust boundary as the public select policy above.
create policy "impressions can be logged for any opted-in developer"
  on public.match_impressions for insert
  with check (
    exists (
      select 1 from public.developer_profiles dp
      where dp.id = developer_id and dp.opted_in = true
    )
  );

create index match_impressions_developer_id_idx on public.match_impressions (developer_id);
