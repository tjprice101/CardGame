import type { AngelDefinition, AngelInstance, CardFinish } from '@/types/cards';

let instanceCounter = 0;
function nextId(): string {
  return `inst_${Date.now()}_${++instanceCounter}`;
}

export const CardFactory = {
  create(def: AngelDefinition, finish: CardFinish = 'normal'): AngelInstance {
    return {
      instanceId: nextId(),
      definitionId: def.definitionId,
      type: 'Angel',
      element: def.element,
      rarity: def.rarity,
      finish,
      prismaticDepth: def.prismaticDepth,
      spectrumTokens: 0,
      level: 1,
      cardsPlayedSinceSummon: 0,
      activated: false,
      attackCooldowns: {},
      boardSlot: null,
    };
  },
};
