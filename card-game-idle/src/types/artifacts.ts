// ── Artifact System ────────────────────────────────────────────────────────────
// Each card set has 3 artifacts (basic → advanced → apex). Players dissolve
// collection cards into per-set powder and spend it on persistent artifacts.
// Up to 3 owned artifacts can be equipped per saved deck.

export type ArtifactTier = 'basic' | 'advanced' | 'apex';

/** All possible effect types an artifact can contribute to the game loop. */
export type ArtifactEffectType =
  // Neutrality — Patience-system-native
  | 'patience_gain_bonus'             // +N Patience gained per card played to each Seraphim
  | 'patience_attack_oblivion_bonus'  // +N flat Oblivion when a Seraphim fires with >= threshold Patience
  | 'patience_threshold_reduction'    // Seraphim Patience threshold reduced by N (min 1)

  // Pyroabyss
  | 'pyro_infinite_payout_bonus'      // added to Pyro Infinite payout multiplier

  // Heavenly Light
  | 'resonance_gain_bonus'             // (Legacy Cadence artifact; runtime handler retired in Phase 0 gut)

  // Thornbound
  | 'trail_spend_discount'            // Trail spend abilities cost N less (min 0)

  // Mechanical Dreams

  // Prismatic Accord

  // Black Glass Inferno
  | 'flame_start_bonus'               // White Flame and Black Flame each start N higher

  // Snowbound Voltage
  | 'voltage_surge_rate'              // +N Voltage Surge tokens at turn start

  // Glass Absolute
  | 'proof_threshold_reduction'       // Glass Absolute Seraphim start each turn with N extra Proof tokens

  // Blazing Garden
  | 'bloom_start_bonus'               // +N Bloom at the start of each turn

  // Age of the Butterfly

  // Eternal Seas (legacy key kept for back-compat data)
  | 'tide_crown_rate_bonus'           // +N legacy Tide Crown tokens at turn start

  // Abyssal Forge
  | 'forge_full_fire_mult_bonus'      // added to the Forge full-fire gate base multiplier

  // Death-flamed Hell
  | 'dfh_infernal_pressure_bonus';    // +N to the Infernal Pressure cap

export interface ArtifactEffect {
  type: ArtifactEffectType;
  /** Numeric magnitude of the effect (interpretation depends on type). */
  value: number;
}

export interface ArtifactDefinition {
  id: string;
  /** Set identifier for this artifact (e.g. 'Neutrality'). */
  setId: string;
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

/** Dissolve yield for a single card by rarity. Only Neutrality (step 0) exists. */
export function getCardDissolveYield(rarity: string): number {
  return RARITY_POWDER_YIELD[rarity] ?? 1;
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

/** Returns the Light cost multiplier for a set's artifacts. Only Neutrality (×1) is active. */
export function getArtifactSetCostMultiplier(_setId: string): number {
  return 1;
}

/** Returns the Light cost of buying one additional copy of an artifact. */
export function getArtifactCopyCost(artifact: { tier: ArtifactTier; setId: string }): number {
  return ARTIFACT_TIER_COPY_COST[artifact.tier] * getArtifactSetCostMultiplier(artifact.setId);
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
