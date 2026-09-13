import type { CardDefinition, CardFinish } from '@/types/cards';

export function getCardFinishKey(definitionId: string, finish: CardFinish): string {
  return `${definitionId}::${finish}`;
}

export function getCardFinishLabel(finish: CardFinish): string {
  return finish === 'holo' ? 'Holofoil' : 'Normal';
}

export function isHoloOnlyCard(definition: CardDefinition): boolean {
  // Eternal/Infinite rarities are always holofoil.
  // Enigmatic cards are already printed with the holofoil treatment by default.
  // Transcendent cards are also always holofoil — they drop pre-foiled.
  return definition.rarity === 'Eternal' || definition.rarity === 'Infinite' || definition.rarity === 'Transcendent'
    || definition.rarity === 'Enigmatic';
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
