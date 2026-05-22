import { useState } from 'react';
import { useStore } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { ELEMENT_COLORS, ELEMENT_SET_NAMES } from '@/data/elements';
import { warmTheme } from '@/ui/theme';
import { t } from '@/ui/preferences';
import type { CardDefinition } from '@/types/cards';
import type { SavedDeck } from '@/types/game';

const RARITY_COLORS: Record<string, string> = {
  Common: '#999', Rare: '#5b9bd5', Epic: '#9b59b6', Legendary: '#f39c12', Eternal: '#ff6b6b', Infinite: '#e8e8f0',
};

const TYPE_ORDER: CardDefinition['type'][] = ['Ophanim', 'Seraphim', 'Cherubim', 'Angel'];
const TYPE_LABELS: Record<CardDefinition['type'], string> = {
  Ophanim: 'Ophanim',
  Seraphim: 'Seraphim',
  Cherubim: 'Cherubim',
  Angel: 'Angel',
};
const RARITY_ORDER: Record<string, number> = {
  Common: 0, Rare: 1, Epic: 2, Legendary: 3, Eternal: 4, Infinite: 5,
};

type PreviewSection = {
  label: string;
  entries: Array<{ definitionId: string; copies: number; def: CardDefinition }>;
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(circle at 12% 10%, rgba(221, 195, 146, 0.18) 0%, rgba(221, 195, 146, 0) 34%), radial-gradient(circle at 86% 84%, rgba(92, 127, 163, 0.18) 0%, rgba(92, 127, 163, 0) 40%), repeating-linear-gradient(115deg, rgba(227, 205, 163, 0.07) 0px, rgba(227, 205, 163, 0.07) 2px, rgba(0, 0, 0, 0) 2px, rgba(0, 0, 0, 0) 26px), linear-gradient(180deg, rgba(19, 23, 26, 0.97) 0%, rgba(27, 34, 38, 0.97) 100%)',
    zIndex: 50,
    display: 'flex', flexDirection: 'column', pointerEvents: 'auto',
    fontFamily: 'Georgia, serif', color: '#ead9c0',
  },
  header: {
    padding: '14px 24px', borderBottom: `1px solid ${warmTheme.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
    background: 'rgba(9, 14, 20, 0.42)',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#f0bd78', letterSpacing: 2 },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  deckList: {
    width: 240, borderRight: `1px solid ${warmTheme.border}`,
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    background: 'rgba(9, 14, 20, 0.36)',
  },
  deckListHeader: {
    padding: '10px 14px', fontSize: 9, letterSpacing: 2,
    textTransform: 'uppercase', opacity: 0.85, borderBottom: `1px solid ${warmTheme.border}`,
    color: '#f0bd78',
    flexShrink: 0,
  },
  deckListScroll: { flex: 1, overflowY: 'auto', padding: '8px 0' },
  deckRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 14px', cursor: 'pointer',
    borderBottom: `1px solid ${warmTheme.border}`,
    transition: 'background 0.12s',
  },
  deckRowActive: { background: 'rgba(255, 208, 140, 0.16)' },
  deckName: {
    flex: 1, fontSize: 12, color: '#ead9c0',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  deckMeta: { fontSize: 10, color: 'rgba(234, 217, 192, 0.72)' },
  preview: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  previewHeader: {
    padding: '12px 18px', borderBottom: `1px solid ${warmTheme.border}`,
    display: 'flex', alignItems: 'baseline', gap: 10, flexShrink: 0,
    background: 'rgba(9, 14, 20, 0.3)',
  },
  previewTitle: { fontSize: 16, fontWeight: 'bold', color: '#f0bd78' },
  previewScroll: { flex: 1, overflowY: 'auto', padding: 16 },
  sectionHeader: {
    fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
    opacity: 0.9, marginBottom: 6, marginTop: 12, color: '#f0bd78',
  },
  cardRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '4px 0', borderBottom: `1px solid ${warmTheme.border}`,
  },
  cardName: { fontSize: 11, color: '#ead9c0', flex: 1 },
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
    background: 'rgba(255, 237, 213, 0.94)', color: '#5f3a17', fontSize: 12,
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
    const grouped = new Map<string, { definitionId: string; copies: number; def: CardDefinition }>();

    const pushEntry = (definitionId: string, copies: number) => {
      const def = CardRegistry.get(definitionId);
      if (!def) return;

      const existing = grouped.get(definitionId);
      if (existing) {
        existing.copies += copies;
        return;
      }

      grouped.set(definitionId, { definitionId, copies, def });
    };

    deck.deckList.forEach(entry => pushEntry(entry.definitionId, entry.copies));
    (deck.extraDeck ?? []).forEach(entry => pushEntry(entry.definitionId, 1));

    const totalCards = deck.deckList.reduce((s, e) => s + e.copies, 0) + (deck.extraDeck?.length ?? 0);

    const elements = new Set<string>();
    grouped.forEach(entry => {
      elements.add(entry.def.element);
    });

    const sections: PreviewSection[] = TYPE_ORDER.map(typeLabel => ({
      label: TYPE_LABELS[typeLabel],
      entries: Array.from(grouped.values())
        .filter(entry => entry.def.type === typeLabel)
        .sort((left, right) => {
          const rarityDelta = (RARITY_ORDER[left.def.rarity] ?? Number.MAX_SAFE_INTEGER)
            - (RARITY_ORDER[right.def.rarity] ?? Number.MAX_SAFE_INTEGER);
          if (rarityDelta !== 0) return rarityDelta;
          return left.def.name.localeCompare(right.def.name);
        }),
    })).filter(section => section.entries.length > 0);

    return { sections, totalCards, elements };
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.header}>
        <div style={styles.title}>{t('myDecks')}</div>
        <button style={styles.closeBtn} onClick={onClose}>{t('close')}</button>
      </div>

      <div style={styles.body}>
        {/* Deck list column */}
        <div style={styles.deckList}>
          <div style={styles.deckListHeader}>{t('savedDecks')} ({savedDecks.length})</div>
          <div style={styles.deckListScroll}>
            {savedDecks.map(deck => {
              const totalCards = deck.deckList.reduce((s, e) => s + e.copies, 0) + (deck.extraDeck?.length ?? 0);
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
                    <div style={styles.loadedBadge}>{t('activeDeck')}</div>
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
              const { sections, totalCards, elements } = buildPreview(selectedDeck);
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
                    {sections.map((section, index) => (
                      <>
                        <div style={{ ...styles.sectionHeader, marginTop: index === 0 ? 12 : 16 }}>
                          {section.label}
                        </div>
                        {section.entries.map(entry => (
                          <div key={entry.definitionId} style={styles.cardRow}>
                            <div style={styles.cardName}>{entry.def.name}</div>
                            <div style={{ ...styles.cardRarity, color: RARITY_COLORS[entry.def.rarity] ?? '#aaa' }}>
                              {entry.def.rarity}
                            </div>
                            <div style={styles.cardCopies}>×{entry.copies}</div>
                          </div>
                        ))}
                      </>
                    ))}
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
              if (!window.confirm(`Delete deck "${selectedDeck.name}"? This cannot be undone.`)) return;
              deleteSavedDeck(selectedDeck.id);
              setSelectedId(savedDecks.find(d => d.id !== selectedDeck.id)?.id ?? '');
            }}
          >
            Delete
          </button>
        )}
        <button style={styles.closeBtn} onClick={onOpenDeckBuilder}>{t('deckBuilder')}</button>
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
