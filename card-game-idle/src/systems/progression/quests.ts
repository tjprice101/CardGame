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
  // Generic "play any cards" — accessible at every stage (play_cards_of_element
  // with no target matches all element events fired for every card played).
  { id: 'daily-any-cards-10', text: 'Play 10 cards', kind: 'play_cards_of_element', goal: 10, shardReward: 10 },
  { id: 'daily-any-cards-20', text: 'Play 20 cards', kind: 'play_cards_of_element', goal: 20, shardReward: 15 },
  // Element-specific (5 cards each — a small hand's worth)
  ...ENGINE_ELEMENTS.map<QuestTemplate>(({ element, label }) => ({
    id: `daily-element-${element.toLowerCase()}`,
    text: `Play 5 ${label} cards`,
    kind: 'play_cards_of_element' as QuestKind,
    target: element,
    goal: 5,
    shardReward: 12,
  })),
  // Angel type plays (low thresholds, no summon requirement)
  { id: 'daily-ophanim-5', text: 'Play 5 Ophanim', kind: 'play_ophanim', goal: 5, shardReward: 10 },
  { id: 'daily-seraphim-3', text: 'Place 3 Seraphim', kind: 'play_seraphim', goal: 3, shardReward: 10 },
  { id: 'daily-cherubim-2', text: 'Place 2 Cherubim', kind: 'play_cherubim', goal: 2, shardReward: 10 },
  // Pack opening
  { id: 'daily-pack-1', text: 'Open any card pack', kind: 'open_packs', goal: 1, shardReward: 10 },

  // Boss (the first boss is accessible from the start)
  { id: 'daily-boss-1', text: 'Defeat any boss', kind: 'win_boss', goal: 1, shardReward: 20 },
  // Multi-set (2 sets is achievable with a modest collection)
  { id: 'daily-multisets-2', text: 'Play cards from 2 different sets in one turn', kind: 'play_unique_sets_in_turn', goal: 2, shardReward: 15 },
];

const WEEKLY_QUEST_POOL: QuestTemplate[] = [
  // Generic "play any cards" accumulated over the week
  { id: 'weekly-any-cards-50', text: 'Play 50 cards this week', kind: 'play_cards_of_element', goal: 50, shardReward: 50 },
  { id: 'weekly-any-cards-100', text: 'Play 100 cards this week', kind: 'play_cards_of_element', goal: 100, shardReward: 70 },
  // Element-specific (~4/day over 7 days)
  ...ENGINE_ELEMENTS.map<QuestTemplate>(({ element, label }) => ({
    id: `weekly-element-${element.toLowerCase()}`,
    text: `Play 30 ${label} cards this week`,
    kind: 'play_cards_of_element' as QuestKind,
    target: element,
    goal: 30,
    shardReward: 55,
  })),
  // Boss (2 over a week — very achievable)
  { id: 'weekly-bosses-2', text: 'Defeat 2 bosses', kind: 'win_boss', goal: 2, shardReward: 60 },

  // Packs (3 over a week)
  { id: 'weekly-packs-3', text: 'Open 3 card packs', kind: 'open_packs', goal: 3, shardReward: 45 },
  // Multi-set (3 sets in one turn — requires a modest collection by week's end)
  { id: 'weekly-multisets-3', text: 'Play cards from 3 different sets in one turn', kind: 'play_unique_sets_in_turn', goal: 3, shardReward: 65 },
];

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
  return pickN(WEEKLY_QUEST_POOL, WEEKLY_QUEST_COUNT, seed).map(t => instantiate(t, `w${weekIndex}`));
}

/**
 * Quest day resets at 8:00 PM EST = 01:00 UTC (fixed UTC-5 offset, no DST).
 * A "quest day" runs from 01:00 UTC to 01:00 UTC the following day.
 */
const QUEST_RESET_UTC_HOUR_MS = 3_600_000; // 1 hour = 01:00 UTC

/**
 * Anchor for Monday-aligned quest weeks: Mon Jan 5, 1970 at 01:00 UTC.
 * Weekly quests reset every Monday at 01:00 UTC (= Sunday 8 PM EST).
 */
const QUEST_WEEK_ANCHOR_MS = 349_200_000;

export function getQuestDayIndex(timestamp: number): number {
  return Math.floor((timestamp - QUEST_RESET_UTC_HOUR_MS) / 86_400_000);
}

export function getQuestWeekIndex(timestamp: number): number {
  return Math.floor((timestamp - QUEST_WEEK_ANCHOR_MS) / 604_800_000);
}

/**
 * Ensures the quest state reflects the current daily/weekly window. If a roll
 * is stale (or empty), refreshes it. Pure — returns a new QuestState.
 * @param timestamp — pass Date.now(); day and week indices are derived internally.
 */
export function refreshQuestRotation(state: QuestState, timestamp: number): QuestState {
  const dayIndex = getQuestDayIndex(timestamp);
  const weekIndex = getQuestWeekIndex(timestamp);
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
