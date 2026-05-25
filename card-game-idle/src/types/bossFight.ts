import type { BoardState, DeckState, ProgressState, SettingsState, TurnState } from './game';

export type BossCategory = 'Neutrality' | 'Pyroabyss' | 'Heavenly Light' | 'Thornbound Plains' | 'Mechanical Dreams' | 'Prismatic Accord' | 'Snowbound Voltage' | 'Black Glass Inferno' | 'Glass Absolute' | 'The Blazing Garden' | 'Age of the Butterfly' | 'Eternal Seas' | 'Abyssal Forge' | 'Death-flamed Hell' | '[EVENT] Wished Upon A Star';

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

/**
 * What kind of fight run is currently active. Normal = single boss, Wake
 * Trial = modifier-stacked single boss, Gauntlet = endless chain of bosses
 * with HP carry-over.
 */
export type BossFightKind = 'normal' | 'trial' | 'gauntlet';

export interface TrialModifierRef {
  kind:
    | 'chain_start_low'
    | 'time_pressure'
    | 'boss_hp_boost'
    | 'forbidden_element'
    | 'durability_drain'
    | 'no_angels'
    | 'patience_lock';
  payload?: string;
  text: string;
  rewardMult: number;
}

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
  /** Run mode flag. Defaults to 'normal' for any save that predates the field. */
  kind?: BossFightKind;
  /** Active trial modifiers. Empty / absent for normal & gauntlet runs. */
  modifiers?: TrialModifierRef[];
  /** Reward multiplier locked in at fight start (trial only). */
  trialRewardMult?: number;
  /** Current depth in an endless gauntlet (0 = first boss). */
  gauntletDepth?: number;
  /** Shards banked over the course of a gauntlet, granted on loss / quit. */
  gauntletShardsBanked?: number;
  /** HP fraction (0..1) carried from the previous fight in a gauntlet. */
  gauntletHpCarryFrac?: number;
}
