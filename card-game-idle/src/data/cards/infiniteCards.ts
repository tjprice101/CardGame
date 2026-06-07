import type { OphanimDefinition, SeraphimDefinition, CherubimDefinition, AngelDefinition } from '@/types/cards';

// Combination recipe system
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

// 27 Infinite cards

// Ophanims (3)

export const infiniteOphanimCards: OphanimDefinition[] = [
  {
    definitionId: 'inf-oblivion-absolute',
    type: 'Ophanim',
    element: 'Neutrality',
    rarity: 'Infinite',
    name: 'Oblivion Absolute',
    description: 'Gain Oblivion scaled by total Patience and peak Patience; All Seraphim on board gain +15 Patience; Grant 2 Patient Light stacks (boosts card-play Patience gain with diminishing returns at high stacks)',
    artKey: 'inf_oblivion_absolute',
    effects: [
      { type: 'oblivion_flat', value: 6000 },
      { type: 'patience_gain_all', value: 26 },
      { type: 'neutrality_patient_light_gain', value: 4 }],
  },
  {
    definitionId: 'inf-void-cascade',
    type: 'Ophanim',
    element: 'Neutrality',
    rarity: 'Infinite',
    name: 'Void Cascade',
    description: 'All Seraphim on board gain +25 Patience; Grant 1 Patient Light stack (boosts card-play Patience gain with diminishing returns at high stacks)',
    artKey: 'inf_void_cascade',
    effects: [
      { type: 'oblivion_flat', value: 0 },
      { type: 'patience_gain_all', value: 13 },
      { type: 'neutrality_patient_light_gain', value: 3 }],
  },
  {
    definitionId: 'inf-ash-kings-apocalypse',
    type: 'Ophanim',
    element: 'Fire',
    rarity: 'Infinite',
    name: "Ash Kings' Apocalypse",
    description: 'Gain 6 Furnace Heat; Gain 10 Chroma Embers; If you have 6+ Furnace Heat, Spend 6 Furnace Heat; Gain 4 Chroma Embers; Gain Oblivion scaled by Furnace Heat tiers, Chroma Embers, and Heat-Ember balance; Ignite up to 5 Chroma Embers (+122 Oblivion × echoes²); If you have 7+ Chroma Embers, none; Gain Oblivion scaled by Furnace Heat tiers, Chroma Embers, and Heat-Ember balance; Draw 1 card',
    artKey: 'inf_ash_kings_apocalypse',
    // Role: catastrophic seeder. Front-loads an oversized Chroma pool, ignites
    // only part of it, and leaves reserve embers for subsequent finishers.
    effects: [
      { type: 'eternal_stack_gain', stack: 'pyro', value: 6 },
      { type: 'set_secondary_gain', kind: 'pyro', value: 10 },
      { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'pyro', value: 6 }, then: [{ type: 'eternal_stack_spend', stack: 'pyro', value: 6 }, { type: 'set_secondary_gain', kind: 'pyro', value: 4 }, { type: 'oblivion_flat', value: 2600 }] },
      { type: 'pyro_cinder_echo_ignite', oblivionPerEchoSquared: 122, consume: 5 },
      { type: 'conditional', condition: { type: 'set_secondary_gte', kind: 'pyro', value: 7 }, then: [] },
      { type: 'oblivion_flat', value: 2200 },
      { type: 'draw', value: 1 }],
  },
  {
    definitionId: 'inf-prismatic-axiom-rain',
    type: 'Ophanim',
    element: 'Prismatic',
    rarity: 'Infinite',
    name: 'Prismatic Axiom Rain',
    description: 'Look at the top 10 cards, take 3 cards, put 2 cards on the bottom, and discard the rest; Gain 6 Resonance Charge; If you have played 4+ distinct channels this turn, Gain 2 Resonance Charge; If you have 6+ Resonance Charge, Spend 6 Resonance Charge; Gain Oblivion scaled by distinct channels, Prism Charges, and high Refraction Depth; If Refraction Depth is 5+, Gain Oblivion scaled by distinct channels, Prism Charges, and high Refraction Depth; Draw 2 cards',
    artKey: 'inf_prismatic_axiom_rain',
    effects: [
      { type: 'look_top_take_drop', look: 10, take: 3, drop: 2 },
      { type: 'resonance_charge_gain', value: 6 },
      { type: 'conditional', condition: { type: 'prismatic_distinct_channels_gte', value: 4 }, then: [{ type: 'resonance_charge_gain', value: 2 }] },
      {
        type: 'conditional',
        condition: { type: 'resonance_charge_gte', value: 6 },
        then: [
          { type: 'resonance_charge_spend', value: 6 },
          { type: 'oblivion_flat', value: 3600 },
          { type: 'conditional', condition: { type: 'prismatic_refraction_depth_gte', value: 5 }, then: [{ type: 'oblivion_flat', value: 2200 }] },
          { type: 'draw', value: 2 },
        ],
      },
    ],
  },
  {
    definitionId: 'inf-thornbound-last-procession',
    type: 'Ophanim',
    element: 'Thornbound',
    rarity: 'Infinite',
    name: 'Thornbound Last Procession',
    description: 'Gain 112 Trail; Gain 9 Briar Spirals; Salvage any 1 card; Gain +230% total Oblivion this turn; If you have 6+ Briar Spirals, Spend 3 Briar Spirals; Gain 3 Briar Spirals; Gain 40 Trail; Gain Oblivion scaled by Scar, Trail, and Briar Spirals; If you have 5+ Briar Spirals, Spend 3 Briar Spirals; Bloom up to 3 Briar Spirals (+72 Trail per spiral); If you have 150+ Trail, Spend 70 Trail; Gain Oblivion scaled by Scar, Trail, and Briar Spirals; Draw 1 card',
    artKey: 'inf_thornbound_last_procession',
    // Role: SPIRAL REFINERY. Stacks and refines Briar Spirals, then performs
    // a controlled high-yield bloom instead of an all-in cashout.
    effects: [
      { type: 'trail_gain', value: 112 },
      { type: 'set_secondary_gain', kind: 'thorn', value: 9 },
      { type: 'salvage_any' },
      { type: 'score_multiplier', value: 230 },
      { type: 'conditional', condition: { type: 'set_secondary_gte', kind: 'thorn', value: 6 }, then: [{ type: 'set_secondary_spend', kind: 'thorn', value: 3 }, { type: 'set_secondary_gain', kind: 'thorn', value: 3 }, { type: 'trail_gain', value: 40 }, { type: 'oblivion_flat', value: 2600 }] },
      { type: 'conditional', condition: { type: 'set_secondary_gte', kind: 'thorn', value: 5 }, then: [{ type: 'set_secondary_spend', kind: 'thorn', value: 3 }, { type: 'thorn_briar_spiral_bloom', trailPerSpiral: 72, oblivionPerTrail: 24, consume: 3 }] },
      { type: 'conditional', condition: { type: 'trail_gte', value: 150 }, then: [{ type: 'trail_spend', value: 70 }, { type: 'oblivion_flat', value: 3800 }, { type: 'draw', value: 1 }] }],
  },
  {
    definitionId: 'inf-celestial-blackout',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Infinite',
    name: 'Celestial Blackout',
    description: 'Gain 240 Radiance; Gain 8 Halo; If you have 10+ Halo, Spend 10 Halo; Gain Oblivion scaled by Radiance, Halo, and active Seraphim; Double current Radiance; If you have 6+ Cadence, Gain Oblivion scaled by Radiance, Halo, and active Seraphim; Look at the top 9 cards and take 1 matching Seraphim or Angel; Gain Oblivion scaled by Radiance, Halo, and active Seraphim',
    artKey: 'inf_celestial_blackout',
    // Role: UBER opener-finisher. Frontloads Halo, then converts it into a massive
    // threshold burst while also fixing your next line with deep unit selection.
    effects: [
      { type: 'radiance_gain', value: 120 },
      { type: 'eternal_stack_gain', stack: 'light', value: 8 },
      { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'light', value: 10 }, then: [{ type: 'eternal_stack_spend', stack: 'light', value: 10 }, { type: 'oblivion_flat', value: 5600 }] },
      { type: 'radiance_double' },
      { type: 'radiance_gain', value: 120 },
      { type: 'conditional', condition: { type: 'light_resonance_gte', value: 6 }, then: [{ type: 'oblivion_flat', value: 4500 }] },
      { type: 'look_top_take_type', look: 9, filter: ['Seraphim', 'Angel'] },
      { type: 'oblivion_flat', value: 3600 }],
  },
  {
    definitionId: 'inf-machina-eternal-loop',
    type: 'Ophanim',
    element: 'Mechanical',
    rarity: 'Infinite',
    name: 'Machina Eternal Loop',
    description: 'Gain 14 Strain; Gain 8 Reactor Cores; Gain Oblivion scaled by Reactor Cores and Strain; If you have 10+ Reactor Cores, Spend 10 Reactor Cores; Gain Oblivion scaled by Reactor Cores and Strain; Gain 6 Strain',
    artKey: 'inf_machina_eternal_loop',
    // Role: INFINITE CORE DETONATOR. Frontloads a large Core bank, then spends
    // a high threshold in one burst to force a decisive mid-turn spike.
    effects: [
      { type: 'strain_gain', value: 14 },
      { type: 'eternal_stack_gain', stack: 'mech', value: 8 },
      { type: 'oblivion_flat', value: 3200 },
      { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'mech', value: 10 }, then: [{ type: 'eternal_stack_spend', stack: 'mech', value: 10 }, { type: 'oblivion_flat', value: 5200 }] },
      { type: 'strain_gain', value: 6 }],
  }];

// Seraphim (3)

export const infiniteSeraphimCards: SeraphimDefinition[] = [
  {
    definitionId: 'inf-genesis-throne',
    type: 'Seraphim',
    element: 'Neutrality',
    rarity: 'Infinite',
    name: 'Genesis Throne',
    description: 'On play: Gain Oblivion scaled by total Patience, peak Patience, engine signatures, and setup count. While on board: +730 Oblivion per card played while active. Patience: +1 stack per card played; on attack, each stack → +15 Oblivion',

    artKey: 'inf_genesis_throne',
    attacks: {
      unsynergized: {
        id: 'inf-genesis-throne:unsynergized',
        label: 'Unsynergized',
        name: 'Genesis Throne Vector Break',
        description: '7600 base Oblivion · 6 cards cooldown',
        baseOblivion: 7600,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'neutrality'],
      },
      synergized: {
        id: 'inf-genesis-throne:synergized',
        label: 'Synergized',
        name: 'Genesis Throne Angelic Verdict',
        description: '12540 base Oblivion · 7 cards cooldown · Requires Angel',
        baseOblivion: 12540,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'neutrality'],
      },
    },
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 760, synergyRequirement: 'Neutrality' },
    patienceThreshold: 8,
    onPlayEffects: [
      { type: 'oblivion_flat', value: 2400 },
      { type: 'patience_gain_all', value: 9 },
      { type: 'neutrality_patient_light_gain', value: 2 }],
  },
  {
    definitionId: 'inf-null-apex',
    type: 'Seraphim',
    element: 'Neutrality',
    rarity: 'Infinite',
    name: 'Null Apex',
    description: 'While on board: +2000 Oblivion whenever you play an Ophanim while active. Patience: +1 stack per card played; on attack, each stack → +15 Oblivion',

    artKey: 'inf_null_apex',
    attacks: {
      unsynergized: {
        id: 'inf-null-apex:unsynergized',
        label: 'Unsynergized',
        name: 'Null Apex Vector Break',
        description: '6840 base Oblivion · 6 cards cooldown',
        baseOblivion: 6840,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'neutrality'],
      },
      synergized: {
        id: 'inf-null-apex:synergized',
        label: 'Synergized',
        name: 'Null Apex Angelic Verdict',
        description: '13800 base Oblivion · 7 cards cooldown · Requires Angel',
        baseOblivion: 13800,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'neutrality'],
      },
    },
    baseStats: { bonusType: 'ophanim_bonus', bonusValue: 1100, synergyRequirement: 'Neutrality' },
    patienceThreshold: 8,
    onPlayEffects: [
      { type: 'patience_gain_all', value: 12 },
      { type: 'neutrality_patient_light_gain', value: 2 },
      { type: 'oblivion_flat', value: 1100 }],
  },
  {
    definitionId: 'inf-pyraxis-colossus',
    type: 'Seraphim',
    element: 'Fire',
    rarity: 'Infinite',
    name: 'Pyraxis Colossus',
    description: 'On play: Gain 5 Furnace Heat; Gain 3 Chroma Embers; If you have 7+ Furnace Heat, Spend 7 Furnace Heat; Gain 4 Chroma Embers; Gain Oblivion scaled by Furnace Heat tiers, Chroma Embers, and Heat-Ember balance; If you have 4+ Chroma Embers, Ignite up to 3 Chroma Embers (+108 Oblivion × echoes²); Gain Oblivion scaled by Furnace Heat tiers, Chroma Embers, and Heat-Ember balance. While on board: +760 Oblivion per card played while active',
    artKey: 'inf_pyraxis_colossus',
    attacks: {
      unsynergized: {
        id: 'inf-pyraxis-colossus:unsynergized',
        label: 'Unsynergized',
        name: 'Pyraxis Colossus Vector Break',
        description: '4525 base Oblivion · 6 cards cooldown · +3% attack per Heat (max +75%) · +5% attack per Chroma Ember (max +25%, consumed on Infinite Fire attack)',
        baseOblivion: 4525,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'fire'],
      },
      synergized: {
        id: 'inf-pyraxis-colossus:synergized',
        label: 'Synergized',
        name: 'Pyraxis Colossus Angelic Verdict',
        description: '7693 base Oblivion · 7 cards cooldown · Requires Angel · +3% attack per Heat (max +75%) · +5% attack per Chroma Ember (max +25%, consumed on Infinite Fire attack)',
        baseOblivion: 7693,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'fire'],
      },
    },
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 760, synergyRequirement: 'Fire' },
    // Role: threshold transmuter. Demands a higher Tier checkpoint, then
    // converts it into a compressed high-quality Chroma burst.
    onPlayEffects: [
      { type: 'eternal_stack_gain', stack: 'pyro', value: 5 },
      { type: 'set_secondary_gain', kind: 'pyro', value: 3 },
      { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'pyro', value: 7 }, then: [{ type: 'eternal_stack_spend', stack: 'pyro', value: 7 }, { type: 'set_secondary_gain', kind: 'pyro', value: 4 }, { type: 'oblivion_flat', value: 2200 }] },
      { type: 'conditional', condition: { type: 'set_secondary_gte', kind: 'pyro', value: 4 }, then: [{ type: 'pyro_cinder_echo_ignite', oblivionPerEchoSquared: 108, consume: 3 }, { type: 'oblivion_flat', value: 1200 }] }],
  },
  {
    definitionId: 'inf-prismatic-choir-splinter',
    type: 'Seraphim',
    element: 'Prismatic',
    rarity: 'Infinite',
    name: 'Prismatic Choir Splinter',
    description: 'On play: Gain 4 Resonance Charge; +240% total Oblivion this turn; Gain +160% total Oblivion this turn; If you have 5+ Resonance Charge, Spend 5 Resonance Charge; +2500 Oblivion; If Refraction Depth is 4+, +1900 Oblivion; If you have played 4+ distinct channels this turn, +900 Oblivion. While on board: +500 Oblivion per card played while active',
    artKey: 'inf_prismatic_choir_splinter',
    attacks: {
      unsynergized: {
        id: 'inf-prismatic-choir-splinter:unsynergized',
        label: 'Unsynergized',
        name: 'Prismatic Choir Vector Break',
        description: '4490 base Oblivion · 6 cards cooldown',
        baseOblivion: 4490,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'prismatic'],
      },
      synergized: {
        id: 'inf-prismatic-choir-splinter:synergized',
        label: 'Synergized',
        name: 'Prismatic Choir Angelic Verdict',
        description: '7633 base Oblivion · 7 cards cooldown · Requires Angel',
        baseOblivion: 7633,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'prismatic'],
      },
    },
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 500, synergyRequirement: 'Prismatic' },
    onPlayEffects: [
      { type: 'resonance_charge_gain', value: 4 },
      { type: 'score_flat', value: 240 },
      { type: 'score_multiplier', value: 160 },
      {
        type: 'conditional',
        condition: { type: 'resonance_charge_gte', value: 5 },
        then: [
          { type: 'resonance_charge_spend', value: 5 },
          { type: 'oblivion_flat', value: 2500 },
          { type: 'conditional', condition: { type: 'prismatic_refraction_depth_gte', value: 4 }, then: [{ type: 'oblivion_flat', value: 1900 }] },
          { type: 'conditional', condition: { type: 'prismatic_distinct_channels_gte', value: 4 }, then: [{ type: 'oblivion_flat', value: 900 }] },
        ],
      },
    ],
  },
  {
    definitionId: 'inf-thorn-widow-engine',
    type: 'Seraphim',
    element: 'Thornbound',
    rarity: 'Infinite',
    name: 'Thorn Widow Engine',
    description: 'On play: Gain 84 Trail; Gain 6 Briar Spirals; If you have 5+ Briar Spirals, Spend 3 Briar Spirals; Gain 4 Briar Spirals; Gain Oblivion scaled by Scar, Trail, and Briar Spirals; If you have 4+ Briar Spirals, Spend 2 Briar Spirals; Bloom up to 2 Briar Spirals (+78 Trail per spiral); Gain +150% total Oblivion this turn; If you have 110+ Trail, Spend 44 Trail; Gain 24 Trail; Gain Oblivion scaled by Scar, Trail, and Briar Spirals. While on board: Each new Cherubim summoned while active gains +2 durability',
    artKey: 'inf_thorn_widow_engine',
    attacks: {
      unsynergized: {
        id: 'inf-thorn-widow-engine:unsynergized',
        label: 'Unsynergized',
        name: 'Thorn Widow Vector Break',
        description: '4405 base Oblivion · 6 cards cooldown · Cost: spend 29 Trail',
        baseOblivion: 4405,
        cooldownCards: 6,
        costs: [{ type: 'spend_trail', value: 29 }],
        tags: ['seraphim', 'unsynergized', 'thornbound'],
      },
      synergized: {
        id: 'inf-thorn-widow-engine:synergized',
        label: 'Synergized',
        name: 'Thorn Widow Angelic Verdict',
        description: '7489 base Oblivion · 7 cards cooldown · Requires Angel · Cost: spend 36 Trail',
        baseOblivion: 7489,
        cooldownCards: 7,
        costs: [{ type: 'spend_trail', value: 36 }],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'thornbound'],
      },
    },
    baseStats: { bonusType: 'cherubim_extra_plays', bonusValue: 2, synergyRequirement: 'Thornbound' },
    // Role: SURGE AMPLIFIER. Stacks Briar Spirals heavily,
    // then executes a precision two-spiral bloom with heavy per-spiral scaling.
    onPlayEffects: [
      { type: 'trail_gain', value: 84 },
      { type: 'set_secondary_gain', kind: 'thorn', value: 6 },
      { type: 'conditional', condition: { type: 'set_secondary_gte', kind: 'thorn', value: 5 }, then: [{ type: 'set_secondary_spend', kind: 'thorn', value: 3 }, { type: 'set_secondary_gain', kind: 'thorn', value: 4 }, { type: 'oblivion_flat', value: 2600 }] },
      { type: 'conditional', condition: { type: 'set_secondary_gte', kind: 'thorn', value: 4 }, then: [{ type: 'set_secondary_spend', kind: 'thorn', value: 2 }, { type: 'thorn_briar_spiral_bloom', trailPerSpiral: 78, oblivionPerTrail: 220, consume: 2 }] },
      { type: 'score_multiplier', value: 150 },
      { type: 'conditional', condition: { type: 'trail_gte', value: 110 }, then: [{ type: 'trail_spend', value: 44 }, { type: 'trail_gain', value: 24 }, { type: 'oblivion_flat', value: 2800 }] }],
  },
  {
    definitionId: 'inf-lucent-cataclysm-archon',
    type: 'Seraphim',
    element: 'Light',
    rarity: 'Infinite',
    name: 'Lucent Cataclysm Archon',
    description: 'On play: Gain 192 Radiance; Gain 6 Halo; If you have 9+ Halo, Spend 9 Halo; Gain Oblivion scaled by Radiance, Halo, and active Seraphim; If you have 6+ Cadence, Double current Radiance; Gain Oblivion scaled by Radiance, Halo, and active Seraphim; Search your deck for 1 matching Ophanim or Angel. While on board: +760 Oblivion per card played while active',
    artKey: 'inf_lucent_cataclysm_archon',
    attacks: {
      unsynergized: {
        id: 'inf-lucent-cataclysm-archon:unsynergized',
        label: 'Unsynergized',
        name: 'Lucent Cataclysm Vector Break',
        description: '7430 base Oblivion · 6 cards cooldown',
        baseOblivion: 7430,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'light'],
      },
      synergized: {
        id: 'inf-lucent-cataclysm-archon:synergized',
        label: 'Synergized',
        name: 'Lucent Cataclysm Angelic Verdict',
        description: '12631 base Oblivion · 7 cards cooldown · Requires Angel',
        baseOblivion: 12631,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'light'],
      },
    },
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 760, synergyRequirement: 'Light' },
    // Role: Halo execution bridge. Spends a high Halo threshold into burst,
    // then converts Cadence into a second Radiance spike and tutor.
    onPlayEffects: [
      { type: 'radiance_gain', value: 96 },
      { type: 'eternal_stack_gain', stack: 'light', value: 6 },
      { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'light', value: 9 }, then: [{ type: 'eternal_stack_spend', stack: 'light', value: 9 }, { type: 'oblivion_flat', value: 5200 }] },
      { type: 'radiance_gain', value: 96 },
      { type: 'conditional', condition: { type: 'light_resonance_gte', value: 6 }, then: [{ type: 'radiance_double' }, { type: 'oblivion_flat', value: 2600 }] },
      { type: 'search_deck_by_type', filter: ['Ophanim', 'Angel'] }],
  },
  {
    definitionId: 'inf-brass-eidolon-prime',
    type: 'Seraphim',
    element: 'Mechanical',
    rarity: 'Infinite',
    name: 'Brass Eidolon Prime',
    description: 'On play: Gain 12 Strain; Gain 4 Reactor Cores; If you have 7+ Reactor Cores, Spend 7 Reactor Cores; Gain Oblivion scaled by Reactor Cores and Strain; Gain 3 Reactor Cores; Gain Oblivion scaled by Reactor Cores and Strain. While on board: +1200 Oblivion whenever you play an Ophanim while active',
    artKey: 'inf_brass_eidolon_prime',
    attacks: {
      unsynergized: {
        id: 'inf-brass-eidolon-prime:unsynergized',
        label: 'Unsynergized',
        name: 'Brass Eidolon Vector Break',
        description: '6910 base Oblivion · 6 cards cooldown',
        baseOblivion: 6910,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'mechanical'],
      },
      synergized: {
        id: 'inf-brass-eidolon-prime:synergized',
        label: 'Synergized',
        name: 'Brass Eidolon Angelic Verdict',
        description: '12990 base Oblivion · 7 cards cooldown · Requires Angel',
        baseOblivion: 12990,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'mechanical'],
      },
    },
    baseStats: { bonusType: 'ophanim_bonus', bonusValue: 1200, synergyRequirement: 'Mechanical' },
    // Role: CORE RELAY SERAPH. Converts a 7-Core checkpoint into burst, then
    // immediately re-seeds Core count so Angel payoffs stay online.
    onPlayEffects: [
      { type: 'strain_gain', value: 12 },
      { type: 'eternal_stack_gain', stack: 'mech', value: 4 },
      { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'mech', value: 7 }, then: [{ type: 'eternal_stack_spend', stack: 'mech', value: 7 }, { type: 'oblivion_flat', value: 3600 }, { type: 'eternal_stack_gain', stack: 'mech', value: 3 }] },
      { type: 'oblivion_flat', value: 2100 }],
  }];

// Cherubim (3)

export const infiniteCherubimCards: CherubimDefinition[] = [
  {
    definitionId: 'inf-entropic-crown',
      type: 'Cherubim',
    element: 'Neutrality',
    rarity: 'Infinite',
    name: 'Entropic Crown',
      description: 'On play: Gain Oblivion scaled by Patience-bearing units and total Patience. While on board: Adjacent Seraphim and Angels gain +6 Patience per card played',
    artKey: 'inf_entropic_crown',
      effects: [{ type: 'cherubim_patience_per_card', value: 6 }],
      onPlayEffects: [{ type: 'oblivion_flat', value: 2600 }, { type: 'patience_gain_all', value: 6 }, { type: 'neutrality_patient_light_gain', value: 1 }],
  },
  {
    definitionId: 'inf-annihilation-field',
      type: 'Cherubim',
    element: 'Neutrality',
    rarity: 'Infinite',
    name: 'Annihilation Field',
      description: 'On play: All Seraphim on board gain +10 Patience. While on board: Adjacent Seraphim and Angels gain +5 Patience per card played',
    artKey: 'inf_annihilation_field',
      effects: [{ type: 'cherubim_patience_per_card', value: 5 }],
      onPlayEffects: [{ type: 'patience_gain_all', value: 10 }, { type: 'neutrality_patient_light_gain', value: 2 }],
  },
  {
    definitionId: 'inf-pyroclasm-engine',
      type: 'Cherubim',
    element: 'Fire',
    rarity: 'Infinite',
    name: 'Pyroclasm Engine',
      description: 'On play: Gain 4 Furnace Heat; Gain 8 Chroma Embers; Salvage any 1 card; If you have 5+ Furnace Heat, Gain 3 Chroma Embers; Draw 1 card; Gain Oblivion scaled by Furnace Heat tiers, Chroma Embers, and Heat-Ember balance; If you have 9+ Chroma Embers, Spend 3 Chroma Embers; Gain Oblivion scaled by Furnace Heat tiers, Chroma Embers, and Heat-Ember balance. While on board: Adjacent active Seraphim gain +235 Oblivion per card played',
    artKey: 'inf_pyroclasm_engine',
      effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 235 }],
    // Role: reserve accumulator. Builds the largest non-angel Chroma pool and
    // trades a small slice of that reserve for immediate side-value.
      onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'pyro', value: 4 }, { type: 'set_secondary_gain', kind: 'pyro', value: 8 }, { type: 'salvage_any' }, { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'pyro', value: 5 }, then: [{ type: 'set_secondary_gain', kind: 'pyro', value: 3 }, { type: 'draw', value: 1 }, { type: 'oblivion_flat', value: 1700 }] }, { type: 'conditional', condition: { type: 'set_secondary_gte', kind: 'pyro', value: 9 }, then: [{ type: 'set_secondary_spend', kind: 'pyro', value: 3 }, { type: 'oblivion_flat', value: 1800 }] }],
  },
  {
    definitionId: 'inf-prismatic-collapse-lattice',
      type: 'Cherubim',
    element: 'Prismatic',
    rarity: 'Infinite',
    name: 'Prismatic Collapse Lattice',
      description: 'On play: Gain 5 Resonance Charge; If Refraction Depth is 4+, Gain 2 Resonance Charge; Salvage any 1 card; If you have 7+ Resonance Charge, Spend 7 Resonance Charge; +4200 Oblivion. While on board: Adjacent active Seraphim gain +220 Oblivion per card played',
    artKey: 'inf_prismatic_collapse_lattice',
      effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 220 }],
      onPlayEffects: [
        { type: 'resonance_charge_gain', value: 5 },
        { type: 'conditional', condition: { type: 'prismatic_refraction_depth_gte', value: 4 }, then: [{ type: 'resonance_charge_gain', value: 2 }] },
        { type: 'salvage_any' },
        { type: 'conditional', condition: { type: 'resonance_charge_gte', value: 7 }, then: [{ type: 'resonance_charge_spend', value: 7 }, { type: 'oblivion_flat', value: 4200 }] },
      ],
  },
  {
    definitionId: 'inf-gravebloom-singularity',
      type: 'Cherubim',
    element: 'Thornbound',
    rarity: 'Infinite',
    name: 'Gravebloom Singularity',
      description: 'On play: Gain 96 Trail; Gain 9 Briar Spirals; Salvage any 1 card; If you have 120+ Trail, Spend 40 Trail; Gain 3 Briar Spirals; Draw 1 card; Gain Oblivion scaled by Scar, Trail, and Briar Spirals. While on board: Adjacent active Seraphim gain +280 Oblivion per card played',
    artKey: 'inf_gravebloom_singularity',
      effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 280 }],
        // Role: BACK-ROW SPIRAL FORGE. Mints a massive Spiral reserve and reinvests
        // Trail into even more Spirals for allied bloom cards.
        onPlayEffects: [{ type: 'trail_gain', value: 96 }, { type: 'set_secondary_gain', kind: 'thorn', value: 9 }, { type: 'salvage_any' }, { type: 'conditional', condition: { type: 'trail_gte', value: 120 }, then: [{ type: 'trail_spend', value: 40 }, { type: 'set_secondary_gain', kind: 'thorn', value: 3 }, { type: 'draw', value: 1 }, { type: 'oblivion_flat', value: 1800 }] }],
  },
  {
    definitionId: 'inf-heliarch-eclipse-engine',
      type: 'Cherubim',
    element: 'Light',
    rarity: 'Infinite',
    name: 'Heliarch Eclipse Engine',
      description: 'On play: Gain 112 Radiance; Gain 7 Halo; Double current Radiance; If you have 7+ Cadence, Gain Oblivion scaled by Radiance, Halo, and active Seraphim; If you have 12+ Halo, Spend 6 Halo; Gain Oblivion scaled by Radiance, Halo, and active Seraphim; Salvage 1 card matching Seraphim; Gain Oblivion scaled by Radiance, Halo, and active Seraphim. While on board: Adjacent active Seraphim gain +320 Oblivion per card played',
    artKey: 'inf_heliarch_eclipse_engine',
      effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 320 }],
      // Role: Back-row Halo forge. Mints a large Halo reserve, amplifies Radiance,
      // and converts excess Halo into a selective support burst.
      onPlayEffects: [{ type: 'radiance_gain', value: 112 }, { type: 'eternal_stack_gain', stack: 'light', value: 7 }, { type: 'radiance_double' }, { type: 'conditional', condition: { type: 'light_resonance_gte', value: 7 }, then: [{ type: 'oblivion_flat', value: 3600 }] }, { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'light', value: 12 }, then: [{ type: 'eternal_stack_spend', stack: 'light', value: 6 }, { type: 'oblivion_flat', value: 3400 }, { type: 'salvage_by_type', filter: ['Seraphim'] }] }, { type: 'oblivion_flat', value: 2400 }],
  },
  {
    definitionId: 'inf-mech-entropy-foundry',
      type: 'Cherubim',
    element: 'Mechanical',
    rarity: 'Infinite',
    name: 'Mech Entropy Foundry',
      description: 'On play: Gain 14 Strain; Gain 6 Reactor Cores; Vent 9999 Strain; If you have 8+ Reactor Cores, Cash out all Reactor Cores (+820 Oblivion per stack); Gain Oblivion scaled by Reactor Cores and Strain. While on board: Adjacent active Seraphim gain +260 Oblivion per card played',
    artKey: 'inf_mech_entropy_foundry',
      effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 260 }],
      // Role: BACK-ROW CORE CONDENSER. Pushes strain-to-zero for tempo reset,
      // then turns a high Core threshold into a heavier cashout line.
      onPlayEffects: [{ type: 'strain_gain', value: 14 }, { type: 'eternal_stack_gain', stack: 'mech', value: 6 }, { type: 'strain_vent', value: 9999 }, { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'mech', value: 8 }, then: [{ type: 'eternal_stack_cashout', stack: 'mech', oblivionPerStack: 820 }, { type: 'oblivion_flat', value: 2800 }] }],
  }];

// Angels (3)

export const infiniteAngelCards: AngelDefinition[] = [
  {
    definitionId: 'inf-sovereign-void',
    type: 'Angel',
    element: 'Neutrality',
    rarity: 'Infinite',
    name: 'Sovereign Void',
    description: 'On summon: All Seraphim on board gain +20 Patience; Gain Oblivion scaled by total Patience and peak Patience. After 4 cards played: Grant 3 Patient Light stacks (boosts card-play Patience gain with diminishing returns at high stacks); Double all Patience on the board; All Seraphim on board gain +10 Patience; Gain Oblivion scaled by total Patience and peak Patience. While on board: +420 Oblivion per card played while on board. Patience: accumulates +1 stack per card played (boosted by Patient Light and adjacent Cherubim); on attack, each stack → +2% base Oblivion (stacks then reset)',
    artKey: 'inf_sovereign_void',
    summonCost: [],
    extraSummonConditions: [
      { type: 'seraphim_on_board_gte', value: 3 }],
    onSummonEffects: [
      { type: 'patience_gain_all', value: 24 }],
    activatedAbility: {
      name: 'Null Dominion',
      cardsPlayedRequirement: 4,
      description: 'Grant 3 Patient Light stacks (boosts card-play Patience gain with diminishing returns at high stacks); Double all Patience on the board; All Seraphim on board gain +10 Patience; Gain Oblivion scaled by total Patience and peak Patience',
      effects: [
        { type: 'neutrality_patient_light_gain', value: 3 },
        { type: 'patience_double_all' },
        { type: 'patience_gain_all', value: 10 },
        { type: 'oblivion_flat', value: 2800 }],
    },
    attacks: {
      primary: {
        id: 'inf-sovereign-void:primary',
        label: 'Primary',
        name: 'Sovereign Void Ordinance',
        description: '3017 base Oblivion · 6 cards cooldown',
        baseOblivion: 3017,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'neutrality'],
      },
      exalted: {
        id: 'inf-sovereign-void:exalted',
        label: 'Exalted',
        name: 'Sovereign Void Throne Decree',
        description: '8299 base Oblivion · 9 cards cooldown',
        baseOblivion: 8299,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'neutrality'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 420 },
  },
  {
    definitionId: 'inf-eternity-rupture',
    type: 'Angel',
    element: 'Neutrality',
    rarity: 'Infinite',
    name: 'Eternity Rupture',
    description: 'On summon: All Seraphim on board gain +16 Patience; Grant 2 Patient Light stacks (boosts card-play Patience gain with diminishing returns at high stacks); Shuffle discard into deck. After 5 cards played: Grant 1 Patient Light stack (boosts card-play Patience gain with diminishing returns at high stacks); All Seraphim on board gain +8 Patience; Gain Oblivion scaled by Patience-bearing units, conversion sources, and peak Patience. While on board: +750 Oblivion per card played while on board. Patience: accumulates +1 stack per card played (boosted by Patient Light and adjacent Cherubim); on attack, each stack → +2% base Oblivion (stacks then reset)',
    artKey: 'inf_eternity_rupture',
    summonCost: [],
    extraSummonConditions: [
      { type: 'seraphim_on_board_gte', value: 2 },
      { type: 'cherubim_active_gte', value: 2 }],
    onSummonEffects: [
      { type: 'patience_gain_all', value: 16 },
      { type: 'neutrality_patient_light_gain', value: 2 },
      { type: 'shuffle_discard' },
      { type: 'oblivion_flat', value: 1800 }],
    activatedAbility: {
      name: 'Rupture Convergence',
      cardsPlayedRequirement: 5,
      description: 'Grant 1 Patient Light stack (boosts card-play Patience gain with diminishing returns at high stacks); All Seraphim on board gain +8 Patience; Gain Oblivion scaled by Patience-bearing units, conversion sources, and peak Patience',
      effects: [
        { type: 'neutrality_patient_light_gain', value: 3 },
        { type: 'patience_gain_all', value: 8 },
        { type: 'oblivion_flat', value: 2600 }],
    },
    attacks: {
      primary: {
        id: 'inf-eternity-rupture:primary',
        label: 'Primary',
        name: 'Eternity Rupture Ordinance',
        description: '3169 base Oblivion · 6 cards cooldown',
        baseOblivion: 3169,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'neutrality'],
      },
      exalted: {
        id: 'inf-eternity-rupture:exalted',
        label: 'Exalted',
        name: 'Eternity Rupture Throne Decree',
        description: '8717 base Oblivion · 9 cards cooldown',
        baseOblivion: 8717,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'neutrality'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 500 },
  },
  {
    definitionId: 'inf-riftborn-sovereign',
    type: 'Angel',
    element: 'Fire',
    rarity: 'Infinite',
    name: 'Riftborn Sovereign',
    description: 'On summon: Gain 7 Furnace Heat; Gain 5 Chroma Embers; Gain Oblivion scaled by Furnace Heat tiers, Chroma Embers, and Heat spent this play. After 5 cards played: If you have 9+ Furnace Heat, Cash out up to 9 Furnace Heat (+1000 Oblivion per stack); Gain Oblivion scaled by Furnace Heat tiers, Chroma Embers, and Heat spent this play; If you have 8+ Chroma Embers, Ignite up to 8 Chroma Embers (+118 Oblivion × echoes²); Spend all Chroma Embers; Gain Oblivion scaled by Furnace Heat tiers, Chroma Embers, and Heat spent this play; Search your deck for 1 matching Ophanim or Cherubim. While on board: +400 Oblivion per card played while on board',
    artKey: 'inf_riftborn_sovereign',
    summonCost: [],
    extraSummonConditions: [
      { type: 'cherubim_active_gte', value: 1 }],
    onSummonEffects: [
      { type: 'eternal_stack_gain', stack: 'pyro', value: 7 },
      { type: 'set_secondary_gain', kind: 'pyro', value: 5 },
      { type: 'oblivion_flat', value: 1800 }],
    activatedAbility: {
      name: 'Rift Conflagration',
      cardsPlayedRequirement: 5,
      description: 'If you have 9+ Furnace Heat, Cash out up to 9 Furnace Heat (+1000 Oblivion per stack); Gain Oblivion scaled by Furnace Heat tiers, Chroma Embers, and Heat spent this play; If you have 8+ Chroma Embers, Ignite up to 8 Chroma Embers (+118 Oblivion × echoes²); Spend all Chroma Embers; Gain Oblivion scaled by Furnace Heat tiers, Chroma Embers, and Heat spent this play; Search your deck for 1 matching Ophanim or Cherubim',
      effects: [
        { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'pyro', value: 9 }, then: [{ type: 'eternal_stack_cashout', stack: 'pyro', oblivionPerStack: 1000, consume: 9 }, { type: 'oblivion_flat', value: 4800 }] },
        { type: 'conditional', condition: { type: 'set_secondary_gte', kind: 'pyro', value: 8 }, then: [{ type: 'pyro_cinder_echo_ignite', oblivionPerEchoSquared: 118, consume: 8 }] },
        { type: 'set_secondary_spend', kind: 'pyro', value: 9999 },
        { type: 'oblivion_flat', value: 1600 },
        { type: 'search_deck_by_type', filter: ['Ophanim', 'Cherubim'] }],
    },
    attacks: {
      primary: {
        id: 'inf-riftborn-sovereign:primary',
        label: 'Primary',
        name: 'Riftborn Sovereign Ordinance',
        description: '2865 base Oblivion · 6 cards cooldown · +3% attack per Heat (max +75%) · +5% attack per Chroma Ember (max +25%, consumed on Infinite Fire attack)',
        baseOblivion: 2865,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'fire'],
      },
      exalted: {
        id: 'inf-riftborn-sovereign:exalted',
        label: 'Exalted',
        name: 'Riftborn Sovereign Throne Decree',
        description: '7881 base Oblivion · 9 cards cooldown · +3% attack per Heat (max +75%) · +5% attack per Chroma Ember (max +25%, consumed on Infinite Fire attack)',
        baseOblivion: 7881,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'fire'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 400 },
  },
  {
    definitionId: 'inf-prismatic-judgement-array',
    type: 'Angel',
    element: 'Prismatic',
    rarity: 'Infinite',
    name: 'Prismatic Judgement Array',
    description: 'On summon: Gain 8 Resonance Charge; Search your deck for 1 matching Ophanim or Cherubim. After 4 cards played: If you have 8+ Resonance Charge, Spend 8 Resonance Charge; +5200 Oblivion; If Refraction Depth is 5+, +2600 Oblivion; If you have played 5+ distinct channels this turn, Draw 2 cards; Search your deck for 1 matching Ophanim or Cherubim; +1400 Oblivion. While on board: +470 Oblivion per card played while on board',
    artKey: 'inf_prismatic_judgement_array',
    summonCost: [],
    extraSummonConditions: [
      { type: 'seraphim_on_board_gte', value: 2 },
      { type: 'cherubim_active_gte', value: 1 }],
    onSummonEffects: [
      { type: 'resonance_charge_gain', value: 8 },
      { type: 'search_deck_by_type', filter: ['Ophanim', 'Cherubim'] }],
    activatedAbility: {
      name: 'Spectrum Verdict',
      cardsPlayedRequirement: 4,
      description: 'If you have 8+ Resonance Charge, Spend 8 Resonance Charge; +5200 Oblivion; If Refraction Depth is 5+, +2600 Oblivion; If you have played 5+ distinct channels this turn, Draw 2 cards; Search your deck for 1 matching Ophanim or Cherubim; +1400 Oblivion',
      effects: [
        {
          type: 'conditional',
          condition: { type: 'resonance_charge_gte', value: 8 },
          then: [
            { type: 'resonance_charge_spend', value: 8 },
            { type: 'oblivion_flat', value: 5200 },
            { type: 'conditional', condition: { type: 'prismatic_refraction_depth_gte', value: 5 }, then: [{ type: 'oblivion_flat', value: 2600 }] },
            { type: 'conditional', condition: { type: 'prismatic_distinct_channels_gte', value: 5 }, then: [{ type: 'draw', value: 2 }] },
            { type: 'search_deck_by_type', filter: ['Ophanim', 'Cherubim'] },
            { type: 'oblivion_flat', value: 1400 },
          ],
        },
      ],
    },
    attacks: {
      primary: {
        id: 'inf-prismatic-judgement-array:primary',
        label: 'Primary',
        name: 'Prismatic Judgement Ordinance',
        description: '2972 base Oblivion · 6 cards cooldown',
        baseOblivion: 2972,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'prismatic'],
      },
      exalted: {
        id: 'inf-prismatic-judgement-array:exalted',
        label: 'Exalted',
        name: 'Prismatic Judgement Throne Decree',
        description: '8174 base Oblivion · 9 cards cooldown',
        baseOblivion: 8174,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'prismatic'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 470 },
  },
  {
    definitionId: 'inf-thornbound-elegy-titan',
    type: 'Angel',
    element: 'Thornbound',
    rarity: 'Infinite',
    name: 'Thornbound Elegy Titan',
    description: 'On summon: Gain 124 Trail; Gain 12 Briar Spirals; Gain +130% total Oblivion this turn. After 5 cards played: Spend 90 Trail; If you have 8+ Briar Spirals, Spend 4 Briar Spirals; Gain Oblivion scaled by Scar, Trail, Briar Spirals, and March readiness; Bloom all Briar Spirals (+56 Trail per spiral); Spend all Briar Spirals; Salvage any 1 card; Gain 16 Trail; Gain Oblivion scaled by Scar, Trail, Briar Spirals, and March readiness; If you have 120+ Trail, Gain Oblivion scaled by Scar, Trail, Briar Spirals, and March readiness; Draw 2 cards. While on board: +520 Oblivion per card played while on board',
    artKey: 'inf_thornbound_elegy_titan',
    summonCost: [],
    extraSummonConditions: [
      { type: 'seraphim_on_board_gte', value: 2 }],
    onSummonEffects: [
      { type: 'trail_gain', value: 124 },
      { type: 'set_secondary_gain', kind: 'thorn', value: 12 },
      { type: 'score_multiplier', value: 130 }],
    activatedAbility: {
      name: 'Funeral Surge',
      cardsPlayedRequirement: 5,
      description: 'Spend 90 Trail; If you have 8+ Briar Spirals, Spend 4 Briar Spirals; Gain Oblivion scaled by Scar, Trail, Briar Spirals, and March readiness; Bloom all Briar Spirals (+56 Trail per spiral); Spend all Briar Spirals; Salvage any 1 card; Gain 16 Trail; Gain Oblivion scaled by Scar, Trail, Briar Spirals, and March readiness; If you have 120+ Trail, Gain Oblivion scaled by Scar, Trail, Briar Spirals, and March readiness; Draw 2 cards',
      // Role: CATASTROPHIC FINISHER. Performs the largest all-in conversion:
      // spiral spend checkpoint, full bloom, spiral collapse, then final cashout.
      effects: [
        { type: 'trail_spend', value: 90 },
        { type: 'conditional', condition: { type: 'set_secondary_gte', kind: 'thorn', value: 8 }, then: [{ type: 'set_secondary_spend', kind: 'thorn', value: 4 }, { type: 'oblivion_flat', value: 4200 }] },
        { type: 'thorn_briar_spiral_bloom', trailPerSpiral: 56, oblivionPerTrail: 18 },
        { type: 'set_secondary_spend', kind: 'thorn', value: 9999 },
        { type: 'salvage_any' },
        { type: 'trail_gain', value: 16 },
        { type: 'oblivion_flat', value: 3600 },
        { type: 'conditional', condition: { type: 'trail_gte', value: 120 }, then: [{ type: 'oblivion_flat', value: 3200 }, { type: 'draw', value: 2 }] }],
    },
    attacks: {
      primary: {
        id: 'inf-thornbound-elegy-titan:primary',
        label: 'Primary',
        name: 'Thornbound Elegy Ordinance',
        description: '3048 base Oblivion · 6 cards cooldown',
        baseOblivion: 3048,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'thornbound'],
      },
      exalted: {
        id: 'inf-thornbound-elegy-titan:exalted',
        label: 'Exalted',
        name: 'Thornbound Elegy Throne Decree',
        description: '8383 base Oblivion · 9 cards cooldown',
        baseOblivion: 8383,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'thornbound'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 520 },
  },
  {
    definitionId: 'inf-mechanical-apotheosis-core',
    type: 'Angel',
    element: 'Mechanical',
    rarity: 'Infinite',
    name: 'Mechanical Apotheosis Core',
    description: 'On summon: Gain 18 Strain; Gain 6 Reactor Cores; Gain Oblivion scaled by Reactor Cores and Strain. After 4 cards played: Vent 9999 Strain; If you have 10+ Reactor Cores, Spend 10 Reactor Cores; Gain Oblivion scaled by Reactor Cores and Strain; Cash out all Reactor Cores (+900 Oblivion per stack); Gain 12 Strain. While on board: +560 Oblivion per card played while on board',
    artKey: 'inf_mechanical_apotheosis_core',
    summonCost: [],
    extraSummonConditions: [
      { type: 'seraphim_on_board_gte', value: 2 },
      { type: 'cherubim_active_gte', value: 1 }],
    onSummonEffects: [
      { type: 'strain_gain', value: 18 },
      { type: 'eternal_stack_gain', stack: 'mech', value: 6 },
      { type: 'oblivion_flat', value: 2400 }],
    activatedAbility: {
      name: 'Core Singularity',
      cardsPlayedRequirement: 4,
      description: 'Vent 9999 Strain; If you have 10+ Reactor Cores, Spend 10 Reactor Cores; Gain Oblivion scaled by Reactor Cores and Strain; Cash out all Reactor Cores (+900 Oblivion per stack); Gain 12 Strain',
      // Role: APEX CORE JUDGMENT. First detonates a fixed 10-Core checkpoint,
      // then cashes all remaining cores for a two-stage Infinite finisher.
      effects: [
        { type: 'strain_vent', value: 9999 },
        { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'mech', value: 10 }, then: [{ type: 'eternal_stack_spend', stack: 'mech', value: 10 }, { type: 'oblivion_flat', value: 6500 }] },
        { type: 'eternal_stack_cashout', stack: 'mech', oblivionPerStack: 900 },
        { type: 'strain_gain', value: 12 }],
    },
    attacks: {
      primary: {
        id: 'inf-mechanical-apotheosis-core:primary',
        label: 'Primary',
        name: 'Mechanical Apotheosis Ordinance',
        description: '3108 base Oblivion · 6 cards cooldown',
        baseOblivion: 3108,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'mechanical'],
      },
      exalted: {
        id: 'inf-mechanical-apotheosis-core:exalted',
        label: 'Exalted',
        name: 'Mechanical Apotheosis Throne Decree',
        description: '8550 base Oblivion · 9 cards cooldown',
        baseOblivion: 8550,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'mechanical'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 560 },
  }];

export const blackGlassInfernoInfiniteOphanims: OphanimDefinition[] = [
  {
    definitionId: 'inf-bgi-sorveths-final-breath',
    type: 'Ophanim',
    element: 'Dark',
    rarity: 'Infinite',
    name: "Sorveth's Final Breath",
    description: 'Gain 18 Black Flame; Gain 6 Fracture; Gain 7 Eclipse; Gain 20 Monochromatic Shards; Salvage any 1 card; If Fracture is 10+, Burst all Eclipse (+390 Oblivion per Eclipse); +22 per Eclipse per balance tier; +36 per Eclipse per Fracture; +3400 Oblivion',
    artKey: 'inf_bgi_sorveths_final_breath',
    // Role: FRACTURE-GATED INFINITE DETONATOR. Stores a large Eclipse payload,
    // then cashes everything only when fracture reaches a hard threshold.
    effects: [
      { type: 'black_glass_black_flame_gain', value: 18 },
      { type: 'black_glass_fracture_gain', value: 6 },
      { type: 'eternal_stack_gain', stack: 'glass', value: 7 },
      { type: 'monochromatic_shards_gain', value: 20 },
      { type: 'salvage_any' },
      { type: 'conditional', condition: { type: 'black_glass_fracture_gte', value: 10 }, then: [{ type: 'black_glass_eclipse_burst', oblivionPerEclipse: 390, balanceBonusPerEclipse: 22, fractureBonusPerEclipse: 36 }, { type: 'oblivion_flat', value: 3400 }] }],
  },
  {
    definitionId: 'inf-bgi-chromatic-ruin-deluge',
    type: 'Ophanim',
    element: 'Dark',
    rarity: 'Infinite',
    name: 'Chromatic Ruin Deluge',
    description: 'Gain 15 White Flame; Gain 15 Black Flame; Gain 6 Eclipse; Gain 22 Monochromatic Shards; Look at the top 10 cards, take 3 cards, put 2 cards on the bottom, and discard the rest; If White Flame equals Black Flame, Spend 6 Eclipse; Burst up to 6 Eclipse (+335 Oblivion per Eclipse); +95 per Eclipse per balance tier; +3000 Oblivion; +2900 Oblivion',
    artKey: 'inf_bgi_chromatic_ruin_deluge',
    // Role: BALANCED-CHECKPOINT CONVERTER. Exact flame symmetry unlocks a
    // deterministic 6-Eclipse burst with the strongest balance scaling.
    effects: [
      { type: 'black_glass_white_flame_gain', value: 15 },
      { type: 'black_glass_black_flame_gain', value: 15 },
      { type: 'eternal_stack_gain', stack: 'glass', value: 6 },
      { type: 'monochromatic_shards_gain', value: 22 },
      { type: 'look_top_take_drop', look: 10, take: 3, drop: 2 },
      { type: 'conditional', condition: { type: 'black_glass_flames_equal' }, then: [{ type: 'eternal_stack_spend', stack: 'glass', value: 6 }, { type: 'black_glass_eclipse_burst', consume: 6, oblivionPerEclipse: 335, balanceBonusPerEclipse: 95 }, { type: 'oblivion_flat', value: 3000 }, { type: 'oblivion_flat', value: 2900 }] }],
  }];

export const blackGlassInfernoInfiniteSeraphims: SeraphimDefinition[] = [
  {
    definitionId: 'inf-bgi-obsidian-covenant-colossus',
    type: 'Seraphim',
    element: 'Dark',
    rarity: 'Infinite',
    name: 'Obsidian Covenant Colossus',
    description: 'On play: Gain 14 Black Flame; Gain 5 Fracture; Gain 5 Eclipse; Gain 15 Monochromatic Shards; Salvage any 1 card; If you have 6+ Eclipse, Burst up to 6 Eclipse (+320 Oblivion per Eclipse); +20 per Eclipse per balance tier; +26 per Eclipse per Fracture; If you have 20+ Black Flame, Burst all Eclipse (+240 Oblivion per Eclipse); +1900 Oblivion. While on board: +900 Oblivion whenever you play an Ophanim while active',
    artKey: 'inf_bgi_obsidian_covenant_colossus',
    attacks: {
      unsynergized: {
        id: 'inf-bgi-obsidian-covenant-colossus:unsynergized',
        label: 'Unsynergized',
        name: 'Obsidian Covenant Vector Break',
        description: '6265 base Oblivion · 6 cards cooldown',
        baseOblivion: 6265,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'dark'],
      },
      synergized: {
        id: 'inf-bgi-obsidian-covenant-colossus:synergized',
        label: 'Synergized',
        name: 'Obsidian Covenant Angelic Verdict',
        description: '10651 base Oblivion · 7 cards cooldown · Requires Angel',
        baseOblivion: 10651,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'dark'],
      },
    },
    baseStats: { bonusType: 'ophanim_bonus', bonusValue: 900, synergyRequirement: 'Dark' },
    // Role: BLACK-FLAME TWO-STAGE DETONATOR. Converts a 6-stack checkpoint,
    // then uses high Black Flame as a second-stage Eclipse sweep trigger.
    onPlayEffects: [
      { type: 'black_glass_black_flame_gain', value: 14 },
      { type: 'black_glass_fracture_gain', value: 5 },
      { type: 'eternal_stack_gain', stack: 'glass', value: 5 },
      { type: 'monochromatic_shards_gain', value: 15 },
      { type: 'salvage_any' },
      { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'glass', value: 6 }, then: [{ type: 'black_glass_eclipse_burst', consume: 6, oblivionPerEclipse: 320, balanceBonusPerEclipse: 20, fractureBonusPerEclipse: 26 }] },
      { type: 'conditional', condition: { type: 'black_glass_black_flame_gte', value: 20 }, then: [{ type: 'black_glass_eclipse_burst', oblivionPerEclipse: 240 }, { type: 'oblivion_flat', value: 1900 }] }],
  },
  {
    definitionId: 'inf-bgi-glassrose-leviathan',
    type: 'Seraphim',
    element: 'Dark',
    rarity: 'Infinite',
    name: 'Glassrose Leviathan',
    description: 'On play: Gain 14 White Flame; Gain 4 Fracture; Gain 4 Eclipse; Gain 15 Monochromatic Shards; Salvage any 1 card; If you have 5+ Eclipse, Spend 5 Eclipse; Burst up to 5 Eclipse (+350 Oblivion per Eclipse); +105 per Eclipse per balance tier; +1800 Oblivion. While on board: +780 Oblivion per card played while active',
    artKey: 'inf_bgi_glassrose_leviathan',
    attacks: {
      unsynergized: {
        id: 'inf-bgi-glassrose-leviathan:unsynergized',
        label: 'Unsynergized',
        name: 'Glassrose Leviathan Vector Break',
        description: '7690 base Oblivion · 6 cards cooldown',
        baseOblivion: 7690,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'dark'],
      },
      synergized: {
        id: 'inf-bgi-glassrose-leviathan:synergized',
        label: 'Synergized',
        name: 'Glassrose Leviathan Angelic Verdict',
        description: '13073 base Oblivion · 7 cards cooldown · Requires Angel',
        baseOblivion: 13073,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'dark'],
      },
    },
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 780, synergyRequirement: 'Dark' },
    // Role: PRECISION WHITE-SIDE STRIKER. Tight 5-stack spend profile with
    // elite balance scaling and double-multiply tempo pressure.
    onPlayEffects: [
      { type: 'black_glass_white_flame_gain', value: 14 },
      { type: 'black_glass_fracture_gain', value: 4 },
      { type: 'eternal_stack_gain', stack: 'glass', value: 4 },
      { type: 'monochromatic_shards_gain', value: 15 },
      { type: 'salvage_any' },
      { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'glass', value: 5 }, then: [{ type: 'eternal_stack_spend', stack: 'glass', value: 5 }, { type: 'black_glass_eclipse_burst', consume: 5, oblivionPerEclipse: 350, balanceBonusPerEclipse: 105 }, { type: 'oblivion_flat', value: 1800 }] }],
  }];

export const blackGlassInfernoInfiniteCherubim: CherubimDefinition[] = [
  {
    definitionId: 'inf-bgi-inferno-of-two-truths',
      type: 'Cherubim',
    element: 'Dark',
    rarity: 'Infinite',
    name: 'Inferno of Two Truths',
      description: 'On play: Gain 10 White Flame; Gain 10 Black Flame; Gain 5 Eclipse; Gain 12 Monochromatic Shards; Salvage any 1 card; Burst all Eclipse (+280 Oblivion per Eclipse); +70 per Eclipse per balance tier; +2200 Oblivion; If White Flame equals Black Flame, +2400 Oblivion. While on board: Adjacent active Seraphim gain +300 Oblivion per card played',
    artKey: 'inf_bgi_inferno_of_two_truths',
      effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 300 }],
      // Role: BOARD-AURA EQUALIZER CHERUBIM. Immediate full burst at moderate
      // scaling, then rewards exact symmetry with a large flat kicker.
      onPlayEffects: [{ type: 'black_glass_white_flame_gain', value: 10 }, { type: 'black_glass_black_flame_gain', value: 10 }, { type: 'eternal_stack_gain', stack: 'glass', value: 5 }, { type: 'monochromatic_shards_gain', value: 12 }, { type: 'salvage_any' }, { type: 'black_glass_eclipse_burst', oblivionPerEclipse: 280, balanceBonusPerEclipse: 70 }, { type: 'oblivion_flat', value: 2200 }, { type: 'conditional', condition: { type: 'black_glass_flames_equal' }, then: [{ type: 'oblivion_flat', value: 2400 }] }],
  },
  {
    definitionId: 'inf-bgi-ashen-cinder-cathedral',
      type: 'Cherubim',
    element: 'Dark',
    rarity: 'Infinite',
    name: 'Ashen Cinder Cathedral',
      description: 'On play: Gain 12 Black Flame; Gain 4 Fracture; Gain 4 Eclipse; Gain 24 Monochromatic Shards; Salvage any 1 card; If you have 6+ Eclipse, Burst all Eclipse (+330 Oblivion per Eclipse); +12 per Eclipse per balance tier; +40 per Eclipse per Fracture. While on board: Adjacent active Seraphim gain +240 Oblivion per card played',
    artKey: 'inf_bgi_ashen_cinder_cathedral',
      effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 240 }],
        // Role: FRACTURE-WEIGHTED CHERUBIM ENGINE. Backline support card that
        // turns high fracture setup into an Eclipse-wide payout breakpoint.
        onPlayEffects: [{ type: 'black_glass_black_flame_gain', value: 12 }, { type: 'black_glass_fracture_gain', value: 4 }, { type: 'eternal_stack_gain', stack: 'glass', value: 4 }, { type: 'monochromatic_shards_gain', value: 24 }, { type: 'salvage_any' }, { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'glass', value: 6 }, then: [{ type: 'black_glass_eclipse_burst', oblivionPerEclipse: 330, balanceBonusPerEclipse: 12, fractureBonusPerEclipse: 40 }] }],
  }];

export const blackGlassInfernoInfiniteAngels: AngelDefinition[] = [
  {
    definitionId: 'inf-bgi-vaelmor-umbra-sovereign',
    type: 'Angel',
    element: 'Dark',
    rarity: 'Infinite',
    name: 'Vaelmor, Umbra Sovereign',
    description: 'On summon: Gain 14 White Flame; Gain 14 Black Flame; Gain 4 Fracture; Gain 6 Eclipse; Gain 18 Monochromatic Shards; Salvage any 1 card; +2500 Oblivion. After 4 cards played: Swap White Flame and Black Flame; Fracture collapses by 0.5; Burst all Eclipse (+360 Oblivion per Eclipse); +85 per Eclipse per balance tier; +22 per Eclipse per Fracture; +3800 Oblivion; Gain 15 Monochromatic Shards. While on board: +640 Oblivion per card played while on board',
    artKey: 'inf_bgi_vaelmor_umbra_sovereign',
    summonCost: [],
    extraSummonConditions: [
      { type: 'seraphim_on_board_gte', value: 3 },
      { type: 'cherubim_active_gte', value: 1 }],
    onSummonEffects: [
      { type: 'black_glass_white_flame_gain', value: 14 },
      { type: 'black_glass_black_flame_gain', value: 14 },
      { type: 'black_glass_fracture_gain', value: 4 },
      { type: 'eternal_stack_gain', stack: 'glass', value: 6 },
      { type: 'monochromatic_shards_gain', value: 18 },
      { type: 'salvage_any' },
      { type: 'oblivion_flat', value: 2500 }],
    activatedAbility: {
      name: 'Sovereign Scission',
      cardsPlayedRequirement: 4,
      description: 'Swap White Flame and Black Flame; Fracture collapses by 0.5; Burst all Eclipse (+360 Oblivion per Eclipse); +85 per Eclipse per balance tier; +22 per Eclipse per Fracture; +3800 Oblivion; Gain 15 Monochromatic Shards',
      // Role: APEX SWAP-AND-BURST ANGEL. Uses the flame swap timing window to
      // maximize balance-tier value before detonating the full Eclipse reserve.
      effects: [
        { type: 'black_glass_flames_swap' },
        { type: 'black_glass_fracture_collapse', value: 0.5 },
        { type: 'black_glass_eclipse_burst', oblivionPerEclipse: 360, balanceBonusPerEclipse: 85, fractureBonusPerEclipse: 22 },
        { type: 'oblivion_flat', value: 3800 },
        { type: 'monochromatic_shards_gain', value: 15 }],
    },
    attacks: {
      primary: {
        id: 'inf-bgi-vaelmor-umbra-sovereign:primary',
        label: 'Primary',
        name: 'Vaelmor Umbra Ordinance',
        description: '3230 base Oblivion · 6 cards cooldown',
        baseOblivion: 3230,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'dark'],
      },
      exalted: {
        id: 'inf-bgi-vaelmor-umbra-sovereign:exalted',
        label: 'Exalted',
        name: 'Vaelmor Umbra Throne Decree',
        description: '8884 base Oblivion · 9 cards cooldown',
        baseOblivion: 8884,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'dark'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 640 },
  },
  {
    definitionId: 'inf-bgi-midplace-apocalypse',
    type: 'Angel',
    element: 'Dark',
    rarity: 'Infinite',
    name: 'Midplace Apocalypse',
    description: 'On summon: Gain 16 White Flame; Gain 16 Black Flame; Gain 5 Eclipse; Gain 18 Monochromatic Shards; Salvage any 1 card. After 5 cards played: Gain 8 Fracture; Fracture collapses by 0.5; Gain 4 Eclipse; Burst all Eclipse (+340 Oblivion per Eclipse); +45 per Eclipse per balance tier; +32 per Eclipse per Fracture; Salvage any 1 card; Gain 10 Monochromatic Shards; +3500 Oblivion; If Fracture is 14+, +2500 Oblivion. While on board: +620 Oblivion per card played while on board',
    artKey: 'inf_bgi_midplace_apocalypse',
    summonCost: [],
    extraSummonConditions: [
      { type: 'seraphim_on_board_gte', value: 2 },
      { type: 'cherubim_active_gte', value: 2 }],
    onSummonEffects: [
      { type: 'black_glass_white_flame_gain', value: 16 },
      { type: 'black_glass_black_flame_gain', value: 16 },
      { type: 'eternal_stack_gain', stack: 'glass', value: 5 },
      { type: 'monochromatic_shards_gain', value: 18 },
      { type: 'salvage_any' }],
    activatedAbility: {
      name: 'Plateau of Ruin',
      cardsPlayedRequirement: 5,
      description: 'Gain 8 Fracture; Fracture collapses by 0.5; Gain 4 Eclipse; Burst all Eclipse (+340 Oblivion per Eclipse); +45 per Eclipse per balance tier; +32 per Eclipse per Fracture; Salvage any 1 card; Gain 10 Monochromatic Shards; +3500 Oblivion; If Fracture is 14+, +2500 Oblivion',
      // Role: FRACTURE-LADDER APEX. Expands Eclipse stock at activation, then
      // detonates with mixed scaling and a high-fracture terminal kicker.
      effects: [
        { type: 'black_glass_fracture_gain', value: 8 },
        { type: 'black_glass_fracture_collapse', value: 0.5 },
        { type: 'eternal_stack_gain', stack: 'glass', value: 4 },
        { type: 'black_glass_eclipse_burst', oblivionPerEclipse: 340, balanceBonusPerEclipse: 45, fractureBonusPerEclipse: 32 },
        { type: 'salvage_any' },
        { type: 'monochromatic_shards_gain', value: 10 },
        { type: 'oblivion_flat', value: 3500 },
        { type: 'conditional', condition: { type: 'black_glass_fracture_gte', value: 14 }, then: [{ type: 'oblivion_flat', value: 2500 }] }],
    },
    attacks: {
      primary: {
        id: 'inf-bgi-midplace-apocalypse:primary',
        label: 'Primary',
        name: 'Midplace Apocalypse Ordinance',
        description: '3200 base Oblivion · 6 cards cooldown',
        baseOblivion: 3200,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'dark'],
      },
      exalted: {
        id: 'inf-bgi-midplace-apocalypse:exalted',
        label: 'Exalted',
        name: 'Midplace Apocalypse Throne Decree',
        description: '8801 base Oblivion · 9 cards cooldown',
        baseOblivion: 8801,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'dark'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 620 },
  },
  {
    definitionId: 'sv-infinite-polar-fission',
    type: 'Angel',
    element: 'Mechanical',
    rarity: 'Infinite',
    name: 'Polar Fission',
    description: 'On summon: Gain 15 Radiance; Gain 2 Strain; Gain 26 Arctic Charge; Gain 3 Polar Capacitors. After 6 cards played: Gain 10 Radiance; Vent 9999 Strain; Gain 10 Arctic Charge; +720 Oblivion; Discharge Arctic Charge; Release all Polar Capacitors (Voltage: +430 Oblivion per capacitor · Frost: +11 Arctic Charge per capacitor). While on board: +760 Oblivion per card played while on board',
    artKey: 'sv_infinite_polar_fission',
    summonCost: ['sv-ser-polar-circuit', 'sv-ser-icegrid'],
    extraSummonConditions: [{ type: 'seraphim_on_board_gte', value: 2 }, { type: 'cherubim_active_gte', value: 2 }],
    onSummonEffects: [{ type: 'radiance_gain', value: 15 }, { type: 'strain_gain', value: 2 }, { type: 'arctic_charge_gain', value: 26 }, { type: 'set_secondary_gain', kind: 'snow', value: 3 }],
    activatedAbility: {
      name: 'Fission Crown',
      cardsPlayedRequirement: 6,
      description: 'Gain 10 Radiance; Vent 9999 Strain; Gain 10 Arctic Charge; +720 Oblivion; Discharge Arctic Charge; Release all Polar Capacitors (Voltage: +430 Oblivion per capacitor · Frost: +11 Arctic Charge per capacitor)',
      // Role: APEX FROST FISSION. Seeds 3, then discharges every banked pulse ?
      // moderate-high coefficient, widest payout in the Infinite Angel band.
      effects: [{ type: 'strain_vent', value: 9999 }, { type: 'radiance_gain', value: 10 }, { type: 'arctic_charge_gain', value: 10 }, { type: 'oblivion_flat', value: 720 }, { type: 'arctic_charge_discharge' }, { type: 'snow_polar_capacitor_release', voltageOblivionPerCapacitor: 430, frostArcticChargePerCapacitor: 11 }],
    },
    attacks: {
      primary: {
        id: 'sv-infinite-polar-fission:primary',
        label: 'Primary',
        name: 'Polar Fission Ordinance',
        description: '3207 base Oblivion · 6 cards cooldown',
        baseOblivion: 3207,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'mechanical', 'snowbound', 'voltage'],
      },
      exalted: {
        id: 'sv-infinite-polar-fission:exalted',
        label: 'Exalted',
        name: 'Polar Fission Throne Decree',
        description: '9105 base Oblivion · 9 cards cooldown',
        baseOblivion: 9105,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'mechanical', 'snowbound', 'voltage'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 760 },
  },
  {
    definitionId: 'sv-infinite-neon-snowfall',
    type: 'Angel',
    element: 'Mechanical',
    rarity: 'Infinite',
    name: 'Neon Snowfall',
    description: 'On summon: Gain 12 Radiance; Gain 1 Strain; Gain 28 Arctic Charge; Gain 3 Polar Capacitors. After 6 cards played: Gain 8 Radiance; Gain 18 Arctic Charge; +840 Oblivion; Salvage any 1 card; Release up to 3 Polar Capacitors (Voltage: +410 Oblivion per capacitor · Frost: +9 Arctic Charge per capacitor). While on board: +760 Oblivion per card played while on board',
    artKey: 'sv_infinite_neon_snowfall',
    summonCost: ['sv-cher-station-nullpoint', 'sv-cher-aeldris'],
    extraSummonConditions: [{ type: 'cherubim_active_gte', value: 2 }],
    onSummonEffects: [{ type: 'radiance_gain', value: 12 }, { type: 'strain_gain', value: 1 }, { type: 'arctic_charge_gain', value: 28 }, { type: 'set_secondary_gain', kind: 'snow', value: 3 }],
    activatedAbility: {
      name: 'Aurora Shock',
      cardsPlayedRequirement: 6,
      description: 'Gain 8 Radiance; Gain 18 Arctic Charge; +840 Oblivion; Salvage any 1 card; Release up to 3 Polar Capacitors (Voltage: +410 Oblivion per capacitor · Frost: +9 Arctic Charge per capacitor)',
      effects: [{ type: 'radiance_gain', value: 8 }, { type: 'arctic_charge_gain', value: 18 }, { type: 'oblivion_flat', value: 840 }, { type: 'salvage_any' }, { type: 'snow_polar_capacitor_release', voltageOblivionPerCapacitor: 410, frostArcticChargePerCapacitor: 9, consume: 3 }],
    },
    attacks: {
      primary: {
        id: 'sv-infinite-neon-snowfall:primary',
        label: 'Primary',
        name: 'Neon Snowfall Ordinance',
        description: '3428 base Oblivion · 6 cards cooldown',
        baseOblivion: 3428,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'mechanical', 'snowbound', 'voltage'],
      },
      exalted: {
        id: 'sv-infinite-neon-snowfall:exalted',
        label: 'Exalted',
        name: 'Neon Snowfall Throne Decree',
        description: '9606 base Oblivion · 9 cards cooldown',
        baseOblivion: 9606,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'mechanical', 'snowbound', 'voltage'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 760 },
  },
  {
    definitionId: 'sv-infinite-crystal-storm',
    type: 'Angel',
    element: 'Mechanical',
    rarity: 'Infinite',
    name: 'Crystal Storm',
    description: 'On summon: Gain 12 Radiance; Gain 3 Strain; Gain 30 Arctic Charge; +900 Oblivion; Gain 2 Polar Capacitors. After 7 cards played: Gain 2 Strain; Gain 10 Arctic Charge; +960 Oblivion; Discharge Arctic Charge; Release all Polar Capacitors (Voltage: +480 Oblivion per capacitor · Frost: +13 Arctic Charge per capacitor). While on board: +820 Oblivion per card played while on board',
    artKey: 'sv_infinite_crystal_storm',
    summonCost: ['sv-angel-sleet-choir', 'sv-ser-snow-lattice'],
    extraSummonConditions: [{ type: 'seraphim_on_board_gte', value: 3 }],
    onSummonEffects: [{ type: 'strain_gain', value: 3 }, { type: 'radiance_gain', value: 12 }, { type: 'arctic_charge_gain', value: 30 }, { type: 'oblivion_flat', value: 900 }, { type: 'set_secondary_gain', kind: 'snow', value: 2 }],
    activatedAbility: {
      name: 'Storm Break',
      cardsPlayedRequirement: 7,
      description: 'Gain 2 Strain; Gain 10 Arctic Charge; +960 Oblivion; Discharge Arctic Charge; Release all Polar Capacitors (Voltage: +480 Oblivion per capacitor · Frost: +13 Arctic Charge per capacitor)',
      // Role: PULSE CONVERTER. Modest seed (+2), but the activated ability
      // discharges every banked pulse at the highest coefficient in the band.
      effects: [{ type: 'strain_gain', value: 2 }, { type: 'arctic_charge_gain', value: 10 }, { type: 'oblivion_flat', value: 960 }, { type: 'arctic_charge_discharge' }, { type: 'snow_polar_capacitor_release', voltageOblivionPerCapacitor: 480, frostArcticChargePerCapacitor: 13 }],
    },
    attacks: {
      primary: {
        id: 'sv-infinite-crystal-storm:primary',
        label: 'Primary',
        name: 'Crystal Storm Ordinance',
        description: '3557 base Oblivion · 6 cards cooldown',
        baseOblivion: 3557,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'mechanical', 'snowbound', 'voltage'],
      },
      exalted: {
        id: 'sv-infinite-crystal-storm:exalted',
        label: 'Exalted',
        name: 'Crystal Storm Throne Decree',
        description: '9865 base Oblivion · 9 cards cooldown',
        baseOblivion: 9865,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'mechanical', 'snowbound', 'voltage'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 820 },
  },
  {
    definitionId: 'sv-infinite-black-ice-throne',
    type: 'Angel',
    element: 'Mechanical',
    rarity: 'Infinite',
    name: 'Black Ice Throne',
    description: 'On summon: Gain 14 Radiance; Gain 3 Strain; Gain 28 Arctic Charge; +1020 Oblivion; Gain 3 Polar Capacitors. After 6 cards played: Gain 8 Radiance; Gain 2 Strain; Gain 10 Arctic Charge; +1080 Oblivion; Release up to 2 Polar Capacitors (Voltage: +520 Oblivion per capacitor · Frost: +6 Arctic Charge per capacitor). While on board: +880 Oblivion per card played while on board',
    artKey: 'sv_infinite_black_ice_throne',
    summonCost: ['sv-eternal-white-static', 'sv-cher-station-nullpoint'],
    extraSummonConditions: [{ type: 'cherubim_active_gte', value: 2 }],
    onSummonEffects: [{ type: 'strain_gain', value: 3 }, { type: 'radiance_gain', value: 14 }, { type: 'arctic_charge_gain', value: 28 }, { type: 'oblivion_flat', value: 1020 }, { type: 'set_secondary_gain', kind: 'snow', value: 3 }],
    activatedAbility: {
      name: 'Throne Freeze',
      cardsPlayedRequirement: 6,
      description: 'Gain 8 Radiance; Gain 2 Strain; Gain 10 Arctic Charge; +1080 Oblivion; Release up to 2 Polar Capacitors (Voltage: +520 Oblivion per capacitor · Frost: +6 Arctic Charge per capacitor)',
      // Role: FLOOR-LOCKED AMPLIFIER. Seeds pulses and Arctic Charge, then
      // leaves the discharge for other Snowbound finishers.
      effects: [{ type: 'strain_gain', value: 2 }, { type: 'radiance_gain', value: 8 }, { type: 'arctic_charge_gain', value: 10 }, { type: 'oblivion_flat', value: 1080 }, { type: 'snow_polar_capacitor_release', voltageOblivionPerCapacitor: 520, frostArcticChargePerCapacitor: 6, consume: 2 }],
    },
    attacks: {
      primary: {
        id: 'sv-infinite-black-ice-throne:primary',
        label: 'Primary',
        name: 'Black Ice Throne Ordinance',
        description: '3694 base Oblivion · 6 cards cooldown',
        baseOblivion: 3694,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'mechanical', 'snowbound', 'voltage'],
      },
      exalted: {
        id: 'sv-infinite-black-ice-throne:exalted',
        label: 'Exalted',
        name: 'Black Ice Throne Decree',
        description: '10290 base Oblivion · 9 cards cooldown',
        baseOblivion: 10290,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'mechanical', 'snowbound', 'voltage'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 880 },
  },
  {
    definitionId: 'sv-infinite-aurora-collapse',
    type: 'Angel',
    element: 'Mechanical',
    rarity: 'Infinite',
    name: 'Aurora Collapse',
    description: 'On summon: Gain 18 Radiance; Gain 3 Strain; Gain 34 Arctic Charge; +1200 Oblivion; Gain 4 Polar Capacitors. After 7 cards played: Gain 15 Radiance; Vent 9999 Strain; Gain 22 Arctic Charge; +1260 Oblivion; Release all Polar Capacitors (Voltage: +560 Oblivion per capacitor · Frost: +15 Arctic Charge per capacitor). While on board: +940 Oblivion per card played while on board',
    artKey: 'sv_infinite_aurora_collapse',
    summonCost: ['sv-angel-voltage-patriarch', 'sv-eternal-frost-charge'],
    extraSummonConditions: [{ type: 'cherubim_active_gte', value: 3 }],
    onSummonEffects: [{ type: 'radiance_gain', value: 18 }, { type: 'strain_gain', value: 3 }, { type: 'arctic_charge_gain', value: 34 }, { type: 'oblivion_flat', value: 1200 }, { type: 'set_secondary_gain', kind: 'snow', value: 4 }],
    activatedAbility: {
      name: 'Collapse Horizon',
      cardsPlayedRequirement: 7,
      description: 'Gain 15 Radiance; Vent 9999 Strain; Gain 22 Arctic Charge; +1260 Oblivion; Release all Polar Capacitors (Voltage: +560 Oblivion per capacitor · Frost: +15 Arctic Charge per capacitor)',
      // Role: APEX SNOWBOUND RESERVOIR. Banks the largest Arctic Charge pool
      // without converting it into another pulse-discharge finisher.
      effects: [{ type: 'strain_vent', value: 9999 }, { type: 'radiance_gain', value: 15 }, { type: 'arctic_charge_gain', value: 22 }, { type: 'oblivion_flat', value: 1260 }, { type: 'snow_polar_capacitor_release', voltageOblivionPerCapacitor: 560, frostArcticChargePerCapacitor: 15 }],
    },
    attacks: {
      primary: {
        id: 'sv-infinite-aurora-collapse:primary',
        label: 'Primary',
        name: 'Aurora Collapse Ordinance',
        description: '3891 base Oblivion · 6 cards cooldown',
        baseOblivion: 3891,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'mechanical', 'snowbound', 'voltage'],
      },
      exalted: {
        id: 'sv-infinite-aurora-collapse:exalted',
        label: 'Exalted',
        name: 'Aurora Collapse Throne Decree',
        description: '10731 base Oblivion · 9 cards cooldown',
        baseOblivion: 10731,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'mechanical', 'snowbound', 'voltage'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 940 },
  }];

export const snowboundVoltageInfiniteOphanims: OphanimDefinition[] = [
  {
    definitionId: 'inf-sv-polar-cataclysm',
    type: 'Ophanim',
    element: 'Mechanical',
    rarity: 'Infinite',
    name: 'Polar Cataclysm',
    description: 'Gain 20 Radiance; Gain 3 Strain; Gain 32 Arctic Charge; Draw 1 card; +3200 Oblivion; Gain 20 Arctic Charge; Gain 3 Polar Capacitors; Release all Polar Capacitors (Voltage: +540 Oblivion per capacitor · Frost: +13 Arctic Charge per capacitor)',
    artKey: 'inf_sv_polar_cataclysm',
    effects: [
      { type: 'strain_gain', value: 3 },
      { type: 'radiance_gain', value: 20 },
      { type: 'arctic_charge_gain', value: 32 },
      { type: 'draw', value: 1 },
      { type: 'oblivion_flat', value: 3200 },
      { type: 'arctic_charge_gain', value: 20 },
      { type: 'set_secondary_gain', kind: 'snow', value: 3 },
      { type: 'snow_polar_capacitor_release', voltageOblivionPerCapacitor: 540, frostArcticChargePerCapacitor: 13 }],
  },
  {
    definitionId: 'inf-sv-neon-deluge',
    type: 'Ophanim',
    element: 'Mechanical',
    rarity: 'Infinite',
    name: 'Neon Deluge',
    description: 'Gain 10 Radiance; Gain 2 Strain; Look at the top 9 cards, take 3 cards, put 2 cards on the bottom, and discard the rest; Gain 19 Arctic Charge; +2800 Oblivion; Gain 15 Arctic Charge; Gain 2 Polar Capacitors; Release up to 2 Polar Capacitors (Voltage: +470 Oblivion per capacitor · Frost: +8 Arctic Charge per capacitor)',
    artKey: 'inf_sv_neon_deluge',
    effects: [
      { type: 'strain_gain', value: 2 },
      { type: 'radiance_gain', value: 10 },
      { type: 'look_top_take_drop', look: 9, take: 3, drop: 2 },
      { type: 'arctic_charge_gain', value: 19 },
      { type: 'oblivion_flat', value: 2800 },
      { type: 'arctic_charge_gain', value: 15 },
      { type: 'set_secondary_gain', kind: 'snow', value: 2 },
      { type: 'snow_polar_capacitor_release', voltageOblivionPerCapacitor: 470, frostArcticChargePerCapacitor: 8, consume: 2 }],
  },
  {
    definitionId: 'inf-sv-crystal-maelstrom',
    type: 'Ophanim',
    element: 'Mechanical',
    rarity: 'Infinite',
    name: 'Crystal Maelstrom',
    description: 'Gain 12 Radiance; Gain 3 Strain; Gain 28 Arctic Charge; +3300 Oblivion; Gain 18 Arctic Charge; Gain 3 Polar Capacitors; Release all Polar Capacitors (Voltage: +500 Oblivion per capacitor · Frost: +11 Arctic Charge per capacitor)',
    artKey: 'inf_sv_crystal_maelstrom',
    // Role: MID-COEFFICIENT FINISHER. Seeds 3, discharges all banked pulses at
    // a modest frost coefficient.
    effects: [
      { type: 'strain_gain', value: 3 },
      { type: 'radiance_gain', value: 12 },
      { type: 'arctic_charge_gain', value: 28 },
      { type: 'oblivion_flat', value: 3300 },
      { type: 'arctic_charge_gain', value: 18 },
      { type: 'set_secondary_gain', kind: 'snow', value: 3 },
      { type: 'snow_polar_capacitor_release', voltageOblivionPerCapacitor: 500, frostArcticChargePerCapacitor: 11 }],
  },
  {
    definitionId: 'inf-sv-black-ice-dominion',
    type: 'Ophanim',
    element: 'Mechanical',
    rarity: 'Infinite',
    name: 'Black Ice Dominion',
    description: 'Gain 14 Radiance; Gain 3 Strain; Look at the top 12 cards, take 4 cards, put 1 card on the bottom, and discard the rest; Gain 24 Arctic Charge; +3100 Oblivion; Gain 18 Arctic Charge; Gain 4 Polar Capacitors; Release up to 4 Polar Capacitors (Voltage: +480 Oblivion per capacitor · Frost: +9 Arctic Charge per capacitor)',
    artKey: 'inf_sv_black_ice_dominion',
    // Role: BIG CAPACITOR BATTERY + SCOUT. +4 Polar Capacitors; no discharge -
    // the deck-thinning variant of the back-row reservoir.
    effects: [
      { type: 'strain_gain', value: 3 },
      { type: 'radiance_gain', value: 14 },
      { type: 'look_top_take_drop', look: 12, take: 4, drop: 1 },
      { type: 'arctic_charge_gain', value: 24 },
      { type: 'oblivion_flat', value: 3100 },
      { type: 'arctic_charge_gain', value: 18 },
      { type: 'set_secondary_gain', kind: 'snow', value: 4 },
      { type: 'snow_polar_capacitor_release', voltageOblivionPerCapacitor: 480, frostArcticChargePerCapacitor: 9, consume: 4 }],
  },
  {
    definitionId: 'inf-sv-aurora-singularity',
    type: 'Ophanim',
    element: 'Mechanical',
    rarity: 'Infinite',
    name: 'Aurora Singularity',
    description: 'Gain 25 Radiance; Gain 4 Strain; Gain 38 Arctic Charge; +3600 Oblivion; Gain 22 Arctic Charge; Gain 4 Polar Capacitors; Release all Polar Capacitors (Voltage: +620 Oblivion per capacitor · Frost: +16 Arctic Charge per capacitor)',
    artKey: 'inf_sv_aurora_singularity',
    // Role: APEX OPHANIM FINISHER. Seeds 4 pulses, discharges them all at the
    // highest single-card Frost coefficient.
    effects: [
      { type: 'strain_gain', value: 4 },
      { type: 'radiance_gain', value: 25 },
      { type: 'arctic_charge_gain', value: 38 },
      { type: 'oblivion_flat', value: 3600 },
      { type: 'arctic_charge_gain', value: 22 },
      { type: 'set_secondary_gain', kind: 'snow', value: 4 },
      { type: 'snow_polar_capacitor_release', voltageOblivionPerCapacitor: 620, frostArcticChargePerCapacitor: 16 }],
  }];

// Flat export for registry

export const infiniteCards: Array<OphanimDefinition | SeraphimDefinition | CherubimDefinition | AngelDefinition> = [
  ...infiniteOphanimCards,
  ...infiniteSeraphimCards,
  ...infiniteCherubimCards,
  ...infiniteAngelCards,
  ...blackGlassInfernoInfiniteOphanims,
  ...blackGlassInfernoInfiniteSeraphims,
  ...blackGlassInfernoInfiniteCherubim,
  ...blackGlassInfernoInfiniteAngels,
  ...snowboundVoltageInfiniteOphanims];

// Combination recipes

export const INFINITE_RECIPES: InfiniteRecipe[] = [
  // Ophanims
  {
    resultId: 'inf-oblivion-absolute',
    lore: 'When the four axioms of annihilation converge, nothing remains but the absolute void.',
    ingredients: [
      { definitionId: 'btei-axiom-of-oblivion', count: 1 },
      { definitionId: 'btei-null-edict', count: 1 },
      { definitionId: 'btei-temporal-ruin', count: 1 },
      { definitionId: 'btei-voids-reaping', count: 1 },
      { definitionId: 'btei-neutrality-zero-edict', count: 1 }],
  },
  {
    resultId: 'inf-void-cascade',
    lore: 'Time rewound past its first breath, pouring endlessly into itself.',
    ingredients: [
      { definitionId: 'btei-temporal-ruin', count: 2 },
      { definitionId: 'btei-voids-reaping', count: 1 },
      { definitionId: 'btei-architects-manifold', count: 1 },
      { definitionId: 'btei-convergence-of-eternity', count: 1 }],
  },
  {
    resultId: 'inf-ash-kings-apocalypse',
    lore: 'The Ash Kings did not end; they became the conflagration that erases horizons.',
    ingredients: [
      { definitionId: 'btei-pyroabyss-ashfall-engine', count: 4 },
      { definitionId: 'btei-pyroabyss-oblivion-phoenix', count: 1 }],
  },
  // Seraphim
  {
    resultId: 'inf-genesis-throne',
    lore: 'Before the first star, before even the void, the Throne already sat.',
    ingredients: [
      { definitionId: 'btei-colossus-advent', count: 2 },
      { definitionId: 'btei-eternal-vigil', count: 1 },
      { definitionId: 'btei-omniscient-fracture', count: 1 },
      { definitionId: 'btei-convergence-of-eternity', count: 1 },
      { definitionId: 'btei-sovereign-domain', count: 1 }],
  },
  {
    resultId: 'inf-null-apex',
    lore: 'The apex of nothingness: a point so empty it bends all realities inward.',
    ingredients: [
      { definitionId: 'btei-neutrality-void-throne', count: 1 },
      { definitionId: 'btei-architects-manifold', count: 1 },
      { definitionId: 'btei-null-edict', count: 1 },
      { definitionId: 'btei-axiom-of-oblivion', count: 1 },
      { definitionId: 'btei-sovereign-domain', count: 1 }],
  },
  {
    resultId: 'inf-pyraxis-colossus',
    lore: 'Born of a dying star\'s last rage, Pyraxis stands where oceans of flame once flowed.',
    ingredients: [
      { definitionId: 'btei-pyroabyss-infernal-archon', count: 2 },
      { definitionId: 'btei-pyroabyss-cinder-cataclysm', count: 2 },
      { definitionId: 'btei-pyroabyss-hellrift-mandala', count: 1 }],
  },
  // Cherubim
  {
    resultId: 'inf-entropic-crown',
    lore: 'To wear entropy is to command it; the crown does not decay, it unmakes.',
    ingredients: [
      { definitionId: 'btei-architects-manifold', count: 2 },
      { definitionId: 'btei-sovereign-domain', count: 1 },
      { definitionId: 'btei-neutrality-zero-edict', count: 1 },
      { definitionId: 'btei-null-edict', count: 1 }],
  },
  {
    resultId: 'inf-annihilation-field',
    lore: 'In the field of annihilation, even the concept of opposition ceases.',
    ingredients: [
      { definitionId: 'btei-neutrality-zero-edict', count: 2 },
      { definitionId: 'btei-sovereign-domain', count: 1 },
      { definitionId: 'btei-voids-reaping', count: 1 },
      { definitionId: 'btei-axiom-of-oblivion', count: 1 },
      { definitionId: 'btei-temporal-ruin', count: 1 }],
  },
  {
    resultId: 'inf-pyroclasm-engine',
    lore: 'The engine does not burn. The engine is the burning.',
    ingredients: [
      { definitionId: 'btei-pyroabyss-cinder-cataclysm', count: 2 },
      { definitionId: 'btei-pyroabyss-ashfall-engine', count: 1 },
      { definitionId: 'btei-pyroabyss-infernal-archon', count: 1 },
      { definitionId: 'btei-light-choir-imperator', count: 1 }],
  },
  // Angels
  {
    resultId: 'inf-sovereign-void',
    lore: 'No court. No subjects. Only dominion absolute and the silence of a conquered cosmos.',
    ingredients: [
      { definitionId: 'btei-omniscient-fracture', count: 2 },
      { definitionId: 'btei-convergence-of-eternity', count: 1 },
      { definitionId: 'btei-neutrality-void-throne', count: 1 },
      { definitionId: 'btei-sovereign-domain', count: 1 },
      { definitionId: 'btei-architects-manifold', count: 1 }],
  },
  {
    resultId: 'inf-eternity-rupture',
    lore: 'The seam between eternities split, and from it emerged something that predated both.',
    ingredients: [
      { definitionId: 'btei-convergence-of-eternity', count: 2 },
      { definitionId: 'btei-sovereign-domain', count: 1 },
      { definitionId: 'btei-temporal-ruin', count: 1 },
      { definitionId: 'btei-omniscient-fracture', count: 1 }],
  },
  {
    resultId: 'inf-riftborn-sovereign',
    lore: 'It crossed the rift so many times it became indistinguishable from the crossing itself.',
    ingredients: [
      { definitionId: 'btei-pyroabyss-hellrift-mandala', count: 3 },
      { definitionId: 'btei-pyroabyss-infernal-archon', count: 1 },
      { definitionId: 'btei-pyroabyss-ashfall-engine', count: 1 }],
  },
  {
    resultId: 'inf-prismatic-axiom-rain',
    lore: 'A theorem of color written across the sky until causality fractures into rain.',
    ingredients: [
      { definitionId: 'btei-prismatic-vorthum-edict', count: 1 },
      { definitionId: 'btei-prismatic-ninefold-accord', count: 1 },
      { definitionId: 'btei-prismatic-storm-memory', count: 1 },
      { definitionId: 'btei-prismatic-fracture-archive', count: 1 },
      { definitionId: 'btei-prismatic-blindwars-reliquary', count: 1 }],
  },
  {
    resultId: 'inf-thornbound-last-procession',
    lore: 'The final march of thorns never ended; it became the law of endings.',
    ingredients: [
      { definitionId: 'btei-thornbound-gallowcrown-matron', count: 2 },
      { definitionId: 'btei-thornbound-briar-siege', count: 1 },
      { definitionId: 'btei-thornbound-red-march', count: 1 },
      { definitionId: 'btei-thornbound-funeral-bramble', count: 1 }],
  },
  {
    resultId: 'inf-celestial-blackout',
    lore: 'At peak noon, heaven blinked once, and every star remembered fear.',
    ingredients: [
      { definitionId: 'btei-light-throne-of-morning', count: 2 },
      { definitionId: 'btei-light-sunbreak-canon', count: 1 },
      { definitionId: 'btei-light-choir-imperator', count: 1 },
      { definitionId: 'btei-light-halo-dominion', count: 1 }],
  },
  {
    resultId: 'inf-machina-eternal-loop',
    lore: 'A machine that solved mortality by deleting the distinction between start and end.',
    ingredients: [
      { definitionId: 'btei-mech-overclock-singularity', count: 2 },
      { definitionId: 'btei-mech-reactor-paradigm', count: 1 },
      { definitionId: 'btei-mech-thaumic-primevector', count: 1 },
      { definitionId: 'btei-mech-brass-judicator', count: 1 }],
  },
  {
    resultId: 'inf-prismatic-choir-splinter',
    lore: 'One shard of the choir sings loud enough to split empires.',
    ingredients: [
      { definitionId: 'btei-prismatic-storm-memory', count: 1 },
      { definitionId: 'btei-prismatic-fracture-archive', count: 1 },
      { definitionId: 'btei-prismatic-ninefold-accord', count: 1 },
      { definitionId: 'btei-prismatic-blindwars-reliquary', count: 1 },
      { definitionId: 'btei-prismatic-vorthum-edict', count: 1 }],
  },
  {
    resultId: 'inf-thorn-widow-engine',
    lore: 'Built from grief and wire, it harvests war and returns only momentum.',
    ingredients: [
      { definitionId: 'btei-thornbound-cathedral-lancer', count: 1 },
      { definitionId: 'btei-thornbound-red-march', count: 1 },
      { definitionId: 'btei-thornbound-briar-siege', count: 1 },
      { definitionId: 'btei-thornbound-gallowcrown-matron', count: 1 }],
  },
  {
    resultId: 'inf-lucent-cataclysm-archon',
    lore: 'Its radiance was not warmth, but a disciplined apocalypse.',
    ingredients: [
      { definitionId: 'btei-light-aureate-rapture', count: 1 },
      { definitionId: 'btei-light-choir-imperator', count: 3 },
      { definitionId: 'btei-light-halo-dominion', count: 1 }],
  },
  {
    resultId: 'inf-brass-eidolon-prime',
    lore: 'Every brass verdict echoes forever once the prime mind awakens.',
    ingredients: [
      { definitionId: 'btei-mech-furnace-ascension', count: 2 },
      { definitionId: 'btei-mech-brass-judicator', count: 2 },
      { definitionId: 'btei-mech-thaumic-primevector', count: 1 }],
  },
  {
    resultId: 'inf-prismatic-collapse-lattice',
    lore: 'The lattice does not hold reality together; it chooses what falls through.',
    ingredients: [
      { definitionId: 'btei-prismatic-blindwars-reliquary', count: 2 },
      { definitionId: 'btei-prismatic-storm-memory', count: 1 },
      { definitionId: 'btei-prismatic-fracture-archive', count: 1 },
      { definitionId: 'btei-prismatic-ninefold-accord', count: 1 }],
  },
  {
    resultId: 'inf-gravebloom-singularity',
    lore: 'An entire graveyard compressed into one blooming instant.',
    ingredients: [
      { definitionId: 'btei-thornbound-red-march', count: 1 },
      { definitionId: 'btei-thornbound-funeral-bramble', count: 1 },
      { definitionId: 'btei-thornbound-gallowcrown-matron', count: 1 },
      { definitionId: 'btei-thornbound-cathedral-lancer', count: 1 },
      { definitionId: 'btei-thornbound-briar-siege', count: 1 }],
  },
  {
    resultId: 'inf-heliarch-eclipse-engine',
    lore: 'The sun itself became an instruction set and obeyed.',
    ingredients: [
      { definitionId: 'btei-light-choir-imperator', count: 1 },
      { definitionId: 'btei-light-halo-dominion', count: 1 },
      { definitionId: 'btei-light-throne-of-morning', count: 2 },
      { definitionId: 'btei-light-sunbreak-canon', count: 1 }],
  },
  {
    resultId: 'inf-mech-entropy-foundry',
    lore: 'Entropy entered the foundry as ore and left as policy.',
    ingredients: [
      { definitionId: 'btei-mech-brass-judicator', count: 1 },
      { definitionId: 'btei-mech-reactor-paradigm', count: 1 },
      { definitionId: 'btei-mech-thaumic-primevector', count: 1 },
      { definitionId: 'btei-mech-overclock-singularity', count: 1 },
      { definitionId: 'btei-mech-furnace-ascension', count: 1 }],
  },
  {
    resultId: 'inf-prismatic-judgement-array',
    lore: 'Nine mirrored judges reached the same verdict: continue forever.',
    ingredients: [
      { definitionId: 'btei-prismatic-ninefold-accord', count: 2 },
      { definitionId: 'btei-prismatic-blindwars-reliquary', count: 1 },
      { definitionId: 'btei-prismatic-vorthum-edict', count: 1 },
      { definitionId: 'btei-prismatic-storm-memory', count: 1 }],
  },
  {
    resultId: 'inf-thornbound-elegy-titan',
    lore: 'Its elegy is a marching order carved into continents.',
    ingredients: [
      { definitionId: 'btei-thornbound-funeral-bramble', count: 3 },
      { definitionId: 'btei-thornbound-gallowcrown-matron', count: 1 },
      { definitionId: 'btei-thornbound-cathedral-lancer', count: 1 }],
  },
  {
    resultId: 'inf-mechanical-apotheosis-core',
    lore: 'When the core reached apotheosis, logic had to kneel to output.',
    ingredients: [
      { definitionId: 'btei-mech-thaumic-primevector', count: 2 },
      { definitionId: 'btei-mech-reactor-paradigm', count: 1 },
      { definitionId: 'btei-mech-overclock-singularity', count: 1 },
      { definitionId: 'btei-mech-brass-judicator', count: 1 },
      { definitionId: 'btei-mech-furnace-ascension', count: 1 }],
  },
  // Black Glass Inferno
  {
    resultId: 'inf-bgi-sorveths-final-breath',
    lore: 'For eleven seconds, two truths burned as one and changed what fire meant forever.',
    ingredients: [
      { definitionId: 'btei-bgi-cindershard-lexicon', count: 2 },
      { definitionId: 'btei-bgi-inferborn-prophecy', count: 1 },
      { definitionId: 'btei-bgi-elegy-of-veth-serath', count: 1 }],
  },
  {
    resultId: 'inf-bgi-chromatic-ruin-deluge',
    lore: 'The Age of Chromatic Ruin never ended; it merely learned to fall all at once.',
    ingredients: [
      { definitionId: 'btei-bgi-blackglass-catastrophe', count: 3 },
      { definitionId: 'btei-bgi-nocturne-of-embers', count: 1 },
      { definitionId: 'btei-bgi-throne-of-cinders', count: 1 }],
  },
  {
    resultId: 'inf-bgi-obsidian-covenant-colossus',
    lore: 'The covenant survived by becoming heavier than hatred itself.',
    ingredients: [
      { definitionId: 'btei-bgi-throne-of-cinders', count: 2 },
      { definitionId: 'btei-bgi-velplane-ossuary', count: 1 },
      { definitionId: 'btei-bgi-cindershard-lexicon', count: 1 }],
  },
  {
    resultId: 'inf-bgi-glassrose-leviathan',
    lore: 'Where dragon blood met stone, the roses remembered and the leviathan answered.',
    ingredients: [
      { definitionId: 'btei-bgi-rosecrown-annihilator', count: 2 },
      { definitionId: 'btei-bgi-crystal-war-sutures', count: 1 },
      { definitionId: 'btei-bgi-silver-sorrow-archwyrm', count: 1 }],
  },
  {
    resultId: 'inf-bgi-inferno-of-two-truths',
    lore: 'Black and white flames did not reconcile; they chose to burn together.',
    ingredients: [
      { definitionId: 'btei-bgi-inferborn-prophecy', count: 2 },
      { definitionId: 'btei-bgi-nocturne-of-embers', count: 1 },
      { definitionId: 'btei-bgi-crystal-war-sutures', count: 1 }],
  },
  {
    resultId: 'inf-bgi-ashen-cinder-cathedral',
    lore: 'The cathedral was built from losses too immense to bury.',
    ingredients: [
      { definitionId: 'btei-bgi-throne-of-cinders', count: 2 },
      { definitionId: 'btei-bgi-elegy-of-veth-serath', count: 1 },
      { definitionId: 'btei-bgi-cindershard-lexicon', count: 1 }],
  },
  {
    resultId: 'inf-bgi-vaelmor-umbra-sovereign',
    lore: 'Sovereignty after the inferno was not rule, but endurance with memory intact.',
    ingredients: [
      { definitionId: 'btei-bgi-silver-sorrow-archwyrm', count: 2 },
      { definitionId: 'btei-bgi-velplane-ossuary', count: 1 },
      { definitionId: 'btei-bgi-elegy-of-veth-serath', count: 1 }],
  },
  {
    resultId: 'inf-bgi-midplace-apocalypse',
    lore: 'At Veth Serath, the world learned that stopping can be more brutal than war.',
    ingredients: [
      { definitionId: 'btei-bgi-velplane-ossuary', count: 2 },
      { definitionId: 'btei-bgi-elegy-of-veth-serath', count: 2 },
      { definitionId: 'btei-bgi-blackglass-catastrophe', count: 1 }],
  },

  // Snowbound Voltage
  {
    resultId: 'inf-sv-polar-cataclysm',
    lore: 'Voltage and frost collided at the pole, and all thermodynamics surrendered.',
    ingredients: [
      { definitionId: 'sv-eternal-frost-charge', count: 2 },
      { definitionId: 'sv-eternal-aurora-battery', count: 1 },
      { definitionId: 'sv-eternal-white-static', count: 1 }],
  },
  {
    resultId: 'inf-sv-neon-deluge',
    lore: 'The aurora learned to fall sideways, and now it drowns all light.',
    ingredients: [
      { definitionId: 'sv-eternal-aurora-battery', count: 3 },
      { definitionId: 'sv-eternal-sleet-choir', count: 1 }],
  },
  {
    resultId: 'inf-sv-crystal-maelstrom',
    lore: 'Ice formations spiraled beyond entropy; they became a storm with its own laws.',
    ingredients: [
      { definitionId: 'sv-eternal-glacier-signal', count: 2 },
      { definitionId: 'sv-eternal-frost-charge', count: 1 },
      { definitionId: 'sv-eternal-sleet-choir', count: 1 }],
  },
  {
    resultId: 'inf-sv-black-ice-dominion',
    lore: 'When electricity froze into silence, domination became effortless.',
    ingredients: [
      { definitionId: 'sv-eternal-white-static', count: 2 },
      { definitionId: 'sv-eternal-glacier-signal', count: 1 },
      { definitionId: 'sv-eternal-frost-charge', count: 1 }],
  },
  {
    resultId: 'inf-sv-aurora-singularity',
    lore: 'All northern lights converged into one point, and from that singularity, everything became cold song.',
    ingredients: [
      { definitionId: 'sv-eternal-aurora-battery', count: 2 },
      { definitionId: 'sv-eternal-sleet-choir', count: 2 },
      { definitionId: 'sv-eternal-white-static', count: 1 }],
  },

  // Glass Absolute
  {
    resultId: 'ga-inf-glass-absolute',
    lore: 'When every pane remembers first light, the world resolves into one perfect prism-body.',
    ingredients: [
      { definitionId: 'ga-et-first-white', count: 2 },
      { definitionId: 'ga-et-lattice-archive-seraph', count: 1 },
      { definitionId: 'ga-et-perfect-refraction', count: 1 }],
  },
  {
    resultId: 'ga-inf-refracted-sovereign',
    lore: 'The sovereign is crowned by mirrors that never disagree.',
    ingredients: [
      { definitionId: 'ga-et-perfect-refraction', count: 2 },
      { definitionId: 'ga-et-angled-infinity', count: 1 },
      { definitionId: 'ga-et-lattice-archive-seraph', count: 1 }],
  },
  {
    resultId: 'ga-inf-yreth-prism-at-center',
    lore: 'At the center of all refractions stands Yreth, where color becomes law.',
    ingredients: [
      { definitionId: 'ga-et-center-everywhere', count: 2 },
      { definitionId: 'ga-et-angled-infinity', count: 1 },
      { definitionId: 'ga-et-first-white', count: 1 }],
  },
  {
    resultId: 'ga-inf-chorus-unbroken-spectrum',
    lore: 'A choir of glass bodies sustaining one unbroken band of creation-light.',
    ingredients: [
      { definitionId: 'ga-et-lattice-archive-seraph', count: 2 },
      { definitionId: 'ga-et-perfect-refraction', count: 2 },
      { definitionId: 'ga-et-first-white', count: 1 }],
  },
  {
    resultId: 'ga-inf-shattered-without-shattering',
    lore: 'The form breaks across infinity yet remains one intact theorem.',
    ingredients: [
      { definitionId: 'ga-et-angled-infinity', count: 3 },
      { definitionId: 'ga-et-perfect-refraction', count: 1 }],
  },
  {
    resultId: 'ga-inf-color-after-white',
    lore: 'After first white, every surviving color carries a divine afterimage.',
    ingredients: [
      { definitionId: 'ga-et-first-white', count: 2 },
      { definitionId: 'ga-et-center-everywhere', count: 1 },
      { definitionId: 'ga-et-lattice-archive-seraph', count: 1 },
      { definitionId: 'ga-et-angled-infinity', count: 1 }],
  },

  // Blazing Garden
  {
    resultId: 'bg-inf-final-chord-incandescent',
    lore: 'Every lineage blooms at once and the garden sings in total flame.',
    ingredients: [
      { definitionId: 'bg-et-serevathi-proofflame', count: 2 },
      { definitionId: 'bg-et-vethkorath-seven-crown-proof', count: 1 },
      { definitionId: 'bg-et-embergrove-codex', count: 1 }],
  },
  {
    resultId: 'bg-inf-soleth-vair-worldflower',
    lore: 'Soleth Vair reveals itself as one living blossom without edge or end.',
    ingredients: [
      { definitionId: 'bg-et-aureveth-evernoon', count: 2 },
      { definitionId: 'bg-et-noonproof-transit', count: 2 },
      { definitionId: 'bg-et-serevathi-proofflame', count: 1 }],
  },
  {
    resultId: 'bg-inf-embergrove-resurrection-array',
    lore: 'The Cinder Grove returns every lost color as stronger, wilder growth.',
    ingredients: [
      { definitionId: 'bg-et-embergrove-codex', count: 3 },
      { definitionId: 'bg-et-serevathi-proofflame', count: 1 }],
  },
  {
    resultId: 'bg-inf-choir-of-rekindled-geometry',
    lore: 'The choir rebuilds the world in nested symmetries of Cinder and bloom.',
    ingredients: [
      { definitionId: 'bg-et-vethkorath-seven-crown-proof', count: 2 },
      { definitionId: 'bg-et-embergrove-codex', count: 1 },
      { definitionId: 'bg-et-serevathi-proofflame', count: 1 }],
  },
  {
    resultId: 'bg-inf-noon-that-never-sets',
    lore: 'Noon remains permanent, and every petal becomes a sun.',
    ingredients: [
      { definitionId: 'bg-et-aureveth-evernoon', count: 2 },
      { definitionId: 'bg-et-noonproof-transit', count: 1 },
      { definitionId: 'bg-et-serevathi-proofflame', count: 1 },
      { definitionId: 'bg-et-vethkorath-seven-crown-proof', count: 1 }],
  },
  {
    resultId: 'bg-inf-proof-completed-sky',
    lore: 'The final theorem crowns the heavens in violet fire and living stars.',
    ingredients: [
      { definitionId: 'bg-et-vethkorath-seven-crown-proof', count: 3 },
      { definitionId: 'bg-et-noonproof-transit', count: 1 },
      { definitionId: 'bg-et-serevathi-proofflame', count: 1 }],
  },

  // Age of the Butterfly
  {
    resultId: 'bf-inf-velkoreth-the-unfolding',
    lore: 'Velkoreth unfolds across every layer at once, and the wing becomes the world.',
    ingredients: [
      { definitionId: 'bf-et-kethravoss-seven-layers', count: 2 },
      { definitionId: 'bf-et-pyrethkai-equilibrium', count: 1 },
      { definitionId: 'bf-et-mirrorglass-conclave', count: 1 }],
  },
  {
    resultId: 'bf-inf-open-foundational-chrysalis',
    lore: 'The first chrysalis opens onto every spectrum ever to be born.',
    ingredients: [
      { definitionId: 'bf-et-nullwing-interstice', count: 2 },
      { definitionId: 'bf-et-pyrethkai-equilibrium', count: 1 },
      { definitionId: 'bf-et-kethravoss-seven-layers', count: 1 }],
  },
  {
    resultId: 'bf-inf-mirrorface-voidface',
    lore: 'Two faces of one wing, mirroring and unmaking each other across the same beat.',
    ingredients: [
      { definitionId: 'bf-et-mirrorglass-conclave', count: 2 },
      { definitionId: 'bf-et-nullwing-interstice', count: 1 },
      { definitionId: 'bf-et-pyrethkai-equilibrium', count: 1 }],
  },
  {
    resultId: 'bf-inf-generation-of-the-flutter',
    lore: 'An entire generation answers the call of a single wingbeat, and the age begins.',
    ingredients: [
      { definitionId: 'bf-et-pyrethkai-equilibrium', count: 2 },
      { definitionId: 'bf-et-kethravoss-seven-layers', count: 1 },
      { definitionId: 'bf-et-mirrorglass-conclave', count: 1 }],
  },
  {
    resultId: 'bf-inf-the-endless-wing-age',
    lore: 'No first wingbeat. No last. Only the Age, repeating forever.',
    ingredients: [
      { definitionId: 'bf-et-volthari-storm-lattice', count: 3 },
      { definitionId: 'bf-et-pyrethkai-equilibrium', count: 1 },
      { definitionId: 'bf-et-kethravoss-seven-layers', count: 1 }],
  },

  // Eternal Seas
  {
    resultId: 'es-inf-veleth-itself',
    lore: 'The trench-voice answers itself, and the sea remembers its true name.',
    ingredients: [
      { definitionId: 'es-et-veleth-abyss-sounding', count: 3 },
      { definitionId: 'es-et-thyrvaan-oldlight-grid', count: 1 }],
  },
  {
    resultId: 'es-inf-water-that-was-always-there',
    lore: 'A water older than the shore that contained it, returning to its own beginning.',
    ingredients: [
      { definitionId: 'es-et-aeveleth-first-drift', count: 3 },
      { definitionId: 'es-et-thyrvaan-oldlight-grid', count: 1 },
      { definitionId: 'es-et-veleth-abyss-sounding', count: 1 }],
  },
  {
    resultId: 'es-inf-veilmargin-cathedral',
    lore: 'A cathedral of veilmargin currents, where every wave is a prayer and every prayer a wave.',
    ingredients: [
      { definitionId: 'es-et-thyrvaan-oldlight-grid', count: 2 },
      { definitionId: 'es-et-crown-of-seven-margins', count: 1 },
      { definitionId: 'es-et-aeveleth-first-drift', count: 1 }],
  },
  {
    resultId: 'es-inf-seven-crowned-confluence',
    lore: 'Seven crowned currents converge into one sovereign tide.',
    ingredients: [
      { definitionId: 'es-et-crown-of-seven-margins', count: 3 },
      { definitionId: 'es-et-thyrvaan-oldlight-grid', count: 1 }],
  },
  {
    resultId: 'es-inf-aeveleth-undying-revision',
    lore: 'The first drift returns, undying, revising every shoreline it touches.',
    ingredients: [
      { definitionId: 'es-et-aeveleth-first-drift', count: 2 },
      { definitionId: 'es-et-surevaan-anomaly-log', count: 2 },
      { definitionId: 'es-et-crown-of-seven-margins', count: 1 }],
  },

  // Abyssal Forge
  {
    resultId: 'af-inf-ouroglas-uncoiled',
    lore: 'The glass-serpent unspools its coiled centuries; every loop a re-forged sea.',
    ingredients: [
      { definitionId: 'af-et-ouroglas-dreaming', count: 3 },
      { definitionId: 'af-et-forge-beneath', count: 1 }],
  },
  {
    resultId: 'af-inf-abyssal-forge-itself',
    lore: 'The anvil-beneath finally lifts its own hammer and strikes the world flat.',
    ingredients: [
      { definitionId: 'af-et-forge-beneath', count: 3 },
      { definitionId: 'af-et-ouroglas-dreaming', count: 1 },
      { definitionId: 'af-et-pearled-pantheon', count: 1 }],
  },
  {
    resultId: 'af-inf-unrecorded-hue',
    lore: 'A color no ledger ever recorded; the forge invents it the moment you blink.',
    ingredients: [
      { definitionId: 'af-et-quenched-drift', count: 2 },
      { definitionId: 'af-et-ouroglas-dreaming', count: 1 },
      { definitionId: 'af-et-nacre-touched-procession', count: 1 }],
  },
  {
    resultId: 'af-inf-covenant-coiled-fire',
    lore: 'Pilgrims and pantheon swear one vow inside a single coiled flame.',
    ingredients: [
      { definitionId: 'af-et-nacre-touched-procession', count: 2 },
      { definitionId: 'af-et-pearled-pantheon', count: 1 },
      { definitionId: 'af-et-forge-beneath', count: 1 }],
  },
  {
    resultId: 'af-inf-reforging-world',
    lore: 'The world itself is set on the anvil and struck  Ewhat rises is older and brighter.',
    ingredients: [
      { definitionId: 'af-et-forge-beneath', count: 2 },
      { definitionId: 'af-et-pearled-pantheon', count: 1 },
      { definitionId: 'af-et-quenched-drift', count: 1 },
      { definitionId: 'af-et-nacre-touched-procession', count: 1 }],
  },

  // Death-flamed Hell
  {
    resultId: 'dfh-inf-vakhresh-marches-out',
    lore: 'The pale general crosses the threshold, and every door behind him forgets its name.',
    ingredients: [
      { definitionId: 'dfh-et-skull-ceiling-garrison', count: 2 },
      { definitionId: 'dfh-et-eternal-procession-of-the-veiled', count: 1 },
      { definitionId: 'dfh-et-othraks-eternal-communion', count: 1 }],
  },
  {
    resultId: 'dfh-inf-final-communion-of-halos',
    lore: 'Halo touches halo for the last time; a single white note rings forever.',
    ingredients: [
      { definitionId: 'dfh-et-othraks-eternal-communion', count: 3 },
      { definitionId: 'dfh-et-crimson-ember-rain', count: 1 }],
  },
  {
    resultId: 'dfh-inf-bridal-procession-living-world',
    lore: 'The veiled cortege steps from hell into a living country, and the country bows.',
    ingredients: [
      { definitionId: 'dfh-et-eternal-procession-of-the-veiled', count: 3 },
      { definitionId: 'dfh-et-skull-ceiling-garrison', count: 1 }],
  },
  {
    resultId: 'dfh-inf-death-flame-escaping-upward',
    lore: 'A column of pale fire rises out of every hell and refuses to descend again.',
    ingredients: [
      { definitionId: 'dfh-et-crimson-ember-rain', count: 2 },
      { definitionId: 'dfh-et-othraks-eternal-communion', count: 1 },
      { definitionId: 'dfh-et-skull-ceiling-garrison', count: 1 }],
  },

  // [EVENT] Wished Upon A Star
  {
    resultId: 'inf-wuas-stellarborn-throne',
    lore: 'When three cosmic wishes converge at the apex of the Dream Lattice, a throne of living starlight assembles itself from the silence between galaxies.',
    ingredients: [
      { definitionId: 'wuas-et-aethervex-wishwright', count: 3 },
      { definitionId: 'wuas-et-selenira-voidbane', count: 1 }],
  },
  {
    resultId: 'inf-wuas-lune-choir-ascension',
    lore: 'The twelve silver Lune sing a convergence that bends dream and starlight into one unbroken note, preserving both across every turn they endure.',
    ingredients: [
      { definitionId: 'wuas-et-selenira-voidbane', count: 3 },
      { definitionId: 'wuas-et-aethervex-wishwright', count: 1 }],
  },
  {
    resultId: 'inf-wuas-wishwright-absolute',
    lore: 'Aethervex devours the boundary between wish and reality; every Seraphim on the board becomes a living nova that multiplies oblivion infinitely.',
    ingredients: [
      { definitionId: 'wuas-et-aethervex-wishwright', count: 2 },
      { definitionId: 'wuas-et-draethos-unforgotten', count: 2 },
      { definitionId: 'wuas-et-selenira-voidbane', count: 1 }],
  }];

function capRecipeIngredients(ingredients: InfiniteIngredient[]): InfiniteIngredient[] {
  const expanded: string[] = [];
  for (const ingredient of ingredients) {
    const count = Math.max(0, Math.floor(ingredient.count));
    for (let i = 0; i < count; i += 1) {
      expanded.push(ingredient.definitionId);
    }
  }

  const cappedCopies = expanded.slice(0, 3);
  const counts = new Map<string, number>();
  const orderedIds: string[] = [];
  for (const definitionId of cappedCopies) {
    if (!counts.has(definitionId)) orderedIds.push(definitionId);
    counts.set(definitionId, (counts.get(definitionId) ?? 0) + 1);
  }

  return orderedIds.slice(0, 3).map(definitionId => ({
    definitionId,
    count: counts.get(definitionId) ?? 1,
  }));
}

for (const recipe of INFINITE_RECIPES) {
  recipe.ingredients = capRecipeIngredients(recipe.ingredients);
}

