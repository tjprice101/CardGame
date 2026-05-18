import fs from 'node:fs';
import path from 'node:path';

const CARD_DIR = path.join(process.cwd(), 'src', 'data', 'cards');

const seraphimBaseByRarity = {
  Common: 110,
  Rare: 170,
  Epic: 260,
  Legendary: 420,
  Eternal: 900,
  Infinite: 1800,
};

const angelBaseByRarity = {
  Common: 220,
  Rare: 320,
  Epic: 480,
  Legendary: 760,
  Eternal: 1600,
  Infinite: 2900,
};

const seraphimUnsCdByRarity = {
  Common: 3,
  Rare: 3,
  Epic: 4,
  Legendary: 4,
  Eternal: 5,
  Infinite: 5,
};

const angelPrimaryCdByRarity = {
  Common: 3,
  Rare: 4,
  Epic: 4,
  Legendary: 5,
  Eternal: 6,
  Infinite: 6,
};

const seraphimUnsScaleByRarity = {
  Common: 0.9,
  Rare: 0.96,
  Epic: 1.04,
  Legendary: 1.14,
  Eternal: 1.28,
  Infinite: 1.42,
};

const angelPrimaryScaleByRarity = {
  Common: 1.0,
  Rare: 1.06,
  Epic: 1.14,
  Legendary: 1.24,
  Eternal: 1.36,
  Infinite: 1.5,
};

const seraphimSynMultByRarity = {
  Common: 1.8,
  Rare: 1.9,
  Epic: 2.0,
  Legendary: 2.1,
  Eternal: 2.3,
  Infinite: 2.4,
};

const angelExaltedMultByRarity = {
  Common: 1.9,
  Rare: 2.0,
  Epic: 2.15,
  Legendary: 2.3,
  Eternal: 2.55,
  Infinite: 2.75,
};

const bonusValueWeight = {
  oblivion_per_card: 10,
  chain_bonus: 520,
  ophanim_bonus: 5,
  cherubim_extra_plays: 95,
  cherubim_expire_bonus: 2,
  ember_per_card: 6,
  power_amplifier: 65,
  score_per_second: 55,
  resource_generation: 60,
  tick_acceleration: 60,
  power_per_seraphim: 35,
  oblivion_per_seraphim: 40,
};

function roundTo(value, step = 5) {
  return Math.max(step, Math.round(value / step) * step);
}

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
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

function replaceNumeric(block, key, value) {
  const re = new RegExp(`(${key}:\\s*)([0-9]+(?:\\.[0-9]+)?)`);
  return block.replace(re, `$1${value}`);
}

function rebalanceAttackBlock(attackBlock, values) {
  let out = attackBlock;
  out = replaceNumeric(out, 'baseOblivion', values.baseOblivion);
  out = replaceNumeric(out, 'cooldownCards', values.cooldownCards);
  out = replaceNumeric(out, 'chainScaling', values.chainScaling.toFixed(2));
  return out;
}

function rebalanceCardObject(obj) {
  const type = obj.match(/type:\s*'(Angel|Seraphim)'/)?.[1];
  if (!type) return obj;

  const rarity = obj.match(/rarity:\s*'([^']+)'/)?.[1] ?? 'Common';
  const bonusType = obj.match(/baseStats:\s*\{[\s\S]*?bonusType:\s*'([^']+)'/)?.[1] ?? 'oblivion_per_card';
  const bonusValue = Number(obj.match(/baseStats:\s*\{[\s\S]*?bonusValue:\s*([0-9.]+)/)?.[1] ?? 0);
  const summonCostRaw = obj.match(/summonCost:\s*\[([\s\S]*?)\]/)?.[1] ?? '';
  const summonCount = (summonCostRaw.match(/'[^']+'/g) ?? []).length;

  const weight = bonusValueWeight[bonusType] ?? 10;

  if (type === 'Seraphim') {
    const unsBase = roundTo((seraphimBaseByRarity[rarity] ?? 120) + bonusValue * weight * 0.18);
    const unsCd = seraphimUnsCdByRarity[rarity] ?? 4;
    const unsScale = seraphimUnsScaleByRarity[rarity] ?? 1.0;

    const synBase = roundTo(unsBase * (seraphimSynMultByRarity[rarity] ?? 2.0));
    const synCd = unsCd + (rarity === 'Eternal' || rarity === 'Infinite' ? 3 : 2);
    const synScale = unsScale + (rarity === 'Eternal' || rarity === 'Infinite' ? 0.34 : 0.28);

    return obj.replace(/unsynergized:\s*\{[\s\S]*?\n\s*\},/, (m) => rebalanceAttackBlock(m, {
      baseOblivion: unsBase,
      cooldownCards: unsCd,
      chainScaling: unsScale,
    })).replace(/synergized:\s*\{[\s\S]*?\n\s*\},/, (m) => rebalanceAttackBlock(m, {
      baseOblivion: synBase,
      cooldownCards: synCd,
      chainScaling: synScale,
    }));
  }

  const primaryBase = roundTo((angelBaseByRarity[rarity] ?? 260) + bonusValue * weight * 0.2 + Math.max(1, summonCount) * 70);
  const primaryCd = angelPrimaryCdByRarity[rarity] ?? 4;
  const primaryScale = angelPrimaryScaleByRarity[rarity] ?? 1.1;

  const exaltedBase = roundTo(primaryBase * (angelExaltedMultByRarity[rarity] ?? 2.1));
  const exaltedCd = primaryCd + (rarity === 'Eternal' || rarity === 'Infinite' ? 3 : 2);
  const exaltedScale = primaryScale + (rarity === 'Eternal' || rarity === 'Infinite' ? 0.26 : 0.22);

  return obj.replace(/primary:\s*\{[\s\S]*?\n\s*\},/, (m) => rebalanceAttackBlock(m, {
    baseOblivion: primaryBase,
    cooldownCards: primaryCd,
    chainScaling: primaryScale,
  })).replace(/exalted:\s*\{[\s\S]*?\n\s*\},/, (m) => rebalanceAttackBlock(m, {
    baseOblivion: exaltedBase,
    cooldownCards: exaltedCd,
    chainScaling: exaltedScale,
  }));
}

function rebalanceFile(content) {
  const idRegex = /definitionId:\s*'[^']+'/g;
  const spans = [];
  let m;

  while ((m = idRegex.exec(content))) {
    const defIdx = m.index;
    const start = findObjectStart(content, defIdx);
    if (start < 0) continue;
    const end = findObjectEnd(content, start);
    if (end < 0) continue;

    const obj = content.slice(start, end + 1);
    if (!/type:\s*'(Angel|Seraphim)'/.test(obj)) continue;
    if (!/\n\s*attacks\s*:/.test(obj)) continue;

    spans.push({ start, end, obj });
  }

  if (spans.length === 0) return { updated: content, count: 0 };

  let updated = content;
  let count = 0;

  for (let i = spans.length - 1; i >= 0; i--) {
    const s = spans[i];
    const rebalanced = rebalanceCardObject(s.obj);
    if (rebalanced !== s.obj) {
      updated = updated.slice(0, s.start) + rebalanced + updated.slice(s.end + 1);
      count++;
    }
  }

  return { updated, count };
}

let touchedCards = 0;
for (const file of walk(CARD_DIR)) {
  const src = fs.readFileSync(file, 'utf8');
  const { updated, count } = rebalanceFile(src);
  if (count > 0) {
    fs.writeFileSync(file, updated, 'utf8');
    touchedCards += count;
    console.log(`${path.relative(process.cwd(), file)} -> rebalanced ${count} cards`);
  }
}

console.log(`Total cards rebalanced: ${touchedCards}`);
