import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { cloneState } from '@/utils/stateClone';
import type {
  BoardState, ComputedBoardStats, DeckCard, DeckEntry,
  DeckState, EnigmaInstance, ExtraDeckEntry, GameState, PendingEffect, ProgressState, SavedDeck, SettingsState, TurnState, TrialDeckState,
} from '@/types/game';
import { DEFAULT_CONTROL_BINDINGS } from '@/types/game';
import type {
  CardDefinition,
  AinSophAurInstance,
  CardFinish,
  CardFaceState,
  DarkCardDefinition,
  MainDeckBoardInstance,
} from '@/types/cards';
import type { CardEffect, CardSubtypeFilter } from '@/types/effects';
import type { BossFightState, SavedGameState } from '@/types/bossFight';
import type { BattlegroundState, BattlegroundKind, BattlegroundOpponentProfile, BattlegroundSavedGameState, CpuDifficulty } from '@/types/battleground';
import { CardRegistry } from '@/cards/CardRegistry';
import { ScoreSystem } from '@/systems/scoring/ScoreSystem';
import { DeckSystem } from '@/systems/cards/DeckSystem';
import { accrueSophCharges } from '@/systems/cards/AinSophRuntime';
import { resolveCardScaling } from '@/systems/cards/CardScaling';
import { TurnSystem } from '@/systems/cards/TurnSystem';
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
  getScaledQuestOblivion,
  refreshQuestRotation,
  type QuestKind,
} from '@/systems/progression/quests';
import {
  ensureEnigmaState,
  ensureInstance,
  ensureNeutralMysteryInstance,
  evaluateEnigmaAcquisition,
  evaluateNeutralMysteryProgress,
  awardEnigmaReward,
} from '@/systems/progression/EnigmaSystem';
import { getEnigmaDefinition } from '@/data/enigmas/enigmaDefinitions';
import { getSet, resolveActiveAbilitiesForDeck } from '@/systems/sets/SetEngine';
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
  getMasteryClaimKey,
} from '@/systems/progression/cardMastery';
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

// �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E� Defaults �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E�

const NOW = Date.now();
let angelInstanceCounter = 0;

const defaultBoard: BoardState = {
  frontSlots: [null, null, null, null],
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
  limitlessLightStacks: 0,
  oblivionEarnedThisTurn: 0,
  lastPlayedDefinitionId: null,
  turnNumber: 0,
  mulliganSelected: [],
  pendingEffect: null,
  pendingEffectQueue: [],
  lastResolvedSubtype: null,
  cherubimSummonedThisTurn: 0,
  lastFiredSeraphimAttackMode: null,
  lastFiredSeraphimAttackOblivion: 0,
  equippedArtifactIds: [],
  setAbilityCooldowns: {},
  setAbilityUsesRemaining: {},
};

function queuePendingEffects(
  turn: TurnState,
  result: { pendingEffect: PendingEffect | null; pendingEffects?: PendingEffect[] },
): void {
  const pendingEffects = result.pendingEffects ?? (result.pendingEffect ? [result.pendingEffect] : []);
  if (pendingEffects.length === 0) return;

  const queue = turn.pendingEffectQueue ?? [];
  if (turn.pendingEffect === null) {
    turn.pendingEffect = pendingEffects[0];
    queue.push(...pendingEffects.slice(1));
  } else {
    queue.push(...pendingEffects);
  }
  turn.pendingEffectQueue = queue;
}

function resolveStackCost(cost: { kind: 'fixed' | 'percentage' | 'range'; value?: number; min?: number; max?: number }, stacks: number): number {
  if (cost.kind === 'percentage') return Math.ceil(stacks * ((cost.value ?? 0) / 100));
  if (cost.kind === 'range') return Math.max(0, cost.min ?? 0);
  return Math.max(0, cost.value ?? 0);
}

function enforceHandCap(s: Store): void {
  const overflow = s.deck.hand.length - 8;
  if (overflow <= 0) return;
  const pending: PendingEffect = { type: 'discard_choice', count: overflow, sourceCard: 'hand_overflow' };
  if (s.turn.pendingEffect === null) s.turn.pendingEffect = pending;
  else s.turn.pendingEffectQueue = [...(s.turn.pendingEffectQueue ?? []), pending];
}

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
  recentlyAcquired: {},
  lastCollectionViewedAt: 0,
  packOpenHistory: [],
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

// �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E� Store type �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E�

interface StoreActions {
  summonAinSophAur: (definitionId: string, materialInstanceIds: string[], targetSlot: 0 | 1 | 2 | 3) => void;
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
  playCard: (instanceId: string, mode?: 'place' | 'cast') => void;
  flipSoph: (instanceId: string, mode: 'flip' | 'sacrifice') => void;
  activateLightAinAttack: (instanceId: string) => void;
  activateLightSophAttack: (instanceId: string, spend?: number) => void;
  activateDark: (instanceId: string) => void;
  activateAsaBridge: (instanceId: string, spend?: number) => void;
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
    kind?: 'normal';
    coopPartySize?: number;
    fightCount?: number;
    coopSessionId?: string;
    coopRole?: 'host' | 'guest';
  }) => void;
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
  sacrificeShardsForEnigma: (enigmaId: string, amount: number) => boolean;
  claimEnigmaReward: (enigmaId: string) => boolean;
  /** Engagement: claim a single quest. */
  claimQuest: (questId: string) => { shards: number; oblivion?: number } | null;
  /** Engagement: claim an unlocked achievement (one-shot). */
  claimAchievement: (achievementId: string) => { shards: number; oblivion?: number } | null;
  /** Engagement: claim a reached card-mastery tier (one-shot per tier). */
  claimCardMastery: (definitionId: string, tier: number) => { shards: number } | null;
  /** Quick-claim all currently available mastery tiers. Returns aggregate shard reward & tiers claimed. */
  claimAllAvailableMastery: () => { shards: number; tiersClaimed: number };
  /** Mark the collection viewer as seen  Eclears NEW badges. */
  markCollectionViewed: () => void;
  /** Update Endless Gauntlet personal bests after a run. */
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
  /** Update a saved deck's per-slot set-ability loadout. */
  setDeckAbilityLoadout: (deckId: string, slot: 1 | 2 | 3, abilityId: string) => void;
  /** Activate a set ability by hotkey slot (1 E). No-op if gated, on cooldown, or uses exhausted. */
  activateSetAbility: (slot: 1 | 2 | 3) => void;
  /** Enqueue a transient toast notification. */
  enqueueToast: (message: string, kind?: 'info' | 'success' | 'warning' | 'reward', durationMs?: number) => void;
  /** Dismiss a toast notification by id. */
  dismissToast: (id: string) => void;
  // ── Battleground of the Card-born ────────────────────────────────────────────
  /** Enter lobby phase. Saves the current idle game state. */
  enterBattleground: (kind: BattlegroundKind, cpuDifficulty?: CpuDifficulty, opponentProfile?: BattlegroundOpponentProfile) => void;
  /** Tick the countdown timer. Called by centralized app-level timer loops. */
  tickBattlegroundTimer: (deltaSeconds: number) => void;
  /** Complete the match  Ecomputes result, grants rewards, restores saved state. */
  completeBattleground: () => void;
  /** Update opponent's live board + score (PvP realtime sync). */
  updateOpponentBattleground: (board: BoardState | null, score: number, handSize?: number) => void;
  /** Return to main menu from finished state (clears battleground slice). */
  dismissBattleground: () => void;
  computedStats: ComputedBoardStats;
  refreshComputedStats: () => void;
}

type Store = GameState & StoreActions;

/**
 * Tune this constant so a complete, fully-mastered collection reaches
 * approximately ÁE0 E0 total globalOblivionMult from resonance alone.
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

function recompute(state: Store): void {
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
    .filter(def => def.type === 'AinSophAur')
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
  const mainPool = pool.filter(def => def.type !== 'AinSophAur');
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
    def.type === 'Light' ? 'play_light'
    : def.type === 'Dark' ? 'play_dark'
    : null;
  if (typeKind) {
    emitQuestProgressToProgress(s.progress, { kind: typeKind, amount: 1 });
  }
}

// �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E� Boss fight helpers �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E�

// Merges enigma step flips made mid-run (e.g. a board pattern only assemblable inside a
// fight) back into progress after a saved-state restore wipes s.progress.enigmas.
function mergeFightEnigmaProgress(
  target: ProgressState,
  snapshot: Record<string, EnigmaInstance>,
  onStepFlipped: (id: string, stepIndex: number) => void,
): void {
  ensureEnigmaState(target);
  for (const [id, snapInstance] of Object.entries(snapshot)) {
    const restored = target.enigmas.instances[id];
    if (!restored) {
      target.enigmas.instances[id] = cloneState(snapInstance);
      continue;
    }
    for (let i = 0; i < snapInstance.stepsComplete.length; i += 1) {
      if (snapInstance.stepsComplete[i] && !restored.stepsComplete[i]) {
        restored.stepsComplete[i] = true;
        onStepFlipped(id, i);
      }
    }
    restored.currentStepIndex = Math.max(restored.currentStepIndex, snapInstance.currentStepIndex);
    if (!restored.acquiredAt && snapInstance.acquiredAt) restored.acquiredAt = snapInstance.acquiredAt;
    if (restored.status === 'locked' && snapInstance.status !== 'locked') restored.status = snapInstance.status;
  }
}

function completeBossFight(s: Store, victory: boolean): void {
  const bossId = s.bossFight.activeBossId;
  if (bossId) eventBus.emit('boss:defeated', { bossId, victory });
  const newCooldowns = { ...s.bossFight.cooldowns };
  if (bossId && s.bossFight.kind !== 'null_raid') newCooldowns[bossId] = Date.now() + 60_000;

  const kind = s.bossFight.kind ?? 'normal';
  const damageFirstMinute = s.bossFight.damageDealtFirstMinute ?? 0;
  const saved = s.bossFight.savedGameState;
  let rewardSummary: BossFightState['rewardSummary'] = null;

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
        s.board = { frontSlots: [null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] };
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

    // Raid ended (defeat or final boss cleared)  Erestore saved game state.
    if (saved) {
      ensureEnigmaState(s.progress);
      const raidEnigmaSnapshot = cloneState(s.progress.enigmas.instances);
      s.deck = saved.deck;
      s.board = saved.board;
      s.turn = saved.turn;
      s.progress = saved.progress;
      s.settings = saved.settings;
      mergeFightEnigmaProgress(s.progress, raidEnigmaSnapshot, (id, i) => {
        const inst = s.progress.enigmas.instances[id];
        if (inst && i < inst.stepsComplete.length - 1) pushEnigmaStepToast(s, id, i);
      });
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
      emitQuestProgressToProgress(s.progress, { kind: 'clear_null_raid', amount: 1 });
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
  const fightTimeRemaining = s.bossFight.fightTimeRemaining;
  const capturedFightCount = Math.max(1, Math.min(3, s.bossFight.fightCount ?? 1));
  const fightDamageTotal = s.bossFight.damageDealtThisFight;
  // Capture the deck in use for mastery awards before state is restored.
  const fightDeckList = s.deck.deckList;
  const fightExtraDeck = s.deck.extraDeck;
  ensureEnigmaState(s.progress);
  const fightEnigmaSnapshot = cloneState(s.progress.enigmas.instances);

  if (saved) {
    s.deck = saved.deck;
    s.board = saved.board;
    s.turn = saved.turn;
    s.progress = saved.progress;
    s.settings = saved.settings;
  }

  mergeFightEnigmaProgress(s.progress, fightEnigmaSnapshot, (id, i) => {
    const inst = s.progress.enigmas.instances[id];
    if (inst && i < inst.stepsComplete.length - 1) pushEnigmaStepToast(s, id, i);
  });

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
      // Award card mastery for every card in the fight deck.
      const bossIdx = Math.max(0, BOSS_DEFINITIONS.findIndex(b => b.id === boss.id));
      const baseMasteryPerCard = getBossFightMasteryPerCard(
        bossIdx,
        BOSS_DEFINITIONS.length,
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

      // Neutralizing the Void  Eboss-victory enigma hooks.
      if (bossId === 'boss-eternal-null') {
        ensureEnigmaState(s.progress);
        const ntvInstance = s.progress.enigmas.instances['neutralizing-the-void'];
        if (!ntvInstance) {
          // Step 0: unlock if won with ≥90s remaining.
          if (fightTimeRemaining >= 90) {
            const fresh = ensureInstance(s.progress, 'neutralizing-the-void');
            if (fresh) {
              fresh.status = 'acquired';
              fresh.currentStepIndex = 1;
              fresh.stepsComplete[0] = true;
              if (!s.progress.enigmas.activeEnigmaId) s.progress.enigmas.activeEnigmaId = 'neutralizing-the-void';
              pushRewardToast(s, 'Enigma Acquired: Neutralizing the Void');
            }
          }
        } else if (ntvInstance.status === 'acquired' && !ntvInstance.stepsComplete[1]) {
          // Step 1: clear ÁE-HP scaled variant.
          if (capturedFightCount >= 3) {
            ntvInstance.stepsComplete[1] = true;
            ntvInstance.currentStepIndex = Math.max(ntvInstance.currentStepIndex, 2);
            pushEnigmaStepToast(s, 'neutralizing-the-void', 1);
          }
        }
      }
    }
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
    coopPartySize,
    fightCount,
    coopSessionId,
    coopRole,
    rewardSummary,
  };
  recompute(s);
}

function grantOblivion(s: Store, amount: number): void {
  if (amount <= 0) return;
  // Every Oblivion source, including sacrifice rewards and card effects, scales
  // from the player's current Collection Power before downstream rewards resolve.
  const collectionPower = computeGlobalResonanceScore(s.progress);
  const collectionPowerMultiplier = Math.min(3, 1 + Math.max(0, collectionPower) / 1_000);
  amount = Math.floor(amount * collectionPowerMultiplier);
  if (amount <= 0) return;
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

// Checks step 3 of Neutralizing the Void (card-born Tier ≥4); safe to call multiple times.
function checkNtvMasteryTierStep(progress: ProgressState): void {
  const instance = progress.enigmas?.instances['neutralizing-the-void'];
  if (!instance || instance.stepsComplete[3] || !instance.stepsComplete[2]) return;
  const claims = progress.cardMasteryClaims as Record<string, unknown> | undefined;
  if (!claims) return;
  const hasRequiredTier = Object.keys(claims).some(key => {
    if (!key.startsWith('btei-')) return false;
    const tierStr = key.split('::')[1];
    return tierStr !== undefined && parseInt(tierStr, 10) >= 4;
  });
  if (hasRequiredTier) {
    instance.stepsComplete[3] = true;
    instance.currentStepIndex = Math.max(instance.currentStepIndex, 4);
  }
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
  if (def.type === 'Dark') return def.sophEffects.some(effect => effectCanDraw(effect));
  if (def.type === 'Light') return (def.onFlipEffects ?? []).some(effect => effectCanDraw(effect));
  return false;
}

function recordLossEvent(
  _s: Store,
  _lostCards: Array<{ definitionId: string }>,
  _source: 'discard' | 'board' | 'sacrifice' | 'expire',
): void {
  // All dead-set loss tracking removed
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
  s.board.activeBoardEffects = [];
  for (const slot of [...s.board.frontSlots, ...s.board.backSlots]) {
    if (!slot) continue;
    (slot as any).limitlessCharge = 0;
    (slot as any).side = 'soph';
  }
  s.turn.limitlessLightStacks = 0;
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

function enforceAngelExtraDeckInvariant(deck: DeckState, options: { refillHand?: boolean } = {}): void {
  // Angels belong exclusively to extraDeck. If they leak into main-deck zones,
  // move them out immediately and optionally refill vacated hand slots.
  const isAngelCard = (card: DeckCard | null | undefined): boolean => {
    if (!card || typeof card.definitionId !== 'string' || card.definitionId.length === 0) return false;
    return CardRegistry.get(card.definitionId)?.type === 'AinSophAur';
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

function reduceFrontlineAttackCooldowns(board: BoardState, amount: number): void {
  if (amount <= 0) return;
  for (const slot of board.frontSlots) {
    if (!slot) continue;
    const nextCooldowns: Record<string, number> = {};
    for (const [id, value] of Object.entries(slot.attackCooldowns ?? {})) {
      nextCooldowns[id] = Math.max(0, value - amount);
    }
    slot.attackCooldowns = nextCooldowns;
  }
}

void reduceFrontlineAttackCooldowns;

// �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E� Cherubim helpers �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E�

/**
 * Decrements all active set-ability cooldowns by 1. Must be called once for
/**
 * Decrements all active set-ability cooldowns by 1. Must be called once for
 * every card played from hand (at the same sites as tickCherubimDurability).
 */
function tickHandPlayCooldowns(s: Store): void {
  const cd = s.turn.setAbilityCooldowns;
  if (cd) {
    for (const key of Object.keys(cd)) {
      if ((cd[key] ?? 0) > 0) {
        cd[key] -= 1;
      }
    }
  }

  accrueSophCharges(s.board.backSlots);
  for (const slot of [...s.board.frontSlots, ...s.board.backSlots]) {
    if (!slot || !('attackCooldowns' in slot)) continue;
    for (const key of Object.keys(slot.attackCooldowns)) {
      if (slot.attackCooldowns[key] > 0) slot.attackCooldowns[key] -= 1;
    }
  }
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

    summonAinSophAur: (definitionId, materialInstanceIds, targetSlot) => {
      set(s => {
        if (s.turn.phase !== 'playing' || s.board.frontSlots[targetSlot] !== null) return;
        const def = CardRegistry.get(definitionId);
        if (!def || def.type !== 'AinSophAur') return;
        const uniqueIds = [...new Set(materialInstanceIds)];
        const materials = uniqueIds.map(id => s.board.backSlots.find(slot => slot?.instanceId === id));
        const requiredMaterials = Math.max(1, def.summonCost.length);
        if (uniqueIds.length !== requiredMaterials || materials.some(material => !material)) return;

        for (const material of materials) {
          if (!material) return;
          recordLossEvent(s, [{ definitionId: material.definitionId }], 'board');
          s.deck.discardPile.push(toDeckCard(material));
        }
        for (const id of uniqueIds) {
          const index = s.board.backSlots.findIndex(slot => slot?.instanceId === id);
          if (index !== -1) s.board.backSlots[index] = null;
        }

        const extraIndex = s.deck.extraDeck.findIndex(entry => entry.definitionId === definitionId);
        const finish = extraIndex === -1 ? 'normal' : s.deck.extraDeck[extraIndex].finish;
        if (extraIndex !== -1) s.deck.extraDeck.splice(extraIndex, 1);
        const instance: AinSophAurInstance = {
          instanceId: `asa_${definitionId}_${++angelInstanceCounter}`,
          definitionId,
          type: 'AinSophAur',
          rarity: def.rarity,
          finish,
          faceState: 'front',
          side: 'ain',
          cardClass: 'ain-soph-aur',
          limitlessCharge: 0,
          attackCooldowns: {},
          boardSlot: targetSlot,
        };
        s.board.frontSlots[targetSlot] = instance;
        if (def.onSummonEffects.length > 0) {
          const result = CardEffectExecutor.execute(toDeckCard(instance), s.turn, s.board, s.deck, false, {
            effects: def.onSummonEffects,
            countAsPlay: false,
            removeFromHand: false,
          });
          if (!result.canPlay) return;
          s.turn = result.turn;
          s.board = result.board;
          s.deck = result.deck;
          queuePendingEffects(s.turn, result);
        }
        emitQuestProgressToProgress(s.progress, { kind: 'summon_ain_soph_aur', amount: 1 });
        recompute(s);
      });
    },


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

    // �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E� Turn flow �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E�

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
              // Card not in draw pile  Ecreate a fresh instance
              const { nextDeckId: _nextId } = (() => {
                // We can't call nextDeckId() here; use a deterministic id
                return { nextDeckId: () => `trial-guided-hand-${defId}-${Date.now()}` };
              })();
              hand.push({ instanceId: _nextId(), definitionId: defId, finish: 'normal' });
            }
          }
          for (const card of hand) s.deck.hand.push(card);
          // Skip mulligan in guided mode  Ego straight to playing
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
          s.turn.pendingEffectQueue = [];
          endTurnInternal(s);
          return;
        }

        s.turn.pendingEffect = {
          type: 'embrace_infinite',
          cards: drawCapableCards,
          allCards: handSnapshot,
          keep: 1,
        };
        s.turn.pendingEffectQueue = [];
      });
    },
    playCard: (instanceId, mode = 'place') => {
      set(s => {
        if (s.turn.phase !== 'playing') return;
        const deckCard = s.deck.hand.find(c => c.instanceId === instanceId);
        if (!deckCard) return;
        const def = ScoreSystem.getDefinition(deckCard.definitionId);
        if (!def) return;

        if (def.type === 'Light' || def.type === 'Dark') {
          if (def.type === 'Dark' && mode === 'cast') {
            const darkDef = def as DarkCardDefinition;
            if (!darkDef.allowHandCast) return;
            const cost = resolveStackCost(darkDef.activationCost, s.turn.limitlessLightStacks);
            if (s.turn.limitlessLightStacks < cost) return;
            s.turn.limitlessLightStacks -= cost;
            s.deck.hand = s.deck.hand.filter(card => card.instanceId !== deckCard.instanceId);
            const result = CardEffectExecutor.execute(
              deckCard,
              s.turn,
              s.board,
              s.deck,
              false,
              { effects: darkDef.sophEffects, countAsPlay: true, removeFromHand: false },
            );
            if (!result.canPlay) return;
            s.turn = result.turn;
            s.board = result.board;
            s.deck = result.deck;
            queuePendingEffects(s.turn, result);
            s.turn.cardsPlayedThisTurn += 1;
            tickHandPlayCooldowns(s);
            recordCardPlay(s, deckCard.definitionId);
            advanceTrialGuideStep(s, deckCard.definitionId);
            enforceHandCap(s);
            recompute(s);
            return;
          }

          const emptyBack = s.board.backSlots.findIndex(slot => slot === null);
          if (emptyBack === -1) return;
          const boardCard: MainDeckBoardInstance = {
            instanceId: deckCard.instanceId,
            definitionId: deckCard.definitionId,
            type: def.type,
            rarity: def.rarity,
            finish: deckCard.finish,
            side: 'soph',
            faceState: 'back',
            limitlessCharge: 0,
            attackCooldowns: {},
            backSlot: emptyBack as 0 | 1 | 2 | 3,
          };
          s.board.backSlots[emptyBack] = boardCard;
          s.deck.hand = s.deck.hand.filter(card => card.instanceId !== deckCard.instanceId);
          s.turn.cardsPlayedThisTurn += 1;
          tickHandPlayCooldowns(s);
          recordCardPlay(s, deckCard.definitionId);
          advanceTrialGuideStep(s, deckCard.definitionId);
          recompute(s);
          return;
        }
      });
    },

    flipSoph: (instanceId, mode) => {
      set(s => {
        if (s.turn.phase !== 'playing') return;
        const slotIndex = s.board.backSlots.findIndex(slot => slot?.instanceId === instanceId);
        if (slotIndex === -1) return;
        const slot = s.board.backSlots[slotIndex];
        if (!slot || slot.side !== 'soph' || slot.faceState !== 'back') return;
        const charge = slot.limitlessCharge ?? 0;
        if (charge < 5) return;
        if (mode === 'flip') {
          slot.side = 'ain';
          slot.faceState = 'front';
          slot.limitlessCharge = 0;
          s.turn.limitlessLightStacks += charge;
          emitQuestProgressToProgress(s.progress, { kind: 'flip_soph', amount: 1 });
          recompute(s);
          return;
        }

        const def = CardRegistry.get(slot.definitionId);
        if (!def || (def.type !== 'Light' && def.type !== 'Dark')) return;
        grantOblivion(s, Math.round(charge * def.sacrificeOblivionRate));
        recordLossEvent(s, [{ definitionId: slot.definitionId }], 'board');
        s.deck.discardPile.push(toDeckCard(slot));
        s.board.backSlots[slotIndex] = null;
        recompute(s);
      });
    },

    activateLightAinAttack: (instanceId) => {
      set(s => {
        const slot = s.board.backSlots.find(card => card?.instanceId === instanceId);
        if (!slot || slot.type !== 'Light' || slot.side !== 'ain' || slot.faceState !== 'front') return;
        const def = CardRegistry.get(slot.definitionId);
        if (!def || def.type !== 'Light') return;
        const attack = def.ainAttack;
        if ((slot.attackCooldowns[attack.id] ?? 0) > 0) return;
        const scaling = resolveCardScaling(attack.scaling, {
          limitlessLightStacks: s.turn.limitlessLightStacks,
          asaFrontCount: s.board.frontSlots.filter(card => card?.type === 'AinSophAur').length,
          collectionPower: computeGlobalResonanceScore(s.progress),
        });
        grantOblivion(s, Math.max(0, Math.round(attack.baseOblivion + scaling)));
        emitQuestProgressToProgress(s.progress, { kind: 'activate_ain_attack', amount: 1 });
        slot.attackCooldowns[attack.id] = attack.cooldownCards;
      });
    },

    activateLightSophAttack: (instanceId, spend) => {
      set(s => {
        const slot = s.board.backSlots.find(card => card?.instanceId === instanceId);
        if (!slot || slot.type !== 'Light' || slot.side !== 'ain' || slot.faceState !== 'front') return;
        const def = CardRegistry.get(slot.definitionId);
        if (!def || def.type !== 'Light') return;
        const attack = def.sophAttack;
        if ((slot.attackCooldowns[attack.id] ?? 0) > 0) return;
        const cost = attack.stackCost ? resolveStackCost(attack.stackCost, s.turn.limitlessLightStacks) : 0;
        const selectedSpend = spend ?? cost;
        if (selectedSpend < cost || selectedSpend > s.turn.limitlessLightStacks) return;
        // Scaling reads the pre-spend pool so paying the cost never shrinks the payout.
        const stacksBeforeSpend = s.turn.limitlessLightStacks;
        s.turn.limitlessLightStacks -= selectedSpend;
        const scaling = resolveCardScaling(attack.scaling, {
          limitlessLightStacks: stacksBeforeSpend,
          asaFrontCount: s.board.frontSlots.filter(card => card?.type === 'AinSophAur').length,
          collectionPower: computeGlobalResonanceScore(s.progress),
        });
        grantOblivion(s, Math.max(0, Math.round(attack.baseOblivion + scaling + selectedSpend)));
        emitQuestProgressToProgress(s.progress, { kind: 'activate_soph_attack', amount: 1 });
        emitQuestProgressToProgress(s.progress, { kind: 'spend_light_stacks', amount: selectedSpend });
        slot.attackCooldowns[attack.id] = attack.cooldownCards;
      });
    },

    activateDark: (instanceId) => {
      set(s => {
        const slotIndex = s.board.backSlots.findIndex(card => card?.instanceId === instanceId);
        if (slotIndex === -1) return;
        const slot = s.board.backSlots[slotIndex];
        if (!slot || slot.type !== 'Dark' || slot.side !== 'ain' || slot.faceState !== 'front') return;
        const def = CardRegistry.get(slot.definitionId);
        if (!def || def.type !== 'Dark') return;
        const darkSlot = slot as MainDeckBoardInstance;
        const cooldownKey = `${def.definitionId}:activation`;
        if ((darkSlot.attackCooldowns[cooldownKey] ?? 0) > 0) return;
        const cost = resolveStackCost(def.activationCost, s.turn.limitlessLightStacks);
        if (s.turn.limitlessLightStacks < cost) return;
        s.turn.limitlessLightStacks -= cost;
        const result = CardEffectExecutor.execute(
          toDeckCard(slot),
          s.turn,
          s.board,
          s.deck,
          false,
          { effects: def.sophEffects, countAsPlay: false, removeFromHand: false },
        );
        if (!result.canPlay) return;
        s.turn = result.turn;
        s.board = result.board;
        s.deck = result.deck;
        queuePendingEffects(s.turn, result);
        darkSlot.attackCooldowns[cooldownKey] = def.cooldownCardsPlayed;
        const card = toDeckCard(darkSlot);
        s.board.backSlots[slotIndex] = null;
        if (def.postActivationFate === 'hand') s.deck.hand.push(card);
        else if (def.postActivationFate === 'deck') s.deck.drawPile = DeckSystem.shuffle([...s.deck.drawPile, card]);
        else s.deck.discardPile.push(card);
        enforceHandCap(s);
        emitQuestProgressToProgress(s.progress, { kind: 'activate_dark', amount: 1 });
        emitQuestProgressToProgress(s.progress, { kind: 'spend_light_stacks', amount: cost });
        recompute(s);
      });
    },

    activateAsaBridge: (instanceId, spend) => {
      set(s => {
        const slot = s.board.frontSlots.find(card => card?.instanceId === instanceId);
        if (!slot || slot.type !== 'AinSophAur') return;
        const def = CardRegistry.get(slot.definitionId);
        if (!def || def.type !== 'AinSophAur' || !def.bridgeAttack) return;
        const attack = def.bridgeAttack;
        if ((slot.attackCooldowns[attack.id] ?? 0) > 0) return;
        const requiredSpend = attack.consumesStacks ? resolveStackCost(attack.consumesStacks, s.turn.limitlessLightStacks) : 0;
        const selectedSpend = spend ?? requiredSpend;
        if (selectedSpend < requiredSpend || selectedSpend > s.turn.limitlessLightStacks) return;
        // Scaling reads the pre-spend pool so paying the cost never shrinks the payout.
        const stacksBeforeSpend = s.turn.limitlessLightStacks;
        s.turn.limitlessLightStacks -= selectedSpend;
        const scaling = resolveCardScaling(attack.scaling, {
          limitlessLightStacks: stacksBeforeSpend,
          asaFrontCount: s.board.frontSlots.filter(card => card?.type === 'AinSophAur').length,
          collectionPower: computeGlobalResonanceScore(s.progress),
        });
        grantOblivion(s, Math.max(0, Math.round(attack.baseOblivion + scaling + selectedSpend)));
        emitQuestProgressToProgress(s.progress, { kind: 'bridge_ain_soph_aur', amount: 1 });
        emitQuestProgressToProgress(s.progress, { kind: 'spend_light_stacks', amount: selectedSpend });
        slot.attackCooldowns[attack.id] = attack.cooldownCards;
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
        const pendingQueue = [...(s.turn.pendingEffectQueue ?? [])];
        let pendingTakenSubtypeCounts: Partial<Record<CardSubtypeFilter, number>> = {};
        let pendingDiscardedSubtypeCounts: Partial<Record<CardSubtypeFilter, number>> = {};
        let pendingLookDiscardedCount = 0;

        const countSubtypeCards = (cards: Array<{ definitionId: string }>): Partial<Record<CardSubtypeFilter, number>> => {
          const counts: Partial<Record<CardSubtypeFilter, number>> = {};
          for (const card of cards) {
            const subtype = CardRegistry.get(card.definitionId)?.type;
            if (subtype === 'Light' || subtype === 'Dark' || subtype === 'AinSophAur') {
              counts[subtype] = (counts[subtype] ?? 0) + 1;
            }
          }
          return counts;
        };

        if (pending.type === 'discard_choice') {
          const discardableHand = s.deck.hand.filter(card => CardRegistry.get(card.definitionId)?.type !== 'AinSophAur');
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
              if (subtype !== 'Light' && subtype !== 'Dark' && subtype !== 'AinSophAur') return;
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
            const allowedSubtypeTypes: ReadonlySet<CardSubtypeFilter> = new Set([
              'AinSophAur', 'Light', 'Dark',
            ]);
            const selectedTypes = selected
              .map(id => pending.cards.find(card => card.instanceId === id))
              .filter((card): card is DeckCard => Boolean(card))
              .map(card => CardRegistry.get(card.definitionId)?.type as string | undefined)
              .filter((type): type is CardSubtypeFilter => !!type && allowedSubtypeTypes.has(type as CardSubtypeFilter));
            const requiredTypes = new Set<CardSubtypeFilter>(pending.filter);
            const chosenTypes = new Set<CardSubtypeFilter>(selectedTypes);
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
          pendingQueue.push(...(result.pendingEffects ?? (result.pendingEffect ? [result.pendingEffect] : [])));
        }

        s.deck = normalizeDeckInstanceIds(s.deck);

        const overflow = s.deck.hand.length - 8;
        if (overflow > 0) {
          pendingQueue.push({ type: 'discard_choice', count: overflow, sourceCard: 'hand_overflow' });
        }

        s.turn.pendingEffect = pendingQueue.shift() ?? null;
        s.turn.pendingEffectQueue = pendingQueue;
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

    // �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E� Oblivion �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E�

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

    // �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E� Settings �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E�

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
      if (state.progress.oblivion < 50_000) return false;

      set(s => {
        const target = s.progress.enigmas.instances[enigmaId] ?? ensureNeutralMysteryInstance(s.progress);
        if (!target) return;
        if (target.currentStepIndex !== 1) return;
        if (s.progress.oblivion < 50_000) return;
        s.progress.oblivion -= 50_000;
        target.stepsComplete[1] = true;
        target.currentStepIndex = 2;
        pushEnigmaStepToast(s, enigmaId, 1);
      });
      return true;
    },

    sacrificeShardsForEnigma: (enigmaId: string, amount: number) => {
      const state = get();
      const instance = state.progress.enigmas.instances[enigmaId];
      if (!instance || instance.status === 'locked') return false;
      if (state.progress.aberratedShards < amount) return false;

      set(s => {
        const target = s.progress.enigmas.instances[enigmaId];
        if (!target || target.status === 'locked') return;
        if (s.progress.aberratedShards < amount) return;
        s.progress.aberratedShards -= amount;
        // Step 2 of Neutralizing the Void (index 2).
        if (enigmaId === 'neutralizing-the-void' && !target.stepsComplete[2]) {
          target.stepsComplete[2] = true;
          target.currentStepIndex = Math.max(target.currentStepIndex, 3);
          pushEnigmaStepToast(s, enigmaId, 2);
          // Retro-check step 3 (card mastery tier) immediately after step 2 unlocks.
          checkNtvMasteryTierStep(s.progress);
        }
      });
      return true;
    },

    claimEnigmaReward: (enigmaId) => {
      const state = get();
      const instance = state.progress.enigmas.instances[enigmaId];
      if (!instance) return false;
      if (instance.status === 'completed') return false;

      // Re-evaluate board progress before gating  Eheals saves stuck before the Phase-0 evaluator fix.
      if (enigmaId === 'neutral-mystery') {
        // Run inside set() so stepsComplete mutations are on a mutable Immer draft.
        set(s => {
          evaluateNeutralMysteryProgress({ board: s.board, progress: s.progress });
        });
        const refreshed = get().progress.enigmas.instances['neutral-mystery'];
        if (!refreshed || !refreshed.stepsComplete[3]) return false;
      }

      if (enigmaId === 'neutralizing-the-void') {
        const ntv = get().progress.enigmas.instances['neutralizing-the-void'];
        if (!ntv || !ntv.stepsComplete[3]) return false;
      }

      set(s => {
        const target = s.progress.enigmas.instances[enigmaId];
        if (!target || target.status === 'completed') return;
        awardEnigmaReward(s.progress, enigmaId);
        const lastStep = target.stepsComplete.length - 1;
        target.stepsComplete[lastStep] = true;
        target.currentStepIndex = Math.max(target.currentStepIndex, target.stepsComplete.length);
        target.completedAt = Date.now();
        const title = enigmaId === 'neutral-mystery' ? 'Neutral Mystery' : enigmaId === 'neutralizing-the-void' ? 'Neutralizing the Void' : enigmaId;
        pushRewardToast(s, `Enigma Complete: ${title}`);
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
      const resonanceScore = computeGlobalResonanceScore(s.progress);
      const oblivionReward = getScaledQuestOblivion(quest.oblivionReward ?? 0, resonanceScore);
      set(state => {
        const list = state.progress.quests.daily.find(q => q.id === questId)
          ? state.progress.quests.daily
          : state.progress.quests.weekly;
        const q = list.find(qq => qq.id === questId);
        if (q) q.claimed = true;
        if (oblivionReward > 0) {
          state.progress.oblivion += oblivionReward;
          state.progress.lifetimeOblivion = (state.progress.lifetimeOblivion ?? 0) + oblivionReward;
        }
        if (shardReward > 0) {
          state.progress.aberratedShards += shardReward;
        }
      });
      return { shards: shardReward, oblivion: oblivionReward > 0 ? oblivionReward : undefined };
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
      const scaledOblivionReward = getScaledQuestOblivion(oblivionReward, computeGlobalResonanceScore(s.progress));
      set(state => {
        latchUnlockedAchievements(state.progress);
        if (!state.progress.achievementClaims) state.progress.achievementClaims = {};
        if (!state.progress.achievementUnlocks) state.progress.achievementUnlocks = {};
        state.progress.achievementUnlocks[achievementId] = true;
        state.progress.achievementClaims[achievementId] = true;
        state.progress.aberratedShards += shardReward;
        if (scaledOblivionReward > 0) {
          state.progress.oblivion += scaledOblivionReward;
          state.progress.lifetimeOblivion = (state.progress.lifetimeOblivion ?? 0) + scaledOblivionReward;
        }
      });
      return { shards: shardReward, oblivion: scaledOblivionReward > 0 ? scaledOblivionReward : undefined };
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
        checkNtvMasteryTierStep(state.progress);
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
        checkNtvMasteryTierStep(state.progress);
      });
      return { shards: totalShards, tiersClaimed };
    },

    markCollectionViewed: () => {
      set(state => {
        state.progress.lastCollectionViewedAt = Date.now();
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

    setDeckAbilityLoadout: (deckId, slot, abilityId) => {
      set(s => {
        const d = s.progress.savedDecks.find(dk => dk.id === deckId);
        if (!d) return;
        if (!d.abilityLoadout) d.abilityLoadout = {};
        d.abilityLoadout[slot] = abilityId;
      });
    },

    activateSetAbility: (slot) => {
      const state = get();
      if (state.turn.phase !== 'playing') return;
      if (state.turn.pendingEffect) return;

      // Resolve the active deck's ability for this slot.
      const activeDeck = state.progress.savedDecks.find(d => d.id === state.progress.activeDeckId);
      if (!activeDeck) return;

      const resolved = resolveActiveAbilitiesForDeck(
        'Neutrality',
        activeDeck.deckList,
        activeDeck.extraDeck,
        activeDeck.abilityLoadout as Partial<Record<1 | 2 | 3, string>> | undefined,
      );
      const ability = resolved[slot];
      if (!ability) {
        get().enqueueToast(`Ability slot ${slot}: gate not met for current deck.`, 'warning', 2500);
        return;
      }

      // Aegis Uprising still requires its Transcendent Angel on the board.
      if (ability.id === 'neutrality-signature-aegis-uprising') {
        const neutralitySet = getSet('Neutrality');
        const hasBoardAngel = !!neutralitySet && state.board.frontSlots.some(
          u => u && u.type === 'AinSophAur' && neutralitySet.membership.isTranscendentAngel(u.definitionId),
        );
        if (!hasBoardAngel) {
          get().enqueueToast('Requires a Transcendent Angel of this set on your board.', 'warning', 2500);
          return;
        }
      }

      // Check cooldown.
      const cd = state.turn.setAbilityCooldowns ?? {};
      if ((cd[ability.id] ?? 0) > 0) {
        get().enqueueToast(`${ability.label} is on cooldown (${cd[ability.id]} plays).`, 'warning', 2000);
        return;
      }

      // Check one-off uses.
      if (ability.maxUsesPerRun !== undefined) {
        const uses = state.turn.setAbilityUsesRemaining ?? {};
        if (ability.id in uses && (uses[ability.id] ?? 0) <= 0) {
          get().enqueueToast(`${ability.label} has already been used this run.`, 'warning', 2000);
          return;
        }
      }

      // Execute and write cooldown / use count.
      set(s => {
        ability.execute(s as unknown as import('@/types/game').GameState);

        if (!s.turn.setAbilityCooldowns) s.turn.setAbilityCooldowns = {};
        if (!s.turn.setAbilityUsesRemaining) s.turn.setAbilityUsesRemaining = {};

        if (ability.cooldownCards > 0) {
          s.turn.setAbilityCooldowns[ability.id] = ability.cooldownCards;
        }

        if (ability.maxUsesPerRun !== undefined) {
          const prevUses = s.turn.setAbilityUsesRemaining[ability.id] ?? ability.maxUsesPerRun;
          s.turn.setAbilityUsesRemaining[ability.id] = Math.max(0, prevUses - 1);
        }
      });

      get().enqueueToast(`${ability.label} activated.`, 'success', 2000);
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
        s.board = { frontSlots: [null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] };
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
        // Win condition: timer expired ↁEcompare scores.
        if (next <= 0) {
          completeBattlegroundFight(s);
          return;
        }
        // Win condition: both done ↁEresolve by score.
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



    // �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E� Boss fight �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E�

    startBossFight: (bossId, savedDeckId, options) => {
      set(s => {
        if (s.bossFight.mode !== 'idle') return;
        const boss = BOSS_DEFINITIONS.find(b => b.id === bossId);
        if (!boss) return;
        const now = Date.now();
        const cooldown = s.bossFight.cooldowns[bossId];
        const kind = options?.kind ?? 'normal';
        if (cooldown && cooldown > now) return;
        if (!isBossUnlocked(s.progress, bossId)) return;
        const savedDeck = s.progress.savedDecks.find(d => d.id === savedDeckId);
        if (!savedDeck) return;

        const savedState: SavedGameState = {
          deck: cloneState(s.deck),
          board: cloneState(s.board),
          turn: cloneState(s.turn),
          progress: cloneState(s.progress),
          settings: { ...s.settings },
        };

        const coopPartySize = Math.max(1, Math.min(3, options?.coopPartySize ?? 1));
        const requestedFightCount = Math.max(1, Math.min(3, Math.floor(options?.fightCount ?? 1)));
        const fightCount = requestedFightCount;

        // Apply boss HP. Event bosses snapshot once per cycle and stay fixed.
        let maxHp = isEventBossCategory(boss.category)
          ? ensureEventBossHpSnapshot(s.progress)
          : boss.hp;
        maxHp = Math.round(maxHp * (COOP_BOSS_HP_SCALE_BY_PARTY_SIZE[coopPartySize] ?? 1));
        maxHp = Math.round(maxHp * (BOSS_FIGHT_HP_SCALE_BY_COUNT[fightCount] ?? 1));

        const roundSeconds = BOSS_FIGHT_ROUND_SECONDS;

        s.deck = createDeckState(savedDeck.deckList, savedDeck.extraDeck ?? []);
        s.board = { frontSlots: [null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] };
        s.turn = { ...defaultTurn, phase: 'idle' };

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
        s.board = { frontSlots: [null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] };
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
        s.board = { frontSlots: [null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] };
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
        // within the final second, freeze must NOT be allowed to keep the timer pinned  E
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
            ensureEnigmaState(s.progress);
            const raidEnigmaSnapshot = cloneState(s.progress.enigmas.instances);
            s.deck = saved.deck;
            s.board = saved.board;
            s.turn = saved.turn;
            s.progress = saved.progress;
            s.settings = saved.settings;
            mergeFightEnigmaProgress(s.progress, raidEnigmaSnapshot, (id, i) => {
              const inst = s.progress.enigmas.instances[id];
              if (inst && i < inst.stepsComplete.length - 1) pushEnigmaStepToast(s, id, i);
            });
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

        s.board = { frontSlots: [null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] };
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
        s.board = { frontSlots: [null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] };
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
          ensureEnigmaState(s.progress);
          const trialEnigmaSnapshot = cloneState(s.progress.enigmas.instances);
          s.deck = cloneState(saved.deck);
          s.board = cloneState(saved.board);
          s.turn = cloneState(saved.turn);
          s.progress = cloneState(saved.progress);
          s.settings = { ...saved.settings };
          mergeFightEnigmaProgress(s.progress, trialEnigmaSnapshot, (id, i) => {
            const inst = s.progress.enigmas.instances[id];
            if (inst && i < inst.stepsComplete.length - 1) pushEnigmaStepToast(s, id, i);
          });
        }
        s.trialDeck = { ...defaultTrialDeckState };
        recompute(s);
      });
    },

    // �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E� Save/load �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E�

    loadState: (loaded) => {
      set(s => {
        // Migrate collection: string[] �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E� Record<string, number>
        if (Array.isArray((loaded.progress as { collection: unknown }).collection)) {
          const rec: Record<string, number> = {};
          for (const id of (loaded.progress as unknown as { collection: string[] }).collection) rec[id] = 1;
          (loaded.progress as { collection: Record<string, number> }).collection = rec;
        }

        // Migrate progress: score �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E� oblivion
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

        // Migrate board: old slots �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E� frontSlots + backSlots
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
        // Phase 2 Neutrality rework: Sigil/Patient-Light/marked-card/timer-pause/attack-preserve
        // sub-mechanics were gutted in favor of Patience-only design; strip their old save fields.
        delete ot['neutralitySetupCount'];
        delete ot['neutralityEngineSignatures'];
        delete ot['neutralityPatientLightStacks'];
        delete ot['neutralityEquilibriumSigils'];
        delete ot['neutralityEquilibriumSigilsGainedThisTurn'];
        delete ot['neutralityEquilibriumPatientLightFromSigilsThisTurn'];
        delete ot['neutralityEquilibriumSigilCapBonus'];
        delete ot['neutralityEquilibriumSentinelTempoUsed'];
        delete ot['neutralityMarkedCardIds'];
        delete ot['neutralityMarkedPatienceGain'];
        delete ot['neutralityPauseActiveTimersSeconds'];
        delete ot['neutralityAttackPreservePercent'];
        delete ot['neutralityAttackRestorePercent'];
        delete ot['neutralityLinkedGainBonus'];
        delete ot['neutralityLinkedRetainPercent'];
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
        // Heal enigma progress that was stuck before Phase-0 evaluator fix shipped.
        syncEnigmaProgressFromBoard(s, false);
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

// �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E� Selectors �E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E��E�E�E�E�E�E�E�E�E�E�E�E�E�E�E�

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












