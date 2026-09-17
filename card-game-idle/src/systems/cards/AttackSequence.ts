import type { AttackSequenceKind, AttackSequenceStar } from '@/types/game';

export const ATTACK_SEQUENCE_PRIME_MS = 650;
export const ATTACK_SEQUENCE_RESULT_MS = 1_200;

export function getAttackSequenceDuration(kind: AttackSequenceKind): number {
  return kind === 'ain' ? 2_000 : 3_000;
}

export function getAttackSequenceStarCount(kind: AttackSequenceKind, definitionId: string): number {
  if (kind === 'ain') return 3;
  if (kind === 'soph') return 5;
  return 3 + (hashString(`${definitionId}:bridge-count`) % 3);
}

export function getAttackSequenceMultiplier(kind: AttackSequenceKind, hits: number): number {
  if (hits <= 0) return 1;
  if (kind === 'ain') return Math.min(4, hits + 1);
  return Math.min(5.5, hits + 0.5);
}

export function getAttackSequenceStars(
  definitionId: string,
  kind: AttackSequenceKind,
): AttackSequenceStar[] {
  const count = getAttackSequenceStarCount(kind, definitionId);
  const random = seededRandom(hashString(`${definitionId}:${kind}:stars`));
  const stars: AttackSequenceStar[] = [];

  for (let id = 0; id < count; id++) {
    let x = 0;
    let y = 0;
    for (let attempt = 0; attempt < 12; attempt++) {
      x = 12 + random() * 76;
      y = 18 + random() * 64;
      if (stars.every(star => Math.hypot(star.x - x, star.y - y) >= 17)) break;
    }
    stars.push({ id, x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
  }
  return stars;
}

function hashString(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}