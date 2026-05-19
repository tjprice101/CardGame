import type { AngelInstance, CardFinish, CherubimInstance, SeraphimInstance } from './cards';
import type { ActiveBoardEffect, CardSubtypeFilter } from './effects';
import type { BossFightState } from './bossFight';

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
  embersPerCardBonus: number;     // flat Embers added per card played (from ember_per_card Seraphim, Pyroabyss)
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
export type ThornboundWarPath = 'Aggression' | 'Endurance';
export type MechanicalInstruction = 'draw' | 'gain' | 'copy' | 'multiply' | 'convert' | 'trigger';
export type PrismaticChannel = 'amber' | 'azure' | 'crimson' | 'emerald' | 'violet' | 'white';
export type SnowboundPhase = 'Frost' | 'Voltage';
export type GlassAxiom = 'multiplier' | 'bridge' | 'cascade';

export type PendingEffect =
  | { type: 'discard_choice'; count: number; sourceCard: string }
  | { type: 'look_top_take'; cards: DeckCard[]; take: number }
  | { type: 'look_top_take_drop'; cards: DeckCard[]; take: number; drop: number }
  | { type: 'look_top_take_type'; cards: DeckCard[]; filter: CardSubtypeFilter[]; take: number }
  | { type: 'search_deck'; cards: DeckCard[]; filter: CardSubtypeFilter[]; take: number }
  | { type: 'salvage'; cards: DeckCard[]; filter: CardSubtypeFilter[] | null; count: number }
  | { type: 'embrace_infinite'; cards: DeckCard[]; allCards: DeckCard[]; keep: number };

export interface TurnState {
  phase: TurnPhase;
  radiance: number;
  embers: number;
  trail: number;
  strain: number;
  cherubimDrawFraction: number;
  cardsPlayedThisTurn: number;
  chainMultiplier: number;          // 1.0 + cardsPlayedThisTurn * 0.1; grows as cards are played
  chainFloor: number;               // minimum chain multiplier (Angels can set a floor)
  oblivionEarnedThisTurn: number;
  lastPlayedDefinitionId: string | null;
  turnNumber?: number;
  emberGroveEchoUsedThisTurn?: boolean;
  nextCardMultiplied: boolean;
  mulliganSelected: string[];
  pendingEffect: PendingEffect | null;
  equilibriumDrift?: number;
  equilibriumStability?: number;
  neutralitySetupCount?: number;
  attenuationClassUses?: Partial<Record<'setup' | 'conversion' | 'multiplier' | 'refund' | 'finisher', number>>;
  attenuationBreaksUsed?: number;
  attenuationBrokenClasses?: Array<'setup' | 'conversion' | 'multiplier' | 'refund' | 'finisher'>;
  crossSetConversionDistinctSources?: string[];
  neutralityEngineSignatures?: string[];
  pyroHeat?: number;
  pyroBurnDebt?: number;
  pyroStability?: number;
  pyroSetupCount?: number;
  pyroAttenuationClassUses?: Partial<Record<'setup' | 'conversion' | 'multiplier' | 'refund' | 'finisher', number>>;
  pyroAttenuationBreaksUsed?: number;
  pyroAttenuationBrokenClasses?: Array<'setup' | 'conversion' | 'multiplier' | 'refund' | 'finisher'>;
  pyroCrossSetConversionDistinctSources?: string[];
  pyroEngineSignatures?: string[];
  lightCadenceNotes?: HeavenlyNote[];
  lightDistinctNotes?: HeavenlyNote[];
  lightResonance?: number;
  lightChorusAnchors?: number;
  thornScar?: number;
  thornWarPath?: ThornboundWarPath | null;
  thornLossesThisTurn?: number;
  thornProcessions?: number;
  mechanicalInstructionQueue?: MechanicalInstruction[];
  mechanicalResolvedInstructions?: number;
  mechanicalInstructionDiversity?: MechanicalInstruction[];
  mechanicalKernelLocked?: boolean;
  prismaticCurrentChannel?: PrismaticChannel | null;
  prismaticDistinctChannels?: PrismaticChannel[];
  prismaticRefractionDepth?: number;
  prismaticNodeCharges?: number;
  blackGlassWhiteFlame?: number;
  blackGlassBlackFlame?: number;
  blackGlassFracture?: number;
  blackGlassGriefOaths?: number;
  blackGlassCollapsePending?: boolean;
  blackGlassLastPayoff?: number;
  snowboundPhase?: SnowboundPhase | null;
  snowboundPotential?: number;
  snowboundAlternations?: number;
  snowboundConduits?: number;
  glassProofFragments?: number;
  glassProofDepth?: number;
  glassProofCascade?: number;
  glassAxioms?: GlassAxiom[];
  burningGardenLaw?: 'Rose' | 'Sunflower' | 'Thistle' | null;
  burningGardenLineagesPlayed?: Array<'Rose' | 'Sunflower' | 'Thistle'>;
  burningGardenEchoesBloomed?: number;
  lastPlayedElement?: string | null;
  cherubimConditionalMult?: number; // multiplier from cherubim_conditional_buff passives, applied per card play
}

// ── Saved Decks ───────────────────────────────────────────────────────────────

export interface SavedDeck {
  id: string;
  name: string;
  deckList: DeckEntry[];
  extraDeck: ExtraDeckEntry[]; // up to 10 Angel entries, max 4 of each definition across finishes
  isStarter: boolean;
}

// ── Progress / Settings ────────────────────────────────────────────────────────

export interface ProgressState {
  oblivion: number;
  aberratedShards: number;
  prestige: number;
  totalCardsPlayed: number;
  collection: Record<string, number>;         // definitionId ↁEtotal copy count owned
  holoCollection: Record<string, number>;      // definitionId ↁEholo copy count owned
  infiniteCollection: Record<string, number>;  // definitionId ↁEInfinite card count owned
  favoriteCollection: Record<string, boolean>; // `${definitionId}::${finish}` ↁEfavorited
  bossClearCounts: Record<string, number>;
  savedDecks: SavedDeck[];
  activeDeckId: string | null;
  pityCounters: Record<string, number>;       // packId ↁEconsecutive box opens without a Legendary (resets on Legendary box)
}

export interface SettingsState {
  musicVolume: number;
  sfxVolume: number;
  particlesEnabled: boolean;
  reducedMotion: boolean;
  language: UiLanguage;
  fontSizePreset: FontSizePreset;
  cardArtDisplay: CardArtDisplay;
  cardThemePacks: Record<string, CardThemePackId>;
}

export type UiLanguage = 'en' | 'es' | 'fr';
export type FontSizePreset = 'compact' | 'standard' | 'large';
export type CardThemePackId = 'classic' | 'luminous' | 'nocturne';
export type CardArtDisplay = 'both' | 'top-only' | 'bottom-only' | 'art-only';

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
}
