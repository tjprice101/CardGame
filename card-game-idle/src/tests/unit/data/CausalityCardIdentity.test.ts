import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import {
  causalityAinSophAurCards,
  causalityDarkCards,
  causalityLightCards,
} from '@/data/cards/causalityCards';
import type { CardDefinition } from '@/types/cards';

const isCausalityCard = (card: CardDefinition): boolean =>
  card.definitionId.includes('causality') || card.artKey.includes('causality');

const signature = (value: unknown): string => JSON.stringify(value);

const effectCount = (effects: readonly { type: string; then?: readonly { type: string; then?: readonly unknown[] }[] }[]): number =>
  effects.reduce((total, effect) => total + 1 + (effect.type === 'conditional' && effect.then
    ? effectCount(effect.then as Parameters<typeof effectCount>[0])
    : 0), 0);

describe('Causality card identities', () => {
  it('gives every base card a unique mechanical signature', () => {
    const lightSignatures = causalityLightCards.map(card => signature(card.sophPlacementEffects));
    const darkSignatures = causalityDarkCards.map(card => signature(card.sophEffects));
    const asaSignatures = causalityAinSophAurCards.map(card => signature({
      materials: card.summonMaterials,
      effects: card.onSummonEffects,
    }));

    expect(new Set(lightSignatures).size).toBe(lightSignatures.length);
    expect(new Set(darkSignatures).size).toBe(darkSignatures.length);
    expect(new Set(asaSignatures).size).toBe(asaSignatures.length);
  });

  it('gives every Causality Dark card unconditional utility', () => {
    const darkCards = CardRegistry.getAll()
      .filter((card): card is Extract<CardDefinition, { type: 'Dark' }> => card.type === 'Dark' && isCausalityCard(card));

    for (const card of darkCards) {
      expect(card.sophEffects.some(effect => effect.type !== 'conditional'), card.definitionId).toBe(true);
      expect(card.sophEffects.some(effect => effect.type !== 'divine_light_flat'), card.definitionId).toBe(true);
    }
  });

  it('gives every Causality Light card an authored Soph placement identity', () => {
    const lightCards = CardRegistry.getAll()
      .filter((card): card is Extract<CardDefinition, { type: 'Light' }> => card.type === 'Light' && isCausalityCard(card));

    for (const card of lightCards) {
      expect(card.sophPlacementEffects.length, card.definitionId).toBeGreaterThan(0);
      expect(card.sophPlacementEffects.some(effect => effect.type !== 'divine_light_flat'), card.definitionId).toBe(true);
    }
  });

  it('escalates base Light and Dark complexity by rarity', () => {
    const averageComplexity = (cards: Array<{ sophEffects?: readonly any[]; sophPlacementEffects?: readonly any[] }>) =>
      cards.reduce((total, card) => total + effectCount((card.sophEffects ?? card.sophPlacementEffects ?? []) as Parameters<typeof effectCount>[0]), 0) / cards.length;

    const rare = [...causalityLightCards, ...causalityDarkCards].filter(card => card.rarity === 'Rare');
    const epic = [...causalityLightCards, ...causalityDarkCards].filter(card => card.rarity === 'Epic');
    const legendary = [...causalityLightCards, ...causalityDarkCards].filter(card => card.rarity === 'Legendary');

    expect(averageComplexity(epic)).toBeGreaterThan(averageComplexity(rare));
    expect(averageComplexity(legendary)).toBeGreaterThan(averageComplexity(epic));
  });
});
