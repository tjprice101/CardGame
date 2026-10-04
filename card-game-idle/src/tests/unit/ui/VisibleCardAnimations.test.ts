import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { observeVisibleCardAnimations } from '@/ui/useVisibleCardAnimations';

let callback: IntersectionObserverCallback;
const observe = vi.fn();
const unobserve = vi.fn();
const disconnect = vi.fn();
class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly thresholds = [0];
  constructor(cb: IntersectionObserverCallback) { callback = cb; }
  observe = observe;
  unobserve = unobserve;
  disconnect = disconnect;
  takeRecords = () => [];
}
let root: HTMLDivElement;
let cleanup: () => void;
beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  root = document.createElement('div');
  root.innerHTML = '<div class="live-card-shimmer"><span>Card</span></div>';
  document.body.append(root);
});
afterEach(() => {
  cleanup?.();
  root.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
function intersect(card: HTMLElement, visible: boolean): void {
  const rect = card.getBoundingClientRect();
  callback([{
    target: card, isIntersecting: visible, intersectionRatio: visible ? 1 : 0,
    time: 0, boundingClientRect: rect, intersectionRect: rect, rootBounds: null,
  }], new MockIntersectionObserver(callback));
}

describe('visible-only Deck Builder card animation', () => {
  it('starts paused, resumes visible cards, and pauses them again when scrolled out', () => {
    cleanup = observeVisibleCardAnimations(root);
    const card = root.firstElementChild as HTMLElement;
    expect(card.dataset.cardVisible).toBe('false');
    intersect(card, true);
    expect(card.dataset.cardVisible).toBe('true');
    intersect(card, false);
    expect(card.dataset.cardVisible).toBe('false');
  });

  it('observes newly added previews and stops observing removed cards', async () => {
    cleanup = observeVisibleCardAnimations(root);
    const card = document.createElement('div');
    card.className = 'live-card-shimmer';
    root.append(card);
    await Promise.resolve();
    expect(observe).toHaveBeenCalledWith(card);
    expect(card.dataset.cardVisible).toBe('false');
    card.remove();
    await Promise.resolve();
    expect(unobserve).toHaveBeenCalledWith(card);
    expect(card.dataset.cardVisible).toBeUndefined();
  });

  it('pauses visible cards in a hidden tab and resumes only those still in view', () => {
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    cleanup = observeVisibleCardAnimations(root);
    const card = root.firstElementChild as HTMLElement;
    intersect(card, true);
    visibility.mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(card.dataset.cardVisible).toBe('false');
    visibility.mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(card.dataset.cardVisible).toBe('true');
    intersect(card, false);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(card.dataset.cardVisible).toBe('false');
  });

  it('cleans up observers and visibility attributes', () => {
    cleanup = observeVisibleCardAnimations(root);
    cleanup();
    expect(disconnect).toHaveBeenCalled();
    expect((root.firstElementChild as HTMLElement).dataset.cardVisible).toBeUndefined();
  });

  it('keeps animations available when IntersectionObserver is unsupported', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    cleanup = observeVisibleCardAnimations(root);
    expect((root.firstElementChild as HTMLElement).dataset.cardVisible).toBeUndefined();
  });

  it('pauses hidden card faces, pseudo-element foils and rules, without pausing the attack overlay', () => {
    const css = readFileSync(join(process.cwd(), 'src', 'styles', 'animations.css'), 'utf8');
    expect(css).toMatch(/\.game-scene-root\[data-attack-active="true"\] \.arena-underlay \{\s*display: none;/);
    expect(css).toContain('.deck-builder-screen .live-card-shimmer[data-card-visible="false"]::after');
    expect(css).toContain('.deck-builder-screen .live-card-shimmer[data-card-visible="false"] *::after');
    expect(css).toContain('animation-play-state: paused !important;');
    expect(css).toContain('content-visibility: auto;');
    expect(css).not.toContain('.game-scene-root[data-attack-active="true"] .attack-sequence-overlay');
  });
});
