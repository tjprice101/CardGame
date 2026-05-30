import { describe, expect, it } from 'vitest';

import { CardRegistry } from '@/cards/CardRegistry';
import { CardEffectExecutor } from '@/systems/cards/CardEffectExecutor';
import { defaultGameState } from '@/state/store';
import type { CardDefinition } from '@/types/cards';
import type { CardEffect } from '@/types/effects';
import type { BoardState, DeckCard, DeckState, TurnState } from '@/types/game';

function flattenEffects(card: CardDefinition): CardEffect[] {
  const out: CardEffect[] = [];
  const add = (effects: readonly CardEffect[] | undefined): void => {
    if (!effects) return;
    out.push(...effects);
    for (const effect of effects) {
      if (effect.type === 'conditional') add(effect.then);
    }
  };

  if (card.type === 'Ophanim') add(card.effects);
  if (card.type === 'Cherubim') {
    add(card.effects);
    add(card.onPlayEffects);
  }
  if (card.type === 'Seraphim') add(card.onPlayEffects);
  if (card.type === 'Angel') {
    add(card.onSummonEffects);
    add(card.activatedAbility.effects);
  }

  return out;
}

function getWuasCards(): CardDefinition[] {
  return CardRegistry.getAll().filter(card => card.definitionId.startsWith('wuas-') || card.definitionId.startsWith('inf-wuas-'));
}

function buildBehaviorSignature(card: CardDefinition): string {
  const base = {
    type: card.type,
    effects: flattenEffects(card),
  } as Record<string, unknown>;

  if (card.type === 'Seraphim') {
    base.baseStats = card.baseStats;
    base.attacks = {
      unsynergized: card.attacks.unsynergized,
      synergized: card.attacks.synergized,
    };
  }

  if (card.type === 'Angel') {
    base.baseStats = card.baseStats;
    base.activatedAbility = card.activatedAbility;
    base.attacks = {
      primary: card.attacks.primary,
      exalted: card.attacks.exalted,
    };
  }

  if (card.type === 'Cherubim') {
    base.maxDurability = card.maxDurability ?? null;
    base.discardCondition = card.discardCondition ?? null;
  }

  return JSON.stringify(base);
}

function makeTurn(overrides: Partial<TurnState> = {}): TurnState {
  return {
    ...defaultGameState.turn,
    phase: 'playing',
    ...overrides,
  };
}

function makeDeck(drawCount = 24): DeckState {
  const drawPile: DeckCard[] = Array.from({ length: drawCount }, (_, idx) => ({
    instanceId: `draw_${idx + 1}`,
    definitionId: 'seek-neutral-null-seek',
    finish: 'normal',
  }));

  return {
    deckList: [],
    extraDeck: [],
    drawPile,
    hand: [],
    discardPile: [],
  };
}

function makeBoard(seraphimCount = 0): BoardState {
  const frontSlots = [null, null, null, null, null] as BoardState['frontSlots'];
  for (let i = 0; i < Math.min(seraphimCount, frontSlots.length); i++) {
    frontSlots[i] = {
      instanceId: `ser_${i + 1}`,
      definitionId: 'wuas-ser-solarvex-fragment',
      type: 'Seraphim',
      element: 'Light',
      rarity: 'Common',
      level: 1,
      isActive: true,
      boardSlot: i,
      patienceStacks: 0,
    } as NonNullable<BoardState['frontSlots'][number]>;
  }

  return {
    frontSlots,
    backSlots: [null, null, null, null],
    activeBoardEffects: [],
  };
}

function runEffects(
  definitionId: string,
  turn: TurnState,
  board: BoardState,
  deck: DeckState,
  explicitEffects?: CardEffect[],
): ReturnType<typeof CardEffectExecutor.execute> {
  const card = CardRegistry.get(definitionId) as CardDefinition;
  const fallbackEffects = card.type === 'Ophanim'
    ? card.effects
    : card.type === 'Cherubim'
      ? card.onPlayEffects
      : card.type === 'Seraphim'
        ? card.onPlayEffects
        : card.onSummonEffects;
  return CardEffectExecutor.execute(
    { instanceId: `play_${definitionId}`, definitionId, finish: 'normal' },
    turn,
    board,
    deck,
    false,
    { effects: explicitEffects ?? fallbackEffects },
  );
}

describe('Wished Upon A Star rework wiring', () => {
  it('keeps Infinite cards tied to Eternal Crown lanes while feeding base Starlight/Dream', () => {
    const infinites = getWuasCards().filter(card => card.definitionId.startsWith('inf-wuas-'));
    expect(infinites.length).toBe(3);

    for (const card of infinites) {
      const effects = flattenEffects(card);
      const touchesEternalLane = effects.some(effect => effect.type === 'eternal_stack_gain' || effect.type === 'wuas_constellation_lock_release');
      const feedsBaseCore = effects.some(effect => effect.type === 'starlight_gain' || effect.type === 'dream_lattice_gain');
      expect(touchesEternalLane, `${card.definitionId} should amplify Eternal Crown lanes`).toBe(true);
      expect(feedsBaseCore, `${card.definitionId} should feed base Starlight/Dream`).toBe(true);
    }
  });

  it('keeps Eternal cards role-distinct (banker, detonator, hybrid)', () => {
    const banker = CardRegistry.get('wuas-et-aethervex-wishwright');
    const detonator = CardRegistry.get('wuas-et-selenira-voidbane');
    const hybrid = CardRegistry.get('wuas-et-draethos-unforgotten');

    expect(banker?.type).toBe('Seraphim');
    expect(detonator?.type).toBe('Ophanim');
    expect(hybrid?.type).toBe('Angel');

    const bankerEffects = flattenEffects(banker as CardDefinition);
    const detonatorEffects = flattenEffects(detonator as CardDefinition);
    const hybridEffects = flattenEffects(hybrid as CardDefinition);

    expect(bankerEffects.some(effect => effect.type === 'eternal_stack_gain')).toBe(true);
    expect(bankerEffects.some(effect => effect.type === 'wuas_constellation_lock_release')).toBe(false);

    expect(detonatorEffects.some(effect => effect.type === 'wuas_nova_wish_burst')).toBe(true);
    expect(detonatorEffects.some(effect => effect.type === 'wuas_constellation_lock_release')).toBe(true);

    expect(hybridEffects.some(effect => effect.type === 'eternal_stack_gain')).toBe(true);
    expect(hybridEffects.some(effect => effect.type === 'wuas_nova_wish_burst')).toBe(true);
    expect(hybridEffects.some(effect => effect.type === 'wuas_constellation_lock_release')).toBe(true);
  });

  it('avoids duplicate WUAS effect payload signatures across cards', () => {
    const cards = getWuasCards();
    expect(cards.length).toBeGreaterThan(0);

    const signatures = new Map<string, string>();
    for (const card of cards) {
      const signature = buildBehaviorSignature(card);
      const existing = signatures.get(signature);
      expect(existing, `duplicate behavior signature on ${card.definitionId} and ${existing ?? 'unknown'}`).toBeUndefined();
      signatures.set(signature, card.definitionId);
    }
  });

  it('stellarborn throne compounds crown banking and feeds core resources', () => {
    const startTurn = makeTurn({ starlightCharges: 0, dreamLattice: 0, eternalStacks: { wuas: 0 } });
    const board = makeBoard(2);
    const deck = makeDeck(30);

    const banked = runEffects('wuas-et-aethervex-wishwright', startTurn, board, deck);
    const afterBank = banked.turn;
    const bankedCrowns = afterBank.eternalStacks.wuas;

    const throne = runEffects('inf-wuas-stellarborn-throne', afterBank, board, banked.deck);
    const afterThrone = throne.turn;

    expect(bankedCrowns).toBe(15);
    expect(afterThrone.eternalStacks.wuas).toBe(33);
    expect(afterThrone.starlightCharges).toBe(14);
    expect(afterThrone.dreamLattice).toBe(11);
    expect(throne.deck.hand.length).toBeGreaterThanOrEqual(4);
  });

  it('lune choir ascension boosts selenira detonation lane output', () => {
    const board = makeBoard(1);
    const baselineTurn = makeTurn({ starlightCharges: 8, dreamLattice: 4, eternalStacks: { wuas: 15 } });
    const baseline = runEffects('wuas-et-selenira-voidbane', baselineTurn, board, makeDeck(20));

    const buffedStart = makeTurn({ starlightCharges: 8, dreamLattice: 4, eternalStacks: { wuas: 15 } });
    const choir = runEffects('inf-wuas-lune-choir-ascension', buffedStart, board, makeDeck(20));
    const choirCrownsBeforeDetonation = choir.turn.eternalStacks.wuas ?? 0;
    const buffed = runEffects('wuas-et-selenira-voidbane', choir.turn, board, choir.deck);

    expect(choirCrownsBeforeDetonation).toBe(21);
    expect((buffed.turn.eternalStacks.wuas ?? 0)).toBe(3);
    expect(buffed.oblivionBonus).toBeGreaterThan(baseline.oblivionBonus);
    expect(buffed.oblivionBonus - baseline.oblivionBonus).toBeGreaterThanOrEqual(500);
  });

  it('wishwright absolute materially amplifies draethos hybrid cashout lane', () => {
    const board = makeBoard(2);
    const draethos = CardRegistry.get('wuas-et-draethos-unforgotten') as CardDefinition;
    const draethosEffects = draethos.type === 'Angel' ? [...draethos.onSummonEffects, ...draethos.activatedAbility.effects] : [];

    const baselineTurn = makeTurn({ starlightCharges: 4, dreamLattice: 2, eternalStacks: { wuas: 6 } });
    const baseline = runEffects('wuas-et-draethos-unforgotten', baselineTurn, board, makeDeck(20), draethosEffects);

    const amplifiedStart = makeTurn({ starlightCharges: 4, dreamLattice: 2, eternalStacks: { wuas: 6 } });
    const absolute = runEffects('inf-wuas-wishwright-absolute', amplifiedStart, board, makeDeck(20));
    const postAbsoluteCrowns = absolute.turn.eternalStacks.wuas ?? 0;
    const postAbsoluteStarlight = absolute.turn.starlightCharges;
    const postAbsoluteDream = absolute.turn.dreamLattice;
    const amplified = runEffects('wuas-et-draethos-unforgotten', absolute.turn, board, absolute.deck, draethosEffects);

    expect(postAbsoluteCrowns).toBe(0);
    expect(postAbsoluteStarlight).toBe(14);
    expect(postAbsoluteDream).toBe(10);
    expect((amplified.turn.eternalStacks.wuas ?? 0)).toBe(2);
    expect(amplified.oblivionBonus).toBeGreaterThan(baseline.oblivionBonus);
    expect(amplified.oblivionBonus - baseline.oblivionBonus).toBeGreaterThanOrEqual(150);
  });
});
