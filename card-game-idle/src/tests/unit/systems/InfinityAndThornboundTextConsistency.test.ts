import { describe, expect, it } from 'vitest';

import { CardRegistry } from '@/cards/CardRegistry';
import {
  getCanonicalActivatedAbilityDescription,
  getCanonicalAttackDescription,
  getCanonicalCardDescription,
} from '@/ui/cardStatSummary';
import { formatDisplayCardText } from '@/ui/preferences';
import type { CardDefinition } from '@/types/cards';

function normalizeText(value: string): string {
  return formatDisplayCardText(value)
    .replace(/\s+/g, ' ')
    .trim();
}

function isTargetCard(card: CardDefinition): boolean {
  return card.rarity === 'Infinite' || (card.rarity === 'Eternal' && card.element === 'Thornbound');
}

describe('Infinity and Thornbound Eternal text consistency', () => {
  const cards = CardRegistry.getAll().filter(isTargetCard);

  it('keeps authored descriptions aligned with canonical mechanics', () => {
    expect(cards.length).toBeGreaterThan(0);

    const mismatches = cards
      .filter(card => normalizeText(card.description) !== normalizeText(getCanonicalCardDescription(card)))
      .map(card => card.definitionId);

    expect(mismatches).toEqual([]);
  });

  it('keeps targeted Seraphim attack descriptions aligned with attack stats', () => {
    const mismatches = cards
      .filter((card): card is Extract<CardDefinition, { type: 'Seraphim' }> => card.type === 'Seraphim')
      .flatMap(card => {
        const issues: string[] = [];

        const unsynergizedCanonical = getCanonicalAttackDescription(card.attacks.unsynergized);
        if (normalizeText(card.attacks.unsynergized.description) !== normalizeText(unsynergizedCanonical)) {
          issues.push(`${card.definitionId}:unsynergized`);
        }

        const synergizedCanonical = getCanonicalAttackDescription(card.attacks.synergized);
        if (normalizeText(card.attacks.synergized.description) !== normalizeText(synergizedCanonical)) {
          issues.push(`${card.definitionId}:synergized`);
        }

        return issues;
      });

    expect(mismatches).toEqual([]);
  });

  it('keeps targeted Angel awaken and attack descriptions aligned', () => {
    const mismatches = cards
      .filter((card): card is Extract<CardDefinition, { type: 'Angel' }> => card.type === 'Angel')
      .flatMap(card => {
        const issues: string[] = [];

        const awakenedCanonical = getCanonicalActivatedAbilityDescription(card);
        if (normalizeText(card.activatedAbility.description) !== normalizeText(awakenedCanonical)) {
          issues.push(`${card.definitionId}:awaken`);
        }

        const primaryCanonical = getCanonicalAttackDescription(card.attacks.primary);
        if (normalizeText(card.attacks.primary.description) !== normalizeText(primaryCanonical)) {
          issues.push(`${card.definitionId}:primary`);
        }

        const exaltedCanonical = getCanonicalAttackDescription(card.attacks.exalted);
        if (normalizeText(card.attacks.exalted.description) !== normalizeText(exaltedCanonical)) {
          issues.push(`${card.definitionId}:exalted`);
        }

        return issues;
      });

    expect(mismatches).toEqual([]);
  });
});
