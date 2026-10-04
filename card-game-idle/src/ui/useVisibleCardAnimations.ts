import { useEffect, type RefObject } from 'react';

export function observeVisibleCardAnimations(root: HTMLElement): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => {};
  const cards = new Map<HTMLElement, boolean>();
  const update = (card: HTMLElement, visible: boolean) => {
    card.dataset.cardVisible = String(visible && document.visibilityState !== 'hidden');
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const card = entry.target;
      if (!(card instanceof HTMLElement) || !cards.has(card)) continue;
      cards.set(card, entry.isIntersecting);
      update(card, entry.isIntersecting);
    }
  });
  const syncCards = () => {
    for (const card of cards.keys()) {
      if (!root.contains(card) || !card.classList.contains('live-card-shimmer')) {
        observer.unobserve(card);
        delete card.dataset.cardVisible;
        cards.delete(card);
      }
    }
    for (const card of root.querySelectorAll<HTMLElement>('.live-card-shimmer')) {
      if (cards.has(card)) continue;
      cards.set(card, false);
      update(card, false);
      observer.observe(card);
    }
  };
  const onVisibility = () => {
    for (const [card, visible] of cards) update(card, visible);
  };
  syncCards();
  const mutations = new MutationObserver(syncCards);
  mutations.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', onVisibility);
  return () => {
    mutations.disconnect();
    observer.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    for (const card of cards.keys()) delete card.dataset.cardVisible;
  };
}

export function useVisibleCardAnimations(rootRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = rootRef.current;
    if (root) return observeVisibleCardAnimations(root);
  }, [rootRef]);
}
