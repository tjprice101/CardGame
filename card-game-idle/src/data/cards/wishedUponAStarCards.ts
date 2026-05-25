/**
 * Wished Upon A Star — Event Set
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

// ─────────────────────────────────────────────────────────────────────────────
// Builder helpers (mirrors the DFH pattern)
// ─────────────────────────────────────────────────────────────────────────────

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
        chainScaling: spec.unsynergizedScaling,
        costs: [],
      },
      synergized: {
        id: `${spec.definitionId}:syn`,
        label: 'Synergized',
        name: spec.synergizedName,
        description: spec.synergizedDescription ?? 'A wish answered in full — by the whole sky at once.',
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
        chainScaling: spec.primaryScaling,
        costs: [],
      },
      exalted: {
        id: `${spec.definitionId}:exalted`,
        label: 'Exalted',
        name: spec.exaltedName,
        description: spec.exaltedDescription ?? 'The sky forgets nothing — and now remembers everything at once.',
        baseOblivion: spec.exaltedBase,
        cooldownCards: spec.exaltedCooldown,
        chainScaling: spec.exaltedScaling,
        costs: [],
      },
    },
    baseStats: spec.baseStats,
  };
}

// ── Seraphim (5) ─────────────────────────────────────────────────────────────
// Passive per-card Starlight gain is tracked in store.ts by definitionId.
// onPlayEffects handle the one-shot on-play burst.

const baseSeraphim: SeraphimDefinition[] = [
  buildSeraphim({
    definitionId: 'wuas-ser-solarvex-fragment',
    name: 'Solarvex Fragment',
    description: 'Shard of an unborn sun, still pulsing with its first wish. On play: +2 Starlight Charges. While in play: +1 Starlight Charge for every card you play.',
    rarity: 'Common',
    artKey: 'wuas_ser_solarvex_fragment',
    bonusType: 'resource_generation',
    bonusValue: 1,
    onPlayEffects: [{ type: 'starlight_gain', amount: 2 }],
    unsynergizedName: 'Star Flicker', synergizedName: 'Solarvex Pulse',
    unsynergizedDescription: 'A dim spark scatters from the fragment.',
    synergizedDescription: 'The fragment remembers it was a sun — and burns.',
    unsynergizedBase: 190, synergizedBase: 335,
    unsynergizedCooldown: 4, synergizedCooldown: 5,
    unsynergizedScaling: 1.12, synergizedScaling: 1.27,
  }),
  buildSeraphim({
    definitionId: 'wuas-ser-seleniras-vigil',
    name: "Selenira's Vigil",
    description: "Selenira's patient gaze, distilled into a watchful star. On play: +2 Starlight Charges. While in play: Chain bonus grows +0.02 per Dream Lattice stack.",
    rarity: 'Rare',
    artKey: 'wuas_ser_seleniras_vigil',
    bonusType: 'chain_bonus',
    bonusValue: 0.02,
    onPlayEffects: [{ type: 'starlight_gain', amount: 2 }],
    unsynergizedName: 'Vigil Strike', synergizedName: 'Selenira Watch',
    unsynergizedDescription: 'Moonlight gathers into a single patient cut.',
    synergizedDescription: 'The vigil ends. Darkness flinches.',
    unsynergizedBase: 260, synergizedBase: 455,
    unsynergizedCooldown: 4, synergizedCooldown: 5,
    unsynergizedScaling: 1.18, synergizedScaling: 1.34,
  }),
  buildSeraphim({
    definitionId: 'wuas-ser-lune-refrain',
    name: 'Lune Refrain',
    description: 'A lunar choir holding one impossible note. On play: +2 Starlight Charges; +0.04 chain. While in play: Chain bonus scales with current Starlight Charges.',
    rarity: 'Rare',
    artKey: 'wuas_ser_lune_refrain',
    bonusType: 'chain_bonus',
    bonusValue: 0.05,
    onPlayEffects: [{ type: 'starlight_gain', amount: 2 }, { type: 'chain_gain', value: 0.04 }],
    unsynergizedName: 'Lune Echo', synergizedName: 'Choir Refrain',
    unsynergizedDescription: 'A single note from the silent side of the moon.',
    synergizedDescription: 'Every star in the chorus strikes the same key.',
    unsynergizedBase: 270, synergizedBase: 475,
    unsynergizedCooldown: 4, synergizedCooldown: 5,
    unsynergizedScaling: 1.19, synergizedScaling: 1.35,
  }),
  buildSeraphim({
    definitionId: 'wuas-ser-draethos-gravity',
    name: 'Draethos Gravity',
    description: 'The pull of a star that already collapsed, still asking to be remembered. On play: +3 Starlight Charges; +1 Dream Lattice. While in play: +40 Oblivion per card played, scaling ×1.08 per Dream Lattice stack.',
    rarity: 'Epic',
    artKey: 'wuas_ser_draethos_gravity',
    bonusType: 'oblivion_per_card',
    bonusValue: 40,
    onPlayEffects: [{ type: 'starlight_gain', amount: 3 }, { type: 'dream_lattice_gain', amount: 1 }],
    unsynergizedName: 'Gravity Pull', synergizedName: 'Draethos Descent',
    unsynergizedDescription: 'Space bends. The target falls into a smaller universe.',
    synergizedDescription: 'The collapsed star descends, dragging worlds behind it.',
    unsynergizedBase: 390, synergizedBase: 686,
    unsynergizedCooldown: 5, synergizedCooldown: 6,
    unsynergizedScaling: 1.25, synergizedScaling: 1.42,
  }),
  buildSeraphim({
    definitionId: 'wuas-ser-nullspire-monolith',
    name: 'Nullspire Monolith',
    description: 'A spire of compressed silence, where wishes go to crystallize. On play: +5 Starlight Charges; +2 Dream Lattice. While in play: Opens the Full-fire Gate — ×1.40 multiplier while Starlight ≥ 10 and Dream Lattice ≥ 4.',
    rarity: 'Legendary',
    artKey: 'wuas_ser_nullspire_monolith',
    bonusType: 'power_amplifier',
    bonusValue: 1.40,
    onPlayEffects: [{ type: 'starlight_gain', amount: 5 }, { type: 'dream_lattice_gain', amount: 2 }],
    unsynergizedName: 'Null Spire', synergizedName: 'Monolith Decree',
    unsynergizedDescription: 'The spire intones a single null syllable.',
    synergizedDescription: 'Stars halt. Dreams crystallize. The decree is absolute.',
    unsynergizedBase: 540, synergizedBase: 950,
    unsynergizedCooldown: 5, synergizedCooldown: 7,
    unsynergizedScaling: 1.32, synergizedScaling: 1.50,
  }),
];

// ── Cherubim (5) ─────────────────────────────────────────────────────────────
// Custom per-card passives (per-card Starlight, draw gate, ward, amplifier,
// dream-per-draw) are wired in store.ts by definitionId.

const baseCherubim: CherubimDefinition[] = [
  buildCherubim({
    definitionId: 'wuas-cher-wishwright-pulse',
    name: "Wishwright's Pulse",
    description: "The Wishwright's first heartbeat, still echoing in stardust. On play: +2 Starlight Charges. While on board: +1 Starlight Charge for every card you play.",
    rarity: 'Common',
    artKey: 'wuas_cher_wishwright_pulse',
    effects: [],
    onPlayEffects: [{ type: 'starlight_gain', amount: 2 }],
  }),
  buildCherubim({
    definitionId: 'wuas-cher-dreamvault-keeper',
    name: 'Dreamvault Keeper',
    description: 'Curator of the vault where unborn wishes are filed away. On play: +1 Dream Lattice. While on board: Your first draw each turn is free; further draws cost 1 Starlight Charge each.',
    rarity: 'Rare',
    artKey: 'wuas_cher_dreamvault_keeper',
    effects: [{ type: 'cherubim_draw_per_card', value: 0 }],
    onPlayEffects: [{ type: 'dream_lattice_gain', amount: 1 }],
  }),
  buildCherubim({
    definitionId: 'wuas-cher-solarvex-ward',
    name: 'Solarvex Ward',
    description: 'A lattice that refuses to let the dream end. On play: +3 Starlight Charges. While on board: Dream Lattice is preserved between turns instead of resetting.',
    rarity: 'Rare',
    artKey: 'wuas_cher_solarvex_ward',
    effects: [],
    onPlayEffects: [{ type: 'starlight_gain', amount: 3 }],
  }),
  buildCherubim({
    definitionId: 'wuas-cher-starlace-binding',
    name: 'Starlace Binding',
    description: 'Threads of constellation wound into armament. On play: +2 Starlight Charges. While on board and Starlight ≥ 5: All Seraphim and Angel attacks gain +55 base Oblivion and +0.06 chain bonus.',
    rarity: 'Epic',
    artKey: 'wuas_cher_starlace_binding',
    effects: [{
      type: 'cherubim_attack_buff',
      targetUnitType: 'Any',
      condition: { type: 'starlight_gte', value: 5 },
      bonusBaseOblivion: 55,
      bonusChainScaling: 0.06,
    }],
    onPlayEffects: [{ type: 'starlight_gain', amount: 2 }],
  }),
  buildCherubim({
    definitionId: 'wuas-cher-voidbane-doctrine',
    name: 'Voidbane Doctrine',
    description: 'A teaching written into the void itself — even silence must obey. On play: +3 Starlight Charges; +2 Dream Lattice. While on board: After 4 cards played this turn, gain +1 Dream Lattice per draw. Expires after 10 cards played.',
    rarity: 'Legendary',
    artKey: 'wuas_cher_voidbane_doctrine',
    effects: [],
    onPlayEffects: [{ type: 'starlight_gain', amount: 3 }, { type: 'dream_lattice_gain', amount: 2 }],
    discardCondition: {
      type: 'cards_played_gte',
      value: 10,
      description: 'Expires after 10 cards played.',
    },
  }),
];

// ── Ophanim (7) ──────────────────────────────────────────────────────────────

const baseOphanim: OphanimDefinition[] = [
  buildOphanim({
    definitionId: 'wuas-oph-skyrift-mote',
    name: 'Skyrift Mote',
    description: 'A speck of sky torn loose. +2 Starlight Charges.',
    rarity: 'Common',
    artKey: 'wuas_oph_skyrift_mote',
    effects: [{ type: 'starlight_gain', amount: 2 }],
  }),
  buildOphanim({
    definitionId: 'wuas-oph-dream-shard',
    name: 'Dream Shard',
    description: 'A fragment of an unfinished dream. +1 Starlight Charge; +0.03 chain.',
    rarity: 'Common',
    artKey: 'wuas_oph_dream_shard',
    effects: [{ type: 'starlight_gain', amount: 1 }, { type: 'chain_gain', value: 0.03 }],
  }),
  buildOphanim({
    definitionId: 'wuas-oph-stargazer-token',
    name: 'Stargazer Token',
    description: 'A pact between a child and the night. +3 Starlight Charges; draw 1 card.',
    rarity: 'Common',
    artKey: 'wuas_oph_stargazer_token',
    effects: [{ type: 'starlight_gain', amount: 3 }, { type: 'draw', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'wuas-oph-luna-glitch',
    name: 'Luna Glitch',
    description: 'The moon stutters, and the lattice listens. +2 Starlight Charges; +1 Dream Lattice.',
    rarity: 'Rare',
    artKey: 'wuas_oph_luna_glitch',
    effects: [{ type: 'starlight_gain', amount: 2 }, { type: 'dream_lattice_gain', amount: 1 }],
  }),
  buildOphanim({
    definitionId: 'wuas-oph-wishfire-surge',
    name: 'Wishfire Surge',
    description: 'A wish ignites in the shape of a comet. +1 Dream Lattice; +0.05 chain; +70 Oblivion.',
    rarity: 'Rare',
    artKey: 'wuas_oph_wishfire_surge',
    effects: [
      { type: 'dream_lattice_gain', amount: 1 },
      { type: 'chain_gain', value: 0.05 },
      { type: 'oblivion_flat', value: 70 },
    ],
  }),
  buildOphanim({
    definitionId: 'wuas-oph-celestine-cascade',
    name: 'Celestine Cascade',
    description: 'Heaven spills over its own brim. +4 Starlight Charges; +2 Dream Lattice.',
    rarity: 'Epic',
    artKey: 'wuas_oph_celestine_cascade',
    effects: [{ type: 'starlight_gain', amount: 4 }, { type: 'dream_lattice_gain', amount: 2 }],
  }),
  buildOphanim({
    definitionId: 'wuas-oph-aeolian-nova',
    name: 'Aeolian Nova',
    description: 'A burst of starwind, gathered into a single terrible question. +4 Starlight Charges; Nova Wish Burst (Oblivion = Starlight × (1 + Dream Lattice × 0.4)).',
    rarity: 'Legendary',
    artKey: 'wuas_oph_aeolian_nova',
    effects: [
      { type: 'starlight_gain', amount: 4 },
      { type: 'wuas_nova_wish_burst', consumeStarlight: false, dreamMultiplier: 0.4 },
    ],
  }),
];

// ── Angels (3) ───────────────────────────────────────────────────────────────

const baseAngels: AngelDefinition[] = [
  buildAngel({
    definitionId: 'wuas-ang-starwarden-selenira',
    name: 'Starwarden Selenira',
    description: 'Selenira herself, awoken to guard the dreaming. On summon: +4 Starlight Charges; +2 Dream Lattice. Activated (after 2 cards played): +3 Starlight Charges; +2 Dream Lattice. While on board: Chain grows +0.08 per card played.',
    rarity: 'Legendary',
    artKey: 'wuas_ang_starwarden_selenira',
    summonCost: ['wuas-ser-solarvex-fragment', 'wuas-ser-seleniras-vigil'],
    onSummonEffects: [
      { type: 'starlight_gain', amount: 4 },
      { type: 'dream_lattice_gain', amount: 2 },
    ],
    activatedAbility: {
      name: 'Star Ward',
      cardsPlayedRequirement: 2,
      description: 'Gain +3 Starlight Charges and +2 Dream Lattice.',
      effects: [
        { type: 'starlight_gain', amount: 3 },
        { type: 'dream_lattice_gain', amount: 2 },
      ],
    },
    primaryName: 'Warden Strike', exaltedName: 'Selenira Verdict',
    primaryDescription: 'The Starwarden raises her blade. The sky holds its breath.',
    exaltedDescription: 'Her judgment is written in constellations and cannot be appealed.',
    primaryBase: 740, exaltedBase: 1300,
    primaryCooldown: 6, exaltedCooldown: 8,
    primaryScaling: 1.35, exaltedScaling: 1.53,
    baseStats: { basePower: 94, bonusType: 'chain_bonus', bonusValue: 0.08 },
  }),
  buildAngel({
    definitionId: 'wuas-ang-draethos-eclipse-lord',
    name: 'Draethos, Eclipse Lord',
    description: 'Lord of the eclipse, who treats every shadow as a signed contract. On summon: +5 Starlight Charges; +3 Dream Lattice. Activated (after 3 cards played): Nova Wish Burst + 3 Starlight Charges. While on board: +60 Oblivion per card played.',
    rarity: 'Legendary',
    artKey: 'wuas_ang_draethos_eclipse_lord',
    summonCost: ['wuas-ser-draethos-gravity', 'wuas-ser-lune-refrain'],
    onSummonEffects: [
      { type: 'starlight_gain', amount: 5 },
      { type: 'dream_lattice_gain', amount: 3 },
    ],
    activatedAbility: {
      name: 'Eclipse Decree',
      cardsPlayedRequirement: 3,
      description: 'Trigger Nova Wish Burst, then gain +3 Starlight Charges.',
      effects: [
        { type: 'wuas_nova_wish_burst', consumeStarlight: false, dreamMultiplier: 0.4 },
        { type: 'starlight_gain', amount: 3 },
      ],
    },
    primaryName: 'Eclipse Strike', exaltedName: 'Draethos Descent',
    primaryDescription: 'A slow, deliberate shadow falls across the field.',
    exaltedDescription: 'Eclipse swallows the world for one killing instant.',
    primaryBase: 760, exaltedBase: 1338,
    primaryCooldown: 6, exaltedCooldown: 8,
    primaryScaling: 1.36, exaltedScaling: 1.54,
    baseStats: { basePower: 102, bonusType: 'oblivion_per_card', bonusValue: 60 },
  }),
  buildAngel({
    definitionId: 'wuas-ang-aethervex-triumphant',
    name: 'Aethervex, Triumphant',
    description: 'The Wishwright incarnate, with wings stitched from dead galaxies. On summon: +6 Starlight Charges; +4 Dream Lattice; draw 1. Activated (after 3 cards played): +5 Starlight Charges; +3 Dream Lattice; draw 1. While on board: Chain grows +0.12 per card played.',
    rarity: 'Legendary',
    artKey: 'wuas_ang_aethervex_triumphant',
    summonCost: ['wuas-ser-nullspire-monolith', 'wuas-ser-draethos-gravity'],
    onSummonEffects: [
      { type: 'starlight_gain', amount: 6 },
      { type: 'dream_lattice_gain', amount: 4 },
      { type: 'draw', value: 1 },
    ],
    activatedAbility: {
      name: 'Triumphant Wish',
      cardsPlayedRequirement: 3,
      description: 'Gain +5 Starlight Charges, +3 Dream Lattice, and draw 1 card.',
      effects: [
        { type: 'starlight_gain', amount: 5 },
        { type: 'dream_lattice_gain', amount: 3 },
        { type: 'draw', value: 1 },
      ],
    },
    primaryName: 'Aether Strike', exaltedName: 'Wishwright Apex',
    primaryDescription: 'Aethervex draws a single line across creation.',
    exaltedDescription: 'Every wish ever made arrives here, now, in unison.',
    primaryBase: 800, exaltedBase: 1408,
    primaryCooldown: 6, exaltedCooldown: 8,
    primaryScaling: 1.38, exaltedScaling: 1.56,
    baseStats: { basePower: 116, bonusType: 'chain_bonus', bonusValue: 0.12 },
  }),
];

// ── Eternal (3) — Star Crown mechanic ────────────────────────────────────────
// eternalStacks['wuas'] = Star Crown stacks.
// wuas_constellation_lock_release cashes out Star Crowns for oblivion + chain per Dream Lattice.

const eternalCards: CardDefinition[] = [
  buildSeraphim({
    definitionId: 'wuas-et-aethervex-wishwright',
    name: 'Aethervex, the Wishwright',
    description: 'The Wishwright unbound — original maker of stars and grief. On play: +6 Starlight Charges; +5 Dream Lattice; +15 Star Crowns banked (no cashout). While in play: Chain grows +0.14 per card played. Aethervex hoards crowns for other cards to detonate.',
    rarity: 'Eternal',
    artKey: 'wuas_et_aethervex_wishwright',
    bonusType: 'chain_bonus',
    bonusValue: 0.14,
    onPlayEffects: [
      { type: 'starlight_gain', amount: 6 },
      { type: 'dream_lattice_gain', amount: 5 },
      { type: 'eternal_stack_gain', stack: 'wuas', value: 15 },
    ],
    unsynergizedName: 'Wishwright Strike', synergizedName: 'Galaxy-wing Decree',
    unsynergizedDescription: 'The first wish ever made, repeated until it cuts.',
    synergizedDescription: 'Wings of dead galaxies sweep clean across the heavens.',
    unsynergizedBase: 680, synergizedBase: 1196,
    unsynergizedCooldown: 5, synergizedCooldown: 7,
    unsynergizedScaling: 1.36, synergizedScaling: 1.54,
  }),
  buildOphanim({
    definitionId: 'wuas-et-selenira-voidbane',
    name: 'Selenira Voidbane',
    description: "Selenira ascended — the void's first and only adversary. +10 Starlight Charges; +5 Dream Lattice; fire Nova Wish Burst (Oblivion = Starlight × (1 + Dream × 1.0)); then cash out up to 15 Star Crowns (+200 Oblivion per crown, +0.06 chain per Dream Lattice). The only card that detonates Nova and Crown cashouts in a single play — pairs with Aethervex's banked crowns.",
    rarity: 'Eternal',
    artKey: 'wuas_et_selenira_voidbane',
    effects: [
      { type: 'starlight_gain', amount: 10 },
      { type: 'dream_lattice_gain', amount: 5 },
      { type: 'wuas_nova_wish_burst', consumeStarlight: false, dreamMultiplier: 1.0 },
      { type: 'wuas_constellation_lock_release', oblivionPerStack: 200, chainPerDream: 0.06, consume: 15 },
    ],
  }),
  buildAngel({
    definitionId: 'wuas-et-draethos-unforgotten',
    name: 'Draethos, The Unforgotten',
    description: 'Draethos preserved against time itself — gravity made eternal. On summon: +5 Starlight Charges; +3 Dream Lattice; +6 Star Crowns banked. Activated (after 3 cards played): +4 Starlight Charges; +2 Dream Lattice; +6 Star Crowns; then cash out up to 12 Star Crowns (+280 Oblivion per crown, +0.08 chain per Dream Lattice). While on board: Chain grows +0.16 per card played. The slow burner — wait for the activation window and his cashout out-scales any other Eternal.',
    rarity: 'Eternal',
    artKey: 'wuas_et_draethos_unforgotten',
    summonCost: ['wuas-ser-nullspire-monolith', 'wuas-ser-draethos-gravity'],
    onSummonEffects: [
      { type: 'starlight_gain', amount: 5 },
      { type: 'dream_lattice_gain', amount: 3 },
      { type: 'eternal_stack_gain', stack: 'wuas', value: 6 },
    ],
    activatedAbility: {
      name: 'Unforgotten Verdict',
      cardsPlayedRequirement: 3,
      description: 'Gain +4 Starlight Charges, +2 Dream Lattice, and +6 Star Crowns; then cash out up to 12 Star Crowns (+280 Oblivion per crown, +0.08 chain per Dream Lattice).',
      effects: [
        { type: 'starlight_gain', amount: 4 },
        { type: 'dream_lattice_gain', amount: 2 },
        { type: 'eternal_stack_gain', stack: 'wuas', value: 6 },
        { type: 'wuas_constellation_lock_release', oblivionPerStack: 280, chainPerDream: 0.08, consume: 12 },
      ],
    },
    primaryName: 'Draethos Strike', exaltedName: 'Unforgotten Apex',
    primaryDescription: 'An eclipse remembered into matter.',
    exaltedDescription: 'Time forgets. Draethos does not.',
    primaryBase: 860, exaltedBase: 1512,
    primaryCooldown: 6, exaltedCooldown: 8,
    primaryScaling: 1.40, exaltedScaling: 1.58,
    baseStats: { basePower: 130, bonusType: 'chain_bonus', bonusValue: 0.16 },
  }),
];

// ── Infinite (3) ─────────────────────────────────────────────────────────────
// wuas_infinite_starbirth: oblivion = seraphim_on_board x starlightCharges x oblivionPerSeraphimPerStarlight.
// drawPerDream: draw N cards per Dream Lattice stack.

const infiniteCards: CardDefinition[] = [
  buildOphanim({
    definitionId: 'inf-wuas-stellarborn-throne',
    name: 'Stellarborn Throne',
    description: 'The throne every star bows toward, kept warm by unfinished wishes. +10 Starlight Charges; +6 Dream Lattice; Infinite Starbirth (Oblivion = Seraphim on board × Starlight × 110); draw 2 cards per Dream Lattice stack. The Starbirth specialist — every other Infinite leaves Starbirth scaling to the Throne.',
    rarity: 'Infinite',
    artKey: 'inf_wuas_stellarborn_throne',
    effects: [
      { type: 'starlight_gain', amount: 10 },
      { type: 'dream_lattice_gain', amount: 6 },
      { type: 'wuas_infinite_starbirth', oblivionPerSeraphimPerStarlight: 110, drawPerDream: 2 },
    ],
  }),
  buildCherubim({
    definitionId: 'inf-wuas-lune-choir-ascension',
    name: 'Lune Choir Ascension',
    description: 'The lunar choir ascending past silence into pure resonance. On play: +8 Starlight Charges; +6 Dream Lattice. While on board: All Seraphim and Angel attacks gain +110 base Oblivion and +0.14 chain bonus; Dream Lattice is preserved across turns. The persistent tempo card — doesn\'t cash out, but turns every other card into a bigger threat over multi-turn play.',
    rarity: 'Infinite',
    artKey: 'inf_wuas_lune_choir_ascension',
    effects: [{
      type: 'cherubim_attack_buff',
      targetUnitType: 'Any',
      bonusBaseOblivion: 110,
      bonusChainScaling: 0.14,
    }],
    onPlayEffects: [
      { type: 'starlight_gain', amount: 8 },
      { type: 'dream_lattice_gain', amount: 6 },
    ],
  }),
  buildSeraphim({
    definitionId: 'inf-wuas-wishwright-absolute',
    name: 'Wishwright Absolute',
    description: 'The wish that ends all other wishes. On play: +12 Starlight Charges; +8 Dream Lattice; +10 Star Crowns; Nova Wish Burst (×1.6 Dream multiplier); cash out up to 18 Star Crowns (+260 Oblivion per crown, +0.08 chain per Dream Lattice); Infinite Starbirth (Oblivion = Seraphim × Starlight × 140); draw 1 card per Dream Lattice stack. While in play: Chain grows +0.18 per card played. The only card that fires all three set cashouts in a single play — the closing move after the stockpile is built.',
    rarity: 'Infinite',
    artKey: 'inf_wuas_wishwright_absolute',
    bonusType: 'chain_bonus',
    bonusValue: 0.18,
    onPlayEffects: [
      { type: 'starlight_gain', amount: 12 },
      { type: 'dream_lattice_gain', amount: 8 },
      { type: 'eternal_stack_gain', stack: 'wuas', value: 10 },
      { type: 'wuas_nova_wish_burst', consumeStarlight: false, dreamMultiplier: 1.6 },
      { type: 'wuas_constellation_lock_release', oblivionPerStack: 260, chainPerDream: 0.08, consume: 18 },
      { type: 'wuas_infinite_starbirth', oblivionPerSeraphimPerStarlight: 140, drawPerDream: 1 },
    ],
    unsynergizedName: 'Absolute Strike', synergizedName: 'Wishwright Zenith',
    unsynergizedDescription: 'A single, final wish — granted with no margin for grief.',
    synergizedDescription: 'The Wishwright closes his hand. The sky obeys.',
    unsynergizedBase: 980, synergizedBase: 1724,
    unsynergizedCooldown: 5, synergizedCooldown: 7,
    unsynergizedScaling: 1.45, synergizedScaling: 1.63,
  }),
];

// ── Exports ───────────────────────────────────────────────────────────────────

export const wishedUponAStarCards: CardDefinition[] = [
  ...baseSeraphim,
  ...baseCherubim,
  ...baseOphanim,
  ...baseAngels,
  ...eternalCards,
  ...infiniteCards,
];

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
  'wuas-ang-aethervex-triumphant',
];
