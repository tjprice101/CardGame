import type { BoardState, EnigmaInstance, EnigmaState, ProgressState } from '@/types/game';
import { CardRegistry } from '@/cards/CardRegistry';

export type EnigmaStepKind =
  | 'acquire'
  | 'spend_oblivion'
  | 'count_active_cards'
  | 'match_formation'
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
export const TBATE_ID = 'angel-neutral-beginning';
export const AEGIS_OF_PRESENCE_ID = 'angel-neutral-presence';
export const AEGIS_OF_EQUILIBRIUM_ID = 'angel-neutral-equilibrium';
export const NULL_SERAPHIM_ID = 'ser-neutral-null';

export const ENIGMA_DEFINITIONS: EnigmaDefinition[] = [
  {
    id: NEUTRAL_MYSTERY_ID,
    title: 'Neutral Mystery',
    hintText: 'When each God of Equilibrium is brought forth, only then shall this mystery unfold.',
    steps: [
      {
        title: 'Acquire the Enigma',
        description: 'Summon and keep The Beginning and the End, Aegis of Presence, and Aegis of Equilibrium active together.',
        kind: 'acquire',
      },
      {
        title: 'Sacrifice 50,000 Oblivion',
        description: 'Spend down your lifetime Oblivion total to fuel the next seal.',
        kind: 'spend_oblivion',
        amount: 50_000,
      },
      {
        title: 'Summon 3 Aegis of Presence',
        description: 'Have three Aegis of Presence active at the same time in a single turn.',
        kind: 'count_active_cards',
        amount: 3,
        targetDefinitionId: AEGIS_OF_PRESENCE_ID,
      },
      {
        title: 'Field Null and Equilibrium',
        description: 'Have 3 Null Seraphims and 2 Aegis of Equilibrium on your board at the same time during the same turn.',
        kind: 'count_active_cards',
      },
      {
        title: 'Claim the Reward',
        description: 'Receive 2 copies of Neutralistic Flame.',
        kind: 'claim_reward',
      },
    ],
    rewards: [
      { definitionId: 'enig-neutralistic-flame', copies: 2 },
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
  const ids = [TBATE_ID, AEGIS_OF_PRESENCE_ID, AEGIS_OF_EQUILIBRIUM_ID];
  return ids.every(definitionId => board.frontSlots.some(slot => {
    if (!slot) return false;
    const def = CardRegistry.get(slot.definitionId);
    if (!def) return false;
    if (def.definitionId !== definitionId) return false;
    return slot.type === 'Angel' ? true : slot.type === 'Seraphim' ? slot.isActive : false;
  }));
}

export function isNeutralMysteryBoardPattern(board: BoardState): boolean {
  const pattern = [NULL_SERAPHIM_ID, TBATE_ID, NULL_SERAPHIM_ID, AEGIS_OF_PRESENCE_ID, AEGIS_OF_EQUILIBRIUM_ID];
  return board.frontSlots.every((slot, index) => slot?.definitionId === pattern[index]);
}

export function getActiveEnigmaInstance(progress: ProgressState): EnigmaInstance | null {
  const activeId = progress.enigmas.activeEnigmaId;
  if (!activeId) return null;
  return progress.enigmas.instances[activeId] ?? null;
}
