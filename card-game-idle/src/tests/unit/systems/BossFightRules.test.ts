import { beforeEach, describe, expect, it } from 'vitest';
import { BOSS_DEFINITIONS, BOSS_FIGHT_ROUND_SECONDS } from '@/data/bosses/bossDefinitions';
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

  it('uses a gentle exponential HP curve for the eternal bosses', () => {
    expect(BOSS_DEFINITIONS.map(boss => boss.hp)).toEqual([
      5000,
      8500,
      14000,
      23000,
      38500,
      64500,
      108000,
      180000,
      300000,
      500000,
    ]);
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
      hand: [{ instanceId: 'play_1', definitionId: 'seek-neutral-null-seek' }],
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
    const originalExtraDeck = ['angel-light-seraphiel', 'angel-light-seraphiel'];

    const deckId = useStore.getState().saveCurrentDeck('Boss Test Deck', originalDeckList, originalExtraDeck);

    originalDeckList[0].copies = 1;
    originalExtraDeck.push('angel-light-aurelion');

    const savedDeck = useStore.getState().progress.savedDecks.find(deck => deck.id === deckId);
    expect(savedDeck?.deckList).toEqual([
      { ...defaultGameState.deck.deckList[0], copies: 4 },
      { ...defaultGameState.deck.deckList[1], copies: 1 },
    ]);
    expect(savedDeck?.extraDeck).toEqual(['angel-light-seraphiel', 'angel-light-seraphiel']);

    useStore.getState().startBossFight('boss-hollow-king', deckId);

    const state = useStore.getState();
    expect(state.bossFight.mode).toBe('active');
    expect(state.deck.deckList).toEqual([
      { ...defaultGameState.deck.deckList[0], copies: 4 },
      { ...defaultGameState.deck.deckList[1], copies: 1 },
    ]);
    expect(state.deck.extraDeck).toEqual(['angel-light-seraphiel', 'angel-light-seraphiel']);
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
    const initialExtraDeck = ['angel-light-seraphiel'];
    const updatedExtraDeck = ['angel-light-aurelion', 'angel-light-solarius'];

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