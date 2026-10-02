import { useState } from 'react';
import { useStore, selectDeck, selectTurn, selectBossFight, selectGardenDungeon, selectBattleground } from '@/state/store';
import { CARD_SET_COLORS, getCardSetId, SET_ACCENT, SET_LABEL } from '@/data/elements';
import { GARDEN_DUNGEONS } from '@/data/dungeons/gardenDungeonDefinitions';
import { getTurnSpectrumLevel, MAX_SPECTRUM_LEVEL } from '@/systems/cards/SpectrumLevel';
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
import DivineLightAcquisitionScreen from './DivineLightAcquisitionScreen';
import CardInspectorPanel from './CardInspectorPanel';
import CardBornStacksPanel from './CardBornStacksPanel';
import RadioControlBar from '@/ui/components/RadioControlBar';

interface ArenaRadioControls {
  active: boolean;
  visible: boolean;
  paused: boolean;
  currentTrack: import('@/audio/MainTurnRadio').RadioTrackInfo | null;
  onPausedChange: (paused: boolean) => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
}

type RailTab = 'card' | 'abilities' | 'sets' | 'spectrum';
const RAIL_TABS: Array<{ id: RailTab; label: string }> = [
  { id: 'card', label: 'Card' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'sets', label: 'Sets' },
  { id: 'spectrum', label: 'Spectrum' },
];

/**
 * Top status bar — slim full-width chrome strip at the top of the arena.
 * Left third: SET · TURN N · PHASE (cinematic title, replaces the floating
 * turn header from ArenaShell). Right third: utility icon toolbar (Set
 * Engines, How-to-Play, future menu items). Center is reserved for the
 * floating ScoreDisplay which sits behind this bar at top-center.
 */
function TopStatusBar({ onOpenDivineLightScreen }: { onOpenDivineLightScreen: () => void }) {
  const turn = useStore(selectTurn);
  const deck = useStore(selectDeck);
  const bossFight = useStore(selectBossFight);
  const gardenDungeon = useStore(selectGardenDungeon);
  const battleground = useStore(selectBattleground);

  const isBoss = bossFight.mode === 'active';
  const isGarden = gardenDungeon.phase === 'active';
  const showScore = !isBoss && !isGarden && battleground.mode !== 'active';
  const tint = SET_ACCENT;
  const activeGardenName = GARDEN_DUNGEONS.find(dungeon => dungeon.id === gardenDungeon.dungeonId)?.name;
  const setName = isGarden
    ? activeGardenName ?? 'Garden of Cards'
    : isBoss
      ? "Eternity's Wake"
      : battleground.mode === 'active'
        ? 'Battleground'
        : SET_LABEL;
  const tintCss = isGarden ? '#ffffff' : isBoss ? '#ff6b6b' : tint;
  const phaseLabel = turn.phase === 'mulligan' ? 'Mulligan' : turn.phase === 'playing' ? (isGarden ? 'Expedition Turn' : 'Playing') : 'Idle';
  const spectrumLevel = getTurnSpectrumLevel(turn);
  const hasCausality = [...deck.deckList, ...deck.extraDeck].some(entry => getCardSetId(entry.definitionId) === 'Causality');

  return (
    <div style={{
      gridArea: 'header',
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
      alignItems: 'center',
      gap: 12,
      padding: '0 18px',
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
          minWidth: 0,
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

      <div style={{ justifySelf: 'center' }}>
        {showScore && <ScoreDisplay />}
      </div>

      <div className="turn-header-resources">
        <div className="turn-spectrum-compact" aria-label={`Spectrum ${spectrumLevel} of ${MAX_SPECTRUM_LEVEL}`}>
          <div className="turn-spectrum-diamonds" aria-hidden="true">
            {Array.from({ length: MAX_SPECTRUM_LEVEL }, (_, index) => (
              <span key={index} className={index < spectrumLevel ? 'is-lit' : undefined}>◆</span>
            ))}
          </div>
          <span>Spectrum {spectrumLevel}/{MAX_SPECTRUM_LEVEL}</span>
        </div>
        <div className="turn-stack-compact" title="Limitless Light Stacks">
          <span aria-hidden="true">✦</span><strong>{turn.limitlessLightStacks.toLocaleString()}</strong><span>Stacks</span>
        </div>
        {hasCausality && (
          <div className="turn-cosmos-compact" title="Limitless Cosmos">
            <span aria-hidden="true">◈</span><strong>{(turn.limitlessCosmosStacks ?? 0).toLocaleString()}</strong><span>Cosmos</span>
          </div>
        )}
        <button
          className="divine-light-acquisition-button"
          onClick={onOpenDivineLightScreen}
          title="Divine Light Acquisition — view all Divine Light sources"
          style={{
            pointerEvents: 'auto',
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', borderRadius: 999,
            border: '1px solid rgba(247,192,74,0.62)',
            background: 'linear-gradient(135deg, rgba(247,192,74,0.24) 0%, rgba(247,192,74,0.1) 100%)',
            color: '#f7c04a', fontFamily: uiTypography.display, fontSize: 12, fontWeight: 700,
            letterSpacing: 1.2, cursor: 'pointer', boxShadow: '0 0 18px rgba(247,192,74,0.28)',
            animation: 'uiAuraPulse 2.4s ease-in-out infinite', transition: 'all 0.18s ease',
          }}
        >◈ Divine Light</button>
      </div>

    </div>
  );
}

/** Right rail: one scrollable deck/inspector/ability stack plus an anchored control footer. */
function DeckSetOverview() {
  const deck = useStore(selectDeck);
  const counts = { Neutrality: { main: 0, extra: 0 }, Causality: { main: 0, extra: 0 } };
  for (const entry of deck.deckList) {
    const setId = getCardSetId(entry.definitionId);
    if (setId) counts[setId].main += entry.copies;
  }
  for (const entry of deck.extraDeck) {
    const setId = getCardSetId(entry.definitionId);
    if (setId) counts[setId].extra += 1;
  }
  const activeSets = (Object.keys(counts) as Array<keyof typeof counts>).filter(setId => counts[setId].main + counts[setId].extra > 0);

  return (
    <section className="turn-set-overview" aria-label="Active deck set composition">
      <div className="turn-rail-section-title">Active Deck Sets</div>
      {activeSets.length === 0 ? (
        <div className="turn-set-empty">No registered set cards in this deck.</div>
      ) : activeSets.map(setId => (
        <div className="turn-set-row" key={setId}>
          <span className="turn-set-marker" style={{ background: CARD_SET_COLORS[setId] }} />
          <strong>{setId}</strong>
          <span>{counts[setId].main} Main · {counts[setId].extra} Extra</span>
        </div>
      ))}
      <div className="turn-set-total">{deck.deckList.reduce((sum, entry) => sum + entry.copies, 0)} Main cards · {deck.extraDeck.length} Extra cards</div>
    </section>
  );
}

function RightRail({ inspectedCardId, activeTab, onTabChange, onRequestBeginTurn, radio }: { inspectedCardId: string | null; activeTab: RailTab; onTabChange: (tab: RailTab) => void; onRequestBeginTurn?: () => void; radio?: ArenaRadioControls }) {
  return (
    <div
      className="turn-screen-rail"
      style={{
        gridArea: 'rail',
        position: 'relative',
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
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
      <div className="turn-screen-rail-heading">
        {RAIL_TABS.map(tab => (
          <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} className={activeTab === tab.id ? 'is-active' : undefined} onClick={() => onTabChange(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="turn-screen-rail-scroll">
        <div className="turn-screen-rail-panel">
          {activeTab === 'card' && <CardInspectorPanel definitionId={inspectedCardId} />}
          {activeTab === 'abilities' && <AbilityAmplificationPanel />}
          {activeTab === 'sets' && <DeckSetOverview />}
          {activeTab === 'spectrum' && <CardBornStacksPanel />}
        </div>
      </div>

      <div className="turn-screen-rail-footer">
        {radio && (
          <RadioControlBar
            placement="rail"
            radioActive={radio.active}
            visible={radio.visible}
            paused={radio.paused}
            currentTrack={radio.currentTrack}
            onPausedChange={radio.onPausedChange}
            onPause={radio.onPause}
            onResume={radio.onResume}
            onSkip={radio.onSkip}
          />
        )}
        <TurnControls onBeginTurn={onRequestBeginTurn} />
      </div>
    </div>
  );
}

export default function HUD({ onRequestBeginTurn, radio }: { onRequestBeginTurn?: () => void; radio?: ArenaRadioControls }) {
  const [showDivineLightScreen, setShowDivineLightScreen] = useState(false);
  const [inspectedCardId, setInspectedCardId] = useState<string | null>(null);
  const [activeRailTab, setActiveRailTab] = useState<RailTab>('card');
  const bossFight = useStore(selectBossFight);
  const battleground = useStore(selectBattleground);
  const gardenDungeon = useStore(selectGardenDungeon);
  const specialMode = bossFight.mode === 'active' || battleground.mode === 'active' || gardenDungeon.phase === 'active';

  return (
    <div className="turn-screen-layout">
      <TopStatusBar onOpenDivineLightScreen={() => setShowDivineLightScreen(true)} />

      <main className={`turn-screen-playfield${specialMode ? ' turn-screen-playfield--special' : ''}`}>
        <aside className="turn-screen-resources">
          <DeckStatus layout="zones" />
          <AngelStatPanel />
        </aside>
        <section className="turn-screen-board" aria-label="Turn board">
          <BoardDisplay onHoverCard={id => { setInspectedCardId(id); setActiveRailTab('card'); }} />
        </section>
      </main>

      <section className="turn-screen-hand" aria-label="Hand">
        <HandDisplay onHoverCard={id => { setInspectedCardId(id); setActiveRailTab('card'); }} />
      </section>

      <RightRail inspectedCardId={inspectedCardId} activeTab={activeRailTab} onTabChange={setActiveRailTab} onRequestBeginTurn={onRequestBeginTurn} radio={radio} />

      {/* Pending-effect modal — floats above everything */}
      <PendingEffectModal />

      {/* Radiance orb — visible during Light-deck fights */}

      {/* Full-screen radial flash overlay — triggered by game events */}
      <FlashOverlay />

      {/* Divine Light Acquisition reference screen */}
      {showDivineLightScreen && (
        <DivineLightAcquisitionScreen onClose={() => setShowDivineLightScreen(false)} />
      )}
    </div>
  );
}
