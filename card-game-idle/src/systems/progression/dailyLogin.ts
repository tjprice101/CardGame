import type { ProgressState } from '@/types/game';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

  if (lastDay < 0) {
    return {
      claimable: true,
      pendingStreak: 1,
      previousStreak: 0,
      pendingReward: dailyRewardForStreak(1),
    };
  }
  if (lastDay === today) {
    return {
      claimable: false,
      pendingStreak: previousStreak,
      previousStreak,
      pendingReward: dailyRewardForStreak(previousStreak),
    };
  }
  const pendingStreak = lastDay === today - 1 ? previousStreak + 1 : 1;
  return {
    claimable: true,
    pendingStreak,
    previousStreak,
    pendingReward: dailyRewardForStreak(pendingStreak),
  };
}
