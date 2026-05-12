import { useStore, selectDeck, selectTurn } from '@/state/store';
import { warmTheme } from '@/ui/theme';

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 160,
    right: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    pointerEvents: 'none',
    fontFamily: 'Georgia, serif',
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: warmTheme.surface,
    border: `1px solid ${warmTheme.border}`,
    borderRadius: 20,
    padding: '6px 14px',
    boxShadow: warmTheme.glow,
  },
  icon: { fontSize: 14 },
  count: { fontSize: 16, fontWeight: 'bold', color: warmTheme.accentDeep },
  label: { fontSize: 11, color: warmTheme.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' },
};

export default function DeckStatus() {
  const deck = useStore(selectDeck);
  const turn = useStore(selectTurn);

  return (
    <div style={styles.container}>
      <div style={styles.pill}>
        <span style={styles.icon}>🃏</span>
        <span style={styles.count}>{deck.drawPile.length}</span>
        <span style={styles.label}>Deck</span>
      </div>
      <div style={styles.pill}>
        <span style={styles.icon}>♻</span>
        <span style={styles.count}>{deck.discardPile.length}</span>
        <span style={styles.label}>Discard</span>
      </div>
      {turn.phase !== 'idle' && (
        <div style={styles.pill}>
          <span style={styles.icon}>✋</span>
          <span style={styles.count}>{deck.hand.length}</span>
          <span style={styles.label}>Hand</span>
        </div>
      )}
    </div>
  );
}
