import type { LightAttackDefinition } from '@/types/cards';
import type { TurnState } from '@/types/game';

export const getInferno = (turn: TurnState): number => Math.max(0, turn.limitlessInfernoStacks ?? 0);
export const usesInferno = (attack: LightAttackDefinition): boolean => attack.stackResource === 'inferno';
export const getSophAttackPool = (attack: LightAttackDefinition, turn: TurnState): number =>
  usesInferno(attack) ? getInferno(turn) : turn.limitlessLightStacks;

export function gainInferno(turn: TurnState, amount: number): number {
  if (!Number.isFinite(amount)) {
    console.warn('[Intensity] Rejected nonfinite Inferno gain:', amount);
    return 0;
  }
  const base = Math.max(0, Math.floor(amount));
  if (base === 0) return 0;
  const multiplier = Math.max(1, turn.intensityNextGainMultiplier ?? 1);
  const gained = base * multiplier;
  turn.intensityNextGainMultiplier = 1;
  turn.limitlessInfernoStacks = getInferno(turn) + gained;
  turn.intensityInfernoGainedThisTurn = (turn.intensityInfernoGainedThisTurn ?? 0) + gained;
  return gained;
}

export function resetInferno(turn: TurnState): void {
  turn.limitlessInfernoStacks = 0;
  turn.intensityInfernoGainedThisTurn = 0;
  turn.intensityInfernoSpentThisTurn = 0;
  turn.intensityNextGainMultiplier = 1;
  turn.intensityBankedEmbers = 0;
  turn.intensityAttackBonus = 0;
}
