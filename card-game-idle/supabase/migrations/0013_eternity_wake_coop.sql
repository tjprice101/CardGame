-- =============================================================================
-- 0013_eternity_wake_coop.sql
-- Eternity's Wake Co-op Boss Fights (up to 3 total players).
--
-- Adds two tables:
--   eternity_wake_coop_sessions - host + invited members for one boss run.
--   eternity_wake_coop_invites  - invite handshake for party formation.
-- =============================================================================

-- ── eternity_wake_coop_sessions ─────────────────────────────────────────────

create table if not exists public.eternity_wake_coop_sessions (
  id                      uuid primary key default gen_random_uuid(),
  host_id                 uuid not null references public.profiles(id) on delete cascade,
  boss_id                 text not null,
  host_deck_id            text,
  status                  text not null default 'pending'
                            check (status in ('pending', 'active', 'finished', 'cancelled')),
  participant_count       int not null default 1 check (participant_count between 1 and 3),
  invited_user_ids        uuid[] not null default '{}',
  accepted_user_ids       uuid[] not null default '{}',
  started_at              timestamptz,
  finished_at             timestamptz,
  created_at              timestamptz not null default now(),
  constraint eternity_wake_coop_sessions_max_invites check (coalesce(array_length(invited_user_ids, 1), 0) <= 2),
  constraint eternity_wake_coop_sessions_max_accepts check (coalesce(array_length(accepted_user_ids, 1), 0) <= 2)
);

create index if not exists eternity_wake_coop_sessions_host_idx
  on public.eternity_wake_coop_sessions (host_id, created_at desc);

create index if not exists eternity_wake_coop_sessions_status_idx
  on public.eternity_wake_coop_sessions (status, created_at desc);

alter table public.eternity_wake_coop_sessions enable row level security;

drop policy if exists eternity_wake_coop_sessions_select on public.eternity_wake_coop_sessions;
create policy eternity_wake_coop_sessions_select
  on public.eternity_wake_coop_sessions for select
  to authenticated
  using (
    host_id = auth.uid()
    or auth.uid() = any(invited_user_ids)
    or auth.uid() = any(accepted_user_ids)
  );

drop policy if exists eternity_wake_coop_sessions_insert on public.eternity_wake_coop_sessions;
create policy eternity_wake_coop_sessions_insert
  on public.eternity_wake_coop_sessions for insert
  to authenticated
  with check (host_id = auth.uid());

drop policy if exists eternity_wake_coop_sessions_update on public.eternity_wake_coop_sessions;
create policy eternity_wake_coop_sessions_update
  on public.eternity_wake_coop_sessions for update
  to authenticated
  using (
    host_id = auth.uid()
    or auth.uid() = any(invited_user_ids)
    or auth.uid() = any(accepted_user_ids)
  )
  with check (
    host_id = auth.uid()
    or auth.uid() = any(invited_user_ids)
    or auth.uid() = any(accepted_user_ids)
  );


-- ── eternity_wake_coop_invites ──────────────────────────────────────────────

create table if not exists public.eternity_wake_coop_invites (
  id                      uuid primary key default gen_random_uuid(),
  from_user               uuid not null references public.profiles(id) on delete cascade,
  to_user                 uuid not null references public.profiles(id) on delete cascade,
  session_id              uuid references public.eternity_wake_coop_sessions(id) on delete cascade,
  boss_id                 text not null,
  host_deck_id            text,
  status                  text not null default 'pending'
                            check (status in ('pending', 'accepted', 'declined', 'expired')),
  created_at              timestamptz not null default now()
);

create index if not exists eternity_wake_coop_invites_to_user_idx
  on public.eternity_wake_coop_invites (to_user, created_at desc);

create unique index if not exists eternity_wake_coop_invites_pending_unique_idx
  on public.eternity_wake_coop_invites (from_user, to_user, boss_id)
  where status = 'pending';

alter table public.eternity_wake_coop_invites enable row level security;

drop policy if exists eternity_wake_coop_invites_select on public.eternity_wake_coop_invites;
create policy eternity_wake_coop_invites_select
  on public.eternity_wake_coop_invites for select
  to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());

drop policy if exists eternity_wake_coop_invites_insert on public.eternity_wake_coop_invites;
create policy eternity_wake_coop_invites_insert
  on public.eternity_wake_coop_invites for insert
  to authenticated
  with check (from_user = auth.uid());

drop policy if exists eternity_wake_coop_invites_update on public.eternity_wake_coop_invites;
create policy eternity_wake_coop_invites_update
  on public.eternity_wake_coop_invites for update
  to authenticated
  using (from_user = auth.uid() or to_user = auth.uid())
  with check (from_user = auth.uid() or to_user = auth.uid());


-- ── Realtime publication wiring ─────────────────────────────────────────────

do $$
begin
  begin
    alter publication supabase_realtime add table public.eternity_wake_coop_invites;
  exception
    when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.eternity_wake_coop_sessions;
  exception
    when duplicate_object then null;
  end;
end $$;
