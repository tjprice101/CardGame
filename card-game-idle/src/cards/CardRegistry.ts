import type {
  CardDefinition,
} from '@/types/cards';
import { ainSophAurCards } from '../data/cards/ainSophAurCards';
import { lightCards } from '../data/cards/lightCards';
import { darkCards } from '../data/cards/darkCards';
import { transcendentCardDefinitions } from '../data/ascension/transcendentCards';
import { ScoreSystem } from '../systems/scoring/ScoreSystem';
import { formatDisplayCardText } from '../ui/preferences';

const registry = new Map<string, CardDefinition>();

const CARD_ID_ALIASES: Record<string, string> = {
};

function resolveCardId(id: string): string {
  return CARD_ID_ALIASES[id] ?? id;
}

const SOURCE_DEFINITIONS: CardDefinition[] = [
  ...(ainSophAurCards as unknown as CardDefinition[]),
  ...(lightCards as unknown as CardDefinition[]),
  ...(darkCards as unknown as CardDefinition[]),
  ...(transcendentCardDefinitions as unknown as CardDefinition[]),
];

function applyNeutralityDocOverride(def: CardDefinition): CardDefinition {
  // NEUTRALITY_DOC_OVERRIDES is permanently empty (legacy Seraphim/Angel/Cherubim/Ophanim
  // doc-override data removed for the Ain/Soph rework), so this is an identity function
  // for every live definition.
  return def;
}

function applyGlobalBalancePolicies(def: CardDefinition): CardDefinition {
  // Legacy Seraphim/Angel/Cherubim DPS-tuning, identity-tweak, and durability policies
  // removed: no card of those types is ever registered (SOURCE_DEFINITIONS is
  // Light/Dark/AinSophAur/transcendent only), so this was always an identity function
  // for every live definition.
  return def;
}

function enforceGlobalDpsLadder(defs: CardDefinition[]): CardDefinition[] {
  // Legacy Seraphim/Angel DPS-ladder enforcement removed: no card of those types is ever
  // registered, so this was always an identity function for every live definition list.
  return defs;
}

function normalizeDefinition(def: CardDefinition): CardDefinition {
  // Legacy Seraphim/Angel/Cherubim/Ophanim balance normalization removed: no card of those
  // types is ever registered (SOURCE_DEFINITIONS is Light/Dark/AinSophAur/transcendent only),
  // so this was always an identity function for every live definition.
  return def;
}

function registerAll(defs: CardDefinition[]): void {
  const firstPass = defs.map(def => applyGlobalBalancePolicies(applyNeutralityDocOverride(normalizeDefinition(def))));
  const finalDefs = enforceGlobalDpsLadder(firstPass);

  for (const def of finalDefs) {
    registry.set(def.definitionId, def);
  }
}

function displayCardDefinition(def: CardDefinition): CardDefinition {
  return {
    ...def,
    name: formatDisplayCardText(def.name),
    description: formatDisplayCardText(def.description),
  } as CardDefinition;
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

