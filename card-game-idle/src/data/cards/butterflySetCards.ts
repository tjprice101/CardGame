import type { AngelDefinition, CardDefinition, CherubimDefinition, OphanimDefinition, SeraphimDefinition } from '@/types/cards';

const BUTTERFLY = 'Butterfly' as const;

type SeraphSpec = {
  definitionId: string;
  name: string;
  description: string;
  rarity: SeraphimDefinition['rarity'];
  artKey: string;
  bonusType: SeraphimDefinition['baseStats']['bonusType'];
  bonusValue: number;
  onPlayEffects: SeraphimDefinition['onPlayEffects'];
  unsynergizedName: string;
  synergizedName: string;
  unsynergizedBase: number;
  synergizedBase: number;
  unsynergizedCooldown: number;
  synergizedCooldown: number;};

type CherubSpec = {
  definitionId: string;
  name: string;
  description: string;
  rarity: CherubimDefinition['rarity'];
  artKey: string;
  maxDurability?: number;
  effects: CherubimDefinition['effects'];
  onPlayEffects: CherubimDefinition['onPlayEffects'];
};

type OphanimSpec = {
  definitionId: string;
  name: string;
  description: string;
  rarity: OphanimDefinition['rarity'];
  artKey: string;
  effects: OphanimDefinition['effects'];
};

type AngelSpec = {
  definitionId: string;
  name: string;
  description: string;
  rarity: AngelDefinition['rarity'];
  artKey: string;
  summonCost: string[];
  onSummonEffects: AngelDefinition['onSummonEffects'];
  activatedAbility: AngelDefinition['activatedAbility'];
  primaryName: string;
  exaltedName: string;
  primaryBase: number;
  exaltedBase: number;
  primaryCooldown: number;
  exaltedCooldown: number;
  primaryScaling: number;
  exaltedScaling: number;
  baseStats: AngelDefinition['baseStats'];
};

function buildSeraphim(spec: SeraphSpec): SeraphimDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Seraphim',
    element: BUTTERFLY,
    rarity: spec.rarity,
    name: spec.name,
    description: spec.description,
    artKey: spec.artKey,
    baseStats: {
      bonusType: spec.bonusType,
      bonusValue: spec.bonusValue,
      synergyRequirement: BUTTERFLY,
    },
    onPlayEffects: spec.onPlayEffects,
    attacks: {
      unsynergized: {
        id: `${spec.definitionId}:unsyn`,
        label: 'Unsynergized',
        name: spec.unsynergizedName,
        description: 'Butterfly assault fueled by tuned spectrum.',
        baseOblivion: spec.unsynergizedBase,
        cooldownCards: spec.unsynergizedCooldown,
        costs: [],
      },
      synergized: {
        id: `${spec.definitionId}:syn`,
        label: 'Synergized',
        name: spec.synergizedName,
        description: 'Flutter-concord strike with angelic convergence.',
        baseOblivion: spec.synergizedBase,
        cooldownCards: spec.synergizedCooldown,
        costs: [],
        requiresAngelOnBoard: true,
      },
    },
  };
}

function buildCherubim(spec: CherubSpec): CherubimDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Cherubim',
    element: BUTTERFLY,
    rarity: spec.rarity,
    name: spec.name,
    description: spec.description,
    artKey: spec.artKey,
    ...(spec.maxDurability !== undefined ? { maxDurability: spec.maxDurability } : {}),
    effects: spec.effects,
    onPlayEffects: spec.onPlayEffects,
  };
}

function buildOphanim(spec: OphanimSpec): OphanimDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Ophanim',
    element: BUTTERFLY,
    rarity: spec.rarity,
    name: spec.name,
    description: spec.description,
    artKey: spec.artKey,
    effects: spec.effects,
  };
}

function buildAngel(spec: AngelSpec): AngelDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Angel',
    element: BUTTERFLY,
    rarity: spec.rarity,
    name: spec.name,
    description: spec.description,
    artKey: spec.artKey,
    summonCost: spec.summonCost,
    onSummonEffects: spec.onSummonEffects,
    activatedAbility: spec.activatedAbility,
    attacks: {
      primary: {
        id: `${spec.definitionId}:primary`,
        label: 'Primary',
        name: spec.primaryName,
        description: 'Wingline rupture.',
        baseOblivion: spec.primaryBase,
        cooldownCards: spec.primaryCooldown,
        costs: [],
      },
      exalted: {
        id: `${spec.definitionId}:exalted`,
        label: 'Exalted',
        name: spec.exaltedName,
        description: 'Flutter apex strike.',
        baseOblivion: spec.exaltedBase,
        cooldownCards: spec.exaltedCooldown,
        costs: [],
      },
    },
    baseStats: spec.baseStats,
  };
}

const baseSeraphim: SeraphimDefinition[] = [
  buildSeraphim({
    definitionId: 'bf-ser-unfurling-cantor',
    name: 'Unfurling Cantor',
    description: 'On play: Gain 2 Spectrum; Tune stance to Reflect; Draw 1 card. While on board: +8 Oblivion per card played while active',
    rarity: 'Common',
    artKey: 'bf_ser_unfurling_cantor',
    bonusType: 'oblivion_per_card',
    bonusValue: 8,
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 4 }, { type: 'butterfly_tune', stance: 'Reflect' }],
    unsynergizedName: 'Cantor Slice',
    synergizedName: 'Cantor Flutter',
    unsynergizedBase: 236,
    synergizedBase: 408,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'bf-ser-ferrathi-iron-hum',
    name: 'Ferrathi Iron Hum',
    description: 'On play: Gain 2 Spectrum; Tune stance to Absorb; +90 Oblivion. While on board: +14 Oblivion per card played while active',
    rarity: 'Common',
    artKey: 'bf_ser_ferrathi_iron_hum',
    bonusType: 'oblivion_per_card',
    bonusValue: 14,
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 2 }, { type: 'butterfly_tune', stance: 'Absorb' }, { type: 'oblivion_flat', value: 90 }],
    unsynergizedName: 'Iron Resonance',
    synergizedName: 'Seven-Layer Resonance',
    unsynergizedBase: 244,
    synergizedBase: 420,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'bf-ser-vethkai-clear-arc',
    name: 'Vethkai Clear Arc',
    description: 'On play: Gain 3 Spectrum; Tune stance to Reflect; Look at the top 4 cards, take 1 card, and put the rest on the bottom. While on board: +22 Oblivion whenever you play an Ophanim while active',
    rarity: 'Rare',
    artKey: 'bf_ser_vethkai_clear_arc',
    bonusType: 'ophanim_bonus',
    bonusValue: 22,
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 3 }, { type: 'butterfly_tune', stance: 'Reflect' }, { type: 'look_top_take', look: 4, take: 1 }],
    unsynergizedName: 'Prism Arc',
    synergizedName: 'Prism Chorus Arc',
    unsynergizedBase: 314,
    synergizedBase: 552,
    unsynergizedCooldown: 4,
    synergizedCooldown: 6,
  }),
  buildSeraphim({
    definitionId: 'bf-ser-pyrethkai-whiteflame',
    name: 'Pyrethkai Whiteflame',
    description: 'On play: Gain 3 Spectrum; Tune stance to Absorb; Gain 5 Embers. While on board: Gain 3 Embers per card played while active',
    rarity: 'Rare',
    artKey: 'bf_ser_pyrethkai_whiteflame',
    bonusType: 'ember_per_card',
    bonusValue: 3,
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 3 }, { type: 'butterfly_tune', stance: 'Absorb' }, { type: 'ember_gain', value: 5 }],
    unsynergizedName: 'White Combustion',
    synergizedName: 'Equilibrium Burn',
    unsynergizedBase: 322,
    synergizedBase: 568,
    unsynergizedCooldown: 4,
    synergizedCooldown: 6,
  }),
  buildSeraphim({
    definitionId: 'bf-ser-nullwing-stillness',
    name: 'Nullwing Stillness',
    description: 'On play: Gain 4 Spectrum; Tune stance to Absorb; Vent 2 Strain. While on board: Resource generation +6 while active',
    rarity: 'Epic',
    artKey: 'bf_ser_nullwing_stillness',
    bonusType: 'resource_generation',
    bonusValue: 6,
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 4 }, { type: 'butterfly_tune', stance: 'Absorb' }, { type: 'strain_vent', value: 2 }],
    unsynergizedName: 'Interstice Quietus',
    synergizedName: 'Flutter Silence',
    unsynergizedBase: 456,
    synergizedBase: 806,
    unsynergizedCooldown: 5,
    synergizedCooldown: 7,
  }),
  buildSeraphim({
    definitionId: 'bf-ser-volthari-stormscript',
    name: 'Volthari Stormscript',
    description: 'On play: Gain 4 Spectrum; Tune stance to Reflect. While on board: +20 Oblivion whenever you play an Ophanim while active',
    rarity: 'Epic',
    artKey: 'bf_ser_volthari_stormscript',
    bonusType: 'ophanim_bonus',
    bonusValue: 20,
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 4 }, { type: 'butterfly_tune', stance: 'Reflect' }],
    unsynergizedName: 'Stormline Etch',
    synergizedName: 'Lightning Flutter Glyph',
    unsynergizedBase: 470,
    synergizedBase: 824,
    unsynergizedCooldown: 5,
    synergizedCooldown: 7,
  }),
  buildSeraphim({
    definitionId: 'bf-ser-ossiveth-shadowspan',
    name: 'Ossiveth Shadowspan',
    description: 'On play: Gain 5 Spectrum; Release up to 3 Spectrum (+120 Oblivion per spectrum). While on board: +28 Oblivion per card played while active',
    rarity: 'Legendary',
    artKey: 'bf_ser_ossiveth_shadowspan',
    bonusType: 'oblivion_per_card',
    bonusValue: 28,
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 5 }, { type: 'butterfly_release', spend: 3, oblivionPerSpectrum: 120 }],
    unsynergizedName: 'Geologic Wingbeat',
    synergizedName: 'Milespan Cataclysm',
    unsynergizedBase: 672,
    synergizedBase: 1178,
    unsynergizedCooldown: 6,
    synergizedCooldown: 8,
  }),
  buildSeraphim({
    definitionId: 'bf-ser-mireth-lenshost',
    name: 'Mireth Lenshost',
    description: 'On play: Gain 5 Spectrum; Draw 2 cards; Tune stance to Reflect. While on board: Each new Cherubim summoned while active gains +1 durability',
    rarity: 'Legendary',
    artKey: 'bf_ser_mireth_lenshost',
    bonusType: 'cherubim_extra_plays',
    bonusValue: 1,
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 9 }, { type: 'butterfly_tune', stance: 'Reflect' }],
    unsynergizedName: 'Prismatic Congregation',
    synergizedName: 'Lensstorm Descent',
    unsynergizedBase: 690,
    synergizedBase: 1204,
    unsynergizedCooldown: 6,
    synergizedCooldown: 8,
  })];

const baseCherubim: CherubimDefinition[] = [
  buildCherubim({
    definitionId: 'bf-cher-mireth-flutterlings',
    name: 'Mireth Flutterlings',
    description: 'On play: Gain 2 Spectrum; Draw 1 card. While on board: Each adjacent active Seraphim adds 1 extra card whenever you play a card; Buffs Seraphim and Angel attacks: base +24, cooldown +0, multiplier x1.00',
    rarity: 'Common',
    artKey: 'bf_cher_mireth_flutterlings',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'draw', value: 1 }],
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 4 }],
  }),
  buildCherubim({
    definitionId: 'bf-cher-copper-bank-spark',
    name: 'Copper Bank Spark',
    description: 'On play: Gain 2 Spectrum; Tune stance to Absorb. While on board: Gain 1 Ember per card played; Buffs Seraphim attacks: base +26, cooldown +0, multiplier x1.00',
    rarity: 'Common',
    artKey: 'bf_cher_copper_bank_spark',
    effects: [{ type: 'cherubim_resource_per_card', resource: 'ember', value: 1 }],
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 2 }, { type: 'butterfly_tune', stance: 'Absorb' }],
  }),
  buildCherubim({
    definitionId: 'bf-cher-prismedge-novice',
    name: 'Prismedge Novice',
    description: 'On play: Gain 3 Spectrum; Look at the top 4 cards, take 1 card, and put the rest on the bottom. While on board: Buffs Angel attacks: base +36, cooldown +0, multiplier x1.00',
    rarity: 'Rare',
    artKey: 'bf_cher_prismedge_novice',
    effects: [],
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 3 }, { type: 'look_top_take', look: 4, take: 1 }],
  }),
  buildCherubim({
    definitionId: 'bf-cher-echo-shed-lamina',
    name: 'Echo Shed Lamina',
    description: 'On play: Gain 3 Spectrum; +120 Oblivion. While on board: +8 Oblivion per card played; Buffs Seraphim attacks: base +8, cooldown +0, multiplier x1.00',
    rarity: 'Rare',
    artKey: 'bf_cher_echo_shed_lamina',
    effects: [{ type: 'cherubim_oblivion_per_card', value: 8 }],
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 3 }, { type: 'oblivion_flat', value: 120 }],
  }),
  buildCherubim({
    definitionId: 'bf-cher-nullwake-attendant',
    name: 'Nullwake Attendant',
    description: 'On play: Gain 4 Spectrum; Vent 2 Strain. While on board: Seraphim bonuses are amplified by +0.08; Buffs Seraphim attacks: base +54, cooldown -1, multiplier x1.00; Buffs Angel attacks: base +42, cooldown +0, multiplier x1.00',
    rarity: 'Epic',
    artKey: 'bf_cher_nullwake_attendant',
    effects: [{ type: 'cherubim_seraphim_amp', value: 0.08 }],
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 4 }, { type: 'strain_vent', value: 2 }],
  }),
  buildCherubim({
    definitionId: 'bf-cher-volthari-filament',
    name: 'Volthari Filament',
    description: 'On play: Gain 4 Spectrum. While on board: Buffs Seraphim and Angel attacks: base +42; Buffs Angel attacks: base +33',
    rarity: 'Epic',
    artKey: 'bf_cher_volthari_filament',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 42 }, { type: 'cherubim_attack_buff', targetUnitType: 'Angel', bonusBaseOblivion: 33 }],
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 4 }],
  }),
  buildCherubim({
    definitionId: 'bf-cher-stained-century-choir',
    name: 'Stained Century Choir',
    description: 'On play: Gain 5 Spectrum; Draw 2 cards. While on board: All Oblivion gain +55%',
    rarity: 'Legendary',
    artKey: 'bf_cher_stained_century_choir',
    maxDurability: 9,
    effects: [{ type: 'cherubim_global_oblivion_mult', value: 0.55 }],
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 9 }],
  }),
  buildCherubim({
    definitionId: 'bf-cher-flutter-vigil-sexton',
    name: 'Flutter Vigil Sexton',
    description: 'On play: Gain 5 Spectrum; Release up to 2 Spectrum (+85 Oblivion per spectrum). While on board: Draw 0.34 cards per card played; Buffs Seraphim and Angel attacks: base +52, cooldown +0, multiplier x1.00; Buffs Angel attacks: base +41, cooldown -1, multiplier x1.00',
    rarity: 'Legendary',
    artKey: 'bf_cher_flutter_vigil_sexton',
    effects: [{ type: 'cherubim_draw_per_card', value: 0.34 }],
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 5 }, { type: 'butterfly_release', spend: 2, oblivionPerSpectrum: 85 }],
  })];

const baseOphanim: OphanimDefinition[] = [
  buildOphanim({
    definitionId: 'bf-oph-ridge-trace',
    name: 'Ridge Trace',
    description: 'Gain 2 Spectrum; Draw 1 card',
    rarity: 'Common',
    artKey: 'bf_oph_ridge_trace',
    effects: [{ type: 'butterfly_spectrum_gain', value: 4 }],
  }),
  buildOphanim({
    definitionId: 'bf-oph-lens-current',
    name: 'Lens Current',
    description: 'Tune stance to Reflect; Gain 2 Spectrum; Look at the top 3 cards, take 1 card, and put the rest on the bottom',
    rarity: 'Common',
    artKey: 'bf_oph_lens_current',
    effects: [{ type: 'butterfly_tune', stance: 'Reflect' }, { type: 'butterfly_spectrum_gain', value: 2 }, { type: 'look_top_take', look: 3, take: 1 }],
  }),
  buildOphanim({
    definitionId: 'bf-oph-copper-green-trail',
    name: 'Copper-Green Trail',
    description: 'Tune stance to Absorb; Gain 3 Spectrum; Gain 4 Embers; Shuffle discard into deck; Draw 1 card',
    rarity: 'Rare',
    artKey: 'bf_oph_copper_green_trail',
    effects: [{ type: 'butterfly_tune', stance: 'Absorb' }, { type: 'butterfly_spectrum_gain', value: 5 }, { type: 'ember_gain', value: 4 }],
  }),
  buildOphanim({
    definitionId: 'bf-oph-crystal-ornament-route',
    name: 'Crystal Ornament Route',
    description: 'Gain 3 Spectrum; Draw 2 cards',
    rarity: 'Rare',
    artKey: 'bf_oph_crystal_ornament_route',
    effects: [{ type: 'butterfly_spectrum_gain', value: 7 }],
  }),
  buildOphanim({
    definitionId: 'bf-oph-suppression-wake',
    name: 'Suppression Wake',
    description: 'Tune stance to Absorb; Gain 4 Spectrum; +180 Oblivion; Shuffle discard into deck; Draw 1 card',
    rarity: 'Epic',
    artKey: 'bf_oph_suppression_wake',
    effects: [{ type: 'butterfly_tune', stance: 'Absorb' }, { type: 'butterfly_spectrum_gain', value: 6 }, { type: 'oblivion_flat', value: 180 }],
  }),
  buildOphanim({
    definitionId: 'bf-oph-electromagnetic-arrival',
    name: 'Electromagnetic Arrival',
    description: 'Gain 4 Spectrum; Draw 1 card',
    rarity: 'Epic',
    artKey: 'bf_oph_electromagnetic_arrival',
    effects: [{ type: 'butterfly_spectrum_gain', value: 6 }],
  }),
  buildOphanim({
    definitionId: 'bf-oph-midair-citadel',
    name: 'Midair Citadel',
    description: 'Gain 5 Spectrum; Release up to 2 Spectrum (+110 Oblivion per spectrum); Draw 2 cards',
    rarity: 'Legendary',
    artKey: 'bf_oph_midair_citadel',
    effects: [{ type: 'butterfly_spectrum_gain', value: 9 }, { type: 'butterfly_release', spend: 2, oblivionPerSpectrum: 110 }],
  }),
  buildOphanim({
    definitionId: 'bf-oph-velmargin-lensfall',
    name: 'Velmargin Lensfall',
    description: 'Tune stance to Reflect; Gain 5 Spectrum; Empower the next card you play; Draw 2 cards',
    rarity: 'Legendary',
    artKey: 'bf_oph_velmargin_lensfall',
    effects: [{ type: 'butterfly_tune', stance: 'Reflect' }, { type: 'butterfly_spectrum_gain', value: 5 }, { type: 'multiply_next' }],
  })];

const baseAngels: AngelDefinition[] = [
  buildAngel({
    definitionId: 'bf-angel-meadow-navigator',
    name: 'Meadow Navigator',
    description: 'On summon: Gain 4 Spectrum; Draw 1 card. After 2 cards played: Tune stance to Reflect; Gain 2 Spectrum. While on board: +40 Oblivion per card played while on board',
    rarity: 'Rare',
    artKey: 'bf_angel_meadow_navigator',
    summonCost: ['bf-ser-unfurling-cantor', 'bf-ser-ferrathi-iron-hum'],
    onSummonEffects: [{ type: 'butterfly_spectrum_gain', value: 6 }],
    activatedAbility: {
      name: 'Route the Wing',
      cardsPlayedRequirement: 2,
      description: 'Tune stance to Reflect; Gain 2 Spectrum',
      effects: [{ type: 'butterfly_tune', stance: 'Reflect' }, { type: 'butterfly_spectrum_gain', value: 2 }],
    },
    primaryName: 'Vector Wing',
    exaltedName: 'Guided Descent',
    primaryBase: 420,
    exaltedBase: 744,
    primaryCooldown: 4,
    exaltedCooldown: 6,
    primaryScaling: 1.24,
    exaltedScaling: 1.42,
    baseStats: { basePower: 58, bonusType: 'oblivion_per_card', bonusValue: 40 },
  }),
  buildAngel({
    definitionId: 'bf-angel-chrysalis-warden',
    name: 'Chrysalis Warden',
    description: 'On summon: Gain 4 Spectrum. After 2 cards played: Release up to 2 Spectrum (+120 Oblivion per spectrum). While on board: +24 Oblivion for each Seraphim on board while on board',
    rarity: 'Rare',
    artKey: 'bf_angel_chrysalis_warden',
    summonCost: ['bf-ser-vethkai-clear-arc', 'bf-ser-pyrethkai-whiteflame'],
    onSummonEffects: [{ type: 'butterfly_spectrum_gain', value: 4 }],
    activatedAbility: {
      name: 'Seal and Unseal',
      cardsPlayedRequirement: 2,
      description: 'Release up to 2 Spectrum (+120 Oblivion per spectrum)',
      effects: [{ type: 'butterfly_release', spend: 2, oblivionPerSpectrum: 120 }],
    },
    primaryName: 'Shellbreak Edict',
    exaltedName: 'Cathedral Unfurling',
    primaryBase: 438,
    exaltedBase: 770,
    primaryCooldown: 4,
    exaltedCooldown: 6,
    primaryScaling: 1.24,
    exaltedScaling: 1.43,
    baseStats: { basePower: 62, bonusType: 'oblivion_per_seraphim', bonusValue: 24 },
  }),
  buildAngel({
    definitionId: 'bf-angel-obsidian-surveyor',
    name: 'Obsidian Surveyor',
    description: 'On summon: Tune stance to Absorb; Gain 5 Spectrum; +180 Oblivion. After 3 cards played: Release up to 3 Spectrum (+95 Oblivion per spectrum). While on board: +20 Oblivion per card played while on board',
    rarity: 'Epic',
    artKey: 'bf_angel_obsidian_surveyor',
    summonCost: ['bf-ser-nullwing-stillness', 'bf-ser-volthari-stormscript'],
    onSummonEffects: [{ type: 'butterfly_tune', stance: 'Absorb' }, { type: 'butterfly_spectrum_gain', value: 5 }, { type: 'oblivion_flat', value: 180 }],
    activatedAbility: {
      name: 'Shadow Calibration',
      cardsPlayedRequirement: 3,
      description: 'Release up to 3 Spectrum (+95 Oblivion per spectrum)',
      effects: [{ type: 'butterfly_release', spend: 3, oblivionPerSpectrum: 95 }],
    },
    primaryName: 'Dark Survey',
    exaltedName: 'Absorbing Horizon',
    primaryBase: 522,
    exaltedBase: 918,
    primaryCooldown: 5,
    exaltedCooldown: 7,
    primaryScaling: 1.29,
    exaltedScaling: 1.46,
    baseStats: { basePower: 74, bonusType: 'oblivion_per_card', bonusValue: 20 },
  }),
  buildAngel({
    definitionId: 'bf-angel-flutter-cartographer',
    name: 'Flutter Cartographer',
    description: 'On summon: Gain 6 Spectrum; Draw 2 cards. After 3 cards played: Tune stance to Dual. While on board: +50 Oblivion per card played while on board',
    rarity: 'Epic',
    artKey: 'bf_angel_flutter_cartographer',
    summonCost: ['bf-ser-ossiveth-shadowspan', 'bf-ser-mireth-lenshost'],
    onSummonEffects: [{ type: 'butterfly_spectrum_gain', value: 10 }],
    activatedAbility: {
      name: 'Mark the Pulse',
      cardsPlayedRequirement: 3,
      description: 'Tune stance to Dual',
      effects: [{ type: 'butterfly_tune', stance: 'Dual' }],
    },
    primaryName: 'Pulse Meridian',
    exaltedName: 'Worldline Flutter',
    primaryBase: 538,
    exaltedBase: 940,
    primaryCooldown: 5,
    exaltedCooldown: 7,
    primaryScaling: 1.3,
    exaltedScaling: 1.47,
    baseStats: { basePower: 78, bonusType: 'oblivion_per_card', bonusValue: 50 },
  }),
  buildAngel({
    definitionId: 'bf-angel-wingpattern-archivist',
    name: 'Wingpattern Archivist',
    description: 'On summon: Gain 7 Spectrum; Look at the top 6 cards, take 2 cards, and put the rest on the bottom. After 4 cards played: Release up to 4 Spectrum (+125 Oblivion per spectrum); Draw 1 card. While on board: +35 Oblivion for each Seraphim on board while on board',
    rarity: 'Legendary',
    artKey: 'bf_angel_wingpattern_archivist',
    summonCost: ['bf-ser-ossiveth-shadowspan', 'bf-ser-volthari-stormscript'],
    onSummonEffects: [{ type: 'butterfly_spectrum_gain', value: 7 }, { type: 'look_top_take', look: 6, take: 2 }],
    activatedAbility: {
      name: 'Archive Release',
      cardsPlayedRequirement: 4,
      description: 'Release up to 4 Spectrum (+125 Oblivion per spectrum)',
      effects: [{ type: 'butterfly_release', spend: 4, oblivionPerSpectrum: 125 }],
    },
    primaryName: 'Catalog Slash',
    exaltedName: 'Generational Verdict',
    primaryBase: 690,
    exaltedBase: 1210,
    primaryCooldown: 6,
    exaltedCooldown: 8,
    primaryScaling: 1.33,
    exaltedScaling: 1.5,
    baseStats: { basePower: 92, bonusType: 'oblivion_per_seraphim', bonusValue: 35 },
  }),
  buildAngel({
    definitionId: 'bf-angel-generational-witness',
    name: 'Generational Witness',
    description: 'On summon: Gain 8 Spectrum; Tune stance to Dual. After 4 cards played: Release up to 6 Spectrum (+140 Oblivion per spectrum). While on board: +14 power for each Seraphim on board while on board',
    rarity: 'Legendary',
    artKey: 'bf_angel_generational_witness',
    summonCost: ['bf-ser-mireth-lenshost', 'bf-ser-nullwing-stillness'],
    onSummonEffects: [{ type: 'butterfly_spectrum_gain', value: 8 }, { type: 'butterfly_tune', stance: 'Dual' }],
    activatedAbility: {
      name: 'Witnessed Descent',
      cardsPlayedRequirement: 4,
      description: 'Release up to 6 Spectrum (+140 Oblivion per spectrum)',
      effects: [{ type: 'butterfly_release', spend: 6, oblivionPerSpectrum: 140 }],
    },
    primaryName: 'Marking Strike',
    exaltedName: 'Witnessed Cataclysm',
    primaryBase: 710,
    exaltedBase: 1248,
    primaryCooldown: 6,
    exaltedCooldown: 8,
    primaryScaling: 1.34,
    exaltedScaling: 1.52,
    baseStats: { basePower: 96, bonusType: 'power_per_seraphim', bonusValue: 14 },
  })];

const eternalCards: CardDefinition[] = [
  buildSeraphim({
    definitionId: 'bf-et-kethravoss-seven-layers',
    name: 'Kethravoss of the Seven Layers',
    description: 'On play: Gain 7 Spectrum; Tune stance to Absorb; Release up to 3 Spectrum (+155 Oblivion per spectrum); Gain 2 Wing Pulses. While on board: +42 Oblivion per card played while active',
    rarity: 'Eternal',
    artKey: 'bf_et_kethravoss_seven_layers',
    bonusType: 'oblivion_per_card',
    bonusValue: 42,
    // Role: PASSIVE WING-PULSE BATTERY (Seraphim Eternal). +2 flutter, no pulse
    //  Ehoards Wing Pulses for downstream finishers.
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 7 }, { type: 'butterfly_tune', stance: 'Absorb' }, { type: 'butterfly_release', spend: 3, oblivionPerSpectrum: 155 }, { type: 'set_secondary_gain', kind: 'flutter', value: 2 }],
    unsynergizedName: 'Layered Meridian',
    synergizedName: 'Seven-Layer Dominion',
    unsynergizedBase: 1040,
    synergizedBase: 1810,
    unsynergizedCooldown: 6,
    synergizedCooldown: 8,
  }),
  buildCherubim({
    definitionId: 'bf-et-mirrorglass-conclave',
    name: 'Mirrorglass Conclave',
    description: 'On play: Tune stance to Reflect; Gain 6 Spectrum; Draw 2 cards; Gain 3 Wing Pulses. While on board: Seraphim bonuses are amplified by +0.14; Buffs Angel attacks: base +66, cooldown -1, multiplier x1.00; Buffs Angel attacks: base +51, cooldown -1, multiplier x1.00',
    rarity: 'Eternal',
    artKey: 'bf_et_mirrorglass_conclave',
    effects: [{ type: 'cherubim_seraphim_amp', value: 0.14 }],
    // Role: BACK-ROW WING-PULSE BATTERY (Cherubim Eternal). +3 flutter, no pulse.
    onPlayEffects: [{ type: 'butterfly_tune', stance: 'Reflect' }, { type: 'butterfly_spectrum_gain', value: 10 }, { type: 'set_secondary_gain', kind: 'flutter', value: 3 }],
  }),
  buildOphanim({
    definitionId: 'bf-et-nullwing-interstice',
    name: 'Nullwing Interstice',
    description: 'Tune stance to Absorb; Gain 1 Wing Pulse; Amplify up to 1 Wing Pulses (double next 1 spectrum gain per pulse); Gain 6 Spectrum; Release up to 4 Spectrum (+130 Oblivion per spectrum); Gain 6 Prismatic Light; Draw 1 card',
    rarity: 'Eternal',
    artKey: 'bf_et_nullwing_interstice',
    // Role: SELF-DOUBLE OPHANIM (Eternal). +1 flutter then consumes 1 to double
    // the very next spectrum gain in the same play.
    effects: [{ type: 'butterfly_tune', stance: 'Absorb' }, { type: 'set_secondary_gain', kind: 'flutter', value: 1 }, { type: 'flutter_wing_pulse_amplify', doubleNextGains: 1, consume: 1 }, { type: 'butterfly_spectrum_gain', value: 6 }, { type: 'butterfly_release', spend: 4, oblivionPerSpectrum: 130 }],
  }),
  buildAngel({
    definitionId: 'bf-et-pyrethkai-equilibrium',
    name: 'Pyrethkai Equilibrium',
    description: 'On summon: Tune stance to Dual; Gain 7 Spectrum; Gain 10 Embers; Gain 2 Wing Pulses. After 3 cards played: Amplify all Wing Pulses (double next 2 spectrum gains per pulse); Release up to 5 Spectrum (+150 Oblivion per spectrum). While on board: +52 Oblivion for each Seraphim on board while on board',
    rarity: 'Eternal',
    artKey: 'bf_et_pyrethkai_equilibrium',
    summonCost: ['bf-ser-pyrethkai-whiteflame', 'bf-ser-vethkai-clear-arc'],
    onSummonEffects: [{ type: 'butterfly_tune', stance: 'Dual' }, { type: 'butterfly_spectrum_gain', value: 7 }, { type: 'ember_gain', value: 10 }, { type: 'set_secondary_gain', kind: 'flutter', value: 2 }],
    // Apex Eternal Angel: activated ability consumes all banked pulses for the
    // strongest single Eternal double-next coefficient.
    activatedAbility: {
      name: 'White Burn Equilibrium',
      cardsPlayedRequirement: 3,
      description: 'Amplify all Wing Pulses (double next 2 spectrum gains per pulse); Release up to 5 Spectrum (+150 Oblivion per spectrum)',
      effects: [{ type: 'flutter_wing_pulse_amplify', doubleNextGains: 2 }, { type: 'butterfly_release', spend: 5, oblivionPerSpectrum: 150 }],
    },
    primaryName: 'Equilibrium Arc',
    exaltedName: 'Whitefire Verdict',
    primaryBase: 940,
    exaltedBase: 1640,
    primaryCooldown: 6,
    exaltedCooldown: 8,
    primaryScaling: 1.38,
    exaltedScaling: 1.59,
    baseStats: { basePower: 110, bonusType: 'oblivion_per_seraphim', bonusValue: 52 },
  }),
  buildOphanim({
    definitionId: 'bf-et-volthari-storm-lattice',
    name: 'Volthari Storm Lattice',
    description: 'Gain 8 Spectrum; Gain 1 Wing Pulse; Amplify up to 2 Wing Pulses (double next 1 spectrum gain per pulse); Draw 1 card',
    rarity: 'Eternal',
    artKey: 'bf_et_volthari_storm_lattice',
    // Role: STORM ESCALATOR OPHANIM. +1 flutter then consumes 2 banked pulses at
    // a modest double-next coefficient.
    effects: [{ type: 'butterfly_spectrum_gain', value: 10 }, { type: 'set_secondary_gain', kind: 'flutter', value: 1 }, { type: 'flutter_wing_pulse_amplify', doubleNextGains: 1, consume: 2 }],
  })];

const infinityCards: CardDefinition[] = [
  buildSeraphim({
    definitionId: 'bf-inf-velkoreth-the-unfolding',
    name: 'Velkoreth, The Unfolding',
    description: 'On play: Gain 10 Spectrum; Tune stance to Dual; Gain 3 Wing Pulses; Amplify all Wing Pulses (double next 1 spectrum gain per pulse); Release up to 6 Spectrum (+180 Oblivion per spectrum). While on board: +88 Oblivion per card played while active',
    rarity: 'Infinite',
    artKey: 'bf_inf_velkoreth_the_unfolding',
    bonusType: 'oblivion_per_card',
    bonusValue: 88,
    // Role: APEX SERAPHIM PULSE FINISHER. +3 flutter then consumes ALL banked
    // pulses to double upcoming spectrum gains in this turn.
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 10 }, { type: 'butterfly_tune', stance: 'Dual' }, { type: 'set_secondary_gain', kind: 'flutter', value: 3 }, { type: 'flutter_wing_pulse_amplify', doubleNextGains: 1 }, { type: 'butterfly_release', spend: 6, oblivionPerSpectrum: 180 }],
    unsynergizedName: 'Foundational Wingbeat',
    synergizedName: 'Worldshaping Wingbeat',
    unsynergizedBase: 2080,
    synergizedBase: 3640,
    unsynergizedCooldown: 7,
    synergizedCooldown: 9,
  }),
  buildOphanim({
    definitionId: 'bf-inf-open-foundational-chrysalis',
    name: 'Open Foundational Chrysalis',
    description: 'Gain 8 Spectrum; Draw 2 cards; Tune stance to Reflect; Gain 3 Wing Pulses',
    rarity: 'Infinite',
    artKey: 'bf_inf_open_foundational_chrysalis',
    // Role: PURE OPHANIM PULSE BATTERY (Infinite). +3 flutter, no amplify.
    effects: [{ type: 'butterfly_spectrum_gain', value: 12 }, { type: 'butterfly_tune', stance: 'Reflect' }, { type: 'set_secondary_gain', kind: 'flutter', value: 3 }],
  }),
  buildCherubim({
    definitionId: 'bf-inf-mirrorface-voidface',
    name: 'Mirrorface, Voidface',
    description: 'On play: Tune stance to Dual; Gain 8 Spectrum; Gain 4 Wing Pulses. While on board: Buffs Seraphim and Angel attacks: base +120; Seraphim bonuses are amplified by +0.2',
    rarity: 'Infinite',
    artKey: 'bf_inf_mirrorface_voidface',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 120 }, { type: 'cherubim_seraphim_amp', value: 0.2 }],
    // Role: BIG BACK-ROW PULSE BATTERY (Cherubim Infinite). +4 flutter, no amplify.
    onPlayEffects: [{ type: 'butterfly_tune', stance: 'Dual' }, { type: 'butterfly_spectrum_gain', value: 8 }, { type: 'set_secondary_gain', kind: 'flutter', value: 4 }],
  }),
  buildAngel({
    definitionId: 'bf-inf-generation-of-the-flutter',
    name: 'Generation of the Flutter',
    description: 'On summon: Gain 10 Spectrum; Tune stance to Dual; Empower the next card you play; Gain 3 Wing Pulses. After 4 cards played: Amplify up to 3 Wing Pulses (double next 2 spectrum gains per pulse); Release up to 8 Spectrum (+190 Oblivion per spectrum). While on board: +26 power for each Seraphim on board while on board',
    rarity: 'Infinite',
    artKey: 'bf_inf_generation_of_the_flutter',
    summonCost: ['bf-ser-ossiveth-shadowspan', 'bf-ser-mireth-lenshost'],
    onSummonEffects: [{ type: 'butterfly_spectrum_gain', value: 10 }, { type: 'butterfly_tune', stance: 'Dual' }, { type: 'multiply_next' }, { type: 'set_secondary_gain', kind: 'flutter', value: 3 }],
    // Apex Infinite Angel: activated ability spends 3 banked pulses for
    // doubleNextGains:2  Ea triggered Apex amplifier.
    activatedAbility: {
      name: 'Descent Trigger',
      cardsPlayedRequirement: 4,
      description: 'Amplify up to 3 Wing Pulses (double next 2 spectrum gains per pulse); Release up to 8 Spectrum (+190 Oblivion per spectrum)',
      effects: [{ type: 'flutter_wing_pulse_amplify', doubleNextGains: 2, consume: 3 }, { type: 'butterfly_release', spend: 8, oblivionPerSpectrum: 190 }],
    },
    primaryName: 'Flutter Decree',
    exaltedName: 'Descent of Everything',
    primaryBase: 1980,
    exaltedBase: 3440,
    primaryCooldown: 7,
    exaltedCooldown: 9,
    primaryScaling: 1.58,
    exaltedScaling: 1.82,
    baseStats: { basePower: 158, bonusType: 'power_per_seraphim', bonusValue: 26 },
  }),
  buildOphanim({
    definitionId: 'bf-inf-the-endless-wing-age',
    name: 'The Endless Wing Age',
    description: 'Gain 9 Spectrum; Gain 2 Wing Pulses; Amplify up to 2 Wing Pulses (double next 2 spectrum gains per pulse); Release up to 5 Spectrum (+170 Oblivion per spectrum); Draw 1 card',
    rarity: 'Infinite',
    artKey: 'bf_inf_the_endless_wing_age',
    // Role: HIGH-COEFFICIENT PARTIAL OPHANIM (Infinite). +2 flutter then
    // consumes 2 at the strongest double-next coefficient.
    effects: [{ type: 'butterfly_spectrum_gain', value: 11 }, { type: 'set_secondary_gain', kind: 'flutter', value: 2 }, { type: 'flutter_wing_pulse_amplify', doubleNextGains: 2, consume: 2 }, { type: 'butterfly_release', spend: 5, oblivionPerSpectrum: 170 }],
  })];

export const butterflySetCards: CardDefinition[] = [
  ...baseSeraphim,
  ...baseCherubim,
  ...baseOphanim,
  ...baseAngels,
  ...eternalCards,
  ...infinityCards];

export const butterflyPackPool = butterflySetCards.map(card => card.definitionId);
