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
export const ENIGMA_REWARD_AMPLIFIER_ID = 'enig-neutral-amplifier-of-the-void';
export const ENIGMA_REWARD_SURGEBLADE_ID = 'enig-neutral-null-born-surgeblade';

export const ENIGMA_DEFINITIONS: EnigmaDefinition[] = [
  {
    id: 'to-amplify-the-nullitude',
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
