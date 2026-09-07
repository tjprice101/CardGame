import type { BoardState, ComputedBoardStats } from '@/types/game';

export class ScoreSystem {
  static compute(board: BoardState): ComputedBoardStats {
    const asaCount = board.frontSlots.filter(slot => slot !== null).length;
    const backCount = board.backSlots.filter(slot => slot !== null).length;

    return {
      asaSummoned: asaCount,
      mainDeckOnBoard: backCount,
      globalOblivionMult: 0,
    };
  }

  static getDefinition: (id: string) => import('@/types/cards').CardDefinition | undefined =
    () => undefined;
}
