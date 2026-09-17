import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';
import { GARDEN_DUNGEONS } from '@/data/dungeons/gardenDungeonDefinitions';
import { INFINITE_RECIPES } from '@/data/cards/infiniteCards';

const CAUSALITY_ETERNALS = [
  'btei-causality-first-cause', 'btei-causality-last-horizon', 'btei-causality-ink-sovereign',
  'btei-causality-chromatic-verdict', 'btei-causality-pearl-engine',
];
const CAUSALITY_INFINITES = [
  'inf-causality-origin-script', 'inf-causality-chromatic-horizon', 'inf-causality-law-eater',
  'inf-causality-archive-reborn', 'inf-causality-heart-beyond-all',
];
const CAUSALITY_MATERIALS = new Set(['seedOfCausality', 'causalBloom', 'shatteredCausalTranscript', 'heartOfCausality']);

describe('Causality endgame content', () => {
  it('registers five endgame bosses with five unique Eternal rewards', () => {
    const bosses = BOSS_DEFINITIONS.filter(boss => boss.category === 'Causality');
    expect(bosses).toHaveLength(5);
    expect(new Set(bosses.map(boss => boss.rewardCardId)).size).toBe(5);
    expect(bosses.map(boss => boss.rewardCardId).sort()).toEqual([...CAUSALITY_ETERNALS].sort());
    expect(bosses[0]!.hp).toBeGreaterThan(1_000_000);
    expect(bosses.every((boss, index) => index === 0 || boss.hp > bosses[index - 1]!.hp)).toBe(true);
    for (const id of CAUSALITY_ETERNALS) expect(CardRegistry.get(id)?.rarity).toBe('Eternal');
  });

  it('registers five playable Causality Infinite cards with restricted recipes', () => {
    for (const id of CAUSALITY_INFINITES) expect(CardRegistry.get(id)?.rarity).toBe('Infinite');
    const recipes = INFINITE_RECIPES.filter(recipe => recipe.resultId.startsWith('inf-causality-'));
    expect(recipes).toHaveLength(5);
    for (const recipe of recipes) {
      expect(recipe.ingredients.every(ingredient => ingredient.definitionId
        ? CAUSALITY_ETERNALS.includes(ingredient.definitionId)
        : !!ingredient.currency && CAUSALITY_MATERIALS.has(ingredient.currency))).toBe(true);
    }
  });

  it('defines the four Rift encounters and exact drop rates', () => {
    const valley = GARDEN_DUNGEONS.find(dungeon => dungeon.id === 'valley-of-null')!;
    const rift = GARDEN_DUNGEONS.find(dungeon => dungeon.id === 'rift-of-causality')!;
    expect(rift.category).toBe('Causality');
    expect(rift.encounters).toHaveLength(4);
    expect(rift.encounters[0]!.maxHp).toBeGreaterThanOrEqual(valley.encounters.at(-1)!.maxHp * 4);
    expect(rift.encounters.map(encounter => encounter.reward?.chance)).toEqual([0.5, 0.4, 0.3, 0.1]);
    expect(rift.encounters.map(encounter => encounter.reward?.currency)).toEqual([
      'seedOfCausality', 'causalBloom', 'shatteredCausalTranscript', 'heartOfCausality',
    ]);
  });
});