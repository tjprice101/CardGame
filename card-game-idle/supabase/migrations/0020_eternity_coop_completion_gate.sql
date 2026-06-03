-- =============================================================================
-- 0020_eternity_coop_completion_gate.sql
-- Co-op completion gate state for shared Eternity boss fail conditions.
-- =============================================================================

alter table if exists public.eternity_wake_coop_sessions
  add column if not exists coop_end_turn_user_ids uuid[] not null default '{}',
  add column if not exists coop_hand_empty_user_ids uuid[] not null default '{}';
