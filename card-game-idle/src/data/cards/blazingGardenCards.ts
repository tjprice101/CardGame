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
    name: 'Serevathi Cinder Spiral',
    description: 'On play: Draw 1 card; Gain 4 Bloom. While on board: Resource generation +4 while active',
    rarity: 'Common',
    artKey: 'bg_ser_serevathi_ember_spiral',
    bonusType: 'resource_generation',
    bonusValue: 4,
    onPlayEffects: [{ type: 'draw', value: 1 }, { type: 'bloom_gain', value: 4 }],
    unsynergizedName: 'Petal Circuit Slash',
    synergizedName: 'Blazing Choir Slash',
    unsynergizedDescription: '363 base Oblivion · 4 cards cooldown',
    synergizedDescription: '501 base Oblivion · 5 cards cooldown · Requires Angel',
    unsynergizedBase: 363,
    synergizedBase: 501,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'bg-ser-aureveth-noon-petal',
    name: 'Aureveth Noon Petal',
    description: 'On play: Draw 1 card; Gain 6 Bloom. While on board: +20 Oblivion whenever you play an Ophanim while active',
    rarity: 'Rare',
    artKey: 'bg_ser_aureveth_noon_petal',
    bonusType: 'ophanim_bonus',
    bonusValue: 20,
    onPlayEffects: [{ type: 'draw', value: 1 }, { type: 'bloom_gain', value: 6 }],
    unsynergizedName: 'Sunfloret Vector',
    synergizedName: 'Noon-That-Does-Not-End',
    unsynergizedDescription: '461 base Oblivion · 4 cards cooldown',
    synergizedDescription: '630 base Oblivion · 5 cards cooldown · Requires Angel',
    unsynergizedBase: 461,
    synergizedBase: 630,
    unsynergizedCooldown: 4,
    synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'bg-ser-vethkorath-starspine',
    name: 'Vethkorath Starspine',
    description: 'On play: Draw 2 cards; Gain 5 Bloom; Gain 1 Echo. While on board: +24 Oblivion per card played while active',
    rarity: 'Epic',
    artKey: 'bg_ser_vethkorath_starspine',
    bonusType: 'oblivion_per_card',
    bonusValue: 24,
    onPlayEffects: [{ type: 'draw', value: 2 }, { type: 'bloom_gain', value: 5 }, { type: 'gain_echo', value: 1 }],
    unsynergizedName: 'Thistle Proof Cut',
    synergizedName: 'Proof Completed Cut',
    unsynergizedDescription: '642 base Oblivion · 5 cards cooldown',
    synergizedDescription: '873 base Oblivion · 6 cards cooldown · Requires Angel',
    unsynergizedBase: 642,
    synergizedBase: 873,
    unsynergizedCooldown: 5,
    synergizedCooldown: 6,
  }),
  buildSeraphim({
    definitionId: 'bg-ser-embergrove-cantor',
    name: 'Embergrove Cantor',
    description: 'On play: Salvage 1 card matching Seraphim; Gain 14 Bloom; Draw 1 card. While on board: Resource generation +14 while active',
    rarity: 'Legendary',
    artKey: 'bg_ser_embergrove_cantor',
    bonusType: 'resource_generation',
    bonusValue: 14,
    onPlayEffects: [{ type: 'salvage_by_type', filter: ['Seraphim'] }, { type: 'bloom_gain', value: 14 }, { type: 'draw', value: 1 }],
    unsynergizedName: 'Cinder Echo Rend',
    synergizedName: 'Echo Chord Rend',
    unsynergizedDescription: '794 base Oblivion · 5 cards cooldown',
    synergizedDescription: '1094 base Oblivion · 6 cards cooldown · Requires Angel',
    unsynergizedBase: 794,
    synergizedBase: 1094,
    unsynergizedCooldown: 5,
    synergizedCooldown: 6,
  }),
  buildSeraphim({
    definitionId: 'bg-ser-final-chord-herald',
    name: 'Final Chord Herald',
    description: 'On play: Draw 2 cards; +260 Oblivion; Gain 1 Echo. While on board: +34 Oblivion per card played while active',
    rarity: 'Legendary',
    artKey: 'bg_ser_final_chord_herald',
    bonusType: 'oblivion_per_card',
    bonusValue: 34,
    onPlayEffects: [{ type: 'draw', value: 2 }, { type: 'oblivion_flat', value: 260 }, { type: 'gain_echo', value: 1 }],
    unsynergizedName: 'Choirline Sundering',
    synergizedName: 'Final Chord Sundering',
    unsynergizedDescription: '954 base Oblivion · 6 cards cooldown',
    synergizedDescription: '1300 base Oblivion · 7 cards cooldown · Requires Angel',
    unsynergizedBase: 954,
    synergizedBase: 1300,
    unsynergizedCooldown: 6,
    synergizedCooldown: 7,
  }),

  // Cherubim (7)
  buildCherubim({
    definitionId: 'bg-cher-root-lantern-attendant',
    name: 'Root Lantern Attendant',
    description: 'On play: Gain 3 Bloom; Draw 1 card. While on board: Adjacent active Seraphim gain +24 Oblivion per card played',
    rarity: 'Common',
    artKey: 'bg_cher_root_lantern_attendant',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 24 }],
    onPlayEffects: [{ type: 'bloom_gain', value: 3 }, { type: 'draw', value: 1 }],
  }),
  buildCherubim({
    definitionId: 'bg-cher-auric-floret-keeper',
    name: 'Auric Floret Keeper',
    description: 'On play: Gain 7 Bloom; If you control 1+ active Seraphim, Draw 1 card. While on board: +12 Oblivion per card played',
    rarity: 'Rare',
    artKey: 'bg_cher_auric_floret_keeper',
    effects: [{ type: 'cherubim_oblivion_per_card', value: 12 }],
    onPlayEffects: [{ type: 'bloom_gain', value: 7 }, { type: 'conditional', condition: { type: 'seraphim_active_gte', value: 1 }, then: [{ type: 'draw', value: 1 }] }],
  }),
  buildCherubim({
    definitionId: 'bg-cher-thistleproof-chorister',
    name: 'Thistleproof Chorister',
    description: 'On play: Draw 1 card; Gain 4 Bloom. While on board: Seraphim bonuses are amplified by +8%',
    rarity: 'Rare',
    artKey: 'bg_cher_thistleproof_chorister',
    effects: [{ type: 'cherubim_seraphim_amp', value: 0.08 }],
    onPlayEffects: [{ type: 'draw', value: 1 }, { type: 'bloom_gain', value: 4 }],
  }),
  buildCherubim({
    definitionId: 'bg-cher-embergrove-historian',
    name: 'Embergrove Historian',
    description: 'On play: Gain 5 Bloom; Salvage 1 card matching Ophanim. While on board: Adjacent active Seraphim gain +32 Oblivion per card played',
    rarity: 'Epic',
    artKey: 'bg_cher_embergrove_historian',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 32 }],
    onPlayEffects: [{ type: 'bloom_gain', value: 5 }, { type: 'salvage_by_type', filter: ['Ophanim'] }],
  }),
  buildCherubim({
    definitionId: 'bg-cher-fibonacci-sexton',
    name: 'Fibonacci Sexton',
    description: 'On play: Gain 5 Bloom; Look at the top 5 cards, take 2 cards, and put the rest on the bottom. While on board: Each adjacent active Seraphim adds 1 extra card whenever you play a card',
    rarity: 'Epic',
    artKey: 'bg_cher_fibonacci_sexton',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'draw', value: 1 }],
    onPlayEffects: [{ type: 'bloom_gain', value: 5 }, { type: 'look_top_take', look: 5, take: 2 }],
  }),
  buildCherubim({
    definitionId: 'bg-cher-golden-petal-vicar',
    name: 'Golden Petal Vicar',
    description: 'On play: Draw 2 cards; Gain 10 Bloom. While on board: All Oblivion gain +48%',
    rarity: 'Legendary',
    artKey: 'bg_cher_golden_petal_vicar',
    maxDurability: 9,
    effects: [{ type: 'cherubim_global_oblivion_mult', value: 0.48 }],
    onPlayEffects: [{ type: 'draw', value: 2 }, { type: 'bloom_gain', value: 10 }],
  }),
  buildCherubim({
    definitionId: 'bg-cher-charred-choir-reclaimer',
    name: 'Charred Choir Reclaimer',
    description: 'On play: Gain 8 Bloom; Shuffle discard into deck; Draw 1 card. While on board: Adjacent active Seraphim gain +40 Oblivion per card played',
    rarity: 'Legendary',
    artKey: 'bg_cher_charred_choir_reclaimer',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 40 }],
    onPlayEffects: [{ type: 'bloom_gain', value: 8 }, { type: 'shuffle_discard' }, { type: 'draw', value: 1 }],
  }),

  // Ophanim (7)
  buildOphanim({
    definitionId: 'bg-oph-petal-route-initiate',
    name: 'Petal Route Initiate',
    description: 'Draw 1 card; Gain 3 Bloom; If this is the first card you played this turn, Gain 2 Bloom',
    rarity: 'Common',
    artKey: 'bg_oph_petal_route_initiate',
    effects: [{ type: 'draw', value: 1 }, { type: 'bloom_gain', value: 3 }, { type: 'conditional', condition: { type: 'first_card_this_turn' }, then: [{ type: 'bloom_gain', value: 2 }] }],
  }),
  buildOphanim({
    definitionId: 'bg-oph-sunvein-wayfinder',
    name: 'Sunvein Wayfinder',
    description: 'Look at the top 5 cards, take 2 cards, and put the rest on the bottom; Gain 3 Bloom',
    rarity: 'Common',
    artKey: 'bg_oph_sunvein_wayfinder',
    effects: [{ type: 'look_top_take', look: 5, take: 2 }, { type: 'bloom_gain', value: 3 }],
  }),
  buildOphanim({
    definitionId: 'bg-oph-violet-crown-drift',
    name: 'Violet Crown Drift',
    description: 'Gain 5 Bloom; Draw 1 card; Gain 1 Echo',
    rarity: 'Rare',
    artKey: 'bg_oph_violet_crown_drift',
    effects: [{ type: 'bloom_gain', value: 5 }, { type: 'draw', value: 1 }, { type: 'gain_echo', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'bg-oph-embergrove-cartographer',
    name: 'Embergrove Cartographer',
    description: 'Salvage 1 card matching Seraphim; Draw 1 card; Gain 3 Bloom',
    rarity: 'Rare',
    artKey: 'bg_oph_embergrove_cartographer',
    effects: [{ type: 'salvage_by_type', filter: ['Seraphim'] }, { type: 'draw', value: 1 }, { type: 'bloom_gain', value: 3 }],
  }),
  buildOphanim({
    definitionId: 'bg-oph-rootflare-transit',
    name: 'Rootflare Transit',
    description: 'Draw 3 cards; Gain 1 Echo',
    rarity: 'Epic',
    artKey: 'bg_oph_rootflare_transit',
    effects: [{ type: 'draw', value: 3 }, { type: 'gain_echo', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'bg-oph-spiral-memory-bloom',
    name: 'Spiral Memory Bloom',
    description: 'Replay the last Burn-phase card played this turn; Gain 8 Bloom; Gain 1 Echo',
    rarity: 'Epic',
    artKey: 'bg_oph_spiral_memory_bloom',
    effects: [{ type: 'replay_last_burn_card' }, { type: 'bloom_gain', value: 8 }, { type: 'gain_echo', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'bg-oph-chordbearing-migration',
    name: 'Chordbearing Migration',
    description: 'Draw 4 cards; Gain 10 Bloom; Ignite up to 1 unit into Burn',
    rarity: 'Legendary',
    artKey: 'bg_oph_chordbearing_migration',
    effects: [{ type: 'draw', value: 4 }, { type: 'bloom_gain', value: 10 }, { type: 'ignite_units_burn', count: 1 }],
  }),

  // Eternal (5) - OVERHAULED
  buildSeraphim({
    definitionId: 'bg-et-serevathi-proofflame',
    name: 'Serevathi Proofflame',
    description: 'On play: Gain 4 Wild Pollen; Gain 2 Echo; Ignite up to 1 unit into Burn. While on board: +25 Oblivion per card played while active',
    rarity: 'Eternal',
    artKey: 'bg_et_serevathi_proofflame',
    bonusType: 'oblivion_per_card',
    bonusValue: 25,
    // Role: POLLEN BATTERY + ECHO PRIMER (Seraphim Eternal).
    onPlayEffects: [
      { type: 'set_secondary_gain', kind: 'garden', value: 4 },
      { type: 'gain_echo', value: 2 },
      { type: 'ignite_units_burn', count: 1 }],
    unsynergizedName: 'Roseproof Spiral',
    synergizedName: 'Roseproof Chord',
    unsynergizedDescription: '1691 base Oblivion · 5 cards cooldown',
    synergizedDescription: '2294 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 1691,
    synergizedBase: 2294,
    unsynergizedCooldown: 5,
    synergizedCooldown: 8,
  }),
  buildSeraphim({
    definitionId: 'bg-et-aureveth-evernoon',
    name: 'Aureveth Evernoon',
    description: 'On play: Gain 2 Wild Pollen; Seed up to 2 Wild Pollen (+20 Oblivion per pollen, +4% score per Bloom); Draw 1 card. While on board: +220 Oblivion whenever you play an Ophanim while active',
    rarity: 'Eternal',
    artKey: 'bg_et_aureveth_evernoon',
    bonusType: 'ophanim_bonus',
    bonusValue: 220,
    // Role: CONTROLLED CONVERTER (Seraphim Eternal).
    onPlayEffects: [
      { type: 'set_secondary_gain', kind: 'garden', value: 2 },
      { type: 'garden_wild_pollen_seed', oblivionPerPollen: 20, scoreMultPerBloom: 0.04, consume: 2 },
      { type: 'draw', value: 1 }],
    unsynergizedName: 'Evernoon Route',
    synergizedName: 'Sunflower Verdict Route',
    unsynergizedDescription: '1845 base Oblivion · 5 cards cooldown',
    synergizedDescription: '2480 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 1845,
    synergizedBase: 2480,
    unsynergizedCooldown: 5,
    synergizedCooldown: 8,
  }),
  buildCherubim({
    definitionId: 'bg-et-vethkorath-seven-crown-proof',
    name: 'Vethkorath Seven-Crown Proof',
    description: 'On play: Gain 5 Wild Pollen; Draw 1 card. While on board: Each adjacent active Seraphim adds 1 extra card whenever you play a card; Buffs Seraphim and Angel attacks: base +72, cooldown -1',
    rarity: 'Eternal',
    artKey: 'bg_et_vethkorath_seven_crown',
    // Role: BACK-ROW RESERVOIR (Cherubim Eternal).
    effects: [
      { type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'draw', value: 1 },
      { type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 72, cooldownDeltaCards: -1, multiplier: 1.0 }],
    onPlayEffects: [{ type: 'set_secondary_gain', kind: 'garden', value: 5 }, { type: 'draw', value: 1 }],
  }),
  buildCherubim({
    definitionId: 'bg-et-embergrove-codex',
    name: 'Embergrove Codex',
    description: 'On play: Gain 1 Wild Pollen; Seed up to 1 Wild Pollen (+26 Oblivion per pollen, +2% score per Bloom); Replay the last Burn-phase card played this turn. While on board: Seraphim bonuses are amplified by +18%; Buffs Seraphim and Angel attacks: base +58, cooldown -1',
    rarity: 'Eternal',
    artKey: 'bg_et_embergrove_codex',
    // Role: DRIP CONVERTER + REPLAY ENGINE (Cherubim Eternal).
    effects: [
      { type: 'cherubim_seraphim_amp', value: 0.18 },
      { type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 58, cooldownDeltaCards: -1, multiplier: 1.0 }],
    onPlayEffects: [
      { type: 'set_secondary_gain', kind: 'garden', value: 1 },
      { type: 'garden_wild_pollen_seed', oblivionPerPollen: 26, scoreMultPerBloom: 0.02, consume: 1 },
      { type: 'replay_last_burn_card' }],
  }),
  buildOphanim({
    definitionId: 'bg-et-noonproof-transit',
    name: 'Noonproof Transit',
    description: 'Gain 18 Bloom; Replay the last Burn-phase card played this turn; Ignite up to 2 units into Burn; Gain 2 Echo; Gain 2 Wild Pollen; Seed all Wild Pollen (+24 Oblivion per pollen, +6% score per Bloom); Draw 2 cards',
    rarity: 'Eternal',
    artKey: 'bg_et_noonproof_transit',
    // Role: FINISHER CONVERTER (Ophanim Eternal).
    effects: [
      { type: 'bloom_gain', value: 18 },
      { type: 'replay_last_burn_card' },
      { type: 'ignite_units_burn', count: 2 },
      { type: 'gain_echo', value: 2 },
      { type: 'set_secondary_gain', kind: 'garden', value: 2 },
      { type: 'garden_wild_pollen_seed', oblivionPerPollen: 24, scoreMultPerBloom: 0.06 },
      { type: 'draw', value: 2 }],
  }),

  // Infinite (6) - OVERHAULED
  buildSeraphim({
    definitionId: 'bg-inf-final-chord-incandescent',
    name: 'Final Chord Incandescent',
    description: 'On play: Snapshot current Burn-phase lineages; On new lineage: Burn cards of the lineage gain +1 Echo and 1 cooldown reduction; If all lineages are present (end of turn): Bloom all lineages at 100% effect; Seed all Wild Pollen (+34 Oblivion per pollen, +9% score per Bloom). While on board: +40 Oblivion per card played while active',
    rarity: 'Infinite',
    artKey: 'bg_inf_final_chord_incandescent',
    bonusType: 'oblivion_per_card',
    bonusValue: 40,
    // Role: APEX ALL-IN CONVERTER (Seraphim Infinite).
    onPlayEffects: [
      { type: 'snapshot_burn_lineages' },
      { type: 'incandescent_chorus_on_new_lineage', effect: { type: 'burn_lineage_echo_and_cooldown', echo: 1, cooldown: 1 } },
      { type: 'final_chord_bloom_if_all_lineages', effect: { type: 'bloom_all_lineages', multiplier: 1.0 }, trigger: 'end_of_turn' },
      { type: 'garden_wild_pollen_seed', oblivionPerPollen: 34, scoreMultPerBloom: 0.09 }],
    unsynergizedName: 'Incandescent Rift',
    synergizedName: 'Final Chord Rift',
    unsynergizedDescription: '3383 base Oblivion · 5 cards cooldown',
    synergizedDescription: '4588 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 3383,
    synergizedBase: 4588,
    unsynergizedCooldown: 5,
    synergizedCooldown: 8,
  }),
  buildSeraphim({
    definitionId: 'bg-inf-soleth-vair-worldflower',
    name: 'Soleth Vair Worldflower',
    description: 'On play: Seed Grove with 1 Worldflower token per Burn card; Worldflower tokens become Echoes on char for 1 turn; If 3 Worldflowers are played this turn, all Burn effects gain +1; Seed up to 4 Wild Pollen (+38 Oblivion per pollen, +7% score per Bloom). While on board: Each new Cherubim summoned while active gains +2 durability',
    rarity: 'Infinite',
    artKey: 'bg_inf_soleth_vair_worldflower',
    bonusType: 'cherubim_extra_plays',
    bonusValue: 2,
    // Role: HIGH-RATE PARTIAL SEEDER (Seraphim Infinite).
    onPlayEffects: [
      { type: 'seed_grove_with_worldflower', per_burn: 1 },
      { type: 'worldflower_echo_on_char', duration: 1 },
      { type: 'worldflower_bonus_on_three', bonus: 1 },
      { type: 'garden_wild_pollen_seed', oblivionPerPollen: 38, scoreMultPerBloom: 0.07, consume: 4 }],
    unsynergizedName: 'Rootfire Dominion',
    synergizedName: 'Worldflower Dominion',
    unsynergizedDescription: '3844 base Oblivion · 5 cards cooldown',
    synergizedDescription: '5084 base Oblivion · 8 cards cooldown · Requires Angel',
    unsynergizedBase: 3844,
    synergizedBase: 5084,
    unsynergizedCooldown: 5,
    synergizedCooldown: 8,
  }),
  buildCherubim({
    definitionId: 'bg-inf-embergrove-resurrection-array',
    name: 'Embergrove Resurrection Array',
    description: 'On play: Replay the last Burn-phase card played this turn; Draw 2 cards; Seed up to 3 Wild Pollen (+32 Oblivion per pollen, +8% score per Bloom). While on board: Choose up to 2 Burn cards, then On char, revive as Echo with doubled effects for 1 turn; Echoes persist for 2 turns',
    rarity: 'Infinite',
    artKey: 'bg_inf_embergrove_resurrection_array',
    // Role: RECURSIVE CONVERTER SUPPORT (Cherubim Infinite).
    effects: [
      { type: 'choose_burn_cards', count: 2, effect: { type: 'char_revive_echo_double', duration: 1 } },
      { type: 'echo_persistence_bonus', duration: 2 }],
    onPlayEffects: [
      { type: 'replay_last_burn_card' },
      { type: 'draw', value: 2 },
      { type: 'garden_wild_pollen_seed', oblivionPerPollen: 32, scoreMultPerBloom: 0.08, consume: 3 }],
  }),
  buildCherubim({
    definitionId: 'bg-inf-choir-of-rekindled-geometry',
    name: 'Choir of Rekindled Geometry',
    description: 'On play: Seed up to 2 Wild Pollen (+29 Oblivion per pollen, +11% score per Bloom). While on board: On new lineage, Geometry Mode applies: All Burn-phase effects gain +1 and cooldown reduction 1; If 3 lineages are played, Geometry Mode applies next turn',
    rarity: 'Infinite',
    artKey: 'bg_inf_choir_of_rekindled_geometry',
    // Role: SCORE-SPIKE MICRO SEEDER (Cherubim Infinite).
    effects: [
      { type: 'geometry_mode_on_new_lineage', effect: { type: 'burn_all_effects_plus', value: 1, cooldown: 1 } },
      { type: 'geometry_mode_next_turn_on_three_lineages' }],
    onPlayEffects: [{ type: 'garden_wild_pollen_seed', oblivionPerPollen: 29, scoreMultPerBloom: 0.11, consume: 2 }],
  }),
  buildOphanim({
    definitionId: 'bg-inf-noon-that-never-sets',
    name: 'Noon That Never Sets',
    description: 'For each fulfilled gate: if you have played 4+ cards this turn then Draw 2 cards; if you have 2+ Burn-phase cards then Gain 2 Echo; if you have 1+ cards in the Grove then Trigger 1 Burn-phase attack; If all gates are fulfilled, apply Zenith for 1 turn: All Burn-phase effects gain +2; Seed up to 1 Wild Pollen (+30 Oblivion per pollen, +13% score per Bloom)',
    rarity: 'Infinite',
    artKey: 'bg_inf_noon_that_never_sets',
    // Role: GATED SINGLE-SEED SPIKER (Ophanim Infinite).
    effects: [
      { type: 'gate_payoff', gates: [
        { condition: { type: 'cards_played_gte', value: 4 }, payoff: { type: 'draw', value: 2 } },
        { condition: { type: 'burn_phase_cards_gte', value: 2 }, payoff: { type: 'gain_echo', value: 2 } },
        { condition: { type: 'grove_cards_gte', value: 1 }, payoff: { type: 'burn_attack', value: 1 } }] },
      { type: 'zenith_on_all_gates', effect: { type: 'burn_all_effects_plus', value: 2 }, duration: 1 },
      { type: 'garden_wild_pollen_seed', oblivionPerPollen: 30, scoreMultPerBloom: 0.13, consume: 1 }],
  }),
  buildOphanim({
    definitionId: 'bg-inf-proof-completed-sky',
    name: 'Proof Completed Sky',
    description: 'Replay the last Burn-phase card played this turn; Gain 2 Echo; Salvage a Burn-phase card from discard; Copy Garden Law to Sky Law (Rose: Echo effects are doubled for 1 turn; Sunflower: Burn cards return to hand as Echoes for 1 turn; Thistle: Burn cards gain 2 cooldown reduction for 1 turn); Seed up to 5 Wild Pollen (+36 Oblivion per pollen, +7% score per Bloom)',
    rarity: 'Infinite',
    artKey: 'bg_inf_proof_completed_sky',
    // Role: BULK-CONSUME REPLAY FINISHER (Ophanim Infinite).
    effects: [
      { type: 'replay_last_burn_card' },
      { type: 'gain_echo', value: 2 },
      { type: 'salvage_burn_from_discard' },
      { type: 'copy_garden_law_to_sky_law', effects: [
        { law: 'Rose', effect: { type: 'echo_effect_double', duration: 1 } },
        { law: 'Sunflower', effect: { type: 'burn_return_to_hand_as_echo', duration: 1 } },
        { law: 'Thistle', effect: { type: 'burn_cooldown_reduction', value: 2, duration: 1 } }] },
        { type: 'garden_wild_pollen_seed', oblivionPerPollen: 36, scoreMultPerBloom: 0.07, consume: 5 }],
  })];

export const blazingGardenPackPool = blazingGardenCards.map(card => card.definitionId);
