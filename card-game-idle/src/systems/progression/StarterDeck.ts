import type { DeckEntry } from '@/types/game';

// Angels are held in the extra deck — not shuffled into the main draw pile.
export const STARTER_EXTRA_DECK: string[] = [
  'angel-neutral-beginning',
];

// 50-card Neutrality Standard deck
// Seraphim (12): null×4, void×3, balance×2, equilibrium×2, still×1
// Chaos (10): null-veil×3, void-shroud×2, balance-mantle×2, equilibrium-ward×2, still-shell×1
// Seeker (28): tuned for consistent angel summon + Chaos board presence
export const STARTER_DECK_LIST: DeckEntry[] = [
  // Seraphim
  { definitionId: 'ser-neutral-null',        copies: 4 },
  { definitionId: 'ser-neutral-void',        copies: 3 },
  { definitionId: 'ser-neutral-balance',     copies: 2 },
  { definitionId: 'ser-neutral-equilibrium', copies: 2 },
  { definitionId: 'ser-neutral-still',       copies: 1 },
  // Chaos
  { definitionId: 'chaos-neutral-null-veil',         copies: 3 },
  { definitionId: 'chaos-neutral-void-shroud',       copies: 2 },
  { definitionId: 'chaos-neutral-balance-mantle',    copies: 2 },
  { definitionId: 'chaos-neutral-equilibrium-ward',  copies: 2 },
  { definitionId: 'chaos-neutral-still-shell',       copies: 1 },
  // Seeker
  { definitionId: 'seek-neutral-null-seek',      copies: 4 },
  { definitionId: 'seek-neutral-seraph-recall',  copies: 4 },
  { definitionId: 'seek-neutral-neutral-cycle',  copies: 3 },
  { definitionId: 'seek-neutral-measured-seek',  copies: 3 },
  { definitionId: 'seek-neutral-void-surge',     copies: 3 },
  { definitionId: 'seek-neutral-still-pulse',    copies: 3 },
  { definitionId: 'seek-neutral-chain-pulse',    copies: 3 },
  { definitionId: 'seek-neutral-chaos-recall',   copies: 3 },
  { definitionId: 'seek-neutral-deep-seek',      copies: 2 },
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
