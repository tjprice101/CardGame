/**
 * audit-card-uniqueness.mts
 *
 * Read-only audit that answers "Why would I pick THIS card over its peers?"
 * for every card in every set.
 *
 * Outputs: audit-output/card-uniqueness-<timestamp>.md  (gitignored)
 *
 * Usage (from card-game-idle/):
 *   npx tsx scripts/audit-card-uniqueness.mts
 *   npx tsx scripts/audit-card-uniqueness.mts --set neutrality
 *   npx tsx scripts/audit-card-uniqueness.mts --rarity Eternal
 */

import fs from 'node:fs';
import path from 'node:path';
import { CardRegistry } from '../src/cards/CardRegistry.ts';
import '../src/cards/RegistryBoot.ts';
import { getEngineKeyForCard } from '../src/ui/setEngineSummary.ts';
import { getLateGameAttackIdentity } from '../src/systems/cards/LateGameAttackIdentity.ts';
import type { CardDefinition, CardRarity } from '../src/types/cards.ts';

// ── CLI filters ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const filterSet = args.find((_, i) => args[i - 1] === '--set') ?? null;
const filterRarity = args.find((_, i) => args[i - 1] === '--rarity') ?? null;

const RARITY_ORDER: CardRarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Eternal', 'Infinite'];

// ── Identity-drift rules — set-specific effect types that must be present ────
const SET_IDENTITY_EFFECTS: Record<string, string[]> = {
  neutrality: ['patience_gain_all', 'patience_gain', 'patience_double_all', 'neutrality_attack_preserve',
    'neutrality_equilibrium_sigil_gain', 'neutrality_equilibrium_tactical_spend',
    'neutrality_patient_light_gain', 'neutrality_designate_vessel', 'neutrality_attack_preserve',
    'cherubim_patience_per_card', 'seraphim_bonus_amplifier'],
  pyro: ['pyro_heat_gain', 'pyro_heat_spend', 'pyro_heat_burst', 'pyro_window_cashout',
    'pyro_cinder_echo_ignite', 'pyro_transcendent_confluence', 'eternal_stack_gain',
    'set_secondary_gain', 'cherubim_pyro_heat_gain', 'pyro_heat_per_card'],
  light: ['radiance_gain', 'radiance_spend', 'light_resonance_gte', 'eternal_stack_gain'],
  thornbound: ['trail_gain', 'trail_spend', 'scar_count_gte', 'thorn_briar_spiral_bloom', 'set_secondary_gain'],
  mechanical: ['strain_gain', 'strain_vent', 'spend_strain', 'overclock', 'mech_reactor_flux_vent',
    'eternal_stack_gain', 'set_secondary_gain'],
  prismatic: ['prismatic_charge_gain', 'prismatic_charge_spend', 'resonance_charge_gain',
    'prismatic_refraction_depth_gte', 'prism_spectrum_echo_refract', 'set_secondary_gain'],
  blackGlass: ['black_glass_white_flame_gain', 'black_glass_black_flame_gain', 'black_glass_fracture_gain',
    'black_glass_eclipse_burst', 'monochromatic_shards_gain', 'eternal_stack_gain'],
  snowbound: ['arctic_charge_gain', 'arctic_charge_discharge', 'snow_static_pulse_discharge',
    'eternal_stack_gain', 'set_secondary_gain'],
  glassAbsolute: ['absol_cascade_proof_amplify', 'set_secondary_gain'],
  blazingGarden: ['bloom_gain', 'gain_echo', 'ignite_units_burn', 'garden_wild_pollen_seed',
    'set_secondary_gain', 'replay_last_burn_card', 'snapshot_burn_lineages'],
  butterfly: ['butterfly_spectrum_gain', 'butterfly_release', 'flutter_wing_pulse_amplify',
    'flutter_resonance_harmonize', 'flutter_resonance_apex', 'set_secondary_gain', 'eternal_stack_gain'],
  eternalSeas: ['seas_undertow_gain', 'seas_foam_gain', 'seas_undertow_release', 'seas_deepwake_surge',
    'set_secondary_gain'],
  abyssalForge: ['forge_reforge_charge_gain', 'forge_pearl_drop', 'forge_recast_last', 'forge_recast_random',
    'forge_recast_last_n', 'forge_temper', 'forge_nacre_recast', 'forge_imprint_spend_recast',
    'forge_pearl_cashout', 'eternal_stack_gain', 'set_secondary_gain'],
  deathFlamedHell: ['eternal_stack_gain', 'set_secondary_gain', 'dfh_veil_marks_transmute',
    'dfh_veil_marks_cashout', 'dfh_veil_marks_amplify', 'dfh_crown_cashout', 'dfh_angel_resonant_cashout',
    'dfh_veil_marks_attack_bonus', 'dfh_veil_marks_gte'],
  wishedUponAStar: ['starlight_gain', 'dream_lattice_gain', 'wuas_nova_wish_burst',
    'wuas_constellation_lock_release', 'wuas_infinite_starbirth', 'eternal_stack_gain'],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getEffectTypes(def: CardDefinition): string[] {
  const out: string[] = [];
  function walk(effects: unknown[]): void {
    if (!Array.isArray(effects)) return;
    for (const e of effects) {
      if (!e || typeof e !== 'object') continue;
      const eff = e as Record<string, unknown>;
      if (typeof eff.type === 'string') out.push(eff.type);
      if (Array.isArray(eff.then)) walk(eff.then);
      if (Array.isArray(eff.else)) walk(eff.else);
      if (Array.isArray(eff.effects)) walk(eff.effects);
    }
  }
  if ('effects' in def && Array.isArray((def as unknown as Record<string, unknown>).effects)) {
    walk((def as unknown as Record<string, unknown>).effects as unknown[]);
  }
  if ('onPlayEffects' in def) walk((def as unknown as Record<string, unknown>).onPlayEffects as unknown[]);
  if ('onSummonEffects' in def) walk((def as unknown as Record<string, unknown>).onSummonEffects as unknown[]);
  if (def.type === 'Angel' && def.activatedAbility?.effects) walk(def.activatedAbility.effects as unknown[]);
  if (def.type === 'Cherubim' && 'onPlayEffects' in def) {
    walk((def as unknown as Record<string, unknown>).onPlayEffects as unknown[] ?? []);
  }
  return [...new Set(out)];
}

function inferRole(def: CardDefinition): string {
  if (def.type === 'Angel') return 'finisher';
  const types = getEffectTypes(def);
  const has = (t: string) => types.includes(t);
  const hasSome = (ts: string[]) => ts.some(t => types.includes(t));
  const desc = (def.description ?? '').toLowerCase();

  if (def.type === 'Seraphim') {
    const bs = (def as unknown as { baseStats: { bonusType: string } }).baseStats;
    if (bs?.bonusType === 'ophanim_bonus' || desc.includes('ophanim')) return 'amplifier';
    if (bs?.bonusType === 'pyro_heat_per_card' || bs?.bonusType === 'resource_generation') return 'resource';
    if (desc.includes('chain')) return 'setup';
    if (bs?.bonusType === 'power_amplifier' || bs?.bonusType === 'score_per_second') return 'amplifier';
    return 'payoff';
  }

  if (def.type === 'Cherubim') {
    if (hasSome(['cherubim_resource_per_card', 'cherubim_pyro_heat_gain', 'cherubim_draw_per_card'])) return 'resource';
    if (hasSome(['cherubim_adjacent_seraphim_bonus', 'cherubim_seraphim_amp', 'cherubim_attack_buff'])) return 'amplifier';
    if (hasSome(['draw', 'search_deck_by_type', 'look_top_take', 'salvage_any', 'salvage_by_type'])) return 'setup';
    return 'support';
  }

  // Ophanim
  if (hasSome(['draw', 'search_deck_by_type', 'look_top_take', 'look_top_take_drop', 'look_top_take_type', 'salvage_any', 'salvage_by_type', 'shuffle_discard'])) return 'setup';
  if (hasSome(['radiance_gain', 'pyro_heat_gain', 'trail_gain', 'strain_gain', 'arctic_charge_gain', 'bloom_gain', 'butterfly_spectrum_gain', 'seas_undertow_gain', 'seas_foam_gain', 'starlight_gain', 'dream_lattice_gain', 'forge_reforge_charge_gain', 'eternal_stack_gain', 'set_secondary_gain', 'prismatic_charge_gain', 'resonance_charge_gain', 'monochromatic_shards_gain'])) return 'resource';
  if (hasSome(['multiply_next', 'oblivion_flat', 'butterfly_release', 'seas_undertow_release', 'wuas_nova_wish_burst', 'wuas_constellation_lock_release', 'forge_pearl_cashout', 'dfh_veil_marks_cashout', 'dfh_crown_cashout', 'snow_static_pulse_discharge', 'absol_cascade_proof_amplify', 'garden_wild_pollen_seed'])) return 'payoff';
  return 'setup';
}

interface CardStats {
  def: CardDefinition;
  set: string;
  role: string;
  effectTypes: string[];
  fingerprint: string; // sorted unique effect types as CSV
  // Seraphim/Angel attack stats
  primaryBase: number;
  primaryCooldown: number;
  primaryScaling: number;
  exaltedBase: number;
  exaltedCooldown: number;
  exaltedScaling: number;
  attackCostDiscards: number; // how many discard costs
  // Per-card passive
  bonusType: string;
  bonusValue: number;
  // Power heuristic: higher = more output per turn
  powerScore: number;
  // Summon cost / gate
  summonCostLen: number;
  extraConditionTypes: string[];
  // Late-game identity (Eternal/Infinite Seraphim only)
  lateGameBbm: number;
  lateGameChain: number;
  lateGameDraw: number;
}

function buildStats(def: CardDefinition): CardStats {
  const set = getEngineKeyForCard(def) ?? 'unknown';
  const role = inferRole(def);
  const effectTypes = getEffectTypes(def);
  const fingerprint = [...new Set(effectTypes)].sort().join(',');

  const raw = def as unknown as Record<string, unknown>;
  const baseStats = (raw.baseStats ?? {}) as Record<string, unknown>;
  const bonusType = String(baseStats.bonusType ?? '');
  const bonusValue = Number(baseStats.bonusValue ?? 0);

  let primaryBase = 0, primaryCooldown = 0, primaryScaling = 1;
  let exaltedBase = 0, exaltedCooldown = 0, exaltedScaling = 1;
  let attackCostDiscards = 0;

  if (def.type === 'Seraphim' && def.attacks) {
    const u = def.attacks.unsynergized;
    const s = def.attacks.synergized;
    primaryBase = u.baseOblivion ?? 0;
    primaryCooldown = u.cooldownCards ?? 4;
    primaryScaling = (raw as Record<string, unknown>).unsynergizedScaling as number ?? 1;
    exaltedBase = s.baseOblivion ?? 0;
    exaltedCooldown = s.cooldownCards ?? 6;
    exaltedScaling = (raw as Record<string, unknown>).synergizedScaling as number ?? 1;
    attackCostDiscards = (u.costs?.filter((c: unknown) => (c as Record<string, unknown>).type === 'discard_from_hand').length ?? 0)
      + (s.costs?.filter((c: unknown) => (c as Record<string, unknown>).type === 'discard_from_hand').length ?? 0);
  }
  if (def.type === 'Angel' && def.attacks) {
    const p = def.attacks.primary;
    const e = def.attacks.exalted;
    primaryBase = p.baseOblivion ?? 0;
    primaryCooldown = p.cooldownCards ?? 6;
    primaryScaling = (raw as Record<string, unknown>).primaryScaling as number ?? 1;
    exaltedBase = e.baseOblivion ?? 0;
    exaltedCooldown = e.cooldownCards ?? 8;
    exaltedScaling = (raw as Record<string, unknown>).exaltedScaling as number ?? 1;
    attackCostDiscards = (p.costs?.filter((c: unknown) => (c as Record<string, unknown>).type === 'discard_from_hand').length ?? 0)
      + (e.costs?.filter((c: unknown) => (c as Record<string, unknown>).type === 'discard_from_hand').length ?? 0);
  }

  // Summon cost & gates (Angel)
  let summonCostLen = 0;
  let extraConditionTypes: string[] = [];
  if (def.type === 'Angel') {
    summonCostLen = (def.summonCost ?? []).length;
    extraConditionTypes = (def.extraSummonConditions ?? []).map((c: Record<string, unknown>) => String(c.type ?? ''));
  }

  // Power heuristic
  const attackOutput = primaryCooldown > 0 ? primaryBase / primaryCooldown : 0;
  const passiveOutput = bonusValue * (bonusType.includes('per_card') ? 4 : bonusType.includes('ophanim') ? 2 : 1);
  const powerScore = Math.round(attackOutput + passiveOutput);

  // Late-game identity (Eternal/Infinite Seraphim/Angel)
  let lateGameBbm = 0, lateGameChain = 0, lateGameDraw = 0;
  if (def.rarity === 'Eternal' || def.rarity === 'Infinite') {
    const lgLabel = def.type === 'Seraphim' ? 'unsynergized' : 'primary';
    const lg = getLateGameAttackIdentity(def.definitionId, def.rarity, lgLabel);
    if (lg) { lateGameBbm = lg.bonusBaseMultiplier; lateGameChain = lg.chainGainBonus; lateGameDraw = lg.drawCards; }
  }

  return {
    def, set, role, effectTypes, fingerprint,
    primaryBase, primaryCooldown, primaryScaling,
    exaltedBase, exaltedCooldown, exaltedScaling, attackCostDiscards,
    bonusType, bonusValue, powerScore,
    summonCostLen, extraConditionTypes,
    lateGameBbm, lateGameChain, lateGameDraw,
  };
}

// ── Domination check ─────────────────────────────────────────────────────────

function isDominated(a: CardStats, b: CardStats): boolean {
  // b dominates a if:
  //  1. Same set, same type, same rarity
  //  2. b has a STRICT superset of a's effect types (adds something a doesn't have)
  //  3. b's power score is >= a's (or a's power is 0 and b's is > 0)
  //  4. a has NO unique effects that b lacks (a provides nothing b doesn't)
  // We avoid flagging 0-vs-0 power comparisons unless the effect superset is clear.
  if (a.def.type !== b.def.type) return false;
  if (a.def.rarity !== b.def.rarity) return false;
  if (a.set !== b.set) return false;
  if (a.def.definitionId === b.def.definitionId) return false;

  const aTypes = new Set(a.effectTypes);
  const bTypes = new Set(b.effectTypes);

  // a must have NO unique effects
  const aUnique = [...aTypes].filter(t => !bTypes.has(t));
  if (aUnique.length > 0) return false; // a has something b doesn't → not dominated

  // b must be a STRICT superset (at least one effect a lacks)
  const bUnique = [...bTypes].filter(t => !aTypes.has(t));
  if (bUnique.length === 0) return false; // same fingerprint → near-duplicate, not dominated

  // Power: b must be >= a, and not both zero
  if (a.powerScore === 0 && b.powerScore === 0) return false; // can't call dominated with no power data
  if (b.powerScore < a.powerScore) return false;

  return true;
}

// ── Identity drift check ─────────────────────────────────────────────────────

function checkIdentityDrift(stats: CardStats): { pass: boolean; reason: string } {
  const { set, effectTypes } = stats;
  const required = SET_IDENTITY_EFFECTS[set] ?? [];
  if (required.length === 0) return { pass: true, reason: 'No identity requirement defined for this set.' };

  // A card passes if it touches at least 1 set-identity effect type
  // (Cherubim with pure +attack_buff are fine — they still support the set)
  const hasIdentityTouch = effectTypes.some(t => required.includes(t));

  // Exception: purely generic support effects don't drift (cherubim_attack_buff, cherubim_global_oblivion_mult, oblivion_flat, draw)
  const pureGenericTypes = new Set(['cherubim_attack_buff', 'cherubim_global_oblivion_mult',
    'oblivion_flat', 'draw', 'multiply_next', 'look_top_take', 'salvage_any', 'shuffle_discard',
    'patience_gain_all', 'patience_double_all', 'salvage_by_type', 'look_top_take_drop']);
  const isAllGeneric = effectTypes.length > 0 && effectTypes.every(t => pureGenericTypes.has(t));

  if (hasIdentityTouch) return { pass: true, reason: `Touches set identity effect (${effectTypes.find(t => required.includes(t))})` };
  if (isAllGeneric) return { pass: true, reason: 'Pure generic support — acceptable in any set.' };
  if (effectTypes.length === 0) return { pass: true, reason: 'No effects — minimal identity requirement.' };

  const missingExamples = required.slice(0, 3).join(', ');
  return {
    pass: false,
    reason: `No set-identity effect found. Set requires one of: ${missingExamples}…`,
  };
}

// ── Report rendering ─────────────────────────────────────────────────────────

const RARITY_EMOJI: Record<CardRarity, string> = {
  Common: 'C', Rare: 'R', Epic: 'E', Legendary: 'L', Eternal: 'Et', Infinite: 'Inf',
};

function fmt(n: number): string { return Number.isInteger(n) ? String(n) : n.toFixed(2); }

// ── Main ─────────────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const outDir = path.join(ROOT, 'audit-output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const gi = path.join(outDir, '.gitignore');
if (!fs.existsSync(gi)) fs.writeFileSync(gi, '*\n!.gitignore\n', 'utf8');

const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outFile = path.join(outDir, `card-uniqueness-${ts}.md`);

console.log('Loading CardRegistry…');
const allCards = CardRegistry.getAll();
console.log(`  ${allCards.length} cards loaded.`);

// Filter
let cards = allCards;
if (filterSet) cards = cards.filter(c => (getEngineKeyForCard(c) ?? '') === filterSet);
if (filterRarity) cards = cards.filter(c => c.rarity === filterRarity);

console.log(`  ${cards.length} cards after filters.`);

// Build stats
const allStats = cards.map(buildStats);

// Group by (set, type, rarity)
type BucketKey = string; // `${set}|${type}|${rarity}`
const buckets = new Map<BucketKey, CardStats[]>();
for (const s of allStats) {
  const key: BucketKey = `${s.set}|${s.def.type}|${s.def.rarity}`;
  if (!buckets.has(key)) buckets.set(key, []);
  buckets.get(key)!.push(s);
}

// Per-set grouping for output
const bySet = new Map<string, CardStats[]>();
for (const s of allStats) {
  if (!bySet.has(s.set)) bySet.set(s.set, []);
  bySet.get(s.set)!.push(s);
}

const SET_ORDER = [
  'neutrality', 'light', 'thornbound', 'mechanical', 'prismatic', 'blackGlass',
  'snowbound', 'glassAbsolute', 'pyro', 'blazingGarden', 'butterfly',
  'eternalSeas', 'abyssalForge', 'deathFlamedHell', 'wishedUponAStar', 'unknown',
];

const SET_LABELS: Record<string, string> = {
  neutrality: 'Neutrality',
  light: 'Heavenly Light',
  thornbound: 'Thornbound Plains',
  mechanical: 'Mechanical Dreams',
  prismatic: 'Prismatic Accord',
  blackGlass: 'Black Glass Inferno',
  snowbound: 'Snowbound Voltage',
  glassAbsolute: 'Glass Absolute',
  pyro: 'Pyroabyss',
  blazingGarden: 'Blazing Garden',
  butterfly: 'Age of the Butterfly',
  eternalSeas: 'Eternal Seas',
  abyssalForge: 'Abyssal Forge',
  deathFlamedHell: 'Death-flamed Hell',
  wishedUponAStar: 'Wished Upon A Star',
};

// ── Aggregate counters ────────────────────────────────────────────────────────

const findings = {
  dominated: [] as { a: CardStats; b: CardStats }[],
  nearDuplicate: [] as CardStats[][],
  roleSaturation: [] as { key: BucketKey; role: string; count: number }[],
  outliers: [] as { stats: CardStats; peerMedian: number }[],
  identityDrift: [] as { stats: CardStats; reason: string }[],
};

// Dominated + near-duplicate detection
for (const [, bucket] of buckets) {
  if (bucket.length < 2) continue;

  // Dominated pairs
  for (let i = 0; i < bucket.length; i++) {
    for (let j = 0; j < bucket.length; j++) {
      if (i === j) continue;
      if (isDominated(bucket[i], bucket[j])) {
        findings.dominated.push({ a: bucket[i], b: bucket[j] });
      }
    }
  }

  // Near-duplicate clusters (same fingerprint)
  const byFp = new Map<string, CardStats[]>();
  for (const s of bucket) {
    if (!byFp.has(s.fingerprint)) byFp.set(s.fingerprint, []);
    byFp.get(s.fingerprint)!.push(s);
  }
  for (const [fp, cluster] of byFp) {
    if (cluster.length >= 2 && fp !== '') findings.nearDuplicate.push(cluster);
  }

  // Role saturation: a bucket where all cards share the same role
  const roles = bucket.map(s => s.role);
  const distinctRoles = new Set(roles);
  if (distinctRoles.size === 1 && bucket.length >= 3) {
    findings.roleSaturation.push({ key: `${bucket[0].set}|${bucket[0].def.type}|${bucket[0].def.rarity}`, role: roles[0], count: bucket.length });
  }

  // Outliers: power score > 25% above peer median
  const scores = bucket.map(s => s.powerScore).sort((a, b) => a - b);
  const median = scores[Math.floor(scores.length / 2)];
  for (const s of bucket) {
    if (median > 0 && s.powerScore > median * 1.25) {
      findings.outliers.push({ stats: s, peerMedian: median });
    }
  }
}

// Identity drift
for (const s of allStats) {
  const { pass, reason } = checkIdentityDrift(s);
  if (!pass) findings.identityDrift.push({ stats: s, reason });
}

// ── Role coverage matrix ──────────────────────────────────────────────────────

const roleCoverage = new Map<string, Map<string, number>>();
const ROLES = ['setup', 'support', 'resource', 'payoff', 'amplifier', 'finisher'];
for (const setKey of SET_ORDER) {
  const setStats = bySet.get(setKey) ?? [];
  const roleCounts = new Map<string, number>();
  for (const role of ROLES) roleCounts.set(role, 0);
  for (const s of setStats) roleCounts.set(s.role, (roleCounts.get(s.role) ?? 0) + 1);
  roleCoverage.set(setKey, roleCounts);
}

// ── Render report ─────────────────────────────────────────────────────────────

const lines: string[] = [];
lines.push(`# Card Uniqueness & Deck-Building Viability Audit — ${ts}`);
lines.push('');
lines.push('> Read-only. No code was modified. Run from `card-game-idle/` with `npx tsx scripts/audit-card-uniqueness.mts`.');
lines.push('');
lines.push('## Summary');
lines.push(`| Metric | Count |`);
lines.push(`|--------|-------|`);
lines.push(`| Cards scanned | ${allStats.length} |`);
lines.push(`| **Dominated** (strictly worse than a peer) | **${findings.dominated.length}** |`);
lines.push(`| **Near-duplicate** clusters (same fingerprint) | **${findings.nearDuplicate.length}** |`);
lines.push(`| **Role-saturation** buckets | **${findings.roleSaturation.length}** |`);
lines.push(`| **Outlier** (power >25% above peer median) | **${findings.outliers.length}** |`);
lines.push(`| **Identity-drift** (no set-identity effect) | **${findings.identityDrift.length}** |`);
lines.push('');

// ── Role Coverage Matrix ──────────────────────────────────────────────────────
lines.push('## Role Coverage Matrix (all sets × all roles)');
lines.push('');
lines.push(`| Set | Setup | Support | Fuel | Payoff | Amplifier | Finisher | Total |`);
lines.push(`|-----|-------|---------|------|--------|-----------|----------|-------|`);
for (const setKey of SET_ORDER) {
  const setStats = bySet.get(setKey);
  if (!setStats?.length) continue;
  const rc = roleCoverage.get(setKey)!;
  const total = setStats.length;
  const cells = ROLES.map(r => {
    const n = rc.get(r) ?? 0;
    return n === 0 ? '**0**' : String(n);
  });
  lines.push(`| ${SET_LABELS[setKey] ?? setKey} | ${cells.join(' | ')} | ${total} |`);
}
lines.push('');

// ── Per-Set Sections ──────────────────────────────────────────────────────────
const setsToRender = [...SET_ORDER.filter(s => bySet.has(s))];
for (const setKey of setsToRender) {
  const setStats = bySet.get(setKey)!;
  const setLabel = SET_LABELS[setKey] ?? setKey;

  const setDominated = findings.dominated.filter(f => f.a.set === setKey);
  const setDuplicates = findings.nearDuplicate.filter(cluster => cluster[0].set === setKey);
  const setOutliers = findings.outliers.filter(f => f.stats.set === setKey);
  const setDrift = findings.identityDrift.filter(f => f.stats.set === setKey);
  const setSaturation = findings.roleSaturation.filter(f => f.key.startsWith(setKey + '|'));

  const flagCount = setDominated.length + setDuplicates.length + setOutliers.length + setDrift.length + setSaturation.length;
  const badge = flagCount === 0 ? '✅' : flagCount <= 2 ? '🟡' : '🔴';

  lines.push(`---`);
  lines.push('');
  lines.push(`## ${badge} ${setLabel} (${setStats.length} cards · ${flagCount} flag${flagCount === 1 ? '' : 's'})`);
  lines.push('');

  // Card table
  lines.push('### Card Inventory');
  lines.push('');
  lines.push('| Name | Type | Rarity | Role | Primary Dmg | Cd | Bonus | Power↑ | Drift |');
  lines.push('|------|------|--------|------|-------------|----|-------|--------|-------|');
  const sorted = [...setStats].sort((a, b) => {
    const ta = ['Seraphim', 'Cherubim', 'Ophanim', 'Angel'].indexOf(a.def.type);
    const tb = ['Seraphim', 'Cherubim', 'Ophanim', 'Angel'].indexOf(b.def.type);
    if (ta !== tb) return ta - tb;
    return RARITY_ORDER.indexOf(a.def.rarity) - RARITY_ORDER.indexOf(b.def.rarity);
  });
  for (const s of sorted) {
    const drift = checkIdentityDrift(s);
    const driftCell = drift.pass ? '✓' : '⚠ DRIFT';
    const dmg = s.primaryBase > 0 ? fmt(s.primaryBase) : '—';
    const cd = s.primaryCooldown > 0 ? fmt(s.primaryCooldown) : '—';
    const bonus = s.bonusValue > 0 ? `${fmt(s.bonusValue)} ${s.bonusType.replace('oblivion_per_card', 'ob/c').replace('ophanim_bonus', 'op+').replace('cherubim_extra_plays', 'cher+').replace('power_amplifier', 'x×').replace('resource_generation', 'res+')}` : '—';
    lines.push(`| ${s.def.name} | ${s.def.type} | ${RARITY_EMOJI[s.def.rarity] ?? s.def.rarity} | ${s.role} | ${dmg} | ${cd} | ${bonus} | ${fmt(s.powerScore)} | ${driftCell} |`);
  }
  lines.push('');

  // Deck-slot competition per (type, rarity) bucket
  lines.push('### Deck-Slot Competition');
  lines.push('');

  const bucketKeys = [...new Set(setStats.map(s => `${s.def.type}|${s.def.rarity}`))];
  for (const bk of bucketKeys) {
    const [type, rarity] = bk.split('|');
    const peers = setStats.filter(s => s.def.type === type && s.def.rarity === rarity);
    if (peers.length < 2) continue;

    lines.push(`**${type} · ${rarity} (${peers.length} cards)**`);
    lines.push('');

    // Pair comparison
    for (let i = 0; i < peers.length; i++) {
      for (let j = i + 1; j < peers.length; j++) {
        const pa = peers[i], pb = peers[j];
        const aOverB = pa.powerScore >= pb.powerScore ? pa : pb;
        const bOverA = pa.powerScore >= pb.powerScore ? pb : pa;

        // Determine niche differentiation
        const aOnlyEffects = aOverB.effectTypes.filter(t => !bOverA.effectTypes.includes(t));
        const bOnlyEffects = bOverA.effectTypes.filter(t => !aOverB.effectTypes.includes(t));

        let verdict = '';
        if (isDominated(bOverA, aOverB)) {
          verdict = `⚠ **DOMINATED** — *${bOverA.def.name}* appears strictly weaker (lower power score, no unique effects).`;
        } else if (aOnlyEffects.length === 0 && bOnlyEffects.length === 0) {
          verdict = `⚠ **NEAR-DUPLICATE** — same effect fingerprint, stats differ. Choose the higher-power one unless cost matters.`;
        } else {
          const aNiche = aOnlyEffects.length > 0 ? `${aOverB.def.name} uniquely: ${aOnlyEffects.slice(0, 3).join(', ')}` : `${aOverB.def.name}: better raw stats`;
          const bNiche = bOnlyEffects.length > 0 ? `${bOverA.def.name} uniquely: ${bOnlyEffects.slice(0, 3).join(', ')}` : `${bOverA.def.name}: lower cost/cd`;
          verdict = `✓ **Both viable** — ${aNiche} · ${bNiche}`;
        }
        lines.push(`- **${pa.def.name}** vs **${pb.def.name}**: ${verdict}`);
      }
    }
    lines.push('');
  }

  // Flags
  if (setDrift.length > 0) {
    lines.push('### ⚠ Identity Drift');
    lines.push('');
    for (const { stats, reason } of setDrift) {
      lines.push(`- **${stats.def.name}** (${stats.def.type} ${stats.def.rarity}): ${reason}`);
    }
    lines.push('');
  }

  if (setOutliers.length > 0) {
    lines.push('### ⚠ Power Outliers (>25% above peer median)');
    lines.push('');
    for (const { stats, peerMedian } of setOutliers) {
      lines.push(`- **${stats.def.name}** (${stats.def.type} ${stats.def.rarity}): power score ${fmt(stats.powerScore)} vs peer median ${fmt(peerMedian)} (+${Math.round((stats.powerScore / peerMedian - 1) * 100)}%)`);
    }
    lines.push('');
  }

  if (setSaturation.length > 0) {
    lines.push('### ⚠ Role Saturation (same role across all cards in bucket)');
    lines.push('');
    for (const { key, role, count } of setSaturation) {
      const [, type, rarity] = key.split('|');
      lines.push(`- ${type} ${rarity}: all ${count} cards are \`${role}\` — no alternative role in this slot.`);
    }
    lines.push('');
  }

  // Eternal/Infinite gate analysis
  const highTier = setStats.filter(s => s.def.rarity === 'Eternal' || s.def.rarity === 'Infinite');
  if (highTier.length > 0) {
    lines.push('### Eternal / Infinite Gate Analysis');
    lines.push('');
    lines.push('| Card | Rarity | Summon Cost | Extra Conditions | LG Mult | Chain | Draw |');
    lines.push('|------|--------|-------------|-----------------|---------|-------|------|');
    for (const s of highTier) {
      const gates = s.extraConditionTypes.length > 0 ? s.extraConditionTypes.map(t => t.replace('_gte', '')).join(', ') : 'none';
      const costStr = s.summonCostLen > 0 ? `${s.summonCostLen} material${s.summonCostLen > 1 ? 's' : ''}` : 'free';
      const lgMult = s.lateGameBbm > 0 ? fmt(s.lateGameBbm) : '—';
      const lgChain = s.lateGameChain > 0 ? fmt(s.lateGameChain) : '—';
      const lgDraw = s.lateGameDraw > 0 ? String(s.lateGameDraw) : '—';
      lines.push(`| ${s.def.name} | ${s.def.rarity} | ${costStr} | ${gates} | ${lgMult} | ${lgChain} | ${lgDraw} |`);
    }
    lines.push('');
  }
}

// ── Consolidated Findings ────────────────────────────────────────────────────
lines.push('---');
lines.push('');
lines.push('## Consolidated Findings');
lines.push('');

// Critical: Dominated
lines.push('### 🔴 Critical — DOMINATED cards');
lines.push('');
if (findings.dominated.length === 0) {
  lines.push('None found.');
} else {
  for (const { a, b } of findings.dominated) {
    lines.push(`- **${a.def.name}** (${a.set} ${a.def.type} ${a.def.rarity}): dominated by **${b.def.name}** — power ${fmt(a.powerScore)} vs ${fmt(b.powerScore)}`);
  }
}
lines.push('');

// High: Near-duplicates
lines.push('### 🟠 High — NEAR-DUPLICATE clusters (same effect fingerprint)');
lines.push('');
if (findings.nearDuplicate.length === 0) {
  lines.push('None found.');
} else {
  for (const cluster of findings.nearDuplicate) {
    const names = cluster.map(s => `${s.def.name} (ps:${fmt(s.powerScore)})`).join(' · ');
    lines.push(`- [${cluster[0].set} ${cluster[0].def.type} ${cluster[0].def.rarity}] ${names}`);
  }
}
lines.push('');

// Medium: Identity drift
lines.push('### 🟡 Medium — IDENTITY DRIFT (card doesn\'t engage set engine)');
lines.push('');
if (findings.identityDrift.length === 0) {
  lines.push('None found.');
} else {
  for (const { stats, reason } of findings.identityDrift) {
    lines.push(`- **${stats.def.name}** (${stats.set} ${stats.def.type} ${stats.def.rarity}): ${reason}`);
  }
}
lines.push('');

// Low: Role saturation
lines.push('### 🟢 Low — ROLE SATURATION (all cards in bucket share one role)');
lines.push('');
if (findings.roleSaturation.length === 0) {
  lines.push('None found.');
} else {
  for (const { key, role, count } of findings.roleSaturation) {
    const [set, type, rarity] = key.split('|');
    lines.push(`- ${SET_LABELS[set] ?? set} ${type} ${rarity}: all ${count} cards are \`${role}\``);
  }
}
lines.push('');

// Write output
fs.writeFileSync(outFile, lines.join('\n'), 'utf8');

// Also write per-set files
const perSetDir = path.join(outDir, 'per-set');
if (!fs.existsSync(perSetDir)) fs.mkdirSync(perSetDir, { recursive: true });

console.log(`\nFull report: audit-output/card-uniqueness-${ts}.md`);
console.log(`\nFindings summary:`);
console.log(`  🔴 Dominated:       ${findings.dominated.length}`);
console.log(`  🟠 Near-duplicate:  ${findings.nearDuplicate.length}`);
console.log(`  🟡 Identity drift:  ${findings.identityDrift.length}`);
console.log(`  ⚠  Power outliers:  ${findings.outliers.length}`);
console.log(`  📊 Role saturation: ${findings.roleSaturation.length}`);
console.log(`  📦 Total cards:     ${allStats.length}`);
