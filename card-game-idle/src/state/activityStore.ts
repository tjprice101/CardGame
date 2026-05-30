// Activity feed store — Phase 5.
//
// Friend-visible activity events (boss clears, infinite pulls, gauntlet PBs).
// Reads via the RLS policy installed in 0005_phase5_activity.sql, so a single
// SELECT returns the user's own rows plus their accepted friends' rows.
//
// Selectors return primitives or frozen references — see the Zustand v5
// snapshot-cache note in repo memory.

import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '@/net/supabaseClient';
import { useSocialStore } from '@/state/socialStore';

export type ActivityKind =
  | 'boss_clear'
  | 'infinite_pull'
  | 'gauntlet_best'
  | 'set_completion'
  | 'title_unlocked'
  | 'battleground_result';

export interface ActivityEvent {
  id: string;
  userId: string;
  displayName: string;
  avatarId: string;
  titleId: string | null;
  kind: ActivityKind;
  payload: Record<string, unknown>;
  createdAt: string;
}

interface ActivityState {
  loaded: boolean;
  loading: boolean;
  errorMessage: string | null;
  feed: readonly ActivityEvent[];

  loadFeed: () => Promise<void>;
  connectRealtime: () => void;
  disconnectRealtime: () => void;
}

const EMPTY_FEED: readonly ActivityEvent[] = Object.freeze([]);
const FEED_LIMIT = 50;

let realtimeChannel: RealtimeChannel | null = null;

interface RawRow {
  id: string;
  user_id: string;
  kind: ActivityKind;
  payload: Record<string, unknown> | null;
  created_at: string;
  profiles?:
    | {
        display_name: string | null;
        avatar_id: string | null;
        title_id: string | null;
      }
    | null;
}

function rowToEvent(row: RawRow): ActivityEvent {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.profiles?.display_name ?? 'Unknown',
    avatarId: row.profiles?.avatar_id ?? 'avatar.default',
    titleId: row.profiles?.title_id ?? null,
    kind: row.kind,
    payload: row.payload ?? {},
    createdAt: row.created_at,
  };
}

export const useActivityStore = create<ActivityState>((set) => ({
  loaded: false,
  loading: false,
  errorMessage: null,
  feed: EMPTY_FEED,

  async loadFeed() {
    const sb = getSupabase();
    if (!sb) return;
    if (useSocialStore.getState().status !== 'authenticated') return;
    set({ loading: true, errorMessage: null });
    const { data, error } = await sb
      .from('activity_events')
      .select(
        'id, user_id, kind, payload, created_at, profiles:profiles!activity_events_user_id_fkey ( display_name, avatar_id, title_id )',
      )
      .order('created_at', { ascending: false })
      .limit(FEED_LIMIT);
    if (error) {
      set({ loading: false, errorMessage: error.message });
      return;
    }
    const rows = ((data ?? []) as unknown as RawRow[]).map(rowToEvent);
    set({ loaded: true, loading: false, feed: Object.freeze(rows) });
  },

  connectRealtime() {
    const sb = getSupabase();
    if (!sb) return;
    if (useSocialStore.getState().status !== 'authenticated') return;
    if (realtimeChannel) return;
    realtimeChannel = sb
      .channel('activity:feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_events' },
        (payload) => {
          const raw = payload.new as RawRow;
          // RLS already filters server-side, but realtime delivers everything
          // the row's INSERT would have been visible for. Hydrate the author
          // profile separately because realtime payloads don't include joins.
          void hydrateAndPrepend(raw);
        },
      )
      .subscribe();
  },

  disconnectRealtime() {
    if (realtimeChannel) {
      void realtimeChannel.unsubscribe();
      realtimeChannel = null;
    }
  },
}));

async function hydrateAndPrepend(raw: RawRow): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { data } = await sb
    .from('profiles')
    .select('display_name, avatar_id, title_id')
    .eq('id', raw.user_id)
    .maybeSingle();
  const event = rowToEvent({
    ...raw,
    profiles: data ?? null,
  });
  const current = useActivityStore.getState().feed;
  // Skip duplicates (own inserts may arrive twice).
  if (current.some((e) => e.id === event.id)) return;
  const merged: ActivityEvent[] = [event, ...current].slice(0, FEED_LIMIT);
  useActivityStore.setState({ feed: Object.freeze(merged) });
}

// ── Selectors ───────────────────────────────────────────────────────────────

export const selectActivityFeed = (s: ActivityState): readonly ActivityEvent[] => s.feed;
export const selectActivityLoading = (s: ActivityState): boolean => s.loading;
export const selectActivityLoaded = (s: ActivityState): boolean => s.loaded;
export const selectActivityError = (s: ActivityState): string | null => s.errorMessage;
