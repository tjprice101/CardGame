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
import VirtualizedList from '@/ui/components/VirtualizedList';
import { getCardPreviewLines } from '@/ui/cardStatSummary';
import { getDisplayCardTypeLabel, isDisplayCherubimType, isDisplayOphanimType } from '@/ui/preferences';
import { warmTheme } from '@/ui/theme';
import { useThemeVersion } from '@/ui/useThemeVersion';
import { STARTER_COLLECTION } from '@/systems/progression/StarterDeck';
import { isHoloOnlyCard } from '@/systems/progression/HolofoilSystem';
import type { DeckEntry, ExtraDeckEntry } from '@/types/game';
import type { AngelDefinition, CardDefinition, CardFinish } from '@/types/cards';
import DeckBuilderAbilitiesTab from '@/ui/deck/tabs/DeckBuilderAbilitiesTab';
import DeckBuilderAnalyzeTab from '@/ui/deck/tabs/DeckBuilderAnalyzeTab';

// Stable selector fallback: returning a fresh `{}` from a Zustand v5 selector
// triggers the "getSnapshot should be cached" infinite-render loop.
const EMPTY_CARD_LOCKS: Readonly<Record<string, number>> = Object.freeze({});

const NARROW_BREAKPOINT = 1000;
const MAIN_DECK_SIZE = 50;
const EXTRA_DECK_SIZE = 10;

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
    padding: '16px 24px', borderBottom: '1px solid rgba(72,128,190,0.32)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
    background: 'linear-gradient(180deg, rgba(4, 8, 18, 0.92) 0%, rgba(6, 11, 22, 0.70) 100%)',
    boxShadow: '0 1px 0 rgba(78,148,210,0.18), 0 4px 22px rgba(0,0,0,0.55)',
    gap: 16, flexWrap: 'wrap',
  },
  title: {
    fontSize: 22, fontWeight: 'bold', color: '#7dd4f8',
    letterSpacing: 3, textTransform: 'uppercase',
    textShadow: '0 0 36px rgba(88,180,235,0.55), 0 2px 8px rgba(0,0,0,0.9)',
    lineHeight: 1,
  },
  deckNameChip: {
    fontSize: 11, color: 'rgba(190,215,245,0.80)', marginTop: 4,
    display: 'flex', alignItems: 'center', gap: 6,
  },
  toolbar: {
    display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexShrink: 0,
    padding: '10px 24px',
    background: 'rgba(3, 6, 14, 0.6)',
    borderBottom: '1px solid rgba(72,128,190,0.20)',
  },
  toolbarBtn: {
    padding: '6px 14px', borderRadius: 7,
    border: '1px solid rgba(72,128,190,0.42)',
    background: 'rgba(78,155,220,0.10)', color: '#7dd4f8', fontSize: 11,
    cursor: 'pointer', fontFamily: 'Georgia, serif',
    letterSpacing: 0.5, transition: 'background 0.15s, box-shadow 0.15s',
    display: 'flex', alignItems: 'center', gap: 6,
  },
  toolbarBtnDanger: {
    borderColor: 'rgba(184, 90, 79, 0.4)', color: '#e07060',
    background: 'rgba(184, 90, 79, 0.08)',
  },
  toolbarBtnDisabled: { opacity: 0.35, cursor: 'not-allowed' },
  validationBanner: {
    padding: '8px 24px', fontSize: 11, flexShrink: 0,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  filterBar: {
    display: 'flex', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', gap: 4,
    padding: '8px 16px',
    background: 'rgba(3, 6, 14, 0.6)',
    borderBottom: '1px solid rgba(72,128,190,0.20)',
  },
  filterBtn: {
    padding: '5px 12px', height: 28, border: '1px solid rgba(72,128,190,0.20)',
    borderRadius: 999,
    background: 'transparent', color: 'rgba(205,228,255,0.55)', fontSize: 10,
    cursor: 'pointer', fontFamily: 'Georgia, serif', letterSpacing: 1,
    textTransform: 'uppercase', transition: 'all 0.18s ease',
    display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
  },
  filterBtnActive: {
    color: '#7dd4f8',
    borderColor: '#4298d8',
    background: 'rgba(78,160,220,0.16)',
  },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  poolPane: { flex: '1 1 60%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  cardPool: { flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 0 },
  deckPane: {
    flex: '1 1 40%', minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    borderLeft: '1px solid rgba(72,128,190,0.24)',
    background: 'linear-gradient(180deg, rgba(3, 6, 14, 0.82) 0%, rgba(4, 8, 18, 0.78) 100%)',
    boxShadow: 'inset 2px 0 18px rgba(0,0,0,0.40)',
  },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 0 8px', marginBottom: 10,
  },
  sectionLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2.5, textTransform: 'uppercase' },
  sectionCount: { fontSize: 9, color: 'rgba(205,228,255,0.52)', letterSpacing: 1.2 },
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
  extraStripWrap: {
    padding: '10px 14px', borderBottom: '1px solid rgba(72,128,190,0.18)', flexShrink: 0,
  },
  extraStripHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
    color: 'rgba(205,228,255,0.55)', marginBottom: 8,
  },
  extraStrip: {
    display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4,
  },
  extraStripCard: {
    flex: '0 0 auto', width: 52, height: 74, borderRadius: 8,
    border: '1px solid rgba(112,200,144,0.45)',
    background: 'rgba(4,8,18,0.9)',
    position: 'relative', overflow: 'hidden', cursor: 'pointer',
  },
  extraStripEmptySlot: {
    flex: '0 0 auto', width: 52, height: 74, borderRadius: 8,
    border: '1px dashed rgba(72,128,190,0.30)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(190,215,245,0.28)', fontSize: 16,
  },
  subTabStrip: {
    display: 'flex', alignItems: 'stretch', flexShrink: 0,
    background: 'rgba(3,6,14,0.85)',
    borderBottom: '1px solid rgba(72,128,190,0.20)',
  },
  subTabBtn: {
    flex: 1, padding: '0 12px', height: 36, border: 'none',
    borderBottom: '2px solid transparent',
    background: 'transparent', color: 'rgba(205,228,255,0.50)', fontSize: 10.5,
    cursor: 'pointer', fontFamily: 'Georgia, serif', letterSpacing: 1,
    textTransform: 'uppercase', transition: 'all 0.18s ease',
  },
  subTabBtnActive: {
    color: '#7dd4f8', borderBottomColor: '#4298d8',
    background: 'rgba(78,160,220,0.10)',
  },
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
  empty: {
    width: '100%', textAlign: 'center', marginTop: 48,
    fontSize: 13, color: 'rgba(165,205,245,0.52)', fontStyle: 'italic',
  },
  nameInput: {
    background: 'rgba(2, 5, 14, 0.82)',
    border: '1px solid rgba(72,128,190,0.45)',
    color: '#d8f0ff', fontSize: 12, padding: '6px 10px', borderRadius: 6,
    fontFamily: 'Georgia, serif', outline: 'none', width: 180, boxSizing: 'border-box',
  },
  loadDropdownPanel: {
    position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 30,
    minWidth: 240, maxHeight: 320, overflowY: 'auto',
    background: 'linear-gradient(180deg, rgba(8,12,22,0.98), rgba(5,8,16,0.98))',
    border: '1px solid rgba(72,128,190,0.4)', borderRadius: 10,
    boxShadow: '0 12px 32px rgba(0,0,0,0.6)', padding: 6,
  },
  loadDeckRow: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
    transition: 'background 0.12s',
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

/** Small radial progress ring used in the header banner. */
function ProgressRing({ value, max, color, size = 44, label }: { value: number; max: number; color: string; size?: number; label: string }) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, max > 0 ? value / max : 0);
  const dashOffset = circumference * (1 - pct);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }} title={`${label}: ${value} / ${max}`}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 6px ${color}60)` }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.35s ease' }}
        />
        <text
          x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize={size * 0.28} fontWeight="bold" fontFamily="Georgia, serif"
          transform={`rotate(90, ${size / 2}, ${size / 2})`}
        >
          {value}
        </text>
      </svg>
      <span style={{ fontSize: 8, letterSpacing: 1, color: 'rgba(190,215,245,0.5)', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

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
  const setDeckAbilityLoadout = useStore(s => s.setDeckAbilityLoadout);
  const uniqueOwned = Object.keys(collection).length;
  const isLocked = uniqueOwned < 15;

  const activeDeck = savedDecks.find(d => d.id === activeDeckId) ?? null;
  const isEditingStarter = activeDeck?.isStarter ?? false;

  const [deckList, setDeckList] = useState<DeckEntry[]>(
    activeDeck?.deckList?.length ? [...activeDeck.deckList] : (currentDeck.deckList.length > 0 ? [...currentDeck.deckList] : [])
  );
  const [extraDeckList, setExtraDeckList] = useState<ExtraDeckEntry[]>(
    activeDeck?.extraDeck ? [...activeDeck.extraDeck] : (currentDeck.extraDeck ? [...currentDeck.extraDeck] : [])
  );
  const [elementFilter, setElementFilter] = useState<string | null>(null);
  const [saveMode, setSaveMode] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [loadMenuOpen, setLoadMenuOpen] = useState(false);
  const [subTab, setSubTab] = useState<'cards' | 'abilities' | 'analyze'>('cards');

  // Card hover tooltip (1.5s delay)
  const [cardTooltip, setCardTooltip] = useState<{ card: CardDefinition; x: number; y: number } | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const cardPoolViewportRef = useRef<HTMLDivElement | null>(null);
  const [cardPoolViewportWidth, setCardPoolViewportWidth] = useState(0);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const node = cardPoolViewportRef.current;
    if (!node) return;

    const updateWidth = () => setCardPoolViewportWidth(Math.max(0, node.clientWidth - 40));
    updateWidth();

    const resizeObserver = new ResizeObserver(() => updateWidth());
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const node = bodyRef.current;
    if (!node) return;
    const update = () => setIsNarrow(node.clientWidth < NARROW_BREAKPOINT);
    update();
    const resizeObserver = new ResizeObserver(() => update());
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

  // Card pool grouped into subsections (Angels get their own section too — the
  // Extra Deck strip is filled by clicking Angel cards from the pool, same as
  // any other card. There is no separate Extra Deck tab.)
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
        countText: `${extraDeckList.length} / ${EXTRA_DECK_SIZE} selected`,
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
        if (cap <= 0 || ownedFinishCopies <= 0 || totalForDefinition >= cap || totalForFinish >= ownedFinishCopies || prev.length >= EXTRA_DECK_SIZE) return prev;
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
    setLoadMenuOpen(false);
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
      if (total >= MAIN_DECK_SIZE) break;
      const ownedTotal = collection[c.def.definitionId] ?? 0;
      // Keep adding copies of this candidate until cap or deck full.
      while (total < MAIN_DECK_SIZE) {
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
      total >= MAIN_DECK_SIZE ? `Deck filled to ${MAIN_DECK_SIZE} with best owned cards.` : `Deck filled with ${total} cards (no more cards available).`,
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
      ? count < owned && totalForDefinition < cap && extraDeckList.length < EXTRA_DECK_SIZE
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

      {/* Header banner */}
      <div className="ui-shimmer-band" style={styles.header}>
        <div>
          <div className="ui-title-glow" style={styles.title}>Deck Builder</div>
          {activeDeck && (
            <div style={styles.deckNameChip}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: SET_ACCENT, flexShrink: 0 }} />
              {activeDeck.isStarter ? '🔒 ' : ''}{activeDeck.name} · {SET_LABEL}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <ProgressRing
            value={totalCards} max={MAIN_DECK_SIZE}
            color={totalCards === MAIN_DECK_SIZE ? '#80e860' : totalCards > MAIN_DECK_SIZE ? '#e06060' : '#58aada'}
            label="Main"
          />
          <ProgressRing value={extraDeckList.length} max={EXTRA_DECK_SIZE} color="#70c890" size={38} label="Extra" />
        </div>
      </div>

      {/* Toolbar — replaces the old sidebar */}
      <div style={styles.toolbar}>
        <div style={{ position: 'relative' }}>
          <button
            className="menu-tactile-btn"
            style={styles.toolbarBtn}
            onClick={() => setLoadMenuOpen(v => !v)}
          >
            Load ▾
          </button>
          {loadMenuOpen && (
            <div style={styles.loadDropdownPanel} onMouseLeave={() => setLoadMenuOpen(false)}>
              {savedDecks.map(sd => (
                <div
                  key={sd.id}
                  style={{
                    ...styles.loadDeckRow,
                    ...(sd.id === activeDeckId ? { background: 'rgba(58,142,200,0.14)' } : {}),
                  }}
                >
                  <div style={{ flex: 1, fontSize: 11, color: 'rgba(205,228,255,0.82)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onClick={() => handleLoadSaved(sd.id)}>
                    {sd.isStarter ? '🔒 ' : ''}{sd.name}
                  </div>
                  {!sd.isStarter && (
                    <button
                      className="menu-tactile-btn"
                      style={{ ...styles.toolbarBtn, ...styles.toolbarBtnDanger, padding: '3px 8px', fontSize: 10 }}
                      onClick={() => {
                        if (window.confirm(`Delete deck "${sd.name}"? This cannot be undone.`)) deleteSavedDeck(sd.id);
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {saveMode ? (
          <>
            <input
              style={styles.nameInput}
              placeholder="Deck name…"
              value={newDeckName}
              onChange={e => setNewDeckName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveNew(); if (e.key === 'Escape') setSaveMode(false); }}
              autoFocus
            />
            <button
              className="menu-tactile-btn"
              style={{ ...styles.toolbarBtn, ...((validation.valid && newDeckName.trim()) ? {} : styles.toolbarBtnDisabled) }}
              onClick={handleSaveNew}
            >
              Save
            </button>
            <button className="menu-tactile-btn" style={{ ...styles.toolbarBtn, ...styles.toolbarBtnDanger }} onClick={() => { setSaveMode(false); setNewDeckName(''); }}>
              Cancel
            </button>
          </>
        ) : (
          <button
            className="menu-tactile-btn"
            style={{ ...styles.toolbarBtn, ...(validation.valid ? {} : styles.toolbarBtnDisabled) }}
            onClick={() => validation.valid && setSaveMode(true)}
          >
            Save As
          </button>
        )}

        {!isEditingStarter && activeDeckId && (
          <button
            className="menu-tactile-btn"
            style={{ ...styles.toolbarBtn, ...(validation.valid ? {} : styles.toolbarBtnDisabled) }}
            onClick={handleUpdateCurrent}
          >
            Update
          </button>
        )}

        <button
          className="menu-tactile-btn"
          style={{ ...styles.toolbarBtn, ...(totalCards < MAIN_DECK_SIZE ? {} : styles.toolbarBtnDisabled) }}
          onClick={handleFillWithBest}
          disabled={totalCards >= MAIN_DECK_SIZE}
          title="Top up the deck with your highest-rarity owned cards."
        >
          Fill Best
        </button>

        <button
          className="menu-tactile-btn"
          style={{ ...styles.toolbarBtn, ...styles.toolbarBtnDanger, ...((deckList.length > 0 || extraDeckList.length > 0) ? {} : styles.toolbarBtnDisabled) }}
          onClick={handleClearDeck}
          disabled={deckList.length === 0 && extraDeckList.length === 0}
        >
          Clear
        </button>
      </div>

      {/* Validation banner */}
      {!validation.valid ? (
        <div style={{ ...styles.validationBanner, color: '#e07060' }}>
          <span style={{ fontSize: 13, lineHeight: 1 }}>✕</span>
          {validation.errors[0]}
        </div>
      ) : (
        <div style={{ ...styles.validationBanner, color: '#80e860', textShadow: '0 0 14px rgba(128, 232, 96, 0.4)' }}>
          <span style={{ fontSize: 13, lineHeight: 1 }}>✓</span>
          Deck valid — {MAIN_DECK_SIZE} cards
        </div>
      )}

      {/* Element filter */}
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
                borderColor: SET_ACCENT,
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

      {/* Two-pane body: pool (left/top) + deck (right/bottom) */}
      <div ref={bodyRef} style={{ ...styles.body, flexDirection: isNarrow ? 'column' : 'row' }}>
        {/* Pool pane */}
        <div style={{ ...styles.poolPane, flex: isNarrow ? '1 1 55%' : styles.poolPane.flex }}>
          {deckPoolRows.length === 0 ? (
            <div style={styles.cardPool}>
              <div style={styles.empty}>
                {`No${elementFilter ? ` ${SET_LABEL}` : ''} cards in your collection yet.`}
              </div>
            </div>
          ) : (
            <VirtualizedList
              items={deckPoolRows}
              getItemKey={(row) => row.key}
              getItemHeight={(row) => row.kind === 'heading' ? 44 : 214}
              topPadding={12}
              bottomPadding={24}
              overscanPx={300}
              viewportRef={cardPoolViewportRef}
              style={styles.cardPool}
              renderItem={(row) => {
                if (row.kind === 'heading') {
                  const accent = getSectionColors()[row.sectionLabel] ?? '#58aada';
                  const title = row.sectionLabel === 'Angel' ? 'Angels (adds to Extra Deck)' : row.sectionLabel;
                  return (
                    <div style={{ padding: '0 4px' }}>
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
                  <div style={{ display: 'flex', gap: 10, padding: '0 4px 24px', alignItems: 'flex-start' }}>
                    {row.entries?.map((entry) => renderPoolCard(entry, row.sectionLabel))}
                  </div>
                );
              }}
            />
          )}
        </div>

        {/* Deck pane */}
        <div style={styles.deckPane}>
          {/* Extra Deck strip — always visible, the sole Extra Deck surface */}
          <div style={styles.extraStripWrap}>
            <div style={styles.extraStripHeader}>
              <span>Extra Deck</span>
              <span>{extraDeckList.length} / {EXTRA_DECK_SIZE}</span>
            </div>
            <div style={styles.extraStrip}>
              {extraDeckEntries.map(entry => {
                const def = CardRegistry.get(entry.definitionId);
                if (!def) return null;
                return (
                  <div
                    key={entry.key}
                    style={{
                      ...styles.extraStripCard,
                      ...getDenseCardFaceBackgroundStyle(def, entry.finish, 'front', true),
                    }}
                    title={`${def.name} ×${entry.copies} — click to remove one`}
                    onClick={() => removeCard(entry.definitionId, entry.finish)}
                  >
                    {entry.copies > 1 && (
                      <div style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 9, fontWeight: 'bold', color: '#3a1800', background: '#f8d878', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {entry.copies}
                      </div>
                    )}
                  </div>
                );
              })}
              {extraDeckList.length === 0 && (
                <div style={styles.extraStripEmptySlot}>+</div>
              )}
            </div>
          </div>

          {/* Sub-tabs: Cards · Abilities · Analyze */}
          <div style={styles.subTabStrip}>
            {(['cards', 'abilities', 'analyze'] as const).map(tab => {
              const LABELS: Record<string, string> = { cards: 'Cards', abilities: 'Abilities', analyze: 'Analyze' };
              return (
                <button
                  key={tab}
                  className="menu-tactile-btn"
                  style={{ ...styles.subTabBtn, ...(subTab === tab ? styles.subTabBtnActive : {}) } as React.CSSProperties}
                  onClick={() => setSubTab(tab)}
                >
                  {LABELS[tab]}
                </button>
              );
            })}
          </div>

          {subTab === 'abilities' ? (
            <DeckBuilderAbilitiesTab
              deckList={deckList}
              extraDeckList={extraDeckList}
              activeDeck={activeDeck}
              setDeckAbilityLoadout={setDeckAbilityLoadout}
            />
          ) : subTab === 'analyze' ? (
            <DeckBuilderAnalyzeTab
              deckList={deckList}
              extraDeckList={extraDeckList}
              totalCards={totalCards}
              deckStats={deckStats}
              deckId={activeDeckId ?? null}
              currentNotes={activeDeck?.notes ?? ''}
              setDeckNotes={setDeckNotes}
            />
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
              {deckList.length === 0 && (
                <div style={{ fontSize: 12, color: 'rgba(232, 215, 191, 0.6)', textAlign: 'center', marginTop: 16 }}>
                  Click cards in the pool to add them.
                </div>
              )}
              {deckList.map(entry => {
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
          )}
        </div>
      </div>

      <div style={styles.footer}>
        <div style={{ fontSize: 11, color: 'rgba(190,215,245,0.5)' }}>
          {activeDeck?.notes && activeDeck.notes.trim().length > 0 && subTab !== 'analyze' && (
            <button
              className="menu-tactile-btn"
              onClick={() => setSubTab('analyze')}
              style={{ background: 'transparent', border: 'none', color: 'rgba(190,215,245,0.55)', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 11 }}
            >
              📝 This deck has notes — view in Analyze
            </button>
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
