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
function TopStatusBar() {
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

    </div>
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
 * Right-side control rail — 260 px glass panel that hosts the three main
 * HUD controls: deck-status pills at the top (padded past the 52 px bar),
 * the scrollable set-engine reference in the middle, and the turn-control
 * button anchored at the bottom. Returned to the right edge per user
 * request; widened to 260 px for breathing room vs the old 220 px.
 */
function RightRail() {
  return (
    <div
      style={{
        position: 'absolute',
        right: 0, top: 0, bottom: 0,
        width: 260,
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

      {/* Deck pills — clears the 52 px top bar */}
      <div style={{ padding: '64px 18px 0', flexShrink: 0 }}>
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
  return (
    <>
      {/* Cosmetic left-rail chrome frame behind resource orbs */}
      <LeftRailFrame />

      {/* Core play surfaces */}
      <BoardDisplay />
      <ScoreDisplay />
      <AngelStatPanel />
      <RadianceDisplay />
      <EmberDisplay />
      <TrailDisplay />
      <StrainDisplay />

      {/* Top status bar — set · turn · phase */}
      <TopStatusBar />

      {/* Hand strip */}
      <HandDisplay />

      {/* Right control rail — deck pills / set-engines reference / turn button */}
      <RightRail />

      {/* Pending-effect modal — floats above everything */}
      <PendingEffectModal />
    </>
  );
}
