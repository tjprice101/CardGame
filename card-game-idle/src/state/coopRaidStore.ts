// coopRaidStore
// Realtime invite + progress backbone for co-op Null Raids.

import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '@/net/supabaseClient';
import { useSocialStore } from '@/state/socialStore';
import { useStore } from '@/state/store';
import type { BattlegroundOpponentProfile } from '@/types/battleground';

export interface CoopRaidInviteRow {
  id: string;
  from_user: string;
  to_user: string;
  session_id: string | null;
  raid_id: string;
  host_deck_id: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
}

export interface CoopRaidOpponentProgress {
  encounterIndex: number;
  totalDamage: number;
  completedEncounters: number;
  updatedAt: number;
}

interface CoopRaidStoreState {
  incomingInvite: CoopRaidInviteRow | null;
  activeSessionId: string | null;
  activeRaidId: string | null;
  localSessionRole: 'host' | 'guest' | null;
  opponentProfile: BattlegroundOpponentProfile | null;
  opponentProgress: CoopRaidOpponentProgress | null;

  sendInvite: (toUserId: string, toProfile: BattlegroundOpponentProfile, raidId: string, hostDeckId: string) => Promise<string | null>;
  acceptInvite: (invite: CoopRaidInviteRow, guestDeckId: string) => Promise<void>;
  declineInvite: (inviteId: string) => Promise<void>;
  connectRealtime: () => void;
  disconnectRealtime: () => void;
  connectProgressChannel: (sessionId: string) => void;
  broadcastProgress: (encounterIndex: number, totalDamage: number, completedEncounters: number) => void;
  clearIncomingInvite: () => void;
  clearSession: () => void;
  completeActiveSession: () => Promise<void>;
}

let inviteChannel: RealtimeChannel | null = null;
let progressChannel: RealtimeChannel | null = null;
let sessionChannel: RealtimeChannel | null = null;

let lastBroadcastAt = 0;
const BROADCAST_THROTTLE_MS = 1_000;

export const useCoopRaidStore = create<CoopRaidStoreState>((set, get) => ({
  incomingInvite: null,
  activeSessionId: null,
  activeRaidId: null,
  localSessionRole: null,
  opponentProfile: null,
  opponentProgress: null,

  async sendInvite(toUserId, toProfile, raidId, hostDeckId) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return null;

    // Expire any prior pending invite for this (me, toUser, raidId) tuple so
    // we don't trip the partial unique index (`status = 'pending'`) and end
    // up unable to send/resend either direction.
    await sb
      .from('coop_raid_invites')
      .update({ status: 'expired' })
      .eq('from_user', me)
      .eq('to_user', toUserId)
      .eq('raid_id', raidId)
      .eq('status', 'pending');

    const { data: sessionData, error: sessionError } = await sb
      .from('coop_raid_sessions')
      .insert({ host_id: me, guest_id: toUserId, raid_id: raidId, host_deck_id: hostDeckId, status: 'pending' })
      .select('id')
      .single();

    if (sessionError || !sessionData) {
      console.warn('[coop-raid] failed to create session:', sessionError?.message);
      useStore.getState().enqueueToast(`Co-op raid invite failed: ${sessionError?.message ?? 'unknown error'}`, 'warning', 7000);
      return null;
    }

    const sessionId = sessionData.id as string;
    const { error: inviteError } = await sb
      .from('coop_raid_invites')
      .insert({ from_user: me, to_user: toUserId, session_id: sessionId, raid_id: raidId, host_deck_id: hostDeckId, status: 'pending' });

    if (inviteError) {
      console.warn('[coop-raid] failed to send invite:', inviteError.message);
      useStore.getState().enqueueToast(`Co-op raid invite failed: ${inviteError.message}`, 'warning', 7000);
      return null;
    }

    set({ activeSessionId: sessionId, activeRaidId: raidId, localSessionRole: 'host', opponentProfile: toProfile, opponentProgress: null });
    get().connectProgressChannel(sessionId);
    useStore.getState().enqueueToast(`Co-op raid invite sent for ${raidId}.`, 'info', 5000);
    return sessionId;
  },

  async acceptInvite(invite, guestDeckId) {
    const sb = getSupabase();
    if (!sb) return;

    await sb.from('coop_raid_invites').update({ status: 'accepted' }).eq('id', invite.id);
    await sb
      .from('coop_raid_sessions')
      .update({ status: 'active', guest_deck_id: guestDeckId, started_at: new Date().toISOString() })
      .eq('id', invite.session_id ?? '');

    const hostProfile = await resolveProfile(invite.from_user);
    set({
      incomingInvite: null,
      activeSessionId: invite.session_id,
      activeRaidId: invite.raid_id,
      localSessionRole: 'guest',
      opponentProfile: hostProfile,
      opponentProgress: null,
    });

    if (invite.session_id) get().connectProgressChannel(invite.session_id);
    const launchOk = useStore.getState().startNullRaid(invite.raid_id, guestDeckId);
    if (!launchOk) {
      useStore.getState().enqueueToast('Joined co-op session, but local raid launch failed. Check deck/cooldown/energy.', 'warning', 7000);
    }
    useStore.getState().enqueueToast(`Joined co-op raid ${invite.raid_id}.`, 'success', 5000);
  },

  async declineInvite(inviteId) {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('coop_raid_invites').update({ status: 'declined' }).eq('id', inviteId);
    set({ incomingInvite: null });
  },

  connectRealtime() {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return;
    if (inviteChannel) return;

    inviteChannel = sb
      .channel(`coop-raid:invites:${me}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'coop_raid_invites', filter: `to_user=eq.${me}` },
        (payload) => {
          const row = payload.new as CoopRaidInviteRow;
          if (row.status !== 'pending') return;
          useStore.getState().enqueueToast(`Incoming co-op raid invite for ${row.raid_id}.`, 'info', 8000);
          set({ incomingInvite: row });
        },
      )
      .subscribe((status, err) => {
        console.log(`[coop-raid] invite channel status: ${status}`, err ?? '');
      });

    sessionChannel = sb
      .channel(`coop-raid:sessions:${me}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'coop_raid_sessions', filter: `host_id=eq.${me}` },
        (payload) => {
          const row = payload.new as {
            id: string;
            status: 'pending' | 'active' | 'finished' | 'cancelled';
            raid_id: string;
            host_deck_id: string | null;
            host_total_damage?: number;
            guest_total_damage?: number;
            completed_encounters?: number;
          };
          if (row.status !== 'active') return;
          if (get().activeSessionId !== row.id) return;
          if (row.host_deck_id) {
            const launchOk = useStore.getState().startNullRaid(row.raid_id, row.host_deck_id);
            if (!launchOk) {
              useStore.getState().enqueueToast('Co-op raid session active, but local launch failed. Check deck/cooldown/energy.', 'warning', 7000);
            }
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'coop_raid_sessions', filter: `guest_id=eq.${me}` },
        (payload) => {
          const row = payload.new as {
            host_total_damage?: number;
            guest_total_damage?: number;
            completed_encounters?: number;
          };
          set(s => {
            if (!s.opponentProgress) return {};
            return {
              opponentProgress: {
                ...s.opponentProgress,
                totalDamage: (row.host_total_damage ?? 0),
                completedEncounters: (row.completed_encounters ?? s.opponentProgress.completedEncounters),
                updatedAt: Date.now(),
              },
            };
          });
        },
      )
      .subscribe();
  },

  connectProgressChannel(sessionId) {
    const sb = getSupabase();
    if (!sb) return;
    if (progressChannel) return;

    progressChannel = sb
      .channel(`coop-raid:progress:${sessionId}`)
      .on('broadcast', { event: 'progress_update' }, (msg) => {
        const payload = msg.payload as { encounterIndex: number; totalDamage: number; completedEncounters: number };
        set({
          opponentProgress: {
            encounterIndex: payload.encounterIndex ?? 0,
            totalDamage: payload.totalDamage ?? 0,
            completedEncounters: payload.completedEncounters ?? 0,
            updatedAt: Date.now(),
          },
        });
      })
      .subscribe();
  },

  broadcastProgress(encounterIndex, totalDamage, completedEncounters) {
    if (!progressChannel) return;
    const now = Date.now();
    if (now - lastBroadcastAt < BROADCAST_THROTTLE_MS) return;
    lastBroadcastAt = now;

    const sb = getSupabase();
    const sessionId = get().activeSessionId;
    const role = get().localSessionRole;
    if (sb && sessionId && role) {
      const patch = role === 'host'
        ? { host_encounter_index: encounterIndex, host_total_damage: totalDamage, completed_encounters: completedEncounters }
        : { guest_encounter_index: encounterIndex, guest_total_damage: totalDamage, completed_encounters: completedEncounters };
      void sb.from('coop_raid_sessions').update(patch).eq('id', sessionId);
    }

    void progressChannel.send({
      type: 'broadcast',
      event: 'progress_update',
      payload: { encounterIndex, totalDamage, completedEncounters },
    });
  },

  disconnectRealtime() {
    const sb = getSupabase();
    if (inviteChannel) {
      void sb?.removeChannel(inviteChannel);
      inviteChannel = null;
    }
    if (progressChannel) {
      void sb?.removeChannel(progressChannel);
      progressChannel = null;
    }
    if (sessionChannel) {
      void sb?.removeChannel(sessionChannel);
      sessionChannel = null;
    }
  },

  clearIncomingInvite() {
    set({ incomingInvite: null });
  },

  clearSession() {
    set({ activeSessionId: null, activeRaidId: null, localSessionRole: null, opponentProfile: null, opponentProgress: null });
  },

  async completeActiveSession() {
    const sb = getSupabase();
    const sessionId = get().activeSessionId;
    if (sb && sessionId) {
      await sb
        .from('coop_raid_sessions')
        .update({ status: 'finished', finished_at: new Date().toISOString() })
        .eq('id', sessionId);
    }
    set({ activeSessionId: null, activeRaidId: null, localSessionRole: null, opponentProfile: null, opponentProgress: null });
  },
}));

async function resolveProfile(userId: string): Promise<BattlegroundOpponentProfile> {
  const sb = getSupabase();
  if (!sb) return { displayName: 'Raid Partner', avatarId: 'pic-classic-acolyte' };

  const { data } = await sb
    .from('profiles')
    .select('display_name, avatar_id, title_id')
    .eq('id', userId)
    .maybeSingle();

  return {
    displayName: (data?.display_name as string | undefined) ?? 'Raid Partner',
    avatarId: (data?.avatar_id as string | undefined) ?? 'pic-classic-acolyte',
    titleId: (data?.title_id as string | null | undefined) ?? null,
  };
}
