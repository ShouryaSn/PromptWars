-- One row per "Send a Request" a seeker sends to a real developer. Project
-- name/description are snapshotted onto the row (not FK'd to a separate
-- projects table) since there's no project history/list feature — each
-- request just needs to remember what it was for.
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  seeker_id uuid not null references public.profiles (id) on delete cascade,
  developer_id uuid not null references public.developer_profiles (id) on delete cascade,
  project_name text not null,
  project_description text not null,
  is_paid boolean not null,
  payment_mode text check (payment_mode in ('PayPal', 'Bank Transfer', 'Other')),
  payment_timing text check (payment_timing in ('After completion', 'Upfront', 'Task completion')),
  deadline date,
  work_type text not null check (work_type in ('Full-time', 'Part-time', 'Project-based', 'Freelance', 'Club/Volunteer')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_details_only_when_paid check (
    (is_paid = true and payment_mode is not null and payment_timing is not null)
    or
    (is_paid = false and payment_mode is null and payment_timing is null)
  )
);

alter table public.requests enable row level security;

create policy "seekers can send requests as themselves"
  on public.requests for insert
  with check (auth.uid() = seeker_id);

create policy "seekers can view their own sent requests"
  on public.requests for select
  using (auth.uid() = seeker_id);

create policy "developers can view requests sent to them"
  on public.requests for select
  using (auth.uid() = developer_id);

create policy "developers can respond to requests sent to them"
  on public.requests for update
  using (auth.uid() = developer_id);

-- Reuses the updated_at trigger function already defined in 0002_developer_profiles.sql.
create trigger requests_set_updated_at
  before update on public.requests
  for each row execute procedure public.set_updated_at();

create index requests_seeker_id_idx on public.requests (seeker_id);
create index requests_developer_id_idx on public.requests (developer_id);
create index requests_status_idx on public.requests (status);

-- Avatar uploads for developer profiles. Files are stored at
-- "<user_id>/<filename>" so the RLS policies below can check the first path
-- segment against auth.uid() without a lookup table.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatar images are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
