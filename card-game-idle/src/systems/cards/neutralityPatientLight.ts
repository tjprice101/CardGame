import type { DeckState } from '@/types/game';

const FULL_RATE_STACKS = 4;
const HALF_RATE_STACKS = 4;

export const NEUTRALITY_PATIENCE_STACK_CAP = 150;
export const NEUTRALITY_PATIENT_LIGHT_CAP = 15;

export const NEUTRALITY_UNCAP_TRANSCENDENT_IDS: ReadonlySet<string> = new Set([
  'tx-angel-starbound-null-archangel',
  'tx-sera-null-entropy',
  'tx-cher-null-sentinel',
  'tx-oph-null-convergence',
]);

function normalizeNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function hasNeutralityUncappedGainsInDeck(deck: Pick<DeckState, 'deckList' | 'extraDeck'>): boolean {
  for (const entry of deck.deckList) {
    if (NEUTRALITY_UNCAP_TRANSCENDENT_IDS.has(entry.definitionId)) return true;
  }
  for (const entry of deck.extraDeck) {
    if (NEUTRALITY_UNCAP_TRANSCENDENT_IDS.has(entry.definitionId)) return true;
  }
  return false;
}

export function clampPatienceStacks(value: number, isUncapped: boolean): number {
  const normalized = normalizeNonNegativeInteger(value);
  if (isUncapped) return normalized;
  return Math.min(NEUTRALITY_PATIENCE_STACK_CAP, normalized);
}

export function clampPatientLightStacks(value: number, isUncapped: boolean): number {
  const normalized = normalizeNonNegativeInteger(value);
  if (isUncapped) return normalized;
  return Math.min(NEUTRALITY_PATIENT_LIGHT_CAP, normalized);
}

// Patient Light still scales indefinitely, but additional stacks contribute less
// after early thresholds to avoid runaway Neutrality snowballing.
export function getEffectivePatientLightPatienceBonus(stacks: number): number {
  const normalized = normalizeNonNegativeInteger(stacks);
  const fullRate = Math.min(normalized, FULL_RATE_STACKS);
  const halfRateInput = Math.min(Math.max(normalized - FULL_RATE_STACKS, 0), HALF_RATE_STACKS);
  const quarterRateInput = Math.max(normalized - FULL_RATE_STACKS - HALF_RATE_STACKS, 0);

  const halfRate = Math.floor(halfRateInput * 0.5);
  const quarterRate = Math.floor(quarterRateInput * 0.25);
  return fullRate + halfRate + quarterRate;
}

export function getEffectivePatientLightPerCardPatienceGain(stacks: number): number {
  return 1 + getEffectivePatientLightPatienceBonus(stacks);
}
