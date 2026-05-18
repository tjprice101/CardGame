import { useMemo, useState } from 'react';
import { useStore, selectDeck, selectTurn } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { warmTheme } from '@/ui/theme';
import { getCardFaceBackgroundStyle } from '@/ui/cardBackgrounds';

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    pointerEvents: 'auto',
    fontFamily: 'Georgia, serif',
    alignItems: 'flex-end',
    width: '100%',
    zIndex: 1,
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
    fontFamily: 'Georgia, serif',
    color: warmTheme.text,
    appearance: 'none',
    WebkitAppearance: 'none',
  },
  icon: { fontSize: 14 },
  count: { fontSize: 16, fontWeight: 'bold', color: warmTheme.accentDeep },
  label: { fontSize: 11, color: warmTheme.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' },
  hint: { fontSize: 9, color: warmTheme.textFaint, letterSpacing: 0.8 },
};

type PileType = 'deck' | 'discard' | 'hand';

export default function DeckStatus() {
  const deck = useStore(selectDeck);
  const turn = useStore(selectTurn);
  const [openPile, setOpenPile] = useState<PileType | null>(null);
  const canInspectDeck = turn.phase === 'idle';

  const pileEntries = useMemo(() => {
    if (!openPile) return [];
    const source = openPile === 'deck'
      ? deck.drawPile
      : openPile === 'discard'
        ? deck.discardPile
        : deck.hand;
    return source.map((c, idx) => {
      const def = CardRegistry.get(c.definitionId);
      return {
        key: `${c.instanceId}-${idx}`,
        definitionId: c.definitionId,
        name: def?.name ?? c.definitionId,
        type: def?.type ?? 'Card',
        finish: c.finish,
        def,
      };
    });
  }, [openPile, deck.drawPile, deck.discardPile, deck.hand]);

  return (
    <div style={styles.container}>
      <button
        style={{
          ...styles.pill,
          cursor: canInspectDeck ? 'pointer' : 'not-allowed',
          opacity: canInspectDeck ? 1 : 0.82,
        }}
        onClick={canInspectDeck ? () => setOpenPile('deck') : undefined}
      >
        <span style={styles.icon}>🃏</span>
        <span style={styles.count}>{deck.drawPile.length}</span>
        <span style={styles.label}>Deck</span>
        <span style={styles.hint}>{canInspectDeck ? 'click' : 'hidden in-run'}</span>
      </button>
      <button style={{ ...styles.pill, cursor: 'pointer' }} onClick={() => setOpenPile('discard')}>
        <span style={styles.icon}>♻</span>
        <span style={styles.count}>{deck.discardPile.length}</span>
        <span style={styles.label}>Discard</span>
        <span style={styles.hint}>click</span>
      </button>
      {turn.phase !== 'idle' && (
        <button style={{ ...styles.pill, cursor: 'pointer' }} onClick={() => setOpenPile('hand')}>
          <span style={styles.icon}>✋</span>
          <span style={styles.count}>{deck.hand.length}</span>
          <span style={styles.label}>Hand</span>
          <span style={styles.hint}>click</span>
        </button>
      )}

      {openPile && (openPile !== 'deck' || canInspectDeck) && (
        <div
          className="ornate-scroll"
          style={{
            position: 'absolute',
            top: 0,
            right: 'calc(100% + 10px)',
            width: 380,
            maxHeight: 420,
            borderRadius: 12,
            border: `1px solid ${warmTheme.borderStrong}`,
            background: warmTheme.surfaceStrong,
            boxShadow: warmTheme.shadow,
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: warmTheme.accentDeep }}>
              {openPile} ({pileEntries.length})
            </div>
            <button
              onClick={() => setOpenPile(null)}
              style={{
                border: `1px solid ${warmTheme.border}`,
                background: warmTheme.surface,
                color: warmTheme.textMuted,
                borderRadius: 6,
                fontSize: 10,
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
                padding: '2px 8px',
              }}
            >
              Close
            </button>
          </div>
          {pileEntries.length === 0 && (
            <div style={{ fontSize: 11, color: warmTheme.textMuted, textAlign: 'center', padding: '8px 0' }}>
              Empty
            </div>
          )}
          {pileEntries.length > 0 && (
            <div
              className="ornate-scroll"
              style={{
                overflowY: 'auto',
                paddingTop: 4,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))',
                gap: 8,
              }}
            >
              {pileEntries.map((entry) => (
                <div key={entry.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div
                    style={{
                      height: 132,
                      borderRadius: 8,
                      border: `1px solid ${warmTheme.border}`,
                      overflow: 'hidden',
                      background: warmTheme.surface,
                      ...getCardFaceBackgroundStyle(entry.def ?? null, entry.finish),
                    }}
                    title={`${entry.name} (${entry.type})`}
                  />
                  <div style={{ fontSize: 10, color: warmTheme.text, lineHeight: 1.2 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
                    <div style={{ color: warmTheme.textMuted, fontSize: 9 }}>
                      {entry.type} · {entry.finish}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
