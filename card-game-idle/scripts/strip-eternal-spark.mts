// Strips all `eternal_spark_*` effect objects from card data files.
// The generic spark family is being replaced by 11 bespoke per-set secondary
// keywords; the new effects will be applied per-card per-set in subsequent steps.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const targets = [
  'src/data/cards/eternalCards.ts',
  'src/data/cards/infiniteCards.ts',
];

// Matches: `, { type: 'eternal_spark_(gain|spend|cashout)', ... }` with balanced braces (no nested braces in our spark literals).
const PATTERN = /,\s*\{\s*type:\s*'eternal_spark_(?:gain|spend|cashout)'[^{}]*\}/g;
const PATTERN_LEAD = /\{\s*type:\s*'eternal_spark_(?:gain|spend|cashout)'[^{}]*\},\s*/g;
const PATTERN_GTE = /,\s*\{\s*type:\s*'eternal_spark_gte'[^{}]*\}/g;
const PATTERN_GTE_LEAD = /\{\s*type:\s*'eternal_spark_gte'[^{}]*\},\s*/g;

let totalRemoved = 0;
for (const rel of targets) {
  const abs = resolve(rel);
  const before = readFileSync(abs, 'utf8');
  let after = before;
  for (const p of [PATTERN, PATTERN_LEAD, PATTERN_GTE, PATTERN_GTE_LEAD]) {
    const matches = after.match(p);
    if (matches) totalRemoved += matches.length;
    after = after.replace(p, '');
  }
  if (after !== before) {
    writeFileSync(abs, after);
    console.log(`✓ ${rel}: stripped spark effects`);
  } else {
    console.log(`  ${rel}: no changes`);
  }
}
console.log(`Total removed: ${totalRemoved}`);
