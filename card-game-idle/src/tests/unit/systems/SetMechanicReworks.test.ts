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

function hasEffectTypeRecursive(
  effects: ReadonlyArray<{ type: string; then?: ReadonlyArray<{ type: string }> }> | undefined,
  type: string,
): boolean {
  if (!effects) return false;
  for (const effect of effects) {
    if (effect.type === type) return true;
    if (effect.type === 'conditional' && hasEffectTypeRecursive(effect.then, type)) return true;
  }
  return false;
}

function collectTopLevelEffects(def: unknown): Array<Record<string, unknown>> {
  if (!def || typeof def !== 'object') return [];
  const card = def as Record<string, unknown>;
  const buckets: Array<unknown> = [];
  const maybePush = (value: unknown): void => {
    if (Array.isArray(value)) buckets.push(...value);
  };

  maybePush(card.effects);
  maybePush(card.onPlayEffects);
  maybePush(card.onSummonEffects);
  maybePush(card.onDeathEffects);

  const activated = card.activatedAbility;
  if (activated && typeof activated === 'object') {
    maybePush((activated as Record<string, unknown>).effects);
  }

  return buckets.filter((effect): effect is Record<string, unknown> => Boolean(effect) && typeof effect === 'object');
}

function getGardenGenerationValue(def: unknown): number {
  return collectTopLevelEffects(def)
    .filter(effect => effect.type === 'set_secondary_gain' && effect.kind === 'garden')
    .reduce((sum, effect) => sum + (typeof effect.value === 'number' ? effect.value : 0), 0);
}

function getGardenSeedEffect(def: unknown): Record<string, unknown> | null {
  return collectTopLevelEffects(def).find(effect => effect.type === 'garden_wild_pollen_seed') ?? null;
}

describe('Set mechanic reworks', () => {
  beforeEach(() => {
    resetStore();
  });

  it('keeps base Heavenly Light plays working after the Cadence purge (Phase 0)', () => {
    seedPlayingState(['ser-light-dawn', 'hr-light-divine-smite']);

    useStore.getState().playCard('hand_0');
    useStore.getState().playCard('hand_1');

    const state = useStore.getState();
    expect(state.turn.radiance).toBeGreaterThanOrEqual(0);
    expect(state.turn.cardsPlayedThisTurn).toBeGreaterThanOrEqual(2);
  });

  it('lets Aurora Throne frontload Light Halo', () => {
    seedPlayingState(['btei-light-sunbreak-canon']);

    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.turn.eternalStacks?.light ?? 0).toBeGreaterThanOrEqual(3);
    expect(state.turn.pendingEffect).not.toBeNull();
  });

  it('lets Celestial Blackout cash a fully built Light choir state', () => {
    seedPlayingState(['inf-celestial-blackout']);

    useStore.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        radiance: 18,
        eternalStacks: { ...(state.turn.eternalStacks ?? {}), light: 12 },
        cardsPlayedThisTurn: 3,
      },
    }));

    const before = useStore.getState().progress.oblivion;
    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.progress.oblivion - before).toBeGreaterThan(5000);
    expect(state.turn.radiance).toBeGreaterThanOrEqual(120);
  });

  it('lets Heliarch Eclipse Engine stabilize a live Light sequence', () => {
    seedPlayingState(['inf-heliarch-eclipse-engine']);

    useStore.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        eternalStacks: { ...(state.turn.eternalStacks ?? {}), light: 7 },
      },
    }));

    const before = useStore.getState().progress.oblivion;
    useStore.getState().playCard('hand_0');

    const heliarch = CardRegistry.get('inf-heliarch-eclipse-engine');
    expect(heliarch?.effects?.some(effect => effect.type === 'cherubim_adjacent_seraphim_bonus' && effect.bonusType === 'oblivion')).toBe(true);

    const state = useStore.getState();
    expect(state.progress.oblivion - before).toBeGreaterThan(2500);
    expect(state.turn.eternalStacks?.light ?? 0).toBeGreaterThanOrEqual(7);
  });

  it('surfaces reworked Heavenly Light stats and abilities through CardRegistry', () => {
    const sanctum = CardRegistry.get('btei-light-aureate-rapture');
    expect(sanctum?.baseStats?.bonusType).toBe('oblivion_per_card');
    expect(sanctum?.baseStats?.bonusValue).toBe(170);
    expect(sanctum?.attacks?.unsynergized.baseOblivion).toBe(2770);
    expect(sanctum?.attacks?.synergized.baseOblivion).toBe(4709);

    const blackout = CardRegistry.get('inf-celestial-blackout');
    expect(blackout?.effects?.some(effect => effect.type === 'chain_multiplier_set')).toBeDefined();

    const heliarch = CardRegistry.get('inf-heliarch-eclipse-engine');
    expect(heliarch?.effects?.some(effect => effect.type === 'cherubim_adjacent_seraphim_bonus' && effect.bonusType === 'oblivion')).toBe(true);
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
    expect(state.turn.eternalStacks?.light ?? 0).toBeGreaterThanOrEqual(6);
    expect(state.turn.radiance).toBeGreaterThan(150);
    expect(state.progress.oblivion - before).toBeGreaterThan(3500);
  });

  it('builds Resonance Charge from Prismatic Eternity cards, not base Prismatic flow', () => {
    seedPlayingState(['pa-ser-skyglass-veltharion', 'btei-prismatic-vorthum-edict']);

    useStore.getState().playCard('hand_0');
    let state = useStore.getState();
    expect(state.turn.prismaticResonanceCharge ?? 0).toBe(0);

    useStore.getState().playCard('hand_1');
    state = useStore.getState();
    expect(state.turn.prismaticResonanceCharge ?? 0).toBeGreaterThanOrEqual(3);
  });

  it('uses manual Trail-to-Scar conversion for base Thornbound', () => {
    seedPlayingState(['cherubim-thornbound-null-thorn']);

    useStore.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        trail: 3,
        thornScar: 0,
      },
    }));

    useStore.getState().convertTrailToScar();
    useStore.getState().convertTrailToScar();

    const state = useStore.getState();
    expect(state.turn.trail).toBe(1);
    expect(state.turn.thornScar).toBe(2);
  });

  it('lets Eternal Seas spend 5 Foam to draw 1 card from the HUD action', () => {
    seedPlayingState(['es-oph-shallows-spiral-map']);

    useStore.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        eternalSeasFoam: 10,
        eternalSeasUndertow: 3,
        pendingEffect: null,
      },
    }));

    const handBefore = useStore.getState().deck.hand.length;
    useStore.getState().consumeFoamToDraw();

    const state = useStore.getState();
    expect(state.turn.eternalSeasFoam).toBe(5);
    expect(state.turn.eternalSeasUndertow).toBe(3);
    expect(state.deck.hand.length).toBe(handBefore + 1);
  });

  it('keeps base Eternal Seas cards on Undertow and Foam runtime effects', () => {
    const sounding = CardRegistry.get('es-oph-depthless-sounding');
    const crossflow = CardRegistry.get('es-oph-veilmargin-crossflow');

    expect(sounding?.effects?.some(effect => effect.type === 'seas_undertow_gain')).toBe(true);
    expect(sounding?.effects?.some(effect => effect.type === 'seas_undertow_release')).toBe(true);

    expect(crossflow?.effects?.some(effect => effect.type === 'seas_foam_gain')).toBe(true);
  });

  it('keeps Eternal Seas Eternity cards on Deepwake overlay roles', () => {
    const battery = CardRegistry.get('es-et-aeveleth-first-drift');
    const reservoir = CardRegistry.get('es-et-surevaan-anomaly-log');
    const resolver = CardRegistry.get('es-et-thyrvaan-oldlight-grid');
    const apex = CardRegistry.get('es-et-crown-of-seven-margins');

    expect(battery?.onPlayEffects?.some(effect => effect.type === 'set_secondary_gain' && effect.kind === 'deepwake')).toBe(true);
    expect(reservoir?.onPlayEffects?.some(effect => effect.type === 'set_secondary_gain' && effect.kind === 'deepwake' && (effect.value ?? 0) >= 1)).toBe(true);
    expect(resolver?.effects?.some(effect => effect.type === 'seas_deepwake_surge')).toBe(true);
    expect(apex?.activatedAbility.effects.some(effect => effect.type === 'seas_deepwake_surge')).toBe(true);
  });

  it('lets Deepwake surge consume deepwake and enhance Undertow/Foam turn flow', () => {
    seedPlayingState(['es-et-thyrvaan-oldlight-grid']);

    useStore.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        secondaryCounters: {
          ...(state.turn.secondaryCounters ?? {}),
          deepwake: 2,
        },
        eternalSeasUndertow: 0,
        eternalSeasFoam: 0,
      },
    }));

    const before = useStore.getState().progress.oblivion;
    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.turn.secondaryCounters?.deepwake ?? 0).toBe(2);
    expect(state.turn.eternalSeasFoam ?? 0).toBeGreaterThanOrEqual(1);
    expect(state.turn.eternalSeasUndertow ?? 0).toBeGreaterThanOrEqual(1);
    expect(state.progress.oblivion - before).toBeGreaterThan(0);
  });

  it('keeps Abyssal Forge Eternal cards on Imprint-only overlay effects', () => {
    const eternalIds = [
      'af-et-forge-beneath',
      'af-et-ouroglas-dreaming',
      'af-et-quenched-drift',
      'af-et-nacre-touched-procession',
      'af-et-pearled-pantheon',
    ];

    for (const id of eternalIds) {
      const def = CardRegistry.get(id);
      expect(def).toBeTruthy();
      expect(hasEffectTypeRecursive((def as any)?.onPlayEffects, 'forge_imprint_gain')).toBe(true);
      expect(
        hasEffectTypeRecursive((def as any)?.onPlayEffects, 'forge_imprint_spend_burst')
        || hasEffectTypeRecursive((def as any)?.onPlayEffects, 'forge_imprint_spend_recast')
      ).toBe(true);
      expect(hasEffectTypeRecursive((def as any)?.onPlayEffects, 'eternal_stack_gain')).toBe(false);
      expect(hasEffectTypeRecursive((def as any)?.onPlayEffects, 'forge_nacre_recast')).toBe(false);
      expect(hasEffectTypeRecursive((def as any)?.onPlayEffects, 'forge_anvil_seal')).toBe(false);
      expect(hasEffectTypeRecursive((def as any)?.onPlayEffects, 'forge_nacre_coat')).toBe(false);
    }
  });

  it('spends Abyssal Imprint on Eternal burst effects', () => {
    seedPlayingState(['af-ser-slagback-crawler', 'af-et-quenched-drift']);

    useStore.getState().playCard('hand_0');

    useStore.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        recastLedger: (state.turn.recastLedger ?? []).map(entry => ({
          ...entry,
          imprintStacks: 5,
        })),
      },
    }));

    const before = useStore.getState().progress.oblivion;
    useStore.getState().playCard('hand_1');

    const state = useStore.getState();
    const imprintTotal = (state.turn.recastLedger ?? []).reduce((sum, entry) => sum + Math.max(0, entry.imprintStacks ?? 0), 0);

    // Start 5 imprint, Quenched Drift adds +2 then spends 5 => 2 remaining.
    expect(imprintTotal).toBe(2);
    expect(state.progress.oblivion - before).toBeGreaterThanOrEqual(1100);
  });

  it('keeps Abyssal Eternal cards mechanically unique from one another', () => {
    const eternalIds = [
      'af-et-forge-beneath',
      'af-et-ouroglas-dreaming',
      'af-et-quenched-drift',
      'af-et-nacre-touched-procession',
      'af-et-pearled-pantheon',
    ];

    const signatures = eternalIds.map(id => {
      const def = CardRegistry.get(id) as any;
      expect(def).toBeTruthy();
      const effects = (def?.onPlayEffects ?? []).map((e: any) => `${e.type}:${e.targetMode ?? ''}:${e.count ?? ''}:${e.spend ?? ''}:${e.value ?? ''}:${e.oblivionPerImprint ?? ''}`);
      return effects.join('|');
    });

    expect(new Set(signatures).size).toBe(eternalIds.length);
  });

  it('keeps Abyssal Infinity cards on distinct Imprint interaction roles', () => {
    const storm = CardRegistry.get('af-inf-ouroglas-uncoiled') as any;
    const foundry = CardRegistry.get('af-inf-abyssal-forge-itself') as any;
    const deepHistory = CardRegistry.get('af-inf-unrecorded-hue') as any;
    const splitBridge = CardRegistry.get('af-inf-covenant-coiled-fire') as any;
    const apex = CardRegistry.get('af-inf-reforging-world') as any;

    const infinityCards = [storm, foundry, deepHistory, splitBridge, apex];
    for (const def of infinityCards) {
      expect(hasEffectTypeRecursive(def?.onPlayEffects, 'forge_imprint_gain')).toBe(true);
      expect(
        hasEffectTypeRecursive(def?.onPlayEffects, 'forge_imprint_spend_burst')
        || hasEffectTypeRecursive(def?.onPlayEffects, 'forge_imprint_spend_recast')
      ).toBe(true);
      expect(hasEffectTypeRecursive(def?.onPlayEffects, 'eternal_stack_gain')).toBe(false);
      expect(hasEffectTypeRecursive(def?.onPlayEffects, 'forge_nacre_recast')).toBe(false);
      expect(hasEffectTypeRecursive(def?.onPlayEffects, 'forge_nacre_coat')).toBe(false);
      expect(hasEffectTypeRecursive(def?.onPlayEffects, 'forge_crown_cashout')).toBe(false);
      expect(hasEffectTypeRecursive(def?.onPlayEffects, 'forge_unrecorded_ignite')).toBe(false);
    }

    expect(storm?.onPlayEffects?.some((effect: any) => effect.type === 'forge_imprint_spend_recast' && effect.targetMode === 'random' && effect.count === 4)).toBe(true);

    expect(foundry?.onPlayEffects?.some((effect: any) => effect.type === 'forge_imprint_spend_recast' && effect.targetMode === 'lastN' && effect.count === 5)).toBe(true);
    expect(foundry?.onPlayEffects?.some((effect: any) => effect.type === 'forge_imprint_spend_burst' && effect.spend === 8)).toBe(true);

    expect(deepHistory?.onPlayEffects?.some((effect: any) => effect.type === 'forge_imprint_gain' && effect.targetMode === 'lastN' && effect.count === 6)).toBe(true);
    expect(deepHistory?.onPlayEffects?.some((effect: any) => effect.type === 'forge_imprint_spend_recast' && effect.targetMode === 'lastN' && effect.count === 6)).toBe(true);

    expect(splitBridge?.onPlayEffects?.some((effect: any) => effect.type === 'forge_imprint_spend_recast' && effect.targetMode === 'random' && effect.count === 2)).toBe(true);
    expect(splitBridge?.onPlayEffects?.some((effect: any) => effect.type === 'forge_imprint_spend_burst' && effect.spend === 5)).toBe(true);

    expect(apex?.onPlayEffects?.some((effect: any) => effect.type === 'forge_imprint_spend_recast' && effect.targetMode === 'random' && effect.count === 6 && effect.spend === 10)).toBe(true);
    expect(apex?.onPlayEffects?.some((effect: any) => effect.type === 'forge_imprint_spend_burst' && effect.spend === 12)).toBe(true);
  });

  it('keeps Eternal Seas Infinity cards uniquely differentiated on Deepwake roles', () => {
    const pressureHybrid = CardRegistry.get('es-inf-veleth-itself');
    const reservoir = CardRegistry.get('es-inf-water-that-was-always-there');
    const microSurge = CardRegistry.get('es-inf-veilmargin-cathedral');
    const allInApex = CardRegistry.get('es-inf-seven-crowned-confluence');
    const recursiveLoop = CardRegistry.get('es-inf-aeveleth-undying-revision');

    expect(pressureHybrid?.onPlayEffects?.some(effect => effect.type === 'seas_deepwake_surge' && (effect as any).consume === 2)).toBe(true);
    expect(reservoir?.effects?.some(effect => effect.type === 'set_secondary_gain' && effect.kind === 'deepwake' && effect.value === 5)).toBe(true);
    expect(reservoir?.effects?.some(effect => effect.type === 'seas_deepwake_surge')).toBe(false);
    expect(microSurge?.onPlayEffects?.some(effect => effect.type === 'seas_deepwake_surge' && (effect as any).releaseSpend === 2)).toBe(true);
    expect(allInApex?.activatedAbility.effects.some(effect => effect.type === 'seas_deepwake_surge' && (effect as any).consume === 9999)).toBe(true);
    expect(recursiveLoop?.effects?.some(effect => effect.type === 'set_secondary_gain' && effect.kind === 'deepwake' && effect.value === 1)).toBe(true);
  });

  it('does not grant base Thornbound end-turn burst from Scar', () => {
    seedPlayingState(['cherubim-thornbound-null-thorn']);

    useStore.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        trail: 5,
        thornScar: 4,
      },
      progress: {
        ...state.progress,
        oblivion: 0,
      },
    }));

    useStore.getState().endTurn();

    const state = useStore.getState();
    expect(state.progress.oblivion).toBe(0);
    expect(state.turn.phase).toBe('idle');
  });

  it('lets Bleeding Road Matriarch open Thornbound by seeding Briar Spiral', () => {
    seedPlayingState(['btei-thornbound-briar-siege']);

    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.turn.trail).toBeGreaterThanOrEqual(31);
    expect(state.turn.secondaryCounters?.thorn ?? 0).toBeGreaterThanOrEqual(4);
  });

  it('keeps Thornbound Eternity cards in distinct Briar Spiral roles', () => {
    const generator = CardRegistry.get('btei-thornbound-briar-siege');
    const converter = CardRegistry.get('btei-thornbound-red-march');
    const amplifier = CardRegistry.get('btei-thornbound-cathedral-lancer');
    const finisher = CardRegistry.get('btei-thornbound-funeral-bramble');

    expect(generator?.type).toBe('Ophanim');
    expect(generator?.effects.some(effect => effect.type === 'set_secondary_gain' && effect.kind === 'thorn')).toBe(true);
    expect(generator?.effects.some(effect => effect.type === 'salvage_any')).toBe(true);

    expect(converter?.type).toBe('Cherubim');
    expect(hasEffectTypeRecursive(converter?.onPlayEffects, 'trail_spend')).toBe(true);
    expect(hasEffectTypeRecursive(converter?.onPlayEffects, 'set_secondary_gain')).toBe(true);

    expect(amplifier?.type).toBe('Seraphim');
    expect(hasEffectTypeRecursive(amplifier?.onPlayEffects, 'thorn_briar_spiral_bloom')).toBe(true);

    expect(finisher?.type).toBe('Angel');
    expect(hasEffectTypeRecursive(finisher?.activatedAbility.effects, 'thorn_briar_spiral_bloom')).toBe(true);
  });

  it('lets Thornbound Last Procession cash live Scar, Trail, and Briar Spiral depth', () => {
    seedPlayingState(['inf-thornbound-last-procession']);

    useStore.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        thornScar: 12,
        trail: 42,
        secondaryCounters: { ...(state.turn.secondaryCounters ?? {}), thorn: 10 },
      },
    }));

    const before = useStore.getState().progress.oblivion;
    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.progress.oblivion - before).toBeGreaterThan(5000);
  });

  it('lets Thorn Widow Engine convert Briar Spiral depth into a dynamic Infinite spike', () => {
    seedPlayingState(['inf-thorn-widow-engine']);

    const widow = CardRegistry.get('inf-thorn-widow-engine');
    // Phase 0: all attacks are free — costs array is always empty.
    expect(widow?.attacks?.unsynergized.costs ?? []).toHaveLength(0);

    useStore.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        thornScar: 10,
        trail: 34,
        secondaryCounters: { ...(state.turn.secondaryCounters ?? {}), thorn: 8 },
      },
    }));

    const before = useStore.getState().progress.oblivion;
    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.progress.oblivion - before).toBeGreaterThan(3000);
    expect(state.turn.secondaryCounters?.thorn ?? 0).toBeGreaterThanOrEqual(2);
    expect(state.turn.trail).toBeGreaterThan(34);
  });

  it('keeps Thornbound Infinity cards in unique Briar Spiral amplifier roles', () => {
    const forge = CardRegistry.get('inf-gravebloom-singularity');
    const refinery = CardRegistry.get('inf-thornbound-last-procession');
    const surge = CardRegistry.get('inf-thorn-widow-engine');
    const finisher = CardRegistry.get('inf-thornbound-elegy-titan');

    expect(forge?.type).toBe('Cherubim');
    expect(hasEffectTypeRecursive(forge?.onPlayEffects, 'set_secondary_gain')).toBe(true);
    expect(hasEffectTypeRecursive(forge?.onPlayEffects, 'thorn_briar_spiral_bloom')).toBe(false);

    expect(refinery?.type).toBe('Ophanim');
    expect(hasEffectTypeRecursive(refinery?.effects, 'set_secondary_spend')).toBe(true);
    expect(hasEffectTypeRecursive(refinery?.effects, 'thorn_briar_spiral_bloom')).toBe(true);
    expect(hasEffectTypeRecursive(refinery?.effects, 'eternal_stack_cashout')).toBe(false);

    expect(surge?.type).toBe('Seraphim');
    expect(hasEffectTypeRecursive(surge?.onPlayEffects, 'thorn_briar_spiral_bloom')).toBe(true);
    expect(hasEffectTypeRecursive(surge?.onPlayEffects, 'set_secondary_spend')).toBe(true);

    expect(finisher?.type).toBe('Angel');
    expect(hasEffectTypeRecursive(finisher?.activatedAbility.effects, 'thorn_briar_spiral_bloom')).toBe(true);
    expect(hasEffectTypeRecursive(finisher?.activatedAbility.effects, 'set_secondary_spend')).toBe(true);
    expect(hasEffectTypeRecursive(finisher?.activatedAbility.effects, 'eternal_stack_cashout')).toBe(false);
  });

  it('lets Mechanical Dreams base cards accrue Strain on play', () => {
    seedPlayingState(['md-ser-cogbound-aegis']);

    const beforeStrain = useStore.getState().turn.strain ?? 0;
    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect((state.turn.strain ?? 0)).toBeGreaterThanOrEqual(beforeStrain);
  });

  it('lets Mechanical Eternity seed Reactor Cores directly', () => {
    seedPlayingState(['btei-mech-overclock-singularity']);

    useStore.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        eternalStacks: { ...(state.turn.eternalStacks ?? {}), mech: 0 },
      },
    }));

    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.turn.eternalStacks?.mech ?? 0).toBeGreaterThanOrEqual(2);
    expect(state.turn.strain ?? 0).toBeGreaterThanOrEqual(9);
  });

  it('lets Mechanical Infinity seed even larger Reactor Core depth', () => {
    seedPlayingState(['inf-machina-eternal-loop']);

    useStore.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        eternalStacks: { ...(state.turn.eternalStacks ?? {}), mech: 0 },
      },
    }));

    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.turn.eternalStacks?.mech ?? 0).toBeGreaterThanOrEqual(8);
  });

  it('tracks base Prismatic channels without opening refraction depth by itself', () => {
    seedPlayingState(['pa-ser-plainshush-drossken', 'pa-ser-mirrorback-mirshan']);

    useStore.getState().playCard('hand_0');
    useStore.getState().playCard('hand_1');

    const state = useStore.getState();
    expect(new Set(state.turn.prismaticDistinctChannels ?? []).size).toBeGreaterThanOrEqual(2);
    expect(state.turn.prismaticRefractionDepth ?? 0).toBe(0);
  });

  it('keeps base Black Glass from building flame resources without a higher-rarity enabler', () => {
    seedPlayingState(['bgi-cherubim-ashencourt-sigil', 'bgi-ser-void-mandible-archon']);

    useStore.getState().playCard('hand_0');
    useStore.getState().playCard('hand_1');
    useStore.getState().removeCherubim(0);

    const state = useStore.getState();
    expect(state.turn.blackGlassWhiteFlame ?? 0).toBe(0);
    expect(state.turn.blackGlassBlackFlame ?? 0).toBe(0);
    expect(state.turn.blackGlassFracture ?? 0).toBe(0);
  });

  it('keeps base Butterfly cards from granting Wing Pulse without a higher-rarity enabler', () => {
    seedPlayingState(['bf-ser-pyrethkai-whiteflame']);

    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.turn.secondaryCounters?.flutter ?? 0).toBe(0);
    expect(state.turn.butterflySpectrum ?? 0).toBeGreaterThanOrEqual(3);
  });

  it('moves Snowbound from Frost setup into a Voltage charge cashout window', () => {
    seedPlayingState(['sv-oph-signal-collapse', 'sv-oph-first-static']);

    useStore.getState().playCard('hand_0');
    useStore.getState().playCard('hand_1');

    const state = useStore.getState();
    expect(state.turn.snowboundAlternatedThisTurn).toBeUndefined();
    expect(state.turn.arcticCharge).toBe(0);
    expect(state.turn.snowboundPhase).toBe('Voltage');
  });

  it('keeps Snowbound Eternity cards on unified Polar Capacitor release logic', () => {
    const frostCharge = CardRegistry.get('sv-eternal-frost-charge');
    const auroraBattery = CardRegistry.get('sv-eternal-aurora-battery');
    const glacierSignal = CardRegistry.get('sv-eternal-glacier-signal');
    const whiteStatic = CardRegistry.get('sv-eternal-white-static');
    const sleetChoir = CardRegistry.get('sv-eternal-sleet-choir');

    for (const card of [frostCharge, auroraBattery, glacierSignal, whiteStatic, sleetChoir]) {
      expect(card?.onSummonEffects?.some(effect => effect.type === 'set_secondary_gain' && effect.kind === 'snow')).toBe(true);
    }

    expect(hasEffectTypeRecursive(frostCharge?.activatedAbility?.effects, 'snow_polar_capacitor_release')).toBe(true);
    expect(hasEffectTypeRecursive(glacierSignal?.activatedAbility?.effects, 'snow_polar_capacitor_release')).toBe(true);
    expect(hasEffectTypeRecursive(whiteStatic?.activatedAbility?.effects, 'snow_polar_capacitor_release')).toBe(true);
    expect(hasEffectTypeRecursive(sleetChoir?.activatedAbility?.effects, 'snow_polar_capacitor_release')).toBe(true);
    expect(hasEffectTypeRecursive(auroraBattery?.activatedAbility?.effects, 'snow_polar_capacitor_release')).toBe(false);

    const eternalReleasePairs = [frostCharge, glacierSignal, whiteStatic, sleetChoir]
      .map(card => card?.activatedAbility?.effects?.find(effect => effect.type === 'snow_polar_capacitor_release'))
      .filter((effect): effect is Extract<NonNullable<typeof effect>, { type: 'snow_polar_capacitor_release' }> =>
        effect?.type === 'snow_polar_capacitor_release')
      .map(effect => `${effect.voltageOblivionPerCapacitor}:${effect.frostArcticChargePerCapacitor}:${effect.consume ?? 'all'}`);

    expect(new Set(eternalReleasePairs).size).toBe(4);
  });

  it('keeps Snowbound Infinity cards on stronger, unique Polar Capacitor release lines', () => {
    const eternalCards = [
      CardRegistry.get('sv-eternal-frost-charge'),
      CardRegistry.get('sv-eternal-aurora-battery'),
      CardRegistry.get('sv-eternal-glacier-signal'),
      CardRegistry.get('sv-eternal-white-static'),
      CardRegistry.get('sv-eternal-sleet-choir'),
    ];

    const infiniteCards = [
      CardRegistry.get('sv-infinite-polar-fission'),
      CardRegistry.get('sv-infinite-neon-snowfall'),
      CardRegistry.get('sv-infinite-crystal-storm'),
      CardRegistry.get('sv-infinite-black-ice-throne'),
      CardRegistry.get('sv-infinite-aurora-collapse'),
      CardRegistry.get('inf-sv-polar-cataclysm'),
      CardRegistry.get('inf-sv-neon-deluge'),
      CardRegistry.get('inf-sv-crystal-maelstrom'),
      CardRegistry.get('inf-sv-black-ice-dominion'),
      CardRegistry.get('inf-sv-aurora-singularity'),
    ];

    const maxEternalPrimary = Math.max(...eternalCards.map(card => card?.attacks?.primary.baseOblivion ?? 0));

    const releasePairs = new Set<string>();
    for (const card of infiniteCards) {
      expect(card?.onSummonEffects?.some(effect => effect.type === 'set_secondary_gain' && effect.kind === 'snow')
        ?? card?.effects?.some(effect => effect.type === 'set_secondary_gain' && effect.kind === 'snow')).toBe(true);

      const abilityRelease = (card?.activatedAbility?.effects ?? []).find(
        effect => effect.type === 'snow_polar_capacitor_release',
      );
      const directRelease = (card?.effects ?? []).find(
        effect => effect.type === 'snow_polar_capacitor_release',
      );
      const release = abilityRelease ?? directRelease;
      expect(Boolean(release)).toBe(true);

      if (release?.type === 'snow_polar_capacitor_release') {
        releasePairs.add(`${release.voltageOblivionPerCapacitor}:${release.frostArcticChargePerCapacitor}:${release.consume ?? 'all'}`);
        expect(release.voltageOblivionPerCapacitor).toBeGreaterThan(300);
      }

      if (card?.type === 'Angel') {
        expect(card.attacks?.primary.baseOblivion ?? 0).toBeGreaterThanOrEqual(maxEternalPrimary);
      }
    }

    expect(releasePairs.size).toBe(infiniteCards.length);
  });

  it('builds Glass fragments while Eternal cards accumulate Refraction Charge', () => {
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
    expect(state.turn.secondaryCounters?.absol ?? 0).toBeGreaterThan(0);
  });

  it('keeps Glass Eternal cards in distinct Refraction Charge roles', () => {
    const battery = CardRegistry.get('ga-et-lattice-archive-seraph');
    const tempo = CardRegistry.get('ga-et-angled-infinity');
    const bridge = CardRegistry.get('ga-et-first-white');
    const finisher = CardRegistry.get('ga-et-center-everywhere');
    const stabilizer = CardRegistry.get('ga-et-perfect-refraction');

    expect(battery?.type).toBe('Seraphim');
    expect(hasEffectTypeRecursive(battery?.onPlayEffects, 'set_secondary_gain')).toBe(true);
    expect(hasEffectTypeRecursive(battery?.onPlayEffects, 'multiply_next')).toBe(false);
    expect(hasEffectTypeRecursive(battery?.onPlayEffects, 'oblivion_flat')).toBe(false);

    expect(tempo?.type).toBe('Cherubim');
    expect(hasEffectTypeRecursive(tempo?.onPlayEffects, 'oblivion_flat')).toBe(true);
    expect(hasEffectTypeRecursive(tempo?.onPlayEffects, 'set_secondary_spend')).toBe(true);

    expect(bridge?.type).toBe('Ophanim');
    expect(hasEffectTypeRecursive(bridge?.effects, 'draw')).toBe(true);
    expect(hasEffectTypeRecursive(bridge?.effects, 'set_secondary_spend')).toBe(true);

    expect(finisher?.type).toBe('Seraphim');
    expect(hasEffectTypeRecursive(finisher?.onPlayEffects, 'oblivion_flat')).toBe(true);
    expect(hasEffectTypeRecursive(finisher?.onPlayEffects, 'set_secondary_spend')).toBe(true);

    expect(stabilizer?.type).toBe('Cherubim');
    expect(hasEffectTypeRecursive(stabilizer?.onPlayEffects, 'draw')).toBe(true);
    expect(hasEffectTypeRecursive(stabilizer?.onPlayEffects, 'set_secondary_spend')).toBe(true);

    expect(battery?.onPlayEffects?.some(effect => effect.type === 'set_secondary_gain' && effect.kind === 'absol' && effect.value === 3)).toBe(true);
    expect(tempo?.onPlayEffects?.some(effect => effect.type === 'conditional' && effect.condition.type === 'first_card_this_turn')).toBe(true);
    expect(bridge?.effects?.some(effect => effect.type === 'conditional' && effect.condition.type === 'played_after_non_matching_element')).toBe(true);
    expect(finisher?.onPlayEffects?.some(effect => effect.type === 'conditional' && effect.condition.type === 'set_secondary_gte' && effect.condition.value === 7)).toBe(true);
    expect(stabilizer?.onPlayEffects?.some(effect => effect.type === 'conditional' && effect.condition.type === 'set_secondary_gte' && effect.condition.value === 4)).toBe(true);
  });

  it('keeps Glass Infinity cards stronger and role-unique around Refraction Charge', () => {
    const apexSeraph = CardRegistry.get('ga-inf-glass-absolute');
    const sovereign = CardRegistry.get('ga-inf-refracted-sovereign');
    const yreth = CardRegistry.get('ga-inf-yreth-prism-at-center');
    const chorus = CardRegistry.get('ga-inf-chorus-unbroken-spectrum');
    const shattered = CardRegistry.get('ga-inf-shattered-without-shattering');
    const colorAfterWhite = CardRegistry.get('ga-inf-color-after-white');

    const eternalApex = CardRegistry.get('ga-et-center-everywhere');

    expect(apexSeraph?.type).toBe('Seraphim');
    expect(sovereign?.type).toBe('Cherubim');
    expect(yreth?.type).toBe('Ophanim');
    expect(chorus?.type).toBe('Seraphim');
    expect(shattered?.type).toBe('Cherubim');
    expect(colorAfterWhite?.type).toBe('Ophanim');

    expect(apexSeraph?.onPlayEffects?.some(effect => effect.type === 'set_secondary_gain' && effect.kind === 'absol' && effect.value === 4)).toBe(true);
    expect(apexSeraph?.onPlayEffects?.some(effect => effect.type === 'conditional' && hasEffectTypeRecursive(effect.then, 'oblivion_flat'))).toBe(true);
    expect(sovereign?.onPlayEffects?.some(effect => effect.type === 'conditional' && effect.condition.type === 'set_secondary_gte' && effect.condition.value === 9)).toBe(true);
    expect(yreth?.effects?.some(effect => effect.type === 'conditional' && effect.condition.type === 'first_card_this_turn')).toBe(true);
    expect(yreth?.effects?.some(effect => effect.type === 'conditional' && effect.condition.type === 'played_after_non_matching_element')).toBe(true);
    expect(chorus?.onPlayEffects?.some(effect => effect.type === 'conditional' && effect.condition.type === 'cards_played_gte' && hasEffectTypeRecursive(effect.then, 'draw'))).toBe(true);
    expect(shattered?.onPlayEffects?.some(effect => effect.type === 'conditional' && effect.condition.type === 'set_secondary_gte' && effect.condition.value === 11 && hasEffectTypeRecursive(effect.then, 'draw'))).toBe(true);
    expect(colorAfterWhite?.effects?.some(effect => effect.type === 'set_secondary_gain' && effect.kind === 'absol' && effect.value === 5)).toBe(true);
    expect(colorAfterWhite?.effects?.some(effect => effect.type === 'conditional' && effect.condition.type === 'set_secondary_gte' && hasEffectTypeRecursive(effect.then, 'oblivion_flat'))).toBe(true);

    const infiniteApexFlat = apexSeraph?.onPlayEffects
      ?.flatMap(effect => effect.type === 'conditional' ? effect.then : [])
      .find(effect => effect.type === 'oblivion_flat');
    const eternalApexFlat = eternalApex?.onPlayEffects
      ?.flatMap(effect => effect.type === 'conditional' ? effect.then : [])
      .find(effect => effect.type === 'oblivion_flat');
    expect((infiniteApexFlat?.type === 'oblivion_flat' ? infiniteApexFlat.value : 0)).toBeGreaterThan(
      eternalApexFlat?.type === 'oblivion_flat' ? eternalApexFlat.value : 0,
    );

    const roleSignatures = [
      `apex:${hasEffectTypeRecursive(apexSeraph?.onPlayEffects, 'set_secondary_gain')}:${hasEffectTypeRecursive(apexSeraph?.onPlayEffects, 'oblivion_flat')}`,
      `sovereign:${hasEffectTypeRecursive(sovereign?.onPlayEffects, 'draw')}:${hasEffectTypeRecursive(sovereign?.onPlayEffects, 'oblivion_flat')}`,
      `yreth:${hasEffectTypeRecursive(yreth?.effects, 'first_card_this_turn')}:${hasEffectTypeRecursive(yreth?.effects, 'played_after_non_matching_element')}`,
      `chorus:${chorus?.onPlayEffects?.some(effect => effect.type === 'conditional' && effect.condition.type === 'cards_played_gte')}:${hasEffectTypeRecursive(chorus?.onPlayEffects, 'draw')}`,
      `shattered:${hasEffectTypeRecursive(shattered?.onPlayEffects, 'draw')}:${hasEffectTypeRecursive(shattered?.effects, 'cherubim_seraphim_amp')}`,
      `color:${hasEffectTypeRecursive(colorAfterWhite?.effects, 'set_secondary_gain')}:${hasEffectTypeRecursive(colorAfterWhite?.effects, 'oblivion_flat')}`,
    ];
    expect(new Set(roleSignatures).size).toBe(6);
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

  it('lets base Pyro sequencing build Heat without needing higher-rarity overlays', () => {
    seedPlayingState(['hr-light-divine-smite', 'cherubim-fire-pyre-mantle']);

    useStore.getState().playCard('hand_0');
    useStore.getState().playCard('hand_1');

    const state = useStore.getState();
    expect(state.turn.pyroHeat ?? 0).toBeGreaterThan(0);
    expect(state.turn.secondaryCounters?.pyro ?? 0).toBe(0);
  });

  it('lets Cinder Leviathan trade embers for chain and Inferno pressure', () => {
    seedPlayingState(['btei-pyroabyss-cinder-cataclysm']);

    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.turn.eternalStacks?.pyro ?? 0).toBeGreaterThanOrEqual(2);
    expect(state.turn.secondaryCounters?.pyro ?? 0).toBeGreaterThanOrEqual(3);
  });

  it('lets Pyraxis Colossus use its tuned ember cost and furnace tempo', () => {
    seedPlayingState(['inf-pyraxis-colossus']);

    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.turn.eternalStacks?.pyro ?? 0).toBeGreaterThanOrEqual(5);
    expect(state.turn.secondaryCounters?.pyro ?? 0).toBeGreaterThanOrEqual(2);
  });

  it('lets Ash Kings Apocalypse cash prepared Pyro tier and ember fuel', () => {
    seedPlayingState(['inf-ash-kings-apocalypse']);

    useStore.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        eternalStacks: {
          ...state.turn.eternalStacks,
          pyro: 6,
        },
        secondaryCounters: {
          ...state.turn.secondaryCounters,
          pyro: 5,
        },
      },
    }));

    const before = useStore.getState().progress.oblivion;
    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.progress.oblivion - before).toBeGreaterThan(1400);
    expect(state.turn.secondaryCounters?.pyro ?? 0).toBeGreaterThanOrEqual(4);
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
          pyroHeat: 90,
          eternalStacks: {
            ...state.turn.eternalStacks,
            pyro: 9,
          },
          secondaryCounters: {
            ...state.turn.secondaryCounters,
            pyro: 8,
          },
        },
      };
    });

    const before = useStore.getState().progress.oblivion;
    useStore.getState().activateAngel(0);

    const state = useStore.getState();
    expect(state.progress.oblivion - before).toBeGreaterThan(2400);
    expect(state.turn.eternalStacks?.pyro ?? 0).toBeLessThanOrEqual(0);
    expect(state.turn.secondaryCounters?.pyro ?? 0).toBe(0);
  });

  it('lets Oblivion Absolute cash Patience-driven Neutrality scaling', () => {
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
        attenuationBrokenClasses: ['setup', 'conversion'],
        neutralitySetupCount: 3,
        neutralityEngineSignatures: ['Seraphim:setup', 'Ophanim:conversion', 'Cherubim:multiplier'],
      },
    }));

    const before = useStore.getState().progress.oblivion;
    useStore.getState().playCard('hand_0');

    const state = useStore.getState();
    expect(state.progress.oblivion - before).toBeGreaterThan(1200);
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
    expect(state.progress.oblivion - before).toBeGreaterThanOrEqual(0);
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
    expect(state.progress.oblivion - before).toBeGreaterThanOrEqual(0);
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

    expect(firstGain).toBeGreaterThan(550);
    expect(secondGain).toBeGreaterThan(500);
    expect(firstGain + secondGain).toBeGreaterThan(1500);
    expect(state.turn.equilibriumStability).toBeGreaterThanOrEqual(4);
  });

  it('keeps Wild Pollen generation exclusive to Blazing Garden Eternals', () => {
    const eternalIds = [
      'bg-et-serevathi-proofflame',
      'bg-et-aureveth-evernoon',
      'bg-et-vethkorath-seven-crown-proof',
      'bg-et-embergrove-codex',
      'bg-et-noonproof-transit',
    ];
    const infiniteIds = [
      'bg-inf-final-chord-incandescent',
      'bg-inf-soleth-vair-worldflower',
      'bg-inf-embergrove-resurrection-array',
      'bg-inf-choir-of-rekindled-geometry',
      'bg-inf-noon-that-never-sets',
      'bg-inf-proof-completed-sky',
    ];

    for (const id of eternalIds) {
      const card = CardRegistry.get(id);
      expect(card).toBeTruthy();
      expect(getGardenGenerationValue(card)).toBeGreaterThan(0);
    }

    for (const id of infiniteIds) {
      const card = CardRegistry.get(id);
      expect(card).toBeTruthy();
      expect(getGardenGenerationValue(card)).toBe(0);
    }
  });

  it('gives each Blazing Garden Eternal a unique Wild Pollen role signature', () => {
    const eternalIds = [
      'bg-et-serevathi-proofflame',
      'bg-et-aureveth-evernoon',
      'bg-et-vethkorath-seven-crown-proof',
      'bg-et-embergrove-codex',
      'bg-et-noonproof-transit',
    ];

    const signatures = eternalIds.map(id => {
      const card = CardRegistry.get(id);
      expect(card).toBeTruthy();

      const generation = getGardenGenerationValue(card);
      const seed = getGardenSeedEffect(card);
      const consume = typeof seed?.consume === 'number' ? seed.consume : 'all';
      const seedRate = typeof seed?.oblivionPerPollen === 'number' ? seed.oblivionPerPollen : 0;
      const seedScore = typeof seed?.scoreMultPerBloom === 'number' ? seed.scoreMultPerBloom : 0;

      const riderTypes = collectTopLevelEffects(card)
        .map(effect => effect.type)
        .filter((type): type is string => typeof type === 'string' && type !== 'set_secondary_gain' && type !== 'garden_wild_pollen_seed')
        .sort()
        .join(',');

      return `${generation}|${consume}|${seedRate}|${seedScore}|${riderTypes}`;
    });

    expect(new Set(signatures).size).toBe(eternalIds.length);
    expect(signatures.some(signature => signature.includes('|all|'))).toBe(true);
    expect(signatures.some(signature => signature.includes('|0|0|'))).toBe(true);
  });

  it('keeps Blazing Garden Infinity cards uniquely amplified around Wild Pollen spend', () => {
    const eternalIds = [
      'bg-et-aureveth-evernoon',
      'bg-et-embergrove-codex',
      'bg-et-noonproof-transit',
    ];
    const infiniteIds = [
      'bg-inf-final-chord-incandescent',
      'bg-inf-soleth-vair-worldflower',
      'bg-inf-embergrove-resurrection-array',
      'bg-inf-choir-of-rekindled-geometry',
      'bg-inf-noon-that-never-sets',
      'bg-inf-proof-completed-sky',
    ];

    const eternalBestRate = Math.max(
      ...eternalIds.map(id => {
        const card = CardRegistry.get(id);
        const seed = getGardenSeedEffect(card);
        return typeof seed?.oblivionPerPollen === 'number' ? seed.oblivionPerPollen : 0;
      }),
    );

    const signatures = infiniteIds.map(id => {
      const card = CardRegistry.get(id);
      expect(card).toBeTruthy();

      const seed = getGardenSeedEffect(card);
      expect(seed).toBeTruthy();

      const consume = typeof seed?.consume === 'number' ? seed.consume : 'all';
      const seedRate = typeof seed?.oblivionPerPollen === 'number' ? seed.oblivionPerPollen : 0;
      const seedScore = typeof seed?.scoreMultPerBloom === 'number' ? seed.scoreMultPerBloom : 0;

      expect(seedRate).toBeGreaterThan(eternalBestRate);

      const riderTypes = collectTopLevelEffects(card)
        .map(effect => effect.type)
        .filter((type): type is string => typeof type === 'string' && type !== 'garden_wild_pollen_seed')
        .sort()
        .join(',');

      return `${consume}|${seedRate}|${seedScore}|${riderTypes}`;
    });

    expect(new Set(signatures).size).toBe(infiniteIds.length);
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

  it('keeps Butterfly Eternity cards in distinct Wing Resonance roles', () => {
    const kethravoss = CardRegistry.get('bf-et-kethravoss-seven-layers');
    const mirrorglass = CardRegistry.get('bf-et-mirrorglass-conclave');
    const nullwing = CardRegistry.get('bf-et-nullwing-interstice');
    const pyrethkai = CardRegistry.get('bf-et-pyrethkai-equilibrium');
    const volthari = CardRegistry.get('bf-et-volthari-storm-lattice');

    expect(kethravoss?.type).toBe('Seraphim');
    expect(hasEffectTypeRecursive(kethravoss?.onPlayEffects, 'eternal_stack_gain')).toBe(true);
    expect(hasEffectTypeRecursive(kethravoss?.onPlayEffects, 'butterfly_release')).toBe(true);

    expect(mirrorglass?.type).toBe('Cherubim');
    expect(hasEffectTypeRecursive(mirrorglass?.onPlayEffects, 'flutter_resonance_harmonize')).toBe(true);
    expect(hasEffectTypeRecursive(mirrorglass?.onPlayEffects, 'draw')).toBe(true);

    expect(nullwing?.type).toBe('Ophanim');
    expect(hasEffectTypeRecursive(nullwing?.effects, 'flutter_resonance_harmonize')).toBe(true);
    expect(hasEffectTypeRecursive(nullwing?.effects, 'butterfly_release')).toBe(true);

    expect(pyrethkai?.type).toBe('Angel');
    expect(hasEffectTypeRecursive(pyrethkai?.onSummonEffects, 'eternal_stack_gain')).toBe(true);
    expect(hasEffectTypeRecursive(pyrethkai?.activatedAbility.effects, 'flutter_resonance_apex')).toBe(true);

    expect(volthari?.type).toBe('Ophanim');
    expect(hasEffectTypeRecursive(volthari?.effects, 'flutter_resonance_harmonize')).toBe(true);
    expect(hasEffectTypeRecursive(volthari?.effects, 'draw')).toBe(true);
  });

  it('lets Butterfly Eternity harmonize Wing Resonance into Spectrum and payoff', () => {
    seedPlayingState(['bf-et-nullwing-interstice']);

    useStore.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        butterflySpectrum: 0,
        butterflyFormation: 3,
        butterflyFlutterLevel: 0,
        eternalStacks: { ...(state.turn.eternalStacks ?? {}), flutter: 0 },
      },
      progress: {
        ...state.progress,
        oblivion: 0,
      },
    }));

    useStore.getState().playCard('hand_0');
    const state = useStore.getState();

    expect(state.turn.eternalStacks?.flutter ?? 0).toBe(0);
    expect(state.turn.butterflySpectrum ?? 0).toBeGreaterThanOrEqual(1);
    expect(state.progress.oblivion).toBeGreaterThan(300);
  });

  it('keeps Butterfly Infinity cards in distinct Wing Resonance roles', () => {
    const ids = [
      'bf-inf-velkoreth-the-unfolding',
      'bf-inf-open-foundational-chrysalis',
      'bf-inf-mirrorface-voidface',
      'bf-inf-generation-of-the-flutter',
      'bf-inf-the-endless-wing-age',
    ];

    const signatures = ids.map(id => {
      const card = CardRegistry.get(id);
      expect(card).toBeTruthy();

      const effects = collectTopLevelEffects(card);
      const gain = effects
        .filter(effect => effect.type === 'eternal_stack_gain' && effect.stack === 'flutter')
        .reduce((sum, effect) => sum + (typeof effect.value === 'number' ? effect.value : 0), 0);

      const harmonize = effects.find(effect => effect.type === 'flutter_resonance_harmonize') as Record<string, unknown> | undefined;
      const apex = effects.find(effect => effect.type === 'flutter_resonance_apex') as Record<string, unknown> | undefined;
      const release = effects.find(effect => effect.type === 'butterfly_release') as Record<string, unknown> | undefined;

      const riderTypes = effects
        .map(effect => effect.type)
        .filter((type): type is string => typeof type === 'string' && !['eternal_stack_gain', 'flutter_resonance_harmonize', 'flutter_resonance_apex', 'butterfly_release'].includes(type))
        .sort()
        .join(',');

      return [
        gain,
        harmonize ? `h:${harmonize.consume ?? 'all'}:${harmonize.spectrumPerResonance ?? 0}:${harmonize.oblivionPerResonance ?? 0}:${harmonize.oblivionPerFormation ?? 0}:${harmonize.drawPerResonance ?? 0}:${harmonize.empowerNext ? 'Y' : 'N'}` : 'h:none',
        apex ? `a:${apex.consume ?? 'all'}:${apex.oblivionPerResonance ?? 0}:${apex.oblivionPerSpectrum ?? 0}:${apex.oblivionPerFormation ?? 0}:${apex.drawPerFormation ?? 0}:${apex.empowerAtFormation ?? 0}` : 'a:none',
        release ? `r:${release.spend ?? 0}:${release.oblivionPerSpectrum ?? 0}` : 'r:none',
        riderTypes,
      ].join('|');
    });

    expect(new Set(signatures).size).toBe(ids.length);
  });

  it('keeps Butterfly Infinity resonance coefficients stronger than Butterfly Eternity apex lines', () => {
    const eternalAngel = CardRegistry.get('bf-et-pyrethkai-equilibrium');
    const infiniteAngel = CardRegistry.get('bf-inf-generation-of-the-flutter');
    const eternalSeraph = CardRegistry.get('bf-et-kethravoss-seven-layers');
    const infiniteSeraph = CardRegistry.get('bf-inf-velkoreth-the-unfolding');

    const eternalApex = collectTopLevelEffects(eternalAngel)
      .find(effect => effect.type === 'flutter_resonance_apex') as Record<string, number> | undefined;
    const infiniteApex = collectTopLevelEffects(infiniteAngel)
      .find(effect => effect.type === 'flutter_resonance_apex') as Record<string, number> | undefined;

    expect(eternalApex).toBeTruthy();
    expect(infiniteApex).toBeTruthy();
    expect((infiniteApex?.oblivionPerResonance ?? 0)).toBeGreaterThan(eternalApex?.oblivionPerResonance ?? 0);
    expect((infiniteApex?.oblivionPerSpectrum ?? 0)).toBeGreaterThan(eternalApex?.oblivionPerSpectrum ?? 0);
    expect((infiniteApex?.oblivionPerFormation ?? 0)).toBeGreaterThan(eternalApex?.oblivionPerFormation ?? 0);

    const eternalGain = collectTopLevelEffects(eternalSeraph)
      .filter(effect => effect.type === 'eternal_stack_gain' && effect.stack === 'flutter')
      .reduce((sum, effect) => sum + (typeof effect.value === 'number' ? effect.value : 0), 0);
    const infiniteGain = collectTopLevelEffects(infiniteSeraph)
      .filter(effect => effect.type === 'eternal_stack_gain' && effect.stack === 'flutter')
      .reduce((sum, effect) => sum + (typeof effect.value === 'number' ? effect.value : 0), 0);

    expect(infiniteGain).toBeGreaterThan(eternalGain);
  });

  it('lets Butterfly Infinity apex lines cash Wing Resonance into a stronger burst window', () => {
    seedPlayingState(['bf-inf-the-endless-wing-age']);

    useStore.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        butterflySpectrum: 9,
        butterflyFormation: 4,
        butterflyFlutterLevel: 2,
        eternalStacks: { ...(state.turn.eternalStacks ?? {}), flutter: 0 },
      },
      progress: {
        ...state.progress,
        oblivion: 0,
      },
    }));

    useStore.getState().playCard('hand_0');
    const state = useStore.getState();

    expect(state.turn.eternalStacks?.flutter ?? 0).toBe(0);
    expect(state.progress.oblivion).toBeGreaterThan(900);
  });
});