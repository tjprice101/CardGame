import type { BoardState, DeckState, PendingEffect, TurnState } from '@/types/game';
import type { CardEffect } from '@/types/effects';
import type { AngelDefinition, AngelInstance, CardDefinition, CherubimDefinition, OphanimDefinition, SeraphimDefinition, SeraphimInstance } from '@/types/cards';
import { CardRegistry } from '../../cards/CardRegistry';

/** +10% buff applied to all non-Neutrality set mechanic core oblivion bursts. */
const MECHANIC_OBLIVION_BUFF = 1.10;
import { getCardCategoryKey } from '@/data/elements';
import { getActiveCoopRng } from '@/state/coopSyncStore';
import { TurnSystem } from './TurnSystem';
import {
  clampPatienceStacks,
  clampPatientLightStacks,
  hasNeutralityUncappedGainsInDeck,
} from '@/systems/cards/neutralityPatientLight';

function countBoardDefinitionIds(board: BoardState): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const slot of board.frontSlots) {
    if (!slot) continue;
    counts[slot.definitionId] = (counts[slot.definitionId] ?? 0) + 1;
  }
  for (const slot of board.backSlots) {
    if (!slot) continue;
    counts[slot.definitionId] = (counts[slot.definitionId] ?? 0) + 1;
  }
  return counts;
}

export interface ExecutionResult {
  deck: DeckState;
  turn: TurnState;
  board: BoardState;
  oblivionBonus: number;    // direct Oblivion bonus from card effects (beyond chain calc)
  pendingEffect: PendingEffect | null;
  canPlay: boolean;         // false if radiance_spend failed
}

interface ExecuteOptions {
  effects?: CardEffect[];
  countAsPlay?: boolean;
  removeFromHand?: boolean;
  /** When true, nested forge_recast_* / nacre / ouroboric / unrecorded hue auto-recasts are skipped. */
  suppressForgeRecursion?: boolean;
  /** When true, nested copy_last_hr replay effects are skipped to prevent self-referential loops. */
  suppressOphanimReplay?: boolean;
  /** When true, do not append this play to the recast ledger. */
  skipLedger?: boolean;
}

interface CherubimRecastPassiveBonus {
  oblivionBonus: number;
  pearlBonus: number;
  seraphimRecastAmp: number;
}

function isActiveSeraphim(unit: BoardState['frontSlots'][number]): unit is SeraphimInstance {
  return unit?.type === 'Seraphim' && unit.isActive;
}

function isActivePatienceUnit(unit: BoardState['frontSlots'][number]): unit is SeraphimInstance | AngelInstance {
  return !!unit && (unit.type === 'Angel' || (unit.type === 'Seraphim' && unit.isActive));
}

function collectCherubimRecastPassiveBonus(board: BoardState): CherubimRecastPassiveBonus {
  let oblivionBonus = 0;
  let pearlBonus = 0;
  let seraphimRecastAmp = 0;

  for (const slot of board.backSlots) {
    if (!slot || slot.type !== 'Cherubim') continue;
    const def = CardRegistry.get(slot.definitionId);
    if (!def || def.type !== 'Cherubim') continue;

    for (const effect of def.effects) {
      switch (effect.type) {
        case 'cherubim_recast_oblivion_bonus':
          oblivionBonus += effect.value;
          break;
        case 'cherubim_pearl_per_recast_bonus':
          pearlBonus += effect.value;
          break;
        case 'cherubim_seraphim_recast_amp':
          seraphimRecastAmp += effect.value;
          break;
      }
    }
  }

  return { oblivionBonus, pearlBonus, seraphimRecastAmp };
}

function computeNeutralityInfiniteOblivionBonus(definitionId: string, turn: TurnState, board: BoardState): number | null {
  const signatures = Math.min(5, turn.neutralityEngineSignatures?.length ?? 0);
  const stability = Math.max(0, turn.equilibriumStability ?? 0);
  const brokenClasses = Math.min(5, turn.attenuationBrokenClasses?.length ?? 0);
  const sourceCount = Math.min(4, turn.crossSetConversionDistinctSources?.length ?? 0);
  const setupCount = Math.min(8, turn.neutralitySetupCount ?? 0);
  const drift = Math.abs(turn.equilibriumDrift ?? 0);
  const lowDriftBonus = drift <= 8 ? 550 : 0;
  const patienceSlots = board.frontSlots.filter(unit => {
    if (!unit) return false;
    if (unit.type === 'Seraphim') return unit.isActive;
    return unit.type === 'Angel';
  });
  const totalPatience = patienceSlots.reduce((sum, unit) => sum + (unit?.patienceStacks ?? 0), 0);
  const patienceUnits = patienceSlots.filter(unit => (unit?.patienceStacks ?? 0) > 0).length;
  const peakPatience = patienceSlots.reduce((max, unit) => Math.max(max, unit?.patienceStacks ?? 0), 0);
  const widePatienceBonus = totalPatience >= 18 ? 700 : totalPatience >= 12 ? 350 : 0;

  switch (definitionId) {
    case 'inf-genesis-throne':
      return 800 + totalPatience * 80 + peakPatience * 160 + signatures * 140 + setupCount * 90;
    case 'inf-null-apex':
      return 620 + peakPatience * 300 + brokenClasses * 420 + patienceUnits * 140 + lowDriftBonus;
    case 'inf-entropic-crown':
      return 850 + patienceUnits * 500 + totalPatience * 65 + brokenClasses * 450;
    case 'inf-annihilation-field':
      return 950 + sourceCount * 620 + peakPatience * 260 + widePatienceBonus;
    case 'inf-oblivion-absolute':
      return 1000 + totalPatience * 120 + peakPatience * 240;
    case 'inf-void-cascade':
      return 800 + patienceUnits * 600 + sourceCount * 550 + peakPatience * 180 + widePatienceBonus;
    case 'inf-sovereign-void':
      return 1200 + totalPatience * 90 + peakPatience * 220 + brokenClasses * 420 + stability * 120;
    case 'inf-eternity-rupture':
      return 1100 + patienceUnits * 420 + sourceCount * 650 + peakPatience * 250 + widePatienceBonus;
    default:
      return null;
  }
}

function computeNeutralityEternalOblivionBonus(definitionId: string, turn: TurnState, board: BoardState): number | null {
  const signatures = Math.min(4, turn.neutralityEngineSignatures?.length ?? 0);
  const stability = Math.max(0, turn.equilibriumStability ?? 0);
  const sourceCount = Math.min(3, turn.crossSetConversionDistinctSources?.length ?? 0);
  const setupCount = Math.min(6, turn.neutralitySetupCount ?? 0);
  const patienceSlots = board.frontSlots.filter(unit => {
    if (!unit) return false;
    if (unit.type === 'Seraphim') return unit.isActive;
    return unit.type === 'Angel';
  });
  const totalPatience = patienceSlots.reduce((sum, unit) => sum + (unit?.patienceStacks ?? 0), 0);
  const patienceUnits = patienceSlots.filter(unit => (unit?.patienceStacks ?? 0) > 0).length;
  const peakPatience = patienceSlots.reduce((max, unit) => Math.max(max, unit?.patienceStacks ?? 0), 0);
  const firstCardBonus = turn.cardsPlayedThisTurn === 0 ? 420 : 0;

  switch (definitionId) {
    case 'btei-voids-reaping':
      return 220 + totalPatience * 26 + setupCount * 34;
    case 'btei-temporal-ruin':
      return 280 + peakPatience * 40 + signatures * 32;
    case 'btei-null-edict':
      return 320 + totalPatience * 30 + stability * 36;
    case 'btei-axiom-of-oblivion':
      return 360 + peakPatience * 48 + setupCount * 32 + sourceCount * 36;
    case 'btei-eternal-vigil':
      return 240 + peakPatience * 34 + patienceUnits * 28;
    case 'btei-colossus-advent':
      return 340 + totalPatience * 28 + peakPatience * 30 + signatures * 30;
    case 'btei-sovereign-domain':
      return 290 + patienceUnits * 52 + setupCount * 30;
    case 'btei-architects-manifold':
      return 310 + patienceUnits * 56 + sourceCount * 42;
    case 'btei-convergence-of-eternity':
      return 380 + totalPatience * 34 + signatures * 42;
    case 'btei-omniscient-fracture':
      return 420 + peakPatience * 52 + stability * 34 + signatures * 34;
    case 'btei-neutrality-paradox-crown':
      return 360 + setupCount * 56 + signatures * 44 + sourceCount * 42 + patienceUnits * 28;
    case 'btei-neutrality-zero-edict':
      return 260 + patienceUnits * 48 + setupCount * 26;
    case 'btei-neutrality-void-throne':
      return 350 + peakPatience * 44 + setupCount * 30 + stability * 26;
    case 'btei-neutrality-axiom-maw':
      return 430 + peakPatience * 58 + stability * 34 + signatures * 32 + sourceCount * 28;
    case 'btei-neutrality-prime-equilibrium':
      return 320 + firstCardBonus + stability * 38 + totalPatience * 24 + setupCount * 34;
    default:
      return null;
  }
}

function computePyroInfiniteOblivionBonus(definitionId: string, turn: TurnState, heatDrained = 0): number | null {
  const tiers = Math.max(0, turn.eternalStacks?.pyro ?? 0);
  const echoes = Math.max(0, turn.secondaryCounters?.pyro ?? 0);
  const balancedBonus = Math.abs(tiers - echoes) <= 2 ? 540 : 0;

  switch (definitionId) {
    case 'inf-ash-kings-apocalypse':
      return 1100 + tiers * 640 + echoes * 260 + balancedBonus;
    case 'inf-pyraxis-colossus':
      return 980 + tiers * 560 + echoes * 280 + balancedBonus;
    case 'inf-pyroclasm-engine':
      return 1050 + tiers * 440 + echoes * 340 + balancedBonus;
    case 'inf-riftborn-sovereign':
      return 1300 + heatDrained * 20 + tiers * 700 + echoes * 240 + balancedBonus;
    default:
      return null;
  }
}

function computeLightInfiniteOblivionBonus(definitionId: string, turn: TurnState, board: BoardState): number | null {
  const radiance = Math.max(0, turn.radiance ?? 0);
  const halo = Math.max(0, turn.eternalStacks?.light ?? 0);
  const activeSeraphim = board.frontSlots.filter(unit => unit?.type === 'Seraphim' && unit.isActive).length;

  switch (definitionId) {
    case 'inf-celestial-blackout':
      return 1450 + radiance * 21 + halo * 240 + activeSeraphim * 260;
    case 'inf-lucent-cataclysm-archon':
      return 1300 + radiance * 18 + halo * 215 + activeSeraphim * 235;
    case 'inf-heliarch-eclipse-engine':
      return 1380 + radiance * 19 + halo * 255 + activeSeraphim * 220;
    default:
      return null;
  }
}

function computeThornboundInfiniteOblivionBonus(definitionId: string, turn: TurnState): number | null {
  const scar = Math.min(40, Math.max(0, turn.thornScar ?? 0));
  const trail = Math.min(120, Math.max(0, turn.trail ?? 0));
  const briar = Math.min(20, Math.max(0, turn.secondaryCounters?.thorn ?? 0));

  switch (definitionId) {
    case 'inf-thornbound-last-procession':
      return 1500 + scar * 170 + trail * 30 + briar * 300;
    case 'inf-thorn-widow-engine':
      return 1350 + scar * 145 + trail * 28 + briar * 310;
    case 'inf-gravebloom-singularity':
      return 1550 + scar * 140 + trail * 30 + briar * 340;
    case 'inf-thornbound-elegy-titan': {
      const marchReadyBonus = trail >= 40 && scar >= 10 ? 1100 : 0;
      return 1850 + scar * 195 + trail * 34 + briar * 390 + marchReadyBonus;
    }
    default:
      return null;
  }
}

function computeMechanicalInfiniteOblivionBonus(definitionId: string, turn: TurnState): number | null {
  const strain = Math.max(0, turn.strain ?? 0);
  const reactorCores = Math.max(0, turn.eternalStacks?.mech ?? 0);
  const strainBandBonus = strain >= 18 ? 1400 : strain >= 12 ? 900 : strain >= 8 ? 500 : 0;

  switch (definitionId) {
    case 'inf-machina-eternal-loop':
      return 1700 + reactorCores * 360 + Math.min(1800, strain * 95) + strainBandBonus;
    case 'inf-brass-eidolon-prime':
      return 1500 + reactorCores * 320 + Math.min(1500, strain * 80) + Math.floor(strainBandBonus * 0.8);
    case 'inf-mech-entropy-foundry':
      return 1600 + reactorCores * 340 + Math.min(1600, strain * 85) + Math.floor(strainBandBonus * 0.9);
    case 'inf-mechanical-apotheosis-core':
      return 2100 + reactorCores * 400 + Math.min(2000, strain * 105) + Math.floor(strainBandBonus * 1.1);
    default:
      return null;
  }
}

function cloneBoard(board: BoardState): BoardState {
  return {
    ...board,
    activeBoardEffects: [...board.activeBoardEffects],
    frontSlots: board.frontSlots.map(s => s ? { ...s } : null) as BoardState['frontSlots'],
    backSlots: board.backSlots.map(s => s ? { ...s } : null) as BoardState['backSlots'],
    emberGrove: [...(board.emberGrove ?? [])],
  };
}

function ensureEternalSeasState(turn: TurnState): void {
  if (turn.eternalSeasUndertow === undefined) turn.eternalSeasUndertow = 0;
  if (turn.eternalSeasFoam === undefined) turn.eternalSeasFoam = 0;
}

// ─── Abyssal Forge: per-turn state shim + recast runner ─────────────────────
function ensureForgeTurn(turn: TurnState): void {
  if (turn.recastLedger === undefined) turn.recastLedger = [];
  if (turn.reforgeCharges === undefined) turn.reforgeCharges = 0;
  if (turn.reforgeChargeCap === undefined) turn.reforgeChargeCap = 6;
  if (turn.pearls === undefined) turn.pearls = 0;
  if (turn.unrecordedHueActive === undefined) turn.unrecordedHueActive = false;
  if (turn.forgeRecastEventsThisTurn === undefined) turn.forgeRecastEventsThisTurn = 0;
  if (turn.forgePendingCherubimTemper === undefined) turn.forgePendingCherubimTemper = 0;
}

interface RecastRunResult {
  turn: TurnState;
  board: BoardState;
  deck: DeckState;
  oblivionBonus: number;
}

/**
 * Re-fire a ledger entry's defining effects at fractional power. Power is
 * applied to the resulting oblivion bonus and to chain gains carried by the
 * sub-execution. The recast does NOT count as a card play and is not appended
 * to the ledger. Imprint stacks are incremented on the entry; Nacre-coated
 * entries ignore imprint amplification.
 */
function runRecast(
  entry: import('@/types/game').RecastLedgerEntry,
  power: number,
  turn: TurnState,
  board: BoardState,
  deck: DeckState
): RecastRunResult {
  const def = CardRegistry.get(entry.definitionId);
  if (!def) return { turn, board, deck, oblivionBonus: 0 };

  const imprintAmp = entry.isNacreCoated ? 1.0 : 1.0 + 0.25 * entry.imprintStacks;
  const recastPassives = collectCherubimRecastPassiveBonus(board);
  const finalPower = power * imprintAmp * (def.type === 'Seraphim' ? 1 + recastPassives.seraphimRecastAmp : 1);

  // Snapshot pre-execute (chain removed).

  const result = CardEffectExecutor.execute(
    { instanceId: entry.instanceId, definitionId: entry.definitionId },
    turn,
    board,
    deck,
    def.type === 'Seraphim',
    {
      countAsPlay: false,
      removeFromHand: false,
      suppressForgeRecursion: true,
      skipLedger: true,
    }
  );

  // Scale the oblivion burst portion by finalPower.
  const scaledOblivion = result.oblivionBonus * finalPower + recastPassives.oblivionBonus;

  // Record the recast event.
  entry.recastCount += 1;
  entry.imprintStacks += 1;
  result.turn.forgeRecastEventsThisTurn = (result.turn.forgeRecastEventsThisTurn ?? 0) + 1;

  // Drop pearls per recast: 1 base, +2 if Eternal, +3 if Infinite.
  let pearlDrop = 1;
  if (def.rarity === 'Eternal') pearlDrop = 2;
  else if (def.rarity === 'Infinite') pearlDrop = 3;
  result.turn.pearls = (result.turn.pearls ?? 0) + pearlDrop + recastPassives.pearlBonus;

  return {
    turn: result.turn,
    board: result.board,
    deck: result.deck,
    oblivionBonus: scaledOblivion,
  };
}

function applyForgeImprintGain(
  turn: TurnState,
  effect: { value: number; targetMode: 'last' | 'lastN' | 'all_played'; count?: number }
): number {
  ensureForgeTurn(turn);
  const ledger = turn.recastLedger ?? [];
  const gain = Math.max(0, Math.floor(effect.value));
  if (gain <= 0 || ledger.length === 0) return 0;

  let targets = ledger;
  if (effect.targetMode === 'last') {
    targets = ledger.slice(-1);
  } else if (effect.targetMode === 'lastN') {
    targets = ledger.slice(-Math.max(1, effect.count ?? 1));
  }

  for (const entry of targets) {
    entry.imprintStacks = (entry.imprintStacks ?? 0) + gain;
  }

  return targets.length * gain;
}

function spendForgeImprint(turn: TurnState, requestedSpend: number): number {
  ensureForgeTurn(turn);
  const ledger = turn.recastLedger ?? [];
  let remaining = Math.max(0, Math.floor(requestedSpend));
  if (remaining <= 0 || ledger.length === 0) return 0;

  let spent = 0;
  for (let i = ledger.length - 1; i >= 0 && remaining > 0; i--) {
    const entry = ledger[i];
    const available = Math.max(0, entry.imprintStacks ?? 0);
    if (available <= 0) continue;
    const consume = Math.min(available, remaining);
    entry.imprintStacks = available - consume;
    remaining -= consume;
    spent += consume;
  }

  return spent;
}

export class CardEffectExecutor {
  static execute(
    deckCard: { instanceId: string; definitionId: string; finish?: import('@/types/cards').CardFinish },
    turn: TurnState,
    board: BoardState,
    deck: DeckState,
    isSeraphim = false,
    options: ExecuteOptions = {}
  ): ExecutionResult {
    const def = CardRegistry.get(deckCard.definitionId);
    if (!def) {
      return { deck, turn, board, oblivionBonus: 0, pendingEffect: null, canPlay: true };
    }

    const effects: CardEffect[] = options.effects ?? (
      def.type === 'Seraphim'  ? (def as SeraphimDefinition).onPlayEffects
      : def.type === 'Angel'   ? (def as AngelDefinition).onSummonEffects
      : def.type === 'Cherubim' ? (def as CherubimDefinition).onPlayEffects
      : (def as OphanimDefinition).effects
    );
    const countAsPlay = options.countAsPlay ?? true;
    const removeFromHand = options.removeFromHand ?? (deckCard.instanceId !== 'echo' && !isSeraphim);
    const suppressForgeRecursion = options.suppressForgeRecursion ?? false;
    const suppressOphanimReplay = options.suppressOphanimReplay ?? false;
    const skipLedger = options.skipLedger ?? false;
    const sourceSetKey = getCardCategoryKey(def);

    let mutableDeck = { ...deck, hand: [...deck.hand] };
    let mutableTurn = { ...turn };
    let mutableBoard = cloneBoard(board);
    let oblivionBonus = 0;
    let pendingEffect: PendingEffect | null = null;
    let heatDrained = 0; // tracks Heat before pyro_heat_spend:9999 for dynamic sentinels
    let radianceDrained = 0; // tracks radiance before radiance_spend:9999 for dynamic sentinels

    const multiplier = 1;

    const activeSynergies = board.frontSlots.filter(
      s => s?.type === 'Seraphim' && s.isActive
    ).length;

    const throneActive = board.frontSlots.some(
      s => s?.type === 'Seraphim' && s.isActive && s.definitionId === 'ser-light-throne'
    );

    const isHighRarityMechanicCard = (cardDef: CardDefinition | undefined): boolean => Boolean(cardDef && (
      cardDef.rarity === 'Eternal'
      || cardDef.rarity === 'Infinite'
      || cardDef.definitionId.startsWith('tx-')
    ));

    const isSnowboundVoltageDefinition = (cardDef: CardDefinition | undefined): boolean => Boolean(
      cardDef && (cardDef.definitionId.startsWith('sv-') || cardDef.definitionId.startsWith('inf-sv-')),
    );

    const isMechanicalDreamsDefinition = (cardDef: CardDefinition | undefined): boolean => Boolean(
      cardDef && cardDef.element === 'Mechanical' && !isSnowboundVoltageDefinition(cardDef),
    );

    const isButterflyDefinition = (cardDef: CardDefinition | undefined): boolean => Boolean(
      cardDef && (cardDef.definitionId.startsWith('bf-') || cardDef.definitionId.startsWith('inf-bf-')),
    );

    const isEternalSeasDefinition = (cardDef: CardDefinition | undefined): boolean => Boolean(
      cardDef && (cardDef.definitionId.startsWith('es-') || cardDef.definitionId.startsWith('inf-es-')),
    );

    const cardMatchesAdvancedSetKey = (cardDef: CardDefinition | undefined, key: string): boolean => {
      if (!cardDef) return false;

      switch (key) {
        case 'absol':
          return cardDef.element === 'GlassAbsolute';
        case 'deepwake':
        case 'tide':
          return isEternalSeasDefinition(cardDef);
        case 'flutter':
          return isButterflyDefinition(cardDef);
        case 'garden':
          return cardDef.element === 'BlazingGarden';
        case 'forge':
          return cardDef.element === 'AbyssalForge';
        case 'glass':
          return cardDef.element === 'Dark';
        case 'light':
          return cardDef.element === 'Light';
        case 'mech':
          return isMechanicalDreamsDefinition(cardDef);
        case 'prism':
          return cardDef.element === 'Prismatic';
        case 'pyre':
          return cardDef.element === 'DeathFlamedHell';
        case 'pyro':
          return cardDef.element === 'Fire';
        case 'snow':
          return isSnowboundVoltageDefinition(cardDef);
        case 'thorn':
          return cardDef.element === 'Thornbound';
        case 'wuas':
          return cardDef.element === 'WishedUponAStar';
        default:
          return false;
      }
    };

    const boardHasAdvancedSetEnabler = (key: string): boolean => {
      for (const slot of mutableBoard.frontSlots) {
        if (!slot) continue;
        const slotDef = CardRegistry.get(slot.definitionId);
        if (cardMatchesAdvancedSetKey(slotDef, key) && isHighRarityMechanicCard(slotDef)) {
          return true;
        }
      }

      for (const slot of mutableBoard.backSlots) {
        if (!slot) continue;
        const slotDef = CardRegistry.get(slot.definitionId);
        if (cardMatchesAdvancedSetKey(slotDef, key) && isHighRarityMechanicCard(slotDef)) {
          return true;
        }
      }

      return false;
    };

    const sourceHasAdvancedSetAccess = (key: string): boolean => {
      return (cardMatchesAdvancedSetKey(def, key) && isHighRarityMechanicCard(def))
        || boardHasAdvancedSetEnabler(key);
    };

    const getAdvancedSetKeyForEffect = (effect: CardEffect): string | null => {
      switch (effect.type) {
        case 'black_glass_white_flame_gain':
        case 'black_glass_black_flame_gain':
        case 'black_glass_fracture_gain':
        case 'black_glass_fracture_collapse':
        case 'black_glass_eclipse_burst':
          return 'glass';
        case 'eternal_stack_gain':
        case 'eternal_stack_spend':
        case 'eternal_stack_cashout':
          return effect.stack;
        case 'garden_wild_pollen_seed':
          return 'garden';

        case 'set_secondary_gain':
        case 'set_secondary_spend':
          return effect.kind;
        case 'light_transcendent_duality_choice':
          return 'light';
        case 'seas_deepwake_surge':
          return 'deepwake';
        case 'snow_polar_capacitor_release':
          return 'snow';
        case 'thorn_briar_spiral_bloom':
          return 'thorn';
        case 'flutter_resonance_apex':
        case 'flutter_resonance_harmonize':
          return 'flutter';
        default:
          return null;
      }
    };

    const applyEternalSeasReleaseReactions = (): void => {
      if (mutableTurn.eternalSeasReleaseReactionUsedThisTurn) return;

      let usedOncePerTurn = false;
      for (const back of mutableBoard.backSlots) {
        if (!back || back.type !== 'Cherubim') continue;
        const def = CardRegistry.get(back.definitionId);
        if (!def || def.type !== 'Cherubim') continue;

        for (const effect of def.effects) {
          if (effect.type !== 'cherubim_seas_release_reaction') continue;
          if (effect.condition && !CardEffectExecutor.evaluateCondition(effect.condition, mutableTurn, mutableBoard)) continue;

          if ((effect.oblivionGain ?? 0) > 0) {
            oblivionBonus += Math.round((effect.oblivionGain ?? 0) * MECHANIC_OBLIVION_BUFF);
          }
          if ((effect.undertowGain ?? 0) > 0) {
            mutableTurn.eternalSeasUndertow = Math.max(0, (mutableTurn.eternalSeasUndertow ?? 0) + Math.round(effect.undertowGain ?? 0));
          }
          if ((effect.foamGain ?? 0) > 0) {
            mutableTurn.eternalSeasFoam = Math.max(0, (mutableTurn.eternalSeasFoam ?? 0) + Math.round(effect.foamGain ?? 0));
          }
          if ((effect.draw ?? 0) > 0) {
            for (let i = 0; i < Math.round(effect.draw ?? 0); i++) {
              const ok = processEffect({ type: 'draw', value: 1 });
              if (!ok) return;
            }
          }
          if (effect.oncePerTurn) usedOncePerTurn = true;
        }
      }

      if (usedOncePerTurn) {
        mutableTurn.eternalSeasReleaseReactionUsedThisTurn = true;
      }
    };

    function applyRadianceGain(base: number): void {
      const adjusted = throneActive ? Math.ceil(base * 1.5) : base;
      mutableTurn.radiance += adjusted;
    }

    function getNeutralityEquilibriumSigilCap(): number {
      let capBonus = Math.max(0, mutableTurn.neutralityEquilibriumSigilCapBonus ?? 0);
      const starboundPresent = mutableBoard.frontSlots.some(sl => sl?.type === 'Angel' && sl.definitionId === 'tx-angel-starbound-null-archangel');
      if (starboundPresent) capBonus = Math.max(capBonus, 4);
      return Math.max(0, 12 + capBonus);
    }

    function getNeutralityEquilibriumPatienceGainBonus(): number {
      const sentinelPresent = mutableBoard.backSlots.some(sl => sl?.type === 'Cherubim' && sl.definitionId === 'tx-cher-null-sentinel');
      if (!sentinelPresent) return 0;
      const base = Math.floor(Math.max(0, mutableTurn.neutralityEquilibriumSigils ?? 0) / 2);
      return base > 0 ? base * 2 : 0;
    }

    function grantNeutralityEquilibriumSigils(value: number, sourceTag?: string): number {
      const gain = Math.max(0, Math.floor(value));
      if (gain <= 0) return 0;

      const before = Math.max(0, mutableTurn.neutralityEquilibriumSigils ?? 0);
      const next = Math.min(getNeutralityEquilibriumSigilCap(), before + gain);
      const gained = Math.max(0, next - before);
      if (gained <= 0) return 0;

      mutableTurn.neutralityEquilibriumSigils = next;
      const gainedThisTurn = Math.max(0, mutableTurn.neutralityEquilibriumSigilsGainedThisTurn ?? 0) + gained;
      mutableTurn.neutralityEquilibriumSigilsGainedThisTurn = gainedThisTurn;

      const patientLightAlready = Math.max(0, mutableTurn.neutralityEquilibriumPatientLightFromSigilsThisTurn ?? 0);
      const patientLightEligible = Math.min(2, Math.floor(gainedThisTurn / 4));
      const patientLightToGrant = Math.max(0, patientLightEligible - patientLightAlready);
      if (patientLightToGrant > 0) {
        mutableTurn.neutralityPatientLightStacks = Math.max(0, mutableTurn.neutralityPatientLightStacks ?? 0) + patientLightToGrant;
        mutableTurn.neutralityEquilibriumPatientLightFromSigilsThisTurn = patientLightAlready + patientLightToGrant;
      }

      if (sourceTag) {
        mutableTurn.neutralityTriggeredEffects = [
          ...(mutableTurn.neutralityTriggeredEffects ?? []),
          `${sourceTag}: +${gained} Equilibrium Sigils`,
        ].slice(-8);
      }

      return gained;
    }

    function spendNeutralityEquilibriumSigils(requested: number): number {
      const spend = Math.max(0, Math.floor(requested));
      if (spend <= 0) return 0;
      const before = Math.max(0, mutableTurn.neutralityEquilibriumSigils ?? 0);
      const spent = Math.min(before, spend);
      mutableTurn.neutralityEquilibriumSigils = before - spent;
      return spent;
    }

    function processEffect(effect: CardEffect): boolean {
      const isBurningGardenCardId = (definitionId: string): boolean => {
        const cardDef = CardRegistry.get(definitionId);
        return cardDef?.element === 'BlazingGarden';
      };

      const countBurnPhaseUnits = (): number => {
        let count = 0;
        for (const slot of mutableBoard.frontSlots) {
          if (!slot) continue;
          if (!isBurningGardenCardId(slot.definitionId)) continue;
          if (slot.burningGardenPhase === 'Burn') count += 1;
        }
        for (const slot of mutableBoard.backSlots) {
          if (!slot) continue;
          if (!isBurningGardenCardId(slot.definitionId)) continue;
          if (slot.burningGardenPhase === 'Burn') count += 1;
        }
        return count;
      };

      const distinctLineages = (): number => new Set(mutableTurn.burningGardenLineagesPlayed ?? []).size;
      const advancedSetKey = getAdvancedSetKeyForEffect(effect);

      if (advancedSetKey && !sourceHasAdvancedSetAccess(advancedSetKey)) {
        return true;
      }

      // --- Blazing Garden Eternal/Infinity custom effect types ---
      switch (effect.type) {
        case 'set_garden_law':
          if (mutableTurn.burningGardenLaw === null || mutableTurn.burningGardenLaw === undefined) {
            mutableTurn.burningGardenLaw = effect.law;
          }
          break;
        case 'echo_effect_double':
          mutableTurn.burningGardenNextFinalChordScaleBonus =
            (mutableTurn.burningGardenNextFinalChordScaleBonus ?? 0) + Math.max(1, effect.duration);
          break;
        case 'sigil_on_burn_play':
          mutableTurn.burningGardenSunSigils = (mutableTurn.burningGardenSunSigils ?? 0) + effect.value;
          break;
        case 'replay_last_burn_card': {
          const lastId = mutableTurn.lastPlayedDefinitionId;
          if (lastId && isBurningGardenCardId(lastId)) {
            const replayResult = CardEffectExecutor.execute(
              { instanceId: 'echo', definitionId: lastId, finish: 'normal' },
              mutableTurn,
              mutableBoard,
              mutableDeck,
              false,
              { countAsPlay: false, removeFromHand: false },
            );
            if (replayResult.canPlay) {
              mutableDeck = replayResult.deck;
              mutableTurn = replayResult.turn;
              mutableBoard = replayResult.board;
              oblivionBonus += replayResult.oblivionBonus;
              if (replayResult.pendingEffect !== null && pendingEffect === null) {
                pendingEffect = replayResult.pendingEffect;
              }
            }
          }
          break;
        }
        case 'ignite_units_burn': {
          let remaining = effect.count;
          for (const slot of mutableBoard.frontSlots) {
            if (!slot || remaining <= 0) continue;
            if (!isBurningGardenCardId(slot.definitionId) || slot.burningGardenPhase === 'Burn') continue;
            slot.burningGardenPhase = 'Burn';
            remaining -= 1;
          }
          for (const slot of mutableBoard.backSlots) {
            if (!slot || remaining <= 0) continue;
            if (!isBurningGardenCardId(slot.definitionId) || slot.burningGardenPhase === 'Burn') continue;
            slot.burningGardenPhase = 'Burn';
            remaining -= 1;
          }
          break;
        }
        case 'snapshot_burn_lineages':
          mutableTurn.burningGardenIncandescentSnapshot = [...new Set(mutableTurn.burningGardenLineagesPlayed ?? [])].slice(-3);
          break;
        case 'incandescent_chorus_on_new_lineage':
          if (distinctLineages() > (mutableTurn.burningGardenIncandescentSnapshot?.length ?? 0)) {
            processEffect(effect.effect);
          }
          break;
        case 'burn_lineage_echo_and_cooldown':
          mutableTurn.burningGardenArrayFreeEchoes = (mutableTurn.burningGardenArrayFreeEchoes ?? 0) + effect.echo;
          // chain cooldown bonus removed
          break;
        case 'final_chord_bloom_if_all_lineages':
          if (distinctLineages() >= 3) processEffect(effect.effect);
          break;
        case 'bloom_all_lineages': {
          const lineageCount = Math.max(1, distinctLineages());
          const lawBonus = 1 + Math.max(0, mutableTurn.burningGardenNextFinalChordScaleBonus ?? 0) * 0.35;
          oblivionBonus += Math.round(220 * MECHANIC_OBLIVION_BUFF * effect.multiplier * lineageCount * lawBonus);
          break;
        }
        case 'seed_grove_with_worldflower': {
          const emberGrove = mutableBoard.emberGrove ?? (mutableBoard.emberGrove = []);
          const seeds = Math.min(6, countBurnPhaseUnits() * Math.max(1, effect.per_burn));
          for (let i = 0; i < seeds; i++) {
            const sourceId = `${deckCard.definitionId}:worldflower:${mutableTurn.turnNumber ?? 0}:${i}:${emberGrove.length}`;
            emberGrove.push({
              definitionId: deckCard.definitionId,
              finish: deckCard.finish ?? 'normal',
              sourceId,
              chromaticSources: [sourceId],
              charredAtTurn: mutableTurn.turnNumber ?? 0,
              lineage: (mutableTurn.burningGardenLaw ?? 'Rose'),
              memoryPower: 1,
            });
          }
          break;
        }
        case 'worldflower_echo_on_char':
          mutableTurn.burningGardenWorldflowerGrowth = (mutableTurn.burningGardenWorldflowerGrowth ?? 0) + effect.duration;
          break;
        case 'worldflower_bonus_on_three':
          if ((mutableTurn.burningGardenWorldflowerGrowth ?? 0) >= 3) {
            mutableTurn.burningGardenGeometryMode = true;
            // chain bonus removed
          }
          break;
        case 'choose_burn_cards':
          processEffect(effect.effect);
          break;
        case 'char_revive_echo_double':
          mutableTurn.burningGardenArrayFreeEchoes = (mutableTurn.burningGardenArrayFreeEchoes ?? 0) + Math.max(1, effect.duration);
          break;
        case 'echo_persistence_bonus':
          mutableTurn.burningGardenArrayFreeEchoes = (mutableTurn.burningGardenArrayFreeEchoes ?? 0) + Math.max(0, effect.duration - 1);
          break;
        case 'geometry_mode_on_new_lineage':
          mutableTurn.burningGardenGeometryMode = true;
          processEffect(effect.effect);
          break;
        case 'burn_all_effects_plus':
          // chain bonus removed
          if ((effect.cooldown ?? 0) > 0) {
            mutableTurn.burningGardenCrownStacks = Math.min(12, (mutableTurn.burningGardenCrownStacks ?? 0) + (effect.cooldown ?? 0));
          }
          break;
        case 'geometry_mode_next_turn_on_three_lineages':
          if (distinctLineages() >= 3) mutableTurn.burningGardenGeometryMode = true;
          break;
        case 'gate_payoff': {
          let met = 0;
          for (const gate of effect.gates) {
            if (!CardEffectExecutor.evaluateCondition(gate.condition, mutableTurn, mutableBoard)) continue;
            met += 1;
            processEffect(gate.payoff);
          }
          mutableTurn.burningGardenTransitGateCredit = Math.max(mutableTurn.burningGardenTransitGateCredit ?? 0, met);
          break;
        }
        case 'zenith_on_all_gates':
          if ((mutableTurn.burningGardenTransitGateCredit ?? 0) >= 3) {
            mutableTurn.burningGardenZenithNextInfinite = true;
            mutableTurn.burningGardenGeometryMode = true;
            processEffect(effect.effect);
          }
          break;
        case 'gain_echo':
          mutableTurn.burningGardenArrayFreeEchoes = (mutableTurn.burningGardenArrayFreeEchoes ?? 0) + effect.value;
          break;
        case 'burn_attack':
          oblivionBonus += Math.round(effect.value * 160 * MECHANIC_OBLIVION_BUFF);
          break;
        case 'salvage_burn_from_discard': {
          if (pendingEffect === null) {
            const matching = mutableDeck.discardPile.filter(card => isBurningGardenCardId(card.definitionId));
            if (matching.length > 0) {
              pendingEffect = { type: 'salvage', cards: matching, filter: null, count: 1 };
            }
          }
          break;
        }
        case 'copy_garden_law_to_sky_law': {
          const law = mutableTurn.burningGardenLaw ?? 'Rose';
          mutableTurn.burningGardenSkyLaw = law;
          const matching = effect.effects.find(entry => entry.law === law);
          if (matching) processEffect(matching.effect);
          break;
        }
        case 'burn_return_to_hand_as_echo':
          mutableTurn.burningGardenArrayFreeEchoes = (mutableTurn.burningGardenArrayFreeEchoes ?? 0) + effect.duration;
          break;
        case 'burn_cooldown_reduction':
          // chain bonus removed
          break;
        default:
          break;
      }
      switch (effect.type) {
        // �E�E�E��E�E�E��E�E�E��E�E�E� Oblivion effects �E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E�
        case 'oblivion_flat': {
          let val = effect.value * multiplier;
          const neutralityEternalBonus = computeNeutralityEternalOblivionBonus(deckCard.definitionId, mutableTurn, mutableBoard);
          if (neutralityEternalBonus !== null) {
            val = neutralityEternalBonus * multiplier;
          }
          const neutralityInfiniteBonus = computeNeutralityInfiniteOblivionBonus(deckCard.definitionId, mutableTurn, mutableBoard);
          if (neutralityInfiniteBonus !== null) {
            val = neutralityInfiniteBonus * multiplier;
          }
          const pyroInfiniteBonus = computePyroInfiniteOblivionBonus(deckCard.definitionId, mutableTurn, heatDrained);
          if (pyroInfiniteBonus !== null) {
            val = Math.round(pyroInfiniteBonus * MECHANIC_OBLIVION_BUFF) * multiplier;
          }
          const lightInfiniteBonus = computeLightInfiniteOblivionBonus(deckCard.definitionId, mutableTurn, mutableBoard);
          if (lightInfiniteBonus !== null) {
            val = Math.round(lightInfiniteBonus * MECHANIC_OBLIVION_BUFF) * multiplier;
          }
          const thornboundInfiniteBonus = computeThornboundInfiniteOblivionBonus(deckCard.definitionId, mutableTurn);
          if (thornboundInfiniteBonus !== null) {
            val = Math.round(thornboundInfiniteBonus * MECHANIC_OBLIVION_BUFF) * multiplier;
          }
          const mechanicalInfiniteBonus = computeMechanicalInfiniteOblivionBonus(deckCard.definitionId, mutableTurn);
          if (mechanicalInfiniteBonus !== null) {
            val = Math.round(mechanicalInfiniteBonus * MECHANIC_OBLIVION_BUFF) * multiplier;
          }
          // Oblivion Pulse — +10 per card played this turn (including this one)
          if (deckCard.definitionId === 'ophanim-neutral-chain-pulse') {
            val = (mutableTurn.cardsPlayedThisTurn + 1) * 10 * multiplier;
          }
          // Echo Pulse — +15 per card played this turn
          if (deckCard.definitionId === 'ophanim-neutral-echo-pulse') {
            val = (mutableTurn.cardsPlayedThisTurn + 1) * 15 * multiplier;
          }
          // Pyroabyss base cards now resolve exclusively from authored typed effects
          // (pyro_heat_* / conditional / draw / oblivion_flat) in source definitions.
          // Sunforged ? +25 Oblivion per Radiance drained
          if (deckCard.definitionId === 'hr-light-sunforged') {
            val = Math.round(radianceDrained * 25 * MECHANIC_OBLIVION_BUFF) * multiplier;
          }
          // Celestial Dividend ? +18 Oblivion per Radiance drained
          if (deckCard.definitionId === 'hr-light-celestial-dividend') {
            val = Math.round(radianceDrained * 18 * MECHANIC_OBLIVION_BUFF) * multiplier;
          }
          // Grand Illumination ? +8 Oblivion per Radiance (after doubling)
          if (deckCard.definitionId === 'hr-light-grand-illumination') {
            val = Math.round(mutableTurn.radiance * 8 * MECHANIC_OBLIVION_BUFF) * multiplier;
          }
          if (deckCard.definitionId === 'inf-prismatic-axiom-rain') {
            const distinct = Math.min(6, new Set(mutableTurn.prismaticDistinctChannels ?? []).size);
            const nodes = Math.max(0, mutableTurn.prismaticNodeCharges ?? 0);
            const depthBonus = (mutableTurn.prismaticRefractionDepth ?? 0) >= 6 ? 120 : 0;
            val = Math.round((distinct * 18 + nodes * 42 + depthBonus) * MECHANIC_OBLIVION_BUFF) * multiplier;
          }
          if (def?.element === 'Neutrality' && val > 0) {
            mutableTurn.neutralityTriggeredEffects = [
              ...(mutableTurn.neutralityTriggeredEffects ?? []),
              `${deckCard.definitionId}: +${Math.round(val)} oblivion`,
            ].slice(-8);
          }
          oblivionBonus += val;
          break;
        }

        case 'black_glass_white_flame_gain':
          mutableTurn.blackGlassWhiteFlame = Math.min(30, (mutableTurn.blackGlassWhiteFlame ?? 0) + effect.value * multiplier);
          break;

        case 'black_glass_black_flame_gain':
          mutableTurn.blackGlassBlackFlame = Math.min(30, (mutableTurn.blackGlassBlackFlame ?? 0) + effect.value * multiplier);
          break;

        case 'black_glass_fracture_gain':
          mutableTurn.blackGlassFracture = Math.min(18, (mutableTurn.blackGlassFracture ?? 0) + effect.value * multiplier);
          break;

        case 'black_glass_flames_swap': {
          const white = mutableTurn.blackGlassWhiteFlame ?? 0;
          const black = mutableTurn.blackGlassBlackFlame ?? 0;
          mutableTurn.blackGlassWhiteFlame = black;
          mutableTurn.blackGlassBlackFlame = white;
          break;
        }

        case 'black_glass_fracture_collapse': {
          const current = mutableTurn.blackGlassFracture ?? 0;
          if (effect.value > 0 && effect.value <= 1) {
            mutableTurn.blackGlassFracture = Math.max(0, Math.ceil(current * effect.value));
          } else {
            mutableTurn.blackGlassFracture = Math.max(0, current - Math.max(0, effect.value * multiplier));
          }
          break;
        }

        case 'black_glass_eclipse_burst': {
          const stacks = (mutableTurn.eternalStacks ?? (mutableTurn.eternalStacks = {})) as Record<string, number>;
          const available = Math.max(0, stacks.glass ?? 0);
          const consume = Math.min(available, effect.consume ?? available);
          if (consume <= 0) break;
          stacks.glass = Math.max(0, available - consume);

          const white = mutableTurn.blackGlassWhiteFlame ?? 0;
          const black = mutableTurn.blackGlassBlackFlame ?? 0;
          const fracture = Math.max(0, mutableTurn.blackGlassFracture ?? 0);
          const gap = Math.abs(white - black);
          const balanceTier = Math.max(0, 3 - gap);

          let burst = consume * effect.oblivionPerEclipse;
          if ((effect.balanceBonusPerEclipse ?? 0) > 0 && balanceTier > 0) {
            burst += consume * balanceTier * (effect.balanceBonusPerEclipse ?? 0);
          }
          if ((effect.fractureBonusPerEclipse ?? 0) > 0 && fracture > 0) {
            burst += consume * fracture * (effect.fractureBonusPerEclipse ?? 0);
          }

          oblivionBonus += Math.round(burst * MECHANIC_OBLIVION_BUFF) * multiplier;
          break;
        }

        case 'prismatic_light_gain': {
          const gain = effect.value * multiplier;
          mutableTurn.prismaticLight = (mutableTurn.prismaticLight ?? 0) + gain;
          break;
        }

        case 'prismatic_light_spend': {
          if (effect.value >= 9999) {
            mutableTurn.prismaticLight = 0;
          } else {
            if ((mutableTurn.prismaticLight ?? 0) < effect.value) return false;
            mutableTurn.prismaticLight = (mutableTurn.prismaticLight ?? 0) - effect.value;
          }
          break;
        }

        case 'resonance_charge_gain': {
          const gain = effect.value * multiplier;
          mutableTurn.prismaticResonanceCharge = (mutableTurn.prismaticResonanceCharge ?? 0) + gain;
          break;
        }

        case 'resonance_charge_spend': {
          if (effect.value >= 9999) {
            mutableTurn.prismaticResonanceCharge = 0;
          } else {
            if ((mutableTurn.prismaticResonanceCharge ?? 0) < effect.value) return false;
            mutableTurn.prismaticResonanceCharge = (mutableTurn.prismaticResonanceCharge ?? 0) - effect.value;
          }
          break;
        }

        case 'prismatic_charge_gain': {
          const gain = effect.value * multiplier;
          mutableTurn.prismaticNodeCharges = (mutableTurn.prismaticNodeCharges ?? 0) + gain;
          break;
        }

        case 'prismatic_charge_spend': {
          if (effect.value >= 9999) {
            mutableTurn.prismaticNodeCharges = 0;
          } else {
            if ((mutableTurn.prismaticNodeCharges ?? 0) < effect.value) return false;
            mutableTurn.prismaticNodeCharges = (mutableTurn.prismaticNodeCharges ?? 0) - effect.value;
          }
          break;
        }

        case 'monochromatic_shards_gain': {
          const gain = effect.value * multiplier;
          mutableTurn.monochromaticShards = (mutableTurn.monochromaticShards ?? 0) + gain;
          oblivionBonus += Math.round(gain * 2 * MECHANIC_OBLIVION_BUFF);
          break;
        }

        case 'monochromatic_shards_spend': {
          if (effect.value >= 9999) {
            const shards = mutableTurn.monochromaticShards ?? 0;
            oblivionBonus += Math.round(shards * 6 * MECHANIC_OBLIVION_BUFF);
            mutableTurn.monochromaticShards = 0;
          } else {
            if ((mutableTurn.monochromaticShards ?? 0) < effect.value) return false;
            mutableTurn.monochromaticShards = (mutableTurn.monochromaticShards ?? 0) - effect.value;
          }
          break;
        }

        case 'arctic_charge_gain': {
          const gain = effect.value * multiplier;
          mutableTurn.arcticCharge = (mutableTurn.arcticCharge ?? 0) + gain;
          break;
        }

        case 'arctic_charge_discharge': {
          const charge = mutableTurn.arcticCharge ?? 0;
          if (charge > 0) {
            oblivionBonus += Math.round(charge * 8 * MECHANIC_OBLIVION_BUFF) * multiplier;
            mutableTurn.arcticCharge = 0;
          }
          break;
        }

        case 'bloom_gain': {
          const gain = effect.value * multiplier;
          mutableTurn.bloom = (mutableTurn.bloom ?? 0) + gain;
          break;
        }

        case 'bloom_harvest': {
          const bloom = mutableTurn.bloom ?? 0;
          if (bloom > 0) {
            const bonus = Math.min(bloom * 0.015, 0.5);
            mutableBoard.activeBoardEffects.push({ type: 'score_multiplier', value: 1 + bonus });
            mutableTurn.bloom = 0;
          }
          break;
        }

        case 'butterfly_spectrum_gain': {
          const prior = mutableTurn.butterflySpectrum ?? 0;
          let gained = effect.value * multiplier;
          // Wing Pulse: double pending spectrum gains.
          if ((mutableTurn.flutterWingPulseDoubles ?? 0) > 0 && gained > 0) {
            gained *= 2;
            mutableTurn.flutterWingPulseDoubles = (mutableTurn.flutterWingPulseDoubles ?? 0) - 1;
          }
          let next = Math.max(0, prior + gained);
          mutableTurn.butterflySpectrum = next;

          // Flutter thresholds: 4 (minor), 8 (major), 12 (descent).
          if (prior < 4 && next >= 4) {
            mutableDeck = TurnSystem.drawCards(mutableDeck, 1);
          }
          if (prior < 8 && next >= 8) {
            // (chain bonus removed)
          }
          if (next >= 12) {
            mutableTurn.butterflyStance = 'Dual';
            mutableDeck = TurnSystem.drawCards(mutableDeck, 1);
            next = 0;
            mutableTurn.butterflySpectrum = 0;
            mutableTurn.butterflyFlutterLevel = 0;
          } else {
            mutableTurn.butterflyFlutterLevel = next >= 8 ? 2 : next >= 4 ? 1 : 0;
          }
          break;
        }

        case 'butterfly_release': {
          const spectrum = Math.max(0, mutableTurn.butterflySpectrum ?? 0);
          const spend = effect.spend >= 9999 ? spectrum : Math.min(spectrum, effect.spend);
          if (spend <= 0) break;

          mutableTurn.butterflySpectrum = Math.max(0, spectrum - spend);
          mutableTurn.butterflyFlutterLevel = (mutableTurn.butterflySpectrum ?? 0) >= 8
            ? 2
            : (mutableTurn.butterflySpectrum ?? 0) >= 4
              ? 1
              : 0;

          let releaseOblivion = Math.round(spend * effect.oblivionPerSpectrum * MECHANIC_OBLIVION_BUFF) * multiplier;
          const stance = mutableTurn.butterflyStance ?? 'Reflect';

          if (stance === 'Absorb' || stance === 'Dual') {
            releaseOblivion += Math.round(spend * 15 * MECHANIC_OBLIVION_BUFF) * multiplier;
          }
          if (stance === 'Reflect' || stance === 'Dual') {
            mutableDeck = TurnSystem.drawCards(mutableDeck, Math.max(1, Math.floor(spend / 3)));
          }

          oblivionBonus += releaseOblivion;
          break;
        }

        case 'seas_undertow_gain': {
          ensureEternalSeasState(mutableTurn);
          mutableTurn.eternalSeasUndertow = Math.max(0, (mutableTurn.eternalSeasUndertow ?? 0) + effect.value * multiplier);
          break;
        }

        case 'seas_foam_gain': {
          ensureEternalSeasState(mutableTurn);
          mutableTurn.eternalSeasFoam = Math.max(0, (mutableTurn.eternalSeasFoam ?? 0) + effect.value * multiplier);
          break;
        }

        case 'seas_undertow_release': {
          ensureEternalSeasState(mutableTurn);
          const undertow = Math.max(0, mutableTurn.eternalSeasUndertow ?? 0);
          const spend = effect.spend >= 9999 ? undertow : Math.min(undertow, effect.spend);
          if (spend <= 0) break;

          mutableTurn.eternalSeasUndertow = Math.max(0, undertow - spend);
          oblivionBonus += Math.round(spend * effect.oblivionPerUndertow * MECHANIC_OBLIVION_BUFF) * multiplier;
          if ((effect.foamPerSpent ?? 0) > 0) {
            mutableTurn.eternalSeasFoam = Math.max(0, (mutableTurn.eternalSeasFoam ?? 0) + spend * (effect.foamPerSpent ?? 0) * multiplier);
          }
          applyEternalSeasReleaseReactions();
          break;
        }

        case 'seas_foam_spend': {
          ensureEternalSeasState(mutableTurn);
          const foam = Math.max(0, mutableTurn.eternalSeasFoam ?? 0);
          if (effect.value >= 9999) {
            mutableTurn.eternalSeasFoam = 0;
          } else {
            if (foam < effect.value) return false;
            mutableTurn.eternalSeasFoam = foam - effect.value;
          }
          break;
        }

        case 'seas_deepwake_surge': {
          ensureEternalSeasState(mutableTurn);
          const counters = (mutableTurn.secondaryCounters ?? (mutableTurn.secondaryCounters = {})) as Record<string, number>;
          const available = Math.max(0, counters.deepwake ?? 0);
          const consume = Math.min(available, effect.consume ?? available);
          if (consume <= 0) break;

          counters.deepwake = available - consume;

          const undertowGain = consume * effect.undertowPerDeepwake * multiplier;
          mutableTurn.eternalSeasUndertow = Math.max(0, (mutableTurn.eternalSeasUndertow ?? 0) + undertowGain);

          const undertowPool = Math.max(0, mutableTurn.eternalSeasUndertow ?? 0);
          const releaseSpend = effect.releaseSpend === undefined
            ? undertowPool
            : effect.releaseSpend >= 9999
              ? undertowPool
              : Math.min(undertowPool, effect.releaseSpend);

          if (releaseSpend > 0) {
            mutableTurn.eternalSeasUndertow = Math.max(0, undertowPool - releaseSpend);
            const perUndertow = effect.oblivionPerUndertow + consume * effect.oblivionPerDeepwakeBonus;
            oblivionBonus += Math.round(releaseSpend * perUndertow * MECHANIC_OBLIVION_BUFF) * multiplier;
          }

          if ((effect.foamPerDeepwake ?? 0) > 0) {
            mutableTurn.eternalSeasFoam = Math.max(0, (mutableTurn.eternalSeasFoam ?? 0) + consume * (effect.foamPerDeepwake ?? 0) * multiplier);
          }
          applyEternalSeasReleaseReactions();
          break;
        }


        // �E�E�E��E�E�E��E�E�E��E�E�E� Thornbound / Mechanical Dreams resources �E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E�
        case 'trail_gain':
          mutableTurn.trail += effect.value * multiplier;
          break;

        case 'trail_spend': {
          if (effect.value >= 9999) {
            mutableTurn.trail = 0;
          } else {
            if (mutableTurn.trail < effect.value) return false;
            mutableTurn.trail -= effect.value;
          }
          break;
        }

        case 'strain_gain':
          mutableTurn.strain += effect.value * multiplier;
          break;

        case 'strain_vent': {
          if (effect.value >= 9999) {
            mutableTurn.strain = 0;
          } else {
            mutableTurn.strain = Math.max(0, mutableTurn.strain - effect.value);
          }
          break;
        }

        case 'overclock': {
          mutableTurn.strain += effect.strain * multiplier;
          for (const subEffect of effect.then) {
            const ok = processEffect(subEffect);
            if (!ok) return false;
          }
          break;
        }

        case 'patience_gain_all': {
          const linkedBonus = Math.max(0, mutableTurn.neutralityLinkedGainBonus ?? 0);
          const equilibriumBonus = getNeutralityEquilibriumPatienceGainBonus();
          const vesselId = mutableTurn.neutralityVesselInstanceId ?? null;
          const vesselCopyPercent = Math.max(0, mutableTurn.neutralityVesselCopyPercent ?? 0);
          const perUnitGain = effect.value + linkedBonus + equilibriumBonus;
          let totalGain = 0;
          let nonVesselGain = 0;

          for (const unit of mutableBoard.frontSlots) {
            if (!isActivePatienceUnit(unit)) continue;
            if (sourceSetKey) {
              const unitDef = CardRegistry.get(unit.definitionId);
              if (!unitDef || getCardCategoryKey(unitDef) !== sourceSetKey) continue;
            }
            unit.patienceStacks = (unit.patienceStacks ?? 0) + perUnitGain;
            totalGain += perUnitGain;
            if (vesselId && unit.instanceId !== vesselId) {
              nonVesselGain += perUnitGain;
            }
          }

          if (vesselId && vesselCopyPercent > 0 && nonVesselGain > 0) {
            const vessel = mutableBoard.frontSlots.find(
              (unit): unit is SeraphimInstance | AngelInstance => {
                if (!isActivePatienceUnit(unit) || unit.instanceId !== vesselId) return false;
                if (sourceSetKey) {
                  const unitDef = CardRegistry.get(unit.definitionId);
                  if (!unitDef || getCardCategoryKey(unitDef) !== sourceSetKey) return false;
                }
                return true;
              },
            );
            if (vessel) {
              const copied = Math.floor(nonVesselGain * (vesselCopyPercent / 100));
              if (copied > 0) {
                vessel.patienceStacks = (vessel.patienceStacks ?? 0) + copied;
                totalGain += copied;
              }
            }
          }

          if (def?.element === 'Neutrality' && totalGain > 0) {
            mutableTurn.neutralityPatienceChargedThisTurn = (mutableTurn.neutralityPatienceChargedThisTurn ?? 0) + totalGain;
            mutableTurn.neutralityTriggeredEffects = [
              ...(mutableTurn.neutralityTriggeredEffects ?? []),
              `${deckCard.definitionId}: +${totalGain} total patience`,
            ].slice(-8);
          }
          break;
        }

        case 'patience_double_all': {
          let consumedForDoubling = 0;
          for (const unit of mutableBoard.frontSlots) {
            if (!isActivePatienceUnit(unit)) continue;
            if (sourceSetKey) {
              const unitDef = CardRegistry.get(unit.definitionId);
              if (!unitDef || getCardCategoryKey(unitDef) !== sourceSetKey) continue;
            }
            const before = unit.patienceStacks ?? 0;
            unit.patienceStacks = before * 2;
            consumedForDoubling += before;
          }
          if (def?.element === 'Neutrality' && consumedForDoubling > 0) {
            mutableTurn.neutralityPatienceConsumedThisTurn = (mutableTurn.neutralityPatienceConsumedThisTurn ?? 0) + consumedForDoubling;
            mutableTurn.neutralityTriggeredEffects = [
              ...(mutableTurn.neutralityTriggeredEffects ?? []),
              `${deckCard.definitionId}: doubled ${consumedForDoubling} patience`,
            ].slice(-8);
          }
          break;
        }

        case 'neutrality_equilibrium_sigil_gain': {
          grantNeutralityEquilibriumSigils(effect.value, deckCard.definitionId);
          break;
        }

        case 'neutrality_equilibrium_starbound_cashout': {
          const available = Math.max(0, mutableTurn.neutralityEquilibriumSigils ?? 0);
          const spent = spendNeutralityEquilibriumSigils(available);
          if (spent <= 0) break;

          for (const unit of mutableBoard.frontSlots) {
            if (!isActivePatienceUnit(unit)) continue;
            if (sourceSetKey) {
              const unitDef = CardRegistry.get(unit.definitionId);
              if (!unitDef || getCardCategoryKey(unitDef) !== sourceSetKey) continue;
            }
            unit.patienceStacks = (unit.patienceStacks ?? 0) * 2;
          }
          oblivionBonus += spent * Math.max(0, effect.oblivionPerSigil);

          const patientLightPerSigils = Math.max(1, effect.patientLightPerSigils ?? 5);
          const patientLightGain = Math.floor(spent / patientLightPerSigils);
          if (patientLightGain > 0) {
            mutableTurn.neutralityPatientLightStacks = Math.max(0, mutableTurn.neutralityPatientLightStacks ?? 0) + patientLightGain;
          }
          break;
        }

        case 'neutrality_equilibrium_tactical_spend': {
          const spend = Math.max(0, effect.spend);
          if (spend <= 0) break;
          if ((mutableTurn.neutralityEquilibriumSigils ?? 0) < spend) break;
          if (pendingEffect === null) {
            pendingEffect = {
              type: 'neutrality_equilibrium_tactical_choice',
              spend,
              burstOblivion: Math.max(0, effect.burstOblivion),
              restorePercent: Math.max(0, effect.restorePercent),
              patientLightGain: Math.max(0, effect.patientLightGain ?? 0),
            };
          }
          break;
        }

        case 'neutrality_patient_light_gain': {
          const gain = Math.max(0, effect.value);
          if (gain <= 0) break;
          mutableTurn.neutralityPatientLightStacks = (mutableTurn.neutralityPatientLightStacks ?? 0) + gain;
          if (def?.element === 'Neutrality') {
            mutableTurn.neutralityTriggeredEffects = [
              ...(mutableTurn.neutralityTriggeredEffects ?? []),
              `${deckCard.definitionId}: +${gain} Patient Light`,
            ].slice(-8);
          }
          break;
        }

        case 'neutrality_designate_vessel': {
          // Same-set: vessel must be an active Seraphim sharing the source
          // card's set so Patient Light's anchor stays within Neutrality.
          const candidates = mutableBoard.frontSlots
            .filter((unit): unit is SeraphimInstance => {
              if (!isActiveSeraphim(unit)) return false;
              if (sourceSetKey) {
                const unitDef = CardRegistry.get(unit.definitionId);
                if (!unitDef || getCardCategoryKey(unitDef) !== sourceSetKey) return false;
              }
              return true;
            })
            .sort((a, b) => (b.patienceStacks ?? 0) - (a.patienceStacks ?? 0));
          if (candidates.length > 0) {
            mutableTurn.neutralityVesselInstanceId = candidates[0].instanceId;
            mutableTurn.neutralityTriggeredEffects = [
              ...(mutableTurn.neutralityTriggeredEffects ?? []),
              `${deckCard.definitionId}: vessel set`,
            ].slice(-8);
          }
          break;
        }

        case 'neutrality_attack_preserve': {
          mutableTurn.neutralityAttackPreservePercent = Math.max(
            mutableTurn.neutralityAttackPreservePercent ?? 0,
            Math.max(0, effect.percent),
          );
          break;
        }

        // �E�E�E��E�E�E��E�E�E��E�E�E� Legacy score/power effects (Light compat ? map to Oblivion) �E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E�
        case 'score_flat':
          oblivionBonus += effect.value * multiplier;
          break;

        case 'power_flat':
          mutableBoard.activeBoardEffects.push({ type: 'power_flat', value: effect.value * multiplier });
          break;
        case 'power_percent':
          mutableBoard.activeBoardEffects.push({ type: 'power_percent', value: effect.value * multiplier });
          break;
        case 'score_multiplier':
          mutableBoard.activeBoardEffects.push({ type: 'score_multiplier', value: effect.value * multiplier });
          break;
        case 'seraphim_bonus_amplifier':
          mutableBoard.activeBoardEffects.push({ type: 'seraphim_bonus_amplifier', value: effect.value * multiplier });
          break;

        // �E�E�E��E�E�E��E�E�E��E�E�E� Radiance effects (Light) �E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E�
        case 'radiance_gain': {
          let gain = effect.value;
          if (deckCard.definitionId === 'hr-light-seraphic-bond') gain = activeSynergies;
          else if (deckCard.definitionId === 'hr-light-aureate-chain') {
            gain = deck.hand.filter(c => {
              const d = CardRegistry.get(c.definitionId);
              return d?.type === 'Ophanim';
            }).length;
          }
          else if (deckCard.definitionId === 'hr-light-transcendent-surge') {
            gain = mutableTurn.cardsPlayedThisTurn;
          }
          else if (deckCard.definitionId === 'ser-light-warden') {
            gain = Math.ceil(deck.hand.length / 2);
          }
          applyRadianceGain(gain * multiplier);
          break;
        }

        case 'radiance_spend': {
          if (effect.value >= 9999) {
            radianceDrained = mutableTurn.radiance;
            mutableTurn.radiance = 0;
          } else {
            if (mutableTurn.radiance < effect.value) return false;
            mutableTurn.radiance -= effect.value;
          }
          break;
        }

        case 'radiance_double':
          mutableTurn.radiance = mutableTurn.radiance * 2;
          break;

        // �E�E�E��E�E�E��E�E�E��E�E�E� Ember effects (Pyroabyss) �E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E�
        // Base Pyroabyss core loop: Heat build, threshold, and burst.
        case 'pyro_heat_gain': {
          const current = Math.max(0, mutableTurn.pyroHeat ?? 0);
          mutableTurn.pyroHeat = current + (effect.value * multiplier);
          break;
        }

        case 'pyro_heat_spend': {
          const current = Math.max(0, mutableTurn.pyroHeat ?? 0);
          if (effect.value >= 9999) {
            heatDrained = current;
            mutableTurn.pyroHeat = 0;
          } else {
            if (current < effect.value) return false;
            mutableTurn.pyroHeat = current - effect.value;
          }
          break;
        }

        case 'pyro_heat_burst': {
          const available = Math.max(0, mutableTurn.pyroHeat ?? 0);
          const consume = Math.min(available, effect.consume ?? available);
          if (consume <= 0) break;
          mutableTurn.pyroHeat = available - consume;
          oblivionBonus += Math.round(consume * effect.oblivionPerHeat * MECHANIC_OBLIVION_BUFF) * multiplier;
          break;
        }

        // Eternal/Infinity per-set amplifier stacks.
        case 'eternal_stack_gain': {
          const stacks = (mutableTurn.eternalStacks ?? (mutableTurn.eternalStacks = {})) as Record<string, number>;
          const gain = effect.value * multiplier;
          stacks[effect.stack] = (stacks[effect.stack] ?? 0) + gain;
          // Higher-rarity Pyro overlays should amplify, not replace, the base Heat loop.
          if (effect.stack === 'pyro') {
            mutableTurn.pyroHeat = Math.max(0, mutableTurn.pyroHeat ?? 0) + gain;
          }
          break;
        }

        case 'eternal_stack_spend': {
          const stacks = (mutableTurn.eternalStacks ?? (mutableTurn.eternalStacks = {})) as Record<string, number>;
          const current = stacks[effect.stack] ?? 0;
          if (effect.value >= 9999) {
            stacks[effect.stack] = 0;
          } else {
            if (current < effect.value) return false;
            stacks[effect.stack] = current - effect.value;
          }
          break;
        }

        case 'eternal_stack_cashout': {
          const stacks = (mutableTurn.eternalStacks ?? (mutableTurn.eternalStacks = {})) as Record<string, number>;
          const available = Math.max(0, stacks[effect.stack] ?? 0);
          const consume = Math.min(available, effect.consume ?? available);
          if (consume <= 0) break;
          stacks[effect.stack] = Math.max(0, available - consume);
          oblivionBonus += Math.round(consume * effect.oblivionPerStack * MECHANIC_OBLIVION_BUFF) * multiplier;
          if ((effect.drawPerStack ?? 0) > 0) {
            const extraDraw = Math.floor(consume * (effect.drawPerStack ?? 0));
            for (let i = 0; i < extraDraw; i++) {
              const ok = processEffect({ type: 'draw', value: 1 });
              if (!ok) break;
            }
          }
          break;
        }

        // ── Per-set secondary keyword counters (generic gain/spend) ──────────
        case 'set_secondary_gain': {
          const counters = (mutableTurn.secondaryCounters ?? (mutableTurn.secondaryCounters = {})) as Record<string, number>;
          const gain = effect.value * multiplier;
          counters[effect.kind] = (counters[effect.kind] ?? 0) + gain;
          // Chroma gain feeds back into the core Heat rhythm at a reduced rate.
          if (effect.kind === 'pyro') {
            const heatFromChroma = Math.max(1, Math.floor(gain / 2));
            mutableTurn.pyroHeat = Math.max(0, mutableTurn.pyroHeat ?? 0) + heatFromChroma;
          }
          break;
        }
        case 'set_secondary_spend': {
          const counters = (mutableTurn.secondaryCounters ?? (mutableTurn.secondaryCounters = {})) as Record<string, number>;
          const current = counters[effect.kind] ?? 0;
          if (effect.value >= 9999) {
            counters[effect.kind] = 0;
          } else {
            if (current < effect.value) return false;
            counters[effect.kind] = current - effect.value;
          }
          break;
        }

        // ── 11 bespoke per-set cashout payoffs ───────────────────────────────
        // Pyroabyss — Chroma Ember Ignite: quadratic oblivion (embers² × X)
        case 'pyro_cinder_echo_ignite': {
          const counters = (mutableTurn.secondaryCounters ?? (mutableTurn.secondaryCounters = {})) as Record<string, number>;
          const available = Math.max(0, counters.pyro ?? 0);
          const consume = Math.min(available, effect.consume ?? available);
          if (consume <= 0) break;
          counters.pyro = available - consume;
          oblivionBonus += Math.round(consume * consume * effect.oblivionPerEchoSquared * MECHANIC_OBLIVION_BUFF) * multiplier;
          // Ignition restokes Furnace Heat to keep the core loop active.
          mutableTurn.pyroHeat = Math.max(0, mutableTurn.pyroHeat ?? 0) + consume;
          break;
        }
        case 'pyro_transcendent_confluence': {
          const stacks = (mutableTurn.eternalStacks ?? (mutableTurn.eternalStacks = {})) as Record<string, number>;
          const counters = (mutableTurn.secondaryCounters ?? (mutableTurn.secondaryCounters = {})) as Record<string, number>;
          const inferno = Math.max(0, stacks.pyro ?? 0);
          const chroma = Math.max(0, counters.pyro ?? 0);
          const pairs = Math.min(inferno, chroma, effect.consume ?? Math.min(inferno, chroma));
          if (pairs <= 0) break;

          stacks.pyro = inferno - pairs;
          counters.pyro = chroma - pairs;
          oblivionBonus += Math.round(pairs * effect.oblivionPerPair * MECHANIC_OBLIVION_BUFF) * multiplier;

          if ((effect.gainInfernoPerPair ?? 0) > 0) {
            mutableTurn.pyroHeat = Math.max(0, mutableTurn.pyroHeat ?? 0) + pairs * (effect.gainInfernoPerPair ?? 0);
          }
          if ((effect.gainChromaPerPair ?? 0) > 0) {
            counters.pyro = Math.max(0, counters.pyro ?? 0) + pairs * (effect.gainChromaPerPair ?? 0);
          }
          // Confluence is a transcendent amplifier: it should spike Heat beyond base cadence.
          mutableTurn.pyroHeat = Math.max(0, mutableTurn.pyroHeat ?? 0) + pairs * 2;
          if ((effect.drawAtPairs ?? 0) > 0) {
            const draws = Math.floor(pairs / Math.max(1, effect.drawAtPairs ?? 0));
            if (draws > 0) {
              mutableDeck = TurnSystem.drawCards(mutableDeck, draws);
            }
          }
          break;
        }
        case 'light_transcendent_duality_choice': {
          if (pendingEffect === null) {
            pendingEffect = {
              type: 'light_transcendent_duality_choice',
              baseOblivion: effect.baseOblivion,
              resonanceScale: effect.resonanceScale,
              haloScale: effect.haloScale,
              distinctNoteScale: effect.distinctNoteScale,
              thresholdDivisor: effect.thresholdDivisor,
              thresholdScale: effect.thresholdScale,
            };
          }
          break;
        }
        // Thornbound — Briar Spiral: spirals → +Trail; bonus oblivion per Trail
        case 'thorn_briar_spiral_bloom': {
          const counters = (mutableTurn.secondaryCounters ?? (mutableTurn.secondaryCounters = {})) as Record<string, number>;
          const available = Math.max(0, counters.thorn ?? 0);
          const consume = Math.min(available, effect.consume ?? available);
          if (consume <= 0) break;
          counters.thorn = available - consume;
          mutableTurn.trail = (mutableTurn.trail ?? 0) + consume * effect.trailPerSpiral;
          oblivionBonus += Math.round((mutableTurn.trail ?? 0) * (effect.oblivionPerTrail ?? 0) * MECHANIC_OBLIVION_BUFF) * multiplier;
          break;
        }
        // Snowbound Voltage — Polar Capacitor: phase-conditional split
        case 'snow_polar_capacitor_release': {
          const counters = (mutableTurn.secondaryCounters ?? (mutableTurn.secondaryCounters = {})) as Record<string, number>;
          const available = Math.max(0, counters.snow ?? 0);
          const consume = Math.min(available, effect.consume ?? available);
          if (consume <= 0) break;
          counters.snow = available - consume;
          const phase = mutableTurn.snowboundPhase ?? 'Frost';
          if (phase === 'Voltage') {
            oblivionBonus += Math.round(consume * effect.voltageOblivionPerCapacitor * MECHANIC_OBLIVION_BUFF) * multiplier;
          } else {
            const chargeGain = Math.floor(consume * effect.frostArcticChargePerCapacitor);
            mutableTurn.arcticCharge = (mutableTurn.arcticCharge ?? 0) + chargeGain;
          }
          break;
        }

        // Glass Absolute amplifier: spend `absol` counter for extra Oblivion.
        case 'absol_cascade_proof_amplify': {
          const counters = (mutableTurn.secondaryCounters ?? (mutableTurn.secondaryCounters = {})) as Record<string, number>;
          const available = Math.max(0, counters.absol ?? 0);
          const consume = Math.min(available, effect.consume ?? available);
          if (consume <= 0) break;
          counters.absol = available - consume;
          oblivionBonus += Math.round(consume * (effect.oblivionPerProofDepth ?? 0) * MECHANIC_OBLIVION_BUFF) * multiplier;
          break;
        }
        // Burning Garden — Wild Pollen: +Oblivion per pollen; score mult per Bloom
        case 'garden_wild_pollen_seed': {
          const counters = (mutableTurn.secondaryCounters ?? (mutableTurn.secondaryCounters = {})) as Record<string, number>;
          const available = Math.max(0, counters.garden ?? 0);
          const consume = Math.min(available, effect.consume ?? available);
          if (consume <= 0) break;
          counters.garden = available - consume;
          oblivionBonus += Math.round(consume * effect.oblivionPerPollen * MECHANIC_OBLIVION_BUFF) * multiplier;
          const blooms = Math.max(0, mutableTurn.bloom ?? 0);
          if (effect.scoreMultPerBloom > 0 && blooms > 0) {
            mutableBoard.activeBoardEffects.push({ type: 'score_multiplier', value: blooms * effect.scoreMultPerBloom });
          }
          break;
        }
        // Age of the Butterfly — Wing Pulse: doubles next N spectrum gains
        case 'flutter_wing_pulse_amplify': {
          const counters = (mutableTurn.secondaryCounters ?? (mutableTurn.secondaryCounters = {})) as Record<string, number>;
          const available = Math.max(0, counters.flutter ?? 0);
          const consume = Math.min(available, effect.consume ?? available);
          if (consume <= 0) break;
          counters.flutter = available - consume;
          mutableTurn.flutterWingPulseDoubles = (mutableTurn.flutterWingPulseDoubles ?? 0) + consume * effect.doubleNextGains;
          break;
        }
        case 'flutter_resonance_harmonize': {
          const stacks = (mutableTurn.eternalStacks ?? (mutableTurn.eternalStacks = {})) as Record<string, number>;
          const available = Math.max(0, stacks.flutter ?? 0);
          const consume = Math.min(available, effect.consume ?? available);
          if (consume <= 0) break;
          stacks.flutter = available - consume;

          const spectrumGain = Math.max(0, consume * (effect.spectrumPerResonance ?? 0));
          if (spectrumGain > 0) {
            const ok = processEffect({ type: 'butterfly_spectrum_gain', value: spectrumGain });
            if (!ok) break;
          }

          const formation = Math.max(0, mutableTurn.butterflyFormation ?? 0);
          const resonanceOblivion = consume * (effect.oblivionPerResonance ?? 0);
          const formationOblivion = formation * (effect.oblivionPerFormation ?? 0);
          oblivionBonus += Math.round((resonanceOblivion + formationOblivion) * MECHANIC_OBLIVION_BUFF) * multiplier;

          const extraDraw = Math.floor(consume * (effect.drawPerResonance ?? 0));
          for (let i = 0; i < extraDraw; i++) {
            const ok = processEffect({ type: 'draw', value: 1 });
            if (!ok) break;
          }

          break;
        }
        case 'flutter_resonance_apex': {
          const stacks = (mutableTurn.eternalStacks ?? (mutableTurn.eternalStacks = {})) as Record<string, number>;
          const available = Math.max(0, stacks.flutter ?? 0);
          const consume = Math.min(available, effect.consume ?? available);
          if (consume <= 0) break;
          stacks.flutter = available - consume;

          const spectrum = Math.max(0, mutableTurn.butterflySpectrum ?? 0);
          const formation = Math.max(0, mutableTurn.butterflyFormation ?? 0);
          oblivionBonus += Math.round((
            consume * effect.oblivionPerResonance
            + spectrum * effect.oblivionPerSpectrum
            + formation * effect.oblivionPerFormation
          ) * MECHANIC_OBLIVION_BUFF) * multiplier;

          const extraDraw = Math.floor(formation * (effect.drawPerFormation ?? 0));
          for (let i = 0; i < extraDraw; i++) {
            const ok = processEffect({ type: 'draw', value: 1 });
            if (!ok) break;
          }

          break;
        }

        // ─────────── Abyssal Forge — The Reforging ───────────────────────
        case 'forge_reforge_charge_gain': {
          ensureForgeTurn(mutableTurn);
          const cap = mutableTurn.reforgeChargeCap ?? 6;
          mutableTurn.reforgeCharges = Math.min(cap, (mutableTurn.reforgeCharges ?? 0) + effect.value);
          break;
        }
        case 'forge_reforge_charge_cap_raise': {
          ensureForgeTurn(mutableTurn);
          mutableTurn.reforgeChargeCap = (mutableTurn.reforgeChargeCap ?? 6) + effect.value;
          break;
        }
        case 'forge_pearl_drop': {
          ensureForgeTurn(mutableTurn);
          mutableTurn.pearls = (mutableTurn.pearls ?? 0) + effect.value;
          break;
        }
        case 'forge_pearl_cashout': {
          ensureForgeTurn(mutableTurn);
          const have = mutableTurn.pearls ?? 0;
          const spend = Math.min(have, effect.spend);
          mutableTurn.pearls = have - spend;
          oblivionBonus += Math.round(spend * effect.oblivionPerPearl * MECHANIC_OBLIVION_BUFF) * multiplier;
          break;
        }
        case 'forge_recast_last': {
          if (suppressForgeRecursion) break;
          ensureForgeTurn(mutableTurn);
          const ledger = mutableTurn.recastLedger ?? [];
          const entry = ledger[ledger.length - 1];
          if (entry) {
            const r = runRecast(entry, effect.power, mutableTurn, mutableBoard, mutableDeck);
            mutableTurn = r.turn; mutableBoard = r.board; mutableDeck = r.deck;
            oblivionBonus += r.oblivionBonus * multiplier;
          }
          break;
        }
        case 'forge_recast_last_n': {
          if (suppressForgeRecursion) break;
          ensureForgeTurn(mutableTurn);
          const ledger = mutableTurn.recastLedger ?? [];
          const slice = ledger.slice(-effect.count);
          for (const entry of slice) {
            const r = runRecast(entry, effect.power, mutableTurn, mutableBoard, mutableDeck);
            mutableTurn = r.turn; mutableBoard = r.board; mutableDeck = r.deck;
            oblivionBonus += r.oblivionBonus * multiplier;
          }
          break;
        }
        case 'forge_recast_random': {
          if (suppressForgeRecursion) break;
          ensureForgeTurn(mutableTurn);
          const rng = getActiveCoopRng();
          const ledger = mutableTurn.recastLedger ?? [];
          const count = effect.count ?? 1;
          for (let i = 0; i < count && ledger.length > 0; i++) {
            const idx = Math.floor(rng() * ledger.length);
            const entry = ledger[idx];
            const r = runRecast(entry, effect.power, mutableTurn, mutableBoard, mutableDeck);
            mutableTurn = r.turn; mutableBoard = r.board; mutableDeck = r.deck;
            oblivionBonus += r.oblivionBonus * multiplier;
          }
          break;
        }
        case 'forge_nacre_recast': {
          if (suppressForgeRecursion) break;
          ensureForgeTurn(mutableTurn);
          const ledger = mutableTurn.recastLedger ?? [];
          const targets = effect.targetMode === 'last' ? ledger.slice(-1) : ledger.slice(-(effect.count ?? 2));
          for (const entry of targets) {
            // Nacre coat: ignore imprint scaling — always pure 'power'.
            const r = runRecast({ ...entry, isNacreCoated: true }, effect.power, mutableTurn, mutableBoard, mutableDeck);
            mutableTurn = r.turn; mutableBoard = r.board; mutableDeck = r.deck;
            oblivionBonus += r.oblivionBonus * multiplier;
          }
          break;
        }
        case 'forge_temper': {
          ensureForgeTurn(mutableTurn);
          // Queue temper factor for a board source.
          mutableTurn.forgeTemperQueue = (mutableTurn.forgeTemperQueue ?? 0) + effect.factor;
          break;
        }
        case 'forge_anvil_seal': {
          ensureForgeTurn(mutableTurn);
          const ledger = mutableTurn.recastLedger ?? [];
          const entry = effect.target === 'last_played' ? ledger[ledger.length - 1] : ledger[ledger.length - 1];
          if (entry) entry.isAnvilSealed = true;
          oblivionBonus += Math.round(effect.burstOblivion * MECHANIC_OBLIVION_BUFF) * multiplier;
          break;
        }
        case 'forge_imprint_gain': {
          ensureForgeTurn(mutableTurn);
          applyForgeImprintGain(mutableTurn, effect);
          break;
        }
        case 'forge_imprint_spend_burst': {
          ensureForgeTurn(mutableTurn);
          const spent = spendForgeImprint(mutableTurn, effect.spend);
          if (spent > 0) {
            oblivionBonus += Math.round(spent * effect.oblivionPerImprint * MECHANIC_OBLIVION_BUFF) * multiplier;
          }
          break;
        }
        case 'forge_imprint_spend_recast': {
          if (suppressForgeRecursion) break;
          ensureForgeTurn(mutableTurn);
          const spent = spendForgeImprint(mutableTurn, effect.spend);
          if (spent <= 0) break;

          const ledger = mutableTurn.recastLedger ?? [];
          let targets: import('@/types/game').RecastLedgerEntry[] = [];
          if (effect.targetMode === 'last') {
            targets = ledger.slice(-1);
          } else if (effect.targetMode === 'lastN') {
            targets = ledger.slice(-Math.max(1, effect.count ?? 1));
          } else {
            const rng = getActiveCoopRng();
            const count = Math.max(1, effect.count ?? 1);
            for (let i = 0; i < count && ledger.length > 0; i++) {
              targets.push(ledger[Math.floor(rng() * ledger.length)]);
            }
          }

          if (targets.length === 0) break;
          const bonusPower = (effect.bonusPowerPerImprint ?? 0) * spent;
          const finalPower = effect.power + bonusPower;

          for (const entry of targets) {
            const r = runRecast(entry, finalPower, mutableTurn, mutableBoard, mutableDeck);
            mutableTurn = r.turn;
            mutableBoard = r.board;
            mutableDeck = r.deck;
            oblivionBonus += r.oblivionBonus * multiplier;
          }
          break;
        }
        case 'forge_unrecorded_ignite': {
          ensureForgeTurn(mutableTurn);
          mutableTurn.unrecordedHueActive = true;
          break;
        }
        case 'forge_crown_cashout': {
          ensureForgeTurn(mutableTurn);
          const stacks = (mutableTurn.eternalStacks ?? {}) as Record<string, number>;
          const crowns = stacks.forge ?? 0;
          oblivionBonus += Math.round(crowns * effect.oblivionPerCrown * MECHANIC_OBLIVION_BUFF) * multiplier;
          break;
        }

        // ───── Death-flamed Hell — Veil Marks + Cinder Crown finale ─────────

        case 'dfh_veil_marks_amplify': {
          const current = Math.max(0, mutableTurn.dfhVeilMarks ?? 0);
          if (current <= 0) break;
          const scaled = Math.floor(current * effect.factor * Math.max(1, multiplier));
          mutableTurn.dfhVeilMarks = Math.max(current, scaled);
          break;
        }

        case 'dfh_veil_marks_transmute': {
          let consume = 0;
          if (effect.source === 'pyre') {
            const stacks = (mutableTurn.eternalStacks ?? (mutableTurn.eternalStacks = {})) as Record<string, number>;
            const available = Math.max(0, stacks.pyre ?? 0);
            consume = Math.min(available, effect.consume ?? available);
            stacks.pyre = available - consume;
          } else {
            const counters = (mutableTurn.secondaryCounters ?? (mutableTurn.secondaryCounters = {})) as Record<string, number>;
            const available = Math.max(0, counters.pyre ?? 0);
            consume = Math.min(available, effect.consume ?? available);
            counters.pyre = available - consume;
          }
          if (consume <= 0) break;
          const gained = Math.floor(consume * effect.marksPerResource * Math.max(1, multiplier));
          if (gained > 0) {
            mutableTurn.dfhVeilMarks = (mutableTurn.dfhVeilMarks ?? 0) + gained;
          }
          break;
        }

        case 'dfh_veil_marks_cashout': {
          const available = Math.max(0, mutableTurn.dfhVeilMarks ?? 0);
          const consume = Math.min(available, effect.consume ?? available);
          if (consume <= 0) break;
          mutableTurn.dfhVeilMarks = available - consume;
          oblivionBonus += Math.round(consume * effect.oblivionPerMark * MECHANIC_OBLIVION_BUFF) * multiplier;
          break;
        }

        case 'dfh_veil_marks_attack_bonus': {
          const key = effect.targetDefinitionId ?? def.definitionId;
          const existing = mutableTurn.dfhVeilAttackBonusByDefinition ?? {};
          mutableTurn.dfhVeilAttackBonusByDefinition = {
            ...existing,
            [key]: {
              perMark: Math.max(0, effect.perMark),
              consumeMax: Math.max(0, effect.consumeMax),
              mode: effect.mode ?? 'synergized',
            },
          };
          break;
        }

        case 'dfh_angel_resonant_cashout': {
          if (mutableTurn.dfhAngelResonantCashoutUsed) break;
          const hasDfhAngelOnBoard = mutableBoard.frontSlots.some(
            slot => slot?.type === 'Angel' && slot.element === 'DeathFlamedHell',
          );
          if (!hasDfhAngelOnBoard) break;
          const available = Math.max(0, mutableTurn.dfhVeilMarks ?? 0);
          const consume = Math.min(available, effect.consume ?? available);
          if (consume <= 0) break;
          mutableTurn.dfhVeilMarks = available - consume;
          mutableTurn.dfhAngelResonantCashoutUsed = true;
          oblivionBonus += Math.round(consume * effect.oblivionPerMark * MECHANIC_OBLIVION_BUFF) * multiplier;
          break;
        }

        case 'dfh_crown_cashout': {
          const counters = (mutableTurn.secondaryCounters ?? (mutableTurn.secondaryCounters = {})) as Record<string, number>;
          const available = Math.max(0, counters.pyre ?? 0);
          const consume = Math.min(available, effect.consume ?? available);
          if (consume <= 0) break;
          counters.pyre = available - consume;
          oblivionBonus += Math.round(consume * effect.oblivionPerCrown * MECHANIC_OBLIVION_BUFF) * multiplier;
          break;
        }

        // ── Wished Upon A Star — Stellar Wish System ───────────────────────
        case 'starlight_gain': {
          mutableTurn.starlightCharges = (mutableTurn.starlightCharges ?? 0) + effect.amount;
          break;
        }

        case 'starlight_spend': {
          const current = mutableTurn.starlightCharges ?? 0;
          if (current < effect.amount) return false;
          mutableTurn.starlightCharges = current - effect.amount;
          break;
        }

        case 'dream_lattice_gain': {
          mutableTurn.dreamLattice = (mutableTurn.dreamLattice ?? 0) + effect.amount;
          break;
        }

        case 'dream_lattice_spend': {
          const current = mutableTurn.dreamLattice ?? 0;
          if (current < effect.amount) return false;
          mutableTurn.dreamLattice = current - effect.amount;
          break;
        }

        case 'wuas_nova_wish_burst': {
          const starlight = mutableTurn.starlightCharges ?? 0;
          const dream = mutableTurn.dreamLattice ?? 0;
          const dreamMult = effect.dreamMultiplier ?? 0.4;
          oblivionBonus += Math.round(starlight * (1 + dream * dreamMult) * MECHANIC_OBLIVION_BUFF) * multiplier;
          if (starlight >= 5) {
            const starlaceActive = mutableBoard.backSlots.some(
              (slot) => slot?.type === 'Cherubim' && slot.definitionId === 'wuas-cher-starlace-binding',
            );
            if (starlaceActive) {
              mutableTurn.dreamLattice = (mutableTurn.dreamLattice ?? 0) + 1;
            }
          }
          if (effect.consumeStarlight) mutableTurn.starlightCharges = 0;
          break;
        }

        case 'wuas_constellation_lock_release': {
          const stacks = (mutableTurn.eternalStacks ?? (mutableTurn.eternalStacks = {})) as Record<string, number>;
          const available = Math.max(0, stacks.wuas ?? 0);
          const consume = Math.min(available, effect.consume ?? available);
          if (consume <= 0) break;
          stacks.wuas = available - consume;
          oblivionBonus += Math.round(consume * effect.oblivionPerStack * MECHANIC_OBLIVION_BUFF) * multiplier;
          break;
        }

        case 'wuas_infinite_starbirth': {
          const seraphimCount = mutableBoard.frontSlots.filter(s => s?.type === 'Seraphim').length;
          const starlight = mutableTurn.starlightCharges ?? 0;
          oblivionBonus += Math.round(seraphimCount * starlight * effect.oblivionPerSeraphimPerStarlight * MECHANIC_OBLIVION_BUFF) * multiplier;
          if ((effect.drawPerDream ?? 0) > 0) {
            const dream = mutableTurn.dreamLattice ?? 0;
            const draws = Math.floor(dream * (effect.drawPerDream ?? 0));
            if (draws > 0) mutableDeck = TurnSystem.drawCards(mutableDeck, draws);
          }
          break;
        }

        // ───── Draw / deck manipulation �E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E�
        case 'draw': {
          let count = effect.value;
          if (deckCard.definitionId === 'hr-light-divine-clarity') count = 4;

          mutableDeck = TurnSystem.drawCards(mutableDeck, count);
          if (deckCard.definitionId === 'hr-light-divine-clarity') {
            applyRadianceGain(count * multiplier);
          }
          break;
        }

        case 'discard_choice':
          if (pendingEffect === null) {
            const src = deckCard.definitionId === 'hr-light-luminous-cycle'
              ? `${deckCard.instanceId}:draw_plus:1`
              : deckCard.instanceId;
            pendingEffect = { type: 'discard_choice', count: effect.value, sourceCard: src };
          }
          break;

        case 'discard_draw':
          if (pendingEffect === null) {
            pendingEffect = {
              type: 'discard_choice',
              count: effect.discard,
              sourceCard: `${deckCard.instanceId}:draw:${effect.draw}`,
            };
          }
          break;

        case 'shuffle_discard':
          mutableDeck = TurnSystem.shuffleDiscard(mutableDeck);
          break;

        case 'copy_last_hr': {
          if (suppressOphanimReplay) break;
          const lastId = mutableTurn.lastPlayedDefinitionId;
          if (lastId) {
            const lastDef = CardRegistry.get(lastId);
            if (lastDef?.type === 'Ophanim') {
              const echoResult = CardEffectExecutor.execute(
                { instanceId: 'echo', definitionId: lastId, finish: 'normal' },
                mutableTurn,
                mutableBoard,
                mutableDeck,
                false,
                { suppressOphanimReplay: true },
              );
              if (echoResult.canPlay) {
                mutableDeck = echoResult.deck;
                mutableTurn = echoResult.turn;
                mutableBoard = echoResult.board;
                oblivionBonus += echoResult.oblivionBonus;
                if (echoResult.pendingEffect !== null && pendingEffect === null) {
                  pendingEffect = echoResult.pendingEffect;
                }
              }
            }
          }
          break;
        }

        case 'look_top_take':
          if (pendingEffect === null) {
            const peeked = TurnSystem.peekTop(mutableDeck, effect.look);
            if (peeked.length > 0) {
              pendingEffect = { type: 'look_top_take', cards: peeked, take: effect.take };
            }
          }
          break;

        case 'look_top_take_drop':
          if (pendingEffect === null) {
            const peeked = TurnSystem.peekTop(mutableDeck, effect.look);
            if (peeked.length > 0) {
              pendingEffect = { type: 'look_top_take_drop', cards: peeked, take: effect.take, drop: effect.drop };
            }
          }
          break;

        case 'look_top_take_type':
          if (pendingEffect === null) {
            const peeked = TurnSystem.peekTop(mutableDeck, effect.look);
            if (peeked.length > 0) {
              const sameSetPeeked = sourceSetKey
                ? peeked.filter(card => {
                    const d = CardRegistry.get(card.definitionId);
                    return !!d && getCardCategoryKey(d) === sourceSetKey;
                  })
                : peeked;
              pendingEffect = { type: 'look_top_take_type', cards: sameSetPeeked, filter: effect.filter, take: 1 };
            }
          }
          break;

        case 'search_deck_by_type': {
          if (pendingEffect === null) {
            const matching = mutableDeck.drawPile.filter(card => {
              const d = CardRegistry.get(card.definitionId);
              if (!d) return false;
              if (sourceSetKey && getCardCategoryKey(d) !== sourceSetKey) return false;
              return effect.filter.some(f =>
                f === 'Seraphim' ? d.type === 'Seraphim'
                : f === 'Cherubim'  ? d.type === 'Cherubim'
                : f === 'Ophanim' ? d.type === 'Ophanim'
                : false
              );
            });
            if (matching.length > 0) {
              pendingEffect = { type: 'search_deck', cards: matching, filter: effect.filter, take: 1 };
            }
          }
          break;
        }

        case 'salvage_by_type': {
          if (pendingEffect === null) {
            const matching = mutableDeck.discardPile.filter(card => {
              const d = CardRegistry.get(card.definitionId);
              if (!d) return false;
              if (sourceSetKey && getCardCategoryKey(d) !== sourceSetKey) return false;
              return effect.filter.some(f =>
                f === 'Seraphim' ? d.type === 'Seraphim'
                : f === 'Cherubim'  ? d.type === 'Cherubim'
                : f === 'Ophanim' ? d.type === 'Ophanim'
                : false
              );
            });
            pendingEffect = {
              type: 'salvage',
              cards: matching,
              filter: effect.filter,
              count: effect.filter.length > 1 ? effect.filter.length : 1,
            };
          }
          break;
        }

        case 'salvage_any':
          if (pendingEffect === null) {
            pendingEffect = { type: 'salvage', cards: [...mutableDeck.discardPile], filter: null, count: 1 };
          }
          break;

        case 'conditional': {
          let met = false;
          met = CardEffectExecutor.evaluateCondition(effect.condition, mutableTurn, mutableBoard);
          if (met) {
            for (const subEffect of effect.then) {
              const ok = processEffect(subEffect);
              if (!ok) return false;
            }
          }
          break;
        }
      }
      return true;
    }

    for (const effect of effects) {
      const ok = processEffect(effect);
      if (!ok) {
        return { deck, turn, board, oblivionBonus: 0, pendingEffect: null, canPlay: false };
      }
    }

    // Vigil Seraphim: +1 Radiance per Ophanim card played while on board
    const vigilActive = board.frontSlots.some(
      s => s?.type === 'Seraphim' && s.isActive && s.definitionId === 'ser-light-vigil'
    );
    if (vigilActive && def.type === 'Ophanim') {
      applyRadianceGain(1);
    }

    // Remove played card from hand (for non-Seraphim, non-virtual cards)
    if (removeFromHand) {
      mutableDeck = {
        ...mutableDeck,
        hand: mutableDeck.hand.filter(c => c.instanceId !== deckCard.instanceId),
        discardPile: [
          ...mutableDeck.discardPile,
          {
            instanceId: deckCard.instanceId,
            definitionId: deckCard.definitionId,
            finish: deckCard.finish ?? 'normal',
          },
        ],
      };
    }

    if (countAsPlay) {
      mutableTurn.cardsPlayedThisTurn += 1;
    }

    if (countAsPlay && !skipLedger) {
      ensureForgeTurn(mutableTurn);
      const ledger = mutableTurn.recastLedger!;
      ledger.push({
        definitionId: deckCard.definitionId,
        instanceId: deckCard.instanceId,
        ledgerIndex: ledger.length,
        recastCount: 0,
        imprintStacks: 0,
        isAnvilSealed: false,
        isNacreCoated: false,
      });
      // If a Cherubim queued a temper bump for the next Seraphim, apply it now
      if (def.type === 'Seraphim' && (mutableTurn.forgePendingCherubimTemper ?? 0) > 0) {
        const f = mutableTurn.forgePendingCherubimTemper!;
        mutableTurn.forgeTemperQueue = (mutableTurn.forgeTemperQueue ?? 0) + f;
        mutableTurn.forgePendingCherubimTemper = 0;
      }
    }

    if (countAsPlay && def.type === 'Ophanim') {
      mutableTurn.lastPlayedDefinitionId = deckCard.definitionId;
    }

    const hasUncappedNeutralityGains = hasNeutralityUncappedGainsInDeck(mutableDeck);
    mutableTurn.neutralityPatientLightStacks = clampPatientLightStacks(
      mutableTurn.neutralityPatientLightStacks ?? 0,
      hasUncappedNeutralityGains,
    );
    for (const unit of mutableBoard.frontSlots) {
      if (!unit || (unit.type !== 'Seraphim' && unit.type !== 'Angel')) continue;
      unit.patienceStacks = clampPatienceStacks(unit.patienceStacks ?? 0, hasUncappedNeutralityGains);
    }

    return { deck: mutableDeck, turn: mutableTurn, board: mutableBoard, oblivionBonus, pendingEffect, canPlay: true };
  }

  static evaluateCondition(
    condition: import('@/types/effects').EffectCondition,
    turn: TurnState,
    board: BoardState
  ): boolean {
    switch (condition.type) {
      case 'radiance_gte':      return turn.radiance >= condition.value;
      case 'black_glass_black_flame_gte':
        return (turn.blackGlassBlackFlame ?? 0) >= condition.value;
      case 'black_glass_fracture_gte':
        return (turn.blackGlassFracture ?? 0) >= condition.value;
      case 'black_glass_flames_equal':
        return (turn.blackGlassWhiteFlame ?? 0) === (turn.blackGlassBlackFlame ?? 0);
      case 'light_resonance_gte':
        return (turn.lightResonance ?? 0) >= condition.value;
      case 'pyro_heat_gte':     return (turn.pyroHeat ?? 0) >= condition.value;
      case 'trail_gte':         return turn.trail >= condition.value;
      case 'eternal_seas_undertow_gte': return (turn.eternalSeasUndertow ?? 0) >= condition.value;
      case 'eternal_seas_foam_gte':     return (turn.eternalSeasFoam ?? 0) >= condition.value;
      case 'eternal_seas_tide_balance':  return Math.abs((turn.eternalSeasUndertow ?? 0) - (turn.eternalSeasFoam ?? 0)) <= condition.value;
      case 'eternal_seas_tide_imbalance_gte': return Math.abs((turn.eternalSeasUndertow ?? 0) - (turn.eternalSeasFoam ?? 0)) >= condition.value;
      case 'scar_count_gte':    return (turn.thornScar ?? 0) >= condition.value;
      case 'equilibrium_sigils_gte':
        return (turn.neutralityEquilibriumSigils ?? 0) >= condition.value;
      case 'strain_gte':        return turn.strain >= condition.value;
      case 'strain_lte':        return turn.strain <= condition.value;
      case 'resonance_charge_gte':
        return (turn.prismaticResonanceCharge ?? 0) >= condition.value;
      case 'prismatic_refraction_depth_gte':
        return (turn.prismaticRefractionDepth ?? 0) >= condition.value;
      case 'prismatic_node_charges_gte':
        return (turn.prismaticNodeCharges ?? 0) >= condition.value;
      case 'prismatic_distinct_channels_gte':
        return new Set(turn.prismaticDistinctChannels ?? []).size >= condition.value;
      case 'burn_phase_cards_gte': {
        const burnCount = [...board.frontSlots, ...board.backSlots].filter(unit => {
          if (!unit) return false;
          return unit.burningGardenPhase === 'Burn';
        }).length;
        return burnCount >= condition.value;
      }
      case 'grove_cards_gte':
        return (board.emberGrove?.length ?? 0) >= condition.value;
      case 'cards_played_gte':  return turn.cardsPlayedThisTurn >= condition.value;
      case 'first_card_this_turn': return turn.cardsPlayedThisTurn === 0;
      case 'played_after_non_matching_element': {
        return turn.cardsPlayedThisTurn > 0 && !!turn.lastPlayedElement;
      }
      case 'seraphim_active_gte':
        return board.frontSlots.filter(s => s?.type === 'Seraphim' && s.isActive).length >= condition.value;
      case 'cherubim_active_gte':
        return board.backSlots.filter(s => s !== null && s.type === 'Cherubim').length >= condition.value;
      case 'eternal_stack_gte': {
        const stacks = (turn.eternalStacks ?? {}) as Record<string, number>;
        return (stacks[condition.stack] ?? 0) >= condition.value;
      }
      case 'set_secondary_gte': {
        const counters = (turn.secondaryCounters ?? {}) as Record<string, number>;
        return (counters[condition.kind] ?? 0) >= condition.value;
      }
      case 'dfh_veil_marks_gte':
        return (turn.dfhVeilMarks ?? 0) >= condition.value;
      case 'starlight_gte':
        return (turn.starlightCharges ?? 0) >= condition.value;
      case 'dream_lattice_gte':
        return (turn.dreamLattice ?? 0) >= condition.value;
      default:
        return false;
    }
  }

  static checkPlayable(
    def: CardDefinition,
    handSize: number,
    turn: TurnState,
    board?: BoardState,
  ): boolean {
    if (def.type === 'Angel') {
      if (!board) return true;
      const angelDef = def as AngelDefinition;
      const costCount: Record<string, number> = {};
      for (const id of angelDef.summonCost) costCount[id] = (costCount[id] ?? 0) + 1;
      const boardCount: Record<string, number> = {};
      for (const slot of board.frontSlots) {
        if (slot) boardCount[slot.definitionId] = (boardCount[slot.definitionId] ?? 0) + 1;
      }
      const boardDefinitionCount = countBoardDefinitionIds(board);
      for (const [id, needed] of Object.entries(costCount)) {
        if ((boardCount[id] ?? 0) < needed) return false;
      }
      // Check extraSummonConditions
      if (angelDef.extraSummonConditions) {
        for (const cond of angelDef.extraSummonConditions) {
          if (cond.type === 'cherubim_active_gte') {
            const activeCherubim = board.backSlots.filter(s => s !== null).length;
            if (activeCherubim < cond.value) return false;
          }
          if (cond.type === 'seraphim_on_board_gte') {
            const activeSeraphim = board.frontSlots.filter(s => s?.type === 'Seraphim').length;
            if (activeSeraphim < cond.value) return false;
          }
          if (cond.type === 'board_definition_gte') {
            if ((boardDefinitionCount[cond.definitionId] ?? 0) < cond.value) return false;
          }
          if (cond.type === 'equilibrium_sigils_gte') {
            if ((turn.neutralityEquilibriumSigils ?? 0) < cond.value) return false;
          }
          if (cond.type === 'pyro_heat_gte') {
            if ((turn.pyroHeat ?? 0) < cond.value) return false;
          }
          if (cond.type === 'eternal_stack_gte') {
            const stacks = turn.eternalStacks?.[cond.stack] ?? 0;
            if (stacks < cond.value) return false;
          }
          if (cond.type === 'set_secondary_gte') {
            const counters = turn.secondaryCounters?.[cond.kind] ?? 0;
            if (counters < cond.value) return false;
          }
        }
      }
      return true;
    }

    if (def.type === 'Seraphim') {
      if (!board) return true;
      return board.frontSlots.findIndex(sl => sl === null) !== -1;
    }

    if (def.type === 'Cherubim') {
      if (!board) return true;
      return board.backSlots.findIndex(sl => sl === null) !== -1;
    }

    const effects = (def as OphanimDefinition).effects;
    for (const effect of effects) {
      if (effect.type === 'discard_choice' && handSize - 1 < effect.value) return false;
      if (effect.type === 'discard_draw' && handSize - 1 < effect.discard) return false;
      if (effect.type === 'radiance_spend' && effect.value < 9999 && turn.radiance < effect.value) return false;
      if (effect.type === 'pyro_heat_spend' && effect.value < 9999 && (turn.pyroHeat ?? 0) < effect.value) return false;
      if (effect.type === 'trail_spend' && effect.value < 9999 && turn.trail < effect.value) return false;
      if (effect.type === 'seas_foam_spend' && effect.value < 9999 && (turn.eternalSeasFoam ?? 0) < effect.value) return false;
    }
    return true;
  }
}
