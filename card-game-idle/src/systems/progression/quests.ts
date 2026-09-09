import type { CardDefinition } from '@/types/cards';
import { CardRegistry } from '@/cards/CardRegistry';

/**
 * Quest system — daily and weekly engine-flavored objectives.
 * Pure functions; the store owns the persisted state. Rotations are seeded
 * by the local reset window so they are stable across sessions for the player.
 */

export type QuestKind =
  | 'play_cards'
  | 'play_light'
  | 'play_dark'
  | 'summon_ain_soph_aur'
  | 'flip_soph'
  | 'activate_ain_attack'
  | 'activate_soph_attack'
  | 'activate_dark'
  | 'bridge_ain_soph_aur'
  | 'spend_light_stacks'
  | 'earn_oblivion_in_turn'
  | 'win_boss'
  | 'clear_null_raid'
  | 'open_packs';

export interface QuestTemplate {
  id: string;
  /** Short text displayed in the quest list. */
  text: string;
  kind: QuestKind;
  /** For element/set/etc., the target value (element name, etc.). */
  target?: string;
  /** Goal value the player must reach. */
  goal: number;
  /** Aberrated Shard reward, paid in addition to any Oblivion reward. */
  shardReward: number;
  /** Base Oblivion reward before Collection Power scaling. */
  oblivionReward?: number;
}

const DAILY_QUEST_POOL: QuestTemplate[] = [
  { id: 'daily-any-cards-12', text: 'Play 12 cards', kind: 'play_cards', goal: 12, shardReward: 0, oblivionReward: 5_000 },
  { id: 'daily-light-5', text: 'Play 5 Light cards', kind: 'play_light', goal: 5, shardReward: 0, oblivionReward: 5_500 },
  { id: 'daily-dark-4', text: 'Play 4 Dark cards', kind: 'play_dark', goal: 4, shardReward: 0, oblivionReward: 5_500 },
  { id: 'daily-flip-2', text: 'Flip 2 Soph cards to Ain', kind: 'flip_soph', goal: 2, shardReward: 0, oblivionReward: 6_000 },
  { id: 'daily-stack-spend-8', text: 'Spend 8 Limitless Light Stacks', kind: 'spend_light_stacks', goal: 8, shardReward: 0, oblivionReward: 6_500 },
  { id: 'daily-summon-asa-1', text: 'Summon 1 Ain Soph Aur', kind: 'summon_ain_soph_aur', goal: 1, shardReward: 0, oblivionReward: 7_000 },
  { id: 'daily-attack-3', text: 'Activate 3 Light attacks', kind: 'activate_ain_attack', goal: 3, shardReward: 0, oblivionReward: 6_500 },
  { id: 'daily-soph-attack-2', text: 'Activate 2 Soph Attacks', kind: 'activate_soph_attack', goal: 2, shardReward: 0, oblivionReward: 6_500 },
  { id: 'daily-dark-activation-2', text: 'Resolve 2 Dark activations', kind: 'activate_dark', goal: 2, shardReward: 0, oblivionReward: 6_500 },
  { id: 'daily-bridge-1', text: 'Activate 1 Bridge attack', kind: 'bridge_ain_soph_aur', goal: 1, shardReward: 0, oblivionReward: 7_500 },
  { id: 'daily-divine-light-15000', text: 'Earn 15,000 Divine Light in one turn', kind: 'earn_oblivion_in_turn', goal: 15_000, shardReward: 0, oblivionReward: 7_000 },
  { id: 'daily-pack-1', text: 'Open 1 card pack', kind: 'open_packs', goal: 1, shardReward: 0, oblivionReward: 8_000 },
  { id: 'daily-boss-1', text: 'Defeat 1 boss', kind: 'win_boss', goal: 1, shardReward: 0, oblivionReward: 10_000 },
];

const WEEKLY_QUEST_POOL: QuestTemplate[] = [
  { id: 'weekly-any-cards-60', text: 'Play 60 cards this week', kind: 'play_cards', goal: 60, shardReward: 50, oblivionReward: 50_000 },
  { id: 'weekly-flips-10', text: 'Flip 10 Soph cards to Ain', kind: 'flip_soph', goal: 10, shardReward: 55, oblivionReward: 60_000 },
  { id: 'weekly-summons-5', text: 'Summon 5 Ain Soph Aur', kind: 'summon_ain_soph_aur', goal: 5, shardReward: 70, oblivionReward: 75_000 },
  { id: 'weekly-dark-activations-12', text: 'Resolve 12 Dark activations', kind: 'activate_dark', goal: 12, shardReward: 60, oblivionReward: 70_000 },
  { id: 'weekly-bridges-8', text: 'Activate 8 Bridge attacks', kind: 'bridge_ain_soph_aur', goal: 8, shardReward: 70, oblivionReward: 80_000 },
  { id: 'weekly-light-30', text: 'Play 30 Light cards', kind: 'play_light', goal: 30, shardReward: 55, oblivionReward: 65_000 },
  { id: 'weekly-dark-24', text: 'Play 24 Dark cards', kind: 'play_dark', goal: 24, shardReward: 55, oblivionReward: 65_000 },
  { id: 'weekly-soph-attacks-16', text: 'Activate 16 Soph Attacks', kind: 'activate_soph_attack', goal: 16, shardReward: 65, oblivionReward: 75_000 },
  { id: 'weekly-stacks-60', text: 'Spend 60 Limitless Light Stacks', kind: 'spend_light_stacks', goal: 60, shardReward: 65, oblivionReward: 75_000 },
  { id: 'weekly-divine-light-150000', text: 'Earn 150,000 Divine Light in one turn', kind: 'earn_oblivion_in_turn', goal: 150_000, shardReward: 80, oblivionReward: 90_000 },
  { id: 'weekly-bosses-3', text: 'Defeat 3 bosses', kind: 'win_boss', goal: 3, shardReward: 70, oblivionReward: 100_000 },
  { id: 'weekly-null-raid-1', text: 'Clear 1 Null Raid', kind: 'clear_null_raid', goal: 1, shardReward: 90, oblivionReward: 110_000 },
  { id: 'weekly-packs-4', text: 'Open 4 card packs', kind: 'open_packs', goal: 4, shardReward: 55, oblivionReward: 65_000 },
];

const QUEST_TEMPLATES_BY_ID = new Map(
  [...DAILY_QUEST_POOL, ...WEEKLY_QUEST_POOL].map(template => [template.id, template]),
);

export function getCollectionPowerMultiplier(resonanceScore: number): number {
  return Math.min(3, 1 + Math.max(0, resonanceScore) / 1000);
}

export function getScaledQuestOblivion(baseReward: number, resonanceScore: number): number {
  return Math.floor(Math.max(0, baseReward) * getCollectionPowerMultiplier(resonanceScore));
}

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
  /** Aberrated Shard reward, paid in addition to any Oblivion reward. */
  shardReward: number;
  /** Base Oblivion reward before Collection Power scaling. */
  oblivionReward?: number;
  claimed: boolean;
}

export interface QuestState {
  daily: QuestInstance[];
  weekly: QuestInstance[];
  /** Local reset-day index of last daily roll. */
  lastDailyRollDay: number;
  /** Local Sunday-reset week index of last weekly roll. */
  lastWeeklyRollWeek: number;
}

export const DAILY_QUEST_COUNT = 5;
export const WEEKLY_QUEST_COUNT = 4;

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

function pickN<T extends { id: string }>(pool: T[], n: number, seed: number, excludedIds: ReadonlySet<string> = new Set()): T[] {
  const rng = mulberry32(seed);
  const eligible = pool.filter(template => !excludedIds.has(template.id));
  const arr = eligible.length >= n ? eligible : [...pool];
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
    oblivionReward: template.oblivionReward,
    claimed: false,
  };
}

export function rollDailyQuests(dayIndex: number, previous: QuestInstance[] = []): QuestInstance[] {
  // Seed: prefix the day index so daily ≠ weekly seed space.
  const seed = dayIndex * 2654435761 + 1;
  return pickN(DAILY_QUEST_POOL, DAILY_QUEST_COUNT, seed, new Set(previous.map(quest => quest.templateId))).map(t => instantiate(t, `d${dayIndex}`));
}

export function rollWeeklyQuests(weekIndex: number, previous: QuestInstance[] = []): QuestInstance[] {
  const seed = weekIndex * 2246822519 + 7;
  return pickN(WEEKLY_QUEST_POOL, WEEKLY_QUEST_COUNT, seed, new Set(previous.map(quest => quest.templateId))).map(t => instantiate(t, `w${weekIndex}`));
}

const DAILY_RESET_HOUR = 12;
const WEEKLY_RESET_HOUR = 20;

function getDailyResetBoundary(timestamp: number): Date {
  const boundary = new Date(timestamp);
  boundary.setHours(DAILY_RESET_HOUR, 0, 0, 0);
  if (boundary.getTime() > timestamp) boundary.setDate(boundary.getDate() - 1);
  return boundary;
}

function getWeeklyResetBoundary(timestamp: number): Date {
  const boundary = new Date(timestamp);
  boundary.setHours(WEEKLY_RESET_HOUR, 0, 0, 0);
  const daysSinceSunday = boundary.getDay();
  boundary.setDate(boundary.getDate() - daysSinceSunday);
  if (boundary.getTime() > timestamp) boundary.setDate(boundary.getDate() - 7);
  return boundary;
}

export function getNextDailyResetAt(timestamp: number = Date.now()): number {
  const next = getDailyResetBoundary(timestamp);
  next.setDate(next.getDate() + 1);
  return next.getTime();
}

export function getNextWeeklyResetAt(timestamp: number = Date.now()): number {
  const next = getWeeklyResetBoundary(timestamp);
  next.setDate(next.getDate() + 7);
  return next.getTime();
}

export function formatQuestCountdown(totalMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getQuestDayIndex(timestamp: number): number {
  const boundary = getDailyResetBoundary(timestamp);
  return Math.floor(boundary.getTime() / 86_400_000);
}

export function getQuestWeekIndex(timestamp: number): number {
  const boundary = getWeeklyResetBoundary(timestamp);
  const dateKey = Date.UTC(boundary.getFullYear(), boundary.getMonth(), boundary.getDate());
  const sundayAnchor = Date.UTC(1970, 0, 4);
  return Math.floor((dateKey - sundayAnchor) / 604_800_000);
}

/**
 * Ensures the quest state reflects the current daily/weekly window. If a roll
 * is stale (or empty), refreshes it. Pure — returns a new QuestState.
 * @param timestamp — pass Date.now(); day and week indices are derived internally.
 */
export function refreshQuestRotation(state: QuestState, timestamp: number): QuestState {
  const dayIndex = getQuestDayIndex(timestamp);
  const weekIndex = getQuestWeekIndex(timestamp);
  const hydrateRewards = (quests: QuestInstance[]): QuestInstance[] => {
    let changed = false;
    const hydrated = quests.map(quest => {
    const template = QUEST_TEMPLATES_BY_ID.get(quest.templateId);
    if (!template) return quest;
    if (quest.shardReward === template.shardReward && quest.oblivionReward === template.oblivionReward) return quest;
    changed = true;
    return { ...quest, shardReward: template.shardReward, oblivionReward: template.oblivionReward };
    });
    return changed ? hydrated : quests;
  };
  const hydratedDaily = hydrateRewards(state.daily);
  const hydratedWeekly = hydrateRewards(state.weekly);
  let next: QuestState = hydratedDaily !== state.daily || hydratedWeekly !== state.weekly
    ? { ...state, daily: hydratedDaily, weekly: hydratedWeekly }
    : state;
  if (state.lastDailyRollDay !== dayIndex || state.daily.length === 0) {
    next = { ...next, daily: rollDailyQuests(dayIndex, state.daily), lastDailyRollDay: dayIndex };
  }
  if (state.lastWeeklyRollWeek !== weekIndex || state.weekly.length === 0) {
    next = { ...next, weekly: rollWeeklyQuests(weekIndex, state.weekly), lastWeeklyRollWeek: weekIndex };
  }
  return next;
}

/**
 * Inspects a card to derive the set id for quest tracking.
 */
export function getCardElementKey(definitionId: string): string | null {
  const def: CardDefinition | undefined = CardRegistry.get(definitionId);
  return def ? 'Neutrality' : null;
}

export interface QuestProgressEvent {
  kind: QuestKind;
  amount: number;
  /** @deprecated element targeting removed; field kept for back-compat but ignored for play_cards. */
  element?: string;
  /** For 'earn_oblivion_in_turn': the achieved value, used as a peak (not summed). */
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
