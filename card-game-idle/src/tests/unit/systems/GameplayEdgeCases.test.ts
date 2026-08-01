import { beforeEach, describe, expect, it } from 'vitest';
import { CardEffectExecutor } from '@/systems/cards/CardEffectExecutor';
import { SynergySystem } from '@/systems/cards/SynergySystem';
import { ScoreSystem } from '@/systems/scoring/ScoreSystem';
import { CardRegistry } from '@/cards/CardRegistry';
import { defaultGameState, selectCanEmbraceInfinite, useStore } from '@/state/store';
import type { CardEffect } from '@/types/effects';
import type { AngelDefinition, AngelInstance, CardDefinition, CherubimDefinition, CherubimInstance, SeraphimDefinition, SeraphimInstance } from '@/types/cards';
import type { BoardState, DeckCard, DeckEntry, DeckState, TurnState } from '@/types/game';

const emptyBoard: BoardState = {
  frontSlots: [null, null, null, null, null],
  backSlots: [null, null, null, null],
  activeBoardEffects: [],
};

function makePlayingTurn(overrides: Partial<TurnState> = {}): TurnState {
  // Always provide a fresh recastLedger so cross-test mutations cannot leak via the shared default reference.
  return { ...defaultGameState.turn, recastLedger: [], phase: 'playing', ...overrides };
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

function flattenEffects(effects: CardEffect[]): CardEffect[] {
  const flat: CardEffect[] = [];
  const visit = (effect: CardEffect): void => {
    flat.push(effect);
    if (effect.type === 'conditional') {
      effect.then.forEach(visit);
    }
    if (effect.type === 'overclock') {
      effect.then.forEach(visit);
    }
  };
  effects.forEach(visit);
  return flat;
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

describe('CardEffectExecutor look-top menu routing', () => {
  it('routes Equilibrium Ward to look_top_take instead of look_top_take_drop', () => {
    const result = CardEffectExecutor.execute(
      { instanceId: 'play_1', definitionId: 'cherubim-neutral-equilibrium-ward' },
      makePlayingTurn(),
      emptyBoard,
      {
        ...makeDeck('cherubim-neutral-equilibrium-ward'),
        drawPile: [
          { instanceId: 'draw_1', definitionId: 'seek-neutral-void-surge' },
          { instanceId: 'draw_2', definitionId: 'seek-neutral-void-surge' },
          { instanceId: 'draw_3', definitionId: 'seek-neutral-void-surge' },
          { instanceId: 'draw_4', definitionId: 'seek-neutral-void-surge' },
        ],
      }
    );

    expect(result.pendingEffect?.type).toBe('look_top_take');
    if (result.pendingEffect?.type === 'look_top_take') {
      expect(result.pendingEffect.take).toBe(1);
    }
  });
});

describe('Card definition menu invariants', () => {
  it('keeps selection-based effect definitions internally consistent across all cards', () => {
    for (const def of CardRegistry.getAll()) {
      const sourceEffects = def.type === 'Ophanim'
        ? def.effects
        : def.type === 'Seraphim'
          ? def.onPlayEffects
          : def.type === 'Cherubim'
            ? def.onPlayEffects
            : def.onSummonEffects;

      const effects = flattenEffects(sourceEffects);

      for (const effect of effects) {
        if (effect.type === 'look_top_take') {
          expect(effect.take, `${def.definitionId} look_top_take must take at least 1`).toBeGreaterThanOrEqual(1);
          expect(effect.look, `${def.definitionId} look_top_take must look >= take`).toBeGreaterThanOrEqual(effect.take);
        }

        if (effect.type === 'look_top_take_drop') {
          expect(effect.take, `${def.definitionId} look_top_take_drop must take at least 1`).toBeGreaterThanOrEqual(1);
          expect(effect.drop, `${def.definitionId} look_top_take_drop must drop at least 1; use look_top_take when drop is 0`).toBeGreaterThanOrEqual(1);
          expect(effect.look, `${def.definitionId} look_top_take_drop must look >= take + drop`).toBeGreaterThanOrEqual(effect.take + effect.drop);
        }

        if (effect.type === 'look_top_take_type') {
          expect(effect.look, `${def.definitionId} look_top_take_type must look at least 1`).toBeGreaterThanOrEqual(1);
          expect(effect.filter.length, `${def.definitionId} look_top_take_type must include at least one filter`).toBeGreaterThan(0);
        }

        if (effect.type === 'search_deck_by_type' || effect.type === 'salvage_by_type') {
          expect(effect.filter.length, `${def.definitionId} ${effect.type} must include at least one filter`).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('Neutrality patience stacking', () => {
  it('does not apply linked-mode bonus across set boundaries', () => {
    const activeA: SeraphimInstance = {
      instanceId: 'ser_active_a',
      definitionId: 'ser-neutral-equilibrium',
      type: 'Seraphim',
      element: 'Neutrality',
      rarity: 'Rare',
      level: 1,
      isActive: true,
      boardSlot: 0,
      patienceStacks: 1,
    };

    const result = CardEffectExecutor.execute(
      { instanceId: 'play_1', definitionId: 'hr-light-grand-illumination' },
      makePlayingTurn({ neutralityLinkedGainBonus: 1 }),
      {
        frontSlots: [activeA, null, null, null, null],
        backSlots: [null, null, null, null],
        activeBoardEffects: [],
      },
      makeDeck('hr-light-grand-illumination'),
      false,
      {
        effects: [{ type: 'patience_gain_all', value: 2 }],
        countAsPlay: false,
      },
    );

    const nextActive = result.board.frontSlots[0];
    expect(nextActive?.type).toBe('Seraphim');
    if (nextActive?.type === 'Seraphim') {
      expect(nextActive.patienceStacks).toBe(1);
    }
  });

  it('caps Patience at 150 and Patient Light at 15 by default', () => {
    resetStore();

    const seraphim: SeraphimInstance = {
      instanceId: 'ser_cap_1',
      definitionId: 'ser-neutral-equilibrium',
      type: 'Seraphim',
      element: 'Neutrality',
      rarity: 'Rare',
      level: 1,
      isActive: true,
      boardSlot: 0,
      attackCooldowns: {},
      patienceStacks: 999,
    };

    const angel: AngelInstance = {
      instanceId: 'angel_cap_1',
      definitionId: 'angel-neutral-beginning',
      type: 'Angel',
      element: 'Neutrality',
      rarity: 'Common',
      finish: 'normal',
      level: 1,
      cardsPlayedSinceSummon: 0,
      activated: true,
      attackCooldowns: {},
      boardSlot: 1,
      patienceStacks: 999,
    };

    useStore.setState(state => ({
      ...state,
      board: {
        ...state.board,
        frontSlots: [seraphim, angel, null, null, null],
      },
      turn: {
        ...state.turn,
        neutralityPatientLightStacks: 999,
      },
    }));

    useStore.getState().refreshComputedStats();

    const state = useStore.getState();
    expect(state.turn.neutralityPatientLightStacks).toBe(15);
    const frontSeraphim = state.board.frontSlots[0];
    const frontAngel = state.board.frontSlots[1];
    expect(frontSeraphim?.type).toBe('Seraphim');
    expect(frontAngel?.type).toBe('Angel');
    if (frontSeraphim?.type === 'Seraphim' && frontAngel?.type === 'Angel') {
      expect(frontSeraphim.patienceStacks).toBe(150);
      expect(frontAngel.patienceStacks).toBe(150);
    }
  });

  it('uncaps Patience and Patient Light gains while a Neutrality Transcendent is in deck', () => {
    resetStore();

    const seraphim: SeraphimInstance = {
      instanceId: 'ser_uncap_1',
      definitionId: 'ser-neutral-equilibrium',
      type: 'Seraphim',
      element: 'Neutrality',
      rarity: 'Rare',
      level: 1,
      isActive: true,
      boardSlot: 0,
      attackCooldowns: {},
      patienceStacks: 999,
    };

    useStore.setState(state => ({
      ...state,
      board: {
        ...state.board,
        frontSlots: [seraphim, null, null, null, null],
      },
      deck: {
        ...state.deck,
        deckList: [{ definitionId: 'tx-sera-null-entropy', copies: 1, finish: 'normal' }],
      },
      turn: {
        ...state.turn,
        neutralityPatientLightStacks: 999,
      },
    }));

    useStore.getState().refreshComputedStats();

    const state = useStore.getState();
    expect(state.turn.neutralityPatientLightStacks).toBe(999);
    const frontSeraphim = state.board.frontSlots[0];
    expect(frontSeraphim?.type).toBe('Seraphim');
    if (frontSeraphim?.type === 'Seraphim') {
      expect(frontSeraphim.patienceStacks).toBe(999);
    }
  });

  it('enforces cap in CardEffectExecutor unless Neutrality Transcendent deck-passive is active', () => {
    const noUncapResult = CardEffectExecutor.execute(
      { instanceId: 'play_1', definitionId: 'ophanim-neutral-null-seek' },
      makePlayingTurn({ neutralityPatientLightStacks: 14 }),
      {
        frontSlots: [
          {
            instanceId: 'ser_exec_cap',
            definitionId: 'ser-neutral-equilibrium',
            type: 'Seraphim',
            element: 'Neutrality',
            rarity: 'Rare',
            finish: 'normal',
            level: 1,
            isActive: true,
            attackCooldowns: {},
            boardSlot: 0,
            patienceStacks: 149,
          },
          null,
          null,
          null,
          null,
        ],
        backSlots: [null, null, null, null],
        activeBoardEffects: [],
      },
      makeDeck('ophanim-neutral-null-seek'),
      false,
      {
        effects: [
          { type: 'neutrality_patient_light_gain', value: 10 },
          { type: 'patience_gain_all', value: 10 },
        ],
        countAsPlay: false,
      },
    );

    expect(noUncapResult.turn.neutralityPatientLightStacks).toBe(15);
    const cappedUnit = noUncapResult.board.frontSlots[0];
    expect(cappedUnit?.type).toBe('Seraphim');
    if (cappedUnit?.type === 'Seraphim') {
      expect(cappedUnit.patienceStacks).toBe(150);
    }

    const withUncapResult = CardEffectExecutor.execute(
      { instanceId: 'play_1', definitionId: 'ophanim-neutral-null-seek' },
      makePlayingTurn({ neutralityPatientLightStacks: 14 }),
      {
        frontSlots: [
          {
            instanceId: 'ser_exec_uncap',
            definitionId: 'ser-neutral-equilibrium',
            type: 'Seraphim',
            element: 'Neutrality',
            rarity: 'Rare',
            finish: 'normal',
            level: 1,
            isActive: true,
            attackCooldowns: {},
            boardSlot: 0,
            patienceStacks: 149,
          },
          null,
          null,
          null,
          null,
        ],
        backSlots: [null, null, null, null],
        activeBoardEffects: [],
      },
      {
        ...makeDeck('ophanim-neutral-null-seek'),
        deckList: [{ definitionId: 'tx-sera-null-entropy', copies: 1, finish: 'normal' }],
      },
      false,
      {
        effects: [
          { type: 'neutrality_patient_light_gain', value: 10 },
          { type: 'patience_gain_all', value: 10 },
        ],
        countAsPlay: false,
      },
    );

    expect(withUncapResult.turn.neutralityPatientLightStacks).toBe(24);
    const uncappedUnit = withUncapResult.board.frontSlots[0];
    expect(uncappedUnit?.type).toBe('Seraphim');
    if (uncappedUnit?.type === 'Seraphim') {
      expect(uncappedUnit.patienceStacks).toBe(159);
    }
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
      definitionId: index < 2 ? 'cherubim-neutral-null-veil' : 'seek-neutral-void-surge',
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
      new Set([...existingDrawPile.map(card => card.instanceId), ...hand.slice(1).map(card => card.instanceId)]),
    );
  });

  it('auto-resolves and immediately ends the turn when only one draw-capable card exists', () => {
    const hand: DeckCard[] = Array.from({ length: 40 }, (_, index) => ({
      instanceId: `single_draw_${index}`,
      definitionId: index === 0 ? 'cherubim-neutral-null-veil' : 'seek-neutral-void-surge',
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

describe('Cherubim on-play resolution', () => {
  beforeEach(() => {
    resetStore();
  });

  it('keeps pending search effects when Null Veil is played from hand', () => {
    useStore.setState(state => ({
      ...state,
      deck: {
        ...state.deck,
        hand: [
          { instanceId: 'cherubim_play_1', definitionId: 'cherubim-neutral-null-veil', finish: 'normal' },
        ],
        drawPile: [
          { instanceId: 'draw_seraphim_1', definitionId: 'ser-neutral-null', finish: 'normal' },
          { instanceId: 'draw_ophanim_1', definitionId: 'ophanim-neutral-void-surge', finish: 'normal' },
          { instanceId: 'draw_seraphim_2', definitionId: 'ser-neutral-void', finish: 'normal' },
          { instanceId: 'draw_ophanim_2', definitionId: 'ophanim-neutral-null-seek', finish: 'normal' },
        ],
        discardPile: [],
      },
      board: {
        ...state.board,
        backSlots: [null, null, null, null],
      },
      turn: {
        ...state.turn,
        phase: 'playing',
        pendingEffect: null,
      },
    }));

    useStore.getState().playCard('cherubim_play_1');

    const state = useStore.getState();
    expect(state.turn.pendingEffect?.type).toBe('search_deck');
    expect(state.turn.pendingEffect?.filter).toEqual(['Seraphim']);
    expect(state.deck.hand).toHaveLength(0);
  });
});

describe('Seraphim bonus wiring', () => {
  beforeEach(() => {
    resetStore();
  });

  it('grants cherubim_expire_bonus when a Cherubim expires from durability', () => {
    const stillSeraphim: SeraphimInstance = {
      instanceId: 'ser_still_1',
      definitionId: 'ser-neutral-still',
      type: 'Seraphim',
      element: 'Neutrality',
      rarity: 'Epic',
      finish: 'normal',
      level: 1,
      isActive: true,
      attackCooldowns: {},
      boardSlot: 0,
    };

    const expiringCherubim: CherubimInstance = {
      instanceId: 'cherubim_expire_1',
      definitionId: 'cherubim-neutral-null-veil',
      type: 'Cherubim',
      element: 'Neutrality',
      rarity: 'Common',
      finish: 'normal',
      level: 1,
      backSlot: 0,
      durability: 1,
      maxDurability: 1,
    };

    useStore.setState(state => ({
      ...state,
      board: {
        ...state.board,
        frontSlots: [stillSeraphim, null, null, null, null],
        backSlots: [expiringCherubim, null, null, null],
      },
      deck: {
        ...state.deck,
        hand: [{ instanceId: 'play_oph_1', definitionId: 'ophanim-neutral-null-seek', finish: 'normal' }],
        drawPile: [],
        discardPile: [],
      },
      turn: {
        ...state.turn,
        phase: 'playing',
      },
      progress: {
        ...state.progress,
        oblivion: 0,
      },
    }));

    useStore.getState().playCard('play_oph_1');

    const state = useStore.getState();
    expect(state.board.backSlots[0]).toBeNull();
    expect(state.progress.oblivion).toBeGreaterThanOrEqual(50);
  });

  it('requires discarding a hand card to send a Seraphim to discard', () => {
    const seraphim: SeraphimInstance = {
      instanceId: 'ser_board_1',
      definitionId: 'ser-neutral-balance',
      type: 'Seraphim',
      element: 'Neutrality',
      rarity: 'Rare',
      finish: 'normal',
      level: 1,
      isActive: true,
      attackCooldowns: {},
      boardSlot: 0,
    };

    const handCard: DeckCard = { instanceId: 'cost_1', definitionId: 'ophanim-neutral-null-seek', finish: 'normal' };

    useStore.setState(state => ({
      ...state,
      board: {
        ...state.board,
        frontSlots: [seraphim, null, null, null, null],
      },
      deck: {
        ...state.deck,
        hand: [handCard],
        discardPile: [],
      },
      turn: {
        ...state.turn,
        phase: 'playing',
      },
    }));

    useStore.getState().discardCardToRemoveSeraphim(0);

    let state = useStore.getState();
    expect(state.turn.pendingEffect?.type).toBe('discard_choice');

    useStore.getState().resolvePending(['cost_1']);

    state = useStore.getState();
    expect(state.deck.hand).toHaveLength(0);
    expect(state.board.frontSlots[0]).toBeNull();
    expect(state.deck.discardPile.map(card => card.instanceId)).toContain('cost_1');
    expect(state.deck.discardPile.map(card => card.instanceId)).toContain('ser_board_1');
  });
});

describe('Angel attack cost selection', () => {
  beforeEach(() => {
    resetStore();
  });

  it('removes discard and sacrifice taxes from Seraphim and Angel attacks', () => {
    const allAttacks = CardRegistry.getAll().flatMap((def) => {
      if (def.type === 'Seraphim' && def.attacks) {
        return [def.attacks.unsynergized, def.attacks.synergized];
      }
      if (def.type === 'Angel' && def.attacks) {
        return [def.attacks.primary, def.attacks.exalted];
      }
      return [];
    });

    const hasCardTax = allAttacks.some(attack =>
      (attack.costs ?? []).some(cost => (
        cost.type === 'discard_from_hand'
        || cost.type === 'sacrifice_seraphim'
        || cost.type === 'sacrifice_angel'
      )),
    );

    expect(hasCardTax).toBe(false);
  });

  it('prevents immediate repeated Seraphim attacks on reported cards', () => {
    const equilibrium = CardRegistry.get('ser-neutral-equilibrium');
    const voidSeraphim = CardRegistry.get('ser-neutral-void');
    if (!equilibrium || equilibrium.type !== 'Seraphim') throw new Error('ser-neutral-equilibrium not found');
    if (!voidSeraphim || voidSeraphim.type !== 'Seraphim') throw new Error('ser-neutral-void not found');

    const eqUnit: SeraphimInstance = {
      instanceId: 'ser_eq_test_1',
      definitionId: equilibrium.definitionId,
      type: 'Seraphim',
      element: equilibrium.element,
      rarity: equilibrium.rarity,
      finish: 'normal',
      level: 1,
      isActive: true,
      attackCooldowns: {},
      boardSlot: 0,
    };
    const voidUnit: SeraphimInstance = {
      instanceId: 'ser_void_test_1',
      definitionId: voidSeraphim.definitionId,
      type: 'Seraphim',
      element: voidSeraphim.element,
      rarity: voidSeraphim.rarity,
      finish: 'normal',
      level: 1,
      isActive: true,
      attackCooldowns: {},
      boardSlot: 1,
    };

    useStore.setState(state => ({
      ...state,
      deck: {
        ...state.deck,
        hand: [
          { instanceId: 'eq_pay_1', definitionId: 'seek-neutral-measured-seek' },
          { instanceId: 'eq_pay_2', definitionId: 'seek-neutral-measured-seek' },
          { instanceId: 'void_pay_1', definitionId: 'seek-neutral-measured-seek' },
          { instanceId: 'void_pay_2', definitionId: 'seek-neutral-measured-seek' },
        ],
      },
      board: {
        ...state.board,
        frontSlots: [eqUnit, voidUnit, null, null, null],
      },
      turn: {
        ...state.turn,
        phase: 'playing',
      },
      progress: {
        ...state.progress,
        oblivion: 0,
      },
    }));

    useStore.getState().activateSeraphimAttack(0, 'unsynergized', {
      discardInstanceIds: ['eq_pay_1'],
      sacrificeSeraphimInstanceIds: [],
      sacrificeAngelInstanceIds: [],
    });
    const afterEqFirst = useStore.getState();
    const eqCooldownValues = afterEqFirst.board.frontSlots[0]?.type === 'Seraphim'
      ? Object.values(afterEqFirst.board.frontSlots[0].attackCooldowns)
      : [];
    expect(eqCooldownValues.some(value => value >= 1)).toBe(true);

    const eqFirstOblivion = afterEqFirst.progress.oblivion;
    useStore.getState().activateSeraphimAttack(0, 'unsynergized', {
      discardInstanceIds: ['eq_pay_2'],
      sacrificeSeraphimInstanceIds: [],
      sacrificeAngelInstanceIds: [],
    });
    const afterEqSecond = useStore.getState();
    expect(afterEqSecond.progress.oblivion).toBe(eqFirstOblivion);

    useStore.getState().activateSeraphimAttack(1, 'unsynergized', {
      discardInstanceIds: ['void_pay_1'],
      sacrificeSeraphimInstanceIds: [],
      sacrificeAngelInstanceIds: [],
    });
    const afterVoidFirst = useStore.getState();
    const voidCooldownValues = afterVoidFirst.board.frontSlots[1]?.type === 'Seraphim'
      ? Object.values(afterVoidFirst.board.frontSlots[1].attackCooldowns)
      : [];
    expect(voidCooldownValues.some(value => value >= 1)).toBe(true);

    const voidFirstOblivion = afterVoidFirst.progress.oblivion;
    useStore.getState().activateSeraphimAttack(1, 'unsynergized', {
      discardInstanceIds: ['void_pay_2'],
      sacrificeSeraphimInstanceIds: [],
      sacrificeAngelInstanceIds: [],
    });
    const afterVoidSecond = useStore.getState();
    expect(afterVoidSecond.progress.oblivion).toBe(voidFirstOblivion);
  });

  it('prevents immediate repeated Angel attacks', () => {
    const def = CardRegistry.get('angel-neutral-beginning');
    if (!def || def.type !== 'Angel') throw new Error('angel-neutral-beginning not found');

    const angel: AngelInstance = {
      instanceId: 'angel_board_repeat_1',
      definitionId: def.definitionId,
      type: 'Angel',
      element: def.element,
      rarity: def.rarity,
      finish: 'normal',
      level: 1,
      cardsPlayedSinceSummon: 0,
      activated: false,
      attackCooldowns: {},
      boardSlot: 0,
    };

    useStore.setState(state => ({
      ...state,
      board: {
        ...state.board,
        frontSlots: [angel, null, null, null, null],
      },
      turn: {
        ...state.turn,
        phase: 'playing',
      },
      progress: {
        ...state.progress,
        oblivion: 0,
      },
    }));

    useStore.getState().activateAngelAttack(0, 'primary');
    const afterFirst = useStore.getState();
    const firstCooldownValues = afterFirst.board.frontSlots[0]?.type === 'Angel'
      ? Object.values(afterFirst.board.frontSlots[0].attackCooldowns)
      : [];
    expect(firstCooldownValues.some(value => value >= 1)).toBe(true);

    const firstOblivion = afterFirst.progress.oblivion;
    useStore.getState().activateAngelAttack(0, 'primary');
    const afterSecond = useStore.getState();
    expect(afterSecond.progress.oblivion).toBe(firstOblivion);
  });
});

describe('Seraphim synergy activation', () => {
  it('activates all Seraphim when any Angel is present (any-Angel rule)', () => {
    const lightSeraphim: SeraphimInstance = {
      instanceId: 'ser_sync_light_1',
      definitionId: 'ser-light-photonic-harbinger',
      type: 'Seraphim',
      element: 'Light',
      rarity: 'Rare',
      finish: 'normal',
      level: 1,
      isActive: false,
      attackCooldowns: {},
      boardSlot: 0,
    };

    const lightSupportSeraphim: SeraphimInstance = {
      instanceId: 'ser_sync_light_2',
      definitionId: 'ser-light-solar-bastion',
      type: 'Seraphim',
      element: 'Light',
      rarity: 'Rare',
      finish: 'normal',
      level: 1,
      isActive: false,
      attackCooldowns: {},
      boardSlot: 1,
    };

    const neutralCherubim: CherubimInstance = {
      instanceId: 'cher_sync_1',
      definitionId: 'cherubim-neutral-null-veil',
      type: 'Cherubim',
      element: 'Neutrality',
      rarity: 'Common',
      finish: 'normal',
      level: 1,
      backSlot: 0,
    };

    const noAngelBoard: BoardState = {
      frontSlots: [lightSeraphim, lightSupportSeraphim, null, null, null],
      backSlots: [neutralCherubim, null, null, null],
      activeBoardEffects: [],
    };
    const noAngelResult = SynergySystem.computeActiveSlots(noAngelBoard);
    expect(noAngelResult[0]?.type === 'Seraphim' ? noAngelResult[0].isActive : true).toBe(false);

    const lightAngel: AngelInstance = {
      instanceId: 'angel_sync_light_1',
      definitionId: 'angel-light-seraphiel',
      type: 'Angel',
      element: 'Light',
      rarity: 'Rare',
      finish: 'normal',
      level: 1,
      cardsPlayedSinceSummon: 0,
      activated: false,
      attackCooldowns: {},
      boardSlot: 2,
    };

    const withAngelBoard: BoardState = {
      frontSlots: [lightSeraphim, lightSupportSeraphim, lightAngel, null, null],
      backSlots: [neutralCherubim, null, null, null],
      activeBoardEffects: [],
    };
    const withAngelResult = SynergySystem.computeActiveSlots(withAngelBoard);
    expect(withAngelResult[0]?.type === 'Seraphim' ? withAngelResult[0].isActive : false).toBe(true);
  });
});

describe('Hidden multiplier regression guards', () => {
  function makeTestAngelDefinition(definitionId: string, rarity: AngelDefinition['rarity']): AngelDefinition {
    return {
      definitionId,
      type: 'Angel',
      element: 'Light',
      rarity,
      name: `Test ${definitionId}`,
      description: 'Test-only attack definition',
      artKey: definitionId,
      summonCost: [],
      onSummonEffects: [],
      activatedAbility: {
        name: 'No-op',
        cardsPlayedRequirement: 99,
        description: 'No-op',
        effects: [],
      },
      attacks: {
        primary: {
          id: `${definitionId}:primary`,
          label: 'Primary',
          name: 'Primary',
          description: '1000 base Oblivion · 3 cards cooldown',
          baseOblivion: 1000,
          cooldownCards: 3,
          costs: [],
          tags: ['angel', 'primary', 'test'],
        },
        exalted: {
          id: `${definitionId}:exalted`,
          label: 'Exalted',
          name: 'Exalted',
          description: '2000 base Oblivion · 5 cards cooldown',
          baseOblivion: 2000,
          cooldownCards: 5,
          costs: [],
          tags: ['angel', 'exalted', 'test'],
        },
      },
      baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 0 },
    };
  }

  const fillerSeraphimDef: SeraphimDefinition = {
    definitionId: 'test-seraphim-filler',
    type: 'Seraphim',
    element: 'Light',
    rarity: 'Common',
    name: 'Filler Seraphim',
    description: 'No-op filler',
    artKey: 'test_seraphim_filler',
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 0, synergyRequirement: 'Light' },
    onPlayEffects: [],
  };

  const fillerCherubimDef: CherubimDefinition = {
    definitionId: 'test-cherubim-filler',
    type: 'Cherubim',
    element: 'Light',
    rarity: 'Common',
    name: 'Filler Cherubim',
    description: 'No-op filler',
    artKey: 'test_cherubim_filler',
    effects: [],
    onPlayEffects: [],
  };

  function makeTestAngelInstance(definitionId: string, rarity: AngelDefinition['rarity']): AngelInstance {
    return {
      instanceId: `${definitionId}:instance`,
      definitionId,
      type: 'Angel',
      element: 'Light',
      rarity,
      finish: 'normal',
      level: 1,
      cardsPlayedSinceSummon: 0,
      activated: false,
      attackCooldowns: {},
      boardSlot: 0,
    };
  }

  function runPrimaryAttackWithDefinitions(
    definitions: CardDefinition[],
    board: BoardState,
  ): { oblivionDelta: number; handSize: number } {
    resetStore();

    const originalGetDefinition = ScoreSystem.getDefinition;
    const map = new Map(definitions.map(def => [def.definitionId, def]));
    ScoreSystem.getDefinition = (id: string) => map.get(id);

    try {
      useStore.setState(state => ({
        ...state,
        board,
        deck: {
          ...state.deck,
          hand: [],
          drawPile: [],
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
      useStore.getState().refreshComputedStats();

      useStore.getState().activateAngelAttack(0, 'primary');

      const state = useStore.getState();
      return {
        oblivionDelta: state.progress.oblivion,
        handSize: state.deck.hand.length,
      };
    } finally {
      ScoreSystem.getDefinition = originalGetDefinition;
    }
  }

  it('does not apply additional hidden high-tier attack multipliers beyond explicit full-fire scaling', () => {
    const rareDef = makeTestAngelDefinition('test-angel-rare', 'Rare');
    const infiniteDef = makeTestAngelDefinition('test-angel-infinite', 'Infinite');
    const sharedDefs: CardDefinition[] = [rareDef, infiniteDef, fillerSeraphimDef, fillerCherubimDef];

    const sparseBoardForRare: BoardState = {
      frontSlots: [makeTestAngelInstance(rareDef.definitionId, rareDef.rarity), null, null, null, null],
      backSlots: [null, null, null, null],
      activeBoardEffects: [],
    };
    const sparseBoardForInfinite: BoardState = {
      frontSlots: [makeTestAngelInstance(infiniteDef.definitionId, infiniteDef.rarity), null, null, null, null],
      backSlots: [null, null, null, null],
      activeBoardEffects: [],
    };

    const rareResult = runPrimaryAttackWithDefinitions(sharedDefs, sparseBoardForRare);
    const infiniteResult = runPrimaryAttackWithDefinitions(sharedDefs, sparseBoardForInfinite);

    expect(rareResult.oblivionDelta).toBe(1000);
    // Neutrality Infinite full-fire: 0.70× when conditions not met (no setup/engines in sparse test)
    expect(infiniteResult.oblivionDelta).toBe(700);
  });

  it('does not grant a hidden full-board attack payout bonus', () => {
    const rareDef = makeTestAngelDefinition('test-angel-fullboard', 'Rare');
    const sharedDefs: CardDefinition[] = [rareDef, fillerSeraphimDef, fillerCherubimDef];

    const sparseBoard: BoardState = {
      frontSlots: [makeTestAngelInstance(rareDef.definitionId, rareDef.rarity), null, null, null, null],
      backSlots: [null, null, null, null],
      activeBoardEffects: [],
    };

    const fullBoard: BoardState = {
      frontSlots: [
        makeTestAngelInstance(rareDef.definitionId, rareDef.rarity),
        {
          instanceId: 'filler_ser_1',
          definitionId: fillerSeraphimDef.definitionId,
          type: 'Seraphim',
          element: 'Light',
          rarity: 'Common',
          finish: 'normal',
          level: 1,
          isActive: false,
          attackCooldowns: {},
          boardSlot: 1,
        },
        {
          instanceId: 'filler_ser_2',
          definitionId: fillerSeraphimDef.definitionId,
          type: 'Seraphim',
          element: 'Light',
          rarity: 'Common',
          finish: 'normal',
          level: 1,
          isActive: false,
          attackCooldowns: {},
          boardSlot: 2,
        },
        {
          instanceId: 'filler_ser_3',
          definitionId: fillerSeraphimDef.definitionId,
          type: 'Seraphim',
          element: 'Light',
          rarity: 'Common',
          finish: 'normal',
          level: 1,
          isActive: false,
          attackCooldowns: {},
          boardSlot: 3,
        },
        {
          instanceId: 'filler_ser_4',
          definitionId: fillerSeraphimDef.definitionId,
          type: 'Seraphim',
          element: 'Light',
          rarity: 'Common',
          finish: 'normal',
          level: 1,
          isActive: false,
          attackCooldowns: {},
          boardSlot: 4,
        },
      ],
      backSlots: [
        {
          instanceId: 'filler_cher_1',
          definitionId: fillerCherubimDef.definitionId,
          type: 'Cherubim',
          element: 'Light',
          rarity: 'Common',
          finish: 'normal',
          level: 1,
          backSlot: 0,
        },
        {
          instanceId: 'filler_cher_2',
          definitionId: fillerCherubimDef.definitionId,
          type: 'Cherubim',
          element: 'Light',
          rarity: 'Common',
          finish: 'normal',
          level: 1,
          backSlot: 1,
        },
        {
          instanceId: 'filler_cher_3',
          definitionId: fillerCherubimDef.definitionId,
          type: 'Cherubim',
          element: 'Light',
          rarity: 'Common',
          finish: 'normal',
          level: 1,
          backSlot: 2,
        },
        {
          instanceId: 'filler_cher_4',
          definitionId: fillerCherubimDef.definitionId,
          type: 'Cherubim',
          element: 'Light',
          rarity: 'Common',
          finish: 'normal',
          level: 1,
          backSlot: 3,
        },
      ],
      activeBoardEffects: [],
    };

    const sparseResult = runPrimaryAttackWithDefinitions(sharedDefs, sparseBoard);
    const fullBoardResult = runPrimaryAttackWithDefinitions(sharedDefs, fullBoard);

    expect(sparseResult.oblivionDelta).toBe(1000);
    expect(fullBoardResult.oblivionDelta).toBe(1000);
  });

  it('keeps late-game identity side effects disabled even for mapped Eternal cards', () => {
    const mappedEternalDef = makeTestAngelDefinition('btei-convergence-of-eternity', 'Eternal');
    const sharedDefs: CardDefinition[] = [mappedEternalDef, fillerSeraphimDef, fillerCherubimDef];

    const board: BoardState = {
      frontSlots: [makeTestAngelInstance(mappedEternalDef.definitionId, mappedEternalDef.rarity), null, null, null, null],
      backSlots: [null, null, null, null],
      activeBoardEffects: [],
    };

    const result = runPrimaryAttackWithDefinitions(sharedDefs, board);

    expect(result.oblivionDelta).toBe(1000);
    expect(result.handSize).toBe(0);
  });
});
