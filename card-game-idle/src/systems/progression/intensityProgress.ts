import type { ProgressState } from '@/types/game';

export const INTENSITY_PROGRESS_KEYS = [
  'intensityCardsPlayed', 'intensityInfernoGenerated', 'intensityInfernoSpent',
  'intensityBestTurnInferno', 'intensityCraterClears', 'intensityAbilityActivations',
] as const;

export function captureIntensityProgress(progress: ProgressState) {
  return {
    intensityCardsPlayed: progress.intensityCardsPlayed ?? 0,
    intensityInfernoGenerated: progress.intensityInfernoGenerated ?? 0,
    intensityInfernoSpent: progress.intensityInfernoSpent ?? 0,
    intensityBestTurnInferno: progress.intensityBestTurnInferno ?? 0,
    intensityCraterClears: progress.intensityCraterClears ?? 0,
    intensityAbilityActivations: progress.intensityAbilityActivations ?? 0,
  };
}

export function mergeIntensityProgress(progress: ProgressState, snapshot: ReturnType<typeof captureIntensityProgress>): void {
  for (const key of INTENSITY_PROGRESS_KEYS) progress[key] = Math.max(progress[key] ?? 0, snapshot[key]);
}
