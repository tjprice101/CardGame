-- =============================================================================
-- 0023_party_five_member_cap.sql
-- Raise party cap to 5 players (host + up to 4 members).
-- =============================================================================

alter table if exists public.party_sessions
  alter column max_members set default 5;

alter table if exists public.party_sessions
  drop constraint if exists party_sessions_max_members_check;

alter table if exists public.party_sessions
  add constraint party_sessions_max_members_check
    check (max_members between 2 and 5);
