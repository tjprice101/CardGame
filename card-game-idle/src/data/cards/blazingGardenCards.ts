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
  synergizedCooldown: number;}

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
    description: 'On play: Draw 1 card; Gain 4 Bloom. While on board: Gain 3 Embers per card played while active',
    rarity: 'Common',
    artKey: 'bg_ser_serevathi_ember_spiral',
    bonusType: 'ember_per_card',
    bonusValue: 3,
    onPlayEffects: [{ type: 'bloom_gain', value: 6 }],
    unsynergizedName: 'Petal Circuit Slash',
    synergizedName: 'Blazing Choir Slash',
    unsynergizedDescription: '236 base Oblivion · 5 cards cooldown · Cost: discard 1 card',
    synergizedDescription: '413 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 236,
    synergizedBase: 404,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'bg-ser-aureveth-noon-petal',
    name: 'Aureveth Noon Petal',
    description: 'On play: Empower the next card you play; Gain 6 Bloom. While on board: +18 Oblivion whenever you play an Ophanim while active',
    rarity: 'Rare',
    artKey: 'bg_ser_aureveth_noon_petal',
    bonusType: 'ophanim_bonus',
    bonusValue: 18,
    onPlayEffects: [{ type: 'multiply_next' }, { type: 'bloom_gain', value: 6 }],
    unsynergizedName: 'Sunfloret Vector',
    synergizedName: 'Noon-That-Does-Not-End',
    unsynergizedDescription: '300 base Oblivion · 4 cards cooldown · Cost: discard 1 card',
    synergizedDescription: '525 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 300,
    synergizedBase: 508,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'bg-ser-vethkorath-starspine',
    name: 'Vethkorath Starspine',
    description: 'On play: Draw 2 cards; Gain 5 Bloom. While on board: +22 Oblivion per card played while active',
    rarity: 'Epic',
    artKey: 'bg_ser_vethkorath_starspine',
    bonusType: 'oblivion_per_card',
    bonusValue: 22,
    onPlayEffects: [{ type: 'bloom_gain', value: 9 }],
    unsynergizedName: 'Thistle Proof Cut',
    synergizedName: 'Proof Completed Cut',
    unsynergizedDescription: '418 base Oblivion · 5 cards cooldown · Cost: discard 1 card',
    synergizedDescription: '732 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 418,
    synergizedBase: 704,
    unsynergizedCooldown: 5,
    synergizedCooldown: 6,
  }),
  buildSeraphim({
    definitionId: 'bg-ser-embergrove-cantor',
    name: 'Embergrove Cantor',
    description: 'On play: Salvage any 1 card; Gain 14 Bloom; Draw 1 card. While on board: Gain 14 Embers per card played while active',
    rarity: 'Legendary',
    artKey: 'bg_ser_embergrove_cantor',
    bonusType: 'ember_per_card',
    bonusValue: 14,
    onPlayEffects: [{ type: 'salvage_any' }, { type: 'bloom_gain', value: 16 }],
    unsynergizedName: 'Ember Echo Rend',
    synergizedName: 'Echo Chord Rend',
    unsynergizedDescription: '516 base Oblivion · 5 cards cooldown · Cost: discard 1 card',
    synergizedDescription: '903 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 516,
    synergizedBase: 882,
    unsynergizedCooldown: 5,
    synergizedCooldown: 6,
  }),
  buildSeraphim({
    definitionId: 'bg-ser-final-chord-herald',
    name: 'Final Chord Herald',
    description: 'On play: Draw 2 cards; +220 Oblivion. While on board: +34 Oblivion per card played while active',
    rarity: 'Legendary',
    artKey: 'bg_ser_final_chord_herald',
    bonusType: 'oblivion_per_card',
    bonusValue: 34,
    onPlayEffects: [{ type: 'bloom_gain', value: 6 }, { type: 'oblivion_flat', value: 220 }],
    unsynergizedName: 'Choirline Sundering',
    synergizedName: 'Final Chord Sundering',
    unsynergizedDescription: '620 base Oblivion · 5 cards cooldown · Cost: discard 1 card',
    synergizedDescription: '1085 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 620,
    synergizedBase: 1048,
    unsynergizedCooldown: 6,
    synergizedCooldown: 7,
  }),

  // Cherubim (7)
  buildCherubim({
    definitionId: 'bg-cher-root-lantern-attendant',
    name: 'Root Lantern Attendant',
    description: 'On play: Draw 1 card. While on board: Adjacent active Seraphim gain +24 Oblivion per card played; Buffs Angel attacks: base +22, cooldown +0, multiplier x1.00',
    rarity: 'Common',
    artKey: 'bg_cher_root_lantern_attendant',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 24 }],
    onPlayEffects: [{ type: 'bloom_gain', value: 3 }],
  }),
  buildCherubim({
    definitionId: 'bg-cher-auric-floret-keeper',
    name: 'Auric Floret Keeper',
    description: 'On play: Gain 7 Bloom. While on board: Adjacent active Seraphim chain +0.05; Buffs Seraphim and Angel attacks: base +33, cooldown +0, multiplier x1.00',
    rarity: 'Rare',
    artKey: 'bg_cher_auric_floret_keeper',
    effects: [],
    onPlayEffects: [{ type: 'bloom_gain', value: 7 }],
  }),
  buildCherubim({
    definitionId: 'bg-cher-thistleproof-chorister',
    name: 'Thistleproof Chorister',
    description: 'On play: Draw 1 card; Gain 4 Bloom. While on board: Seraphim bonuses are amplified by +0.08; Buffs Seraphim attacks: base +42, cooldown -1, multiplier x1.00',
    rarity: 'Rare',
    artKey: 'bg_cher_thistleproof_chorister',
    effects: [{ type: 'cherubim_seraphim_amp', value: 0.08 }],
    onPlayEffects: [{ type: 'bloom_gain', value: 6 }],
  }),
  buildCherubim({
    definitionId: 'bg-cher-embergrove-historian',
    name: 'Embergrove Historian',
    description: 'On play: Salvage any 1 card. While on board: Adjacent active Seraphim gain +32 Oblivion per card played; Buffs Seraphim attacks: base +34, cooldown -1, multiplier x1.00; Buffs Angel attacks: base +27, cooldown +0, multiplier x1.00',
    rarity: 'Epic',
    artKey: 'bg_cher_embergrove_historian',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 32 }],
    onPlayEffects: [{ type: 'salvage_any' }],
  }),
  buildCherubim({
    definitionId: 'bg-cher-fibonacci-sexton',
    name: 'Fibonacci Sexton',
    description: 'On play: Look at the top 5 cards, take 2 cards, and put the rest on the bottom. While on board: Each adjacent active Seraphim adds 1 extra card whenever you play a card; Buffs Angel attacks: base +46, cooldown +0, multiplier x1.00; Buffs Angel attacks: base +36, cooldown +0, multiplier x1.00',
    rarity: 'Epic',
    artKey: 'bg_cher_fibonacci_sexton',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'draw', value: 1 }],
    onPlayEffects: [{ type: 'look_top_take', look: 5, take: 2 }],
  }),
  buildCherubim({
    definitionId: 'bg-cher-golden-petal-vicar',
    name: 'Golden Petal Vicar',
    description: 'On play: Draw 2 cards; Gain 10 Bloom. While on board: Adjacent active Seraphim chain +0.06; Buffs Seraphim and Angel attacks: base +59, cooldown +0, multiplier x1.00; Buffs Angel attacks: base +46, cooldown -1, multiplier x1.00',
    rarity: 'Legendary',
    artKey: 'bg_cher_golden_petal_vicar',
    maxDurability: 9,
    effects: [{ type: 'cherubim_global_oblivion_mult', value: 0.48 }],
    onPlayEffects: [{ type: 'bloom_gain', value: 14 }],
  }),
  buildCherubim({
    definitionId: 'bg-cher-charred-choir-reclaimer',
    name: 'Charred Choir Reclaimer',
    description: 'On play: Shuffle discard into deck; Draw 1 card. While on board: Adjacent active Seraphim gain +40 Oblivion per card played; Buffs Seraphim attacks: base +36, cooldown +0, multiplier x1.00; Buffs Angel attacks: base +28, cooldown -1, multiplier x1.00',
    rarity: 'Legendary',
    artKey: 'bg_cher_charred_choir_reclaimer',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 40 }],
    onPlayEffects: [{ type: 'shuffle_discard' }, { type: 'bloom_gain', value: 3 }],
  }),

  // Ophanim (7)
  buildOphanim({
    definitionId: 'bg-oph-petal-route-initiate',
    name: 'Petal Route Initiate',
    description: 'Draw 1 card; Gain 3 Bloom',
    rarity: 'Common',
    artKey: 'bg_oph_petal_route_initiate',
    effects: [{ type: 'bloom_gain', value: 5 }],
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
    description: 'chain_gain; Gain 5 Bloom; Empower the next card you play; Draw 1 card',
    rarity: 'Rare',
    artKey: 'bg_oph_violet_crown_drift',
    effects: [{ type: 'bloom_gain', value: 7 }, { type: 'multiply_next' }],
  }),
  buildOphanim({
    definitionId: 'bg-oph-embergrove-cartographer',
    name: 'Embergrove Cartographer',
    description: 'Salvage any 1 card; Draw 1 card',
    rarity: 'Rare',
    artKey: 'bg_oph_embergrove_cartographer',
    effects: [{ type: 'salvage_any' }, { type: 'bloom_gain', value: 2 }],
  }),
  buildOphanim({
    definitionId: 'bg-oph-rootflare-transit',
    name: 'Rootflare Transit',
    description: 'Draw 3 cards; chain_multiplier_set',
    rarity: 'Epic',
    artKey: 'bg_oph_rootflare_transit',
    effects: [{ type: 'bloom_gain', value: 8 }],
  }),
  buildOphanim({
    definitionId: 'bg-oph-spiral-memory-bloom',
    name: 'Spiral Memory Bloom',
    description: 'Replay last Ophanim played this turn; Gain 8 Bloom; Empower the next card you play; Draw 1 card',
    rarity: 'Epic',
    artKey: 'bg_oph_spiral_memory_bloom',
    effects: [{ type: 'copy_last_hr' }, { type: 'bloom_gain', value: 8 }],
  }),
  buildOphanim({
    definitionId: 'bg-oph-chordbearing-migration',
    name: 'Chordbearing Migration',
    description: 'Draw 4 cards; chain_gain; Gain 10 Bloom',
    rarity: 'Legendary',
    artKey: 'bg_oph_chordbearing_migration',
    effects: [{ type: 'bloom_gain', value: 18 }],
  }),

  // Eternal (5) - OVERHAULED
  buildSeraphim({
    definitionId: 'bg-et-serevathi-proofflame',
    name: 'Serevathi Proofflame',
    description: 'On play: Set Garden Law to Rose if unset; Choose a lineage, then Burn-phase cards gain 1 Seed when you play a different lineage; Echo effects are doubled for 1 turn; Gain 2 Wild Pollen. While on board: +25 Oblivion per card played while active',
    rarity: 'Eternal',
    artKey: 'bg_et_serevathi_proofflame',
    bonusType: 'oblivion_per_card',
    bonusValue: 25,
    // Role: PASSIVE POLLEN BATTERY (Seraphim Eternal). +2 garden each play; no
    // seed  Estockpiles pollen for downstream finishers.
    onPlayEffects: [
      { type: 'set_garden_law', law: 'Rose' },
      { type: 'choose_lineage', effect: { type: 'burn_phase_seed_on_other_lineage_play', value: 1 } },
      { type: 'echo_effect_double', duration: 1 },
      { type: 'set_secondary_gain', kind: 'garden', value: 2 }],
    unsynergizedName: 'Roseproof Spiral',
    synergizedName: 'Roseproof Chord',
    unsynergizedDescription: '1020 base Oblivion · 4 cards cooldown · Cost: discard 1 card',
    synergizedDescription: '1785 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 1100,
    synergizedBase: 1850,
    unsynergizedCooldown: 5,
    synergizedCooldown: 8,
  }),
  buildSeraphim({
    definitionId: 'bg-et-aureveth-evernoon',
    name: 'Aureveth Evernoon',
    description: 'On play: Set Garden Law to Sunflower if unset; Gain 1 Sun Sigil when you play a Burn-phase card; At 3+ Sigils, Burn-phase cards return as Echoes; Draw 1 card whenever you gain Sigils; Gain 2 Wild Pollen; Seed up to 2 Wild Pollen (+14.0 Embers per pollen, +0.04% score per Bloom). While on board: +220 Oblivion whenever you play an Ophanim while active',
    rarity: 'Eternal',
    artKey: 'bg_et_aureveth_evernoon',
    bonusType: 'ophanim_bonus',
    bonusValue: 220,
    // Role: SIGIL-PAIRED SEEDER (Seraphim Eternal). +2 garden then seeds 2
    // pollen into Ember Grove at a low score-mult-per-bloom coefficient.
    onPlayEffects: [
      { type: 'set_garden_law', law: 'Sunflower' },
      { type: 'sigil_on_burn_play', value: 1 },
      { type: 'sigil_threshold_echo_return', threshold: 3 },
      { type: 'sigil_draw_on_gain', value: 1 },
      { type: 'set_secondary_gain', kind: 'garden', value: 2 },
      { type: 'garden_wild_pollen_seed', embersPerPollen: 14, scoreMultPerBloom: 0.04, consume: 2 }],
    unsynergizedName: 'Evernoon Route',
    synergizedName: 'Sunflower Verdict Route',
    unsynergizedDescription: '1080 base Oblivion · 5 cards cooldown · Cost: discard 1 card',
    synergizedDescription: '1890 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 1200,
    synergizedBase: 2000,
    unsynergizedCooldown: 5,
    synergizedCooldown: 8,
  }),
  buildCherubim({
    definitionId: 'bg-et-vethkorath-seven-crown-proof',
    name: 'Vethkorath Seven-Crown Proof',
    description: 'On play: Gain 3 Wild Pollen. While on board: Adjacent active Seraphim chain +0.08; Each adjacent active Seraphim adds 1 extra card whenever you play a card; Buffs Seraphim and Angel attacks: cooldown -1',
    rarity: 'Eternal',
    artKey: 'bg_et_vethkorath_seven_crown',
    // Role: BACK-ROW POLLEN BATTERY (Cherubim Eternal). +3 garden via on-play
    // hook; no seed  Ehoards for adjacent Seraphim/Angel finishers.
    effects: [
      { type: 'set_garden_law', law: 'Thistle' },
      { type: 'choose_burn_card', effect: { type: 'archive_crown_on_new_lineage', value: 1, threshold: 3, trigger: 'burn_attack_all' } },
      { type: 'burn_cooldown_reduction_per_crown', value: 1 }],
    onPlayEffects: [{ type: 'set_secondary_gain', kind: 'garden', value: 3 }],
  }),
  buildCherubim({
    definitionId: 'bg-et-embergrove-codex',
    name: 'Embergrove Codex',
    description: 'On play: Gain 1 Wild Pollen; Seed up to 1 Wild Pollen (+18.0 Embers per pollen, +0.03% score per Bloom). While on board: Adjacent active Seraphim gain +44 Oblivion per card played; Gain 3 Embers per card played; Buffs Seraphim and Angel attacks: base +37, cooldown -1, multiplier x1.00; Buffs Angel attacks: base +29, cooldown -1, multiplier x1.00',
    rarity: 'Eternal',
    artKey: 'bg_et_embergrove_codex',
    // Role: SLOW-DRIP POLLEN SEEDER (Cherubim Eternal). +1 garden then
    // immediately seeds 1 pollen each play  Ea steady ember/mult trickle.
    effects: [
      { type: 'choose_lineage', effect: { type: 'char_to_memory_echo', value: 1 } },
      { type: 'memory_echo_buff', effect: { type: 'effect_plus', value: 1 } },
      { type: 'memory_echo_cost_reduction', value: 1 }],
    onPlayEffects: [
      { type: 'set_secondary_gain', kind: 'garden', value: 1 },
      { type: 'garden_wild_pollen_seed', embersPerPollen: 18, scoreMultPerBloom: 0.03, consume: 1 }],
  }),
  buildOphanim({
    definitionId: 'bg-et-noonproof-transit',
    name: 'Noonproof Transit',
    description: 'Gain 16 Bloom; Replay last Ophanim played this turn; If you have played 4+ cards this turn, chain_gain; Empower the next card you play; Shuffle discard into deck; Draw 1 card',
    rarity: 'Eternal',
    artKey: 'bg_et_noonproof_transit',
    // Role: APEX OPHANIM POLLEN BURST. Seeds 2 garden then consumes ALL banked
    // pollen for the strongest single Eternal seed.
    effects: [
      { type: 'replay_last_burn_card' },
      { type: 'ignite_units_burn', count: 2 },
      { type: 'mini_final_chord_on_diff_lineages', effect: { type: 'bloom_all_lineages', multiplier: 0.5 } },
      { type: 'echo_on_burn_play', value: 1 },
      { type: 'set_secondary_gain', kind: 'garden', value: 2 },
      { type: 'garden_wild_pollen_seed', embersPerPollen: 16, scoreMultPerBloom: 0.05 }],
  }),

  // Infinite (6) - OVERHAULED
  buildSeraphim({
    definitionId: 'bg-inf-final-chord-incandescent',
    name: 'Final Chord Incandescent',
    description: 'On play: Snapshot current Burn-phase lineages; On new lineage: Burn cards of the lineage gain +1 Echo and 1 cooldown reduction; If all lineages are present (end of turn): Bloom all lineages at 100% effect; Gain 3 Wild Pollen; Seed all Wild Pollen (+22.0 Embers per pollen, +0.07% score per Bloom). While on board: +40 Oblivion per card played while active',
    rarity: 'Infinite',
    artKey: 'bg_inf_final_chord_incandescent',
    bonusType: 'oblivion_per_card',
    bonusValue: 40,
    // Role: APEX INFINITE SEEDER (Seraphim). +3 garden then consumes ALL banked
    // pollen for the strongest single Infinite seed (highest ember + bloom mult).
    onPlayEffects: [
      { type: 'snapshot_burn_lineages' },
      { type: 'incandescent_chorus_on_new_lineage', effect: { type: 'burn_lineage_echo_and_cooldown', echo: 1, cooldown: 1 } },
      { type: 'final_chord_bloom_if_all_lineages', effect: { type: 'bloom_all_lineages', multiplier: 1.0 }, trigger: 'end_of_turn' },
      { type: 'set_secondary_gain', kind: 'garden', value: 3 },
      { type: 'garden_wild_pollen_seed', embersPerPollen: 22, scoreMultPerBloom: 0.07 }],
    unsynergizedName: 'Incandescent Rift',
    synergizedName: 'Final Chord Rift',
    unsynergizedDescription: '1980 base Oblivion · 4 cards cooldown · Cost: discard 1 card',
    synergizedDescription: '3465 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 2200,
    synergizedBase: 3700,
    unsynergizedCooldown: 5,
    synergizedCooldown: 8,
  }),
  buildSeraphim({
    definitionId: 'bg-inf-soleth-vair-worldflower',
    name: 'Soleth Vair Worldflower',
    description: 'On play: Seed Grove with 1 Worldflower token per Burn card; Worldflower tokens become Echoes on char for 1 turn; If 3 Worldflowers are played this turn, all Burn effects gain +1; Gain 2 Wild Pollen; Seed up to 2 Wild Pollen (+30.0 Embers per pollen, +0.06% score per Bloom). While on board: Each new Cherubim summoned while active gains +2 durability',
    rarity: 'Infinite',
    artKey: 'bg_inf_soleth_vair_worldflower',
    bonusType: 'cherubim_extra_plays',
    bonusValue: 2,
    // Role: HIGH-COEFFICIENT PARTIAL SEED (Seraphim Infinite). +2 garden then
    // consumes 2 for the highest embers-per-pollen ratio in the set.
    onPlayEffects: [
      { type: 'seed_grove_with_worldflower', per_burn: 1 },
      { type: 'worldflower_echo_on_char', duration: 1 },
      { type: 'worldflower_bonus_on_three', bonus: 1 },
      { type: 'set_secondary_gain', kind: 'garden', value: 2 },
      { type: 'garden_wild_pollen_seed', embersPerPollen: 30, scoreMultPerBloom: 0.06, consume: 2 }],
    unsynergizedName: 'Rootfire Dominion',
    synergizedName: 'Worldflower Dominion',
    unsynergizedDescription: '2300 base Oblivion · 4 cards cooldown · Cost: discard 1 card',
    synergizedDescription: '4025 base Oblivion · 7 cards cooldown · Requires Angel',
    unsynergizedBase: 2500,
    synergizedBase: 4100,
    unsynergizedCooldown: 5,
    synergizedCooldown: 8,
  }),
  buildCherubim({
    definitionId: 'bg-inf-embergrove-resurrection-array',
    name: 'Embergrove Resurrection Array',
    description: 'On play: Gain 4 Wild Pollen. While on board: Seraphim bonuses are amplified by +0.2; Draw 0.5 cards per card played; Buffs Seraphim and Angel attacks: base +80, cooldown -1, multiplier x1.00; Buffs Angel attacks: base +62, cooldown -1, multiplier x1.00',
    rarity: 'Infinite',
    artKey: 'bg_inf_embergrove_resurrection_array',
    // Role: BIG BACK-ROW POLLEN BATTERY (Cherubim Infinite). +4 garden, no seed
    //  Ethe highest-volume pollen reservoir in the set.
    effects: [
      { type: 'choose_burn_cards', count: 2, effect: { type: 'char_revive_echo_double', duration: 1 } },
      { type: 'echo_persistence_bonus', duration: 2 }],
    onPlayEffects: [{ type: 'set_secondary_gain', kind: 'garden', value: 4 }],
  }),
  buildCherubim({
    definitionId: 'bg-inf-choir-of-rekindled-geometry',
    name: 'Choir of Rekindled Geometry',
    description: 'On play: Gain 2 Wild Pollen; Seed up to 2 Wild Pollen (+25.0 Embers per pollen, +0.05% score per Bloom). While on board: Adjacent active Seraphim chain +0.16; If you have 22+ Bloom, this Cherubim grants +1.2 bonus power; Buffs Seraphim attacks: base +76, cooldown -1, multiplier x1.27; Buffs Angel attacks: base +59, cooldown -1, multiplier x1.20',
    rarity: 'Infinite',
    artKey: 'bg_inf_choir_of_rekindled_geometry',
    // Role: PASSIVE POLLEN SEEDER (Cherubim Infinite). +2 garden then consumes 2
    // for a balanced mid-coefficient seed each play.
    effects: [
      { type: 'geometry_mode_on_new_lineage', effect: { type: 'burn_all_effects_plus', value: 1, cooldown: 1 } },
      { type: 'geometry_mode_next_turn_on_three_lineages' }],
    onPlayEffects: [
      { type: 'set_secondary_gain', kind: 'garden', value: 2 },
      { type: 'garden_wild_pollen_seed', embersPerPollen: 25, scoreMultPerBloom: 0.05, consume: 2 }],
  }),
  buildOphanim({
    definitionId: 'bg-inf-noon-that-never-sets',
    name: 'Noon That Never Sets',
    description: 'Gain 30 Bloom; If you have played 4+ cards this turn, chain_gain; If you control 2+ active Seraphim, +1200 Oblivion; If you have 20+ Bloom, Empower the next card you play; Gain 6 Prismatic Light; Draw 1 card',
    rarity: 'Infinite',
    artKey: 'bg_inf_noon_that_never_sets',
    // Role: APEX OPHANIM MULTI-GATE SEED. +3 garden then consumes ALL banked
    // pollen at the highest bloom-multiplier coefficient.
    effects: [
      { type: 'gate_payoff', gates: [
        { condition: { type: 'cards_played_gte', value: 4 }, payoff: { type: 'bloom_gain', value: 6 } },
        { condition: { type: 'burn_phase_cards_gte', value: 2 }, payoff: { type: 'gain_echo', value: 2 } },
        { condition: { type: 'grove_cards_gte', value: 1 }, payoff: { type: 'burn_attack', value: 1 } }] },
      { type: 'zenith_on_all_gates', effect: { type: 'burn_all_effects_plus', value: 2 }, duration: 1 },
      { type: 'set_secondary_gain', kind: 'garden', value: 3 },
      { type: 'garden_wild_pollen_seed', embersPerPollen: 20, scoreMultPerBloom: 0.08 }],
  }),
  buildOphanim({
    definitionId: 'bg-inf-proof-completed-sky',
    name: 'Proof Completed Sky',
    description: 'Replay last Ophanim played this turn; Gain 26 Bloom; Salvage 1 card matching Ophanim; If you have played 5+ cards this turn, chain_gain; Empower the next card you play',
    rarity: 'Infinite',
    artKey: 'bg_inf_proof_completed_sky',
    // Role: REPLAY-PAIRED OPHANIM SEEDER. +2 garden then consumes 3 pollen at a
    // high ember coefficient  Epairs with the replay/salvage payload.
    effects: [
      { type: 'replay_last_burn_card' },
      { type: 'gain_echo', value: 2 },
      { type: 'salvage_burn_from_discard' },
      { type: 'copy_garden_law_to_sky_law', effects: [
        { law: 'Rose', effect: { type: 'echo_effect_double', duration: 1 } },
        { law: 'Sunflower', effect: { type: 'burn_return_to_hand_as_echo', duration: 1 } },
        { law: 'Thistle', effect: { type: 'burn_cooldown_reduction', value: 2, duration: 1 } }] },
      { type: 'set_secondary_gain', kind: 'garden', value: 2 },
      { type: 'garden_wild_pollen_seed', embersPerPollen: 28, scoreMultPerBloom: 0.06, consume: 3 }],
  })];

export const blazingGardenPackPool = blazingGardenCards.map(card => card.definitionId);
