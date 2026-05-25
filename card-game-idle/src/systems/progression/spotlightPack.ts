import { PACK_DEFINITIONS, STORE_PACK_ORDER } from '@/data/packs/packDefinitions';
import { getUtcDayIndex } from './dailyLogin';

/**
 * Rotating spotlight pack — one pack each UTC week is "featured" with a
 * discount + a small icon. Stateless / derived.
 */

export const SPOTLIGHT_DISCOUNT = 0.2; // 20% off

export function getSpotlightPackId(now: number = Date.now()): string | null {
  if (PACK_DEFINITIONS.length === 0) return null;
  const day = getUtcDayIndex(now);
  const week = Math.floor(day / 7);
  // Filter to unlocked-by-default packs first so the spotlight is always
  // actually purchasable.
  const candidates = STORE_PACK_ORDER.filter(id => {
    const p = PACK_DEFINITIONS.find(d => d.id === id);
    return p && !p.locked;
  });
  const list = candidates.length > 0 ? candidates : STORE_PACK_ORDER;
  // Stable hash of week
  let x = (week * 2654435761 + 17) >>> 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  const idx = Math.abs(x) % list.length;
  return list[idx] ?? null;
}

export function getSpotlightPackCost(baseCost: number): number {
  return Math.max(1, Math.round(baseCost * (1 - SPOTLIGHT_DISCOUNT)));
}
