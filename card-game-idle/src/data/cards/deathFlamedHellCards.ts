import type { AngelDefinition, AttackCost, CardDefinition, CherubimDefinition, OphanimDefinition, SeraphimDefinition } from '@/types/cards';

// Death-flamed Hell - Funeral Procession + Veil Rite.
// Set #16. Base cards run the Funeral Procession loop (flip between veiled and revealed faces while building Pyre Embers and Cinder Crowns).
// Eternal and Infinite tiers share a single overlay: Veil Rite.
// Effects use generic primitives plus bespoke DFH payoffs (`dfh_crown_cashout` and the Veil Rite interactions).

const DEATH_FLAMED_HELL = 'DeathFlamedHell' as const;

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
  synergizedCooldown: number;
  unsynergizedCosts?: AttackCost[];
  synergizedCosts?: AttackCost[];
  unsynergizedDescription?: string;
  synergizedDescription?: string;
};

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
  primaryCosts?: AttackCost[];
  exaltedCosts?: AttackCost[];
  primaryScaling: number;
  exaltedScaling: number;
  baseStats: AngelDefinition['baseStats'];
  primaryDescription?: string;
  exaltedDescription?: string;
};

function buildSeraphim(spec: SeraphSpec): SeraphimDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Seraphim',
    element: DEATH_FLAMED_HELL,
    rarity: spec.rarity,
    name: spec.name,
    description: spec.description,
    artKey: spec.artKey,
    baseStats: {
      bonusType: spec.bonusType,
      bonusValue: spec.bonusValue,
      synergyRequirement: DEATH_FLAMED_HELL,
    },
    onPlayEffects: spec.onPlayEffects,
    attacks: {
      unsynergized: {
        id: `${spec.definitionId}:unsyn`,
        label: 'Unsynergized',
        name: spec.unsynergizedName,
        description: spec.unsynergizedDescription ?? 'Pyre-lit strike.',
        baseOblivion: spec.unsynergizedBase,
        cooldownCards: spec.unsynergizedCooldown,
        costs: spec.unsynergizedCosts ?? [],
      },
      synergized: {
        id: `${spec.definitionId}:syn`,
        label: 'Synergized',
        name: spec.synergizedName,
        description: spec.synergizedDescription ?? 'Ash-march verdict.',
        baseOblivion: spec.synergizedBase,
        cooldownCards: spec.synergizedCooldown,
        costs: spec.synergizedCosts ?? [],
        requiresAngelOnBoard: true,
      },
    },
  };
}

function buildCherubim(spec: CherubSpec): CherubimDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Cherubim',
    element: DEATH_FLAMED_HELL,
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
    element: DEATH_FLAMED_HELL,
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
    element: DEATH_FLAMED_HELL,
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
        description: spec.primaryDescription ?? 'Death-flame strike.',
        baseOblivion: spec.primaryBase,
        cooldownCards: spec.primaryCooldown,
        costs: spec.primaryCosts ?? [],
      },
      exalted: {
        id: `${spec.definitionId}:exalted`,
        label: 'Exalted',
        name: spec.exaltedName,
        description: spec.exaltedDescription ?? 'Pyre-throned verdict.',
        baseOblivion: spec.exaltedBase,
        cooldownCards: spec.exaltedCooldown,
        costs: spec.exaltedCosts ?? [],
      },
    },
    baseStats: spec.baseStats,
  };
}

// Seraphim (8).
const baseSeraphim: SeraphimDefinition[] = [
  buildSeraphim({
    definitionId: 'dfh-ser-soot-veiled-soldier',
    name: 'Soot-veiled Soldier',
    description: 'On play: Gain 3 Pyre Embers; If you control 1+ active Seraphim, Gain 1 Cinder Crown. While on board: +12 Oblivion per card played while active',
    rarity: 'Common',
    artKey: 'dfh_ser_soot_veiled_soldier',
    bonusType: 'oblivion_per_card',
    bonusValue: 12,
    onPlayEffects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 3 },
      {
        type: 'conditional',
        condition: { type: 'seraphim_active_gte', value: 1 },
        then: [{ type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
      },
    ],
    unsynergizedName: 'Soot Cut', synergizedName: 'Veiled March',
    unsynergizedBase: 664, synergizedBase: 778,
    unsynergizedCooldown: 3, synergizedCooldown: 5,
    unsynergizedDescription: '664 base Oblivion · 3 cards cooldown',
    synergizedDescription: '778 base Oblivion · 5 cards cooldown · Requires Angel',
  }),
  buildSeraphim({
    definitionId: 'dfh-ser-last-breath-standard-bearer',
    name: 'Last-breath Standard Bearer',
    description: 'On play: Gain 1 Pyre Ember; Gain 1 Cinder Crown; If you have played 1+ cards this turn, Gain 2 Pyre Embers. While on board: +22 Oblivion per card played while active',
    rarity: 'Common',
    artKey: 'dfh_ser_last_breath_standard_bearer',
    bonusType: 'oblivion_per_card',
    bonusValue: 22,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 1 }, { type: 'set_secondary_gain', kind: 'pyre', value: 1 }, { type: 'conditional', condition: { type: 'cards_played_gte', value: 1 }, then: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }] }],
    unsynergizedName: 'Standard Strike', synergizedName: 'Last-breath Verdict',
    unsynergizedBase: 746, synergizedBase: 893,
    unsynergizedCooldown: 4, synergizedCooldown: 6,
    unsynergizedDescription: '746 base Oblivion · 4 cards cooldown',
    synergizedDescription: '893 base Oblivion · 6 cards cooldown · Requires Angel',
  }),
  buildSeraphim({
    definitionId: 'dfh-ser-lullaby-forgot-censer',
    name: 'Lullaby-Forgot Censer',
    description: 'On play: Gain 2 Pyre Embers; Discard 1 card, then draw 1 card. While on board: +16 Oblivion per card played while active',
    rarity: 'Common',
    artKey: 'dfh_ser_lullaby_forgot_censer',
    bonusType: 'oblivion_per_card',
    bonusValue: 16,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'discard_draw', discard: 1, draw: 1 }],
    unsynergizedName: 'Lullaby Cut', synergizedName: 'Forgot Hymn',
    unsynergizedBase: 706, synergizedBase: 878,
    unsynergizedCooldown: 2, synergizedCooldown: 5,
    unsynergizedCosts: [{ type: 'discard_from_hand', value: 1 }],
    synergizedCosts: [{ type: 'discard_from_hand', value: 1 }],
    unsynergizedDescription: '706 base Oblivion · 2 cards cooldown · Cost: discard 1 card',
    synergizedDescription: '878 base Oblivion · 5 cards cooldown · Requires Angel · Cost: discard 1 card',
  }),
  buildSeraphim({
    definitionId: 'dfh-ser-ash-marrow-reaver',
    name: 'Ash-marrow Reaver',
    description: 'On play: Gain 2 Pyre Embers; Discard 1 card, then draw 1 card; If you have 3+ Pyre Embers, Gain 1 Cinder Crown. While on board: +18 Oblivion per card played while active',
    rarity: 'Rare',
    artKey: 'dfh_ser_ash_marrow_reaver',
    bonusType: 'oblivion_per_card',
    bonusValue: 18,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'discard_draw', discard: 1, draw: 1 }, { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'pyre', value: 3 }, then: [{ type: 'set_secondary_gain', kind: 'pyre', value: 1 }] }],
    unsynergizedName: 'Marrow Rend', synergizedName: 'Ash-Marrow Verdict',
    unsynergizedBase: 871, synergizedBase: 1094,
    unsynergizedCooldown: 4, synergizedCooldown: 8,
    unsynergizedDescription: '871 base Oblivion · 4 cards cooldown',
    synergizedDescription: '1094 base Oblivion · 8 cards cooldown · Requires Angel',
  }),
  buildSeraphim({
    definitionId: 'dfh-ser-choirhouse-cantor',
    name: 'Choirhouse Cantor',
    description: 'On play: Gain 4 Pyre Embers; If you have played 2+ cards this turn, Gain 1 Cinder Crown. While on board: +34 Oblivion per card played while active',
    rarity: 'Rare',
    artKey: 'dfh_ser_choirhouse_cantor',
    bonusType: 'oblivion_per_card',
    bonusValue: 34,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 4 }, { type: 'conditional', condition: { type: 'cards_played_gte', value: 2 }, then: [{ type: 'set_secondary_gain', kind: 'pyre', value: 1 }] }],
    unsynergizedName: 'Choir Note', synergizedName: 'Cantor Verdict',
    unsynergizedBase: 953, synergizedBase: 1181,
    unsynergizedCooldown: 5, synergizedCooldown: 8,
    unsynergizedDescription: '953 base Oblivion · 5 cards cooldown',
    synergizedDescription: '1181 base Oblivion · 8 cards cooldown · Requires Angel',
  }),
  buildSeraphim({
    definitionId: 'dfh-ser-pyrelungs-vassal',
    name: "Pyrelung's Vassal",
    description: 'On play: Gain 2 Pyre Embers; Gain 2 Cinder Crowns. While on board: +20 Oblivion per card played while active',
    rarity: 'Rare',
    artKey: 'dfh_ser_pyrelungs_vassal',
    bonusType: 'oblivion_per_card',
    bonusValue: 20,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }],
    unsynergizedName: 'Vassal Lash', synergizedName: 'Pyrelung Verdict',
    unsynergizedBase: 1037, synergizedBase: 1296,
    unsynergizedCooldown: 5, synergizedCooldown: 9,
    unsynergizedDescription: '1037 base Oblivion · 5 cards cooldown',
    synergizedDescription: '1296 base Oblivion · 9 cards cooldown · Requires Angel',
  }),
  buildSeraphim({
    definitionId: 'dfh-ser-sablecrown-herald',
    name: 'Sablecrown Herald',
    description: 'On play: Gain 5 Pyre Embers; Gain 2 Cinder Crowns. While on board: +24 Oblivion per card played while active',
    rarity: 'Epic',
    artKey: 'dfh_ser_sablecrown_herald',
    bonusType: 'oblivion_per_card',
    bonusValue: 24,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 5 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }],
    unsynergizedName: 'Sable Edict', synergizedName: 'Herald of the Crown',
    unsynergizedBase: 1286, synergizedBase: 1555,
    unsynergizedCooldown: 6, synergizedCooldown: 11,
    unsynergizedDescription: '1286 base Oblivion · 6 cards cooldown',
    synergizedDescription: '1555 base Oblivion · 11 cards cooldown · Requires Angel',
  }),
  buildSeraphim({
    definitionId: 'dfh-ser-khorr-vael-no-face',
    name: 'Khorr-vael, The No-face',
    description: 'On play: Gain 5 Pyre Embers; Gain 3 Cinder Crowns. While on board: +90 Oblivion per card played while active',
    rarity: 'Legendary',
    artKey: 'dfh_ser_khorr_vael_no_face',
    bonusType: 'oblivion_per_card',
    bonusValue: 90,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 5 }, { type: 'set_secondary_gain', kind: 'pyre', value: 3 }],
    unsynergizedName: 'No-face Strike', synergizedName: 'Faceless Verdict',
    unsynergizedBase: 1575, synergizedBase: 1901,
    unsynergizedCooldown: 8, synergizedCooldown: 13,
    unsynergizedDescription: '1575 base Oblivion · 8 cards cooldown',
    synergizedDescription: '1901 base Oblivion · 13 cards cooldown · Requires Angel',
  })];

// Cherubim (10).
const baseCherubim: CherubimDefinition[] = [
  buildCherubim({
    definitionId: 'dfh-cher-halo-cracked-novice',
    name: 'Halo-cracked Novice',
    description: 'On play: Gain 1 Pyre Ember; If you have played 1+ cards this turn, Gain 1 Pyre Ember. While on board: Buffs Seraphim and Angel attacks: base +18',
    rarity: 'Common',
    artKey: 'dfh_cher_halo_cracked_novice',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 18 }],
    onPlayEffects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 1 },
      {
        type: 'conditional',
        condition: { type: 'cards_played_gte', value: 1 },
        then: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 1 }],
      },
    ],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-marrow-pilgrim',
    name: 'Marrow-Pilgrim',
    description: 'On play: Gain 1 Pyre Ember; Gain 1 Cinder Crown; If you have played 1+ cards this turn, Gain 1 Cinder Crown. While on board: Buffs Seraphim and Angel attacks: base +20',
    rarity: 'Common',
    artKey: 'dfh_cher_marrow_pilgrim',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 20 }],
    onPlayEffects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 1 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 1 },
      {
        type: 'conditional',
        condition: { type: 'cards_played_gte', value: 1 },
        then: [{ type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
      },
    ],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-penitent-of-ash',
    name: 'Penitent of Ash',
    description: 'On play: Gain 2 Pyre Embers; Discard 1 card, then draw 1 card. While on board: Buffs Seraphim and Angel attacks: base +22',
    rarity: 'Common',
    artKey: 'dfh_cher_penitent_of_ash',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 22 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'discard_draw', discard: 1, draw: 1 }],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-stigmata-flame-confessor',
    name: 'Stigmata-flame Confessor',
    description: 'On play: Gain 2 Pyre Embers; Gain 1 Cinder Crown; If you have 1+ Veil Marks, Gain 1 Pyre Ember. While on board: Buffs Seraphim and Angel attacks: base +28',
    rarity: 'Rare',
    artKey: 'dfh_cher_stigmata_flame_confessor',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 28 }],
    onPlayEffects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 2 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 1 },
      {
        type: 'conditional',
        condition: { type: 'dfh_veil_marks_gte', value: 1 },
        then: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 1 }],
      },
    ],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-reliquary-of-the-last-tongue',
    name: 'Reliquary of the Last Tongue',
    description: 'On play: Gain 4 Pyre Embers; Discard 1 card, then draw 1 card; If you have played 2+ cards this turn, Gain 1 Cinder Crown. While on board: Buffs Seraphim and Angel attacks: base +30',
    rarity: 'Rare',
    artKey: 'dfh_cher_reliquary_of_the_last_tongue',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 30 }],
    onPlayEffects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 4 },
      { type: 'discard_draw', discard: 1, draw: 1 },
      {
        type: 'conditional',
        condition: { type: 'cards_played_gte', value: 2 },
        then: [{ type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
      },
    ],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-severed-sanctity-hierophant',
    name: 'Severed-sanctity Hierophant',
    description: 'On play: Gain 2 Pyre Embers; Gain 2 Cinder Crowns; Draw 1 card. While on board: Buffs Seraphim and Angel attacks: base +32',
    rarity: 'Rare',
    artKey: 'dfh_cher_severed_sanctity_hierophant',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 32 }],
    onPlayEffects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 2 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 2 },
      { type: 'draw', value: 1 },
    ],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-cathedral-anchorite',
    name: 'Cathedral Anchorite',
    description: 'On play: Gain 3 Pyre Embers; Gain 1 Cinder Crown. While on board: Buffs Seraphim and Angel attacks: base +44, cooldown -1, when you have 4+ Cinder Crowns',
    rarity: 'Epic',
    artKey: 'dfh_cher_cathedral_anchorite',
    effects: [
      {
        type: 'cherubim_attack_buff',
        targetUnitType: 'Any',
        bonusBaseOblivion: 44,
        cooldownDeltaCards: -1,
        condition: { type: 'set_secondary_gte', kind: 'pyre', value: 4 },
      },
    ],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 3 }, { type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-othraks-confessor',
    name: "Othrak's Confessor",
    description: 'On play: Gain 4 Pyre Embers; Gain 2 Cinder Crowns; Spend 2 Cinder Crowns; Gain 3 Pyre Embers. While on board: Buffs Seraphim and Angel attacks: base +42',
    rarity: 'Epic',
    artKey: 'dfh_cher_othraks_confessor',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 42 }],
    onPlayEffects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 4 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 2 },
      { type: 'set_secondary_spend', kind: 'pyre', value: 2 },
      { type: 'eternal_stack_gain', stack: 'pyre', value: 3 },
    ],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-cinder-saint-othrak',
    name: 'Cinder-saint, Othrak',
    description: 'On play: Gain 4 Pyre Embers; Gain 2 Cinder Crowns. While on board: Buffs Seraphim and Angel attacks: base +60, cooldown -1',
    rarity: 'Legendary',
    artKey: 'dfh_cher_cinder_saint_othrak',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 60, cooldownDeltaCards: -1 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 4 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-the-flayed-halo',
    name: 'The Flayed Halo',
    description: 'On play: Gain 4 Pyre Embers; Gain 3 Cinder Crowns; Discard 1 card, then draw 2 cards. While on board: All Oblivion gain +60%',
    rarity: 'Legendary',
    artKey: 'dfh_cher_the_flayed_halo',
    maxDurability: 9,
    effects: [{ type: 'cherubim_global_oblivion_mult', value: 0.60 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 4 }, { type: 'set_secondary_gain', kind: 'pyre', value: 3 }, { type: 'discard_draw', discard: 1, draw: 2 }],
  })];

// Ophanim (18).
const baseOphanim: OphanimDefinition[] = [
  buildOphanim({
    definitionId: 'dfh-oph-ash-petal-strewer',
    name: 'Ash-petal Strewer',
    description: 'Gain 3 Pyre Embers; If you have played 1+ cards this turn, Gain 1 Cinder Crown',
    rarity: 'Common',
    artKey: 'dfh_oph_ash_petal_strewer',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 3 },
      {
        type: 'conditional',
        condition: { type: 'cards_played_gte', value: 1 },
        then: [{ type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
      },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-bell-ringer-of-the-hollow',
    name: 'Bell-ringer of the Hollow',
    description: 'Gain 1 Pyre Ember; Gain 1 Cinder Crown; If you have 3+ Pyre Embers, Discard 1 card, then draw 1 card',
    rarity: 'Common',
    artKey: 'dfh_oph_bell_ringer_of_the_hollow',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 1 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 1 },
      {
        type: 'conditional',
        condition: { type: 'eternal_stack_gte', stack: 'pyre', value: 3 },
        then: [{ type: 'discard_draw', discard: 1, draw: 1 }],
      },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-bridegrooms-outrider',
    name: "Bridegroom's Outrider",
    description: 'Gain 2 Pyre Embers; Salvage 1 card matching Ophanim; If you have 2+ Cinder Crowns, Draw 1 card',
    rarity: 'Common',
    artKey: 'dfh_oph_bridegrooms_outrider',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'salvage_by_type', filter: ['Ophanim'] }, { type: 'conditional', condition: { type: 'set_secondary_gte', kind: 'pyre', value: 2 }, then: [{ type: 'draw', value: 1 }] }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-empty-aisle-walker',
    name: 'Empty-aisle Walker',
    description: 'Gain 2 Pyre Embers; Gain 1 Cinder Crown; Look at the top 2 cards, take 1 card, put 1 card on the bottom, and discard the rest',
    rarity: 'Common',
    artKey: 'dfh_oph_empty_aisle_walker',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'set_secondary_gain', kind: 'pyre', value: 1 }, { type: 'look_top_take_drop', look: 2, take: 1, drop: 1 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-pale-bridegrooms-page',
    name: "Pale Bridegroom's Page",
    description: 'Gain 1 Pyre Ember; Discard 1 card, then draw 2 cards; If this is the first card you played this turn, Gain 2 Pyre Embers',
    rarity: 'Common',
    artKey: 'dfh_oph_pale_bridegrooms_page',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 1 }, { type: 'discard_draw', discard: 1, draw: 2 }, { type: 'conditional', condition: { type: 'first_card_this_turn' }, then: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }] }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-veiled-censer-bearer',
    name: 'Veiled Censer-bearer',
    description: 'Gain 2 Pyre Embers; Draw 1 card; If you have played 1+ cards this turn, Gain 1 Cinder Crown',
    rarity: 'Common',
    artKey: 'dfh_oph_veiled_censer_bearer',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 2 },
      { type: 'draw', value: 1 },
      {
        type: 'conditional',
        condition: { type: 'cards_played_gte', value: 1 },
        then: [{ type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
      },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-wickless-litany',
    name: 'Wickless Litany',
    description: 'Gain 1 Pyre Ember; Gain 2 Cinder Crowns; Salvage 1 card matching Seraphim; If you have 4+ Cinder Crowns, Gain 2 Pyre Embers',
    rarity: 'Common',
    artKey: 'dfh_oph_wickless_litany',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 1 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 2 },
      { type: 'salvage_by_type', filter: ['Seraphim'] },
      {
        type: 'conditional',
        condition: { type: 'set_secondary_gte', kind: 'pyre', value: 4 },
        then: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }],
      },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-faceless-bridesmaid-choir',
    name: 'Faceless Bridesmaid Choir',
    description: 'Gain 4 Pyre Embers; Gain 1 Cinder Crown; If you control 1+ active Cherubim, Gain 1 Cinder Crown',
    rarity: 'Rare',
    artKey: 'dfh_oph_faceless_bridesmaid_choir',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 4 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 1 },
      {
        type: 'conditional',
        condition: { type: 'cherubim_active_gte', value: 1 },
        then: [{ type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
      },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-funeral-march-drummer',
    name: 'Funeral-march Drummer',
    description: 'Gain 3 Pyre Embers; If you have played 1+ cards this turn, Gain 2 Pyre Embers; If you have played 3+ cards this turn, Gain 1 Cinder Crown',
    rarity: 'Rare',
    artKey: 'dfh_oph_funeral_march_drummer',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 3 },
      {
        type: 'conditional',
        condition: { type: 'cards_played_gte', value: 1 },
        then: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }],
      },
      {
        type: 'conditional',
        condition: { type: 'cards_played_gte', value: 3 },
        then: [{ type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
      },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-hollowkings-vacant-page',
    name: "Hollowking's Vacant Page",
    description: 'Gain 3 Pyre Embers; Gain 2 Cinder Crowns; If you control 1+ active Seraphim, Draw 1 card',
    rarity: 'Rare',
    artKey: 'dfh_oph_hollowkings_vacant_page',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 3 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 2 },
      {
        type: 'conditional',
        condition: { type: 'seraphim_active_gte', value: 1 },
        then: [{ type: 'draw', value: 1 }],
      },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-procession-lantern-custodian',
    name: 'Procession-lantern Custodian',
    description: 'Gain 2 Pyre Embers; Gain 1 Cinder Crown; If you have 2+ Cinder Crowns, Salvage 1 card matching Cherubim',
    rarity: 'Rare',
    artKey: 'dfh_oph_procession_lantern_custodian',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 2 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 1 },
      {
        type: 'conditional',
        condition: { type: 'set_secondary_gte', kind: 'pyre', value: 2 },
        then: [{ type: 'salvage_by_type', filter: ['Cherubim'] }],
      },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-sablecrowns-letter-bearer',
    name: "Sablecrown's Letter-bearer",
    description: 'Gain 1 Pyre Ember; Gain 3 Cinder Crowns; Spend 1 Cinder Crown; Draw 1 card',
    rarity: 'Rare',
    artKey: 'dfh_oph_sablecrowns_letter_bearer',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 1 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 3 },
      { type: 'set_secondary_spend', kind: 'pyre', value: 1 },
      { type: 'draw', value: 1 },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-veil-stitcher',
    name: 'Veil-stitcher',
    description: 'Gain 2 Pyre Embers; Discard 1 card, then draw 2 cards; If you control 1+ active Seraphim, Gain 1 Cinder Crown',
    rarity: 'Rare',
    artKey: 'dfh_oph_veil_stitcher',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 2 },
      { type: 'discard_draw', discard: 1, draw: 2 },
      {
        type: 'conditional',
        condition: { type: 'seraphim_active_gte', value: 1 },
        then: [{ type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
      },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-choirhouse-conductor',
    name: 'Choirhouse Conductor',
    description: 'Gain 4 Pyre Embers; Gain 1 Cinder Crown; Draw 1 card; If you have 5+ Cinder Crowns, Gain 2 Pyre Embers',
    rarity: 'Epic',
    artKey: 'dfh_oph_choirhouse_conductor',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 4 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 1 },
      { type: 'draw', value: 1 },
      {
        type: 'conditional',
        condition: { type: 'set_secondary_gte', kind: 'pyre', value: 5 },
        then: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }],
      },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-hollow-throne-coronation',
    name: 'Hollow-throne Coronation',
    description: 'Gain 4 Pyre Embers; Gain 2 Cinder Crowns; Spend 2 Cinder Crowns',
    rarity: 'Epic',
    artKey: 'dfh_oph_hollow_throne_coronation',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 4 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 2 },
      { type: 'set_secondary_spend', kind: 'pyre', value: 2 },
      { type: 'eternal_stack_gain', stack: 'pyre', value: 4 },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-pyrelungs-exhalation',
    name: "Pyrelung's Exhalation",
    description: 'Gain 5 Pyre Embers; Discard 1 card, then draw 1 card; If you have 8+ Pyre Embers, Gain 1 Cinder Crown',
    rarity: 'Epic',
    artKey: 'dfh_oph_pyrelungs_exhalation',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 5 },
      { type: 'discard_draw', discard: 1, draw: 1 },
      {
        type: 'conditional',
        condition: { type: 'eternal_stack_gte', stack: 'pyre', value: 8 },
        then: [{ type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
      },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-wedding-that-wasnt-cantor',
    name: "Wedding-that-wasn't Cantor",
    description: 'Gain 4 Pyre Embers; Gain 3 Cinder Crowns; If you control 1+ active Seraphim, Gain 1 Cinder Crown',
    rarity: 'Epic',
    artKey: 'dfh_oph_wedding_that_wasnt_cantor',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 4 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 3 },
      {
        type: 'conditional',
        condition: { type: 'seraphim_active_gte', value: 1 },
        then: [{ type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
      },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-wedding-procession-living-world',
    name: 'The Wedding Procession Into the Living World',
    description: 'Gain 8 Pyre Embers; Gain 3 Cinder Crowns; If you have 10+ Pyre Embers, Cash out up to 3 Cinder Crowns (+110 Oblivion per crown)',
    rarity: 'Legendary',
    artKey: 'dfh_oph_wedding_procession_living_world',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 8 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 3 },
      {
        type: 'conditional',
        condition: { type: 'eternal_stack_gte', stack: 'pyre', value: 10 },
        then: [{ type: 'dfh_crown_cashout', oblivionPerCrown: 110, consume: 3 }],
      },
    ],
  })];

// Angels (4 Legendary + 1 special)
const baseAngels: AngelDefinition[] = [
  buildAngel({
    definitionId: 'dfh-ang-mournshade-the-wickless',
    name: 'Mournshade, The Wickless',
    description: 'On summon: Gain 4 Pyre Embers; Gain 2 Cinder Crowns. After 2 cards played: Gain 3 Pyre Embers; Discard 1 card, then draw 1 card; If you have played 1+ cards this turn, Gain 1 Cinder Crown. While on board: +9 Oblivion per card played while on board',
    rarity: 'Legendary',
    artKey: 'dfh_ang_mournshade_the_wickless',
    summonCost: ['dfh-ser-soot-veiled-soldier', 'dfh-ser-ash-marrow-reaver'],
    onSummonEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 4 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }],
    activatedAbility: {
      name: 'Wickless Pulse',
      cardsPlayedRequirement: 2,
      description: 'Gain 3 Pyre Embers; Discard 1 card, then draw 1 card; If you have played 1+ cards this turn, Gain 1 Cinder Crown',
      effects: [
        { type: 'eternal_stack_gain', stack: 'pyre', value: 3 },
        { type: 'discard_draw', discard: 1, draw: 1 },
        {
          type: 'conditional',
          condition: { type: 'cards_played_gte', value: 1 },
          then: [{ type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
        },
      ],
    },
    primaryName: 'Wickless Cut', exaltedName: 'Mournshade Verdict',
    primaryBase: 1238, exaltedBase: 2102,
    primaryCooldown: 8, exaltedCooldown: 13,
    primaryCosts: [{ type: 'discard_from_hand', value: 1 }],
    exaltedCosts: [{ type: 'discard_from_hand', value: 2 }],
    primaryDescription: '1238 base Oblivion · 8 cards cooldown · Cost: discard 1 card',
    exaltedDescription: '2102 base Oblivion · 13 cards cooldown · Cost: discard 2 cards',
    primaryScaling: 1.35, exaltedScaling: 1.53,
    baseStats: { basePower: 92, bonusType: 'oblivion_per_card', bonusValue: 9 },
  }),
  buildAngel({
    definitionId: 'dfh-ang-pyrelung-the-breathless',
    name: 'Pyrelung, The Breathless',
    description: 'On summon: Gain 5 Pyre Embers; Gain 3 Cinder Crowns. After 3 cards played: Gain 4 Pyre Embers; If you have 8+ Pyre Embers, Gain 1 Cinder Crown. While on board: +62 Oblivion per card played while on board',
    rarity: 'Legendary',
    artKey: 'dfh_ang_pyrelung_the_breathless',
    summonCost: ['dfh-ser-pyrelungs-vassal', 'dfh-ser-choirhouse-cantor'],
    onSummonEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 5 }, { type: 'set_secondary_gain', kind: 'pyre', value: 3 }],
    activatedAbility: {
      name: 'Breathless Exhale',
      cardsPlayedRequirement: 3,
      description: 'Gain 4 Pyre Embers; If you have 8+ Pyre Embers, Gain 1 Cinder Crown',
      effects: [
        { type: 'eternal_stack_gain', stack: 'pyre', value: 4 },
        {
          type: 'conditional',
          condition: { type: 'eternal_stack_gte', stack: 'pyre', value: 8 },
          then: [{ type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
        },
      ],
    },
    primaryName: 'Breathless Strike', exaltedName: 'Pyrelung Verdict',
    primaryBase: 1296, exaltedBase: 2189,
    primaryCooldown: 8, exaltedCooldown: 13,
    primaryCosts: [{ type: 'discard_from_hand', value: 1 }],
    exaltedCosts: [{ type: 'discard_from_hand', value: 2 }],
    primaryDescription: '1296 base Oblivion · 8 cards cooldown · Cost: discard 1 card',
    exaltedDescription: '2189 base Oblivion · 13 cards cooldown · Cost: discard 2 cards',
    primaryScaling: 1.36, exaltedScaling: 1.54,
    baseStats: { basePower: 98, bonusType: 'oblivion_per_card', bonusValue: 62 },
  }),
  buildAngel({
    definitionId: 'dfh-ang-sablecrown-the-unnamed',
    name: 'Sablecrown, The Unnamed',
    description: 'On summon: Gain 6 Pyre Embers; Gain 5 Cinder Crowns. After 3 cards played: Transmute up to 6 Cinder Crowns into Veil Marks (1 marks each); Cash out up to 8 Cinder Crowns (+130 Oblivion per crown). While on board: +11 Oblivion per card played while on board',
    rarity: 'Legendary',
    artKey: 'dfh_ang_sablecrown_the_unnamed',
    summonCost: ['dfh-ser-sablecrown-herald', 'dfh-ser-ash-marrow-reaver'],
    onSummonEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 6 }, { type: 'set_secondary_gain', kind: 'pyre', value: 5 }],
    activatedAbility: {
      name: 'Unnamed Coronation',
      cardsPlayedRequirement: 3,
      description: 'Transmute up to 6 Cinder Crowns into Veil Marks (1 marks each); Cash out up to 8 Cinder Crowns (+130 Oblivion per crown)',
      effects: [
        { type: 'dfh_veil_marks_transmute', source: 'crowns', consume: 6, marksPerResource: 1 },
        { type: 'dfh_crown_cashout', oblivionPerCrown: 130, consume: 8 },
      ],
    },
    primaryName: 'Sable Edict', exaltedName: 'Unnamed Verdict',
    primaryBase: 1354, exaltedBase: 2275,
    primaryCooldown: 8, exaltedCooldown: 14,
    primaryCosts: [{ type: 'discard_from_hand', value: 1 }],
    exaltedCosts: [{ type: 'discard_from_hand', value: 2 }],
    primaryDescription: '1354 base Oblivion · 8 cards cooldown · Cost: discard 1 card',
    exaltedDescription: '2275 base Oblivion · 14 cards cooldown · Cost: discard 2 cards',
    primaryScaling: 1.37, exaltedScaling: 1.55,
    baseStats: { basePower: 104, bonusType: 'oblivion_per_card', bonusValue: 11 },
  }),
  buildAngel({
    definitionId: 'dfh-ang-veil-iorn-the-faceless-bride',
    name: 'Veil-iorn, The Faceless Bride',
    description: 'On summon: Gain 6 Pyre Embers; Gain 4 Cinder Crowns. After 4 cards played: Gain 5 Pyre Embers; Gain 2 Cinder Crowns. While on board: +72 Oblivion per card played while on board',
    rarity: 'Legendary',
    artKey: 'dfh_ang_veil_iorn_the_faceless_bride',
    summonCost: ['dfh-ser-khorr-vael-no-face', 'dfh-ser-sablecrown-herald'],
    onSummonEffects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 6 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 4 },
    ],
    activatedAbility: {
      name: 'Bridal Veil',
      cardsPlayedRequirement: 4,
      description: 'Gain 5 Pyre Embers; Gain 2 Cinder Crowns',
      effects: [
        { type: 'eternal_stack_gain', stack: 'pyre', value: 5 },
        { type: 'set_secondary_gain', kind: 'pyre', value: 2 },
      ],
    },
    primaryName: 'Faceless Cut', exaltedName: 'Veil-iorn Verdict',
    primaryBase: 1382, exaltedBase: 2304,
    primaryCooldown: 9, exaltedCooldown: 14,
    primaryCosts: [{ type: 'discard_from_hand', value: 1 }],
    exaltedCosts: [{ type: 'discard_from_hand', value: 2 }],
    primaryDescription: '1382 base Oblivion · 9 cards cooldown · Cost: discard 1 card',
    exaltedDescription: '2304 base Oblivion · 14 cards cooldown · Cost: discard 2 cards',
    primaryScaling: 1.38, exaltedScaling: 1.56,
    baseStats: { basePower: 112, bonusType: 'oblivion_per_card', bonusValue: 72 },
  }),
  buildAngel({
    definitionId: 'dfh-ang-council-of-the-seven-choirs',
    name: 'Council of the Seven Choirs',
    description: 'On summon: Gain 8 Pyre Embers; Gain 6 Cinder Crowns. After 4 cards played: Cash out up to 12 Cinder Crowns (+170 Oblivion per crown). While on board: +14 Oblivion per card played while on board',
    rarity: 'Legendary',
    artKey: 'dfh_ang_council_of_the_seven_choirs',
    summonCost: ['dfh-ser-khorr-vael-no-face', 'dfh-ser-pyrelungs-vassal'],
    onSummonEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 8 }, { type: 'set_secondary_gain', kind: 'pyre', value: 6 }],
    activatedAbility: {
      name: 'Seven-Choir Verdict',
      cardsPlayedRequirement: 4,
      description: 'Cash out up to 12 Cinder Crowns (+170 Oblivion per crown)',
      effects: [{ type: 'dfh_crown_cashout', oblivionPerCrown: 170, consume: 12 }],
    },
    primaryName: 'Council Edict', exaltedName: 'Seven-Choir Apex',
    primaryBase: 1411, exaltedBase: 2333,
    primaryCooldown: 9, exaltedCooldown: 14,
    primaryCosts: [{ type: 'discard_from_hand', value: 1 }],
    exaltedCosts: [{ type: 'discard_from_hand', value: 2 }],
    primaryDescription: '1411 base Oblivion · 9 cards cooldown · Cost: discard 1 card',
    exaltedDescription: '2333 base Oblivion · 14 cards cooldown · Cost: discard 2 cards',
    primaryScaling: 1.40, exaltedScaling: 1.58,
    baseStats: { basePower: 124, bonusType: 'oblivion_per_card', bonusValue: 14 },
  })];

// Eternal (4)
const eternalCards: CardDefinition[] = [
  buildSeraphim({
    definitionId: 'dfh-et-skull-ceiling-garrison',
    name: 'Skull-ceiling Garrison',
    description: 'On play: Gain 6 Pyre Embers; Transmute up to 6 Pyre Embers into Veil Marks (1 marks each); synergized attack consumes up to 8 Veil Marks (+95 Oblivion per mark consumed). While on board: +13 Oblivion per card played while active',
    rarity: 'Eternal',
    artKey: 'dfh_et_skull_ceiling_garrison',
    bonusType: 'oblivion_per_card',
    bonusValue: 13,
    onPlayEffects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 6 },
      { type: 'dfh_veil_marks_transmute', source: 'pyre', consume: 6, marksPerResource: 1 },
      { type: 'dfh_veil_marks_attack_bonus', perMark: 95, consumeMax: 8, mode: 'synergized' },
    ],
    unsynergizedName: 'Garrison Strike', synergizedName: 'Skull-ceiling Verdict',
    unsynergizedBase: 2032, synergizedBase: 2275,
    unsynergizedCooldown: 9, synergizedCooldown: 14,
    unsynergizedCosts: [{ type: 'discard_from_hand', value: 1 }],
    synergizedCosts: [{ type: 'discard_from_hand', value: 2 }],
    unsynergizedDescription: '2032 base Oblivion · 9 cards cooldown · Cost: discard 1 card',
    synergizedDescription: '2275 base Oblivion · 14 cards cooldown · Requires Angel · Cost: discard 2 cards',
  }),
  buildCherubim({
    definitionId: 'dfh-et-othraks-eternal-communion',
    name: "Othrak's Eternal Communion",
    description: 'On play: Gain 7 Cinder Crowns; Transmute up to 7 Cinder Crowns into Veil Marks (1 marks each); If a DFH Angel is on board, cash out up to 5 Veil Marks (+180 Oblivion per mark). While on board: Buffs Seraphim and Angel attacks: base +80, cooldown -1',
    rarity: 'Eternal',
    artKey: 'dfh_et_othraks_eternal_communion',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 80, cooldownDeltaCards: -1 }],
    onPlayEffects: [
      { type: 'set_secondary_gain', kind: 'pyre', value: 7 },
      { type: 'dfh_veil_marks_transmute', source: 'crowns', consume: 7, marksPerResource: 1 },
      { type: 'dfh_angel_resonant_cashout', oblivionPerMark: 180, consume: 5 },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-et-crimson-ember-rain',
    name: 'Crimson Cinder-Rain',
    description: 'Gain 4 Cinder Crowns; Transmute up to 4 Cinder Crowns into Veil Marks (2 marks each); If you have 4+ Cinder Crowns, Cash out up to 6 Veil Marks (+205 Oblivion per mark); Draw 1 card',
    rarity: 'Eternal',
    artKey: 'dfh_et_crimson_ember_rain',
    effects: [
      { type: 'set_secondary_gain', kind: 'pyre', value: 4 },
      { type: 'dfh_veil_marks_transmute', source: 'crowns', consume: 4, marksPerResource: 2 },
      {
        type: 'conditional',
        condition: { type: 'set_secondary_gte', kind: 'pyre', value: 4 },
        then: [{ type: 'dfh_veil_marks_cashout', oblivionPerMark: 205, consume: 6 }],
      },
      { type: 'draw', value: 1 },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-et-eternal-procession-of-the-veiled',
    name: 'The Eternal Procession of the Veiled',
    description: 'Gain 8 Pyre Embers; Transmute up to 8 Pyre Embers into Veil Marks (1 marks each); Amplify current Veil Marks by x1.5; If you have 12+ Veil Marks, Cash out up to 4 Veil Marks (+220 Oblivion per mark)',
    rarity: 'Eternal',
    artKey: 'dfh_et_eternal_procession_of_the_veiled',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 8 },
      { type: 'dfh_veil_marks_transmute', source: 'pyre', consume: 8, marksPerResource: 1 },
      { type: 'dfh_veil_marks_amplify', factor: 1.5 },
      {
        type: 'conditional',
        condition: { type: 'dfh_veil_marks_gte', value: 12 },
        then: [{ type: 'dfh_veil_marks_cashout', oblivionPerMark: 220, consume: 4 }],
      },
    ],
  })];

// Infinite (4)
const infinityCards: CardDefinition[] = [
  buildSeraphim({
    definitionId: 'dfh-inf-vakhresh-marches-out',
    name: 'Vakhresh Marches Out',
    description: 'On play: Gain 14 Pyre Embers; Transmute up to 14 Pyre Embers into Veil Marks (1 marks each); Cash out up to 8 Veil Marks (+260 Oblivion per mark); Gain 6 Pyre Embers; synergized attack consumes up to 10 Veil Marks (+120 Oblivion per mark consumed). While on board: +30 Oblivion per card played while active',
    rarity: 'Infinite',
    artKey: 'dfh_inf_vakhresh_marches_out',
    bonusType: 'oblivion_per_card',
    bonusValue: 30,
    onPlayEffects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 14 },
      { type: 'dfh_veil_marks_transmute', source: 'pyre', consume: 14, marksPerResource: 1 },
      { type: 'dfh_veil_marks_cashout', oblivionPerMark: 260, consume: 8 },
      { type: 'eternal_stack_gain', stack: 'pyre', value: 6 },
      { type: 'dfh_veil_marks_attack_bonus', perMark: 120, consumeMax: 10, mode: 'synergized' },
    ],
    unsynergizedName: 'Vakhresh Marches', synergizedName: 'March of the Dead-flame',
    unsynergizedBase: 3069, synergizedBase: 3254,
    unsynergizedCooldown: 13, synergizedCooldown: 15,
    unsynergizedCosts: [{ type: 'discard_from_hand', value: 2 }],
    synergizedCosts: [{ type: 'discard_from_hand', value: 4 }],
    unsynergizedDescription: '3069 base Oblivion · 13 cards cooldown · Cost: discard 2 cards',
    synergizedDescription: '3254 base Oblivion · 15 cards cooldown · Requires Angel · Cost: discard 4 cards',
  }),
  buildCherubim({
    definitionId: 'dfh-inf-final-communion-of-halos',
    name: 'The Final Communion of Halos',
    description: 'On play: Gain 10 Cinder Crowns; Transmute up to 10 Cinder Crowns into Veil Marks (1 marks each); Amplify current Veil Marks by x2; If a DFH Angel is on board, cash out up to 8 Veil Marks (+235 Oblivion per mark). While on board: Buffs Seraphim and Angel attacks: base +200',
    rarity: 'Infinite',
    artKey: 'dfh_inf_final_communion_of_halos',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 200 }],
    onPlayEffects: [
      { type: 'set_secondary_gain', kind: 'pyre', value: 10 },
      { type: 'dfh_veil_marks_transmute', source: 'crowns', consume: 10, marksPerResource: 1 },
      { type: 'dfh_veil_marks_amplify', factor: 2 },
      { type: 'dfh_angel_resonant_cashout', oblivionPerMark: 235, consume: 8 },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-inf-bridal-procession-living-world',
    name: 'The Bridal Procession Reaches the Living World',
    description: 'Gain 10 Pyre Embers; Gain 4 Cinder Crowns; Transmute up to 10 Pyre Embers into Veil Marks (2 marks each); If you have 10+ Veil Marks, Cash out up to 10 Veil Marks (+230 Oblivion per mark)',
    rarity: 'Infinite',
    artKey: 'dfh_inf_bridal_procession_living_world',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 10 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 4 },
      { type: 'dfh_veil_marks_transmute', source: 'pyre', consume: 10, marksPerResource: 2 },
      {
        type: 'conditional',
        condition: { type: 'dfh_veil_marks_gte', value: 10 },
        then: [{ type: 'dfh_veil_marks_cashout', oblivionPerMark: 230, consume: 10 }],
      },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-inf-death-flame-escaping-upward',
    name: 'The Death-flame Escaping Upward',
    description: 'Gain 10 Cinder Crowns; Gain 5 Pyre Embers; Transmute all Cinder Crowns into Veil Marks (2 marks each); Cash out up to 12 Veil Marks (+300 Oblivion per mark)',
    rarity: 'Infinite',
    artKey: 'dfh_inf_death_flame_escaping_upward',
    effects: [
        { type: 'set_secondary_gain', kind: 'pyre', value: 10 },
        { type: 'eternal_stack_gain', stack: 'pyre', value: 5 },
      { type: 'dfh_veil_marks_transmute', source: 'crowns', marksPerResource: 2 },
      { type: 'dfh_veil_marks_cashout', oblivionPerMark: 300, consume: 12 }],
  })];

export const deathFlamedHellCards: CardDefinition[] = [
  ...baseSeraphim,
  ...baseCherubim,
  ...baseOphanim,
  ...baseAngels,
  ...eternalCards,
  ...infinityCards];

export const deathFlamedHellPackPool = deathFlamedHellCards.map(card => card.definitionId);
