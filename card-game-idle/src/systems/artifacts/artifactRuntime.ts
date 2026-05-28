import type { TurnState } from '@/types/game';
import type { ArtifactEffectType } from '@/types/artifacts';
import { ARTIFACT_DEFINITIONS } from '@/data/artifacts/artifactDefinitions';
import { getMasteryMultiplier } from '@/types/artifacts';

/** Mastery-scaled effect value for a single artifact id. */
function scaledEffectValue(
  artifactId: string,
  effectType: ArtifactEffectType,
  copiesById?: Record<string, number>,
): number {
  const def = ARTIFACT_DEFINITIONS.find(a => a.id === artifactId);
  if (!def) return 0;
  const copies = copiesById?.[artifactId] ?? 1;
  // Owned but unscaled (copies == 0) shouldn't really happen for equipped, but guard anyway.
  if (copies <= 0) return 0;
  const mult = getMasteryMultiplier(copies);
  let sum = 0;
  for (const eff of def.effects) {
    if (eff.type === effectType) sum += eff.value;
  }
  return sum * mult;
}

/**
 * Sum the value of all equipped artifacts that contribute a given effect type.
 * Returns 0 if no equipped artifact has that effect. Values are scaled by each
 * artifact's mastery multiplier when `copiesById` is provided.
 */
export function getArtifactEffect(
  turn: TurnState,
  effectType: ArtifactEffectType,
  copiesById?: Record<string, number>,
): number {
  const ids = turn.equippedArtifactIds;
  if (!ids || ids.length === 0) return 0;
  let total = 0;
  for (const id of ids) total += scaledEffectValue(id, effectType, copiesById);
  return total;
}

/** Check whether any equipped artifact has a flag effect (value >= 1). */
export function hasArtifactFlag(
  turn: TurnState,
  effectType: ArtifactEffectType,
  copiesById?: Record<string, number>,
): boolean {
  return getArtifactEffect(turn, effectType, copiesById) >= 1;
}

