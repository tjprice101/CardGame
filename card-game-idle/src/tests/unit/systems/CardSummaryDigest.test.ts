import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { getCanonicalCardDescription, getCardPreviewLines, getCardSummarySections } from '@/ui/cardStatSummary';
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

  it('uses canonical Ability text for Infinite cards', () => {
    const infiniteCard = CardRegistry.get('inf-bgi-sorveths-final-breath');
    expect(infiniteCard).toBeTruthy();

    const ability = getCardSummarySections(infiniteCard!).find(section => section.title === 'Ability');
    expect(ability?.lines[0]).toBe(getCanonicalCardDescription(infiniteCard!));
  });

  it('uses canonical Ability text for Black Glass Eternal cards', () => {
    const eternalCard = CardRegistry.get('btei-bgi-cindershard-lexicon');
    expect(eternalCard).toBeTruthy();

    const ability = getCardSummarySections(eternalCard!).find(section => section.title === 'Ability');
    expect(ability?.lines[0]).toBe(getCanonicalCardDescription(eternalCard!));
  });

  it('streams Patient Light wording in previews', () => {
    const card = CardRegistry.get('btei-voids-reaping');
    expect(card).toBeTruthy();

    const preview = getCardPreviewLines(card!, 3).join(' ');
    expect(preview).not.toContain('card-play Patience gain becomes 1 + Patient Light stacks');
    expect(preview).toContain('+1 Patient Light');
  });
});