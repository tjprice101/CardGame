import { useState } from 'react';
import { useStore, selectTurn, selectDeck, selectBossFight } from '@/state/store';
import { ELEMENT_COLORS, ELEMENT_SET_NAMES } from '@/data/elements';
import { CardRegistry } from '@/cards/CardRegistry';
import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';
import { uiTypography } from '@/ui/theme';
import ScoreDisplay from './ScoreDisplay';
import AngelStatPanel from './AngelStatPanel';
import HandDisplay from './HandDisplay';
import RadianceDisplay from './RadianceDisplay';
import EmberDisplay from './EmberDisplay';
import TrailDisplay from './TrailDisplay';
import StrainDisplay from './StrainDisplay';
import DeckStatus from './DeckStatus';
import SetEngineDisplay from './SetEngineDisplay';
import TurnControls from './TurnControls';
import BoardDisplay from './BoardDisplay';
import PendingEffectModal from './PendingEffectModal';

/**
 * Top status bar — slim full-width chrome strip at the top of the arena.
 * Left third: SET · TURN N · PHASE (cinematic title, replaces the floating
 * turn header from ArenaShell). Right third: utility icon toolbar (Set
 * Engines, How-to-Play, future menu items). Center is reserved for the
 * floating ScoreDisplay which sits behind this bar at top-center.
 */
function TopStatusBar({ onToggleSetEngines, setEnginesOpen }: {
  onToggleSetEngines: () => void;
  setEnginesOpen: boolean;
}) {
  const turn = useStore(selectTurn);
  const deck = useStore(selectDeck);
  const bossFight = useStore(selectBossFight);

  // Resolve dominant element for tint (mirrors ArenaShell logic, lightweight).
  let dominantEl: string | null = null;
  if (bossFight.mode === 'active' && bossFight.activeBossId) {
    const boss = BOSS_DEFINITIONS.find(b => b.id === bossFight.activeBossId);
    if (boss) {
      dominantEl = Object.keys(ELEMENT_SET_NAMES).find(k => ELEMENT_SET_NAMES[k] === boss.category) ?? null;
    }
  }
  if (!dominantEl) {
    const counts: Record<string, number> = {};
    for (const entry of deck.deckList) {
      const def = CardRegistry.get(entry.definitionId);
      if (def?.element) counts[def.element] = (counts[def.element] ?? 0) + entry.copies;
    }
    let best = 0;
    for (const [el, n] of Object.entries(counts)) {
      if (n > best) { best = n; dominantEl = el; }
    }
  }
  const tint = dominantEl ? ELEMENT_COLORS[dominantEl] ?? '#9090a8' : '#9090a8';
  const setName = dominantEl ? ELEMENT_SET_NAMES[dominantEl] ?? dominantEl : 'Arena';
  const isBoss = bossFight.mode === 'active';
  const tintCss = isBoss ? '#ff6b6b' : tint;
  const phaseLabel = turn.phase === 'mulligan' ? 'Mulligan' : turn.phase === 'playing' ? 'Playing' : 'Idle';

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 52,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 22px',
      background: 'linear-gradient(180deg, rgba(5,5,7,0.92) 0%, rgba(5,5,7,0.4) 75%, transparent 100%)',
      borderBottom: `1px solid rgba(244,244,248,0.06)`,
      pointerEvents: 'none',
      zIndex: 15,
      fontFamily: uiTypography.body,
    }}>
      {/* Left — set · turn · phase */}
      <div
        key={`hdr-${turn.turnNumber ?? 1}-${turn.phase}`}
        style={{
          display: 'flex', alignItems: 'baseline', gap: 14,
          animation: 'turnHeaderFadeIn 0.9s cubic-bezier(0.22,0.61,0.36,1) both',
        }}
      >
        <span style={{
          fontFamily: uiTypography.display, fontSize: 14, letterSpacing: 5,
          color: 'rgba(244,244,248,0.96)', textTransform: 'uppercase',
          textShadow: `0 0 14px ${tintCss}66, 0 0 28px rgba(244,244,248,0.18)`,
        }}>
          Turn {turn.turnNumber ?? 1}
        </span>
        <span style={{
          width: 1, height: 14, background: 'rgba(244,244,248,0.25)',
        }} />
        <span style={{
          fontSize: 10, letterSpacing: 4, textTransform: 'uppercase',
          color: 'rgba(244,244,248,0.6)',
        }}>
          {setName}
        </span>
        <span style={{
          fontSize: 10, letterSpacing: 3, textTransform: 'uppercase',
          color: `${tintCss}cc`,
        }}>
          · {phaseLabel}
        </span>
      </div>

      {/* Right — utility icon toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
        <IconButton
          label="Set Engines"
          glyph="⚙"
          active={setEnginesOpen}
          tint={tintCss}
          onClick={onToggleSetEngines}
        />
      </div>
    </div>
  );
}

/** Compact circular icon button used in the top toolbar. */
function IconButton({ label, glyph, active, tint, onClick }: {
  label: string;
  glyph: string;
  active: boolean;
  tint: string;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={label}
      aria-label={label}
      style={{
        width: 36, height: 36, borderRadius: 10,
        background: active
          ? `linear-gradient(180deg, ${tint}40, rgba(5,5,7,0.92))`
          : 'rgba(5,5,7,0.72)',
        border: active
          ? `1px solid ${tint}cc`
          : hover
            ? '1px solid rgba(244,244,248,0.45)'
            : '1px solid rgba(244,244,248,0.18)',
        color: 'rgba(244,244,248,0.92)',
        fontSize: 16,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: active
          ? `0 0 14px ${tint}66, inset 0 1px 0 rgba(244,244,248,0.1)`
          : hover
            ? '0 0 12px rgba(244,244,248,0.18), inset 0 1px 0 rgba(244,244,248,0.08)'
            : 'inset 0 1px 0 rgba(244,244,248,0.06)',
        transition: 'background 0.18s, border-color 0.18s, box-shadow 0.18s, transform 0.12s',
        transform: hover ? 'translateY(-1px)' : 'none',
      }}
    >
      {glyph}
    </button>
  );
}

/**
 * Cosmetic vertical chrome rail framing the left-edge resource orbs
 * (Radiance / Ember / Trail / Strain). Behind the orbs themselves — they
 * remain absolutely-positioned individually. Gives the four free-floating
 * orbs a unified column identity instead of looking scattered.
 */
function LeftRailFrame() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: 8, top: 'clamp(180px, 22vh, 260px)', bottom: 'clamp(210px, 26vh, 280px)',
        width: 80,
        background: 'linear-gradient(180deg, rgba(5,5,7,0.4) 0%, rgba(5,5,7,0.62) 50%, rgba(5,5,7,0.4) 100%)',
        border: '1px solid rgba(244,244,248,0.08)',
        borderRadius: 18,
        boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(244,244,248,0.05)',
        backdropFilter: 'blur(6px)',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {/* Top accent cap */}
      <div style={{
        position: 'absolute', top: -1, left: '12%', right: '12%', height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(244,244,248,0.5), transparent)',
      }} />
      {/* Bottom accent cap */}
      <div style={{
        position: 'absolute', bottom: -1, left: '12%', right: '12%', height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(244,244,248,0.5), transparent)',
      }} />
    </div>
  );
}

/**
 * Hand pedestal — a subtle altar-platform frame behind the bottom hand
 * strip. Gives the cards a defined surface instead of floating in fade.
 * Element-agnostic chrome-white edge with soft underglow.
 */
function HandPedestal() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        bottom: 6,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(1100px, calc(100vw - 360px))',
        height: 220,
        background: 'linear-gradient(180deg, transparent 0%, rgba(5,5,7,0.55) 30%, rgba(5,5,7,0.85) 100%)',
        borderTop: '1px solid rgba(244,244,248,0.14)',
        borderLeft: '1px solid rgba(244,244,248,0.06)',
        borderRight: '1px solid rgba(244,244,248,0.06)',
        borderRadius: '22px 22px 0 0',
        boxShadow: '0 -8px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(244,244,248,0.06)',
        pointerEvents: 'none',
        zIndex: 8,
      }}
    >
      {/* Center chrome accent line — implies an altar's central spine */}
      <div style={{
        position: 'absolute', top: -1, left: '25%', right: '25%', height: 1,
        background: 'linear-gradient(90deg, transparent 0%, rgba(244,244,248,0.45) 30%, rgba(244,244,248,0.9) 50%, rgba(244,244,248,0.45) 70%, transparent 100%)',
      }} />
    </div>
  );
}

/**
 * Bottom-right hero End-Turn / Begin-Turn / Mulligan-Confirm slot.
 * Wraps the existing TurnControls component in a corner-anchored container
 * styled like a finishing-move panel — isolated from the deck pills.
 */
function EndTurnHero() {
  return (
    <div
      style={{
        position: 'absolute',
        right: 22, bottom: 22,
        width: 220,
        pointerEvents: 'auto',
        zIndex: 16,
      }}
    >
      <TurnControls />
    </div>
  );
}

/**
 * Centered overlay panel that hosts the SetEngineDisplay reference content.
 * Triggered by the ⚙ icon in the top toolbar. Backdrop dims the arena.
 */
function SetEnginesOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 150,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 50%, rgba(5,5,7,0.78) 0%, rgba(5,5,7,0.92) 100%)',
        backdropFilter: 'blur(4px)',
        animation: 'turnHeaderFadeIn 0.35s ease-out',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(520px, 92vw)',
          maxHeight: '82vh',
          padding: '18px 14px 14px',
          background: 'linear-gradient(180deg, rgba(14,14,22,0.98), rgba(5,5,7,0.98))',
          border: '1px solid rgba(244,244,248,0.18)',
          borderRadius: 18,
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 36px rgba(160,160,255,0.12), inset 0 1px 0 rgba(244,244,248,0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: '8%', right: '8%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(244,244,248,0.7), transparent)',
        }} />
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close Set Engines"
          style={{
            position: 'absolute', top: 10, right: 12,
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(5,5,7,0.72)',
            border: '1px solid rgba(244,244,248,0.2)',
            color: 'rgba(244,244,248,0.85)',
            fontSize: 16, lineHeight: 1, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2,
          }}
        >
          ×
        </button>
        <div style={{ overflowY: 'auto', maxHeight: 'calc(82vh - 36px)' }}>
          <SetEngineDisplay />
        </div>
      </div>
    </div>
  );
}

export default function HUD() {
  const [setEnginesOpen, setSetEnginesOpen] = useState(false);

  return (
    <>
      {/* Cosmetic chrome frames (behind everything functional) */}
      <LeftRailFrame />
      <HandPedestal />

      {/* Core play surfaces */}
      <BoardDisplay />
      <ScoreDisplay />
      <AngelStatPanel />
      <RadianceDisplay />
      <EmberDisplay />
      <TrailDisplay />
      <StrainDisplay />

      {/* Top status bar — set · turn · phase (left), toolbar (right) */}
      <TopStatusBar
        onToggleSetEngines={() => setSetEnginesOpen(v => !v)}
        setEnginesOpen={setEnginesOpen}
      />

      {/* Deck pills — top-right, slim isolated cluster (no big glass box) */}
      <div style={{
        position: 'absolute',
        top: 64, right: 18,
        width: 220,
        pointerEvents: 'auto',
        zIndex: 14,
      }}>
        <DeckStatus />
      </div>

      {/* Hand strip — anchored bottom-center inside the pedestal */}
      <HandDisplay />

      {/* End Turn hero — bottom-right corner finishing-move slot */}
      <EndTurnHero />

      {/* Set Engines overlay — opens on ⚙ toggle */}
      <SetEnginesOverlay open={setEnginesOpen} onClose={() => setSetEnginesOpen(false)} />

      {/* Pending-effect modal stays last so it floats above everything */}
      <PendingEffectModal />
    </>
  );
}
