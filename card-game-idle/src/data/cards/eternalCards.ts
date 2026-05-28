import type { OphanimDefinition, SeraphimDefinition, CherubimDefinition, AngelDefinition } from '@/types/cards';

export const eternalOphanimCards: OphanimDefinition[] = [
  {
    definitionId: 'btei-voids-reaping',
    type: 'Ophanim',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: "Void's Reaping",
    description: 'All Seraphim on board gain +9 Patience; Designate the Seraphim with the highest Patience as your Vessel; Your Vessel copies 30% of Patience gained by other Seraphim this turn',
    artKey: 'btei_voids_reaping',
    // Role: Vessel anointer. Light Patience seed + designates the Vessel and
    // sets up a small copy-gain mirror for the rest of the turn. Tempo opener
    // that creates the Vessel anchor for follow-up cards to amplify.
    effects: [
      { type: 'patience_gain_all', value: 9 },
      { type: 'neutrality_designate_vessel' },
      { type: 'neutrality_vessel_copy_gain', percent: 30 }],
  },
  {
    definitionId: 'btei-temporal-ruin',
    type: 'Ophanim',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Temporal Ruin',
    description: 'Mark up to 3 other cards in hand; marked cards grant +2 Patience to all Seraphim when played; All Seraphim on board gain +10 Patience; +500 Oblivion',
    artKey: 'btei_temporal_ruin',
    // Role: Hand-stamper. Marks upcoming plays with Patience riders so the
    // bonuses land WHEN those cards are played, not all at once ? paying out
    // smoothly across the turn rather than front-loaded.
    effects: [
      { type: 'neutrality_mark_hand', count: 3, patience: 2 },
      { type: 'patience_gain_all', value: 10 },
      { type: 'oblivion_flat', value: 500 }],
  },
  {
    definitionId: 'btei-null-edict',
    type: 'Ophanim',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Null Edict',
    description: 'All Seraphim on board gain +13 Patience; Designate the Seraphim with the highest Patience as your Vessel; Redistribute up to 8 Vessel Patience across your other Seraphim; +700 Oblivion',
    artKey: 'btei_null_edict',
    // Role: Vessel redistributor. Names the Vessel and immediately spreads
    // a portion of Patience across the rest of the board ? flattens the pool
    // so every Seraphim contributes, not just one tall stack.
    effects: [
      { type: 'patience_gain_all', value: 13 },
      { type: 'neutrality_designate_vessel' },
      { type: 'neutrality_vessel_redistribute', value: 8 },
      { type: 'oblivion_flat', value: 700 }],
  },
  {
    definitionId: 'btei-axiom-of-oblivion',
    type: 'Ophanim',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Axiom of Oblivion',
    description: 'All Seraphim on board gain +16 Patience; Seraphim attacks preserve 30% of consumed Patience this turn; Seraphim bonuses are amplified by +0.3; +1000 Oblivion',
    artKey: 'btei_axiom_of_oblivion',
    // Role: Attack-preserve setup + Seraphim amplifier. Pre-loads Patience,
    // then arms attacks to keep most of it after firing ? paired with a
    // bonus amplifier so adjacent Seraphim bonuses get a turn-long boost.
    effects: [
      { type: 'patience_gain_all', value: 16 },
      { type: 'neutrality_attack_preserve', percent: 30 },
      { type: 'seraphim_bonus_amplifier', value: 0.30 },
      { type: 'oblivion_flat', value: 1000 }],
  }];

export const eternalSeraphimCards: SeraphimDefinition[] = [
  {
    definitionId: 'btei-eternal-vigil',
    type: 'Seraphim',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Eternal Vigil',
    description: 'On play: All Seraphim on board gain +8 Patience; Designate the Seraphim with the highest Patience as your Vessel; Your Vessel copies 25% of Patience gained by other Seraphim this turn; +120 Oblivion. While on board: +50 Oblivion per card played while active. Patience: +1 stack per card played; on attack, each stack → +15 Oblivion',
    artKey: 'btei_eternal_vigil',
    attacks: {
      unsynergized: {
        id: 'btei-eternal-vigil:unsynergized',
        label: 'Unsynergized',
        name: 'Eternal Vigil Vector Break',
        description: '2275 base Oblivion · 6 cards cooldown',
        baseOblivion: 2275,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'neutrality'],
      },
      synergized: {
        id: 'btei-eternal-vigil:synergized',
        label: 'Synergized',
        name: 'Eternal Vigil Angelic Verdict',
        description: '3868 base Oblivion · 7 cards cooldown · Requires Angel',
        baseOblivion: 3868,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'neutrality'],
      },
    },
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 50, synergyRequirement: 'Neutrality' },
    patienceThreshold: 6,
    // Role: Vessel anchor Seraphim. Names itself as the Vessel reference and
    // enables Vessel copy for the turn so subsequent Patience gains mirror
    // onto it ? a slow, durable accumulator that pays its own attack.
    onPlayEffects: [
      { type: 'patience_gain_all', value: 8 },
      { type: 'neutrality_designate_vessel' },
      { type: 'neutrality_vessel_copy_gain', percent: 25 },
      { type: 'oblivion_flat', value: 120 }],
  },
  {
    definitionId: 'btei-colossus-advent',
    type: 'Seraphim',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Colossus Advent',
    description: 'On play: All Seraphim on board gain +12 Patience; Link Seraphim this turn: patience gains grant +1 extra to all linked Seraphim and non-attacking linked Seraphim retain 25% Patience after each linked attack; +350 Oblivion. While on board: +200 Oblivion per card played while active. Patience: +1 stack per card played; on attack, each stack → +15 Oblivion',
    artKey: 'btei_colossus_advent',
    attacks: {
      unsynergized: {
        id: 'btei-colossus-advent:unsynergized',
        label: 'Unsynergized',
        name: 'Colossus Advent Vector Break',
        description: '2900 base Oblivion · 6 cards cooldown',
        baseOblivion: 2900,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'neutrality'],
      },
      synergized: {
        id: 'btei-colossus-advent:synergized',
        label: 'Synergized',
        name: 'Colossus Advent Angelic Verdict',
        description: '4930 base Oblivion · 7 cards cooldown · Requires Angel',
        baseOblivion: 4930,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'neutrality'],
      },
    },
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 200, synergyRequirement: 'Neutrality' },
    patienceThreshold: 6,
    // Role: Linked-mode anchor. Activates Link Mode at moderate strength so
    // every Patience gain echoes across the whole board and non-attackers
    // retain a slice after a linked attack ? mass-tempo Seraphim.
    onPlayEffects: [
      { type: 'patience_gain_all', value: 12 },
      { type: 'neutrality_linked_mode', gain: 1, retainPercent: 25 },
      { type: 'oblivion_flat', value: 350 }],
  }];

export const eternalCherubimCards: CherubimDefinition[] = [
  {
    definitionId: 'btei-sovereign-domain',
    type: 'Cherubim',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Sovereign Domain',
    description: 'On play: All Seraphim on board gain +7 Patience; Seraphim bonuses are amplified by +0.25; +300 Oblivion. While on board: Adjacent Seraphim gain +4 Patience per card played',
    artKey: 'btei_sovereign_domain',
    // Role: Bonus amplifier Cherubim. Modest amplifier on all Seraphim bonuses
    // plus the standard adjacent Patience trickle ? quietly multiplies
    // every board passive without consuming Patience itself.
    effects: [{ type: 'cherubim_patience_per_card', value: 4 }],
    onPlayEffects: [{ type: 'patience_gain_all', value: 7 }, { type: 'seraphim_bonus_amplifier', value: 0.25 }, { type: 'oblivion_flat', value: 300 }],
  },
  {
    definitionId: 'btei-architects-manifold',
    type: 'Cherubim',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: "Architect's Manifold",
    description: 'On play: All Seraphim on board gain +10 Patience; Designate the Seraphim with the highest Patience as your Vessel; Redistribute up to 6 Vessel Patience across your other Seraphim; +500 Oblivion. While on board: Adjacent Seraphim gain +5 Patience per card played',
    artKey: 'btei_architects_manifold',
    // Role: Vessel redistributor Cherubim. Sets the Vessel and shares a slice
    // of its Patience across the rest of the line ? evens the pool while the
    // passive keeps adding fresh Patience each card played.
    effects: [{ type: 'cherubim_patience_per_card', value: 5 }],
    onPlayEffects: [{ type: 'patience_gain_all', value: 10 }, { type: 'neutrality_designate_vessel' }, { type: 'neutrality_vessel_redistribute', value: 6 }, { type: 'oblivion_flat', value: 500 }],
  }];

export const eternalAngels: AngelDefinition[] = [
  {
    definitionId: 'btei-convergence-of-eternity',
    type: 'Angel',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Convergence of Eternity',
    description: 'On summon: All Seraphim on board gain +14 Patience; Designate the Seraphim with the highest Patience as your Vessel; Your Vessel copies 35% of Patience gained by other Seraphim this turn. After 5 cards played: Double all Patience on the board; Redistribute up to 10 Vessel Patience across your other Seraphim; All Seraphim on board gain +6 Patience; Empower the next card you play. While on board: +130 Oblivion per card played while on board',
    artKey: 'btei_convergence_of_eternity',
    summonCost: [],
    extraSummonConditions: [
      { type: 'seraphim_on_board_gte', value: 2 }],
    // Role: Vessel-kit Angel. Anoints the Vessel and arms a copy mirror on
    // summon; the activated ability later doubles all Patience and
    // redistributes a slice of the Vessel pool ? a two-phase Patience engine.
    onSummonEffects: [
      { type: 'patience_gain_all', value: 14 },
      { type: 'neutrality_designate_vessel' },
      { type: 'neutrality_vessel_copy_gain', percent: 35 }],
    activatedAbility: {
      name: 'Infinite Merge',
      cardsPlayedRequirement: 5,
      description: 'Double all Patience on the board; Redistribute up to 10 Vessel Patience across your other Seraphim; All Seraphim on board gain +6 Patience; Empower the next card you play',
      effects: [
        { type: 'patience_double_all' },
        { type: 'neutrality_vessel_redistribute', value: 10 },
        { type: 'patience_gain_all', value: 6 },
        { type: 'multiply_next' }],
    },
    attacks: {
      primary: {
        id: 'btei-convergence-of-eternity:primary',
        label: 'Primary',
        name: 'Convergence of Ordinance',
        description: '1930 base Oblivion · 6 cards cooldown',
        baseOblivion: 1930,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'neutrality'],
      },
      exalted: {
        id: 'btei-convergence-of-eternity:exalted',
        label: 'Exalted',
        name: 'Convergence of Throne Decree',
        description: '4920 base Oblivion · 9 cards cooldown',
        baseOblivion: 4920,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'neutrality'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 130 },
  },
  {
    definitionId: 'btei-omniscient-fracture',
    type: 'Angel',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Omniscient Fracture',
    description: 'On summon: All Seraphim on board gain +18 Patience; Mark up to 4 other cards in hand; marked cards grant +3 Patience to all Seraphim when played. After 6 cards played: Double all Patience on the board; Seraphim attacks preserve 40% of consumed Patience this turn; All Seraphim on board gain +8 Patience; Empower the next card you play; +600 Oblivion. While on board: +200 Oblivion per card played while on board',
    artKey: 'btei_omniscient_fracture',
    summonCost: [],
    extraSummonConditions: [
      { type: 'seraphim_on_board_gte', value: 3 }],
    // Role: Mass hand-marker Angel. Pre-loads upcoming plays with Patience
    // riders on summon, then the awakened ability hardens those gains with
    // attack-preserve so subsequent Seraphim attacks keep most of the pool.
    onSummonEffects: [
      { type: 'patience_gain_all', value: 18 },
      { type: 'neutrality_mark_hand', count: 4, patience: 3 }],
    activatedAbility: {
      name: 'Parallax Collapse',
      cardsPlayedRequirement: 6,
      description: 'Double all Patience on the board; Seraphim attacks preserve 40% of consumed Patience this turn; All Seraphim on board gain +8 Patience; Empower the next card you play; +600 Oblivion',
      effects: [
        { type: 'patience_double_all' },
        { type: 'neutrality_attack_preserve', percent: 40 },
        { type: 'patience_gain_all', value: 8 },
        { type: 'multiply_next' },
        { type: 'oblivion_flat', value: 600 }],
    },
    attacks: {
      primary: {
        id: 'btei-omniscient-fracture:primary',
        label: 'Primary',
        name: 'Omniscient Fracture Ordinance',
        description: '2070 base Oblivion · 6 cards cooldown',
        baseOblivion: 2070,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'neutrality'],
      },
      exalted: {
        id: 'btei-omniscient-fracture:exalted',
        label: 'Exalted',
        name: 'Omniscient Fracture Throne Decree',
        description: '5280 base Oblivion · 9 cards cooldown',
        baseOblivion: 5280,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'neutrality'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 200 },
  }];

export const expansionEternalCards: Array<OphanimDefinition | SeraphimDefinition | CherubimDefinition | AngelDefinition> = [
  {
    definitionId: 'btei-neutrality-paradox-crown',
    type: 'Ophanim',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Paradox Throne',
    description: '+0 Oblivion; All Seraphim on board gain +4 Patience; Look at the top 8 cards, take 2 cards, put 2 cards on the bottom, and discard the rest; Mark up to 3 other cards in hand; marked cards grant +3 Patience to all Seraphim when played; Empower the next card you play',
    artKey: 'btei_neutrality_paradox_crown',
    // Role: Curated hand-marker. Deep-look picks 2 specific cards out of 8,
    // then stamps the new hand with Patience riders so the chosen plays
    // arrive PRE-LOADED with bonuses. Set-up Ophanim for a payoff turn.
    effects: [
      { type: 'oblivion_flat', value: 0 },
      { type: 'patience_gain_all', value: 4 },
      { type: 'look_top_take_drop', look: 8, take: 2, drop: 2 },
      { type: 'neutrality_mark_hand', count: 3, patience: 3 },
      { type: 'multiply_next' }],
  },
  {
    definitionId: 'btei-neutrality-zero-edict',
    type: 'Cherubim',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Void Exchequer',
    description: 'On play: All Seraphim on board gain +7 Patience; Mark up to 2 other cards in hand; marked cards grant +2 Patience to all Seraphim when played. While on board: Adjacent Seraphim gain +5 Patience per card played',
    artKey: 'btei_neutrality_zero_edict',
    // Role: Hand-marker Cherubim. Stamps a couple of upcoming cards with
    // small Patience riders so the trickle lands on the right plays ?
    // synergizes with the passive's per-card adjacent Patience.
    effects: [{ type: 'cherubim_patience_per_card', value: 5 }],
    onPlayEffects: [{ type: 'patience_gain_all', value: 7 }, { type: 'neutrality_mark_hand', count: 2, patience: 2 }],
  },
  {
    definitionId: 'btei-neutrality-void-throne',
    type: 'Seraphim',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Equilibrium Rex',
    description: 'On play: All Seraphim on board gain +8 Patience; After each Seraphim attack this turn, restore 20% of consumed Patience to that attacker; Salvage any 1 card. While on board: +180 Oblivion whenever you play an Ophanim while active. Patience: +1 stack per card played; on attack, each stack → +15 Oblivion',
    artKey: 'btei_neutrality_void_throne',
    attacks: {
      unsynergized: {
        id: 'btei-neutrality-void-throne:unsynergized',
        label: 'Unsynergized',
        name: 'Equilibrium Rex Vector Break',
        description: '2440 base Oblivion · 6 cards cooldown',
        baseOblivion: 2440,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'neutrality'],
      },
      synergized: {
        id: 'btei-neutrality-void-throne:synergized',
        label: 'Synergized',
        name: 'Equilibrium Rex Angelic Verdict',
        description: '4148 base Oblivion · 7 cards cooldown · Requires Angel',
        baseOblivion: 4148,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'neutrality'],
      },
    },
    baseStats: { bonusType: 'ophanim_bonus', bonusValue: 180, synergyRequirement: 'Neutrality' },
    patienceThreshold: 6,
    // Role: Attack-restore engine. Arms Seraphim attacks to refund a share
    // of consumed Patience so the board keeps firing across the turn instead
    // of bleeding dry after one big swing.
    onPlayEffects: [{ type: 'patience_gain_all', value: 8 }, { type: 'neutrality_attack_restore', percent: 20 }, { type: 'salvage_any' }],
  },
  {
    definitionId: 'btei-neutrality-axiom-maw',
    type: 'Angel',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Axiom Maw',
    description: 'On summon: All Seraphim on board gain +12 Patience; Link Seraphim this turn: patience gains grant +2 extra to all linked Seraphim and non-attacking linked Seraphim retain 30% Patience after each linked attack; Empower the next card you play. After 4 cards played: Double all Patience on the board; After each Seraphim attack this turn, restore 35% of consumed Patience to that attacker; All Seraphim on board gain +6 Patience; Seraphim bonuses are amplified by +0.2; +1400 Oblivion. While on board: +190 Oblivion per card played while on board',
    artKey: 'btei_neutrality_axiom_maw',
    summonCost: [],
    extraSummonConditions: [{ type: 'seraphim_on_board_gte', value: 2 }],
    // Role: Linked-mode Angel. Summon activates Link Mode so the team
    // shares Patience gains; the awakened ability layers attack-restore so
    // every Seraphim attack refunds a slice into the linked pool.
    onSummonEffects: [{ type: 'patience_gain_all', value: 12 }, { type: 'neutrality_linked_mode', gain: 2, retainPercent: 30 }, { type: 'multiply_next' }],
    activatedAbility: {
      name: 'Axiom Devour',
      cardsPlayedRequirement: 4,
      description: 'Double all Patience on the board; After each Seraphim attack this turn, restore 35% of consumed Patience to that attacker; All Seraphim on board gain +6 Patience; Seraphim bonuses are amplified by +0.2; +1400 Oblivion',
      effects: [{ type: 'patience_double_all' }, { type: 'neutrality_attack_restore', percent: 35 }, { type: 'patience_gain_all', value: 6 }, { type: 'seraphim_bonus_amplifier', value: 0.20 }, { type: 'oblivion_flat', value: 1400 }],
    },
    attacks: {
      primary: {
        id: 'btei-neutrality-axiom-maw:primary',
        label: 'Primary',
        name: 'Axiom Maw Ordinance',
        description: '2050 base Oblivion · 6 cards cooldown',
        baseOblivion: 2050,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'neutrality'],
      },
      exalted: {
        id: 'btei-neutrality-axiom-maw:exalted',
        label: 'Exalted',
        name: 'Axiom Maw Throne Decree',
        description: '5230 base Oblivion · 9 cards cooldown',
        baseOblivion: 5230,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'neutrality'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 190 },
  },
  {
    definitionId: 'btei-neutrality-prime-equilibrium',
    type: 'Ophanim',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Prime Judge of Silence',
    description: 'All Seraphim on board gain +3 Patience; If this is the first card you played this turn, Mark up to 3 other cards in hand; marked cards grant +3 Patience to all Seraphim when played; All Seraphim on board gain +6 Patience; +1000 Oblivion; If you have played 1+ cards this turn, Designate the Seraphim with the highest Patience as your Vessel; Redistribute up to 4 Vessel Patience across your other Seraphim; All Seraphim on board gain +4 Patience; +500 Oblivion',
    artKey: 'btei_neutrality_prime_equilibrium',
    // Role: Branching Patience opener vs. closer. As FIRST card it stamps the
    // whole hand with Patience riders for the rest of the turn; played LATER
    // it redistributes Vessel patience instead. Two distinct play patterns.
    effects: [
      { type: 'patience_gain_all', value: 3 },
      { type: 'conditional', condition: { type: 'first_card_this_turn' }, then: [{ type: 'neutrality_mark_hand', count: 3, patience: 3 }, { type: 'patience_gain_all', value: 6 }, { type: 'oblivion_flat', value: 1000 }] },
      { type: 'conditional', condition: { type: 'cards_played_gte', value: 1 }, then: [{ type: 'neutrality_designate_vessel' }, { type: 'neutrality_vessel_redistribute', value: 4 }, { type: 'patience_gain_all', value: 4 }, { type: 'oblivion_flat', value: 500 }] }],
  },
  {
    definitionId: 'btei-pyroabyss-cinder-cataclysm',
    type: 'Cherubim',
    element: 'Fire',
    rarity: 'Eternal',
    name: 'Cinder Leviathan',
    description: 'On play: Gain 18 Embers; Stoke 16 Furnace Pressure; Gain 2 Inferno Tiers; Gain 1 Cinder Echo. While on board: Adjacent active Seraphim gain +90 Oblivion per card played',
    artKey: 'btei_pyroabyss_cinder_cataclysm',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 90 }],
    // Role: passive Cinder Echo battery. Slow, reliable echo generator that
    // also adjacent-buffs Seraphim. Builds echo pool for other cards to ignite.
    onPlayEffects: [{ type: 'ember_gain', value: 18 }, { type: 'pyro_furnace_pressure_gain', value: 16 }, { type: 'eternal_stack_gain', stack: 'pyro', value: 2 }, { type: 'set_secondary_gain', kind: 'pyro', value: 1 }],
  },
  {
    definitionId: 'btei-pyroabyss-ashfall-engine',
    type: 'Ophanim',
    element: 'Fire',
    rarity: 'Eternal',
    name: 'Ash Kings Unbound',
    description: 'Gain 22 Embers; Stoke 12 Furnace Pressure; Open 1 Ruin Window; If Furnace Pressure is 10+, Gain 3 Inferno Tiers; Gain 2 Cinder Echoes; Ignite up to 1 Cinder Echoes (+80.0 Oblivion × echoes²)',
    artKey: 'btei_pyroabyss_ashfall_engine',
    // Role: Pressure-gated quick-pop. Build echoes via Pressure threshold and
    // immediately spark a tiny quadratic burst (1 echo => 12*x). Tempo card.
    effects: [{ type: 'ember_gain', value: 22 }, { type: 'pyro_furnace_pressure_gain', value: 12 }, { type: 'pyro_ruin_window_gain', value: 1 }, { type: 'conditional', condition: { type: 'pyro_furnace_pressure_gte', value: 10 }, then: [{ type: 'eternal_stack_gain', stack: 'pyro', value: 3 }, { type: 'set_secondary_gain', kind: 'pyro', value: 2 }, { type: 'pyro_cinder_echo_ignite', oblivionPerEchoSquared: 80, consume: 1 }] }],
  },
  {
    definitionId: 'btei-pyroabyss-infernal-archon',
    type: 'Seraphim',
    element: 'Fire',
    rarity: 'Eternal',
    name: 'Infernal Suncore',
    description: 'On play: Gain 18 Embers; Stoke 20 Furnace Pressure; Forge 6 Abyss Fault; Empower the next card you play; If you have 3+ Inferno Tiers, Spend 3 Inferno Tiers; Gain 2 Cinder Echoes; Ignite up to 2 Cinder Echoes (+120.0 Oblivion × echoes²); Empower the next card you play. While on board: +35 Oblivion per card played while active',
    artKey: 'btei_pyroabyss_infernal_archon',
    attacks: {
      unsynergized: {
        id: 'btei-pyroabyss-infernal-archon:unsynergized',
        label: 'Unsynergized',
        name: 'Infernal Suncore Vector Break',
        description: '2130 base Oblivion · 6 cards cooldown',
        baseOblivion: 2130,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'fire'],
      },
      synergized: {
        id: 'btei-pyroabyss-infernal-archon:synergized',
        label: 'Synergized',
        name: 'Infernal Suncore Angelic Verdict',
        description: '3621 base Oblivion · 7 cards cooldown · Requires Angel',
        baseOblivion: 3621,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'fire'],
      },
    },
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 35, synergyRequirement: 'Fire' },
    // Role: Stack -> Echo converter. Spends Inferno Tiers to MINT Cinder Echoes
    // and immediately ignites a small quadratic burst. The only card that turns
    // primary stacks INTO secondary echoes ? unique transformer.
    onPlayEffects: [{ type: 'ember_gain', value: 18 }, { type: 'pyro_furnace_pressure_gain', value: 20 }, { type: 'pyro_abyss_fault_gain', value: 6 }, { type: 'multiply_next' }, { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'pyro', value: 3 }, then: [{ type: 'eternal_stack_spend', stack: 'pyro', value: 3 }, { type: 'set_secondary_gain', kind: 'pyro', value: 2 }, { type: 'pyro_cinder_echo_ignite', oblivionPerEchoSquared: 120, consume: 2 }, { type: 'multiply_next' }] }],
  },
  {
    definitionId: 'btei-pyroabyss-hellrift-mandala',
    type: 'Angel',
    element: 'Fire',
    rarity: 'Eternal',
    name: 'Riftbell Catastrophe',
    description: 'On summon: Gain 28 Embers; Stoke 26 Furnace Pressure; Open 2 Ruin Windows; Gain 4 Inferno Tiers; Gain 3 Cinder Echoes. After 5 cards played: Convert Pressure to Fault (12 Pressure per Fault, gain 12 up to 24); Cash out all Inferno Tiers (+400 Oblivion per stack); Ignite all Cinder Echoes (+150.0 Oblivion × echoes²); Search your deck for 1 matching Ophanim or Cherubim; Stoke 4 Furnace Pressure; Empower the next card you play. While on board: +175 Oblivion per card played while on board',
    artKey: 'btei_pyroabyss_hellrift_mandala',
    summonCost: [],
    extraSummonConditions: [{ type: 'cherubim_active_gte', value: 1 }],
    // Role: Apex Cinder Echo igniter. Highest quadratic coefficient in the set;
    // its activated ability is the BIG ECHO BOMB ? best when many echoes pooled.
    onSummonEffects: [{ type: 'ember_gain', value: 28 }, { type: 'pyro_furnace_pressure_gain', value: 26 }, { type: 'pyro_ruin_window_gain', value: 2 }, { type: 'eternal_stack_gain', stack: 'pyro', value: 4 }, { type: 'set_secondary_gain', kind: 'pyro', value: 3 }],
    activatedAbility: {
      name: 'Rift Verdict',
      cardsPlayedRequirement: 5,
      description: 'Convert Pressure to Fault (12 Pressure per Fault, gain 12 up to 24); Cash out all Inferno Tiers (+400 Oblivion per stack); Ignite all Cinder Echoes (+150.0 Oblivion × echoes²); Search your deck for 1 matching Ophanim or Cherubim; Stoke 4 Furnace Pressure; Empower the next card you play',
      effects: [{ type: 'pyro_convert_pressure_to_fault', pressurePerFault: 12, faultGain: 12, maxFaultGain: 24 }, { type: 'eternal_stack_cashout', stack: 'pyro', oblivionPerStack: 400 }, { type: 'pyro_cinder_echo_ignite', oblivionPerEchoSquared: 150 }, { type: 'search_deck_by_type', filter: ['Ophanim', 'Cherubim'] }, { type: 'pyro_furnace_pressure_gain', value: 4 }, { type: 'multiply_next' }],
    },
    attacks: {
      primary: {
        id: 'btei-pyroabyss-hellrift-mandala:primary',
        label: 'Primary',
        name: 'Riftbell Catastrophe Ordinance',
        description: '2020 base Oblivion · 6 cards cooldown',
        baseOblivion: 2020,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'fire'],
      },
      exalted: {
        id: 'btei-pyroabyss-hellrift-mandala:exalted',
        label: 'Exalted',
        name: 'Riftbell Catastrophe Throne Decree',
        description: '5150 base Oblivion · 9 cards cooldown',
        baseOblivion: 5150,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'fire'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 175 },
  },
  {
    definitionId: 'btei-pyroabyss-oblivion-phoenix',
    type: 'Ophanim',
    element: 'Fire',
    rarity: 'Eternal',
    name: 'Phoenix Judge of the Abyss',
    description: 'Gain 14 Embers; Stoke 18 Furnace Pressure; Forge 8 Abyss Fault; Gain 2 Inferno Tiers; +1000 Oblivion; If Pressure and Fault are balanced, If pools are balanced, +180 Oblivion per Pressure-Fault pair; Gain 1 Cinder Echo; If you have 5+ Inferno Tiers, +2000 Oblivion; Gain 1 Cinder Echo; Ignite up to 2 Cinder Echoes (+90.0 Oblivion × echoes²); Empower the next card you play; If you have played 4+ cards this turn, +1600 Oblivion; Gain 1 Cinder Echo; Empower the next card you play',
    artKey: 'btei_pyroabyss_oblivion_phoenix',
    // Role: Escalating Cinder Echo generator. +1 echo per threshold met
    // (pools balanced / stacks >= 5 / 4+ cards played). At stack >= 5, also
    // ignites half the pool for a combo finish. State-dependent escalator.
    effects: [
      { type: 'ember_gain', value: 14 },
      { type: 'pyro_furnace_pressure_gain', value: 18 },
      { type: 'pyro_abyss_fault_gain', value: 8 },
      { type: 'eternal_stack_gain', stack: 'pyro', value: 2 },
      { type: 'oblivion_flat', value: 1000 },
      { type: 'conditional', condition: { type: 'pyro_pools_balanced' }, then: [{ type: 'pyro_balance_bonus', oblivionPerPair: 180 }, { type: 'set_secondary_gain', kind: 'pyro', value: 1 }] },
      { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'pyro', value: 5 }, then: [{ type: 'oblivion_flat', value: 2000 }, { type: 'set_secondary_gain', kind: 'pyro', value: 1 }, { type: 'pyro_cinder_echo_ignite', oblivionPerEchoSquared: 90, consume: 2 }, { type: 'multiply_next' }] },
      { type: 'conditional', condition: { type: 'cards_played_gte', value: 4 }, then: [{ type: 'oblivion_flat', value: 1600 }, { type: 'set_secondary_gain', kind: 'pyro', value: 1 }, { type: 'multiply_next' }] }],
  },
  {
    definitionId: 'btei-light-sunbreak-canon',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Eternal',
    name: 'Aurora Throne',
    description: 'Gain 24 Radiance; Gain 2 Cadence; Gain 1 Anchor; If you have 1+ Chorus Anchors, Gain 1 Halo Crown; Gain 1 Halo Cascade; If you have 2+ Chorus Anchors, Gain 1 Halo Crown; Gain 1 Halo Cascade; If you have 3+ Chorus Anchors, Gain 1 Halo Crown; Gain 1 Halo Cascade; If you have 4+ Chorus Anchors, Gain 1 Halo Crown; Gain 1 Halo Cascade; Look at the top 7 cards and take 1 matching Ophanim or Seraphim',
    artKey: 'btei_light_sunbreak_canon',
    // Role: ANCHOR-MIRROR cascade generator. Gains 1 Halo Cascade for each
    // Chorus Anchor threshold met (mirrors the stack-per-anchor pattern).
    // Slow but reliable; never resounds itself ? feeds other resounders.
    effects: [{ type: 'radiance_gain', value: 24 }, { type: 'light_resonance_gain', value: 2 }, { type: 'light_anchor_gain', value: 1 }, { type: 'conditional', condition: { type: 'light_chorus_anchors_gte', value: 1 }, then: [{ type: 'eternal_stack_gain', stack: 'light', value: 1 }, { type: 'set_secondary_gain', kind: 'light', value: 1 }] }, { type: 'conditional', condition: { type: 'light_chorus_anchors_gte', value: 2 }, then: [{ type: 'eternal_stack_gain', stack: 'light', value: 1 }, { type: 'set_secondary_gain', kind: 'light', value: 1 }] }, { type: 'conditional', condition: { type: 'light_chorus_anchors_gte', value: 3 }, then: [{ type: 'eternal_stack_gain', stack: 'light', value: 1 }, { type: 'set_secondary_gain', kind: 'light', value: 1 }] }, { type: 'conditional', condition: { type: 'light_chorus_anchors_gte', value: 4 }, then: [{ type: 'eternal_stack_gain', stack: 'light', value: 1 }, { type: 'set_secondary_gain', kind: 'light', value: 1 }] }, { type: 'look_top_take_type', look: 7, filter: ['Ophanim', 'Seraphim'] }],
  },
  {
    definitionId: 'btei-light-aureate-rapture',
    type: 'Seraphim',
    element: 'Light',
    rarity: 'Eternal',
    name: 'Sanctum Breaker',
    description: 'On play: Gain 26 Radiance; Gain 2 Cadence; Gain 1 Anchor; Gain 2 Halo Crowns; Gain 1 Halo Cascade; If you have 3+ Halo Crowns, Spend 3 Halo Crowns; +1400 Oblivion; Resound up to 1 Halo Cascades (cascade bonus per cascade); Empower the next card you play; Search your deck for 1 matching Ophanim or Cherubim. While on board: +170 Oblivion per card played while active',
    artKey: 'btei_light_aureate_rapture',
    attacks: {
      unsynergized: {
        id: 'btei-light-aureate-rapture:unsynergized',
        label: 'Unsynergized',
        name: 'Sanctum Breaker Vector Break',
        description: '2770 base Oblivion · 6 cards cooldown',
        baseOblivion: 2770,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'light'],
      },
      synergized: {
        id: 'btei-light-aureate-rapture:synergized',
        label: 'Synergized',
        name: 'Sanctum Breaker Angelic Verdict',
        description: '4709 base Oblivion · 7 cards cooldown · Requires Angel',
        baseOblivion: 4709,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'light'],
      },
    },
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 170, synergyRequirement: 'Light' },
    // Role: STACK••CASCADE pulse converter. When it spends 3 Halo Crowns, also
    // resounds 1 Halo Cascade for a mid-turn chain-floor bump ? turns burst
    // payoff INTO sustained floor for later cards. Tempo-attacker bridge.
    onPlayEffects: [{ type: 'radiance_gain', value: 26 }, { type: 'light_resonance_gain', value: 2 }, { type: 'light_anchor_gain', value: 1 }, { type: 'eternal_stack_gain', stack: 'light', value: 2 }, { type: 'set_secondary_gain', kind: 'light', value: 1 }, { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'light', value: 3 }, then: [{ type: 'eternal_stack_spend', stack: 'light', value: 3 }, { type: 'oblivion_flat', value: 1400 }, { type: 'light_halo_cascade_resound', oblivionPerCascade: 240, consume: 1 }, { type: 'multiply_next' }] }, { type: 'search_deck_by_type', filter: ['Ophanim', 'Cherubim'] }],
  },
  {
    definitionId: 'btei-light-choir-imperator',
    type: 'Cherubim',
    element: 'Light',
    rarity: 'Eternal',
    name: 'Choral Tyrant',
    description: 'On play: Gain 18 Radiance; Gain 1 Anchor; Gain 2 Halo Crowns; Gain 2 Halo Cascades; Salvage 1 card matching Ophanim. While on board: All Oblivion gain +12%',
    artKey: 'btei_light_choir_imperator',
    maxDurability: 7,
    effects: [{ type: 'cherubim_global_oblivion_mult', value: 0.12 }],
    // Role: PASSIVE cascade BATTERY. Gains 2 Halo Cascades on play and never
    // resounds. Back-row support that fuels Sanctum Breaker / Halo Legion / Morning Crown.
    onPlayEffects: [{ type: 'radiance_gain', value: 18 }, { type: 'light_anchor_gain', value: 1 }, { type: 'eternal_stack_gain', stack: 'light', value: 2 }, { type: 'set_secondary_gain', kind: 'light', value: 2 }, { type: 'salvage_by_type', filter: ['Ophanim'] }],
  },
  {
    definitionId: 'btei-light-halo-dominion',
    type: 'Angel',
    element: 'Light',
    rarity: 'Eternal',
    name: 'Halo Legion Prime',
    description: 'On summon: Gain 38 Radiance; Gain 3 Cadence; Gain 1 Anchor; Gain 4 Halo Crowns; Gain 3 Halo Cascades. After 6 cards played: Double current Radiance; Gain 3 Cadence; Gain 1 Anchor; Cash out all Halo Crowns (+450 Oblivion per stack); Resound all Halo Cascades (cascade bonus per cascade); Gain 6 Radiance; +1800 Oblivion. While on board: +210 Oblivion per card played while on board',
    artKey: 'btei_light_halo_dominion',
    summonCost: [],
    extraSummonConditions: [{ type: 'seraphim_on_board_gte', value: 3 }],
    // Role: APEX RESONATOR. Activated ability resounds ALL Halo Cascades for
    // the largest mid-turn chain-floor lift in the set (oblivionPerCascade: 300).
    onSummonEffects: [{ type: 'radiance_gain', value: 38 }, { type: 'light_resonance_gain', value: 3 }, { type: 'light_anchor_gain', value: 1 }, { type: 'eternal_stack_gain', stack: 'light', value: 4 }, { type: 'set_secondary_gain', kind: 'light', value: 3 }],
    activatedAbility: {
      name: 'Dominion Hymn',
      cardsPlayedRequirement: 6,
      description: 'Double current Radiance; Gain 3 Cadence; Gain 1 Anchor; Cash out all Halo Crowns (+450 Oblivion per stack); Resound all Halo Cascades (cascade bonus per cascade); Gain 6 Radiance; +1800 Oblivion',
      effects: [{ type: 'radiance_double' }, { type: 'light_resonance_gain', value: 3 }, { type: 'light_anchor_gain', value: 1 }, { type: 'eternal_stack_cashout', stack: 'light', oblivionPerStack: 450 }, { type: 'light_halo_cascade_resound', oblivionPerCascade: 300 }, { type: 'radiance_gain', value: 6 }, { type: 'oblivion_flat', value: 1800 }],
    },
    attacks: {
      primary: {
        id: 'btei-light-halo-dominion:primary',
        label: 'Primary',
        name: 'Halo Legion Ordinance',
        description: '2090 base Oblivion · 6 cards cooldown',
        baseOblivion: 2090,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'light'],
      },
      exalted: {
        id: 'btei-light-halo-dominion:exalted',
        label: 'Exalted',
        name: 'Halo Legion Throne Decree',
        description: '5330 base Oblivion · 9 cards cooldown',
        baseOblivion: 5330,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'light'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 210 },
  },
  {
    definitionId: 'btei-light-throne-of-morning',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Eternal',
    name: 'Morning Crown Absolute',
    description: 'Gain 26 Radiance; Gain 2 Cadence; Gain 1 Anchor; Gain 3 Halo Crowns; If you have 5+ Halo Crowns, +2200 Oblivion; Gain 1 Halo Cascade; Empower the next card you play; If you have 3+ Chorus Anchors, +2400 Oblivion; Gain 1 Halo Cascade; Resound up to 2 Halo Cascades (cascade bonus per cascade); Empower the next card you play; If you control 3+ active Seraphim, +2000 Oblivion; Gain 1 Halo Cascade',
    artKey: 'btei_light_throne_of_morning',
    // Role: ESCALATOR. +1 Halo Cascade per threshold met; at chorus ? 3 also
    // resounds 2 cascades for mid-turn floor lift. Rewards multi-state mastery.
    effects: [
      { type: 'radiance_gain', value: 26 },
      { type: 'light_resonance_gain', value: 2 },
      { type: 'light_anchor_gain', value: 1 },
      { type: 'eternal_stack_gain', stack: 'light', value: 3 },
      { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'light', value: 5 }, then: [{ type: 'oblivion_flat', value: 2200 }, { type: 'set_secondary_gain', kind: 'light', value: 1 }, { type: 'multiply_next' }] },
      { type: 'conditional', condition: { type: 'light_chorus_anchors_gte', value: 3 }, then: [{ type: 'oblivion_flat', value: 2400 }, { type: 'set_secondary_gain', kind: 'light', value: 1 }, { type: 'light_halo_cascade_resound', oblivionPerCascade: 210, consume: 2 }, { type: 'multiply_next' }] },
      { type: 'conditional', condition: { type: 'seraphim_active_gte', value: 3 }, then: [{ type: 'oblivion_flat', value: 2000 }, { type: 'set_secondary_gain', kind: 'light', value: 1 }] }],
  },
  {
    definitionId: 'btei-thornbound-briar-siege',
    type: 'Ophanim',
    element: 'Thornbound',
    rarity: 'Eternal',
    name: 'Bleeding Road Matriarch',
    description: 'Gain 31 Trail; Gain 2 Thorncrowns; Gain 1 Briar Spiral; Salvage any 1 card; If you have 60+ Trail, Spend 25 Trail; +1400 Oblivion; Empower the next card you play',
    artKey: 'btei_thornbound_briar_siege',
    // Role: PASSIVE BRIAR SPIRAL BATTERY. Gains 1 Briar Spiral on play and
    // never blooms ? reliable seed for other bloomers down the chain.
    effects: [
      { type: 'trail_gain', value: 31 },
      { type: 'eternal_stack_gain', stack: 'thorn', value: 2 },
      { type: 'set_secondary_gain', kind: 'thorn', value: 1 },
      { type: 'salvage_any' },
      { type: 'conditional', condition: { type: 'trail_gte', value: 60 }, then: [{ type: 'trail_spend', value: 25 }, { type: 'oblivion_flat', value: 1400 }, { type: 'multiply_next' }] }],
  },
  {
    definitionId: 'btei-thornbound-red-march',
    type: 'Cherubim',
    element: 'Thornbound',
    rarity: 'Eternal',
    name: 'Ragged Banner Host',
    description: 'On play: Gain 30 Trail; Gain 1 Thorncrown; Gain 1 Briar Spiral; If you have 100+ Trail, Gain 2 Thorncrowns; Gain 2 Briar Spirals; If you have 50+ Trail, Spend 20 Trail; +1200 Oblivion. While on board: Adjacent active Seraphim gain +120 Oblivion per card played',
    artKey: 'btei_thornbound_red_march',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 120 }],
    // Role: TRAIL CONVERTER. Each trail threshold reached also seeds a Briar Spiral,
    // turning sustained Trail mass into more bloom potential.
    onPlayEffects: [
      { type: 'trail_gain', value: 30 },
      { type: 'eternal_stack_gain', stack: 'thorn', value: 1 },
      { type: 'set_secondary_gain', kind: 'thorn', value: 1 },
      { type: 'conditional', condition: { type: 'trail_gte', value: 100 }, then: [{ type: 'eternal_stack_gain', stack: 'thorn', value: 2 }, { type: 'set_secondary_gain', kind: 'thorn', value: 2 }] },
      { type: 'conditional', condition: { type: 'trail_gte', value: 50 }, then: [{ type: 'trail_spend', value: 20 }, { type: 'oblivion_flat', value: 1200 }] }],
  },
  {
    definitionId: 'btei-thornbound-cathedral-lancer',
    type: 'Seraphim',
    element: 'Thornbound',
    rarity: 'Eternal',
    name: 'Cathedral Lance',
    description: 'On play: Gain 28 Trail; Gain 2 Thorncrowns; Gain 1 Briar Spiral; Gain 2 Trail; Gain +90% total Oblivion this turn; If you have 4+ Thorncrowns, Spend 4 Thorncrowns; +1600 Oblivion; Bloom up to 1 Briar Spirals (+25 Trail per spiral); Empower the next card you play; If you have 70+ Trail, Spend 30 Trail; Empower the next card you play; +1000 Oblivion. While on board: Each new Cherubim summoned while active gains +1 durability',
    artKey: 'btei_thornbound_cathedral_lancer',
    attacks: {
      unsynergized: {
        id: 'btei-thornbound-cathedral-lancer:unsynergized',
        label: 'Unsynergized',
        name: 'Cathedral Lance Vector Break',
        description: '475 base Oblivion · 4 cards cooldown · Cost: spend 27 Trail',
        baseOblivion: 2105,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'thornbound'],
      },
      synergized: {
        id: 'btei-thornbound-cathedral-lancer:synergized',
        label: 'Synergized',
        name: 'Cathedral Lance Angelic Verdict',
        description: '723 base Oblivion · 7 cards cooldown · Requires Angel · Cost: spend 8 Trail, discard 1 card',
        baseOblivion: 3579,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'thornbound'],
      },
    },
    baseStats: { bonusType: 'cherubim_extra_plays', bonusValue: 1, synergyRequirement: 'Thornbound' },
    // Role: TRAIL-PUMP BLOOMER. Inside the Thorncrown spend, ALSO blooms 1 Briar Spiral
    // for +25 Trail / +0.02 chain per current Trail ? modest single-spiral pulse.
    onPlayEffects: [
      { type: 'trail_gain', value: 28 },
      { type: 'eternal_stack_gain', stack: 'thorn', value: 2 },
      { type: 'set_secondary_gain', kind: 'thorn', value: 1 },
      { type: 'trail_gain', value: 2 },
      { type: 'score_multiplier', value: 90 },
      { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'thorn', value: 4 }, then: [{ type: 'eternal_stack_spend', stack: 'thorn', value: 4 }, { type: 'oblivion_flat', value: 1600 }, { type: 'thorn_briar_spiral_bloom', trailPerSpiral: 25, oblivionPerTrail: 12, consume: 1 }, { type: 'multiply_next' }] },
      { type: 'conditional', condition: { type: 'trail_gte', value: 70 }, then: [{ type: 'trail_spend', value: 30 }, { type: 'multiply_next' }, { type: 'oblivion_flat', value: 1000 }] }],
  },
  {
    definitionId: 'btei-thornbound-funeral-bramble',
    type: 'Angel',
    element: 'Thornbound',
    rarity: 'Eternal',
    name: 'Grave Hedge Reliquary',
    description: 'On summon: Gain 35 Trail; Gain 3 Thorncrowns; Gain 2 Briar Spirals; Look at the top 6 cards, take 2 cards, put 2 cards on the bottom, and discard the rest. After 5 cards played: Spend 50 Trail; Cash out all Thorncrowns (+500 Oblivion per stack); Bloom all Briar Spirals (+30 Trail per spiral); Salvage any 1 card; Gain 6 Trail; +1800 Oblivion; If you have 80+ Trail, Empower the next card you play; +1500 Oblivion. While on board: +205 Oblivion per card played while on board',
    artKey: 'btei_thornbound_funeral_bramble',
    summonCost: [],
    extraSummonConditions: [{ type: 'seraphim_on_board_gte', value: 2 }],
    onSummonEffects: [{ type: 'trail_gain', value: 35 }, { type: 'eternal_stack_gain', stack: 'thorn', value: 3 }, { type: 'set_secondary_gain', kind: 'thorn', value: 2 }, { type: 'look_top_take_drop', look: 6, take: 2, drop: 2 }],
    activatedAbility: {
      name: 'Dirge Corridor',
      cardsPlayedRequirement: 5,
      description: 'Spend 50 Trail; Cash out all Thorncrowns (+500 Oblivion per stack); Bloom all Briar Spirals (+30 Trail per spiral); Salvage any 1 card; Gain 6 Trail; +1800 Oblivion; If you have 80+ Trail, Empower the next card you play; +1500 Oblivion',
      // Role: APEX BLOOM. Activated ability blooms ALL Briar Spirals ? highest
      // trailPerSpiral (30) so it stacks the chain growth heavily off existing trail.
      effects: [{ type: 'trail_spend', value: 50 }, { type: 'eternal_stack_cashout', stack: 'thorn', oblivionPerStack: 500 }, { type: 'thorn_briar_spiral_bloom', trailPerSpiral: 30, oblivionPerTrail: 125 }, { type: 'salvage_any' }, { type: 'trail_gain', value: 6 }, { type: 'oblivion_flat', value: 1800 }, { type: 'conditional', condition: { type: 'trail_gte', value: 80 }, then: [{ type: 'multiply_next' }, { type: 'oblivion_flat', value: 1500 }] }],
    },
    attacks: {
      primary: {
        id: 'btei-thornbound-funeral-bramble:primary',
        label: 'Primary',
        name: 'Grave Hedge Ordinance',
        description: '430 base Oblivion · 5 cards cooldown',
        baseOblivion: 2080,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'thornbound'],
      },
      exalted: {
        id: 'btei-thornbound-funeral-bramble:exalted',
        label: 'Exalted',
        name: 'Grave Hedge Throne Decree',
        description: '980 base Oblivion · 8 cards cooldown · Cost: spend 10 Trail, discard 1 card',
        baseOblivion: 5305,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'thornbound'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 205 },
  },
  {
    definitionId: 'btei-thornbound-gallowcrown-matron',
    type: 'Ophanim',
    element: 'Thornbound',
    rarity: 'Eternal',
    name: 'Gallowcrown Matron',
    description: 'Gain 50 Trail; Gain 4 Thorncrowns; Gain 2 Briar Spirals; Gain +160% total Oblivion this turn; If you have 5+ Thorncrowns, Cash out all Thorncrowns (+550 Oblivion per stack); Bloom all Briar Spirals (+35 Trail per spiral); Empower the next card you play',
    artKey: 'btei_thornbound_gallowcrown_matron',
    // Role: BLOOM ESCALATOR. +2 Briar Spirals on play; the 5-Thorncrown conditional
    // ALSO blooms all spirals (modest chainPerTrail but large trail pool).
    effects: [{ type: 'trail_gain', value: 50 }, { type: 'eternal_stack_gain', stack: 'thorn', value: 4 }, { type: 'set_secondary_gain', kind: 'thorn', value: 2 }, { type: 'score_multiplier', value: 160 }, { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'thorn', value: 5 }, then: [{ type: 'eternal_stack_cashout', stack: 'thorn', oblivionPerStack: 550 }, { type: 'thorn_briar_spiral_bloom', trailPerSpiral: 35, oblivionPerTrail: 12 }] }, { type: 'multiply_next' }],
  },
  {
    definitionId: 'btei-mech-overclock-singularity',
    type: 'Ophanim',
    element: 'Mechanical',
    rarity: 'Eternal',
    name: 'Overclock Arch-Engine',
    description: 'Overclock: gain 3 Strain, then Draw 3 cards; chain_gain; Draw 2 cards; If you have 5+ Strain, Empower the next card you play; +900 Oblivion; If you have played 3+ cards this turn, chain_gain',
    artKey: 'btei_mech_overclock_singularity',
    // Role: OVERCLOCK FLUX SEEDER. Each overclock cycle seeds 1 Reactor Flux ?
    // strain-based, no vent, feeds downstream venters.
    effects: [{ type: 'overclock', strain: 3, then: [{ type: 'strain_gain', value: 6 }, { type: 'eternal_stack_gain', stack: 'mech', value: 2 }, { type: 'set_secondary_gain', kind: 'mech', value: 1 }, { type: 'multiply_next' }, { type: 'oblivion_flat', value: 1400 }] }],
  },
  {
    definitionId: 'btei-mech-furnace-ascension',
    type: 'Seraphim',
    element: 'Mechanical',
    rarity: 'Eternal',
    name: 'Furnace Mind Helix',
    description: 'On play: Gain 2 Strain; Gain 1 Reactor Core; Gain 1 Reactor Flux; If you have 4+ Strain, Gain 2 Reactor Cores; Gain 1 Reactor Flux; Gain 4 Strain. While on board: +220 Oblivion per card played while active',
    artKey: 'btei_mech_furnace_ascension',
    attacks: {
      unsynergized: {
        id: 'btei-mech-furnace-ascension:unsynergized',
        label: 'Unsynergized',
        name: 'Furnace Mind Vector Break',
        description: '486 base Oblivion · 5 cards cooldown · Cost: spend 27 Strain',
        baseOblivion: 2980,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'mechanical'],
      },
      synergized: {
        id: 'btei-mech-furnace-ascension:synergized',
        label: 'Synergized',
        name: 'Furnace Mind Angelic Verdict',
        description: '1095 base Oblivion · 8 cards cooldown · Requires Angel · Cost: spend 32 Strain',
        baseOblivion: 5066,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'mechanical'],
      },
    },
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 220, synergyRequirement: 'Mechanical' },
    // Role: STRAIN-GATE FLUX BATTERY. +1 Reactor Flux on play; an extra +1
    // inside the strain?4 conditional. Builds reservoir without venting.
    onPlayEffects: [{ type: 'strain_gain', value: 2 }, { type: 'eternal_stack_gain', stack: 'mech', value: 1 }, { type: 'set_secondary_gain', kind: 'mech', value: 1 }, { type: 'conditional', condition: { type: 'strain_gte', value: 4 }, then: [{ type: 'eternal_stack_gain', stack: 'mech', value: 2 }, { type: 'set_secondary_gain', kind: 'mech', value: 1 }] }, { type: 'strain_gain', value: 4 }],
  },
  {
    definitionId: 'btei-mech-brass-judicator',
    type: 'Cherubim',
    element: 'Mechanical',
    rarity: 'Eternal',
    name: 'Brass Tribunal',
    description: 'On play: Gain 2 Strain; Gain 2 Reactor Cores; Gain 1 Reactor Flux; If you have 4+ Reactor Cores, Spend 4 Reactor Cores; +1300 Oblivion; Vent up to 1 Reactor Flux (consume matching Strain: +600.0 Oblivion per Strain vented, +0.15% score per flux); Empower the next card you play; Gain 4 Strain. While on board: Adjacent active Seraphim gain +120 Oblivion per card played; Adjacent active Seraphim chain +0.12; Buffs Seraphim attacks: base +132, cooldown -1, multiplier x1.00; Buffs Angel attacks: base +98, cooldown -1, multiplier x1.00',
    artKey: 'btei_mech_brass_judicator',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 160 }],
    // Role: VENT CONVERTER. When the Reactor Core spend triggers, also vents 1
    // Reactor Flux for modest oblivion + score multiplier ? dual-payoff bridge.
    onPlayEffects: [{ type: 'strain_gain', value: 2 }, { type: 'eternal_stack_gain', stack: 'mech', value: 2 }, { type: 'set_secondary_gain', kind: 'mech', value: 1 }, { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'mech', value: 4 }, then: [{ type: 'eternal_stack_spend', stack: 'mech', value: 4 }, { type: 'oblivion_flat', value: 1300 }, { type: 'mech_reactor_flux_vent', oblivionPerFlux: 600, scoreMultPerFlux: 0.15, consume: 1 }, { type: 'multiply_next' }] }, { type: 'strain_gain', value: 4 }],
  },
  {
    definitionId: 'btei-mech-reactor-paradigm',
    type: 'Angel',
    element: 'Mechanical',
    rarity: 'Eternal',
    name: 'Reactor Psalm Engine',
    description: 'On summon: Overclock: gain 2 Strain, then Gain 6 Strain; Gain 4 Reactor Cores; Gain 2 Reactor Flux. After 5 cards played: Vent 9999 Strain; Cash out all Reactor Cores (+500 Oblivion per stack); Vent all Reactor Flux (consume matching Strain: +700.0 Oblivion per Strain vented, +0.2% score per flux); Gain 8 Strain; +1700 Oblivion. While on board: +230 Oblivion per card played while on board',
    artKey: 'btei_mech_reactor_paradigm',
    summonCost: [],
    extraSummonConditions: [{ type: 'seraphim_on_board_gte', value: 2 }, { type: 'cherubim_active_gte', value: 1 }],
    onSummonEffects: [{ type: 'overclock', strain: 2, then: [{ type: 'strain_gain', value: 6 }, { type: 'eternal_stack_gain', stack: 'mech', value: 4 }, { type: 'set_secondary_gain', kind: 'mech', value: 2 }] }],
    activatedAbility: {
      name: 'Terminal Vent',
      cardsPlayedRequirement: 5,
      description: 'Vent 9999 Strain; Cash out all Reactor Cores (+500 Oblivion per stack); Vent all Reactor Flux (consume matching Strain: +700.0 Oblivion per Strain vented, +0.2% score per flux); Gain 8 Strain; +1700 Oblivion',
      // Role: APEX VENT. Activated ability vents ALL Reactor Flux at high oblivionPerFlux.
      effects: [{ type: 'strain_vent', value: 9999 }, { type: 'eternal_stack_cashout', stack: 'mech', oblivionPerStack: 500 }, { type: 'mech_reactor_flux_vent', oblivionPerFlux: 700, scoreMultPerFlux: 0.20 }, { type: 'strain_gain', value: 8 }, { type: 'oblivion_flat', value: 1700 }],
    },
    attacks: {
      primary: {
        id: 'btei-mech-reactor-paradigm:primary',
        label: 'Primary',
        name: 'Reactor Psalm Ordinance',
        description: '440 base Oblivion · 5 cards cooldown',
        baseOblivion: 2130,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'mechanical'],
      },
      exalted: {
        id: 'btei-mech-reactor-paradigm:exalted',
        label: 'Exalted',
        name: 'Reactor Psalm Throne Decree',
        description: '980 base Oblivion · 8 cards cooldown · Cost: spend 10 Strain, discard 1 card',
        baseOblivion: 5430,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'mechanical'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 230 },
  },
  {
    definitionId: 'btei-mech-thaumic-primevector',
    type: 'Ophanim',
    element: 'Mechanical',
    rarity: 'Eternal',
    name: 'Primevector Thaumiel',
    description: 'Overclock: gain 4 Strain, then Draw 5 cards; chain_gain; If you have 6+ Strain, Empower the next card you play; +1200 Oblivion; If you have played 4+ cards this turn, Draw 2 cards; chain_gain',
    artKey: 'btei_mech_thaumic_primevector',
    // Role: HIGH-FLUX SEEDER + score-mult venter. Overclock seeds 2 flux; the
    // strain?4 conditional vents 2 flux with the highest scoreMultPerFlux in the set.
    effects: [
      { type: 'overclock', strain: 4, then: [{ type: 'strain_gain', value: 12 }, { type: 'eternal_stack_gain', stack: 'mech', value: 5 }, { type: 'set_secondary_gain', kind: 'mech', value: 2 }, { type: 'oblivion_flat', value: 2200 }] },
      { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'mech', value: 6 }, then: [{ type: 'eternal_stack_cashout', stack: 'mech', oblivionPerStack: 600 }] },
      { type: 'conditional', condition: { type: 'strain_gte', value: 4 }, then: [{ type: 'mech_reactor_flux_vent', oblivionPerFlux: 500, scoreMultPerFlux: 0.30, consume: 2 }, { type: 'multiply_next' }] }],
  },
  {
    definitionId: 'btei-prismatic-vorthum-edict',
    type: 'Ophanim',
    element: 'Prismatic',
    rarity: 'Eternal',
    name: 'Vorthum Mirror Regent',
    description: 'Gain 22 Prismatic Light; Gain 2 Mirror Chain links; Gain 1 Spectrum Echo; Look at the top 8 cards, take 2 cards, put 2 cards on the bottom, and discard the rest',
    artKey: 'btei_prismatic_vorthum_edict',
    // Role: PASSIVE SPECTRUM ECHO BATTERY. +1 Spectrum Echo on play; never refracts.
    effects: [{ type: 'prismatic_light_gain', value: 22 }, { type: 'eternal_stack_gain', stack: 'prism', value: 2 }, { type: 'set_secondary_gain', kind: 'prism', value: 1 }, { type: 'look_top_take_drop', look: 8, take: 2, drop: 2 }],
  },
  {
    definitionId: 'btei-prismatic-fracture-archive',
    type: 'Cherubim',
    element: 'Prismatic',
    rarity: 'Eternal',
    name: 'Fracture Road Hierophant',
    description: 'On play: Gain 24 Prismatic Light; Gain 1 Mirror Chain link; Gain 1 Spectrum Echo; If you have played 3+ distinct channels this turn, Gain 2 Mirror Chain links; Gain 1 Spectrum Echo; Salvage any 1 card. While on board: Adjacent active Seraphim gain +135 Oblivion per card played',
    artKey: 'btei_prismatic_fracture_archive',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 135 }],
    // Role: CHANNEL-DIVERSITY CONVERTER. Each distinct-channel threshold seeds
    // an additional Spectrum Echo ? rewards multi-channel play directly.
    onPlayEffects: [{ type: 'prismatic_light_gain', value: 24 }, { type: 'eternal_stack_gain', stack: 'prism', value: 1 }, { type: 'set_secondary_gain', kind: 'prism', value: 1 }, { type: 'conditional', condition: { type: 'prismatic_distinct_channels_gte', value: 3 }, then: [{ type: 'eternal_stack_gain', stack: 'prism', value: 2 }, { type: 'set_secondary_gain', kind: 'prism', value: 1 }] }, { type: 'salvage_any' }],
  },
  {
    definitionId: 'btei-prismatic-storm-memory',
    type: 'Seraphim',
    element: 'Prismatic',
    rarity: 'Eternal',
    name: 'Drift Canopy Leviathan',
    description: 'On play: Gain 26 Prismatic Light; Gain 2 Mirror Chain links; Gain 1 Spectrum Echo; If you have 4+ Mirror Chain links, Spend 4 Mirror Chain links; +1500 Oblivion; Refract up to 1 Spectrum Echoes (+350.0 Oblivion per echo × distinct channels); Empower the next card you play. While on board: +190 Oblivion whenever you play an Ophanim while active',
    artKey: 'btei_prismatic_storm_memory',
    attacks: {
      unsynergized: {
        id: 'btei-prismatic-storm-memory:unsynergized',
        label: 'Unsynergized',
        name: 'Drift Canopy Vector Break',
        description: '230 base Oblivion · 5 cards cooldown · Cost: discard 1 card',
        baseOblivion: 2460,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'prismatic'],
      },
      synergized: {
        id: 'btei-prismatic-storm-memory:synergized',
        label: 'Synergized',
        name: 'Drift Canopy Angelic Verdict',
        description: '572 base Oblivion · 8 cards cooldown · Requires Angel · Cost: discard 1 card',
        baseOblivion: 4182,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'prismatic'],
      },
    },
    baseStats: { bonusType: 'ophanim_bonus', bonusValue: 190, synergyRequirement: 'Prismatic' },
    // Role: REFRACT PULSE. Inside the 4-Mirror-Chain spend, also refracts 1 echo
    // with the highest per-echo-per-channel coefficient in the Eternal set.
    onPlayEffects: [{ type: 'prismatic_light_gain', value: 26 }, { type: 'eternal_stack_gain', stack: 'prism', value: 2 }, { type: 'set_secondary_gain', kind: 'prism', value: 1 }, { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'prism', value: 4 }, then: [{ type: 'eternal_stack_spend', stack: 'prism', value: 4 }, { type: 'oblivion_flat', value: 1500 }, { type: 'prism_spectrum_echo_refract', oblivionPerEchoPerChannel: 350, consume: 1 }, { type: 'multiply_next' }] }],
  },
  {
    definitionId: 'btei-prismatic-blindwars-reliquary',
    type: 'Angel',
    element: 'Prismatic',
    rarity: 'Eternal',
    name: 'Blind Wars Reliquary',
    description: 'On summon: Gain 25 Prismatic Light; Gain 3 Mirror Chain links; Gain 2 Spectrum Echoes; Look at the top 7 cards, take 2 cards, and put the rest on the bottom. After 5 cards played: Cash out all Mirror Chain links (+550 Oblivion per stack); Refract all Spectrum Echoes (+220.0 Oblivion per echo × distinct channels); Salvage any 1 card; Gain 6 Prismatic Light; Empower the next card you play; +1600 Oblivion. While on board: +215 Oblivion per card played while on board',
    artKey: 'btei_prismatic_blindwars_reliquary',
    summonCost: [],
    extraSummonConditions: [{ type: 'seraphim_on_board_gte', value: 2 }, { type: 'cherubim_active_gte', value: 1 }],
    onSummonEffects: [{ type: 'prismatic_light_gain', value: 25 }, { type: 'eternal_stack_gain', stack: 'prism', value: 3 }, { type: 'set_secondary_gain', kind: 'prism', value: 2 }, { type: 'look_top_take', look: 7, take: 2 }],
    activatedAbility: {
      name: 'War of Reflections',
      cardsPlayedRequirement: 5,
      description: 'Cash out all Mirror Chain links (+550 Oblivion per stack); Refract all Spectrum Echoes (+220.0 Oblivion per echo × distinct channels); Salvage any 1 card; Gain 6 Prismatic Light; Empower the next card you play; +1600 Oblivion',
      // Role: APEX REFRACT. Activated ability refracts ALL Spectrum Echoes at
      // moderate coefficient ? scales explosively with channel diversity.
      effects: [{ type: 'eternal_stack_cashout', stack: 'prism', oblivionPerStack: 550 }, { type: 'prism_spectrum_echo_refract', oblivionPerEchoPerChannel: 220 }, { type: 'salvage_any' }, { type: 'prismatic_light_gain', value: 6 }, { type: 'multiply_next' }, { type: 'oblivion_flat', value: 1600 }],
    },
    attacks: {
      primary: {
        id: 'btei-prismatic-blindwars-reliquary:primary',
        label: 'Primary',
        name: 'Blind Wars Ordinance',
        description: '376 base Oblivion · 3 cards cooldown',
        baseOblivion: 2100,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'prismatic'],
      },
      exalted: {
        id: 'btei-prismatic-blindwars-reliquary:exalted',
        label: 'Exalted',
        name: 'Blind Wars Throne Decree',
        description: '802 base Oblivion · 7 cards cooldown · Cost: discard 2 cards, sacrifice 1 Seraphim',
        baseOblivion: 5355,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'prismatic'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 215 },
  },
  {
    definitionId: 'btei-prismatic-ninefold-accord',
    type: 'Ophanim',
    element: 'Prismatic',
    rarity: 'Eternal',
    name: 'Whitebeam Concordat',
    description: 'Draw 4 cards; chain_gain; If you control 2+ active Cherubim, +2000 Oblivion; Empower the next card you play',
    artKey: 'btei_prismatic_ninefold_accord',
    // Role: ESCALATOR. +1 Spectrum Echo per threshold met; full refract at stack?6.
    effects: [
      { type: 'prismatic_light_gain', value: 33 },
      { type: 'eternal_stack_gain', stack: 'prism', value: 4 },
      { type: 'set_secondary_gain', kind: 'prism', value: 1 },
      { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'prism', value: 6 }, then: [{ type: 'oblivion_flat', value: 2500 }, { type: 'set_secondary_gain', kind: 'prism', value: 1 }, { type: 'prism_spectrum_echo_refract', oblivionPerEchoPerChannel: 280 }, { type: 'multiply_next' }] },
      { type: 'conditional', condition: { type: 'cherubim_active_gte', value: 2 }, then: [{ type: 'oblivion_flat', value: 2000 }, { type: 'set_secondary_gain', kind: 'prism', value: 1 }, { type: 'multiply_next' }] }],
  },
  {
    definitionId: 'btei-bgi-cindershard-lexicon',
    type: 'Ophanim',
    element: 'Dark',
    rarity: 'Eternal',
    name: 'Cindershard Lexicon',
    description: 'Gain 6 White Flame; Gain 6 Black Flame; Gain 4 Eclipse Marks; Gain 1 Veil Shard; Gain 10 Monochromatic Shards; +1200 Oblivion; If White Flame equals Black Flame, Cash out all Eclipse Marks (+550 Oblivion per stack); +1200 Oblivion',
    artKey: 'btei_bgi_cindershard_lexicon',
    // Role: BALANCED VEIL-SHARD BATTERY. +1 Veil Shard each play; relies on the
    // flames-equal conditional for the rest of its payoff. No swap of its own.
    effects: [
      { type: 'black_glass_white_flame_gain', value: 6 },
      { type: 'black_glass_black_flame_gain', value: 6 },
      { type: 'eternal_stack_gain', stack: 'glass', value: 4 },
      { type: 'set_secondary_gain', kind: 'glass', value: 1 },
      { type: 'monochromatic_shards_gain', value: 10 },
      { type: 'oblivion_flat', value: 1200 },
      { type: 'conditional', condition: { type: 'black_glass_flames_equal' }, then: [{ type: 'eternal_stack_cashout', stack: 'glass', oblivionPerStack: 550 }, { type: 'oblivion_flat', value: 1200 }] }],
  },
  {
    definitionId: 'btei-bgi-blackglass-catastrophe',
    type: 'Ophanim',
    element: 'Dark',
    rarity: 'Eternal',
    name: 'Blackglass Catastrophe',
    description: 'Gain 10 Black Flame; Gain 3 Fracture; Gain 5 Eclipse Marks; Gain 2 Veil Shards; Gain 8 Monochromatic Shards; If you have 6+ Eclipse Marks, Spend 6 Eclipse Marks; +2000 Oblivion; Shatter up to 2 Veil Shards (swap flames, +80.0 Oblivion per higher flame per shard); Empower the next card you play',
    artKey: 'btei_bgi_blackglass_catastrophe',
    // Role: BLACK-FLAME SWAPPER. +2 Veil Shards; inside the 6-mark spend, also
    // swaps 2 shards ? leverages its own Black-Flame asymmetry.
    effects: [{ type: 'black_glass_black_flame_gain', value: 10 }, { type: 'black_glass_fracture_gain', value: 3 }, { type: 'eternal_stack_gain', stack: 'glass', value: 5 }, { type: 'set_secondary_gain', kind: 'glass', value: 2 }, { type: 'monochromatic_shards_gain', value: 8 }, { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'glass', value: 6 }, then: [{ type: 'eternal_stack_spend', stack: 'glass', value: 6 }, { type: 'oblivion_flat', value: 2000 }, { type: 'glass_veil_shard_swap', oblivionPerHigherFlame: 80, consume: 2 }, { type: 'multiply_next' }] }],
  },
  {
    definitionId: 'btei-bgi-inferborn-prophecy',
    type: 'Ophanim',
    element: 'Dark',
    rarity: 'Eternal',
    name: 'Inferborn Prophecy',
    description: 'Gain 8 White Flame; Gain 3 Eclipse Marks; Gain 1 Veil Shard; Gain 8 Monochromatic Shards; Look at the top 8 cards, take 2 cards, and put the rest on the bottom; If you have played 3+ cards this turn, Swap White Flame and Black Flame; Shatter up to 1 Veil Shards (swap flames, +110.0 Oblivion per higher flame per shard); Cash out all Eclipse Marks (+500 Oblivion per stack); Empower the next card you play; +1000 Oblivion',
    artKey: 'btei_bgi_inferborn_prophecy',
    // Role: SWAP-AND-CASH ORACLE. After it swaps flames, consumes 1 Veil Shard
    // at the highest oblivionPerHigherFlame coefficient (the post-swap higher
    // flame is the freshly stoked one).
    effects: [
      { type: 'black_glass_white_flame_gain', value: 8 },
      { type: 'eternal_stack_gain', stack: 'glass', value: 3 },
      { type: 'set_secondary_gain', kind: 'glass', value: 1 },
      { type: 'monochromatic_shards_gain', value: 8 },
      { type: 'look_top_take', look: 8, take: 2 },
      { type: 'conditional', condition: { type: 'cards_played_gte', value: 3 }, then: [{ type: 'black_glass_flames_swap' }, { type: 'glass_veil_shard_swap', oblivionPerHigherFlame: 110, consume: 1 }, { type: 'eternal_stack_cashout', stack: 'glass', oblivionPerStack: 500 }, { type: 'multiply_next' }, { type: 'oblivion_flat', value: 1000 }] }],
  },
  {
    definitionId: 'btei-bgi-velplane-ossuary',
    type: 'Seraphim',
    element: 'Dark',
    rarity: 'Eternal',
    name: 'Veilplane Ossuary',
    description: 'On play: Gain 8 Black Flame; Gain 2 Eclipse Marks; Gain 2 Veil Shards; Gain 8 Monochromatic Shards. While on board: +190 Oblivion per card played while active',
    artKey: 'btei_bgi_velplane_ossuary',
    attacks: {
      unsynergized: {
        id: 'btei-bgi-velplane-ossuary:unsynergized',
        label: 'Unsynergized',
        name: 'Veilplane Ossuary Vector Break',
        description: '2850 base Oblivion · 6 cards cooldown',
        baseOblivion: 2850,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'dark'],
      },
      synergized: {
        id: 'btei-bgi-velplane-ossuary:synergized',
        label: 'Synergized',
        name: 'Veilplane Ossuary Angelic Verdict',
        description: '4845 base Oblivion · 7 cards cooldown · Requires Angel',
        baseOblivion: 4845,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'dark'],
      },
    },
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 190, synergyRequirement: 'Dark' },
    // Role: PASSIVE VEIL-SHARD BATTERY (Seraphim). +2 shards on play, no swap ?
    // sustained reservoir for adjacent swappers.
    onPlayEffects: [{ type: 'black_glass_black_flame_gain', value: 8 }, { type: 'eternal_stack_gain', stack: 'glass', value: 2 }, { type: 'set_secondary_gain', kind: 'glass', value: 2 }, { type: 'monochromatic_shards_gain', value: 8 }],
  },
  {
    definitionId: 'btei-bgi-rosecrown-annihilator',
    type: 'Seraphim',
    element: 'Dark',
    rarity: 'Eternal',
    name: 'Rosecrown Annihilator',
    description: 'On play: Gain 8 White Flame; Gain 2 Fracture; Gain 3 Eclipse Marks; Gain 1 Veil Shard; If you have 5+ Eclipse Marks, Cash out all Eclipse Marks (+500 Oblivion per stack); Shatter up to 1 Veil Shards (swap flames, +130.0 Oblivion per higher flame per shard); Gain 10 Monochromatic Shards; Salvage any 1 card. While on board: +200 Oblivion whenever you play an Ophanim while active',
    artKey: 'btei_bgi_rosecrown_annihilator',
    attacks: {
      unsynergized: {
        id: 'btei-bgi-rosecrown-annihilator:unsynergized',
        label: 'Unsynergized',
        name: 'Rosecrown Annihilator Vector Break',
        description: '2485 base Oblivion · 6 cards cooldown',
        baseOblivion: 2485,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'dark'],
      },
      synergized: {
        id: 'btei-bgi-rosecrown-annihilator:synergized',
        label: 'Synergized',
        name: 'Rosecrown Annihilator Angelic Verdict',
        description: '4225 base Oblivion · 7 cards cooldown · Requires Angel',
        baseOblivion: 4225,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'dark'],
      },
    },
    baseStats: { bonusType: 'ophanim_bonus', bonusValue: 200, synergyRequirement: 'Dark' },
    // Role: LOW-CONSUME HIGH-COEFFICIENT SWAPPER. Inside the stack?5 cashout,
    // swaps just 1 Veil Shard at the highest coefficient in the Seraphim band.
    onPlayEffects: [{ type: 'black_glass_white_flame_gain', value: 8 }, { type: 'black_glass_fracture_gain', value: 2 }, { type: 'eternal_stack_gain', stack: 'glass', value: 3 }, { type: 'set_secondary_gain', kind: 'glass', value: 1 }, { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'glass', value: 5 }, then: [{ type: 'eternal_stack_cashout', stack: 'glass', oblivionPerStack: 500 }, { type: 'glass_veil_shard_swap', oblivionPerHigherFlame: 130, consume: 1 }] }, { type: 'monochromatic_shards_gain', value: 10 }, { type: 'salvage_any' }],
  },
  {
    definitionId: 'btei-bgi-silver-sorrow-archwyrm',
    type: 'Seraphim',
    element: 'Dark',
    rarity: 'Eternal',
    name: 'Silver Sorrow Archwyrm',
    description: 'On play: Gain 6 White Flame; Gain 6 Black Flame; Gain 4 Eclipse Marks; Gain 2 Veil Shards; If you have 5+ Eclipse Marks, Spend 5 Eclipse Marks; +1700 Oblivion; Shatter up to 2 Veil Shards (swap flames, +90.0 Oblivion per higher flame per shard); Gain 12 Monochromatic Shards; Empower the next card you play. While on board: +35 Oblivion per card played while active',
    artKey: 'btei_bgi_silver_sorrow_archwyrm',
    attacks: {
      unsynergized: {
        id: 'btei-bgi-silver-sorrow-archwyrm:unsynergized',
        label: 'Unsynergized',
        name: 'Silver Sorrow Vector Break',
        description: '2140 base Oblivion · 6 cards cooldown',
        baseOblivion: 2140,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'dark'],
      },
      synergized: {
        id: 'btei-bgi-silver-sorrow-archwyrm:synergized',
        label: 'Synergized',
        name: 'Silver Sorrow Angelic Verdict',
        description: '3638 base Oblivion · 7 cards cooldown · Requires Angel',
        baseOblivion: 3638,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'dark'],
      },
    },
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 35, synergyRequirement: 'Dark' },
    // Role: BALANCED PULSE. Inside the 5-mark spend, swaps 2 Veil Shards at
    // a moderate coefficient ? pair-payoff variant tuned for balanced flames.
    onPlayEffects: [{ type: 'black_glass_white_flame_gain', value: 6 }, { type: 'black_glass_black_flame_gain', value: 6 }, { type: 'eternal_stack_gain', stack: 'glass', value: 4 }, { type: 'set_secondary_gain', kind: 'glass', value: 2 }, { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'glass', value: 5 }, then: [{ type: 'eternal_stack_spend', stack: 'glass', value: 5 }, { type: 'oblivion_flat', value: 1700 }, { type: 'glass_veil_shard_swap', oblivionPerHigherFlame: 90, consume: 2 }] }, { type: 'monochromatic_shards_gain', value: 12 }, { type: 'multiply_next' }],
  },
  {
    definitionId: 'btei-bgi-crystal-war-sutures',
    type: 'Cherubim',
    element: 'Dark',
    rarity: 'Eternal',
    name: 'Crystal War Sutures',
    description: 'On play: Gain 5 White Flame; Gain 2 Eclipse Marks; Gain 1 Veil Shard; If you have 4+ Eclipse Marks, Spend 4 Eclipse Marks; +1300 Oblivion; Shatter up to 1 Veil Shards (swap flames, +100.0 Oblivion per higher flame per shard); Empower the next card you play; Gain 12 Monochromatic Shards; Salvage 1 card matching Ophanim. While on board: Adjacent active Seraphim gain +140 Oblivion per card played',
    artKey: 'btei_bgi_crystal_war_sutures',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 140 }],
    // Role: WHITE-FLAME SWAP CONVERTER (Cherubim). +1 Veil Shard; inside the
    // stack?4 spend, also swaps 1 shard.
    onPlayEffects: [{ type: 'black_glass_white_flame_gain', value: 5 }, { type: 'eternal_stack_gain', stack: 'glass', value: 2 }, { type: 'set_secondary_gain', kind: 'glass', value: 1 }, { type: 'conditional', condition: { type: 'eternal_stack_gte', stack: 'glass', value: 4 }, then: [{ type: 'eternal_stack_spend', stack: 'glass', value: 4 }, { type: 'oblivion_flat', value: 1300 }, { type: 'glass_veil_shard_swap', oblivionPerHigherFlame: 100, consume: 1 }, { type: 'multiply_next' }] }, { type: 'monochromatic_shards_gain', value: 12 }, { type: 'salvage_by_type', filter: ['Ophanim'] }],
  },
  {
    definitionId: 'btei-bgi-nocturne-of-embers',
    type: 'Cherubim',
    element: 'Dark',
    rarity: 'Eternal',
    name: 'Nocturne of Embers',
    description: 'On play: Gain 6 Black Flame; Gain 2 Fracture; Gain 3 Eclipse Marks; Gain 3 Veil Shards; Gain 8 Monochromatic Shards. While on board: Adjacent active Seraphim gain +110 Oblivion per card played',
    artKey: 'btei_bgi_nocturne_of_embers',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 110 }],
    // Role: BACK-ROW VEIL-SHARD BATTERY. +3 shards, no swap ? stockpile for
    // adjacent Seraphim/Angel finishers.
    onPlayEffects: [{ type: 'black_glass_black_flame_gain', value: 6 }, { type: 'black_glass_fracture_gain', value: 2 }, { type: 'eternal_stack_gain', stack: 'glass', value: 3 }, { type: 'set_secondary_gain', kind: 'glass', value: 3 }, { type: 'monochromatic_shards_gain', value: 8 }],
  },
  {
    definitionId: 'btei-bgi-throne-of-cinders',
    type: 'Angel',
    element: 'Dark',
    rarity: 'Eternal',
    name: 'Throne of Cinders',
    description: 'On summon: Gain 10 White Flame; Gain 10 Black Flame; Gain 4 Eclipse Marks; Gain 2 Veil Shards; Gain 12 Monochromatic Shards; Salvage any 1 card. After 5 cards played: Swap White Flame and Black Flame; Gain 4 Fracture; Cash out all Eclipse Marks (+600 Oblivion per stack); Shatter all Veil Shards (swap flames, +95.0 Oblivion per higher flame per shard); +1700 Oblivion; If White Flame equals Black Flame, +1500 Oblivion. While on board: +210 Oblivion per card played while on board',
    artKey: 'btei_bgi_throne_of_cinders',
    summonCost: [],
    extraSummonConditions: [{ type: 'seraphim_on_board_gte', value: 2 }, { type: 'cherubim_active_gte', value: 1 }],
    onSummonEffects: [{ type: 'black_glass_white_flame_gain', value: 10 }, { type: 'black_glass_black_flame_gain', value: 10 }, { type: 'eternal_stack_gain', stack: 'glass', value: 4 }, { type: 'set_secondary_gain', kind: 'glass', value: 2 }, { type: 'monochromatic_shards_gain', value: 12 }, { type: 'salvage_any' }],
    activatedAbility: {
      name: 'Cinder Decree',
      cardsPlayedRequirement: 5,
      description: 'Swap White Flame and Black Flame; Gain 4 Fracture; Cash out all Eclipse Marks (+600 Oblivion per stack); Shatter all Veil Shards (swap flames, +95.0 Oblivion per higher flame per shard); +1700 Oblivion; If White Flame equals Black Flame, +1500 Oblivion',
      // Role: APEX FLAME-SWAP. After swapping flames, swaps all banked Veil
      // Shards ? the post-swap higher-flame value scales the payout.
      effects: [{ type: 'black_glass_flames_swap' }, { type: 'black_glass_fracture_gain', value: 4 }, { type: 'eternal_stack_cashout', stack: 'glass', oblivionPerStack: 600 }, { type: 'glass_veil_shard_swap', oblivionPerHigherFlame: 95 }, { type: 'oblivion_flat', value: 1700 }, { type: 'conditional', condition: { type: 'black_glass_flames_equal' }, then: [{ type: 'oblivion_flat', value: 1500 }] }],
    },
    attacks: {
      primary: {
        id: 'btei-bgi-throne-of-cinders:primary',
        label: 'Primary',
        name: 'Throne of Ordinance',
        description: '2090 base Oblivion · 6 cards cooldown',
        baseOblivion: 2090,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'dark'],
      },
      exalted: {
        id: 'btei-bgi-throne-of-cinders:exalted',
        label: 'Exalted',
        name: 'Throne of Throne Decree',
        description: '5330 base Oblivion · 9 cards cooldown',
        baseOblivion: 5330,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'dark'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 210 },
  },
  {
    definitionId: 'btei-bgi-elegy-of-veth-serath',
    type: 'Angel',
    element: 'Dark',
    rarity: 'Eternal',
    name: 'Elegy of Veth Serath',
    description: 'On summon: Gain 12 White Flame; Gain 3 Eclipse Marks; Gain 2 Veil Shards; Gain 12 Monochromatic Shards; Look at the top 7 cards, take 2 cards, and put the rest on the bottom; Register state: Grief Oaths += 1. After 6 cards played: Gain 12 Black Flame; Gain 4 Eclipse Marks; Fracture collapses by 0.5; Cash out all Eclipse Marks (+650 Oblivion per stack); Shatter all Veil Shards (swap flames, +120.0 Oblivion per higher flame per shard); Salvage any 1 card; Empower the next card you play; +1900 Oblivion. While on board: +230 Oblivion per card played while on board',
    artKey: 'btei_bgi_elegy_of_veth_serath',
    summonCost: [],
    extraSummonConditions: [{ type: 'seraphim_on_board_gte', value: 3 }],
    onSummonEffects: [{ type: 'black_glass_white_flame_gain', value: 12 }, { type: 'eternal_stack_gain', stack: 'glass', value: 3 }, { type: 'set_secondary_gain', kind: 'glass', value: 2 }, { type: 'monochromatic_shards_gain', value: 12 }, { type: 'look_top_take', look: 7, take: 2 }, { type: 'black_glass_register_state', key: 'grief_oaths', value: 1 }],
    activatedAbility: {
      name: 'Midplace Requiem',
      cardsPlayedRequirement: 6,
      description: 'Gain 12 Black Flame; Gain 4 Eclipse Marks; Fracture collapses by 0.5; Cash out all Eclipse Marks (+650 Oblivion per stack); Shatter all Veil Shards (swap flames, +120.0 Oblivion per higher flame per shard); Salvage any 1 card; Empower the next card you play; +1900 Oblivion',
      // Role: APEX HIGH-COEFFICIENT REQUIEM. Swaps all Veil Shards at the
      // highest per-shard coefficient in the Eternal band ? pays off Cherubim
      // backbench batteries that hoarded shards.
      effects: [{ type: 'black_glass_black_flame_gain', value: 12 }, { type: 'eternal_stack_gain', stack: 'glass', value: 4 }, { type: 'black_glass_fracture_collapse', value: 0.5 }, { type: 'eternal_stack_cashout', stack: 'glass', oblivionPerStack: 650 }, { type: 'glass_veil_shard_swap', oblivionPerHigherFlame: 120 }, { type: 'salvage_any' }, { type: 'multiply_next' }, { type: 'oblivion_flat', value: 1900 }],
    },
    attacks: {
      primary: {
        id: 'btei-bgi-elegy-of-veth-serath:primary',
        label: 'Primary',
        name: 'Elegy of Ordinance',
        description: '2130 base Oblivion · 6 cards cooldown',
        baseOblivion: 2130,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'dark'],
      },
      exalted: {
        id: 'btei-bgi-elegy-of-veth-serath:exalted',
        label: 'Exalted',
        name: 'Elegy of Throne Decree',
        description: '5430 base Oblivion · 9 cards cooldown',
        baseOblivion: 5430,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'dark'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 230 },
  },
  {
    definitionId: 'sv-eternal-frost-charge',
    type: 'Angel',
    element: 'Mechanical',
    rarity: 'Eternal',
    name: 'Frostborne Surge',
    description: 'On summon: Gain 8 Radiance; Gain 1 Strain; +220 Oblivion; Gain 16 Arctic Charge; Gain 2 Static Pulses. After 5 cards played: Gain 4 Radiance; Gain 1 Strain; Gain 6 Arctic Charge; Empower the next card you play; +260 Oblivion; Discharge Arctic Charge; Discharge up to 2 Static Pulses (Voltage: +200.0 Oblivion per pulse · Frost: +6.0 Arctic Charge per pulse). While on board: +260 Oblivion per card played while on board',
    artKey: 'sv_eternal_frost_charge',
    summonCost: ['sv-ser-frostcoil', 'sv-ser-glacier-relay'],
    extraSummonConditions: [{ type: 'cherubim_active_gte', value: 1 }],
    onSummonEffects: [{ type: 'radiance_gain', value: 8 }, { type: 'strain_gain', value: 1 }, { type: 'oblivion_flat', value: 220 }, { type: 'arctic_charge_gain', value: 16 }, { type: 'set_secondary_gain', kind: 'snow', value: 2 }],
    activatedAbility: {
      name: 'Winter Surge',
      cardsPlayedRequirement: 5,
      description: 'Gain 4 Radiance; Gain 1 Strain; Gain 6 Arctic Charge; Empower the next card you play; +260 Oblivion; Discharge Arctic Charge; Discharge up to 2 Static Pulses (Voltage: +200.0 Oblivion per pulse · Frost: +6.0 Arctic Charge per pulse)',
      // Role: FROST-PULSE SEEDER. Activated ability discharges only 2 pulses
      // for a tight extra-draw burst ? partial cashout, leaves residue banked.
      effects: [{ type: 'radiance_gain', value: 4 }, { type: 'strain_gain', value: 1 }, { type: 'arctic_charge_gain', value: 6 }, { type: 'multiply_next' }, { type: 'oblivion_flat', value: 260 }, { type: 'arctic_charge_discharge' }, { type: 'snow_static_pulse_discharge', voltageOblivionPerPulse: 200, frostArcticChargePerPulse: 6, consume: 2 }],
    },
    attacks: {
      primary: {
        id: 'sv-eternal-frost-charge:primary',
        label: 'Primary',
        name: 'Frostborne Surge Ordinance',
        description: '2120 base Oblivion · 6 cards cooldown',
        baseOblivion: 2120,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'mechanical', 'snowbound', 'voltage'],
      },
      exalted: {
        id: 'sv-eternal-frost-charge:exalted',
        label: 'Exalted',
        name: 'Frostborne Surge Throne Decree',
        description: '5480 base Oblivion · 9 cards cooldown',
        baseOblivion: 5480,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'mechanical', 'snowbound', 'voltage'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 260 },
  },
  {
    definitionId: 'sv-eternal-aurora-battery',
    type: 'Angel',
    element: 'Mechanical',
    rarity: 'Eternal',
    name: 'Aurora Nexus',
    description: 'On summon: Gain 8 Radiance; Gain 16 Arctic Charge; Gain 3 Static Pulses. After 5 cards played: Gain 2 Radiance; Gain 13 Arctic Charge. While on board: +260 Oblivion per card played while on board',
    artKey: 'sv_eternal_aurora_battery',
    summonCost: ['sv-ser-static-sleet', 'sv-ser-icegrid'],
    // Role: PASSIVE PULSE BATTERY. +3 pulses each summon; never discharges ?
    // hoards Static Pulses for adjacent dischargers.
    onSummonEffects: [{ type: 'radiance_gain', value: 8 }, { type: 'arctic_charge_gain', value: 16 }, { type: 'set_secondary_gain', kind: 'snow', value: 3 }],
    activatedAbility: {
      name: 'Aurora Recharge',
      cardsPlayedRequirement: 5,
      description: 'Gain 2 Radiance; Gain 13 Arctic Charge',
      effects: [{ type: 'radiance_gain', value: 2 }, { type: 'arctic_charge_gain', value: 13 }],
    },
    attacks: {
      primary: {
        id: 'sv-eternal-aurora-battery:primary',
        label: 'Primary',
        name: 'Aurora Nexus Ordinance',
        description: '2305 base Oblivion · 6 cards cooldown',
        baseOblivion: 2305,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'mechanical', 'snowbound', 'voltage'],
      },
      exalted: {
        id: 'sv-eternal-aurora-battery:exalted',
        label: 'Exalted',
        name: 'Aurora Nexus Throne Decree',
        description: '5660 base Oblivion · 9 cards cooldown',
        baseOblivion: 5660,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'mechanical', 'snowbound', 'voltage'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 260 },
  },
  {
    definitionId: 'sv-eternal-glacier-signal',
    type: 'Angel',
    element: 'Mechanical',
    rarity: 'Eternal',
    name: 'Glacier Beacon',
    description: 'On summon: Gain 10 Radiance; Gain 1 Strain; +280 Oblivion; Gain 20 Arctic Charge; Gain 1 Static Pulse. After 6 cards played: Gain 2 Strain; Gain 5 Radiance; Gain 8 Arctic Charge; Empower the next card you play; +320 Oblivion; Discharge Arctic Charge; Discharge all Static Pulses (Voltage: +250.0 Oblivion per pulse · Frost: +8.0 Arctic Charge per pulse). While on board: +300 Oblivion per card played while on board',
    artKey: 'sv_eternal_glacier_signal',
    summonCost: ['sv-angel-overcurrent-chorus', 'sv-ser-whiteout-engine'],
    extraSummonConditions: [{ type: 'seraphim_on_board_gte', value: 2 }],
    onSummonEffects: [{ type: 'radiance_gain', value: 10 }, { type: 'strain_gain', value: 1 }, { type: 'oblivion_flat', value: 280 }, { type: 'arctic_charge_gain', value: 20 }, { type: 'set_secondary_gain', kind: 'snow', value: 1 }],
    activatedAbility: {
      name: 'Signal Override',
      cardsPlayedRequirement: 6,
      description: 'Gain 2 Strain; Gain 5 Radiance; Gain 8 Arctic Charge; Empower the next card you play; +320 Oblivion; Discharge Arctic Charge; Discharge all Static Pulses (Voltage: +250.0 Oblivion per pulse · Frost: +8.0 Arctic Charge per pulse)',
      // Role: HIGH-COEFFICIENT DISCHARGER. Seeds only 1 pulse but pays out
      // every banked pulse at the strongest frost coefficient in the Eternal band.
      effects: [{ type: 'strain_gain', value: 2 }, { type: 'radiance_gain', value: 5 }, { type: 'arctic_charge_gain', value: 8 }, { type: 'multiply_next' }, { type: 'oblivion_flat', value: 320 }, { type: 'arctic_charge_discharge' }, { type: 'snow_static_pulse_discharge', voltageOblivionPerPulse: 250, frostArcticChargePerPulse: 8 }],
    },
    attacks: {
      primary: {
        id: 'sv-eternal-glacier-signal:primary',
        label: 'Primary',
        name: 'Glacier Beacon Ordinance',
        description: '2460 base Oblivion · 6 cards cooldown',
        baseOblivion: 2460,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'mechanical', 'snowbound', 'voltage'],
      },
      exalted: {
        id: 'sv-eternal-glacier-signal:exalted',
        label: 'Exalted',
        name: 'Glacier Beacon Throne Decree',
        description: '5880 base Oblivion · 9 cards cooldown',
        baseOblivion: 5880,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'mechanical', 'snowbound', 'voltage'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 300 },
  },
  {
    definitionId: 'sv-eternal-white-static',
    type: 'Angel',
    element: 'Mechanical',
    rarity: 'Eternal',
    name: 'White Requiem',
    description: 'On summon: Gain 6 Radiance; Gain 16 Arctic Charge; Gain 1 Static Pulse. After 5 cards played: Gain 8 Arctic Charge; Gain 2 Strain; +300 Oblivion; Discharge Arctic Charge; Discharge up to 2 Static Pulses (Voltage: +220.0 Oblivion per pulse · Frost: +10.0 Arctic Charge per pulse). While on board: +280 Oblivion per card played while on board',
    artKey: 'sv_eternal_white_static',
    summonCost: ['sv-angel-whiteout-judicator', 'sv-cher-station-nullpoint'],
    extraSummonConditions: [{ type: 'cherubim_active_gte', value: 1 }],
    onSummonEffects: [{ type: 'radiance_gain', value: 6 }, { type: 'arctic_charge_gain', value: 16 }, { type: 'set_secondary_gain', kind: 'snow', value: 1 }],
    activatedAbility: {
      name: 'Static Crown',
      cardsPlayedRequirement: 5,
      description: 'Gain 8 Arctic Charge; Gain 2 Strain; +300 Oblivion; Discharge Arctic Charge; Discharge up to 2 Static Pulses (Voltage: +220.0 Oblivion per pulse · Frost: +10.0 Arctic Charge per pulse)',
      // Role: PULSE CONVERTER. Modest pulse seed; activated ability spends 2 at
      // the highest per-pulse Frost draw coefficient on Eternal Snowbound.
      effects: [{ type: 'arctic_charge_gain', value: 8 }, { type: 'strain_gain', value: 2 }, { type: 'oblivion_flat', value: 300 }, { type: 'arctic_charge_discharge' }, { type: 'snow_static_pulse_discharge', voltageOblivionPerPulse: 220, frostArcticChargePerPulse: 10, consume: 2 }],
    },
    attacks: {
      primary: {
        id: 'sv-eternal-white-static:primary',
        label: 'Primary',
        name: 'White Requiem Ordinance',
        description: '2388 base Oblivion · 6 cards cooldown',
        baseOblivion: 2388,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'mechanical', 'snowbound', 'voltage'],
      },
      exalted: {
        id: 'sv-eternal-white-static:exalted',
        label: 'Exalted',
        name: 'White Requiem Throne Decree',
        description: '5940 base Oblivion · 9 cards cooldown',
        baseOblivion: 5940,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'mechanical', 'snowbound', 'voltage'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 280 },
  },
  {
    definitionId: 'sv-eternal-sleet-choir',
    type: 'Angel',
    element: 'Mechanical',
    rarity: 'Eternal',
    name: 'Blizzard Requiem',
    description: 'On summon: Gain 12 Radiance; Gain 2 Strain; Gain 24 Arctic Charge; Gain 2 Static Pulses. After 6 cards played: Gain 2 Strain; Gain 6 Radiance; Gain 8 Arctic Charge; Empower the next card you play; +360 Oblivion; Discharge Arctic Charge; Discharge all Static Pulses (Voltage: +240.0 Oblivion per pulse · Frost: +7.0 Arctic Charge per pulse). While on board: +340 Oblivion per card played while on board',
    artKey: 'sv_eternal_sleet_choir',
    summonCost: ['sv-angel-icebound-conductor', 'sv-cher-last-transmission'],
    extraSummonConditions: [{ type: 'cherubim_active_gte', value: 2 }],
    onSummonEffects: [{ type: 'radiance_gain', value: 12 }, { type: 'strain_gain', value: 2 }, { type: 'arctic_charge_gain', value: 24 }, { type: 'set_secondary_gain', kind: 'snow', value: 2 }],
    activatedAbility: {
      name: 'Choir of Static',
      cardsPlayedRequirement: 6,
      description: 'Gain 2 Strain; Gain 6 Radiance; Gain 8 Arctic Charge; Empower the next card you play; +360 Oblivion; Discharge Arctic Charge; Discharge all Static Pulses (Voltage: +240.0 Oblivion per pulse · Frost: +7.0 Arctic Charge per pulse)',
      // Role: APEX ETERNAL DISCHARGE. Seeds 2, discharges every banked pulse at
      // a moderate coefficient ? widest payout footprint in the Eternal band.
      effects: [{ type: 'strain_gain', value: 2 }, { type: 'radiance_gain', value: 6 }, { type: 'arctic_charge_gain', value: 8 }, { type: 'multiply_next' }, { type: 'oblivion_flat', value: 360 }, { type: 'arctic_charge_discharge' }, { type: 'snow_static_pulse_discharge', voltageOblivionPerPulse: 240, frostArcticChargePerPulse: 7 }],
    },
    attacks: {
      primary: {
        id: 'sv-eternal-sleet-choir:primary',
        label: 'Primary',
        name: 'Blizzard Requiem Ordinance',
        description: '2520 base Oblivion · 6 cards cooldown',
        baseOblivion: 2520,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'mechanical', 'snowbound', 'voltage'],
      },
      exalted: {
        id: 'sv-eternal-sleet-choir:exalted',
        label: 'Exalted',
        name: 'Blizzard Requiem Throne Decree',
        description: '6040 base Oblivion · 9 cards cooldown',
        baseOblivion: 6040,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'mechanical', 'snowbound', 'voltage'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 340 },
  }];

export const eternalCards = [
  ...eternalOphanimCards,
  ...eternalSeraphimCards,
  ...eternalCherubimCards,
  ...eternalAngels,
  ...expansionEternalCards];
