import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '@/net/supabaseClient';
import { useSocialStore } from '@/state/socialStore';
import { useStore } from '@/state/store';
import type { BattlegroundOpponentProfile } from '@/types/battleground';

export interface EternityBossCoopInviteRow {
  id: string;
  from_user: string;
  to_user: string;
  session_id: string | null;
  boss_id: string;
  host_deck_id: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
}

export interface EternityBossInviteTarget extends BattlegroundOpponentProfile {
  id: string;
}

interface EternityBossSessionRow {
  id: string;
  host_id: string;
  boss_id: string;
  host_deck_id: string | null;
  status: 'pending' | 'active' | 'finished' | 'cancelled';
  participant_count: number;
  invited_user_ids: string[] | null;
  accepted_user_ids: string[] | null;
}

interface EternityBossCoopStoreState {
  incomingInvite: EternityBossCoopInviteRow | null;
  activeSessionId: string | null;
  activeBossId: string | null;
  localSessionRole: 'host' | 'guest' | null;
  partySize: number;

  sendInvites: (targets: EternityBossInviteTarget[], bossId: string, hostDeckId: string) => Promise<string | null>;
  acceptInvite: (invite: EternityBossCoopInviteRow, guestDeckId: string) => Promise<void>;
  declineInvite: (inviteId: string) => Promise<void>;
  connectRealtime: () => void;
  disconnectRealtime: () => void;
  clearIncomingInvite: () => void;
  clearSession: () => void;
  completeActiveSession: () => Promise<void>;
}

let inviteChannel: RealtimeChannel | null = null;
let sessionChannel: RealtimeChannel | null = null;

export const useEternityBossCoopStore = create<EternityBossCoopStoreState>((set, get) => ({
  incomingInvite: null,
  activeSessionId: null,
  activeBossId: null,
  localSessionRole: null,
  partySize: 1,

  async sendInvites(targets, bossId, hostDeckId) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return null;
    if (targets.length === 0 || targets.length > 2) return null;

    const uniqueTargets = Array.from(new Map(targets.map(t => [t.id, t])).values());
    const invitedUserIds = uniqueTargets.map(t => t.id);

    const { data: sessionData, error: sessionError } = await sb
      .from('eternity_wake_coop_sessions')
      .insert({
        host_id: me,
        boss_id: bossId,
        host_deck_id: hostDeckId,
        status: 'pending',
        participant_count: 1,
        invited_user_ids: invitedUserIds,
      })
      .select('id')
      .single();

    if (sessionError || !sessionData) {
      console.warn('[eternity-coop] failed to create session:', sessionError?.message);
      return null;
    }

    const sessionId = sessionData.id as string;

    const inviteRows = uniqueTargets.map(t => ({
      from_user: me,
      to_user: t.id,
      session_id: sessionId,
      boss_id: bossId,
      host_deck_id: hostDeckId,
      status: 'pending' as const,
    }));

    // Expire any prior pending invites for this (me, target, boss) tuple so
    // we don't trip a partial unique index on resend.
    for (const t of uniqueTargets) {
      await sb
        .from('eternity_wake_coop_invites')
        .update({ status: 'expired' })
        .eq('from_user', me)
        .eq('to_user', t.id)
        .eq('boss_id', bossId)
        .eq('status', 'pending');
    }

    const { error: inviteError } = await sb
      .from('eternity_wake_coop_invites')
      .insert(inviteRows);

    if (inviteError) {
      console.warn('[eternity-coop] failed to send invites:', inviteError.message);
      useStore.getState().enqueueToast(`Co-op boss invite failed: ${inviteError.message}`, 'warning', 7000);
      return null;
    }

    set({
      activeSessionId: sessionId,
      activeBossId: bossId,
      localSessionRole: 'host',
      partySize: 1,
    });
    useStore.getState().recordSocialProgress('coop_boss_invite_sent', uniqueTargets.length);

    useStore.getState().enqueueToast(
      uniqueTargets.length === 1
        ? `Co-op boss invite sent to ${uniqueTargets[0].displayName}.`
        : `Co-op boss invites sent to ${uniqueTargets.length} friends.`,
      'success',
      6000,
    );

    return sessionId;
  },

  async acceptInvite(invite, guestDeckId) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return;

    await sb
      .from('eternity_wake_coop_invites')
      .update({ status: 'accepted' })
      .eq('id', invite.id);

    let partySize = 2;

    if (invite.session_id) {
      const { data: sessionData } = await sb
        .from('eternity_wake_coop_sessions')
        .select('accepted_user_ids, participant_count, status')
        .eq('id', invite.session_id)
        .maybeSingle();

      const accepted = Array.isArray(sessionData?.accepted_user_ids)
        ? sessionData.accepted_user_ids.filter(Boolean)
        : [];
      const mergedAccepted = Array.from(new Set([...accepted, me])).slice(0, 2);
      partySize = 1 + mergedAccepted.length;

      await sb
        .from('eternity_wake_coop_sessions')
        .update({
          status: 'active',
          accepted_user_ids: mergedAccepted,
          participant_count: partySize,
          started_at: sessionData?.status === 'active' ? undefined : new Date().toISOString(),
        })
        .eq('id', invite.session_id);
    }

    set({
      incomingInvite: null,
      activeSessionId: invite.session_id,
      activeBossId: invite.boss_id,
      localSessionRole: 'guest',
      partySize,
    });
    useStore.getState().recordSocialProgress('coop_boss_invite_accepted');

    useStore.getState().startBossFight(invite.boss_id, guestDeckId, {
      kind: 'normal',
      coopPartySize: partySize,
      coopSessionId: invite.session_id ?? undefined,
      coopRole: 'guest',
    });

    useStore.getState().enqueueToast(`Joined co-op boss fight for ${invite.boss_id}.`, 'success', 6000);
  },

  async declineInvite(inviteId) {
    const sb = getSupabase();
    if (!sb) return;
    await sb
      .from('eternity_wake_coop_invites')
      .update({ status: 'declined' })
      .eq('id', inviteId);
    set({ incomingInvite: null });
  },

  connectRealtime() {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return;

    if (!inviteChannel) {
      inviteChannel = sb
        .channel(`eternity-coop:invites:${me}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'eternity_wake_coop_invites', filter: `to_user=eq.${me}` },
          (payload) => {
            const row = payload.new as EternityBossCoopInviteRow;
            if (row.status !== 'pending') return;
            set({ incomingInvite: row });
            void resolveDisplayName(row.from_user).then((name) => {
              useStore.getState().enqueueToast(`New co-op boss invite from ${name}.`, 'info', 8000);
            });
          },
        )
        .subscribe((status, err) => {
          console.log(`[eternity-coop] invite channel status: ${status}`, err ?? '');
        });
    }

    if (!sessionChannel) {
      sessionChannel = sb
        .channel(`eternity-coop:sessions:${me}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'eternity_wake_coop_sessions', filter: `host_id=eq.${me}` },
          (payload) => {
            const row = payload.new as EternityBossSessionRow;
            if (!row?.id || get().activeSessionId !== row.id) return;

            set({ partySize: Math.max(1, Math.min(3, row.participant_count ?? 1)) });

            if (row.status !== 'active' || !row.host_deck_id) return;
            const state = useStore.getState();
            if (state.bossFight.mode === 'active') return;

            state.startBossFight(row.boss_id, row.host_deck_id, {
              kind: 'normal',
              coopPartySize: Math.max(1, Math.min(3, row.participant_count ?? 1)),
              coopSessionId: row.id,
              coopRole: 'host',
            });
          },
        )
        .subscribe();
    }
  },

  disconnectRealtime() {
    const sb = getSupabase();
    if (inviteChannel) {
      void sb?.removeChannel(inviteChannel);
      inviteChannel = null;
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
    set({ activeSessionId: null, activeBossId: null, localSessionRole: null, partySize: 1 });
  },

  async completeActiveSession() {
    const sb = getSupabase();
    const sessionId = get().activeSessionId;
    if (sb && sessionId) {
      await sb
        .from('eternity_wake_coop_sessions')
        .update({ status: 'finished', finished_at: new Date().toISOString() })
        .eq('id', sessionId);
    }
    set({ activeSessionId: null, activeBossId: null, localSessionRole: null, partySize: 1 });
  },
}));

async function resolveDisplayName(userId: string): Promise<string> {
  const sb = getSupabase();
  if (!sb) return 'A friend';

  const { data } = await sb
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .maybeSingle();

  return (data?.display_name as string | undefined) ?? 'A friend';
}
