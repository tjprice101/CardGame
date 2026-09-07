import { describe, expect, it } from 'vitest';
import { useStore, defaultGameState } from '@/state/store';
import { lightCards } from '@/data/cards/lightCards';
import { darkCards } from '@/data/cards/darkCards';
import { ainSophAurCards } from '@/data/cards/ainSophAurCards';
import type { GameState, MainDeckBoardInstance } from '@/types/game';

function resetStore(): void {
  const baseState = JSON.parse(JSON.stringify(defaultGameState)) as GameState;
  useStore.setState(state => ({ ...state, ...baseState }));
}

function handCard(instanceId: string, definitionId: string) {
  return { instanceId, definitionId, finish: 'normal' as const };
}

/** Places a Light card directly on the back row already flipped to its Ain side. */
function activeLightSlot(instanceId: string, index: number) {
  const def = lightCards[index];
  return {
    instanceId,
    definitionId: def.definitionId,
    type: 'Light' as const,
    rarity: def.rarity,
    finish: 'normal' as const,
    side: 'ain' as const,
    faceState: 'front' as const,
    limitlessCharge: 0,
    attackCooldowns: {},
    backSlot: 0 as const,
  };
}

describe('Full turn end-to-end', () => {
  it('runs a complete build-up turn and wipes everything except Oblivion', () => {
    resetStore();

    const light = handCard('e2e-light', lightCards[0].definitionId);
    const dark = handCard('e2e-dark', darkCards[0].definitionId);
    const filler = Array.from({ length: 4 }, (_, i) =>
      handCard(`e2e-filler-${i}`, lightCards[i + 1].definitionId));

    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'playing' },
      deck: { ...state.deck, hand: [light, dark, ...filler] },
    }));

    // 1. Play a Light card and a Dark card face-down into the back row.
    useStore.getState().playCard(light.instanceId);
    useStore.getState().playCard(dark.instanceId, 'place');

    let board = useStore.getState().board;
    expect(board.backSlots[0]).toMatchObject({ type: 'Light', side: 'soph', faceState: 'back' });
    expect(board.backSlots[1]).toMatchObject({ type: 'Dark', side: 'soph', faceState: 'back' });

    // 2. Charge the first card to the flip threshold via further hand plays.
    //    Back row is 4 wide and already holds 2, so only 2 more can be placed.
    useStore.getState().playCard(filler[0].instanceId);
    useStore.getState().playCard(filler[1].instanceId);

    board = useStore.getState().board;
    const charged = board.backSlots[0] as MainDeckBoardInstance;
    expect(charged.limitlessCharge).toBeGreaterThanOrEqual(4);

    // Top the card up to the flip threshold so the rest of the loop can run
    // regardless of how many back slots happened to be free.
    useStore.setState(state => {
      const slots = [...state.board.backSlots] as GameState['board']['backSlots'];
      const slot = slots[0] as MainDeckBoardInstance;
      slots[0] = { ...slot, limitlessCharge: 5 };
      return { ...state, board: { ...state.board, backSlots: slots } };
    });

    // 3. Flip the charged card — its charge becomes Limitless Light Stacks.
    useStore.getState().flipSoph('e2e-light', 'flip');
    expect(useStore.getState().turn.limitlessLightStacks).toBe(5);
    expect(useStore.getState().board.backSlots[0]).toMatchObject({ side: 'ain', faceState: 'front', limitlessCharge: 0 });

    // 4. Ain Attack reads stacks without consuming them.
    const oblivionBeforeAin = useStore.getState().progress.oblivion;
    const stacksBeforeAin = useStore.getState().turn.limitlessLightStacks;
    useStore.getState().activateLightAinAttack('e2e-light');
    expect(useStore.getState().progress.oblivion).toBeGreaterThan(oblivionBeforeAin);
    expect(useStore.getState().turn.limitlessLightStacks).toBe(stacksBeforeAin);

    // 5. Soph Attack consumes stacks but still pays out.
    const oblivionBeforeSoph = useStore.getState().progress.oblivion;
    useStore.getState().activateLightSophAttack('e2e-light');
    expect(useStore.getState().progress.oblivion).toBeGreaterThan(oblivionBeforeSoph);
    expect(useStore.getState().turn.limitlessLightStacks).toBeLessThan(stacksBeforeAin);

    // 6. End the turn — everything except Oblivion resets.
    const oblivionBeforeEnd = useStore.getState().progress.oblivion;
    useStore.getState().endTurn();

    const after = useStore.getState();
    expect(after.progress.oblivion).toBe(oblivionBeforeEnd);
    expect(after.turn.limitlessLightStacks).toBe(0);
    expect(after.deck.hand).toHaveLength(0);
    expect(after.board.frontSlots.every(slot => slot === null)).toBe(true);
    expect(after.board.backSlots.every(slot => slot === null)).toBe(true);
  });

  it('summons an Ain Soph Aur from back-row materials and fires Bridge the Light', () => {
    resetStore();

    const asaDef = ainSophAurCards[0];
    const materialCount = Math.max(1, asaDef.summonCost.length);
    const materialIds = Array.from({ length: materialCount }, (_, i) => `e2e-mat-${i}`);

    useStore.setState(state => {
      const slots = [null, null, null, null] as GameState['board']['backSlots'];
      materialIds.forEach((id, i) => {
        slots[i] = { ...activeLightSlot(id, i), backSlot: i as 0 | 1 | 2 | 3 };
      });
      return {
        ...state,
        turn: { ...state.turn, phase: 'playing', limitlessLightStacks: 40 },
        board: { ...state.board, backSlots: slots },
        deck: { ...state.deck, extraDeck: [{ definitionId: asaDef.definitionId, finish: 'normal' as const }] },
      };
    });

    useStore.getState().summonAinSophAur(asaDef.definitionId, materialIds, 0);

    const board = useStore.getState().board;
    expect(board.frontSlots[0]).toMatchObject({ type: 'AinSophAur', side: 'ain', faceState: 'front' });
    // Materials were consumed off the back row.
    for (let i = 0; i < materialCount; i++) {
      expect(board.backSlots[i]).toBeNull();
    }

    const asaInstance = board.frontSlots[0]!;
    const oblivionBeforeBridge = useStore.getState().progress.oblivion;
    useStore.getState().activateAsaBridge(asaInstance.instanceId);
    expect(useStore.getState().progress.oblivion).toBeGreaterThan(oblivionBeforeBridge);
  });

  it('pays a Soph Attack cost without shrinking that attack\'s own payout', () => {
    resetStore();

    // Two identical Light cards: one attacks at a high pool, one at a low pool.
    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'playing', limitlessLightStacks: 30 },
      board: {
        ...state.board,
        backSlots: [activeLightSlot('e2e-high', 0), null, null, null],
      },
    }));
    const beforeHigh = useStore.getState().progress.oblivion;
    useStore.getState().activateLightSophAttack('e2e-high');
    const highPayout = useStore.getState().progress.oblivion - beforeHigh;

    resetStore();
    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'playing', limitlessLightStacks: 5 },
      board: {
        ...state.board,
        backSlots: [activeLightSlot('e2e-low', 0), null, null, null],
      },
    }));
    const beforeLow = useStore.getState().progress.oblivion;
    useStore.getState().activateLightSophAttack('e2e-low');
    const lowPayout = useStore.getState().progress.oblivion - beforeLow;

    // A larger pre-spend pool must produce a strictly larger payout.
    expect(highPayout).toBeGreaterThan(lowPayout);
  });

  it('enforces the hand cap of 8 after a hand-cast Dark card draws', () => {
    resetStore();

    // A hand-castable Dark card whose utility draws into an already-full hand.
    const castable = darkCards.find(d => d.allowHandCast)!;
    const cast = handCard('e2e-cast', castable.definitionId);
    const rest = Array.from({ length: 7 }, (_, i) =>
      handCard(`e2e-hand-${i}`, darkCards[(i + 1) % darkCards.length].definitionId));
    const drawPile = Array.from({ length: 6 }, (_, i) =>
      handCard(`e2e-draw-${i}`, lightCards[i].definitionId));

    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'playing', limitlessLightStacks: 50 },
      deck: { ...state.deck, hand: [cast, ...rest], drawPile },
    }));

    useStore.getState().playCard(cast.instanceId, 'cast');

    const after = useStore.getState();
    const pending = after.turn.pendingEffect;
    // Either the hand stayed within the cap, or an overflow discard was queued.
    if (after.deck.hand.length > 8) {
      expect(pending?.type).toBe('discard_choice');
    } else {
      expect(after.deck.hand.length).toBeLessThanOrEqual(8);
    }
  });
});
