import { beforeEach, describe, expect, it } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
import type { DeckCard, DeckEntry, ExtraDeckEntry } from '@/types/game';

function resetStore(): void {
  const baseState = JSON.parse(JSON.stringify(defaultGameState)) as typeof defaultGameState;
  useStore.setState(state => ({ ...state, ...baseState }));
  useStore.getState().refreshComputedStats();
}

function buildHand(definitionIds: string[]): DeckCard[] {
  return definitionIds.map((definitionId, index) => ({
    instanceId: `hand_${index}`,
    definitionId,
    finish: 'normal',
  }));
}

function seedPlayingState(definitionIds: string[], extraDeck: ExtraDeckEntry[] = []): void {
  const hand = buildHand(definitionIds);
  const deckList: DeckEntry[] = definitionIds.map(definitionId => ({ definitionId, copies: 1, finish: 'normal' }));

  useStore.setState(state => ({
    ...state,
    board: {
      ...defaultGameState.board,
      frontSlots: [null, null, null, null, null],
      backSlots: [null, null, null, null],
      activeBoardEffects: [],
      emberGrove: [],
    },
    deck: {
      deckList,
      extraDeck,
      drawPile: Array.from({ length: 18 }, (_, index) => ({
        instanceId: `draw_${index}`,
        definitionId: 'seek-neutral-void-surge',
        finish: 'normal',
      })),
      hand,
      discardPile: [],
    },
    turn: {
      ...defaultGameState.turn,
      phase: 'playing',
      pendingEffect: null,
      butterflySpectrum: 0,
      butterflyFlutterLevel: 0,
      butterflyFormation: 0,
      butterflyFormationTypesSeen: [],
      secondaryCounters: { flutter: 0 },
    },
    progress: {
      ...state.progress,
      oblivion: 0,
    },
    bossFight: {
      ...defaultGameState.bossFight,
    },
  }));

  useStore.getState().refreshComputedStats();
}

describe('Butterfly formation progression', () => {
  beforeEach(() => {
    resetStore();
  });

  it('grants +2 flutter progression for base Butterfly Ophanim plays', () => {
    seedPlayingState(['bf-oph-ridge-trace']);

    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.turn.butterflySpectrum).toBe(4);
    expect(state.turn.butterflyFlutterLevel).toBe(1);
    expect(state.turn.butterflyFormation).toBe(1);
    expect(state.turn.butterflyFormationTypesSeen).toEqual(['Ophanim']);
  });

  it('counts each Butterfly unit type once per cycle for Formation', () => {
    seedPlayingState(['bf-oph-ridge-trace', 'bf-oph-ridge-trace']);

    useStore.getState().playCard('hand_0');
    useStore.getState().playCard('hand_1');

    const state = useStore.getState();
    expect(state.turn.butterflyFormation).toBe(1);
    expect(state.turn.butterflyFormationTypesSeen).toEqual(['Ophanim']);
  });

  it('resets flutter and formation on descent at 12', () => {
    seedPlayingState(['bf-oph-ridge-trace', 'bf-oph-ridge-trace', 'bf-oph-ridge-trace']);

    useStore.getState().playCard('hand_0');
    useStore.getState().playCard('hand_1');
    useStore.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        nextCardMultiplied: false,
      },
    }));
    useStore.getState().playCard('hand_2');

    const state = useStore.getState();
    expect(state.turn.butterflySpectrum).toBe(0);
    expect(state.turn.butterflyFlutterLevel).toBe(0);
    expect(state.turn.butterflyFormation).toBe(0);
    expect(state.turn.butterflyFormationTypesSeen).toEqual([]);
  });

  it('does not apply base progression to Eternal Butterfly cards', () => {
    seedPlayingState(['bf-et-kethravoss-seven-layers']);

    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.turn.butterflyFormation).toBe(0);
    expect(state.turn.butterflyFormationTypesSeen).toEqual([]);
  });

  it('counts angel summons for formation but not angel activations', () => {
    seedPlayingState(
      [
        'bf-ser-unfurling-cantor',
        'bf-ser-ferrathi-iron-hum',
        'seek-neutral-void-surge',
        'seek-neutral-void-surge',
      ],
      [{ definitionId: 'bf-angel-meadow-navigator', finish: 'normal' }],
    );

    useStore.getState().playCard('hand_0');
    useStore.getState().playCard('hand_1');
    useStore.getState().summonAngel('bf-angel-meadow-navigator', 'normal');

    let state = useStore.getState();
    expect(state.turn.butterflyFormation).toBe(2);
    expect(new Set(state.turn.butterflyFormationTypesSeen)).toEqual(new Set(['Seraphim', 'Angel']));

    useStore.getState().playCard('hand_2');
    useStore.getState().playCard('hand_3');

    state = useStore.getState();
    const angelSlot = state.board.frontSlots.findIndex(slot => slot?.type === 'Angel' && slot.definitionId === 'bf-angel-meadow-navigator');
    expect(angelSlot).toBeGreaterThanOrEqual(0);

    useStore.getState().activateAngel(angelSlot as 0 | 1 | 2 | 3 | 4);

    state = useStore.getState();
    expect(state.turn.butterflyFormation).toBe(2);
    expect(new Set(state.turn.butterflyFormationTypesSeen)).toEqual(new Set(['Seraphim', 'Angel']));
  });
});
