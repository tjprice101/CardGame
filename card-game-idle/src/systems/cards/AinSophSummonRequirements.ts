import { CardRegistry } from '@/cards/CardRegistry';
import type { MainDeckBoardInstance, SummonRequirement } from '@/types/cards';

export function getSummonRequirements(
  summonMaterials: SummonRequirement[] | undefined,
  summonMaterialCount: number,
): SummonRequirement[] {
  return summonMaterials?.length
    ? summonMaterials
    : [{ count: Math.max(1, summonMaterialCount) }];
}

export function matchesSummonRequirement(card: MainDeckBoardInstance, requirement: SummonRequirement): boolean {
  const definition = CardRegistry.get(card.definitionId);
  if (!definition || (definition.type !== 'Light' && definition.type !== 'Dark')) return false;
  if (requirement.definitionIds && !requirement.definitionIds.includes(card.definitionId)) return false;
  if (requirement.cardTypes && !requirement.cardTypes.includes(definition.type)) return false;
  return !requirement.side || requirement.side === 'any' || card.side === requirement.side;
}

export function satisfiesSummonRequirements(
  cards: MainDeckBoardInstance[],
  requirements: SummonRequirement[],
): boolean {
  const requiredCount = requirements.reduce((total, requirement) => total + Math.max(0, requirement.count), 0);
  if (cards.length !== requiredCount || new Set(cards.map(card => card.instanceId)).size !== cards.length) return false;

  const matches = requirements.map(requirement => cards.filter(card => matchesSummonRequirement(card, requirement)));
  const order = matches.map((candidates, index) => ({ candidates, index }))
    .sort((left, right) => left.candidates.length - right.candidates.length);
  const used = new Set<string>();

  const assign = (position: number): boolean => {
    if (position === order.length) return true;
    const { candidates, index } = order[position];
    const count = Math.max(0, requirements[index].count);
    const choose = (candidatePosition: number, chosen: number): boolean => {
      if (chosen === count) return assign(position + 1);
      if (candidates.length - candidatePosition < count - chosen) return false;
      for (let current = candidatePosition; current < candidates.length; current += 1) {
        const candidate = candidates[current];
        if (used.has(candidate.instanceId)) continue;
        used.add(candidate.instanceId);
        if (choose(current + 1, chosen + 1)) return true;
        used.delete(candidate.instanceId);
      }
      return false;
    };
    return choose(0, 0);
  };

  return assign(0);
}

export function canSatisfySummonRequirements(
  cards: MainDeckBoardInstance[],
  requirements: SummonRequirement[],
): boolean {
  const requiredCount = requirements.reduce((total, requirement) => total + Math.max(0, requirement.count), 0);
  if (cards.length < requiredCount) return false;
  const choose = (start: number, selected: MainDeckBoardInstance[]): boolean => {
    if (selected.length === requiredCount) return satisfiesSummonRequirements(selected, requirements);
    for (let index = start; index < cards.length; index += 1) {
      if (choose(index + 1, [...selected, cards[index]])) return true;
    }
    return false;
  };
  return choose(0, []);
}

export function formatSummonRequirement(requirement: SummonRequirement): string {
  const source = requirement.definitionIds?.length
    ? requirement.definitionIds.map(id => CardRegistry.get(id)?.name ?? id).join(' or ')
    : requirement.cardTypes?.join(' or ') ?? 'Light or Dark';
  const side = requirement.side && requirement.side !== 'any' ? ` on ${requirement.side} side` : '';
  return `${requirement.count} ${source} card${requirement.count === 1 ? '' : 's'}${side}`;
}