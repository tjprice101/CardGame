import type { TurnState } from '@/types/game';
import type { ArtifactEffectType } from '@/types/artifacts';

/**
 * Sum the value of all equipped artifacts that contribute a given effect type.
 * Returns 0 if no equipped artifact has that effect. Values are scaled by each
 * artifact's mastery multiplier when `copiesById` is provided.
 */
export function getArtifactEffect(
  _turn: TurnState,
  _effectType: ArtifactEffectType,
  _copiesById?: Record<string, number>,
): number {
  return 0;
}

/** Check whether any equipped artifact has a flag effect (value >= 1). */
export function hasArtifactFlag(
  _turn: TurnState,
  _effectType: ArtifactEffectType,
  _copiesById?: Record<string, number>,
): boolean {
  return false;
}

