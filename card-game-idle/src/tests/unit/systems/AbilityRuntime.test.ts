import { describe, expect, it } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
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
});
