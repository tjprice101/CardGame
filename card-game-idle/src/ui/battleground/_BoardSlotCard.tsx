/**
 * Shared read-only card-slot rendering used by both OpponentBoardPreview
 * and (in future) a player-side snapshot. Mirrors the visual style of the
 * live BoardDisplay without any interactivity.
 */
import { CardRegistry } from '@/cards/CardRegistry';
import { SET_ACCENT } from '@/data/elements';
import {
  getCardFaceBackgroundStyle,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
  getCardFaceMetrics,
} from '@/ui/cardBackgrounds';
import { uiTypography } from '@/ui/theme';
import type { FrontSlot, BackSlot } from '@/types/game';

const DISPLAY_FONT = uiTypography.display;
const BODY_FONT    = uiTypography.body;

export const SLOT_W       = 118;
export const SLOT_H       = 168;
export const CHERUBIM_W   = 104;
export const CHERUBIM_H   = 148;
export const FRONT_ROW_GAP = 'clamp(12px, 1.4vw, 18px)';
export const BACK_ROW_GAP  = `calc(${FRONT_ROW_GAP} + ${SLOT_W - CHERUBIM_W}px)`;

const FM   = getCardFaceMetrics('board');
const FMM  = getCardFaceMetrics('boardMini');

// ── Front slot ────────────────────────────────────────────────────────────────

export function FrontSlotCard({ slot }: { slot: FrontSlot }) {
  if (!slot) {
    return (
      <div style={{
        width: SLOT_W, height: SLOT_H,
        borderRadius: 14,
        border: '1px dashed rgba(244,244,248,0.12)',
        background: 'rgba(5,5,7,0.15)',
        flexShrink: 0,
      }} />
    );
  }

  const def = CardRegistry.get(slot.definitionId);
  const elColor = SET_ACCENT;
  const typeLabel = slot.type === 'Angel' ? 'Angel' : (def?.type ?? slot.type);

  return (
    <div
      style={{
        width: SLOT_W, height: SLOT_H,
        borderRadius: 14,
        border: `1.5px solid ${elColor}66`,
        boxShadow: `0 0 16px ${elColor}28, 0 8px 22px rgba(0,0,0,0.5)`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        flexShrink: 0,
        ...getCardFaceBackgroundStyle(def ?? undefined, slot.finish, slot.faceState),
      }}
    >
      {/* Element stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${elColor}cc, ${elColor}, ${elColor}cc, transparent)`,
        zIndex: 4, pointerEvents: 'none',
      }} />

      <div style={getCardNameRibbonStyle('board')}>
        <div style={{
          fontSize: FM.typeSize,
          color: '#5c3b2b', letterSpacing: 1.2, textTransform: 'uppercase',
          textAlign: 'center', marginBottom: 2,
          fontFamily: DISPLAY_FONT, fontWeight: 700,
        }}>
          {typeLabel}
        </div>
        <div style={{
          fontSize: FM.nameSize, fontWeight: 'bold', color: '#2b1a12',
          textAlign: 'center', lineHeight: 1.15, fontFamily: DISPLAY_FONT,
        }}>
          {def?.name ?? slot.definitionId}
        </div>
      </div>

      <div style={getCardRulesPanelStyle('board')}>
        <div style={{
          fontSize: FM.descSize, color: '#3a251b',
          textAlign: 'center', fontFamily: BODY_FONT,
          lineHeight: FM.descLineHeight, opacity: 0.75,
        }}>
        </div>
      </div>
    </div>
  );
}

// ── Back slot ─────────────────────────────────────────────────────────────────

export function BackSlotCard({ slot }: { slot: BackSlot }) {
  if (!slot) {
    return (
      <div style={{
        width: CHERUBIM_W, height: CHERUBIM_H,
        borderRadius: 12,
        border: '1px dashed rgba(244,244,248,0.10)',
        background: 'rgba(5,5,7,0.12)',
        flexShrink: 0,
      }} />
    );
  }

  const def = CardRegistry.get(slot.definitionId);
  const elColor = SET_ACCENT;

  return (
    <div
      style={{
        width: CHERUBIM_W, height: CHERUBIM_H,
        borderRadius: 12,
        border: `1.5px solid ${elColor}55`,
        boxShadow: `0 0 12px ${elColor}20, 0 6px 16px rgba(0,0,0,0.45)`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        flexShrink: 0,
        ...getCardFaceBackgroundStyle(def ?? undefined, slot.finish, slot.faceState),
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${elColor}cc, ${elColor}, ${elColor}cc, transparent)`,
        zIndex: 4, pointerEvents: 'none',
      }} />

      <div style={getCardNameRibbonStyle('boardMini')}>
        <div style={{
          fontSize: FMM.typeSize, color: '#5c3b2b', letterSpacing: 1,
          textTransform: 'uppercase', textAlign: 'center', marginBottom: 1,
          fontFamily: DISPLAY_FONT, fontWeight: 700,
        }}>
          {def?.type ?? 'Cherubim'}
        </div>
        <div style={{
          fontSize: FMM.nameSize, fontWeight: 'bold', color: '#2b1a12',
          textAlign: 'center', lineHeight: 1.15, fontFamily: DISPLAY_FONT,
        }}>
          {def?.name ?? slot.definitionId}
        </div>
      </div>

      <div style={getCardRulesPanelStyle('boardMini')}>
        <div style={{
          fontSize: FMM.descSize, color: '#3a251b',
          textAlign: 'center', fontFamily: BODY_FONT, opacity: 0.7,
        }}>
          
          {slot.durability != null ? ` · ${slot.durability}` : ''}
        </div>
      </div>
    </div>
  );
}

// ── Face-down card back ───────────────────────────────────────────────────────

export function FaceDownCard() {
  return (
    <div style={{
      width: 'clamp(96px, 6.8vw, 112px)',
      height: 'clamp(138px, 9.8vw, 160px)',
      borderRadius: 11,
      background: 'linear-gradient(145deg, #1a1040 0%, #0e0820 40%, #1a0e38 100%)',
      border: '1px solid rgba(150,100,255,0.30)',
      boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{
        width: '55%', height: '65%',
        borderRadius: 6,
        border: '1px solid rgba(150,100,255,0.18)',
        background: 'radial-gradient(circle at 50% 40%, rgba(90,50,170,0.22), transparent 70%)',
      }} />
    </div>
  );
}
