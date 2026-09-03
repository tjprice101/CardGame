// statsSync — Phase 5 social.
//
// Watches the local game store and:
//   1. Periodically upserts the user's `profile_stats` row so friend
//      leaderboards stay current.
//   2. Inserts `activity_events` rows when notable transitions occur
//      (boss clears, infinite pulls).
//
// All work is best-effort and silently no-ops when Supabase is not configured
// or the user is not authenticated. The game continues to work offline.

import { getSupabase } from '@/net/supabaseClient';
import { useSocialStore } from '@/state/socialStore';
import { useStore } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import type { ProgressState } from '@/types/game';

// ── Module state ────────────────────────────────────────────────────────────

let installed = false;
let unsubscribeStore: (() => void) | null = null;
let unsubscribeAuth: (() => void) | null = null;
let pendingStatsTimer: ReturnType<typeof setTimeout> | null = null;

const STATS_UPSERT_THROTTLE_MS = 30_000;
let lastStatsUpsertAt = 0;

// Snapshots used to detect transitions across store updates.
interface StatsSnapshot {
  bossClearTotal: number;
  bossClearByBoss: Record<string, number>;
  infiniteTotal: number;
  infiniteByDef: Record<string, number>;
  battlegroundWins: number;
  battlegroundBestScore: number;
  battlegroundTotalMatches: number;
}

let lastSnapshot: StatsSnapshot | null = null;

// ── Helpers ─────────────────────────────────────────────────────────────────

function sumValues(record: Record<string, number> | undefined): number {
  if (!record) return 0;
  let n = 0;
  for (const v of Object.values(record)) n += v;
  return n;
}

function snapshot(progress: ProgressState): StatsSnapshot {
  return {
    bossClearTotal: sumValues(progress.bossClearCounts),
    bossClearByBoss: { ...progress.bossClearCounts },
    infiniteTotal: sumValues(progress.infiniteCollection),
    infiniteByDef: { ...progress.infiniteCollection },
    battlegroundWins: progress.battlegroundStats?.wins ?? 0,
    battlegroundBestScore: progress.battlegroundStats?.bestScore ?? 0,
    battlegroundTotalMatches: progress.battlegroundStats?.totalMatches ?? 0,
  };
}

function statsRowFor(userId: string, progress: ProgressState) {
  // eternity_clears stored as a per-boss count map.
  const eternityClears: Record<string, number> = { ...progress.bossClearCounts };
  return {
    user_id: userId,
    eternity_clears: eternityClears,
    infinite_pulls: sumValues(progress.infiniteCollection),
    battleground_wins: progress.battlegroundStats?.wins ?? 0,
    battleground_best_score: progress.battlegroundStats?.bestScore ?? 0,
    updated_at: new Date().toISOString(),
  };
}

// ── Network actions ─────────────────────────────────────────────────────────

async function upsertStats(): Promise<void> {
  const sb = getSupabase();
  const me = useSocialStore.getState().user?.id;
  if (!sb || !me) return;
  const progress = useStore.getState().progress;
  const row = statsRowFor(me, progress);
  const { error } = await sb.from('profile_stats').upsert(row, { onConflict: 'user_id' });
  if (error) {
    // Surface only in console — leaderboards are non-critical.
    // eslint-disable-next-line no-console
    console.warn('[statsSync] profile_stats upsert failed:', error.message);
  }
  lastStatsUpsertAt = Date.now();
}

function scheduleStatsUpsert(): void {
  if (pendingStatsTimer) return;
  const since = Date.now() - lastStatsUpsertAt;
  const delay = Math.max(1_500, STATS_UPSERT_THROTTLE_MS - since);
  pendingStatsTimer = setTimeout(() => {
    pendingStatsTimer = null;
    void upsertStats();
  }, delay);
}

async function postActivity(
  kind: 'boss_clear' | 'infinite_pull' | 'set_completion' | 'title_unlocked' | 'battleground_result',
  payload: Record<string, unknown>,
): Promise<void> {
  const sb = getSupabase();
  const me = useSocialStore.getState().user?.id;
  if (!sb || !me) return;
  const { error } = await sb
    .from('activity_events')
    .insert({ user_id: me, kind, payload });
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[statsSync] activity insert failed:', error.message);
  }
}

// ── Transition detection ────────────────────────────────────────────────────

function detectAndPostTransitions(prev: StatsSnapshot, next: StatsSnapshot): boolean {
  let changed = false;

  // Boss clears: any boss whose count went up emits a single event.
  for (const [bossId, count] of Object.entries(next.bossClearByBoss)) {
    const before = prev.bossClearByBoss[bossId] ?? 0;
    if (count > before) {
      changed = true;
      void postActivity('boss_clear', { bossId, totalClears: count });
    }
  }

  // Infinite pulls: any def whose count went up emits an event.
  for (const [defId, count] of Object.entries(next.infiniteByDef)) {
    const before = prev.infiniteByDef[defId] ?? 0;
    if (count > before) {
      changed = true;
      const def = CardRegistry.get(defId);
      void postActivity('infinite_pull', {
        definitionId: defId,
        cardName: def?.name ?? defId,
      });
    }
  }

  // Battleground result: fires when total match count increases.
  if (next.battlegroundTotalMatches > prev.battlegroundTotalMatches) {
    changed = true;
    const won = next.battlegroundWins > prev.battlegroundWins;
    void postActivity('battleground_result', {
      result: won ? 'win' : 'loss',
      score: next.battlegroundBestScore,
      totalWins: next.battlegroundWins,
    });
  }

  return changed;
}

// ── Public init ─────────────────────────────────────────────────────────────

/**
 * Install store + auth subscribers. Idempotent. Call once on app boot.
 */
export function initStatsSync(): void {
  if (installed) return;
  installed = true;

  unsubscribeAuth = useSocialStore.subscribe((state, prev) => {
    if (state.status === 'authenticated' && prev.status !== 'authenticated') {
      // On first auth, snapshot current state and push an initial upsert.
      lastSnapshot = snapshot(useStore.getState().progress);
      void upsertStats();
    }
    if (state.status !== 'authenticated' && prev.status === 'authenticated') {
      // Reset snapshot so re-auth treats the new session fresh.
      lastSnapshot = null;
    }
  });

  unsubscribeStore = useStore.subscribe((state, prev) => {
    if (useSocialStore.getState().status !== 'authenticated') return;
    if (state.progress === prev.progress) return;
    const next = snapshot(state.progress);
    const before = lastSnapshot;
    if (!before) {
      lastSnapshot = next;
      // First observed snapshot after auth/reload; ensure DB catches up.
      scheduleStatsUpsert();
      return;
    }
    const fired = detectAndPostTransitions(before, next);
    const driftChanged =
      next.bossClearTotal !== before.bossClearTotal
      || next.infiniteTotal !== before.infiniteTotal
      || next.battlegroundWins !== before.battlegroundWins
      || next.battlegroundBestScore !== before.battlegroundBestScore
      || next.battlegroundTotalMatches !== before.battlegroundTotalMatches;
    lastSnapshot = next;
    if (fired) {
      // Push stats up immediately on a notable transition.
      void upsertStats();
    } else if (driftChanged) {
      // Routine drift; throttle.
      scheduleStatsUpsert();
    }
  });
}

/**
 * Tear down the subscribers. Not strictly needed in production (the app
 * lives for the whole session) but useful for tests / hot reload.
 */
export function shutdownStatsSync(): void {
  if (!installed) return;
  unsubscribeStore?.();
  unsubscribeAuth?.();
  if (pendingStatsTimer) clearTimeout(pendingStatsTimer);
  pendingStatsTimer = null;
  lastSnapshot = null;
  installed = false;
}
