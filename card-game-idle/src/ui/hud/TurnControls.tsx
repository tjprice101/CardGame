import { useStore, selectTurn, selectDeck } from '@/state/store';
import { warmTheme } from '@/ui/theme';

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 278,
    right: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    pointerEvents: 'auto',
    fontFamily: 'Georgia, serif',
    zIndex: 15,
  },
  btn: {
    padding: '12px 28px',
    borderRadius: 10,
    border: `1px solid ${warmTheme.borderStrong}`,
    background: warmTheme.surfaceStrong,
    color: warmTheme.text,
    fontSize: 15,
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
    letterSpacing: 1,
    transition: 'background 0.15s, box-shadow 0.15s',
    boxShadow: warmTheme.glow,
  },
  primary: {
    background: warmTheme.button,
    color: warmTheme.accentDeep,
  },
  disabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
};

export default function TurnControls() {
  const turn = useStore(selectTurn);
  const deck = useStore(selectDeck);
  const { beginTurn, confirmMulligan, endTurn } = useStore.getState();

  const deckReady = deck.deckList.length > 0;

  if (turn.phase === 'idle') {
    return (
      <div style={styles.container}>
        <button
          style={{ ...styles.btn, ...styles.primary, ...(!deckReady ? styles.disabled : {}) }}
          onClick={beginTurn}
        >
          Begin Turn
        </button>
      </div>
    );
  }

  if (turn.phase === 'mulligan') {
    const selected = turn.mulliganSelected.length;
    return (
      <div style={styles.container}>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, textAlign: 'right' }}>
          {selected > 0 ? `Discarding ${selected} card${selected > 1 ? 's' : ''}` : 'Select cards to swap'}
        </div>
        <button style={{ ...styles.btn, ...styles.primary }} onClick={confirmMulligan}>
          {selected > 0 ? `Swap ${selected} Card${selected > 1 ? 's' : ''}` : 'Keep Hand'}
        </button>
      </div>
    );
  }

  if (turn.phase === 'playing') {
    const handEmpty = deck.hand.length === 0;
    return (
      <div style={styles.container}>
        {handEmpty && (
          <div style={{ color: warmTheme.textMuted, fontSize: 11, textAlign: 'right' }}>
            Hand empty
          </div>
        )}
        <button style={{ ...styles.btn, ...(handEmpty ? styles.primary : {}) }} onClick={endTurn}>
          End Turn
        </button>
      </div>
    );
  }

  return null;
}
