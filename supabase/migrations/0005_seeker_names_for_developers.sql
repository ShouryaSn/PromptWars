-- The Request Inbox joins requests -> profiles to show the seeker's name to
-- the developer who received the request. profiles only exposes a row to
-- its owner or (separately) to the public for opted-in developers, so that
-- join silently returned null full_name for the seeker. Mirror the pattern
-- from 0003_public_developer_names.sql: a seeker's name is visible to a
-- developer only once that seeker has actually sent them a request, nothing
-- more.
create policy "seeker name visible to developers they've requested"
  on public.profiles for select
  using (
    exists (
      select 1 from public.requests r
      where r.seeker_id = profiles.id and r.developer_id = auth.uid()
    )
  );
