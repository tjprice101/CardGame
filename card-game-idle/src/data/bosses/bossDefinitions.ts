import { CardRegistry } from '@/cards/CardRegistry';
import type { ProgressState } from '@/types/game';
import type { BossDefinition, BossCategory } from '@/types/bossFight';

export const BOSS_FIGHT_ROUND_SECONDS = 180;

// Re-anchored for the post-hidden-multiplier combat baseline.
const FIRST_SET_FIRST_BOSS_HP = 84_375;
const SET_FINAL_HP_MULTIPLIER = 2.7;
function roundBossHp(value: number): number {
  if (value >= 10_000_000) return Math.round(value / 25_000) * 25_000;
  if (value >= 1_000_000) return Math.round(value / 10_000) * 10_000;
  if (value >= 100_000) return Math.round(value / 2_500) * 2_500;
  return Math.round(value / 500) * 500;
}

function getBossProgressionWeightFromRewardCardId(rewardCardId: string): number {
  const reward = CardRegistry.get(rewardCardId);
  if (reward?.type === 'Angel') return 1;
  return 0;
}

function buildSetAnchoredBossHpCurve(bosses: BossBlueprint[]): number[] {
  if (bosses.length === 0) return [];

  const scaledHp: number[] = new Array(bosses.length);
  let cursor = 0;
  let previousSetFinalHp: number | null = null;

  while (cursor < bosses.length) {
    const currentCategory = bosses[cursor]?.category;
    if (!currentCategory) break;

    let setEnd = cursor;
    while (setEnd + 1 < bosses.length && bosses[setEnd + 1]?.category === currentCategory) {
      setEnd += 1;
    }

    const setSize = setEnd - cursor + 1;
    const setFirstHp = previousSetFinalHp == null
      ? FIRST_SET_FIRST_BOSS_HP
      : roundBossHp(previousSetFinalHp * 0.5);
    const setFinalHp = roundBossHp(setFirstHp * SET_FINAL_HP_MULTIPLIER);

    const orderedSetIndices = Array.from({ length: setSize }, (_, offset) => cursor + offset)
      .sort((leftIndex, rightIndex) => {
        const left = bosses[leftIndex];
        const right = bosses[rightIndex];
        const weightDelta = getBossProgressionWeightFromRewardCardId(left?.rewardCardId ?? '')
          - getBossProgressionWeightFromRewardCardId(right?.rewardCardId ?? '');
        if (weightDelta !== 0) return weightDelta;
        return leftIndex - rightIndex;
      });

    for (let rank = 0; rank < setSize; rank += 1) {
      const progress = setSize <= 1 ? 1 : rank / (setSize - 1);
      const hp = setFirstHp + (setFinalHp - setFirstHp) * progress;
      const targetIndex = orderedSetIndices[rank] ?? (cursor + rank);
      scaledHp[targetIndex] = roundBossHp(hp);
    }

    previousSetFinalHp = setFinalHp;
    cursor = setEnd + 1;
  }

  return scaledHp;
}

function getScaledBossHp(index: number, totalBosses: number): number {
  if (totalBosses <= 0) return FIRST_SET_FIRST_BOSS_HP;
  const clampedIndex = Math.max(0, Math.min(index, totalBosses - 1));
  return BOSS_SCALED_HP_BY_INDEX[clampedIndex]
    ?? BOSS_SCALED_HP_BY_INDEX[totalBosses - 1]
    ?? FIRST_SET_FIRST_BOSS_HP;
}

type BossBlueprint = Omit<BossDefinition, 'hp'>;

function shardsFor(index: number): { firstClearShards: number; repeatClearShards: number } {
  const firstClearShards = 10 + index;
  const repeatClearShards = Math.max(5, Math.round(firstClearShards * 0.6));
  return { firstClearShards, repeatClearShards };
}

function createBoss(
  index: number,
  id: string,
  name: string,
  category: BossCategory,
  rewardCardId: string,
  description: string,
  keyArt?: string,
): BossBlueprint {
  const shards = shardsFor(index);
  return {
    id,
    name,
    category,
    rewardCardId,
    keyArt: keyArt ?? id,
    firstClearShards: shards.firstClearShards,
    repeatClearShards: shards.repeatClearShards,
    description,
  };
}

const BOSS_BLUEPRINTS: BossBlueprint[] = [
  // Neutrality legacy arc
  createBoss(0, 'boss-hollow-king', 'The Hollow Queen', 'Neutrality', 'btei-voids-reaping', 'A shattered queen of void whose broken regalia still bends reality around every strike.', 'boss_hollow_queen'),
  createBoss(1, 'boss-immortal-warden', 'The Immortal Warden', 'Neutrality', 'btei-eternal-vigil', 'A sentinel that has never blinked across epochs; each heartbeat is a verdict.', 'boss_immortal_warden'),
  createBoss(2, 'boss-cherubim-sovereign', 'The Cherubim Sovereign', 'Neutrality', 'btei-sovereign-domain', 'Formed from colliding entropy stacks, it turns stable lines into catastrophic gambles.', 'boss_cherubim_sovereign'),
  createBoss(3, 'boss-eternal-seraph', 'The Eternal Seraph', 'Neutrality', 'btei-convergence-of-eternity', 'The first chorus and the final silence, condensed into one impossible wingbeat.', 'boss_eternal_seraph'),
  createBoss(4, 'boss-time-eater', 'The Time Eater', 'Neutrality', 'btei-temporal-ruin', 'It consumes turns before they exist; haste itself becomes prey.', 'boss_time_eater'),
  createBoss(5, 'boss-void-architect', 'The Void Architect', 'Neutrality', 'btei-architects-manifold', 'A cosmic engineer that drafts your defeat as if it were structural law.', 'boss_void_architect'),
  createBoss(6, 'boss-null-sovereign', 'The Null Sovereign', 'Neutrality', 'btei-null-edict', 'It does not destroy; it revokes permissions to exist.', 'boss_null_sovereign'),
  createBoss(7, 'boss-shattered-oracle', 'The Shattered Oracle', 'Neutrality', 'btei-omniscient-fracture', 'Each shard fights from a timeline where you already failed.', 'boss_shattered_oracle'),
  createBoss(8, 'boss-abyssal-colossus', 'The Abyssal Colossus', 'Neutrality', 'btei-colossus-advent', 'A depth-born titan whose shadow alone counts as a battlefield.', 'boss_abyssal_colossus'),
  createBoss(9, 'boss-eternal-null', 'The Eternal Null', 'Neutrality', 'btei-axiom-of-oblivion', 'The final theorem: what remains after all cards and all players are gone.', 'boss_eternal_null'),

  // Neutrality expansion (5 new)
  createBoss(10, 'boss-neutrality-paradox-throne', 'Paradox Throne', 'Neutrality', 'btei-neutrality-paradox-crown', 'Every chain state exists at once; only one timeline lets you survive.', 'boss_neutrality_paradox_throne'),
  createBoss(11, 'boss-neutrality-void-exchequer', 'Void Exchequer', 'Neutrality', 'btei-neutrality-zero-edict', 'It taxes all momentum and then auctions your future back to you.', 'boss_neutrality_void_exchequer'),
  createBoss(12, 'boss-neutrality-equilibrium-rex', 'Equilibrium Rex', 'Neutrality', 'btei-neutrality-void-throne', 'Perfect balance weaponized: all extremes collapse into overwhelming force.', 'boss_neutrality_equilibrium_rex'),
  createBoss(13, 'boss-neutrality-axiom-maw', 'Axiom Maw', 'Neutrality', 'btei-neutrality-axiom-maw', 'A living contradiction that feeds on resolved effects and unresolved fear.', 'boss_neutrality_axiom_maw'),
  createBoss(14, 'boss-neutrality-prime-judge', 'Prime Judge of Silence', 'Neutrality', 'btei-neutrality-prime-equilibrium', 'The final arbiter of Neutrality, where every action is answered twice.', 'boss_neutrality_prime_judge'),
];

const BOSS_SCALED_HP_BY_INDEX = buildSetAnchoredBossHpCurve(BOSS_BLUEPRINTS);

export interface EventBossHpSnapshot {
  cycleId: string;
  hp: number;
}

// No event bosses are active — all functions below are stubs kept for save-file compat.
export function isEventBossCategory(_category: BossCategory): boolean {
  return false;
}

export function getCurrentCycleEventBossHp(): number {
  return 0;
}

export function getEventBossHpSnapshot(_progress: ProgressState): EventBossHpSnapshot | null {
  return null;
}

export function getEventBossHpForProgress(_progress: ProgressState): number {
  return 0;
}

export function ensureEventBossHpSnapshot(_progress: ProgressState): number {
  return 0;
}

export function getBossDisplayHp(_progress: ProgressState, boss: BossDefinition): number {
  return boss.hp;
}

export const BOSS_DEFINITIONS: BossDefinition[] = BOSS_BLUEPRINTS.map((boss, index, bosses) => ({
  ...boss,
  hp: BOSS_SCALED_HP_BY_INDEX[index] ?? getScaledBossHp(index, bosses.length),
}));

function getBossProgressionWeight(boss: BossDefinition): number {
  return getBossProgressionWeightFromRewardCardId(boss.rewardCardId);
}

/**
 * Progression order within a category for unlock gating and Eternity's Wake display.
 * Rule: non-Angel rewards are always listed before Angel rewards to prevent
 * summoning-gate cards from unlocking prematurely.
 */
export function getBossProgressionOrder(category: BossCategory): BossDefinition[] {
  const bosses = BOSS_DEFINITIONS.filter(b => b.category === category);
  if (bosses.length <= 1) return bosses;

  const sourceIndex = new Map(BOSS_DEFINITIONS.map((b, idx) => [b.id, idx] as const));
  return [...bosses].sort((left, right) => {
    const weightDelta = getBossProgressionWeight(left) - getBossProgressionWeight(right);
    if (weightDelta !== 0) return weightDelta;
    return (sourceIndex.get(left.id) ?? 0) - (sourceIndex.get(right.id) ?? 0);
  });
}

/** Returns true when a boss is available to challenge in progression mode. */
export function isBossUnlocked(progress: ProgressState, bossId: string): boolean {
  const boss = BOSS_DEFINITIONS.find(b => b.id === bossId);
  if (!boss) return false;

  const ordered = getBossProgressionOrder(boss.category);
  const idx = ordered.findIndex(entry => entry.id === bossId);
  if (idx <= 0) return true;

  const previousBoss = ordered[idx - 1];
  return (progress.bossClearCounts[previousBoss.id] ?? 0) > 0;
}
