import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
import { CUSTOM_MAIN_MENU_BACKGROUND_REWARDS } from '@/data/profile/customMainMenuBackgrounds';
import { CROWN_BACKGROUND_REWARDS } from '@/data/profile/crownBackgroundRewards';
import { loadMainMenuBackgroundEntries } from '@/data/profile/mainMenuBackgrounds';
import PlayerInformationPage from '@/ui/player/PlayerInformationPage';
import AchievementsModal from '@/ui/menus/AchievementsModal';
import { applyUiPalette, DEFAULT_WARM_PALETTE, getUiColorModePalette, resetUiPalette } from '@/ui/theme';
import * as backgroundRewards from '@/data/profile/customMainMenuBackgrounds';

const rewards = CUSTOM_MAIN_MENU_BACKGROUND_REWARDS;

describe.each(['light', 'dark'] as const)('background achievement UI in %s mode', mode => {
  const initialState = useStore.getState();
  let container: HTMLDivElement;
  let root: Root;
  const noop = () => {};

  beforeEach(async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('pantheonAssets', undefined);
    useStore.setState({
      settings: { ...initialState.settings, buttonColorMode: mode },
      progress: {
        ...structuredClone(defaultGameState.progress),
        forgeOfTranscendenceUnlocked: false,
        transcendentCollection: {},
        ownedAbilities: {},
        achievementUnlocks: {},
        achievementClaims: {},
      },
    });
    applyUiPalette(getUiColorModePalette(DEFAULT_WARM_PALETTE, mode));
    await loadMainMenuBackgroundEntries(true);
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
    vi.restoreAllMocks();
  });

  async function openBackgrounds() {
    await act(async () => root.render(createElement(PlayerInformationPage, {
      onClose: noop, onSave: noop, onWipe: noop,
    })));
    const tab = Array.from(container.querySelectorAll('nav button')).find(button =>
      button.textContent?.includes('Swap splash background art'),
    )!;
    await act(async () => tab.click());
  }

  it('shows all seven background requirements and honest pending previews without enabling locked rewards', async () => {
    vi.spyOn(backgroundRewards, 'getBundledCustomBackgroundArt').mockReturnValue(undefined);
    await loadMainMenuBackgroundEntries(true);
    await openBackgrounds();
    for (const reward of rewards) {
      const tile = container.querySelector<HTMLButtonElement>(`button[aria-label="${reward.name}"]`)!;
      expect(tile).not.toBeNull();
      expect(tile.disabled).toBe(true);
      expect(tile.textContent).toContain(reward.requirement);
      expect(tile.textContent).toContain('Transcendent background achievement');
      expect(tile.textContent).toContain('Artwork pending');
      expect(tile.querySelector('[style*="background-image"]')).toBeNull();
    }
  });

  it('shows an earned pending reward without letting it equip unrelated artwork', async () => {
    vi.spyOn(backgroundRewards, 'getBundledCustomBackgroundArt').mockReturnValue(undefined);
    await loadMainMenuBackgroundEntries(true);
    useStore.setState({ progress: { ...useStore.getState().progress, forgeOfTranscendenceUnlocked: true } });
    await openBackgrounds();
    const tile = container.querySelector<HTMLButtonElement>(`button[aria-label="${rewards[0].name}"]`)!;
    expect(tile.textContent).toContain('Earned - art pending');
    expect(tile.disabled).toBe(true);
    const selected = useStore.getState().progress.profile.mainMenuBackgroundId;
    await act(async () => tile.click());
    expect(useStore.getState().progress.profile.mainMenuBackgroundId).toBe(selected);
  });

  it('previews installed art but prevents locked rewards from being equipped', async () => {
    await openBackgrounds();
    for (const reward of rewards) {
      const tile = container.querySelector<HTMLButtonElement>(`button[aria-label="${reward.name}"]`)!;
      expect(tile.disabled).toBe(true);
      expect(tile.textContent).toContain('Locked');
      expect(tile.textContent).not.toContain('Artwork pending');
      expect(tile.querySelector('[style*="background-image"]')?.getAttribute('style')).toContain(`${reward.artFileStem}.png`);
    }
  });

  it('equips every earned bundled image and saves its canonical background id', async () => {
    useStore.setState({ progress: {
      ...useStore.getState().progress,
      achievementUnlocks: Object.fromEntries(rewards.map(reward => [reward.achievementId, true])),
    } });
    await openBackgrounds();
    for (const reward of rewards) {
      const tile = container.querySelector<HTMLButtonElement>(`button[aria-label="${reward.name}"]`)!;
      expect(tile.disabled).toBe(false);
      await act(async () => tile.click());
      expect(useStore.getState().progress.profile.mainMenuBackgroundId).toBe(reward.id);
      expect(tile.textContent).toContain('Equipped');
    }
  });

  it('equips imported earned art and saves the canonical background id', async () => {
    vi.stubGlobal('pantheonAssets', {
      listMainMenuBackgrounds: async () => [{
        id: 'workspace:reward.png', name: `${rewards[0].artFileStem}.png`, url: '/test-reward.png',
      }],
    });
    await loadMainMenuBackgroundEntries(true);
    useStore.setState({ progress: { ...useStore.getState().progress, forgeOfTranscendenceUnlocked: true } });
    await openBackgrounds();
    const tile = container.querySelector<HTMLButtonElement>(`button[aria-label="${rewards[0].name}"]`)!;
    expect(tile.disabled).toBe(false);
    await act(async () => tile.click());
    expect(useStore.getState().progress.profile.mainMenuBackgroundId).toBe(rewards[0].id);
    expect(tile.textContent).toContain('Equipped');
  });

  it('labels locked crown tiles and equips their original slot ids once earned', async () => {
    await openBackgrounds();
    for (const reward of CROWN_BACKGROUND_REWARDS) {
      const tile = container.querySelector<HTMLButtonElement>(`button[aria-label="${reward.name}"]`)!;
      expect(tile.disabled).toBe(true);
      expect(tile.textContent).toContain(reward.requirement);
      expect(tile.textContent).toContain(`${reward.rarity} background achievement`);
    }
    await act(async () => useStore.setState({ progress: {
      ...useStore.getState().progress,
      achievementUnlocks: Object.fromEntries(CROWN_BACKGROUND_REWARDS.map(reward => [reward.achievementId, true])),
    } }));
    for (const reward of CROWN_BACKGROUND_REWARDS) {
      const tile = container.querySelector<HTMLButtonElement>(`button[aria-label="${reward.name}"]`)!;
      expect(tile.disabled).toBe(false);
      await act(async () => tile.click());
      expect(useStore.getState().progress.profile.mainMenuBackgroundId).toBe(`main-menu-bg-slot-${reward.themeId}`);
    }
  });

  it('lists eleven named cosmetic rewards in the dedicated Achievements category', async () => {
    await act(async () => root.render(createElement(AchievementsModal, { onClose: noop })));
    const tab = Array.from(container.querySelectorAll('button')).find(button => button.textContent?.includes('Custom Backgrounds'))!;
    expect(tab).toBeDefined();
    await act(async () => tab.click());
    for (const reward of [...rewards, ...CROWN_BACKGROUND_REWARDS]) {
      expect(container.textContent).toContain(reward.name);
      expect(container.textContent).toContain(reward.requirement);
      expect(container.textContent).toContain(`${reward.rarity} main menu background: ${reward.name}`);
    }
    expect(container.textContent).toContain('Background + Title');
    expect(container.textContent).not.toContain('+0');
    expect(Array.from(container.querySelectorAll('button')).filter(button => button.textContent === 'Locked')).toHaveLength(11);
  });
});
