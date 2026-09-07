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
  if (def.type === 'Light') return def.onFlipEffects ?? [];
  if (def.type === 'Dark') return def.sophEffects;
  return def.onPlayEffects ?? def.onSummonEffects;
}

export function classifyCardActionClass(def: CardDefinition, effects: CardEffect[]): ActionClass {
  if (def.rarity === 'Infinite') return 'finisher';
  if (effects.some(effect => effect.type === 'salvage_any' || effect.type === 'salvage_by_type' || effect.type === 'discard_draw')) {
    return 'refund';
  }
  if (effects.some(effect => effect.type === 'draw' || effect.type === 'look_top_take' || effect.type === 'look_top_take_drop' || effect.type === 'look_top_take_type' || effect.type === 'search_deck_by_type' || effect.type === 'shuffle_discard')) {
    return 'setup';
  }
  return 'conversion';
}

export function getCardActionClass(def: CardDefinition): ActionClass {
  return classifyCardActionClass(def, getCardActionClassEffects(def));
}