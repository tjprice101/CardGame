import { useState } from 'react';
import { useStore, selectTurn, selectBossFight, selectGardenDungeon, selectBattleground } from '@/state/store';
import { SET_ACCENT, SET_LABEL } from '@/data/elements';
import { uiTypography } from '@/ui/theme';
import ScoreDisplay from './ScoreDisplay';
import AngelStatPanel from './AngelStatPanel';
import HandDisplay from './HandDisplay';
import DeckStatus from './DeckStatus';
import AbilityAmplificationPanel from './AbilityAmplificationPanel';
import TurnControls from './TurnControls';
import BoardDisplay from './BoardDisplay';
import PendingEffectModal from './PendingEffectModal';
import FlashOverlay from './FlashOverlay';
import OblivionAcquisitionScreen from './OblivionAcquisitionScreen';
import CardInspectorPanel from './CardInspectorPanel';

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
  const gardenDungeon = useStore(selectGardenDungeon);

  const isBoss = bossFight.mode === 'active';
  const isGarden = gardenDungeon.phase === 'active';
  const tint = SET_ACCENT;
  const setName = isGarden ? 'Valley of Null' : SET_LABEL;
  const tintCss = isGarden ? '#ffffff' : isBoss ? '#ff6b6b' : tint;
  const phaseLabel = turn.phase === 'mulligan' ? 'Mulligan' : turn.phase === 'playing' ? (isGarden ? 'Expedition Turn' : 'Playing') : 'Idle';

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 52,
      display: 'flex', alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '0 22px',
      background: isGarden
        ? 'linear-gradient(180deg, rgba(3,4,7,0.96) 0%, rgba(6,8,12,0.6) 75%, transparent 100%)'
        : 'linear-gradient(180deg, rgba(5,5,7,0.92) 0%, rgba(5,5,7,0.4) 75%, transparent 100%)',
      borderBottom: isGarden ? '1px solid rgba(255,255,255,0.14)' : `1px solid rgba(244,244,248,0.06)`,
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
          color: '#ffffff', textTransform: 'uppercase',
          textShadow: isGarden
            ? '0 0 16px rgba(255,255,255,0.7), 0 0 28px rgba(200,220,255,0.3)'
            : `0 0 14px ${tintCss}66, 0 0 28px rgba(244,244,248,0.18)`,
        }}>
          Turn {turn.turnNumber ?? 1}
        </span>
        <span style={{
          width: 1, height: 14, background: isGarden ? 'rgba(255,255,255,0.4)' : 'rgba(244,244,248,0.25)',
        }} />
        <span style={{
          fontSize: 10, letterSpacing: 4, textTransform: 'uppercase',
          color: isGarden ? 'rgba(255,255,255,0.85)' : 'rgba(244,244,248,0.6)',
        }}>
          {setName}
        </span>
        <span style={{
          fontSize: 10, letterSpacing: 3, textTransform: 'uppercase',
          color: isGarden ? '#ffffff' : `${tintCss}cc`,
          textShadow: isGarden ? '0 0 10px rgba(255,255,255,0.45)' : undefined,
        }}>
          · {phaseLabel}
        </span>
      </div>

      {/* Right — Divine Light Acquisition button */}
      <button
        className="divine-light-acquisition-button"
        onClick={onOpenOblivionScreen}
        title="Divine Light Acquisition — view all Divine Light sources"
        style={{
          marginLeft: 'auto',
          pointerEvents: 'auto',
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 16px',
          borderRadius: 999,
          border: '1px solid rgba(247,192,74,0.62)',
          background: 'linear-gradient(135deg, rgba(247,192,74,0.24) 0%, rgba(247,192,74,0.1) 100%)',
          color: '#f7c04a',
          fontFamily: uiTypography.display,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1.2,
          cursor: 'pointer',
          boxShadow: '0 0 18px rgba(247,192,74,0.28)',
          animation: 'uiAuraPulse 2.4s ease-in-out infinite',
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
          b.style.background = 'linear-gradient(135deg, rgba(247,192,74,0.24) 0%, rgba(247,192,74,0.1) 100%)';
          b.style.boxShadow = '0 0 18px rgba(247,192,74,0.28)';
          b.style.borderColor = 'rgba(247,192,74,0.62)';
        }}
      >
        ◈ Divine Light
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
function RightRail({ inspectedCardId, onRequestBeginTurn }: { inspectedCardId: string | null; onRequestBeginTurn?: () => void }) {
  const bossFight = useStore(selectBossFight);
  const gardenDungeon = useStore(selectGardenDungeon);
  const battleground = useStore(selectBattleground);
  const inBossFight = bossFight.mode === 'active';
  const inGardenDungeon = gardenDungeon.phase === 'active';
  const inBattleground = battleground.mode === 'active';
  return (
    <div
      style={{
        position: 'absolute',
        right: 0, top: 0, bottom: 0,
        width: 300,
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

      {/* Deck pills — clear the compact boss/dungeon strip without pushing the board controls down. */}
      <div style={{ padding: `${inBossFight || inGardenDungeon ? 148 : inBattleground ? 58 : 58}px 14px 0`, flexShrink: 0 }}>
        <DeckStatus />
      </div>

      {/* Divider */}
      <div aria-hidden="true" style={{
        height: 1, margin: '12px 18px 0', flexShrink: 0,
        background: 'linear-gradient(90deg, transparent, rgba(244,244,248,0.13), transparent)',
      }} />

      <CardInspectorPanel definitionId={inspectedCardId} />

      <div aria-hidden="true" style={{
        height: 1, margin: '12px 20px 0', flexShrink: 0,
        background: 'linear-gradient(90deg, transparent, rgba(244,244,248,0.13), transparent)',
      }} />

      {/* Ability Amplification — scrollable, expands to fill available space */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 4px', minHeight: 0 }}>
        <AbilityAmplificationPanel />
      </div>

      {/* Divider */}
      <div aria-hidden="true" style={{
        height: 1, margin: '10px 18px', flexShrink: 0,
        background: 'linear-gradient(90deg, transparent, rgba(244,244,248,0.13), transparent)',
      }} />

      {/* Turn controls — bottom-anchored */}
      <div style={{ padding: '0 14px 16px', flexShrink: 0 }}>
        <TurnControls onBeginTurn={onRequestBeginTurn} />
      </div>
    </div>
  );
}

export default function HUD({ onRequestBeginTurn }: { onRequestBeginTurn?: () => void }) {
  const [showOblivionScreen, setShowOblivionScreen] = useState(false);
  const [inspectedCardId, setInspectedCardId] = useState<string | null>(null);
  const bossFight = useStore(selectBossFight);
  const battleground = useStore(selectBattleground);
  const gardenDungeon = useStore(selectGardenDungeon);
  const inBossFight = bossFight.mode === 'active';
  const inBattleground = battleground.mode === 'active';
  const inGardenDungeon = gardenDungeon.phase === 'active';

  return (
    <>
      {/* Core play surfaces */}
      <BoardDisplay onHoverCard={setInspectedCardId} />
      {/* ScoreDisplay overlaps the boss/battleground/garden banner — those headers already present score/timer/currencies */}
      {!inBattleground && !inGardenDungeon && !inBossFight && <ScoreDisplay />}
      <AngelStatPanel />

      {/* Top status bar — set · turn · phase */}
      <TopStatusBar onOpenOblivionScreen={() => setShowOblivionScreen(true)} />

      {/* Hand strip */}
      <HandDisplay onHoverCard={setInspectedCardId} />

      {/* Right control rail — deck pills / set-engines reference / turn button */}
      <RightRail inspectedCardId={inspectedCardId} onRequestBeginTurn={onRequestBeginTurn} />

      {/* Pending-effect modal — floats above everything */}
      <PendingEffectModal />

      {/* Radiance orb — visible during Light-deck fights */}

      {/* Full-screen radial flash overlay — triggered by game events */}
      <FlashOverlay />

      {/* Divine Light Acquisition reference screen */}
      {showOblivionScreen && (
        <OblivionAcquisitionScreen onClose={() => setShowOblivionScreen(false)} />
      )}
    </>
  );
}
