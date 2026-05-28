// battlegroundStore — Phase 3 Supabase integration.
//
// Handles:
//   1. PvP session creation and invite sending (host side).
//   2. Invite acceptance/decline (guest side) — wires realtime.
//   3. Realtime board + score sync during an active PvP match (≤ 2 s throttle).
//   4. CPU session result persistence (fire-and-forget upsert).
//
// All Supabase operations are best-effort: failures are logged but never
// surface as UI-blocking errors. The game continues normally offline.

import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '@/net/supabaseClient';
import { useSocialStore } from '@/state/socialStore';
import { useStore } from '@/state/store';
import type { BoardState } from '@/types/game';
import type { BattlegroundOpponentProfile } from '@/types/battleground';

// ── Types ────────────────────────────────────────────────────────────────────

export interface BattlegroundInviteRow {
  id: string;
  from_user: string;
  to_user: string;
  session_id: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
}

interface BattlegroundStoreState {
  /** Pending invite sent TO the local player (for the accept/decline flow). */
  incomingInvite: BattlegroundInviteRow | null;
  /** Session id of the active PvP session. */
  activeSessionId: string | null;

  // Public actions
  /** Send a PvP invite to a friend. Returns the created session id, or null on failure. */
  sendInvite: (toUserId: string, toProfile: BattlegroundOpponentProfile) => Promise<string | null>;
  /** Accept an incoming invite and start the PvP match. */
  acceptInvite: (invite: BattlegroundInviteRow) => Promise<void>;
  /** Decline an incoming invite. */
  declineInvite: (inviteId: string) => Promise<void>;
  /** Persist a completed CPU session result to the DB. Fire-and-forget. */
  persistCpuResult: (score: number, result: 'win' | 'loss' | 'draw') => void;
  /** Broadcast local board + score to the PvP opponent (throttled to ≤ 2 s). */
  broadcastBoard: (board: BoardState, score: number) => void;
  /** Start listening for incoming PvP invites and score/board updates. */
  connectRealtime: () => void;
  /** Tear down all realtime channels. */
  disconnectRealtime: () => void;
  /** Clear the incoming invite (after it is processed). */
  clearIncomingInvite: () => void;
  /** Internal: wire the board broadcast channel for a session. */
  connectBoardChannel: (sessionId: string) => void;
}

// ── Module-level realtime state ───────────────────────────────────────────────

let inviteChannel: RealtimeChannel | null = null;
let boardChannel: RealtimeChannel | null = null;

// Throttle for broadcastBoard (2 s minimum between sends).
let lastBroadcastAt = 0;
const BROADCAST_THROTTLE_MS = 2_000;

// ── Store ────────────────────────────────────────────────────────────────────

export const useBattlegroundStore = create<BattlegroundStoreState>((set, get) => ({
  incomingInvite: null,
  activeSessionId: null,

  async sendInvite(toUserId, toProfile) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return null;

    // Create a session row first.
    const { data: sessionData, error: sessionError } = await sb
      .from('battleground_sessions')
      .insert({ host_id: me, guest_id: toUserId, kind: 'pvp', status: 'pending' })
      .select('id')
      .single();
    if (sessionError || !sessionData) {
      console.warn('[battleground] failed to create session:', sessionError?.message);
      return null;
    }
    const sessionId = sessionData.id as string;

    // Create invite row.
    const { error: inviteError } = await sb
      .from('battleground_invites')
      .insert({ from_user: me, to_user: toUserId, session_id: sessionId, status: 'pending' });
    if (inviteError) {
      console.warn('[battleground] failed to send invite:', inviteError.message);
      return null;
    }

    set({ activeSessionId: sessionId });
    // Start the match on the host side immediately (CPU-mode stand-in until guest accepts).
    useStore.getState().enterBattleground('pvp', undefined, toProfile);
    get().connectBoardChannel(sessionId);
    return sessionId;
  },

  async acceptInvite(invite) {
    const sb = getSupabase();
    if (!sb) return;
    await sb
      .from('battleground_invites')
      .update({ status: 'accepted' })
      .eq('id', invite.id);
    await sb
      .from('battleground_sessions')
      .update({ status: 'active', started_at: new Date().toISOString() })
      .eq('id', invite.session_id ?? '');

    set({ activeSessionId: invite.session_id, incomingInvite: null });
    // Look up host profile to show as opponent.
    const hostProfile = await resolveProfile(invite.from_user);
    useStore.getState().enterBattleground('pvp', undefined, hostProfile);
    if (invite.session_id) get().connectBoardChannel(invite.session_id);
  },

  async declineInvite(inviteId) {
    const sb = getSupabase();
    if (!sb) return;
    await sb
      .from('battleground_invites')
      .update({ status: 'declined' })
      .eq('id', inviteId);
    set({ incomingInvite: null });
  },

  persistCpuResult(score, result) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return;
    void sb.from('battleground_sessions').insert({
      host_id: me,
      kind: 'cpu',
      status: 'finished',
      host_score: score,
      guest_score: 0,
      winner_id: result === 'win' ? me : null,
      started_at: new Date(Date.now() - 300_000).toISOString(),
      finished_at: new Date().toISOString(),
    });
  },

  broadcastBoard(board, score) {
    if (!boardChannel) return;
    const now = Date.now();
    if (now - lastBroadcastAt < BROADCAST_THROTTLE_MS) return;
    lastBroadcastAt = now;
    const deck = useStore.getState().deck;
    const handSize = deck.hand.length + deck.drawPile.length;
    void boardChannel.send({
      type: 'broadcast',
      event: 'board_update',
      payload: { board, score, handSize },
    });
  },

  connectRealtime() {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return;
    if (inviteChannel) return;

    inviteChannel = sb
      .channel(`battleground:invites:${me}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'battleground_invites', filter: `to_user=eq.${me}` },
        (payload) => {
          const row = payload.new as BattlegroundInviteRow;
          if (row.status !== 'pending') return;
          // Surface toast + store invite.
          useStore.getState().enqueueToast('You received a Battleground challenge!', 'info', 8000);
          set({ incomingInvite: row });
        },
      )
      .subscribe();
  },

  connectBoardChannel(sessionId: string) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me || boardChannel) return;
    boardChannel = sb
      .channel(`battleground:board:${sessionId}`)
      .on('broadcast', { event: 'board_update' }, (msg) => {
        const { board, score, handSize } = msg.payload as { board: BoardState; score: number; handSize?: number };
        useStore.getState().updateOpponentBattleground(board, score, handSize);
      })
      .subscribe();
  },

  disconnectRealtime() {
    const sb = getSupabase();
    if (inviteChannel) { void sb?.removeChannel(inviteChannel); inviteChannel = null; }
    if (boardChannel) { void sb?.removeChannel(boardChannel); boardChannel = null; }
  },

  clearIncomingInvite() {
    set({ incomingInvite: null });
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

async function resolveProfile(userId: string): Promise<BattlegroundOpponentProfile> {
  const sb = getSupabase();
  if (!sb) return { displayName: 'Opponent', avatarId: 'pic-classic-acolyte' };
  const { data } = await sb
    .from('profiles')
    .select('display_name, avatar_id, title_id')
    .eq('id', userId)
    .maybeSingle();
  return {
    displayName: (data?.display_name as string | undefined) ?? 'Opponent',
    avatarId: (data?.avatar_id as string | undefined) ?? 'pic-classic-acolyte',
    titleId: (data?.title_id as string | null | undefined) ?? null,
  };
}
