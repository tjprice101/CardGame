import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { ABILITY_DEFINITIONS, ABILITY_REGISTRY, getAbilityMaterialCost, getAbilityTier, meetsAbilityOwnershipGate } from '@/data/abilities/abilityDefinitions';
import { BOSS_DEFINITIONS, getBossProgressionOrder, isBossUnlocked } from '@/data/bosses/bossDefinitions';
import { GARDEN_DUNGEONS, GARDEN_MATERIAL_METADATA } from '@/data/dungeons/gardenDungeonDefinitions';
import { defaultGameState } from '@/state/store';
import { activateIntensityAbility, gainIntensityInferno, getIntensityAbilityReadiness } from '@/systems/abilities/intensityAbilities';
import type { MainDeckBoardInstance } from '@/types/cards';
import type { DeckCard } from '@/types/game';

const materials = ['emberglass', 'abyssalCinder', 'solarSlag', 'heartOfTheInferno'];
const ability = (suffix: string) => `intensity-${suffix}`;
const baseCards = () => CardRegistry.getAll().filter(card =>
  card.definitionId.includes('-intensity-') && !['Eternal', 'Infinite', 'Transcendent'].includes(card.rarity));
const mainId = () => baseCards().find(card => card.type === 'Light')!.definitionId;
const deckCard = (instanceId: string, definitionId = mainId()): DeckCard => ({ instanceId, definitionId, finish: 'normal' });
const boardCard = (id = mainId()): MainDeckBoardInstance => ({
  instanceId: id, definitionId: id, type: 'Light', rarity: 'Common', finish: 'normal',
  side: 'soph', faceState: 'back', limitlessCharge: 0, attackCooldowns: { attack: 3 }, backSlot: 0,
});
function state() {
  const value = structuredClone(defaultGameState);
  value.turn.phase = 'playing';
  value.turn.pendingEffect = null;
  value.turn.limitlessLightStacks = 30;
  value.turn.limitlessInfernoStacks = 30;
  value.turn.abilityCooldownUntil = {};
  value.deck.drawPile = [deckCard('draw-1'), deckCard('draw-2'), deckCard('draw-3')];
  value.deck.hand = [];
  value.deck.discardPile = [];
  value.board.backSlots = [null, null, null, null];
  value.board.frontSlots = [null, null, null, null];
  return value;
}

describe('Intensity world content', () => {
  it('awards five distinct Eternal cards with a mid-Neutrality HP anchor', () => {
    const bosses = getBossProgressionOrder('Intensity');
    const neutrality = getBossProgressionOrder('Neutrality');
    expect(bosses).toHaveLength(5);
    expect(bosses[0]!.hp).toBe(neutrality[Math.floor(neutrality.length / 2)]!.hp);
    expect(bosses.at(-1)!.hp).toBe(neutrality.at(-1)!.hp);
    expect(bosses.every((boss, index) => index === 0 || boss.hp > bosses[index - 1]!.hp)).toBe(true);
    expect(new Set(bosses.map(boss => boss.rewardCardId)).size).toBe(5);
    expect(BOSS_DEFINITIONS.filter(boss => boss.category === 'Intensity').map(boss => boss.rewardCardId)).toEqual([
      'eternal-intensity-cathedral-below-all-seas',
      'eternal-intensity-the-crown-divided-against-itself',
      'eternal-intensity-sovereign-of-unbearable-noon',
      'eternal-intensity-the-bell-that-buries-distance',
      'eternal-intensity-verdict-after-the-last-dawn',
    ]);
    const progress = state().progress;
    progress.bossClearCounts = {};
    expect(isBossUnlocked(progress, bosses[0]!.id)).toBe(true);
    expect(isBossUnlocked(progress, bosses[1]!.id)).toBe(false);
    progress.bossClearCounts[bosses[0]!.id] = 1;
    expect(isBossUnlocked(progress, bosses[1]!.id)).toBe(true);
  });

  it('adds four modest Crater encounters and exclusive materials without reordering older dungeons', () => {
    expect(GARDEN_DUNGEONS[0]!.id).toBe('valley-of-null');
    const crater = GARDEN_DUNGEONS.find(dungeon => dungeon.id === 'crater-of-flames')!;
    expect(crater.available).toBe(true);
    expect(crater.category).toBe('Intensity');
    expect(crater.encounters.map(encounter => encounter.maxHp)).toEqual([30_000, 40_000, 50_000, 60_000]);
    expect(crater.encounters.map(encounter => encounter.reward?.currency)).toEqual(materials);
    for (const encounter of crater.encounters) {
      const key = encounter.reward!.currency as keyof typeof GARDEN_MATERIAL_METADATA;
      expect(GARDEN_MATERIAL_METADATA[key].artAssetKey).toBe(encounter.reward!.artAssetKey);
    }
  });

  it('provides three base, two Eternal and two Infinite abilities with exclusive material costs', () => {
    const abilities = ABILITY_DEFINITIONS.filter(value => value.setId === 'Intensity');
    expect(abilities).toHaveLength(7);
    expect(abilities.filter(value => getAbilityTier(value) === 'foundational')).toHaveLength(3);
    expect(abilities.filter(value => getAbilityTier(value) === 'eternal')).toHaveLength(2);
    expect(abilities.filter(value => getAbilityTier(value) === 'infinite')).toHaveLength(2);
    for (const value of abilities) expect(Object.keys(getAbilityMaterialCost(value)).every(key => materials.includes(key))).toBe(true);
  });

  it('requires the complete base collection and the corresponding Intensity endgame ownership', () => {
    const kindle = ABILITY_REGISTRY.get(ability('kindle-the-depths'))!;
    const collection = Object.fromEntries(baseCards().map(card => [card.definitionId, 1]));
    expect(meetsAbilityOwnershipGate(kindle, {}, {})).toBe(false);
    expect(meetsAbilityOwnershipGate(kindle, collection, {})).toBe(true);
    collection[baseCards()[0]!.definitionId] = 0;
    expect(meetsAbilityOwnershipGate(kindle, collection, {})).toBe(false);
    const eternal = ABILITY_REGISTRY.get(ability('cinder-recall'))!;
    const infinite = ABILITY_REGISTRY.get(ability('unquenched-reserve'))!;
    expect(meetsAbilityOwnershipGate(eternal, { 'btei-voids-reaping': 1 }, {})).toBe(false);
    expect(meetsAbilityOwnershipGate(eternal, { 'eternal-intensity-cathedral-below-all-seas': 1 }, {})).toBe(true);
    expect(meetsAbilityOwnershipGate(infinite, {}, { 'infinite-intensity-the-unfathomed-return': 1 })).toBe(true);
    expect(meetsAbilityOwnershipGate(infinite, { 'infinite-intensity-the-unfathomed-return': 1 }, {})).toBe(false);
  });
});

describe('Intensity ability runtime', () => {
  it('reports readiness without mutating state and matches activation preconditions', () => {
    const value = state();
    const before = structuredClone(value);
    expect(getIntensityAbilityReadiness(value, ability('kindle-the-depths'), 1_000).success).toBe(true);
    expect(value).toEqual(before);
    value.turn.limitlessInfernoStacks = 0;
    expect(getIntensityAbilityReadiness(value, ability('bank-the-flame'), 1_000)).toEqual({ success: false, reason: 'insufficient-stacks' });
    value.turn.limitlessInfernoStacks = 30;
    expect(getIntensityAbilityReadiness(value, ability('cinder-recall'), 1_000)).toEqual({ success: false, reason: 'no-target' });
    value.turn.pendingEffect = { type: 'discard_choice', count: 1, sourceCard: 'fixture' };
    expect(getIntensityAbilityReadiness(value, ability('kindle-the-depths'), 1_000)).toEqual({ success: false, reason: 'busy' });
  });
  it('Kindle gains uncapped Inferno by converting Light and stamps a cooldown', () => {
    const value = state();
    value.turn.limitlessInfernoStacks = 1_000;
    expect(activateIntensityAbility(value, ability('kindle-the-depths'), 1_000)).toEqual({ success: true, baseDivineLight: 0 });
    expect(value.turn.limitlessLightStacks).toBe(27);
    expect(value.turn.limitlessInfernoStacks).toBe(1_004);
    expect(value.turn.abilityCooldownUntil![ability('kindle-the-depths')]).toBe(36_000);
  });
  it('Bank converts Inferno into Light and records spending', () => {
    const value = state();
    expect(activateIntensityAbility(value, ability('bank-the-flame'), 1_000).success).toBe(true);
    expect(value.turn.limitlessInfernoStacks).toBe(24);
    expect(value.turn.limitlessLightStacks).toBe(42);
    expect(value.turn.intensityInfernoSpentThisTurn).toBe(6);
  });
  it('Temper draws two cards, preserving deck order', () => {
    const value = state();
    expect(activateIntensityAbility(value, ability('temper-the-hand'), 1_000).success).toBe(true);
    expect(value.deck.hand.map(card => card.instanceId)).toEqual(['draw-1', 'draw-2']);
    expect(value.deck.drawPile.map(card => card.instanceId)).toEqual(['draw-3']);
    expect(value.turn.limitlessInfernoStacks).toBe(26);
  });
  it('Recall returns only the newest eligible main cards and never puts ASA into hand', () => {
    const value = state();
    value.deck.discardPile = [
      deckCard('old'), deckCard('middle'), deckCard('other-set', 'light-1'),
      deckCard('new'), deckCard('asa', 'eternal-intensity-the-crown-divided-against-itself'),
    ];
    expect(activateIntensityAbility(value, ability('cinder-recall'), 1_000).success).toBe(true);
    expect(value.deck.hand.map(card => card.instanceId)).toEqual(['new', 'middle']);
    expect(value.deck.discardPile.map(card => card.instanceId)).toEqual(['old', 'other-set', 'asa']);
    expect(value.turn.limitlessInfernoStacks).toBe(22);
  });
  it('Reprieve accelerates only Intensity, with a bounded per-card rebate', () => {
    const value = state();
    value.board.backSlots = [boardCard(), boardCard('dark-intensity-fixture'), boardCard('light-1'), null];
    expect(activateIntensityAbility(value, ability('white-hot-reprieve'), 1_000).success).toBe(true);
    expect(value.board.backSlots[0]!.attackCooldowns.attack).toBe(1);
    expect(value.board.backSlots[1]!.attackCooldowns.attack).toBe(1);
    expect(value.board.backSlots[2]!.attackCooldowns.attack).toBe(3);
    expect(value.turn.limitlessInfernoStacks).toBe(22);
    expect(value.turn.intensityInfernoSpentThisTurn).toBe(10);
    expect(value.turn.intensityInfernoGainedThisTurn).toBe(2);
  });
  it('Reserve doubles exactly the next positive gain and cannot stack', () => {
    const value = state();
    expect(activateIntensityAbility(value, ability('unquenched-reserve'), 1_000).success).toBe(true);
    const before = structuredClone(value);
    expect(activateIntensityAbility(value, ability('unquenched-reserve'), 200_000)).toEqual({ success: false, reason: 'already-reserved' });
    expect(value).toEqual(before);
    expect(gainIntensityInferno(value.turn, 0)).toBe(0);
    expect(value.turn.intensityNextGainMultiplier).toBe(2);
    expect(gainIntensityInferno(value.turn, 3)).toBe(6);
    expect(gainIntensityInferno(value.turn, 3)).toBe(3);
    expect(value.turn.limitlessInfernoStacks).toBe(27);
    expect(value.turn.intensityNextGainMultiplier).toBe(1);
  });
  it('Crucible consumes every stack, returns base payout, and charges only facedown Intensity Soph', () => {
    const value = state();
    value.turn.limitlessInfernoStacks = 100;
    const faceUp = boardCard();
    faceUp.faceState = 'front';
    const ain = boardCard();
    ain.side = 'ain';
    value.board.backSlots = [boardCard(), faceUp, ain, boardCard('light-1')];
    expect(activateIntensityAbility(value, ability('crucible-without-end'), 1_000)).toEqual({ success: true, baseDivineLight: 50_000 });
    expect(value.turn.limitlessInfernoStacks).toBe(0);
    expect(value.turn.intensityInfernoSpentThisTurn).toBe(100);
    expect(value.board.backSlots.map(card => card?.limitlessCharge)).toEqual([5, 0, 0, 0]);
    expect(value.progress.divineLight).toBe(defaultGameState.progress.divineLight);
  });
  it.each([
    ['temper-the-hand', 'draw'], ['cinder-recall', 'discard'], ['white-hot-reprieve', 'board'],
  ])('does not spend resources or stamp cooldowns without targets: %s', (suffix, zone) => {
    const value = state();
    if (zone === 'draw') value.deck.drawPile = [];
    const before = structuredClone(value);
    expect(activateIntensityAbility(value, ability(suffix), 1_000)).toEqual({ success: false, reason: 'no-target' });
    expect(value).toEqual(before);
  });
  it.each(['kindle-the-depths', 'bank-the-flame', 'temper-the-hand', 'cinder-recall', 'white-hot-reprieve', 'unquenched-reserve', 'crucible-without-end'])(
    'fails atomically on insufficient resources: %s', suffix => {
      const value = state();
      value.turn.limitlessLightStacks = 0;
      value.turn.limitlessInfernoStacks = 0;
      const before = structuredClone(value);
      expect(activateIntensityAbility(value, ability(suffix), 1_000)).toEqual({ success: false, reason: 'insufficient-stacks' });
      expect(value).toEqual(before);
    },
  );
  it('rejects busy states, cooldowns, and foreign IDs without mutation', () => {
    const value = state();
    value.turn.phase = 'idle';
    expect(activateIntensityAbility(value, ability('kindle-the-depths'), 1_000)).toEqual({ success: false, reason: 'busy' });
    value.turn.phase = 'playing';
    value.turn.abilityCooldownUntil![ability('kindle-the-depths')] = 2_000;
    expect(activateIntensityAbility(value, ability('kindle-the-depths'), 1_000)).toEqual({ success: false, reason: 'cooldown' });
    expect(activateIntensityAbility(value, 'neutralizing-inferno', 1_000)).toEqual({ success: false, reason: 'unknown-ability' });
    expect(value.turn.limitlessLightStacks).toBe(30);
    expect(value.turn.limitlessInfernoStacks).toBe(30);
  });
  it('ignores invalid gains and supports absent save fields without imposing a cap', () => {
    const value = state();
    delete value.turn.limitlessInfernoStacks;
    delete value.turn.intensityNextGainMultiplier;
    for (const amount of [0, -2, NaN, Infinity]) expect(gainIntensityInferno(value.turn, amount)).toBe(0);
    expect(gainIntensityInferno(value.turn, 10_000)).toBe(10_000);
    expect(value.turn.limitlessInfernoStacks).toBe(10_000);
  });
});
