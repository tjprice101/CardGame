import type { CardDefinition } from '@/types/cards';
import { lightAngels } from '@/data/cards/lightAngels';
import { lightHRCards } from '@/data/cards/lightHRCards';
import { lightSeraphims } from '@/data/cards/lightSeraphims';
import { neutralityAngels } from '@/data/cards/neutralityAngel';
import { neutralityCards } from '@/data/cards/neutralityCards';
import { neutralityChaosCards } from '@/data/cards/neutralityChaosCards';
import { pyroabyssAngels } from '@/data/cards/pyroabyssAngels';
import { pyroabyssSeraphims, pyroabyssSeekerCards } from '@/data/cards/pyroabyssCards';
import { pyroabyssChaosCards } from '@/data/cards/pyroabyssChaosCards';
import { eternalCards } from '@/data/cards/eternalCards';
import { ScoreSystem } from '@/systems/scoring/ScoreSystem';

const registry = new Map<string, CardDefinition>();

function registerAll(defs: CardDefinition[]): void {
  for (const def of defs) {
    registry.set(def.definitionId, def);
  }
}

registerAll(lightAngels as unknown as CardDefinition[]);
registerAll(lightHRCards as unknown as CardDefinition[]);
registerAll(lightSeraphims as unknown as CardDefinition[]);
registerAll(neutralityAngels as unknown as CardDefinition[]);
registerAll(neutralityCards as unknown as CardDefinition[]);
registerAll(neutralityChaosCards as unknown as CardDefinition[]);
registerAll(pyroabyssAngels as unknown as CardDefinition[]);
registerAll(pyroabyssSeraphims as unknown as CardDefinition[]);
registerAll(pyroabyssSeekerCards as unknown as CardDefinition[]);
registerAll(pyroabyssChaosCards as unknown as CardDefinition[]);
registerAll(eternalCards as unknown as CardDefinition[]);

ScoreSystem.getDefinition = (id: string) => registry.get(id);

export const CardRegistry = {
  get: (id: string): CardDefinition | undefined => registry.get(id),
  getAll: (): CardDefinition[] => Array.from(registry.values()),
  getByType: (type: CardDefinition['type']): CardDefinition[] =>
    Array.from(registry.values()).filter(d => d.type === type),
  has: (id: string): boolean => registry.has(id),
};
