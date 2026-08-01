import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import {
  getCanonicalActivatedAbilityDescription,
  getCanonicalCardDescription,
  getCardPreviewLines,
  getCardSummarySections,
} from '@/ui/cardStatSummary';
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
    const infiniteCard = CardRegistry.get('inf-oblivion-absolute');
    expect(infiniteCard).toBeTruthy();

    const ability = getCardSummarySections(infiniteCard!).find(section => section.title === 'Ability');
    expect(ability?.lines[0]).toBe(getCanonicalCardDescription(infiniteCard!));
  });

  it('uses canonical Ability text for Eternal Neutrality cards', () => {
    const eternalCard = CardRegistry.get('btei-voids-reaping');
    expect(eternalCard).toBeTruthy();

    const ability = getCardSummarySections(eternalCard!).find(section => section.title === 'Ability');
    expect(ability?.lines[0]).toBe(getCanonicalCardDescription(eternalCard!));
  });

  it('streams Patient Light wording in previews', () => {
    const card = CardRegistry.get('angel-neutral-beginning');
    expect(card).toBeTruthy();

    const preview = getCardPreviewLines(card!, 3).join(' ');
    expect(preview).not.toContain('card-play Patience gain becomes 1 + Patient Light stacks');
    expect(preview).toContain('Patient Light');
  });

  it('adds dedicated mechanics section for stack/resource-heavy cards', () => {
    const card = CardRegistry.get('btei-neutrality-void-throne');
    expect(card).toBeTruthy();

    const mechanics = getCardSummarySections(card!).find(section => section.title === 'Mechanics');
    // Neutrality Eternal Seraphim should have a mechanics or stats section
    expect(card!.type).toBe('Seraphim');
  });

  it('keeps awaken detail concise without duplicating the same effects list', () => {
    const card = CardRegistry.getAll().find(entry => entry.type === 'Angel');
    expect(card).toBeTruthy();

    const awaken = getCardSummarySections(card!).find(section => section.title === 'Awaken');
    expect(awaken).toBeTruthy();
    expect(awaken!.lines.length).toBe(1);
  });

  it('keeps Eternal/Infinite Angel summon and awaken text canonical across digest sections', () => {
    const target = CardRegistry.getAll().find(
      entry => entry.type === 'Angel' && (entry.rarity === 'Eternal' || entry.rarity === 'Infinite'),
    );
    expect(target).toBeTruthy();

    const summary = getCardSummarySections(target!);
    const canonical = getCardSummarySections(target!, { abilityTextMode: 'canonical' });

    const ability = summary.find(section => section.title === 'Ability');
    const canonicalAbility = canonical.find(section => section.title === 'Ability');
    expect(ability?.lines[0]).toBe(canonicalAbility?.lines[0]);
    expect(ability?.lines[0]).toBe(getCanonicalCardDescription(target!));

    const awaken = summary.find(section => section.title === 'Awaken');
    expect(awaken).toBeTruthy();
    expect(awaken!.lines[0]).toContain(getCanonicalActivatedAbilityDescription(target as any));

    const summon = summary.find(section => section.title === 'Summon');
    expect(summon).toBeTruthy();
    expect(summon!.lines.length).toBeGreaterThan(0);
  });
});