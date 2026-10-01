import type { CardDefinition, SpectrumLevel } from '@/types/cards';
import type { TurnState } from '@/types/game';
import { MAX_SPECTRUM_LEVEL, SPECTRUM_RARITY_MIN_LEVEL } from '@/data/cards/spectrumPower';

export { MAX_SPECTRUM_LEVEL };

/** A card's Spectrum Level, never below its rarity floor. */
export function getCardSpectrumLevel(def: Pick<CardDefinition, 'spectrumLevel' | 'rarity'>): SpectrumLevel {
  return Math.max(def.spectrumLevel ?? 0, SPECTRUM_RARITY_MIN_LEVEL[def.rarity] ?? 0) as SpectrumLevel;
}

export function getTurnSpectrumLevel(turn: Pick<TurnState, 'spectrumLevel'>): number {
  return Math.max(0, Math.min(MAX_SPECTRUM_LEVEL, turn.spectrumLevel ?? 0));
}

/** Limitless Light Stacks needed to rise from `currentLevel` to the next level (5, 6, 7, 8, 9). */
export function getSpectrumLevelUpCost(currentLevel: number): number {
  return 5 + Math.max(0, currentLevel);
}

/** Why the player cannot raise their Spectrum Level right now, or null when they can. */
export function getSpectrumLevelUpBlocker(
  turn: Pick<TurnState, 'spectrumLevel' | 'limitlessLightStacks'>,
  handSize: number,
): string | null {
  const level = getTurnSpectrumLevel(turn);
  if (level >= MAX_SPECTRUM_LEVEL) return 'Spectrum Level is already at its maximum (Lv 5)';
  const cost = getSpectrumLevelUpCost(level);
  if ((turn.limitlessLightStacks ?? 0) < cost) return `Requires ${cost} Limitless Light Stacks`;
  if (handSize <= 0) return 'Requires a card in hand to sacrifice to the Light-bound Abyss';
  return null;
}

export function formatSpectrumRequirement(level: number): string {
  return `Requires Spectrum Lv ${level}`;
}
