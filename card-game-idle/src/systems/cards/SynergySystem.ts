import type { BoardState } from '@/types/game';
import type { AngelInstance, SeraphimInstance } from '@/types/cards';

export class SynergySystem {
  static computeActiveSlots(board: BoardState): BoardState['frontSlots'] {
    const angels = board.frontSlots.filter((s): s is AngelInstance => s?.type === 'Angel');
    const universalSynergy = angels.some(a => a.element === 'Neutrality');

    return board.frontSlots.map(slot => {
      if (!slot || slot.type !== 'Seraphim') return slot;
      const isActive = universalSynergy || angels.some(a => a.element === slot.element);
      return { ...slot, isActive };
    }) as BoardState['frontSlots'];
  }

  static countActiveSynergies(board: BoardState): number {
    const angels = board.frontSlots.filter((s): s is AngelInstance => s?.type === 'Angel');
    if (angels.length === 0) return 0;
    const universalSynergy = angels.some(a => a.element === 'Neutrality');
    return board.frontSlots.filter(
      (s): s is SeraphimInstance =>
        s?.type === 'Seraphim' &&
        (universalSynergy || angels.some(a => a.element === s.element))
    ).length;
  }
}
