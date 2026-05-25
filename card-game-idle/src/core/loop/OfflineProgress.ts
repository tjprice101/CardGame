export interface OfflineProgressStats {
  scorePerTick: number;
  tickIntervalMs: number;
}

export interface OfflineProgressResult {
  offlineMs: number;
  offlineTicks: number;
  efficiency: number;
  scoreGained: number;
  oblivionGained: number;
}

export class OfflineProgress {
  static readonly MIN_OFFLINE_MS = 30_000;
  static readonly MAX_OFFLINE_MS = 8 * 60 * 60 * 1000;
  static readonly BASE_EFFICIENCY = 0.8;

  static calculate(
    lastActiveAt: number,
    now: number,
    stats: OfflineProgressStats,
  ): OfflineProgressResult | null {
    if (!Number.isFinite(lastActiveAt) || !Number.isFinite(now)) return null;
    if (!Number.isFinite(stats.scorePerTick) || !Number.isFinite(stats.tickIntervalMs)) return null;
    if (stats.tickIntervalMs <= 0) return null;

    const elapsedMs = Math.max(0, now - lastActiveAt);
    if (elapsedMs < OfflineProgress.MIN_OFFLINE_MS) return null;

    const offlineMs = Math.min(elapsedMs, OfflineProgress.MAX_OFFLINE_MS);
    const offlineTicks = Math.floor(offlineMs / stats.tickIntervalMs);
    const efficiency = OfflineProgress.BASE_EFFICIENCY;
    const scoreGained = offlineTicks * Math.max(0, stats.scorePerTick) * efficiency;

    return {
      offlineMs,
      offlineTicks,
      efficiency,
      scoreGained,
      oblivionGained: scoreGained,
    };
  }
}
