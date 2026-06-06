import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';

function extractEffects(definitionId: string): Array<{ type: string; [key: string]: unknown }> {
  const card = CardRegistry.get(definitionId);
  if (!card) return [];

  const effects: Array<{ type: string; [key: string]: unknown }> = [];

  if (card.type === 'Ophanim') {
    effects.push(...card.effects);
  }

  if (card.type === 'Cherubim') {
    effects.push(...card.effects);
    effects.push(...card.onPlayEffects);
  }

  if (card.type === 'Seraphim') {
    effects.push(...card.onPlayEffects);
  }

  if (card.type === 'Angel') {
    effects.push(...card.onSummonEffects);
    effects.push(...card.activatedAbility.effects);
  }

  return effects;
}

function hasEffectTypeRecursive(
  effects: ReadonlyArray<{ type: string; then?: ReadonlyArray<{ type: string }> }>,
  type: string,
): boolean {
  for (const effect of effects) {
    if (effect.type === type) return true;
    if (effect.type === 'conditional' && effect.then && hasEffectTypeRecursive(effect.then, type)) return true;
  }
  return false;
}

describe('Thornbound Eternity and Infinity Briar Spiral wiring', () => {
  it('keeps Briar Spiral on every Thornbound Eternity card in the package', () => {
    const ids = [
      'btei-thornbound-briar-siege',
      'btei-thornbound-red-march',
      'btei-thornbound-cathedral-lancer',
      'btei-thornbound-funeral-bramble',
      'btei-thornbound-gallowcrown-matron',
    ];

    for (const id of ids) {
      const effects = extractEffects(id);
      expect(
        hasEffectTypeRecursive(effects, 'set_secondary_gain') || hasEffectTypeRecursive(effects, 'thorn_briar_spiral_bloom'),
      ).toBe(true);
    }
  });

  it('keeps Thornbound Infinity payoffs wired to bloom Spirals', () => {
    const ids = ['inf-thornbound-last-procession', 'inf-thorn-widow-engine', 'inf-thornbound-elegy-titan'];

    for (const id of ids) {
      const effects = extractEffects(id);
      expect(hasEffectTypeRecursive(effects, 'thorn_briar_spiral_bloom')).toBe(true);
    }
  });

  it('keeps Thornbound Infinity cards mechanically distinct from each other', () => {
    const forge = extractEffects('inf-gravebloom-singularity');
    const refinery = extractEffects('inf-thornbound-last-procession');
    const surge = extractEffects('inf-thorn-widow-engine');
    const finisher = extractEffects('inf-thornbound-elegy-titan');

    expect(hasEffectTypeRecursive(forge, 'set_secondary_gain')).toBe(true);
    expect(hasEffectTypeRecursive(forge, 'thorn_briar_spiral_bloom')).toBe(false);

    expect(hasEffectTypeRecursive(refinery, 'set_secondary_spend')).toBe(true);
    expect(hasEffectTypeRecursive(refinery, 'draw')).toBe(true);
    expect(hasEffectTypeRecursive(refinery, 'eternal_stack_cashout')).toBe(false);

    expect(hasEffectTypeRecursive(surge, 'thorn_briar_spiral_bloom')).toBe(true);
    expect(hasEffectTypeRecursive(surge, 'score_multiplier')).toBe(true);
    expect(hasEffectTypeRecursive(surge, 'trail_gain')).toBe(true);

    expect(hasEffectTypeRecursive(finisher, 'thorn_briar_spiral_bloom')).toBe(true);
    expect(hasEffectTypeRecursive(finisher, 'set_secondary_spend')).toBe(true);
    expect(hasEffectTypeRecursive(finisher, 'eternal_stack_cashout')).toBe(false);
  });
});
