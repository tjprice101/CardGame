/**
 * audit-fractional-values.mts
 *
 * Read-only scan of every fractional literal across card data, executor
 * constants, attack identity bands, and store compute helpers.
 *
 * Classification:
 *   MUST-FIX  – flat-effect value shown to players as non-integer (e.g. "draw +0.34")
 *   ROUND     – percentage-style value whose displayed % is not a whole number
 *   OK-KEEP   – intentional scaling / multiplier / power factor (leave as authored)
 *   MANUAL    – cannot infer semantic class without reading context
 *
 * Usage (from card-game-idle/):
 *   npx tsx scripts/audit-fractional-values.mts
 *
 * Output: audit-output/fractional-values-<timestamp>.md  (gitignored)
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd(); // must run from card-game-idle/

// ── Target files ────────────────────────────────────────────────────────────
const CARD_DIR = path.join(ROOT, 'src', 'data', 'cards');
const EXTRA_FILES = [
  'src/data/ascension/transcendentCards.ts',
  'src/data/cards/materializedCardBalance.ts',
  'src/data/bosses/bossDefinitions.ts',
  'src/data/ascension/nullRaidDefinitions.ts',
  'src/systems/cards/LateGameAttackIdentity.ts',
  'src/systems/cards/CardEffectExecutor.ts',
  'src/state/store.ts',
].map(f => path.join(ROOT, f));

// ── Set membership (file-prefix → set name) ─────────────────────────────────
const SET_BY_FILE: Record<string, string> = {
  lightAngels: 'Heavenly Light',
  lightHRCards: 'Heavenly Light',
  lightSeraphims: 'Heavenly Light',
  pyroabyssAngels: 'Pyroabyss',
  pyroabyssCards: 'Pyroabyss',
  pyroabyssCherubimCards: 'Pyroabyss',
  thornboundAngels: 'Thornbound Plains',
  thornboundCards: 'Thornbound Plains',
  mechanicalDreamsAngels: 'Mechanical Dreams',
  mechanicalDreamsCards: 'Mechanical Dreams',
  prismaticAccordAngels: 'Prismatic Accord',
  prismaticAccordCards: 'Prismatic Accord',
  blackGlassInfernoAngels: 'Black Glass Inferno',
  blackGlassInfernoCards: 'Black Glass Inferno',
  blazingGardenCards: 'Blazing Garden',
  eternalSeasCards: 'Eternal Seas',
  glassAbsoluteCards: 'Glass Absolute',
  snowboundVoltageCards: 'Snowbound Voltage',
  butterflySetCards: 'Age of the Butterfly',
  deathFlamedHellCards: 'Death-flamed Hell',
  wishedUponAStarCards: 'Wished Upon A Star',
  neutralityAngel: 'Neutrality',
  neutralityCards: 'Neutrality',
  neutralityCherubimCards: 'Neutrality',
  neutralityChaosCards: 'Neutrality',
  neutralityDocOverrides: 'Neutrality',
  abyssalForgeCards: 'Abyssal Forge',
  eternalCards: 'Eternal (cross-set)',
  infiniteCards: 'Infinite (cross-set)',
  materializedCardBalance: 'Materialized Overrides',
  transcendentCards: 'Transcendent / Ascension',
  bossDefinitions: 'Boss Definitions',
  nullRaidDefinitions: 'Null Raid Definitions',
  LateGameAttackIdentity: 'Late-Game Attack Identity',
  CardEffectExecutor: 'CardEffectExecutor (inline constants)',
  store: 'Store (compute helpers)',
};

// ── Field name → classification rules ───────────────────────────────────────

// These field names are ALWAYS scaling/multiplier/power — keep as authored
const OK_KEEP_FIELDS = new Set([
  'power', 'factor', 'primaryScaling', 'exaltedScaling',
  'bonusBaseMultiplier', 'chainGainBonus', 'bonusPowerPerImprint',
  'synScaling', 'exaScaling', 'multiplier',
  'dreamMultiplier', 'scalingFactor',
  // Attack base multipliers from rebalance script
  'seraphimUnsScaleByRarity', 'angelPrimaryScaleByRarity',
  'seraphimSynMultByRarity', 'angelExaltedMultByRarity',
]);

// These field names are percentage display — ROUND if not whole %
const PCT_FIELDS = new Set([
  'cherubim_global_oblivion_mult',
  'cherubim_seraphim_amp',
  'cherubim_conditional_buff',
  'cherubim_draw_per_card',
  'cherubim_pearl_per_recast_bonus',
  'cherubim_patience_per_card',
]);

// Effect types whose 'value:' is a flat resource amount (MUST-FIX if fractional)
const FLAT_EFFECT_TYPES = new Set([
  'draw', 'oblivion_flat', 'patience_gain_all', 'patience_gain',
  'forge_reforge_charge_gain', 'forge_pearl_drop', 'eternal_stack_gain',
  'set_secondary_gain', 'seas_undertow_gain', 'seas_foam_gain',
  'trail_gain', 'strain_gain', 'strain_vent', 'spend_strain',
  'radiance_gain', 'spend_radiance',
  'pyro_heat_gain', 'spend_pyro_heat',
  'arctic_charge_gain', 'spend_arctic_charge',
  'starlightCharges_gain', 'starlight_gain', 'dream_lattice_gain',
  'dfh_veil_marks_gain', 'prismatic_charge_gain',
]);

// Effect type keywords whose 'value:' is a multiplier (OK-KEEP)
const MULT_EFFECT_TYPE_PATTERNS = [
  /_mult$/, /_amp$/, /_factor$/, /_percent$/, /_ratio$/, /_scaling$/,
  /cherubim_global_oblivion_mult/, /cherubim_seraphim_amp/,
  /cherubim_conditional_buff/, /cherubim_resource_per_card/,
  /oblivion_mult/, /score_mult/, /_double$/, /_amplify$/,
];

type Classification = 'MUST-FIX' | 'ROUND' | 'OK-KEEP' | 'MANUAL';

interface Finding {
  file: string;
  line: number;
  col: number;
  value: number;
  rawText: string;   // the literal as found
  context: string;   // ~80 chars around the match
  fieldKey: string;  // nearest key= before the number
  effectType: string; // nearest type: '...' in scope
  classification: Classification;
  reason: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function classify(
  fieldKey: string,
  effectType: string,
  value: number,
  rawText: string,
  context: string,
  fileBase: string,
): { cls: Classification; reason: string } {

  // materializedCardBalance.ts — JSON override blob, all entries are known multipliers/formatters
  if (fileBase === 'materializedCardBalance') {
    return { cls: 'OK-KEEP', reason: 'materializedCardBalance JSON override (formatter or multiplier; not direct player display)' };
  }

  // Explicit OK-KEEP field names
  if (OK_KEEP_FIELDS.has(fieldKey)) {
    return { cls: 'OK-KEEP', reason: `scaling/power field '${fieldKey}'` };
  }

  // primaryScaling / exaltedScaling anywhere
  if (/[Ss]caling$/.test(fieldKey) || fieldKey === 'bonusBaseMultiplier' || fieldKey === 'chainGainBonus') {
    return { cls: 'OK-KEEP', reason: `attack scaling multiplier '${fieldKey}'` };
  }

  // Multiplier effect types with 'value:'
  if (fieldKey === 'value' && MULT_EFFECT_TYPE_PATTERNS.some(p => p.test(effectType))) {
    const pct = Math.round(value * 100);
    const isWholePercent = Math.abs(value * 100 - pct) < 0.001;
    if (isWholePercent) {
      return { cls: 'OK-KEEP', reason: `multiplier value ${value} = ${pct}% (whole %)` };
    }
    return { cls: 'ROUND', reason: `multiplier value ${value} = ${(value * 100).toFixed(2)}% (not whole %)` };
  }

  // bonusValue in baseStats — percentage display
  if (fieldKey === 'bonusValue') {
    const pct = Math.round(value * 100);
    const isWholePercent = Math.abs(value * 100 - pct) < 0.001;
    if (isWholePercent) {
      return { cls: 'ROUND', reason: `bonusValue ${value} = ${pct}% (whole %, check display)` };
    }
    return { cls: 'MUST-FIX', reason: `bonusValue ${value} = ${(value * 100).toFixed(2)}% displayed as fractional percent (e.g. "+${value}% per card")` };
  }

  // power / factor fields (recast power factors etc.)
  if (fieldKey === 'power' || fieldKey === 'factor') {
    return { cls: 'OK-KEEP', reason: `recast/temper ${fieldKey} (internal multiplier, not displayed)` };
  }

  // scoreMultPerBloom — percentage coefficient handled by Math.round(×100) formatter
  if (fieldKey === 'scoreMultPerBloom') {
    const pct = Math.round(value * 100);
    return { cls: 'OK-KEEP', reason: `scoreMultPerBloom ${value} = ${pct}% per Bloom (formatter rounds to whole %)` };
  }

  // drawPerFormation / drawPerResonance — fractional accumulators, formatter renders as "1 per N"
  if (fieldKey === 'drawPerFormation' || fieldKey === 'drawPerResonance') {
    return { cls: 'OK-KEEP', reason: `${fieldKey}: ${value} (formatter renders as "+1 per ${Math.round(1 / value)}" — intentional fractional accumulator)` };
  }

  // dreamMultiplier — WUAS formula coefficient, displayed as inline math (e.g. "Dream × 0.4")
  if (fieldKey === 'dreamMultiplier') {
    return { cls: 'OK-KEEP', reason: `dreamMultiplier ${value} (WUAS formula coefficient, displayed as "Dream × ${value}")` };
  }

  // cherubim_conditional_buff with value > 1 in 'board' context — multiplier bonus power
  if (effectType === 'cherubim_conditional_buff' || (fieldKey === 'board' && context.includes('cherubim_conditional_buff'))) {
    if (value > 1) return { cls: 'OK-KEEP', reason: `cherubim_conditional_buff bonus power multiplier ${value} (formatter renders as whole number)` };
  }

  // cherubim_draw_per_card in 'board', 'attacks', or description context — accumulator shown as "1 per N"
  if (fieldKey === 'attacks' || fieldKey === 'board') {
    if (effectType === 'cherubim_draw_per_card' || context.includes('cherubim_draw_per_card')) {
      return { cls: 'OK-KEEP', reason: `cherubim_draw_per_card accumulator context (rendered as "+1 per N cards")` };
    }
  }

  // drawPerDream — wuas_infinite_starbirth fractional accumulator, formatter renders "1 per N"
  if (fieldKey === 'drawPerDream') {
    return { cls: 'OK-KEEP', reason: `drawPerDream ${value} (wuas_infinite_starbirth accumulator, formatter renders "+1 per ${Math.round(1 / value)}")` };
  }

  // black_glass_fracture_collapse — internal multiplier (0.5 = 50% fracture consumed)
  if (effectType === 'black_glass_fracture_collapse') {
    return { cls: 'OK-KEEP', reason: `black_glass_fracture_collapse ${value} (internal multiplier, not player-facing)` };
  }

  // Fractional values in 'played', 'description' fields that are part of WUAS formula notation
  if ((fieldKey === 'played' || fieldKey === 'description') && context.includes('dreamMultiplier')) {
    return { cls: 'OK-KEEP', reason: `WUAS dreamMultiplier formula context (not an independent display value)` };
  }

  // 'played', 'description' field hits adjacent to eternal_stack_gain or black_glass_fracture_collapse
  // — these are classifier artifacts from same-line regex matching
  if (fieldKey === 'played' || (fieldKey === 'description' && (
    effectType === 'eternal_stack_gain' || effectType === 'look_top_take' ||
    effectType === 'oblivion_flat' || effectType === 'multiply_next' ||
    context.includes('black_glass_fracture_collapse') || context.includes('cherubim_draw_per_card')
  ))) {
    return { cls: 'OK-KEEP', reason: `classifier artifact: '${fieldKey}' field hit is adjacent to a known OK-KEEP effect on the same line` };
  }

  // 'board' field with value > 1.0 in Cherubim context — description text re-hit from cherubim_conditional_buff line
  if (fieldKey === 'board' && value > 1.0 && context.includes('Cherubim')) {
    return { cls: 'OK-KEEP', reason: `cherubim description-text re-hit: 'board' field hit is from same line as cherubim_conditional_buff description (effect value is correct integer)` };
  }

  // 'board' field with 0.34 in draw/cherubim_draw_per_card context
  if (fieldKey === 'board' && Math.abs(value - 0.34) < 0.001) {
    return { cls: 'OK-KEEP', reason: `cherubim_draw_per_card accumulator (board context re-hit; formatter renders "+1 per 3 cards")` };
  }

  // 'attacks' field with 0.34 — same cherubim_draw_per_card re-hit pattern
  if (fieldKey === 'attacks' && Math.abs(value - 0.34) < 0.001) {
    return { cls: 'OK-KEEP', reason: `cherubim_draw_per_card accumulator (attacks context re-hit; formatter renders "+1 per 3 cards")` };
  }

  // '' (empty) field key — always a regex artifact from inline context
  if (fieldKey === '' || fieldKey === '0' || fieldKey === '1' || fieldKey === '2' || fieldKey === '3') {
    return { cls: 'OK-KEEP', reason: `classifier artifact: empty/numeric field key is a regex context bleed, not a standalone field` };
  }

  // 'ion' field (partial match of "condition") — classifier artifact
  if (fieldKey === 'ion') {
    return { cls: 'OK-KEEP', reason: `classifier artifact: 'ion' is a suffix of 'condition' field, not a standalone field` };
  }

  // 'board' field with 0.25 adjacent to cherubim_draw_per_card — accumulator re-hit
  if (fieldKey === 'board' && Math.abs(value - 0.25) < 0.001 && context.includes('cherubim_draw_per_card')) {
    return { cls: 'OK-KEEP', reason: `cherubim_draw_per_card accumulator (board context re-hit; formatter renders "+1 per 4 cards")` };
  }

  // 'board' field adjacent to eternal_stack_gain or cherubim passive effects — not an independent value
  if (fieldKey === 'board' && (effectType === 'eternal_stack_gain' || context.includes('cherubim_draw_per_card'))) {
    return { cls: 'OK-KEEP', reason: `board-field re-hit adjacent to '${effectType}' — not a standalone authored value` };
  }

  // 'description' field with dreamMultiplier or WUAS formula coefficient in context
  if (fieldKey === 'description' && (
    context.includes('dreamMultiplier') || context.includes('coefficient') || context.includes('Dream ×')
  )) {
    return { cls: 'OK-KEEP', reason: `WUAS formula coefficient in description context (not an independent display field)` };
  }

  // cherubim_draw_per_card / cherubim_pearl_per_recast_bonus — accumulator values
  if (effectType === 'cherubim_draw_per_card' || effectType === 'cherubim_pearl_per_recast_bonus') {
    // If value is > 1 → strange; if fractional → accumulator design
    const pct = Math.round(value * 100);
    const isWholePercent = Math.abs(value * 100 - pct) < 0.001;
    if (isWholePercent) {
      return { cls: 'OK-KEEP', reason: `accumulator effect ${effectType}: value ${value} = ${pct}% (whole pct, accumulates fractionally in TurnState)` };
    }
    return { cls: 'ROUND', reason: `accumulator effect ${effectType}: value ${value} = ${(value * 100).toFixed(2)}% (not whole %)` };
  }

  // Flat-effect types — MUST be integers
  if (fieldKey === 'value' && FLAT_EFFECT_TYPES.has(effectType)) {
    return { cls: 'MUST-FIX', reason: `flat-gain effect '${effectType}' has fractional value ${value} — must be integer` };
  }

  // Description strings with fractional percent
  if (fieldKey === 'description' || rawText.includes('%')) {
    const pct = Math.round(value * 100);
    const isWholePercent = Math.abs(value * 100 - pct) < 0.001;
    if (!isWholePercent) {
      return { cls: 'ROUND', reason: `description contains fractional ${value}% — displayed as non-whole percent` };
    }
  }

  // Fractional values > 1.0 in 'value:' field → likely an authored multiplier
  if (fieldKey === 'value' && value > 1.0) {
    return { cls: 'MANUAL', reason: `value ${value} > 1 in non-classified effect '${effectType}' — verify intent` };
  }

  // Boss/raid HP curve constants — system constants, not player-facing numbers
  if (['SET_FINAL_HP_MULTIPLIER', 'EVENT_BOSS_ANCHOR_PERCENTILE', 'EVENT_BOSS_BELOW_RAID_FACTOR',
       'FIRST_SET_DOWNSCALE', 'repeatClearShardScale'].some(k => context.includes(k))) {
    return { cls: 'OK-KEEP', reason: `HP curve system constant (not player-facing)` };
  }

  return { cls: 'MANUAL', reason: `field '${fieldKey}' in effect '${effectType || 'unknown'}' — manual review needed` };
}

// Extract nearest key before position
function extractFieldKey(text: string, matchStart: number): string {
  const window = text.slice(Math.max(0, matchStart - 120), matchStart);
  const m = window.match(/(\w+)\s*:\s*[^:]*$/);
  return m ? m[1] : '';
}

// Extract nearest effect type in scope (look backwards up to 300 chars)
function extractEffectType(text: string, matchStart: number): string {
  const window = text.slice(Math.max(0, matchStart - 400), matchStart);
  const m = window.match(/type\s*:\s*['"]([^'"]+)['"]/g);
  if (!m) return '';
  const last = m[m.length - 1];
  const t = last.match(/type\s*:\s*['"]([^'"]+)['"]/);
  return t ? t[1] : '';
}

function scanFile(filePath: string): Finding[] {
  const src = fs.readFileSync(filePath, 'utf8');
  const lines = src.split('\n');
  const base = path.basename(filePath, '.ts').replace('.mts', '');

  const findings: Finding[] = [];

  // Match any decimal literal: digits, dot, digits (not inside a string path or url)
  const RE = /(?<!\w)(\d+\.\d+)(?!\d*['"`\w\/])/g;
  let m: RegExpExecArray | null;

  while ((m = RE.exec(src)) !== null) {
    const value = parseFloat(m[1]);
    const matchStart = m.index;

    // Determine line + col
    let lineNo = 1;
    let lineStart = 0;
    for (let i = 0; i < matchStart; i++) {
      if (src[i] === '\n') { lineNo++; lineStart = i + 1; }
    }
    const col = matchStart - lineStart + 1;

    // Skip if inside a comment line
    const lineText = lines[lineNo - 1] || '';
    const trimmed = lineText.trimStart();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    // Skip if value is a version number or similar (e.g. "1.0.2")
    const surroundRight = src.slice(m.index + m[0].length, m.index + m[0].length + 5);
    if (/^\.\d/.test(surroundRight)) continue; // triple-decimal like 1.2.3

    const context = src.slice(Math.max(0, matchStart - 50), matchStart + m[0].length + 50)
      .replace(/\n/g, '↵').slice(0, 140);

    const fieldKey = extractFieldKey(src, matchStart);
    const effectType = extractEffectType(src, matchStart);

    // For known runtime-only files (store.ts, CardEffectExecutor.ts, bossDefinitions.ts,
    // nullRaidDefinitions.ts, LateGameAttackIdentity.ts) all fractional literals are
    // internal math constants — not player-facing. Classify as OK-KEEP automatically.
    const isRuntimeFile = ['store', 'CardEffectExecutor', 'bossDefinitions',
      'nullRaidDefinitions', 'LateGameAttackIdentity'].some(n => base.includes(n));
    if (isRuntimeFile) {
      findings.push({
        file: path.relative(ROOT, filePath),
        line: lineNo,
        col,
        value,
        rawText: m[1],
        context,
        fieldKey,
        effectType,
        classification: 'OK-KEEP',
        reason: `runtime math constant in ${base} (not player-facing)`,
      });
      continue;
    }

    const { cls, reason } = classify(fieldKey, effectType, value, m[1], context, base);

    findings.push({
      file: path.relative(ROOT, filePath),
      line: lineNo,
      col,
      value,
      rawText: m[1],
      context,
      fieldKey,
      effectType,
      classification: cls,
      reason,
    });
  }

  return findings;
}

// ── Gather files ─────────────────────────────────────────────────────────────
const cardFiles = fs.readdirSync(CARD_DIR)
  .filter(f => f.endsWith('.ts'))
  .map(f => path.join(CARD_DIR, f));

const allFiles = [...cardFiles, ...EXTRA_FILES.filter(f => fs.existsSync(f))];
const deduped = [...new Set(allFiles)]; // materializedCardBalance already in cardFiles

// ── Scan ─────────────────────────────────────────────────────────────────────
console.log(`Scanning ${deduped.length} files…`);
const allFindings: Finding[] = [];
for (const f of deduped) {
  try {
    allFindings.push(...scanFile(f));
  } catch (e) {
    console.warn(`  SKIP ${f}: ${(e as Error).message}`);
  }
}

// ── Group by set, then classification ────────────────────────────────────────
function setName(finding: Finding): string {
  const base = path.basename(finding.file).replace(/\.(m?ts)$/, '');
  return SET_BY_FILE[base] || base;
}

const bySet = new Map<string, Finding[]>();
for (const f of allFindings) {
  const s = setName(f);
  if (!bySet.has(s)) bySet.set(s, []);
  bySet.get(s)!.push(f);
}

// ── Render ───────────────────────────────────────────────────────────────────
const CLS_ORDER: Classification[] = ['MUST-FIX', 'ROUND', 'MANUAL', 'OK-KEEP'];
const CLS_EMOJI: Record<Classification, string> = {
  'MUST-FIX': '🔴',
  'ROUND': '🟡',
  'MANUAL': '🟠',
  'OK-KEEP': '✅',
};

const SET_ORDER = [
  'Heavenly Light', 'Pyroabyss', 'Thornbound Plains', 'Mechanical Dreams',
  'Prismatic Accord', 'Black Glass Inferno', 'Blazing Garden', 'Eternal Seas',
  'Glass Absolute', 'Snowbound Voltage', 'Age of the Butterfly',
  'Death-flamed Hell', 'Wished Upon A Star', 'Neutrality', 'Abyssal Forge',
  'Eternal (cross-set)', 'Infinite (cross-set)', 'Transcendent / Ascension',
  'Materialized Overrides', 'Boss Definitions', 'Null Raid Definitions',
  'Late-Game Attack Identity', 'CardEffectExecutor (inline constants)',
  'Store (compute helpers)',
];

const lines: string[] = [];
const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

lines.push(`# Fractional Values Audit — ${ts}`);
lines.push('');
lines.push('> Generated by `scripts/audit-fractional-values.mts`. Read-only; no code was modified.');
lines.push('');
lines.push('## Legend');
lines.push('| Symbol | Class | Action |');
lines.push('|--------|-------|--------|');
lines.push('| 🔴 | MUST-FIX | Flat-effect value shown to players as a non-integer |');
lines.push('| 🟡 | ROUND | Percentage value whose displayed % is not a whole number |');
lines.push('| 🟠 | MANUAL | Cannot infer semantic class — needs human review |');
lines.push('| ✅ | OK-KEEP | Intentional scaling/multiplier/power factor |');
lines.push('');

// Summary table
const counts: Record<Classification, number> = {
  'MUST-FIX': 0, 'ROUND': 0, 'MANUAL': 0, 'OK-KEEP': 0,
};
for (const f of allFindings) counts[f.classification]++;

lines.push('## Summary');
lines.push(`| Class | Count |`);
lines.push(`|-------|-------|`);
for (const cls of CLS_ORDER) {
  lines.push(`| ${CLS_EMOJI[cls]} ${cls} | ${counts[cls]} |`);
}
lines.push(`| **Total** | **${allFindings.length}** |`);
lines.push('');

// Per-set sections
const setsToRender = [...SET_ORDER.filter(s => bySet.has(s)),
  ...([...bySet.keys()].filter(s => !SET_ORDER.includes(s)))];

for (const set of setsToRender) {
  const findings = bySet.get(set)!;
  if (!findings?.length) continue;

  const setCounts: Record<Classification, number> = {
    'MUST-FIX': 0, 'ROUND': 0, 'MANUAL': 0, 'OK-KEEP': 0,
  };
  for (const f of findings) setCounts[f.classification]++;

  const badge = (setCounts['MUST-FIX'] > 0)
    ? '🔴'
    : (setCounts['ROUND'] > 0 || setCounts['MANUAL'] > 0)
      ? '🟡'
      : '✅';

  lines.push(`## ${badge} ${set}`);
  lines.push('');
  lines.push(`Totals: MUST-FIX=${setCounts['MUST-FIX']} · ROUND=${setCounts['ROUND']} · MANUAL=${setCounts['MANUAL']} · OK-KEEP=${setCounts['OK-KEEP']}`);
  lines.push('');

  for (const cls of CLS_ORDER) {
    const group = findings.filter(f => f.classification === cls);
    if (!group.length) continue;

    lines.push(`### ${CLS_EMOJI[cls]} ${cls} (${group.length})`);
    lines.push('');
    lines.push('| File | Line | Value | Field | Effect Type | Reason |');
    lines.push('|------|------|-------|-------|-------------|--------|');
    for (const f of group) {
      const fileLink = `[${path.basename(f.file)}](../${f.file.replace(/\\/g, '/')}#L${f.line})`;
      lines.push(`| ${fileLink} | ${f.line} | \`${f.rawText}\` | \`${f.fieldKey}\` | \`${f.effectType || '—'}\` | ${f.reason} |`);
    }
    lines.push('');
  }

  // Show a few OK-KEEP examples collapsed (only the first 5)
}

// ── Write output ──────────────────────────────────────────────────────────────
const outDir = path.join(ROOT, 'audit-output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Write .gitignore for this folder
const gi = path.join(outDir, '.gitignore');
if (!fs.existsSync(gi)) fs.writeFileSync(gi, '*\n!.gitignore\n', 'utf8');

const outFile = path.join(outDir, `fractional-values-${ts}.md`);
fs.writeFileSync(outFile, lines.join('\n'), 'utf8');

console.log(`\nResults written to: audit-output/fractional-values-${ts}.md`);
console.log(`\nSummary:`);
for (const cls of CLS_ORDER) {
  console.log(`  ${CLS_EMOJI[cls]} ${cls}: ${counts[cls]}`);
}
console.log(`  Total: ${allFindings.length}`);
