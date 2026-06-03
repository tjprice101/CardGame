import { beforeEach, describe, expect, it } from 'vitest';
import { BOSS_DEFINITIONS, BOSS_FIGHT_ROUND_SECONDS } from '@/data/bosses/bossDefinitions';
import { NULL_RAID_BOSS_MAP, NULL_RAID_DEFINITIONS } from '@/data/ascension/nullRaidDefinitions';
import { defaultGameState, useStore } from '@/state/store';
import type { SavedGameState } from '@/types/bossFight';
import type { DeckEntry, DeckState } from '@/types/game';

function resetStore(): void {
  const baseState = JSON.parse(JSON.stringify(defaultGameState)) as typeof defaultGameState;
  useStore.setState(state => ({ ...state, ...baseState }));
  useStore.getState().refreshComputedStats();
}

function makeSavedGameState(rewardCardId?: string, rewardCopies = 0): SavedGameState {
  const baseState = JSON.parse(JSON.stringify(defaultGameState)) as typeof defaultGameState;
  if (rewardCardId) {
    baseState.progress.collection[rewardCardId] = rewardCopies;
  }
  return {
    deck: baseState.deck,
    board: baseState.board,
    turn: baseState.turn,
    progress: baseState.progress,
    settings: baseState.settings,
  };
}

describe('Boss fight rules', () => {
  beforeEach(() => {
    resetStore();
  });

  it('starts boss fights with a three-minute timer', () => {
    useStore.getState().startBossFight('boss-hollow-king', 'starter-neutrality');

    const state = useStore.getState();
    expect(state.bossFight.mode).toBe('active');
    expect(state.bossFight.fightTimeRemaining).toBe(BOSS_FIGHT_ROUND_SECONDS);
  });

  it('uses set-anchored linear HP segments for eternal bosses', () => {
    const hpValues = BOSS_DEFINITIONS.map(boss => boss.hp);
    expect(hpValues[0]).toBeGreaterThanOrEqual(100_000);
    expect(hpValues[hpValues.length - 1]).toBeGreaterThanOrEqual(20_000_000);

    const nonEventBosses = BOSS_DEFINITIONS.filter(boss => boss.category !== '[EVENT] Wished Upon A Star');
    let setStart = 0;
    let previousSetFinalHp: number | null = null;

    while (setStart < nonEventBosses.length) {
      const setCategory = nonEventBosses[setStart]?.category;
      let setEnd = setStart;
      while (setEnd + 1 < nonEventBosses.length && nonEventBosses[setEnd + 1]?.category === setCategory) {
        setEnd += 1;
      }

      const setHps = nonEventBosses.slice(setStart, setEnd + 1).map(boss => boss.hp);
      expect(setHps[0]).toBeGreaterThan(0);
      expect(setHps[setHps.length - 1]).toBeGreaterThan(setHps[0]);

      if (previousSetFinalHp != null) {
        expect(setHps[0]).toBeGreaterThanOrEqual(Math.floor(previousSetFinalHp * 0.45));
        expect(setHps[0]).toBeLessThanOrEqual(Math.ceil(previousSetFinalHp * 0.55));
      }

      if (setHps.length >= 3) {
        const deltas = setHps.slice(1).map((hp, i) => hp - setHps[i]);
        const baseDelta = deltas[0] ?? 0;
        for (const delta of deltas) {
          expect(Math.abs(delta - baseDelta)).toBeLessThanOrEqual(25_000);
        }
      }

      previousSetFinalHp = setHps[setHps.length - 1] ?? previousSetFinalHp;
      setStart = setEnd + 1;
    }
  });

  it('keeps null raid encounter HP linear and above non-event endgame bosses', () => {
    const raidBossHps = NULL_RAID_DEFINITIONS
      .flatMap(raid => raid.encounterBossIds)
      .map(bossId => NULL_RAID_BOSS_MAP.get(bossId)?.hp ?? 0);

    expect(raidBossHps.length).toBeGreaterThanOrEqual(2);

    const nonEventMaxHp = Math.max(
      ...BOSS_DEFINITIONS
        .filter(boss => boss.category !== '[EVENT] Wished Upon A Star')
        .map(boss => boss.hp),
    );
    expect(raidBossHps[0]).toBeGreaterThan(nonEventMaxHp);

    for (let i = 1; i < raidBossHps.length; i++) {
      expect(raidBossHps[i]).toBeGreaterThan(raidBossHps[i - 1] ?? 0);
    }

    const deltas = raidBossHps.slice(1).map((hp, i) => hp - raidBossHps[i]);
    const baseDelta = deltas[0] ?? 0;
    for (const delta of deltas) {
      expect(Math.abs(delta - baseDelta)).toBeLessThanOrEqual(5_000_000);
    }
  });

  it('ends the fight in defeat when the only turn is ended without a kill', () => {
    useStore.getState().startBossFight('boss-hollow-king', 'starter-neutrality');
    useStore.getState().beginTurn();
    useStore.getState().confirmMulligan();

    useStore.getState().endTurn();

    const state = useStore.getState();
    expect(state.bossFight.mode).toBe('defeat');
    expect(state.bossFight.activeBossId).toBe('boss-hollow-king');
  });

  it('lets eternal boss rewards increase beyond four owned copies', () => {
    const rewardCardId = 'btei-convergence-of-eternity';
    const savedGameState = makeSavedGameState(rewardCardId, 4);
    const activeDeck: DeckState = {
      deckList: [],
      extraDeck: [],
      drawPile: [],
      hand: [{ instanceId: 'play_1', definitionId: 'ser-neutral-null', finish: 'normal' }],
      discardPile: [],
    };

    useStore.setState(state => ({
      ...state,
      board: { frontSlots: [null, null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] },
      deck: activeDeck,
      turn: { ...state.turn, phase: 'playing', pendingEffect: null },
      progress: {
        ...state.progress,
        collection: { ...state.progress.collection, [rewardCardId]: 4 },
      },
      bossFight: {
        mode: 'active',
        activeBossId: 'boss-eternal-seraph',
        bossCurrentHp: 1,
        bossMaxHp: 45000,
        damageDealtThisFight: 0,
        fightTimeRemaining: BOSS_FIGHT_ROUND_SECONDS,
        cooldowns: {},
        savedGameState,
      },
    }));
    useStore.getState().refreshComputedStats();

    useStore.getState().playCard('play_1');

    const state = useStore.getState();
    expect(state.bossFight.mode).toBe('victory');
    expect(state.progress.collection[rewardCardId]).toBe(5);
  });

  it('starts boss fights from the saved custom deck snapshot', () => {
    const originalDeckList: DeckEntry[] = [
      { ...defaultGameState.deck.deckList[0], copies: 4 },
      { ...defaultGameState.deck.deckList[1], copies: 1 },
    ];
    const originalExtraDeck = [
      { definitionId: 'angel-light-seraphiel', finish: 'normal' as const },
      { definitionId: 'angel-light-seraphiel', finish: 'normal' as const },
    ];

    const deckId = useStore.getState().saveCurrentDeck('Boss Test Deck', originalDeckList, originalExtraDeck);

    originalDeckList[0].copies = 1;
    originalExtraDeck.push({ definitionId: 'angel-light-aurelion', finish: 'normal' as const });

    const savedDeck = useStore.getState().progress.savedDecks.find(deck => deck.id === deckId);
    expect(savedDeck?.deckList).toEqual([
      { ...defaultGameState.deck.deckList[0], copies: 4 },
      { ...defaultGameState.deck.deckList[1], copies: 1 },
    ]);
    expect(savedDeck?.extraDeck).toEqual([
      { definitionId: 'angel-light-seraphiel', finish: 'normal' },
      { definitionId: 'angel-light-seraphiel', finish: 'normal' },
    ]);

    useStore.getState().startBossFight('boss-hollow-king', deckId);

    const state = useStore.getState();
    expect(state.bossFight.mode).toBe('active');
    expect(state.deck.deckList).toEqual([
      { ...defaultGameState.deck.deckList[0], copies: 4 },
      { ...defaultGameState.deck.deckList[1], copies: 1 },
    ]);
    expect(state.deck.extraDeck).toEqual([
      { definitionId: 'angel-light-seraphiel', finish: 'normal' },
      { definitionId: 'angel-light-seraphiel', finish: 'normal' },
    ]);
  });

  it('uses the latest builder-started version of the active saved custom deck in boss fights', () => {
    const initialDeckList: DeckEntry[] = [
      { ...defaultGameState.deck.deckList[0], copies: 4 },
      { ...defaultGameState.deck.deckList[1], copies: 1 },
    ];
    const updatedDeckList: DeckEntry[] = [
      { ...defaultGameState.deck.deckList[0], copies: 1 },
      { ...defaultGameState.deck.deckList[1], copies: 4 },
    ];
    const initialExtraDeck = [{ definitionId: 'angel-light-seraphiel', finish: 'normal' as const }];
    const updatedExtraDeck = [
      { definitionId: 'angel-light-aurelion', finish: 'normal' as const },
      { definitionId: 'angel-light-solarius', finish: 'normal' as const },
    ];

    const deckId = useStore.getState().saveCurrentDeck('Mutable Boss Deck', initialDeckList, initialExtraDeck);

    useStore.getState().initDeck(updatedDeckList, updatedExtraDeck);

    const syncedDeck = useStore.getState().progress.savedDecks.find(deck => deck.id === deckId);
    expect(syncedDeck?.deckList).toEqual(updatedDeckList);
    expect(syncedDeck?.extraDeck).toEqual(updatedExtraDeck);

    useStore.getState().startBossFight('boss-hollow-king', deckId);

    const state = useStore.getState();
    expect(state.bossFight.mode).toBe('active');
    expect(state.deck.deckList).toEqual(updatedDeckList);
    expect(state.deck.extraDeck).toEqual(updatedExtraDeck);
  });
});