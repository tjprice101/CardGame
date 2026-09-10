import { describe, expect, it } from 'vitest';
import { useStore, defaultGameState } from '@/state/store';
import { lightCards } from '@/data/cards/lightCards';
import { darkCards } from '@/data/cards/darkCards';
import { ainSophAurCards } from '@/data/cards/ainSophAurCards';
import { SOPH_FLIP_CHARGE_REQUIRED } from '@/systems/cards/AinSophRuntime';
import { enigmaRewardCards } from '@/data/cards/enigmaRewardCards';
import { CardRegistry } from '@/cards/CardRegistry';
import type { GameState } from '@/types/game';

function resetStore(): void {
  const baseState = JSON.parse(JSON.stringify(defaultGameState)) as GameState;
  useStore.setState(state => ({ ...state, ...baseState }));
}

describe('Ain/Soph gameplay loop', () => {
  it('places Light cards face-down as Soph and accrues charge on later plays', () => {
    resetStore();
    const first = { instanceId: 'light-1', definitionId: lightCards[0].definitionId, finish: 'normal' as const };
    const second = { instanceId: 'light-2', definitionId: lightCards[1].definitionId, finish: 'normal' as const };
    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'playing' },
      deck: { ...state.deck, hand: [first, second] },
    }));

    useStore.getState().playCard(first.instanceId);
    useStore.getState().playCard(second.instanceId);

    const board = useStore.getState().board;
    expect(board.backSlots[0]).toMatchObject({ type: 'Light', side: 'soph', faceState: 'back', limitlessCharge: 2 });
    expect(board.backSlots[1]).toMatchObject({ type: 'Light', side: 'soph', faceState: 'back', limitlessCharge: 1 });
  });

  it('flips a charged Soph card into Ain and stores its charge as LLS', () => {
    resetStore();
    const card = { instanceId: 'light-flip', definitionId: lightCards[0].definitionId, finish: 'normal' as const };
    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'playing' },
      board: {
        ...state.board,
        backSlots: [{
          ...card,
          type: 'Light' as const,
          rarity: lightCards[0].rarity,
          side: 'soph' as const,
          faceState: 'back' as const,
          limitlessCharge: SOPH_FLIP_CHARGE_REQUIRED,
          attackCooldowns: {},
          backSlot: 0 as const,
        }, null, null, null],
      },
    }));

    useStore.getState().flipSoph(card.instanceId, 'flip');

    expect(useStore.getState().turn.limitlessLightStacks).toBe(SOPH_FLIP_CHARGE_REQUIRED);
    expect(useStore.getState().board.backSlots[0]).toMatchObject({ side: 'ain', faceState: 'front', limitlessCharge: 0 });
  });

  it('requires exactly two Soph charges before flipping', () => {
    resetStore();
    const definition = lightCards[0];
    const card = {
      instanceId: 'light-undercharged', definitionId: definition.definitionId,
      type: 'Light' as const, rarity: definition.rarity, finish: 'normal' as const,
      side: 'soph' as const, faceState: 'back' as const,
      limitlessCharge: SOPH_FLIP_CHARGE_REQUIRED - 1,
      attackCooldowns: {}, backSlot: 0 as const,
    };
    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'playing' },
      board: { ...state.board, backSlots: [card, null, null, null] },
    }));

    useStore.getState().flipSoph(card.instanceId, 'flip');
    expect(useStore.getState().board.backSlots[0]).toMatchObject({ side: 'soph', faceState: 'back' });

    useStore.setState(state => {
      const slots = [...state.board.backSlots] as GameState['board']['backSlots'];
      slots[0] = { ...slots[0]!, limitlessCharge: SOPH_FLIP_CHARGE_REQUIRED };
      return { ...state, board: { ...state.board, backSlots: slots } };
    });
    useStore.getState().flipSoph(card.instanceId, 'flip');

    expect(useStore.getState().board.backSlots[0]).toMatchObject({ side: 'ain', faceState: 'front' });
    expect(useStore.getState().turn.limitlessLightStacks).toBe(SOPH_FLIP_CHARGE_REQUIRED);
  });

  it('places every main-deck card on Soph or Ain according to the requested side', () => {
    const definitions = CardRegistry.getAll().filter(card => card.type === 'Light' || card.type === 'Dark');
    expect(definitions.length).toBeGreaterThan(0);

    for (const definition of definitions) {
      for (const side of ['soph', 'ain'] as const) {
        resetStore();
        const instanceId = `${definition.definitionId}-${side}`;
        useStore.setState(state => ({
          ...state,
          turn: { ...state.turn, phase: 'playing' },
          deck: {
            ...state.deck,
            hand: [{ instanceId, definitionId: definition.definitionId, finish: 'normal' as const }],
          },
        }));

        useStore.getState().playCard(instanceId, side);

        expect(useStore.getState().board.backSlots[0], definition.definitionId).toMatchObject({
          definitionId: definition.definitionId,
          side,
          faceState: side === 'soph' ? 'back' : 'front',
        });
      }
    }
  });

  it('routes one-shot Dark cards away but keeps persistent Dark cards on the board with cooldowns', () => {
    resetStore();
    const oneShot = darkCards[0];
    const persistent = enigmaRewardCards.find(card => card.type === 'Dark' && card.persistent);
    expect(persistent).toBeDefined();

    const makeBoardDark = (instanceId: string, definitionId: string, rarity: typeof oneShot.rarity) => ({
      instanceId, definitionId, type: 'Dark' as const, rarity, finish: 'normal' as const,
      side: 'ain' as const, faceState: 'front' as const, limitlessCharge: 0,
      attackCooldowns: {}, backSlot: 0 as const,
    });
    const persistentDark = persistent!;
    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'playing', limitlessLightStacks: 12 },
      board: {
        ...state.board,
        backSlots: [
          makeBoardDark('one-shot-dark', oneShot.definitionId, oneShot.rarity),
          { ...makeBoardDark('persistent-dark', persistentDark.definitionId, persistentDark.rarity), backSlot: 1 as const },
          null,
          null,
        ],
      },
    }));

    useStore.getState().activateDark('one-shot-dark');
    expect(useStore.getState().board.backSlots[0]).toBeNull();

    useStore.getState().activateDark('persistent-dark');
    const retained = useStore.getState().board.backSlots[1];
    expect(retained).toMatchObject({ instanceId: 'persistent-dark', definitionId: persistentDark.definitionId });
    expect(retained?.attackCooldowns[`${persistentDark.definitionId}:activation`]).toBe(persistentDark.cooldownCardsPlayed);
  });

  it('summons Ain Soph Aur by consuming a back-row material', () => {
    resetStore();
    const material = {
      instanceId: 'material-1',
      definitionId: lightCards[0].definitionId,
      type: 'Light' as const,
      rarity: lightCards[0].rarity,
      finish: 'normal' as const,
      side: 'ain' as const,
      faceState: 'front' as const,
      limitlessCharge: 0,
      attackCooldowns: {},
      backSlot: 0 as const,
    };
    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'playing' },
      deck: { ...state.deck, extraDeck: [{ definitionId: ainSophAurCards[0].definitionId, finish: 'normal' as const }] },
      board: { ...state.board, backSlots: [material, null, null, null] },
    }));

    useStore.getState().summonAinSophAur(ainSophAurCards[0].definitionId, [material.instanceId], 0);

    expect(useStore.getState().board.backSlots[0]).toBeNull();
    expect(useStore.getState().board.frontSlots[0]).toMatchObject({ type: 'AinSophAur', side: 'ain', faceState: 'front' });
  });

  it('force-removes main-deck cards to discard and Ain Soph Aur cards to the Extra Deck', () => {
    resetStore();
    const mainDefinition = lightCards[0];
    const asaDefinition = ainSophAurCards[0];
    const mainCard = {
      instanceId: 'force-main', definitionId: mainDefinition.definitionId,
      type: 'Light' as const, rarity: mainDefinition.rarity, finish: 'normal' as const,
      side: 'soph' as const, faceState: 'back' as const, limitlessCharge: 3,
      attackCooldowns: {}, backSlot: 0 as const,
    };
    const asaCard = {
      instanceId: 'force-asa', definitionId: asaDefinition.definitionId,
      type: 'AinSophAur' as const, rarity: asaDefinition.rarity, finish: 'holo' as const,
      side: 'ain' as const, faceState: 'front' as const, cardClass: 'ain-soph-aur' as const,
      limitlessCharge: 0, attackCooldowns: {}, boardSlot: 0 as const,
    };
    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'playing' },
      board: {
        ...state.board,
        frontSlots: [asaCard, null, null, null],
        backSlots: [mainCard, null, null, null],
      },
    }));

    useStore.getState().forceRemoveBoardCard(mainCard.instanceId);
    expect(useStore.getState().board.backSlots[0]).toBeNull();
    expect(useStore.getState().deck.discardPile).toContainEqual(expect.objectContaining({
      instanceId: mainCard.instanceId,
      definitionId: mainCard.definitionId,
    }));

    useStore.getState().forceRemoveBoardCard(asaCard.instanceId);
    expect(useStore.getState().board.frontSlots[0]).toBeNull();
    expect(useStore.getState().deck.extraDeck).toContainEqual({
      definitionId: asaCard.definitionId,
      finish: 'holo',
    });
  });

  it('does not force-remove field cards outside the playing phase', () => {
    resetStore();
    const definition = lightCards[0];
    const card = {
      instanceId: 'force-idle', definitionId: definition.definitionId,
      type: 'Light' as const, rarity: definition.rarity, finish: 'normal' as const,
      side: 'ain' as const, faceState: 'front' as const, limitlessCharge: 0,
      attackCooldowns: {}, backSlot: 0 as const,
    };
    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'idle' },
      board: { ...state.board, backSlots: [card, null, null, null] },
    }));

    useStore.getState().forceRemoveBoardCard(card.instanceId);

    expect(useStore.getState().board.backSlots[0]?.instanceId).toBe(card.instanceId);
    expect(useStore.getState().deck.discardPile).toHaveLength(0);
  });
});
