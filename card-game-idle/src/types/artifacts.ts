// ── Artifact System ────────────────────────────────────────────────────────────
// Each card set has 3 artifacts (basic → advanced → apex). Players dissolve
// collection cards into per-set powder and spend it on persistent artifacts.
// Up to 3 owned artifacts can be equipped per saved deck.

export type ArtifactTier = 'basic' | 'advanced' | 'apex';

/** All possible effect types an artifact can contribute to the game loop. */
export type ArtifactEffectType =
  // Shared — Oblivion multiplier when cards of the artifact's set are played
  | 'oblivion_set_mult'

  // Neutrality — Patience-system-native (Equilibrium/Attenuation mechanics
  // are no longer used by Neutrality cards; these artifacts plug into the
  // Patience accumulation + threshold-cashout loop that Seraphim use).
  | 'patience_cap_bonus'                  // +N Patience/turn per Seraphim with a patience threshold
  | 'patience_threshold_draw_bonus'       // +N extra cards drawn when a Patience threshold cashes out on attack
  | 'patience_preserve_percent'           // +N% of consumed Patience is preserved (rolled back into the Seraphim) after cashout

  // Pyroabyss
  | 'heat_cap_bonus'
  | 'cinder_echo_oblivion_mult'
  | 'pyro_full_fire_mult_bonus'      // added to the 1.23 base multiplier

  // Heavenly Light
  | 'resonance_gain_bonus'
  | 'resonance_chain_extend'
  | 'halo_cascade_draw_bonus'

  // Thornbound
  | 'trail_gain_bonus'
  | 'scar_payout_mult'
  | 'trail_spend_discount'

  // Mechanical Dreams
  | 'queue_capacity_bonus'
  | 'strain_restore_on_vent'
  | 'queue_flush_oblivion_mult'

  // Prismatic Accord
  | 'channel_count_bonus'
  | 'refraction_cascade_bonus'
  | 'chord_threshold_reduction'

  // Black Glass Inferno
  | 'flame_start_bonus'
  | 'fracture_oblivion_mult'
  | 'veil_shard_tier_bonus'

  // Snowbound Voltage
  | 'voltage_surge_rate'
  | 'phase_transition_oblivion_bonus'
  | 'discharge_mult_bonus'           // added to 1.0 base discharge mult

  // Glass Absolute
  | 'proof_threshold_reduction'
  | 'chain_mult_start_bonus'
  | 'cascade_proof_all_board'        // flag (value=1 means active)

  // Blazing Garden
  | 'ember_grove_capacity'
  | 'burn_pollen_link'               // flag (value=1)
  | 'char_ember_bonus'

  // Age of the Butterfly
  | 'wing_resonance_gain_bonus'
  | 'wing_pulse_duration_bonus'
  | 'butterfly_spectrum_peak_draw_bonus'

  // Eternal Seas
  | 'tide_crown_rate_bonus'
  | 'polarity_split_oblivion_mult'
  | 'tide_echo_double'               // flag (value=1)

  // Abyssal Forge
  | 'iron_charge_start_bonus'
  | 'weld_mark_chain_bonus'
  | 'forge_full_fire_mult_bonus'

  // Death-flamed Hell (TBD — mechanic audit needed)
  | 'dfh_infernal_pressure_bonus'
  | 'dfh_soulflame_mult'
  | 'dfh_apocalypse_chain_bonus';

export interface ArtifactEffect {
  type: ArtifactEffectType;
  /** Numeric magnitude of the effect (interpretation depends on type). */
  value: number;
}

export interface ArtifactDefinition {
  id: string;
  /** Element key matching PackDefinition.element or special-cased values ('SnowboundVoltage'). */
  setElementKey: string;
  /** Display name of the set (for grouping). */
  setName: string;
  tier: ArtifactTier;
  name: string;
  description: string;
  /** Legacy single-purchase cost. Kept for back-compat; the live mastery system uses ARTIFACT_TIER_COPY_COST instead. */
  powderCost: number;
  effects: ArtifactEffect[];
}

/** Card-bane Light yield when dissolving a card by rarity. */
export const RARITY_POWDER_YIELD: Record<string, number> = {
  Common: 1,
  Rare: 3,
  Epic: 10,
  Legendary: 30,
  Eternal: 100,
  Infinite: 300,
};

/** Rarity index used for set-progression dissolve scaling (1..6). */
const RARITY_PROGRESSION_INDEX: Record<string, number> = {
  Common: 1,
  Rare: 2,
  Epic: 3,
  Legendary: 4,
  Eternal: 5,
  Infinite: 6,
};

/**
 * Dissolve yield for a single card. Base RARITY_POWDER_YIELD plus a
 * progression bonus of +50 per rarity tier per card-set step beyond the first.
 * The set step is the card's element index in {@link ARTIFACT_SET_COST_ORDER}
 * (1-based; Neutrality = 1, Death-flamed Hell = 14). Neutrality contributes
 * no bonus so its cards keep their base RARITY_POWDER_YIELD values. Unknown
 * sets use step = 1 (no bonus).
 *
 *   yield = baseRarityYield + 50 × rarityIndex × (setIndex - 1)
 *
 * Examples:
 *   Neutrality Common       = 1   + 50×1×0  = 1
 *   Neutrality Infinite     = 300 + 50×6×0  = 300
 *   Fire Common             = 1   + 50×1×1  = 51
 *   Death-flamed Hell Infinite = 300 + 50×6×13 = 4200
 */
export function getCardDissolveYield(rarity: string, element: string): number {
  const base = RARITY_POWDER_YIELD[rarity] ?? 1;
  const rarityIdx = RARITY_PROGRESSION_INDEX[rarity] ?? 1;
  const elementIdx = ARTIFACT_SET_COST_ORDER.indexOf(element);
  const setStep = elementIdx >= 0 ? elementIdx : 0;
  return base + 50 * rarityIdx * setStep;
}

/** Legacy tier-based one-shot cost (no longer used for purchasing; kept to avoid breaking back-compat). */
export const ARTIFACT_TIER_COSTS: Record<ArtifactTier, number> = {
  basic: 15,
  advanced: 40,
  apex: 100,
};

// ── Mastery System ─────────────────────────────────────────────────────────
// Each artifact tracks total copies bought. Mastery thresholds:
//   1 copy  → ML0 (unlocked)
//   4 copies → ML1 (after 3 additional copies)
//   9 copies → ML2 (after 5 more copies)
//  10 copies + 10,000 Aberrated Shards → ML3 / Apex Form

/**
 * Base Card-bane Light cost per additional copy at the Neutrality (first) set, by tier.
 * Each subsequent set doubles this cost, mirroring how pack prices scale in the shop.
 * Use {@link getArtifactCopyCost} to obtain the actual cost for a given artifact.
 */
export const ARTIFACT_TIER_COPY_COST: Record<ArtifactTier, number> = {
  basic: 25_000,
  advanced: 75_000,
  apex: 200_000,
};

/**
 * Per-set Light cost multiplier. Index in this list = power of 2 applied to base tier cost,
 * matching the doubling pattern of PACK_DEFINITIONS pack costs.
 * Neutrality = ×1, Fire = ×2, Light = ×4, ..., DeathFlamedHell = ×2^13.
 * Non-Neutrality sets additionally receive a flat ×5 multiplier on top.
 */
export const ARTIFACT_SET_COST_ORDER: string[] = [
  'Neutrality',
  'Fire',
  'Light',
  'Thornbound',
  'Mechanical',
  'Prismatic',
  'Dark',
  'SnowboundVoltage',
  'GlassAbsolute',
  'BlazingGarden',
  'Butterfly',
  'EternalSeas',
  'AbyssalForge',
  'DeathFlamedHell',
];

/**
 * Returns the Light cost multiplier for a set's artifacts.
 * Neutrality stays at ×1 (no scaling); every other set doubles per index AND
 * gets an additional ×5 progression tax.
 */
export function getArtifactSetCostMultiplier(setElementKey: string): number {
  const idx = ARTIFACT_SET_COST_ORDER.indexOf(setElementKey);
  if (idx <= 0) return 1;
  return 5 * Math.pow(2, idx);
}

/** Returns the Light cost of buying one additional copy of an artifact. */
export function getArtifactCopyCost(artifact: { tier: ArtifactTier; setElementKey: string }): number {
  return ARTIFACT_TIER_COPY_COST[artifact.tier] * getArtifactSetCostMultiplier(artifact.setElementKey);
}

/** Aberrated Shards required to unlock Mastery Level 3 (Apex Form). */
export const ARTIFACT_APEX_SHARD_COST = 2_500;

/** Total copies required to reach each mastery level. */
export const ARTIFACT_MASTERY_THRESHOLDS = {
  ML0: 1,
  ML1: 4,
  ML2: 9,
  ML3: 10,
} as const;

export type ArtifactMasteryLevel = 0 | 1 | 2 | 3;

/** Returns the mastery level granted by `copies`. 0 means not yet owned. */
export function getMasteryLevel(copies: number): ArtifactMasteryLevel | -1 {
  if (copies <= 0) return -1;
  if (copies >= ARTIFACT_MASTERY_THRESHOLDS.ML3) return 3;
  if (copies >= ARTIFACT_MASTERY_THRESHOLDS.ML2) return 2;
  if (copies >= ARTIFACT_MASTERY_THRESHOLDS.ML1) return 1;
  return 0;
}

/** Effect-value multiplier by mastery level. Linear scaling. */
export function getMasteryMultiplier(copies: number): number {
  const ml = getMasteryLevel(copies);
  switch (ml) {
    case 3: return 3.0;
    case 2: return 2.0;
    case 1: return 1.5;
    case 0: return 1.0;
    default: return 0;
  }
}

/** Total copies needed for the next mastery level, or null if at apex. */
export function getNextMasteryThreshold(copies: number): number | null {
  if (copies < ARTIFACT_MASTERY_THRESHOLDS.ML0) return ARTIFACT_MASTERY_THRESHOLDS.ML0;
  if (copies < ARTIFACT_MASTERY_THRESHOLDS.ML1) return ARTIFACT_MASTERY_THRESHOLDS.ML1;
  if (copies < ARTIFACT_MASTERY_THRESHOLDS.ML2) return ARTIFACT_MASTERY_THRESHOLDS.ML2;
  if (copies < ARTIFACT_MASTERY_THRESHOLDS.ML3) return ARTIFACT_MASTERY_THRESHOLDS.ML3;
  return null;
}
