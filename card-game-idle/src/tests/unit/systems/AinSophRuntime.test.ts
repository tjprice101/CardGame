import { describe, expect, it } from 'vitest';
import { accrueSophCharges, normalizeSophCard } from '@/systems/cards/AinSophRuntime';

describe('AinSophRuntime', () => {
  it('normalizes a new deck card to the face-down Soph side', () => {
    expect(normalizeSophCard({ instanceId: 'card-1' })).toMatchObject({
      side: 'soph',
      faceState: 'back',
      limitlessCharge: 0,
    });
  });

  it('charges only face-down Soph cards', () => {
    const soph = { side: 'soph' as const, faceState: 'back' as const, limitlessCharge: 2 };
    const ain = { side: 'ain' as const, faceState: 'front' as const, limitlessCharge: 7 };
    const legacy = { limitlessCharge: 4 };

    accrueSophCharges([soph, ain, legacy, null]);

    expect(soph.limitlessCharge).toBe(3);
    expect(ain.limitlessCharge).toBe(7);
    expect(legacy.limitlessCharge).toBe(4);
  });
});