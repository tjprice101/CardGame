import { beforeEach, describe, expect, it } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
import type { EnigmaInstance } from '@/types/game';
import type { SavedGameState } from '@/types/bossFight';

function resetStore(): void {
  const base = JSON.parse(JSON.stringify(defaultGameState)) as typeof defaultGameState;
  useStore.setState(s => ({ ...s, ...base }));
  useStore.getState().refreshComputedStats();
}

function neutralMysteryInstance(stepsComplete: boolean[]): EnigmaInstance {
  return {
    id: 'neutral-mystery',
    status: 'acquired',
    currentStepIndex: 3,
    stepsComplete,
    acquiredAt: Date.now(),
    completedAt: undefined,
  };
}

function ntvInstance(stepsComplete: boolean[], currentStepIndex: number): EnigmaInstance {
  return {
    id: 'neutralizing-the-void',
    status: 'acquired',
    currentStepIndex,
    stepsComplete,
    acquiredAt: Date.now(),
    completedAt: undefined,
  };
}

/**
 * Starts an active boss fight against the Eternal Vigil, one hit from death, whose
 * `savedGameState.progress` (the pre-fight snapshot) differs from the live `progress`
 * (which reflects mid-fight enigma flips) — reproducing the real gameplay sequence.
 */
function startFightWithPreFightSnapshot(preFightProgress: typeof defaultGameState.progress, fightCount = 1): void {
  const s = useStore.getState();
  const savedGameState: SavedGameState = {
    deck: JSON.parse(JSON.stringify(s.deck)),
    board: JSON.parse(JSON.stringify(s.board)),
    turn: JSON.parse(JSON.stringify(s.turn)),
    progress: JSON.parse(JSON.stringify(preFightProgress)),
    settings: JSON.parse(JSON.stringify(s.settings)),
  };
  useStore.setState(state => ({
    ...state,
    deck: {
      ...state.deck,
      hand: [{ instanceId: 'p1', definitionId: 'ser-neutral-null', finish: 'normal' as const }],
      drawPile: [],
    },
    board: { frontSlots: [null, null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] },
    turn: { ...state.turn, phase: 'playing', pendingEffect: null },
    bossFight: {
      mode: 'active',
      activeBossId: 'boss-immortal-warden',
      bossCurrentHp: 1,
      bossMaxHp: 100_000,
      damageDealtThisFight: 0,
      fightTimeRemaining: 200,
      cooldowns: {},
      savedGameState,
      fightCount,
    },
  }));
  useStore.getState().refreshComputedStats();
}

describe('Enigma progress persists through boss-fight snapshot restore', () => {
  beforeEach(() => {
    resetStore();
  });

  it('keeps a Neutral Mystery step-4 flip made mid-fight after the boss-fight restore', () => {
    // Pre-fight snapshot: steps 0-2 done, step 3 not yet flipped.
    const preFightProgress = {
      ...useStore.getState().progress,
      enigmas: {
        activeEnigmaId: 'neutral-mystery',
        instances: { 'neutral-mystery': neutralMysteryInstance([true, true, true, false, false]) },
      },
    };
    // Live progress reflects the mid-fight flip already applied by syncEnigmaProgressFromBoard.
    useStore.setState(s => ({
      ...s,
      progress: {
        ...s.progress,
        enigmas: {
          activeEnigmaId: 'neutral-mystery',
          instances: { 'neutral-mystery': neutralMysteryInstance([true, true, true, true, false]) },
        },
      },
    }));

    startFightWithPreFightSnapshot(preFightProgress);
    useStore.getState().playCard('p1');

    const instance = useStore.getState().progress.enigmas.instances['neutral-mystery'];
    expect(instance?.stepsComplete[3]).toBe(true);
  });

  it('does not double-toast a step already flipped in the pre-fight snapshot', () => {
    const preFightProgress = {
      ...useStore.getState().progress,
      enigmas: {
        activeEnigmaId: 'neutralizing-the-void',
        instances: { 'neutralizing-the-void': ntvInstance([true, false, false, false, false], 1) },
      },
    };
    useStore.setState(s => ({
      ...s,
      progress: {
        ...s.progress,
        enigmas: {
          activeEnigmaId: 'neutralizing-the-void',
          instances: { 'neutralizing-the-void': ntvInstance([true, false, false, false, false], 1) },
        },
      },
    }));

    startFightWithPreFightSnapshot(preFightProgress, 3);
    useStore.getState().playCard('p1');

    // NTV's own boss-victory hook (not the merge helper) is responsible for step 1 here.
    const instance = useStore.getState().progress.enigmas.instances['neutralizing-the-void'];
    expect(instance?.stepsComplete[1]).toBe(true);
  });

  it('does not regress an already-restored step when nothing flipped mid-fight', () => {
    const stableInstance = neutralMysteryInstance([true, true, true, true, false]);
    const preFightProgress = {
      ...useStore.getState().progress,
      enigmas: {
        activeEnigmaId: 'neutral-mystery',
        instances: { 'neutral-mystery': stableInstance },
      },
    };
    useStore.setState(s => ({
      ...s,
      progress: {
        ...s.progress,
        enigmas: {
          activeEnigmaId: 'neutral-mystery',
          instances: { 'neutral-mystery': stableInstance },
        },
      },
    }));

    startFightWithPreFightSnapshot(preFightProgress);
    useStore.getState().playCard('p1');

    const instance = useStore.getState().progress.enigmas.instances['neutral-mystery'];
    expect(instance?.stepsComplete).toEqual([true, true, true, true, false]);
  });
});
