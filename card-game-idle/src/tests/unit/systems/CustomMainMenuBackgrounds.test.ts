import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defaultGameState, useStore } from '@/state/store';
import { transcendentCardDefinitions } from '@/data/ascension/transcendentCards';
import { ABILITY_DEFINITIONS } from '@/data/abilities/abilityDefinitions';
import {
  CUSTOM_MAIN_MENU_BACKGROUND_REWARDS,
  findCustomBackgroundReward,
  isCustomBackgroundRewardUnlocked,
} from '@/data/profile/customMainMenuBackgrounds';
import {
  DEFAULT_MAIN_MENU_BACKGROUND_ID,
  isMainMenuBackgroundAvailable,
  isMainMenuBackgroundUnlocked,
  loadMainMenuBackgroundEntries,
  resolveMainMenuBackground,
} from '@/data/profile/mainMenuBackgrounds';
import { listAchievements, isAchievementUnlocked } from '@/systems/progression/achievements';
import { TITLE_BADGE_BY_ID } from '@/data/profile/titleBadges';
import * as backgroundRewards from '@/data/profile/customMainMenuBackgrounds';

const rewards = CUSTOM_MAIN_MENU_BACKGROUND_REWARDS;
const volumeOne = transcendentCardDefinitions.filter(card => card.subset === 'Vol. 1');
const forgeAbilities = ABILITY_DEFINITIONS.filter(ability => ability.setId === 'Transcendent');
const initialState = useStore.getState();

function progress() {
  const result = structuredClone(defaultGameState.progress);
  result.forgeOfTranscendenceUnlocked = false;
  result.transcendentCollection = {};
  result.ownedAbilities = {};
  result.achievementUnlocks = {};
  result.achievementClaims = {};
  return result;
}

afterEach(() => {
  useStore.setState(initialState, true);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Transcendent background achievements', () => {
  it('registers seven unique cosmetic achievements and links every background to its title', () => {
    expect(rewards).toHaveLength(7);
    expect(new Set(rewards.map(reward => reward.id)).size).toBe(7);
    expect(new Set(rewards.map(reward => reward.achievementId)).size).toBe(7);
    const entries = listAchievements(progress()).filter(achievement => rewards.some(reward => reward.achievementId === achievement.id));
    expect(entries).toHaveLength(7);
    for (const reward of rewards) {
      expect(TITLE_BADGE_BY_ID[reward.achievementId].description).toBe(reward.requirement);
      expect(entries.find(entry => entry.id === reward.achievementId)).toMatchObject({
        unlocked: false, claimed: false, shardReward: 0, divineLightReward: 0,
        backgroundReward: { name: reward.name, rarity: 'Transcendent' },
      });
    }
  });

  it('provides exactly seven matching widescreen Splotched Ink prompts in the art file', () => {
    const art = readFileSync(join(process.cwd(), '..', 'Midjourney Art', 'Custom Main Menu Backgrounds.md'), 'utf8');
    const prompts = [...art.matchAll(/```text\r?\n([\s\S]*?)\r?\n```/g)].map(match => match[1]);
    expect(prompts).toHaveLength(7);
    for (const reward of rewards) {
      expect(art).toContain(reward.name);
      expect(art).toContain(`${reward.artFileStem}.png`);
    }
    for (const prompt of prompts) {
      expect(prompt).toContain('--ar 16:9');
      expect(prompt).toContain('--niji 6 --stylize 900');
      expect(prompt).toContain('distressed parchment-white');
      expect(prompt).toContain('splotched dry-brush');
      expect(prompt).toContain('ink');
      expect(prompt).toContain('scarlet');
    }
  });

  it('unlocks the Forge reward only from the real Forge unlock flag', () => {
    const p = progress();
    p.divineLight = 1_000_000_000;
    p.transcendentCollection = { [volumeOne[0].definitionId]: 1 };
    expect(isCustomBackgroundRewardUnlocked(rewards[0], p)).toBe(false);
    p.forgeOfTranscendenceUnlocked = true;
    expect(isCustomBackgroundRewardUnlocked(rewards[0], p)).toBe(true);
  });

  it('requires positive Volume I ownership and all four distinct cards, not duplicates or unrelated IDs', () => {
    expect(volumeOne).toHaveLength(4);
    const p = progress();
    p.transcendentCollection = { unrelated: 100, [volumeOne[0].definitionId]: 0 };
    expect(isCustomBackgroundRewardUnlocked(rewards[1], p)).toBe(false);
    p.transcendentCollection[volumeOne[0].definitionId] = 100;
    expect(isCustomBackgroundRewardUnlocked(rewards[1], p)).toBe(true);
    expect(isCustomBackgroundRewardUnlocked(rewards[2], p)).toBe(false);
    for (const card of volumeOne.slice(1, 3)) p.transcendentCollection[card.definitionId] = 1;
    expect(isCustomBackgroundRewardUnlocked(rewards[2], p)).toBe(false);
    p.transcendentCollection[volumeOne[3].definitionId] = 1;
    expect(isCustomBackgroundRewardUnlocked(rewards[2], p)).toBe(true);
  });

  it.each(forgeAbilities)('unlocks exactly the matching background when $name is acquired', ability => {
    const p = progress();
    p.transcendentCollection = Object.fromEntries(volumeOne.map(card => [card.definitionId, 1]));
    expect(rewards.slice(3).filter(reward => isCustomBackgroundRewardUnlocked(reward, p))).toHaveLength(0);
    p.ownedAbilities = { [ability.id]: true };
    const earned = rewards.slice(3).filter(reward => isCustomBackgroundRewardUnlocked(reward, p));
    expect(earned).toHaveLength(1);
    expect(earned[0].requirement).toContain(ability.name);
    expect(isAchievementUnlocked(p, earned[0].achievementId)).toBe(true);
  });

  it('unlocks retroactively on load and retains earned rewards after a save round trip', () => {
    const game = structuredClone(defaultGameState);
    game.progress = progress();
    game.progress.forgeOfTranscendenceUnlocked = true;
    game.progress.transcendentCollection = Object.fromEntries(volumeOne.map(card => [card.definitionId, 1]));
    game.progress.ownedAbilities = Object.fromEntries(forgeAbilities.map(ability => [ability.id, true]));
    useStore.getState().loadState(game);
    for (const reward of rewards) expect(useStore.getState().progress.achievementUnlocks?.[reward.achievementId]).toBe(true);
    const reloaded = structuredClone(defaultGameState);
    reloaded.progress = JSON.parse(JSON.stringify(useStore.getState().progress));
    reloaded.progress.forgeOfTranscendenceUnlocked = false;
    reloaded.progress.transcendentCollection = {};
    reloaded.progress.ownedAbilities = {};
    useStore.getState().loadState(reloaded);
    for (const reward of rewards) {
      expect(isCustomBackgroundRewardUnlocked(reward, useStore.getState().progress)).toBe(true);
      expect(TITLE_BADGE_BY_ID[reward.achievementId].isUnlocked(useStore.getState().progress)).toBe(true);
    }
  });

  it('claims cosmetic achievements once without adding currency and preserves existing Forge payouts', () => {
    useStore.setState({ progress: {
      ...progress(), forgeOfTranscendenceUnlocked: true, divineLight: 12345, aberratedShards: 321,
    } });
    const claim = useStore.getState().claimAchievement(rewards[0].achievementId);
    expect(claim).toEqual({ shards: 0, divineLight: undefined });
    expect(useStore.getState().progress.divineLight).toBe(12345);
    expect(useStore.getState().progress.aberratedShards).toBe(321);
    expect(useStore.getState().claimAchievement(rewards[0].achievementId)).toBeNull();
    expect(isCustomBackgroundRewardUnlocked(rewards[0], useStore.getState().progress)).toBe(true);
    const existingForge = listAchievements(useStore.getState().progress).find(entry => entry.id === 'title-forge-unsealed')!;
    expect(existingForge.shardReward).toBe(50);
    expect(existingForge.divineLightReward).toBe(5000);
  });
});

describe('background artwork loading and gates', () => {
  it('bundles all seven images under their achievement gates and resolves only earned selections', async () => {
    vi.stubGlobal('pantheonAssets', undefined);
    const entries = await loadMainMenuBackgroundEntries(true);
    for (const reward of rewards) {
      const entry = entries.find(candidate => candidate.id === reward.id)!;
      expect(entry.source).toBe('builtin');
      expect(entry.unlockAchievementId).toBe(reward.achievementId);
      expect(entry.imageUrl).toContain(`${reward.artFileStem}.png`);
      expect(isMainMenuBackgroundAvailable(entry)).toBe(true);
      expect(isMainMenuBackgroundUnlocked(entry, progress())).toBe(false);
      expect(resolveMainMenuBackground(entry.id, entries, progress()).id).toBe(DEFAULT_MAIN_MENU_BACKGROUND_ID);
      const earned = progress();
      earned.achievementUnlocks = { [reward.achievementId]: true };
      expect(resolveMainMenuBackground(entry.id, entries, earned).imageUrl).toBe(entry.imageUrl);
      const image = readFileSync(join(process.cwd(), 'src', 'assets', 'main-menu-backgrounds', `${reward.artFileStem}.png`));
      expect([...image.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    }
  });

  it('keeps unavailable artwork honest without substituting default art', async () => {
    vi.spyOn(backgroundRewards, 'getBundledCustomBackgroundArt').mockReturnValue(undefined);
    vi.stubGlobal('pantheonAssets', undefined);
    const entries = await loadMainMenuBackgroundEntries(true);
    for (const reward of rewards) {
      const entry = entries.find(candidate => candidate.id === reward.id)!;
      expect(entry.unlockAchievementId).toBe(reward.achievementId);
      expect(entry.imageUrl).toBe('');
      expect(isMainMenuBackgroundAvailable(entry)).toBe(false);
      expect(isMainMenuBackgroundUnlocked(entry, progress())).toBe(false);
      expect(resolveMainMenuBackground(entry.id, entries, progress()).id).toBe(DEFAULT_MAIN_MENU_BACKGROUND_ID);
    }
  });

  it('matches supported asset names and replaces slots without losing achievement gates', async () => {
    vi.stubGlobal('pantheonAssets', {
      listMainMenuBackgrounds: async () => [
        ...rewards.map(reward => ({ id: `workspace:${reward.artFileStem}.png`, name: `${reward.artFileStem}.png`, url: `file:///art/${reward.artFileStem}.png` })),
        { id: 'workspace:personal.png', name: 'personal.png', url: 'file:///art/personal.png' },
      ],
    });
    const entries = await loadMainMenuBackgroundEntries(true);
    const p = progress();
    for (const reward of rewards) {
      expect(entries.filter(entry => entry.id === reward.id)).toHaveLength(1);
      const entry = entries.find(candidate => candidate.id === reward.id)!;
      expect(entry.source).toBe('workspace');
      expect(entry.unlockAchievementId).toBe(reward.achievementId);
      expect(isMainMenuBackgroundAvailable(entry)).toBe(true);
      expect(isMainMenuBackgroundUnlocked(entry, p)).toBe(false);
      expect(resolveMainMenuBackground(entry.id, entries, p).id).toBe(DEFAULT_MAIN_MENU_BACKGROUND_ID);
      p.achievementUnlocks = { [reward.achievementId]: true };
      expect(resolveMainMenuBackground(entry.id, entries, p).id).toBe(reward.id);
      p.achievementUnlocks = {};
    }
    expect(isMainMenuBackgroundUnlocked(entries.find(entry => entry.id === 'workspace:personal.png')!, p)).toBe(true);
    expect(findCustomBackgroundReward('FORGE_UNSEALED_IMPOSSIBLE.webp')?.id).toBe(rewards[0].id);
    expect(findCustomBackgroundReward('unknown.png')).toBeUndefined();
  });

  it('surfaces asset-loader failures and allows a later retry', async () => {
    const list = vi.fn().mockRejectedValueOnce(new Error('disk unavailable')).mockResolvedValueOnce([]);
    vi.stubGlobal('pantheonAssets', { listMainMenuBackgrounds: list });
    await expect(loadMainMenuBackgroundEntries(true)).rejects.toThrow('Unable to load imported main menu backgrounds.');
    const retry = await loadMainMenuBackgroundEntries();
    expect(retry.filter(entry => entry.unlockAchievementId)).toHaveLength(11);
    expect(list).toHaveBeenCalledTimes(2);
  });
});
