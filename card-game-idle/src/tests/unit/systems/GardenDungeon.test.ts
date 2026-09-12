import { describe, expect, it, vi } from 'vitest';
import { GARDEN_DUNGEONS } from '@/data/dungeons/gardenDungeonDefinitions';
import { INFINITE_RECIPES } from '@/data/cards/infiniteCards';
import { defaultGameState, useStore } from '@/state/store';
import type { GameState } from '@/types/game';
import { getLinearEncounterHp } from '@/systems/dungeons/dungeonDifficulty';

function resetStore(): void {
  const baseState = JSON.parse(JSON.stringify(defaultGameState)) as GameState;
  useStore.setState(state => ({ ...state, ...baseState }));
}

describe('Garden of Cards dungeon runtime', () => {
  it('produces a monotonic linear encounter curve', () => {
    const values = [0, 1, 2].map(index => getLinearEncounterHp(0, index, 3, 10_000, 5_000));
    expect(values).toEqual([10_000, 15_000, 20_000]);
    expect(getLinearEncounterHp(1, 1, 3, 10_000, 5_000)).toBe(20_000);
  });

  it('completes Valley of Null encounters repeatedly and grants configured drops', () => {
    resetStore();
    const dungeon = GARDEN_DUNGEONS[0];
    vi.spyOn(Math, 'random').mockReturnValue(0);

    expect(useStore.getState().startGardenDungeon(dungeon.id)).toBe(true);
    for (let index = 0; index < dungeon.encounters.length; index += 1) {
      useStore.setState(state => ({
        ...state,
        gardenDungeon: { ...state.gardenDungeon, encounterHp: 0 },
      }));
      expect(useStore.getState().resolveGardenEncounter()).toBe(true);
    }
    const firstRun = useStore.getState();
    expect(firstRun.gardenDungeon.phase).toBe('complete');
    expect(firstRun.progress.nullifiedLattice).toBe(1);
    expect(firstRun.progress.nullSearedLight).toBe(1);
    expect(firstRun.progress.nullifiedOblivionMatter).toBe(1);
    expect(firstRun.gardenDungeon.runCount).toBe(1);

    expect(useStore.getState().startGardenDungeon(dungeon.id)).toBe(true);
    expect(useStore.getState().gardenDungeon.runCount).toBe(2);
    vi.restoreAllMocks();
  });

  it('auto-fails after five minutes without removing previously earned materials', () => {
    resetStore();
    const dungeon = GARDEN_DUNGEONS[0];
    useStore.setState(state => ({
      ...state,
      progress: { ...state.progress, nullifiedLattice: 2 },
    }));
    expect(useStore.getState().startGardenDungeon(dungeon.id)).toBe(true);
    useStore.getState().tickGardenDungeonTimer(299);
    expect(useStore.getState().gardenDungeon.phase).toBe('active');
    useStore.getState().tickGardenDungeonTimer(1);
    expect(useStore.getState().gardenDungeon.phase).toBe('idle');
    expect(useStore.getState().progress.nullifiedLattice).toBe(2);
  });

  it('consumes one Eternal card and all material currencies atomically when crafting', () => {
    resetStore();
    const recipe = INFINITE_RECIPES[0];
    const eternal = recipe.ingredients.find(ingredient => ingredient.definitionId)!;
    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        collection: { ...state.progress.collection, [eternal.definitionId!]: 1 },
        nullifiedLattice: 24,
        nullSearedLight: 12,
        nullifiedOblivionMatter: 3,
      },
    }));

    expect(useStore.getState().combineForInfinite(recipe)).toBe(true);
    const state = useStore.getState();
    expect(state.progress.collection[eternal.definitionId!]).toBe(0);
    expect(state.progress.nullifiedLattice).toBe(0);
    expect(state.progress.nullSearedLight).toBe(0);
    expect(state.progress.nullifiedOblivionMatter).toBe(0);
    expect(state.progress.infiniteCollection[recipe.resultId]).toBe(1);
  });
});
