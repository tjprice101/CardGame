-- =============================================================================
-- Phase 11 — Cloud save ownership.
--
-- Stores each player's canonical save envelope in Supabase so signing in can
-- hydrate progress across devices. The payload is the exported PANTHEON1 text,
-- preserving signed-envelope integrity and migration compatibility.
-- =============================================================================

create table if not exists public.cloud_saves (
  user_id        uuid primary key references public.profiles(id) on delete cascade,
  payload_export text not null,
  saved_at_ms    bigint not null default 0,
  updated_at     timestamptz not null default now(),
  check (saved_at_ms >= 0)
);

create index if not exists cloud_saves_saved_at_idx on public.cloud_saves(saved_at_ms desc);

alter table public.cloud_saves enable row level security;

drop policy if exists cloud_saves_select_own on public.cloud_saves;
create policy cloud_saves_select_own
  on public.cloud_saves for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists cloud_saves_insert_own on public.cloud_saves;
create policy cloud_saves_insert_own
  on public.cloud_saves for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists cloud_saves_update_own on public.cloud_saves;
create policy cloud_saves_update_own
  on public.cloud_saves for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- No client-side delete. Sign-out should keep canonical progress in cloud.
