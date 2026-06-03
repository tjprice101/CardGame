const FULL_RATE_STACKS = 4;
const HALF_RATE_STACKS = 4;

// Patient Light still scales indefinitely, but additional stacks contribute less
// after early thresholds to avoid runaway Neutrality snowballing.
export function getEffectivePatientLightPatienceBonus(stacks: number): number {
  const normalized = Math.max(0, Math.floor(Number.isFinite(stacks) ? stacks : 0));
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
