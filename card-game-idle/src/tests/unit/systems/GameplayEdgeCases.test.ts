import { beforeEach, describe, expect, it } from 'vitest';
import { CardEffectExecutor } from '@/systems/cards/CardEffectExecutor';
import { defaultGameState, selectCanEmbraceInfinite, useStore } from '@/state/store';
import type { SeraphimInstance } from '@/types/cards';
import type { BoardState, DeckCard, DeckEntry, DeckState, TurnState } from '@/types/game';

const emptyBoard: BoardState = {
  frontSlots: [null, null, null, null, null],
  backSlots: [null, null, null, null],
  activeBoardEffects: [],
};

function makePlayingTurn(overrides: Partial<TurnState> = {}): TurnState {
  return { ...defaultGameState.turn, phase: 'playing', ...overrides };
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

  it('does not become available below 40 cards in hand', () => {
    const hand: DeckCard[] = Array.from({ length: 39 }, (_, index) => ({
      instanceId: `infinite_gate_low_${index}`,
      definitionId: 'seek-neutral-void-surge',
    }));

    useStore.setState(state => ({
      ...state,
      deck: {
        ...state.deck,
        drawPile: [{ instanceId: 'draw_1', definitionId: 'seek-neutral-void-surge' }],
        hand,
        discardPile: [{ instanceId: 'discard_1', definitionId: 'seek-neutral-void-surge' }],
      },
      turn: {
        ...state.turn,
        phase: 'playing',
        pendingEffect: null,
      },
    }));

    expect(selectCanEmbraceInfinite(useStore.getState())).toBe(false);
  });

  it('is available at 40 cards even when the draw pile still has cards', () => {
    const hand: DeckCard[] = Array.from({ length: 40 }, (_, index) => ({
      instanceId: `infinite_gate_${index}`,
      definitionId: 'seek-neutral-void-surge',
    }));

    useStore.setState(state => ({
      ...state,
      deck: {
        ...state.deck,
        drawPile: [
          { instanceId: 'draw_1', definitionId: 'seek-neutral-void-surge' },
          { instanceId: 'draw_2', definitionId: 'seek-neutral-void-surge' },
          { instanceId: 'draw_3', definitionId: 'seek-neutral-void-surge' },
        ],
        hand,
        discardPile: [{ instanceId: 'discard_1', definitionId: 'seek-neutral-void-surge' }],
      },
      turn: {
        ...state.turn,
        phase: 'playing',
        pendingEffect: null,
      },
    }));

    expect(selectCanEmbraceInfinite(useStore.getState())).toBe(true);
  });

  it('awards oblivion, lets you keep one draw-capable card, and reshuffles the rest', () => {
    const hand: DeckCard[] = Array.from({ length: 40 }, (_, index) => ({
      instanceId: `infinite_${index}`,
      definitionId: index < 2 ? 'seek-neutral-still-pulse' : 'seek-neutral-void-surge',
      finish: 'normal',
    }));
    const existingDrawPile: DeckCard[] = [
      { instanceId: 'draw_a', definitionId: 'seek-neutral-void-surge', finish: 'normal' },
      { instanceId: 'draw_b', definitionId: 'seek-neutral-void-surge', finish: 'normal' },
      { instanceId: 'draw_c', definitionId: 'seek-neutral-void-surge', finish: 'normal' },
    ];

    useStore.setState(state => ({
      ...state,
      deck: {
        ...state.deck,
        deckList: [],
        extraDeck: [],
        drawPile: existingDrawPile,
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
    expect(state.progress.oblivion).toBe(40 * 50);
    expect(state.turn.pendingEffect?.type).toBe('embrace_infinite');
    expect(state.turn.pendingEffect?.keep).toBe(1);
    expect(state.turn.pendingEffect?.cards).toHaveLength(2);

    const keepIds = [hand[0].instanceId];
    useStore.getState().resolvePending(keepIds);

    state = useStore.getState();
    expect(state.turn.pendingEffect).toBeNull();
    expect(state.deck.hand.map(card => card.instanceId)).toEqual(keepIds);
    expect(state.deck.drawPile).toHaveLength(42);
    expect(new Set(state.deck.drawPile.map(card => card.instanceId))).toEqual(
      new Set([...existingDrawPile.map(card => card.instanceId), ...hand.slice(1).map(card => card.instanceId)])
    );
  });

  it('auto-resolves and immediately ends the turn when only one draw-capable card exists', () => {
    const hand: DeckCard[] = Array.from({ length: 40 }, (_, index) => ({
      instanceId: `single_draw_${index}`,
      definitionId: index === 0 ? 'seek-neutral-still-pulse' : 'seek-neutral-void-surge',
      finish: 'normal',
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

    const state = useStore.getState();
    expect(state.progress.oblivion).toBe(40 * 50);
    expect(state.turn.phase).toBe('idle');
    expect(state.turn.pendingEffect).toBeNull();
    expect(state.deck.hand).toEqual([]);
  });
});

describe('Custom deck activation', () => {
  beforeEach(() => {
    resetStore();
  });

  it('makes a newly saved custom deck the live playable deck immediately', () => {
      const customDeckList: DeckEntry[] = [
        { definitionId: 'ser-neutral-first-light', copies: 4, finish: 'normal' as const },
        { definitionId: 'seek-neutral-null-seek', copies: 4, finish: 'normal' as const },
      ];
      const customExtraDeck = [{ definitionId: 'angel-neutral-beginning', finish: 'normal' as const }];

    const deckId = useStore.getState().saveCurrentDeck('Fresh Custom Deck', customDeckList, customExtraDeck);

    const state = useStore.getState();
    expect(state.progress.activeDeckId).toBe(deckId);
    expect(state.deck.deckList).toEqual(customDeckList);
    expect(state.deck.extraDeck).toEqual(customExtraDeck);
    expect(state.deck.hand).toEqual([]);
    expect(state.deck.discardPile).toEqual([]);
    expect(state.deck.drawPile).toHaveLength(8);
  });
});

describe('Heavenly Light balance', () => {
  it('does not let Thorncrown amplify Radiance doubling and uses the reduced Revelation payout', () => {
    const throne: SeraphimInstance = {
      instanceId: 'ser_throne_1',
      definitionId: 'ser-light-throne',
      type: 'Seraphim',
      element: 'Light',
      rarity: 'Rare',
      level: 1,
      isActive: true,
      boardSlot: 0,
    };

    const result = CardEffectExecutor.execute(
      { instanceId: 'play_1', definitionId: 'hr-light-grand-illumination' },
      makePlayingTurn({ radiance: 4 }),
      {
        frontSlots: [throne, null, null, null, null],
        backSlots: [null, null, null, null],
        activeBoardEffects: [],
      },
      makeDeck('hr-light-grand-illumination'),
    );

    expect(result.turn.radiance).toBe(8);
    expect(result.oblivionBonus).toBe(64);
  });

  it('uses the reduced Light Radiance-to-Oblivion conversion and multiplier values', () => {
    const sunforgedResult = CardEffectExecutor.execute(
      { instanceId: 'play_1', definitionId: 'hr-light-sunforged' },
      makePlayingTurn({ radiance: 6 }),
      emptyBoard,
      makeDeck('hr-light-sunforged'),
    );

    expect(sunforgedResult.turn.radiance).toBe(0);
    expect(sunforgedResult.oblivionBonus).toBe(150);

    const spireResult = CardEffectExecutor.execute(
      { instanceId: 'play_2', definitionId: 'hr-light-pillar-of-heaven' },
      makePlayingTurn({ radiance: 6 }),
      emptyBoard,
      makeDeck('hr-light-pillar-of-heaven'),
    );

    expect(spireResult.turn.radiance).toBe(0);
    expect(spireResult.board.activeBoardEffects).toContainEqual({ type: 'score_multiplier', value: 250 });
  });
});