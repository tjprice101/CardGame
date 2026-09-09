import { describe, expect, it } from 'vitest';
import {
  DAILY_QUEST_COUNT,
  WEEKLY_QUEST_COUNT,
  rollDailyQuests,
  rollWeeklyQuests,
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
});