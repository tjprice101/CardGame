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
  displayName: 'Neutrality — First Light',
  deckList: [
    d('light-neutrality-1', 4),
    d('light-neutrality-2', 4),
    d('light-neutrality-3', 4),
    d('light-neutrality-4', 4),
    d('light-neutrality-5', 4),
    d('dark-neutrality-1', 4),
    d('dark-neutrality-2', 4),
    d('dark-neutrality-3', 4),
    d('dark-neutrality-4', 4),
    d('dark-neutrality-5', 4),
    d('light-neutrality-1', 2),
    d('dark-neutrality-1', 2),
  ],
  extraDeck: Array.from({ length: 4 }, () => e('ain-soph-aur-neutrality-1')),
  guideSteps: [
    { cardDefinitionId: 'light-neutrality-1', hint: 'Left-click this Light card to place it face-down as Soph. Each hand play charges face-down Soph cards.' },
    { cardDefinitionId: 'dark-neutrality-1', hint: 'Left-click this Dark utility card to place it face-down as Soph. Keep building charge before choosing when to flip.' },
    { cardDefinitionId: 'light-neutrality-2', hint: 'At 5+ charge, flip a Soph card to Ain and bank its charge as Limitless Light Stacks.' },
    { cardDefinitionId: 'light-neutrality-3', hint: 'Use an Ain Attack to earn Divine Light without spending your Light Stacks.' },
    { cardDefinitionId: 'dark-neutrality-2', hint: 'Dark cards provide utility. Follow the card text for its activation cost and destination.' },
    { cardDefinitionId: 'ain-soph-aur-neutrality-1', hint: 'Sacrifice the required back-row materials to summon The White Null from the Extra Deck.' },
  ],
  guidedOpeningHand: [
    'light-neutrality-1',
    'dark-neutrality-1',
    'light-neutrality-2',
    'light-neutrality-3',
    'dark-neutrality-2',
  ],
  guidedDeckOrder: [
    d('light-neutrality-1', 1),
    d('dark-neutrality-1', 1),
    d('light-neutrality-2', 1),
    d('light-neutrality-3', 1),
    d('dark-neutrality-2', 1),
    d('light-neutrality-4', 4),
    d('dark-neutrality-3', 4),
    d('light-neutrality-5', 4),
    d('dark-neutrality-4', 4),
    d('light-neutrality-1', 3),
    d('dark-neutrality-1', 3),
    d('light-neutrality-2', 4),
    d('dark-neutrality-2', 4),
  ],
};

/** Master lookup table: packId → TrialDeckDefinition */
export const TRIAL_DECK_DEFINITIONS: Record<string, TrialDeckDefinition> = {
  'pack-neutrality': neutralityTrial,
};

export function getTrialDeckDefinition(packId: string): TrialDeckDefinition | null {
  return TRIAL_DECK_DEFINITIONS[packId] ?? null;
}
