import { useEffect, useState, useMemo, useRef } from 'react';
import { useStore, selectDeck } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { DeckSystem } from '@/systems/cards/DeckSystem';
import { SET_ACCENT, SET_LABEL } from '@/data/elements';
import {
  cardFacePalette,
  getDenseCardFaceBackgroundStyle,
  getCardBackgroundUrl,
  getCardFaceMetrics,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';
import CardRulesDigest from '@/ui/components/CardRulesDigest';
import CardEngineCallout from '@/ui/components/CardEngineCallout';
import VirtualizedList from '@/ui/components/VirtualizedList';
import { getCardPreviewLines } from '@/ui/cardStatSummary';
import { getDisplayCardTypeLabel, isDisplayCherubimType, isDisplayOphanimType } from '@/ui/preferences';
import { warmTheme } from '@/ui/theme';
import { useThemeVersion } from '@/ui/useThemeVersion';
import { STARTER_COLLECTION } from '@/systems/progression/StarterDeck';
import { isHoloOnlyCard } from '@/systems/progression/HolofoilSystem';
import type { DeckEntry, ExtraDeckEntry } from '@/types/game';
import type { AngelDefinition, CardDefinition, CardFinish } from '@/types/cards';

// Stable selector fallback: returning a fresh `{}` from a Zustand v5 selector
// triggers the "getSnapshot should be cached" infinite-render loop.
const EMPTY_CARD_LOCKS: Readonly<Record<string, number>> = Object.freeze({});

const RARITY_ORDER = { Common: 0, Rare: 1, Epic: 2, Legendary: 3 };
// Built lazily per render so theme switches reflect immediately.
function getSectionColors(): Record<string, string> {
  return {
    Angel: warmTheme.accentDeep,
    Seraphim: '#f0bd78',
    Cherubim: warmTheme.cherubim,
    Ophanim: '#7f629f',
  };
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at 82% 8%, rgba(100, 60, 180, 0.10) 0%, transparent 38%), radial-gradient(ellipse at 12% 88%, rgba(58, 142, 200, 0.17) 0%, transparent 44%), radial-gradient(ellipse at 50% 50%, rgba(4, 8, 18, 0.60) 0%, transparent 100%), repeating-linear-gradient(45deg, rgba(90, 165, 220, 0.025) 0px, rgba(90, 165, 220, 0.025) 1px, transparent 1px, transparent 28px), linear-gradient(180deg, #040a15 0%, #060e1c 45%, #030a12 100%)',
    zIndex: 50,
    display: 'flex', flexDirection: 'column', pointerEvents: 'auto',
    fontFamily: 'Georgia, serif',
    color: '#e8f4ff',
  },
  header: {
    padding: '20px 28px 16px',
    borderBottom: '1px solid rgba(72,128,190,0.32)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0,
    background: 'linear-gradient(180deg, rgba(4, 8, 18, 0.92) 0%, rgba(6, 11, 22, 0.70) 100%)',
    boxShadow: '0 1px 0 rgba(78,148,210,0.18), 0 4px 22px rgba(0,0,0,0.55)',
  },
  title: {
    fontSize: 24, fontWeight: 'bold', color: '#7dd4f8',
    letterSpacing: 4, textTransform: 'uppercase',
    textShadow: '0 0 36px rgba(88,180,235,0.55), 0 2px 8px rgba(0,0,0,0.9)',
    lineHeight: 1,
  },
  deckCount: { fontSize: 12, color: 'rgba(205,228,255,0.68)', letterSpacing: 0.5 },
  filterBar: {
    display: 'flex', alignItems: 'stretch', flexShrink: 0, flexWrap: 'wrap',
    background: 'rgba(3, 6, 14, 0.6)',
    borderBottom: '1px solid rgba(72,128,190,0.20)',
  },
  filterBtn: {
    padding: '0 16px', height: 36, border: 'none',
    borderBottom: '3px solid transparent',
    borderRight: '1px solid rgba(72,128,190,0.16)',
    background: 'transparent', color: 'rgba(205,228,255,0.55)', fontSize: 10.5,
    cursor: 'pointer', fontFamily: 'Georgia, serif', letterSpacing: 1.2,
    textTransform: 'uppercase', transition: 'all 0.18s ease',
    display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
  },
  filterBtnActive: {
    color: '#7dd4f8',
    borderBottomColor: '#4298d8',
    background: 'rgba(78,160,220,0.12)',
  },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  cardPool: { flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 0 },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 0 8px', marginBottom: 10,
  },
  sectionLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2.5, textTransform: 'uppercase' },
  sectionCount: { fontSize: 9, color: 'rgba(205,228,255,0.52)', letterSpacing: 1.2 },
  sectionGrid: { display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  cardWithMeta: {
    width: 116,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  card: {
    width: 116, height: 164,
    background: 'rgba(4, 8, 18, 0.90)',
    border: '1px solid rgba(72,128,190,0.32)', borderRadius: 12, cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'stretch',
    transition: 'border-color 0.18s ease, box-shadow 0.18s ease, transform 0.14s ease',
    position: 'relative', overflow: 'hidden',
  },
  cardAdded: {
    borderColor: 'rgba(110,200,245,0.90)',
    boxShadow: '0 0 0 1px rgba(78,160,220,0.45), 0 0 22px rgba(78,160,220,0.28)',
    transform: 'translateY(-2px)',
  },
  cardFull: { opacity: 0.34, cursor: 'not-allowed' },
  cardName: { fontWeight: 'bold', color: cardFacePalette.text, textAlign: 'center', lineHeight: 1.25 },
  cardDesc: { color: cardFacePalette.textSoft, textAlign: 'center', display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardSubtype: { letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4, textAlign: 'center' },
  badge: {
    position: 'absolute', bottom: 7, right: 6, width: 21, height: 21,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 38% 32%, #f8d878 0%, #c8850a 60%, #8a5200 100%)',
    color: '#3a1800',
    fontSize: 11, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 1px 5px rgba(0,0,0,0.65), 0 0 8px rgba(240,189,120,0.35)',
  },
  ownedLabelBelow: {
    fontSize: 9, color: 'rgba(205,228,255,0.75)', letterSpacing: 0.4,
    textAlign: 'center',
    pointerEvents: 'none',
    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
    background: 'rgba(3, 6, 14, 0.80)',
    border: '1px solid rgba(72,128,190,0.26)',
    borderRadius: 5,
    padding: '2px 5px',
  },
  lockRow: {
    marginTop: 2,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    fontSize: 9, color: '#ffd966', letterSpacing: 0.4,
    background: 'rgba(10, 14, 26, 0.78)',
    border: '1px solid rgba(255, 217, 102, 0.25)',
    borderRadius: 5,
    padding: '2px 4px',
    pointerEvents: 'auto',
  },
  lockBtn: {
    width: 14, height: 14, padding: 0,
    border: '1px solid rgba(255, 217, 102, 0.36)',
    background: 'rgba(255, 217, 102, 0.1)',
    color: '#ffd966',
    borderRadius: 3, cursor: 'pointer',
    fontSize: 11, lineHeight: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Georgia, serif',
  },
  lockBtnDisabled: {
    opacity: 0.3, cursor: 'not-allowed',
  },
  sidebar: {
    width: 290, borderLeft: '1px solid rgba(72,128,190,0.24)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    background: 'linear-gradient(180deg, rgba(3, 6, 14, 0.82) 0%, rgba(4, 8, 18, 0.78) 100%)',
    boxShadow: 'inset 2px 0 18px rgba(0,0,0,0.40)',
  },
  sidebarSection: {
    padding: '12px 14px', borderBottom: '1px solid rgba(72,128,190,0.18)', flexShrink: 0,
  },
  sidebarSectionTitle: {
    fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase',
    color: 'rgba(205,228,255,0.62)', marginBottom: 10,
    display: 'flex', alignItems: 'center', gap: 6,
  },
  savedDeckRow: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 8px 6px 10px', marginBottom: 2, borderRadius: 6,
    transition: 'background 0.15s',
    borderLeft: '2px solid transparent',
  },
  savedDeckName: { fontSize: 11, color: 'rgba(205,228,255,0.78)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  deckList: { flex: 1, overflowY: 'auto', padding: '10px 12px' },
  entryRow: {
    display: 'flex', alignItems: 'center',
    padding: '4px 6px', marginBottom: 1, borderRadius: 4,
    borderBottom: '1px solid rgba(72,128,190,0.14)',
    gap: 5, transition: 'background 0.12s',
  },
  entryName: { fontSize: 10.5, color: 'rgba(205,228,255,0.78)', flex: 1, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  entryCount: {
    fontSize: 11, color: '#7dd4f8', margin: '0 3px', minWidth: 18, textAlign: 'center',
    fontWeight: 'bold', flexShrink: 0,
  },
  entryBtn: {
    width: 22, height: 22, border: '1px solid rgba(72,128,190,0.42)', borderRadius: 5,
    background: 'rgba(78,155,220,0.13)', color: '#7dd4f8', fontSize: 14, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
    transition: 'background 0.12s, border-color 0.12s',
    lineHeight: 1, flexShrink: 0,
  },
  footer: {
    padding: '14px 28px', borderTop: '1px solid rgba(72,128,190,0.28)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
    background: 'linear-gradient(180deg, rgba(4, 7, 15, 0.70) 0%, rgba(3, 5, 12, 0.92) 100%)',
    boxShadow: '0 -1px 0 rgba(72,128,190,0.14)',
  },
  startBtn: {
    padding: '11px 34px', borderRadius: 10,
    border: '1px solid rgba(240, 189, 120, 0.65)',
    background: 'linear-gradient(180deg, #c09040 0%, #8a5e10 50%, #6a4408 100%)',
    color: '#fff8ea', fontSize: 13,
    cursor: 'pointer', letterSpacing: 2, fontFamily: 'Georgia, serif',
    textShadow: '0 1px 4px rgba(0,0,0,0.7)',
    boxShadow: '0 2px 14px rgba(180, 120, 10, 0.38), inset 0 1px 0 rgba(255,255,255,0.14)',
    textTransform: 'uppercase',
    transition: 'box-shadow 0.25s, transform 0.15s',
  },
  closeBtn: {
    padding: '10px 20px', borderRadius: 10,
    border: '1px solid rgba(72,128,190,0.32)',
    background: 'rgba(78,155,220,0.06)',
    color: 'rgba(205,228,255,0.78)', fontSize: 12,
    cursor: 'pointer', fontFamily: 'Georgia, serif',
    letterSpacing: 0.5, transition: 'background 0.15s, border-color 0.15s',
  },
  miniBtn: {
    padding: '5px 10px', borderRadius: 6,
    border: '1px solid rgba(72,128,190,0.42)',
    background: 'rgba(78,155,220,0.13)', color: '#7dd4f8', fontSize: 10,
    cursor: 'pointer', fontFamily: 'Georgia, serif', flexShrink: 0,
    letterSpacing: 0.5, transition: 'background 0.15s, box-shadow 0.15s',
  },
  miniBtnDanger: {
    borderColor: 'rgba(184, 90, 79, 0.4)', color: '#e07060',
    background: 'rgba(184, 90, 79, 0.08)',
  },
  sectionToggleBtn: {
    width: 20,
    height: 20,
    borderRadius: 5,
    border: '1px solid rgba(72,128,190,0.32)',
    background: 'rgba(78,155,220,0.10)',
    color: 'rgba(205,228,255,0.72)',
    fontSize: 10,
    lineHeight: 1,
    padding: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sidebarActionRow: {
    display: 'flex', gap: 6, flexWrap: 'wrap',
  },
  empty: {
    width: '100%', textAlign: 'center', marginTop: 48,
    fontSize: 13, color: 'rgba(165,205,245,0.52)', fontStyle: 'italic',
  },
  nameInput: {
    background: 'rgba(2, 5, 14, 0.82)',
    border: '1px solid rgba(72,128,190,0.45)',
    color: '#d8f0ff', fontSize: 12, padding: '6px 10px', borderRadius: 6,
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

interface DeckPoolVirtualRow {
  key: string;
  kind: 'heading' | 'cards';
  sectionLabel: string;
  countText?: string;
  entries?: CardVariantDisplay[];
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
  if (isHoloOnlyCard(def)) return finish === 'holo' ? totalOwned : 0;
  if (finish === 'holo') return holoOwned;
  return Math.max(0, totalOwned - holoOwned);
}

function getFinishLabel(def: CardDefinition, finish: CardFinish): string | null {
  if (isHoloOnlyCard(def)) return null;
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
  useThemeVersion();
  const faceMetrics = getCardFaceMetrics('grid');
  const { initDeck, saveCurrentDeck, updateSavedDeck, loadSavedDeck, deleteSavedDeck } = useStore.getState();
  const currentDeck = useStore(selectDeck);
  const collection = useStore(s => s.progress.collection);
  const holoCollection = useStore(s => s.progress.holoCollection);
  const cardLocks = useStore(s => s.progress.cardLocks ?? EMPTY_CARD_LOCKS);
  const setCardLock = useStore(s => s.setCardLock);
  const savedDecks = useStore(s => s.progress.savedDecks);
  const activeDeckId = useStore(s => s.progress.activeDeckId);
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
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [collapsedSidebarSections, setCollapsedSidebarSections] = useState({
    savedDecks: false,
    save: false,
    extraDeck: false,
    mainDeck: false,
  });

  // Card hover tooltip (1.5s delay)
  const [cardTooltip, setCardTooltip] = useState<{ card: CardDefinition; x: number; y: number } | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const cardPoolViewportRef = useRef<HTMLDivElement | null>(null);
  const [cardPoolViewportWidth, setCardPoolViewportWidth] = useState(0);

  useEffect(() => {
    const node = cardPoolViewportRef.current;
    if (!node) return;

    const updateWidth = () => setCardPoolViewportWidth(Math.max(0, node.clientWidth - 40));
    updateWidth();

    const resizeObserver = new ResizeObserver(() => updateWidth());
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

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
    const availableElements = ['Neutrality'];
    const filtered = ownedCards.filter(_d => elementFilter === null || elementFilter === 'Neutrality');

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
  const poolColumns = Math.max(1, Math.floor((cardPoolViewportWidth + 10) / 126));
  const deckPoolRows = useMemo(() => {
    const rows: DeckPoolVirtualRow[] = [];
    const pushCardRows = (entries: CardVariantDisplay[], prefix: string, sectionLabel: string) => {
      for (let index = 0; index < entries.length; index += poolColumns) {
        rows.push({
          key: `${prefix}-${index}`,
          kind: 'cards',
          sectionLabel,
          entries: entries.slice(index, index + poolColumns),
        });
      }
    };

    if (angelSection.length > 0) {
      rows.push({
        key: 'heading-Angel',
        kind: 'heading',
        sectionLabel: 'Angel',
        countText: `${extraDeckList.length} / 10 selected`,
      });
      pushCardRows(angelSection, 'Angel', 'Angel');
    }

    mainSections.forEach((section) => {
      rows.push({
        key: `heading-${section.label}`,
        kind: 'heading',
        sectionLabel: section.label,
        countText: `${section.cards.length} card${section.cards.length !== 1 ? 's' : ''}`,
      });
      pushCardRows(section.cards, section.label, section.label);
    });

    return rows;
  }, [angelSection, extraDeckList.length, mainSections, poolColumns]);

  // Aggregate deck stats: element distribution + rarity breakdown.
  const deckStats = useMemo(() => {
    const elementCounts: Record<string, number> = {};
    const rarityCounts: Record<string, number> = { Common: 0, Rare: 0, Epic: 0, Legendary: 0 };
    let typeSeraphim = 0, typeCherubim = 0, typeOphanim = 0;
    for (const entry of deckList) {
      const def = CardRegistry.get(entry.definitionId);
      if (!def) continue;
      const el = 'Neutrality';
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

  function toggleSidebarSection(section: 'savedDecks' | 'save' | 'extraDeck' | 'mainDeck') {
    setCollapsedSidebarSections(prev => ({ ...prev, [section]: !prev[section] }));
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
      if (elementFilter !== null && 'Neutrality' !== elementFilter) continue;
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

  function renderPoolCard(def: CardVariantDisplay, sectionLabel: string): React.ReactNode {
    const isAngel = sectionLabel === 'Angel';
    const variantKey = getVariantKey(def.def.definitionId, def.finish);
    const count = isAngel ? (extraDeckCountMap.get(variantKey) ?? 0) : (deckMap.get(variantKey) ?? 0);
    const owned = def.ownedCopies;
    const cap = Math.min(4, collection[def.def.definitionId] ?? 0);
    const totalForDefinition = isAngel
      ? (extraDeckDefinitionCountMap.get(def.def.definitionId) ?? 0)
      : (deckDefinitionCountMap.get(def.def.definitionId) ?? 0);
    const canAdd = isAngel
      ? count < owned && totalForDefinition < cap && extraDeckList.length < 10
      : !(count >= owned || totalForDefinition >= cap);
    const previewText = getCardPreviewLines(def.def, isAngel ? 3 : 2).join(' ');
    const artUrl = getCardBackgroundUrl(def.def);

    return (
      <div key={def.key} style={styles.cardWithMeta}>
        <div
          className={def.finish === 'holo' || def.def.rarity === 'Infinite' || def.def.rarity === 'Eternal' || def.def.rarity === 'Enigmatic'
            ? `holofoil-menu-card${def.def.rarity === 'Infinite' ? ' infinite-holo-bw-hover' : ''}${def.def.rarity === 'Eternal' ? ' eternal-holo-red-hover' : ''}${def.def.rarity === 'Enigmatic' ? ' enigmatic-holo-violet-hover' : ''}`
            : undefined}
          style={{
            ...styles.card,
            ...getDenseCardFaceBackgroundStyle(def.def, def.finish, 'front', true),
            ...(count > 0 ? styles.cardAdded : {}),
            ...((isAngel ? (count === 0 && !canAdd) : !canAdd) ? styles.cardFull : {}),
          }}
          onClick={() => addCard(def.def.definitionId, def.finish)}
          onMouseMove={(e) => { mousePosRef.current = { x: e.clientX, y: e.clientY }; }}
          onMouseEnter={() => startTooltip(def.def)}
          onMouseLeave={clearTooltip}
        >
          {artUrl && (
            <img
              src={artUrl}
              alt=""
              loading="lazy"
              decoding="async"
              aria-hidden
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }}
            />
          )}
          <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={getCardNameRibbonStyle('grid')}>
                            <div style={{ ...styles.cardSubtype, color: cardFacePalette.textMuted, fontSize: faceMetrics.typeSize }}>
                              {(() => {
                                const baseLabel = isAngel ? 'Angel' : getDisplayCardTypeLabel(def.def.type);
                                const finishLabel = getFinishLabel(def.def, def.finish);
                                return finishLabel ? `${baseLabel} · ${finishLabel}` : baseLabel;
                              })()}
                            </div>
              <div style={{ ...styles.cardName, fontSize: faceMetrics.nameSize }}>{def.def.name}</div>
            </div>
            <div style={getCardRulesPanelStyle('grid')}>
              <div style={{ ...styles.cardDesc, fontSize: faceMetrics.descSize, lineHeight: faceMetrics.descLineHeight, WebkitLineClamp: isAngel ? 3 : 2 }}>
                {previewText}
              </div>
              {isAngel && def.def.type === 'Angel' && (
                <div style={{ fontSize: 7, color: cardFacePalette.textMuted, marginTop: 5, textAlign: 'center' }}>
                  Cost: {(def.def as AngelDefinition).summonCost.length} materials
                </div>
              )}
            </div>
          </div>
          {count > 0 && <div style={{ ...styles.badge, zIndex: 2 }}>{count}</div>}
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
            <div style={{ fontSize: 11, color: 'rgba(190,215,245,0.80)', marginTop: 2 }}>
              {activeDeck.isStarter ? '🔒 ' : ''}{activeDeck.name}
            </div>
          )}
          {activeDeck && (
            <button
              className="menu-tactile-btn"
              title="Edit how-to-play notes for this deck"
              onClick={() => { setNotesDraft(activeDeck.notes ?? ''); setNotesOpen(true); }}
              style={{
                marginTop: 6,
                padding: '4px 10px',
                borderRadius: 7,
                border: '1px solid rgba(90,170,220,0.28)',
                background: 'rgba(90,170,220,0.06)',
                color: 'rgba(190,215,245,0.70)',
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div>
            <div style={{ textAlign: 'right', marginBottom: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 'bold', color: totalCards === 50 ? '#80e860' : totalCards > 50 ? '#e06060' : '#7dd4f8', lineHeight: 1 }}>
                {totalCards}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(165,205,245,0.52)', marginLeft: 4 }}> / 50</span>
            </div>
            <div style={{ width: 120, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2,
                width: `${Math.min(100, (totalCards / 50) * 100)}%`,
                background: totalCards === 50 ? '#80e860' : totalCards > 50 ? '#e06060' : 'linear-gradient(90deg, #3888c4, #58aada)',
                transition: 'width 0.3s ease, background 0.3s ease',
              }} />
            </div>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(190,215,245,0.45)', textAlign: 'right' }}>
            <span style={{ color: '#58aada' }}>{extraDeckList.length}</span>
            <span> / 10 extra deck</span>
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
              ...(elementFilter === el ? {
                ...styles.filterBtnActive,
                color: SET_ACCENT,
                borderBottomColor: SET_ACCENT,
                background: `${(SET_ACCENT)}14`,
              } : {}),
            }}
            onClick={() => setElementFilter(el === elementFilter ? null : el)}
          >
            {elementFilter === el && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: SET_ACCENT, display: 'inline-block', flexShrink: 0 }} />
            )}
            {SET_LABEL}
          </button>
        ))}
      </div>

      <div style={styles.body}>
        {/* Card Pool */}
        {mainSections.length === 0 && angelSection.length === 0 ? (
          <div style={styles.cardPool}>
            <div style={styles.empty}>
              No {elementFilter ? (SET_LABEL) : ''} cards in your collection yet.
            </div>
          </div>
        ) : (
          <VirtualizedList
            items={deckPoolRows}
            getItemKey={(row) => row.key}
            getItemHeight={(row) => row.kind === 'heading' ? 44 : 214}
            topPadding={16}
            bottomPadding={24}
            overscanPx={300}
            viewportRef={cardPoolViewportRef}
            style={styles.cardPool}
            renderItem={(row) => {
              if (row.kind === 'heading') {
                const accent = getSectionColors()[row.sectionLabel] ?? '#58aada';
                const title = row.sectionLabel === 'Angel' ? 'Extra Deck (Angels)' : row.sectionLabel;
                return (
                  <div style={{ padding: '0 20px' }}>
                    <div style={{ ...styles.sectionHeader, marginBottom: 10 }}>
                      <div style={{ width: 4, height: 20, borderRadius: 2, background: accent, boxShadow: `0 0 8px ${accent}50`, flexShrink: 0 }} />
                      <span style={{ ...styles.sectionLabel, color: accent }}>
                        {title}
                      </span>
                      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${accent}45, transparent)`, marginLeft: 4 }} />
                      <span style={styles.sectionCount}>{row.countText}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', gap: 10, padding: '0 20px 24px', alignItems: 'flex-start' }}>
                  {row.entries?.map((entry) => renderPoolCard(entry, row.sectionLabel))}
                </div>
              );
            }}
          />
        )}

        {/* Sidebar */}
        <div style={styles.sidebar}>
          {/* Saved decks */}
          <div style={styles.sidebarSection}>
            <div style={{ ...styles.sidebarSectionTitle, justifyContent: 'space-between', marginBottom: collapsedSidebarSections.savedDecks ? 0 : 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-block', width: 12, height: 1, background: '#58aada', opacity: 0.7 }} />
                Saved Decks
              </div>
              <button
                className="menu-tactile-btn"
                style={styles.sectionToggleBtn}
                onClick={() => toggleSidebarSection('savedDecks')}
                title={collapsedSidebarSections.savedDecks ? 'Expand Saved Decks' : 'Collapse Saved Decks'}
              >
                {collapsedSidebarSections.savedDecks ? '▸' : '▾'}
              </button>
            </div>
            {!collapsedSidebarSections.savedDecks && savedDecks.map(sd => (
              <div key={sd.id} style={{
                ...styles.savedDeckRow,
                ...(sd.id === activeDeckId ? { borderLeftColor: '#58aada', background: 'rgba(58,142,200,0.09)' } : {}),
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
            {!collapsedSidebarSections.savedDecks && savedDecks.length === 1 && (
              <div style={{ fontSize: 10, color: 'rgba(190,215,245,0.55)', marginTop: 6, fontStyle: 'italic' }}>
                Build a deck below and save it to create a custom deck.
              </div>
            )}
          </div>

          {/* Save controls */}
          <div style={styles.sidebarSection}>
            <div style={{ ...styles.sidebarSectionTitle, justifyContent: 'space-between', marginBottom: collapsedSidebarSections.save ? 0 : 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-block', width: 12, height: 1, background: '#d4a84e', opacity: 0.7 }} />
                Save
              </div>
              <button
                className="menu-tactile-btn"
                style={styles.sectionToggleBtn}
                onClick={() => toggleSidebarSection('save')}
                title={collapsedSidebarSections.save ? 'Expand Save Controls' : 'Collapse Save Controls'}
              >
                {collapsedSidebarSections.save ? '▸' : '▾'}
              </button>
            </div>
            {!collapsedSidebarSections.save && !isEditingStarter && activeDeckId && (
              <button className="menu-tactile-btn"
                style={{ ...styles.miniBtn, marginBottom: 6, opacity: validation.valid ? 1 : 0.35, cursor: validation.valid ? 'pointer' : 'not-allowed' }}
                onClick={handleUpdateCurrent}
              >
                Update "{activeDeck?.name}"
              </button>
            )}
            {!collapsedSidebarSections.save && (
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
                  : `Top up the deck with the best owned ${SET_LABEL} cards.`}
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
            )}
            {!collapsedSidebarSections.save && (saveMode ? (
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
            ))}
          </div>

          {/* Extra deck list */}
          <div style={{ ...styles.sidebarSection, flexShrink: 0 }}>
            <div style={{ ...styles.sidebarSectionTitle, justifyContent: 'space-between', marginBottom: collapsedSidebarSections.extraDeck ? 0 : 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-block', width: 12, height: 1, background: '#58aada', opacity: 0.7 }} />
                Extra Deck ({extraDeckList.length} / 10)
              </div>
              <button
                className="menu-tactile-btn"
                style={styles.sectionToggleBtn}
                onClick={() => toggleSidebarSection('extraDeck')}
                title={collapsedSidebarSections.extraDeck ? 'Expand Extra Deck' : 'Collapse Extra Deck'}
              >
                {collapsedSidebarSections.extraDeck ? '▸' : '▾'}
              </button>
            </div>
            {!collapsedSidebarSections.extraDeck && extraDeckList.length === 0 && (
              <div style={{ fontSize: 10, color: 'rgba(190,215,245,0.50)', fontStyle: 'italic' }}>No angels selected</div>
            )}
            {!collapsedSidebarSections.extraDeck && extraDeckEntries.map(entry => {
              const def = CardRegistry.get(entry.definitionId);
              const cap = Math.min(4, collection[entry.definitionId] ?? 0);
              const owned = def ? getOwnedCopiesForFinish(def, entry.finish, collection, holoCollection) : 0;
              const totalForDefinition = extraDeckDefinitionCountMap.get(entry.definitionId) ?? 0;
              const canAdd = entry.copies < owned && totalForDefinition < cap && extraDeckList.length < 10;
              const rarityColorEx = RARITY_COLORS_DB[def?.rarity ?? ''] ?? 'rgba(200,155,72,0.5)';
              return (
                <div key={entry.key} style={styles.entryRow}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: rarityColorEx, boxShadow: `0 0 4px ${rarityColorEx}70` }} />
                  <div style={styles.entryName}>{def?.name ?? entry.definitionId}{entry.finish === 'holo' ? ' ✦' : ''}</div>
                  <button className="menu-tactile-btn" style={styles.entryBtn} onClick={() => removeCard(entry.definitionId, entry.finish)}>−</button>
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
            <div style={{ ...styles.sidebarSectionTitle, justifyContent: 'space-between', marginBottom: collapsedSidebarSections.mainDeck ? 0 : 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-block', width: 12, height: 1, background: '#58aada', opacity: 0.7 }} />
                Main Deck ({totalCards} / 50)
              </div>
              <button
                className="menu-tactile-btn"
                style={styles.sectionToggleBtn}
                onClick={() => toggleSidebarSection('mainDeck')}
                title={collapsedSidebarSections.mainDeck ? 'Expand Main Deck' : 'Collapse Main Deck'}
              >
                {collapsedSidebarSections.mainDeck ? '▸' : '▾'}
              </button>
            </div>
            {/* Stats summary */}
            {!collapsedSidebarSections.mainDeck && deckList.length > 0 && (
              <div style={{
                marginBottom: 10,
                padding: '8px 10px',
                background: 'rgba(5, 8, 16, 0.7)',
                border: '1px solid rgba(62,112,168,0.20)',
                borderRadius: 8,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
              }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: 'rgba(190,215,245,0.55)', marginBottom: 6, textTransform: 'uppercase' }}>Stats</div>
                <div style={{ fontSize: 10, color: '#c8dff2', display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 5 }}>
                  {(['Legendary','Epic','Rare','Common'] as const).map(r => {
                    const n = deckStats.rarityCounts[r] ?? 0;
                    if (n === 0) return null;
                    const color = r === 'Legendary' ? '#f39c12' : r === 'Epic' ? '#9b59b6' : r === 'Rare' ? '#5b9bd5' : '#888';
                    return <span key={r} style={{ color }}>{r[0]}: <strong>{n}</strong></span>;
                  })}
                </div>
                {totalCards > 0 && (
                  <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 6, background: 'rgba(255,255,255,0.06)' }}>
                    {(['Legendary','Epic','Rare','Common'] as const).map(r => {
                      const n = deckStats.rarityCounts[r] ?? 0;
                      if (n === 0) return null;
                      const color = r === 'Legendary' ? '#f39c12' : r === 'Epic' ? '#9b59b6' : r === 'Rare' ? '#5b9bd5' : '#555';
                      return <div key={r} style={{ width: `${(n / totalCards) * 100}%`, background: color, transition: 'width 0.3s' }} />;
                    })}
                  </div>
                )}
                <div style={{ fontSize: 10, display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ color: '#f0bd78' }}>Ser: <strong>{deckStats.typeSeraphim}</strong></span>
                  <span style={{ color: warmTheme.cherubim }}>Che: <strong>{deckStats.typeCherubim}</strong></span>
                  <span style={{ color: '#9070b8' }}>Oph: <strong>{deckStats.typeOphanim}</strong></span>
                </div>
                {Object.keys(deckStats.elementCounts).length > 1 && (
                  <div style={{ fontSize: 9, color: '#9aa1aa', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {Object.entries(deckStats.elementCounts)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 6)
                      .map(([el, n]) => (
                        <span key={el} style={{ color: SET_ACCENT }}>
                          {SET_LABEL}: {n}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            )}
            {!collapsedSidebarSections.mainDeck && deckList.length === 0 && (
              <div style={{ fontSize: 12, color: 'rgba(232, 215, 191, 0.6)', textAlign: 'center', marginTop: 16 }}>
                Click cards to add them
              </div>
            )}
            {!collapsedSidebarSections.mainDeck && deckList.map(entry => {
              const def = CardRegistry.get(entry.definitionId);
              const cap = Math.min(4, collection[entry.definitionId] ?? 0);
              const owned = def ? getOwnedCopiesForFinish(def, entry.finish, collection, holoCollection) : 0;
              const totalForDefinition = deckDefinitionCountMap.get(entry.definitionId) ?? 0;
              const rarityColorMain = RARITY_COLORS_DB[def?.rarity ?? ''] ?? 'rgba(200,155,72,0.5)';
              return (
                <div key={getVariantKey(entry.definitionId, entry.finish)} style={styles.entryRow}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: rarityColorMain, boxShadow: `0 0 4px ${rarityColorMain}70` }} />
                  <div style={styles.entryName}>{def?.name ?? entry.definitionId}{entry.finish === 'holo' ? ' ✦' : ''}</div>
                  <button className="menu-tactile-btn" style={styles.entryBtn} onClick={() => removeCard(entry.definitionId, entry.finish)}>−</button>
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
          {!validation.valid && (
            <div style={{ color: '#e07060', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, lineHeight: 1 }}>✕</span>
              {validation.errors[0]}
            </div>
          )}
          {validation.valid && (
            <div style={{ color: '#80e860', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, textShadow: '0 0 14px rgba(128, 232, 96, 0.4)' }}>
              <span style={{ fontSize: 14, lineHeight: 1 }}>✓</span>
              Deck valid — 50 cards
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="menu-tactile-btn" style={styles.closeBtn} onClick={onClose}>Close</button>
          <button className={`menu-tactile-btn${validation.valid ? ' deck-play-btn-ready' : ''}`}
            style={{ ...styles.startBtn, opacity: validation.valid ? 1 : 0.38, cursor: validation.valid ? 'pointer' : 'not-allowed' }}
            onClick={validation.valid ? handleStart : undefined}
          >
            Reshuffle & Play
          </button>
        </div>
      </div>

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
            border: '1px solid rgba(200, 155, 72, 0.45)',
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
            {getDisplayCardTypeLabel(cardTooltip.card.type)} · <span style={{ color: RARITY_COLORS_DB[cardTooltip.card.rarity] ?? '#aaa' }}>{cardTooltip.card.rarity}</span> · {SET_LABEL}
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
          background: 'linear-gradient(180deg, rgba(8, 12, 22, 0.98) 0%, rgba(5, 8, 16, 0.98) 100%)',
          border: '1px solid rgba(200, 155, 72, 0.26)',
          borderRadius: 14,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          fontFamily: 'Georgia, serif',
          color: '#ead9c0',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(200, 155, 72, 0.06)',
        }}
      >
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid rgba(200, 155, 72, 0.16)',
          background: 'rgba(4, 7, 14, 0.5)',
        }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#f5c96c', letterSpacing: 3, textTransform: 'uppercase', textShadow: '0 0 20px rgba(240,189,120,0.3)' }}>How-to-Play Notes</div>
          <div style={{ fontSize: 11, color: 'rgba(234,217,192,0.55)', marginTop: 4 }}>{deckName}</div>
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
              background: 'rgba(2, 5, 12, 0.75)',
              border: '1px solid rgba(200, 155, 72, 0.25)',
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
