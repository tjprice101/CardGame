import type { CardRarity, SpectrumLevel } from '@/types/cards';

export type { SpectrumLevel };
export const MAX_SPECTRUM_LEVEL: SpectrumLevel = 5;

/** No card of a rarity may ever require a Spectrum Level below this floor. */
export const SPECTRUM_RARITY_MIN_LEVEL: Record<CardRarity, SpectrumLevel> = {
  Common: 0,
  Rare: 0,
  Epic: 0,
  Legendary: 0,
  Enigmatic: 1,
  Eternal: 2,
  Infinite: 4,
  Transcendent: 5,
};

/** Where a card comes from. Event packs out-scale base packs at the same rarity and level. */
export type SpectrumOrigin = 'base' | 'event' | 'enigma' | 'boss' | 'infinite' | 'forge';

const ORIGIN_BAND_BONUS: Record<SpectrumOrigin, number> = {
  base: 0,
  event: 0.15,
  enigma: 0,
  boss: 0,
  infinite: 0,
  forge: 0,
};

// Non-overlapping Ain-attack bands guarantee every higher rarity out-hits every lower rarity.
const RARITY_AIN_BANDS: Record<CardRarity, readonly [number, number]> = {
  Common: [80, 220],
  Rare: [240, 480],
  Epic: [520, 950],
  Legendary: [1_000, 1_800],
  Enigmatic: [1_900, 3_000],
  Eternal: [3_200, 5_800],
  Infinite: [6_500, 11_000],
  Transcendent: [12_000, 20_000],
};

const SOPH_RATIO = 1.6;
const BRIDGE_RATIO = 2.2;
const SCALING_PER_BASE = 0.00085;

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/** Position (0..1) of a card inside its rarity band, from its level and origin. */
export function getSpectrumBandPosition(rarity: CardRarity, level: SpectrumLevel, origin: SpectrumOrigin): number {
  const floor = SPECTRUM_RARITY_MIN_LEVEL[rarity];
  const span = MAX_SPECTRUM_LEVEL - floor;
  const levelPosition = span <= 0 ? 0.5 : (Math.max(floor, level) - floor) / span;
  return Math.min(1, levelPosition * 0.85 + ORIGIN_BAND_BONUS[origin]);
}

export function getSpectrumAinBase(rarity: CardRarity, level: SpectrumLevel, origin: SpectrumOrigin): number {
  const [low, high] = RARITY_AIN_BANDS[rarity];
  return roundTo(low + (high - low) * getSpectrumBandPosition(rarity, level, origin), 10);
}

export function getSpectrumSophBase(rarity: CardRarity, level: SpectrumLevel, origin: SpectrumOrigin): number {
  return roundTo(getSpectrumAinBase(rarity, level, origin) * SOPH_RATIO, 10);
}

export function getSpectrumBridgeBase(rarity: CardRarity, level: SpectrumLevel, origin: SpectrumOrigin): number {
  return roundTo(getSpectrumAinBase(rarity, level, origin) * BRIDGE_RATIO, 10);
}

/** Collection Power linear multiplier proportional to an attack's base payout. */
export function getSpectrumScaling(baseDivineLight: number): number {
  return Math.round(baseDivineLight * SCALING_PER_BASE * 1000) / 1000;
}

/** Flat Divine Light granted by on-play/on-summon effects at a given power. */
export function getSpectrumFlatDivineLight(rarity: CardRarity, level: SpectrumLevel, origin: SpectrumOrigin, ratio = 0.4): number {
  return roundTo(getSpectrumAinBase(rarity, level, origin) * ratio, 5);
}

export function formatSpectrumNumber(value: number): string {
  return value.toLocaleString('en-US');
}
