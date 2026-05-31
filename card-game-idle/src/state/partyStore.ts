import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '@/net/supabaseClient';
import { useSocialStore } from '@/state/socialStore';
import { useStore } from '@/state/store';

export type PartyRole = 'host' | 'member';

export interface PartyMember {
  userId: string;
  displayName: string;
  avatarId: string;
  titleId: string | null;
  role: PartyRole;
  ready: boolean;
  joinedAt: string;
}

export interface PartyChatMessage {
  id: string;
  partyId: string;
  fromUser: string;
  fromDisplayName: string;
  body: string;
  createdAt: string;
}

export interface PartyInviteRow {
  id: string;
  from_user: string;
  to_user: string;
  party_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
}

export type PartyActivityDraft =
  | { type: 'battleground'; label: string }
  | { type: 'null_raid'; label: string; raidId: string; deckId: string }
  | { type: 'eternity_boss'; label: string; bossId: string; deckId: string };

interface PartyStoreState {
  activePartyId: string | null;
  members: PartyMember[];
  chat: PartyChatMessage[];
  incomingInvite: PartyInviteRow | null;
  hubOpen: boolean;
  overlayHidden: boolean;
  activityDraft: PartyActivityDraft | null;

  connectRealtime: () => Promise<void>;
  disconnectRealtime: () => void;
  refreshActiveParty: () => Promise<void>;
  createParty: () => Promise<string | null>;
  ensureParty: () => Promise<string | null>;
  inviteFriend: (userId: string) => Promise<boolean>;
  acceptInvite: (invite: PartyInviteRow) => Promise<boolean>;
  declineInvite: (inviteId: string) => Promise<void>;
  leaveParty: () => Promise<void>;
  kickMember: (userId: string) => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;
  sendMessage: (body: string) => Promise<void>;
  clearIncomingInvite: () => void;

  openHub: (draft?: PartyActivityDraft | null) => void;
  closeHub: () => void;
  setActivityDraft: (draft: PartyActivityDraft | null) => void;
  setOverlayHidden: (hidden: boolean) => void;
  toggleOverlayHidden: () => void;
}

let inviteChannel: RealtimeChannel | null = null;
let partyChannel: RealtimeChannel | null = null;

export const usePartyStore = create<PartyStoreState>((set, get) => ({
  activePartyId: null,
  members: [],
  chat: [],
  incomingInvite: null,
  hubOpen: false,
  overlayHidden: false,
  activityDraft: null,

  async connectRealtime() {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return;

    if (!inviteChannel) {
      inviteChannel = sb
        .channel(`party:invites:${me}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'party_invites', filter: `to_user=eq.${me}` },
          (payload) => {
            const row = payload.new as PartyInviteRow;
            if (row.status !== 'pending') return;
            set({ incomingInvite: row });
            useStore.getState().enqueueToast('New Card-bound party invite.', 'info', 6000);
          },
        )
        .subscribe();
    }

    await get().refreshActiveParty();
    const partyId = get().activePartyId;
    if (partyId) {
      connectPartyChannel(partyId, set, get);
    }
  },

  disconnectRealtime() {
    const sb = getSupabase();
    if (inviteChannel) {
      void sb?.removeChannel(inviteChannel);
      inviteChannel = null;
    }
    if (partyChannel) {
      void sb?.removeChannel(partyChannel);
      partyChannel = null;
    }
    set({ activePartyId: null, members: [], chat: [], incomingInvite: null, activityDraft: null, hubOpen: false });
  },

  async refreshActiveParty() {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return;

    const { data: memberships } = await sb
      .from('party_members')
      .select('party_id, joined_at')
      .eq('user_id', me)
      .order('joined_at', { ascending: false })
      .limit(10);

    const partyIds = Array.from(new Set((memberships ?? []).map(r => r.party_id).filter(Boolean)));
    let activePartyId: string | null = null;
    for (const partyId of partyIds) {
      const { data: session } = await sb
        .from('party_sessions')
        .select('id, status')
        .eq('id', partyId)
        .maybeSingle();
      if (session?.status === 'active') {
        activePartyId = session.id as string;
        break;
      }
    }

    if (!activePartyId) {
      set({ activePartyId: null, members: [], chat: [] });
      return;
    }

    const data = await fetchPartyData(activePartyId);
    set({ activePartyId, members: data.members, chat: data.chat });
  },

  async createParty() {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return null;

    const existing = await get().ensureParty();
    if (existing) return existing;

    const { data: created, error } = await sb
      .from('party_sessions')
      .insert({ host_user: me, status: 'active', max_members: 4, participant_user_ids: [me] })
      .select('id')
      .single();
    if (error || !created) {
      useStore.getState().enqueueToast('Failed to create party.', 'warning');
      return null;
    }

    const partyId = created.id as string;
    await sb.from('party_members').upsert({ party_id: partyId, user_id: me, role: 'host', ready: true }, { onConflict: 'party_id,user_id' });

    const data = await fetchPartyData(partyId);
    set({ activePartyId: partyId, members: data.members, chat: data.chat, hubOpen: true });
    connectPartyChannel(partyId, set, get);
    useStore.getState().enqueueToast('Card-bound party created.', 'success');
    return partyId;
  },

  async ensureParty() {
    await get().refreshActiveParty();
    const existing = get().activePartyId;
    if (existing) return existing;
    return null;
  },

  async inviteFriend(userId) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me || userId === me) return false;

    let partyId = get().activePartyId;
    if (!partyId) {
      partyId = await get().createParty();
      if (!partyId) return false;
    }

    const members = get().members;
    if (members.length >= 4) {
      useStore.getState().enqueueToast('Party is full (4/4).', 'warning');
      return false;
    }

    if (members.some(m => m.userId === userId)) {
      useStore.getState().enqueueToast('That player is already in your party.', 'info');
      return false;
    }

    const { error } = await sb
      .from('party_invites')
      .insert({ from_user: me, to_user: userId, party_id: partyId, status: 'pending' });

    if (error) {
      useStore.getState().enqueueToast('Could not send party invite.', 'warning');
      return false;
    }

    useStore.getState().enqueueToast('Party invite sent.', 'success');
    return true;
  },

  async acceptInvite(invite) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    if (!sb || !me) return false;

    const { data: session } = await sb
      .from('party_sessions')
      .select('status')
      .eq('id', invite.party_id)
      .maybeSingle();
    if (!session || session.status !== 'active') {
      useStore.getState().enqueueToast('That party is no longer active.', 'warning');
      await sb.from('party_invites').update({ status: 'expired' }).eq('id', invite.id);
      set({ incomingInvite: null });
      return false;
    }

    const { data: memberRows } = await sb
      .from('party_members')
      .select('user_id')
      .eq('party_id', invite.party_id);
    const alreadyCount = (memberRows ?? []).length;
    if (alreadyCount >= 4 && !(memberRows ?? []).some(r => r.user_id === me)) {
      useStore.getState().enqueueToast('Party is already full.', 'warning');
      await sb.from('party_invites').update({ status: 'expired' }).eq('id', invite.id);
      set({ incomingInvite: null });
      return false;
    }

    await sb.from('party_members').upsert({ party_id: invite.party_id, user_id: me, role: 'member', ready: false }, { onConflict: 'party_id,user_id' });
    await syncPartyParticipants(invite.party_id);
    await sb.from('party_invites').update({ status: 'accepted' }).eq('id', invite.id);

    const data = await fetchPartyData(invite.party_id);
    set({ activePartyId: invite.party_id, members: data.members, chat: data.chat, incomingInvite: null, hubOpen: true });
    connectPartyChannel(invite.party_id, set, get);
    useStore.getState().enqueueToast('Joined Card-bound party.', 'success');
    return true;
  },

  async declineInvite(inviteId) {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('party_invites').update({ status: 'declined' }).eq('id', inviteId);
    set({ incomingInvite: null });
  },

  async leaveParty() {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    const partyId = get().activePartyId;
    if (!sb || !me || !partyId) return;

    const meMember = get().members.find(m => m.userId === me);
    const isHost = meMember?.role === 'host';
    if (isHost) {
      await sb.from('party_sessions').update({ status: 'cancelled' }).eq('id', partyId);
      await sb.from('party_members').delete().eq('party_id', partyId);
      useStore.getState().enqueueToast('Party disbanded.', 'info');
    } else {
      await sb.from('party_members').delete().eq('party_id', partyId).eq('user_id', me);
      await syncPartyParticipants(partyId);
      useStore.getState().enqueueToast('You left the party.', 'info');
    }

    if (partyChannel) {
      void sb.removeChannel(partyChannel);
      partyChannel = null;
    }
    set({ activePartyId: null, members: [], chat: [], activityDraft: null, hubOpen: false });
  },

  async kickMember(userId) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    const partyId = get().activePartyId;
    if (!sb || !me || !partyId || userId === me) return;

    const meMember = get().members.find(m => m.userId === me);
    if (meMember?.role !== 'host') return;

    await sb.from('party_members').delete().eq('party_id', partyId).eq('user_id', userId);
    await syncPartyParticipants(partyId);
    await get().refreshActiveParty();
  },

  async setReady(ready) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    const partyId = get().activePartyId;
    if (!sb || !me || !partyId) return;

    await sb.from('party_members').update({ ready }).eq('party_id', partyId).eq('user_id', me);
    await get().refreshActiveParty();
  },

  async sendMessage(body) {
    const sb = getSupabase();
    const me = useSocialStore.getState().user?.id;
    const partyId = get().activePartyId;
    const msg = body.trim();
    if (!sb || !me || !partyId || !msg) return;
    await sb.from('party_messages').insert({ party_id: partyId, from_user: me, body: msg.slice(0, 240) });
  },

  clearIncomingInvite() {
    set({ incomingInvite: null });
  },

  openHub(draft) {
    set({ hubOpen: true, activityDraft: draft ?? get().activityDraft });
  },

  closeHub() {
    set({ hubOpen: false });
  },

  setActivityDraft(draft) {
    set({ activityDraft: draft });
  },

  setOverlayHidden(hidden) {
    set({ overlayHidden: hidden });
  },

  toggleOverlayHidden() {
    set(s => ({ overlayHidden: !s.overlayHidden }));
  },
}));

async function fetchPartyData(partyId: string): Promise<{ members: PartyMember[]; chat: PartyChatMessage[] }> {
  const sb = getSupabase();
  if (!sb) return { members: [], chat: [] };

  const { data: memberRows } = await sb
    .from('party_members')
    .select('user_id, role, ready, joined_at')
    .eq('party_id', partyId)
    .order('joined_at', { ascending: true });

  const memberIds = Array.from(new Set((memberRows ?? []).map(r => r.user_id).filter(Boolean)));
  const profileById = await fetchProfilesByIds(memberIds);

  const members: PartyMember[] = (memberRows ?? []).map((row) => {
    const profile = profileById.get(row.user_id);
    return {
      userId: row.user_id,
      displayName: profile?.display_name ?? 'Player',
      avatarId: profile?.avatar_id ?? 'avatar-acolyte',
      titleId: profile?.title_id ?? null,
      role: (row.role === 'host' ? 'host' : 'member') as PartyRole,
      ready: !!row.ready,
      joinedAt: row.joined_at as string,
    };
  });

  const { data: msgRows } = await sb
    .from('party_messages')
    .select('id, party_id, from_user, body, created_at')
    .eq('party_id', partyId)
    .order('created_at', { ascending: false })
    .limit(40);

  const chatUserIds = Array.from(new Set((msgRows ?? []).map(r => r.from_user).filter(Boolean)));
  const chatProfiles = await fetchProfilesByIds(chatUserIds);

  const chat: PartyChatMessage[] = (msgRows ?? [])
    .slice()
    .reverse()
    .map(row => ({
      id: row.id as string,
      partyId: row.party_id as string,
      fromUser: row.from_user as string,
      fromDisplayName: chatProfiles.get(row.from_user as string)?.display_name ?? 'Player',
      body: (row.body as string) ?? '',
      createdAt: row.created_at as string,
    }));

  return { members, chat };
}

async function syncPartyParticipants(partyId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { data } = await sb
    .from('party_members')
    .select('user_id')
    .eq('party_id', partyId);
  const participantIds = Array.from(new Set((data ?? []).map(row => row.user_id).filter(Boolean)));
  await sb.from('party_sessions').update({ participant_user_ids: participantIds }).eq('id', partyId);
}

async function fetchProfilesByIds(ids: string[]): Promise<Map<string, { display_name: string; avatar_id: string; title_id: string | null }>> {
  const sb = getSupabase();
  const byId = new Map<string, { display_name: string; avatar_id: string; title_id: string | null }>();
  if (!sb || ids.length === 0) return byId;

  const { data } = await sb
    .from('profiles')
    .select('id, display_name, avatar_id, title_id')
    .in('id', ids);

  for (const row of (data ?? [])) {
    byId.set(row.id as string, {
      display_name: (row.display_name as string) ?? 'Player',
      avatar_id: (row.avatar_id as string) ?? 'avatar-acolyte',
      title_id: (row.title_id as string | null) ?? null,
    });
  }
  return byId;
}

function connectPartyChannel(
  partyId: string,
  set: (partial: Partial<PartyStoreState> | ((state: PartyStoreState) => Partial<PartyStoreState>), replace?: false | undefined) => void,
  get: () => PartyStoreState,
): void {
  const sb = getSupabase();
  if (!sb) return;

  if (partyChannel) {
    void sb.removeChannel(partyChannel);
    partyChannel = null;
  }

  partyChannel = sb
    .channel(`party:live:${partyId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'party_members', filter: `party_id=eq.${partyId}` },
      () => {
        void get().refreshActiveParty();
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'party_messages', filter: `party_id=eq.${partyId}` },
      () => {
        void get().refreshActiveParty();
      },
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'party_sessions', filter: `id=eq.${partyId}` },
      (payload) => {
        const row = payload.new as { status?: string };
        if (row.status && row.status !== 'active') {
          set({ activePartyId: null, members: [], chat: [], activityDraft: null, hubOpen: false });
          useStore.getState().enqueueToast('Party has ended.', 'info');
        }
      },
    )
    .subscribe();
}
