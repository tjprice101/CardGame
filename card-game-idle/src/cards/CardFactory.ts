import type { AngelDefinition, AngelInstance } from '@/types/cards';

let instanceCounter = 0;
function nextId(): string {
  return `inst_${Date.now()}_${++instanceCounter}`;
}

export const CardFactory = {
  create(def: AngelDefinition): AngelInstance {
    return {
      instanceId: nextId(),
      definitionId: def.definitionId,
      type: 'Angel',
      element: def.element,
      rarity: def.rarity,
      level: 1,
      boardSlot: null,
    };
  },
};
