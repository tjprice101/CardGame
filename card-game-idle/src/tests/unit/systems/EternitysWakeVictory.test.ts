import { beforeEach, describe, expect, it } from 'vitest';
import { BOSS_DEFINITIONS, getBossProgressionOrder } from '@/data/bosses/bossDefinitions';
import { defaultGameState, useStore } from '@/state/store';
import type { GameState } from '@/types/game';

function resetStore(): void {
  const baseState = JSON.parse(JSON.stringify(defaultGameState)) as GameState;
  useStore.setState(state => ({ ...state, ...baseState }));
}

describe("Eternity's Wake victory flow", () => {
  beforeEach(resetStore);

  it('completes a first boss clear, awards its card, and preserves fight result metadata', () => {
    const category = BOSS_DEFINITIONS[0].category;
    const boss = getBossProgressionOrder(category)[0];
    const savedDeckId = 'wake-first-clear-test';
    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        savedDecks: [{ id: savedDeckId, name: 'Wake Test', deckList: [], extraDeck: [], isStarter: false }],
      },
    }));

    useStore.getState().startBossFight(boss.id, savedDeckId, { fightCount: 2 });
    expect(useStore.getState().bossFight.mode).toBe('active');
    const bossMaxHp = useStore.getState().bossFight.bossMaxHp;

    useStore.setState(state => ({
      ...state,
      bossFight: { ...state.bossFight, coopSessionId: 'wake-victory-test' },
    }));
    expect(() => useStore.getState().applyCoopBossDamage(bossMaxHp)).not.toThrow();

    const victory = useStore.getState();
    expect(victory.bossFight.mode).toBe('victory');
    expect(victory.bossFight.activeBossId).toBe(boss.id);
    expect(victory.bossFight.bossCurrentHp).toBe(0);
    expect(victory.bossFight.bossMaxHp).toBe(bossMaxHp);
    expect(victory.bossFight.damageDealtThisFight).toBe(bossMaxHp);
    expect(victory.bossFight.fightCount).toBe(2);
    expect(victory.bossFight.rewardSummary).not.toBeNull();
    expect(victory.progress.bossClearCounts[boss.id]).toBe(1);
    expect(victory.progress.collection[boss.rewardCardId]).toBe(2);
    expect(victory.progress.holoCollection[boss.rewardCardId]).toBe(2);

    expect(() => victory.dismissBossResult()).not.toThrow();
    expect(useStore.getState().bossFight.mode).toBe('idle');
  });
});
