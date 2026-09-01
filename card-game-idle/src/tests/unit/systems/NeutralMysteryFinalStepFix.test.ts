import { beforeEach, describe, expect, it } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
import {
  NULL_SERAPHIM_ID,
  EQUILIBRIUM_SERAPHIM_ID,
} from '@/data/enigmas/enigmaDefinitions';
import type { SeraphimInstance } from '@/types/cards';

function resetStore(): void {
  const base = JSON.parse(JSON.stringify(defaultGameState)) as typeof defaultGameState;
  useStore.setState(s => ({ ...s, ...base }));
  useStore.getState().refreshComputedStats();
}

function makeSeraphim(definitionId: string, slot: number, instanceId: string): SeraphimInstance {
  return {
    instanceId,
    definitionId,
    type: 'Seraphim',
    element: 'Neutrality',
    rarity: 'Common',
    level: 1,
    isActive: true,
    boardSlot: slot as 0 | 1 | 2 | 3 | 4,
    attackCooldowns: {},
    patienceStacks: 0,
  };
}

/** Board with 3 Null Seraphim + 2 Equilibrium Seraphim — the exact combo for neutral-mystery step 3. */
function validFinalStepBoard(): [SeraphimInstance, SeraphimInstance, SeraphimInstance, SeraphimInstance, SeraphimInstance] {
  return [
    makeSeraphim(NULL_SERAPHIM_ID, 0, 'null-0'),
    makeSeraphim(NULL_SERAPHIM_ID, 1, 'null-1'),
    makeSeraphim(NULL_SERAPHIM_ID, 2, 'null-2'),
    makeSeraphim(EQUILIBRIUM_SERAPHIM_ID, 3, 'equil-0'),
    makeSeraphim(EQUILIBRIUM_SERAPHIM_ID, 4, 'equil-1'),
  ];
}

function seedNeutralMysteryAtStep3(stepsComplete: boolean[]): void {
  useStore.setState(s => ({
    ...s,
    progress: {
      ...s.progress,
      enigmas: {
        activeEnigmaId: 'neutral-mystery',
        instances: {
          'neutral-mystery': {
            id: 'neutral-mystery',
            status: 'acquired' as const,
            currentStepIndex: 3,
            stepsComplete,
            acquiredAt: Date.now(),
            completedAt: undefined,
          },
        },
      },
    },
  }));
}

describe('NeutralMystery final-step fix — claimEnigmaReward re-evaluates board', () => {
  beforeEach(() => {
    resetStore();
  });

  it('succeeds on a save where stepsComplete[3] was false but the board has the correct combo', () => {
    // Simulate a stuck save: steps 0–2 done, step 3 NOT flagged, but board has the right units.
    seedNeutralMysteryAtStep3([true, true, true, false, false]);
    useStore.setState(s => ({
      ...s,
      board: {
        ...s.board,
        frontSlots: validFinalStepBoard(),
      },
    }));

    const result = useStore.getState().claimEnigmaReward('neutral-mystery');
    expect(result).toBe(true);
    const instance = useStore.getState().progress.enigmas.instances['neutral-mystery'];
    expect(instance?.status).toBe('completed');
  });

  it('fails when the board does not have the required combo', () => {
    seedNeutralMysteryAtStep3([true, true, true, false, false]);
    // Board is empty; evaluator cannot mark step 3.
    useStore.setState(s => ({
      ...s,
      board: { ...s.board, frontSlots: [null, null, null, null, null] },
    }));

    const result = useStore.getState().claimEnigmaReward('neutral-mystery');
    expect(result).toBe(false);
  });

  it('succeeds normally when stepsComplete[3] was already true', () => {
    seedNeutralMysteryAtStep3([true, true, true, true, false]);
    // Board doesn't need to have anything; step is already flagged.
    const result = useStore.getState().claimEnigmaReward('neutral-mystery');
    expect(result).toBe(true);
    const instance = useStore.getState().progress.enigmas.instances['neutral-mystery'];
    expect(instance?.status).toBe('completed');
  });

  it('returns false when the enigma is already completed', () => {
    seedNeutralMysteryAtStep3([true, true, true, true, true]);
    useStore.setState(s => ({
      ...s,
      progress: {
        ...s.progress,
        enigmas: {
          ...s.progress.enigmas,
          instances: {
            'neutral-mystery': {
              ...s.progress.enigmas.instances['neutral-mystery']!,
              status: 'completed' as const,
            },
          },
        },
      },
    }));
    const result = useStore.getState().claimEnigmaReward('neutral-mystery');
    expect(result).toBe(false);
  });
});
