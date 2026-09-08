import type { CardFinish } from '@/types/cards';
import type { DeckEntry, ExtraDeckEntry } from '@/types/game';

function normalDeckEntry(definitionId: string, copies: DeckEntry['copies']): DeckEntry {
  return { definitionId, copies, finish: 'normal' };
}

function normalExtraDeckEntry(definitionId: string, finish: CardFinish = 'normal'): ExtraDeckEntry {
  return { definitionId, finish };
}

// The default new-user deck is intentionally weak: fourteen basic Neutrality Light/Dark
// cards, with a single basic Ain Soph Aur available in the Extra Deck.
export const STARTER_EXTRA_DECK: ExtraDeckEntry[] = Array.from({ length: 4 }, () =>
  normalExtraDeckEntry('ain-soph-aur-neutrality-1'),
);

// 50-card Main Deck: six basic Light cards, six basic Dark utilities, and two
// single-copy cards to keep the starter pool broad without exceeding 4 copies.
export const STARTER_DECK_LIST: DeckEntry[] = [
  ...Array.from({ length: 6 }, (_, index) => normalDeckEntry(`light-neutrality-${index + 1}`, 4)),
  ...Array.from({ length: 6 }, (_, index) => normalDeckEntry(`dark-neutrality-${index + 1}`, 4)),
  normalDeckEntry('light-neutrality-7', 1),
  normalDeckEntry('dark-neutrality-7', 1),
];

// Collection contains exactly the cards needed to fill the default weak deck.
export const STARTER_COLLECTION: Record<string, number> = {
  ...Object.fromEntries([
    ...Array.from({ length: 6 }, (_, index) => [`light-neutrality-${index + 1}`, 4]),
    ...Array.from({ length: 6 }, (_, index) => [`dark-neutrality-${index + 1}`, 4]),
    ['light-neutrality-7', 1],
    ['dark-neutrality-7', 1],
    ['ain-soph-aur-neutrality-1', 4],
  ]),
};
