import type {
  AngelAttackSet,
  AngelDefinition,
  AttackCost,
  CardDefinition,
  CherubimDefinition,
  OphanimDefinition,
  SeraphimAttackSet,
  SeraphimDefinition,
} from '@/types/cards';
import type { CherubimPassiveEffect } from '@/types/effects';
import { lightAngels } from '../data/cards/lightAngels';
import { lightHRCards } from '../data/cards/lightHRCards';
import { lightSeraphims } from '../data/cards/lightSeraphims';
import { neutralityAngels } from '../data/cards/neutralityAngel';
import { neutralityCards } from '../data/cards/neutralityCards';
import { neutralityCherubimCards } from '../data/cards/neutralityCherubimCards';
import { pyroabyssAngels } from '../data/cards/pyroabyssAngels';
import { pyroabyssSeraphims, pyroabyssOphanimCards } from '../data/cards/pyroabyssCards';
import { pyroabyssCherubimCards } from '../data/cards/pyroabyssCherubimCards';
import { eternalCards } from '../data/cards/eternalCards';
import { thornboundAngels } from '../data/cards/thornboundAngels';
import { thornboundCherubim, thornboundCherubimCards, thornboundOphanims, thornboundSeraphims } from '../data/cards/thornboundCards';
import { mechanicalDreamsAngels } from '../data/cards/mechanicalDreamsAngels';
import { mechanicalDreamsCherubim, mechanicalDreamsCherubimCards, mechanicalDreamsOphanims, mechanicalDreamsSeraphims } from '../data/cards/mechanicalDreamsCards';
import { prismaticAccordAngels } from '../data/cards/prismaticAccordAngels';
import { prismaticAccordCherubim, prismaticAccordCherubimCards, prismaticAccordOphanims, prismaticAccordSeraphims } from '../data/cards/prismaticAccordCards';
import { blackGlassInfernoAngels } from '../data/cards/blackGlassInfernoAngels';
import { blackGlassInfernoCherubim, blackGlassInfernoCherubimCards, blackGlassInfernoOphanims, blackGlassInfernoSeraphims } from '../data/cards/blackGlassInfernoCards';
import { glassAbsoluteCards } from '../data/cards/glassAbsoluteCards';
import { blazingGardenCards } from '../data/cards/blazingGardenCards';
import { butterflySetCards } from '../data/cards/butterflySetCards';
import { eternalSeasCards } from '../data/cards/eternalSeasCards';
import { abyssalForgeCards } from '../data/cards/abyssalForgeCards';
import { deathFlamedHellCards } from '../data/cards/deathFlamedHellCards';
import { wishedUponAStarCards } from '../data/cards/wishedUponAStarCards';
import { snowboundVoltageAngels, snowboundVoltageCherubimCards, snowboundVoltageOphanimCards, snowboundVoltageSeraphims } from '../data/cards/snowboundVoltageCards';
import { infiniteCards } from '../data/cards/infiniteCards';
import { MATERIALIZED_CARD_BALANCE } from '../data/cards/materializedCardBalance';
import { ScoreSystem } from '../systems/scoring/ScoreSystem';
import { formatDisplayCardText } from '../ui/preferences';

const registry = new Map<string, CardDefinition>();

const CARD_ID_ALIASES: Record<string, string> = {
  'bg-et-vethkorath-seven-crown': 'bg-et-vethkorath-seven-crown-proof',
};

function resolveCardId(id: string): string {
  return CARD_ID_ALIASES[id] ?? id;
}

const SOURCE_DEFINITIONS: CardDefinition[] = [
  ...(lightAngels as unknown as CardDefinition[]),
  ...(lightHRCards as unknown as CardDefinition[]),
  ...(lightSeraphims as unknown as CardDefinition[]),
  ...(neutralityAngels as unknown as CardDefinition[]),
  ...(neutralityCards as unknown as CardDefinition[]),
  ...(neutralityCherubimCards as unknown as CardDefinition[]),
  ...(pyroabyssAngels as unknown as CardDefinition[]),
  ...(pyroabyssSeraphims as unknown as CardDefinition[]),
  ...(pyroabyssOphanimCards as unknown as CardDefinition[]),
  ...(pyroabyssCherubimCards as unknown as CardDefinition[]),
  ...(eternalCards as unknown as CardDefinition[]),
  ...(thornboundAngels as unknown as CardDefinition[]),
  ...(thornboundCherubim as unknown as CardDefinition[]),
  ...(thornboundCherubimCards as unknown as CardDefinition[]),
  ...(thornboundOphanims as unknown as CardDefinition[]),
  ...(thornboundSeraphims as unknown as CardDefinition[]),
  ...(mechanicalDreamsAngels as unknown as CardDefinition[]),
  ...(mechanicalDreamsCherubim as unknown as CardDefinition[]),
  ...(mechanicalDreamsCherubimCards as unknown as CardDefinition[]),
  ...(mechanicalDreamsOphanims as unknown as CardDefinition[]),
  ...(mechanicalDreamsSeraphims as unknown as CardDefinition[]),
  ...(prismaticAccordAngels as unknown as CardDefinition[]),
  ...(prismaticAccordCherubim as unknown as CardDefinition[]),
  ...(prismaticAccordCherubimCards as unknown as CardDefinition[]),
  ...(prismaticAccordOphanims as unknown as CardDefinition[]),
  ...(prismaticAccordSeraphims as unknown as CardDefinition[]),
  ...(blackGlassInfernoAngels as unknown as CardDefinition[]),
  ...(blackGlassInfernoCherubim as unknown as CardDefinition[]),
  ...(blackGlassInfernoCherubimCards as unknown as CardDefinition[]),
  ...(blackGlassInfernoOphanims as unknown as CardDefinition[]),
  ...(blackGlassInfernoSeraphims as unknown as CardDefinition[]),
  ...(snowboundVoltageAngels as unknown as CardDefinition[]),
  ...(snowboundVoltageCherubimCards as unknown as CardDefinition[]),
  ...(snowboundVoltageOphanimCards as unknown as CardDefinition[]),
  ...(snowboundVoltageSeraphims as unknown as CardDefinition[]),
  ...(glassAbsoluteCards as unknown as CardDefinition[]),
  ...(blazingGardenCards as unknown as CardDefinition[]),
  ...(butterflySetCards as unknown as CardDefinition[]),
  ...(eternalSeasCards as unknown as CardDefinition[]),
  ...(abyssalForgeCards as unknown as CardDefinition[]),
  ...(deathFlamedHellCards as unknown as CardDefinition[]),
  ...(wishedUponAStarCards as unknown as CardDefinition[]),
  ...(infiniteCards as unknown as CardDefinition[]),
];

const ELEMENT_MOTIFS: Record<string, string[]> = {
  fire: ['Pyre', 'Cinder', 'Ember', 'Ash', 'Inferno'],
  light: ['Halo', 'Aurora', 'Dawn', 'Lumen', 'Canticle'],
  neutrality: ['Null', 'Axiom', 'Paradox', 'Stillness', 'Void'],
  thornbound: ['Briar', 'Thorn', 'Harrow', 'Gallow', 'Vine'],
  mechanical: ['Gear', 'Brass', 'Reactor', 'Forge', 'Vector'],
  prismatic: ['Prism', 'Spectrum', 'Refraction', 'Mirror', 'Lattice'],
  dark: ['Umbral', 'Obsidian', 'Nocturne', 'Abyss', 'Blackglass'],
};

const SERAPHIM_UNSYN_ACTIONS = ['Rend', 'Sunder', 'Lance', 'Cleave', 'Riftcarve'];
const SERAPHIM_SYN_ACTIONS = ['Concordance', 'Cataclysm', 'Ascension', 'Judgment', 'Anathema'];
const ANGEL_PRIMARY_ACTIONS = ['Severance', 'Edict', 'Cant', 'Ray', 'Hammer'];
const ANGEL_EXALTED_ACTIONS = ['Decree', 'Apotheosis', 'Crownfall', 'Omega', 'Dominion'];

function rarityWeight(rarity: string): number {
  switch (rarity) {
    case 'Infinite': return 6;
    case 'Eternal': return 5;
    case 'Legendary': return 4;
    case 'Epic': return 3;
    case 'Rare': return 2;
    default: return 1;
  }
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickByHash<T>(list: T[], seed: string): T {
  return list[hashString(seed) % list.length];
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function familyTags(definitionId: string): string[] {
  const parts = definitionId.toLowerCase().split('-');
  if (parts.length < 2) return [parts[0] ?? 'core'];
  return [parts[0], `${parts[0]}-${parts[1]}`];
}

function primaryFamily(definitionId: string): string {
  const tags = familyTags(definitionId);
  return tags[1] ?? tags[0] ?? 'core';
}

const sourceSeraphim = SOURCE_DEFINITIONS.filter(def => def.type === 'Seraphim') as SeraphimDefinition[];
const sourceAngels = SOURCE_DEFINITIONS.filter(def => def.type === 'Angel') as AngelDefinition[];

function findRelatedUnitIds(
  unitType: 'Seraphim' | 'Angel',
  element: string,
  family: string,
  maxCount: number,
): string[] {
  const source = unitType === 'Seraphim' ? sourceSeraphim : sourceAngels;
  const elementMatches = source.filter(def => def.element === element);
  const exactFamily = elementMatches.filter(def => primaryFamily(def.definitionId) === family);
  const fallbackFamily = elementMatches.filter(def => primaryFamily(def.definitionId).startsWith(family.split('-')[0] ?? family));
  const merged = [...exactFamily, ...fallbackFamily, ...elementMatches]
    .filter((def, index, arr) => arr.findIndex(other => other.definitionId === def.definitionId) === index);
  return merged.slice(0, maxCount).map(def => def.definitionId);
}

function motifFor(def: { definitionId: string; element: string }): string {
  const elementKey = def.element.toLowerCase();
  const motifs = ELEMENT_MOTIFS[elementKey] ?? ['Eclipse', 'Aether', 'Rift', 'Crown', 'Pulse'];
  return pickByHash(motifs, `${def.definitionId}:${def.element}`);
}

function archetypeIndex(definitionId: string, buckets: number): number {
  return hashString(definitionId) % Math.max(1, buckets);
}

function buildSeraphimAttacks(def: SeraphimDefinition): SeraphimAttackSet {
  const weight = rarityWeight(def.rarity);
  const motif = motifFor(def);
  const unsynAction = pickByHash(SERAPHIM_UNSYN_ACTIONS, `${def.definitionId}:unsyn`);
  const synAction = pickByHash(SERAPHIM_SYN_ACTIONS, `${def.definitionId}:syn`);
  let unsynergizedBase = 80 + weight * 30;
  let synergizedBase = Math.round(unsynergizedBase * 1.85);
  let unsynCooldown = 2 + Math.min(2, Math.floor(weight / 2));
  let synCooldown = 4 + Math.min(2, Math.floor(weight / 2));
  let unsynScaling = 0.8 + weight * 0.03;
  let synScaling = 1.05 + weight * 0.03;
  const uniqueArchetype = archetypeIndex(def.definitionId, 4);

  switch (def.baseStats.bonusType) {
    case 'ophanim_bonus':
      synergizedBase = Math.round(synergizedBase * 1.12);
      synScaling += 0.05;
      break;
    case 'cherubim_extra_plays':
    case 'cherubim_expire_bonus':
      unsynergizedBase = Math.round(unsynergizedBase * 1.08);
      synergizedBase = Math.round(synergizedBase * 1.08);
      synCooldown = Math.max(3, synCooldown - 1);
      break;
    case 'oblivion_per_card':
      unsynergizedBase = Math.round(unsynergizedBase * 1.1);
      break;
    default:
      break;
  }

  // Per-card uniqueness: each Seraphim leans into a different combat identity.
  switch (uniqueArchetype) {
    case 0: // Burst
      unsynergizedBase = Math.round(unsynergizedBase * 1.12);
      synergizedBase = Math.round(synergizedBase * 1.16);
      unsynCooldown += 1;
      synCooldown += 1;
      break;
    case 1: // Tempo
      unsynergizedBase = Math.round(unsynergizedBase * 0.94);
      synergizedBase = Math.round(synergizedBase * 0.98);
      unsynCooldown = Math.max(1, unsynCooldown - 1);
      synCooldown = Math.max(2, synCooldown - 1);
      break;
    case 2: // Chain scaler
      unsynScaling += 0.08;
      synScaling += 0.12;
      break;
    default: // Finisher profile
      synergizedBase = Math.round(synergizedBase * 1.2);
      synCooldown += 1;
      break;
  }

  return {
    unsynergized: {
      id: `${def.definitionId}:unsynergized`,
      label: 'Unsynergized',
      name: `${motif} ${unsynAction}`,
      description: 'Standard attack. Usable whenever its cooldown reaches 0.',
      baseOblivion: unsynergizedBase,
      cooldownCards: unsynCooldown,
      tags: ['seraphim', 'unsynergized', def.element.toLowerCase(), ...familyTags(def.definitionId)],
    },
    synergized: {
      id: `${def.definitionId}:synergized`,
      label: 'Synergized',
      name: `${motif} ${synAction}`,
      description: 'High-impact attack. Requires at least one Angel on your board.',
      baseOblivion: synergizedBase,
      cooldownCards: synCooldown,
      requiresAngelOnBoard: true,
      costs: uniqueArchetype === 3 && weight >= 3 ? [{ type: 'discard_from_hand', value: 1 }] : undefined,
      tags: ['seraphim', 'synergized', 'covenant', def.element.toLowerCase(), ...familyTags(def.definitionId)],
    },
  };
}

function buildAngelAttacks(def: AngelDefinition): AngelAttackSet {
  const weight = rarityWeight(def.rarity);
  const motif = motifFor(def);
  const primaryAction = pickByHash(ANGEL_PRIMARY_ACTIONS, `${def.definitionId}:primary`);
  const exaltedAction = pickByHash(ANGEL_EXALTED_ACTIONS, `${def.definitionId}:exalted`);
  const summonPressure = def.summonCost.length + (def.extraSummonConditions?.length ?? 0);
  const primaryBase = 130 + weight * 45 + summonPressure * 18;
  // Exalted is ~3× the equivalent Seraphim synergized base (same rarity), independent of summonPressure.
  const exaltedBase = Math.round((80 + weight * 30) * 1.85 * 3.0);
  const costValue = 2 + Math.min(6, weight + Math.floor(summonPressure / 2));
  const uniqueArchetype = archetypeIndex(def.definitionId, 4);

  let dominantCost: AttackCost;
  switch (def.element) {
    case 'Light':
      dominantCost = { type: 'spend_radiance', value: costValue };
      break;
    case 'Fire':
      dominantCost = { type: 'spend_embers', value: costValue };
      break;
    case 'Thornbound':
      dominantCost = { type: 'spend_trail', value: Math.max(2, costValue - 1) };
      break;
    case 'Mechanical':
      dominantCost = { type: 'spend_strain', value: Math.max(2, costValue - 1) };
      break;
    default:
      dominantCost = { type: 'discard_from_hand', value: Math.max(1, Math.floor(weight / 2)) };
      break;
  }

  // Secondary cost creates sought-after uniqueness between Angels.
  const archetype2Cost: AttackCost = (() => {
    const v = Math.max(1, Math.floor(costValue / 2));
    switch (def.element) {
      case 'Light':      return { type: 'spend_radiance' as const, value: v };
      case 'Fire':       return { type: 'spend_embers' as const, value: v };
      case 'Thornbound': return { type: 'spend_trail' as const, value: Math.max(1, Math.floor(v / 2)) };
      case 'Mechanical': return { type: 'spend_strain' as const, value: v };
      default:           return { type: 'discard_from_hand' as const, value: 1 };
    }
  })();
  const secondaryCost: AttackCost | null = uniqueArchetype === 0
    ? { type: 'discard_from_hand', value: 1 }
    : uniqueArchetype === 1
      ? { type: 'sacrifice_seraphim', value: 1 }
      : uniqueArchetype === 2
        ? archetype2Cost
        : null;

  const primaryTunedBase = uniqueArchetype === 1
    ? Math.round(primaryBase * 0.92)
    : uniqueArchetype === 2
      ? Math.round(primaryBase * 1.05)
      : primaryBase;
  const exaltedTunedBase = uniqueArchetype === 0
    ? Math.round(exaltedBase * 1.16)
    : uniqueArchetype === 3
      ? Math.round(exaltedBase * 1.1)
      : exaltedBase;

  return {
    primary: {
      id: `${def.definitionId}:primary`,
      label: 'Primary',
      name: `${motif} ${primaryAction}`,
      description: 'Core Angel attack with stable cooldown cadence.',
      baseOblivion: primaryTunedBase,
      cooldownCards: (3 + Math.min(2, Math.floor((weight + summonPressure) / 4))) + (uniqueArchetype === 1 ? -1 : 0),
      tags: ['angel', 'primary', def.element.toLowerCase(), ...familyTags(def.definitionId)],
    },
    exalted: {
      id: `${def.definitionId}:exalted`,
      label: 'Exalted',
      name: `${motif} ${exaltedAction}`,
      description: 'High-impact finisher that requires an additional cost.',
      baseOblivion: exaltedTunedBase,
      cooldownCards: (5 + Math.min(3, Math.floor((weight + summonPressure) / 3))) + (uniqueArchetype === 0 ? 1 : 0),
      costs: [dominantCost, ...(secondaryCost ? [secondaryCost] : [])],
      tags: ['angel', 'exalted', 'finisher', def.element.toLowerCase(), ...familyTags(def.definitionId)],
    },
  };
}

function dominantAngelCostForElement(element: string, value: number): AttackCost {
  switch (element) {
    case 'Light':
      return { type: 'spend_radiance', value };
    case 'Fire':
      return { type: 'spend_embers', value };
    case 'Thornbound':
      return { type: 'spend_trail', value: Math.max(2, value - 1) };
    case 'Mechanical':
      return { type: 'spend_strain', value: Math.max(2, value - 1) };
    default:
      return { type: 'discard_from_hand', value: Math.max(1, Math.floor(value / 3)) };
  }
}

function parseAttackCostsFromDescription(description: string): AttackCost[] {
  const match = description.match(/cost:\s*([^.]*)/i);
  if (!match || !match[1]) return [];

  const clauses = match[1].split(',').map(part => part.trim()).filter(Boolean);
  const parsed: AttackCost[] = [];

  for (const clause of clauses) {
    const discard = clause.match(/^discard\s+(\d+)\s+cards?$/i);
    if (discard) {
      parsed.push({ type: 'discard_from_hand', value: Number(discard[1]) });
      continue;
    }

    const sacrificeSeraphim = clause.match(/^sacrifice\s+(\d+)\s+seraphims?$/i);
    if (sacrificeSeraphim) {
      parsed.push({ type: 'sacrifice_seraphim', value: Number(sacrificeSeraphim[1]) });
      continue;
    }

    const sacrificeAngel = clause.match(/^sacrifice\s+(\d+)\s+angels?$/i);
    if (sacrificeAngel) {
      parsed.push({ type: 'sacrifice_angel', value: Number(sacrificeAngel[1]) });
      continue;
    }

    const spend = clause.match(/^spend\s+(\d+)\s+(.+)$/i);
    if (spend) {
      const value = Number(spend[1]);
      const resource = spend[2].trim().toLowerCase();
      if (resource === 'ember' || resource === 'embers') {
        parsed.push({ type: 'spend_embers', value });
        continue;
      }
      if (resource === 'radiance' || resource === 'radiances') {
        parsed.push({ type: 'spend_radiance', value });
        continue;
      }
      if (resource === 'trail' || resource === 'trails') {
        parsed.push({ type: 'spend_trail', value });
        continue;
      }
      if (resource === 'strain' || resource === 'strains') {
        parsed.push({ type: 'spend_strain', value });
        continue;
      }
    }
  }

  if (parsed.length === 0) return parsed;

  const merged = new Map<AttackCost['type'], number>();
  for (const cost of parsed) {
    merged.set(cost.type, (merged.get(cost.type) ?? 0) + cost.value);
  }

  return Array.from(merged.entries()).map(([type, value]) => ({ type, value }));
}

function resolveAttackCosts(
  authoredCosts: AttackCost[] | undefined,
  description: string,
  fallbackCosts: AttackCost[] = [],
): AttackCost[] {
  if ((authoredCosts?.length ?? 0) > 0) return authoredCosts ?? [];
  const parsedCosts = parseAttackCostsFromDescription(description);
  if (parsedCosts.length > 0) return parsedCosts;
  return fallbackCosts;
}

function isStackingResourceCost(type: AttackCost['type']): boolean {
  return type === 'spend_embers'
    || type === 'spend_radiance'
    || type === 'spend_trail'
    || type === 'spend_strain';
}

function tuneResourceCostAttackPressure<T extends { baseOblivion: number; costs?: AttackCost[] }>(attack: T): T {
  const costs = attack.costs ?? [];
  const hasDiscardCost = costs.some(cost => cost.type === 'discard_from_hand');
  const hasStackingResourceCost = costs.some(cost => isStackingResourceCost(cost.type));

  // Only scale attacks that have no discard tax and instead spend stacking resources.
  if (hasDiscardCost || !hasStackingResourceCost) return attack;

  const boostedCosts = costs.map(cost => (
    isStackingResourceCost(cost.type)
      ? { ...cost, value: cost.value + 8 }
      : cost
  ));

  return {
    ...attack,
    baseOblivion: Math.round(attack.baseOblivion * 1.15),
    costs: boostedCosts,
  };
}

function firstSeraphimCostForDefinition(def: SeraphimDefinition, weight: number): AttackCost[] {
  const variant = archetypeIndex(def.definitionId, 5);
  const boost = hashString(`${def.definitionId}:first-cost`) % 2;

  const dominantResourceCost: AttackCost = (() => {
    const baseValue = 1 + Math.floor(Math.max(0, weight - 1 + boost) / 4);
    switch (def.element) {
      case 'Light':
        return { type: 'spend_radiance', value: baseValue };
      case 'Fire':
        return { type: 'spend_embers', value: baseValue };
      case 'Thornbound':
        return { type: 'spend_trail', value: baseValue };
      case 'Mechanical':
        return { type: 'spend_strain', value: baseValue };
      case 'Prismatic':
        return (hashString(`${def.definitionId}:prismatic-choice`) % 2 === 0)
          ? { type: 'spend_radiance', value: baseValue }
          : { type: 'spend_embers', value: baseValue };
      default:
        return { type: 'discard_from_hand', value: 1 };
    }
  })();

  const discardCost: AttackCost = { type: 'discard_from_hand', value: 1 };

  switch (variant) {
    case 0:
      return [dominantResourceCost];
    case 1:
      return dominantResourceCost.type === 'discard_from_hand'
        ? [discardCost]
        : [dominantResourceCost, discardCost];
    case 2:
      return dominantResourceCost.type === 'discard_from_hand'
        ? [discardCost]
        : [{ ...dominantResourceCost, value: dominantResourceCost.value + 1 }];
    case 3:
      return [discardCost];
    default:
      return dominantResourceCost.type === 'discard_from_hand'
        ? [discardCost]
        : [discardCost, dominantResourceCost];
  }
}

function buildSeraphimAttackDescription(
  def: SeraphimDefinition,
  attackName: string,
  mode: 'unsynergized' | 'synergized',
): string {
  const motifs = ELEMENT_MOTIFS[def.element.toLowerCase()] ?? ['Rift'];
  const motif = pickByHash(motifs, `${def.definitionId}:${mode}:motif`);
  const unsynergizedTemplates = [
    `${attackName} tears a steady ${motif.toLowerCase()} seam and keeps your pressure alive between finishers.`,
    `${attackName} drives a disciplined ${motif.toLowerCase()} cut that sustains tempo and sets up your next line.`,
    `${attackName} opens with a precise ${motif.toLowerCase()} strike, trading flash for ruthless consistency.`,
  ];
  const synergizedTemplates = [
    `${attackName} answers an Angel's command and detonates a ${motif.toLowerCase()} verdict across the front line.`,
    `${attackName} channels your Angel's presence into a towering ${motif.toLowerCase()} execution.`,
    `${attackName} binds to angelic authority and unleashes a ${motif.toLowerCase()} cataclysm worthy of a closer.`,
  ];

  return mode === 'unsynergized'
    ? pickByHash(unsynergizedTemplates, `${def.definitionId}:${attackName}:unsyn:desc`)
    : pickByHash(synergizedTemplates, `${def.definitionId}:${attackName}:syn:desc`);
}

function buildAngelAttackDescription(
  def: AngelDefinition,
  attackName: string,
  mode: 'primary' | 'exalted',
): string {
  const motifs = ELEMENT_MOTIFS[def.element.toLowerCase()] ?? ['Radiant'];
  const motif = pickByHash(motifs, `${def.definitionId}:${mode}:motif`);
  const primaryTemplates = [
    `${attackName} carves a commanding ${motif.toLowerCase()} line to keep your offense stable and threatening.`,
    `${attackName} delivers a measured ${motif.toLowerCase()} decree that maintains momentum without overcommitting.`,
    `${attackName} is your reliable ${motif.toLowerCase()} strike, ideal for pacing chain growth into a finisher.`,
  ];
  const exaltedTemplates = [
    `${attackName} spends sacred reserves to collapse the field under a ${motif.toLowerCase()} judgment.`,
    `${attackName} is an altar-breaking ${motif.toLowerCase()} finisher meant to end contested turns in one blow.`,
    `${attackName} burns costly offerings to release a throne-level ${motif.toLowerCase()} annihilation.`,
  ];

  return mode === 'primary'
    ? pickByHash(primaryTemplates, `${def.definitionId}:${attackName}:primary:desc`)
    : pickByHash(exaltedTemplates, `${def.definitionId}:${attackName}:exalted:desc`);
}

function tuneSeraphimAttackSet(def: SeraphimDefinition, attacks: SeraphimAttackSet): SeraphimAttackSet {
  const weight = rarityWeight(def.rarity);
  const unsynBaseMin = 90 + weight * 22;
  const synBaseMin = 185 + weight * 48;

  let unsynBase = Math.max(unsynBaseMin, attacks.unsynergized.baseOblivion);
  let synBase = Math.max(
    synBaseMin,
    attacks.synergized.baseOblivion,
    Math.round(unsynBase * 1.75),
  );

  let unsynCooldown = clampNumber(attacks.unsynergized.cooldownCards, 1, 4);
  let synCooldown = clampNumber(attacks.synergized.cooldownCards, 3, 7);

  // Align attack profile with passive identity so each Seraphim feels purposeful.
  switch (def.baseStats.bonusType) {
    case 'ophanim_bonus':
      break;
    case 'cherubim_extra_plays':
    case 'cherubim_expire_bonus':
      unsynCooldown = Math.max(1, unsynCooldown - 1);
      synCooldown = Math.max(3, synCooldown - 1);
      break;
    case 'oblivion_per_card':
      break;
    default:
      break;
  }

  // Set identity tuning across all Seraphims (Eternal/Infinite remain universal by request).
  if (def.rarity !== 'Eternal' && def.rarity !== 'Infinite') {
    switch (def.element) {
      case 'Fire':
        unsynBase = Math.round(unsynBase * 1.08);
        synBase = Math.round(synBase * 1.05);
        unsynCooldown = Math.max(1, unsynCooldown - 1);
        break;
      case 'Thornbound':
        synBase = Math.round(synBase * 1.12);
        synCooldown = Math.min(7, synCooldown + 1);
        break;
      case 'Mechanical':
        unsynBase = Math.round(unsynBase * 0.96);
        unsynCooldown = Math.max(1, unsynCooldown - 1);
        synCooldown = Math.max(3, synCooldown - 1);
        break;
      case 'Prismatic':
        unsynBase = Math.round(unsynBase * 0.95);
        synBase = Math.round(synBase * 0.97);
        break;
      case 'Light':
        break;
      case 'Dark':
        unsynBase = Math.round(unsynBase * 1.03);
        synBase = Math.round(synBase * 1.1);
        break;
      default:
        break;
    }
  }

  const tunedUnsynergizedCosts = resolveAttackCosts(
    attacks.unsynergized.costs,
    attacks.unsynergized.description,
    firstSeraphimCostForDefinition(def, weight),
  );
  const tunedSynergizedCosts = resolveAttackCosts(attacks.synergized.costs, attacks.synergized.description);

  // Global pacing pass: all Seraphim attacks now fire slightly slower.
  unsynCooldown = Math.min(6, unsynCooldown + 1);
  synCooldown = Math.min(9, synCooldown + 1);
  synCooldown = Math.max(synCooldown, unsynCooldown + 1);

  const tunedUnsynergizedAttack = tuneResourceCostAttackPressure({
    ...attacks.unsynergized,
    description: buildSeraphimAttackDescription(def, attacks.unsynergized.name, 'unsynergized'),
    baseOblivion: unsynBase,
    cooldownCards: unsynCooldown,
    costs: tunedUnsynergizedCosts,
  });

  const tunedSynergizedAttack = tuneResourceCostAttackPressure({
    ...attacks.synergized,
    description: buildSeraphimAttackDescription(def, attacks.synergized.name, 'synergized'),
    baseOblivion: synBase,
    cooldownCards: synCooldown,
    costs: tunedSynergizedCosts,
    requiresAngelOnBoard: true,
  });

  return {
    unsynergized: tunedUnsynergizedAttack,
    synergized: tunedSynergizedAttack,
  };
}

function tuneAngelAttackSet(def: AngelDefinition, attacks: AngelAttackSet): AngelAttackSet {
  const weight = rarityWeight(def.rarity);
  const summonPressure = def.summonCost.length + (def.extraSummonConditions?.length ?? 0);
  const primaryBaseMin = 170 + weight * 38 + summonPressure * 8;
  const exaltedBaseMin = Math.round(primaryBaseMin * 2) + summonPressure * 12;

  const primaryBase = Math.max(primaryBaseMin, attacks.primary.baseOblivion);
  const exaltedBase = Math.max(
    exaltedBaseMin,
    attacks.exalted.baseOblivion,
    Math.round(primaryBase * 1.95),
  );

  const primaryCooldown = clampNumber(attacks.primary.cooldownCards, 2, 5);
  const exaltedCooldown = Math.max(
    primaryCooldown + 2,
    clampNumber(attacks.exalted.cooldownCards, 4, 8),
  );

  const tunedPrimaryCosts = resolveAttackCosts(attacks.primary.costs, attacks.primary.description);
  const tunedExaltedCosts = resolveAttackCosts(
    attacks.exalted.costs,
    attacks.exalted.description,
    [dominantAngelCostForElement(def.element, 2 + Math.min(6, weight + Math.floor(summonPressure / 2)))],
  );

  const tunedPrimaryAttack = tuneResourceCostAttackPressure({
    ...attacks.primary,
    description: buildAngelAttackDescription(def, attacks.primary.name, 'primary'),
    baseOblivion: primaryBase,
    cooldownCards: primaryCooldown,
    costs: tunedPrimaryCosts,
  });

  const tunedExaltedAttack = tuneResourceCostAttackPressure({
    ...attacks.exalted,
    description: buildAngelAttackDescription(def, attacks.exalted.name, 'exalted'),
    baseOblivion: exaltedBase,
    cooldownCards: exaltedCooldown,
    costs: tunedExaltedCosts,
  });

  return {
    primary: tunedPrimaryAttack,
    exalted: tunedExaltedAttack,
  };
}

function deriveCherubimAttackBuff(def: CherubimDefinition): CherubimPassiveEffect[] {
  // Cards whose identity IS the global oblivion multiplier don't receive synthetic attack buffs.
  if (def.effects.some(e => e.type === 'cherubim_global_oblivion_mult')) {
    return def.effects;
  }

  let baseOblivion = 0;
  let multiplier = 1;

  for (const effect of def.effects) {
    switch (effect.type) {
      case 'cherubim_adjacent_seraphim_bonus':
        if (effect.bonusType === 'oblivion') baseOblivion += Math.round(effect.value * 0.9);
        break;
      case 'cherubim_oblivion_per_card':
      case 'cherubim_ophanim_bonus':
        baseOblivion += effect.value;
        break;
      case 'cherubim_seraphim_amp':
        multiplier *= Math.max(1, effect.value);
        break;
      case 'cherubim_conditional_buff':
        multiplier *= Math.max(1, effect.value);
        break;
      default:
        break;
    }
  }

  const weight = rarityWeight(def.rarity);
  if (baseOblivion <= 0) baseOblivion = 16 + weight * 10;

  const family = primaryFamily(def.definitionId);
  const relatedSeraphim = findRelatedUnitIds('Seraphim', def.element, family, 8);
  const relatedAngels = findRelatedUnitIds('Angel', def.element, family, 5);
  const uniqueArchetype = archetypeIndex(def.definitionId, 5);

  const existingBuffs = def.effects.filter(
    (effect): effect is Extract<CherubimPassiveEffect, { type: 'cherubim_attack_buff' }> => effect.type === 'cherubim_attack_buff',
  );

  if (existingBuffs.length > 0) {
    return def.effects.map(effect => {
      if (effect.type !== 'cherubim_attack_buff') return effect;
      return {
        ...effect,
        targetDefinitionIds: effect.targetDefinitionIds && effect.targetDefinitionIds.length > 0
          ? effect.targetDefinitionIds
          : (effect.targetUnitType === 'Angel' ? relatedAngels : effect.targetUnitType === 'Seraphim' ? relatedSeraphim : [...relatedSeraphim, ...relatedAngels]),
        targetTags: effect.targetTags && effect.targetTags.length > 0
          ? effect.targetTags
          : [def.element.toLowerCase(), ...familyTags(def.definitionId)],
      };
    });
  }

  // Per-card uniqueness: each Cherubim emphasizes a different support pattern.
  let tunedBase = Math.round(baseOblivion);
  let tunedMultiplier = Number(multiplier.toFixed(3));
  let tunedCooldownDelta = weight >= 5 ? -1 : 0;
  let targetUnit: 'Seraphim' | 'Angel' | 'Any' = 'Seraphim';

  switch (uniqueArchetype) {
    case 0: // Frontline accelerator
      tunedBase = Math.round(tunedBase * 1.18);
      tunedCooldownDelta = Math.min(tunedCooldownDelta, -1);
      targetUnit = 'Seraphim';
      break;
    case 1: // Celestial conductor
      targetUnit = 'Angel';
      break;
    case 2: // Universal linker
      tunedBase = Math.round(tunedBase * 0.92);
      targetUnit = 'Any';
      break;
    case 3: // Amplifier
      tunedMultiplier = Number((1 + (tunedMultiplier - 1) * 1.35).toFixed(3));
      targetUnit = 'Seraphim';
      break;
    default: // Hybrid anchor
      tunedBase = Math.round(tunedBase * 1.05);
      targetUnit = 'Any';
      break;
  }

  const targetIds = targetUnit === 'Angel'
    ? relatedAngels
    : targetUnit === 'Seraphim'
      ? relatedSeraphim
      : [...relatedSeraphim, ...relatedAngels];

  const attackBuff: CherubimPassiveEffect = {
    type: 'cherubim_attack_buff',
    targetUnitType: targetUnit,
    targetDefinitionIds: targetIds,
    targetTags: [def.element.toLowerCase(), family],
    bonusBaseOblivion: tunedBase,
    cooldownDeltaCards: tunedCooldownDelta,
    multiplier: tunedMultiplier,
  };

  const angelAttackBuff: CherubimPassiveEffect = {
    type: 'cherubim_attack_buff',
    targetUnitType: 'Angel',
    targetDefinitionIds: relatedAngels,
    targetTags: [def.element.toLowerCase(), family, 'angel'],
    bonusBaseOblivion: Math.round(tunedBase * 0.78),
    cooldownDeltaCards: weight >= 4 ? -1 : 0,
    multiplier: Number((1 + (tunedMultiplier - 1) * 0.75).toFixed(3)),
  };

  const derived = weight >= 3 ? [attackBuff, angelAttackBuff] : [attackBuff];
  return [...def.effects, ...derived];
}

function hasOphanimUtilityEffect(def: OphanimDefinition): boolean {
  return def.effects.some(effect =>
    effect.type === 'draw'
    || effect.type === 'discard_draw'
    || effect.type === 'look_top_take'
    || effect.type === 'look_top_take_drop'
    || effect.type === 'look_top_take_type'
    || effect.type === 'search_deck_by_type'
    || effect.type === 'salvage_by_type'
    || effect.type === 'salvage_any'
    || effect.type === 'shuffle_discard',
  );
}

function injectOphanimUtility(def: OphanimDefinition): OphanimDefinition {
  if (hasOphanimUtilityEffect(def)) return def;

  const weight = rarityWeight(def.rarity);
  const utilityArchetype = archetypeIndex(def.definitionId, 5);
  const extraEffects = [] as OphanimDefinition['effects'];

  switch (utilityArchetype) {
    case 0:
      extraEffects.push({ type: 'draw', value: 1 + (weight >= 4 ? 1 : 0) });
      break;
    case 1:
      extraEffects.push({ type: 'draw', value: 1 + (weight >= 4 ? 1 : 0) });
      break;
    case 2:
      extraEffects.push({ type: 'shuffle_discard' });
      extraEffects.push({ type: 'draw', value: 1 });
      break;
    case 3:
      extraEffects.push({ type: 'multiply_next' });
      extraEffects.push({ type: 'draw', value: weight >= 5 ? 2 : 1 });
      break;
    default:
      extraEffects.push({ type: 'prismatic_light_gain', value: 2 + Math.min(4, weight) });
      extraEffects.push({ type: 'draw', value: 1 });
      break;
  }

  return {
    ...def,
    effects: [...def.effects, ...extraEffects],
  };
}

const NEUTRALITY_REWORK_IDS = new Set<string>([
  'inf-oblivion-absolute',
  'inf-void-cascade',
  'inf-genesis-throne',
  'inf-null-apex',
  'inf-entropic-crown',
  'inf-annihilation-field',
  'inf-sovereign-void',
  'inf-eternity-rupture',
  'btei-voids-reaping',
  'btei-temporal-ruin',
  'btei-null-edict',
  'btei-axiom-of-oblivion',
  'btei-eternal-vigil',
  'btei-colossus-advent',
  'btei-sovereign-domain',
  'btei-architects-manifold',
  'btei-convergence-of-eternity',
  'btei-omniscient-fracture',
  'btei-neutrality-paradox-crown',
  'btei-neutrality-zero-edict',
  'btei-neutrality-void-throne',
  'btei-neutrality-axiom-maw',
  'btei-neutrality-prime-equilibrium',
  'btei-prismatic-vorthum-edict',
  'btei-prismatic-fracture-archive',
  'inf-prismatic-axiom-rain',
  'inf-prismatic-collapse-lattice',
  'btei-light-sunbreak-canon',
  'btei-light-aureate-rapture',
  'btei-light-choir-imperator',
  'btei-light-halo-dominion',
  'btei-light-throne-of-morning',
  'inf-celestial-blackout',
  'inf-lucent-cataclysm-archon',
  'inf-heliarch-eclipse-engine',
  'btei-pyroabyss-cinder-cataclysm',
  'btei-pyroabyss-ashfall-engine',
  'btei-pyroabyss-infernal-archon',
  'btei-pyroabyss-hellrift-mandala',
  'btei-pyroabyss-oblivion-phoenix',
  'inf-ash-kings-apocalypse',
  'inf-pyraxis-colossus',
  'inf-pyroclasm-engine',
  'inf-riftborn-sovereign',
  'ser-fire-cinder',
  'ser-fire-abyssal',
  'ser-fire-pyre',
  'ser-fire-infernal',
  'ser-fire-voidflame',
  'ophanim-fire-cinder-draw',
  'ophanim-fire-abyssal-kindle',
  'ophanim-fire-pyre-ignite',
  'ophanim-fire-infernal-surge',
  'ophanim-fire-void-kindling',
  'ophanim-fire-void-flare',
  'ophanim-fire-smoldering-cycle',
  'ophanim-fire-abyssal-recall',
  'ophanim-fire-flame-burst',
  'ophanim-fire-abyssal-detonation',
  'ophanim-fire-pyroclast',
  'ophanim-fire-ember-threshold',
  'ophanim-fire-conflagration',
  'ophanim-fire-pyre-hunt',
  'ophanim-fire-ember-chain',
  'ophanim-fire-void-combustion',
  'ophanim-fire-inferno',
  'ophanim-fire-void-apocalypse',
  'cherubim-fire-ember-shroud',
  'cherubim-fire-abyssal-veil',
  'cherubim-fire-pyre-mantle',
  'cherubim-fire-infernal-ward',
  'cherubim-fire-void-cinder-shell',
  'cherubim-fire-flame-fortify',
  'cherubim-fire-abyss-amp',
  'angel-fire-cinderwing',
  'angel-fire-pyroclast-wraith',
  'angel-fire-obliteron',
  'ga-et-lattice-archive-seraph',
  'ga-et-angled-infinity',
  'ga-et-first-white',
  'ga-et-center-everywhere',
  'ga-et-perfect-refraction',
  'ga-inf-glass-absolute',
  'ga-inf-refracted-sovereign',
  'ga-inf-yreth-prism-at-center',
  'ga-inf-chorus-unbroken-spectrum',
  'ga-inf-shattered-without-shattering',
  'ga-inf-color-after-white',
  // Snowbound Voltage Eternal/Infinite reworks (typed snowbound_* / arctic_charge_* effects in
  // src/data/cards/eternalCards.ts + infiniteCards.ts must bypass materializedCardBalance stubs).
  'sv-eternal-frost-charge',
  'sv-eternal-aurora-battery',
  'sv-eternal-glacier-signal',
  'sv-eternal-white-static',
  'sv-eternal-sleet-choir',
  'sv-infinite-polar-fission',
  'sv-infinite-neon-snowfall',
  'sv-infinite-crystal-storm',
  'sv-infinite-black-ice-throne',
  'sv-infinite-aurora-collapse',
]);

function shouldKeepSourceDefinition(definitionId: string): boolean {
  if (NEUTRALITY_REWORK_IDS.has(definitionId)) return true;
  // Infinite reward cards must execute the exact source-defined effects so UI text matches behavior.
  if (definitionId.startsWith('inf-')) return true;
  // Defensive catch-all: any future Snowbound Eternal/Infinite IDs should keep authored effects.
  if (definitionId.startsWith('sv-eternal-')) return true;
  if (definitionId.startsWith('sv-infinite-')) return true;
  if (definitionId.startsWith('btei-bgi-')) return true;
  if (definitionId.startsWith('inf-bgi-')) return true;
  if (definitionId.startsWith('btei-pyroabyss-')) return true;
  if (definitionId.startsWith('btei-light-')) return true;
  if (definitionId.startsWith('btei-thornbound-')) return true;
  if (definitionId.startsWith('dfh-')) return true;
  if (definitionId.startsWith('af-')) return true;
  if (definitionId.startsWith('wuas-')) return true;
  if (definitionId.startsWith('inf-wuas-')) return true;
  return false;
}

function normalizeDefinition(def: CardDefinition): CardDefinition {
  if (shouldKeepSourceDefinition(def.definitionId)) {
    return def;
  }
  const materialized = MATERIALIZED_CARD_BALANCE[def.definitionId as keyof typeof MATERIALIZED_CARD_BALANCE];

  if (def.type === 'Seraphim') {
    const seraphim = def as SeraphimDefinition;
    if (materialized?.type === 'Seraphim') {
      const tunedAttacks = tuneSeraphimAttackSet(seraphim, materialized.attacks as unknown as SeraphimAttackSet);
      return {
        ...seraphim,
        attacks: tunedAttacks,
        attackTags: [...materialized.attackTags],
      };
    }
    const tunedAttacks = tuneSeraphimAttackSet(seraphim, seraphim.attacks ?? buildSeraphimAttacks(seraphim));
    return {
      ...seraphim,
      attacks: tunedAttacks,
      attackTags: seraphim.attackTags ?? [seraphim.element.toLowerCase(), ...familyTags(seraphim.definitionId)],
    };
  }

  if (def.type === 'Angel') {
    const angel = def as AngelDefinition;
    if (materialized?.type === 'Angel') {
      const tunedAttacks = tuneAngelAttackSet(angel, materialized.attacks as unknown as AngelAttackSet);
      return {
        ...angel,
        attacks: tunedAttacks,
        attackTags: [...materialized.attackTags],
      };
    }
    const tunedAttacks = tuneAngelAttackSet(angel, angel.attacks ?? buildAngelAttacks(angel));
    return {
      ...angel,
      attacks: tunedAttacks,
      attackTags: angel.attackTags ?? [angel.element.toLowerCase(), ...familyTags(angel.definitionId)],
    };
  }

  if (def.type === 'Cherubim') {
    const cherubim = def as CherubimDefinition;
    if (materialized?.type === 'Cherubim') {
      return {
        ...cherubim,
        effects: materialized.effects as unknown as CherubimPassiveEffect[],
      };
    }
    return {
      ...cherubim,
      effects: deriveCherubimAttackBuff(cherubim),
    };
  }

  if (def.type === 'Ophanim') {
    if (materialized?.type === 'Ophanim') {
      return {
        ...(def as OphanimDefinition),
        effects: materialized.effects as unknown as OphanimDefinition['effects'],
      };
    }
    return injectOphanimUtility(def as OphanimDefinition);
  }

  return def;
}

function registerAll(defs: CardDefinition[]): void {
  for (const def of defs) {
    const normalized = normalizeDefinition(def);
    registry.set(normalized.definitionId, normalized);
  }
}

function formatDisplayAttackCost(cost: AttackCost): string {
  switch (cost.type) {
    case 'discard_from_hand':
      return `discard ${cost.value} card${cost.value === 1 ? '' : 's'}`;
    case 'sacrifice_seraphim':
      return `sacrifice ${cost.value} Seraphim`;
    case 'sacrifice_angel':
      return `sacrifice ${cost.value} Angel`;
    case 'spend_embers':
      return `spend ${cost.value} Ember${cost.value === 1 ? '' : 's'}`;
    case 'spend_radiance':
      return `spend ${cost.value} Radiance`;
    case 'spend_trail':
      return `spend ${cost.value} Trail`;
    case 'spend_strain':
      return `spend ${cost.value} Strain`;
  }
}

function buildDisplayAttackDescription(attack: {
  baseOblivion: number;
  cooldownCards: number;
  costs?: ReadonlyArray<AttackCost>;
  requiresAngelOnBoard?: boolean;
}): string {
  const angelText = attack.requiresAngelOnBoard ? ' · Requires Angel' : '';
  const costText = attack.costs && attack.costs.length > 0
    ? ` · Cost: ${attack.costs.map(formatDisplayAttackCost).join(', ')}`
    : '';
  return `${attack.baseOblivion} base Oblivion · ${attack.cooldownCards} cards cooldown${angelText}${costText}`;
}

function displayCardDefinition(def: CardDefinition): CardDefinition {
  const displayDef = {
    ...def,
    name: formatDisplayCardText(def.name),
    description: formatDisplayCardText(def.description),
  } as CardDefinition;

  if (def.type === 'Seraphim' && def.attacks) {
    return {
      ...displayDef,
      attacks: {
        unsynergized: {
          ...def.attacks.unsynergized,
          name: formatDisplayCardText(def.attacks.unsynergized.name),
          description: formatDisplayCardText(buildDisplayAttackDescription(def.attacks.unsynergized)),
        },
        synergized: {
          ...def.attacks.synergized,
          name: formatDisplayCardText(def.attacks.synergized.name),
          description: formatDisplayCardText(buildDisplayAttackDescription(def.attacks.synergized)),
        },
      },
    } as CardDefinition;
  }

  if (def.type === 'Angel') {
    return {
      ...displayDef,
      activatedAbility: def.activatedAbility ? {
        ...def.activatedAbility,
        name: formatDisplayCardText(def.activatedAbility.name),
        description: formatDisplayCardText(def.activatedAbility.description),
      } : def.activatedAbility,
      attacks: def.attacks ? {
        primary: {
          ...def.attacks.primary,
          name: formatDisplayCardText(def.attacks.primary.name),
          description: formatDisplayCardText(buildDisplayAttackDescription(def.attacks.primary)),
        },
        exalted: {
          ...def.attacks.exalted,
          name: formatDisplayCardText(def.attacks.exalted.name),
          description: formatDisplayCardText(buildDisplayAttackDescription(def.attacks.exalted)),
        },
      } : def.attacks,
    } as CardDefinition;
  }

  return displayDef;
}

registerAll(SOURCE_DEFINITIONS);

ScoreSystem.getDefinition = (id: string) => registry.get(resolveCardId(id));

export const CardRegistry = {
  get: (id: string): CardDefinition | undefined => {
    const def = registry.get(resolveCardId(id));
    return def ? displayCardDefinition(def) : undefined;
  },
  getAll: (): CardDefinition[] => Array.from(registry.values()).map(displayCardDefinition),
  getByType: (type: CardDefinition['type']): CardDefinition[] =>
    Array.from(registry.values()).filter(d => d.type === type).map(displayCardDefinition),
  has: (id: string): boolean => registry.has(resolveCardId(id)),
};

