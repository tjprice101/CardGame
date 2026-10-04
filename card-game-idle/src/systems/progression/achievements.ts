import type { ProgressState } from '@/types/game';
import { TITLE_BADGES, type TitleBadgeDefinition } from '@/data/profile/titleBadges';
import { CUSTOM_MAIN_MENU_BACKGROUND_REWARDS } from '@/data/profile/customMainMenuBackgrounds';
import { CROWN_BACKGROUND_REWARDS } from '@/data/profile/crownBackgroundRewards';

/**
 * Achievement tracker — derives a list of claimable achievements from the
 * existing title-badge registry. Each unlocked title can be claimed once;
 * background achievements are cosmetic-only. Claim state is persisted under
 * `progress.achievementClaims` (added in save v11 alongside quests).
 *
 * Pure module — no state, no side effects.
 */

const SHARDS_BY_GROUP: Record<TitleBadgeDefinition['group'], number> = {
  milestone: 50,
  boss: 25,
  infinite: 75,
  set: 100,
  background: 0,
};

const DIVINE_LIGHT_BY_GROUP: Record<TitleBadgeDefinition['group'], number> = {
  milestone: 5_000,
  boss: 2_500,
  infinite: 10_000,
  set: 15_000,
  background: 0,
};

export interface AchievementView {
  id: string;
  text: string;
  description: string;
  group: TitleBadgeDefinition['group'];
  unlocked: boolean;
  claimed: boolean;
  shardReward: number;
  divineLightReward: number;
  imageAssetKey?: string;
  backgroundReward?: { name: string; rarity: 'Legendary' | 'Eternal' | 'Infinite' | 'Transcendent' };
}

export function getAchievementShardReward(group: TitleBadgeDefinition['group']): number {
  return SHARDS_BY_GROUP[group] ?? 25;
}

export function getAchievementDivineLightReward(group: TitleBadgeDefinition['group']): number {
  return DIVINE_LIGHT_BY_GROUP[group] ?? 0;
}

export function isAchievementUnlocked(progress: ProgressState, achievementId: string): boolean {
  if (progress.achievementUnlocks?.[achievementId]) return true;
  const badge = TITLE_BADGES.find(entry => entry.id === achievementId);
  if (!badge) return false;
  return badge.isUnlocked(progress);
}

export function listAchievements(progress: ProgressState): AchievementView[] {
  const claims = progress.achievementClaims ?? {};
  return TITLE_BADGES.map(badge => {
    const unlocked = isAchievementUnlocked(progress, badge.id);
    const background = CUSTOM_MAIN_MENU_BACKGROUND_REWARDS.find(entry => entry.achievementId === badge.id)
      ?? CROWN_BACKGROUND_REWARDS.find(entry => entry.achievementId === badge.id);
    return {
      id: badge.id,
      text: badge.text,
      description: badge.description,
      group: badge.group,
      unlocked,
      claimed: !!claims[badge.id],
      shardReward: getAchievementShardReward(badge.group),
      divineLightReward: getAchievementDivineLightReward(badge.group),
      imageAssetKey: badge.imageAssetKey,
      backgroundReward: background ? { name: background.name, rarity: background.rarity } : undefined,
    };
  });
}

export interface AchievementProgressSummary {
  total: number;
  unlocked: number;
  claimed: number;
  unclaimedShards: number;
}

export function summarizeAchievements(progress: ProgressState): AchievementProgressSummary {
  const claims = progress.achievementClaims ?? {};
  let unlocked = 0;
  let claimed = 0;
  let unclaimedShards = 0;
  for (const badge of TITLE_BADGES) {
    const isUnlocked = isAchievementUnlocked(progress, badge.id);
    if (isUnlocked) unlocked++;
    if (claims[badge.id]) claimed++;
    if (isUnlocked && !claims[badge.id]) unclaimedShards += getAchievementShardReward(badge.group);
  }
  return { total: TITLE_BADGES.length, unlocked, claimed, unclaimedShards };
}
