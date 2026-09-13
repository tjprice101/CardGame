import { describe, expect, it } from 'vitest';
import {
  registerCardScalingFunction,
  resolveCardScaling,
  TRIUNE_ASA_REFERENCE,
  TRIUNE_COLLECTION_REFERENCE,
  TRIUNE_STACK_REFERENCE,
  type CardScalingContext,
} from '@/systems/cards/CardScaling';

const context: CardScalingContext = {
  limitlessLightStacks: 12,
  asaFrontCount: 3,
  collectionPower: 8,
};

describe('CardScaling', () => {
  it('resolves a constant expression', () => {
    expect(resolveCardScaling({ kind: 'constant', value: 240 }, context)).toBe(240);
  });

  it('resolves a per-card linear expression', () => {
    expect(resolveCardScaling({ kind: 'linear', reads: 'limitlessLightStacks', multiplier: 15, offset: 100 }, context)).toBe(280);
  });

  it('resolves a stepped expression', () => {
    expect(resolveCardScaling({ kind: 'stepped', reads: 'asaFrontCount', step: 2, amount: 75, offset: 25 }, context)).toBe(100);
  });

  it('supports registered bespoke formulas', () => {
    registerCardScalingFunction('test:light-attack', ({ limitlessLightStacks, collectionPower }) => limitlessLightStacks * collectionPower);

    expect(resolveCardScaling({ kind: 'custom', fnId: 'test:light-attack' }, context)).toBe(96);
  });

  it('rejects unknown bespoke formulas', () => {
    expect(() => resolveCardScaling({ kind: 'custom', fnId: 'test:missing' }, context)).toThrow('Unknown card scaling function');
  });

  describe('collection power scaling', () => {
    const zero: CardScalingContext = { limitlessLightStacks: 0, asaFrontCount: 0, collectionPower: 0 };

    it('contributes nothing when collection power is empty', () => {
      expect(resolveCardScaling({ kind: 'triune', amount: 300 }, zero)).toBe(0);
    });

    it('scales directly with collection power', () => {
      const expr = { kind: 'triune' as const, amount: 300 };
      const collectionOnly = resolveCardScaling(expr, { ...zero, collectionPower: TRIUNE_COLLECTION_REFERENCE });

      expect(collectionOnly).toBe(300);
    });

    it('never returns a negative bonus from negative inputs', () => {
      const result = resolveCardScaling({ kind: 'triune', amount: 300 }, {
        limitlessLightStacks: -50,
        asaFrontCount: -4,
        collectionPower: -1000,
      });
      expect(result).toBe(0);
    });
  });
});