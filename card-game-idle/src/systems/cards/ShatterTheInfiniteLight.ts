import type { BoardState, ProgressState, TurnState } from '@/types/game';
import { CardRegistry } from '@/cards/CardRegistry';
import { computeGlobalResonanceScore } from '@/systems/progression/cardMastery';
import { getAttackBasePayout } from './AttackPayout';
import { usesInferno } from './IntensityRuntime';

/** Fade-to-black priming beat before the click window opens. */
export const SHATTER_PRIME_MS = 1100;
/** Length of the glowing-star click window. */
export const SHATTER_ACTIVE_MS = 10000;
/** Fade-to-white + "Shattered!!" payout beat before the board returns to normal. */
export const SHATTER_RESULT_MS = 2600;

export function getShatterBasePayout(board: BoardState, turn: TurnState, progress: ProgressState): number {
  const context = {
    limitlessLightStacks: turn.limitlessLightStacks,
    asaFrontCount: board.frontSlots.filter(card => card?.type === 'AinSophAur').length,
    collectionPower: computeGlobalResonanceScore(progress),
  };
  let total = 0;
  for (const slot of board.backSlots) {
    const card = slot && CardRegistry.get(slot.definitionId);
    if (card?.type === 'Light') {
      total += getAttackBasePayout(card.sophAttack, context, usesInferno(card.sophAttack) ? turn.intensityAttackBonus ?? 0 : 0);
    }
  }
  for (const slot of board.frontSlots) {
    const card = slot && CardRegistry.get(slot.definitionId);
    if (card?.type === 'AinSophAur' && card.bridgeAttack) {
      total += getAttackBasePayout(card.bridgeAttack, context);
    }
  }
  return total;
}

export function getShatterOrbitMultiplier(orbitPower = 0): number {
  return 1 + Math.max(0, orbitPower);
}

/**
 * "Shatter the Infinite Light" only appears once the front row is entirely
 * filled with Ain Soph Aur cards and the back row is entirely filled with
 * Light/Dark cards that have already been flipped to their active Ain side.
 */
export function canActivateShatterTheInfiniteLight(board: BoardState): boolean {
  const frontFull = board.frontSlots.every(slot => slot !== null);
  const backFullAinActive = board.backSlots.every(slot => (
    !!slot
    && (slot.type === 'Light' || slot.type === 'Dark')
    && slot.side === 'ain'
    && slot.faceState === 'front'
  ));
  return frontFull && backFullAinActive;
}
