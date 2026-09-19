import { describe, expect, it } from 'vitest';
import { useStore, defaultGameState } from '@/state/store';
import { lightCards } from '@/data/cards/lightCards';
import { darkCards } from '@/data/cards/darkCards';
import { ainSophAurCards } from '@/data/cards/ainSophAurCards';
import { canActivateShatterTheInfiniteLight, SHATTER_ACTIVE_MS, SHATTER_PRIME_MS, SHATTER_RESULT_MS } from '@/systems/cards/ShatterTheInfiniteLight';
import type { GameState } from '@/types/game';

function resetStore(): void {
  const baseState = JSON.parse(JSON.stringify(defaultGameState)) as GameState;
  useStore.setState(state => ({ ...state, ...baseState }));
}

function buildFullShatterBoard() {
  const frontSlots = Array.from({ length: 4 }, (_, i) => ({
    instanceId: `asa-${i}`,
    definitionId: ainSophAurCards[i % ainSophAurCards.length].definitionId,
    type: 'AinSophAur' as const,
    rarity: 'Legendary' as const,
    finish: 'normal' as const,
    faceState: 'front' as const,
    side: 'ain' as const,
    cardClass: 'ain-soph-aur' as const,
    limitlessCharge: 0,
    attackCooldowns: { someAttack: 3 },
    boardSlot: i as 0 | 1 | 2 | 3,
  }));
  const backSlots = Array.from({ length: 4 }, (_, i) => {
    const def = i % 2 === 0 ? lightCards[i] : darkCards[i];
    return {
      instanceId: `back-${i}`,
      definitionId: def.definitionId,
      type: def.type,
      rarity: def.rarity,
      finish: 'normal' as const,
      side: 'ain' as const,
      faceState: 'front' as const,
      limitlessCharge: 0,
      attackCooldowns: { someAttack: 2 },
      backSlot: i as 0 | 1 | 2 | 3,
    };
  });
  return { frontSlots, backSlots };
}

describe('Shatter the Infinite Light', () => {
  it('is unavailable on the default empty board', () => {
    expect(canActivateShatterTheInfiniteLight(defaultGameState.board)).toBe(false);
  });

  it('requires all 4 front ASA slots and all 4 back slots flipped to active Ain', () => {
    const { frontSlots, backSlots } = buildFullShatterBoard();
    expect(canActivateShatterTheInfiniteLight({
      frontSlots: frontSlots as any,
      backSlots: backSlots as any,
      activeBoardEffects: [],
    })).toBe(true);

    // A single Soph-side back card breaks the condition.
    const backSlotsWithSoph = backSlots.map((slot, i) => (i === 0 ? { ...slot, side: 'soph' as const, faceState: 'back' as const } : slot));
    expect(canActivateShatterTheInfiniteLight({
      frontSlots: frontSlots as any,
      backSlots: backSlotsWithSoph as any,
      activeBoardEffects: [],
    })).toBe(false);
  });

  it('activates only when the board condition is met and no sequence is already running', () => {
    resetStore();
    const { frontSlots, backSlots } = buildFullShatterBoard();
    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'playing' },
      board: { frontSlots: frontSlots as any, backSlots: backSlots as any, activeBoardEffects: [] },
    }));

    useStore.getState().activateShatterTheInfiniteLight();
    expect(useStore.getState().turn.shatterInfiniteLight).toMatchObject({ phase: 'priming', stacks: 0 });

    // Board mutation while the sequence is active must be blocked.
    useStore.getState().flipSoph('back-0', 'sacrifice');
    expect(useStore.getState().board.backSlots[0]).not.toBeNull();
  });

  it('walks priming -> active -> result, preserves hand, restores deck zones, and resets the boss encounter', () => {
    resetStore();
    const { frontSlots, backSlots } = buildFullShatterBoard();
    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'playing', cardsPlayedThisTurn: 7, limitlessLightStacks: 12 },
      deck: { ...state.deck, hand: [{ instanceId: 'kept-hand', definitionId: lightCards[0].definitionId, finish: 'normal' }], discardPile: [{ instanceId: 'old-discard', definitionId: darkCards[0].definitionId, finish: 'normal' }], extraDeck: [] },
      board: { frontSlots: frontSlots as any, backSlots: backSlots as any, activeBoardEffects: [] },
      bossFight: {
        ...state.bossFight,
        mode: 'active',
        kind: 'normal',
        fightTimeRemaining: 4,
        bossCurrentHp: 999_999_999,
        damageDealtThisFight: 0,
        bossCardBreakCount: 0,
      },
    }));

    const before = Date.now();
    const drawPileBefore = useStore.getState().deck.drawPile.length;
    useStore.getState().activateShatterTheInfiniteLight();

    useStore.getState().tickShatterInfiniteLight(before + SHATTER_PRIME_MS + 1);
    expect(useStore.getState().turn.shatterInfiniteLight?.phase).toBe('active');

    useStore.getState().registerShatterInfinityStarHit();
    useStore.getState().registerShatterInfinityStarHit();
    useStore.getState().registerShatterInfinityStarHit();
    expect(useStore.getState().turn.shatterInfiniteLight?.stacks).toBe(3);

    useStore.getState().tickShatterInfiniteLight(before + SHATTER_PRIME_MS + SHATTER_ACTIVE_MS + 1);
    const resultState = useStore.getState().turn.shatterInfiniteLight;
    expect(resultState?.phase).toBe('result');
    expect(resultState?.payout).toBeGreaterThan(0);
    expect(useStore.getState().bossFight.bossCurrentHp).toBeLessThan(999_999_999);

    // Clicking after the window closes must not add more stacks.
    useStore.getState().registerShatterInfinityStarHit();
    expect(useStore.getState().turn.shatterInfiniteLight?.stacks).toBe(3);

    useStore.getState().tickShatterInfiniteLight(before + SHATTER_PRIME_MS + SHATTER_ACTIVE_MS + SHATTER_RESULT_MS + 1);
    const finalState = useStore.getState();
    expect(finalState.turn.shatterInfiniteLight).toBeNull();
    expect(finalState.turn.cardsPlayedThisTurn).toBe(0);
    expect(finalState.turn.limitlessLightStacks).toBe(0);
    for (const slot of [...finalState.board.frontSlots, ...finalState.board.backSlots]) {
      expect(slot).toBeNull();
    }
    expect(finalState.board.activeBoardEffects).toEqual([]);
    expect(finalState.deck.discardPile).toEqual([]);
    expect(finalState.deck.hand.map(card => card.instanceId)).toEqual(['kept-hand']);
    expect(finalState.deck.drawPile.length).toBe(drawPileBefore + 5);
    expect(finalState.deck.extraDeck).toHaveLength(4);
    expect(finalState.deck.extraDeck.map(card => card.definitionId).sort()).toEqual(frontSlots.map(card => card.definitionId).sort());
    expect(finalState.bossFight.fightTimeRemaining).toBeGreaterThan(4);
    expect(finalState.bossFight.bossCardBreakCount).toBe(1);
  });

  it('awards Shatter stacks only for completed circular cursor revolutions', () => {
    resetStore();
    const { frontSlots, backSlots } = buildFullShatterBoard();
    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'playing' },
      board: { frontSlots: frontSlots as any, backSlots: backSlots as any, activeBoardEffects: [] },
    }));
    const before = Date.now();
    useStore.getState().activateShatterTheInfiniteLight();
    useStore.getState().tickShatterInfiniteLight(before + SHATTER_PRIME_MS + 1);

    for (let sample = 0; sample < 40; sample += 1) {
      useStore.getState().registerShatterInfinityPointer(0.72, sample % 2 === 0 ? 0.28 : 0.72);
    }
    expect(useStore.getState().turn.shatterInfiniteLight?.stacks).toBe(0);

    for (let sample = 0; sample <= 34; sample += 1) {
      const angle = sample * (Math.PI * 2 / 32);
      useStore.getState().registerShatterInfinityPointer(0.5 + Math.cos(angle) * 0.24, 0.5 + Math.sin(angle) * 0.24);
    }
    expect(useStore.getState().turn.shatterInfiniteLight?.stacks).toBeGreaterThan(0);
  });
});
