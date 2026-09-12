import { describe, expect, it } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
import { ABILITY_REGISTRY } from '@/data/abilities/abilityDefinitions';
import type { GameState } from '@/types/game';

function resetStore(): void {
  const baseState = JSON.parse(JSON.stringify(defaultGameState)) as GameState;
  useStore.setState(state => ({ ...state, ...baseState }));
}

function equip(abilityId: string): void {
  useStore.setState(state => ({
    ...state,
    progress: {
      ...state.progress,
      ownedAbilities: { ...(state.progress.ownedAbilities ?? {}), [abilityId]: true },
      savedDecks: state.progress.savedDecks.map(deck => deck.id === state.progress.activeDeckId
        ? { ...deck, abilityLoadout: { ...(deck.abilityLoadout ?? {}), 1: abilityId } }
        : deck),
    },
    turn: { ...state.turn, phase: 'playing', limitlessLightStacks: 10 },
  }));
}

describe('materialized ability runtime', () => {
  it('resolves Neutralizing Inferno through discard selection', () => {
    resetStore();
    equip('neutralizing-inferno');
    useStore.setState(state => ({
      ...state,
      deck: { ...state.deck, hand: [
        { instanceId: 'inferno-card', definitionId: 'light-neutrality-1', finish: 'normal' },
      ] },
    }));

    const before = useStore.getState().progress.oblivion;
    useStore.getState().activateAbility(1);
    expect(useStore.getState().turn.pendingEffect?.type).toBe('discard_choice');
    useStore.getState().resolvePending(['inferno-card']);
    const after = useStore.getState();
    expect(after.progress.oblivion).toBeGreaterThan(before);
    expect(after.turn.abilityCooldownUntil?.['neutralizing-inferno']).toBeGreaterThan(Date.now());
  });

  it('keeps Divine Field active across End Turn and rewards Ain placement', () => {
    resetStore();
    equip('nullified-barricade');
    useStore.getState().activateAbility(1);
    const active = useStore.getState();
    expect(active.turn.divineFieldUntil).toBeGreaterThan(Date.now());

    const card = { instanceId: 'field-card', definitionId: 'light-neutrality-1', finish: 'normal' as const };
    useStore.setState(state => ({ ...state, deck: { ...state.deck, hand: [card] } }));
    const before = useStore.getState().progress.oblivion;
    useStore.getState().playCard(card.instanceId, 'ain');
    expect(useStore.getState().progress.oblivion).toBeGreaterThan(before);
  });

  it('expires Divine Field when the timer reaches its saved timestamp', () => {
    resetStore();
    const expiresAt = Date.now() + 1_000;
    useStore.setState(state => ({ ...state, turn: { ...state.turn, divineFieldUntil: expiresAt } }));
    useStore.getState().tickAbilityTimers(expiresAt);
    expect(useStore.getState().turn.divineFieldUntil).toBeUndefined();
  });

  it('preserves Divine Field and cooldown state when a new turn begins', () => {
    resetStore();
    const cooldownUntil = Date.now() + 30_000;
    const fieldUntil = Date.now() + 60_000;
    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'idle', abilityCooldownUntil: { 'neutralizing-inferno': cooldownUntil }, divineFieldUntil: fieldUntil },
    }));

    useStore.getState().beginTurn();
    const state = useStore.getState();
    expect(state.turn.abilityCooldownUntil?.['neutralizing-inferno']).toBe(cooldownUntil);
    expect(state.turn.divineFieldUntil).toBe(fieldUntil);
  });

  it('opens Phantom Matrix selection without auto-selecting an ASA', () => {
    resetStore();
    equip('phantom-matrix');
    useStore.setState(state => ({
      ...state,
      deck: {
        ...state.deck,
        extraDeck: [
          { definitionId: 'ain-soph-aur-neutrality-1', finish: 'normal' },
          { definitionId: 'ain-soph-aur-neutrality-2', finish: 'normal' },
        ],
      },
    }));
    const events: Event[] = [];
    const listener = (event: Event) => events.push(event);
    window.addEventListener('asa-summon-request', listener);
    useStore.getState().activateAbility(1);
    window.removeEventListener('asa-summon-request', listener);

    expect(events).toHaveLength(1);
    expect((events[0] as CustomEvent).detail).toMatchObject({ freeSummon: true, definitionId: '' });
    expect(useStore.getState().board.frontSlots[0]).toBeNull();
    expect(useStore.getState().turn.limitlessLightStacks).toBe(10);
  });

  it('free-summons an ASA without consuming materials', () => {
    resetStore();
    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'playing', limitlessLightStacks: 10 },
      deck: { ...state.deck, extraDeck: [{ definitionId: 'ain-soph-aur-neutrality-1', finish: 'normal' }] },
    }));
    const beforeDiscard = useStore.getState().deck.discardPile.length;
    const beforeBack = useStore.getState().board.backSlots.map(card => card?.instanceId ?? null);
    useStore.getState().summonAinSophAur('ain-soph-aur-neutrality-1', [], 0, true);
    const state = useStore.getState();
    expect(state.board.frontSlots[0]?.definitionId).toBe('ain-soph-aur-neutrality-1');
    expect(state.board.backSlots.map(card => card?.instanceId ?? null)).toEqual(beforeBack);
    expect(state.deck.discardPile).toHaveLength(beforeDiscard);
    expect(state.turn.limitlessLightStacks).toBe(1);
    expect(ABILITY_REGISTRY.get('phantom-matrix')?.stackCost).toBe(10);
  });

  it('persists ability loadouts through new and existing deck saves', () => {
    resetStore();
    const deckList = useStore.getState().progress.savedDecks[0].deckList;
    const extraDeck = useStore.getState().progress.savedDecks[0].extraDeck;
    const loadout = { 1: 'neutralizing-inferno', 2: 'nullified-barricade' } as const;
    const id = useStore.getState().saveCurrentDeck('Ability Test Deck', deckList, extraDeck, loadout);
    expect(useStore.getState().progress.savedDecks.find(deck => deck.id === id)?.abilityLoadout).toEqual(loadout);

    useStore.getState().updateSavedDeck(id, deckList, extraDeck, { 3: 'phantom-matrix' });
    expect(useStore.getState().progress.savedDecks.find(deck => deck.id === id)?.abilityLoadout).toEqual({ 3: 'phantom-matrix' });
    useStore.getState().loadSavedDeck(id);
    expect(useStore.getState().progress.activeDeckId).toBe(id);
  });

  it('requires the correct Neutrality card tier for endgame ability purchases', () => {
    resetStore();
    useStore.setState(state => ({ ...state, progress: { ...state.progress, oblivion: 1_000_000 } }));
    expect(useStore.getState().purchaseAbility('null-horizon')).toBe(false);
    expect(useStore.getState().purchaseAbility('whiteout-domain')).toBe(false);

    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        collection: { ...state.progress.collection, 'btei-voids-reaping': 1 },
      },
    }));
    expect(useStore.getState().purchaseAbility('null-horizon')).toBe(true);
    expect(useStore.getState().purchaseAbility('whiteout-domain')).toBe(false);

    useStore.setState(state => ({
      ...state,
      progress: { ...state.progress, infiniteCollection: { 'inf-oblivion-absolute': 1 } },
    }));
    expect(useStore.getState().purchaseAbility('whiteout-domain')).toBe(true);
  });

  it('activates Null Horizon and Infinite Accord with their high stack costs', () => {
    resetStore();
    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        collection: { ...state.progress.collection, 'btei-voids-reaping': 1 },
        infiniteCollection: { 'inf-oblivion-absolute': 1 },
        ownedAbilities: { 'null-horizon': true, 'infinite-accord': true },
        savedDecks: state.progress.savedDecks.map(deck => deck.id === state.progress.activeDeckId
          ? { ...deck, abilityLoadout: { 1: 'null-horizon', 2: 'infinite-accord' } }
          : deck),
      },
      turn: { ...state.turn, phase: 'playing', limitlessLightStacks: 45 },
    }));
    useStore.getState().activateAbility(1);
    expect(useStore.getState().turn.limitlessLightStacks).toBe(30);
    useStore.getState().activateAbility(2);
    expect(useStore.getState().turn.limitlessLightStacks).toBe(0);
    expect(useStore.getState().turn.abilityCooldownUntil?.['infinite-accord']).toBeGreaterThan(Date.now());
  });

  it('resolves Axiomatic Reversal through its two-card discard choice', () => {
    resetStore();
    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        collection: { ...state.progress.collection, 'btei-voids-reaping': 1 },
        ownedAbilities: { 'axiomatic-reversal': true },
        savedDecks: state.progress.savedDecks.map(deck => deck.id === state.progress.activeDeckId
          ? { ...deck, abilityLoadout: { 1: 'axiomatic-reversal' } }
          : deck),
      },
      turn: { ...state.turn, phase: 'playing' },
      deck: { ...state.deck, hand: [
        { instanceId: 'reversal-a', definitionId: 'light-neutrality-1', finish: 'normal' },
        { instanceId: 'reversal-b', definitionId: 'light-neutrality-2', finish: 'normal' },
      ] },
    }));
    useStore.getState().activateAbility(1);
    expect(useStore.getState().turn.pendingEffect?.count).toBe(2);
    const before = useStore.getState().progress.oblivion;
    useStore.getState().resolvePending(['reversal-a', 'reversal-b']);
    expect(useStore.getState().progress.oblivion).toBeGreaterThan(before);
    expect(useStore.getState().turn.abilityCooldownUntil?.['axiomatic-reversal']).toBeGreaterThan(Date.now());
  });

  it('activates Whiteout Domain and applies its distinct timed field', () => {
    resetStore();
    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        infiniteCollection: { 'inf-oblivion-absolute': 1 },
        ownedAbilities: { 'whiteout-domain': true },
        savedDecks: state.progress.savedDecks.map(deck => deck.id === state.progress.activeDeckId
          ? { ...deck, abilityLoadout: { 1: 'whiteout-domain' } }
          : deck),
      },
      turn: { ...state.turn, phase: 'playing', limitlessLightStacks: 20 },
    }));
    useStore.getState().activateAbility(1);
    const state = useStore.getState();
    expect(state.turn.whiteoutDomainUntil).toBeGreaterThan(Date.now());
    expect(state.turn.limitlessLightStacks).toBe(0);
    expect(state.turn.abilityCooldownUntil?.['whiteout-domain']).toBeGreaterThan(Date.now());
  });
});
