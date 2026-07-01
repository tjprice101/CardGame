import { getUtcDayIndex } from './dailyLogin';
import { getQuestWeekIndex } from './quests';
import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';

/**
 * Wake Trials — modifier-stacked boss fights. Each trial is a daily-seeded
 * selection from the modifier pool. Modifiers are applied at fight start
 * (time pressure, HP scaling) or behave passively via the
 * presence of `BossFightState.modifiers` (e.g. forbidden elements cost
 * extra discards on play — see store handling).
 */

export type ModifierKind =
  | 'time_pressure'        // Round timer reduced by 30s
  | 'boss_hp_boost'        // Boss HP +25%
  | 'forbidden_element'    // Cards of the given element earn 50% less Oblivion
  | 'durability_drain'     // Cherubim durability halved on placement
  | 'no_angels'            // Angels cannot be summoned this fight
  | 'patience_lock';       // Cards take double resource cost (placeholder: just reduces oblivion)

export interface TrialModifier {
  kind: ModifierKind;
  /** Optional payload — e.g. forbidden element id. */
  payload?: string;
  text: string;
  /** Shard reward multiplier contribution (multiplicative across active modifiers). */
  rewardMult: number;
}

const MODIFIER_POOL: Array<Omit<TrialModifier, 'payload'> & { payloadOptions?: string[] }> = [
  { kind: 'time_pressure',   text: 'Time Pressure — round timer −30s', rewardMult: 1.25 },
  { kind: 'boss_hp_boost',   text: 'Hardened Soul — boss HP +25%', rewardMult: 1.4 },
  { kind: 'durability_drain', text: 'Brittle Vows — Cherubim durability halved', rewardMult: 1.2 },
  { kind: 'no_angels',       text: 'Heavens Closed — Angels cannot be summoned', rewardMult: 1.5 },
  { kind: 'patience_lock',   text: 'Crowded Mind — all Oblivion gains −15%', rewardMult: 1.3 },
  {
    kind: 'forbidden_element',
    text: 'Forbidden Element — chosen element earns 50% less Oblivion',
    rewardMult: 1.35,
    payloadOptions: ['Neutrality', 'Fire', 'Light', 'Thornbound', 'Mechanical', 'Prismatic', 'Dark'],
  },
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface WakeTrial {
  id: string;
  /** Difficulty rank (1=easy, 3=hard). Drives how many modifiers stack. */
  rank: 1 | 2 | 3;
  modifiers: TrialModifier[];
  /** Multiplicative reward boost vs. baseline boss clear. */
  rewardMultiplier: number;
}

export function getDailyTrials(now: number = Date.now()): WakeTrial[] {
  const day = getUtcDayIndex(now);
  return [1, 2, 3].map(rank => {
    const seed = day * 2654435761 + rank * 1013904223;
    const rng = mulberry32(seed);
    const pool = [...MODIFIER_POOL];
    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const picked = pool.slice(0, rank);
    const modifiers: TrialModifier[] = picked.map(m => {
      let payload: string | undefined;
      if (m.payloadOptions && m.payloadOptions.length > 0) {
        payload = m.payloadOptions[Math.floor(rng() * m.payloadOptions.length)];
      }
      return {
        kind: m.kind,
        payload,
        text: payload ? `${m.text} (${payload})` : m.text,
        rewardMult: m.rewardMult,
      };
    });
    const rewardMultiplier = modifiers.reduce((acc, m) => acc * m.rewardMult, 1);
    return {
      id: `trial-d${day}-r${rank}`,
      rank: rank as 1 | 2 | 3,
      modifiers,
      rewardMultiplier,
    };
  });
}

/**
 * Weekly Rotating Trial — a single rank-3 (always 3 modifiers) fight against a
 * deterministically-selected boss. Cosmetic-only reward: completing it for the
 * first time this week grants a "Weekly Trial" milestone title progress tick.
 * The reward is not gameplay-bearing (no shards, no cards).
 */
export interface WeeklyTrial {
  id: string;
  weekKey: string;            // "w<weekIndex>" — used in progress.weeklyTrialCompletions key.
  weekIndex: number;
  bossId: string;
  bossName: string;
  modifiers: TrialModifier[];
  rewardMultiplier: number;    // unused for shard bonus; kept for UI parity
  cosmeticRewardText: string;
}

export function getWeeklyTrial(now: number = Date.now()): WeeklyTrial {
  const weekIndex = getQuestWeekIndex(now);
  const weekKey = `w${weekIndex}`;
  const seed = weekIndex * 0x9E3779B1 + 17;
  const rng = mulberry32(seed);

  // Pick boss deterministically (any in BOSS_DEFINITIONS).
  const bossPool = BOSS_DEFINITIONS;
  const boss = bossPool[Math.floor(rng() * bossPool.length)] ?? bossPool[0];

  // Pick 3 modifiers from the full pool (weekly trials are always hardest).
  const pool = [...MODIFIER_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = pool.slice(0, 3);
  const modifiers: TrialModifier[] = picked.map(m => {
    let payload: string | undefined;
    if (m.payloadOptions && m.payloadOptions.length > 0) {
      payload = m.payloadOptions[Math.floor(rng() * m.payloadOptions.length)];
    }
    return {
      kind: m.kind,
      payload,
      text: payload ? `${m.text} (${payload})` : m.text,
      rewardMult: m.rewardMult,
    };
  });
  const rewardMultiplier = modifiers.reduce((acc, m) => acc * m.rewardMult, 1);

  return {
    id: `weekly-trial-${weekKey}`,
    weekKey,
    weekIndex,
    bossId: boss.id,
    bossName: boss.name,
    modifiers,
    rewardMultiplier,
    cosmeticRewardText: 'Cosmetic Title progress (Weekly Pilgrim line)',
  };
}
