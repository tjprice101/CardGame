// Social store — separate from the main game store (src/state/store.ts).
//
// Why a separate store?
//  - Keeps networked / async / nullable state out of the main game state.
//  - Avoids the Zustand v5 "getSnapshot should be cached" loop documented in the
//    repo-memory file. Every selector in this module returns a stable reference
//    or a primitive; we never return fresh object literals from a selector.
//  - Lets us no-op cleanly when Supabase isn't configured (single-player builds).
//
// Phase 1 surface: auth session + own social profile row. Friends/DMs/etc. come
// in later phases and will plug in here without touching the main store.

import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '@/net/supabaseClient';

export interface SocialProfile {
  id: string;
  friendCode: string;
  loginUsername: string | null;
  displayName: string;
  bio: string | null;
  avatarId: string;
  titleId: string | null;
  uiThemeId: string | null;
  customUiTheme: Record<string, string> | null;
  lastSeenAt: string | null;
  signatureCardIds: string[];
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error' | 'confirmation_pending';

interface SocialState {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: SocialProfile | null;
  errorMessage: string | null;

  // Lifecycle
  initialize: () => Promise<void>;

  // Auth
  signUpWithEmail: (identifier: string, password: string, displayName: string) => Promise<void>;
  signInWithEmail: (identifier: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Own profile sync (called from the main store via a thin bridge in AuthPanel).
  syncOwnProfile: (snapshot: {
    displayName: string;
    bio: string;
    avatarId: string;
    titleId: string | null;
    uiThemeId: string | null;
    customUiTheme: Record<string, string> | null;
    signatureCardIds: string[];
  }) => Promise<void>;
}

// Frozen fallback sentinels to satisfy the Zustand v5 selector cache rule.
const EMPTY_PROFILE: SocialProfile | null = null;
let authSubscriptionInstalled = false;

function normalizeLoginUsername(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
}

function isValidLoginUsername(username: string): boolean {
  return /^[a-z0-9_]{3,24}$/.test(username);
}

function makeSyntheticAuthEmail(loginUsername: string): string {
  return `${loginUsername}@users.pantheon.local`;
}

async function resolveSignInEmail(identifier: string): Promise<string> {
  const sb = getSupabase();
  if (!sb) throw new Error('Online features are not configured for this build.');
  const trimmed = identifier.trim();
  if (!trimmed) throw new Error('Please enter a username.');
  if (trimmed.includes('@')) return trimmed.toLowerCase();

  const normalized = normalizeLoginUsername(trimmed);
  if (!isValidLoginUsername(normalized)) {
    throw new Error('Username must be 3-24 characters (letters, numbers, underscore).');
  }

  const { data, error } = await sb.rpc('resolve_login_email', { p_login_username: normalized });
  if (error) {
    // Fallback for local/dev setups before migration is applied.
    return makeSyntheticAuthEmail(normalized);
  }
  const resolved = typeof data === 'string' ? data.trim() : '';
  if (!resolved) {
    throw new Error('No account found for that username.');
  }
  return resolved.toLowerCase();
}

function generateFriendCode(): string {
  // 8-char base32-ish, ambiguous chars (0/O/1/I/L) removed.
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

async function fetchOrCreateProfile(
  userId: string,
  fallbackDisplayName: string,
  loginUsernameHint?: string,
  authEmailHint?: string,
): Promise<SocialProfile | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const selectWithLogin = 'id, friend_code, login_username, display_name, bio, avatar_id, title_id, ui_theme_id, custom_ui_theme, last_seen_at, signature_card_ids, auth_email';
  const selectLegacy = 'id, friend_code, display_name, avatar_id, title_id, ui_theme_id, last_seen_at';

  let { data: existing, error: selErr } = await sb
    .from('profiles')
    .select(selectWithLogin)
    .eq('id', userId)
    .maybeSingle();
  if (selErr?.code === '42703') {
    const legacy = await sb
      .from('profiles')
      .select(selectLegacy)
      .eq('id', userId)
      .maybeSingle();
    existing = legacy.data as typeof existing;
    selErr = legacy.error;
  }
  if (selErr) throw selErr;

  if (existing) {
    return {
      id: existing.id,
      friendCode: existing.friend_code,
      loginUsername: typeof existing.login_username === 'string' ? existing.login_username : null,
      displayName: existing.display_name,
      bio: typeof existing.bio === 'string' ? existing.bio : null,
      avatarId: existing.avatar_id,
      titleId: existing.title_id,
      uiThemeId: existing.ui_theme_id,
      customUiTheme: existing.custom_ui_theme && typeof existing.custom_ui_theme === 'object'
        ? existing.custom_ui_theme as Record<string, string>
        : null,
      lastSeenAt: existing.last_seen_at,
      signatureCardIds: Array.isArray(existing.signature_card_ids) ? existing.signature_card_ids : [],
    };
  }

  // Insert a new row. Retry on friend_code unique collision (very rare with 8-char alphabet).
  for (let attempt = 0; attempt < 5; attempt++) {
    const friendCode = generateFriendCode();
    const normalizedLogin = normalizeLoginUsername(
      loginUsernameHint
      || fallbackDisplayName
      || `wanderer_${userId.slice(0, 6)}`,
    );
    const loginUsername = isValidLoginUsername(normalizedLogin)
      ? normalizedLogin
      : `wanderer_${userId.slice(0, 6).toLowerCase()}`;
    const authEmail = (authEmailHint && authEmailHint.includes('@'))
      ? authEmailHint.toLowerCase()
      : makeSyntheticAuthEmail(loginUsername);
    const insertPayload = {
        id: userId,
        friend_code: friendCode,
        login_username: loginUsername,
        auth_email: authEmail,
        display_name: fallbackDisplayName,
        avatar_id: 'pic-classic-acolyte',
        title_id: null,
        ui_theme_id: null,
        custom_ui_theme: null,
        signature_card_ids: [],
      };

    let { data: inserted, error: insErr } = await sb
      .from('profiles')
      .insert(insertPayload)
      .select(selectWithLogin)
      .single();

    if (insErr?.code === '42703') {
      const {
        login_username: _dropLogin,
        auth_email: _dropEmail,
        custom_ui_theme: _dropCustom,
        signature_card_ids: _dropSigs,
        ...legacyPayload
      } = insertPayload;
      const legacyInsert = await sb
        .from('profiles')
        .insert(legacyPayload)
        .select(selectLegacy)
        .single();
      inserted = legacyInsert.data as typeof inserted;
      insErr = legacyInsert.error;
      void _dropLogin;
      void _dropEmail;
      void _dropCustom;
      void _dropSigs;
    }
    if (!insErr && inserted) {
      return {
        id: inserted.id,
        friendCode: inserted.friend_code,
        loginUsername: typeof inserted.login_username === 'string' ? inserted.login_username : null,
        displayName: inserted.display_name,
        bio: typeof inserted.bio === 'string' ? inserted.bio : null,
        avatarId: inserted.avatar_id,
        titleId: inserted.title_id,
        uiThemeId: inserted.ui_theme_id,
        customUiTheme: inserted.custom_ui_theme && typeof inserted.custom_ui_theme === 'object'
          ? inserted.custom_ui_theme as Record<string, string>
          : null,
        lastSeenAt: inserted.last_seen_at,
        signatureCardIds: Array.isArray(inserted.signature_card_ids) ? inserted.signature_card_ids : [],
      };
    }
    // Postgres unique violation = 23505. Retry only on that.
    if (insErr && insErr.code !== '23505') throw insErr;
  }
  throw new Error('Could not allocate a unique friend code; please retry.');
}

export const useSocialStore = create<SocialState>((set, get) => ({
  status: 'idle',
  session: null,
  user: null,
  profile: EMPTY_PROFILE,
  errorMessage: null,

  async initialize() {
    const sb = getSupabase();
    if (!sb) {
      set({ status: 'idle' });
      return;
    }
    // Idempotency guards: avoid spurious authenticated -> loading -> authenticated
    // status flickers when callers re-invoke initialize() (e.g. when a UI panel
    // remounts). Such flickers cause downstream subscribers (cloudSaveSync,
    // statsSync, accountSync) to re-fire login transitions and can overwrite
    // live in-memory game state.
    const current = get();
    if (current.status === 'loading') return;
    if (current.status === 'authenticated' && current.user) return;
    set({ status: 'loading', errorMessage: null });
    try {
      const { data } = await sb.auth.getSession();
      const session = data.session ?? null;
      const user = session?.user ?? null;
      let profile: SocialProfile | null = null;
      if (user) {
        const loginUsername = normalizeLoginUsername(user.user_metadata?.username || user.email?.split('@')[0] || 'wanderer');
        profile = await fetchOrCreateProfile(
          user.id,
          user.user_metadata?.display_name || user.email?.split('@')[0] || 'Wanderer',
          loginUsername,
          user.email ?? makeSyntheticAuthEmail(loginUsername),
        );
      }
      set({
        status: user ? 'authenticated' : 'idle',
        session,
        user,
        profile,
      });
      if (!authSubscriptionInstalled) {
        authSubscriptionInstalled = true;
        sb.auth.onAuthStateChange((_event, newSession) => {
          const u = newSession?.user ?? null;
          set({
            session: newSession ?? null,
            user: u,
            status: u ? 'authenticated' : 'idle',
          });
          if (!u) {
            set({ profile: null });
            return;
          }
          // Session callbacks can arrive before/after explicit sign-in methods.
          // Always hydrate profile here so authenticated state never gets stuck
          // with a null/stale profile snapshot.
          void (async () => {
            try {
              const loginUsername = normalizeLoginUsername(
                u.user_metadata?.username || u.email?.split('@')[0] || 'wanderer',
              );
              const profile = await fetchOrCreateProfile(
                u.id,
                u.user_metadata?.display_name || u.email?.split('@')[0] || 'Wanderer',
                loginUsername,
                u.email ?? makeSyntheticAuthEmail(loginUsername),
              );
              if (get().user?.id === u.id) {
                set({ profile });
              }
            } catch (err) {
              if (get().user?.id === u.id) {
                set({ errorMessage: messageOf(err) });
              }
            }
          })();
        });
      }
    } catch (err) {
      set({ status: 'error', errorMessage: messageOf(err) });
    }
  },

  async signUpWithEmail(identifier, password, displayName) {
    const sb = getSupabase();
    if (!sb) throw new Error('Online features are not configured for this build.');
    set({ status: 'loading', errorMessage: null });
    try {
      const loginUsername = normalizeLoginUsername(identifier);
      if (!isValidLoginUsername(loginUsername)) {
        throw new Error('Username must be 3-24 characters (letters, numbers, underscore).');
      }
      const authEmail = makeSyntheticAuthEmail(loginUsername);
      const nextDisplayName = displayName.trim() || loginUsername;

      const { data, error } = await sb.auth.signUp({
        email: authEmail,
        password,
        options: {
          data: {
            username: loginUsername,
            display_name: nextDisplayName,
          },
        },
      });
      if (error) throw error;
      const user = data.user;
      if (user) {
        const profile = await fetchOrCreateProfile(user.id, nextDisplayName, loginUsername, authEmail);
        set({ user, session: data.session ?? null, profile, status: 'authenticated' });
      } else {
        // Email confirmation required: session is null until the user clicks the link.
        set({ status: 'confirmation_pending' });
      }
    } catch (err) {
      set({ status: 'error', errorMessage: messageOf(err) });
      throw err;
    }
  },

  async signInWithEmail(identifier, password) {
    const sb = getSupabase();
    if (!sb) throw new Error('Online features are not configured for this build.');
    set({ status: 'loading', errorMessage: null });
    try {
      const email = await resolveSignInEmail(identifier);
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const user = data.user;
      const loginUsername = normalizeLoginUsername(user?.user_metadata?.username || user?.email?.split('@')[0] || 'wanderer');
      const profile = user
        ? await fetchOrCreateProfile(
            user.id,
            user.user_metadata?.display_name || user.email?.split('@')[0] || 'Wanderer',
            loginUsername,
            user.email ?? makeSyntheticAuthEmail(loginUsername),
          )
        : null;
      set({
        user,
        session: data.session,
        profile,
        status: user ? 'authenticated' : 'idle',
      });
    } catch (err) {
      set({ status: 'error', errorMessage: messageOf(err) });
      throw err;
    }
  },

  async signOut() {
    const sb = getSupabase();
    if (!sb) return;
    await sb.auth.signOut();
    set({ session: null, user: null, profile: null, status: 'idle' });
  },

  async syncOwnProfile(snapshot) {
    const sb = getSupabase();
    const profile = get().profile;
    const user = get().user;
    if (!sb || !user || !profile) return;
    const next = {
      display_name: snapshot.displayName,
      bio: snapshot.bio,
      avatar_id: snapshot.avatarId,
      title_id: snapshot.titleId,
      ui_theme_id: snapshot.uiThemeId,
      custom_ui_theme: snapshot.customUiTheme,
      signature_card_ids: snapshot.signatureCardIds,
      last_seen_at: new Date().toISOString(),
    };
    // Skip if nothing changed (avoid burning rate limit).
    const sigsSame =
      profile.signatureCardIds.length === snapshot.signatureCardIds.length &&
      profile.signatureCardIds.every((id, i) => id === snapshot.signatureCardIds[i]);
    if (
      profile.displayName === snapshot.displayName &&
      (profile.bio ?? '') === snapshot.bio &&
      profile.avatarId === snapshot.avatarId &&
      profile.titleId === snapshot.titleId &&
      profile.uiThemeId === snapshot.uiThemeId &&
      JSON.stringify(profile.customUiTheme ?? null) === JSON.stringify(snapshot.customUiTheme ?? null) &&
      sigsSame
    ) {
      return;
    }
    const payloads: Array<Record<string, unknown>> = [
      next,
      omitKeys(next, ['custom_ui_theme', 'signature_card_ids']),
      omitKeys(next, ['custom_ui_theme', 'signature_card_ids', 'bio']),
    ];
    let writeError: unknown = null;
    let wrote = false;
    for (const payload of payloads) {
      const { error } = await sb.from('profiles').update(payload).eq('id', user.id);
      if (!error) {
        wrote = true;
        break;
      }
      writeError = error;
      if (error.code !== '42703') {
        break;
      }
    }
    if (!wrote) {
      set({ errorMessage: messageOf(writeError) });
      return;
    }
    set({
      profile: {
        ...profile,
        loginUsername: profile.loginUsername,
        displayName: snapshot.displayName,
        bio: snapshot.bio,
        signatureCardIds: snapshot.signatureCardIds,
        avatarId: snapshot.avatarId,
        titleId: snapshot.titleId,
        uiThemeId: snapshot.uiThemeId,
        customUiTheme: snapshot.customUiTheme,
        lastSeenAt: next.last_seen_at,
      },
    });
  },
}));

function omitKeys(
  source: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...source };
  for (const key of keys) {
    delete out[key];
  }
  return out;
}

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err && typeof (err as Record<string, unknown>).message === 'string') {
    return (err as Record<string, unknown>).message as string;
  }
  return 'Unknown error';
}

// Convenience selectors. Return primitives or stable references only.
export const selectSocialStatus = (s: SocialState) => s.status;
export const selectSocialProfile = (s: SocialState) => s.profile;
export const selectSocialUser = (s: SocialState) => s.user;
export const selectSocialError = (s: SocialState) => s.errorMessage;

export { isSupabaseConfigured };
