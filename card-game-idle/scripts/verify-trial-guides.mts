/**
 * Verifies each trial deck's guided sequence is playable.
 * Run: npx tsx scripts/verify-trial-guides.mts
 */

import { TRIAL_DECK_DEFINITIONS } from '../src/data/trialDecks';
import { CardRegistry } from '../src/cards/CardRegistry';
import type { TrialDeckDefinition } from '../src/types/game';
import type { CardEffect } from '../src/types/effects';

function effectsDrawTotal(effects: readonly CardEffect[] | undefined): number {
  if (!effects) return 0;
  let total = 0;
  for (const e of effects) {
    const t = (e as { type: string }).type;
    if (t === 'draw') total += (e as { value: number }).value;
    else if (t === 'top_deck_choice') total += (e as { take?: number }).take ?? 1;
    else if (t === 'draw_first_card_bonus') total += (e as { value: number }).value;
    else if (t === 'discard_then_draw') {
      const draw = (e as { drawCount?: number }).drawCount ?? 0;
      const discard = (e as { discardCount?: number }).discardCount ?? 0;
      total += draw - discard;
    }
    else if (t === 'discard_draw') {
      const draw = (e as { draw?: number }).draw ?? 0;
      const discard = (e as { discard?: number }).discard ?? 0;
      total += draw - discard;
    }
  }
  return total;
}

function getCardEffects(definitionId: string): CardEffect[] {
  const def = CardRegistry.get(definitionId);
  if (!def) return [];
  const out: CardEffect[] = [];
  const a = (def as { effects?: CardEffect[] }).effects;
  const b = (def as { onPlayEffects?: CardEffect[] }).onPlayEffects;
  const c = (def as { onPlay?: CardEffect[] }).onPlay;
  if (a) out.push(...a);
  if (b) out.push(...b);
  if (c) out.push(...c);
  return out;
}

/**
 * Returns the set of cardDefinitionIds that future steps (i+1..end) will need
 * to find in hand. Used to choose optimally during search/look effects.
 */
function futureNeeds(trial: TrialDeckDefinition, fromStep: number): Set<string> {
  const out = new Set<string>();
  for (let i = fromStep; i < trial.guideSteps.length; i++) {
    out.add(trial.guideSteps[i].cardDefinitionId);
  }
  return out;
}

function cardMatchesFilter(definitionId: string, filter: string[]): boolean {
  const def = CardRegistry.get(definitionId);
  if (!def) return false;
  const type = (def as { type?: string }).type;
  return filter.includes(type ?? '');
}

interface SimResult {
  trialPackId: string;
  errors: string[];
  warnings: string[];
}

function simulateTrial(trial: TrialDeckDefinition): SimResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const deckListCounts = new Map<string, number>();
  for (const entry of trial.deckList) {
    deckListCounts.set(entry.definitionId, (deckListCounts.get(entry.definitionId) ?? 0) + entry.copies);
  }
  const handCounts = new Map<string, number>();
  for (const id of trial.guidedOpeningHand) {
    handCounts.set(id, (handCounts.get(id) ?? 0) + 1);
  }
  const orderCounts = new Map<string, number>();
  for (const entry of trial.guidedDeckOrder) {
    orderCounts.set(entry.definitionId, (orderCounts.get(entry.definitionId) ?? 0) + entry.copies);
  }

  if (trial.guidedOpeningHand.length !== 5) {
    errors.push(`Opening hand has ${trial.guidedOpeningHand.length} cards, expected 5`);
  }

  const orderTotal = trial.guidedDeckOrder.reduce((s, e) => s + e.copies, 0);
  if (orderTotal !== 45) errors.push(`guidedDeckOrder totals ${orderTotal}, expected 45`);

  const deckListTotal = trial.deckList.reduce((s, e) => s + e.copies, 0);
  if (deckListTotal !== 50) errors.push(`deckList totals ${deckListTotal}, expected 50`);

  for (const [id, deckCount] of deckListCounts) {
    const total = (handCounts.get(id) ?? 0) + (orderCounts.get(id) ?? 0);
    if (total !== deckCount) {
      errors.push(`Card ${id}: deckList=${deckCount} but hand+order=${total}`);
    }
  }
  for (const id of orderCounts.keys()) {
    if (!deckListCounts.has(id)) errors.push(`Card ${id} in guidedDeckOrder but not in deckList`);
  }
  for (const id of handCounts.keys()) {
    if (!deckListCounts.has(id)) errors.push(`Card ${id} in guidedOpeningHand but not in deckList`);
  }

  // Resource pools tracked during the simulated guide run. Used at end to
  // verify the player can actually FIRE at least one Seraphim attack.
  const resources: Record<string, number> = {
    radiance: 0, ember: 0, trail: 0, strain: 0,
  };
  const seraphimPlayed: string[] = [];

  const drawPile: string[] = [];
  for (const entry of trial.guidedDeckOrder) {
    for (let i = 0; i < entry.copies; i++) drawPile.push(entry.definitionId);
  }

  // Simulate the store's opening-hand override (store.ts lines ~4943-4965):
  // For each opening hand definitionId, findIndex in drawPile and splice it out.
  // This shifts all cards after the spliced position up, changing what's on top.
  // If a card isn't in drawPile, the game fabricates a fresh instance (valid when
  // deckList includes the card but guidedDeckOrder doesn't — already covered by
  // the hand+order=deckList check above).
  const hand: string[] = [];
  for (const defId of trial.guidedOpeningHand) {
    const idx = drawPile.indexOf(defId);
    if (idx !== -1) drawPile.splice(idx, 1);
    hand.push(defId);
  }

  for (let i = 0; i < trial.guideSteps.length; i++) {
    const step = trial.guideSteps[i];
    const idx = hand.indexOf(step.cardDefinitionId);
    if (idx === -1) {
      errors.push(`Step ${i + 1}: card ${step.cardDefinitionId} NOT in hand. Hand: [${hand.join(', ')}]`);
      return { trialPackId: trial.packId, errors, warnings };
    }
    hand.splice(idx, 1);

    // Track Seraphim plays for end-of-guide attack-affordability check.
    {
      const playedDef = CardRegistry.get(step.cardDefinitionId) as { type?: string } | undefined;
      if (playedDef?.type === 'Seraphim') seraphimPlayed.push(step.cardDefinitionId);
    }

    // Execute every effect on the played card and apply its impact to hand/drawPile.
    const effects = getCardEffects(step.cardDefinitionId);
    const needs = futureNeeds(trial, i + 1);

    // Walk effects (including inside `conditional` branches, optimistically taken).
    const walk: CardEffect[] = [];
    for (const e of effects) {
      walk.push(e);
      const cond = e as { type: string; then?: CardEffect[] };
      if (cond.type === 'conditional' && Array.isArray(cond.then)) walk.push(...cond.then);
    }

    for (const e of walk) {
      const t = (e as { type: string }).type;

      // Resource accounting — generic `<resource>_gain` / `<resource>_spend`.
      const gainMatch = t.match(/^(\w+?)_gain$/);
      const spendMatch = t.match(/^(\w+?)_spend$/);
      if (gainMatch && typeof (e as { value?: number }).value === 'number') {
        const key = gainMatch[1];
        resources[key] = (resources[key] ?? 0) + (e as { value: number }).value;
      } else if (spendMatch && typeof (e as { value?: number }).value === 'number') {
        const key = spendMatch[1];
        resources[key] = (resources[key] ?? 0) - (e as { value: number }).value;
      }

      if (t === 'draw') {
        const n = (e as { value: number }).value;
        for (let d = 0; d < n; d++) {
          const next = drawPile.shift();
          if (next === undefined) { warnings.push(`Step ${i + 1}: draw ran out during ${step.cardDefinitionId}`); break; }
          hand.push(next);
        }
      } else if (t === 'top_deck_choice') {
        const take = (e as { take?: number }).take ?? 1;
        for (let d = 0; d < take; d++) {
          const next = drawPile.shift();
          if (next === undefined) break;
          hand.push(next);
        }
      } else if (t === 'draw_first_card_bonus') {
        const n = (e as { value: number }).value;
        for (let d = 0; d < n; d++) {
          const next = drawPile.shift();
          if (next === undefined) break;
          hand.push(next);
        }
      } else if (t === 'discard_then_draw') {
        const draw = (e as { drawCount?: number }).drawCount ?? 0;
        for (let d = 0; d < draw; d++) {
          const next = drawPile.shift();
          if (next === undefined) break;
          hand.push(next);
        }
      } else if (t === 'discard_draw') {
        const draw = (e as { draw?: number }).draw ?? 0;
        for (let d = 0; d < draw; d++) {
          const next = drawPile.shift();
          if (next === undefined) break;
          hand.push(next);
        }
      } else if (t === 'look_top_take' || t === 'look_top_take_drop') {
        // Look at top `look` cards. Take `take` (best-effort: prefer ones future steps need).
        // For look_top_take: rest go to bottom.
        // For look_top_take_drop: `drop` go to bottom, rest discarded.
        const look = (e as { look: number }).look;
        const take = (e as { take: number }).take;
        const drop = (e as { drop?: number }).drop ?? 0;
        const peek = drawPile.splice(0, Math.min(look, drawPile.length));
        // Choose optimally: pick `take` cards needed by future steps first.
        const taken: string[] = [];
        const remaining: string[] = [];
        for (const c of peek) {
          if (taken.length < take && needs.has(c) && !taken.includes(c)) taken.push(c);
          else remaining.push(c);
        }
        // Fill remaining take slots from leftover if needed.
        while (taken.length < take && remaining.length > 0) {
          taken.push(remaining.shift()!);
        }
        for (const c of taken) hand.push(c);
        // Bottom: for look_top_take, all `remaining` go to bottom. For look_top_take_drop, only first `drop`.
        if (t === 'look_top_take') {
          drawPile.push(...remaining);
        } else {
          drawPile.push(...remaining.slice(0, drop));
          // rest discarded — gone
        }
      } else if (t === 'search_deck_by_type' || t === 'search_deck') {
        // Player picks any card in deck matching `filter`. Optimistic: pick one that a future step needs.
        const filter = (e as { filter: string[] }).filter;
        let pickIdx = -1;
        // Prefer a card that's needed by a future step.
        for (let k = 0; k < drawPile.length; k++) {
          if (needs.has(drawPile[k]) && cardMatchesFilter(drawPile[k], filter)) { pickIdx = k; break; }
        }
        // Otherwise pick any matching card.
        if (pickIdx === -1) {
          for (let k = 0; k < drawPile.length; k++) {
            if (cardMatchesFilter(drawPile[k], filter)) { pickIdx = k; break; }
          }
        }
        if (pickIdx !== -1) {
          const [picked] = drawPile.splice(pickIdx, 1);
          hand.push(picked);
        }
      }
      // Other effect types (oblivion_flat, patience_gain_all, multiply_next, shuffle_discard,
      // salvage_*, conditional, etc.) do not directly add cards to hand from the draw pile
      // in a way that affects future step satisfaction. shuffle_discard would re-mix the
      // pile in real play; for the guided sequence we assume the next-needed cards are
      // still on top (they should be authored that way).
    }
  }

  // ── Attack affordability check ──────────────────────────────────────────────
  // At end of the guided sequence, verify the player can fire AT LEAST ONE
  // attack from a Seraphim that was played during the guide. We assume no
  // Angel is on board (guide sequences don't summon one), so synergized attacks
  // requiring an Angel are skipped.
  if (seraphimPlayed.length > 0) {
    const costMap: Record<string, string> = {
      spend_radiance: 'radiance',
      spend_embers: 'ember',
      spend_trail: 'trail',
      spend_strain: 'strain',
    };
    let anyFirable = false;
    let bestReport = '';
    for (const sid of seraphimPlayed) {
      const def = CardRegistry.get(sid) as { attacks?: unknown } | undefined;
      if (!def?.attacks) continue;
      const atks = Array.isArray(def.attacks)
        ? (def.attacks as Array<{ label?: string; costs?: Array<{ type: string; value: number }>; requiresAngelOnBoard?: boolean }>)
        : Object.values(def.attacks as Record<string, { label?: string; costs?: Array<{ type: string; value: number }>; requiresAngelOnBoard?: boolean }>);
      for (const atk of atks) {
        if (atk.requiresAngelOnBoard) continue;
        const costs = atk.costs ?? [];
        let ok = true;
        const need: string[] = [];
        for (const c of costs) {
          if (c.type === 'discard_from_hand') {
            if (hand.length < c.value) { ok = false; need.push(`discard ${c.value} (hand=${hand.length})`); }
          } else if (c.type === 'sacrifice_seraphim') {
            if (seraphimPlayed.length < c.value + 1) { ok = false; need.push(`sacrifice ${c.value} seraphim (have ${seraphimPlayed.length})`); }
          } else if (c.type === 'sacrifice_angel') {
            ok = false; need.push('sacrifice angel (none on board)');
          } else {
            const resKey = costMap[c.type];
            if (resKey === undefined) continue;
            const have = resources[resKey] ?? 0;
            if (have < c.value) { ok = false; need.push(`${resKey} ${have}/${c.value}`); }
          }
        }
        if (ok) { anyFirable = true; break; }
        if (!bestReport) bestReport = `${sid} ${atk.label ?? '?'}: needs ${need.join(', ')}`;
      }
      if (anyFirable) break;
    }
    if (!anyFirable) {
      const resSummary = Object.entries(resources)
        .filter(([, v]) => v !== 0)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ') || 'none';
      errors.push(`No Seraphim attack is firable at end of guide. Resources: {${resSummary}}. Sample: ${bestReport}`);
    }
  }

  return { trialPackId: trial.packId, errors, warnings };
}

const trials = Object.values(TRIAL_DECK_DEFINITIONS);
let totalErrors = 0;
let totalWarnings = 0;
for (const trial of trials) {
  const result = simulateTrial(trial);
  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log(`OK   ${result.trialPackId}`);
  } else {
    console.log(`FAIL ${result.trialPackId}`);
    for (const e of result.errors) console.log(`  ERROR: ${e}`);
    for (const w of result.warnings) console.log(`  WARN:  ${w}`);
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
  }
}
console.log(`\nTotal: ${trials.length} trials, ${totalErrors} errors, ${totalWarnings} warnings`);
process.exit(totalErrors > 0 ? 1 : 0);
