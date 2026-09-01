import type { BoardState, DeckState, PendingEffect, TurnState } from '@/types/game';
import type { CardEffect } from '@/types/effects';
import type { AngelDefinition, AngelInstance, CardDefinition, CherubimDefinition, OphanimDefinition, SeraphimDefinition, SeraphimInstance } from '@/types/cards';

import { CardRegistry } from '../../cards/CardRegistry';

/** +10% buff applied to all non-Neutrality set mechanic core oblivion bursts. */
;
import { getActiveCoopRng as _getActiveCoopRng } from '@/state/coopSyncStore';
import { TurnSystem } from './TurnSystem';
import {
  clampPatienceStacks,
  hasNeutralityUncappedGainsInDeck,
} from '@/systems/cards/neutralityPatience';

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
}

function isActivePatienceUnit(unit: BoardState['frontSlots'][number]): unit is SeraphimInstance | AngelInstance {
  return !!unit && (unit.type === 'Angel' || (unit.type === 'Seraphim' && unit.isActive));
}

function computeNeutralityInfiniteOblivionBonus(definitionId: string, _turn: TurnState, board: BoardState): number | null {
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
      return 1300 + totalPatience * 80 + peakPatience * 160;
    case 'inf-null-apex':
      return 800 + peakPatience * 300 + patienceUnits * 140;
    case 'inf-entropic-crown':
      return 850 + patienceUnits * 500 + totalPatience * 65;
    case 'inf-annihilation-field':
      return 950 + peakPatience * 260 + widePatienceBonus;
    case 'inf-oblivion-absolute':
      return 1000 + totalPatience * 120 + peakPatience * 240;
    case 'inf-void-cascade':
      return 800 + patienceUnits * 600 + peakPatience * 180 + widePatienceBonus;
    case 'inf-sovereign-void':
      return 1200 + totalPatience * 90 + peakPatience * 220;
    case 'inf-eternity-rupture':
      return 1100 + patienceUnits * 420 + peakPatience * 250 + widePatienceBonus;
    default:
      return null;
  }
}

function computeNeutralityEternalOblivionBonus(definitionId: string, turn: TurnState, board: BoardState): number | null {
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
      return 300 + totalPatience * 26;
    case 'btei-temporal-ruin':
      return 340 + peakPatience * 40;
    case 'btei-null-edict':
      return 380 + totalPatience * 30;
    case 'btei-axiom-of-oblivion':
      return 420 + peakPatience * 48;
    case 'btei-eternal-vigil':
      return 240 + peakPatience * 34 + patienceUnits * 28;
    case 'btei-colossus-advent':
      return 400 + totalPatience * 28 + peakPatience * 30;
    case 'btei-sovereign-domain':
      return 320 + patienceUnits * 52;
    case 'btei-architects-manifold':
      return 310 + patienceUnits * 56;
    case 'btei-convergence-of-eternity':
      return 420 + totalPatience * 34;
    case 'btei-omniscient-fracture':
      return 480 + peakPatience * 52;
    case 'btei-neutrality-paradox-crown':
      return 420 + patienceUnits * 28;
    case 'btei-neutrality-zero-edict':
      return 290 + patienceUnits * 48;
    case 'btei-neutrality-void-throne':
      return 400 + peakPatience * 44;
    case 'btei-neutrality-axiom-maw':
      return 490 + peakPatience * 58;
    case 'btei-neutrality-prime-equilibrium':
      return 320 + firstCardBonus + totalPatience * 24;
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
  };
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
    void suppressForgeRecursion;
    const suppressOphanimReplay = options.suppressOphanimReplay ?? false;
    const sourceSetKey = 'Neutrality';

    let mutableDeck = { ...deck, hand: [...deck.hand] };
    // Shallow-copy nested Record objects so mutations in this executor never
    // bleed back into the original turn (important when called from React renders
    // with live Zustand state rather than from within an Immer set() draft).
    let mutableTurn: TurnState = {
      ...turn,
      neutralityNextAttackOblivionByInstance: turn.neutralityNextAttackOblivionByInstance ? { ...turn.neutralityNextAttackOblivionByInstance } : turn.neutralityNextAttackOblivionByInstance,
      attenuationClassUses:                   turn.attenuationClassUses                   ? { ...turn.attenuationClassUses }                   : turn.attenuationClassUses,
    };
    let mutableBoard = cloneBoard(board);
    let oblivionBonus = 0;
    let pendingEffect: PendingEffect | null = null;

    const multiplier = 1;

    const isHighRarityMechanicCard = (_cardDef: CardDefinition | undefined): boolean => Boolean(_cardDef && (
      _cardDef.rarity === 'Eternal'
      || _cardDef.rarity === 'Infinite'
      || _cardDef.definitionId.startsWith('tx-')
    ));
    void isHighRarityMechanicCard;

    function processEffect(effect: CardEffect): boolean {
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
          // Light sentinel cards removed — Phase 1 rework.
          if ((def !== undefined && def !== null) && val > 0) {
            mutableTurn.neutralityTriggeredEffects = [
              ...(mutableTurn.neutralityTriggeredEffects ?? []),
              `${deckCard.definitionId}: +${Math.round(val)} oblivion`,
            ].slice(-8);
          }
          oblivionBonus += val;
          break;
        }

        case 'patience_gain_all': {
          const perUnitGain = effect.value;
          let totalGain = 0;

          for (const unit of mutableBoard.frontSlots) {
            if (!isActivePatienceUnit(unit)) continue;
            if (sourceSetKey) {
              const unitDef = CardRegistry.get(unit.definitionId);
              if (!unitDef || 'Neutrality' !== sourceSetKey) continue;
            }
            unit.patienceStacks = (unit.patienceStacks ?? 0) + perUnitGain;
            totalGain += perUnitGain;
          }

          if ((def !== undefined && def !== null) && totalGain > 0) {
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
              if (!unitDef || 'Neutrality' !== sourceSetKey) continue;
            }
            const before = unit.patienceStacks ?? 0;
            unit.patienceStacks = before * 2;
            consumedForDoubling += before;
          }
          if ((def !== undefined && def !== null) && consumedForDoubling > 0) {
            mutableTurn.neutralityPatienceConsumedThisTurn = (mutableTurn.neutralityPatienceConsumedThisTurn ?? 0) + consumedForDoubling;
            mutableTurn.neutralityTriggeredEffects = [
              ...(mutableTurn.neutralityTriggeredEffects ?? []),
              `${deckCard.definitionId}: doubled ${consumedForDoubling} patience`,
            ].slice(-8);
          }
          break;
        }

        case 'oblivion_from_target_unit_patience': {
          if (pendingEffect === null) {
            pendingEffect = {
              type: 'neutralizing_bane_choose_target',
              sourceDefinitionId: deckCard.definitionId,
              sourceInstanceId: deckCard.instanceId,
              multiplier: effect.multiplier,
              masteryMultiplierCap: effect.masteryMultiplierCap,
            };
          }
          break;
        }

        // ──────── Legacy score/power effects (Light compat → map to Oblivion) ────────
        case 'score_flat':
          oblivionBonus += effect.value * multiplier;
          break;

        case 'score_multiplier':
          // Add N% of this turn's accumulated Oblivion as a flat bonus on this play.
          oblivionBonus += Math.round(mutableTurn.oblivionEarnedThisTurn * effect.value * multiplier / 100);
          break;
        case 'seraphim_bonus_amplifier':
          // Flat additive: adds N to each active Seraphim's per-play Oblivion payout for the rest of this turn.
          mutableTurn.seraphimBonusAmp = (mutableTurn.seraphimBonusAmp ?? 0) + effect.value * multiplier;
          break;

        case 'draw': {
          const count = effect.value;
          mutableDeck = TurnSystem.drawCards(mutableDeck, count);
          break;
        }

        case 'discard_choice':
          if (pendingEffect === null) {
            pendingEffect = { type: 'discard_choice', count: effect.value, sourceCard: deckCard.instanceId };
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
                    return !!d && 'Neutrality' === sourceSetKey;
                  })
                : peeked;
              pendingEffect = { type: 'look_top_take_type', cards: sameSetPeeked, filter: effect.filter, take: effect.take ?? 1 };
            }
          }
          break;

        case 'search_deck_by_type': {
          if (pendingEffect === null) {
            const matching = mutableDeck.drawPile.filter(card => {
              const d = CardRegistry.get(card.definitionId);
              if (!d) return false;
              if (sourceSetKey && 'Neutrality' !== sourceSetKey) return false;
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

        case 'search_deck_distinct_types': {
          if (pendingEffect === null) {
            const matching = mutableDeck.drawPile.filter(card => {
              const d = CardRegistry.get(card.definitionId);
              if (!d) return false;
              if (sourceSetKey && 'Neutrality' !== sourceSetKey) return false;
              return effect.filter.some(f =>
                f === 'Seraphim' ? d.type === 'Seraphim'
                : f === 'Cherubim' ? d.type === 'Cherubim'
                : f === 'Ophanim' ? d.type === 'Ophanim'
                : false
              );
            });
            const takePerType = Math.max(1, effect.takePerType ?? 1);
            const maxTake = effect.filter.length * takePerType;
            if (matching.length > 0) {
              pendingEffect = {
                type: 'search_deck',
                cards: matching,
                filter: effect.filter,
                take: Math.min(maxTake, matching.length),
                minTake: 0,
                distinctTypes: true,
              };
            }
          }
          break;
        }

        case 'salvage_by_type': {
          if (pendingEffect === null) {
            const matching = mutableDeck.discardPile.filter(card => {
              const d = CardRegistry.get(card.definitionId);
              if (!d) return false;
              if (sourceSetKey && 'Neutrality' !== sourceSetKey) return false;
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

        case 'salvage_by_id': {
          if (pendingEffect === null) {
            const matching = mutableDeck.discardPile.filter(card => card.definitionId === effect.targetId);
            pendingEffect = { type: 'salvage', cards: matching, filter: null, count: 1 };
          }
          break;
        }

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

    // Vigil Seraphim sentinel removed — Phase 1 rework; Thornwatch Seraphim now uses ophanim_bonus passive.

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

    if (countAsPlay && def.type === 'Ophanim') {
      mutableTurn.lastPlayedDefinitionId = deckCard.definitionId;
    }

    const hasUncappedNeutralityGains = hasNeutralityUncappedGainsInDeck(mutableDeck);
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
      case 'seraphim_played_this_turn':     return (turn.seraphimPlayedThisTurn ?? 0) > 0;
      case 'seraphim_not_played_this_turn': return (turn.seraphimPlayedThisTurn ?? 0) === 0;
      case 'cards_played_gte':  return turn.cardsPlayedThisTurn >= condition.value;
      case 'first_card_this_turn': return turn.cardsPlayedThisTurn === 0;
      case 'seraphim_active_gte':
        return board.frontSlots.filter(s => s?.type === 'Seraphim' && s.isActive).length >= condition.value;
      case 'cherubim_active_gte':
        return board.backSlots.filter(s => s !== null && s.type === 'Cherubim').length >= condition.value;
      default:
        return false;
    }
  }

  static checkPlayable(
    def: CardDefinition,
    handSize: number,
    _turn: TurnState,
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
          if (cond.type === 'seraphim_active_gte') {
            const activeSeraphim = board.frontSlots.filter(s => s?.type === 'Seraphim' && s.isActive).length;
            if (activeSeraphim < cond.value) return false;
          }
          if (cond.type === 'seraphim_on_board_gte') {
            const activeSeraphim = board.frontSlots.filter(s => s?.type === 'Seraphim').length;
            if (activeSeraphim < cond.value) return false;
          }
          if (cond.type === 'board_definition_gte') {
            if ((boardDefinitionCount[cond.definitionId] ?? 0) < cond.value) return false;
          }
        }
      }

      // Summoning must end with at least one free front slot. If summon materials
      // are consumed they can free slots; otherwise an already-full front row blocks summon.
      const frontHasEmptySlot = board.frontSlots.some(slot => slot === null);
      if (!frontHasEmptySlot) {
        if (angelDef.summonCost.length === 0) return false;
        const usedSlots = new Set<number>();
        for (const reqId of angelDef.summonCost) {
          const slotIdx = board.frontSlots.findIndex(
            (slot, idx) => slot?.definitionId === reqId && !usedSlots.has(idx),
          );
          if (slotIdx === -1) return false;
          usedSlots.add(slotIdx);
        }
        if (usedSlots.size === 0) return false;
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
    // Angels are enforced to never exist in the main-deck hand, so handSize
    // equals the non-Angel discardable count. Using 'deck' directly was a
    // dangling reference that caused a black-screen crash when phase → playing.
    const discardableHandSize = handSize;
    for (const effect of effects) {
      if (effect.type === 'discard_choice' && discardableHandSize - 1 < effect.value) return false;
      if (effect.type === 'discard_draw' && discardableHandSize - 1 < effect.discard) return false;
    }
    return true;
  }
}
