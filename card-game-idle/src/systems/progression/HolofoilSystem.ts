import type { CardDefinition, CardFinish } from '@/types/cards';

export const HOLOFOIL_RARITY_COSTS = {
  Common: 5,
  Rare: 10,
  Epic: 18,
  Legendary: 30,
  Angel: 40,
} as const;

/**
 * Per-set exponential scaling factor for holofoil conversions. The Nth holo
 * copy converted within a given set (element) multiplies that conversion's
 * cost by SET_EXPONENT^N — so holofoiling deeper into a set becomes an
 * exponentially expensive milestone. The first conversion in a set is at
 * base cost.
 */
export const HOLOFOIL_SET_EXPONENT = 1.25;

export function getCardFinishKey(definitionId: string, finish: CardFinish): string {
  return `${definitionId}::${finish}`;
}

export function getCardFinishLabel(finish: CardFinish): string {
  return finish === 'holo' ? 'Holofoil' : 'Normal';
}

export function isHoloOnlyCard(definition: CardDefinition): boolean {
  return definition.rarity === 'Eternal' || definition.rarity === 'Infinite';
}

export function getHoloOwnedCopies(
  collection: Record<string, number>,
  holoCollection: Record<string, number>,
  definitionId: string,
): number {
  return Math.min(holoCollection[definitionId] ?? 0, collection[definitionId] ?? 0);
}

export function getNormalOwnedCopies(
  definition: CardDefinition,
  collection: Record<string, number>,
  holoCollection: Record<string, number>,
): number {
  if (isHoloOnlyCard(definition)) return 0;
  return Math.max(0, (collection[definition.definitionId] ?? 0) - getHoloOwnedCopies(collection, holoCollection, definition.definitionId));
}

export function getOwnedCopiesForFinish(
  definition: CardDefinition,
  finish: CardFinish,
  collection: Record<string, number>,
  holoCollection: Record<string, number>,
): number {
  return finish === 'holo'
    ? getHoloOwnedCopies(collection, holoCollection, definition.definitionId)
    : getNormalOwnedCopies(definition, collection, holoCollection);
}

/**
 * Count of total holofoil copies the player already owns. Drives the exponential cost ramp.
 */
export function getSetHoloCount(
  _definition: CardDefinition,
  holoCollection: Record<string, number>,
): number {
  let total = 0;
  for (const [, count] of Object.entries(holoCollection)) {
    if ((count ?? 0) <= 0) continue;
    total += count;
  }
  return total;
}

export function getHolofoilBaseCost(definition: CardDefinition | undefined): number | null {
  if (!definition || isHoloOnlyCard(definition)) return null;
  if (definition.type === 'Angel') return HOLOFOIL_RARITY_COSTS.Angel;
  return HOLOFOIL_RARITY_COSTS[definition.rarity as keyof Omit<typeof HOLOFOIL_RARITY_COSTS, 'Angel'>] ?? null;
}

/**
 * Returns the shard cost for converting one normal copy of `definition` into
 * holofoil. Cost is always the flat base cost regardless of how many holos
 * are already owned in the same set.
 */
export function getHolofoilConversionCost(
  definition: CardDefinition | undefined,
  _holoCollection?: Record<string, number>,
): number | null {
  return getHolofoilBaseCost(definition);
}

export function canConvertCardToHolo(
  definition: CardDefinition | undefined,
  collection: Record<string, number>,
  holoCollection: Record<string, number>,
): boolean {
  if (!definition) return false;
  if (getHolofoilBaseCost(definition) === null) return false;
  return getNormalOwnedCopies(definition, collection, holoCollection) > 0;
}
