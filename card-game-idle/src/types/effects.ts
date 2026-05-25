export type BoardEffectType =
  | 'power_flat'
  | 'power_percent'
  | 'score_multiplier'
  | 'seraphim_bonus_amplifier';

export type BoardEffect =
  | { type: 'power_flat'; value: number }
  | { type: 'power_percent'; value: number }
  | { type: 'score_multiplier'; value: number }
  | { type: 'seraphim_bonus_amplifier'; value: number };

export type CardSubtypeFilter = 'Seraphim' | 'Cherubim' | 'Ophanim';

export type ImmediateEffect =
  | { type: 'oblivion_flat'; value: number }
  | { type: 'chain_gain'; value: number }
  | { type: 'chain_multiplier_set'; value: number }
  | { type: 'set_chain_floor'; value: number }
  | { type: 'black_glass_white_flame_gain'; value: number }
  | { type: 'black_glass_black_flame_gain'; value: number }
  | { type: 'black_glass_fracture_gain'; value: number }
  | { type: 'black_glass_flames_swap' }
  | { type: 'black_glass_fracture_collapse'; value: number }
  | { type: 'black_glass_register_state'; key: 'grief_oaths' | 'collapse_pending' | 'last_payoff'; value: number }
  | { type: 'light_resonance_gain'; value: number }
  | { type: 'light_anchor_gain'; value: number }
  | { type: 'score_flat'; value: number }
  | { type: 'radiance_gain'; value: number }
  | { type: 'radiance_spend'; value: number }
  | { type: 'ember_gain'; value: number }
  | { type: 'ember_spend'; value: number }
  | { type: 'draw'; value: number }
  | { type: 'discard_choice'; value: number }
  | { type: 'discard_draw'; discard: number; draw: number }
  | { type: 'shuffle_discard' }
  | { type: 'copy_last_hr' }
  | { type: 'multiply_next' }
  | { type: 'look_top_take'; look: number; take: number }
  | { type: 'look_top_take_drop'; look: number; take: number; drop: number }
  | { type: 'look_top_take_type'; look: number; filter: CardSubtypeFilter[] }
  | { type: 'search_deck_by_type'; filter: CardSubtypeFilter[] }
  | { type: 'salvage_by_type'; filter: CardSubtypeFilter[] }
  | { type: 'salvage_any' }
  | { type: 'radiance_double' }
  | { type: 'sacred_covenant' }
  | { type: 'prismatic_light_gain'; value: number }
  | { type: 'prismatic_light_spend'; value: number }
  | { type: 'channel_lock_gain'; look: number; max: number }
  | { type: 'memory_shard_gain'; value: number; max?: number }
  | { type: 'channel_memory_init'; markDepthOnSwitch?: number }
  | { type: 'accord_channel_set' }
  | { type: 'refraction_echo_gain'; max: number }
  | { type: 'refraction_echo_cascade'; depthThreshold?: number; chainGainPerToken?: number; drawRefund?: number }
  | { type: 'chord_token_gain'; perCherubim?: number; max: number }
  | { type: 'chord_token_multiplier'; baseOblivionPerToken: number; chainScalingPerToken: number; permanentOnFullFire?: boolean; bonusOblivionPerTokenOnFullFire?: number }
  | { type: 'chord_amplify_chain'; base: number; perToken: number }
  | { type: 'refraction_depth_sync'; mode: 'set' | 'set_to_distinct' | 'add_distinct'; value?: number }
  | { type: 'refraction_spike_init'; max: number }
  | { type: 'prismatic_search_ophanim_cherubim'; maxTake: number }
  | { type: 'sentencing_cast'; chainGainIfAccordMatch: number; draw: number; drawPerfect?: number }
  | { type: 'monochromatic_shards_gain'; value: number }
  | { type: 'monochromatic_shards_spend'; value: number }
  | { type: 'arctic_charge_gain'; value: number }
  | { type: 'arctic_charge_discharge' }
  | { type: 'snowbound_set_phase'; phase: 'Frost' | 'Voltage' }
  | { type: 'snowbound_flip_phase' }
  | { type: 'snowbound_reset_phase' }
  | { type: 'snowbound_potential_gain'; value: number }
  | { type: 'snowbound_potential_spend'; value: number }
  | { type: 'snowbound_potential_floor'; value: number }
  | { type: 'snowbound_alternations_gain'; value: number }
  | { type: 'snowbound_conduits_gain'; value: number }
  | { type: 'snowbound_conduits_spend'; value: number }
  | { type: 'snowbound_charge_from_potential'; ratio?: number }
  | { type: 'snowbound_potential_from_charge'; ratio?: number }
  | { type: 'snowbound_cashout_conduits'; oblivionPerConduit: number; chainPerConduit?: number }
  | { type: 'snowbound_alternate_phase'; phases?: ('Frost' | 'Voltage')[] }
  | { type: 'snowbound_potential_to_conduits' }
  | { type: 'snowbound_conduits_to_arctic_charge' }
  | { type: 'snowbound_conduits_double' }
  | { type: 'arctic_charge_double' }
  | { type: 'while_on_board'; trigger: EffectCondition; effects: CardEffect[] }
  | { type: 'proof_gain'; value: number }
  | { type: 'proof_spend'; value: number }
  | { type: 'bloom_gain'; value: number }
  | { type: 'bloom_harvest' }
  | { type: 'butterfly_spectrum_gain'; value: number }
  | { type: 'butterfly_tune'; stance: 'Reflect' | 'Absorb' | 'Dual' }
  | { type: 'butterfly_release'; spend: number; oblivionPerSpectrum: number; chainPerSpectrum?: number }
  | { type: 'seas_current_gain'; value: number }
  | { type: 'seas_polarity_shift'; polarity: 'White' | 'Black' }
  | { type: 'seas_release'; spend: number; oblivionPerCurrent: number; chainPerCurrent?: number }
  | { type: 'trail_gain'; value: number }
  | { type: 'trail_spend'; value: number }
  | { type: 'strain_gain'; value: number }
  | { type: 'strain_vent'; value: number }
  | { type: 'overclock'; strain: number; then: CardEffect[] }
  // Thornbound Plains overhaul effect types
  | { type: 'trail_linked_gain'; value: number } // Gain Trail for each linked card or event
  | { type: 'scar_echo'; value: number; max?: number } // Echoes a previous effect or value, e.g., for recursion
  | { type: 'funeral_procession'; value: number; perCard?: boolean } // Special procession effect, e.g., for card chain or synergy
  | { type: 'trail_burst'; value: number } // Burst Trail gain, e.g., for one-time effects
  | { type: 'scar_trigger'; effect: CardEffect } // Triggers a scar effect (delayed or conditional)
  | { type: 'trail_surge'; value: number } // Surge Trail gain, e.g., for combo turns
  | { type: 'trail_decay'; value: number } // Lose Trail (decay mechanic)
  | { type: 'trail_conversion'; to: 'oblivion' | 'chain' | 'draw'; ratio: number } // Convert Trail to another resource
  | { type: 'scar_chain'; value: number } // Chain gain from scars
  | { type: 'scar_multiplier'; value: number } // Multiplies effect based on scars
  | { type: 'scar_salvage'; value: number } // Salvage based on scars
  | { type: 'scar_draw'; value: number } // Draw based on scars
  | { type: 'scar_gain'; value: number } // Gain a scar token or effect
  | { type: 'scar_consume'; value: number } // Consume scar tokens for effect
  | { type: 'scar_amplify'; value: number } // Amplify effect based on scars
  | { type: 'scar_reset' } // Reset scars
  | { type: 'patience_gain_all'; value: number }
  | { type: 'patience_double_all' }
  | { type: 'neutrality_designate_vessel' }
  | { type: 'neutrality_vessel_copy_gain'; percent: number }
  | { type: 'neutrality_vessel_redistribute'; value: number }
  | { type: 'neutrality_mark_hand'; count: number; patience: number }
  | { type: 'neutrality_attack_preserve'; percent: number }
  | { type: 'neutrality_attack_restore'; percent: number }
  | { type: 'neutrality_linked_mode'; gain: number; retainPercent: number }
  | { type: 'pyro_furnace_pressure_gain'; value: number }
  | { type: 'pyro_furnace_pressure_spend'; value: number }
  | { type: 'pyro_abyss_fault_gain'; value: number }
  | { type: 'pyro_abyss_fault_spend'; value: number }
  | { type: 'pyro_ruin_window_gain'; value: number }
  | { type: 'pyro_convert_pressure_to_fault'; pressurePerFault: number; faultGain: number; maxFaultGain?: number }
  | { type: 'pyro_window_cashout'; oblivionPerWindow: number; chainPerWindow?: number; consume?: number }
  | { type: 'pyro_balance_bonus'; oblivionPerPair: number }
  // Eternal/Infinity per-set amplifier stacks. Each set has its own thematic
  // "stack" keyword that only Eternal and Infinite cards interact with.
  // pyro=Inferno Tier, light=Halo Crown, thorn=Thorncrown, glass=Eclipse Mark,
  // snow=Voltage Surge, mech=Reactor Core, prism=Mirror Chain, absol=Proof Cascade,
  // garden=Ember Bloom, flutter=Wing Resonance, tide=Tide Crown.
  | { type: 'eternal_stack_gain'; stack: EternalStackKind; value: number }
  | { type: 'eternal_stack_spend'; stack: EternalStackKind; value: number }
  | { type: 'eternal_stack_cashout'; stack: EternalStackKind; oblivionPerStack: number; chainPerStack?: number; drawPerStack?: number; consume?: number }
  // ---------------------------------------------------------------------------
  // Per-set secondary keywords. Generic counter storage (turn.secondaryCounters)
  // but each set's cashout has a thematically distinct payoff:
  //   pyro    = Cinder Echo     -> quadratic oblivion
  //   light   = Halo Cascade    -> raises chain floor
  //   thorn   = Briar Spiral    -> spirals -> Trail; chain scales with Trail
  //   mech    = Reactor Flux    -> strain vent: Strain -> oblivion + score mult
  //   prism   = Spectrum Echo   -> oblivion * distinctChannelsThisTurn
  //   glass   = Veil Shard      -> swap flames, ob per higher flame
  //   snow    = Static Pulse    -> phase-conditional: Voltage->ob, Frost->draw
  //   absol   = Cascade Proof   -> chain multiplier per cascade depth
  //   garden  = Wild Pollen     -> +Embers per pollen, score mult per Bloom
  //   flutter = Wing Pulse      -> doubles next N spectrum gains
  //   tide    = Tide Echo       -> polarity split
  | { type: 'set_secondary_gain'; kind: SetSecondaryKind; value: number }
  | { type: 'set_secondary_spend'; kind: SetSecondaryKind; value: number }
  | { type: 'pyro_cinder_echo_ignite'; oblivionPerEchoSquared: number; consume?: number }
  | { type: 'light_halo_cascade_resound'; chainFloorPerCascade: number; consume?: number }
  | { type: 'thorn_briar_spiral_bloom'; trailPerSpiral: number; chainPerTrail: number; consume?: number }
  | { type: 'mech_reactor_flux_vent'; oblivionPerFlux: number; scoreMultPerFlux: number; consume?: number }
  | { type: 'prism_spectrum_echo_refract'; oblivionPerEchoPerChannel: number; consume?: number }
  | { type: 'glass_veil_shard_swap'; oblivionPerHigherFlame: number; consume?: number }
  | { type: 'snow_static_pulse_discharge'; voltageOblivionPerPulse: number; frostDrawPerPulse: number; consume?: number }
  | { type: 'absol_cascade_proof_amplify'; chainPerProofDepth: number; consume?: number }
  | { type: 'garden_wild_pollen_seed'; embersPerPollen: number; scoreMultPerBloom: number; consume?: number }
  | { type: 'flutter_wing_pulse_amplify'; doubleNextGains: number; consume?: number }
  | { type: 'tide_echo_resolve'; chainPerPositive: number; oblivionPerNegative: number; consume?: number }
  // ── Abyssal Forge — The Reforging ────────────────────────────────────────
  | { type: 'forge_reforge_charge_gain'; value: number }
  | { type: 'forge_reforge_charge_cap_raise'; value: number }
  | { type: 'forge_pearl_drop'; value: number }
  | { type: 'forge_pearl_cashout'; spend: number; oblivionPerPearl: number; chainPerPearl?: number }
  | { type: 'forge_recast_last'; power: number }
  | { type: 'forge_recast_last_n'; count: number; power: number }
  | { type: 'forge_recast_random'; power: number; count?: number }
  | { type: 'forge_nacre_recast'; targetMode: 'last' | 'lastN'; count?: number; power: number }
  | { type: 'forge_ouroboric_recast'; power: number }
  | { type: 'forge_temper'; targetMode: 'self' | 'all_seraphim_on_board' | 'last_played'; factor: number }
  | { type: 'forge_anvil_seal'; target: 'self' | 'last_played'; burstOblivion: number; burstChain: number }
  | { type: 'forge_nacre_coat'; targetMode: 'all_played' | 'last_played' }
  | { type: 'forge_unrecorded_ignite' }
  | { type: 'forge_crown_cashout'; oblivionPerCrown: number; chainPerCrown?: number }
  // ── Death-flamed Hell — Pyre Ascendancy ───────────────────────────────────
  // Pyre Embers live on eternalStacks['pyre']; Cinder Crowns live on
  // secondaryCounters['pyre']. dfh_crown_cashout consumes Crowns for a
  // big oblivion+chain finale (the Eternal/Infinite tier signature).
  | { type: 'dfh_crown_cashout'; oblivionPerCrown: number; chainPerCrown?: number; consume?: number }
  // ── Wished Upon A Star — Stellar Wish System (base-card mechanics) ─────────
  // starlightCharges and dreamLattice live directly on TurnState (same as Iron Dominion).
  | { type: 'starlight_gain'; amount: number }
  | { type: 'starlight_spend'; amount: number }
  | { type: 'dream_lattice_gain'; amount: number }
  | { type: 'dream_lattice_spend'; amount: number }
  // Nova Wish Burst: oblivion = starlightCharges × (1 + dreamLattice × 0.4).
  // consumeStarlight: if true, resets starlightCharges to 0 after cashout.
  | { type: 'wuas_nova_wish_burst'; consumeStarlight?: boolean; dreamMultiplier?: number }
  // Eternal tier cashout: chain + oblivion scaled by eternalStacks['wuas'] and dreamLattice.
  | { type: 'wuas_constellation_lock_release'; oblivionPerStack: number; chainPerDream?: number; consume?: number }
  // Infinite tier cashout: fires based on board seraphim count × starlightCharges, no stack consume.
  | { type: 'wuas_infinite_starbirth'; oblivionPerSeraphimPerStarlight: number; drawPerDream?: number };

export type EternalStackKind =
  | 'pyro'
  | 'light'
  | 'thorn'
  | 'glass'
  | 'snow'
  | 'mech'
  | 'prism'
  | 'absol'
  | 'garden'
  | 'flutter'
  | 'tide'
  | 'forge'
  | 'pyre'
  | 'wuas';

/** Per-set secondary keyword kinds — mirrors EternalStackKind 1:1. */
export type SetSecondaryKind = EternalStackKind;

export type EffectCondition =
  | { type: 'radiance_gte'; value: number }
  | { type: 'black_glass_white_flame_gte'; value: number }
  | { type: 'black_glass_black_flame_gte'; value: number }
  | { type: 'black_glass_fracture_gte'; value: number }
  | { type: 'black_glass_flame_delta_gte'; value: number }
  | { type: 'black_glass_flame_delta_lte'; value: number }
  | { type: 'black_glass_flames_equal' }
  | { type: 'light_resonance_gte'; value: number }
  | { type: 'light_distinct_notes_gte'; value: number }
  | { type: 'light_chorus_anchors_gte'; value: number }
  | { type: 'cards_played_gte'; value: number }
  | { type: 'seraphim_active_gte'; value: number }
  | { type: 'cherubim_active_gte'; value: number }
  | { type: 'first_card_this_turn' }
  | { type: 'ember_gte'; value: number }
  | { type: 'trail_gte'; value: number }
  | { type: 'strain_gte'; value: number }
  | { type: 'strain_lte'; value: number }
  | { type: 'prismatic_light_gte'; value: number }
  | { type: 'prismatic_refraction_depth_gte'; value: number }
  | { type: 'prismatic_node_charges_gte'; value: number }
  | { type: 'prismatic_memory_shards_gte'; value: number }
  | { type: 'prismatic_distinct_channels_gte'; value: number }
  | { type: 'shards_gte'; value: number }
  | { type: 'arctic_charge_gte'; value: number }
  | { type: 'snowbound_phase_is'; phase: 'Frost' | 'Voltage' }
  | { type: 'snowbound_potential_gte'; value: number }
  | { type: 'snowbound_alternations_gte'; value: number }
  | { type: 'snowbound_conduits_gte'; value: number }
  | { type: 'snowbound_alternated_this_turn' }
  | { type: 'snowbound_same_phase_as_last_turn' }
  | { type: 'proof_gte'; value: number }
  | { type: 'bloom_gte'; value: number }
  | { type: 'butterfly_spectrum_gte'; value: number }
  | { type: 'seas_current_gte'; value: number }
  | { type: 'seas_margin_gte'; value: number }
  | { type: 'seas_polarity_is'; polarity: 'White' | 'Black' }
  | { type: 'pyro_furnace_pressure_gte'; value: number }
  | { type: 'pyro_abyss_fault_gte'; value: number }
  | { type: 'pyro_ruin_window_gte'; value: number }
  | { type: 'burn_phase_cards_gte'; value: number }
  | { type: 'grove_cards_gte'; value: number }
  | { type: 'pyro_pressure_higher' }
  | { type: 'pyro_fault_higher' }
  | { type: 'pyro_pools_balanced' }
  // Thornbound Plains overhaul effect conditions
  | { type: 'trail_linked_gte'; value: number }
  | { type: 'scar_count_gte'; value: number }
  | { type: 'funeral_procession_active' }
  | { type: 'trail_burst_active' }
  | { type: 'scar_triggered' }
  | { type: 'trail_surge_active' }
  | { type: 'trail_decay_active' }
  | { type: 'trail_conversion_active' }
  | { type: 'scar_chain_active' }
  | { type: 'scar_multiplier_active' }
  | { type: 'scar_salvage_active' }
  | { type: 'scar_draw_active' }
  | { type: 'scar_gain_active' }
  | { type: 'scar_consume_active' }
  | { type: 'scar_amplify_active' }
  | { type: 'scar_reset_active' }
  | { type: 'eternal_stack_gte'; stack: EternalStackKind; value: number }
  | { type: 'set_secondary_gte'; kind: SetSecondaryKind; value: number }
  | { type: 'forge_reforge_charges_gte'; value: number }
  | { type: 'forge_pearls_gte'; value: number }
  | { type: 'forge_recast_count_gte'; value: number }
  | { type: 'forge_unrecorded_hue_active' }
  | { type: 'starlight_gte'; value: number }
  | { type: 'dream_lattice_gte'; value: number }

export interface ConditionalEffect {
  type: 'conditional';
  condition: EffectCondition;
  then: CardEffect[];
}

export type CherubimPassiveEffect =
  | { type: 'cherubim_oblivion_per_card'; value: number }
  | { type: 'cherubim_ophanim_bonus'; value: number }
  | { type: 'cherubim_chain_bonus'; value: number }
  | { type: 'cherubim_seraphim_amp'; value: number }
  | { type: 'cherubim_ember_gain'; value: number }
  | { type: 'cherubim_draw_per_card'; value: number }
  | { type: 'cherubim_resource_per_card'; resource: 'ember' | 'radiance' | 'trail' | 'strain'; value: number }
  | { type: 'cherubim_adjacent_seraphim_bonus'; value: number; bonusType: 'oblivion' | 'draw' | 'chain' }
  | { type: 'cherubim_conditional_buff'; condition: EffectCondition; value: number }
  | { type: 'cherubim_patience_per_card'; value: number }
  | {
      type: 'cherubim_attack_buff';
      targetUnitType: 'Seraphim' | 'Angel' | 'Any';
      targetDefinitionIds?: string[];
      targetTags?: string[];
      condition?: EffectCondition;
      bonusBaseOblivion?: number;
      bonusChainScaling?: number;
      cooldownDeltaCards?: number;
      multiplier?: number;
    }
  // Thornbound Plains overhaul effect types
  | { type: 'cherubim_funeral_procession'; value: number; perCard?: boolean }
  | { type: 'cherubim_scar_echo'; value: number; max?: number }
  | { type: 'cherubim_trail_linked_gain'; value: number }
  | { type: 'cherubim_trail_burst'; value: number }
  | { type: 'cherubim_scar_trigger'; effect: CardEffect }
  | { type: 'cherubim_trail_surge'; value: number }
  | { type: 'cherubim_trail_decay'; value: number }
  | { type: 'cherubim_trail_conversion'; to: 'oblivion' | 'chain' | 'draw'; ratio: number }
  | { type: 'cherubim_scar_chain'; value: number }
  | { type: 'cherubim_scar_multiplier'; value: number }
  | { type: 'cherubim_scar_salvage'; value: number }
  | { type: 'cherubim_scar_draw'; value: number }
  | { type: 'cherubim_scar_gain'; value: number }
  | { type: 'cherubim_scar_consume'; value: number }
  | { type: 'cherubim_scar_amplify'; value: number }
  | { type: 'cherubim_scar_reset' }
  // Abyssal Forge — recast-aware passives
  | { type: 'cherubim_recast_chain_bonus'; value: number }
  | { type: 'cherubim_recast_oblivion_bonus'; value: number }
  | { type: 'cherubim_charge_per_n_cards'; n: number }
  | { type: 'cherubim_temper_on_next_seraphim'; factor: number }
  | { type: 'cherubim_pearl_per_recast_bonus'; value: number }
  | { type: 'cherubim_seraphim_recast_amp'; value: number }
  | BlazingGardenEffect

export type CoreCardEffect = BoardEffect | ImmediateEffect | ConditionalEffect;

// Blazing Garden Eternal/Infinity custom effect types
export type BlazingGardenEffect =
  | { type: 'set_garden_law'; law: 'Rose' | 'Sunflower' | 'Thistle' }
  | { type: 'effect_plus'; value: number }
  | { type: 'choose_lineage'; effect: CardEffect }
  | { type: 'burn_phase_seed_on_other_lineage_play'; value: number }
  | { type: 'echo_effect_double'; duration: number }
  | { type: 'sigil_on_burn_play'; value: number }
  | { type: 'sigil_threshold_echo_return'; threshold: number }
  | { type: 'sigil_draw_on_gain'; value: number }
  | { type: 'choose_burn_card'; effect: CardEffect }
  | { type: 'archive_crown_on_new_lineage'; value: number; threshold: number; trigger: 'burn_attack_all' }
  | { type: 'burn_attack_all' }
  | { type: 'burn_cooldown_reduction_per_crown'; value: number }
  | { type: 'char_to_memory_echo'; value: number }
  | { type: 'memory_echo_buff'; effect: CardEffect }
  | { type: 'memory_echo_cost_reduction'; value: number }
  | { type: 'replay_last_burn_card' }
  | { type: 'ignite_units_burn'; count: number }
  | { type: 'mini_final_chord_on_diff_lineages'; effect: CardEffect }
  | { type: 'echo_on_burn_play'; value: number }
  | { type: 'snapshot_burn_lineages' }
  | { type: 'incandescent_chorus_on_new_lineage'; effect: CardEffect }
  | { type: 'burn_lineage_echo_and_cooldown'; echo: number; cooldown: number }
  | { type: 'final_chord_bloom_if_all_lineages'; effect: CardEffect; trigger: 'end_of_turn' }
  | { type: 'bloom_all_lineages'; multiplier: number }
  | { type: 'seed_grove_with_worldflower'; per_burn: number }
  | { type: 'worldflower_echo_on_char'; duration: number }
  | { type: 'worldflower_bonus_on_three'; bonus: number }
  | { type: 'choose_burn_cards'; count: number; effect: CardEffect }
  | { type: 'char_revive_echo_double'; duration: number }
  | { type: 'echo_persistence_bonus'; duration: number }
  | { type: 'geometry_mode_on_new_lineage'; effect: CardEffect }
  | { type: 'burn_all_effects_plus'; value: number; cooldown?: number }
  | { type: 'geometry_mode_next_turn_on_three_lineages' }
  | { type: 'gate_payoff'; gates: { condition: EffectCondition; payoff: CardEffect }[] }
  | { type: 'zenith_on_all_gates'; effect: CardEffect; duration: number }
  | { type: 'gain_echo'; value: number }
  | { type: 'burn_attack'; value: number }
  | { type: 'salvage_burn_from_discard' }
  | { type: 'copy_garden_law_to_sky_law'; effects: { law: 'Rose' | 'Sunflower' | 'Thistle'; effect: CardEffect }[] }
  | { type: 'burn_return_to_hand_as_echo'; duration: number }
  | { type: 'burn_cooldown_reduction'; value: number; duration: number };

export type CardEffect = CoreCardEffect | BlazingGardenEffect;

export interface ActiveBoardEffect {
  type: BoardEffectType;
  value: number;
}
