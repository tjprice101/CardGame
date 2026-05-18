import type { CardFinish } from '@/types/cards';
import type { DeckEntry, ExtraDeckEntry } from '@/types/game';

function normalDeckEntry(definitionId: string, copies: DeckEntry['copies']): DeckEntry {
  return { definitionId, copies, finish: 'normal' };
}

function normalExtraDeckEntry(definitionId: string, finish: CardFinish = 'normal'): ExtraDeckEntry {
  return { definitionId, finish };
}

// Angels are held in the extra deck  Enot shuffled into the main draw pile.
export const STARTER_EXTRA_DECK: ExtraDeckEntry[] = [
  normalExtraDeckEntry('angel-neutral-beginning'),
];

// 50-card Neutrality Standard deck
// Seraphim (12): nullÁE, voidÁE, balanceÁE, equilibriumÁE, stillÁE
// Cherubim (10): null-veilÁE, void-shroudÁE, balance-mantleÁE, equilibrium-wardÁE, still-shellÁE
// Ophanim (28): tuned for consistent angel summon + Cherubim board presence
export const STARTER_DECK_LIST: DeckEntry[] = [
  // Seraphim
  normalDeckEntry('ser-neutral-null', 4),
  normalDeckEntry('ser-neutral-void', 3),
  normalDeckEntry('ser-neutral-balance', 2),
  normalDeckEntry('ser-neutral-equilibrium', 2),
  normalDeckEntry('ser-neutral-still', 1),
  // Cherubim
  normalDeckEntry('cherubim-neutral-null-veil', 3),
  normalDeckEntry('cherubim-neutral-void-shroud', 2),
  normalDeckEntry('cherubim-neutral-balance-mantle', 2),
  normalDeckEntry('cherubim-neutral-equilibrium-ward', 2),
  normalDeckEntry('cherubim-neutral-still-shell', 1),
  // Ophanim
  normalDeckEntry('ophanim-neutral-null-seek', 4),
  normalDeckEntry('ophanim-neutral-seraph-recall', 4),
  normalDeckEntry('ophanim-neutral-neutral-cycle', 3),
  normalDeckEntry('ophanim-neutral-measured-seek', 3),
  normalDeckEntry('ophanim-neutral-void-surge', 3),
  normalDeckEntry('ophanim-neutral-still-pulse', 3),
  normalDeckEntry('ophanim-neutral-chain-pulse', 3),
  normalDeckEntry('ophanim-neutral-cherubim-recall', 3),
  normalDeckEntry('ophanim-neutral-deep-seek', 2),
];

// Full Neutrality collection  Eenough copies to fill the starter deck
export const STARTER_COLLECTION: Record<string, number> = {
  'angel-neutral-beginning': 1,
  // Seraphim
  'ser-neutral-null': 4,
  'ser-neutral-void': 3,
  'ser-neutral-balance': 2,
  'ser-neutral-equilibrium': 2,
  'ser-neutral-still': 1,
  // Cherubim
  'cherubim-neutral-null-veil': 3,
  'cherubim-neutral-void-shroud': 2,
  'cherubim-neutral-balance-mantle': 2,
  'cherubim-neutral-equilibrium-ward': 2,
  'cherubim-neutral-still-shell': 1,
  // Ophanim
  'ophanim-neutral-null-seek': 4,
  'ophanim-neutral-seraph-recall': 4,
  'ophanim-neutral-neutral-cycle': 3,
  'ophanim-neutral-measured-seek': 3,
  'ophanim-neutral-void-surge': 3,
  'ophanim-neutral-still-pulse': 3,
  'ophanim-neutral-chain-pulse': 3,
  'ophanim-neutral-cherubim-recall': 3,
  'ophanim-neutral-deep-seek': 2,
};
