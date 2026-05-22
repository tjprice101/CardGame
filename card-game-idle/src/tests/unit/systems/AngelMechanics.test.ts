import { beforeEach, describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { defaultGameState, useStore } from '@/state/store';
import type { AngelInstance, SeraphimInstance } from '@/types/cards';
import type { DeckCard, TurnState } from '@/types/game';

function resetStore(): void {
  const baseState = JSON.parse(JSON.stringify(defaultGameState)) as typeof defaultGameState;
  useStore.setState(state => ({ ...state, ...baseState }));
  useStore.getState().refreshComputedStats();
}

function makePlayingTurn(overrides: Partial<TurnState> = {}): TurnState {
  return { ...defaultGameState.turn, phase: 'playing', ...overrides };
}

function makeSeraphim(instanceId: string, definitionId: string, slot: 0 | 1 | 2 | 3 | 4): SeraphimInstance {
  const def = CardRegistry.get(definitionId);
  if (!def || def.type !== 'Seraphim') {
    throw new Error(`Expected Seraphim definition for ${definitionId}`);
  }
  return {
    instanceId,
    definitionId,
    type: 'Seraphim',
    element: def.element,
    rarity: def.rarity,
    finish: 'normal',
    level: 1,
    isActive: false,
    boardSlot: slot,
  };
}

function makeAngel(
  instanceId: string,
  definitionId: string,
  slot: 0 | 1 | 2 | 3 | 4,
  overrides: Partial<Pick<AngelInstance, 'cardsPlayedSinceSummon' | 'activated'>> = {},
): AngelInstance {
  const def = CardRegistry.get(definitionId);
  if (!def || def.type !== 'Angel') {
    throw new Error(`Expected Angel definition for ${definitionId}`);
  }
  return {
    instanceId,
    definitionId,
    type: 'Angel',
    element: def.element,
    rarity: def.rarity,
    finish: 'normal',
    level: 1,
    cardsPlayedSinceSummon: overrides.cardsPlayedSinceSummon ?? 0,
    activated: overrides.activated ?? false,
    boardSlot: slot,
  };
}

describe('Angel mechanics', () => {
  beforeEach(() => {
    resetStore();
  });

  it('allows duplicate angel copies to be summoned when the extra deck contains multiple copies', () => {
    useStore.setState(state => ({
      ...state,
      board: {
        ...state.board,
        frontSlots: [
          makeSeraphim('null_1', 'ser-neutral-null', 0),
          makeSeraphim('null_2', 'ser-neutral-null', 1),
          makeSeraphim('null_3', 'ser-neutral-null', 2),
          makeSeraphim('null_4', 'ser-neutral-null', 3),
          null,
        ],
      },
      deck: {
        ...state.deck,
        deckList: [],
        extraDeck: [
          { definitionId: 'angel-neutral-beginning', finish: 'normal' },
          { definitionId: 'angel-neutral-beginning', finish: 'normal' },
        ],
        drawPile: [],
        hand: [],
        discardPile: [],
      },
      turn: makePlayingTurn(),
      progress: {
        ...state.progress,
        oblivion: 0,
      },
    }));
    useStore.getState().refreshComputedStats();

    useStore.getState().summonAngel('angel-neutral-beginning');
    useStore.getState().summonAngel('angel-neutral-beginning');

    const state = useStore.getState();
    const angels = state.board.frontSlots.filter(
      (slot): slot is AngelInstance => slot?.type === 'Angel' && slot.definitionId === 'angel-neutral-beginning'
    );
    const recycledNulls = [...state.deck.hand, ...state.deck.drawPile, ...state.deck.discardPile]
      .filter(card => card.definitionId === 'ser-neutral-null');

    expect(angels).toHaveLength(2);
    expect(recycledNulls).toHaveLength(4);
  });

  it('uses angels as summon materials without sending them to the discard pile', () => {
    useStore.setState(state => ({
      ...state,
      board: {
        ...state.board,
        frontSlots: [
          makeAngel('ang_seed', 'angel-neutral-beginning', 0),
          makeSeraphim('eq_1', 'ser-neutral-equilibrium', 1),
          null,
          null,
          null,
        ],
      },
      deck: {
        ...state.deck,
        deckList: [],
        extraDeck: [{ definitionId: 'angel-neutral-presence', finish: 'normal' }],
        drawPile: [],
        hand: [],
        discardPile: [],
      },
      turn: makePlayingTurn(),
      progress: {
        ...state.progress,
        oblivion: 0,
      },
    }));
    useStore.getState().refreshComputedStats();

    useStore.getState().summonAngel('angel-neutral-presence');

    const state = useStore.getState();
    const mainDeckZoneIds = [...state.deck.hand, ...state.deck.drawPile, ...state.deck.discardPile]
      .map(card => card.definitionId);

    expect(state.board.frontSlots.some(slot => slot?.type === 'Angel' && slot.definitionId === 'angel-neutral-presence')).toBe(true);
    expect(state.board.frontSlots.some(slot => slot?.instanceId === 'ang_seed')).toBe(false);
    expect(mainDeckZoneIds.filter(id => id === 'ser-neutral-equilibrium')).toHaveLength(1);
    expect(mainDeckZoneIds.includes('angel-neutral-beginning')).toBe(false);
  });

  it('charges awakened angel abilities from cards played and activates them once ready', () => {
    const drawPile: DeckCard[] = [
      { instanceId: 'draw_1', definitionId: 'seek-neutral-null-seek' },
      { instanceId: 'draw_2', definitionId: 'seek-neutral-null-seek' },
    ];

    useStore.setState(state => ({
      ...state,
      board: {
        ...state.board,
        frontSlots: [
          makeAngel('ang_light', 'angel-light-seraphiel', 0, { cardsPlayedSinceSummon: 2 }),
          null,
          null,
          null,
          null,
        ],
      },
      deck: {
        ...state.deck,
        deckList: [],
        extraDeck: [{ definitionId: 'angel-light-seraphiel', finish: 'normal' }],
        drawPile,
        hand: [{ instanceId: 'play_1', definitionId: 'ophanim-fire-pyre-ignite', finish: 'normal' }],
        discardPile: [],
      },
      turn: makePlayingTurn({ radiance: 4, chainBaseline: 1.0 }),
      progress: {
        ...state.progress,
        oblivion: 0,
      },
    }));
    useStore.getState().refreshComputedStats();

    useStore.getState().playCard('play_1');

    let state = useStore.getState();
    const readyAngel = state.board.frontSlots[0];
    expect(readyAngel?.type).toBe('Angel');
    expect((readyAngel as AngelInstance).cardsPlayedSinceSummon).toBe(3);

    useStore.getState().activateAngel(0);

    state = useStore.getState();
    const activatedAngel = state.board.frontSlots[0] as AngelInstance;
    expect(activatedAngel.activated).toBe(true);
    expect(state.turn.radiance).toBe(8);
    expect(state.turn.chainBaseline).toBeGreaterThanOrEqual(1.8);
    expect(state.deck.hand.map(card => card.instanceId)).toEqual(['draw_1', 'draw_2']);
  });
});