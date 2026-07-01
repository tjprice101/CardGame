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
export type BossFightCoopRole = 'host' | 'guest';

export interface TrialModifierRef {
  kind:
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
  /** Damage dealt during the first 60s of the current encounter/fight. */
  damageDealtFirstMinute?: number;
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
  /** Co-op party size for Eternity's Wake fights (1..3 total players). */
  coopPartySize?: number;
  /** Solo multi-fight choice for Eternity's Wake (1..3). */
  fightCount?: number;
  /** Optional co-op session id when the fight was launched via an invite. */
  coopSessionId?: string;
  /** Whether local player is host or guest in a co-op boss session. */
  coopRole?: BossFightCoopRole;
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
  /** Null Raid: best first-minute damage across encounters in this raid run. */
  nullRaidBestDamageFirstMinute?: number;
  /** Null Raid: true when this run is a Prove Yourself test (no raid rewards/clear). */
  nullRaidProvingOnly?: boolean;
  /** Snapshot of rewards granted when the result screen opened. */
  rewardSummary?: BossRewardSummary | null;
  // ── Card-break (stagger) meter ────────────────────────────────────────────
  /** Current stagger charge, 0–100. Filled by Synergized / Exalted attacks. */
  bossCardBreakMeter?: number;
  /** Seconds remaining on a Card-break timer freeze (counts down in tickBossTimer). */
  bossCardBreakFreezeLeft?: number;
  /** Total number of successful Card-breaks landed this fight. */
  bossCardBreakCount?: number;
}
