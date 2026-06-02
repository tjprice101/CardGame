-- Add the remaining social tables to the supabase_realtime publication so
-- friend-request, block, and gift events deliver live to clients without a
-- manual reload. Mirrors the pattern from 0015_realtime_dm.sql.
--
-- Without this migration the realtime listeners in
--   src/social/notificationsService.ts  (friendChannel, giftChannel)
--   src/state/friendsStore.ts            (ensureFriendsRealtime)
-- silently never fire and the only way to see an incoming invite/gift is to
-- close and reopen the Friends panel.
--
-- Safe to run multiple times.

do $$
begin
  begin
    alter publication supabase_realtime add table public.friend_requests;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.blocks;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.gifts;
  exception when duplicate_object then null;
  end;
end $$;

-- REPLICA IDENTITY FULL is required for filtered subscriptions
-- (e.g. to_user=eq.<me>) to receive payloads on UPDATE/DELETE events.
alter table public.friend_requests replica identity full;
alter table public.blocks          replica identity full;
alter table public.gifts           replica identity full;
