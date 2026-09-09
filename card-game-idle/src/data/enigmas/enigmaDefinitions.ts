import type { BoardState, EnigmaInstance, EnigmaState, ProgressState } from '@/types/game';

export type EnigmaStepKind =
  | 'acquire'
  | 'spend_oblivion'
  | 'count_active_cards'
  | 'match_formation'
  | 'boss_victory_timed'
  | 'boss_victory_scaled'
  | 'sacrifice_shards'
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
        description: 'Spend 50,000 Divine Light to fuel the next seal.',
        kind: 'spend_oblivion',
        amount: 50_000,
      },
      {
        title: 'Charge the Quiet Field',
        description: 'Keep three face-down Soph cards at 3 or more Limitless Charge at the same time.',
        kind: 'count_active_cards',
        amount: 3,
        targetDefinitionId: 'soph-charge-3',
      },
      {
        title: 'Seat the Convergence',
        description: 'Have an Ain-side Light and an Ain Soph Aur active together.',
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
        title: 'Activate and Clear Eternal Vigil \u00d73 HP',
        description: 'Defeat The Hollow Queen boss fight at \u00d73 HP scaling.',
        kind: 'boss_victory_scaled',
        amount: 3,
        targetDefinitionId: 'boss-eternal-null',
      },
      {
        title: 'Sacrifice 2,500 Aberrated Shards',
        description: 'Spend 2,500 Aberrated Shards to advance this seal.',
        kind: 'sacrifice_shards',
        amount: 2_500,
      },
      {
        title: 'Reach Card-born Tier 4',
        description: 'Have at least one Eternal card reach Card-born Tier 4 or higher. Completing this retroactively counts.',
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
