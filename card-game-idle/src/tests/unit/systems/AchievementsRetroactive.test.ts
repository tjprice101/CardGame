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
});
