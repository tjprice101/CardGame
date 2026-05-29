/**
 * Wished Upon A Star ? Event Set
 *
 * Theme: Monochromatic stars, cosmic dreams, universal beings with fangs of fire
 * and wings of galaxies. The Wishwright's Age.
 *
 * Mechanic: Stellar Wish System
 *   - starlightCharges (TurnState): accumulated through card play; drives all scaling
 *   - dreamLattice (TurnState): secondary amplifier; resets each turn unless Solarvex Ward active
 *   - Full-fire gate: starlightCharges >= 10 AND dreamLattice >= 4 => x1.40 multiplier bonus
 *   - Nova Wish Burst: oblivion = starlightCharges x (1 + dreamLattice x 0.4)
 *
 * Eternal cards use eternalStacks['wuas'] (Star Crown stacks).
 * Infinite cards use wuas_infinite_starbirth (Seraphim x starlightCharges cashout).
 * Cherubim passives with custom per-card triggers are handled in store.ts.
 *
 * Card IDs:
 *   Base:    wuas-ser-*, wuas-cher-*, wuas-oph-*, wuas-ang-*
 *   Eternal: wuas-et-*
 *   Infinite: inf-wuas-*
 */

import type {
  AngelDefinition,
  CardDefinition,
  CherubimDefinition,
  OphanimDefinition,
  SeraphimDefinition,
} from '@/types/cards';

const WUAS = 'WishedUponAStar' as const;

// ����������������������������������������������������������������������������������������������������������������������������������������������������������
// Builder helpers (mirrors the DFH pattern)
// ����������������������������������������������������������������������������������������������������������������������������������������������������������

type SeraphSpec = {
  definitionId: string;
  name: string;
  description: string;
  rarity: SeraphimDefinition['rarity'];
  artKey: string;
  bonusType: SeraphimDefinition['baseStats']['bonusType'];
  bonusValue: number;
  onPlayEffects: SeraphimDefinition['onPlayEffects'];
  patienceThreshold?: number;
  unsynergizedName: string;
  synergizedName: string;
  unsynergizedDescription?: string;
  synergizedDescription?: string;
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
  maxDurability?: number;
  discardCondition?: CherubimDefinition['discardCondition'];
};

type OphSpec = {
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
  primaryDescription?: string;
  exaltedDescription?: string;
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
    element: WUAS,
    rarity: spec.rarity,
    name: spec.name,
    description: spec.description,
    artKey: spec.artKey,
    baseStats: {
      bonusType: spec.bonusType,
      bonusValue: spec.bonusValue,
      synergyRequirement: WUAS,
    },
    onPlayEffects: spec.onPlayEffects,
    patienceThreshold: spec.patienceThreshold,
    attacks: {
      unsynergized: {
        id: `${spec.definitionId}:unsyn`,
        label: 'Unsynergized',
        name: spec.unsynergizedName,
        description: spec.unsynergizedDescription ?? 'A faint star-flicker, alone in the dark.',
        baseOblivion: spec.unsynergizedBase,
        cooldownCards: spec.unsynergizedCooldown,
        costs: [],
      },
      synergized: {
        id: `${spec.definitionId}:syn`,
        label: 'Synergized',
        name: spec.synergizedName,
        description: spec.synergizedDescription ?? 'A wish answered in full ? by the whole sky at once.',
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
    element: WUAS,
    rarity: spec.rarity,
    name: spec.name,
    description: spec.description,
    artKey: spec.artKey,
    effects: spec.effects,
    onPlayEffects: spec.onPlayEffects,
    maxDurability: spec.maxDurability,
    discardCondition: spec.discardCondition,
  };
}

function buildOphanim(spec: OphSpec): OphanimDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Ophanim',
    element: WUAS,
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
    element: WUAS,
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
        description: spec.primaryDescription ?? 'A celestial blade-strike, drawn from a quiet sky.',
        baseOblivion: spec.primaryBase,
        cooldownCards: spec.primaryCooldown,
        costs: [],
      },
      exalted: {
        id: `${spec.definitionId}:exalted`,
        label: 'Exalted',
        name: spec.exaltedName,
        description: spec.exaltedDescription ?? 'The sky forgets nothing ? and now remembers everything at once.',
        baseOblivion: spec.exaltedBase,
        cooldownCards: spec.exaltedCooldown,
        costs: [],
      },
    },
    baseStats: spec.baseStats,
  };
}

// ���� Seraphim (5) ��������������������������������������������������������������������������������������������������������������������������
// Passive per-card Starlight gain is tracked in store.ts by definitionId.
// onPlayEffects handle the one-shot on-play burst.

const baseSeraphim: SeraphimDefinition[] = [
  buildSeraphim({
    definitionId: 'wuas-ser-solarvex-fragment',
    name: 'Solarvex Fragment',
    description: 'On play: Gain 2 Starlight Charges. While on board: Resource generation +1 while active',
    rarity: 'Common',
    artKey: 'wuas_ser_solarvex_fragment',
    bonusType: 'resource_generation',
    bonusValue: 1,
    onPlayEffects: [{ type: 'starlight_gain', amount: 2 }],
    unsynergizedName: 'Star Flicker', synergizedName: 'Solarvex Pulse',
    unsynergizedDescription: '190 base Oblivion · 4 cards cooldown',
    synergizedDescription: '335 base Oblivion · 5 cards cooldown · Requires Angel',
    unsynergizedBase: 190, synergizedBase: 335,
    unsynergizedCooldown: 4, synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'wuas-ser-seleniras-vigil',
    name: "Selenira's Vigil",
    description: 'On play: Gain 2 Starlight Charges. While on board: +40 Oblivion per card played while active',
    rarity: 'Rare',
    artKey: 'wuas_ser_seleniras_vigil',
    bonusType: 'oblivion_per_card',
    bonusValue: 40,
    onPlayEffects: [{ type: 'starlight_gain', amount: 2 }],
    unsynergizedName: 'Vigil Strike', synergizedName: 'Selenira Watch',
    unsynergizedDescription: '260 base Oblivion · 4 cards cooldown',
    synergizedDescription: '455 base Oblivion · 5 cards cooldown · Requires Angel',
    unsynergizedBase: 260, synergizedBase: 455,
    unsynergizedCooldown: 4, synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'wuas-ser-lune-refrain',
    name: 'Lune Refrain',
    description: 'On play: Gain 2 Starlight Charges. While on board: +100 Oblivion per card played while active',
    rarity: 'Rare',
    artKey: 'wuas_ser_lune_refrain',
    bonusType: 'oblivion_per_card',
    bonusValue: 100,
    onPlayEffects: [{ type: 'starlight_gain', amount: 2 }],
    unsynergizedName: 'Lune Echo', synergizedName: 'Choir Refrain',
    unsynergizedDescription: '270 base Oblivion · 4 cards cooldown',
    synergizedDescription: '475 base Oblivion · 5 cards cooldown · Requires Angel',
    unsynergizedBase: 270, synergizedBase: 475,
    unsynergizedCooldown: 4, synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'wuas-ser-draethos-gravity',
    name: 'Draethos Gravity',
    description: 'On play: Gain 3 Starlight Charges; Gain 1 Dream Lattice stack. While on board: +40 Oblivion per card played while active',
    rarity: 'Epic',
    artKey: 'wuas_ser_draethos_gravity',
    bonusType: 'oblivion_per_card',
    bonusValue: 40,
    onPlayEffects: [{ type: 'starlight_gain', amount: 3 }, { type: 'dream_lattice_gain', amount: 1 }],
    unsynergizedName: 'Gravity Pull', synergizedName: 'Draethos Descent',
    unsynergizedDescription: '390 base Oblivion · 5 cards cooldown',
    synergizedDescription: '686 base Oblivion · 6 cards cooldown · Requires Angel',
    unsynergizedBase: 390, synergizedBase: 686,
    unsynergizedCooldown: 5, synergizedCooldown: 6,
  }),
  buildSeraphim({
    definitionId: 'wuas-ser-nullspire-monolith',
    name: 'Nullspire Monolith',
    description: 'On play: Gain 5 Starlight Charges; Gain 2 Dream Lattice stacks. While on board: Your board\'s power is amplified by x1.4 while active',
    rarity: 'Legendary',
    artKey: 'wuas_ser_nullspire_monolith',
    bonusType: 'power_amplifier',
    bonusValue: 1.40,
    onPlayEffects: [{ type: 'starlight_gain', amount: 5 }, { type: 'dream_lattice_gain', amount: 2 }],
    unsynergizedName: 'Null Spire', synergizedName: 'Monolith Decree',
    unsynergizedDescription: '540 base Oblivion · 5 cards cooldown',
    synergizedDescription: '950 base Oblivion · 7 cards cooldown · Requires Angel',
    unsynergizedBase: 540, synergizedBase: 950,
    unsynergizedCooldown: 5, synergizedCooldown: 7,
  })];

// ���� Cherubim (5) ��������������������������������������������������������������������������������������������������������������������������
// Custom per-card passives (per-card Starlight, draw gate, ward, amplifier,
// dream-per-draw) are wired in store.ts by definitionId.

const baseCherubim: CherubimDefinition[] = [
  buildCherubim({
    definitionId: 'wuas-cher-wishwright-pulse',
    name: "Wishwright's Pulse",
    description: 'On play: Gain 2 Starlight Charges',
    rarity: 'Common',
    artKey: 'wuas_cher_wishwright_pulse',
    effects: [],
    onPlayEffects: [{ type: 'starlight_gain', amount: 2 }],
  }),
  buildCherubim({
    definitionId: 'wuas-cher-dreamvault-keeper',
    name: 'Dreamvault Keeper',
    description: 'On play: Gain 1 Dream Lattice stack. While on board: Draw 0 cards per card played',
    rarity: 'Rare',
    artKey: 'wuas_cher_dreamvault_keeper',
    effects: [{ type: 'cherubim_draw_per_card', value: 0 }],
    onPlayEffects: [{ type: 'dream_lattice_gain', amount: 1 }],
  }),
  buildCherubim({
    definitionId: 'wuas-cher-solarvex-ward',
    name: 'Solarvex Ward',
    description: 'On play: Gain 3 Starlight Charges',
    rarity: 'Rare',
    artKey: 'wuas_cher_solarvex_ward',
    effects: [],
    onPlayEffects: [{ type: 'starlight_gain', amount: 3 }],
  }),
  buildCherubim({
    definitionId: 'wuas-cher-starlace-binding',
    name: 'Starlace Binding',
    description: 'On play: Gain 2 Starlight Charges. While on board: All Oblivion gain +85%; Buffs Seraphim and Angel attacks: base +55, when you have 5+ Starlight Charges',
    rarity: 'Epic',
    artKey: 'wuas_cher_starlace_binding',
    maxDurability: 9,
    effects: [
      { type: 'cherubim_global_oblivion_mult', value: 0.85 },
      {
        type: 'cherubim_attack_buff',
        targetUnitType: 'Any',
        condition: { type: 'starlight_gte', value: 5 },
        bonusBaseOblivion: 55,
      }],
    onPlayEffects: [{ type: 'starlight_gain', amount: 2 }],
  }),
  buildCherubim({
    definitionId: 'wuas-cher-voidbane-doctrine',
    name: 'Voidbane Doctrine',
    description: 'On play: Gain 3 Starlight Charges; Gain 2 Dream Lattice stacks',
    rarity: 'Legendary',
    artKey: 'wuas_cher_voidbane_doctrine',
    effects: [],
    onPlayEffects: [{ type: 'starlight_gain', amount: 3 }, { type: 'dream_lattice_gain', amount: 2 }],
    discardCondition: {
      type: 'cards_played_gte',
      value: 10,
      description: 'Expires after 10 cards played.',
    },
  })];

// ���� Ophanim (7) ����������������������������������������������������������������������������������������������������������������������������

const baseOphanim: OphanimDefinition[] = [
  buildOphanim({
    definitionId: 'wuas-oph-skyrift-mote',
    name: 'Skyrift Mote',
    description: 'Gain 2 Starlight Charges',
    rarity: 'Common',
    artKey: 'wuas_oph_skyrift_mote',
    effects: [{ type: 'starlight_gain', amount: 2 }],
  }),
  buildOphanim({
    definitionId: 'wuas-oph-dream-shard',
    name: 'Dream Shard',
    description: 'Gain 1 Starlight Charge',
    rarity: 'Common',
    artKey: 'wuas_oph_dream_shard',
    effects: [{ type: 'starlight_gain', amount: 1 }],
  }),
  buildOphanim({
    definitionId: 'wuas-oph-stargazer-token',
    name: 'Stargazer Token',
    description: 'Gain 3 Starlight Charges; Draw 1 card',
    rarity: 'Common',
    artKey: 'wuas_oph_stargazer_token',
    effects: [{ type: 'starlight_gain', amount: 3 }, { type: 'draw', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'wuas-oph-luna-glitch',
    name: 'Luna Glitch',
    description: 'Gain 2 Starlight Charges; Gain 1 Dream Lattice stack',
    rarity: 'Rare',
    artKey: 'wuas_oph_luna_glitch',
    effects: [{ type: 'starlight_gain', amount: 2 }, { type: 'dream_lattice_gain', amount: 1 }],
  }),
  buildOphanim({
    definitionId: 'wuas-oph-wishfire-surge',
    name: 'Wishfire Surge',
    description: 'Gain 1 Dream Lattice stack; +70 Oblivion',
    rarity: 'Rare',
    artKey: 'wuas_oph_wishfire_surge',
    effects: [
      { type: 'dream_lattice_gain', amount: 1 },
      { type: 'oblivion_flat', value: 70 }],
  }),
  buildOphanim({
    definitionId: 'wuas-oph-celestine-cascade',
    name: 'Celestine Cascade',
    description: 'Gain 4 Starlight Charges; Gain 2 Dream Lattice stacks',
    rarity: 'Epic',
    artKey: 'wuas_oph_celestine_cascade',
    effects: [{ type: 'starlight_gain', amount: 4 }, { type: 'dream_lattice_gain', amount: 2 }],
  }),
  buildOphanim({
    definitionId: 'wuas-oph-aeolian-nova',
    name: 'Aeolian Nova',
    description: 'Gain 4 Starlight Charges; Nova Wish Burst (Oblivion = Starlight × (1 + Dream × 0.4))',
    rarity: 'Legendary',
    artKey: 'wuas_oph_aeolian_nova',
    effects: [
      { type: 'starlight_gain', amount: 4 },
      { type: 'wuas_nova_wish_burst', consumeStarlight: false, dreamMultiplier: 0.4 }],
  })];

// ���� Angels (3) ������������������������������������������������������������������������������������������������������������������������������

const baseAngels: AngelDefinition[] = [
  buildAngel({
    definitionId: 'wuas-ang-starwarden-selenira',
    name: 'Starwarden Selenira',
    description: 'On summon: Gain 4 Starlight Charges; Gain 2 Dream Lattice stacks. After 2 cards played: Gain 3 Starlight Charges; Gain 2 Dream Lattice stacks. While on board: +65 Oblivion per card played while on board',
    rarity: 'Legendary',
    artKey: 'wuas_ang_starwarden_selenira',
    summonCost: ['wuas-ser-solarvex-fragment', 'wuas-ser-seleniras-vigil'],
    onSummonEffects: [
      { type: 'starlight_gain', amount: 4 },
      { type: 'dream_lattice_gain', amount: 2 }],
    activatedAbility: {
      name: 'Star Ward',
      cardsPlayedRequirement: 2,
      description: 'Gain 3 Starlight Charges; Gain 2 Dream Lattice stacks',
      effects: [
        { type: 'starlight_gain', amount: 3 },
        { type: 'dream_lattice_gain', amount: 2 }],
    },
    primaryName: 'Warden Strike', exaltedName: 'Selenira Verdict',
    primaryDescription: '740 base Oblivion · 6 cards cooldown',
    exaltedDescription: '1300 base Oblivion · 8 cards cooldown',
    primaryBase: 740, exaltedBase: 1300,
    primaryCooldown: 6, exaltedCooldown: 8,
    primaryScaling: 1.35, exaltedScaling: 1.53,
    baseStats: { basePower: 94, bonusType: 'oblivion_per_card', bonusValue: 65 },
  }),
  buildAngel({
    definitionId: 'wuas-ang-draethos-eclipse-lord',
    name: 'Draethos, Eclipse Lord',
    description: 'On summon: Gain 5 Starlight Charges; Gain 3 Dream Lattice stacks. After 3 cards played: Nova Wish Burst (Oblivion = Starlight × (1 + Dream × 0.4)); Gain 3 Starlight Charges. While on board: +60 Oblivion per card played while on board',
    rarity: 'Legendary',
    artKey: 'wuas_ang_draethos_eclipse_lord',
    summonCost: ['wuas-ser-draethos-gravity', 'wuas-ser-lune-refrain'],
    onSummonEffects: [
      { type: 'starlight_gain', amount: 5 },
      { type: 'dream_lattice_gain', amount: 3 }],
    activatedAbility: {
      name: 'Eclipse Decree',
      cardsPlayedRequirement: 3,
      description: 'Nova Wish Burst (Oblivion = Starlight × (1 + Dream × 0.4)); Gain 3 Starlight Charges',
      effects: [
        { type: 'wuas_nova_wish_burst', consumeStarlight: false, dreamMultiplier: 0.4 },
        { type: 'starlight_gain', amount: 3 }],
    },
    primaryName: 'Eclipse Strike', exaltedName: 'Draethos Descent',
    primaryDescription: '760 base Oblivion · 6 cards cooldown',
    exaltedDescription: '1338 base Oblivion · 8 cards cooldown',
    primaryBase: 760, exaltedBase: 1338,
    primaryCooldown: 6, exaltedCooldown: 8,
    primaryScaling: 1.36, exaltedScaling: 1.54,
    baseStats: { basePower: 102, bonusType: 'oblivion_per_card', bonusValue: 60 },
  }),
  buildAngel({
    definitionId: 'wuas-ang-aethervex-triumphant',
    name: 'Aethervex, Triumphant',
    description: 'On summon: Gain 6 Starlight Charges; Gain 4 Dream Lattice stacks; Draw 1 card. After 3 cards played: Gain 5 Starlight Charges; Gain 5 Dream Lattice stacks. While on board: +65 Oblivion per card played while on board',
    rarity: 'Legendary',
    artKey: 'wuas_ang_aethervex_triumphant',
    summonCost: ['wuas-ser-nullspire-monolith', 'wuas-ser-draethos-gravity'],
    onSummonEffects: [
      { type: 'starlight_gain', amount: 6 },
      { type: 'dream_lattice_gain', amount: 4 },
      { type: 'draw', value: 1 }],
    activatedAbility: {
      name: 'Triumphant Wish',
      cardsPlayedRequirement: 3,
      description: 'Gain 5 Starlight Charges; Gain 5 Dream Lattice stacks',
      effects: [
        { type: 'starlight_gain', amount: 5 },
        { type: 'dream_lattice_gain', amount: 5 }],
    },
    primaryName: 'Aether Strike', exaltedName: 'Wishwright Apex',
    primaryDescription: '800 base Oblivion · 6 cards cooldown',
    exaltedDescription: '1408 base Oblivion · 8 cards cooldown',
    primaryBase: 800, exaltedBase: 1408,
    primaryCooldown: 6, exaltedCooldown: 8,
    primaryScaling: 1.38, exaltedScaling: 1.56,
    baseStats: { basePower: 116, bonusType: 'oblivion_per_card', bonusValue: 65 },
  })];

// ���� Eternal (3) ? Star Crown mechanic ��������������������������������������������������������������������������������
// eternalStacks['wuas'] = Star Crown stacks.
// wuas_constellation_lock_release cashes out Star Crowns for oblivion + chain per Dream Lattice.

const eternalCards: CardDefinition[] = [
  buildSeraphim({
    definitionId: 'wuas-et-aethervex-wishwright',
    name: 'Aethervex, the Wishwright',
    description: 'On play: Gain 6 Starlight Charges; Gain 5 Dream Lattice stacks; Gain 15 Star Crowns. While on board: +32 Oblivion per card played while active',
    rarity: 'Eternal',
    artKey: 'wuas_et_aethervex_wishwright',
    bonusType: 'oblivion_per_card',
    bonusValue: 32,
    onPlayEffects: [
      { type: 'starlight_gain', amount: 6 },
      { type: 'dream_lattice_gain', amount: 5 },
      { type: 'eternal_stack_gain', stack: 'wuas', value: 15 }],
    unsynergizedName: 'Wishwright Strike', synergizedName: 'Galaxy-wing Decree',
    unsynergizedDescription: '680 base Oblivion · 5 cards cooldown',
    synergizedDescription: '1196 base Oblivion · 7 cards cooldown · Requires Angel',
    unsynergizedBase: 680, synergizedBase: 1196,
    unsynergizedCooldown: 5, synergizedCooldown: 7,
  }),
  buildOphanim({
    definitionId: 'wuas-et-selenira-voidbane',
    name: 'Selenira Voidbane',
    description: 'Gain 10 Starlight Charges; Gain 5 Dream Lattice stacks; Nova Wish Burst (Oblivion = Starlight × (1 + Dream × 1)); Cash out up to 15 Star Crowns (+200 Oblivion per Crown)',
    rarity: 'Eternal',
    artKey: 'wuas_et_selenira_voidbane',
    effects: [
      { type: 'starlight_gain', amount: 10 },
      { type: 'dream_lattice_gain', amount: 5 },
      { type: 'wuas_nova_wish_burst', consumeStarlight: false, dreamMultiplier: 1.0 },
      { type: 'wuas_constellation_lock_release', oblivionPerStack: 200, consume: 15 }],
  }),
  buildAngel({
    definitionId: 'wuas-et-draethos-unforgotten',
    name: 'Draethos, The Unforgotten',
    description: 'On summon: Gain 5 Starlight Charges; Gain 3 Dream Lattice stacks; Gain 6 Star Crowns. After 3 cards played: Gain 4 Starlight Charges; Gain 2 Dream Lattice stacks; Gain 6 Star Crowns; Cash out up to 12 Star Crowns (+280 Oblivion per Crown). While on board: +70 Oblivion per card played while on board',
    rarity: 'Eternal',
    artKey: 'wuas_et_draethos_unforgotten',
    summonCost: ['wuas-ser-nullspire-monolith', 'wuas-ser-draethos-gravity'],
    onSummonEffects: [
      { type: 'starlight_gain', amount: 5 },
      { type: 'dream_lattice_gain', amount: 3 },
      { type: 'eternal_stack_gain', stack: 'wuas', value: 6 }],
    activatedAbility: {
      name: 'Unforgotten Verdict',
      cardsPlayedRequirement: 3,
      description: 'Gain 4 Starlight Charges; Gain 2 Dream Lattice stacks; Gain 6 Star Crowns; Cash out up to 12 Star Crowns (+280 Oblivion per Crown)',
      effects: [
        { type: 'starlight_gain', amount: 4 },
        { type: 'dream_lattice_gain', amount: 2 },
        { type: 'eternal_stack_gain', stack: 'wuas', value: 6 },
        { type: 'wuas_constellation_lock_release', oblivionPerStack: 280, consume: 12 }],
    },
    primaryName: 'Draethos Strike', exaltedName: 'Unforgotten Apex',
    primaryDescription: '860 base Oblivion · 6 cards cooldown',
    exaltedDescription: '1512 base Oblivion · 8 cards cooldown',
    primaryBase: 860, exaltedBase: 1512,
    primaryCooldown: 6, exaltedCooldown: 8,
    primaryScaling: 1.40, exaltedScaling: 1.58,
    baseStats: { basePower: 130, bonusType: 'oblivion_per_card', bonusValue: 70 },
  })];

// ���� Infinite (3) ��������������������������������������������������������������������������������������������������������������������������
// wuas_infinite_starbirth: oblivion = seraphim_on_board x starlightCharges x oblivionPerSeraphimPerStarlight.
// drawPerDream: draw N cards per Dream Lattice stack.

const infiniteCards: CardDefinition[] = [
  buildOphanim({
    definitionId: 'inf-wuas-stellarborn-throne',
    name: 'Stellarborn Throne',
    description: 'Gain 10 Starlight Charges; Gain 6 Dream Lattice stacks; Infinite Starbirth (Ob = Seraphim × Starlight × 160)',
    rarity: 'Infinite',
    artKey: 'inf_wuas_stellarborn_throne',
    effects: [
      { type: 'starlight_gain', amount: 10 },
      { type: 'dream_lattice_gain', amount: 6 },
      { type: 'wuas_infinite_starbirth', oblivionPerSeraphimPerStarlight: 160 }],
  }),
  buildCherubim({
    definitionId: 'inf-wuas-lune-choir-ascension',
    name: 'Lune Choir Ascension',
    description: 'On play: Gain 8 Starlight Charges; Gain 6 Dream Lattice stacks. While on board: Buffs Seraphim and Angel attacks: base +110',
    rarity: 'Infinite',
    artKey: 'inf_wuas_lune_choir_ascension',
    effects: [{
      type: 'cherubim_attack_buff',
      targetUnitType: 'Any',
      bonusBaseOblivion: 110,
    }],
    onPlayEffects: [
      { type: 'starlight_gain', amount: 8 },
      { type: 'dream_lattice_gain', amount: 6 }],
  }),
  buildSeraphim({
    definitionId: 'inf-wuas-wishwright-absolute',
    name: 'Wishwright Absolute',
    description: 'On play: Gain 12 Starlight Charges; Gain 8 Dream Lattice stacks; Gain 10 Star Crowns; Nova Wish Burst (Oblivion = Starlight × (1 + Dream × 1.6)); Cash out up to 18 Star Crowns (+260 Oblivion per Crown); Infinite Starbirth (Ob = Seraphim × Starlight × 180). While on board: +50 Oblivion per card played while active',
    rarity: 'Infinite',
    artKey: 'inf_wuas_wishwright_absolute',
    bonusType: 'oblivion_per_card',
    bonusValue: 50,
    onPlayEffects: [
      { type: 'starlight_gain', amount: 12 },
      { type: 'dream_lattice_gain', amount: 8 },
      { type: 'eternal_stack_gain', stack: 'wuas', value: 10 },
      { type: 'wuas_nova_wish_burst', consumeStarlight: false, dreamMultiplier: 1.6 },
      { type: 'wuas_constellation_lock_release', oblivionPerStack: 260, consume: 18 },
      { type: 'wuas_infinite_starbirth', oblivionPerSeraphimPerStarlight: 180 }],
    unsynergizedName: 'Absolute Strike', synergizedName: 'Wishwright Zenith',
    unsynergizedDescription: '980 base Oblivion · 5 cards cooldown',
    synergizedDescription: '1724 base Oblivion · 7 cards cooldown · Requires Angel',
    unsynergizedBase: 980, synergizedBase: 1724,
    unsynergizedCooldown: 5, synergizedCooldown: 7,
  })];

// ���� Exports ��������������������������������������������������������������������������������������������������������������������������������������

export const wishedUponAStarCards: CardDefinition[] = [
  ...baseSeraphim,
  ...baseCherubim,
  ...baseOphanim,
  ...baseAngels,
  ...eternalCards,
  ...infiniteCards];

export const wishedUponAStarPackPool: string[] = [
  // Seraphim
  'wuas-ser-solarvex-fragment',
  'wuas-ser-seleniras-vigil',
  'wuas-ser-lune-refrain',
  'wuas-ser-draethos-gravity',
  'wuas-ser-nullspire-monolith',
  // Cherubim
  'wuas-cher-wishwright-pulse',
  'wuas-cher-dreamvault-keeper',
  'wuas-cher-solarvex-ward',
  'wuas-cher-starlace-binding',
  'wuas-cher-voidbane-doctrine',
  // Ophanim
  'wuas-oph-skyrift-mote',
  'wuas-oph-dream-shard',
  'wuas-oph-stargazer-token',
  'wuas-oph-luna-glitch',
  'wuas-oph-wishfire-surge',
  'wuas-oph-celestine-cascade',
  'wuas-oph-aeolian-nova',
  // Angels
  'wuas-ang-starwarden-selenira',
  'wuas-ang-draethos-eclipse-lord',
  'wuas-ang-aethervex-triumphant'];
