import type { ProgressState } from '@/types/game';
import { CardRegistry } from '@/cards/CardRegistry';

/**
 * Per-card Card-light mastery system. Card-light increments each time a card
 * is played from hand (any type). Thresholds award shards on claim — the
 * player can claim each tier once.
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
  /** Points this card contributes to the Global Resonance Score when this tier is reached. */
  resonanceContribution: number;
}

export const MASTERY_TIERS: MasteryTier[] = [
  { tier: 1, threshold: 25,     shardReward: 10,    label: 'Practiced',     resonanceContribution: 1   },
  { tier: 2, threshold: 75,     shardReward: 25,    label: 'Veteran',       resonanceContribution: 3   },
  { tier: 3, threshold: 400,    shardReward: 75,    label: 'Master',        resonanceContribution: 8   },
  { tier: 4, threshold: 1_500,  shardReward: 200,   label: 'Eternal Bond',  resonanceContribution: 20  },
  { tier: 5, threshold: 3_000,  shardReward: 400,   label: 'Resonant',      resonanceContribution: 40  },
  { tier: 6, threshold: 6_000,  shardReward: 700,   label: 'Transcendent',  resonanceContribution: 80  },
  { tier: 7, threshold: 15_000, shardReward: 1_200, label: 'Ascendant',     resonanceContribution: 160 },
  { tier: 8, threshold: 30_000, shardReward: 2_000, label: 'Infinite Bond', resonanceContribution: 320 },
];

export interface MasteryRewardEntry {
  definitionId: string;
  currentCount: number;
  nextCount: number;
  appliedProgress: number;
  resonanceBefore: number;
  resonanceAfter: number;
  resonanceGain: number;
}

export interface MasteryRewardPreview {
  uniqueCards: number;
  totalAppliedProgress: number;
  resonanceGain: number;
  cardsTieredUp: number;
  entries: MasteryRewardEntry[];
}

export const MAX_MASTERY_PROGRESS_PER_CARD_BOSS = 20;

export function getBossBaseMasteryPerCard(bossIndex: number, totalBosses: number): number {
  const raw = Math.round(3 + (bossIndex / Math.max(1, totalBosses - 1)) * 32);
  return Math.min(MAX_MASTERY_PROGRESS_PER_CARD_BOSS, Math.max(1, raw));
}

export function getBossFightMasteryPerCard(
  bossIndex: number,
  totalBosses: number,
): number {
  const baseRaw = Math.round(3 + (bossIndex / Math.max(1, totalBosses - 1)) * 32);
  return Math.min(MAX_MASTERY_PROGRESS_PER_CARD_BOSS, Math.max(1, baseRaw));
}

export function getResonanceVictoryLine(masteryPerCard: number): string {
  return `Awards +${masteryPerCard} Card-light for each card in your deck upon completion.`;
}

function getReachedTierForCount(count: number): number {
  let reachedTier = 0;
  for (const tier of MASTERY_TIERS) {
    if (count >= tier.threshold) reachedTier = tier.tier;
  }
  return reachedTier;
}

export function getResonanceContributionForCount(count: number): number {
  let contribution = 0;
  for (const tier of MASTERY_TIERS) {
    if (count >= tier.threshold) contribution = tier.resonanceContribution;
  }
  return contribution;
}

// Module-level memo: skip the full scan when cardPlayCounts hasn't changed.
let _resonanceMemoRef: Record<string, number> | null = null;
let _resonanceMemoScore = 0;

export function computeGlobalResonanceScore(progress: ProgressState): number {
  const counts = progress.cardPlayCounts ?? {};
  // Zustand/Immer creates a new object reference whenever cardPlayCounts changes.
  // If the reference is the same as last time we computed, return the cached result.
  if (counts === _resonanceMemoRef) return _resonanceMemoScore;
  _resonanceMemoRef = counts;
  let score = 0;
  for (const definitionId of Object.keys(counts)) {
    const playCount = counts[definitionId] ?? 0;
    if (playCount <= 0) continue;
    score += getResonanceContributionForCount(playCount);
  }
  _resonanceMemoScore = score;
  return score;
}

export function previewMasteryReward(
  progress: ProgressState,
  deckList: Array<{ definitionId: string }>,
  extraDeck: Array<{ definitionId: string }>,
  baseAmount: number,
): MasteryRewardPreview {
  if (baseAmount <= 0) {
    return { uniqueCards: 0, totalAppliedProgress: 0, resonanceGain: 0, cardsTieredUp: 0, entries: [] };
  }

  const counts = progress.cardPlayCounts ?? {};
  const seen = new Set<string>();
  const entries: MasteryRewardEntry[] = [];
  let totalAppliedProgress = 0;
  let resonanceGain = 0;
  let cardsTieredUp = 0;

  for (const definitionId of [...deckList.map(entry => entry.definitionId), ...extraDeck.map(entry => entry.definitionId)]) {
    if (seen.has(definitionId)) continue;
    seen.add(definitionId);

    const currentCount = counts[definitionId] ?? 0;
    const reachedTier = getReachedTierForCount(currentCount);
    const appliedProgress = Math.round(baseAmount * (1 + reachedTier * 0.05));
    const nextCount = currentCount + appliedProgress;
    const resonanceBefore = getResonanceContributionForCount(currentCount);
    const resonanceAfter = getResonanceContributionForCount(nextCount);
    const entry: MasteryRewardEntry = {
      definitionId,
      currentCount,
      nextCount,
      appliedProgress,
      resonanceBefore,
      resonanceAfter,
      resonanceGain: resonanceAfter - resonanceBefore,
    };
    entries.push(entry);
    totalAppliedProgress += appliedProgress;
    resonanceGain += entry.resonanceGain;
    if (entry.resonanceGain > 0) cardsTieredUp += 1;
  }

  // Resonance payout is global/universal per fight difficulty.
  // It should not vary by deck composition or which cards are near tier breakpoints.
  const guaranteedResonanceGain = entries.length > 0
    ? Math.max(1, baseAmount)
    : 0;

  return {
    uniqueCards: entries.length,
    totalAppliedProgress,
    resonanceGain: guaranteedResonanceGain,
    cardsTieredUp,
    entries,
  };
}

export function applyMasteryReward(
  progress: ProgressState,
  deckList: Array<{ definitionId: string }>,
  extraDeck: Array<{ definitionId: string }>,
  baseAmount: number,
): MasteryRewardPreview {
  const preview = previewMasteryReward(progress, deckList, extraDeck, baseAmount);
  if (preview.entries.length === 0) return preview;
  if (!progress.cardPlayCounts) progress.cardPlayCounts = {};
  for (const entry of preview.entries) {
    progress.cardPlayCounts[entry.definitionId] = entry.nextCount;
  }
  return preview;
}

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
