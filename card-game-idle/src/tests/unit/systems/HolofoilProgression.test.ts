import { beforeEach, describe, expect, it } from 'vitest';
import { BOSS_DEFINITIONS, BOSS_FIGHT_ROUND_SECONDS } from '@/data/bosses/bossDefinitions';
import { CardRegistry } from '@/cards/CardRegistry';
import { getHolofoilConversionCost } from '@/systems/progression/HolofoilSystem';
import { defaultGameState, useStore } from '@/state/store';
import type { SavedGameState } from '@/types/bossFight';
import type { BoardState, DeckState, ProgressState, TurnState } from '@/types/game';

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(defaultGameState)) as typeof defaultGameState;
}

function resetStore(): void {
  const baseState = cloneDefaultState();
  useStore.setState(state => ({ ...state, ...baseState }));
  useStore.getState().refreshComputedStats();
}

function makeSavedGameState(progress: ProgressState): SavedGameState {
  const base = cloneDefaultState();
  return {
    deck: JSON.parse(JSON.stringify(base.deck)) as DeckState,
    board: JSON.parse(JSON.stringify(base.board)) as BoardState,
    turn: JSON.parse(JSON.stringify(base.turn)) as TurnState,
    progress: JSON.parse(JSON.stringify(progress)) as ProgressState,
    settings: { ...base.settings },
  };
}

describe('Holofoil progression', () => {
  beforeEach(() => {
    resetStore();
  });

  it('converts one normal copy into holo and spends Aberrated Shards', () => {
    const definitionId = 'ophanim-neutral-null-seek';
    const definition = CardRegistry.get(definitionId);
    const initialHolo = { [definitionId]: 1 };
    const cost = getHolofoilConversionCost(definition, initialHolo);
    expect(cost).not.toBeNull();

    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        aberratedShards: 50,
        collection: { ...state.progress.collection, [definitionId]: 3 },
        holoCollection: { ...state.progress.holoCollection, ...initialHolo },
      },
    }));

    const didConvert = useStore.getState().convertCardToHolo(definitionId);
    const next = useStore.getState();

    expect(didConvert).toBe(true);
    expect(next.progress.aberratedShards).toBe(50 - (cost ?? 0));
    expect(next.progress.collection[definitionId]).toBe(3);
    expect(next.progress.holoCollection[definitionId]).toBe(2);
  });

  it('does not convert when the player cannot afford the shard cost', () => {
    const definitionId = 'ophanim-neutral-null-seek';

    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        aberratedShards: 0,
        collection: { ...state.progress.collection, [definitionId]: 2 },
        holoCollection: { ...state.progress.holoCollection, [definitionId]: 0 },
      },
    }));

    const didConvert = useStore.getState().convertCardToHolo(definitionId);
    const next = useStore.getState();

    expect(didConvert).toBe(false);
    expect(next.progress.aberratedShards).toBe(0);
    expect(next.progress.holoCollection[definitionId] ?? 0).toBe(0);
  });

  it('awards first-clear and repeat-clear shards and keeps Eternal boss rewards holo', () => {
    const boss = BOSS_DEFINITIONS.find(entry => entry.id === 'boss-hollow-king');
    expect(boss).toBeDefined();
    if (!boss) return;

    const seedProgress = cloneDefaultState().progress;
    const firstSaved = makeSavedGameState(seedProgress);

    useStore.setState(state => ({
      ...state,
      deck: {
        ...state.deck,
        deckList: [],
        extraDeck: [],
        drawPile: [],
        hand: [{ instanceId: 'play_1', definitionId: 'ser-neutral-null', finish: 'normal' }],
        discardPile: [],
      },
      board: { frontSlots: [null, null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] },
      turn: { ...state.turn, phase: 'playing', pendingEffect: null },
      bossFight: {
        mode: 'active',
        activeBossId: boss.id,
        bossCurrentHp: 1,
        bossMaxHp: boss.hp,
        damageDealtThisFight: 0,
        fightTimeRemaining: BOSS_FIGHT_ROUND_SECONDS,
        cooldowns: {},
        savedGameState: firstSaved,
      },
    }));

    useStore.getState().playCard('play_1');

    let next = useStore.getState();
    expect(next.bossFight.mode).toBe('victory');
    expect(next.progress.aberratedShards).toBe(boss.firstClearShards);
    expect(next.progress.collection[boss.rewardCardId]).toBe(1);
    expect(next.progress.holoCollection[boss.rewardCardId]).toBe(1);
    expect(next.progress.bossClearCounts[boss.id]).toBe(1);

    const repeatSaved = makeSavedGameState(next.progress);
    useStore.setState(state => ({
      ...state,
      deck: {
        ...state.deck,
        deckList: [],
        extraDeck: [],
        drawPile: [],
        hand: [{ instanceId: 'play_2', definitionId: 'ser-neutral-null', finish: 'normal' }],
        discardPile: [],
      },
      board: { frontSlots: [null, null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] },
      turn: { ...state.turn, phase: 'playing', pendingEffect: null },
      bossFight: {
        mode: 'active',
        activeBossId: boss.id,
        bossCurrentHp: 1,
        bossMaxHp: boss.hp,
        damageDealtThisFight: 0,
        fightTimeRemaining: BOSS_FIGHT_ROUND_SECONDS,
        cooldowns: {},
        savedGameState: repeatSaved,
      },
    }));

    useStore.getState().playCard('play_2');
    next = useStore.getState();

    expect(next.progress.aberratedShards).toBe(boss.firstClearShards + boss.repeatClearShards);
    expect(next.progress.collection[boss.rewardCardId]).toBe(2);
    expect(next.progress.holoCollection[boss.rewardCardId]).toBe(2);
    expect(next.progress.bossClearCounts[boss.id]).toBe(2);
  });

  it('migrates pre-v6 saves so owned Eternal rewards become holo-owned and finish defaults are normalized', () => {
    const boss = BOSS_DEFINITIONS.find(entry => entry.id === 'boss-hollow-king');
    expect(boss).toBeDefined();
    if (!boss) return;

    const loaded = cloneDefaultState() as unknown as Record<string, unknown>;
    loaded.version = 5;

    const loadedProgress = loaded.progress as ProgressState & Record<string, unknown>;
    loadedProgress.collection = { ...loadedProgress.collection, [boss.rewardCardId]: 2 };
    loadedProgress.holoCollection = {};

    const loadedDeck = loaded.deck as DeckState & Record<string, unknown>;
    loadedDeck.extraDeck = ['angel-light-seraphiel'] as unknown as DeckState['extraDeck'];
    loadedDeck.hand = [{ instanceId: 'legacy_1', definitionId: 'ophanim-neutral-null-seek' }] as unknown as DeckState['hand'];

    useStore.getState().loadState(loaded as unknown as typeof defaultGameState);

    const next = useStore.getState();
    expect(next.version).toBe(6);
    expect(next.progress.holoCollection[boss.rewardCardId]).toBe(2);
    expect(next.deck.extraDeck[0]?.finish).toBe('normal');
    expect(next.deck.hand[0]?.finish).toBe('normal');
  });
});
