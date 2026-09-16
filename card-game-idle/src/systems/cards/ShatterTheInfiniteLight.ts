import type { BoardState } from '@/types/game';

/** Fade-to-black priming beat before the click window opens. */
export const SHATTER_PRIME_MS = 1100;
/** Length of the glowing-star click window. */
export const SHATTER_ACTIVE_MS = 10000;
/** Fade-to-white + "Shattered!!" payout beat before the board returns to normal. */
export const SHATTER_RESULT_MS = 2600;

/**
 * "Shatter the Infinite Light" only appears once the front row is entirely
 * filled with Ain Soph Aur cards and the back row is entirely filled with
 * Light/Dark cards that have already been flipped to their active Ain side.
 */
export function canActivateShatterTheInfiniteLight(board: BoardState): boolean {
  const frontFull = board.frontSlots.every(slot => slot !== null);
  const backFullAinActive = board.backSlots.every(slot => (
    !!slot
    && (slot.type === 'Light' || slot.type === 'Dark')
    && slot.side === 'ain'
    && slot.faceState === 'front'
  ));
  return frontFull && backFullAinActive;
}
