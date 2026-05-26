-- Phase 1: identity + own profile mirror.
--
-- Apply via Supabase Dashboard SQL Editor, or `supabase db push` if the CLI is wired up.
-- All rows tie to auth.users(id); RLS lets anyone read public profile fields but only the
-- owner can mutate their own row.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  friend_code   text not null unique check (char_length(friend_code) = 8),
  display_name  text not null check (char_length(display_name) between 1 and 24),
  avatar_id     text not null default 'avatar-acolyte',
  title_id      text,
  ui_theme_id   text,
  last_seen_at  timestamptz default now(),
  created_at    timestamptz not null default now()
);

create index if not exists profiles_friend_code_idx on public.profiles(friend_code);

create table if not exists public.profile_stats (
  user_id              uuid primary key references public.profiles(id) on delete cascade,
  gauntlet_best_depth  int not null default 0,
  gauntlet_best_shards int not null default 0,
  gauntlet_runs        int not null default 0,
  eternity_clears      jsonb not null default '{}'::jsonb,
  infinite_pulls       int not null default 0,
  updated_at           timestamptz not null default now()
);

alter table public.profiles      enable row level security;
alter table public.profile_stats enable row level security;

-- Profile readability: any authenticated user can read public profile fields.
-- (Direct messages and friend graph add stricter visibility in later phases.)
drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- profile_stats: readable by anyone authenticated (needed for friend leaderboards in Phase 5);
-- only the owner can upsert/update their row.
drop policy if exists profile_stats_select_authenticated on public.profile_stats;
create policy profile_stats_select_authenticated
  on public.profile_stats for select
  to authenticated
  using (true);

drop policy if exists profile_stats_upsert_own on public.profile_stats;
create policy profile_stats_upsert_own
  on public.profile_stats for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists profile_stats_update_own on public.profile_stats;
create policy profile_stats_update_own
  on public.profile_stats for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
