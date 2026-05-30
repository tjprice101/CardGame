// giftsStore — Phase 4 social state.
//
// Server-canonical gift inbox + send/claim/decline actions. A gift row is
// inserted by the sender via RLS, then the recipient flips it to 'claimed'
// (or 'declined'). On 'claimed' we mirror the payload into the local save
// (e.g. credit card copies into progress.collection).

import { create } from 'zustand';
import { getSupabase } from '@/net/supabaseClient';
import { useSocialStore } from '@/state/socialStore';
import { useStore } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import type { CardFinish } from '@/types/cards';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ── Types ───────────────────────────────────────────────────────────────────

export type GiftKind = 'card_copy';
export type GiftStatus = 'pending' | 'claimed' | 'declined' | 'expired';

export interface CardCopyGiftPayload {
  definitionId: string;
  finish: CardFinish;
  count: number;
  note?: string;
}

export interface GiftRow {
  id: string;
  senderId: string;
  recipientId: string;
  kind: GiftKind;
  payload: CardCopyGiftPayload;
  status: GiftStatus;
  createdAt: string;
  claimedAt: string | null;
}

interface GiftsState {
  incoming: GiftRow[];   // gifts where I'm the recipient
  outgoing: GiftRow[];   // gifts I sent (for read-only history)
  loading: boolean;
  errorMessage: string | null;

  loadGifts: () => Promise<void>;
  sendCardCopyGift: (
    recipientId: string,
    payload: CardCopyGiftPayload,
  ) => Promise<GiftRow | null>;
  claimGift: (giftId: string) => Promise<void>;
  declineGift: (giftId: string) => Promise<void>;
  connectRealtime: () => void;
  disconnectRealtime: () => void;
}

// ── Frozen empties (avoid Zustand v5 snapshot-cache thrash) ─────────────────

const EMPTY_GIFTS: GiftRow[] = [];

// ── Module-level realtime handle ────────────────────────────────────────────

let realtimeChannel: RealtimeChannel | null = null;

// ── Row mapper ──────────────────────────────────────────────────────────────

function mapRow(r: {
  id: string;
  sender_id: string;
  recipient_id: string;
  kind: GiftKind;
  payload: unknown;
  status: GiftStatus;
  created_at: string;
  claimed_at: string | null;
}): GiftRow | null {
  const p = r.payload;
  if (!p || typeof p !== 'object') return null;
  const pp = p as Record<string, unknown>;
  if (typeof pp.definitionId !== 'string') return null;
  if (pp.finish !== 'normal' && pp.finish !== 'holo') return null;
  if (typeof pp.count !== 'number' || pp.count < 1 || pp.count > 4) return null;
  return {
    id: r.id,
    senderId: r.sender_id,
    recipientId: r.recipient_id,
    kind: r.kind,
    payload: {
      definitionId: pp.definitionId,
      finish: pp.finish,
      count: pp.count,
      note: typeof pp.note === 'string' ? pp.note : undefined,
    },
    status: r.status,
    createdAt: r.created_at,
    claimedAt: r.claimed_at,
  };
}

// ── Local save mutators ─────────────────────────────────────────────────────

/** Credit N copies of definitionId into the local collection (with finish). */
function creditCollection(definitionId: string, finish: CardFinish, count: number): void {
  useStore.setState(s => {
    const cur = s.progress.collection[definitionId] ?? 0;
    s.progress.collection[definitionId] = cur + count;
    if (finish === 'holo') {
      const curHolo = s.progress.holoCollection[definitionId] ?? 0;
      s.progress.holoCollection[definitionId] = Math.min(
        s.progress.collection[definitionId],
        curHolo + count,
      );
    }
    if (!s.progress.recentlyAcquired) s.progress.recentlyAcquired = {};
    s.progress.recentlyAcquired[definitionId] = Date.now();
  });
}

/**
 * Verify the sender currently owns enough copies of the card to gift, and
 * debit them locally. Returns true if debit succeeded. The server has no
 * inventory state, so this is best-effort client-side; the gift row will
 * still succeed if the sender hacks past this check, but the recipient
 * benefits and our local UI stays honest.
 */
function tryDebitCollection(definitionId: string, finish: CardFinish, count: number): boolean {
  const state = useStore.getState();
  const owned = state.progress.collection[definitionId] ?? 0;
  if (owned < count) return false;
  // For holo, also require enough holo copies.
  if (finish === 'holo') {
    const ownedHolo = state.progress.holoCollection[definitionId] ?? 0;
    if (ownedHolo < count) return false;
  }
  useStore.setState(s => {
    s.progress.collection[definitionId] = (s.progress.collection[definitionId] ?? 0) - count;
    if (finish === 'holo') {
      s.progress.holoCollection[definitionId] =
        (s.progress.holoCollection[definitionId] ?? 0) - count;
    }
    // Clamp holo to total.
    const total = s.progress.collection[definitionId] ?? 0;
    const holo = s.progress.holoCollection[definitionId] ?? 0;
    if (holo > total) s.progress.holoCollection[definitionId] = total;
  });
  return true;
}

// ── Store ───────────────────────────────────────────────────────────────────

export const useGiftsStore = create<GiftsState>((set, get) => ({
  incoming: EMPTY_GIFTS,
  outgoing: EMPTY_GIFTS,
  loading: false,
  errorMessage: null,

  async loadGifts() {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return;
    set({ loading: true, errorMessage: null });
    const { data, error } = await sb
      .from('gifts')
      .select('id, sender_id, recipient_id, kind, payload, status, created_at, claimed_at')
      .or(`sender_id.eq.${me},recipient_id.eq.${me}`)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      set({ loading: false, errorMessage: error.message });
      return;
    }
    const rows = (data ?? [])
      .map(r => mapRow(r as Parameters<typeof mapRow>[0]))
      .filter((x): x is GiftRow => x !== null);
    const incoming = rows.filter(r => r.recipientId === me);
    const outgoing = rows.filter(r => r.senderId === me);
    set({ incoming, outgoing, loading: false });
  },

  async sendCardCopyGift(recipientId, payload) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) {
      set({ errorMessage: 'Not signed in.' });
      return null;
    }
    if (recipientId === me) {
      set({ errorMessage: 'Cannot gift yourself.' });
      return null;
    }
    const def = CardRegistry.get(payload.definitionId);
    if (!def) {
      set({ errorMessage: 'Unknown card.' });
      return null;
    }
    if (payload.count < 1 || payload.count > 4) {
      set({ errorMessage: 'Gift count must be 1-4.' });
      return null;
    }
    if (!tryDebitCollection(payload.definitionId, payload.finish, payload.count)) {
      set({ errorMessage: `You don't own ${payload.count}× ${def.name} (${payload.finish}).` });
      return null;
    }

    const { data, error } = await sb
      .from('gifts')
      .insert({
        sender_id: me,
        recipient_id: recipientId,
        kind: 'card_copy',
        payload: {
          definitionId: payload.definitionId,
          finish: payload.finish,
          count: payload.count,
          note: payload.note?.slice(0, 200),
        },
      })
      .select('id, sender_id, recipient_id, kind, payload, status, created_at, claimed_at')
      .single();

    if (error || !data) {
      // Roll back the local debit.
      creditCollection(payload.definitionId, payload.finish, payload.count);
      set({ errorMessage: error?.message ?? 'Failed to send gift.' });
      return null;
    }
    const row = mapRow(data as Parameters<typeof mapRow>[0]);
    if (row) {
      set(s => ({ outgoing: [row, ...s.outgoing] }));
    }
    return row;
  },

  async claimGift(giftId) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return;
    const gift = get().incoming.find(g => g.id === giftId);
    if (!gift) return;
    if (gift.status !== 'pending') return;

    const { data, error } = await sb
      .from('gifts')
      .update({ status: 'claimed' })
      .eq('id', giftId)
      .eq('recipient_id', me)
      .eq('status', 'pending')
      .select('id, sender_id, recipient_id, kind, payload, status, created_at, claimed_at')
      .single();

    if (error || !data) {
      set({ errorMessage: error?.message ?? 'Failed to claim gift.' });
      return;
    }

    // Credit the local save.
    creditCollection(gift.payload.definitionId, gift.payload.finish, gift.payload.count);

    const updated = mapRow(data as Parameters<typeof mapRow>[0]);
    set(s => ({
      incoming: s.incoming.map(g => (g.id === giftId && updated ? updated : g)),
    }));
  },

  async declineGift(giftId) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return;
    const { error } = await sb
      .from('gifts')
      .update({ status: 'declined' })
      .eq('id', giftId)
      .eq('recipient_id', me)
      .eq('status', 'pending');
    if (error) {
      set({ errorMessage: error.message });
      return;
    }
    set(s => ({
      incoming: s.incoming.map(g =>
        g.id === giftId ? { ...g, status: 'declined' } : g,
      ),
    }));
  },

  connectRealtime() {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me || realtimeChannel) return;
    realtimeChannel = sb
      .channel(`gifts:${me}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gifts' },
        () => {
          // Cheap and correct: refetch on any change.
          void get().loadGifts();
        },
      )
      .subscribe();
  },

  disconnectRealtime() {
    if (realtimeChannel) {
      const sb = getSupabase();
      if (sb) void sb.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  },
}));

// ── Selectors ───────────────────────────────────────────────────────────────

export const selectIncomingGifts = (s: GiftsState): GiftRow[] => s.incoming;
export const selectOutgoingGifts = (s: GiftsState): GiftRow[] => s.outgoing;
export const selectGiftsError = (s: GiftsState): string | null => s.errorMessage;

/** Count of pending unclaimed gifts addressed to me. */
export function selectPendingGiftCount(s: GiftsState): number {
  let n = 0;
  for (const g of s.incoming) if (g.status === 'pending') n++;
  return n;
}
