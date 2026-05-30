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
  /** Element key that this boss is weak to (×1.25 damage when deck plurality matches). */
  weakElement?: string;
  /** If true, this boss belongs to a Null Raid and should not appear in Eternity's Wake boss lists. */
  isNullRaidBoss?: boolean;
}

export type BossFightMode = 'idle' | 'active' | 'victory' | 'defeat';

/**
 * What kind of fight run is currently active. Normal = single boss, Wake
 * Trial = modifier-stacked single boss, Gauntlet = endless chain of bosses
 * with HP carry-over, Null Raid = timed multi-encounter Ascension raid.
 */
export type BossFightKind = 'normal' | 'trial' | 'gauntlet' | 'null_raid';

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

export interface BossRewardSummary {
  shardsEarned?: number;
  entropicEnergyEarned?: number;
  masteryPerCard?: number;
  totalTierProgress?: number;
  resonanceGained?: number;
  cardsTieredUp?: number;
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
  /** True when the active deck's plurality element matches the boss's weakElement. */
  bossWeaknessActive?: boolean;
  // ── Null Raid fields ─────────────────────────────────────────────────────
  /** Null Raid: the active raid definition id. */
  nullRaidId?: string;
  /** Null Raid: ordered list of all encounter boss ids for this raid run. */
  nullRaidEncounterBossIds?: string[];
  /** Null Raid: 0-based index of the current encounter. */
  nullRaidEncounterIndex?: number;
  /** Null Raid: total entropy accumulated from completed encounters. */
  nullRaidAccumulatedEntropy?: number;
  /** Null Raid: total aberrated shards accumulated from completed encounters. */
  nullRaidAccumulatedShards?: number;
  /** Snapshot of rewards granted when the result screen opened. */
  rewardSummary?: BossRewardSummary | null;
}
