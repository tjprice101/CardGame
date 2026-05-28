-- Phase 8: signature cards on profiles.
--
-- Adds an optional array of up to 5 card definition IDs that a player can
-- showcase on their public profile (visible to friends via FriendProfileModal).
-- Apply via Supabase Dashboard SQL Editor or `supabase db push`.

alter table public.profiles
  add column if not exists signature_card_ids jsonb not null default '[]'::jsonb;
