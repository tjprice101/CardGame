import type { AngelDefinition, CherubimDefinition, OphanimDefinition, SeraphimDefinition } from '@/types/cards';
import type { SnowboundPhase } from '@/types/game';

type SnowboundSeraphimSpec = {
  definitionId: string;
  name: string;
  description: string;
  rarity: SeraphimDefinition['rarity'];
  phase: SnowboundPhase;
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
  synergizedCooldown: number;};

type SnowboundCherubimSpec = {
  definitionId: string;
  name: string;
  description: string;
  rarity: CherubimDefinition['rarity'];
  phase: SnowboundPhase;
  artKey: string;
  maxDurability: number;
  effects: CherubimDefinition['effects'];
  onPlayEffects: CherubimDefinition['onPlayEffects'];
};

type SnowboundOphanimSpec = {
  definitionId: string;
  name: string;
  description: string;
  rarity: OphanimDefinition['rarity'];
  phase: SnowboundPhase;
  artKey: string;
  effects: OphanimDefinition['effects'];
};

type SnowboundAngelSpec = {
  definitionId: string;
  name: string;
  description: string;
  rarity: AngelDefinition['rarity'];
  phase: SnowboundPhase;
  artKey: string;
  summonCost: string[];
  extraSummonConditions?: AngelDefinition['extraSummonConditions'];
  onSummonEffects: AngelDefinition['onSummonEffects'];
  activatedAbility: AngelDefinition['activatedAbility'];
  primaryName: string;
  primaryDescription: string;
  primaryBase: number;
  primaryCooldown: number;
  primaryScaling: number;
  exaltedName: string;
  exaltedDescription: string;
  exaltedBase: number;
  exaltedCooldown: number;
  exaltedScaling: number;
  baseStats: AngelDefinition['baseStats'];
};

function buildSeraphim(spec: SnowboundSeraphimSpec): SeraphimDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Seraphim',
    element: 'Mechanical',
    rarity: spec.rarity,
    snowboundPhase: spec.phase,
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
        tags: ['seraphim', 'unsynergized', 'mechanical', 'snowbound', 'voltage'],
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
        tags: ['seraphim', 'synergized', 'mechanical', 'snowbound', 'voltage'],
      },
    },
    baseStats: { bonusType: spec.bonusType, bonusValue: spec.bonusValue, synergyRequirement: 'Mechanical' },
    onPlayEffects: spec.onPlayEffects,
  };
}

function buildCherubim(spec: SnowboundCherubimSpec): CherubimDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Cherubim',
    element: 'Mechanical',
    rarity: spec.rarity,
    snowboundPhase: spec.phase,
    name: spec.name,
    description: spec.description,
    artKey: spec.artKey,
    effects: spec.effects,
    onPlayEffects: spec.onPlayEffects,
    maxDurability: spec.maxDurability,
  };
}

function buildOphanim(spec: SnowboundOphanimSpec): OphanimDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Ophanim',
    element: 'Mechanical',
    rarity: spec.rarity,
    snowboundPhase: spec.phase,
    name: spec.name,
    description: spec.description,
    artKey: spec.artKey,
    effects: spec.effects,
  };
}

function buildAngel(spec: SnowboundAngelSpec): AngelDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Angel',
    element: 'Mechanical',
    rarity: spec.rarity,
    snowboundPhase: spec.phase,
    name: spec.name,
    description: spec.description,
    artKey: spec.artKey,
    summonCost: spec.summonCost,
    extraSummonConditions: spec.extraSummonConditions,
    onSummonEffects: spec.onSummonEffects,
    activatedAbility: spec.activatedAbility,
    attacks: {
      primary: {
        id: `${spec.definitionId}:primary`,
        label: 'Primary',
        name: spec.primaryName,
        description: spec.primaryDescription,
        baseOblivion: spec.primaryBase,
        cooldownCards: spec.primaryCooldown,
        costs: [],
        tags: ['angel', 'primary', 'mechanical', 'snowbound', 'voltage'],
      },
      exalted: {
        id: `${spec.definitionId}:exalted`,
        label: 'Exalted',
        name: spec.exaltedName,
        description: spec.exaltedDescription,
        baseOblivion: spec.exaltedBase,
        cooldownCards: spec.exaltedCooldown,
        costs: [],
        tags: ['angel', 'exalted', 'mechanical', 'snowbound', 'voltage'],
      },
    },
    attackTags: ['mechanical', 'snowbound', 'voltage'],
    baseStats: spec.baseStats,
  };
}

const SNOWBOUND_SERAPHIM_SPECS: SnowboundSeraphimSpec[] = [
  {
    definitionId: 'sv-ser-frostcoil',
    name: 'Frostcoil Seraphim',
    description: 'Frost. On play: Gain 1 Strain; Gain 6 Arctic Charge. While on board: +10 Oblivion per card played while active',
    rarity: 'Common',
    phase: 'Frost',
    artKey: 'sv_ser_frostcoil',
    bonusType: 'oblivion_per_card',
    bonusValue: 10,
    onPlayEffects: [{ type: 'strain_gain', value: 1 }, { type: 'arctic_charge_gain', value: 6 }],
    unsynergizedName: 'Frostcoil Vector Break',
    synergizedName: 'Frostcoil Angelic Verdict',
    unsynergizedDescription: '210 base Oblivion · 4 cards cooldown',
    synergizedDescription: '357 base Oblivion · 5 cards cooldown · Requires Angel',
    unsynergizedBase: 210,
    synergizedBase: 357,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
  },
  {
    definitionId: 'sv-ser-static-sleet',
    name: 'Static Sleet Seraphim',
    description: 'Voltage. On play: Gain 1 Strain; Gain 2 Arctic Charge; Discharge Arctic Charge. While on board: +14 Oblivion whenever you play an Ophanim while active',
    rarity: 'Common',
    phase: 'Voltage',
    artKey: 'sv_ser_static_sleet',
    bonusType: 'ophanim_bonus',
    bonusValue: 14,
    onPlayEffects: [{ type: 'strain_gain', value: 1 }, { type: 'arctic_charge_gain', value: 2 }, { type: 'arctic_charge_discharge' }],
    unsynergizedName: 'Static Sleet Vector Break',
    synergizedName: 'Static Sleet Angelic Verdict',
    unsynergizedDescription: '228 base Oblivion · 4 cards cooldown',
    synergizedDescription: '387 base Oblivion · 5 cards cooldown · Requires Angel',
    unsynergizedBase: 228,
    synergizedBase: 387,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
  },
  {
    definitionId: 'sv-ser-glacier-relay',
    name: 'Glacier Relay Seraphim',
    description: 'Frost. On play: Gain 2 Radiance; Gain 5 Arctic Charge. While on board: +16 Oblivion per card played while active',
    rarity: 'Rare',
    phase: 'Frost',
    artKey: 'sv_ser_glacier_relay',
    bonusType: 'oblivion_per_card',
    bonusValue: 16,
    onPlayEffects: [{ type: 'radiance_gain', value: 2 }, { type: 'arctic_charge_gain', value: 5 }],
    unsynergizedName: 'Glacier Relay Vector Break',
    synergizedName: 'Glacier Relay Angelic Verdict',
    unsynergizedDescription: '352 base Oblivion · 4 cards cooldown',
    synergizedDescription: '598 base Oblivion · 5 cards cooldown · Requires Angel',
    unsynergizedBase: 352,
    synergizedBase: 598,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
  },
  {
    definitionId: 'sv-ser-icegrid',
    name: 'Icegrid Seraphim',
    description: 'Frost. On play: Draw 1 card; Gain 5 Arctic Charge. While on board: +18 Oblivion per card played while active',
    rarity: 'Rare',
    phase: 'Frost',
    artKey: 'sv_ser_icegrid',
    bonusType: 'oblivion_per_card',
    bonusValue: 18,
    onPlayEffects: [{ type: 'draw', value: 1 }, { type: 'arctic_charge_gain', value: 5 }],
    unsynergizedName: 'Icegrid Vector Break',
    synergizedName: 'Icegrid Angelic Verdict',
    unsynergizedDescription: '372 base Oblivion · 4 cards cooldown',
    synergizedDescription: '632 base Oblivion · 5 cards cooldown · Requires Angel',
    unsynergizedBase: 372,
    synergizedBase: 632,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
  },
  {
    definitionId: 'sv-ser-whiteout-engine',
    name: 'Whiteout Engine Seraphim',
    description: 'Voltage. On play: Gain 1 Strain; Discharge Arctic Charge. While on board: +24 Oblivion whenever you play an Ophanim while active',
    rarity: 'Epic',
    phase: 'Voltage',
    artKey: 'sv_ser_whiteout_engine',
    bonusType: 'ophanim_bonus',
    bonusValue: 24,
    onPlayEffects: [{ type: 'strain_gain', value: 1 }, { type: 'arctic_charge_discharge' }],
    unsynergizedName: 'Whiteout Engine Vector Break',
    synergizedName: 'Whiteout Engine Angelic Verdict',
    unsynergizedDescription: '548 base Oblivion · 5 cards cooldown',
    synergizedDescription: '931 base Oblivion · 6 cards cooldown · Requires Angel',
    unsynergizedBase: 548,
    synergizedBase: 931,
    unsynergizedCooldown: 5,
    synergizedCooldown: 6,
  },
  {
    definitionId: 'sv-ser-arctic-vector',
    name: 'Arctic Vector Seraphim',
    description: 'Frost. On play: Gain 2 Radiance; Gain 6 Arctic Charge. While on board: +15 Oblivion per card played while active',
    rarity: 'Epic',
    phase: 'Frost',
    artKey: 'sv_ser_arctic_vector',
    bonusType: 'oblivion_per_card',
    bonusValue: 15,
    onPlayEffects: [{ type: 'radiance_gain', value: 2 }, { type: 'arctic_charge_gain', value: 6 }],
    unsynergizedName: 'Arctic Vector Break',
    synergizedName: 'Arctic Vector Angelic Verdict',
    unsynergizedDescription: '560 base Oblivion · 5 cards cooldown',
    synergizedDescription: '952 base Oblivion · 6 cards cooldown · Requires Angel',
    unsynergizedBase: 560,
    synergizedBase: 952,
    unsynergizedCooldown: 5,
    synergizedCooldown: 6,
  },
  {
    definitionId: 'sv-ser-snow-lattice',
    name: 'Snow Lattice Seraphim',
    description: 'Frost. On play: Draw 1 card; Gain 10 Arctic Charge. While on board: +22 Oblivion per card played while active',
    rarity: 'Legendary',
    phase: 'Frost',
    artKey: 'sv_ser_snow_lattice',
    bonusType: 'oblivion_per_card',
    bonusValue: 22,
    onPlayEffects: [{ type: 'draw', value: 1 }, { type: 'arctic_charge_gain', value: 10 }],
    unsynergizedName: 'Snow Lattice Vector Break',
    synergizedName: 'Snow Lattice Angelic Verdict',
    unsynergizedDescription: '812 base Oblivion · 5 cards cooldown',
    synergizedDescription: '1380 base Oblivion · 6 cards cooldown · Requires Angel',
    unsynergizedBase: 812,
    synergizedBase: 1380,
    unsynergizedCooldown: 5,
    synergizedCooldown: 6,
  },
  {
    definitionId: 'sv-ser-polar-circuit',
    name: 'Polar Circuit Seraphim',
    description: 'Voltage. On play: Gain 2 Strain; +80 Oblivion; Discharge Arctic Charge. While on board: +20 Oblivion per card played while active',
    rarity: 'Legendary',
    phase: 'Voltage',
    artKey: 'sv_ser_polar_circuit',
    bonusType: 'oblivion_per_card',
    bonusValue: 20,
    onPlayEffects: [{ type: 'strain_gain', value: 2 }, { type: 'oblivion_flat', value: 80 }, { type: 'arctic_charge_discharge' }],
    unsynergizedName: 'Polar Circuit Vector Break',
    synergizedName: 'Polar Circuit Angelic Verdict',
    unsynergizedDescription: '840 base Oblivion · 5 cards cooldown',
    synergizedDescription: '1428 base Oblivion · 6 cards cooldown · Requires Angel',
    unsynergizedBase: 840,
    synergizedBase: 1428,
    unsynergizedCooldown: 5,
    synergizedCooldown: 6,
  }];

const SNOWBOUND_CHERUBIM_SPECS: SnowboundCherubimSpec[] = [
  {
    definitionId: 'sv-cher-polar-sanctum',
    name: 'The Polar Sanctum',
    description: 'Frost. On play: Gain 4 Strain; Gain 8 Arctic Charge. While on board: Gain 2 Strain per card played',
    rarity: 'Common',
    phase: 'Frost',
    artKey: 'sv_cher_polar_sanctum',
    maxDurability: 2,
    effects: [{ type: 'cherubim_resource_per_card', resource: 'strain', value: 2 }],
    onPlayEffects: [{ type: 'strain_gain', value: 4 }, { type: 'arctic_charge_gain', value: 8 }],
  },
  {
    definitionId: 'sv-cher-first-whiteout',
    name: 'The First Whiteout',
    description: 'Voltage. On play: +60 Oblivion; Gain 2 Strain; Discharge Arctic Charge. While on board: +12 Oblivion per card played',
    rarity: 'Common',
    phase: 'Voltage',
    artKey: 'sv_cher_first_whiteout',
    maxDurability: 3,
    effects: [{ type: 'cherubim_oblivion_per_card', value: 12 }],
    onPlayEffects: [{ type: 'oblivion_flat', value: 60 }, { type: 'strain_gain', value: 2 }, { type: 'arctic_charge_discharge' }],
  },
  {
    definitionId: 'sv-cher-cryoscale-engine',
    name: 'The Cryoscale Engine',
    description: 'Frost. On play: Gain 5 Strain; Gain 9 Arctic Charge. While on board: Gain 3 Strain per card played',
    rarity: 'Rare',
    phase: 'Frost',
    artKey: 'sv_cher_cryoscale_engine',
    maxDurability: 3,
    effects: [{ type: 'cherubim_resource_per_card', resource: 'strain', value: 3 }],
    onPlayEffects: [{ type: 'strain_gain', value: 5 }, { type: 'arctic_charge_gain', value: 9 }],
  },
  {
    definitionId: 'sv-cher-overcurrent-accord',
    name: 'The Overcurrent Accord',
    description: 'Voltage. On play: Gain 1 Radiance; +80 Oblivion; Discharge Arctic Charge. While on board: Buffs Angel attacks: base +36',
    rarity: 'Rare',
    phase: 'Voltage',
    artKey: 'sv_cher_overcurrent_accord',
    maxDurability: 3,
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Angel', targetDefinitionIds: [], targetTags: ['angel', 'snowbound'], bonusBaseOblivion: 36, cooldownDeltaCards: 0, multiplier: 1 }],
    onPlayEffects: [{ type: 'oblivion_flat', value: 80 }, { type: 'radiance_gain', value: 1 }, { type: 'arctic_charge_discharge' }],
  },
  {
    definitionId: 'sv-cher-station-nullpoint',
    name: 'Station Nullpoint',
    description: 'Frost. On play: Gain 4 Strain; Gain 10 Arctic Charge. While on board: Buffs Angel attacks: base +16, cooldown -1',
    rarity: 'Epic',
    phase: 'Frost',
    artKey: 'sv_cher_station_nullpoint',
    maxDurability: 4,
    effects: [{
      type: 'cherubim_attack_buff',
      targetUnitType: 'Angel',
      targetDefinitionIds: [],
      targetTags: ['angel', 'snowbound'],
      bonusBaseOblivion: 16,
      cooldownDeltaCards: -1,
      multiplier: 1,
    }],
    onPlayEffects: [{ type: 'strain_gain', value: 4 }, { type: 'arctic_charge_gain', value: 10 }],
  },
  {
    definitionId: 'sv-cher-aeldris',
    name: 'Aeldris, the Frosted Saint',
    description: 'Voltage. On play: Gain 4 Strain; +100 Oblivion; Discharge Arctic Charge. While on board: +14 Oblivion per card played',
    rarity: 'Epic',
    phase: 'Voltage',
    artKey: 'sv_cher_aeldris',
    maxDurability: 4,
    effects: [{ type: 'cherubim_oblivion_per_card', value: 14 }],
    onPlayEffects: [{ type: 'strain_gain', value: 4 }, { type: 'oblivion_flat', value: 100 }, { type: 'arctic_charge_discharge' }],
  },
  {
    definitionId: 'sv-cher-aurora-gate',
    name: 'The Aurora Gate',
    description: 'Frost. On play: Gain 10 Strain; Gain 12 Arctic Charge. While on board: All Oblivion gain +30%',
    rarity: 'Legendary',
    phase: 'Frost',
    artKey: 'sv_cher_aurora_gate',
    maxDurability: 8,
    effects: [{ type: 'cherubim_global_oblivion_mult', value: 0.30 }],
    onPlayEffects: [{ type: 'strain_gain', value: 10 }, { type: 'arctic_charge_gain', value: 12 }],
  },
  {
    definitionId: 'sv-cher-conductor-vael',
    name: 'Conductor Vael',
    description: 'Voltage. On play: Gain 6 Strain; +120 Oblivion; Discharge Arctic Charge. While on board: Ophanim plays gain +24 Oblivion',
    rarity: 'Legendary',
    phase: 'Voltage',
    artKey: 'sv_cher_conductor_vael',
    maxDurability: 4,
    effects: [{ type: 'cherubim_ophanim_bonus', value: 24 }],
    onPlayEffects: [{ type: 'strain_gain', value: 6 }, { type: 'oblivion_flat', value: 120 }, { type: 'arctic_charge_discharge' }],
  },
  {
    definitionId: 'sv-cher-last-transmission',
    name: 'The Last Transmission',
    description: 'Voltage. On play: Gain 4 Arctic Charge; Discharge Arctic Charge. While on board: +18 Oblivion per card played',
    rarity: 'Legendary',
    phase: 'Voltage',
    artKey: 'sv_cher_last_transmission',
    maxDurability: 4,
    effects: [{ type: 'cherubim_oblivion_per_card', value: 18 }],
    onPlayEffects: [{ type: 'arctic_charge_gain', value: 4 }, { type: 'arctic_charge_discharge' }],
  }];

const SNOWBOUND_OPHANIM_SPECS: SnowboundOphanimSpec[] = [
  {
    definitionId: 'sv-oph-sleetline-highway',
    name: 'The Sleetline Highway',
    description: 'Frost. Gain 2 Strain; Draw 1 card; Gain 6 Arctic Charge',
    rarity: 'Common',
    phase: 'Frost',
    artKey: 'sv_oph_sleetline_highway',
    effects: [{ type: 'strain_gain', value: 2 }, { type: 'draw', value: 1 }, { type: 'arctic_charge_gain', value: 6 }],
  },
  {
    definitionId: 'sv-oph-glacier-abyss',
    name: 'The Glacier Abyss',
    description: 'Voltage. Gain 2 Strain; Gain 3 Arctic Charge; +60 Oblivion; Discharge Arctic Charge',
    rarity: 'Common',
    phase: 'Voltage',
    artKey: 'sv_oph_glacier_abyss',
    effects: [{ type: 'strain_gain', value: 2 }, { type: 'arctic_charge_gain', value: 3 }, { type: 'oblivion_flat', value: 60 }, { type: 'arctic_charge_discharge' }],
  },
  {
    definitionId: 'sv-oph-static-archive',
    name: 'The Static Archive',
    description: 'Frost. Gain 2 Radiance; Draw 1 card; Gain 6 Arctic Charge',
    rarity: 'Rare',
    phase: 'Frost',
    artKey: 'sv_oph_static_archive',
    effects: [{ type: 'radiance_gain', value: 2 }, { type: 'draw', value: 1 }, { type: 'arctic_charge_gain', value: 6 }],
  },
  {
    definitionId: 'sv-oph-signal-collapse',
    name: 'The Signal Collapse',
    description: 'Frost. Draw 2 cards; Shuffle discard into deck; Gain 8 Arctic Charge',
    rarity: 'Rare',
    phase: 'Frost',
    artKey: 'sv_oph_signal_collapse',
    effects: [{ type: 'draw', value: 2 }, { type: 'shuffle_discard' }, { type: 'arctic_charge_gain', value: 8 }],
  },
  {
    definitionId: 'sv-oph-first-static',
    name: 'The First Static',
    description: 'Voltage. Gain 3 Strain; Gain 3 Arctic Charge; Discharge Arctic Charge',
    rarity: 'Epic',
    phase: 'Voltage',
    artKey: 'sv_oph_first_static',
    effects: [{ type: 'strain_gain', value: 3 }, { type: 'arctic_charge_gain', value: 3 }, { type: 'arctic_charge_discharge' }],
  },
  {
    definitionId: 'sv-oph-aurora-convergence',
    name: 'The Aurora Convergence',
    description: 'Voltage. Gain 2 Radiance; Gain 4 Arctic Charge; +80 Oblivion; Discharge Arctic Charge',
    rarity: 'Epic',
    phase: 'Voltage',
    artKey: 'sv_oph_aurora_convergence',
    effects: [{ type: 'radiance_gain', value: 2 }, { type: 'arctic_charge_gain', value: 4 }, { type: 'oblivion_flat', value: 80 }, { type: 'arctic_charge_discharge' }],
  },
  {
    definitionId: 'sv-oph-frostwalker-neis',
    name: 'Frostwalker Neis',
    description: 'Frost. Draw 3 cards; Gain 3 Strain; Gain 8 Arctic Charge',
    rarity: 'Legendary',
    phase: 'Frost',
    artKey: 'sv_oph_frostwalker_neis',
    effects: [{ type: 'draw', value: 3 }, { type: 'strain_gain', value: 3 }, { type: 'arctic_charge_gain', value: 8 }],
  },
  {
    definitionId: 'sv-oph-drifting-relay',
    name: 'The Drifting Relay',
    description: 'Voltage. Gain 4 Radiance; Draw 1 card; Gain 4 Arctic Charge; Discharge Arctic Charge',
    rarity: 'Legendary',
    phase: 'Voltage',
    artKey: 'sv_oph_drifting_relay',
    effects: [{ type: 'radiance_gain', value: 4 }, { type: 'draw', value: 1 }, { type: 'arctic_charge_gain', value: 4 }, { type: 'arctic_charge_discharge' }],
  }];

const SNOWBOUND_ANGEL_SPECS: SnowboundAngelSpec[] = [
  {
    definitionId: 'sv-angel-overcurrent-chorus',
    name: 'Overcurrent Chorus',
    description: 'Voltage. On summon: Gain 5 Strain; Gain 10 Arctic Charge. After 3 cards played: Gain 4 Arctic Charge; +80 Oblivion; Discharge Arctic Charge. While on board: +16 Oblivion per card played while on board',
    rarity: 'Common',
    phase: 'Voltage',
    artKey: 'sv_angel_overcurrent_chorus',
    summonCost: ['sv-ser-frostcoil', 'sv-ser-static-sleet'],
    onSummonEffects: [{ type: 'strain_gain', value: 5 }, { type: 'arctic_charge_gain', value: 10 }],
    activatedAbility: {
      name: 'Chorus Breaker',
      cardsPlayedRequirement: 3,
      description: 'Gain 4 Arctic Charge; +80 Oblivion; Discharge Arctic Charge',
      effects: [{ type: 'arctic_charge_gain', value: 4 }, { type: 'oblivion_flat', value: 80 }, { type: 'arctic_charge_discharge' }],
    },
    primaryName: 'Overcurrent Chorus Ordinance',
    primaryDescription: '392 base Oblivion · 3 cards cooldown',
    primaryBase: 392,
    primaryCooldown: 3,
    primaryScaling: 1.0,
    exaltedName: 'Overcurrent Chorus Throne Decree',
    exaltedDescription: '748 base Oblivion · 5 cards cooldown',
    exaltedBase: 748,
    exaltedCooldown: 5,
    exaltedScaling: 1.22,
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 16 },
  },
  {
    definitionId: 'sv-angel-whiteout-judicator',
    name: 'Whiteout Judicator',
    description: 'Voltage. On summon: +120 Oblivion; Gain 11 Arctic Charge. After 4 cards played: Gain 4 Arctic Charge; +100 Oblivion; Discharge Arctic Charge. While on board: +6 Oblivion per card played while on board',
    rarity: 'Rare',
    phase: 'Voltage',
    artKey: 'sv_angel_whiteout_judicator',
    summonCost: ['sv-angel-overcurrent-chorus', 'sv-ser-glacier-relay'],
    extraSummonConditions: [{ type: 'cherubim_active_gte', value: 1 }],
    onSummonEffects: [{ type: 'oblivion_flat', value: 120 }, { type: 'arctic_charge_gain', value: 11 }],
    activatedAbility: {
      name: 'Drift Verdict',
      cardsPlayedRequirement: 4,
      description: 'Gain 4 Arctic Charge; +100 Oblivion; Discharge Arctic Charge',
      effects: [ { type: 'arctic_charge_gain', value: 4 }, { type: 'oblivion_flat', value: 100 }, { type: 'arctic_charge_discharge' }],
    },
    primaryName: 'Whiteout Judicator Ordinance',
    primaryDescription: '470 base Oblivion · 4 cards cooldown',
    primaryBase: 470,
    primaryCooldown: 4,
    primaryScaling: 1.06,
    exaltedName: 'Whiteout Judicator Throne Decree',
    exaltedDescription: '922 base Oblivion · 6 cards cooldown',
    exaltedBase: 922,
    exaltedCooldown: 6,
    exaltedScaling: 1.28,
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 6 },
  },
  {
    definitionId: 'sv-angel-icebound-conductor',
    name: 'Icebound Conductor',
    description: 'Frost. On summon: Gain 14 Arctic Charge. After 4 cards played: Gain 1 Radiance; Gain 10 Arctic Charge. While on board: +18 Oblivion per card played while on board',
    rarity: 'Rare',
    phase: 'Frost',
    artKey: 'sv_angel_icebound_conductor',
    summonCost: ['sv-angel-whiteout-judicator', 'sv-ser-icegrid'],
    onSummonEffects: [{ type: 'arctic_charge_gain', value: 14 }],
    activatedAbility: {
      name: 'Frozen Current',
      cardsPlayedRequirement: 4,
      description: 'Gain 1 Radiance; Gain 10 Arctic Charge',
      effects: [{ type: 'radiance_gain', value: 1 }, { type: 'arctic_charge_gain', value: 10 }],
    },
    primaryName: 'Icebound Conductor Ordinance',
    primaryDescription: '486 base Oblivion · 4 cards cooldown',
    primaryBase: 486,
    primaryCooldown: 4,
    primaryScaling: 1.08,
    exaltedName: 'Icebound Conductor Throne Decree',
    exaltedDescription: '946 base Oblivion · 6 cards cooldown',
    exaltedBase: 946,
    exaltedCooldown: 6,
    exaltedScaling: 1.3,
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 18 },
  },
  {
    definitionId: 'sv-angel-voltage-patriarch',
    name: 'Voltage Patriarch',
    description: 'Voltage. On summon: +180 Oblivion; Gain 14 Arctic Charge. After 5 cards played: Gain 8 Arctic Charge; +220 Oblivion; Discharge Arctic Charge. While on board: +24 Oblivion per card played while on board',
    rarity: 'Legendary',
    phase: 'Voltage',
    artKey: 'sv_angel_voltage_patriarch',
    summonCost: ['sv-angel-icebound-conductor', 'sv-ser-polar-circuit', 'sv-ser-whiteout-engine'],
    extraSummonConditions: [{ type: 'cherubim_active_gte', value: 2 }],
    onSummonEffects: [{ type: 'oblivion_flat', value: 180 }, { type: 'arctic_charge_gain', value: 14 }],
    activatedAbility: {
      name: 'Grid of Winter',
      cardsPlayedRequirement: 5,
      description: 'Gain 8 Arctic Charge; +220 Oblivion; Discharge Arctic Charge',
      effects: [{ type: 'arctic_charge_gain', value: 8 }, { type: 'oblivion_flat', value: 220 }, { type: 'arctic_charge_discharge' }],
    },
    primaryName: 'Voltage Patriarch Ordinance',
    primaryDescription: '1062 base Oblivion · 5 cards cooldown',
    primaryBase: 1062,
    primaryCooldown: 5,
    primaryScaling: 1.24,
    exaltedName: 'Voltage Patriarch Throne Decree',
    exaltedDescription: '2436 base Oblivion · 7 cards cooldown',
    exaltedBase: 2436,
    exaltedCooldown: 7,
    exaltedScaling: 1.46,
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 24 },
  },
  {
    definitionId: 'sv-angel-neon-blizzard',
    name: 'Neon Blizzard',
    description: 'Voltage. On summon: +200 Oblivion; Gain 15 Arctic Charge. After 5 cards played: Gain 2 Strain; Gain 6 Arctic Charge; Discharge Arctic Charge. While on board: +28 Oblivion whenever you play an Ophanim while on board',
    rarity: 'Legendary',
    phase: 'Voltage',
    artKey: 'sv_angel_neon_blizzard',
    summonCost: ['sv-angel-voltage-patriarch', 'sv-cher-station-nullpoint', 'sv-cher-aeldris'],
    onSummonEffects: [{ type: 'oblivion_flat', value: 200 }, { type: 'arctic_charge_gain', value: 15 }],
    activatedAbility: {
      name: 'Aurora Spike',
      cardsPlayedRequirement: 5,
      description: 'Gain 2 Strain; Gain 6 Arctic Charge; Discharge Arctic Charge',
      effects: [{ type: 'strain_gain', value: 2 }, { type: 'arctic_charge_gain', value: 6 }, { type: 'arctic_charge_discharge' }],
    },
    primaryName: 'Neon Blizzard Ordinance',
    primaryDescription: '1098 base Oblivion · 5 cards cooldown',
    primaryBase: 1098,
    primaryCooldown: 5,
    primaryScaling: 1.24,
    exaltedName: 'Neon Blizzard Throne Decree',
    exaltedDescription: '2520 base Oblivion · 7 cards cooldown',
    exaltedBase: 2520,
    exaltedCooldown: 7,
    exaltedScaling: 1.46,
    baseStats: { basePower: 0, bonusType: 'ophanim_bonus', bonusValue: 28 },
  },
  {
    definitionId: 'sv-angel-polarity-throne',
    name: 'Polarity Throne',
    description: 'Voltage. On summon: Gain 3 Radiance; Gain 19 Arctic Charge. After 6 cards played: Gain 8 Arctic Charge; +240 Oblivion; Discharge Arctic Charge. While on board: +8 Oblivion per card played while on board',
    rarity: 'Legendary',
    phase: 'Voltage',
    artKey: 'sv_angel_polarity_throne',
    summonCost: ['sv-angel-voltage-patriarch', 'sv-ser-icegrid', 'sv-ser-snow-lattice'],
    extraSummonConditions: [{ type: 'cherubim_active_gte', value: 2 }],
    onSummonEffects: [{ type: 'radiance_gain', value: 3 }, { type: 'arctic_charge_gain', value: 19 }],
    activatedAbility: {
      name: 'Throne of Poles',
      cardsPlayedRequirement: 6,
      description: 'Gain 8 Arctic Charge; +240 Oblivion; Discharge Arctic Charge',
      effects: [{ type: 'arctic_charge_gain', value: 8 }, { type: 'oblivion_flat', value: 240 }, { type: 'arctic_charge_discharge' }],
    },
    primaryName: 'Polarity Throne Ordinance',
    primaryDescription: '1180 base Oblivion · 5 cards cooldown',
    primaryBase: 1180,
    primaryCooldown: 5,
    primaryScaling: 1.24,
    exaltedName: 'Polarity Throne Throne Decree',
    exaltedDescription: '2596 base Oblivion · 7 cards cooldown',
    exaltedBase: 2596,
    exaltedCooldown: 7,
    exaltedScaling: 1.46,
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 8 },
  }];

export const snowboundVoltageSeraphims = SNOWBOUND_SERAPHIM_SPECS.map(buildSeraphim);
export const snowboundVoltageCherubimCards = SNOWBOUND_CHERUBIM_SPECS.map(buildCherubim);
export const snowboundVoltageOphanimCards = SNOWBOUND_OPHANIM_SPECS.map(buildOphanim);
export const snowboundVoltageAngels = SNOWBOUND_ANGEL_SPECS.map(buildAngel);