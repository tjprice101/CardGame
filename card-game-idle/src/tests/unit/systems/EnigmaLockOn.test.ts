import { describe, expect, it } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
import type { GameState } from '@/types/game';

function resetStore(): void {
  const baseState = structuredClone(defaultGameState) as GameState;
  useStore.setState(state => ({ ...state, ...baseState }));
}

describe('Enigma lock-on eligibility', () => {
  it('does not lock onto an Enigma before its opening condition is acquired', () => {
    resetStore();
    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        totalPacksOpened: 10,
        packOpenHistory: Array.from({ length: 10 }, () => ({ ts: 1, packId: 'test', tier: 'pack' as const, rarityCounts: {} })),
      },
    }));

    useStore.getState().setActiveEnigma('causality-first-horizon');
    expect(useStore.getState().progress.enigmas.activeEnigmaId).toBeNull();
  });

  it('locks onto an Enigma only after its opening condition is acquired', () => {
    resetStore();
    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        totalPacksOpened: 10,
        packOpenHistory: Array.from({ length: 10 }, () => ({ ts: 1, packId: 'test', tier: 'pack' as const, rarityCounts: {} })),
        enigmas: {
          activeEnigmaId: null,
          instances: {
            'causality-first-horizon': {
              id: 'causality-first-horizon',
              status: 'acquired',
              currentStepIndex: 1,
              stepsComplete: [true, false, false, false, false],
            },
          },
        },
      },
    }));

    useStore.getState().setActiveEnigma('causality-first-horizon');
    expect(useStore.getState().progress.enigmas.activeEnigmaId).toBe('causality-first-horizon');
  });
});