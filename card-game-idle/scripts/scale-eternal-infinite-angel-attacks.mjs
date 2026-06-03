import fs from 'node:fs';
import path from 'node:path';

const CARD_DIR = path.join(process.cwd(), 'src', 'data', 'cards');

const SCALE_BY_RARITY = {
  Eternal: 0.82,
  Infinite: 0.76,
};

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.isFile() && p.endsWith('.ts')) out.push(p);
  }
  return out;
}

function findObjectStart(text, idx) {
  for (let i = idx; i >= 0; i--) {
    if (text[i] === '{') return i;
  }
  return -1;
}

function findObjectEnd(text, start) {
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if ((inSingle || inDouble || inTemplate) && ch === '\\' && !escaped) {
      escaped = true;
      continue;
    }

    if (!escaped) {
      if (inSingle && ch === "'") inSingle = false;
      else if (inDouble && ch === '"') inDouble = false;
      else if (inTemplate && ch === '`') inTemplate = false;
      else if (!inSingle && !inDouble && !inTemplate) {
        if (ch === "'") inSingle = true;
        else if (ch === '"') inDouble = true;
        else if (ch === '`') inTemplate = true;
        else if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) return i;
        }
      }
    }

    escaped = false;
  }

  return -1;
}

function parseNum(block, key) {
  const m = block.match(new RegExp(`${key}:\\s*([0-9]+(?:\\.[0-9]+)?)`));
  return m ? Number(m[1]) : null;
}

function replaceNum(block, key, value) {
  return block.replace(new RegExp(`(${key}:\\s*)([0-9]+(?:\\.[0-9]+)?)`), `$1${value}`);
}

function scaleAttackBlock(block, factor) {
  const base = parseNum(block, 'baseOblivion');
  if (base == null) return block;
  const scaled = Math.max(1, Math.round(base * factor));
  return replaceNum(block, 'baseOblivion', scaled);
}

function scaleAngelObject(obj) {
  const type = obj.match(/type:\s*'(Angel)'/)?.[1];
  if (!type) return { next: obj, changed: false };

  const rarity = obj.match(/rarity:\s*'([^']+)'/)?.[1] ?? 'Common';
  const factor = SCALE_BY_RARITY[rarity];
  if (!factor) return { next: obj, changed: false };
  if (!/\battacks\s*:/.test(obj)) return { next: obj, changed: false };

  const primary = obj.match(/\bprimary:\s*\{[\s\S]*?\n\s*\},/);
  const exalted = obj.match(/\bexalted:\s*\{[\s\S]*?\n\s*\},/);
  if (!primary || !exalted) return { next: obj, changed: false };

  const nextPrimary = scaleAttackBlock(primary[0], factor);
  const nextExalted = scaleAttackBlock(exalted[0], factor);

  let next = obj.replace(primary[0], nextPrimary).replace(exalted[0], nextExalted);
  // Keep short attack descriptions numerically truthful where they embed base values.
  const nextPrimaryBase = parseNum(nextPrimary, 'baseOblivion');
  const nextExaltedBase = parseNum(nextExalted, 'baseOblivion');
  if (nextPrimaryBase != null) {
    next = next.replace(/(primary:[\s\S]*?description:\s*')([^']*?)( base Oblivion)/, (_, a, b, c) => {
      const updated = b.replace(/\d+(?:,\d{3})*/g, String(nextPrimaryBase));
      return `${a}${updated}${c}`;
    });
  }
  if (nextExaltedBase != null) {
    next = next.replace(/(exalted:[\s\S]*?description:\s*')([^']*?)( base Oblivion)/, (_, a, b, c) => {
      const updated = b.replace(/\d+(?:,\d{3})*/g, String(nextExaltedBase));
      return `${a}${updated}${c}`;
    });
  }

  return { next, changed: next !== obj };
}

function processFile(content) {
  const idRegex = /definitionId:\s*'[^']+'/g;
  const spans = [];
  let m;

  while ((m = idRegex.exec(content))) {
    const idx = m.index;
    const start = findObjectStart(content, idx);
    if (start < 0) continue;
    const end = findObjectEnd(content, start);
    if (end < 0) continue;
    const obj = content.slice(start, end + 1);
    if (!/type:\s*'(Angel)'/.test(obj)) continue;
    spans.push({ start, end, obj });
  }

  if (!spans.length) return { updated: content, count: 0 };

  let updated = content;
  let count = 0;

  for (let i = spans.length - 1; i >= 0; i--) {
    const s = spans[i];
    const { next, changed } = scaleAngelObject(s.obj);
    if (!changed) continue;
    updated = updated.slice(0, s.start) + next + updated.slice(s.end + 1);
    count++;
  }

  return { updated, count };
}

let touched = 0;
for (const file of walk(CARD_DIR)) {
  const src = fs.readFileSync(file, 'utf8');
  const { updated, count } = processFile(src);
  if (count > 0) {
    fs.writeFileSync(file, updated, 'utf8');
    touched += count;
    console.log(`${path.relative(process.cwd(), file)} -> scaled ${count} Eternal/Infinite Angels`);
  }
}

console.log(`Total Eternal/Infinite Angel definitions scaled: ${touched}`);
