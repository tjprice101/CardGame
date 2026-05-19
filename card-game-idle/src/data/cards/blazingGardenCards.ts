import type { CardDefinition, CherubimDefinition, OphanimDefinition, SeraphimDefinition } from '@/types/cards';

const BLAZING_GARDEN_ELEMENT = 'BlazingGarden';

interface SeraphimSpec {
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
}

interface CherubimSpec {
  definitionId: string;
  name: string;
  description: string;
  rarity: CherubimDefinition['rarity'];
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
  artKey: string;
  effects: OphanimDefinition['effects'];
}

function buildSeraphim(spec: SeraphimSpec): SeraphimDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Seraphim',
    element: BLAZING_GARDEN_ELEMENT as SeraphimDefinition['element'],
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
        tags: ['seraphim', 'unsynergized', 'blazing-garden'],
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
        tags: ['seraphim', 'synergized', 'blazing-garden'],
      },
    },
    baseStats: {
      bonusType: spec.bonusType,
      bonusValue: spec.bonusValue,
      synergyRequirement: BLAZING_GARDEN_ELEMENT as SeraphimDefinition['baseStats']['synergyRequirement'],
    },
    onPlayEffects: spec.onPlayEffects,
  };
}

function buildCherubim(spec: CherubimSpec): CherubimDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Cherubim',
    element: BLAZING_GARDEN_ELEMENT as CherubimDefinition['element'],
    rarity: spec.rarity,
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
    element: BLAZING_GARDEN_ELEMENT as OphanimDefinition['element'],
    rarity: spec.rarity,
    name: spec.name,
    description: spec.description,
    artKey: spec.artKey,
    effects: spec.effects,
  };
}

export const blazingGardenCards: CardDefinition[] = [
  // Seraphim (5)
  buildSeraphim({
    definitionId: 'bg-ser-serevathi-ember-spiral',
    name: 'Serevathi Ember Spiral',
    description: 'On play: Draw 1 card; Gain 6 Embers. While on board: Gain 3 Embers per card played while active',
    rarity: 'Common',
    artKey: 'bg_ser_serevathi_ember_spiral',
    bonusType: 'ember_per_card',
    bonusValue: 3,
    onPlayEffects: [{ type: 'draw', value: 1 }, { type: 'bloom_gain', value: 4 }],
    unsynergizedName: 'Petal Circuit Slash',
    synergizedName: 'Blazing Choir Slash',
    unsynergizedDescription: '236 base Oblivion, 5 cards cooldown, x1.14 chain scaling, Cost: discard 1 card',
    synergizedDescription: '413 base Oblivion, 6 cards cooldown, x1.30 chain scaling, Angel required',
    unsynergizedBase: 236,
    synergizedBase: 404,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
    unsynergizedScaling: 1.14,
    synergizedScaling: 1.3,
  }),
  buildSeraphim({
    definitionId: 'bg-ser-aureveth-noon-petal',
    name: 'Aureveth Noon Petal',
    description: 'On play: Gain 10 Embers; Empower the next card you play. While on board: Chain grows +0.04 per card played while active',
    rarity: 'Rare',
    artKey: 'bg_ser_aureveth_noon_petal',
    bonusType: 'chain_bonus',
    bonusValue: 0.04,
    onPlayEffects: [{ type: 'multiply_next' }, { type: 'bloom_gain', value: 6 }],
    unsynergizedName: 'Sunfloret Vector',
    synergizedName: 'Noon-That-Does-Not-End',
    unsynergizedDescription: '300 base Oblivion, 4 cards cooldown, x1.22 chain scaling, Cost: discard 1 card',
    synergizedDescription: '525 base Oblivion, 6 cards cooldown, x1.39 chain scaling, Angel required',
    unsynergizedBase: 300,
    synergizedBase: 508,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
    unsynergizedScaling: 1.18,
    synergizedScaling: 1.34,
  }),
  buildSeraphim({
    definitionId: 'bg-ser-vethkorath-starspine',
    name: 'Vethkorath Starspine',
    description: 'On play: Gain 8 Embers; Draw 2 cards; Amplify Chain by +1.9. While on board: +22 Oblivion per card played while active',
    rarity: 'Epic',
    artKey: 'bg_ser_vethkorath_starspine',
    bonusType: 'oblivion_per_card',
    bonusValue: 22,
    onPlayEffects: [{ type: 'draw', value: 2 }, { type: 'set_chain_floor', value: 1.9 }, { type: 'bloom_gain', value: 5 }],
    unsynergizedName: 'Thistle Proof Cut',
    synergizedName: 'Proof Completed Cut',
    unsynergizedDescription: '418 base Oblivion, 5 cards cooldown, x1.24 chain scaling, Cost: discard 1 card',
    synergizedDescription: '732 base Oblivion, 7 cards cooldown, x1.39 chain scaling, Angel required',
    unsynergizedBase: 418,
    synergizedBase: 704,
    unsynergizedCooldown: 5,
    synergizedCooldown: 6,
    unsynergizedScaling: 1.22,
    synergizedScaling: 1.39,
  }),
  buildSeraphim({
    definitionId: 'bg-ser-embergrove-cantor',
    name: 'Embergrove Cantor',
    description: 'On play: Salvage any 1 card; Gain 14 of your dominant resource; Draw 1 card. While on board: +14 Embers per card played while active',
    rarity: 'Legendary',
    artKey: 'bg_ser_embergrove_cantor',
    bonusType: 'ember_per_card',
    bonusValue: 14,
    onPlayEffects: [{ type: 'salvage_any' }, { type: 'bloom_gain', value: 14 }, { type: 'draw', value: 1 }],
    unsynergizedName: 'Ember Echo Rend',
    synergizedName: 'Echo Chord Rend',
    unsynergizedDescription: '516 base Oblivion, 5 cards cooldown, x1.25 chain scaling, Cost: discard 1 card',
    synergizedDescription: '903 base Oblivion, 7 cards cooldown, x1.42 chain scaling, Angel required',
    unsynergizedBase: 516,
    synergizedBase: 882,
    unsynergizedCooldown: 5,
    synergizedCooldown: 6,
    unsynergizedScaling: 1.25,
    synergizedScaling: 1.42,
  }),
  buildSeraphim({
    definitionId: 'bg-ser-final-chord-herald',
    name: 'Final Chord Herald',
    description: 'On play: Draw 2 cards; Set chain multiplier to x2.0; +220 Oblivion. While on board: +34 Oblivion per card played while active',
    rarity: 'Legendary',
    artKey: 'bg_ser_final_chord_herald',
    bonusType: 'oblivion_per_card',
    bonusValue: 34,
    onPlayEffects: [{ type: 'draw', value: 2 }, { type: 'chain_multiplier_set', value: 2.0 }, { type: 'oblivion_flat', value: 220 }],
    unsynergizedName: 'Choirline Sundering',
    synergizedName: 'Final Chord Sundering',
    unsynergizedDescription: '620 base Oblivion, 5 cards cooldown, x1.25 chain scaling, Cost: discard 1 card',
    synergizedDescription: '1085 base Oblivion, 8 cards cooldown, x1.46 chain scaling, Angel required',
    unsynergizedBase: 620,
    synergizedBase: 1048,
    unsynergizedCooldown: 6,
    synergizedCooldown: 7,
    unsynergizedScaling: 1.28,
    synergizedScaling: 1.46,
  }),

  // Cherubim (7)
  buildCherubim({
    definitionId: 'bg-cher-root-lantern-attendant',
    name: 'Root Lantern Attendant',
    description: 'On play: Draw 1 card. While on board: Adjacent active Seraphim gain +24 Oblivion per card played; Buffs Angel attacks: base +22, chain scaling +0.06, cooldown +0, multiplier x1.00',
    rarity: 'Common',
    artKey: 'bg_cher_root_lantern_attendant',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 24 }],
    onPlayEffects: [{ type: 'draw', value: 1 }],
  }),
  buildCherubim({
    definitionId: 'bg-cher-auric-floret-keeper',
    name: 'Auric Floret Keeper',
    description: 'On play: Gain 12 Embers. While on board: Adjacent active Seraphim gain +0.05 chain growth; Buffs Seraphim and Angel attacks: base +33, chain scaling +0.01, cooldown +0, multiplier x1.00',
    rarity: 'Rare',
    artKey: 'bg_cher_auric_floret_keeper',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'chain', value: 0.05 }],
    onPlayEffects: [{ type: 'bloom_gain', value: 7 }],
  }),
  buildCherubim({
    definitionId: 'bg-cher-thistleproof-chorister',
    name: 'Thistleproof Chorister',
    description: 'On play: Gain 5 Embers; Draw 1 card. While on board: Seraphim bonuses are amplified by +0.08; Buffs Seraphim attacks: base +42, chain scaling +0.05, cooldown -1, multiplier x1.00',
    rarity: 'Rare',
    artKey: 'bg_cher_thistleproof_chorister',
    effects: [{ type: 'cherubim_seraphim_amp', value: 0.08 }],
    onPlayEffects: [{ type: 'draw', value: 1 }, { type: 'bloom_gain', value: 4 }],
  }),
  buildCherubim({
    definitionId: 'bg-cher-embergrove-historian',
    name: 'Embergrove Historian',
    description: 'On play: Salvage any 1 card. While on board: Adjacent active Seraphim gain +32 Oblivion per card played; Buffs Seraphim attacks: base +34, chain scaling +0.06, cooldown -1, multiplier x1.00; Buffs Angel attacks: base +27, chain scaling +0.04, cooldown +0, multiplier x1.00',
    rarity: 'Epic',
    artKey: 'bg_cher_embergrove_historian',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 32 }],
    onPlayEffects: [{ type: 'salvage_any' }],
  }),
  buildCherubim({
    definitionId: 'bg-cher-fibonacci-sexton',
    name: 'Fibonacci Sexton',
    description: 'On play: Look at the top 5 cards, take 2 cards, and put the rest on the bottom. While on board: Each adjacent active Seraphim adds 1 extra card whenever you play a card; Buffs Angel attacks: base +46, chain scaling +0.09, cooldown +0, multiplier x1.00; Buffs Angel attacks: base +36, chain scaling +0.06, cooldown +0, multiplier x1.00',
    rarity: 'Epic',
    artKey: 'bg_cher_fibonacci_sexton',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'draw', value: 1 }],
    onPlayEffects: [{ type: 'look_top_take', look: 5, take: 2 }],
  }),
  buildCherubim({
    definitionId: 'bg-cher-golden-petal-vicar',
    name: 'Golden Petal Vicar',
    description: 'On play: Draw 2 cards; Gain 10 of your dominant resource. While on board: Adjacent active Seraphim gain +0.06 chain growth; Buffs Seraphim and Angel attacks: base +59, chain scaling +0.01, cooldown +0, multiplier x1.00; Buffs Angel attacks: base +46, chain scaling +0.01, cooldown -1, multiplier x1.00',
    rarity: 'Legendary',
    artKey: 'bg_cher_golden_petal_vicar',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'chain', value: 0.06 }],
    onPlayEffects: [{ type: 'draw', value: 2 }, { type: 'bloom_gain', value: 10 }],
  }),
  buildCherubim({
    definitionId: 'bg-cher-charred-choir-reclaimer',
    name: 'Charred Choir Reclaimer',
    description: 'On play: Shuffle discard into deck; Draw 1 card. While on board: Adjacent active Seraphim gain +40 Oblivion per card played; Buffs Seraphim attacks: base +36, chain scaling +0.07, cooldown +0, multiplier x1.00; Buffs Angel attacks: base +28, chain scaling +0.05, cooldown -1, multiplier x1.00',
    rarity: 'Legendary',
    artKey: 'bg_cher_charred_choir_reclaimer',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 40 }],
    onPlayEffects: [{ type: 'shuffle_discard' }, { type: 'draw', value: 1 }],
  }),

  // Ophanim (7)
  buildOphanim({
    definitionId: 'bg-oph-petal-route-initiate',
    name: 'Petal Route Initiate',
    description: 'Draw 1 card; Gain 5 Embers',
    rarity: 'Common',
    artKey: 'bg_oph_petal_route_initiate',
    effects: [{ type: 'draw', value: 1 }, { type: 'bloom_gain', value: 3 }],
  }),
  buildOphanim({
    definitionId: 'bg-oph-sunvein-wayfinder',
    name: 'Sunvein Wayfinder',
    description: 'Look at the top 5 cards, take 2 cards, and put the rest on the bottom',
    rarity: 'Common',
    artKey: 'bg_oph_sunvein_wayfinder',
    effects: [{ type: 'look_top_take', look: 5, take: 2 }],
  }),
  buildOphanim({
    definitionId: 'bg-oph-violet-crown-drift',
    name: 'Violet Crown Drift',
    description: 'Gain 8 Embers; Amplify Chain by +1.7; Empower the next card you play; Draw 1 card',
    rarity: 'Rare',
    artKey: 'bg_oph_violet_crown_drift',
    effects: [{ type: 'set_chain_floor', value: 1.7 }, { type: 'bloom_gain', value: 5 }],
  }),
  buildOphanim({
    definitionId: 'bg-oph-embergrove-cartographer',
    name: 'Embergrove Cartographer',
    description: 'Salvage any 1 card; Draw 1 card',
    rarity: 'Rare',
    artKey: 'bg_oph_embergrove_cartographer',
    effects: [{ type: 'salvage_any' }, { type: 'draw', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'bg-oph-rootflare-transit',
    name: 'Rootflare Transit',
    description: 'Draw 3 cards; Set chain multiplier to x1.9',
    rarity: 'Epic',
    artKey: 'bg_oph_rootflare_transit',
    effects: [{ type: 'draw', value: 3 }, { type: 'chain_multiplier_set', value: 1.9 }],
  }),
  buildOphanim({
    definitionId: 'bg-oph-spiral-memory-bloom',
    name: 'Spiral Memory Bloom',
    description: 'Replay last Ophanim played this turn; Gain 8 Embers; Empower the next card you play; Draw 1 card',
    rarity: 'Epic',
    artKey: 'bg_oph_spiral_memory_bloom',
    effects: [{ type: 'copy_last_hr' }, { type: 'bloom_gain', value: 8 }],
  }),
  buildOphanim({
    definitionId: 'bg-oph-chordbearing-migration',
    name: 'Chordbearing Migration',
    description: 'Draw 4 cards; Gain 16 Embers; Amplify Chain by +2.2',
    rarity: 'Legendary',
    artKey: 'bg_oph_chordbearing_migration',
    effects: [{ type: 'draw', value: 4 }, { type: 'set_chain_floor', value: 2.2 }, { type: 'bloom_gain', value: 10 }],
  }),

  // Eternal (5)
  buildSeraphim({
    definitionId: 'bg-et-serevathi-proofflame',
    name: 'Serevathi Proofflame',
    description: 'On play: Draw 2 cards; Gain 14 Embers. While on board: Gain 6 Embers per card played while active',
    rarity: 'Eternal',
    artKey: 'bg_et_serevathi_proofflame',
    bonusType: 'ember_per_card',
    bonusValue: 6,
    onPlayEffects: [{ type: 'draw', value: 2 }, { type: 'bloom_gain', value: 12 }],
    unsynergizedName: 'Proofflame Vector',
    synergizedName: 'Proofflame Choir Verdict',
    unsynergizedDescription: '980 base Oblivion, 5 cards cooldown, x1.25 chain scaling, Cost: discard 1 card',
    synergizedDescription: '1715 base Oblivion, 8 cards cooldown, x1.52 chain scaling, Angel required',
    unsynergizedBase: 980,
    synergizedBase: 1660,
    unsynergizedCooldown: 6,
    synergizedCooldown: 7,
    unsynergizedScaling: 1.34,
    synergizedScaling: 1.52,
  }),
  buildSeraphim({
    definitionId: 'bg-et-aureveth-evernoon',
    name: 'Aureveth Evernoon',
    description: 'On play: Set chain multiplier to x2.8; Draw 2 cards. While on board: +64 Oblivion per card played while active',
    rarity: 'Eternal',
    artKey: 'bg_et_aureveth_evernoon',
    bonusType: 'oblivion_per_card',
    bonusValue: 64,
    onPlayEffects: [{ type: 'chain_multiplier_set', value: 2.8 }, { type: 'draw', value: 2 }, { type: 'bloom_gain', value: 12 }],
    unsynergizedName: 'Evernoon Lance',
    synergizedName: 'Noon Without End Lance',
    unsynergizedDescription: '1044 base Oblivion, 5 cards cooldown, x1.25 chain scaling, Cost: discard 1 card',
    synergizedDescription: '1827 base Oblivion, 8 cards cooldown, x1.54 chain scaling, Angel required',
    unsynergizedBase: 1044,
    synergizedBase: 1768,
    unsynergizedCooldown: 6,
    synergizedCooldown: 7,
    unsynergizedScaling: 1.36,
    synergizedScaling: 1.54,
  }),
  buildCherubim({
    definitionId: 'bg-et-vethkorath-seven-crown-proof',
    name: 'Vethkorath Seven-Crown Proof',
    description: 'On play: Gain 8 Embers; Draw 1 card. While on board: Seraphim bonuses are amplified by +0.09; Buffs Seraphim attacks: base +66, chain scaling +0.08, cooldown -1, multiplier x1.00; Buffs Angel attacks: base +51, chain scaling +0.05, cooldown -1, multiplier x1.00',
    rarity: 'Eternal',
    artKey: 'bg_et_vethkorath_seven_crown',
    effects: [{ type: 'cherubim_seraphim_amp', value: 0.09 }],
    onPlayEffects: [{ type: 'draw', value: 1 }, { type: 'bloom_gain', value: 8 }],
  }),
  buildCherubim({
    definitionId: 'bg-et-embergrove-codex',
    name: 'Embergrove Codex',
    description: 'On play: Salvage any 1 card. While on board: Adjacent active Seraphim gain +52 Oblivion per card played; Buffs Seraphim and Angel attacks: base +43, chain scaling +0.09, cooldown -1, multiplier x1.00; Buffs Angel attacks: base +34, chain scaling +0.06, cooldown -1, multiplier x1.00',
    rarity: 'Eternal',
    artKey: 'bg_et_embergrove_codex',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 52 }],
    onPlayEffects: [{ type: 'salvage_any' }],
  }),
  buildOphanim({
    definitionId: 'bg-et-noonproof-transit',
    name: 'Noonproof Transit',
    description: 'Draw 4 cards; Amplify Chain by +3.0; Gain 20 Embers',
    rarity: 'Eternal',
    artKey: 'bg_et_noonproof_transit',
    effects: [{ type: 'draw', value: 4 }, { type: 'set_chain_floor', value: 3.0 }, { type: 'bloom_gain', value: 14 }],
  }),

  // Infinite (6)
  buildSeraphim({
    definitionId: 'bg-inf-final-chord-incandescent',
    name: 'Final Chord Incandescent',
    description: 'On play: Draw 4 cards; Gain 30 Embers; Set chain multiplier to x4.0. While on board: +138 Oblivion per card played while active',
    rarity: 'Infinite',
    artKey: 'bg_inf_final_chord_incandescent',
    bonusType: 'oblivion_per_card',
    bonusValue: 138,
    onPlayEffects: [{ type: 'draw', value: 4 }, { type: 'chain_multiplier_set', value: 4.0 }, { type: 'bloom_gain', value: 20 }],
    unsynergizedName: 'Incandescent Rift',
    synergizedName: 'Final Chord Rift',
    unsynergizedDescription: '1900 base Oblivion, 5 cards cooldown, x1.25 chain scaling, Cost: discard 1 card',
    synergizedDescription: '3325 base Oblivion, 8 cards cooldown, x1.55 chain scaling, Angel required',
    unsynergizedBase: 1900,
    synergizedBase: 3230,
    unsynergizedCooldown: 6,
    synergizedCooldown: 7,
    unsynergizedScaling: 1.56,
    synergizedScaling: 1.74,
  }),
  buildSeraphim({
    definitionId: 'bg-inf-soleth-vair-worldflower',
    name: 'Soleth Vair Worldflower',
    description: 'On play: Draw 3 cards; Salvage any 1 card; Amplify Chain by +4.5. While on board: +36 Embers per card played while active',
    rarity: 'Infinite',
    artKey: 'bg_inf_soleth_vair_worldflower',
    bonusType: 'ember_per_card',
    bonusValue: 36,
    onPlayEffects: [{ type: 'draw', value: 3 }, { type: 'salvage_any' }, { type: 'set_chain_floor', value: 4.5 }],
    unsynergizedName: 'Rootfire Dominion',
    synergizedName: 'Worldflower Dominion',
    unsynergizedDescription: '2220 base Oblivion, 5 cards cooldown, x1.25 chain scaling, Cost: discard 1 card',
    synergizedDescription: '3885 base Oblivion, 8 cards cooldown, x1.55 chain scaling, Angel required',
    unsynergizedBase: 2220,
    synergizedBase: 3780,
    unsynergizedCooldown: 7,
    synergizedCooldown: 8,
    unsynergizedScaling: 1.61,
    synergizedScaling: 1.8,
  }),
  buildCherubim({
    definitionId: 'bg-inf-embergrove-resurrection-array',
    name: 'Embergrove Resurrection Array',
    description: 'On play: Draw 4 cards; Shuffle discard into deck. While on board: Seraphim bonuses are amplified by +0.17; Buffs Seraphim and Angel attacks: base +80, chain scaling +0.11, cooldown -1, multiplier x1.00; Buffs Angel attacks: base +62, chain scaling +0.07, cooldown -1, multiplier x1.00',
    rarity: 'Infinite',
    artKey: 'bg_inf_embergrove_resurrection_array',
    effects: [{ type: 'cherubim_seraphim_amp', value: 0.17 }],
    onPlayEffects: [{ type: 'draw', value: 4 }, { type: 'shuffle_discard' }],
  }),
  buildCherubim({
    definitionId: 'bg-inf-choir-of-rekindled-geometry',
    name: 'Choir of Rekindled Geometry',
    description: 'On play: +1000 Oblivion; Draw 3 cards. While on board: Adjacent active Seraphim gain +0.15 chain growth; Buffs Seraphim attacks: base +76, chain scaling +0.02, cooldown -1, multiplier x1.00; Buffs Angel attacks: base +59, chain scaling +0.01, cooldown -1, multiplier x1.00',
    rarity: 'Infinite',
    artKey: 'bg_inf_choir_of_rekindled_geometry',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'chain', value: 0.15 }],
    onPlayEffects: [{ type: 'oblivion_flat', value: 1000 }, { type: 'draw', value: 3 }],
  }),
  buildOphanim({
    definitionId: 'bg-inf-noon-that-never-sets',
    name: 'Noon That Never Sets',
    description: 'Draw 5 cards; Gain 42 Embers; Set chain multiplier to x5.0',
    rarity: 'Infinite',
    artKey: 'bg_inf_noon_that_never_sets',
    effects: [{ type: 'draw', value: 5 }, { type: 'chain_multiplier_set', value: 5.0 }, { type: 'bloom_gain', value: 28 }],
  }),
  buildOphanim({
    definitionId: 'bg-inf-proof-completed-sky',
    name: 'Proof Completed Sky',
    description: 'Replay last Ophanim played this turn; Draw 4 cards; Gain 30 of your dominant resource',
    rarity: 'Infinite',
    artKey: 'bg_inf_proof_completed_sky',
    effects: [{ type: 'copy_last_hr' }, { type: 'draw', value: 4 }, { type: 'bloom_gain', value: 30 }],
  }),
];

export const blazingGardenPackPool = blazingGardenCards.map(card => card.definitionId);
