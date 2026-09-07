/**
 * Trial Deck definitions — one per card pack.
 * Each definition contains a curated 50-card main deck, extra deck,
 * guide steps for Guided mode, and a fixed opening hand + ordered draw
 * pile for the Guided walkthrough.
 */
import type { TrialDeckDefinition } from '@/types/game';

export const NEUTRALITY_TUTORIAL_TRIAL_PACK_IDS = {
  starter: 'tutorial-neutrality-starter',
  eternal: 'tutorial-neutrality-eternal',
  infinite: 'tutorial-neutrality-infinite',
} as const;

export type NeutralityTutorialTier = keyof typeof NEUTRALITY_TUTORIAL_TRIAL_PACK_IDS;

const NEUTRALITY_TUTORIAL_TRIAL_DISPLAY_NAMES: Record<string, string> = {
  [NEUTRALITY_TUTORIAL_TRIAL_PACK_IDS.starter]: 'Play Tutorial Turn - Neutrality Starter',
  [NEUTRALITY_TUTORIAL_TRIAL_PACK_IDS.eternal]: 'Play Tutorial Turn - Neutrality Eternal',
  [NEUTRALITY_TUTORIAL_TRIAL_PACK_IDS.infinite]: 'Play Tutorial Turn - Neutrality Infinite',
};

export function isNeutralityTutorialTrialPackId(packId: string | null | undefined): boolean {
  if (!packId) return false;
  return Object.values(NEUTRALITY_TUTORIAL_TRIAL_PACK_IDS).includes(packId as (typeof NEUTRALITY_TUTORIAL_TRIAL_PACK_IDS)[NeutralityTutorialTier]);
}

export function getTrialDeckDisplayName(packId: string): string | null {
  if (NEUTRALITY_TUTORIAL_TRIAL_DISPLAY_NAMES[packId]) {
    return NEUTRALITY_TUTORIAL_TRIAL_DISPLAY_NAMES[packId];
  }
  return TRIAL_DECK_DEFINITIONS[packId]?.displayName ?? null;
}

function d(definitionId: string, copies: 1 | 2 | 3 | 4): { definitionId: string; copies: 1 | 2 | 3 | 4; finish: 'normal' } {
  return { definitionId, copies, finish: 'normal' };
}
function e(definitionId: string): { definitionId: string; finish: 'normal' } {
  return { definitionId, finish: 'normal' };
}

// ── Neutrality ────────────────────────────────────────────────────────────────
const neutralityTrial: TrialDeckDefinition = {
  packId: 'pack-neutrality',
  displayName: 'Neutrality — Light',
  deckList: [
    d('ser-neutral-null', 4),
    d('ser-neutral-void', 4),
    d('ser-neutral-balance', 4),
    d('ser-neutral-equilibrium', 4),
    d('ser-neutral-still', 2),
    d('cherubim-neutral-null-veil', 4),
    d('cherubim-neutral-void-shroud', 3),
    d('cherubim-neutral-balance-mantle', 2),
    d('cherubim-neutral-equilibrium-ward', 2),
    d('cherubim-neutral-still-shell', 1),
    d('ophanim-neutral-null-seek', 4),
    d('ophanim-neutral-seraph-recall', 4),
    d('ophanim-neutral-neutral-cycle', 4),
    d('ophanim-neutral-void-surge', 4),
    d('ophanim-neutral-chain-pulse', 4),
  ],
  extraDeck: [e('angel-neutral-beginning')],
  guideSteps: [
    {
      cardDefinitionId: 'ser-neutral-null',
      hint: 'Null Seraphim (Slot A). On play: +16 Oblivion; the active board state gains Light-stack support while the turn tracks its live Light total for later payoff.',
    },
    {
      cardDefinitionId: 'ser-neutral-equilibrium',
      hint: 'Equilibrium Seraphim (Slot B). On play: +36 Oblivion. While active: +8 Oblivion per card played. Keep the live Light-stack count aligned with the board so the finisher resolves correctly.',
    },
    {
      cardDefinitionId: 'ser-neutral-balance',
      hint: 'Balance Seraphim (Slot C). On play: +20 Oblivion. With multiple active units, the turn tracks the aggregated Light-stack state across the board.',
    },
    {
      cardDefinitionId: 'ophanim-neutral-null-seek',
      hint: 'Null Seek. Draw 2 — pulls Null Seek + Neutral Cycle from top of deck.',
    },
    {
      cardDefinitionId: 'ophanim-neutral-chain-pulse',
      hint: 'Oblivion Pulse. Adds Light-stack support to the active board state, +20 Oblivion, empower next, and draw 1. Your Light total should be aligned with the current board state.',
    },
    {
      cardDefinitionId: 'ophanim-neutral-null-seek',
      hint: 'Null Seek (the one drawn at step 4). Draw 2 more cards. Pile draws keep all three Seraphim ticking +1 Patience each per card played.',
    },
    {
      cardDefinitionId: 'ophanim-neutral-neutral-cycle',
      hint: 'Neutral Cycle. Core mechanic: live board support across multiple Seraphim. Why it scales: every card play advances the active Light-stack state and the board reads it for later payoff. Exact payoff: click Equilibrium Seraphim → Attack now for the big burst while the board remains in the current runtime model.',
    },
  ],
  guidedOpeningHand: [
    'ser-neutral-null',
    'ser-neutral-equilibrium',
    'ser-neutral-balance',
    'ophanim-neutral-null-seek',
    'ophanim-neutral-chain-pulse',
  ],
  guidedDeckOrder: [
    // Splice fodder — first 5 entries match the opening hand IDs 1:1.
    // The store's opening-hand override does `drawPile.indexOf(defId)` then `splice`
    // for each card in guidedOpeningHand, so these get removed from the top first.
    d('ser-neutral-null', 1),
    d('ser-neutral-equilibrium', 1),
    d('ser-neutral-balance', 1),
    d('ophanim-neutral-null-seek', 1),
    d('ophanim-neutral-chain-pulse', 1),
    // True top of deck after splice — drawn deterministically by guide steps:
    d('ophanim-neutral-null-seek', 1),     // drawn by Null Seek at step 4 (1st)
    d('ophanim-neutral-neutral-cycle', 1), // drawn by Null Seek at step 4 (2nd)
    d('ophanim-neutral-void-surge', 1),    // drawn by Chain Pulse at step 5
    d('ser-neutral-void', 1),              // drawn by Null Seek at step 6 (1st)
    d('cherubim-neutral-null-veil', 1),    // drawn by Null Seek at step 6 (2nd)
    // Filler — totals 35 more (45 - 10 above)
    d('ser-neutral-null', 2),
    d('ser-neutral-equilibrium', 2),
    d('ser-neutral-balance', 2),
    d('ser-neutral-void', 3),
    d('ser-neutral-still', 2),
    d('cherubim-neutral-null-veil', 3),
    d('cherubim-neutral-void-shroud', 3),
    d('cherubim-neutral-balance-mantle', 2),
    d('cherubim-neutral-equilibrium-ward', 2),
    d('cherubim-neutral-still-shell', 1),
    d('ophanim-neutral-null-seek', 1),
    d('ophanim-neutral-seraph-recall', 4),
    d('ophanim-neutral-neutral-cycle', 3),
    d('ophanim-neutral-void-surge', 3),
    d('ophanim-neutral-chain-pulse', 2),
  ],
};

/** Master lookup table: packId → TrialDeckDefinition */
export const TRIAL_DECK_DEFINITIONS: Record<string, TrialDeckDefinition> = {
  'pack-neutrality': neutralityTrial,
};

export function getTrialDeckDefinition(packId: string): TrialDeckDefinition | null {
  return TRIAL_DECK_DEFINITIONS[packId] ?? null;
}
