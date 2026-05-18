import fs from 'node:fs';
import path from 'node:path';

const CARD_DIR = path.join(process.cwd(), 'src', 'data', 'cards');

const maxUnsCd = { Common: 4, Rare: 4, Epic: 5, Legendary: 5, Eternal: 6, Infinite: 6 };
const maxPriCd = { Common: 4, Rare: 5, Epic: 5, Legendary: 6, Eternal: 7, Infinite: 7 };

const seraphimFloor = {
  Common: { uns: 90, syn: 170 },
  Rare: { uns: 150, syn: 300 },
  Epic: { uns: 240, syn: 520 },
  Legendary: { uns: 380, syn: 850 },
  Eternal: { uns: 900, syn: 2100 },
  Infinite: { uns: 1800, syn: 4500 },
};

const angelFloor = {
  Common: { pri: 200, exa: 380 },
  Rare: { pri: 300, exa: 650 },
  Epic: { pri: 450, exa: 950 },
  Legendary: { pri: 700, exa: 1650 },
  Eternal: { pri: 1600, exa: 4200 },
  Infinite: { pri: 2800, exa: 8000 },
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

function replaceAttackBlock(block, values) {
  let out = block;
  out = replaceNum(out, 'baseOblivion', values.baseOblivion);
  out = replaceNum(out, 'cooldownCards', values.cooldownCards);
  out = replaceNum(out, 'chainScaling', values.chainScaling.toFixed(2));
  return out;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function rebalanceObject(obj) {
  const type = obj.match(/type:\s*'(Angel|Seraphim)'/)?.[1];
  if (!type) return obj;
  if (!/\battacks\s*:/.test(obj)) return obj;

  const rarity = obj.match(/rarity:\s*'([^']+)'/)?.[1] ?? 'Common';

  if (type === 'Seraphim') {
    const unsMatch = obj.match(/\bunsynergized:\s*\{[\s\S]*?\n\s*\},/);
    const synMatch = obj.match(/\bsynergized:\s*\{[\s\S]*?\n\s*\},/);
    if (!unsMatch || !synMatch) return obj;

    const uns = unsMatch[0];
    const syn = synMatch[0];

    let unsBase = parseNum(uns, 'baseOblivion') ?? 100;
    let unsCd = parseNum(uns, 'cooldownCards') ?? 3;
    let unsScale = parseNum(uns, 'chainScaling') ?? 0.9;

    let synBase = parseNum(syn, 'baseOblivion') ?? Math.round(unsBase * 1.8);
    let synCd = parseNum(syn, 'cooldownCards') ?? unsCd + 2;
    let synScale = parseNum(syn, 'chainScaling') ?? unsScale + 0.28;

    const floors = seraphimFloor[rarity] ?? seraphimFloor.Common;

    unsBase = Math.max(unsBase, floors.uns);
    synBase = Math.max(synBase, floors.syn, Math.round(unsBase * 1.7));

    unsCd = clamp(unsCd, 3, maxUnsCd[rarity] ?? 5);
    synCd = clamp(synCd, unsCd + 1, unsCd + 3);

    unsScale = clamp(unsScale, 0.85, rarity === 'Infinite' ? 1.65 : rarity === 'Eternal' ? 1.5 : 1.4);
    synScale = clamp(synScale, unsScale + 0.16, rarity === 'Infinite' ? 1.95 : rarity === 'Eternal' ? 1.75 : 1.65);

    const unsReplaced = replaceAttackBlock(uns, {
      baseOblivion: Math.round(unsBase),
      cooldownCards: Math.round(unsCd),
      chainScaling: unsScale,
    });

    const synReplaced = replaceAttackBlock(syn, {
      baseOblivion: Math.round(synBase),
      cooldownCards: Math.round(synCd),
      chainScaling: synScale,
    });

    return obj.replace(uns, unsReplaced).replace(syn, synReplaced);
  }

  const priMatch = obj.match(/\bprimary:\s*\{[\s\S]*?\n\s*\},/);
  const exaMatch = obj.match(/\bexalted:\s*\{[\s\S]*?\n\s*\},/);
  if (!priMatch || !exaMatch) return obj;

  const pri = priMatch[0];
  const exa = exaMatch[0];

  let priBase = parseNum(pri, 'baseOblivion') ?? 250;
  let priCd = parseNum(pri, 'cooldownCards') ?? 4;
  let priScale = parseNum(pri, 'chainScaling') ?? 1.0;

  let exaBase = parseNum(exa, 'baseOblivion') ?? Math.round(priBase * 2.0);
  let exaCd = parseNum(exa, 'cooldownCards') ?? priCd + 2;
  let exaScale = parseNum(exa, 'chainScaling') ?? priScale + 0.22;

  const floors = angelFloor[rarity] ?? angelFloor.Common;

  priBase = Math.max(priBase, floors.pri);
  exaBase = Math.max(exaBase, floors.exa, Math.round(priBase * 1.9));

  priCd = clamp(priCd, 3, maxPriCd[rarity] ?? 6);
  exaCd = clamp(exaCd, priCd + 1, priCd + 3);

  priScale = clamp(priScale, 0.95, rarity === 'Infinite' ? 1.75 : rarity === 'Eternal' ? 1.6 : 1.45);
  exaScale = clamp(exaScale, priScale + 0.16, rarity === 'Infinite' ? 2.0 : rarity === 'Eternal' ? 1.82 : 1.68);

  const priReplaced = replaceAttackBlock(pri, {
    baseOblivion: Math.round(priBase),
    cooldownCards: Math.round(priCd),
    chainScaling: priScale,
  });

  const exaReplaced = replaceAttackBlock(exa, {
    baseOblivion: Math.round(exaBase),
    cooldownCards: Math.round(exaCd),
    chainScaling: exaScale,
  });

  return obj.replace(pri, priReplaced).replace(exa, exaReplaced);
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
    if (!/type:\s*'(Angel|Seraphim)'/.test(obj)) continue;
    spans.push({ start, end, obj });
  }

  if (!spans.length) return { updated: content, count: 0 };

  let updated = content;
  let count = 0;

  for (let i = spans.length - 1; i >= 0; i--) {
    const s = spans[i];
    const next = rebalanceObject(s.obj);
    if (next !== s.obj) {
      updated = updated.slice(0, s.start) + next + updated.slice(s.end + 1);
      count++;
    }
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
    console.log(`${path.relative(process.cwd(), file)} -> normalized ${count} cards`);
  }
}

console.log(`Total cards normalized: ${touched}`);
