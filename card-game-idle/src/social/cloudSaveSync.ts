import { getSupabase } from '@/net/supabaseClient';
import { useSocialStore } from '@/state/socialStore';
import { useStore } from '@/state/store';
import { SaveManager } from '@/save/SaveManager';
import { createSaveStorage } from '@/save/storage';
import type { GameState } from '@/types/game';

interface CloudSaveRow {
  user_id: string;
  payload_export: string;
  saved_at_ms: number;
}

function applyAuthedSocialProfile(state: GameState): void {
  const socialProfile = useSocialStore.getState().profile;
  if (!socialProfile) return;
  state.progress.profile.name = socialProfile.displayName.trim().slice(0, 24) || state.progress.profile.name;
  state.progress.profile.bio = (socialProfile.bio ?? '').slice(0, 200);
  state.progress.profile.avatarId = socialProfile.avatarId;
  state.progress.profile.titleId = socialProfile.titleId;
  state.progress.profile.uiThemeId = socialProfile.uiThemeId ?? state.progress.profile.uiThemeId;
  state.progress.profile.customUiTheme = socialProfile.customUiTheme;
  state.progress.profile.signatureCardIds = Array.isArray(socialProfile.signatureCardIds)
    ? socialProfile.signatureCardIds.slice(0, 5)
    : [];
}

let installed = false;
let unsubscribeAuth: (() => void) | null = null;
let unsubscribeStore: (() => void) | null = null;
let pendingUploadTimer: ReturnType<typeof setTimeout> | null = null;
let reconciling = false;
let lastUploadedSavedAt = 0;
let activeUserId: string | null = null;
// Tracks which user id we have already reconciled in this session. Prevents
// a spurious authenticated -> loading -> authenticated status flicker from
// re-running reconcileOnLogin and silently replacing live in-memory state
// (e.g. an active or just-finished boss fight) with the autosaved cloud copy.
let reconciledUserId: string | null = null;

const UPLOAD_DEBOUNCE_MS = 5000;

function makeSaveManager(): SaveManager {
  return new SaveManager(() => useStore.getState() as unknown as GameState, createSaveStorage());
}

async function fetchCloudSave(userId: string): Promise<CloudSaveRow | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('cloud_saves')
    .select('user_id, payload_export, saved_at_ms')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    user_id: data.user_id,
    payload_export: data.payload_export,
    saved_at_ms: Number(data.saved_at_ms ?? 0),
  };
}

async function uploadCloudSave(userId: string, payloadExport: string, savedAtMs: number): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb
    .from('cloud_saves')
    .upsert({
      user_id: userId,
      payload_export: payloadExport,
      saved_at_ms: savedAtMs,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  if (error) throw error;
  lastUploadedSavedAt = Math.max(lastUploadedSavedAt, savedAtMs);
}

async function reconcileOnLogin(userId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  reconciling = true;
  try {
    const mgr = makeSaveManager();
    // Read existing local save first. Do not force-save before comparing,
    // otherwise a freshly booted default state can overwrite remote cloud
    // data after local storage was cleared.
    const localLoaded = mgr.loadWithStatus();
    const localExport = localLoaded ? mgr.exportSave() : null;
    const remote = await fetchCloudSave(userId);

    if (!remote) {
      const localSavedAt = localLoaded?.state.lastSavedAt ?? 0;
      if (localLoaded && localExport && localSavedAt > 0) {
        await uploadCloudSave(userId, localExport, localSavedAt);
      }
      return;
    }

    // Account cloud payload is authoritative whenever it exists.
    // This guarantees that logging in restores the account state, even if a
    // local/default save has a newer timestamp due to boot/autosave races.
    const imported = mgr.importSave(remote.payload_export);
    if (!imported) {
      // Remote row is unreadable/corrupt: salvage by uploading local if we have one.
      const localSavedAt = localLoaded?.state.lastSavedAt ?? 0;
      if (localLoaded && localExport && localSavedAt > 0) {
        await uploadCloudSave(userId, localExport, localSavedAt);
      }
      return;
    }
    // Defense-in-depth: never blow away an active or unresolved combat session
    // with a cloud snapshot. Bank the remote save's lastSavedAt floor for the
    // upload watermark so we don't immediately re-upload a stale local copy on
    // top of it, but keep the live in-memory state intact.
    const liveState = useStore.getState();
    const bossMode = liveState.bossFight?.mode;
    const battlegroundMode = liveState.battleground?.mode;
    const fightActive =
      bossMode === 'active' || bossMode === 'victory' || bossMode === 'defeat'
      || battlegroundMode === 'active';
    if (fightActive) {
      // eslint-disable-next-line no-console
      console.warn('[cloudSaveSync] skipping reconcile loadState: active/unresolved fight in progress');
      lastUploadedSavedAt = Math.max(remote.saved_at_ms, imported.state.lastSavedAt ?? 0);
      return;
    }
    applyAuthedSocialProfile(imported.state);
    useStore.getState().loadState(imported.state);
    useStore.setState({ saveTampered: imported.tampered });
    lastUploadedSavedAt = Math.max(remote.saved_at_ms, imported.state.lastSavedAt ?? 0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[cloudSaveSync] login reconcile failed:', err);
  } finally {
    reconciling = false;
  }
}

function scheduleUpload(): void {
  if (pendingUploadTimer) return;
  pendingUploadTimer = setTimeout(() => {
    pendingUploadTimer = null;
    void uploadIfNeeded();
  }, UPLOAD_DEBOUNCE_MS);
}

async function uploadIfNeeded(): Promise<void> {
  if (reconciling) return;
  const userId = useSocialStore.getState().user?.id ?? null;
  if (!userId || userId !== activeUserId) return;

  const localSavedAt = useStore.getState().lastSavedAt ?? 0;
  if (!Number.isFinite(localSavedAt) || localSavedAt <= 0) return;
  if (localSavedAt <= lastUploadedSavedAt) return;

  try {
    const mgr = makeSaveManager();
    const exported = mgr.exportSave();
    if (!exported) return;
    await uploadCloudSave(userId, exported, localSavedAt);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[cloudSaveSync] upload failed:', err);
  }
}

export async function flushCloudSaveNow(): Promise<void> {
  if (reconciling) return;
  const userId = useSocialStore.getState().user?.id ?? null;
  if (!userId) return;
  activeUserId = userId;
  try {
    const mgr = makeSaveManager();
    // Ensure local envelope reflects current in-memory state before upload.
    mgr.save();
    const loaded = mgr.loadWithStatus();
    const savedAt = loaded?.state.lastSavedAt ?? Date.now();
    const exported = mgr.exportSave();
    if (!exported) return;
    await uploadCloudSave(userId, exported, savedAt);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[cloudSaveSync] immediate flush failed:', err);
  }
}

export function initCloudSaveSync(): void {
  if (installed) return;
  installed = true;

  unsubscribeAuth = useSocialStore.subscribe((state, prev) => {
    const authed = state.status === 'authenticated' && !!state.user?.id;
    const wasAuthed = prev.status === 'authenticated' && !!prev.user?.id;

    if (authed && (!wasAuthed || prev.user?.id !== state.user?.id)) {
      // Skip the reconcile when we've already reconciled this user in the
      // current session. This blocks the spurious authenticated -> loading ->
      // authenticated flicker from re-running a destructive loadState.
      if (reconciledUserId === state.user!.id) {
        activeUserId = state.user!.id;
        return;
      }
      activeUserId = state.user!.id;
      lastUploadedSavedAt = 0;
      reconciledUserId = state.user!.id;
      void reconcileOnLogin(state.user!.id);
      return;
    }

    if (!authed && wasAuthed) {
      activeUserId = null;
      reconciledUserId = null;
      lastUploadedSavedAt = 0;
      if (pendingUploadTimer) {
        clearTimeout(pendingUploadTimer);
        pendingUploadTimer = null;
      }
    }
  });

  unsubscribeStore = useStore.subscribe((state, prev) => {
    if (state.lastSavedAt === prev.lastSavedAt) return;
    if (!activeUserId) return;
    scheduleUpload();
  });

  // Bootstrap path: if auth has already been restored before this service
  // subscribes, we still need an initial reconcile for this session.
  const current = useSocialStore.getState();
  if (current.status === 'authenticated' && current.user?.id && reconciledUserId !== current.user.id) {
    activeUserId = current.user.id;
    lastUploadedSavedAt = 0;
    reconciledUserId = current.user.id;
    void reconcileOnLogin(current.user.id);
  }
}

export function shutdownCloudSaveSync(): void {
  if (pendingUploadTimer) {
    clearTimeout(pendingUploadTimer);
    pendingUploadTimer = null;
  }
  if (unsubscribeAuth) {
    unsubscribeAuth();
    unsubscribeAuth = null;
  }
  if (unsubscribeStore) {
    unsubscribeStore();
    unsubscribeStore = null;
  }
  activeUserId = null;
  reconciledUserId = null;
  lastUploadedSavedAt = 0;
  reconciling = false;
  installed = false;
}
