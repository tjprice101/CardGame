import type { ProgressState } from '@/types/game';

function maxRecord(a: Record<string, number> | undefined, b: Record<string, number> | undefined): Record<string, number> {
  const merged: Record<string, number> = { ...(a ?? {}) };
  for (const [id, count] of Object.entries(b ?? {})) {
    const normalized = Math.max(0, Math.floor(count));
    if (normalized <= 0) continue;
    merged[id] = Math.max(merged[id] ?? 0, normalized);
  }
  return merged;
}

function sumValues(record: Record<string, number>): number {
  return Object.values(record).reduce((sum, value) => sum + value, 0);
}

export function ensureOwnershipHistory(progress: ProgressState): void {
  progress.everCollection = maxRecord(progress.everCollection, progress.collection);
  progress.everHoloCollection = maxRecord(progress.everHoloCollection, progress.holoCollection);
  progress.everInfiniteCollection = maxRecord(progress.everInfiniteCollection, progress.infiniteCollection);
}

export function syncCardOwnershipHistory(progress: ProgressState, definitionId: string): void {
  if (!progress.everCollection) progress.everCollection = {};
  progress.everCollection[definitionId] = Math.max(
    progress.everCollection[definitionId] ?? 0,
    progress.collection[definitionId] ?? 0,
  );

  if (!progress.everHoloCollection) progress.everHoloCollection = {};
  progress.everHoloCollection[definitionId] = Math.max(
    progress.everHoloCollection[definitionId] ?? 0,
    progress.holoCollection[definitionId] ?? 0,
  );

  if (!progress.everInfiniteCollection) progress.everInfiniteCollection = {};
  progress.everInfiniteCollection[definitionId] = Math.max(
    progress.everInfiniteCollection[definitionId] ?? 0,
    progress.infiniteCollection[definitionId] ?? 0,
  );
}

export function seedEverOwned(progress: ProgressState, definitionId: string, source: 'collection' | 'holo' | 'infinite' = 'collection'): void {
  if (!definitionId) return;
  if (source === 'collection') {
    if (!progress.everCollection) progress.everCollection = {};
    progress.everCollection[definitionId] = Math.max(progress.everCollection[definitionId] ?? 0, 1);
    return;
  }
  if (source === 'holo') {
    if (!progress.everHoloCollection) progress.everHoloCollection = {};
    progress.everHoloCollection[definitionId] = Math.max(progress.everHoloCollection[definitionId] ?? 0, 1);
    return;
  }
  if (!progress.everInfiniteCollection) progress.everInfiniteCollection = {};
  progress.everInfiniteCollection[definitionId] = Math.max(progress.everInfiniteCollection[definitionId] ?? 0, 1);
}

export function getEverCollectionCount(progress: ProgressState, definitionId: string): number {
  return Math.max(progress.collection[definitionId] ?? 0, progress.everCollection?.[definitionId] ?? 0);
}

export function getEverHoloCount(progress: ProgressState, definitionId: string): number {
  return Math.max(progress.holoCollection[definitionId] ?? 0, progress.everHoloCollection?.[definitionId] ?? 0);
}

export function getEverInfiniteCount(progress: ProgressState, definitionId: string): number {
  return Math.max(progress.infiniteCollection[definitionId] ?? 0, progress.everInfiniteCollection?.[definitionId] ?? 0);
}

export function hasAllEverOwned(progress: ProgressState, ids: string[], source: 'collection' | 'holo' | 'infinite' = 'collection'): boolean {
  if (ids.length === 0) return false;
  for (const id of ids) {
    const count = source === 'holo'
      ? getEverHoloCount(progress, id)
      : source === 'infinite'
        ? getEverInfiniteCount(progress, id)
        : getEverCollectionCount(progress, id);
    if (count < 1) return false;
  }
  return true;
}

export function getEverDistinctCollectionCount(progress: ProgressState): number {
  const merged = maxRecord(progress.everCollection, progress.collection);
  return Object.keys(merged).length;
}

export function getEverCollectionTotal(progress: ProgressState): number {
  const merged = maxRecord(progress.everCollection, progress.collection);
  return sumValues(merged);
}

export function getEverDistinctHoloCount(progress: ProgressState): number {
  const merged = maxRecord(progress.everHoloCollection, progress.holoCollection);
  return Object.keys(merged).filter(id => (merged[id] ?? 0) > 0).length;
}

export function getEverHoloTotal(progress: ProgressState): number {
  const merged = maxRecord(progress.everHoloCollection, progress.holoCollection);
  return sumValues(merged);
}

export function getEverInfiniteTotal(progress: ProgressState): number {
  const merged = maxRecord(progress.everInfiniteCollection, progress.infiniteCollection);
  return sumValues(merged);
}
