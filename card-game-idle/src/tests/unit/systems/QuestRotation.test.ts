import { describe, expect, it } from 'vitest';
import {
  DAILY_QUEST_COUNT,
  DAILY_CHALLENGE_DIVINE_LIGHT_TARGET,
  WEEKLY_QUEST_COUNT,
  WEEKLY_CHALLENGE_DIVINE_LIGHT_TARGET,
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

  it('targets approximately 50,000 daily and 100,000 weekly base Divine Light', () => {
    const daily = Array.from({ length: 7 }, (_, day) => rollDailyQuests(20_000 + day)).flat();
    const weekly = rollWeeklyQuests(3_000);
    expect(daily.reduce((total, quest) => total + (quest.oblivionReward ?? 0), 0)).toBe(DAILY_CHALLENGE_DIVINE_LIGHT_TARGET);
    expect(weekly.reduce((total, quest) => total + (quest.oblivionReward ?? 0), 0)).toBe(WEEKLY_CHALLENGE_DIVINE_LIGHT_TARGET);
  });
});