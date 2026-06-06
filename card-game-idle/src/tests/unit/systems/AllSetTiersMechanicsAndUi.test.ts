import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { CardEffectExecutor } from '@/systems/cards/CardEffectExecutor';
import { defaultGameState } from '@/state/store';
import type { CardDefinition } from '@/types/cards';
import type { CardEffect } from '@/types/effects';
import type { BoardState, DeckCard, DeckState, TurnState } from '@/types/game';
import type { EngineKey } from '@/ui/setEngineSummary';
import { getEngineKeyForCard, getSetEngineSnapshotForCard } from '@/ui/setEngineSummary';

type Tier = 'base' | 'eternal' | 'infinite';

const ENGINE_KEYS: EngineKey[] = [
  'neutrality',
  'light',
  'thornbound',
  'mechanical',
  'prismatic',
  'blackGlass',
  'snowbound',
  'glassAbsolute',
  'pyro',
  'blazingGarden',
  'butterfly',
  'eternalSeas',
  'abyssalForge',
  'deathFlamedHell',
  'wishedUponAStar',
];

function collectPlayableEffects(def: CardDefinition): CardEffect[] {
  if (def.type === 'Ophanim') return [...(def.effects ?? [])];
  if (def.type === 'Cherubim') {
    const onPlay = [...(def.onPlayEffects ?? [])];
    if (onPlay.length > 0) return onPlay;
    return [...(def.effects ?? [])];
  }
  if (def.type === 'Seraphim') return [...(def.onPlayEffects ?? [])];
  if (def.type === 'Angel') return [...(def.onSummonEffects ?? [])];
  return [];
}

function isTierMatch(def: CardDefinition, tier: Tier): boolean {
  const id = def.definitionId;
  const explicitInfinite = def.rarity === 'Infinite' || id.startsWith('inf-') || id.includes('-inf-');
  const explicitEternal = def.rarity === 'Eternal' || id.includes('-et-') || id.startsWith('btei-') || id.startsWith('wuas-et-') || id.startsWith('dfh-et-');

  if (tier === 'infinite') return explicitInfinite;
  if (tier === 'eternal') return explicitEternal && !explicitInfinite;
  return !explicitEternal && !explicitInfinite && !id.startsWith('tx-');
}

function makeDeck(drawCount = 20): DeckState {
  const drawPile: DeckCard[] = Array.from({ length: drawCount }, (_, idx) => ({
    instanceId: `draw_${idx + 1}`,
    definitionId: 'seek-neutral-null-seek',
    finish: 'normal',
  }));

  return {
    deckList: [],
    extraDeck: [],
    drawPile,
    hand: [],
    discardPile: [],
  };
}

function makeBoard(): BoardState {
  return {
    frontSlots: [null, null, null, null, null],
    backSlots: [null, null, null, null],
    activeBoardEffects: [],
  };
}

function snapshotSignature(turn: TurnState): string {
  return JSON.stringify({
    equilibriumDrift: turn.equilibriumDrift ?? 0,
    equilibriumStability: turn.equilibriumStability ?? 0,
    neutralitySetupCount: turn.neutralitySetupCount ?? 0,
    attenuationClassUses: turn.attenuationClassUses ?? {},
    radiance: turn.radiance ?? 0,
    lightResonance: turn.lightResonance ?? 0,
    trail: turn.trail ?? 0,
    scar: turn.scar ?? 0,
    thornCounter: turn.secondaryCounters?.thorn ?? 0,
    mechanicalStrain: turn.strain ?? 0,
    mechanicalStack: turn.eternalStacks?.mech ?? 0,
    prismaticDepth: turn.prismaticRefractionDepth ?? 0,
    prismaticChannels: turn.prismaticDistinctChannels ?? [],
    prismaticResonance: turn.prismaticResonanceCharge ?? 0,
    blackWhite: turn.blackGlassWhiteFlame ?? 0,
    blackBlack: turn.blackGlassBlackFlame ?? 0,
    blackFracture: turn.blackGlassFracture ?? 0,
    arcticCharge: turn.arcticCharge ?? 0,
    snowCounter: turn.secondaryCounters?.snow ?? 0,
    glassFragments: turn.glassProofFragments ?? 0,
    glassCounter: turn.secondaryCounters?.absol ?? 0,
    pyroStack: turn.eternalStacks?.pyro ?? 0,
    pyroCounter: turn.secondaryCounters?.pyro ?? 0,
    gardenCounter: turn.secondaryCounters?.garden ?? 0,
    gardenLineages: turn.burningGardenLineagesPlayed ?? [],
    butterflySpectrum: turn.butterflySpectrum ?? 0,
    butterflyFormation: turn.butterflyFormation ?? 0,
    butterflyStack: turn.eternalStacks?.flutter ?? 0,
    seasUndertow: turn.eternalSeasUndertow ?? 0,
    seasFoam: turn.eternalSeasFoam ?? 0,
    seasCounter: turn.secondaryCounters?.deepwake ?? 0,
    abyssalReforge: turn.reforgeCharges ?? 0,
    abyssalLedger: turn.recastLedger?.length ?? 0,
    dfhMarks: turn.dfhVeilMarks ?? 0,
    wuasStarlight: turn.starlightCharges ?? 0,
    wuasDream: turn.dreamLattice ?? 0,
    wuasCrowns: turn.eternalStacks?.wuas ?? 0,
  });
}

function uiSignature(def: CardDefinition, turn: TurnState, board: BoardState): string {
  const snapshot = getSetEngineSnapshotForCard(def, turn, board);
  if (!snapshot) return 'null';
  return JSON.stringify({
    key: snapshot.key,
    compact: snapshot.compact,
    metrics: snapshot.metrics.map(metric => `${metric.label}:${metric.value}`),
  });
}

function canDemonstrateMechanic(def: CardDefinition): boolean {
  const effects = collectPlayableEffects(def);
  if (effects.length === 0) return false;

  const turnBefore: TurnState = {
    ...defaultGameState.turn,
    phase: 'playing',
    eternalStacks: { ...(defaultGameState.turn.eternalStacks ?? {}) },
    secondaryCounters: { ...(defaultGameState.turn.secondaryCounters ?? {}) },
  };
  const boardBefore = makeBoard();
  const deckBefore = makeDeck();

  const beforeMechanic = snapshotSignature(turnBefore);
  const beforeUi = uiSignature(def, turnBefore, boardBefore);

  const result = CardEffectExecutor.execute(
    { instanceId: `play_${def.definitionId}`, definitionId: def.definitionId, finish: 'normal' },
    turnBefore,
    boardBefore,
    deckBefore,
    false,
    { effects },
  );

  if (!result.canPlay) return false;

  const afterMechanic = snapshotSignature(result.turn);
  const afterUi = uiSignature(def, result.turn, result.board);

  const beforeSnapshot = getSetEngineSnapshotForCard(def, turnBefore, boardBefore);
  const afterSnapshot = getSetEngineSnapshotForCard(def, result.turn, result.board);
  const hasUiSnapshot = Boolean(beforeSnapshot && afterSnapshot && beforeUi !== 'null' && afterUi !== 'null');

  return beforeMechanic !== afterMechanic && hasUiSnapshot;
}

const UI_TURN_MUTATORS: Record<EngineKey, (turn: TurnState) => TurnState> = {
  neutrality: turn => ({
    ...turn,
    equilibriumDrift: 6,
    equilibriumStability: 3,
    neutralitySetupCount: 2,
    attenuationClassUses: { setup: 1, conversion: 1, multiplier: 0, refund: 0, finisher: 0 },
    crossSetConversionDistinctSources: ['Fire'],
  }),
  light: turn => ({
    ...turn,
    radiance: 9,
    lightResonance: 2,
    lightDistinctNotes: ['Seraphim', 'Cherubim'],
  }),
  thornbound: turn => ({ ...turn, trail: 5, scar: 2, secondaryCounters: { ...(turn.secondaryCounters ?? {}), thorn: 2 } }),
  mechanical: turn => ({ ...turn, strain: 6, eternalStacks: { ...(turn.eternalStacks ?? {}), mech: 4 } }),
  prismatic: turn => ({ ...turn, prismaticDistinctChannels: ['amber', 'azure'], prismaticRefractionDepth: 3, prismaticResonanceCharge: 2 }),
  blackGlass: turn => ({ ...turn, blackGlassWhiteFlame: 4, blackGlassBlackFlame: 3, blackGlassFracture: 1 }),
  snowbound: turn => ({ ...turn, arcticCharge: 8, secondaryCounters: { ...(turn.secondaryCounters ?? {}), snow: 3 } }),
  glassAbsolute: turn => ({ ...turn, glassProofFragments: 4, secondaryCounters: { ...(turn.secondaryCounters ?? {}), absol: 3 }, glassWhiteLedger: 2 }),
  pyro: turn => ({ ...turn, eternalStacks: { ...(turn.eternalStacks ?? {}), pyro: 5 }, secondaryCounters: { ...(turn.secondaryCounters ?? {}), pyro: 3 } }),
  blazingGarden: turn => ({ ...turn, secondaryCounters: { ...(turn.secondaryCounters ?? {}), garden: 3 }, burningGardenLineagesPlayed: ['Rose', 'Thistle'] }),
  butterfly: turn => ({ ...turn, butterflySpectrum: 7, butterflyFormation: 2, eternalStacks: { ...(turn.eternalStacks ?? {}), flutter: 2 } }),
  eternalSeas: turn => ({ ...turn, eternalSeasUndertow: 8, eternalSeasFoam: 4, secondaryCounters: { ...(turn.secondaryCounters ?? {}), deepwake: 3 } }),
  abyssalForge: turn => ({
    ...turn,
    reforgeCharges: 4,
    recastLedger: [{
      definitionId: 'af-ser-slagback-crawler',
      instanceId: 't1',
      ledgerIndex: 0,
      recastCount: 1,
      imprintStacks: 3,
      isAnvilSealed: false,
      isNacreCoated: false,
    }],
  }),
  deathFlamedHell: turn => ({ ...turn, dfhVeilMarks: 8, eternalStacks: { ...(turn.eternalStacks ?? {}), pyre: 3 }, secondaryCounters: { ...(turn.secondaryCounters ?? {}), pyre: 2 } }),
  wishedUponAStar: turn => ({ ...turn, starlightCharges: 9, dreamLattice: 4, eternalStacks: { ...(turn.eternalStacks ?? {}), wuas: 5 } }),
};

function getUiMutatedState(
  key: EngineKey,
  turn: TurnState,
  board: BoardState,
): { turn: TurnState; board: BoardState } {
  if (key === 'neutrality') {
    const frontSlots = [...board.frontSlots];
    frontSlots[0] = {
      instanceId: 'neutral_ui_probe',
      definitionId: 'ser-neutral-equilibrium',
      type: 'Seraphim',
      element: 'Neutrality',
      rarity: 'Legendary',
      finish: 'normal',
      level: 1,
      isActive: true,
      attackCooldowns: { unsynergized: 0, synergized: 0 },
      boardSlot: 0,
      patienceStacks: 6,
    } as NonNullable<BoardState['frontSlots'][number]>;

    return {
      turn: UI_TURN_MUTATORS[key](turn),
      board: { ...board, frontSlots },
    };
  }

  return { turn: UI_TURN_MUTATORS[key](turn), board };
}

describe('all set tiers mechanics + UI wiring', () => {
  it('has at least one working base, Eternal, and Infinite card per set with runtime and UI state updates', () => {
    const allCards = CardRegistry.getAll();

    for (const key of ENGINE_KEYS) {
      for (const tier of ['base', 'eternal', 'infinite'] as const) {
        const candidates = allCards
          .filter(def => getEngineKeyForCard(def) === key)
          .filter(def => isTierMatch(def, tier));

        expect(candidates.length, `${key} ${tier} should have candidate cards`).toBeGreaterThan(0);

        const working = candidates.find(canDemonstrateMechanic);
        expect(
          working,
          `${key} ${tier} should have at least one card that mutates set runtime state and has a valid set-engine snapshot`,
        ).toBeTruthy();
      }
    }
  });

  it('updates set-engine snapshot output for every set when its tracked turn state changes', () => {
    const allCards = CardRegistry.getAll();

    for (const key of ENGINE_KEYS) {
      const representative = allCards.find(def => getEngineKeyForCard(def) === key);
      expect(representative, `${key} should have a representative card`).toBeTruthy();
      if (!representative) continue;

      const baseTurn: TurnState = {
        ...defaultGameState.turn,
        phase: 'playing',
        eternalStacks: { ...(defaultGameState.turn.eternalStacks ?? {}) },
        secondaryCounters: { ...(defaultGameState.turn.secondaryCounters ?? {}) },
      };
      const board = makeBoard();
      const before = uiSignature(representative, baseTurn, board);
      const mutated = getUiMutatedState(key, baseTurn, board);
      const after = uiSignature(representative, mutated.turn, mutated.board);

      expect(before).not.toBe('null');
      expect(after).not.toBe('null');
      expect(after).not.toBe(before);
    }
  });
});
