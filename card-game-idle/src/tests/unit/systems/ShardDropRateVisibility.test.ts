import { describe, expect, it } from 'vitest';
import { FORGE_EVENT_BOSS_IDS, areShardDropRatesVisible, formatShardDropChance, rollShardOfTranscendence } from '@/data/forge/forgeDefinitions';

describe('Shard of Transcendence drop-rate visibility', () => {
  const allCleared = Object.fromEntries(FORGE_EVENT_BOSS_IDS.map(id => [id, { firstClearAt: 1 }]));

  it('requires both every Causality boss cleared and the Forge opened', () => {
    expect(areShardDropRatesVisible({ forgeOfTranscendenceUnlocked: false, bossCodex: allCleared })).toBe(false);
    expect(areShardDropRatesVisible({ forgeOfTranscendenceUnlocked: true, bossCodex: {} })).toBe(false);
    expect(areShardDropRatesVisible({ forgeOfTranscendenceUnlocked: true, bossCodex: allCleared })).toBe(true);
  });

  it('formats the base and fight-scaled chance at 1% per fight', () => {
    expect(formatShardDropChance()).toBe('1%');
    expect(formatShardDropChance(3)).toBe('3%');
  });

  it('drops in quantities of 1, 2, or 3 when the drop roll triggers', () => {
    const quantities = new Set<number>();
    // Using a large variant multiplier to trigger drops reliably for testing
    for (let i = 0; i < 500; i++) {
      const rolled = rollShardOfTranscendence(100);
      expect([1, 2, 3]).toContain(rolled);
      quantities.add(rolled);
    }
    expect(quantities.has(1)).toBe(true);
    expect(quantities.has(2)).toBe(true);
    expect(quantities.has(3)).toBe(true);
  });
});
