-- =============================================================================
-- Phase 12 — Username auth mapping + profile durability fields.
--
-- Goals:
-- 1) Support username-first sign in while still using Supabase email auth.
-- 2) Keep profile identity data durable in DB across devices/sessions.
-- =============================================================================

alter table public.profiles
  add column if not exists login_username text,
  add column if not exists auth_email text;

-- Username policy: 3-24 chars, letters/digits/underscore only.
alter table public.profiles
  drop constraint if exists profiles_login_username_format_check;

alter table public.profiles
  add constraint profiles_login_username_format_check
  check (
    login_username is null
    or (
      char_length(login_username) between 3 and 24
      and login_username ~ '^[a-z0-9_]+$'
    )
  );

create unique index if not exists profiles_login_username_unique_idx
  on public.profiles(login_username)
  where login_username is not null;

create unique index if not exists profiles_auth_email_unique_idx
  on public.profiles(auth_email)
  where auth_email is not null;

-- Backfill missing auth_email from current auth.users records when possible.
update public.profiles p
set auth_email = u.email
from auth.users u
where p.id = u.id
  and p.auth_email is null
  and u.email is not null;

-- Backfill a stable username fallback from display_name + id suffix.
update public.profiles p
set login_username = lower(
  regexp_replace(p.display_name, '[^a-zA-Z0-9_]+', '_', 'g')
) || '_' || substr(replace(p.id::text, '-', ''), 1, 6)
where p.login_username is null;

-- Public resolver used for username sign-in bootstrap before auth session exists.
-- Returns the auth email for a valid username or null.
create or replace function public.resolve_login_email(p_login_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select auth_email
  from public.profiles
  where login_username = lower(trim(p_login_username))
  limit 1;
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;
