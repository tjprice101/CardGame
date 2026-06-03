// coopRaidStore
// Realtime invite + progress backbone for co-op Null Raids.

import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '@/net/supabaseClient';
import { hashStringToSeed } from '@/net/coopRng';
import { useSocialStore } from '@/state/socialStore';
import { useCoopSyncStore } from '@/state/coopSyncStore';
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

export interface CoopRaidInviteTarget extends BattlegroundOpponentProfile {
  id: string;
}

export interface CoopRaidParticipantProgress {
  userId: string;
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
  participantIds: string[];
  participantProfiles: Record<string, BattlegroundOpponentProfile>;
  participantProgressByUser: Record<string, CoopRaidParticipantProgress>;

  sendInvite: (toUserId: string, toProfile: BattlegroundOpponentProfile, raidId: string, hostDeckId: string) => Promise<string | null>;
  sendInvites: (targets: CoopRaidInviteTarget[], raidId: string, hostDeckId: string) => Promise<string | null>;
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
  participantIds: [],
  participantProfiles: {},
  participantProgressByUser: {},

  async sendInvite(toUserId, toProfile, raidId, hostDeckId) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return null;

    let sessionId: string | null = null;
    let invitedUserIds: string[] = [];

    if (get().activeSessionId && get().activeRaidId === raidId && get().localSessionRole === 'host') {
      const { data: activeRow } = await sb
        .from('coop_raid_sessions')
        .select('id, status, invited_user_ids, accepted_user_ids')
        .eq('id', get().activeSessionId)
        .maybeSingle();
      if (activeRow && (activeRow.status === 'pending' || activeRow.status === 'active')) {
        sessionId = activeRow.id as string;
        invitedUserIds = (Array.isArray(activeRow.invited_user_ids) ? activeRow.invited_user_ids : []).filter(Boolean) as string[];
      }
    }

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

    if (!sessionId) {
      const { data: sessionData, error: sessionError } = await sb
        .from('coop_raid_sessions')
        .insert({
          host_id: me,
          guest_id: toUserId,
          raid_id: raidId,
          host_deck_id: hostDeckId,
          status: 'pending',
          invited_user_ids: [toUserId],
          accepted_user_ids: [],
          participant_count: 1,
        })
        .select('id, invited_user_ids')
        .single();

      if (sessionError || !sessionData) {
        console.warn('[coop-raid] failed to create session:', sessionError?.message);
        useStore.getState().enqueueToast(`Co-op raid invite failed: ${sessionError?.message ?? 'unknown error'}`, 'warning', 7000);
        return null;
      }

      sessionId = sessionData.id as string;
      invitedUserIds = (Array.isArray(sessionData.invited_user_ids) ? sessionData.invited_user_ids : []).filter(Boolean) as string[];
    } else if (!invitedUserIds.includes(toUserId)) {
      if (invitedUserIds.length >= 4) {
        useStore.getState().enqueueToast('Co-op raids support up to 5 total players.', 'warning', 7000);
        return null;
      }
      const mergedInvited = Array.from(new Set([...invitedUserIds, toUserId])).slice(0, 4);
      invitedUserIds = mergedInvited;
      await sb
        .from('coop_raid_sessions')
        .update({
          invited_user_ids: mergedInvited,
          guest_id: mergedInvited[0] ?? null,
        })
        .eq('id', sessionId);
    }

    if (invitedUserIds.length > 4) {
      useStore.getState().enqueueToast('Co-op raids support up to 5 total players.', 'warning', 7000);
      return null;
    }

    if (sessionId === null) return null;
    const { error: inviteError } = await sb
      .from('coop_raid_invites')
      .insert({ from_user: me, to_user: toUserId, session_id: sessionId, raid_id: raidId, host_deck_id: hostDeckId, status: 'pending' });

    if (inviteError) {
      console.warn('[coop-raid] failed to send invite:', inviteError.message);
      useStore.getState().enqueueToast(`Co-op raid invite failed: ${inviteError.message}`, 'warning', 7000);
      return null;
    }

    const participantIds = [me, ...invitedUserIds];
    const participantProfiles: Record<string, BattlegroundOpponentProfile> = {
      ...get().participantProfiles,
      [me]: {
        displayName: useStore.getState().progress.profile.name || 'You',
        avatarId: useStore.getState().progress.profile.avatarId || 'pic-classic-acolyte',
        titleId: useStore.getState().progress.profile.titleId ?? null,
      },
      [toUserId]: toProfile,
    };
    set({
      activeSessionId: sessionId,
      activeRaidId: raidId,
      localSessionRole: 'host',
      opponentProfile: toProfile,
      opponentProgress: null,
      participantIds,
      participantProfiles,
      participantProgressByUser: {},
    });
    if (!useCoopSyncStore.getState().attached || useCoopSyncStore.getState().sessionId !== sessionId) {
      await useCoopSyncStore.getState().attach({
        id: sessionId,
        mode: 'null_raid',
        partyId: 'legacy-party',
        hostUserId: me,
        participantIds: [me, ...invitedUserIds],
        rngSeed: hashStringToSeed(`null-raid:${sessionId}:${raidId}`),
        modePayload: { raidId, hostDeckId },
        status: 'lobby',
      });
    }
    get().connectProgressChannel(sessionId);
    useStore.getState().enqueueToast(`Co-op raid invite sent for ${raidId}.`, 'info', 5000);
    return sessionId;
  },

  async sendInvites(targets, raidId, hostDeckId) {
    const uniqueTargets = Array.from(new Map(targets.map(t => [t.id, t])).values()).slice(0, 4);
    if (uniqueTargets.length === 0) return null;

    let sessionId: string | null = null;
    for (const target of uniqueTargets) {
      const created = await get().sendInvite(target.id, {
        displayName: target.displayName,
        avatarId: target.avatarId,
        titleId: target.titleId,
      }, raidId, hostDeckId);
      if (!created) {
        if (!sessionId) return null;
        continue;
      }
      sessionId = created;
    }
    return sessionId;
  },

  async acceptInvite(invite, guestDeckId) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return;

    await sb.from('coop_raid_invites').update({ status: 'accepted' }).eq('id', invite.id);

    let participantIds: string[] = [invite.from_user, me];
    if (invite.session_id) {
      const { data: sessionData } = await sb
        .from('coop_raid_sessions')
        .select('accepted_user_ids, status')
        .eq('id', invite.session_id)
        .maybeSingle();

      const accepted = Array.isArray(sessionData?.accepted_user_ids)
        ? sessionData.accepted_user_ids.filter(Boolean)
        : [];
      const mergedAccepted = Array.from(new Set([...accepted, me])).slice(0, 4);
      participantIds = [invite.from_user, ...mergedAccepted];

      await sb
        .from('coop_raid_sessions')
        .update({
          status: 'active',
          guest_deck_id: guestDeckId,
          accepted_user_ids: mergedAccepted,
          participant_count: 1 + mergedAccepted.length,
          started_at: sessionData?.status === 'active' ? undefined : new Date().toISOString(),
        })
        .eq('id', invite.session_id);
    }

    const hostProfile = await resolveProfile(invite.from_user);
    const participantProfiles: Record<string, BattlegroundOpponentProfile> = {
      [invite.from_user]: hostProfile,
    };
    for (const userId of participantIds) {
      if (participantProfiles[userId]) continue;
      if (userId === me) {
        participantProfiles[userId] = {
          displayName: useStore.getState().progress.profile.name || 'You',
          avatarId: useStore.getState().progress.profile.avatarId || 'pic-classic-acolyte',
          titleId: useStore.getState().progress.profile.titleId ?? null,
        };
      } else {
        participantProfiles[userId] = await resolveProfile(userId);
      }
    }
    set({
      incomingInvite: null,
      activeSessionId: invite.session_id,
      activeRaidId: invite.raid_id,
      localSessionRole: 'guest',
      opponentProfile: hostProfile,
      opponentProgress: null,
      participantIds,
      participantProfiles,
      participantProgressByUser: {},
    });

    if (invite.session_id) get().connectProgressChannel(invite.session_id);
    if (invite.session_id) {
      await useCoopSyncStore.getState().attach({
        id: invite.session_id,
        mode: 'null_raid',
        partyId: 'legacy-party',
        hostUserId: invite.from_user,
        participantIds,
        rngSeed: hashStringToSeed(`null-raid:${invite.session_id}:${invite.raid_id}`),
        modePayload: { raidId: invite.raid_id, guestDeckId },
        status: 'active',
      });
    }
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
        { event: 'UPDATE', schema: 'public', table: 'coop_raid_sessions' },
        (payload) => {
          const row = payload.new as {
            id: string;
            status: 'pending' | 'active' | 'finished' | 'cancelled';
            host_id: string;
            guest_id?: string | null;
            raid_id: string;
            host_deck_id: string | null;
            invited_user_ids?: string[] | null;
            accepted_user_ids?: string[] | null;
            per_user_progress?: Record<string, unknown> | null;
            host_total_damage?: number;
            guest_total_damage?: number;
            completed_encounters?: number;
          };
          const invited = Array.isArray(row.invited_user_ids) ? row.invited_user_ids.filter(Boolean) : [];
          const accepted = Array.isArray(row.accepted_user_ids) ? row.accepted_user_ids.filter(Boolean) : [];
          const participantIds = Array.from(new Set([row.host_id, ...accepted]));
          const isParticipant = row.host_id === me || row.guest_id === me || invited.includes(me) || accepted.includes(me);
          if (!isParticipant) return;
          if (get().activeSessionId !== row.id) return;

          set(s => ({
            participantIds,
            participantProgressByUser: {
              ...s.participantProgressByUser,
              ...(typeof row.per_user_progress === 'object' && row.per_user_progress
                ? Object.entries(row.per_user_progress).reduce<Record<string, CoopRaidParticipantProgress>>((acc, [userId, value]) => {
                    const v = (value ?? {}) as Record<string, unknown>;
                    acc[userId] = {
                      userId,
                      encounterIndex: Number(v.encounterIndex ?? 0),
                      totalDamage: Number(v.totalDamage ?? 0),
                      completedEncounters: Number(v.completedEncounters ?? 0),
                      updatedAt: Date.now(),
                    };
                    return acc;
                  }, {})
                : {}),
            },
          }));

          void resolveProfiles(participantIds).then((profiles) => {
            set(s => ({
              participantProfiles: { ...s.participantProfiles, ...profiles },
            }));
          });

          if (row.status === 'finished' || row.status === 'cancelled') {
            const state = useStore.getState();
            if (state.bossFight.mode === 'active' && state.bossFight.kind === 'null_raid') {
              state.forfeitBossFight();
              state.enqueueToast(
                row.status === 'cancelled'
                  ? 'Null raid session cancelled due to disconnects.'
                  : 'Null raid session finished.',
                row.status === 'cancelled' ? 'warning' : 'info',
                7000,
              );
            }
            void get().completeActiveSession();
            return;
          }

          if (row.status === 'active' && get().localSessionRole === 'host' && row.host_deck_id) {
            const launchOk = useStore.getState().startNullRaid(row.raid_id, row.host_deck_id);
            if (!launchOk) {
              useStore.getState().enqueueToast('Co-op raid session active, but local launch failed. Check deck/cooldown/energy.', 'warning', 7000);
            }
          }

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
        const payload = msg.payload as { userId?: string; encounterIndex: number; totalDamage: number; completedEncounters: number };
        const userId = String(payload.userId ?? '');
        if (!userId) return;
        set({
          opponentProgress: {
            encounterIndex: payload.encounterIndex ?? 0,
            totalDamage: payload.totalDamage ?? 0,
            completedEncounters: payload.completedEncounters ?? 0,
            updatedAt: Date.now(),
          },
          participantProgressByUser: {
            ...get().participantProgressByUser,
            [userId]: {
              userId,
              encounterIndex: payload.encounterIndex ?? 0,
              totalDamage: payload.totalDamage ?? 0,
              completedEncounters: payload.completedEncounters ?? 0,
              updatedAt: Date.now(),
            },
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
    const me = useSocialStore.getState().user?.id;
    if (me) {
      set({
        participantProgressByUser: {
          ...get().participantProgressByUser,
          [me]: {
            userId: me,
            encounterIndex,
            totalDamage,
            completedEncounters,
            updatedAt: Date.now(),
          },
        },
      });
    }
    if (sb && sessionId && role) {
      const patch = role === 'host'
        ? { host_encounter_index: encounterIndex, host_total_damage: totalDamage, completed_encounters: completedEncounters }
        : { guest_encounter_index: encounterIndex, guest_total_damage: totalDamage, completed_encounters: completedEncounters };
      void sb.from('coop_raid_sessions').update(patch).eq('id', sessionId);
    }

    void progressChannel.send({
      type: 'broadcast',
      event: 'progress_update',
      payload: { userId: me, encounterIndex, totalDamage, completedEncounters },
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
    void detachSyncIfMatches(get().activeSessionId);
    set({
      activeSessionId: null,
      activeRaidId: null,
      localSessionRole: null,
      opponentProfile: null,
      opponentProgress: null,
      participantIds: [],
      participantProfiles: {},
      participantProgressByUser: {},
    });
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
    await detachSyncIfMatches(sessionId);
    set({
      activeSessionId: null,
      activeRaidId: null,
      localSessionRole: null,
      opponentProfile: null,
      opponentProgress: null,
      participantIds: [],
      participantProfiles: {},
      participantProgressByUser: {},
    });
  },
}));

async function detachSyncIfMatches(sessionId: string | null): Promise<void> {
  if (!sessionId) return;
  const sync = useCoopSyncStore.getState();
  if (!sync.attached || sync.sessionId !== sessionId) return;
  await sync.detach();
}

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

async function resolveProfiles(userIds: string[]): Promise<Record<string, BattlegroundOpponentProfile>> {
  const out: Record<string, BattlegroundOpponentProfile> = {};
  for (const userId of Array.from(new Set(userIds.filter(Boolean)))) {
    out[userId] = await resolveProfile(userId);
  }
  return out;
}
