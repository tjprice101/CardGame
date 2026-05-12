import { beforeEach, describe, expect, it } from 'vitest';
import { CardEffectExecutor } from '@/systems/cards/CardEffectExecutor';
import { defaultGameState, useStore } from '@/state/store';
import type { BoardState, DeckCard, DeckState, TurnState } from '@/types/game';

const emptyBoard: BoardState = {
  frontSlots: [null, null, null, null, null],
  backSlots: [null, null, null, null],
  activeBoardEffects: [],
};

function makePlayingTurn(): TurnState {
  return { ...defaultGameState.turn, phase: 'playing' };
}

function makeDeck(definitionId: string): DeckState {
  return {
    deckList: [],
    extraDeck: [],
    drawPile: [],
    hand: [{ instanceId: 'play_1', definitionId }],
    discardPile: [],
  };
}

function resetStore(): void {
  const baseState = JSON.parse(JSON.stringify(defaultGameState)) as typeof defaultGameState;
  useStore.setState(state => ({ ...state, ...baseState }));
  useStore.getState().refreshComputedStats();
}

describe('CardEffectExecutor empty deck handling', () => {
  it('skips look-top take-and-drop when the deck is empty', () => {
    const result = CardEffectExecutor.execute(
      { instanceId: 'play_1', definitionId: 'seek-neutral-measured-seek' },
      makePlayingTurn(),
      emptyBoard,
      makeDeck('seek-neutral-measured-seek')
    );

    expect(result.canPlay).toBe(true);
    expect(result.pendingEffect).toBeNull();
  });

  it('skips deck search when there are no matching cards left', () => {
    const result = CardEffectExecutor.execute(
      { instanceId: 'play_1', definitionId: 'seek-neutral-deep-seek' },
      makePlayingTurn(),
      emptyBoard,
      makeDeck('seek-neutral-deep-seek')
    );

    expect(result.canPlay).toBe(true);
    expect(result.pendingEffect).toBeNull();
  });
});

describe('Embrace the Infinite', () => {
  beforeEach(() => {
    resetStore();
  });

  it('awards oblivion, keeps three cards, and reshuffles the rest', () => {
    const hand: DeckCard[] = Array.from({ length: 25 }, (_, index) => ({
      instanceId: `infinite_${index}`,
      definitionId: 'seek-neutral-void-surge',
    }));

    useStore.setState(state => ({
      ...state,
      deck: {
        ...state.deck,
        deckList: [],
        extraDeck: [],
        drawPile: [],
        hand,
        discardPile: [],
      },
      turn: {
        ...state.turn,
        phase: 'playing',
        pendingEffect: null,
      },
      progress: {
        ...state.progress,
        oblivion: 0,
      },
    }));

    useStore.getState().embraceInfinite();

    let state = useStore.getState();
    expect(state.progress.oblivion).toBe(25 * 50);
    expect(state.turn.pendingEffect?.type).toBe('embrace_infinite');

    const keepIds = hand.slice(0, 3).map(card => card.instanceId);
    useStore.getState().resolvePending(keepIds);

    state = useStore.getState();
    expect(state.turn.pendingEffect).toBeNull();
    expect(state.deck.hand.map(card => card.instanceId)).toEqual(keepIds);
    expect(state.deck.drawPile).toHaveLength(22);
    expect(new Set(state.deck.drawPile.map(card => card.instanceId))).toEqual(
      new Set(hand.slice(3).map(card => card.instanceId))
    );
  });
});