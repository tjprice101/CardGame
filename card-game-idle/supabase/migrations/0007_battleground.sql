-- =============================================================================
-- 0007_battleground.sql
-- Battleground of the Card-born — Phase 3 social.
--
-- Adds two tables:
--   battleground_sessions  — one row per match (both PvP and CPU results).
--   battleground_invites   — PvP invite handshake (host → guest).
--
-- Also alters profile_stats to add battleground leaderboard columns so the
-- existing FriendsLeaderboard component can rank by battleground_wins and
-- battleground_best_score without a separate fetch.
-- =============================================================================

-- ── battleground_sessions ─────────────────────────────────────────────────────

create table public.battleground_sessions (
  id            uuid primary key default gen_random_uuid(),
  host_id       uuid not null references public.profiles(id) on delete cascade,
  guest_id      uuid         references public.profiles(id) on delete set null,
  -- 'cpu' | 'pvp'
  kind          text not null check (kind in ('cpu', 'pvp')),
  status        text not null default 'pending'
                  check (status in ('pending', 'active', 'finished', 'cancelled')),
  host_score    int  not null default 0,
  guest_score   int  not null default 0,
  winner_id     uuid         references public.profiles(id) on delete set null,
  started_at    timestamptz,
  finished_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index battleground_sessions_host_idx
  on public.battleground_sessions (host_id, created_at desc);
create index battleground_sessions_guest_idx
  on public.battleground_sessions (guest_id, created_at desc);

alter table public.battleground_sessions enable row level security;

-- Participants (host or guest) can read their own sessions.
drop policy if exists battleground_sessions_select on public.battleground_sessions;
create policy battleground_sessions_select
  on public.battleground_sessions for select
  to authenticated
  using (host_id = auth.uid() or guest_id = auth.uid());

-- Anyone authenticated can insert (host creates the session).
drop policy if exists battleground_sessions_insert on public.battleground_sessions;
create policy battleground_sessions_insert
  on public.battleground_sessions for insert
  to authenticated
  with check (host_id = auth.uid());

-- Only participants can update (score sync, status changes).
drop policy if exists battleground_sessions_update on public.battleground_sessions;
create policy battleground_sessions_update
  on public.battleground_sessions for update
  to authenticated
  using (host_id = auth.uid() or guest_id = auth.uid())
  with check (host_id = auth.uid() or guest_id = auth.uid());


-- ── battleground_invites ──────────────────────────────────────────────────────

create table public.battleground_invites (
  id           uuid primary key default gen_random_uuid(),
  from_user    uuid not null references public.profiles(id) on delete cascade,
  to_user      uuid not null references public.profiles(id) on delete cascade,
  session_id   uuid         references public.battleground_sessions(id) on delete cascade,
  -- 'pending' | 'accepted' | 'declined' | 'expired'
  status       text not null default 'pending'
                 check (status in ('pending', 'accepted', 'declined', 'expired')),
  created_at   timestamptz not null default now(),
  -- Prevent duplicate open invites between same pair.
  constraint no_duplicate_open_invite unique (from_user, to_user, status)
             deferrable initially deferred
);

create index battleground_invites_to_user_idx
  on public.battleground_invites (to_user, created_at desc);

alter table public.battleground_invites enable row level security;

-- Sender and recipient can read the invite.
drop policy if exists battleground_invites_select on public.battleground_invites;
create policy battleground_invites_select
  on public.battleground_invites for select
  to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());

-- Only the sender can insert.
drop policy if exists battleground_invites_insert on public.battleground_invites;
create policy battleground_invites_insert
  on public.battleground_invites for insert
  to authenticated
  with check (from_user = auth.uid());

-- Both parties can update status (recipient accepts/declines; sender can expire).
drop policy if exists battleground_invites_update on public.battleground_invites;
create policy battleground_invites_update
  on public.battleground_invites for update
  to authenticated
  using (from_user = auth.uid() or to_user = auth.uid())
  with check (from_user = auth.uid() or to_user = auth.uid());


-- ── profile_stats leaderboard columns ────────────────────────────────────────

alter table public.profile_stats
  add column if not exists battleground_wins       int not null default 0,
  add column if not exists battleground_best_score int not null default 0;

-- ── activity_events: allow battleground_result kind ───────────────────────────
-- Drop and recreate the check constraint to add the new kind value.
alter table public.activity_events
  drop constraint if exists activity_events_kind_check;

alter table public.activity_events
  add constraint activity_events_kind_check check (kind in (
    'boss_clear',
    'infinite_pull',
    'gauntlet_best',
    'set_completion',
    'title_unlocked',
    'battleground_result'
  ));
