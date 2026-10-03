import { describe, expect, it } from 'vitest';
import {
  DAILY_QUEST_COUNT,
  DAILY_CHALLENGE_DIVINE_LIGHT_TARGET,
  WEEKLY_QUEST_COUNT,
  WEEKLY_CHALLENGE_DIVINE_LIGHT_TARGET,
  getQuestDayIndex,
  getQuestWeekIndex,
  rollDailyQuests,
  rollWeeklyQuests,
  refreshQuestRotation,
} from '@/systems/progression/quests';

describe('challenge rotation', () => {
  it('assigns five Daily and four Weekly challenges from their respective banks', () => {
    expect(rollDailyQuests(20_000)).toHaveLength(DAILY_QUEST_COUNT);
    expect(rollWeeklyQuests(3_000)).toHaveLength(WEEKLY_QUEST_COUNT);
  });

  it('does not repeat a prior rotation when enough challenge templates are available', () => {
    const daily = rollDailyQuests(20_000);
    const nextDaily = rollDailyQuests(20_001, daily);
    const weekly = rollWeeklyQuests(3_000);
    const nextWeekly = rollWeeklyQuests(3_001, weekly);

    expect(nextDaily.some(quest => daily.some(previous => previous.templateId === quest.templateId))).toBe(false);
    expect(nextWeekly.some(quest => weekly.some(previous => previous.templateId === quest.templateId))).toBe(false);
  });

  it('omits retired Null Raid quests and replaces legacy active entries without losing other progress', () => {
    const timestamp = new Date(2026, 9, 3, 12).getTime();
    const dayIndex = getQuestDayIndex(timestamp);
    const weekIndex = getQuestWeekIndex(timestamp);
    const rolled = rollWeeklyQuests(weekIndex);
    const legacyWeekly = rolled.map((quest, index) => index === 0
      ? { ...quest, templateId: 'weekly-null-raid-1', kind: 'clear_null_raid' as const, text: 'Clear 1 Null Raid', progress: 1 }
      : { ...quest, progress: index + 2 });

    const refreshed = refreshQuestRotation({
      daily: rollDailyQuests(dayIndex),
      weekly: legacyWeekly,
      lastDailyRollDay: dayIndex,
      lastWeeklyRollWeek: weekIndex,
    }, timestamp);

    expect(refreshed.weekly).toHaveLength(WEEKLY_QUEST_COUNT);
    expect(refreshed.weekly.some(quest => quest.kind === 'clear_null_raid' || quest.templateId === 'weekly-null-raid-1')).toBe(false);
    for (const quest of legacyWeekly.slice(1)) {
      expect(refreshed.weekly.find(current => current.id === quest.id)?.progress).toBe(quest.progress);
    }
    for (const quest of rollWeeklyQuests(weekIndex)) expect(quest.kind).not.toBe('clear_null_raid');
  });

  it('targets approximately 50,000 daily and 100,000 weekly base Divine Light', () => {
    const daily = Array.from({ length: 7 }, (_, day) => rollDailyQuests(20_000 + day)).flat();
    const weekly = rollWeeklyQuests(3_000);
    expect(daily.reduce((total, quest) => total + (quest.divineLightReward ?? 0), 0)).toBe(DAILY_CHALLENGE_DIVINE_LIGHT_TARGET);
    expect(weekly.reduce((total, quest) => total + (quest.divineLightReward ?? 0), 0)).toBe(WEEKLY_CHALLENGE_DIVINE_LIGHT_TARGET);
  });
});