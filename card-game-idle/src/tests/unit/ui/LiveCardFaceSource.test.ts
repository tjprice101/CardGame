import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const handPath = join(process.cwd(), 'src/ui/hud/HandDisplay.tsx');
const boardPath = join(process.cwd(), 'src/ui/hud/BoardDisplay.tsx');

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
});