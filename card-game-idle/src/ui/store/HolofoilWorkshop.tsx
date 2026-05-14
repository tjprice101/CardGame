import { useEffect, useMemo, useState } from 'react';
import { CardRegistry } from '@/cards/CardRegistry';
import { ELEMENT_COLORS, ELEMENT_SET_NAMES, getCardCategoryKey } from '@/data/elements';
import { canConvertCardToHolo, getCardFinishLabel, getHolofoilConversionCost, getHoloOwnedCopies, getNormalOwnedCopies } from '@/systems/progression/HolofoilSystem';
import { useStore } from '@/state/store';
import {
  cardFacePalette,
  getCardFaceBackgroundStyle,
  getCardFaceMetrics,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';
import { warmTheme } from '@/ui/theme';

const faceMetrics = getCardFaceMetrics('grid');

const RARITY_ORDER: Record<string, number> = {
  Common: 0,
  Rare: 1,
  Epic: 2,
  Legendary: 3,
  Eternal: 4,
};

type SortMode = 'set' | 'name' | 'rarity' | 'cost-asc' | 'cost-desc' | 'normal-owned';

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
  intro: {
    padding: '0 24px 16px',
    color: 'rgba(234, 217, 192, 0.84)',
    fontSize: 12,
    lineHeight: 1.6,
  },
  filterBar: {
    display: 'flex',
    gap: 6,
    padding: '0 24px 16px',
    flexWrap: 'wrap',
  },
  controlsRow: {
    display: 'flex',
    gap: 8,
    padding: '0 24px 14px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterBtn: {
    padding: '5px 14px',
    borderRadius: 20,
    border: `1px solid ${warmTheme.border}`,
    background: 'rgba(255, 236, 209, 0.9)',
    color: '#5f3a17',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
    letterSpacing: 1,
  },
  select: {
    borderRadius: 8,
    border: `1px solid ${warmTheme.border}`,
    background: 'rgba(255, 238, 214, 0.94)',
    color: '#553719',
    fontFamily: 'Georgia, serif',
    fontSize: 11,
    padding: '6px 8px',
  },
  statusPill: {
    marginLeft: 'auto',
    padding: '6px 10px',
    borderRadius: 999,
    border: `1px solid ${warmTheme.borderStrong}`,
    background: 'rgba(255, 215, 0, 0.1)',
    color: '#f3c687',
    fontSize: 11,
    letterSpacing: 0.6,
  },
  successBanner: {
    margin: '0 24px 14px',
    padding: '8px 12px',
    borderRadius: 10,
    border: `1px solid ${warmTheme.success}`,
    background: 'rgba(74, 168, 111, 0.12)',
    color: warmTheme.success,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 24px 24px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    alignContent: 'flex-start',
  },
  empty: {
    width: '100%',
    textAlign: 'center',
    padding: '56px 12px',
    color: 'rgba(234, 217, 192, 0.75)',
    fontStyle: 'italic',
  },
  card: {
    width: 156,
    minHeight: 252,
    borderRadius: 14,
    overflow: 'hidden',
    border: `1px solid ${warmTheme.borderStrong}`,
    display: 'flex',
    flexDirection: 'column',
    background: warmTheme.surfaceStrong,
    boxShadow: warmTheme.shadow,
  },
  desc: {
    color: cardFacePalette.textSoft,
    textAlign: 'center',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  countRow: {
    marginTop: 6,
    fontSize: 8,
    letterSpacing: 0.8,
    color: cardFacePalette.textMuted,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 6,
  },
  convertBtn: {
    marginTop: 8,
    width: '100%',
    padding: '7px 8px',
    borderRadius: 8,
    border: `1px solid ${warmTheme.borderStrong}`,
    background: warmTheme.button,
    color: warmTheme.accentDeep,
    fontSize: 10,
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
    letterSpacing: 0.9,
  },
};

export default function HolofoilWorkshop() {
  const collection = useStore(s => s.progress.collection);
  const holoCollection = useStore(s => s.progress.holoCollection);
  const shards = useStore(s => s.progress.aberratedShards);
  const convertCardToHolo = useStore(s => s.convertCardToHolo);
  const [activeElement, setActiveElement] = useState<string>('All');
  const [activeRarity, setActiveRarity] = useState<string>('All');
  const [sortMode, setSortMode] = useState<SortMode>('set');
  const [affordableOnly, setAffordableOnly] = useState(false);
  const [multiCopyOnly, setMultiCopyOnly] = useState(false);
  const [lastConverted, setLastConverted] = useState<string | null>(null);

  const cards = useMemo(() => {
    return CardRegistry.getAll()
      .filter(def => canConvertCardToHolo(def, collection, holoCollection))
      .sort((a, b) => {
        const categoryA = getCardCategoryKey(a);
        const categoryB = getCardCategoryKey(b);
        if (categoryA !== categoryB) return categoryA.localeCompare(categoryB);
        const rarityDelta = (RARITY_ORDER[a.rarity] ?? 0) - (RARITY_ORDER[b.rarity] ?? 0);
        if (rarityDelta !== 0) return rarityDelta;
        return a.name.localeCompare(b.name);
      });
  }, [collection, holoCollection]);

  const rarityFilters = useMemo(
    () => ['All', ...Array.from(new Set(cards.map(card => card.type === 'Angel' ? 'Angel' : card.rarity)))],
    [cards],
  );

  const elements = useMemo(
    () => ['All', ...Array.from(new Set(cards.map(card => getCardCategoryKey(card))))],
    [cards],
  );

  const filtered = useMemo(() => {
    const byElement = activeElement === 'All'
      ? cards
      : cards.filter(card => getCardCategoryKey(card) === activeElement);
    const byRarity = activeRarity === 'All'
      ? byElement
      : byElement.filter(card => (card.type === 'Angel' ? 'Angel' : card.rarity) === activeRarity);
    const byAffordable = affordableOnly
      ? byRarity.filter(card => shards >= (getHolofoilConversionCost(card) ?? Number.MAX_SAFE_INTEGER))
      : byRarity;
    const byCopies = multiCopyOnly
      ? byAffordable.filter(card => getNormalOwnedCopies(card, collection, holoCollection) >= 2)
      : byAffordable;

    const sorted = [...byCopies];
    sorted.sort((a, b) => {
      const costA = getHolofoilConversionCost(a) ?? Number.MAX_SAFE_INTEGER;
      const costB = getHolofoilConversionCost(b) ?? Number.MAX_SAFE_INTEGER;
      if (sortMode === 'name') return a.name.localeCompare(b.name);
      if (sortMode === 'rarity') {
        const delta = (RARITY_ORDER[a.rarity] ?? 0) - (RARITY_ORDER[b.rarity] ?? 0);
        if (delta !== 0) return delta;
        return a.name.localeCompare(b.name);
      }
      if (sortMode === 'cost-asc') {
        if (costA !== costB) return costA - costB;
        return a.name.localeCompare(b.name);
      }
      if (sortMode === 'cost-desc') {
        if (costA !== costB) return costB - costA;
        return a.name.localeCompare(b.name);
      }
      if (sortMode === 'normal-owned') {
        const ownedA = getNormalOwnedCopies(a, collection, holoCollection);
        const ownedB = getNormalOwnedCopies(b, collection, holoCollection);
        if (ownedA !== ownedB) return ownedB - ownedA;
        return a.name.localeCompare(b.name);
      }

      const categoryA = getCardCategoryKey(a);
      const categoryB = getCardCategoryKey(b);
      if (categoryA !== categoryB) return categoryA.localeCompare(categoryB);
      const rarityDelta = (RARITY_ORDER[a.rarity] ?? 0) - (RARITY_ORDER[b.rarity] ?? 0);
      if (rarityDelta !== 0) return rarityDelta;
      return a.name.localeCompare(b.name);
    });

    return sorted;
  }, [activeElement, activeRarity, affordableOnly, cards, collection, holoCollection, multiCopyOnly, shards, sortMode]);

  const handleConvert = (definitionId: string, cardName: string): void => {
    const didConvert = convertCardToHolo(definitionId);
    if (didConvert) {
      setLastConverted(`${cardName} converted to holofoil.`);
    }
  };

  useEffect(() => {
    if (!lastConverted) return;
    const timeoutId = window.setTimeout(() => setLastConverted(null), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [lastConverted]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.intro}>
        Spend Aberrated Shards to permanently convert one owned normal copy into a holofoil copy.
        Holofoils are purely cosmetic, but they are tracked separately in your collection and deck building.
      </div>

      <div style={styles.filterBar}>
        {elements.map(element => {
          const isActive = activeElement === element;
          const color = element === 'All' ? warmTheme.accentDeep : (ELEMENT_COLORS[element] ?? warmTheme.textMuted);
          return (
            <button
              key={element}
              style={{
                ...styles.filterBtn,
                color: isActive ? color : warmTheme.textMuted,
                borderColor: isActive ? color : warmTheme.border,
                background: isActive ? 'rgba(255,215,0,0.08)' : warmTheme.surface,
              }}
              onClick={() => setActiveElement(element)}
            >
              {element === 'All' ? 'All' : (ELEMENT_SET_NAMES[element] ?? element)}
            </button>
          );
        })}
      </div>

      <div style={styles.controlsRow}>
        <select
          style={styles.select}
          value={sortMode}
          onChange={(event) => setSortMode(event.target.value as SortMode)}
        >
          <option value="set">Sort: Set Order</option>
          <option value="name">Sort: Name</option>
          <option value="rarity">Sort: Rarity</option>
          <option value="cost-asc">Sort: Cost Low to High</option>
          <option value="cost-desc">Sort: Cost High to Low</option>
          <option value="normal-owned">Sort: Most Normal Copies</option>
        </select>

        <select
          style={styles.select}
          value={activeRarity}
          onChange={(event) => setActiveRarity(event.target.value)}
        >
          {rarityFilters.map(rarity => (
            <option key={rarity} value={rarity}>Filter: {rarity}</option>
          ))}
        </select>

        <button
          style={{
            ...styles.filterBtn,
            borderColor: affordableOnly ? warmTheme.borderStrong : warmTheme.border,
            color: affordableOnly ? '#5d3816' : '#5f3a17',
            background: affordableOnly ? 'rgba(255, 217, 154, 0.98)' : 'rgba(255, 236, 209, 0.9)',
          }}
          onClick={() => setAffordableOnly(prev => !prev)}
        >
          Affordable Only
        </button>

        <button
          style={{
            ...styles.filterBtn,
            borderColor: multiCopyOnly ? warmTheme.borderStrong : warmTheme.border,
            color: multiCopyOnly ? '#5d3816' : '#5f3a17',
            background: multiCopyOnly ? 'rgba(255, 217, 154, 0.98)' : 'rgba(255, 236, 209, 0.9)',
          }}
          onClick={() => setMultiCopyOnly(prev => !prev)}
        >
          Bulk Preview (2+ Normal)
        </button>

        <div style={styles.statusPill}>
          {filtered.length} convertible cards
        </div>
      </div>

      {lastConverted && <div style={styles.successBanner}>{lastConverted}</div>}

      <div style={styles.body}>
        {filtered.length === 0 && (
          <div style={styles.empty}>
            No owned normal-finish cards are available for conversion in this filter.
          </div>
        )}

        {filtered.map(def => {
          const normalOwned = getNormalOwnedCopies(def, collection, holoCollection);
          const holoOwned = getHoloOwnedCopies(collection, holoCollection, def.definitionId);
          const cost = getHolofoilConversionCost(def) ?? 0;
          const canAfford = shards >= cost;

          return (
            <div
              key={def.definitionId}
              className={`holofoil-menu-card${def.rarity === 'Infinite' ? ' infinite-holo-bw-hover' : ''}`}
              style={{ ...styles.card, ...getCardFaceBackgroundStyle(def, 'holo') }}
            >
              <div style={getCardNameRibbonStyle('grid')}>
                <div style={{ fontSize: faceMetrics.typeSize, color: cardFacePalette.textMuted, letterSpacing: 1.3, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 }}>
                  {def.type} · {getCardFinishLabel('holo')}
                </div>
                <div style={{ fontSize: faceMetrics.nameSize, fontWeight: 'bold', color: cardFacePalette.text, textAlign: 'center', lineHeight: 1.25 }}>
                  {def.name}
                </div>
              </div>

              <div style={getCardRulesPanelStyle('grid')}>
                <div style={{ ...styles.desc, fontSize: faceMetrics.descSize, lineHeight: faceMetrics.descLineHeight, WebkitLineClamp: faceMetrics.descLines }}>
                  {def.description}
                </div>
                <div style={styles.countRow}>
                  <span>Normal: {normalOwned}</span>
                  <span>Holo: {holoOwned}</span>
                </div>
                <div style={styles.countRow}>
                  <span>{def.rarity}</span>
                  <span>{cost} shards</span>
                </div>
                <button
                  style={{
                    ...styles.convertBtn,
                    opacity: canAfford ? 1 : 0.4,
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                  }}
                  onClick={() => canAfford && handleConvert(def.definitionId, def.name)}
                  disabled={!canAfford}
                >
                  {canAfford ? 'Convert 1 Copy to Holofoil' : `Need ${cost - shards} More Shards`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
