-- 0018_party_invitee_access.sql
--
-- Card-bound party invites are accepted client-side: the recipient does a
-- SELECT on party_sessions to confirm the party is still active, then upserts
-- themselves into party_members, then UPDATEs party_sessions.participant_user_ids.
--
-- The original 0014 RLS only allowed host + existing participants to SELECT /
-- UPDATE party_sessions and only existing participants to SELECT party_members.
-- That meant invitees got an RLS-filtered NULL when checking the session,
-- triggering the misleading "That party is no longer active." toast and
-- expiring their own valid invite.
--
-- This migration broadens those policies so that anyone holding a pending
-- invite to a party can:
--   * SELECT that party_session row
--   * SELECT the party_members of that session
--   * UPDATE participant_user_ids on that session (only while they hold the
--     pending invite — once accepted/expired, normal participant rules apply)
--
-- Insert / delete / status-change policies on party_sessions are intentionally
-- left unchanged; only host or current participants can touch those.

-- party_sessions: allow SELECT when the caller has a pending invite to it.
drop policy if exists party_sessions_select on public.party_sessions;
create policy party_sessions_select
  on public.party_sessions for select
  to authenticated
  using (
    host_user = auth.uid()
    or auth.uid() = any(participant_user_ids)
    or exists (
      select 1 from public.party_invites pi
      where pi.party_id = party_sessions.id
        and pi.to_user = auth.uid()
        and pi.status = 'pending'
    )
  );

-- party_sessions: allow UPDATE of participant_user_ids by an invitee accepting
-- their pending invite. Existing host/participant rules retained.
drop policy if exists party_sessions_update on public.party_sessions;
create policy party_sessions_update
  on public.party_sessions for update
  to authenticated
  using (
    host_user = auth.uid()
    or auth.uid() = any(participant_user_ids)
    or exists (
      select 1 from public.party_invites pi
      where pi.party_id = party_sessions.id
        and pi.to_user = auth.uid()
        and pi.status = 'pending'
    )
  )
  with check (
    host_user = auth.uid()
    or auth.uid() = any(participant_user_ids)
    or exists (
      select 1 from public.party_invites pi
      where pi.party_id = party_sessions.id
        and pi.to_user = auth.uid()
        and pi.status in ('pending', 'accepted')
    )
  );

-- party_members: allow SELECT when the caller has a pending invite to the
-- party (so they can count current members before joining).
drop policy if exists party_members_select on public.party_members;
create policy party_members_select
  on public.party_members for select
  to authenticated
  using (
    exists (
      select 1 from public.party_sessions ps
      where ps.id = party_members.party_id
        and (ps.host_user = auth.uid() or auth.uid() = any(ps.participant_user_ids))
    )
    or exists (
      select 1 from public.party_invites pi
      where pi.party_id = party_members.party_id
        and pi.to_user = auth.uid()
        and pi.status = 'pending'
    )
  );
