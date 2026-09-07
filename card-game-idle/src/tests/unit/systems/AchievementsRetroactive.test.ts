import { describe, expect, it } from 'vitest';
import { defaultGameState } from '@/state/store';
import {
  isAchievementUnlocked,
  listAchievements,
  summarizeAchievements,
} from '@/systems/progression/achievements';

function cloneProgress() {
  return JSON.parse(JSON.stringify(defaultGameState.progress)) as typeof defaultGameState.progress;
}

describe('achievements retroactive unlocking', () => {
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

  it('does not treat ordinary Infinite ownership as a crafted Infinity card', () => {
    const progress = cloneProgress();
    progress.collection['inf-oblivion-absolute'] = 1;

    expect(isAchievementUnlocked(progress, 'title-first-infinite')).toBe(false);
  });
});
