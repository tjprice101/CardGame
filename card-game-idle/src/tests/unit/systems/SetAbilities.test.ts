import { beforeEach, describe, expect, it } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
import { resolveGatesForDeck, resolveActiveAbilitiesForDeck } from '@/systems/sets/SetEngine';
import '@/systems/sets/neutrality/NeutralityAbilities'; // registers the Neutrality set
import type { SeraphimInstance } from '@/types/cards';
import type { DeckEntry, ExtraDeckEntry } from '@/types/game';

function resetStore(): void {
  const base = JSON.parse(JSON.stringify(defaultGameState)) as typeof defaultGameState;
  useStore.setState(s => ({ ...s, ...base }));
  useStore.getState().refreshComputedStats();
}

function entry(id: string): DeckEntry {
  return { definitionId: id, copies: 1, finish: 'normal' };
}

function extraEntry(id: string): ExtraDeckEntry {
  return { definitionId: id, finish: 'normal' };
}

function makeSeraphim(patienceStacks: number, instanceId = 'test-ser-1'): SeraphimInstance {
  return {
    instanceId,
    definitionId: 'ser-neutral-null',
    type: 'Seraphim',
    element: 'Neutrality',
    rarity: 'Common',
    level: 1,
    isActive: true,
    boardSlot: 0,
    attackCooldowns: {},
    patienceStacks,
  };
}

function setActiveDeck(deckList: DeckEntry[], extraDeck: ExtraDeckEntry[] = []): void {
  useStore.setState(s => ({
    ...s,
    progress: {
      ...s.progress,
      savedDecks: [
        ...s.progress.savedDecks,
        { id: 'test-deck', name: 'Test', deckList, extraDeck, isStarter: false },
      ],
      activeDeckId: 'test-deck',
    },
    turn: {
      ...s.turn,
      phase: 'playing',
      pendingEffect: null,
      setAbilityCooldowns: {},
      setAbilityUsesRemaining: {},
    },
    deck: {
      ...s.deck,
      drawPile: [
        { instanceId: 'd1', definitionId: 'ser-neutral-null', finish: 'normal' as const },
        { instanceId: 'd2', definitionId: 'ser-neutral-null', finish: 'normal' as const },
        { instanceId: 'd3', definitionId: 'ser-neutral-null', finish: 'normal' as const },
      ],
    },
  }));
}

describe('resolveGatesForDeck', () => {
  it('grants base gate when at least one card is present', () => {
    const gates = resolveGatesForDeck([entry('ser-neutral-null')], []);
    expect(gates.has('base')).toBe(true);
  });

  it('grants eternal gate for a btei- prefixed card', () => {
    const gates = resolveGatesForDeck([entry('btei-eternal-vigil')], []);
    expect(gates.has('eternal')).toBe(true);
  });

  it('grants infinite gate for a card in the Infinite set', () => {
    const gates = resolveGatesForDeck([entry('inf-oblivion-absolute')], []);
    expect(gates.has('infinite')).toBe(true);
  });

  it('grants angel gate for an Angel in the extra deck', () => {
    const gates = resolveGatesForDeck([], [extraEntry('angel-neutral-beginning')]);
    expect(gates.has('angel')).toBe(true);
  });

  it('does not grant eternal gate for a regular card', () => {
    const gates = resolveGatesForDeck([entry('ser-neutral-null')], []);
    expect(gates.has('eternal')).toBe(false);
    expect(gates.has('infinite')).toBe(false);
    expect(gates.has('angel')).toBe(false);
  });
});

describe('resolveActiveAbilitiesForDeck', () => {
  it('returns slot 1 ability when base gate is met', () => {
    const abilities = resolveActiveAbilitiesForDeck('Neutrality', [entry('ser-neutral-null')], []);
    expect(abilities[1]?.id).toBe('neutrality-slot1-composed-draw');
    expect(abilities[2]).toBeUndefined();
  });

  it('returns slots 1 and 2 when eternal gate is met', () => {
    const abilities = resolveActiveAbilitiesForDeck('Neutrality', [entry('btei-eternal-vigil')], []);
    expect(abilities[1]).toBeDefined();
    expect(abilities[2]?.id).toBe('neutrality-slot2-vigils-ledger');
    expect(abilities[3]).toBeUndefined();
  });

  it('returns all four slots when all gates are met', () => {
    const deckList = [entry('btei-eternal-vigil'), entry('inf-oblivion-absolute')];
    const extraDeck = [extraEntry('angel-neutral-beginning')];
    const abilities = resolveActiveAbilitiesForDeck('Neutrality', deckList, extraDeck);
    expect(abilities[1]).toBeDefined();
    expect(abilities[2]).toBeDefined();
    expect(abilities[3]).toBeDefined();
    expect(abilities[4]).toBeDefined();
  });
});

describe('activateSetAbility — gate and phase guards', () => {
  beforeEach(() => {
    resetStore();
    setActiveDeck([entry('ser-neutral-null')]);
  });

  it('does nothing when phase is not playing', () => {
    useStore.setState(s => ({ ...s, turn: { ...s.turn, phase: 'idle' } }));
    useStore.getState().activateSetAbility(1);
    // No crash; hand size should be unchanged.
    expect(useStore.getState().deck.hand.length).toBe(0);
  });

  it('skips activation when gate is not met for the requested slot', () => {
    // Deck has no eternal card, so slot 2 gate fails.
    useStore.getState().activateSetAbility(2);
    expect(useStore.getState().deck.hand.length).toBe(0);
  });
});

describe('Composed Draw (slot 1)', () => {
  beforeEach(() => {
    resetStore();
    setActiveDeck([entry('ser-neutral-null')]);
    useStore.setState(s => ({
      ...s,
      board: {
        ...s.board,
        frontSlots: [makeSeraphim(5), null, null, null, null],
      },
    }));
  });

  it('draws 2 cards from the draw pile', () => {
    const before = useStore.getState().deck.hand.length;
    useStore.getState().activateSetAbility(1);
    expect(useStore.getState().deck.hand.length).toBe(before + 2);
  });

  it('grants +3 patience to every front-row unit', () => {
    useStore.getState().activateSetAbility(1);
    const unit = useStore.getState().board.frontSlots[0];
    expect(unit?.type === 'Seraphim' && unit.patienceStacks).toBe(8);
  });

  it('sets a cooldown of 3 plays after activation', () => {
    useStore.getState().activateSetAbility(1);
    const cd = useStore.getState().turn.setAbilityCooldowns ?? {};
    expect(cd['neutrality-slot1-composed-draw']).toBe(3);
  });

  it('is blocked while the cooldown is active', () => {
    useStore.getState().activateSetAbility(1);
    const handAfterFirst = useStore.getState().deck.hand.length;
    useStore.getState().activateSetAbility(1);
    expect(useStore.getState().deck.hand.length).toBe(handAfterFirst);
  });
});

describe("Vigil's Ledger (slot 2)", () => {
  beforeEach(() => {
    resetStore();
    setActiveDeck([entry('btei-eternal-vigil')]);
    useStore.setState(s => ({
      ...s,
      board: {
        ...s.board,
        frontSlots: [makeSeraphim(25, 'ser-a'), makeSeraphim(10, 'ser-b'), null, null, null],
      },
    }));
  });

  it('grants +5 patience to units with ≥20 patience', () => {
    useStore.getState().activateSetAbility(2);
    const unitA = useStore.getState().board.frontSlots[0];
    expect(unitA?.type === 'Seraphim' && unitA.patienceStacks).toBe(30);
  });

  it('does not grant patience to units below the 20 threshold', () => {
    useStore.getState().activateSetAbility(2);
    const unitB = useStore.getState().board.frontSlots[1];
    expect(unitB?.type === 'Seraphim' && unitB.patienceStacks).toBe(10);
  });

  it('draws 2 additional cards', () => {
    const before = useStore.getState().deck.hand.length;
    useStore.getState().activateSetAbility(2);
    expect(useStore.getState().deck.hand.length).toBe(before + 2);
  });
});

describe('Recursive Calm (slot 3)', () => {
  beforeEach(() => {
    resetStore();
    setActiveDeck([entry('inf-oblivion-absolute')]);
    useStore.setState(s => ({
      ...s,
      board: {
        ...s.board,
        frontSlots: [makeSeraphim(10, 'ser-a'), makeSeraphim(20, 'ser-b'), null, null, null],
      },
    }));
  });

  it('sets all front-row patience stacks to 0', () => {
    useStore.getState().activateSetAbility(3);
    const a = useStore.getState().board.frontSlots[0];
    const b = useStore.getState().board.frontSlots[1];
    expect(a?.type === 'Seraphim' && a.patienceStacks).toBe(0);
    expect(b?.type === 'Seraphim' && b.patienceStacks).toBe(0);
  });

  it('grants oblivion equal to total patience × 500 (no mastery bonus at base resonance)', () => {
    const before = useStore.getState().progress.oblivion;
    useStore.getState().activateSetAbility(3);
    // 10 + 20 = 30 patience × 500 × 1.0 mastery (resonance 0) = 15,000
    expect(useStore.getState().progress.oblivion).toBe(before + 15_000);
  });

  it('is blocked after the first use', () => {
    useStore.getState().activateSetAbility(3);
    const oblivionAfterFirst = useStore.getState().progress.oblivion;
    useStore.getState().activateSetAbility(3);
    expect(useStore.getState().progress.oblivion).toBe(oblivionAfterFirst);
  });
});

describe('Aegis Uprising (slot 4)', () => {
  beforeEach(() => {
    resetStore();
    setActiveDeck([], [extraEntry('angel-neutral-beginning')]);
    useStore.setState(s => ({
      ...s,
      board: {
        ...s.board,
        frontSlots: [makeSeraphim(4, 'ser-a'), makeSeraphim(8, 'ser-b'), null, null, null],
      },
    }));
  });

  it('grants each unit patience equal to the board minimum × 3', () => {
    // min = 4, grant = 12
    useStore.getState().activateSetAbility(4);
    const a = useStore.getState().board.frontSlots[0];
    const b = useStore.getState().board.frontSlots[1];
    expect(a?.type === 'Seraphim' && a.patienceStacks).toBe(16);
    expect(b?.type === 'Seraphim' && b.patienceStacks).toBe(20);
  });

  it('is blocked after the first use', () => {
    useStore.getState().activateSetAbility(4);
    const patienceAfterFirst = (useStore.getState().board.frontSlots[0] as SeraphimInstance).patienceStacks;
    useStore.getState().activateSetAbility(4);
    expect((useStore.getState().board.frontSlots[0] as SeraphimInstance).patienceStacks).toBe(patienceAfterFirst);
  });
});
