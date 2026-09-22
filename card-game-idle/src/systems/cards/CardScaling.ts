import type { CardScalingExpr } from '@/types/cards';

export interface CardScalingContext {
  limitlessLightStacks: number;
  asaFrontCount: number;
  collectionPower: number;
}

type CustomScalingFunction = (context: CardScalingContext) => number;

const customScalingFunctions = new Map<string, CustomScalingFunction>();

export function registerCardScalingFunction(fnId: string, fn: CustomScalingFunction): void {
  customScalingFunctions.set(fnId, fn);
}

export function resolveCardScaling(expression: CardScalingExpr, context: CardScalingContext): number {
  switch (expression.kind) {
    case 'constant':
      return expression.value;
    case 'linear': {
      const sourceValue = expression.reads === 'collectionPower'
        ? Math.max(0, context.collectionPower)
        : context[expression.reads];
      return (sourceValue * expression.multiplier) + (expression.offset ?? 0);
    }
    case 'stepped':
      return (Math.floor(context[expression.reads] / expression.step) * expression.amount) + (expression.offset ?? 0);
    case 'custom': {
      const fn = customScalingFunctions.get(expression.fnId);
      if (!fn) {
        throw new Error(`Unknown card scaling function: ${expression.fnId}`);
      }
      return fn(context);
    }
  }
}