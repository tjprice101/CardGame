-- Phase 3: direct messages + report queue.
--
-- Threads are keyed by an ordered pair (user_low, user_high) so each pair of
-- users has exactly one canonical thread regardless of who started it.
-- Messages live in dm_messages and are filtered by participant via RLS.
-- Blocks (Phase 2) prevent message inserts in either direction.
-- A small per-sender rate-limit trigger guards against flooding.

create table if not exists public.dm_threads (
  id              uuid primary key default gen_random_uuid(),
  user_low        uuid not null references public.profiles(id) on delete cascade,
  user_high       uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz,
  created_at      timestamptz not null default now(),
  unique (user_low, user_high),
  check (user_low < user_high)
);

create index if not exists dm_threads_user_low_idx  on public.dm_threads(user_low);
create index if not exists dm_threads_user_high_idx on public.dm_threads(user_high);

create table if not exists public.dm_messages (
  id              uuid primary key default gen_random_uuid(),
  thread_id       uuid not null references public.dm_threads(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id)   on delete cascade,
  body            text not null check (char_length(body) between 1 and 1000),
  attachment_json jsonb,
  created_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index if not exists dm_messages_thread_idx on public.dm_messages(thread_id, created_at desc);

create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter     uuid not null references public.profiles(id) on delete cascade,
  target_user  uuid not null references public.profiles(id) on delete cascade,
  message_id   uuid references public.dm_messages(id) on delete set null,
  reason       text not null check (char_length(reason) between 1 and 500),
  created_at   timestamptz not null default now()
);

alter table public.dm_threads  enable row level security;
alter table public.dm_messages enable row level security;
alter table public.reports     enable row level security;

-- dm_threads: visible to participants only.
drop policy if exists dm_threads_select on public.dm_threads;
create policy dm_threads_select
  on public.dm_threads for select
  to authenticated
  using (auth.uid() in (user_low, user_high));

-- Direct inserts are blocked. Clients must call get_or_create_dm_thread() (below),
-- which enforces ordering + the block check atomically.
drop policy if exists dm_threads_insert on public.dm_threads;
-- (no insert policy = no client INSERT allowed)

-- dm_messages: visible only to thread participants and not soft-deleted.
drop policy if exists dm_messages_select on public.dm_messages;
create policy dm_messages_select
  on public.dm_messages for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.dm_threads t
      where t.id = thread_id
        and auth.uid() in (t.user_low, t.user_high)
    )
  );

drop policy if exists dm_messages_insert on public.dm_messages;
create policy dm_messages_insert
  on public.dm_messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.dm_threads t
      where t.id = thread_id
        and auth.uid() in (t.user_low, t.user_high)
        -- block check: no block in either direction between the two participants.
        and not exists (
          select 1 from public.blocks b
          where (b.blocker = t.user_low  and b.blocked = t.user_high)
             or (b.blocker = t.user_high and b.blocked = t.user_low)
        )
    )
  );

-- Soft-delete own messages (UI uses update to set deleted_at).
drop policy if exists dm_messages_update_own on public.dm_messages;
create policy dm_messages_update_own
  on public.dm_messages for update
  to authenticated
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

-- reports: reporter can insert + see their own filings. Admin review is manual.
drop policy if exists reports_insert on public.reports;
create policy reports_insert
  on public.reports for insert
  to authenticated
  with check (reporter = auth.uid());

drop policy if exists reports_select_own on public.reports;
create policy reports_select_own
  on public.reports for select
  to authenticated
  using (reporter = auth.uid());

-- get_or_create_dm_thread: atomic ordered-pair upsert. Returns the thread id.
-- security definer so it can bypass dm_threads INSERT policy; checks block status itself.
create or replace function public.get_or_create_dm_thread(other_user uuid)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  me      uuid := auth.uid();
  lo      uuid;
  hi      uuid;
  tid     uuid;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if other_user is null or other_user = me then
    raise exception 'invalid recipient';
  end if;
  -- Ensure both profiles exist (FK would fire on insert otherwise).
  if not exists (select 1 from public.profiles where id = other_user) then
    raise exception 'recipient profile missing';
  end if;
  -- Block check in either direction.
  if exists (
    select 1 from public.blocks b
    where (b.blocker = me and b.blocked = other_user)
       or (b.blocker = other_user and b.blocked = me)
  ) then
    raise exception 'blocked';
  end if;

  if me < other_user then lo := me; hi := other_user;
  else                    lo := other_user; hi := me;
  end if;

  insert into public.dm_threads (user_low, user_high)
  values (lo, hi)
  on conflict (user_low, user_high) do update
    set user_low = excluded.user_low
  returning id into tid;

  return tid;
end $$;

revoke all on function public.get_or_create_dm_thread(uuid) from public;
grant execute on function public.get_or_create_dm_thread(uuid) to authenticated;

-- Bump dm_threads.last_message_at on new message insert.
create or replace function public.dm_messages_touch_thread()
returns trigger language plpgsql as $$
begin
  update public.dm_threads
    set last_message_at = new.created_at
    where id = new.thread_id;
  return new;
end $$;

drop trigger if exists dm_messages_touch_thread_t on public.dm_messages;
create trigger dm_messages_touch_thread_t
  after insert on public.dm_messages
  for each row execute function public.dm_messages_touch_thread();

-- Per-sender flood guard: reject if same sender posted < 500ms ago.
create or replace function public.dm_messages_rate_limit()
returns trigger language plpgsql as $$
declare
  last_at timestamptz;
begin
  select max(created_at) into last_at
    from public.dm_messages
    where sender_id = new.sender_id;
  if last_at is not null and now() - last_at < interval '500 milliseconds' then
    raise exception 'rate limit: slow down (500ms minimum between messages)';
  end if;
  return new;
end $$;

drop trigger if exists dm_messages_rate_limit_t on public.dm_messages;
create trigger dm_messages_rate_limit_t
  before insert on public.dm_messages
  for each row execute function public.dm_messages_rate_limit();
