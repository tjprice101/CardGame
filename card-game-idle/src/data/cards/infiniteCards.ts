import type { SeekerDefinition, SeraphimDefinition, ChaosDefinition, AngelDefinition } from '@/types/cards';

// ── Combination recipe ────────────────────────────────────────────────────────
// Each Infinite card is forged by consuming exact copies of specific Eternal cards.

export interface InfiniteIngredient {
  definitionId: string; // Eternal card definitionId to consume
  count: number;        // how many copies to consume
}

export interface InfiniteRecipe {
  resultId: string;           // Infinite card definitionId produced
  ingredients: InfiniteIngredient[];
  lore: string;               // flavour shown in the Infinitude menu
}

// ── 27 Infinite cards ─────────────────────────────────────────────────────────

// ── Seekers (3) ───────────────────────────────────────────────────────────────

export const infiniteSeekerCards: SeekerDefinition[] = [
  {
    definitionId: 'inf-oblivion-absolute',
    type: 'Seeker',
    element: 'Neutrality',
    rarity: 'Infinite',
    name: 'Oblivion Absolute',
    description: 'Draw 7 cards. Set the chain floor to ×15.0. +6,000 Oblivion. Gain 60 of your dominant resource.',
    artKey: 'inf_oblivion_absolute',
    effects: [
      { type: 'draw', value: 7 },
      { type: 'set_chain_floor', value: 15.0 },
      { type: 'oblivion_flat', value: 6000 },
      { type: 'dominant_stack_gain', value: 60 },
    ],
  },
  {
    definitionId: 'inf-void-cascade',
    type: 'Seeker',
    element: 'Neutrality',
    rarity: 'Infinite',
    name: 'Void Cascade',
    description: 'Draw 6 cards. Shuffle your discard into your deck. Set the chain floor to ×12.0. Empower the next 2 cards.',
    artKey: 'inf_void_cascade',
    effects: [
      { type: 'draw', value: 6 },
      { type: 'shuffle_discard' },
      { type: 'set_chain_floor', value: 12.0 },
      { type: 'multiply_next' },
    ],
  },
  {
    definitionId: 'inf-ash-kings-apocalypse',
    type: 'Seeker',
    element: 'Fire',
    rarity: 'Infinite',
    name: "Ash Kings' Apocalypse",
    description: 'Discard 2, draw 8. Shuffle your discard into your deck. Set the chain multiplier to ×5.0. Gain 80 Embers. +2,500 Oblivion.',
    artKey: 'inf_ash_kings_apocalypse',
    effects: [
      { type: 'discard_draw', discard: 2, draw: 8 },
      { type: 'shuffle_discard' },
      { type: 'chain_multiplier_set', value: 5.0 },
      { type: 'ember_gain', value: 80 },
      { type: 'oblivion_flat', value: 2500 },
    ],
  },
  {
    definitionId: 'inf-prismatic-axiom-rain',
    type: 'Seeker',
    element: 'Prismatic',
    rarity: 'Infinite',
    name: 'Prismatic Axiom Rain',
    description: 'Look at top 10. Take 3. Return 2 to bottom. Draw 2. Set chain floor to ×11.0. Gain 40 of your dominant resource.',
    artKey: 'inf_prismatic_axiom_rain',
    effects: [
      { type: 'look_top_take_drop', look: 10, take: 3, drop: 2 },
      { type: 'draw', value: 2 },
      { type: 'set_chain_floor', value: 11.0 },
      { type: 'dominant_stack_gain', value: 40 },
    ],
  },
  {
    definitionId: 'inf-thornbound-last-procession',
    type: 'Seeker',
    element: 'Thornbound',
    rarity: 'Infinite',
    name: 'Thornbound Last Procession',
    description: 'Salvage any card. Draw 5 cards. Gain +220% total Oblivion this turn. Gain 120 Trail.',
    artKey: 'inf_thornbound_last_procession',
    effects: [
      { type: 'salvage_any' },
      { type: 'draw', value: 5 },
      { type: 'score_multiplier', value: 220 },
      { type: 'trail_gain', value: 120 },
    ],
  },
  {
    definitionId: 'inf-celestial-blackout',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Infinite',
    name: 'Celestial Blackout',
    description: 'Draw 6 cards. Gain 120 Radiance. Set chain multiplier to ×7.5. Gain +3,200 Oblivion.',
    artKey: 'inf_celestial_blackout',
    effects: [
      { type: 'draw', value: 6 },
      { type: 'radiance_gain', value: 120 },
      { type: 'chain_multiplier_set', value: 7.5 },
      { type: 'oblivion_flat', value: 3200 },
    ],
  },
  {
    definitionId: 'inf-machina-eternal-loop',
    type: 'Seeker',
    element: 'Mechanical',
    rarity: 'Infinite',
    name: 'Machina Eternal Loop',
    description: 'Overclock: gain 4 Strain, then draw 4, set chain floor to ×9.0, and empower next card. Gain +2,500 Oblivion.',
    artKey: 'inf_machina_eternal_loop',
    effects: [
      { type: 'overclock', strain: 4, then: [{ type: 'draw', value: 4 }, { type: 'set_chain_floor', value: 9.0 }, { type: 'multiply_next' }] },
      { type: 'oblivion_flat', value: 2500 },
    ],
  },
];

// ── Seraphim (3) ──────────────────────────────────────────────────────────────

export const infiniteSeraphimCards: SeraphimDefinition[] = [
  {
    definitionId: 'inf-genesis-throne',
    type: 'Seraphim',
    element: 'Neutrality',
    rarity: 'Infinite',
    name: 'Genesis Throne',
    description: 'On play: +3,000 Oblivion. Draw 5 cards. Set the chain floor to ×12.0. In synergy: +1,000 Oblivion per card played.',
    artKey: 'inf_genesis_throne',
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 1000, synergyRequirement: 'Neutrality' },
    onPlayEffects: [
      { type: 'oblivion_flat', value: 3000 },
      { type: 'draw', value: 5 },
      { type: 'set_chain_floor', value: 12.0 },
    ],
  },
  {
    definitionId: 'inf-null-apex',
    type: 'Seraphim',
    element: 'Neutrality',
    rarity: 'Infinite',
    name: 'Null Apex',
    description: 'On play: draw 4 cards. Set the chain floor to ×8.0. Gain 50 of your dominant resource. +1,500 Oblivion. In synergy: +1,500 Oblivion on Seeker plays.',
    artKey: 'inf_null_apex',
    baseStats: { bonusType: 'seeker_bonus', bonusValue: 1500, synergyRequirement: 'Neutrality' },
    onPlayEffects: [
      { type: 'draw', value: 4 },
      { type: 'set_chain_floor', value: 8.0 },
      { type: 'dominant_stack_gain', value: 50 },
      { type: 'oblivion_flat', value: 1500 },
    ],
  },
  {
    definitionId: 'inf-pyraxis-colossus',
    type: 'Seraphim',
    element: 'Fire',
    rarity: 'Infinite',
    name: 'Pyraxis Colossus',
    description: 'On play: gain 100 Embers. Draw 4 cards. +1,800 Oblivion. Set the chain floor to ×6.0. In synergy: +80 Embers per card played.',
    artKey: 'inf_pyraxis_colossus',
    baseStats: { bonusType: 'ember_per_card', bonusValue: 80, synergyRequirement: 'Fire' },
    onPlayEffects: [
      { type: 'ember_gain', value: 100 },
      { type: 'draw', value: 4 },
      { type: 'oblivion_flat', value: 1800 },
      { type: 'set_chain_floor', value: 6.0 },
    ],
  },
  {
    definitionId: 'inf-prismatic-choir-splinter',
    type: 'Seraphim',
    element: 'Prismatic',
    rarity: 'Infinite',
    name: 'Prismatic Choir Splinter',
    description: 'On play: draw 3, set chain floor to ×8.5, empower next card, and gain +1,200 Oblivion. In synergy: chain grows +0.75 faster per card.',
    artKey: 'inf_prismatic_choir_splinter',
    baseStats: { bonusType: 'chain_bonus', bonusValue: 0.75, synergyRequirement: 'Prismatic' },
    onPlayEffects: [
      { type: 'draw', value: 3 },
      { type: 'set_chain_floor', value: 8.5 },
      { type: 'multiply_next' },
      { type: 'oblivion_flat', value: 1200 },
    ],
  },
  {
    definitionId: 'inf-thorn-widow-engine',
    type: 'Seraphim',
    element: 'Thornbound',
    rarity: 'Infinite',
    name: 'Thorn Widow Engine',
    description: 'On play: gain 80 Trail, draw 3, and gain +140% total Oblivion this turn. In synergy: +2 extra Chaos plays each turn.',
    artKey: 'inf_thorn_widow_engine',
    baseStats: { bonusType: 'chaos_extra_plays', bonusValue: 2, synergyRequirement: 'Thornbound' },
    onPlayEffects: [
      { type: 'trail_gain', value: 80 },
      { type: 'draw', value: 3 },
      { type: 'score_multiplier', value: 140 },
    ],
  },
  {
    definitionId: 'inf-lucent-cataclysm-archon',
    type: 'Seraphim',
    element: 'Light',
    rarity: 'Infinite',
    name: 'Lucent Cataclysm Archon',
    description: 'On play: gain 90 Radiance, draw 4, and set chain floor to ×9.0. In synergy: +720 Oblivion per card played.',
    artKey: 'inf_lucent_cataclysm_archon',
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 720, synergyRequirement: 'Light' },
    onPlayEffects: [
      { type: 'radiance_gain', value: 90 },
      { type: 'draw', value: 4 },
      { type: 'set_chain_floor', value: 9.0 },
    ],
  },
  {
    definitionId: 'inf-brass-eidolon-prime',
    type: 'Seraphim',
    element: 'Mechanical',
    rarity: 'Infinite',
    name: 'Brass Eidolon Prime',
    description: 'On play: gain 3 Strain, draw 4, set chain floor to ×7.5, and gain +1,500 Oblivion. In synergy: +1,200 Oblivion on Seeker plays.',
    artKey: 'inf_brass_eidolon_prime',
    baseStats: { bonusType: 'seeker_bonus', bonusValue: 1200, synergyRequirement: 'Mechanical' },
    onPlayEffects: [
      { type: 'strain_gain', value: 3 },
      { type: 'draw', value: 4 },
      { type: 'set_chain_floor', value: 7.5 },
      { type: 'oblivion_flat', value: 1500 },
    ],
  },
];

// ── Chaos (3) ─────────────────────────────────────────────────────────────────

export const infiniteChaosCards: ChaosDefinition[] = [
  {
    definitionId: 'inf-entropic-crown',
    type: 'Chaos',
    element: 'Neutrality',
    rarity: 'Infinite',
    name: 'Entropic Crown',
    description: 'Enthalpy: +1,200 Oblivion and draw 4 cards. While active: adjacent Seraphim gain +350 Oblivion per card played. Entropy (right-click in hand): set chain floor to ×10.0, then +2,000 Oblivion.',
    artKey: 'inf_entropic_crown',
    maxDurability: 28,
    effects: [
      { type: 'chaos_oblivion_per_card', value: 350 },
    ],
    enthalpy: [
      { type: 'oblivion_flat', value: 1200 },
      { type: 'draw', value: 4 },
    ],
    entropy: [
      { type: 'set_chain_floor', value: 10.0 },
      { type: 'oblivion_flat', value: 2000 },
    ],
  },
  {
    definitionId: 'inf-annihilation-field',
    type: 'Chaos',
    element: 'Neutrality',
    rarity: 'Infinite',
    name: 'Annihilation Field',
    description: 'Enthalpy: draw 3 cards and set chain floor to ×5.0. While active: adjacent Seraphim payouts are amplified ×4.0. Entropy (right-click in hand): shuffle discard into deck, then draw 4 cards.',
    artKey: 'inf_annihilation_field',
    maxDurability: 24,
    effects: [
      { type: 'chaos_seraphim_amp', value: 4.0 },
    ],
    enthalpy: [
      { type: 'draw', value: 3 },
      { type: 'set_chain_floor', value: 5.0 },
    ],
    entropy: [
      { type: 'shuffle_discard' },
      { type: 'draw', value: 4 },
    ],
  },
  {
    definitionId: 'inf-pyroclasm-engine',
    type: 'Chaos',
    element: 'Fire',
    rarity: 'Infinite',
    name: 'Pyroclasm Engine',
    description: 'Enthalpy: draw 3 cards and gain 60 Embers. While active: adjacent Seraphim gain +200 Oblivion per card and chain grows +0.20 faster. Entropy (right-click in hand): +3,000 Oblivion and vent all Strain.',
    artKey: 'inf_pyroclasm_engine',
    maxDurability: 22,
    effects: [
      { type: 'chaos_oblivion_per_card', value: 200 },
      { type: 'chaos_chain_bonus', value: 0.20 },
    ],
    enthalpy: [
      { type: 'draw', value: 3 },
      { type: 'ember_gain', value: 60 },
    ],
    entropy: [
      { type: 'oblivion_flat', value: 3000 },
      { type: 'strain_vent', value: 9999 },
    ],
  },
  {
    definitionId: 'inf-prismatic-collapse-lattice',
    type: 'Chaos',
    element: 'Prismatic',
    rarity: 'Infinite',
    name: 'Prismatic Collapse Lattice',
    description: 'Enthalpy: draw 4 and set chain floor to ×7.0. While active: adjacent Seraphim payouts are amplified ×3.2 and chain grows +0.22 faster. Entropy (right-click in hand): draw 3 and gain +2,500 Oblivion.',
    artKey: 'inf_prismatic_collapse_lattice',
    maxDurability: 26,
    effects: [
      { type: 'chaos_seraphim_amp', value: 3.2 },
      { type: 'chaos_chain_bonus', value: 0.22 },
    ],
    enthalpy: [
      { type: 'draw', value: 4 },
      { type: 'set_chain_floor', value: 7.0 },
    ],
    entropy: [
      { type: 'draw', value: 3 },
      { type: 'oblivion_flat', value: 2500 },
    ],
  },
  {
    definitionId: 'inf-gravebloom-singularity',
    type: 'Chaos',
    element: 'Thornbound',
    rarity: 'Infinite',
    name: 'Gravebloom Singularity',
    description: 'Enthalpy: gain 90 Trail and discard 2 then draw 4. While active: adjacent Seraphim gain +280 Oblivion per card and +240 Oblivion on Seeker plays. Entropy (right-click in hand): set chain floor to ×9.0 and salvage any card.',
    artKey: 'inf_gravebloom_singularity',
    maxDurability: 23,
    effects: [
      { type: 'chaos_oblivion_per_card', value: 280 },
      { type: 'chaos_seeker_bonus', value: 240 },
    ],
    enthalpy: [
      { type: 'trail_gain', value: 90 },
      { type: 'discard_draw', discard: 2, draw: 4 },
    ],
    entropy: [
      { type: 'set_chain_floor', value: 9.0 },
      { type: 'salvage_any' },
    ],
  },
  {
    definitionId: 'inf-heliarch-eclipse-engine',
    type: 'Chaos',
    element: 'Light',
    rarity: 'Infinite',
    name: 'Heliarch Eclipse Engine',
    description: 'Enthalpy: gain 110 Radiance and draw 3. While active: adjacent Seraphim gain +300 Oblivion on Seeker plays and chain grows +0.18 faster. Entropy (right-click in hand): double Radiance and gain +2,200 Oblivion.',
    artKey: 'inf_heliarch_eclipse_engine',
    maxDurability: 25,
    effects: [
      { type: 'chaos_seeker_bonus', value: 300 },
      { type: 'chaos_chain_bonus', value: 0.18 },
    ],
    enthalpy: [
      { type: 'radiance_gain', value: 110 },
      { type: 'draw', value: 3 },
    ],
    entropy: [
      { type: 'radiance_double' },
      { type: 'oblivion_flat', value: 2200 },
    ],
  },
  {
    definitionId: 'inf-mech-entropy-foundry',
    type: 'Chaos',
    element: 'Mechanical',
    rarity: 'Infinite',
    name: 'Mech Entropy Foundry',
    description: 'Enthalpy: gain 4 Strain and draw 3. While active: adjacent Seraphim gain +260 Oblivion per card and payouts are amplified ×2.6. Entropy (right-click in hand): vent all Strain and set chain floor to ×8.5.',
    artKey: 'inf_mech_entropy_foundry',
    maxDurability: 24,
    effects: [
      { type: 'chaos_oblivion_per_card', value: 260 },
      { type: 'chaos_seraphim_amp', value: 2.6 },
    ],
    enthalpy: [
      { type: 'strain_gain', value: 4 },
      { type: 'draw', value: 3 },
    ],
    entropy: [
      { type: 'strain_vent', value: 9999 },
      { type: 'set_chain_floor', value: 8.5 },
    ],
  },
];

// ── Angels (3) ────────────────────────────────────────────────────────────────

export const infiniteAngelCards: AngelDefinition[] = [
  {
    definitionId: 'inf-sovereign-void',
    type: 'Angel',
    element: 'Neutrality',
    rarity: 'Infinite',
    name: 'Sovereign Void',
    description: 'Summon: requires 3+ Seraphim on the board. Gain 60 of your dominant resource, draw 6, set chain floor ×10.0. After 4 cards: right-click to draw 7, +3,500 Oblivion, set chain floor ×12.0, and empower the next card. While on board: +500 Oblivion per card played.',
    artKey: 'inf_sovereign_void',
    summonCost: [],
    extraSummonConditions: [
      { type: 'seraphim_on_board_gte', value: 3 },
    ],
    onSummonEffects: [
      { type: 'dominant_stack_gain', value: 60 },
      { type: 'draw', value: 6 },
      { type: 'set_chain_floor', value: 10.0 },
    ],
    activatedAbility: {
      name: 'Null Dominion',
      cardsPlayedRequirement: 4,
      description: 'Draw 7 cards, gain +3,500 Oblivion, set chain floor to ×12.0, and empower the next card.',
      effects: [
        { type: 'draw', value: 7 },
        { type: 'oblivion_flat', value: 3500 },
        { type: 'set_chain_floor', value: 12.0 },
        { type: 'multiply_next' },
      ],
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 500 },
  },
  {
    definitionId: 'inf-eternity-rupture',
    type: 'Angel',
    element: 'Neutrality',
    rarity: 'Infinite',
    name: 'Eternity Rupture',
    description: 'Summon: requires 2+ Seraphim and 2+ active Chaos cards. Draw 5, +2,000 Oblivion, set chain floor ×7.0. After 4 cards: right-click to draw 5, +3,000 Oblivion, set chain floor ×10.0, and empower the next card. While on board: +600 Oblivion per card played.',
    artKey: 'inf_eternity_rupture',
    summonCost: [],
    extraSummonConditions: [
      { type: 'seraphim_on_board_gte', value: 2 },
      { type: 'chaos_active_gte', value: 2 },
    ],
    onSummonEffects: [
      { type: 'draw', value: 5 },
      { type: 'oblivion_flat', value: 2000 },
      { type: 'set_chain_floor', value: 7.0 },
    ],
    activatedAbility: {
      name: 'Rupture Convergence',
      cardsPlayedRequirement: 4,
      description: 'Draw 5 cards, gain +3,000 Oblivion, set chain floor to ×10.0, and empower the next card.',
      effects: [
        { type: 'draw', value: 5 },
        { type: 'oblivion_flat', value: 3000 },
        { type: 'set_chain_floor', value: 10.0 },
        { type: 'multiply_next' },
      ],
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 600 },
  },
  {
    definitionId: 'inf-riftborn-sovereign',
    type: 'Angel',
    element: 'Fire',
    rarity: 'Infinite',
    name: 'Riftborn Sovereign',
    description: 'Summon: requires 1+ active Chaos card. Gain 120 Embers, draw 5, +1,500 Oblivion, set chain floor ×6.0. After 5 cards: right-click to drain all Embers, draw 4, gain +4,000 Oblivion, and empower the next card. While on board: +400 Oblivion per card + +30 Embers per card.',
    artKey: 'inf_riftborn_sovereign',
    summonCost: [],
    extraSummonConditions: [
      { type: 'chaos_active_gte', value: 1 },
    ],
    onSummonEffects: [
      { type: 'ember_gain', value: 120 },
      { type: 'draw', value: 5 },
      { type: 'oblivion_flat', value: 1500 },
      { type: 'set_chain_floor', value: 6.0 },
    ],
    activatedAbility: {
      name: 'Rift Conflagration',
      cardsPlayedRequirement: 5,
      description: 'Drain all Embers, draw 4 cards, gain +4,000 Oblivion, and empower the next card.',
      effects: [
        { type: 'ember_spend', value: 9999 },
        { type: 'draw', value: 4 },
        { type: 'oblivion_flat', value: 4000 },
        { type: 'multiply_next' },
      ],
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 400 },
  },
  {
    definitionId: 'inf-prismatic-judgement-array',
    type: 'Angel',
    element: 'Prismatic',
    rarity: 'Infinite',
    name: 'Prismatic Judgement Array',
    description: 'Summon: requires 2+ Seraphim and 1+ active Chaos. Draw 5, gain 40 dominant resource, and set chain floor ×8.5. After 4 cards: right-click to search Seeker/Chaos, draw 4, empower next card, and gain +2,800 Oblivion. While on board: +470 Oblivion per card played.',
    artKey: 'inf_prismatic_judgement_array',
    summonCost: [],
    extraSummonConditions: [
      { type: 'seraphim_on_board_gte', value: 2 },
      { type: 'chaos_active_gte', value: 1 },
    ],
    onSummonEffects: [
      { type: 'draw', value: 5 },
      { type: 'dominant_stack_gain', value: 40 },
      { type: 'set_chain_floor', value: 8.5 },
    ],
    activatedAbility: {
      name: 'Spectrum Verdict',
      cardsPlayedRequirement: 4,
      description: 'Search a Seeker/Chaos card, draw 4 cards, empower next card, and gain +2,800 Oblivion.',
      effects: [
        { type: 'search_deck_by_type', filter: ['Seeker', 'Chaos'] },
        { type: 'draw', value: 4 },
        { type: 'multiply_next' },
        { type: 'oblivion_flat', value: 2800 },
      ],
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 470 },
  },
  {
    definitionId: 'inf-thornbound-elegy-titan',
    type: 'Angel',
    element: 'Thornbound',
    rarity: 'Infinite',
    name: 'Thornbound Elegy Titan',
    description: 'Summon: requires 2+ Seraphim. Gain 120 Trail, draw 4, gain +120% total Oblivion this turn, and set chain floor ×6.8. After 5 cards: right-click to salvage any, draw 4, set chain floor ×9.6, and gain +3,200 Oblivion. While on board: +520 Oblivion per card played.',
    artKey: 'inf_thornbound_elegy_titan',
    summonCost: [],
    extraSummonConditions: [
      { type: 'seraphim_on_board_gte', value: 2 },
    ],
    onSummonEffects: [
      { type: 'trail_gain', value: 120 },
      { type: 'draw', value: 4 },
      { type: 'score_multiplier', value: 120 },
      { type: 'set_chain_floor', value: 6.8 },
    ],
    activatedAbility: {
      name: 'Funeral Surge',
      cardsPlayedRequirement: 5,
      description: 'Salvage any card, draw 4 cards, set chain floor to ×9.6, and gain +3,200 Oblivion.',
      effects: [
        { type: 'salvage_any' },
        { type: 'draw', value: 4 },
        { type: 'set_chain_floor', value: 9.6 },
        { type: 'oblivion_flat', value: 3200 },
      ],
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 520 },
  },
  {
    definitionId: 'inf-mechanical-apotheosis-core',
    type: 'Angel',
    element: 'Mechanical',
    rarity: 'Infinite',
    name: 'Mechanical Apotheosis Core',
    description: 'Summon: requires 2+ Seraphim and 1+ active Chaos. Gain 4 Strain, draw 5, set chain floor ×7.8, and gain +1,800 Oblivion. After 4 cards: right-click to overclock (3 Strain) then draw 5, empower next card, set chain floor ×10.5, and gain +3,500 Oblivion. While on board: +560 Oblivion per card played.',
    artKey: 'inf_mechanical_apotheosis_core',
    summonCost: [],
    extraSummonConditions: [
      { type: 'seraphim_on_board_gte', value: 2 },
      { type: 'chaos_active_gte', value: 1 },
    ],
    onSummonEffects: [
      { type: 'strain_gain', value: 4 },
      { type: 'draw', value: 5 },
      { type: 'set_chain_floor', value: 7.8 },
      { type: 'oblivion_flat', value: 1800 },
    ],
    activatedAbility: {
      name: 'Core Singularity',
      cardsPlayedRequirement: 4,
      description: 'Overclock (3 Strain), then draw 5 cards, empower next card, set chain floor to ×10.5, and gain +3,500 Oblivion.',
      effects: [
        { type: 'overclock', strain: 3, then: [{ type: 'draw', value: 5 }, { type: 'multiply_next' }, { type: 'set_chain_floor', value: 10.5 }] },
        { type: 'oblivion_flat', value: 3500 },
      ],
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 560 },
  },
];

// ── Flat export for registry ──────────────────────────────────────────────────

export const infiniteCards: Array<SeekerDefinition | SeraphimDefinition | ChaosDefinition | AngelDefinition> = [
  ...infiniteSeekerCards,
  ...infiniteSeraphimCards,
  ...infiniteChaosCards,
  ...infiniteAngelCards,
];

// ── Combination recipes ───────────────────────────────────────────────────────

export const INFINITE_RECIPES: InfiniteRecipe[] = [
  // ── Seekers ──
  {
    resultId: 'inf-oblivion-absolute',
    lore: 'When the four axioms of annihilation converge, nothing remains but the absolute void.',
    ingredients: [
      { definitionId: 'btei-axiom-of-oblivion', count: 3 },
      { definitionId: 'btei-null-edict', count: 2 },
    ],
  },
  {
    resultId: 'inf-void-cascade',
    lore: 'Time rewound past its first breath, pouring endlessly into itself.',
    ingredients: [
      { definitionId: 'btei-temporal-ruin', count: 3 },
      { definitionId: 'btei-voids-reaping', count: 2 },
    ],
  },
  {
    resultId: 'inf-ash-kings-apocalypse',
    lore: 'The Ash Kings did not end — they became the conflagration that erases horizons.',
    ingredients: [
      { definitionId: 'btei-pyroabyss-ashfall-engine', count: 3 },
      { definitionId: 'btei-pyroabyss-oblivion-phoenix', count: 2 },
    ],
  },
  // ── Seraphim ──
  {
    resultId: 'inf-genesis-throne',
    lore: 'Before the first star, before even the void — the Throne already sat.',
    ingredients: [
      { definitionId: 'btei-colossus-advent', count: 3 },
      { definitionId: 'btei-eternal-vigil', count: 2 },
    ],
  },
  {
    resultId: 'inf-null-apex',
    lore: 'The apex of nothingness: a point so empty it bends all realities inward.',
    ingredients: [
      { definitionId: 'btei-neutrality-void-throne', count: 3 },
      { definitionId: 'btei-architects-manifold', count: 2 },
    ],
  },
  {
    resultId: 'inf-pyraxis-colossus',
    lore: 'Born of a dying star\'s last rage, Pyraxis stands where oceans of flame once flowed.',
    ingredients: [
      { definitionId: 'btei-pyroabyss-infernal-archon', count: 3 },
      { definitionId: 'btei-pyroabyss-cinder-cataclysm', count: 2 },
    ],
  },
  // ── Chaos ──
  {
    resultId: 'inf-entropic-crown',
    lore: 'To wear entropy is to command it — the crown does not decay; it unmakes.',
    ingredients: [
      { definitionId: 'btei-architects-manifold', count: 3 },
      { definitionId: 'btei-sovereign-domain', count: 2 },
    ],
  },
  {
    resultId: 'inf-annihilation-field',
    lore: 'In the field of annihilation, even the concept of opposition ceases.',
    ingredients: [
      { definitionId: 'btei-neutrality-zero-edict', count: 3 },
      { definitionId: 'btei-sovereign-domain', count: 2 },
    ],
  },
  {
    resultId: 'inf-pyroclasm-engine',
    lore: 'The engine does not burn. The engine is the burning.',
    ingredients: [
      { definitionId: 'btei-pyroabyss-cinder-cataclysm', count: 3 },
      { definitionId: 'btei-light-choir-imperator', count: 2 },
    ],
  },
  // ── Angels ──
  {
    resultId: 'inf-sovereign-void',
    lore: 'No court. No subjects. Only dominion absolute and the silence of a conquered cosmos.',
    ingredients: [
      { definitionId: 'btei-omniscient-fracture', count: 3 },
      { definitionId: 'btei-convergence-of-eternity', count: 2 },
    ],
  },
  {
    resultId: 'inf-eternity-rupture',
    lore: 'The seam between eternities split, and from it emerged something that predated both.',
    ingredients: [
      { definitionId: 'btei-convergence-of-eternity', count: 3 },
      { definitionId: 'btei-sovereign-domain', count: 2 },
    ],
  },
  {
    resultId: 'inf-riftborn-sovereign',
    lore: 'It crossed the rift so many times it became indistinguishable from the crossing itself.',
    ingredients: [
      { definitionId: 'btei-pyroabyss-hellrift-mandala', count: 3 },
      { definitionId: 'btei-pyroabyss-infernal-archon', count: 2 },
    ],
  },
  {
    resultId: 'inf-prismatic-axiom-rain',
    lore: 'A theorem of color written across the sky until causality fractures into rain.',
    ingredients: [
      { definitionId: 'btei-prismatic-vorthum-edict', count: 3 },
      { definitionId: 'btei-prismatic-ninefold-accord', count: 2 },
    ],
  },
  {
    resultId: 'inf-thornbound-last-procession',
    lore: 'The final march of thorns never ended; it became the law of endings.',
    ingredients: [
      { definitionId: 'btei-thornbound-gallowcrown-matron', count: 3 },
      { definitionId: 'btei-thornbound-briar-siege', count: 2 },
    ],
  },
  {
    resultId: 'inf-celestial-blackout',
    lore: 'At peak noon, heaven blinked once, and every star remembered fear.',
    ingredients: [
      { definitionId: 'btei-light-throne-of-morning', count: 3 },
      { definitionId: 'btei-light-sunbreak-canon', count: 2 },
    ],
  },
  {
    resultId: 'inf-machina-eternal-loop',
    lore: 'A machine that solved mortality by deleting the distinction between start and end.',
    ingredients: [
      { definitionId: 'btei-mech-overclock-singularity', count: 3 },
      { definitionId: 'btei-mech-reactor-paradigm', count: 2 },
    ],
  },
  {
    resultId: 'inf-prismatic-choir-splinter',
    lore: 'One shard of the choir sings loud enough to split empires.',
    ingredients: [
      { definitionId: 'btei-prismatic-storm-memory', count: 3 },
      { definitionId: 'btei-prismatic-fracture-archive', count: 2 },
    ],
  },
  {
    resultId: 'inf-thorn-widow-engine',
    lore: 'Built from grief and wire, it harvests war and returns only momentum.',
    ingredients: [
      { definitionId: 'btei-thornbound-cathedral-lancer', count: 3 },
      { definitionId: 'btei-thornbound-red-march', count: 2 },
    ],
  },
  {
    resultId: 'inf-lucent-cataclysm-archon',
    lore: 'Its radiance was not warmth, but a disciplined apocalypse.',
    ingredients: [
      { definitionId: 'btei-light-aureate-rapture', count: 3 },
      { definitionId: 'btei-light-choir-imperator', count: 2 },
    ],
  },
  {
    resultId: 'inf-brass-eidolon-prime',
    lore: 'Every brass verdict echoes forever once the prime mind awakens.',
    ingredients: [
      { definitionId: 'btei-mech-furnace-ascension', count: 3 },
      { definitionId: 'btei-mech-brass-judicator', count: 2 },
    ],
  },
  {
    resultId: 'inf-prismatic-collapse-lattice',
    lore: 'The lattice does not hold reality together; it chooses what falls through.',
    ingredients: [
      { definitionId: 'btei-prismatic-blindwars-reliquary', count: 3 },
      { definitionId: 'btei-prismatic-storm-memory', count: 2 },
    ],
  },
  {
    resultId: 'inf-gravebloom-singularity',
    lore: 'An entire graveyard compressed into one blooming instant.',
    ingredients: [
      { definitionId: 'btei-thornbound-red-march', count: 3 },
      { definitionId: 'btei-thornbound-funeral-bramble', count: 2 },
    ],
  },
  {
    resultId: 'inf-heliarch-eclipse-engine',
    lore: 'The sun itself became an instruction set and obeyed.',
    ingredients: [
      { definitionId: 'btei-light-choir-imperator', count: 3 },
      { definitionId: 'btei-light-halo-dominion', count: 2 },
    ],
  },
  {
    resultId: 'inf-mech-entropy-foundry',
    lore: 'Entropy entered the foundry as ore and left as policy.',
    ingredients: [
      { definitionId: 'btei-mech-brass-judicator', count: 3 },
      { definitionId: 'btei-mech-reactor-paradigm', count: 2 },
    ],
  },
  {
    resultId: 'inf-prismatic-judgement-array',
    lore: 'Nine mirrored judges reached the same verdict: continue forever.',
    ingredients: [
      { definitionId: 'btei-prismatic-ninefold-accord', count: 3 },
      { definitionId: 'btei-prismatic-blindwars-reliquary', count: 2 },
    ],
  },
  {
    resultId: 'inf-thornbound-elegy-titan',
    lore: 'Its elegy is a marching order carved into continents.',
    ingredients: [
      { definitionId: 'btei-thornbound-funeral-bramble', count: 3 },
      { definitionId: 'btei-thornbound-gallowcrown-matron', count: 2 },
    ],
  },
  {
    resultId: 'inf-mechanical-apotheosis-core',
    lore: 'When the core reached apotheosis, logic had to kneel to output.',
    ingredients: [
      { definitionId: 'btei-mech-thaumic-primevector', count: 3 },
      { definitionId: 'btei-mech-reactor-paradigm', count: 2 },
    ],
  },
];
