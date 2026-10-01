import { describe, expect, it } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
import { ABILITY_REGISTRY, getAbilityMaterialCost, getAbilityTier } from '@/data/abilities/abilityDefinitions';
import { CardRegistry } from '@/cards/CardRegistry';
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

function prepareTranscendentAbility(abilityId: string, stacks: number): void {
  useStore.setState(state => ({
    ...state,
    progress: {
      ...state.progress,
      divineLight: 9_000_000,
      ownedAbilities: { ...(state.progress.ownedAbilities ?? {}), [abilityId]: true },
      savedDecks: state.progress.savedDecks.map(deck => deck.id === state.progress.activeDeckId
        ? { ...deck, abilityLoadout: { ...(deck.abilityLoadout ?? {}), 1: abilityId } }
        : deck),
    },
    turn: { ...state.turn, phase: 'playing', limitlessLightStacks: stacks, limitlessCosmosStacks: 0 },
  }));
}

describe('materialized ability runtime', () => {
  it('classifies Causality ability tiers from ownership gates', () => {
    expect(getAbilityTier(ABILITY_REGISTRY.get('causality-author-first-cause')!)).toBe('foundational');
    expect(getAbilityTier(ABILITY_REGISTRY.get('causality-causal-cartography')!)).toBe('foundational');
    expect(getAbilityTier(ABILITY_REGISTRY.get('causality-pearlescent-mandate')!)).toBe('eternal');
    expect(getAbilityTier(ABILITY_REGISTRY.get('causality-archive-elsewhen')!)).toBe('eternal');
    expect(getAbilityTier(ABILITY_REGISTRY.get('causality-final-cause')!)).toBe('infinite');
    expect(getAbilityTier(ABILITY_REGISTRY.get('causality-infinite-manuscript')!)).toBe('infinite');
  });

  it('adds a capstone Transcendent ability per Forge card with the required Divine Light + Shards cost', () => {
    const ids = ['transcendent-starbound-glimmer', 'transcendent-first-catalyst', 'transcendent-reliquary-all-nothing', 'transcendent-bridge-light-life'];
    for (const id of ids) {
      const ability = ABILITY_REGISTRY.get(id)!;
      expect(ability).toBeDefined();
      expect(getAbilityTier(ability)).toBe('infinite');
      expect(getAbilityMaterialCost(ability)).toEqual({ divineLight: 8_000_000, shardsOfTranscendence: 30 });
    }
  });

  it('charges the Transcendent ability purchase cost once and rejects duplicate purchases', () => {
    resetStore();
    useStore.setState(state => ({
      ...state,
      progress: { ...state.progress, divineLight: 8_000_000, shardsOfTranscendence: 30 },
    }));
    expect(useStore.getState().purchaseAbility('transcendent-starbound-glimmer')).toBe(true);
    expect(useStore.getState().progress.divineLight).toBe(0);
    expect(useStore.getState().progress.shardsOfTranscendence).toBe(0);
    expect(useStore.getState().progress.ownedAbilities?.['transcendent-starbound-glimmer']).toBe(true);
    expect(useStore.getState().purchaseAbility('transcendent-starbound-glimmer')).toBe(false);
  });

  it('uses distinct ability identities rather than repeating the Forge card names', () => {
    const abilityCardPairs = [
      ['transcendent-starbound-glimmer', 'tx-neutral-starbound-glimmer'],
      ['transcendent-first-catalyst', 'tx-neutral-null-catalyst'],
      ['transcendent-reliquary-all-nothing', 'tx-neutral-void-reliquary'],
      ['transcendent-bridge-light-life', 'tx-angel-starbound-null-archangel'],
    ];
    for (const [abilityId, cardId] of abilityCardPairs) {
      const ability = ABILITY_REGISTRY.get(abilityId)!;
      expect(ability.name).not.toBe(CardRegistry.get(cardId)?.name);
      expect(ability.description).not.toMatch(/Cosmos|Causality/i);
    }
  });

  it('activates all four Transcendent abilities without charging the one-time purchase currencies again', () => {
    resetStore();
    const firstDawn = 'transcendent-starbound-glimmer';
    prepareTranscendentAbility(firstDawn, 6);
    const beforeLight = useStore.getState().progress.divineLight;
    const beforeHand = useStore.getState().deck.hand.length;
    useStore.getState().activateAbility(1);
    expect(useStore.getState().turn.limitlessLightStacks).toBe(0);
    expect(useStore.getState().turn.limitlessCosmosStacks).toBe(0);
    expect(useStore.getState().deck.hand.length).toBe(beforeHand + 3);
    expect(useStore.getState().progress.divineLight).toBeGreaterThan(beforeLight);
    expect(useStore.getState().turn.abilityCooldownUntil?.[firstDawn]).toBeGreaterThan(Date.now());

    resetStore();
    const axiom = 'transcendent-first-catalyst';
    prepareTranscendentAbility(axiom, 8);
    useStore.setState(state => ({
      ...state,
      board: {
        ...state.board,
        backSlots: [{ instanceId: 'cooldown-card', definitionId: 'light-neutrality-1', type: 'Light', rarity: 'Common', finish: 'normal', side: 'ain', faceState: 'front', limitlessCharge: 0, attackCooldowns: { 'some-attack': 3 }, backSlot: 0 }, null, null, null],
      },
    }));
    const catalystCooldownBefore = useStore.getState().board.backSlots[0]?.attackCooldowns['some-attack'];
    useStore.getState().activateAbility(1);
    expect(useStore.getState().board.backSlots[0]?.attackCooldowns['some-attack']).toBe(catalystCooldownBefore);
    expect(useStore.getState().turn.limitlessLightStacks).toBe(4);
    expect(useStore.getState().deck.hand).toHaveLength(2);

    resetStore();
    const vault = 'transcendent-reliquary-all-nothing';
    prepareTranscendentAbility(vault, 10);
    useStore.setState(state => ({
      ...state,
      deck: { ...state.deck, discardPile: [
        { instanceId: 'discard-a', definitionId: 'light-neutrality-1', finish: 'normal' },
        { instanceId: 'discard-b', definitionId: 'dark-neutrality-1', finish: 'normal' },
      ] },
    }));
    useStore.getState().activateAbility(1);
    expect(useStore.getState().turn.pendingEffect?.type).toBe('salvage');
    expect(useStore.getState().turn.limitlessLightStacks).toBe(0);
    useStore.getState().resolvePending(['discard-a', 'discard-b']);
    expect(useStore.getState().turn.pendingEffect).toBeNull();
    expect(useStore.getState().deck.hand.map(card => card.instanceId)).toEqual(expect.arrayContaining(['discard-a', 'discard-b']));
    expect(useStore.getState().progress.divineLight).toBeGreaterThan(9_000_000);
    expect(useStore.getState().turn.abilityCooldownUntil?.[vault]).toBeGreaterThan(Date.now());

    resetStore();
    const confluence = 'transcendent-bridge-light-life';
    prepareTranscendentAbility(confluence, 12);
    useStore.setState(state => ({
      ...state,
      board: {
        ...state.board,
        backSlots: [
          { instanceId: 'causality-card', definitionId: 'light-causality-1', type: 'Light', rarity: 'Rare', finish: 'normal', side: 'ain', faceState: 'front', limitlessCharge: 0, attackCooldowns: { 'causality-attack': 3 }, backSlot: 0 },
          { instanceId: 'neutrality-card', definitionId: 'light-neutrality-1', type: 'Light', rarity: 'Common', finish: 'normal', side: 'ain', faceState: 'front', limitlessCharge: 0, attackCooldowns: { 'neutrality-attack': 3 }, backSlot: 1 },
          null,
          null,
        ],
      },
    }));
    const finalLight = useStore.getState().progress.divineLight;
    useStore.getState().activateAbility(1);
    expect(useStore.getState().turn.limitlessCosmosStacks).toBe(0);
    expect(useStore.getState().turn.limitlessLightStacks).toBe(0);
    expect(useStore.getState().board.backSlots[0]?.attackCooldowns['causality-attack']).toBe(3);
    expect(useStore.getState().board.backSlots[1]?.attackCooldowns['neutrality-attack']).toBe(3);
    expect(useStore.getState().deck.hand).toHaveLength(3);
    expect(useStore.getState().progress.divineLight).toBeGreaterThan(finalLight);
    expect(useStore.getState().turn.abilityCooldownUntil?.[confluence]).toBeGreaterThan(Date.now());
  });

  it('requires the complete base Causality collection and escalates Eternal/Infinite gates', () => {
    resetStore();
    useStore.setState(state => ({ ...state, progress: { ...state.progress, divineLight: 75_000_000 } }));
    expect(useStore.getState().purchaseAbility('causality-author-first-cause')).toBe(false);

    const baseCausalityIds = [
      ...Array.from({ length: 10 }, (_, index) => `light-causality-${index + 1}`),
      ...Array.from({ length: 10 }, (_, index) => `dark-causality-${index + 1}`),
      ...Array.from({ length: 5 }, (_, index) => `ain-soph-aur-causality-${index + 1}`),
    ];
    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        collection: Object.fromEntries(baseCausalityIds.map(id => [id, 1])),
      },
    }));
    expect(useStore.getState().purchaseAbility('causality-author-first-cause')).toBe(true);
    expect(useStore.getState().purchaseAbility('causality-causal-cartography')).toBe(true);
    expect(useStore.getState().purchaseAbility('causality-pearlescent-mandate')).toBe(false);

    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        collection: { ...state.progress.collection, 'btei-causality-first-cause': 1 },
      },
    }));
    expect(useStore.getState().purchaseAbility('causality-pearlescent-mandate')).toBe(true);
    expect(useStore.getState().purchaseAbility('causality-final-cause')).toBe(false);

    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        infiniteCollection: { ...state.progress.infiniteCollection, 'inf-causality-origin-script': 1 },
      },
    }));
    expect(useStore.getState().purchaseAbility('causality-final-cause')).toBe(true);
    expect(useStore.getState().purchaseAbility('causality-infinite-manuscript')).toBe(true);
  });

  it('activates the Causality engine and persists its equipped loadout', () => {
    resetStore();
    const abilityId = 'causality-author-first-cause';
    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
          collection: {
            ...Object.fromEntries([
              ...Array.from({ length: 10 }, (_, index) => [`light-causality-${index + 1}`, 1]),
              ...Array.from({ length: 10 }, (_, index) => [`dark-causality-${index + 1}`, 1]),
              ...Array.from({ length: 5 }, (_, index) => [`ain-soph-aur-causality-${index + 1}`, 1]),
            ]),
          },
        ownedAbilities: { [abilityId]: true },
        savedDecks: state.progress.savedDecks.map(deck => deck.id === state.progress.activeDeckId
          ? { ...deck, abilityLoadout: { 1: abilityId } }
          : deck),
      },
      turn: { ...state.turn, phase: 'playing', limitlessLightStacks: 4, limitlessCosmosStacks: 0 },
    }));

    const beforeCooldown = useStore.getState().turn.abilityCooldownUntil?.[abilityId] ?? 0;
    useStore.getState().activateAbility(1);
    const after = useStore.getState();
    expect(after.turn.limitlessLightStacks).toBe(0);
    expect(after.turn.limitlessCosmosStacks).toBe(4);
    expect(after.turn.abilityCooldownUntil?.[abilityId]).toBeGreaterThan(beforeCooldown);

    const savedDeck = after.progress.savedDecks.find(deck => deck.id === after.progress.activeDeckId)!;
    expect(savedDeck.abilityLoadout?.[1]).toBe(abilityId);
  });

  it('atomically cashes out Infinite Causality and refreshes only Causality cooldowns', () => {
    resetStore();
    const abilityId = 'causality-final-cause';
    useStore.setState(state => ({
      ...state,
      progress: {
        ...state.progress,
        infiniteCollection: { 'inf-causality-origin-script': 1 },
        ownedAbilities: { [abilityId]: true },
        savedDecks: state.progress.savedDecks.map(deck => deck.id === state.progress.activeDeckId
          ? { ...deck, abilityLoadout: { 1: abilityId } }
          : deck),
      },
      turn: { ...state.turn, phase: 'playing', limitlessCosmosStacks: 8 },
      board: {
        ...state.board,
        backSlots: [
          { instanceId: 'causal-light', definitionId: 'light-causality-1', type: 'Light', rarity: 'Rare', finish: 'normal', side: 'ain', faceState: 'front', limitlessCharge: 0, attackCooldowns: { 'causal-attack': 4 }, backSlot: 0 },
          { instanceId: 'neutral-light', definitionId: 'light-neutrality-1', type: 'Light', rarity: 'Common', finish: 'normal', side: 'ain', faceState: 'front', limitlessCharge: 0, attackCooldowns: { 'neutral-attack': 4 }, backSlot: 1 },
          null,
          null,
        ],
      },
    }));

    const before = useStore.getState().progress.divineLight;
    useStore.getState().activateAbility(1);
    const after = useStore.getState();
    expect(after.turn.limitlessCosmosStacks).toBe(0);
    expect(after.progress.divineLight).toBeGreaterThan(before);
    expect(after.board.backSlots[0]?.attackCooldowns['causal-attack']).toBe(2);
    expect(after.board.backSlots[1]?.attackCooldowns['neutral-attack']).toBe(4);
    expect(after.turn.abilityCooldownUntil?.[abilityId]).toBeGreaterThan(Date.now());
  });

  it('resolves Neutralizing Inferno through discard selection', () => {
    resetStore();
    equip('neutralizing-inferno');
    useStore.setState(state => ({
      ...state,
      deck: { ...state.deck, hand: [
        { instanceId: 'inferno-card', definitionId: 'light-neutrality-1', finish: 'normal' },
      ] },
    }));

    const before = useStore.getState().progress.divineLight;
    useStore.getState().activateAbility(1);
    expect(useStore.getState().turn.pendingEffect?.type).toBe('discard_choice');
    useStore.getState().resolvePending(['inferno-card']);
    const after = useStore.getState();
    expect(after.progress.divineLight).toBeGreaterThan(before);
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
    const before = useStore.getState().progress.divineLight;
    useStore.getState().playCard(card.instanceId, 'ain');
    expect(useStore.getState().progress.divineLight).toBeGreaterThan(before);
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
    useStore.setState(state => ({ ...state, progress: { ...state.progress, divineLight: 1_000_000 } }));
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
    const before = useStore.getState().progress.divineLight;
    useStore.getState().resolvePending(['reversal-a', 'reversal-b']);
    expect(useStore.getState().progress.divineLight - before).toBe(50_000);
    expect(useStore.getState().deck.hand).toHaveLength(1);
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
