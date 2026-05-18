import type { CardDefinition, CherubimDefinition, OphanimDefinition, PrismaticDepth, SeraphimDefinition } from '@/types/cards';

const GLASS_ABSOLUTE_ELEMENT = 'GlassAbsolute';

interface SeraphimSpec {
  definitionId: string;
  name: string;
  description: string;
  rarity: SeraphimDefinition['rarity'];
  prismaticDepth?: PrismaticDepth;
  artKey: string;
  bonusType: SeraphimDefinition['baseStats']['bonusType'];
  bonusValue: number;
  onPlayEffects: SeraphimDefinition['onPlayEffects'];
  unsynergizedName: string;
  synergizedName: string;
  unsynergizedDescription: string;
  synergizedDescription: string;
  unsynergizedBase: number;
  synergizedBase: number;
  unsynergizedCooldown: number;
  synergizedCooldown: number;
  unsynergizedScaling: number;
  synergizedScaling: number;
}

interface CherubimSpec {
  definitionId: string;
  name: string;
  description: string;
  rarity: CherubimDefinition['rarity'];
  prismaticDepth?: PrismaticDepth;
  artKey: string;
  effects: CherubimDefinition['effects'];
  onPlayEffects: CherubimDefinition['onPlayEffects'];
  maxDurability?: number;
}

interface OphanimSpec {
  definitionId: string;
  name: string;
  description: string;
  rarity: OphanimDefinition['rarity'];
  prismaticDepth?: PrismaticDepth;
  artKey: string;
  effects: OphanimDefinition['effects'];
}

function resolvePrismaticDepth(rarity: CardDefinition['rarity']): PrismaticDepth {
  switch (rarity) {
    case 'Common':
      return 1;
    case 'Rare':
      return 2;
    case 'Epic':
      return 3;
    case 'Legendary':
      return 4;
    case 'Eternal':
    case 'Infinite':
      return 5;
  }
}

function buildSeraphim(spec: SeraphimSpec): SeraphimDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Seraphim',
    element: GLASS_ABSOLUTE_ELEMENT as SeraphimDefinition['element'],
    rarity: spec.rarity,
    prismaticDepth: spec.prismaticDepth ?? resolvePrismaticDepth(spec.rarity),
    name: spec.name,
    description: spec.description,
    artKey: spec.artKey,
    attacks: {
      unsynergized: {
        id: `${spec.definitionId}:unsynergized`,
        label: 'Unsynergized',
        name: spec.unsynergizedName,
        description: spec.unsynergizedDescription,
        baseOblivion: spec.unsynergizedBase,
        cooldownCards: spec.unsynergizedCooldown,
        chainScaling: spec.unsynergizedScaling,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'glass-absolute'],
      },
      synergized: {
        id: `${spec.definitionId}:synergized`,
        label: 'Synergized',
        name: spec.synergizedName,
        description: spec.synergizedDescription,
        baseOblivion: spec.synergizedBase,
        cooldownCards: spec.synergizedCooldown,
        chainScaling: spec.synergizedScaling,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'glass-absolute'],
      },
    },
    baseStats: { bonusType: spec.bonusType, bonusValue: spec.bonusValue, synergyRequirement: GLASS_ABSOLUTE_ELEMENT as SeraphimDefinition['baseStats']['synergyRequirement'] },
    onPlayEffects: spec.onPlayEffects,
  };
}

function buildCherubim(spec: CherubimSpec): CherubimDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Cherubim',
    element: GLASS_ABSOLUTE_ELEMENT as CherubimDefinition['element'],
    rarity: spec.rarity,
    prismaticDepth: spec.prismaticDepth ?? resolvePrismaticDepth(spec.rarity),
    name: spec.name,
    description: spec.description,
    artKey: spec.artKey,
    effects: spec.effects,
    onPlayEffects: spec.onPlayEffects,
    maxDurability: spec.maxDurability,
  };
}

function buildOphanim(spec: OphanimSpec): OphanimDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Ophanim',
    element: GLASS_ABSOLUTE_ELEMENT as OphanimDefinition['element'],
    rarity: spec.rarity,
    prismaticDepth: spec.prismaticDepth ?? resolvePrismaticDepth(spec.rarity),
    name: spec.name,
    description: spec.description,
    artKey: spec.artKey,
    effects: spec.effects,
  };
}

export const glassAbsoluteCards: CardDefinition[] = [
  buildSeraphim({
    definitionId: 'ga-ser-prismwake',
    name: 'Prismwake Seraph',
    description: 'On play: Draw 1 card; Set chain floor to x1.5. While on board: +12 Oblivion per card played while active',
    rarity: 'Common',
    artKey: 'ga_ser_prismwake',
    bonusType: 'oblivion_per_card',
    bonusValue: 12,
    onPlayEffects: [{ type: 'draw', value: 1 }, { type: 'set_chain_floor', value: 1.5 }],
    unsynergizedName: 'Prismwake Vector Break',
    synergizedName: 'Prismwake Angelic Verdict',
    unsynergizedDescription: '240 base Oblivion, 5 cards cooldown, x1.18 chain scaling, Cost: discard 1 card',
    synergizedDescription: '420 base Oblivion, 6 cards cooldown, x1.32 chain scaling, Angel required',
    unsynergizedBase: 240,
    synergizedBase: 408,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
    unsynergizedScaling: 1.16,
    synergizedScaling: 1.32,
  }),
  buildSeraphim({
    definitionId: 'ga-ser-lattice-canticle',
    name: 'Lattice Canticle Seraph',
    description: 'On play: Draw 2 cards; Empower the next card you play. While on board: +18 Oblivion per card played while active',
    rarity: 'Rare',
    artKey: 'ga_ser_lattice_canticle',
    bonusType: 'oblivion_per_card',
    bonusValue: 18,
    onPlayEffects: [{ type: 'draw', value: 2 }, { type: 'multiply_next' }],
    unsynergizedName: 'Lattice Canticle Vector Break',
    synergizedName: 'Lattice Canticle Angelic Verdict',
    unsynergizedDescription: '312 base Oblivion, 5 cards cooldown, x1.20 chain scaling, Cost: discard 1 card',
    synergizedDescription: '546 base Oblivion, 6 cards cooldown, x1.35 chain scaling, Angel required',
    unsynergizedBase: 312,
    synergizedBase: 530,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
    unsynergizedScaling: 1.18,
    synergizedScaling: 1.35,
  }),
  buildSeraphim({
    definitionId: 'ga-ser-white-edge',
    name: 'White Edge Herald',
    description: 'On play: Gain 14 of your dominant resource; Set chain floor to x2.0. While on board: Resource generation +14 while active',
    rarity: 'Rare',
    artKey: 'ga_ser_white_edge',
    bonusType: 'resource_generation',
    bonusValue: 14,
    onPlayEffects: [{ type: 'dominant_stack_gain', value: 14 }, { type: 'set_chain_floor', value: 2.0 }],
    unsynergizedName: 'White Edge Vector Break',
    synergizedName: 'White Edge Angelic Verdict',
    unsynergizedDescription: '366 base Oblivion, 5 cards cooldown, x1.21 chain scaling, Cost: discard 1 card',
    synergizedDescription: '641 base Oblivion, 7 cards cooldown, x1.38 chain scaling, Angel required',
    unsynergizedBase: 366,
    synergizedBase: 612,
    unsynergizedCooldown: 5,
    synergizedCooldown: 6,
    unsynergizedScaling: 1.21,
    synergizedScaling: 1.38,
  }),
  buildSeraphim({
    definitionId: 'ga-ser-glass-hymn',
    name: 'Glass Hymn Sentinel',
    description: 'On play: +220 Oblivion; Draw 1 card. While on board: +30 Oblivion per card played while active',
    rarity: 'Epic',
    artKey: 'ga_ser_glass_hymn',
    bonusType: 'oblivion_per_card',
    bonusValue: 30,
    onPlayEffects: [{ type: 'oblivion_flat', value: 220 }, { type: 'draw', value: 1 }],
    unsynergizedName: 'Glass Hymn Vector Break',
    synergizedName: 'Glass Hymn Angelic Verdict',
    unsynergizedDescription: '460 base Oblivion, 5 cards cooldown, x1.25 chain scaling, Cost: discard 1 card',
    synergizedDescription: '805 base Oblivion, 7 cards cooldown, x1.41 chain scaling, Angel required',
    unsynergizedBase: 460,
    synergizedBase: 782,
    unsynergizedCooldown: 5,
    synergizedCooldown: 6,
    unsynergizedScaling: 1.24,
    synergizedScaling: 1.41,
  }),
  buildSeraphim({
    definitionId: 'ga-ser-yrethborn',
    name: 'Yrethborn Ascendant',
    description: 'On play: Draw 2 cards; Set chain multiplier to x2.0; Gain 22 of your dominant resource. While on board: Resource generation +22 while active',
    rarity: 'Legendary',
    artKey: 'ga_ser_yrethborn',
    bonusType: 'resource_generation',
    bonusValue: 22,
    onPlayEffects: [{ type: 'draw', value: 2 }, { type: 'chain_multiplier_set', value: 2.0 }, { type: 'dominant_stack_gain', value: 22 }],
    unsynergizedName: 'Yrethborn Vector Break',
    synergizedName: 'Yrethborn Angelic Verdict',
    unsynergizedDescription: '690 base Oblivion, 5 cards cooldown, x1.25 chain scaling, Cost: discard 1 card',
    synergizedDescription: '1208 base Oblivion, 8 cards cooldown, x1.45 chain scaling, Angel required',
    unsynergizedBase: 690,
    synergizedBase: 1166,
    unsynergizedCooldown: 6,
    synergizedCooldown: 7,
    unsynergizedScaling: 1.28,
    synergizedScaling: 1.45,
  }),

  buildCherubim({
    definitionId: 'ga-cher-mirrorbody-archivist',
    name: 'Mirrorbody Archivist',
    description: 'On play: Draw 1 card. While on board: Adjacent active Seraphim gain +28 Oblivion per card played; Buffs Seraphim and Angel attacks: base +26, chain scaling +0.05, cooldown +0, multiplier x1.00',
    rarity: 'Common',
    artKey: 'ga_cher_mirrorbody_archivist',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 28 }],
    onPlayEffects: [{ type: 'draw', value: 1 }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-facet-gate-ward',
    name: 'Facet Gate Ward',
    description: 'On play: Set chain floor to x1.8. While on board: Adjacent active Seraphim gain +0.05 chain growth; Buffs Seraphim attacks: base +42, chain scaling +0.01, cooldown -1, multiplier x1.00',
    rarity: 'Rare',
    artKey: 'ga_cher_facet_gate_ward',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'chain', value: 0.05 }],
    onPlayEffects: [{ type: 'set_chain_floor', value: 1.8 }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-prismatic-reliquary',
    name: 'Prismatic Reliquary',
    description: 'On play: Draw 2 cards; Gain 8 of your dominant resource. While on board: Adjacent active Seraphim gain +38 Oblivion per card played; Buffs Seraphim attacks: base +34, chain scaling +0.05, cooldown +0, multiplier x1.00',
    rarity: 'Rare',
    artKey: 'ga_cher_prismatic_reliquary',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 38 }],
    onPlayEffects: [{ type: 'draw', value: 2 }, { type: 'dominant_stack_gain', value: 8 }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-shard-choir-keeper',
    name: 'Shard Choir Keeper',
    description: 'On play: Shuffle discard into deck. While on board: Each adjacent active Seraphim adds 1 extra card whenever you play a card; Buffs Seraphim and Angel attacks: base +48, chain scaling +0.07, cooldown +0, multiplier x1.00; Buffs Angel attacks: base +37, chain scaling +0.05, cooldown +0, multiplier x1.00',
    rarity: 'Epic',
    artKey: 'ga_cher_shard_choir_keeper',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'draw', value: 1 }],
    onPlayEffects: [{ type: 'shuffle_discard' }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-refraction-bastion',
    name: 'Refraction Bastion',
    description: 'On play: +260 Oblivion. While on board: Seraphim bonuses are amplified by +0.09; Buffs Angel attacks: base +46, chain scaling +0.09, cooldown +0, multiplier x1.00; Buffs Angel attacks: base +36, chain scaling +0.06, cooldown +0, multiplier x1.00',
    rarity: 'Epic',
    artKey: 'ga_cher_refraction_bastion',
    effects: [{ type: 'cherubim_seraphim_amp', value: 0.09 }],
    onPlayEffects: [{ type: 'oblivion_flat', value: 260 }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-glass-mantle-custodian',
    name: 'Glass Mantle Custodian',
    description: 'On play: Salvage any 1 card. While on board: Adjacent active Seraphim gain +46 Oblivion per card played; Buffs Angel attacks: base +41, chain scaling +0.10, cooldown +0, multiplier x1.00; Buffs Angel attacks: base +32, chain scaling +0.07, cooldown -1, multiplier x1.00',
    rarity: 'Legendary',
    artKey: 'ga_cher_glass_mantle_custodian',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 46 }],
    onPlayEffects: [{ type: 'salvage_any' }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-splitlight-cantor',
    name: 'Splitlight Cantor',
    description: 'On play: Gain 18 Radiance; Draw 1 card. While on board: Gain 12 Radiance per card played; Buffs Seraphim attacks: base +42, chain scaling +0.05, cooldown -1, multiplier x1.00',
    rarity: 'Rare',
    artKey: 'ga_cher_splitlight_cantor',
    effects: [{ type: 'cherubim_resource_per_card', resource: 'radiance', value: 12 }],
    onPlayEffects: [{ type: 'radiance_gain', value: 18 }, { type: 'draw', value: 1 }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-light-archive',
    name: 'Light Archive of Glass',
    description: 'On play: Look at the top 5 cards, take 2 cards, and put the rest on the bottom. While on board: Adjacent active Seraphim gain +0.06 chain growth; Buffs Seraphim and Angel attacks: base +59, chain scaling +0.01, cooldown +0, multiplier x1.00; Buffs Angel attacks: base +46, chain scaling +0.01, cooldown -1, multiplier x1.00',
    rarity: 'Legendary',
    artKey: 'ga_cher_light_archive',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'chain', value: 0.06 }],
    onPlayEffects: [{ type: 'look_top_take', look: 5, take: 2 }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-shardward-savant',
    name: 'Shardward Savant',
    description: 'On play: +180 Oblivion; Draw 2 cards. While on board: Adjacent active Seraphim gain +20 Oblivion per card played; Buffs Seraphim and Angel attacks: base +17, chain scaling +0.04, cooldown +0, multiplier x1.00',
    rarity: 'Common',
    artKey: 'ga_cher_shardward_savant',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 20 }],
    onPlayEffects: [{ type: 'oblivion_flat', value: 180 }, { type: 'draw', value: 2 }],
  }),

  buildOphanim({
    definitionId: 'ga-oph-spectral-current',
    name: 'Spectral Current',
    description: 'Draw 1 card; Set chain floor to x1.5',
    rarity: 'Common',
    artKey: 'ga_oph_spectral_current',
    effects: [{ type: 'draw', value: 1 }, { type: 'set_chain_floor', value: 1.5 }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-triune-prism-flow',
    name: 'Triune Prism Flow',
    description: 'Look at the top 5 cards, take 2 cards, and put the rest on the bottom',
    rarity: 'Common',
    artKey: 'ga_oph_triune_prism_flow',
    effects: [{ type: 'look_top_take', look: 5, take: 2 }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-glassroad-oracle',
    name: 'Glassroad Oracle',
    description: 'Salvage any 1 card; Gain 10 of your dominant resource',
    rarity: 'Rare',
    artKey: 'ga_oph_glassroad_oracle',
    effects: [{ type: 'salvage_any' }, { type: 'dominant_stack_gain', value: 10 }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-radiant-splinter-map',
    name: 'Radiant Splinter Map',
    description: 'Look at the top 6 cards, take 2 cards, put 1 card on the bottom, and discard the rest',
    rarity: 'Rare',
    artKey: 'ga_oph_radiant_splinter_map',
    effects: [{ type: 'look_top_take_drop', look: 6, take: 2, drop: 1 }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-lumen-cascade',
    name: 'Lumen Cascade',
    description: 'Draw 3 cards; Empower the next card you play',
    rarity: 'Epic',
    artKey: 'ga_oph_lumen_cascade',
    effects: [{ type: 'draw', value: 3 }, { type: 'multiply_next' }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-crystal-echo-archive',
    name: 'Crystal Echo Archive',
    description: 'Shuffle discard into deck; Gain 12 of your dominant resource',
    rarity: 'Epic',
    artKey: 'ga_oph_crystal_echo_archive',
    effects: [{ type: 'shuffle_discard' }, { type: 'dominant_stack_gain', value: 12 }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-white-transit',
    name: 'White Transit',
    description: 'Draw 4 cards; Gain 24 Radiance; Set chain multiplier to x2.5',
    rarity: 'Legendary',
    artKey: 'ga_oph_white_transit',
    effects: [{ type: 'draw', value: 4 }, { type: 'radiance_gain', value: 24 }, { type: 'chain_multiplier_set', value: 2.5 }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-prism-veil-drift',
    name: 'Prism Veil Drift',
    description: 'Draw 2 cards; Look at the top 4 cards, take 1 card, and put the rest on the bottom',
    rarity: 'Rare',
    artKey: 'ga_oph_prism_veil_drift',
    effects: [{ type: 'draw', value: 2 }, { type: 'look_top_take', look: 4, take: 1 }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-lattice-horizon',
    name: 'Lattice Horizon',
    description: 'Set chain floor to x2.0; Gain 18 of your dominant resource; Set chain floor to x1.4',
    rarity: 'Epic',
    artKey: 'ga_oph_lattice_horizon',
    effects: [{ type: 'set_chain_floor', value: 2.0 }, { type: 'dominant_stack_gain', value: 18 }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-spectral-afterimage',
    name: 'Spectral Afterimage',
    description: 'Replay last Ophanim played this turn; Draw 1 card',
    rarity: 'Legendary',
    artKey: 'ga_oph_spectral_afterimage',
    effects: [{ type: 'copy_last_hr' }, { type: 'draw', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-clear-beyond',
    name: 'Clear Beyond',
    description: 'Draw 3 cards; Salvage any 1 card',
    rarity: 'Common',
    artKey: 'ga_oph_clear_beyond',
    effects: [{ type: 'draw', value: 3 }, { type: 'salvage_any' }],
  }),

  buildSeraphim({
    definitionId: 'ga-et-lattice-archive-seraph',
    name: 'Lattice Archive Seraph',
    description: 'On play: Draw 2 cards; Gain 16 of your dominant resource. While on board: +16 Oblivion per card played while active',
    rarity: 'Eternal',
    artKey: 'ga_et_lattice_archive_seraph',
    bonusType: 'oblivion_per_card',
    bonusValue: 16,
    onPlayEffects: [{ type: 'draw', value: 2 }, { type: 'dominant_stack_gain', value: 16 }],
    unsynergizedName: 'Lattice Archive Vector Break',
    synergizedName: 'Lattice Archive Angelic Verdict',
    unsynergizedDescription: '920 base Oblivion, 5 cards cooldown, x1.25 chain scaling, Cost: discard 1 card',
    synergizedDescription: '1610 base Oblivion, 8 cards cooldown, x1.51 chain scaling, Angel required',
    unsynergizedBase: 920,
    synergizedBase: 1564,
    unsynergizedCooldown: 6,
    synergizedCooldown: 7,
    unsynergizedScaling: 1.34,
    synergizedScaling: 1.51,
  }),
  buildCherubim({
    definitionId: 'ga-et-angled-infinity',
    name: 'Angled Infinity',
    description: 'On play: Set chain floor to x3.0; Draw 2 cards. While on board: Adjacent active Seraphim gain +0.08 chain growth; Buffs Seraphim attacks: base +78, chain scaling +0.01, cooldown -1, multiplier x1.00; Buffs Angel attacks: base +61, chain scaling +0.01, cooldown -1, multiplier x1.00',
    rarity: 'Eternal',
    artKey: 'ga_et_angled_infinity',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'chain', value: 0.08 }],
    onPlayEffects: [{ type: 'set_chain_floor', value: 3.0 }, { type: 'draw', value: 2 }],
  }),
  buildOphanim({
    definitionId: 'ga-et-first-white',
    name: 'First White',
    description: 'Gain 24 of your dominant resource; Set chain multiplier to x2.8; Empower the next card you play; Draw 2 cards',
    rarity: 'Eternal',
    artKey: 'ga_et_first_white',
    effects: [{ type: 'dominant_stack_gain', value: 24 }, { type: 'chain_multiplier_set', value: 2.8 }],
  }),
  buildSeraphim({
    definitionId: 'ga-et-center-everywhere',
    name: 'The Center That Is Everywhere',
    description: 'On play: Draw 3 cards; Set chain floor to x3.5; Empower the next card you play. While on board: +78 Oblivion per card played while active',
    rarity: 'Eternal',
    artKey: 'ga_et_center_everywhere',
    bonusType: 'oblivion_per_card',
    bonusValue: 78,
    onPlayEffects: [{ type: 'draw', value: 3 }, { type: 'set_chain_floor', value: 3.5 }, { type: 'multiply_next' }],
    unsynergizedName: 'Center Everywhere Vector Break',
    synergizedName: 'Center Everywhere Angelic Verdict',
    unsynergizedDescription: '1040 base Oblivion, 5 cards cooldown, x1.25 chain scaling, Cost: discard 1 card',
    synergizedDescription: '1820 base Oblivion, 8 cards cooldown, x1.54 chain scaling, Angel required',
    unsynergizedBase: 1040,
    synergizedBase: 1768,
    unsynergizedCooldown: 6,
    synergizedCooldown: 7,
    unsynergizedScaling: 1.36,
    synergizedScaling: 1.54,
  }),
  buildCherubim({
    definitionId: 'ga-et-perfect-refraction',
    name: 'Perfect Refraction',
    description: 'On play: Look at the top 7 cards, take 3 cards, put 1 card on the bottom, and discard the rest; Salvage any 1 card. While on board: Seraphim bonuses are amplified by +0.1; Buffs Seraphim attacks: base +78, chain scaling +0.08, cooldown -1, multiplier x1.00; Buffs Angel attacks: base +61, chain scaling +0.05, cooldown -1, multiplier x1.00',
    rarity: 'Eternal',
    artKey: 'ga_et_perfect_refraction',
    effects: [{ type: 'cherubim_seraphim_amp', value: 0.10 }],
    onPlayEffects: [{ type: 'look_top_take_drop', look: 7, take: 3, drop: 1 }, { type: 'salvage_any' }],
  }),

  buildSeraphim({
    definitionId: 'ga-inf-glass-absolute',
    name: 'Glass Absolute Seraph',
    description: 'On play: Draw 4 cards; Set chain multiplier to x4.0; Gain 30 of your dominant resource. While on board: +140 Oblivion per card played while active',
    rarity: 'Infinite',
    artKey: 'ga_inf_glass_absolute',
    bonusType: 'oblivion_per_card',
    bonusValue: 140,
    onPlayEffects: [{ type: 'draw', value: 4 }, { type: 'chain_multiplier_set', value: 4.0 }, { type: 'dominant_stack_gain', value: 30 }],
    unsynergizedName: 'Glass Absolute Vector Break',
    synergizedName: 'Glass Absolute Angelic Verdict',
    unsynergizedDescription: '1880 base Oblivion, 5 cards cooldown, x1.25 chain scaling, Cost: discard 1 card',
    synergizedDescription: '3290 base Oblivion, 8 cards cooldown, x1.55 chain scaling, Angel required',
    unsynergizedBase: 1880,
    synergizedBase: 3196,
    unsynergizedCooldown: 6,
    synergizedCooldown: 7,
    unsynergizedScaling: 1.56,
    synergizedScaling: 1.74,
  }),
  buildCherubim({
    definitionId: 'ga-inf-refracted-sovereign',
    name: 'Refracted Sovereign',
    description: 'On play: +1100 Oblivion; Draw 4 cards; Set chain floor to x5.0. While on board: Adjacent active Seraphim gain +0.16 chain growth; Buffs Seraphim and Angel attacks: base +70, chain scaling +0.02, cooldown -1, multiplier x1.00; Buffs Angel attacks: base +55, chain scaling +0.01, cooldown -1, multiplier x1.00',
    rarity: 'Infinite',
    artKey: 'ga_inf_refracted_sovereign',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'chain', value: 0.16 }],
    onPlayEffects: [{ type: 'oblivion_flat', value: 1100 }, { type: 'draw', value: 4 }, { type: 'set_chain_floor', value: 5.0 }],
  }),
  buildOphanim({
    definitionId: 'ga-inf-yreth-prism-at-center',
    name: 'Yreth, Prism at Center',
    description: 'Draw 5 cards; Set chain multiplier to x5.0; Gain 42 of your dominant resource',
    rarity: 'Infinite',
    artKey: 'ga_inf_yreth_prism_at_center',
    effects: [{ type: 'draw', value: 5 }, { type: 'chain_multiplier_set', value: 5.0 }, { type: 'dominant_stack_gain', value: 42 }],
  }),
  buildSeraphim({
    definitionId: 'ga-inf-chorus-unbroken-spectrum',
    name: 'Chorus of the Unbroken Spectrum',
    description: 'On play: Draw 3 cards; Gain 42 of your dominant resource; Empower the next card you play. While on board: +180 Oblivion per card played while active',
    rarity: 'Infinite',
    artKey: 'ga_inf_chorus_unbroken_spectrum',
    bonusType: 'oblivion_per_card',
    bonusValue: 180,
    onPlayEffects: [{ type: 'draw', value: 3 }, { type: 'dominant_stack_gain', value: 42 }, { type: 'multiply_next' }],
    unsynergizedName: 'Unbroken Spectrum Vector Break',
    synergizedName: 'Unbroken Spectrum Angelic Verdict',
    unsynergizedDescription: '2460 base Oblivion, 5 cards cooldown, x1.25 chain scaling, Cost: discard 1 card',
    synergizedDescription: '4305 base Oblivion, 8 cards cooldown, x1.55 chain scaling, Angel required',
    unsynergizedBase: 2460,
    synergizedBase: 4182,
    unsynergizedCooldown: 7,
    synergizedCooldown: 8,
    unsynergizedScaling: 1.62,
    synergizedScaling: 1.82,
  }),
  buildCherubim({
    definitionId: 'ga-inf-shattered-without-shattering',
    name: 'Shattered Without Shattering',
    description: 'On play: Salvage any 1 card; Draw 4 cards; Gain 36 of your dominant resource. While on board: Seraphim bonuses are amplified by +0.18; Buffs Angel attacks: base +76, chain scaling +0.13, cooldown -1, multiplier x1.00; Buffs Angel attacks: base +59, chain scaling +0.09, cooldown -1, multiplier x1.00',
    rarity: 'Infinite',
    artKey: 'ga_inf_shattered_without_shattering',
    effects: [{ type: 'cherubim_seraphim_amp', value: 0.18 }],
    onPlayEffects: [{ type: 'salvage_any' }, { type: 'draw', value: 4 }, { type: 'dominant_stack_gain', value: 36 }],
  }),
  buildOphanim({
    definitionId: 'ga-inf-color-after-white',
    name: 'Color After White',
    description: 'Draw 6 cards; Set chain floor to x6.0; Gain 60 Radiance',
    rarity: 'Infinite',
    artKey: 'ga_inf_color_after_white',
    effects: [{ type: 'draw', value: 6 }, { type: 'set_chain_floor', value: 6.0 }, { type: 'radiance_gain', value: 60 }],
  }),
];

export const glassAbsolutePackPool = glassAbsoluteCards.map(card => card.definitionId);