import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const modalPath = join(process.cwd(), 'src/ui/hud/PendingEffectModal.tsx');

describe('PendingEffectModal card faces', () => {
  it('renders selectable cards face-up instead of inheriting deck back-state', () => {
    const source = readFileSync(modalPath, 'utf8');
    expect(source).toContain("position: 'relative',");
    expect(source).toContain("background: warmTheme.surface");
    expect(source).not.toContain('getLiveCardFaceBackgroundStyle(CardRegistry.get(card.definitionId), card.finish, card.faceState)');

    expect(source).toContain("getLiveCardFaceBackgroundStyle(CardRegistry.get(card.definitionId), card.finish, 'front')");
    expect(source).not.toContain('getLiveCardFaceBackgroundStyle(CardRegistry.get(card.definitionId), card.finish, card.faceState)');
  });

  it('uses a positioned card surface for the animated foil pseudo-element', () => {
    const animationSource = readFileSync(join(process.cwd(), 'src/styles/animations.css'), 'utf8');
    expect(animationSource).toContain('.live-card-shimmer {');
    expect(animationSource).toContain('position: relative;');
    expect(animationSource).toContain('contain: paint;');
  });
});
