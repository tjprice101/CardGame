/**
 * Lists every Cherubim/Seraphim/Ophanim with its draw value and key payoff effects.
 * Helps design trial sequences quickly.
 *
 * Run: npx tsx scripts/list-card-draws.mts <prefix>
 *   e.g. npx tsx scripts/list-card-draws.mts ser-light
 */

import { CardRegistry } from '../src/cards/CardRegistry';
import type { CardEffect } from '../src/types/effects';

const prefix = process.argv[2] ?? '';

function effectsDrawTotal(effects: readonly CardEffect[] | undefined): number {
  if (!effects) return 0;
  let total = 0;
  for (const e of effects) {
    const t = (e as { type: string }).type;
    if (t === 'draw') total += (e as { value: number }).value;
    else if (t === 'top_deck_choice') total += (e as { take?: number }).take ?? 1;
    else if (t === 'draw_first_card_bonus') total += (e as { value: number }).value;
    else if (t === 'discard_then_draw' || t === 'discard_draw') {
      const draw = (e as { drawCount?: number; draw?: number }).drawCount ?? (e as { draw?: number }).draw ?? 0;
      const discard = (e as { discardCount?: number; discard?: number }).discardCount ?? (e as { discard?: number }).discard ?? 0;
      total += draw - discard;
    }
  }
  return total;
}

function payoffEffectTypes(effects: readonly CardEffect[] | undefined): string[] {
  if (!effects) return [];
  const interesting = new Set([
    'pyro_window_cashout', 'cashout', 'eternal_stack_cashout',
    'pyro_abyss_fault_spend', 'voltage_discharge', 'oblivion_flat',
    'multiply_next', 'multiply_attacks', 'next_attack_oblivion_bonus',
    'glass_proof_cashout', 'spectrum_cashout', 'dream_burst',
    'wuas_aeolian_nova', 'spiral_memory_bloom_replay', 'overcurrent_chorus',
    'trail_spend', 'tbp_harrow_psalm', 'strain_vent', 'furnace_sync',
  ]);
  const found: string[] = [];
  for (const e of effects) {
    const t = (e as { type: string }).type;
    if (interesting.has(t) || t.includes('cashout') || t.includes('spend') || t.includes('vent') || t.includes('payoff')) {
      const v = (e as { value?: number; oblivionPerWindow?: number; oblivionPerStack?: number; oblivionPerPair?: number }).value
        ?? (e as { oblivionPerWindow?: number }).oblivionPerWindow
        ?? (e as { oblivionPerStack?: number }).oblivionPerStack
        ?? (e as { oblivionPerPair?: number }).oblivionPerPair
        ?? '';
      found.push(`${t}(${v})`);
    }
  }
  return found;
}

const all = CardRegistry.getAll();
const filtered = all.filter(c => c.definitionId.includes(prefix));
filtered.sort((a, b) => a.definitionId.localeCompare(b.definitionId));

for (const def of filtered) {
  const a = (def as { effects?: CardEffect[] }).effects;
  const b = (def as { onPlayEffects?: CardEffect[] }).onPlayEffects;
  const c = (def as { onPlay?: CardEffect[] }).onPlay;
  const draw = effectsDrawTotal(a) + effectsDrawTotal(b) + effectsDrawTotal(c);
  const payoffs = [...payoffEffectTypes(a), ...payoffEffectTypes(b), ...payoffEffectTypes(c)];
  const tag = draw > 0 ? `[DRAW+${draw}]` : '         ';
  const payoffStr = payoffs.length > 0 ? ` | ${payoffs.join(', ')}` : '';
  console.log(`${tag} ${def.type.padEnd(8)} ${def.definitionId.padEnd(48)} ${(def as { rarity?: string }).rarity ?? ''}${payoffStr}`);
}
