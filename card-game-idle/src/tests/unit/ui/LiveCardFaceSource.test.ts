import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const handPath = join(process.cwd(), 'src/ui/hud/HandDisplay.tsx');
const boardPath = join(process.cwd(), 'src/ui/hud/BoardDisplay.tsx');
const collectionPath = join(process.cwd(), 'src/ui/store/CollectionViewer.tsx');
const deckBuilderPath = join(process.cwd(), 'src/ui/deck/DeckBuilder.tsx');

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

    expect(collectionSource).toContain("getDenseCardFaceBackgroundStyle(card, finish, 'front')");
    expect(collectionSource).not.toContain("getDenseCardFaceBackgroundStyle(card, finish, 'front', true)");
    expect(collectionSource).not.toContain('const artUrl = owned > 0 ? getCardBackgroundUrl(card)');

    expect(deckBuilderSource).toContain("getDenseCardFaceBackgroundStyle(def.def, def.finish, 'front')");
    expect(deckBuilderSource).toContain("getDenseCardFaceBackgroundStyle(def, entry.finish, 'front')");
    expect(deckBuilderSource).not.toContain("getDenseCardFaceBackgroundStyle(def.def, def.finish, 'front', true)");
    expect(deckBuilderSource).not.toContain('DeferredCardArt');
  });
});