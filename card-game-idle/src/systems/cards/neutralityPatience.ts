export const NEUTRALITY_PATIENCE_STACK_CAP = 150;

function normalizeNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function clampPatienceStacks(value: number): number {
  const normalized = normalizeNonNegativeInteger(value);
  return Math.min(NEUTRALITY_PATIENCE_STACK_CAP, normalized);
}
