// One-shot Phase 0 helper: rebase Light Transcendent duality_choice entries.
// Safe: validates edits before writing.
import { readFileSync, writeFileSync } from 'node:fs';

const path = new URL('../src/data/ascension/transcendentCards.ts', import.meta.url);
const src = readFileSync(path, 'utf8');

// Rebase 5 occurrences of the duality_choice block.
const dualityRe = /type: 'light_transcendent_duality_choice' as const,(\s*)baseOblivion: \d+,\s*resonanceScale: \d+,(\s*)haloScale: \d+,\s*distinctNoteScale: \d+,/g;
const matches = [...src.matchAll(dualityRe)];
if (matches.length !== 5) {
  console.error(`Expected 5 duality_choice matches, got ${matches.length}. Aborting.`);
  process.exit(1);
}
let out = src.replace(
  dualityRe,
  (_m, ws1, ws2) => `type: 'light_transcendent_duality_choice' as const,${ws1}baseOblivion: 630,${ws1.replace(/\r?\n/, '\n')}${ws1.match(/[ \t]+$/)?.[0] ?? '        '}radianceScale: 12,${ws2}haloScale: 95,`,
);

// Unwrap the light_resonance_gte conditional block into a flat oblivion_flat effect.
const condRe = /\{\s*type: 'conditional' as const,\s*condition: \{ type: 'light_resonance_gte' as const, value: \d+ \},\s*then: \[\s*\{ type: 'oblivion_flat' as const, value: (\d+) \},\s*\],\s*\},/g;
const condMatches = [...out.matchAll(condRe)];
out = out.replace(condRe, (_m, v) => `{ type: 'oblivion_flat' as const, value: ${v} },`);

console.log(`duality rebased: ${matches.length}; conditionals unwrapped: ${condMatches.length}`);
console.log(`resonanceScale remaining: ${(out.match(/resonanceScale/g) || []).length}`);
console.log(`distinctNoteScale remaining: ${(out.match(/distinctNoteScale/g) || []).length}`);
console.log(`light_resonance_gte remaining: ${(out.match(/light_resonance_gte/g) || []).length}`);
console.log(`radianceScale added: ${(out.match(/radianceScale: 12/g) || []).length}`);

if (out.length < src.length * 0.9) {
  console.error(`Output too small (${out.length} vs ${src.length}). Aborting write.`);
  process.exit(1);
}
writeFileSync(path, out);
console.log(`Wrote ${out.length} bytes.`);
