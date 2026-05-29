import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { getCardPreviewLines, getCardPreviewText, getCardSummarySections } from '@/ui/cardStatSummary';
import { getCardEngineRoleText } from '@/ui/setEngineSummary';
import type { CardDefinition } from '@/types/cards';

const suspiciousTextPattern = /(?:\uFFFD|�~|(?:AE|ÁE|�E)(?=[0-9.])|\bx\.(?=\d)|\s•\s)/;
const internalTokenPattern = /\b[a-z]+_[a-z0-9_]+\b/;

function collectCardFacingText(card: CardDefinition): string[] {
  const text: string[] = [
    card.name,
    ...getCardSummarySections(card).flatMap(section => [section.title, ...section.lines]),
    ...getCardPreviewLines(card, 4),
    getCardPreviewText(card, 4),
    getCardEngineRoleText(card) ?? '',
  ];

  if (card.type === 'Seraphim' && card.attacks) {
    text.push(
      card.attacks.unsynergized.name,
      card.attacks.unsynergized.description,
      card.attacks.synergized.name,
      card.attacks.synergized.description,
    );
  }

  if (card.type === 'Angel') {
    text.push(card.activatedAbility.name);

    if (card.attacks) {
      text.push(
        card.attacks.primary.name,
        card.attacks.primary.description,
        card.attacks.exalted.name,
        card.attacks.exalted.description,
      );
    }
  }

  return text.filter(Boolean);
}

describe('card text audit', () => {
  it('keeps card-facing copy free of encoding junk and internal tokens', () => {
    const offenders = CardRegistry.getAll().flatMap(card =>
      collectCardFacingText(card)
        .filter(text => suspiciousTextPattern.test(text) || internalTokenPattern.test(text))
        .map(text => `${card.definitionId}: ${text}`),
    );

    expect(offenders).toEqual([]);
  });

  it('preserves exact mechanical values in summary text', () => {
    const card = CardRegistry.getAll().find((entry): entry is Extract<CardDefinition, { type: 'Seraphim' | 'Angel' }> =>
      (entry.type === 'Seraphim' || entry.type === 'Angel')
      && entry.baseStats.bonusType === 'power_amplifier',
    );
    expect(card).toBeTruthy();

    const expectedMultiplier = `x${String(card!.baseStats.bonusValue).replace(/\.0+$/, '')}`;

    const summaryLines = getCardSummarySections(card!).flatMap(section => section.lines);
    expect(summaryLines.some(line => line.includes(expectedMultiplier))).toBe(true);
    expect(summaryLines.some(line => /\bx\.\d/.test(line))).toBe(false);
  });

  it('avoids duplicate preview copy for simple Ophanim cards', () => {
    const card = CardRegistry.getAll().find(entry => entry.name === 'Null Seek');
    expect(card).toBeTruthy();

    expect(getCardPreviewLines(card!, 3)).toEqual(['Play: Draw 2 cards']);
    expect(getCardPreviewText(card!, 3)).not.toContain('•');
  });
});