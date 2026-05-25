import { PACK_DEFINITIONS, STORE_PACK_ORDER } from '@/data/packs/packDefinitions';
import { getUtcDayIndex } from './dailyLogin';
import { getSpotlightPackId } from './spotlightPack';

/**
 * Daily Deal — one rotating featured pack at 20% off, daily-seeded.
 * Picks a different pack from the weekly spotlight so both can promote
 * different content on the same day.
 */

export const DAILY_DEAL_DISCOUNT = 0.2;

export function getDailyDealPackId(now: number = Date.now()): string | null {
  if (PACK_DEFINITIONS.length === 0) return null;
  const day = getUtcDayIndex(now);
  const candidates = STORE_PACK_ORDER.filter(id => {
    const p = PACK_DEFINITIONS.find(d => d.id === id);
    return p && !p.locked;
  });
  const list = candidates.length > 0 ? candidates : STORE_PACK_ORDER;
  const spotlightId = getSpotlightPackId(now);
  let x = (day * 1597334677 + 0x9e3779b9) >>> 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  const idx = Math.abs(x) % list.length;
  let pick = list[idx];
  if (pick === spotlightId && list.length > 1) {
    pick = list[(idx + 1) % list.length];
  }
  return pick ?? null;
}

export function getDailyDealCost(baseCost: number): number {
  return Math.max(1, Math.round(baseCost * (1 - DAILY_DEAL_DISCOUNT)));
}
