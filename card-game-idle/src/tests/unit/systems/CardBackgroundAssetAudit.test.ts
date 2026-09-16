import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { infiniteCards } from '@/data/cards/infiniteCards';
import {
  getCardArtTopBottomBorderOverlayStyleForCard,
  getCardBackgroundUrl,
  getCardFaceBackgroundStyle,
  getLiveCardFaceBackgroundStyle,
  getLiveCardShimmerClassName,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '');
}

function getSuggestedMatch(dirPath: string, fileName: string): string | null {
  if (!existsSync(dirPath)) return null;
  const target = normalizeName(fileName);
  const files = readdirSync(dirPath);
  const exact = files.find(entry => normalizeName(entry) === target);
  if (exact) return exact;
  const loose = files.find(entry => normalizeName(entry).includes(target) || target.includes(normalizeName(entry)));
  return loose ?? null;
}

describe('card background asset audit', () => {
  it('resolves every registered card to an existing background file', () => {
    const root = path.resolve(process.cwd(), 'public');
    const missing: string[] = [];

    for (const card of CardRegistry.getAll()) {
      const url = getCardBackgroundUrl(card);
      if (!url) {
        missing.push(`${card.definitionId}: no background URL`);
        continue;
      }

      const relPath = decodeURI(url.replace(/^\/?/, ''));
      const absPath = path.resolve(root, relPath.replace(/^assets[\\/]/, 'assets/'));
      if (existsSync(absPath)) continue;

      const dirPath = path.dirname(absPath);
      const fileName = path.basename(absPath);
      const suggestion = getSuggestedMatch(dirPath, fileName);
      missing.push(
        suggestion
          ? `${card.definitionId}: missing ${fileName} (suggested: ${suggestion})`
          : `${card.definitionId}: missing ${fileName}`,
      );
    }

    expect(missing).toEqual([]);
  });

  it('keeps holofoil, Enigmatic, Eternal, Infinite, and Transcendent bars visually distinct', () => {
    const byRarity = (rarity: 'Enigmatic' | 'Eternal' | 'Infinite' | 'Transcendent') => {
      if (rarity === 'Infinite') return infiniteCards[0] as unknown as Parameters<typeof getCardFaceBackgroundStyle>[0];
      const card = CardRegistry.getAll().find(candidate => candidate.rarity === rarity);
      expect(card, `${rarity} card`).toBeDefined();
      return card!;
    };
    const holoCard = CardRegistry.getAll().find(candidate =>
      candidate.rarity !== 'Enigmatic'
      && candidate.rarity !== 'Eternal'
      && candidate.rarity !== 'Infinite'
      && candidate.rarity !== 'Transcendent');
    expect(holoCard).toBeDefined();

    const treatments = [
      getCardFaceBackgroundStyle(holoCard, 'holo'),
      getCardFaceBackgroundStyle(byRarity('Enigmatic')),
      getCardFaceBackgroundStyle(byRarity('Eternal')),
      getCardFaceBackgroundStyle(byRarity('Infinite')),
      getCardFaceBackgroundStyle(byRarity('Transcendent')),
    ];
    const ribbons = treatments.map(style => style['--card-face-ribbon']);
    const panels = treatments.map(style => style['--card-face-panel']);
    expect(new Set(ribbons).size).toBe(5);
    expect(new Set(panels).size).toBe(5);
    expect(ribbons[0]).toBe('#861326');
    expect(ribbons[1]).toBe('#b8861b');
    expect(ribbons[2]).toBe('#32134f');
    expect(ribbons[3]).toBe('#12151e');
    expect(ribbons[4]).toBe('#7a0f31');

    expect(getCardNameRibbonStyle('grid').background).toContain('--card-face-ribbon');
    expect(getCardRulesPanelStyle('grid').background).toContain('--card-face-panel');
    const overlays = treatments.map((_, index) => getCardArtTopBottomBorderOverlayStyleForCard(
      index === 0 ? holoCard : [byRarity('Enigmatic'), byRarity('Eternal'), byRarity('Infinite'), byRarity('Transcendent')][index - 1],
    ).backgroundImage);
    expect(new Set(overlays).size).toBe(5);
  });

  it('uses one cached, lightweight live treatment for every foil rarity', () => {
    const cards = CardRegistry.getAll();
    const base = cards.find(card => !['Enigmatic', 'Eternal', 'Infinite', 'Transcendent'].includes(card.rarity));
    expect(base).toBeDefined();

    const cases = [
      { card: base!, finish: 'holo' as const, className: 'live-card-shimmer-holo' },
      { card: cards.find(card => card.rarity === 'Enigmatic')!, finish: 'normal' as const, className: 'live-card-shimmer-enigmatic' },
      { card: cards.find(card => card.rarity === 'Eternal')!, finish: 'normal' as const, className: 'live-card-shimmer-eternal' },
      { card: infiniteCards[0], finish: 'normal' as const, className: 'live-card-shimmer-infinite' },
      { card: cards.find(card => card.rarity === 'Transcendent')!, finish: 'normal' as const, className: 'live-card-shimmer-transcendent' },
    ];

    for (const entry of cases) {
      expect(entry.card).toBeDefined();
      const first = getLiveCardFaceBackgroundStyle(entry.card, entry.finish, 'front');
      const second = getLiveCardFaceBackgroundStyle(entry.card, entry.finish, 'front');
      expect(second).toBe(first);
      expect(first.animationName).toBeUndefined();
      expect(first.backgroundImage).toContain(getCardBackgroundUrl(entry.card));
      expect(getLiveCardShimmerClassName(entry.card, entry.finish, 'front')).toContain(entry.className);
    }

    expect(getLiveCardShimmerClassName(base, 'holo', 'back')).toBeUndefined();
    expect(getLiveCardFaceBackgroundStyle(base, 'holo', 'back').backgroundImage).toContain('Card%20Backing.png');
  });
});
