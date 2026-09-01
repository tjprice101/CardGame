import type { DeckState } from '@/types/game';

export const NEUTRALITY_PATIENCE_STACK_CAP = 150;

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
