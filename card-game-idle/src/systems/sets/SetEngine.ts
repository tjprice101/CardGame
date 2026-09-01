/**
 * Set Engine — types and registry for per-set ability systems.
 *
 * Each card set declares one `SetEngineDefinition` with four ability slots:
 *   1 — Base    : always available (any card of the set in the deck)
 *   2 — Eternal : requires ≥1 Eternal card of this set in the deck
 *   3 — Infinite: requires ≥1 Infinite card of this set in the deck
 *   4 — Transcendent Angel : requires a Transcendent-tier Angel in the extra deck AND on the board
 *
 * Cooldowns are measured in **cards played from hand** (not turns).
 * One-off abilities use `maxUsesPerRun: 1`; when depleted they cannot fire again
 * until the next run.
 */

import type { DeckEntry, ExtraDeckEntry, GameState } from '@/types/game';
import { CardRegistry } from '@/cards/CardRegistry';

// ── Gate types ─────────────────────────────────────────────────────────────────

export type SetAbilityGate = 'base' | 'eternal' | 'infinite' | 'transcendent-angel';
export type SetAbilitySlot = 1 | 2 | 3 | 4;

// ── Ability definition ─────────────────────────────────────────────────────────

export interface SetAbilityDefinition {
  /** Stable unique id, e.g. "neutrality-slot1-composed-draw". */
  id: string;
  /** Parent set id, e.g. "Neutrality". */
  setId: string;
  /** Which slot (1–4) this ability fills. */
  slot: SetAbilitySlot;
  /** Deck composition gate that must be met to use this ability. */
  gate: SetAbilityGate;
  /** Short player-facing name. */
  label: string;
  /** Full description shown in the ability strip tooltip and the Deckbuilder Abilities tab. */
  description: string;
  /**
   * Cooldown expressed in cards played from hand. 0 = no per-play cooldown
   * (but may still be capped by maxUsesPerRun).
   */
  cooldownCards: number;
  /**
   * Maximum uses per run. `undefined` = unlimited (only limited by cooldown).
   * Set to 1 for one-off abilities.
   */
  maxUsesPerRun?: number;
  /**
   * Effect implementation. Receives an immer-drafted copy of the full game
   * state. Any store-level side effects (toasts, etc.) are handled by the
   * store's `activateSetAbility` action after this returns.
   * Called only after all guards (gate, cooldown, uses) pass.
   */
  execute: (s: GameState) => void;
}

// ── Set definition ─────────────────────────────────────────────────────────────

export interface SetEngineDefinition {
  /** Stable id matching the set name used in card data, e.g. "Neutrality". */
  id: string;
  /** Display label. */
  label: string;
  /** The one signature mechanic this set revolves around. */
  signatureMechanic: 'patience';
  /** Exactly four abilities, one per slot. */
  abilities: [SetAbilityDefinition, SetAbilityDefinition, SetAbilityDefinition, SetAbilityDefinition];
}

// ── Registry ───────────────────────────────────────────────────────────────────

const _registry = new Map<string, SetEngineDefinition>();

export function registerSet(def: SetEngineDefinition): void {
  _registry.set(def.id, def);
}

export function getSet(id: string): SetEngineDefinition | undefined {
  return _registry.get(id);
}

export function listSets(): SetEngineDefinition[] {
  return Array.from(_registry.values());
}

// ── Gate resolution ────────────────────────────────────────────────────────────

/** Prefixes / id patterns that identify card tiers within a set. */
const ETERNAL_PREFIXES = ['btei-'];
const INFINITE_IDS = new Set([
  'inf-oblivion-absolute', 'inf-void-cascade', 'inf-genesis-throne', 'inf-null-apex',
  'inf-entropic-crown', 'inf-annihilation-field', 'inf-sovereign-void', 'inf-eternity-rupture',
]);

function isEternalCard(id: string): boolean {
  return ETERNAL_PREFIXES.some(p => id.startsWith(p));
}

function isInfiniteCard(id: string): boolean {
  return INFINITE_IDS.has(id);
}

function isAngelCard(id: string): boolean {
  const def = CardRegistry.get(id);
  return def?.type === 'Angel';
}

/** Transcendent-tier Angels are tagged with this id prefix regardless of registry rarity label. */
export function isTranscendentAngelCardId(id: string): boolean {
  return id.startsWith('tx-angel-');
}

/**
 * Returns which gates are currently satisfied by the given deck composition.
 */
export function resolveGatesForDeck(
  deckList: DeckEntry[],
  extraDeck: ExtraDeckEntry[],
): Set<SetAbilityGate> {
  const gates = new Set<SetAbilityGate>();

  const hasAny = deckList.length > 0 || extraDeck.length > 0;
  if (hasAny) gates.add('base');

  if (deckList.some(e => isEternalCard(e.definitionId))) gates.add('eternal');
  if (deckList.some(e => isInfiniteCard(e.definitionId))) gates.add('infinite');
  if (extraDeck.some(e => isTranscendentAngelCardId(e.definitionId) && isAngelCard(e.definitionId))) {
    gates.add('transcendent-angel');
  }

  return gates;
}

/**
 * Given a set's four abilities and the active deck, returns the ability that
 * should currently fill each slot (or undefined if the gate isn't met).
 */
export function resolveActiveAbilitiesForDeck(
  setId: string,
  deckList: DeckEntry[],
  extraDeck: ExtraDeckEntry[],
): Partial<Record<SetAbilitySlot, SetAbilityDefinition>> {
  const set = getSet(setId);
  if (!set) return {};

  const gates = resolveGatesForDeck(deckList, extraDeck);
  const result: Partial<Record<SetAbilitySlot, SetAbilityDefinition>> = {};
  for (const ability of set.abilities) {
    if (gates.has(ability.gate)) {
      result[ability.slot] = ability;
    }
  }
  return result;
}
