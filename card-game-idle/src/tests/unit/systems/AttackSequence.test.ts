import { describe, expect, it } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
import { lightCards } from '@/data/cards/lightCards';
import type { GameState } from '@/types/game';
import {
  getAttackSequenceDuration,
  getAttackSequenceMultiplier,
  getAttackSequenceStarCount,
  getAttackSequenceStars,
} from '@/systems/cards/AttackSequence';

describe('attack orbit sequences', () => {
  it('uses the authored duration and multiplier tables', () => {
    expect(getAttackSequenceDuration('ain')).toBe(2_000);
    expect(getAttackSequenceDuration('soph')).toBe(3_000);
    expect(getAttackSequenceDuration('bridge')).toBe(3_000);
    expect([0, 1, 2, 3].map(hits => getAttackSequenceMultiplier('ain', hits))).toEqual([1, 2, 3, 4]);
    expect([0, 1, 2, 3, 4, 5].map(hits => getAttackSequenceMultiplier('soph', hits))).toEqual([1, 1.5, 2.5, 3.5, 4.5, 5.5]);
  });

  it('keeps positions stable per definition and distinct across cards and modes', () => {
    const lumenAin = getAttackSequenceStars('light-neutrality-1', 'ain');
    expect(getAttackSequenceStars('light-neutrality-1', 'ain')).toEqual(lumenAin);
    expect(getAttackSequenceStars('light-neutrality-2', 'ain')).not.toEqual(lumenAin);
    expect(getAttackSequenceStars('light-neutrality-1', 'soph')).not.toEqual(lumenAin);
    expect(lumenAin).toHaveLength(3);
    expect(getAttackSequenceStars('light-neutrality-1', 'soph')).toHaveLength(5);
  });

  it('uses a stable card-specific Bridge constellation of three to five stars', () => {
    const whiteNull = getAttackSequenceStars('ain-soph-aur-neutrality-1', 'bridge');
    expect(whiteNull).toHaveLength(getAttackSequenceStarCount('bridge', 'ain-soph-aur-neutrality-1'));
    expect(whiteNull.length).toBeGreaterThanOrEqual(3);
    expect(whiteNull.length).toBeLessThanOrEqual(5);
    expect(getAttackSequenceStars('ain-soph-aur-neutrality-2', 'bridge')).not.toEqual(whiteNull);
  });

  it('delays Ain payout until the sequence resolves and applies star hits once', () => {
    const base = structuredClone(defaultGameState) as GameState;
    const definition = lightCards[0];
    const instanceId = 'attack-sequence-light';
    base.turn.phase = 'playing';
    base.board.backSlots[0] = {
      instanceId, definitionId: definition.definitionId, type: 'Light', rarity: definition.rarity,
      finish: 'normal', side: 'ain', faceState: 'front', limitlessCharge: 0, attackCooldowns: {}, backSlot: 0,
    };
    useStore.setState(state => ({ ...state, ...base }));
    const before = useStore.getState().turn.divineLightEarnedThisTurn;

    useStore.getState().activateLightAinAttack(instanceId);
    const priming = useStore.getState().turn.attackSequence!;
    expect(useStore.getState().turn.divineLightEarnedThisTurn).toBe(before);
    useStore.getState().tickAttackSequence(priming.phaseEndsAt + 1);
    useStore.getState().registerAttackSequenceStarHit(0);
    useStore.getState().registerAttackSequenceStarHit(1);
    expect(useStore.getState().turn.attackSequence?.phase).toBe('active');
    useStore.getState().registerAttackSequenceStarHit(2);

    const result = useStore.getState().turn.attackSequence!;
    expect(result.phase).toBe('result');
    expect(result.multiplier).toBe(4);
    expect(result.payout).toBe(result.basePayout * 4);
    expect(useStore.getState().turn.divineLightEarnedThisTurn - before).toBe(result.payout);
    expect(useStore.getState().board.backSlots[0]?.attackCooldowns[definition.ainAttack.id]).toBe(definition.ainAttack.cooldownCards);
  });

  it('pauses wall-clock ability cooldowns and buffs for the full attack sequence', () => {
    const base = structuredClone(defaultGameState) as GameState;
    const definition = lightCards[0];
    const instanceId = 'attack-sequence-timer-pause';
    base.turn.phase = 'playing';
    base.board.backSlots[0] = {
      instanceId, definitionId: definition.definitionId, type: 'Light', rarity: definition.rarity,
      finish: 'normal', side: 'ain', faceState: 'front', limitlessCharge: 0, attackCooldowns: {}, backSlot: 0,
    };
    useStore.setState(state => ({ ...state, ...base }));

    useStore.getState().activateLightAinAttack(instanceId);
    const priming = useStore.getState().turn.attackSequence!;
    const originalDeadline = priming.pauseStartedAt + 60_000;
    useStore.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        abilityCooldownUntil: { test: originalDeadline },
        divineFieldUntil: originalDeadline,
        whiteoutDomainUntil: originalDeadline,
      },
    }));

    useStore.getState().tickAttackSequence(priming.phaseEndsAt + 1);
    const active = useStore.getState().turn.attackSequence!;
    useStore.getState().tickAttackSequence(active.phaseEndsAt + 1);
    const result = useStore.getState().turn.attackSequence!;
    const resumedAt = result.phaseEndsAt + 1;
    useStore.getState().tickAttackSequence(resumedAt);

    const pausedFor = resumedAt - priming.pauseStartedAt;
    expect(useStore.getState().turn.abilityCooldownUntil?.test).toBe(originalDeadline + pausedFor);
    expect(useStore.getState().turn.divineFieldUntil).toBe(originalDeadline + pausedFor);
    expect(useStore.getState().turn.whiteoutDomainUntil).toBe(originalDeadline + pausedFor);
  });

  it('tracks cursor orbit power without a hard cap', () => {
    const base = structuredClone(defaultGameState) as GameState;
    const definition = lightCards[0];
    const instanceId = 'attack-sequence-orbit-light';
    base.turn.phase = 'playing';
    base.board.backSlots[0] = {
      instanceId, definitionId: definition.definitionId, type: 'Light', rarity: definition.rarity,
      finish: 'normal', side: 'ain', faceState: 'front', limitlessCharge: 0, attackCooldowns: {}, backSlot: 0,
    };
    useStore.setState(state => ({ ...state, ...base }));

    useStore.getState().activateLightAinAttack(instanceId);
    const priming = useStore.getState().turn.attackSequence!;
    useStore.getState().tickAttackSequence(priming.phaseEndsAt + 1);
    for (let sample = 0; sample < 120; sample += 1) {
      const angle = sample * 0.55;
      useStore.getState().registerAttackSequencePointer(
        0.5 + Math.cos(angle) * 0.24,
        0.5 + Math.sin(angle) * 0.24,
        priming.phaseEndsAt + 1 + sample * 12,
      );
    }

    const sequence = useStore.getState().turn.attackSequence!;
    expect(sequence.orbitScore).toBeGreaterThan(2.5);
    expect(getAttackSequenceMultiplier('ain', 0, sequence.orbitScore)).toBeGreaterThan(3.5);
  });

  it('does not reward non-circular pointer movement', () => {
    const base = structuredClone(defaultGameState) as GameState;
    const definition = lightCards[0];
    const instanceId = 'attack-sequence-linear-light';
    base.turn.phase = 'playing';
    base.board.backSlots[0] = {
      instanceId, definitionId: definition.definitionId, type: 'Light', rarity: definition.rarity,
      finish: 'normal', side: 'ain', faceState: 'front', limitlessCharge: 0, attackCooldowns: {}, backSlot: 0,
    };
    useStore.setState(state => ({ ...state, ...base }));

    useStore.getState().activateLightAinAttack(instanceId);
    const priming = useStore.getState().turn.attackSequence!;
    useStore.getState().tickAttackSequence(priming.phaseEndsAt + 1);
    for (let sample = 0; sample < 80; sample += 1) {
      const x = 0.2 + (sample % 20) * 0.03;
      useStore.getState().registerAttackSequencePointer(x, 0.5, priming.phaseEndsAt + 1 + sample * 12);
    }

    expect(useStore.getState().turn.attackSequence?.orbitScore ?? 0).toBe(0);
  });

  it('does not reward vertical back-and-forth movement', () => {
    const base = structuredClone(defaultGameState) as GameState;
    const definition = lightCards[0];
    const instanceId = 'attack-sequence-vertical-light';
    base.turn.phase = 'playing';
    base.board.backSlots[0] = {
      instanceId, definitionId: definition.definitionId, type: 'Light', rarity: definition.rarity,
      finish: 'normal', side: 'ain', faceState: 'front', limitlessCharge: 0, attackCooldowns: {}, backSlot: 0,
    };
    useStore.setState(state => ({ ...state, ...base }));

    useStore.getState().activateLightAinAttack(instanceId);
    const priming = useStore.getState().turn.attackSequence!;
    useStore.getState().tickAttackSequence(priming.phaseEndsAt + 1);
    for (let sample = 0; sample < 80; sample += 1) {
      useStore.getState().registerAttackSequencePointer(0.72, sample % 2 === 0 ? 0.28 : 0.72, priming.phaseEndsAt + 1 + sample * 12);
    }

    expect(useStore.getState().turn.attackSequence?.orbitScore ?? 0).toBe(0);
  });
});