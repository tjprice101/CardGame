import type { BoardState, DeckState, PendingEffect, TurnState } from '@/types/game';
import type { CardEffect } from '@/types/effects';
import type { CardDefinition } from '@/types/cards';

import { CardRegistry } from '../../cards/CardRegistry';

import { getActiveCoopRng as _getActiveCoopRng } from '@/state/coopSyncStore';
import { TurnSystem } from './TurnSystem';

export interface ExecutionResult {
  deck: DeckState;
  turn: TurnState;
  board: BoardState;
  oblivionBonus: number;    // direct Oblivion bonus from card effects (beyond chain calc)
  pendingEffect: PendingEffect | null;
  pendingEffects: PendingEffect[];
  canPlay: boolean;         // false if radiance_spend failed
}

interface ExecuteOptions {
  effects?: CardEffect[];
  countAsPlay?: boolean;
  removeFromHand?: boolean;
  /** When true, nested forge_recast_* / nacre / ouroboric / unrecorded hue auto-recasts are skipped. */
  suppressForgeRecursion?: boolean;
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
      return { deck, turn, board, oblivionBonus: 0, pendingEffect: null, pendingEffects: [], canPlay: true };
    }

    // Every live call site (Light/Dark/AinSophAur) passes options.effects explicitly;
    // Seraphim/Angel/Cherubim/Ophanim definitions are never registered anymore.
    const effects: CardEffect[] = options.effects ?? [];
    const countAsPlay = options.countAsPlay ?? true;
    const removeFromHand = options.removeFromHand ?? (deckCard.instanceId !== 'echo' && !isSeraphim);
    const suppressForgeRecursion = options.suppressForgeRecursion ?? false;
    void suppressForgeRecursion;
    let mutableDeck = { ...deck, hand: [...deck.hand] };
    // Shallow-copy nested Record objects so mutations in this executor never
    // bleed back into the original turn (important when called from React renders
    // with live Zustand state rather than from within an Immer set() draft).
    let mutableTurn: TurnState = {
      ...turn,
      neutralityNextAttackOblivionByInstance: turn.neutralityNextAttackOblivionByInstance ? { ...turn.neutralityNextAttackOblivionByInstance } : turn.neutralityNextAttackOblivionByInstance,
    };
    let mutableBoard = cloneBoard(board);
    let oblivionBonus = 0;
    const pendingEffects: PendingEffect[] = [];

    const multiplier = 1;

    const isHighRarityMechanicCard = (_cardDef: CardDefinition | undefined): boolean => Boolean(_cardDef && (
      _cardDef.rarity === 'Eternal'
      || _cardDef.rarity === 'Infinite'
      || _cardDef.rarity === 'Transcendent'
    ));
    void isHighRarityMechanicCard;

    function processEffect(effect: CardEffect): boolean {
      switch (effect.type) {
        // �E�E�E��E�E�E��E�E�E��E�E�E� Oblivion effects �E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E�
        case 'oblivion_flat': {
          let val = effect.value * multiplier;
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
          oblivionBonus += val;
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

        case 'draw': {
          const count = effect.value;
          mutableDeck = TurnSystem.drawCards(mutableDeck, count);
          break;
        }

        case 'discard_choice':
          pendingEffects.push({ type: 'discard_choice', count: effect.value, sourceCard: deckCard.instanceId });
          break;

        case 'discard_draw':
          pendingEffects.push({
            type: 'discard_choice',
            count: effect.discard,
            sourceCard: `${deckCard.instanceId}:draw:${effect.draw}`,
          });
          break;

        case 'shuffle_discard':
          mutableDeck = TurnSystem.shuffleDiscard(mutableDeck);
          break;

        case 'look_top_take':
          {
            const peeked = TurnSystem.peekTop(mutableDeck, effect.look);
            if (peeked.length > 0) {
              pendingEffects.push({ type: 'look_top_take', cards: peeked, take: effect.take });
            }
          }
          break;

        case 'look_top_take_drop':
          {
            const peeked = TurnSystem.peekTop(mutableDeck, effect.look);
            if (peeked.length > 0) {
              pendingEffects.push({ type: 'look_top_take_drop', cards: peeked, take: effect.take, drop: effect.drop });
            }
          }
          break;

        case 'look_top_take_type':
          {
            const peeked = TurnSystem.peekTop(mutableDeck, effect.look);
            if (peeked.length > 0) {
              const matching = peeked.filter(card => {
                const definition = CardRegistry.get(card.definitionId);
                return !!definition && effect.filter.includes(definition.type);
              });
              pendingEffects.push({
                type: 'look_top_take_type',
                cards: matching,
                lookedCards: peeked,
                filter: effect.filter,
                take: effect.take ?? 1,
              });
            }
          }
          break;
        case 'salvage_by_type_count': {
          const matching = mutableDeck.discardPile.filter(card => {
            const definition = CardRegistry.get(card.definitionId);
            return !!definition && effect.filter.includes(definition.type);
          });
          if (matching.length === 0) return false;
          pendingEffects.push({
            type: 'salvage',
            cards: matching,
            filter: effect.filter,
            count: Math.min(effect.count, matching.length),
          });
          break;
        }

        case 'search_deck_by_type': {
          const matching = mutableDeck.drawPile.filter(card => {
            const d = CardRegistry.get(card.definitionId);
            if (!d) return false;
            return effect.filter.some(f => f === d.type);
          });
          if (matching.length > 0) {
            pendingEffects.push({ type: 'search_deck', cards: matching, filter: effect.filter, take: 1 });
          }
          break;
        }

        case 'search_deck_distinct_types': {
          const matching = mutableDeck.drawPile.filter(card => {
            const d = CardRegistry.get(card.definitionId);
            if (!d) return false;
            return effect.filter.some(f => f === d.type);
          });
          const takePerType = Math.max(1, effect.takePerType ?? 1);
          const maxTake = effect.filter.length * takePerType;
          if (matching.length > 0) {
            pendingEffects.push({
              type: 'search_deck',
              cards: matching,
              filter: effect.filter,
              take: Math.min(maxTake, matching.length),
              minTake: 0,
              distinctTypes: true,
            });
          }
          break;
        }

        case 'salvage_by_type': {
          const matching = mutableDeck.discardPile.filter(card => {
            const d = CardRegistry.get(card.definitionId);
            if (!d) return false;
            return effect.filter.some(f => f === d.type);
          });
          if (matching.length === 0) return false;
          pendingEffects.push({
            type: 'salvage',
            cards: matching,
            filter: effect.filter,
            count: effect.filter.length > 1 ? effect.filter.length : 1,
          });
          break;
        }

        case 'salvage_any':
          if (mutableDeck.discardPile.length > 0) {
            pendingEffects.push({ type: 'salvage', cards: [...mutableDeck.discardPile], filter: null, count: 1 });
          }
          break;

        case 'salvage_by_id': {
          const matching = mutableDeck.discardPile.filter(card => card.definitionId === effect.targetId);
          if (matching.length > 0) {
            pendingEffects.push({ type: 'salvage', cards: matching, filter: null, count: 1 });
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
        default: {
          const unsupportedEffect: never = effect;
          return unsupportedEffect;
        }
      }
      return true;
    }

    for (const effect of effects) {
      const ok = processEffect(effect);
      if (!ok) {
        return { deck, turn, board, oblivionBonus: 0, pendingEffect: null, pendingEffects: [], canPlay: false };
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

    return {
      deck: mutableDeck,
      turn: mutableTurn,
      board: mutableBoard,
      oblivionBonus,
      pendingEffect: pendingEffects[0] ?? null,
      pendingEffects,
      canPlay: true,
    };
  }

  static evaluateCondition(
    condition: import('@/types/effects').EffectCondition,
    turn: TurnState,
    _board: BoardState
  ): boolean {
    switch (condition.type) {
      case 'cards_played_gte':  return turn.cardsPlayedThisTurn >= condition.value;
      case 'first_card_this_turn': return turn.cardsPlayedThisTurn === 0;
      default:
        return false;
    }
  }

  static checkPlayable(
    def: CardDefinition,
    _handSize: number,
    _turn: TurnState,
    board?: BoardState,
  ): boolean {
    if (def.type === 'AinSophAur') {
      if (!board) return true;
      const summonCost = def.summonCost;
      const costCount: Record<string, number> = {};
      for (const id of summonCost) costCount[id] = (costCount[id] ?? 0) + 1;
      const boardCount: Record<string, number> = {};
      for (const slot of board.backSlots) {
        if (slot) boardCount[slot.definitionId] = (boardCount[slot.definitionId] ?? 0) + 1;
      }
      for (const [id, needed] of Object.entries(costCount)) {
        if ((boardCount[id] ?? 0) < needed) return false;
      }

      return board.frontSlots.some(slot => slot === null);
    }

    if (!board) return true;
    return board.backSlots.findIndex(sl => sl === null) !== -1;
  }
}
