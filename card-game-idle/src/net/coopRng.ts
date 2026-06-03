// Deterministic session PRNG helpers.

export function createSessionRng(seed: number): () => number {
  let state = (seed >>> 0) || 0x6d2b79f5;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngInt(rng: () => number, maxExclusive: number): number {
  if (maxExclusive <= 0) return 0;
  return Math.floor(rng() * maxExclusive);
}

export function rngPick<T>(rng: () => number, arr: readonly T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[rngInt(rng, arr.length)];
}

export function rngShuffle<T>(rng: () => number, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rngInt(rng, i + 1);
    const tmp = arr[i];
    arr[i] = arr[j] as T;
    arr[j] = tmp as T;
  }
  return arr;
}

export function hashStringToSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
