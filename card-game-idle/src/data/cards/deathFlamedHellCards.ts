import type { AngelDefinition, CardDefinition, CherubimDefinition, OphanimDefinition, SeraphimDefinition } from '@/types/cards';

// ─────────────────────────────────────────────────────────────────────────────
// Death-flamed Hell — "Pyre Ascendancy"
// ─────────────────────────────────────────────────────────────────────────────
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
  synergizedCooldown: number;
  unsynergizedScaling: number;
  synergizedScaling: number;
};

type CherubSpec = {
  definitionId: string;
  name: string;
  description: string;
  rarity: CherubimDefinition['rarity'];
  artKey: string;
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
        chainScaling: spec.unsynergizedScaling,
        costs: [],
      },
      synergized: {
        id: `${spec.definitionId}:syn`,
        label: 'Synergized',
        name: spec.synergizedName,
        description: 'Ash-march verdict.',
        baseOblivion: spec.synergizedBase,
        cooldownCards: spec.synergizedCooldown,
        chainScaling: spec.synergizedScaling,
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
        chainScaling: spec.primaryScaling,
        costs: [],
      },
      exalted: {
        id: `${spec.definitionId}:exalted`,
        label: 'Exalted',
        name: spec.exaltedName,
        description: 'Pyre-throned verdict.',
        baseOblivion: spec.exaltedBase,
        cooldownCards: spec.exaltedCooldown,
        chainScaling: spec.exaltedScaling,
        costs: [],
      },
    },
    baseStats: spec.baseStats,
  };
}

// ── Seraphim (8) ────────────────────────────────────────────────────────────
const baseSeraphim: SeraphimDefinition[] = [
  buildSeraphim({
    definitionId: 'dfh-ser-soot-veiled-soldier',
    name: 'Soot-veiled Soldier',
    description: 'On play: +1 Pyre Ember; Draw 1 card. While on board: Chain grows +0.04 per card played.',
    rarity: 'Common',
    artKey: 'dfh_ser_soot_veiled_soldier',
    bonusType: 'chain_bonus',
    bonusValue: 0.04,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 1 }, { type: 'draw', value: 1 }],
    unsynergizedName: 'Soot Cut', synergizedName: 'Veiled March',
    unsynergizedBase: 230, synergizedBase: 404,
    unsynergizedCooldown: 4, synergizedCooldown: 5,
    unsynergizedScaling: 1.15, synergizedScaling: 1.30,
  }),
  buildSeraphim({
    definitionId: 'dfh-ser-last-breath-standard-bearer',
    name: 'Last-breath Standard Bearer',
    description: 'On play: +1 Pyre Ember; +1 Cinder Crown. While on board: +22 Oblivion per card played.',
    rarity: 'Common',
    artKey: 'dfh_ser_last_breath_standard_bearer',
    bonusType: 'oblivion_per_card',
    bonusValue: 22,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 1 }, { type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
    unsynergizedName: 'Standard Strike', synergizedName: 'Last-breath Verdict',
    unsynergizedBase: 240, synergizedBase: 418,
    unsynergizedCooldown: 4, synergizedCooldown: 5,
    unsynergizedScaling: 1.15, synergizedScaling: 1.30,
  }),
  buildSeraphim({
    definitionId: 'dfh-ser-lullaby-forgot-censer',
    name: 'Lullaby-Forgot Censer',
    description: 'On play: +2 Pyre Embers; Discard 1 to draw 1. While on board: Chain grows +0.05 per card played.',
    rarity: 'Common',
    artKey: 'dfh_ser_lullaby_forgot_censer',
    bonusType: 'chain_bonus',
    bonusValue: 0.05,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'discard_draw', discard: 1, draw: 1 }],
    unsynergizedName: 'Lullaby Cut', synergizedName: 'Forgot Hymn',
    unsynergizedBase: 252, synergizedBase: 432,
    unsynergizedCooldown: 4, synergizedCooldown: 5,
    unsynergizedScaling: 1.16, synergizedScaling: 1.31,
  }),
  buildSeraphim({
    definitionId: 'dfh-ser-ash-marrow-reaver',
    name: 'Ash-marrow Reaver',
    description: 'On play: +2 Pyre Embers; +1 Cinder Crown; Amplify chain by +0.06. While on board: Chain grows +0.06 per card played.',
    rarity: 'Rare',
    artKey: 'dfh_ser_ash_marrow_reaver',
    bonusType: 'chain_bonus',
    bonusValue: 0.06,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'set_secondary_gain', kind: 'pyre', value: 1 }, { type: 'chain_gain', value: 0.06 }],
    unsynergizedName: 'Marrow Rend', synergizedName: 'Ash-Marrow Verdict',
    unsynergizedBase: 360, synergizedBase: 620,
    unsynergizedCooldown: 4, synergizedCooldown: 6,
    unsynergizedScaling: 1.20, synergizedScaling: 1.36,
  }),
  buildSeraphim({
    definitionId: 'dfh-ser-choirhouse-cantor',
    name: 'Choirhouse Cantor',
    description: 'On play: +3 Pyre Embers; Draw 1 card. While on board: +34 Oblivion per card played.',
    rarity: 'Rare',
    artKey: 'dfh_ser_choirhouse_cantor',
    bonusType: 'oblivion_per_card',
    bonusValue: 34,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 3 }, { type: 'draw', value: 1 }],
    unsynergizedName: 'Choir Note', synergizedName: 'Cantor Verdict',
    unsynergizedBase: 372, synergizedBase: 636,
    unsynergizedCooldown: 4, synergizedCooldown: 6,
    unsynergizedScaling: 1.20, synergizedScaling: 1.36,
  }),
  buildSeraphim({
    definitionId: 'dfh-ser-pyrelungs-vassal',
    name: "Pyrelung's Vassal",
    description: 'On play: +2 Pyre Embers; +2 Cinder Crowns. While on board: Chain grows +0.07 per card played.',
    rarity: 'Rare',
    artKey: 'dfh_ser_pyrelungs_vassal',
    bonusType: 'chain_bonus',
    bonusValue: 0.07,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }],
    unsynergizedName: 'Vassal Lash', synergizedName: 'Pyrelung Verdict',
    unsynergizedBase: 384, synergizedBase: 652,
    unsynergizedCooldown: 4, synergizedCooldown: 6,
    unsynergizedScaling: 1.21, synergizedScaling: 1.37,
  }),
  buildSeraphim({
    definitionId: 'dfh-ser-sablecrown-herald',
    name: 'Sablecrown Herald',
    description: 'On play: +4 Pyre Embers; +2 Cinder Crowns; Draw 1 card. While on board: Chain grows +0.09 per card played.',
    rarity: 'Epic',
    artKey: 'dfh_ser_sablecrown_herald',
    bonusType: 'chain_bonus',
    bonusValue: 0.09,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 4 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }, { type: 'draw', value: 1 }],
    unsynergizedName: 'Sable Edict', synergizedName: 'Herald of the Crown',
    unsynergizedBase: 640, synergizedBase: 1108,
    unsynergizedCooldown: 5, synergizedCooldown: 7,
    unsynergizedScaling: 1.31, synergizedScaling: 1.51,
  }),
  buildSeraphim({
    definitionId: 'dfh-ser-khorr-vael-no-face',
    name: 'Khorr-vael, The No-face',
    description: 'On play: +5 Pyre Embers; +3 Cinder Crowns; Amplify chain by +0.14. While on board: +90 Oblivion per card played.',
    rarity: 'Legendary',
    artKey: 'dfh_ser_khorr_vael_no_face',
    bonusType: 'oblivion_per_card',
    bonusValue: 90,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 5 }, { type: 'set_secondary_gain', kind: 'pyre', value: 3 }, { type: 'chain_gain', value: 0.14 }],
    unsynergizedName: 'No-face Strike', synergizedName: 'Faceless Verdict',
    unsynergizedBase: 920, synergizedBase: 1572,
    unsynergizedCooldown: 6, synergizedCooldown: 8,
    unsynergizedScaling: 1.39, synergizedScaling: 1.59,
  }),
];

// ── Cherubim (10) ───────────────────────────────────────────────────────────
const baseCherubim: CherubimDefinition[] = [
  buildCherubim({
    definitionId: 'dfh-cher-halo-cracked-novice',
    name: 'Halo-cracked Novice',
    description: 'On play: +1 Pyre Ember. While on board: Buffs Seraphim and Angel attacks: base +18, chain bonus +0.02.',
    rarity: 'Common',
    artKey: 'dfh_cher_halo_cracked_novice',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 18, bonusChainScaling: 0.02 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 1 }],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-marrow-pilgrim',
    name: 'Marrow-Pilgrim',
    description: 'On play: +1 Pyre Ember; +1 Cinder Crown. While on board: Buffs Seraphim and Angel attacks: base +20, chain bonus +0.02.',
    rarity: 'Common',
    artKey: 'dfh_cher_marrow_pilgrim',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 20, bonusChainScaling: 0.02 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 1 }, { type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-penitent-of-ash',
    name: 'Penitent of Ash',
    description: 'On play: +2 Pyre Embers; Discard 1 to draw 1. While on board: Buffs Seraphim and Angel attacks: base +22, chain bonus +0.02.',
    rarity: 'Common',
    artKey: 'dfh_cher_penitent_of_ash',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 22, bonusChainScaling: 0.02 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'discard_draw', discard: 1, draw: 1 }],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-stigmata-flame-confessor',
    name: 'Stigmata-flame Confessor',
    description: 'On play: +2 Pyre Embers; +1 Cinder Crown. While on board: Buffs Seraphim and Angel attacks: base +28, chain bonus +0.03.',
    rarity: 'Rare',
    artKey: 'dfh_cher_stigmata_flame_confessor',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 28, bonusChainScaling: 0.03 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-reliquary-of-the-last-tongue',
    name: 'Reliquary of the Last Tongue',
    description: 'On play: +3 Pyre Embers; Draw 1 card. While on board: Buffs Seraphim and Angel attacks: base +30, chain bonus +0.03.',
    rarity: 'Rare',
    artKey: 'dfh_cher_reliquary_of_the_last_tongue',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 30, bonusChainScaling: 0.03 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 3 }, { type: 'draw', value: 1 }],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-severed-sanctity-hierophant',
    name: 'Severed-sanctity Hierophant',
    description: 'On play: +2 Pyre Embers; +2 Cinder Crowns. While on board: Buffs Seraphim and Angel attacks: base +32, chain bonus +0.03.',
    rarity: 'Rare',
    artKey: 'dfh_cher_severed_sanctity_hierophant',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 32, bonusChainScaling: 0.03 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-cathedral-anchorite',
    name: 'Cathedral Anchorite',
    description: 'On play: +4 Pyre Embers; +1 Cinder Crown. While on board: Buffs Seraphim and Angel attacks: base +44, chain bonus +0.05, cooldown -1.',
    rarity: 'Epic',
    artKey: 'dfh_cher_cathedral_anchorite',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 44, bonusChainScaling: 0.05, cooldownDeltaCards: -1 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 4 }, { type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-othraks-confessor',
    name: "Othrak's Confessor",
    description: 'On play: +3 Pyre Embers; +2 Cinder Crowns; Draw 1 card. While on board: Buffs Seraphim and Angel attacks: base +42, chain bonus +0.06.',
    rarity: 'Epic',
    artKey: 'dfh_cher_othraks_confessor',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 42, bonusChainScaling: 0.06 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 3 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }, { type: 'draw', value: 1 }],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-cinder-saint-othrak',
    name: 'Cinder-saint, Othrak',
    description: 'On play: +5 Pyre Embers; +3 Cinder Crowns. While on board: Buffs Seraphim and Angel attacks: base +60, chain bonus +0.08, cooldown -1.',
    rarity: 'Legendary',
    artKey: 'dfh_cher_cinder_saint_othrak',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 60, bonusChainScaling: 0.08, cooldownDeltaCards: -1 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 5 }, { type: 'set_secondary_gain', kind: 'pyre', value: 3 }],
  }),
  buildCherubim({
    definitionId: 'dfh-cher-the-flayed-halo',
    name: 'The Flayed Halo',
    description: 'On play: +4 Pyre Embers; +4 Cinder Crowns; Discard 1 to draw 2. While on board: Buffs Seraphim and Angel attacks: base +66, chain bonus +0.09.',
    rarity: 'Legendary',
    artKey: 'dfh_cher_the_flayed_halo',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 66, bonusChainScaling: 0.09 }],
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 4 }, { type: 'set_secondary_gain', kind: 'pyre', value: 4 }, { type: 'discard_draw', discard: 1, draw: 2 }],
  }),
];

// ── Ophanim (18) ────────────────────────────────────────────────────────────
const baseOphanim: OphanimDefinition[] = [
  buildOphanim({
    definitionId: 'dfh-oph-ash-petal-strewer',
    name: 'Ash-petal Strewer',
    description: '+2 Pyre Embers; Draw 1 card.',
    rarity: 'Common',
    artKey: 'dfh_oph_ash_petal_strewer',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'draw', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-bell-ringer-of-the-hollow',
    name: 'Bell-ringer of the Hollow',
    description: '+1 Pyre Ember; +1 Cinder Crown; Amplify chain by +0.04.',
    rarity: 'Common',
    artKey: 'dfh_oph_bell_ringer_of_the_hollow',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 1 }, { type: 'set_secondary_gain', kind: 'pyre', value: 1 }, { type: 'chain_gain', value: 0.04 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-bridegrooms-outrider',
    name: "Bridegroom's Outrider",
    description: '+2 Pyre Embers; Amplify chain by +0.05.',
    rarity: 'Common',
    artKey: 'dfh_oph_bridegrooms_outrider',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'chain_gain', value: 0.05 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-empty-aisle-walker',
    name: 'Empty-aisle Walker',
    description: '+2 Pyre Embers; +1 Cinder Crown.',
    rarity: 'Common',
    artKey: 'dfh_oph_empty_aisle_walker',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'set_secondary_gain', kind: 'pyre', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-pale-bridegrooms-page',
    name: "Pale Bridegroom's Page",
    description: '+1 Pyre Ember; Discard 1 to draw 1.',
    rarity: 'Common',
    artKey: 'dfh_oph_pale_bridegrooms_page',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 1 }, { type: 'discard_draw', discard: 1, draw: 1 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-veiled-censer-bearer',
    name: 'Veiled Censer-bearer',
    description: '+3 Pyre Embers.',
    rarity: 'Common',
    artKey: 'dfh_oph_veiled_censer_bearer',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 3 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-wickless-litany',
    name: 'Wickless Litany',
    description: '+1 Pyre Ember; +2 Cinder Crowns.',
    rarity: 'Common',
    artKey: 'dfh_oph_wickless_litany',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 1 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-faceless-bridesmaid-choir',
    name: 'Faceless Bridesmaid Choir',
    description: '+3 Pyre Embers; +1 Cinder Crown; Draw 1 card.',
    rarity: 'Rare',
    artKey: 'dfh_oph_faceless_bridesmaid_choir',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 3 }, { type: 'set_secondary_gain', kind: 'pyre', value: 1 }, { type: 'draw', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-funeral-march-drummer',
    name: 'Funeral-march Drummer',
    description: '+4 Pyre Embers; Amplify chain by +0.06.',
    rarity: 'Rare',
    artKey: 'dfh_oph_funeral_march_drummer',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 4 }, { type: 'chain_gain', value: 0.06 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-hollowkings-vacant-page',
    name: "Hollowking's Vacant Page",
    description: '+2 Pyre Embers; +2 Cinder Crowns; Draw 1 card.',
    rarity: 'Rare',
    artKey: 'dfh_oph_hollowkings_vacant_page',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }, { type: 'draw', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-procession-lantern-custodian',
    name: 'Procession-lantern Custodian',
    description: '+3 Pyre Embers; +1 Cinder Crown; Amplify chain by +0.05.',
    rarity: 'Rare',
    artKey: 'dfh_oph_procession_lantern_custodian',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 3 }, { type: 'set_secondary_gain', kind: 'pyre', value: 1 }, { type: 'chain_gain', value: 0.05 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-sablecrowns-letter-bearer',
    name: "Sablecrown's Letter-bearer",
    description: '+2 Pyre Embers; +3 Cinder Crowns.',
    rarity: 'Rare',
    artKey: 'dfh_oph_sablecrowns_letter_bearer',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 2 }, { type: 'set_secondary_gain', kind: 'pyre', value: 3 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-veil-stitcher',
    name: 'Veil-stitcher',
    description: '+3 Pyre Embers; Discard 1 to draw 2.',
    rarity: 'Rare',
    artKey: 'dfh_oph_veil_stitcher',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 3 }, { type: 'discard_draw', discard: 1, draw: 2 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-choirhouse-conductor',
    name: 'Choirhouse Conductor',
    description: '+4 Pyre Embers; +2 Cinder Crowns; Draw 1 card.',
    rarity: 'Epic',
    artKey: 'dfh_oph_choirhouse_conductor',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 4 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }, { type: 'draw', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-hollow-throne-coronation',
    name: 'Hollow-throne Coronation',
    description: '+5 Pyre Embers; +3 Cinder Crowns.',
    rarity: 'Epic',
    artKey: 'dfh_oph_hollow_throne_coronation',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 5 }, { type: 'set_secondary_gain', kind: 'pyre', value: 3 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-pyrelungs-exhalation',
    name: "Pyrelung's Exhalation",
    description: '+6 Pyre Embers; Amplify chain by +0.08.',
    rarity: 'Epic',
    artKey: 'dfh_oph_pyrelungs_exhalation',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 6 }, { type: 'chain_gain', value: 0.08 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-wedding-that-wasnt-cantor',
    name: "Wedding-that-wasn't Cantor",
    description: '+3 Pyre Embers; +4 Cinder Crowns; Draw 1 card.',
    rarity: 'Epic',
    artKey: 'dfh_oph_wedding_that_wasnt_cantor',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 3 }, { type: 'set_secondary_gain', kind: 'pyre', value: 4 }, { type: 'draw', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'dfh-oph-wedding-procession-living-world',
    name: 'The Wedding Procession Into the Living World',
    description: '+6 Pyre Embers; +4 Cinder Crowns; Draw 2 cards; Amplify chain by +0.12.',
    rarity: 'Legendary',
    artKey: 'dfh_oph_wedding_procession_living_world',
    effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 6 }, { type: 'set_secondary_gain', kind: 'pyre', value: 4 }, { type: 'draw', value: 2 }, { type: 'chain_gain', value: 0.12 }],
  }),
];

// ── Angels (4 Legendary + 1 special) ────────────────────────────────────────
const baseAngels: AngelDefinition[] = [
  buildAngel({
    definitionId: 'dfh-ang-mournshade-the-wickless',
    name: 'Mournshade, The Wickless',
    description: 'On summon: +4 Pyre Embers; +2 Cinder Crowns. After 2 cards played: +3 Pyre Embers and +2 Cinder Crowns. While on board: Chain grows +0.08 per card played.',
    rarity: 'Legendary',
    artKey: 'dfh_ang_mournshade_the_wickless',
    summonCost: ['dfh-ser-soot-veiled-soldier', 'dfh-ser-ash-marrow-reaver'],
    onSummonEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 4 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }],
    activatedAbility: {
      name: 'Wickless Pulse',
      cardsPlayedRequirement: 2,
      description: '+3 Pyre Embers and +2 Cinder Crowns.',
      effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 3 }, { type: 'set_secondary_gain', kind: 'pyre', value: 2 }],
    },
    primaryName: 'Wickless Cut', exaltedName: 'Mournshade Verdict',
    primaryBase: 720, exaltedBase: 1268,
    primaryCooldown: 6, exaltedCooldown: 8,
    primaryScaling: 1.35, exaltedScaling: 1.53,
    baseStats: { basePower: 92, bonusType: 'chain_bonus', bonusValue: 0.08 },
  }),
  buildAngel({
    definitionId: 'dfh-ang-pyrelung-the-breathless',
    name: 'Pyrelung, The Breathless',
    description: 'On summon: +5 Pyre Embers; +3 Cinder Crowns. After 3 cards played: +4 Pyre Embers and +3 Cinder Crowns. While on board: +56 Oblivion per card played.',
    rarity: 'Legendary',
    artKey: 'dfh_ang_pyrelung_the_breathless',
    summonCost: ['dfh-ser-pyrelungs-vassal', 'dfh-ser-choirhouse-cantor'],
    onSummonEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 5 }, { type: 'set_secondary_gain', kind: 'pyre', value: 3 }],
    activatedAbility: {
      name: 'Breathless Exhale',
      cardsPlayedRequirement: 3,
      description: '+4 Pyre Embers and +3 Cinder Crowns.',
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
    description: 'On summon: +5 Pyre Embers; +4 Cinder Crowns; Draw 1 card. After 3 cards played: Cash out 8 Cinder Crowns (+120 Oblivion, +0.04 chain per Crown). While on board: Chain grows +0.10 per card played.',
    rarity: 'Legendary',
    artKey: 'dfh_ang_sablecrown_the_unnamed',
    summonCost: ['dfh-ser-sablecrown-herald', 'dfh-ser-ash-marrow-reaver'],
    onSummonEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 5 }, { type: 'set_secondary_gain', kind: 'pyre', value: 4 }, { type: 'draw', value: 1 }],
    activatedAbility: {
      name: 'Unnamed Coronation',
      cardsPlayedRequirement: 3,
      description: 'Cash out 8 Cinder Crowns (+120 Oblivion, +0.04 chain per Crown).',
      effects: [{ type: 'dfh_crown_cashout', oblivionPerCrown: 120, chainPerCrown: 0.04, consume: 8 }],
    },
    primaryName: 'Sable Edict', exaltedName: 'Unnamed Verdict',
    primaryBase: 758, exaltedBase: 1330,
    primaryCooldown: 6, exaltedCooldown: 8,
    primaryScaling: 1.37, exaltedScaling: 1.55,
    baseStats: { basePower: 104, bonusType: 'chain_bonus', bonusValue: 0.10 },
  }),
  buildAngel({
    definitionId: 'dfh-ang-veil-iorn-the-faceless-bride',
    name: 'Veil-iorn, The Faceless Bride',
    description: 'On summon: +6 Pyre Embers; +5 Cinder Crowns. After 4 cards played: +5 Pyre Embers, +4 Cinder Crowns, Draw 2 cards. While on board: +70 Oblivion per card played.',
    rarity: 'Legendary',
    artKey: 'dfh_ang_veil_iorn_the_faceless_bride',
    summonCost: ['dfh-ser-khorr-vael-no-face', 'dfh-ser-sablecrown-herald'],
    onSummonEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 6 }, { type: 'set_secondary_gain', kind: 'pyre', value: 5 }],
    activatedAbility: {
      name: 'Bridal Veil',
      cardsPlayedRequirement: 4,
      description: '+5 Pyre Embers, +4 Cinder Crowns, Draw 2 cards.',
      effects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 5 }, { type: 'set_secondary_gain', kind: 'pyre', value: 4 }, { type: 'draw', value: 2 }],
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
    description: 'On summon: +8 Pyre Embers; +6 Cinder Crowns; Draw 1 card. After 4 cards played: Cash out 12 Cinder Crowns (+160 Oblivion, +0.05 chain per Crown). While on board: Chain grows +0.14 per card played.',
    rarity: 'Legendary',
    artKey: 'dfh_ang_council_of_the_seven_choirs',
    summonCost: ['dfh-ser-khorr-vael-no-face', 'dfh-ser-pyrelungs-vassal'],
    onSummonEffects: [{ type: 'eternal_stack_gain', stack: 'pyre', value: 8 }, { type: 'set_secondary_gain', kind: 'pyre', value: 6 }, { type: 'draw', value: 1 }],
    activatedAbility: {
      name: 'Seven-Choir Verdict',
      cardsPlayedRequirement: 4,
      description: 'Cash out 12 Cinder Crowns (+160 Oblivion, +0.05 chain per Crown).',
      effects: [{ type: 'dfh_crown_cashout', oblivionPerCrown: 160, chainPerCrown: 0.05, consume: 12 }],
    },
    primaryName: 'Council Edict', exaltedName: 'Seven-Choir Apex',
    primaryBase: 820, exaltedBase: 1438,
    primaryCooldown: 6, exaltedCooldown: 8,
    primaryScaling: 1.40, exaltedScaling: 1.58,
    baseStats: { basePower: 124, bonusType: 'chain_bonus', bonusValue: 0.14 },
  }),
];

// ── Eternal (4) ─────────────────────────────────────────────────────────────
const eternalCards: CardDefinition[] = [
  buildSeraphim({
    definitionId: 'dfh-et-skull-ceiling-garrison',
    name: 'Skull-ceiling Garrison',
    description: 'On play: +6 Pyre Embers; +3 Cinder Crowns; Cash out 5 Pyre Embers (+200 Oblivion, +0.05 chain per Ember). While on board: Chain grows +0.13 per card played.',
    rarity: 'Eternal',
    artKey: 'dfh_et_skull_ceiling_garrison',
    bonusType: 'chain_bonus',
    bonusValue: 0.13,
    onPlayEffects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 6 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 3 },
      { type: 'eternal_stack_cashout', stack: 'pyre', oblivionPerStack: 200, chainPerStack: 0.05, consume: 5 },
    ],
    unsynergizedName: 'Garrison Strike', synergizedName: 'Skull-ceiling Verdict',
    unsynergizedBase: 1010, synergizedBase: 1770,
    unsynergizedCooldown: 6, synergizedCooldown: 8,
    unsynergizedScaling: 1.42, synergizedScaling: 1.64,
  }),
  buildCherubim({
    definitionId: 'dfh-et-othraks-eternal-communion',
    name: "Othrak's Eternal Communion",
    description: "On play: +5 Pyre Embers; +4 Cinder Crowns; Draw 2 cards. While on board: Buffs Seraphim and Angel attacks: base +80, chain bonus +0.10, cooldown -1.",
    rarity: 'Eternal',
    artKey: 'dfh_et_othraks_eternal_communion',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 80, bonusChainScaling: 0.10, cooldownDeltaCards: -1 }],
    onPlayEffects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 5 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 4 },
      { type: 'draw', value: 2 },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-et-crimson-ember-rain',
    name: 'Crimson Ember-Rain',
    description: '+6 Pyre Embers; Cash out 6 Pyre Embers (+240 Oblivion, +0.05 chain per Ember); +2 Cinder Crowns.',
    rarity: 'Eternal',
    artKey: 'dfh_et_crimson_ember_rain',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 6 },
      { type: 'eternal_stack_cashout', stack: 'pyre', oblivionPerStack: 240, chainPerStack: 0.05, consume: 6 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 2 },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-et-eternal-procession-of-the-veiled',
    name: 'The Eternal Procession of the Veiled',
    description: '+4 Pyre Embers; +6 Cinder Crowns; Cash out 10 Cinder Crowns (+180 Oblivion, +0.05 chain per Crown); Draw 1 card.',
    rarity: 'Eternal',
    artKey: 'dfh_et_eternal_procession_of_the_veiled',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 4 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 6 },
      { type: 'dfh_crown_cashout', oblivionPerCrown: 180, chainPerCrown: 0.05, consume: 10 },
      { type: 'draw', value: 1 },
    ],
  }),
];

// ── Infinite (4) ────────────────────────────────────────────────────────────
const infinityCards: CardDefinition[] = [
  buildSeraphim({
    definitionId: 'dfh-inf-vakhresh-marches-out',
    name: 'Vakhresh Marches Out',
    description: 'On play: Gain 10 Pyre Embers; Gain 6 Cinder Crowns; Cash out up to 10 Pyre Embers (+360 Oblivion, +0.06 chain per stack); Cash out up to 10 Cinder Crowns (+260 Oblivion, +0.07 chain per crown). While on board: Chain grows +0.3 per card played while active',
    rarity: 'Infinite',
    artKey: 'dfh_inf_vakhresh_marches_out',
    bonusType: 'chain_bonus',
    bonusValue: 0.30,
    onPlayEffects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 10 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 6 },
      { type: 'eternal_stack_cashout', stack: 'pyre', oblivionPerStack: 360, chainPerStack: 0.06, consume: 10 },
      { type: 'dfh_crown_cashout', oblivionPerCrown: 260, chainPerCrown: 0.07, consume: 10 },
    ],
    unsynergizedName: 'Vakhresh Marches', synergizedName: 'March of the Dead-flame',
    unsynergizedBase: 2080, synergizedBase: 3640,
    unsynergizedCooldown: 7, synergizedCooldown: 9,
    unsynergizedScaling: 1.62, synergizedScaling: 1.86,
  }),
  buildCherubim({
    definitionId: 'dfh-inf-final-communion-of-halos',
    name: 'The Final Communion of Halos',
    description: 'On play: Gain 8 Pyre Embers; Gain 8 Cinder Crowns; Cash out up to 12 Cinder Crowns (+320 Oblivion, +0.08 chain per crown); Draw 3 cards. While on board: Buffs Seraphim and Angel attacks: base +200, chain bonus +0.22',
    rarity: 'Infinite',
    artKey: 'dfh_inf_final_communion_of_halos',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 200, bonusChainScaling: 0.22 }],
    onPlayEffects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 8 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 8 },
      { type: 'dfh_crown_cashout', oblivionPerCrown: 320, chainPerCrown: 0.08, consume: 12 },
      { type: 'draw', value: 3 },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-inf-bridal-procession-living-world',
    name: 'The Bridal Procession Reaches the Living World',
    description: 'Gain 8 Pyre Embers; Gain 10 Cinder Crowns; Cash out up to 12 Pyre Embers (+400 Oblivion, +0.07 chain per stack); Cash out up to 12 Cinder Crowns (+300 Oblivion, +0.07 chain per crown); Draw 2 cards',
    rarity: 'Infinite',
    artKey: 'dfh_inf_bridal_procession_living_world',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 8 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 10 },
      { type: 'eternal_stack_cashout', stack: 'pyre', oblivionPerStack: 400, chainPerStack: 0.07, consume: 12 },
      { type: 'dfh_crown_cashout', oblivionPerCrown: 300, chainPerCrown: 0.07, consume: 12 },
      { type: 'draw', value: 2 },
    ],
  }),
  buildOphanim({
    definitionId: 'dfh-inf-death-flame-escaping-upward',
    name: 'The Death-flame Escaping Upward',
    description: 'Gain 12 Pyre Embers; Gain 8 Cinder Crowns; Cash out all Pyre Embers (+340 Oblivion, +0.05 chain per stack); Cash out all Cinder Crowns (+280 Oblivion, +0.06 chain per crown); Amplify Chain by +x0.3',
    rarity: 'Infinite',
    artKey: 'dfh_inf_death_flame_escaping_upward',
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyre', value: 12 },
      { type: 'set_secondary_gain', kind: 'pyre', value: 8 },
      { type: 'eternal_stack_cashout', stack: 'pyre', oblivionPerStack: 340, chainPerStack: 0.05 },
      { type: 'dfh_crown_cashout', oblivionPerCrown: 280, chainPerCrown: 0.06 },
      { type: 'chain_gain', value: 0.30 },
    ],
  }),
];

export const deathFlamedHellCards: CardDefinition[] = [
  ...baseSeraphim,
  ...baseCherubim,
  ...baseOphanim,
  ...baseAngels,
  ...eternalCards,
  ...infinityCards,
];

export const deathFlamedHellPackPool = deathFlamedHellCards.map(card => card.definitionId);
