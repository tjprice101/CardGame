import { beforeEach, describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { defaultGameState, useStore } from '@/state/store';
import type { AngelInstance, CherubimInstance, SeraphimInstance } from '@/types/cards';
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

function makeCherubim(instanceId: string, definitionId: string, slot: 0 | 1 | 2 | 3): CherubimInstance {
  const def = CardRegistry.get(definitionId);
  if (!def || def.type !== 'Cherubim') {
    throw new Error(`Expected Cherubim definition for ${definitionId}`);
  }
  return {
    instanceId,
    definitionId,
    type: 'Cherubim',
    element: def.element,
    rarity: def.rarity,
    finish: 'normal',
    level: 1,
    backSlot: slot,
    durability: def.maxDurability,
    maxDurability: def.maxDurability,
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
      turn: makePlayingTurn({ radiance: 4 }),
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
  });

  it('does not allow Angel cards to satisfy discard-choice pending effects', () => {
    useStore.setState(state => ({
      ...state,
      deck: {
        ...state.deck,
        deckList: [],
        extraDeck: [],
        drawPile: [],
        hand: [
          { instanceId: 'ang_hand', definitionId: 'angel-neutral-beginning', finish: 'normal' },
          { instanceId: 'oph_hand', definitionId: 'seek-neutral-null-seek', finish: 'normal' },
        ],
        discardPile: [],
      },
      turn: {
        ...makePlayingTurn(),
        pendingEffect: {
          type: 'discard_choice',
          count: 1,
          sourceCard: 'unit-test',
        },
      },
    }));

    useStore.getState().resolvePending(['ang_hand']);

    let state = useStore.getState();
    expect(state.turn.pendingEffect?.type).toBe('discard_choice');
    expect(state.deck.hand.some(card => card.instanceId === 'ang_hand')).toBe(true);
    expect(state.deck.discardPile.length).toBe(0);

    useStore.getState().resolvePending(['oph_hand']);

    state = useStore.getState();
    expect(state.turn.pendingEffect).toBeNull();
    expect(state.deck.hand.some(card => card.instanceId === 'ang_hand')).toBe(true);
    expect(state.deck.discardPile.some(card => card.instanceId === 'oph_hand')).toBe(true);
  });

  it('does not allow Duality draw mode to discard an Angel card', () => {
    useStore.setState(state => ({
      ...state,
      deck: {
        ...state.deck,
        deckList: [],
        extraDeck: [],
        drawPile: [
          { instanceId: 'draw_a', definitionId: 'seek-neutral-null-seek', finish: 'normal' },
          { instanceId: 'draw_b', definitionId: 'seek-neutral-null-seek', finish: 'normal' },
        ],
        hand: [
          { instanceId: 'ang_hand', definitionId: 'angel-neutral-beginning', finish: 'normal' },
          { instanceId: 'oph_hand', definitionId: 'seek-neutral-null-seek', finish: 'normal' },
        ],
        discardPile: [],
      },
      turn: {
        ...makePlayingTurn(),
        pendingEffect: {
          type: 'light_transcendent_duality_choice',
          baseOblivion: 1000,
          resonanceScale: 10,
          haloScale: 10,
          distinctNoteScale: 10,
          thresholdDivisor: 2,
          thresholdScale: 10,
        },
      },
    }));

    useStore.getState().resolvePending(['draw', 'ang_hand']);

    let state = useStore.getState();
    expect(state.turn.pendingEffect?.type).toBe('light_transcendent_duality_choice');
    expect(state.deck.hand.some(card => card.instanceId === 'ang_hand')).toBe(true);
    expect(state.deck.discardPile.length).toBe(0);

    useStore.getState().resolvePending(['draw', 'oph_hand']);

    state = useStore.getState();
    expect(state.turn.pendingEffect).toBeNull();
    expect(state.deck.hand.some(card => card.instanceId === 'ang_hand')).toBe(true);
    expect(state.deck.discardPile.some(card => card.instanceId === 'oph_hand')).toBe(true);
  });

  it('replaces hand Angels with non-Angel cards when a turn begins', () => {
    useStore.setState(state => ({
      ...state,
      deck: {
        ...state.deck,
        deckList: [],
        extraDeck: [],
        hand: [],
        drawPile: [
          { instanceId: 'a1', definitionId: 'angel-neutral-beginning', finish: 'normal' },
          { instanceId: 'n1', definitionId: 'seek-neutral-null-seek', finish: 'normal' },
          { instanceId: 'n2', definitionId: 'seek-neutral-null-seek', finish: 'normal' },
          { instanceId: 'n3', definitionId: 'seek-neutral-null-seek', finish: 'normal' },
          { instanceId: 'n4', definitionId: 'seek-neutral-null-seek', finish: 'normal' },
          { instanceId: 'n5', definitionId: 'seek-neutral-null-seek', finish: 'normal' },
        ],
        discardPile: [],
      },
      turn: {
        ...state.turn,
        phase: 'idle',
      },
    }));

    useStore.getState().beginTurn();

    const state = useStore.getState();
    expect(state.turn.phase).toBe('mulligan');
    expect(state.deck.hand).toHaveLength(5);
    expect(state.deck.hand.some(card => CardRegistry.get(card.definitionId)?.type === 'Angel')).toBe(false);
    expect(state.deck.extraDeck.some(entry => entry.definitionId === 'angel-neutral-beginning')).toBe(true);
  });

  it('replaces hand Angels with non-Angel cards when confirming mulligan', () => {
    useStore.setState(state => ({
      ...state,
      deck: {
        ...state.deck,
        deckList: [],
        extraDeck: [],
        hand: [
          { instanceId: 'a1', definitionId: 'angel-neutral-beginning', finish: 'normal' },
          { instanceId: 'n1', definitionId: 'seek-neutral-null-seek', finish: 'normal' },
          { instanceId: 'n2', definitionId: 'seek-neutral-null-seek', finish: 'normal' },
          { instanceId: 'n3', definitionId: 'seek-neutral-null-seek', finish: 'normal' },
          { instanceId: 'n4', definitionId: 'seek-neutral-null-seek', finish: 'normal' },
        ],
        drawPile: [
          { instanceId: 'n5', definitionId: 'seek-neutral-null-seek', finish: 'normal' },
        ],
        discardPile: [],
      },
      turn: {
        ...state.turn,
        phase: 'mulligan',
        mulliganSelected: [],
      },
    }));

    useStore.getState().confirmMulligan();

    const state = useStore.getState();
    expect(state.turn.phase).toBe('playing');
    expect(state.deck.hand).toHaveLength(5);
    expect(state.deck.hand.some(card => CardRegistry.get(card.definitionId)?.type === 'Angel')).toBe(false);
    expect(state.deck.extraDeck.some(entry => entry.definitionId === 'angel-neutral-beginning')).toBe(true);
  });

  it('does not loop when turn start can only draw Angels', () => {
    useStore.setState(state => ({
      ...state,
      deck: {
        ...state.deck,
        deckList: [],
        extraDeck: [],
        hand: [],
        drawPile: [
          { instanceId: 'a1', definitionId: 'angel-neutral-beginning', finish: 'normal' },
          { instanceId: 'a2', definitionId: 'angel-neutral-beginning', finish: 'normal' },
          { instanceId: 'a3', definitionId: 'angel-neutral-beginning', finish: 'normal' },
          { instanceId: 'a4', definitionId: 'angel-neutral-beginning', finish: 'normal' },
          { instanceId: 'a5', definitionId: 'angel-neutral-beginning', finish: 'normal' },
        ],
        discardPile: [],
      },
      turn: {
        ...state.turn,
        phase: 'idle',
      },
    }));

    useStore.getState().beginTurn();

    const state = useStore.getState();
    expect(state.turn.phase).toBe('mulligan');
    expect(state.deck.hand.some(card => CardRegistry.get(card.definitionId)?.type === 'Angel')).toBe(false);
    expect(state.deck.extraDeck.length).toBeGreaterThan(0);
  });

  it('moves Angels out of draw and discard piles at turn start', () => {
    useStore.setState(state => ({
      ...state,
      deck: {
        ...state.deck,
        deckList: [],
        extraDeck: [],
        hand: [],
        drawPile: [
          { instanceId: 'a1', definitionId: 'angel-neutral-beginning', finish: 'normal' },
          { instanceId: 'n1', definitionId: 'seek-neutral-null-seek', finish: 'normal' },
          { instanceId: 'n2', definitionId: 'seek-neutral-null-seek', finish: 'normal' },
          { instanceId: 'n3', definitionId: 'seek-neutral-null-seek', finish: 'normal' },
          { instanceId: 'n4', definitionId: 'seek-neutral-null-seek', finish: 'normal' },
        ],
        discardPile: [
          { instanceId: 'a2', definitionId: 'angel-neutral-beginning', finish: 'normal' },
        ],
      },
      turn: {
        ...state.turn,
        phase: 'idle',
      },
    }));

    useStore.getState().beginTurn();

    const state = useStore.getState();
    expect(state.deck.drawPile.some(card => CardRegistry.get(card.definitionId)?.type === 'Angel')).toBe(false);
    expect(state.deck.discardPile.some(card => CardRegistry.get(card.definitionId)?.type === 'Angel')).toBe(false);
    expect(state.deck.extraDeck.filter(entry => entry.definitionId === 'angel-neutral-beginning')).toHaveLength(2);
  });

  it('enforces board-specific and sigil summon conditions for transcendents', () => {
    useStore.setState(state => ({
      ...state,
      board: {
        ...state.board,
        frontSlots: [
          makeSeraphim('inf_null', 'inf-null-apex', 0),
          makeSeraphim('tx_null', 'tx-sera-null-entropy', 1),
          null,
          null,
          null,
        ],
        backSlots: [
          null,
          null,
          null,
          null,
        ],
      },
      deck: {
        ...state.deck,
        deckList: [],
        extraDeck: [{ definitionId: 'tx-angel-starbound-null-archangel', finish: 'normal' }],
        drawPile: [],
        hand: [],
        discardPile: [],
      },
      turn: makePlayingTurn({ neutralityEquilibriumSigils: 10 }),
      progress: {
        ...state.progress,
        oblivion: 0,
      },
    }));
    useStore.getState().refreshComputedStats();

    useStore.getState().summonAngel('tx-angel-starbound-null-archangel');
    let state = useStore.getState();
    expect(state.board.frontSlots.some(slot => slot?.definitionId === 'tx-angel-starbound-null-archangel')).toBe(false);

    useStore.setState(state => ({
      ...state,
      board: {
        ...state.board,
        backSlots: [
          makeCherubim('tx_cher', 'tx-cher-null-sentinel', 0),
          null,
          null,
          null,
        ],
      },
    }));
    useStore.getState().refreshComputedStats();

    useStore.getState().summonAngel('tx-angel-starbound-null-archangel');
    state = useStore.getState();
    expect(state.board.frontSlots.some(slot => slot?.definitionId === 'tx-angel-starbound-null-archangel')).toBe(true);
  });
});