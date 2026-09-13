import { afterEach, describe, expect, it, vi } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { ainSophAurCards } from '@/data/cards/ainSophAurCards';
import { darkCards } from '@/data/cards/darkCards';
import { lightCards } from '@/data/cards/lightCards';
import { NEUTRALITY_PACK_POOL, PACK_DEFINITIONS } from '@/data/packs/packDefinitions';
import { defaultGameState, useStore } from '@/state/store';
import type { GameState } from '@/types/game';

function resetStore(): void {
  const baseState = JSON.parse(JSON.stringify(defaultGameState)) as GameState;
  useStore.setState(state => ({ ...state, ...baseState }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Neutrality pack opening flow', () => {
  it('builds the loot pool from every live base Neutrality card', () => {
    const expectedIds = [...lightCards, ...darkCards, ...ainSophAurCards].map(card => card.definitionId);

    expect(NEUTRALITY_PACK_POOL).toHaveLength(52);
    expect(new Set(NEUTRALITY_PACK_POOL)).toEqual(new Set(expectedIds));
    expect(NEUTRALITY_PACK_POOL.every(definitionId => CardRegistry.get(definitionId) !== undefined)).toBe(true);
  });

  it('awards five cards and updates collection when buying a Neutrality pack', () => {
    resetStore();
    const pack = PACK_DEFINITIONS.find(definition => definition.id === 'pack-neutrality')!;
    useStore.setState(state => ({
      ...state,
      progress: { ...state.progress, oblivion: 1_000_000 },
    }));
    const collectionBefore = { ...useStore.getState().progress.collection };
    const currencyBefore = useStore.getState().progress.oblivion;
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const rewards = useStore.getState().openPack(pack.id);

    expect(rewards).not.toBeNull();
    expect(rewards).toHaveLength(pack.cardsPerOpen);
    expect(new Set(rewards)).toHaveLength(pack.cardsPerOpen);
    expect(rewards!.every(definitionId => NEUTRALITY_PACK_POOL.includes(definitionId))).toBe(true);
    for (const definitionId of rewards!) {
      expect(useStore.getState().progress.collection[definitionId]).toBe((collectionBefore[definitionId] ?? 0) + 1);
    }
    expect(useStore.getState().progress.oblivion).toBeLessThan(currencyBefore);
  });

  it('guarantees a holofoil in Boxes and Cases when no individual roll succeeds', () => {
    resetStore();
    useStore.setState(state => ({
      ...state,
      progress: { ...state.progress, oblivion: 100_000_000 },
    }));
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const beforeBox = Object.values(useStore.getState().progress.holoCollection).reduce((sum, count) => sum + count, 0);
    expect(useStore.getState().openBox('pack-neutrality')).not.toBeNull();
    const afterBox = Object.values(useStore.getState().progress.holoCollection).reduce((sum, count) => sum + count, 0);
    expect(afterBox).toBeGreaterThan(beforeBox);

    const beforeCase = afterBox;
    expect(useStore.getState().openCase('pack-neutrality')).not.toBeNull();
    const afterCase = Object.values(useStore.getState().progress.holoCollection).reduce((sum, count) => sum + count, 0);
    expect(afterCase).toBeGreaterThan(beforeCase);
  });
});
