import { CardRegistry } from '@/cards/CardRegistry';
import type { PackDefinition } from '@/data/packs/packDefinitions';

export class PackSystem {
  static open(pack: PackDefinition): string[] {
    const defs = pack.cardPool
      .map(id => CardRegistry.get(id))
      .filter(Boolean);

    const byRarity: Record<string, string[]> = {
      Common: [],
      Rare: [],
      Epic: [],
      Legendary: [],
    };

    for (const def of defs) {
      if (def && def.rarity in byRarity) {
        byRarity[def.rarity].push(def.definitionId);
      }
    }

    const result: string[] = [];
    const usedInPack = new Set<string>();

    for (let i = 0; i < pack.cardsPerOpen; i++) {
      const rarity = PackSystem.rollRarity();
      const order: string[] = [rarity, 'Legendary', 'Epic', 'Rare', 'Common'].filter(
        (r, idx, arr) => arr.indexOf(r) === idx
      );

      let picked: string | null = null;
      for (const r of order) {
        const available = byRarity[r].filter(id => !usedInPack.has(id));
        if (available.length > 0) {
          picked = available[Math.floor(Math.random() * available.length)];
          break;
        }
      }

      if (picked) {
        result.push(picked);
        usedInPack.add(picked);
      }
    }

    return result;
  }

  private static rollRarity(): string {
    const roll = Math.random() * 100;
    if (roll < 2) return 'Legendary';
    if (roll < 10) return 'Epic';
    if (roll < 40) return 'Rare';
    return 'Common';
  }
}
