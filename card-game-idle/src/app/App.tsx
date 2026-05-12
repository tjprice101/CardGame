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
import { warmTheme } from '@/ui/theme';
import { useStore, selectDeck, selectTurn, selectBossFight } from '@/state/store';

const engine = new GameEngine();

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showDeckBuilder, setShowDeckBuilder] = useState(false);
  const [showCardStore, setShowCardStore] = useState(false);
  const [showDeckViewer, setShowDeckViewer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEternitysWake, setShowEternitysWake] = useState(false);
  const deck = useStore(selectDeck);
  const turn = useStore(selectTurn);
  const bossFight = useStore(selectBossFight);

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

  const noDecklist = deck.deckList.length === 0;
  const idlePhase = turn.phase === 'idle';
  const inBossFight = bossFight.mode === 'active';

  const menuButtonStyle: React.CSSProperties = {
    padding: '8px 16px',
    fontFamily: 'Georgia, serif',
    fontSize: 12,
    background: warmTheme.surfaceStrong,
    border: `1px solid ${warmTheme.borderStrong}`,
    color: warmTheme.text,
    borderRadius: 10,
    cursor: 'pointer',
    letterSpacing: 1,
    boxShadow: warmTheme.glow,
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: warmTheme.appBackground, color: warmTheme.text }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

      {/* Boss fight HP bar overlay — shown during fights */}
      <BossFightArena />

      {/* HUD overlay */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
        <HUD />
      </div>

      {/* Top-right buttons (visible when idle and not in a boss fight) */}
      {idlePhase && !inBossFight && !showDeckBuilder && !showCardStore && !showDeckViewer && !showSettings && !showEternitysWake && (
        <div style={{
          position: 'absolute', top: 16, right: 16, zIndex: 20, pointerEvents: 'auto',
          display: 'flex', gap: 8,
        }}>
          <button
            onClick={() => setShowCardStore(true)}
            style={menuButtonStyle}
          >
            Card Store
          </button>
          <button
            onClick={() => setShowEternitysWake(true)}
            style={{
              ...menuButtonStyle,
              border: `1px solid rgba(184,92,79,0.45)`,
              color: warmTheme.danger,
            }}
          >
            Eternity's Wake
          </button>
          <button
            onClick={() => setShowDeckViewer(true)}
            style={menuButtonStyle}
          >
            My Decks
          </button>
          <button
            onClick={() => setShowDeckBuilder(true)}
            style={{
              ...menuButtonStyle,
              background: warmTheme.button,
              border: `1px solid ${warmTheme.borderStrong}`,
              color: warmTheme.accentDeep,
            }}
          >
            {noDecklist ? '+ Build Deck' : '✎ Edit Deck'}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              ...menuButtonStyle,
              padding: '8px 12px',
              fontSize: 13,
            }}
            title="Settings"
          >
            ⚙
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
      {showDeckViewer && (
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

      {/* Boss result modal (victory / defeat) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 40, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <BossResultModal />
        </div>
      </div>

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
    </div>
  );
}
