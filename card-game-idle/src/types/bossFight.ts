import type { BoardState, DeckState, ProgressState, SettingsState, TurnState } from './game';

export interface BossDefinition {
  id: string;
  name: string;
  hp: number;
  keyArt: string;
  rewardCardId: string;
  description: string;
}

export type BossFightMode = 'idle' | 'active' | 'victory' | 'defeat';

export interface SavedGameState {
  deck: DeckState;
  board: BoardState;
  turn: TurnState;
  progress: ProgressState;
  settings: SettingsState;
}

export interface BossFightState {
  mode: BossFightMode;
  activeBossId: string | null;
  bossCurrentHp: number;
  bossMaxHp: number;
  damageDealtThisFight: number;
  fightTimeRemaining: number;
  cooldowns: Record<string, number>;
  savedGameState: SavedGameState | null;
}
