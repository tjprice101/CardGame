import { isSupabaseConfigured } from '@/net/supabaseClient';
import { useMessagesStore } from '@/state/messagesStore';
import { useSocialStore } from '@/state/socialStore';
import { useStore } from '@/state/store';

let installed = false;
let unsubscribeSocial: (() => void) | null = null;
let unsubscribeProfile: (() => void) | null = null;
let pendingSyncTimer: ReturnType<typeof setTimeout> | null = null;
let appliedUserId: string | null = null;

const PROFILE_SYNC_DEBOUNCE_MS = 900;

function scheduleProfileSync(): void {
  if (pendingSyncTimer) return;
  pendingSyncTimer = setTimeout(() => {
    pendingSyncTimer = null;
    void runProfileSync();
  }, PROFILE_SYNC_DEBOUNCE_MS);
}

async function runProfileSync(): Promise<void> {
  const social = useSocialStore.getState();
  if (social.status !== 'authenticated' || !social.profile) return;
  const profile = useStore.getState().progress.profile;
  await social.syncOwnProfile({
    displayName: profile.name,
    bio: profile.bio ?? '',
    avatarId: profile.avatarId,
    titleId: profile.titleId,
    uiThemeId: profile.uiThemeId ?? null,
    customUiTheme: profile.customUiTheme ?? null,
    signatureCardIds: profile.signatureCardIds ?? [],
  });
}

export function initAccountSync(): void {
  if (installed) return;
  installed = true;

  if (isSupabaseConfigured()) {
    void useSocialStore.getState().initialize();
  }

  unsubscribeSocial = useSocialStore.subscribe((state, prev) => {
    const becameAuthed = state.status === 'authenticated' && prev.status !== 'authenticated';
    const changedUser = state.user?.id && state.user.id !== prev.user?.id;
    const profileBecameAvailable = !!state.profile && !prev.profile;
    const changedProfileId = !!state.profile?.id && state.profile.id !== prev.profile?.id;

    if (state.status === 'authenticated' && state.profile && (becameAuthed || changedUser || profileBecameAvailable || changedProfileId)) {
      if (appliedUserId !== state.profile.id) {
        appliedUserId = state.profile.id;
        useStore.getState().applyRemoteProfile({
          name: state.profile.displayName,
          bio: state.profile.bio ?? '',
          avatarId: state.profile.avatarId,
          titleId: state.profile.titleId,
          uiThemeId: state.profile.uiThemeId,
          customUiTheme: state.profile.customUiTheme,
          signatureCardIds: state.profile.signatureCardIds,
        });
      }
      void useMessagesStore.getState().loadThreads();
      scheduleProfileSync();
      return;
    }

    if (state.status !== 'authenticated' && prev.status === 'authenticated') {
      appliedUserId = null;
      if (pendingSyncTimer) {
        clearTimeout(pendingSyncTimer);
        pendingSyncTimer = null;
      }
    }
  });

  unsubscribeProfile = useStore.subscribe((state, prev) => {
    const social = useSocialStore.getState();
    if (social.status !== 'authenticated' || !social.profile) return;
    if (state.progress.profile === prev.progress.profile) return;
    scheduleProfileSync();
  });

  // Bootstrap path: if auth/profile already exist before this service
  // subscribes, immediately apply remote profile + start sync behavior.
  const current = useSocialStore.getState();
  if (current.status === 'authenticated' && current.profile) {
    if (appliedUserId !== current.profile.id) {
      appliedUserId = current.profile.id;
      useStore.getState().applyRemoteProfile({
        name: current.profile.displayName,
        bio: current.profile.bio ?? '',
        avatarId: current.profile.avatarId,
        titleId: current.profile.titleId,
        uiThemeId: current.profile.uiThemeId,
        customUiTheme: current.profile.customUiTheme,
        signatureCardIds: current.profile.signatureCardIds,
      });
    }
    void useMessagesStore.getState().loadThreads();
    scheduleProfileSync();
  }
}

export function shutdownAccountSync(): void {
  if (pendingSyncTimer) {
    clearTimeout(pendingSyncTimer);
    pendingSyncTimer = null;
  }
  if (unsubscribeSocial) {
    unsubscribeSocial();
    unsubscribeSocial = null;
  }
  if (unsubscribeProfile) {
    unsubscribeProfile();
    unsubscribeProfile = null;
  }
  appliedUserId = null;
  installed = false;
}
