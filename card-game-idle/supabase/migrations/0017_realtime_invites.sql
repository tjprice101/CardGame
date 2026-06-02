-- Realtime hardening for invite + session + party-messages tables.
--
-- Symptom this fixes: a sender successfully inserts an invite row (party,
-- co-op raid, or Eternity's Wake co-op) and sees their own optimistic toast,
-- but the recipient never receives any realtime payload — so the in-app
-- invite modal/toast never pops on the other side. Same root cause as
-- 0016_realtime_social.sql (friend_requests/blocks/gifts):
--
--   Filtered Supabase Realtime subscriptions (e.g. filter `to_user=eq.<me>`)
--   require BOTH publication membership AND `replica identity full` on the
--   underlying table. Otherwise the WAL row lacks enough information to
--   evaluate RLS for delivery and the event is silently dropped.
--
-- 0009_coop_raids.sql, 0013_eternity_wake_coop.sql, and 0014_card_bound_party.sql
-- added these tables to `supabase_realtime` but never set REPLICA IDENTITY FULL.
-- This migration backfills that, and idempotently re-asserts publication
-- membership for safety.
--
-- Safe to run multiple times.

do $$
begin
  -- Co-op raid (Null Raid)
  begin
    alter publication supabase_realtime add table public.coop_raid_invites;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.coop_raid_sessions;
  exception when duplicate_object then null;
  end;

  -- Eternity's Wake co-op boss
  begin
    alter publication supabase_realtime add table public.eternity_wake_coop_invites;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.eternity_wake_coop_sessions;
  exception when duplicate_object then null;
  end;

  -- Card-bound party
  begin
    alter publication supabase_realtime add table public.party_invites;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.party_sessions;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.party_members;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.party_messages;
  exception when duplicate_object then null;
  end;
end $$;

-- REPLICA IDENTITY FULL is the actual fix — required for filtered
-- subscriptions (`to_user=eq.<me>`, `host_id=eq.<me>`, etc.) to receive
-- payloads at all.
alter table public.coop_raid_invites           replica identity full;
alter table public.coop_raid_sessions          replica identity full;
alter table public.eternity_wake_coop_invites  replica identity full;
alter table public.eternity_wake_coop_sessions replica identity full;
alter table public.party_invites               replica identity full;
alter table public.party_sessions              replica identity full;
alter table public.party_members               replica identity full;
alter table public.party_messages              replica identity full;
