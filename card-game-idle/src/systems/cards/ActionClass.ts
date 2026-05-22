import type { CardDefinition } from '@/types/cards';
import type { CardEffect } from '@/types/effects';

export type ActionClass = 'setup' | 'conversion' | 'multiplier' | 'refund' | 'finisher';

export const ACTION_CLASS_LABELS: Record<ActionClass, string> = {
  setup: 'Setup',
  conversion: 'Conversion',
  multiplier: 'Multiplier',
  refund: 'Refund',
  finisher: 'Finisher',
};

export function getActionClassLabel(actionClass: ActionClass): string {
  return ACTION_CLASS_LABELS[actionClass];
}

export function getCardActionClassEffects(def: CardDefinition): CardEffect[] {
  if (def.type === 'Seraphim') return def.onPlayEffects;
  if (def.type === 'Cherubim') return def.onPlayEffects;
  if (def.type === 'Angel') return def.onSummonEffects;
  return def.effects;
}

export function classifyCardActionClass(def: CardDefinition, effects: CardEffect[]): ActionClass {
  if (def.rarity === 'Infinite') return 'finisher';
  if (effects.some(effect => effect.type === 'multiply_next' || effect.type === 'chain_gain' || effect.type === 'chain_multiplier_set')) {
    return 'multiplier';
  }
  if (effects.some(effect => effect.type === 'salvage_any' || effect.type === 'salvage_by_type' || effect.type === 'discard_draw' || effect.type === 'copy_last_hr')) {
    return 'refund';
  }
  if (effects.some(effect => effect.type === 'draw' || effect.type === 'look_top_take' || effect.type === 'look_top_take_drop' || effect.type === 'look_top_take_type' || effect.type === 'search_deck_by_type' || effect.type === 'shuffle_discard')) {
    return 'setup';
  }
  if (effects.some(effect => effect.type === 'oblivion_flat' || effect.type === 'score_flat' || effect.type === 'radiance_gain' || effect.type === 'radiance_spend' || effect.type === 'ember_gain' || effect.type === 'ember_spend' || effect.type === 'prismatic_light_gain' || effect.type === 'prismatic_light_spend' || effect.type === 'monochromatic_shards_gain' || effect.type === 'arctic_charge_gain' || effect.type === 'arctic_charge_discharge' || effect.type === 'proof_gain' || effect.type === 'bloom_gain' || effect.type === 'bloom_harvest' || effect.type === 'trail_gain' || effect.type === 'trail_spend' || effect.type === 'strain_gain' || effect.type === 'strain_vent' || effect.type === 'overclock')) {
    return 'conversion';
  }
  return 'conversion';
}

export function getCardActionClass(def: CardDefinition): ActionClass {
  return classifyCardActionClass(def, getCardActionClassEffects(def));
}