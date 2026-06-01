import type { OphanimInstance, SeraphimInstance } from './cards';
import type { BoardState, ComputedBoardStats, DeckCard } from './game';

type CardInstance = OphanimInstance | SeraphimInstance | DeckCard;

export interface EventPayloads {
  'card:played': { card: CardInstance; board: BoardState };
  'card:removed': { instanceId: string };
  'board:recomputed': ComputedBoardStats;
  'seraphim:synergy-gained': { slot: 0 | 1 | 2 | 3 | 4; instanceId: string };
  'seraphim:synergy-lost': { slot: 0 | 1 | 2 | 3 | 4; instanceId: string };
  'seraphim:attacked': { slot: number; attackId: string; amount: number };
  'angel:summoned': { definitionId: string; slot: number };
  'angel:attacked': { slot: number; attackId: string; amount: number };
  'oblivion:earned': { delta: number; total: number };
  'boss:damaged': { delta: number; remaining: number };
  'boss:cardbreak': { count: number };
  'boss:defeated': { bossId: string; victory: boolean };
  'cherubim:expired': { backSlot: 0 | 1 | 2 | 3; definitionId: string };
  'milestone:reached': { threshold: number; label: string };
  'game:ready': Record<string, never>;
}
