import type { CardDefinition, CardFinish } from '@/types/cards';

export const HOLOFOIL_RARITY_COSTS = {
  Common: 5,
  Rare: 10,
  Epic: 18,
  Legendary: 30,
  Angel: 40,
} as const;

export function getCardFinishKey(definitionId: string, finish: CardFinish): string {
  return `${definitionId}::${finish}`;
}

export function getCardFinishLabel(finish: CardFinish): string {
  return finish === 'holo' ? 'Holofoil' : 'Normal';
}

export function isHoloOnlyCard(definition: CardDefinition): boolean {
  return definition.rarity === 'Eternal';
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

export function getHolofoilConversionCost(definition: CardDefinition | undefined): number | null {
  if (!definition || isHoloOnlyCard(definition)) return null;
  if (definition.type === 'Angel') return HOLOFOIL_RARITY_COSTS.Angel;
  return HOLOFOIL_RARITY_COSTS[definition.rarity as keyof Omit<typeof HOLOFOIL_RARITY_COSTS, 'Angel'>] ?? null;
}

export function canConvertCardToHolo(
  definition: CardDefinition | undefined,
  collection: Record<string, number>,
  holoCollection: Record<string, number>,
): boolean {
  if (!definition) return false;
  if (getHolofoilConversionCost(definition) === null) return false;
  return getNormalOwnedCopies(definition, collection, holoCollection) > 0;
}
