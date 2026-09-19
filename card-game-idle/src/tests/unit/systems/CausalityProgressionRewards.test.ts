import { describe, expect, it } from 'vitest';
import { refreshQuestRotation, isSuperWeeklyReady, getQuestWeekIndex, type QuestState } from '@/systems/progression/quests';
import { calculateNeutralityBossBaseline } from '@/systems/bossDifficulty';
import { TITLE_BADGES } from '@/data/profile/titleBadges';
import { AVATARS } from '@/data/profile/avatars';
import { useStore } from '@/state/store';

const baseQuestState = (weeklyClaimed = false): QuestState => ({
  daily: [],
  weekly: Array.from({ length: 4 }, (_, index) => ({
    id: `weekly-${index}`,
    templateId: `weekly-${index}`,
    text: 'Weekly',
    kind: 'play_cards',
    goal: 1,
    progress: 1,
    shardReward: 1,
    claimed: weeklyClaimed,
  })),
  lastDailyRollDay: -1,
  lastWeeklyRollWeek: -1,
});

describe('Causality progression rewards and difficulty baseline', () => {
  it('creates a deterministic Super Weekly boss target and gates readiness on all claims', () => {
    const timestamp = Date.UTC(2026, 0, 7, 21);
    const rotated = refreshQuestRotation({ ...baseQuestState(true), lastWeeklyRollWeek: getQuestWeekIndex(timestamp) }, timestamp);
    expect(rotated.superWeeklies).toHaveLength(2);
    expect(rotated.superWeeklies?.every(challenge => challenge.bossId.startsWith('boss-'))).toBe(true);
    expect(isSuperWeeklyReady(rotated)).toBe(true);
    expect(isSuperWeeklyReady({ ...rotated, weekly: rotated.weekly.map(quest => ({ ...quest, claimed: false })) })).toBe(false);
  });

  it('persists both Super Weekly targets when consuming claimed weekly challenges', () => {
    const now = Date.now();
    const quests = { ...baseQuestState(true), lastWeeklyRollWeek: getQuestWeekIndex(now) };
    useStore.setState(state => ({
      ...state,
      progress: { ...state.progress, quests },
    }));

    const targetIds = useStore.getState().activateSuperWeekly();
    const active = useStore.getState().progress.quests.superWeeklies ?? [];

    expect(targetIds?.split(',')).toHaveLength(2);
    expect(active).toHaveLength(2);
    expect(active.every(challenge => challenge.active && !challenge.completed)).toBe(true);
  });

  it('registers Causality profile and title rewards', () => {
    expect(AVATARS.some(avatar => avatar.id === 'pic-sigil-causality')).toBe(true);
    expect(AVATARS.some(avatar => avatar.id === 'pic-master-causality')).toBe(true);
    expect(TITLE_BADGES.some(title => title.id === 'title-causality-architect')).toBe(true);
    expect(TITLE_BADGES.some(title => title.id === 'title-causality-infinite')).toBe(true);
  });

  it('produces a positive Neutrality attack envelope for boss anchoring', () => {
    const baseline = calculateNeutralityBossBaseline();
    expect(baseline.noHitDps).toBeGreaterThan(0);
    expect(baseline.perfectRunDps).toBeGreaterThan(baseline.noHitDps);
    expect(baseline.recommendedFirstBossHp).toBeGreaterThan(0);
  });
});
