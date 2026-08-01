import type { BoardState } from '@/types/game';
import type { SeraphimInstance } from '@/types/cards';

function hasAnyAngel(board: BoardState): boolean {
  return board.frontSlots.some(slot => slot !== null && slot.type === 'Angel');
}

export class SynergySystem {
  static computeActiveSlots(board: BoardState): BoardState['frontSlots'] {
    const angelPresent = hasAnyAngel(board);
    return board.frontSlots.map((slot) => {
      if (!slot || slot.type !== 'Seraphim') return slot;
      return {
        ...slot,
        isActive: angelPresent,
      };
    }) as BoardState['frontSlots'];
  }

  static countActiveSynergies(board: BoardState): number {
    return board.frontSlots.filter(
      (s): s is SeraphimInstance => s?.type === 'Seraphim' && s.isActive
    ).length;
  }
}
