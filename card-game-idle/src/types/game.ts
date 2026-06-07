import type { AngelInstance, CardFinish, CherubimInstance, SeraphimInstance } from './cards';
import type { ActiveBoardEffect, CardEffect, CardSubtypeFilter } from './effects';
import type { BossFightState } from './bossFight';
import type { BattlegroundState } from './battleground';

export interface EmberGroveEntry {
  definitionId: string;
  finish: CardFinish;
  sourceId: string;
  chromaticSources: string[];
  charredAtTurn: number;
  lineage?: 'Rose' | 'Sunflower' | 'Thistle';
  memoryPower?: number;
}

// ── Board ─────────────────────────────────────────────────────────────────────

export type FrontSlot = SeraphimInstance | AngelInstance | null;
export type BackSlot = CherubimInstance | null;

export interface BoardState {
  frontSlots: [FrontSlot, FrontSlot, FrontSlot, FrontSlot, FrontSlot];
  backSlots: [BackSlot, BackSlot, BackSlot, BackSlot];
  activeBoardEffects: ActiveBoardEffect[];  // accumulated from cards this turn; reset at turn end
  emberGrove?: EmberGroveEntry[];
}

export interface ComputedBoardStats {
  activeSynergies: number;
  oblivionPerCardBonus: number;   // flat Oblivion added per card played (from active Seraphim)
  ophanimOblivionBonus: number;    // bonus Oblivion when Ophanim cards are played (from active Seraphim)
  cherubimExtraPlays: number;        // extra durability added to placed Cherubim cards (from active Seraphim)
  globalOblivionMult: number;     // additive % bonus applied to ALL oblivion grants (from cherubim_global_oblivion_mult passives)
  fullBoardActive: boolean;       // true when all 9 board slots are filled
  /** Global resonance score — sum of each card's highest reached mastery-tier contribution. Exposed for UI gating. */
  resonanceScore?: number;
}

// ── Deck ──────────────────────────────────────────────────────────────────────

export interface DeckEntry {
  definitionId: string;
  copies: 1 | 2 | 3 | 4;
  finish: CardFinish;
}

export interface ExtraDeckEntry {
  definitionId: string;
  finish: CardFinish;
}

export interface DeckCard {
  instanceId: string;
  definitionId: string;
  finish: CardFinish;
  faceState?: 'front' | 'back';
}

export interface DeckState {
  deckList: DeckEntry[];
  extraDeck: ExtraDeckEntry[]; // Angel entries; up to 10 total, max 4 copies of each unique angel across finishes
  drawPile: DeckCard[];
  hand: DeckCard[];
  discardPile: DeckCard[];
}

// ── Turn ──────────────────────────────────────────────────────────────────────

export type TurnPhase = 'idle' | 'mulligan' | 'playing';
export type HeavenlyNote = 'Seraphim' | 'Cherubim' | 'Ophanim' | 'Angel';
export type PrismaticChannel = 'amber' | 'azure' | 'crimson' | 'emerald' | 'violet' | 'white';
export type SnowboundPhase = 'Frost' | 'Voltage';

export type PendingEffect =
  | {
      type: 'discard_choice';
      count: number;
      sourceCard: string;
      sourceDefinitionId?: string;
      sourceInstanceId?: string;
      resolutionEffects?: CardEffect[];
    }
  | {
      type: 'light_transcendent_duality_choice';
      baseOblivion: number;
      resonanceScale: number;
      haloScale: number;
      distinctNoteScale: number;
      thresholdDivisor: number;
      thresholdScale: number;
    }
  | {
      type: 'neutrality_equilibrium_tactical_choice';
      spend: number;
      burstOblivion: number;
      restorePercent: number;
      patientLightGain: number;
    }
  | {
      type: 'neutrality_echo_pulse_choose';
      sourceDefinitionId: string;
      sourceInstanceId: string;
    }
  | {
      type: 'neutrality_void_amp_choose_seraphim';
      sourceDefinitionId: string;
      sourceInstanceId: string;
      bonusOblivionIfOphanim: number;
    }
  | { type: 'look_top_take'; cards: DeckCard[]; take: number; sourceDefinitionId?: string; sourceInstanceId?: string; resolutionEffects?: CardEffect[] }
  | { type: 'look_top_take_drop'; cards: DeckCard[]; take: number; drop: number; sourceDefinitionId?: string; sourceInstanceId?: string; resolutionEffects?: CardEffect[] }
  | { type: 'look_top_take_type'; cards: DeckCard[]; filter: CardSubtypeFilter[]; take: number; sourceDefinitionId?: string; sourceInstanceId?: string; resolutionEffects?: CardEffect[] }
  | { type: 'search_deck'; cards: DeckCard[]; filter: CardSubtypeFilter[]; take: number; sourceDefinitionId?: string; sourceInstanceId?: string; resolutionEffects?: CardEffect[] }
  | { type: 'salvage'; cards: DeckCard[]; filter: CardSubtypeFilter[] | null; count: number; sourceDefinitionId?: string; sourceInstanceId?: string; resolutionEffects?: CardEffect[] }
  | { type: 'embrace_infinite'; cards: DeckCard[]; allCards: DeckCard[]; keep: number };

/** One play recorded in the per-turn Recast Ledger. */
export interface RecastLedgerEntry {
  definitionId: string;
  instanceId: string;
  ledgerIndex: number;
  recastCount: number;
  imprintStacks: number;
  isAnvilSealed: boolean;
  isNacreCoated: boolean;
}

export interface TurnState {
  phase: TurnPhase;
  radiance: number;
  trail: number;
  strain: number;
  cherubimDrawFraction: number;
  cardsPlayedThisTurn: number;
  oblivionEarnedThisTurn: number;
  lastPlayedDefinitionId: string | null;
  turnNumber?: number;
  emberGroveEchoUsedThisTurn?: boolean;
  mulliganSelected: string[];
  pendingEffect: PendingEffect | null;
  lastResolvedSubtype?: CardSubtypeFilter | null;
  lastResolvedCardInstanceId?: string | null;
  lastDrawnDefinitionIds?: string[];
  lastPendingTakenSubtypeCounts?: Partial<Record<CardSubtypeFilter, number>>;
  lastPendingDiscardedSubtypeCounts?: Partial<Record<CardSubtypeFilter, number>>;
  lastPendingLookDiscardedCount?: number;
  strainVentedThisTurn?: boolean;
  cherubimSummonedThisTurn?: number;
  equilibriumDrift?: number;
  equilibriumStability?: number;
  neutralitySetupCount?: number;
  attenuationClassUses?: Partial<Record<'setup' | 'conversion' | 'multiplier' | 'refund' | 'finisher', number>>;
  attenuationBreaksUsed?: number;
  attenuationBrokenClasses?: Array<'setup' | 'conversion' | 'multiplier' | 'refund' | 'finisher'>;
  crossSetConversionDistinctSources?: string[];
  neutralityEngineSignatures?: string[];
  neutralityPatienceChargedThisTurn?: number;
  neutralityPatienceConsumedThisTurn?: number;
  neutralityChainGainedThisTurn?: number;
  neutralityPatientLightStacks?: number;
  neutralityEquilibriumSigils?: number;
  neutralityEquilibriumSigilsGainedThisTurn?: number;
  neutralityEquilibriumPatientLightFromSigilsThisTurn?: number;
  neutralityEquilibriumSigilCapBonus?: number;
  neutralityEquilibriumSentinelTempoUsed?: boolean;
  neutralityTriggeredEffects?: string[];
  lastShuffleSubtypeCounts?: Partial<Record<CardSubtypeFilter, number>>;
  neutralityVesselInstanceId?: string | null;
  neutralityVesselCopyPercent?: number;
  neutralityMarkedCardIds?: string[];
  neutralityMarkedPatienceGain?: number;
  neutralityNextAttackOblivionByInstance?: Record<string, number>;
  neutralityPauseActiveTimersSeconds?: number;
  neutralityAttackPreservePercent?: number;
  neutralityAttackRestorePercent?: number;
  neutralityLinkedGainBonus?: number;
  neutralityLinkedRetainPercent?: number;
  lightCadenceNotes?: HeavenlyNote[];
  lightDistinctNotes?: HeavenlyNote[];
  lightResonance?: number;
  thornScar?: number;
  prismaticCurrentChannel?: PrismaticChannel | null;
  prismaticDistinctChannels?: PrismaticChannel[];
  prismaticRecentChannels?: PrismaticChannel[];
  prismaticRefractionDepth?: number;
  prismaticNodeCharges?: number;
  prismaticResonanceCharge?: number;
  blackGlassWhiteFlame?: number;
  blackGlassBlackFlame?: number;
  blackGlassFracture?: number;
  blackGlassLastPolarity?: 'white' | 'black' | 'both' | null;
  blackGlassLastPayoff?: number;
  snowboundPhase?: SnowboundPhase | null;
  glassProofFragments?: number;
  glassProofDepth?: number;
  glassSnapshotFragments?: number;
  glassSnapshotDepth?: number;
  glassSnapshotCascade?: number;
  glassSnapshotAxioms?: number;
  glassWaveQueue?: number;
  glassDepthFloor?: number;
  glassDepthFloorIncreased?: boolean;
  glassWhiteLedger?: number;
  glassWhiteLedgerActive?: boolean;
  glassSyntheticFragments?: number;
  burningGardenLaw?: 'Rose' | 'Sunflower' | 'Thistle' | null;
  burningGardenLineagesPlayed?: Array<'Rose' | 'Sunflower' | 'Thistle'>;
  burningGardenEchoesBloomed?: number;
  burningGardenNextFinalChordScaleBonus?: number;
  burningGardenSunSigils?: number;
  burningGardenCrownStacks?: number;
  burningGardenCodexLineage?: 'Rose' | 'Sunflower' | 'Thistle' | null;
  burningGardenCodexCopiesRemaining?: number;
  burningGardenTransitGateCredit?: number;
  burningGardenIncandescentSnapshot?: Array<'Rose' | 'Sunflower' | 'Thistle'>;
  burningGardenWorldflowerGrowth?: number;
  burningGardenArrayFreeEchoes?: number;
  burningGardenGeometryMode?: boolean;
  burningGardenZenithNextInfinite?: boolean;
  burningGardenSkyLaw?: 'Rose' | 'Sunflower' | 'Thistle' | null;
  pyroHeat?: number;
  lastPlayedElement?: string | null;
  /** Distinct card elements played this turn — used for 'play_unique_sets_in_turn' quest tracking. */
  uniqueElementsPlayedThisTurn?: string[];
  cherubimConditionalMult?: number; // multiplier from cherubim_conditional_buff passives, applied per card play
  prismaticLight?: number;
  monochromaticShards?: number;
  arcticCharge?: number;
  bloom?: number;
  butterflySpectrum?: number;
  butterflyStance?: 'Reflect' | 'Absorb' | 'Dual' | null;
  butterflyFlutterLevel?: number;
  butterflyFormation?: number;
  butterflyFormationTypesSeen?: Array<'Seraphim' | 'Cherubim' | 'Ophanim' | 'Angel'>;
  lastFiredSeraphimAttackMode?: 'unsynergized' | 'synergized' | null;
  lastFiredSeraphimAttackOblivion?: number;
  eternalSeasUndertow?: number;
  eternalSeasFoam?: number;
  eternalSeasReleaseReactionUsedThisTurn?: boolean;
  // ── Abyssal Forge — The Reforging ────────────────────────────────────────
  recastLedger?: RecastLedgerEntry[];
  reforgeCharges?: number;
  reforgeChargeCap?: number;
  pearls?: number;
  unrecordedHueActive?: boolean;
  forgeTemperQueue?: number; // pending +temper factor for the next attack on a board-wide source
  forgeRecastEventsThisTurn?: number;
  forgePendingCherubimTemper?: number; // queued factor from a Cherubim passive; applied to next Seraphim played
  // Death-flamed Hell Eternal/Infinite overlay.
  dfhVeilMarks?: number;
  dfhAngelResonantCashoutUsed?: boolean;
  dfhVeilAttackBonusByDefinition?: Partial<Record<string, {
    perMark: number;
    consumeMax: number;
    mode: 'synergized' | 'unsynergized' | 'any';
  }>>;
  // Eternal/Infinity per-set amplifier stacks. Keyed by EternalStackKind.
  eternalStacks?: Partial<Record<import('./effects').EternalStackKind, number>>;
  // Per-set secondary keyword counters (gain/spend/cashout). One per set.
  secondaryCounters?: Partial<Record<import('./effects').SetSecondaryKind, number>>;
  // Wing Pulse: number of pending spectrum gains to be doubled.
  flutterWingPulseDoubles?: number;
  // ── Wished Upon A Star — Stellar Wish System ──────────────────────────────
  // starlightCharges: accumulated through card play, drives Nova Wish scaling.
  // dreamLattice: secondary amplifier; resets each turn unless Solarvex Ward is active.
  starlightCharges?: number;
  dreamLattice?: number;
  // solarvexWardActive: set by Solarvex Ward Cherubim passive; prevents decay.
  solarvexWardActive?: boolean;
  // starlaceAmplifierActive: one-shot flag set by Starlace Binding; doubles next Nova Wish.
  starlaceAmplifierActive?: boolean;
  /** Artifact ids equipped on the active deck; populated at game start from SavedDeck.equippedArtifacts. */
  equippedArtifactIds?: string[];
}

// ── Saved Decks ───────────────────────────────────────────────────────────────

export interface SavedDeck {
  id: string;
  name: string;
  deckList: DeckEntry[];
  extraDeck: ExtraDeckEntry[]; // up to 10 Angel entries, max 4 of each definition across finishes
  isStarter: boolean;
  /** Artifact ids equipped to this deck (max 3). Save v17. */
  equippedArtifacts?: string[];
  /** Player-authored notes describing how the deck plays. Save v18. */
  notes?: string;
}

// ── Progress / Settings ────────────────────────────────────────────────────────

/**
 * Per-boss Codex entry tracking personal bests. Save v13+.
 */
export interface BossCodexEntry {
  /** Wall-clock timestamp of first victory. */
  firstClearAt?: number;
  /** Fastest clear time in seconds (lower is better). */
  fastestClearSeconds?: number;
  /** Highest single-hit damage dealt to this boss (peak chain). */
  highestHit?: number;
  /** Most damage dealt in a single fight. */
  highestFightDamage?: number;
}

/**
 * Persistent social interaction counters used for social title/achievement
 * unlocks. Save v24.
 */
export interface SocialProgressStats {
  friendRequestsSent: number;
  friendsAccepted: number;
  messagesSent: number;
  messagesWithAttachment: number;
  giftsSent: number;
  battlegroundInvitesSent: number;
  coopBossInvitesSent: number;
  coopBossInvitesAccepted: number;
}

export interface EventBossHpSnapshot {
  cycleId: string;
  hp: number;
}

export interface ProgressState {
  oblivion: number;
  /** Total Oblivion ever earned (never decremented when spending). Used for unlock conditions. Save v22. */
  lifetimeOblivion?: number;
  /** Highest Oblivion earned in a single turn. Used for Oblivion-Touched unlock. Save v22. */
  bestSingleTurnOblivion?: number;
  aberratedShards: number;
  totalCardsPlayed: number;
  collection: Record<string, number>;         // definitionId ↁEtotal copy count owned
  holoCollection: Record<string, number>;      // definitionId ↁEholo copy count owned
  infiniteCollection: Record<string, number>;  // definitionId ↁEInfinite card count owned
  favoriteCollection: Record<string, boolean>; // `${definitionId}::${finish}` ↁEfavorited
  bossClearCounts: Record<string, number>;
  savedDecks: SavedDeck[];
  activeDeckId: string | null;
  pityCounters: Record<string, number>;       // packId → consecutive box opens without a Legendary (resets on Legendary box)
  /** Per-pack Epic+ pity. packId → consecutive single Pack opens without an Epic-or-better. Save v13. */
  packPityCounters?: Record<string, number>;
  /** Per-pack Boss Codex tracking. bossId → personal best stats. Save v13. */
  bossCodex?: Record<string, BossCodexEntry>;
  /** Weekly trial completions. ISO-week-string → number of weekly trials completed. Save v13. */
  weeklyTrialCompletions?: Record<string, number>;
  /** Player profile (name, current avatar, current title badge). Unlock status is derived from progress. */
  profile: PlayerProfileState;
  /** Daily login reward tracking. */
  dailyLogin: DailyLoginState;
  /** Daily/weekly quest rotation + progress. Save v11. */
  quests: import('@/systems/progression/quests').QuestState;
  /** Achievement claim flags (one-shot shard rewards). Save v11. Keyed by title-badge id. */
  achievementClaims: Record<string, boolean>;
  /** Achievement unlock latches. Once true, the achievement stays unlocked. Save v25. */
  achievementUnlocks?: Record<string, boolean>;
  /** Lifetime per-card play counts. Save v12. Keyed by definitionId. */
  cardPlayCounts: Record<string, number>;
  /** Card mastery tier claim flags. Save v12. Keyed by `${definitionId}::${tier}`. */
  cardMasteryClaims: Record<string, boolean>;
  /** Definition-id → wall-clock ms timestamp of most recent acquisition. Save v14. */
  recentlyAcquired?: Record<string, number>;
  /** Wall-clock ms of last collection viewer open. NEW badges shown for cards with `recentlyAcquired[id] > lastCollectionViewedAt`. Save v14. */
  lastCollectionViewedAt?: number;
  /** Rolling log of pack opens (most recent first, max 50). Save v14. */
  packOpenHistory?: PackOpenEntry[];
  /** Endless Gauntlet personal bests. Save v14. */
  gauntletBest?: GauntletBest;
  /** Artifact ids the player has purchased, mapped to total copies bought. Save v18 (was Record<string,true> in v17). */
  ownedArtifacts?: Record<string, number>;
  /** Universal Card-bane Light currency earned by dissolving cards. Save v18. */
  cardbaneLight?: number;
  /**
   * Per-card user-applied dissolution locks. definitionId → number of
   * additional copies the player has locked beyond starter copies. Combined
   * with `STARTER_COLLECTION` to determine the minimum number of copies that
   * cannot be dissolved. Save v19.
   */
  cardLocks?: Record<string, number>;
  /** Ascension mode — Entropic Energy currency balance. Save v22. */
  entropicEnergyBalance?: number;
  /** Legacy save v21 field retained for migration compatibility. */
  entropyBalance?: number;
  /** Ascension mode — per-raid cooldowns. raidId → Unix-ms when cooldown expires. Save v21. */
  nullRaidCooldowns?: Record<string, number>;
  /** Ascension mode — total clear count per raid. raidId → number. Save v21. */
  nullRaidClears?: Record<string, number>;
  /** Ascension mode — Prove Yourself unlocks per raid. raidId → true. */
  nullRaidProveUnlocks?: Record<string, boolean>;
  /** Ascension mode — consecutive full clears without the raid angel drop. Save v22. */
  nullRaidAngelMissStreak?: Record<string, number>;
  /** Ascension mode — owned Transcendent Card copies. definitionId → count. Save v21. */
  transcendentCollection?: Record<string, number>;
  /** Event-boss HP snapshots frozen per cycle. category → {cycleId,hp}. */
  eventBossHpSnapshots?: Record<string, EventBossHpSnapshot>;
  /** Battleground of the Card-born lifetime stats. Save v20. */
  battlegroundStats?: {
    wins: number;
    losses: number;
    bestScore: number;
    totalMatches: number;
    /** Milestone keys already claimed (e.g. '10k', '50k', '250k'). */
    claimedMilestones: string[];
    /** Unix-ms timestamps of recent reward-bearing matches (for daily cap). */
    dailyMatchTimestamps: number[];
  };
  /** Social interaction counters used by social achievements/titles. Save v24. */
  socialStats?: SocialProgressStats;
}

export interface PackOpenEntry {
  ts: number;
  packId: string;
  tier: 'pack' | 'box' | 'case';
  rarityCounts: Record<string, number>;
}

export interface GauntletBest {
  bestDepth: number;
  bestShards: number;
  runs: number;
}

export interface PlayerProfileState {
  /** Display name (1-24 chars after trim). */
  name: string;
  /** Short player-written bio shown on the social profile modal. Max 200 chars. */
  bio: string;
  /** Currently selected avatar definition id. Validated against unlock requirements on render. */
  avatarId: string;
  /** Currently selected title badge definition id, or null for none. */
  titleId: string | null;
  /** Currently selected UI theme id. Falls back to the default if locked/unknown. */
  uiThemeId: string;
  /**
   * Per-key palette overrides applied on top of the selected theme. Keys must
   * match `UiPalette`. Null / empty means "no overrides".
   */
  customUiTheme: Record<string, string> | null;
  /** Up to 5 card definition ids the player has chosen to showcase. Save v21. */
  signatureCardIds?: string[];
  /** Permanently latched avatar ids unlocked at least once. Save v23. */
  unlockedAvatarIds?: string[];
  /** Permanently latched reward UI theme ids unlocked at least once. Save v28. */
  unlockedUiThemeIds?: string[];
  /** Selected main menu background id. Save v29. */
  mainMenuBackgroundId?: string;
}

export interface DailyLoginState {
  /** UTC day index of the last claim. -1 means the player has never claimed. */
  lastClaimedDayIndex: number;
  /** Current consecutive-day streak. 0 until the first claim. */
  streak: number;
  /** Total number of daily rewards ever claimed. */
  totalClaims: number;
}

export interface SettingsState {
  musicVolume: number;
  sfxVolume: number;
  particlesEnabled: boolean;
  reducedMotion: boolean;
  /** Feature-flag for the host-authoritative co-op netplay transport. Save v31. */
  coopNetplayEnabled?: boolean;
  language: UiLanguage;
  fontSizePreset: FontSizePreset;
  cardArtDisplay: CardArtDisplay;
  cardThemePacks: Record<string, CardThemePackId>;
  /** Compact UI scaling: denser collection grid, smaller paddings. Save v14. */
  compactMode?: boolean;
  /** Instant-reveal preference for pack opens. Save v14. */
  instantPackReveal?: boolean;
  /** Bold/color keywords inside card rules text. Save v15. Defaults to true. */
  highlightRulesText?: boolean;
  /**
   * Keyboard control mappings. Save v16. Values are KeyboardEvent.code strings
   * (e.g. 'KeyE', 'Slash', 'Escape'). Missing entries fall back to
   * `DEFAULT_CONTROL_BINDINGS` at read time.
   */
  controls?: Partial<Record<KeybindActionId, string>>;
}

/** Configurable keybind actions exposed in Settings → Controls. */
export type KeybindActionId =
  | 'swapExtraDeck'
  | 'openTutorial'
  | 'closeOverlay'
  | 'toggleRadioUi'
  | 'togglePartyUi';

/** Default keyboard control bindings (KeyboardEvent.code values). */
export const DEFAULT_CONTROL_BINDINGS: Record<KeybindActionId, string> = {
  swapExtraDeck: 'KeyE',
  openTutorial: 'Slash',
  closeOverlay: 'Escape',
  toggleRadioUi: 'KeyR',
  togglePartyUi: 'KeyP',
};

export type UiLanguage = 'en' | 'es' | 'fr';
export type FontSizePreset = 'compact' | 'standard' | 'large';
export type CardThemePackId = 'classic' | 'luminous' | 'nocturne';
export type CardArtDisplay = 'both' | 'top-only' | 'bottom-only' | 'art-only';

// ── Trial Deck ─────────────────────────────────────────────────────────────────

/** One step in a guided trial walkthrough. */
export interface TrialGuideStep {
  /** The definitionId of the card the player should play at this step. */
  cardDefinitionId: string;
  /** Short instructional text explaining what this card does in context. */
  hint: string;
}

/** Curated per-set trial deck definition (stored in trialDecks.ts). */
export interface TrialDeckDefinition {
  packId: string;
  displayName: string;
  deckList: DeckEntry[];
  extraDeck: ExtraDeckEntry[];
  /** Ordered steps for Guided mode. */
  guideSteps: TrialGuideStep[];
  /** Fixed opening hand for Guided mode (array of definitionIds). */
  guidedOpeningHand: string[];
  /** Ordered deck for Guided mode — NOT shuffled, comes out in definition order. */
  guidedDeckOrder: DeckEntry[];
}

/** Live trial deck slice in the store. */
export interface TrialDeckState {
  mode: 'idle' | 'active';
  packId: string | null;
  trialMode: 'solo' | 'guided';
  savedGameState: import('./bossFight').SavedGameState | null;
  /** Current guide step index (0-based). */
  guideStep: number;
  guideSteps: TrialGuideStep[];
  guidedOpeningHand: string[];
  guidedDeckOrder: DeckEntry[];
  /** True once all guide steps have been completed (guided mode only). */
  guideComplete: boolean;
  /** Number of turns completed in this trial session. */
  turnCount: number;
  /** Running total of Oblivion scored across all trial turns. */
  trialOblivionTotal: number;
}

// ── Root game state ───────────────────────────────────────────────────────────

export interface GameState {
  version: number;
  startedAt: number;
  lastSavedAt: number;
  board: BoardState;
  deck: DeckState;
  turn: TurnState;
  progress: ProgressState;
  settings: SettingsState;
  bossFight: BossFightState;
  battleground: BattlegroundState;
  trialDeck: TrialDeckState;
  /**
   * In-memory only — set by the SaveManager when the on-disk envelope's
   * signature didn't validate. Stripped from the payload before serialization
   * so it can't be cleared by editing the save file.
   */
  saveTampered?: boolean;
  /**
   * In-memory only — queue of transient toast notifications. Not persisted.
   */
  toasts?: ToastEntry[];
}

export interface ToastEntry {
  id: string;
  message: string;
  kind?: 'info' | 'success' | 'warning' | 'reward';
  /** Wall-clock time when the toast was enqueued (ms). */
  ts: number;
  /** Optional auto-dismiss duration in ms. Defaults to 3500. */
  durationMs?: number;
}
