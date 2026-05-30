-- =============================================================================
-- 0009_coop_raids.sql
-- Co-op Null Raids — realtime invite/session backbone.
--
-- Adds two tables:
--   coop_raid_sessions — one row per co-op raid run (host + guest).
--   coop_raid_invites  — invite handshake for co-op raid party formation.
-- =============================================================================

-- ── coop_raid_sessions ──────────────────────────────────────────────────────

create table public.coop_raid_sessions (
  id                       uuid primary key default gen_random_uuid(),
  host_id                  uuid not null references public.profiles(id) on delete cascade,
  guest_id                 uuid         references public.profiles(id) on delete set null,
  raid_id                  text not null,
  host_deck_id             text,
  guest_deck_id            text,
  status                   text not null default 'pending'
                             check (status in ('pending', 'active', 'finished', 'cancelled')),
  host_encounter_index     int  not null default 0,
  guest_encounter_index    int  not null default 0,
  host_total_damage        bigint not null default 0,
  guest_total_damage       bigint not null default 0,
  completed_encounters     int not null default 0,
  started_at               timestamptz,
  finished_at              timestamptz,
  created_at               timestamptz not null default now()
);

create index coop_raid_sessions_host_idx
  on public.coop_raid_sessions (host_id, created_at desc);
create index coop_raid_sessions_guest_idx
  on public.coop_raid_sessions (guest_id, created_at desc);
create index coop_raid_sessions_raid_idx
  on public.coop_raid_sessions (raid_id, created_at desc);

alter table public.coop_raid_sessions enable row level security;

drop policy if exists coop_raid_sessions_select on public.coop_raid_sessions;
create policy coop_raid_sessions_select
  on public.coop_raid_sessions for select
  to authenticated
  using (host_id = auth.uid() or guest_id = auth.uid());

drop policy if exists coop_raid_sessions_insert on public.coop_raid_sessions;
create policy coop_raid_sessions_insert
  on public.coop_raid_sessions for insert
  to authenticated
  with check (host_id = auth.uid());

drop policy if exists coop_raid_sessions_update on public.coop_raid_sessions;
create policy coop_raid_sessions_update
  on public.coop_raid_sessions for update
  to authenticated
  using (host_id = auth.uid() or guest_id = auth.uid())
  with check (host_id = auth.uid() or guest_id = auth.uid());


-- ── coop_raid_invites ───────────────────────────────────────────────────────

create table public.coop_raid_invites (
  id                      uuid primary key default gen_random_uuid(),
  from_user               uuid not null references public.profiles(id) on delete cascade,
  to_user                 uuid not null references public.profiles(id) on delete cascade,
  session_id              uuid         references public.coop_raid_sessions(id) on delete cascade,
  raid_id                 text not null,
  host_deck_id            text,
  status                  text not null default 'pending'
                            check (status in ('pending', 'accepted', 'declined', 'expired')),
  created_at              timestamptz not null default now()
);

create index coop_raid_invites_to_user_idx
  on public.coop_raid_invites (to_user, created_at desc);

create unique index if not exists coop_raid_invites_pending_unique_idx
  on public.coop_raid_invites (from_user, to_user, raid_id)
  where status = 'pending';

alter table public.coop_raid_invites enable row level security;

drop policy if exists coop_raid_invites_select on public.coop_raid_invites;
create policy coop_raid_invites_select
  on public.coop_raid_invites for select
  to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());

drop policy if exists coop_raid_invites_insert on public.coop_raid_invites;
create policy coop_raid_invites_insert
  on public.coop_raid_invites for insert
  to authenticated
  with check (from_user = auth.uid());

drop policy if exists coop_raid_invites_update on public.coop_raid_invites;
create policy coop_raid_invites_update
  on public.coop_raid_invites for update
  to authenticated
  using (from_user = auth.uid() or to_user = auth.uid())
  with check (from_user = auth.uid() or to_user = auth.uid());


-- ── activity_events: allow coop_raid_clear kind ────────────────────────────

alter table public.activity_events
  drop constraint if exists activity_events_kind_check;

alter table public.activity_events
  add constraint activity_events_kind_check check (kind in (
    'boss_clear',
    'infinite_pull',
    'gauntlet_best',
    'set_completion',
    'title_unlocked',
    'battleground_result',
    'coop_raid_clear'
  ));

-- ── Realtime publication wiring ────────────────────────────────────────────

do $$
begin
  begin
    alter publication supabase_realtime add table public.coop_raid_invites;
  exception
    when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.coop_raid_sessions;
  exception
    when duplicate_object then null;
  end;
end $$;
