import type { CardFinish } from '@/types/cards';
import type { DeckEntry, ExtraDeckEntry } from '@/types/game';

function normalDeckEntry(definitionId: string, copies: DeckEntry['copies']): DeckEntry {
  return { definitionId, copies, finish: 'normal' };
}

function normalExtraDeckEntry(definitionId: string, finish: CardFinish = 'normal'): ExtraDeckEntry {
  return { definitionId, finish };
}

// Angels are held in the extra deck — not shuffled into the main draw pile.
export const STARTER_EXTRA_DECK: ExtraDeckEntry[] = [
  normalExtraDeckEntry('angel-neutral-beginning'),
];

// 50-card Neutrality Standard deck
// Seraphim (12): null×4, void×3, balance×2, equilibrium×2, still×1
// Chaos (10): null-veil×3, void-shroud×2, balance-mantle×2, equilibrium-ward×2, still-shell×1
// Seeker (28): tuned for consistent angel summon + Chaos board presence
export const STARTER_DECK_LIST: DeckEntry[] = [
  // Seraphim
  normalDeckEntry('ser-neutral-null', 4),
  normalDeckEntry('ser-neutral-void', 3),
  normalDeckEntry('ser-neutral-balance', 2),
  normalDeckEntry('ser-neutral-equilibrium', 2),
  normalDeckEntry('ser-neutral-still', 1),
  // Chaos
  normalDeckEntry('chaos-neutral-null-veil', 3),
  normalDeckEntry('chaos-neutral-void-shroud', 2),
  normalDeckEntry('chaos-neutral-balance-mantle', 2),
  normalDeckEntry('chaos-neutral-equilibrium-ward', 2),
  normalDeckEntry('chaos-neutral-still-shell', 1),
  // Seeker
  normalDeckEntry('seek-neutral-null-seek', 4),
  normalDeckEntry('seek-neutral-seraph-recall', 4),
  normalDeckEntry('seek-neutral-neutral-cycle', 3),
  normalDeckEntry('seek-neutral-measured-seek', 3),
  normalDeckEntry('seek-neutral-void-surge', 3),
  normalDeckEntry('seek-neutral-still-pulse', 3),
  normalDeckEntry('seek-neutral-chain-pulse', 3),
  normalDeckEntry('seek-neutral-chaos-recall', 3),
  normalDeckEntry('seek-neutral-deep-seek', 2),
];

// Full Neutrality collection — enough copies to fill the starter deck
export const STARTER_COLLECTION: Record<string, number> = {
  'angel-neutral-beginning': 1,
  // Seraphim
  'ser-neutral-null': 4,
  'ser-neutral-void': 3,
  'ser-neutral-balance': 2,
  'ser-neutral-equilibrium': 2,
  'ser-neutral-still': 1,
  // Chaos
  'chaos-neutral-null-veil': 3,
  'chaos-neutral-void-shroud': 2,
  'chaos-neutral-balance-mantle': 2,
  'chaos-neutral-equilibrium-ward': 2,
  'chaos-neutral-still-shell': 1,
  // Seeker
  'seek-neutral-null-seek': 4,
  'seek-neutral-seraph-recall': 4,
  'seek-neutral-neutral-cycle': 3,
  'seek-neutral-measured-seek': 3,
  'seek-neutral-void-surge': 3,
  'seek-neutral-still-pulse': 3,
  'seek-neutral-chain-pulse': 3,
  'seek-neutral-chaos-recall': 3,
  'seek-neutral-deep-seek': 2,
};
