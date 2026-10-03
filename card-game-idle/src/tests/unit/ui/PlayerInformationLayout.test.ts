import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
import PlayerInformationPage from '@/ui/player/PlayerInformationPage';
import { UI_THEMES } from '@/data/profile/uiThemes';
import { resetUiPalette } from '@/ui/theme';

vi.mock('@/data/profile/mainMenuBackgrounds', async importOriginal => {
  const actual = await importOriginal<typeof import('@/data/profile/mainMenuBackgrounds')>();
  return { ...actual, loadMainMenuBackgroundEntries: async () => [actual.getDefaultMainMenuBackground()] };
});

describe.each(['light', 'dark'] as const)('ceremonial player information in %s mode', mode => {
  const initialState = useStore.getState();
  let container: HTMLDivElement;
  let root: Root;
  const onClose = vi.fn();
  const onSave = vi.fn();
  const onWipe = vi.fn();

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
    });
    vi.clearAllMocks();
    useStore.setState({
      settings: { ...initialState.settings, buttonColorMode: mode },
      progress: {
        ...structuredClone(defaultGameState.progress),
        profile: { ...defaultGameState.progress.profile, name: 'Aetherborn', bio: 'A real player biography.' },
      },
    });
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root.render(createElement(PlayerInformationPage, {
      onClose, onSave, onWipe,
    })));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    useStore.setState(initialState, true);
    resetUiPalette();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function click(text: string) {
    const button = Array.from(container.querySelectorAll('button')).find(element => element.textContent === text)!;
    expect(button).toBeDefined();
    await act(async () => button.click());
  }

  async function changeInput(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
    const prototype = element instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
    await act(async () => {
      Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  it('separates persistent identity from tab content and uses real limits and stats', () => {
    expect(container.querySelector('h1')?.textContent).toBe('Player Information');
    expect(container.querySelector('.player-information-workspace main')).not.toBeNull();
    const name = container.querySelector<HTMLInputElement>('input[aria-label="Display name"]')!;
    const bio = container.querySelector<HTMLTextAreaElement>('textarea[aria-label="Bio"]')!;
    expect(name.value).toBe('Aetherborn');
    expect(name.maxLength).toBe(24);
    expect(bio.maxLength).toBe(200);
    expect(container.querySelector('.player-bio-count')?.textContent).toBe(`${bio.value.length} / 200`);
    expect(container.querySelectorAll('.player-identity-stats > div')).toHaveLength(4);
    expect(container.querySelectorAll('.player-stat-medallion')).toHaveLength(6);
    expect(Array.from(container.querySelectorAll('.player-tab-numeral')).map(el => el.textContent))
      .toEqual(['I', 'II', 'III', 'IV']);
  });

  it('preserves name commit and explicit bio saving', async () => {
    const name = container.querySelector<HTMLInputElement>('input[aria-label="Display name"]')!;
    await act(async () => name.focus());
    await changeInput(name, '  Starweaver  ');
    await act(async () => name.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(useStore.getState().progress.profile.name).toBe('Starweaver');
    const bio = container.querySelector<HTMLTextAreaElement>('textarea[aria-label="Bio"]')!;
    await changeInput(bio, 'A new constellation.');
    expect(useStore.getState().progress.profile.bio).toBe('A real player biography.');
    expect(container.querySelector('.player-bio-count')?.textContent).toBe('20 / 200');
    await click('Save Bio');
    expect(useStore.getState().progress.profile.bio).toBe('A new constellation.');
  });

  it('connects appearance controls to the same persistent game setting', async () => {
    const group = container.querySelector('[aria-label="Appearance mode"]')!;
    expect(group.querySelector('[aria-pressed="true"]')?.textContent).toBe(mode === 'light' ? 'Light' : 'Dark');
    await click(mode === 'light' ? 'Dark' : 'Light');
    expect(useStore.getState().settings.buttonColorMode).toBe(mode === 'light' ? 'dark' : 'light');
  });

  it('keeps identity while switching panels and previews the actual equipped art', async () => {
    const identity = container.querySelector('.player-identity-monument');
    const tab = container.querySelectorAll<HTMLButtonElement>('nav button')[1];
    await act(async () => tab.click());
    expect(container.querySelector('.player-identity-monument')).toBe(identity);
    expect(tab.getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('main')?.getAttribute('aria-label')).toBe('Main Menu Background');
    expect(container.querySelector('.player-background-stage')?.textContent).toContain('Infinite Cards Sky');
    expect(container.querySelector('.player-background-stage')?.getAttribute('style')).toContain('InfiniteCardsMenuArt.png');
  });

  it('opens the existing portrait picker and closes through the original callback', async () => {
    await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Change profile picture"]')!.click());
    expect(container.textContent).toContain('Choose your profile picture');
    await act(async () => container.querySelector<HTMLButtonElement>('.player-information-header [aria-label="Close"]')!.click());
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('opens the existing title picker from the identity ribbon', async () => {
    await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Change title"]')!.click());
    expect(container.textContent).toContain('Titles unlock as you earn milestones');
    expect(Array.from(container.querySelectorAll('button')).some(button => button.textContent?.trim() === 'Apply Title')).toBe(true);
  });

  it('previews themes without saving until requested', async () => {
    const theme = UI_THEMES.find(entry => entry.name === 'Cinder Velvet')!;
    const original = useStore.getState().progress.profile.uiThemeId;
    const tile = Array.from(container.querySelectorAll('button')).find(button =>
      button.textContent?.includes('Deep ember reds with warm highlights.'),
    )!;
    await act(async () => tile.click());
    expect(useStore.getState().progress.profile.uiThemeId).toBe(original);
    const screen = container.querySelector<HTMLElement>('.player-information')!;
    expect(screen.style.getPropertyValue('--profile-app-bg')).toBe(mode === 'light' ? '#ffffff' : '#000000');
    const surface = screen.style.getPropertyValue('--profile-surface-strong').match(/[\d.]+/g)!.slice(0, 3).map(Number);
    expect(surface[0]).toBe(surface[1]);
    expect(surface[1]).toBe(surface[2]);
    const accent = screen.style.getPropertyValue('--profile-accent');
    expect(accent).not.toBe(mode === 'light' ? '#111111' : '#ffffff');
    expect(screen.style.getPropertyValue('--profile-border-strong')).toMatch(/rgba\([\d, ]+, 0.68\)/);
    expect(screen.style.getPropertyValue('--profile-glow')).toContain('0 0 18px');
    expect(screen.style.getPropertyValue('--profile-accent-text')).not.toBe('');
    await click('Save UI Theme');
    expect(useStore.getState().progress.profile.uiThemeId).toBe(theme.id);
  });

  it('opens a signature picker without altering card selection', async () => {
    const original = useStore.getState().progress.profile.signatureCardIds;
    const slot = Array.from(container.querySelectorAll('button')).find(button => button.textContent?.includes('Slot 1'))!;
    await act(async () => slot.click());
    expect(container.textContent).toContain('Slot 1 of 5');
    const search = container.querySelector<HTMLInputElement>('input[placeholder="Search by name…"]')!;
    expect(search.style.background).toBe('var(--profile-surface-strong)');
    expect(search.style.color).toBe('var(--profile-text)');
    expect(search.style.border).toContain('var(--profile-border-strong)');
    expect(useStore.getState().progress.profile.signatureCardIds).toEqual(original);
  });

  it('retains saving and both destructive confirmation stages', async () => {
    await act(async () => container.querySelectorAll<HTMLButtonElement>('nav button')[3].click());
    await click('Save Game Data');
    expect(onSave).toHaveBeenCalledOnce();
    expect(container.querySelector('footer')?.textContent).toContain('Game data saved');
    await click('Delete Save Data');
    expect(onWipe).not.toHaveBeenCalled();
    await click('Yes, delete it');
    expect(onWipe).not.toHaveBeenCalled();
    await click('Cancel');
    expect(container.textContent).not.toContain('Are you REALLY sure?');
    await click('Delete Save Data');
    await click('Yes, delete it');
    await click('Delete Everything');
    expect(onWipe).toHaveBeenCalledOnce();
  });
});
