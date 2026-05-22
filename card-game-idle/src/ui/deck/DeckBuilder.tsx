import { useState, useMemo } from 'react';
import { useStore, selectDeck } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { DeckSystem } from '@/systems/cards/DeckSystem';
import { ELEMENT_COLORS, ELEMENT_SET_NAMES, getCardCategoryKey } from '@/data/elements';
import {
  cardFacePalette,
  getCardFaceBackgroundStyle,
  getCardFaceMetrics,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';
import CardRulesDigest from '@/ui/components/CardRulesDigest';
import { getDisplayCardTypeLabel, isDisplayCherubimType, isDisplayOphanimType } from '@/ui/preferences';
import { getCardPreviewLines } from '@/ui/cardStatSummary';
import { warmTheme } from '@/ui/theme';
import type { DeckEntry, ExtraDeckEntry } from '@/types/game';
import type { AngelDefinition, CardDefinition, CardFinish } from '@/types/cards';

const RARITY_ORDER = { Common: 0, Rare: 1, Epic: 2, Legendary: 3 };
const SECTION_COLORS: Record<string, string> = {
  Angel: warmTheme.accentDeep, Seraphim: '#f0bd78', Cherubim: warmTheme.cherubim, Ophanim: '#7f629f',
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(circle at 78% 12%, rgba(140, 174, 255, 0.16) 0%, rgba(140, 174, 255, 0) 32%), radial-gradient(circle at 18% 82%, rgba(196, 155, 90, 0.18) 0%, rgba(196, 155, 90, 0) 42%), repeating-linear-gradient(45deg, rgba(165, 128, 76, 0.06) 0px, rgba(165, 128, 76, 0.06) 1px, rgba(0, 0, 0, 0) 1px, rgba(0, 0, 0, 0) 24px), linear-gradient(180deg, rgba(14, 20, 32, 0.97) 0%, rgba(24, 32, 47, 0.97) 100%)',
    zIndex: 50,
    display: 'flex', flexDirection: 'column', pointerEvents: 'auto',
    fontFamily: 'Georgia, serif',
    color: '#ead9c0',
  },
  header: {
    padding: '14px 24px', borderBottom: `1px solid ${warmTheme.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
    background: 'rgba(8, 12, 18, 0.45)',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#f0bd78', letterSpacing: 2 },
  deckCount: { fontSize: 13, opacity: 0.7 },
  filterBar: {
    padding: '8px 16px', borderBottom: `1px solid ${warmTheme.border}`,
    display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap',
    background: 'rgba(8, 12, 18, 0.35)',
  },
  filterBtn: {
    padding: '5px 14px', borderRadius: 20, border: `1px solid ${warmTheme.border}`,
    background: 'rgba(255, 232, 199, 0.9)', color: '#68441f', fontSize: 11,
    cursor: 'pointer', fontFamily: 'Georgia, serif', letterSpacing: 1, transition: 'all 0.15s',
  },
  filterBtnActive: {
    background: 'rgba(255, 216, 154, 0.98)', borderColor: '#c48a49', color: '#6a3f17',
  },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  cardPool: { flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 0 },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 0 6px', marginBottom: 8,
    borderBottom: `1px solid ${warmTheme.border}`,
  },
  sectionLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase' },
  sectionCount: { fontSize: 9, color: 'rgba(232, 215, 191, 0.72)', letterSpacing: 1 },
  sectionGrid: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  cardWithMeta: {
    width: 100,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  card: {
    width: 100, height: 148, background: warmTheme.surfaceStrong,
    border: `1px solid ${warmTheme.border}`, borderRadius: 12, cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'stretch',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    position: 'relative', overflow: 'hidden',
  },
  cardAdded: { borderColor: warmTheme.borderStrong, boxShadow: warmTheme.glow },
  cardFull: { opacity: 0.4, cursor: 'not-allowed' },
  cardName: { fontWeight: 'bold', color: cardFacePalette.text, textAlign: 'center', lineHeight: 1.25 },
  cardDesc: { color: cardFacePalette.textSoft, textAlign: 'center', display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardSubtype: { letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4, textAlign: 'center' },
  badge: {
    position: 'absolute', top: 4, right: 4, width: 18, height: 18,
    borderRadius: '50%', background: warmTheme.button, color: warmTheme.accentDeep,
    fontSize: 10, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  ownedLabelBelow: {
    fontSize: 9, color: 'rgba(255, 255, 255, 0.96)', letterSpacing: 0.5,
    textAlign: 'center',
    opacity: 1,
    pointerEvents: 'none',
    textShadow: '0 1px 2px rgba(0,0,0,0.7)',
    background: 'rgba(13, 20, 32, 0.42)',
    border: `1px solid ${warmTheme.border}`,
    borderRadius: 6,
    padding: '2px 4px',
  },
  sidebar: {
    width: 260, borderLeft: `1px solid ${warmTheme.border}`,
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    background: 'rgba(8, 12, 18, 0.35)',
  },
  sidebarSection: {
    padding: '10px 12px', borderBottom: `1px solid ${warmTheme.border}`, flexShrink: 0,
    background: 'rgba(9, 14, 22, 0.4)',
  },
  sidebarSectionTitle: {
    fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
    opacity: 0.8, marginBottom: 8, color: '#f0bd78',
  },
  savedDeckRow: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '5px 0', borderBottom: `1px solid ${warmTheme.border}`,
  },
  savedDeckName: { fontSize: 11, color: '#e8d7bf', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  deckList: { flex: 1, overflowY: 'auto', padding: 12 },
  entryRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '4px 0', borderBottom: `1px solid ${warmTheme.border}`,
  },
  entryName: { fontSize: 11, color: '#e8d7bf', flex: 1 },
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
    background: 'rgba(255, 237, 213, 0.94)', color: '#5f3a17', fontSize: 12,
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
  sidebarActionRow: {
    display: 'flex', gap: 6, flexWrap: 'wrap',
  },
  empty: {
    width: '100%', textAlign: 'center', marginTop: 40,
    fontSize: 13, color: 'rgba(232, 215, 191, 0.68)', fontStyle: 'italic',
  },
  nameInput: {
    background: warmTheme.surface, border: `1px solid ${warmTheme.borderStrong}`,
    color: '#4f3418', fontSize: 12, padding: '4px 8px', borderRadius: 6,
    fontFamily: 'Georgia, serif', outline: 'none', width: '100%', boxSizing: 'border-box',
  },
};

interface Props { onClose: () => void }

interface CardVariantDisplay {
  key: string;
  finish: CardFinish;
  ownedCopies: number;
  def: CardDefinition;
}

function getVariantKey(definitionId: string, finish: CardFinish): string {
  return `${definitionId}::${finish}`;
}

function getHoloOwnedCount(collection: Record<string, number>, holoCollection: Record<string, number>, definitionId: string): number {
  return Math.min(holoCollection[definitionId] ?? 0, collection[definitionId] ?? 0);
}

function getOwnedCopiesForFinish(
  def: CardDefinition,
  finish: CardFinish,
  collection: Record<string, number>,
  holoCollection: Record<string, number>,
): number {
  const totalOwned = collection[def.definitionId] ?? 0;
  const holoOwned = getHoloOwnedCount(collection, holoCollection, def.definitionId);
  if (finish === 'holo') return holoOwned;
  if (def.rarity === 'Eternal') return 0;
  return Math.max(0, totalOwned - holoOwned);
}

function getFinishLabel(finish: CardFinish): string {
  return finish === 'holo' ? 'Holofoil' : 'Normal';
}

export default function DeckBuilder({ onClose }: Props) {
  const faceMetrics = getCardFaceMetrics('grid');
  const { initDeck, saveCurrentDeck, updateSavedDeck, loadSavedDeck, deleteSavedDeck } = useStore.getState();
  const currentDeck = useStore(selectDeck);
  const collection = useStore(s => s.progress.collection);
  const holoCollection = useStore(s => s.progress.holoCollection);
  const savedDecks = useStore(s => s.progress.savedDecks);
  const activeDeckId = useStore(s => s.progress.activeDeckId);
  const uniqueOwned = Object.keys(collection).length;
  const isLocked = uniqueOwned < 15;

  const activeDeck = savedDecks.find(d => d.id === activeDeckId) ?? null;
  const isEditingStarter = activeDeck?.isStarter ?? false;

  const [deckList, setDeckList] = useState<DeckEntry[]>(
    currentDeck.deckList.length > 0 ? [...currentDeck.deckList] : []
  );
  const [extraDeckList, setExtraDeckList] = useState<ExtraDeckEntry[]>(
    currentDeck.extraDeck ? [...currentDeck.extraDeck] : []
  );
  const [elementFilter, setElementFilter] = useState<string | null>(null);
  const [saveMode, setSaveMode] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');

  // Card pool grouped into subsections (Angels go to Extra Deck section, excluded from main pool)
  const { mainSections, angelSection, availableElements } = useMemo(() => {
    const ownedCards = CardRegistry.getAll().flatMap(def => {
      const variants: CardVariantDisplay[] = [];
      const normalOwned = getOwnedCopiesForFinish(def, 'normal', collection, holoCollection);
      const holoOwned = getOwnedCopiesForFinish(def, 'holo', collection, holoCollection);
      if (normalOwned > 0) {
        variants.push({
          key: getVariantKey(def.definitionId, 'normal'),
          finish: 'normal',
          ownedCopies: normalOwned,
          def,
        });
      }
      if (holoOwned > 0) {
        variants.push({
          key: getVariantKey(def.definitionId, 'holo'),
          finish: 'holo',
          ownedCopies: holoOwned,
          def,
        });
      }
      return variants;
    });
    const availableElements = [...new Set(
      ownedCards.map(d => getCardCategoryKey(d.def))
    )].sort();
    const filtered = ownedCards.filter(d => elementFilter === null || getCardCategoryKey(d.def) === elementFilter);

    const byRarity = (a: CardVariantDisplay, b: CardVariantDisplay) => {
      const rarityDelta = (RARITY_ORDER[a.def.rarity as keyof typeof RARITY_ORDER] ?? 0) -
        (RARITY_ORDER[b.def.rarity as keyof typeof RARITY_ORDER] ?? 0);
      if (rarityDelta !== 0) return rarityDelta;
      if (a.def.name !== b.def.name) return a.def.name.localeCompare(b.def.name);
      return a.finish.localeCompare(b.finish);
    };

    return {
      mainSections: [
        { label: 'Seraphim', cards: filtered.filter(d => d.def.type === 'Seraphim').sort(byRarity) },
        { label: 'Cherubim', cards: filtered.filter(d => isDisplayCherubimType(d.def.type)).sort(byRarity) },
        { label: 'Ophanim', cards: filtered.filter(d => isDisplayOphanimType(d.def.type)).sort(byRarity) },
      ].filter(s => s.cards.length > 0),
      angelSection: filtered.filter(d => d.def.type === 'Angel').sort(byRarity),
      availableElements,
    };
  }, [collection, holoCollection, elementFilter]);

  const deckMap = new Map<string, number>(deckList.map(e => [getVariantKey(e.definitionId, e.finish), e.copies]));
  const deckDefinitionCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of deckList) {
      counts.set(entry.definitionId, (counts.get(entry.definitionId) ?? 0) + entry.copies);
    }
    return counts;
  }, [deckList]);
  const extraDeckCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of extraDeckList) {
      const key = getVariantKey(entry.definitionId, entry.finish);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [extraDeckList]);
  const extraDeckDefinitionCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of extraDeckList) {
      counts.set(entry.definitionId, (counts.get(entry.definitionId) ?? 0) + 1);
    }
    return counts;
  }, [extraDeckList]);
  const extraDeckEntries = useMemo(
    () => Array.from(extraDeckCountMap.entries()).map(([key, copies]) => {
      const [definitionId, finish] = key.split('::') as [string, CardFinish];
      return { definitionId, finish, copies, key };
    }),
    [extraDeckCountMap],
  );
  const totalCards = deckList.reduce((sum, e) => sum + e.copies, 0);
  const validation = DeckSystem.validate(deckList);

  function addCard(defId: string, finish: CardFinish) {
    const def = CardRegistry.get(defId);
    if (!def) return;

    const ownedCopies = collection[defId] ?? 0;
    const ownedFinishCopies = getOwnedCopiesForFinish(def, finish, collection, holoCollection);

    if (def.type === 'Angel') {
      setExtraDeckList(prev => {
        const cap = Math.min(4, ownedCopies);
        const totalForDefinition = prev.filter(entry => entry.definitionId === defId).length;
        const totalForFinish = prev.filter(entry => entry.definitionId === defId && entry.finish === finish).length;
        if (cap <= 0 || ownedFinishCopies <= 0 || totalForDefinition >= cap || totalForFinish >= ownedFinishCopies || prev.length >= 10) return prev;
        return [...prev, { definitionId: defId, finish }];
      });
      return;
    }

    setDeckList(prev => DeckSystem.addDeckEntry(prev, defId, finish, ownedCopies, ownedFinishCopies));
  }

  function removeCard(defId: string, finish: CardFinish) {
    const def = CardRegistry.get(defId);
    if (!def) return;

    if (def.type === 'Angel') {
      setExtraDeckList(prev => {
        let idx = -1;
        for (let i = prev.length - 1; i >= 0; i--) {
          const entry = prev[i];
          if (entry.definitionId === defId && entry.finish === finish) {
            idx = i;
            break;
          }
        }
        if (idx === -1) return prev;
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      });
      return;
    }

    setDeckList(prev => {
      const idx = prev.findIndex(e => e.definitionId === defId && e.finish === finish);
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
    saveCurrentDeck(newDeckName.trim(), deckList, extraDeckList);
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

  function handleClearDeck() {
    setDeckList([]);
    setExtraDeckList([]);
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
          <button className="menu-tactile-btn" style={styles.closeBtn} onClick={onClose}>Close</button>
        </div>
      )}

      <div style={styles.header}>
        <div>
          <div style={styles.title}>Deck Builder</div>
          {activeDeck && (
            <div style={{ fontSize: 11, color: 'rgba(255, 209, 150, 0.86)', marginTop: 2 }}>
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
            <span style={{ opacity: 0.5 }}> / 10 extra deck</span>
          </div>
        </div>
      </div>

      {/* Element filter tabs */}
      <div style={styles.filterBar}>
        <button className="menu-tactile-btn"
          style={{ ...styles.filterBtn, ...(elementFilter === null ? styles.filterBtnActive : {}) }}
          onClick={() => setElementFilter(null)}
        >All</button>
        {availableElements.map(el => (
          <button className="menu-tactile-btn"
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
                <span style={styles.sectionCount}>{extraDeckList.length} / 10 selected</span>
              </div>
              <div style={styles.sectionGrid}>
                {angelSection.map(def => {
                  const variantKey = getVariantKey(def.def.definitionId, def.finish);
                  const count = extraDeckCountMap.get(variantKey) ?? 0;
                  const owned = def.ownedCopies;
                  const cap = Math.min(4, collection[def.def.definitionId] ?? 0);
                  const totalForDefinition = extraDeckDefinitionCountMap.get(def.def.definitionId) ?? 0;
                  const canAdd = count < owned && totalForDefinition < cap && extraDeckList.length < 10;
                  return (
                    <div key={def.key} style={styles.cardWithMeta}>
                      <div
                        className={def.finish === 'holo' || def.def.rarity === 'Infinite' || def.def.rarity === 'Eternal'
                          ? `holofoil-menu-card${def.def.rarity === 'Infinite' ? ' infinite-holo-bw-hover' : ''}${def.def.rarity === 'Eternal' ? ' eternal-holo-red-hover' : ''}`
                          : undefined}
                        style={{
                          ...styles.card,
                          ...getCardFaceBackgroundStyle(def.def, def.finish),
                          ...(count > 0 ? styles.cardAdded : {}),
                          ...(count === 0 && !canAdd ? styles.cardFull : {}),
                          border: `1px solid ${count > 0 ? 'rgba(255,215,0,0.65)' : 'rgba(255,215,0,0.3)'}`,
                        }}
                        onClick={() => addCard(def.def.definitionId, def.finish)}
                        title={getCardPreviewLines(def.def, 4).join('\n')}
                      >
                        <div style={getCardNameRibbonStyle('grid')}>
                          <div style={{ ...styles.cardSubtype, color: cardFacePalette.textMuted, fontSize: faceMetrics.typeSize }}>
                            Angel · {getFinishLabel(def.finish)}
                          </div>
                          <div style={{ ...styles.cardName, fontSize: faceMetrics.nameSize }}>{def.def.name}</div>
                        </div>
                        <div style={getCardRulesPanelStyle('grid')}>
                          <div style={{ ...styles.cardDesc, fontSize: faceMetrics.descSize, lineHeight: faceMetrics.descLineHeight }}>
                            <CardRulesDigest
                              card={def.def}
                              variant="preview"
                            maxSections={4}
                            maxLinesPerSection={10}
                            lineClamp={3}
                              labelColor={cardFacePalette.textMuted}
                              textColor={cardFacePalette.textSoft}
                              sectionBackground="transparent"
                              sectionBorder="transparent"
                            />
                          </div>
                          {def.def.type === 'Angel' && (
                            <div style={{ fontSize: 7, color: cardFacePalette.textMuted, marginTop: 5, textAlign: 'center' }}>
                              Cost: {(def.def as AngelDefinition).summonCost.length} materials
                            </div>
                          )}
                        </div>
                        {count > 0 && <div style={styles.badge}>{count}</div>}
                      </div>
                      <div style={styles.ownedLabelBelow}>owns {owned}</div>
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
                  const variantKey = getVariantKey(def.def.definitionId, def.finish);
                  const count = deckMap.get(variantKey) ?? 0;
                  const owned = def.ownedCopies;
                  const cap = Math.min(4, collection[def.def.definitionId] ?? 0);
                  const totalForDefinition = deckDefinitionCountMap.get(def.def.definitionId) ?? 0;
                  const full = count >= owned || totalForDefinition >= cap;
                  return (
                    <div key={def.key} style={styles.cardWithMeta}>
                      <div
                        className={def.finish === 'holo' || def.def.rarity === 'Infinite' || def.def.rarity === 'Eternal'
                          ? `holofoil-menu-card${def.def.rarity === 'Infinite' ? ' infinite-holo-bw-hover' : ''}${def.def.rarity === 'Eternal' ? ' eternal-holo-red-hover' : ''}`
                          : undefined}
                        style={{
                          ...styles.card,
                          ...getCardFaceBackgroundStyle(def.def, def.finish),
                          ...(count > 0 ? styles.cardAdded : {}),
                          ...(full ? styles.cardFull : {}),
                        }}
                        onClick={() => addCard(def.def.definitionId, def.finish)}
                        title={getCardPreviewLines(def.def, 4).join('\n')}
                      >
                        <div style={getCardNameRibbonStyle('grid')}>
                          <div style={{ ...styles.cardSubtype, color: cardFacePalette.textMuted, fontSize: faceMetrics.typeSize }}>
                            {getDisplayCardTypeLabel(def.def.type)} · {getFinishLabel(def.finish)}
                          </div>
                          <div style={{ ...styles.cardName, fontSize: faceMetrics.nameSize }}>{def.def.name}</div>
                        </div>
                        <div style={getCardRulesPanelStyle('grid')}>
                          <div style={{ ...styles.cardDesc, fontSize: faceMetrics.descSize, lineHeight: faceMetrics.descLineHeight }}>
                            <CardRulesDigest
                              card={def.def}
                              variant="preview"
                              maxSections={2}
                              maxLinesPerSection={1}
                              lineClamp={1}
                              labelColor={cardFacePalette.textMuted}
                              textColor={cardFacePalette.textSoft}
                              sectionBackground="transparent"
                              sectionBorder="transparent"
                            />
                          </div>
                        </div>
                        {count > 0 && <div style={styles.badge}>{count}</div>}
                      </div>
                      <div style={styles.ownedLabelBelow}>owns {owned}</div>
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
                <button className="menu-tactile-btn" style={styles.miniBtn} onClick={() => handleLoadSaved(sd.id)}>Load</button>
                {!sd.isStarter && (
                  <button className="menu-tactile-btn"
                    style={{ ...styles.miniBtn, ...styles.miniBtnDanger }}
                    onClick={() => {
                      if (window.confirm(`Delete deck "${sd.name}"? This cannot be undone.`)) {
                        deleteSavedDeck(sd.id);
                      }
                    }}
                  >Delete</button>
                )}
              </div>
            ))}
            {savedDecks.length === 1 && (
              <div style={{ fontSize: 10, color: 'rgba(232, 215, 191, 0.62)', marginTop: 6, fontStyle: 'italic' }}>
                Build a deck below and save it to create a custom deck.
              </div>
            )}
          </div>

          {/* Save controls */}
          <div style={styles.sidebarSection}>
            <div style={styles.sidebarSectionTitle}>Save</div>
            {!isEditingStarter && activeDeckId && (
              <button className="menu-tactile-btn"
                style={{ ...styles.miniBtn, marginBottom: 6, opacity: validation.valid ? 1 : 0.35, cursor: validation.valid ? 'pointer' : 'not-allowed' }}
                onClick={handleUpdateCurrent}
              >
                Update "{activeDeck?.name}"
              </button>
            )}
            <div style={{ ...styles.sidebarActionRow, marginBottom: 6 }}>
              <button className="menu-tactile-btn"
                style={{
                  ...styles.miniBtn,
                  ...styles.miniBtnDanger,
                  opacity: deckList.length > 0 || extraDeckList.length > 0 ? 1 : 0.35,
                  cursor: deckList.length > 0 || extraDeckList.length > 0 ? 'pointer' : 'not-allowed',
                }}
                onClick={handleClearDeck}
                disabled={deckList.length === 0 && extraDeckList.length === 0}
              >
                Remove All Cards
              </button>
            </div>
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
                  <button className="menu-tactile-btn"
                    style={{ ...styles.miniBtn, opacity: (validation.valid && newDeckName.trim()) ? 1 : 0.35 }}
                    onClick={handleSaveNew}
                  >Save</button>
                  <button className="menu-tactile-btn" style={{ ...styles.miniBtn, ...styles.miniBtnDanger }} onClick={() => { setSaveMode(false); setNewDeckName(''); }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="menu-tactile-btn"
                style={{ ...styles.miniBtn, opacity: validation.valid ? 1 : 0.35, cursor: validation.valid ? 'pointer' : 'not-allowed' }}
                onClick={() => validation.valid && setSaveMode(true)}
              >
                Save as New Deck
              </button>
            )}
          </div>

          {/* Extra deck list */}
          <div style={{ ...styles.sidebarSection, flexShrink: 0 }}>
            <div style={styles.sidebarSectionTitle}>Extra Deck ({extraDeckList.length} / 10)</div>
            {extraDeckList.length === 0 && (
              <div style={{ fontSize: 10, color: 'rgba(232, 215, 191, 0.56)', fontStyle: 'italic' }}>No angels selected</div>
            )}
            {extraDeckEntries.map(entry => {
              const def = CardRegistry.get(entry.definitionId);
              const cap = Math.min(4, collection[entry.definitionId] ?? 0);
              const owned = def ? getOwnedCopiesForFinish(def, entry.finish, collection, holoCollection) : 0;
              const totalForDefinition = extraDeckDefinitionCountMap.get(entry.definitionId) ?? 0;
              const canAdd = entry.copies < owned && totalForDefinition < cap && extraDeckList.length < 10;
              return (
                <div key={entry.key} style={styles.entryRow}>
                  <div style={styles.entryName}>{def?.name ?? entry.definitionId} ({getFinishLabel(entry.finish)})</div>
                  <button className="menu-tactile-btn" style={styles.entryBtn} onClick={() => removeCard(entry.definitionId, entry.finish)}>-</button>
                  <div style={styles.entryCount}>×{entry.copies}</div>
                  <button className="menu-tactile-btn"
                    style={{ ...styles.entryBtn, opacity: canAdd ? 1 : 0.3 }}
                    onClick={() => canAdd && addCard(entry.definitionId, entry.finish)}
                  >+</button>
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
              <div style={{ fontSize: 12, color: 'rgba(232, 215, 191, 0.6)', textAlign: 'center', marginTop: 16 }}>
                Click cards to add them
              </div>
            )}
            {deckList.map(entry => {
              const def = CardRegistry.get(entry.definitionId);
              const cap = Math.min(4, collection[entry.definitionId] ?? 0);
              const owned = def ? getOwnedCopiesForFinish(def, entry.finish, collection, holoCollection) : 0;
              const totalForDefinition = deckDefinitionCountMap.get(entry.definitionId) ?? 0;
              return (
                <div key={getVariantKey(entry.definitionId, entry.finish)} style={styles.entryRow}>
                  <div style={styles.entryName}>{def?.name ?? entry.definitionId} ({getFinishLabel(entry.finish)})</div>
                  <button className="menu-tactile-btn" style={styles.entryBtn} onClick={() => removeCard(entry.definitionId, entry.finish)}>-</button>
                  <div style={styles.entryCount}>×{entry.copies}</div>
                  <button className="menu-tactile-btn"
                    style={{ ...styles.entryBtn, opacity: entry.copies >= owned || totalForDefinition >= cap ? 0.3 : 1 }}
                    onClick={() => addCard(entry.definitionId, entry.finish)}
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
          {validation.valid && <div style={{ color: '#80e860', fontSize: 11 }}>Deck is valid - 50 cards</div>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="menu-tactile-btn" style={styles.closeBtn} onClick={onClose}>Close</button>
          <button className="menu-tactile-btn"
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
