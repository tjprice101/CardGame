import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const modalPath = join(process.cwd(), 'src/ui/hud/PendingEffectModal.tsx');

describe('PendingEffectModal card faces', () => {
  it('renders selectable cards face-up instead of inheriting deck back-state', () => {
    const source = readFileSync(modalPath, 'utf8');

    expect(source).toContain("getCardFaceBackgroundStyle(CardRegistry.get(card.definitionId), card.finish, 'front')");
    expect(source).not.toContain('getCardFaceBackgroundStyle(CardRegistry.get(card.definitionId), card.finish, card.faceState)');
  });
});
