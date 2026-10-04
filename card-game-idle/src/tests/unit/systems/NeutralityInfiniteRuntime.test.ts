import { beforeEach, describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CardRegistry } from '@/cards/CardRegistry';
import { neutralityInfiniteCards } from '@/data/cards/neutralityInfiniteCards';
import { infiniteCards, INFINITE_RECIPES } from '@/data/cards/infiniteCards';
import { getCardSetId } from '@/data/elements';
import { CardEffectExecutor } from '@/systems/cards/CardEffectExecutor';
import { getCardRequirementEffects } from '@/systems/cards/PlayRequirements';
import { getRewardThemeSeed, isThemeUnlocked } from '@/data/profile/uiThemes';
import { defaultGameState, useStore } from '@/state/store';
import type { BoardState, DeckCard, GameState } from '@/types/game';
import type { CardEffect } from '@/types/effects';

function fresh(): GameState {
  const state = structuredClone(defaultGameState);
  state.turn.phase = 'playing';
  state.turn.spectrumLevel = 5;
  return state;
}
const card = (id: string, definitionId: string): DeckCard => ({ instanceId: id, definitionId, finish: 'normal' });
function support(id: string, definitionId: string, charge = 0, cooldowns: Record<string, number> = {}): NonNullable<BoardState['backSlots'][number]> {
  const definition = CardRegistry.get(definitionId);
  if (!definition || definition.type === 'AinSophAur') throw new Error(`Invalid support: ${definitionId}`);
  return { ...card(id, definitionId), type: definition.type, rarity: definition.rarity, side: 'soph', faceState: 'back', limitlessCharge: charge, attackCooldowns: cooldowns, backSlot: 0 };
}
function execute(effects: CardEffect[], state = fresh()) {
  return CardEffectExecutor.execute(card('source', 'inf-oblivion-absolute'), state.turn, state.board, state.deck, false,
    { effects, countAsPlay: false, removeFromHand: false });
}

describe('restored Neutrality Infinites', () => {
  beforeEach(() => useStore.setState(fresh()));

  it('registers eight unique live definitions with existing art, recipes, accurate metadata, and correct set membership', () => {
    expect(neutralityInfiniteCards).toHaveLength(8);
    expect(new Set(neutralityInfiniteCards.map(def => JSON.stringify(getCardRequirementEffects(def)))).size).toBe(8);
    const filenames = ['Oblivion Absolute', 'Void Cascade', 'Genesis Throne', 'Celestial Blackout', 'Entropic Crown', 'Annihilation Field', 'Sovereign Void', 'Eternity Rupture'];
    neutralityInfiniteCards.forEach((def, index) => {
      expect(CardRegistry.get(def.definitionId)).toEqual(def);
      expect(def.rarity).toBe('Infinite');
      expect(def.spectrumLevel).toBeGreaterThanOrEqual(4);
      expect(def.spectrumLevel).toBeLessThanOrEqual(5);
      expect(getCardSetId(def.definitionId)).toBe('Neutrality');
      expect(INFINITE_RECIPES.some(recipe => recipe.resultId === def.definitionId)).toBe(true);
      expect(infiniteCards.find(metadata => metadata.definitionId === def.definitionId)?.description).toBe(def.description);
      expect(existsSync(join(process.cwd(), 'public', 'assets', 'card-backgrounds', 'infinite', `${filenames[index]}.png`))).toBe(true);
      if (def.type === 'Light') expect(def.sophAttack.stackResource ?? 'light').toBe('light');
    });
    expect(getCardSetId('btei-voids-reaping')).toBe('Neutrality');
    expect(getCardSetId('btei-causality-first-cause')).toBe('Causality');
    expect(getCardSetId('inf-causality-origin-script')).toBe('Causality');
    expect(getCardSetId('inf-unrelated')).toBeNull();
  });

  it('caps resonance without consuming Light or Inferno', () => {
    const state = fresh();
    state.turn.limitlessLightStacks = 40;
    state.turn.limitlessInfernoStacks = 15;
    const result = execute([{ type: 'neutrality_stack_resonance', perStack: 400, cap: 12_000 }], state);
    expect(result.divineLightBonus).toBe(12_000);
    expect(result.turn.limitlessLightStacks).toBe(40);
    expect(result.turn.limitlessInfernoStacks).toBe(15);
  });

  it('recovers only the oldest eligible Neutrality main cards, including premium cards', () => {
    const state = fresh();
    const oldest = card('oldest', 'inf-null-apex');
    const next = card('next', 'btei-voids-reaping');
    const untouched = [card('asa', 'inf-sovereign-void'), card('intensity', 'light-intensity-palevent-herald'), card('last', 'light-neutrality-1')];
    state.deck.lightBoundAbyss = [untouched[0], oldest, untouched[1], next, untouched[2]];
    const result = execute([{ type: 'neutrality_abyss_reclaim', count: 2 }], state);
    expect(result.deck.hand).toEqual([...state.deck.hand, oldest, next]);
    expect(result.deck.lightBoundAbyss).toEqual(untouched);
    expect(state.deck.lightBoundAbyss).toHaveLength(5);
  });

  it('releases exactly the charge cap in slot order, excluding other sets', () => {
    const state = fresh();
    state.board.backSlots = [support('first', 'inf-genesis-throne', 5), support('foreign', 'light-intensity-palevent-herald', 10), support('second', 'btei-voids-reaping', 7), null];
    const result = execute([{ type: 'neutrality_charge_release', cap: 8, divineLightPerCharge: 600 }], state);
    expect(result.turn.limitlessLightStacks).toBe(8);
    expect(result.divineLightBonus).toBe(4_800);
    expect(result.board.backSlots.map(slot => slot?.limitlessCharge)).toEqual([0, 10, 4, undefined]);
    expect(state.board.backSlots[0]?.limitlessCharge).toBe(5);
  });

  it('grants charge only to Neutrality Soph supports', () => {
    const state = fresh();
    const ain = support('ain', 'light-neutrality-1', 4);
    ain.side = 'ain';
    state.board.backSlots = [support('soph', 'inf-genesis-throne', 3), ain, support('foreign', 'light-intensity-palevent-herald', 8), null];
    const result = execute([{ type: 'neutrality_charge_grant', value: 2 }], state);
    expect(result.board.backSlots.map(slot => slot?.limitlessCharge)).toEqual([5, 4, 8, undefined]);
  });

  it('rebates per accelerated card rather than per cooldown, and clamps remaining cooldowns', () => {
    const state = fresh();
    state.board.backSlots = [support('first', 'inf-null-apex', 0, { ain: 3, soph: 1 }), support('second', 'btei-voids-reaping', 0, { dark: 4 }), support('foreign', 'light-intensity-palevent-herald', 0, { ain: 9 }), support('ready', 'light-neutrality-1', 0, { ain: 0 })];
    const result = execute([{ type: 'neutrality_cooldown_reduction', value: 2, stackPerCard: 1, cap: 4 }], state);
    expect(result.turn.limitlessLightStacks).toBe(2);
    expect(result.board.backSlots[0]?.attackCooldowns).toEqual({ ain: 1, soph: 0 });
    expect(result.board.backSlots[1]?.attackCooldowns).toEqual({ dark: 2 });
    expect(result.board.backSlots[2]?.attackCooldowns).toEqual({ ain: 9 });
    expect(state.board.backSlots[0]?.attackCooldowns).toEqual({ ain: 3, soph: 1 });
    expect(execute([{ type: 'neutrality_cooldown_reduction', value: 2, stackPerCard: 3, cap: 4 }], state).turn.limitlessLightStacks).toBe(4);
  });

  it('counts only remaining Neutrality Light/Dark pairs', () => {
    const state = fresh();
    state.board.backSlots = [support('light1', 'inf-null-apex'), support('light2', 'light-neutrality-1'), support('dark', 'inf-entropic-crown'), support('foreign', 'dark-intensity-nacreless-choir')];
    const result = execute([{ type: 'neutrality_equilibrium', divineLightPerPair: 1_500, stacksPerPair: 2 }], state);
    expect(result.turn.limitlessLightStacks).toBe(2);
    expect(result.divineLightBonus).toBe(1_500);
  });

  it('rolls back nested board changes, abyss recovery, charge, and payouts when a later cost fails', () => {
    const state = fresh();
    state.board.backSlots[0] = support('first', 'inf-null-apex', 4, { ain: 3 });
    state.deck.lightBoundAbyss = [card('abyss', 'inf-genesis-throne')];
    const before = structuredClone(state);
    const result = execute([
      { type: 'neutrality_cooldown_reduction', value: 2, stackPerCard: 1, cap: 4 },
      { type: 'neutrality_charge_release', cap: 8, divineLightPerCharge: 600 },
      { type: 'neutrality_abyss_reclaim', count: 2 },
      { type: 'consume_limitless_light_stacks', value: 99 },
    ], state);
    expect(result.canPlay).toBe(false);
    expect(result.board).toBe(state.board);
    expect(result.deck).toBe(state.deck);
    expect(result.turn).toBe(state.turn);
    expect(result.divineLightBonus).toBe(0);
    expect(state).toEqual(before);
  });

  it('blocks each main-deck card below its actual Spectrum requirement without mutation', () => {
    for (const definition of neutralityInfiniteCards.filter(def => def.type !== 'AinSophAur')) {
      const state = fresh();
      state.turn.spectrumLevel = definition.spectrumLevel === 5 ? 4 : 3;
      state.deck.hand = [card('held', definition.definitionId)];
      useStore.setState(state);
      const before = useStore.getState();
      useStore.getState().playCard('held', 'soph');
      expect(useStore.getState().deck).toBe(before.deck);
      expect(useStore.getState().board).toBe(before.board);
      expect(useStore.getState().turn).toBe(before.turn);
    }
  });

  it('crafts all eight results and restores the real eight-card Infinite Crown gate', () => {
    const requirement = getRewardThemeSeed('theme-reward-infinite-neutrality');
    expect(new Set(requirement?.ids)).toEqual(new Set(neutralityInfiniteCards.map(def => def.definitionId)));
    const progress = fresh().progress;
    expect(isThemeUnlocked('theme-reward-infinite-neutrality', progress)).toBe(false);
    for (const definition of neutralityInfiniteCards) {
      const recipe = INFINITE_RECIPES.find(entry => entry.resultId === definition.definitionId)!;
      useStore.setState(fresh());
      useStore.setState(state => ({ progress: {
        ...state.progress, nullifiedLattice: 100, nullSearedLight: 100, nullifiedOblivionMatter: 100,
        collection: Object.fromEntries(recipe.ingredients.filter(i => i.definitionId).map(i => [i.definitionId!, i.count])),
      } }));
      expect(useStore.getState().combineForInfinite(recipe)).toBe(true);
      expect(useStore.getState().progress.collection[definition.definitionId]).toBe(1);
      progress.infiniteCollection[definition.definitionId] = 1;
    }
    expect(isThemeUnlocked('theme-reward-infinite-neutrality', progress)).toBe(true);
    delete progress.infiniteCollection[neutralityInfiniteCards[0].definitionId];
    expect(isThemeUnlocked('theme-reward-infinite-neutrality', progress)).toBe(false);
  });

  it('blocks both ASA summons below the printed level while leaving materials and Extra Deck intact', () => {
    for (const definition of neutralityInfiniteCards.filter(def => def.type === 'AinSophAur')) {
      const state = fresh();
      state.turn.spectrumLevel = definition.spectrumLevel === 5 ? 4 : 3;
      const light = support('light', 'light-neutrality-1');
      const dark = support('dark', 'dark-neutrality-1');
      light.side = dark.side = 'ain';
      state.board.backSlots = [light, dark, null, null];
      state.deck.extraDeck = [{ definitionId: definition.definitionId, finish: 'normal' }];
      useStore.setState(state);
      const before = useStore.getState();
      useStore.getState().summonAinSophAur(definition.definitionId, ['light', 'dark'], 0);
      expect(useStore.getState().deck).toBe(before.deck);
      expect(useStore.getState().board).toBe(before.board);
      expect(useStore.getState().turn).toBe(before.turn);
    }
  });
});
