import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { CardEffectExecutor } from '@/systems/cards/CardEffectExecutor';
import { ainSophAurCards } from '@/data/cards/ainSophAurCards';
import { darkCards } from '@/data/cards/darkCards';
import { enigmaRewardCards } from '@/data/cards/enigmaRewardCards';
import { eternalCards } from '@/data/cards/eternalCards';
import { lightCards } from '@/data/cards/lightCards';
import { transcendentCardDefinitions } from '@/data/ascension/transcendentCards';
import { defaultGameState, useStore } from '@/state/store';
import type { CardDefinition, DarkCardDefinition } from '@/types/cards';
import type { DeckCard, GameState } from '@/types/game';

function resetStore(): void {
  const baseState = JSON.parse(JSON.stringify(defaultGameState)) as GameState;
  useStore.setState(state => ({ ...state, ...baseState }));
}

function deckCard(instanceId: string, definitionId: string): DeckCard {
  return { instanceId, definitionId, finish: 'normal' };
}

function activeMainDeckCard(definition: Extract<CardDefinition, { type: 'Light' | 'Dark' }>, instanceId: string) {
  return {
    instanceId,
    definitionId: definition.definitionId,
    type: definition.type,
    rarity: definition.rarity,
    finish: 'normal' as const,
    side: 'ain' as const,
    faceState: 'front' as const,
    limitlessCharge: 0,
    attackCooldowns: {},
    backSlot: 0 as const,
  };
}

function chargedSophCard(definition: Extract<CardDefinition, { type: 'Light' | 'Dark' }>, instanceId: string) {
  return {
    ...activeMainDeckCard(definition, instanceId),
    side: 'soph' as const,
    faceState: 'back' as const,
    limitlessCharge: 5,
  };
}

const registeredCards = CardRegistry.getAll();
const lightDefinitions = registeredCards.filter(card => card.type === 'Light');
const darkDefinitions = registeredCards.filter((card): card is DarkCardDefinition => card.type === 'Dark');
const asaDefinitions = registeredCards.filter(card => card.type === 'AinSophAur');

describe('complete card runtime wiring', () => {
  it('registers every source definition exactly once without ID overwrites', () => {
    const sourceDefinitions = [
      ...lightCards,
      ...darkCards,
      ...ainSophAurCards,
      ...eternalCards,
      ...enigmaRewardCards,
      ...transcendentCardDefinitions,
    ];
    const sourceIds = sourceDefinitions.map(card => card.definitionId);
    expect(new Set(sourceIds).size).toBe(sourceIds.length);
    expect(registeredCards).toHaveLength(sourceDefinitions.length);
    expect(new Set(registeredCards.map(card => card.definitionId))).toEqual(new Set(sourceIds));
  });

  it('flips and sacrifices every registered main-deck card from charged Soph', () => {
    const mainDeckDefinitions = [...lightDefinitions, ...darkDefinitions];
    for (const definition of mainDeckDefinitions) {
      const instanceId = `${definition.definitionId}-soph`;

      resetStore();
      useStore.setState(state => ({
        ...state,
        turn: { ...state.turn, phase: 'playing' },
        board: {
          ...state.board,
          backSlots: [chargedSophCard(definition, instanceId), null, null, null],
        },
      }));
      useStore.getState().flipSoph(instanceId, 'flip');
      expect(useStore.getState().board.backSlots[0], `${definition.definitionId} flip`).toMatchObject({
        side: 'ain',
        faceState: 'front',
        limitlessCharge: 0,
      });
      expect(useStore.getState().turn.limitlessLightStacks).toBe(5);

      resetStore();
      useStore.setState(state => ({
        ...state,
        turn: { ...state.turn, phase: 'playing' },
        board: {
          ...state.board,
          backSlots: [chargedSophCard(definition, instanceId), null, null, null],
        },
      }));
      const beforeSacrifice = useStore.getState().progress.oblivion;
      useStore.getState().flipSoph(instanceId, 'sacrifice');
      expect(useStore.getState().board.backSlots[0], `${definition.definitionId} sacrifice`).toBeNull();
      expect(useStore.getState().deck.discardPile.some(card => card.instanceId === instanceId)).toBe(true);
      expect(useStore.getState().progress.oblivion).toBeGreaterThan(beforeSacrifice);
    }
  });

  it('executes both attacks for every registered Light card', () => {
    for (const definition of lightDefinitions) {
      for (const attack of ['ain', 'soph'] as const) {
        resetStore();
        const instanceId = `${definition.definitionId}-${attack}`;
        useStore.setState(state => ({
          ...state,
          turn: { ...state.turn, phase: 'playing', limitlessLightStacks: 1_000 },
          board: {
            ...state.board,
            backSlots: [activeMainDeckCard(definition, instanceId), null, null, null],
          },
        }));

        const before = useStore.getState().progress.oblivion;
        if (attack === 'ain') useStore.getState().activateLightAinAttack(instanceId);
        else useStore.getState().activateLightSophAttack(instanceId);

        const state = useStore.getState();
        expect(state.progress.oblivion, `${definition.definitionId} ${attack}`).toBeGreaterThan(before);
        expect(state.board.backSlots[0]?.attackCooldowns[attack === 'ain' ? definition.ainAttack.id : definition.sophAttack.id]).toBeGreaterThan(0);
        if (attack === 'soph' && definition.sophAttack.stackCost) {
          expect(state.turn.limitlessLightStacks).toBeLessThan(1_000);
        }
        const afterFirstAttack = state.progress.oblivion;
        if (attack === 'ain') useStore.getState().activateLightAinAttack(instanceId);
        else useStore.getState().activateLightSophAttack(instanceId);
        expect(useStore.getState().progress.oblivion, `${definition.definitionId} ${attack} cooldown`).toBe(afterFirstAttack);
      }
    }
  });

  it('rejects every costed Soph attack atomically when stacks are insufficient', () => {
    for (const definition of lightDefinitions.filter(card => card.sophAttack.stackCost)) {
      const cost = definition.sophAttack.stackCost!;
      const requiredStacks = cost.kind === 'percentage'
        ? 1
        : cost.kind === 'range'
          ? Math.max(0, cost.min ?? 0)
          : Math.max(0, cost.value ?? 0);
      if (requiredStacks <= 0) continue;

      resetStore();
      const instanceId = `${definition.definitionId}-insufficient`;
      useStore.setState(state => ({
        ...state,
        turn: { ...state.turn, phase: 'playing', limitlessLightStacks: requiredStacks - 1 },
        board: {
          ...state.board,
          backSlots: [activeMainDeckCard(definition, instanceId), null, null, null],
        },
      }));
      const before = useStore.getState();

      useStore.getState().activateLightSophAttack(instanceId);

      const after = useStore.getState();
      expect(after.progress.oblivion, definition.definitionId).toBe(before.progress.oblivion);
      expect(after.turn.limitlessLightStacks).toBe(requiredStacks - 1);
      expect(after.board.backSlots[0]?.attackCooldowns[definition.sophAttack.id]).toBeUndefined();
    }
  });

  it('executes the authored utility for every registered Dark card', () => {
    const drawPile = [
      deckCard('draw-light-1', 'light-neutrality-1'),
      deckCard('draw-dark-1', 'dark-neutrality-1'),
      deckCard('draw-light-2', 'light-neutrality-2'),
      deckCard('draw-dark-2', 'dark-neutrality-2'),
      deckCard('draw-light-3', 'light-neutrality-3'),
      deckCard('draw-dark-3', 'dark-neutrality-3'),
    ];
    const discardPile = [
      deckCard('discard-light-1', 'light-neutrality-1'),
      deckCard('discard-light-2', 'light-neutrality-2'),
      deckCard('discard-dark-1', 'dark-neutrality-1'),
    ];

    for (const definition of darkDefinitions) {
      const deck = {
        ...structuredClone(defaultGameState.deck),
        hand: [deckCard('held-1', 'light-neutrality-4'), deckCard('held-2', 'dark-neutrality-4')],
        drawPile: structuredClone(drawPile),
        discardPile: structuredClone(discardPile),
      };
      const beforeDeck = JSON.stringify(deck);
      const result = CardEffectExecutor.execute(
        deckCard(`source-${definition.definitionId}`, definition.definitionId),
        { ...structuredClone(defaultGameState.turn), phase: 'playing' },
        structuredClone(defaultGameState.board),
        deck,
        false,
        { effects: definition.sophEffects, countAsPlay: false, removeFromHand: false },
      );

      expect(result.canPlay, definition.definitionId).toBe(true);
      const changed = JSON.stringify(result.deck) !== beforeDeck
        || result.pendingEffects.length > 0
        || result.oblivionBonus > 0;
      expect(changed, `${definition.definitionId} must produce a runtime result`).toBe(true);
    }
  });

  it('activates every registered Dark card through its board lifecycle', () => {
    for (const definition of darkDefinitions) {
      resetStore();
      const instanceId = `${definition.definitionId}-active`;
      useStore.setState(state => ({
        ...state,
        turn: { ...state.turn, phase: 'playing', limitlessLightStacks: 1_000 },
        board: {
          ...state.board,
          backSlots: [activeMainDeckCard(definition, instanceId), null, null, null],
        },
        deck: {
          ...state.deck,
          hand: [deckCard('held-1', 'light-neutrality-4'), deckCard('held-2', 'dark-neutrality-4')],
          drawPile: [
            deckCard('draw-light-1', 'light-neutrality-1'),
            deckCard('draw-dark-1', 'dark-neutrality-1'),
            deckCard('draw-light-2', 'light-neutrality-2'),
            deckCard('draw-dark-2', 'dark-neutrality-2'),
            deckCard('draw-light-3', 'light-neutrality-3'),
            deckCard('draw-dark-3', 'dark-neutrality-3'),
          ],
          discardPile: [
            deckCard('discard-light-1', 'light-neutrality-1'),
            deckCard('discard-light-2', 'light-neutrality-2'),
            deckCard('discard-dark-1', 'dark-neutrality-1'),
          ],
        },
      }));

      const stacksBefore = useStore.getState().turn.limitlessLightStacks;
      useStore.getState().activateDark(instanceId);
      const state = useStore.getState();
      expect(state.turn.limitlessLightStacks, definition.definitionId).toBeLessThan(stacksBefore);

      if (definition.persistent) {
        expect(state.board.backSlots[0]?.instanceId).toBe(instanceId);
        expect(state.board.backSlots[0]?.attackCooldowns[`${definition.definitionId}:activation`]).toBeGreaterThan(0);
      } else {
        expect(state.board.backSlots[0]).toBeNull();
        const destination = definition.postActivationFate === 'hand'
          ? state.deck.hand
          : definition.postActivationFate === 'deck'
            ? state.deck.drawPile
            : state.deck.discardPile;
        expect(destination.some(card => card.instanceId === instanceId), `${definition.definitionId} ${definition.postActivationFate}`).toBe(true);
      }

      const stacksAfterFirstActivation = state.turn.limitlessLightStacks;
      useStore.getState().activateDark(instanceId);
      expect(useStore.getState().turn.limitlessLightStacks, `${definition.definitionId} repeated activation`).toBe(stacksAfterFirstActivation);
    }
  });

  it('does not spend stacks when a target-dependent Dark utility cannot resolve', () => {
    const definition = darkDefinitions.find(card => card.sophEffects.some(effect => effect.type === 'salvage_by_type'))!;
    const instanceId = `${definition.definitionId}-no-target`;
    resetStore();
    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'playing', limitlessLightStacks: 20 },
      board: {
        ...state.board,
        backSlots: [activeMainDeckCard(definition, instanceId), null, null, null],
      },
      deck: { ...state.deck, discardPile: [] },
    }));

    useStore.getState().activateDark(instanceId);

    expect(useStore.getState().turn.limitlessLightStacks).toBe(20);
    expect(useStore.getState().board.backSlots[0]?.instanceId).toBe(instanceId);
  });

  it('summons and activates Bridge the Light for every registered Ain Soph Aur card', () => {
    for (const definition of asaDefinitions) {
      expect(new Set(definition.summonCost).size, `${definition.definitionId} material recipe`).toBe(definition.summonCost.length);
      resetStore();
      const materials = definition.summonCost.map((definitionId, index) => {
        const materialDefinition = CardRegistry.get(definitionId);
        if (!materialDefinition || (materialDefinition.type !== 'Light' && materialDefinition.type !== 'Dark')) {
          throw new Error(`${definition.definitionId} has invalid material ${definitionId}`);
        }
        return activeMainDeckCard(materialDefinition, `${definition.definitionId}-material-${index}`);
      });
      useStore.setState(state => ({
        ...state,
        turn: { ...state.turn, phase: 'playing', limitlessLightStacks: 1_000 },
        board: {
          ...state.board,
          backSlots: [...materials, ...Array(4 - materials.length).fill(null)] as GameState['board']['backSlots'],
        },
        deck: {
          ...state.deck,
          extraDeck: [{ definitionId: definition.definitionId, finish: 'normal' as const }],
        },
      }));

      const beforeSummon = useStore.getState().progress.oblivion;
      useStore.getState().summonAinSophAur(definition.definitionId, materials.map(card => card.instanceId), 0);
      const summoned = useStore.getState().board.frontSlots[0];
      expect(summoned?.definitionId, definition.definitionId).toBe(definition.definitionId);
      expect(useStore.getState().progress.oblivion, `${definition.definitionId} summon`).toBeGreaterThan(beforeSummon);

      const beforeBridge = useStore.getState().progress.oblivion;
      const stacksBeforeBridge = useStore.getState().turn.limitlessLightStacks;
      useStore.getState().activateAsaBridge(summoned!.instanceId);
      expect(useStore.getState().progress.oblivion, `${definition.definitionId} Bridge`).toBeGreaterThan(beforeBridge);
      expect(useStore.getState().board.frontSlots[0]?.attackCooldowns[definition.bridgeAttack!.id]).toBeGreaterThan(0);
      if (definition.bridgeAttack?.consumesStacks) {
        expect(useStore.getState().turn.limitlessLightStacks).toBeLessThan(stacksBeforeBridge);
      }
      const afterFirstBridge = useStore.getState().progress.oblivion;
      useStore.getState().activateAsaBridge(summoned!.instanceId);
      expect(useStore.getState().progress.oblivion, `${definition.definitionId} Bridge cooldown`).toBe(afterFirstBridge);
    }
  });
});
