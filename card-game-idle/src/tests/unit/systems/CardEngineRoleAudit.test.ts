import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { getCardEngineRole, getCardEngineRoleText } from '@/ui/setEngineSummary';

describe('card engine role audit', () => {
  it('gives every registered card a bite-size engine role line', () => {
    const cards = CardRegistry.getAll();
    expect(cards.length).toBeGreaterThan(0);

    const missingRoles = cards
      .filter(card => getCardEngineRole(card) === null)
      .map(card => card.definitionId);

    const overlyLongRoles = cards
      .map(card => ({ card, text: getCardEngineRoleText(card) ?? '' }))
      .filter(entry => entry.text.length === 0 || entry.text.length > 220)
      .map(entry => `${entry.card.definitionId}:${entry.text.length}`);

    expect(missingRoles).toEqual([]);
    expect(overlyLongRoles).toEqual([]);
  });
});