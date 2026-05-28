import type { AngelDefinition, CardDefinition, CherubimDefinition, OphanimDefinition, SeraphimDefinition } from '@/types/cards';

// ����������������������������������������������������������������������������������������������������������������������������������������������������������
// Death-flamed Hell ? "Pyre Ascendancy"
// ����������������������������������������������������������������������������������������������������������������������������������������������������������
//
// Set #16. Comes after Abyssal Forge. Core mechanic: every Pale Cohort play
// stokes Pyre Embers (eternalStacks['pyre']). Ritual extinguishings (sacrificing
// draws, discarding, "veiling" cards) mint Cinder Crowns (secondaryCounters['pyre']).
// Eternal cards cash out Pyre Embers via the generic eternal_stack_cashout
// primitive; Infinite cards detonate the dfh_crown_cashout finale (oblivion +
// chain per Cinder Crown), turning the brightest hell into the deadliest.
//
// All effects use generic primitives + the one bespoke `dfh_crown_cashout`
// for the secondary finale. No new TurnState fields required.

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
        description: 'Pyre-lit strike.',
        baseOblivion: spec.unsynergizedBase,
        cooldownCards: spec.unsynergizedCooldown,
        costs: [],
      },
      synergized: {
        id: `${spec.definitionId}:syn`,
        label: 'Synergized',
        name: spec.synergizedName,
        description: 'Ash-march verdict.',
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
        description: 'Death-flame strike.',
        baseOblivion: spec.primaryBase,
        cooldownCards: spec.primaryCooldown,
        costs: [],
      },
      exalted: {
        id: `${spec.definitionId}:exalted`,
        label: 'Exalted',
        name: spec.exaltedName,
        description: 'Pyre-throned verdict.',
        baseOblivion: spec.exaltedBase,
        cooldownCards: spec.exaltedCooldown,
        costs: [],
      },
    },
    baseStats: spec.baseStats,
  };
}

// ���� Seraphim (8) ������������������������������������������������������������������������������������������������������������������������
const baseSeraphim: SeraphimDefinition[] = [
  buildSeraphim({
    definitionId: 'dfh-ser-soot-veiled-soldier',
    name: 'Soot-veiled Soldier',
    description: 'On play: Gain 3 Pyre Embers. While on board: +10 Oblivion per card played while active',
    rarity: 'Common',
    artKey: 'dfh_ser_soot_veiled_soldier',
    bonusType: 'oblivion_per_card',
    bonusValue: 10,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 3 }],
    unsynergizedName: 'Soot Cut', synergizedName: 'Veiled March',
    unsynergizedBase: 230, synergizedBase: 404,
    unsynergizedCooldown: 4, synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'dfh-ser-last-breath-standard-bearer',
    name: 'Last-breath Standard Bearer',
    description: 'On play: Gain 1 Pyre Ember; Gain 1 Cinder Crown. While on board: +22 Oblivion per card played while active',
    rarity: 'Common',
    artKey: 'dfh_ser_last_breath_standard_bearer',
    bonusType: 'oblivion_per_card',
    bonusValue: 22,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 1 }, { type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
    unsynergizedName: 'Standard Strike', synergizedName: 'Last-breath Verdict',
    unsynergizedBase: 240, synergizedBase: 418,
    unsynergizedCooldown: 4, synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'dfh-ser-lullaby-forgot-censer',
    name: 'Lullaby-Forgot Censer',
    description: 'On play: Gain 2 Pyre Embers; Discard 1 card, then draw 1 card. While on board: +12 Oblivion per card played while active',
    rarity: 'Common',
    artKey: 'dfh_ser_lullaby_forgot_censer',
    bonusType: 'oblivion_per_card',
    bonusValue: 12,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'discard_draw', discard: 1, draw: 1 }],
    unsynergizedName: 'Lullaby Cut', synergizedName: 'Forgot Hymn',
    unsynergizedBase: 252, synergizedBase: 432,
    unsynergizedCooldown: 4, synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'dfh-ser-ash-marrow-reaver',
    name: 'Ash-marrow Reaver',
    description: 'On play: Gain 2 Pyre Embers; Gain 1 Cinder Crown. While on board: +14 Oblivion per card played while active',
    rarity: 'Rare',
    artKey: 'dfh_ser_ash_marrow_reaver',
    bonusType: 'oblivion_per_card',
    bonusValue: 14,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
    unsynergizedName: 'Marrow Rend', synergizedName: 'Ash-Marrow Verdict',
    unsynergizedBase: 360, synergizedBase: 620,
    unsynergizedCooldown: 4, synergizedCooldown: 6,
  }),
  buildSeraphim({
    definitionId: 'dfh-ser-choirhouse-cantor',
    name: 'Choirhouse Cantor',
    description: 'On play: Gain 5 Pyre Embers. While on board: +34 Oblivion per card played while active',
    rarity: 'Rare',
    artKey: 'dfh_ser_choirhouse_cantor',
    bonusType: 'oblivion_per_card',
    bonusValue: 34,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 5 }],
    unsynergizedName: 'Choir Note', synergizedName: 'Cantor Verdict',
    unsynergizedBase: 372, synergizedBase: 636,
    unsynergizedCooldown: 4, synergizedCooldown: 6,
  }),
  buildSeraphim({
    definitionId: 'dfh-ser-pyrelungs-vassal',
    name: "Pyrelung's Vassal",
    description: 'On play: Gain 2 Pyre Embers; Gain 2 Cinder Crowns. While on board: +16 Oblivion per card played while active',
    rarity: 'Rare',
    artKey: 'dfh_ser_pyrelungs_vassal',
    bonusType: 'oblivion_per_card',
    bonusValue: 16,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }],
    unsynergizedName: 'Vassal Lash', synergizedName: 'Pyrelung Verdict',
    unsynergizedBase: 384, synergizedBase: 652,
    unsynergizedCooldown: 4, synergizedCooldown: 6,
  }),
  buildSeraphim({
    definitionId: 'dfh-ser-sablecrown-herald',
    name: 'Sablecrown Herald',
    description: 'On play: Gain 6 Pyre Embers; Gain 2 Cinder Crowns. While on board: +20 Oblivion per card played while active',
    rarity: 'Epic',
    artKey: 'dfh_ser_sablecrown_herald',
    bonusType: 'oblivion_per_card',
    bonusValue: 20,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 6 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }],
    unsynergizedName: 'Sable Edict', synergizedName: 'Herald of the Crown',
    unsynergizedBase: 640, synergizedBase: 1108,
    unsynergizedCooldown: 5, synergizedCooldown: 7,
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
    unsynergizedBase: 920, synergizedBase: 1572,
    unsynergizedCooldown: 6, synergizedCooldown: 8,
  })];

// ���� Cherubim (10) ����������������������������������������������������������������������������������������������������������������������
const baseCherubim: CherubimDefinition[] = [
  buildCherubim({
    definitionId: 'dfh-cher-halo-cracked-novice',
    name: 'Halo-cracked Novice',
    description: 'On play: Gain 1 Pyre Ember. While on board: Buffs Seraphim and Angel attacks: base +18',
    rarity: 'Common',
    artKey: 'dfh_cher_halo_cracked_novice',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 18 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 1 }],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-marrow-pilgrim',
    name: 'Marrow-Pilgrim',
    description: 'On play: Gain 1 Pyre Ember; Gain 1 Cinder Crown. While on board: Buffs Seraphim and Angel attacks: base +20',
    rarity: 'Common',
    artKey: 'dfh_cher_marrow_pilgrim',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 20 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 1 }, { type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
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
    description: 'On play: Gain 2 Pyre Embers; Gain 1 Cinder Crown. While on board: Buffs Seraphim and Angel attacks: base +28',
    rarity: 'Rare',
    artKey: 'dfh_cher_stigmata_flame_confessor',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 28 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-reliquary-of-the-last-tongue',
    name: 'Reliquary of the Last Tongue',
    description: 'On play: Gain 5 Pyre Embers. While on board: Buffs Seraphim and Angel attacks: base +30',
    rarity: 'Rare',
    artKey: 'dfh_cher_reliquary_of_the_last_tongue',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 30 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 5 }],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-severed-sanctity-hierophant',
    name: 'Severed-sanctity Hierophant',
    description: 'On play: Gain 2 Pyre Embers; Gain 2 Cinder Crowns. While on board: Buffs Seraphim and Angel attacks: base +32',
    rarity: 'Rare',
    artKey: 'dfh_cher_severed_sanctity_hierophant',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 32 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-cathedral-anchorite',
    name: 'Cathedral Anchorite',
    description: 'On play: Gain 4 Pyre Embers; Gain 1 Cinder Crown. While on board: Buffs Seraphim and Angel attacks: base +44, cooldown -1',
    rarity: 'Epic',
    artKey: 'dfh_cher_cathedral_anchorite',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 44, cooldownDeltaCards: -1 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 4 }, { type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-othraks-confessor',
    name: "Othrak's Confessor",
    description: 'On play: Gain 5 Pyre Embers; Gain 2 Cinder Crowns. While on board: Buffs Seraphim and Angel attacks: base +42',
    rarity: 'Epic',
    artKey: 'dfh_cher_othraks_confessor',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 42 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 5 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-cinder-saint-othrak',
    name: 'Cinder-saint, Othrak',
    description: 'On play: Gain 5 Pyre Embers; Gain 3 Cinder Crowns. While on board: Buffs Seraphim and Angel attacks: base +60, cooldown -1',
    rarity: 'Legendary',
    artKey: 'dfh_cher_cinder_saint_othrak',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 60, cooldownDeltaCards: -1 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 5 }, { type: 'set_secondary_gain', kind: 'pyre', value: 3 }],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-the-flayed-halo',
    name: 'The Flayed Halo',
    description: 'On play: Gain 4 Pyre Embers; Gain 4 Cinder Crowns; Discard 1 card, then draw 2 cards. While on board: All Oblivion gain +76%',
    rarity: 'Legendary',
    artKey: 'dfh_cher_the_flayed_halo',
    maxDurability: 9,
    effects: [{ type: 'cherubim_global_oblivion_mult', value: 0.76 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 4 }, { type: 'set_secondary_gain', kind: 'pyre', value: 4 }, { type: 'discard_draw', discard: 1, draw: 2 }],
  })];

// ���� Ophanim (18) ������������������������������������������������������������������������������������������������������������������������
const baseOphanim: OphanimDefinition[] = [
  buildOphanim({
    definitionId: 'dfh-oph-ash-petal-strewer',
    name: 'Ash-petal Strewer',
    description: 'Gain 4 Pyre Embers',
    rarity: 'Common',
    artKey: 'dfh_oph_ash_petal_strewer',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 4 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-bell-ringer-of-the-hollow',
    name: 'Bell-ringer of the Hollow',
    description: 'Gain 1 Pyre Ember; Gain 1 Cinder Crown',
    rarity: 'Common',
    artKey: 'dfh_oph_bell_ringer_of_the_hollow',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 1 }, { type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-bridegrooms-outrider',
    name: "Bridegroom's Outrider",
    description: 'Gain 2 Pyre Embers',
    rarity: 'Common',
    artKey: 'dfh_oph_bridegrooms_outrider',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-empty-aisle-walker',
    name: 'Empty-aisle Walker',
    description: 'Gain 2 Pyre Embers; Gain 1 Cinder Crown',
    rarity: 'Common',
    artKey: 'dfh_oph_empty_aisle_walker',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-pale-bridegrooms-page',
    name: "Pale Bridegroom's Page",
    description: 'Gain 1 Pyre Ember; Discard 1 card, then draw 1 card',
    rarity: 'Common',
    artKey: 'dfh_oph_pale_bridegrooms_page',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 1 }, { type: 'discard_draw', discard: 1, draw: 1 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-veiled-censer-bearer',
    name: 'Veiled Censer-bearer',
    description: 'Gain 3 Pyre Embers',
    rarity: 'Common',
    artKey: 'dfh_oph_veiled_censer_bearer',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 3 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-wickless-litany',
    name: 'Wickless Litany',
    description: 'Gain 1 Pyre Ember; Gain 2 Cinder Crowns',
    rarity: 'Common',
    artKey: 'dfh_oph_wickless_litany',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 1 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-faceless-bridesmaid-choir',
    name: 'Faceless Bridesmaid Choir',
    description: 'Gain 5 Pyre Embers; Gain 1 Cinder Crown',
    rarity: 'Rare',
    artKey: 'dfh_oph_faceless_bridesmaid_choir',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 5 }, { type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-funeral-march-drummer',
    name: 'Funeral-march Drummer',
    description: 'Gain 4 Pyre Embers',
    rarity: 'Rare',
    artKey: 'dfh_oph_funeral_march_drummer',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 4 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-hollowkings-vacant-page',
    name: "Hollowking's Vacant Page",
    description: 'Gain 4 Pyre Embers; Gain 2 Cinder Crowns',
    rarity: 'Rare',
    artKey: 'dfh_oph_hollowkings_vacant_page',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 4 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-procession-lantern-custodian',
    name: 'Procession-lantern Custodian',
    description: 'Gain 3 Pyre Embers; Gain 1 Cinder Crown',
    rarity: 'Rare',
    artKey: 'dfh_oph_procession_lantern_custodian',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 3 }, { type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-sablecrowns-letter-bearer',
    name: "Sablecrown's Letter-bearer",
    description: 'Gain 2 Pyre Embers; Gain 3 Cinder Crowns',
    rarity: 'Rare',
    artKey: 'dfh_oph_sablecrowns_letter_bearer',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'set_secondary_gain', kind: 'pyre', value: 3 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-veil-stitcher',
    name: 'Veil-stitcher',
    description: 'Gain 3 Pyre Embers; Discard 1 card, then draw 2 cards',
    rarity: 'Rare',
    artKey: 'dfh_oph_veil_stitcher',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 3 }, { type: 'discard_draw', discard: 1, draw: 2 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-choirhouse-conductor',
    name: 'Choirhouse Conductor',
    description: 'Gain 6 Pyre Embers; Gain 2 Cinder Crowns',
    rarity: 'Epic',
    artKey: 'dfh_oph_choirhouse_conductor',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 6 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-hollow-throne-coronation',
    name: 'Hollow-throne Coronation',
    description: 'Gain 5 Pyre Embers; Gain 3 Cinder Crowns',
    rarity: 'Epic',
    artKey: 'dfh_oph_hollow_throne_coronation',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 5 }, { type: 'set_secondary_gain', kind: 'pyre', value: 3 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-pyrelungs-exhalation',
    name: "Pyrelung's Exhalation",
    description: 'Gain 6 Pyre Embers',
    rarity: 'Epic',
    artKey: 'dfh_oph_pyrelungs_exhalation',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 6 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-wedding-that-wasnt-cantor',
    name: "Wedding-that-wasn't Cantor",
    description: 'Gain 5 Pyre Embers; Gain 4 Cinder Crowns',
    rarity: 'Epic',
    artKey: 'dfh_oph_wedding_that_wasnt_cantor',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 5 }, { type: 'set_secondary_gain', kind: 'pyre', value: 4 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-wedding-procession-living-world',
    name: 'The Wedding Procession Into the Living World',
    description: 'Gain 10 Pyre Embers; Gain 4 Cinder Crowns',
    rarity: 'Legendary',
    artKey: 'dfh_oph_wedding_procession_living_world',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 10 }, { type: 'set_secondary_gain', kind: 'pyre', value: 4 }],
  })];

// ���� Angels (4 Legendary + 1 special) ��������������������������������������������������������������������������������
const baseAngels: AngelDefinition[] = [
  buildAngel({
    definitionId: 'dfh-ang-mournshade-the-wickless',
    name: 'Mournshade, The Wickless',
    description: 'On summon: Gain 4 Pyre Embers; Gain 2 Cinder Crowns. After 2 cards played: Gain 3 Pyre Embers; Gain 2 Cinder Crowns. While on board: +0.08 Oblivion per card played while on board',
    rarity: 'Legendary',
    artKey: 'dfh_ang_mournshade_the_wickless',
    summonCost: ['dfh-ser-soot-veiled-soldier', 'dfh-ser-ash-marrow-reaver'],
    onSummonEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 4 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }],
    activatedAbility: {
      name: 'Wickless Pulse',
      cardsPlayedRequirement: 2,
      description: 'Gain 3 Pyre Embers; Gain 2 Cinder Crowns',
      effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 3 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }],
    },
    primaryName: 'Wickless Cut', exaltedName: 'Mournshade Verdict',
    primaryBase: 720, exaltedBase: 1268,
    primaryCooldown: 6, exaltedCooldown: 8,
    primaryScaling: 1.35, exaltedScaling: 1.53,
    baseStats: { basePower: 92, bonusType: 'oblivion_per_card', bonusValue: 0.08 },
  }),
  buildAngel({
    definitionId: 'dfh-ang-pyrelung-the-breathless',
    name: 'Pyrelung, The Breathless',
    description: 'On summon: Gain 5 Pyre Embers; Gain 3 Cinder Crowns. After 3 cards played: Gain 4 Pyre Embers; Gain 3 Cinder Crowns. While on board: +56 Oblivion per card played while on board',
    rarity: 'Legendary',
    artKey: 'dfh_ang_pyrelung_the_breathless',
    summonCost: ['dfh-ser-pyrelungs-vassal', 'dfh-ser-choirhouse-cantor'],
    onSummonEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 5 }, { type: 'set_secondary_gain', kind: 'pyre', value: 3 }],
    activatedAbility: {
      name: 'Breathless Exhale',
      cardsPlayedRequirement: 3,
      description: 'Gain 4 Pyre Embers; Gain 3 Cinder Crowns',
      effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 4 }, { type: 'set_secondary_gain', kind: 'pyre', value: 3 }],
    },
    primaryName: 'Breathless Strike', exaltedName: 'Pyrelung Verdict',
    primaryBase: 738, exaltedBase: 1298,
    primaryCooldown: 6, exaltedCooldown: 8,
    primaryScaling: 1.36, exaltedScaling: 1.54,
    baseStats: { basePower: 98, bonusType: 'oblivion_per_card', bonusValue: 56 },
  }),
  buildAngel({
    definitionId: 'dfh-ang-sablecrown-the-unnamed',
    name: 'Sablecrown, The Unnamed',
    description: 'On summon: Gain 7 Pyre Embers; Gain 4 Cinder Crowns. After 3 cards played: Cash out up to 8 Cinder Crowns (+120 Oblivion per crown). While on board: +0.1 Oblivion per card played while on board',
    rarity: 'Legendary',
    artKey: 'dfh_ang_sablecrown_the_unnamed',
    summonCost: ['dfh-ser-sablecrown-herald', 'dfh-ser-ash-marrow-reaver'],
    onSummonEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 7 }, { type: 'set_secondary_gain', kind: 'pyre', value: 4 }],
    activatedAbility: {
      name: 'Unnamed Coronation',
      cardsPlayedRequirement: 3,
      description: 'Cash out up to 8 Cinder Crowns (+120 Oblivion per crown)',
      effects: [{ type: 'dfh_crown_cashout', oblivionPerCrown: 120, consume: 8 }],
    },
    primaryName: 'Sable Edict', exaltedName: 'Unnamed Verdict',
    primaryBase: 758, exaltedBase: 1330,
    primaryCooldown: 6, exaltedCooldown: 8,
    primaryScaling: 1.37, exaltedScaling: 1.55,
    baseStats: { basePower: 104, bonusType: 'oblivion_per_card', bonusValue: 0.10 },
  }),
  buildAngel({
    definitionId: 'dfh-ang-veil-iorn-the-faceless-bride',
    name: 'Veil-iorn, The Faceless Bride',
    description: 'On summon: Gain 6 Pyre Embers; Gain 5 Cinder Crowns. After 4 cards played: Gain 5 Pyre Embers; Gain 4 Cinder Crowns. While on board: +70 Oblivion per card played while on board',
    rarity: 'Legendary',
    artKey: 'dfh_ang_veil_iorn_the_faceless_bride',
    summonCost: ['dfh-ser-khorr-vael-no-face', 'dfh-ser-sablecrown-herald'],
    onSummonEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 6 }, { type: 'set_secondary_gain', kind: 'pyre', value: 5 }],
    activatedAbility: {
      name: 'Bridal Veil',
      cardsPlayedRequirement: 4,
      description: 'Gain 5 Pyre Embers; Gain 4 Cinder Crowns',
      effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 5 }, { type: 'set_secondary_gain', kind: 'pyre', value: 4 }],
    },
    primaryName: 'Faceless Cut', exaltedName: 'Veil-iorn Verdict',
    primaryBase: 780, exaltedBase: 1372,
    primaryCooldown: 6, exaltedCooldown: 8,
    primaryScaling: 1.38, exaltedScaling: 1.56,
    baseStats: { basePower: 112, bonusType: 'oblivion_per_card', bonusValue: 70 },
  }),
  buildAngel({
    definitionId: 'dfh-ang-council-of-the-seven-choirs',
    name: 'Council of the Seven Choirs',
    description: 'On summon: Gain 10 Pyre Embers; Gain 6 Cinder Crowns. After 4 cards played: Cash out up to 12 Cinder Crowns (+160 Oblivion per crown). While on board: +0.14 Oblivion per card played while on board',
    rarity: 'Legendary',
    artKey: 'dfh_ang_council_of_the_seven_choirs',
    summonCost: ['dfh-ser-khorr-vael-no-face', 'dfh-ser-pyrelungs-vassal'],
    onSummonEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 10 }, { type: 'set_secondary_gain', kind: 'pyre', value: 6 }],
    activatedAbility: {
      name: 'Seven-Choir Verdict',
      cardsPlayedRequirement: 4,
      description: 'Cash out up to 12 Cinder Crowns (+160 Oblivion per crown)',
      effects: [{ type: 'dfh_crown_cashout', oblivionPerCrown: 160, consume: 12 }],
    },
    primaryName: 'Council Edict', exaltedName: 'Seven-Choir Apex',
    primaryBase: 820, exaltedBase: 1438,
    primaryCooldown: 6, exaltedCooldown: 8,
    primaryScaling: 1.40, exaltedScaling: 1.58,
    baseStats: { basePower: 124, bonusType: 'oblivion_per_card', bonusValue: 0.14 },
  })];

// ���� Eternal (4) ��������������������������������������������������������������������������������������������������������������������������
const eternalCards: CardDefinition[] = [
  buildSeraphim({
    definitionId: 'dfh-et-skull-ceiling-garrison',
    name: 'Skull-ceiling Garrison',
    description: 'On play: Gain 6 Pyre Embers; Gain 3 Cinder Crowns; Cash out up to 5 Pyre Embers (+200 Oblivion per stack). While on board: +0.13 Oblivion per card played while active',
    rarity: 'Eternal',
    artKey: 'dfh_et_skull_ceiling_garrison',
    bonusType: 'oblivion_per_card',
    bonusValue: 0.13,
    onPlayEffects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 6 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 3 },
      { type: 'eternal_stack_cashout', stack: 'pyre', oblivionPerStack: 200, consume: 5 }],
    unsynergizedName: 'Garrison Strike', synergizedName: 'Skull-ceiling Verdict',
    unsynergizedBase: 1010, synergizedBase: 1770,
    unsynergizedCooldown: 6, synergizedCooldown: 8,
  }),
  buildCherubim({
    definitionId: 'dfh-et-othraks-eternal-communion',
    name: "Othrak's Eternal Communion",
    description: "On play: +5 Pyre Embers; +4 Cinder Crowns; Draw 2 cards. While on board: Buffs Seraphim and Angel attacks: base +80, cooldown -1.",
    rarity: 'Eternal',
    artKey: 'dfh_et_othraks_eternal_communion',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 80, cooldownDeltaCards: -1 }],
    onPlayEffects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 9 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 4 }],
  }),
  buildOphanim({
    definitionId: 'dfh-et-crimson-ember-rain',
    name: 'Crimson Ember-Rain',
    description: 'Gain 6 Pyre Embers; Cash out up to 6 Pyre Embers (+240 Oblivion per stack); Gain 2 Cinder Crowns',
    rarity: 'Eternal',
    artKey: 'dfh_et_crimson_ember_rain',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 6 },
      { type: 'eternal_stack_cashout', stack: 'pyre', oblivionPerStack: 240, consume: 6 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 2 }],
  }),
  buildOphanim({
    definitionId: 'dfh-et-eternal-procession-of-the-veiled',
    name: 'The Eternal Procession of the Veiled',
    description: 'Gain 4 Pyre Embers; Gain 8 Cinder Crowns; Cash out up to 10 Cinder Crowns (+180 Oblivion per crown)',
    rarity: 'Eternal',
    artKey: 'dfh_et_eternal_procession_of_the_veiled',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 4 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 8 },
      { type: 'dfh_crown_cashout', oblivionPerCrown: 180, consume: 10 }],
  })];

// ���� Infinite (4) ������������������������������������������������������������������������������������������������������������������������
const infinityCards: CardDefinition[] = [
  buildSeraphim({
    definitionId: 'dfh-inf-vakhresh-marches-out',
    name: 'Vakhresh Marches Out',
    description: 'On play: Gain 10 Pyre Embers; Gain 6 Cinder Crowns; Cash out up to 10 Pyre Embers (+360 Oblivion per stack); Cash out up to 10 Cinder Crowns (+260 Oblivion per crown). While on board: +0.3 Oblivion per card played while active',
    rarity: 'Infinite',
    artKey: 'dfh_inf_vakhresh_marches_out',
    bonusType: 'oblivion_per_card',
    bonusValue: 0.30,
    onPlayEffects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 10 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 6 },
      { type: 'eternal_stack_cashout', stack: 'pyre', oblivionPerStack: 360, consume: 10 },
      { type: 'dfh_crown_cashout', oblivionPerCrown: 260, consume: 10 }],
    unsynergizedName: 'Vakhresh Marches', synergizedName: 'March of the Dead-flame',
    unsynergizedBase: 2080, synergizedBase: 3640,
    unsynergizedCooldown: 7, synergizedCooldown: 9,
  }),
  buildCherubim({
    definitionId: 'dfh-inf-final-communion-of-halos',
    name: 'The Final Communion of Halos',
    description: 'On play: Gain 14 Pyre Embers; Gain 8 Cinder Crowns; Cash out up to 12 Cinder Crowns (+320 Oblivion per crown). While on board: Buffs Seraphim and Angel attacks: base +200',
    rarity: 'Infinite',
    artKey: 'dfh_inf_final_communion_of_halos',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 200 }],
    onPlayEffects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 14 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 8 },
      { type: 'dfh_crown_cashout', oblivionPerCrown: 320, consume: 12 }],
  }),
  buildOphanim({
    definitionId: 'dfh-inf-bridal-procession-living-world',
    name: 'The Bridal Procession Reaches the Living World',
    description: 'Gain 12 Pyre Embers; Gain 10 Cinder Crowns; Cash out up to 12 Pyre Embers (+400 Oblivion per stack); Cash out up to 12 Cinder Crowns (+300 Oblivion per crown)',
    rarity: 'Infinite',
    artKey: 'dfh_inf_bridal_procession_living_world',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 12 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 10 },
      { type: 'eternal_stack_cashout', stack: 'pyre', oblivionPerStack: 400, consume: 12 },
      { type: 'dfh_crown_cashout', oblivionPerCrown: 300, consume: 12 }],
  }),
  buildOphanim({
    definitionId: 'dfh-inf-death-flame-escaping-upward',
    name: 'The Death-flame Escaping Upward',
    description: 'Gain 12 Pyre Embers; Gain 8 Cinder Crowns; Cash out all Pyre Embers (+340 Oblivion per stack); Cash out all Cinder Crowns (+280 Oblivion per crown)',
    rarity: 'Infinite',
    artKey: 'dfh_inf_death_flame_escaping_upward',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 12 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 8 },
      { type: 'eternal_stack_cashout', stack: 'pyre', oblivionPerStack: 340 },
      { type: 'dfh_crown_cashout', oblivionPerCrown: 280 }],
  })];

export const deathFlamedHellCards: CardDefinition[] = [
  ...baseSeraphim,
  ...baseCherubim,
  ...baseOphanim,
  ...baseAngels,
  ...eternalCards,
  ...infinityCards];

export const deathFlamedHellPackPool = deathFlamedHellCards.map(card => card.definitionId);
