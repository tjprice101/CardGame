import { beforeEach, describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
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
      chainBaseline: 1,
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

  it('lets Aurora Throne frontload Light anchors and resonance', () => {
    seedPlayingState(['btei-light-sunbreak-canon']);

    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.turn.lightChorusAnchors).toBeGreaterThanOrEqual(2);
    expect(state.turn.lightResonance).toBeGreaterThanOrEqual(2);
    expect(state.turn.pendingEffect).not.toBeNull();
  });

  it('lets Celestial Blackout cash a fully built Light choir state', () => {
    seedPlayingState(['inf-celestial-blackout']);

    useStore.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        lightResonance: 4,
        lightDistinctNotes: ['Ophanim', 'Seraphim', 'Cherubim', 'Angel'],
        lightChorusAnchors: 2,
        radiance: 18,
        cardsPlayedThisTurn: 3,
      },
    }));

    const before = useStore.getState().progress.oblivion;
    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.progress.oblivion - before).toBeGreaterThan(5000);
    expect(state.turn.chainMultiplier).toBeGreaterThan(3.5);
  });

  it('lets Heliarch Eclipse Engine stabilize a live Light sequence', () => {
    seedPlayingState(['inf-heliarch-eclipse-engine']);

    useStore.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        lightResonance: 3,
        lightDistinctNotes: ['Ophanim', 'Seraphim', 'Cherubim'],
        lightChorusAnchors: 1,
      },
    }));

    const before = useStore.getState().progress.oblivion;
    useStore.getState().playCard('hand_0');

    const heliarch = CardRegistry.get('inf-heliarch-eclipse-engine');
    expect(heliarch?.effects?.some(effect => effect.type === 'cherubim_adjacent_seraphim_bonus' && effect.bonusType === 'chain')).toBe(true);

    const state = useStore.getState();
    expect(state.progress.oblivion - before).toBeGreaterThan(2500);
    expect(state.turn.lightChorusAnchors).toBeGreaterThanOrEqual(3);
  });

  it('surfaces reworked Heavenly Light stats and abilities through CardRegistry', () => {
    const sanctum = CardRegistry.get('btei-light-aureate-rapture');
    expect(sanctum?.baseStats?.bonusType).toBe('oblivion_per_card');
    expect(sanctum?.baseStats?.bonusValue).toBe(170);
    expect(sanctum?.attacks?.unsynergized.baseOblivion).toBe(2770);
    expect(sanctum?.attacks?.synergized.baseOblivion).toBe(4709);

    const blackout = CardRegistry.get('inf-celestial-blackout');
    expect(blackout?.effects?.some(effect => effect.type === 'chain_multiplier_set' && effect.value === 7.5)).toBe(true);

    const heliarch = CardRegistry.get('inf-heliarch-eclipse-engine');
    expect(heliarch?.effects?.some(effect => effect.type === 'cherubim_adjacent_seraphim_bonus' && effect.bonusType === 'chain')).toBe(true);
  });

  it('lets three reworked Heavenly Light cards form a cohesive combo line', () => {
    seedPlayingState([
      'btei-light-sunbreak-canon',
      'inf-heliarch-eclipse-engine',
      'inf-lucent-cataclysm-archon',
    ]);

    const before = useStore.getState().progress.oblivion;
    useStore.getState().playCard('hand_0');
    useStore.getState().playCard('hand_1');
    useStore.getState().playCard('hand_2');

    const state = useStore.getState();
    expect(state.turn.lightResonance).toBeGreaterThanOrEqual(6);
    expect(new Set(state.turn.lightDistinctNotes ?? []).size).toBeGreaterThanOrEqual(3);
    expect(state.turn.lightChorusAnchors).toBeGreaterThanOrEqual(3);
    expect(state.turn.chainBaseline).toBeGreaterThanOrEqual(2.6);
    expect(state.turn.chainMultiplier).toBeGreaterThan(5);
    expect(state.progress.oblivion - before).toBeGreaterThan(3500);
  });

  it('turns Thornbound hand loss into delayed end-turn Oblivion', () => {
    seedPlayingState(['cherubim-thornbound-null-thorn']);

    useStore.getState().endTurn();

    const state = useStore.getState();
    expect(state.progress.oblivion).toBeGreaterThan(0);
    expect(state.turn.phase).toBe('idle');
  });

  it('lets Bleeding Road Matriarch open Thornbound with chain pressure and a primed follow-up', () => {
    seedPlayingState(['btei-thornbound-briar-siege']);

    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.turn.trail).toBeGreaterThanOrEqual(24);
    expect(state.turn.chainMultiplier).toBeGreaterThan(2);
  });

  it('lets Thornbound Last Procession cash live Scar, Trail, and Procession depth', () => {
    seedPlayingState(['inf-thornbound-last-procession']);

    useStore.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        thornScar: 12,
        trail: 42,
        thornLossesThisTurn: 8,
        thornProcessions: 2,
        thornWarPath: 'Endurance',
      },
    }));

    const before = useStore.getState().progress.oblivion;
    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.progress.oblivion - before).toBeGreaterThan(5000);
    expect(state.turn.chainMultiplier).toBeGreaterThan(3);
    expect(state.turn.nextCardMultiplied).toBe(true);
  });

  it('lets Thorn Widow Engine convert march depth into a dynamic Infinite spike', () => {
    seedPlayingState(['inf-thorn-widow-engine']);

    const widow = CardRegistry.get('inf-thorn-widow-engine');
    expect(widow?.attacks?.unsynergized.costs?.[0]?.type).toBe('spend_trail');

    useStore.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        thornScar: 10,
        trail: 34,
        thornLossesThisTurn: 6,
        thornProcessions: 1,
        thornWarPath: 'Aggression',
      },
    }));

    const before = useStore.getState().progress.oblivion;
    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.progress.oblivion - before).toBeGreaterThan(3000);
    expect(state.turn.chainMultiplier).toBeGreaterThan(2);
    expect(state.turn.trail).toBeGreaterThan(34);
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

  it('builds Archive Seals when new proofs form with Lattice Archive Seraph active', () => {
    seedPlayingState([
      'ga-ser-prismwake',
      'ga-ser-lattice-canticle',
      'ga-et-lattice-archive-seraph',
      'ga-cher-mirrorbody-archivist',
    ]);

    useStore.getState().playCard('hand_0');
    useStore.getState().playCard('hand_1');
    useStore.getState().playCard('hand_2');
    useStore.getState().playCard('hand_3');

    const state = useStore.getState();
    expect(state.turn.glassProofCascade).toBeGreaterThanOrEqual(1);
    expect(state.turn.glassArchiveSeals).toBeGreaterThan(0);
  });

  it('stores and cashes White Ledger at end turn for Color After White', () => {
    seedPlayingState(['ga-ser-prismwake', 'ga-inf-color-after-white']);

    useStore.getState().playCard('hand_0');
    useStore.getState().playCard('hand_1');

    const beforeEndTurn = useStore.getState().progress.oblivion;
    useStore.getState().endTurn();
    const state = useStore.getState();

    expect(state.progress.oblivion).toBeGreaterThan(beforeEndTurn);
  });

  it('records Pyro cross-set conversion sources on mixed-element sequencing', () => {
    seedPlayingState(['hr-light-divine-smite', 'cherubim-fire-pyre-mantle']);

    useStore.getState().playCard('hand_0');
    useStore.getState().playCard('hand_1');

    const state = useStore.getState();
    expect(state.turn.pyroHeat).toBeGreaterThan(0);
    expect(state.turn.pyroFurnacePressure ?? 0).toBeGreaterThan(0);
    expect(state.turn.pyroEngineSignatures).toContain('Cherubim:conversion');
    expect(state.turn.pyroCrossSetConversionDistinctSources).toContain('Light');
  });

  it('lets Cinder Leviathan trade embers for chain and stability', () => {
    seedPlayingState(['btei-pyroabyss-cinder-cataclysm']);

    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.turn.pyroFurnacePressure ?? 0).toBeGreaterThanOrEqual(6);
    expect(state.turn.pyroRuinWindows ?? 0).toBeGreaterThanOrEqual(1);
    expect(state.turn.pyroHeat).toBeGreaterThan(0);
  });

  it('lets Pyraxis Colossus use its tuned ember cost and furnace tempo', () => {
    seedPlayingState(['inf-pyraxis-colossus']);

    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.turn.pyroFurnacePressure ?? 0).toBeGreaterThanOrEqual(8);
    expect(state.turn.pyroRuinWindows ?? 0).toBeGreaterThanOrEqual(1);
  });

  it('lets Ash Kings Apocalypse cash live Pyro heat, debt control, and cross-fuel sources', () => {
    seedPlayingState(['inf-ash-kings-apocalypse']);

    useStore.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        pyroHeat: 12,
        pyroBurnDebt: 1,
        pyroStability: 4,
        pyroSetupCount: 3,
        pyroFurnacePressure: 24,
        pyroAbyssFault: 16,
        pyroRuinWindows: 3,
        pyroCrossSetConversionDistinctSources: ['Light', 'Mechanical'],
        pyroEngineSignatures: ['Ophanim:refund', 'Cherubim:conversion', 'Angel:finisher'],
      },
    }));

    const before = useStore.getState().progress.oblivion;
    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.progress.oblivion - before).toBeGreaterThan(1400);
    expect(state.turn.chainMultiplier).toBeGreaterThanOrEqual(1.5);
    expect((state.turn.pyroRuinWindows ?? 0)).toBeGreaterThanOrEqual(2);
  });

  it('lets Riftborn Sovereign burn stored fuel into a Pyro finisher', () => {
    seedPlayingState(['inf-riftborn-sovereign']);

    const riftborn = CardRegistry.get('inf-riftborn-sovereign');
    expect(riftborn?.type).toBe('Angel');

    useStore.setState(state => {
      const frontSlots = [...state.board.frontSlots];
      frontSlots[0] = {
        instanceId: 'riftborn_board',
        definitionId: 'inf-riftborn-sovereign',
        type: 'Angel',
        element: 'Fire',
        rarity: 'Infinite',
        finish: 'normal',
        level: 1,
        cardsPlayedSinceSummon: 5,
        activated: false,
        attackCooldowns: { primary: 0, exalted: 0 },
        boardSlot: 0,
      };
      return {
        ...state,
        board: { ...state.board, frontSlots },
        turn: {
          ...state.turn,
          embers: 90,
          pyroHeat: 14,
          pyroBurnDebt: 1,
          pyroStability: 5,
          pyroSetupCount: 3,
          pyroFurnacePressure: 22,
          pyroAbyssFault: 14,
          pyroRuinWindows: 4,
          pyroCrossSetConversionDistinctSources: ['Light'],
          pyroEngineSignatures: ['Cherubim:conversion', 'Angel:finisher', 'Ophanim:refund'],
        },
      };
    });

    const before = useStore.getState().progress.oblivion;
    useStore.getState().activateAngel(0);

    const state = useStore.getState();
    expect(state.progress.oblivion - before).toBeGreaterThan(2400);
    expect(state.turn.chainMultiplier).toBeGreaterThan(3.0);
    expect((state.turn.pyroRuinWindows ?? 0)).toBeLessThanOrEqual(5);
  });

  it('lets Oblivion Absolute cash Neutrality stability, signatures, and breaks', () => {
    seedPlayingState(['inf-oblivion-absolute']);

    useStore.setState(state => ({
      ...state,
      board: {
        ...state.board,
        frontSlots: [
          {
            instanceId: 'neutral_ser_1',
            definitionId: 'ser-neutral-equilibrium',
            type: 'Seraphim',
            element: 'Neutrality',
            rarity: 'Legendary',
            finish: 'normal',
            level: 1,
            isActive: true,
            attackCooldowns: { unsynergized: 0, synergized: 0 },
            boardSlot: 0,
            patienceStacks: 4,
          },
          {
            instanceId: 'neutral_ser_2',
            definitionId: 'ser-neutral-balance',
            type: 'Seraphim',
            element: 'Neutrality',
            rarity: 'Legendary',
            finish: 'normal',
            level: 1,
            isActive: true,
            attackCooldowns: { unsynergized: 0, synergized: 0 },
            boardSlot: 1,
            patienceStacks: 2,
          },
          null,
          null,
          null,
        ],
      },
      turn: {
        ...state.turn,
        equilibriumStability: 4,
        attenuationBrokenClasses: ['setup', 'conversion'],
        neutralitySetupCount: 3,
        neutralityEngineSignatures: ['Seraphim:setup', 'Ophanim:conversion', 'Cherubim:multiplier'],
      },
    }));

    const before = useStore.getState().progress.oblivion;
    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.progress.oblivion - before).toBeGreaterThan(1200);
    expect(state.turn.chainMultiplier).toBeGreaterThan(4);
    expect(state.board.frontSlots[0]?.patienceStacks ?? 0).toBeGreaterThanOrEqual(12);
    expect(state.board.frontSlots[1]?.patienceStacks ?? 0).toBeGreaterThanOrEqual(10);
  });

  it('lets Void Cascade cash mixed-set conversion sources for Neutrality', () => {
    seedPlayingState(['inf-void-cascade']);

    useStore.setState(state => ({
      ...state,
      board: {
        ...state.board,
        frontSlots: [
          {
            instanceId: 'neutral_ser_1',
            definitionId: 'ser-neutral-equilibrium',
            type: 'Seraphim',
            element: 'Neutrality',
            rarity: 'Legendary',
            finish: 'normal',
            level: 1,
            isActive: true,
            attackCooldowns: { unsynergized: 0, synergized: 0 },
            boardSlot: 0,
            patienceStacks: 3,
          },
          {
            instanceId: 'neutral_ser_2',
            definitionId: 'ser-neutral-balance',
            type: 'Seraphim',
            element: 'Neutrality',
            rarity: 'Legendary',
            finish: 'normal',
            level: 1,
            isActive: true,
            attackCooldowns: { unsynergized: 0, synergized: 0 },
            boardSlot: 1,
            patienceStacks: 5,
          },
          null,
          null,
          null,
        ],
      },
      turn: {
        ...state.turn,
        crossSetConversionDistinctSources: ['Light', 'Fire'],
        neutralitySetupCount: 2,
      },
    }));

    const before = useStore.getState().progress.oblivion;
    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.progress.oblivion - before).toBeGreaterThan(1500);
    expect(state.turn.nextCardMultiplied).toBe(true);
    expect(state.turn.chainMultiplier).toBeGreaterThan(3.5);
    expect((state.board.frontSlots[0]?.patienceStacks ?? 0)).toBeGreaterThanOrEqual(3);
    expect((state.board.frontSlots[1]?.patienceStacks ?? 0)).toBeGreaterThanOrEqual(5);
  });

  it('lets Paradox Crown cash Neutrality setup at Eternal power', () => {
    seedPlayingState(['btei-neutrality-paradox-crown']);

    useStore.setState(state => ({
      ...state,
      board: {
        ...state.board,
        frontSlots: [
          {
            instanceId: 'neutral_btei_ser_1',
            definitionId: 'ser-neutral-equilibrium',
            type: 'Seraphim',
            element: 'Neutrality',
            rarity: 'Legendary',
            finish: 'normal',
            level: 1,
            isActive: true,
            attackCooldowns: { unsynergized: 0, synergized: 0 },
            boardSlot: 0,
            patienceStacks: 3,
          },
          {
            instanceId: 'neutral_btei_ser_2',
            definitionId: 'ser-neutral-balance',
            type: 'Seraphim',
            element: 'Neutrality',
            rarity: 'Legendary',
            finish: 'normal',
            level: 1,
            isActive: true,
            attackCooldowns: { unsynergized: 0, synergized: 0 },
            boardSlot: 1,
            patienceStacks: 2,
          },
          null,
          null,
          null,
        ],
      },
      turn: {
        ...state.turn,
        equilibriumStability: 3,
        neutralitySetupCount: 3,
        neutralityEngineSignatures: ['Seraphim:setup', 'Ophanim:conversion'],
        crossSetConversionDistinctSources: ['Light'],
      },
    }));

    const before = useStore.getState().progress.oblivion;
    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.progress.oblivion - before).toBeGreaterThan(700);
    expect(state.progress.oblivion - before).toBeLessThan(1800);
    expect(state.turn.chainMultiplier).toBeGreaterThan(2.4);
    expect(state.turn.nextCardMultiplied).toBe(true);
  });

  it('lets Prime Equilibrium pay different rates for first vs later card lines', () => {
    seedPlayingState(['btei-neutrality-prime-equilibrium', 'btei-neutrality-prime-equilibrium']);

    useStore.setState(state => ({
      ...state,
      board: {
        ...state.board,
        frontSlots: [
          {
            instanceId: 'neutral_btei_ser_3',
            definitionId: 'ser-neutral-equilibrium',
            type: 'Seraphim',
            element: 'Neutrality',
            rarity: 'Legendary',
            finish: 'normal',
            level: 1,
            isActive: true,
            attackCooldowns: { unsynergized: 0, synergized: 0 },
            boardSlot: 0,
            patienceStacks: 4,
          },
          null,
          null,
          null,
          null,
        ],
      },
      turn: {
        ...state.turn,
        equilibriumStability: 4,
        neutralitySetupCount: 3,
        neutralityEngineSignatures: ['Seraphim:setup'],
      },
    }));

    const beforeFirst = useStore.getState().progress.oblivion;
    useStore.getState().playCard('hand_0');
    const afterFirst = useStore.getState().progress.oblivion;

    const beforeSecond = useStore.getState().progress.oblivion;
    useStore.getState().playCard('hand_1');
    const afterSecond = useStore.getState().progress.oblivion;

    const firstGain = afterFirst - beforeFirst;
    const secondGain = afterSecond - beforeSecond;
    const state = useStore.getState();

    expect(firstGain).toBeGreaterThan(secondGain);
    expect(firstGain).toBeGreaterThan(550);
    expect(secondGain).toBeGreaterThan(250);
    expect(state.turn.chainMultiplier).toBeGreaterThan(3);
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