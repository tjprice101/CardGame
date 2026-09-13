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
  title: string;
  hintText: string;
  steps: EnigmaStepDefinition[];
  rewards: EnigmaRewardDefinition[];
}

export const NEUTRAL_MYSTERY_ID = 'neutral-mystery';
export const ENIGMA_REWARD_LIGHT_ID = 'enig-neutral-lumen-genesis';
export const ENIGMA_REWARD_DARK_ID = 'enig-neutral-null-catechism';

export const ENIGMA_DEFINITIONS: EnigmaDefinition[] = [
  {
    id: NEUTRAL_MYSTERY_ID,
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
    title: 'Neutralizing the Void',
    hintText: 'Break the Eternal Null quickly, then prove that mastery survives the silence.',
    steps: [
      {
        title: 'Acquire the Enigma',
        description: 'Clear The Eternal Null boss fight with at least 1 minute and 30 seconds remaining on the clock.',
        kind: 'boss_victory_timed',
        amount: 90,
        targetDefinitionId: 'boss-eternal-null',
      },
      {
        title: 'Clear the Threefold Vigil',
        description: 'Start The Eternal Null with the 3-fight challenge selected and complete the fight.',
        kind: 'boss_victory_scaled',
        amount: 3,
        targetDefinitionId: 'boss-eternal-null',
      },
      {
        title: 'Reach Card-born Tier 4',
        description: 'Claim Card-born Tier 4 or higher for an Eternal card. Progress already claimed counts when this step unlocks.',
        kind: 'card_mastery_tier',
        amount: 4,
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
