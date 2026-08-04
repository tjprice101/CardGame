import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { cloneState } from '@/utils/stateClone';
import type {
  BoardState, ComputedBoardStats, DeckCard, DeckEntry,
  DeckState, ExtraDeckEntry, GameState, ProgressState, SavedDeck, SettingsState, TurnState, TrialDeckState,
} from '@/types/game';
import { DEFAULT_CONTROL_BINDINGS } from '@/types/game';
import type {
  CardDefinition,
  AngelDefinition,
  AngelInstance,
  CardFinish,
  CardFaceState,
  CherubimDefinition,
  CherubimInstance,
  SeraphimDefinition,
  SeraphimInstance,
  AttackCost,
  AngelAttackSet,
  SeraphimAttackSet,
} from '@/types/cards';
import type { CardEffect, CardSubtypeFilter } from '@/types/effects';
import type { BossFightState, SavedGameState } from '@/types/bossFight';
import type { BattlegroundState, BattlegroundKind, BattlegroundOpponentProfile, BattlegroundSavedGameState, CpuDifficulty } from '@/types/battleground';
import { CardRegistry } from '@/cards/CardRegistry';
import { ScoreSystem } from '@/systems/scoring/ScoreSystem';
import { SynergySystem } from '@/systems/cards/SynergySystem';
import { DeckSystem } from '@/systems/cards/DeckSystem';
import { TurnSystem } from '@/systems/cards/TurnSystem';
import {
  clampPatienceStacks,
  clampPatientLightStacks,
  getEffectivePatientLightPerCardPatienceGain,
  hasNeutralityUncappedGainsInDeck,
} from '@/systems/cards/neutralityPatientLight';
import {
  type ActionClass,
  classifyCardActionClass,
  getCardActionClassEffects,
} from '@/systems/cards/ActionClass';
import { CardEffectExecutor } from '@/systems/cards/CardEffectExecutor';
import { PackSystem } from '@/systems/cards/PackSystem';
import { getActiveCoopRng, useCoopSyncStore } from '@/state/coopSyncStore';
import { useSocialStore } from '@/state/socialStore';
import { PACK_DEFINITIONS } from '@/data/packs/packDefinitions';
import { canConvertCardToHolo, getCardFinishKey, getHolofoilConversionCost } from '@/systems/progression/HolofoilSystem';
import { STARTER_DECK_LIST, STARTER_EXTRA_DECK, STARTER_COLLECTION } from '@/systems/progression/StarterDeck';
import { evaluateDailyLogin, getUtcDayIndex } from '@/systems/progression/dailyLogin';
import {
  applyQuestProgress,
  refreshQuestRotation,
  type QuestKind,
} from '@/systems/progression/quests';
import {
  ensureEnigmaState,
  ensureNeutralMysteryInstance,
  evaluateEnigmaAcquisition,
  evaluateNeutralMysteryProgress,
  awardEnigmaReward,
} from '@/systems/progression/EnigmaSystem';
import { getEnigmaDefinition } from '@/data/enigmas/enigmaDefinitions';
import { getBossRewardMultiplier } from '@/systems/progression/featuredBoss';
import {
  getAchievementShardReward,
  getAchievementOblivionReward,
  isAchievementUnlocked,
} from '@/systems/progression/achievements';
import { ensureOwnershipHistory, getEverCollectionCount, getEverHoloCount, seedEverOwned, syncCardOwnershipHistory } from '@/systems/progression/ownershipHistory';
import {
  MASTERY_TIERS,
  applyMasteryReward,
  computeGlobalResonanceScore,
  getBossFightMasteryPerCard,
  getGauntletMasteryPerCard,
  getMasteryClaimKey,
  MAX_MASTERY_PROGRESS_PER_CARD_BOSS,
  MAX_MASTERY_PROGRESS_PER_CARD_TRIAL_GAUNTLET,
} from '@/systems/progression/cardMastery';
import { getDailyTrials as _getDailyTrials, getWeeklyTrial, type TrialModifier } from '@/systems/progression/wakeTrials';
void _getDailyTrials;
import { getSpotlightPackId, getSpotlightPackCost } from '@/systems/progression/spotlightPack';
import { getDailyDealPackId, getDailyDealCost } from '@/systems/progression/dailyDeal';
import { TITLE_BADGES, TITLE_BADGE_BY_ID } from '@/data/profile/titleBadges';
import { latchUnlockedAvatars } from '@/data/profile/avatars';
import { getRewardThemeSeed, latchUnlockedUiThemes } from '@/data/profile/uiThemes';
import {
  BOSS_DEFINITIONS,
  BOSS_FIGHT_ROUND_SECONDS,
  ensureEventBossHpSnapshot,
  isBossUnlocked,
  isEventBossCategory,
} from '@/data/bosses/bossDefinitions';
import {
  NULL_RAID_DEFINITIONS,
  NULL_RAID_BOSS_MAP,
  NULL_RAID_ENCOUNTER_SECONDS,
  NULL_RAID_PROVE_YOURSELF_SECONDS,
  getNullRaidProveYourselfTargetDamage,
} from '@/data/ascension/nullRaidDefinitions';
import { eventBus } from '@/core/events/EventBus';
import { getSupabase } from '@/net/supabaseClient';
import {
  getCardDissolveYield,
} from '@/types/artifacts';
import { getArtifactEffect } from '@/systems/artifacts/artifactRuntime';
import { DEFAULT_CARD_THEME_PACKS, setUiPreferences } from '@/ui/preferences';
import {
  NEUTRALITY_TUTORIAL_TRIAL_PACK_IDS,
  getTrialDeckDefinition,
  isNeutralityTutorialTrialPackId,
  type NeutralityTutorialTier,
} from '@/data/trialDecks';
import { TRANSCENDENT_SHOP_IDS } from '@/data/ascension/transcendentCards';

import { DEFAULT_MAIN_MENU_BACKGROUND_ID } from '@/data/profile/mainMenuBackgrounds';

const EMBRACE_INFINITE_MIN_HAND = 40;

type AttenuationClass = ActionClass;

const ATTENUATION_CLASSES: AttenuationClass[] = ['setup', 'conversion', 'multiplier', 'refund', 'finisher'];
const ATTENUATION_TIERS = [1, 0.75, 0.55, 0.4] as const;
const NEUTRALITY_SETUP_FOR_FULL_FIRE = 3;
const NEUTRALITY_ENGINES_FOR_FULL_FIRE = 3;
const COOP_BOSS_HP_SCALE_BY_PARTY_SIZE: Record<number, number> = {
  1: 1,
  2: 1.68,
  3: 2.28,
};
const BOSS_FIGHT_HP_SCALE_BY_COUNT: Record<number, number> = {
  1: 1,
  2: 2.5,
  3: 3.5,
};

// �E��E��E��E� Defaults �E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E�

const NOW = Date.now();
let angelInstanceCounter = 0;

const defaultBoard: BoardState = {
  frontSlots: [null, null, null, null, null],
  backSlots: [null, null, null, null],
  activeBoardEffects: [],
  emberGrove: [],
};

const defaultDeck: DeckState = {
  deckList: STARTER_DECK_LIST,
  extraDeck: STARTER_EXTRA_DECK,
  drawPile: DeckSystem.buildFromList(STARTER_DECK_LIST),
  hand: [],
  discardPile: [],
};

const defaultTurn: TurnState = {
  phase: 'idle',
  radiance: 0,
  trail: 0,
  strain: 0,
  cherubimDrawFraction: 0,
  cardsPlayedThisTurn: 0,
  oblivionEarnedThisTurn: 0,
  lastPlayedDefinitionId: null,
  turnNumber: 0,
  mulliganSelected: [],
  pendingEffect: null,
  lastResolvedSubtype: null,
  cherubimSummonedThisTurn: 0,
  equilibriumDrift: 0,
  equilibriumStability: 0,
  neutralitySetupCount: 0,
  attenuationClassUses: { setup: 0, conversion: 0, multiplier: 0, refund: 0, finisher: 0 },
  attenuationBreaksUsed: 0,
  attenuationBrokenClasses: [],
  neutralityEngineSignatures: [],
  neutralityPatienceChargedThisTurn: 0,
  neutralityPatienceConsumedThisTurn: 0,
  neutralityPatientLightStacks: 0,
  neutralityEquilibriumSigils: 0,
  neutralityEquilibriumSigilsGainedThisTurn: 0,
  neutralityEquilibriumPatientLightFromSigilsThisTurn: 0,
  neutralityEquilibriumSigilCapBonus: 0,
  neutralityEquilibriumSentinelTempoUsed: false,
  neutralityTriggeredEffects: [],
  lastFiredSeraphimAttackMode: null,
  lastFiredSeraphimAttackOblivion: 0,
  equippedArtifactIds: [],
  seraphimBonusAmp: 0,
};

const defaultProgress: ProgressState = {
  oblivion: 0,
  aberratedShards: 0,
  totalCardsPlayed: 0,
  collection: { ...STARTER_COLLECTION },
  holoCollection: {},
  infiniteCollection: {},
  everCollection: { ...STARTER_COLLECTION },
  everHoloCollection: {},
  everInfiniteCollection: {},
  favoriteCollection: {},
  bossClearCounts: {},
  pityCounters: {},
  savedDecks: [
    {
      id: 'starter-neutrality',
      name: 'Neutrality Standard',
      deckList: STARTER_DECK_LIST,
      extraDeck: STARTER_EXTRA_DECK,
      isStarter: true,
    },
  ],
  activeDeckId: 'starter-neutrality',
  profile: {
    name: 'Wanderer',
    bio: '',
    avatarId: 'pic-classic-acolyte',
    titleId: null,
    uiThemeId: 'theme-warm-default',
    customUiTheme: null,
    mainMenuBackgroundId: DEFAULT_MAIN_MENU_BACKGROUND_ID,
    signatureCardIds: [],
    unlockedAvatarIds: [],
    unlockedUiThemeIds: [],
  },
  dailyLogin: {
    lastClaimedDayIndex: -1,
    streak: 0,
    totalClaims: 0,
  },
  quests: { daily: [], weekly: [], lastDailyRollDay: -1, lastWeeklyRollWeek: -1 },
  enigmas: { activeEnigmaId: null, instances: {} },
  achievementClaims: {},
  achievementUnlocks: {},
  cardPlayCounts: {},
  cardMasteryClaims: {},
  packPityCounters: {},
  bossCodex: {},
  weeklyTrialCompletions: {},
  recentlyAcquired: {},
  lastCollectionViewedAt: 0,
  packOpenHistory: [],
  gauntletBest: { bestDepth: 0, bestShards: 0, runs: 0 },
  ownedArtifacts: {},
  cardbaneLight: 0,
  fractureShards: 0,
  cardLocks: {},
  entropicEnergyBalance: 0,
  entropyBalance: 0,
  nullRaidCooldowns: {},
  nullRaidClears: {},
  nullRaidProveUnlocks: {},
  nullRaidAngelMissStreak: {},
  transcendentCollection: {},
  eventBossHpSnapshots: {},
  battlegroundStats: { wins: 0, losses: 0, bestScore: 0, totalMatches: 0, claimedMilestones: [], dailyMatchTimestamps: [] },
  socialStats: {
    friendRequestsSent: 0,
    friendsAccepted: 0,
    messagesSent: 0,
    messagesWithAttachment: 0,
    giftsSent: 0,
    battlegroundInvitesSent: 0,
    coopBossInvitesSent: 0,
    coopBossInvitesAccepted: 0,
  },
};

const defaultSettings: SettingsState = {
  musicVolume: 0.5,
  sfxVolume: 0.8,
  particlesEnabled: true,
  reducedMotion: false,
  coopNetplayEnabled: false,
  language: 'en',
  fontSizePreset: 'standard',
  cardArtDisplay: 'both',
  cardThemePacks: { ...DEFAULT_CARD_THEME_PACKS },
  compactMode: false,
  instantPackReveal: false,
  highlightRulesText: true,
  controls: { ...DEFAULT_CONTROL_BINDINGS },
};

const defaultBossFight: BossFightState = {
  mode: 'idle',
  activeBossId: null,
  bossCurrentHp: 0,
  bossMaxHp: 0,
  kind: 'normal',
  modifiers: [],
  trialRewardMult: 1,
  gauntletDepth: 0,
  gauntletShardsBanked: 0,
  gauntletHpCarryFrac: 1,
  coopPartySize: 1,
  fightCount: 1,
  damageDealtThisFight: 0,
  fightTimeRemaining: 0,
  cooldowns: {},
  savedGameState: null,
  rewardSummary: null,
  bossCardBreakMeter: 0,
  bossCardBreakFreezeLeft: 0,
  bossCardBreakCount: 0,
};

const defaultBattleground: BattlegroundState = {
  mode: 'idle',
  kind: null,
  cpuDifficulty: null,
  sessionId: null,
  myScore: 0,
  opponentScore: 0,
  opponentBoard: null,
  opponentProfile: null,
  timeRemaining: 180,
  myHandEmpty: false,
  opponentHandEmpty: false,
  opponentHandSize: 0,
  result: null,
  savedGameState: null,
  rewardClaimed: false,
  cooldownUntil: 0,
  turnTaken: false,
};

const defaultTrialDeckState: TrialDeckState = {
  mode: 'idle',
  packId: null,
  trialMode: 'solo',
  savedGameState: null,
  guideStep: 0,
  guideSteps: [],
  guidedOpeningHand: [],
  guidedDeckOrder: [],
  guideComplete: false,
  turnCount: 0,
  trialOblivionTotal: 0,
};

export const defaultGameState: GameState = {
  version: 6,
  startedAt: NOW,
  lastSavedAt: NOW,
  board: defaultBoard,
  deck: defaultDeck,
  turn: defaultTurn,
  progress: defaultProgress,
  settings: defaultSettings,
  bossFight: defaultBossFight,
  battleground: { ...defaultBattleground } as BattlegroundState,
  trialDeck: { ...defaultTrialDeckState },
  saveTampered: false,
  toasts: [],
};

// �E��E��E��E� Store type �E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E�

interface StoreActions {
  placeSeraphim: (deckCard: DeckCard, slot: 0 | 1 | 2 | 3 | 4) => void;
  placeSeraphimFromHand: (targetSlot: 0 | 1 | 2 | 3 | 4, instanceId?: string) => void;
  removeSeraphim: (slot: 0 | 1 | 2 | 3 | 4) => void;
  discardCardToRemoveSeraphim: (slot: 0 | 1 | 2 | 3 | 4) => void;
  placeCherubim: (backSlotIndex: 0 | 1 | 2 | 3, instanceId?: string) => void;
  removeCherubim: (backSlotIndex: 0 | 1 | 2 | 3) => void;
  summonAngel: (definitionId: string, finish?: CardFinish) => void;
  /** Return a summoned angel from the board back to the extra deck. */
  returnAngelToExtraDeck: (slot: 0 | 1 | 2 | 3 | 4) => void;
  activateAngel: (slot: 0 | 1 | 2 | 3 | 4) => void;
  activateSeraphimAttack: (
    slot: 0 | 1 | 2 | 3 | 4,
    attackId?: 'unsynergized' | 'synergized',
    paymentSelection?: AttackPaymentSelection,
  ) => void;
  activateAngelAttack: (
    slot: 0 | 1 | 2 | 3 | 4,
    attackId?: 'primary' | 'exalted',
    paymentSelection?: AttackPaymentSelection,
  ) => void;
  initDeck: (deckList: DeckEntry[], extraDeck?: ExtraDeckEntry[]) => void;
  saveDeckList: (deckList: DeckEntry[]) => void;
  saveCurrentDeck: (name: string, deckList?: DeckEntry[], extraDeck?: ExtraDeckEntry[]) => string;
  updateSavedDeck: (id: string, deckList: DeckEntry[], extraDeck?: ExtraDeckEntry[]) => void;
  loadSavedDeck: (id: string) => void;
  deleteSavedDeck: (id: string) => void;
  beginTurn: () => void;
  toggleMulliganCard: (instanceId: string) => void;
  toggleCardFace: (instanceId: string) => void;
  confirmMulligan: () => void;
  embraceInfinite: () => void;
  /** placeholder: reserved for future set actions */
  playCard: (instanceId: string) => void;
  resolvePending: (selected: string[]) => void;
  endTurn: () => void;
  endAndBeginAgain: () => void;
  addOblivion: (delta: number) => void;
  openPack: (packId: string) => string[] | null;
  openBox: (packId: string) => string[] | null;
  openCase: (packId: string) => string[] | null;
  convertCardToHolo: (definitionId: string) => boolean;
  toggleFavoriteCard: (definitionId: string, finish: CardFinish) => void;
  combineForInfinite: (recipe: import('@/data/cards/infiniteCards').InfiniteRecipe) => true | string;
  updateSettings: (patch: Partial<SettingsState>) => void;
  loadState: (state: GameState) => void;
  resetToDefault: () => void;
  startBossFight: (bossId: string, savedDeckId: string, options?: {
    kind?: 'normal' | 'trial' | 'gauntlet';
    modifiers?: TrialModifier[];
    trialRewardMult?: number;
    coopPartySize?: number;
    fightCount?: number;
    coopSessionId?: string;
    coopRole?: 'host' | 'guest';
  }) => void;
  startWakeTrial: (bossId: string, savedDeckId: string, modifiers: TrialModifier[], rewardMult: number) => void;
  startEndlessGauntlet: (savedDeckId: string) => void;
  tickBossTimer: (deltaSeconds: number) => void;
  forfeitBossFight: () => void;
  dismissBossResult: () => void;
  applyCoopBossDamage: (amount: number, sourceUserId?: string, seq?: number) => void;
  markCoopParticipantDisconnected: (userId: string) => void;
  // ── Trial Deck ──────────────────────────────────────────────────────────────
  /** Begin a Trial Deck practice session for the given pack. Saves current game state; restores on exit. */
  startTrialDeck: (packId: string) => void;
  /** Begin a Play Tutorial Turn practice session in Neutrality at the selected tier. */
  startTutorialTurn: (tier: NeutralityTutorialTier) => void;
  /** End the active Trial Deck session and restore the saved game state. */
  endTrialDeck: () => void;
  // Profile & daily login
  setPlayerName: (name: string) => void;
  setBio: (bio: string) => void;
  setAvatarId: (avatarId: string) => void;
  setTitleId: (titleId: string | null) => void;
  setUiThemeId: (themeId: string) => void;
  setMainMenuBackgroundId: (backgroundId: string) => void;
  setCustomUiThemeColor: (key: string, value: string) => void;
  resetCustomUiTheme: () => void;
  /** Set a Signature Card slot (0-4). Pass null cardId to clear the slot. */
  setSignatureCard: (slot: number, cardId: string | null) => void;
  /** Increment persistent social interaction counters used by social titles/achievements. */
  recordSocialProgress: (
    event:
      | 'friend_request_sent'
      | 'friend_added'
      | 'message_sent'
      | 'message_with_attachment'
      | 'gift_sent'
      | 'battleground_invite_sent'
      | 'coop_boss_invite_sent'
      | 'coop_boss_invite_accepted',
    amount?: number,
  ) => void;
  /** Overwrite the entire profile from a remote (Supabase) snapshot. Called after sign-in. */
  applyRemoteProfile: (remote: {
    name: string;
    bio: string;
    avatarId: string;
    titleId: string | null;
    uiThemeId: string | null;
    mainMenuBackgroundId: string | null;
    customUiTheme: Record<string, string> | null;
    signatureCardIds: string[];
    unlockedAvatarIds: string[];
    unlockedUiThemeIds: string[];
  }) => void;
  // Ascension mode
  /** Add Entropic Energy currency to the player's balance. */
  addEntropy: (amount: number) => void;
  /** Spend Entropic Energy. Returns false if insufficient balance. */
  spendEntropy: (amount: number) => boolean;
  /** Record a Null Raid clear and apply post-raid cooldown. */
  recordNullRaidClear: (raidId: string, cooldownMs: number) => void;
  /** Add a Transcendent Card copy to the collection. */
  addTranscendentCard: (definitionId: string) => void;
  /** Purchase a Transcendent shop card with Entropic Energy. */
  purchaseTranscendentCard: (definitionId: string, cost: number) => boolean;
  /** Finalize raid angel drop outcome and update per-raid pity streak state. */
  finalizeNullRaidAngelOutcome: (raidId: string, dropped: boolean, pityConsumed: boolean) => void;
  /** Launch a 60s Prove Yourself test versus the first encounter boss. */
  startNullRaidProveYourself: (raidId: string, savedDeckId: string) => boolean;
  /** Begin a Null Raid run. Validates cooldown, Prove Yourself unlock, and idle state. */
  startNullRaid: (raidId: string, savedDeckId: string) => boolean;
  claimDailyReward: () => { shards: number; streak: number } | null;
  setActiveEnigma: (enigmaId: string) => void;
  sacrificeEnigmaOblivion: (enigmaId: string) => boolean;
  claimEnigmaReward: (enigmaId: string) => boolean;
  /** Engagement: claim a single quest. */
  claimQuest: (questId: string) => { shards: number; oblivion?: number } | null;
  /** Engagement: claim an unlocked achievement (one-shot). */
  claimAchievement: (achievementId: string) => { shards: number; oblivion?: number } | null;
  /** Engagement: claim a reached card-mastery tier (one-shot per tier). */
  claimCardMastery: (definitionId: string, tier: number) => { shards: number } | null;
  /** Quick-claim all currently available mastery tiers. Returns aggregate shard reward & tiers claimed. */
  claimAllAvailableMastery: () => { shards: number; tiersClaimed: number };
  /** Mark the collection viewer as seen — clears NEW badges. */
  markCollectionViewed: () => void;
  /** Update Endless Gauntlet personal bests after a run. */
  recordGauntletRun: (depth: number, shards: number) => void;
  /** Set compact UI mode preference. */
  setCompactMode: (enabled: boolean) => void;
  /** Toggle keyword highlighting inside card rules text. */
  setHighlightRulesText: (enabled: boolean) => void;
  /** Fracture one duplicate copy of a card into Fracture Shards (rarity-scaled). Returns shards gained or 0 if not fracturable. */
  fractureCard: (definitionId: string, count?: number) => number;
  /** Spend Fracture Shards as Card-light for a chosen card (1:1 into cardPlayCounts). Returns shards actually spent. */
  spendFractureShards: (targetDefinitionId: string, amount: number) => number;
  /** Dissolve one copy of a card into universal Card-bane Light. Returns false if player doesn't own a copy. */
  dissolveCard: (definitionId: string) => boolean;
  /** Dissolve every unlocked copy of every card in the collection. Returns total copies dissolved. */
  dissolveAllUnlocked: () => number;
  /** Set the number of user-locked copies for a card (additional copies beyond starter locks that cannot be dissolved). */
  setCardLock: (definitionId: string, count: number) => void;
  /** Update a saved deck's player-authored how-to-play notes. */
  setDeckNotes: (deckId: string, notes: string) => void;
  /** Enqueue a transient toast notification. */
  enqueueToast: (message: string, kind?: 'info' | 'success' | 'warning' | 'reward', durationMs?: number) => void;
  /** Dismiss a toast notification by id. */
  dismissToast: (id: string) => void;
  // ── Battleground of the Card-born ────────────────────────────────────────────
  /** Enter lobby phase. Saves the current idle game state. */
  enterBattleground: (kind: BattlegroundKind, cpuDifficulty?: CpuDifficulty, opponentProfile?: BattlegroundOpponentProfile) => void;
  /** Tick the countdown timer. Called by centralized app-level timer loops. */
  tickBattlegroundTimer: (deltaSeconds: number) => void;
  /** Complete the match — computes result, grants rewards, restores saved state. */
  completeBattleground: () => void;
  /** Update opponent's live board + score (PvP realtime sync). */
  updateOpponentBattleground: (board: BoardState | null, score: number, handSize?: number) => void;
  /** Return to main menu from finished state (clears battleground slice). */
  dismissBattleground: () => void;
  computedStats: ComputedBoardStats;
  refreshComputedStats: () => void;
}

type Store = GameState & StoreActions;

interface AttackPaymentSelection {
  discardInstanceIds?: string[];
  sacrificeSeraphimInstanceIds?: string[];
  sacrificeAngelInstanceIds?: string[];
}

/**
 * Tune this constant so a complete, fully-mastered collection reaches
 * approximately ×40–50 total globalOblivionMult from resonance alone.
 * Lower value = stronger resonance; higher value = weaker.
 */
const RESONANCE_SCALE_CONSTANT = 500;

function getEntropicEnergyBalance(progress: ProgressState): number {
  return (progress.entropicEnergyBalance ?? progress.entropyBalance ?? 0);
}

type SocialProgressEvent =
  | 'friend_request_sent'
  | 'friend_added'
  | 'message_sent'
  | 'message_with_attachment'
  | 'gift_sent'
  | 'battleground_invite_sent'
  | 'coop_boss_invite_sent'
  | 'coop_boss_invite_accepted';

function ensureSocialStats(progress: ProgressState): NonNullable<ProgressState['socialStats']> {
  const current = progress.socialStats ?? {
    friendRequestsSent: 0,
    friendsAccepted: 0,
    messagesSent: 0,
    messagesWithAttachment: 0,
    giftsSent: 0,
    battlegroundInvitesSent: 0,
    coopBossInvitesSent: 0,
    coopBossInvitesAccepted: 0,
  };
  progress.socialStats = current;
  return current;
}

function latchUnlockedAchievements(progress: ProgressState): void {
  if (!progress.achievementUnlocks) progress.achievementUnlocks = {};
  // Fast path: once every badge that can ever unlock has been latched there is
  // nothing left to scan.  On a fully-completed save this avoids iterating
  // hundreds of TITLE_BADGES entries on every recompute() call.
  if (Object.keys(progress.achievementUnlocks).length >= TITLE_BADGES.length) return;
  for (const badge of TITLE_BADGES) {
    if (progress.achievementUnlocks[badge.id]) continue;
    if (badge.isUnlocked(progress)) progress.achievementUnlocks[badge.id] = true;
  }
}

function clampNeutralityGainState(state: Pick<Store, 'board' | 'turn' | 'deck'>): void {
  const isUncapped = hasNeutralityUncappedGainsInDeck(state.deck);
  state.turn.neutralityPatientLightStacks = clampPatientLightStacks(
    state.turn.neutralityPatientLightStacks ?? 0,
    isUncapped,
  );

  for (const unit of state.board.frontSlots) {
    if (!unit || (unit.type !== 'Seraphim' && unit.type !== 'Angel')) continue;
    unit.patienceStacks = clampPatienceStacks(unit.patienceStacks ?? 0, isUncapped);
  }
}

function recompute(state: Store): void {
  clampNeutralityGainState(state);
  // Latch profile avatar unlocks permanently once their condition is met.
  latchUnlockedAvatars(state.progress);
  // Latch reward UI theme unlocks permanently once their condition is met.
  latchUnlockedUiThemes(state.progress);
  // Latch achievements so newly-added achievements unlock retroactively.
  latchUnlockedAchievements(state.progress);
  state.computedStats = ScoreSystem.compute(state.board);
  const resonanceScore = computeGlobalResonanceScore(state.progress);
  if (resonanceScore > 0) {
    state.computedStats.globalOblivionMult += resonanceScore / RESONANCE_SCALE_CONSTANT;
  }
  state.computedStats.resonanceScore = resonanceScore;
  eventBus.emit('board:recomputed', state.computedStats);
}

function normalizeFinish(finish?: CardFinish): CardFinish {
  return finish === 'holo' ? 'holo' : 'normal';
}

function createDeckEntry(definitionId: string, copies: DeckEntry['copies'], finish: CardFinish = 'normal'): DeckEntry {
  return { definitionId, copies, finish };
}

function createExtraDeckEntry(definitionId: string, finish: CardFinish = 'normal'): ExtraDeckEntry {
  return { definitionId, finish };
}

function cloneDeckList(deckList: Array<DeckEntry | { definitionId: string; copies: DeckEntry['copies']; finish?: CardFinish }>): DeckEntry[] {
  return deckList.map(entry => createDeckEntry(entry.definitionId, entry.copies, normalizeFinish(entry.finish)));
}

function cloneExtraDeck(extraDeck?: Array<ExtraDeckEntry | string>): ExtraDeckEntry[] {
  if (!extraDeck) return [];
  // Dedupe: cap 4 copies per definitionId and 10 total. Stable order,
  // first-occurrence wins. Prevents ghost duplicates from corrupt saves or
  // legacy data where the same (definitionId, finish) appears multiple times.
  const MAX_PER_DEF = 4;
  const MAX_TOTAL = 10;
  const perDefCount: Record<string, number> = {};
  const out: ExtraDeckEntry[] = [];
  for (const raw of extraDeck) {
    if (out.length >= MAX_TOTAL) break;
    const definitionId = typeof raw === 'string' ? raw : raw.definitionId;
    if (!definitionId) continue;
    const finish = typeof raw === 'string' ? 'normal' : normalizeFinish(raw.finish);
    const count = perDefCount[definitionId] ?? 0;
    if (count >= MAX_PER_DEF) continue;
    perDefCount[definitionId] = count + 1;
    out.push(createExtraDeckEntry(definitionId, finish));
  }
  return out;
}

function cloneDeckCards(cards: Array<DeckCard | { instanceId: string; definitionId: string; finish?: CardFinish }>): DeckCard[] {
  return cards.map(card => ({
    instanceId: card.instanceId,
    definitionId: card.definitionId,
    finish: normalizeFinish(card.finish),
    ...((card as Partial<DeckCard>).faceState ? { faceState: (card as Partial<DeckCard>).faceState } : {}),
  }));
}

function toDeckCard(card: { instanceId: string; definitionId: string; finish?: CardFinish; faceState?: CardFaceState }): DeckCard {
  return {
    instanceId: card.instanceId,
    definitionId: card.definitionId,
    finish: normalizeFinish(card.finish),
    ...(card.faceState ? { faceState: card.faceState } : {}),
  };
}

let repairedDeckInstanceCounter = 0;
function nextRepairedDeckId(): string {
  repairedDeckInstanceCounter += 1;
  return `dk_fix_${Date.now()}_${repairedDeckInstanceCounter}`;
}

function normalizeDeckInstanceIds(deck: DeckState): DeckState {
  const seen = new Set<string>();
  let changed = false;

  const normalizeZone = (cards: DeckCard[]): DeckCard[] => cards.map(card => {
    if (!seen.has(card.instanceId)) {
      seen.add(card.instanceId);
      return card;
    }
    changed = true;
    const repaired = { ...card, instanceId: nextRepairedDeckId() };
    seen.add(repaired.instanceId);
    return repaired;
  });

  const drawPile = normalizeZone(deck.drawPile);
  const hand = normalizeZone(deck.hand);
  const discardPile = normalizeZone(deck.discardPile);
  if (!changed) return deck;

  return {
    ...deck,
    drawPile,
    hand,
    discardPile,
  };
}

function createDeckState(deckList: DeckEntry[], extraDeck?: Array<ExtraDeckEntry | string>): DeckState {
  const nextDeckList = cloneDeckList(deckList);
  return {
    deckList: nextDeckList,
    extraDeck: cloneExtraDeck(extraDeck),
    drawPile: DeckSystem.buildFromList(nextDeckList),
    hand: [],
    discardPile: [],
  };
}

function buildPracticeDeckListFromPool(pool: CardDefinition[], targetCopies: number): DeckEntry[] {
  const sorted = [...pool].sort((a, b) => a.definitionId.localeCompare(b.definitionId));
  if (!sorted.length) return [];

  const counts = new Map<string, number>();
  let remaining = targetCopies;

  for (const def of sorted) {
    if (remaining <= 0) break;
    counts.set(def.definitionId, 1);
    remaining -= 1;
  }

  while (remaining > 0) {
    let placed = false;
    for (const def of sorted) {
      if (remaining <= 0) break;
      const current = counts.get(def.definitionId) ?? 0;
      if (current >= 4) continue;
      counts.set(def.definitionId, current + 1);
      remaining -= 1;
      placed = true;
    }
    if (!placed) break;
  }

  return [...counts.entries()].map(([definitionId, count]) => ({
    definitionId,
    copies: Math.max(1, Math.min(4, count)) as DeckEntry['copies'],
    finish: 'normal' as const,
  }));
}

function buildPracticeExtraDeckFromPool(pool: CardDefinition[]): ExtraDeckEntry[] {
  return pool
    .filter(def => def.type === 'Angel')
    .sort((a, b) => a.definitionId.localeCompare(b.definitionId))
    .slice(0, 5)
    .map(def => ({ definitionId: def.definitionId, finish: 'normal' as const }));
}

function buildNeutralityTutorialDeck(
  tier: NeutralityTutorialTier,
): {
  packId: string;
  deckList: DeckEntry[];
  extraDeck: ExtraDeckEntry[];
  guideSteps: TrialDeckState['guideSteps'];
  guidedOpeningHand: string[];
  guidedDeckOrder: DeckEntry[];
} {
  const starterDef = getTrialDeckDefinition('pack-neutrality');

  const buildGuidedOpeningHand = (deckList: DeckEntry[]): string[] => {
    const expanded: string[] = [];
    for (const entry of deckList) {
      for (let i = 0; i < entry.copies; i++) expanded.push(entry.definitionId);
    }
    return expanded.slice(0, 5);
  };

  const buildTierGuideSteps = (openingHand: string[]): TrialDeckState['guideSteps'] => {
    const tierName = tier === 'starter' ? 'Starter' : tier === 'eternal' ? 'Eternal' : 'Infinite';
    return openingHand.map((definitionId, index) => {
      const def = CardRegistry.get(definitionId);
      const cardName = def?.name ?? definitionId;
      const cardType = def?.type ?? 'Card';
      return {
        cardDefinitionId: definitionId,
        hint: `Turn ${index + 1}: play ${cardName} (${cardType}) to advance the ${tierName} Neutrality tutorial lane and build your setup before cashing attacks.`,
      };
    });
  };

  if (!starterDef) {
    const fallbackOpeningHand = buildGuidedOpeningHand(cloneDeckList(STARTER_DECK_LIST));
    return {
      packId: NEUTRALITY_TUTORIAL_TRIAL_PACK_IDS.starter,
      deckList: cloneDeckList(STARTER_DECK_LIST),
      extraDeck: cloneExtraDeck(STARTER_EXTRA_DECK),
      guideSteps: buildTierGuideSteps(fallbackOpeningHand),
      guidedOpeningHand: fallbackOpeningHand,
      guidedDeckOrder: cloneDeckList(STARTER_DECK_LIST),
    };
  }

  if (tier === 'starter') {
    return {
      packId: NEUTRALITY_TUTORIAL_TRIAL_PACK_IDS.starter,
      deckList: cloneDeckList(starterDef.deckList),
      extraDeck: cloneExtraDeck(starterDef.extraDeck),
      guideSteps: [...starterDef.guideSteps],
      guidedOpeningHand: [...starterDef.guidedOpeningHand],
      guidedDeckOrder: cloneDeckList(starterDef.guidedDeckOrder.length > 0 ? starterDef.guidedDeckOrder : starterDef.deckList),
    };
  }

  const rarity = tier === 'eternal' ? 'Eternal' : 'Infinite';
  const pool = CardRegistry.getByRarity(rarity);
  const mainPool = pool.filter(def => def.type !== 'Angel');
  const deckList = buildPracticeDeckListFromPool(mainPool, 45);
  const extraDeck = buildPracticeExtraDeckFromPool(pool);

  if (!deckList.length) {
    const fallbackOpeningHand = buildGuidedOpeningHand(cloneDeckList(starterDef.deckList));
    return {
      packId: tier === 'eternal'
        ? NEUTRALITY_TUTORIAL_TRIAL_PACK_IDS.eternal
        : NEUTRALITY_TUTORIAL_TRIAL_PACK_IDS.infinite,
      deckList: cloneDeckList(starterDef.deckList),
      extraDeck: cloneExtraDeck(starterDef.extraDeck),
      guideSteps: buildTierGuideSteps(fallbackOpeningHand),
      guidedOpeningHand: fallbackOpeningHand,
      guidedDeckOrder: cloneDeckList(starterDef.deckList),
    };
  }

  const guidedOpeningHand = buildGuidedOpeningHand(deckList);

  return {
    packId: tier === 'eternal'
      ? NEUTRALITY_TUTORIAL_TRIAL_PACK_IDS.eternal
      : NEUTRALITY_TUTORIAL_TRIAL_PACK_IDS.infinite,
    deckList,
    extraDeck,
    guideSteps: buildTierGuideSteps(guidedOpeningHand),
    guidedOpeningHand,
    guidedDeckOrder: cloneDeckList(deckList),
  };
}

function addCollectionCard(progress: ProgressState, definitionId: string, finish: CardFinish = 'normal'): void {
  const definition = CardRegistry.get(definitionId);
  // No collection-side cap: every drawn copy is added so bulk pack opens always
  // grant the full count (the 4-of restriction is enforced at deckbuilding time).
  const nextCopies = (progress.collection[definitionId] ?? 0) + 1;
  progress.collection[definitionId] = nextCopies;

  // Auto-holofoil Eternal and Infinite cards on acquisition
  if (definition?.rarity === 'Eternal' || definition?.rarity === 'Infinite') {
    const nextHoloCopies = (progress.holoCollection[definitionId] ?? 0) + 1;
    progress.holoCollection[definitionId] = Math.min(nextHoloCopies, progress.collection[definitionId]);
  } else if (finish === 'holo') {
    const nextHoloCopies = (progress.holoCollection[definitionId] ?? 0) + 1;
    progress.holoCollection[definitionId] = Math.min(nextHoloCopies, progress.collection[definitionId]);
  }

  if (definition?.rarity === 'Infinite') {
    progress.infiniteCollection[definitionId] = (progress.infiniteCollection[definitionId] ?? 0) + 1;
  }
  syncCardOwnershipHistory(progress, definitionId);

  // Mark as recently acquired (drives NEW badge in CollectionViewer).
  if (!progress.recentlyAcquired) progress.recentlyAcquired = {};
  progress.recentlyAcquired[definitionId] = Date.now();
}

function recordPackOpen(progress: ProgressState, packId: string, tier: 'pack' | 'box' | 'case', drawn: string[]): void {
  const rarityCounts: Record<string, number> = {};
  for (const defId of drawn) {
    const r = CardRegistry.get(defId)?.rarity ?? 'Common';
    rarityCounts[r] = (rarityCounts[r] ?? 0) + 1;
  }
  if (!progress.packOpenHistory) progress.packOpenHistory = [];
  progress.packOpenHistory.unshift({ ts: Date.now(), packId, tier, rarityCounts });
  if (progress.packOpenHistory.length > 50) {
    progress.packOpenHistory.length = 50;
  }
}

function awardBossVictoryRewards(progress: ProgressState, boss: (typeof BOSS_DEFINITIONS)[number], rewardCopies = 1): void {
  const priorClears = progress.bossClearCounts[boss.id] ?? 0;
  progress.bossClearCounts[boss.id] = priorClears + 1;
  const base = priorClears === 0 ? boss.firstClearShards : boss.repeatClearShards;
  const mult = getBossRewardMultiplier(boss.id);
  progress.aberratedShards += Math.round(base * mult);
  const copies = Math.max(1, Math.min(3, Math.floor(rewardCopies)));
  for (let i = 0; i < copies; i += 1) {
    addCollectionCard(progress, boss.rewardCardId, 'holo');
  }
  // Quest hooks
  emitQuestProgressToProgress(progress, { kind: 'win_boss', amount: 1 });
}

function applyNullRaidProveYourselfUnlock(progress: ProgressState, raidId: string, damageInFirstMinute: number): void {
  if (!raidId) return;
  if (!Number.isFinite(damageInFirstMinute) || damageInFirstMinute <= 0) return;
  const raid = NULL_RAID_DEFINITIONS.find(def => def.id === raidId);
  if (!raid) return;
  if (!progress.nullRaidProveUnlocks) progress.nullRaidProveUnlocks = {};
  if (progress.nullRaidProveUnlocks[raid.id] === true) return;
  const targetDamage = getNullRaidProveYourselfTargetDamage(raid);
  if (targetDamage > 0 && damageInFirstMinute >= targetDamage) {
    progress.nullRaidProveUnlocks[raid.id] = true;
  }
}

/**
 * Apply quest progress to the daily + weekly rotations. Pure on the
 * `progress` object (mutates immer-managed draft). Also lazily rolls fresh
 * quests if the rotation is stale.
 */
function emitQuestProgressToProgress(
  progress: ProgressState,
  evt: { kind: QuestKind; amount: number; element?: string; peak?: number },
): void {
  if (!progress.quests) return;
  const rotated = refreshQuestRotation(progress.quests, Date.now());
  progress.quests.daily = applyQuestProgress(rotated.daily, evt);
  progress.quests.weekly = applyQuestProgress(rotated.weekly, evt);
  progress.quests.lastDailyRollDay = rotated.lastDailyRollDay;
  progress.quests.lastWeeklyRollWeek = rotated.lastWeeklyRollWeek;
}

/**
 * Bookkeeping for every card-play site. Increments mastery counts and
 * emits engine-flavored quest progress events. Always called *after* the
 * play has fully resolved (so `definitionId` is the real card played).
 */
function recordCardPlay(s: Store, definitionId: string): void {
  if (s.trialDeck.mode === 'active') return;
  s.progress.totalCardsPlayed += 1;
  if (!s.progress.cardPlayCounts) s.progress.cardPlayCounts = {};
  s.progress.cardPlayCounts[definitionId] = (s.progress.cardPlayCounts[definitionId] ?? 0) + 1;
  const def = ScoreSystem.getDefinition(definitionId);
  if (!def) return;
  emitQuestProgressToProgress(s.progress, { kind: 'play_cards', amount: 1 });
  const typeKind: QuestKind | null =
    def.type === 'Seraphim' ? 'play_seraphim'
    : def.type === 'Cherubim' ? 'play_cherubim'
    : def.type === 'Ophanim' ? 'play_ophanim'
    : null;
  if (typeKind) {
    emitQuestProgressToProgress(s.progress, { kind: typeKind, amount: 1 });
  }
}

// �E��E��E��E� Boss fight helpers �E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E�

function completeBossFight(s: Store, victory: boolean): void {
  const bossId = s.bossFight.activeBossId;
  if (bossId) eventBus.emit('boss:defeated', { bossId, victory });
  const newCooldowns = { ...s.bossFight.cooldowns };
  if (bossId && s.bossFight.kind !== 'gauntlet' && s.bossFight.kind !== 'null_raid') newCooldowns[bossId] = Date.now() + 60_000;

  const kind = s.bossFight.kind ?? 'normal';
  const trialMult = s.bossFight.trialRewardMult ?? 1;
  const modifiers = s.bossFight.modifiers ?? [];
  const gauntletShardsBanked = s.bossFight.gauntletShardsBanked ?? 0;
  const gauntletDepth = s.bossFight.gauntletDepth ?? 0;
  const damageFirstMinute = s.bossFight.damageDealtFirstMinute ?? 0;
  const saved = s.bossFight.savedGameState;
  let rewardSummary: BossFightState['rewardSummary'] = null;

  // ── Gauntlet continuation: on victory in gauntlet mode, advance to the
  //    next boss instead of restoring saved state.
  if (victory && kind === 'gauntlet' && bossId) {
    const boss = BOSS_DEFINITIONS.find(b => b.id === bossId);
    const nextIndex = (BOSS_DEFINITIONS.findIndex(b => b.id === bossId) + 1) % BOSS_DEFINITIONS.length;
    const nextBoss = BOSS_DEFINITIONS[nextIndex];
    if (boss && nextBoss) {
      // Bank shards (scaled by depth) without granting them yet.
      const earned = (boss.repeatClearShards ?? 5) + gauntletDepth * 3;
      const newBanked = gauntletShardsBanked + earned;
      // Carry HP fraction from current fight.
      const hpFrac = s.bossFight.bossMaxHp > 0 ? Math.max(0.25, s.bossFight.bossCurrentHp > 0 ? 1 : 1) : 1;
      // Continue with a fresh boss, slightly tougher each depth.
      const nextBossBaseHp = isEventBossCategory(nextBoss.category)
        ? ensureEventBossHpSnapshot(s.progress)
        : nextBoss.hp;
      const nextMaxHp = Math.round(nextBossBaseHp * (1 + gauntletDepth * 0.1));
      // Reset board + turn but keep deck (shuffled fresh for next opponent).
      const savedDeckSnapshot = s.bossFight.savedGameState; // preserve baseline
      const snapshotDeck = savedDeckSnapshot?.deck;
      const snapshotPool = snapshotDeck
        ? [...snapshotDeck.hand, ...snapshotDeck.drawPile, ...snapshotDeck.discardPile]
        : [...s.deck.hand, ...s.deck.drawPile, ...s.deck.discardPile];
      s.deck = {
        ...s.deck,
        hand: [],
        drawPile: DeckSystem.shuffle(snapshotPool),
        discardPile: [],
        extraDeck: snapshotDeck ? [...snapshotDeck.extraDeck] : [...s.deck.extraDeck],
      };
      s.board = { frontSlots: [null, null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] };
      s.turn = { ...defaultTurn, phase: 'idle' };
      s.bossFight = {
        mode: 'active',
        activeBossId: nextBoss.id,
        bossCurrentHp: nextMaxHp,
        bossMaxHp: nextMaxHp,
        damageDealtThisFight: 0,
        damageDealtFirstMinute: 0,
        fightTimeRemaining: BOSS_FIGHT_ROUND_SECONDS,
        cooldowns: newCooldowns,
        savedGameState: savedDeckSnapshot,
        kind: 'gauntlet',
        modifiers: [],
        trialRewardMult: 1,
        gauntletDepth: gauntletDepth + 1,
        gauntletShardsBanked: newBanked,
        gauntletHpCarryFrac: hpFrac,
        fightCount: 1,
        rewardSummary: null,
      };
      // Count this clear toward quests.
      emitQuestProgressToProgress(s.progress, { kind: 'win_boss', amount: 1 });
      recompute(s);
      return;
    }
  }

  // ── Null Raid encounter chain: on victory, advance to the next encounter.
  //    On defeat or last encounter victory, grant accumulated rewards.
  if (kind === 'null_raid') {
    const encounterBossIds = s.bossFight.nullRaidEncounterBossIds ?? [];
    const encounterIndex = s.bossFight.nullRaidEncounterIndex ?? 0;
    const raidId = s.bossFight.nullRaidId ?? '';
    const provingOnly = s.bossFight.nullRaidProvingOnly === true;
    const raidDef = NULL_RAID_DEFINITIONS.find(r => r.id === raidId);
    const entropyGain = raidDef?.entropyPerEncounter ?? 75;
    const shardsGain = raidDef?.shardsPerEncounter ?? 20;
    const accEntropy = provingOnly ? 0 : (s.bossFight.nullRaidAccumulatedEntropy ?? 0) + (victory ? entropyGain : 0);
    const accShards = provingOnly ? 0 : (s.bossFight.nullRaidAccumulatedShards ?? 0) + (victory ? shardsGain : 0);
    const raidBestDamageFirstMinute = Math.max(s.bossFight.nullRaidBestDamageFirstMinute ?? 0, damageFirstMinute);
    const proveTargetDamage = raidDef ? getNullRaidProveYourselfTargetDamage(raidDef) : 0;
    const provingPassed = provingOnly && proveTargetDamage > 0 && raidBestDamageFirstMinute >= proveTargetDamage;
    const nextIndex = encounterIndex + 1;

    // Advance to next encounter if victorious and more encounters remain.
    if (victory && nextIndex < encounterBossIds.length) {
      const nextBossId = encounterBossIds[nextIndex];
      const nextBoss = NULL_RAID_BOSS_MAP.get(nextBossId);
      if (nextBoss) {
        s.deck = {
          ...s.deck,
          hand: [],
          drawPile: DeckSystem.shuffle([...s.deck.hand, ...s.deck.drawPile, ...s.deck.discardPile]),
          discardPile: [],
        };
        s.board = { frontSlots: [null, null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] };
        s.turn = { ...defaultTurn, phase: 'idle' };
        s.bossFight = {
          mode: 'active',
          activeBossId: nextBossId,
          bossCurrentHp: nextBoss.hp,
          bossMaxHp: nextBoss.hp,
          damageDealtThisFight: 0,
          damageDealtFirstMinute: 0,
          fightTimeRemaining: NULL_RAID_ENCOUNTER_SECONDS,
          cooldowns: newCooldowns,
          savedGameState: s.bossFight.savedGameState,
          kind: 'null_raid',
          nullRaidId: raidId,
          nullRaidEncounterBossIds: encounterBossIds,
          nullRaidEncounterIndex: nextIndex,
          nullRaidAccumulatedEntropy: accEntropy,
          nullRaidAccumulatedShards: accShards,
          nullRaidBestDamageFirstMinute: raidBestDamageFirstMinute,
          nullRaidProvingOnly: provingOnly,
          fightCount: 1,
          rewardSummary: null,
        };
        if (!provingOnly) {
          emitQuestProgressToProgress(s.progress, { kind: 'win_boss', amount: 1 });
        }
        recompute(s);
        return;
      }
    }

    // Raid ended (defeat or final boss cleared) — restore saved game state.
    if (saved) {
      s.deck = saved.deck;
      s.board = saved.board;
      s.turn = saved.turn;
      s.progress = saved.progress;
      s.settings = saved.settings;
    }

    applyNullRaidProveYourselfUnlock(s.progress, raidId, raidBestDamageFirstMinute);

    if (!provingOnly) {
      // Grant accumulated rewards.
      s.progress.entropicEnergyBalance = getEntropicEnergyBalance(s.progress) + accEntropy;
      s.progress.aberratedShards += accShards;
    }

    // Apply cooldown only on successful full clear.
    if (!provingOnly && victory) {
      if (!s.progress.nullRaidCooldowns) s.progress.nullRaidCooldowns = {};
      s.progress.nullRaidCooldowns[raidId] = Date.now() + 60_000;
    }

    if (!provingOnly && victory) {
      // Record clear.
      if (!s.progress.nullRaidClears) s.progress.nullRaidClears = {};
      s.progress.nullRaidClears[raidId] = (s.progress.nullRaidClears[raidId] ?? 0) + 1;

      emitQuestProgressToProgress(s.progress, { kind: 'win_boss', amount: 1 });
    }

    s.bossFight = {
      mode: provingPassed || victory ? 'victory' : 'defeat',
      activeBossId: bossId,
      bossCurrentHp: s.bossFight.bossCurrentHp,
      bossMaxHp: s.bossFight.bossMaxHp,
      damageDealtThisFight: s.bossFight.damageDealtThisFight,
      damageDealtFirstMinute: damageFirstMinute,
      fightTimeRemaining: 0,
      cooldowns: newCooldowns,
      savedGameState: null,
      kind: 'null_raid',
      nullRaidId: raidId,
      nullRaidEncounterBossIds: encounterBossIds,
      nullRaidEncounterIndex: encounterIndex,
      nullRaidAccumulatedEntropy: accEntropy,
      nullRaidAccumulatedShards: accShards,
      nullRaidBestDamageFirstMinute: raidBestDamageFirstMinute,
      nullRaidProvingOnly: provingOnly,
      fightCount: 1,
      rewardSummary: {
        entropicEnergyEarned: accEntropy,
        shardsEarned: accShards,
      },
    };
    recompute(s);
    return;
  }
  // Capture per-fight bests BEFORE we restore the saved progress snapshot,
  // since we need the live (active) fight stats here.
  const elapsedSeconds = Math.max(0, Math.round(BOSS_FIGHT_ROUND_SECONDS - s.bossFight.fightTimeRemaining));
  const fightDamageTotal = s.bossFight.damageDealtThisFight;
  // Capture the deck in use for mastery awards before state is restored.
  const fightDeckList = s.deck.deckList;
  const fightExtraDeck = s.deck.extraDeck;

  if (saved) {
    s.deck = saved.deck;
    s.board = saved.board;
    s.turn = saved.turn;
    s.progress = saved.progress;
    s.settings = saved.settings;
  }

  if (victory && bossId) {
    const boss = BOSS_DEFINITIONS.find(b => b.id === bossId);
    if (boss) {
      const priorShards = s.progress.aberratedShards;
      const rewardCopies = kind === 'normal' ? Math.max(1, Math.min(3, s.bossFight.fightCount ?? 1)) : 1;
      awardBossVictoryRewards(s.progress, boss, rewardCopies);
      // Boss Codex personal-best tracking (save v13+).
      if (!s.progress.bossCodex) s.progress.bossCodex = {};
      const entry = s.progress.bossCodex[boss.id] ?? {};
      if (entry.firstClearAt === undefined) entry.firstClearAt = Date.now();
      if (elapsedSeconds > 0 && (entry.fastestClearSeconds === undefined || elapsedSeconds < entry.fastestClearSeconds)) {
        entry.fastestClearSeconds = elapsedSeconds;
      }
      if (fightDamageTotal > 0 && (entry.highestFightDamage === undefined || fightDamageTotal > entry.highestFightDamage)) {
        entry.highestFightDamage = fightDamageTotal;
      }
      s.progress.bossCodex[boss.id] = entry;
      // Trial reward bonus — applied on top of base + featured multipliers.
      if (kind === 'trial' && trialMult > 1) {
        const base = (s.progress.bossClearCounts[boss.id] ?? 1) === 1 ? boss.firstClearShards : boss.repeatClearShards;
        s.progress.aberratedShards += Math.round(base * (trialMult - 1));
      }
      // Weekly Trial cosmetic credit (no shards): if this trial matches the
      // current week's rotating trial AND we haven't claimed this week yet,
      // record the completion. This drives the milestone titles.
      if (kind === 'trial') {
        const weekly = getWeeklyTrial();
        if (weekly.bossId === boss.id) {
          if (!s.progress.weeklyTrialCompletions) s.progress.weeklyTrialCompletions = {};
          const prior = s.progress.weeklyTrialCompletions[weekly.weekKey] ?? 0;
          s.progress.weeklyTrialCompletions[weekly.weekKey] = prior + 1;
        }
      }
      // Award card mastery for every card in the fight deck. Boss index drives
      // the base amount (higher-tier bosses give more), then mode-specific
      // caps keep rewards bounded (normal 20, trial 35).
      const bossIdx = Math.max(0, BOSS_DEFINITIONS.findIndex(b => b.id === boss.id));
      const baseMasteryPerCard = getBossFightMasteryPerCard(
        bossIdx,
        BOSS_DEFINITIONS.length,
        kind === 'trial' ? trialMult : 1,
        kind === 'trial' ? MAX_MASTERY_PROGRESS_PER_CARD_TRIAL_GAUNTLET : MAX_MASTERY_PROGRESS_PER_CARD_BOSS,
      );
      const normalFightCount = kind === 'normal' ? Math.max(1, Math.min(3, s.bossFight.fightCount ?? 1)) : 1;
      const masteryPerCard = baseMasteryPerCard * normalFightCount;
      const masteryAward = applyMasteryReward(s.progress, fightDeckList, fightExtraDeck, masteryPerCard);
      rewardSummary = {
        shardsEarned: s.progress.aberratedShards - priorShards,
        masteryPerCard,
        totalTierProgress: masteryAward.totalAppliedProgress,
        resonanceGained: masteryAward.resonanceGain,
        cardsTieredUp: masteryAward.cardsTieredUp,
      };
    }
  }

  // Gauntlet loss / quit: grant any banked shards.
  if (kind === 'gauntlet' && gauntletShardsBanked > 0) {
    s.progress.aberratedShards += gauntletShardsBanked;
  }

  // Gauntlet run ended — record personal-best stats.
  if (kind === 'gauntlet') {
    if (!s.progress.gauntletBest) s.progress.gauntletBest = { bestDepth: 0, bestShards: 0, runs: 0 };
    const best = s.progress.gauntletBest;
    if (gauntletDepth > best.bestDepth) best.bestDepth = gauntletDepth;
    if (gauntletShardsBanked > best.bestShards) best.bestShards = gauntletShardsBanked;
    best.runs += 1;
    // Award card mastery scaled by how many bosses were cleared this run,
    // then clamp to the gauntlet cap (35 per card).
    const gauntletMasteryPerCard = getGauntletMasteryPerCard(gauntletDepth);
    const masteryAward = applyMasteryReward(s.progress, fightDeckList, fightExtraDeck, gauntletMasteryPerCard);
    rewardSummary = {
      shardsEarned: gauntletShardsBanked,
      masteryPerCard: gauntletMasteryPerCard,
      totalTierProgress: masteryAward.totalAppliedProgress,
      resonanceGained: masteryAward.resonanceGain,
      cardsTieredUp: masteryAward.cardsTieredUp,
    };
  }

  const finalHp = s.bossFight.bossCurrentHp;
  const damageDealt = s.bossFight.damageDealtThisFight;
  const maxHp = s.bossFight.bossMaxHp;
  const coopPartySize = s.bossFight.coopPartySize ?? 1;
  const fightCount = Math.max(1, Math.min(3, s.bossFight.fightCount ?? 1));
  const coopSessionId = s.bossFight.coopSessionId;
  const coopRole = s.bossFight.coopRole;
  s.bossFight = {
    mode: victory ? 'victory' : 'defeat',
    activeBossId: bossId,
    bossCurrentHp: finalHp,
    bossMaxHp: maxHp,
    damageDealtThisFight: damageDealt,
    damageDealtFirstMinute: damageFirstMinute,
    fightTimeRemaining: 0,
    cooldowns: newCooldowns,
    savedGameState: null,
    kind,
    modifiers,
    trialRewardMult: trialMult,
    gauntletDepth,
    gauntletShardsBanked,
    gauntletHpCarryFrac: 1,
    coopPartySize,
    fightCount,
    coopSessionId,
    coopRole,
    rewardSummary,
  };
  // Suppress reference to unused vars if linter cares
  void modifiers;
  recompute(s);
}

function grantOblivion(s: Store, amount: number): void {
  if (amount <= 0) return;
  // Trial: patience_lock reduces all Oblivion gains by 15%.
  if (s.bossFight.mode === 'active' && s.bossFight.kind === 'trial' && s.bossFight.modifiers?.some(m => m.kind === 'patience_lock')) {
    amount = Math.max(1, Math.floor(amount * 0.85));
  }
  // Global Oblivion multiplier from cherubim_global_oblivion_mult passives (additive, all sources).
  if (s.computedStats.globalOblivionMult > 0) {
    amount = Math.round(amount * (1 + s.computedStats.globalOblivionMult));
  }
  s.turn.oblivionEarnedThisTurn += amount;
  if (s.bossFight.mode === 'active') {
    const isEternityCoopBoss = s.bossFight.kind === 'normal' && !!s.bossFight.coopSessionId;
    const canEmitCoopDamage = isEternityCoopBoss && useCoopSyncStore.getState().attached;
    const fightSeconds = s.bossFight.kind === 'null_raid' ? NULL_RAID_ENCOUNTER_SECONDS : BOSS_FIGHT_ROUND_SECONDS;
    const elapsed = Math.max(0, fightSeconds - s.bossFight.fightTimeRemaining);
    if (elapsed < NULL_RAID_PROVE_YOURSELF_SECONDS) {
      s.bossFight.damageDealtFirstMinute = (s.bossFight.damageDealtFirstMinute ?? 0) + amount;
      if (s.bossFight.kind === 'null_raid') {
        const best = s.bossFight.nullRaidBestDamageFirstMinute ?? 0;
        s.bossFight.nullRaidBestDamageFirstMinute = Math.max(best, s.bossFight.damageDealtFirstMinute ?? 0);
      }
    }
    if (canEmitCoopDamage) {
      const sourceUserId = useSocialStore.getState().user?.id;
      if (sourceUserId) {
        void useCoopSyncStore.getState().emit({
          type: 'boss_damage',
          payload: { amount, sourceUserId },
        });
      } else {
        s.bossFight.damageDealtThisFight += amount;
        s.bossFight.bossCurrentHp = Math.max(0, s.bossFight.bossCurrentHp - amount);
        eventBus.emit('boss:damaged', { delta: amount, remaining: s.bossFight.bossCurrentHp });
        checkBossDefeated(s);
      }
    } else {
      s.bossFight.damageDealtThisFight += amount;
      s.bossFight.bossCurrentHp = Math.max(0, s.bossFight.bossCurrentHp - amount);
      eventBus.emit('boss:damaged', { delta: amount, remaining: s.bossFight.bossCurrentHp });
      checkBossDefeated(s);
    }
  } else {
    s.progress.oblivion += amount;
    s.progress.lifetimeOblivion = (s.progress.lifetimeOblivion ?? 0) + amount;
    eventBus.emit('oblivion:earned', { delta: amount, total: s.progress.oblivion });
  }
  // Also track battleground score when a match is active.
  if (s.battleground.mode === 'active') {
    s.battleground.myScore += amount;
  }
  emitQuestProgressToProgress(s.progress, { kind: 'earn_oblivion_in_turn', amount: 0, peak: s.turn.oblivionEarnedThisTurn });
}

/** Accumulate stagger on the boss Card-break meter. Triggers a 5-second timer
 *  freeze every time the meter reaches 100. Each unit of `staggerAmount` is
 *  one point on the 0-100 scale. */
function applyCardBreakStagger(s: Store, staggerAmount: number): void {
  if (s.bossFight.mode !== 'active' || staggerAmount <= 0) return;
  const CARD_BREAK_MAX = 100;
  const CARD_BREAK_FREEZE_SECONDS = 5;
  s.bossFight.bossCardBreakMeter = (s.bossFight.bossCardBreakMeter ?? 0) + staggerAmount;
  if (s.bossFight.bossCardBreakMeter >= CARD_BREAK_MAX) {
    s.bossFight.bossCardBreakMeter = 0;
    s.bossFight.bossCardBreakFreezeLeft = (s.bossFight.bossCardBreakFreezeLeft ?? 0) + CARD_BREAK_FREEZE_SECONDS;
    s.bossFight.bossCardBreakCount = (s.bossFight.bossCardBreakCount ?? 0) + 1;
    eventBus.emit('boss:cardbreak', { count: s.bossFight.bossCardBreakCount });
  }
}

function isActiveEternityCoopBossFight(state: Pick<Store, 'bossFight'>): boolean {
  return state.bossFight.mode === 'active'
    && state.bossFight.kind === 'normal'
    && typeof state.bossFight.coopSessionId === 'string'
    && state.bossFight.coopSessionId.length > 0;
}

function isLocalOutOfCardsForCoop(state: Pick<Store, 'deck'>): boolean {
  return state.deck.hand.length === 0 && state.deck.drawPile.length === 0 && state.deck.discardPile.length === 0;
}

async function reportEternityCoopParticipantState(options: { markEnded?: boolean; markHandEmpty?: boolean; forceEvaluate?: boolean }): Promise<void> {
  const state = useStore.getState();
  if (!isActiveEternityCoopBossFight(state)) return;

  const sessionId = state.bossFight.coopSessionId;
  if (!sessionId) return;

  const wantMarkEnded = !!options.markEnded;
  const wantMarkHandEmpty = !!options.markHandEmpty;
  if (!wantMarkEnded && !wantMarkHandEmpty && !options.forceEvaluate) return;

  const me = useSocialStore.getState().user?.id;
  const sb = getSupabase();
  if (!sb || !me) return;

  // Retry a few times to absorb concurrent writes where both peers mark end
  // state at nearly the same moment and one write can temporarily overwrite.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data: sessionRow } = await sb
      .from('eternity_wake_coop_sessions')
      .select('id, status, host_id, accepted_user_ids, coop_end_turn_user_ids, coop_hand_empty_user_ids, coop_disconnected_user_ids')
      .eq('id', sessionId)
      .maybeSingle();

    if (!sessionRow || sessionRow.status !== 'active') return;

    const participants = Array.from(new Set([
      sessionRow.host_id as string,
      ...((Array.isArray(sessionRow.accepted_user_ids) ? sessionRow.accepted_user_ids : []).filter(Boolean) as string[]),
    ]));

    const ended = new Set(((Array.isArray(sessionRow.coop_end_turn_user_ids) ? sessionRow.coop_end_turn_user_ids : []) as string[]).filter(Boolean));
    const handEmpty = new Set(((Array.isArray(sessionRow.coop_hand_empty_user_ids) ? sessionRow.coop_hand_empty_user_ids : []) as string[]).filter(Boolean));
    const disconnected = new Set(((Array.isArray((sessionRow as { coop_disconnected_user_ids?: unknown }).coop_disconnected_user_ids)
      ? (sessionRow as { coop_disconnected_user_ids?: string[] }).coop_disconnected_user_ids
      : []) as string[]).filter(Boolean));

    const shouldMarkEnded = wantMarkEnded && !ended.has(me);
    const shouldMarkHandEmpty = wantMarkHandEmpty && !handEmpty.has(me);
    if (shouldMarkEnded) ended.add(me);
    if (shouldMarkHandEmpty) handEmpty.add(me);

    const everyoneDone = participants.length > 0 && participants.every(id => ended.has(id) || handEmpty.has(id) || disconnected.has(id));

    const patch: Record<string, unknown> = {};
    if (shouldMarkEnded) patch.coop_end_turn_user_ids = Array.from(ended);
    if (shouldMarkHandEmpty) patch.coop_hand_empty_user_ids = Array.from(handEmpty);
    if (everyoneDone) {
      patch.status = 'finished';
      patch.finished_at = new Date().toISOString();
    }

    if (Object.keys(patch).length > 0) {
      await sb
        .from('eternity_wake_coop_sessions')
        .update(patch)
        .eq('id', sessionId)
        .eq('status', 'active');
    }

    if (everyoneDone) return;
    if (!shouldMarkEnded && !shouldMarkHandEmpty) return;
  }
}

async function markEternityCoopParticipantDisconnected(userId: string): Promise<void> {
  const state = useStore.getState();
  if (!isActiveEternityCoopBossFight(state)) return;
  const sessionId = state.bossFight.coopSessionId;
  if (!sessionId || !userId) return;

  const sb = getSupabase();
  if (!sb) return;

  const { data: row } = await sb
    .from('eternity_wake_coop_sessions')
    .select('id, status, coop_disconnected_user_ids')
    .eq('id', sessionId)
    .maybeSingle();

  if (!row || row.status !== 'active') return;

  const disconnected = new Set(((Array.isArray((row as { coop_disconnected_user_ids?: unknown }).coop_disconnected_user_ids)
    ? (row as { coop_disconnected_user_ids?: string[] }).coop_disconnected_user_ids
    : []) as string[]).filter(Boolean));
  if (disconnected.has(userId)) {
    await reportEternityCoopParticipantState({ forceEvaluate: true });
    return;
  }

  disconnected.add(userId);
  await sb
    .from('eternity_wake_coop_sessions')
    .update({ coop_disconnected_user_ids: Array.from(disconnected) })
    .eq('id', sessionId)
    .eq('status', 'active');

  await reportEternityCoopParticipantState({ forceEvaluate: true });
}

function checkBossDefeated(s: Store): void {
  if (s.bossFight.mode === 'active' && s.bossFight.bossCurrentHp <= 0) {
    completeBossFight(s, true);
  }
}

const BATTLEGROUND_MILESTONE_SCORE: [string, number][] = [
  ['10k', 10_000],
  ['50k', 50_000],
  ['250k', 250_000],
];
const BATTLEGROUND_COOLDOWN_MS = 60_000;

function completeBattlegroundFight(s: Store): void {
  if (s.battleground.mode !== 'active') return;
  const my = s.battleground.myScore;
  const opp = s.battleground.opponentScore;
  const result: 'win' | 'loss' | 'draw' = my > opp ? 'win' : my < opp ? 'loss' : 'draw';
  const kind = s.battleground.kind ?? 'cpu';
  const diff = s.battleground.cpuDifficulty ?? 'normal';

  // ── Shard reward ──────────────────────────────────────────────────────────
  const now = Date.now();
  const stats = s.progress.battlegroundStats ?? { wins: 0, losses: 0, bestScore: 0, totalMatches: 0, claimedMilestones: [], dailyMatchTimestamps: [] };

  // All matches grant rewards (no daily cap).
  const underCap = true;

  if (underCap) {
    let shards = 0;
    if (kind === 'pvp') {
      shards = result === 'win' ? 120 : result === 'draw' ? 60 : 40;
    } else {
      if (result === 'win') {
        shards = diff === 'hard' ? 80 : diff === 'normal' ? 60 : 40;
      } else {
        shards = 15;
      }
    }
    s.progress.aberratedShards += shards;
  }

  // ── Best-score update ─────────────────────────────────────────────────────
  const newBest = Math.max(stats.bestScore, my);

  // ── Milestone card pulls ──────────────────────────────────────────────────
  const claimedMilestones = [...stats.claimedMilestones];
  for (const [key, threshold] of BATTLEGROUND_MILESTONE_SCORE) {
    if (newBest >= threshold && !claimedMilestones.includes(key)) {
      claimedMilestones.push(key);
      // Grant a random common card from any registered pack (simple reward).
      s.progress.aberratedShards += 5;
    }
  }

  // ── Lifetime stats update ─────────────────────────────────────────────────
  s.progress.battlegroundStats = {
    wins: stats.wins + (result === 'win' ? 1 : 0),
    losses: stats.losses + (result === 'loss' ? 1 : 0),
    bestScore: newBest,
    totalMatches: stats.totalMatches + 1,
    claimedMilestones,
    dailyMatchTimestamps: stats.dailyMatchTimestamps,
  };

  // ── Finalise battleground state ───────────────────────────────────────────
  s.battleground.mode = 'finished';
  s.battleground.result = result;
  s.battleground.rewardClaimed = true;
  s.battleground.cooldownUntil = now + BATTLEGROUND_COOLDOWN_MS;
}



function canEmbraceInfinite(state: Pick<GameState, 'deck' | 'turn'>): boolean {
  return state.turn.phase === 'playing'
    && state.turn.pendingEffect === null
    && state.deck.hand.length >= EMBRACE_INFINITE_MIN_HAND;
}

function applyNeutralityTimerPauseFromTurn(s: Store): void {
  const seconds = Math.max(0, Math.floor(s.turn.neutralityPauseActiveTimersSeconds ?? 0));
  if (seconds <= 0) return;

  if (s.bossFight.mode === 'active') {
    s.bossFight.fightTimeRemaining = Math.max(0, s.bossFight.fightTimeRemaining + seconds);
  }

  if (s.battleground.mode === 'active') {
    s.battleground.timeRemaining = Math.max(0, s.battleground.timeRemaining + seconds);
  }

  s.turn.neutralityPauseActiveTimersSeconds = 0;
}

function pushRewardToast(s: Store, message: string): void {
  if (!s.toasts) s.toasts = [];
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  s.toasts.push({ id, message, kind: 'reward', ts: Date.now(), durationMs: 4200 });
  if (s.toasts.length > 8) s.toasts.splice(0, s.toasts.length - 8);
}

function pushEnigmaStepToast(s: Store, enigmaId: string, stepIndex: number): void {
  const definition = getEnigmaDefinition(enigmaId);
  const step = definition?.steps[stepIndex];
  if (!definition || !step) return;
  pushRewardToast(s, `Enigma Step Complete: ${definition.title} - ${step.title}`);
}

function syncEnigmaProgressFromBoard(s: Store, checkAcquisition: boolean): void {
  ensureEnigmaState(s.progress);
  const previousSteps = new Map<string, boolean[]>();
  for (const [id, instance] of Object.entries(s.progress.enigmas.instances)) {
    previousSteps.set(id, instance.stepsComplete.slice());
  }

  if (checkAcquisition) {
    const acquisition = evaluateEnigmaAcquisition({ board: s.board, progress: s.progress });
    if (acquisition.newlyAcquired.length > 0) {
      if (!s.progress.enigmas.activeEnigmaId) {
        s.progress.enigmas.activeEnigmaId = acquisition.newlyAcquired[0] ?? null;
      }
      for (const enigmaId of acquisition.newlyAcquired) {
        const instance = s.progress.enigmas.instances[enigmaId];
        if (instance && !instance.acquiredAt) instance.acquiredAt = Date.now();
        pushRewardToast(s, `Enigma Acquired: ${enigmaId === 'neutral-mystery' ? 'Neutral Mystery' : enigmaId}`);
      }
    }
  }

  evaluateNeutralMysteryProgress({ board: s.board, progress: s.progress });

  for (const [id, instance] of Object.entries(s.progress.enigmas.instances)) {
    const before = previousSteps.get(id) ?? [];
    const lastIndex = instance.stepsComplete.length - 1;
    for (let stepIndex = 1; stepIndex < lastIndex; stepIndex += 1) {
      const wasComplete = !!before[stepIndex];
      const isComplete = !!instance.stepsComplete[stepIndex];
      if (!wasComplete && isComplete) {
        pushEnigmaStepToast(s, id, stepIndex);
      }
    }
  }
}

function completeSummonedAngelPlacement(
  s: Store,
  definitionId: string,
  finish: CardFinish,
  slot: 0 | 1 | 2 | 3 | 4,
): boolean {
  if (s.board.frontSlots[slot] !== null) return false;
  const def = ScoreSystem.getDefinition(definitionId);
  if (!def || def.type !== 'Angel') return false;
  const angelDef = def as AngelDefinition;

  const angelInst: AngelInstance = {
    instanceId: `ang_${++angelInstanceCounter}`,
    definitionId,
    type: 'Angel',
    rarity: angelDef.rarity,
    finish,
    level: 1,
    cardsPlayedSinceSummon: 0,
    activated: false,
    attackCooldowns: {},
    boardSlot: slot,
  };

  s.board.frontSlots[slot] = angelInst;
  s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);
  eventBus.emit('angel:summoned', { definitionId, slot });
  recompute(s);

  const result = CardEffectExecutor.execute(
    { instanceId: angelInst.instanceId, definitionId, finish: angelInst.finish },
    s.turn,
    s.board,
    s.deck,
    false,
    { countAsPlay: false, removeFromHand: false },
  );
  if (result.canPlay) {
    const turnBefore = captureTurnSnapshot(s.turn);
    const actionClass = classifyActionClass(angelDef, angelDef.onSummonEffects);
    s.turn = result.turn;
    s.board = result.board;
    s.deck = result.deck;
    applyNeutralityTimerPauseFromTurn(s);
    applyAllSetPlayStates(s, angelDef, turnBefore, actionClass);
    awardOblivionForCardPlay(s, result.oblivionBonus, false, undefined, angelDef, actionClass);
    if (result.pendingEffect) s.turn.pendingEffect = result.pendingEffect;
  }

  syncEnigmaProgressFromBoard(s, true);
  checkBossDefeated(s);
  recompute(s);
  return true;
}

function effectCanDraw(effect: CardEffect): boolean {
  switch (effect.type) {
    case 'draw':
    case 'discard_draw':
    case 'look_top_take':
    case 'look_top_take_drop':
    case 'look_top_take_type':
    case 'search_deck_by_type':
    case 'search_deck_distinct_types':
    case 'salvage_by_type':
    case 'salvage_by_type_count':
    case 'salvage_any':
      return true;
    case 'conditional':
      return effect.then.some(sub => effectCanDraw(sub));
    default:
      return false;
  }
}

function cardCanDraw(definitionId: string): boolean {
  const def = CardRegistry.get(definitionId);
  if (!def) return false;
  if (def.type === 'Ophanim') return def.effects.some(effect => effectCanDraw(effect));
  if (def.type === 'Seraphim') return def.onPlayEffects.some(effect => effectCanDraw(effect));
  if (def.type === 'Cherubim') return def.onPlayEffects.some(effect => effectCanDraw(effect));
  return false;
}

function ensureNeutralityTurnState(turn: TurnState): void {
  if (turn.equilibriumDrift === undefined) turn.equilibriumDrift = 0;
  if (turn.equilibriumStability === undefined) turn.equilibriumStability = 0;
  if (turn.neutralitySetupCount === undefined) turn.neutralitySetupCount = 0;
  if (turn.attenuationClassUses === undefined) {
    turn.attenuationClassUses = { setup: 0, conversion: 0, multiplier: 0, refund: 0, finisher: 0 };
  }
  for (const cls of ATTENUATION_CLASSES) {
    turn.attenuationClassUses[cls] = turn.attenuationClassUses[cls] ?? 0;
  }
  if (turn.attenuationBreaksUsed === undefined) turn.attenuationBreaksUsed = 0;
  if (turn.attenuationBrokenClasses === undefined) turn.attenuationBrokenClasses = [];
  if (turn.neutralityEngineSignatures === undefined) turn.neutralityEngineSignatures = [];
  if (turn.neutralityPatienceChargedThisTurn === undefined) turn.neutralityPatienceChargedThisTurn = 0;
  if (turn.neutralityPatienceConsumedThisTurn === undefined) turn.neutralityPatienceConsumedThisTurn = 0;
  if (turn.neutralityPatientLightStacks === undefined) turn.neutralityPatientLightStacks = 0;
  if (turn.neutralityEquilibriumSigils === undefined) turn.neutralityEquilibriumSigils = 0;
  if (turn.neutralityEquilibriumSigilsGainedThisTurn === undefined) turn.neutralityEquilibriumSigilsGainedThisTurn = 0;
  if (turn.neutralityEquilibriumPatientLightFromSigilsThisTurn === undefined) turn.neutralityEquilibriumPatientLightFromSigilsThisTurn = 0;
  if (turn.neutralityEquilibriumSigilCapBonus === undefined) turn.neutralityEquilibriumSigilCapBonus = 0;
  if (turn.neutralityEquilibriumSentinelTempoUsed === undefined) turn.neutralityEquilibriumSentinelTempoUsed = false;
  if (turn.neutralityTriggeredEffects === undefined) turn.neutralityTriggeredEffects = [];
  if (turn.seraphimBonusAmp === undefined) turn.seraphimBonusAmp = 0;
}

function captureTurnSnapshot(turn: TurnState): TurnState {
  return {
    ...turn,
    attenuationClassUses: { ...(turn.attenuationClassUses ?? {}) },
    attenuationBrokenClasses: [...(turn.attenuationBrokenClasses ?? [])],
    neutralityEngineSignatures: [...(turn.neutralityEngineSignatures ?? [])],
  };
}

function recordLossEvent(
  _s: Store,
  _lostCards: Array<{ definitionId: string }>,
  _source: 'discard' | 'board' | 'sacrifice' | 'expire',
): void {
  // All dead-set loss tracking removed
}

function getDefinitionOnPlayEffects(def: CardDefinition): CardEffect[] {
  return getCardActionClassEffects(def);
}

function classifyActionClass(def: CardDefinition, effects: CardEffect[]): AttenuationClass {
  return classifyCardActionClass(def, effects);
}

function getDeckSetCount(s: Store): number {
  const setKeys = new Set<string>();
  for (const entry of s.deck.deckList) {
    const def = CardRegistry.get(entry.definitionId);
    if (def) setKeys.add('Neutrality');
  }
  for (const entry of s.deck.extraDeck) {
    const def = CardRegistry.get(entry.definitionId);
    if (def) setKeys.add('Neutrality');
  }
  return Math.max(1, setKeys.size);
}

function getNeutralityFullFireMultiplier(s: Store, def: CardDefinition): number {
  if (false || def.rarity !== 'Infinite') return 1;
  ensureNeutralityTurnState(s.turn);
  const setupReady = (s.turn.neutralitySetupCount ?? 0) >= NEUTRALITY_SETUP_FOR_FULL_FIRE;
  const enginesReady = (s.turn.neutralityEngineSignatures?.length ?? 0) >= NEUTRALITY_ENGINES_FOR_FULL_FIRE;
  return setupReady && enginesReady ? 1.35 : 0.70;
}






function getSetFullFireMultiplier(s: Store, def: CardDefinition): number {
  return getNeutralityFullFireMultiplier(s, def);
}

function applyAttenuationMultiplier(s: Store, actionClass: AttenuationClass): number {
  ensureNeutralityTurnState(s.turn);
  const uses = s.turn.attenuationClassUses?.[actionClass] ?? 0;
  const index = Math.min(uses, ATTENUATION_TIERS.length - 1);
  let multiplier = ATTENUATION_TIERS[index];

  const deckSetCount = getDeckSetCount(s);
  const maxBreaks = deckSetCount >= 2 ? 2 : 1;
  const breakCost = 3;
  const canBreak = (s.turn.equilibriumStability ?? 0) >= breakCost
    && (s.turn.attenuationBreaksUsed ?? 0) < maxBreaks
    && !(s.turn.attenuationBrokenClasses ?? []).includes(actionClass);

  if (canBreak) {
    multiplier = 1;
    s.turn.equilibriumStability = Math.max(0, (s.turn.equilibriumStability ?? 0) - breakCost);
    s.turn.attenuationBreaksUsed = (s.turn.attenuationBreaksUsed ?? 0) + 1;
    s.turn.attenuationBrokenClasses = [...(s.turn.attenuationBrokenClasses ?? []), actionClass];
  }

  s.turn.attenuationClassUses = {
    ...(s.turn.attenuationClassUses ?? {}),
    [actionClass]: uses + 1,
  };

  return multiplier;
}

function applyNeutralityPlayState(
  s: Store,
  def: CardDefinition,
  _beforeTurn: TurnState,
  actionClass: AttenuationClass,
): void {
  if (false) {
    
    return;
  }

  ensureNeutralityTurnState(s.turn);

  // Equilibrium drift: measure patience gain/spend balance
  const patienceGain = s.turn.neutralityPatienceChargedThisTurn ?? 0;
  const patienceSpend = s.turn.neutralityPatienceConsumedThisTurn ?? 0;
  const gain = patienceGain;
  const spend = patienceSpend;

  const oldDriftAbs = Math.abs(s.turn.equilibriumDrift ?? 0);
  s.turn.equilibriumDrift = Math.max(-60, Math.min(60, (s.turn.equilibriumDrift ?? 0) + gain - spend));
  const newDriftAbs = Math.abs(s.turn.equilibriumDrift ?? 0);

  let stabilityDelta = 0;
  if (newDriftAbs <= oldDriftAbs) stabilityDelta += 1;
  else stabilityDelta -= 1;
  if (gain > 0 && spend > 0) {
    stabilityDelta += 1;
  }
  if (actionClass === 'setup') stabilityDelta += 1;
  if (def.rarity === 'Eternal') stabilityDelta += 1;

  s.turn.equilibriumStability = Math.max(0, Math.min(12, (s.turn.equilibriumStability ?? 0) + stabilityDelta));

  if (def.rarity !== 'Infinite') {
    s.turn.neutralitySetupCount = Math.min(6, (s.turn.neutralitySetupCount ?? 0) + 1);
  }

  const signature = `${def.type}:${actionClass}`;
  if (!(s.turn.neutralityEngineSignatures ?? []).includes(signature)) {
    s.turn.neutralityEngineSignatures = [...(s.turn.neutralityEngineSignatures ?? []), signature].slice(-6);
  }

  if (actionClass === 'conversion') {
    // Cross-set conversion tracking removed (single-set game)
  }

  
}

function applyAllSetPlayStates(
  s: Store,
  def: CardDefinition,
  beforeTurn: TurnState,
  actionClass: AttenuationClass,
): void {
  applyNeutralityPlayState(s, def, beforeTurn, actionClass);
}

function endTurnInternal(s: Store): void {
  if (s.turn.phase !== 'playing') return;
  // Boss fights are time-pressure encounters. Outside of active Eternity co-op,
  // manually ending a turn during a fight is an immediate failure.
  if (s.bossFight.mode === 'active') {
    if (!(s.bossFight.kind === 'normal' && s.bossFight.coopSessionId)) {
      completeBossFight(s, false);
      return;
    }
  }

  // End turn hard-resets the board: every unit leaves play.
  for (let i = 0; i < s.board.frontSlots.length; i++) {
    const slot = s.board.frontSlots[i];
    if (slot) {
      recordLossEvent(s, [{ definitionId: slot.definitionId }], 'board');
      s.deck.discardPile.push(toDeckCard(slot));
    }
    (s.board.frontSlots as Array<(typeof s.board.frontSlots)[number]>)[i] = null;
  }

  // Back-row cleanup at turn end.
  for (let i = 0; i < s.board.backSlots.length; i++) {
    const card = s.board.backSlots[i];
    if (!card) continue;
    recordLossEvent(s, [{ definitionId: card.definitionId }], 'board');
    s.deck.discardPile.push(toDeckCard(card));
    s.board.backSlots[i] = null;
  }
  recordLossEvent(s, s.deck.hand.map(card => ({ definitionId: card.definitionId })), 'discard');
  for (const card of s.deck.hand) s.deck.discardPile.push(card);
  s.deck.hand = [];
  if (s.deck.discardPile.length > 0) {
    s.deck.drawPile = DeckSystem.reshuffleDiscard(s.deck.drawPile, s.deck.discardPile);
    s.deck.discardPile = [];
  }
  s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);
  s.board.activeBoardEffects = [];
  if (s.turn.oblivionEarnedThisTurn > (s.progress.bestSingleTurnOblivion ?? 0)) {
    s.progress.bestSingleTurnOblivion = s.turn.oblivionEarnedThisTurn;
  }
  // ── Trial Deck tracking ────────────────────────────────────────────────────
  if (s.trialDeck.mode === 'active') {
    s.trialDeck.turnCount = (s.trialDeck.turnCount ?? 0) + 1;
    s.trialDeck.trialOblivionTotal = (s.trialDeck.trialOblivionTotal ?? 0) + (s.turn.oblivionEarnedThisTurn ?? 0);
    // Guided mode: mark complete when all guide steps have been played
    if (s.trialDeck.trialMode === 'guided' && !s.trialDeck.guideComplete) {
      // Tutorial lanes sync their guide progression to completed turns so each
      // turn naturally advances the guide even if card order differs.
      if (isNeutralityTutorialTrialPackId(s.trialDeck.packId)) {
        const targetStep = Math.min(s.trialDeck.turnCount ?? 0, s.trialDeck.guideSteps.length);
        if (targetStep > s.trialDeck.guideStep) {
          s.trialDeck.guideStep = targetStep;
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('trial-guide-step-changed', {
              detail: { step: s.trialDeck.guideStep, total: s.trialDeck.guideSteps.length },
            }));
          }
        }
      }
      if (s.trialDeck.guideStep >= s.trialDeck.guideSteps.length) {
        s.trialDeck.guideComplete = true;
      }
    }
  }
  s.turn = { ...defaultTurn, phase: 'idle' };
  recompute(s);
}

function countFrontDefinitionIds(board: BoardState): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const slot of board.frontSlots) {
    if (!slot) continue;
    counts[slot.definitionId] = (counts[slot.definitionId] ?? 0) + 1;
  }
  return counts;
}

function isKnownCardDefinitionId(definitionId: string | null | undefined): definitionId is string {
  return typeof definitionId === 'string' && definitionId.length > 0 && CardRegistry.get(definitionId) !== undefined;
}

function sanitizeCountRecord(record: Record<string, number> | undefined): Record<string, number> {
  const cleaned: Record<string, number> = {};
  for (const [definitionId, rawValue] of Object.entries(record ?? {})) {
    if (!isKnownCardDefinitionId(definitionId)) continue;
    const value = Math.max(0, Math.floor(Number(rawValue) || 0));
    if (value <= 0) continue;
    cleaned[definitionId] = value;
  }
  return cleaned;
}

function sanitizeTimestampRecord(record: Record<string, number> | undefined): Record<string, number> {
  const cleaned: Record<string, number> = {};
  for (const [definitionId, rawValue] of Object.entries(record ?? {})) {
    if (!isKnownCardDefinitionId(definitionId)) continue;
    const value = Math.max(0, Math.floor(Number(rawValue) || 0));
    if (value <= 0) continue;
    cleaned[definitionId] = value;
  }
  return cleaned;
}

function sanitizeDeckCards<T extends { definitionId: string }>(cards: T[] | undefined): T[] {
  return (cards ?? []).filter(card => isKnownCardDefinitionId(card?.definitionId));
}

function sanitizeNullableBoardCards<T extends { definitionId: string }>(cards: Array<T | null> | undefined): Array<T | null> {
  return (cards ?? []).map(card => (card && isKnownCardDefinitionId(card.definitionId) ? card : null));
}

function sanitizeLoadedCardReferences(loaded: GameState): void {
  loaded.progress.collection = sanitizeCountRecord(loaded.progress.collection);
  loaded.progress.holoCollection = sanitizeCountRecord(loaded.progress.holoCollection);
  loaded.progress.infiniteCollection = sanitizeCountRecord(loaded.progress.infiniteCollection);
  loaded.progress.cardPlayCounts = sanitizeCountRecord(loaded.progress.cardPlayCounts);
  loaded.progress.cardLocks = sanitizeCountRecord(loaded.progress.cardLocks);
  loaded.progress.transcendentCollection = sanitizeCountRecord(loaded.progress.transcendentCollection);
  loaded.progress.recentlyAcquired = sanitizeTimestampRecord(loaded.progress.recentlyAcquired);

  loaded.progress.savedDecks = (loaded.progress.savedDecks ?? []).map(savedDeck => ({
    ...savedDeck,
    deckList: sanitizeDeckCards(savedDeck.deckList),
    extraDeck: sanitizeDeckCards(savedDeck.extraDeck),
  }));

  loaded.deck.hand = sanitizeDeckCards(loaded.deck.hand);
  loaded.deck.drawPile = sanitizeDeckCards(loaded.deck.drawPile);
  loaded.deck.discardPile = sanitizeDeckCards(loaded.deck.discardPile);
  loaded.deck.deckList = sanitizeDeckCards(loaded.deck.deckList);
  loaded.deck.extraDeck = sanitizeDeckCards(loaded.deck.extraDeck);

  loaded.board.frontSlots = sanitizeNullableBoardCards(loaded.board.frontSlots) as BoardState['frontSlots'];
  loaded.board.backSlots = sanitizeNullableBoardCards(loaded.board.backSlots) as BoardState['backSlots'];

  if (!isKnownCardDefinitionId(loaded.turn.lastPlayedDefinitionId)) {
    loaded.turn.lastPlayedDefinitionId = null;
  }
  if (loaded.turn.pendingEffect && 'cards' in loaded.turn.pendingEffect && Array.isArray(loaded.turn.pendingEffect.cards)) {
    loaded.turn.pendingEffect.cards = sanitizeDeckCards(loaded.turn.pendingEffect.cards);
  }
  if (loaded.turn.pendingEffect && 'allCards' in loaded.turn.pendingEffect && Array.isArray(loaded.turn.pendingEffect.allCards)) {
    loaded.turn.pendingEffect.allCards = sanitizeDeckCards(loaded.turn.pendingEffect.allCards);
  }
}

function countBoardDefinitionIds(board: BoardState): Record<string, number> {
  const counts = countFrontDefinitionIds(board);
  for (const slot of board.backSlots) {
    if (!slot) continue;
    counts[slot.definitionId] = (counts[slot.definitionId] ?? 0) + 1;
  }
  return counts;
}

function getAvailableAngelEntry(
  extraDeck: ExtraDeckEntry[],
  definitionId: string,
  preferredFinish?: CardFinish,
): ExtraDeckEntry | null {
  const matching = extraDeck.filter(entry => entry.definitionId === definitionId);
  if (matching.length === 0) return null;

  const orderedFinishes: CardFinish[] = [];
  if (preferredFinish) orderedFinishes.push(preferredFinish);
  for (const entry of matching) {
    if (!orderedFinishes.includes(entry.finish)) {
      orderedFinishes.push(entry.finish);
    }
  }

  // extraDeck is kept in sync: entries are spliced out when summoned and pushed
  // back when returned. So any remaining entry IS available to deploy.
  for (const finish of orderedFinishes) {
    if (extraDeck.some(e => e.definitionId === definitionId && e.finish === finish)) {
      return createExtraDeckEntry(definitionId, finish);
    }
  }

  return null;
}

function incrementAngelProgress(board: BoardState): void {
  for (const slot of board.frontSlots) {
    if (slot?.type === 'Angel' && !slot.activated) {
      slot.cardsPlayedSinceSummon += 1;
    }
    if (slot && (slot.type === 'Angel' || slot.type === 'Seraphim')) {
      const cooldowns = slot.attackCooldowns ?? {};
      for (const key of Object.keys(cooldowns)) {
        const current = cooldowns[key] ?? 0;
        if (current > 0) cooldowns[key] = current - 1;
      }
      slot.attackCooldowns = cooldowns;
    }
  }
}

function enforceAngelExtraDeckInvariant(deck: DeckState, options: { refillHand?: boolean } = {}): void {
  // Angels belong exclusively to extraDeck. If they leak into main-deck zones,
  // move them out immediately and optionally refill vacated hand slots.
  const isAngelCard = (card: DeckCard | null | undefined): boolean => {
    if (!card || typeof card.definitionId !== 'string' || card.definitionId.length === 0) return false;
    return CardRegistry.get(card.definitionId)?.type === 'Angel';
  };
  let movedFromHand = 0;

  const stripZone = (zone: DeckCard[]): DeckCard[] => {
    const kept: DeckCard[] = [];
    for (const rawCard of zone as Array<DeckCard | null | undefined>) {
      if (!rawCard || typeof rawCard.definitionId !== 'string' || rawCard.definitionId.length === 0) {
        // Legacy/corrupt saves may contain null stubs; drop them defensively.
        continue;
      }
      const card = rawCard;
      if (isAngelCard(card)) {
        deck.extraDeck.push(createExtraDeckEntry(card.definitionId, card.finish));
      } else {
        kept.push(card);
      }
    }
    return kept;
  };

  const originalHandCount = deck.hand.length;
  deck.hand = stripZone(deck.hand);
  movedFromHand = originalHandCount - deck.hand.length;
  deck.drawPile = stripZone(deck.drawPile);
  deck.discardPile = stripZone(deck.discardPile);

  if (!options.refillHand || movedFromHand <= 0) return;

  const refillCount = movedFromHand;
  if (deck.drawPile.length < refillCount && deck.discardPile.length > 0) {
    deck.drawPile = DeckSystem.reshuffleDiscard(deck.drawPile, deck.discardPile);
    deck.discardPile = [];
  }
  const { drawn, remaining } = DeckSystem.draw(deck.drawPile, refillCount);
  deck.drawPile = remaining;
  for (const card of drawn) deck.hand.push(card);
}

function canResolveActivatedEffects(
  effects: CardEffect[],
  turn: TurnState,
  board: BoardState,
): boolean {
  const resourceTurn: TurnState = { ...turn };

  const canResolveEffect = (effect: CardEffect): boolean => {
    switch (effect.type) {
      case 'conditional':
        if (!CardEffectExecutor.evaluateCondition(effect.condition, resourceTurn, board)) return true;
        for (const subEffect of effect.then) {
          if (!canResolveEffect(subEffect)) return false;
        }
        return true;
      default:
        return true;
    }
  };

  for (const effect of effects) {
    if (!canResolveEffect(effect)) return false;
  }

  return true;
}

function canActivateAngelAbility(
  angel: AngelInstance,
  definition: AngelDefinition,
  turn: TurnState,
  board: BoardState,
): boolean {
  if (angel.activated) return false;
  if (angel.cardsPlayedSinceSummon < definition.activatedAbility.cardsPlayedRequirement) return false;
  return canResolveActivatedEffects(definition.activatedAbility.effects, turn, board);
}

function rarityWeight(rarity: string): number {
  switch (rarity) {
    case 'Infinite': return 5;
    case 'Eternal': return 4;
    case 'Legendary': return 3;
    case 'Epic': return 2;
    case 'Rare': return 1;
    default: return 0;
  }
}

function cardStem(name: string): string {
  return (name.split(' ')[0] ?? 'Eclipse').replace(/[^a-zA-Z]/g, '') || 'Eclipse';
}

function buildDefaultSeraphimAttackSet(def: SeraphimDefinition): SeraphimAttackSet {
  const power = rarityWeight(def.rarity);
  const stem = cardStem(def.name);
  const unsynergizedBase = 70 + power * 28;
  const synergizedBase = Math.round(unsynergizedBase * 1.9);
  return {
    unsynergized: {
      id: `${def.definitionId}:unsynergized`,
      label: 'Unsynergized',
      name: `${stem} Riftcarve`,
      description: 'Reliable strike that can always fire when ready.',
      baseOblivion: unsynergizedBase,
      cooldownCards: 2 + Math.min(2, Math.floor(power / 2)),
      tags: ['seraphim', 'unsynergized', 'Neutrality'.toLowerCase()],
    },
    synergized: {
      id: `${def.definitionId}:synergized`,
      label: 'Synergized',
      name: `${stem} Covenant Cataclysm`,
      description: 'Devastating strike requiring any Angel on your board.',
      baseOblivion: synergizedBase,
      cooldownCards: 4 + Math.min(2, Math.floor(power / 2)),
      requiresAngelOnBoard: true,
      tags: ['seraphim', 'synergized', 'covenant', 'Neutrality'.toLowerCase()],
    },
  };
}

function buildDefaultAngelAttackSet(def: AngelDefinition): AngelAttackSet {
  const power = rarityWeight(def.rarity);
  const stem = cardStem(def.name);
  const primaryBase = 120 + power * 42;
  const exaltedBase = Math.round(primaryBase * 2.1);
  const dominantCost: AttackCost = { type: 'discard_from_hand', value: 1 + Math.min(2, Math.floor(power / 2)) };









  return {
    primary: {
      id: `${def.definitionId}:primary`,
      label: 'Primary',
      name: `${stem} Halo Severance`,
      description: 'Standard angelic attack with stable cadence.',
      baseOblivion: primaryBase,
      cooldownCards: 3 + Math.min(1, Math.floor(power / 3)),
      tags: ['angel', 'primary', 'Neutrality'.toLowerCase()],
    },
    exalted: {
      id: `${def.definitionId}:exalted`,
      label: 'Exalted',
      name: `${stem} Thronefall Decree`,
      description: 'Heavy-cost finisher with higher payout.',
      baseOblivion: exaltedBase,
      cooldownCards: 5 + Math.min(2, Math.floor(power / 2)),
      costs: [dominantCost],
      tags: ['angel', 'exalted', 'finisher', 'Neutrality'.toLowerCase()],
    },
  };
}

function getSeraphimAttackSet(def: SeraphimDefinition): SeraphimAttackSet {
  const attacks = def.attacks ?? buildDefaultSeraphimAttackSet(def);
  return attacks;
}

function getAngelAttackSet(def: AngelDefinition): AngelAttackSet {
  const attacks = def.attacks ?? buildDefaultAngelAttackSet(def);
  return attacks;
}

function hasAnyAngelOnBoard(board: BoardState): boolean {
  return board.frontSlots.some(slot => slot?.type === 'Angel');
}

interface AttackBuffSnapshot {
  baseOblivionBonus: number;
  cooldownDeltaCards: number;
  multiplier: number;
}

function collectAttackBuffs(
  board: BoardState,
  turn: TurnState,
  unitType: 'Seraphim' | 'Angel',
  targetDefinitionId: string,
  tags: string[],
): AttackBuffSnapshot {
  let baseOblivionBonus = 0;
  let cooldownDeltaCards = 0;
  let multiplier = 1;
  const loweredTags = new Set(tags.map(tag => tag.toLowerCase()));
  // Same-set gate: Cherubim attack buffs only apply to Seraphim/Angels of the
  // same set. Set-bound stacking mechanics (Patience, etc.) must not leak
  // across sets. Effect-level scope can still narrow further via
  // targetTags / targetDefinitionIds.
  const targetDef = ScoreSystem.getDefinition(targetDefinitionId);
  const targetSetKey = targetDef ? 'Neutrality' : null;

  for (const back of board.backSlots) {
    if (!back || back.type !== 'Cherubim') continue;
    const def = ScoreSystem.getDefinition(back.definitionId);
    if (!def || def.type !== 'Cherubim') continue;
    const sourceSetKey = 'Neutrality';
    if (targetSetKey && sourceSetKey !== targetSetKey) continue;
    for (const effect of def.effects) {
      if (effect.type !== 'cherubim_attack_buff') continue;
      if (effect.targetUnitType !== 'Any' && effect.targetUnitType !== unitType) continue;

      const idMatch = !effect.targetDefinitionIds || effect.targetDefinitionIds.length === 0
        ? true
        : effect.targetDefinitionIds.includes(targetDefinitionId);

      const tagMatch = !effect.targetTags || effect.targetTags.length === 0
        ? true
        : effect.targetTags.some(tag => loweredTags.has(tag.toLowerCase()));

      const conditionMatch = !effect.condition || CardEffectExecutor.evaluateCondition(effect.condition, turn, board);

      if (!idMatch || !tagMatch || !conditionMatch) continue;
      baseOblivionBonus += effect.bonusBaseOblivion ?? 0;
      cooldownDeltaCards += effect.cooldownDeltaCards ?? 0;
      multiplier *= effect.multiplier ?? 1;
    }
  }

  return {
    baseOblivionBonus,
    cooldownDeltaCards,
    multiplier: Math.max(0.1, multiplier),
  };
}

function canPayAttackCosts(
  s: Store,
  costs: AttackCost[],
  actor: { type: 'Seraphim' | 'Angel'; instanceId: string },
  selection?: AttackPaymentSelection,
): boolean {
  const requiredDiscardCount = costs
    .filter(cost => cost.type === 'discard_from_hand')
    .reduce((sum, cost) => sum + cost.value, 0);
  const requiredSeraphimSacrificeCount = costs
    .filter(cost => cost.type === 'sacrifice_seraphim')
    .reduce((sum, cost) => sum + cost.value, 0);
  const requiredAngelSacrificeCount = costs
    .filter(cost => cost.type === 'sacrifice_angel')
    .reduce((sum, cost) => sum + cost.value, 0);

  const selectedDiscardIds = selection?.discardInstanceIds ?? [];
  const selectedSeraphimSacrificeIds = selection?.sacrificeSeraphimInstanceIds ?? [];
  const selectedAngelSacrificeIds = selection?.sacrificeAngelInstanceIds ?? [];

  if (requiredDiscardCount > 0) {
    if (selectedDiscardIds.length !== requiredDiscardCount) return false;
    if (new Set(selectedDiscardIds).size !== selectedDiscardIds.length) return false;
    const handIds = new Set(
      s.deck.hand
        .filter(card => CardRegistry.get(card.definitionId)?.type !== 'Angel')
        .map(card => card.instanceId),
    );
    if (!selectedDiscardIds.every(id => handIds.has(id))) return false;
  }

  if (requiredSeraphimSacrificeCount > 0) {
    if (selectedSeraphimSacrificeIds.length !== requiredSeraphimSacrificeCount) return false;
    if (new Set(selectedSeraphimSacrificeIds).size !== selectedSeraphimSacrificeIds.length) return false;
    const candidateIds = new Set(
      s.board.frontSlots
        .filter(slot => slot?.type === 'Seraphim' && slot.instanceId !== actor.instanceId)
        .map(slot => slot!.instanceId),
    );
    if (!selectedSeraphimSacrificeIds.every(id => candidateIds.has(id))) return false;
  }

  if (requiredAngelSacrificeCount > 0) {
    if (selectedAngelSacrificeIds.length !== requiredAngelSacrificeCount) return false;
    if (new Set(selectedAngelSacrificeIds).size !== selectedAngelSacrificeIds.length) return false;
    const candidateIds = new Set(
      s.board.frontSlots
        .filter(slot => slot?.type === 'Angel' && slot.instanceId !== actor.instanceId)
        .map(slot => slot!.instanceId),
    );
    if (!selectedAngelSacrificeIds.every(id => candidateIds.has(id))) return false;
  }

  for (const cost of costs) {
    switch (cost.type) {
      case 'discard_from_hand':
        if (s.deck.hand.filter(card => CardRegistry.get(card.definitionId)?.type !== 'Angel').length < cost.value) return false;
        break;
      case 'sacrifice_seraphim': {
        const available = s.board.frontSlots.filter(slot => slot?.type === 'Seraphim' && slot.instanceId !== actor.instanceId).length;
        if (available < cost.value) return false;
        break;
      }
      case 'sacrifice_angel': {
        const available = s.board.frontSlots.filter(slot => slot?.type === 'Angel' && slot.instanceId !== actor.instanceId).length;
        if (available < cost.value) return false;
        break;
      }
    }
  }
  return true;
}

function payAttackCosts(
  s: Store,
  costs: AttackCost[],
  selection?: AttackPaymentSelection,
): void {
  const discardIdQueue = [...(selection?.discardInstanceIds ?? [])];
  const sacrificeSeraphimIdQueue = [...(selection?.sacrificeSeraphimInstanceIds ?? [])];
  const sacrificeAngelIdQueue = [...(selection?.sacrificeAngelInstanceIds ?? [])];

  for (const cost of costs) {
    switch (cost.type) {
      case 'discard_from_hand': {
        const idsForCost = discardIdQueue.splice(0, cost.value);
        const discardableIds = new Set(
          s.deck.hand
            .filter(card => CardRegistry.get(card.definitionId)?.type !== 'Angel')
            .map(card => card.instanceId),
        );
        const validIdsForCost = idsForCost.filter(id => discardableIds.has(id));
        const discarded = s.deck.hand.filter(card => validIdsForCost.includes(card.instanceId));
        s.deck.hand = s.deck.hand.filter(card => !validIdsForCost.includes(card.instanceId));
        if (discarded.length > 0) {
          recordLossEvent(s, discarded, 'discard');
          s.deck.discardPile.push(...discarded);
        }
        break;
      }
      case 'sacrifice_seraphim': {
        const idsForCost = new Set(sacrificeSeraphimIdQueue.splice(0, cost.value));
        const sacrificed: Array<{ definitionId: string }> = [];
        for (let i = 0; i < s.board.frontSlots.length; i++) {
          const slot = s.board.frontSlots[i];
          if (slot?.type === 'Seraphim' && idsForCost.has(slot.instanceId)) {
            sacrificed.push({ definitionId: slot.definitionId });
            s.deck.discardPile.push(toDeckCard(slot));
            s.board.frontSlots[i] = null;
          }
        }
        recordLossEvent(s, sacrificed, 'sacrifice');
        s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);
        break;
      }
      case 'sacrifice_angel': {
        const idsForCost = new Set(sacrificeAngelIdQueue.splice(0, cost.value));
        const sacrificed: Array<{ definitionId: string }> = [];
        for (let i = 0; i < s.board.frontSlots.length; i++) {
          const slot = s.board.frontSlots[i];
          if (slot?.type === 'Angel' && idsForCost.has(slot.instanceId)) {
            sacrificed.push({ definitionId: slot.definitionId });
            s.board.frontSlots[i] = null;
          }
        }
        recordLossEvent(s, sacrificed, 'sacrifice');
        s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);
        break;
      }
    }
  }
}

function getHighTierAttackDamageMultiplier(
  rarity: SeraphimDefinition['rarity'] | AngelDefinition['rarity'],
): number {
  void rarity;
  return 1;
}

function reduceFrontlineAttackCooldowns(board: BoardState, amount: number): void {
  if (amount <= 0) return;
  for (const slot of board.frontSlots) {
    if (!slot || (slot.type !== 'Seraphim' && slot.type !== 'Angel')) continue;
    const nextCooldowns: Record<string, number> = {};
    for (const [id, value] of Object.entries(slot.attackCooldowns ?? {})) {
      nextCooldowns[id] = Math.max(0, value - amount);
    }
    slot.attackCooldowns = nextCooldowns;
  }
}

void reduceFrontlineAttackCooldowns;

function enforceMinimumAttackCooldown(
  board: BoardState,
  slot: 0 | 1 | 2 | 3 | 4,
  attackId: string,
): void {
  const unit = board.frontSlots[slot];
  if (!unit || (unit.type !== 'Seraphim' && unit.type !== 'Angel')) return;
  const current = unit.attackCooldowns?.[attackId] ?? 0;
  unit.attackCooldowns = {
    ...(unit.attackCooldowns ?? {}),
    [attackId]: Math.max(1, current),
  };
}

function applyLateGameAttackIdentity(
  s: Store,
  definitionId: string,
  rarity: SeraphimDefinition['rarity'] | AngelDefinition['rarity'],
  attackLabel: string,
  baseAttackAward: number,
): void {
  void s;
  void definitionId;
  void rarity;
  void attackLabel;
  void baseAttackAward;
}

// �E��E��E��E� Cherubim helpers �E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E�

function computeCherubimPassiveOblivionBonus(board: BoardState, isOphanimPlay: boolean): number {
  let bonus = 0;

  for (let i = 0; i < 4; i++) {
    const card = board.backSlots[i];
    if (!card || card.type !== 'Cherubim') continue;
    const def = ScoreSystem.getDefinition(card.definitionId);
    if (!def || def.type !== 'Cherubim') continue;

    for (const effect of def.effects) {
      if (effect.type === 'cherubim_oblivion_per_card') {
        bonus += effect.value;
      }
      if (isOphanimPlay && effect.type === 'cherubim_ophanim_bonus') {
        bonus += effect.value;
      }
    }
  }

  bonus += computeCherubimAdjacentBonus(board, 'oblivion');
  return bonus;
}

// �E��E��E��E� Cherubim helpers �E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E�

function computeCherubimAdjacentBonus(board: BoardState, bonusType: 'oblivion' | 'draw'): number {
  let bonus = 0;
  for (let i = 0; i < 4; i++) {
    const card = board.backSlots[i];
    if (!card || card.type !== 'Cherubim') continue;
    const def = ScoreSystem.getDefinition(card.definitionId);
    if (!def || def.type !== 'Cherubim') continue;
    // Same-set: only adjacent active Seraphim of the Cherubim's set count.
    const sourceSetKey = 'Neutrality';
    const leftSlot = board.frontSlots[i];
    const rightSlot = board.frontSlots[i + 1];
    const adjacentActive = [leftSlot, rightSlot].filter(s => {
      if (!s || s.type !== 'Seraphim' || !(s as SeraphimInstance).isActive) return false;
      const sDef = ScoreSystem.getDefinition(s.definitionId);
      return !!sDef && 'Neutrality' === sourceSetKey;
    }).length;
    if (adjacentActive === 0) continue;
    for (const effect of (def as import('@/types/cards').CherubimDefinition).effects) {
      if (effect.type === 'cherubim_adjacent_seraphim_bonus' && effect.bonusType === bonusType) {
        bonus += effect.value * adjacentActive;
      }
    }
  }
  return bonus;
}

function applyCherubimExpireBonuses(s: Store, expiredCount = 1): void {
  if (expiredCount <= 0) return;

  let totalBonus = 0;
  for (const slot of s.board.frontSlots) {
    if (!slot || slot.type !== 'Seraphim' || !slot.isActive) continue;
    const def = ScoreSystem.getDefinition(slot.definitionId);
    if (!def || def.type !== 'Seraphim') continue;
    if (def.baseStats.bonusType === 'cherubim_expire_bonus') {
      totalBonus += Math.max(0, Math.round(def.baseStats.bonusValue * expiredCount));
    }
  }

  if (totalBonus > 0) {
    grantOblivion(s, totalBonus);
  }
}

function awardOblivionForCardPlay(
  s: Store,
  cardOblivionBonus: number,
  isOphanim: boolean,
  _unused?: undefined,
  sourceDef?: CardDefinition,
  actionClass?: AttenuationClass,
): void {
  let totalAward = 0;

  if (sourceDef && cardOblivionBonus > 0) {
    // +15% burst boost on all card-play oblivion (attacks are unaffected).
    totalAward += Math.round(cardOblivionBonus * 1.15);
  }

  // Seraphim ophanim_bonus remains active in attack-centric pacing.
  if (isOphanim && s.computedStats.ophanimOblivionBonus > 0) {
    totalAward += s.computedStats.ophanimOblivionBonus;
  }

  const cherubimOblivionBonus = computeCherubimPassiveOblivionBonus(s.board, isOphanim);
  if (cherubimOblivionBonus > 0) {
    totalAward += cherubimOblivionBonus;
  }

  // Active Seraphim per-card Oblivion bonus (oblivion_per_card bonusType): every card play earns this.
  if (s.computedStats.oblivionPerCardBonus > 0) {
    totalAward += Math.round(s.computedStats.oblivionPerCardBonus);
  }

  // Seraphim bonus amplifier: +N Oblivion per active Seraphim this play (from seraphim_bonus_amplifier effects).
  const seraphimAmp = s.turn.seraphimBonusAmp ?? 0;
  if (seraphimAmp > 0 && s.computedStats.activeSynergies > 0) {
    totalAward += Math.round(seraphimAmp * s.computedStats.activeSynergies);
  }

  if (sourceDef !== undefined && totalAward > 0) {
    const resolvedClass = actionClass ?? classifyActionClass(sourceDef, getDefinitionOnPlayEffects(sourceDef));
    const attenuationMultiplier = applyAttenuationMultiplier(s, resolvedClass);
    const crossSetMultiplier = 1;
    const fullFireMultiplier = getNeutralityFullFireMultiplier(s, sourceDef);
    const stabilityFlat = Math.max(0, Math.round((s.turn.equilibriumStability ?? 0) * 3));
    totalAward = Math.round(totalAward * attenuationMultiplier * crossSetMultiplier * fullFireMultiplier) + stabilityFlat;
  }






  // Apply conditional Cherubim board-presence multiplier (capped to prevent runaway scaling).
  const cherubimCondMult = Math.min(1.6, s.turn.cherubimConditionalMult ?? 1);
  if (cherubimCondMult > 1 && totalAward > 0) {
    totalAward = Math.round(totalAward * cherubimCondMult);
  }

  // Gentle high-tier gain tuning for card-play payouts.
  if (sourceDef && totalAward > 0) {
    if (sourceDef.rarity === 'Eternal') {
      totalAward = Math.round(totalAward * 0.92);
    } else if (sourceDef.rarity === 'Infinite') {
      totalAward = Math.round(totalAward * 0.86);
    }
  }

  if (totalAward > 0) {
    grantOblivion(s, totalAward);
  }

}

function tickCherubimDurability(s: Store): void {
  let expiredCount = 0;
  const expiredCards: Array<{ definitionId: string }> = [];
  for (let i = 0; i < 4; i++) {
    const card = s.board.backSlots[i];
    if (!card || card.type !== 'Cherubim') continue; // only process Cherubim cards; Cherubim have different mechanics
    const cherubim = card as CherubimInstance;
    if (cherubim.durability === undefined || cherubim.maxDurability === undefined) continue;
    cherubim.durability -= 1;
    if (cherubim.durability <= 0) {
      expiredCards.push({ definitionId: cherubim.definitionId });
      s.deck.discardPile.push(toDeckCard(cherubim));
      s.board.backSlots[i] = null;
      expiredCount += 1;
      eventBus.emit('cherubim:expired', { backSlot: i as 0 | 1 | 2 | 3, definitionId: cherubim.definitionId });
    }
  }

  recordLossEvent(s, expiredCards, 'expire');
  applyCherubimExpireBonuses(s, expiredCount);
}

function getNeutralityEquilibriumPatienceGainBonus(turn: TurnState, board?: BoardState): number {
  const sentinelPresent = board?.backSlots.some(sl => sl?.type === 'Cherubim' && sl.definitionId === 'tx-cher-null-sentinel') ?? false;
  if (!sentinelPresent) return 0;
  const base = Math.floor(Math.max(0, turn.neutralityEquilibriumSigils ?? 0) / 2);
  return base > 0 ? base * 2 : 0;
}

function spendNeutralityEquilibriumSigils(s: Store, requested: number): number {
  const spend = Math.max(0, Math.floor(requested));
  if (spend <= 0) return 0;
  const before = Math.max(0, s.turn.neutralityEquilibriumSigils ?? 0);
  const spent = Math.min(before, spend);
  s.turn.neutralityEquilibriumSigils = before - spent;
  return spent;
}

function applyPatienceGainAll(s: Store, sourceDefinitionId: string, value: number): void {
  const sourceDef = ScoreSystem.getDefinition(sourceDefinitionId);
  const sourceSetKey = sourceDef ? 'Neutrality' : null;
  const linkedBonus = Math.max(0, s.turn.neutralityLinkedGainBonus ?? 0);
  const equilibriumBonus = getNeutralityEquilibriumPatienceGainBonus(s.turn, s.board);

  // Same-set: Patience only flows to active frontline units sharing the source
  // card's set so set-bound stacks never leak across sets.
  for (const unit of s.board.frontSlots) {
    if (!unit || (unit.type !== 'Seraphim' && unit.type !== 'Angel')) continue;
    if (sourceSetKey) {
      const unitDef = ScoreSystem.getDefinition(unit.definitionId);
      if (!unitDef || 'Neutrality' !== sourceSetKey) continue;
    }
    const gain = value + linkedBonus + equilibriumBonus;
    unit.patienceStacks = (unit.patienceStacks ?? 0) + gain;
  }

  clampNeutralityGainState(s);
}

function applyCherubimDrawPerCard(s: Store, drawValue: number): void {
  if (drawValue <= 0) return;
  const totalDraw = s.turn.cherubimDrawFraction + drawValue;
  const wholeDraw = Math.floor(totalDraw);
  s.turn.cherubimDrawFraction = totalDraw - wholeDraw;
  if (wholeDraw > 0) {
    s.deck = TurnSystem.drawCards(s.deck, wholeDraw);
  }
}

// Apply per-card Cherubim passive effects. Called after each card is played.
// Handles: resource generation, conditional buffs, patience accumulation.
function applyCherubimPassiveEffects(s: Store): void {
  // Reset conditional multiplier  Eit's recomputed fresh from board state each card play.
  s.turn.cherubimConditionalMult = 1;
  const linkedBonus = Math.max(0, s.turn.neutralityLinkedGainBonus ?? 0);
  const equilibriumBonus = getNeutralityEquilibriumPatienceGainBonus(s.turn, s.board);
  const patientLightStacks = Math.max(0, s.turn.neutralityPatientLightStacks ?? 0);
  const patientLightGain = getEffectivePatientLightPerCardPatienceGain(patientLightStacks);

  // Auto-accumulate +1 Patience for every Seraphim on board that has patienceThreshold set.
  for (const unit of s.board.frontSlots) {
    if (!unit || unit.type !== 'Seraphim') continue;
    const unitDef = ScoreSystem.getDefinition(unit.definitionId);
    if (unitDef?.type === 'Seraphim' && (unitDef as import('@/types/cards').SeraphimDefinition).patienceThreshold !== undefined) {
      const patienceGainBonus = Math.floor(getArtifactEffect(s.turn, 'patience_gain_bonus', s.progress.ownedArtifacts));
      const gain = patientLightGain + linkedBonus + equilibriumBonus + patienceGainBonus;
      unit.patienceStacks = (unit.patienceStacks ?? 0) + gain;
    }
  }

  if (patientLightStacks > 0) {
    for (const unit of s.board.frontSlots) {
      if (!unit || unit.type !== 'Angel') continue;
      const gain = patientLightGain + linkedBonus + equilibriumBonus;
      unit.patienceStacks = (unit.patienceStacks ?? 0) + gain;
    }
  }

  // Adjacent draw bonuses are represented as a Cherubim passive but resolved once per card play.
  const adjacentDrawBonus = computeCherubimAdjacentBonus(s.board, 'draw');
  if (adjacentDrawBonus > 0) {
    applyCherubimDrawPerCard(s, adjacentDrawBonus);
  }

  for (let i = 0; i < 4; i++) {
    const card = s.board.backSlots[i];
    if (!card || card.type !== 'Cherubim') continue;
    const cherubim = card as import('@/types/cards').CherubimInstance;
    const def = ScoreSystem.getDefinition(cherubim.definitionId) as import('@/types/cards').CherubimDefinition | null;
    if (!def || def.type !== 'Cherubim' || !def.effects) continue;

    for (const effect of def.effects) {
      switch (effect.type) {
        case 'cherubim_draw_per_card': {
          applyCherubimDrawPerCard(s, effect.value);
          break;
        }

        case 'cherubim_patience_per_card': {
          // Same-set: only adjacent Seraphim/Angels sharing the Cherubim's set
          // receive Patience. Off-set frontline neighbors are ignored.
          const sourceSetKey = 'Neutrality';
          const leftFront = s.board.frontSlots[i];
          const rightFront = s.board.frontSlots[i + 1];
          for (const frontUnit of [leftFront, rightFront]) {
            if (!frontUnit || (frontUnit.type !== 'Seraphim' && frontUnit.type !== 'Angel')) continue;
            const frontDef = ScoreSystem.getDefinition(frontUnit.definitionId);
            if (!frontDef || 'Neutrality' !== sourceSetKey) continue;
            const gain = effect.value + linkedBonus + equilibriumBonus;
            frontUnit.patienceStacks = (frontUnit.patienceStacks ?? 0) + gain;
          }
          break;
        }

        case 'cherubim_conditional_buff': {
          // Check if condition is met, apply multiplier bonus
          let conditionMet = false;
          if (effect.condition) {
            // Use same logic as CardEffectExecutor.evaluateCondition
            if (effect.condition.type === 'cards_played_gte') {
              conditionMet = s.turn.cardsPlayedThisTurn >= effect.condition.value;
            } else if (effect.condition.type === 'cherubim_active_gte') {
              conditionMet = s.board.backSlots.filter(sl => sl !== null && sl.type === 'Cherubim').length >= effect.condition.value;
            } else if (effect.condition.type === 'equilibrium_sigils_gte') {
              conditionMet = (s.turn.neutralityEquilibriumSigils ?? 0) >= effect.condition.value;
            }
          }
          if (conditionMet && effect.value > 1) {
            // Record the highest conditional multiplier active this card play.
            // Applied in awardOblivionForCardPlay  ENOT a direct Oblivion grant to avoid
            // exponential feedback with s.progress.oblivion.
            s.turn.cherubimConditionalMult = Math.max(
              s.turn.cherubimConditionalMult ?? 1,
              effect.value,
            );
          }
          break;
        }
      }
    }
  }

  clampNeutralityGainState(s);

  // WUAS per-card passive handling is in applyCherubimPassiveEffects.

  // WUAS bespoke Cherubim passives (set-identity triggers keyed by card ID).
  // cardsPlayedThisTurn is incremented after this function, so use +1 for the resolving play index.
  const resolvingPlayCount = (s.turn.cardsPlayedThisTurn ?? 0) + 1;
  const allBoardUnits = [...s.board.frontSlots, ...s.board.backSlots];
  const hasVoidbaneDoctrine = allBoardUnits.some(unit => unit?.definitionId === 'wuas-cher-voidbane-doctrine');

  for (const unit of allBoardUnits) {
    if (!unit || unit.type !== 'Cherubim') continue;

    if (unit.definitionId === 'wuas-cher-dreamvault-keeper' && resolvingPlayCount % 3 === 0) {
      applyCherubimDrawPerCard(s, 1);
    }

    if (unit.definitionId === 'wuas-cher-wishwright-pulse' && resolvingPlayCount % 2 === 0) {
      grantOblivion(s, 39);
    }
  }

  if (hasVoidbaneDoctrine && resolvingPlayCount === 5) {
    // Dead: starlight/dream resources removed (WishedUponAStar set)
  }
}

function resolveNeutralityMarkedCardTrigger(s: Store, playedInstanceId: string, sourceDefinitionId: string): void {
  const marked = s.turn.neutralityMarkedCardIds ?? [];
  if (!marked.includes(playedInstanceId)) return;

  const gain = Math.max(0, s.turn.neutralityMarkedPatienceGain ?? 0);
  if (gain > 0) {
    applyPatienceGainAll(s, sourceDefinitionId, gain);
  }
  s.turn.neutralityMarkedCardIds = marked.filter(id => id !== playedInstanceId);
}

/** Advance the trial guide step when a guided trial card matches the current step. */
function advanceTrialGuideStep(s: Store, definitionId: string): void {
  if (s.trialDeck.mode !== 'active' || s.trialDeck.trialMode !== 'guided') return;
  const step = s.trialDeck.guideStep;
  if (step >= s.trialDeck.guideSteps.length) return;
  if (s.trialDeck.guideSteps[step].cardDefinitionId === definitionId) {
    s.trialDeck.guideStep = step + 1;
    // Notify the HUD that the step has advanced
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trial-guide-step-changed', {
        detail: { step: s.trialDeck.guideStep, total: s.trialDeck.guideSteps.length },
      }));
    }
  }
}

export const useStore = create<Store>()(
  immer((set, get) => ({
    ...defaultGameState,
    computedStats: ScoreSystem.compute(defaultBoard),

    refreshComputedStats: () => { set(s => { recompute(s); }); },

    // �E��E��E��E� Seraphim �E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E�

    placeSeraphim: (deckCard, slot) => {
      set(s => {
        const prevInSlot = s.board.frontSlots[slot];
        if (prevInSlot) {
          recordLossEvent(s, [{ definitionId: prevInSlot.definitionId }], 'board');
          s.deck.discardPile.push(toDeckCard(prevInSlot));
        }
        const def = ScoreSystem.getDefinition(deckCard.definitionId);
        const seraphimInst: SeraphimInstance = {
          instanceId: deckCard.instanceId,
          definitionId: deckCard.definitionId,
          type: 'Seraphim',
          rarity: def?.type === 'Seraphim' ? def.rarity : 'Common',
          finish: deckCard.finish,
          level: 1,
          isActive: false,
          attackCooldowns: {},
          boardSlot: slot,
          ...(deckCard.faceState ? { faceState: deckCard.faceState } : {}),
        };
        s.board.frontSlots[slot] = seraphimInst;
        s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);
        recompute(s);

        awardOblivionForCardPlay(s, 0, false);
        applyCherubimPassiveEffects(s);
        tickCherubimDurability(s);

        if (def?.type === 'Seraphim') {
          const turnBefore = captureTurnSnapshot(s.turn);
          const actionClass = classifyActionClass(def, getDefinitionOnPlayEffects(def));
          const result = CardEffectExecutor.execute(deckCard, s.turn, s.board, s.deck, true);
          if (result.canPlay) {
            s.turn = result.turn;
            s.board = result.board;
            s.deck = result.deck;
            applyNeutralityTimerPauseFromTurn(s);
            if (result.pendingEffect) s.turn.pendingEffect = result.pendingEffect;
            applyAllSetPlayStates(s, def, turnBefore, actionClass);
            awardOblivionForCardPlay(s, result.oblivionBonus, false, undefined, def, actionClass);
          }
        }

        s.deck.hand = s.deck.hand.filter(c => c.instanceId !== deckCard.instanceId);
        resolveNeutralityMarkedCardTrigger(s, deckCard.instanceId, deckCard.definitionId);
        incrementAngelProgress(s.board);
        s.turn.seraphimPlayedThisTurn = (s.turn.seraphimPlayedThisTurn ?? 0) + 1;
        const newInst = s.board.frontSlots[slot];
        if (newInst?.type === 'Seraphim' && newInst.isActive) {
          eventBus.emit('seraphim:synergy-gained', { slot, instanceId: deckCard.instanceId });
        }
        recordCardPlay(s, deckCard.definitionId);
        syncEnigmaProgressFromBoard(s, false);
        checkBossDefeated(s);
        recompute(s);
      });
    },

    removeSeraphim: (slot) => {
      set(s => {
        const occupant = s.board.frontSlots[slot];
        if (occupant?.type === 'Seraphim' && occupant.isActive) {
          eventBus.emit('seraphim:synergy-lost', { slot, instanceId: occupant.instanceId });
        }
        if (occupant) {
          recordLossEvent(s, [{ definitionId: occupant.definitionId }], 'board');
          s.deck.discardPile.push(toDeckCard(occupant));
        }
        s.board.frontSlots[slot] = null;
        s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);
        recompute(s);
      });
    },

    discardCardToRemoveSeraphim: (slot) => {
      set(s => {
        if (s.turn.phase !== 'playing' || s.turn.pendingEffect !== null) return;
        const occupant = s.board.frontSlots[slot];
        if (!occupant || occupant.type !== 'Seraphim') return;
        if (s.deck.hand.length <= 0) return;
        s.turn.pendingEffect = {
          type: 'discard_choice',
          count: 1,
          sourceCard: `remove_seraphim:${slot}`,
        };
      });
    },

    placeSeraphimFromHand: (targetSlot, instanceId) => {
      set(s => {
        if (s.turn.phase !== 'playing') return;
        if (s.board.frontSlots[targetSlot] !== null) return;
        const deckCard = instanceId
          ? s.deck.hand.find(c => c.instanceId === instanceId && ScoreSystem.getDefinition(c.definitionId)?.type === 'Seraphim')
          : s.deck.hand.find(c => ScoreSystem.getDefinition(c.definitionId)?.type === 'Seraphim');
        if (!deckCard) return;
        const def = ScoreSystem.getDefinition(deckCard.definitionId);
        if (!def || def.type !== 'Seraphim') return;

        const seraphimInst: SeraphimInstance = {
          instanceId: deckCard.instanceId,
          definitionId: deckCard.definitionId,
          type: 'Seraphim',
          rarity: def.rarity,
          finish: deckCard.finish,
          level: 1,
          isActive: false,
          attackCooldowns: {},
          boardSlot: targetSlot,
          ...(deckCard.faceState ? { faceState: deckCard.faceState } : {}),
        };
        s.board.frontSlots[targetSlot] = seraphimInst;
        s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);
        recompute(s);

        awardOblivionForCardPlay(s, 0, false);
        applyCherubimPassiveEffects(s);
        tickCherubimDurability(s);

        const result = CardEffectExecutor.execute(deckCard, s.turn, s.board, s.deck, true);
        const turnBefore = captureTurnSnapshot(s.turn);
        const actionClass = classifyActionClass(def, getDefinitionOnPlayEffects(def));
        if (result.canPlay) {
          s.turn = result.turn;
          s.board = result.board;
          s.deck = result.deck;
          applyNeutralityTimerPauseFromTurn(s);
          if (result.pendingEffect) s.turn.pendingEffect = result.pendingEffect;
          applyAllSetPlayStates(s, def, turnBefore, actionClass);
          awardOblivionForCardPlay(s, result.oblivionBonus, false, undefined, def, actionClass);
        }
        s.deck.hand = s.deck.hand.filter(c => c.instanceId !== deckCard.instanceId);
        resolveNeutralityMarkedCardTrigger(s, deckCard.instanceId, deckCard.definitionId);
        incrementAngelProgress(s.board);
        recordCardPlay(s, deckCard.definitionId);
        syncEnigmaProgressFromBoard(s, false);
        checkBossDefeated(s);
        recompute(s);
      });
    },

    // �E��E��E��E� Cherubim �E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E�

    placeCherubim: (backSlotIndex, instanceId) => {
      set(s => {
        if (s.turn.phase !== 'playing') return;
        const deckCard = instanceId
          ? s.deck.hand.find(c => c.instanceId === instanceId && ScoreSystem.getDefinition(c.definitionId)?.type === 'Cherubim')
          : s.deck.hand.find(c => ScoreSystem.getDefinition(c.definitionId)?.type === 'Cherubim');
        if (!deckCard) return;
        const def = ScoreSystem.getDefinition(deckCard.definitionId);
        if (!def || def.type !== 'Cherubim') return;
        const cherubimDef = def as import('@/types/cards').CherubimDefinition;

        const existing = s.board.backSlots[backSlotIndex];
        if (existing) {
          recordLossEvent(s, [{ definitionId: existing.definitionId }], 'board');
          s.deck.discardPile.push(toDeckCard(existing));
        }
        const cherubimInst: import('@/types/cards').CherubimInstance = {
          instanceId: deckCard.instanceId,
          definitionId: deckCard.definitionId,
          type: 'Cherubim',
          rarity: cherubimDef.rarity,
          finish: deckCard.finish,
          ...(deckCard.faceState ? { faceState: deckCard.faceState } : {}),
          level: 1,
          ...(cherubimDef.maxDurability !== undefined
            ? {
                durability: cherubimDef.maxDurability + s.computedStats.cherubimExtraPlays,
                maxDurability: cherubimDef.maxDurability,
              }
            : {}),
          backSlot: backSlotIndex,
        };
        s.board.backSlots[backSlotIndex] = cherubimInst;
        s.turn.cherubimSummonedThisTurn = (s.turn.cherubimSummonedThisTurn ?? 0) + 1;
        s.deck.hand = s.deck.hand.filter(c => c.instanceId !== deckCard.instanceId);
            recompute(s);

        const result = CardEffectExecutor.execute(
          deckCard,
          s.turn,
          s.board,
          s.deck,
          false,
          {
            effects: cherubimDef.onPlayEffects,
            countAsPlay: false,
            removeFromHand: false,
          },
        );
        if (!result.canPlay) return;
        const turnBefore = captureTurnSnapshot(s.turn);
        const actionClass = classifyActionClass(def, getDefinitionOnPlayEffects(def));
        s.turn = result.turn;
        s.board = result.board;
        s.deck = result.deck;
        applyNeutralityTimerPauseFromTurn(s);
        if (result.pendingEffect) s.turn.pendingEffect = result.pendingEffect;
        applyAllSetPlayStates(s, def, turnBefore, actionClass);

        s.turn.cardsPlayedThisTurn += 1;

        awardOblivionForCardPlay(s, result.oblivionBonus, false, undefined, def, actionClass);
        applyCherubimPassiveEffects(s);
        tickCherubimDurability(s);
        incrementAngelProgress(s.board);
        recordCardPlay(s, deckCard.definitionId);
        checkBossDefeated(s);
        recompute(s);
      });
    },

    removeCherubim: (backSlotIndex) => {
      set(s => {
        const cherubim = s.board.backSlots[backSlotIndex];
        if (cherubim && cherubim.type === 'Cherubim') {
          recordLossEvent(s, [{ definitionId: cherubim.definitionId }], 'board');
          s.deck.discardPile.push(toDeckCard(cherubim));
          s.board.backSlots[backSlotIndex] = null;
        }
        recompute(s);
      });
    },

    // �E��E��E��E� Angels �E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E�

    summonAngel: (definitionId, finish) => {
      set(s => {
        if (s.turn.phase !== 'playing') return;
        if (s.turn.pendingEffect !== null) return;
        const summonedEntry = getAvailableAngelEntry(s.deck.extraDeck, definitionId, finish);
        if (!summonedEntry) return;
        const def = ScoreSystem.getDefinition(definitionId);
        if (!def || def.type !== 'Angel') return;
        const angelDef = def as AngelDefinition;

        const costCount: Record<string, number> = {};
        for (const id of angelDef.summonCost) costCount[id] = (costCount[id] ?? 0) + 1;
        const boardCount = countFrontDefinitionIds(s.board);
        const boardDefinitionCount = countBoardDefinitionIds(s.board);
        for (const [id, needed] of Object.entries(costCount)) {
          if ((boardCount[id] ?? 0) < needed) return;
        }

        if (angelDef.extraSummonConditions) {
          for (const cond of angelDef.extraSummonConditions) {
            if (cond.type === 'cherubim_active_gte' && s.board.backSlots.filter(sl => sl !== null).length < cond.value) return;
            if (cond.type === 'seraphim_active_gte' && s.board.frontSlots.filter(sl => sl?.type === 'Seraphim' && sl.isActive).length < cond.value) return;
            if (cond.type === 'seraphim_on_board_gte' && s.board.frontSlots.filter(sl => sl?.type === 'Seraphim').length < cond.value) return;
            if (cond.type === 'board_definition_gte' && (boardDefinitionCount[cond.definitionId] ?? 0) < cond.value) return;
            if (cond.type === 'equilibrium_sigils_gte' && (s.turn.neutralityEquilibriumSigils ?? 0) < cond.value) return;
          }
        }

        const toSacrifice: { slotIdx: number; instanceId: string; definitionId: string }[] = [];
        const usedSlots = new Set<number>();
        for (const reqId of angelDef.summonCost) {
          const slotIdx = s.board.frontSlots.findIndex(
            (sl, idx) => sl?.definitionId === reqId && !usedSlots.has(idx)
          );
          if (slotIdx === -1) return;
          usedSlots.add(slotIdx);
          const sl = s.board.frontSlots[slotIdx]!;
          toSacrifice.push({ slotIdx, instanceId: sl.instanceId, definitionId: sl.definitionId });
        }

        for (const { slotIdx } of toSacrifice) {
          const material = s.board.frontSlots[slotIdx];
          if (material?.type === 'Seraphim') {
            s.deck.discardPile.push(toDeckCard(material));
          } else if (material?.type === 'Angel') {
            // Angel ritual materials return to the extra deck rather than being lost.
            s.deck.extraDeck.push({ definitionId: material.definitionId, finish: material.finish });
          }
          (s.board.frontSlots as Array<(typeof s.board.frontSlots)[number]>)[slotIdx] = null;
        }
        recordLossEvent(s, toSacrifice.map(material => ({ definitionId: material.definitionId })), 'sacrifice');
        s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);
        if (!s.board.frontSlots.some(slot => slot === null)) return;

        // Consume this copy only after all requirements pass.
        const deckIdx = s.deck.extraDeck.findIndex(
          e => e.definitionId === definitionId && e.finish === summonedEntry.finish,
        );
        if (deckIdx === -1) return;
        s.deck.extraDeck.splice(deckIdx, 1);

        s.turn.pendingEffect = {
          type: 'summon_angel_place',
          definitionId,
          finish: summonedEntry.finish,
        };
        pushRewardToast(s, 'Choose a front slot for the summoned Angel.');
        recompute(s);
      });
    },

    returnAngelToExtraDeck: (slot) => {
      set(s => {
        const angel = s.board.frontSlots[slot];
        if (!angel || angel.type !== 'Angel') return;
        // Clear the slot and push the entry back so it reappears in the compartment.
        (s.board.frontSlots as Array<(typeof s.board.frontSlots)[number]>)[slot] = null;
        s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);
        s.deck.extraDeck.push({ definitionId: angel.definitionId, finish: angel.finish });
        recompute(s);
      });
    },

    activateAngel: (slot) => {
      set(s => {
        if (s.turn.phase !== 'playing' || s.turn.pendingEffect !== null) return;
        const angel = s.board.frontSlots[slot];
        if (!angel || angel.type !== 'Angel') return;
        const def = ScoreSystem.getDefinition(angel.definitionId);
        if (!def || def.type !== 'Angel') return;
        const angelDef = def as AngelDefinition;
        if (!canActivateAngelAbility(angel, angelDef, s.turn, s.board)) return;

        const result = CardEffectExecutor.execute(
          { instanceId: angel.instanceId, definitionId: angel.definitionId, finish: angel.finish },
          s.turn,
          s.board,
          s.deck,
          false,
          {
            effects: angelDef.activatedAbility.effects,
            countAsPlay: false,
            removeFromHand: false,
          }
        );
        if (!result.canPlay) return;

        const turnBefore = captureTurnSnapshot(s.turn);
        const actionClass = classifyActionClass(angelDef, angelDef.activatedAbility.effects);

        s.turn = result.turn;
        s.board = result.board;
        s.deck = result.deck;
        applyNeutralityTimerPauseFromTurn(s);
        applyAllSetPlayStates(s, angelDef, turnBefore, actionClass);

        for (const frontSlot of s.board.frontSlots) {
          if (frontSlot?.type === 'Angel' && frontSlot.instanceId === angel.instanceId) {
            frontSlot.activated = true;
            break;
          }
        }

        awardOblivionForCardPlay(s, result.oblivionBonus, false, undefined, angelDef, actionClass);
        if (result.pendingEffect) s.turn.pendingEffect = result.pendingEffect;

        checkBossDefeated(s);
        recompute(s);
      });
    },

    activateSeraphimAttack: (slot, attackId = 'unsynergized', paymentSelection) => {
      set(s => {
        if (s.turn.phase !== 'playing' || s.turn.pendingEffect !== null) return;
        const unit = s.board.frontSlots[slot];
        if (!unit || unit.type !== 'Seraphim') return;
        const def = ScoreSystem.getDefinition(unit.definitionId);
        if (!def || def.type !== 'Seraphim') return;

        const attacks = getSeraphimAttackSet(def as SeraphimDefinition);
        const attack = attackId === 'synergized' ? attacks.synergized : attacks.unsynergized;
        const currentCooldown = unit.attackCooldowns?.[attack.id] ?? 0;
        if (currentCooldown > 0) return;
        if (attack.requiresAngelOnBoard && !hasAnyAngelOnBoard(s.board)) return;

        const attackTags = [
          ...(def.attackTags ?? []),
          ...(attack.tags ?? []),
          'Neutrality'.toLowerCase(),
          attack.label.toLowerCase(),
          attack.id.toLowerCase(),
        ];
        const buffs = collectAttackBuffs(s.board, s.turn, 'Seraphim', def.definitionId, attackTags);

        const costs = attack.costs ?? [];
        if (!canPayAttackCosts(s, costs, { type: 'Seraphim', instanceId: unit.instanceId }, paymentSelection)) return;
        payAttackCosts(s, costs, paymentSelection);

        // Attacking increases the chain by this attack's chain value, locking in the gain via floor

        // Patience mechanic: consume stacks for bonus Oblivion (+1.05% of base attack per stack)
        const seraphimDef = def as import('@/types/cards').SeraphimDefinition;
        const capturedPatience = seraphimDef.patienceThreshold !== undefined ? (unit.patienceStacks ?? 0) : 0;
        const patienceOblivion = Math.round(attack.baseOblivion * capturedPatience * 0.0105);
        const targetedNextAttackBonus = Math.max(0, s.turn.neutralityNextAttackOblivionByInstance?.[unit.instanceId] ?? 0);

        let amount = Math.round(
          Math.max(0, attack.baseOblivion + buffs.baseOblivionBonus + patienceOblivion + targetedNextAttackBonus)
          * Math.max(0.1, buffs.multiplier),
        );

        if (targetedNextAttackBonus > 0 && s.turn.neutralityNextAttackOblivionByInstance) {
          const next = { ...s.turn.neutralityNextAttackOblivionByInstance };
          delete next[unit.instanceId];
          s.turn.neutralityNextAttackOblivionByInstance = next;
        }

        const attackMode = attackId === 'synergized' ? 'synergized' : 'unsynergized';
        void attackMode;

        if (def.definitionId === 'tx-sera-null-entropy') {
          const sigils = Math.max(0, s.turn.neutralityEquilibriumSigils ?? 0);
          amount += sigils * 300;
          if (sigils > 0) {
            amount = Math.round(amount * (1 + Math.min(0.4, sigils * 0.02)));
          }
        }

        amount = Math.round(amount * getSetFullFireMultiplier(s, def));
        amount = Math.round(amount * getHighTierAttackDamageMultiplier(def.rarity));
        grantOblivion(s, amount);
        s.turn.lastFiredSeraphimAttackMode = attackId === 'synergized' ? 'synergized' : 'unsynergized';
        s.turn.lastFiredSeraphimAttackOblivion = amount;
        // Card-break: synergized Seraphim attacks build +15 stagger.
        if (attackId === 'synergized') applyCardBreakStagger(s, 15);
        if (def.definitionId === 'tx-sera-null-entropy' && capturedPatience >= 14) {
          s.turn.neutralityPatientLightStacks = Math.max(0, s.turn.neutralityPatientLightStacks ?? 0) + 1;
        }
        eventBus.emit('seraphim:attacked', { slot, attackId: attack.id, amount });

        const refreshed = s.board.frontSlots[slot];
        if (refreshed && refreshed.type === 'Seraphim') {
          const crownCooldownReduction = 0;
          let sentinelReduction = 0;
          const sentinelOnBoard = s.board.backSlots.some(back => back?.type === 'Cherubim' && back.definitionId === 'tx-cher-null-sentinel');
          if (sentinelOnBoard) {
            const spent = spendNeutralityEquilibriumSigils(s, 4);
            if (spent >= 4) {
              sentinelReduction = 2;
              s.turn.neutralityPatientLightStacks = Math.max(0, s.turn.neutralityPatientLightStacks ?? 0) + 1;
            }
          }
          const effectiveCooldown = Math.max(1, attack.cooldownCards + buffs.cooldownDeltaCards - crownCooldownReduction - sentinelReduction);
          refreshed.attackCooldowns = { ...(refreshed.attackCooldowns ?? {}), [attack.id]: effectiveCooldown };
          // Reset patience after consuming it.
          if (seraphimDef.patienceThreshold !== undefined) {
            const thresholdReduction = Math.floor(getArtifactEffect(s.turn, 'patience_threshold_reduction', s.progress.ownedArtifacts));
            const effectiveThreshold = Math.max(1, seraphimDef.patienceThreshold - thresholdReduction);
            if (capturedPatience >= effectiveThreshold) {
              if (seraphimDef.patienceThresholdDraw) {
                s.deck = TurnSystem.drawCards(s.deck, seraphimDef.patienceThresholdDraw);
              }
              const oblivionBonus = Math.floor(getArtifactEffect(s.turn, 'patience_attack_oblivion_bonus', s.progress.ownedArtifacts));
              if (oblivionBonus > 0) {
                grantOblivion(s, oblivionBonus);
              }
            }
            const preservePercent = Math.max(0, s.turn.neutralityAttackPreservePercent ?? 0);
            const baseRestorePercent = Math.max(0, s.turn.neutralityAttackRestorePercent ?? 0);
            const entropySigils = Math.max(0, s.turn.neutralityEquilibriumSigils ?? 0);
            const attackSetKey = 'Neutrality';
            const entropyRestorePercent = def.definitionId === 'tx-sera-null-entropy'
              ? Math.min(70, entropySigils * 7)
              : 0;
            const preserveApplied = attackSetKey === 'Neutrality' ? preservePercent : 0;
            const restorePercent = attackSetKey === 'Neutrality' ? baseRestorePercent + entropyRestorePercent : 0;
            const preserved = Math.floor(capturedPatience * (preserveApplied / 100));
            const restored = Math.floor(capturedPatience * (restorePercent / 100));
            refreshed.patienceStacks = Math.max(0, preserved + restored);

            const linkedRetainPercent = attackSetKey === 'Neutrality' ? Math.max(0, s.turn.neutralityLinkedRetainPercent ?? 0) : 0;
            if (linkedRetainPercent > 0) {
              for (const other of s.board.frontSlots) {
                if (!other || other.type !== 'Seraphim' || !other.isActive || other.instanceId === refreshed.instanceId) continue;
                other.patienceStacks = Math.floor((other.patienceStacks ?? 0) * (linkedRetainPercent / 100));
              }
            }
          }
        }

        applyLateGameAttackIdentity(s, def.definitionId, def.rarity, attack.label, amount);
        enforceMinimumAttackCooldown(s.board, slot, attack.id);

        checkBossDefeated(s);
        recompute(s);
      });
    },

    activateAngelAttack: (slot, attackId = 'primary', paymentSelection) => {
      set(s => {
        if (s.turn.phase !== 'playing' || s.turn.pendingEffect !== null) return;
        const unit = s.board.frontSlots[slot];
        if (!unit || unit.type !== 'Angel') return;
        const def = ScoreSystem.getDefinition(unit.definitionId);
        if (!def || def.type !== 'Angel') return;

        const attacks = getAngelAttackSet(def as AngelDefinition);
        const attack = attackId === 'exalted' ? attacks.exalted : attacks.primary;
        const currentCooldown = unit.attackCooldowns?.[attack.id] ?? 0;
        if (currentCooldown > 0) return;

        const attackTags = [
          ...(def.attackTags ?? []),
          ...(attack.tags ?? []),
          'Neutrality'.toLowerCase(),
          attack.label.toLowerCase(),
          attack.id.toLowerCase(),
        ];
        const buffs = collectAttackBuffs(s.board, s.turn, 'Angel', def.definitionId, attackTags);

        const costs = attack.costs ?? [];
        if (!canPayAttackCosts(s, costs, { type: 'Angel', instanceId: unit.instanceId }, paymentSelection)) return;
        payAttackCosts(s, costs, paymentSelection);

        // Neutrality Angels: consume all accumulated patienceStacks for a bonus.
        // Rate: +1.4% of base Oblivion per stack (nerfed from 2%; preserve logic mirrors Seraphim).
        let neutralityAngelPatienceBonus = 0;
        const capturedAngelPatience = true ? (unit.patienceStacks ?? 0) : 0;
        if (capturedAngelPatience > 0) {
          neutralityAngelPatienceBonus = Math.round(attack.baseOblivion * capturedAngelPatience * 0.014);
        }

        let amount = Math.round(
          Math.max(0, attack.baseOblivion + buffs.baseOblivionBonus + neutralityAngelPatienceBonus)
          * Math.max(0.1, buffs.multiplier),
        );

        amount = Math.round(amount * getSetFullFireMultiplier(s, def));
        amount = Math.round(amount * getHighTierAttackDamageMultiplier(def.rarity));
        grantOblivion(s, amount);
        // Card-break: exalted Angel attacks build +25 stagger.
        if (attackId === 'exalted') applyCardBreakStagger(s, 25);
        eventBus.emit('angel:attacked', { slot, attackId: attack.id, amount });

        const refreshed = s.board.frontSlots[slot];
        if (refreshed && refreshed.type === 'Angel') {
          const effectiveCooldown = Math.max(1, attack.cooldownCards + buffs.cooldownDeltaCards);
          refreshed.attackCooldowns = { ...(refreshed.attackCooldowns ?? {}), [attack.id]: effectiveCooldown };
          // Neutrality: consume patience stacks after the attack resolves, respecting Preserve.
          if (true && capturedAngelPatience > 0) {
            const preservePercent = Math.max(0, s.turn.neutralityAttackPreservePercent ?? 0);
            const preserved = Math.floor(capturedAngelPatience * (preservePercent / 100));
            refreshed.patienceStacks = preserved;
            // Record only the consumed portion for the turn tracker.
            s.turn.neutralityPatienceConsumedThisTurn = (s.turn.neutralityPatienceConsumedThisTurn ?? 0) + (capturedAngelPatience - preserved);
          }
        }

        applyLateGameAttackIdentity(s, def.definitionId, def.rarity, attack.label, amount);
        enforceMinimumAttackCooldown(s.board, slot, attack.id);

        checkBossDefeated(s);
        recompute(s);
      });
    },

    // �E��E��E��E� Deck management �E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E�

    initDeck: (deckList, extraDeck?) => {
      set(s => {
        const nextDeckList = cloneDeckList(deckList);
        const nextExtraDeck = cloneExtraDeck(extraDeck ?? s.deck.extraDeck);

        s.deck = createDeckState(nextDeckList, nextExtraDeck);

        const activeSavedDeck = s.progress.savedDecks.find(
          deck => deck.id === s.progress.activeDeckId && !deck.isStarter,
        );
        if (activeSavedDeck) {
          activeSavedDeck.deckList = cloneDeckList(nextDeckList);
          activeSavedDeck.extraDeck = cloneExtraDeck(nextExtraDeck);
        }
      });
    },

    saveDeckList: (deckList) => {
      set(s => { s.deck.deckList = cloneDeckList(deckList); });
    },

    saveCurrentDeck: (name, deckList = get().deck.deckList, extraDeck = get().deck.extraDeck) => {
      const id = `deck_${Date.now()}`;
      const newDeck: SavedDeck = {
        id,
        name,
        deckList: cloneDeckList(deckList),
        extraDeck: cloneExtraDeck(extraDeck),
        isStarter: false,
      };
      set(s => {
        s.progress.savedDecks.push(newDeck);
        s.progress.activeDeckId = id;
        s.deck = createDeckState(newDeck.deckList, newDeck.extraDeck);
      });
      return id;
    },

    updateSavedDeck: (id, deckList, extraDeck?) => {
      set(s => {
        const deck = s.progress.savedDecks.find(d => d.id === id);
        if (deck && !deck.isStarter) {
          const nextDeckList = cloneDeckList(deckList);
          deck.deckList = nextDeckList;
          const nextExtraDeck = extraDeck !== undefined
            ? cloneExtraDeck(extraDeck)
            : cloneExtraDeck(deck.extraDeck);

          if (extraDeck !== undefined) {
            deck.extraDeck = nextExtraDeck;
          }

          if (s.progress.activeDeckId === id) {
            s.deck = createDeckState(nextDeckList, nextExtraDeck);
          }
        }
      });
    },

    loadSavedDeck: (id) => {
      set(s => {
        const saved = s.progress.savedDecks.find(d => d.id === id);
        if (!saved) return;
        s.deck = createDeckState(saved.deckList, saved.extraDeck ?? s.deck.extraDeck);
        s.progress.activeDeckId = id;
      });
    },

    deleteSavedDeck: (id) => {
      set(s => {
        const idx = s.progress.savedDecks.findIndex(d => d.id === id && !d.isStarter);
        if (idx === -1) return;
        s.progress.savedDecks.splice(idx, 1);
        if (s.progress.activeDeckId === id) s.progress.activeDeckId = null;
      });
    },

    // �E��E��E��E� Turn flow �E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E�

    beginTurn: () => {
      set(s => {
        if (s.turn.phase !== 'idle') return;
        // Battleground: players only get one turn. Block a second beginTurn.
        if (s.battleground.mode === 'active' && s.battleground.turnTaken) return;
        // Mark the turn as consumed for this battleground match.
        if (s.battleground.mode === 'active') s.battleground.turnTaken = true;
        // Preserve Dream Lattice: Solarvex Ward tracking removed (dead set)
        s.turn.turnNumber = (s.turn.turnNumber ?? 0) + 1;
        enforceAngelExtraDeckInvariant(s.deck);
        if (s.deck.drawPile.length < 5 && s.deck.discardPile.length > 0) {
          s.deck.drawPile = DeckSystem.reshuffleDiscard(s.deck.drawPile, s.deck.discardPile);
          s.deck.discardPile = [];
        }
        const { drawn, remaining } = DeckSystem.draw(s.deck.drawPile, 5);
        s.deck.drawPile = remaining;
        for (const card of drawn) s.deck.hand.push(card);
        enforceAngelExtraDeckInvariant(s.deck, { refillHand: true });

        // ── Guided Trial Deck: first turn gets a fixed opening hand ──────────
        const isGuidedTrial = s.trialDeck.mode === 'active' && s.trialDeck.trialMode === 'guided';
        if (isGuidedTrial && s.turn.turnNumber === 1 && s.trialDeck.guidedOpeningHand.length > 0) {
          // Put the drawn cards back into the draw pile (front), then build
          // the fixed opening hand from guidedOpeningHand definitionIds.
          s.deck.drawPile = [...s.deck.hand, ...s.deck.drawPile];
          s.deck.hand = [];
          const hand: DeckCard[] = [];
          for (const defId of s.trialDeck.guidedOpeningHand) {
            const idx = s.deck.drawPile.findIndex(c => c.definitionId === defId);
            if (idx !== -1) {
              hand.push(s.deck.drawPile[idx]);
              s.deck.drawPile.splice(idx, 1);
            } else {
              // Card not in draw pile — create a fresh instance
              const { nextDeckId: _nextId } = (() => {
                // We can't call nextDeckId() here; use a deterministic id
                return { nextDeckId: () => `trial-guided-hand-${defId}-${Date.now()}` };
              })();
              hand.push({ instanceId: _nextId(), definitionId: defId, finish: 'normal' });
            }
          }
          for (const card of hand) s.deck.hand.push(card);
          // Skip mulligan in guided mode — go straight to playing
          s.turn = { ...defaultTurn, phase: 'playing' };
          return;
        }

        s.turn = { ...defaultTurn, phase: isGuidedTrial ? 'playing' : 'mulligan' };
        // Propagate equipped artifacts from the active saved deck into TurnState.
        const activeDeckForArtifacts = s.progress.savedDecks.find(d => d.id === s.progress.activeDeckId);
        s.turn.equippedArtifactIds = activeDeckForArtifacts?.equippedArtifacts?.slice() ?? [];
        // Apply artifact start-of-turn bonuses (after equippedArtifactIds is populated).
      });
    },

    toggleMulliganCard: (instanceId) => {
      set(s => {
        if (s.turn.phase !== 'mulligan') return;
        const idx = s.turn.mulliganSelected.indexOf(instanceId);
        if (idx === -1) s.turn.mulliganSelected.push(instanceId);
        else s.turn.mulliganSelected.splice(idx, 1);
      });
    },

    toggleCardFace: (instanceId) => {
      set(s => {
        const flip = (card: { instanceId: string; definitionId: string; faceState?: CardFaceState }) => {
          const def = CardRegistry.get(card.definitionId);
          if (!def || false) return false;
          if (!card.definitionId.startsWith('dfh-ser-')) {
            return false;
          }
          card.faceState = card.faceState === 'back' ? 'front' : 'back';
          return true;
        };

        const handCard = s.deck.hand.find(card => card.instanceId === instanceId);
        if (handCard && flip(handCard)) return;

        const frontCard = s.board.frontSlots.find(slot => slot?.instanceId === instanceId);
        if (frontCard && flip(frontCard)) return;

        const backCard = s.board.backSlots.find(slot => slot?.instanceId === instanceId);
        if (backCard && flip(backCard)) return;
      });
    },

    confirmMulligan: () => {
      set(s => {
        if (s.turn.phase !== 'mulligan') return;
        const selected = [...s.turn.mulliganSelected];
        enforceAngelExtraDeckInvariant(s.deck, { refillHand: true });
        s.turn.mulliganSelected = [];
        s.turn.phase = 'playing';
        if (selected.length === 0) {
          return;
        }
        const toDiscard = s.deck.hand.filter(c => selected.includes(c.instanceId));
        for (const card of toDiscard) s.deck.discardPile.push(card);
        s.deck.hand = s.deck.hand.filter(c => !selected.includes(c.instanceId));
        if (s.deck.drawPile.length < selected.length && s.deck.discardPile.length > 0) {
          s.deck.drawPile = DeckSystem.reshuffleDiscard(s.deck.drawPile, s.deck.discardPile);
          s.deck.discardPile = [];
        }
        const { drawn, remaining } = DeckSystem.draw(s.deck.drawPile, toDiscard.length);
        s.deck.drawPile = remaining;
        for (const card of drawn) s.deck.hand.push(card);
        enforceAngelExtraDeckInvariant(s.deck, { refillHand: true });
      });
    },

    embraceInfinite: () => {
      set(s => {
        if (!canEmbraceInfinite(s)) return;
        const handSnapshot = [...s.deck.hand];
        const drawCapableCards = handSnapshot.filter(card => cardCanDraw(card.definitionId));
        const wasBossFight = s.bossFight.mode === 'active';
        grantOblivion(s, handSnapshot.length * 50);
        checkBossDefeated(s);
        if (wasBossFight && s.bossFight.mode !== 'active') return;

        if (drawCapableCards.length <= 1) {
          const keptCards = drawCapableCards.slice(0, 1);
          const keptIds = new Set(keptCards.map(card => card.instanceId));
          const reshuffledCards = handSnapshot.filter(card => !keptIds.has(card.instanceId));
          s.deck.hand = keptCards;
          s.deck.drawPile = DeckSystem.shuffle([...s.deck.drawPile, ...reshuffledCards]);
          s.turn.pendingEffect = null;
          endTurnInternal(s);
          return;
        }

        s.turn.pendingEffect = {
          type: 'embrace_infinite',
          cards: drawCapableCards,
          allCards: handSnapshot,
          keep: 1,
        };
      });
    },

    playCard: (instanceId) => {
      set(s => {
        if (s.turn.phase !== 'playing') return;
        const deckCard = s.deck.hand.find(c => c.instanceId === instanceId);
        if (!deckCard) return;
        const def = ScoreSystem.getDefinition(deckCard.definitionId);
        if (!def) return;

        if (def.type === 'Seraphim') {
          const turnBefore = captureTurnSnapshot(s.turn);
          const actionClass = classifyActionClass(def, getDefinitionOnPlayEffects(def));
          const emptySlot = s.board.frontSlots.findIndex(sl => sl === null);
          if (emptySlot === -1) return;
          const slot = emptySlot as 0 | 1 | 2 | 3 | 4;
          const seraphimInst: SeraphimInstance = {
            instanceId: deckCard.instanceId,
            definitionId: deckCard.definitionId,
            type: 'Seraphim',
            rarity: def.rarity,
            finish: deckCard.finish,
            level: 1,
            isActive: false,
            attackCooldowns: {},
            boardSlot: slot,
          };
          s.board.frontSlots[slot] = seraphimInst;
          s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);
          recompute(s);

          awardOblivionForCardPlay(s, 0, false);
          applyCherubimPassiveEffects(s);
          tickCherubimDurability(s);

          const result = CardEffectExecutor.execute(deckCard, s.turn, s.board, s.deck, true);
          if (result.canPlay) {
            s.turn = result.turn;
            s.board = result.board;
            s.deck = result.deck;
            applyNeutralityTimerPauseFromTurn(s);
            if (result.pendingEffect) s.turn.pendingEffect = result.pendingEffect;
            applyAllSetPlayStates(s, def, turnBefore, actionClass);
            awardOblivionForCardPlay(s, result.oblivionBonus, false, undefined, def, actionClass);
          }
          s.deck.hand = s.deck.hand.filter(c => c.instanceId !== deckCard.instanceId);
          resolveNeutralityMarkedCardTrigger(s, deckCard.instanceId, deckCard.definitionId);
          incrementAngelProgress(s.board);
          recordCardPlay(s, deckCard.definitionId);
          advanceTrialGuideStep(s, deckCard.definitionId);
          checkBossDefeated(s);
          recompute(s);
          return;
        }

        if (def.type === 'Cherubim') {
          const turnBefore = captureTurnSnapshot(s.turn);
          const actionClass = classifyActionClass(def, getDefinitionOnPlayEffects(def));
          const emptyBack = s.board.backSlots.findIndex(sl => sl === null);
          if (emptyBack === -1) return;
          const backSlotIndex = emptyBack as 0 | 1 | 2 | 3;
          const cherubimDef = def as CherubimDefinition;
          const cherubimInst: CherubimInstance = {
            instanceId: deckCard.instanceId,
            definitionId: deckCard.definitionId,
            type: 'Cherubim',
            rarity: cherubimDef.rarity,
            finish: deckCard.finish,
            level: 1,
            ...(cherubimDef.maxDurability !== undefined
              ? {
                  durability: cherubimDef.maxDurability + s.computedStats.cherubimExtraPlays,
                  maxDurability: cherubimDef.maxDurability,
                }
              : {}),
            backSlot: backSlotIndex,
          };
          s.board.backSlots[backSlotIndex] = cherubimInst;
          s.turn.cherubimSummonedThisTurn = (s.turn.cherubimSummonedThisTurn ?? 0) + 1;
          s.deck.hand = s.deck.hand.filter(c => c.instanceId !== deckCard.instanceId);
              recompute(s);

          const result = CardEffectExecutor.execute(
            deckCard,
            s.turn,
            s.board,
            s.deck,
            false,
            {
              effects: cherubimDef.onPlayEffects,
              countAsPlay: false,
              removeFromHand: false,
            },
          );
          if (!result.canPlay) return;
          s.turn = result.turn;
          s.board = result.board;
          s.deck = result.deck;
          applyNeutralityTimerPauseFromTurn(s);
          if (result.pendingEffect) s.turn.pendingEffect = result.pendingEffect;
          applyAllSetPlayStates(s, def, turnBefore, actionClass);

          s.turn.cardsPlayedThisTurn += 1;

          awardOblivionForCardPlay(s, result.oblivionBonus, false, undefined, def, actionClass);
          applyCherubimPassiveEffects(s);
          tickCherubimDurability(s);
          incrementAngelProgress(s.board);
          recordCardPlay(s, deckCard.definitionId);
          advanceTrialGuideStep(s, deckCard.definitionId);
          checkBossDefeated(s);
          recompute(s);
          return;
        }

        const turnBefore = captureTurnSnapshot(s.turn);
        const actionClass = classifyActionClass(def, getDefinitionOnPlayEffects(def));
        const result = CardEffectExecutor.execute(deckCard, s.turn, s.board, s.deck);
        if (!result.canPlay) return;
        s.turn = result.turn;
        s.board = result.board;
        s.deck = result.deck;
        applyNeutralityTimerPauseFromTurn(s);
        applyAllSetPlayStates(s, def, turnBefore, actionClass);

        awardOblivionForCardPlay(s, result.oblivionBonus, true, undefined, def, actionClass);
        applyCherubimPassiveEffects(s);
        tickCherubimDurability(s);

        if (result.pendingEffect) s.turn.pendingEffect = result.pendingEffect;
        resolveNeutralityMarkedCardTrigger(s, deckCard.instanceId, deckCard.definitionId);
        incrementAngelProgress(s.board);
        recordCardPlay(s, deckCard.definitionId);
        advanceTrialGuideStep(s, deckCard.definitionId);
        eventBus.emit('card:played', { card: deckCard as never, board: s.board });
        checkBossDefeated(s);
        recompute(s);
      });
    },

    convertTrailToScar: () => {
      // Dead: Thornbound set removed
    },

    consumeFoamToDraw: () => {
      // Dead: EternalSeas set removed
    },

    resolvePending: (selected) => {
      set(s => {
        const pending = s.turn.pendingEffect;
        if (!pending) return;
        let resolvedSubtype: CardSubtypeFilter | null = null;
        let resolvedCardInstanceId: string | null = null;
        let nextPending: import('@/types/game').PendingEffect | null = null;
        let pendingTakenSubtypeCounts: Partial<Record<CardSubtypeFilter, number>> = {};
        let pendingDiscardedSubtypeCounts: Partial<Record<CardSubtypeFilter, number>> = {};
        let pendingLookDiscardedCount = 0;

        const countSubtypeCards = (cards: Array<{ definitionId: string }>): Partial<Record<CardSubtypeFilter, number>> => {
          const counts: Partial<Record<CardSubtypeFilter, number>> = {};
          for (const card of cards) {
            const subtype = CardRegistry.get(card.definitionId)?.type;
            if (subtype === 'Seraphim' || subtype === 'Cherubim' || subtype === 'Ophanim' || subtype === 'Angel') {
              counts[subtype] = (counts[subtype] ?? 0) + 1;
            }
          }
          return counts;
        };

        if (pending.type === 'discard_choice') {
          const discardableHand = s.deck.hand.filter(card => CardRegistry.get(card.definitionId)?.type !== 'Angel');
          const handIds = new Set(discardableHand.map(card => card.instanceId));
          const uniqueSelected = Array.from(new Set(selected));
          if (!uniqueSelected.every(id => handIds.has(id))) return;

          const maxDiscard = Math.min(pending.count, discardableHand.length);
          const isVariableDiscard = pending.sourceCard.includes(':draw_plus:');
          if (isVariableDiscard) {
            if (uniqueSelected.length > maxDiscard) return;
          } else if (uniqueSelected.length !== maxDiscard) {
            return;
          }

          const discardedCards = s.deck.hand.filter(card => uniqueSelected.includes(card.instanceId));
          pendingDiscardedSubtypeCounts = countSubtypeCards(discardedCards);
          recordLossEvent(
            s,
            discardedCards.map(card => ({ definitionId: card.definitionId })),
            'discard',
          );
          s.deck = TurnSystem.discardFromHand(s.deck, uniqueSelected);
          if (pending.sourceCard.includes(':draw:')) {
            s.deck = TurnSystem.drawCards(s.deck, parseInt(pending.sourceCard.split(':draw:')[1]));
          } else if (pending.sourceCard.includes(':draw_plus:')) {
            s.deck = TurnSystem.drawCards(s.deck, uniqueSelected.length + parseInt(pending.sourceCard.split(':draw_plus:')[1]));
          } else if (pending.sourceCard.startsWith('remove_seraphim:')) {
            const slotText = pending.sourceCard.split(':')[1];
            const parsedSlot = Number(slotText);
            if (!Number.isInteger(parsedSlot) || parsedSlot < 0 || parsedSlot > 4) return;
            const slot = parsedSlot as 0 | 1 | 2 | 3 | 4;
            const occupant = s.board.frontSlots[slot];
            if (!occupant || occupant.type !== 'Seraphim') return;

            if (occupant.isActive) {
              eventBus.emit('seraphim:synergy-lost', { slot, instanceId: occupant.instanceId });
            }
            recordLossEvent(s, [{ definitionId: occupant.definitionId }], 'board');
            s.deck.discardPile.push(toDeckCard(occupant));
            s.board.frontSlots[slot] = null;
            s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);
            recompute(s);
          }
        } else if (pending.type === 'look_top_take') {
          if (selected.length === 0) {
            s.deck.drawPile = [...s.deck.drawPile.slice(pending.cards.length), ...pending.cards];
          } else {
            const takenCards = pending.cards.filter(c => selected.includes(c.instanceId));
            pendingTakenSubtypeCounts = countSubtypeCards(takenCards);
            resolvedSubtype = takenCards.length === 1 ? (CardRegistry.get(takenCards[0].definitionId)?.type ?? null) as CardSubtypeFilter | null : null;
            resolvedCardInstanceId = takenCards.length === 1 ? takenCards[0].instanceId : null;
            s.deck = TurnSystem.takeFromTop(s.deck, takenCards, pending.cards.filter(c => !selected.includes(c.instanceId)));
          }
        } else if (pending.type === 'look_top_take_drop') {
          const takeCount = Math.min(pending.take, pending.cards.length);
          const dropCount = Math.min(pending.drop, Math.max(0, pending.cards.length - takeCount));
          const requiredSelections = takeCount + dropCount;
          const pendingCardIds = new Set(pending.cards.map(c => c.instanceId));
          const uniqueSelections = new Set(selected);

          if (selected.length !== requiredSelections) return;
          if (uniqueSelections.size !== selected.length) return;
          if (selected.some(id => !pendingCardIds.has(id))) return;

          const takeIds = new Set(selected.slice(0, takeCount));
          const dropIds = new Set(selected.slice(takeCount, requiredSelections));
          const toTake = pending.cards.filter(c => takeIds.has(c.instanceId));
          const toDrop = pending.cards.filter(c => dropIds.has(c.instanceId));
          const toDiscard = pending.cards.filter(c => !takeIds.has(c.instanceId) && !dropIds.has(c.instanceId));
          pendingTakenSubtypeCounts = countSubtypeCards(toTake);
          pendingDiscardedSubtypeCounts = countSubtypeCards(toDiscard);
          pendingLookDiscardedCount = toDiscard.length;
          resolvedSubtype = toTake.length === 1 ? (CardRegistry.get(toTake[0].definitionId)?.type ?? null) as CardSubtypeFilter | null : null;
          resolvedCardInstanceId = toTake.length === 1 ? toTake[0].instanceId : null;

          s.deck.drawPile = s.deck.drawPile.slice(pending.cards.length);
          s.deck.hand.push(...toTake);
          s.deck.drawPile = [...s.deck.drawPile, ...toDrop];
          s.deck.discardPile.push(...toDiscard);
        } else if (pending.type === 'look_top_take_type') {
          const requiredSelections = Math.min(pending.take, pending.cards.length);
          const pendingCardIds = new Set(pending.cards.map(c => c.instanceId));
          const uniqueSelections = new Set(selected);

          if (selected.length === 0) {
            s.deck.drawPile = [...s.deck.drawPile.slice(pending.cards.length), ...pending.cards];
          } else {
            if (selected.length !== requiredSelections) return;
            if (uniqueSelections.size !== selected.length) return;
            if (selected.some(id => !pendingCardIds.has(id))) return;
            const takenCards = pending.cards.filter(c => selected.includes(c.instanceId));
            pendingTakenSubtypeCounts = countSubtypeCards(takenCards);
            resolvedSubtype = takenCards.length === 1 ? (CardRegistry.get(takenCards[0].definitionId)?.type ?? null) as CardSubtypeFilter | null : null;
            resolvedCardInstanceId = takenCards.length === 1 ? takenCards[0].instanceId : null;
            s.deck = TurnSystem.takeFromTop(s.deck, takenCards, pending.cards.filter(c => !selected.includes(c.instanceId)));
          }
        } else if (pending.type === 'search_deck') {
          const maxSelections = Math.min(pending.take, pending.cards.length);
          const minSelections = Math.max(0, Math.min(pending.minTake ?? maxSelections, maxSelections));
          const pendingCardIds = new Set(pending.cards.map(c => c.instanceId));
          const uniqueSelections = new Set(selected);

          if (selected.length < minSelections || selected.length > maxSelections) return;
          if (selected.length > 0) {
            if (uniqueSelections.size !== selected.length) return;
            if (selected.some(id => !pendingCardIds.has(id))) return;
          }

          if (pending.distinctTypes && selected.length > 0) {
            const chosenByType: Partial<Record<CardSubtypeFilter, number>> = {};
            for (const selectedId of selected) {
              const card = pending.cards.find(c => c.instanceId === selectedId);
              if (!card) return;
              const subtype = CardRegistry.get(card.definitionId)?.type;
              if (subtype !== 'Seraphim' && subtype !== 'Cherubim' && subtype !== 'Ophanim') return;
              if (!pending.filter.includes(subtype)) return;
              chosenByType[subtype] = (chosenByType[subtype] ?? 0) + 1;
              if ((chosenByType[subtype] ?? 0) > 1) return;
            }
          }

          s.deck.drawPile = s.deck.drawPile.filter(c => !selected.includes(c.instanceId));
          const foundCards = pending.cards.filter(c => selected.includes(c.instanceId));
          pendingTakenSubtypeCounts = countSubtypeCards(foundCards);
          resolvedSubtype = foundCards.length === 1 ? (CardRegistry.get(foundCards[0].definitionId)?.type ?? null) as CardSubtypeFilter | null : null;
          resolvedCardInstanceId = foundCards.length === 1 ? foundCards[0].instanceId : null;
          s.deck.hand.push(...foundCards);
          s.deck.drawPile = DeckSystem.shuffle(s.deck.drawPile);
        } else if (pending.type === 'salvage') {
          const requiredSelections = Math.min(pending.count, pending.cards.length);
          const pendingCardIds = new Set(pending.cards.map(c => c.instanceId));
          const uniqueSelections = new Set(selected);

          if (selected.length > 0) {
            if (selected.length !== requiredSelections) return;
            if (uniqueSelections.size !== selected.length) return;
            if (selected.some(id => !pendingCardIds.has(id))) return;
          }

          if (selected.length > 0 && pending.filter && pending.filter.length > 1) {
            const selectedTypes = selected
              .map(id => pending.cards.find(card => card.instanceId === id))
              .filter((card): card is DeckCard => Boolean(card))
              .map(card => CardRegistry.get(card.definitionId)?.type)
              .filter((type): type is CardSubtypeFilter => type === 'Seraphim' || type === 'Cherubim' || type === 'Ophanim');
            const requiredTypes = new Set(pending.filter);
            const chosenTypes = new Set(selectedTypes);
            if ([...requiredTypes].some(type => !chosenTypes.has(type))) {
              return;
            }
          }
          const salvagedCards = pending.cards.filter(c => selected.includes(c.instanceId));
          pendingTakenSubtypeCounts = countSubtypeCards(salvagedCards);
          resolvedSubtype = salvagedCards.length === 1 ? (CardRegistry.get(salvagedCards[0].definitionId)?.type ?? null) as CardSubtypeFilter | null : null;
          resolvedCardInstanceId = salvagedCards.length === 1 ? salvagedCards[0].instanceId : null;
          s.deck.discardPile = s.deck.discardPile.filter(c => !selected.includes(c.instanceId));
          s.deck.hand.push(...salvagedCards);
        } else if (pending.type === 'embrace_infinite') {
          const keptIds = new Set(selected.slice(0, pending.keep));
          const keptCards = pending.cards.filter(c => keptIds.has(c.instanceId));
          const reshuffledCards = pending.allCards.filter(c => !keptIds.has(c.instanceId));
          s.deck.hand = keptCards;
          s.deck.drawPile = DeckSystem.shuffle([...s.deck.drawPile, ...reshuffledCards]);
        } else if (pending.type === 'neutrality_equilibrium_tactical_choice') {
          const choice = selected[0];
          if (choice !== 'burst' && choice !== 'restore') return;

          const available = Math.max(0, s.turn.neutralityEquilibriumSigils ?? 0);
          const spend = Math.max(0, pending.spend);
          if (available < spend || spend <= 0) return;

          s.turn.neutralityEquilibriumSigils = available - spend;

          const activeSeraphim = s.board.frontSlots.filter(
            (unit): unit is SeraphimInstance => unit?.type === 'Seraphim' && unit.isActive,
          );

          if (choice === 'burst') {
            grantOblivion(s, Math.max(0, pending.burstOblivion));
          } else {
            const restorePercent = Math.max(0, pending.restorePercent);
            for (const unit of activeSeraphim) {
              const current = Math.max(0, unit.patienceStacks ?? 0);
              const restored = Math.floor(current * (restorePercent / 100));
              unit.patienceStacks = current + restored;
            }
          }

          if (pending.patientLightGain > 0) {
            s.turn.neutralityPatientLightStacks = Math.max(0, s.turn.neutralityPatientLightStacks ?? 0) + pending.patientLightGain;
          }
        } else if (pending.type === 'neutrality_echo_pulse_choose') {
          const activeSeraphim = s.board.frontSlots.filter(
            (unit): unit is SeraphimInstance => unit?.type === 'Seraphim' && unit.isActive,
          );
          const selectedId = selected[0] ?? null;
          if (activeSeraphim.length > 0) {
            const target = activeSeraphim.find((unit) => unit.instanceId === selectedId);
            if (!target) return;
            const uncapped = hasNeutralityUncappedGainsInDeck(s.deck);
            target.patienceStacks = clampPatienceStacks((target.patienceStacks ?? 0) + 5, uncapped);
          }

          s.deck = TurnSystem.drawCards(s.deck, 1);
          const hasTwentyPatience = s.board.frontSlots.some((unit) => {
            if (!unit) return false;
            if (unit.type !== 'Seraphim' && unit.type !== 'Angel') return false;
            return (unit.patienceStacks ?? 0) >= 20;
          });
          if (hasTwentyPatience) {
            s.deck = TurnSystem.drawCards(s.deck, 1);
          }
        } else if (pending.type === 'neutrality_void_amp_choose_seraphim') {
          const activeSeraphim = s.board.frontSlots.filter(
            (unit): unit is SeraphimInstance => unit?.type === 'Seraphim' && unit.isActive,
          );
          const selectedId = selected[0] ?? null;
          if (activeSeraphim.length > 0) {
            const target = activeSeraphim.find((unit) => unit.instanceId === selectedId);
            if (!target) return;
            const uncapped = hasNeutralityUncappedGainsInDeck(s.deck);
            target.patienceStacks = clampPatienceStacks((target.patienceStacks ?? 0) + 5, uncapped);
            if (s.turn.lastResolvedSubtype === 'Ophanim') {
              const current = s.turn.neutralityNextAttackOblivionByInstance ?? {};
              s.turn.neutralityNextAttackOblivionByInstance = {
                ...current,
                [target.instanceId]: Math.max(0, (current[target.instanceId] ?? 0) + pending.bonusOblivionIfOphanim),
              };
            }
          }
        } else if (pending.type === 'summon_angel_place') {
          const slotText = selected[0];
          const parsedSlot = Number(slotText);
          if (!Number.isInteger(parsedSlot) || parsedSlot < 0 || parsedSlot > 4) return;
          const slot = parsedSlot as 0 | 1 | 2 | 3 | 4;
          if (!completeSummonedAngelPlacement(s, pending.definitionId, pending.finish, slot)) return;
        }

          s.turn.lastPendingTakenSubtypeCounts = pendingTakenSubtypeCounts;
          s.turn.lastPendingDiscardedSubtypeCounts = pendingDiscardedSubtypeCounts;
          s.turn.lastPendingLookDiscardedCount = pendingLookDiscardedCount;
        s.turn.lastResolvedSubtype = resolvedSubtype;
  s.turn.lastResolvedCardInstanceId = resolvedCardInstanceId;

        if ('resolutionEffects' in pending && pending.resolutionEffects && pending.resolutionEffects.length > 0 && pending.sourceDefinitionId) {
          const result = CardEffectExecutor.execute(
            {
              instanceId: pending.sourceInstanceId ?? pending.sourceDefinitionId,
              definitionId: pending.sourceDefinitionId,
            },
            s.turn,
            s.board,
            s.deck,
            false,
            {
              effects: pending.resolutionEffects,
              countAsPlay: false,
              removeFromHand: false,
            },
          );
          if (!result.canPlay) return;
          s.turn = result.turn;
          s.board = result.board;
          s.deck = result.deck;
          applyNeutralityTimerPauseFromTurn(s);
          nextPending = result.pendingEffect;
        }

        s.deck = normalizeDeckInstanceIds(s.deck);

        s.turn.pendingEffect = nextPending;
      });
    },

    endTurn: () => {
      set(s => {
        endTurnInternal(s);
      });

      const state = get();
      if (isActiveEternityCoopBossFight(state)) {
        void reportEternityCoopParticipantState({
          markEnded: true,
          markHandEmpty: isLocalOutOfCardsForCoop(state),
        });
      }
    },

    endAndBeginAgain: () => {
      set(s => {
        if (s.turn.phase !== 'playing') return;
        // Match End Turn behavior during boss encounters.
        if (s.bossFight.mode === 'active') {
          if (s.bossFight.kind === 'normal' && s.bossFight.coopSessionId) {
            endTurnInternal(s);
          } else {
            completeBossFight(s, false);
          }
          return;
        }

        // Run all end-turn cleanup logic (same as endTurnInternal)
        // End turn hard-resets the board: every unit leaves play.
        for (let i = 0; i < s.board.frontSlots.length; i++) {
          const slot = s.board.frontSlots[i];
          if (slot) {
            recordLossEvent(s, [{ definitionId: slot.definitionId }], 'board');
            s.deck.discardPile.push(toDeckCard(slot));
          }
          (s.board.frontSlots as Array<(typeof s.board.frontSlots)[number]>)[i] = null;
        }

        // Back-row cleanup at turn end.
        for (let i = 0; i < s.board.backSlots.length; i++) {
          const card = s.board.backSlots[i];
          if (!card) continue;

          recordLossEvent(s, [{ definitionId: card.definitionId }], 'board');
          s.deck.discardPile.push(toDeckCard(card));
          s.board.backSlots[i] = null;
        }

        recordLossEvent(s, s.deck.hand.map(card => ({ definitionId: card.definitionId })), 'discard');
        for (const card of s.deck.hand) s.deck.discardPile.push(card);
        s.deck.hand = [];
        if (s.deck.discardPile.length > 0) {
          s.deck.drawPile = DeckSystem.reshuffleDiscard(s.deck.drawPile, s.deck.discardPile);
          s.deck.discardPile = [];
        }
        s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);
        s.board.activeBoardEffects = [];

        // *** SKIP setting phase to 'idle' - instead, immediately begin a new turn ***
        
        recompute(s);
        if (s.deck.drawPile.length < 5 && s.deck.discardPile.length > 0) {
          s.deck.drawPile = DeckSystem.reshuffleDiscard(s.deck.drawPile, s.deck.discardPile);
          s.deck.discardPile = [];
        }
        const { drawn, remaining } = DeckSystem.draw(s.deck.drawPile, 5);
        s.deck.drawPile = remaining;
        for (const card of drawn) s.deck.hand.push(card);
        s.turn = { ...defaultTurn, phase: 'mulligan' };
        
        // Propagate equipped artifacts from the active saved deck into TurnState.
        const activeDeckForArtifacts = s.progress.savedDecks.find(d => d.id === s.progress.activeDeckId);
        s.turn.equippedArtifactIds = activeDeckForArtifacts?.equippedArtifacts?.slice() ?? [];
        
        
        recompute(s);
      });

      const state = get();
      if (isActiveEternityCoopBossFight(state)) {
        void reportEternityCoopParticipantState({
          markEnded: true,
          markHandEmpty: isLocalOutOfCardsForCoop(state),
        });
      }
    },

    // �E��E��E��E� Oblivion �E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E�

    addOblivion: (delta) => {
      set(s => { s.progress.oblivion += delta; });
    },

    // Pack / collection

    openPack: (packId) => {
      const s = get();
      const pack = PACK_DEFINITIONS.find(p => p.id === packId);
      const isLocked = pack?.oblivionUnlock !== undefined
        ? s.progress.oblivion < pack.oblivionUnlock
        : pack?.locked;
      if (!pack || isLocked) return null;
      const usesShards = (pack as typeof pack & { currencyType?: string }).currencyType === 'aberratedShards';
      const baseCost = usesShards
        ? pack.cost
        : (getDailyDealPackId() === pack.id
          ? getDailyDealCost(pack.cost)
          : (getSpotlightPackId() === pack.id ? getSpotlightPackCost(pack.cost) : pack.cost));
      if (usesShards) {
        if (s.progress.aberratedShards < baseCost) return null;
      } else {
        if (s.progress.oblivion < baseCost) return null;
      }
      const preOpen = { ...s.progress.collection };
      const drawn = PackSystem.open(pack);

      set(state => {
        if (usesShards) {
          state.progress.aberratedShards -= baseCost;
        } else {
          state.progress.oblivion -= baseCost;
        }
        for (const defId of drawn) {
          addCollectionCard(state.progress, defId);
        }
        recordPackOpen(state.progress, packId, 'pack', drawn);
        emitQuestProgressToProgress(state.progress, { kind: 'open_packs', amount: 1 });
      });
      return drawn.map(id => ({ id, isNew: !preOpen[id] })).map(x => x.id);
    },

    openBox: (packId) => {
      const s = get();
      const pack = PACK_DEFINITIONS.find(p => p.id === packId);
      const isLocked = pack?.oblivionUnlock !== undefined
        ? s.progress.oblivion < pack.oblivionUnlock
        : pack?.locked;
      if (!pack || isLocked) return null;
      const cost = Math.round(pack.cost * 5 * 0.98);
      if (s.progress.oblivion < cost) return null;
      const pityMisses = s.progress.pityCounters[packId] ?? 0;
      const drawn: string[] = [];
      for (let i = 0; i < 5; i++) {
        drawn.push(...PackSystem.open(pack));
      }

      let hasLegendary = drawn.some(definitionId => CardRegistry.get(definitionId)?.rarity === 'Legendary');
      let boxPityTriggered = false;

      // Box pity: after 4 consecutive no-Legendary boxes for this pack, the 5th box guarantees one.
      if (!hasLegendary && pityMisses >= 4) {
        const legendaryPool = pack.cardPool.filter(definitionId => CardRegistry.get(definitionId)?.rarity === 'Legendary');
        if (legendaryPool.length > 0 && drawn.length > 0) {
          const rng = getActiveCoopRng();
          const replacement = legendaryPool[Math.floor(rng() * legendaryPool.length)];
          const replaceIndex = Math.floor(rng() * drawn.length);
          drawn[replaceIndex] = replacement;
          hasLegendary = true;
          boxPityTriggered = true;
        }
      }

      set(state => {
        state.progress.oblivion -= cost;
        for (const defId of drawn) {
          addCollectionCard(state.progress, defId);
        }
        state.progress.pityCounters[packId] = hasLegendary ? 0 : pityMisses + 1;
        recordPackOpen(state.progress, packId, 'box', drawn);
        emitQuestProgressToProgress(state.progress, { kind: 'open_packs', amount: 5 });
      });
      if (boxPityTriggered) {
        get().enqueueToast('Pity guarantee: Legendary card secured.', 'reward');
      }
      return drawn;
    },

    openCase: (packId) => {
      const s = get();
      const pack = PACK_DEFINITIONS.find(p => p.id === packId);
      const isLocked = pack?.oblivionUnlock !== undefined
        ? s.progress.oblivion < pack.oblivionUnlock
        : pack?.locked;
      if (!pack || isLocked) return null;
      const cost = Math.round(Math.round(pack.cost * 5 * 0.98) * 2 * 0.96);
      if (s.progress.oblivion < cost) return null;
      const drawn: string[] = [];
      for (let i = 0; i < 10; i++) {
        drawn.push(...PackSystem.open(pack));
      }

      // Guarantee at least one Legendary per Case purchase.
      const hasLegendary = drawn.some(definitionId => CardRegistry.get(definitionId)?.rarity === 'Legendary');
      if (!hasLegendary) {
        const legendaryPool = pack.cardPool.filter(definitionId => CardRegistry.get(definitionId)?.rarity === 'Legendary');
        if (legendaryPool.length > 0 && drawn.length > 0) {
          const rng = getActiveCoopRng();
          const replacement = legendaryPool[Math.floor(rng() * legendaryPool.length)];
          const replaceIndex = Math.floor(rng() * drawn.length);
          drawn[replaceIndex] = replacement;
        }
      }

      set(state => {
        state.progress.oblivion -= cost;
        for (const defId of drawn) {
          addCollectionCard(state.progress, defId);
        }
        recordPackOpen(state.progress, packId, 'case', drawn);
        emitQuestProgressToProgress(state.progress, { kind: 'open_packs', amount: 10 });
      });
      return drawn;
    },

    convertCardToHolo: (definitionId) => {
      const state = get();
      const definition = CardRegistry.get(definitionId);
      const cost = getHolofoilConversionCost(definition, state.progress.holoCollection);
      if (!canConvertCardToHolo(definition, state.progress.collection, state.progress.holoCollection)) return false;
      if (cost === null || state.progress.aberratedShards < cost) return false;

      set(s => {
        s.progress.aberratedShards -= cost;
        const currentHolo = s.progress.holoCollection[definitionId] ?? 0;
        const totalOwned = s.progress.collection[definitionId] ?? 0;
        s.progress.holoCollection[definitionId] = Math.min(totalOwned, currentHolo + 1);
      });

      return true;
    },

    toggleFavoriteCard: (definitionId, finish) => {
      set(s => {
        const definition = CardRegistry.get(definitionId);
        if (!definition) return;

        const totalOwned = s.progress.collection[definitionId] ?? 0;
        const holoOwned = Math.min(s.progress.holoCollection[definitionId] ?? 0, totalOwned);
        const normalOwned = Math.max(0, totalOwned - holoOwned);
        const ownedForFinish = finish === 'holo' ? holoOwned : normalOwned;
        const key = getCardFinishKey(definitionId, finish);

        if (ownedForFinish <= 0) {
          delete s.progress.favoriteCollection[key];
          return;
        }

        if (s.progress.favoriteCollection[key]) {
          delete s.progress.favoriteCollection[key];
        } else {
          s.progress.favoriteCollection[key] = true;
        }
      });
    },

    combineForInfinite: (recipe) => {
      const state = get();
      // Verify the player owns enough copies of each ingredient
      for (const ingredient of recipe.ingredients) {
        const owned = state.progress.collection[ingredient.definitionId] ?? 0;
        if (owned < ingredient.count) return `Missing copies for ${ingredient.definitionId}`;
      }

      // Block crafting if it would break any saved deck's ownership requirements.
      const simulatedCollection: Record<string, number> = { ...state.progress.collection };
      for (const ingredient of recipe.ingredients) {
        simulatedCollection[ingredient.definitionId] = (simulatedCollection[ingredient.definitionId] ?? 0) - ingredient.count;
      }

      for (const savedDeck of state.progress.savedDecks) {
        const requiredByDefinition: Record<string, number> = {};
        for (const entry of savedDeck.deckList) {
          requiredByDefinition[entry.definitionId] = (requiredByDefinition[entry.definitionId] ?? 0) + entry.copies;
        }
        for (const extra of savedDeck.extraDeck) {
          requiredByDefinition[extra.definitionId] = (requiredByDefinition[extra.definitionId] ?? 0) + 1;
        }

        for (const ingredient of recipe.ingredients) {
          const required = requiredByDefinition[ingredient.definitionId] ?? 0;
          if (required <= 0) continue;
          const remaining = simulatedCollection[ingredient.definitionId] ?? 0;
          if (remaining < required) {
            const def = CardRegistry.get(ingredient.definitionId);
            const cardName = def?.name ?? ingredient.definitionId;
            return `This craft would break your \"${savedDeck.name}\" deck - ${cardName} would drop to ${remaining} owned (needs ${required}).`;
          }
        }
      }

      set(s => {
        // Consume ingredient copies
        for (const ingredient of recipe.ingredients) {
          s.progress.collection[ingredient.definitionId] = (s.progress.collection[ingredient.definitionId] ?? 0) - ingredient.count;
          // Also reduce holoCollection so it can't exceed total
          const holoOwned = s.progress.holoCollection[ingredient.definitionId] ?? 0;
          const totalAfter = s.progress.collection[ingredient.definitionId];
          s.progress.holoCollection[ingredient.definitionId] = Math.min(holoOwned, totalAfter);
        }
        // Grant the Infinite card
        s.progress.infiniteCollection[recipe.resultId] = (s.progress.infiniteCollection[recipe.resultId] ?? 0) + 1;
        // Also add to main collection so it shows in deck builder / collection viewer
        s.progress.collection[recipe.resultId] = (s.progress.collection[recipe.resultId] ?? 0) + 1;
        syncCardOwnershipHistory(s.progress, recipe.resultId);
      });
      return true;
    },

    // �E��E��E��E� Settings �E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E�

    updateSettings: (patch) => {
      set(s => {
        Object.assign(s.settings, patch);
        setUiPreferences(s.settings);
      });
    },

    // ─── Profile ──────────────────────────────────────────────────────────

    setPlayerName: (name) => {
      const clean = name.trim().slice(0, 24);
      if (!clean) return;
      set(s => { s.progress.profile.name = clean; });
    },

    setBio: (bio) => {
      const clean = bio.slice(0, 200);
      set(s => { s.progress.profile.bio = clean; });
    },

    setAvatarId: (avatarId) => {
      set(s => { s.progress.profile.avatarId = avatarId; });
    },

    setTitleId: (titleId) => {
      set(s => { s.progress.profile.titleId = titleId; });
    },

    setUiThemeId: (themeId) => {
      set(s => { s.progress.profile.uiThemeId = themeId; });
    },

    setMainMenuBackgroundId: (backgroundId) => {
      const clean = String(backgroundId ?? '').trim();
      if (!clean) return;
      set(s => { s.progress.profile.mainMenuBackgroundId = clean; });
    },

    setCustomUiThemeColor: (key, value) => {
      set(s => {
        const current = (s.progress.profile.customUiTheme ?? {}) as Record<string, string>;
        s.progress.profile.customUiTheme = { ...current, [key]: value };
      });
    },

    resetCustomUiTheme: () => {
      set(s => { s.progress.profile.customUiTheme = null; });
    },

    setSignatureCard: (slot, cardId) => {
      if (slot < 0 || slot > 4) return;
      set(s => {
        const sigs = [...(s.progress.profile.signatureCardIds ?? [])];
        while (sigs.length <= 4) sigs.push(null as unknown as string);
        if (cardId === null) {
          sigs[slot] = null as unknown as string;
        } else {
          sigs[slot] = cardId;
        }
        s.progress.profile.signatureCardIds = sigs.filter((_, i) => i <= 4);
      });
    },

    recordSocialProgress: (event, amount = 1) => {
      const delta = Number.isFinite(amount) ? Math.max(1, Math.floor(amount)) : 1;
      set(s => {
        const stats = ensureSocialStats(s.progress);
        switch (event as SocialProgressEvent) {
          case 'friend_request_sent':
            stats.friendRequestsSent += delta;
            break;
          case 'friend_added':
            stats.friendsAccepted += delta;
            break;
          case 'message_sent':
            stats.messagesSent += delta;
            break;
          case 'message_with_attachment':
            stats.messagesWithAttachment += delta;
            break;
          case 'gift_sent':
            stats.giftsSent += delta;
            break;
          case 'battleground_invite_sent':
            stats.battlegroundInvitesSent += delta;
            break;
          case 'coop_boss_invite_sent':
            stats.coopBossInvitesSent += delta;
            break;
          case 'coop_boss_invite_accepted':
            stats.coopBossInvitesAccepted += delta;
            break;
        }
      });
    },

    applyRemoteProfile: (remote) => {
      set(s => {
        const p = s.progress.profile;
        if (remote.name.trim()) p.name = remote.name.trim().slice(0, 24);
        p.bio = remote.bio.slice(0, 200);
        p.avatarId = remote.avatarId;
        p.titleId = remote.titleId;
        if (remote.uiThemeId) p.uiThemeId = remote.uiThemeId;
        if (remote.mainMenuBackgroundId) p.mainMenuBackgroundId = remote.mainMenuBackgroundId;
        p.customUiTheme = remote.customUiTheme;
        p.signatureCardIds = remote.signatureCardIds;
        p.unlockedAvatarIds = (remote.unlockedAvatarIds ?? []).filter(Boolean);
        p.unlockedUiThemeIds = (remote.unlockedUiThemeIds ?? []).filter(Boolean);
      });
    },

    addEntropy: (amount) => {
      set(s => { s.progress.entropicEnergyBalance = getEntropicEnergyBalance(s.progress) + amount; });
    },

    spendEntropy: (amount) => {
      const state = get();
      if (getEntropicEnergyBalance(state.progress) < amount) return false;
      set(s => { s.progress.entropicEnergyBalance = getEntropicEnergyBalance(s.progress) - amount; });
      return true;
    },

    recordNullRaidClear: (raidId, cooldownMs) => {
      set(s => {
        s.progress.nullRaidClears = { ...(s.progress.nullRaidClears ?? {}), [raidId]: ((s.progress.nullRaidClears ?? {})[raidId] ?? 0) + 1 };
        s.progress.nullRaidCooldowns = { ...(s.progress.nullRaidCooldowns ?? {}), [raidId]: Date.now() + cooldownMs };
      });
    },

    addTranscendentCard: (definitionId) => {
      set(s => {
        s.progress.transcendentCollection = { ...(s.progress.transcendentCollection ?? {}), [definitionId]: ((s.progress.transcendentCollection ?? {})[definitionId] ?? 0) + 1 };
      });
    },

    purchaseTranscendentCard: (definitionId, cost) => {
      if (!TRANSCENDENT_SHOP_IDS.has(definitionId)) return false;
      if (cost <= 0) return false;
      const state = get();
      if (getEntropicEnergyBalance(state.progress) < cost) return false;
      set(s => {
        s.progress.entropicEnergyBalance = getEntropicEnergyBalance(s.progress) - cost;
        s.progress.transcendentCollection = {
          ...(s.progress.transcendentCollection ?? {}),
          [definitionId]: ((s.progress.transcendentCollection ?? {})[definitionId] ?? 0) + 1,
        };
      });
      return true;
    },

    finalizeNullRaidAngelOutcome: (raidId, dropped, pityConsumed) => {
      set(s => {
        const missStreak = { ...(s.progress.nullRaidAngelMissStreak ?? {}) };
        if (dropped || pityConsumed) {
          missStreak[raidId] = 0;
        } else {
          missStreak[raidId] = (missStreak[raidId] ?? 0) + 1;
        }
        s.progress.nullRaidAngelMissStreak = missStreak;
      });
    },

    // ─── Daily login ──────────────────────────────────────────────────────

    claimDailyReward: () => {
      const evalResult = evaluateDailyLogin(get().progress);
      if (!evalResult.claimable) return null;
      set(s => {
        const today = getUtcDayIndex(Date.now());
        s.progress.dailyLogin.lastClaimedDayIndex = today;
        s.progress.dailyLogin.streak = evalResult.pendingStreak;
        s.progress.dailyLogin.totalClaims += 1;
        s.progress.aberratedShards += evalResult.pendingReward.shards;
      });
      return { shards: evalResult.pendingReward.shards, streak: evalResult.pendingStreak };
    },

    setActiveEnigma: (enigmaId) => {
      set(s => {
        ensureEnigmaState(s.progress);
        if (enigmaId === 'neutral-mystery') ensureNeutralMysteryInstance(s.progress);
        if (!s.progress.enigmas.instances[enigmaId]) return;
        s.progress.enigmas.activeEnigmaId = enigmaId;
      });
    },

    sacrificeEnigmaOblivion: (enigmaId) => {
      const state = get();
      if (enigmaId !== 'neutral-mystery') return false;
      const instance = state.progress.enigmas.instances[enigmaId];
      if (!instance || instance.status === 'locked') return false;
      if (instance.currentStepIndex !== 1) return false;
      if ((state.progress.lifetimeOblivion ?? 0) < 50_000) return false;

      set(s => {
        const target = s.progress.enigmas.instances[enigmaId] ?? ensureNeutralMysteryInstance(s.progress);
        if (!target) return;
        if (target.currentStepIndex !== 1) return;
        if ((s.progress.lifetimeOblivion ?? 0) < 50_000) return;
        s.progress.lifetimeOblivion = (s.progress.lifetimeOblivion ?? 0) - 50_000;
        target.stepsComplete[1] = true;
        target.currentStepIndex = 2;
        pushEnigmaStepToast(s, enigmaId, 1);
      });
      return true;
    },

    claimEnigmaReward: (enigmaId) => {
      const state = get();
      const instance = state.progress.enigmas.instances[enigmaId];
      if (!instance) return false;
      if (instance.status === 'completed') return false;
      if (enigmaId === 'neutral-mystery') {
        if (instance.currentStepIndex < 4) return false;
        if (!instance.stepsComplete[3]) return false;
      }

      set(s => {
        const target = s.progress.enigmas.instances[enigmaId];
        if (!target || target.status === 'completed') return;
        awardEnigmaReward(s.progress, enigmaId);
        target.stepsComplete[4] = true;
        target.currentStepIndex = Math.max(target.currentStepIndex, 5);
        target.completedAt = Date.now();
        pushRewardToast(s, `Enigma Complete: ${enigmaId === 'neutral-mystery' ? 'Neutral Mystery' : enigmaId}`);
      });
      return true;
    },

    claimQuest: (questId) => {
      const s = get();
      if (!s.progress.quests) return null;
      const all = [...s.progress.quests.daily, ...s.progress.quests.weekly];
      const quest = all.find(q => q.id === questId);
      if (!quest) return null;
      if (quest.claimed) return null;
      if (quest.progress < quest.goal) return null;
      const shardReward = quest.shardReward;
      const oblivionReward = quest.oblivionReward ?? 0;
      set(state => {
        const list = state.progress.quests.daily.find(q => q.id === questId)
          ? state.progress.quests.daily
          : state.progress.quests.weekly;
        const q = list.find(qq => qq.id === questId);
        if (q) q.claimed = true;
        if (oblivionReward > 0) {
          state.progress.oblivion += oblivionReward;
          state.progress.lifetimeOblivion = (state.progress.lifetimeOblivion ?? 0) + oblivionReward;
        } else {
          state.progress.aberratedShards += shardReward;
        }
      });
      return oblivionReward > 0
        ? { shards: 0, oblivion: oblivionReward }
        : { shards: shardReward };
    },

    claimAchievement: (achievementId) => {
      const s = get();
      const badge = TITLE_BADGE_BY_ID[achievementId];
      if (!badge) return null;
      if (!isAchievementUnlocked(s.progress, achievementId)) return null;
      const claims = s.progress.achievementClaims ?? {};
      if (claims[achievementId]) return null;
      const shardReward = getAchievementShardReward(badge.group);
      const oblivionReward = getAchievementOblivionReward(badge.group);
      set(state => {
        latchUnlockedAchievements(state.progress);
        if (!state.progress.achievementClaims) state.progress.achievementClaims = {};
        if (!state.progress.achievementUnlocks) state.progress.achievementUnlocks = {};
        state.progress.achievementUnlocks[achievementId] = true;
        state.progress.achievementClaims[achievementId] = true;
        state.progress.aberratedShards += shardReward;
        if (oblivionReward > 0) {
          state.progress.oblivion += oblivionReward;
          state.progress.lifetimeOblivion = (state.progress.lifetimeOblivion ?? 0) + oblivionReward;
        }
      });
      return { shards: shardReward, oblivion: oblivionReward > 0 ? oblivionReward : undefined };
    },

    claimCardMastery: (definitionId, tier) => {
      const tierDef = MASTERY_TIERS.find(t => t.tier === tier);
      if (!tierDef) return null;
      const s = get();
      const count = s.progress.cardPlayCounts?.[definitionId] ?? 0;
      if (count < tierDef.threshold) return null;
      const claimKey = getMasteryClaimKey(definitionId, tier);
      if (s.progress.cardMasteryClaims?.[claimKey]) return null;
      set(state => {
        if (!state.progress.cardMasteryClaims) state.progress.cardMasteryClaims = {};
        state.progress.cardMasteryClaims[claimKey] = true;
        state.progress.aberratedShards += tierDef.shardReward;
      });
      return { shards: tierDef.shardReward };
    },

    claimAllAvailableMastery: () => {
      const s = get();
      const counts = s.progress.cardPlayCounts ?? {};
      const claims = s.progress.cardMasteryClaims ?? {};
      let totalShards = 0;
      let tiersClaimed = 0;
      const toClaim: Array<{ key: string; shards: number }> = [];
      for (const definitionId of Object.keys(counts)) {
        const count = counts[definitionId] ?? 0;
        for (const tierDef of MASTERY_TIERS) {
          if (count < tierDef.threshold) continue;
          const key = getMasteryClaimKey(definitionId, tierDef.tier);
          if (claims[key]) continue;
          toClaim.push({ key, shards: tierDef.shardReward });
          totalShards += tierDef.shardReward;
          tiersClaimed += 1;
        }
      }
      if (tiersClaimed === 0) return { shards: 0, tiersClaimed: 0 };
      set(state => {
        if (!state.progress.cardMasteryClaims) state.progress.cardMasteryClaims = {};
        for (const c of toClaim) state.progress.cardMasteryClaims[c.key] = true;
        state.progress.aberratedShards += totalShards;
      });
      return { shards: totalShards, tiersClaimed };
    },

    markCollectionViewed: () => {
      set(state => {
        state.progress.lastCollectionViewedAt = Date.now();
      });
    },

    recordGauntletRun: (depth, shards) => {
      set(state => {
        if (!state.progress.gauntletBest) {
          state.progress.gauntletBest = { bestDepth: 0, bestShards: 0, runs: 0 };
        }
        const best = state.progress.gauntletBest;
        if (depth > best.bestDepth) best.bestDepth = depth;
        if (shards > best.bestShards) best.bestShards = shards;
        best.runs += 1;
      });
    },

    setCompactMode: (enabled) => {
      set(state => {
        state.settings.compactMode = enabled;
      });
    },

    setHighlightRulesText: (enabled) => {
      set(state => {
        state.settings.highlightRulesText = enabled;
      });
    },

    fractureCard: (definitionId, count = 1) => {
      const state = get();
      const totalOwned = state.progress.collection[definitionId] ?? 0;
      const starterLocked = STARTER_COLLECTION[definitionId] ?? 0;
      const userLocked = state.progress.cardLocks?.[definitionId] ?? 0;
      const lockedCopies = starterLocked + userLocked;
      // Must own MORE than 4 copies to fracture (floor is max of locked + 4).
      const fractureFloor = Math.max(lockedCopies, 4);
      if (totalOwned <= fractureFloor) return 0;
      const definition = CardRegistry.get(definitionId);
      if (!definition) return 0;
      const safeCount = Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1;
      const maxFracturable = Math.max(0, totalOwned - fractureFloor);
      const fractures = Math.min(safeCount, maxFracturable);
      if (fractures <= 0) return 0;
      const FRACTURE_SHARD_YIELD: Record<string, number> = {
        Common: 1, Rare: 3, Epic: 7, Legendary: 12, Eternal: 22, Infinite: 35,
      };
      const shards = FRACTURE_SHARD_YIELD[definition.rarity] ?? 1;
      set(s => {
        const current = s.progress.collection[definitionId] ?? 0;
        if (current <= fractureFloor) return;
        const currentFracturable = Math.max(0, current - fractureFloor);
        const applyFractures = Math.min(fractures, currentFracturable);
        if (applyFractures <= 0) return;
        const nextOwned = current - applyFractures;
        if (nextOwned <= 0) {
          delete s.progress.collection[definitionId];
        } else {
          s.progress.collection[definitionId] = nextOwned;
        }
        s.progress.fractureShards = (s.progress.fractureShards ?? 0) + (shards * applyFractures);
      });
      return shards * fractures;
    },

    spendFractureShards: (targetDefinitionId, amount) => {
      if (amount <= 0) return 0;
      const state = get();
      const available = state.progress.fractureShards ?? 0;
      const toSpend = Math.min(amount, available);
      if (toSpend <= 0) return 0;
      set(s => {
        s.progress.fractureShards = (s.progress.fractureShards ?? 0) - toSpend;
        s.progress.cardPlayCounts = s.progress.cardPlayCounts ?? {};
        s.progress.cardPlayCounts[targetDefinitionId] =
          (s.progress.cardPlayCounts[targetDefinitionId] ?? 0) + toSpend;
      });
      return toSpend;
    },

    dissolveCard: (definitionId) => {
      const state = get();
      const totalOwned = state.progress.collection[definitionId] ?? 0;
      if (totalOwned <= 0) return false;
      // Combined lock: starter-locked copies + user-locked copies cannot be dissolved.
      const starterLocked = STARTER_COLLECTION[definitionId] ?? 0;
      const userLocked = state.progress.cardLocks?.[definitionId] ?? 0;
      const lockedCopies = starterLocked + userLocked;
      if (totalOwned <= lockedCopies) return false;
      const definition = CardRegistry.get(definitionId);
      if (!definition) return false;
      const lightYield = getCardDissolveYield(definition.rarity);
      set(s => {
        const current = s.progress.collection[definitionId] ?? 0;
        if (current <= lockedCopies) return;
        if (current === 1) {
          delete s.progress.collection[definitionId];
        } else {
          s.progress.collection[definitionId] = current - 1;
        }
        s.progress.cardbaneLight = (s.progress.cardbaneLight ?? 0) + lightYield;
      });
      return true;
    },

    dissolveAllUnlocked: () => {
      const state = get();
      let totalDissolved = 0;
      let lightGained = 0;
      const toRemove: Array<{ id: string; remove: number; yield: number }> = [];
      for (const [id, count] of Object.entries(state.progress.collection)) {
        if (count <= 0) continue;
        const definition = CardRegistry.get(id);
        if (!definition) continue;
        const starterLocked = STARTER_COLLECTION[id] ?? 0;
        const userLocked = state.progress.cardLocks?.[id] ?? 0;
        const lockedCopies = starterLocked + userLocked;
        const dissolvable = Math.max(0, count - lockedCopies);
        if (dissolvable <= 0) continue;
        const lightYield = getCardDissolveYield(definition.rarity);
        toRemove.push({ id, remove: dissolvable, yield: lightYield * dissolvable });
        totalDissolved += dissolvable;
        lightGained += lightYield * dissolvable;
      }
      if (totalDissolved <= 0) return 0;
      set(s => {
        for (const entry of toRemove) {
          const current = s.progress.collection[entry.id] ?? 0;
          const next = current - entry.remove;
          if (next <= 0) {
            delete s.progress.collection[entry.id];
          } else {
            s.progress.collection[entry.id] = next;
          }
        }
        s.progress.cardbaneLight = (s.progress.cardbaneLight ?? 0) + lightGained;
      });
      return totalDissolved;
    },

    setCardLock: (definitionId, count) => {
      set(s => {
        if (!s.progress.cardLocks) s.progress.cardLocks = {};
        const owned = s.progress.collection[definitionId] ?? 0;
        const starterLocked = STARTER_COLLECTION[definitionId] ?? 0;
        // Clamp: cannot exceed (owned - starterLocked); cannot go below 0.
        const maxUserLock = Math.max(0, owned - starterLocked);
        const clamped = Math.max(0, Math.min(maxUserLock, Math.floor(count)));
        if (clamped <= 0) {
          delete s.progress.cardLocks[definitionId];
        } else {
          s.progress.cardLocks[definitionId] = clamped;
        }
      });
    },

    setDeckNotes: (deckId, notes) => {
      set(s => {
        const d = s.progress.savedDecks.find(dk => dk.id === deckId);
        if (!d) return;
        // Cap notes at 2000 characters to keep saves reasonable.
        d.notes = notes.length > 2000 ? notes.slice(0, 2000) : notes;
      });
    },

    enqueueToast: (message, kind = 'info', durationMs) => {
      set(state => {
        if (!state.toasts) state.toasts = [];
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        state.toasts.push({ id, message, kind, ts: Date.now(), durationMs });
        // Cap queue to prevent runaway spam (keep most recent 8).
        if (state.toasts.length > 8) state.toasts.splice(0, state.toasts.length - 8);
      });
    },

    dismissToast: (id) => {
      set(state => {
        if (!state.toasts) return;
        state.toasts = state.toasts.filter(t => t.id !== id);
      });
    },

    // ── Battleground of the Card-born ────────────────────────────────────────

    enterBattleground: (kind, cpuDifficulty, opponentProfile) => {
      set(s => {
        if (s.battleground.mode !== 'idle') return;
        const savedState: BattlegroundSavedGameState = {
          deck: cloneState(s.deck),
          board: cloneState(s.board),
          turn: cloneState(s.turn),
          progress: cloneState(s.progress),
          settings: { ...s.settings },
        };
        s.battleground = {
          mode: 'active',
          kind,
          cpuDifficulty: kind === 'cpu' ? (cpuDifficulty ?? 'normal') : null,
          sessionId: null,
          myScore: 0,
          opponentScore: 0,
          opponentBoard: null,
          opponentProfile: opponentProfile ?? null,
          timeRemaining: 180,
          myHandEmpty: false,
          opponentHandEmpty: false,
          opponentHandSize: 0,
          result: null,
          savedGameState: savedState,
          rewardClaimed: false,
          cooldownUntil: 0,
          turnTaken: false,
        };
        // Fresh board/turn for the match; deck retained so player has their built deck.
        s.board = { frontSlots: [null, null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] };
        s.turn = { ...defaultTurn, phase: 'idle' };
        recompute(s);
      });
    },

    tickBattlegroundTimer: (deltaSeconds) => {
      set(s => {
        if (s.battleground.mode !== 'active') return;
        const current = s.battleground.timeRemaining;
        if (typeof current !== 'number' || !Number.isFinite(current) || current <= 0) {
          completeBattlegroundFight(s);
          return;
        }
        const delta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
        const next = Math.max(0, current - Math.max(delta, 0.001));
        s.battleground.timeRemaining = next;
        // Update my hand-empty state on every tick.
        // Also treat the player as done if they have used their one turn and are back in idle.
        const naturallyEmpty = s.deck.hand.length === 0 && s.deck.drawPile.length === 0;
        const turnOver = s.battleground.turnTaken && s.turn.phase === 'idle';
        s.battleground.myHandEmpty = s.battleground.myHandEmpty || naturallyEmpty || turnOver;
        const myEmpty = s.battleground.myHandEmpty;
        const oppEmpty = s.battleground.opponentHandEmpty;
        const myScore = s.battleground.myScore;
        const oppScore = s.battleground.opponentScore;
        // Win condition: timer expired → compare scores.
        if (next <= 0) {
          completeBattlegroundFight(s);
          return;
        }
        // Win condition: both done → resolve by score.
        if (myEmpty && oppEmpty) {
          completeBattlegroundFight(s);
          return;
        }
        // Win condition: opponent ran out AND I lead.
        if (oppEmpty && myScore > oppScore) {
          completeBattlegroundFight(s);
          return;
        }
      });
    },

    completeBattleground: () => {
      set(s => {
        if (s.battleground.mode !== 'active') return;
        completeBattlegroundFight(s);
      });
    },

    updateOpponentBattleground: (board, score, handSize) => {
      set(s => {
        if (s.battleground.mode !== 'active') return;
        s.battleground.opponentBoard = board;
        s.battleground.opponentScore = score;
        if (handSize !== undefined) {
          s.battleground.opponentHandSize = handSize;
          s.battleground.opponentHandEmpty = handSize === 0;
        }
      });
    },

    dismissBattleground: () => {
      set(s => {
        if (s.battleground.mode !== 'finished') return;
        const saved = s.battleground.savedGameState;
        if (saved) {
          s.deck = saved.deck;
          s.board = saved.board;
          s.turn = saved.turn;
          // progress was already updated in completeBattlegroundFight; don't restore.
          s.settings = saved.settings;
        }
        s.battleground = { ...defaultBattleground };
        recompute(s);
      });
    },



    // �E��E��E��E� Boss fight �E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E�

    startBossFight: (bossId, savedDeckId, options) => {
      set(s => {
        if (s.bossFight.mode !== 'idle') return;
        const boss = BOSS_DEFINITIONS.find(b => b.id === bossId);
        if (!boss) return;
        const now = Date.now();
        const cooldown = s.bossFight.cooldowns[bossId];
        // Gauntlet & trial runs ignore cooldown.
        const kind = options?.kind ?? 'normal';
        if (kind === 'normal' && cooldown && cooldown > now) return;
        if (kind !== 'gauntlet' && !isBossUnlocked(s.progress, bossId)) return;
        const savedDeck = s.progress.savedDecks.find(d => d.id === savedDeckId);
        if (!savedDeck) return;

        const savedState: SavedGameState = {
          deck: cloneState(s.deck),
          board: cloneState(s.board),
          turn: cloneState(s.turn),
          progress: cloneState(s.progress),
          settings: { ...s.settings },
        };

        const modifiers = options?.modifiers ?? [];
        const coopPartySize = Math.max(1, Math.min(3, options?.coopPartySize ?? 1));
        const requestedFightCount = Math.max(1, Math.min(3, Math.floor(options?.fightCount ?? 1)));
        const fightCount = kind === 'normal' ? requestedFightCount : 1;

        // Apply boss HP. Event bosses snapshot once per cycle and stay fixed.
        let maxHp = isEventBossCategory(boss.category)
          ? ensureEventBossHpSnapshot(s.progress)
          : boss.hp;
        if (modifiers.some(m => m.kind === 'boss_hp_boost')) {
          maxHp = Math.round(maxHp * 1.25);
        }
        maxHp = Math.round(maxHp * (COOP_BOSS_HP_SCALE_BY_PARTY_SIZE[coopPartySize] ?? 1));
        maxHp = Math.round(maxHp * (BOSS_FIGHT_HP_SCALE_BY_COUNT[fightCount] ?? 1));

        // Time pressure
        let roundSeconds = BOSS_FIGHT_ROUND_SECONDS;
        if (modifiers.some(m => m.kind === 'time_pressure')) {
          roundSeconds = Math.max(60, roundSeconds - 30);
        }

        s.deck = createDeckState(savedDeck.deckList, savedDeck.extraDeck ?? []);
        s.board = { frontSlots: [null, null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] };
        s.turn = { ...defaultTurn, phase: 'idle' };

      // Chain start low modifier removed (chain mechanic purged in Phase 0).

        s.bossFight = {
          mode: 'active',
          activeBossId: bossId,
          bossCurrentHp: maxHp,
          bossMaxHp: maxHp,
          damageDealtThisFight: 0,
          damageDealtFirstMinute: 0,
          fightTimeRemaining: roundSeconds,
          cooldowns: { ...s.bossFight.cooldowns },
          savedGameState: savedState,
          kind,
          modifiers,
          trialRewardMult: options?.trialRewardMult ?? 1,
          gauntletDepth: kind === 'gauntlet' ? 0 : 0,
          gauntletShardsBanked: 0,
          gauntletHpCarryFrac: 1,
          bossWeaknessActive: false,
          coopPartySize,
          fightCount,
          coopSessionId: options?.coopSessionId,
          coopRole: options?.coopRole,
          rewardSummary: null,
        };
        recompute(s);
      });

      const coopSessionId = options?.coopSessionId;
      const sync = useCoopSyncStore.getState();
      if (coopSessionId && sync.attached && sync.sessionId === coopSessionId) {
        void sync.requestResync();
      }
    },

    startWakeTrial: (bossId, savedDeckId, modifiers, rewardMult) => {
      get().startBossFight(bossId, savedDeckId, { kind: 'trial', modifiers, trialRewardMult: rewardMult });
    },

    startEndlessGauntlet: (savedDeckId) => {
      // Pick first boss deterministically by day for a stable opener.
      const firstBoss = BOSS_DEFINITIONS[0];
      if (!firstBoss) return;
      get().startBossFight(firstBoss.id, savedDeckId, { kind: 'gauntlet', modifiers: [] });
    },

    startNullRaidProveYourself: (raidId, savedDeckId) => {
      const state = get();
      if (state.bossFight.mode !== 'idle') return false;

      const raidDef = NULL_RAID_DEFINITIONS.find(r => r.id === raidId);
      if (!raidDef) return false;

      const savedDeck = state.progress.savedDecks.find(d => d.id === savedDeckId);
      if (!savedDeck) return false;

      const firstBossId = raidDef.encounterBossIds[0];
      if (!firstBossId) return false;
      const firstBoss = NULL_RAID_BOSS_MAP.get(firstBossId);
      if (!firstBoss) return false;

      set(s => {
        const savedState: SavedGameState = {
          deck: cloneState(s.deck),
          board: cloneState(s.board),
          turn: cloneState(s.turn),
          progress: cloneState(s.progress),
          settings: { ...s.settings },
        };

        s.deck = createDeckState(savedDeck.deckList, savedDeck.extraDeck ?? []);
        s.board = { frontSlots: [null, null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] };
        s.turn = { ...defaultTurn, phase: 'idle' };
        s.bossFight = {
          mode: 'active',
          activeBossId: firstBossId,
          bossCurrentHp: firstBoss.hp,
          bossMaxHp: firstBoss.hp,
          damageDealtThisFight: 0,
          damageDealtFirstMinute: 0,
          fightTimeRemaining: NULL_RAID_PROVE_YOURSELF_SECONDS,
          cooldowns: s.bossFight.cooldowns,
          savedGameState: savedState,
          kind: 'null_raid',
          nullRaidId: raidId,
          nullRaidEncounterBossIds: [firstBossId],
          nullRaidEncounterIndex: 0,
          nullRaidAccumulatedEntropy: 0,
          nullRaidAccumulatedShards: 0,
          nullRaidBestDamageFirstMinute: 0,
          nullRaidProvingOnly: true,
          fightCount: 1,
          rewardSummary: null,
        };
        recompute(s);
      });

      return true;
    },

    startNullRaid: (raidId, savedDeckId) => {
      const state = get();
      if (state.bossFight.mode !== 'idle') return false;

      const raidDef = NULL_RAID_DEFINITIONS.find(r => r.id === raidId);
      if (!raidDef) return false;

      // Cooldown gate.
      const now = Date.now();
      const cooldown = state.progress.nullRaidCooldowns?.[raidId];
      if (cooldown && cooldown > now) return false;

      // Prove Yourself gate.
      if (state.progress.nullRaidProveUnlocks?.[raidId] !== true) return false;

      // Deck must exist.
      const savedDeck = state.progress.savedDecks.find(d => d.id === savedDeckId);
      if (!savedDeck) return false;

      // First encounter boss must exist.
      const firstBossId = raidDef.encounterBossIds[0];
      if (!firstBossId) return false;
      const firstBoss = NULL_RAID_BOSS_MAP.get(firstBossId);
      if (!firstBoss) return false;

      set(s => {
        // Save current game state so we can restore it after the raid.
        const savedState: SavedGameState = {
          deck: cloneState(s.deck),
          board: cloneState(s.board),
          turn: cloneState(s.turn),
          progress: cloneState(s.progress),
          settings: { ...s.settings },
        };

        s.deck = createDeckState(savedDeck.deckList, savedDeck.extraDeck ?? []);
        s.board = { frontSlots: [null, null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] };
        s.turn = { ...defaultTurn, phase: 'idle' };
        s.bossFight = {
          mode: 'active',
          activeBossId: firstBossId,
          bossCurrentHp: firstBoss.hp,
          bossMaxHp: firstBoss.hp,
          damageDealtThisFight: 0,
          damageDealtFirstMinute: 0,
          fightTimeRemaining: NULL_RAID_ENCOUNTER_SECONDS,
          cooldowns: s.bossFight.cooldowns,
          savedGameState: savedState,
          kind: 'null_raid',
          nullRaidId: raidId,
          nullRaidEncounterBossIds: raidDef.encounterBossIds,
          nullRaidEncounterIndex: 0,
          nullRaidAccumulatedEntropy: 0,
          nullRaidAccumulatedShards: 0,
          nullRaidBestDamageFirstMinute: 0,
          nullRaidProvingOnly: false,
          fightCount: 1,
          rewardSummary: null,
        };
        recompute(s);
      });

      return true;
    },

    tickBossTimer: (deltaSeconds) => {
      set(s => {
        if (s.bossFight.mode !== 'active') return;
        // Fast-fail: any non-positive or invalid timer should immediately resolve as defeat.
        const current = s.bossFight.fightTimeRemaining;
        if (typeof current !== 'number' || !Number.isFinite(current) || current <= 0) {
          completeBossFight(s, false);
          return;
        }
        const delta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
        // Card-break freeze: consume freeze seconds before counting down the fight timer,
        // but only while the player still has comfortable headroom on the clock. Once we're
        // within the final second, freeze must NOT be allowed to keep the timer pinned —
        // otherwise the screen gets stuck on 0:01 forever.
        const freezeLeft = s.bossFight.bossCardBreakFreezeLeft ?? 0;
        if (freezeLeft > 0 && current > 1) {
          s.bossFight.bossCardBreakFreezeLeft = Math.max(0, freezeLeft - delta);
          return;
        }
        if (freezeLeft > 0) {
          // We're in the danger zone; drop the freeze entirely.
          s.bossFight.bossCardBreakFreezeLeft = 0;
        }
        const next = Math.max(0, current - Math.max(delta, 0.001));
        s.bossFight.fightTimeRemaining = next;
        if (next <= 0) {
          completeBossFight(s, false);
        }
      });

      const state = get();
      if (isActiveEternityCoopBossFight(state) && isLocalOutOfCardsForCoop(state)) {
        void reportEternityCoopParticipantState({ markHandEmpty: true });
      }
    },

    forfeitBossFight: () => {
      set(s => {
        if (s.bossFight.mode !== 'active') return;
        if (s.bossFight.kind === 'null_raid') {
          const saved = s.bossFight.savedGameState;
          const cooldowns = { ...s.bossFight.cooldowns };
          if (saved) {
            s.deck = saved.deck;
            s.board = saved.board;
            s.turn = saved.turn;
            s.progress = saved.progress;
            s.settings = saved.settings;
          }
          s.bossFight = { ...defaultBossFight, cooldowns };
          recompute(s);
          return;
        }
        completeBossFight(s, false);
      });
    },

    dismissBossResult: () => {
      set(s => {
        if (s.bossFight.mode !== 'victory' && s.bossFight.mode !== 'defeat') return;
        s.bossFight.mode = 'idle';
        s.bossFight.activeBossId = null;
        s.bossFight.savedGameState = null;
      });
    },

    applyCoopBossDamage: (amount) => {
      set(s => {
        if (amount <= 0) return;
        if (!isActiveEternityCoopBossFight(s)) return;
        s.bossFight.damageDealtThisFight += amount;
        s.bossFight.bossCurrentHp = Math.max(0, s.bossFight.bossCurrentHp - amount);
        eventBus.emit('boss:damaged', { delta: amount, remaining: s.bossFight.bossCurrentHp });
        checkBossDefeated(s);
      });
    },

    markCoopParticipantDisconnected: (userId) => {
      if (!userId) return;

      const me = useSocialStore.getState().user?.id;
      const isRemote = !!me && userId !== me;

      if (isRemote) {
        const shortId = userId.slice(0, 8);
        const state = get();
        if (isActiveEternityCoopBossFight(state)) {
          state.enqueueToast(`Co-op participant disconnected (${shortId}).`, 'warning', 7000);
        } else if (state.bossFight.mode === 'active' && state.bossFight.kind === 'null_raid') {
          state.enqueueToast(`Raid participant disconnected (${shortId}). Your run continues.`, 'warning', 7000);
        }
      }

      void markEternityCoopParticipantDisconnected(userId);

      set(s => {
        if (s.battleground.mode === 'active' && s.battleground.kind === 'pvp') {
          if (isRemote) {
            s.toasts ??= [];
            s.toasts.push({
              id: `bg-disconnect-${Date.now()}`,
              message: 'Opponent disconnected. You win by forfeit.',
              kind: 'success',
              ts: Date.now(),
              durationMs: 7000,
            });
          }
          s.battleground.opponentHandEmpty = true;
          s.battleground.opponentHandSize = 0;
          if (s.battleground.myScore <= s.battleground.opponentScore) {
            s.battleground.myScore = s.battleground.opponentScore + 1;
          }
          completeBattlegroundFight(s);
        }
      });
    },

    // ── Trial Deck ──────────────────────────────────────────────────────────────

    startTrialDeck: (packId) => {
      set(s => {
        if (s.trialDeck.mode !== 'idle') return;
        if (s.bossFight.mode !== 'idle') return;
        const def = getTrialDeckDefinition(packId);
        if (!def) return;
        const trialMode: 'solo' = 'solo';

        const savedState: SavedGameState = {
          deck: cloneState(s.deck),
          board: cloneState(s.board),
          turn: cloneState(s.turn),
          progress: cloneState(s.progress),
          settings: { ...s.settings },
        };

        s.deck = createDeckState(def.deckList, def.extraDeck);

        s.board = { frontSlots: [null, null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] };
        s.turn = { ...defaultTurn, phase: 'idle' };

        s.trialDeck = {
          mode: 'active',
          packId,
          trialMode,
          savedGameState: savedState,
          guideStep: 0,
          guideSteps: [],
          guidedOpeningHand: [],
          guidedDeckOrder: [],
          guideComplete: false,
          turnCount: 0,
          trialOblivionTotal: 0,
        };

        recompute(s);
      });
    },

    startTutorialTurn: (tier) => {
      set(s => {
        if (s.trialDeck.mode !== 'idle') return;
        if (s.bossFight.mode !== 'idle') return;

        const def = buildNeutralityTutorialDeck(tier);

        const savedState: SavedGameState = {
          deck: cloneState(s.deck),
          board: cloneState(s.board),
          turn: cloneState(s.turn),
          progress: cloneState(s.progress),
          settings: { ...s.settings },
        };

        s.deck = createDeckState(def.deckList, def.extraDeck);
        const guidedOrder = def.guidedDeckOrder.length > 0 ? def.guidedDeckOrder : def.deckList;
        s.deck.drawPile = DeckSystem.buildOrdered(guidedOrder);
        s.board = { frontSlots: [null, null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] };
        s.turn = { ...defaultTurn, phase: 'idle' };

        s.trialDeck = {
          mode: 'active',
          packId: def.packId,
          trialMode: 'guided',
          savedGameState: savedState,
          guideStep: 0,
          guideSteps: def.guideSteps,
          guidedOpeningHand: def.guidedOpeningHand,
          guidedDeckOrder: def.guidedDeckOrder,
          guideComplete: false,
          turnCount: 0,
          trialOblivionTotal: 0,
        };

        recompute(s);
      });
    },

    endTrialDeck: () => {
      set(s => {
        if (s.trialDeck.mode !== 'active') return;
        const saved = s.trialDeck.savedGameState;
        if (saved) {
          s.deck = cloneState(saved.deck);
          s.board = cloneState(saved.board);
          s.turn = cloneState(saved.turn);
          s.progress = cloneState(saved.progress);
          s.settings = { ...saved.settings };
        }
        s.trialDeck = { ...defaultTrialDeckState };
        recompute(s);
      });
    },

    // �E��E��E��E� Save/load �E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E�

    loadState: (loaded) => {
      set(s => {
        // Migrate collection: string[] �E��E� Record<string, number>
        if (Array.isArray((loaded.progress as { collection: unknown }).collection)) {
          const rec: Record<string, number> = {};
          for (const id of (loaded.progress as unknown as { collection: string[] }).collection) rec[id] = 1;
          (loaded.progress as { collection: Record<string, number> }).collection = rec;
        }

        // Migrate progress: score �E��E� oblivion
        const op = loaded.progress as unknown as Record<string, unknown>;
        if (op['score'] !== undefined && op['oblivion'] === undefined) {
          op['oblivion'] = op['score'];
        }
        delete op['score'];
        delete op['totalTicksElapsed'];
        delete op['scoreBoostTicks'];
        delete op['scoreBoostMultiplier'];
        delete op['purchasedAscensionCosmetics'];
        if (op['aberratedShards'] === undefined) op['aberratedShards'] = 0;
        if (op['entropicEnergyBalance'] === undefined) {
          op['entropicEnergyBalance'] = (op['entropyBalance'] as number | undefined) ?? 0;
        }
        if (op['holoCollection'] === undefined) op['holoCollection'] = {};
        if (op['infiniteCollection'] === undefined) op['infiniteCollection'] = {};
        if (op['favoriteCollection'] === undefined) op['favoriteCollection'] = {};
        if (op['achievementUnlocks'] === undefined || typeof op['achievementUnlocks'] !== 'object') {
          op['achievementUnlocks'] = {};
        } else {
          const unlocks = op['achievementUnlocks'] as Record<string, unknown>;
          for (const key of Object.keys(unlocks)) {
            if (unlocks[key] !== true) delete unlocks[key];
          }
        }
        if (op['bossClearCounts'] === undefined) op['bossClearCounts'] = {};
        if (op['nullRaidProveUnlocks'] === undefined || typeof op['nullRaidProveUnlocks'] !== 'object') {
          op['nullRaidProveUnlocks'] = {};
        } else {
          const unlocks = op['nullRaidProveUnlocks'] as Record<string, unknown>;
          for (const key of Object.keys(unlocks)) {
            if (unlocks[key] !== true) delete unlocks[key];
          }
        }
        if (op['eventBossHpSnapshots'] === undefined || typeof op['eventBossHpSnapshots'] !== 'object') {
          op['eventBossHpSnapshots'] = {};
        } else {
          const snapshots = op['eventBossHpSnapshots'] as Record<string, unknown>;
          for (const category of Object.keys(snapshots)) {
            const snapshot = snapshots[category] as Record<string, unknown> | undefined;
            if (!snapshot || typeof snapshot !== 'object') {
              delete snapshots[category];
              continue;
            }
            const cycleId = typeof snapshot.cycleId === 'string' ? snapshot.cycleId : '';
            const hp = Number(snapshot.hp);
            if (!cycleId || !Number.isFinite(hp) || hp <= 0) {
              delete snapshots[category];
              continue;
            }
            snapshots[category] = { cycleId, hp: Math.floor(hp) };
          }
        }
        if (op['nullRaidAngelMissStreak'] === undefined) op['nullRaidAngelMissStreak'] = {};
        if (op['socialStats'] === undefined) {
          op['socialStats'] = {
            friendRequestsSent: 0,
            friendsAccepted: 0,
            messagesSent: 0,
            messagesWithAttachment: 0,
            giftsSent: 0,
            battlegroundInvitesSent: 0,
            coopBossInvitesSent: 0,
            coopBossInvitesAccepted: 0,
          };
        } else {
          const ss = op['socialStats'] as Record<string, unknown>;
          const keys = [
            'friendRequestsSent',
            'friendsAccepted',
            'messagesSent',
            'messagesWithAttachment',
            'giftsSent',
            'battlegroundInvitesSent',
            'coopBossInvitesSent',
            'coopBossInvitesAccepted',
          ] as const;
          for (const key of keys) {
            const raw = Number(ss[key]);
            ss[key] = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
          }
        }
        // Profile + daily login backfill (introduced in save v9).
        if (op['profile'] === undefined) {
          op['profile'] = {
            name: 'Wanderer',
            bio: '',
            avatarId: 'pic-classic-acolyte',
            titleId: null,
            uiThemeId: 'theme-warm-default',
            customUiTheme: null,
            unlockedAvatarIds: [],
            unlockedUiThemeIds: [],
            mainMenuBackgroundId: DEFAULT_MAIN_MENU_BACKGROUND_ID,
          };
        } else {
          const prof = op['profile'] as Record<string, unknown>;
          if (typeof prof['name'] !== 'string' || !prof['name']) prof['name'] = 'Wanderer';
          if (typeof prof['bio'] !== 'string') prof['bio'] = '';
          if (typeof prof['avatarId'] !== 'string') prof['avatarId'] = 'pic-classic-acolyte';
          if (prof['titleId'] === undefined) prof['titleId'] = null;
          if (typeof prof['uiThemeId'] !== 'string') prof['uiThemeId'] = 'theme-warm-default';
          if (prof['customUiTheme'] === undefined) prof['customUiTheme'] = null;
          if (typeof prof['mainMenuBackgroundId'] !== 'string' || !prof['mainMenuBackgroundId']) {
            prof['mainMenuBackgroundId'] = DEFAULT_MAIN_MENU_BACKGROUND_ID;
          }
          if (!Array.isArray(prof['unlockedAvatarIds'])) {
            prof['unlockedAvatarIds'] = [];
          } else {
            prof['unlockedAvatarIds'] = (prof['unlockedAvatarIds'] as unknown[])
              .filter((id): id is string => typeof id === 'string');
          }
          if (!Array.isArray(prof['unlockedUiThemeIds'])) {
            prof['unlockedUiThemeIds'] = [];
          } else {
            prof['unlockedUiThemeIds'] = (prof['unlockedUiThemeIds'] as unknown[])
              .filter((id): id is string => typeof id === 'string');
          }
        }
        if (op['dailyLogin'] === undefined) {
          op['dailyLogin'] = { lastClaimedDayIndex: -1, streak: 0, totalClaims: 0 };
        } else {
          const dl = op['dailyLogin'] as Record<string, unknown>;
          if (typeof dl['lastClaimedDayIndex'] !== 'number') dl['lastClaimedDayIndex'] = -1;
          if (typeof dl['streak'] !== 'number') dl['streak'] = 0;
          if (typeof dl['totalClaims'] !== 'number') dl['totalClaims'] = 0;
        }
        if (loaded.settings === undefined) loaded.settings = { ...defaultSettings };
        const settings = loaded.settings as unknown as Record<string, unknown>;
        if (typeof settings['musicVolume'] !== 'number') settings['musicVolume'] = defaultSettings.musicVolume;
        if (typeof settings['sfxVolume'] !== 'number') settings['sfxVolume'] = defaultSettings.sfxVolume;
        if (typeof settings['particlesEnabled'] !== 'boolean') settings['particlesEnabled'] = defaultSettings.particlesEnabled;
        if (typeof settings['reducedMotion'] !== 'boolean') settings['reducedMotion'] = defaultSettings.reducedMotion;
        if (typeof settings['coopNetplayEnabled'] !== 'boolean') settings['coopNetplayEnabled'] = defaultSettings.coopNetplayEnabled;
        if (settings['language'] === undefined) settings['language'] = defaultSettings.language;
        if (settings['fontSizePreset'] === undefined) settings['fontSizePreset'] = defaultSettings.fontSizePreset;
        if (settings['cardArtDisplay'] === undefined) settings['cardArtDisplay'] = defaultSettings.cardArtDisplay;
        if (typeof settings['compactMode'] !== 'boolean') settings['compactMode'] = defaultSettings.compactMode;
        if (typeof settings['instantPackReveal'] !== 'boolean') settings['instantPackReveal'] = defaultSettings.instantPackReveal;
        if (typeof settings['highlightRulesText'] !== 'boolean') settings['highlightRulesText'] = defaultSettings.highlightRulesText;
        if (!settings['controls'] || typeof settings['controls'] !== 'object') {
          settings['controls'] = { ...DEFAULT_CONTROL_BINDINGS };
        } else {
          settings['controls'] = {
            ...DEFAULT_CONTROL_BINDINGS,
            ...(settings['controls'] as Record<string, string>),
          };
        }
        if (settings['cardThemePacks'] === undefined) {
          settings['cardThemePacks'] = { ...DEFAULT_CARD_THEME_PACKS };
        } else {
          settings['cardThemePacks'] = { ...DEFAULT_CARD_THEME_PACKS, ...(settings['cardThemePacks'] as Record<string, string>) };
        }

        // Migrate board: old slots �E��E� frontSlots + backSlots
        const ob = loaded.board as unknown as Record<string, unknown>;
        if (ob['slots'] !== undefined && ob['frontSlots'] === undefined) {
          ob['frontSlots'] = (ob['slots'] as unknown[]).slice(0, 5);
          delete ob['slots'];
        }
        if (ob['frontSlots'] === undefined) ob['frontSlots'] = [null, null, null, null, null];
        if (ob['backSlots'] === undefined) ob['backSlots'] = [null, null, null, null];
        if (ob['emberGrove'] === undefined) ob['emberGrove'] = [];
        // Very old layout: angel + seraphimSlots
        if (ob['angel'] !== undefined || ob['seraphimSlots'] !== undefined) {
          ob['frontSlots'] = [ob['angel'] ?? null, ...((ob['seraphimSlots'] as unknown[] | undefined) ?? [null, null, null]), null].slice(0, 5);
          delete ob['angel'];
          delete ob['seraphimSlots'];
        }
        for (const slot of ob['frontSlots'] as Array<Record<string, unknown> | null>) {
          if (slot && slot['finish'] === undefined) slot['finish'] = 'normal';
        }
        for (const slot of ob['backSlots'] as Array<Record<string, unknown> | null>) {
          if (slot && slot['finish'] === undefined) slot['finish'] = 'normal';
        }

        // Migrate turn: add new fields, strip removed ones
        const ot = loaded.turn as unknown as Record<string, unknown>;
        delete ot['sacredCovenantActive'];
        delete ot['undyingVigilActive'];
        delete ot['prismaticEchoCascadeFloorPerToken'];
        delete ot['prismaticSentencingChainFloorBonus'];
        if (ot['oblivionEarnedThisTurn'] === undefined) ot['oblivionEarnedThisTurn'] = 0;
        if (ot['trail'] === undefined) ot['trail'] = 0;
        if (ot['strain'] === undefined) ot['strain'] = 0;
        if (ot['turnNumber'] === undefined) ot['turnNumber'] = 0;
        if (ot['equilibriumDrift'] === undefined) ot['equilibriumDrift'] = 0;
        if (ot['equilibriumStability'] === undefined) ot['equilibriumStability'] = 0;
        if (ot['neutralitySetupCount'] === undefined) ot['neutralitySetupCount'] = 0;
        if (ot['attenuationClassUses'] === undefined) {
          ot['attenuationClassUses'] = { setup: 0, conversion: 0, multiplier: 0, refund: 0, finisher: 0 };
        }
        if (ot['attenuationBreaksUsed'] === undefined) ot['attenuationBreaksUsed'] = 0;
        if (ot['attenuationBrokenClasses'] === undefined) ot['attenuationBrokenClasses'] = [];
        if (ot['neutralityEngineSignatures'] === undefined) ot['neutralityEngineSignatures'] = [];
        if (ot['neutralityPatienceChargedThisTurn'] === undefined) ot['neutralityPatienceChargedThisTurn'] = 0;
        if (ot['neutralityPatienceConsumedThisTurn'] === undefined) ot['neutralityPatienceConsumedThisTurn'] = 0;
        if (ot['neutralityPatientLightStacks'] === undefined) ot['neutralityPatientLightStacks'] = 0;
        if (ot['neutralityEquilibriumSigils'] === undefined) ot['neutralityEquilibriumSigils'] = 0;
        if (ot['neutralityEquilibriumSigilsGainedThisTurn'] === undefined) ot['neutralityEquilibriumSigilsGainedThisTurn'] = 0;
        if (ot['neutralityEquilibriumPatientLightFromSigilsThisTurn'] === undefined) ot['neutralityEquilibriumPatientLightFromSigilsThisTurn'] = 0;
        if (ot['neutralityEquilibriumSigilCapBonus'] === undefined) ot['neutralityEquilibriumSigilCapBonus'] = 0;
        if (ot['neutralityEquilibriumSentinelTempoUsed'] === undefined) ot['neutralityEquilibriumSentinelTempoUsed'] = false;
        if (ot['neutralityTriggeredEffects'] === undefined) ot['neutralityTriggeredEffects'] = [];
        // One-time legacy import shim: old Fire pools are folded
        // into modern Inferno Tier (eternalStacks.pyro) and Chroma Ember
        // (secondaryCounters.pyro), then removed.
        const legacyPressure = Number(ot['pyroFurnacePressure'] ?? ot['pyroFervor'] ?? 0) || 0;
        const legacyFault = Number(ot['pyroAbyssFault'] ?? ot['pyroRupture'] ?? 0) || 0;
        const legacyWindows = Number(ot['pyroRuinWindows'] ?? 0) || 0;
        if (legacyPressure > 0 || legacyFault > 0 || legacyWindows > 0) {
          const stacks = (ot['eternalStacks'] ?? {}) as Record<string, number>;
          const secondary = (ot['secondaryCounters'] ?? {}) as Record<string, number>;
          stacks['pyro'] = (stacks['pyro'] ?? 0) + Math.max(0, legacyPressure + Math.floor(legacyFault / 2));
          secondary['pyro'] = (secondary['pyro'] ?? 0) + Math.max(0, legacyWindows + Math.floor(legacyFault / 2));
          ot['eternalStacks'] = stacks;
          ot['secondaryCounters'] = secondary;
        }
        delete ot['pyroFurnacePressure'];
        delete ot['pyroFurnaceRiseStreak'];
        delete ot['pyroFurnacePeak'];
        delete ot['pyroAbyssFault'];
        delete ot['pyroRuinWindows'];
        delete ot['pyroFervor'];
        delete ot['pyroRupture'];
        delete ot['lightCadenceNotes'];
        delete ot['lightDistinctNotes'];
        delete ot['lightResonance'];
        if (ot['thornScar'] === undefined) ot['thornScar'] = 0;
        if (ot['mechanicalInstructionQueue'] === undefined) ot['mechanicalInstructionQueue'] = [];
        if (ot['mechanicalResolvedInstructions'] === undefined) ot['mechanicalResolvedInstructions'] = 0;
        if (ot['mechanicalInstructionDiversity'] === undefined) ot['mechanicalInstructionDiversity'] = [];
        if (ot['mechanicalKernelLocked'] === undefined) ot['mechanicalKernelLocked'] = false;
        if (ot['mechanicalClockTicks'] === undefined) ot['mechanicalClockTicks'] = 0;
        if (ot['mechanicalNextChimeTick'] === undefined) ot['mechanicalNextChimeTick'] = 3;
        if (ot['mechanicalPrimedChimes'] === undefined) ot['mechanicalPrimedChimes'] = 0;
        if (ot['mechanicalChimeInterval'] === undefined) ot['mechanicalChimeInterval'] = 3;
        if (ot['mechanicalChimesFired'] === undefined) ot['mechanicalChimesFired'] = 0;
        if (ot['prismaticCurrentChannel'] === undefined) ot['prismaticCurrentChannel'] = null;
        if (ot['prismaticDistinctChannels'] === undefined) ot['prismaticDistinctChannels'] = [];
        if (ot['prismaticRecentChannels'] === undefined) ot['prismaticRecentChannels'] = [];
        if (ot['prismaticRefractionDepth'] === undefined) ot['prismaticRefractionDepth'] = 0;
        if (ot['prismaticNodeCharges'] === undefined) ot['prismaticNodeCharges'] = 0;
        if (ot['prismaticResonanceCharge'] === undefined) ot['prismaticResonanceCharge'] = 0;
        delete ot['prismaticChannelLocks'];
        delete ot['prismaticMemoryShards'];
        delete ot['prismaticStormMemories'];
        delete ot['prismaticStormMemoryEnabled'];
        delete ot['prismaticPendingSwitchDepthMark'];
        delete ot['prismaticSwitchMarkedCardIds'];
        delete ot['prismaticAccordChannel'];
        delete ot['prismaticDistinctNonAccordChannels'];
        delete ot['prismaticRefractionEchoes'];
        delete ot['prismaticEchoCascadeArmed'];
        delete ot['prismaticEchoCascadeDepthThreshold'];
        delete ot['prismaticEchoCascadeGainPerToken'];
        delete ot['prismaticEchoCascadeDrawRefund'];
        delete ot['prismaticChordTokens'];
        delete ot['prismaticChordPermanent'];
        delete ot['prismaticChordAttackBaseBonus'];
        delete ot['prismaticChordAttackChainBonus'];
        delete ot['prismaticRefractionSpikes'];
        delete ot['prismaticRefractionSpikeMax'];
        delete ot['prismaticRefractionSpikesPersistent'];
        delete ot['prismaticLastPlaySwitchedChannel'];
        delete ot['prismaticLatticeResonant'];
        delete ot['prismaticSentencedCardIds'];
        delete ot['prismaticSentencingPerfect'];
        delete ot['prismaticSentencingChainGainBonus'];
        delete ot['prismaticSentencingDraw'];
        delete ot['prismaticSentencingDrawPerfect'];
        delete ot['prismaticNextOphanimRefund'];
        delete ot['chainFloor'];
        delete ot['prismaticEchoCascadeFloorPerToken'];
        delete ot['prismaticSentencingChainFloorBonus'];
        if (ot['blackGlassWhiteFlame'] === undefined) ot['blackGlassWhiteFlame'] = 0;
        if (ot['blackGlassBlackFlame'] === undefined) ot['blackGlassBlackFlame'] = 0;
        if (ot['blackGlassFracture'] === undefined) ot['blackGlassFracture'] = 0;
        if (ot['blackGlassLastPolarity'] === undefined) ot['blackGlassLastPolarity'] = null;
        delete ot['blackGlassGriefOaths'];
        delete ot['blackGlassCollapsePending'];
        if (ot['blackGlassLastPayoff'] === undefined) ot['blackGlassLastPayoff'] = 0;
        if (ot['snowboundPhase'] === undefined) ot['snowboundPhase'] = null;
        delete ot['snowboundPotential'];
        delete ot['snowboundAlternations'];
        delete ot['snowboundConduits'];
        delete ot['snowboundPreviousPhase'];
        delete ot['snowboundAlternatedThisTurn'];
        delete ot['snowboundOnBoardEffects'];
        if (ot['glassProofFragments'] === undefined) ot['glassProofFragments'] = 0;
        if (ot['glassProofDepth'] === undefined) ot['glassProofDepth'] = 0;
        delete ot['glassProofCascade'];
        delete ot['glassAxioms'];
        delete ot['glassArchiveSeals'];
        delete ot['glassAngleCharges'];
        delete ot['glassOriginPulseUsed'];
        delete ot['glassAxiomFocus'];
        delete ot['glassSyntheticCascade'];
        delete ot['proof'];
        if (ot['burningGardenLaw'] === undefined) ot['burningGardenLaw'] = null;
        if (ot['burningGardenLineagesPlayed'] === undefined) ot['burningGardenLineagesPlayed'] = [];
        if (ot['burningGardenEchoesBloomed'] === undefined) ot['burningGardenEchoesBloomed'] = 0;
        if (ot['burningGardenNextFinalChordScaleBonus'] === undefined) ot['burningGardenNextFinalChordScaleBonus'] = 0;
        if (ot['burningGardenSunSigils'] === undefined) ot['burningGardenSunSigils'] = 0;
        if (ot['burningGardenCrownStacks'] === undefined) ot['burningGardenCrownStacks'] = 0;
        if (ot['burningGardenCodexLineage'] === undefined) ot['burningGardenCodexLineage'] = null;
        if (ot['burningGardenCodexCopiesRemaining'] === undefined) ot['burningGardenCodexCopiesRemaining'] = 0;
        if (ot['burningGardenTransitGateCredit'] === undefined) ot['burningGardenTransitGateCredit'] = 0;
        if (ot['burningGardenIncandescentSnapshot'] === undefined) ot['burningGardenIncandescentSnapshot'] = [];
        if (ot['burningGardenWorldflowerGrowth'] === undefined) ot['burningGardenWorldflowerGrowth'] = 0;
        if (ot['burningGardenArrayFreeEchoes'] === undefined) ot['burningGardenArrayFreeEchoes'] = 0;
        if (ot['burningGardenGeometryMode'] === undefined) ot['burningGardenGeometryMode'] = false;
        if (ot['burningGardenZenithNextInfinite'] === undefined) ot['burningGardenZenithNextInfinite'] = false;
        if (ot['burningGardenSkyLaw'] === undefined) ot['burningGardenSkyLaw'] = null;
        if (ot['lastPlayedElement'] !== undefined) delete ot['lastPlayedElement'];
        delete ot['eternalSeasCurrent'];
        delete ot['eternalSeasPolarity'];
        delete ot['eternalSeasWhiteFlow'];
        delete ot['eternalSeasBlackFlow'];
        delete ot['eternalSeasMarginCharge'];

        // Migrate savedDecks
        loaded.deck.deckList = cloneDeckList(loaded.deck.deckList as DeckEntry[]);
        loaded.deck.extraDeck = cloneExtraDeck(loaded.deck.extraDeck as Array<ExtraDeckEntry | string>);
        loaded.deck.drawPile = cloneDeckCards(loaded.deck.drawPile);
        loaded.deck.hand = cloneDeckCards(loaded.deck.hand);
        loaded.deck.discardPile = cloneDeckCards(loaded.deck.discardPile);
        loaded.deck = normalizeDeckInstanceIds(loaded.deck);

        for (const d of loaded.progress.savedDecks) {
          if ('angelId' in d) delete (d as Record<string, unknown>)['angelId'];
          d.deckList = cloneDeckList(d.deckList as DeckEntry[]);
          d.extraDeck = d.extraDeck ? cloneExtraDeck(d.extraDeck as Array<ExtraDeckEntry | string>) : cloneExtraDeck(STARTER_EXTRA_DECK);
        }
        if (!loaded.deck.extraDeck) loaded.deck.extraDeck = cloneExtraDeck(STARTER_EXTRA_DECK);

        // Remove legacy root fields
        delete (loaded as unknown as Record<string, unknown>)['lastTickAt'];

        // v4 migration: reset deck if any main-deck card no longer exists in registry
        if ((loaded.version ?? 0) < 4) {
          const deckValid = loaded.deck.deckList.every(e => CardRegistry.get(e.definitionId) !== undefined);
          if (!deckValid) {
            loaded.deck.deckList = [...STARTER_DECK_LIST];
            loaded.deck.extraDeck = cloneExtraDeck(STARTER_EXTRA_DECK);
            loaded.deck.drawPile = DeckSystem.buildFromList(STARTER_DECK_LIST);
            loaded.deck.hand = [];
            loaded.deck.discardPile = [];
          }
          // Filter collection to only cards that exist in registry
          const cleanedCollection: Record<string, number> = {};
          for (const [id, count] of Object.entries(loaded.progress.collection)) {
            if (CardRegistry.get(id)) cleanedCollection[id] = count;
          }
          // Merge starter collection so player always has starter cards
          for (const [id, count] of Object.entries(STARTER_COLLECTION)) {
            cleanedCollection[id] = Math.max(cleanedCollection[id] ?? 0, count);
          }
          loaded.progress.collection = cleanedCollection;
          // Reset savedDecks that contain invalid cards
          loaded.progress.savedDecks = loaded.progress.savedDecks.filter(d =>
            d.isStarter || d.deckList.every(e => CardRegistry.get(e.definitionId))
          );
          if (!loaded.progress.savedDecks.some(d => d.isStarter)) {
            loaded.progress.savedDecks.unshift({
              id: 'starter-neutrality', name: 'Neutrality Standard',
              deckList: STARTER_DECK_LIST, extraDeck: STARTER_EXTRA_DECK, isStarter: true,
            });
          }
          loaded.version = 4;
        }

        if ((loaded.version ?? 0) < 5) {
          for (const slot of loaded.board.frontSlots) {
            if (slot?.type === 'Angel') {
              const angel = slot as AngelInstance & Record<string, unknown>;
              if (angel['cardsPlayedSinceSummon'] === undefined) angel['cardsPlayedSinceSummon'] = 0;
              if (angel['activated'] === undefined) angel['activated'] = false;
              if (angel['attackCooldowns'] === undefined) angel['attackCooldowns'] = {};
            }
            if (slot?.type === 'Seraphim') {
              const seraphim = slot as SeraphimInstance & Record<string, unknown>;
              if (seraphim['attackCooldowns'] === undefined) seraphim['attackCooldowns'] = {};
            }
          }
          loaded.version = 5;
        }

        if ((loaded.version ?? 0) < 6) {
          for (const eternalBoss of BOSS_DEFINITIONS) {
            const ownedCopies = loaded.progress.collection[eternalBoss.rewardCardId] ?? 0;
            if (ownedCopies > 0) {
              loaded.progress.holoCollection[eternalBoss.rewardCardId] = Math.max(
                loaded.progress.holoCollection[eternalBoss.rewardCardId] ?? 0,
                ownedCopies,
              );
            }
          }
          loaded.version = 6;
        }

        for (const slot of loaded.board.frontSlots) {
          if (slot?.type === 'Angel') {
            const angel = slot as AngelInstance & Record<string, unknown>;
            if (angel['cardsPlayedSinceSummon'] === undefined || Number.isNaN(Number(angel['cardsPlayedSinceSummon']))) {
              angel['cardsPlayedSinceSummon'] = 0;
            }
            if (angel['activated'] !== true) {
              angel['activated'] = false;
            }
            if (angel['attackCooldowns'] === undefined || typeof angel['attackCooldowns'] !== 'object') {
              angel['attackCooldowns'] = {};
            }
          }
          if (slot?.type === 'Seraphim') {
            const seraphim = slot as SeraphimInstance & Record<string, unknown>;
            if (seraphim['attackCooldowns'] === undefined || typeof seraphim['attackCooldowns'] !== 'object') {
              seraphim['attackCooldowns'] = {};
            }
          }
        }

        const cleanedFavorites: Record<string, boolean> = {};
        for (const [favoriteKey, isFavorited] of Object.entries(loaded.progress.favoriteCollection ?? {})) {
          if (!isFavorited) continue;
          const [definitionId, finishPart] = favoriteKey.split('::');
          if (!definitionId || (finishPart !== 'normal' && finishPart !== 'holo')) continue;
          const definition = CardRegistry.get(definitionId);
          if (!definition) continue;

          const totalOwned = getEverCollectionCount(loaded.progress, definitionId);
          const holoOwned = Math.min(getEverHoloCount(loaded.progress, definitionId), totalOwned);
          const normalOwned = Math.max(0, totalOwned - holoOwned);
          const ownedForFinish = finishPart === 'holo' ? holoOwned : normalOwned;
          if (ownedForFinish <= 0) continue;

          cleanedFavorites[favoriteKey] = true;
        }
        loaded.progress.favoriteCollection = cleanedFavorites;

        for (const themeId of loaded.progress.profile.unlockedUiThemeIds ?? []) {
          const seed = getRewardThemeSeed(themeId);
          if (!seed) continue;
          for (const definitionId of seed.ids) {
            seedEverOwned(loaded.progress, definitionId, seed.source);
          }
        }
        ensureOwnershipHistory(loaded.progress);

        // Migrate bossFight: never resume in-progress/result states from persisted data.
        // This prevents stale local/cloud snapshots from dropping the player back into
        // an old Eternal Wake encounter when opening menus/profile or after rehydrate.
        if (!loaded.bossFight) {
          (loaded as unknown as Record<string, unknown>)['bossFight'] = { ...defaultBossFight };
        } else {
          const loadedCooldowns =
            loaded.bossFight.cooldowns && typeof loaded.bossFight.cooldowns === 'object'
              ? { ...loaded.bossFight.cooldowns }
              : { ...defaultBossFight.cooldowns };

          if (loaded.bossFight.mode !== 'idle') {
            loaded.bossFight = { ...defaultBossFight, cooldowns: loadedCooldowns };
          }
        }

        // Migrate battleground: always reset to idle on load (never resume mid-match).
        (loaded as unknown as Record<string, unknown>)['battleground'] = { ...defaultBattleground };

        // Migrate trialDeck: always reset to idle on load (no in-progress trials survive restarts).
        (loaded as unknown as Record<string, unknown>)['trialDeck'] = { ...defaultTrialDeckState };

        // Strip orphaned saved card ids so deleted definitions cannot surface as
        // "Card data unavailable" placeholders in collection or Ascension views.
        sanitizeLoadedCardReferences(loaded);

        Object.assign(s, loaded);
        setUiPreferences(s.settings);
        recompute(s);
      });
    },

    resetToDefault: () => {
      set(() => {
        const nextState = { ...defaultGameState, startedAt: Date.now(), lastSavedAt: Date.now() };
        setUiPreferences(nextState.settings);
        return nextState;
      });
    },
  }))
);

// �E��E��E��E� Selectors �E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E�

export const selectComputedStats = (s: Store): ComputedBoardStats => s.computedStats;
export const selectOblivion = (s: Store): number => s.progress.oblivion;
export const selectBoard = (s: Store): BoardState => s.board;
export const selectDeck = (s: Store): DeckState => s.deck;
export const selectTurn = (s: Store): TurnState => s.turn;
export const selectSettings = (s: Store): SettingsState => s.settings;
export const selectHand = (s: Store): DeckCard[] => s.deck.hand;
export const selectPhase = (s: Store): TurnState['phase'] => s.turn.phase;
export const selectExtraDeck = (s: Store): ExtraDeckEntry[] => s.deck.extraDeck;
export const selectBossFight = (s: Store): BossFightState => s.bossFight;
export const selectBattleground = (s: Store): BattlegroundState => s.battleground;
export const selectTrialDeck = (s: Store): TrialDeckState => s.trialDeck;
export const selectProgress = (s: Store): ProgressState => s.progress;
export const selectProfile = (s: Store) => s.progress.profile;
export const selectDailyLogin = (s: Store) => s.progress.dailyLogin;
export const selectQuests = (s: Store) => s.progress.quests;
export const selectAchievementClaims = (s: Store) => s.progress.achievementClaims;
export const selectCardPlayCounts = (s: Store) => s.progress.cardPlayCounts;
export const selectCanEmbraceInfinite = (s: Store): boolean => canEmbraceInfinite(s);
export const selectRadiance = (s: Store): number => s.turn.radiance;











