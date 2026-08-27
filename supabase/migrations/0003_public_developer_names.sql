-- The match API joins developer_profiles -> profiles to show a real
-- developer's display name to a seeker. profiles only has an owner-only
-- select policy, so that join silently returned null full_name for anyone
-- other than the developer themselves. Add a policy scoped the same way as
-- the public developer_profiles policy: only the name of an opted-in
-- developer is exposed, nothing else about a stranger's profile row.
create policy "full name of opted-in developers is publicly viewable"
  on public.profiles for select
  using (
    exists (
      select 1 from public.developer_profiles dp
      where dp.id = profiles.id and dp.opted_in = true
    )
  );
