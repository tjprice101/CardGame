import { useState, useMemo, useRef } from 'react';
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
import CardEngineCallout from '@/ui/components/CardEngineCallout';
import { getDisplayCardTypeLabel, isDisplayCherubimType, isDisplayOphanimType } from '@/ui/preferences';
import { getCardPreviewLines } from '@/ui/cardStatSummary';
import { warmTheme } from '@/ui/theme';
import { ARTIFACT_DEFINITIONS, ARTIFACT_SET_COLORS } from '@/data/artifacts/artifactDefinitions';
import { getMasteryLevel, getMasteryMultiplier } from '@/types/artifacts';
import { STARTER_COLLECTION } from '@/systems/progression/StarterDeck';
import type { DeckEntry, ExtraDeckEntry } from '@/types/game';
import type { AngelDefinition, CardDefinition, CardFinish } from '@/types/cards';

// Stable selector fallback: returning a fresh `{}` from a Zustand v5 selector
// triggers the "getSnapshot should be cached" infinite-render loop.
const EMPTY_CARD_LOCKS: Readonly<Record<string, number>> = Object.freeze({});

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
  lockRow: {
    marginTop: 3,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    fontSize: 9, color: '#ffd966', letterSpacing: 0.4,
    background: 'rgba(13, 20, 32, 0.42)',
    border: '1px solid rgba(255, 217, 102, 0.32)',
    borderRadius: 6,
    padding: '2px 4px',
    pointerEvents: 'auto',
  },
  lockBtn: {
    width: 14, height: 14, padding: 0,
    border: '1px solid rgba(255, 217, 102, 0.4)',
    background: 'rgba(255, 217, 102, 0.08)',
    color: '#ffd966',
    borderRadius: 3, cursor: 'pointer',
    fontSize: 11, lineHeight: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Georgia, serif',
  },
  lockBtnDisabled: {
    opacity: 0.35, cursor: 'not-allowed',
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

/**
 * Lock control rendered under each card variant. Shows the combined lock count
 * (starter-locked + user-locked) and provides +/- buttons to adjust user locks.
 * Starter-locked copies are always included and cannot be unlocked.
 */
function renderLockControl(
  definitionId: string,
  collection: Record<string, number>,
  cardLocks: Record<string, number>,
  setCardLock: (definitionId: string, count: number) => void,
): React.ReactNode {
  const owned = collection[definitionId] ?? 0;
  const starterLocked = STARTER_COLLECTION[definitionId] ?? 0;
  const userLocked = cardLocks[definitionId] ?? 0;
  const maxUserLock = Math.max(0, owned - starterLocked);
  if (owned <= 0) return null;
  const totalLocked = starterLocked + userLocked;
  const canDecrement = userLocked > 0;
  const canIncrement = userLocked < maxUserLock;
  return (
    <div
      style={styles.lockRow}
      onClick={ev => ev.stopPropagation()}
      title={
        starterLocked > 0
          ? `🔒 ${starterLocked} starter ${starterLocked === 1 ? 'copy is' : 'copies are'} permanently locked. You have locked ${userLocked} additional ${userLocked === 1 ? 'copy' : 'copies'}.`
          : `You have locked ${userLocked} ${userLocked === 1 ? 'copy' : 'copies'} from dissolving.`
      }
    >
      <button
        style={{ ...styles.lockBtn, ...(canDecrement ? {} : styles.lockBtnDisabled) }}
        disabled={!canDecrement}
        onClick={ev => { ev.stopPropagation(); if (canDecrement) setCardLock(definitionId, userLocked - 1); }}
      >−</button>
      <span>🔒 {totalLocked}/{owned}</span>
      <button
        style={{ ...styles.lockBtn, ...(canIncrement ? {} : styles.lockBtnDisabled) }}
        disabled={!canIncrement}
        onClick={ev => { ev.stopPropagation(); if (canIncrement) setCardLock(definitionId, userLocked + 1); }}
      >+</button>
    </div>
  );
}

const RARITY_COLORS_DB: Record<string, string> = {
  Common: '#888', Rare: '#5b9bd5', Epic: '#9b59b6', Legendary: '#f39c12', Eternal: '#ff6b6b', Infinite: '#e8e8f0',
};

export default function DeckBuilder({ onClose }: Props) {
  const faceMetrics = getCardFaceMetrics('grid');
  const { initDeck, saveCurrentDeck, updateSavedDeck, loadSavedDeck, deleteSavedDeck } = useStore.getState();
  const currentDeck = useStore(selectDeck);
  const collection = useStore(s => s.progress.collection);
  const holoCollection = useStore(s => s.progress.holoCollection);
  const cardLocks = useStore(s => s.progress.cardLocks ?? EMPTY_CARD_LOCKS);
  const setCardLock = useStore(s => s.setCardLock);
  const savedDecks = useStore(s => s.progress.savedDecks);
  const activeDeckId = useStore(s => s.progress.activeDeckId);
  const ownedArtifacts = useStore(s => s.progress.ownedArtifacts ?? {});
  const equipArtifact = useStore(s => s.equipArtifact);
  const unequipArtifact = useStore(s => s.unequipArtifact);
  const setDeckNotes = useStore(s => s.setDeckNotes);
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
  const [artifactPickerSlot, setArtifactPickerSlot] = useState<number | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');

  // Card hover tooltip (1.5s delay)
  const [cardTooltip, setCardTooltip] = useState<{ card: CardDefinition; x: number; y: number } | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

  function startTooltip(card: CardDefinition) {
    if (tooltipDismissRef.current !== null) { clearTimeout(tooltipDismissRef.current); tooltipDismissRef.current = null; }
    if (tooltipTimerRef.current !== null) clearTimeout(tooltipTimerRef.current);
    tooltipTimerRef.current = setTimeout(() => {
      setCardTooltip({ card, x: mousePosRef.current.x, y: mousePosRef.current.y });
    }, 1500);
  }

  function clearTooltip() {
    if (tooltipTimerRef.current !== null) { clearTimeout(tooltipTimerRef.current); tooltipTimerRef.current = null; }
    // Delay actual dismissal so the cursor can move onto the tooltip to scroll/read it.
    if (tooltipDismissRef.current !== null) clearTimeout(tooltipDismissRef.current);
    tooltipDismissRef.current = setTimeout(() => {
      setCardTooltip(null);
      tooltipDismissRef.current = null;
    }, 220);
  }

  function keepTooltip() {
    if (tooltipDismissRef.current !== null) { clearTimeout(tooltipDismissRef.current); tooltipDismissRef.current = null; }
  }

  function dismissTooltipNow() {
    if (tooltipTimerRef.current !== null) { clearTimeout(tooltipTimerRef.current); tooltipTimerRef.current = null; }
    if (tooltipDismissRef.current !== null) { clearTimeout(tooltipDismissRef.current); tooltipDismissRef.current = null; }
    setCardTooltip(null);
  }

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

  // Aggregate deck stats: element distribution + rarity breakdown.
  const deckStats = useMemo(() => {
    const elementCounts: Record<string, number> = {};
    const rarityCounts: Record<string, number> = { Common: 0, Rare: 0, Epic: 0, Legendary: 0 };
    let typeSeraphim = 0, typeCherubim = 0, typeOphanim = 0;
    for (const entry of deckList) {
      const def = CardRegistry.get(entry.definitionId);
      if (!def) continue;
      const el = getCardCategoryKey(def);
      elementCounts[el] = (elementCounts[el] ?? 0) + entry.copies;
      rarityCounts[def.rarity] = (rarityCounts[def.rarity] ?? 0) + entry.copies;
      if (def.type === 'Seraphim') typeSeraphim += entry.copies;
      else if (isDisplayCherubimType(def.type)) typeCherubim += entry.copies;
      else if (isDisplayOphanimType(def.type)) typeOphanim += entry.copies;
    }
    return { elementCounts, rarityCounts, typeSeraphim, typeCherubim, typeOphanim };
  }, [deckList]);

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

  // Auto-fill the main deck with the highest-rarity owned cards. Respects the
  // current element filter so players can quickly build a focused deck. Adds
  // up to 4× per definition (or owned copies, whichever is lower) and stops
  // at 50 cards.
  function handleFillWithBest() {
    const rarityRank: Record<string, number> = { Legendary: 4, Epic: 3, Rare: 2, Common: 1 };
    type Candidate = { def: CardDefinition; finish: CardFinish; owned: number; rank: number };

    const candidates: Candidate[] = [];
    for (const def of CardRegistry.getAll()) {
      // Skip Angels — they belong in extra deck.
      if (def.type === 'Angel') continue;
      // Respect element filter if active.
      if (elementFilter !== null && getCardCategoryKey(def) !== elementFilter) continue;
      const ownedNormal = getOwnedCopiesForFinish(def, 'normal', collection, holoCollection);
      const ownedHolo = getOwnedCopiesForFinish(def, 'holo', collection, holoCollection);
      // Prefer holo first when ranking ties.
      if (ownedHolo > 0) {
        candidates.push({ def, finish: 'holo', owned: ownedHolo, rank: (rarityRank[def.rarity] ?? 0) + 0.1 });
      }
      if (ownedNormal > 0) {
        candidates.push({ def, finish: 'normal', owned: ownedNormal, rank: (rarityRank[def.rarity] ?? 0) });
      }
    }
    candidates.sort((a, b) => b.rank - a.rank || a.def.name.localeCompare(b.def.name));

    let next = [...deckList];
    let total = next.reduce((sum, e) => sum + e.copies, 0);
    for (const c of candidates) {
      if (total >= 50) break;
      const ownedTotal = collection[c.def.definitionId] ?? 0;
      // Keep adding copies of this candidate until cap or deck full.
      while (total < 50) {
        const before = next;
        next = DeckSystem.addDeckEntry(next, c.def.definitionId, c.finish, ownedTotal, c.owned);
        const after = next.reduce((sum, e) => sum + e.copies, 0);
        if (after === total) {
          // No change — cap reached for this candidate.
          next = before;
          break;
        }
        total = after;
      }
    }
    setDeckList(next);
    useStore.getState().enqueueToast(
      total >= 50 ? `Deck filled to 50 with best owned cards.` : `Deck filled with ${total} cards (no more cards available).`,
      'success',
    );
  }

  return (
    <div className="ui-panel-intro" style={{ ...styles.overlay, ['--ui-accent' as any]: '240, 189, 120', ['--ui-accent-soft' as any]: '250, 224, 184' } as React.CSSProperties}>
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

      <div className="ui-shimmer-band" style={{ ...styles.header, position: 'relative' }}>
        <div>
          <div className="ui-title-glow" style={styles.title}>Deck Builder</div>
          {activeDeck && (
            <div style={{ fontSize: 11, color: 'rgba(255, 209, 150, 0.86)', marginTop: 2 }}>
              {activeDeck.isStarter ? '🔒 ' : ''}{activeDeck.name}
            </div>
          )}
          {/* Artifact equip slots — functional. Up to 3 artifacts per deck. */}
          <div style={{ display: 'flex', gap: 5, marginTop: 5, alignItems: 'center' }}>
            {[0, 1, 2].map(i => {
              const equipped = activeDeck?.equippedArtifacts?.[i];
              const def = equipped ? ARTIFACT_DEFINITIONS.find(a => a.id === equipped) : undefined;
              const color = def ? (ARTIFACT_SET_COLORS[def.setElementKey] ?? '#f0bd78') : '#f0bd78';
              const copies = def ? (ownedArtifacts[def.id] ?? 0) : 0;
              const level = def ? getMasteryLevel(copies) : -1;
              return (
                <button
                  key={i}
                  className="menu-tactile-btn"
                  title={def ? `${def.name} — ML ${level} (×${getMasteryMultiplier(copies).toFixed(2)}). Click to unequip.` : (activeDeck ? 'Click to equip an artifact' : 'Save deck to equip artifacts')}
                  onClick={() => {
                    if (!activeDeck) return;
                    if (def) { unequipArtifact(activeDeck.id, def.id); }
                    else { setArtifactPickerSlot(i); }
                  }}
                  disabled={!activeDeck}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    border: def ? `1px solid ${color}` : '1px dashed rgba(255,200,80,0.35)',
                    background: def
                      ? `linear-gradient(180deg, ${color}30, ${color}10)`
                      : 'rgba(255,200,80,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: def ? color : 'rgba(255,200,80,0.5)',
                    fontSize: 15,
                    cursor: activeDeck ? 'pointer' : 'not-allowed',
                    padding: 0,
                    boxShadow: def ? `0 0 8px ${color}40 inset` : 'none',
                    transition: 'all 160ms ease',
                  }}
                >
                  ✦
                </button>
              );
            })}
            {activeDeck && (
              <button
                className="menu-tactile-btn"
                title="Edit how-to-play notes for this deck"
                onClick={() => { setNotesDraft(activeDeck.notes ?? ''); setNotesOpen(true); }}
                style={{
                  marginLeft: 6,
                  padding: '4px 10px',
                  borderRadius: 7,
                  border: '1px solid rgba(240,189,120,0.4)',
                  background: 'rgba(240,189,120,0.08)',
                  color: '#f0bd78',
                  fontSize: 10,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontFamily: 'Georgia, serif',
                }}
              >
                {(activeDeck.notes && activeDeck.notes.trim().length > 0) ? '📝 Notes' : '📝 Add Notes'}
              </button>
            )}
          </div>
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
                        onMouseMove={(e) => { mousePosRef.current = { x: e.clientX, y: e.clientY }; }}
                        onMouseEnter={() => startTooltip(def.def)}
                        onMouseLeave={clearTooltip}
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
                      {renderLockControl(
                        def.def.definitionId,
                        collection,
                        cardLocks,
                        setCardLock,
                      )}
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
                        onMouseMove={(e) => { mousePosRef.current = { x: e.clientX, y: e.clientY }; }}
                        onMouseEnter={() => startTooltip(def.def)}
                        onMouseLeave={clearTooltip}
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
                      {renderLockControl(
                        def.def.definitionId,
                        collection,
                        cardLocks,
                        setCardLock,
                      )}
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
                  opacity: totalCards < 50 ? 1 : 0.35,
                  cursor: totalCards < 50 ? 'pointer' : 'not-allowed',
                }}
                onClick={handleFillWithBest}
                disabled={totalCards >= 50}
                title={elementFilter === null
                  ? 'Top up the deck with your highest-rarity owned cards.'
                  : `Top up the deck with the best owned ${ELEMENT_SET_NAMES[elementFilter] ?? elementFilter} cards.`}
              >
                Fill with Best
              </button>
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
            {/* Stats summary */}
            {deckList.length > 0 && (
              <div style={{
                marginBottom: 10,
                padding: '6px 8px',
                background: 'rgba(9, 14, 22, 0.6)',
                border: `1px solid ${warmTheme.border}`,
                borderRadius: 6,
              }}>
                <div style={{ fontSize: 9, letterSpacing: 1.5, color: '#f0bd78', marginBottom: 4 }}>Stats</div>
                <div style={{ fontSize: 10, color: '#e8d7bf', display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                  {(['Legendary','Epic','Rare','Common'] as const).map(r => {
                    const n = deckStats.rarityCounts[r] ?? 0;
                    if (n === 0) return null;
                    const color = r === 'Legendary' ? '#f39c12' : r === 'Epic' ? '#9b59b6' : r === 'Rare' ? '#5b9bd5' : '#999';
                    return <span key={r} style={{ color }}>{r[0]}: <strong>{n}</strong></span>;
                  })}
                </div>
                <div style={{ fontSize: 10, color: '#caa57a', display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ color: '#f0bd78' }}>Ser: <strong>{deckStats.typeSeraphim}</strong></span>
                  <span style={{ color: warmTheme.cherubim }}>Che: <strong>{deckStats.typeCherubim}</strong></span>
                  <span style={{ color: '#7f629f' }}>Oph: <strong>{deckStats.typeOphanim}</strong></span>
                </div>
                {Object.keys(deckStats.elementCounts).length > 1 && (
                  <div style={{ fontSize: 9, color: '#9aa1aa', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {Object.entries(deckStats.elementCounts)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 6)
                      .map(([el, n]) => (
                        <span key={el} style={{ color: ELEMENT_COLORS[el] ?? '#caa57a' }}>
                          {ELEMENT_SET_NAMES[el] ?? el}: {n}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            )}
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

      {/* ── Artifact Picker Modal ───────────────────────────────────────── */}
      {artifactPickerSlot !== null && activeDeck && (
        <ArtifactPickerModal
          ownedArtifacts={ownedArtifacts}
          equippedIds={activeDeck.equippedArtifacts ?? []}
          onPick={(artifactId) => {
            equipArtifact(activeDeck.id, artifactId);
            setArtifactPickerSlot(null);
          }}
          onClose={() => setArtifactPickerSlot(null)}
        />
      )}

      {/* ── Notes Modal ─────────────────────────────────────────────────── */}
      {notesOpen && activeDeck && (
        <NotesModal
          deckName={activeDeck.name}
          value={notesDraft}
          onChange={setNotesDraft}
          onSave={() => {
            setDeckNotes(activeDeck.id, notesDraft);
            setNotesOpen(false);
          }}
          onClose={() => setNotesOpen(false)}
        />
      )}

      {/* Card hover tooltip — appears after 1.5s hover */}
      {cardTooltip && (
        <div
          onMouseEnter={keepTooltip}
          onMouseLeave={dismissTooltipNow}
          style={{
            position: 'fixed',
            left: Math.min(cardTooltip.x + 18, window.innerWidth - 330),
            top: Math.max(8, Math.min(cardTooltip.y - 80, window.innerHeight - 440)),
            zIndex: 9999,
            width: 300,
            maxHeight: 420,
            overflowY: 'auto',
            background: 'linear-gradient(180deg, rgba(12,18,28,0.98), rgba(8,12,20,0.98))',
            border: `1px solid ${warmTheme.borderStrong}`,
            borderRadius: 12,
            padding: '14px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            fontFamily: 'Georgia, serif',
            color: '#ead9c0',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#f0bd78', marginBottom: 4 }}>
            {cardTooltip.card.name}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(234,217,192,0.6)', letterSpacing: 1, marginBottom: 10 }}>
            {getDisplayCardTypeLabel(cardTooltip.card.type)} · <span style={{ color: RARITY_COLORS_DB[cardTooltip.card.rarity] ?? '#aaa' }}>{cardTooltip.card.rarity}</span> · {ELEMENT_SET_NAMES[cardTooltip.card.element] ?? cardTooltip.card.element}
          </div>
          <div style={{ marginBottom: 10 }}>
            <CardEngineCallout card={cardTooltip.card} variant="detail" />
          </div>
          <CardRulesDigest
            card={cardTooltip.card}
            variant="detail"
            labelColor="rgba(234,217,192,0.52)"
            textColor="rgba(234,217,192,0.92)"
            sectionBackground="rgba(255,255,255,0.04)"
            sectionBorder="rgba(255,255,255,0.12)"
          />
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Artifact Picker Modal
// ────────────────────────────────────────────────────────────────────────────

interface ArtifactPickerProps {
  ownedArtifacts: Record<string, number>;
  equippedIds: string[];
  onPick: (artifactId: string) => void;
  onClose: () => void;
}

function ArtifactPickerModal({ ownedArtifacts, equippedIds, onPick, onClose }: ArtifactPickerProps) {
  const ownedDefs = ARTIFACT_DEFINITIONS
    .filter(def => (ownedArtifacts[def.id] ?? 0) > 0)
    .sort((a, b) => a.setName.localeCompare(b.setName) || a.tier.localeCompare(b.tier));

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 80,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(720px, 100%)', maxHeight: '80vh',
          background: 'linear-gradient(180deg, rgba(24,32,47,0.98), rgba(14,20,32,0.98))',
          border: `1px solid ${warmTheme.border}`,
          borderRadius: 12,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          fontFamily: 'Georgia, serif',
          color: '#ead9c0',
        }}
      >
        <div style={{
          padding: '14px 20px',
          borderBottom: `1px solid ${warmTheme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: '#f0bd78', letterSpacing: 1.5 }}>Equip Artifact</div>
            <div style={{ fontSize: 11, opacity: 0.65, marginTop: 2 }}>Select one of your owned artifacts to equip in this slot.</div>
          </div>
          <button className="menu-tactile-btn" style={{ ...styles.closeBtn }} onClick={onClose}>Cancel</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {ownedDefs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'rgba(232,215,191,0.5)', fontStyle: 'italic' }}>
              No artifacts owned yet. Visit the Artifacts menu to purchase your first one.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {ownedDefs.map(def => {
                const copies = ownedArtifacts[def.id] ?? 0;
                const level = getMasteryLevel(copies);
                const mult = getMasteryMultiplier(copies);
                const color = ARTIFACT_SET_COLORS[def.setElementKey] ?? '#f0bd78';
                const alreadyEquipped = equippedIds.includes(def.id);
                return (
                  <button
                    key={def.id}
                    onClick={() => !alreadyEquipped && onPick(def.id)}
                    disabled={alreadyEquipped}
                    style={{
                      textAlign: 'left',
                      padding: 12,
                      borderRadius: 10,
                      border: `1px solid ${alreadyEquipped ? 'rgba(255,255,255,0.1)' : color + '60'}`,
                      background: alreadyEquipped
                        ? 'rgba(255,255,255,0.02)'
                        : `linear-gradient(180deg, ${color}18, transparent)`,
                      color: alreadyEquipped ? 'rgba(232,215,191,0.4)' : '#ead9c0',
                      cursor: alreadyEquipped ? 'not-allowed' : 'pointer',
                      fontFamily: 'Georgia, serif',
                      transition: 'all 160ms ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: alreadyEquipped ? undefined : color }}>{def.name}</div>
                      <div style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: `${color}30`, color, letterSpacing: 1 }}>
                        {level === 3 ? 'APEX' : `ML ${level}`}
                      </div>
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 6 }}>
                      {def.setName} · ×{mult.toFixed(2)} effect
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(232,215,191,0.7)', lineHeight: 1.4 }}>
                      {def.description}
                    </div>
                    {alreadyEquipped && (
                      <div style={{ marginTop: 6, fontSize: 10, color: '#80e860', letterSpacing: 1 }}>
                        ALREADY EQUIPPED
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Notes Modal
// ────────────────────────────────────────────────────────────────────────────

interface NotesModalProps {
  deckName: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}

function NotesModal({ deckName, value, onChange, onSave, onClose }: NotesModalProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 80,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(640px, 100%)',
          background: 'linear-gradient(180deg, rgba(24,32,47,0.98), rgba(14,20,32,0.98))',
          border: `1px solid ${warmTheme.border}`,
          borderRadius: 12,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          fontFamily: 'Georgia, serif',
          color: '#ead9c0',
        }}
      >
        <div style={{
          padding: '14px 20px',
          borderBottom: `1px solid ${warmTheme.border}`,
        }}>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#f0bd78', letterSpacing: 1.5 }}>How-to-Play Notes</div>
          <div style={{ fontSize: 11, opacity: 0.65, marginTop: 2 }}>{deckName}</div>
        </div>
        <div style={{ padding: 16 }}>
          <textarea
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Describe how this deck plays — opener, key combos, win condition, side tech…"
            maxLength={2000}
            rows={12}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: 12,
              borderRadius: 8,
              background: 'rgba(0,0,0,0.35)',
              border: `1px solid ${warmTheme.border}`,
              color: '#ead9c0',
              fontFamily: 'Georgia, serif',
              fontSize: 13,
              lineHeight: 1.55,
              resize: 'vertical',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <div style={{ fontSize: 10, opacity: 0.5 }}>
              {value.length} / 2000 characters
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="menu-tactile-btn" style={styles.closeBtn} onClick={onClose}>Cancel</button>
              <button className="menu-tactile-btn" style={styles.startBtn} onClick={onSave}>Save Notes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
