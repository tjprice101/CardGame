import type { BoardState, DeckState, ProgressState, SettingsState, TurnState } from './game';

export type BossCategory = 'Neutrality' | 'Pyroabyss' | 'Heavenly Light' | 'Thornbound Plains' | 'Mechanical Dreams' | 'Prismatic Accord' | 'Snowbound Voltage' | 'Black Glass Inferno' | 'Glass Absolute' | 'The Blazing Garden';

export interface BossDefinition {
  id: string;
  name: string;
  category: BossCategory;
  hp: number;
  keyArt: string;
  rewardCardId: string;
  firstClearShards: number;
  repeatClearShards: number;
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
