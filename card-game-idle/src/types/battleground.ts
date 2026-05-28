import type { BoardState, DeckState, ProgressState, SettingsState, TurnState } from './game';

// ── Battleground types ─────────────────────────────────────────────────────────

export interface BattlegroundSavedGameState {
  deck: DeckState;
  board: BoardState;
  turn: TurnState;
  progress: ProgressState;
  settings: SettingsState;
}

export type BattlegroundMode = 'idle' | 'lobby' | 'active' | 'finished';
export type BattlegroundKind = 'pvp' | 'cpu';
export type CpuDifficulty = 'easy' | 'normal' | 'hard';

export interface BattlegroundOpponentProfile {
  displayName: string;
  avatarId: string;
  titleId?: string | null;
}

export interface BattlegroundState {
  mode: BattlegroundMode;
  kind: BattlegroundKind | null;
  cpuDifficulty: CpuDifficulty | null;
  sessionId: string | null;
  myScore: number;
  opponentScore: number;
  opponentBoard: BoardState | null;
  opponentProfile: BattlegroundOpponentProfile | null;
  /** Countdown in seconds; starts at 180 (3 minutes). */
  timeRemaining: number;
  /** True when local hand + draw pile are both empty. */
  myHandEmpty: boolean;
  /** True when opponent signals their hand is empty. */
  opponentHandEmpty: boolean;
  /** Cards currently in the opponent's hand (shown as face-down backs). */
  opponentHandSize: number;
  result: 'win' | 'loss' | 'draw' | null;
  savedGameState: BattlegroundSavedGameState | null;
  rewardClaimed: boolean;
  /** Unix-ms timestamp after which another match can earn rewards; 0 = no cooldown. */
  cooldownUntil: number;
  /** True after the player has used their one allowed turn for this match. */
  turnTaken: boolean;
}
