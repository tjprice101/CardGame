import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import type { AngelDefinition } from '@/types/cards';
import { getCardCategoryKey } from '@/data/elements';

describe('angel summon material uniqueness audit', () => {
  it('keeps non-empty summon material combinations unique across angels', () => {
    const angels = CardRegistry.getByType('Angel') as AngelDefinition[];
    const byMaterialFingerprint = new Map<string, string[]>();

    for (const angel of angels) {
      if ((angel.summonCost ?? []).length === 0) continue;
      const fingerprint = [...angel.summonCost].sort().join('|');
      byMaterialFingerprint.set(fingerprint, [...(byMaterialFingerprint.get(fingerprint) ?? []), angel.definitionId]);
    }

    const duplicateGroups = [...byMaterialFingerprint.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([materials, ids]) => ({ materials, ids }))
      .sort((a, b) => a.materials.localeCompare(b.materials));

    expect(duplicateGroups).toEqual([]);
  });

  it('keeps every angel summon cost non-empty and within its own set', () => {
    const angels = CardRegistry.getByType('Angel') as AngelDefinition[];
    const violations: Array<{ angel: string; material: string }> = [];

    for (const angel of angels) {
      expect((angel.summonCost ?? []).length, `${angel.definitionId} should have summon materials`).toBeGreaterThan(0);

      for (const materialId of angel.summonCost ?? []) {
        const material = CardRegistry.get(materialId);
        if (!material) {
          violations.push({ angel: angel.definitionId, material: materialId });
          continue;
        }
        if (getCardCategoryKey(material) !== getCardCategoryKey(angel)) {
          violations.push({ angel: angel.definitionId, material: materialId });
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('keeps Neutrality Aegis angels on distinct summon materials', () => {
    const presence = CardRegistry.get('angel-neutral-presence') as AngelDefinition | undefined;
    const equilibrium = CardRegistry.get('angel-neutral-equilibrium') as AngelDefinition | undefined;

    expect(presence?.summonCost).toBeDefined();
    expect(equilibrium?.summonCost).toBeDefined();
    expect([...(presence?.summonCost ?? [])].sort()).not.toEqual([...(equilibrium?.summonCost ?? [])].sort());
  });
});
