import type { CardDefinition } from '@/types/cards';
import { CardRegistry } from '@/cards/CardRegistry';

/**
 * Quest system — daily and weekly engine-flavored objectives.
 * Pure functions; the store owns the persisted state. Rotations are seeded
 * by the UTC day index so they're stable across sessions and time zones.
 */

export type QuestKind =
  | 'play_cards_of_element'
  | 'play_seraphim'
  | 'play_cherubim'
  | 'play_ophanim'
  | 'summon_angel'
  | 'reach_chain_multiplier'
  | 'earn_oblivion_in_turn'
  | 'win_boss'
  | 'open_packs'
  | 'play_unique_sets_in_turn';

export interface QuestTemplate {
  id: string;
  /** Short text displayed in the quest list. */
  text: string;
  kind: QuestKind;
  /** For element/set/etc., the target value (element name, etc.). */
  target?: string;
  /** Goal value the player must reach. */
  goal: number;
  shardReward: number;
}

/** Element ids that have a meaningful pack/set in the game. */
const ENGINE_ELEMENTS: { element: string; label: string }[] = [
  { element: 'Neutrality', label: 'Neutrality' },
  { element: 'Fire', label: 'Pyroabyss' },
  { element: 'Light', label: 'Heavenly Light' },
  { element: 'Thornbound', label: 'Thornbound' },
  { element: 'Mechanical', label: 'Mechanical Dreams' },
  { element: 'Prismatic', label: 'Prismatic Accord' },
  { element: 'Dark', label: 'Black Glass Inferno' },
  { element: 'GlassAbsolute', label: 'Glass Absolute' },
  { element: 'BlazingGarden', label: 'Blazing Garden' },
  { element: 'Butterfly', label: 'Age of the Butterfly' },
  { element: 'EternalSeas', label: 'Eternal Seas' },
  { element: 'AbyssalForge', label: 'Abyssal Forge' },
  { element: 'DeathFlamedHell', label: 'Death-flamed Hell' },
];

const DAILY_QUEST_POOL: QuestTemplate[] = [
  ...ENGINE_ELEMENTS.map<QuestTemplate>(({ element, label }) => ({
    id: `daily-element-${element.toLowerCase()}`,
    text: `Play 8 ${label} cards`,
    kind: 'play_cards_of_element',
    target: element,
    goal: 8,
    shardReward: 15,
  })),
  { id: 'daily-seraphim-6', text: 'Place 6 Seraphim', kind: 'play_seraphim', goal: 6, shardReward: 12 },
  { id: 'daily-cherubim-4', text: 'Place 4 Cherubim', kind: 'play_cherubim', goal: 4, shardReward: 12 },
  { id: 'daily-ophanim-10', text: 'Play 10 Ophanim', kind: 'play_ophanim', goal: 10, shardReward: 12 },
  { id: 'daily-angel-1', text: 'Summon 1 Angel', kind: 'summon_angel', goal: 1, shardReward: 15 },
  { id: 'daily-chain-3', text: 'Reach a x3.0 chain multiplier in one turn', kind: 'reach_chain_multiplier', goal: 30, shardReward: 18 },
  { id: 'daily-chain-5', text: 'Reach a x5.0 chain multiplier in one turn', kind: 'reach_chain_multiplier', goal: 50, shardReward: 25 },
  { id: 'daily-turn-100k', text: 'Earn 100,000 Oblivion in a single turn', kind: 'earn_oblivion_in_turn', goal: 100_000, shardReward: 18 },
  { id: 'daily-turn-1m', text: 'Earn 1,000,000 Oblivion in a single turn', kind: 'earn_oblivion_in_turn', goal: 1_000_000, shardReward: 30 },
  { id: 'daily-boss-1', text: 'Defeat any Eternity\u2019s Wake boss', kind: 'win_boss', goal: 1, shardReward: 20 },
  { id: 'daily-pack-1', text: 'Open any card pack', kind: 'open_packs', goal: 1, shardReward: 10 },
  { id: 'daily-multisets-3', text: 'Play cards from 3 different sets in one turn', kind: 'play_unique_sets_in_turn', goal: 3, shardReward: 18 },
];

const WEEKLY_QUEST_POOL: QuestTemplate[] = [
  { id: 'weekly-cards-200', text: 'Play 200 cards this week', kind: 'play_ophanim', goal: 0, shardReward: 0 }, // placeholder; replaced below
  { id: 'weekly-bosses-5', text: 'Defeat 5 bosses', kind: 'win_boss', goal: 5, shardReward: 60 },
  { id: 'weekly-chain-7', text: 'Reach an x7.0 chain multiplier', kind: 'reach_chain_multiplier', goal: 70, shardReward: 70 },
  { id: 'weekly-turn-5m', text: 'Earn 5,000,000 Oblivion in a single turn', kind: 'earn_oblivion_in_turn', goal: 5_000_000, shardReward: 80 },
  { id: 'weekly-angels-5', text: 'Summon 5 Angels', kind: 'summon_angel', goal: 5, shardReward: 65 },
  { id: 'weekly-packs-10', text: 'Open 10 card packs', kind: 'open_packs', goal: 10, shardReward: 55 },
  { id: 'weekly-multisets-5', text: 'Play 5 different sets in one turn', kind: 'play_unique_sets_in_turn', goal: 5, shardReward: 75 },
  ...ENGINE_ELEMENTS.map<QuestTemplate>(({ element, label }) => ({
    id: `weekly-element-${element.toLowerCase()}`,
    text: `Play 50 ${label} cards`,
    kind: 'play_cards_of_element',
    target: element,
    goal: 50,
    shardReward: 65,
  })),
];

// Filter out placeholder
const REAL_WEEKLY = WEEKLY_QUEST_POOL.filter(q => q.shardReward > 0);

export interface QuestInstance {
  /** Unique id for this active quest (template id + roll id). */
  id: string;
  /** Pulled from the template. */
  templateId: string;
  text: string;
  kind: QuestKind;
  target?: string;
  goal: number;
  progress: number;
  shardReward: number;
  claimed: boolean;
}

export interface QuestState {
  daily: QuestInstance[];
  weekly: QuestInstance[];
  /** UTC day index of last daily roll. */
  lastDailyRollDay: number;
  /** UTC week index (day // 7) of last weekly roll. */
  lastWeeklyRollWeek: number;
}

export const DAILY_QUEST_COUNT = 3;
export const WEEKLY_QUEST_COUNT = 2;

export function defaultQuestState(): QuestState {
  return {
    daily: [],
    weekly: [],
    lastDailyRollDay: -1,
    lastWeeklyRollWeek: -1,
  };
}

/**
 * Deterministic seeded shuffle (Mulberry32). Stable across runs given the
 * same seed.
 */
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

function pickN<T>(pool: T[], n: number, seed: number): T[] {
  const rng = mulberry32(seed);
  const arr = [...pool];
  // Fisher–Yates partial shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(n, arr.length));
}

function instantiate(template: QuestTemplate, salt: string): QuestInstance {
  return {
    id: `${template.id}::${salt}`,
    templateId: template.id,
    text: template.text,
    kind: template.kind,
    target: template.target,
    goal: template.goal,
    progress: 0,
    shardReward: template.shardReward,
    claimed: false,
  };
}

export function rollDailyQuests(dayIndex: number): QuestInstance[] {
  // Seed: prefix the day index so daily ≠ weekly seed space.
  const seed = dayIndex * 2654435761 + 1;
  return pickN(DAILY_QUEST_POOL, DAILY_QUEST_COUNT, seed).map(t => instantiate(t, `d${dayIndex}`));
}

export function rollWeeklyQuests(weekIndex: number): QuestInstance[] {
  const seed = weekIndex * 2246822519 + 7;
  return pickN(REAL_WEEKLY, WEEKLY_QUEST_COUNT, seed).map(t => instantiate(t, `w${weekIndex}`));
}

export function getWeekIndex(dayIndex: number): number {
  return Math.floor(dayIndex / 7);
}

/**
 * Ensures the quest state reflects the current daily/weekly window. If a roll
 * is stale (or empty), refreshes it. Pure — returns a new QuestState.
 */
export function refreshQuestRotation(state: QuestState, dayIndex: number): QuestState {
  const weekIndex = getWeekIndex(dayIndex);
  let next = state;
  if (state.lastDailyRollDay !== dayIndex || state.daily.length === 0) {
    next = { ...next, daily: rollDailyQuests(dayIndex), lastDailyRollDay: dayIndex };
  }
  if (state.lastWeeklyRollWeek !== weekIndex || state.weekly.length === 0) {
    next = { ...next, weekly: rollWeeklyQuests(weekIndex), lastWeeklyRollWeek: weekIndex };
  }
  return next;
}

/**
 * Inspects a card to derive the set "element" key used by quests. Falls back
 * to the raw element string from the card definition.
 */
export function getCardElementKey(definitionId: string): string | null {
  const def: CardDefinition | undefined = CardRegistry.get(definitionId);
  return def?.element ?? null;
}

export interface QuestProgressEvent {
  kind: QuestKind;
  amount: number;
  element?: string;
  /** For 'reach_chain_multiplier' / 'earn_oblivion_in_turn': the achieved value, used as a peak (not summed). */
  peak?: number;
}

/**
 * Pure: applies a progress event to a list of quest instances, returning a
 * new list. Already-claimed and already-completed quests are untouched. Caps
 * progress at the goal.
 */
export function applyQuestProgress(quests: QuestInstance[], evt: QuestProgressEvent): QuestInstance[] {
  let changed = false;
  const next = quests.map(q => {
    if (q.claimed) return q;
    if (q.kind !== evt.kind) return q;
    if (q.target && evt.element && q.target !== evt.element) return q;
    if (q.target && evt.element === undefined) return q;
    const isPeak = evt.peak !== undefined;
    const newRaw = isPeak ? Math.max(q.progress, evt.peak ?? 0) : Math.min(q.goal, q.progress + Math.max(0, evt.amount));
    const newProgress = Math.min(q.goal, newRaw);
    if (newProgress === q.progress) return q;
    changed = true;
    return { ...q, progress: newProgress };
  });
  return changed ? next : quests;
}

export function isQuestComplete(q: QuestInstance): boolean {
  return q.progress >= q.goal;
}
