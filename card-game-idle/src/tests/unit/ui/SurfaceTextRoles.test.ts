import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStore } from '@/state/store';
import PlayerInformationPage from '@/ui/player/PlayerInformationPage';
import InventoryModal from '@/ui/menus/InventoryModal';
import TitlesModal from '@/ui/profile/TitlesModal';
import ProfilePictureModal from '@/ui/profile/ProfilePictureModal';
import DeckBuilderAbilitiesTab from '@/ui/deck/tabs/DeckBuilderAbilitiesTab';
import CardPackStore from '@/ui/store/CardPackStore';
import DeckViewer from '@/ui/deck/DeckViewer';
import QuestsModal from '@/ui/menus/QuestsModal';
import { applyUiPalette, DEFAULT_WARM_PALETTE, getUiColorModePalette, resetUiPalette, warmTheme } from '@/ui/theme';

vi.mock('@/data/profile/mainMenuBackgrounds', async importOriginal => {
  const actual = await importOriginal<typeof import('@/data/profile/mainMenuBackgrounds')>();
  return { ...actual, loadMainMenuBackgroundEntries: async () => [actual.getDefaultMainMenuBackground()] };
});

describe.each(['light', 'dark'] as const)('surface text roles in %s mode', mode => {
  let container: HTMLDivElement;
  let root: Root;
  const initialState = useStore.getState();
  const noop = () => {};

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    useStore.setState({
      settings: { ...initialState.settings, buttonColorMode: mode },
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
    vi.unstubAllGlobals();
  });

  it('pairs theme previews and empty signature slots with the displayed profile surfaces', async () => {
    await act(async () => root.render(createElement(PlayerInformationPage, {
      onClose: noop, onSave: noop, onWipe: noop,
    })));
    const preview = Array.from(container.querySelectorAll('button')).find(button =>
      button.textContent?.includes('Neutral surfaces with crisp monochrome'),
    )!;
    expect(preview.style.background).toBe('var(--profile-surface-strong)');
    expect(preview.style.opacity).toBe('');
    expect(Array.from(preview.querySelectorAll('div')).find(element => element.textContent === 'Pantheon Default')?.style.color)
      .toBe('var(--profile-text)');
    const emptySlot = Array.from(container.querySelectorAll('button')).find(button =>
      button.textContent?.includes('Slot 1'),
    )!;
    expect(emptySlot.style.backgroundColor).toBe('var(--profile-surface)');
    expect(emptySlot.querySelector('span')?.style.color).toBe('var(--profile-text-muted)');
    const inactiveTab = Array.from(container.querySelectorAll('nav button')).find(button =>
      button.textContent?.includes('Swap splash'),
    )!;
    expect(inactiveTab.getAttribute('aria-pressed')).toBe('false');
    expect(inactiveTab.querySelector('.player-tab-label')?.textContent).toBe('Main Menu Background');
    expect(inactiveTab.classList.contains('is-active')).toBe(false);
  });

  it('uses mode-aware inventory backgrounds and captions', async () => {
    await act(async () => root.render(createElement(InventoryModal, { onClose: noop })));
    const expected = document.createElement('div');
    expected.style.background = warmTheme.appBackground;
    expect((container.firstElementChild as HTMLElement).style.background).toBe(expected.style.background);
    expect(container.textContent).toContain('Every currency, material, and collection stat');
    expect(container.querySelector('header')?.parentElement?.style.color).toBe(
      mode === 'light' ? 'rgb(17, 17, 17)' : 'rgb(255, 255, 255)',
    );
  });

  it('keeps locked title descriptions readable without changing disabled selection', async () => {
    await act(async () => root.render(createElement(TitlesModal, { onClose: noop })));
    const locked = container.querySelector<HTMLButtonElement>('button:disabled')!;
    expect(locked).not.toBeNull();
    expect(locked.style.filter).toBe('');
    expect(locked.style.background).toBe('var(--profile-surface-strong)');
    expect(locked.querySelector('div > div')?.style.color).toBe('var(--profile-text)');
    expect(locked.textContent?.length).toBeGreaterThan(10);
  });

  it('keeps avatar names separate from the dimmed locked artwork', async () => {
    await act(async () => root.render(createElement(ProfilePictureModal, {
      currentAvatarId: initialState.progress.profile.avatarId, onClose: noop,
    })));
    const lockedArt = container.querySelector<HTMLElement>('[style*="grayscale"]')!;
    expect(lockedArt).not.toBeNull();
    const name = Array.from(lockedArt.parentElement!.children).find(element =>
      element instanceof HTMLElement && element.style.textOverflow === 'ellipsis',
    ) as HTMLElement;
    expect(name.style.color).toBe('var(--profile-text)');
    expect(name.style.filter).toBe('');
  });

  it('pairs ability-slot descriptions and selects with their mode-aware surfaces', async () => {
    await act(async () => root.render(createElement(DeckBuilderAbilitiesTab, {
      activeDeck: null, ownedAbilities: {}, deckList: [], extraDeckList: [], setDeckAbilityLoadout: noop,
    })));
    const select = container.querySelector('select')!;
    expect(select.disabled).toBe(true);
    expect(select.style.background).toBe('var(--profile-surface-muted)');
    expect(select.style.color).toBe('var(--profile-text)');
    expect(container.textContent).toContain('No ability equipped.');
    expect(container.querySelector('[style*="padding-left: 38px"]')?.getAttribute('style'))
      .toContain('var(--profile-text-soft)');
  });

  it('preserves accent badge foregrounds inside Card Store buttons', async () => {
    await act(async () => root.render(createElement(CardPackStore, { onClose: noop })));
    const badges = Array.from(container.querySelectorAll('.celestial-store-set-button small'));
    expect(badges).toHaveLength(2);
    for (const badge of badges) {
      expect(badge.hasAttribute('data-ui-special-text')).toBe(true);
      expect(badge.textContent?.length).toBeGreaterThan(0);
    }
    const event = badges.find(badge => badge.textContent === 'Event pack')!;
    expect(event.classList.contains('is-event')).toBe(true);
    expect(container.querySelector('.celestial-store-tag')?.hasAttribute('data-ui-special-text')).toBe(true);
  });

  it('keeps the Deck Viewer reading surfaces neutral and palette-linked', async () => {
    await act(async () => root.render(createElement(DeckViewer, { onClose: noop, onOpenDeckBuilder: noop })));
    expect((container.firstElementChild as HTMLElement).style.background).toBe('var(--profile-app-background)');
    const search = container.querySelector<HTMLInputElement>('input[aria-label="Search deck cards"]')!;
    expect(search.style.background).toBe('var(--profile-surface-strong)');
    expect(search.style.color).toBe('var(--profile-text)');
    expect(search.style.border).toContain('var(--profile-border-strong)');
    const sidebar = Array.from(container.querySelectorAll<HTMLElement>('div')).find(element =>
      element.style.width === '260px',
    )!;
    expect(sidebar.style.background).toBe('var(--profile-surface)');
  });

  it('uses neutral challenge columns with player-colored outlines and glows', async () => {
    await act(async () => root.render(createElement(QuestsModal, { onClose: noop })));
    const columns = Array.from(container.querySelectorAll<HTMLElement>('section')).filter(element =>
      element.querySelector('h2')?.textContent?.includes('Challenges'),
    );
    expect(columns).toHaveLength(2);
    const expected = document.createElement('div');
    expected.style.color = warmTheme.text;
    for (const column of columns) {
      expect(column.style.background).toBe(warmTheme.surface);
      expect(column.style.boxShadow).toBe(warmTheme.glow);
      expect(column.querySelector('h2')?.style.color).toBe(expected.style.color);
    }
  });
});
