/**
 * setResourceRegistry.ts
 *
 * Single source of truth for which set "owns" each resource, effect type,
 * eternal-stack kind, set-secondary kind, and cherubim resource key.
 *
 * Used by:
 *  - Future per-set creativity audit helpers
 *
 * Adding a new set-specific resource: extend the relevant SetProfile below.
 * Cross-set Eternal/Infinite usage is explicitly whitelisted via
 * `CROSS_SET_EXEMPT_PREFIXES`.
 */

export type SetId = 'Neutrality';

export interface SetProfile {
  /** Human-readable set name. */
  displayName: string;
  /** Set identifier used in set-scoped configs. */
  setId: SetId;
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
    setId: 'Neutrality',
    effectTypePrefixes: ['neutrality_', 'patience_'],
    effectTypeExact: [],
    eternalStackKinds: [],
    setSecondaryKinds: [],
    cherubimResourceKeys: [],
    conditionTypes: ['equilibrium_sigils_gte'],
    cherubimPassiveTypes: ['cherubim_patience_per_card'],
  },
];
/** Index by setId for O(1) lookup. */
export const SET_PROFILE_BY_ELEMENT: Map<SetId, SetProfile> = new Map(
  SET_PROFILES.map(p => [p.setId, p]),
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
];
