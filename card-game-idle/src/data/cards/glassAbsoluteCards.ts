import type { CardDefinition, CherubimDefinition, OphanimDefinition, PrismaticDepth, SeraphimDefinition } from '@/types/cards';

const GLASS_ABSOLUTE_ELEMENT = 'GlassAbsolute';

interface SeraphimSpec {
  definitionId: string;
  name: string;
  description: string;
  rarity: SeraphimDefinition['rarity'];
  prismaticDepth?: PrismaticDepth;
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
  synergizedCooldown: number;}

interface CherubimSpec {
  definitionId: string;
  name: string;
  description: string;
  rarity: CherubimDefinition['rarity'];
  prismaticDepth?: PrismaticDepth;
  artKey: string;
  effects: CherubimDefinition['effects'];
  onPlayEffects: CherubimDefinition['onPlayEffects'];
  maxDurability?: number;
}

interface OphanimSpec {
  definitionId: string;
  name: string;
  description: string;
  rarity: OphanimDefinition['rarity'];
  prismaticDepth?: PrismaticDepth;
  artKey: string;
  effects: OphanimDefinition['effects'];
}

function resolvePrismaticDepth(rarity: CardDefinition['rarity']): PrismaticDepth {
  switch (rarity) {
    case 'Common':
      return 1;
    case 'Rare':
      return 2;
    case 'Epic':
      return 3;
    case 'Legendary':
      return 4;
    case 'Eternal':
    case 'Infinite':
      return 5;
  }
}

function buildSeraphim(spec: SeraphimSpec): SeraphimDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Seraphim',
    element: GLASS_ABSOLUTE_ELEMENT as SeraphimDefinition['element'],
    rarity: spec.rarity,
    prismaticDepth: spec.prismaticDepth ?? resolvePrismaticDepth(spec.rarity),
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
        tags: ['seraphim', 'unsynergized', 'glass-absolute'],
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
        tags: ['seraphim', 'synergized', 'glass-absolute'],
      },
    },
    baseStats: { bonusType: spec.bonusType, bonusValue: spec.bonusValue, synergyRequirement: GLASS_ABSOLUTE_ELEMENT as SeraphimDefinition['baseStats']['synergyRequirement'] },
    onPlayEffects: spec.onPlayEffects,
  };
}

function buildCherubim(spec: CherubimSpec): CherubimDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Cherubim',
    element: GLASS_ABSOLUTE_ELEMENT as CherubimDefinition['element'],
    rarity: spec.rarity,
    prismaticDepth: spec.prismaticDepth ?? resolvePrismaticDepth(spec.rarity),
    name: spec.name,
    description: spec.description,
    artKey: spec.artKey,
    effects: spec.effects,
    onPlayEffects: spec.onPlayEffects,
    maxDurability: spec.maxDurability,
  };
}

function buildOphanim(spec: OphanimSpec): OphanimDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Ophanim',
    element: GLASS_ABSOLUTE_ELEMENT as OphanimDefinition['element'],
    rarity: spec.rarity,
    prismaticDepth: spec.prismaticDepth ?? resolvePrismaticDepth(spec.rarity),
    name: spec.name,
    description: spec.description,
    artKey: spec.artKey,
    effects: spec.effects,
  };
}

export const glassAbsoluteCards: CardDefinition[] = [
  buildSeraphim({
    definitionId: 'ga-ser-prismwake',
    name: 'Prismwake Seraph',
    description: 'On play: Gain 12 Proof. While on board: +12 Oblivion per card played while active',
    rarity: 'Common',
    artKey: 'ga_ser_prismwake',
    bonusType: 'oblivion_per_card',
    bonusValue: 12,
    onPlayEffects: [{ type: 'proof_gain', value: 12 }],
    unsynergizedName: 'Prismwake Vector Break',
    synergizedName: 'Prismwake Angelic Verdict',
    unsynergizedDescription: '240 base Oblivion · 5 cards cooldown · Cost: discard 1 card',
    synergizedDescription: '420 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 240,
    synergizedBase: 408,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'ga-ser-lattice-canticle',
    name: 'Lattice Canticle Seraph',
    description: 'On play: Gain 10 Proof; Empower the next card you play. While on board: +18 Oblivion per card played while active',
    rarity: 'Rare',
    artKey: 'ga_ser_lattice_canticle',
    bonusType: 'oblivion_per_card',
    bonusValue: 18,
    onPlayEffects: [{ type: 'proof_gain', value: 10 }, { type: 'multiply_next' }],
    unsynergizedName: 'Lattice Canticle Vector Break',
    synergizedName: 'Lattice Canticle Angelic Verdict',
    unsynergizedDescription: '312 base Oblivion · 5 cards cooldown · Cost: discard 1 card',
    synergizedDescription: '546 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 312,
    synergizedBase: 530,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'ga-ser-white-edge',
    name: 'White Edge Herald',
    description: 'On play: Gain 14 Proof. While on board: +14 Oblivion per card played while active',
    rarity: 'Rare',
    artKey: 'ga_ser_white_edge',
    bonusType: 'oblivion_per_card',
    bonusValue: 14,
    onPlayEffects: [{ type: 'proof_gain', value: 14 }],
    unsynergizedName: 'White Edge Vector Break',
    synergizedName: 'White Edge Angelic Verdict',
    unsynergizedDescription: '366 base Oblivion · 5 cards cooldown · Cost: discard 1 card',
    synergizedDescription: '641 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 366,
    synergizedBase: 612,
    unsynergizedCooldown: 5,
    synergizedCooldown: 6,
  }),
  buildSeraphim({
    definitionId: 'ga-ser-glass-hymn',
    name: 'Glass Hymn Sentinel',
    description: 'On play: +220 Oblivion; Gain 8 Proof. While on board: +30 Oblivion per card played while active',
    rarity: 'Epic',
    artKey: 'ga_ser_glass_hymn',
    bonusType: 'oblivion_per_card',
    bonusValue: 30,
    onPlayEffects: [{ type: 'oblivion_flat', value: 220 }, { type: 'proof_gain', value: 8 }],
    unsynergizedName: 'Glass Hymn Vector Break',
    synergizedName: 'Glass Hymn Angelic Verdict',
    unsynergizedDescription: '460 base Oblivion · 5 cards cooldown · Cost: discard 1 card',
    synergizedDescription: '805 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 460,
    synergizedBase: 782,
    unsynergizedCooldown: 5,
    synergizedCooldown: 6,
  }),
  buildSeraphim({
    definitionId: 'ga-ser-yrethborn',
    name: 'Yrethborn Ascendant',
    description: 'On play: Gain 30 Proof. While on board: +22 Oblivion per card played while active',
    rarity: 'Legendary',
    artKey: 'ga_ser_yrethborn',
    bonusType: 'oblivion_per_card',
    bonusValue: 22,
    onPlayEffects: [{ type: 'proof_gain', value: 30 }],
    unsynergizedName: 'Yrethborn Vector Break',
    synergizedName: 'Yrethborn Angelic Verdict',
    unsynergizedDescription: '690 base Oblivion · 5 cards cooldown · Cost: discard 1 card',
    synergizedDescription: '1208 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 690,
    synergizedBase: 1166,
    unsynergizedCooldown: 6,
    synergizedCooldown: 7,
  }),

  buildCherubim({
    definitionId: 'ga-cher-mirrorbody-archivist',
    name: 'Mirrorbody Archivist',
    description: 'On play: Gain 8 Proof. While on board: Adjacent active Seraphim gain +28 Oblivion per card played; Buffs Seraphim and Angel attacks: base +26, cooldown +0, multiplier x1.00',
    rarity: 'Common',
    artKey: 'ga_cher_mirrorbody_archivist',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 28 }],
    onPlayEffects: [{ type: 'proof_gain', value: 8 }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-facet-gate-ward',
    name: 'Facet Gate Ward',
    description: 'While on board: Adjacent active Seraphim chain +0.05; Buffs Seraphim attacks: base +42, cooldown -1, multiplier x1.00',
    rarity: 'Rare',
    artKey: 'ga_cher_facet_gate_ward',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Seraphim', bonusBaseOblivion: 42 }],
    onPlayEffects: [],
  }),
  buildCherubim({
    definitionId: 'ga-cher-prismatic-reliquary',
    name: 'Prismatic Reliquary',
    description: 'On play: Gain 16 Proof. While on board: Adjacent active Seraphim gain +38 Oblivion per card played; Buffs Seraphim attacks: base +34, cooldown +0, multiplier x1.00',
    rarity: 'Rare',
    artKey: 'ga_cher_prismatic_reliquary',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 38 }],
    onPlayEffects: [{ type: 'proof_gain', value: 16 }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-shard-choir-keeper',
    name: 'Shard Choir Keeper',
    description: 'On play: Shuffle discard into deck. While on board: Each adjacent active Seraphim adds 1 extra card whenever you play a card; Buffs Seraphim and Angel attacks: base +48, cooldown +0, multiplier x1.00; Buffs Angel attacks: base +37, cooldown +0, multiplier x1.00',
    rarity: 'Epic',
    artKey: 'ga_cher_shard_choir_keeper',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'draw', value: 1 }],
    onPlayEffects: [{ type: 'shuffle_discard' }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-refraction-bastion',
    name: 'Refraction Bastion',
    description: 'On play: +260 Oblivion. While on board: Seraphim bonuses are amplified by +0.09; Buffs Angel attacks: base +46, cooldown +0, multiplier x1.00; Buffs Angel attacks: base +36, cooldown +0, multiplier x1.00',
    rarity: 'Epic',
    artKey: 'ga_cher_refraction_bastion',
    effects: [{ type: 'cherubim_seraphim_amp', value: 0.09 }],
    onPlayEffects: [{ type: 'oblivion_flat', value: 260 }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-glass-mantle-custodian',
    name: 'Glass Mantle Custodian',
    description: 'On play: Salvage any 1 card. While on board: Adjacent active Seraphim gain +46 Oblivion per card played; Buffs Angel attacks: base +41, cooldown +0, multiplier x1.00; Buffs Angel attacks: base +32, cooldown -1, multiplier x1.00',
    rarity: 'Legendary',
    artKey: 'ga_cher_glass_mantle_custodian',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 46 }],
    onPlayEffects: [{ type: 'salvage_any' }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-splitlight-cantor',
    name: 'Splitlight Cantor',
    description: 'On play: Gain 18 Radiance; Gain 6 Proof. While on board: Gain 12 Radiance per card played; Buffs Seraphim attacks: base +42, cooldown -1, multiplier x1.00',
    rarity: 'Rare',
    artKey: 'ga_cher_splitlight_cantor',
    effects: [{ type: 'cherubim_resource_per_card', resource: 'radiance', value: 12 }],
    onPlayEffects: [{ type: 'radiance_gain', value: 18 }, { type: 'proof_gain', value: 6 }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-light-archive',
    name: 'Light Archive of Glass',
    description: 'On play: Look at the top 5 cards, take 2 cards, and put the rest on the bottom. While on board: Adjacent active Seraphim chain +0.06; Buffs Seraphim and Angel attacks: base +59, cooldown +0, multiplier x1.00; Buffs Angel attacks: base +46, cooldown -1, multiplier x1.00',
    rarity: 'Legendary',
    artKey: 'ga_cher_light_archive',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 59 }],
    onPlayEffects: [{ type: 'look_top_take', look: 5, take: 2 }],
  }),
  buildCherubim({
    definitionId: 'ga-cher-shardward-savant',
    name: 'Shardward Savant',
    description: 'On play: +180 Oblivion; Gain 10 Proof. While on board: Adjacent active Seraphim gain +20 Oblivion per card played; Buffs Seraphim and Angel attacks: base +17, cooldown +0, multiplier x1.00',
    rarity: 'Common',
    artKey: 'ga_cher_shardward_savant',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 20 }],
    onPlayEffects: [{ type: 'oblivion_flat', value: 180 }, { type: 'proof_gain', value: 10 }],
  }),

  buildOphanim({
    definitionId: 'ga-oph-spectral-current',
    name: 'Spectral Current',
    description: 'Draw 1 card; chain_gain',
    rarity: 'Common',
    artKey: 'ga_oph_spectral_current',
    effects: [{ type: 'proof_gain', value: 6 }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-triune-prism-flow',
    name: 'Triune Prism Flow',
    description: 'Look at the top 5 cards, take 2 cards, and put the rest on the bottom',
    rarity: 'Common',
    artKey: 'ga_oph_triune_prism_flow',
    effects: [{ type: 'look_top_take', look: 5, take: 2 }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-glassroad-oracle',
    name: 'Glassroad Oracle',
    description: 'Salvage any 1 card; Gain 10 Proof',
    rarity: 'Rare',
    artKey: 'ga_oph_glassroad_oracle',
    effects: [{ type: 'salvage_any' }, { type: 'proof_gain', value: 10 }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-radiant-splinter-map',
    name: 'Radiant Splinter Map',
    description: 'Look at the top 6 cards, take 2 cards, put 1 card on the bottom, and discard the rest',
    rarity: 'Rare',
    artKey: 'ga_oph_radiant_splinter_map',
    effects: [{ type: 'look_top_take_drop', look: 6, take: 2, drop: 1 }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-lumen-cascade',
    name: 'Lumen Cascade',
    description: 'Draw 3 cards; Empower the next card you play',
    rarity: 'Epic',
    artKey: 'ga_oph_lumen_cascade',
    effects: [{ type: 'proof_gain', value: 16 }, { type: 'multiply_next' }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-crystal-echo-archive',
    name: 'Crystal Echo Archive',
    description: 'Shuffle discard into deck; Gain 12 Proof',
    rarity: 'Epic',
    artKey: 'ga_oph_crystal_echo_archive',
    effects: [{ type: 'shuffle_discard' }, { type: 'proof_gain', value: 12 }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-white-transit',
    name: 'White Transit',
    description: 'Draw 4 cards; Gain 24 Radiance; chain_multiplier_set; Gain 20 Proof',
    rarity: 'Legendary',
    artKey: 'ga_oph_white_transit',
    effects: [{ type: 'radiance_gain', value: 24 }, { type: 'proof_gain', value: 32 }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-prism-veil-drift',
    name: 'Prism Veil Drift',
    description: 'Draw 2 cards; Look at the top 4 cards, take 1 card, and put the rest on the bottom',
    rarity: 'Rare',
    artKey: 'ga_oph_prism_veil_drift',
    effects: [{ type: 'proof_gain', value: 8 }, { type: 'look_top_take', look: 4, take: 1 }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-lattice-horizon',
    name: 'Lattice Horizon',
    description: 'chain_gain; Gain 18 Proof; chain_gain',
    rarity: 'Epic',
    artKey: 'ga_oph_lattice_horizon',
    effects: [{ type: 'proof_gain', value: 18 }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-spectral-afterimage',
    name: 'Spectral Afterimage',
    description: 'Replay last Ophanim played this turn; Draw 1 card; Gain 8 Proof',
    rarity: 'Legendary',
    artKey: 'ga_oph_spectral_afterimage',
    effects: [{ type: 'copy_last_hr' }, { type: 'proof_gain', value: 14 }],
  }),
  buildOphanim({
    definitionId: 'ga-oph-clear-beyond',
    name: 'Clear Beyond',
    description: 'Draw 3 cards; Salvage any 1 card',
    rarity: 'Common',
    artKey: 'ga_oph_clear_beyond',
    effects: [{ type: 'proof_gain', value: 12 }, { type: 'salvage_any' }],
  }),

  buildSeraphim({
    definitionId: 'ga-et-lattice-archive-seraph',
    name: 'Lattice Archive Seraph',
    description: 'On play: Gain 26 Proof; Gain 2 Cascade Proofs; If you have 35+ Proof, Spend 10 Proof; Empower the next card you play. While on board: +84 Oblivion per card played while active',
    rarity: 'Eternal',
    artKey: 'ga_et_lattice_archive_seraph',
    bonusType: 'oblivion_per_card',
    bonusValue: 84,
    // Role: PASSIVE CASCADE-PROOF BATTERY (Seraphim Eternal). +2 absol each play,
    // never amplifies  Ehoards proofs for downstream finishers.
    onPlayEffects: [
      { type: 'proof_gain', value: 26 },
      { type: 'set_secondary_gain', kind: 'absol', value: 2 },
      {
        type: 'conditional',
        condition: { type: 'proof_gte', value: 35 },
        then: [{ type: 'proof_spend', value: 10 }, { type: 'multiply_next' }],
      }],
    unsynergizedName: 'Lattice Archive Vector Break',
    synergizedName: 'Lattice Archive Angelic Verdict',
    unsynergizedDescription: '1360 base Oblivion · 6 cards cooldown',
    synergizedDescription: '2420 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 1360,
    synergizedBase: 2420,
    unsynergizedCooldown: 6,
    synergizedCooldown: 8,
  }),
  buildCherubim({
    definitionId: 'ga-et-angled-infinity',
    name: 'Angled Infinity',
    description: 'On play: Gain 18 Proof; Gain 1 Cascade Proof; If this is the first card you played this turn, Amplify up to 1 Cascade Proofs (+60 Oblivion per proof); If you have 30+ Proof, Empower the next card you play. While on board: Adjacent active Seraphim gain +44 Oblivion per card played; Buffs Seraphim attacks: base +80, cooldown -1, when you have 40+ Proof',
    rarity: 'Eternal',
    artKey: 'ga_et_angled_infinity',
    effects: [
      { type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 44 },
      {
        type: 'cherubim_attack_buff',
        targetUnitType: 'Seraphim',
        bonusBaseOblivion: 80,
        cooldownDeltaCards: -1,
        condition: { type: 'proof_gte', value: 40 },
      }],
    // Role: FIRST-TURN AMPLIFIER (Cherubim Eternal). Inside first_card_this_turn,
    // consumes 1 Cascade Proof at a modest chain coefficient.
    onPlayEffects: [
      { type: 'proof_gain', value: 18 },
      { type: 'set_secondary_gain', kind: 'absol', value: 1 },
      { type: 'conditional', condition: { type: 'first_card_this_turn' }, then: [ { type: 'absol_cascade_proof_amplify', oblivionPerProofDepth: 60, consume: 1 }] },
      { type: 'conditional', condition: { type: 'proof_gte', value: 30 }, then: [{ type: 'multiply_next' }] }],
  }),
  buildOphanim({
    definitionId: 'ga-et-first-white',
    name: 'First White',
    description: 'Gain 1 Cascade Proof; If this is the first card you played this turn, Gain 30 Proof; If you have played 1+ cards this turn, Gain 14 Proof; Empower the next card you play; If you have 40+ Proof, Spend 10 Proof; Amplify up to 2 Cascade Proofs (+72 Oblivion per proof)',
    rarity: 'Eternal',
    artKey: 'ga_et_first_white',
    // Role: PROOF ESCALATOR (Ophanim Eternal). Seeds 1; the proof_gte≥40 branch
    // also amplifies 2 Cascade Proofs at a higher coefficient.
    effects: [
      { type: 'set_secondary_gain', kind: 'absol', value: 1 },
      {
        type: 'conditional',
        condition: { type: 'first_card_this_turn' },
        then: [{ type: 'proof_gain', value: 30 }],
      },
      {
        type: 'conditional',
        condition: { type: 'cards_played_gte', value: 1 },
        then: [{ type: 'proof_gain', value: 14 }, { type: 'multiply_next' }],
      },
      {
        type: 'conditional',
        condition: { type: 'proof_gte', value: 40 },
        then: [{ type: 'proof_spend', value: 10 }, { type: 'absol_cascade_proof_amplify', oblivionPerProofDepth: 72, consume: 2 }],
      }],
  }),
  buildSeraphim({
    definitionId: 'ga-et-center-everywhere',
    name: 'The Center That Is Everywhere',
    description: 'On play: Gain 34 Proof; Gain 2 Cascade Proofs; If you have 55+ Proof, Spend 12 Proof; Empower the next card you play; Amplify up to 2 Cascade Proofs (+84 Oblivion per proof). While on board: +140 Oblivion per card played while active',
    rarity: 'Eternal',
    artKey: 'ga_et_center_everywhere',
    bonusType: 'oblivion_per_card',
    bonusValue: 140,
    // Role: HIGH-PROOF SERAPHIM FINISHER. Seeds 2; inside proof_gte≥55 amp,
    // consumes 2 Cascade Proofs at a strong chain coefficient.
    onPlayEffects: [
      { type: 'proof_gain', value: 34 },
      { type: 'set_secondary_gain', kind: 'absol', value: 2 },
      { type: 'conditional', condition: { type: 'proof_gte', value: 55 }, then: [{ type: 'proof_spend', value: 12 }, { type: 'multiply_next' }, { type: 'absol_cascade_proof_amplify', oblivionPerProofDepth: 84, consume: 2 }] }],
    unsynergizedName: 'Center Everywhere Vector Break',
    synergizedName: 'Center Everywhere Angelic Verdict',
    unsynergizedDescription: '1620 base Oblivion · 6 cards cooldown',
    synergizedDescription: '2860 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 1620,
    synergizedBase: 2860,
    unsynergizedCooldown: 6,
    synergizedCooldown: 8,
  }),
  buildCherubim({
    definitionId: 'ga-et-perfect-refraction',
    name: 'Perfect Refraction',
    description: 'On play: Gain 24 Proof; Gain 3 Cascade Proofs; If you have 45+ Proof, Empower the next card you play. While on board: All Oblivion gain +42%',
    rarity: 'Eternal',
    artKey: 'ga_et_perfect_refraction',
    maxDurability: 8,
    effects: [
      { type: 'cherubim_global_oblivion_mult', value: 0.42 }],
    // Role: BACK-ROW CASCADE-PROOF BATTERY (Cherubim Eternal). +3 absol; never
    // amplifies  Efeeds adjacent Seraphim/Angel finishers.
    onPlayEffects: [
      { type: 'proof_gain', value: 24 },
      { type: 'set_secondary_gain', kind: 'absol', value: 3 },
      { type: 'conditional', condition: { type: 'proof_gte', value: 45 }, then: [{ type: 'multiply_next' }] }],
  }),

  buildSeraphim({
    definitionId: 'ga-inf-glass-absolute',
    name: 'Glass Absolute Seraph',
    description: 'On play: Gain 50 Proof; Gain 3 Cascade Proofs; If you have 90+ Proof, Spend 20 Proof; Empower the next card you play; Empower the next card you play; Amplify all Cascade Proofs (+96 Oblivion per proof). While on board: +250 Oblivion per card played while active',
    rarity: 'Infinite',
    artKey: 'ga_inf_glass_absolute',
    bonusType: 'oblivion_per_card',
    bonusValue: 250,
    // Role: APEX SERAPHIM PROOF FINISHER. Seeds 3; inside proof_gte≥90, amplifies
    // ALL banked Cascade Proofs at the strongest coefficient in the set.
    onPlayEffects: [
      { type: 'proof_gain', value: 50 },
      { type: 'set_secondary_gain', kind: 'absol', value: 3 },
      {
        type: 'conditional',
        condition: { type: 'proof_gte', value: 90 },
        then: [{ type: 'proof_spend', value: 20 }, { type: 'multiply_next' }, { type: 'multiply_next' }, { type: 'absol_cascade_proof_amplify', oblivionPerProofDepth: 96 }],
      }],
    unsynergizedName: 'Glass Absolute Vector Break',
    synergizedName: 'Glass Absolute Angelic Verdict',
    unsynergizedDescription: '3280 base Oblivion · 7 cards cooldown',
    synergizedDescription: '5780 base Oblivion · 9 cards cooldown · Requires Angel',
    unsynergizedBase: 3280,
    synergizedBase: 5780,
    unsynergizedCooldown: 7,
    synergizedCooldown: 9,
  }),
  buildCherubim({
    definitionId: 'ga-inf-refracted-sovereign',
    name: 'Refracted Sovereign',
    description: 'On play: Gain 36 Proof; Gain 4 Cascade Proofs; If you have 60+ Proof, Spend 12 Proof; Empower the next card you play. While on board: Adjacent active Seraphim gain +88 Oblivion per card played; Buffs Seraphim attacks: base +130, cooldown -1, multiplier x1.00; Buffs Angel attacks: base +180, cooldown -1, when you have 70+ Proof',
    rarity: 'Infinite',
    artKey: 'ga_inf_refracted_sovereign',
    effects: [
      { type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 88 },
      { type: 'cherubim_attack_buff', targetUnitType: 'Seraphim', bonusBaseOblivion: 130, cooldownDeltaCards: -1, multiplier: 1.0 },
      {
        type: 'cherubim_attack_buff',
        targetUnitType: 'Angel',
        bonusBaseOblivion: 180,
        cooldownDeltaCards: -1,
        condition: { type: 'proof_gte', value: 70 },
      }],
    // Role: BIG INFINITE BATTERY (Cherubim). +4 Cascade Proofs, no amplify  E
    // the highest-volume back-row reservoir in the set.
    onPlayEffects: [
      { type: 'proof_gain', value: 36 },
      { type: 'set_secondary_gain', kind: 'absol', value: 4 },
      { type: 'conditional', condition: { type: 'proof_gte', value: 60 }, then: [{ type: 'proof_spend', value: 12 }, { type: 'multiply_next' }] }],
  }),
  buildOphanim({
    definitionId: 'ga-inf-yreth-prism-at-center',
    name: 'Yreth, Prism at Center',
    description: 'Gain 42 Proof; Gain 2 Cascade Proofs; If you have 65+ Proof, Spend 14 Proof; If you have 90+ Proof, Empower the next card you play; Amplify up to 2 Cascade Proofs (+120 Oblivion per proof)',
    rarity: 'Infinite',
    artKey: 'ga_inf_yreth_prism_at_center',
    // Role: HIGH-PROOF OPHANIM AMPLIFIER. Seeds 2; inside proof_gte≥90, also
    // amplifies 2 Cascade Proofs at a high chain coefficient.
    effects: [
      { type: 'proof_gain', value: 42 },
      { type: 'set_secondary_gain', kind: 'absol', value: 2 },
      { type: 'conditional', condition: { type: 'proof_gte', value: 65 }, then: [{ type: 'proof_spend', value: 14 }] },
      { type: 'conditional', condition: { type: 'proof_gte', value: 90 }, then: [{ type: 'multiply_next' }, { type: 'absol_cascade_proof_amplify', oblivionPerProofDepth: 120, consume: 2 }] }],
  }),
  buildSeraphim({
    definitionId: 'ga-inf-chorus-unbroken-spectrum',
    name: 'Chorus of the Unbroken Spectrum',
    description: 'On play: Gain 36 Proof; Gain 2 Cascade Proofs; If you have 75+ Proof, Spend 16 Proof; Empower the next card you play; Amplify up to 1 Cascade Proofs (+180 Oblivion per proof). While on board: +170 Oblivion per card played while active',
    rarity: 'Infinite',
    artKey: 'ga_inf_chorus_unbroken_spectrum',
    bonusType: 'oblivion_per_card',
    bonusValue: 170,
    // Role: LOW-CONSUME HIGH-COEFFICIENT SERAPHIM. Seeds 2; inside proof_gte≥75,
    // consumes just 1 Cascade Proof at the strongest single-proof coefficient.
    onPlayEffects: [
      { type: 'proof_gain', value: 36 },
      { type: 'set_secondary_gain', kind: 'absol', value: 2 },
      { type: 'conditional', condition: { type: 'proof_gte', value: 75 }, then: [{ type: 'proof_spend', value: 16 }, { type: 'multiply_next' }, { type: 'absol_cascade_proof_amplify', oblivionPerProofDepth: 180, consume: 1 }] }],
    unsynergizedName: 'Unbroken Spectrum Vector Break',
    synergizedName: 'Unbroken Spectrum Angelic Verdict',
    unsynergizedDescription: '2860 base Oblivion · 7 cards cooldown',
    synergizedDescription: '4960 base Oblivion · 9 cards cooldown · Requires Angel',
    unsynergizedBase: 2860,
    synergizedBase: 4960,
    unsynergizedCooldown: 7,
    synergizedCooldown: 9,
  }),
  buildCherubim({
    definitionId: 'ga-inf-shattered-without-shattering',
    name: 'Shattered Without Shattering',
    description: 'On play: Gain 30 Proof; Gain 3 Cascade Proofs; If you have 70+ Proof, Spend 14 Proof; Empower the next card you play; Amplify up to 2 Cascade Proofs (+108 Oblivion per proof). While on board: Seraphim bonuses are amplified by +0.24; Adjacent active Seraphim gain +86 Oblivion per card played; Buffs Angel attacks: base +180, cooldown -1, multiplier x1.00; Buffs Seraphim attacks: base +120, cooldown -1, when you have 60+ Proof',
    rarity: 'Infinite',
    artKey: 'ga_inf_shattered_without_shattering',
    effects: [
      { type: 'cherubim_seraphim_amp', value: 0.24 },
      { type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 86 },
      { type: 'cherubim_attack_buff', targetUnitType: 'Angel', bonusBaseOblivion: 180, cooldownDeltaCards: -1, multiplier: 1.0 },
      {
        type: 'cherubim_attack_buff',
        targetUnitType: 'Seraphim',
        bonusBaseOblivion: 120,
        cooldownDeltaCards: -1,
        condition: { type: 'proof_gte', value: 60 },
      }],
    // Role: MID-BATTERY+CASHOUT (Cherubim Infinite). Seeds 3; the proof_gte≥70
    // branch amplifies 2 Cascade Proofs at a mid coefficient.
    onPlayEffects: [
      { type: 'proof_gain', value: 30 },
      { type: 'set_secondary_gain', kind: 'absol', value: 3 },
      { type: 'conditional', condition: { type: 'proof_gte', value: 70 }, then: [{ type: 'proof_spend', value: 14 }, { type: 'multiply_next' }, { type: 'absol_cascade_proof_amplify', oblivionPerProofDepth: 108, consume: 2 }] }],
  }),
  buildOphanim({
    definitionId: 'ga-inf-color-after-white',
    name: 'Color After White',
    description: 'Gain 40 Proof; Spend 20 Proof; Empower the next card you play; Gain 3 Cascade Proofs; If you have 70+ Proof, Spend 10 Proof; Empower the next card you play; If you have 95+ Proof, Amplify all Cascade Proofs (+150 Oblivion per proof)',
    rarity: 'Infinite',
    artKey: 'ga_inf_color_after_white',
    // Role: APEX OPHANIM PROOF FINISHER. Seeds 3; inside proof_gte≥95, amplifies
    // ALL banked Cascade Proofs  Ethe Ophanim counterpart to Glass Absolute Seraph.
    effects: [
      { type: 'proof_gain', value: 40 },
      { type: 'proof_spend', value: 20 },
      { type: 'multiply_next' },
      { type: 'set_secondary_gain', kind: 'absol', value: 3 },
      { type: 'conditional', condition: { type: 'proof_gte', value: 70 }, then: [{ type: 'proof_spend', value: 10 }, { type: 'multiply_next' }] },
      { type: 'conditional', condition: { type: 'proof_gte', value: 95 }, then: [ { type: 'absol_cascade_proof_amplify', oblivionPerProofDepth: 150 }] }],
  })];

export const glassAbsolutePackPool = glassAbsoluteCards.map(card => card.definitionId);
