-- In-app chat: a client (seeker) groups chats under named projects, adds
-- developers who have accepted one of their requests, and the whole thing
-- self-destructs (goes read-only) 48h after creation. Four tables:
-- chat_projects (client's grouping folders) -> chats (one thread, 48h TTL)
-- -> chat_members (who's in it, capped at 6) -> chat_messages (the text).
--
-- All four tables are created up front before any RLS policy is added,
-- since several policies below reference other tables in this same
-- migration and Postgres needs those relations to already exist.

create table public.chat_projects (
  id uuid primary key default gen_random_uuid(),
  seeker_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.chat_projects (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '48 hours')
);

create table public.chat_members (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('client', 'developer')),
  joined_at timestamptz not null default now(),
  unique (chat_id, user_id)
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

-- Every membership/ownership check used by more than one policy below is a
-- security definer function rather than an inline cross-table subquery.
-- RLS is enforced by rewriting each policy's USING/WITH CHECK into the
-- query, recursively, for *every* table it touches - so a plain subquery
-- from a chats policy into chat_projects (or chat_members back into
-- itself) makes Postgres re-enter that same table's policy mid-evaluation
-- and it refuses with "infinite recursion detected in policy for relation
-- ..." (42P17), even when the chain is logically finite. A security
-- definer function's internal query bypasses RLS entirely, which breaks
-- the cycle.
create function public.is_chat_member(target_chat_id uuid)
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select exists (
    select 1 from public.chat_members
    where chat_id = target_chat_id and user_id = auth.uid()
  );
$$;

create function public.is_chat_client(target_chat_id uuid)
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select exists (
    select 1 from public.chats
    where id = target_chat_id and client_id = auth.uid()
  );
$$;

create function public.owns_chat_project(target_project_id uuid)
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select exists (
    select 1 from public.chat_projects
    where id = target_project_id and seeker_id = auth.uid()
  );
$$;

create function public.project_has_member_chat(target_project_id uuid)
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.chats c
    join public.chat_members m on m.chat_id = c.id
    where c.project_id = target_project_id and m.user_id = auth.uid()
  );
$$;

create function public.chat_is_open_for_sender(target_chat_id uuid)
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.chat_members m
    join public.chats c on c.id = m.chat_id
    where m.chat_id = target_chat_id and m.user_id = auth.uid() and c.expires_at > now()
  );
$$;

alter table public.chat_projects enable row level security;
alter table public.chats enable row level security;
alter table public.chat_members enable row level security;
alter table public.chat_messages enable row level security;

create policy "clients manage their own chat projects"
  on public.chat_projects for all
  using (auth.uid() = seeker_id)
  with check (auth.uid() = seeker_id);

-- A developer needs to read the project *name* (not the row's ownership)
-- purely to render "grouped under project-name categories" on their side,
-- and only for projects that actually back a chat they're a member of.
create policy "members can view the project name behind their chats"
  on public.chat_projects for select
  using (public.project_has_member_chat(id));

create policy "clients create chats under their own projects"
  on public.chats for insert
  with check (auth.uid() = client_id and public.owns_chat_project(project_id));

-- Also true for the client outright (not just via chat_members membership):
-- INSERT ... RETURNING requires the freshly inserted row to satisfy this
-- SELECT policy, and the client's own chat_members row isn't inserted until
-- a second, separate call right after this one - without the client_id
-- escape hatch, creating a chat would fail with "new row violates row-level
-- security policy" on the RETURNING clause alone, before membership exists.
create policy "members can view chats they belong to"
  on public.chats for select
  using (public.is_chat_member(id) or auth.uid() = client_id);

create policy "clients can delete their own chats"
  on public.chats for delete
  using (auth.uid() = client_id);

-- Membership implies visibility: any current member can see the roster of
-- a chat they're already in.
create policy "members can view the roster of their own chats"
  on public.chat_members for select
  using (public.is_chat_member(chat_id));

-- Two legitimate ways a row gets inserted: the client seeding themselves as
-- a member the moment they create the chat, or the client adding a
-- developer who has actually accepted a request from them.
create policy "clients seed themselves or add accepted developers"
  on public.chat_members for insert
  with check (
    public.is_chat_client(chat_id)
    and (
      (role = 'client' and user_id = auth.uid())
      or (
        role = 'developer'
        and exists (
          select 1 from public.requests r
          where r.developer_id = user_id
            and r.seeker_id = auth.uid()
            and r.status = 'accepted'
        )
      )
    )
  );

-- Removal: the client can remove any developer row from their own chat;
-- a developer can remove only their own row (voluntary leave). Nobody
-- (including the client) can delete the client's own membership row this
-- way - deleting the whole chat is the "client leaves/ends it" action.
create policy "clients remove developers or developers remove themselves"
  on public.chat_members for delete
  using (
    (role = 'developer' and public.is_chat_client(chat_id))
    or (role = 'developer' and user_id = auth.uid())
  );

create policy "members can read messages in their own chats"
  on public.chat_messages for select
  using (public.is_chat_member(chat_id));

-- Sending is blocked once the chat's 48h window has passed - the read-only
-- lock is enforced here, not just hidden behind a disabled button in the UI.
create policy "members can send messages before the 48h chat expires"
  on public.chat_messages for insert
  with check (auth.uid() = sender_id and public.chat_is_open_for_sender(chat_id));

-- Hard cap of 6 members per chat (including the client), enforced in the
-- database so a race between two inserts can't sneak past a client-side
-- check. security definer so the count reflects every real row rather
-- than only the rows visible to the inserting user's own RLS policy.
create function public.enforce_chat_member_cap()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select count(*) from public.chat_members where chat_id = new.chat_id) >= 6 then
    raise exception 'chat already has the maximum of 6 members';
  end if;
  return new;
end;
$$;

create trigger chat_members_enforce_cap
  before insert on public.chat_members
  for each row execute procedure public.enforce_chat_member_cap();

create index chat_projects_seeker_id_idx on public.chat_projects (seeker_id);
create index chats_project_id_idx on public.chats (project_id);
create index chats_client_id_idx on public.chats (client_id);
create index chat_members_chat_id_idx on public.chat_members (chat_id);
create index chat_members_user_id_idx on public.chat_members (user_id);
create index chat_messages_chat_id_idx on public.chat_messages (chat_id);
