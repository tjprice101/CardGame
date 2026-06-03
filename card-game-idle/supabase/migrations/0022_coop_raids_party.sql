-- =============================================================================
-- 0022_coop_raids_party.sql
-- Expand co-op null raids to host + up to 4 additional participants.
-- =============================================================================

alter table if exists public.coop_raid_sessions
  add column if not exists invited_user_ids uuid[] not null default '{}',
  add column if not exists accepted_user_ids uuid[] not null default '{}',
  add column if not exists participant_count int not null default 1,
  add column if not exists per_user_progress jsonb not null default '{}'::jsonb,
  add column if not exists coop_disconnected_user_ids uuid[] not null default '{}';

alter table if exists public.coop_raid_sessions
  drop constraint if exists coop_raid_sessions_participant_count_check;

alter table if exists public.coop_raid_sessions
  add constraint coop_raid_sessions_participant_count_check
    check (participant_count between 1 and 5);

alter table if exists public.coop_raid_sessions
  drop constraint if exists coop_raid_sessions_max_invites;

alter table if exists public.coop_raid_sessions
  add constraint coop_raid_sessions_max_invites
    check (coalesce(array_length(invited_user_ids, 1), 0) <= 4);

alter table if exists public.coop_raid_sessions
  drop constraint if exists coop_raid_sessions_max_accepts;

alter table if exists public.coop_raid_sessions
  add constraint coop_raid_sessions_max_accepts
    check (coalesce(array_length(accepted_user_ids, 1), 0) <= 4);

drop policy if exists coop_raid_sessions_select on public.coop_raid_sessions;
create policy coop_raid_sessions_select
  on public.coop_raid_sessions for select
  to authenticated
  using (
    host_id = auth.uid()
    or guest_id = auth.uid()
    or auth.uid() = any(invited_user_ids)
    or auth.uid() = any(accepted_user_ids)
  );

drop policy if exists coop_raid_sessions_update on public.coop_raid_sessions;
create policy coop_raid_sessions_update
  on public.coop_raid_sessions for update
  to authenticated
  using (
    host_id = auth.uid()
    or guest_id = auth.uid()
    or auth.uid() = any(invited_user_ids)
    or auth.uid() = any(accepted_user_ids)
  )
  with check (
    host_id = auth.uid()
    or guest_id = auth.uid()
    or auth.uid() = any(invited_user_ids)
    or auth.uid() = any(accepted_user_ids)
  );

create or replace function public.can_access_coop_session(session_uuid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.coop_raid_sessions crs
    where crs.id = session_uuid
      and (
        crs.host_id = auth.uid()
        or crs.guest_id = auth.uid()
        or auth.uid() = any(crs.invited_user_ids)
        or auth.uid() = any(crs.accepted_user_ids)
      )
  )
  or exists (
    select 1
    from public.eternity_wake_coop_sessions ewcs
    where ewcs.id = session_uuid
      and (
        ewcs.host_id = auth.uid()
        or auth.uid() = any(ewcs.invited_user_ids)
        or auth.uid() = any(ewcs.accepted_user_ids)
      )
  )
  or exists (
    select 1
    from public.party_sessions ps
    where ps.id = session_uuid
      and (ps.host_user = auth.uid() or auth.uid() = any(ps.participant_user_ids))
  );
$$;
