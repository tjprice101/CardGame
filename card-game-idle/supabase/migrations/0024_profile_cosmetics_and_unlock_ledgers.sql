-- =============================================================================
-- Phase 24 — Profile cosmetics + unlock ledgers durability.
--
-- Persists additional profile-facing progression in `public.profiles` so these
-- values survive cross-device sign-in even before cloud save reconciliation.
-- =============================================================================

alter table public.profiles
  add column if not exists main_menu_background_id text,
  add column if not exists unlocked_avatar_ids jsonb not null default '[]'::jsonb,
  add column if not exists unlocked_ui_theme_ids jsonb not null default '[]'::jsonb;

update public.profiles
set main_menu_background_id = 'main-menu-bg-default'
where main_menu_background_id is null or btrim(main_menu_background_id) = '';

-- Keep arrays normalized to JSON arrays if legacy/manual edits left null/object values.
update public.profiles
set unlocked_avatar_ids = '[]'::jsonb
where unlocked_avatar_ids is null or jsonb_typeof(unlocked_avatar_ids) <> 'array';

update public.profiles
set unlocked_ui_theme_ids = '[]'::jsonb
where unlocked_ui_theme_ids is null or jsonb_typeof(unlocked_ui_theme_ids) <> 'array';
