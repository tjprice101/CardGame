import type { BoardState, EnigmaInstance, EnigmaState, ProgressState } from '@/types/game';

export type EnigmaStepKind =
  | 'acquire'
  | 'spend_oblivion'
  | 'count_active_cards'
  | 'match_formation'
  | 'boss_victory_timed'
  | 'boss_victory_scaled'
  | 'card_mastery_tier'
  | 'claim_reward';

export type EnigmaUnlockCondition = 'causality-light' | 'causality-light-dark' | 'causality-trinity' | 'causality-three-active' | 'causality-cosmos' | 'specific-cards';

export interface EnigmaRewardDefinition {
  definitionId: string;
  copies: number;
}

export interface EnigmaStepDefinition {
  title: string;
  description: string;
  kind: EnigmaStepKind;
  amount?: number;
  boardPattern?: string[];
  targetDefinitionId?: string;
}

export interface EnigmaDefinition {
  id: string;
  setId: 'Neutrality' | 'Causality';
  minimumUniqueCards: number;
  unlockCondition?: EnigmaUnlockCondition;
  title: string;
  hintText: string;
  unlockHintText?: string;
  unlockCardIds?: string[];
  steps: EnigmaStepDefinition[];
  rewards: EnigmaRewardDefinition[];
}

export const NEUTRAL_MYSTERY_ID = 'neutral-mystery';
export const ENIGMA_REWARD_LIGHT_ID = 'enig-neutral-lumen-genesis';
export const ENIGMA_REWARD_DARK_ID = 'enig-neutral-null-catechism';
export const ENIGMA_REWARD_AMPLIFIER_ID = 'enig-neutral-amplifier-of-the-void';
export const ENIGMA_REWARD_SURGEBLADE_ID = 'enig-neutral-null-born-surgeblade';
export const ENIGMA_REWARD_HORIZON_WEAVER_ID = 'enig-causality-horizon-weaver';
export const ENIGMA_REWARD_INK_OF_THE_FIRST_LAW_ID = 'enig-causality-ink-of-the-first-law';
export const ENIGMA_REWARD_ARCHIVE_OF_UNMADE_STARS_ID = 'enig-causality-archive-of-unmade-stars';
export const ENIGMA_REWARD_BLACK_SUN_EDICT_ID = 'enig-causality-black-sun-edict';
export const ENIGMA_REWARD_AXIOM_BEYOND_THE_HORIZON_ID = 'enig-causality-axiom-beyond-the-horizon';

export const ENIGMA_DEFINITIONS: EnigmaDefinition[] = [
  {
    id: 'to-amplify-the-nullitude',
    setId: 'Neutrality',
    minimumUniqueCards: 5,
    title: 'To Amplify the Nullitude',
    hintText: 'Activate the Power of Null.',
    steps: [
      { title: 'Purchase a Neutrality Ability', description: 'Purchase any Neutrality ability from the Ability Store.', kind: 'acquire' },
      { title: 'Activate the Power of Null', description: 'Activate any Neutrality ability 5 times in one turn.', kind: 'count_active_cards', amount: 5, targetDefinitionId: 'ability-activations-one-turn' },
      { title: 'Complete the Ability Array', description: 'Fill all 3 ability slots in a deck and save it.', kind: 'match_formation', boardPattern: ['ability-slots-3'] },
      { title: 'Nullify the Full Front Row', description: 'Use any Neutrality ability while all 4 front-row slots contain Ain Soph Aur cards.', kind: 'match_formation', boardPattern: ['ability-full-asa-front-row'] },
      { title: 'Claim the Reward', description: 'Receive 3 copies of Amplifier of the Void.', kind: 'claim_reward' },
    ],
    rewards: [{ definitionId: ENIGMA_REWARD_AMPLIFIER_ID, copies: 3 }],
  },
  {
    id: 'null-surged',
    setId: 'Neutrality',
    minimumUniqueCards: 5,
    title: 'Null-surged',
    hintText: 'Bring forth the Power of the Ain Soph Aur.',
    steps: [
      { title: 'Fill the Front Row', description: 'Fill all 4 front-row slots with Ain Soph Aur cards.', kind: 'acquire', boardPattern: ['asa-front-row-4'] },
      { title: 'Summon Through Twin Lights', description: 'Summon 3 Ain Soph Aur cards while 2 Light cards are active.', kind: 'count_active_cards', amount: 3, targetDefinitionId: 'asa-summons-with-2-lights' },
      { title: 'Bridge the Light', description: 'Perform Bridge the Light 10 times.', kind: 'count_active_cards', amount: 10, targetDefinitionId: 'bridge-attacks-10' },
      { title: 'Claim the Reward', description: 'Receive 2 copies of Null-born Surgeblade.', kind: 'claim_reward' },
    ],
    rewards: [{ definitionId: ENIGMA_REWARD_SURGEBLADE_ID, copies: 2 }],
  },
  {
    id: NEUTRAL_MYSTERY_ID,
    setId: 'Neutrality',
    minimumUniqueCards: 5,
    title: 'Neutral Mystery',
    hintText: 'Bring an Ain Soph Aur into the front row and let the hidden pattern begin.',
    steps: [
      {
        title: 'Acquire the Enigma',
        description: 'Summon any Ain Soph Aur from the Extra Deck.',
        kind: 'acquire',
      },
      {
        title: 'Sacrifice 50,000 Divine Light',
        description: 'Use the Enigma panel to spend 50,000 Divine Light after Neutral Mystery is acquired.',
        kind: 'spend_oblivion',
        amount: 50_000,
      },
      {
        title: 'Build the Quiet Field',
        description: 'Have three face-down Soph cards with at least 3 Limitless Charge each on the back row at once.',
        kind: 'count_active_cards',
        amount: 3,
        targetDefinitionId: 'soph-charge-3',
      },
      {
        title: 'Seat the Convergence',
        description: 'Have at least one Ain-side Light and one Ain Soph Aur active on the board at the same time.',
        kind: 'count_active_cards',
      },
      {
        title: 'Claim the Reward',
        description: 'Receive Lumen Genesis.',
        kind: 'claim_reward',
      },
    ],
    rewards: [
      { definitionId: ENIGMA_REWARD_LIGHT_ID, copies: 1 },
    ],
  },
  {
    id: 'neutralizing-the-void',
    setId: 'Neutrality',
    minimumUniqueCards: 5,
    title: 'Neutralizing the Void',
    hintText: 'Open 10 card packs, then stabilize the Neutrality board before the void can answer.',
    steps: [
      {
        title: 'Acquire the Enigma',
        description: 'Open 10 card packs. Enigma progress is unavailable until this threshold is reached.',
        kind: 'acquire',
        amount: 10,
      },
      {
        title: 'Feed the Null 25,000 Divine Light',
        description: 'Use the Enigma panel to spend 25,000 Divine Light after Neutralizing the Void is acquired.',
        kind: 'spend_oblivion',
        amount: 25_000,
      },
      {
        title: 'Raise the Twin Lights',
        description: 'Have two Light cards active on the Ain side of the back row at the same time.',
        kind: 'count_active_cards',
        amount: 2,
        targetDefinitionId: 'ain-light-2',
      },
      {
        title: 'Stabilize the Neutrality Field',
        description: 'Keep two Ain-side Lights and two charged Soph cards active together in the four-slot back row.',
        kind: 'match_formation',
        amount: 2,
        boardPattern: ['ain-light-2', 'soph-charge-2'],
      },
      {
        title: 'Claim the Reward',
        description: 'Receive 3 copies of Equilibrium\u2019s Bane.',
        kind: 'claim_reward',
      },
    ],
    rewards: [
      { definitionId: ENIGMA_REWARD_DARK_ID, copies: 1 },
    ],
  },
  {
    id: 'causality-first-horizon',
    setId: 'Causality',
    minimumUniqueCards: 5,
    title: 'The First Horizon',
    hintText: 'Place a Causality Light card on the Ain side of the back row to reveal the first horizon.',
    unlockCondition: 'causality-light',
    steps: [
      { title: 'Reveal the First Horizon', description: 'Place a Causality Light card on the Ain side of the back row.', kind: 'acquire', boardPattern: ['causality-light-ain'] },
      { title: 'Write the Horizon', description: 'Play 5 Causality cards in a single turn to trace the opening line.', kind: 'count_active_cards', amount: 5, targetDefinitionId: 'causality-plays-one-turn' },
      { title: 'Raise the Cosmos', description: 'Generate 3 Limitless Cosmos stacks from Causality effects before the page can settle.', kind: 'count_active_cards', amount: 3, targetDefinitionId: 'causality-cosmos-3' },
      { title: 'Claim the Reward', description: 'Receive the first luminous reward from the manuscript.', kind: 'claim_reward' },
    ],
    rewards: [{ definitionId: ENIGMA_REWARD_HORIZON_WEAVER_ID, copies: 1 }],
  },
  {
    id: 'causality-black-ink',
    setId: 'Causality',
    minimumUniqueCards: 5,
    title: 'Black Ink, White Star',
    hintText: 'Place opposing Causality Light and Dark cards together on the Ain back row.',
    unlockCondition: 'causality-light-dark',
    steps: [
      { title: 'Write the Contradiction', description: 'Place opposing Causality Light and Dark cards together on the Ain back row.', kind: 'acquire', boardPattern: ['causality-light-ain', 'causality-dark-ain'] },
      { title: 'Pair the Opposites', description: 'Have one Causality Light card and one Causality Dark card active together at once.', kind: 'match_formation', boardPattern: ['causality-light-1', 'causality-dark-1'] },
      { title: 'Burn Through the Void', description: 'Consume 2 Limitless Cosmos stacks through Causality effects to ignite the black ink.', kind: 'count_active_cards', amount: 2, targetDefinitionId: 'causality-cosmos-spent-2' },
      { title: 'Claim the Reward', description: 'Seal the contradiction and take the manuscript’s dark reward.', kind: 'claim_reward' },
    ],
    rewards: [{ definitionId: ENIGMA_REWARD_INK_OF_THE_FIRST_LAW_ID, copies: 1 }],
  },
  {
    id: 'causality-heavenly-archive',
    setId: 'Causality',
    minimumUniqueCards: 5,
    title: 'The Heavenly Archive',
    hintText: 'Play Eventide Archivist, Gravitic Testament, and Asterion of the Last Gate.',
    unlockCondition: 'specific-cards',
    unlockCardIds: ['light-causality-1', 'dark-causality-1', 'ain-soph-aur-causality-2'],
    steps: [
      { title: 'Open the Archive', description: 'Play Eventide Archivist, Gravitic Testament, and Asterion of the Last Gate at least once each.', kind: 'acquire', targetDefinitionId: 'specific-causality-cards' },
      { title: 'Open the Archive', description: 'Have one Causality Light, one Causality Dark, and one Causality Ain Soph Aur active in the same turn.', kind: 'match_formation', boardPattern: ['causality-light-1', 'causality-dark-1', 'causality-asa-1'] },
      { title: 'Cross the Event Horizon', description: 'Perform 3 successful Bridge the Light attacks with Causality ASA cards to complete the archival pass.', kind: 'count_active_cards', amount: 3, targetDefinitionId: 'causality-bridge-3' },
      { title: 'Claim the Reward', description: 'The archive accepts your sequence and grants the stored ascent.', kind: 'claim_reward' },
    ],
    rewards: [{ definitionId: ENIGMA_REWARD_AXIOM_BEYOND_THE_HORIZON_ID, copies: 1 }],
  },
  {
    id: 'causality-collapsed-equation',
    setId: 'Causality',
    minimumUniqueCards: 5,
    title: 'The Collapsed Equation',
    hintText: 'Fill three active Causality board positions at once to collapse the equation.',
    unlockCondition: 'causality-three-active',
    steps: [
      { title: 'Collapse the Equation', description: 'Fill three active Causality board positions at once.', kind: 'acquire', amount: 3, boardPattern: ['causality-three-active'] },
      { title: 'Build the Equation', description: 'Play 10 Causality cards across the sequence to gather the full momentum of the page.', kind: 'count_active_cards', amount: 10, targetDefinitionId: 'causality-plays-10' },
      { title: 'Cash Out the Horizon', description: 'Earn 10,000 Divine Light from Causality card effects in a single decisive turn.', kind: 'count_active_cards', amount: 10_000, targetDefinitionId: 'causality-light-10k' },
      { title: 'Claim the Reward', description: 'Let the equation collapse into a single perfect resolution.', kind: 'claim_reward' },
    ],
    rewards: [{ definitionId: ENIGMA_REWARD_ARCHIVE_OF_UNMADE_STARS_ID, copies: 1 }],
  },
  {
    id: 'causality-unwritten-law',
    setId: 'Causality',
    minimumUniqueCards: 5,
    title: 'The Unwritten Law',
    hintText: 'Hold 5 Limitless Cosmos stacks at once to write the unwritten law.',
    unlockCondition: 'causality-cosmos',
    steps: [
      { title: 'Write the Unwritten Law', description: 'Hold 5 Limitless Cosmos stacks at once.', kind: 'acquire', amount: 5, targetDefinitionId: 'causality-cosmos-5' },
      { title: 'Complete the Manuscript', description: 'Use a Causality Light card, a Causality Dark card, and a Causality ASA in the same turn.', kind: 'match_formation', boardPattern: ['causality-light-1', 'causality-dark-1', 'causality-asa-1'] },
      { title: 'Hold the Cosmos', description: 'End the turn with at least 5 Limitless Cosmos stacks to keep the event horizon open.', kind: 'count_active_cards', amount: 5, targetDefinitionId: 'causality-cosmos-5' },
      { title: 'Claim the Reward', description: 'Write the final law into the page and claim the last manuscript reward.', kind: 'claim_reward' },
    ],
    rewards: [{ definitionId: ENIGMA_REWARD_BLACK_SUN_EDICT_ID, copies: 1 }],
  },
];

export function getEnigmaDefinition(id: string): EnigmaDefinition | undefined {
  return ENIGMA_DEFINITIONS.find(def => def.id === id);
}

export function createDefaultEnigmaState(): EnigmaState {
  return {
    activeEnigmaId: null,
    instances: {},
  };
}

export function createEnigmaInstance(id: string): EnigmaInstance {
  const definition = getEnigmaDefinition(id);
  return {
    id,
    status: 'locked',
    currentStepIndex: 0,
    stepsComplete: new Array(definition?.steps.length ?? 0).fill(false),
    progressCounters: {},
  };
}

export function getEnigmaStep(instance: EnigmaInstance, stepIndex: number): EnigmaStepDefinition | null {
  const definition = getEnigmaDefinition(instance.id);
  return definition?.steps[stepIndex] ?? null;
}

export function isNeutralMysteryAcquired(board: BoardState): boolean {
  return board.frontSlots.some(slot => slot?.type === 'AinSophAur');
}

export function isNeutralMysteryBoardPattern(board: BoardState): boolean {
  return board.frontSlots.some(slot => slot?.type === 'AinSophAur')
    && board.backSlots.some(slot => slot?.type === 'Light' && slot.side === 'ain');
}

export function getActiveEnigmaInstance(progress: ProgressState): EnigmaInstance | null {
  const activeId = progress.enigmas.activeEnigmaId;
  if (!activeId) return null;
  return progress.enigmas.instances[activeId] ?? null;
}
