import type {
  AngelAttackSet,
  AngelDefinition,
  AttackCost,
  CardDefinition,
  CardRarity,
  CherubimDefinition,
  OphanimDefinition,
  SummonCondition,
  SeraphimAttackSet,
  SeraphimDefinition,
} from '@/types/cards';
import type { CherubimPassiveEffect, CardEffect } from '@/types/effects';
import { neutralityAngels } from '../data/cards/neutralityAngel';
import { neutralityCards } from '../data/cards/neutralityCards';
import { neutralityCherubimCards } from '../data/cards/neutralityCherubimCards';
import { eternalCards } from '../data/cards/eternalCards';
import { infiniteCards } from '../data/cards/infiniteCards';
import { NEUTRALITY_DOC_OVERRIDES } from '../data/cards/neutralityDocOverrides';
import { transcendentCardDefinitions } from '../data/ascension/transcendentCards';
import { SET_ACCENT } from '../data/elements';
import { MATERIALIZED_CARD_BALANCE } from '../data/cards/materializedCardBalance';
import { ScoreSystem } from '../systems/scoring/ScoreSystem';
import { formatDisplayCardText } from '../ui/preferences';

const registry = new Map<string, CardDefinition>();

const CARD_ID_ALIASES: Record<string, string> = {
};

function resolveCardId(id: string): string {
  return CARD_ID_ALIASES[id] ?? id;
}

const SOURCE_DEFINITIONS: CardDefinition[] = [
  ...(neutralityAngels as unknown as CardDefinition[]),
  ...(neutralityCards as unknown as CardDefinition[]),
  ...(neutralityCherubimCards as unknown as CardDefinition[]),
  ...(eternalCards as unknown as CardDefinition[]),
  ...(infiniteCards as unknown as CardDefinition[]),
  ...(transcendentCardDefinitions as unknown as CardDefinition[]),
];

const ELEMENT_MOTIFS: Record<string, string[]> = {
  neutrality: ['Null', 'Axiom', 'Paradox', 'Stillness', 'Void'],
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

const CARD_RARITY_RANK: Record<CardRarity, number> = {
  Common: 0,
  Rare: 1,
  Epic: 2,
  Legendary: 3,
  Eternal: 4,
  Infinite: 5,
};

function angelTierRank(def: Pick<CardDefinition, 'definitionId' | 'rarity'>): number {
  if (def.definitionId.startsWith('tx-')) return 6;
  return CARD_RARITY_RANK[def.rarity];
}

function seraphimTierRank(def: Pick<SeraphimDefinition, 'rarity'>): number {
  return CARD_RARITY_RANK[def.rarity];
}

const sourceSeraphim = SOURCE_DEFINITIONS.filter(def => def.type === 'Seraphim') as SeraphimDefinition[];
const sourceAngels = SOURCE_DEFINITIONS.filter(def => def.type === 'Angel') as AngelDefinition[];
const sourceDefinitionsById = new Map(SOURCE_DEFINITIONS.map(def => [def.definitionId, def] as const));
const RESERVED_HIGH_TIER_SUMMON_FINGERPRINTS = new Map<string, string>();

for (const angel of sourceAngels) {
  const isHighTier = angel.rarity === 'Eternal' || angel.rarity === 'Infinite';
  if (isHighTier || angel.summonCost.length === 0) continue;
  const fingerprint = [...angel.summonCost].sort().join('|');
  RESERVED_HIGH_TIER_SUMMON_FINGERPRINTS.set(fingerprint, angel.definitionId);
}

function findRelatedUnitIds(
  unitType: 'Seraphim' | 'Angel',
  family: string,
  maxCount: number,
): string[] {
  const source = unitType === 'Seraphim' ? sourceSeraphim : sourceAngels;
  const exactFamily = source.filter(def => primaryFamily(def.definitionId) === family);
  const fallbackFamily = source.filter(def => primaryFamily(def.definitionId).startsWith(family.split('-')[0] ?? family));
  const merged = [...exactFamily, ...fallbackFamily, ...source]
    .filter((def, index, arr) => arr.findIndex(other => other.definitionId === def.definitionId) === index);
  return merged.slice(0, maxCount).map(def => def.definitionId);
}

function isSummonCostSetAligned(summonCost: ReadonlyArray<string>): boolean {
  if (summonCost.length === 0) return false;
  return summonCost.every((definitionId) => !!sourceDefinitionsById.get(definitionId));
}

function collectEffectTraitTokens(
  effects: ReadonlyArray<CardEffect | CherubimPassiveEffect> | undefined,
  into: Set<string>,
): void {
  if (!effects || effects.length === 0) return;

  for (const effect of effects) {
    const node = effect as unknown as {
      type?: string;
      stack?: string;
      kind?: string;
      targetUnitType?: string;
      filter?: string[];
      then?: CardEffect[];
      else?: CardEffect[];
    };

    if (typeof node.type === 'string') into.add(`type:${node.type}`);
    if (typeof node.stack === 'string') into.add(`stack:${node.stack}`);
    if (typeof node.kind === 'string') into.add(`kind:${node.kind}`);
    if (typeof node.targetUnitType === 'string') into.add(`target:${node.targetUnitType}`);
    if (Array.isArray(node.filter)) {
      for (const value of node.filter) {
        into.add(`filter:${String(value)}`);
      }
    }
    if (Array.isArray(node.then)) collectEffectTraitTokens(node.then, into);
    if (Array.isArray(node.else)) collectEffectTraitTokens(node.else, into);
  }
}

function extractCardTraitTokens(def: CardDefinition): Set<string> {
  const tokens = new Set<string>();
  tokens.add('set:neutrality');
  tokens.add(`accent:${SET_ACCENT}`);
  tokens.add(`family:${primaryFamily(def.definitionId)}`);

  switch (def.type) {
    case 'Seraphim':
      collectEffectTraitTokens(def.onPlayEffects, tokens);
      tokens.add(`seraphim-bonus:${def.baseStats.bonusType}`);
      break;
    case 'Cherubim':
      collectEffectTraitTokens(def.effects, tokens);
      collectEffectTraitTokens(def.onPlayEffects, tokens);
      break;
    case 'Ophanim':
      collectEffectTraitTokens(def.effects, tokens);
      break;
    case 'Angel':
      collectEffectTraitTokens(def.onSummonEffects, tokens);
      collectEffectTraitTokens(def.activatedAbility?.effects, tokens);
      tokens.add(`angel-bonus:${def.baseStats.bonusType}`);
      break;
  }

  return tokens;
}

function reserveSummonFingerprint(definitionId: string, summonCost: ReadonlyArray<string>): void {
  if (summonCost.length === 0) return;
  const fingerprint = [...summonCost].sort().join('|');
  RESERVED_HIGH_TIER_SUMMON_FINGERPRINTS.set(fingerprint, definitionId);
}

function pickHighTierMaterialCount(def: AngelDefinition, maxAvailable: number): number {
  const safeMax = Math.max(1, maxAvailable);
  const roll = hashString(`${def.definitionId}:material-count`) % 100;

  if (def.rarity === 'Infinite') {
    const desired = roll < 15 ? 2 : roll < 55 ? 3 : roll < 85 ? 4 : 5;
    return clampNumber(desired, 1, safeMax);
  }

  const desired = roll < 30 ? 1 : roll < 75 ? 2 : 3;
  return clampNumber(desired, 1, safeMax);
}

function conditionFingerprint(condition: SummonCondition): string {
  switch (condition.type) {
    case 'board_definition_gte':
      return `${condition.type}:${condition.definitionId}:${condition.value}`;
    default:
      return `${condition.type}:${condition.value}`;
  }
}

function pushUniqueSummonCondition(conditions: SummonCondition[], condition: SummonCondition): void {
  const fingerprint = conditionFingerprint(condition);
  if (!conditions.some(existing => conditionFingerprint(existing) === fingerprint)) {
    conditions.push(condition);
  }
}

function summarizePrimarySummonResourceGate(def: AngelDefinition): SummonCondition {
  const isInfinite = def.rarity === 'Infinite';
  const bump = hashString(def.definitionId) % 3;
  return { type: 'seraphim_on_board_gte', value: (isInfinite ? 4 : 3) + (bump % 2) };
}

function pickHighTierSupportDefinitionId(
  def: AngelDefinition,
  summonCost: ReadonlyArray<string>,
): string | undefined {
  const summonMaterialSet = new Set(summonCost);
  const family = primaryFamily(def.definitionId);
  const familyRoot = family.split('-')[0] ?? family;
  const pool = SOURCE_DEFINITIONS
    .filter(card => card.type === 'Seraphim' || card.type === 'Cherubim')
    .filter(card => !summonMaterialSet.has(card.definitionId));

  if (pool.length === 0) return undefined;

  const ranked = pool
    .map((card) => {
      let score = 0;
      const candidateFamily = primaryFamily(card.definitionId);
      if (candidateFamily === family) score += 100;
      else if (candidateFamily.startsWith(familyRoot)) score += 40;
      if (card.type === 'Seraphim') score += 15;
      return { definitionId: card.definitionId, score };
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      const hashDelta = hashString(`${def.definitionId}:${left.definitionId}:support`) - hashString(`${def.definitionId}:${right.definitionId}:support`);
      if (hashDelta !== 0) return hashDelta;
      return left.definitionId.localeCompare(right.definitionId);
    });

  return ranked[0]?.definitionId;
}

function buildHighTierAngelExtraConditions(def: AngelDefinition, summonCost: ReadonlyArray<string>): SummonCondition[] {
  const conditions: SummonCondition[] = [];
  const primaryGate = summarizePrimarySummonResourceGate(def);
  pushUniqueSummonCondition(conditions, primaryGate);

  const addSupportGate = () => {
    const supportDefinitionId = pickHighTierSupportDefinitionId(def, summonCost);
    if (!supportDefinitionId) return;
    pushUniqueSummonCondition(conditions, {
      type: 'board_definition_gte',
      definitionId: supportDefinitionId,
      value: 1,
    });
  };

  const materialCount = summonCost.length;
  if (materialCount <= 1) {
    pushUniqueSummonCondition(conditions, { type: 'seraphim_on_board_gte', value: def.rarity === 'Infinite' ? 4 : 3 });
    pushUniqueSummonCondition(conditions, { type: 'cherubim_active_gte', value: 1 + (hashString(`${def.definitionId}:solo-cherub`) % 2) });
    addSupportGate();
    return conditions;
  }

  if (materialCount === 2) {
    const profile = hashString(`${def.definitionId}:summon-profile-m2`) % 3;
    if (profile === 0) {
      pushUniqueSummonCondition(conditions, { type: 'seraphim_on_board_gte', value: 3 });
      addSupportGate();
    } else if (profile === 1) {
      pushUniqueSummonCondition(conditions, { type: 'cherubim_active_gte', value: 2 });
      addSupportGate();
    } else {
      pushUniqueSummonCondition(conditions, { type: 'seraphim_on_board_gte', value: 2 });
      pushUniqueSummonCondition(conditions, { type: 'cherubim_active_gte', value: 1 });
    }
    return conditions;
  }

  if (materialCount === 3) {
    const profile = hashString(`${def.definitionId}:summon-profile-m3`) % 3;
    if (profile === 0) {
      addSupportGate();
    } else if (profile === 1) {
      pushUniqueSummonCondition(conditions, { type: 'seraphim_on_board_gte', value: 2 });
    } else {
      pushUniqueSummonCondition(conditions, { type: 'cherubim_active_gte', value: 1 });
      addSupportGate();
    }
    return conditions;
  }

  const highProfile = hashString(`${def.definitionId}:summon-profile-high`) % 2;
  if (highProfile === 0) {
    pushUniqueSummonCondition(conditions, { type: 'seraphim_on_board_gte', value: 2 });
  } else {
    pushUniqueSummonCondition(conditions, { type: 'cherubim_active_gte', value: 1 });
  }

  return conditions;
}

function pickHighTierAngelMaterials(def: AngelDefinition): string[] {
  const allowedTier = angelTierRank(def);
  const family = primaryFamily(def.definitionId);
  const familyRoot = family.split('-')[0] ?? family;
  const angelTokens = extractCardTraitTokens(def);
  const allowedSeraphim = sourceSeraphim.filter(seraphim => seraphimTierRank(seraphim) <= allowedTier);
  const candidatePool = allowedSeraphim;
  const materialCount = pickHighTierMaterialCount(def, candidatePool.length);

  const ranked = candidatePool
    .map((seraphim) => {
      let score = 0;
      const seraphimFamily = primaryFamily(seraphim.definitionId);
      if (seraphimFamily === family) score += 120;
      else if (seraphimFamily.startsWith(familyRoot)) score += 40;

      const seraphimTokens = extractCardTraitTokens(seraphim);
      for (const token of angelTokens) {
        if (seraphimTokens.has(token)) score += 10;
      }

      score += seraphimTierRank(seraphim) * 2;
      return { definitionId: seraphim.definitionId, score };
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      const hashDelta = hashString(`${def.definitionId}:${left.definitionId}`) - hashString(`${def.definitionId}:${right.definitionId}`);
      if (hashDelta !== 0) return hashDelta;
      return left.definitionId.localeCompare(right.definitionId);
    });

  const maxStart = Math.max(0, ranked.length - materialCount);
  for (let start = 0; start <= maxStart; start++) {
    const candidate = ranked.slice(start, start + materialCount).map(entry => entry.definitionId);
    if (candidate.length < materialCount) continue;
    const fingerprint = [...candidate].sort().join('|');
    const existingOwner = RESERVED_HIGH_TIER_SUMMON_FINGERPRINTS.get(fingerprint);
    if (!existingOwner || existingOwner === def.definitionId) {
      RESERVED_HIGH_TIER_SUMMON_FINGERPRINTS.set(fingerprint, def.definitionId);
      return candidate;
    }
  }

  const fallback = ranked.slice(0, materialCount).map(entry => entry.definitionId);
  reserveSummonFingerprint(def.definitionId, fallback);
  return fallback;
}

function buildHighTierAngelSummonProfile(def: AngelDefinition): Pick<AngelDefinition, 'summonCost' | 'extraSummonConditions'> {
  const authoredSummonCost = [...def.summonCost];
  const authoredConditions = def.extraSummonConditions ? [...def.extraSummonConditions] : undefined;

  if (def.definitionId.startsWith('tx-')) {
    return {
      summonCost: authoredSummonCost,
      extraSummonConditions: authoredConditions,
    };
  }

  let finalSummonCost: string[] | null = null;

  if (authoredSummonCost.length > 0) {
    if (isSummonCostSetAligned(authoredSummonCost)) {
      const authoredFingerprint = [...authoredSummonCost].sort().join('|');
      const existingOwner = RESERVED_HIGH_TIER_SUMMON_FINGERPRINTS.get(authoredFingerprint);
      if (!existingOwner || existingOwner === def.definitionId) {
        reserveSummonFingerprint(def.definitionId, authoredSummonCost);
        finalSummonCost = authoredSummonCost;
      }
    }
  }

  if (!finalSummonCost) {
    finalSummonCost = pickHighTierAngelMaterials(def);
  }

  const generatedConditions = buildHighTierAngelExtraConditions(def, finalSummonCost);

  return {
    summonCost: finalSummonCost,
    extraSummonConditions: generatedConditions,
  };
}

function pruneRedundantSummonConditions(
  summonCost: ReadonlyArray<string>,
  extraSummonConditions: ReadonlyArray<NonNullable<AngelDefinition['extraSummonConditions']>[number]> | undefined,
): NonNullable<AngelDefinition['extraSummonConditions']> {
  const conditions = extraSummonConditions ?? [];
  if (conditions.length === 0) return [];

  const summonMaterialCounts = summonCost.reduce<Record<string, number>>((acc, definitionId) => {
    acc[definitionId] = (acc[definitionId] ?? 0) + 1;
    return acc;
  }, {});

  return conditions.filter((condition) => {
    if (condition.type === 'board_definition_gte') {
      const materialCopiesRequired = summonMaterialCounts[condition.definitionId] ?? 0;
      return materialCopiesRequired < condition.value;
    }

    return true;
  });
}

function motifFor(def: { definitionId: string }): string {
  const motifs = ELEMENT_MOTIFS['neutrality'] ?? ['Eclipse', 'Aether', 'Rift', 'Crown', 'Pulse'];
  return pickByHash(motifs, def.definitionId);
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
    case 2: // Burst scaler
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
      tags: ['seraphim', 'unsynergized', 'neutrality', ...familyTags(def.definitionId)],
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
      tags: ['seraphim', 'synergized', 'covenant', 'neutrality', ...familyTags(def.definitionId)],
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
  const uniqueArchetype = archetypeIndex(def.definitionId, 4);

  const dominantCost: AttackCost = { type: 'discard_from_hand', value: Math.max(1, Math.floor(weight / 2)) };

  // Secondary cost creates sought-after uniqueness between Angels.
  const archetype2Cost: AttackCost = { type: 'discard_from_hand' as const, value: 1 };
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
      tags: ['angel', 'primary', 'neutrality', ...familyTags(def.definitionId)],
    },
    exalted: {
      id: `${def.definitionId}:exalted`,
      label: 'Exalted',
      name: `${motif} ${exaltedAction}`,
      description: 'High-impact finisher that requires an additional cost.',
      baseOblivion: exaltedTunedBase,
      cooldownCards: (5 + Math.min(3, Math.floor((weight + summonPressure) / 3))) + (uniqueArchetype === 0 ? 1 : 0),
      costs: [dominantCost, ...(secondaryCost ? [secondaryCost] : [])],
      tags: ['angel', 'exalted', 'finisher', 'neutrality', ...familyTags(def.definitionId)],
    },
  };
}

function parseAttackCostsFromDescription(description: string): AttackCost[] {
  const match = description.match(/cost:\s*([^.]*)/i);
  if (!match || !match[1]) return [];

  const clauses = match[1].split(/[;,]/).map(part => part.trim().replace(/\.$/, '')).filter(Boolean);
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
      void spend[1];
      const resource = spend[2].trim().toLowerCase();
      if (resource === 'heat' || resource === 'heats' || resource === 'ember' || resource === 'embers') {
        // pyro_heat is a dead-set resource; skip
        continue;
      }
      if (resource === 'radiance' || resource === 'radiances') {
        // radiance is a dead-set resource; skip
        continue;
      }
      if (resource === 'trail' || resource === 'trails') {
        // trail is dead-set resource; skip
        continue;
      }
      if (resource === 'strain' || resource === 'strains') {
        // strain is dead-set resource; skip
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

function parseSubtypeFilterFromText(text: string): Array<'Seraphim' | 'Cherubim' | 'Ophanim' | 'Angel'> {
  const out: Array<'Seraphim' | 'Cherubim' | 'Ophanim' | 'Angel'> = [];
  const lowered = text.toLowerCase();
  if (lowered.includes('seraphim')) out.push('Seraphim');
  if (lowered.includes('cherubim')) out.push('Cherubim');
  if (lowered.includes('ophanim')) out.push('Ophanim');
  if (lowered.includes('angel')) out.push('Angel');
  return out;
}

function parseDocEffectClauses(text: string): CardEffect[] {
  const clauses = text
    .split(/;\s+/)
    .flatMap((part) => part.split(/\.\s+(?=[A-Z])/))
    .map((clause) => clause.trim().replace(/\.$/, ''))
    .filter(Boolean);

  const effects: CardEffect[] = [];

  for (const clause of clauses) {
    const plusOblivion = clause.match(/^\+(\d+)\s+Oblivion/i);
    if (plusOblivion) {
      effects.push({ type: 'oblivion_flat', value: Number(plusOblivion[1]) });
      continue;
    }

    const draw = clause.match(/^Draw\s+(\d+)\s+cards?/i);
    if (draw) {
      effects.push({ type: 'draw', value: Number(draw[1]) });
      continue;
    }

    const discard = clause.match(/^(?:Choose and )?discard\s+(\d+)\s+cards?/i);
    if (discard) {
      effects.push({ type: 'discard_choice', value: Number(discard[1]) });
      continue;
    }

    if (/^Shuffle discard into deck/i.test(clause)) {
      effects.push({ type: 'shuffle_discard' });
      continue;
    }

    const patienceGain = clause.match(/^All Seraphim on board gain\s+\+(\d+)\s+(?:additional\s+)?Patience/i);
    if (patienceGain) {
      effects.push({ type: 'patience_gain_all', value: Number(patienceGain[1]) });
      continue;
    }

    const patienceBump = clause.match(/^Increase all current Patience by\s+\+(\d+)/i);
    if (patienceBump) {
      effects.push({ type: 'patience_gain_all', value: Number(patienceBump[1]) });
      continue;
    }

    if (/^Double all Patience on the board/i.test(clause)) {
      effects.push({ type: 'patience_double_all' });
      continue;
    }

    const patientLight = clause.match(/^Grant\s+(\d+)\s+Patient Light\s+stacks?/i);
    if (patientLight) {
      effects.push({ type: 'neutrality_patient_light_gain', value: Number(patientLight[1]) });
      continue;
    }

    const preserve = clause.match(/Seraphim attacks preserve\s+(\d+(?:\.\d+)?)%\s+of consumed Patience/i);
    if (preserve) {
      effects.push({ type: 'neutrality_attack_preserve', percent: Number(preserve[1]) });
      continue;
    }

    const search = clause.match(/^Search\s+you?r?\s+deck\s+for\s+(?:up to\s+)?\d+\s+(.+)$/i);
    if (search) {
      const filter = parseSubtypeFilterFromText(search[1]);
      if (filter.length > 0) effects.push({ type: 'search_deck_by_type', filter });
      continue;
    }

    const salvageByType = clause.match(/^Salvage\s+\d+\s+(.+?)\s+cards?/i);
    if (salvageByType) {
      const filter = parseSubtypeFilterFromText(salvageByType[1]);
      if (filter.length > 0) {
        effects.push({ type: 'salvage_by_type', filter });
      } else if (/any/i.test(salvageByType[1])) {
        effects.push({ type: 'salvage_any' });
      }
      continue;
    }

    if (/^Salvage any\s+\d+\s+card/i.test(clause)) {
      effects.push({ type: 'salvage_any' });
      continue;
    }

    const lookTopDrop = clause.match(/^Look at the top\s+(\d+)\s+cards?.*take\s+(\d+)\s+cards?.*put\s+(\d+)\s+cards?\s+on\s+the\s+bottom/i);
    if (lookTopDrop) {
      effects.push({ type: 'look_top_take_drop', look: Number(lookTopDrop[1]), take: Number(lookTopDrop[2]), drop: Number(lookTopDrop[3]) });
      continue;
    }

    const lookTop = clause.match(/^Look at the top\s+(\d+)\s+cards?.*take\s+(\d+)\s+cards?/i);
    if (lookTop) {
      effects.push({ type: 'look_top_take', look: Number(lookTop[1]), take: Number(lookTop[2]) });
      continue;
    }

    const prismaticGain = clause.match(/^Gain\s+(\d+)\s+Prismatic Light/i);
    if (prismaticGain) {
      // prismatic_light_gain is a dead-set effect; skip
      continue;
    }

    const conditionalCherub = clause.match(/^If you control\s+(\d+)\+\s+active\s+Cherubim,\s*\+(\d+)\s+(?:additional\s+)?Oblivion/i);
    if (conditionalCherub) {
      effects.push({
        type: 'conditional',
        condition: { type: 'cherubim_active_gte', value: Number(conditionalCherub[1]) },
        then: [{ type: 'oblivion_flat', value: Number(conditionalCherub[2]) }],
      });
      continue;
    }

    const conditionalSeraphPatience = clause.match(/^If you control\s+(\d+)\+\s+active\s+Seraphim,\s*All Seraphim on board gain\s+\+(\d+)\s+(?:additional\s+)?Patience/i);
    if (conditionalSeraphPatience) {
      effects.push({
        type: 'conditional',
        condition: { type: 'seraphim_active_gte', value: Number(conditionalSeraphPatience[1]) },
        then: [{ type: 'patience_gain_all', value: Number(conditionalSeraphPatience[2]) }],
      });
      continue;
    }
  }

  return effects;
}

function parseDocTriggeredEffects(bullets: string[], triggerPrefix: string): CardEffect[] {
  const triggerCore = triggerPrefix.toLowerCase().replace(':', '').trim();
  const relevant = bullets
    .map((bullet) => ({
      raw: bullet,
      normalized: bullet.toLowerCase().replace(/-/g, ' '),
    }))
    .filter((entry) => entry.normalized.startsWith(`${triggerCore}:`))
    .map((entry) => entry.raw.replace(/^[^:]+:\s*/i, '').trim());
  return parseDocEffectClauses(relevant.join('; '));
}

function parseDocAttackBuffsFromBullets(bullets: string[]): CherubimPassiveEffect[] {
  const buffs: CherubimPassiveEffect[] = [];
  for (const bullet of bullets) {
    const match = bullet.match(/Buffs\s+(Seraphim and Angel|Seraphim|Angel)\s+attacks:\s+base\s+\+(\d+)/i);
    if (!match) continue;
    const targetText = match[1].toLowerCase();
    const value = Number(match[2]);
    if (targetText.includes('seraphim and angel')) {
      buffs.push({ type: 'cherubim_attack_buff', targetUnitType: 'Seraphim', bonusBaseOblivion: value, cooldownDeltaCards: 0, multiplier: 1 });
      buffs.push({ type: 'cherubim_attack_buff', targetUnitType: 'Angel', bonusBaseOblivion: value, cooldownDeltaCards: 0, multiplier: 1 });
    } else if (targetText.includes('seraphim')) {
      buffs.push({ type: 'cherubim_attack_buff', targetUnitType: 'Seraphim', bonusBaseOblivion: value, cooldownDeltaCards: 0, multiplier: 1 });
    } else {
      buffs.push({ type: 'cherubim_attack_buff', targetUnitType: 'Angel', bonusBaseOblivion: value, cooldownDeltaCards: 0, multiplier: 1 });
    }
  }
  return buffs;
}

function applyDocBaseStatsOverride(def: CardDefinition, bullets: string[]): CardDefinition {
  if (def.type !== 'Seraphim' && def.type !== 'Angel') return def;

  const whileBullets = bullets
    .filter((bullet) => bullet.toLowerCase().startsWith('while on board:'))
    .map((bullet) => bullet.replace(/^While on board:\s*/i, '').trim());

  const joined = whileBullets.join('; ');
  let bonusType: SeraphimDefinition['baseStats']['bonusType'] | AngelDefinition['baseStats']['bonusType'] = (def as SeraphimDefinition | AngelDefinition).baseStats.bonusType;
  let bonusValue = 0;

  const perCard = joined.match(/\+(\d+)\s+Oblivion\s+per\s+card\s+played/i);
  if (perCard) {
    bonusType = 'oblivion_per_card';
    bonusValue = Number(perCard[1]);
  }

  const ophanim = joined.match(/\+(\d+)\s+Oblivion\s+whenever\s+you\s+play\s+an\s+Ophanim/i);
  if (ophanim) {
    bonusType = 'ophanim_bonus';
    bonusValue = Number(ophanim[1]);
  }

  const cherubExpire = joined.match(/\+(\d+)\s+Oblivion\s+when\s+a\s+Cherubim\s+expires/i);
  if (cherubExpire && def.type === 'Seraphim') {
    bonusType = 'cherubim_expire_bonus';
    bonusValue = Number(cherubExpire[1]);
  }

  const cherubDurability = joined.match(/new\s+Cherubim\s+is\s+summoned.*\+(\d+)\s+cards?/i);
  if (cherubDurability && def.type === 'Seraphim') {
    bonusType = 'cherubim_extra_plays';
    bonusValue = Number(cherubDurability[1]);
  }

  return {
    ...(def as SeraphimDefinition | AngelDefinition),
    baseStats: {
      ...(def as SeraphimDefinition | AngelDefinition).baseStats,
      bonusType,
      bonusValue,
    },
  } as CardDefinition;
}

function isNeutralityCoreCard(definitionId: string): boolean {
  return definitionId.startsWith('ser-neutral-')
    || definitionId.startsWith('ophanim-neutral-')
    || definitionId.startsWith('cherubim-neutral-')
    || definitionId.startsWith('angel-neutral-');
}

function applyNeutralityDocOverride(def: CardDefinition): CardDefinition {
  if (isNeutralityCoreCard(def.definitionId)) return def;

  const override = NEUTRALITY_DOC_OVERRIDES[def.definitionId as keyof typeof NEUTRALITY_DOC_OVERRIDES];
  if (!override) return def;

  let next: CardDefinition = {
    ...def,
    description: override.bullets.join('; '),
  };

  if ((next.type === 'Seraphim' || next.type === 'Angel') && next.attacks && override.attacks.length > 0) {
    const attackByLabel = new Map(override.attacks.map(attack => [attack.label.toLowerCase(), attack]));
    if (next.type === 'Seraphim') {
      const unsyn = attackByLabel.get('unsynergized') ?? override.attacks[0];
      const syn = attackByLabel.get('synergized') ?? override.attacks[1] ?? override.attacks[0];
      next = {
        ...next,
        attacks: {
          unsynergized: {
            ...next.attacks.unsynergized,
            name: unsyn.name,
            baseOblivion: unsyn.damage,
            cooldownCards: unsyn.cooldown,
            costs: /^none$/i.test(unsyn.cost) ? [] : parseAttackCostsFromDescription(`Cost: ${unsyn.cost}`),
          },
          synergized: {
            ...next.attacks.synergized,
            name: syn.name,
            baseOblivion: syn.damage,
            cooldownCards: syn.cooldown,
            costs: /^none$/i.test(syn.cost) ? [] : parseAttackCostsFromDescription(`Cost: ${syn.cost}`),
          },
        },
      };
    } else {
      const primary = attackByLabel.get('primary') ?? override.attacks[0];
      const exalted = attackByLabel.get('exalted') ?? override.attacks[1] ?? override.attacks[0];
      next = {
        ...next,
        attacks: {
          primary: {
            ...next.attacks.primary,
            name: primary.name,
            baseOblivion: primary.damage,
            cooldownCards: primary.cooldown,
            costs: /^none$/i.test(primary.cost) ? [] : parseAttackCostsFromDescription(`Cost: ${primary.cost}`),
          },
          exalted: {
            ...next.attacks.exalted,
            name: exalted.name,
            baseOblivion: exalted.damage,
            cooldownCards: exalted.cooldown,
            costs: /^none$/i.test(exalted.cost) ? [] : parseAttackCostsFromDescription(`Cost: ${exalted.cost}`),
          },
        },
      };
    }
  }

  if (next.type === 'Seraphim') {
    next = applyDocBaseStatsOverride({
      ...(next as SeraphimDefinition),
      onPlayEffects: parseDocTriggeredEffects(override.bullets, 'On play:'),
    } as CardDefinition, override.bullets);
  }

  if (next.type === 'Ophanim') {
    const nonPassiveBullets = override.bullets.filter((bullet) => !/^On attack:/i.test(bullet) && !/^While on board:/i.test(bullet));
    next = {
      ...(next as OphanimDefinition),
      effects: parseDocEffectClauses(nonPassiveBullets.join('; ')),
    } as CardDefinition;
  }

  if (next.type === 'Cherubim') {
    const attackBuffs = parseDocAttackBuffsFromBullets(override.bullets);
    next = {
      ...(next as CherubimDefinition),
      onPlayEffects: parseDocTriggeredEffects(override.bullets, 'On play:'),
      effects: attackBuffs.length > 0 ? attackBuffs : (next as CherubimDefinition).effects,
    } as CardDefinition;
  }

  if (next.type === 'Angel') {
    const updated = applyDocBaseStatsOverride({
      ...(next as AngelDefinition),
      onSummonEffects: parseDocTriggeredEffects(override.bullets, 'On summon:'),
    } as CardDefinition, override.bullets) as AngelDefinition;
    next = updated;
    if (updated.activatedAbility && override.abilityText) {
      next = {
        ...updated,
        activatedAbility: {
          ...updated.activatedAbility,
          name: override.abilityName ?? updated.activatedAbility.name,
          description: override.abilityText,
          effects: parseDocEffectClauses(override.abilityText),
        },
      } as CardDefinition;
    }
  }

  return next;
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

function isStackingResourceCost(_type: AttackCost['type']): boolean {
  return false; // All resource costs from dead sets removed
}

function tuneResourceCostAttackPressure<T extends { baseOblivion: number; cooldownCards: number; costs?: AttackCost[] }>(attack: T): T {
  const costs = attack.costs ?? [];
  const hasStackingResourceCost = costs.some(cost => isStackingResourceCost(cost.type));

  // Phase 0: all attacks are free. Compensate resource-cost attacks with +2 cooldown.
  if (!hasStackingResourceCost) return attack;

  return {
    ...attack,
    cooldownCards: attack.cooldownCards + 2,
  };
}

function firstSeraphimCostForDefinition(def: SeraphimDefinition, _weight: number): AttackCost[] {
  const variant = archetypeIndex(def.definitionId, 5);
  const dominantResourceCost: AttackCost = { type: 'discard_from_hand', value: 1 };
  const discardCost: AttackCost = { type: 'discard_from_hand', value: 1 };

  switch (variant) {
    case 0:
      return [dominantResourceCost];
    case 1:
    case 2:
    case 3:
      return [discardCost];
    default:
      return [discardCost];
  }
}

function buildSeraphimAttackDescription(
  def: SeraphimDefinition,
  attackName: string,
  mode: 'unsynergized' | 'synergized',
): string {
  const motifs = ELEMENT_MOTIFS['neutrality'] ?? ['Rift'];
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
  const motifs = ELEMENT_MOTIFS['neutrality'] ?? ['Radiant'];
  const motif = pickByHash(motifs, `${def.definitionId}:${mode}:motif`);
  const primaryTemplates = [
    `${attackName} carves a commanding ${motif.toLowerCase()} line to keep your offense stable and threatening.`,
    `${attackName} delivers a measured ${motif.toLowerCase()} decree that maintains momentum without overcommitting.`,
    `${attackName} is your reliable ${motif.toLowerCase()} strike, ideal for building toward a finisher.`,
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
    [{ type: 'discard_from_hand', value: Math.max(1, Math.floor((2 + Math.min(6, weight + Math.floor(summonPressure / 2))) / 3)) }],
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

type ProgressionTier = 'base' | 'eternal' | 'infinite' | 'transcendent';

type DpsCategory =
  | 'base-seraphim'
  | 'base-angel'
  | 'eternal-seraphim'
  | 'eternal-angel'
  | 'infinite-seraphim'
  | 'infinite-angel'
  | 'transcendent-seraphim'
  | 'transcendent-angel';

const DPS_CATEGORY_ORDER: DpsCategory[] = [
  'base-seraphim',
  'base-angel',
  'eternal-seraphim',
  'eternal-angel',
  'infinite-seraphim',
  'infinite-angel',
  'transcendent-seraphim',
  'transcendent-angel',
];

function progressionTierFor(def: CardDefinition & { type: 'Seraphim' | 'Angel' }): ProgressionTier {
  if (def.definitionId.startsWith('tx-')) return 'transcendent';
  if (def.rarity === 'Infinite') return 'infinite';
  if (def.rarity === 'Eternal') return 'eternal';
  return 'base';
}

function cooldownBand(
  tier: ProgressionTier,
  unitType: 'Seraphim' | 'Angel',
  mode: 'primary' | 'secondary',
): { min: number; max: number } {
  if (unitType === 'Seraphim') {
    if (mode === 'primary') {
      switch (tier) {
        case 'base': return { min: 5, max: 9 };
        case 'eternal': return { min: 12, max: 18 };
        case 'infinite': return { min: 18, max: 24 };
        case 'transcendent': return { min: 24, max: 30 };
      }
    }
    switch (tier) {
      case 'base': return { min: 9, max: 13 };
      case 'eternal': return { min: 17, max: 24 };
      case 'infinite': return { min: 24, max: 30 };
      case 'transcendent': return { min: 28, max: 30 };
    }
  }

  if (mode === 'primary') {
    switch (tier) {
      case 'base': return { min: 7, max: 12 };
      case 'eternal': return { min: 15, max: 22 };
      case 'infinite': return { min: 22, max: 28 };
      case 'transcendent': return { min: 26, max: 30 };
    }
  }

  switch (tier) {
    case 'base': return { min: 12, max: 17 };
    case 'eternal': return { min: 22, max: 28 };
    case 'infinite': return { min: 27, max: 30 };
    case 'transcendent': return { min: 29, max: 30 };
  }
}

function deterministicCooldown(seed: string, min: number, max: number): number {
  const lo = Math.max(1, Math.min(min, max));
  const hi = Math.max(lo, max);
  const span = hi - lo + 1;
  return lo + (hashString(seed) % span);
}

function stripCardTaxCosts(_costs: ReadonlyArray<AttackCost> | undefined): AttackCost[] {
  // Phase 0: all attacks are free — strip every cost type.
  return [];
}

function targetSeraphimDps(tier: ProgressionTier, mode: 'primary' | 'secondary'): number {
  const baseByTier: Record<ProgressionTier, number> = {
    base: 95,
    eternal: 170,
    infinite: 260,
    transcendent: 360,
  };
  const base = baseByTier[tier];
  return mode === 'primary' ? base : Math.round(base * 1.25);
}

function targetAngelDps(tier: ProgressionTier, mode: 'primary' | 'exalted'): number {
  const baseByTier: Record<ProgressionTier, number> = {
    base: 118,
    eternal: 205,
    infinite: 305,
    transcendent: 420,
  };
  const base = baseByTier[tier];
  return mode === 'primary' ? base : Math.round(base * 1.28);
}

function cherubimDurabilityFor(def: CherubimDefinition): number {
  switch (def.rarity) {
    case 'Common': return 4;
    case 'Rare': return 5;
    case 'Epic': return 7;
    case 'Legendary': return 8;
    case 'Eternal': return 10;
    case 'Infinite': return 15 + (hashString(`${def.definitionId}:durability`) % 6);
  }
}

function applyNeutralityInfiniteIdentityTweaks(def: CardDefinition): CardDefinition {
  if (def.type === 'Cherubim' && def.rarity === 'Infinite') {
    if (def.definitionId === 'inf-entropic-crown') {
      const tuned: CherubimDefinition = {
        ...def,
        effects: [{ type: 'cherubim_patience_per_card', value: 8 }],
        onPlayEffects: [
          { type: 'oblivion_flat', value: 3200 },
          { type: 'patience_gain_all', value: 8 },
          { type: 'patience_double_all' },
          { type: 'neutrality_patient_light_gain', value: 2 },
        ],
      };
      return tuned;
    }

    if (def.definitionId === 'inf-annihilation-field') {
      const tuned: CherubimDefinition = {
        ...def,
        effects: [{ type: 'cherubim_patience_per_card', value: 4 }],
        onPlayEffects: [
          { type: 'patience_gain_all', value: 14 },
          { type: 'neutrality_patient_light_gain', value: 3 },
          { type: 'shuffle_discard' },
          { type: 'oblivion_flat', value: 1800 },
        ],
      };
      return tuned;
    }
  }

  if (def.type === 'Angel' && def.rarity === 'Infinite') {
    if (def.definitionId === 'inf-sovereign-void') {
      const tuned: AngelDefinition = {
        ...def,
        baseStats: { ...def.baseStats, bonusType: 'oblivion_per_seraphim', bonusValue: 950 },
        activatedAbility: {
          ...def.activatedAbility,
          name: 'Null Dominion Prime',
          cardsPlayedRequirement: 4,
          effects: [
            { type: 'neutrality_patient_light_gain', value: 4 },
            { type: 'patience_double_all' },
            { type: 'patience_gain_all', value: 14 },
            { type: 'draw', value: 2 },
            { type: 'oblivion_flat', value: 3600 },
          ],
        },
      };
      return tuned;
    }

    if (def.definitionId === 'inf-eternity-rupture') {
      const tuned: AngelDefinition = {
        ...def,
        baseStats: { ...def.baseStats, bonusType: 'ophanim_bonus', bonusValue: 1450 },
        activatedAbility: {
          ...def.activatedAbility,
          name: 'Rupture Singularity',
          cardsPlayedRequirement: 6,
          effects: [
            { type: 'neutrality_patient_light_gain', value: 2 },
            { type: 'patience_gain_all', value: 18 },
            { type: 'shuffle_discard' },
            { type: 'salvage_any' },
            { type: 'oblivion_flat', value: 5200 },
          ],
        },
      };
      return tuned;
    }
  }

  return def;
}

function applyGlobalBalancePolicies(def: CardDefinition): CardDefinition {
  const withIdentity = applyNeutralityInfiniteIdentityTweaks(def);

  if (withIdentity.type === 'Seraphim' && withIdentity.attacks) {
    const tier = progressionTierFor(withIdentity);
    const unsynBand = cooldownBand(tier, 'Seraphim', 'primary');
    const synBand = cooldownBand(tier, 'Seraphim', 'secondary');
    const unsynCooldown = deterministicCooldown(`${withIdentity.definitionId}:unsyn-cd`, unsynBand.min, unsynBand.max);
    const synCooldown = Math.max(
      unsynCooldown + 2,
      deterministicCooldown(`${withIdentity.definitionId}:syn-cd`, synBand.min, synBand.max),
    );

    const unsynBase = Math.max(
      withIdentity.attacks.unsynergized.baseOblivion,
      Math.round(unsynCooldown * targetSeraphimDps(tier, 'primary')),
    );
    const synBase = Math.max(
      withIdentity.attacks.synergized.baseOblivion,
      Math.round(synCooldown * targetSeraphimDps(tier, 'secondary')),
      Math.round(unsynBase * 1.38),
    );

    return {
      ...withIdentity,
      attacks: {
        unsynergized: {
          ...withIdentity.attacks.unsynergized,
          baseOblivion: unsynBase,
          cooldownCards: Math.min(30, unsynCooldown),
          costs: stripCardTaxCosts(withIdentity.attacks.unsynergized.costs),
        },
        synergized: {
          ...withIdentity.attacks.synergized,
          baseOblivion: synBase,
          cooldownCards: Math.min(30, synCooldown),
          costs: stripCardTaxCosts(withIdentity.attacks.synergized.costs),
        },
      },
    };
  }

  if (withIdentity.type === 'Angel' && withIdentity.attacks) {
    const tier = progressionTierFor(withIdentity);
    const primaryBand = cooldownBand(tier, 'Angel', 'primary');
    const exaltedBand = cooldownBand(tier, 'Angel', 'secondary');
    const primaryCooldown = deterministicCooldown(`${withIdentity.definitionId}:primary-cd`, primaryBand.min, primaryBand.max);
    const exaltedCooldown = Math.max(
      primaryCooldown + 3,
      deterministicCooldown(`${withIdentity.definitionId}:exalted-cd`, exaltedBand.min, exaltedBand.max),
    );

    const primaryBase = Math.max(
      withIdentity.attacks.primary.baseOblivion,
      Math.round(primaryCooldown * targetAngelDps(tier, 'primary')),
    );
    const exaltedBase = Math.max(
      withIdentity.attacks.exalted.baseOblivion,
      Math.round(exaltedCooldown * targetAngelDps(tier, 'exalted')),
      Math.round(primaryBase * 1.6),
    );

    return {
      ...withIdentity,
      attacks: {
        primary: {
          ...withIdentity.attacks.primary,
          baseOblivion: primaryBase,
          cooldownCards: Math.min(30, primaryCooldown),
          costs: stripCardTaxCosts(withIdentity.attacks.primary.costs),
        },
        exalted: {
          ...withIdentity.attacks.exalted,
          baseOblivion: exaltedBase,
          cooldownCards: Math.min(30, exaltedCooldown),
          costs: stripCardTaxCosts(withIdentity.attacks.exalted.costs),
        },
      },
    };
  }

  if (withIdentity.type === 'Cherubim') {
    return {
      ...withIdentity,
      maxDurability: cherubimDurabilityFor(withIdentity),
      discardCondition: undefined,
    };
  }

  return withIdentity;
}

function dpsCategoryForDefinition(def: CardDefinition): DpsCategory | null {
  if (def.type !== 'Seraphim' && def.type !== 'Angel') return null;
  const tier = progressionTierFor(def);
  if (def.type === 'Seraphim') {
    switch (tier) {
      case 'base': return 'base-seraphim';
      case 'eternal': return 'eternal-seraphim';
      case 'infinite': return 'infinite-seraphim';
      case 'transcendent': return 'transcendent-seraphim';
    }
  }

  switch (tier) {
    case 'base': return 'base-angel';
    case 'eternal': return 'eternal-angel';
    case 'infinite': return 'infinite-angel';
    case 'transcendent': return 'transcendent-angel';
  }
}

function maxAttackDps(def: CardDefinition): number {
  if (def.type === 'Seraphim' && def.attacks) {
    const unsyn = def.attacks.unsynergized.baseOblivion / Math.max(1, def.attacks.unsynergized.cooldownCards);
    const syn = def.attacks.synergized.baseOblivion / Math.max(1, def.attacks.synergized.cooldownCards);
    return Math.max(unsyn, syn);
  }
  if (def.type === 'Angel' && def.attacks) {
    const primary = def.attacks.primary.baseOblivion / Math.max(1, def.attacks.primary.cooldownCards);
    const exalted = def.attacks.exalted.baseOblivion / Math.max(1, def.attacks.exalted.cooldownCards);
    return Math.max(primary, exalted);
  }
  return 0;
}

function scaleAttackPower(def: CardDefinition, factor: number): CardDefinition {
  if (!Number.isFinite(factor) || factor <= 1) return def;
  if (def.type === 'Seraphim' && def.attacks) {
    return {
      ...def,
      attacks: {
        unsynergized: {
          ...def.attacks.unsynergized,
          baseOblivion: Math.max(def.attacks.unsynergized.baseOblivion, Math.ceil(def.attacks.unsynergized.baseOblivion * factor)),
          costs: stripCardTaxCosts(def.attacks.unsynergized.costs),
        },
        synergized: {
          ...def.attacks.synergized,
          baseOblivion: Math.max(def.attacks.synergized.baseOblivion, Math.ceil(def.attacks.synergized.baseOblivion * factor)),
          costs: stripCardTaxCosts(def.attacks.synergized.costs),
        },
      },
    };
  }

  if (def.type === 'Angel' && def.attacks) {
    return {
      ...def,
      attacks: {
        primary: {
          ...def.attacks.primary,
          baseOblivion: Math.max(def.attacks.primary.baseOblivion, Math.ceil(def.attacks.primary.baseOblivion * factor)),
          costs: stripCardTaxCosts(def.attacks.primary.costs),
        },
        exalted: {
          ...def.attacks.exalted,
          baseOblivion: Math.max(def.attacks.exalted.baseOblivion, Math.ceil(def.attacks.exalted.baseOblivion * factor)),
          costs: stripCardTaxCosts(def.attacks.exalted.costs),
        },
      },
    };
  }

  return def;
}

function enforceGlobalDpsLadder(defs: CardDefinition[]): CardDefinition[] {
  const maxByCategory = new Map<DpsCategory, number>();
  for (const category of DPS_CATEGORY_ORDER) {
    maxByCategory.set(category, 0);
  }

  for (const def of defs) {
    const category = dpsCategoryForDefinition(def);
    if (!category) continue;
    maxByCategory.set(category, Math.max(maxByCategory.get(category) ?? 0, maxAttackDps(def)));
  }

  const minByCategory = new Map<DpsCategory, number>();
  let previous = 0;
  for (const category of DPS_CATEGORY_ORDER) {
    const current = maxByCategory.get(category) ?? 0;
    if (current <= 0) continue;
    const required = previous > 0 ? Math.max(current, previous * 1.03) : current;
    minByCategory.set(category, required);
    previous = required;
  }

  return defs.map((def) => {
    const category = dpsCategoryForDefinition(def);
    if (!category) return def;
    const minDps = minByCategory.get(category) ?? 0;
    const currentDps = maxAttackDps(def);
    if (minDps <= 0 || currentDps <= 0 || currentDps >= minDps) return def;
    return scaleAttackPower(def, minDps / currentDps);
  });
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
  const relatedSeraphim = findRelatedUnitIds('Seraphim', family, 8);
  const relatedAngels = findRelatedUnitIds('Angel', family, 5);
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
          : ['neutrality', ...familyTags(def.definitionId)],
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
    targetTags: ['neutrality', family],
    bonusBaseOblivion: tunedBase,
    cooldownDeltaCards: tunedCooldownDelta,
    multiplier: tunedMultiplier,
  };

  const angelAttackBuff: CherubimPassiveEffect = {
    type: 'cherubim_attack_buff',
    targetUnitType: 'Angel',
    targetDefinitionIds: relatedAngels,
    targetTags: ['neutrality', family, 'angel'],
    bonusBaseOblivion: Math.round(tunedBase * 0.78),
    cooldownDeltaCards: weight >= 4 ? -1 : 0,
    multiplier: Number((1 + (tunedMultiplier - 1) * 0.75).toFixed(3)),
  };

  const derived = weight >= 3 ? [attackBuff, angelAttackBuff] : [attackBuff];
  return [...def.effects, ...derived];
}

function isOphanimUtilityEffect(effect: CardEffect): boolean {
  switch (effect.type) {
    // Classic card-draw utility
    case 'draw':
    case 'discard_draw':
    case 'look_top_take':
    case 'look_top_take_drop':
    case 'look_top_take_type':
    case 'search_deck_by_type':
    case 'salvage_by_type':
    case 'salvage_any':
    case 'shuffle_discard':
      return true;
    // Recurse into conditional so nested resource gains are recognised
    case 'conditional':
      return effect.then.some(isOphanimUtilityEffect);
    default:
      return false;
  }
}

function hasOphanimUtilityEffect(def: OphanimDefinition): boolean {
  return def.effects.some(isOphanimUtilityEffect);
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
      extraEffects.push({ type: 'draw', value: weight >= 5 ? 2 : 1 });
      break;
    default:
      extraEffects.push({ type: 'draw', value: 1 });
      break;
  }

  return {
    ...def,
    effects: [...def.effects, ...extraEffects],
  };
}

const NEUTRALITY_NON_CORE_REWORK_IDS = new Set<string>([
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
]);

function shouldKeepSourceDefinition(def: CardDefinition): boolean {
  const { definitionId } = def;
  const isHighTierAngel = def.type === 'Angel' && (def.rarity === 'Eternal' || def.rarity === 'Infinite');
  if (isNeutralityCoreCard(definitionId) || NEUTRALITY_NON_CORE_REWORK_IDS.has(definitionId)) {
    if (isHighTierAngel) {
      // High-tier Angels must keep summon materials normalized even when effects stay source-authored.
    } else {
      return true;
    }
  }
  // Infinite reward cards must execute exact source-defined effects so UI text matches behavior.
  // High-rarity Angels are the one exception: normalized centrally so summon gates stay consistent.
  if (definitionId.startsWith('inf-') && def.type !== 'Angel') return true;
  return false;
}

function normalizeDefinition(def: CardDefinition): CardDefinition {
  if (shouldKeepSourceDefinition(def)) {
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
      attackTags: seraphim.attackTags ?? ['neutrality', ...familyTags(seraphim.definitionId)],
    };
  }

  if (def.type === 'Angel') {
    const angel = def as AngelDefinition;
    const shouldNormalizeSummonProfile = angel.rarity === 'Eternal' || angel.rarity === 'Infinite';
    const normalizedAngel: AngelDefinition = shouldNormalizeSummonProfile
      ? (() => {
        const summonProfile = buildHighTierAngelSummonProfile(angel);
        return {
          ...angel,
          summonCost: summonProfile.summonCost,
          extraSummonConditions: summonProfile.extraSummonConditions,
        };
      })()
      : angel;
    const cleanedSummonConditions = pruneRedundantSummonConditions(
      normalizedAngel.summonCost,
      normalizedAngel.extraSummonConditions,
    );
    const conditionCleanAngel: AngelDefinition = {
      ...normalizedAngel,
      extraSummonConditions: cleanedSummonConditions.length > 0 ? cleanedSummonConditions : undefined,
    };

    if (materialized?.type === 'Angel') {
      const tunedAttacks = tuneAngelAttackSet(conditionCleanAngel, materialized.attacks as unknown as AngelAttackSet);
      return {
        ...conditionCleanAngel,
        attacks: tunedAttacks,
        attackTags: [...materialized.attackTags],
      };
    }

    const tunedAttacks = tuneAngelAttackSet(conditionCleanAngel, angel.attacks ?? buildAngelAttacks(conditionCleanAngel));
    return {
      ...conditionCleanAngel,
      attacks: tunedAttacks,
      attackTags: angel.attackTags ?? ['neutrality', ...familyTags(angel.definitionId)],
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
  const firstPass = defs.map(def => applyGlobalBalancePolicies(applyNeutralityDocOverride(normalizeDefinition(def))));
  const finalDefs = enforceGlobalDpsLadder(firstPass);

  for (const def of finalDefs) {
    registry.set(def.definitionId, def);
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

const DISPLAY_DEFINITIONS = Array.from(registry.values()).map(displayCardDefinition);
const DISPLAY_DEFINITION_BY_ID = new Map(
  DISPLAY_DEFINITIONS.map((definition) => [definition.definitionId, definition] as const),
);

// ── Pre-built indices for O(1) filtered lookups ───────────────────────────
// Built once at module load; avoids repeated getAll().filter() scans across
// store.ts, titleBadges.ts, avatars.ts, and uiThemes.ts hot paths.

const _byType = new Map<string, CardDefinition[]>();
const _byRarity = new Map<string, CardDefinition[]>();

for (const def of DISPLAY_DEFINITIONS) {
  const ty = def.type ?? '';
  if (!_byType.has(ty)) _byType.set(ty, []);
  _byType.get(ty)!.push(def);

  const ra = def.rarity ?? '';
  if (!_byRarity.has(ra)) _byRarity.set(ra, []);
  _byRarity.get(ra)!.push(def);
}

ScoreSystem.getDefinition = (id: string) => registry.get(resolveCardId(id));

export const CardRegistry = {
  get: (id: string): CardDefinition | undefined => {
    return DISPLAY_DEFINITION_BY_ID.get(resolveCardId(id));
  },
  getAll: (): CardDefinition[] => DISPLAY_DEFINITIONS,
  /**
   * Returns all cards matching the given rarity (O(1) index lookup).
   */
  getByRarity: (rarity: string): CardDefinition[] => _byRarity.get(rarity) ?? [],
  getByType: (type: CardDefinition['type']): CardDefinition[] =>
    _byType.get(type) ?? [],
  has: (id: string): boolean => registry.has(resolveCardId(id)),
};

