import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
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
  PrismaticDepth,
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
import { getLateGameAttackIdentity } from '@/systems/cards/LateGameAttackIdentity';
import {
  type ActionClass,
  classifyCardActionClass,
  getCardActionClassEffects,
} from '@/systems/cards/ActionClass';
import { CardEffectExecutor } from '@/systems/cards/CardEffectExecutor';
import { PackSystem } from '@/systems/cards/PackSystem';
import { PACK_DEFINITIONS } from '@/data/packs/packDefinitions';
import { canConvertCardToHolo, getCardFinishKey, getHolofoilConversionCost } from '@/systems/progression/HolofoilSystem';
import { STARTER_DECK_LIST, STARTER_EXTRA_DECK, STARTER_COLLECTION } from '@/systems/progression/StarterDeck';
import { evaluateDailyLogin, getUtcDayIndex } from '@/systems/progression/dailyLogin';
import {
  applyQuestProgress,
  refreshQuestRotation,
  type QuestKind,
} from '@/systems/progression/quests';
import { getBossRewardMultiplier } from '@/systems/progression/featuredBoss';
import {
  getAchievementShardReward,
  getAchievementOblivionReward,
  isAchievementUnlocked,
} from '@/systems/progression/achievements';
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
import {
  BOSS_DEFINITIONS,
  BOSS_FIGHT_ROUND_SECONDS,
  ensureEventBossHpSnapshot,
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
import { isDeathFlamedHellBaseDefinitionId } from '@/utils/cardFaces';
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
import { getCardCategoryKey } from '@/data/elements';

const EMBRACE_INFINITE_MIN_HAND = 40;

type AttenuationClass = ActionClass;

const ATTENUATION_CLASSES: AttenuationClass[] = ['setup', 'conversion', 'multiplier', 'refund', 'finisher'];
const ATTENUATION_TIERS = [1, 0.75, 0.55, 0.4] as const;
const NEUTRALITY_SETUP_FOR_FULL_FIRE = 3;
const NEUTRALITY_ENGINES_FOR_FULL_FIRE = 3;
const DFH_ETERNAL_VEIL_DEFAULT_OBLIVION_PER_MARK = 160;
const COOP_BOSS_HP_SCALE_BY_PARTY_SIZE: Record<number, number> = {
  1: 1,
  2: 1.68,
  3: 2.28,
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
  emberGroveEchoUsedThisTurn: false,
  nextCardMultiplied: false,
  mulliganSelected: [],
  pendingEffect: null,
  equilibriumDrift: 0,
  equilibriumStability: 0,
  neutralitySetupCount: 0,
  attenuationClassUses: { setup: 0, conversion: 0, multiplier: 0, refund: 0, finisher: 0 },
  attenuationBreaksUsed: 0,
  attenuationBrokenClasses: [],
  crossSetConversionDistinctSources: [],
  neutralityEngineSignatures: [],
  neutralityPatienceChargedThisTurn: 0,
  neutralityPatienceConsumedThisTurn: 0,
  neutralityChainGainedThisTurn: 0,
  neutralityPatientLightStacks: 0,
  neutralityEquilibriumSigils: 0,
  neutralityEquilibriumSigilsGainedThisTurn: 0,
  neutralityEquilibriumPatientLightFromSigilsThisTurn: 0,
  neutralityEquilibriumSigilCapBonus: 0,
  neutralityEquilibriumSentinelTempoUsed: false,
  neutralityTriggeredEffects: [],
  lightCadenceNotes: [],
  lightDistinctNotes: [],
  lightResonance: 0,
  thornScar: 0,
  prismaticCurrentChannel: null,
  prismaticDistinctChannels: [],
  prismaticRecentChannels: [],
  prismaticRefractionDepth: 0,
  prismaticNodeCharges: 0,
  prismaticResonanceCharge: 0,
  blackGlassWhiteFlame: 0,
  blackGlassBlackFlame: 0,
  blackGlassFracture: 0,
  blackGlassLastPolarity: null,
  blackGlassLastPayoff: 0,
  snowboundPhase: null,
  snowboundPotential: 0,
  snowboundAlternations: 0,
  snowboundConduits: 0,
  glassProofFragments: 0,
  glassProofDepth: 0,
  glassProofCascade: 0,
  glassAxioms: [],
  glassArchiveSeals: 0,
  glassAngleCharges: 0,
  glassOriginPulseUsed: false,
  glassAxiomFocus: null,
  glassSnapshotFragments: 0,
  glassSnapshotDepth: 0,
  glassSnapshotCascade: 0,
  glassSnapshotAxioms: 0,
  glassWaveQueue: 0,
  glassDepthFloor: 0,
  glassDepthFloorIncreased: false,
  glassWhiteLedger: 0,
  glassWhiteLedgerActive: false,
  glassSyntheticFragments: 0,
  glassSyntheticCascade: 0,
  burningGardenLaw: null,
  burningGardenLineagesPlayed: [],
  burningGardenEchoesBloomed: 0,
  burningGardenNextFinalChordScaleBonus: 0,
  burningGardenSunSigils: 0,
  burningGardenCrownStacks: 0,
  burningGardenCodexLineage: null,
  burningGardenCodexCopiesRemaining: 0,
  burningGardenTransitGateCredit: 0,
  burningGardenIncandescentSnapshot: [],
  burningGardenWorldflowerGrowth: 0,
  burningGardenArrayFreeEchoes: 0,
  burningGardenGeometryMode: false,
  burningGardenZenithNextInfinite: false,
  burningGardenSkyLaw: null,
  pyroHeat: 0,
  lastPlayedElement: null,
  uniqueElementsPlayedThisTurn: [],
  prismaticLight: 0,
  monochromaticShards: 0,
  arcticCharge: 0,
  proof: 0,
  bloom: 0,
  butterflySpectrum: 0,
  butterflyStance: null,
  butterflyFlutterLevel: 0,
  butterflyFormation: 0,
  butterflyFormationTypesSeen: [],
  eternalSeasUndertow: 0,
  eternalSeasFoam: 0,
  eternalSeasCurrent: 0,
  eternalSeasPolarity: null,
  eternalSeasWhiteFlow: 0,
  eternalSeasBlackFlow: 0,
  eternalSeasMarginCharge: 0,
  recastLedger: [],
  reforgeCharges: 0,
  reforgeChargeCap: 6,
  pearls: 0,
  unrecordedHueActive: false,
  forgeRecastEventsThisTurn: 0,
  forgePendingCherubimTemper: 0,
  equippedArtifactIds: [],
};

const defaultProgress: ProgressState = {
  oblivion: 0,
  aberratedShards: 0,
  totalCardsPlayed: 0,
  collection: { ...STARTER_COLLECTION },
  holoCollection: {},
  infiniteCollection: {},
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
    signatureCardIds: [],
    unlockedAvatarIds: [],
  },
  dailyLogin: {
    lastClaimedDayIndex: -1,
    streak: 0,
    totalClaims: 0,
  },
  quests: { daily: [], weekly: [], lastDailyRollDay: -1, lastWeeklyRollWeek: -1 },
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
  modifiers: [],
  trialRewardMult: 1,
  gauntletDepth: 0,
  gauntletShardsBanked: 0,
  gauntletHpCarryFrac: 1,
  coopPartySize: 1,
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

type PrismaticBoardCard = SeraphimInstance | AngelInstance | CherubimInstance;

type BurningGardenBoardCard = SeraphimInstance | AngelInstance | CherubimInstance;

type BurningGardenLineage = 'Rose' | 'Sunflower' | 'Thistle';

function getPrismaticDepth(def: CardDefinition | undefined): PrismaticDepth | null {
  if (!def || def.prismaticDepth === undefined) return null;
  return def.prismaticDepth;
}

function applyPrismaticDefaults<T extends { prismaticDepth?: PrismaticDepth; spectrumTokens?: number }>(card: T, def: CardDefinition | undefined): T {
  const depth = getPrismaticDepth(def);
  if (depth !== null) card.prismaticDepth = depth;
  if (card.spectrumTokens === undefined) card.spectrumTokens = 0;
  return card;
}

function refractSpectrumTokens(board: BoardState, playedInstanceId: string, playedDef: CardDefinition | undefined): void {
  const playedDepth = getPrismaticDepth(playedDef);
  if (playedDepth === null) return;

  const occupiedFront = board.frontSlots.filter((slot): slot is SeraphimInstance | AngelInstance => slot !== null);
  const occupiedBack = board.backSlots.filter((slot): slot is CherubimInstance => slot !== null);
  const occupiedCards: PrismaticBoardCard[] = [...occupiedFront, ...occupiedBack];

  for (const card of occupiedCards) {
    if (card.instanceId === playedInstanceId) continue;
    if ((card.prismaticDepth ?? 0) <= 0) continue;
    if (Math.abs((card.prismaticDepth as number) - playedDepth) === 1) {
      card.spectrumTokens = (card.spectrumTokens ?? 0) + 1;
    }
  }
}

function isBurningGardenCard(def: CardDefinition | undefined): boolean {
  return def?.element === 'BlazingGarden';
}

function getBurningGardenLineage(definitionId: string): BurningGardenLineage {
  const id = definitionId.toLowerCase();
  if (id.includes('serevathi') || id.includes('rose')) return 'Rose';
  if (id.includes('aureveth') || id.includes('sun') || id.includes('noon')) return 'Sunflower';
  return 'Thistle';
}

function ensureBurningGardenTurnState(turn: TurnState): void {
  if (turn.burningGardenLaw === undefined) turn.burningGardenLaw = null;
  if (turn.burningGardenLineagesPlayed === undefined) turn.burningGardenLineagesPlayed = [];
  if (turn.burningGardenEchoesBloomed === undefined) turn.burningGardenEchoesBloomed = 0;
  if (turn.burningGardenNextFinalChordScaleBonus === undefined) turn.burningGardenNextFinalChordScaleBonus = 0;
  if (turn.burningGardenSunSigils === undefined) turn.burningGardenSunSigils = 0;
  if (turn.burningGardenCrownStacks === undefined) turn.burningGardenCrownStacks = 0;
  if (turn.burningGardenCodexLineage === undefined) turn.burningGardenCodexLineage = null;
  if (turn.burningGardenCodexCopiesRemaining === undefined) turn.burningGardenCodexCopiesRemaining = 0;
  if (turn.burningGardenTransitGateCredit === undefined) turn.burningGardenTransitGateCredit = 0;
  if (turn.burningGardenIncandescentSnapshot === undefined) turn.burningGardenIncandescentSnapshot = [];
  if (turn.burningGardenWorldflowerGrowth === undefined) turn.burningGardenWorldflowerGrowth = 0;
  if (turn.burningGardenArrayFreeEchoes === undefined) turn.burningGardenArrayFreeEchoes = 0;
  if (turn.burningGardenGeometryMode === undefined) turn.burningGardenGeometryMode = false;
  if (turn.burningGardenZenithNextInfinite === undefined) turn.burningGardenZenithNextInfinite = false;
  if (turn.burningGardenSkyLaw === undefined) turn.burningGardenSkyLaw = null;
}

function hasBurningGardenCardOnBoard(s: Store, definitionId: string): boolean {
  for (const slot of s.board.frontSlots) {
    if (slot?.definitionId === definitionId) return true;
  }
  for (const slot of s.board.backSlots) {
    if (slot?.definitionId === definitionId) return true;
  }
  return false;
}

function isAlternatingLineageRhythm(lineages: Array<'Rose' | 'Sunflower' | 'Thistle'>): boolean {
  const recent = lineages.slice(-6);
  if (recent.length < 4) return false;
  let alternatingTransitions = 0;
  for (let i = 1; i < recent.length; i++) {
    if (recent[i] !== recent[i - 1]) alternatingTransitions += 1;
  }
  return alternatingTransitions >= 3;
}

function getBurningGardenEchoPenalty(card: { isEcho?: boolean } | null | undefined): number {
  return card?.isEcho ? 0.72 : 1;
}

function initializeBurningGardenInstance<T extends BurningGardenBoardCard>(card: T, def: CardDefinition | undefined, echoed = false): T {
  if (!isBurningGardenCard(def)) return card;
  card.burningGardenPhase = 'Bloom';
  card.chromaticCounters = echoed ? Math.max(1, card.chromaticCounters ?? 1) : 0;
  card.chromaticSources = [...(card.chromaticSources ?? [])];
  card.burnTurnsRemaining = 0;
  card.isEcho = echoed;
  return card;
}

function igniteBurningGardenInstance<T extends BurningGardenBoardCard>(card: T): T {
  if (card.burningGardenPhase === 'Burn') return card;
  card.burningGardenPhase = 'Burn';
  card.burnTurnsRemaining = 2;
  card.isEcho = false;
  return card;
}

function getBurningGardenAttackMultiplier(card: { burningGardenPhase?: string; chromaticCounters?: number; isEcho?: boolean } | null | undefined): number {
  if (!card || card.burningGardenPhase !== 'Burn') return 1;
  const counterBonus = Math.min(0.75, (card.chromaticCounters ?? 0) * 0.12);
  const echoBonus = card.isEcho ? 0.15 : 0;
  return 1.45 + counterBonus + echoBonus;
}

function getBurningGardenRepresentedLineages(s: Store): BurningGardenLineage[] {
  const represented = new Set<BurningGardenLineage>();
  for (const slot of s.board.frontSlots) {
    if (!slot) continue;
    const def = CardRegistry.get(slot.definitionId);
    if (!isBurningGardenCard(def)) continue;
    represented.add(getBurningGardenLineage(slot.definitionId));
  }
  for (const slot of s.board.backSlots) {
    if (!slot) continue;
    const def = CardRegistry.get(slot.definitionId);
    if (!isBurningGardenCard(def)) continue;
    represented.add(getBurningGardenLineage(slot.definitionId));
  }
  for (const seed of s.board.emberGrove ?? []) {
    represented.add(seed.lineage ?? getBurningGardenLineage(seed.definitionId));
  }
  return Array.from(represented);
}

function computeBurningGardenBoardPower(card: { burningGardenPhase?: string; chromaticCounters?: number; isEcho?: boolean } | null | undefined): number {
  if (!card || card.burningGardenPhase !== 'Burn') return 1;
  const counterBonus = Math.min(0.6, (card.chromaticCounters ?? 0) * 0.1);
  return 1.3 + counterBonus + (card.isEcho ? 0.1 : 0);
}

function pushEmberGroveEntry(
  s: Store,
  card: BurningGardenBoardCard,
  definitionId: string,
): void {
  const emberGrove = s.board.emberGrove ?? (s.board.emberGrove = []);
  const sourceId = `${definitionId}:${card.instanceId}:${s.turn.turnNumber ?? 0}:${emberGrove.length}`;
  const chromaticSources = [...new Set([...(card.chromaticSources ?? []), sourceId])];
  const lineage = getBurningGardenLineage(definitionId);
  emberGrove.push({
    definitionId,
    finish: card.finish,
    sourceId,
    chromaticSources,
    charredAtTurn: s.turn.turnNumber ?? 0,
    lineage,
    memoryPower: Math.max(1, chromaticSources.length),
  });
}

function pushEmberGroveDeckSeed(s: Store, card: { definitionId: string; finish: CardFinish; instanceId: string }): void {
  const def = CardRegistry.get(card.definitionId);
  if (!isBurningGardenCard(def)) return;
  const emberGrove = s.board.emberGrove ?? (s.board.emberGrove = []);
  const sourceId = `${card.definitionId}:${card.instanceId}:${s.turn.turnNumber ?? 0}:${emberGrove.length}:seed`;
  const lineage = getBurningGardenLineage(card.definitionId);
  emberGrove.push({
    definitionId: card.definitionId,
    finish: card.finish,
    sourceId,
    chromaticSources: [sourceId],
    charredAtTurn: s.turn.turnNumber ?? 0,
    lineage,
    memoryPower: 1,
  });
}

function charBurningGardenBoardCard(
  s: Store,
  location: { kind: 'front'; index: 0 | 1 | 2 | 3 | 4 } | { kind: 'back'; index: 0 | 1 | 2 | 3 },
  card: BurningGardenBoardCard,
): void {
  pushEmberGroveEntry(s, card, card.definitionId);

  const lineage = getBurningGardenLineage(card.definitionId);
  if ((s.turn.burningGardenCodexCopiesRemaining ?? 0) > 0 && (s.turn.burningGardenCodexLineage ?? null) === lineage) {
    const emberGrove = s.board.emberGrove ?? (s.board.emberGrove = []);
    const latest = emberGrove[emberGrove.length - 1];
    if (latest) {
      emberGrove.push({
        ...latest,
        sourceId: `${latest.sourceId}:codex:${s.turn.burningGardenCodexCopiesRemaining}`,
        memoryPower: Math.max(1, (latest.memoryPower ?? latest.chromaticSources.length) * 2),
        chromaticSources: [...latest.chromaticSources],
      });
      s.turn.burningGardenCodexCopiesRemaining = Math.max(0, (s.turn.burningGardenCodexCopiesRemaining ?? 0) - 1);
    }
  }

  if (hasBurningGardenCardOnBoard(s, 'bg-inf-soleth-vair-worldflower')) {
    const distinct = new Set((s.board.emberGrove ?? []).map(seed => seed.lineage ?? getBurningGardenLineage(seed.definitionId))).size;
    const gain = Math.max(1, distinct);
    s.turn.burningGardenWorldflowerGrowth = (s.turn.burningGardenWorldflowerGrowth ?? 0) + gain;
    grantOblivion(s, 60 * gain);
  }

  if (location.kind === 'front') {
    s.board.frontSlots[location.index] = null;
  } else {
    s.board.backSlots[location.index] = null;
  }
}

function applyBurningGardenFinalChord(s: Store, def: CardDefinition, chromaticSourceCount: number): void {
  const bonusScale = Math.max(0, s.turn.burningGardenNextFinalChordScaleBonus ?? 0);
  const scale = Math.max(1, chromaticSourceCount - 2 + bonusScale);
  s.turn.burningGardenNextFinalChordScaleBonus = 0;
  if (def.type === 'Seraphim') {
    grantOblivion(s, 150 * scale);
    s.turn.nextCardMultiplied = true;
    if ((s.turn.burningGardenGeometryMode ?? false)) {
    }
    return;
  }

  if (def.type === 'Cherubim') {
    s.turn.burningGardenWorldflowerGrowth = (s.turn.burningGardenWorldflowerGrowth ?? 0) + 12 * scale;
    if ((s.turn.burningGardenGeometryMode ?? false)) {
      s.turn.burningGardenWorldflowerGrowth += 8;
    }
    return;
  }

  s.turn.burningGardenWorldflowerGrowth = (s.turn.burningGardenWorldflowerGrowth ?? 0) + 12 * scale;
  if ((s.turn.burningGardenGeometryMode ?? false)) {
    s.deck = TurnSystem.drawCards(s.deck, 1);
  }
}

function reviveBurningGardenEcho(
  s: Store,
  options?: {
    consumeEchoUse?: boolean;
    extraCounters?: number;
  },
): boolean {
  if (s.turn.phase !== 'playing' || s.turn.pendingEffect !== null) return false;
  ensureBurningGardenTurnState(s.turn);

  const consumeEchoUse = options?.consumeEchoUse ?? true;
  const extraCounters = options?.extraCounters ?? 0;
  const hasFreeEcho = (s.turn.burningGardenArrayFreeEchoes ?? 0) > 0;
  if (consumeEchoUse && !hasFreeEcho && s.turn.emberGroveEchoUsedThisTurn) return false;

  const emberGrove = s.board.emberGrove ?? (s.board.emberGrove = []);
  const entry = emberGrove.shift();
  if (!entry) return false;

  const def = CardRegistry.get(entry.definitionId);
  if (!def || !isBurningGardenCard(def)) return false;

  const sources = [...new Set(entry.chromaticSources)];
  const lineage = entry.lineage ?? getBurningGardenLineage(entry.definitionId);
  const lawBonus = s.turn.burningGardenLaw === 'Rose' ? 1 : 0;
  const serevathiEchoBonus = hasBurningGardenCardOnBoard(s, 'bg-et-serevathi-proofflame') ? 1 : 0;
  const skyLawRoseBonus = (s.turn.burningGardenSkyLaw ?? null) === 'Rose' ? 1 : 0;
  const counterBonus = lawBonus + serevathiEchoBonus + skyLawRoseBonus + extraCounters;
  const echoReady = sources.length >= 3;
  const targetSlot = def.type === 'Cherubim'
    ? s.board.backSlots.findIndex(slot => slot === null)
    : s.board.frontSlots.findIndex(slot => slot === null);
  if (targetSlot === -1) {
    emberGrove.unshift(entry);
    return false;
  }

  if (def.type === 'Seraphim') {
    const inst: SeraphimInstance = {
      instanceId: `${entry.sourceId}:echo`,
      definitionId: entry.definitionId,
      type: 'Seraphim',
      element: def.element,
      rarity: def.rarity,
      finish: entry.finish,
      level: 1,
      isActive: false,
      attackCooldowns: {},
      boardSlot: targetSlot as 0 | 1 | 2 | 3 | 4,
    };
    initializeBurningGardenInstance(inst, def, true);
    inst.chromaticSources = sources;
    inst.chromaticCounters = Math.max(1, (entry.memoryPower ?? sources.length) + counterBonus);
    s.board.frontSlots[targetSlot as 0 | 1 | 2 | 3 | 4] = inst;
    s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);
    if (echoReady) applyBurningGardenFinalChord(s, def, sources.length);
  } else if (def.type === 'Cherubim') {
    const inst: CherubimInstance = {
      instanceId: `${entry.sourceId}:echo`,
      definitionId: entry.definitionId,
      type: 'Cherubim',
      element: def.element,
      rarity: def.rarity,
      finish: entry.finish,
      level: 1,
      backSlot: targetSlot as 0 | 1 | 2 | 3,
    };
    initializeBurningGardenInstance(inst, def, true);
    inst.chromaticSources = sources;
    inst.chromaticCounters = Math.max(1, (entry.memoryPower ?? sources.length) + counterBonus);
    s.board.backSlots[targetSlot as 0 | 1 | 2 | 3] = inst;
    if (echoReady) applyBurningGardenFinalChord(s, def, sources.length);
  } else {
    return false;
  }

  if (hasBurningGardenCardOnBoard(s, 'bg-et-embergrove-codex')) {
    const latest = (s.board.emberGrove ?? [])[Math.max(0, (s.board.emberGrove?.length ?? 1) - 1)];
    const giftSource = latest?.chromaticSources?.[0] ?? latest?.sourceId;
    if (giftSource) {
      if (def.type === 'Seraphim') {
        const placed = s.board.frontSlots[targetSlot as 0 | 1 | 2 | 3 | 4];
        if (placed && placed.type === 'Seraphim') {
          placed.chromaticSources = [...new Set([...(placed.chromaticSources ?? []), giftSource])];
        }
      } else if (def.type === 'Cherubim') {
        const placed = s.board.backSlots[targetSlot as 0 | 1 | 2 | 3];
        if (placed && placed.type === 'Cherubim') {
          placed.chromaticSources = [...new Set([...(placed.chromaticSources ?? []), giftSource])];
        }
      }
    }
  }

  s.turn.burningGardenEchoesBloomed = (s.turn.burningGardenEchoesBloomed ?? 0) + 1;
  s.turn.burningGardenLineagesPlayed = [...(s.turn.burningGardenLineagesPlayed ?? []), lineage].slice(-8);
  if (s.turn.burningGardenLaw === 'Sunflower') {
    s.turn.radiance += 4;
  } else if (s.turn.burningGardenLaw === 'Thistle') {
  }

  if ((s.turn.burningGardenArrayFreeEchoes ?? 0) > 0) {
    s.turn.burningGardenArrayFreeEchoes = Math.max(0, (s.turn.burningGardenArrayFreeEchoes ?? 0) - 1);
  } else if (consumeEchoUse) {
    s.turn.emberGroveEchoUsedThisTurn = true;
  }
  recompute(s);
  return true;
}

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
  echoEmberGroveCard: () => boolean;
  igniteBurningGardenCard: (instanceId: string) => void;
  playCard: (instanceId: string) => void;
  convertTrailToScar: () => void;
  consumeFoamToDraw: () => void;
  resolvePending: (selected: string[]) => void;
  endTurn: () => void;
  endAndBeginAgain: () => void;
  addOblivion: (delta: number) => void;
  openPack: (packId: string) => string[] | null;
  openBox: (packId: string) => string[] | null;
  openCase: (packId: string) => string[] | null;
  convertCardToHolo: (definitionId: string) => boolean;
  toggleFavoriteCard: (definitionId: string, finish: CardFinish) => void;
  combineForInfinite: (recipe: import('@/data/cards/infiniteCards').InfiniteRecipe) => boolean;
  updateSettings: (patch: Partial<SettingsState>) => void;
  loadState: (state: GameState) => void;
  resetToDefault: () => void;
  startBossFight: (bossId: string, savedDeckId: string, options?: {
    kind?: 'normal' | 'trial' | 'gauntlet';
    modifiers?: TrialModifier[];
    trialRewardMult?: number;
    coopPartySize?: number;
    coopSessionId?: string;
    coopRole?: 'host' | 'guest';
  }) => void;
  startWakeTrial: (bossId: string, savedDeckId: string, modifiers: TrialModifier[], rewardMult: number) => void;
  startEndlessGauntlet: (savedDeckId: string) => void;
  tickBossTimer: (deltaSeconds: number) => void;
  forfeitBossFight: () => void;
  dismissBossResult: () => void;
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
    customUiTheme: Record<string, string> | null;
    signatureCardIds: string[];
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
  for (const badge of TITLE_BADGES) {
    if (progress.achievementUnlocks[badge.id]) continue;
    if (badge.isUnlocked(progress)) progress.achievementUnlocks[badge.id] = true;
  }
}

function recompute(state: Store): void {
  // Latch profile avatar unlocks permanently once their condition is met.
  latchUnlockedAvatars(state.progress);
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
  return extraDeck
    ? extraDeck.map(entry => typeof entry === 'string'
      ? createExtraDeckEntry(entry)
      : createExtraDeckEntry(entry.definitionId, normalizeFinish(entry.finish)))
    : [];
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
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id));
  if (!sorted.length) return [];

  const counts = new Map<string, number>();
  let remaining = targetCopies;

  for (const def of sorted) {
    if (remaining <= 0) break;
    counts.set(def.id, 1);
    remaining -= 1;
  }

  while (remaining > 0) {
    let placed = false;
    for (const def of sorted) {
      if (remaining <= 0) break;
      const current = counts.get(def.id) ?? 0;
      if (current >= 4) continue;
      counts.set(def.id, current + 1);
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
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, 5)
    .map(def => ({ definitionId: def.id, finish: 'normal' as const }));
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
  const pool = CardRegistry.getAll().filter(def => def.element === 'Neutrality' && def.rarity === rarity);
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

function awardBossVictoryRewards(progress: ProgressState, boss: (typeof BOSS_DEFINITIONS)[number]): void {
  const priorClears = progress.bossClearCounts[boss.id] ?? 0;
  progress.bossClearCounts[boss.id] = priorClears + 1;
  const base = priorClears === 0 ? boss.firstClearShards : boss.repeatClearShards;
  const mult = getBossRewardMultiplier(boss.id);
  progress.aberratedShards += Math.round(base * mult);
  addCollectionCard(progress, boss.rewardCardId, 'holo');
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
  if (def.element) {
    emitQuestProgressToProgress(s.progress, { kind: 'play_cards_of_element', amount: 1, element: def.element });

    // Track unique elements played this turn for 'play_unique_sets_in_turn' quests.
    const played = s.turn.uniqueElementsPlayedThisTurn ?? [];
    if (!played.includes(def.element)) {
      s.turn.uniqueElementsPlayedThisTurn = [...played, def.element];
    }
    const uniqueSetCount = (s.turn.uniqueElementsPlayedThisTurn ?? played).length;
    emitQuestProgressToProgress(s.progress, { kind: 'play_unique_sets_in_turn', amount: 0, peak: uniqueSetCount });
  }
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
      s.deck = { ...s.deck, hand: [], drawPile: DeckSystem.shuffle([...s.deck.hand, ...s.deck.drawPile, ...s.deck.discardPile]), discardPile: [] };
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
      awardBossVictoryRewards(s.progress, boss);
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
      const masteryPerCard = getBossFightMasteryPerCard(
        bossIdx,
        BOSS_DEFINITIONS.length,
        kind === 'trial' ? trialMult : 1,
        kind === 'trial' ? MAX_MASTERY_PROGRESS_PER_CARD_TRIAL_GAUNTLET : MAX_MASTERY_PROGRESS_PER_CARD_BOSS,
      );
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
  // Full-board bonus: +30% when all 9 board slots are filled.
  if (s.computedStats.fullBoardActive) {
    amount = Math.round(amount * 1.30);
  }
  s.turn.oblivionEarnedThisTurn += amount;
  if (s.bossFight.mode === 'active') {
    s.bossFight.damageDealtThisFight += amount;
    const fightSeconds = s.bossFight.kind === 'null_raid' ? NULL_RAID_ENCOUNTER_SECONDS : BOSS_FIGHT_ROUND_SECONDS;
    const elapsed = Math.max(0, fightSeconds - s.bossFight.fightTimeRemaining);
    if (elapsed < NULL_RAID_PROVE_YOURSELF_SECONDS) {
      s.bossFight.damageDealtFirstMinute = (s.bossFight.damageDealtFirstMinute ?? 0) + amount;
      if (s.bossFight.kind === 'null_raid') {
        const best = s.bossFight.nullRaidBestDamageFirstMinute ?? 0;
        s.bossFight.nullRaidBestDamageFirstMinute = Math.max(best, s.bossFight.damageDealtFirstMinute ?? 0);
      }
    }
    s.bossFight.bossCurrentHp = Math.max(0, s.bossFight.bossCurrentHp - amount);
    eventBus.emit('boss:damaged', { delta: amount, remaining: s.bossFight.bossCurrentHp });
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

function effectCanDraw(effect: CardEffect): boolean {
  switch (effect.type) {
    case 'draw':
    case 'discard_draw':
    case 'look_top_take':
    case 'look_top_take_drop':
    case 'look_top_take_type':
    case 'search_deck_by_type':
    case 'salvage_by_type':
    case 'salvage_any':
      return true;
    case 'conditional':
      return effect.then.some(sub => effectCanDraw(sub));
    case 'overclock':
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
  if (turn.crossSetConversionDistinctSources === undefined) turn.crossSetConversionDistinctSources = [];
  if (turn.neutralityEngineSignatures === undefined) turn.neutralityEngineSignatures = [];
  if (turn.neutralityPatienceChargedThisTurn === undefined) turn.neutralityPatienceChargedThisTurn = 0;
  if (turn.neutralityPatienceConsumedThisTurn === undefined) turn.neutralityPatienceConsumedThisTurn = 0;
  if (turn.neutralityChainGainedThisTurn === undefined) turn.neutralityChainGainedThisTurn = 0;
  if (turn.neutralityPatientLightStacks === undefined) turn.neutralityPatientLightStacks = 0;
  if (turn.neutralityEquilibriumSigils === undefined) turn.neutralityEquilibriumSigils = 0;
  if (turn.neutralityEquilibriumSigilsGainedThisTurn === undefined) turn.neutralityEquilibriumSigilsGainedThisTurn = 0;
  if (turn.neutralityEquilibriumPatientLightFromSigilsThisTurn === undefined) turn.neutralityEquilibriumPatientLightFromSigilsThisTurn = 0;
  if (turn.neutralityEquilibriumSigilCapBonus === undefined) turn.neutralityEquilibriumSigilCapBonus = 0;
  if (turn.neutralityEquilibriumSentinelTempoUsed === undefined) turn.neutralityEquilibriumSentinelTempoUsed = false;
  if (turn.neutralityTriggeredEffects === undefined) turn.neutralityTriggeredEffects = [];
  if (turn.lastPlayedElement === undefined) turn.lastPlayedElement = null;
}

function ensurePyroTurnState(turn: TurnState): void {
  if (turn.pyroHeat === undefined) turn.pyroHeat = 0;
  if (turn.lastPlayedElement === undefined) turn.lastPlayedElement = null;
}

function ensureLightTurnState(turn: TurnState): void {
  if (turn.lightCadenceNotes === undefined) turn.lightCadenceNotes = [];
  if (turn.lightDistinctNotes === undefined) turn.lightDistinctNotes = [];
  if (turn.lightResonance === undefined) turn.lightResonance = 0;
}

function ensureThornboundTurnState(turn: TurnState): void {
  if (turn.thornScar === undefined) turn.thornScar = 0;
}

function ensureMechanicalTurnState(_turn: TurnState): void {
  // Mechanical Dreams uses only base TurnState.strain; no extra state required.
}

function ensurePrismaticTurnState(turn: TurnState): void {
  if (turn.prismaticCurrentChannel === undefined) turn.prismaticCurrentChannel = null;
  if (turn.prismaticDistinctChannels === undefined) turn.prismaticDistinctChannels = [];
  if (turn.prismaticRecentChannels === undefined) turn.prismaticRecentChannels = [];
  if (turn.prismaticRefractionDepth === undefined) turn.prismaticRefractionDepth = 0;
  if (turn.prismaticNodeCharges === undefined) turn.prismaticNodeCharges = 0;
  if (turn.prismaticResonanceCharge === undefined) turn.prismaticResonanceCharge = 0;
}

function ensureBlackGlassTurnState(turn: TurnState): void {
  if (turn.blackGlassWhiteFlame === undefined) turn.blackGlassWhiteFlame = 0;
  if (turn.blackGlassBlackFlame === undefined) turn.blackGlassBlackFlame = 0;
  if (turn.blackGlassFracture === undefined) turn.blackGlassFracture = 0;
  if (turn.blackGlassLastPolarity === undefined) turn.blackGlassLastPolarity = null;
  if (turn.blackGlassLastPayoff === undefined) turn.blackGlassLastPayoff = 0;
}

function ensureSnowboundTurnState(turn: TurnState): void {
  if (turn.snowboundPhase === undefined) turn.snowboundPhase = null;
  if (turn.snowboundPotential === undefined) turn.snowboundPotential = 0;
  if (turn.snowboundAlternations === undefined) turn.snowboundAlternations = 0;
  if (turn.snowboundConduits === undefined) turn.snowboundConduits = 0;
  if (turn.snowboundPreviousPhase === undefined) turn.snowboundPreviousPhase = null;
  if (turn.snowboundAlternatedThisTurn === undefined) turn.snowboundAlternatedThisTurn = false;
  if (turn.snowboundOnBoardEffects === undefined) turn.snowboundOnBoardEffects = [];
}

function ensureGlassAbsoluteTurnState(turn: TurnState): void {
  if (turn.glassProofFragments === undefined) turn.glassProofFragments = 0;
  if (turn.glassProofDepth === undefined) turn.glassProofDepth = 0;
  if (turn.glassProofCascade === undefined) turn.glassProofCascade = 0;
  if (turn.glassAxioms === undefined) turn.glassAxioms = [];
  if (turn.glassArchiveSeals === undefined) turn.glassArchiveSeals = 0;
  if (turn.glassAngleCharges === undefined) turn.glassAngleCharges = 0;
  if (turn.glassOriginPulseUsed === undefined) turn.glassOriginPulseUsed = false;
  if (turn.glassAxiomFocus === undefined) turn.glassAxiomFocus = null;
  if (turn.glassSnapshotFragments === undefined) turn.glassSnapshotFragments = 0;
  if (turn.glassSnapshotDepth === undefined) turn.glassSnapshotDepth = 0;
  if (turn.glassSnapshotCascade === undefined) turn.glassSnapshotCascade = 0;
  if (turn.glassSnapshotAxioms === undefined) turn.glassSnapshotAxioms = 0;
  if (turn.glassWaveQueue === undefined) turn.glassWaveQueue = 0;
  if (turn.glassDepthFloor === undefined) turn.glassDepthFloor = 0;
  if (turn.glassDepthFloorIncreased === undefined) turn.glassDepthFloorIncreased = false;
  if (turn.glassWhiteLedger === undefined) turn.glassWhiteLedger = 0;
  if (turn.glassWhiteLedgerActive === undefined) turn.glassWhiteLedgerActive = false;
  if (turn.glassSyntheticFragments === undefined) turn.glassSyntheticFragments = 0;
  if (turn.glassSyntheticCascade === undefined) turn.glassSyntheticCascade = 0;
}

function ensureButterflyTurnState(turn: TurnState): void {
  if (turn.butterflySpectrum === undefined) turn.butterflySpectrum = 0;
  if (turn.butterflyStance === undefined) turn.butterflyStance = null;
  if (turn.butterflyFlutterLevel === undefined) turn.butterflyFlutterLevel = 0;
  if (turn.butterflyFormation === undefined) turn.butterflyFormation = 0;
  if (turn.butterflyFormationTypesSeen === undefined) turn.butterflyFormationTypesSeen = [];
}

type ButterflyFormationUnitType = 'Seraphim' | 'Cherubim' | 'Ophanim' | 'Angel';

function consumeButterflyEchoCharge(turn: TurnState): boolean {
  const counters = (turn.secondaryCounters ?? (turn.secondaryCounters = {})) as Record<string, number>;
  const available = Math.max(0, counters.flutter ?? 0);
  if (available <= 0) return false;
  counters.flutter = available - 1;
  return true;
}

function applyButterflyBreakpointReward(s: Store, breakpoint: 4 | 8 | 12): void {
  const upgraded = consumeButterflyEchoCharge(s.turn);

  if (breakpoint === 4) {
    s.deck = TurnSystem.drawCards(s.deck, upgraded ? 2 : 1);
    return;
  }

  if (breakpoint === 8) {
    s.turn.nextCardMultiplied = true;
    if (upgraded) s.deck = TurnSystem.drawCards(s.deck, 1);
    return;
  }

  s.turn.nextCardMultiplied = true;
  s.deck = TurnSystem.drawCards(s.deck, upgraded ? 2 : 1);
  s.turn.butterflySpectrum = 0;
  s.turn.butterflyFlutterLevel = 0;
  s.turn.butterflyFormation = 0;
  s.turn.butterflyFormationTypesSeen = [];
  s.turn.butterflyStance = null;
}

function getButterflyFormationUnitType(def: CardDefinition): ButterflyFormationUnitType | null {
  if (def.element !== 'Butterfly') return null;
  if (def.rarity === 'Eternal' || def.rarity === 'Infinite') return null;
  if (def.type === 'Seraphim' || def.type === 'Cherubim' || def.type === 'Ophanim' || def.type === 'Angel') {
    return def.type;
  }
  return null;
}

function applyButterflyBasePlayProgression(s: Store, def: CardDefinition): void {
  const formationType = getButterflyFormationUnitType(def);
  if (!formationType) return;

  ensureButterflyTurnState(s.turn);

  const formationSeen = new Set<ButterflyFormationUnitType>(s.turn.butterflyFormationTypesSeen ?? []);
  if (!formationSeen.has(formationType)) {
    formationSeen.add(formationType);
    s.turn.butterflyFormationTypesSeen = Array.from(formationSeen);
    s.turn.butterflyFormation = Math.min(4, formationSeen.size);
  }

  const gain = formationType === 'Ophanim' ? 2 : 1;
  const prior = Math.max(0, s.turn.butterflySpectrum ?? 0);
  const next = Math.min(12, prior + gain);
  s.turn.butterflySpectrum = next;

  if (prior < 4 && next >= 4) {
    applyButterflyBreakpointReward(s, 4);
  }
  if (prior < 8 && next >= 8) {
    applyButterflyBreakpointReward(s, 8);
  }
  if (prior < 12 && next >= 12) {
    applyButterflyBreakpointReward(s, 12);
    return;
  }

  const current = Math.max(0, s.turn.butterflySpectrum ?? 0);
  s.turn.butterflyFlutterLevel = current >= 8 ? 2 : current >= 4 ? 1 : 0;
}

function ensureEternalSeasTurnState(turn: TurnState): void {
  if (turn.eternalSeasUndertow === undefined) turn.eternalSeasUndertow = 0;
  if (turn.eternalSeasFoam === undefined) turn.eternalSeasFoam = 0;
  if (turn.eternalSeasCurrent === undefined) turn.eternalSeasCurrent = 0;
  if (turn.eternalSeasPolarity === undefined) turn.eternalSeasPolarity = null;
  if (turn.eternalSeasWhiteFlow === undefined) turn.eternalSeasWhiteFlow = 0;
  if (turn.eternalSeasBlackFlow === undefined) turn.eternalSeasBlackFlow = 0;
  if (turn.eternalSeasMarginCharge === undefined) turn.eternalSeasMarginCharge = 0;
}

export function ensureAbyssalForgeTurnState(turn: TurnState): void {
  if (turn.recastLedger === undefined) turn.recastLedger = [];
  if (turn.reforgeCharges === undefined) turn.reforgeCharges = 0;
  if (turn.reforgeChargeCap === undefined) turn.reforgeChargeCap = 6;
  if (turn.pearls === undefined) turn.pearls = 0;
  if (turn.unrecordedHueActive === undefined) turn.unrecordedHueActive = false;
  if (turn.forgeRecastEventsThisTurn === undefined) turn.forgeRecastEventsThisTurn = 0;
  if (turn.forgePendingCherubimTemper === undefined) turn.forgePendingCherubimTemper = 0;
}

function appendDistinct<T>(items: T[] | undefined, item: T, limit: number): T[] {
  const next = [...(items ?? []).filter(existing => existing !== item), item];
  return next.slice(-limit);
}

function isSnowboundVoltageCard(def: CardDefinition | undefined): boolean {
  return Boolean(def && (def.definitionId.startsWith('sv-') || def.definitionId.startsWith('inf-sv-')));
}

function isMechanicalDreamsCard(def: CardDefinition | undefined): boolean {
  return Boolean(def && def.element === 'Mechanical' && !isSnowboundVoltageCard(def));
}

function isBlackGlassCard(def: CardDefinition | undefined): boolean {
  return Boolean(def && def.element === 'Dark');
}

function isHighRarityMechanicCard(def: CardDefinition | undefined): boolean {
  return Boolean(def && (
    def.rarity === 'Eternal'
    || def.rarity === 'Infinite'
    || def.definitionId.startsWith('tx-')
  ));
}

type AdvancedSetKey = 'glass' | 'light' | 'mech' | 'prism';

function matchesAdvancedSetKey(def: CardDefinition | undefined, key: AdvancedSetKey): boolean {
  if (!def) return false;

  switch (key) {
    case 'glass':
      return isBlackGlassCard(def);
    case 'light':
      return def.element === 'Light';
    case 'mech':
      return isMechanicalDreamsCard(def);
    case 'prism':
      return def.element === 'Prismatic';
  }
}

function boardHasAdvancedSetEnabler(board: BoardState, key: AdvancedSetKey): boolean {
  for (const slot of board.frontSlots) {
    if (!slot) continue;
    const def = CardRegistry.get(slot.definitionId);
    if (matchesAdvancedSetKey(def, key) && isHighRarityMechanicCard(def)) {
      return true;
    }
  }

  for (const slot of board.backSlots) {
    if (!slot) continue;
    const def = CardRegistry.get(slot.definitionId);
    if (matchesAdvancedSetKey(def, key) && isHighRarityMechanicCard(def)) {
      return true;
    }
  }

  return false;
}

function canUseAdvancedSetMechanics(board: BoardState, def: CardDefinition | undefined, key: AdvancedSetKey): boolean {
  return (matchesAdvancedSetKey(def, key) && isHighRarityMechanicCard(def))
    || boardHasAdvancedSetEnabler(board, key);
}

function storeContainsCard(s: Store, predicate: (def: CardDefinition) => boolean): boolean {
  const visit = (definitionId: string): boolean => {
    const def = CardRegistry.get(definitionId);
    return Boolean(def && predicate(def));
  };

  for (const entry of s.deck.deckList) {
    if (visit(entry.definitionId)) return true;
  }
  for (const entry of s.deck.extraDeck) {
    if (visit(entry.definitionId)) return true;
  }
  for (const card of s.deck.drawPile) {
    if (visit(card.definitionId)) return true;
  }
  for (const card of s.deck.hand) {
    if (visit(card.definitionId)) return true;
  }
  for (const card of s.deck.discardPile) {
    if (visit(card.definitionId)) return true;
  }
  for (const slot of s.board.frontSlots) {
    if (slot && visit(slot.definitionId)) return true;
  }
  for (const slot of s.board.backSlots) {
    if (slot && visit(slot.definitionId)) return true;
  }

  return false;
}

function captureTurnSnapshot(turn: TurnState): TurnState {
  return {
    ...turn,
    attenuationClassUses: { ...(turn.attenuationClassUses ?? {}) },
    attenuationBrokenClasses: [...(turn.attenuationBrokenClasses ?? [])],
    crossSetConversionDistinctSources: [...(turn.crossSetConversionDistinctSources ?? [])],
    neutralityEngineSignatures: [...(turn.neutralityEngineSignatures ?? [])],
    lightCadenceNotes: [...(turn.lightCadenceNotes ?? [])],
    lightDistinctNotes: [...(turn.lightDistinctNotes ?? [])],
    prismaticDistinctChannels: [...(turn.prismaticDistinctChannels ?? [])],
    prismaticRecentChannels: [...(turn.prismaticRecentChannels ?? [])],
    glassAxioms: [...(turn.glassAxioms ?? [])],
    burningGardenLineagesPlayed: [...(turn.burningGardenLineagesPlayed ?? [])],
    burningGardenIncandescentSnapshot: [...(turn.burningGardenIncandescentSnapshot ?? [])],
  };
}

function getHeavenlyNote(def: CardDefinition): import('@/types/game').HeavenlyNote {
  return def.type;
}

function getPrismaticChannel(def: CardDefinition): import('@/types/game').PrismaticChannel {
  const id = def.definitionId.toLowerCase();
  if (id.includes('gold') || id.includes('sun') || id.includes('aurel')) return 'amber';
  if (id.includes('sky') || id.includes('storm') || id.includes('aurora') || id.includes('ice')) return 'azure';
  if (id.includes('rose') || id.includes('ember') || id.includes('flame')) return 'crimson';
  if (id.includes('plain') || id.includes('root') || id.includes('grove') || id.includes('verd')) return 'emerald';
  if (id.includes('mirror') || id.includes('veil') || id.includes('refraction') || id.includes('spectrum')) return 'violet';
  if (def.type === 'Angel' || def.rarity === 'Eternal' || def.rarity === 'Infinite') return 'white';
  if (def.type === 'Cherubim') return 'emerald';
  if (def.type === 'Ophanim') return 'violet';
  return 'amber';
}

function getSnowboundPhase(actionClass: AttenuationClass): import('@/types/game').SnowboundPhase {
  return actionClass === 'setup' || actionClass === 'refund' ? 'Frost' : 'Voltage';
}

function getSnowboundCardPhase(
  def: CardDefinition,
  actionClass: AttenuationClass,
): import('@/types/game').SnowboundPhase {
  return def.snowboundPhase ?? getSnowboundPhase(actionClass);
}

function getGlassNeighbors(key: string): string[] {
  const [row, rawIndex] = key.split(':');
  const index = Number(rawIndex);

  if (row === 'front') {
    const neighbors: string[] = [];
    if (index > 0) neighbors.push(`front:${index - 1}`);
    if (index < 4) neighbors.push(`front:${index + 1}`);
    if (index > 0) neighbors.push(`back:${index - 1}`);
    if (index < 4) neighbors.push(`back:${index}`);
    return neighbors;
  }

  const neighbors: string[] = [];
  if (index > 0) neighbors.push(`back:${index - 1}`);
  if (index < 3) neighbors.push(`back:${index + 1}`);
  neighbors.push(`front:${index}`);
  if (index < 4) neighbors.push(`front:${index + 1}`);
  return neighbors;
}

function computeGlassProofMetrics(board: BoardState): { fragments: number; proofs: number; depth: number } {
  const nodes = new Map<string, { depth: number; tokens: number }>();

  board.frontSlots.forEach((slot, index) => {
    if (!slot) return;
    const def = CardRegistry.get(slot.definitionId);
    if (!def || def.element !== 'GlassAbsolute') return;
    nodes.set(`front:${index}`, { depth: slot.prismaticDepth ?? 0, tokens: slot.spectrumTokens ?? 0 });
  });

  board.backSlots.forEach((slot, index) => {
    if (!slot) return;
    const def = CardRegistry.get(slot.definitionId);
    if (!def || def.element !== 'GlassAbsolute') return;
    nodes.set(`back:${index}`, { depth: slot.prismaticDepth ?? 0, tokens: slot.spectrumTokens ?? 0 });
  });

  let links = 0;
  let depth = 0;
  const visitedEdges = new Set<string>();

  for (const [key, node] of nodes.entries()) {
    depth = Math.max(depth, node.depth + node.tokens);
    for (const neighborKey of getGlassNeighbors(key)) {
      const neighbor = nodes.get(neighborKey);
      if (!neighbor) continue;

      const edgeKey = [key, neighborKey].sort().join('|');
      if (visitedEdges.has(edgeKey)) continue;
      visitedEdges.add(edgeKey);
      links += 1;
    }
  }

  return {
    fragments: nodes.size,
    proofs: links,
    depth,
  };
}

function hasFrontDefinition(board: BoardState, definitionId: string): boolean {
  return board.frontSlots.some(slot => slot?.definitionId === definitionId);
}

function hasBackDefinition(board: BoardState, definitionId: string): boolean {
  return board.backSlots.some(slot => slot?.definitionId === definitionId);
}

function recordLossEvent(
  s: Store,
  lostCards: Array<{ definitionId: string }>,
  _source: 'discard' | 'board' | 'sacrifice' | 'expire',
): void {
  if (lostCards.length === 0) return;

  if (boardHasAdvancedSetEnabler(s.board, 'glass')) {
    ensureBlackGlassTurnState(s.turn);
    let white = s.turn.blackGlassWhiteFlame ?? 0;
    let black = s.turn.blackGlassBlackFlame ?? 0;
    for (let i = 0; i < lostCards.length; i++) {
      if (white <= black) white += 1;
      else black += 1;
    }
    s.turn.blackGlassWhiteFlame = Math.min(30, white);
    s.turn.blackGlassBlackFlame = Math.min(30, black);
    if (Math.abs((s.turn.blackGlassWhiteFlame ?? 0) - (s.turn.blackGlassBlackFlame ?? 0)) <= 2) {
      s.turn.blackGlassFracture = Math.min(18, (s.turn.blackGlassFracture ?? 0) + 1);
    }
  }
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
    if (def) setKeys.add(def.element);
  }
  for (const entry of s.deck.extraDeck) {
    const def = CardRegistry.get(entry.definitionId);
    if (def) setKeys.add(def.element);
  }
  return Math.max(1, setKeys.size);
}

function getNeutralityFullFireMultiplier(s: Store, def: CardDefinition): number {
  if (def.element !== 'Neutrality' || def.rarity !== 'Infinite') return 1;
  ensureNeutralityTurnState(s.turn);
  const setupReady = (s.turn.neutralitySetupCount ?? 0) >= NEUTRALITY_SETUP_FOR_FULL_FIRE;
  const enginesReady = (s.turn.neutralityEngineSignatures?.length ?? 0) >= NEUTRALITY_ENGINES_FOR_FULL_FIRE;
  return setupReady && enginesReady ? 1.35 : 0.70;
}

function getPyroInfinitePayoutMultiplier(s: Store, def: CardDefinition): number {
  if (def.element !== 'Fire' || def.rarity !== 'Infinite') return 1;
  ensurePyroTurnState(s.turn);
  return 1 + getArtifactEffect(s.turn, 'pyro_infinite_payout_bonus', s.progress.ownedArtifacts);
}

function getPyroFurnaceAttackMultiplier(s: Store, def: CardDefinition): number {
  if (def.element !== 'Fire') return 1;
  ensurePyroTurnState(s.turn);
  const heat = Math.max(0, s.turn.pyroHeat ?? 0);
  // Fire attacks gain +2.5% per Heat, capped at +75%.
  return 1 + Math.min(0.75, heat * 0.025);
}

function consumePyroHeatAttackAmplifier(s: Store, def: CardDefinition): number {
  if (def.element !== 'Fire') return 1;
  ensurePyroTurnState(s.turn);
  const available = Math.max(0, Math.floor(s.turn.pyroHeat ?? 0));
  const consume = Math.min(5, available);
  if (consume <= 0) return 1;
  s.turn.pyroHeat = available - consume;
  // Slight bonus so Heat spend is meaningful without overshadowing base scaling.
  return 1 + (consume * 0.01);
}

function getPyroChromaAttackMultiplier(s: Store, def: CardDefinition): number {
  if (def.element !== 'Fire' || (def.rarity !== 'Eternal' && def.rarity !== 'Infinite')) return 1;
  const chromaEmbers = Math.max(0, s.turn.secondaryCounters?.pyro ?? 0);
  // Fire Eternal/Infinite attacks gain Chroma Ember scaling.
  // Eternal is intentionally weaker than Infinite.
  if (def.rarity === 'Eternal') {
    return 1 + Math.min(0.16, chromaEmbers * 0.04);
  }
  return 1 + Math.min(0.25, chromaEmbers * 0.05);
}

function countBurningGardenEngines(board: BoardState): number {
  let engines = 0;
  for (const slot of board.frontSlots) {
    if (!slot) continue;
    const def = CardRegistry.get(slot.definitionId);
    if (isBurningGardenCard(def) && slot.burningGardenPhase === 'Burn') engines += 1;
  }
  for (const slot of board.backSlots) {
    if (!slot) continue;
    const def = CardRegistry.get(slot.definitionId);
    if (isBurningGardenCard(def) && slot.burningGardenPhase === 'Burn') engines += 1;
  }
  return engines;
}

function getLightFullFireMultiplier(s: Store, def: CardDefinition): number {
  if (def.element !== 'Light' || def.rarity !== 'Infinite') return 1;
  ensureLightTurnState(s.turn);
  const resonance = s.turn.lightResonance ?? 0;
  const noteCount = new Set(s.turn.lightDistinctNotes ?? []).size;
  const setupReady = resonance >= 3;
  const enginesReady = noteCount >= 3;
  return setupReady && enginesReady ? 1.35 : 0.70;
}

function getThornboundFullFireMultiplier(s: Store, def: CardDefinition): number {
  if (def.element !== 'Thornbound' || def.rarity !== 'Infinite') return 1;
  ensureThornboundTurnState(s.turn);
  const scar = s.turn.thornScar ?? 0;
  const setupReady = s.turn.trail >= 8;
  const enginesReady = scar >= 4;
  return setupReady && enginesReady ? 1.35 : 0.70;
}

function getMechanicalFullFireMultiplier(s: Store, def: CardDefinition): number {
  if (!isMechanicalDreamsCard(def) || def.rarity !== 'Infinite') return 1;
  const strain = Math.max(0, s.turn.strain ?? 0);
  const reactorCores = Math.max(0, s.turn.eternalStacks?.mech ?? 0);
  const setupReady = strain >= 6;
  const enginesReady = reactorCores >= 4;
  return setupReady && enginesReady ? 1.35 : 0.70;
}

function getPrismaticFullFireMultiplier(s: Store, def: CardDefinition): number {
  if (def.element !== 'Prismatic' || def.rarity !== 'Infinite') return 1;
  ensurePrismaticTurnState(s.turn);
  const setupReady = new Set(s.turn.prismaticDistinctChannels ?? []).size >= 4;
  const enginesReady = (s.turn.prismaticRefractionDepth ?? 0) >= 3;
  return setupReady && enginesReady ? 1.35 : 0.70;
}

function getDarkFullFireMultiplier(s: Store, def: CardDefinition): number {
  if (!isBlackGlassCard(def) || def.rarity !== 'Infinite') return 1;
  ensureBlackGlassTurnState(s.turn);
  const white = s.turn.blackGlassWhiteFlame ?? 0;
  const black = s.turn.blackGlassBlackFlame ?? 0;
  const setupReady = (s.turn.blackGlassFracture ?? 0) >= 2;
  const enginesReady = Math.min(white, black) >= 6 && Math.abs(white - black) <= 2;
  return setupReady && enginesReady ? 1.35 : 0.70;
}

function countBlackGlassFlameEffects(effects: CardEffect[]): { white: number; black: number } {
  let white = 0;
  let black = 0;
  for (const effect of effects) {
    if (effect.type === 'black_glass_white_flame_gain') {
      white += effect.value;
    } else if (effect.type === 'black_glass_black_flame_gain') {
      black += effect.value;
    } else if (effect.type === 'conditional') {
      const nested = countBlackGlassFlameEffects(effect.then);
      white += nested.white;
      black += nested.black;
    }
  }
  return { white, black };
}

function resolveBlackGlassPolarity(whiteGain: number, blackGain: number): 'white' | 'black' | 'both' | null {
  if (whiteGain > 0 && blackGain > 0) return 'both';
  if (whiteGain > 0) return 'white';
  if (blackGain > 0) return 'black';
  return null;
}

function getSnowboundFullFireMultiplier(s: Store, def: CardDefinition): number {
  if (!isSnowboundVoltageCard(def) || def.rarity !== 'Infinite') return 1;
  ensureSnowboundTurnState(s.turn);
  const setupReady = (s.turn.snowboundPhase ?? null) === 'Voltage';
  const enginesReady = (s.turn.arcticCharge ?? 0) >= 12;
  return setupReady && enginesReady ? 1.35 : 0.70;
}

function getGlassAbsoluteFullFireMultiplier(s: Store, def: CardDefinition): number {
  if (def.element !== 'GlassAbsolute' || def.rarity !== 'Infinite') return 1;
  ensureGlassAbsoluteTurnState(s.turn);
  const refractionCharge = Math.max(0, s.turn.secondaryCounters?.absol ?? 0);
  const fragments = (s.turn.glassProofFragments ?? 0) + (s.turn.glassSyntheticFragments ?? 0);
  const setupReady = refractionCharge >= 8;
  const enginesReady = fragments >= 5 && ((s.turn.glassWaveQueue ?? 0) >= 2 || (s.turn.glassWhiteLedgerActive ?? false));
  return setupReady && enginesReady ? 1.35 : 0.70;
}

function isBaseGlassAbsoluteCard(def: CardDefinition): boolean {
  return def.element === 'GlassAbsolute' && (
    def.rarity === 'Common'
    || def.rarity === 'Rare'
    || def.rarity === 'Epic'
    || def.rarity === 'Legendary'
  );
}

function getBlazingGardenFullFireMultiplier(s: Store, def: CardDefinition): number {
  if (def.element !== 'BlazingGarden' || def.rarity !== 'Infinite') return 1;
  ensureBurningGardenTurnState(s.turn);

  if ((s.turn.burningGardenZenithNextInfinite ?? false) && def.definitionId !== 'bg-inf-noon-that-never-sets') {
    s.turn.burningGardenZenithNextInfinite = false;
    return 1.35;
  }

  const setupReady = s.turn.cardsPlayedThisTurn >= 4 || (s.turn.burningGardenTransitGateCredit ?? 0) > 0;
  const enginesReady = countBurningGardenEngines(s.board) >= 2 && (s.board.emberGrove?.length ?? 0) >= 1;
  return setupReady && enginesReady ? 1.35 : 0.70;
}

function getButterflyFullFireMultiplier(s: Store, def: CardDefinition): number {
  if (def.element !== 'Butterfly' || def.rarity !== 'Infinite') return 1;
  ensureButterflyTurnState(s.turn);
  const setupReady = (s.turn.butterflySpectrum ?? 0) >= 8;
  const enginesReady = (s.turn.butterflyFlutterLevel ?? 0) >= 2;
  return setupReady && enginesReady ? 1.35 : 0.70;
}

function getEternalSeasFullFireMultiplier(s: Store, def: CardDefinition): number {
  if (def.element !== 'EternalSeas' || def.rarity !== 'Infinite') return 1;
  ensureEternalSeasTurnState(s.turn);
  const setupReady = (s.turn.eternalSeasCurrent ?? 0) >= 9;
  const enginesReady = (s.turn.eternalSeasMarginCharge ?? 0) >= 3;
  return setupReady && enginesReady ? 1.35 : 0.70;
}

function getSetFullFireMultiplier(s: Store, def: CardDefinition): number {
  return getNeutralityFullFireMultiplier(s, def)
    * getLightFullFireMultiplier(s, def)
    * getThornboundFullFireMultiplier(s, def)
    * getMechanicalFullFireMultiplier(s, def)
    * getPrismaticFullFireMultiplier(s, def)
    * getDarkFullFireMultiplier(s, def)
    * getSnowboundFullFireMultiplier(s, def)
    * getGlassAbsoluteFullFireMultiplier(s, def)
    * getBlazingGardenFullFireMultiplier(s, def)
    * getButterflyFullFireMultiplier(s, def)
    * getEternalSeasFullFireMultiplier(s, def);
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
  beforeTurn: TurnState,
  actionClass: AttenuationClass,
): void {
  if (def.element !== 'Neutrality') {
    s.turn.lastPlayedElement = def.element;
    return;
  }

  ensureNeutralityTurnState(s.turn);

  const pyroHeatDelta = (s.turn.pyroHeat ?? 0) - (beforeTurn.pyroHeat ?? 0);
  const radianceDelta = (s.turn.radiance ?? 0) - (beforeTurn.radiance ?? 0);
  const trailDelta = (s.turn.trail ?? 0) - (beforeTurn.trail ?? 0);
  const strainDelta = (s.turn.strain ?? 0) - (beforeTurn.strain ?? 0);
  const gain = [pyroHeatDelta, radianceDelta, trailDelta, strainDelta].filter(v => v > 0).reduce((sum, v) => sum + v, 0);
  const spend = [pyroHeatDelta, radianceDelta, trailDelta, strainDelta].filter(v => v < 0).reduce((sum, v) => sum + Math.abs(v), 0);

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
    const previousElement = beforeTurn.lastPlayedElement;
    if (previousElement && previousElement !== def.element) {
      const nextSources = new Set([...(s.turn.crossSetConversionDistinctSources ?? []), previousElement]);
      s.turn.crossSetConversionDistinctSources = Array.from(nextSources).slice(0, 6);
    }
  }

  s.turn.lastPlayedElement = def.element;
}

function applyPyroPlayState(
  s: Store,
  def: CardDefinition,
  _beforeTurn: TurnState,
  _actionClass: AttenuationClass,
): void {
  if (def.element !== 'Fire') return;

  ensurePyroTurnState(s.turn);

  s.turn.lastPlayedElement = def.element;
}

function applyLightPlayState(
  s: Store,
  def: CardDefinition,
  beforeTurn: TurnState,
  actionClass: AttenuationClass,
): void {
  if (def.element !== 'Light') return;

  ensureLightTurnState(s.turn);

  const advancedLightAccess = canUseAdvancedSetMechanics(s.board, def, 'light');

  const note = getHeavenlyNote(def);
  const previousNotes = beforeTurn.lightCadenceNotes ?? [];
  const previousNote = previousNotes.length > 0 ? previousNotes[previousNotes.length - 1] : undefined;
  const repeatedNote = previousNote === note;

  if (repeatedNote) {
    s.turn.lightCadenceNotes = [note];
    s.turn.lightDistinctNotes = [note];
    if (advancedLightAccess) {
      s.turn.lightResonance = Math.max(0, (s.turn.lightResonance ?? 0) - 1);
    }
  } else {
    s.turn.lightCadenceNotes = [...(s.turn.lightCadenceNotes ?? []), note].slice(-6);
    s.turn.lightDistinctNotes = appendDistinct(s.turn.lightDistinctNotes, note, 4);
    if (advancedLightAccess) {
      s.turn.lightResonance = Math.min(6, (s.turn.lightResonance ?? 0) + 1 + (actionClass === 'multiplier' ? 1 : 0));
    }
  }

  s.turn.lastPlayedElement = def.element;
}

function applyThornboundPlayState(
  s: Store,
  def: CardDefinition,
  actionClass: AttenuationClass,
): void {
  if (def.element !== 'Thornbound') return;

  ensureThornboundTurnState(s.turn);

  s.turn.trail += actionClass === 'setup' || actionClass === 'refund' ? 2 : 1;

  s.turn.lastPlayedElement = def.element;
}

function applyMechanicalPlayState(
  s: Store,
  def: CardDefinition,
  _actionClass: AttenuationClass,
): void {
  if (!isMechanicalDreamsCard(def)) return;
  s.turn.lastPlayedElement = def.element;
}

function applyPrismaticPlayState(
  s: Store,
  def: CardDefinition,
  beforeTurn: TurnState,
  actionClass: AttenuationClass,
): void {
  if (def.element !== 'Prismatic') return;

  ensurePrismaticTurnState(s.turn);

  const advancedPrismaticAccess = canUseAdvancedSetMechanics(s.board, def, 'prism');

  const channel = getPrismaticChannel(def);
  const previousChannel = beforeTurn.prismaticCurrentChannel ?? null;
  const switchedChannel = previousChannel !== null && previousChannel !== channel;

  if (switchedChannel && advancedPrismaticAccess) {
    const depthGain = 1 + (actionClass === 'multiplier' ? 1 : 0);
    s.turn.prismaticRefractionDepth = Math.min(9, (s.turn.prismaticRefractionDepth ?? 0) + depthGain);
    // Channel switch grants +1 Prism Charge (max 3). Eternal/Infinite Prismatic cards
    // build/spend Resonance Charge explicitly via card effects rather than auto-gaining here.
    s.turn.prismaticNodeCharges = Math.min(3, (s.turn.prismaticNodeCharges ?? 0) + 1);
  } else if (previousChannel !== channel && advancedPrismaticAccess) {
    s.turn.prismaticRefractionDepth = Math.max(1, s.turn.prismaticRefractionDepth ?? 0);
  }

  s.turn.prismaticCurrentChannel = channel;
  s.turn.prismaticDistinctChannels = appendDistinct(s.turn.prismaticDistinctChannels, channel, 9);
  s.turn.prismaticRecentChannels = [...(beforeTurn.prismaticRecentChannels ?? []), channel].slice(-3);

  s.turn.lastPlayedElement = def.element;
}

function applyBlackGlassPlayState(
  s: Store,
  def: CardDefinition,
  _actionClass: AttenuationClass,
): void {
  if (!isBlackGlassCard(def)) return;

  ensureBlackGlassTurnState(s.turn);

  if (!canUseAdvancedSetMechanics(s.board, def, 'glass')) {
    s.turn.lastPlayedElement = def.element;
    return;
  }

  const effectCounts = countBlackGlassFlameEffects(getDefinitionOnPlayEffects(def));
  let whiteGain = effectCounts.white;
  let blackGain = effectCounts.black;

  if (whiteGain === 0 && blackGain === 0) {
    if (def.type === 'Cherubim') whiteGain = 2;
    else if (def.type === 'Seraphim' || def.type === 'Ophanim') blackGain = 2;
    else if (def.type === 'Angel') {
      whiteGain = 1;
      blackGain = 1;
    }
  }

  s.turn.blackGlassWhiteFlame = Math.min(30, (s.turn.blackGlassWhiteFlame ?? 0) + whiteGain);
  s.turn.blackGlassBlackFlame = Math.min(30, (s.turn.blackGlassBlackFlame ?? 0) + blackGain);

  const currentPolarity = resolveBlackGlassPolarity(whiteGain, blackGain);
  const previousPolarity = s.turn.blackGlassLastPolarity ?? null;
  const alternated = Boolean(
    previousPolarity && currentPolarity &&
    previousPolarity !== currentPolarity &&
    previousPolarity !== 'both' &&
    currentPolarity !== 'both',
  );

  if (alternated) {
    s.turn.blackGlassFracture = Math.min(18, (s.turn.blackGlassFracture ?? 0) + 1);
    s.turn.blackGlassWhiteFlame = Math.min(30, (s.turn.blackGlassWhiteFlame ?? 0) + 1);
    s.turn.blackGlassBlackFlame = Math.min(30, (s.turn.blackGlassBlackFlame ?? 0) + 1);
    grantOblivion(s, 35);
  }

  const white = s.turn.blackGlassWhiteFlame ?? 0;
  const black = s.turn.blackGlassBlackFlame ?? 0;
  const gap = Math.abs(white - black);

  if (Math.min(white, black) >= 1 && gap <= 1) {
    s.turn.blackGlassFracture = Math.min(18, (s.turn.blackGlassFracture ?? 0) + 1);
    grantOblivion(s, 12);
  }

  if (currentPolarity === 'white' || currentPolarity === 'black') {
    s.turn.blackGlassLastPolarity = currentPolarity;
  } else if (currentPolarity === 'both') {
    s.turn.blackGlassLastPolarity = null;
  }

  s.turn.lastPlayedElement = def.element;
}

function applySnowboundPlayState(
  s: Store,
  def: CardDefinition,
  beforeTurn: TurnState,
  actionClass: AttenuationClass,
): void {
  if (!isSnowboundVoltageCard(def)) return;

  ensureSnowboundTurnState(s.turn);

  const phase = getSnowboundCardPhase(def, actionClass);
  const previousPhase = beforeTurn.snowboundPhase ?? null;
  const shifted = previousPhase !== null && previousPhase !== phase;

  s.turn.snowboundAlternatedThisTurn = shifted;

  if (shifted) {
    s.turn.snowboundAlternations = Math.min(12, (s.turn.snowboundAlternations ?? 0) + 1);
  }

  if (phase === 'Frost') {
    const phaseGain = shifted ? 3 : 2;
    s.turn.arcticCharge = (s.turn.arcticCharge ?? 0) + phaseGain;
  }

  s.turn.snowboundPreviousPhase = s.turn.snowboundPhase;
  s.turn.snowboundPhase = phase;
  s.turn.lastPlayedElement = def.element;
}

function applyGlassAbsolutePlayState(
  s: Store,
  def: CardDefinition,
  beforeTurn: TurnState,
): void {
  if (def.element !== 'GlassAbsolute') return;

  ensureGlassAbsoluteTurnState(s.turn);

  const metrics = computeGlassProofMetrics(s.board);
  const previousProofs = beforeTurn.glassProofCascade ?? 0;
  const newProofs = Math.max(0, metrics.proofs - previousProofs);

  s.turn.glassProofFragments = metrics.fragments;
  s.turn.glassProofDepth = metrics.depth;
  s.turn.glassProofCascade = metrics.proofs;

  if (isBaseGlassAbsoluteCard(def)) {
    // Base Glass loop is fragments-only: no depth/cascade/axiom dependencies.
    const fragments = s.turn.glassProofFragments ?? 0;
    const fragmentPayout = 24 + Math.min(8, fragments) * 18;
    const formationTierBonus = fragments >= 7 ? 120 : fragments >= 5 ? 70 : fragments >= 3 ? 30 : 0;
    grantOblivion(s, fragmentPayout + formationTierBonus);
    s.turn.lastPlayedElement = def.element;
    return;
  }

  if (def.rarity === 'Eternal') {
    const counters = (s.turn.secondaryCounters ?? (s.turn.secondaryCounters = {})) as Record<string, number>;
    let refractionCharge = Math.max(0, counters.absol ?? 0);

    // Lattice Archive passively escalates charge when fresh board links form.
    if (def.definitionId === 'ga-et-lattice-archive-seraph' && newProofs > 0) {
      refractionCharge = Math.min(12, refractionCharge + 1);
      counters.absol = refractionCharge;
    }

    // First White rewards cross-set bridge sequencing with direct charge and burst.
    if (def.definitionId === 'ga-et-first-white' && beforeTurn.lastPlayedElement && beforeTurn.lastPlayedElement !== 'GlassAbsolute') {
      refractionCharge = Math.min(12, refractionCharge + 2);
      counters.absol = refractionCharge;
      grantOblivion(s, 80 + (s.turn.glassProofFragments ?? 0) * 16);
    }

    // Eternal Glass now maps one charge track into tiered axiom support.
    const nextAxioms: Array<import('@/types/game').GlassAxiom> = [];
    if (refractionCharge >= 2) nextAxioms.push('cascade');
    if (refractionCharge >= 4) nextAxioms.push('bridge');
    if (refractionCharge >= 6) nextAxioms.push('multiplier');
    s.turn.glassAxioms = nextAxioms;

    // Charge deepens proof depth so Eternal directly amplifies fragment-linked payouts.
    s.turn.glassProofDepth = Math.max(
      s.turn.glassProofDepth ?? 0,
      Math.min(18, metrics.depth + Math.floor(refractionCharge / 2)),
    );

    if (newProofs > 0) {
      const fragments = s.turn.glassProofFragments ?? 0;
      const formationTier = fragments >= 7 ? 3 : fragments >= 5 ? 2 : fragments >= 3 ? 1 : 0;
      const proofBurst = newProofs * (24 + refractionCharge * 6);
      const formationBurst = formationTier * (32 + refractionCharge * 8);
      grantOblivion(s, proofBurst + formationBurst);
    }

    s.turn.lastPlayedElement = def.element;
    return;
  }

  const counters = (s.turn.secondaryCounters ?? (s.turn.secondaryCounters = {})) as Record<string, number>;
  let refractionCharge = Math.max(0, counters.absol ?? 0);

  // Yreth establishes and extends a minimum charge floor for Infinite turns.
  if (def.definitionId === 'ga-inf-yreth-prism-at-center') {
    s.turn.glassDepthFloor = Math.max(s.turn.glassDepthFloor ?? 0, 6);
    s.turn.glassDepthFloorIncreased = false;
  }
  if ((s.turn.glassDepthFloor ?? 0) > 0) {
    const floor = s.turn.glassDepthFloor ?? 0;
    refractionCharge = Math.max(refractionCharge, floor);
    if (!s.turn.glassDepthFloorIncreased && hasFrontDefinition(s.board, 'ga-inf-yreth-prism-at-center')) {
      s.turn.glassDepthFloor = Math.min(14, floor + 1);
      s.turn.glassDepthFloorIncreased = true;
      refractionCharge = Math.max(refractionCharge, s.turn.glassDepthFloor ?? 0);
    }
    counters.absol = refractionCharge;
  }

  // Refracted Sovereign turns charge into temporary synthetic lattice weight.
  if (def.rarity === 'Infinite' && hasBackDefinition(s.board, 'ga-inf-refracted-sovereign')) {
    s.turn.glassSyntheticFragments = Math.min(5, 1 + Math.floor(refractionCharge / 3));
    s.turn.glassSyntheticCascade = Math.min(3, Math.floor(refractionCharge / 5));
  } else {
    s.turn.glassSyntheticFragments = 0;
    s.turn.glassSyntheticCascade = 0;
  }

  // Infinite Glass keeps a queue for delayed release turns.
  if (hasFrontDefinition(s.board, 'ga-inf-chorus-unbroken-spectrum')) {
    const queueGain = 1 + (refractionCharge >= 8 ? 1 : 0) + (newProofs > 0 ? 1 : 0);
    s.turn.glassWaveQueue = Math.min(12, (s.turn.glassWaveQueue ?? 0) + queueGain);
  }

  // Infinite apex snapshots and delayed ledger converter.
  if (def.definitionId === 'ga-inf-glass-absolute') {
    s.turn.glassSnapshotFragments = (s.turn.glassProofFragments ?? 0) + (s.turn.glassSyntheticFragments ?? 0);
    s.turn.glassSnapshotDepth = refractionCharge;
    s.turn.glassSnapshotCascade = s.turn.glassWaveQueue ?? 0;
    s.turn.glassSnapshotAxioms = Math.min(4, Math.floor(refractionCharge / 3));
  }
  if (def.definitionId === 'ga-inf-color-after-white') {
    const fragments = (s.turn.glassProofFragments ?? 0) + (s.turn.glassSyntheticFragments ?? 0);
    const ledgerSeed = 220 + refractionCharge * 34 + fragments * 26;
    s.turn.glassWhiteLedger = Math.max(s.turn.glassWhiteLedger ?? 0, ledgerSeed);
    s.turn.glassWhiteLedgerActive = true;
  }

  // Infinite plays deliver stronger immediate charge-to-fragment bursts.
  const fragments = (s.turn.glassProofFragments ?? 0) + (s.turn.glassSyntheticFragments ?? 0);
  const formationTier = fragments >= 7 ? 3 : fragments >= 5 ? 2 : fragments >= 3 ? 1 : 0;
  const baselineBurst = 120 + fragments * 26 + refractionCharge * 30;
  const formationBurst = formationTier * (90 + refractionCharge * 16);
  grantOblivion(s, baselineBurst + formationBurst);

  s.turn.lastPlayedElement = def.element;
}

function applyAllSetPlayStates(
  s: Store,
  def: CardDefinition,
  beforeTurn: TurnState,
  actionClass: AttenuationClass,
): void {
  applyNeutralityPlayState(s, def, beforeTurn, actionClass);
  applyPyroPlayState(s, def, beforeTurn, actionClass);
  applyLightPlayState(s, def, beforeTurn, actionClass);
  applyThornboundPlayState(s, def, actionClass);
  applyMechanicalPlayState(s, def, actionClass);
  applyPrismaticPlayState(s, def, beforeTurn, actionClass);
  applyBlackGlassPlayState(s, def, actionClass);
  applySnowboundPlayState(s, def, beforeTurn, actionClass);
  applyGlassAbsolutePlayState(s, def, beforeTurn);
  applyBurningGardenPlayState(s, def, actionClass);
}

function applyBurningGardenPlayState(
  s: Store,
  def: CardDefinition,
  actionClass: AttenuationClass,
): void {
  if (def.element !== 'BlazingGarden') return;
  ensureBurningGardenTurnState(s.turn);

  const lineage = getBurningGardenLineage(def.definitionId);
  const sequence = [...(s.turn.burningGardenLineagesPlayed ?? []), lineage];
  s.turn.burningGardenLineagesPlayed = sequence.slice(-8);

  if (def.rarity === 'Eternal' && s.turn.burningGardenLaw === null) {
    s.turn.burningGardenLaw = lineage;
  }

  if (actionClass === 'conversion' && s.turn.burningGardenLaw === 'Thistle') {
    if (hasBurningGardenCardOnBoard(s, 'bg-et-vethkorath-seven-crown-proof')) {
      s.turn.burningGardenCrownStacks = Math.min(12, (s.turn.burningGardenCrownStacks ?? 0) + 1);
    }
  }

  if ((s.turn.burningGardenSkyLaw ?? null) === 'Sunflower' && actionClass === 'conversion') {
  }

  if (def.definitionId === 'bg-et-serevathi-proofflame') {
    if (s.turn.burningGardenLaw === null) s.turn.burningGardenLaw = 'Rose';
    s.turn.burningGardenNextFinalChordScaleBonus = (s.turn.burningGardenNextFinalChordScaleBonus ?? 0) + 1;
    reviveBurningGardenEcho(s, { consumeEchoUse: false, extraCounters: 1 });
  }

  if (def.definitionId === 'bg-et-aureveth-evernoon') {
    if (s.turn.burningGardenLaw === null) s.turn.burningGardenLaw = 'Sunflower';
    s.turn.burningGardenSunSigils = 0;
  }

  if (hasBurningGardenCardOnBoard(s, 'bg-et-aureveth-evernoon') && actionClass === 'conversion') {
    s.turn.burningGardenSunSigils = (s.turn.burningGardenSunSigils ?? 0) + 1;
    if ((s.turn.burningGardenSunSigils ?? 0) >= 3) {
      s.turn.burningGardenSunSigils = (s.turn.burningGardenSunSigils ?? 0) - 3;
      s.turn.radiance += 10;
      reviveBurningGardenEcho(s, { consumeEchoUse: false, extraCounters: 1 });
    }
  }

  if (def.definitionId === 'bg-et-vethkorath-seven-crown-proof' && s.turn.burningGardenLaw === null) {
    s.turn.burningGardenLaw = 'Thistle';
  }

  if (def.definitionId === 'bg-et-embergrove-codex') {
    const chosenLineage = s.turn.burningGardenLaw ?? lineage;
    s.turn.burningGardenCodexLineage = chosenLineage;
    s.turn.burningGardenCodexCopiesRemaining = 2;
  }

  if (def.definitionId === 'bg-et-noonproof-transit') {
    const candidates: Array<{ definitionId: string; phase?: string }> = [];
    for (const slot of s.board.frontSlots) {
      if (!slot) continue;
      const slotDef = CardRegistry.get(slot.definitionId);
      if (!isBurningGardenCard(slotDef) || slot.burningGardenPhase === 'Burn') continue;
      igniteBurningGardenInstance(slot);
      candidates.push({ definitionId: slot.definitionId, phase: slot.burningGardenPhase });
      if (candidates.length >= 2) break;
    }
    if (candidates.length < 2) {
      for (const slot of s.board.backSlots) {
        if (!slot) continue;
        const slotDef = CardRegistry.get(slot.definitionId);
        if (!isBurningGardenCard(slotDef) || slot.burningGardenPhase === 'Burn') continue;
        igniteBurningGardenInstance(slot);
        candidates.push({ definitionId: slot.definitionId, phase: slot.burningGardenPhase });
        if (candidates.length >= 2) break;
      }
    }
    if (candidates.length >= 2) {
      const distinct = new Set(candidates.map(card => getBurningGardenLineage(card.definitionId))).size;
      if (distinct >= 2) {
        grantOblivion(s, 240);
        s.turn.burningGardenTransitGateCredit = 1;
      }
    }
  }

  if (def.definitionId === 'bg-inf-final-chord-incandescent') {
    s.turn.burningGardenIncandescentSnapshot = (s.turn.burningGardenLineagesPlayed ?? []).slice(-3);
  }

  if (def.definitionId === 'bg-inf-soleth-vair-worldflower') {
    const burningUnits = countBurningGardenEngines(s.board);
    const toSeed = Math.min(4, Math.max(0, burningUnits));
    const emberGrove = s.board.emberGrove ?? (s.board.emberGrove = []);
    for (let i = 0; i < toSeed; i++) {
      const sourceId = `${def.definitionId}:worldflower:${s.turn.turnNumber ?? 0}:${i}:${emberGrove.length}`;
      emberGrove.push({
        definitionId: def.definitionId,
        finish: 'holo',
        sourceId,
        chromaticSources: [sourceId],
        charredAtTurn: s.turn.turnNumber ?? 0,
        lineage,
        memoryPower: 1,
      });
    }
  }

  if (def.definitionId === 'bg-inf-embergrove-resurrection-array') {
    s.turn.burningGardenArrayFreeEchoes = 2;
  }

  if (def.definitionId === 'bg-inf-choir-of-rekindled-geometry') {
    s.turn.burningGardenGeometryMode = isAlternatingLineageRhythm(s.turn.burningGardenLineagesPlayed ?? []);
  }

  if (def.definitionId === 'bg-inf-noon-that-never-sets') {
    const condCards = s.turn.cardsPlayedThisTurn >= 4;
    const condEngines = countBurningGardenEngines(s.board) >= 2;
    const condGrove = (s.board.emberGrove?.length ?? 0) >= 1;

    if (condEngines) grantOblivion(s, 300);
    if (condGrove) s.turn.nextCardMultiplied = true;
    if (condCards && condEngines && condGrove) {
      s.turn.burningGardenZenithNextInfinite = true;
    }
  }

  if (def.definitionId === 'bg-inf-proof-completed-sky') {
    if (s.turn.burningGardenLaw === null) {
      s.turn.burningGardenLaw = 'Rose';
    }
    s.turn.burningGardenSkyLaw = s.turn.burningGardenLaw;
    if (s.turn.burningGardenSkyLaw === 'Sunflower') {
      s.turn.radiance += 8;
    } else if (s.turn.burningGardenSkyLaw === 'Thistle') {
    }
  }
}

function endTurnInternal(s: Store): void {
  if (s.turn.phase !== 'playing') return;
  // Boss fights are time-pressure encounters. Manually ending the turn during
  // an active fight is treated as an immediate failure across all boss modes.
  if (s.bossFight.mode === 'active') {
    completeBossFight(s, false);
    return;
  }

  if ((s.turn.glassWhiteLedgerActive ?? false) && (s.turn.glassWhiteLedger ?? 0) > 0) {
    const ledger = s.turn.glassWhiteLedger ?? 0;
    grantOblivion(s, ledger);
    if ((s.turn.secondaryCounters?.absol ?? 0) >= 9) {
      s.turn.glassWhiteLedger = Math.floor(ledger * 0.3);
    } else {
      s.turn.glassWhiteLedger = 0;
    }
    s.turn.glassWhiteLedgerActive = false;
  }

  // Burning Garden cards persist on board unless they char.
  for (let i = 0; i < s.board.frontSlots.length; i++) {
    const slot = s.board.frontSlots[i];
    if (slot && isBurningGardenCard(CardRegistry.get(slot.definitionId))) {
      if (slot.burningGardenPhase === 'Burn') {
        slot.burnTurnsRemaining = Math.max(0, (slot.burnTurnsRemaining ?? 2) - 1);
        if ((slot.burnTurnsRemaining ?? 0) <= 0) {
          charBurningGardenBoardCard(s, { kind: 'front', index: i as 0 | 1 | 2 | 3 | 4 }, slot);
        }
      }
      continue;
    }
    if (slot?.type === 'Seraphim') {
      recordLossEvent(s, [{ definitionId: slot.definitionId }], 'board');
      s.deck.discardPile.push(toDeckCard(slot));
    }
    (s.board.frontSlots as Array<(typeof s.board.frontSlots)[number]>)[i] = null;
  }
  // Back-row cleanup at turn end.
  // Durable Cherubim always discard; non-durable Cherubim use discard conditions.
  for (let i = 0; i < s.board.backSlots.length; i++) {
    const card = s.board.backSlots[i];
    if (!card) continue;

    if (isBurningGardenCard(CardRegistry.get(card.definitionId))) {
      if (card.burningGardenPhase === 'Burn') {
        card.burnTurnsRemaining = Math.max(0, (card.burnTurnsRemaining ?? 2) - 1);
        if ((card.burnTurnsRemaining ?? 0) <= 0) {
          charBurningGardenBoardCard(s, { kind: 'back', index: i as 0 | 1 | 2 | 3 }, card);
        }
      }
      continue;
    }

    if (card.type === 'Cherubim' && card.durability !== undefined) {
      recordLossEvent(s, [{ definitionId: card.definitionId }], 'board');
      s.deck.discardPile.push(toDeckCard(card));
      s.board.backSlots[i] = null;
    } else if (card.type === 'Cherubim') {
      const def = ScoreSystem.getDefinition(card.definitionId);
      if (def && def.type === 'Cherubim' && (def as import('@/types/cards').CherubimDefinition).discardCondition) {
        const condition = (def as import('@/types/cards').CherubimDefinition).discardCondition!;
        let shouldDiscard = false;
        
        switch (condition.type) {
          case 'hand_size_lte':
            shouldDiscard = s.deck.hand.length <= condition.value;
            break;
          case 'chain_lte':
            shouldDiscard = false; // chain removed
            break;
          case 'oblivion_lte':
            shouldDiscard = s.progress.oblivion <= condition.value;
            break;
          case 'radiance_lte':
            shouldDiscard = s.turn.radiance <= condition.value;
            break;
          case 'cards_played_gte':
            shouldDiscard = s.turn.cardsPlayedThisTurn >= condition.value;
            break;
          case 'seraphim_count_lte':
            shouldDiscard = s.board.frontSlots.filter(sl => sl?.type === 'Seraphim').length <= condition.value;
            break;
          case 'trail_lte':
            shouldDiscard = s.turn.trail <= condition.value;
            break;
          case 'strain_gte':
            shouldDiscard = s.turn.strain >= condition.value;
            break;
        }
        
        if (shouldDiscard) {
          recordLossEvent(s, [{ definitionId: card.definitionId }], 'expire');
          s.deck.discardPile.push(toDeckCard(card));
          s.board.backSlots[i] = null;
          applyCherubimExpireBonuses(s, 1);
          eventBus.emit('cherubim:expired', { backSlot: i as 0 | 1 | 2 | 3, definitionId: card.definitionId });
        }
      }
    }
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

function countExtraDeckCopies(extraDeck: ExtraDeckEntry[], definitionId: string, finish?: CardFinish): number {
  return extraDeck.filter(entry => entry.definitionId === definitionId && (finish === undefined || entry.finish === finish)).length;
}

function countAngelsOnBoard(board: BoardState, definitionId: string, finish?: CardFinish): number {
  return board.frontSlots.filter(
    slot => slot?.type === 'Angel' && slot.definitionId === definitionId && (finish === undefined || slot.finish === finish)
  ).length;
}

function getAvailableAngelEntry(
  board: BoardState,
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

  for (const finish of orderedFinishes) {
    const copiesOnBoard = countAngelsOnBoard(board, definitionId, finish);
    if (copiesOnBoard < countExtraDeckCopies(extraDeck, definitionId, finish)) {
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

function canResolveActivatedEffects(
  effects: CardEffect[],
  turn: TurnState,
  board: BoardState,
): boolean {
  const resourceTurn: TurnState = { ...turn };

  const canResolveEffect = (effect: CardEffect): boolean => {
    switch (effect.type) {
      case 'radiance_spend':
        if (effect.value >= 9999) {
          resourceTurn.radiance = 0;
          return true;
        }
        if (resourceTurn.radiance < effect.value) return false;
        resourceTurn.radiance -= effect.value;
        return true;
      case 'pyro_heat_spend':
        if (effect.value >= 9999) {
          resourceTurn.pyroHeat = 0;
          return true;
        }
        if ((resourceTurn.pyroHeat ?? 0) < effect.value) return false;
        resourceTurn.pyroHeat = (resourceTurn.pyroHeat ?? 0) - effect.value;
        return true;
      case 'trail_spend':
        if (effect.value >= 9999) {
          resourceTurn.trail = 0;
          return true;
        }
        if (resourceTurn.trail < effect.value) return false;
        resourceTurn.trail -= effect.value;
        return true;
      case 'overclock':
        resourceTurn.strain += effect.strain;
        for (const subEffect of effect.then) {
          if (!canResolveEffect(subEffect)) return false;
        }
        return true;
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
      tags: ['seraphim', 'unsynergized', def.element.toLowerCase()],
    },
    synergized: {
      id: `${def.definitionId}:synergized`,
      label: 'Synergized',
      name: `${stem} Covenant Cataclysm`,
      description: 'Devastating strike requiring any Angel on your board.',
      baseOblivion: synergizedBase,
      cooldownCards: 4 + Math.min(2, Math.floor(power / 2)),
      requiresAngelOnBoard: true,
      tags: ['seraphim', 'synergized', 'covenant', def.element.toLowerCase()],
    },
  };
}

function buildDefaultAngelAttackSet(def: AngelDefinition): AngelAttackSet {
  const power = rarityWeight(def.rarity);
  const stem = cardStem(def.name);
  const primaryBase = 120 + power * 42;
  const exaltedBase = Math.round(primaryBase * 2.1);
  const dominantCost: AttackCost = def.element === 'Light'
    ? { type: 'spend_radiance', value: 3 + power }
    : def.element === 'Fire'
      ? { type: 'spend_pyro_heat', value: 3 + power }
      : def.element === 'Thornbound'
        ? { type: 'spend_trail', value: 2 + power }
        : def.element === 'Mechanical'
          ? { type: 'spend_strain', value: 2 + power }
          : { type: 'discard_from_hand', value: 1 + Math.min(2, Math.floor(power / 2)) };

  return {
    primary: {
      id: `${def.definitionId}:primary`,
      label: 'Primary',
      name: `${stem} Halo Severance`,
      description: 'Standard angelic attack with stable cadence.',
      baseOblivion: primaryBase,
      cooldownCards: 3 + Math.min(1, Math.floor(power / 3)),
      tags: ['angel', 'primary', def.element.toLowerCase()],
    },
    exalted: {
      id: `${def.definitionId}:exalted`,
      label: 'Exalted',
      name: `${stem} Thronefall Decree`,
      description: 'Heavy-cost finisher with higher payout.',
      baseOblivion: exaltedBase,
      cooldownCards: 5 + Math.min(2, Math.floor(power / 2)),
      costs: [dominantCost],
      tags: ['angel', 'exalted', 'finisher', def.element.toLowerCase()],
    },
  };
}

function getSeraphimAttackSet(def: SeraphimDefinition): SeraphimAttackSet {
  return def.attacks ?? buildDefaultSeraphimAttackSet(def);
}

function getAngelAttackSet(def: AngelDefinition): AngelAttackSet {
  return def.attacks ?? buildDefaultAngelAttackSet(def);
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
  const targetDef = ScoreSystem.getDefinition(targetDefinitionId);
  const targetSetKey = targetDef ? getCardCategoryKey(targetDef) : null;

  for (const back of board.backSlots) {
    if (!back || back.type !== 'Cherubim') continue;
    const def = ScoreSystem.getDefinition(back.definitionId);
    if (!def || def.type !== 'Cherubim') continue;
    const sourceSetKey = getCardCategoryKey(def);
    if (targetSetKey && targetSetKey !== sourceSetKey) continue;
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
    const handIds = new Set(s.deck.hand.map(card => card.instanceId));
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
        if (s.deck.hand.length < cost.value) return false;
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
      case 'spend_pyro_heat':
        if ((s.turn.pyroHeat ?? 0) < cost.value) return false;
        break;
      case 'spend_radiance':
        if (s.turn.radiance < cost.value) return false;
        break;
      case 'spend_trail':
        if (s.turn.trail < cost.value) return false;
        break;
      case 'spend_strain':
        if (s.turn.strain < cost.value) return false;
        break;
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
        const discarded = s.deck.hand.filter(card => idsForCost.includes(card.instanceId));
        s.deck.hand = s.deck.hand.filter(card => !idsForCost.includes(card.instanceId));
        if (discarded.length > 0) {
          for (const card of discarded) pushEmberGroveDeckSeed(s, card);
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
            pushEmberGroveDeckSeed(s, toDeckCard(slot));
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
            pushEmberGroveDeckSeed(s, toDeckCard(slot));
            sacrificed.push({ definitionId: slot.definitionId });
            s.board.frontSlots[i] = null;
          }
        }
        recordLossEvent(s, sacrificed, 'sacrifice');
        s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);
        break;
      }
      case 'spend_pyro_heat':
        s.turn.pyroHeat = Math.max(0, (s.turn.pyroHeat ?? 0) - cost.value);
        break;
      case 'spend_radiance':
        s.turn.radiance -= cost.value;
        break;
      case 'spend_trail':
        s.turn.trail -= cost.value;
        break;
      case 'spend_strain':
        s.turn.strain -= cost.value;
        break;
    }
  }
}

function grantDominantAttackResource(s: Store, sourceDefinitionId: string, element: string | undefined, amount: number): void {
  if (amount <= 0) return;
  const sourceDef = CardRegistry.get(sourceDefinitionId);
  const sourceSetKey = sourceDef ? getCardCategoryKey(sourceDef) : null;
  switch (element) {
    case 'Light':
      s.turn.radiance += amount;
      break;
    case 'Mechanical':
      s.turn.strain += amount;
      break;
    case 'Neutrality': {
      const frontline = s.board.frontSlots.filter(
        (u): u is SeraphimInstance | AngelInstance =>
          u !== null
          && (u.type === 'Seraphim' || u.type === 'Angel')
          && (!sourceSetKey || (() => {
            const unitDef = CardRegistry.get(u.definitionId);
            return !!unitDef && getCardCategoryKey(unitDef) === sourceSetKey;
          })())
      );
      if (frontline.length > 0) {
        const perUnit = Math.round(amount / frontline.length);
        for (const unit of frontline) {
          unit.patienceStacks = (unit.patienceStacks ?? 0) + perUnit;
        }
      }
      break;
    }
    default:
      grantOblivion(s, amount);
      break;
  }
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
  const identity = getLateGameAttackIdentity(definitionId, rarity, attackLabel);
  if (!identity) return;

  const isInfinite = rarity === 'Infinite';
  const allowedDraws = identity.drawCards >= 3 ? 1 : 0;
  const suppressedDraws = Math.max(0, identity.drawCards - allowedDraws);

  let extraOblivion = Math.round(baseAttackAward * identity.bonusBaseMultiplier + identity.bonusFlatOblivion);
  if (suppressedDraws > 0) {
    extraOblivion += suppressedDraws * (isInfinite ? 220 : 110);
  }

  if (extraOblivion > 0) {
    grantOblivion(s, extraOblivion);
  }

  if (allowedDraws > 0) {
    s.deck = TurnSystem.drawCards(s.deck, allowedDraws);
  }

  if (identity.grantNextCardMultiplier) {
    s.turn.nextCardMultiplied = true;
  }

  const dominantResourceGain = identity.dominantResourceGain + suppressedDraws * (isInfinite ? 10 : 5);
  if (dominantResourceGain > 0) {
    const attackingDef = ScoreSystem.getDefinition(definitionId);
    grantDominantAttackResource(s, attackingDef?.definitionId ?? '', attackingDef?.element, dominantResourceGain);
  }

  if (identity.cooldownReduction > 0) {
    reduceFrontlineAttackCooldowns(s.board, identity.cooldownReduction);
  }
}

// �E��E��E��E� Cherubim helpers �E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E�

function computeCherubimPassiveOblivionBonus(board: BoardState, isOphanimPlay: boolean): number {
  let bonus = 0;

  for (let i = 0; i < 4; i++) {
    const card = board.backSlots[i];
    if (!card || card.type !== 'Cherubim') continue;
    const def = ScoreSystem.getDefinition(card.definitionId);
    if (!def || def.type !== 'Cherubim') continue;
    const burnMultiplier = isBurningGardenCard(def) ? computeBurningGardenBoardPower(card) : 1;

    for (const effect of def.effects) {
      if (effect.type === 'cherubim_oblivion_per_card') {
        bonus += effect.value * burnMultiplier;
      }
      if (isOphanimPlay && effect.type === 'cherubim_ophanim_bonus') {
        bonus += effect.value * burnMultiplier;
      }
    }
  }

  bonus += computeCherubimAdjacentBonus(board, 'oblivion');
  return bonus;
}

// �E��E��E��E� Cherubim helpers �E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E��E�

function computeCherubimAdjacentBonus(board: BoardState, bonusType: 'oblivion' | 'draw' | 'chain'): number {
  let bonus = 0;
  for (let i = 0; i < 4; i++) {
    const card = board.backSlots[i];
    if (!card || card.type !== 'Cherubim') continue;
    const def = ScoreSystem.getDefinition(card.definitionId);
    if (!def || def.type !== 'Cherubim') continue;
    const sourceSetKey = getCardCategoryKey(def);
    const leftSlot = board.frontSlots[i];
    const rightSlot = board.frontSlots[i + 1];
    const adjacentActive = [leftSlot, rightSlot].filter(
      s => {
        if (!s || s.type !== 'Seraphim' || !(s as SeraphimInstance).isActive) return false;
        const unitDef = ScoreSystem.getDefinition(s.definitionId);
        return !!unitDef && getCardCategoryKey(unitDef) === sourceSetKey;
      }
    ).length;
    if (adjacentActive === 0) continue;
    const burnMultiplier = isBurningGardenCard(def) ? computeBurningGardenBoardPower(card) : 1;
    for (const effect of (def as import('@/types/cards').CherubimDefinition).effects) {
      if (effect.type === 'cherubim_adjacent_seraphim_bonus' && effect.bonusType === bonusType) {
        bonus += effect.value * adjacentActive * burnMultiplier;
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
    totalAward += cardOblivionBonus;
  }

  // Seraphim ophanim_bonus remains active in attack-centric pacing.
  if (isOphanim && s.computedStats.ophanimOblivionBonus > 0) {
    totalAward += s.computedStats.ophanimOblivionBonus;
  }

  const cherubimOblivionBonus = computeCherubimPassiveOblivionBonus(s.board, isOphanim);
  if (cherubimOblivionBonus > 0) {
    totalAward += cherubimOblivionBonus;
  }

  if (sourceDef?.element === 'Neutrality' && totalAward > 0) {
    const resolvedClass = actionClass ?? classifyActionClass(sourceDef, getDefinitionOnPlayEffects(sourceDef));
    const attenuationMultiplier = applyAttenuationMultiplier(s, resolvedClass);
    const sourceCap = Math.min(3, s.turn.crossSetConversionDistinctSources?.length ?? 0);
    const crossSetMultiplier = resolvedClass === 'conversion' ? (1 + sourceCap * 0.12) : 1;
    const fullFireMultiplier = getNeutralityFullFireMultiplier(s, sourceDef);
    const stabilityFlat = Math.max(0, Math.round((s.turn.equilibriumStability ?? 0) * 3));
    totalAward = Math.round(totalAward * attenuationMultiplier * crossSetMultiplier * fullFireMultiplier) + stabilityFlat;
  }

  if (sourceDef?.element === 'Fire' && totalAward > 0) {
    const infiniteMultiplier = getPyroInfinitePayoutMultiplier(s, sourceDef);
    totalAward = Math.round(totalAward * infiniteMultiplier);
  }

  if (sourceDef?.element === 'Light' && totalAward > 0) {
    ensureLightTurnState(s.turn);
    const resonance = s.turn.lightResonance ?? 0;
    const noteCount = new Set(s.turn.lightDistinctNotes ?? []).size;
    const resonanceMultiplier = 1 + Math.min(0.5, resonance * 0.08);
    const cadenceMultiplier = 1 + Math.min(0.28, noteCount * 0.07);
    const radianceMultiplier = 1 + Math.min(0.35, s.turn.radiance * 0.015);
    const fullFireMultiplier = getLightFullFireMultiplier(s, sourceDef);
    totalAward = Math.round(totalAward * resonanceMultiplier * cadenceMultiplier * radianceMultiplier * fullFireMultiplier);
    if (sourceDef.rarity === 'Infinite') {
      totalAward += noteCount * 34 + resonance * 10;
    }
  }

  if (sourceDef?.element === 'Thornbound' && totalAward > 0) {
    ensureThornboundTurnState(s.turn);
    const scar = s.turn.thornScar ?? 0;
    const trailMultiplier = 1 + Math.min(0.45, s.turn.trail * 0.02);
    const scarMultiplier = 1 + Math.min(0.4, scar * 0.04);
    const fullFireMultiplier = getThornboundFullFireMultiplier(s, sourceDef);
    totalAward = Math.round(totalAward * trailMultiplier * scarMultiplier * fullFireMultiplier);
  }

  const mechanicalDef = sourceDef;
  if (mechanicalDef && isMechanicalDreamsCard(mechanicalDef) && totalAward > 0) {
    const strain = Math.max(0, s.turn.strain ?? 0);
    const reactorCores = Math.max(0, s.turn.eternalStacks?.mech ?? 0);
    const strainBand = strain <= 12
      ? 1 + Math.min(0.24, strain * 0.02)
      : Math.max(0.78, 1 - (strain - 12) * 0.03);
    const reactorMultiplier = 1 + Math.min(0.45, reactorCores * 0.05);
    const fullFireMultiplier = getMechanicalFullFireMultiplier(s, mechanicalDef);
    totalAward = Math.round(totalAward * strainBand * reactorMultiplier * fullFireMultiplier);
  }

  if (sourceDef?.element === 'Prismatic' && totalAward > 0) {
    ensurePrismaticTurnState(s.turn);
    const channelCount = new Set(s.turn.prismaticDistinctChannels ?? []).size;
    const refractionDepth = s.turn.prismaticRefractionDepth ?? 0;
    const nodeCharges = s.turn.prismaticNodeCharges ?? 0;
    const channelMultiplier = 1 + Math.min(0.42, channelCount * 0.07);
    const refractionMultiplier = 1 + Math.min(0.36, refractionDepth * 0.05);
    const nodeMultiplier = 1 + Math.min(0.18, nodeCharges * 0.05);
    const fullFireMultiplier = getPrismaticFullFireMultiplier(s, sourceDef);
    totalAward = Math.round(totalAward * channelMultiplier * refractionMultiplier * nodeMultiplier * fullFireMultiplier);
    if (sourceDef.rarity === 'Infinite') {
      totalAward += channelCount * 40;
    }
  }

  const blackGlassDef = sourceDef;
  if (blackGlassDef && isBlackGlassCard(blackGlassDef) && totalAward > 0) {
    ensureBlackGlassTurnState(s.turn);
    const white = s.turn.blackGlassWhiteFlame ?? 0;
    const black = s.turn.blackGlassBlackFlame ?? 0;
    const fracture = s.turn.blackGlassFracture ?? 0;
    const gap = Math.abs(white - black);
    const balanceMultiplier = gap <= 1
      ? 1.18
      : gap <= 3
        ? 1.08
        : 0.9;
    const rhythmMultiplier = 1 + Math.min(0.24, fracture * 0.04);
    const pairedFlameBonus = Math.min(white, black) * 6;

    const fullFireMultiplier = getDarkFullFireMultiplier(s, blackGlassDef);
    totalAward = Math.round(totalAward * balanceMultiplier * rhythmMultiplier * fullFireMultiplier)
      + pairedFlameBonus;
    if (blackGlassDef.rarity === 'Infinite') {
      totalAward += fracture * 24;
    }
    if (totalAward > 0) {
      s.turn.blackGlassLastPayoff = totalAward;
    }
  }

  const snowboundDef = sourceDef;
  if (snowboundDef && isSnowboundVoltageCard(snowboundDef) && totalAward > 0) {
    ensureSnowboundTurnState(s.turn);
    const charge = Math.max(0, s.turn.arcticCharge ?? 0);
    const phase = s.turn.snowboundPhase ?? 'Frost';
    const phaseMultiplier = phase === 'Voltage'
      ? 1 + Math.min(0.72, charge * 0.06)
      : 1 + Math.min(0.18, charge * 0.015);
    const fullFireMultiplier = getSnowboundFullFireMultiplier(s, snowboundDef);
    totalAward = Math.round(totalAward * phaseMultiplier * fullFireMultiplier);

    if (phase === 'Voltage' && charge > 0) {
      const spendCap = snowboundDef.rarity === 'Infinite'
        ? 12
        : snowboundDef.rarity === 'Eternal'
          ? 10
          : 6;
      const spent = Math.min(charge, spendCap);
      totalAward += spent * 18;
      s.turn.arcticCharge = Math.max(0, charge - spent);
    }

    if (snowboundDef.rarity === 'Infinite') {
      totalAward += Math.min(240, charge * 12);
    }
  }

  if (sourceDef?.element === 'GlassAbsolute' && totalAward > 0) {
    ensureGlassAbsoluteTurnState(s.turn);
    if (isBaseGlassAbsoluteCard(sourceDef)) {
      const fragments = s.turn.glassProofFragments ?? 0;
      const fragmentMultiplier = 1 + Math.min(0.36, fragments * 0.06);
      const formationTierBonus = fragments >= 7 ? 110 : fragments >= 5 ? 60 : fragments >= 3 ? 24 : 0;
      totalAward = Math.round(totalAward * fragmentMultiplier) + formationTierBonus;
    } else if (sourceDef.rarity === 'Eternal') {
      const counters = (s.turn.secondaryCounters ?? {}) as Record<string, number>;
      const refractionCharge = Math.max(0, counters.absol ?? 0);
      const fragments = s.turn.glassProofFragments ?? 0;
      const formationTierBonus = fragments >= 7 ? 120 : fragments >= 5 ? 66 : fragments >= 3 ? 28 : 0;
      const refractionMultiplier = 1 + Math.min(0.56, refractionCharge * 0.08);
      const fragmentMultiplier = 1 + Math.min(0.24, fragments * 0.04);
      const stabilizerMultiplier = hasBackDefinition(s.board, 'ga-et-perfect-refraction') ? 1.12 : 1;
      totalAward = Math.round(totalAward * refractionMultiplier * fragmentMultiplier * stabilizerMultiplier) + formationTierBonus;
    } else {
      const counters = (s.turn.secondaryCounters ?? {}) as Record<string, number>;
      const refractionCharge = Math.max(0, counters.absol ?? 0);
      const fragments = (s.turn.glassProofFragments ?? 0) + (s.turn.glassSyntheticFragments ?? 0);
      const waveQueue = s.turn.glassWaveQueue ?? 0;
      const formationTierBonus = fragments >= 7 ? 170 : fragments >= 5 ? 95 : fragments >= 3 ? 40 : 0;
      const refractionMultiplier = 1 + Math.min(0.95, refractionCharge * 0.10);
      const fragmentMultiplier = 1 + Math.min(0.42, fragments * 0.06);
      const queueMultiplier = 1 + Math.min(0.28, waveQueue * 0.04);
      const fullFireMultiplier = getGlassAbsoluteFullFireMultiplier(s, sourceDef);
      totalAward = Math.round(totalAward * refractionMultiplier * fragmentMultiplier * queueMultiplier * fullFireMultiplier) + formationTierBonus;

      if (sourceDef.definitionId === 'ga-inf-glass-absolute') {
        const snapFragments = s.turn.glassSnapshotFragments ?? 0;
        const snapCharge = s.turn.glassSnapshotDepth ?? 0;
        const snapQueue = s.turn.glassSnapshotCascade ?? 0;
        const snapTier = s.turn.glassSnapshotAxioms ?? 0;
        const snapshotMultiplier = (1 + Math.min(0.36, snapFragments * 0.06))
          * (1 + Math.min(0.40, snapCharge * 0.04))
          * (1 + Math.min(0.28, snapQueue * 0.05))
          * (1 + Math.min(0.24, snapTier * 0.06));
        totalAward = Math.round(totalAward * snapshotMultiplier);
      } else if (sourceDef.definitionId === 'ga-inf-yreth-prism-at-center') {
        const floor = s.turn.glassDepthFloor ?? 0;
        totalAward = Math.round(totalAward * (1 + Math.min(0.34, floor * 0.03)));
      } else if (sourceDef.definitionId === 'ga-inf-chorus-unbroken-spectrum') {
        const spend = Math.min(3, waveQueue);
        if (spend > 0) {
          s.turn.glassWaveQueue = Math.max(0, waveQueue - spend);
          totalAward += spend * (160 + refractionCharge * 18);
        }
      } else if (sourceDef.definitionId === 'ga-inf-shattered-without-shattering') {
        totalAward = Math.round(totalAward * (1 + Math.min(0.26, refractionCharge * 0.03)));
      } else if (sourceDef.definitionId === 'ga-inf-color-after-white') {
        const ledgerBurst = Math.round((s.turn.glassWhiteLedger ?? 0) * 0.14);
        totalAward += ledgerBurst;
      }

      totalAward += refractionCharge * 32;
      if (s.turn.glassWhiteLedgerActive ?? false) {
        const ledgerShare = 0.26 + Math.min(0.22, refractionCharge * 0.02);
        s.turn.glassWhiteLedger = (s.turn.glassWhiteLedger ?? 0) + Math.round(totalAward * ledgerShare);
      }
    }
  }

  if (sourceDef?.element === 'BlazingGarden' && totalAward > 0) {
    ensureBurningGardenTurnState(s.turn);
    const burningEngines = countBurningGardenEngines(s.board);
    const burnMultiplier = 1 + Math.min(0.5, burningEngines * 0.16);
    const groveMultiplier = 1 + Math.min(0.3, (s.board.emberGrove?.length ?? 0) * 0.04);
    const representedLineages = getBurningGardenRepresentedLineages(s);
    const lineageSpreadMultiplier = 1 + Math.min(0.24, representedLineages.length * 0.08);
    const recentLineages = s.turn.burningGardenLineagesPlayed ?? [];
    const distinctRecent = new Set(recentLineages.slice(-3)).size;
    const rhythmMultiplier = distinctRecent >= 3 ? 1.2 : distinctRecent === 2 ? 1.08 : 0.95;

    let lawMultiplier = 1;
    if (s.turn.burningGardenLaw === 'Rose') {
      lawMultiplier = 1 + Math.min(0.22, (s.turn.burningGardenEchoesBloomed ?? 0) * 0.08);
    } else if (s.turn.burningGardenLaw === 'Sunflower') {
      lawMultiplier = actionClass === 'conversion' ? 1.18 : 1.06;
    } else if (s.turn.burningGardenLaw === 'Thistle') {
      lawMultiplier = actionClass === 'multiplier' || actionClass === 'finisher' ? 1.2 : 1.04;
    }

    const fullFireMultiplier = getBlazingGardenFullFireMultiplier(s, sourceDef);
    totalAward = Math.round(totalAward * burnMultiplier * groveMultiplier * lineageSpreadMultiplier * rhythmMultiplier * lawMultiplier * fullFireMultiplier);

    if ((s.turn.burningGardenSkyLaw ?? null) === 'Thistle' && actionClass === 'finisher') {
      totalAward = Math.round(totalAward * 1.18);
    }

    if ((s.turn.burningGardenGeometryMode ?? false)) {
      totalAward = Math.round(totalAward * 1.12);
    }

    // Final Chord bloom: Infinite Blazing Garden cards reward balanced lineage orchestration.
    if (sourceDef.rarity === 'Infinite' && representedLineages.length >= 3) {
      const balancedLineageBonus = distinctRecent >= 3 ? 1.35 : 1.15;
      totalAward = Math.round(totalAward * balancedLineageBonus);
    }
  }

  // Apply conditional Cherubim board-presence multiplier (capped to prevent runaway scaling).
  const cherubimCondMult = Math.min(1.6, s.turn.cherubimConditionalMult ?? 1);
  if (cherubimCondMult > 1 && totalAward > 0) {
    totalAward = Math.round(totalAward * cherubimCondMult);
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
  const sourceDef = CardRegistry.get(sourceDefinitionId);
  const sourceSetKey = sourceDef ? getCardCategoryKey(sourceDef) : null;
  const vesselId = s.turn.neutralityVesselInstanceId ?? null;
  const vesselCopyPercent = Math.max(0, s.turn.neutralityVesselCopyPercent ?? 0);
  const linkedBonus = Math.max(0, s.turn.neutralityLinkedGainBonus ?? 0);
  const equilibriumBonus = getNeutralityEquilibriumPatienceGainBonus(s.turn, s.board);
  let nonVesselGain = 0;

  // Patience stays inside the source set; only matching-set frontline units receive it.
  for (const unit of s.board.frontSlots) {
    if (!unit || (unit.type !== 'Seraphim' && unit.type !== 'Angel')) continue;
    if (sourceSetKey) {
      const unitDef = CardRegistry.get(unit.definitionId);
      if (!unitDef || getCardCategoryKey(unitDef) !== sourceSetKey) continue;
    }
    const gain = value + linkedBonus + equilibriumBonus;
    unit.patienceStacks = (unit.patienceStacks ?? 0) + gain;
    if (vesselId && unit.instanceId !== vesselId) {
      nonVesselGain += gain;
    }
  }

  if (vesselId && vesselCopyPercent > 0 && nonVesselGain > 0) {
    const vessel = s.board.frontSlots.find(unit => {
      if (!unit || (unit.type !== 'Seraphim' && unit.type !== 'Angel') || unit.instanceId !== vesselId) return false;
      if (!sourceSetKey) return true;
      const unitDef = CardRegistry.get(unit.definitionId);
      return !!unitDef && getCardCategoryKey(unitDef) === sourceSetKey;
    });
    if (vessel) {
      const copied = Math.floor(nonVesselGain * (vesselCopyPercent / 100));
      if (copied > 0) {
        vessel.patienceStacks = (vessel.patienceStacks ?? 0) + copied;
      }
    }
  }

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
  const vesselId = s.turn.neutralityVesselInstanceId ?? null;
  const vesselCopyPercent = Math.max(0, s.turn.neutralityVesselCopyPercent ?? 0);
  const linkedBonus = Math.max(0, s.turn.neutralityLinkedGainBonus ?? 0);
  const equilibriumBonus = getNeutralityEquilibriumPatienceGainBonus(s.turn, s.board);
  const patientLightStacks = Math.max(0, s.turn.neutralityPatientLightStacks ?? 0);
  const patientLightGain = 1 + patientLightStacks;
  let nonVesselGain = 0;

  // Auto-accumulate +1 Patience for every Seraphim on board that has patienceThreshold set.
  for (const unit of s.board.frontSlots) {
    if (!unit || unit.type !== 'Seraphim') continue;
    const unitDef = ScoreSystem.getDefinition(unit.definitionId);
    if (unitDef?.type === 'Seraphim' && (unitDef as import('@/types/cards').SeraphimDefinition).patienceThreshold !== undefined) {
      const patienceGainBonus = Math.floor(getArtifactEffect(s.turn, 'patience_gain_bonus', s.progress.ownedArtifacts));
      const gain = patientLightGain + linkedBonus + equilibriumBonus + patienceGainBonus;
      unit.patienceStacks = (unit.patienceStacks ?? 0) + gain;
      if (vesselId && unit.instanceId !== vesselId) nonVesselGain += gain;
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
    const sourceSetKey = getCardCategoryKey(def);

    for (const effect of def.effects) {
      switch (effect.type) {
        case 'cherubim_resource_per_card': {
          switch (effect.resource) {
            case 'butterflySpectrum':
              s.turn.butterflySpectrum = (s.turn.butterflySpectrum ?? 0) + effect.value;
              break;
            case 'radiance':
              s.turn.radiance += effect.value;
              break;
            case 'trail':
              s.turn.trail += effect.value;
              break;
            case 'strain':
              s.turn.strain += effect.value;
              break;
          }
          break;
        }

        case 'cherubim_pyro_heat_gain': {
          s.turn.pyroHeat = Math.max(0, s.turn.pyroHeat ?? 0) + effect.value;
          break;
        }

        case 'cherubim_charge_per_n_cards': {
          const playCount = (s.turn.cardsPlayedThisTurn ?? 0) + 1;
          if (effect.n > 0 && playCount > 0 && playCount % effect.n === 0) {
            const cap = s.turn.reforgeChargeCap ?? 6;
            s.turn.reforgeCharges = Math.min(cap, (s.turn.reforgeCharges ?? 0) + 1);
          }
          break;
        }

        case 'cherubim_temper_on_next_seraphim': {
          s.turn.forgePendingCherubimTemper = (s.turn.forgePendingCherubimTemper ?? 0) + effect.factor;
          break;
        }

        case 'cherubim_draw_per_card': {
          applyCherubimDrawPerCard(s, effect.value);
          break;
        }

        case 'cherubim_patience_per_card': {
          // Give adjacent same-set Seraphim/Angels +value Patience per card played.
          const leftFront = s.board.frontSlots[i];
          const rightFront = s.board.frontSlots[i + 1];
          for (const frontUnit of [leftFront, rightFront]) {
            if (!frontUnit || (frontUnit.type !== 'Seraphim' && frontUnit.type !== 'Angel')) continue;
            const frontDef = CardRegistry.get(frontUnit.definitionId);
            if (!frontDef || getCardCategoryKey(frontDef) !== sourceSetKey) continue;
            const gain = effect.value + linkedBonus + equilibriumBonus;
            frontUnit.patienceStacks = (frontUnit.patienceStacks ?? 0) + gain;
            if (vesselId && frontUnit.type === 'Seraphim' && frontUnit.instanceId !== vesselId) {
              nonVesselGain += gain;
            }
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
            } else if (effect.condition.type === 'radiance_gte') {
              conditionMet = s.turn.radiance >= effect.condition.value;
            } else if (effect.condition.type === 'pyro_heat_gte') {
              conditionMet = (s.turn.pyroHeat ?? 0) >= effect.condition.value;
            } else if (effect.condition.type === 'strain_gte') {
              conditionMet = s.turn.strain >= effect.condition.value;
            } else if (effect.condition.type === 'strain_lte') {
              conditionMet = s.turn.strain <= effect.condition.value;
            } else if (effect.condition.type === 'trail_gte') {
              conditionMet = s.turn.trail >= effect.condition.value;
            } else if (effect.condition.type === 'cherubim_active_gte') {
              conditionMet = s.board.backSlots.filter(sl => sl !== null && sl.type === 'Cherubim').length >= effect.condition.value;
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

  if (vesselId && vesselCopyPercent > 0 && nonVesselGain > 0) {
    const vessel = s.board.frontSlots.find(
      unit => unit?.type === 'Seraphim' && unit.instanceId === vesselId,
    );
    if (vessel) {
      const copied = Math.floor(nonVesselGain * (vesselCopyPercent / 100));
      if (copied > 0) {
        vessel.patienceStacks = (vessel.patienceStacks ?? 0) + copied;
      }
    }
  }

  // ── Wished Upon A Star per-card passives ─────────────────────────────────
  // Seraphim on board: wuas-ser-solarvex-fragment and wuas-cher-wishwright-pulse
  // each give +1 Starlight per card played.
  const WUAS_STARLIGHT_PER_CARD_IDS = new Set([
    'wuas-ser-solarvex-fragment',
    'wuas-cher-wishwright-pulse',
  ]);
  for (const unit of [...s.board.frontSlots, ...s.board.backSlots]) {
    if (!unit) continue;
    if (WUAS_STARLIGHT_PER_CARD_IDS.has(unit.definitionId)) {
      s.turn.starlightCharges = (s.turn.starlightCharges ?? 0) + 1;
    }
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
          element: def?.type === 'Seraphim' ? def.element : 'Neutrality',
          rarity: def?.type === 'Seraphim' ? def.rarity : 'Common',
          finish: deckCard.finish,
          level: 1,
          isActive: false,
          attackCooldowns: {},
          boardSlot: slot,
          ...(deckCard.faceState ? { faceState: deckCard.faceState } : {}),
        };
        applyPrismaticDefaults(seraphimInst, def);
        initializeBurningGardenInstance(seraphimInst, def);
        s.board.frontSlots[slot] = seraphimInst;
        s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);
        refractSpectrumTokens(s.board, seraphimInst.instanceId, def);
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
            if (result.pendingEffect) s.turn.pendingEffect = result.pendingEffect;
            applyAllSetPlayStates(s, def, turnBefore, actionClass);
            awardOblivionForCardPlay(s, result.oblivionBonus, false, undefined, def, actionClass);
          }
        }

        s.deck.hand = s.deck.hand.filter(c => c.instanceId !== deckCard.instanceId);
        resolveNeutralityMarkedCardTrigger(s, deckCard.instanceId, deckCard.definitionId);
        incrementAngelProgress(s.board);
        const newInst = s.board.frontSlots[slot];
        if (newInst?.type === 'Seraphim' && newInst.isActive) {
          eventBus.emit('seraphim:synergy-gained', { slot, instanceId: deckCard.instanceId });
        }
        recordCardPlay(s, deckCard.definitionId);
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
          element: def.element,
          rarity: def.rarity,
          finish: deckCard.finish,
          level: 1,
          isActive: false,
          attackCooldowns: {},
          boardSlot: targetSlot,
          ...(deckCard.faceState ? { faceState: deckCard.faceState } : {}),
        };
        applyPrismaticDefaults(seraphimInst, def);
        initializeBurningGardenInstance(seraphimInst, def);
        s.board.frontSlots[targetSlot] = seraphimInst;
        s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);
        refractSpectrumTokens(s.board, seraphimInst.instanceId, def);
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
          if (result.pendingEffect) s.turn.pendingEffect = result.pendingEffect;
          applyAllSetPlayStates(s, def, turnBefore, actionClass);
          applyButterflyBasePlayProgression(s, def);
          awardOblivionForCardPlay(s, result.oblivionBonus, false, undefined, def, actionClass);
        }
        s.deck.hand = s.deck.hand.filter(c => c.instanceId !== deckCard.instanceId);
        resolveNeutralityMarkedCardTrigger(s, deckCard.instanceId, deckCard.definitionId);
        incrementAngelProgress(s.board);
        recordCardPlay(s, deckCard.definitionId);
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
          element: cherubimDef.element,
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
            applyPrismaticDefaults(cherubimInst, def);
            initializeBurningGardenInstance(cherubimInst, def);
        s.board.backSlots[backSlotIndex] = cherubimInst;
        s.deck.hand = s.deck.hand.filter(c => c.instanceId !== deckCard.instanceId);
            refractSpectrumTokens(s.board, cherubimInst.instanceId, def);
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
            useNextCardMultiplier: false,
          },
        );
        if (!result.canPlay) return;
        const turnBefore = captureTurnSnapshot(s.turn);
        const actionClass = classifyActionClass(def, getDefinitionOnPlayEffects(def));
        s.turn = result.turn;
        s.board = result.board;
        s.deck = result.deck;
        if (result.pendingEffect) s.turn.pendingEffect = result.pendingEffect;
        applyAllSetPlayStates(s, def, turnBefore, actionClass);
        applyButterflyBasePlayProgression(s, def);

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
        const summonedEntry = getAvailableAngelEntry(s.board, s.deck.extraDeck, definitionId, finish);
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
            if (cond.type === 'seraphim_on_board_gte' && s.board.frontSlots.filter(sl => sl?.type === 'Seraphim').length < cond.value) return;
            if (cond.type === 'board_definition_gte' && (boardDefinitionCount[cond.definitionId] ?? 0) < cond.value) return;
            if (cond.type === 'equilibrium_sigils_gte' && (s.turn.neutralityEquilibriumSigils ?? 0) < cond.value) return;
            if (cond.type === 'eternal_stack_gte' && (s.turn.eternalStacks?.[cond.stack] ?? 0) < cond.value) return;
            if (cond.type === 'set_secondary_gte' && (s.turn.secondaryCounters?.[cond.kind] ?? 0) < cond.value) return;
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
          }
          (s.board.frontSlots as Array<(typeof s.board.frontSlots)[number]>)[slotIdx] = null;
        }
        recordLossEvent(s, toSacrifice.map(material => ({ definitionId: material.definitionId })), 'sacrifice');
        s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);

        const emptySlotIdx = s.board.frontSlots.findIndex(sl => sl === null);
        if (emptySlotIdx === -1) return;
        const slot = emptySlotIdx as 0 | 1 | 2 | 3 | 4;

        const angelInst: AngelInstance = {
          instanceId: `ang_${++angelInstanceCounter}`,
          definitionId,
          type: 'Angel',
          element: angelDef.element,
          rarity: angelDef.rarity,
          finish: summonedEntry.finish,
          level: 1,
          cardsPlayedSinceSummon: 0,
          activated: false,
          attackCooldowns: {},
          boardSlot: slot,
        };
        applyPrismaticDefaults(angelInst, angelDef);
        initializeBurningGardenInstance(angelInst, angelDef);
        s.board.frontSlots[slot] = angelInst;
        s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);
        refractSpectrumTokens(s.board, angelInst.instanceId, angelDef);
        eventBus.emit('angel:summoned', { definitionId, slot });
        recompute(s);

        const result = CardEffectExecutor.execute(
          { instanceId: angelInst.instanceId, definitionId, finish: angelInst.finish },
          s.turn,
          s.board,
          s.deck,
          false,
          { countAsPlay: false, removeFromHand: false, useNextCardMultiplier: false }
        );
        if (result.canPlay) {
          const turnBefore = captureTurnSnapshot(s.turn);
          const actionClass = classifyActionClass(angelDef, angelDef.onSummonEffects);
          s.turn = result.turn;
          s.board = result.board;
          s.deck = result.deck;
          applyAllSetPlayStates(s, angelDef, turnBefore, actionClass);
          applyButterflyBasePlayProgression(s, angelDef);
          awardOblivionForCardPlay(s, result.oblivionBonus, false, undefined, angelDef, actionClass);
          if (result.pendingEffect) s.turn.pendingEffect = result.pendingEffect;
        }

        checkBossDefeated(s);
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
            useNextCardMultiplier: false,
          }
        );
        if (!result.canPlay) return;

        const turnBefore = captureTurnSnapshot(s.turn);
        const actionClass = classifyActionClass(angelDef, angelDef.activatedAbility.effects);

        s.turn = result.turn;
        s.board = result.board;
        s.deck = result.deck;
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
          def.element.toLowerCase(),
          attack.label.toLowerCase(),
          attack.id.toLowerCase(),
        ];
        if (isBurningGardenCard(def)) {
          igniteBurningGardenInstance(unit);
          s.board.frontSlots[slot] = unit;
        }
        const buffs = collectAttackBuffs(s.board, s.turn, 'Seraphim', def.definitionId, attackTags);

        const costs = attack.costs ?? [];
        if (!canPayAttackCosts(s, costs, { type: 'Seraphim', instanceId: unit.instanceId }, paymentSelection)) return;
        payAttackCosts(s, costs, paymentSelection);

        // Attacking increases the chain by this attack's chain value, locking in the gain via floor
        if (def.definitionId === 'inf-prismatic-choir-splinter') {
        }

        // Patience mechanic: consume stacks for bonus Oblivion (+1.5% of base attack per stack)
        const seraphimDef = def as import('@/types/cards').SeraphimDefinition;
        const capturedPatience = seraphimDef.patienceThreshold !== undefined ? (unit.patienceStacks ?? 0) : 0;
        const patienceOblivion = Math.round(attack.baseOblivion * capturedPatience * 0.015);
        const chromaEmbers = def.element === 'Fire' && (def.rarity === 'Eternal' || def.rarity === 'Infinite')
          ? Math.max(0, s.turn.secondaryCounters?.pyro ?? 0)
          : 0;
        const chromaMultiplier = getPyroChromaAttackMultiplier(s, def);
        const forgeTemperBonus = Math.max(0, s.turn.forgeTemperQueue ?? 0);

        let amount = Math.round(
          Math.max(0, attack.baseOblivion + buffs.baseOblivionBonus + patienceOblivion)
          * Math.max(0.1, buffs.multiplier * getBurningGardenAttackMultiplier(unit) * chromaMultiplier),
        );

        if (forgeTemperBonus > 0) {
          amount = Math.round(amount * (1 + forgeTemperBonus));
          s.turn.forgeTemperQueue = 0;
        }

        if (def.definitionId === 'tx-sera-null-entropy') {
          const sigils = Math.max(0, s.turn.neutralityEquilibriumSigils ?? 0);
          amount += sigils * 420;
          if (sigils > 0) {
            amount = Math.round(amount * (1 + Math.min(0.6, sigils * 0.03)));
          }
        }

        if (def.definitionId === 'ga-et-lattice-archive-seraph') {
          const seals = s.turn.glassArchiveSeals ?? 0;
          if (seals > 0) {
            amount += seals * (165 + (s.turn.glassProofDepth ?? 0) * 6);
            s.turn.glassArchiveSeals = 0;
          }
        }

        if (def.definitionId === 'ga-inf-chorus-unbroken-spectrum') {
          const queue = s.turn.glassWaveQueue ?? 0;
          if (queue > 0) {
            const theoremSupport = (s.turn.glassAxioms ?? []).length;
            amount += queue * (140 + (s.turn.glassProofDepth ?? 0) * 12 + (s.turn.glassProofCascade ?? 0) * 18 + theoremSupport * 24);
            s.turn.glassWaveQueue = Math.max(0, queue - 3);
            if (queue >= 5) {
              s.turn.nextCardMultiplied = true;
            }
          }
        }

        if (
          unit.burningGardenPhase === 'Burn'
          && (s.turn.burningGardenCrownStacks ?? 0) > 0
          && hasBurningGardenCardOnBoard(s, 'bg-et-vethkorath-seven-crown-proof')
        ) {
          s.turn.burningGardenCrownStacks = Math.max(0, (s.turn.burningGardenCrownStacks ?? 0) - 1);
          amount += 260;
        }

        if (hasBurningGardenCardOnBoard(s, 'bg-inf-final-chord-incandescent')) {
          const represented = getBurningGardenRepresentedLineages(s);
          if (represented.length >= 3) {
            amount += 220;
            const grove = s.board.emberGrove ?? (s.board.emberGrove = []);
            if (grove.length > 0) {
              const seed = grove[0];
              const source = `${def.definitionId}:${unit.instanceId}:incandescent:${s.turn.turnNumber ?? 0}`;
              seed.chromaticSources = [...new Set([...(seed.chromaticSources ?? []), source])];
              seed.memoryPower = Math.max(1, seed.chromaticSources.length);
            }
          }
        }

        amount = Math.round(amount * getBurningGardenEchoPenalty(unit));
        amount = Math.round(amount * consumePyroHeatAttackAmplifier(s, def));
        amount = Math.round(amount * getPyroFurnaceAttackMultiplier(s, def));
        amount = Math.round(amount * getSetFullFireMultiplier(s, def));
        grantOblivion(s, amount);
        // Card-break: synergized Seraphim attacks build +15 stagger.
        if (attackId === 'synergized') applyCardBreakStagger(s, 15);
        if (def.definitionId === 'tx-sera-null-entropy' && capturedPatience >= 10) {
          s.turn.neutralityPatientLightStacks = Math.max(0, s.turn.neutralityPatientLightStacks ?? 0) + 1;
        }
        if (chromaEmbers > 0 && def.element === 'Fire' && (def.rarity === 'Eternal' || def.rarity === 'Infinite')) {
          const secondary = (s.turn.secondaryCounters ??= {} as NonNullable<TurnState['secondaryCounters']>);
          secondary.pyro = 0;
        }
        eventBus.emit('seraphim:attacked', { slot, attackId: attack.id, amount });

        const refreshed = s.board.frontSlots[slot];
        if (refreshed && refreshed.type === 'Seraphim') {
          const crownCooldownReduction =
            unit.burningGardenPhase === 'Burn' && hasBurningGardenCardOnBoard(s, 'bg-et-vethkorath-seven-crown-proof')
              ? 1
              : 0;
          const spikeReduction = usedSpike ? 1 : 0;
          let sentinelReduction = 0;
          const sentinelOnBoard = s.board.backSlots.some(back => back?.type === 'Cherubim' && back.definitionId === 'tx-cher-null-sentinel');
          if (sentinelOnBoard) {
            const spent = spendNeutralityEquilibriumSigils(s, 4);
            if (spent >= 4) {
              sentinelReduction = 2;
              s.turn.neutralityPatientLightStacks = Math.max(0, s.turn.neutralityPatientLightStacks ?? 0) + 1;
            }
          }
          const effectiveCooldown = Math.max(1, attack.cooldownCards + buffs.cooldownDeltaCards - crownCooldownReduction - spikeReduction - sentinelReduction);
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
            const attackSetKey = getCardCategoryKey(def);
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
          def.element.toLowerCase(),
          attack.label.toLowerCase(),
          attack.id.toLowerCase(),
        ];
        if (isBurningGardenCard(def)) {
          igniteBurningGardenInstance(unit);
          s.board.frontSlots[slot] = unit;
        }
        const buffs = collectAttackBuffs(s.board, s.turn, 'Angel', def.definitionId, attackTags);

        const costs = attack.costs ?? [];
        if (!canPayAttackCosts(s, costs, { type: 'Angel', instanceId: unit.instanceId }, paymentSelection)) return;
        payAttackCosts(s, costs, paymentSelection);
        const chromaEmbers = def.element === 'Fire' && (def.rarity === 'Eternal' || def.rarity === 'Infinite')
          ? Math.max(0, s.turn.secondaryCounters?.pyro ?? 0)
          : 0;
        const chromaMultiplier = getPyroChromaAttackMultiplier(s, def);

        let amount = Math.round(
          Math.max(0, attack.baseOblivion + buffs.baseOblivionBonus)
          * Math.max(0.1, buffs.multiplier * getBurningGardenAttackMultiplier(unit) * chromaMultiplier),
        );

        if (def.definitionId === 'inf-prismatic-judgement-array') {
          const distinctChannels = Math.min(6, new Set(s.turn.prismaticDistinctChannels ?? []).size);
          amount += distinctChannels * 280;
        }

        if (hasBurningGardenCardOnBoard(s, 'bg-inf-final-chord-incandescent')) {
          const represented = getBurningGardenRepresentedLineages(s);
          if (represented.length >= 3) {
            amount += 220;
            const grove = s.board.emberGrove ?? (s.board.emberGrove = []);
            if (grove.length > 0) {
              const seed = grove[0];
              const source = `${def.definitionId}:${unit.instanceId}:incandescent:${s.turn.turnNumber ?? 0}`;
              seed.chromaticSources = [...new Set([...(seed.chromaticSources ?? []), source])];
              seed.memoryPower = Math.max(1, seed.chromaticSources.length);
            }
          }
        }

        amount = Math.round(amount * getBurningGardenEchoPenalty(unit));
        amount = Math.round(amount * consumePyroHeatAttackAmplifier(s, def));
        amount = Math.round(amount * getPyroFurnaceAttackMultiplier(s, def));
        amount = Math.round(amount * getSetFullFireMultiplier(s, def));
        grantOblivion(s, amount);
        // Card-break: exalted Angel attacks build +25 stagger.
        if (attackId === 'exalted') applyCardBreakStagger(s, 25);
        if (chromaEmbers > 0 && def.element === 'Fire' && (def.rarity === 'Eternal' || def.rarity === 'Infinite')) {
          const secondary = (s.turn.secondaryCounters ??= {} as NonNullable<TurnState['secondaryCounters']>);
          secondary.pyro = 0;
        }
        eventBus.emit('angel:attacked', { slot, attackId: attack.id, amount });

        const refreshed = s.board.frontSlots[slot];
        if (refreshed && refreshed.type === 'Angel') {
          const effectiveCooldown = Math.max(1, attack.cooldownCards + buffs.cooldownDeltaCards);
          refreshed.attackCooldowns = { ...(refreshed.attackCooldowns ?? {}), [attack.id]: effectiveCooldown };
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
        // Preserve Dream Lattice across turns if Solarvex Ward or Lune Choir Ascension is on the board.
        const solarvexWardIds = new Set(['wuas-cher-solarvex-ward', 'inf-wuas-lune-choir-ascension']);
        const wardActive = s.board.backSlots.some(
          slot => slot?.type === 'Cherubim' && solarvexWardIds.has(slot.definitionId),
        );
        const preservedDreamLattice = wardActive ? (s.turn.dreamLattice ?? 0) : 0;
        s.turn.turnNumber = (s.turn.turnNumber ?? 0) + 1;
        s.turn.emberGroveEchoUsedThisTurn = false;
        if (s.deck.drawPile.length < 5 && s.deck.discardPile.length > 0) {
          s.deck.drawPile = DeckSystem.reshuffleDiscard(s.deck.drawPile, s.deck.discardPile);
          s.deck.discardPile = [];
        }
        const { drawn, remaining } = DeckSystem.draw(s.deck.drawPile, 5);
        s.deck.drawPile = remaining;
        for (const card of drawn) s.deck.hand.push(card);

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
          if (preservedDreamLattice > 0) s.turn.dreamLattice = preservedDreamLattice;
          return;
        }

        s.turn = { ...defaultTurn, phase: isGuidedTrial ? 'playing' : 'mulligan' };
        if (preservedDreamLattice > 0) s.turn.dreamLattice = preservedDreamLattice;
        // Propagate equipped artifacts from the active saved deck into TurnState.
        const activeDeckForArtifacts = s.progress.savedDecks.find(d => d.id === s.progress.activeDeckId);
        s.turn.equippedArtifactIds = activeDeckForArtifacts?.equippedArtifacts?.slice() ?? [];
        // Apply artifact start-of-turn bonuses (after equippedArtifactIds is populated).
        const flameStartBonus = getArtifactEffect(s.turn, 'flame_start_bonus', s.progress.ownedArtifacts);
        if (flameStartBonus > 0) {
          s.turn.blackGlassWhiteFlame = flameStartBonus;
          s.turn.blackGlassBlackFlame = flameStartBonus;
        }
        const voltageStartBonus = getArtifactEffect(s.turn, 'voltage_surge_rate', s.progress.ownedArtifacts);
        if (voltageStartBonus > 0) {
          // Snowbound Voltage: passive Arctic Charge priming each turn start.
          s.turn.arcticCharge = (s.turn.arcticCharge ?? 0) + voltageStartBonus;
        }
        const bloomStartBonus = Math.floor(getArtifactEffect(s.turn, 'bloom_start_bonus', s.progress.ownedArtifacts));
        if (bloomStartBonus > 0) {
          s.turn.bloom = (s.turn.bloom ?? 0) + bloomStartBonus;
        }
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
          if (!def || def.element !== 'DeathFlamedHell') return false;
          if (!card.definitionId.startsWith('dfh-ser-') && !card.definitionId.startsWith('dfh-cher-') && !card.definitionId.startsWith('dfh-oph-') && !card.definitionId.startsWith('dfh-ang-')) {
            return false;
          }
          const wasBack = card.faceState === 'back';
          card.faceState = wasBack ? 'front' : 'back';
          if (wasBack && isDeathFlamedHellBaseDefinitionId(card.definitionId)) {
            const marks = Math.max(0, s.turn.dfhVeilMarks ?? 0);
            if (marks > 0) {
              const perMark = Math.max(0, s.turn.dfhVeilOblivionPerMark ?? DFH_ETERNAL_VEIL_DEFAULT_OBLIVION_PER_MARK);
              grantOblivion(s, marks * perMark);
              s.turn.dfhVeilMarks = 0;
              s.turn.dfhVeilOblivionPerMark = 0;
            }
          }
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
        s.turn.mulliganSelected = [];
        s.turn.phase = 'playing';
        if (selected.length === 0) return;
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

    echoEmberGroveCard: () => {
      let echoed = false;
      set(s => {
        echoed = reviveBurningGardenEcho(s);
      });
      return echoed;
    },

    igniteBurningGardenCard: (instanceId) => {
      set(s => {
        for (const slot of s.board.frontSlots) {
          if (!slot) continue;
          const definition = CardRegistry.get(slot.definitionId);
          if (slot.instanceId === instanceId && isBurningGardenCard(definition)) {
            igniteBurningGardenInstance(slot);
            break;
          }
        }
        for (const slot of s.board.backSlots) {
          if (!slot) continue;
          const definition = CardRegistry.get(slot.definitionId);
          if (slot.instanceId === instanceId && isBurningGardenCard(definition)) {
            igniteBurningGardenInstance(slot);
            break;
          }
        }
        recompute(s);
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
            element: def.element,
            rarity: def.rarity,
            finish: deckCard.finish,
            level: 1,
            isActive: false,
            attackCooldowns: {},
            boardSlot: slot,
          };
          applyPrismaticDefaults(seraphimInst, def);
          initializeBurningGardenInstance(seraphimInst, def);
          s.board.frontSlots[slot] = seraphimInst;
          s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);
          refractSpectrumTokens(s.board, seraphimInst.instanceId, def);
          recompute(s);

          awardOblivionForCardPlay(s, 0, false);
          applyCherubimPassiveEffects(s);
          tickCherubimDurability(s);

          const result = CardEffectExecutor.execute(deckCard, s.turn, s.board, s.deck, true);
          if (result.canPlay) {
            s.turn = result.turn;
            s.board = result.board;
            s.deck = result.deck;
            if (result.pendingEffect) s.turn.pendingEffect = result.pendingEffect;
            applyAllSetPlayStates(s, def, turnBefore, actionClass);
            applyButterflyBasePlayProgression(s, def);
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
            element: cherubimDef.element,
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
              applyPrismaticDefaults(cherubimInst, cherubimDef);
              initializeBurningGardenInstance(cherubimInst, cherubimDef);
          s.board.backSlots[backSlotIndex] = cherubimInst;
          s.deck.hand = s.deck.hand.filter(c => c.instanceId !== deckCard.instanceId);
              refractSpectrumTokens(s.board, cherubimInst.instanceId, cherubimDef);
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
              useNextCardMultiplier: false,
            },
          );
          if (!result.canPlay) return;
          s.turn = result.turn;
          s.board = result.board;
          s.deck = result.deck;
          if (result.pendingEffect) s.turn.pendingEffect = result.pendingEffect;
          applyAllSetPlayStates(s, def, turnBefore, actionClass);
          applyButterflyBasePlayProgression(s, def);

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
        applyAllSetPlayStates(s, def, turnBefore, actionClass);
        applyButterflyBasePlayProgression(s, def);

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
      set(s => {
        if (s.turn.phase !== 'playing') return;
        if (s.turn.trail <= 0) return;
        if (!storeContainsCard(s, def => def.element === 'Thornbound')) return;
        ensureThornboundTurnState(s.turn);
        s.turn.trail -= 1;
        s.turn.thornScar = Math.min(40, (s.turn.thornScar ?? 0) + 1);
        recompute(s);
      });
    },

    consumeFoamToDraw: () => {
      set(s => {
        if (s.turn.phase !== 'playing') return;
        if (s.turn.pendingEffect) return;
        if (!storeContainsCard(s, def => def.element === 'EternalSeas')) return;
        ensureEternalSeasTurnState(s.turn);
        if ((s.turn.eternalSeasFoam ?? 0) < 5) return;
        s.turn.eternalSeasFoam = Math.max(0, (s.turn.eternalSeasFoam ?? 0) - 5);
        s.deck = TurnSystem.drawCards(s.deck, 1);
        recompute(s);
      });
    },

    resolvePending: (selected) => {
      set(s => {
        const pending = s.turn.pendingEffect;
        if (!pending) return;

        if (pending.type === 'discard_choice') {
          const handIds = new Set(s.deck.hand.map(card => card.instanceId));
          const uniqueSelected = Array.from(new Set(selected));
          if (!uniqueSelected.every(id => handIds.has(id))) return;

          const maxDiscard = Math.min(pending.count, s.deck.hand.length);
          const isVariableDiscard = pending.sourceCard.includes(':draw_plus:');
          if (isVariableDiscard) {
            if (uniqueSelected.length > maxDiscard) return;
          } else if (uniqueSelected.length !== maxDiscard) {
            return;
          }

          recordLossEvent(
            s,
            s.deck.hand.filter(card => uniqueSelected.includes(card.instanceId)).map(card => ({ definitionId: card.definitionId })),
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
            s.deck = TurnSystem.takeFromTop(s.deck, pending.cards.filter(c => selected.includes(c.instanceId)), pending.cards.filter(c => !selected.includes(c.instanceId)));
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
            s.deck = TurnSystem.takeFromTop(s.deck, pending.cards.filter(c => selected.includes(c.instanceId)), pending.cards.filter(c => !selected.includes(c.instanceId)));
          }
        } else if (pending.type === 'search_deck') {
          const requiredSelections = Math.min(pending.take, pending.cards.length);
          const pendingCardIds = new Set(pending.cards.map(c => c.instanceId));
          const uniqueSelections = new Set(selected);

          if (selected.length > 0) {
            if (selected.length !== requiredSelections) return;
            if (uniqueSelections.size !== selected.length) return;
            if (selected.some(id => !pendingCardIds.has(id))) return;
          }

          s.deck.drawPile = s.deck.drawPile.filter(c => !selected.includes(c.instanceId));
          s.deck.hand.push(...pending.cards.filter(c => selected.includes(c.instanceId)));
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
          s.deck.discardPile = s.deck.discardPile.filter(c => !selected.includes(c.instanceId));
          s.deck.hand.push(...pending.cards.filter(c => selected.includes(c.instanceId)));
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
        }

        s.deck = normalizeDeckInstanceIds(s.deck);

        s.turn.pendingEffect = null;
      });
    },

    endTurn: () => {
      set(s => {
        endTurnInternal(s);
      });
    },

    endAndBeginAgain: () => {
      set(s => {
        if (s.turn.phase !== 'playing') return;
        // Match End Turn behavior during boss encounters.
        if (s.bossFight.mode === 'active') {
          completeBossFight(s, false);
          return;
        }

        // Run all end-turn cleanup logic (same as endTurnInternal)
        if ((s.turn.glassWhiteLedgerActive ?? false) && (s.turn.glassWhiteLedger ?? 0) > 0) {
          const ledger = s.turn.glassWhiteLedger ?? 0;
          grantOblivion(s, ledger);
          if ((s.turn.secondaryCounters?.absol ?? 0) >= 9) {
            s.turn.glassWhiteLedger = Math.floor(ledger * 0.3);
          } else {
            s.turn.glassWhiteLedger = 0;
          }
          s.turn.glassWhiteLedgerActive = false;
        }

        // Burning Garden cards persist on board unless they char.
        for (let i = 0; i < s.board.frontSlots.length; i++) {
          const slot = s.board.frontSlots[i];
          if (slot && isBurningGardenCard(CardRegistry.get(slot.definitionId))) {
            if (slot.burningGardenPhase === 'Burn') {
              slot.burnTurnsRemaining = Math.max(0, (slot.burnTurnsRemaining ?? 2) - 1);
              if ((slot.burnTurnsRemaining ?? 0) <= 0) {
                charBurningGardenBoardCard(s, { kind: 'front', index: i as 0 | 1 | 2 | 3 | 4 }, slot);
              }
            }
            continue;
          }
          if (slot?.type === 'Seraphim') {
            recordLossEvent(s, [{ definitionId: slot.definitionId }], 'board');
            s.deck.discardPile.push(toDeckCard(slot));
          }
          (s.board.frontSlots as Array<(typeof s.board.frontSlots)[number]>)[i] = null;
        }

        // Back-row cleanup at turn end.
        for (let i = 0; i < s.board.backSlots.length; i++) {
          const card = s.board.backSlots[i];
          if (!card) continue;

          if (isBurningGardenCard(CardRegistry.get(card.definitionId))) {
            if (card.burningGardenPhase === 'Burn') {
              card.burnTurnsRemaining = Math.max(0, (card.burnTurnsRemaining ?? 2) - 1);
              if ((card.burnTurnsRemaining ?? 0) <= 0) {
                charBurningGardenBoardCard(s, { kind: 'back', index: i as 0 | 1 | 2 | 3 }, card);
              }
            }
            continue;
          }

          if (card.type === 'Cherubim' && card.durability !== undefined) {
            recordLossEvent(s, [{ definitionId: card.definitionId }], 'board');
            s.deck.discardPile.push(toDeckCard(card));
            s.board.backSlots[i] = null;
          } else if (card.type === 'Cherubim') {
            const def = ScoreSystem.getDefinition(card.definitionId);
            if (def && def.type === 'Cherubim' && (def as import('@/types/cards').CherubimDefinition).discardCondition) {
              const condition = (def as import('@/types/cards').CherubimDefinition).discardCondition!;
              let shouldDiscard = false;
              
              switch (condition.type) {
                case 'hand_size_lte':
                  shouldDiscard = s.deck.hand.length <= condition.value;
                  break;
                case 'chain_lte':
                  shouldDiscard = false;
                  break;
                case 'oblivion_lte':
                  shouldDiscard = s.progress.oblivion <= condition.value;
                  break;
                case 'radiance_lte':
                  shouldDiscard = s.turn.radiance <= condition.value;
                  break;
                case 'cards_played_gte':
                  shouldDiscard = s.turn.cardsPlayedThisTurn >= condition.value;
                  break;
                case 'seraphim_count_lte':
                  shouldDiscard = s.board.frontSlots.filter(sl => sl?.type === 'Seraphim').length <= condition.value;
                  break;
                case 'trail_lte':
                  shouldDiscard = s.turn.trail <= condition.value;
                  break;
                case 'strain_gte':
                  shouldDiscard = s.turn.strain >= condition.value;
                  break;
              }
              
              if (shouldDiscard) {
                recordLossEvent(s, [{ definitionId: card.definitionId }], 'expire');
                s.deck.discardPile.push(toDeckCard(card));
                s.board.backSlots[i] = null;
                applyCherubimExpireBonuses(s, 1);
                eventBus.emit('cherubim:expired', { backSlot: i as 0 | 1 | 2 | 3, definitionId: card.definitionId });
              }
            }
          }
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
        
        // Preserve Dream Lattice across turns if Solarvex Ward or Lune Choir Ascension is on the board.
        const solarvexWardIds = new Set(['wuas-cher-solarvex-ward', 'inf-wuas-lune-choir-ascension']);
        const wardActive = s.board.backSlots.some(
          slot => slot?.type === 'Cherubim' && solarvexWardIds.has(slot.definitionId),
        );
        const preservedDreamLattice = wardActive ? (s.turn.dreamLattice ?? 0) : 0;
        
        s.turn.turnNumber = (s.turn.turnNumber ?? 0) + 1;
        s.turn.emberGroveEchoUsedThisTurn = false;
        if (s.deck.drawPile.length < 5 && s.deck.discardPile.length > 0) {
          s.deck.drawPile = DeckSystem.reshuffleDiscard(s.deck.drawPile, s.deck.discardPile);
          s.deck.discardPile = [];
        }
        const { drawn, remaining } = DeckSystem.draw(s.deck.drawPile, 5);
        s.deck.drawPile = remaining;
        for (const card of drawn) s.deck.hand.push(card);
        s.turn = { ...defaultTurn, phase: 'mulligan' };
        if (preservedDreamLattice > 0) s.turn.dreamLattice = preservedDreamLattice;
        
        // Propagate equipped artifacts from the active saved deck into TurnState.
        const activeDeckForArtifacts = s.progress.savedDecks.find(d => d.id === s.progress.activeDeckId);
        s.turn.equippedArtifactIds = activeDeckForArtifacts?.equippedArtifacts?.slice() ?? [];
        
        // Apply artifact start-of-turn bonuses (after equippedArtifactIds is populated).
        const flameStartBonus = getArtifactEffect(s.turn, 'flame_start_bonus', s.progress.ownedArtifacts);
        if (flameStartBonus > 0) {
          s.turn.blackGlassWhiteFlame = flameStartBonus;
          s.turn.blackGlassBlackFlame = flameStartBonus;
        }
        const voltageStartBonus = getArtifactEffect(s.turn, 'voltage_surge_rate', s.progress.ownedArtifacts);
        if (voltageStartBonus > 0) {
          s.turn.arcticCharge = (s.turn.arcticCharge ?? 0) + voltageStartBonus;
        }
        const bloomStartBonus2 = Math.floor(getArtifactEffect(s.turn, 'bloom_start_bonus', s.progress.ownedArtifacts));
        if (bloomStartBonus2 > 0) {
          s.turn.bloom = (s.turn.bloom ?? 0) + bloomStartBonus2;
        }
        
        recompute(s);
      });
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
          const replacement = legendaryPool[Math.floor(Math.random() * legendaryPool.length)];
          const replaceIndex = Math.floor(Math.random() * drawn.length);
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
          const replacement = legendaryPool[Math.floor(Math.random() * legendaryPool.length)];
          const replaceIndex = Math.floor(Math.random() * drawn.length);
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
        if (owned < ingredient.count) return false;
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
        p.customUiTheme = remote.customUiTheme;
        p.signatureCardIds = remote.signatureCardIds;
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
      const lightYield = getCardDissolveYield(definition.rarity, definition.element);
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
        const lightYield = getCardDissolveYield(definition.rarity, definition.element);
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
          deck: JSON.parse(JSON.stringify(s.deck)) as DeckState,
          board: JSON.parse(JSON.stringify(s.board)) as BoardState,
          turn: JSON.parse(JSON.stringify(s.turn)) as TurnState,
          progress: JSON.parse(JSON.stringify(s.progress)) as ProgressState,
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
        const savedDeck = s.progress.savedDecks.find(d => d.id === savedDeckId);
        if (!savedDeck) return;

        const savedState: SavedGameState = {
          deck: JSON.parse(JSON.stringify(s.deck)) as DeckState,
          board: JSON.parse(JSON.stringify(s.board)) as BoardState,
          turn: JSON.parse(JSON.stringify(s.turn)) as TurnState,
          progress: JSON.parse(JSON.stringify(s.progress)) as ProgressState,
          settings: { ...s.settings },
        };

        const modifiers = options?.modifiers ?? [];
        const coopPartySize = Math.max(1, Math.min(3, options?.coopPartySize ?? 1));

        // Apply boss HP. Event bosses snapshot once per cycle and stay fixed.
        let maxHp = isEventBossCategory(boss.category)
          ? ensureEventBossHpSnapshot(s.progress)
          : boss.hp;
        if (modifiers.some(m => m.kind === 'boss_hp_boost')) {
          maxHp = Math.round(maxHp * 1.25);
        }
        maxHp = Math.round(maxHp * (COOP_BOSS_HP_SCALE_BY_PARTY_SIZE[coopPartySize] ?? 1));

        // Time pressure
        let roundSeconds = BOSS_FIGHT_ROUND_SECONDS;
        if (modifiers.some(m => m.kind === 'time_pressure')) {
          roundSeconds = Math.max(60, roundSeconds - 30);
        }

        s.deck = createDeckState(savedDeck.deckList, savedDeck.extraDeck ?? []);
        s.board = { frontSlots: [null, null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] };
        s.turn = { ...defaultTurn, phase: 'idle' };

      // Chain start low modifier — no longer relevant (chain removed).
        if (modifiers.some(m => m.kind === 'chain_start_low')) {
        }

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
          coopSessionId: options?.coopSessionId,
          coopRole: options?.coopRole,
          rewardSummary: null,
        };
        recompute(s);
      });
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
          deck: JSON.parse(JSON.stringify(s.deck)) as typeof s.deck,
          board: JSON.parse(JSON.stringify(s.board)) as typeof s.board,
          turn: JSON.parse(JSON.stringify(s.turn)) as typeof s.turn,
          progress: JSON.parse(JSON.stringify(s.progress)) as typeof s.progress,
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
          deck: JSON.parse(JSON.stringify(s.deck)) as typeof s.deck,
          board: JSON.parse(JSON.stringify(s.board)) as typeof s.board,
          turn: JSON.parse(JSON.stringify(s.turn)) as typeof s.turn,
          progress: JSON.parse(JSON.stringify(s.progress)) as typeof s.progress,
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

    // ── Trial Deck ──────────────────────────────────────────────────────────────

    startTrialDeck: (packId) => {
      set(s => {
        if (s.trialDeck.mode !== 'idle') return;
        if (s.bossFight.mode !== 'idle') return;
        const def = getTrialDeckDefinition(packId);
        if (!def) return;
        const trialMode: 'solo' = 'solo';

        const savedState: SavedGameState = {
          deck: JSON.parse(JSON.stringify(s.deck)) as DeckState,
          board: JSON.parse(JSON.stringify(s.board)) as BoardState,
          turn: JSON.parse(JSON.stringify(s.turn)) as TurnState,
          progress: JSON.parse(JSON.stringify(s.progress)) as ProgressState,
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
          deck: JSON.parse(JSON.stringify(s.deck)) as DeckState,
          board: JSON.parse(JSON.stringify(s.board)) as BoardState,
          turn: JSON.parse(JSON.stringify(s.turn)) as TurnState,
          progress: JSON.parse(JSON.stringify(s.progress)) as ProgressState,
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
          s.deck = JSON.parse(JSON.stringify(saved.deck)) as DeckState;
          s.board = JSON.parse(JSON.stringify(saved.board)) as BoardState;
          s.turn = JSON.parse(JSON.stringify(saved.turn)) as TurnState;
          s.progress = JSON.parse(JSON.stringify(saved.progress)) as ProgressState;
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
          };
        } else {
          const prof = op['profile'] as Record<string, unknown>;
          if (typeof prof['name'] !== 'string' || !prof['name']) prof['name'] = 'Wanderer';
          if (typeof prof['bio'] !== 'string') prof['bio'] = '';
          if (typeof prof['avatarId'] !== 'string') prof['avatarId'] = 'pic-classic-acolyte';
          if (prof['titleId'] === undefined) prof['titleId'] = null;
          if (typeof prof['uiThemeId'] !== 'string') prof['uiThemeId'] = 'theme-warm-default';
          if (prof['customUiTheme'] === undefined) prof['customUiTheme'] = null;
          if (!Array.isArray(prof['unlockedAvatarIds'])) {
            prof['unlockedAvatarIds'] = [];
          } else {
            prof['unlockedAvatarIds'] = (prof['unlockedAvatarIds'] as unknown[])
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
        if (ot['emberGroveEchoUsedThisTurn'] === undefined) ot['emberGroveEchoUsedThisTurn'] = false;
        if (ot['equilibriumDrift'] === undefined) ot['equilibriumDrift'] = 0;
        if (ot['equilibriumStability'] === undefined) ot['equilibriumStability'] = 0;
        if (ot['neutralitySetupCount'] === undefined) ot['neutralitySetupCount'] = 0;
        if (ot['attenuationClassUses'] === undefined) {
          ot['attenuationClassUses'] = { setup: 0, conversion: 0, multiplier: 0, refund: 0, finisher: 0 };
        }
        if (ot['attenuationBreaksUsed'] === undefined) ot['attenuationBreaksUsed'] = 0;
        if (ot['attenuationBrokenClasses'] === undefined) ot['attenuationBrokenClasses'] = [];
        if (ot['crossSetConversionDistinctSources'] === undefined) ot['crossSetConversionDistinctSources'] = [];
        if (ot['neutralityEngineSignatures'] === undefined) ot['neutralityEngineSignatures'] = [];
        if (ot['neutralityPatienceChargedThisTurn'] === undefined) ot['neutralityPatienceChargedThisTurn'] = 0;
        if (ot['neutralityPatienceConsumedThisTurn'] === undefined) ot['neutralityPatienceConsumedThisTurn'] = 0;
        if (ot['neutralityChainGainedThisTurn'] === undefined) ot['neutralityChainGainedThisTurn'] = 0;
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
        if (ot['lightCadenceNotes'] === undefined) ot['lightCadenceNotes'] = [];
        if (ot['lightDistinctNotes'] === undefined) ot['lightDistinctNotes'] = [];
        if (ot['lightResonance'] === undefined) ot['lightResonance'] = 0;
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
        if (ot['snowboundPotential'] === undefined) ot['snowboundPotential'] = 0;
        if (ot['snowboundAlternations'] === undefined) ot['snowboundAlternations'] = 0;
        if (ot['snowboundConduits'] === undefined) ot['snowboundConduits'] = 0;
        if (ot['glassProofFragments'] === undefined) ot['glassProofFragments'] = 0;
        if (ot['glassProofDepth'] === undefined) ot['glassProofDepth'] = 0;
        if (ot['glassProofCascade'] === undefined) ot['glassProofCascade'] = 0;
        if (ot['glassAxioms'] === undefined) ot['glassAxioms'] = [];
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
        if (ot['lastPlayedElement'] === undefined) ot['lastPlayedElement'] = null;

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

          const totalOwned = loaded.progress.collection[definitionId] ?? 0;
          const holoOwned = Math.min(loaded.progress.holoCollection[definitionId] ?? 0, totalOwned);
          const normalOwned = Math.max(0, totalOwned - holoOwned);
          const ownedForFinish = finishPart === 'holo' ? holoOwned : normalOwned;
          if (ownedForFinish <= 0) continue;

          cleanedFavorites[favoriteKey] = true;
        }
        loaded.progress.favoriteCollection = cleanedFavorites;

        // Migrate bossFight: add if missing from saved state
        if (!loaded.bossFight) {
          (loaded as unknown as Record<string, unknown>)['bossFight'] = { ...defaultBossFight };
        } else if (
          loaded.bossFight.mode === 'active'
          && loaded.bossFight.kind === 'null_raid'
          && !loaded.bossFight.savedGameState
        ) {
          // Corrupted raid snapshots can trap the player in an unfinishable active raid on load.
          loaded.bossFight = { ...defaultBossFight };
        } else if (
          loaded.bossFight.mode === 'active'
          && (typeof loaded.bossFight.fightTimeRemaining !== 'number'
            || !Number.isFinite(loaded.bossFight.fightTimeRemaining)
            || loaded.bossFight.fightTimeRemaining <= 0)
        ) {
          // Active boss fight loaded with a missing/invalid/expired timer: reset to idle so
          // the player isn't trapped on an arena screen whose timer can never tick down.
          loaded.bossFight = { ...defaultBossFight };
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
export const selectRadiance = (s: Store): number => s.turn.radiance;
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
