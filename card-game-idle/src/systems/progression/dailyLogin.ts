import type { ProgressState } from '@/types/game';
import { CardRegistry } from '@/cards/CardRegistry';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type MonthlyLoginReward =
  | { kind: 'shards'; amount: number; label: string }
  | { kind: 'card'; definitionId: string; amount: number; holo: boolean; label: string }
  | { kind: 'mastery_all_owned'; amount: number; label: string };

export function getMonthlyTrackKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function getMonthlyTrackDays(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}

const baseCardIds = () => CardRegistry.getAll()
  .filter(card => ['Common', 'Rare', 'Epic', 'Legendary'].includes(card.rarity) && !card.definitionId.includes('causality'))
  .map(card => card.definitionId);

export function monthlyRewardForDay(day: number, timestamp: number = Date.now()): MonthlyLoginReward {
  const cards = baseCardIds();
  if (day % 7 === 0) {
    return { kind: 'mastery_all_owned', amount: 3, label: '+3 Card-light to every owned card' };
  }
  if (day === 1 || day === 15 || day === 28) {
    const definitionId = cards[(day * 17 + new Date(timestamp).getUTCMonth()) % Math.max(1, cards.length)] ?? 'light-neutrality-1';
    return { kind: 'card', definitionId, amount: day === 28 ? 2 : 1, holo: day === 28, label: `${day === 28 ? 'Holofoil ' : ''}base card ×${day === 28 ? 2 : 1}` };
  }
  return { kind: 'shards', amount: 20 + day * 5, label: `+${20 + day * 5} Aberrated Shards` };
}

/**
 * Returns the UTC day index (number of days since the Unix epoch).
 * Stable across timezones — two timestamps in the same UTC day always yield
 * the same value. Using UTC avoids "the streak ticked because I moved time
 * zones" bugs.
 */
export function getUtcDayIndex(timestamp: number): number {
  return Math.floor(timestamp / MS_PER_DAY);
}

/**
 * Reward tier for a given streak day.
 *  - Day 1: 25 shards
 *  - Day 2: 30
 *  - Day 3: 35
 *  - Day 4: 45
 *  - Day 5: 60
 *  - Day 6: 80
 *  - Day 7+: 120 (full week reward; resets to weekly cycle visually but value caps)
 *
 * Streaks beyond 7 keep awarding the day-7 reward indefinitely.
 */
export function dailyRewardForStreak(streak: number): { shards: number; tier: number } {
  const tier = Math.max(1, Math.min(7, streak));
  const tableShards = [0, 25, 30, 35, 45, 60, 80, 120];
  return { shards: tableShards[tier], tier };
}

export interface DailyLoginEvaluation {
  /** True if a daily reward is currently available to claim. */
  claimable: boolean;
  /** Streak value that WILL apply if the player claims now. */
  pendingStreak: number;
  /** Streak the player had after their last claim. */
  previousStreak: number;
  /** Reward that will be granted if claimed now. */
  pendingReward: { shards: number; tier: number };
  monthlyTrackKey?: string;
  monthlyDay?: number;
  monthlyReward?: MonthlyLoginReward;
}

/**
 * Evaluates the player's current daily-login situation given the current time.
 * Pure function — does not mutate state. Caller applies the result via
 * `claimDailyReward()` on the store.
 *
 *  - If `lastClaimedDayIndex` < 0 (never claimed): claimable, streak = 1.
 *  - If today's day index === lastClaimedDayIndex: not claimable (already got today's).
 *  - If today === lastClaimedDayIndex + 1: claimable, streak += 1.
 *  - Otherwise (skipped a day): claimable, streak resets to 1.
 */
export function evaluateDailyLogin(
  progress: ProgressState,
  now: number = Date.now(),
): DailyLoginEvaluation {
  const dl = progress.dailyLogin;
  const today = getUtcDayIndex(now);
  const lastDay = dl.lastClaimedDayIndex;
  const previousStreak = dl.streak;
  const trackKey = getMonthlyTrackKey(now);
  const dayOfMonth = new Date(now).getUTCDate();
  const monthlyLedgerMissing = !dl.monthlyClaimedDays || dl.monthlyClaimedDays.length === 0;
  const legacyAlreadyClaimedToday = lastDay === today && monthlyLedgerMissing;
  const claimedDays = dl.monthlyTrackKey === trackKey
    ? (legacyAlreadyClaimedToday ? [dayOfMonth] : (dl.monthlyClaimedDays ?? []))
    : dl.monthlyTrackKey === undefined && lastDay === today
      ? [dayOfMonth]
      : [];
  const monthlyClaimableDay = legacyAlreadyClaimedToday
    ? undefined
    : Array.from({ length: dayOfMonth }, (_, index) => index + 1).find(day => !claimedDays.includes(day));

  if (lastDay < 0) {
    return {
      claimable: true,
      pendingStreak: 1,
      previousStreak: 0,
      pendingReward: dailyRewardForStreak(1),
      monthlyTrackKey: trackKey, monthlyDay: monthlyClaimableDay, monthlyReward: monthlyClaimableDay ? monthlyRewardForDay(monthlyClaimableDay, now) : undefined,
    };
  }
  if (lastDay === today) {
    return {
      claimable: monthlyClaimableDay !== undefined,
      pendingStreak: previousStreak,
      previousStreak,
      pendingReward: dailyRewardForStreak(previousStreak),
      monthlyTrackKey: trackKey, monthlyDay: monthlyClaimableDay, monthlyReward: monthlyClaimableDay ? monthlyRewardForDay(monthlyClaimableDay, now) : undefined,
    };
  }
  const pendingStreak = lastDay === today - 1 ? previousStreak + 1 : previousStreak;
  return {
    claimable: true,
    pendingStreak,
    previousStreak,
    pendingReward: dailyRewardForStreak(pendingStreak),
    monthlyTrackKey: trackKey, monthlyDay: monthlyClaimableDay, monthlyReward: monthlyClaimableDay ? monthlyRewardForDay(monthlyClaimableDay, now) : undefined,
  };
}
