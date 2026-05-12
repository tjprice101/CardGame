import { useState } from 'react';
import { useStore } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { ELEMENT_COLORS, ELEMENT_SET_NAMES } from '@/data/elements';
import { warmTheme } from '@/ui/theme';
import type { SavedDeck } from '@/types/game';

const RARITY_COLORS: Record<string, string> = {
  Common: '#999', Rare: '#5b9bd5', Epic: '#9b59b6', Legendary: '#f39c12',
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute', inset: 0, background: warmTheme.overlay, zIndex: 50,
    display: 'flex', flexDirection: 'column', pointerEvents: 'auto',
    fontFamily: 'Georgia, serif', color: warmTheme.text,
  },
  header: {
    padding: '14px 24px', borderBottom: `1px solid ${warmTheme.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: warmTheme.accentDeep, letterSpacing: 2 },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  deckList: {
    width: 240, borderRight: `1px solid ${warmTheme.border}`,
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  deckListHeader: {
    padding: '10px 14px', fontSize: 9, letterSpacing: 2,
    textTransform: 'uppercase', opacity: 0.5, borderBottom: `1px solid ${warmTheme.border}`,
    flexShrink: 0,
  },
  deckListScroll: { flex: 1, overflowY: 'auto', padding: '8px 0' },
  deckRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 14px', cursor: 'pointer',
    borderBottom: `1px solid ${warmTheme.border}`,
    transition: 'background 0.12s',
  },
  deckRowActive: { background: warmTheme.surfaceMuted },
  deckName: {
    flex: 1, fontSize: 12, color: warmTheme.text,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  deckMeta: { fontSize: 10, color: warmTheme.textMuted },
  preview: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  previewHeader: {
    padding: '12px 18px', borderBottom: `1px solid ${warmTheme.border}`,
    display: 'flex', alignItems: 'baseline', gap: 10, flexShrink: 0,
  },
  previewTitle: { fontSize: 16, fontWeight: 'bold', color: warmTheme.accentDeep },
  previewScroll: { flex: 1, overflowY: 'auto', padding: 16 },
  sectionHeader: {
    fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
    opacity: 0.45, marginBottom: 6, marginTop: 12,
  },
  cardRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '4px 0', borderBottom: `1px solid ${warmTheme.border}`,
  },
  cardName: { fontSize: 11, color: warmTheme.text, flex: 1 },
  cardRarity: { fontSize: 10, marginRight: 8 },
  cardCopies: { fontSize: 11, color: warmTheme.accentDeep, minWidth: 24, textAlign: 'right' },
  footer: {
    padding: '12px 24px', borderTop: `1px solid ${warmTheme.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, flexShrink: 0,
  },
  loadBtn: {
    padding: '9px 24px', borderRadius: 10, border: `1px solid ${warmTheme.borderStrong}`,
    background: warmTheme.button, color: warmTheme.accentDeep, fontSize: 13,
    cursor: 'pointer', letterSpacing: 1, fontFamily: 'Georgia, serif',
  },
  closeBtn: {
    padding: '8px 18px', borderRadius: 10, border: `1px solid ${warmTheme.border}`,
    background: warmTheme.surface, color: warmTheme.textMuted, fontSize: 12,
    cursor: 'pointer', fontFamily: 'Georgia, serif',
  },
  emptyPreview: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, color: warmTheme.textFaint, fontStyle: 'italic',
  },
  loadedBadge: {
    fontSize: 9, letterSpacing: 1, color: warmTheme.success,
    border: '1px solid rgba(79,138,71,0.3)', borderRadius: 10, padding: '2px 7px',
  },
};

interface Props { onClose: () => void; onOpenDeckBuilder: () => void }

export default function DeckViewer({ onClose, onOpenDeckBuilder }: Props) {
  const savedDecks = useStore(s => s.progress.savedDecks);
  const activeDeckId = useStore(s => s.progress.activeDeckId);
  const { loadSavedDeck, deleteSavedDeck } = useStore.getState();

  const [selectedId, setSelectedId] = useState<string>(activeDeckId ?? savedDecks[0]?.id ?? '');

  const selectedDeck = savedDecks.find(d => d.id === selectedId) ?? null;

  function handleLoad(deck: SavedDeck) {
    loadSavedDeck(deck.id);
    onClose();
  }

  function buildPreview(deck: SavedDeck) {
    const seraphims = deck.deckList.filter(e => {
      const def = CardRegistry.get(e.definitionId);
      return def?.type === 'Seraphim';
    });
    const hrs = deck.deckList.filter(e => {
      const def = CardRegistry.get(e.definitionId);
      return def?.type === 'Seeker' || def?.type === 'Chaos';
    });
    const totalCards = deck.deckList.reduce((s, e) => s + e.copies, 0);

    const elements = new Set<string>();
    deck.deckList.forEach(e => {
      const def = CardRegistry.get(e.definitionId);
      if (def) elements.add(def.element);
    });

    return { seraphims, hrs, totalCards, elements };
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.header}>
        <div style={styles.title}>My Decks</div>
        <button style={styles.closeBtn} onClick={onClose}>Close</button>
      </div>

      <div style={styles.body}>
        {/* Deck list column */}
        <div style={styles.deckList}>
          <div style={styles.deckListHeader}>Saved Decks ({savedDecks.length})</div>
          <div style={styles.deckListScroll}>
            {savedDecks.map(deck => {
              const totalCards = deck.deckList.reduce((s, e) => s + e.copies, 0);
              return (
                <div
                  key={deck.id}
                  style={{
                    ...styles.deckRow,
                    ...(deck.id === selectedId ? styles.deckRowActive : {}),
                  }}
                  onClick={() => setSelectedId(deck.id)}
                >
                  <div>
                    <div style={styles.deckName}>
                      {deck.isStarter ? '🔒 ' : ''}{deck.name}
                    </div>
                    <div style={styles.deckMeta}>{totalCards} cards</div>
                  </div>
                  {deck.id === activeDeckId && (
                    <div style={styles.loadedBadge}>Active</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Preview column */}
        {selectedDeck ? (
          <div style={styles.preview}>
            {(() => {
              const { seraphims, hrs, totalCards, elements } = buildPreview(selectedDeck);
              return (
                <>
                  <div style={styles.previewHeader}>
                    <div style={styles.previewTitle}>{selectedDeck.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,215,0,0.5)' }}>
                      {totalCards} cards
                    </div>
                    {[...elements].map(el => (
                      <div key={el} style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 10,
                        border: `1px solid ${ELEMENT_COLORS[el] ?? '#888'}44`,
                        color: ELEMENT_COLORS[el] ?? '#aaa',
                      }}>
                        {ELEMENT_SET_NAMES[el] ?? el}
                      </div>
                    ))}
                  </div>

                  <div style={styles.previewScroll}>
                    {seraphims.length > 0 && (
                      <>
                        <div style={styles.sectionHeader}>Seraphim</div>
                        {seraphims.map(entry => {
                          const def = CardRegistry.get(entry.definitionId);
                          return (
                            <div key={entry.definitionId} style={styles.cardRow}>
                              <div style={styles.cardName}>{def?.name ?? entry.definitionId}</div>
                              <div style={{ ...styles.cardRarity, color: RARITY_COLORS[def?.rarity ?? ''] ?? '#aaa' }}>
                                {def?.rarity}
                              </div>
                              <div style={styles.cardCopies}>×{entry.copies}</div>
                            </div>
                          );
                        })}
                      </>
                    )}

                    {hrs.length > 0 && (
                      <>
                        <div style={{ ...styles.sectionHeader, marginTop: seraphims.length > 0 ? 16 : 12 }}>
                          HR Cards
                        </div>
                        {hrs.map(entry => {
                          const def = CardRegistry.get(entry.definitionId);
                          return (
                            <div key={entry.definitionId} style={styles.cardRow}>
                              <div style={styles.cardName}>{def?.name ?? entry.definitionId}</div>
                              <div style={{ ...styles.cardRarity, color: RARITY_COLORS[def?.rarity ?? ''] ?? '#aaa' }}>
                                {def?.rarity}
                              </div>
                              <div style={styles.cardCopies}>×{entry.copies}</div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <div style={styles.emptyPreview}>Select a deck to preview</div>
        )}
      </div>

      <div style={styles.footer}>
        {selectedDeck && !selectedDeck.isStarter && selectedDeck.id !== activeDeckId && (
          <button
            style={{ ...styles.closeBtn, color: 'rgba(255,100,100,0.6)', borderColor: 'rgba(255,80,80,0.2)' }}
            onClick={() => {
              deleteSavedDeck(selectedDeck.id);
              setSelectedId(savedDecks.find(d => d.id !== selectedDeck.id)?.id ?? '');
            }}
          >
            Delete
          </button>
        )}
        <button style={styles.closeBtn} onClick={onOpenDeckBuilder}>Edit in Builder</button>
        {selectedDeck && selectedDeck.id !== activeDeckId && (
          <button style={styles.loadBtn} onClick={() => handleLoad(selectedDeck)}>
            Load Deck
          </button>
        )}
        {selectedDeck && selectedDeck.id === activeDeckId && (
          <div style={{ fontSize: 12, color: '#80e860' }}>This deck is active</div>
        )}
      </div>
    </div>
  );
}
