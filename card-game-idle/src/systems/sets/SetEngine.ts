/**
 * Set Engine — types and registry for per-set ability systems.
 *
 * Each card set declares one `SetEngineDefinition` with three ability slots.
 * All three base abilities are available whenever any card from the set is
 * present in the main or extra deck.
 * Signatures are alternatives inside their target slot and are unlocked by
 * the owning Angel's presence in the deck's extra deck.
 *
 * Cooldowns are measured in **cards played from hand** (not turns).
 * One-off abilities use `maxUsesPerRun: 1`; when depleted they cannot fire again
 * until the next run.
 */

import type { DeckEntry, ExtraDeckEntry, GameState } from '@/types/game';

export type SetAbilitySlot = 1 | 2 | 3;

// ── Ability definition ─────────────────────────────────────────────────────────

export interface SetAbilityDefinition {
  /** Stable unique id, e.g. "neutrality-slot1-composed-draw". */
  id: string;
  /** Parent set id, e.g. "Neutrality". */
  setId: string;
  /** Which slot (1–3) this ability fills. */
  slot: SetAbilitySlot;
  /** Signature abilities replace the base ability in this slot when unlocked. */
  signatureOwnerId?: string;
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
  /** Base abilities, one per slot. Signature abilities may follow these entries. */
  abilities: SetAbilityDefinition[];
  /** Set-scoped card membership. */
  membership: SetCardMembership;
}

export interface SetCardMembership {
  isMember: (definitionId: string) => boolean;
  isEternal: (definitionId: string) => boolean;
  isInfinite: (definitionId: string) => boolean;
  isTranscendentAngel: (definitionId: string) => boolean;
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

/**
 * Given a set's abilities and the active deck, returns the ability that should
 * currently fill each slot (or undefined if the set is absent from the deck).
 */
export function resolveActiveAbilitiesForDeck(
  setId: string,
  deckList: DeckEntry[],
  extraDeck: ExtraDeckEntry[],
  abilityLoadout?: Partial<Record<SetAbilitySlot, string>>,
): Partial<Record<SetAbilitySlot, SetAbilityDefinition>> {
  const set = getSet(setId);
  if (!set) return {};

  const hasSetCard = [...deckList, ...extraDeck].some(entry => set.membership.isMember(entry.definitionId));
  if (!hasSetCard) return {};
  const extraDefinitionIds = new Set(extraDeck.map(entry => entry.definitionId));
  const result: Partial<Record<SetAbilitySlot, SetAbilityDefinition>> = {};
  for (const ability of set.abilities) {
    const isSignature = Boolean(ability.signatureOwnerId);
    const isAvailable = isSignature ? extraDefinitionIds.has(ability.signatureOwnerId!) : true;
    if (!isAvailable) continue;

    const selectedId = abilityLoadout?.[ability.slot];
    if (selectedId === ability.id) result[ability.slot] = ability;
    else if (!selectedId && !result[ability.slot]) result[ability.slot] = ability;
  }
  return result;
}

export function resolveAbilityOptionsForDeck(
  setId: string,
  deckList: DeckEntry[],
  extraDeck: ExtraDeckEntry[],
): Partial<Record<SetAbilitySlot, SetAbilityDefinition[]>> {
  const set = getSet(setId);
  if (!set) return {};

  const hasSetCard = [...deckList, ...extraDeck].some(entry => set.membership.isMember(entry.definitionId));
  if (!hasSetCard) return {};
  const extraDefinitionIds = new Set(extraDeck.map(entry => entry.definitionId));
  const result: Partial<Record<SetAbilitySlot, SetAbilityDefinition[]>> = {};
  for (const ability of set.abilities) {
    const isAvailable = ability.signatureOwnerId
      ? extraDefinitionIds.has(ability.signatureOwnerId)
      : true;
    if (!isAvailable) continue;
    (result[ability.slot] ??= []).push(ability);
  }
  return result;
}
