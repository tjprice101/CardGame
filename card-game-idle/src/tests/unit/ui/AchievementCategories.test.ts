import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TITLE_BADGES } from '@/data/profile/titleBadges';
import { CUSTOM_MAIN_MENU_BACKGROUND_REWARDS } from '@/data/profile/customMainMenuBackgrounds';
import { CROWN_BACKGROUND_REWARDS } from '@/data/profile/crownBackgroundRewards';
import { ACHIEVEMENT_CATEGORIES, getAchievementCategory } from '@/systems/progression/achievementCategories';
import { listAchievements, summarizeAchievements } from '@/systems/progression/achievements';
import { defaultGameState, useStore } from '@/state/store';
import AchievementsModal from '@/ui/menus/AchievementsModal';
import { applyUiPalette, DEFAULT_WARM_PALETTE, getUiColorModePalette, resetUiPalette } from '@/ui/theme';

describe('achievement presentation taxonomy', () => {
  it('places every registered achievement in exactly one populated category', () => {
    const categories = TITLE_BADGES.map(getAchievementCategory);
    expect(new Set(ACHIEVEMENT_CATEGORIES.map(category => category.id)).size).toBe(20);
    for (const category of ACHIEVEMENT_CATEGORIES) {
      expect(categories.filter(id => id === category.id).length).toBeGreaterThan(0);
    }
    expect(categories).toHaveLength(TITLE_BADGES.length);
    expect(getAchievementCategory({ id: 'title-forge-unsealed', group: 'milestone' })).toBe('forge');
    expect(getAchievementCategory({ id: 'title-first-materialization', group: 'milestone' })).toBe('abilities');
    expect(getAchievementCategory({ id: 'title-first-infinite', group: 'milestone' })).toBe('infinite');
  });

  it('keeps cosmetic rewards isolated and original currency rewards intact', () => {
    const achievements = listAchievements(defaultGameState.progress);
    const backgrounds = achievements.filter(a => getAchievementCategory(a) === 'background');
    expect(backgrounds.map(a => a.id)).toEqual([...CUSTOM_MAIN_MENU_BACKGROUND_REWARDS, ...CROWN_BACKGROUND_REWARDS].map(a => a.achievementId));
    expect(backgrounds.every(a => a.shardReward === 0 && a.divineLightReward === 0)).toBe(true);
    const forge = achievements.find(a => a.id === 'title-forge-unsealed')!;
    expect(forge.group).toBe('milestone');
    expect(forge.shardReward).toBe(50);
    expect(forge.divineLightReward).toBe(5_000);
    expect(summarizeAchievements(defaultGameState.progress).total).toBe(achievements.length);
  });

  it('reports unclassified milestones explicitly instead of hiding them', () => {
    expect(() => getAchievementCategory({ id: 'unclassified', group: 'milestone' }))
      .toThrow('Missing achievement category: unclassified');
  });
});

describe.each(['light', 'dark'] as const)('organized achievements in %s mode', mode => {
  const initialState = useStore.getState();
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    useStore.setState({
      settings: { ...initialState.settings, buttonColorMode: mode },
      progress: {
        ...structuredClone(defaultGameState.progress),
        achievementClaims: {},
        achievementUnlocks: {},
        forgeOfTranscendenceUnlocked: false,
      },
    });
    applyUiPalette(getUiColorModePalette(DEFAULT_WARM_PALETTE, mode));
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root.render(createElement(AchievementsModal, { onClose: () => {} })));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    useStore.setState(initialState, true);
    resetUiPalette();
    vi.unstubAllGlobals();
  });

  async function selectCategory(label: string) {
    const button = Array.from(container.querySelectorAll<HTMLButtonElement>('nav button'))
      .find(entry => entry.getAttribute('aria-label') === label)!;
    await act(async () => button.click());
    expect(button.getAttribute('aria-pressed')).toBe('true');
  }

  async function search(value: string) {
    const input = container.querySelector<HTMLInputElement>('input[type="search"]')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  async function selectStatus(value: string) {
    const select = container.querySelector<HTMLSelectElement>('select')!;
    await act(async () => {
      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  it('groups the complete inventory under section headings without duplicates', () => {
    const rows = Array.from(container.querySelectorAll<HTMLElement>('[data-achievement-id]'));
    expect(rows).toHaveLength(TITLE_BADGES.length);
    expect(new Set(rows.map(row => row.dataset.achievementId)).size).toBe(TITLE_BADGES.length);
    expect(container.querySelectorAll('section')).toHaveLength(20);
    for (const section of ['Gameplay', 'Collection', 'Battles', 'Progression', 'Social', 'Cosmetics']) {
      expect(container.querySelector('nav')?.textContent).toContain(section);
    }
  });

  it('uses readable theme text without blurred shadows for the header summary', () => {
    const palette = getUiColorModePalette(DEFAULT_WARM_PALETTE, mode);
    const expected = document.createElement('span');
    const stats = container.querySelectorAll<HTMLElement>('.achievement-summary-stat');
    expect(stats.length).toBeGreaterThanOrEqual(2);
    for (const stat of stats) {
      const label = stat.children[0] as HTMLElement;
      const value = stat.children[1] as HTMLElement;
      expected.style.color = palette.text;
      expect(label.style.color).toBe(expected.style.color);
      expect(value.style.color).toBe(expected.style.color);
      expect(label.style.fontSize).toBe('11px');
      expect(label.style.letterSpacing).toBe('1px');
      expect(label.style.textShadow).toBe('');
      expect(value.style.textShadow).toBe('');
      const sub = value.querySelector('span');
      if (sub) {
        expected.style.color = palette.textMuted;
        expect(sub.style.color).toBe(expected.style.color);
      }
    }
  });

  it('shows all fourteen background unlocks in their own category', async () => {
    await selectCategory('Custom Backgrounds');
    expect(container.querySelectorAll('[data-achievement-id]')).toHaveLength(14);
    expect(container.querySelector('h2')?.textContent).toBe('Cosmetics / Custom Backgrounds');
    for (const reward of CUSTOM_MAIN_MENU_BACKGROUND_REWARDS) {
      expect(container.querySelector(`[data-achievement-id="${reward.achievementId}"]`)?.textContent).toContain(reward.name);
    }
    expect(container.querySelector('[data-achievement-id="title-forge-unsealed"]')).toBeNull();
  });

  it('combines category and requirement search and provides a recoverable empty state', async () => {
    await selectCategory('Forge & Transcendence');
    await search('25 Shards of Transcendence');
    expect(container.querySelectorAll('[data-achievement-id]')).toHaveLength(1);
    expect(container.querySelector('[data-achievement-id="title-transcendence-shardbearer"]')).not.toBeNull();
    await search('not-an-achievement');
    expect(container.querySelectorAll('[data-achievement-id]')).toHaveLength(0);
    expect(container.textContent).toContain('No achievements match these filters');
    await search('');
    expect(container.querySelectorAll('[data-achievement-id]')).toHaveLength(10);
  });

  it('searches actual background reward names across the all view', async () => {
    await search(CUSTOM_MAIN_MENU_BACKGROUND_REWARDS[0].name);
    expect(container.querySelectorAll('[data-achievement-id]')).toHaveLength(1);
    expect(container.querySelector('h2')?.textContent).toBe('Cosmetics / Custom Backgrounds');
  });

  it('filters claim states and preserves real claim rewards and saved IDs', async () => {
    await selectCategory('Card Play');
    await selectStatus('claimable');
    const row = container.querySelector('[data-achievement-id="title-newborn"]')!;
    const before = useStore.getState().progress;
    await act(async () => row.querySelector<HTMLButtonElement>('button')!.click());
    const after = useStore.getState().progress;
    expect(after.achievementClaims?.['title-newborn']).toBeTruthy();
    expect(after.aberratedShards).toBe(before.aberratedShards + 50);
    expect(after.divineLight).toBe(before.divineLight + 5_000);
    expect(container.querySelector('[data-achievement-id="title-newborn"]')).toBeNull();
    await selectStatus('claimed');
    expect(container.querySelector('[data-achievement-id="title-newborn"] button')?.textContent).toContain('Done');
    await selectStatus('locked');
    expect(container.querySelector('[data-achievement-id="title-newborn"]')).toBeNull();
    expect(container.querySelectorAll('[data-achievement-id]')).toHaveLength(7);
  });
});
