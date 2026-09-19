import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { defaultGameState, useStore } from '@/state/store';
import {
  applyMasteryReward,
  computeGlobalResonanceScore,
  getCollectionPowerMultiplier,
  getMaximumCollectionPowerMultiplier,
  getMaximumResonanceScore,
  previewMasteryReward,
  RESONANCE_PER_COLLECTION_POWER_HUNDREDTH,
} from '@/systems/progression/cardMastery';
import type { ProgressState } from '@/types/game';

function progressWithCount(definitionId: string, count: number): ProgressState {
  const progress = structuredClone(defaultGameState.progress);
  progress.cardPlayCounts = { [definitionId]: count };
  return progress;
}

describe('Card mastery Resonance and Collection Power', () => {
  const definitionId = 'light-neutrality-1';

  it('recalculates Resonance after the same count record crosses a tier', () => {
    const progress = progressWithCount(definitionId, 8);
    expect(computeGlobalResonanceScore(progress)).toBe(0);

    progress.cardPlayCounts[definitionId] = 9;
    expect(computeGlobalResonanceScore(progress)).toBe(1);
  });

  it('uses 10 Resonance for each visible +0.01 Collection Power', () => {
    expect(RESONANCE_PER_COLLECTION_POWER_HUNDREDTH).toBe(10);
    expect(getCollectionPowerMultiplier(0)).toBe(1);
    expect(getCollectionPowerMultiplier(10)).toBe(1.01);
    expect(getCollectionPowerMultiplier(1_000)).toBe(2);
    expect(getCollectionPowerMultiplier(3_000)).toBe(4);
  });

  it('derives its maximum from every registered card', () => {
    const expectedMaximumResonance = CardRegistry.getAll().length * 320;
    expect(getMaximumResonanceScore()).toBe(expectedMaximumResonance);
    expect(getMaximumCollectionPowerMultiplier()).toBe(1 + expectedMaximumResonance / 1_000);
    expect(getCollectionPowerMultiplier(Number.MAX_SAFE_INTEGER)).toBe(getMaximumCollectionPowerMultiplier());
  });

  it('keeps the store display multiplier on the canonical scaling formula', () => {
    const progress = progressWithCount(definitionId, 525);
    useStore.setState(state => ({ ...state, progress }));
    useStore.getState().refreshComputedStats();

    expect(computeGlobalResonanceScore(progress)).toBe(20);
    expect(useStore.getState().computedStats.globalDivineLightMult).toBeCloseTo(0.02);
  });

  it('reports Resonance only when awarded Card-light crosses a tier', () => {
    const belowTier = progressWithCount(definitionId, 1);
    const noTierPreview = previewMasteryReward(belowTier, [{ definitionId }], [], 3);
    expect(noTierPreview.entries[0]?.appliedProgress).toBe(3);
    expect(noTierPreview.resonanceGain).toBe(0);
    expect(noTierPreview.cardsTieredUp).toBe(0);

    const crossingTier = progressWithCount(definitionId, 8);
    const tierPreview = applyMasteryReward(crossingTier, [{ definitionId }], [], 3);
    expect(tierPreview.resonanceGain).toBe(1);
    expect(tierPreview.cardsTieredUp).toBe(1);
    expect(computeGlobalResonanceScore(crossingTier)).toBe(1);
  });
});