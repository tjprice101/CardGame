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
    description: 'On play: Gain 2 Flutter Spectrum; Draw 1 card. While on board: +8 Oblivion per card played while active',
    rarity: 'Common',
    artKey: 'bf_ser_unfurling_cantor',
    bonusType: 'oblivion_per_card',
    bonusValue: 8,
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 2 }, { type: 'draw', value: 1 }],
    unsynergizedName: 'Cantor Slice',
    synergizedName: 'Cantor Flutter',
    unsynergizedBase: 462,
    synergizedBase: 571,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'bf-ser-ferrathi-iron-hum',
    name: 'Ferrathi Iron Hum',
    description: 'On play: Gain 2 Flutter Spectrum; +90 Oblivion. While on board: +14 Oblivion per card played while active',
    rarity: 'Common',
    artKey: 'bf_ser_ferrathi_iron_hum',
    bonusType: 'oblivion_per_card',
    bonusValue: 14,
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 2 }, { type: 'oblivion_flat', value: 90 }],
    unsynergizedName: 'Iron Resonance',
    synergizedName: 'Seven-Layer Resonance',
    unsynergizedBase: 479,
    synergizedBase: 588,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'bf-ser-vethkai-clear-arc',
    name: 'Vethkai Clear Arc',
    description: 'On play: Gain 3 Flutter Spectrum; Look at the top 4 cards, take 1 card, and put the rest on the bottom. While on board: +22 Oblivion whenever you play an Ophanim while active',
    rarity: 'Rare',
    artKey: 'bf_ser_vethkai_clear_arc',
    bonusType: 'ophanim_bonus',
    bonusValue: 22,
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 3 }, { type: 'look_top_take', look: 4, take: 1 }],
    unsynergizedName: 'Prism Arc',
    synergizedName: 'Prism Chorus Arc',
    unsynergizedBase: 616,
    synergizedBase: 773,
    unsynergizedCooldown: 4,
    synergizedCooldown: 6,
  }),
  buildSeraphim({
    definitionId: 'bf-ser-pyrethkai-whiteflame',
    name: 'Pyrethkai Whiteflame',
    description: 'On play: Gain 3 Flutter Spectrum; Gain 1 Wing Pulse. While on board: Resource generation +3 while active',
    rarity: 'Rare',
    artKey: 'bf_ser_pyrethkai_whiteflame',
    bonusType: 'resource_generation',
    bonusValue: 3,
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 3 }, { type: 'set_secondary_gain', kind: 'flutter', value: 1 }],
    unsynergizedName: 'White Combustion',
    synergizedName: 'Equilibrium Burn',
    unsynergizedBase: 631,
    synergizedBase: 795,
    unsynergizedCooldown: 4,
    synergizedCooldown: 6,
  }),
  buildSeraphim({
    definitionId: 'bf-ser-nullwing-stillness',
    name: 'Nullwing Stillness',
    description: 'On play: Gain 4 Flutter Spectrum; Release up to 2 Spectrum (+80 Oblivion per Spectrum). While on board: Resource generation +6 while active',
    rarity: 'Epic',
    artKey: 'bf_ser_nullwing_stillness',
    bonusType: 'resource_generation',
    bonusValue: 6,
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 4 }, { type: 'butterfly_release', spend: 2, oblivionPerSpectrum: 80 }],
    unsynergizedName: 'Interstice Quietus',
    synergizedName: 'Flutter Silence',
    unsynergizedBase: 893,
    synergizedBase: 1128,
    unsynergizedCooldown: 5,
    synergizedCooldown: 7,
  }),
  buildSeraphim({
    definitionId: 'bf-ser-volthari-stormscript',
    name: 'Volthari Stormscript',
    description: 'On play: Gain 4 Flutter Spectrum. While on board: +20 Oblivion whenever you play an Ophanim while active',
    rarity: 'Epic',
    artKey: 'bf_ser_volthari_stormscript',
    bonusType: 'ophanim_bonus',
    bonusValue: 20,
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 4 }],
    unsynergizedName: 'Stormline Etch',
    synergizedName: 'Lightning Flutter Glyph',
    unsynergizedBase: 921,
    synergizedBase: 1154,
    unsynergizedCooldown: 5,
    synergizedCooldown: 7,
  }),
  buildSeraphim({
    definitionId: 'bf-ser-ossiveth-shadowspan',
    name: 'Ossiveth Shadowspan',
    description: 'On play: Gain 5 Flutter Spectrum; Release up to 3 Spectrum (+120 Oblivion per Spectrum). While on board: +28 Oblivion per card played while active',
    rarity: 'Legendary',
    artKey: 'bf_ser_ossiveth_shadowspan',
    bonusType: 'oblivion_per_card',
    bonusValue: 28,
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 5 }, { type: 'butterfly_release', spend: 3, oblivionPerSpectrum: 120 }],
    unsynergizedName: 'Geologic Wingbeat',
    synergizedName: 'Milespan Cataclysm',
    unsynergizedBase: 1317,
    synergizedBase: 1649,
    unsynergizedCooldown: 6,
    synergizedCooldown: 8,
  }),
  buildSeraphim({
    definitionId: 'bf-ser-mireth-lenshost',
    name: 'Mireth Lenshost',
    description: 'On play: Gain 5 Flutter Spectrum; Draw 2 cards. While on board: Each new Cherubim summoned while active gains +1 durability',
    rarity: 'Legendary',
    artKey: 'bf_ser_mireth_lenshost',
    bonusType: 'cherubim_extra_plays',
    bonusValue: 1,
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 5 }, { type: 'draw', value: 2 }],
    unsynergizedName: 'Prismatic Congregation',
    synergizedName: 'Lensstorm Descent',
    unsynergizedBase: 1352,
    synergizedBase: 1686,
    unsynergizedCooldown: 6,
    synergizedCooldown: 8,
  })];

const baseCherubim: CherubimDefinition[] = [
  buildCherubim({
    definitionId: 'bf-cher-mireth-flutterlings',
    name: 'Mireth Flutterlings',
    description: 'On play: Gain 2 Flutter Spectrum; Draw 1 card. While on board: Each adjacent active Seraphim adds 1 extra card whenever you play a card',
    rarity: 'Common',
    artKey: 'bf_cher_mireth_flutterlings',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'draw', value: 1 }],
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 2 }, { type: 'draw', value: 1 }],
  }),
  buildCherubim({
    definitionId: 'bf-cher-copper-bank-spark',
    name: 'Copper Bank Spark',
    description: 'On play: Gain 2 Flutter Spectrum. While on board: Gain 1 Spectrum per card played',
    rarity: 'Common',
    artKey: 'bf_cher_copper_bank_spark',
    effects: [{ type: 'cherubim_resource_per_card', resource: 'butterflySpectrum', value: 1 }],
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 2 }],
  }),
  buildCherubim({
    definitionId: 'bf-cher-prismedge-novice',
    name: 'Prismedge Novice',
    description: 'On play: Gain 3 Flutter Spectrum; Look at the top 4 cards, take 1 card, and put the rest on the bottom',
    rarity: 'Rare',
    artKey: 'bf_cher_prismedge_novice',
    effects: [],
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 3 }, { type: 'look_top_take', look: 4, take: 1 }],
  }),
  buildCherubim({
    definitionId: 'bf-cher-echo-shed-lamina',
    name: 'Echo Shed Lamina',
    description: 'On play: Gain 3 Flutter Spectrum; +120 Oblivion. While on board: +8 Oblivion per card played',
    rarity: 'Rare',
    artKey: 'bf_cher_echo_shed_lamina',
    effects: [{ type: 'cherubim_oblivion_per_card', value: 8 }],
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 3 }, { type: 'oblivion_flat', value: 120 }],
  }),
  buildCherubim({
    definitionId: 'bf-cher-nullwake-attendant',
    name: 'Nullwake Attendant',
    description: 'On play: Gain 6 Flutter Spectrum. While on board: Seraphim bonuses are amplified by +8%',
    rarity: 'Epic',
    artKey: 'bf_cher_nullwake_attendant',
    effects: [{ type: 'cherubim_seraphim_amp', value: 0.08 }],
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 6 }],
  }),
  buildCherubim({
    definitionId: 'bf-cher-volthari-filament',
    name: 'Volthari Filament',
    description: 'On play: Gain 4 Flutter Spectrum. While on board: Buffs Seraphim and Angel attacks: base +42; Buffs Angel attacks: base +33',
    rarity: 'Epic',
    artKey: 'bf_cher_volthari_filament',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 42 }, { type: 'cherubim_attack_buff', targetUnitType: 'Angel', bonusBaseOblivion: 33 }],
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 4 }],
  }),
  buildCherubim({
    definitionId: 'bf-cher-stained-century-choir',
    name: 'Stained Century Choir',
    description: 'On play: Gain 5 Flutter Spectrum; Draw 2 cards. While on board: All Oblivion gain +55%',
    rarity: 'Legendary',
    artKey: 'bf_cher_stained_century_choir',
    maxDurability: 9,
    effects: [{ type: 'cherubim_global_oblivion_mult', value: 0.55 }],
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 5 }, { type: 'draw', value: 2 }],
  }),
  buildCherubim({
    definitionId: 'bf-cher-flutter-vigil-sexton',
    name: 'Flutter Vigil Sexton',
    description: 'On play: Gain 5 Flutter Spectrum; Release up to 2 Spectrum (+85 Oblivion per Spectrum). While on board: +1 draw every 3 cards played',
    rarity: 'Legendary',
    artKey: 'bf_cher_flutter_vigil_sexton',
    effects: [{ type: 'cherubim_draw_per_card', value: 0.34 }],
    onPlayEffects: [{ type: 'butterfly_spectrum_gain', value: 5 }, { type: 'butterfly_release', spend: 2, oblivionPerSpectrum: 85 }],
  })];

const baseOphanim: OphanimDefinition[] = [
  buildOphanim({
    definitionId: 'bf-oph-ridge-trace',
    name: 'Ridge Trace',
    description: 'Gain 2 Flutter Spectrum; Draw 1 card',
    rarity: 'Common',
    artKey: 'bf_oph_ridge_trace',
    effects: [{ type: 'butterfly_spectrum_gain', value: 2 }, { type: 'draw', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'bf-oph-lens-current',
    name: 'Lens Current',
    description: 'Gain 2 Flutter Spectrum; Look at the top 3 cards, take 1 card, and put the rest on the bottom',
    rarity: 'Common',
    artKey: 'bf_oph_lens_current',
    effects: [{ type: 'butterfly_spectrum_gain', value: 2 }, { type: 'look_top_take', look: 3, take: 1 }],
  }),
  buildOphanim({
    definitionId: 'bf-oph-copper-green-trail',
    name: 'Copper-Green Trail',
    description: 'Gain 3 Flutter Spectrum; Gain 1 Wing Pulse',
    rarity: 'Rare',
    artKey: 'bf_oph_copper_green_trail',
    effects: [{ type: 'butterfly_spectrum_gain', value: 3 }, { type: 'set_secondary_gain', kind: 'flutter', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'bf-oph-crystal-ornament-route',
    name: 'Crystal Ornament Route',
    description: 'Gain 3 Flutter Spectrum; Draw 2 cards',
    rarity: 'Rare',
    artKey: 'bf_oph_crystal_ornament_route',
    effects: [{ type: 'butterfly_spectrum_gain', value: 3 }, { type: 'draw', value: 2 }],
  }),
  buildOphanim({
    definitionId: 'bf-oph-suppression-wake',
    name: 'Suppression Wake',
    description: 'Gain 4 Flutter Spectrum; +180 Oblivion',
    rarity: 'Epic',
    artKey: 'bf_oph_suppression_wake',
    effects: [{ type: 'butterfly_spectrum_gain', value: 4 }, { type: 'oblivion_flat', value: 180 }],
  }),
  buildOphanim({
    definitionId: 'bf-oph-electromagnetic-arrival',
    name: 'Electromagnetic Arrival',
    description: 'Gain 4 Flutter Spectrum; Draw 1 card',
    rarity: 'Epic',
    artKey: 'bf_oph_electromagnetic_arrival',
    effects: [{ type: 'butterfly_spectrum_gain', value: 4 }, { type: 'draw', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'bf-oph-midair-citadel',
    name: 'Midair Citadel',
    description: 'Gain 5 Flutter Spectrum; Release up to 2 Spectrum (+110 Oblivion per Spectrum)',
    rarity: 'Legendary',
    artKey: 'bf_oph_midair_citadel',
    effects: [{ type: 'butterfly_spectrum_gain', value: 5 }, { type: 'butterfly_release', spend: 2, oblivionPerSpectrum: 110 }],
  }),
  buildOphanim({
    definitionId: 'bf-oph-velmargin-lensfall',
    name: 'Velmargin Lensfall',
    description: 'Gain 5 Flutter Spectrum',
    rarity: 'Legendary',
    artKey: 'bf_oph_velmargin_lensfall',
    effects: [{ type: 'butterfly_spectrum_gain', value: 5 }],
  })];

const baseAngels: AngelDefinition[] = [
  buildAngel({
    definitionId: 'bf-angel-meadow-navigator',
    name: 'Meadow Navigator',
    description: 'On summon: Gain 4 Flutter Spectrum; Draw 1 card. After 2 cards played: Gain 2 Flutter Spectrum; Draw 1 card. While on board: +40 Oblivion per card played while on board',
    rarity: 'Rare',
    artKey: 'bf_angel_meadow_navigator',
    summonCost: ['bf-ser-unfurling-cantor', 'bf-ser-ferrathi-iron-hum'],
    onSummonEffects: [{ type: 'butterfly_spectrum_gain', value: 4 }, { type: 'draw', value: 1 }],
    activatedAbility: {
      name: 'Route the Wing',
      cardsPlayedRequirement: 2,
      description: 'Gain 2 Flutter Spectrum; Draw 1 card',
      effects: [{ type: 'butterfly_spectrum_gain', value: 2 }, { type: 'draw', value: 1 }],
    },
    primaryName: 'Vector Wing',
    exaltedName: 'Guided Descent',
    primaryBase: 588,
    exaltedBase: 1042,
    primaryCooldown: 4,
    exaltedCooldown: 6,
    primaryScaling: 1.24,
    exaltedScaling: 1.42,
    baseStats: { basePower: 58, bonusType: 'oblivion_per_card', bonusValue: 40 },
  }),
  buildAngel({
    definitionId: 'bf-angel-chrysalis-warden',
    name: 'Chrysalis Warden',
    description: 'On summon: Gain 4 Flutter Spectrum. After 2 cards played: Release up to 2 Spectrum (+120 Oblivion per Spectrum). While on board: +24 Oblivion for each Seraphim on board while on board',
    rarity: 'Rare',
    artKey: 'bf_angel_chrysalis_warden',
    summonCost: ['bf-ser-vethkai-clear-arc', 'bf-ser-pyrethkai-whiteflame'],
    onSummonEffects: [{ type: 'butterfly_spectrum_gain', value: 4 }],
    activatedAbility: {
      name: 'Seal and Unseal',
      cardsPlayedRequirement: 2,
      description: 'Release up to 2 Spectrum (+120 Oblivion per Spectrum)',
      effects: [{ type: 'butterfly_release', spend: 2, oblivionPerSpectrum: 120 }],
    },
    primaryName: 'Shellbreak Edict',
    exaltedName: 'Cathedral Unfurling',
    primaryBase: 613,
    exaltedBase: 1078,
    primaryCooldown: 4,
    exaltedCooldown: 6,
    primaryScaling: 1.24,
    exaltedScaling: 1.43,
    baseStats: { basePower: 62, bonusType: 'oblivion_per_seraphim', bonusValue: 24 },
  }),
  buildAngel({
    definitionId: 'bf-angel-obsidian-surveyor',
    name: 'Obsidian Surveyor',
    description: 'On summon: Gain 5 Flutter Spectrum; +180 Oblivion. After 3 cards played: Release up to 3 Spectrum (+95 Oblivion per Spectrum). While on board: +20 Oblivion per card played while on board',
    rarity: 'Epic',
    artKey: 'bf_angel_obsidian_surveyor',
    summonCost: ['bf-ser-nullwing-stillness', 'bf-ser-volthari-stormscript'],
    onSummonEffects: [{ type: 'butterfly_spectrum_gain', value: 5 }, { type: 'oblivion_flat', value: 180 }],
    activatedAbility: {
      name: 'Shadow Calibration',
      cardsPlayedRequirement: 3,
      description: 'Release up to 3 Spectrum (+95 Oblivion per Spectrum)',
      effects: [{ type: 'butterfly_release', spend: 3, oblivionPerSpectrum: 95 }],
    },
    primaryName: 'Dark Survey',
    exaltedName: 'Absorbing Horizon',
    primaryBase: 731,
    exaltedBase: 1285,
    primaryCooldown: 5,
    exaltedCooldown: 7,
    primaryScaling: 1.29,
    exaltedScaling: 1.46,
    baseStats: { basePower: 74, bonusType: 'oblivion_per_card', bonusValue: 20 },
  }),
  buildAngel({
    definitionId: 'bf-angel-flutter-cartographer',
    name: 'Flutter Cartographer',
    description: 'On summon: Gain 6 Flutter Spectrum; Draw 2 cards. After 3 cards played: Gain 2 Wing Pulses. While on board: +50 Oblivion per card played while on board',
    rarity: 'Epic',
    artKey: 'bf_angel_flutter_cartographer',
    summonCost: ['bf-ser-ossiveth-shadowspan', 'bf-ser-mireth-lenshost'],
    onSummonEffects: [{ type: 'butterfly_spectrum_gain', value: 6 }, { type: 'draw', value: 2 }],
    activatedAbility: {
      name: 'Mark the Pulse',
      cardsPlayedRequirement: 3,
      description: 'Gain 2 Wing Pulses',
      effects: [{ type: 'set_secondary_gain', kind: 'flutter', value: 2 }],
    },
    primaryName: 'Pulse Meridian',
    exaltedName: 'Worldline Flutter',
    primaryBase: 753,
    exaltedBase: 1316,
    primaryCooldown: 5,
    exaltedCooldown: 7,
    primaryScaling: 1.3,
    exaltedScaling: 1.47,
    baseStats: { basePower: 78, bonusType: 'oblivion_per_card', bonusValue: 50 },
  }),
  buildAngel({
    definitionId: 'bf-angel-wingpattern-archivist',
    name: 'Wingpattern Archivist',
    description: 'On summon: Gain 7 Flutter Spectrum; Look at the top 6 cards, take 2 cards, and put the rest on the bottom. After 4 cards played: Release up to 4 Spectrum (+125 Oblivion per Spectrum); Draw 1 card. While on board: +35 Oblivion for each Seraphim on board while on board',
    rarity: 'Legendary',
    artKey: 'bf_angel_wingpattern_archivist',
    summonCost: ['bf-ser-ossiveth-shadowspan', 'bf-ser-volthari-stormscript'],
    onSummonEffects: [{ type: 'butterfly_spectrum_gain', value: 7 }, { type: 'look_top_take', look: 6, take: 2 }],
    activatedAbility: {
      name: 'Archive Release',
      cardsPlayedRequirement: 4,
      description: 'Release up to 4 Spectrum (+125 Oblivion per Spectrum); Draw 1 card',
      effects: [{ type: 'butterfly_release', spend: 4, oblivionPerSpectrum: 125 }, { type: 'draw', value: 1 }],
    },
    primaryName: 'Catalog Slash',
    exaltedName: 'Generational Verdict',
    primaryBase: 966,
    exaltedBase: 1694,
    primaryCooldown: 6,
    exaltedCooldown: 8,
    primaryScaling: 1.33,
    exaltedScaling: 1.5,
    baseStats: { basePower: 92, bonusType: 'oblivion_per_seraphim', bonusValue: 35 },
  }),
  buildAngel({
    definitionId: 'bf-angel-generational-witness',
    name: 'Generational Witness',
    description: 'On summon: Gain 8 Flutter Spectrum; Gain 2 Wing Pulses. After 4 cards played: Release up to 6 Spectrum (+140 Oblivion per Spectrum). While on board: +14 power for each Seraphim on board while on board',
    rarity: 'Legendary',
    artKey: 'bf_angel_generational_witness',
    summonCost: ['bf-ser-mireth-lenshost', 'bf-ser-nullwing-stillness'],
    onSummonEffects: [{ type: 'butterfly_spectrum_gain', value: 8 }, { type: 'set_secondary_gain', kind: 'flutter', value: 2 }],
    activatedAbility: {
      name: 'Witnessed Descent',
      cardsPlayedRequirement: 4,
      description: 'Release up to 6 Spectrum (+140 Oblivion per Spectrum)',
      effects: [{ type: 'butterfly_release', spend: 6, oblivionPerSpectrum: 140 }],
    },
    primaryName: 'Marking Strike',
    exaltedName: 'Witnessed Cataclysm',
    primaryBase: 994,
    exaltedBase: 1747,
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
    description: 'On play: Gain 6 Flutter Spectrum; Release up to 2 Spectrum (+150 Oblivion per Spectrum); Gain 3 Wing Resonances. While on board: +42 Oblivion per card played while active',
    rarity: 'Eternal',
    artKey: 'bf_et_kethravoss_seven_layers',
    bonusType: 'oblivion_per_card',
    bonusValue: 42,
    onPlayEffects: [
      { type: 'butterfly_spectrum_gain', value: 6 },
      { type: 'butterfly_release', spend: 2, oblivionPerSpectrum: 150 },
      { type: 'eternal_stack_gain', stack: 'flutter', value: 3 },
    ],
    unsynergizedName: 'Layered Meridian',
    synergizedName: 'Seven-Layer Dominion',
    unsynergizedBase: 2038,
    synergizedBase: 2534,
    unsynergizedCooldown: 6,
    synergizedCooldown: 8,
  }),
  buildCherubim({
    definitionId: 'bf-et-mirrorglass-conclave',
    name: 'Mirrorglass Conclave',
    description: 'On play: Gain 5 Flutter Spectrum; Draw 2 cards; Gain 2 Wing Resonances; Harmonize up to 1 Wing Resonances (+120 Oblivion per resonance, +30 Oblivion per Formation, +1 draw per resonance). While on board: Seraphim bonuses are amplified by +14%',
    rarity: 'Eternal',
    artKey: 'bf_et_mirrorglass_conclave',
    effects: [{ type: 'cherubim_seraphim_amp', value: 0.14 }],
    onPlayEffects: [
      { type: 'butterfly_spectrum_gain', value: 5 },
      { type: 'draw', value: 2 },
      { type: 'eternal_stack_gain', stack: 'flutter', value: 2 },
      { type: 'flutter_resonance_harmonize', consume: 1, oblivionPerResonance: 120, drawPerResonance: 1, oblivionPerFormation: 30 },
    ],
  }),
  buildOphanim({
    definitionId: 'bf-et-nullwing-interstice',
    name: 'Nullwing Interstice',
    description: 'Gain 2 Wing Resonances; Harmonize up to 2 Wing Resonances (+2 Spectrum per resonance, +135 Oblivion per resonance, +45 Oblivion per Formation); Release up to 3 Spectrum (+130 Oblivion per Spectrum)',
    rarity: 'Eternal',
    artKey: 'bf_et_nullwing_interstice',
    effects: [
      { type: 'eternal_stack_gain', stack: 'flutter', value: 2 },
      { type: 'flutter_resonance_harmonize', consume: 2, spectrumPerResonance: 2, oblivionPerResonance: 135, oblivionPerFormation: 45 },
      { type: 'butterfly_release', spend: 3, oblivionPerSpectrum: 130 },
    ],
  }),
  buildAngel({
    definitionId: 'bf-et-pyrethkai-equilibrium',
    name: 'Pyrethkai Equilibrium',
    description: 'On summon: Gain 6 Flutter Spectrum; Gain 3 Wing Resonances. After 3 cards played: Apex all Wing Resonances (+175 Oblivion per resonance, +30 Oblivion per current Spectrum, +95 Oblivion per Formation, +1 draw every 2 Formations). While on board: +52 Oblivion for each Seraphim on board while on board',
    rarity: 'Eternal',
    artKey: 'bf_et_pyrethkai_equilibrium',
    summonCost: ['bf-ser-pyrethkai-whiteflame', 'bf-ser-vethkai-clear-arc'],
    onSummonEffects: [
      { type: 'butterfly_spectrum_gain', value: 6 },
      { type: 'eternal_stack_gain', stack: 'flutter', value: 3 },
    ],
    activatedAbility: {
      name: 'White Burn Equilibrium',
      cardsPlayedRequirement: 3,
      description: 'Apex all Wing Resonances (+175 Oblivion per resonance, +30 Oblivion per current Spectrum, +95 Oblivion per Formation, +1 draw every 2 Formations)',
      effects: [{ type: 'flutter_resonance_apex', oblivionPerResonance: 175, oblivionPerSpectrum: 30, oblivionPerFormation: 95, drawPerFormation: 0.5 }],
    },
    primaryName: 'Equilibrium Arc',
    exaltedName: 'Whitefire Verdict',
    primaryBase: 1316,
    exaltedBase: 2296,
    primaryCooldown: 6,
    exaltedCooldown: 8,
    primaryScaling: 1.38,
    exaltedScaling: 1.59,
    baseStats: { basePower: 110, bonusType: 'oblivion_per_seraphim', bonusValue: 52 },
  }),
  buildOphanim({
    definitionId: 'bf-et-volthari-storm-lattice',
    name: 'Volthari Storm Lattice',
    description: 'Gain 1 Wing Resonance; Harmonize up to 2 Wing Resonances (+3 Spectrum per resonance, +1 draw every 2 resonances); Draw 1 card',
    rarity: 'Eternal',
    artKey: 'bf_et_volthari_storm_lattice',
    effects: [
      { type: 'eternal_stack_gain', stack: 'flutter', value: 1 },
      { type: 'flutter_resonance_harmonize', consume: 2, spectrumPerResonance: 3, drawPerResonance: 0.5 },
      { type: 'draw', value: 1 },
    ],
  })];

const infinityCards: CardDefinition[] = [
  buildSeraphim({
    definitionId: 'bf-inf-velkoreth-the-unfolding',
    name: 'Velkoreth, The Unfolding',
    description: 'On play: Gain 9 Flutter Spectrum; Gain 5 Wing Resonances; Harmonize up to 2 Wing Resonances (+2 Spectrum per resonance, +190 Oblivion per resonance, +70 Oblivion per Formation, +1 draw every 2 resonances); Release up to 4 Spectrum (+185 Oblivion per Spectrum). While on board: +88 Oblivion per card played while active',
    rarity: 'Infinite',
    artKey: 'bf_inf_velkoreth_the_unfolding',
    bonusType: 'oblivion_per_card',
    bonusValue: 88,
    onPlayEffects: [
      { type: 'butterfly_spectrum_gain', value: 9 },
      { type: 'eternal_stack_gain', stack: 'flutter', value: 5 },
      { type: 'flutter_resonance_harmonize', consume: 2, spectrumPerResonance: 2, oblivionPerResonance: 190, oblivionPerFormation: 70, drawPerResonance: 0.5 },
      { type: 'butterfly_release', spend: 4, oblivionPerSpectrum: 185 },
    ],
    unsynergizedName: 'Foundational Wingbeat',
    synergizedName: 'Worldshaping Wingbeat',
    unsynergizedBase: 4077,
    synergizedBase: 5096,
    unsynergizedCooldown: 7,
    synergizedCooldown: 9,
  }),
  buildOphanim({
    definitionId: 'bf-inf-open-foundational-chrysalis',
    name: 'Open Foundational Chrysalis',
    description: 'Gain 4 Wing Resonances; Harmonize up to 1 Wing Resonances (+4 Spectrum per resonance, +55 Oblivion per Formation, +1 draw per resonance); Look at the top 6 cards, take 2 cards, and put the rest on the bottom',
    rarity: 'Infinite',
    artKey: 'bf_inf_open_foundational_chrysalis',
    effects: [
      { type: 'eternal_stack_gain', stack: 'flutter', value: 4 },
      { type: 'flutter_resonance_harmonize', consume: 1, spectrumPerResonance: 4, drawPerResonance: 1, oblivionPerFormation: 55 },
      { type: 'look_top_take', look: 6, take: 2 },
    ],
  }),
  buildCherubim({
    definitionId: 'bf-inf-mirrorface-voidface',
    name: 'Mirrorface, Voidface',
    description: 'On play: Gain 6 Flutter Spectrum; Gain 3 Wing Resonances; Harmonize up to 2 Wing Resonances (+170 Oblivion per resonance, +1 draw per resonance). While on board: Buffs Seraphim and Angel attacks: base +120; Seraphim bonuses are amplified by +20%',
    rarity: 'Infinite',
    artKey: 'bf_inf_mirrorface_voidface',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 120 }, { type: 'cherubim_seraphim_amp', value: 0.2 }],
    onPlayEffects: [
      { type: 'butterfly_spectrum_gain', value: 6 },
      { type: 'eternal_stack_gain', stack: 'flutter', value: 3 },
      { type: 'flutter_resonance_harmonize', consume: 2, oblivionPerResonance: 170, drawPerResonance: 1 },
    ],
  }),
  buildAngel({
    definitionId: 'bf-inf-generation-of-the-flutter',
    name: 'Generation of the Flutter',
    description: 'On summon: Gain 8 Flutter Spectrum; Gain 4 Wing Resonances. After 4 cards played: Apex up to 4 Wing Resonances (+220 Oblivion per resonance, +40 Oblivion per current Spectrum, +120 Oblivion per Formation, +1 draw per Formation); Release up to 6 Spectrum (+200 Oblivion per Spectrum). While on board: +26 power for each Seraphim on board while on board',
    rarity: 'Infinite',
    artKey: 'bf_inf_generation_of_the_flutter',
    summonCost: ['bf-ser-ossiveth-shadowspan', 'bf-ser-mireth-lenshost'],
    onSummonEffects: [{ type: 'butterfly_spectrum_gain', value: 8 }, { type: 'eternal_stack_gain', stack: 'flutter', value: 4 }],
    activatedAbility: {
      name: 'Descent Trigger',
      cardsPlayedRequirement: 4,
      description: 'Apex up to 4 Wing Resonances (+220 Oblivion per resonance, +40 Oblivion per current Spectrum, +120 Oblivion per Formation, +1 draw per Formation); Release up to 6 Spectrum (+200 Oblivion per Spectrum)',
      effects: [
        { type: 'flutter_resonance_apex', consume: 4, oblivionPerResonance: 220, oblivionPerSpectrum: 40, oblivionPerFormation: 120, drawPerFormation: 1 },
        { type: 'butterfly_release', spend: 6, oblivionPerSpectrum: 200 },
      ],
    },
    primaryName: 'Flutter Decree',
    exaltedName: 'Descent of Everything',
    primaryBase: 2772,
    exaltedBase: 4816,
    primaryCooldown: 7,
    exaltedCooldown: 9,
    primaryScaling: 1.58,
    exaltedScaling: 1.82,
    baseStats: { basePower: 158, bonusType: 'power_per_seraphim', bonusValue: 26 },
  }),
  buildOphanim({
    definitionId: 'bf-inf-the-endless-wing-age',
    name: 'The Endless Wing Age',
    description: 'Gain 2 Wing Resonances; Apex up to 2 Wing Resonances (+170 Oblivion per resonance, +36 Oblivion per current Spectrum, +90 Oblivion per Formation, +1 draw every 2 Formations); Release up to 5 Spectrum (+190 Oblivion per Spectrum); Draw 1 card',
    rarity: 'Infinite',
    artKey: 'bf_inf_the_endless_wing_age',
    effects: [
      { type: 'eternal_stack_gain', stack: 'flutter', value: 2 },
      { type: 'flutter_resonance_apex', consume: 2, oblivionPerResonance: 170, oblivionPerSpectrum: 36, oblivionPerFormation: 90, drawPerFormation: 0.5 },
      { type: 'butterfly_release', spend: 5, oblivionPerSpectrum: 190 },
      { type: 'draw', value: 1 },
    ],
  })];

export const butterflySetCards: CardDefinition[] = [
  ...baseSeraphim,
  ...baseCherubim,
  ...baseOphanim,
  ...baseAngels,
  ...eternalCards,
  ...infinityCards];

export const butterflyPackPool = butterflySetCards.map(card => card.definitionId);
