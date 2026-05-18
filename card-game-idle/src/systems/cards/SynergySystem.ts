import type { BoardState } from '@/types/game';
import type { SeraphimInstance } from '@/types/cards';
import { CardRegistry } from '@/cards/CardRegistry';

function hasMatchingAngel(
  board: BoardState,
  requiredElement: SeraphimInstance['element'],
): boolean {
  return board.frontSlots.some(slot => (
    slot !== null
    && slot.type === 'Angel'
    && slot.element === requiredElement
  ));
}

export class SynergySystem {
  static computeActiveSlots(board: BoardState): BoardState['frontSlots'] {
    return board.frontSlots.map((slot) => {
      if (!slot || slot.type !== 'Seraphim') return slot;
      const def = CardRegistry.get(slot.definitionId);
      const requirement = def?.type === 'Seraphim' ? def.baseStats.synergyRequirement : slot.element;
      return {
        ...slot,
        isActive: hasMatchingAngel(board, requirement),
      };
    }) as BoardState['frontSlots'];
  }

  static countActiveSynergies(board: BoardState): number {
    return board.frontSlots.filter(
      (s): s is SeraphimInstance => s?.type === 'Seraphim' && s.isActive
    ).length;
  }
}
