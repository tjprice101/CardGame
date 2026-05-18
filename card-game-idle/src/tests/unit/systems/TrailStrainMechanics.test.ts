import { beforeEach, describe, expect, it } from 'vitest';
import { CardEffectExecutor } from '@/systems/cards/CardEffectExecutor';
import { defaultGameState, useStore } from '@/state/store';
import type { BoardState, DeckCard, DeckState, TurnState } from '@/types/game';

const emptyBoard: BoardState = {
  frontSlots: [null, null, null, null, null],
  backSlots: [null, null, null, null],
  activeBoardEffects: [],
};

function makeTurn(overrides: Partial<TurnState> = {}): TurnState {
  return {
    ...defaultGameState.turn,
    phase: 'playing',
    ...overrides,
  };
}

function makeDeck(drawPile: DeckCard[] = []): DeckState {
  return {
    deckList: [],
    extraDeck: [],
    drawPile,
    hand: [{ instanceId: 'play_1', definitionId: 'md-ophanim-gearwake-courier', finish: 'normal' }],
    discardPile: [],
  };
}

function resetStore(): void {
  const baseState = JSON.parse(JSON.stringify(defaultGameState)) as typeof defaultGameState;
  useStore.setState(state => ({ ...state, ...baseState }));
  useStore.getState().refreshComputedStats();
}

describe('Trail / Strain / Overclock mechanics', () => {
  beforeEach(() => {
    resetStore();
  });

  it('overclock effects apply bonus payload and add strain', () => {
    const result = CardEffectExecutor.execute(
      { instanceId: 'play_1', definitionId: 'md-ophanim-gearwake-courier', finish: 'normal' },
      makeTurn({ strain: 0 }),
      emptyBoard,
      makeDeck([
        { instanceId: 'draw_1', definitionId: 'seek-neutral-null-seek', finish: 'normal' },
        { instanceId: 'draw_2', definitionId: 'seek-neutral-null-seek', finish: 'normal' },
      ]),
    );

    expect(result.canPlay).toBe(true);
    expect(result.turn.strain).toBe(1);
    expect(result.deck.hand).toHaveLength(2);
  });

  it('trail_spend blocks card resolution when trail is insufficient', () => {
    const result = CardEffectExecutor.execute(
      { instanceId: 'play_1', definitionId: 'tbp-ophanim-harrow-psalm', finish: 'normal' },
      makeTurn({ trail: 1 }),
      emptyBoard,
      {
        deckList: [],
        extraDeck: [],
        drawPile: [],
        hand: [{ instanceId: 'play_1', definitionId: 'tbp-ophanim-harrow-psalm', finish: 'normal' }],
        discardPile: [],
      },
    );

    expect(result.canPlay).toBe(false);
    expect(result.turn.trail).toBe(1);
    expect(result.oblivionBonus).toBe(0);
  });

  it('strain-based conditional effects trigger after strain gain in the same card', () => {
    const result = CardEffectExecutor.execute(
      { instanceId: 'play_1', definitionId: 'md-ophanim-flareline-primer', finish: 'normal' },
      makeTurn({ strain: 2 }),
      emptyBoard,
      {
        deckList: [],
        extraDeck: [],
        drawPile: [],
        hand: [{ instanceId: 'play_1', definitionId: 'md-ophanim-flareline-primer', finish: 'normal' }],
        discardPile: [],
      },
    );

    expect(result.canPlay).toBe(true);
    expect(result.turn.strain).toBe(3);
    expect(result.oblivionBonus).toBe(120);
  });

  it('loadState migration defaults turn trail/strain to zero when missing', () => {
    const loaded = JSON.parse(JSON.stringify(defaultGameState)) as typeof defaultGameState & { turn: Record<string, unknown> };
    loaded.turn.phase = 'playing';
    delete loaded.turn.trail;
    delete loaded.turn.strain;

    useStore.getState().loadState(loaded as unknown as typeof defaultGameState);

    const next = useStore.getState();
    expect(next.turn.trail).toBe(0);
    expect(next.turn.strain).toBe(0);
  });
});
