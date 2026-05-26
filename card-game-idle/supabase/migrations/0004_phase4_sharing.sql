-- =============================================================================
-- Phase 4 — Profile sharing, deck sharing, gifting.
--
-- Profile and deck sharing piggyback on Phase 3 dm_messages.attachment_json
-- (no new tables required). This migration adds the `gifts` table for
-- friend-to-friend gifting of card copies. Gift rows are server-canonical:
-- a sender INSERTs one, the recipient UPDATEs status to 'claimed', and the
-- client mirrors the change into its local save.
-- =============================================================================

create type gift_status as enum ('pending', 'claimed', 'declined', 'expired');

create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  -- Discriminator string; today only 'card_copy', but reserved for future kinds.
  kind text not null check (kind in ('card_copy')),
  -- Validated client-side; for 'card_copy' payload is:
  --   { definitionId: string, finish: 'normal' | 'holo', count: 1..4, note?: string }
  payload jsonb not null,
  status gift_status not null default 'pending',
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  constraint gifts_no_self check (sender_id <> recipient_id)
);

create index gifts_recipient_pending_idx on public.gifts (recipient_id, created_at desc)
  where status = 'pending';
create index gifts_sender_idx on public.gifts (sender_id, created_at desc);

alter table public.gifts enable row level security;

-- Sender or recipient can read a gift row.
create policy gifts_select_participants on public.gifts
  for select using (
    auth.uid() = sender_id or auth.uid() = recipient_id
  );

-- Sender may INSERT a gift only when:
--   * they ARE the sender,
--   * recipient is an accepted friend (in either direction),
--   * neither party has blocked the other,
--   * status is 'pending' on insert.
create policy gifts_insert_sender on public.gifts
  for insert with check (
    auth.uid() = sender_id
    and status = 'pending'
    and exists (
      select 1 from public.friend_requests fr
      where fr.status = 'accepted'
        and (
          (fr.from_user = auth.uid() and fr.to_user = recipient_id)
          or (fr.from_user = recipient_id and fr.to_user = auth.uid())
        )
    )
    and not exists (
      select 1 from public.blocks b
      where (b.blocker = auth.uid() and b.blocked = recipient_id)
         or (b.blocker = recipient_id and b.blocked = auth.uid())
    )
  );

-- Recipient may UPDATE a pending gift to set status to 'claimed' or 'declined'.
create policy gifts_update_recipient on public.gifts
  for update using (
    auth.uid() = recipient_id
  ) with check (
    auth.uid() = recipient_id
    and status in ('claimed', 'declined')
  );

-- Stamp claimed_at automatically when status transitions to 'claimed'.
create or replace function public.gifts_stamp_claimed_at()
returns trigger
language plpgsql
as $$
begin
  if NEW.status = 'claimed' and OLD.status <> 'claimed' then
    NEW.claimed_at := now();
  end if;
  return NEW;
end;
$$;

create trigger gifts_stamp_claimed_at_t
before update on public.gifts
for each row execute function public.gifts_stamp_claimed_at();
