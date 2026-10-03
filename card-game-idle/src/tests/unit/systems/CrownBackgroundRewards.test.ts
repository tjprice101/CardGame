import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
import { CROWN_BACKGROUND_REWARDS } from '@/data/profile/crownBackgroundRewards';
import { getRewardThemeSeed, isThemeUnlocked } from '@/data/profile/uiThemes';
import { loadMainMenuBackgroundEntries, isMainMenuBackgroundUnlocked, resolveMainMenuBackground } from '@/data/profile/mainMenuBackgrounds';
import { listAchievements } from '@/systems/progression/achievements';

const initial = useStore.getState();
afterEach(() => { useStore.setState(initial, true); vi.unstubAllGlobals(); });

describe('set crown background achievements', () => {
  it.each(CROWN_BACKGROUND_REWARDS)('matches $name to its exact ownership gate and preserves earned claims', async reward => {
    vi.stubGlobal('pantheonAssets', undefined);
    const game = structuredClone(defaultGameState);
    const p = game.progress;
    p.collection = {};
    p.infiniteCollection = {};
    p.achievementUnlocks = {};
    p.achievementClaims = {};
    p.profile.unlockedUiThemeIds = [];
    p.everCollection = {};
    p.everInfiniteCollection = {};
    const seed = getRewardThemeSeed(reward.themeId)!;
    const entries = await loadMainMenuBackgroundEntries(true);
    const entry = entries.find(item => item.unlockThemeId === reward.themeId)!;
    expect(entry.id).toBe(`main-menu-bg-slot-${reward.themeId}`);
    expect(entry.unlockAchievementId).toBe(reward.achievementId);
    expect(entry.rarity).toBe(reward.rarity);
    expect(isMainMenuBackgroundUnlocked(entry, p)).toBe(false);
    const collection = seed.source === 'infinite' ? p.infiniteCollection : p.collection;
    for (const id of seed.ids.slice(1)) collection[id] = 1;
    expect(isThemeUnlocked(reward.themeId, p)).toBe(false);
    expect(listAchievements(p).find(a => a.id === reward.achievementId)?.unlocked).toBe(false);
    if (seed.ids.length > 0) {
      collection[seed.ids[0]] = 0;
      if (seed.ids.length > 1) collection[seed.ids[1]] = 999;
      expect(isThemeUnlocked(reward.themeId, p)).toBe(false);
      collection[seed.ids[0]] = 1;
    } else {
      // No live Neutrality Infinite cards are registered. Preserve the existing
      // historical theme latch rather than award an empty-set completion.
      expect(reward.themeId).toBe('theme-reward-infinite-neutrality');
      p.profile.unlockedUiThemeIds = [reward.themeId];
    }
    expect(isThemeUnlocked(reward.themeId, p)).toBe(true);
    for (const other of CROWN_BACKGROUND_REWARDS.filter(item => item.themeId !== reward.themeId)) {
      expect(listAchievements(p).find(a => a.id === other.achievementId)?.unlocked).toBe(false);
    }
    expect(isMainMenuBackgroundUnlocked(entry, p)).toBe(true);
    expect(resolveMainMenuBackground(entry.id, entries, p).id).toBe(entry.id);
    useStore.getState().loadState(game);
    expect(useStore.getState().progress.achievementUnlocks?.[reward.achievementId]).toBe(true);
    const before = useStore.getState().progress;
    expect(useStore.getState().claimAchievement(reward.achievementId)).toEqual({ shards: 0, divineLight: undefined });
    expect(useStore.getState().progress.divineLight).toBe(before.divineLight);
    expect(useStore.getState().progress.aberratedShards).toBe(before.aberratedShards);
    expect(useStore.getState().claimAchievement(reward.achievementId)).toBeNull();
    const restored = JSON.parse(JSON.stringify(useStore.getState().progress));
    restored.collection = {};
    restored.infiniteCollection = {};
    restored.everCollection = {};
    restored.everInfiniteCollection = {};
    restored.profile.unlockedUiThemeIds = [];
    expect(isMainMenuBackgroundUnlocked(entry, restored)).toBe(true);
    expect(listAchievements(restored).find(a => a.id === reward.achievementId)).toMatchObject({
      claimed: true, unlocked: true, backgroundReward: { name: reward.name, rarity: reward.rarity },
    });
  });

  it.each(CROWN_BACKGROUND_REWARDS)('retroactively awards $name from its permanent theme unlock', reward => {
    const game = structuredClone(defaultGameState);
    game.progress.profile.unlockedUiThemeIds = [reward.themeId];
    game.progress.achievementUnlocks = {};
    useStore.getState().loadState(game);
    expect(useStore.getState().progress.achievementUnlocks?.[reward.achievementId]).toBe(true);
  });

  it('retains crown gates when imported Causality art replaces a slot', async () => {
    const reward = CROWN_BACKGROUND_REWARDS[2];
    vi.stubGlobal('pantheonAssets', { listMainMenuBackgrounds: async () => [{
      id: 'workspace:crown', name: 'causality eternal card first acquisition splash screen.png', url: '/crown.png',
    }] });
    const entries = await loadMainMenuBackgroundEntries(true);
    const slot = entries.find(entry => entry.unlockThemeId === reward.themeId)!;
    expect(slot.source).toBe('workspace');
    expect(slot.unlockAchievementId).toBe(reward.achievementId);
    expect(slot.imageUrl).toBe('/crown.png');
  });
});
