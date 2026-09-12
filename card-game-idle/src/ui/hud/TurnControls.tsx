import { useStore, selectTurn, selectDeck, selectGardenDungeon } from '@/state/store';

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    pointerEvents: 'auto',
    fontFamily: 'Georgia, serif',
    alignItems: 'stretch',
    width: '100%',
    zIndex: 1,
  },
  btn: {
    padding: '11px 12px',
    borderRadius: 10,
    border: '1px solid rgba(244,244,248,0.32)',
    background: 'linear-gradient(180deg, rgba(28,28,38,0.96) 0%, rgba(10,10,16,0.96) 100%)',
    color: 'rgba(244,244,248,0.92)',
    fontSize: 13,
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
    letterSpacing: 2,
    textTransform: 'uppercase',
    transition: 'background 0.15s, box-shadow 0.18s, border-color 0.18s, transform 0.12s',
    boxShadow: '0 6px 18px rgba(0,0,0,0.55), inset 0 1px 0 rgba(244,244,248,0.08)',
    width: '100%',
  },
  primary: {
    background: 'linear-gradient(180deg, rgba(60,60,90,0.98) 0%, rgba(22,22,40,0.98) 100%)',
    border: '1px solid rgba(200,180,255,0.7)',
    color: 'rgba(244,244,248,1)',
    boxShadow: '0 0 20px rgba(160,160,255,0.24), 0 6px 18px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.14)',
    letterSpacing: 2.6,
  },
  disabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
};

export default function TurnControls({ onBeginTurn }: { onBeginTurn?: () => void }) {
  const turn = useStore(selectTurn);
  const deck = useStore(selectDeck);
  const gardenDungeon = useStore(selectGardenDungeon);
  const { beginTurn, confirmMulligan, endTurn, endAndBeginAgain } = useStore.getState();

  const isGarden = gardenDungeon.phase === 'active';
  const gardenPrimary: React.CSSProperties = isGarden ? {
    background: 'linear-gradient(180deg, rgba(32,36,50,0.98) 0%, rgba(10,12,18,0.98) 100%)',
    border: '1px solid rgba(255,255,255,0.75)',
    color: '#ffffff',
    boxShadow: '0 0 18px rgba(255,255,255,0.2), 0 6px 18px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.25)',
  } : {};

  const deckReady = deck.deckList.length > 0;

  if (turn.phase === 'idle') {
    return (
      <div style={styles.container}>
        <button className="menu-tactile-btn"
          style={{ ...styles.btn, ...styles.primary, ...gardenPrimary, ...(!deckReady ? styles.disabled : {}) }}
          onClick={onBeginTurn ?? beginTurn}
        >
          Begin Turn
        </button>
      </div>
    );
  }

  if (turn.phase === 'mulligan') {
    const selected = (turn.mulliganSelected ?? []).length;
    return (
      <div style={styles.container}>
        <div style={{ color: isGarden ? 'rgba(255,255,255,0.7)' : 'rgba(244,244,248,0.55)', fontSize: 11, textAlign: 'center', letterSpacing: 1 }}>
          {selected > 0 ? `Discarding ${selected} card${selected > 1 ? 's' : ''}` : 'Select cards to swap'}
        </div>
        <button className="menu-tactile-btn" style={{ ...styles.btn, ...styles.primary, ...gardenPrimary }} onClick={confirmMulligan}>
          {selected > 0 ? `Swap ${selected}` : 'Keep Hand'}
        </button>
      </div>
    );
  }

  if (turn.phase === 'playing') {
    const handEmpty = deck.hand.length === 0;
    return (
      <div style={styles.container}>
        {handEmpty && (
          <div style={{ color: isGarden ? 'rgba(255,255,255,0.65)' : 'rgba(244,244,248,0.5)', fontSize: 10, textAlign: 'center', letterSpacing: 1.2, lineHeight: 1.4 }}>
            Hand empty — resolve & draw next turn
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <button 
            className="menu-tactile-btn" 
            style={{ ...styles.btn, ...styles.primary, ...gardenPrimary, flex: 1, padding: '14px 12px', fontSize: 14, letterSpacing: 2.5 }} 
            onClick={endTurn} 
            title="Ends play phase, resolves turn-end effects, and starts setup for the next turn."
          >
            End Turn
          </button>
          <button 
            className="menu-tactile-btn" 
            style={{ ...styles.btn, ...styles.primary, ...gardenPrimary, flex: 1, padding: '14px 12px', fontSize: 14, letterSpacing: 2.5 }} 
            onClick={endAndBeginAgain} 
            title="Ends current turn and immediately begins the next turn."
          >
            End and Begin Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
