import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { defaultGameState } from '@/state/store';
import type { AttackSequenceState } from '@/types/game';
import { getAttackSequenceStars } from '@/systems/cards/AttackSequence';
import { ATTACK_STAR_COLORS, getPremiumAttackTheme } from '@/ui/attackVisuals';
import AttackSequenceOverlay from '@/ui/hud/AttackSequenceOverlay';

const fixture = vi.hoisted(() => ({ sequence: null as AttackSequenceState | null }));
vi.mock('@/state/store', async importOriginal => {
  const actual = await importOriginal<typeof import('@/state/store')>();
  return {
    ...actual,
    useStore: (selector: (state: { turn: typeof actual.defaultGameState.turn }) => unknown) =>
      selector({ turn: { ...actual.defaultGameState.turn, attackSequence: fixture.sequence } }),
  };
});

describe('rarity-specific attack visuals', () => {
  for (const rarity of ['Infinite', 'Eternal', 'Transcendent'] as const) {
    it.each(['ain', 'soph', 'bridge'] as const)(`${rarity} themes %s stars and fields`, kind => {
      const card = CardRegistry.getAll().find(definition => definition.rarity === rarity);
      if (!card) throw new Error(`Missing ${rarity} fixture`);
      const theme = getPremiumAttackTheme(card)!;
      fixture.sequence = {
        kind, phase: 'active', phaseEndsAt: Date.now() + 3_000, pauseStartedAt: Date.now(),
        cardInstanceId: 'visual-test', cardDefinitionId: card.definitionId, cardFinish: 'holo',
        stars: getAttackSequenceStars(card.definitionId, kind), clickedStarIds: [],
        basePayout: 100, payout: 0, multiplier: 1, stackSpend: 0,
      };
      const container = document.createElement('div');
      container.innerHTML = renderToStaticMarkup(createElement(AttackSequenceOverlay));
      expect(container.querySelector(`.attack-sequence-theme-${theme}`)).not.toBeNull();
      const stars = container.querySelectorAll<HTMLElement>('.shatter-ambient-star');
      expect(stars).toHaveLength(90);
      expect(new Set([...stars].map(star => star.style.color)).size).toBe(ATTACK_STAR_COLORS[theme].length);
      expect(container.querySelectorAll('.attack-sequence-star-guide')).toHaveLength(fixture.sequence.stars.length);
      expect(container.querySelectorAll('.attack-sequence-wisps i')).toHaveLength(rarity === 'Transcendent' ? 4 : 0);
      expect(container.querySelector('.attack-sequence-orbit-target')).not.toBeNull();
    });
  }

  it('keeps the existing look for non-premium cards and missing definitions', () => {
    expect(getPremiumAttackTheme(undefined)).toBeNull();
    for (const card of CardRegistry.getAll().filter(card => !['Infinite', 'Eternal', 'Transcendent'].includes(card.rarity))) {
      expect(getPremiumAttackTheme(card), card.definitionId).toBeNull();
    }
    expect(defaultGameState.turn.attackSequence).toBeFalsy();
  });
});
