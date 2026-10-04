import type { AinSophAurDefinition, LightAttackDefinition } from '@/types/cards';
import { resolveCardScaling, type CardScalingContext } from './CardScaling';

export function getAttackBasePayout(
  attack: LightAttackDefinition | NonNullable<AinSophAurDefinition['bridgeAttack']>,
  context: CardScalingContext,
  bonus = 0,
): number {
  return Math.max(0, Math.round(attack.baseDivineLight + resolveCardScaling(attack.scaling, context) + bonus));
}
