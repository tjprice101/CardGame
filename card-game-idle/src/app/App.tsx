import { useState, useRef, useEffect } from 'react';
import '@/styles/animations.css';
import { GameEngine } from '@/core/engine/GameEngine';
import HUD from '@/ui/hud/HUD';
import DeckBuilder from '@/ui/deck/DeckBuilder';
import DeckViewer from '@/ui/deck/DeckViewer';
import CardPackStore from '@/ui/store/CardPackStore';
import SettingsPanel from '@/ui/settings/SettingsPanel';
import EternitysWake from '@/ui/eternitysWake/EternitysWake';
import BossFightArena from '@/ui/eternitysWake/BossFightArena';
import BossResultModal from '@/ui/eternitysWake/BossResultModal';
import Infinitude from '@/ui/infinitude/Infinitude';
import TutorialModal from '@/ui/menus/TutorialModal';
import { warmTheme } from '@/ui/theme';
import { useStore, selectBoard, selectDeck, selectTurn, selectBossFight, selectSettings } from '@/state/store';
import { getFontScale, setUiPreferences, t } from '@/ui/preferences';

const engine = new GameEngine();

const SUMMON_VIDEO_ROOT = '/assets/video/summons';

// Module-level constant — warmTheme is stable so this is safe to hoist out of the component
const menuButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontFamily: 'Georgia, serif',
  fontSize: 12,
  background: warmTheme.button,
  border: `1px solid ${warmTheme.borderStrong}`,
  color: warmTheme.accentDeep,
  borderRadius: 10,
  cursor: 'pointer',
  letterSpacing: 1,
  boxShadow: warmTheme.glow,
};
const SUMMON_VIDEO_BY_ANGEL: Record<string, string> = {
  'angel-neutral-beginning': 'the-beginning-and-the-end-summon.mp4',
  'angel-neutral-presence': 'aegisofpresenceSUMMON.mp4',
  'angel-neutral-equilibrium': 'aegisofequilibriumSUMMON.mp4',
  'angel-fire-cinderwing': 'cinderwingSUMMON.mp4',
  'angel-light-aurelion': 'aurelion thorncrownedSUMMON.mp4',
  'angel-light-solarius': 'solariusemberthornascendantSUMMON.mp4',
  'md-angel-ori9-broken-sleep': 'ori-9archonofbrokensleepSUMMON.mp4',
  'md-angel-thaumiel-prime': 'thaumielprimefurnaceofunwrittenfuturesSUMMON.mp4',
  'pa-angel-aurelith-ninth-beam': 'aurelithseeroftheninthbeamSUMMON.mp4',
  'btei-prismatic-blindwars-reliquary': 'reliquaryofblindwarsSUMMON.mp4',
  'btei-pyroabyss-hellrift-mandala': 'riftbellcatastropheSUMMON.mp4',
  'btei-thornbound-funeral-bramble': 'gravehedgereliquarySUMMON.mp4',
  'btei-neutrality-axiom-maw': 'axiommawSUMMON.mp4',
  'btei-light-halo-legion': 'halolegionprimeSUMMON.mp4',
  'btei-mech-reactor-paradigm': 'reactorpsalmengineSUMMON.mp4',
  'tbp-angel-irielle-bramble-gate': 'iriellethorn-saintofthelastroadSUMMON.mp4',
  'tbp-angel-velmora-harrowed-crown': 'velmoracrownofharrowedplainsSUMMON.mp4',
};

function getSummonVideoSrc(definitionId: string): string | null {
  const fileName = SUMMON_VIDEO_BY_ANGEL[definitionId];
  return fileName ? `${SUMMON_VIDEO_ROOT}/${encodeURIComponent(fileName)}` : null;
}
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const summonVideoRef = useRef<HTMLVideoElement>(null);
  const seenAngelsRef = useRef<Set<string>>(new Set());
  const hasSeenSaveRef = useRef(false);
  const [showDeckBuilder, setShowDeckBuilder] = useState(false);
  const [showCardStore, setShowCardStore] = useState(false);
  const [showDeckViewer, setShowDeckViewer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showEternitysWake, setShowEternitysWake] = useState(false);
  const [showInfinitude, setShowInfinitude] = useState(false);
  const [showAutosaveIndicator, setShowAutosaveIndicator] = useState(false);
  const [showSummonCinematic, setShowSummonCinematic] = useState(false);
  const [summonVideoSrc, setSummonVideoSrc] = useState<string | null>(null);
  const board = useStore(selectBoard);
  const deck = useStore(selectDeck);
  const turn = useStore(selectTurn);
  const bossFight = useStore(selectBossFight);
  const settings = useStore(selectSettings);
  const lastSavedAt = useStore(s => s.lastSavedAt);
  const endTurn = useStore.getState().endTurn;

  useEffect(() => {
    document.documentElement.classList.toggle('reduced-motion', settings.reducedMotion);
    document.documentElement.lang = settings.language;
    const fontScale = getFontScale(settings.fontSizePreset);
    document.documentElement.style.setProperty('--ui-font-scale', String(fontScale));
    document.documentElement.style.fontSize = `${fontScale * 16}px`;
    setUiPreferences({
      language: settings.language,
      fontSizePreset: settings.fontSizePreset,
      cardArtDisplay: settings.cardArtDisplay,
      cardThemePacks: settings.cardThemePacks,
    });
  }, [settings.language, settings.fontSizePreset, settings.cardArtDisplay, settings.cardThemePacks, settings.reducedMotion]);

  useEffect(() => {
    if (!canvasRef.current) return;
    engine.init(canvasRef.current).catch(console.error);
    return () => { engine.destroy(); };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        useStore.getState().addOblivion(1_000_000);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!hasSeenSaveRef.current) {
      hasSeenSaveRef.current = true;
      return;
    }
    setShowAutosaveIndicator(true);
    const timeout = window.setTimeout(() => setShowAutosaveIndicator(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [lastSavedAt]);

  useEffect(() => {
    const currentAngelIds = new Set<string>();
    for (const slot of board.frontSlots) {
      if (slot?.type === 'Angel') {
        currentAngelIds.add(slot.instanceId);
      }
    }

    for (const slot of board.frontSlots) {
      if (!slot || slot.type !== 'Angel') continue;
      if (seenAngelsRef.current.has(slot.instanceId)) continue;
      const videoSrc = getSummonVideoSrc(slot.definitionId);
      if (videoSrc) {
        setSummonVideoSrc(videoSrc);
        setShowSummonCinematic(true);
        break;
      }
    }

    seenAngelsRef.current = currentAngelIds;
  }, [board.frontSlots]);

  useEffect(() => {
    if (!showSummonCinematic || !summonVideoRef.current || !summonVideoSrc) return;
    summonVideoRef.current.playbackRate = 2.25;
    summonVideoRef.current.currentTime = 0;
    void summonVideoRef.current.play().catch(() => undefined);
  }, [showSummonCinematic, summonVideoSrc]);

  const noDecklist = deck.deckList.length === 0;
  const idlePhase = turn.phase === 'idle';
  const inBossFight = bossFight.mode === 'active';
  const isMenuOpen = showDeckBuilder || showCardStore || showDeckViewer || showSettings || showTutorial || showEternitysWake || showInfinitude;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: warmTheme.appBackground, color: warmTheme.text, overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      <div className="game-bg-pattern game-bg-pattern--grain" />
      <div className="game-bg-pattern game-bg-pattern--sigils" />

      {/* Boss fight HP bar overlay - hidden while full-screen menus are open */}
      {!isMenuOpen && <BossFightArena />}

      {/* HUD overlay */}
      {!isMenuOpen && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
          <HUD />
        </div>
      )}

      {/* Top-right navigation buttons (visible when idle and not in a boss fight) */}
      {idlePhase && !inBossFight && !showDeckBuilder && !showCardStore && !showDeckViewer && !showSettings && !showEternitysWake && !showInfinitude && (
        <div style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 20,
          pointerEvents: 'auto',
          display: 'flex',
          gap: 8,
          maxWidth: 'min(560px, calc(100vw - 32px))',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
        }}>
          <button className="menu-tactile-btn"
            onClick={() => setShowCardStore(true)}
            style={menuButtonStyle}
          >
            {t('cardStore')}
          </button>
          <button className="menu-tactile-btn"
            onClick={() => setShowEternitysWake(true)}
            style={{
              ...menuButtonStyle,
              border: `1px solid rgba(184,92,79,0.45)`,
              color: warmTheme.danger,
            }}
          >
            {t('eternityWake')}
          </button>
          <button className="menu-tactile-btn"
            onClick={() => setShowInfinitude(true)}
            style={{
              ...menuButtonStyle,
              border: `1px solid rgba(180,190,255,0.38)`,
              color: '#d8d8f8',
              background: 'rgba(14,14,26,0.82)',
            }}
          >
            {t('infinitude')}
          </button>
          <button className="menu-tactile-btn"
            onClick={() => setShowDeckViewer(true)}
            style={menuButtonStyle}
          >
            {t('deckViewer')}
          </button>
          <button className="menu-tactile-btn"
            onClick={() => setShowTutorial(true)}
            style={{
              ...menuButtonStyle,
              border: `1px solid rgba(107, 183, 157, 0.55)`,
              color: '#9cefd6',
              background: 'rgba(16, 34, 31, 0.8)',
            }}
          >
            {t('tutorial')}
          </button>
        </div>
      )}

      {/* Deck tools row kept separate from navigation to avoid overlap */}
      {idlePhase && !inBossFight && !showDeckBuilder && !showCardStore && !showDeckViewer && !showSettings && !showEternitysWake && !showInfinitude && (
        <div style={{
          position: 'absolute',
          top: 66,
          right: 16,
          zIndex: 20,
          pointerEvents: 'auto',
          display: 'flex',
          gap: 8,
        }}>
          <button className="menu-tactile-btn"
            onClick={() => setShowDeckBuilder(true)}
            style={{
              ...menuButtonStyle,
              border: `1px solid ${warmTheme.borderStrong}`,
              color: warmTheme.accentDeep,
            }}
          >
            {noDecklist ? `+ ${t('deckBuilder')}` : `Edit ${t('deckBuilder')}`}
          </button>
          <button className="menu-tactile-btn"
            onClick={() => setShowSettings(true)}
            style={{
              ...menuButtonStyle,
              padding: '8px 12px',
              fontSize: 13,
            }}
            title={t('settingsTitle')}
          >
            Settings
          </button>
        </div>
      )}

      {/* Deck Builder modal */}
      {showDeckBuilder && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'auto' }}>
          <DeckBuilder onClose={() => setShowDeckBuilder(false)} />
        </div>
      )}

      {/* Card Pack Store modal */}
      {showCardStore && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'auto' }}>
          <CardPackStore onClose={() => setShowCardStore(false)} />
        </div>
      )}

      {/* Deck Viewer modal */}
      {showDeckViewer && idlePhase && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'auto' }}>
          <DeckViewer
            onClose={() => setShowDeckViewer(false)}
            onOpenDeckBuilder={() => { setShowDeckViewer(false); setShowDeckBuilder(true); }}
          />
        </div>
      )}

      {/* Eternity's Wake modal */}
      {showEternitysWake && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'auto' }}>
          <EternitysWake onClose={() => setShowEternitysWake(false)} />
        </div>
      )}

      {/* Infinitude modal */}
      {showInfinitude && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'auto' }}>
          <Infinitude onClose={() => setShowInfinitude(false)} />
        </div>
      )}

      {/* Boss result modal (victory / defeat) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 40, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <BossResultModal />
        </div>
      </div>

      {/* Emergency end turn - intentionally above menu overlays */}
      {turn.phase === 'playing' && !inBossFight && !isMenuOpen && (
        <div style={{
          position: 'absolute',
          top: 'clamp(48px, 6vh, 72px)',
          left: '50%',
          transform: 'translateX(calc(-50% - clamp(160px, 22vw, 240px)))',
          zIndex: 70,
          pointerEvents: 'auto',
        }}>
          <button className="menu-tactile-btn"
            onClick={endTurn}
            style={{
              padding: '8px 18px',
              borderRadius: 999,
              border: `1px solid ${warmTheme.danger}`,
              background: 'rgba(184,92,79,0.2)',
              color: warmTheme.danger,
              fontFamily: 'Georgia, serif',
              fontSize: 11,
              letterSpacing: 1.4,
              cursor: 'pointer',
              boxShadow: warmTheme.shadow,
            }}
            title="Force end the current turn"
          >
            Emergency End Turn
          </button>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'auto' }}>
          <SettingsPanel
            onClose={() => setShowSettings(false)}
            onSave={() => engine.saveNow()}
            onWipe={() => engine.wipeData()}
          />
        </div>
      )}

      {/* Tutorial modal */}
      {showTutorial && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 31, pointerEvents: 'auto' }}>
          <TutorialModal onClose={() => setShowTutorial(false)} />
        </div>
      )}

      {/* Autosave status indicator */}
      <div style={{
        position: 'absolute',
        left: 12,
        bottom: 12,
        zIndex: 75,
        pointerEvents: 'none',
        opacity: showAutosaveIndicator ? 1 : 0.4,
        transform: showAutosaveIndicator ? 'translateY(0)' : 'translateY(4px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        padding: '6px 10px',
        borderRadius: 8,
        border: `1px solid ${warmTheme.border}`,
        background: 'rgba(12,12,16,0.62)',
        color: '#d6ead6',
        fontFamily: 'Georgia, serif',
        fontSize: 10,
        letterSpacing: 0.8,
      }}>
        {showAutosaveIndicator ? 'Autosaved' : 'Autosave active'}
      </div>

      {/* The Beginning and the End summon cinematic */}
      {showSummonCinematic && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 95,
          background: 'rgba(0,0,0,0.88)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
        }}>
          <video
            key={summonVideoSrc ?? 'summon-video'}
            ref={summonVideoRef}
            src={summonVideoSrc ?? undefined}
            style={{ width: 160, height: 220, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(255,255,255,0.22)', boxShadow: '0 0 40px rgba(255,255,255,0.15)' }}
            onEnded={() => {
              setShowSummonCinematic(false);
              setSummonVideoSrc(null);
            }}
            controls={false}
          />
          <button
            onClick={() => {
              setShowSummonCinematic(false);
              setSummonVideoSrc(null);
            }}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 96,
              padding: '8px 12px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.45)',
              background: 'rgba(15,15,22,0.65)',
              color: '#f6f2e9',
              cursor: 'pointer',
              letterSpacing: 0.8,
              fontSize: 11,
              fontFamily: 'Georgia, serif',
            }}
          >
            Skip
          </button>
        </div>
      )}

    </div>
  );
}

