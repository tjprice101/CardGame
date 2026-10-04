import { useLayoutEffect } from 'react';
import { useStore } from '@/state/store';

export function installDebugShortcut(activate: () => void): () => void {
  let typed = '';
  let lastKeyAt = 0;
  const onKeyDown = (event: KeyboardEvent) => {
    const target = event.target;
    const editable = target instanceof HTMLElement && !!target.closest('input, textarea, select, [aria-modal="true"], [contenteditable]:not([contenteditable="false"])');
    if (editable || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) {
      typed = '';
      return;
    }
    const now = Date.now();
    if (now - lastKeyAt > 2_000) typed = '';
    lastKeyAt = now;
    typed = (typed + event.key.toLowerCase()).slice(-3);
    if (typed === 'key') {
      typed = '';
      event.preventDefault();
      activate();
    }
  };
  window.addEventListener('keydown', onKeyDown, true);
  return () => window.removeEventListener('keydown', onKeyDown, true);
}

export function useDebugShortcut(enabled: boolean): void {
  useLayoutEffect(() => {
    if (!enabled) return;
    return installDebugShortcut(() => useStore.getState().activateDebugMode());
  }, [enabled]);
}
