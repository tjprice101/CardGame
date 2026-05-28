/**
 * OpponentBoardPreview - read-only board display for the opponent in a
 * Battleground match. Renders their front slots (Seraphim / Angel) and
 * back slots (Cherubim) using the same card-face pipeline as the live board.
 *
 * The whole display is rotated 180 degrees so it faces the player head-to-head.
 */
import { uiTypography } from '@/ui/theme';
import type { BoardState } from '@/types/game';
import {
  FrontSlotCard,
  BackSlotCard,
  FRONT_ROW_GAP,
  BACK_ROW_GAP,
  SLOT_W,
  CHERUBIM_W,
} from './_BoardSlotCard';

const DISPLAY_FONT = uiTypography.display;

const EMPTY_FRONT = [null, null, null, null, null] as BoardState['frontSlots'];
const EMPTY_BACK  = [null, null, null, null]       as BoardState['backSlots'];

interface Props {
  board: BoardState | null;
  handSize: number;
  handEmpty: boolean;
}

export default function OpponentBoardPreview({ board, handSize, handEmpty }: Props) {
  const frontSlots = board?.frontSlots ?? EMPTY_FRONT;
  const backSlots  = board?.backSlots  ?? EMPTY_BACK;
  const cappedHand = Math.max(0, Math.min(handSize, 12));

  // Rotate 180 degrees so the board faces the player head-to-head.
  // Inside the rotated container the order is: hand indicator -> back row -> front row,
  // which after the flip reads: front row -> back row -> hand indicator at top.
  return (
    <div style={{
      transform: 'rotate(180deg)',
      // zoom scales the entire board to ~70% so it fits in the reduced section height
      zoom: 0.90,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'clamp(6px, 1vh, 10px)',
      width: '100%',
      padding: '4px 16px 0',
      boxSizing: 'border-box',
    }}>

      {/* Front row (Seraphim / Angel) - rendered FIRST so it ends up at the
          BOTTOM after rotate(180deg), directly facing the player's front row. */}
      <div style={{
        display: 'flex',
        gap: FRONT_ROW_GAP,
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}>
        {frontSlots.map((slot, i) => <FrontSlotCard key={i} slot={slot} />)}
      </div>

      {/* Back row (Cherubim) */}
      <div style={{
        display: 'flex',
        gap: BACK_ROW_GAP,
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingInline: `calc((${SLOT_W}px - ${CHERUBIM_W}px) / 2)`,
      }}>
        {backSlots.map((slot, i) => <BackSlotCard key={i} slot={slot} />)}
      </div>

      {/* Compact hand indicator — replaces face-down card graphics to save height */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 18,
      }}>
        {handEmpty ? (
          <div style={{
            fontSize: '0.6rem', letterSpacing: 2, textTransform: 'uppercase',
            color: '#ff6b6b', fontFamily: DISPLAY_FONT, opacity: 0.85,
          }}>
            Hand Empty
          </div>
        ) : !board ? (
          <div style={{
            fontSize: '0.6rem', letterSpacing: 1.5,
            color: 'rgba(244,244,248,0.3)', fontFamily: DISPLAY_FONT,
          }}>
            Waiting…
          </div>
        ) : (
          <div style={{
            fontSize: '0.6rem', letterSpacing: 1.5, textTransform: 'uppercase',
            color: 'rgba(244,244,248,0.35)', fontFamily: DISPLAY_FONT,
          }}>
            {cappedHand} in hand
          </div>
        )}
      </div>

    </div>
  );
}