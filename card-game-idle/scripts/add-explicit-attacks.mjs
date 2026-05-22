import fs from 'node:fs';
import path from 'node:path';

const CARD_DIR = path.join(process.cwd(), 'src', 'data', 'cards');

const rarityMult = {
  Common: 1,
  Rare: 1.14,
  Epic: 1.3,
  Legendary: 1.55,
  Eternal: 2.05,
  Infinite: 2.55,
};

const bonusPitch = {
  oblivion_per_card: 'steady per-card pressure',
  chain_bonus: 'accelerated chain growth',
  ophanim_bonus: 'Ophanim-linked burst conversion',
  cherubim_extra_plays: 'expanded Cherubim sequencing',
  cherubim_expire_bonus: 'Cherubim expiry detonations',
  ember_per_card: 'ember overflow scaling',
  power_amplifier: 'field power amplification',
  score_per_second: 'passive score accumulation',
  resource_generation: 'resource generation pressure',
  tick_acceleration: 'faster board cadence',
  power_per_seraphim: 'seraphim-linked pressure',
  oblivion_per_seraphim: 'formation-linked conversion',
};

const onPlayPitch = {
  draw: 'draw tempo',
  oblivion_flat: 'immediate Oblivion injection',
  chain_gain: 'chain-gain anchoring',
  chain_multiplier_set: 'chain snapline setup',
  multiply_next: 'next-card amplification',
  salvage_any: 'discard reclamation',
  look_top_take: 'topdeck sculpting',
  look_top_take_drop: 'selection routing',
  conditional: 'conditional conversion',
  dominant_stack_gain: 'resource stack growth',
  ember_gain: 'ember loading',
  radiance_gain: 'radiance loading',
  trail_gain: 'trail loading',
  strain_gain: 'strain loading',
  overclock: 'overclock priming',
};

const elementPitch = {
  Neutrality: 'null-law',
  Fire: 'emberforged',
  Light: 'luminous',
  Dark: 'blackglass',
  Prismatic: 'prismatic',
  Mechanical: 'clockwork',
  Thornbound: 'thornbound',
};

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

function roundTo(value, step = 5) {
  return Math.max(step, Math.round(value / step) * step);
}

function getCardCore(obj) {
  const type = obj.match(/type:\s*'(Angel|Seraphim)'/)?.[1];
  if (!type) return null;

  const definitionId = obj.match(/definitionId:\s*'([^']+)'/)?.[1];
  const name = obj.match(/name:\s*'([^']+)'/)?.[1];
  const element = obj.match(/element:\s*'([^']+)'/)?.[1] ?? 'Neutrality';
  const rarity = obj.match(/rarity:\s*'([^']+)'/)?.[1] ?? 'Common';

  if (!definitionId || !name) return null;

  const baseStatsMatch = obj.match(/baseStats:\s*\{[\s\S]*?bonusType:\s*'([^']+)'[\s\S]*?bonusValue:\s*([0-9.]+)[\s\S]*?\}/);
  const bonusType = baseStatsMatch?.[1] ?? 'oblivion_per_card';
  const bonusValue = Number(baseStatsMatch?.[2] ?? 20);

  const crest = name.split(/\s+/).slice(0, 2).join(' ') || name;
  const elementLabel = elementPitch[element] ?? 'arcane';
  const bonusLabel = bonusPitch[bonusType] ?? 'battlefield scaling';

  return {
    type,
    definitionId,
    name,
    element,
    rarity,
    bonusType,
    bonusValue,
    crest,
    elementLabel,
    bonusLabel,
  };
}

function makeSeraphimAttacks(obj, card, indent) {
  const firstOnPlay = obj.match(/onPlayEffects:\s*\[\s*\{\s*type:\s*'([^']+)'/)?.[1] ?? 'draw';
  const playPitch = onPlayPitch[firstOnPlay] ?? 'setup momentum';
  const mult = rarityMult[card.rarity] ?? 1;
  const unsBase = roundTo((72 + card.bonusValue * 2.15) * mult);
  const unsCd = (card.rarity === 'Legendary' || card.rarity === 'Eternal' || card.rarity === 'Infinite') ? 4 : 3;
  const unsScale = card.bonusType === 'chain_bonus' ? 1.02 : 0.9;
  const synBase = roundTo(unsBase * 1.92);
  const synCd = unsCd + 2;
  const synScale = Math.round((unsScale + 0.28) * 100) / 100;

  const i2 = `${indent}  `;
  const i3 = `${indent}    `;

  return `${indent}attacks: {\n`
    + `${i2}unsynergized: {\n`
    + `${i3}id: '${card.definitionId}:unsynergized',\n`
    + `${i3}label: 'Unsynergized',\n`
    + `${i3}name: '${card.crest} Vector Break',\n`
    + `${i3}description: '${card.name} executes a ${card.elementLabel} opener tuned to ${playPitch} and ${card.bonusLabel}.',\n`
    + `${i3}baseOblivion: ${unsBase},\n`
    + `${i3}cooldownCards: ${unsCd},\n`
    + `${i3}chainScaling: ${unsScale.toFixed(2)},\n`
    + `${i3}costs: [],\n`
    + `${i3}tags: ['seraphim', 'unsynergized', '${card.element.toLowerCase()}'],\n`
    + `${i2}},\n`
    + `${i2}synergized: {\n`
    + `${i3}id: '${card.definitionId}:synergized',\n`
    + `${i3}label: 'Synergized',\n`
    + `${i3}name: '${card.crest} Angelic Verdict',\n`
    + `${i3}description: 'With an Angel aligned, ${card.name} escalates into a ${card.elementLabel} finisher and over-converts ${card.bonusLabel}.',\n`
    + `${i3}baseOblivion: ${synBase},\n`
    + `${i3}cooldownCards: ${synCd},\n`
    + `${i3}chainScaling: ${synScale.toFixed(2)},\n`
    + `${i3}costs: [],\n`
    + `${i3}requiresAngelOnBoard: true,\n`
    + `${i3}tags: ['seraphim', 'synergized', '${card.element.toLowerCase()}'],\n`
    + `${i2}},\n`
    + `${indent}},\n`;
}

function makeAngelAttacks(obj, card, indent) {
  const summonRaw = obj.match(/summonCost:\s*\[([\s\S]*?)\]/)?.[1] ?? '';
  const summonCount = (summonRaw.match(/'[^']+'/g) ?? []).length;
  const abilityName = obj.match(/activatedAbility:\s*\{[\s\S]*?name:\s*'([^']+)'/)?.[1] ?? 'Awakened Decree';
  const mult = rarityMult[card.rarity] ?? 1;
  const priBase = roundTo((118 + card.bonusValue * 2.05 + Math.max(1, summonCount) * 26) * mult);
  const priCd = Math.max(3, summonCount + 2);
  const exaBase = roundTo(priBase * 2.06);
  const exaCd = priCd + 3;

  const i2 = `${indent}  `;
  const i3 = `${indent}    `;

  return `${indent}attacks: {\n`
    + `${i2}primary: {\n`
    + `${i3}id: '${card.definitionId}:primary',\n`
    + `${i3}label: 'Primary',\n`
    + `${i3}name: '${card.crest} Ordinance',\n`
    + `${i3}description: '${card.name} applies disciplined pressure and stabilizes ${card.bonusLabel}.',\n`
    + `${i3}baseOblivion: ${priBase},\n`
    + `${i3}cooldownCards: ${priCd},\n`
    + `${i3}chainScaling: 0.98,\n`
    + `${i3}costs: [],\n`
    + `${i3}tags: ['angel', 'primary', '${card.element.toLowerCase()}'],\n`
    + `${i2}},\n`
    + `${i2}exalted: {\n`
    + `${i3}id: '${card.definitionId}:exalted',\n`
    + `${i3}label: 'Exalted',\n`
    + `${i3}name: '${card.crest} Throne Decree',\n`
    + `${i3}description: 'Exalted channel of ${abilityName}; converts ${card.bonusLabel} into a decisive finisher window.',\n`
    + `${i3}baseOblivion: ${exaBase},\n`
    + `${i3}cooldownCards: ${exaCd},\n`
    + `${i3}chainScaling: 1.24,\n`
    + `${i3}costs: [],\n`
    + `${i3}tags: ['angel', 'exalted', '${card.element.toLowerCase()}'],\n`
    + `${i2}},\n`
    + `${indent}},\n`;
}

function injectAttacks(content) {
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
    const core = getCardCore(obj);
    if (!core) continue;
    if (/\n\s*attacks\s*:/.test(obj)) continue;

    const baseStatsMatch = obj.match(/\n(\s*)baseStats:\s*\{/);
    if (!baseStatsMatch) continue;

    spans.push({ start, end, obj, core, indent: baseStatsMatch[1] });
  }

  if (spans.length === 0) return { updated: content, count: 0 };

  let updated = content;
  let count = 0;

  for (let i = spans.length - 1; i >= 0; i--) {
    const s = spans[i];
    const localInsertIdx = s.obj.search(/\n\s*baseStats:\s*\{/);
    if (localInsertIdx < 0) continue;

    const attackBlock = s.core.type === 'Seraphim'
      ? makeSeraphimAttacks(s.obj, s.core, s.indent)
      : makeAngelAttacks(s.obj, s.core, s.indent);

    const newObj = s.obj.slice(0, localInsertIdx + 1) + attackBlock + s.obj.slice(localInsertIdx + 1);
    updated = updated.slice(0, s.start) + newObj + updated.slice(s.end + 1);
    count++;
  }

  return { updated, count };
}

let total = 0;
for (const file of walk(CARD_DIR)) {
  const src = fs.readFileSync(file, 'utf8');
  const { updated, count } = injectAttacks(src);
  if (count > 0) {
    fs.writeFileSync(file, updated, 'utf8');
    total += count;
    console.log(`${path.relative(process.cwd(), file)} -> added attacks to ${count} cards`);
  }
}

console.log(`Total cards updated: ${total}`);
