import { beforeEach, describe, expect, it } from 'vitest';
import { intensityBaseCards, intensityCards, intensityEternalCards, intensityInfiniteCards, paleventHerald } from '@/data/cards/intensityCards';
import { CardRegistry } from '@/cards/CardRegistry';
import { defaultGameState, useStore } from '@/state/store';
import { gainInferno, getInferno, resetInferno } from '@/systems/cards/IntensityRuntime';
import { CardEffectExecutor } from '@/systems/cards/CardEffectExecutor';
import { getCardRequirementEffects } from '@/systems/cards/PlayRequirements';
import { getCardSetId } from '@/data/elements';
import { INTENSITY_INFINITE_RECIPES } from '@/data/cards/infiniteCards';
import { PACK_DEFINITIONS } from '@/data/packs/packDefinitions';
import type { CardEffect } from '@/types/effects';
import type { GameState } from '@/types/game';

function fresh(): GameState {
  const state = structuredClone(defaultGameState);
  state.turn.phase = 'playing';
  state.turn.spectrumLevel = 5;
  return state;
}

function execute(effects: CardEffect[], state = fresh()) {
  return CardEffectExecutor.execute(
    { instanceId: 'source', definitionId: paleventHerald.definitionId },
    state.turn, state.board, state.deck, false,
    { effects, countAsPlay: false, removeFromHand: false },
  );
}

describe('Intensity runtime', () => {
  beforeEach(() => useStore.setState(fresh()));

  it('registers the entire original roster, without set leakage or duplicate effects', () => {
    expect(intensityCards).toHaveLength(29);
    expect(intensityBaseCards).toHaveLength(19);
    expect(intensityEternalCards).toHaveLength(5);
    expect(intensityInfiniteCards).toHaveLength(5);
    expect(new Set(intensityCards.map(card => card.definitionId)).size).toBe(29);
    expect(new Set(intensityCards.map(card => JSON.stringify(getCardRequirementEffects(card)))).size).toBe(29);
    for (const card of intensityCards) {
      expect(CardRegistry.get(card.definitionId)).toStrictEqual(card);
      expect(getCardSetId(card.definitionId)).toBe('Intensity');
      if (card.type === 'Light') {
        expect(card.sophAttack.stackResource).toBe(card.spectrumLevel! >= 3 ? 'inferno' : 'light');
      }
    }
  });

  it('amplifies only the next positive gain, tracks generation, and has no stack cap', () => {
    const turn = fresh().turn;
    turn.intensityNextGainMultiplier = 3;
    expect(gainInferno(turn, 0)).toBe(0);
    expect(turn.intensityNextGainMultiplier).toBe(3);
    expect(gainInferno(turn, 4)).toBe(12);
    expect(gainInferno(turn, 10_000)).toBe(10_000);
    expect(getInferno(turn)).toBe(10_012);
    expect(turn.intensityInfernoGainedThisTurn).toBe(10_012);
    resetInferno(turn);
    expect(getInferno(turn)).toBe(0);
    expect(turn.intensityNextGainMultiplier).toBe(1);
    expect(turn.intensityInfernoGainedThisTurn).toBe(0);
  });

  it('executes every new typed instruction deterministically on tentative state', () => {
    const state = fresh();
    state.turn.limitlessInfernoStacks = 10;
    state.turn.intensityInfernoSpentThisTurn = 4;
    const def = paleventHerald;
    state.board.backSlots[0] = {
      instanceId: 'support', definitionId: def.definitionId, type: 'Light', rarity: 'Common',
      finish: 'normal', side: 'soph', faceState: 'back', limitlessCharge: 1, attackCooldowns: {}, backSlot: 0,
    };
    state.deck.hand = [{ instanceId: 'held', definitionId: def.definitionId, finish: 'normal' }];
    state.deck.drawPile = [{ instanceId: 'replacement', definitionId: def.definitionId, finish: 'normal' }];
    state.deck.discardPile = [{ instanceId: 'oldest', definitionId: def.definitionId, finish: 'normal' }];
    const result = execute([
      { type: 'inferno_gain', value: 2 },
      { type: 'inferno_board_kindle', side: 'soph', perCard: 1 },
      { type: 'inferno_embers', value: 2 },
      { type: 'inferno_charge_forge', charge: 2, perCharged: 1 },
      { type: 'inferno_ash_cycle', count: 1, perCard: 2 },
      { type: 'inferno_recall', count: 1, minInferno: 3, perCard: 2 },
      { type: 'inferno_threshold_draw', threshold: 5, draw: 1, belowGain: 1 },
      { type: 'inferno_rekindle', fraction: 0.5, minimum: 1 },
      { type: 'inferno_next_gain', kindle: 1, multiplier: 2 },
      { type: 'inferno_pressure', divisor: 4, perStep: 1, cap: 3 },
      { type: 'inferno_temper', perStack: 10, cap: 300 },
      { type: 'inferno_balance', perPair: 3, unmatchedGain: 1 },
      { type: 'inferno_eruption', threshold: 10, divineLight: 100, kindle: 1 },
      { type: 'inferno_memory', perDistinct: 2, cap: 4 },
    ], state);
    expect(result.canPlay).toBe(true);
    expect(result.turn.limitlessInfernoStacks).toBe(27);
    expect(result.turn.intensityInfernoGainedThisTurn).toBe(17);
    expect(result.turn.intensityAttackBonus).toBe(250);
    expect(result.turn.intensityBankedEmbers).toBe(2);
    expect(result.board.backSlots[0]?.limitlessCharge).toBe(3);
    expect(result.deck.hand.map(card => card.instanceId)).toEqual(['replacement', 'oldest', 'held']);
    expect(result.divineLightBonus).toBe(100);
    expect(state.turn.limitlessInfernoStacks).toBe(10);
    expect(state.board.backSlots[0]?.limitlessCharge).toBe(1);
  });

  it('rolls back Inferno, charge, and draw mutations if a later instruction fails', () => {
    const state = fresh();
    const result = execute([{ type: 'inferno_gain', value: 5 }, { type: 'consume_limitless_light_stacks', value: 1 }], state);
    expect(result.canPlay).toBe(false);
    expect(result.turn).toBe(state.turn);
    expect(result.deck).toBe(state.deck);
    expect(getInferno(state.turn)).toBe(0);
  });

  it('recalls oldest eligible main-deck cards without moving an ASA into the hand', () => {
    const state = fresh();
    state.turn.limitlessInfernoStacks = 5;
    state.deck.discardPile = [
      { instanceId: 'asa', definitionId: 'ain-soph-aur-intensity-the-unsevered-contradiction', finish: 'normal' },
      { instanceId: 'oldest', definitionId: paleventHerald.definitionId, finish: 'normal' },
      { instanceId: 'newest', definitionId: 'dark-intensity-nacreless-choir', finish: 'normal' },
    ];
    const result = execute([{ type: 'inferno_recall', count: 1, minInferno: 3, perCard: 2 }], state);
    expect(result.deck.hand.map(card => card.instanceId)).toEqual(['oldest']);
    expect(result.deck.discardPile.map(card => card.instanceId)).toEqual(['asa', 'newest']);
    expect(result.turn.limitlessInfernoStacks).toBe(7);
  });

  it('keeps newly stored embers for subsequent Intensity hand plays only', () => {
    const herald = paleventHerald.definitionId;
    useStore.setState(state => ({
      turn: { ...state.turn, intensityBankedEmbers: 2 },
      deck: { ...state.deck, hand: [
        { instanceId: 'herald', definitionId: herald, finish: 'normal' },
        { instanceId: 'neutral', definitionId: 'light-neutrality-1', finish: 'normal' },
      ] },
    }));
    useStore.getState().playCard('neutral', 'ain');
    expect(useStore.getState().turn.intensityBankedEmbers).toBe(2);
    useStore.getState().playCard('herald', 'soph');
    expect(useStore.getState().turn.intensityBankedEmbers).toBe(1);
    expect(getInferno(useStore.getState().turn)).toBe(1);
  });

  it('rejects a high Light attack with abundant Light but no Inferno, then spends only Inferno', () => {
    const def = intensityCards.find(card => card.type === 'Light' && card.spectrumLevel === 3)!;
    if (def.type !== 'Light') throw new Error('Missing high Light test card');
    useStore.setState(state => ({
      turn: { ...state.turn, limitlessLightStacks: 100, intensityAttackBonus: 125 },
      board: { ...state.board, backSlots: [{
        instanceId: 'attacker', definitionId: def.definitionId, type: 'Light', rarity: def.rarity, finish: 'normal',
        side: 'ain', faceState: 'front', limitlessCharge: 0, attackCooldowns: {}, backSlot: 0,
      }, null, null, null] },
    }));
    useStore.getState().activateLightSophAttack('attacker');
    expect(useStore.getState().turn.attackSequence).toBeUndefined();
    expect(useStore.getState().turn.intensityAttackBonus).toBe(125);
    useStore.setState(state => ({ turn: { ...state.turn, limitlessInfernoStacks: 8 } }));
    useStore.getState().activateLightSophAttack('attacker', -1);
    expect(useStore.getState().turn.attackSequence).toBeUndefined();
    useStore.getState().activateLightSophAttack('attacker');
    expect(useStore.getState().turn.attackSequence?.phase).toBe('priming');
    expect(useStore.getState().turn.limitlessLightStacks).toBe(100);
    expect(getInferno(useStore.getState().turn)).toBe(5);
    expect(useStore.getState().turn.intensityInfernoSpentThisTurn).toBe(3);
    expect(useStore.getState().progress.intensityInfernoSpent).toBe(3);
    expect(useStore.getState().turn.intensityAttackBonus).toBe(0);
  });

  it('resets all furnace preparation at turn end', () => {
    useStore.setState(state => ({ turn: {
      ...state.turn, limitlessInfernoStacks: 100, intensityInfernoGainedThisTurn: 100,
      intensityInfernoSpentThisTurn: 20, intensityNextGainMultiplier: 3, intensityBankedEmbers: 4, intensityAttackBonus: 500,
    } }));
    useStore.getState().endTurn();
    const turn = useStore.getState().turn;
    expect(getInferno(turn)).toBe(0);
    expect(turn.intensityInfernoSpentThisTurn).toBe(0);
    expect(turn.intensityInfernoGainedThisTurn).toBe(0);
    expect(turn.intensityBankedEmbers).toBe(0);
    expect(turn.intensityAttackBonus).toBe(0);
    expect(turn.intensityNextGainMultiplier).toBe(1);
  });

  it('sells only base cards and crafts each Infinite from its own Eternal and Crater materials', () => {
    const pack = PACK_DEFINITIONS.find(pack => pack.id === 'pack-intensity')!;
    expect(pack.cardPool).toEqual(intensityBaseCards.map(card => card.definitionId));
    expect(pack.cardsPerOpen).toBe(5);
    expect(pack.cost).toBe(PACK_DEFINITIONS.find(pack => pack.id === 'pack-neutrality')!.cost);
    expect(INTENSITY_INFINITE_RECIPES.map(recipe => recipe.resultId)).toEqual(intensityInfiniteCards.map(card => card.definitionId));
    const materials = ['emberglass', 'abyssalCinder', 'solarSlag', 'heartOfTheInferno'] as const;
    for (const recipe of INTENSITY_INFINITE_RECIPES) {
      useStore.setState(fresh());
      expect(useStore.getState().combineForInfinite(recipe)).not.toBe(true);
      useStore.setState(state => ({ progress: {
        ...state.progress, emberglass: 100, abyssalCinder: 100, solarSlag: 100, heartOfTheInferno: 100,
        collection: Object.fromEntries(recipe.ingredients.filter(ingredient => ingredient.definitionId).map(ingredient => [ingredient.definitionId!, ingredient.count])),
      } }));
      expect(useStore.getState().combineForInfinite(recipe), recipe.resultId).toBe(true);
      const progress = useStore.getState().progress;
      expect(progress.collection[recipe.resultId]).toBe(1);
      expect(progress.infiniteCollection[recipe.resultId]).toBe(1);
      for (const ingredient of recipe.ingredients) {
        if (ingredient.definitionId) expect(progress.collection[ingredient.definitionId]).toBe(0);
        if (ingredient.currency) expect(progress[ingredient.currency]).toBe(100 - ingredient.count);
      }
      for (const material of materials) {
        if (!recipe.ingredients.some(ingredient => ingredient.currency === material)) expect(progress[material]).toBe(100);
      }
    }
  });

  it('preserves a saved active furnace and normalizes old or malformed values on load', () => {
    const saved = fresh();
    saved.turn.limitlessInfernoStacks = 17;
    saved.turn.intensityInfernoSpentThisTurn = 5;
    saved.turn.intensityBankedEmbers = 2;
    saved.turn.intensityNextGainMultiplier = 3;
    saved.turn.intensityAttackBonus = 300;
    saved.progress.emberglass = 12;
    useStore.getState().loadState(structuredClone(saved));
    expect(getInferno(useStore.getState().turn)).toBe(17);
    expect(useStore.getState().turn.intensityAttackBonus).toBe(300);
    expect(useStore.getState().turn.intensityNextGainMultiplier).toBe(3);
    expect(useStore.getState().progress.emberglass).toBe(12);
    saved.turn.limitlessInfernoStacks = Number.NaN;
    saved.turn.intensityNextGainMultiplier = -5;
    delete saved.turn.intensityBankedEmbers;
    useStore.getState().loadState(saved);
    expect(getInferno(useStore.getState().turn)).toBe(0);
    expect(useStore.getState().turn.intensityNextGainMultiplier).toBe(1);
    expect(useStore.getState().turn.intensityBankedEmbers).toBe(0);
  });
});
