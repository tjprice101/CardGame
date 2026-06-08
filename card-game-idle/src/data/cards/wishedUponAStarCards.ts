/**
 * Wished Upon A Star ? Event Set
 *
 * Theme: Monochromatic stars, cosmic dreams, universal beings with fangs of fire
 * and wings of galaxies. The Wishwright's Age.
 *
 * Mechanic: Stellar Wish System
 *   - starlightCharges (TurnState): accumulated through card play; drives all scaling
 *   - dreamLattice (TurnState): secondary amplifier; resets each turn unless Solarvex Ward active
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
  AttackCost,
  AngelDefinition,
  CardDefinition,
  CherubimDefinition,
  OphanimDefinition,
  SeraphimDefinition,
} from '@/types/cards';

const WUAS = 'WishedUponAStar' as const;

// Builder helpers (mirrors the DFH pattern).

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
  unsynergizedCosts?: AttackCost[];
  synergizedCosts?: AttackCost[];
  unsynergizedScaling?: number;
  synergizedScaling?: number;
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
  primaryCosts?: AttackCost[];
  exaltedCosts?: AttackCost[];
  primaryScaling: number;
  exaltedScaling: number;
  baseStats: AngelDefinition['baseStats'];
  extraSummonConditions?: AngelDefinition['extraSummonConditions'];
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
        costs: spec.unsynergizedCosts ?? [],
      },
      synergized: {
        id: `${spec.definitionId}:syn`,
        label: 'Synergized',
        name: spec.synergizedName,
        description: spec.synergizedDescription ?? 'A wish answered in full ? by the whole sky at once.',
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
    extraSummonConditions: spec.extraSummonConditions,
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
        costs: spec.primaryCosts ?? [],
      },
      exalted: {
        id: `${spec.definitionId}:exalted`,
        label: 'Exalted',
        name: spec.exaltedName,
        description: spec.exaltedDescription ?? 'The sky forgets nothing ? and now remembers everything at once.',
        baseOblivion: spec.exaltedBase,
        cooldownCards: spec.exaltedCooldown,
        costs: spec.exaltedCosts ?? [],
      },
    },
    baseStats: spec.baseStats,
  };
}

// Seraphim (5).
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
    unsynergizedDescription: '210 base Oblivion 2 cards cooldown',
    synergizedDescription: '360 base Oblivion 4 cards cooldown Requires Angel',
    unsynergizedBase: 210, synergizedBase: 360,
    unsynergizedCooldown: 2, synergizedCooldown: 4,
  }),
  buildSeraphim({
    definitionId: 'wuas-ser-seleniras-vigil',
    name: "Selenira's Vigil",
    description: 'On play: Gain 2 Dream Lattice stacks; If you have 4+ Starlight Charges, Draw 1 card. While on board: +42 Oblivion per card played while active',
    rarity: 'Rare',
    artKey: 'wuas_ser_seleniras_vigil',
    bonusType: 'oblivion_per_card',
    bonusValue: 42,
    onPlayEffects: [
      { type: 'dream_lattice_gain', amount: 2 },
      {
        type: 'conditional',
        condition: { type: 'starlight_gte', value: 4 },
        then: [{ type: 'draw', value: 1 }],
      },
    ],
    unsynergizedName: 'Vigil Strike', synergizedName: 'Selenira Watch',
    unsynergizedDescription: '280 base Oblivion 3 cards cooldown',
    synergizedDescription: '490 base Oblivion 5 cards cooldown Requires Angel',
    unsynergizedBase: 280, synergizedBase: 490,
    unsynergizedCooldown: 3, synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'wuas-ser-lune-refrain',
    name: 'Lune Refrain',
    description: 'On play: Look at the top 3 cards, take 1 card, and put the rest on the bottom; Gain 1 Dream Lattice stack. While on board: +92 Oblivion per card played while active',
    rarity: 'Rare',
    artKey: 'wuas_ser_lune_refrain',
    bonusType: 'oblivion_per_card',
    bonusValue: 92,
    onPlayEffects: [{ type: 'look_top_take', look: 3, take: 1 }, { type: 'dream_lattice_gain', amount: 1 }],
    unsynergizedName: 'Lune Echo', synergizedName: 'Choir Refrain',
    unsynergizedDescription: '300 base Oblivion 3 cards cooldown',
    synergizedDescription: '520 base Oblivion 5 cards cooldown Requires Angel',
    unsynergizedBase: 300, synergizedBase: 520,
    unsynergizedCooldown: 3, synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'wuas-ser-draethos-gravity',
    name: 'Draethos Gravity',
    description: 'On play: Gain 3 Starlight Charges; Gain 1 Dream Lattice stack. While on board: +60 Oblivion per card played while active',
    rarity: 'Epic',
    artKey: 'wuas_ser_draethos_gravity',
    bonusType: 'oblivion_per_card',
    bonusValue: 60,
    onPlayEffects: [{ type: 'starlight_gain', amount: 3 }, { type: 'dream_lattice_gain', amount: 1 }],
    unsynergizedName: 'Gravity Pull', synergizedName: 'Draethos Descent',
    unsynergizedDescription: '430 base Oblivion 4 cards cooldown',
    synergizedDescription: '760 base Oblivion 7 cards cooldown Requires Angel Cost: discard 1 card',
    unsynergizedBase: 430, synergizedBase: 760,
    unsynergizedCooldown: 4, synergizedCooldown: 7,
    synergizedCosts: [{ type: 'discard_from_hand', value: 1 }],
  }),
  buildSeraphim({
    definitionId: 'wuas-ser-nullspire-monolith',
    name: 'Nullspire Monolith',
    description: 'On play: Gain 4 Starlight Charges; Gain 2 Dream Lattice stacks. While on board: Your board\'s power is amplified by x1.35 while active',
    rarity: 'Legendary',
    artKey: 'wuas_ser_nullspire_monolith',
    bonusType: 'power_amplifier',
    bonusValue: 1.35,
    onPlayEffects: [{ type: 'starlight_gain', amount: 4 }, { type: 'dream_lattice_gain', amount: 2 }],
    unsynergizedName: 'Null Spire', synergizedName: 'Monolith Decree',
    unsynergizedDescription: '560 base Oblivion 6 cards cooldown',
    synergizedDescription: '980 base Oblivion 9 cards cooldown Requires Angel Cost: discard 1 card',
    unsynergizedBase: 560, synergizedBase: 980,
    unsynergizedCooldown: 6, synergizedCooldown: 9,
    synergizedCosts: [{ type: 'discard_from_hand', value: 1 }],
  })];

// Cherubim (5).
// Custom per-card passives (per-card Starlight, draw gate, ward, amplifier,
// dream-per-draw) are wired in store.ts by definitionId.

const baseCherubim: CherubimDefinition[] = [
  buildCherubim({
    definitionId: 'wuas-cher-wishwright-pulse',
    name: "Wishwright's Pulse",
    description: 'On play: Draw 1 card',
    rarity: 'Common',
    artKey: 'wuas_cher_wishwright_pulse',
    effects: [],
    onPlayEffects: [{ type: 'draw', value: 1 }],
  }),
  buildCherubim({
    definitionId: 'wuas-cher-dreamvault-keeper',
    name: 'Dreamvault Keeper',
    description: 'On play: Gain 1 Starlight Charge; Gain 1 Dream Lattice stack',
    rarity: 'Rare',
    artKey: 'wuas_cher_dreamvault_keeper',
    effects: [],
    onPlayEffects: [{ type: 'starlight_gain', amount: 1 }, { type: 'dream_lattice_gain', amount: 1 }],
  }),
  buildCherubim({
    definitionId: 'wuas-cher-solarvex-ward',
    name: 'Solarvex Ward',
    description: 'On play: Gain 2 Dream Lattice stacks',
    rarity: 'Rare',
    artKey: 'wuas_cher_solarvex_ward',
    effects: [],
    onPlayEffects: [{ type: 'dream_lattice_gain', amount: 2 }],
  }),
  buildCherubim({
    definitionId: 'wuas-cher-starlace-binding',
    name: 'Starlace Binding',
    description: 'On play: Gain 2 Starlight Charges. While on board: Buffs Seraphim and Angel attacks: base +60',
    rarity: 'Epic',
    artKey: 'wuas_cher_starlace_binding',
    maxDurability: 9,
    effects: [
      {
        type: 'cherubim_attack_buff',
        targetUnitType: 'Any',
        bonusBaseOblivion: 60,
      }],
    onPlayEffects: [{ type: 'starlight_gain', amount: 2 }],
  }),
  buildCherubim({
    definitionId: 'wuas-cher-voidbane-doctrine',
    name: 'Voidbane Doctrine',
    description: 'On play: Gain 3 Starlight Charges; Gain 1 Dream Lattice stack',
    rarity: 'Legendary',
    artKey: 'wuas_cher_voidbane_doctrine',
    effects: [],
    onPlayEffects: [{ type: 'starlight_gain', amount: 3 }, { type: 'dream_lattice_gain', amount: 1 }],
    discardCondition: {
      type: 'cards_played_gte',
      value: 10,
      description: 'Expires after 10 cards played.',
    },
  })];

// Ophanim (7).

const baseOphanim: OphanimDefinition[] = [
  buildOphanim({
    definitionId: 'wuas-oph-skyrift-mote',
    name: 'Skyrift Mote',
    description: 'Gain 1 Starlight Charge',
    rarity: 'Common',
    artKey: 'wuas_oph_skyrift_mote',
    effects: [{ type: 'starlight_gain', amount: 1 }],
  }),
  buildOphanim({
    definitionId: 'wuas-oph-dream-shard',
    name: 'Dream Shard',
    description: 'Look at the top 3 cards, take 1 card, and put the rest on the bottom; Gain 1 Dream Lattice stack',
    rarity: 'Common',
    artKey: 'wuas_oph_dream_shard',
    effects: [{ type: 'look_top_take', look: 3, take: 1 }, { type: 'dream_lattice_gain', amount: 1 }],
  }),
  buildOphanim({
    definitionId: 'wuas-oph-stargazer-token',
    name: 'Stargazer Token',
    description: 'Draw 1 card; Gain 2 Starlight Charges',
    rarity: 'Common',
    artKey: 'wuas_oph_stargazer_token',
    effects: [{ type: 'draw', value: 1 }, { type: 'starlight_gain', amount: 2 }],
  }),
  buildOphanim({
    definitionId: 'wuas-oph-luna-glitch',
    name: 'Luna Glitch',
    description: 'Gain 2 Starlight Charges; If you have played 1+ cards this turn, Gain 2 Dream Lattice stacks',
    rarity: 'Rare',
    artKey: 'wuas_oph_luna_glitch',
    effects: [
      { type: 'starlight_gain', amount: 2 },
      {
        type: 'conditional',
        condition: { type: 'cards_played_gte', value: 1 },
        then: [{ type: 'dream_lattice_gain', amount: 2 }],
      },
    ],
  }),
  buildOphanim({
    definitionId: 'wuas-oph-wishfire-surge',
    name: 'Wishfire Surge',
    description: 'Gain 1 Dream Lattice stack; +120 Oblivion',
    rarity: 'Rare',
    artKey: 'wuas_oph_wishfire_surge',
    effects: [
      { type: 'dream_lattice_gain', amount: 1 },
      { type: 'oblivion_flat', value: 120 }],
  }),
  buildOphanim({
    definitionId: 'wuas-oph-celestine-cascade',
    name: 'Celestine Cascade',
    description: 'Gain 3 Dream Lattice stacks; If you have 4+ Starlight Charges, Draw 1 card',
    rarity: 'Epic',
    artKey: 'wuas_oph_celestine_cascade',
    effects: [
      { type: 'dream_lattice_gain', amount: 3 },
      {
        type: 'conditional',
        condition: { type: 'starlight_gte', value: 4 },
        then: [{ type: 'draw', value: 1 }],
      },
    ],
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

// Angels (3)

const baseAngels: AngelDefinition[] = [
  buildAngel({
    definitionId: 'wuas-ang-starwarden-selenira',
    name: 'Starwarden Selenira',
    description: 'On summon: Gain 4 Starlight Charges; Gain 2 Dream Lattice stacks; Draw 1 card. After 2 cards played: Gain 2 Dream Lattice stacks; Draw 1 card; Cash out up to 3 Star Crowns (+undefined Oblivion per Crown). While on board: +66 Oblivion per card played while on board',
    rarity: 'Legendary',
    artKey: 'wuas_ang_starwarden_selenira',
    summonCost: ['wuas-ser-solarvex-fragment', 'wuas-ser-seleniras-vigil'],
    onSummonEffects: [
      { type: 'starlight_gain', amount: 4 },
      { type: 'dream_lattice_gain', amount: 2 },
      { type: 'draw', value: 1 },
    ],
    activatedAbility: {
      name: 'Star Ward',
      cardsPlayedRequirement: 2,
      description: 'Gain 2 Dream Lattice stacks; Draw 1 card; Cash out up to 3 Star Crowns (+undefined Oblivion per Crown)',
      effects: [
        { type: 'dream_lattice_gain', amount: 2 },
        { type: 'draw', value: 1 },
        { type: 'wuas_constellation_lock_release', oblivionPerStack: 280, consume: 3 },
      ],
    },
    primaryName: 'Warden Strike', exaltedName: 'Selenira Verdict',
    primaryDescription: '760 base Oblivion 8 cards cooldown',
    exaltedDescription: '1310 base Oblivion 12 cards cooldown Cost: discard 1 card',
    primaryBase: 760, exaltedBase: 1310,
    primaryCooldown: 8, exaltedCooldown: 12,
    exaltedCosts: [{ type: 'discard_from_hand', value: 1 }],
    primaryScaling: 1.35, exaltedScaling: 1.53,
    baseStats: { basePower: 94, bonusType: 'oblivion_per_card', bonusValue: 66 },
  }),
  buildAngel({
    definitionId: 'wuas-ang-draethos-eclipse-lord',
    name: 'Draethos, Eclipse Lord',
    description: 'On summon: Gain 5 Starlight Charges; Gain 3 Dream Lattice stacks; Draw 1 card. After 3 cards played: Nova Wish Burst (Oblivion = Starlight × (1 + Dream × 0.7)); Gain 3 Starlight Charges; Infinite Starbirth (Ob = Seraphim × Starlight × undefined). While on board: +62 Oblivion per card played while on board',
    rarity: 'Legendary',
    artKey: 'wuas_ang_draethos_eclipse_lord',
    summonCost: ['wuas-ser-draethos-gravity', 'wuas-ser-lune-refrain'],
    onSummonEffects: [
      { type: 'starlight_gain', amount: 5 },
      { type: 'dream_lattice_gain', amount: 3 },
      { type: 'draw', value: 1 }],
    activatedAbility: {
      name: 'Eclipse Decree',
      cardsPlayedRequirement: 3,
      description: 'Nova Wish Burst (Oblivion = Starlight × (1 + Dream × 0.7)); Gain 3 Starlight Charges; Infinite Starbirth (Ob = Seraphim × Starlight × undefined)',
      effects: [
        { type: 'wuas_nova_wish_burst', consumeStarlight: false, dreamMultiplier: 0.7 },
        { type: 'starlight_gain', amount: 3 },
        { type: 'wuas_infinite_starbirth', oblivionPerSeraphimPerStarlight: 45 }],
    },
    primaryName: 'Eclipse Strike', exaltedName: 'Draethos Descent',
    primaryDescription: '790 base Oblivion 8 cards cooldown',
    exaltedDescription: '1360 base Oblivion 13 cards cooldown Cost: discard 1 card',
    primaryBase: 790, exaltedBase: 1360,
    primaryCooldown: 8, exaltedCooldown: 13,
    exaltedCosts: [{ type: 'discard_from_hand', value: 1 }],
    primaryScaling: 1.36, exaltedScaling: 1.54,
    baseStats: { basePower: 102, bonusType: 'oblivion_per_card', bonusValue: 62 },
  }),
  buildAngel({
    definitionId: 'wuas-ang-aethervex-triumphant',
    name: 'Aethervex, Triumphant',
    description: 'On summon: Gain 6 Starlight Charges; Gain 3 Dream Lattice stacks; Draw 1 card. After 3 cards played: Gain 4 Starlight Charges; Gain 2 Dream Lattice stacks; If you have 6+ Dream Lattice, Nova Wish Burst (Oblivion = Starlight × (1 + Dream × 0.6)). While on board: +68 Oblivion per card played while on board',
    rarity: 'Legendary',
    artKey: 'wuas_ang_aethervex_triumphant',
    summonCost: ['wuas-ser-nullspire-monolith', 'wuas-cher-solarvex-ward'],
    onSummonEffects: [
      { type: 'starlight_gain', amount: 6 },
      { type: 'dream_lattice_gain', amount: 3 },
      { type: 'draw', value: 1 }],
    activatedAbility: {
      name: 'Triumphant Wish',
      cardsPlayedRequirement: 3,
      description: 'Gain 4 Starlight Charges; Gain 2 Dream Lattice stacks; If you have 6+ Dream Lattice, Nova Wish Burst (Oblivion = Starlight × (1 + Dream × 0.6))',
      effects: [
        { type: 'starlight_gain', amount: 4 },
        { type: 'dream_lattice_gain', amount: 2 },
        {
          type: 'conditional',
          condition: { type: 'dream_lattice_gte', value: 6 },
          then: [{ type: 'wuas_nova_wish_burst', consumeStarlight: false, dreamMultiplier: 0.6 }],
        },
      ],
    },
    primaryName: 'Aether Strike', exaltedName: 'Wishwright Apex',
    primaryDescription: '840 base Oblivion 7 cards cooldown Cost: discard 1 card',
    exaltedDescription: '1450 base Oblivion 13 cards cooldown Cost: discard 2 cards',
    primaryBase: 840, exaltedBase: 1450,
    primaryCooldown: 7, exaltedCooldown: 13,
    primaryCosts: [{ type: 'discard_from_hand', value: 1 }],
    exaltedCosts: [{ type: 'discard_from_hand', value: 2 }],
    primaryScaling: 1.38, exaltedScaling: 1.56,
    baseStats: { basePower: 116, bonusType: 'oblivion_per_card', bonusValue: 68 },
  })];

// Eternal (3) ? Star Crown mechanic
// eternalStacks['wuas'] = Star Crown stacks.
// wuas_constellation_lock_release cashes out Star Crowns for oblivion + chain per Dream Lattice.

const eternalCards: CardDefinition[] = [
  buildSeraphim({
    definitionId: 'wuas-et-aethervex-wishwright',
    name: 'Aethervex, the Wishwright',
    description: 'On play: Gain 6 Starlight Charges and 5 Dream Lattice stacks. Gain 12 Star Crowns. If Dream Lattice is 6+, gain 4 Star Crowns. While on board: +34 Oblivion per card played while active.',
    rarity: 'Eternal',
    artKey: 'wuas_et_aethervex_wishwright',
    bonusType: 'oblivion_per_card',
    bonusValue: 34,
    onPlayEffects: [
      { type: 'starlight_gain', amount: 6 },
      { type: 'dream_lattice_gain', amount: 5 },
      { type: 'eternal_stack_gain', stack: 'wuas', value: 12 },
      {
        type: 'conditional',
        condition: { type: 'dream_lattice_gte', value: 6 },
        then: [{ type: 'eternal_stack_gain', stack: 'wuas', value: 4 }],
      }],
    unsynergizedName: 'Wishwright Strike', synergizedName: 'Galaxy-wing Decree',
    unsynergizedDescription: '700 base Oblivion 7 cards cooldown',
    synergizedDescription: '1220 base Oblivion 11 cards cooldown Requires Angel Cost: discard 1 card',
    unsynergizedBase: 700, synergizedBase: 1220,
    unsynergizedCooldown: 7, synergizedCooldown: 11,
    synergizedCosts: [{ type: 'discard_from_hand', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'wuas-et-selenira-voidbane',
    name: 'Selenira Voidbane',
    description: 'Gain 8 Starlight Charges, gain 4 Dream Lattice stacks, and gain 8 Star Crowns. Nova Wish Burst (Dream coefficient 1.20). Cash out up to 18 Star Crowns (+220 Oblivion per Crown).',
    rarity: 'Eternal',
    artKey: 'wuas_et_selenira_voidbane',
    effects: [
      { type: 'starlight_gain', amount: 8 },
      { type: 'dream_lattice_gain', amount: 4 },
      { type: 'eternal_stack_gain', stack: 'wuas', value: 8 },
      { type: 'wuas_nova_wish_burst', consumeStarlight: false, dreamMultiplier: 1.2 },
      { type: 'wuas_constellation_lock_release', oblivionPerStack: 220, consume: 18 }],
  }),
  buildAngel({
    definitionId: 'wuas-et-draethos-unforgotten',
    name: 'Draethos, The Unforgotten',
    description: 'On summon: Gain 4 Starlight Charges, 3 Dream Lattice stacks, and 6 Star Crowns. After 3 cards played: gain 3 Starlight Charges, 2 Dream Lattice stacks, and 6 Star Crowns; then Nova Wish Burst (coefficient 0.80) and cash out up to 10 Star Crowns (+260 Oblivion per Crown). While on board: +72 Oblivion per card played while on board.',
    rarity: 'Eternal',
    artKey: 'wuas_et_draethos_unforgotten',
    summonCost: ['wuas-ang-aethervex-triumphant', 'wuas-ser-draethos-gravity'],
    extraSummonConditions: [
      { type: 'cherubim_active_gte', value: 2 },
      { type: 'board_definition_gte', definitionId: 'wuas-et-aethervex-wishwright', value: 1 },
    ],
    onSummonEffects: [
      { type: 'starlight_gain', amount: 4 },
      { type: 'dream_lattice_gain', amount: 3 },
      { type: 'eternal_stack_gain', stack: 'wuas', value: 6 }],
    activatedAbility: {
      name: 'Unforgotten Verdict',
      cardsPlayedRequirement: 3,
      description: 'Gain 3 Starlight Charges; gain 2 Dream Lattice stacks; gain 6 Star Crowns; Nova Wish Burst (coefficient 0.80); cash out up to 10 Star Crowns (+260 Oblivion per Crown).',
      effects: [
        { type: 'starlight_gain', amount: 3 },
        { type: 'dream_lattice_gain', amount: 2 },
        { type: 'eternal_stack_gain', stack: 'wuas', value: 6 },
        { type: 'wuas_nova_wish_burst', consumeStarlight: false, dreamMultiplier: 0.8 },
        { type: 'wuas_constellation_lock_release', oblivionPerStack: 260, consume: 10 }],
    },
    primaryName: 'Draethos Strike', exaltedName: 'Unforgotten Apex',
    primaryDescription: '900 base Oblivion 8 cards cooldown Cost: discard 1 card',
    exaltedDescription: '1680 base Oblivion 15 cards cooldown Cost: discard 2 cards',
    primaryBase: 900, exaltedBase: 1680,
    primaryCooldown: 8, exaltedCooldown: 15,
    primaryCosts: [{ type: 'discard_from_hand', value: 1 }],
    exaltedCosts: [{ type: 'discard_from_hand', value: 2 }],
    primaryScaling: 1.40, exaltedScaling: 1.58,
    baseStats: { basePower: 130, bonusType: 'oblivion_per_card', bonusValue: 72 },
  })];

// Infinite (3)
// wuas_infinite_starbirth: oblivion = seraphim_on_board x starlightCharges x oblivionPerSeraphimPerStarlight.
// drawPerDream: draw N cards per Dream Lattice stack.

const infiniteCards: CardDefinition[] = [
  buildOphanim({
    definitionId: 'inf-wuas-stellarborn-throne',
    name: 'Stellarborn Throne',
    description: 'Gain 8 Starlight Charges; Gain 6 Dream Lattice stacks; Gain 12 Star Crowns; Infinite Starbirth (Ob = Seraphim × Starlight × 140; +1 draw per 2 Dream Lattice); If you have 8+ Dream Lattice, Gain 6 Star Crowns',
    rarity: 'Infinite',
    artKey: 'inf_wuas_stellarborn_throne',
    effects: [
      { type: 'starlight_gain', amount: 8 },
      { type: 'dream_lattice_gain', amount: 6 },
      { type: 'eternal_stack_gain', stack: 'wuas', value: 12 },
      { type: 'wuas_infinite_starbirth', oblivionPerSeraphimPerStarlight: 140, drawPerDream: 0.5 },
      {
        type: 'conditional',
        condition: { type: 'dream_lattice_gte', value: 8 },
        then: [{ type: 'eternal_stack_gain', stack: 'wuas', value: 6 }],
      }],
  }),
  buildCherubim({
    definitionId: 'inf-wuas-lune-choir-ascension',
    name: 'Lune Choir Ascension',
    description: 'On play: Gain 6 Starlight Charges; Gain 6 Dream Lattice stacks; Gain 6 Star Crowns. While on board: +1 draw every 4 cards played; Buffs Seraphim and Angel attacks: base +150, when you have 8+ Star Crowns',
    rarity: 'Infinite',
    artKey: 'inf_wuas_lune_choir_ascension',
    effects: [
      { type: 'cherubim_draw_per_card', value: 0.25 },
      {
        type: 'cherubim_attack_buff',
        targetUnitType: 'Any',
        condition: { type: 'eternal_stack_gte', stack: 'wuas', value: 8 },
        bonusBaseOblivion: 150,
      },
    ],
    onPlayEffects: [
      { type: 'starlight_gain', amount: 6 },
      { type: 'dream_lattice_gain', amount: 6 },
      { type: 'eternal_stack_gain', stack: 'wuas', value: 6 }],
  }),
  buildSeraphim({
    definitionId: 'inf-wuas-wishwright-absolute',
    name: 'Wishwright Absolute',
    description: 'On play: Gain 10 Starlight Charges; Gain 8 Dream Lattice stacks; Gain 16 Star Crowns; Nova Wish Burst (Oblivion = Starlight × (1 + Dream × 1.8)); Cash out up to 24 Star Crowns (+280 Oblivion per Crown); Infinite Starbirth (Ob = Seraphim × Starlight × 190; +1 draw per 3 Dream Lattice). While on board: +52 Oblivion per card played while active',
    rarity: 'Infinite',
    artKey: 'inf_wuas_wishwright_absolute',
    bonusType: 'oblivion_per_card',
    bonusValue: 52,
    onPlayEffects: [
      { type: 'starlight_gain', amount: 10 },
      { type: 'dream_lattice_gain', amount: 8 },
      { type: 'eternal_stack_gain', stack: 'wuas', value: 16 },
      { type: 'wuas_nova_wish_burst', consumeStarlight: false, dreamMultiplier: 1.8 },
      { type: 'wuas_constellation_lock_release', oblivionPerStack: 280, consume: 24 },
      { type: 'wuas_infinite_starbirth', oblivionPerSeraphimPerStarlight: 190, drawPerDream: 0.35 }],
    unsynergizedName: 'Absolute Strike', synergizedName: 'Wishwright Zenith',
    unsynergizedDescription: '1020 base Oblivion 9 cards cooldown Cost: discard 1 card',
    synergizedDescription: '1760 base Oblivion 15 cards cooldown Requires Angel Cost: discard 2 cards',
    unsynergizedBase: 1020, synergizedBase: 1760,
    unsynergizedCooldown: 9, synergizedCooldown: 15,
    unsynergizedCosts: [{ type: 'discard_from_hand', value: 1 }],
    synergizedCosts: [{ type: 'discard_from_hand', value: 2 }],
  })];

// Exports

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
