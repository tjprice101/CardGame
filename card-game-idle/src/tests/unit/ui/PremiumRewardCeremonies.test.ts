import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
import { useTranscendentUnlockStore } from '@/state/transcendentUnlockStore';
import { INFINITE_RECIPES } from '@/data/cards/infiniteCards';
import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';
import { FORGE_EVENT_BOSS_IDS } from '@/data/forge/forgeDefinitions';
import { GARDEN_DUNGEONS } from '@/data/dungeons/gardenDungeonDefinitions';
import { getLocalDayIndex, getMonthlyTrackKey } from '@/systems/progression/dailyLogin';
import { TranscendentUnlockCeremony } from '@/ui/components/TranscendentUnlockScreen';
import { intensityEternalCards, intensityInfiniteCards } from '@/data/cards/intensityCards';

beforeEach(() => useStore.getState().loadState(structuredClone(defaultGameState)));
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  useTranscendentUnlockStore.getState().clear();
});
const queue = () => useTranscendentUnlockStore.getState().queue;

function fundRecipe(): void {
  const recipe = INFINITE_RECIPES[0];
  useStore.setState(state => {
    const progress = state.progress;
    for (const ingredient of recipe.ingredients) {
      if (ingredient.currency) progress[ingredient.currency] = ingredient.count;
      if (ingredient.definitionId) {
        progress.collection[ingredient.definitionId] = ingredient.count;
        progress.holoCollection[ingredient.definitionId] = ingredient.count;
      }
    }
  });
}

describe('Premium reward ceremonies', () => {
  it('celebrates successful Infinite crafting with canonical holo ownership and first/duplicate reveals', () => {
    const recipe = INFINITE_RECIPES[0];
    expect(useStore.getState().combineForInfinite(recipe)).not.toBe(true);
    expect(queue()).toEqual([]);
    for (let count = 1; count <= 2; count++) {
      fundRecipe();
      expect(useStore.getState().combineForInfinite(recipe)).toBe(true);
      expect(queue()).toEqual([{ kind: 'card', definitionId: recipe.resultId, firstCopy: count === 1, totalOwned: count, amount: 1 }]);
      expect(useStore.getState().progress.holoCollection[recipe.resultId]).toBe(count);
      expect(useStore.getState().progress.infiniteCollection[recipe.resultId]).toBe(count);
      useTranscendentUnlockStore.getState().dismiss();
    }
  });

  it('remembers previously crafted ownership even if the current copy was consumed', () => {
    fundRecipe();
    useStore.setState(state => ({ progress: { ...state.progress, everCollection: { [INFINITE_RECIPES[0].resultId]: 1 } } }));
    useStore.getState().combineForInfinite(INFINITE_RECIPES[0]);
    expect(queue()[0]).toMatchObject({ firstCopy: false });
  });

  it('aggregates boss Eternal copies and queues an actual shard drop after restoring the normal snapshot', () => {
    const boss = BOSS_DEFINITIONS.find(entry => entry.id === FORGE_EVENT_BOSS_IDS[0])!;
    vi.spyOn(Math, 'random').mockReturnValue(0);
    useStore.setState(state => ({ progress: {
      ...state.progress, forgeOfTranscendenceUnlocked: true,
      savedDecks: [{ id: 'ceremony-test', name: 'Ceremony Test', deckList: [], extraDeck: [], isStarter: false }],
    } }));
    useStore.getState().startBossFight(boss.id, 'ceremony-test', { fightCount: 3 });
    expect(useStore.getState().bossFight.mode).toBe('active');
    useStore.setState(state => ({ bossFight: { ...state.bossFight, coopSessionId: 'ceremony-test' } }));
    useStore.getState().applyCoopBossDamage(useStore.getState().bossFight.bossMaxHp);
    expect(queue()).toEqual([
      { kind: 'card', definitionId: boss.rewardCardId, firstCopy: true, totalOwned: 3, amount: 3 },
      { kind: 'shards', amount: 1, totalOwned: 1 },
    ]);
    expect(useStore.getState().progress.collection[boss.rewardCardId]).toBe(3);
  });

  it('celebrates wheel shard prizes, but not other currencies or rejected spins', () => {
    const today = getLocalDayIndex(Date.now());
    useStore.setState(state => ({ progress: {
      ...state.progress, forgeOfTranscendenceUnlocked: true, forgeWheelSpins: 1, forgeWheelLastAccruedDayIndex: today,
    } }));
    vi.spyOn(Math, 'random').mockReturnValue(62 / 82);
    expect(useStore.getState().spinForgeWheel()?.prize.kind).toBe('shards_of_transcendence');
    expect(queue()).toEqual([{ kind: 'shards', amount: 1, totalOwned: 1 }]);
    expect(useStore.getState().spinForgeWheel()).toBeNull();
    expect(queue()).toHaveLength(1);
  });

  it('celebrates the shard streak milestone exactly once', () => {
    useStore.setState(state => ({ progress: {
      ...state.progress, forgeOfTranscendenceUnlocked: true,
      dailyLogin: { ...state.progress.dailyLogin, streak: 14, claimedStreakMilestones: [] },
    } }));
    expect(useStore.getState().claimDailyStreakMilestone(14)).toBe(true);
    expect(queue()).toEqual([{ kind: 'shards', amount: 2, totalOwned: 2 }]);
    expect(useStore.getState().claimDailyStreakMilestone(14)).toBe(false);
    expect(queue()).toHaveLength(1);
  });

  it.each([10, 25])('combines the day %i calendar reward and rare bonus into one shard reveal', day => {
    const now = new Date(2026, 9, day, 12).getTime();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    useStore.setState(state => ({ progress: {
      ...state.progress, forgeOfTranscendenceUnlocked: true,
      dailyLogin: { ...state.progress.dailyLogin, lastClaimedDayIndex: getLocalDayIndex(now) - 1, monthlyTrackKey: getMonthlyTrackKey(now), monthlyClaimedDays: [] },
    } }));
    expect(useStore.getState().claimDailyReward()).not.toBeNull();
    const amount = day === 10 ? 2 : 3;
    expect(queue()).toEqual([{ kind: 'shards', amount, totalOwned: amount }]);
    expect(useStore.getState().claimDailyReward()).toBeNull();
    expect(queue()).toHaveLength(1);
  });

  it('celebrates positive direct shard grants, not dry grants or unrelated materials', () => {
    useStore.getState().grantGardenCurrency('shardsOfTranscendence', 3);
    useStore.getState().grantGardenCurrency('shardsOfTranscendence', 0);
    useStore.getState().grantGardenCurrency('nullifiedLattice', 2);
    expect(queue()).toEqual([{ kind: 'shards', amount: 3, totalOwned: 3 }]);
  });

  it('celebrates final Garden shard drops only after the award', () => {
    const dungeon = GARDEN_DUNGEONS.find(entry => entry.available)!;
    vi.spyOn(Math, 'random').mockReturnValue(0);
    useStore.setState(state => ({ progress: { ...state.progress, forgeOfTranscendenceUnlocked: true } }));
    expect(useStore.getState().startGardenDungeon(dungeon.id)).toBe(true);
    for (let index = 0; index < dungeon.encounters.length; index++) {
      useStore.setState(state => ({ gardenDungeon: { ...state.gardenDungeon, encounterHp: 0 } }));
      expect(useStore.getState().resolveGardenEncounter()).toBe(true);
      expect(queue()).toHaveLength(index === dungeon.encounters.length - 1 ? 1 : 0);
      useStore.getState().continueGardenDungeon();
    }
    expect(queue()).toEqual([{ kind: 'shards', amount: 1, totalOwned: 1 }]);
  });

  it('does not celebrate Debug grants or snapshot loading, and discards pending rewards on Debug exit', () => {
    useStore.getState().grantGardenCurrency('shardsOfTranscendence', 1);
    useStore.getState().loadState(structuredClone(defaultGameState));
    expect(queue()).toEqual([]);
    useStore.getState().activateDebugMode();
    expect(useStore.getState().debugMode).toBe(true);
    expect(queue()).toEqual([]);
    useStore.getState().grantGardenCurrency('shardsOfTranscendence', 1);
    useStore.getState().exitDebugMode();
    expect(queue()).toEqual([]);
  });

  it('renders rarity-themed live card frames and intact shard artwork with explicit counts', () => {
    for (const [card, theme] of [[intensityEternalCards[0], 'eternal'], [intensityInfiniteCards[0], 'infinite']] as const) {
      const html = renderToStaticMarkup(createElement(TranscendentUnlockCeremony, {
        unlock: { kind: 'card', definitionId: card.definitionId, firstCopy: false, totalOwned: 5, amount: 3 }, onContinue: () => {},
      }));
      expect(html).toContain(`reward-ceremony-${theme}`);
      expect(html).toContain('reward-ceremony-intensity');
      expect(html).toContain(`live-card-shimmer-${theme}`);
      expect(html).toContain('>+3<');
      expect(html).toContain('5 copies owned');
      expect(html).toContain('aria-modal="true"');
    }
    const html = renderToStaticMarkup(createElement(TranscendentUnlockCeremony, {
      unlock: { kind: 'shards', amount: 3, totalOwned: 10 }, onContinue: () => {},
    }));
    expect(html).toContain('reward-ceremony-shards');
    expect(html).toContain('assets/forge/shards-of-transcendence.png');
    expect(html).toContain('>+3<');
    expect(html).toContain('10 owned');
  });
});
