import type { CardDefinition } from '@/types/cards';
import type { CardEffect, CardSubtypeFilter, EffectCondition } from '@/types/effects';
import type { DeckState, TurnState } from '@/types/game';
import { CardRegistry } from '@/cards/CardRegistry';
import { formatSpectrumRequirement, getCardSpectrumLevel, getTurnSpectrumLevel } from './SpectrumLevel';

interface RequirementState {
  hand: number;
  drawPile: Array<CardSubtypeFilter | null>;
  discard: Array<CardSubtypeFilter | null>;
  lightStacks: number;
  cosmos: number;
  cardsPlayed: number;
}

const typeOf = (definitionId: string): CardSubtypeFilter | null => {
  const type = CardRegistry.get(definitionId)?.type;
  return type === 'Light' || type === 'Dark' || type === 'AinSophAur' ? type : null;
};

/** Effects that resolve when this card is played/activated/summoned. */
export function getCardRequirementEffects(def: CardDefinition): CardEffect[] {
  if (def.type === 'Light') return def.sophPlacementEffects ?? [];
  if (def.type === 'Dark') return def.sophEffects ?? [];
  if (def.type === 'AinSophAur') return def.onSummonEffects ?? [];
  return [];
}

function conditionMet(condition: EffectCondition, state: RequirementState): boolean {
  switch (condition.type) {
    case 'cards_played_gte': return state.cardsPlayed >= condition.value;
    case 'first_card_this_turn': return state.cardsPlayed === 0;
    case 'light_stacks_gte': return state.lightStacks >= condition.value;
    case 'cosmos_gte': return state.cosmos >= condition.value;
    default: return false;
  }
}

function takeFromDraw(state: RequirementState, count: number): void {
  const taken = Math.min(Math.max(0, count), state.drawPile.length);
  state.drawPile = state.drawPile.slice(taken);
  state.hand += taken;
}

function takeMatchingFromDiscard(state: RequirementState, filter: CardSubtypeFilter[] | null, count: number): number {
  let taken = 0;
  state.discard = state.discard.filter(type => {
    if (taken >= count) return true;
    if (filter && (!type || !filter.includes(type))) return true;
    taken += 1;
    return false;
  });
  state.hand += taken;
  return taken;
}

/** Walks effects in order, returning the first requirement that cannot be satisfied (or null). */
function walk(effects: CardEffect[], state: RequirementState): string | null {
  for (const effect of effects) {
    switch (effect.type) {
      case 'draw':
      case 'draw_with_type_bonus':
      case 'draw_with_type_bonuses':
        takeFromDraw(state, effect.value);
        break;
      case 'discard_choice':
        if (state.hand < effect.value) return `Requires ${effect.value} other card${effect.value === 1 ? '' : 's'} in hand to discard`;
        state.hand -= effect.value;
        state.discard.push(...Array(effect.value).fill(null));
        break;
      case 'discard_draw':
        if (state.hand < effect.discard) return `Requires ${effect.discard} other card${effect.discard === 1 ? '' : 's'} in hand to discard`;
        state.hand -= effect.discard;
        state.discard.push(...Array(effect.discard).fill(null));
        takeFromDraw(state, effect.draw);
        break;
      case 'convert_light_to_cosmos':
        if (state.lightStacks < effect.lightCost) return `Requires ${effect.lightCost} Limitless Light Stacks`;
        state.lightStacks -= effect.lightCost;
        state.cosmos += Math.max(0, effect.cosmosGain);
        break;
      case 'consume_cosmos':
        if (state.cosmos < effect.value) return `Requires ${effect.value} Limitless Cosmos`;
        state.cosmos -= effect.value;
        break;
      case 'light_stacks_flat':
        state.lightStacks += Math.max(0, effect.value);
        break;
      case 'cosmos_flat':
        state.cosmos += Math.max(0, effect.value);
        break;
      case 'shuffle_discard':
        state.drawPile = [...state.drawPile, ...state.discard];
        state.discard = [];
        break;
      case 'look_top_take':
      case 'look_top_take_drop':
        takeFromDraw(state, Math.min(effect.look, effect.take));
        break;
      case 'look_top_take_type': {
        const matches = state.drawPile.slice(0, effect.look).filter(type => type && effect.filter.includes(type)).length;
        state.hand += Math.min(matches, effect.take ?? 1);
        break;
      }
      case 'search_deck_by_type':
        if (state.drawPile.some(type => type && effect.filter.includes(type))) state.hand += 1;
        break;
      case 'search_deck_distinct_types': {
        const perType = Math.max(1, effect.takePerType ?? 1);
        for (const filterType of effect.filter) {
          state.hand += Math.min(perType, state.drawPile.filter(type => type === filterType).length);
        }
        break;
      }
      case 'salvage_by_type':
        if (takeMatchingFromDiscard(state, effect.filter, Math.max(1, effect.filter.length)) === 0) {
          return `Requires a ${effect.filter.join(' or ')} card in your discard pile`;
        }
        break;
      case 'salvage_by_type_count':
        takeMatchingFromDiscard(state, effect.filter, effect.count);
        break;
      case 'salvage_either_light_or_dark': {
        const lights = state.discard.filter(type => type === 'Light').length;
        const darks = state.discard.filter(type => type === 'Dark').length;
        if (lights >= effect.count) takeMatchingFromDiscard(state, ['Light'], effect.count);
        else if (darks >= effect.count) takeMatchingFromDiscard(state, ['Dark'], effect.count);
        break;
      }
      case 'salvage_any':
        takeMatchingFromDiscard(state, null, 1);
        break;
      case 'conditional':
        if (conditionMet(effect.condition, state)) {
          const failure = walk(effect.then, state);
          if (failure) return failure;
        }
        break;
      default:
        break;
    }
  }
  return null;
}

/**
 * Returns why a card's play/activation requirements cannot currently be met,
 * or null when it can be played. `sourceInstanceId` is excluded from the hand.
 * `levelAllowance` lets free summons reach above the current Spectrum Level.
 */
export function getUnmetCardRequirement(
  def: CardDefinition,
  turn: Pick<TurnState, 'limitlessLightStacks' | 'limitlessCosmosStacks' | 'cardsPlayedThisTurn' | 'spectrumLevel'>,
  deck: Pick<DeckState, 'hand' | 'drawPile' | 'discardPile'>,
  sourceInstanceId?: string,
  levelAllowance = 0,
): string | null {
  const requiredLevel = getCardSpectrumLevel(def);
  if (requiredLevel > getTurnSpectrumLevel(turn) + levelAllowance) return formatSpectrumRequirement(requiredLevel);
  const effects = getCardRequirementEffects(def);
  if (effects.length === 0) return null;
  return walk(effects, {
    hand: deck.hand.filter(card => card.instanceId !== sourceInstanceId).length,
    drawPile: deck.drawPile.map(card => typeOf(card.definitionId)),
    discard: deck.discardPile.map(card => typeOf(card.definitionId)),
    lightStacks: turn.limitlessLightStacks ?? 0,
    cosmos: turn.limitlessCosmosStacks ?? 0,
    cardsPlayed: turn.cardsPlayedThisTurn ?? 0,
  });
}
