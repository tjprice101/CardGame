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
  displayName: string;
  bio: string | null;
  avatarId: string;
  titleId: string | null;
  uiThemeId: string | null;
  lastSeenAt: string | null;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

interface SocialState {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: SocialProfile | null;
  errorMessage: string | null;

  // Lifecycle
  initialize: () => Promise<void>;

  // Auth
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Own profile sync (called from the main store via a thin bridge in AuthPanel).
  syncOwnProfile: (snapshot: {
    displayName: string;
    bio: string;
    avatarId: string;
    titleId: string | null;
    uiThemeId: string | null;
  }) => Promise<void>;
}

// Frozen fallback sentinels to satisfy the Zustand v5 selector cache rule.
const EMPTY_PROFILE: SocialProfile | null = null;

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
): Promise<SocialProfile | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data: existing, error: selErr } = await sb
    .from('profiles')
    .select('id, friend_code, display_name, bio, avatar_id, title_id, ui_theme_id, last_seen_at')
    .eq('id', userId)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing) {
    return {
      id: existing.id,
      friendCode: existing.friend_code,
      displayName: existing.display_name,
      bio: existing.bio ?? null,
      avatarId: existing.avatar_id,
      titleId: existing.title_id,
      uiThemeId: existing.ui_theme_id,
      lastSeenAt: existing.last_seen_at,
    };
  }

  // Insert a new row. Retry on friend_code unique collision (very rare with 8-char alphabet).
  for (let attempt = 0; attempt < 5; attempt++) {
    const friendCode = generateFriendCode();
    const { data: inserted, error: insErr } = await sb
      .from('profiles')
      .insert({
        id: userId,
        friend_code: friendCode,
        display_name: fallbackDisplayName,
        bio: null,
        avatar_id: 'pic-classic-acolyte',
        title_id: null,
        ui_theme_id: null,
      })
      .select('id, friend_code, display_name, bio, avatar_id, title_id, ui_theme_id, last_seen_at')
      .single();
    if (!insErr && inserted) {
      return {
        id: inserted.id,
        friendCode: inserted.friend_code,
        displayName: inserted.display_name,
        bio: inserted.bio ?? null,
        avatarId: inserted.avatar_id,
        titleId: inserted.title_id,
        uiThemeId: inserted.ui_theme_id,
        lastSeenAt: inserted.last_seen_at,
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
    set({ status: 'loading', errorMessage: null });
    try {
      const { data } = await sb.auth.getSession();
      const session = data.session ?? null;
      const user = session?.user ?? null;
      let profile: SocialProfile | null = null;
      if (user) {
        profile = await fetchOrCreateProfile(user.id, user.email?.split('@')[0] ?? 'Wanderer');
      }
      set({
        status: user ? 'authenticated' : 'idle',
        session,
        user,
        profile,
      });
      // Subscribe to auth changes once.
      sb.auth.onAuthStateChange((_event, newSession) => {
        const u = newSession?.user ?? null;
        set({
          session: newSession ?? null,
          user: u,
          status: u ? 'authenticated' : 'idle',
        });
        if (!u) set({ profile: null });
      });
    } catch (err) {
      set({ status: 'error', errorMessage: messageOf(err) });
    }
  },

  async signUpWithEmail(email, password, displayName) {
    const sb = getSupabase();
    if (!sb) throw new Error('Online features are not configured for this build.');
    set({ status: 'loading', errorMessage: null });
    try {
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) throw error;
      const user = data.user;
      if (user) {
        const profile = await fetchOrCreateProfile(user.id, displayName.trim() || 'Wanderer');
        set({ user, session: data.session ?? null, profile, status: 'authenticated' });
      } else {
        // Email confirmation required: session is null until the user clicks the link.
        set({ status: 'idle' });
      }
    } catch (err) {
      set({ status: 'error', errorMessage: messageOf(err) });
      throw err;
    }
  },

  async signInWithEmail(email, password) {
    const sb = getSupabase();
    if (!sb) throw new Error('Online features are not configured for this build.');
    set({ status: 'loading', errorMessage: null });
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const user = data.user;
      const profile = user
        ? await fetchOrCreateProfile(user.id, user.email?.split('@')[0] ?? 'Wanderer')
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
      bio: snapshot.bio || null,
      avatar_id: snapshot.avatarId,
      title_id: snapshot.titleId,
      ui_theme_id: snapshot.uiThemeId,
      last_seen_at: new Date().toISOString(),
    };
    // Skip if nothing changed (avoid burning rate limit).
    if (
      profile.displayName === snapshot.displayName &&
      profile.bio === (snapshot.bio || null) &&
      profile.avatarId === snapshot.avatarId &&
      profile.titleId === snapshot.titleId &&
      profile.uiThemeId === snapshot.uiThemeId
    ) {
      return;
    }
    const { error } = await sb.from('profiles').update(next).eq('id', user.id);
    if (error) {
      set({ errorMessage: messageOf(error) });
      return;
    }
    set({
      profile: {
        ...profile,
        displayName: snapshot.displayName,
        bio: snapshot.bio || null,
        avatarId: snapshot.avatarId,
        titleId: snapshot.titleId,
        uiThemeId: snapshot.uiThemeId,
        lastSeenAt: next.last_seen_at,
      },
    });
  },
}));

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Unknown error';
}

// Convenience selectors. Return primitives or stable references only.
export const selectSocialStatus = (s: SocialState) => s.status;
export const selectSocialProfile = (s: SocialState) => s.profile;
export const selectSocialUser = (s: SocialState) => s.user;
export const selectSocialError = (s: SocialState) => s.errorMessage;

export { isSupabaseConfigured };
