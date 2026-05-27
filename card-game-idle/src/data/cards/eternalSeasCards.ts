import type { AngelDefinition, CardDefinition, CherubimDefinition, OphanimDefinition, SeraphimDefinition } from '@/types/cards';

const ETERNAL_SEAS = 'EternalSeas' as const;

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
    element: ETERNAL_SEAS,
    rarity: spec.rarity,
    name: spec.name,
    description: spec.description,
    artKey: spec.artKey,
    baseStats: {
      bonusType: spec.bonusType,
      bonusValue: spec.bonusValue,
      synergyRequirement: ETERNAL_SEAS,
    },
    onPlayEffects: spec.onPlayEffects,
    attacks: {
      unsynergized: {
        id: `${spec.definitionId}:unsyn`,
        label: 'Unsynergized',
        name: spec.unsynergizedName,
        description: 'Current-fed strike.',
        baseOblivion: spec.unsynergizedBase,
        cooldownCards: spec.unsynergizedCooldown,
        costs: [],
      },
      synergized: {
        id: `${spec.definitionId}:syn`,
        label: 'Synergized',
        name: spec.synergizedName,
        description: 'Veilmargin surge.',
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
    element: ETERNAL_SEAS,
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
    element: ETERNAL_SEAS,
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
    element: ETERNAL_SEAS,
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
        description: 'Current-cut strike.',
        baseOblivion: spec.primaryBase,
        cooldownCards: spec.primaryCooldown,
        costs: [],
      },
      exalted: {
        id: `${spec.definitionId}:exalted`,
        label: 'Exalted',
        name: spec.exaltedName,
        description: 'Undying water apex attack.',
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
    definitionId: 'es-ser-velthiri-bloomschool',
    name: 'Velthiri Bloomschool',
    description: 'On play: Gain 2 Current; Shift polarity to White; Draw 1 card. While on board: +8 Oblivion per card played while active',
    rarity: 'Common',
    artKey: 'es_ser_velthiri_bloomschool',
    bonusType: 'oblivion_per_card',
    bonusValue: 8,
    onPlayEffects: [{ type: 'seas_current_gain', value: 4 }, { type: 'seas_polarity_shift', polarity: 'White' }],
    unsynergizedName: 'School Cut',
    synergizedName: 'Margin Bloom Cut',
    unsynergizedBase: 230,
    synergizedBase: 404,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'es-ser-kethavar-helixhunter',
    name: 'Kethavar Helixhunter',
    description: 'On play: Gain 2 Current; Shift polarity to Black; +80 Oblivion. While on board: +13 Oblivion per card played while active',
    rarity: 'Common',
    artKey: 'es_ser_kethavar_helixhunter',
    bonusType: 'oblivion_per_card',
    bonusValue: 13,
    onPlayEffects: [{ type: 'seas_current_gain', value: 2 }, { type: 'seas_polarity_shift', polarity: 'Black' }, { type: 'oblivion_flat', value: 80 }],
    unsynergizedName: 'Helix Drill',
    synergizedName: 'Abyss Helix Drill',
    unsynergizedBase: 242,
    synergizedBase: 416,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'es-ser-surevaan-tiltborne',
    name: 'Surevaan Tiltborne',
    description: 'On play: Gain 3 Current; Shift polarity to White. While on board: +20 Oblivion whenever you play an Ophanim while active',
    rarity: 'Rare',
    artKey: 'es_ser_surevaan_tiltborne',
    bonusType: 'ophanim_bonus',
    bonusValue: 20,
    onPlayEffects: [{ type: 'seas_current_gain', value: 3 }, { type: 'seas_polarity_shift', polarity: 'White' }],
    unsynergizedName: 'Diagonal Drift',
    synergizedName: 'Marginlift Verdict',
    unsynergizedBase: 314,
    synergizedBase: 548,
    unsynergizedCooldown: 4,
    synergizedCooldown: 6,
  }),
  buildSeraphim({
    definitionId: 'es-ser-thyrvaan-fractalbreath',
    name: 'Thyrvaan Fractalbreath',
    description: 'On play: Gain 3 Current; Shift polarity to Black; Draw 1 card. While on board: Resource generation +5 while active',
    rarity: 'Rare',
    artKey: 'es_ser_thyrvaan_fractalbreath',
    bonusType: 'resource_generation',
    bonusValue: 5,
    onPlayEffects: [{ type: 'seas_current_gain', value: 5 }, { type: 'seas_polarity_shift', polarity: 'Black' }],
    unsynergizedName: 'Fractal Pulse',
    synergizedName: 'Oldest Light Pulse',
    unsynergizedBase: 324,
    synergizedBase: 562,
    unsynergizedCooldown: 4,
    synergizedCooldown: 6,
  }),
  buildSeraphim({
    definitionId: 'es-ser-null-leviathan-sign',
    name: 'Null Leviathan Sign',
    description: 'On play: Gain 4 Current; Shift polarity to Black; Release up to 2 Current (+90 Oblivion per current). While on board: +24 Oblivion per card played while active',
    rarity: 'Epic',
    artKey: 'es_ser_null_leviathan_sign',
    bonusType: 'oblivion_per_card',
    bonusValue: 24,
    onPlayEffects: [{ type: 'seas_current_gain', value: 4 }, { type: 'seas_polarity_shift', polarity: 'Black' }, { type: 'seas_release', spend: 2, oblivionPerCurrent: 90 }],
    unsynergizedName: 'Signal Deepcut',
    synergizedName: 'Abyss Warning Verdict',
    unsynergizedBase: 452,
    synergizedBase: 804,
    unsynergizedCooldown: 5,
    synergizedCooldown: 7,
  }),
  buildSeraphim({
    definitionId: 'es-ser-veilmargin-harbinger',
    name: 'Veilmargin Harbinger',
    description: 'On play: Gain 4 Current; Shift polarity to White. While on board: +20 Oblivion per card played while active',
    rarity: 'Epic',
    artKey: 'es_ser_veilmargin_harbinger',
    bonusType: 'oblivion_per_card',
    bonusValue: 20,
    onPlayEffects: [{ type: 'seas_current_gain', value: 4 }, { type: 'seas_polarity_shift', polarity: 'White' }],
    unsynergizedName: 'Margin Harrow',
    synergizedName: 'Boundary Harrow',
    unsynergizedBase: 466,
    synergizedBase: 818,
    unsynergizedCooldown: 5,
    synergizedCooldown: 7,
  }),
  buildSeraphim({
    definitionId: 'es-ser-ossiveth-naur-ridgebody',
    name: 'Ossiveth Naur Ridgebody',
    description: 'On play: Gain 5 Current; Release up to 3 Current (+120 Oblivion per current). While on board: Each new Cherubim summoned while active gains +1 durability',
    rarity: 'Legendary',
    artKey: 'es_ser_ossiveth_naur_ridgebody',
    bonusType: 'cherubim_extra_plays',
    bonusValue: 1,
    onPlayEffects: [{ type: 'seas_current_gain', value: 5 }, { type: 'seas_release', spend: 3, oblivionPerCurrent: 120 }],
    unsynergizedName: 'Ridgewake Crush',
    synergizedName: 'World-Ocean Crush',
    unsynergizedBase: 680,
    synergizedBase: 1190,
    unsynergizedCooldown: 6,
    synergizedCooldown: 8,
  }),
  buildSeraphim({
    definitionId: 'es-ser-veleth-itself-echo',
    name: 'Veleth Itself Echo',
    description: 'On play: Gain 5 Current; Draw 2 cards; Shift polarity to Black. While on board: +30 Oblivion per card played while active',
    rarity: 'Legendary',
    artKey: 'es_ser_veleth_itself_echo',
    bonusType: 'oblivion_per_card',
    bonusValue: 30,
    onPlayEffects: [{ type: 'seas_current_gain', value: 9 }, { type: 'seas_polarity_shift', polarity: 'Black' }],
    unsynergizedName: 'Basslight Rupture',
    synergizedName: 'Undying Water Rupture',
    unsynergizedBase: 696,
    synergizedBase: 1214,
    unsynergizedCooldown: 6,
    synergizedCooldown: 8,
  })];

const baseCherubim: CherubimDefinition[] = [
  buildCherubim({
    definitionId: 'es-cher-silver-shallow-attendant',
    name: 'Silver Shallow Attendant',
    description: 'On play: Gain 2 Current; Shift polarity to White. While on board: Each adjacent active Seraphim adds 1 extra card whenever you play a card; Buffs Seraphim and Angel attacks: base +24, cooldown +0, multiplier x1.00',
    rarity: 'Common',
    artKey: 'es_cher_silver_shallow_attendant',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'draw', value: 1 }],
    onPlayEffects: [{ type: 'seas_current_gain', value: 2 }, { type: 'seas_polarity_shift', polarity: 'White' }],
  }),
  buildCherubim({
    definitionId: 'es-cher-blackzone-lamplure',
    name: 'Blackzone Lamplure',
    description: 'On play: Gain 2 Current; Shift polarity to Black. While on board: +8 Oblivion per card played; Buffs Seraphim attacks: base +9, cooldown -1, multiplier x1.00',
    rarity: 'Common',
    artKey: 'es_cher_blackzone_lamplure',
    effects: [{ type: 'cherubim_oblivion_per_card', value: 8 }],
    onPlayEffects: [{ type: 'seas_current_gain', value: 2 }, { type: 'seas_polarity_shift', polarity: 'Black' }],
  }),
  buildCherubim({
    definitionId: 'es-cher-veilmargin-conductor',
    name: 'Veilmargin Conductor',
    description: 'On play: Gain 3 Current. While on board: Buffs Angel attacks: base +36',
    rarity: 'Rare',
    artKey: 'es_cher_veilmargin_conductor',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Angel', bonusBaseOblivion: 36 }],
    onPlayEffects: [{ type: 'seas_current_gain', value: 3 }],
  }),
  buildCherubim({
    definitionId: 'es-cher-neon-cell-cantor',
    name: 'Neon Cell Cantor',
    description: 'On play: Gain 3 Current; Gain 5 Radiance. While on board: Gain 2 Radiance per card played; Buffs Seraphim and Angel attacks: base +38, cooldown +0, multiplier x1.00',
    rarity: 'Rare',
    artKey: 'es_cher_neon_cell_cantor',
    effects: [{ type: 'cherubim_resource_per_card', resource: 'radiance', value: 2 }],
    onPlayEffects: [{ type: 'seas_current_gain', value: 3 }, { type: 'radiance_gain', value: 5 }],
  }),
  buildCherubim({
    definitionId: 'es-cher-surevaan-pulse-reader',
    name: 'Surevaan Pulse Reader',
    description: 'On play: Gain 4 Current; Draw 1 card. While on board: Seraphim bonuses are amplified by +0.09; Buffs Seraphim attacks: base +54, cooldown -1, multiplier x1.00; Buffs Angel attacks: base +42, cooldown +0, multiplier x1.00',
    rarity: 'Epic',
    artKey: 'es_cher_surevaan_pulse_reader',
    effects: [{ type: 'cherubim_seraphim_amp', value: 0.09 }],
    onPlayEffects: [{ type: 'seas_current_gain', value: 6 }],
  }),
  buildCherubim({
    definitionId: 'es-cher-thyrvaan-breathframe',
    name: 'Thyrvaan Breathframe',
    description: 'On play: Gain 4 Current. While on board: Buffs Seraphim and Angel attacks: base +34',
    rarity: 'Epic',
    artKey: 'es_cher_thyrvaan_breathframe',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 34 }],
    onPlayEffects: [{ type: 'seas_current_gain', value: 4 }],
  }),
  buildCherubim({
    definitionId: 'es-cher-crowned-current-keeper',
    name: 'Crowned Current Keeper',
    description: 'On play: Gain 5 Current; Draw 2 cards. While on board: Buffs Angel attacks: base +56; Draw 0.34 cards per card played',
    rarity: 'Legendary',
    artKey: 'es_cher_crowned_current_keeper',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Angel', bonusBaseOblivion: 56 }, { type: 'cherubim_draw_per_card', value: 0.34 }],
    onPlayEffects: [{ type: 'seas_current_gain', value: 9 }],
  }),
  buildCherubim({
    definitionId: 'es-cher-aeveleth-trace',
    name: 'Aeveleth Trace',
    description: 'On play: Gain 5 Current; Shift polarity to White; Empower the next card you play. While on board: All Oblivion gain +62%',
    rarity: 'Legendary',
    artKey: 'es_cher_aeveleth_trace',
    maxDurability: 9,
    effects: [{ type: 'cherubim_global_oblivion_mult', value: 0.62 }],
    onPlayEffects: [{ type: 'seas_current_gain', value: 5 }, { type: 'seas_polarity_shift', polarity: 'White' }, { type: 'multiply_next' }],
  })];

const baseOphanim: OphanimDefinition[] = [
  buildOphanim({
    definitionId: 'es-oph-shallows-spiral-map',
    name: 'Shallows Spiral Map',
    description: 'Gain 2 Current; Draw 1 card',
    rarity: 'Common',
    artKey: 'es_oph_shallows_spiral_map',
    effects: [{ type: 'seas_current_gain', value: 4 }],
  }),
  buildOphanim({
    definitionId: 'es-oph-veilmargin-crossflow',
    name: 'Veilmargin Crossflow',
    description: 'Gain 2 Current; Shift polarity to White; Shift polarity to Black; Draw 1 card',
    rarity: 'Common',
    artKey: 'es_oph_veilmargin_crossflow',
    effects: [{ type: 'seas_current_gain', value: 2 }, { type: 'seas_polarity_shift', polarity: 'White' }, { type: 'seas_polarity_shift', polarity: 'Black' }],
  }),
  buildOphanim({
    definitionId: 'es-oph-whitewater-cant',
    name: 'Whitewater Cant',
    description: 'Shift polarity to White; Gain 3 Current; Draw 1 card',
    rarity: 'Rare',
    artKey: 'es_oph_whitewater_cant',
    effects: [{ type: 'seas_polarity_shift', polarity: 'White' }, { type: 'seas_current_gain', value: 5 }],
  }),
  buildOphanim({
    definitionId: 'es-oph-blackwater-cant',
    name: 'Blackwater Cant',
    description: 'Shift polarity to Black; Gain 3 Current; +150 Oblivion; Draw 1 card',
    rarity: 'Rare',
    artKey: 'es_oph_blackwater_cant',
    effects: [{ type: 'seas_polarity_shift', polarity: 'Black' }, { type: 'seas_current_gain', value: 3 }, { type: 'oblivion_flat', value: 150 }],
  }),
  buildOphanim({
    definitionId: 'es-oph-neon-pressure-line',
    name: 'Neon Pressure Line',
    description: 'Gain 4 Current; Release up to 2 Current (+95 Oblivion per current); Shuffle discard into deck; Draw 1 card',
    rarity: 'Epic',
    artKey: 'es_oph_neon_pressure_line',
    effects: [{ type: 'seas_current_gain', value: 4 }, { type: 'seas_release', spend: 2, oblivionPerCurrent: 95 }],
  }),
  buildOphanim({
    definitionId: 'es-oph-thyrvaan-net-expansion',
    name: 'Thyrvaan Net Expansion',
    description: 'Gain 4 Current; Look at the top 5 cards, take 2 cards, and put the rest on the bottom',
    rarity: 'Epic',
    artKey: 'es_oph_thyrvaan_net_expansion',
    effects: [{ type: 'seas_current_gain', value: 4 }, { type: 'look_top_take', look: 5, take: 2 }],
  }),
  buildOphanim({
    definitionId: 'es-oph-crowncurrent-atlas',
    name: 'Crowncurrent Atlas',
    description: 'Gain 5 Current; Draw 1 card',
    rarity: 'Legendary',
    artKey: 'es_oph_crowncurrent_atlas',
    effects: [{ type: 'seas_current_gain', value: 7 }],
  }),
  buildOphanim({
    definitionId: 'es-oph-depthless-sounding',
    name: 'Depthless Sounding',
    description: 'Gain 5 Current; Release up to 3 Current (+125 Oblivion per current); Draw 2 cards',
    rarity: 'Legendary',
    artKey: 'es_oph_depthless_sounding',
    effects: [{ type: 'seas_current_gain', value: 5 }, { type: 'seas_release', spend: 3, oblivionPerCurrent: 125 }],
  })];

const baseAngels: AngelDefinition[] = [
  buildAngel({
    definitionId: 'es-angel-veilmargin-cartographer',
    name: 'Veilmargin Cartographer',
    description: 'On summon: Gain 4 Current; Draw 1 card. After 2 cards played: Shift polarity to White; Shift polarity to Black; Gain 2 Current. While on board: +40 Oblivion per card played while on board',
    rarity: 'Rare',
    artKey: 'es_angel_veilmargin_cartographer',
    summonCost: ['es-ser-velthiri-bloomschool', 'es-ser-kethavar-helixhunter'],
    onSummonEffects: [{ type: 'seas_current_gain', value: 6 }],
    activatedAbility: {
      name: 'Trace Margin',
      cardsPlayedRequirement: 2,
      description: 'Shift polarity to White; Shift polarity to Black; Gain 2 Current',
      effects: [{ type: 'seas_polarity_shift', polarity: 'White' }, { type: 'seas_polarity_shift', polarity: 'Black' }, { type: 'seas_current_gain', value: 2 }],
    },
    primaryName: 'Boundary Cleave',
    exaltedName: 'Veilmargin Verdict',
    primaryBase: 418,
    exaltedBase: 738,
    primaryCooldown: 4,
    exaltedCooldown: 6,
    primaryScaling: 1.24,
    exaltedScaling: 1.42,
    baseStats: { basePower: 58, bonusType: 'oblivion_per_card', bonusValue: 40 },
  }),
  buildAngel({
    definitionId: 'es-angel-neon-ocean-herald',
    name: 'Neon Ocean Herald',
    description: 'On summon: Gain 4 Current. After 2 cards played: Release up to 2 Current (+110 Oblivion per current). While on board: +22 Oblivion for each Seraphim on board while on board',
    rarity: 'Rare',
    artKey: 'es_angel_neon_ocean_herald',
    summonCost: ['es-ser-surevaan-tiltborne', 'es-ser-thyrvaan-fractalbreath'],
    onSummonEffects: [{ type: 'seas_current_gain', value: 4 }],
    activatedAbility: {
      name: 'Signal in Static',
      cardsPlayedRequirement: 2,
      description: 'Release up to 2 Current (+110 Oblivion per current)',
      effects: [{ type: 'seas_release', spend: 2, oblivionPerCurrent: 110 }],
    },
    primaryName: 'Signal Arc',
    exaltedName: 'Chromatic Edict',
    primaryBase: 430,
    exaltedBase: 758,
    primaryCooldown: 4,
    exaltedCooldown: 6,
    primaryScaling: 1.24,
    exaltedScaling: 1.43,
    baseStats: { basePower: 62, bonusType: 'oblivion_per_seraphim', bonusValue: 22 },
  }),
  buildAngel({
    definitionId: 'es-angel-crowned-one-ruby',
    name: 'Crowned One, Ruby Margin',
    description: 'On summon: Gain 5 Current; Shift polarity to White; +180 Oblivion. After 3 cards played: Shift polarity to White; Release up to 3 Current (+120 Oblivion per current). While on board: +18 Oblivion per card played while on board',
    rarity: 'Epic',
    artKey: 'es_angel_crowned_one_ruby',
    summonCost: ['es-ser-null-leviathan-sign', 'es-ser-veilmargin-harbinger'],
    onSummonEffects: [{ type: 'seas_current_gain', value: 5 }, { type: 'seas_polarity_shift', polarity: 'White' }, { type: 'oblivion_flat', value: 180 }],
    activatedAbility: {
      name: 'Ruby Convergence',
      cardsPlayedRequirement: 3,
      description: 'Shift polarity to White; Release up to 3 Current (+120 Oblivion per current)',
      effects: [{ type: 'seas_polarity_shift', polarity: 'White' }, { type: 'seas_release', spend: 3, oblivionPerCurrent: 120 }],
    },
    primaryName: 'Ruby Surge',
    exaltedName: 'Crowned Tidebreak',
    primaryBase: 520,
    exaltedBase: 912,
    primaryCooldown: 5,
    exaltedCooldown: 7,
    primaryScaling: 1.29,
    exaltedScaling: 1.46,
    baseStats: { basePower: 74, bonusType: 'oblivion_per_card', bonusValue: 18 },
  }),
  buildAngel({
    definitionId: 'es-angel-crowned-one-azure',
    name: 'Crowned One, Azure Margin',
    description: 'On summon: Gain 5 Current; Shift polarity to Black. After 3 cards played: Shift polarity to Black; Release up to 3 Current (+120 Oblivion per current). While on board: +50 Oblivion per card played while on board',
    rarity: 'Epic',
    artKey: 'es_angel_crowned_one_azure',
    summonCost: ['es-ser-ossiveth-naur-ridgebody', 'es-ser-veleth-itself-echo'],
    onSummonEffects: [{ type: 'seas_current_gain', value: 5 }, { type: 'seas_polarity_shift', polarity: 'Black' }],
    activatedAbility: {
      name: 'Azure Convergence',
      cardsPlayedRequirement: 3,
      description: 'Shift polarity to Black; Release up to 3 Current (+120 Oblivion per current)',
      effects: [{ type: 'seas_polarity_shift', polarity: 'Black' }, { type: 'seas_release', spend: 3, oblivionPerCurrent: 120 }],
    },
    primaryName: 'Azure Surge',
    exaltedName: 'Abyss Crownbreak',
    primaryBase: 532,
    exaltedBase: 928,
    primaryCooldown: 5,
    exaltedCooldown: 7,
    primaryScaling: 1.3,
    exaltedScaling: 1.47,
    baseStats: { basePower: 78, bonusType: 'oblivion_per_card', bonusValue: 50 },
  }),
  buildAngel({
    definitionId: 'es-angel-aeveleth-remembered',
    name: 'Aeveleth Remembered',
    description: 'On summon: Gain 7 Current; Empower the next card you play. After 4 cards played: Release up to 5 Current (+145 Oblivion per current). While on board: +34 Oblivion for each Seraphim on board while on board',
    rarity: 'Legendary',
    artKey: 'es_angel_aeveleth_remembered',
    summonCost: ['es-ser-ossiveth-naur-ridgebody', 'es-ser-veleth-itself-echo'],
    onSummonEffects: [{ type: 'seas_current_gain', value: 7 }, { type: 'multiply_next' }],
    activatedAbility: {
      name: 'Primordial Revision',
      cardsPlayedRequirement: 4,
      description: 'Release up to 5 Current (+145 Oblivion per current)',
      effects: [{ type: 'seas_release', spend: 5, oblivionPerCurrent: 145 }],
    },
    primaryName: 'Revision Cut',
    exaltedName: 'Before-Water Verdict',
    primaryBase: 680,
    exaltedBase: 1198,
    primaryCooldown: 6,
    exaltedCooldown: 8,
    primaryScaling: 1.33,
    exaltedScaling: 1.5,
    baseStats: { basePower: 92, bonusType: 'oblivion_per_seraphim', bonusValue: 34 },
  }),
  buildAngel({
    definitionId: 'es-angel-veleth-undying-water',
    name: 'Veleth, Undying Water',
    description: 'On summon: Gain 8 Current; Shift polarity to White; Shift polarity to Black. After 4 cards played: Release up to 7 Current (+165 Oblivion per current). While on board: +14 power for each Seraphim on board while on board',
    rarity: 'Legendary',
    artKey: 'es_angel_veleth_undying_water',
    summonCost: ['es-ser-veleth-itself-echo', 'es-ser-null-leviathan-sign'],
    onSummonEffects: [{ type: 'seas_current_gain', value: 8 }, { type: 'seas_polarity_shift', polarity: 'White' }, { type: 'seas_polarity_shift', polarity: 'Black' }],
    activatedAbility: {
      name: 'Undying Confluence',
      cardsPlayedRequirement: 4,
      description: 'Release up to 7 Current (+165 Oblivion per current)',
      effects: [{ type: 'seas_release', spend: 7, oblivionPerCurrent: 165 }],
    },
    primaryName: 'Ocean Edict',
    exaltedName: 'Undying Confluence',
    primaryBase: 702,
    exaltedBase: 1238,
    primaryCooldown: 6,
    exaltedCooldown: 8,
    primaryScaling: 1.34,
    exaltedScaling: 1.52,
    baseStats: { basePower: 98, bonusType: 'power_per_seraphim', bonusValue: 14 },
  })];

const eternalCards: CardDefinition[] = [
  buildSeraphim({
    definitionId: 'es-et-aeveleth-first-drift',
    name: 'Aeveleth, First Drift',
    description: 'On play: Gain 7 Current; Shift polarity to White; Release up to 3 Current (+140 Oblivion per current); Gain 2 Tide Echoes. While on board: +28 Oblivion per card played while active',
    rarity: 'Eternal',
    artKey: 'es_et_aeveleth_first_drift',
    bonusType: 'oblivion_per_card',
    bonusValue: 28,
    // Role: PASSIVE TIDE BATTERY (Seraphim Eternal). +2 tide, no resolve ?E
    // hoards Tide Echoes for downstream finishers. Sets White polarity.
    onPlayEffects: [{ type: 'seas_current_gain', value: 7 }, { type: 'seas_polarity_shift', polarity: 'White' }, { type: 'seas_release', spend: 3, oblivionPerCurrent: 140 }, { type: 'set_secondary_gain', kind: 'tide', value: 2 }],
    unsynergizedName: 'First Drift Break',
    synergizedName: 'Elder Margin Break',
    unsynergizedBase: 1010,
    synergizedBase: 1770,
    unsynergizedCooldown: 6,
    synergizedCooldown: 8,
  }),
  buildCherubim({
    definitionId: 'es-et-surevaan-anomaly-log',
    name: 'Surevaan Anomaly Log',
    description: 'On play: Gain 6 Current; Draw 2 cards; Gain 3 Tide Echoes. While on board: Seraphim bonuses are amplified by +0.14; Buffs Seraphim and Angel attacks: base +69, cooldown -1, multiplier x1.00; Buffs Angel attacks: base +54, cooldown -1, multiplier x1.00',
    rarity: 'Eternal',
    artKey: 'es_et_surevaan_anomaly_log',
    effects: [{ type: 'cherubim_seraphim_amp', value: 0.14 }],
    // Role: BACK-ROW TIDE BATTERY (Cherubim Eternal). +3 tide each play; no
    // resolve ?Ethe polarity-agnostic reservoir.
    onPlayEffects: [{ type: 'seas_current_gain', value: 10 }, { type: 'set_secondary_gain', kind: 'tide', value: 3 }],
  }),
  buildOphanim({
    definitionId: 'es-et-thyrvaan-oldlight-grid',
    name: 'Thyrvaan Oldlight Grid',
    description: 'Gain 6 Current; Shift polarity to Black; Gain 1 Tide Echo; Resolve up to 1 Tide Echoes (White polarity: +60 Oblivion per echo · Black polarity: +140.0 Oblivion per echo); Release up to 4 Current (+130 Oblivion per current); Gain 6 Prismatic Light; Draw 1 card',
    rarity: 'Eternal',
    artKey: 'es_et_thyrvaan_oldlight_grid',
    // Role: BLACK OBLIVION RESOLVER (Ophanim Eternal). Sets Black polarity then
    // resolves 1 Tide Echo ?Eprefers the oblivion route.
    effects: [{ type: 'seas_current_gain', value: 6 }, { type: 'seas_polarity_shift', polarity: 'Black' }, { type: 'set_secondary_gain', kind: 'tide', value: 1 }, { type: 'tide_echo_resolve', oblivionPerPositive: 60, oblivionPerNegative: 140, consume: 1 }, { type: 'seas_release', spend: 4, oblivionPerCurrent: 130 }],
  }),
  buildAngel({
    definitionId: 'es-et-crown-of-seven-margins',
    name: 'Crown of Seven Margins',
    description: 'On summon: Gain 7 Current; Shift polarity to White; Shift polarity to Black; Draw 1 card; Gain 2 Tide Echoes. After 3 cards played: Resolve all Tide Echoes (White polarity: +84 Oblivion per echo · Black polarity: +180.0 Oblivion per echo); Release up to 5 Current (+150 Oblivion per current). While on board: +50 Oblivion for each Seraphim on board while on board',
    rarity: 'Eternal',
    artKey: 'es_et_crown_of_seven_margins',
    summonCost: ['es-ser-veilmargin-harbinger', 'es-ser-ossiveth-naur-ridgebody'],
    onSummonEffects: [{ type: 'seas_current_gain', value: 9 }, { type: 'seas_polarity_shift', polarity: 'White' }, { type: 'seas_polarity_shift', polarity: 'Black' }, { type: 'set_secondary_gain', kind: 'tide', value: 2 }],
    // Apex Eternal Angel: activated ability resolves ALL banked tide echoes per
    // current polarity at the strongest Eternal coefficients.
    activatedAbility: {
      name: 'Sevenfold Margin',
      cardsPlayedRequirement: 3,
      description: 'Resolve all Tide Echoes (White polarity: +84 Oblivion per echo · Black polarity: +180.0 Oblivion per echo); Release up to 5 Current (+150 Oblivion per current)',
      effects: [{ type: 'tide_echo_resolve', oblivionPerPositive: 84, oblivionPerNegative: 180 }, { type: 'seas_release', spend: 5, oblivionPerCurrent: 150 }],
    },
    primaryName: 'Crownline Slash',
    exaltedName: 'Sevenfold Verdict',
    primaryBase: 940,
    exaltedBase: 1638,
    primaryCooldown: 6,
    exaltedCooldown: 8,
    primaryScaling: 1.38,
    exaltedScaling: 1.59,
    baseStats: { basePower: 110, bonusType: 'oblivion_per_seraphim', bonusValue: 50 },
  }),
  buildOphanim({
    definitionId: 'es-et-veleth-abyss-sounding',
    name: 'Veleth Abyss Sounding',
    description: 'Gain 8 Current; Gain 1 Tide Echo; Resolve up to 2 Tide Echoes (White polarity: +72 Oblivion per echo · Black polarity: +160.0 Oblivion per echo); Release up to 4 Current (+145 Oblivion per current); Draw 1 card',
    rarity: 'Eternal',
    artKey: 'es_et_veleth_abyss_sounding',
    // Role: TIDE ESCALATOR (Ophanim Eternal). +1 tide then resolves 2 banked
    // echoes at a mid coefficient ?Epolarity-aware finisher.
    effects: [{ type: 'seas_current_gain', value: 10 }, { type: 'set_secondary_gain', kind: 'tide', value: 1 }, { type: 'tide_echo_resolve', oblivionPerPositive: 72, oblivionPerNegative: 160, consume: 2 }, { type: 'seas_release', spend: 4, oblivionPerCurrent: 145 }],
  })];

const infinityCards: CardDefinition[] = [
  buildSeraphim({
    definitionId: 'es-inf-veleth-itself',
    name: 'Veleth Itself',
    description: 'On play: Gain 10 Current; Shift polarity to White; Shift polarity to Black; Gain 3 Tide Echoes; Resolve all Tide Echoes (White polarity: +108 Oblivion per echo · Black polarity: +240.0 Oblivion per echo); Release up to 6 Current (+185 Oblivion per current). While on board: +88 Oblivion per card played while active',
    rarity: 'Infinite',
    artKey: 'es_inf_veleth_itself',
    bonusType: 'oblivion_per_card',
    bonusValue: 88,
    // Role: APEX SERAPHIM TIDE FINISHER. +3 tide then resolves ALL banked echoes
    // at the strongest single Infinite Seraphim coefficients.
    onPlayEffects: [{ type: 'seas_current_gain', value: 10 }, { type: 'seas_polarity_shift', polarity: 'White' }, { type: 'seas_polarity_shift', polarity: 'Black' }, { type: 'set_secondary_gain', kind: 'tide', value: 3 }, { type: 'tide_echo_resolve', oblivionPerPositive: 108, oblivionPerNegative: 240 }, { type: 'seas_release', spend: 6, oblivionPerCurrent: 185 }],
    unsynergizedName: 'Total Depth Strike',
    synergizedName: 'World-Ocean Verdict',
    unsynergizedBase: 2060,
    synergizedBase: 3600,
    unsynergizedCooldown: 7,
    synergizedCooldown: 9,
  }),
  buildOphanim({
    definitionId: 'es-inf-water-that-was-always-there',
    name: 'Water That Was Always There',
    description: 'Gain 8 Current; Draw 2 cards; Shift polarity to White; Gain 3 Tide Echoes',
    rarity: 'Infinite',
    artKey: 'es_inf_water_that_was_always_there',
    // Role: PURE OPHANIM TIDE BATTERY (Infinite). +3 tide; no resolve.
    effects: [{ type: 'seas_current_gain', value: 12 }, { type: 'seas_polarity_shift', polarity: 'White' }, { type: 'set_secondary_gain', kind: 'tide', value: 3 }],
  }),
  buildCherubim({
    definitionId: 'es-inf-veilmargin-cathedral',
    name: 'Veilmargin Cathedral',
    description: 'On play: Gain 8 Current; Draw 1 card; Gain 4 Tide Echoes. While on board: Buffs Seraphim and Angel attacks: base +118; Seraphim bonuses are amplified by +0.2',
    rarity: 'Infinite',
    artKey: 'es_inf_veilmargin_cathedral',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 118 }, { type: 'cherubim_seraphim_amp', value: 0.2 }],
    // Role: BIG BACK-ROW TIDE BATTERY (Cherubim Infinite). +4 tide; no resolve.
    onPlayEffects: [{ type: 'seas_current_gain', value: 10 }, { type: 'set_secondary_gain', kind: 'tide', value: 4 }],
  }),
  buildAngel({
    definitionId: 'es-inf-seven-crowned-confluence',
    name: 'Seven Crowned Confluence',
    description: 'On summon: Gain 10 Current; Shift polarity to White; Shift polarity to Black; Empower the next card you play; Gain 3 Tide Echoes. After 4 cards played: Resolve all Tide Echoes (White polarity: +120 Oblivion per echo · Black polarity: +260.0 Oblivion per echo); Release up to 8 Current (+192 Oblivion per current). While on board: +26 power for each Seraphim on board while on board',
    rarity: 'Infinite',
    artKey: 'es_inf_seven_crowned_confluence',
    summonCost: ['es-ser-ossiveth-naur-ridgebody', 'es-ser-veleth-itself-echo'],
    onSummonEffects: [{ type: 'seas_current_gain', value: 10 }, { type: 'seas_polarity_shift', polarity: 'White' }, { type: 'seas_polarity_shift', polarity: 'Black' }, { type: 'multiply_next' }, { type: 'set_secondary_gain', kind: 'tide', value: 3 }],
    // Apex Infinite Angel: activated ability resolves ALL banked Tide Echoes at
    // the strongest single coefficient in the set.
    activatedAbility: {
      name: 'Crownwave Collapse',
      cardsPlayedRequirement: 4,
      description: 'Resolve all Tide Echoes (White polarity: +120 Oblivion per echo · Black polarity: +260.0 Oblivion per echo); Release up to 8 Current (+192 Oblivion per current)',
      effects: [{ type: 'tide_echo_resolve', oblivionPerPositive: 120, oblivionPerNegative: 260 }, { type: 'seas_release', spend: 8, oblivionPerCurrent: 192 }],
    },
    primaryName: 'Crowned Torrent',
    exaltedName: 'Confluence Collapse',
    primaryBase: 1970,
    exaltedBase: 3420,
    primaryCooldown: 7,
    exaltedCooldown: 9,
    primaryScaling: 1.58,
    exaltedScaling: 1.82,
    baseStats: { basePower: 158, bonusType: 'power_per_seraphim', bonusValue: 26 },
  }),
  buildOphanim({
    definitionId: 'es-inf-aeveleth-undying-revision',
    name: 'Aeveleth, Undying Revision',
    description: 'Gain 9 Current; Gain 2 Tide Echoes; Resolve up to 2 Tide Echoes (White polarity: +132 Oblivion per echo · Black polarity: +280.0 Oblivion per echo); Release up to 5 Current (+172 Oblivion per current); Draw 1 card',
    rarity: 'Infinite',
    artKey: 'es_inf_aeveleth_undying_revision',
    // Role: HIGH-COEFFICIENT PARTIAL OPHANIM (Infinite). +2 tide then resolves
    // 2 echoes at the strongest per-echo coefficient.
    effects: [{ type: 'seas_current_gain', value: 11 }, { type: 'set_secondary_gain', kind: 'tide', value: 2 }, { type: 'tide_echo_resolve', oblivionPerPositive: 132, oblivionPerNegative: 280, consume: 2 }, { type: 'seas_release', spend: 5, oblivionPerCurrent: 172 }],
  })];

export const eternalSeasCards: CardDefinition[] = [
  ...baseSeraphim,
  ...baseCherubim,
  ...baseOphanim,
  ...baseAngels,
  ...eternalCards,
  ...infinityCards];

export const eternalSeasPackPool = eternalSeasCards.map(card => card.definitionId);
