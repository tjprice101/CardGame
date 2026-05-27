-- Phase 6: player bio field on profiles.
--
-- Adds an optional short bio (max 200 chars) to the profiles table.
-- Visible to friends via the friend profile modal.
-- Apply via Supabase Dashboard SQL Editor or `supabase db push`.

alter table public.profiles
  add column if not exists bio text check (char_length(bio) <= 200);
