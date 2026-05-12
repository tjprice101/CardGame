import type { AngelInstance, SeraphimInstance, ChaosInstance } from './cards';
import type { ActiveBoardEffect, CardSubtypeFilter } from './effects';
import type { BossFightState } from './bossFight';

// ── Board ─────────────────────────────────────────────────────────────────────

export type FrontSlot = SeraphimInstance | AngelInstance | null;
export type BackSlot = ChaosInstance | null;

export interface BoardState {
  frontSlots: [FrontSlot, FrontSlot, FrontSlot, FrontSlot, FrontSlot];
  backSlots: [BackSlot, BackSlot, BackSlot, BackSlot];
  activeBoardEffects: ActiveBoardEffect[];  // accumulated from cards this turn; reset at turn end
}

export interface ComputedBoardStats {
  activeSynergies: number;
  oblivionPerCardBonus: number;   // flat Oblivion added per card played (from active Seraphim)
  seekerOblivionBonus: number;    // bonus Oblivion when Seeker cards are played (from active Seraphim)
  chaosExtraPlays: number;        // extra durability added to placed Chaos cards (from active Seraphim)
  embersPerCardBonus: number;     // flat Embers added per card played (from ember_per_card Seraphim, Pyroabyss)
}

// ── Deck ──────────────────────────────────────────────────────────────────────

export interface DeckEntry {
  definitionId: string;
  copies: 1 | 2 | 3 | 4;
}

export interface DeckCard {
  instanceId: string;
  definitionId: string;
}

export interface DeckState {
  deckList: DeckEntry[];
  extraDeck: string[];        // Angel definitionIds; up to 10 total, max 4 copies of each unique angel
  drawPile: DeckCard[];
  hand: DeckCard[];
  discardPile: DeckCard[];
}

// ── Turn ──────────────────────────────────────────────────────────────────────

export type TurnPhase = 'idle' | 'mulligan' | 'playing';

export type PendingEffect =
  | { type: 'discard_choice'; count: number; sourceCard: string }
  | { type: 'look_top_take'; cards: DeckCard[]; take: number }
  | { type: 'look_top_take_drop'; cards: DeckCard[]; drop: number }
  | { type: 'look_top_take_type'; cards: DeckCard[]; filter: CardSubtypeFilter[] }
  | { type: 'search_deck'; cards: DeckCard[]; filter: CardSubtypeFilter[] }
  | { type: 'salvage'; cards: DeckCard[]; filter: CardSubtypeFilter[] | null }
  | { type: 'embrace_infinite'; cards: DeckCard[]; keep: number };

export interface TurnState {
  phase: TurnPhase;
  radiance: number;
  embers: number;
  cardsPlayedThisTurn: number;
  chainMultiplier: number;          // 1.0 + cardsPlayedThisTurn * 0.1; grows as cards are played
  chainFloor: number;               // minimum chain multiplier (Angels can set a floor)
  oblivionEarnedThisTurn: number;
  lastPlayedDefinitionId: string | null;
  nextCardMultiplied: boolean;
  mulliganSelected: string[];
  pendingEffect: PendingEffect | null;
}

// ── Saved Decks ───────────────────────────────────────────────────────────────

export interface SavedDeck {
  id: string;
  name: string;
  deckList: DeckEntry[];
  extraDeck: string[];        // up to 10 Angel definitionIds, max 4 of each
  isStarter: boolean;
}

// ── Progress / Settings ────────────────────────────────────────────────────────

export interface ProgressState {
  oblivion: number;
  prestige: number;
  totalCardsPlayed: number;
  collection: Record<string, number>;  // definitionId → copy count owned
  savedDecks: SavedDeck[];
  activeDeckId: string | null;
}

export interface SettingsState {
  musicVolume: number;
  sfxVolume: number;
  particlesEnabled: boolean;
  reducedMotion: boolean;
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
}
