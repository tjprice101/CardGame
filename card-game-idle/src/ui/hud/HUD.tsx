import { useState } from 'react';
import { useStore, selectTurn, selectBossFight, selectBattleground } from '@/state/store';
import { SET_ACCENT, SET_LABEL } from '@/data/elements';
import { uiTypography } from '@/ui/theme';
import ScoreDisplay from './ScoreDisplay';
import AngelStatPanel from './AngelStatPanel';
import HandDisplay from './HandDisplay';
import DeckStatus from './DeckStatus';
import SetEngineDisplay from './SetEngineDisplay';
import TurnControls from './TurnControls';
import BoardDisplay from './BoardDisplay';
import PendingEffectModal from './PendingEffectModal';
import FlashOverlay from './FlashOverlay';
import OblivionAcquisitionScreen from './OblivionAcquisitionScreen';

/**
 * Top status bar — slim full-width chrome strip at the top of the arena.
 * Left third: SET · TURN N · PHASE (cinematic title, replaces the floating
 * turn header from ArenaShell). Right third: utility icon toolbar (Set
 * Engines, How-to-Play, future menu items). Center is reserved for the
 * floating ScoreDisplay which sits behind this bar at top-center.
 */
function TopStatusBar({ onOpenOblivionScreen }: { onOpenOblivionScreen: () => void }) {
  const turn = useStore(selectTurn);
  const bossFight = useStore(selectBossFight);

  // All cards are Neutrality; dominant element is always Neutrality.
  const tint = SET_ACCENT;
  const setName = SET_LABEL;
  const isBoss = bossFight.mode === 'active';
  const tintCss = isBoss ? '#ff6b6b' : tint;
  const phaseLabel = turn.phase === 'mulligan' ? 'Mulligan' : turn.phase === 'playing' ? 'Playing' : 'Idle';

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 52,
      display: 'flex', alignItems: 'center',
      justifyContent: 'flex-start',
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

      {/* Right — Oblivion Acquisition button */}
      <button
        onClick={onOpenOblivionScreen}
        title="Oblivion Acquisition — view all Oblivion sources"
        style={{
          marginLeft: 'auto',
          pointerEvents: 'auto',
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 14px',
          borderRadius: 999,
          border: '1px solid rgba(247,192,74,0.35)',
          background: 'linear-gradient(135deg, rgba(247,192,74,0.14) 0%, rgba(247,192,74,0.06) 100%)',
          color: '#f7c04a',
          fontFamily: uiTypography.display,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.2,
          cursor: 'pointer',
          boxShadow: '0 0 12px rgba(247,192,74,0.16)',
          transition: 'all 0.18s ease',
        }}
        onMouseEnter={e => {
          const b = e.currentTarget;
          b.style.background = 'linear-gradient(135deg, rgba(247,192,74,0.28) 0%, rgba(247,192,74,0.14) 100%)';
          b.style.boxShadow = '0 0 22px rgba(247,192,74,0.32)';
          b.style.borderColor = 'rgba(247,192,74,0.60)';
        }}
        onMouseLeave={e => {
          const b = e.currentTarget;
          b.style.background = 'linear-gradient(135deg, rgba(247,192,74,0.14) 0%, rgba(247,192,74,0.06) 100%)';
          b.style.boxShadow = '0 0 12px rgba(247,192,74,0.16)';
          b.style.borderColor = 'rgba(247,192,74,0.35)';
        }}
      >
        ◈ Oblivion
      </button>

    </div>
  );
}

/**
 * Right-side control rail — 260 px glass panel that hosts the three main
 * HUD controls: deck-status pills at the top (padded past the 52 px bar),
 * the scrollable set-engine reference in the middle, and the turn-control
 * button anchored at the bottom. Returned to the right edge per user
 * request; widened to 260 px for breathing room vs the old 220 px.
 */
function RightRail() {
  const bossFight = useStore(selectBossFight);
  const battleground = useStore(selectBattleground);
  const inBossFight = bossFight.mode === 'active';
  const inBattleground = battleground.mode === 'active';
  return (
    <div
      style={{
        position: 'absolute',
        right: 0, top: 0, bottom: 0,
        width: 340,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(270deg, rgba(5,5,7,0.92) 0%, rgba(8,8,16,0.78) 100%)',
        borderLeft: '1px solid rgba(244,244,248,0.08)',
        backdropFilter: 'blur(12px)',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.45)',
        pointerEvents: 'auto',
        zIndex: 14,
      }}
    >
      {/* Inset left-edge accent — gives the rail a physical seam against the arena */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: '6%', bottom: '6%', left: 0, width: 1,
        background: 'linear-gradient(180deg, transparent, rgba(244,244,248,0.14) 25%, rgba(244,244,248,0.14) 75%, transparent)',
        pointerEvents: 'none',
      }} />

      {/* Deck pills — clears the 52 px top bar; during boss fights also clears the boss panel (~200 px); during battlegrounds clears the slim BG strip (~52 px). */}
      <div style={{ padding: `${inBossFight ? 252 : inBattleground ? 64 : 64}px 18px 0`, flexShrink: 0 }}>
        <DeckStatus />
      </div>

      {/* Divider */}
      <div aria-hidden="true" style={{
        height: 1, margin: '18px 20px 0', flexShrink: 0,
        background: 'linear-gradient(90deg, transparent, rgba(244,244,248,0.13), transparent)',
      }} />

      {/* Set engine reference — scrollable, expands to fill available space */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 4px', minHeight: 0 }}>
        <SetEngineDisplay />
      </div>

      {/* Divider */}
      <div aria-hidden="true" style={{
        height: 1, margin: '14px 20px', flexShrink: 0,
        background: 'linear-gradient(90deg, transparent, rgba(244,244,248,0.13), transparent)',
      }} />

      {/* Turn controls — bottom-anchored */}
      <div style={{ padding: '0 18px 22px', flexShrink: 0 }}>
        <TurnControls />
      </div>
    </div>
  );
}

export default function HUD() {
  const [showOblivionScreen, setShowOblivionScreen] = useState(false);
  const battleground = useStore(selectBattleground);
  const inBattleground = battleground.mode === 'active';

  return (
    <>
      {/* Core play surfaces */}
      <BoardDisplay />
      {/* ScoreDisplay overlaps the battleground pill — the BG bar already shows both scores */}
      {!inBattleground && <ScoreDisplay />}
      <AngelStatPanel />

      {/* Top status bar — set · turn · phase */}
      <TopStatusBar onOpenOblivionScreen={() => setShowOblivionScreen(true)} />

      {/* Hand strip */}
      <HandDisplay />

      {/* Right control rail — deck pills / set-engines reference / turn button */}
      <RightRail />

      {/* Pending-effect modal — floats above everything */}
      <PendingEffectModal />

      {/* Radiance orb — visible during Light-deck fights */}

      {/* Full-screen radial flash overlay — triggered by game events */}
      <FlashOverlay />

      {/* Oblivion Acquisition reference screen */}
      {showOblivionScreen && (
        <OblivionAcquisitionScreen onClose={() => setShowOblivionScreen(false)} />
      )}
    </>
  );
}
