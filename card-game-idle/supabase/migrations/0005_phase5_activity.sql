-- =============================================================================
-- Phase 5 — Activity feed.
--
-- profile_stats already exists from 0001_phase1_profiles.sql with friend-
-- leaderboard-friendly columns (gauntlet_best_depth, gauntlet_best_shards,
-- gauntlet_runs, eternity_clears, infinite_pulls). This migration only adds
-- the activity_events stream for friend visibility.
-- =============================================================================

create table public.activity_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  -- Discriminator. New kinds can be added without a schema change.
  kind text not null check (kind in (
    'boss_clear',
    'infinite_pull',
    'gauntlet_best',
    'set_completion',
    'title_unlocked'
  )),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activity_events_user_created_idx
  on public.activity_events (user_id, created_at desc);

alter table public.activity_events enable row level security;

-- Friend-visible feed: a row is selectable by its owner OR by anyone who has
-- an *accepted* friend_requests row with the owner in either direction.
-- Blocks override: if either party blocked the other, neither sees the event.
create policy activity_events_select_friends on public.activity_events
  for select using (
    auth.uid() = user_id
    or (
      exists (
        select 1 from public.friend_requests fr
        where fr.status = 'accepted'
          and (
            (fr.from_user = auth.uid() and fr.to_user = activity_events.user_id)
            or (fr.from_user = activity_events.user_id and fr.to_user = auth.uid())
          )
      )
      and not exists (
        select 1 from public.blocks b
        where (b.blocker = auth.uid() and b.blocked = activity_events.user_id)
           or (b.blocker = activity_events.user_id and b.blocked = auth.uid())
      )
    )
  );

create policy activity_events_insert_own on public.activity_events
  for insert with check (
    auth.uid() = user_id
  );

-- No client-side UPDATE or DELETE. Events are append-only.
