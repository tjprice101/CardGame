import type { CardSide } from '@/types/cards';

export interface AinSophRuntimeCard {
  side?: CardSide;
  faceState?: 'front' | 'back';
  limitlessCharge?: number;
}

export function normalizeSophCard<T>(card: T & AinSophRuntimeCard): T & AinSophRuntimeCard {
  return {
    ...card,
    side: 'soph',
    faceState: 'back',
    limitlessCharge: 0,
  };
}

export function accrueSophCharges(cards: Array<AinSophRuntimeCard | null>): void {
  for (const card of cards) {
    if (!card || card.side !== 'soph' || card.faceState !== 'back') continue;
    card.limitlessCharge = (card.limitlessCharge ?? 0) + 1;
  }
}