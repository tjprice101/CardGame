// Messages store — Phase 3.
//
// One open thread at a time (the chat panel is single-pane). Loading a thread
// fetches the last 100 messages and subscribes to inserts in that thread via
// realtime. Switching threads tears down the old subscription.
//
// Unread counts are tracked per-thread off `last_message_at` vs. a locally
// remembered "lastReadAt" so we don't need extra server state. The map is
// recomputed any time threads/messages change.

import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '@/net/supabaseClient';
import { useSocialStore } from '@/state/socialStore';
import { useStore } from '@/state/store';

export interface DmMessage {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  attachmentJson: unknown | null;
  createdAt: string;
}

export interface DmThreadSummary {
  id: string;
  otherUserId: string;
  lastMessageAt: string | null;
}

interface MessagesState {
  threads: Record<string, DmThreadSummary>;
  // userId -> threadId for fast "do I have a thread with this person" lookups.
  threadByOther: Readonly<Record<string, string>>;

  openThreadId: string | null;
  // Controls whether the chat panel is visible. Separated from openThreadId so
  // we can keep the realtime subscription and message cache alive while the
  // panel is hidden — incoming messages are buffered and appear instantly on
  // re-open without a full DB round-trip.
  chatPanelOpen: boolean;
  openMessages: DmMessage[];
  loading: boolean;
  sending: boolean;
  errorMessage: string | null;

  // userId -> ISO timestamp the user has marked the thread read at.
  // Persisted to localStorage so unread badges survive reloads.
  lastReadByThread: Readonly<Record<string, string>>;

  loadThreads: () => Promise<void>;
  openConversation: (otherUserId: string) => Promise<void>;
  closeConversation: () => void;
  /** Full teardown for logout — clears all state and kills subscriptions. */
  fullyClose: () => void;
  sendMessage: (body: string, attachment?: unknown) => Promise<void>;
  reportMessage: (messageId: string, targetUserId: string, reason: string) => Promise<void>;
  markCurrentRead: () => void;
}

const EMPTY_THREADS: Record<string, DmThreadSummary> = Object.freeze({});
const EMPTY_BY_OTHER: Readonly<Record<string, string>> = Object.freeze({});
const EMPTY_MESSAGES: DmMessage[] = [];

const LAST_READ_KEY = 'pantheon.dm.lastReadByThread.v1';
function loadLastRead(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LAST_READ_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as Record<string, string>;
  } catch { /* ignore */ }
  return {};
}
function saveLastRead(map: Record<string, string>) {
  try { localStorage.setItem(LAST_READ_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}

let threadsChannel: RealtimeChannel | null = null;
let messagesChannel: RealtimeChannel | null = null;

function rowToMessage(r: {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  attachment_json: unknown | null;
  created_at: string;
}): DmMessage {
  return {
    id: r.id,
    threadId: r.thread_id,
    senderId: r.sender_id,
    body: r.body,
    attachmentJson: r.attachment_json,
    createdAt: r.created_at,
  };
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  threads: EMPTY_THREADS,
  threadByOther: EMPTY_BY_OTHER,
  openThreadId: null,
  chatPanelOpen: false,
  openMessages: EMPTY_MESSAGES,
  loading: false,
  sending: false,
  errorMessage: null,
  lastReadByThread: Object.freeze(loadLastRead()),

  async loadThreads() {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return;
    const { data, error } = await sb
      .from('dm_threads')
      .select('id, user_low, user_high, last_message_at')
      .order('last_message_at', { ascending: false, nullsFirst: false });
    if (error) { set({ errorMessage: error.message }); return; }
    const threads: Record<string, DmThreadSummary> = {};
    const byOther: Record<string, string> = {};
    for (const r of (data ?? []) as Array<{
      id: string; user_low: string; user_high: string; last_message_at: string | null;
    }>) {
      const otherUserId = r.user_low === me ? r.user_high : r.user_low;
      threads[r.id] = { id: r.id, otherUserId, lastMessageAt: r.last_message_at };
      byOther[otherUserId] = r.id;
    }
    set({ threads, threadByOther: Object.freeze(byOther) });
    ensureThreadsRealtime();
  },

  async openConversation(otherUserId) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return;

    // If the same thread is already loaded in memory (subscription live, messages
    // cached), just show the panel and do a lightweight background refresh instead
    // of a full teardown → fetch → subscribe cycle. This is the common case when
    // the user closes and immediately reopens the chat with the same friend.
    const knownThreadId = get().threadByOther[otherUserId];
    if (knownThreadId && knownThreadId === get().openThreadId) {
      set({ chatPanelOpen: true, errorMessage: null });
      get().markCurrentRead();
      // Refresh from DB in the background to catch messages that arrived while
      // the panel was hidden (realtime/polling may have already handled this, but
      // an explicit refresh guarantees consistency).
      void refreshOpenThreadMessages(knownThreadId);
      return;
    }

    // Different thread (or no thread loaded yet): full teardown + fetch.
    teardownMessagesChannel();
    set({ loading: true, errorMessage: null, openMessages: EMPTY_MESSAGES, chatPanelOpen: false });
    try {
      const { data: tid, error: rpcErr } = await sb.rpc('get_or_create_dm_thread', {
        other_user: otherUserId,
      });
      if (rpcErr) throw rpcErr;
      const threadId = tid as string;

      const { data: msgs, error: msgErr } = await sb
        .from('dm_messages')
        .select('id, thread_id, sender_id, body, attachment_json, created_at')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (msgErr) throw msgErr;

      // Make sure the new thread is in our threads map even if loadThreads hasn't run yet.
      const threads = { ...get().threads };
      const byOther = { ...get().threadByOther };
      if (!threads[threadId]) {
        threads[threadId] = { id: threadId, otherUserId, lastMessageAt: null };
        byOther[otherUserId] = threadId;
      }

      set({
        openThreadId: threadId,
        chatPanelOpen: true,
        openMessages: ((msgs ?? []) as Parameters<typeof rowToMessage>[0][]).map(rowToMessage),
        loading: false,
        threads,
        threadByOther: Object.freeze(byOther),
      });
      subscribeOpenThread(threadId);
      // Auto-mark read on open.
      get().markCurrentRead();
    } catch (err) {
      set({ loading: false, errorMessage: messageOf(err), chatPanelOpen: false });
    }
  },

  closeConversation() {
    // Hide the panel but keep the subscription and message cache alive so that:
    // 1. Incoming realtime messages are still received and stored while the
    //    panel is closed (user sees them instantly on re-open).
    // 2. The polling fallback continues ticking for the open thread.
    // 3. Re-opening the same conversation skips the DB round-trip.
    get().markCurrentRead();
    set({ chatPanelOpen: false });
  },

  fullyClose() {
    // Hard reset for logout / account switch. Tears everything down.
    teardownMessagesChannel();
    set({
      openThreadId: null,
      chatPanelOpen: false,
      openMessages: EMPTY_MESSAGES,
      loading: false,
      sending: false,
      errorMessage: null,
    });
  },

  async sendMessage(body, attachment) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    const threadId = get().openThreadId;
    if (!sb || !me || !threadId) return;
    const trimmed = body.trim();
    if (!trimmed) return;
    set({ sending: true, errorMessage: null });

    // Optimistic update: immediately show the message for the sender so the UI
    // feels responsive even when realtime delivery is slow or unavailable.
    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
    const optimistic: DmMessage = {
      id: optimisticId,
      threadId,
      senderId: me,
      body: trimmed,
      attachmentJson: attachment ?? null,
      createdAt: new Date().toISOString(),
    };
    set(s => ({ openMessages: [...s.openMessages, optimistic] }));

    const { data: insertedRows, error } = await sb.from('dm_messages').insert({
      thread_id: threadId,
      sender_id: me,
      body: trimmed,
      attachment_json: attachment ?? null,
    }).select('id, thread_id, sender_id, body, attachment_json, created_at');

    set({ sending: false });

    if (error) {
      // Roll back the optimistic message on failure.
      set(s => ({ openMessages: s.openMessages.filter(m => m.id !== optimisticId), errorMessage: error.message }));
    } else {
      // Replace the optimistic placeholder with the server-confirmed message (real ID).
      const confirmed = insertedRows && (insertedRows as Parameters<typeof rowToMessage>[0][]).length > 0
        ? rowToMessage((insertedRows as Parameters<typeof rowToMessage>[0][])[0])
        : null;
      if (confirmed) {
        set(s => ({
          openMessages: s.openMessages.map(m => m.id === optimisticId ? confirmed : m),
        }));
      } else {
        // Fallback: remove optimistic and refetch latest messages so both sides stay in sync.
        set(s => ({ openMessages: s.openMessages.filter(m => m.id !== optimisticId) }));
        void refreshOpenThreadMessages(threadId);
      }
      const game = useStore.getState();
      game.recordSocialProgress('message_sent');
      if (attachment !== undefined && attachment !== null) {
        game.recordSocialProgress('message_with_attachment');
      }
    }
  },

  async reportMessage(messageId, targetUserId, reason) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return;
    const { error } = await sb.from('reports').insert({
      reporter: me,
      target_user: targetUserId,
      message_id: messageId,
      reason: reason.slice(0, 500),
    });
    if (error) set({ errorMessage: error.message });
  },

  markCurrentRead() {
    const tid = get().openThreadId;
    if (!tid) return;
    const next = { ...get().lastReadByThread, [tid]: new Date().toISOString() };
    saveLastRead(next);
    set({ lastReadByThread: Object.freeze(next) });
  },
}));

function ensureThreadsRealtime() {
  const sb = getSupabase();
  if (!sb || threadsChannel) return;
  threadsChannel = sb
    .channel('dm-threads')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_threads' }, () => {
      void useMessagesStore.getState().loadThreads();
    })
    .subscribe();
}

function subscribeOpenThread(threadId: string) {
  const sb = getSupabase();
  if (!sb) return;
  teardownMessagesChannel();
  messagesChannel = sb
    .channel(`dm-messages:${threadId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'dm_messages', filter: `thread_id=eq.${threadId}` },
      payload => {
        const row = payload.new as Parameters<typeof rowToMessage>[0];
        const msg = rowToMessage(row);
        const prev = useMessagesStore.getState().openMessages;
        // Deduplicate: skip if already present by real ID, or replace any optimistic
        // placeholder that has the same body+sender (optimistic IDs start with 'optimistic-').
        if (prev.some(m => m.id === msg.id)) return;
        const withoutOptimistic = prev.filter(
          m => !(m.id.startsWith('optimistic-') && m.senderId === msg.senderId && m.body === msg.body),
        );
        useMessagesStore.setState({ openMessages: [...withoutOptimistic, msg] });
      },
    )
    .subscribe((status) => {
      // Realtime may not be enabled for the table in all environments.
      // Fall back to a lightweight poll so both parties still see new messages.
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        startPollingFallback(threadId);
      }
    });
}

let pollingTimer: ReturnType<typeof setInterval> | null = null;

function startPollingFallback(threadId: string) {
  if (pollingTimer) return; // already polling
  pollingTimer = setInterval(() => {
    const current = useMessagesStore.getState().openThreadId;
    if (current !== threadId) {
      clearInterval(pollingTimer!);
      pollingTimer = null;
      return;
    }
    void refreshOpenThreadMessages(threadId);
  }, 5000);
}

/** Fetch the last 100 messages for a thread and merge into state, deduplicating by ID. */
async function refreshOpenThreadMessages(threadId: string) {
  const sb = getSupabase();
  if (!sb) return;
  const { data, error } = await sb
    .from('dm_messages')
    .select('id, thread_id, sender_id, body, attachment_json, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(100);
  if (error || !data) return;
  const fetched = (data as Parameters<typeof rowToMessage>[0][]).map(rowToMessage);
  const fetchedIds = new Set(fetched.map(m => m.id));
  // Merge: keep existing optimistic placeholders that haven't been confirmed yet,
  // then append any new real messages not already in state.
  useMessagesStore.setState(s => {
    if (s.openThreadId !== threadId) return s;
    const optimistics = s.openMessages.filter(m => m.id.startsWith('optimistic-'));
    const realMsgs = fetched;
    // Drop optimistics that are now confirmed (same body+sender in fetched).
    const pendingOptimistics = optimistics.filter(opt =>
      !realMsgs.some(r => r.senderId === opt.senderId && r.body === opt.body),
    );
    // Ensure no duplicates among real messages.
    const deduped = realMsgs.filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i);
    return { openMessages: [...deduped, ...pendingOptimistics] };
  });
  // void the unused variable warning
  void fetchedIds;
}

function teardownMessagesChannel() {
  const sb = getSupabase();
  if (messagesChannel && sb) {
    void sb.removeChannel(messagesChannel);
    messagesChannel = null;
  }
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

function messageOf(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message);
  if (typeof err === 'string') return err;
  return 'Unknown error';
}

// Stable selectors.
export const selectOpenThreadId   = (s: MessagesState) => s.openThreadId;
export const selectChatPanelOpen  = (s: MessagesState) => s.chatPanelOpen;
export const selectOpenMessages   = (s: MessagesState) => s.openMessages;
export const selectThreadsByOther = (s: MessagesState) => s.threadByOther;
export const selectThreadsMap     = (s: MessagesState) => s.threads;
export const selectMessagesError  = (s: MessagesState) => s.errorMessage;
export const selectMessagesSending = (s: MessagesState) => s.sending;
export const selectLastReadByThread = (s: MessagesState) => s.lastReadByThread;

// Helper: count threads with unread messages (any message after lastReadAt or never read).
export function selectUnreadThreadCount(s: MessagesState): number {
  let count = 0;
  for (const tid of Object.keys(s.threads)) {
    const t = s.threads[tid];
    if (!t.lastMessageAt) continue;
    const lastRead = s.lastReadByThread[tid];
    if (!lastRead || lastRead < t.lastMessageAt) count += 1;
  }
  return count;
}
