import { describe, expect, it } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
import type { GameState, ProgressState } from '@/types/game';
import { ABILITY_DEFINITIONS } from '@/data/abilities/abilityDefinitions';

const currencyFields = [
  'oblivion',
  'lifetimeOblivion',
  'bestSingleTurnOblivion',
  'aberratedShards',
  'cardbaneLight',
  'fractureShards',
  'entropicEnergyBalance',
  'entropyBalance',
] as const satisfies ReadonlyArray<keyof ProgressState>;

function resetStore(): void {
  const baseState = JSON.parse(JSON.stringify(defaultGameState)) as GameState;
  useStore.setState(state => ({ ...state, ...baseState }));
}

describe('starting economy', () => {
  it('starts new default saves with starter grant Divine Light and zero for other currencies', () => {
    expect(defaultGameState.progress.oblivion).toBe(5_000);
    expect(defaultGameState.progress.lifetimeOblivion).toBe(5_000);
    for (const field of currencyFields) {
      if (field === 'oblivion' || field === 'lifetimeOblivion') continue;
      expect(defaultGameState.progress[field], field).toBe(0);
    }
  });

  it('resets wiped saves back to starter grant Divine Light and zero for other currencies', () => {
    resetStore();
    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        oblivion: 100,
        lifetimeOblivion: 200,
        bestSingleTurnOblivion: 300,
        aberratedShards: 400,
        cardbaneLight: 500,
        fractureShards: 600,
        entropicEnergyBalance: 700,
        entropyBalance: 800,
      },
    }));

    useStore.getState().resetToDefault();

    expect(useStore.getState().progress.oblivion).toBe(5_000);
    expect(useStore.getState().progress.lifetimeOblivion).toBe(5_000);
    for (const field of currencyFields) {
      if (field === 'oblivion' || field === 'lifetimeOblivion') continue;
      expect(useStore.getState().progress[field], field).toBe(0);
    }
  });

  it('materializes each ability once for its exact Divine Light cost', () => {
    resetStore();
    const ability = ABILITY_DEFINITIONS[0];
    useStore.setState(state => ({
      ...state,
      progress: { ...state.progress, oblivion: ability.purchaseCost + 250 },
    }));

    expect(useStore.getState().purchaseAbility(ability.id)).toBe(true);
    expect(useStore.getState().progress.oblivion).toBe(250);
    expect(useStore.getState().progress.ownedAbilities?.[ability.id]).toBe(true);
    expect(useStore.getState().purchaseAbility(ability.id)).toBe(false);
    expect(useStore.getState().progress.oblivion).toBe(250);
  });

  it('rejects ability materialization when Divine Light is insufficient', () => {
    resetStore();
    const ability = ABILITY_DEFINITIONS[0];
    expect(useStore.getState().purchaseAbility(ability.id)).toBe(false);
    expect(useStore.getState().progress.ownedAbilities?.[ability.id]).toBeUndefined();
  });
});
