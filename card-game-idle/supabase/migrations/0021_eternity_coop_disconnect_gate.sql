-- =============================================================================
-- 0021_eternity_coop_disconnect_gate.sql
-- Include disconnected users in co-op completion gating.
-- =============================================================================

alter table if exists public.eternity_wake_coop_sessions
  add column if not exists coop_disconnected_user_ids uuid[] not null default '{}';
