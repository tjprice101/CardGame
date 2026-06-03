import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createSessionRng } from '@/net/coopRng';
import { COOP_PROTOCOL_VERSION, type CoopEvent, type CoopOutboundEnvelope } from '@/net/coopEvents';
import { getSupabase } from '@/net/supabaseClient';
import { useSocialStore } from '@/state/socialStore';
import type { CoopSessionDescriptor } from '@/state/coopSessionStore';

export interface CoopSyncStoreState {
  attached: boolean;
  sessionId: string | null;
  lastAppliedSeq: number;
  outboundQueue: CoopOutboundEnvelope[];
  rngState: { seed: number; advanceCount: number } | null;
  isResyncing: boolean;
  lastLoopbackPingMs: number | null;

  attach: (descriptor: CoopSessionDescriptor) => Promise<void>;
  detach: () => Promise<void>;
  emit: (envelope: CoopOutboundEnvelope) => Promise<void>;
  requestResync: () => Promise<void>;
  debugLoopbackPing: (tag?: string) => Promise<number | null>;
  getActiveCoopRng: () => () => number;
  handleIncoming: (event: CoopEvent) => void;
}

let activeRng: (() => number) | null = null;
let transportChannel: RealtimeChannel | null = null;
const pendingPingResolvers = new Map<number, (rtt: number) => void>();
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let timeoutSweepInterval: ReturnType<typeof setInterval> | null = null;
let currentParticipantIds: string[] = [];
const participantLastSeenMs = new Map<string, number>();
const timeoutEmittedUsers = new Set<string>();

const HEARTBEAT_INTERVAL_MS = 5_000;
const HEARTBEAT_TIMEOUT_MS = 15_000;

type CoopSessionEventRow = {
  id: number | string;
  sender_user: string;
  event_type: CoopEvent['type'];
  payload: Record<string, unknown>;
  created_at: string;
};

let storeModulePromise: Promise<typeof import('@/state/store')> | null = null;

function applyCoopBossDamageFromEvent(amount: number, sourceUserId: string, seq: number): void {
  if (!Number.isFinite(amount) || amount <= 0) return;
  if (!storeModulePromise) {
    storeModulePromise = import('@/state/store');
  }
  void storeModulePromise
    .then(({ useStore }) => {
      useStore.getState().applyCoopBossDamage(amount, sourceUserId, seq);
    })
    .catch((error) => {
      console.warn('[coop-sync] failed to apply boss damage event:', error);
    });
}

function clearHeartbeatTimers(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (timeoutSweepInterval) {
    clearInterval(timeoutSweepInterval);
    timeoutSweepInterval = null;
  }
}

function ensureStoreModulePromise(): Promise<typeof import('@/state/store')> {
  if (!storeModulePromise) {
    storeModulePromise = import('@/state/store');
  }
  return storeModulePromise;
}

function markParticipantSeen(userId: string): void {
  if (!userId) return;
  participantLastSeenMs.set(userId, Date.now());
  timeoutEmittedUsers.delete(userId);
}

function notifyParticipantDisconnected(userId: string): void {
  if (!userId) return;
  void ensureStoreModulePromise()
    .then(({ useStore }) => {
      useStore.getState().markCoopParticipantDisconnected(userId);
    })
    .catch((error) => {
      console.warn('[coop-sync] failed to mark participant disconnected:', error);
    });
}

function resolveSessionTermination(outcome: 'victory' | 'defeat' | 'aborted', sessionId: string | null): void {
  void ensureStoreModulePromise()
    .then(({ useStore }) => {
      const state = useStore.getState();
      if (state.bossFight.mode === 'active' && state.bossFight.coopSessionId === sessionId) {
        if (state.bossFight.kind === 'normal') {
          state.enqueueToast(
            outcome === 'victory'
              ? 'Eternity co-op session finished: Victory.'
              : 'Eternity co-op session ended as defeat.',
            outcome === 'victory' ? 'success' : 'warning',
            6000,
          );
        }
        if (outcome !== 'victory') {
          state.forfeitBossFight();
        }
      }
      if (state.bossFight.mode === 'active' && state.bossFight.kind === 'null_raid') {
        state.enqueueToast(
          outcome === 'aborted' ? 'Null raid co-op session aborted.' : 'Null raid co-op session finished.',
          outcome === 'aborted' ? 'warning' : 'info',
          6000,
        );
      }
      if (state.battleground.mode === 'active' && state.battleground.kind === 'pvp') {
        state.enqueueToast(
          outcome === 'victory'
            ? 'Battleground session resolved: Victory.'
            : 'Battleground session resolved.',
          outcome === 'victory' ? 'success' : 'info',
          5000,
        );
        state.completeBattleground();
      }
    })
    .catch((error) => {
      console.warn('[coop-sync] failed to resolve session termination:', error);
    });
}

export const useCoopSyncStore = create<CoopSyncStoreState>((set, get) => ({
  attached: false,
  sessionId: null,
  lastAppliedSeq: 0,
  outboundQueue: [],
  rngState: null,
  isResyncing: false,
  lastLoopbackPingMs: null,

  async attach(descriptor) {
    const sb = getSupabase();
    const localUserId = useSocialStore.getState().user?.id;

    if (transportChannel) {
      void sb?.removeChannel(transportChannel);
      transportChannel = null;
    }

    clearHeartbeatTimers();
    currentParticipantIds = Array.from(new Set((descriptor.participantIds ?? []).filter(Boolean)));
    participantLastSeenMs.clear();
    timeoutEmittedUsers.clear();
    for (const userId of currentParticipantIds) {
      participantLastSeenMs.set(userId, Date.now());
    }

    activeRng = createSessionRng(descriptor.rngSeed);
    set({
      attached: true,
      sessionId: descriptor.id,
      lastAppliedSeq: 0,
      outboundQueue: [],
      rngState: { seed: descriptor.rngSeed, advanceCount: 0 },
      isResyncing: false,
      lastLoopbackPingMs: null,
    });

    if (!sb) return;

    transportChannel = sb
      .channel(`coop-sync:${descriptor.id}`)
      .on('broadcast', { event: 'coop_event' }, (msg) => {
        const event = msg.payload as CoopEvent | undefined;
        if (!event || typeof event.seq !== 'number' || typeof event.type !== 'string') return;
        get().handleIncoming(event);
      })
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[coop-sync] channel error:', err ?? status);
        }
      });

    if (localUserId) {
      markParticipantSeen(localUserId);
      await get().emit({
        type: 'player_connected',
        payload: { userId: localUserId },
      });
    }

    heartbeatInterval = setInterval(() => {
      const store = get();
      const me = useSocialStore.getState().user?.id;
      if (!store.attached || !me) return;
      markParticipantSeen(me);
      void store.emit({
        type: 'heartbeat',
        payload: { userId: me, localSeqAck: store.lastAppliedSeq },
      });
    }, HEARTBEAT_INTERVAL_MS);

    timeoutSweepInterval = setInterval(() => {
      const store = get();
      if (!store.attached) return;
      const now = Date.now();
      for (const userId of currentParticipantIds) {
        const seenAt = participantLastSeenMs.get(userId) ?? 0;
        if (now - seenAt <= HEARTBEAT_TIMEOUT_MS) continue;
        if (timeoutEmittedUsers.has(userId)) continue;
        timeoutEmittedUsers.add(userId);
        void store.emit({
          type: 'player_disconnected',
          payload: { userId, reason: 'timeout' },
        });
        notifyParticipantDisconnected(userId);
      }
    }, 3_000);

    await get().requestResync();
  },

  async detach() {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (get().attached && me) {
      void get().emit({
        type: 'player_disconnected',
        payload: { userId: me, reason: 'left' },
      });
    }
    if (transportChannel) {
      void sb?.removeChannel(transportChannel);
      transportChannel = null;
    }
    clearHeartbeatTimers();
    currentParticipantIds = [];
    participantLastSeenMs.clear();
    timeoutEmittedUsers.clear();
    pendingPingResolvers.clear();
    activeRng = null;
    set({
      attached: false,
      sessionId: null,
      lastAppliedSeq: 0,
      outboundQueue: [],
      rngState: null,
      isResyncing: false,
      lastLoopbackPingMs: null,
    });
  },

  async emit(envelope) {
    const sb = getSupabase();
    const sessionId = get().sessionId;
    const localUserId = useSocialStore.getState().user?.id;
    if (!get().attached || !sb || !sessionId || !localUserId) return;

    const { data, error } = await sb
      .from('coop_session_events')
      .insert({
        session_id: sessionId,
        sender_user: localUserId,
        protocol_version: COOP_PROTOCOL_VERSION,
        event_type: envelope.type,
        payload: envelope.payload,
      })
      .select('id, sender_user, event_type, payload, created_at')
      .single();

    if (error || !data) {
      console.warn('[coop-sync] failed to persist event:', error?.message ?? 'unknown error');
      return;
    }

    const seq = Number((data as CoopSessionEventRow).id);
    if (!Number.isFinite(seq)) {
      console.warn('[coop-sync] invalid event sequence from DB');
      return;
    }

    const event = {
      seq,
      sender: localUserId,
      t: (data as CoopSessionEventRow).created_at,
      type: envelope.type,
      payload: envelope.payload,
    };

    set((s) => ({ outboundQueue: [...s.outboundQueue, envelope] }));

    // Apply immediately from the authoritative persisted event.
    get().handleIncoming(event as CoopEvent);

    if (transportChannel) {
      await transportChannel.send({
        type: 'broadcast',
        event: 'coop_event',
        payload: event,
      });
    }
  },

  async requestResync() {
    const sb = getSupabase();
    const sessionId = get().sessionId;
    if (!get().attached || !sb || !sessionId) {
      set({ isResyncing: false });
      return;
    }

    set({ isResyncing: true });
    const fromSeq = get().lastAppliedSeq;
    const { data, error } = await sb
      .from('coop_session_events')
      .select('id, sender_user, event_type, payload, created_at')
      .eq('session_id', sessionId)
      .gt('id', fromSeq)
      .order('id', { ascending: true })
      .limit(1000);

    if (error) {
      console.warn('[coop-sync] resync failed:', error.message);
      set({ isResyncing: false });
      return;
    }

    for (const row of (data ?? []) as CoopSessionEventRow[]) {
      const seq = Number(row.id);
      if (!Number.isFinite(seq)) continue;
      get().handleIncoming({
        seq,
        sender: row.sender_user,
        t: row.created_at,
        type: row.event_type,
        payload: row.payload ?? {},
      } as CoopEvent);
    }

    set({ isResyncing: false });
  },

  async debugLoopbackPing(tag) {
    if (!get().attached) return null;
    const started = Date.now();
    const pingResult = new Promise<number | null>((resolve) => {
      pendingPingResolvers.set(started, (rtt) => resolve(rtt));
      setTimeout(() => {
        if (pendingPingResolvers.has(started)) {
          pendingPingResolvers.delete(started);
          resolve(null);
        }
      }, 2_500);
    });

    await get().emit({
      type: 'debug_ping',
      payload: { sentAtMs: started, tag },
    });

    const rtt = await pingResult;
    if (rtt === null) return null;
    set({ lastLoopbackPingMs: rtt });
    return rtt;
  },

  getActiveCoopRng() {
    const store = get();
    if (!store.attached || !activeRng) return Math.random;

    return () => {
      const value = activeRng ? activeRng() : Math.random();
      set((s) => ({
        rngState: s.rngState
          ? { seed: s.rngState.seed, advanceCount: s.rngState.advanceCount + 1 }
          : s.rngState,
      }));
      return value;
    };
  },

  handleIncoming(event) {
    if (event.seq <= get().lastAppliedSeq) return;

    if (event.sender) {
      markParticipantSeen(event.sender);
    }

    if (event.type === 'player_connected') {
      const userId = String((event.payload as { userId?: unknown }).userId ?? '');
      if (userId && !currentParticipantIds.includes(userId)) {
        currentParticipantIds.push(userId);
      }
      markParticipantSeen(userId);
    }

    if (event.type === 'player_disconnected') {
      const userId = String((event.payload as { userId?: unknown }).userId ?? '');
      notifyParticipantDisconnected(userId);
    }

    if (event.type === 'session_aborted') {
      resolveSessionTermination('aborted', get().sessionId);
    }

    if (event.type === 'session_finished') {
      const outcome = (event.payload as { outcome?: unknown }).outcome;
      resolveSessionTermination(outcome === 'victory' ? 'victory' : 'defeat', get().sessionId);
    }

    if (event.type === 'boss_damage') {
      const amount = Number((event.payload as { amount?: unknown }).amount ?? NaN);
      const sourceUserId = String((event.payload as { sourceUserId?: unknown }).sourceUserId ?? '');
      applyCoopBossDamageFromEvent(amount, sourceUserId, event.seq);
    }

    const sentAtMs = Number((event.payload as { sentAtMs?: unknown }).sentAtMs ?? NaN);
    if (event.type === 'debug_ping' && Number.isFinite(sentAtMs)) {
      const resolver = pendingPingResolvers.get(sentAtMs);
      if (resolver) {
        pendingPingResolvers.delete(sentAtMs);
        resolver(Date.now() - sentAtMs);
      }
    }

    set((s) => ({
      lastAppliedSeq: Math.max(s.lastAppliedSeq, event.seq),
      lastLoopbackPingMs:
        event.type === 'debug_ping' && Number.isFinite(sentAtMs) ? Date.now() - sentAtMs : s.lastLoopbackPingMs,
    }));
  },
}));

export function getActiveCoopRng(): () => number {
  return useCoopSyncStore.getState().getActiveCoopRng();
}
