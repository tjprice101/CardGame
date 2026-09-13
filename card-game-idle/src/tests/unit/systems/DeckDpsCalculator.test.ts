import { describe, expect, it } from 'vitest';
import { calculateDeckDpsProjection, ESTIMATED_FIGHT_SECONDS } from '@/systems/cards/DeckDpsCalculator';
import { STARTER_DECK_LIST, STARTER_EXTRA_DECK } from '@/systems/progression/StarterDeck';

describe('DeckDpsCalculator', () => {
  it('returns zero projection for an empty deck', () => {
    const projection = calculateDeckDpsProjection([], [], undefined, 0);
    expect(projection.threeMinuteDamage).toBe(0);
    expect(projection.dps).toBe(0);
    expect(projection.lightAttackDamage).toBe(0);
    expect(projection.sophAttackDamage).toBe(0);
  });

  it('calculates a positive DPS and 3-minute damage for the Starter Neutrality deck', () => {
    const projection = calculateDeckDpsProjection(
      STARTER_DECK_LIST,
      STARTER_EXTRA_DECK,
      { 1: 'neutralizing-inferno', 2: 'nullified-barricade' },
      100,
    );
    expect(projection.threeMinuteDamage).toBeGreaterThan(10_000);
    expect(projection.dps).toBe(Math.round(projection.threeMinuteDamage / ESTIMATED_FIGHT_SECONDS));
    expect(projection.lightAttackDamage).toBeGreaterThan(0);
    expect(projection.sophAttackDamage).toBeGreaterThan(0);
    expect(projection.asaBridgeDamage).toBeGreaterThan(0);
    expect(projection.abilityDamage).toBeGreaterThan(0);
  });

  it('scales projected damage higher when Collection Power and endgame cards increase', () => {
    const base = calculateDeckDpsProjection(
      STARTER_DECK_LIST,
      STARTER_EXTRA_DECK,
      undefined,
      0,
    );
    const boosted = calculateDeckDpsProjection(
      STARTER_DECK_LIST,
      STARTER_EXTRA_DECK,
      undefined,
      10_000,
    );
    expect(boosted.threeMinuteDamage).toBeGreaterThan(base.threeMinuteDamage);
    expect(boosted.dps).toBeGreaterThan(base.dps);
  });
});
