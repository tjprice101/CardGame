import type { AngelDefinition, CherubimDefinition, OphanimDefinition, SeraphimDefinition } from '@/types/cards';

type SnowboundSeraphimSpec = {
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
  unsynergizedDescription: string;
  synergizedDescription: string;
  unsynergizedBase: number;
  synergizedBase: number;
  unsynergizedCooldown: number;
  synergizedCooldown: number;
  unsynergizedScaling: number;
  synergizedScaling: number;
};

type SnowboundCherubimSpec = {
  definitionId: string;
  name: string;
  description: string;
  rarity: CherubimDefinition['rarity'];
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
  artKey: string;
  effects: OphanimDefinition['effects'];
};

type SnowboundAngelSpec = {
  definitionId: string;
  name: string;
  description: string;
  rarity: AngelDefinition['rarity'];
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
        tags: ['seraphim', 'unsynergized', 'mechanical', 'snowbound', 'voltage'],
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
        chainScaling: spec.primaryScaling,
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
        chainScaling: spec.exaltedScaling,
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
    description: 'On play: Gain 1 Strain; Draw 1 card. While on board: +10 Oblivion per card played while active',
    rarity: 'Common',
    artKey: 'sv_ser_frostcoil',
    bonusType: 'oblivion_per_card',
    bonusValue: 10,
    onPlayEffects: [{ type: 'strain_gain', value: 1 }, { type: 'draw', value: 1 }, { type: 'arctic_charge_gain', value: 2 }],
    unsynergizedName: 'Frostcoil Vector Break',
    synergizedName: 'Frostcoil Angelic Verdict',
    unsynergizedDescription: '202 base Oblivion, 4 cards cooldown, x1.20 chain scaling, Cost: spend 1 Strain',
    synergizedDescription: '368 base Oblivion, 5 cards cooldown, x1.38 chain scaling, Angel required',
    unsynergizedBase: 210,
    synergizedBase: 357,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
    unsynergizedScaling: 1.18,
    synergizedScaling: 1.34,
  },
  {
    definitionId: 'sv-ser-static-sleet',
    name: 'Static Sleet Seraphim',
    description: 'On play: Gain 2 Strain. While on board: +14 Oblivion whenever you play an Ophanim while active',
    rarity: 'Common',
    artKey: 'sv_ser_static_sleet',
    bonusType: 'ophanim_bonus',
    bonusValue: 14,
    onPlayEffects: [{ type: 'strain_gain', value: 2 }, { type: 'arctic_charge_gain', value: 3 }],
    unsynergizedName: 'Static Sleet Vector Break',
    synergizedName: 'Static Sleet Angelic Verdict',
    unsynergizedDescription: '219 base Oblivion, 4 cards cooldown, x1.18 chain scaling, Cost: discard 1 card, spend 1 Strain',
    synergizedDescription: '399 base Oblivion, 5 cards cooldown, x1.41 chain scaling, Angel required',
    unsynergizedBase: 228,
    synergizedBase: 387,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
    unsynergizedScaling: 1.18,
    synergizedScaling: 1.34,
  },
  {
    definitionId: 'sv-ser-glacier-relay',
    name: 'Glacier Relay Seraphim',
    description: 'On play: Gain 1 Radiance; Amplify Chain by +1.25. While on board: Chain grows +0.05 per card played while active',
    rarity: 'Rare',
    artKey: 'sv_ser_glacier_relay',
    bonusType: 'chain_bonus',
    bonusValue: 0.05,
    onPlayEffects: [{ type: 'radiance_gain', value: 1 }, { type: 'set_chain_floor', value: 1.25 }, { type: 'arctic_charge_gain', value: 2 }],
    unsynergizedName: 'Glacier Relay Vector Break',
    synergizedName: 'Glacier Relay Angelic Verdict',
    unsynergizedDescription: '338 base Oblivion, 3 cards cooldown, x1.25 chain scaling, Cost: discard 1 card',
    synergizedDescription: '616 base Oblivion, 5 cards cooldown, x1.49 chain scaling, Angel required',
    unsynergizedBase: 352,
    synergizedBase: 598,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
    unsynergizedScaling: 1.24,
    synergizedScaling: 1.4,
  },
  {
    definitionId: 'sv-ser-icegrid',
    name: 'Icegrid Seraphim',
    description: 'On play: Draw 1 card. While on board: +18 Oblivion per card played while active',
    rarity: 'Rare',
    artKey: 'sv_ser_icegrid',
    bonusType: 'oblivion_per_card',
    bonusValue: 18,
    onPlayEffects: [{ type: 'draw', value: 1 }, { type: 'arctic_charge_gain', value: 2 }],
    unsynergizedName: 'Icegrid Vector Break',
    synergizedName: 'Icegrid Angelic Verdict',
    unsynergizedDescription: '357 base Oblivion, 4 cards cooldown, x1.25 chain scaling, Cost: spend 1 Strain',
    synergizedDescription: '651 base Oblivion, 5 cards cooldown, x1.44 chain scaling, Angel required',
    unsynergizedBase: 372,
    synergizedBase: 632,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
    unsynergizedScaling: 1.24,
    synergizedScaling: 1.4,
  },
  {
    definitionId: 'sv-ser-whiteout-engine',
    name: 'Whiteout Engine Seraphim',
    description: 'On play: Gain 2 Embers; Gain 1 Strain. While on board: +24 Oblivion whenever you play an Ophanim while active',
    rarity: 'Epic',
    artKey: 'sv_ser_whiteout_engine',
    bonusType: 'ophanim_bonus',
    bonusValue: 24,
    onPlayEffects: [{ type: 'strain_gain', value: 1 }, { type: 'arctic_charge_gain', value: 4 }],
    unsynergizedName: 'Whiteout Engine Vector Break',
    synergizedName: 'Whiteout Engine Angelic Verdict',
    unsynergizedDescription: '526 base Oblivion, 4 cards cooldown, x1.25 chain scaling, Cost: spend 2 Strain',
    synergizedDescription: '959 base Oblivion, 6 cards cooldown, x1.55 chain scaling, Angel required',
    unsynergizedBase: 548,
    synergizedBase: 931,
    unsynergizedCooldown: 5,
    synergizedCooldown: 6,
    unsynergizedScaling: 1.32,
    synergizedScaling: 1.48,
  },
  {
    definitionId: 'sv-ser-arctic-vector',
    name: 'Arctic Vector Seraphim',
    description: 'On play: Gain 2 Radiance. While on board: +15 Oblivion per card played while active',
    rarity: 'Epic',
    artKey: 'sv_ser_arctic_vector',
    bonusType: 'oblivion_per_card',
    bonusValue: 15,
    onPlayEffects: [{ type: 'radiance_gain', value: 2 }, { type: 'arctic_charge_gain', value: 4 }],
    unsynergizedName: 'Arctic Vector Break',
    synergizedName: 'Arctic Vector Angelic Verdict',
    unsynergizedDescription: '538 base Oblivion, 4 cards cooldown, x1.25 chain scaling, Cost: spend 1 Strain, discard 1 card',
    synergizedDescription: '980 base Oblivion, 6 cards cooldown, x1.52 chain scaling, Angel required',
    unsynergizedBase: 560,
    synergizedBase: 952,
    unsynergizedCooldown: 5,
    synergizedCooldown: 6,
    unsynergizedScaling: 1.32,
    synergizedScaling: 1.48,
  },
  {
    definitionId: 'sv-ser-snow-lattice',
    name: 'Snow Lattice Seraphim',
    description: 'On play: Draw 2 cards. While on board: Chain grows +0.06 per card played while active',
    rarity: 'Legendary',
    artKey: 'sv_ser_snow_lattice',
    bonusType: 'chain_bonus',
    bonusValue: 0.06,
    onPlayEffects: [{ type: 'draw', value: 2 }, { type: 'arctic_charge_gain', value: 5 }],
    unsynergizedName: 'Snow Lattice Vector Break',
    synergizedName: 'Snow Lattice Angelic Verdict',
    unsynergizedDescription: '780 base Oblivion, 3 cards cooldown, x1.25 chain scaling, Cost: discard 1 card',
    synergizedDescription: '1421 base Oblivion, 6 cards cooldown, x1.55 chain scaling, Angel required',
    unsynergizedBase: 812,
    synergizedBase: 1380,
    unsynergizedCooldown: 5,
    synergizedCooldown: 6,
    unsynergizedScaling: 1.4,
    synergizedScaling: 1.56,
  },
  {
    definitionId: 'sv-ser-polar-circuit',
    name: 'Polar Circuit Seraphim',
    description: 'On play: Gain 3 Strain. While on board: +20 Oblivion per card played while active',
    rarity: 'Legendary',
    artKey: 'sv_ser_polar_circuit',
    bonusType: 'oblivion_per_card',
    bonusValue: 20,
    onPlayEffects: [{ type: 'strain_gain', value: 3 }, { type: 'arctic_charge_gain', value: 5 }],
    unsynergizedName: 'Polar Circuit Vector Break',
    synergizedName: 'Polar Circuit Angelic Verdict',
    unsynergizedDescription: '806 base Oblivion, 4 cards cooldown, x1.25 chain scaling, Cost: spend 2 Strain, discard 1 card',
    synergizedDescription: '1470 base Oblivion, 6 cards cooldown, x1.55 chain scaling, Angel required',
    unsynergizedBase: 840,
    synergizedBase: 1428,
    unsynergizedCooldown: 5,
    synergizedCooldown: 6,
    unsynergizedScaling: 1.4,
    synergizedScaling: 1.56,
  },
];

const SNOWBOUND_CHERUBIM_SPECS: SnowboundCherubimSpec[] = [
  {
    definitionId: 'sv-cher-polar-sanctum',
    name: 'The Polar Sanctum',
    description: 'On play: Gain 4 Strain; Draw 1 card. While on board: Gain 2 Strain per card played; Buffs Angel attacks: base +26, chain scaling +0.06, cooldown +0, multiplier x1.00',
    rarity: 'Common',
    artKey: 'sv_cher_polar_sanctum',
    maxDurability: 2,
    effects: [{ type: 'cherubim_resource_per_card', resource: 'strain', value: 2 }],
    onPlayEffects: [{ type: 'strain_gain', value: 4 }, { type: 'draw', value: 1 }, { type: 'arctic_charge_gain', value: 5 }],
  },
  {
    definitionId: 'sv-cher-first-whiteout',
    name: 'The First Whiteout',
    description: 'On play: +40 Oblivion; Gain 2 Strain. While on board: +12 Oblivion per card played; Buffs Seraphim and Angel attacks: base +13, chain scaling +0.05, cooldown +0, multiplier x1.00',
    rarity: 'Common',
    artKey: 'sv_cher_first_whiteout',
    maxDurability: 3,
    effects: [{ type: 'cherubim_oblivion_per_card', value: 12 }],
    onPlayEffects: [{ type: 'oblivion_flat', value: 40 }, { type: 'strain_gain', value: 2 }, { type: 'arctic_charge_gain', value: 3 }],
  },
  {
    definitionId: 'sv-cher-cryoscale-engine',
    name: 'The Cryoscale Engine',
    description: 'On play: Gain 5 Strain; Draw 1 card. While on board: Gain 3 Strain per card played; Buffs Seraphim attacks: base +42, chain scaling +0.05, cooldown -1, multiplier x1.00',
    rarity: 'Rare',
    artKey: 'sv_cher_cryoscale_engine',
    maxDurability: 3,
    effects: [{ type: 'cherubim_resource_per_card', resource: 'strain', value: 3 }],
    onPlayEffects: [{ type: 'strain_gain', value: 5 }, { type: 'draw', value: 1 }, { type: 'arctic_charge_gain', value: 6 }],
  },
  {
    definitionId: 'sv-cher-overcurrent-accord',
    name: 'The Overcurrent Accord',
    description: 'On play: +60 Oblivion; Gain 1 Radiance. While on board: Chain grows +0.08 per card played; Buffs Angel attacks: base +36, chain scaling +0.02, cooldown +0, multiplier x1.00',
    rarity: 'Rare',
    artKey: 'sv_cher_overcurrent_accord',
    maxDurability: 3,
    effects: [{ type: 'cherubim_chain_bonus', value: 0.08 }],
    onPlayEffects: [{ type: 'oblivion_flat', value: 60 }, { type: 'radiance_gain', value: 1 }, { type: 'arctic_charge_gain', value: 3 }],
  },
  {
    definitionId: 'sv-cher-station-nullpoint',
    name: 'Station Nullpoint',
    description: 'On play: Draw 2 cards; Gain 4 Strain. While on board: Buffs Angel attacks: base +16, chain scaling +0.01, cooldown -1, multiplier x1.00',
    rarity: 'Epic',
    artKey: 'sv_cher_station_nullpoint',
    maxDurability: 4,
    effects: [{
      type: 'cherubim_attack_buff',
      targetUnitType: 'Angel',
      targetDefinitionIds: [],
      targetTags: ['angel', 'snowbound'],
      bonusBaseOblivion: 16,
      bonusChainScaling: 0.01,
      cooldownDeltaCards: -1,
      multiplier: 1,
    }],
    onPlayEffects: [{ type: 'draw', value: 2 }, { type: 'strain_gain', value: 4 }, { type: 'arctic_charge_gain', value: 5 }],
  },
  {
    definitionId: 'sv-cher-aeldris',
    name: 'Aeldris, the Frosted Saint',
    description: 'On play: Gain 6 Strain; +80 Oblivion. While on board: +14 Oblivion per card played; Buffs Seraphim and Angel attacks: base +15, chain scaling +0.07, cooldown +0, multiplier x1.00; Buffs Angel attacks: base +12, chain scaling +0.05, cooldown +0, multiplier x1.00',
    rarity: 'Epic',
    artKey: 'sv_cher_aeldris',
    maxDurability: 4,
    effects: [{ type: 'cherubim_oblivion_per_card', value: 14 }],
    onPlayEffects: [{ type: 'strain_gain', value: 6 }, { type: 'oblivion_flat', value: 80 }, { type: 'arctic_charge_gain', value: 7 }],
  },
  {
    definitionId: 'sv-cher-aurora-gate',
    name: 'The Aurora Gate',
    description: 'On play: Gain 10 Strain; Draw 1 card. While on board: If you control 2+ active Cherubim, this Cherubim grants +1.2 bonus power; Buffs Seraphim and Angel attacks: base +59, chain scaling +0.08, cooldown +0, multiplier x1.20; Buffs Angel attacks: base +46, chain scaling +0.06, cooldown -1, multiplier x1.15',
    rarity: 'Legendary',
    artKey: 'sv_cher_aurora_gate',
    maxDurability: 4,
    effects: [{ type: 'cherubim_conditional_buff', condition: { type: 'cherubim_active_gte', value: 2 }, value: 1.2 }],
    onPlayEffects: [{ type: 'strain_gain', value: 10 }, { type: 'draw', value: 1 }, { type: 'arctic_charge_gain', value: 8 }],
  },
  {
    definitionId: 'sv-cher-conductor-vael',
    name: 'Conductor Vael',
    description: 'On play: Gain 8 Strain; +100 Oblivion. While on board: Ophanim plays gain +24 Oblivion; Buffs Seraphim and Angel attacks: base +25, chain scaling +0.08, cooldown +0, multiplier x1.00; Buffs Angel attacks: base +20, chain scaling +0.06, cooldown -1, multiplier x1.00',
    rarity: 'Legendary',
    artKey: 'sv_cher_conductor_vael',
    maxDurability: 4,
    effects: [{ type: 'cherubim_ophanim_bonus', value: 24 }],
    onPlayEffects: [{ type: 'strain_gain', value: 8 }, { type: 'oblivion_flat', value: 100 }, { type: 'arctic_charge_gain', value: 8 }],
  },
  {
    definitionId: 'sv-cher-last-transmission',
    name: 'The Last Transmission',
    description: 'On play: Draw 2 cards; Amplify Chain by +1.4. While on board: +18 Oblivion per card played; Buffs Angel attacks: base +18, chain scaling +0.10, cooldown +0, multiplier x1.00; Buffs Angel attacks: base +14, chain scaling +0.07, cooldown -1, multiplier x1.00',
    rarity: 'Legendary',
    artKey: 'sv_cher_last_transmission',
    maxDurability: 4,
    effects: [{ type: 'cherubim_oblivion_per_card', value: 18 }],
    onPlayEffects: [{ type: 'draw', value: 2 }, { type: 'set_chain_floor', value: 1.4 }, { type: 'arctic_charge_gain', value: 4 }],
  },
];

const SNOWBOUND_OPHANIM_SPECS: SnowboundOphanimSpec[] = [
  {
    definitionId: 'sv-oph-sleetline-highway',
    name: 'The Sleetline Highway',
    description: 'Gain 2 Strain; Draw 1 card',
    rarity: 'Common',
    artKey: 'sv_oph_sleetline_highway',
    effects: [{ type: 'strain_gain', value: 2 }, { type: 'draw', value: 1 }, { type: 'arctic_charge_gain', value: 3 }],
  },
  {
    definitionId: 'sv-oph-glacier-abyss',
    name: 'The Glacier Abyss',
    description: 'Gain 3 Strain; Amplify Chain by +1.3; Gain 3 of your dominant resource; Draw 1 card',
    rarity: 'Common',
    artKey: 'sv_oph_glacier_abyss',
    effects: [{ type: 'strain_gain', value: 3 }, { type: 'set_chain_floor', value: 1.3 }, { type: 'arctic_charge_gain', value: 4 }],
  },
  {
    definitionId: 'sv-oph-static-archive',
    name: 'The Static Archive',
    description: 'Gain 2 Radiance; Draw 1 card',
    rarity: 'Rare',
    artKey: 'sv_oph_static_archive',
    effects: [{ type: 'radiance_gain', value: 2 }, { type: 'draw', value: 1 }, { type: 'arctic_charge_gain', value: 3 }],
  },
  {
    definitionId: 'sv-oph-signal-collapse',
    name: 'The Signal Collapse',
    description: 'Draw 2 cards; Shuffle discard into deck',
    rarity: 'Rare',
    artKey: 'sv_oph_signal_collapse',
    effects: [{ type: 'draw', value: 2 }, { type: 'shuffle_discard' }, { type: 'arctic_charge_gain', value: 2 }],
  },
  {
    definitionId: 'sv-oph-first-static',
    name: 'The First Static',
    description: 'Gain 4 Strain; Empower the next card you play; Amplify Chain by +1.4',
    rarity: 'Epic',
    artKey: 'sv_oph_first_static',
    effects: [{ type: 'strain_gain', value: 4 }, { type: 'multiply_next' }, { type: 'arctic_charge_gain', value: 5 }],
  },
  {
    definitionId: 'sv-oph-aurora-convergence',
    name: 'The Aurora Convergence',
    description: 'Gain 3 Radiance; Set chain multiplier to x1.6; Gain 5 of your dominant resource; Draw 1 card',
    rarity: 'Epic',
    artKey: 'sv_oph_aurora_convergence',
    effects: [{ type: 'radiance_gain', value: 3 }, { type: 'chain_multiplier_set', value: 1.6 }, { type: 'arctic_charge_gain', value: 5 }],
  },
  {
    definitionId: 'sv-oph-frostwalker-neis',
    name: 'Frostwalker Neis',
    description: 'Draw 3 cards; Gain 5 Strain',
    rarity: 'Legendary',
    artKey: 'sv_oph_frostwalker_neis',
    effects: [{ type: 'draw', value: 3 }, { type: 'strain_gain', value: 5 }, { type: 'arctic_charge_gain', value: 6 }],
  },
  {
    definitionId: 'sv-oph-drifting-relay',
    name: 'The Drifting Relay',
    description: 'Gain 5 Radiance; Draw 2 cards; Amplify Chain by +1.7',
    rarity: 'Legendary',
    artKey: 'sv_oph_drifting_relay',
    effects: [{ type: 'radiance_gain', value: 5 }, { type: 'draw', value: 2 }, { type: 'set_chain_floor', value: 1.7 }, { type: 'arctic_charge_gain', value: 6 }],
  },
];

const SNOWBOUND_ANGEL_SPECS: SnowboundAngelSpec[] = [
  {
    definitionId: 'sv-angel-overcurrent-chorus',
    name: 'Overcurrent Chorus',
    description: 'On summon: Gain 5 Strain; Draw 2 cards; Amplify Chain by +1.5. After 3 cards played: Draw 2 cards; +80 Oblivion. While on board: +16 Oblivion per card played while on board',
    rarity: 'Common',
    artKey: 'sv_angel_overcurrent_chorus',
    summonCost: ['sv-ser-frostcoil', 'sv-ser-static-sleet'],
    onSummonEffects: [{ type: 'strain_gain', value: 5 }, { type: 'draw', value: 2 }, { type: 'set_chain_floor', value: 1.5 }, { type: 'arctic_charge_gain', value: 6 }],
    activatedAbility: {
      name: 'Chorus Breaker',
      cardsPlayedRequirement: 3,
      description: 'Draw 2 cards; +80 Oblivion; Discharge Arctic Charge',
      effects: [{ type: 'draw', value: 2 }, { type: 'oblivion_flat', value: 80 }, { type: 'arctic_charge_discharge' }],
    },
    primaryName: 'Overcurrent Chorus Ordinance',
    primaryDescription: '392 base Oblivion, 3 cards cooldown, x1.00 chain scaling',
    primaryBase: 392,
    primaryCooldown: 3,
    primaryScaling: 1.0,
    exaltedName: 'Overcurrent Chorus Throne Decree',
    exaltedDescription: '764 base Oblivion, 5 cards cooldown, x1.22 chain scaling, Cost: spend 3 Strain',
    exaltedBase: 748,
    exaltedCooldown: 5,
    exaltedScaling: 1.22,
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 16 },
  },
  {
    definitionId: 'sv-angel-whiteout-judicator',
    name: 'Whiteout Judicator',
    description: 'On summon: Draw 3 cards; +120 Oblivion. After 4 cards played: Set chain multiplier to x2.0; Draw 2 cards; +100 Oblivion. While on board: Chain grows +0.06 per card played while on board',
    rarity: 'Rare',
    artKey: 'sv_angel_whiteout_judicator',
    summonCost: ['sv-angel-overcurrent-chorus', 'sv-ser-glacier-relay'],
    extraSummonConditions: [{ type: 'cherubim_active_gte', value: 1 }],
    onSummonEffects: [{ type: 'draw', value: 3 }, { type: 'oblivion_flat', value: 120 }, { type: 'arctic_charge_gain', value: 5 }],
    activatedAbility: {
      name: 'Drift Verdict',
      cardsPlayedRequirement: 4,
      description: 'Set chain multiplier to x2.0; Draw 2 cards; +100 Oblivion; Discharge Arctic Charge',
      effects: [{ type: 'chain_multiplier_set', value: 2.0 }, { type: 'draw', value: 2 }, { type: 'oblivion_flat', value: 100 }, { type: 'arctic_charge_discharge' }],
    },
    primaryName: 'Whiteout Judicator Ordinance',
    primaryDescription: '470 base Oblivion, 4 cards cooldown, x1.06 chain scaling',
    primaryBase: 470,
    primaryCooldown: 4,
    primaryScaling: 1.06,
    exaltedName: 'Whiteout Judicator Throne Decree',
    exaltedDescription: '922 base Oblivion, 6 cards cooldown, x1.28 chain scaling, Cost: spend 4 Strain',
    exaltedBase: 922,
    exaltedCooldown: 6,
    exaltedScaling: 1.28,
    baseStats: { basePower: 0, bonusType: 'chain_bonus', bonusValue: 0.06 },
  },
  {
    definitionId: 'sv-angel-icebound-conductor',
    name: 'Icebound Conductor',
    description: 'On summon: Draw 4 cards; Set chain multiplier to x1.8. After 4 cards played: Draw 3 cards; Gain 1 Radiance; Amplify Chain by +2.1. While on board: +18 Oblivion per card played while on board',
    rarity: 'Rare',
    artKey: 'sv_angel_icebound_conductor',
    summonCost: ['sv-angel-whiteout-judicator', 'sv-ser-icegrid'],
    onSummonEffects: [{ type: 'draw', value: 4 }, { type: 'chain_multiplier_set', value: 1.8 }, { type: 'arctic_charge_gain', value: 6 }],
    activatedAbility: {
      name: 'Frozen Current',
      cardsPlayedRequirement: 4,
      description: 'Draw 3 cards; Gain 1 Radiance; Amplify Chain by +2.1; Gain 3 Arctic Charge',
      effects: [{ type: 'draw', value: 3 }, { type: 'radiance_gain', value: 1 }, { type: 'set_chain_floor', value: 2.1 }, { type: 'arctic_charge_gain', value: 3 }],
    },
    primaryName: 'Icebound Conductor Ordinance',
    primaryDescription: '486 base Oblivion, 4 cards cooldown, x1.08 chain scaling',
    primaryBase: 486,
    primaryCooldown: 4,
    primaryScaling: 1.08,
    exaltedName: 'Icebound Conductor Throne Decree',
    exaltedDescription: '948 base Oblivion, 6 cards cooldown, x1.30 chain scaling, Cost: spend 4 Strain',
    exaltedBase: 946,
    exaltedCooldown: 6,
    exaltedScaling: 1.3,
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 18 },
  },
  {
    definitionId: 'sv-angel-voltage-patriarch',
    name: 'Voltage Patriarch',
    description: 'On summon: Draw 3 cards; +180 Oblivion; Amplify Chain by +1.9. After 5 cards played: Draw 4 cards; Empower the next card you play; +220 Oblivion. While on board: +24 Oblivion per card played while on board',
    rarity: 'Legendary',
    artKey: 'sv_angel_voltage_patriarch',
    summonCost: ['sv-angel-icebound-conductor', 'sv-ser-polar-circuit', 'sv-ser-thunder-arch'],
    extraSummonConditions: [{ type: 'cherubim_active_gte', value: 2 }],
    onSummonEffects: [{ type: 'draw', value: 3 }, { type: 'oblivion_flat', value: 180 }, { type: 'set_chain_floor', value: 1.9 }, { type: 'arctic_charge_gain', value: 8 }],
    activatedAbility: {
      name: 'Grid of Winter',
      cardsPlayedRequirement: 5,
      description: 'Draw 4 cards; Empower the next card you play; +220 Oblivion; Discharge Arctic Charge',
      effects: [{ type: 'draw', value: 4 }, { type: 'multiply_next' }, { type: 'oblivion_flat', value: 220 }, { type: 'arctic_charge_discharge' }],
    },
    primaryName: 'Voltage Patriarch Ordinance',
    primaryDescription: '1062 base Oblivion, 5 cards cooldown, x1.24 chain scaling',
    primaryBase: 1062,
    primaryCooldown: 5,
    primaryScaling: 1.24,
    exaltedName: 'Voltage Patriarch Throne Decree',
    exaltedDescription: '2436 base Oblivion, 7 cards cooldown, x1.46 chain scaling, Cost: spend 7 Strain',
    exaltedBase: 2436,
    exaltedCooldown: 7,
    exaltedScaling: 1.46,
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 24 },
  },
  {
    definitionId: 'sv-angel-neon-blizzard',
    name: 'Neon Blizzard',
    description: 'On summon: Draw 4 cards; +200 Oblivion. After 5 cards played: Draw 3 cards; Gain 2 Strain; Set chain multiplier to x2.3. While on board: +28 Oblivion whenever you play an Ophanim while on board',
    rarity: 'Legendary',
    artKey: 'sv_angel_neon_blizzard',
    summonCost: ['sv-angel-voltage-patriarch', 'sv-cher-station-nullpoint', 'sv-cher-aeldris'],
    onSummonEffects: [{ type: 'draw', value: 4 }, { type: 'oblivion_flat', value: 200 }, { type: 'arctic_charge_gain', value: 7 }],
    activatedAbility: {
      name: 'Aurora Spike',
      cardsPlayedRequirement: 5,
      description: 'Draw 3 cards; Gain 2 Strain; Set chain multiplier to x2.3; Discharge Arctic Charge',
      effects: [{ type: 'draw', value: 3 }, { type: 'strain_gain', value: 2 }, { type: 'chain_multiplier_set', value: 2.3 }, { type: 'arctic_charge_discharge' }],
    },
    primaryName: 'Neon Blizzard Ordinance',
    primaryDescription: '1098 base Oblivion, 5 cards cooldown, x1.24 chain scaling',
    primaryBase: 1098,
    primaryCooldown: 5,
    primaryScaling: 1.24,
    exaltedName: 'Neon Blizzard Throne Decree',
    exaltedDescription: '2520 base Oblivion, 7 cards cooldown, x1.46 chain scaling, Cost: spend 6 Strain',
    exaltedBase: 2520,
    exaltedCooldown: 7,
    exaltedScaling: 1.46,
    baseStats: { basePower: 0, bonusType: 'ophanim_bonus', bonusValue: 28 },
  },
  {
    definitionId: 'sv-angel-polarity-throne',
    name: 'Polarity Throne',
    description: 'On summon: Draw 5 cards; Set chain multiplier to x2.0. After 6 cards played: Draw 4 cards; +240 Oblivion; Empower the next card you play. While on board: Chain grows +0.08 per card played while on board',
    rarity: 'Legendary',
    artKey: 'sv_angel_polarity_throne',
    summonCost: ['sv-angel-voltage-patriarch', 'sv-ser-icegrid', 'sv-ser-snow-lattice'],
    extraSummonConditions: [{ type: 'cherubim_active_gte', value: 2 }],
    onSummonEffects: [{ type: 'draw', value: 5 }, { type: 'chain_multiplier_set', value: 2.0 }, { type: 'arctic_charge_gain', value: 9 }],
    activatedAbility: {
      name: 'Throne of Poles',
      cardsPlayedRequirement: 6,
      description: 'Draw 4 cards; +240 Oblivion; Empower the next card you play; Discharge Arctic Charge',
      effects: [{ type: 'draw', value: 4 }, { type: 'oblivion_flat', value: 240 }, { type: 'multiply_next' }, { type: 'arctic_charge_discharge' }],
    },
    primaryName: 'Polarity Throne Ordinance',
    primaryDescription: '1180 base Oblivion, 5 cards cooldown, x1.24 chain scaling',
    primaryBase: 1180,
    primaryCooldown: 5,
    primaryScaling: 1.24,
    exaltedName: 'Polarity Throne Throne Decree',
    exaltedDescription: '2596 base Oblivion, 7 cards cooldown, x1.46 chain scaling, Cost: spend 7 Strain',
    exaltedBase: 2596,
    exaltedCooldown: 7,
    exaltedScaling: 1.46,
    baseStats: { basePower: 0, bonusType: 'chain_bonus', bonusValue: 0.08 },
  },
];

export const snowboundVoltageSeraphims = SNOWBOUND_SERAPHIM_SPECS.map(buildSeraphim);
export const snowboundVoltageCherubimCards = SNOWBOUND_CHERUBIM_SPECS.map(buildCherubim);
export const snowboundVoltageOphanimCards = SNOWBOUND_OPHANIM_SPECS.map(buildOphanim);
export const snowboundVoltageAngels = SNOWBOUND_ANGEL_SPECS.map(buildAngel);