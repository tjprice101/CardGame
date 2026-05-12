import { useState, useMemo } from 'react';
import { useStore, selectDeck } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { DeckSystem } from '@/systems/cards/DeckSystem';
import { ELEMENT_COLORS, ELEMENT_SET_NAMES } from '@/data/elements';
import { warmTheme } from '@/ui/theme';
import type { DeckEntry } from '@/types/game';
import type { AngelDefinition } from '@/types/cards';

const RARITY_ORDER = { Common: 0, Rare: 1, Epic: 2, Legendary: 3 };
const SECTION_COLORS: Record<string, string> = {
  Angel: warmTheme.accentDeep, Seraphim: warmTheme.accentDeep, Chaos: warmTheme.chaos, Seeker: '#7f629f',
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
  deckCount: { fontSize: 13, opacity: 0.7 },
  filterBar: {
    padding: '8px 16px', borderBottom: `1px solid ${warmTheme.border}`,
    display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '5px 14px', borderRadius: 20, border: `1px solid ${warmTheme.border}`,
    background: warmTheme.surface, color: warmTheme.textMuted, fontSize: 11,
    cursor: 'pointer', fontFamily: 'Georgia, serif', letterSpacing: 1, transition: 'all 0.15s',
  },
  filterBtnActive: {
    background: warmTheme.surfaceMuted, borderColor: warmTheme.borderStrong, color: warmTheme.accentDeep,
  },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  cardPool: { flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 0 },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 0 6px', marginBottom: 8,
    borderBottom: `1px solid ${warmTheme.border}`,
  },
  sectionLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase' },
  sectionCount: { fontSize: 9, color: warmTheme.textFaint, letterSpacing: 1 },
  sectionGrid: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  card: {
    width: 100, height: 136, background: warmTheme.surfaceStrong,
    border: `1px solid ${warmTheme.border}`, borderRadius: 12, cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '8px 6px 6px', transition: 'border-color 0.15s, box-shadow 0.15s',
    position: 'relative',
  },
  cardAdded: { borderColor: warmTheme.borderStrong, boxShadow: warmTheme.glow },
  cardFull: { opacity: 0.4, cursor: 'not-allowed' },
  cardName: { fontSize: 10, fontWeight: 'bold', color: warmTheme.accentDeep, textAlign: 'center', lineHeight: 1.3 },
  cardDesc: { fontSize: 8, color: warmTheme.textSoft, textAlign: 'center', lineHeight: 1.3, marginTop: 4, flexGrow: 1 },
  cardSubtype: { fontSize: 7, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  badge: {
    position: 'absolute', top: 4, right: 4, width: 18, height: 18,
    borderRadius: '50%', background: warmTheme.button, color: warmTheme.accentDeep,
    fontSize: 10, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  ownedLabel: {
    fontSize: 7, color: warmTheme.textFaint, letterSpacing: 0.5,
    position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center',
  },
  sidebar: {
    width: 260, borderLeft: `1px solid ${warmTheme.border}`,
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  sidebarSection: {
    padding: '10px 12px', borderBottom: `1px solid ${warmTheme.border}`, flexShrink: 0,
  },
  sidebarSectionTitle: {
    fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
    opacity: 0.5, marginBottom: 8,
  },
  savedDeckRow: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '5px 0', borderBottom: `1px solid ${warmTheme.border}`,
  },
  savedDeckName: { fontSize: 11, color: warmTheme.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  deckList: { flex: 1, overflowY: 'auto', padding: 12 },
  entryRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '4px 0', borderBottom: `1px solid ${warmTheme.border}`,
  },
  entryName: { fontSize: 11, color: warmTheme.text, flex: 1 },
  entryCount: { fontSize: 11, color: warmTheme.accentDeep, margin: '0 6px', minWidth: 14, textAlign: 'center' },
  entryBtn: {
    width: 20, height: 20, border: `1px solid ${warmTheme.borderStrong}`, borderRadius: 6,
    background: warmTheme.surface, color: warmTheme.accentDeep, fontSize: 13, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
  },
  footer: {
    padding: '12px 24px', borderTop: `1px solid ${warmTheme.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
  },
  startBtn: {
    padding: '10px 28px', borderRadius: 10, border: `1px solid ${warmTheme.borderStrong}`,
    background: warmTheme.button, color: warmTheme.accentDeep, fontSize: 14,
    cursor: 'pointer', letterSpacing: 1, fontFamily: 'Georgia, serif',
  },
  closeBtn: {
    padding: '8px 18px', borderRadius: 10, border: `1px solid ${warmTheme.border}`,
    background: warmTheme.surface, color: warmTheme.textMuted, fontSize: 12,
    cursor: 'pointer', fontFamily: 'Georgia, serif',
  },
  miniBtn: {
    padding: '3px 8px', borderRadius: 6, border: `1px solid ${warmTheme.borderStrong}`,
    background: warmTheme.surface, color: warmTheme.accentDeep, fontSize: 10,
    cursor: 'pointer', fontFamily: 'Georgia, serif', flexShrink: 0,
  },
  miniBtnDanger: {
    borderColor: 'rgba(184,92,79,0.35)', color: warmTheme.danger,
  },
  empty: {
    width: '100%', textAlign: 'center', marginTop: 40,
    fontSize: 13, color: warmTheme.textFaint, fontStyle: 'italic',
  },
  nameInput: {
    background: warmTheme.surface, border: `1px solid ${warmTheme.borderStrong}`,
    color: warmTheme.text, fontSize: 12, padding: '4px 8px', borderRadius: 6,
    fontFamily: 'Georgia, serif', outline: 'none', width: '100%', boxSizing: 'border-box',
  },
};

interface Props { onClose: () => void }

export default function DeckBuilder({ onClose }: Props) {
  const { initDeck, saveCurrentDeck, updateSavedDeck, loadSavedDeck, deleteSavedDeck } = useStore.getState();
  const currentDeck = useStore(selectDeck);
  const collection = useStore(s => s.progress.collection);
  const savedDecks = useStore(s => s.progress.savedDecks);
  const activeDeckId = useStore(s => s.progress.activeDeckId);
  const uniqueOwned = Object.keys(collection).length;
  const isLocked = uniqueOwned < 15;

  const activeDeck = savedDecks.find(d => d.id === activeDeckId) ?? null;
  const isEditingStarter = activeDeck?.isStarter ?? false;

  const [deckList, setDeckList] = useState<DeckEntry[]>(
    currentDeck.deckList.length > 0 ? [...currentDeck.deckList] : []
  );
  const [extraDeckList, setExtraDeckList] = useState<string[]>(
    currentDeck.extraDeck ? [...currentDeck.extraDeck] : []
  );
  const [elementFilter, setElementFilter] = useState<string | null>(null);
  const [saveMode, setSaveMode] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');

  // Card pool grouped into subsections (Angels go to Extra Deck section, excluded from main pool)
  const { mainSections, angelSection, availableElements } = useMemo(() => {
    const ownedCards = CardRegistry.getAll().filter(
      d => (collection[d.definitionId] ?? 0) > 0
    );
    const availableElements = [...new Set(
      ownedCards.filter(d => d.type !== 'Angel').map(d => d.element)
    )].sort();
    const filtered = ownedCards.filter(d => elementFilter === null || d.element === elementFilter);

    const byRarity = (a: { rarity: string }, b: { rarity: string }) =>
      (RARITY_ORDER[a.rarity as keyof typeof RARITY_ORDER] ?? 0) -
      (RARITY_ORDER[b.rarity as keyof typeof RARITY_ORDER] ?? 0);

    return {
      mainSections: [
        { label: 'Seraphim', cards: filtered.filter(d => d.type === 'Seraphim').sort(byRarity) },
        { label: 'Chaos', cards: filtered.filter(d => d.type === 'Chaos').sort(byRarity) },
        { label: 'Seeker', cards: filtered.filter(d => d.type === 'Seeker').sort(byRarity) },
      ].filter(s => s.cards.length > 0),
      angelSection: filtered.filter(d => d.type === 'Angel').sort(byRarity),
      availableElements,
    };
  }, [collection, elementFilter]);

  const deckMap = new Map<string, number>(deckList.map(e => [e.definitionId, e.copies]));
  const totalCards = deckList.reduce((sum, e) => sum + e.copies, 0);
  const validation = DeckSystem.validate(deckList);

  function addCard(defId: string) {
    const def = CardRegistry.get(defId);
    if (!def) return;

    if (def.type === 'Angel') {
      // Extra deck: max 5, max 1 copy per definition
      if (extraDeckList.includes(defId)) return;
      if (extraDeckList.length >= 5) return;
      setExtraDeckList(prev => [...prev, defId]);
      return;
    }

    const cap = Math.min(4, collection[defId] ?? 0);
    if ((deckMap.get(defId) ?? 0) >= cap) return;
    if (totalCards >= 50) return;
    setDeckList(prev => {
      const idx = prev.findIndex(e => e.definitionId === defId);
      if (idx === -1) return [...prev, { definitionId: defId, copies: 1 }];
      const next = [...prev];
      next[idx] = { ...next[idx], copies: Math.min(cap, next[idx].copies + 1) as 1 | 2 | 3 | 4 };
      return next;
    });
  }

  function removeCard(defId: string) {
    const def = CardRegistry.get(defId);
    if (!def) return;

    if (def.type === 'Angel') {
      setExtraDeckList(prev => prev.filter(id => id !== defId));
      return;
    }

    setDeckList(prev => {
      const idx = prev.findIndex(e => e.definitionId === defId);
      if (idx === -1) return prev;
      const next = [...prev];
      if (next[idx].copies <= 1) next.splice(idx, 1);
      else next[idx] = { ...next[idx], copies: (next[idx].copies - 1) as 1 | 2 | 3 | 4 };
      return next;
    });
  }

  function handleLoadSaved(id: string) {
    loadSavedDeck(id);
    const deck = savedDecks.find(d => d.id === id);
    if (deck) {
      setDeckList([...deck.deckList]);
      setExtraDeckList([...(deck.extraDeck ?? [])]);
    }
  }

  function handleSaveNew() {
    if (!newDeckName.trim() || !validation.valid) return;
    saveCurrentDeck(newDeckName.trim());
    setSaveMode(false);
    setNewDeckName('');
  }

  function handleUpdateCurrent() {
    if (!activeDeckId || isEditingStarter || !validation.valid) return;
    updateSavedDeck(activeDeckId, deckList, extraDeckList);
  }

  function handleStart() {
    initDeck(deckList, extraDeckList);
    onClose();
  }

  return (
    <div style={styles.overlay}>
      {isLocked && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 16, fontFamily: 'Georgia, serif',
        }}>
          <div style={{ fontSize: 40, opacity: 0.7 }}>🔒</div>
          <div style={{ fontSize: 18, color: '#FFD700', letterSpacing: 2 }}>Deck Builder Locked</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', maxWidth: 340, lineHeight: 1.6 }}>
            Collect 15 unique cards to unlock custom deck building.
            Open packs from the Card Store to grow your collection.
          </div>
          <div style={{ fontSize: 16, color: '#FFD700', marginTop: 8 }}>
            {uniqueOwned} <span style={{ opacity: 0.5, fontSize: 13 }}>/ 15 unique cards</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>Close</button>
        </div>
      )}

      <div style={styles.header}>
        <div>
          <div style={styles.title}>Deck Builder</div>
          {activeDeck && (
            <div style={{ fontSize: 11, color: 'rgba(255,215,0,0.55)', marginTop: 2 }}>
              {activeDeck.isStarter ? '🔒 ' : ''}{activeDeck.name}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <div style={styles.deckCount}>
            <span style={{ color: totalCards === 50 ? '#80e860' : totalCards > 50 ? '#e86060' : '#FFD700' }}>
              {totalCards}
            </span>
            <span style={{ opacity: 0.5 }}> / 50 cards</span>
          </div>
          <div style={{ ...styles.deckCount, fontSize: 11 }}>
            <span style={{ color: '#FFD700' }}>{extraDeckList.length}</span>
            <span style={{ opacity: 0.5 }}> / 5 extra deck</span>
          </div>
        </div>
      </div>

      {/* Element filter tabs */}
      <div style={styles.filterBar}>
        <button
          style={{ ...styles.filterBtn, ...(elementFilter === null ? styles.filterBtnActive : {}) }}
          onClick={() => setElementFilter(null)}
        >All</button>
        {availableElements.map(el => (
          <button
            key={el}
            style={{
              ...styles.filterBtn,
              ...(elementFilter === el ? styles.filterBtnActive : {}),
              ...(elementFilter === el ? { color: ELEMENT_COLORS[el] ?? '#FFD700', borderColor: ELEMENT_COLORS[el] ?? '#FFD700' } : {}),
            }}
            onClick={() => setElementFilter(el === elementFilter ? null : el)}
          >
            {ELEMENT_SET_NAMES[el] ?? el}
          </button>
        ))}
      </div>

      <div style={styles.body}>
        {/* Card Pool */}
        <div style={styles.cardPool}>
          {/* Extra Deck section */}
          {angelSection.length > 0 && (
            <div>
              <div style={styles.sectionHeader}>
                <span style={{ ...styles.sectionLabel, color: SECTION_COLORS['Angel'] }}>
                  Extra Deck (Angels)
                </span>
                <span style={styles.sectionCount}>{extraDeckList.length} / 5 selected</span>
              </div>
              <div style={styles.sectionGrid}>
                {angelSection.map(def => {
                  const inExtra = extraDeckList.includes(def.definitionId);
                  const full = inExtra || extraDeckList.length >= 5;
                  return (
                    <div
                      key={def.definitionId}
                      style={{
                        ...styles.card,
                        ...(inExtra ? styles.cardAdded : {}),
                        ...(!inExtra && full ? styles.cardFull : {}),
                        border: `1px solid ${inExtra ? 'rgba(255,215,0,0.65)' : 'rgba(255,215,0,0.3)'}`,
                      }}
                      onClick={() => addCard(def.definitionId)}
                      title={def.description}
                    >
                      <div style={{ ...styles.cardSubtype, color: '#FFD700' }}>Angel</div>
                      <div style={styles.cardName}>{def.name}</div>
                      <div style={styles.cardDesc}>{def.description}</div>
                      {def.type === 'Angel' && (
                        <div style={{ fontSize: 7, color: 'rgba(255,215,0,0.4)', marginTop: 3, textAlign: 'center' }}>
                          Cost: {(def as AngelDefinition).summonCost.length} Seraphim
                        </div>
                      )}
                      {inExtra && <div style={styles.badge}>✓</div>}
                      <div style={styles.ownedLabel}>owns {collection[def.definitionId] ?? 0}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main deck sections */}
          {mainSections.length === 0 && angelSection.length === 0 && (
            <div style={styles.empty}>
              No {elementFilter ? (ELEMENT_SET_NAMES[elementFilter] ?? elementFilter) : ''} cards in your collection yet.
            </div>
          )}
          {mainSections.map(section => (
            <div key={section.label}>
              <div style={styles.sectionHeader}>
                <span style={{ ...styles.sectionLabel, color: SECTION_COLORS[section.label] ?? '#FFD700' }}>
                  {section.label}
                </span>
                <span style={styles.sectionCount}>{section.cards.length} card{section.cards.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={styles.sectionGrid}>
                {section.cards.map(def => {
                  const count = deckMap.get(def.definitionId) ?? 0;
                  const owned = collection[def.definitionId] ?? 0;
                  const cap = Math.min(4, owned);
                  const full = count >= cap;
                  const subtypeColor = SECTION_COLORS[def.type] ?? '#aaa';
                  return (
                    <div
                      key={def.definitionId}
                      style={{
                        ...styles.card,
                        ...(count > 0 ? styles.cardAdded : {}),
                        ...(full ? styles.cardFull : {}),
                      }}
                      onClick={() => addCard(def.definitionId)}
                      title={def.description}
                    >
                      <div style={{ ...styles.cardSubtype, color: subtypeColor }}>
                        {def.type}
                      </div>
                      <div style={styles.cardName}>{def.name}</div>
                      <div style={styles.cardDesc}>{def.description}</div>
                      {count > 0 && <div style={styles.badge}>{count}</div>}
                      <div style={styles.ownedLabel}>owns {owned}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div style={styles.sidebar}>
          {/* Saved decks */}
          <div style={styles.sidebarSection}>
            <div style={styles.sidebarSectionTitle}>Saved Decks</div>
            {savedDecks.map(sd => (
              <div key={sd.id} style={{
                ...styles.savedDeckRow,
                ...(sd.id === activeDeckId ? { background: 'rgba(255,215,0,0.06)', borderRadius: 4, padding: '5px 4px' } : {}),
              }}>
                <div style={styles.savedDeckName} title={sd.name}>
                  {sd.isStarter ? '🔒 ' : ''}{sd.name}
                </div>
                <button style={styles.miniBtn} onClick={() => handleLoadSaved(sd.id)}>Load</button>
                {!sd.isStarter && (
                  <button
                    style={{ ...styles.miniBtn, ...styles.miniBtnDanger }}
                    onClick={() => deleteSavedDeck(sd.id)}
                  >✕</button>
                )}
              </div>
            ))}
            {savedDecks.length === 1 && (
              <div style={{ fontSize: 10, opacity: 0.35, marginTop: 6, fontStyle: 'italic' }}>
                Build a deck below and save it to create a custom deck.
              </div>
            )}
          </div>

          {/* Save controls */}
          <div style={styles.sidebarSection}>
            <div style={styles.sidebarSectionTitle}>Save</div>
            {!isEditingStarter && activeDeckId && (
              <button
                style={{ ...styles.miniBtn, marginBottom: 6, opacity: validation.valid ? 1 : 0.35, cursor: validation.valid ? 'pointer' : 'not-allowed' }}
                onClick={handleUpdateCurrent}
              >
                Update "{activeDeck?.name}"
              </button>
            )}
            {saveMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <input
                  style={styles.nameInput}
                  placeholder="Deck name…"
                  value={newDeckName}
                  onChange={e => setNewDeckName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveNew(); if (e.key === 'Escape') setSaveMode(false); }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    style={{ ...styles.miniBtn, opacity: (validation.valid && newDeckName.trim()) ? 1 : 0.35 }}
                    onClick={handleSaveNew}
                  >Save</button>
                  <button style={{ ...styles.miniBtn, ...styles.miniBtnDanger }} onClick={() => { setSaveMode(false); setNewDeckName(''); }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button
                style={{ ...styles.miniBtn, opacity: validation.valid ? 1 : 0.35, cursor: validation.valid ? 'pointer' : 'not-allowed' }}
                onClick={() => validation.valid && setSaveMode(true)}
              >
                Save as New Deck
              </button>
            )}
          </div>

          {/* Extra deck list */}
          <div style={{ ...styles.sidebarSection, flexShrink: 0 }}>
            <div style={styles.sidebarSectionTitle}>Extra Deck ({extraDeckList.length} / 5)</div>
            {extraDeckList.length === 0 && (
              <div style={{ fontSize: 10, opacity: 0.3, fontStyle: 'italic' }}>No angels selected</div>
            )}
            {extraDeckList.map(defId => {
              const def = CardRegistry.get(defId);
              return (
                <div key={defId} style={styles.entryRow}>
                  <div style={styles.entryName}>{def?.name ?? defId}</div>
                  <button style={styles.entryBtn} onClick={() => removeCard(defId)}>−</button>
                </div>
              );
            })}
          </div>

          {/* Main deck list */}
          <div style={styles.deckList}>
            <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.5, marginBottom: 8 }}>
              Main Deck ({totalCards} / 50)
            </div>
            {deckList.length === 0 && (
              <div style={{ fontSize: 12, opacity: 0.3, textAlign: 'center', marginTop: 16 }}>
                Click cards to add them
              </div>
            )}
            {deckList.map(entry => {
              const def = CardRegistry.get(entry.definitionId);
              const cap = Math.min(4, collection[entry.definitionId] ?? 0);
              return (
                <div key={entry.definitionId} style={styles.entryRow}>
                  <div style={styles.entryName}>{def?.name ?? entry.definitionId}</div>
                  <button style={styles.entryBtn} onClick={() => removeCard(entry.definitionId)}>−</button>
                  <div style={styles.entryCount}>×{entry.copies}</div>
                  <button
                    style={{ ...styles.entryBtn, opacity: entry.copies >= cap ? 0.3 : 1 }}
                    onClick={() => addCard(entry.definitionId)}
                  >+</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <div>
          {!validation.valid && <div style={{ color: '#e86060', fontSize: 11 }}>{validation.errors[0]}</div>}
          {validation.valid && <div style={{ color: '#80e860', fontSize: 11 }}>Deck is valid — 50 cards</div>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={styles.closeBtn} onClick={onClose}>Close</button>
          <button
            style={{ ...styles.startBtn, opacity: validation.valid ? 1 : 0.4, cursor: validation.valid ? 'pointer' : 'not-allowed' }}
            onClick={validation.valid ? handleStart : undefined}
          >
            Reshuffle & Play
          </button>
        </div>
      </div>
    </div>
  );
}
