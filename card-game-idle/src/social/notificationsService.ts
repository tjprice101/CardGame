// Social notifications service — Phase 6.
//
// Always-on (when authenticated) subscriber for:
//   • new direct messages,
//   • new pending gifts,
//   • new pending friend requests.
//
// On each delivery we surface an in-app toast and, when the desktop window is
// unfocused, an OS-level notification via the Electron preload bridge
// (`window.pantheonNotify`). Falls back gracefully when running in a browser
// build (no Electron) — only the in-app toast fires.
//
// Always-on means the user gets pinged even when the relevant panel
// (chat/friends) hasn't been opened yet, which is the whole point of "push"
// notifications versus the per-store realtime channels that only run while
// their UI is mounted.

import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '@/net/supabaseClient';
import { useSocialStore } from '@/state/socialStore';
import { useMessagesStore, ingestIncomingDmRow } from '@/state/messagesStore';
import { useFriendsStore } from '@/state/friendsStore';
import { useGiftsStore } from '@/state/giftsStore';
import { useStore } from '@/state/store';
import { useBattlegroundStore } from '@/state/battlegroundStore';
import { useCoopRaidStore } from '@/state/coopRaidStore';
import { useEternityBossCoopStore } from '@/state/eternityBossCoopStore';

const PREF_KEY = 'pantheon.social.notifications.v1';

// ── Preferences ─────────────────────────────────────────────────────────────

interface NotifPrefs {
  dms: boolean;
  gifts: boolean;
  friendRequests: boolean;
  osNotificationsWhenUnfocused: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  dms: true,
  gifts: true,
  friendRequests: true,
  osNotificationsWhenUnfocused: true,
};

function loadPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<NotifPrefs>;
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(p: NotifPrefs): void {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

let prefs = loadPrefs();

export function getNotificationPrefs(): NotifPrefs {
  return { ...prefs };
}

export function updateNotificationPrefs(patch: Partial<NotifPrefs>): void {
  prefs = { ...prefs, ...patch };
  savePrefs(prefs);
}

// ── State ───────────────────────────────────────────────────────────────────

let installed = false;
let dmChannel: RealtimeChannel | null = null;
let giftChannel: RealtimeChannel | null = null;
let friendChannel: RealtimeChannel | null = null;
let coopInviteChannel: RealtimeChannel | null = null;
let eternityBossInviteChannel: RealtimeChannel | null = null;
let unsubscribeAuth: (() => void) | null = null;

// Cache for sender name lookups so we don't refetch profiles for every DM.
const profileNameCache = new Map<string, string>();
async function resolveDisplayName(userId: string): Promise<string> {
  const cached = profileNameCache.get(userId);
  if (cached) return cached;
  const sb = getSupabase();
  if (!sb) return 'Someone';
  const { data } = await sb
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .maybeSingle();
  const name = (data?.display_name as string | undefined) ?? 'Someone';
  profileNameCache.set(userId, name);
  return name;
}

// ── Delivery ────────────────────────────────────────────────────────────────

function isWindowFocused(): boolean {
  // Prefer the Electron bridge — it tracks the real OS focus state, not just
  // document focus (which can lie when the renderer is paused).
  const native = window.pantheonNotify?.isFocused?.();
  if (typeof native === 'boolean') return native;
  return typeof document !== 'undefined' && document.hasFocus();
}

function deliver(
  toastMessage: string,
  toastKind: 'info' | 'success' | 'warning' | 'reward',
  osTitle: string,
  osBody: string,
): void {
  try {
    useStore.getState().enqueueToast(toastMessage, toastKind, 5000);
  } catch { /* toast queue not ready */ }

  if (!prefs.osNotificationsWhenUnfocused) return;
  if (isWindowFocused()) return;
  void window.pantheonNotify?.show({ title: osTitle, body: osBody });
}

// ── Channel wiring ──────────────────────────────────────────────────────────

interface DmRow {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

interface GiftRow {
  id: string;
  from_user: string;
  to_user: string;
  status: string;
}

interface FriendRequestRow {
  from_user: string;
  to_user: string;
  status: string;
}

interface CoopRaidInviteRow {
  from_user: string;
  to_user: string;
  raid_id: string;
  status: string;
}

interface EternityBossInviteRow {
  from_user: string;
  to_user: string;
  boss_id: string;
  status: string;
}

function syncIncomingDm(row: DmRow): void {
  ingestIncomingDmRow({
    id: row.id,
    thread_id: row.thread_id,
    sender_id: row.sender_id,
    body: row.body,
    attachment_json: null,
    created_at: row.created_at,
  });
}

function connectChannels(): void {
  const sb = getSupabase();
  const me = useSocialStore.getState().user?.id;
  if (!sb || !me) return;

  if (!dmChannel) {
    dmChannel = sb
      .channel(`notify:dm:${me}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dm_messages' },
        (payload) => {
          const row = payload.new as DmRow;
          // RLS already restricts to my threads, but skip my own sends — those
          // are handled by the optimistic update + per-thread subscription in
          // messagesStore.sendMessage.
          if (row.sender_id === me) return;

          // Always-on state sync: keep messagesStore current even when the
          // chat panel is closed or pointed at a different thread, so unread
          // badges update and re-opening the conversation is instant.
          syncIncomingDm(row);

          if (!prefs.dms) return;
          // If the chat window is currently open on this thread AND focused,
          // skip the notification — the user is already reading it.
          const openThread = useMessagesStore.getState().openThreadId;
          if (openThread === row.thread_id && isWindowFocused()) return;
          void resolveDisplayName(row.sender_id).then((name) => {
            const preview = row.body.length > 80 ? `${row.body.slice(0, 80)}…` : row.body;
            deliver(
              `New message from ${name}`,
              'info',
              `${name} sent you a message`,
              preview,
            );
          });
        },
      )
      .subscribe((status, err) => {
        console.log(`[notify:dm] channel status: ${status}`, err ?? '');
      });
  }

  if (!giftChannel) {
    giftChannel = sb
      .channel(`notify:gifts:${me}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'gifts' },
        (payload) => {
          if (!prefs.gifts) return;
          const row = payload.new as GiftRow;
          if (row.to_user !== me) return;
          if (row.status !== 'pending') return;
          void resolveDisplayName(row.from_user).then((name) => {
            deliver(
              `${name} sent you a gift`,
              'reward',
              'New gift received',
              `${name} sent you a gift. Open the Friends panel to claim it.`,
            );
          });
        },
      )
      .subscribe((status, err) => {
        console.log(`[notify:gifts] channel status: ${status}`, err ?? '');
      });
  }

  if (!friendChannel) {
    friendChannel = sb
      .channel(`notify:friends:${me}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'friend_requests' },
        (payload) => {
          if (!prefs.friendRequests) return;
          const row = payload.new as FriendRequestRow;
          if (row.to_user !== me) return;
          if (row.status !== 'pending') return;
          void resolveDisplayName(row.from_user).then((name) => {
            deliver(
              `${name} sent you a friend request`,
              'info',
              'New friend request',
              `${name} wants to add you as a friend.`,
            );
            // Refresh the friends store so the Requests tab shows it on next open.
            void useFriendsStore.getState().load();
          });
        },
      )
      .subscribe((status, err) => {
        console.log(`[notify:friends] channel status: ${status}`, err ?? '');
      });
  }

  if (!coopInviteChannel) {
    coopInviteChannel = sb
      .channel(`notify:coop:${me}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'coop_raid_invites', filter: `to_user=eq.${me}` },
        (payload) => {
          const row = payload.new as CoopRaidInviteRow;
          if (row.status !== 'pending') return;
          if (!prefs.osNotificationsWhenUnfocused) return;
          if (isWindowFocused()) return;
          void resolveDisplayName(row.from_user).then((name) => {
            void window.pantheonNotify?.show({
              title: 'Co-op Raid Invite',
              body: `${name} invited you to ${row.raid_id}.`,
            });
          });
        },
      )
      .subscribe((status, err) => {
        console.log(`[notify:coop] channel status: ${status}`, err ?? '');
      });
  }

  if (!eternityBossInviteChannel) {
    eternityBossInviteChannel = sb
      .channel(`notify:eternity-coop:${me}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'eternity_wake_coop_invites', filter: `to_user=eq.${me}` },
        (payload) => {
          const row = payload.new as EternityBossInviteRow;
          if (row.status !== 'pending') return;
          if (!prefs.osNotificationsWhenUnfocused) return;
          if (isWindowFocused()) return;
          void resolveDisplayName(row.from_user).then((name) => {
            void window.pantheonNotify?.show({
              title: "Eternity's Wake Co-op Invite",
              body: `${name} invited you to co-op against ${row.boss_id}.`,
            });
          });
        },
      )
      .subscribe((status, err) => {
        console.log(`[notify:eternity-coop] channel status: ${status}`, err ?? '');
      });
  }

  // Keep the gifts store realtime synced so the inbox badge is current even
  // before the user opens the panel.
  useGiftsStore.getState().connectRealtime();
  void useGiftsStore.getState().loadGifts();

  // Defensive: refresh thread summaries on (re)connect so unread badges are
  // correct even if accountSync hasn't run yet (e.g. cold-start where this
  // service installs after auth already settled).
  void useMessagesStore.getState().loadThreads();

  // Battleground invites: the battlegroundStore handles in-app toast;
  // we supplement with an OS notification when the window is unfocused.
  useBattlegroundStore.getState().connectRealtime();

  // Co-op raid invites use the same always-on lifecycle as battleground invites.
  useCoopRaidStore.getState().connectRealtime();
  useEternityBossCoopStore.getState().connectRealtime();
}

function disconnectChannels(): void {
  const sb = getSupabase();
  if (dmChannel) {
    if (sb) void sb.removeChannel(dmChannel);
    dmChannel = null;
  }
  if (giftChannel) {
    if (sb) void sb.removeChannel(giftChannel);
    giftChannel = null;
  }
  if (friendChannel) {
    if (sb) void sb.removeChannel(friendChannel);
    friendChannel = null;
  }
  if (coopInviteChannel) {
    if (sb) void sb.removeChannel(coopInviteChannel);
    coopInviteChannel = null;
  }
  if (eternityBossInviteChannel) {
    if (sb) void sb.removeChannel(eternityBossInviteChannel);
    eternityBossInviteChannel = null;
  }
  profileNameCache.clear();
  useGiftsStore.getState().disconnectRealtime();
  useBattlegroundStore.getState().disconnectRealtime();
  useCoopRaidStore.getState().disconnectRealtime();
  useEternityBossCoopStore.getState().disconnectRealtime();
}

// ── Public init ─────────────────────────────────────────────────────────────

/**
 * Install the always-on notification subscribers. Idempotent. Call once on
 * app boot; channels start/stop as auth status changes.
 */
export function initSocialNotifications(): void {
  if (installed) return;
  installed = true;

  unsubscribeAuth = useSocialStore.subscribe((state, prev) => {
    if (state.status === 'authenticated' && prev.status !== 'authenticated') {
      connectChannels();
    }
    if (state.status !== 'authenticated' && prev.status === 'authenticated') {
      disconnectChannels();
    }
  });

  // In case we were already authenticated at install time (hot reload, etc.).
  if (useSocialStore.getState().status === 'authenticated') {
    connectChannels();
  }
}

export function shutdownSocialNotifications(): void {
  if (!installed) return;
  unsubscribeAuth?.();
  disconnectChannels();
  installed = false;
}
