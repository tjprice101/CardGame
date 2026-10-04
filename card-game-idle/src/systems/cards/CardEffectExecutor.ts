import type { BoardState, DeckState, PendingEffect, TurnState } from '@/types/game';
import type { CardEffect, CardSubtypeFilter } from '@/types/effects';
import type { CardDefinition } from '@/types/cards';

import { CardRegistry } from '../../cards/CardRegistry';
import { canSatisfySummonRequirements, getSummonRequirements } from './AinSophSummonRequirements';
import { getUnmetCardRequirement } from './PlayRequirements';

import { getActiveCoopRng as _getActiveCoopRng } from '@/state/coopSyncStore';
import { TurnSystem } from './TurnSystem';
import { gainInferno, getInferno } from './IntensityRuntime';
import { getCardSetId } from '@/data/elements';

export interface ExecutionResult {
  deck: DeckState;
  turn: TurnState;
  board: BoardState;
  divineLightBonus: number;    // direct Divine Light bonus from card effects (beyond chain calc)
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
    frontSlots: board.frontSlots.map(s => s ? { ...s, attackCooldowns: { ...s.attackCooldowns } } : null) as BoardState['frontSlots'],
    backSlots: board.backSlots.map(s => s ? { ...s, attackCooldowns: { ...s.attackCooldowns } } : null) as BoardState['backSlots'],
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
      return { deck, turn, board, divineLightBonus: 0, pendingEffect: null, pendingEffects: [], canPlay: true };
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
      neutralityNextAttackDivineLightByInstance: turn.neutralityNextAttackDivineLightByInstance ? { ...turn.neutralityNextAttackDivineLightByInstance } : turn.neutralityNextAttackDivineLightByInstance,
    };
    let mutableBoard = cloneBoard(board);
    let divineLightBonus = 0;
    const pendingEffects: PendingEffect[] = [];

    const multiplier = 1;
    let pendingDiscards = 0;
    const availableToDiscard = () => mutableDeck.hand.filter(card => card.instanceId !== deckCard.instanceId).length - pendingDiscards;

    const isHighRarityMechanicCard = (_cardDef: CardDefinition | undefined): boolean => Boolean(_cardDef && (
      _cardDef.rarity === 'Eternal'
      || _cardDef.rarity === 'Infinite'
      || _cardDef.rarity === 'Transcendent'
    ));
    void isHighRarityMechanicCard;

    function processEffect(effect: CardEffect): boolean {
      switch (effect.type) {
        case 'neutrality_stack_resonance':
          divineLightBonus += Math.min(effect.cap, mutableTurn.limitlessLightStacks * effect.perStack);
          break;
        case 'neutrality_abyss_reclaim': {
          const abyss = mutableDeck.lightBoundAbyss ?? [];
          const recovered = abyss.filter(card => {
            const definition = CardRegistry.get(card.definitionId);
            return getCardSetId(card.definitionId) === 'Neutrality' && (definition?.type === 'Light' || definition?.type === 'Dark');
          }).slice(0, effect.count);
          const ids = new Set(recovered.map(card => card.instanceId));
          mutableDeck = { ...mutableDeck, hand: [...mutableDeck.hand, ...recovered], lightBoundAbyss: abyss.filter(card => !ids.has(card.instanceId)) };
          break;
        }
        case 'neutrality_charge_release': {
          let released = 0;
          for (const card of mutableBoard.backSlots) {
            if (!card || card.side !== 'soph' || getCardSetId(card.definitionId) !== 'Neutrality') continue;
            const amount = Math.min(card.limitlessCharge, effect.cap - released);
            card.limitlessCharge -= amount;
            released += amount;
          }
          mutableTurn.limitlessLightStacks += released;
          divineLightBonus += released * effect.divineLightPerCharge;
          break;
        }
        case 'neutrality_charge_grant':
          for (const card of mutableBoard.backSlots) {
            if (card?.side === 'soph' && getCardSetId(card.definitionId) === 'Neutrality') card.limitlessCharge += effect.value;
          }
          break;
        case 'neutrality_cooldown_reduction': {
          let accelerated = 0;
          for (const card of [...mutableBoard.backSlots, ...mutableBoard.frontSlots]) {
            if (!card || getCardSetId(card.definitionId) !== 'Neutrality') continue;
            let changed = false;
            for (const id of Object.keys(card.attackCooldowns)) {
              const before = card.attackCooldowns[id];
              card.attackCooldowns[id] = Math.max(0, before - effect.value);
              changed ||= card.attackCooldowns[id] < before;
            }
            if (changed) accelerated += 1;
          }
          mutableTurn.limitlessLightStacks += Math.min(effect.cap, accelerated * effect.stackPerCard);
          break;
        }
        case 'neutrality_equilibrium': {
          const supports = mutableBoard.backSlots.filter(card => card && getCardSetId(card.definitionId) === 'Neutrality');
          const pairs = Math.min(supports.filter(card => card?.type === 'Light').length, supports.filter(card => card?.type === 'Dark').length);
          mutableTurn.limitlessLightStacks += pairs * effect.stacksPerPair;
          divineLightBonus += pairs * effect.divineLightPerPair;
          break;
        }
        case 'inferno_gain':
          gainInferno(mutableTurn, effect.value);
          break;
        case 'inferno_board_kindle': {
          const cards = [...mutableBoard.backSlots, ...mutableBoard.frontSlots]
            .filter(card => card && (effect.side === 'any' || card.side === effect.side));
          gainInferno(mutableTurn, cards.length * effect.perCard);
          break;
        }
        case 'inferno_embers':
          mutableTurn.intensityBankedEmbers = (mutableTurn.intensityBankedEmbers ?? 0) + effect.value;
          break;
        case 'inferno_charge_forge': {
          let charged = 0;
          for (const card of mutableBoard.backSlots) {
            if (card?.side !== 'soph') continue;
            card.limitlessCharge += effect.charge;
            charged += 1;
          }
          gainInferno(mutableTurn, charged * effect.perCharged);
          break;
        }
        case 'inferno_ash_cycle': {
          const cards = mutableDeck.hand.filter(card => card.instanceId !== deckCard.instanceId).slice(0, effect.count);
          const ids = new Set(cards.map(card => card.instanceId));
          mutableDeck = {
            ...mutableDeck,
            hand: mutableDeck.hand.filter(card => !ids.has(card.instanceId)),
            drawPile: [...mutableDeck.drawPile, ...cards],
          };
          mutableDeck = TurnSystem.drawCards(mutableDeck, cards.length);
          gainInferno(mutableTurn, cards.length * effect.perCard);
          break;
        }
        case 'inferno_recall': {
          if (getInferno(mutableTurn) < effect.minInferno) break;
          const recalled = mutableDeck.discardPile.filter(card => {
            const definition = CardRegistry.get(card.definitionId);
            return card.definitionId.includes('intensity') && (definition?.type === 'Light' || definition?.type === 'Dark');
          }).slice(0, effect.count);
          const ids = new Set(recalled.map(card => card.instanceId));
          mutableDeck = {
            ...mutableDeck,
            hand: [...mutableDeck.hand, ...recalled],
            discardPile: mutableDeck.discardPile.filter(card => !ids.has(card.instanceId)),
          };
          gainInferno(mutableTurn, recalled.length * effect.perCard);
          break;
        }
        case 'inferno_threshold_draw':
          if (getInferno(mutableTurn) >= effect.threshold) mutableDeck = TurnSystem.drawCards(mutableDeck, effect.draw);
          else gainInferno(mutableTurn, effect.belowGain);
          break;
        case 'inferno_rekindle':
          gainInferno(mutableTurn, Math.max(effect.minimum, Math.floor((mutableTurn.intensityInfernoSpentThisTurn ?? 0) * effect.fraction)));
          break;
        case 'inferno_next_gain':
          gainInferno(mutableTurn, effect.kindle);
          mutableTurn.intensityNextGainMultiplier = Math.max(mutableTurn.intensityNextGainMultiplier ?? 1, effect.multiplier);
          break;
        case 'inferno_pressure':
          gainInferno(mutableTurn, Math.min(effect.cap, Math.floor((mutableTurn.intensityInfernoGainedThisTurn ?? 0) / effect.divisor) * effect.perStep));
          break;
        case 'inferno_temper':
          mutableTurn.intensityAttackBonus = (mutableTurn.intensityAttackBonus ?? 0)
            + Math.min(effect.cap, getInferno(mutableTurn) * effect.perStack);
          break;
        case 'inferno_balance': {
          const light = mutableBoard.backSlots.filter(card => card?.type === 'Light').length;
          const dark = mutableBoard.backSlots.filter(card => card?.type === 'Dark').length;
          gainInferno(mutableTurn, Math.min(light, dark) * effect.perPair + Math.abs(light - dark) * effect.unmatchedGain);
          break;
        }
        case 'inferno_eruption':
          if (getInferno(mutableTurn) >= effect.threshold) divineLightBonus += effect.divineLight;
          gainInferno(mutableTurn, effect.kindle);
          break;
        case 'inferno_memory': {
          const ids = new Set(mutableDeck.discardPile.filter(card => card.definitionId.includes('intensity')).map(card => card.definitionId));
          gainInferno(mutableTurn, Math.min(effect.cap, ids.size * effect.perDistinct));
          break;
        }
        // �E�E�E��E�E�E��E�E�E��E�E�E� Oblivion effects �E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E��E�E�E�
        case 'divine_light_flat': {
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
          // (pyro_heat_* / conditional / draw / divine_light_flat) in source definitions.
          // Light sentinel cards removed — Phase 1 rework.
          divineLightBonus += val;
          break;
        }

        case 'cosmos_flat':
          mutableTurn.limitlessCosmosStacks = (mutableTurn.limitlessCosmosStacks ?? 0) + Math.max(0, effect.value);
          break;

        case 'convert_light_to_cosmos':
          if (mutableTurn.limitlessLightStacks < effect.lightCost) return false;
          mutableTurn.limitlessLightStacks -= effect.lightCost;
          mutableTurn.limitlessCosmosStacks = (mutableTurn.limitlessCosmosStacks ?? 0) + Math.max(0, effect.cosmosGain);
          break;

        case 'consume_cosmos':
          if ((mutableTurn.limitlessCosmosStacks ?? 0) < effect.value) return false;
          mutableTurn.limitlessCosmosStacks = (mutableTurn.limitlessCosmosStacks ?? 0) - effect.value;
          break;

        case 'light_stacks_flat':
          mutableTurn.limitlessLightStacks = (mutableTurn.limitlessLightStacks ?? 0) + Math.max(0, effect.value);
          break;

        // --- Making my my own effects! Yay!! ---
        case 'consume_limitless_light_stacks':
          if (mutableTurn.limitlessLightStacks < effect.value) {
            return false;
          }
          mutableTurn.limitlessLightStacks -= effect.value;
          break;

        case 'conditional': {
          const met = CardEffectExecutor.evaluateCondition(
            effect.condition,
            mutableTurn,
            mutableBoard,
          );

          const branch = met ? effect.then : effect.else ?? [];
          for (const subEffect of branch) {
            if (!processEffect(subEffect)) {
              return false;
            }
          }

          break;
        }

        // ──────── Legacy score/power effects (Light compat → map to Oblivion) ────────
        case 'score_flat':
          divineLightBonus += effect.value * multiplier;
          break;

        case 'score_multiplier':
          // Add N% of this turn's accumulated Divine Light as a flat bonus on this play.
          divineLightBonus += Math.round(mutableTurn.divineLightEarnedThisTurn * effect.value * multiplier / 100);
          break;

        case 'draw': {
          const count = effect.value;
          mutableDeck = TurnSystem.drawCards(mutableDeck, count);
          break;
        }

        case 'draw_with_type_bonus': {
          const beforeHand = new Set(mutableDeck.hand.map(card => card.instanceId));
          mutableDeck = TurnSystem.drawCards(mutableDeck, effect.value);
          const drawn = mutableDeck.hand.filter(card => !beforeHand.has(card.instanceId));
          const matched = drawn.some(card => effect.filter.includes(CardRegistry.get(card.definitionId)?.type as CardSubtypeFilter));
          if (matched) mutableDeck = TurnSystem.drawCards(mutableDeck, effect.bonusDraw);
          break;
        }

        case 'draw_with_type_bonuses': {
          const beforeHand = new Set(mutableDeck.hand.map(card => card.instanceId));
          mutableDeck = TurnSystem.drawCards(mutableDeck, effect.value);
          const drawn = mutableDeck.hand.filter(card => !beforeHand.has(card.instanceId));
          const countType = (type: CardSubtypeFilter) => drawn.filter(card => CardRegistry.get(card.definitionId)?.type === type).length;
          if (countType(effect.drawFilter) >= effect.drawThreshold) mutableDeck = TurnSystem.drawCards(mutableDeck, effect.bonusDraw);
          if (countType(effect.gainFilter) >= effect.gainThreshold) divineLightBonus += effect.gainDivineLight;
          break;
        }

        case 'exchange_deck_ends': {
          if (mutableDeck.drawPile.length > 1) {
            pendingEffects.push({
              type: 'exchange_deck_ends',
              topCard: mutableDeck.drawPile[0],
              bottomCard: mutableDeck.drawPile[mutableDeck.drawPile.length - 1],
            });
          }
          break;
        }

        case 'discard_choice':
          if (availableToDiscard() < effect.value) return false;
          pendingDiscards += effect.value;
          pendingEffects.push({ type: 'discard_choice', count: effect.value, sourceCard: deckCard.instanceId });
          break;

        case 'discard_draw':
          if (availableToDiscard() < effect.discard) return false;
          pendingDiscards += effect.discard;
          pendingEffects.push({
            type: 'discard_choice',
            count: effect.discard,
            sourceCard: `${deckCard.instanceId}:draw:${effect.draw}`,
          });
          break;

        case 'exchange_hand_for_opposite': {
          const handCards = mutableDeck.hand.filter(card => {
            const definition = CardRegistry.get(card.definitionId);
            return definition?.type === 'Light' || definition?.type === 'Dark';
          });
          const deckCards = mutableDeck.drawPile.filter(card => {
            const definition = CardRegistry.get(card.definitionId);
            return definition?.type === 'Light' || definition?.type === 'Dark';
          });
          if (handCards.length > 0 && deckCards.length > 0) {
            pendingEffects.push({ type: 'opposite_exchange', handCards, deckCards });
          }
          break;
        }

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
          if (matching.length > 0) {
            pendingEffects.push({
              type: 'salvage',
              cards: matching,
              filter: effect.filter,
              count: Math.min(effect.count, matching.length),
            });
          }
          break;
        }

        case 'salvage_either_light_or_dark': {
          const lightCards = mutableDeck.discardPile.filter(card => CardRegistry.get(card.definitionId)?.type === 'Light');
          const darkCards = mutableDeck.discardPile.filter(card => CardRegistry.get(card.definitionId)?.type === 'Dark');
          const chosenType: CardSubtypeFilter | null = lightCards.length >= effect.count ? 'Light' : darkCards.length >= effect.count ? 'Dark' : null;
          if (!chosenType) break;
          const chosenCards = (chosenType === 'Light' ? lightCards : darkCards).slice(0, effect.count);
          mutableDeck.discardPile = mutableDeck.discardPile.filter(card => !chosenCards.some(chosen => chosen.instanceId === card.instanceId));
          mutableDeck.hand.push(...chosenCards);
          if (chosenType === 'Light') {
            mutableTurn.limitlessLightStacks = (mutableTurn.limitlessLightStacks ?? 0) + effect.lightStacks;
          } else {
            const matching = mutableDeck.drawPile.filter(card => {
              const type = CardRegistry.get(card.definitionId)?.type;
              return type === 'Light' || type === 'Dark';
            });
            if (matching.length > 0) {
              const found = matching[0];
              mutableDeck.drawPile = mutableDeck.drawPile.filter(card => card.instanceId !== found.instanceId);
              mutableDeck.hand.push(found);
            }
          }
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
        return { deck, turn, board, divineLightBonus: 0, pendingEffect: null, pendingEffects: [], canPlay: false };
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
      divineLightBonus,
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
      case 'light_stacks_gte': return (turn.limitlessLightStacks ?? 0) >= condition.value;
      case 'cosmos_gte': return (turn.limitlessCosmosStacks ?? 0) >= condition.value;
      default:
        return false;
    }
  }

  static checkPlayable(
    def: CardDefinition,
    _handSize: number,
    turn: TurnState,
    board?: BoardState,
    deck?: Pick<DeckState, 'hand' | 'drawPile' | 'discardPile'>,
    sourceInstanceId?: string,
  ): boolean {
    if (deck && getUnmetCardRequirement(def, turn, deck, sourceInstanceId)) return false;
    if (def.type === 'AinSophAur') {
      if (!board) return true;
      const materials = board.backSlots.filter((slot): slot is NonNullable<typeof slot> => slot !== null);
      return canSatisfySummonRequirements(
        materials,
        getSummonRequirements(def.summonMaterials, def.summonMaterialCount),
      ) && board.frontSlots.some(slot => slot === null);
    }

    if (!board) return true;
    return board.backSlots.findIndex(sl => sl === null) !== -1;
  }
}
