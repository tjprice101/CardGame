import type { SeekerInstance, SeraphimInstance } from './cards';
import type { BoardState, ComputedBoardStats, DeckCard } from './game';

type CardInstance = SeekerInstance | SeraphimInstance | DeckCard;

export interface EventPayloads {
  'card:played': { card: CardInstance; board: BoardState };
  'card:removed': { instanceId: string };
  'board:recomputed': ComputedBoardStats;
  'seraphim:synergy-gained': { slot: 0 | 1 | 2 | 3 | 4; instanceId: string };
  'seraphim:synergy-lost': { slot: 0 | 1 | 2 | 3 | 4; instanceId: string };
  'oblivion:earned': { delta: number; total: number; chainMultiplier: number };
  'boss:damaged': { delta: number; remaining: number };
  'chaos:expired': { backSlot: 0 | 1 | 2 | 3; definitionId: string };
  'milestone:reached': { threshold: number; label: string };
  'game:ready': Record<string, never>;
}
