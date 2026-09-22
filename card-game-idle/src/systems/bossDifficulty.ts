import { CardRegistry } from '@/cards/CardRegistry';
import type { CardDefinition } from '@/types/cards';

export interface BossAttackBaseline {
  perfectRunDps: number;
  noHitDps: number;
  recommendedFirstBossHp: number;
}

export function calculateNeutralityBossBaseline(): BossAttackBaseline {
  const cards = CardRegistry.getAll().filter(card => card.definitionId.includes('neutrality') && (card.type === 'Light' || card.type === 'AinSophAur'));
  const lightCards = cards.filter((card): card is Extract<CardDefinition, { type: 'Light' }> => card.type === 'Light');
  const asaCards = cards.filter((card): card is Extract<CardDefinition, { type: 'AinSophAur' }> => card.type === 'AinSophAur');
  const bestAin = Math.max(0, ...lightCards.map(card => card.ainAttack.baseDivineLight + (card.ainAttack.scaling.kind === 'linear' && card.ainAttack.scaling.reads === 'collectionPower' ? card.ainAttack.scaling.multiplier * 1000 : 0)));
  const bestSoph = Math.max(0, ...lightCards.map(card => card.sophAttack.baseDivineLight + (card.sophAttack.scaling.kind === 'linear' && card.sophAttack.scaling.reads === 'collectionPower' ? card.sophAttack.scaling.multiplier * 1000 : 0)));
  const bestBridge = Math.max(0, ...asaCards.map(card => card.bridgeAttack ? card.bridgeAttack.baseDivineLight + (card.bridgeAttack.scaling.kind === 'linear' && card.bridgeAttack.scaling.reads === 'collectionPower' ? card.bridgeAttack.scaling.multiplier * 1000 : 0) : 0));
  const noHitCycle = bestAin + bestSoph + bestBridge;
  const perfectCycle = bestAin * 4 + bestSoph * 5.5 + bestBridge * 5.5;
  const cyclesPerMinute = 0.8;
  const noHitDps = Math.max(1, noHitCycle * cyclesPerMinute / 60);
  const perfectRunDps = Math.max(noHitDps, perfectCycle * cyclesPerMinute / 60);
  return {
    perfectRunDps,
    noHitDps,
    recommendedFirstBossHp: Math.round((noHitDps * 180 * 1.1 + perfectRunDps * 180 * 0.55) / 500) * 500,
  };
}
