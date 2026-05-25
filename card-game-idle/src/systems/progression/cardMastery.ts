import type { ProgressState } from '@/types/game';
import { CardRegistry } from '@/cards/CardRegistry';

/**
 * Per-card play-count mastery system. Counts increment each time a card is
 * played from hand (any type). Thresholds award shards on claim — the player
 * can claim each tier once.
 *
 * Claim state is stored as a packed string key:
 *   `${definitionId}::${tier}` -> true
 * inside `progress.cardMasteryClaims` (save v12).
 */

export interface MasteryTier {
  /** 1-indexed tier number for clarity. */
  tier: number;
  threshold: number;
  shardReward: number;
  label: string;
}

export const MASTERY_TIERS: MasteryTier[] = [
  { tier: 1, threshold: 25, shardReward: 10, label: 'Practiced' },
  { tier: 2, threshold: 100, shardReward: 25, label: 'Veteran' },
  { tier: 3, threshold: 500, shardReward: 75, label: 'Master' },
  { tier: 4, threshold: 2_500, shardReward: 200, label: 'Eternal Bond' },
];

export function getMasteryClaimKey(definitionId: string, tier: number): string {
  return `${definitionId}::${tier}`;
}

export interface MasteryView {
  definitionId: string;
  name: string;
  count: number;
  /** Highest reached tier number, or 0 if none. */
  reachedTier: number;
  /** Next tier the player has not reached yet, or null. */
  nextTier: MasteryTier | null;
  /** Unclaimed reached tiers (player can claim each one once). */
  unclaimedTiers: MasteryTier[];
}

export function getMasteryForCard(progress: ProgressState, definitionId: string): MasteryView {
  const counts = progress.cardPlayCounts ?? {};
  const claims = progress.cardMasteryClaims ?? {};
  const count = counts[definitionId] ?? 0;
  const def = CardRegistry.get(definitionId);
  let reachedTier = 0;
  let nextTier: MasteryTier | null = null;
  const unclaimedTiers: MasteryTier[] = [];
  for (const tier of MASTERY_TIERS) {
    if (count >= tier.threshold) {
      reachedTier = tier.tier;
      if (!claims[getMasteryClaimKey(definitionId, tier.tier)]) {
        unclaimedTiers.push(tier);
      }
    } else if (nextTier === null) {
      nextTier = tier;
    }
  }
  return {
    definitionId,
    name: def?.name ?? definitionId,
    count,
    reachedTier,
    nextTier,
    unclaimedTiers,
  };
}

/** All cards with any play-count > 0, sorted by count desc. */
export function listMasteryProgress(progress: ProgressState): MasteryView[] {
  const counts = progress.cardPlayCounts ?? {};
  const result: MasteryView[] = [];
  for (const defId of Object.keys(counts)) {
    if ((counts[defId] ?? 0) <= 0) continue;
    result.push(getMasteryForCard(progress, defId));
  }
  result.sort((a, b) => b.count - a.count);
  return result;
}

export function totalUnclaimedMasteryShards(progress: ProgressState): number {
  let total = 0;
  for (const view of listMasteryProgress(progress)) {
    for (const tier of view.unclaimedTiers) total += tier.shardReward;
  }
  return total;
}
