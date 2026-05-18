import { beforeEach, describe, expect, it } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
import type { DeckCard, DeckEntry } from '@/types/game';

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

function seedPlayingState(definitionIds: string[]): void {
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
      extraDeck: [],
      drawPile: Array.from({ length: 12 }, (_, index) => ({
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
      chainMultiplier: 1,
      chainFloor: 1,
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

describe('Set mechanic reworks', () => {
  beforeEach(() => {
    resetStore();
  });

  it('builds Heavenly Light cadence through alternating note types', () => {
    seedPlayingState(['ser-light-dawn', 'hr-light-divine-smite']);

    useStore.getState().playCard('hand_0');
    useStore.getState().playCard('hand_1');

    const state = useStore.getState();
    expect(state.turn.lightResonance).toBeGreaterThanOrEqual(2);
    expect(new Set(state.turn.lightDistinctNotes ?? []).size).toBeGreaterThanOrEqual(2);
  });

  it('turns Thornbound hand loss into delayed end-turn Oblivion', () => {
    seedPlayingState(['cherubim-thornbound-null-thorn']);

    useStore.getState().endTurn();

    const state = useStore.getState();
    expect(state.progress.oblivion).toBeGreaterThan(0);
    expect(state.turn.phase).toBe('idle');
  });

  it('queues and resolves Mechanical Dreams instructions on play', () => {
    seedPlayingState(['md-ser-cogbound-aegis']);

    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.turn.mechanicalResolvedInstructions).toBeGreaterThanOrEqual(1);
    expect(new Set(state.turn.mechanicalInstructionDiversity ?? []).size).toBeGreaterThanOrEqual(1);
  });

  it('tracks Prismatic channels and refraction depth across different cards', () => {
    seedPlayingState(['pa-ser-plainshush-drossken', 'pa-ser-mirrorback-mirshan']);

    useStore.getState().playCard('hand_0');
    useStore.getState().playCard('hand_1');

    const state = useStore.getState();
    expect(new Set(state.turn.prismaticDistinctChannels ?? []).size).toBeGreaterThanOrEqual(2);
    expect(state.turn.prismaticRefractionDepth).toBeGreaterThanOrEqual(2);
  });

  it('builds Black Glass contradiction and fracture through grief events', () => {
    seedPlayingState(['bgi-cherubim-ashencourt-sigil', 'bgi-ser-void-mandible-archon']);

    useStore.getState().playCard('hand_0');
    useStore.getState().playCard('hand_1');
    useStore.getState().removeCherubim(0);

    const state = useStore.getState();
    expect(state.turn.blackGlassWhiteFlame).toBeGreaterThan(0);
    expect(state.turn.blackGlassBlackFlame).toBeGreaterThan(0);
    expect(state.turn.blackGlassFracture).toBeGreaterThan(0);
  });

  it('alternates Snowbound phases into stored potential and surge windows', () => {
    seedPlayingState(['sv-oph-signal-collapse', 'sv-oph-first-static']);

    useStore.getState().playCard('hand_0');
    useStore.getState().playCard('hand_1');

    const state = useStore.getState();
    expect(state.turn.snowboundAlternations).toBeGreaterThanOrEqual(1);
    expect(state.turn.snowboundPhase).toBe('Voltage');
  });

  it('builds Glass Absolute proofs and axioms from board structure and eternals', () => {
    seedPlayingState([
      'ga-ser-prismwake',
      'ga-cher-mirrorbody-archivist',
      'ga-ser-lattice-canticle',
      'ga-et-angled-infinity',
    ]);

    useStore.getState().playCard('hand_0');
    useStore.getState().playCard('hand_1');
    useStore.getState().playCard('hand_2');
    useStore.getState().playCard('hand_3');

    const state = useStore.getState();
    expect(state.turn.glassProofFragments).toBeGreaterThanOrEqual(3);
    expect(state.turn.glassProofCascade).toBeGreaterThanOrEqual(1);
    expect((state.turn.glassAxioms ?? []).length).toBeGreaterThanOrEqual(1);
  });

  it('records Pyro cross-set conversion sources on mixed-element sequencing', () => {
    seedPlayingState(['hr-light-divine-smite', 'cherubim-fire-pyre-mantle']);

    useStore.getState().playCard('hand_0');
    useStore.getState().playCard('hand_1');

    const state = useStore.getState();
    expect(state.turn.pyroHeat).toBeGreaterThan(0);
    expect(state.turn.pyroEngineSignatures).toContain('Cherubim:conversion');
    expect(state.turn.pyroCrossSetConversionDistinctSources).toContain('Light');
  });

  it('ignites Blazing Garden attackers when their board attack fires', () => {
    seedPlayingState(['bg-ser-serevathi-ember-spiral']);

    useStore.getState().playCard('hand_0');
    const beforeAttack = useStore.getState().progress.oblivion;

    useStore.getState().activateSeraphimAttack(0, 'unsynergized');

    const state = useStore.getState();
    const attacker = state.board.frontSlots[0];
    expect(attacker?.type).toBe('Seraphim');
    expect(attacker?.burningGardenPhase).toBe('Burn');
    expect(attacker?.burnTurnsRemaining).toBe(2);
  });
});