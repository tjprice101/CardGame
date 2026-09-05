/**
 * Neutrality Set Abilities — three hotkey-activated slots with Angel signatures.
 *
 * Cooldowns count cards played from hand (not turns).
 *
 * Registration happens at the bottom of this file; import this module from
 * RegistryBoot.ts (or equivalent) to ensure it runs at startup.
 */

import type { GameState } from '@/types/game';
import { type SetEngineDefinition, registerSet } from '@/systems/sets/SetEngine';
import { computeGlobalResonanceScore } from '@/systems/progression/cardMastery';

// ── Helper: clamp patience stacks ─────────────────────────────────────────────

const NEUTRALITY_PATIENCE_CAP = 150;

function clampPatience(val: number): number {
  return Math.max(0, Math.min(NEUTRALITY_PATIENCE_CAP, val));
}

// ── Set-scoped card membership ───────────────────────────────────────────

const NEUTRALITY_INFINITE_IDS = new Set([
  'inf-oblivion-absolute', 'inf-void-cascade', 'inf-genesis-throne', 'inf-null-apex',
  'inf-entropic-crown', 'inf-annihilation-field', 'inf-sovereign-void', 'inf-eternity-rupture',
]);
const NEUTRALITY_TX_ANGEL_IDS = new Set(['tx-angel-starbound-null-archangel']);

// ── Ability implementations ────────────────────────────────────────────────────

/**
 * Slot 1 — Composed Advance (Base, 3 hand-play CD)
 * Grant +3 Patience to every front-row unit; reduce every front-row unit's
 * attack cooldowns by 1 (min 0).
 */
function composedDrawExecute(s: GameState): void {
  for (const slot of s.board.frontSlots) {
    if (!slot) continue;
    if ('patienceStacks' in slot) {
      (slot as { patienceStacks?: number }).patienceStacks = clampPatience(
        ((slot as { patienceStacks?: number }).patienceStacks ?? 0) + 3
      );
    }
  }
  for (const slot of s.board.frontSlots) {
    if (!slot) continue;
    const cooldowns = (slot as { attackCooldowns?: Record<string, number> }).attackCooldowns;
    if (!cooldowns) continue;
    for (const key of Object.keys(cooldowns)) {
      cooldowns[key] = Math.max(0, cooldowns[key] - 1);
    }
  }
}

/**
 * Slot 2 — Vigil's Ledger (Eternal, 5 hand-play CD)
 * For each front-row unit with Patience ≥ 20, grant it +5 Patience.
 * Also grants +2 temporary hand-capacity for the rest of this turn
 * (implemented as 2 extra draws from the draw pile).
 */
function vigilsLedgerExecute(s: GameState): void {
  // Grant +5 Patience to qualifying units.
  for (const slot of s.board.frontSlots) {
    if (!slot) continue;
    const patienceSlot = slot as { patienceStacks?: number };
    if ((patienceSlot.patienceStacks ?? 0) >= 20) {
      patienceSlot.patienceStacks = clampPatience((patienceSlot.patienceStacks ?? 0) + 5);
    }
  }
  // +2 hand cards (represent the hand-slot bonus).
  let drawn = 0;
  while (drawn < 2 && s.deck.drawPile.length > 0) {
    const card = s.deck.drawPile.pop()!;
    s.deck.hand.push(card);
    drawn++;
  }
}

/**
 * Slot 3 — Recursive Calm (10 hand-play CD, repeatable)
 * Consume ALL Patience from every front-row unit; grant Oblivion equal to
 * totalPatienceConsumed × 500 × globalMasteryMultiplier.
 * Mastery multiplier = min(3, 1 + resonanceScore / 1000).
 */
function recursiveCalmExecute(s: GameState): void {
  let total = 0;
  for (const slot of s.board.frontSlots) {
    if (!slot) continue;
    const patienceSlot = slot as { patienceStacks?: number };
    total += patienceSlot.patienceStacks ?? 0;
    patienceSlot.patienceStacks = 0;
  }
  if (total <= 0) return;

  // Compute global mastery multiplier from resonance score.
  const resonance = computeGlobalResonanceScore(s.progress);
  const masteryMult = Math.min(3, 1 + resonance / 1000);

  const oblivion = Math.floor(total * 500 * masteryMult);
  s.progress.oblivion = (s.progress.oblivion ?? 0) + oblivion;
  s.turn.oblivionEarnedThisTurn = (s.turn.oblivionEarnedThisTurn ?? 0) + oblivion;
}

/**
 * Slot 3 — Aegis Uprising (10 hand-play CD, repeatable)
 * Find the lowest Patience value among front-row units; grant each unit
 * Patience equal to that minimum × 3. Requires a Transcendent Angel of this
 * set on the board (enforced at runtime in activateSetAbility, not by a deck gate).
 */
function aegisUprisingExecute(s: GameState): void {
  const stacks = s.board.frontSlots
    .filter(Boolean)
    .map(slot => (slot as { patienceStacks?: number }).patienceStacks ?? 0);
  if (stacks.length === 0) return;

  const minPatience = Math.min(...stacks);
  const grant = minPatience * 3;
  if (grant <= 0) return;

  for (const slot of s.board.frontSlots) {
    if (!slot) continue;
    const patienceSlot = slot as { patienceStacks?: number };
    patienceSlot.patienceStacks = clampPatience((patienceSlot.patienceStacks ?? 0) + grant);
  }
}

function convergentRefrainExecute(s: GameState): void {
  for (const slot of s.board.frontSlots) {
    if (!slot) continue;
    slot.patienceStacks = clampPatience((slot.patienceStacks ?? 0) + 5);
  }
}

function parallaxVerdictExecute(s: GameState): void {
  for (const slot of s.board.frontSlots) {
    if (!slot || (slot.patienceStacks ?? 0) < 15) continue;
    slot.patienceStacks = clampPatience((slot.patienceStacks ?? 0) + 8);
  }
  for (let index = 0; index < 3 && s.deck.drawPile.length > 0; index += 1) {
    s.deck.hand.push(s.deck.drawPile.pop()!);
  }
}

function axiomaticDevourExecute(s: GameState): void {
  const units = s.board.frontSlots
    .filter(Boolean)
    .sort((left, right) => (right?.patienceStacks ?? 0) - (left?.patienceStacks ?? 0));
  for (const slot of units.slice(0, 2)) {
    slot!.patienceStacks = clampPatience((slot!.patienceStacks ?? 0) * 2);
  }
  for (const slot of s.board.frontSlots) {
    if (!slot) continue;
    for (const key of Object.keys(slot.attackCooldowns)) {
      slot.attackCooldowns[key] = Math.max(0, slot.attackCooldowns[key] - 2);
    }
  }
}

function nullSovereignsDecreeExecute(s: GameState): void {
  let total = 0;
  for (const slot of s.board.frontSlots) {
    if (!slot) continue;
    total += slot.patienceStacks ?? 0;
    slot.patienceStacks = 0;
  }
  const resonance = computeGlobalResonanceScore(s.progress);
  const multiplier = Math.min(3, 1 + resonance / 900);
  const oblivion = Math.floor(total * 700 * multiplier);
  s.progress.oblivion = (s.progress.oblivion ?? 0) + oblivion;
  s.turn.oblivionEarnedThisTurn = (s.turn.oblivionEarnedThisTurn ?? 0) + oblivion;
}

function rupturedContinuumExecute(s: GameState): void {
  let total = 0;
  for (const slot of s.board.frontSlots) {
    if (!slot) continue;
    total += slot.patienceStacks ?? 0;
    slot.patienceStacks = Math.floor((slot.patienceStacks ?? 0) / 2);
  }
  const oblivion = Math.floor(total * 1250);
  s.progress.oblivion = (s.progress.oblivion ?? 0) + oblivion;
  s.turn.oblivionEarnedThisTurn = (s.turn.oblivionEarnedThisTurn ?? 0) + oblivion;
  for (let index = 0; index < 4 && s.deck.drawPile.length > 0; index += 1) {
    s.deck.hand.push(s.deck.drawPile.pop()!);
  }
}

// ── Definition ─────────────────────────────────────────────────────────────────

const NEUTRALITY_SET: SetEngineDefinition = {
  id: 'Neutrality',
  label: 'Neutrality',
  signatureMechanic: 'patience',
  membership: {
    isMember: id => id.startsWith('neutral-') || id.startsWith('angel-neutral-') || id.startsWith('ser-neutral-') || id.startsWith('cher-neutral-') || id.startsWith('oph-neutral-') || id.startsWith('btei-') || NEUTRALITY_INFINITE_IDS.has(id) || NEUTRALITY_TX_ANGEL_IDS.has(id),
    isEternal: id => id.startsWith('btei-'),
    isInfinite: id => NEUTRALITY_INFINITE_IDS.has(id),
    isTranscendentAngel: id => NEUTRALITY_TX_ANGEL_IDS.has(id),
  },
  abilities: [
    {
      id: 'neutrality-slot1-composed-draw',
      setId: 'Neutrality',
      slot: 1,
      label: 'Composed Advance',
      description: 'Grant +3 Patience to every front-row unit and reduce every attack cooldown on your board by 1.',
      cooldownCards: 3,
      execute: composedDrawExecute,
    },
    {
      id: 'neutrality-slot2-vigils-ledger',
      setId: 'Neutrality',
      slot: 2,
      label: "Vigil's Ledger",
      description: 'For each front-row unit with ≥20 Patience, grant it +5 Patience. Draw 2 additional cards.',
      cooldownCards: 5,
      execute: vigilsLedgerExecute,
    },
    {
      id: 'neutrality-slot3-recursive-calm',
      setId: 'Neutrality',
      slot: 3,
      label: 'Recursive Calm',
      description: 'Once per run: consume all Patience from every front-row unit. Gain Oblivion equal to total Patience × 500 × Collection Power (up to ×3).',
      cooldownCards: 10,
      execute: recursiveCalmExecute,
    },
    {
      id: 'neutrality-signature-convergent-refrain',
      setId: 'Neutrality',
      slot: 1,
      signatureOwnerId: 'btei-convergence-of-eternity',
      label: 'Convergent Refrain',
      description: 'Grant +5 Patience to every front-row unit.',
      cooldownCards: 4,
      execute: convergentRefrainExecute,
    },
    {
      id: 'neutrality-signature-parallax-verdict',
      setId: 'Neutrality',
      slot: 2,
      signatureOwnerId: 'btei-omniscient-fracture',
      label: 'Parallax Verdict',
      description: 'Front-row units with at least 15 Patience gain +8 Patience. Draw 3 cards.',
      cooldownCards: 6,
      execute: parallaxVerdictExecute,
    },
    {
      id: 'neutrality-signature-axiomatic-devour',
      setId: 'Neutrality',
      slot: 1,
      signatureOwnerId: 'btei-neutrality-axiom-maw',
      label: 'Axiomatic Devour',
      description: 'Double Patience on the two highest-Patience front-row units and reduce their attack cooldowns by 2.',
      cooldownCards: 5,
      execute: axiomaticDevourExecute,
    },
    {
      id: 'neutrality-signature-null-sovereigns-decree',
      setId: 'Neutrality',
      slot: 3,
      signatureOwnerId: 'inf-sovereign-void',
      label: "Null Sovereign's Decree",
      description: 'Consume all Patience and gain Oblivion equal to total Patience × 700 × resonance multiplier. Reusable after its cooldown.',
      cooldownCards: 10,
      execute: nullSovereignsDecreeExecute,
    },
    {
      id: 'neutrality-signature-ruptured-continuum',
      setId: 'Neutrality',
      slot: 3,
      signatureOwnerId: 'inf-eternity-rupture',
      label: 'Ruptured Continuum',
      description: 'Halve Patience, convert the consumed half into Oblivion, and draw 4 cards. Reusable after its cooldown.',
      cooldownCards: 10,
      execute: rupturedContinuumExecute,
    },
    {
      id: 'neutrality-signature-aegis-uprising',
      setId: 'Neutrality',
      slot: 3,
      signatureOwnerId: 'tx-angel-starbound-null-archangel',
      label: 'Aegis Uprising',
      description: 'Find the lowest Patience among your front-row units and grant every unit that value × 3. Requires a Transcendent Angel on your board.',
      cooldownCards: 10,
      execute: aegisUprisingExecute,
    },
  ],
};

// ── Registration ───────────────────────────────────────────────────────────────

registerSet(NEUTRALITY_SET);

export { NEUTRALITY_SET };
