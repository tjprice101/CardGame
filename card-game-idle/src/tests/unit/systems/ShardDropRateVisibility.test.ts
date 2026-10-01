import { describe, expect, it } from 'vitest';
import { FORGE_EVENT_BOSS_IDS, areShardDropRatesVisible, formatShardDropChance } from '@/data/forge/forgeDefinitions';

describe('Shard of Transcendence drop-rate visibility', () => {
  const allCleared = Object.fromEntries(FORGE_EVENT_BOSS_IDS.map(id => [id, { firstClearAt: 1 }]));

  it('requires both every Causality boss cleared and the Forge opened', () => {
    expect(areShardDropRatesVisible({ forgeOfTranscendenceUnlocked: false, bossCodex: allCleared })).toBe(false);
    expect(areShardDropRatesVisible({ forgeOfTranscendenceUnlocked: true, bossCodex: {} })).toBe(false);
    expect(areShardDropRatesVisible({ forgeOfTranscendenceUnlocked: true, bossCodex: allCleared })).toBe(true);
  });

  it('formats the base and fight-scaled chance', () => {
    expect(formatShardDropChance()).toBe('0.1%');
    expect(formatShardDropChance(3)).toBe('0.3%');
  });
});
