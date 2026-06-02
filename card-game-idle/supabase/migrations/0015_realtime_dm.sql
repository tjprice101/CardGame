-- Enable Supabase Realtime for the direct-message tables so that both
-- participants in a chat thread receive live message-insert events without
-- needing to poll.  The publication must include each table explicitly.
-- Safe to run multiple times (DO $$ EXCEPTION block avoids duplicate-member errors).

do $$
begin
  -- dm_messages: deliver INSERT events so both sender and recipient see new messages live.
  begin
    alter publication supabase_realtime add table public.dm_messages;
  exception when duplicate_object then null;
  end;

  -- dm_threads: deliver UPDATE events (last_message_at touch) so unread badges refresh.
  begin
    alter publication supabase_realtime add table public.dm_threads;
  exception when duplicate_object then null;
  end;
end $$;

-- Ensure REPLICA IDENTITY FULL so realtime can deliver the full row in change payloads.
-- Without this, filtered subscriptions (thread_id=eq.X) may silently receive no events.
alter table public.dm_messages replica identity full;
alter table public.dm_threads  replica identity full;
