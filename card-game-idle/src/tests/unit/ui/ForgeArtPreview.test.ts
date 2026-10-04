import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { FORGE_CARD_LORE } from '@/data/forge/forgeDefinitions';
import { getCardBackgroundUrl, getLiveCardFaceBackgroundStyle, getLiveCardShimmerClassName } from '@/ui/cardBackgrounds';

describe('Forge complete artwork preview', () => {
  it('resolves the supplied full-art image for each gallery entry', () => {
    for (const entry of FORGE_CARD_LORE) {
      const url = getCardBackgroundUrl(CardRegistry.get(entry.definitionId));
      expect(url, entry.definitionId).not.toBeNull();
      expect(entry.bannerGradient).toContain(url!);
    }
  });

  it('uses the same framed holofoil composition and shimmer as hand, board and Deck Builder', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'ui', 'forge', 'ForgeOfTranscendence.tsx'), 'utf8');
    expect(source).toContain("...getLiveCardFaceBackgroundStyle(selectedDef, 'holo', 'front')");
    expect(source).toContain("getLiveCardShimmerClassName(selectedDef, 'holo', 'front')");
    expect(source).not.toContain('backgroundImage: selectedLore?.bannerGradient');
    for (const entry of FORGE_CARD_LORE) {
      const card = CardRegistry.get(entry.definitionId);
      const style = getLiveCardFaceBackgroundStyle(card, 'holo', 'front');
      expect(style.backgroundImage).toContain(getCardBackgroundUrl(card)!);
      expect(style.backgroundImage).toContain('Transcendant%20Card%20Front%20Frame.png');
      expect(getLiveCardShimmerClassName(card, 'holo', 'front')).toBe('live-card-shimmer live-card-shimmer-transcendent');
    }
  });
});
