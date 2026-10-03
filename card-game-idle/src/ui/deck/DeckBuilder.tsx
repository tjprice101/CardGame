import { useEffect, useState, useMemo, useRef } from 'react';
import { useStore, selectDeck } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { DeckSystem } from '@/systems/cards/DeckSystem';
import { SET_ACCENT, getCardSetLabel } from '@/data/elements';
import {
  getLiveCardFaceBackgroundStyle,
  getLiveCardShimmerClassName,
} from '@/ui/cardBackgrounds';
import CardRulesDigest from '@/ui/components/CardRulesDigest';
import CollectionCardTile from '@/ui/components/CollectionCardTile';
import { getCardPreviewLines } from '@/ui/cardStatSummary';
import { getDisplayCardTypeLabel } from '@/ui/preferences';
import { warmTheme } from '@/ui/theme';
import { useThemeVersion } from '@/ui/useThemeVersion';
import { isHoloOnlyCard } from '@/systems/progression/HolofoilSystem';
import type { DeckEntry, ExtraDeckEntry } from '@/types/game';
import type { CardDefinition, CardFinish } from '@/types/cards';
import { calculateDeckDpsProjection } from '@/systems/cards/DeckDpsCalculator';
import { getCardSpectrumLevel } from '@/systems/cards/SpectrumLevel';
import { computeGlobalResonanceScore } from '@/systems/progression/cardMastery';
import { formatNumber } from '@/utils/bignum';
import DeckBuilderAbilitiesTab from '@/ui/deck/tabs/DeckBuilderAbilitiesTab';
import DeckBuilderAnalyzeTab from '@/ui/deck/tabs/DeckBuilderAnalyzeTab';
import { CARD_COLLECTION_TILE_HEIGHT, CARD_COLLECTION_TILE_WIDTH } from '@/ui/cardTileMetrics';

// Stable selector fallback: returning a fresh `{}` from a Zustand v5 selector
// triggers the "getSnapshot should be cached" infinite-render loop.
const EMPTY_OWNED_ABILITIES: Readonly<Record<string, boolean>> = Object.freeze({});

const NARROW_BREAKPOINT = 1000;
const MAIN_DECK_SIZE = 50;
const EXTRA_DECK_SIZE = 10;
// Match the Card Store collection tile footprint exactly.
const CARD_LIBRARY_CARD_WIDTH = CARD_COLLECTION_TILE_WIDTH;
const CARD_LIBRARY_CARD_HEIGHT = CARD_COLLECTION_TILE_HEIGHT;

function getCardSet(definitionId: string): 'Neutrality' | 'Causality' {
  if (definitionId.includes('causality')) return 'Causality';
  return 'Neutrality';
}

const RARITY_ORDER = { Common: 0, Rare: 1, Epic: 2, Legendary: 3 };
// Built lazily per render so theme switches reflect immediately.
function getSectionColors(): Record<string, string> {
  return {
    'Ain Soph Aur': warmTheme.accentSoft,
    Light: warmTheme.accent,
    Dark: warmTheme.accentSoft,
  };
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at 82% 8%, color-mix(in srgb, var(--profile-accent-soft) 14%, transparent) 0%, transparent 38%), var(--profile-app-background)',
    zIndex: 50,
    display: 'flex', flexDirection: 'column', pointerEvents: 'auto',
    fontFamily: 'Georgia, serif',
    color: 'var(--profile-text)',
  },
  header: {
    padding: '12px 16px', borderBottom: '1px solid var(--profile-border)',
    display: 'grid', gridTemplateColumns: 'minmax(230px, 0.9fr) minmax(340px, 1.2fr) auto',
    alignItems: 'center', flexShrink: 0,
    background: `linear-gradient(90deg, color-mix(in srgb, var(--profile-surface-muted) 97%, transparent) 0%, color-mix(in srgb, var(--profile-surface-strong) 94%, transparent) 58%, color-mix(in srgb, var(--profile-surface-strong) 80%, transparent) 100%), url("${import.meta.env.BASE_URL}assets/menu-banners/updated/deck-builder-worktable.png") right center / cover`,
    boxShadow: '0 1px 0 var(--profile-border), 0 4px 22px rgba(0,0,0,0.55)',
    gap: 16,
  },
  title: {
    fontSize: 26, fontWeight: 'bold', color: 'var(--profile-accent)',
    letterSpacing: 3, textTransform: 'uppercase',
    textShadow: '0 0 36px color-mix(in srgb, var(--profile-accent) 40%, transparent), 0 2px 8px rgba(0,0,0,0.9)',
    lineHeight: 1,
  },
  deckNameChip: {
    fontSize: 11, color: 'var(--profile-text-muted)', marginTop: 4, fontStyle: 'italic',
    display: 'flex', alignItems: 'center', gap: 6,
  },
  toolbar: {
    display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', alignItems: 'center', gap: 6,
    flexShrink: 0,
  },
  toolbarBtn: {
    padding: '6px 10px', borderRadius: 7,
    border: '1px solid var(--profile-border)',
    background: 'color-mix(in srgb, var(--profile-accent) 8%, transparent)', color: 'var(--profile-text)', fontSize: 11,
    cursor: 'pointer', fontFamily: 'Georgia, serif',
    letterSpacing: 0.5, transition: 'background 0.15s, box-shadow 0.15s',
    display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  toolbarBtnDanger: {
    borderColor: 'rgba(184, 90, 79, 0.4)', color: '#e07060',
    background: 'rgba(184, 90, 79, 0.08)',
  },
  toolbarBtnDisabled: { borderStyle: 'dashed', cursor: 'not-allowed' },
  validationBanner: {
    padding: '8px 10px', fontSize: 11, flexShrink: 0,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  filterBar: {
    display: 'flex', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', gap: 4,
    padding: '8px 16px',
    background: 'color-mix(in srgb, var(--profile-surface-muted) 70%, transparent)',
    borderBottom: '1px solid var(--profile-border)',
  },
  filterBtn: {
    padding: '5px 12px', height: 28, border: '1px solid var(--profile-border)',
    borderRadius: 999,
    background: 'transparent', color: 'var(--profile-text-muted)', fontSize: 10,
    cursor: 'pointer', fontFamily: 'Georgia, serif', letterSpacing: 1,
    textTransform: 'uppercase', transition: 'all 0.18s ease',
    display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
  },
  filterBtnActive: {
    color: 'var(--profile-accent)',
    borderColor: 'var(--profile-border-strong)',
    background: 'color-mix(in srgb, var(--profile-accent) 16%, transparent)',
  },
  body: { display: 'grid', gridTemplateColumns: '252px minmax(0, 1fr) 300px', gap: 8, flex: 1, overflow: 'hidden', minHeight: 0, padding: '8px 10px' },
  poolPane: { flex: '1 1 auto', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, position: 'relative' },
  cardPool: { flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 0 },
  deckPane: {
    flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    background: 'transparent',
  },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 0 8px', marginBottom: 10,
  },
  sectionLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2.5, textTransform: 'uppercase' },
  sectionCount: { fontSize: 9, color: 'var(--profile-text-muted)', letterSpacing: 1.2 },
  cardWithMeta: {
    width: CARD_LIBRARY_CARD_WIDTH,
    flex: `0 0 ${CARD_LIBRARY_CARD_WIDTH}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  card: {
    width: CARD_LIBRARY_CARD_WIDTH, height: CARD_LIBRARY_CARD_HEIGHT,
    flex: `0 0 ${CARD_LIBRARY_CARD_WIDTH}px`,
    background: 'color-mix(in srgb, var(--profile-surface-muted) 90%, transparent)',
    border: '1px solid var(--profile-border)', borderRadius: 12, cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'stretch',
    transition: 'border-color 0.18s ease, box-shadow 0.18s ease, transform 0.14s ease',
    position: 'relative', overflow: 'hidden',
  },
  cardAdded: {
    borderColor: 'var(--profile-accent)',
    boxShadow: '0 0 0 1px color-mix(in srgb, var(--profile-accent) 45%, transparent), 0 0 22px color-mix(in srgb, var(--profile-accent) 28%, transparent)',
    transform: 'translateY(-2px)',
  },
  cardFull: { opacity: 0.34, cursor: 'not-allowed' },
  badge: {
    position: 'absolute', bottom: 7, right: 6, width: 21, height: 21,
    borderRadius: '50%',
    background: 'var(--profile-button)',
    color: 'var(--profile-accent-deep)',
    fontSize: 11, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 1px 5px rgba(0,0,0,0.65), 0 0 8px color-mix(in srgb, var(--profile-accent) 35%, transparent)',
  },
  ownedLabelBelow: {
    fontSize: 9, color: 'var(--profile-text-soft)', letterSpacing: 0.4,
    textAlign: 'center',
    pointerEvents: 'none',
    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
    background: 'var(--profile-surface-muted)',
    border: '1px solid var(--profile-border)',
    borderRadius: 5,
    padding: '2px 5px',
  },
  copyCountRow: {
    marginTop: 2,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    fontSize: 10, color: 'var(--profile-text)', letterSpacing: 0.4,
    background: 'var(--profile-surface-muted)',
    border: '1px solid var(--profile-border)',
    borderRadius: 5,
    padding: '3px 4px',
    pointerEvents: 'auto',
  },
  copyCountBtn: {
    width: 20, height: 20, padding: 0,
    border: '1px solid var(--profile-border-strong)',
    background: 'color-mix(in srgb, var(--profile-accent) 10%, transparent)',
    color: 'var(--profile-text)',
    borderRadius: 3, cursor: 'pointer',
    fontSize: 14, lineHeight: '18px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Georgia, serif',
  },
  copyCountBtnDisabled: {
    borderStyle: 'dashed', cursor: 'not-allowed',
  },
  extraStripWrap: {
    padding: '10px 14px', borderBottom: '1px solid var(--profile-border)', flexShrink: 0,
  },
  extraStripHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
    color: 'var(--profile-text-muted)', marginBottom: 8,
  },
  extraStrip: {
    display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4,
  },
  extraStripCard: {
    flex: '0 0 auto', width: CARD_COLLECTION_TILE_WIDTH, height: CARD_COLLECTION_TILE_HEIGHT, borderRadius: 10,
    border: '1px solid var(--profile-border-strong)',
    background: 'var(--profile-surface-muted)',
    position: 'relative', overflow: 'hidden', cursor: 'pointer',
  },
  extraStripEmptySlot: {
    flex: '0 0 auto', width: CARD_COLLECTION_TILE_WIDTH, height: CARD_COLLECTION_TILE_HEIGHT, borderRadius: 10,
    border: '1px dashed var(--profile-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--profile-text-muted)', fontSize: 16,
  },
  subTabStrip: {
    display: 'flex', alignItems: 'stretch', flexShrink: 0,
    background: 'var(--profile-surface-muted)',
    borderBottom: '1px solid var(--profile-border)',
  },
  subTabBtn: {
    flex: 1, padding: '0 12px', height: 36, border: 'none',
    borderBottom: '2px solid transparent',
    background: 'transparent', color: 'var(--profile-text-muted)', fontSize: 10.5,
    cursor: 'pointer', fontFamily: 'Georgia, serif', letterSpacing: 1,
    textTransform: 'uppercase', transition: 'all 0.18s ease',
  },
  subTabBtnActive: {
    color: 'var(--profile-accent)', borderBottomColor: 'var(--profile-border-strong)',
    background: 'color-mix(in srgb, var(--profile-accent) 10%, transparent)',
  },
  entryRow: {
    display: 'flex', alignItems: 'center',
    padding: '4px 6px', marginBottom: 1, borderRadius: 4,
    borderBottom: '1px solid var(--profile-border)',
    gap: 5, transition: 'background 0.12s',
  },
  entryName: { fontSize: 10.5, color: 'var(--profile-text-soft)', flex: 1, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  entryCount: {
    fontSize: 11, color: 'var(--profile-accent)', margin: '0 3px', minWidth: 18, textAlign: 'center',
    fontWeight: 'bold', flexShrink: 0,
  },
  entryBtn: {
    width: 22, height: 22, border: '1px solid var(--profile-border-strong)', borderRadius: 5,
    background: 'color-mix(in srgb, var(--profile-accent) 13%, transparent)', color: 'var(--profile-accent)', fontSize: 14, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
    transition: 'background 0.12s, border-color 0.12s',
    lineHeight: 1, flexShrink: 0,
  },
  footer: {
    padding: '14px 28px', borderTop: '1px solid var(--profile-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
    background: 'linear-gradient(180deg, color-mix(in srgb, var(--profile-surface-strong) 70%, transparent), var(--profile-surface-muted))',
    boxShadow: '0 -1px 0 var(--profile-border)',
  },
  startBtn: {
    padding: '11px 34px', borderRadius: 10,
    border: '1px solid var(--profile-border-strong)',
    background: 'var(--profile-button)',
    color: 'var(--profile-accent-deep)', fontSize: 13,
    cursor: 'pointer', letterSpacing: 2, fontFamily: 'Georgia, serif',
    textShadow: 'none',
    boxShadow: '0 2px 14px color-mix(in srgb, var(--profile-accent) 38%, transparent), inset 0 1px 0 rgba(255,255,255,0.14)',
    textTransform: 'uppercase',
    transition: 'box-shadow 0.25s, transform 0.15s',
  },
  closeBtn: {
    padding: '10px 20px', borderRadius: 10,
    border: '1px solid var(--profile-border)',
    background: 'color-mix(in srgb, var(--profile-accent) 6%, transparent)',
    color: 'var(--profile-text-soft)', fontSize: 12,
    cursor: 'pointer', fontFamily: 'Georgia, serif',
    letterSpacing: 0.5, transition: 'background 0.15s, border-color 0.15s',
  },
  empty: {
    width: '100%', textAlign: 'center', marginTop: 48,
    fontSize: 13, color: 'var(--profile-text-muted)', fontStyle: 'italic',
  },
  nameInput: {
    background: 'var(--profile-surface-muted)',
    border: '1px solid var(--profile-border-strong)',
    color: 'var(--profile-text)', fontSize: 12, padding: '6px 10px', borderRadius: 6,
    fontFamily: 'Georgia, serif', outline: 'none', width: 180, boxSizing: 'border-box',
  },
  loadDropdownPanel: {
    position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 30,
    minWidth: 240, maxHeight: 320, overflowY: 'auto',
    background: 'linear-gradient(180deg, var(--profile-surface-strong), var(--profile-surface-muted))',
    border: '1px solid var(--profile-border-strong)', borderRadius: 10,
    boxShadow: '0 12px 32px rgba(0,0,0,0.6)', padding: 6,
  },
  loadDeckRow: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
    transition: 'background 0.12s',
  },
};

interface Props { onClose: () => void }
type BuilderSurface = 'library' | 'deck' | 'abilities' | 'analyze';

interface CardVariantDisplay {
  key: string;
  finish: CardFinish;
  ownedCopies: number;
  def: CardDefinition;
}

interface CardPreviewSelection {
  card: CardDefinition;
  finish: CardFinish;
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
  const { initDeck, saveCurrentDeck, updateSavedDeck, loadSavedDeck, deleteSavedDeck } = useStore.getState();
  const currentDeck = useStore(selectDeck);
  const collection = useStore(s => s.progress.collection);
  const ownedAbilities = useStore(s => s.progress.ownedAbilities ?? EMPTY_OWNED_ABILITIES);
  const holoCollection = useStore(s => s.progress.holoCollection);
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
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [cardSearch, setCardSearch] = useState('');
  const [saveMode, setSaveMode] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [loadMenuOpen, setLoadMenuOpen] = useState(false);
  const [surface, setSurface] = useState<BuilderSurface>('library');

  const progress = useStore(s => s.progress);
  const collectionPower = useMemo(() => computeGlobalResonanceScore(progress), [progress]);
  const liveDpsProjection = useMemo(() => {
    return calculateDeckDpsProjection(deckList, extraDeckList, activeDeck?.abilityLoadout, collectionPower);
  }, [deckList, extraDeckList, activeDeck?.abilityLoadout, collectionPower]);

  const [hoveredCardPreview, setHoveredCardPreview] = useState<CardPreviewSelection | null>(null);
  const [pinnedCardPreview, setPinnedCardPreview] = useState<CardPreviewSelection | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const node = bodyRef.current;
    if (!node) return;
    const update = () => setIsNarrow(node.clientWidth < NARROW_BREAKPOINT);
    update();
    const resizeObserver = new ResizeObserver(() => update());
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

  const previewCard = pinnedCardPreview ?? hoveredCardPreview ?? (
    deckList[0]
      ? { card: CardRegistry.get(deckList[0].definitionId), finish: deckList[0].finish }
      : extraDeckList[0]
        ? { card: CardRegistry.get(extraDeckList[0].definitionId), finish: extraDeckList[0].finish }
        : null
  );
  const resolvedPreview = previewCard?.card ? previewCard as CardPreviewSelection : null;
  const previewIsPinned = Boolean(pinnedCardPreview && resolvedPreview &&
    pinnedCardPreview.card.definitionId === resolvedPreview.card.definitionId && pinnedCardPreview.finish === resolvedPreview.finish);

  function pinCardPreview(event: React.MouseEvent, card: CardDefinition, finish: CardFinish) {
    event.preventDefault();
    setPinnedCardPreview(current => current?.card.definitionId === card.definitionId && current.finish === finish
      ? null
      : { card, finish });
    setHoveredCardPreview(null);
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
    const availableElements = ['Neutrality', 'Causality'];
    const query = cardSearch.trim().toLowerCase();
    const filtered = ownedCards.filter(card => {
      if (elementFilter !== null && getCardSet(card.def.definitionId) !== elementFilter) return false;
      if (levelFilter !== null && getCardSpectrumLevel(card.def) !== levelFilter) return false;
      if (!query) return true;
      const searchable = [
        card.def.name,
        card.def.definitionId,
        card.def.type,
        card.def.rarity,
        getCardSetLabel(card.def.definitionId),
        getCardPreviewLines(card.def, 8).join(' '),
      ].join(' ').toLowerCase();
      return searchable.includes(query);
    });

    const byRarity = (a: CardVariantDisplay, b: CardVariantDisplay) => {
      const rarityDelta = (RARITY_ORDER[a.def.rarity as keyof typeof RARITY_ORDER] ?? 0) -
        (RARITY_ORDER[b.def.rarity as keyof typeof RARITY_ORDER] ?? 0);
      if (rarityDelta !== 0) return rarityDelta;
      if (a.def.name !== b.def.name) return a.def.name.localeCompare(b.def.name);
      return a.finish.localeCompare(b.finish);
    };

    return {
      mainSections: [
        { label: 'Light', cards: filtered.filter(d => d.def.type === 'Light').sort(byRarity) },
        { label: 'Dark', cards: filtered.filter(d => d.def.type === 'Dark').sort(byRarity) },
      ].filter(s => s.cards.length > 0),
      angelSection: filtered.filter(d => d.def.type === 'AinSophAur').sort(byRarity),
      availableElements,
    };
  }, [cardSearch, collection, holoCollection, elementFilter, levelFilter]);

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
  const deckSetName = useMemo(() => {
    const setCounts = { Neutrality: 0, Causality: 0 };
    for (const entry of deckList) {
      const setId = getCardSet(entry.definitionId);
      setCounts[setId] += entry.copies;
    }
    for (const entry of extraDeckList) {
      const setId = getCardSet(entry.definitionId);
      setCounts[setId] += 1;
    }
    return setCounts.Causality > setCounts.Neutrality ? 'Causality' : 'Neutrality';
  }, [deckList, extraDeckList]);
  const validation = DeckSystem.validate(deckList);
  // Aggregate deck stats: element distribution + rarity breakdown.
  const deckStats = useMemo(() => {
    const elementCounts: Record<string, number> = {};
    const rarityCounts: Record<string, number> = { Common: 0, Rare: 0, Epic: 0, Legendary: 0 };
    const levelCounts = [0, 0, 0, 0, 0, 0];
    const lightLevelCounts = [0, 0, 0, 0, 0, 0];
    const darkLevelCounts = [0, 0, 0, 0, 0, 0];
    let typeLight = 0, typeDark = 0;
    for (const entry of deckList) {
      const def = CardRegistry.get(entry.definitionId);
      if (!def) continue;
      const el = 'Neutrality';
      elementCounts[el] = (elementCounts[el] ?? 0) + entry.copies;
      rarityCounts[def.rarity] = (rarityCounts[def.rarity] ?? 0) + entry.copies;
      const level = getCardSpectrumLevel(def);
      levelCounts[level] += entry.copies;
      if (def.type === 'Light') {
        typeLight += entry.copies;
        lightLevelCounts[level] += entry.copies;
      } else if (def.type === 'Dark') {
        typeDark += entry.copies;
        darkLevelCounts[level] += entry.copies;
      }
    }
    return { elementCounts, rarityCounts, levelCounts, lightLevelCounts, darkLevelCounts, typeLight, typeDark };
  }, [deckList]);
  const spectrumPeak = Math.max(1, ...deckStats.levelCounts);
  const mainDeckEntriesByType = useMemo(() => ({
    Light: deckList.filter(entry => CardRegistry.get(entry.definitionId)?.type === 'Light').sort((a, b) => {
      const aDef = CardRegistry.get(a.definitionId);
      const bDef = CardRegistry.get(b.definitionId);
      return (aDef && bDef ? getCardSpectrumLevel(aDef) - getCardSpectrumLevel(bDef) : 0) || (aDef?.name ?? '').localeCompare(bDef?.name ?? '');
    }),
    Dark: deckList.filter(entry => CardRegistry.get(entry.definitionId)?.type === 'Dark').sort((a, b) => {
      const aDef = CardRegistry.get(a.definitionId);
      const bDef = CardRegistry.get(b.definitionId);
      return (aDef && bDef ? getCardSpectrumLevel(aDef) - getCardSpectrumLevel(bDef) : 0) || (aDef?.name ?? '').localeCompare(bDef?.name ?? '');
    }),
  }), [deckList]);

  function addCard(defId: string, finish: CardFinish) {
    const def = CardRegistry.get(defId);
    if (!def) return;

    const ownedCopies = collection[defId] ?? 0;
    const ownedFinishCopies = getOwnedCopiesForFinish(def, finish, collection, holoCollection);

    if (def.type === 'AinSophAur') {
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

    if (def.type === 'AinSophAur') {
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
    saveCurrentDeck(newDeckName.trim(), deckList, extraDeckList, activeDeck?.abilityLoadout);
    setSaveMode(false);
    setNewDeckName('');
  }

  function handleUpdateCurrent() {
    if (!activeDeckId || isEditingStarter || !validation.valid) return;
    updateSavedDeck(activeDeckId, deckList, extraDeckList, activeDeck?.abilityLoadout);
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
      // Skip Ain Soph Aur — they belong in the extra deck.
      if (def.type === 'AinSophAur') continue;
      // Respect set filter if active.
      if (elementFilter !== null && getCardSet(def.definitionId) !== elementFilter) continue;
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
    const isAngel = sectionLabel === 'Ain Soph Aur';
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
    const finishLabel = getFinishLabel(def.def, def.finish);
    const isFull = isAngel ? (count === 0 && !canAdd) : !canAdd;
    return (
      <div
        key={def.key}
        style={styles.cardWithMeta}
        onMouseEnter={() => setHoveredCardPreview({ card: def.def, finish: def.finish })}
        onMouseLeave={() => setHoveredCardPreview(null)}
        onContextMenu={event => pinCardPreview(event, def.def, def.finish)}
      >
        <CollectionCardTile
          card={def.def}
          owned={owned}
          className={getLiveCardShimmerClassName(def.def, def.finish, 'front')}
          surfaceStyle={{
            ...getLiveCardFaceBackgroundStyle(def.def, def.finish, 'front'),
            ...(count > 0 ? styles.cardAdded : {}),
            ...(isFull ? styles.cardFull : {}),
          }}
          border={count > 0 ? '1px solid rgba(110,200,245,0.90)' : '1px solid rgba(72,128,190,0.32)'}
          onClick={() => { setHoveredCardPreview({ card: def.def, finish: def.finish }); addCard(def.def.definitionId, def.finish); }}
          finishLabel={finishLabel === 'Holofoil' ? 'Holofoil' : null}
          footerRight={`×${owned} owned`}
          cornerOverlay={count > 0 ? <div style={{ ...styles.badge, zIndex: 2 }}>{count}</div> : undefined}
        />
        <div style={styles.ownedLabelBelow}>owns {owned}</div>
        <div style={styles.copyCountRow} onClick={event => event.stopPropagation()} aria-label={`${totalForDefinition} copies in deck`}>
          <button type="button" aria-label={`Remove ${def.def.name} from deck`} title="Remove one copy from this deck" style={{ ...styles.copyCountBtn, ...(totalForDefinition > 0 ? {} : styles.copyCountBtnDisabled) }} disabled={totalForDefinition === 0} onClick={() => {
            const entryToRemove = deckList.find(entry => entry.definitionId === def.def.definitionId && entry.finish === def.finish)
              ?? deckList.find(entry => entry.definitionId === def.def.definitionId);
            if (entryToRemove) removeCard(entryToRemove.definitionId, entryToRemove.finish);
            else {
              const extraEntry = extraDeckList.find(entry => entry.definitionId === def.def.definitionId && entry.finish === def.finish)
                ?? extraDeckList.find(entry => entry.definitionId === def.def.definitionId);
              if (extraEntry) removeCard(extraEntry.definitionId, extraEntry.finish);
            }
          }}>−</button>
          <span>{totalForDefinition}/4</span>
          <button type="button" aria-label={`Add ${def.def.name} to deck`} title="Add one copy to this deck (maximum 4)" style={{ ...styles.copyCountBtn, ...(canAdd ? {} : styles.copyCountBtnDisabled) }} disabled={!canAdd} onClick={() => addCard(def.def.definitionId, def.finish)}>+</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ui-panel-intro deck-builder-screen" style={styles.overlay}>
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
      <div className="ui-shimmer-band deck-builder-header" style={styles.header}>
        <div className="deck-builder-identity">
          <div className="ui-title-glow" style={styles.title}>Deck Builder</div>
          <div style={styles.deckNameChip}>
            The Deck Manuscript · {deckSetName} deck{activeDeck?.isStarter ? ' · Starter list' : ''}
          </div>
        </div>
        <nav className="deck-builder-workspace-tabs" aria-label="Deck builder sections">
          {([
            ['library', 'Card Library'],
            ['deck', 'Deck Composition'],
            ['abilities', 'Abilities'],
            ['analyze', 'Analyze'],
          ] as const).map(([id, label]) => (
            <button key={id} type="button" className="menu-tactile-btn" onClick={() => setSurface(id)} style={{
              padding: '7px 14px', border: '1px solid transparent', borderRadius: 999,
              background: surface === id ? 'var(--profile-surface-strong)' : 'transparent',
              color: surface === id ? 'var(--profile-accent)' : 'var(--profile-text-muted)',
              borderColor: surface === id ? 'var(--profile-border-strong)' : 'transparent',
              boxShadow: surface === id ? 'var(--profile-glow)' : 'none',
              fontFamily: 'Georgia, serif', fontSize: 10, fontWeight: 700, letterSpacing: 0.6,
              textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{label}</button>
          ))}
        </nav>
        <div className="deck-builder-metrics" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14, flexWrap: 'wrap', minWidth: 0 }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
            padding: '5px 12px', borderRadius: 8, background: 'var(--profile-surface)', border: '1px solid var(--profile-border)',
          }}>
            <div style={{ fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--profile-text-muted)' }}>
              Est. 3-Min Damage
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: 'var(--profile-accent-soft)', fontWeight: 700 }}>
              {liveDpsProjection.threeMinuteDamage.toLocaleString()} <span style={{ fontSize: 10, color: 'var(--profile-accent)', fontWeight: 400 }}>({liveDpsProjection.dps.toLocaleString()} DL/s)</span>
            </div>
          </div>
          <ProgressRing
            value={totalCards} max={MAIN_DECK_SIZE}
            color={totalCards === MAIN_DECK_SIZE ? '#80e860' : totalCards > MAIN_DECK_SIZE ? '#e06060' : '#58aada'}
            label="Main"
          />
          <ProgressRing value={extraDeckList.length} max={EXTRA_DECK_SIZE} color="#70c890" size={38} label="Extra" />
        </div>
      </div>

      {/* Element filter */}
      <div style={styles.filterBar}>
        <input
          value={cardSearch}
          onChange={event => setCardSearch(event.target.value)}
          placeholder="Search cards, effects, rarity, keywords..."
          aria-label="Search cards"
          style={{ flex: '1 1 260px', minWidth: 220, maxWidth: 390, height: 28, boxSizing: 'border-box', padding: '0 10px', borderRadius: 7, border: '1px solid var(--profile-border-strong)', background: 'var(--profile-surface)', color: 'var(--profile-text)', fontFamily: 'Georgia, serif', fontSize: 11, outline: 'none' }}
        />
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
                color: 'var(--profile-accent)',
                borderColor: 'var(--profile-border-strong)',
                background: 'var(--profile-surface-strong)',
              } : {}),
            }}
            onClick={() => setElementFilter(el === elementFilter ? null : el)}
          >
            {elementFilter === el && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: el === 'Causality' ? '#d66a52' : SET_ACCENT, display: 'inline-block', flexShrink: 0 }} />
            )}
            {el}
          </button>
        ))}
        <span style={{ color: 'var(--profile-text-muted)', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', marginLeft: 8 }}>Spectrum</span>
        {[null, 0, 1, 2, 3, 4, 5].map(level => (
          <button className="menu-tactile-btn"
            key={level ?? 'all'}
            style={{ ...styles.filterBtn, ...(levelFilter === level ? styles.filterBtnActive : {}) }}
            onClick={() => setLevelFilter(level)}
            title={level === null ? 'Show all Spectrum Levels' : `Show only Spectrum Lv ${level} cards`}
          >
            {level === null ? 'Any Lv' : `Lv ${level}`}
          </button>
        ))}
      </div>

      <div className="deck-builder-main">
        <aside className="deck-builder-left-rail" aria-label="Deck status and controls">
          <section style={{ padding: 10, borderRadius: 7, background: 'rgba(34,27,40,0.82)', border: '1px solid rgba(168,132,83,0.2)' }}>
            {!validation.valid ? (
              <div style={{ ...styles.validationBanner, color: '#e07060' }}><span>✕</span>{validation.errors[0]}</div>
            ) : (
              <div style={{ ...styles.validationBanner, color: '#77d7c7', textShadow: '0 0 14px rgba(80, 220, 192, 0.22)' }}>
                <span>✓</span>Deck valid · {totalCards} cards
              </div>
            )}
            {totalCards > 0 && deckStats.levelCounts[0] === 0 && (
              <div style={{ ...styles.validationBanner, color: '#e8c060', marginTop: 4 }}>
                <span>!</span>No Spectrum Lv 0 cards; first turn may have no playable cards.
              </div>
            )}
          </section>

          <section className="deck-builder-actions" aria-label="Deck actions">
            <div style={{ position: 'relative', gridColumn: '1 / -1' }}>
              <button className="menu-tactile-btn" style={styles.toolbarBtn} onClick={() => setLoadMenuOpen(v => !v)}>
                Load saved deck ▾
              </button>
              {loadMenuOpen && (
                <div style={styles.loadDropdownPanel} onMouseLeave={() => setLoadMenuOpen(false)}>
                  {savedDecks.map(sd => {
                    const projection = calculateDeckDpsProjection(sd.deckList, sd.extraDeck ?? [], sd.abilityLoadout, collectionPower);
                    return (
                      <div key={sd.id} style={{ ...styles.loadDeckRow, ...(sd.id === activeDeckId ? { background: 'rgba(58,142,200,0.14)' } : {}) }}>
                        <div style={{ flex: 1, fontSize: 11, color: 'rgba(232,222,237,0.82)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={() => handleLoadSaved(sd.id)}>
                          <span>{sd.isStarter ? '🔒 ' : ''}{sd.name}</span>
                          <span style={{ marginLeft: 6, fontSize: 9.5, color: '#f7c04a' }}>~{formatNumber(projection.threeMinuteDamage)} (3m)</span>
                        </div>
                        {!sd.isStarter && <button className="menu-tactile-btn" style={{ ...styles.toolbarBtn, ...styles.toolbarBtnDanger, padding: '3px 8px', fontSize: 10 }} onClick={() => { if (window.confirm(`Delete deck "${sd.name}"? This cannot be undone.`)) deleteSavedDeck(sd.id); }}>Delete</button>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {saveMode ? (
              <>
                <input style={{ ...styles.nameInput, gridColumn: '1 / -1', width: '100%' }} placeholder="Deck name…" value={newDeckName} onChange={event => setNewDeckName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') handleSaveNew(); if (event.key === 'Escape') setSaveMode(false); }} autoFocus />
                <button className="menu-tactile-btn" style={{ ...styles.toolbarBtn, ...(validation.valid && newDeckName.trim() ? {} : styles.toolbarBtnDisabled) }} onClick={handleSaveNew}>Save</button>
                <button className="menu-tactile-btn" style={{ ...styles.toolbarBtn, ...styles.toolbarBtnDanger }} onClick={() => { setSaveMode(false); setNewDeckName(''); }}>Cancel</button>
              </>
            ) : (
              <button className="menu-tactile-btn" style={{ ...styles.toolbarBtn, ...(validation.valid ? {} : styles.toolbarBtnDisabled) }} onClick={() => validation.valid && setSaveMode(true)}>Save as</button>
            )}
            {!isEditingStarter && activeDeckId && <button className="menu-tactile-btn" style={{ ...styles.toolbarBtn, ...(validation.valid ? {} : styles.toolbarBtnDisabled) }} onClick={handleUpdateCurrent}>Update</button>}
            <button className="menu-tactile-btn" style={{ ...styles.toolbarBtn, ...(totalCards < MAIN_DECK_SIZE ? {} : styles.toolbarBtnDisabled) }} onClick={handleFillWithBest} disabled={totalCards >= MAIN_DECK_SIZE} title="Top up the deck with your highest-rarity owned cards.">Fill best</button>
            <button className="menu-tactile-btn" style={{ ...styles.toolbarBtn, ...styles.toolbarBtnDanger, gridColumn: '1 / -1', ...((deckList.length > 0 || extraDeckList.length > 0) ? {} : styles.toolbarBtnDisabled) }} onClick={handleClearDeck} disabled={deckList.length === 0 && extraDeckList.length === 0}>Clear deck</button>
          </section>

          <section aria-label="Spectrum curve" style={{ padding: '10px 10px 8px', borderRadius: 8, background: 'rgba(10,8,16,0.7)', border: '1px solid rgba(168,132,83,0.3)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.6, color: warmTheme.accent, textTransform: 'uppercase' }}>Spectrum curve</div>
            <div style={{ marginTop: 4, fontSize: 9, color: warmTheme.textMuted, fontStyle: 'italic' }}>Main deck cards by level</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: 8, color: warmTheme.textMuted }}>
              <span><i style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 2, background: warmTheme.accent, marginRight: 4 }} />Light</span>
              <span><i style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 2, background: warmTheme.accentSoft, marginRight: 4 }} />Dark</span>
            </div>
            <div className="deck-builder-spectrum-row">
              {deckStats.levelCounts.map((_, level) => {
                const lightCount = deckStats.lightLevelCounts[level];
                const darkCount = deckStats.darkLevelCounts[level];
                return (
                  <div key={level} title={`Spectrum Lv ${level}: ${lightCount} Light, ${darkCount} Dark`} style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                    <span style={{ display: 'flex', justifyContent: 'center', gap: 2, height: 8, fontSize: 6.5, color: warmTheme.textSoft }}><span>{lightCount || ''}</span><span>{darkCount || ''}</span></span>
                    <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', gap: 2, height: 31 }}>
                      <div style={{ flex: 1, height: lightCount ? `${Math.max(3, lightCount / spectrumPeak * 30)}px` : 2, borderRadius: '2px 2px 0 0', background: lightCount ? warmTheme.accent : `color-mix(in srgb, ${warmTheme.accent} 15%, transparent)` }} />
                      <div style={{ flex: 1, height: darkCount ? `${Math.max(3, darkCount / spectrumPeak * 30)}px` : 2, borderRadius: '2px 2px 0 0', background: darkCount ? warmTheme.accentSoft : `color-mix(in srgb, ${warmTheme.accentSoft} 15%, transparent)` }} />
                    </div>
                    <span style={{ fontSize: 7.5, color: warmTheme.textMuted }}>Lv {level}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        <main ref={bodyRef} className="deck-builder-workspace" aria-label={surface === 'library' ? 'Card library' : surface === 'deck' ? 'Deck composition' : surface === 'abilities' ? 'Abilities' : 'Deck analysis'}>
        {/* Pool pane */}
        <div style={{ ...styles.poolPane, display: surface === 'library' ? 'flex' : 'none', flex: isNarrow ? '1 1 55%' : styles.poolPane.flex }}>
          <div style={{ ...styles.cardPool, gap: 24 }}>
            {angelSection.length > 0 && (
              <section>
                <div style={{ ...styles.sectionHeader, marginBottom: 10 }}>
                  <div style={{ width: 4, height: 20, borderRadius: 2, background: getSectionColors()['Ain Soph Aur'], boxShadow: `0 0 8px ${getSectionColors()['Ain Soph Aur']}50`, flexShrink: 0 }} />
                  <span style={{ ...styles.sectionLabel, color: getSectionColors()['Ain Soph Aur'] }}>Ain Soph Aur (adds to Extra Deck)</span>
                  <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${getSectionColors()['Ain Soph Aur']}45, transparent)`, marginLeft: 4 }} />
                  <span style={styles.sectionCount}>{extraDeckList.length} / {EXTRA_DECK_SIZE} selected</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, ${CARD_LIBRARY_CARD_WIDTH}px)`, gap: '16px 10px', alignItems: 'start' }}>
                  {angelSection.map(entry => renderPoolCard(entry, 'Ain Soph Aur'))}
                </div>
              </section>
            )}
            {mainSections.map(section => {
              const accent = getSectionColors()[section.label];
              return (
                <section key={section.label}>
                  <div style={{ ...styles.sectionHeader, marginBottom: 10 }}>
                    <div style={{ width: 4, height: 20, borderRadius: 2, background: accent, boxShadow: `0 0 8px ${accent}50`, flexShrink: 0 }} />
                    <span style={{ ...styles.sectionLabel, color: accent }}>{section.label}</span>
                    <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${accent}45, transparent)`, marginLeft: 4 }} />
                    <span style={styles.sectionCount}>{section.cards.length} card{section.cards.length === 1 ? '' : 's'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, ${CARD_LIBRARY_CARD_WIDTH}px)`, gap: '16px 10px', alignItems: 'start' }}>
                    {section.cards.map(entry => renderPoolCard(entry, section.label))}
                  </div>
                </section>
              );
            })}
            {angelSection.length === 0 && mainSections.length === 0 && (
              <div style={styles.empty}>{`No${elementFilter ? ` ${elementFilter}` : ''} cards in your collection yet.`}</div>
            )}
          </div>
        </div>

        {/* Deck pane */}
        <div style={{ ...styles.deckPane, display: surface === 'library' ? 'none' : 'flex', flex: surface === 'deck' ? '1 1 auto' : '1 1 auto', minWidth: isNarrow ? 0 : 380 }}>
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
                  <div key={entry.key} onMouseEnter={() => setHoveredCardPreview({ card: def, finish: entry.finish })} onMouseLeave={() => setHoveredCardPreview(null)} onContextMenu={event => pinCardPreview(event, def, entry.finish)}>
                    <CollectionCardTile
                      card={def}
                      owned={collection[entry.definitionId] ?? entry.copies}
                      className={getLiveCardShimmerClassName(def, entry.finish, 'front')}
                      surfaceStyle={{ ...styles.extraStripCard, ...getLiveCardFaceBackgroundStyle(def, entry.finish, 'front') }}
                      border={`1px solid ${warmTheme.borderStrong}`}
                      title={`${def.name} ×${entry.copies} — click to remove one`}
                      onClick={() => removeCard(entry.definitionId, entry.finish)}
                      finishLabel={getFinishLabel(def, entry.finish) === 'Holofoil' ? 'Holofoil' : null}
                      footerRight={`×${entry.copies} selected`}
                      cornerOverlay={entry.copies > 1 ? (
                        <div style={{ position: 'absolute', zIndex: 2, bottom: 7, right: 6, fontSize: 9, fontWeight: 'bold', color: warmTheme.accentDeep, background: warmTheme.button, borderRadius: '50%', width: 21, height: 21, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{entry.copies}</div>
                      ) : undefined}
                    />
                  </div>
                );
              })}
              {extraDeckList.length === 0 && (
                <div style={styles.extraStripEmptySlot}>+</div>
              )}
            </div>
          </div>

          {/* Sub-tabs: Cards · Abilities · Analyze */}
          {surface === 'abilities' ? (
            <DeckBuilderAbilitiesTab
              deckList={deckList}
              extraDeckList={extraDeckList}
              activeDeck={activeDeck}
              ownedAbilities={ownedAbilities}
              setDeckAbilityLoadout={setDeckAbilityLoadout}
            />
          ) : surface === 'analyze' ? (
            <DeckBuilderAnalyzeTab
              deckList={deckList}
              extraDeckList={extraDeckList}
              totalCards={totalCards}
              deckStats={deckStats}
              deckId={activeDeckId ?? null}
              currentNotes={activeDeck?.notes ?? ''}
              setDeckNotes={setDeckNotes}
              dpsProjection={liveDpsProjection}
            />
          ) : surface === 'deck' ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
              {deckList.length === 0 && (
                <div style={{ fontSize: 12, color: warmTheme.textMuted, textAlign: 'center', marginTop: 16 }}>
                  Click cards in the pool to add them.
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '4px 2px 12px', color: warmTheme.accent, fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>
                Main Deck <span style={{ color: warmTheme.accentSoft }}>{totalCards}</span>
              </div>
              {(['Light', 'Dark'] as const).map(type => {
                const entries = mainDeckEntriesByType[type];
                if (entries.length === 0) return null;
                const accent = type === 'Light' ? warmTheme.accent : warmTheme.accentSoft;
                return (
                  <section key={type} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, paddingBottom: 4, borderBottom: `1px solid ${accent}44`, color: accent, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase' }}>
                      <span>{type}</span>
                      <span style={{ marginLeft: 'auto', color: warmTheme.textMuted, fontSize: 9 }}>{entries.reduce((sum, entry) => sum + entry.copies, 0)} cards</span>
                    </div>
                    {entries.map(entry => {
                      const def = CardRegistry.get(entry.definitionId);
                      if (!def) return null;
                      const owned = getOwnedCopiesForFinish(def, entry.finish, collection, holoCollection);
                      const totalForDefinition = deckDefinitionCountMap.get(entry.definitionId) ?? 0;
                      const cap = Math.min(4, collection[entry.definitionId] ?? 0);
                      const rarityColorMain = RARITY_COLORS_DB[def.rarity] ?? 'rgba(200,155,72,0.5)';
                      return (
                        <div key={getVariantKey(entry.definitionId, entry.finish)} style={styles.entryRow} onMouseEnter={() => setHoveredCardPreview({ card: def, finish: entry.finish })} onMouseLeave={() => setHoveredCardPreview(null)} onContextMenu={event => pinCardPreview(event, def, entry.finish)}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: rarityColorMain, boxShadow: `0 0 4px ${rarityColorMain}70` }} />
                          <div style={{ ...styles.entryName, cursor: 'pointer' }}>
                            <div>{def.name}{entry.finish === 'holo' ? ' ✦' : ''}</div>
                            <div style={{ fontSize: 9, color: warmTheme.textMuted, fontWeight: 400 }}>Spectrum Lv {getCardSpectrumLevel(def)} · {type}</div>
                          </div>
                          <button className="menu-tactile-btn" style={styles.entryBtn} onClick={event => { event.stopPropagation(); removeCard(entry.definitionId, entry.finish); }}>−</button>
                          <div style={styles.entryCount}>×{entry.copies}</div>
                          <button className="menu-tactile-btn" disabled={entry.copies >= owned || totalForDefinition >= cap} style={{ ...styles.entryBtn, ...(entry.copies >= owned || totalForDefinition >= cap ? styles.copyCountBtnDisabled : {}) }} onClick={event => { event.stopPropagation(); addCard(entry.definitionId, entry.finish); }}>+</button>
                        </div>
                      );
                    })}
                  </section>
                );
              })}
            </div>
          ) : null}
        </div>
        </main>

        <aside className="deck-builder-inspector" aria-label="Card preview">
          {resolvedPreview ? (
            <>
              <div className="deck-builder-inspector-art">
                <div className={`deck-builder-inspector-card ${getLiveCardShimmerClassName(resolvedPreview.card, resolvedPreview.finish, 'front')}`} style={getLiveCardFaceBackgroundStyle(resolvedPreview.card, resolvedPreview.finish, 'front')} role="img" aria-label={`${resolvedPreview.card.name} card art`} />
              </div>
              <div className="deck-builder-inspector-content">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{ margin: '0 0 4px', color: warmTheme.accent, fontSize: 16, lineHeight: 1.2, textTransform: 'uppercase' }}>{resolvedPreview.card.name}</h2>
                    <div style={{ color: warmTheme.textMuted, fontSize: 11, fontStyle: 'italic' }}>
                      {getDisplayCardTypeLabel(resolvedPreview.card.type)} · {getCardSet(resolvedPreview.card.definitionId)}
                    </div>
                  </div>
                  <span aria-live="polite" style={{ flexShrink: 0, maxWidth: 138, color: previewIsPinned ? warmTheme.success : warmTheme.textMuted, fontSize: 10, lineHeight: 1.35, textAlign: 'right' }}>
                    {previewIsPinned ? 'Pinned!' : 'Right-click a card to pin its stats here'}
                  </span>
                </div>
                <div style={{ marginTop: 10, marginBottom: 8, color: RARITY_COLORS_DB[resolvedPreview.card.rarity] ?? '#b9b1c1', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
                  {resolvedPreview.card.rarity} · Spectrum Lv {getCardSpectrumLevel(resolvedPreview.card)}
                </div>
                <CardRulesDigest card={resolvedPreview.card} variant="detail" labelColor={warmTheme.textMuted} textColor={warmTheme.text} sectionBackground={warmTheme.surfaceMuted} sectionBorder={warmTheme.border} />
              </div>
            </>
          ) : (
            <div style={{ display: 'grid', placeItems: 'center', flex: 1, color: warmTheme.textMuted, fontSize: 12, fontStyle: 'italic' }}>No card selected</div>
          )}
        </aside>
      </div>

      <div style={styles.footer}>
        <div style={{ fontSize: 11, color: warmTheme.textMuted }}>
          {activeDeck?.notes && activeDeck.notes.trim().length > 0 && surface !== 'analyze' && (
            <button
              className="menu-tactile-btn"
              onClick={() => setSurface('analyze')}
              style={{ background: 'transparent', border: 'none', color: warmTheme.textSoft, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 11 }}
            >
              📝 This deck has notes — view in Analyze
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="menu-tactile-btn" style={styles.closeBtn} onClick={onClose}>Close</button>
          <button className={`menu-tactile-btn${validation.valid ? ' deck-play-btn-ready' : ''}`}
            disabled={!validation.valid}
            style={{ ...styles.startBtn, borderStyle: validation.valid ? 'solid' : 'dashed', cursor: validation.valid ? 'pointer' : 'not-allowed' }}
            onClick={validation.valid ? handleStart : undefined}
          >
            <span className="ui-button-title ui-button-title-on-light">Reshuffle &amp; Play</span>
          </button>
        </div>
      </div>

    </div>
  );
}
