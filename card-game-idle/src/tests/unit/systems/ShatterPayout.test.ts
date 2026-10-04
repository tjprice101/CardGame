import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { defaultGameState, useStore } from '@/state/store';
import { getShatterBasePayout, getShatterOrbitMultiplier } from '@/systems/cards/ShatterTheInfiniteLight';
import { computeGlobalResonanceScore, getCollectionPowerMultiplier } from '@/systems/progression/cardMastery';
import type { BoardState, GameState } from '@/types/game';
import { intensityEternalCards } from '@/data/cards/intensityCards';

function fullBoard(): GameState {
  const state = structuredClone(defaultGameState);
  state.turn.phase = 'playing';
  state.turn.limitlessLightStacks = 100;
  for (const index of [0, 1, 2, 3] as const) {
    state.board.frontSlots[index] = {
      instanceId: `front-${index}`, definitionId: 'tx-angel-starbound-null-archangel', type: 'AinSophAur',
      rarity: 'Transcendent', finish: 'holo', side: 'ain', faceState: 'front', limitlessCharge: 0,
      attackCooldowns: {}, boardSlot: index,
    };
    state.board.backSlots[index] = {
      instanceId: `back-${index}`, definitionId: 'tx-neutral-starbound-glimmer', type: 'Light',
      rarity: 'Transcendent', finish: 'holo', side: 'ain', faceState: 'front', limitlessCharge: 0,
      attackCooldowns: {}, backSlot: index,
    };
  }
  state.progress.collection = {
    'tx-neutral-starbound-glimmer': 4, 'tx-angel-starbound-null-archangel': 4,
  };
  state.progress.cardPlayCounts = {
    'tx-neutral-starbound-glimmer': 1_000_000, 'tx-angel-starbound-null-archangel': 1_000_000,
  };
  return state;
}
beforeEach(() => useStore.setState(fullBoard()));

describe('Shatter board-derived payout', () => {
  it('sums every current Soph and Bridge, including their printed Collection Power scaling', () => {
    const state = useStore.getState();
    const power = computeGlobalResonanceScore(state.progress);
    expect(power).toBeGreaterThan(0);
    expect(getShatterBasePayout(state.board, state.turn, state.progress)).toBe(
      4 * (21_000 + power * 21) + 4 * (30_000 + power * 30),
    );
  });

  it.each([0, 0.5, 3])('pays the snapshotted board total × (1 + %s orbit) with Collection Power applied exactly once', orbit => {
    const before = useStore.getState();
    const base = getShatterBasePayout(before.board, before.turn, before.progress);
    const multiplier = getCollectionPowerMultiplier(computeGlobalResonanceScore(before.progress));
    useStore.getState().activateShatterTheInfiniteLight();
    const priming = useStore.getState().turn.shatterInfiniteLight!;
    expect(priming.basePayout).toBe(base);
    useStore.getState().tickShatterInfiniteLight(priming.phaseEndsAt);
    useStore.setState(state => {
      state.turn.shatterInfiniteLight!.orbitPower = orbit;
      state.turn.shatterInfiniteLight!.stacks = 99;
      state.turn.limitlessLightStacks = 0;
    });
    const active = useStore.getState().turn.shatterInfiniteLight!;
    useStore.getState().tickShatterInfiniteLight(active.phaseEndsAt);
    const expected = Math.round(Math.floor(Math.round(base * (1 + orbit)) * multiplier) * 1.04);
    expect(useStore.getState().turn.shatterInfiniteLight!.payout).toBe(expected);
    expect(useStore.getState().turn.divineLightEarnedThisTurn).toBe(expected);
    useStore.getState().tickShatterInfiniteLight(active.phaseEndsAt);
    expect(useStore.getState().turn.divineLightEarnedThisTurn).toBe(expected);
  });

  it('snapshots before spending, ignores individual cooldowns, excludes Dark utilities, and leaves resources unchanged', () => {
    useStore.setState(state => {
      state.board.backSlots[0] = { ...state.board.backSlots[0]!, definitionId: 'tx-neutral-null-catalyst', type: 'Dark' };
      state.board.backSlots[1]!.attackCooldowns = { attack: 20 };
    });
    const before = useStore.getState();
    const expected = getShatterBasePayout(before.board, before.turn, before.progress);
    useStore.getState().activateShatterTheInfiniteLight();
    expect(useStore.getState().turn.shatterInfiniteLight!.basePayout).toBe(expected);
    expect(useStore.getState().turn.limitlessLightStacks).toBe(before.turn.limitlessLightStacks);
    expect(useStore.getState().board).toEqual(before.board);
  });

  it('uses the same current payout as real Soph and Bridge actions', () => {
    const initial = fullBoard();
    const base = getShatterBasePayout(initial.board, initial.turn, initial.progress);
    useStore.getState().activateLightSophAttack('back-0');
    const soph = useStore.getState().turn.attackSequence!.basePayout;
    useStore.setState(initial);
    useStore.getState().activateAsaBridge('front-0');
    const bridge = useStore.getState().turn.attackSequence!.basePayout;
    expect(base).toBe(4 * soph + 4 * bridge);
  });

  it('includes the current Intensity tempered Soph bonus without consuming it', () => {
    const card = intensityEternalCards.find(entry => entry.type === 'Light');
    if (!card || card.type !== 'Light') throw new Error('Expected an Intensity Eternal Light fixture');
    useStore.setState(state => {
      state.board.backSlots[0] = { ...state.board.backSlots[0]!, definitionId: card.definitionId, rarity: card.rarity };
      state.turn.intensityAttackBonus = 777;
      state.turn.limitlessInfernoStacks = 1_000;
    });
    const before = useStore.getState();
    const base = getShatterBasePayout(before.board, before.turn, before.progress);
    useStore.getState().activateShatterTheInfiniteLight();
    expect(useStore.getState().turn.shatterInfiniteLight!.basePayout).toBe(base);
    expect(useStore.getState().turn.intensityAttackBonus).toBe(777);
    const definition = CardRegistry.get(card.definitionId);
    expect(definition?.type).toBe('Light');
    useStore.setState(before);
    useStore.setState(state => { state.turn.shatterInfiniteLight = null; });
    useStore.getState().activateLightSophAttack('back-0', 1_000);
    const soph = useStore.getState().turn.attackSequence!.basePayout;
    const remaining: BoardState = { ...before.board, backSlots: [...before.board.backSlots] };
    remaining.backSlots[0] = null;
    expect(base).toBe(soph + getShatterBasePayout(remaining, before.turn, before.progress));
  });

  it('upgrades an old active save to the board-based formula and preserves existing snapshots on reload', () => {
    useStore.getState().activateShatterTheInfiniteLight();
    const state = fullBoard();
    state.turn.shatterInfiniteLight = structuredClone(useStore.getState().turn.shatterInfiniteLight);
    const base = state.turn.shatterInfiniteLight!.basePayout;
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    try {
      Reflect.deleteProperty(state.turn.shatterInfiniteLight!, 'basePayout');
      useStore.getState().loadState(state);
      expect(info).toHaveBeenCalledWith('[SaveManager] Upgrading legacy Shatter payout from the saved board.');
      expect(useStore.getState().turn.shatterInfiniteLight!.basePayout).toBe(base);
      const reload = fullBoard();
      reload.turn.shatterInfiniteLight = { ...useStore.getState().turn.shatterInfiniteLight!, basePayout: 123_456 };
      useStore.getState().loadState(reload);
      expect(useStore.getState().turn.shatterInfiniteLight!.basePayout).toBe(123_456);
    } finally {
      info.mockRestore();
    }
  });

  it('never reduces the base total for zero or negative orbit power', () => {
    expect(getShatterOrbitMultiplier()).toBe(1);
    expect(getShatterOrbitMultiplier(-5)).toBe(1);
  });
});
