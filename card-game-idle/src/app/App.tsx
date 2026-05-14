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
import { warmTheme } from '@/ui/theme';
import { useStore, selectDeck, selectTurn, selectBossFight } from '@/state/store';

const engine = new GameEngine();

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previousScreenSignatureRef = useRef<string>('');
  const [showDeckBuilder, setShowDeckBuilder] = useState(false);
  const [showCardStore, setShowCardStore] = useState(false);
  const [showDeckViewer, setShowDeckViewer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEternitysWake, setShowEternitysWake] = useState(false);
  const [showInfinitude, setShowInfinitude] = useState(false);
  const [screenFadeKey, setScreenFadeKey] = useState(0);
  const deck = useStore(selectDeck);
  const turn = useStore(selectTurn);
  const bossFight = useStore(selectBossFight);
  const endTurn = useStore(s => s.endTurn);

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
  const isMenuOpen = showDeckBuilder || showCardStore || showDeckViewer || showSettings || showEternitysWake || showInfinitude;
  const screenSignature = `${turn.phase}|${bossFight.mode}|${isMenuOpen ? 'menu' : 'game'}`;

  useEffect(() => {
    if (!previousScreenSignatureRef.current) {
      previousScreenSignatureRef.current = screenSignature;
      return;
    }
    if (previousScreenSignatureRef.current !== screenSignature) {
      previousScreenSignatureRef.current = screenSignature;
      setScreenFadeKey(k => k + 1);
    }
  }, [screenSignature]);

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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: warmTheme.appBackground, color: warmTheme.text, overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      <div className="game-bg-pattern game-bg-pattern--grain" />
      <div className="game-bg-pattern game-bg-pattern--sigils" />

      {/* Boss fight HP bar overlay — hidden while full-screen menus are open */}
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
            onClick={() => setShowInfinitude(true)}
            style={{
              ...menuButtonStyle,
              border: `1px solid rgba(180,190,255,0.38)`,
              color: '#d8d8f8',
              background: 'rgba(14,14,26,0.82)',
            }}
          >
            Infinitude
          </button>
          <button
            onClick={() => setShowDeckViewer(true)}
            style={menuButtonStyle}
          >
            My Decks
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
          <button
            onClick={() => setShowDeckBuilder(true)}
            style={{
              ...menuButtonStyle,
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

      {/* Emergency end turn — intentionally above menu overlays */}
      {turn.phase === 'playing' && !inBossFight && !isMenuOpen && (
        <div style={{
          position: 'absolute',
          top: 'clamp(48px, 6vh, 72px)',
          left: '50%',
          transform: 'translateX(calc(-50% - clamp(160px, 22vw, 240px)))',
          zIndex: 70,
          pointerEvents: 'auto',
        }}>
          <button
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

      {screenFadeKey > 0 && (
        <div
          key={`screen-fade-${screenFadeKey}`}
          className="anim-screen-black-fade"
          style={{
            position: 'absolute',
            inset: 0,
            background: '#000',
            pointerEvents: 'none',
            zIndex: 120,
          }}
        />
      )}
    </div>
  );
}
