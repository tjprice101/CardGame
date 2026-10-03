import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { PACK_DEFINITIONS } from '@/data/packs/packDefinitions';
import { infiniteCards } from '@/data/cards/infiniteCards';
import { useStore } from '@/state/store';
import CollectionViewer from '@/ui/store/CollectionViewer';
import CollectionCardDetail from '@/ui/store/CollectionCardDetail';
import { getLiveCardFaceBackgroundStyle, getCardBackBackgroundStyle } from '@/ui/cardBackgrounds';
import { getCardFinishKey } from '@/systems/progression/HolofoilSystem';
import { HIGHLIGHT_STYLES, LIGHT_BG_HIGHLIGHT_STYLES } from '@/ui/text/rulesVocabulary';
import { applyUiPalette, DEFAULT_WARM_PALETTE, getUiColorModePalette, resetUiPalette } from '@/ui/theme';

const card = CardRegistry.getAll().find(entry => entry.rarity === 'Common')!;

describe.each(['light', 'dark'] as const)('Collection appearance in %s mode', mode => {
  const initialState = useStore.getState();
  let container: HTMLDivElement;
  let root: Root;
  const close = vi.fn();
  const markViewed = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
    });
    close.mockClear();
    markViewed.mockClear();
    useStore.setState({
      settings: { ...initialState.settings, buttonColorMode: mode },
      progress: {
        ...initialState.progress,
        collection: { [card.definitionId]: 3 },
        everCollection: { [card.definitionId]: 3 },
        holoCollection: {},
        everHoloCollection: {},
        infiniteCollection: {},
        everInfiniteCollection: {},
        transcendentCollection: {},
        favoriteCollection: {},
        recentlyAcquired: { [card.definitionId]: 100 },
        lastCollectionViewedAt: 0,
      },
      markCollectionViewed: markViewed,
    });
    applyUiPalette(getUiColorModePalette(DEFAULT_WARM_PALETTE, mode));
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    useStore.setState(initialState, true);
    resetUiPalette();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function button(label: string): HTMLButtonElement {
    const found = Array.from(container.querySelectorAll('button')).find(entry => entry.textContent === label);
    expect(found, label).toBeDefined();
    return found!;
  }

  it('keeps ownership, rarity, search and sorting controls working with palette-aware chrome', async () => {
    useStore.setState({ progress: { ...useStore.getState().progress, collection: {} } });
    await act(async () => root.render(createElement(CollectionViewer, { onClose: close })));
    expect(markViewed).toHaveBeenCalledOnce();
    expect(container.querySelector('.collection-screen')?.getAttribute('style')).toContain('var(--profile-app-background)');
    expect(container.querySelector<HTMLInputElement>('[aria-label="Search collection"]')?.style.color).toBe('var(--profile-text)');
    await act(async () => button('Owned').click());
    expect(button('Owned').getAttribute('aria-pressed')).toBe('true');
    expect(button('Owned').classList.contains('is-active')).toBe(true);
    expect(container.querySelector('[role="button"]')?.getAttribute('aria-label')).toBe(`${card.name}, Common`);
    expect(container.textContent).toContain('NEW');

    await act(async () => button('Rare').click());
    expect(container.textContent).toContain('No cards match the current filters.');
    await act(async () => button('Common').click());
    expect(container.querySelector('[role="button"]')).not.toBeNull();

    const input = container.querySelector<HTMLInputElement>('[aria-label="Search collection"]')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'no matching card 012345');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(container.textContent).toContain('No cards match the current filters.');
    await act(async () => button('Clear').click());
    expect(input.value).toBe('');
    const sort = container.querySelector('select')!;
    await act(async () => {
      sort.value = 'name';
      sort.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(sort.value).toBe('name');
    expect(container.querySelector('[role="button"]')?.getAttribute('aria-label')).toBe(`${card.name}, Common`);

    await act(async () => button('Missing').click());
    expect(container.querySelector('[role="button"]')?.getAttribute('aria-label')).toBe('Card not discovered');
    await act(async () => button('Close').click());
    expect(close).toHaveBeenCalledOnce();
  });

  it('opens details by keyboard and keeps favorite changes and NEW badges independent', async () => {
    await act(async () => root.render(createElement(CollectionViewer, { onClose: close })));
    await act(async () => button('Owned').click());
    const favorite = container.querySelector<HTMLButtonElement>('[aria-label="Favorite card"]')!;
    await act(async () => favorite.click());
    expect(useStore.getState().progress.favoriteCollection[getCardFinishKey(card.definitionId, 'normal')]).toBe(true);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.textContent).toContain('NEW');
    await act(async () => container.querySelector('[role="button"]')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    ));
    expect(container.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe(`${card.name} collection details`);
    await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Close card details"]')!.click());
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('groups all Infinite cards by set and keeps set filters consistent, including archived cards', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(10000);
    await act(async () => root.render(createElement(CollectionViewer, { onClose: close })));
    await act(async () => button('Infinite').click());
    const headings = () => Array.from(container.querySelectorAll('[role="heading"][aria-level="3"]')).map(entry => entry.textContent);
    const tileCount = () => container.querySelectorAll('[role="button"]').length;
    const registered = CardRegistry.getAll().filter(entry => entry.rarity === 'Infinite');
    const archived = infiniteCards.filter(entry => !CardRegistry.has(entry.definitionId));
    const expected = [...registered, ...archived];
    expect(headings()).toEqual(['Neutrality', 'Causality']);
    expect(tileCount()).toBe(expected.length);
    expect(headings()).not.toContain('Light');
    expect(headings()).not.toContain('Dark');
    expect(headings()).not.toContain('AinSophAur');

    for (const set of ['Causality', 'Neutrality']) {
      await act(async () => button(set).click());
      expect(headings()).toEqual([set]);
      expect(tileCount()).toBe(expected.filter(entry =>
        entry.definitionId.includes('causality') === (set === 'Causality'),
      ).length);
      expect(button(set).getAttribute('aria-pressed')).toBe('true');
    }
  });

  it('uses paired detail text/surfaces while preserving the exact live artwork and callbacks', async () => {
    const action = vi.fn();
    await act(async () => root.render(createElement(CollectionCardDetail, {
      card, finish: 'normal', owned: 3, onClose: close, actionLabel: 'Use card', onAction: action,
    })));
    expect(container.querySelector('.collection-detail-info')?.getAttribute('style')).toContain('color: var(--profile-text)');
    expect(container.querySelector('.collection-detail-panel')).not.toBeNull();
    const art = container.querySelector<HTMLElement>('.collection-detail-art > div')!;
    const expected = document.createElement('div');
    Object.assign(expected.style, getLiveCardFaceBackgroundStyle(card, 'normal', 'front'));
    expect(art.style.backgroundImage).toBe(expected.style.backgroundImage);
    expect(container.textContent).toContain('x3');
    const number = Array.from(container.querySelectorAll('span')).find(entry => entry.textContent === '80')!;
    const color = document.createElement('span');
    color.style.color = (mode === 'light' ? LIGHT_BG_HIGHLIGHT_STYLES : HIGHLIGHT_STYLES).number.color;
    expect(number.style.color).toBe(color.style.color);
    await act(async () => button('+Add to Favorites').click());
    expect(button('*Favorited').getAttribute('aria-pressed')).toBe('true');
    expect(container.textContent).toContain('Added to favorites');
    await act(async () => button('Use card').click());
    expect(action).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });

  it('keeps undiscovered backs and disabled optional actions intact', async () => {
    const action = vi.fn();
    await act(async () => root.render(createElement(CollectionCardDetail, {
      card, finish: 'normal', owned: 0, onClose: close, actionLabel: 'Use card', onAction: action, actionDisabled: true,
    })));
    const expected = document.createElement('div');
    Object.assign(expected.style, getCardBackBackgroundStyle(card, { dimmed: false }));
    expect(container.querySelector<HTMLElement>('.collection-detail-art > div')?.style.backgroundImage).toBe(expected.style.backgroundImage);
    expect(container.textContent).toContain('Card not owned');
    expect(container.textContent).toContain('Not owned');
    expect(container.textContent).not.toContain('Add to Favorites');
    expect(button('Use card').disabled).toBe(true);
    await act(async () => button('Use card').click());
    expect(action).not.toHaveBeenCalled();
  });

  it('preserves the acquisition link event and closes details before focusing the pack', async () => {
    vi.useFakeTimers();
    const dispatch = vi.spyOn(window, 'dispatchEvent');
    const pack = PACK_DEFINITIONS.find(entry => entry.cardPool.includes(card.definitionId))!;
    await act(async () => root.render(createElement(CollectionCardDetail, {
      card, finish: 'normal', owned: 0, onClose: close,
    })));
    await act(async () => container.querySelector<HTMLButtonElement>('[title="Jump to this pack in the store"]')!.click());
    expect(close).toHaveBeenCalledOnce();
    expect(dispatch).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTime(50));
    expect(dispatch.mock.calls[0][0]).toMatchObject({
      type: 'focusPackInStore', detail: { packId: pack.id },
    });
  });
});
