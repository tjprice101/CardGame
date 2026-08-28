/**
 * Neutrality Set Abilities — four hotkey-activated abilities gated by deck composition.
 *
 * Cooldowns count cards played from hand (not turns). One-off abilities use
 * maxUsesPerRun: 1 and cannot fire again in the same run once exhausted.
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

// ── Ability implementations ────────────────────────────────────────────────────

/**
 * Slot 1 — Composed Draw (Base, 3 hand-play CD)
 * Draw 2 cards; grant +3 Patience to every unit on the front row.
 */
function composedDrawExecute(s: GameState): void {
  // Draw up to 2 cards from draw pile into hand.
  let drawn = 0;
  while (drawn < 2 && s.deck.drawPile.length > 0) {
    const card = s.deck.drawPile.pop()!;
    s.deck.hand.push(card);
    drawn++;
  }
  // Grant +3 Patience to all front-row units.
  for (const slot of s.board.frontSlots) {
    if (!slot) continue;
    if ('patienceStacks' in slot) {
      (slot as { patienceStacks?: number }).patienceStacks = clampPatience(
        ((slot as { patienceStacks?: number }).patienceStacks ?? 0) + 3
      );
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
 * Slot 3 — Recursive Calm (Infinite, one-off per run)
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
 * Slot 4 — Aegis Uprising (Angel, one-off per run)
 * Find the lowest Patience value among front-row units; grant each unit
 * Patience equal to that minimum × 3.
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

// ── Definition ─────────────────────────────────────────────────────────────────

const NEUTRALITY_SET: SetEngineDefinition = {
  id: 'Neutrality',
  label: 'Neutrality',
  signatureMechanic: 'patience',
  abilities: [
    {
      id: 'neutrality-slot1-composed-draw',
      setId: 'Neutrality',
      slot: 1,
      gate: 'base',
      label: 'Composed Draw',
      description: 'Draw 2 cards and grant +3 Patience to every unit on your front row.',
      cooldownCards: 3,
      execute: composedDrawExecute,
    },
    {
      id: 'neutrality-slot2-vigils-ledger',
      setId: 'Neutrality',
      slot: 2,
      gate: 'eternal',
      label: "Vigil's Ledger",
      description: 'For each front-row unit with ≥20 Patience, grant it +5 Patience. Draw 2 additional cards.',
      cooldownCards: 5,
      execute: vigilsLedgerExecute,
    },
    {
      id: 'neutrality-slot3-recursive-calm',
      setId: 'Neutrality',
      slot: 3,
      gate: 'infinite',
      label: 'Recursive Calm',
      description: 'Once per run: consume all Patience from every front-row unit. Gain Oblivion equal to total Patience × 500 × Mastery Multiplier (up to ×3).',
      cooldownCards: 0,
      maxUsesPerRun: 1,
      execute: recursiveCalmExecute,
    },
    {
      id: 'neutrality-slot4-aegis-uprising',
      setId: 'Neutrality',
      slot: 4,
      gate: 'angel',
      label: 'Aegis Uprising',
      description: 'Once per run: find the lowest Patience on your board and grant every unit that much Patience × 3.',
      cooldownCards: 0,
      maxUsesPerRun: 1,
      execute: aegisUprisingExecute,
    },
  ],
};

// ── Registration ───────────────────────────────────────────────────────────────

registerSet(NEUTRALITY_SET);

export { NEUTRALITY_SET };
