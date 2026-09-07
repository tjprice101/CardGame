import { describe, expect, it } from 'vitest';
import { useStore, defaultGameState } from '@/state/store';
import { lightCards } from '@/data/cards/lightCards';
import { darkCards } from '@/data/cards/darkCards';
import { ainSophAurCards } from '@/data/cards/ainSophAurCards';
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
          limitlessCharge: 5,
          attackCooldowns: {},
          backSlot: 0 as const,
        }, null, null, null],
      },
    }));

    useStore.getState().flipSoph(card.instanceId, 'flip');

    expect(useStore.getState().turn.limitlessLightStacks).toBe(5);
    expect(useStore.getState().board.backSlots[0]).toMatchObject({ side: 'ain', faceState: 'front', limitlessCharge: 0 });
  });

  it('casts an allowed Dark card directly from hand and spends LLS', () => {
    resetStore();
    const card = { instanceId: 'dark-cast', definitionId: darkCards[0].definitionId, finish: 'normal' as const };
    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'playing', limitlessLightStacks: 10 },
      deck: { ...state.deck, hand: [card] },
    }));

    useStore.getState().playCard(card.instanceId, 'cast');

    expect(useStore.getState().deck.hand.some(heldCard => heldCard.instanceId === card.instanceId)).toBe(false);
    expect(useStore.getState().turn.limitlessLightStacks).toBe(9);
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
});
