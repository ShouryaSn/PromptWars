-- Profile row per auth user, holding the Seeker/Developer role choice.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text check (role in ('seeker', 'developer')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by their owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles are updatable by their owner"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a (role-less) profile the moment someone signs up, from
-- whatever name the provider handed us (OAuth full_name, or the email's
-- local part as a fallback for plain email signups).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
