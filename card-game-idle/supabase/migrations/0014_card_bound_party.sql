-- =============================================================================
-- 0014_card_bound_party.sql
-- Card-bound Co-op party backbone.
--
-- Adds:
--   party_sessions  - global party container (host + status + cap).
--   party_members   - roster with ready state.
--   party_invites   - invite handshake for party formation.
--   party_messages  - squad chat.
-- =============================================================================

create table if not exists public.party_sessions (
  id            uuid primary key default gen_random_uuid(),
  host_user     uuid not null references public.profiles(id) on delete cascade,
  status        text not null default 'active'
                  check (status in ('active', 'cancelled', 'finished')),
  max_members   int not null default 4 check (max_members between 2 and 4),
  participant_user_ids uuid[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists party_sessions_host_idx
  on public.party_sessions (host_user, created_at desc);

alter table public.party_sessions enable row level security;

drop policy if exists party_sessions_select on public.party_sessions;
create policy party_sessions_select
  on public.party_sessions for select
  to authenticated
  using (host_user = auth.uid() or auth.uid() = any(participant_user_ids));

drop policy if exists party_sessions_insert on public.party_sessions;
create policy party_sessions_insert
  on public.party_sessions for insert
  to authenticated
  with check (host_user = auth.uid());

drop policy if exists party_sessions_update on public.party_sessions;
create policy party_sessions_update
  on public.party_sessions for update
  to authenticated
  using (host_user = auth.uid() or auth.uid() = any(participant_user_ids))
  with check (host_user = auth.uid() or auth.uid() = any(participant_user_ids));


create table if not exists public.party_members (
  party_id     uuid not null references public.party_sessions(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role         text not null default 'member' check (role in ('host', 'member')),
  ready        boolean not null default false,
  joined_at    timestamptz not null default now(),
  primary key (party_id, user_id)
);

create index if not exists party_members_user_idx
  on public.party_members (user_id, joined_at desc);

alter table public.party_members enable row level security;

drop policy if exists party_members_select on public.party_members;
create policy party_members_select
  on public.party_members for select
  to authenticated
  using (exists (
    select 1 from public.party_sessions ps
    where ps.id = party_members.party_id and auth.uid() = any(ps.participant_user_ids)
  ));

drop policy if exists party_members_insert on public.party_members;
create policy party_members_insert
  on public.party_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.party_sessions ps
      where ps.id = party_members.party_id and (ps.host_user = auth.uid() or auth.uid() = any(ps.participant_user_ids))
    )
  );

drop policy if exists party_members_update on public.party_members;
create policy party_members_update
  on public.party_members for update
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.party_sessions ps
      where ps.id = party_members.party_id and (ps.host_user = auth.uid() or auth.uid() = any(ps.participant_user_ids))
    )
  )
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.party_sessions ps
      where ps.id = party_members.party_id and (ps.host_user = auth.uid() or auth.uid() = any(ps.participant_user_ids))
    )
  );

drop policy if exists party_members_delete on public.party_members;
create policy party_members_delete
  on public.party_members for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.party_sessions ps
      where ps.id = party_members.party_id and (ps.host_user = auth.uid() or auth.uid() = any(ps.participant_user_ids))
    )
  );


create table if not exists public.party_invites (
  id           uuid primary key default gen_random_uuid(),
  from_user    uuid not null references public.profiles(id) on delete cascade,
  to_user      uuid not null references public.profiles(id) on delete cascade,
  party_id     uuid not null references public.party_sessions(id) on delete cascade,
  status       text not null default 'pending'
                check (status in ('pending', 'accepted', 'declined', 'expired')),
  created_at   timestamptz not null default now()
);

create unique index if not exists party_invites_pending_unique_idx
  on public.party_invites (from_user, to_user, party_id)
  where status = 'pending';

create index if not exists party_invites_to_user_idx
  on public.party_invites (to_user, created_at desc);

alter table public.party_invites enable row level security;

drop policy if exists party_invites_select on public.party_invites;
create policy party_invites_select
  on public.party_invites for select
  to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());

drop policy if exists party_invites_insert on public.party_invites;
create policy party_invites_insert
  on public.party_invites for insert
  to authenticated
  with check (from_user = auth.uid());

drop policy if exists party_invites_update on public.party_invites;
create policy party_invites_update
  on public.party_invites for update
  to authenticated
  using (from_user = auth.uid() or to_user = auth.uid())
  with check (from_user = auth.uid() or to_user = auth.uid());


create table if not exists public.party_messages (
  id              uuid primary key default gen_random_uuid(),
  party_id        uuid not null references public.party_sessions(id) on delete cascade,
  from_user       uuid not null references public.profiles(id) on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now()
);

create index if not exists party_messages_party_idx
  on public.party_messages (party_id, created_at desc);

alter table public.party_messages enable row level security;

drop policy if exists party_messages_select on public.party_messages;
create policy party_messages_select
  on public.party_messages for select
  to authenticated
  using (exists (
    select 1 from public.party_members pm
    where pm.party_id = party_messages.party_id and pm.user_id = auth.uid()
  ));

drop policy if exists party_messages_insert on public.party_messages;
create policy party_messages_insert
  on public.party_messages for insert
  to authenticated
  with check (
    from_user = auth.uid()
    and exists (
      select 1 from public.party_members pm
      where pm.party_id = party_messages.party_id and pm.user_id = auth.uid()
    )
  );


-- Keep realtime in sync.
do $$
begin
  begin
    alter publication supabase_realtime add table public.party_sessions;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.party_members;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.party_invites;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.party_messages;
  exception when duplicate_object then null;
  end;
end $$;
