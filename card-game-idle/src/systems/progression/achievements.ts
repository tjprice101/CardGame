import type { ProgressState } from '@/types/game';
import { TITLE_BADGES, type TitleBadgeDefinition } from '@/data/profile/titleBadges';

/**
 * Achievement tracker — derives a list of claimable achievements from the
 * existing title-badge registry. Each unlocked title can be claimed once for
 * a small shard reward. Claim state is persisted under
 * `progress.achievementClaims` (added in save v11 alongside quests).
 *
 * Pure module — no state, no side effects.
 */

const SHARDS_BY_GROUP: Record<TitleBadgeDefinition['group'], number> = {
  milestone: 50,
  boss: 25,
  infinite: 75,
  set: 100,
};

export interface AchievementView {
  id: string;
  text: string;
  description: string;
  group: TitleBadgeDefinition['group'];
  unlocked: boolean;
  claimed: boolean;
  shardReward: number;
}

export function getAchievementShardReward(group: TitleBadgeDefinition['group']): number {
  return SHARDS_BY_GROUP[group] ?? 25;
}

export function listAchievements(progress: ProgressState): AchievementView[] {
  const claims = progress.achievementClaims ?? {};
  return TITLE_BADGES.map(badge => {
    const unlocked = badge.isUnlocked(progress);
    return {
      id: badge.id,
      text: badge.text,
      description: badge.description,
      group: badge.group,
      unlocked,
      claimed: !!claims[badge.id],
      shardReward: getAchievementShardReward(badge.group),
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
    const isUnlocked = badge.isUnlocked(progress);
    if (isUnlocked) unlocked++;
    if (claims[badge.id]) claimed++;
    if (isUnlocked && !claims[badge.id]) unclaimedShards += getAchievementShardReward(badge.group);
  }
  return { total: TITLE_BADGES.length, unlocked, claimed, unclaimedShards };
}
