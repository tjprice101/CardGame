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
  synergizedCooldown: number;}

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
    description: 'On play: +140 Oblivion. While on board: +12 Oblivion per card played while active',
    rarity: 'Common',
    artKey: 'ga_ser_prismwake',
    bonusType: 'oblivion_per_card',
    bonusValue: 12,
    onPlayEffects: [{ type: 'oblivion_flat', value: 140 }],
    unsynergizedName: 'Prismwake Vector Break',
    synergizedName: 'Prismwake Angelic Verdict',
    unsynergizedDescription: '240 base Oblivion · 5 cards cooldown · Cost: discard 1 card',
    synergizedDescription: '420 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 240,
    synergizedBase: 408,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'ga-ser-lattice-canticle',
    name: 'Lattice Canticle Seraph',
    description: 'On play: Draw 1 card. While on board: +18 Oblivion per card played while active',
    rarity: 'Rare',
    artKey: 'ga_ser_lattice_canticle',
    bonusType: 'oblivion_per_card',
    bonusValue: 18,
    onPlayEffects: [{ type: 'draw', value: 1 }],
    unsynergizedName: 'Lattice Canticle Vector Break',
    synergizedName: 'Lattice Canticle Angelic Verdict',
    unsynergizedDescription: '312 base Oblivion · 5 cards cooldown · Cost: discard 1 card',
    synergizedDescription: '546 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 312,
    synergizedBase: 530,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'ga-ser-white-edge',
    name: 'White Edge Herald',
    description: 'On play: +180 Oblivion. While on board: +14 Oblivion per card played while active',
    rarity: 'Rare',
    artKey: 'ga_ser_white_edge',
    bonusType: 'oblivion_per_card',
    bonusValue: 14,
    onPlayEffects: [{ type: 'oblivion_flat', value: 180 }],
    unsynergizedName: 'White Edge Vector Break',
    synergizedName: 'White Edge Angelic Verdict',
    unsynergizedDescription: '366 base Oblivion · 5 cards cooldown · Cost: discard 1 card',
    synergizedDescription: '641 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 366,
    synergizedBase: 612,
    unsynergizedCooldown: 5,
    synergizedCooldown: 6,
  }),
  buildSeraphim({
    definitionId: 'ga-ser-glass-hymn',
    name: 'Glass Hymn Sentinel',
    description: 'On play: +260 Oblivion. While on board: +30 Oblivion per card played while active',
    rarity: 'Epic',
    artKey: 'ga_ser_glass_hymn',
    bonusType: 'oblivion_per_card',
    bonusValue: 30,
    onPlayEffects: [{ type: 'oblivion_flat', value: 260 }],
    unsynergizedName: 'Glass Hymn Vector Break',
    synergizedName: 'Glass Hymn Angelic Verdict',
    unsynergizedDescription: '460 base Oblivion · 5 cards cooldown · Cost: discard 1 card',
    synergizedDescription: '805 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 460,
    synergizedBase: 782,
    unsynergizedCooldown: 5,
    synergizedCooldown: 6,
  }),
  buildSeraphim({
    definitionId: 'ga-ser-yrethborn',
    name: 'Yrethborn Ascendant',
    description: 'On play: Draw 2 cards. While on board: +22 Oblivion per card played while active',
    rarity: 'Legendary',
    artKey: 'ga_ser_yrethborn',
    bonusType: 'oblivion_per_card',
    bonusValue: 22,
    onPlayEffects: [{ type: 'draw', value: 2 }],
    unsynergizedName: 'Yrethborn Vector Break',
    synergizedName: 'Yrethborn Angelic Verdict',
    unsynergizedDescription: '690 base Oblivion · 5 cards cooldown · Cost: discard 1 card',
    synergizedDescription: '1208 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 690,
    synergizedBase: 1166,
    unsynergizedCooldown: 6,
    synergizedCooldown: 7,
  }),

  buildCherubim({
    definitionId: 'ga-cher-mirrorbody-archivist',
    name: 'Mirrorbody Archivist',
    description: 'On play: Gain 1 Refraction Charge; Draw 1 card. While on board: Adjacent active Seraphim gain +28 Oblivion per card played',
    rarity: 'Common',
    artKey: 'ga_cher_mirrorbody_archivist',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 28 }],
    onPlayEffects: [{ type: 'set_secondary_gain', kind: 'absol', value: 1 }, { type: 'draw', value: 1 }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-facet-gate-ward',
    name: 'Facet Gate Ward',
    description: 'While on board: Buffs Seraphim attacks: base +42',
    rarity: 'Rare',
    artKey: 'ga_cher_facet_gate_ward',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Seraphim', bonusBaseOblivion: 42 }],
    onPlayEffects: [],
  }),
  buildCherubim({
    definitionId: 'ga-cher-prismatic-reliquary',
    name: 'Prismatic Reliquary',
    description: 'On play: Gain 2 Refraction Charges; +160 Oblivion. While on board: Adjacent active Seraphim gain +38 Oblivion per card played',
    rarity: 'Rare',
    artKey: 'ga_cher_prismatic_reliquary',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 38 }],
    onPlayEffects: [{ type: 'set_secondary_gain', kind: 'absol', value: 2 }, { type: 'oblivion_flat', value: 160 }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-shard-choir-keeper',
    name: 'Shard Choir Keeper',
    description: 'On play: Gain 2 Refraction Charges; Shuffle discard into deck. While on board: Each adjacent active Seraphim adds 1 extra card whenever you play a card',
    rarity: 'Epic',
    artKey: 'ga_cher_shard_choir_keeper',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'draw', value: 1 }],
    onPlayEffects: [{ type: 'set_secondary_gain', kind: 'absol', value: 2 }, { type: 'shuffle_discard' }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-refraction-bastion',
    name: 'Refraction Bastion',
    description: 'On play: Gain 2 Refraction Charges; +260 Oblivion. While on board: Seraphim bonuses are amplified by +9%',
    rarity: 'Epic',
    artKey: 'ga_cher_refraction_bastion',
    effects: [{ type: 'cherubim_seraphim_amp', value: 0.09 }],
    onPlayEffects: [{ type: 'set_secondary_gain', kind: 'absol', value: 2 }, { type: 'oblivion_flat', value: 260 }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-glass-mantle-custodian',
    name: 'Glass Mantle Custodian',
    description: 'On play: Gain 3 Refraction Charges; Salvage any 1 card. While on board: Adjacent active Seraphim gain +46 Oblivion per card played',
    rarity: 'Legendary',
    artKey: 'ga_cher_glass_mantle_custodian',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 46 }],
    onPlayEffects: [{ type: 'set_secondary_gain', kind: 'absol', value: 3 }, { type: 'salvage_any' }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-splitlight-cantor',
    name: 'Splitlight Cantor',
    description: 'On play: Gain 22 Radiance; Gain 2 Refraction Charges. While on board: Gain 12 Radiance per card played',
    rarity: 'Rare',
    artKey: 'ga_cher_splitlight_cantor',
    effects: [{ type: 'cherubim_resource_per_card', resource: 'radiance', value: 12 }],
    onPlayEffects: [{ type: 'set_secondary_gain', kind: 'absol', value: 2 }, { type: 'radiance_gain', value: 22 }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-light-archive',
    name: 'Light Archive of Glass',
    description: 'On play: Look at the top 5 cards, take 2 cards, and put the rest on the bottom. While on board: Buffs Seraphim and Angel attacks: base +59',
    rarity: 'Legendary',
    artKey: 'ga_cher_light_archive',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 59 }],
    onPlayEffects: [{ type: 'look_top_take', look: 5, take: 2 }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-shardward-savant',
    name: 'Shardward Savant',
    description: 'On play: Gain 1 Refraction Charge; +220 Oblivion. While on board: Adjacent active Seraphim gain +20 Oblivion per card played',
    rarity: 'Common',
    artKey: 'ga_cher_shardward_savant',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 20 }],
    onPlayEffects: [{ type: 'set_secondary_gain', kind: 'absol', value: 1 }, { type: 'oblivion_flat', value: 220 }],
  }),

  buildOphanim({
    definitionId: 'ga-oph-spectral-current',
    name: 'Spectral Current',
    description: 'Draw 1 card',
    rarity: 'Common',
    artKey: 'ga_oph_spectral_current',
    effects: [{ type: 'draw', value: 1 }],
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
    description: 'Salvage any 1 card; Draw 1 card',
    rarity: 'Rare',
    artKey: 'ga_oph_glassroad_oracle',
    effects: [{ type: 'salvage_any' }, { type: 'draw', value: 1 }],
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
    description: 'Draw 3 cards',
    rarity: 'Epic',
    artKey: 'ga_oph_lumen_cascade',
    effects: [{ type: 'draw', value: 3 }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-crystal-echo-archive',
    name: 'Crystal Echo Archive',
    description: 'Shuffle discard into deck; Draw 2 cards',
    rarity: 'Epic',
    artKey: 'ga_oph_crystal_echo_archive',
    effects: [{ type: 'shuffle_discard' }, { type: 'draw', value: 2 }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-white-transit',
    name: 'White Transit',
    description: 'Gain 24 Radiance; Gain 2 Refraction Charges; Draw 4 cards',
    rarity: 'Legendary',
    artKey: 'ga_oph_white_transit',
    effects: [{ type: 'set_secondary_gain', kind: 'absol', value: 2 }, { type: 'draw', value: 4 }, { type: 'radiance_gain', value: 24 }],
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
    description: 'Draw 2 cards',
    rarity: 'Epic',
    artKey: 'ga_oph_lattice_horizon',
    effects: [{ type: 'draw', value: 2 }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-spectral-afterimage',
    name: 'Spectral Afterimage',
    description: 'Gain 2 Refraction Charges; Replay last Ophanim played this turn; Draw 1 card',
    rarity: 'Legendary',
    artKey: 'ga_oph_spectral_afterimage',
    effects: [{ type: 'set_secondary_gain', kind: 'absol', value: 2 }, { type: 'copy_last_hr' }, { type: 'draw', value: 1 }],
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
    description: 'On play: Gain 3 Refraction Charges; Salvage any 1 card; If you have 5+ Refraction Charges, none. While on board: +84 Oblivion per card played while active',
    rarity: 'Eternal',
    artKey: 'ga_et_lattice_archive_seraph',
    bonusType: 'oblivion_per_card',
    bonusValue: 84,
    // Role: PRIMARY REFRACTION BATTERY.
    onPlayEffects: [
      { type: 'set_secondary_gain', kind: 'absol', value: 3 },
      { type: 'salvage_any' },
      {
        type: 'conditional',
        condition: { type: 'set_secondary_gte', kind: 'absol', value: 5 },
        then: [],
      }],
    unsynergizedName: 'Lattice Archive Vector Break',
    synergizedName: 'Lattice Archive Angelic Verdict',
    unsynergizedDescription: '1360 base Oblivion · 6 cards cooldown',
    synergizedDescription: '2420 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 1360,
    synergizedBase: 2420,
    unsynergizedCooldown: 6,
    synergizedCooldown: 8,
  }),
  buildCherubim({
    definitionId: 'ga-et-angled-infinity',
    name: 'Angled Infinity',
    description: 'On play: Gain 1 Refraction Charge; If this is the first card you played this turn, Gain 2 Refraction Charges; Spend 2 Refraction Charges; +180 Oblivion; If you have 4+ Refraction Charges, Spend 2 Refraction Charges. While on board: Adjacent active Seraphim gain +44 Oblivion per card played; Buffs Seraphim attacks: base +80, cooldown -1, when you have 4+ Refraction Charges',
    rarity: 'Eternal',
    artKey: 'ga_et_angled_infinity',
    effects: [
      { type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 44 },
      {
        type: 'cherubim_attack_buff',
        targetUnitType: 'Seraphim',
        bonusBaseOblivion: 80,
        cooldownDeltaCards: -1,
        condition: { type: 'set_secondary_gte', kind: 'absol', value: 4 },
      }],
    // Role: EARLY-TEMPO CONVERTER.
    onPlayEffects: [
      { type: 'set_secondary_gain', kind: 'absol', value: 1 },
      {
        type: 'conditional',
        condition: { type: 'first_card_this_turn' },
        then: [
          { type: 'set_secondary_gain', kind: 'absol', value: 2 },
          { type: 'set_secondary_spend', kind: 'absol', value: 2 },
          { type: 'oblivion_flat', value: 180 },
        ],
      },
      {
        type: 'conditional',
        condition: { type: 'set_secondary_gte', kind: 'absol', value: 4 },
        then: [{ type: 'set_secondary_spend', kind: 'absol', value: 2 }],
      }],
  }),
  buildOphanim({
    definitionId: 'ga-et-first-white',
    name: 'First White',
    description: 'Gain 2 Refraction Charges; If you have played 1+ cards this turn, Draw 1 card; If played after non matching element, Gain 2 Refraction Charges; +80 Oblivion; If you have 6+ Refraction Charges, Spend 3 Refraction Charges',
    rarity: 'Eternal',
    artKey: 'ga_et_first_white',
    // Role: CROSS-SET BRIDGE SEQUENCER.
    effects: [
      { type: 'set_secondary_gain', kind: 'absol', value: 2 },
      {
        type: 'conditional',
        condition: { type: 'cards_played_gte', value: 1 },
        then: [{ type: 'draw', value: 1 }],
      },
      {
        type: 'conditional',
        condition: { type: 'played_after_non_matching_element' },
        then: [
          { type: 'set_secondary_gain', kind: 'absol', value: 2 },
          { type: 'oblivion_flat', value: 80 },
        ],
      },
      {
        type: 'conditional',
        condition: { type: 'set_secondary_gte', kind: 'absol', value: 6 },
        then: [{ type: 'set_secondary_spend', kind: 'absol', value: 3 }],
      }],
  }),
  buildSeraphim({
    definitionId: 'ga-et-center-everywhere',
    name: 'The Center That Is Everywhere',
    description: 'On play: Gain 2 Refraction Charges; If you have 7+ Refraction Charges, Spend 4 Refraction Charges; +420 Oblivion. While on board: +140 Oblivion per card played while active',
    rarity: 'Eternal',
    artKey: 'ga_et_center_everywhere',
    bonusType: 'oblivion_per_card',
    bonusValue: 140,
    // Role: THRESHOLD FINISHER.
    onPlayEffects: [
      { type: 'set_secondary_gain', kind: 'absol', value: 2 },
      {
        type: 'conditional',
        condition: { type: 'set_secondary_gte', kind: 'absol', value: 7 },
        then: [{ type: 'set_secondary_spend', kind: 'absol', value: 4 }, { type: 'oblivion_flat', value: 420 }],
      }],
    unsynergizedName: 'Center Everywhere Vector Break',
    synergizedName: 'Center Everywhere Angelic Verdict',
    unsynergizedDescription: '1620 base Oblivion · 6 cards cooldown',
    synergizedDescription: '2860 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 1620,
    synergizedBase: 2860,
    unsynergizedCooldown: 6,
    synergizedCooldown: 8,
  }),
  buildCherubim({
    definitionId: 'ga-et-perfect-refraction',
    name: 'Perfect Refraction',
    description: 'On play: Gain 2 Refraction Charges; If you have 4+ Refraction Charges, Draw 1 card; If you have 6+ Refraction Charges, Spend 1 Refraction Charge. While on board: All Oblivion gain +42%',
    rarity: 'Eternal',
    artKey: 'ga_et_perfect_refraction',
    maxDurability: 8,
    effects: [
      { type: 'cherubim_global_oblivion_mult', value: 0.42 }],
    // Role: STABILIZER AND EFFICIENCY AMPLIFIER.
    onPlayEffects: [
      { type: 'set_secondary_gain', kind: 'absol', value: 2 },
      { type: 'conditional', condition: { type: 'set_secondary_gte', kind: 'absol', value: 4 }, then: [{ type: 'draw', value: 1 }] },
      { type: 'conditional', condition: { type: 'set_secondary_gte', kind: 'absol', value: 6 }, then: [{ type: 'set_secondary_spend', kind: 'absol', value: 1 }] }],
  }),

  buildSeraphim({
    definitionId: 'ga-inf-glass-absolute',
    name: 'Glass Absolute Seraph',
    description: 'On play: Gain 4 Refraction Charges; If you have 8+ Refraction Charges, Spend 4 Refraction Charges; +600 Oblivion. While on board: +250 Oblivion per card played while active',
    rarity: 'Infinite',
    artKey: 'ga_inf_glass_absolute',
    bonusType: 'oblivion_per_card',
    bonusValue: 250,
    // Role: APEX DOUBLE-EMPOWER FINISHER.
    onPlayEffects: [
      { type: 'set_secondary_gain', kind: 'absol', value: 4 },
      {
        type: 'conditional',
        condition: { type: 'set_secondary_gte', kind: 'absol', value: 8 },
        then: [
          { type: 'set_secondary_spend', kind: 'absol', value: 4 },
          { type: 'oblivion_flat', value: 600 },
        ],
      }],
    unsynergizedName: 'Glass Absolute Vector Break',
    synergizedName: 'Glass Absolute Angelic Verdict',
    unsynergizedDescription: '3280 base Oblivion · 7 cards cooldown',
    synergizedDescription: '5780 base Oblivion · 9 cards cooldown · Requires Angel',
    unsynergizedBase: 3280,
    synergizedBase: 5780,
    unsynergizedCooldown: 7,
    synergizedCooldown: 9,
  }),
  buildCherubim({
    definitionId: 'ga-inf-refracted-sovereign',
    name: 'Refracted Sovereign',
    description: 'On play: Gain 3 Refraction Charges; If you have 6+ Refraction Charges, Spend 2 Refraction Charges; +260 Oblivion; If you have 9+ Refraction Charges, Draw 1 card. While on board: Adjacent active Seraphim gain +88 Oblivion per card played; Buffs Seraphim attacks: base +130, cooldown -1; Buffs Angel attacks: base +180, cooldown -1, when you have 8+ Refraction Charges',
    rarity: 'Infinite',
    artKey: 'ga_inf_refracted_sovereign',
    effects: [
      { type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 88 },
      { type: 'cherubim_attack_buff', targetUnitType: 'Seraphim', bonusBaseOblivion: 130, cooldownDeltaCards: -1, multiplier: 1.0 },
      {
        type: 'cherubim_attack_buff',
        targetUnitType: 'Angel',
        bonusBaseOblivion: 180,
        cooldownDeltaCards: -1,
        condition: { type: 'set_secondary_gte', kind: 'absol', value: 8 },
      }],
    // Role: SOVEREIGN CONDUIT AND ATTACK ENABLER.
    onPlayEffects: [
      { type: 'set_secondary_gain', kind: 'absol', value: 3 },
      { type: 'conditional', condition: { type: 'set_secondary_gte', kind: 'absol', value: 6 }, then: [{ type: 'set_secondary_spend', kind: 'absol', value: 2 }, { type: 'oblivion_flat', value: 260 }] },
      { type: 'conditional', condition: { type: 'set_secondary_gte', kind: 'absol', value: 9 }, then: [{ type: 'draw', value: 1 }] }],
  }),
  buildOphanim({
    definitionId: 'ga-inf-yreth-prism-at-center',
    name: 'Yreth, Prism at Center',
    description: 'Gain 3 Refraction Charges; If this is the first card you played this turn, Gain 2 Refraction Charges; If played after non matching element, Gain 2 Refraction Charges; +160 Oblivion; If you have 10+ Refraction Charges, Spend 5 Refraction Charges; Draw 1 card',
    rarity: 'Infinite',
    artKey: 'ga_inf_yreth_prism_at_center',
    // Role: CHARGE FLOOR ESCALATOR AND CROSS-SET BRIDGE.
    effects: [
      { type: 'set_secondary_gain', kind: 'absol', value: 3 },
      { type: 'conditional', condition: { type: 'first_card_this_turn' }, then: [{ type: 'set_secondary_gain', kind: 'absol', value: 2 }] },
      {
        type: 'conditional',
        condition: { type: 'played_after_non_matching_element' },
        then: [{ type: 'set_secondary_gain', kind: 'absol', value: 2 }, { type: 'oblivion_flat', value: 160 }],
      },
      { type: 'conditional', condition: { type: 'set_secondary_gte', kind: 'absol', value: 10 }, then: [{ type: 'set_secondary_spend', kind: 'absol', value: 5 }, { type: 'draw', value: 1 }] }],
  }),
  buildSeraphim({
    definitionId: 'ga-inf-chorus-unbroken-spectrum',
    name: 'Chorus of the Unbroken Spectrum',
    description: 'On play: Gain 2 Refraction Charges; If you have played 2+ cards this turn, Gain 3 Refraction Charges; Draw 1 card; If you have 10+ Refraction Charges, Spend 5 Refraction Charges; +520 Oblivion. While on board: +170 Oblivion per card played while active',
    rarity: 'Infinite',
    artKey: 'ga_inf_chorus_unbroken_spectrum',
    bonusType: 'oblivion_per_card',
    bonusValue: 170,
    // Role: CHAINED TURN-SPEED CONVERTER.
    onPlayEffects: [
      { type: 'set_secondary_gain', kind: 'absol', value: 2 },
      { type: 'conditional', condition: { type: 'cards_played_gte', value: 2 }, then: [{ type: 'set_secondary_gain', kind: 'absol', value: 3 }, { type: 'draw', value: 1 }] },
      { type: 'conditional', condition: { type: 'set_secondary_gte', kind: 'absol', value: 10 }, then: [{ type: 'set_secondary_spend', kind: 'absol', value: 5 }, { type: 'oblivion_flat', value: 520 }] }],
    unsynergizedName: 'Unbroken Spectrum Vector Break',
    synergizedName: 'Unbroken Spectrum Angelic Verdict',
    unsynergizedDescription: '2860 base Oblivion · 7 cards cooldown',
    synergizedDescription: '4960 base Oblivion · 9 cards cooldown · Requires Angel',
    unsynergizedBase: 2860,
    synergizedBase: 4960,
    unsynergizedCooldown: 7,
    synergizedCooldown: 9,
  }),
  buildCherubim({
    definitionId: 'ga-inf-shattered-without-shattering',
    name: 'Shattered Without Shattering',
    description: 'On play: Gain 4 Refraction Charges; If you have 7+ Refraction Charges, Spend 3 Refraction Charges; +360 Oblivion; If you have 11+ Refraction Charges, Spend 4 Refraction Charges; Draw 2 cards. While on board: Seraphim bonuses are amplified by +24%; Adjacent active Seraphim gain +86 Oblivion per card played; Buffs Angel attacks: base +180, cooldown -1; Buffs Seraphim attacks: base +120, cooldown -1, when you have 7+ Refraction Charges',
    rarity: 'Infinite',
    artKey: 'ga_inf_shattered_without_shattering',
    effects: [
      { type: 'cherubim_seraphim_amp', value: 0.24 },
      { type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 86 },
      { type: 'cherubim_attack_buff', targetUnitType: 'Angel', bonusBaseOblivion: 180, cooldownDeltaCards: -1, multiplier: 1.0 },
      {
        type: 'cherubim_attack_buff',
        targetUnitType: 'Seraphim',
        bonusBaseOblivion: 120,
        cooldownDeltaCards: -1,
        condition: { type: 'set_secondary_gte', kind: 'absol', value: 7 },
      }],
    // Role: AGGRESSIVE MID-TURN HYBRID AMPLIFIER.
    onPlayEffects: [
      { type: 'set_secondary_gain', kind: 'absol', value: 4 },
      { type: 'conditional', condition: { type: 'set_secondary_gte', kind: 'absol', value: 7 }, then: [{ type: 'set_secondary_spend', kind: 'absol', value: 3 }, { type: 'oblivion_flat', value: 360 }] },
      { type: 'conditional', condition: { type: 'set_secondary_gte', kind: 'absol', value: 11 }, then: [{ type: 'set_secondary_spend', kind: 'absol', value: 4 }, { type: 'draw', value: 2 }] }],
  }),
  buildOphanim({
    definitionId: 'ga-inf-color-after-white',
    name: 'Color After White',
    description: 'Gain 5 Refraction Charges; Spend 2 Refraction Charges; If you have 9+ Refraction Charges, Spend 5 Refraction Charges; +700 Oblivion',
    rarity: 'Infinite',
    artKey: 'ga_inf_color_after_white',
    // Role: END-TURN LEDGER OVERDRIVE FINISHER.
    effects: [
      { type: 'set_secondary_gain', kind: 'absol', value: 5 },
      { type: 'set_secondary_spend', kind: 'absol', value: 2 },
      {
        type: 'conditional',
        condition: { type: 'set_secondary_gte', kind: 'absol', value: 9 },
        then: [
          { type: 'set_secondary_spend', kind: 'absol', value: 5 },
          { type: 'oblivion_flat', value: 700 },
        ],
      }],
  })];

export const glassAbsolutePackPool = glassAbsoluteCards.map(card => card.definitionId);
