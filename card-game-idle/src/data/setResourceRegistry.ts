/**
 * setResourceRegistry.ts
 *
 * Single source of truth for which set "owns" each resource, effect type,
 * eternal-stack kind, set-secondary kind, and cherubim resource key.
 *
 * Used by:
 *  - CrossSetContaminationAudit.test.ts (automated guard)
 *  - generate-card-effects-docs.mts (doc generator)
 *  - Future per-set creativity audit helpers
 *
 * Adding a new set-specific resource: extend the relevant SetProfile below.
 * Cross-set Eternal/Infinite usage is explicitly whitelisted via
 * `CROSS_SET_EXEMPT_PREFIXES`.
 */

import type { Element } from '@/types/elements';

export type SetId = Element;

export interface SetProfile {
  /** Human-readable set name. */
  displayName: string;
  /** element value used in card definitions. */
  element: SetId;
  /**
   * Effect `.type` prefixes that belong exclusively to this set.
   * A card from a different set that uses any of these effect types is
   * contaminated.
   */
  effectTypePrefixes: string[];
  /**
   * Exact effect `.type` strings (for types that share a prefix with other
   * effects but are set-specific).
   */
  effectTypeExact: string[];
  /**
   * `eternal_stack_gain / spend / cashout` with these `stack` values belong
   * to this set.
   */
  eternalStackKinds: string[];
  /**
   * `set_secondary_gain / spend` with these `kind` values belong to this set.
   */
  setSecondaryKinds: string[];
  /**
   * `cherubim_resource_per_card` with these `resource` values belong to this
   * set.
   */
  cherubimResourceKeys: string[];
  /**
   * EffectCondition `.type` values that belong to this set.
   */
  conditionTypes: string[];
  /**
   * Cherubim passive effect `.type` values that belong exclusively to this
   * set.
   */
  cherubimPassiveTypes: string[];
}

export const SET_PROFILES: SetProfile[] = [
  {
    displayName: 'Neutrality',
    element: 'Neutrality',
    effectTypePrefixes: ['neutrality_', 'patience_'],
    effectTypeExact: [],
    eternalStackKinds: [],
    setSecondaryKinds: [],
    cherubimResourceKeys: [],
    conditionTypes: ['equilibrium_sigils_gte'],
    cherubimPassiveTypes: ['cherubim_patience_per_card'],
  },
  {
    displayName: 'Heavenly Light',
    element: 'Light',
    effectTypePrefixes: ['radiance_', 'light_transcendent_'],
    effectTypeExact: [],
    eternalStackKinds: ['light'],
    setSecondaryKinds: ['light'],
    cherubimResourceKeys: ['radiance'],
    conditionTypes: ['radiance_gte', 'radiance_lte'],
    cherubimPassiveTypes: [],
  },
  {
    displayName: 'Pyroabyss',
    element: 'Fire',
    effectTypePrefixes: ['pyro_'],
    effectTypeExact: [],
    eternalStackKinds: ['pyro'],
    setSecondaryKinds: ['pyro'],
    cherubimResourceKeys: [],
    conditionTypes: ['pyro_heat_gte', 'burn_phase_cards_gte'],
    cherubimPassiveTypes: ['cherubim_pyro_heat_gain'],
  },
  {
    displayName: 'Thornbound Plains',
    element: 'Thornbound',
    effectTypePrefixes: ['trail_', 'thorn_'],
    effectTypeExact: [],
    eternalStackKinds: ['thorn'],
    setSecondaryKinds: ['thorn'],
    cherubimResourceKeys: ['trail'],
    conditionTypes: ['trail_gte', 'scar_count_gte'],
    cherubimPassiveTypes: [],
  },
  {
    displayName: 'Mechanical Dreams',
    element: 'Mechanical',
    effectTypePrefixes: ['strain_'],
    effectTypeExact: ['overclock', 'resonance_charge_gain', 'resonance_charge_spend'],
    eternalStackKinds: ['mech'],
    setSecondaryKinds: ['mech'],
    cherubimResourceKeys: ['strain'],
    conditionTypes: ['strain_gte', 'strain_lte', 'resonance_charge_gte'],
    cherubimPassiveTypes: [],
  },
  {
    displayName: 'Prismatic Accord',
    element: 'Prismatic',
    effectTypePrefixes: ['prismatic_'],
    effectTypeExact: ['resonance_charge_gain', 'resonance_charge_spend'],
    eternalStackKinds: ['prism'],
    setSecondaryKinds: ['prism'],
    cherubimResourceKeys: ['prismaticLight'],
    conditionTypes: ['prismatic_refraction_depth_gte', 'prismatic_node_charges_gte', 'prismatic_distinct_channels_gte', 'resonance_charge_gte'],
    cherubimPassiveTypes: [],
  },
  {
    displayName: 'Black Glass Inferno',
    element: 'Dark',
    effectTypePrefixes: ['black_glass_', 'monochromatic_shards_'],
    effectTypeExact: [],
    eternalStackKinds: ['glass'],
    setSecondaryKinds: ['glass'],
    cherubimResourceKeys: [],
    conditionTypes: ['black_glass_black_flame_gte', 'black_glass_fracture_gte', 'black_glass_flames_equal'],
    cherubimPassiveTypes: [],
  },
  {
    displayName: 'Snowbound Voltage',
    element: 'Snowbound',
    effectTypePrefixes: ['arctic_charge_', 'snow_'],
    effectTypeExact: [],
    eternalStackKinds: ['snow'],
    setSecondaryKinds: ['snow'],
    cherubimResourceKeys: ['arcticCharge'],
    conditionTypes: [],
    cherubimPassiveTypes: [],
  },
  {
    displayName: 'Glass Absolute',
    element: 'GlassAbsolute',
    effectTypePrefixes: ['absol_'],
    effectTypeExact: [],
    eternalStackKinds: ['absol'],
    setSecondaryKinds: ['absol'],
    cherubimResourceKeys: ['absol'],
    conditionTypes: [],
    cherubimPassiveTypes: [],
  },
  {
    displayName: 'Blazing Garden',
    element: 'BlazingGarden',
    effectTypePrefixes: ['bloom_', 'garden_'],
    effectTypeExact: [
      'set_garden_law', 'echo_effect_double', 'sigil_on_burn_play', 'replay_last_burn_card',
      'ignite_units_burn', 'snapshot_burn_lineages', 'incandescent_chorus_on_new_lineage',
      'burn_lineage_echo_and_cooldown', 'final_chord_bloom_if_all_lineages', 'bloom_all_lineages',
      'seed_grove_with_worldflower', 'worldflower_echo_on_char', 'worldflower_bonus_on_three',
      'choose_burn_cards', 'char_revive_echo_double', 'echo_persistence_bonus',
      'geometry_mode_on_new_lineage', 'burn_all_effects_plus', 'geometry_mode_next_turn_on_three_lineages',
      'gate_payoff', 'zenith_on_all_gates', 'gain_echo', 'burn_attack', 'salvage_burn_from_discard',
      'copy_garden_law_to_sky_law', 'burn_return_to_hand_as_echo', 'burn_cooldown_reduction',
    ],
    eternalStackKinds: ['garden'],
    setSecondaryKinds: ['garden'],
    cherubimResourceKeys: [],
    conditionTypes: ['grove_cards_gte'],
    cherubimPassiveTypes: [],
  },
  {
    displayName: 'Age of the Butterfly',
    element: 'Butterfly',
    effectTypePrefixes: ['butterfly_', 'flutter_'],
    effectTypeExact: [],
    eternalStackKinds: ['flutter'],
    setSecondaryKinds: ['flutter'],
    cherubimResourceKeys: ['butterflySpectrum'],
    conditionTypes: [],
    cherubimPassiveTypes: [],
  },
  {
    displayName: 'Eternal Seas',
    element: 'EternalSeas',
    effectTypePrefixes: ['seas_'],
    effectTypeExact: [],
    eternalStackKinds: ['deepwake', 'tide'],
    setSecondaryKinds: ['deepwake', 'tide'],
    cherubimResourceKeys: ['undertow'],
    conditionTypes: [
      'eternal_seas_undertow_gte', 'eternal_seas_foam_gte',
      'eternal_seas_tide_balance', 'eternal_seas_tide_imbalance_gte',
    ],
    cherubimPassiveTypes: ['cherubim_seas_release_reaction'],
  },
  {
    displayName: 'Abyssal Forge',
    element: 'AbyssalForge',
    effectTypePrefixes: ['forge_'],
    effectTypeExact: [],
    eternalStackKinds: ['forge'],
    setSecondaryKinds: ['forge'],
    cherubimResourceKeys: [],
    conditionTypes: [],
    cherubimPassiveTypes: [
      'cherubim_recast_oblivion_bonus', 'cherubim_charge_per_n_cards',
      'cherubim_temper_on_next_seraphim', 'cherubim_pearl_per_recast_bonus',
      'cherubim_seraphim_recast_amp',
    ],
  },
  {
    displayName: 'Death-flamed Hell',
    element: 'DeathFlamedHell',
    effectTypePrefixes: ['dfh_'],
    effectTypeExact: [],
    eternalStackKinds: ['pyre'],
    setSecondaryKinds: ['pyre'],
    cherubimResourceKeys: [],
    conditionTypes: ['dfh_veil_marks_gte'],
    cherubimPassiveTypes: [],
  },
  {
    displayName: 'Wished Upon a Star',
    element: 'WishedUponAStar',
    effectTypePrefixes: ['starlight_', 'dream_lattice_', 'wuas_'],
    effectTypeExact: [],
    eternalStackKinds: ['wuas'],
    setSecondaryKinds: ['wuas'],
    cherubimResourceKeys: [],
    conditionTypes: ['starlight_gte', 'dream_lattice_gte'],
    cherubimPassiveTypes: [],
  },
];

/** Index by element for O(1) lookup. */
export const SET_PROFILE_BY_ELEMENT: Map<SetId, SetProfile> = new Map(
  SET_PROFILES.map(p => [p.element, p]),
);

/**
 * Effect `.type` prefixes that are always cross-set (never contamination).
 * These are universal primitives used by all sets.
 */
export const UNIVERSAL_EFFECT_PREFIXES: string[] = [
  'oblivion_flat',
  'score_flat',
  'draw',
  'discard_choice',
  'discard_draw',
  'shuffle_discard',
  'copy_last_hr',
  'look_top_',
  'search_deck_',
  'salvage_',
  'conditional',
  'eternal_stack_',   // scoped per-stack in contamination logic
  'set_secondary_',   // scoped per-kind in contamination logic
  'score_multiplier',
  'seraphim_bonus_amplifier',
];

/** Cherubim passive types allowed in any set. */
export const UNIVERSAL_CHERUBIM_PASSIVE_TYPES: string[] = [
  'cherubim_oblivion_per_card',
  'cherubim_ophanim_bonus',
  'cherubim_seraphim_amp',
  'cherubim_draw_per_card',
  'cherubim_adjacent_seraphim_bonus',
  'cherubim_on_discard',
  'cherubim_conditional_buff',
  'cherubim_attack_buff',
  'cherubim_global_oblivion_mult',
];

/**
 * Definition-id prefixes whose cards intentionally cross set boundaries
 * (Neutrality Eternal/Infinite cross-set cards, shared event set).
 */
export const CROSS_SET_EXEMPT_ID_PREFIXES: string[] = [
  'inf-',   // Neutrality Infinite (cross-set by design)
  'btei-',  // Eternal cross-set
  'sv-eternal-',
  'sv-infinite-',
];
