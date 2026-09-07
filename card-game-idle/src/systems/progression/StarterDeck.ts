import type { CardFinish } from '@/types/cards';
import type { DeckEntry, ExtraDeckEntry } from '@/types/game';

function normalDeckEntry(definitionId: string, copies: DeckEntry['copies']): DeckEntry {
  return { definitionId, copies, finish: 'normal' };
}

function normalExtraDeckEntry(definitionId: string, finish: CardFinish = 'normal'): ExtraDeckEntry {
  return { definitionId, finish };
}

// Ain Soph Aur cards live in the Extra Deck and are never shuffled into hand.
export const STARTER_EXTRA_DECK: ExtraDeckEntry[] = Array.from({ length: 12 }, (_, index) =>
  normalExtraDeckEntry(`ain-soph-aur-neutrality-${index + 1}`),
);

// 50-card Main Deck: 25 Light creatures + 25 Dark utilities.
export const STARTER_DECK_LIST: DeckEntry[] = [
  ...Array.from({ length: 25 }, (_, index) => normalDeckEntry(`light-neutrality-${index + 1}`, 1)),
  ...Array.from({ length: 25 }, (_, index) => normalDeckEntry(`dark-neutrality-${index + 1}`, 1)),
];

// Full Neutrality collection  Eenough copies to fill the starter deck
export const STARTER_COLLECTION: Record<string, number> = {
  ...Object.fromEntries([
    ...Array.from({ length: 25 }, (_, index) => [`light-neutrality-${index + 1}`, 1]),
    ...Array.from({ length: 25 }, (_, index) => [`dark-neutrality-${index + 1}`, 1]),
    ...Array.from({ length: 12 }, (_, index) => [`ain-soph-aur-neutrality-${index + 1}`, 1]),
  ]),
};
