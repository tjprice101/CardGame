import type { BossDefinition } from '@/types/bossFight';
import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';
import { getUtcDayIndex } from './dailyLogin';

/**
 * Deterministic "Boss of the Day" + "Boss of the Week" selectors. Pure.
 * Uses the same UTC-day-index pattern as the daily-login system so rotation
 * is stable across time zones.
 */

const DAILY_SHARD_MULTIPLIER = 2;
const WEEKLY_SHARD_MULTIPLIER = 3;

function pickIndex(seed: number, modulus: number): number {
  // 32-bit xorshift-ish hash. Stable.
  let x = seed >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return Math.abs(x) % Math.max(1, modulus);
}

export function getFeaturedDailyBoss(now: number = Date.now()): BossDefinition | null {
  if (BOSS_DEFINITIONS.length === 0) return null;
  const day = getUtcDayIndex(now);
  const idx = pickIndex(day * 2654435761 + 11, BOSS_DEFINITIONS.length);
  return BOSS_DEFINITIONS[idx];
}

export function getFeaturedWeeklyBoss(now: number = Date.now()): BossDefinition | null {
  if (BOSS_DEFINITIONS.length === 0) return null;
  const day = getUtcDayIndex(now);
  const week = Math.floor(day / 7);
  const idx = pickIndex(week * 2246822519 + 53, BOSS_DEFINITIONS.length);
  return BOSS_DEFINITIONS[idx];
}

export function isFeaturedBoss(bossId: string, now: number = Date.now()): { daily: boolean; weekly: boolean } {
  return {
    daily: getFeaturedDailyBoss(now)?.id === bossId,
    weekly: getFeaturedWeeklyBoss(now)?.id === bossId,
  };
}

export function getBossRewardMultiplier(bossId: string, now: number = Date.now()): number {
  const { daily, weekly } = isFeaturedBoss(bossId, now);
  let mult = 1;
  if (daily) mult = Math.max(mult, DAILY_SHARD_MULTIPLIER);
  if (weekly) mult = Math.max(mult, WEEKLY_SHARD_MULTIPLIER);
  return mult;
}
