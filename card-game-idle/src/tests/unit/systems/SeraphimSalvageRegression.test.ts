import { beforeEach, describe, expect, it } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';

function resetStore(): void {
  const baseState = JSON.parse(JSON.stringify(defaultGameState)) as typeof defaultGameState;
  useStore.setState(state => ({ ...state, ...baseState }));
  useStore.getState().refreshComputedStats();
}

describe('Seraphim salvage regression', () => {
  beforeEach(() => {
    resetStore();
  });

  it('preserves pending salvage when Abyssal Seraphim is played from hand into an empty front slot', () => {
    useStore.setState(state => ({
      ...state,
      deck: {
        ...state.deck,
        hand: [{ instanceId: 'play_1', definitionId: 'ser-fire-abyssal', finish: 'normal' }],
        drawPile: [],
        discardPile: [
          { instanceId: 'discard_1', definitionId: 'ophanim-fire-cinder-draw', finish: 'normal' },
        ],
      },
      board: {
        ...state.board,
        frontSlots: [null, null, null, null, null],
        backSlots: [null, null, null, null],
      },
      turn: {
        ...state.turn,
        phase: 'playing',
        pendingEffect: null,
      },
    }));

    useStore.getState().playCard('play_1');

    const pending = useStore.getState().turn.pendingEffect;
    expect(pending?.type).toBe('salvage');

    if (pending?.type === 'salvage') {
      expect(pending.filter).toEqual(['Ophanim']);
      expect(pending.cards).toHaveLength(1);
    }
  });
});
