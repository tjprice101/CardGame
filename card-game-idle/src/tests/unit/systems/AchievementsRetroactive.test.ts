import { describe, expect, it } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
import type { GameState } from '@/types/game';
import {
  isAchievementUnlocked,
  listAchievements,
  summarizeAchievements,
} from '@/systems/progression/achievements';
import { TITLE_BADGES } from '@/data/profile/titleBadges';

function cloneProgress() {
  return JSON.parse(JSON.stringify(defaultGameState.progress)) as typeof defaultGameState.progress;
}

describe('achievements retroactive unlocking', () => {
  it('lists every title from the profile registry in the achievement catalogue', () => {
    const achievementIds = listAchievements(cloneProgress()).map(achievement => achievement.id);
    expect(achievementIds).toEqual(TITLE_BADGES.map(title => title.id));
  });

  it('unlocks achievements retroactively when criteria is already met', () => {
    const progress = cloneProgress();
    progress.totalCardsPlayed = 1;

    expect(isAchievementUnlocked(progress, 'title-first-play')).toBe(true);
  });

  it('keeps latched achievements unlocked even if current snapshot is below threshold', () => {
    const progress = cloneProgress();
    progress.totalCardsPlayed = 0;
    progress.achievementUnlocks = { 'title-first-play': true };

    const firstPlay = listAchievements(progress).find(a => a.id === 'title-first-play');
    expect(firstPlay?.unlocked).toBe(true);

    const summary = summarizeAchievements(progress);
    expect(summary.unlocked).toBeGreaterThan(0);
  });

  it('recognizes current late-game rarity progression', () => {
    const progress = cloneProgress();
    progress.collection['btei-voids-reaping'] = 1;
    progress.collection['enig-neutral-lumen-genesis'] = 1;
    progress.transcendentCollection = { 'tx-neutral-starbound-glimmer': 1 };

    expect(isAchievementUnlocked(progress, 'title-first-eternal')).toBe(true);
    expect(isAchievementUnlocked(progress, 'title-first-enigmatic')).toBe(true);
    expect(isAchievementUnlocked(progress, 'title-transcendent-caller')).toBe(false);
  });

  it('recognizes Forge unlock, Shard, and each Transcendent card achievement', () => {
    const progress = cloneProgress();
    progress.forgeOfTranscendenceUnlocked = true;
    progress.shardsOfTranscendence = 25;
    progress.transcendentCollection = {
      'tx-neutral-starbound-glimmer': 1,
      'tx-neutral-null-catalyst': 1,
      'tx-neutral-void-reliquary': 1,
      'tx-angel-starbound-null-archangel': 1,
    };

    expect(isAchievementUnlocked(progress, 'title-forge-unsealed')).toBe(true);
    expect(isAchievementUnlocked(progress, 'title-transcendence-shardbearer')).toBe(true);
    expect(isAchievementUnlocked(progress, 'title-light-before-stars')).toBe(true);
    expect(isAchievementUnlocked(progress, 'title-first-catalyst')).toBe(true);
    expect(isAchievementUnlocked(progress, 'title-all-and-nothing')).toBe(true);
    expect(isAchievementUnlocked(progress, 'title-between-light-life')).toBe(true);
    expect(isAchievementUnlocked(progress, 'title-forge-pantheon-complete')).toBe(true);
  });

  it('does not treat ordinary Infinite ownership as a crafted Infinity card', () => {
    const progress = cloneProgress();
    progress.collection['inf-oblivion-absolute'] = 1;

    expect(isAchievementUnlocked(progress, 'title-first-infinite')).toBe(false);
  });

  it('claims every unlocked reward in one atomic action', () => {
    const base = structuredClone(defaultGameState) as GameState;
    base.progress.totalCardsPlayed = 50;
    useStore.setState(state => ({ ...state, ...base }));

    const result = useStore.getState().claimAllAchievements();
    expect(result.count).toBeGreaterThanOrEqual(3);
    expect(result.shards).toBeGreaterThan(0);
    expect(result.divineLight).toBeGreaterThan(0);
    expect(summarizeAchievements(useStore.getState().progress).claimed).toBe(result.count);
    expect(useStore.getState().claimAllAchievements().count).toBe(0);
  });
});
