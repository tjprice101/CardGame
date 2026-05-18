import { describe, it, expect } from 'vitest';
import { OfflineProgress } from '@/core/loop/OfflineProgress';
import type { OfflineProgressStats } from '@/core/loop/OfflineProgress';

const baseStats: OfflineProgressStats = {
  scorePerTick: 100,
  tickIntervalMs: 1000,
};

describe('OfflineProgress', () => {
  it('returns null when offline duration is below threshold', () => {
    const result = OfflineProgress.calculate(Date.now() - 10_000, Date.now(), baseStats, 0);
    expect(result).toBeNull();
  });

  it('calculates correct ticks for 1 hour offline', () => {
    const oneHourMs = 3600 * 1000;
    const result = OfflineProgress.calculate(Date.now() - oneHourMs, Date.now(), baseStats, 0);
    expect(result).not.toBeNull();
    expect(result!.offlineTicks).toBe(3600);
    expect(result!.efficiency).toBe(0.8);
    expect(result!.scoreGained).toBeCloseTo(3600 * 100 * 0.8);
  });

  it('caps offline progress at 8 hours', () => {
    const twelveHoursMs = 12 * 3600 * 1000;
    const result = OfflineProgress.calculate(Date.now() - twelveHoursMs, Date.now(), baseStats, 0);
    expect(result!.offlineMs).toBe(8 * 3600 * 1000);
    expect(result!.offlineTicks).toBe(8 * 3600);
  });

  it('increases efficiency with prestige', () => {
    const oneHourMs = 3600 * 1000;
    const p0 = OfflineProgress.calculate(Date.now() - oneHourMs, Date.now(), baseStats, 0);
    const p4 = OfflineProgress.calculate(Date.now() - oneHourMs, Date.now(), baseStats, 4);
    expect(p4!.efficiency).toBeGreaterThan(p0!.efficiency);
    expect(p4!.efficiency).toBe(1.0); // 0.8 + 4 * 0.05 = 1.0
  });

  it('caps efficiency at 1.0', () => {
    const oneHourMs = 3600 * 1000;
    const result = OfflineProgress.calculate(Date.now() - oneHourMs, Date.now(), baseStats, 100);
    expect(result!.efficiency).toBe(1.0);
  });
});
