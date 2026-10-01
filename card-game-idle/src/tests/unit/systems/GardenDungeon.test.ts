import { describe, expect, it } from 'vitest';
import { ABILITY_REGISTRY, getAbilityMaterialCost } from '@/data/abilities/abilityDefinitions';
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

  it('resets the deck and returns summoned ASAs to the Extra Deck between encounters', () => {
    resetStore();
    const dungeon = GARDEN_DUNGEONS[0];
    expect(useStore.getState().startGardenDungeon(dungeon.id)).toBe(true);
    const before = useStore.getState().deck;
    const extraBefore = before.extraDeck.map(entry => entry.definitionId).sort();
    const mainCount = before.deckList.reduce((sum, entry) => sum + entry.copies, 0);
    expect(extraBefore.length).toBeGreaterThan(0);

    // Simulate a summoned ASA on the front row plus a played back-row card.
    const [summoned, ...restExtra] = before.extraDeck;
    const backCard = before.drawPile[0];
    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'playing' },
      deck: { ...state.deck, extraDeck: restExtra, drawPile: state.deck.drawPile.slice(1) },
      board: {
        ...state.board,
        frontSlots: [{
          instanceId: 'asa-garden', definitionId: summoned.definitionId, type: 'AinSophAur', rarity: 'Legendary',
          finish: summoned.finish, faceState: 'front', side: 'ain', cardClass: 'ain-soph-aur', limitlessCharge: 0, attackCooldowns: {}, boardSlot: 0,
        } as any, null, null, null],
        backSlots: [{ ...backCard, type: 'Light', rarity: 'Common', side: 'soph', faceState: 'back', limitlessCharge: 0, attackCooldowns: {}, backSlot: 0 } as any, null, null, null],
      },
      gardenDungeon: { ...state.gardenDungeon, encounterHp: 0 },
    }));

    expect(useStore.getState().resolveGardenEncounter()).toBe(true);
    expect(useStore.getState().continueGardenDungeon()).toBe(true);

    const after = useStore.getState();
    expect(after.deck.extraDeck.map(entry => entry.definitionId).sort()).toEqual(extraBefore);
    expect(after.board.frontSlots.every(slot => slot === null)).toBe(true);
    expect(after.board.backSlots.every(slot => slot === null)).toBe(true);
    expect(after.deck.discardPile).toHaveLength(0);
    expect(after.deck.hand.length + after.deck.drawPile.length).toBe(mainCount);
  });

  it('grants three current and one next material per encounter, then four on the final encounter', () => {
    resetStore();
    const dungeon = GARDEN_DUNGEONS[0];

    expect(useStore.getState().startGardenDungeon(dungeon.id)).toBe(true);
    for (let index = 0; index < dungeon.encounters.length; index += 1) {
      useStore.setState(state => ({
        ...state,
        gardenDungeon: { ...state.gardenDungeon, encounterHp: 0 },
      }));
      expect(useStore.getState().resolveGardenEncounter()).toBe(true);
      expect(useStore.getState().gardenDungeon.phase).toBe('victory');
      if (index < dungeon.encounters.length - 1) {
        expect(useStore.getState().gardenDungeon.lastRewards).toEqual({
          [dungeon.encounters[index].reward!.currency]: 3,
          [dungeon.encounters[index + 1].reward!.currency]: 1,
        });
      }
      expect(useStore.getState().continueGardenDungeon()).toBe(true);
      if (index < dungeon.encounters.length - 1) {
        expect(useStore.getState().gardenDungeon.phase).toBe('active');
        expect(useStore.getState().gardenDungeon.timeRemainingSeconds).toBe(300);
      }
    }
    const firstRun = useStore.getState();
    expect(firstRun.gardenDungeon.phase).toBe('complete');
    expect(firstRun.progress.nullifiedLattice).toBe(3);
    expect(firstRun.progress.nullSearedLight).toBe(4);
    expect(firstRun.progress.nullifiedOblivionMatter).toBe(5);
    expect(firstRun.gardenDungeon.lastRewards).toEqual({ nullifiedOblivionMatter: 4 });
    expect(firstRun.gardenDungeon.runCount).toBe(1);

    expect(useStore.getState().startGardenDungeon(dungeon.id)).toBe(true);
    expect(useStore.getState().gardenDungeon.runCount).toBe(2);
  });

  it('purchases abilities atomically with Garden materials and no Divine Light', () => {
    resetStore();
    const ability = ABILITY_REGISTRY.get('neutralizing-inferno')!;
    const materialCost = getAbilityMaterialCost(ability);
    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        divineLight: 123_456,
        nullifiedLattice: materialCost.nullifiedLattice ?? 0,
        nullSearedLight: materialCost.nullSearedLight ?? 0,
      },
    }));

    expect(useStore.getState().purchaseAbility(ability.id)).toBe(true);
    expect(useStore.getState().progress.divineLight).toBe(123_456);
    expect(useStore.getState().progress.nullifiedLattice).toBe(0);
    expect(useStore.getState().progress.nullSearedLight).toBe(0);
    expect(useStore.getState().progress.ownedAbilities?.[ability.id]).toBe(true);
  });

  it('triggers defeat phase after timeout without removing previously earned materials', () => {
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
    expect(useStore.getState().gardenDungeon.phase).toBe('defeat');
    expect(useStore.getState().progress.nullifiedLattice).toBe(2);
    useStore.getState().exitGardenDungeon();
    expect(useStore.getState().gardenDungeon.phase).toBe('idle');
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
