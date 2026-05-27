// Friends store — Phase 2.
//
// Separate from socialStore (auth) to keep concerns small. Depends on the
// authenticated user id from socialStore. All selectors return primitives or
// stable references so they cooperate with Zustand v5's snapshot cache.

import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '@/net/supabaseClient';
import { useSocialStore } from '@/state/socialStore';

export interface FriendProfileLite {
  id: string;
  friendCode: string;
  displayName: string;
  bio: string | null;
  avatarId: string;
  titleId: string | null;
  uiThemeId: string | null;
  lastSeenAt: string | null;
}

export interface FriendRequestRow {
  fromUser: string;
  toUser: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
  // Hydrated profile for the *other* party in the relationship.
  other: FriendProfileLite;
}

interface FriendsState {
  loaded: boolean;
  loading: boolean;
  errorMessage: string | null;

  friends: FriendRequestRow[];
  incoming: FriendRequestRow[];
  outgoing: FriendRequestRow[];
  blocked: FriendProfileLite[];

  // userId -> online (from presence channel).
  presence: Readonly<Record<string, boolean>>;

  load: () => Promise<void>;
  sendRequestByFriendCode: (friendCode: string) => Promise<void>;
  acceptRequest: (fromUserId: string) => Promise<void>;
  declineRequest: (fromUserId: string) => Promise<void>;
  cancelOutgoing: (toUserId: string) => Promise<void>;
  unfriend: (otherUserId: string) => Promise<void>;
  blockUser: (targetUserId: string) => Promise<void>;
  unblockUser: (targetUserId: string) => Promise<void>;
  connectPresence: () => void;
  disconnectPresence: () => void;
}

const EMPTY_ARRAY = Object.freeze<never[]>([]);
const EMPTY_PRESENCE: Readonly<Record<string, boolean>> = Object.freeze({});

let realtimeChannel: RealtimeChannel | null = null;
let presenceChannel: RealtimeChannel | null = null;

function rowToProfile(row: {
  id: string;
  friend_code: string;
  display_name: string;
  bio?: string | null;
  avatar_id: string;
  title_id: string | null;
  ui_theme_id: string | null;
  last_seen_at: string | null;
}): FriendProfileLite {
  return {
    id: row.id,
    friendCode: row.friend_code,
    displayName: row.display_name,
    bio: row.bio ?? null,
    avatarId: row.avatar_id,
    titleId: row.title_id,
    uiThemeId: row.ui_theme_id,
    lastSeenAt: row.last_seen_at,
  };
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  loaded: false,
  loading: false,
  errorMessage: null,
  friends: EMPTY_ARRAY as FriendRequestRow[],
  incoming: EMPTY_ARRAY as FriendRequestRow[],
  outgoing: EMPTY_ARRAY as FriendRequestRow[],
  blocked: EMPTY_ARRAY as FriendProfileLite[],
  presence: EMPTY_PRESENCE,

  async load() {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return;
    set({ loading: true, errorMessage: null });
    try {
      // Pull every friend_request row I'm part of, with the *other* party's profile
      // hydrated via two FK joins. RLS already restricts to my rows.
      const { data: reqs, error: reqErr } = await sb
        .from('friend_requests')
        .select(`
          from_user, to_user, status, created_at, updated_at,
          from_profile:profiles!friend_requests_from_user_fkey (
            id, friend_code, display_name, avatar_id, title_id, ui_theme_id, last_seen_at
          ),
          to_profile:profiles!friend_requests_to_user_fkey (
            id, friend_code, display_name, avatar_id, title_id, ui_theme_id, last_seen_at
          )
        `);
      if (reqErr) throw reqErr;

      const friends: FriendRequestRow[] = [];
      const incoming: FriendRequestRow[] = [];
      const outgoing: FriendRequestRow[] = [];
      for (const r of (reqs ?? []) as Array<{
        from_user: string;
        to_user: string;
        status: 'pending' | 'accepted' | 'declined';
        created_at: string;
        updated_at: string;
        from_profile: Parameters<typeof rowToProfile>[0] | null;
        to_profile: Parameters<typeof rowToProfile>[0] | null;
      }>) {
        const iAmFrom = r.from_user === me;
        const otherRow = iAmFrom ? r.to_profile : r.from_profile;
        if (!otherRow) continue;
        const row: FriendRequestRow = {
          fromUser: r.from_user,
          toUser: r.to_user,
          status: r.status,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          other: rowToProfile(otherRow),
        };
        if (row.status === 'accepted') friends.push(row);
        else if (row.status === 'pending' && iAmFrom) outgoing.push(row);
        else if (row.status === 'pending' && !iAmFrom) incoming.push(row);
      }

      const { data: blocks, error: blockErr } = await sb
        .from('blocks')
        .select(`
          blocked,
          blocked_profile:profiles!blocks_blocked_fkey (
            id, friend_code, display_name, avatar_id, title_id, ui_theme_id, last_seen_at
          )
        `);
      if (blockErr) throw blockErr;

      const blocked: FriendProfileLite[] = ((blocks ?? []) as Array<{
        blocked_profile: Parameters<typeof rowToProfile>[0] | null;
      }>)
        .map(b => b.blocked_profile)
        .filter((p): p is Parameters<typeof rowToProfile>[0] => p !== null)
        .map(rowToProfile);

      set({ friends, incoming, outgoing, blocked, loaded: true, loading: false });
      ensureFriendsRealtime();
    } catch (err) {
      set({ loading: false, errorMessage: messageOf(err) });
    }
  },

  async sendRequestByFriendCode(friendCode) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) throw new Error('Not signed in.');
    const code = friendCode.trim().toUpperCase();
    if (code.length !== 8) throw new Error('Friend codes are 8 characters.');
    const myProfile = useSocialStore.getState().profile;
    if (myProfile && code === myProfile.friendCode) {
      throw new Error("That's your own friend code.");
    }
    const { data: target, error: lookupErr } = await sb
      .from('profiles')
      .select('id, friend_code, display_name')
      .eq('friend_code', code)
      .maybeSingle();
    if (lookupErr) throw lookupErr;
    if (!target) throw new Error('No player with that friend code.');

    // If there is an existing reverse pending request (they sent first), accept it.
    const { data: reverse } = await sb
      .from('friend_requests')
      .select('from_user, to_user, status')
      .eq('from_user', target.id)
      .eq('to_user', me)
      .maybeSingle();
    if (reverse) {
      if (reverse.status === 'accepted') return; // already friends
      const { error: accErr } = await sb
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('from_user', target.id)
        .eq('to_user', me);
      if (accErr) throw accErr;
    } else {
      const { error: insErr } = await sb
        .from('friend_requests')
        .insert({ from_user: me, to_user: target.id, status: 'pending' });
      if (insErr) {
        // Unique-violation = request already exists.
        if (insErr.code === '23505') throw new Error('A request to that player already exists.');
        throw insErr;
      }
    }
    await get().load();
  },

  async acceptRequest(fromUserId) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return;
    const { error } = await sb
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('from_user', fromUserId)
      .eq('to_user', me);
    if (error) { set({ errorMessage: messageOf(error) }); return; }
    await get().load();
  },

  async declineRequest(fromUserId) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return;
    const { error } = await sb
      .from('friend_requests')
      .delete()
      .eq('from_user', fromUserId)
      .eq('to_user', me);
    if (error) { set({ errorMessage: messageOf(error) }); return; }
    await get().load();
  },

  async cancelOutgoing(toUserId) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return;
    const { error } = await sb
      .from('friend_requests')
      .delete()
      .eq('from_user', me)
      .eq('to_user', toUserId);
    if (error) { set({ errorMessage: messageOf(error) }); return; }
    await get().load();
  },

  async unfriend(otherUserId) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return;
    // Friendship may live on either ordering of the pair.
    const { error } = await sb
      .from('friend_requests')
      .delete()
      .or(
        `and(from_user.eq.${me},to_user.eq.${otherUserId}),` +
        `and(from_user.eq.${otherUserId},to_user.eq.${me})`,
      );
    if (error) { set({ errorMessage: messageOf(error) }); return; }
    await get().load();
  },

  async blockUser(targetUserId) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return;
    // Drop any existing friendship/requests in both directions, then insert block.
    await sb.from('friend_requests').delete().or(
      `and(from_user.eq.${me},to_user.eq.${targetUserId}),` +
      `and(from_user.eq.${targetUserId},to_user.eq.${me})`,
    );
    const { error } = await sb
      .from('blocks')
      .insert({ blocker: me, blocked: targetUserId });
    if (error && error.code !== '23505') { set({ errorMessage: messageOf(error) }); return; }
    await get().load();
  },

  async unblockUser(targetUserId) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return;
    const { error } = await sb
      .from('blocks')
      .delete()
      .eq('blocker', me)
      .eq('blocked', targetUserId);
    if (error) { set({ errorMessage: messageOf(error) }); return; }
    await get().load();
  },

  connectPresence() {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me || presenceChannel) return;
    const channel = sb.channel('presence:lobby', {
      config: { presence: { key: me } },
    });
    channel.on('presence', { event: 'sync' }, () => {
      const stateMap = channel.presenceState();
      const next: Record<string, boolean> = {};
      for (const key of Object.keys(stateMap)) next[key] = true;
      set({ presence: Object.freeze(next) });
    });
    channel.subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ at: Date.now() });
      }
    });
    presenceChannel = channel;
  },

  disconnectPresence() {
    const sb = getSupabase();
    if (presenceChannel && sb) {
      void sb.removeChannel(presenceChannel);
      presenceChannel = null;
      set({ presence: EMPTY_PRESENCE });
    }
  },
}));

// Subscribe to friend_requests + blocks changes so any inbound action triggers a refresh.
// Idempotent — re-calling load() sets up exactly one channel.
function ensureFriendsRealtime() {
  const sb = getSupabase();
  if (!sb || realtimeChannel) return;
  realtimeChannel = sb
    .channel('friends-graph')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => {
      void useFriendsStore.getState().load();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'blocks' }, () => {
      void useFriendsStore.getState().load();
    })
    .subscribe();
}

function messageOf(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message);
  if (typeof err === 'string') return err;
  return 'Unknown error';
}

// Stable selectors.
export const selectFriendsList = (s: FriendsState) => s.friends;
export const selectIncomingRequests = (s: FriendsState) => s.incoming;
export const selectOutgoingRequests = (s: FriendsState) => s.outgoing;
export const selectBlockedList = (s: FriendsState) => s.blocked;
export const selectFriendsPresence = (s: FriendsState) => s.presence;
export const selectFriendsLoaded = (s: FriendsState) => s.loaded;
export const selectFriendsError = (s: FriendsState) => s.errorMessage;
