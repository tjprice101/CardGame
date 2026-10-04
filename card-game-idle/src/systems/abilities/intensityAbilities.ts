import { ABILITY_REGISTRY } from '@/data/abilities/abilityDefinitions';
import { CardRegistry } from '@/cards/CardRegistry';
import { gainInferno } from '@/systems/cards/IntensityRuntime';
import type { BoardState, DeckState, TurnState } from '@/types/game';
import type { DeckCardInstance } from '@/types/cards';

export interface IntensityAbilityState {
  turn: TurnState;
  board: BoardState;
  deck: DeckState;
}

export type IntensityAbilityResult =
  | { success: true; baseDivineLight: number }
  | { success: false; reason: 'unknown-ability' | 'busy' | 'cooldown' | 'insufficient-stacks' | 'no-target' | 'already-reserved' };

export function isIntensityAbility(abilityId: string): boolean {
  return ABILITY_REGISTRY.get(abilityId)?.setId === 'Intensity';
}

export { gainInferno as gainIntensityInferno } from '@/systems/cards/IntensityRuntime';

function spendInferno(turn: TurnState, amount: number): void {
  turn.limitlessInfernoStacks = (turn.limitlessInfernoStacks ?? 0) - amount;
  turn.intensityInfernoSpentThisTurn = (turn.intensityInfernoSpentThisTurn ?? 0) + amount;
}

const isIntensityMainCard = (id: string): boolean =>
  id.includes('-intensity-') && ['Light', 'Dark'].includes(CardRegistry.get(id)?.type ?? '');

/**
 * Mutates only on success and stamps its own cooldown. Ownership/loadout gates belong
 * to the caller. Route returned baseDivineLight through the normal grant pipeline.
 */
export function activateIntensityAbility(
  state: IntensityAbilityState,
  abilityId: string,
  now = Date.now(),
): IntensityAbilityResult {
  return resolveIntensityAbility(state, abilityId, now, false);
}

export function getIntensityAbilityReadiness(
  state: IntensityAbilityState,
  abilityId: string,
  now = Date.now(),
): IntensityAbilityResult {
  return resolveIntensityAbility(state, abilityId, now, true);
}

function resolveIntensityAbility(
  state: IntensityAbilityState,
  abilityId: string,
  now: number,
  checkOnly: boolean,
): IntensityAbilityResult {
  const ability = ABILITY_REGISTRY.get(abilityId);
  if (!ability || ability.setId !== 'Intensity') return { success: false, reason: 'unknown-ability' };
  const { turn, board, deck } = state;
  if (turn.phase !== 'playing' || turn.pendingEffect || turn.attackSequence || turn.shatterInfiniteLight) {
    return { success: false, reason: 'busy' };
  }
  if ((turn.abilityCooldownUntil?.[abilityId] ?? 0) > now) return { success: false, reason: 'cooldown' };
  const inferno = turn.limitlessInfernoStacks ?? 0;
  if (inferno < (ability.infernoCost ?? 0) || turn.limitlessLightStacks < (ability.stackCost ?? 0)) {
    return { success: false, reason: 'insufficient-stacks' };
  }
  const intensityCards = [...board.backSlots, ...board.frontSlots]
    .filter((card): card is DeckCardInstance => card !== null && card.definitionId.includes('-intensity-'));
  const acceleratedCards = intensityCards.filter(card => Object.values(card.attackCooldowns).some(value => value > 0));
  const recallIndices = deck.discardPile
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => isIntensityMainCard(card.definitionId))
    .map(({ index }) => index).reverse().slice(0, 2);
  if ((abilityId === 'intensity-temper-the-hand' && deck.drawPile.length === 0)
    || (abilityId === 'intensity-cinder-recall' && recallIndices.length === 0)
    || (abilityId === 'intensity-white-hot-reprieve' && acceleratedCards.length === 0)) {
    return { success: false, reason: 'no-target' };
  }
  if (abilityId === 'intensity-unquenched-reserve' && (turn.intensityNextGainMultiplier ?? 1) > 1) {
    return { success: false, reason: 'already-reserved' };
  }
  if (checkOnly) return { success: true, baseDivineLight: 0 };

  turn.limitlessLightStacks -= ability.stackCost ?? 0;
  if (ability.infernoCost) spendInferno(turn, ability.consumesAllInferno ? inferno : ability.infernoCost);
  let baseDivineLight = 0;
  switch (abilityId) {
    case 'intensity-kindle-the-depths':
      gainInferno(turn, 4);
      break;
    case 'intensity-bank-the-flame':
      turn.limitlessLightStacks += 12;
      break;
    case 'intensity-temper-the-hand':
      deck.hand.push(...deck.drawPile.splice(0, 2));
      break;
    case 'intensity-cinder-recall':
      for (const index of recallIndices) deck.hand.push(...deck.discardPile.splice(index, 1));
      break;
    case 'intensity-white-hot-reprieve':
      for (const card of acceleratedCards) {
        for (const id of Object.keys(card.attackCooldowns)) {
          card.attackCooldowns[id] = Math.max(0, card.attackCooldowns[id] - 2);
        }
      }
      gainInferno(turn, Math.min(4, acceleratedCards.length));
      break;
    case 'intensity-unquenched-reserve':
      turn.intensityNextGainMultiplier = 2;
      break;
    case 'intensity-crucible-without-end':
      baseDivineLight = inferno * 500;
      for (const card of board.backSlots) {
        if (card?.definitionId.includes('-intensity-') && card.side === 'soph' && card.faceState === 'back') {
          card.limitlessCharge += Math.min(5, Math.floor(inferno / 10));
        }
      }
      break;
  }
  turn.abilityCooldownUntil ??= {};
  turn.abilityCooldownUntil[abilityId] = now + (ability.cooldownSeconds ?? 0) * 1000;
  return { success: true, baseDivineLight };
}
