import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
import { FORGE_WHEEL_PRIZES, FORGE_WHEEL_TOTAL_WEIGHT } from '@/data/forge/forgeDefinitions';
import { getLocalDayIndex, getMonthlyTrackKey } from '@/systems/progression/dailyLogin';
import type { GameState } from '@/types/game';

function resetStore(): void {
  const baseState = structuredClone(defaultGameState) as GameState;
  useStore.setState(state => ({ ...state, ...baseState }));
}

describe('Forge daily wheel', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

  it('uses only approved existing rewards and keeps normalized prototype weights', () => {
    expect(FORGE_WHEEL_TOTAL_WEIGHT).toBe(82);
    expect(FORGE_WHEEL_PRIZES.map(prize => prize.kind)).toEqual([
      'aberrated_shards',
      'card_light_all',
      'aberrated_shards',
      'aberrated_shards',
      'shards_of_transcendence',
      'aberrated_shards',
      'divine_light',
    ]);
    expect(FORGE_WHEEL_PRIZES.some(prize => ['forge-spark', 'mystery-relic', 'transcendent-card'].includes(prize.id))).toBe(false);
  });

  it('does not allow wheel spins before Forge unlock', () => {
    resetStore();
    expect(useStore.getState().spinForgeWheel()).toBeNull();
  });

  it('spends one accumulated free spin and awards the selected existing reward', () => {
    resetStore();
    const today = getLocalDayIndex(Date.now());
    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        forgeOfTranscendenceUnlocked: true,
        forgeWheelSpins: 1,
        forgeWheelLastAccruedDayIndex: today,
      },
    }));
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const result = useStore.getState().spinForgeWheel();

    expect(result?.prize.id).toBe('aberrated-50');
    expect(useStore.getState().progress.aberratedShards).toBe(50);
    expect(useStore.getState().progress.forgeWheelSpins).toBe(0);
    expect(useStore.getState().progress.shardsOfTranscendence).toBe(0);
  });

  it('accrues missed local-day spins and keeps the unspent balance', () => {
    resetStore();
    const today = getLocalDayIndex(Date.now());
    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        forgeOfTranscendenceUnlocked: true,
        forgeWheelSpins: 0,
        forgeWheelLastAccruedDayIndex: today - 3,
      },
    }));
    vi.spyOn(Math, 'random').mockReturnValue(0);

    useStore.getState().spinForgeWheel();

    expect(useStore.getState().progress.forgeWheelSpins).toBe(2);
    expect(useStore.getState().progress.forgeWheelLastAccruedDayIndex).toBe(today);
  });

  it('claims each configured login milestone once', () => {
    resetStore();
    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        dailyLogin: { ...state.progress.dailyLogin, streak: 3, claimedStreakMilestones: [] },
      },
    }));

    expect(useStore.getState().claimDailyStreakMilestone(3)).toBe(true);
    expect(useStore.getState().progress.aberratedShards).toBe(100);
    expect(useStore.getState().claimDailyStreakMilestone(3)).toBe(false);
  });

  it('grants the configured Divine Light payout for calendar Day 1', () => {
    const now = new Date(2026, 9, 1, 12).getTime();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    resetStore();
    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        dailyLogin: {
          ...state.progress.dailyLogin,
          lastClaimedDayIndex: getLocalDayIndex(now) - 1,
          monthlyTrackKey: getMonthlyTrackKey(now),
          monthlyClaimedDays: [],
        },
      },
    }));
    const before = useStore.getState().progress.divineLight;

    const result = useStore.getState().claimDailyReward();

    expect(result?.monthlyReward).toMatchObject({ kind: 'divine_light', amount: 2_000 });
    expect(useStore.getState().progress.divineLight).toBeGreaterThan(before);
  });
});