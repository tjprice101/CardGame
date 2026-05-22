// Regenerate hand-authored card.description and activatedAbility.description
// to match canonical (so the consistency test passes after adding spark effects).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { CardRegistry } from '../src/cards/CardRegistry.ts';
import '../src/cards/RegistryBoot.ts';
import {
  getCanonicalCardDescription,
  getCanonicalActivatedAbilityDescription,
} from '../src/ui/cardStatSummary.ts';

const cardsDir = resolve('src/data/cards');
const files = readdirSync(cardsDir)
  .filter(f => f.endsWith('.ts'))
  .map(f => resolve(cardsDir, f));

const internalTokenPattern = /\b[a-z]+_[a-z][a-z0-9_]+\b/;

const srcByFile = new Map<string, string>();
for (const f of files) srcByFile.set(f, readFileSync(f, 'utf8'));

function escapeForSingleQuoted(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function replaceDescription(file: string, defId: string, newDesc: string, ownerKey: 'card' | 'awaken'): boolean {
  let src = srcByFile.get(file)!;
  // find card block by definitionId
  const idIdx = src.indexOf(`definitionId: '${defId}'`);
  if (idIdx === -1) return false;
  // find next card start to bound search (we look only within this card)
  const next = src.indexOf(`definitionId: '`, idIdx + 1);
  const blockEnd = next === -1 ? src.length : next;

  if (ownerKey === 'card') {
    // replace the FIRST `description: '...'` after idIdx within the block
    const re = /description:\s*'((?:\\'|[^'])*)'/;
    const block = src.slice(idIdx, blockEnd);
    const m = re.exec(block);
    if (!m) return false;
    const matchAbs = idIdx + m.index;
    const before = src.slice(0, matchAbs);
    const after = src.slice(matchAbs + m[0].length);
    src = `${before}description: '${escapeForSingleQuoted(newDesc)}'${after}`;
  } else {
    // activatedAbility: { ... description: '...' ... }
    const aaIdx = src.indexOf('activatedAbility:', idIdx);
    if (aaIdx === -1 || aaIdx > blockEnd) return false;
    const re = /description:\s*'((?:\\'|[^'])*)'/;
    const region = src.slice(aaIdx, blockEnd);
    const m = re.exec(region);
    if (!m) return false;
    const matchAbs = aaIdx + m.index;
    const before = src.slice(0, matchAbs);
    const after = src.slice(matchAbs + m[0].length);
    src = `${before}description: '${escapeForSingleQuoted(newDesc)}'${after}`;
  }
  srcByFile.set(file, src);
  return true;
}

let updated = 0;
const all = CardRegistry.getAll();
// Target any card whose authored description (or activated ability description)
// no longer matches the canonical generator output. This covers leaked
// internal tokens as well as drift from formatter changes (e.g. chain_gain
// switching to `+xN` form).
const targets = all.filter(c => {
  try {
    const canon = getCanonicalCardDescription(c as any);
    if (typeof c.description === 'string' && canon && canon !== c.description) return true;
    if (c.type === 'Angel') {
      const ac = getCanonicalActivatedAbilityDescription(c as any);
      const aaDesc = (c as any).activatedAbility?.description;
      if (ac && typeof aaDesc === 'string' && ac !== aaDesc) return true;
    }
  } catch {
    // skip cards that can't be canonicalized
  }
  return false;
});

for (const c of targets) {
  const canon = getCanonicalCardDescription(c as any);
  if (canon && canon !== c.description) {
    for (const f of files) {
      if (srcByFile.get(f)!.includes(`definitionId: '${c.definitionId}'`)) {
        if (replaceDescription(f, c.definitionId, canon, 'card')) updated++;
        break;
      }
    }
  }
  if (c.type === 'Angel') {
    const ac = getCanonicalActivatedAbilityDescription(c as any);
    if (ac && ac !== (c as any).activatedAbility?.description) {
      for (const f of files) {
        if (srcByFile.get(f)!.includes(`definitionId: '${c.definitionId}'`)) {
          if (replaceDescription(f, c.definitionId, ac, 'awaken')) updated++;
          break;
        }
      }
    }
  }
}

for (const [f, s] of srcByFile) writeFileSync(f, s, 'utf8');
console.log(`Updated ${updated} description fields.`);
