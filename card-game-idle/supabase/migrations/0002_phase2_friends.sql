-- Phase 2: friends graph + blocks.
--
-- friend_requests rows model both pending requests and accepted friendships,
-- transitioning via status. A friendship exists iff a row with status='accepted'
-- exists with (from_user, to_user) in either order.
--
-- blocks is a separate, owner-only table. A block from A on B does NOT delete
-- friend_requests rows (so unblock restores the prior state), but Phase 3 DM
-- RLS will filter messages by both participants' block sets.

do $$ begin
  create type public.friend_status as enum ('pending', 'accepted', 'declined');
exception when duplicate_object then null; end $$;

create table if not exists public.friend_requests (
  from_user   uuid not null references public.profiles(id) on delete cascade,
  to_user     uuid not null references public.profiles(id) on delete cascade,
  status      public.friend_status not null default 'pending',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (from_user, to_user),
  check (from_user <> to_user)
);

create index if not exists friend_requests_to_idx   on public.friend_requests(to_user, status);
create index if not exists friend_requests_from_idx on public.friend_requests(from_user, status);

create table if not exists public.blocks (
  blocker     uuid not null references public.profiles(id) on delete cascade,
  blocked     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);

alter table public.friend_requests enable row level security;
alter table public.blocks          enable row level security;

-- friend_requests: visible to either side.
drop policy if exists friend_requests_select on public.friend_requests;
create policy friend_requests_select
  on public.friend_requests for select
  to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());

-- Sender can create a pending row to anyone they haven't blocked / been blocked by.
drop policy if exists friend_requests_insert on public.friend_requests;
create policy friend_requests_insert
  on public.friend_requests for insert
  to authenticated
  with check (
    from_user = auth.uid()
    and status = 'pending'
    and not exists (
      select 1 from public.blocks b
      where (b.blocker = auth.uid() and b.blocked = to_user)
         or (b.blocker = to_user    and b.blocked = auth.uid())
    )
  );

-- Either side can update (accept/decline/cancel). UI guards which transitions are valid.
drop policy if exists friend_requests_update on public.friend_requests;
create policy friend_requests_update
  on public.friend_requests for update
  to authenticated
  using (from_user = auth.uid() or to_user = auth.uid())
  with check (from_user = auth.uid() or to_user = auth.uid());

-- Either side can delete (unfriend / withdraw).
drop policy if exists friend_requests_delete on public.friend_requests;
create policy friend_requests_delete
  on public.friend_requests for delete
  to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());

-- blocks: only the blocker sees / mutates their own rows.
drop policy if exists blocks_select on public.blocks;
create policy blocks_select
  on public.blocks for select
  to authenticated
  using (blocker = auth.uid());

drop policy if exists blocks_insert on public.blocks;
create policy blocks_insert
  on public.blocks for insert
  to authenticated
  with check (blocker = auth.uid());

drop policy if exists blocks_delete on public.blocks;
create policy blocks_delete
  on public.blocks for delete
  to authenticated
  using (blocker = auth.uid());

-- updated_at bump on friend_requests state transitions.
create or replace function public.friend_requests_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists friend_requests_touch_t on public.friend_requests;
create trigger friend_requests_touch_t
  before update on public.friend_requests
  for each row execute function public.friend_requests_touch();
