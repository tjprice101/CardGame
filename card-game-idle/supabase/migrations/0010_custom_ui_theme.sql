-- Phase 10: persist custom UI palette overrides per account profile.
--
-- Stores optional JSON payload keyed by UiPalette fields, allowing a signed-in
-- player to keep their personalized UI colors across devices.

alter table public.profiles
  add column if not exists custom_ui_theme jsonb;
