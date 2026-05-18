import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { getCardPreviewLines, getCardSummarySections } from '@/ui/cardStatSummary';
import type { CardType } from '@/types/cards';

describe('card summary digest', () => {
  it.each(['Ophanim', 'Cherubim', 'Seraphim', 'Angel'] as CardType[])('builds bite-size sections for %s cards', type => {
    const card = CardRegistry.getAll().find(entry => entry.type === type);
    expect(card).toBeTruthy();

    const sections = getCardSummarySections(card!);
    expect(sections.length).toBeGreaterThan(0);
    expect(sections.every(section => section.lines.length > 0)).toBe(true);

    const preview = getCardPreviewLines(card!, 3);
    expect(preview.length).toBeGreaterThan(0);
    expect(preview.length).toBeLessThanOrEqual(3);
  });
});