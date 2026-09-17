import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const handPath = join(process.cwd(), 'src/ui/hud/HandDisplay.tsx');
const boardPath = join(process.cwd(), 'src/ui/hud/BoardDisplay.tsx');
const collectionPath = join(process.cwd(), 'src/ui/store/CollectionViewer.tsx');
const deckBuilderPath = join(process.cwd(), 'src/ui/deck/DeckBuilder.tsx');
const previewPaths = [
  'src/ui/store/CollectionCardDetail.tsx',
  'src/ui/store/PackOpeningModal.tsx',
  'src/ui/store/CardPackStore.tsx',
  'src/ui/infinitude/Infinitude.tsx',
  'src/ui/eternitysWake/EternitysWake.tsx',
  'src/ui/eternitysWake/BossResultModal.tsx',
  'src/ui/menus/FractureModal.tsx',
  'src/ui/profile/SignatureCardPickerModal.tsx',
  'src/ui/player/PlayerInformationPage.tsx',
  'src/ui/social/FriendProfileModal.tsx',
];

describe('live card face rendering', () => {
  it('uses the same composed art and shimmer helpers in hand and on board', () => {
    const handSource = readFileSync(handPath, 'utf8');
    const boardSource = readFileSync(boardPath, 'utf8');

    expect(handSource).toContain("getLiveCardFaceBackgroundStyle(def, deckCard.finish, 'front')");
    expect(boardSource).toContain('getLiveCardFaceBackgroundStyle(mainDef, mainCard.finish, mainCard.faceState)');
    expect(handSource).toContain("getLiveCardShimmerClassName(def, deckCard.finish, 'front')");
    expect(boardSource).toContain('getLiveCardShimmerClassName(mainDef, mainCard.finish, mainCard.faceState)');
    expect(handSource).not.toContain("getLiveCardFaceBackgroundStyle(def, deckCard.finish, 'front', true)");
  });

  it('renders face chrome only for face-up back-row cards', () => {
    const boardSource = readFileSync(boardPath, 'utf8');

    expect(boardSource).toContain('{isAin && (');
    expect(boardSource).toContain("getCardNameRibbonStyle('boardMini')");
    expect(boardSource).toContain("getCardRulesPanelStyle('boardMini')");
  });

  it('keeps Collection and Deck Builder on the complete shared composition', () => {
    const collectionSource = readFileSync(collectionPath, 'utf8');
    const deckBuilderSource = readFileSync(deckBuilderPath, 'utf8');

    expect(collectionSource).toContain("getLiveCardFaceBackgroundStyle(card, finish, 'front')");
    expect(collectionSource).toContain('getLiveCardShimmerClassName');
    expect(collectionSource).not.toContain('holofoil-menu-card');
    expect(collectionSource).not.toContain('const artUrl = owned > 0 ? getCardBackgroundUrl(card)');

    expect(deckBuilderSource).toContain("getLiveCardFaceBackgroundStyle(def.def, def.finish, 'front')");
    expect(deckBuilderSource).toContain("getLiveCardFaceBackgroundStyle(def, entry.finish, 'front')");
    expect(deckBuilderSource).toContain('getLiveCardShimmerClassName');
    expect(deckBuilderSource).not.toContain('holofoil-menu-card');
    expect(deckBuilderSource).not.toContain('DeferredCardArt');
  });

  it('keeps every preview surface on the same canonical foil path', () => {
    for (const relativePath of previewPaths) {
      const source = readFileSync(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).toContain('getLiveCardFaceBackgroundStyle');
      expect(source, relativePath).toContain('getLiveCardShimmerClassName');
      expect(source, relativePath).not.toContain('holofoil-menu-card');
      expect(source, relativePath).not.toContain('holofoil-live-card');
    }
  });

  it('keeps the Collection virtual list inside a bounded wheelable flex viewport', () => {
    const collectionSource = readFileSync(collectionPath, 'utf8');
    expect(collectionSource).toContain("flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden'");
    expect(collectionSource).toContain("style={{ height: '100%', minHeight: 0, overscrollBehavior: 'contain', touchAction: 'pan-y' }}");
  });
});