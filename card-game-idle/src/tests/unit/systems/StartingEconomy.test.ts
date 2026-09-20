import { describe, expect, it } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
import type { GameState, ProgressState } from '@/types/game';
import { ABILITY_DEFINITIONS, getAbilityMaterialCost } from '@/data/abilities/abilityDefinitions';
import { lightCards } from '@/data/cards/lightCards';

const currencyFields = [
  'divineLight',
  'lifetimeDivineLight',
  'bestSingleTurnDivineLight',
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
    expect(defaultGameState.progress.divineLight).toBe(5_000);
    expect(defaultGameState.progress.lifetimeDivineLight).toBe(5_000);
    for (const field of currencyFields) {
      if (field === 'divineLight' || field === 'lifetimeDivineLight') continue;
      expect(defaultGameState.progress[field], field).toBe(0);
    }
  });

  it('resets wiped saves back to starter grant Divine Light and zero for other currencies', () => {
    resetStore();
    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        divineLight: 100,
        lifetimeDivineLight: 200,
        bestSingleTurnDivineLight: 300,
        aberratedShards: 400,
        cardbaneLight: 500,
        fractureShards: 600,
        entropicEnergyBalance: 700,
        entropyBalance: 800,
      },
    }));

    useStore.getState().resetToDefault();

    expect(useStore.getState().progress.divineLight).toBe(5_000);
    expect(useStore.getState().progress.lifetimeDivineLight).toBe(5_000);
    for (const field of currencyFields) {
      if (field === 'divineLight' || field === 'lifetimeDivineLight') continue;
      expect(useStore.getState().progress[field], field).toBe(0);
    }
  });

  it('scales direct Divine Light grants from Collection Power', () => {
    resetStore();
    const definitionId = lightCards[0].definitionId;
    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        cardPlayCounts: { [definitionId]: 250 },
        divineLight: 0,
        lifetimeDivineLight: 0,
      },
    }));

    useStore.getState().addDivineLight(100);

    expect(useStore.getState().progress.divineLight).toBe(104);
    expect(useStore.getState().progress.lifetimeDivineLight).toBe(104);
  });

  it('scales persistent Divine Light rewards from Collection Power', () => {
    resetStore();
    const definitionId = lightCards[0].definitionId;
    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        cardPlayCounts: { [definitionId]: 250 },
        divineLight: 0,
        lifetimeDivineLight: 0,
        quests: {
          ...state.progress.quests,
          daily: [{
            id: 'daily-persistent-scale', templateId: 'daily-persistent-scale', text: 'Test reward', kind: 'play_cards',
            goal: 1, progress: 1, shardReward: 0, divineLightReward: 100, claimed: false,
          }],
        },
      },
    }));

    expect(useStore.getState().claimQuest('daily-persistent-scale')?.divineLight).toBe(104);
    expect(useStore.getState().progress.divineLight).toBe(104);
    expect(useStore.getState().progress.lifetimeDivineLight).toBe(104);
  });

  it('materializes each ability once for its exact Garden material cost', () => {
    resetStore();
    const ability = ABILITY_DEFINITIONS[0];
    const materialCost = getAbilityMaterialCost(ability);
    useStore.setState(state => ({
      ...state,
      progress: { ...state.progress, divineLight: 250, ...materialCost },
    }));

    expect(useStore.getState().purchaseAbility(ability.id)).toBe(true);
    expect(useStore.getState().progress.divineLight).toBe(250);
    for (const currency of Object.keys(materialCost)) {
      expect(useStore.getState().progress[currency as keyof ProgressState]).toBe(0);
    }
    expect(useStore.getState().progress.ownedAbilities?.[ability.id]).toBe(true);
    expect(useStore.getState().purchaseAbility(ability.id)).toBe(false);
    expect(useStore.getState().progress.divineLight).toBe(250);
  });

  it('rejects ability materialization when Garden materials are insufficient', () => {
    resetStore();
    const ability = ABILITY_DEFINITIONS[0];
    expect(useStore.getState().purchaseAbility(ability.id)).toBe(false);
    expect(useStore.getState().progress.ownedAbilities?.[ability.id]).toBeUndefined();
  });
});
