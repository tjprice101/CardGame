import { useEffect, useSyncExternalStore } from 'react';

// Reason-counted music pause: while any reason is active, background music is held at volume 0.
let activeCount = 0;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function acquireMusicSuppression(): () => void {
  activeCount += 1;
  emit();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeCount = Math.max(0, activeCount - 1);
    emit();
  };
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useIsMusicSuppressed(): boolean {
  return useSyncExternalStore(subscribe, () => activeCount > 0, () => false);
}

/** Pauses background music for as long as `active` is true and the caller is mounted. */
export function useSuppressMusic(active = true): void {
  useEffect(() => {
    if (!active) return;
    return acquireMusicSuppression();
  }, [active]);
}
