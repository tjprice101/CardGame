import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  BoardState, ComputedBoardStats, DeckCard, DeckEntry,
  DeckState, GameState, ProgressState, SavedDeck, SettingsState, TurnState,
} from '@/types/game';
import type { AngelInstance, AngelDefinition, ChaosDefinition, ChaosInstance, SeraphimInstance } from '@/types/cards';
import type { ChaosRitualEffect } from '@/types/effects';
import type { BossFightState, SavedGameState } from '@/types/bossFight';
import { CardRegistry } from '@/cards/CardRegistry';
import { ScoreSystem } from '@/systems/scoring/ScoreSystem';
import { SynergySystem } from '@/systems/cards/SynergySystem';
import { DeckSystem } from '@/systems/cards/DeckSystem';
import { TurnSystem } from '@/systems/cards/TurnSystem';
import { CardEffectExecutor } from '@/systems/cards/CardEffectExecutor';
import { PackSystem } from '@/systems/cards/PackSystem';
import { PACK_DEFINITIONS } from '@/data/packs/packDefinitions';
import { STARTER_DECK_LIST, STARTER_EXTRA_DECK, STARTER_COLLECTION } from '@/systems/progression/StarterDeck';
import { BOSS_DEFINITIONS, BOSS_FIGHT_ROUND_SECONDS } from '@/data/bosses/bossDefinitions';
import { eventBus } from '@/core/events/EventBus';

const BASE_OBLIVION_PER_CARD = 5;
const EMBRACE_INFINITE_MIN_HAND = 40;

// ── Defaults ──────────────────────────────────────────────────────────────────

const NOW = Date.now();
let angelInstanceCounter = 0;

const defaultBoard: BoardState = {
  frontSlots: [null, null, null, null, null],
  backSlots: [null, null, null, null],
  activeBoardEffects: [],
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
  embers: 0,
  cardsPlayedThisTurn: 0,
  chainMultiplier: 1.0,
  chainFloor: 1.0,
  oblivionEarnedThisTurn: 0,
  lastPlayedDefinitionId: null,
  nextCardMultiplied: false,
  mulliganSelected: [],
  pendingEffect: null,
};

const defaultProgress: ProgressState = {
  oblivion: 0,
  prestige: 0,
  totalCardsPlayed: 0,
  collection: { ...STARTER_COLLECTION },
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
};

const defaultSettings: SettingsState = {
  musicVolume: 0.5,
  sfxVolume: 0.8,
  particlesEnabled: true,
  reducedMotion: false,
};

const defaultBossFight: BossFightState = {
  mode: 'idle',
  activeBossId: null,
  bossCurrentHp: 0,
  bossMaxHp: 0,
  damageDealtThisFight: 0,
  fightTimeRemaining: 0,
  cooldowns: {},
  savedGameState: null,
};

export const defaultGameState: GameState = {
  version: 5,
  startedAt: NOW,
  lastSavedAt: NOW,
  board: defaultBoard,
  deck: defaultDeck,
  turn: defaultTurn,
  progress: defaultProgress,
  settings: defaultSettings,
  bossFight: defaultBossFight,
};

// ── Store type ────────────────────────────────────────────────────────────────

interface StoreActions {
  placeSeraphim: (deckCard: DeckCard, slot: 0 | 1 | 2 | 3 | 4) => void;
  placeSeraphimFromHand: (targetSlot: 0 | 1 | 2 | 3 | 4, instanceId?: string) => void;
  removeSeraphim: (slot: 0 | 1 | 2 | 3 | 4) => void;
  placeChaos: (backSlotIndex: 0 | 1 | 2 | 3, instanceId?: string) => void;
  removeChaos: (backSlotIndex: 0 | 1 | 2 | 3) => void;
  summonAngel: (definitionId: string) => void;
  activateAngel: (slot: 0 | 1 | 2 | 3 | 4) => void;
  initDeck: (deckList: DeckEntry[], extraDeck?: string[]) => void;
  saveDeckList: (deckList: DeckEntry[]) => void;
  saveCurrentDeck: (name: string, deckList?: DeckEntry[], extraDeck?: string[]) => string;
  updateSavedDeck: (id: string, deckList: DeckEntry[], extraDeck?: string[]) => void;
  loadSavedDeck: (id: string) => void;
  deleteSavedDeck: (id: string) => void;
  beginTurn: () => void;
  toggleMulliganCard: (instanceId: string) => void;
  confirmMulligan: () => void;
  embraceInfinite: () => void;
  playCard: (instanceId: string) => void;
  resolvePending: (selected: string[]) => void;
  endTurn: () => void;
  addOblivion: (delta: number) => void;
  openPack: (packId: string) => string[] | null;
  openBox: (packId: string) => string[] | null;
  openCase: (packId: string) => string[] | null;
  updateSettings: (patch: Partial<SettingsState>) => void;
  loadState: (state: GameState) => void;
  resetToDefault: () => void;
  startBossFight: (bossId: string, savedDeckId: string) => void;
  tickBossTimer: (deltaSeconds: number) => void;
  dismissBossResult: () => void;
  computedStats: ComputedBoardStats;
  refreshComputedStats: () => void;
}

type Store = GameState & StoreActions;

function recompute(state: Store): void {
  state.computedStats = ScoreSystem.compute(state.board);
  eventBus.emit('board:recomputed', state.computedStats);
}

function cloneDeckList(deckList: DeckEntry[]): DeckEntry[] {
  return deckList.map(entry => ({ ...entry }));
}

function cloneExtraDeck(extraDeck?: string[]): string[] {
  return extraDeck ? [...extraDeck] : [];
}

function createDeckState(deckList: DeckEntry[], extraDeck?: string[]): DeckState {
  const nextDeckList = cloneDeckList(deckList);
  return {
    deckList: nextDeckList,
    extraDeck: cloneExtraDeck(extraDeck),
    drawPile: DeckSystem.buildFromList(nextDeckList),
    hand: [],
    discardPile: [],
  };
}

function addCollectionCard(progress: ProgressState, definitionId: string): void {
  const definition = CardRegistry.get(definitionId);
  const nextCopies = (progress.collection[definitionId] ?? 0) + 1;
  progress.collection[definitionId] = definition?.rarity === 'Eternal'
    ? nextCopies
    : Math.min(nextCopies, 4);
}

// ── Boss fight helpers ────────────────────────────────────────────────────────

function completeBossFight(s: Store, victory: boolean): void {
  const bossId = s.bossFight.activeBossId;
  const newCooldowns = { ...s.bossFight.cooldowns };
  if (bossId) newCooldowns[bossId] = Date.now() + 60_000;

  const saved = s.bossFight.savedGameState;
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
      addCollectionCard(s.progress, boss.rewardCardId);
    }
  }

  const finalHp = s.bossFight.bossCurrentHp;
  const damageDealt = s.bossFight.damageDealtThisFight;
  const maxHp = s.bossFight.bossMaxHp;
  s.bossFight = {
    mode: victory ? 'victory' : 'defeat',
    activeBossId: bossId,
    bossCurrentHp: finalHp,
    bossMaxHp: maxHp,
    damageDealtThisFight: damageDealt,
    fightTimeRemaining: 0,
    cooldowns: newCooldowns,
    savedGameState: null,
  };
  recompute(s);
}

function grantOblivion(s: Store, amount: number, chainMultiplier: number): void {
  if (amount <= 0) return;
  s.turn.oblivionEarnedThisTurn += amount;
  if (s.bossFight.mode === 'active') {
    s.bossFight.damageDealtThisFight += amount;
    s.bossFight.bossCurrentHp = Math.max(0, s.bossFight.bossCurrentHp - amount);
    eventBus.emit('boss:damaged', { delta: amount, remaining: s.bossFight.bossCurrentHp });
  } else {
    s.progress.oblivion += amount;
    eventBus.emit('oblivion:earned', { delta: amount, total: s.progress.oblivion, chainMultiplier });
  }
}

function checkBossDefeated(s: Store): void {
  if (s.bossFight.mode === 'active' && s.bossFight.bossCurrentHp <= 0) {
    completeBossFight(s, true);
  }
}

function canEmbraceInfinite(state: Pick<GameState, 'deck' | 'turn'>): boolean {
  return state.turn.phase === 'playing'
    && state.turn.pendingEffect === null
    && state.deck.hand.length >= EMBRACE_INFINITE_MIN_HAND;
}

function countFrontDefinitionIds(board: BoardState): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const slot of board.frontSlots) {
    if (!slot) continue;
    counts[slot.definitionId] = (counts[slot.definitionId] ?? 0) + 1;
  }
  return counts;
}

function countExtraDeckCopies(extraDeck: string[], definitionId: string): number {
  return extraDeck.filter(id => id === definitionId).length;
}

function hasAvailableAngelCopy(board: BoardState, extraDeck: string[], definitionId: string): boolean {
  const copiesOnBoard = board.frontSlots.filter(
    slot => slot?.type === 'Angel' && slot.definitionId === definitionId
  ).length;
  return copiesOnBoard < countExtraDeckCopies(extraDeck, definitionId);
}

function incrementAngelProgress(board: BoardState): void {
  for (const slot of board.frontSlots) {
    if (slot?.type === 'Angel' && !slot.activated) {
      slot.cardsPlayedSinceSummon += 1;
    }
  }
}

function canActivateAngelAbility(angel: AngelInstance, definition: AngelDefinition): boolean {
  return !angel.activated
    && angel.cardsPlayedSinceSummon >= definition.activatedAbility.cardsPlayedRequirement;
}

// ── Chaos helpers ─────────────────────────────────────────────────────────────

function computeAdjacentChaosBonus(board: BoardState, isSeeker: boolean): number {
  let bonus = 0;
  for (let i = 0; i < 4; i++) {
    const chaos = board.backSlots[i];
    if (!chaos) continue;
    const leftSlot = board.frontSlots[i];
    const rightSlot = board.frontSlots[i + 1];
    const adjacentActive = [leftSlot, rightSlot].filter(
      s => s?.type === 'Seraphim' && (s as SeraphimInstance).isActive
    ).length;
    if (adjacentActive === 0) continue;
    const def = ScoreSystem.getDefinition(chaos.definitionId);
    if (!def || def.type !== 'Chaos') continue;
    for (const effect of (def as ChaosDefinition).effects) {
      switch (effect.type) {
        case 'chaos_oblivion_per_card': bonus += effect.value * adjacentActive; break;
        case 'chaos_seeker_bonus':      if (isSeeker) bonus += effect.value * adjacentActive; break;
      }
    }
  }
  return bonus;
}

function computeAdjacentChaosEmberBonus(board: BoardState): number {
  let bonus = 0;
  for (let i = 0; i < 4; i++) {
    const chaos = board.backSlots[i];
    if (!chaos) continue;
    const leftSlot = board.frontSlots[i];
    const rightSlot = board.frontSlots[i + 1];
    const adjacentActive = [leftSlot, rightSlot].filter(
      s => s?.type === 'Seraphim' && (s as SeraphimInstance).isActive
    ).length;
    if (adjacentActive === 0) continue;
    const def = ScoreSystem.getDefinition(chaos.definitionId);
    if (!def || def.type !== 'Chaos') continue;
    for (const effect of (def as ChaosDefinition).effects) {
      if (effect.type === 'chaos_ember_gain') {
        bonus += effect.value * adjacentActive;
      }
    }
  }
  return bonus;
}

function awardOblivionForCardPlay(
  s: Store,
  cardOblivionBonus: number,
  isSeeker: boolean,
  chainOverride?: number,
): void {
  const chain = chainOverride ?? s.turn.chainMultiplier;
  const base = BASE_OBLIVION_PER_CARD * chain;

  const ampEffects = s.board.activeBoardEffects.filter(e => e.type === 'seraphim_bonus_amplifier');
  const ampMult = 1 + ampEffects.reduce((acc, e) => acc + e.value / 100, 0);

  const synergyBonus = s.computedStats.oblivionPerCardBonus * ampMult;
  const seekerBonus = isSeeker ? s.computedStats.seekerOblivionBonus * ampMult : 0;
  const chaosBonus = computeAdjacentChaosBonus(s.board, isSeeker);

  const scoreMultEffects = s.board.activeBoardEffects.filter(e => e.type === 'score_multiplier');
  const scoreMult = 1 + scoreMultEffects.reduce((acc, e) => acc + e.value / 100, 0);

  const total = Math.round((base + synergyBonus + seekerBonus + chaosBonus + cardOblivionBonus) * scoreMult);
  grantOblivion(s, total, chain);

  const emberBonus = s.computedStats.embersPerCardBonus + computeAdjacentChaosEmberBonus(s.board);
  if (emberBonus > 0) s.turn.embers += emberBonus;
}

function tickChaosDurability(s: Store): void {
  for (let i = 0; i < 4; i++) {
    const chaos = s.board.backSlots[i];
    if (!chaos) continue;
    chaos.durability -= 1;
    if (chaos.durability <= 0) {
      const expiredDef = ScoreSystem.getDefinition(chaos.definitionId) as ChaosDefinition | undefined;
      if (expiredDef?.entropy?.length) {
        fireChaosRitual(s, expiredDef.entropy, i as 0 | 1 | 2 | 3);
      }
      s.deck.discardPile.push({ instanceId: chaos.instanceId, definitionId: chaos.definitionId });
      s.board.backSlots[i] = null;
      const stillActive = s.board.frontSlots.some(
        sl => sl?.type === 'Seraphim' && (sl as SeraphimInstance).isActive && sl.definitionId === 'ser-neutral-still'
      );
      if (stillActive) {
        grantOblivion(s, 50, s.turn.chainMultiplier);
      }
      eventBus.emit('chaos:expired', { backSlot: i as 0 | 1 | 2 | 3, definitionId: chaos.definitionId });
    }
  }
}

// Fires Chaos enthalpy (on-play) or entropy (on-expiration) ritual effects directly on draft state.
// Returns whether the card should be sacrificed (removed from its back slot without going to discard again).
function fireChaosRitual(s: Store, effects: ChaosRitualEffect[], backSlot: 0 | 1 | 2 | 3): { sacrificed: boolean } {
  let sacrificed = false;
  for (const effect of effects) {
    if (effect.type === 'search_adjacent_seraphim') {
      if (s.turn.pendingEffect !== null) continue;
      const leftSlot = s.board.frontSlots[backSlot];
      const rightSlot = s.board.frontSlots[backSlot + 1];
      const adjacentIds = new Set<string>();
      if (leftSlot?.type === 'Seraphim') adjacentIds.add(leftSlot.definitionId);
      if (rightSlot?.type === 'Seraphim') adjacentIds.add(rightSlot.definitionId);
      const matching = adjacentIds.size > 0
        ? s.deck.drawPile.filter(c => adjacentIds.has(c.definitionId))
        : s.deck.drawPile.filter(c => ScoreSystem.getDefinition(c.definitionId)?.type === 'Seraphim');
      if (matching.length > 0) {
        s.turn.pendingEffect = { type: 'search_deck', cards: matching, filter: ['Seraphim'] };
      }
    } else if (effect.type === 'chaos_sacrifice_oblivion') {
      if (effect.value > 0) {
        grantOblivion(s, effect.value, s.turn.chainMultiplier);
      }
      sacrificed = true;
    } else if (effect.type === 'oblivion_flat') {
      grantOblivion(s, effect.value, s.turn.chainMultiplier);
    } else if (effect.type === 'draw') {
      s.deck = TurnSystem.drawCards(s.deck, effect.value);
    } else if (effect.type === 'shuffle_discard') {
      s.deck = TurnSystem.shuffleDiscard(s.deck);
    } else if (effect.type === 'ember_gain') {
      s.turn.embers += effect.value;
    } else if (effect.type === 'radiance_gain') {
      s.turn.radiance += effect.value;
    }
  }
  return { sacrificed };
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useStore = create<Store>()(
  immer((set, get) => ({
    ...defaultGameState,
    computedStats: ScoreSystem.compute(defaultBoard),

    refreshComputedStats: () => { set(s => { recompute(s); }); },

    // ── Seraphim ──────────────────────────────────────────────────────────────

    placeSeraphim: (deckCard, slot) => {
      set(s => {
        const prevInSlot = s.board.frontSlots[slot];
        if (prevInSlot) {
          s.deck.discardPile.push({ instanceId: prevInSlot.instanceId, definitionId: prevInSlot.definitionId });
        }
        const def = ScoreSystem.getDefinition(deckCard.definitionId);
        const seraphimInst: SeraphimInstance = {
          instanceId: deckCard.instanceId,
          definitionId: deckCard.definitionId,
          type: 'Seraphim',
          element: def?.type === 'Seraphim' ? def.element : 'Neutrality',
          rarity: def?.type === 'Seraphim' ? def.rarity : 'Common',
          level: 1,
          isActive: false,
          boardSlot: slot,
        };
        s.board.frontSlots[slot] = seraphimInst;
        s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);

        awardOblivionForCardPlay(s, 0, false);
        tickChaosDurability(s);

        if (def?.type === 'Seraphim') {
          const result = CardEffectExecutor.execute(deckCard, s.turn, s.board, s.deck, true);
          if (result.canPlay) {
            s.turn = result.turn;
            s.board = result.board;
            s.deck = result.deck;
            if (result.oblivionBonus > 0) {
              grantOblivion(s, result.oblivionBonus, s.turn.chainMultiplier);
            }
          }
        }

        s.deck.hand = s.deck.hand.filter(c => c.instanceId !== deckCard.instanceId);
        incrementAngelProgress(s.board);
        const newInst = s.board.frontSlots[slot];
        if (newInst?.type === 'Seraphim' && newInst.isActive) {
          eventBus.emit('seraphim:synergy-gained', { slot, instanceId: deckCard.instanceId });
        }
        s.progress.totalCardsPlayed += 1;
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
          s.deck.discardPile.push({ instanceId: occupant.instanceId, definitionId: occupant.definitionId });
        }
        s.board.frontSlots[slot] = null;
        recompute(s);
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
          level: 1,
          isActive: false,
          boardSlot: targetSlot,
        };
        s.board.frontSlots[targetSlot] = seraphimInst;
        s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);

        awardOblivionForCardPlay(s, 0, false);
        tickChaosDurability(s);

        const result = CardEffectExecutor.execute(deckCard, s.turn, s.board, s.deck, true);
        if (result.canPlay) {
          s.turn = result.turn;
          s.board = result.board;
          s.deck = result.deck;
          if (result.oblivionBonus > 0) {
            grantOblivion(s, result.oblivionBonus, s.turn.chainMultiplier);
          }
        }
        s.deck.hand = s.deck.hand.filter(c => c.instanceId !== deckCard.instanceId);
        incrementAngelProgress(s.board);
        s.progress.totalCardsPlayed += 1;
        checkBossDefeated(s);
        recompute(s);
      });
    },

    // ── Chaos ─────────────────────────────────────────────────────────────────

    placeChaos: (backSlotIndex, instanceId) => {
      set(s => {
        if (s.turn.phase !== 'playing') return;
        const deckCard = instanceId
          ? s.deck.hand.find(c => c.instanceId === instanceId && ScoreSystem.getDefinition(c.definitionId)?.type === 'Chaos')
          : s.deck.hand.find(c => ScoreSystem.getDefinition(c.definitionId)?.type === 'Chaos');
        if (!deckCard) return;
        const def = ScoreSystem.getDefinition(deckCard.definitionId);
        if (!def || def.type !== 'Chaos') return;
        const chaosDef = def as ChaosDefinition;

        const existing = s.board.backSlots[backSlotIndex];
        if (existing) {
          s.deck.discardPile.push({ instanceId: existing.instanceId, definitionId: existing.definitionId });
        }
        const chaosInst: ChaosInstance = {
          instanceId: deckCard.instanceId,
          definitionId: deckCard.definitionId,
          type: 'Chaos',
          element: chaosDef.element,
          rarity: chaosDef.rarity,
          level: 1,
          durability: chaosDef.maxDurability + s.computedStats.chaosExtraPlays,
          maxDurability: chaosDef.maxDurability,
          backSlot: backSlotIndex,
        };
        s.board.backSlots[backSlotIndex] = chaosInst;
        s.deck.hand = s.deck.hand.filter(c => c.instanceId !== deckCard.instanceId);

        if (chaosDef.enthalpy?.length) {
          const { sacrificed } = fireChaosRitual(s, chaosDef.enthalpy, backSlotIndex);
          if (sacrificed) {
            s.deck.discardPile.push({ instanceId: deckCard.instanceId, definitionId: deckCard.definitionId });
            s.board.backSlots[backSlotIndex] = null;
          }
        }

        awardOblivionForCardPlay(s, 0, false);
        tickChaosDurability(s);
        s.turn.cardsPlayedThisTurn += 1;
        s.turn.chainMultiplier = Math.max(
          1.0 + s.turn.cardsPlayedThisTurn * 0.1,
          s.turn.chainFloor,
        );
        incrementAngelProgress(s.board);
        s.progress.totalCardsPlayed += 1;
        checkBossDefeated(s);
        recompute(s);
      });
    },

    removeChaos: (backSlotIndex) => {
      set(s => {
        const chaos = s.board.backSlots[backSlotIndex];
        if (chaos) {
          s.deck.discardPile.push({ instanceId: chaos.instanceId, definitionId: chaos.definitionId });
          s.board.backSlots[backSlotIndex] = null;
        }
        recompute(s);
      });
    },

    // ── Angels ────────────────────────────────────────────────────────────────

    summonAngel: (definitionId) => {
      set(s => {
        if (s.turn.phase !== 'playing') return;
        if (!hasAvailableAngelCopy(s.board, s.deck.extraDeck, definitionId)) return;
        const def = ScoreSystem.getDefinition(definitionId);
        if (!def || def.type !== 'Angel') return;
        const angelDef = def as AngelDefinition;

        const costCount: Record<string, number> = {};
        for (const id of angelDef.summonCost) costCount[id] = (costCount[id] ?? 0) + 1;
        const boardCount = countFrontDefinitionIds(s.board);
        for (const [id, needed] of Object.entries(costCount)) {
          if ((boardCount[id] ?? 0) < needed) return;
        }

        if (angelDef.extraSummonConditions) {
          for (const cond of angelDef.extraSummonConditions) {
            if (cond.type === 'chaos_active_gte' && s.board.backSlots.filter(sl => sl !== null).length < cond.value) return;
            if (cond.type === 'seraphim_on_board_gte' && s.board.frontSlots.filter(sl => sl?.type === 'Seraphim').length < cond.value) return;
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

        for (const { slotIdx, instanceId, definitionId: defId } of toSacrifice) {
          const material = s.board.frontSlots[slotIdx];
          if (material?.type === 'Seraphim') {
            s.deck.discardPile.push({ instanceId, definitionId: defId });
          }
          (s.board.frontSlots as Array<(typeof s.board.frontSlots)[number]>)[slotIdx] = null;
        }
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
          level: 1,
          cardsPlayedSinceSummon: 0,
          activated: false,
          boardSlot: slot,
        };
        s.board.frontSlots[slot] = angelInst;
        s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);

        const result = CardEffectExecutor.execute(
          { instanceId: angelInst.instanceId, definitionId },
          s.turn,
          s.board,
          s.deck,
          false,
          { countAsPlay: false, removeFromHand: false, useNextCardMultiplier: false }
        );
        if (result.canPlay) {
          s.turn = result.turn;
          s.board = result.board;
          s.deck = result.deck;
          if (result.oblivionBonus > 0) {
            grantOblivion(s, result.oblivionBonus, s.turn.chainMultiplier);
          }
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
        if (!canActivateAngelAbility(angel, angelDef)) return;

        const result = CardEffectExecutor.execute(
          { instanceId: angel.instanceId, definitionId: angel.definitionId },
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

        s.turn = result.turn;
        s.board = result.board;
        s.deck = result.deck;

        for (const frontSlot of s.board.frontSlots) {
          if (frontSlot?.type === 'Angel' && frontSlot.instanceId === angel.instanceId) {
            frontSlot.activated = true;
            break;
          }
        }

        if (result.oblivionBonus > 0) {
          grantOblivion(s, result.oblivionBonus, s.turn.chainMultiplier);
        }
        if (result.pendingEffect) s.turn.pendingEffect = result.pendingEffect;

        checkBossDefeated(s);
        recompute(s);
      });
    },

    // ── Deck management ───────────────────────────────────────────────────────

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

    // ── Turn flow ─────────────────────────────────────────────────────────────

    beginTurn: () => {
      set(s => {
        if (s.turn.phase !== 'idle') return;
        if (s.deck.drawPile.length < 5 && s.deck.discardPile.length > 0) {
          s.deck.drawPile = DeckSystem.reshuffleDiscard(s.deck.drawPile, s.deck.discardPile);
          s.deck.discardPile = [];
        }
        const { drawn, remaining } = DeckSystem.draw(s.deck.drawPile, 5);
        s.deck.drawPile = remaining;
        for (const card of drawn) s.deck.hand.push(card);
        s.turn = { ...defaultTurn, phase: 'mulligan' };
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
        const wasBossFight = s.bossFight.mode === 'active';
        grantOblivion(s, handSnapshot.length * 50, s.turn.chainMultiplier);
        checkBossDefeated(s);
        if (wasBossFight && s.bossFight.mode !== 'active') return;
        s.turn.pendingEffect = { type: 'embrace_infinite', cards: handSnapshot, keep: 3 };
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
          const emptySlot = s.board.frontSlots.findIndex(sl => sl === null);
          if (emptySlot === -1) return;
          const slot = emptySlot as 0 | 1 | 2 | 3 | 4;
          const seraphimInst: SeraphimInstance = {
            instanceId: deckCard.instanceId,
            definitionId: deckCard.definitionId,
            type: 'Seraphim',
            element: def.element,
            rarity: def.rarity,
            level: 1,
            isActive: false,
            boardSlot: slot,
          };
          s.board.frontSlots[slot] = seraphimInst;
          s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);

          awardOblivionForCardPlay(s, 0, false);
          tickChaosDurability(s);

          const result = CardEffectExecutor.execute(deckCard, s.turn, s.board, s.deck, true);
          if (result.canPlay) {
            s.turn = result.turn;
            s.board = result.board;
            s.deck = result.deck;
            if (result.oblivionBonus > 0) {
              grantOblivion(s, result.oblivionBonus, s.turn.chainMultiplier);
            }
          }
          s.deck.hand = s.deck.hand.filter(c => c.instanceId !== deckCard.instanceId);
          incrementAngelProgress(s.board);
          s.progress.totalCardsPlayed += 1;
          checkBossDefeated(s);
          recompute(s);
          return;
        }

        if (def.type === 'Chaos') {
          const emptyBack = s.board.backSlots.findIndex(sl => sl === null);
          if (emptyBack === -1) return;
          const backSlotIndex = emptyBack as 0 | 1 | 2 | 3;
          const chaosDef = def as ChaosDefinition;
          const chaosInst: ChaosInstance = {
            instanceId: deckCard.instanceId,
            definitionId: deckCard.definitionId,
            type: 'Chaos',
            element: chaosDef.element,
            rarity: chaosDef.rarity,
            level: 1,
            durability: chaosDef.maxDurability + s.computedStats.chaosExtraPlays,
            maxDurability: chaosDef.maxDurability,
            backSlot: backSlotIndex,
          };
          s.board.backSlots[backSlotIndex] = chaosInst;
          s.deck.hand = s.deck.hand.filter(c => c.instanceId !== deckCard.instanceId);

          if (chaosDef.enthalpy?.length) {
            const { sacrificed } = fireChaosRitual(s, chaosDef.enthalpy, backSlotIndex);
            if (sacrificed) {
              s.deck.discardPile.push({ instanceId: deckCard.instanceId, definitionId: deckCard.definitionId });
              s.board.backSlots[backSlotIndex] = null;
            }
          }

          awardOblivionForCardPlay(s, 0, false);
          tickChaosDurability(s);
          s.turn.cardsPlayedThisTurn += 1;
          s.turn.chainMultiplier = Math.max(1.0 + s.turn.cardsPlayedThisTurn * 0.1, s.turn.chainFloor);
          incrementAngelProgress(s.board);
          s.progress.totalCardsPlayed += 1;
          checkBossDefeated(s);
          recompute(s);
          return;
        }

        // Seeker card — capture chain before executor increments it
        const prePlayChain = s.turn.chainMultiplier;
        const result = CardEffectExecutor.execute(deckCard, s.turn, s.board, s.deck);
        if (!result.canPlay) return;
        s.turn = result.turn;
        s.board = result.board;
        s.deck = result.deck;

        awardOblivionForCardPlay(s, result.oblivionBonus, true, prePlayChain);
        tickChaosDurability(s);

        if (result.pendingEffect) s.turn.pendingEffect = result.pendingEffect;
        incrementAngelProgress(s.board);
        s.progress.totalCardsPlayed += 1;
        eventBus.emit('card:played', { card: deckCard as never, board: s.board });
        checkBossDefeated(s);
        recompute(s);
      });
    },

    resolvePending: (selected) => {
      set(s => {
        const pending = s.turn.pendingEffect;
        if (!pending) return;

        if (pending.type === 'discard_choice') {
          s.deck = TurnSystem.discardFromHand(s.deck, selected);
          if (pending.sourceCard.includes(':draw:')) {
            s.deck = TurnSystem.drawCards(s.deck, parseInt(pending.sourceCard.split(':draw:')[1]));
          } else if (pending.sourceCard.includes(':draw_plus:')) {
            s.deck = TurnSystem.drawCards(s.deck, selected.length + parseInt(pending.sourceCard.split(':draw_plus:')[1]));
          }
        } else if (pending.type === 'look_top_take') {
          s.deck = TurnSystem.takeFromTop(s.deck, pending.cards.filter(c => selected.includes(c.instanceId)), pending.cards.filter(c => !selected.includes(c.instanceId)));
        } else if (pending.type === 'look_top_take_drop') {
          const [takeId, dropId] = selected;
          const toTake    = pending.cards.filter(c => c.instanceId === takeId);
          const toDrop    = pending.cards.filter(c => c.instanceId === dropId);
          const toDiscard = pending.cards.filter(c => c.instanceId !== takeId && c.instanceId !== dropId);
          s.deck.drawPile = s.deck.drawPile.slice(pending.cards.length);
          s.deck.hand.push(...toTake);
          s.deck.drawPile = [...s.deck.drawPile, ...toDrop];
          s.deck.discardPile.push(...toDiscard);
        } else if (pending.type === 'look_top_take_type') {
          s.deck = TurnSystem.takeFromTop(s.deck, pending.cards.filter(c => selected.includes(c.instanceId)), pending.cards.filter(c => !selected.includes(c.instanceId)));
        } else if (pending.type === 'search_deck') {
          s.deck.drawPile = s.deck.drawPile.filter(c => !selected.includes(c.instanceId));
          s.deck.hand.push(...pending.cards.filter(c => selected.includes(c.instanceId)));
          s.deck.drawPile = DeckSystem.shuffle(s.deck.drawPile);
        } else if (pending.type === 'salvage') {
          s.deck.discardPile = s.deck.discardPile.filter(c => !selected.includes(c.instanceId));
          s.deck.hand.push(...pending.cards.filter(c => selected.includes(c.instanceId)));
        } else if (pending.type === 'embrace_infinite') {
          const keptIds = new Set(selected.slice(0, pending.keep));
          const keptCards = pending.cards.filter(c => keptIds.has(c.instanceId));
          const reshuffledCards = pending.cards.filter(c => !keptIds.has(c.instanceId));
          s.deck.hand = keptCards;
          s.deck.drawPile = DeckSystem.shuffle([...s.deck.drawPile, ...reshuffledCards]);
        }

        s.turn.pendingEffect = null;
      });
    },

    endTurn: () => {
      set(s => {
        if (s.turn.phase !== 'playing') return;
        if (s.bossFight.mode === 'active') {
          completeBossFight(s, false);
          return;
        }
        // Seraphim → discard; Angels → cleared from board (extra deck, not discarded)
        for (let i = 0; i < s.board.frontSlots.length; i++) {
          const slot = s.board.frontSlots[i];
          if (slot?.type === 'Seraphim') {
            s.deck.discardPile.push({ instanceId: slot.instanceId, definitionId: slot.definitionId });
          }
          (s.board.frontSlots as Array<(typeof s.board.frontSlots)[number]>)[i] = null;
        }
        // All Chaos → discard at turn end
        for (let i = 0; i < s.board.backSlots.length; i++) {
          const chaos = s.board.backSlots[i];
          if (chaos) {
            s.deck.discardPile.push({ instanceId: chaos.instanceId, definitionId: chaos.definitionId });
            s.board.backSlots[i] = null;
          }
        }
        for (const card of s.deck.hand) s.deck.discardPile.push(card);
        s.deck.hand = [];
        if (s.deck.discardPile.length > 0) {
          s.deck.drawPile = DeckSystem.reshuffleDiscard(s.deck.drawPile, s.deck.discardPile);
          s.deck.discardPile = [];
        }
        s.board.frontSlots = SynergySystem.computeActiveSlots(s.board);
        s.board.activeBoardEffects = [];
        s.turn = { ...defaultTurn, phase: 'idle' };
        recompute(s);
      });
    },

    // ── Oblivion ──────────────────────────────────────────────────────────────

    addOblivion: (delta) => {
      set(s => { s.progress.oblivion += delta; });
    },

    // ── Pack / collection ─────────────────────────────────────────────────────

    openPack: (packId) => {
      const s = get();
      const pack = PACK_DEFINITIONS.find(p => p.id === packId);
      const isLocked = pack?.oblivionUnlock !== undefined
        ? s.progress.oblivion < pack.oblivionUnlock
        : pack?.locked;
      if (!pack || isLocked || s.progress.oblivion < pack.cost) return null;
      const preOpen = { ...s.progress.collection };
      const drawn = PackSystem.open(pack);
      set(state => {
        state.progress.oblivion -= pack.cost;
        for (const defId of drawn) {
          addCollectionCard(state.progress, defId);
        }
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
      const drawn: string[] = [];
      for (let i = 0; i < 5; i++) drawn.push(...PackSystem.open(pack));
      set(state => {
        state.progress.oblivion -= cost;
        for (const defId of drawn) {
          addCollectionCard(state.progress, defId);
        }
      });
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
      for (let i = 0; i < 10; i++) drawn.push(...PackSystem.open(pack));
      set(state => {
        state.progress.oblivion -= cost;
        for (const defId of drawn) {
          addCollectionCard(state.progress, defId);
        }
      });
      return drawn;
    },

    // ── Settings ──────────────────────────────────────────────────────────────

    updateSettings: (patch) => {
      set(s => { Object.assign(s.settings, patch); });
    },

    // ── Boss fight ────────────────────────────────────────────────────────────

    startBossFight: (bossId, savedDeckId) => {
      set(s => {
        if (s.bossFight.mode !== 'idle') return;
        const boss = BOSS_DEFINITIONS.find(b => b.id === bossId);
        if (!boss) return;
        const now = Date.now();
        const cooldown = s.bossFight.cooldowns[bossId];
        if (cooldown && cooldown > now) return;
        const savedDeck = s.progress.savedDecks.find(d => d.id === savedDeckId);
        if (!savedDeck) return;

        const savedState: SavedGameState = {
          deck: JSON.parse(JSON.stringify(s.deck)) as DeckState,
          board: JSON.parse(JSON.stringify(s.board)) as BoardState,
          turn: JSON.parse(JSON.stringify(s.turn)) as TurnState,
          progress: JSON.parse(JSON.stringify(s.progress)) as ProgressState,
          settings: { ...s.settings },
        };

        s.deck = createDeckState(savedDeck.deckList, savedDeck.extraDeck ?? []);
        s.board = { frontSlots: [null, null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] };
        s.turn = { ...defaultTurn, phase: 'idle' };
        s.bossFight = {
          mode: 'active',
          activeBossId: bossId,
          bossCurrentHp: boss.hp,
          bossMaxHp: boss.hp,
          damageDealtThisFight: 0,
          fightTimeRemaining: BOSS_FIGHT_ROUND_SECONDS,
          cooldowns: { ...s.bossFight.cooldowns },
          savedGameState: savedState,
        };
        recompute(s);
      });
    },

    tickBossTimer: (deltaSeconds) => {
      set(s => {
        if (s.bossFight.mode !== 'active') return;
        s.bossFight.fightTimeRemaining = Math.max(0, s.bossFight.fightTimeRemaining - deltaSeconds);
        if (s.bossFight.fightTimeRemaining <= 0) {
          completeBossFight(s, false);
        }
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

    // ── Save/load ─────────────────────────────────────────────────────────────

    loadState: (loaded) => {
      set(s => {
        // Migrate collection: string[] → Record<string, number>
        if (Array.isArray((loaded.progress as { collection: unknown }).collection)) {
          const rec: Record<string, number> = {};
          for (const id of (loaded.progress as unknown as { collection: string[] }).collection) rec[id] = 1;
          (loaded.progress as { collection: Record<string, number> }).collection = rec;
        }

        // Migrate progress: score → oblivion
        const op = loaded.progress as unknown as Record<string, unknown>;
        if (op['score'] !== undefined && op['oblivion'] === undefined) {
          op['oblivion'] = op['score'];
        }
        delete op['score'];
        delete op['totalTicksElapsed'];
        delete op['scoreBoostTicks'];
        delete op['scoreBoostMultiplier'];

        // Migrate board: old slots → frontSlots + backSlots
        const ob = loaded.board as unknown as Record<string, unknown>;
        if (ob['slots'] !== undefined && ob['frontSlots'] === undefined) {
          ob['frontSlots'] = (ob['slots'] as unknown[]).slice(0, 5);
          delete ob['slots'];
        }
        if (ob['frontSlots'] === undefined) ob['frontSlots'] = [null, null, null, null, null];
        if (ob['backSlots'] === undefined) ob['backSlots'] = [null, null, null, null];
        // Very old layout: angel + seraphimSlots
        if (ob['angel'] !== undefined || ob['seraphimSlots'] !== undefined) {
          ob['frontSlots'] = [ob['angel'] ?? null, ...((ob['seraphimSlots'] as unknown[] | undefined) ?? [null, null, null]), null].slice(0, 5);
          delete ob['angel'];
          delete ob['seraphimSlots'];
        }

        // Migrate turn: add new fields, strip removed ones
        const ot = loaded.turn as unknown as Record<string, unknown>;
        delete ot['sacredCovenantActive'];
        delete ot['undyingVigilActive'];
        if (ot['chainMultiplier'] === undefined) ot['chainMultiplier'] = 1.0;
        if (ot['chainFloor'] === undefined) ot['chainFloor'] = 1.0;
        if (ot['oblivionEarnedThisTurn'] === undefined) ot['oblivionEarnedThisTurn'] = 0;
        if (ot['embers'] === undefined) ot['embers'] = 0;

        // Migrate savedDecks
        for (const d of loaded.progress.savedDecks) {
          if ('angelId' in d) delete (d as Record<string, unknown>)['angelId'];
          if (!d.extraDeck) d.extraDeck = STARTER_EXTRA_DECK;
        }
        if (!loaded.deck.extraDeck) loaded.deck.extraDeck = STARTER_EXTRA_DECK;

        // Remove legacy root fields
        delete (loaded as unknown as Record<string, unknown>)['lastTickAt'];

        // v4 migration: reset deck if any main-deck card no longer exists in registry
        if ((loaded.version ?? 0) < 4) {
          const deckValid = loaded.deck.deckList.every(e => CardRegistry.get(e.definitionId) !== undefined);
          if (!deckValid) {
            loaded.deck.deckList = [...STARTER_DECK_LIST];
            loaded.deck.extraDeck = [...STARTER_EXTRA_DECK];
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
            }
          }
          loaded.version = 5;
        }

        // Migrate bossFight: add if missing from saved state
        if (!loaded.bossFight) {
          (loaded as unknown as Record<string, unknown>)['bossFight'] = { ...defaultBossFight };
        }

        Object.assign(s, loaded);
        recompute(s);
      });
    },

    resetToDefault: () => {
      set(() => ({ ...defaultGameState, startedAt: Date.now(), lastSavedAt: Date.now() }));
    },
  }))
);

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectComputedStats = (s: Store): ComputedBoardStats => s.computedStats;
export const selectOblivion = (s: Store): number => s.progress.oblivion;
export const selectBoard = (s: Store): BoardState => s.board;
export const selectDeck = (s: Store): DeckState => s.deck;
export const selectTurn = (s: Store): TurnState => s.turn;
export const selectSettings = (s: Store): SettingsState => s.settings;
export const selectHand = (s: Store): DeckCard[] => s.deck.hand;
export const selectRadiance = (s: Store): number => s.turn.radiance;
export const selectPhase = (s: Store): TurnState['phase'] => s.turn.phase;
export const selectExtraDeck = (s: Store): string[] => s.deck.extraDeck;
export const selectBossFight = (s: Store): BossFightState => s.bossFight;
export const selectProgress = (s: Store): ProgressState => s.progress;
export const selectCanEmbraceInfinite = (s: Store): boolean => canEmbraceInfinite(s);
