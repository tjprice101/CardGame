import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { getCardCategoryKey } from '@/data/elements';
import type { CardDefinition } from '@/types/cards';

const EXPECTED_SET_KEYS = [
  'AbyssalForge',
  'BlazingGarden',
  'Butterfly',
  'Dark',
  'DeathFlamedHell',
  'EternalSeas',
  'Fire',
  'GlassAbsolute',
  'Light',
  'Mechanical',
  'Neutrality',
  'Prismatic',
  'SnowboundVoltage',
  'Thornbound',
  'WishedUponAStar',
] as const;

function maxAttackDps(def: CardDefinition): number {
  if (def.type === 'Seraphim' && def.attacks) {
    const unsyn = def.attacks.unsynergized.baseOblivion / Math.max(1, def.attacks.unsynergized.cooldownCards);
    const syn = def.attacks.synergized.baseOblivion / Math.max(1, def.attacks.synergized.cooldownCards);
    return Math.max(unsyn, syn);
  }

  if (def.type === 'Angel' && def.attacks) {
    const primary = def.attacks.primary.baseOblivion / Math.max(1, def.attacks.primary.cooldownCards);
    const exalted = def.attacks.exalted.baseOblivion / Math.max(1, def.attacks.exalted.cooldownCards);
    return Math.max(primary, exalted);
  }

  return 0;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

describe('card set outlier audit', () => {
  it('covers all 15 authored card sets', () => {
    const categories = new Set(
      CardRegistry.getAll().map(card => getCardCategoryKey(card)),
    );

    for (const setKey of EXPECTED_SET_KEYS) {
      expect(categories.has(setKey), `Missing set category ${setKey}`).toBe(true);
    }
  });

  it('keeps Seraphim and Angel DPS bounded inside each set bucket', () => {
    const combatCards = CardRegistry.getAll().filter(
      card => card.type === 'Seraphim' || card.type === 'Angel',
    );

    const buckets = new Map<string, number[]>();
    const auditedSetKeys = new Set<string>();
    for (const card of combatCards) {
      const dps = maxAttackDps(card);
      if (dps <= 0) continue;
      const setKey = getCardCategoryKey(card);
      if (!EXPECTED_SET_KEYS.includes(setKey as (typeof EXPECTED_SET_KEYS)[number])) continue;
      auditedSetKeys.add(setKey);
      const key = `${setKey}:${card.type}`;
      const existing = buckets.get(key) ?? [];
      existing.push(dps);
      buckets.set(key, existing);
    }

    for (const setKey of EXPECTED_SET_KEYS) {
      expect(auditedSetKeys.has(setKey), `No combat card audit bucket for ${setKey}`).toBe(true);
    }

    for (const [key, values] of buckets) {
      if (values.length < 3) continue;
      const med = median(values);
      const max = Math.max(...values);
      const ceiling = Math.max(med * 3.8, med + 260);
      expect(max, `Outlier in ${key}`).toBeLessThanOrEqual(Math.ceil(ceiling));
    }
  });

  it('keeps Genesis Throne tuned under its Neutrality Infinite peer spike', () => {
    const genesis = CardRegistry.get('inf-genesis-throne');
    const nullApex = CardRegistry.get('inf-null-apex');

    expect(genesis?.type).toBe('Seraphim');
    expect(nullApex?.type).toBe('Seraphim');

    const genesisDps = maxAttackDps(genesis!);
    const nullApexDps = maxAttackDps(nullApex!);
    expect(genesisDps).toBeLessThanOrEqual(nullApexDps);
  });
});
