import type { ProgressState } from '@/types/game';
import { isThemeUnlocked } from './uiThemes';

export const CROWN_BACKGROUND_REWARDS = [
  { themeId: 'theme-reward-eternal-neutrality', achievementId: 'title-background-eternal-neutrality', name: 'Neutrality Eternal Crown Splash', requirement: 'Own every Eternal Neutrality card.', rarity: 'Eternal' },
  { themeId: 'theme-reward-infinite-neutrality', achievementId: 'title-background-infinite-neutrality', name: 'Neutrality Infinite Crown Splash', requirement: 'Own every Infinite Neutrality card.', rarity: 'Infinite' },
  { themeId: 'theme-reward-eternal-causality', achievementId: 'title-background-eternal-causality', name: 'Causality Eternal Crown Splash', requirement: 'Own every Eternal Causality card.', rarity: 'Eternal' },
  { themeId: 'theme-reward-infinite-causality', achievementId: 'title-background-infinite-causality', name: 'Causality Infinite Crown Splash', requirement: 'Own every Infinite Causality card.', rarity: 'Infinite' },
] as const;

export function isCrownBackgroundUnlocked(
  reward: typeof CROWN_BACKGROUND_REWARDS[number],
  progress: ProgressState,
): boolean {
  return progress.achievementUnlocks?.[reward.achievementId] === true
    || isThemeUnlocked(reward.themeId, progress);
}
