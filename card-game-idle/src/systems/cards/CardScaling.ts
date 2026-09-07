import type { CardScalingExpr } from '@/types/cards';

export interface CardScalingContext {
  limitlessLightStacks: number;
  asaFrontCount: number;
  collectionPower: number;
}

type CustomScalingFunction = (context: CardScalingContext) => number;

/**
 * Reference values at which each triune sub-scalar contributes a full share.
 * Chosen so all three carry equal weight at a strong-but-reachable board state.
 */
export const TRIUNE_STACK_REFERENCE = 25;
export const TRIUNE_ASA_REFERENCE = 4;
export const TRIUNE_COLLECTION_REFERENCE = 1000;

export function resolveTriuneShares(context: CardScalingContext): {
  stackShare: number;
  asaShare: number;
  collectionShare: number;
} {
  return {
    stackShare: Math.max(0, context.limitlessLightStacks) / TRIUNE_STACK_REFERENCE,
    asaShare: Math.max(0, context.asaFrontCount) / TRIUNE_ASA_REFERENCE,
    collectionShare: Math.max(0, context.collectionPower) / TRIUNE_COLLECTION_REFERENCE,
  };
}

const customScalingFunctions = new Map<string, CustomScalingFunction>();

export function registerCardScalingFunction(fnId: string, fn: CustomScalingFunction): void {
  customScalingFunctions.set(fnId, fn);
}

export function resolveCardScaling(expression: CardScalingExpr, context: CardScalingContext): number {
  switch (expression.kind) {
    case 'constant':
      return expression.value;
    case 'linear':
      return (context[expression.reads] * expression.multiplier) + (expression.offset ?? 0);
    case 'stepped':
      return (Math.floor(context[expression.reads] / expression.step) * expression.amount) + (expression.offset ?? 0);
    case 'triune': {
      const { stackShare, asaShare, collectionShare } = resolveTriuneShares(context);
      return expression.amount * (stackShare + asaShare + collectionShare);
    }
    case 'custom': {
      const fn = customScalingFunctions.get(expression.fnId);
      if (!fn) {
        throw new Error(`Unknown card scaling function: ${expression.fnId}`);
      }
      return fn(context);
    }
  }
}