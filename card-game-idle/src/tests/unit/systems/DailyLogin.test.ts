import { describe, it, expect } from 'vitest';
import {
  getUtcDayIndex,
  dailyRewardForStreak,
  evaluateDailyLogin,
} from '@/systems/progression/dailyLogin';
import type { ProgressState } from '@/types/game';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function makeProgress(overrides: Partial<ProgressState['dailyLogin']> = {}): ProgressState {
  return {
    oblivion: 0,
    aberratedShards: 0,
    totalCardsPlayed: 0,
    collection: {},
    holoCollection: {},
    infiniteCollection: {},
    favoriteCollection: {},
    bossClearCounts: {},
    pityCounters: {},
    savedDecks: [],
    activeDeckId: null,
    profile: { name: 'Wanderer', avatarId: 'avatar-acolyte', titleId: null },
    dailyLogin: {
      lastClaimedDayIndex: -1,
      streak: 0,
      totalClaims: 0,
      ...overrides,
    },
  };
}

describe('dailyLogin.getUtcDayIndex', () => {
  it('returns 0 for the Unix epoch', () => {
    expect(getUtcDayIndex(0)).toBe(0);
  });

  it('returns the same index for any timestamp within the same UTC day', () => {
    const day = 19_700; // arbitrary day
    const startOfDay = day * MS_PER_DAY;
    const endOfDay = startOfDay + MS_PER_DAY - 1;
    expect(getUtcDayIndex(startOfDay)).toBe(day);
    expect(getUtcDayIndex(endOfDay)).toBe(day);
  });

  it('increments by 1 across day boundaries', () => {
    const day = 19_700;
    const nextDayStart = (day + 1) * MS_PER_DAY;
    expect(getUtcDayIndex(nextDayStart)).toBe(day + 1);
  });
});

describe('dailyLogin.dailyRewardForStreak', () => {
  it('matches the documented reward table', () => {
    expect(dailyRewardForStreak(1).shards).toBe(25);
    expect(dailyRewardForStreak(2).shards).toBe(30);
    expect(dailyRewardForStreak(3).shards).toBe(35);
    expect(dailyRewardForStreak(4).shards).toBe(45);
    expect(dailyRewardForStreak(5).shards).toBe(60);
    expect(dailyRewardForStreak(6).shards).toBe(80);
    expect(dailyRewardForStreak(7).shards).toBe(120);
  });

  it('caps tier at 7 for very long streaks', () => {
    expect(dailyRewardForStreak(99).shards).toBe(120);
    expect(dailyRewardForStreak(99).tier).toBe(7);
  });

  it('clamps non-positive streaks to tier 1', () => {
    expect(dailyRewardForStreak(0).tier).toBe(1);
    expect(dailyRewardForStreak(-5).tier).toBe(1);
  });
});

describe('dailyLogin.evaluateDailyLogin', () => {
  const today = 20_000;
  const now = today * MS_PER_DAY + 5_000; // somewhere inside day 20000

  it('flags first-ever login as claimable with streak 1', () => {
    const result = evaluateDailyLogin(makeProgress({ lastClaimedDayIndex: -1 }), now);
    expect(result.claimable).toBe(true);
    expect(result.pendingStreak).toBe(1);
    expect(result.previousStreak).toBe(0);
    expect(result.pendingReward.shards).toBe(25);
  });

  it('returns not claimable when already claimed today', () => {
    const result = evaluateDailyLogin(
      makeProgress({ lastClaimedDayIndex: today, streak: 3 }),
      now,
    );
    expect(result.claimable).toBe(false);
    expect(result.pendingStreak).toBe(3);
    expect(result.previousStreak).toBe(3);
  });

  it('continues the streak when claiming on the next day', () => {
    const result = evaluateDailyLogin(
      makeProgress({ lastClaimedDayIndex: today - 1, streak: 4 }),
      now,
    );
    expect(result.claimable).toBe(true);
    expect(result.pendingStreak).toBe(5);
    expect(result.pendingReward.shards).toBe(60);
  });

  it('resets the streak when a day is skipped', () => {
    const result = evaluateDailyLogin(
      makeProgress({ lastClaimedDayIndex: today - 5, streak: 6 }),
      now,
    );
    expect(result.claimable).toBe(true);
    expect(result.pendingStreak).toBe(1);
    expect(result.previousStreak).toBe(6);
  });
});
