import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { CardDefinition } from '@/types/cards';
import { useStore } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { infiniteCards as legacyInfiniteCards } from '@/data/cards/infiniteCards';
import type { LegacyCosmeticCard } from '@/data/cards/eternalCards';
import { PACK_DEFINITIONS, STORE_PACK_ORDER } from '@/data/packs/packDefinitions';
import { getCardFinishKey, isHoloOnlyCard } from '@/systems/progression/HolofoilSystem';
import {
  getLiveCardFaceBackgroundStyle,
  getLiveCardShimmerClassName,
  getCardBackBackgroundStyle,
} from '@/ui/cardBackgrounds';
import { getCardPreviewLines } from '@/ui/cardStatSummary';
import { CARD_COLLECTION_TILE_HEIGHT, CARD_COLLECTION_TILE_STEP, CARD_COLLECTION_TILE_WIDTH } from '@/ui/cardTileMetrics';
import { uiTypography, warmTheme } from '@/ui/theme';
import { useThemeVersion } from '@/ui/useThemeVersion';
import './CollectionViewer.css';
import VirtualizedList from '@/ui/components/VirtualizedList';
import { getEverCollectionCount, getEverHoloCount, getEverInfiniteCount } from '@/systems/progression/ownershipHistory';
import CollectionCardDetail from './CollectionCardDetail';

const RARITY_COLORS: Record<string, string> = {
  Common: '#888', Rare: '#5b9bd5', Epic: '#9b59b6', Legendary: '#f39c12', Eternal: '#ff6b6b', Infinite: '#e8e8f0', Enigmatic: '#b76cff', Transcendent: '#f2b24f',
};

const RARITY_ORDER: Record<string, number> = {
  Common: 0, Rare: 1, Epic: 2, Legendary: 3, Enigmatic: 4, Transcendent: 5, Eternal: 6, Infinite: 7,
};

function getCardSet(definitionId: string): 'Neutrality' | 'Causality' {
  // Only Causality cards are explicitly namespaced; every other card (including
  // Eternal/Infinite/Transcendent/Enigma ids that don't literally contain
  // "neutral", e.g. `btei-axiom-of-oblivion`) belongs to Neutrality.
  return definitionId.includes('causality') ? 'Causality' : 'Neutrality';
}

const PACK_BY_ID = new Map(PACK_DEFINITIONS.map(pack => [pack.id, pack] as const));
const STORE_COLLECTION_SET_ORDER = STORE_PACK_ORDER.map(packId => {
  const pack = PACK_BY_ID.get(packId);
  return pack?.setId ?? 'Neutrality';
});

interface Props { onClose: () => void }

interface CollectionVariantEntry {
  key: string;
  finish: 'normal' | 'holo';
  owned: number;
  card: CardDefinition | LegacyCosmeticCard;
  legacyInfinite?: boolean;
}

interface SelectedCard {
  card: CardDefinition | LegacyCosmeticCard;
  finish: 'normal' | 'holo';
  owned: number;
}

interface CollectionVirtualRow {
  key: string;
  kind: 'cards' | 'heading' | 'subheading';
  height: number;
  label?: string;
  entries?: CollectionVariantEntry[];
}

export default function CollectionViewer({ onClose }: Props) {
  useThemeVersion();
  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null);
  const progress = useStore(s => s.progress);
  const favoriteCollection = useStore(s => s.progress.favoriteCollection);
  const recentlyAcquired = useStore(s => s.progress.recentlyAcquired);
  const lastCollectionViewedAt = useStore(s => s.progress.lastCollectionViewedAt ?? 0);
  const toggleFavoriteCard = useStore(s => s.toggleFavoriteCard);
  const markCollectionViewed = useStore(s => s.markCollectionViewed);
  const lastViewedSnapshotRef = useRef<number>(lastCollectionViewedAt);
  const gridViewportRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    // Snapshot the previous viewed-time once on mount so NEW badges remain visible
    // for this entire session and only clear next time the user opens the viewer.
    lastViewedSnapshotRef.current = lastCollectionViewedAt;
    markCollectionViewed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [gridViewportWidth, setGridViewportWidth] = useState(0);
  useEffect(() => {
    const node = gridViewportRef.current;
    if (!node) return;

    const updateWidth = () => setGridViewportWidth(Math.max(0, node.clientWidth - 48));
    updateWidth();

    const resizeObserver = new ResizeObserver(() => updateWidth());
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);
  const [activeElement, setActiveElement] = useState<string>('All');
  const [searchText, setSearchText] = useState('');
  const [ownedFilter, setOwnedFilter] = useState<'all' | 'owned' | 'missing'>('all');
  const [rarityFilter, setRarityFilter] = useState<string>('All');
  const [sortMode, setSortMode] = useState<'set' | 'rarity' | 'name' | 'recent'>('set');
  const categoryOrderRank = useMemo(
    () => new Map(STORE_COLLECTION_SET_ORDER.map((category, index) => [category, index] as const)),
    [],
  );
  const registryCards = useMemo(() => CardRegistry.getAll(), []);

  const allCards = useMemo(() => [
    ...registryCards.flatMap(card => {
      const variants: CollectionVariantEntry[] = [];
      const everCollectionOwned = card.rarity === 'Transcendent'
        ? (progress.transcendentCollection?.[card.definitionId] ?? 0)
        : getEverCollectionCount(progress, card.definitionId);
      const everInfiniteOwned = card.rarity === 'Infinite'
        ? getEverInfiniteCount(progress, card.definitionId)
        : 0;
      const everTotalOwned = Math.max(everCollectionOwned, everInfiniteOwned);
      // Legacy saves may only track Infinite ownership in infiniteCollection.
      const baseHoloOwned = getEverHoloCount(progress, card.definitionId);
      const everHoloOwned = Math.min(
        everTotalOwned,
        card.rarity === 'Infinite' ? Math.max(baseHoloOwned, everInfiniteOwned) : baseHoloOwned,
      );
      const everNormalOwned = isHoloOnlyCard(card) ? 0 : Math.max(0, everTotalOwned - everHoloOwned);
      if (!isHoloOnlyCard(card)) {
        variants.push({
          key: getCardFinishKey(card.definitionId, 'normal'),
          finish: 'normal',
          owned: everNormalOwned,
          card,
        });
      }
      variants.push({
        key: getCardFinishKey(card.definitionId, 'holo'),
        finish: 'holo',
        owned: everHoloOwned,
        card,
      });
      return variants;
    }),
    ...legacyInfiniteCards
      .filter(card => !registryCards.some(registered => registered.definitionId === card.definitionId))
      .map(card => {
        const everCollectionOwned = getEverCollectionCount(progress, card.definitionId);
        const everInfiniteOwned = getEverInfiniteCount(progress, card.definitionId);
        const owned = Math.max(everCollectionOwned, everInfiniteOwned);
        return {
          key: getCardFinishKey(card.definitionId, 'holo'),
          finish: 'holo' as const,
          owned,
          card,
          legacyInfinite: true,
        };
      }),
  ].sort((a, b) => {
    if (sortMode === 'rarity') {
      if (RARITY_ORDER[a.card.rarity] !== RARITY_ORDER[b.card.rarity]) {
        return RARITY_ORDER[b.card.rarity] - RARITY_ORDER[a.card.rarity];
      }
      return a.card.name.localeCompare(b.card.name);
    }
    if (sortMode === 'name') {
      if (a.card.name !== b.card.name) return a.card.name.localeCompare(b.card.name);
      return a.finish.localeCompare(b.finish);
    }
    if (sortMode === 'recent') {
      const ta = recentlyAcquired?.[a.card.definitionId] ?? 0;
      const tb = recentlyAcquired?.[b.card.definitionId] ?? 0;
      if (ta !== tb) return tb - ta;
      return a.card.name.localeCompare(b.card.name);
    }
    if (RARITY_ORDER[a.card.rarity] !== RARITY_ORDER[b.card.rarity]) {
      return RARITY_ORDER[a.card.rarity] - RARITY_ORDER[b.card.rarity];
    }
    if (a.card.name !== b.card.name) return a.card.name.localeCompare(b.card.name);
    return a.finish.localeCompare(b.finish);
  }), [categoryOrderRank, progress, recentlyAcquired, registryCards, sortMode]);

  const elements = useMemo(() => {
    const availableCategories = new Set(['Neutrality', 'Causality']);
    const orderedCategories = STORE_COLLECTION_SET_ORDER.filter(category => availableCategories.has(category));
    const orderedCategorySet = new Set(orderedCategories);
    const remainingCategories = Array.from(availableCategories)
      .filter(category => !orderedCategorySet.has(category))
      .sort((a, b) => a.localeCompare(b));
    return ['All', ...orderedCategories, ...remainingCategories];
  }, []);
  const lowerSearch = searchText.trim().toLowerCase();
  const filtered = useMemo(() => allCards.filter(entry => {
    if (activeElement !== 'All' && getCardSet(entry.card.definitionId) !== activeElement) return false;
    if (rarityFilter === 'Transcendent') {
      if (entry.card.rarity !== 'Transcendent') return false;
    } else if (rarityFilter !== 'All' && entry.card.rarity !== rarityFilter) {
      return false;
    }
    if (ownedFilter === 'owned' && entry.owned <= 0) return false;
    if (ownedFilter === 'missing' && entry.owned > 0) return false;
    if (lowerSearch) {
      const searchable = [
        entry.card.name,
        entry.card.definitionId,
        entry.legacyInfinite ? 'Archived Infinite' : ('type' in entry.card ? entry.card.type : ''),
        entry.card.rarity,
        getCardSet(entry.card.definitionId),
        entry.legacyInfinite ? '' : getCardPreviewLines(entry.card as CardDefinition, 8).join(' '),
      ].join(' ').toLowerCase();
      if (!searchable.includes(lowerSearch)) return false;
    }
    return true;
  }), [activeElement, allCards, lowerSearch, ownedFilter, rarityFilter]);

  const standardFiltered = useMemo(
    () => filtered.filter(entry => entry.card.rarity !== 'Infinite'),
    [filtered],
  );
  const infiniteSections = useMemo(() => elements.filter(setLabel => setLabel !== 'All')
    .map(setLabel => ({
      setLabel,
      entries: filtered.filter(entry => entry.card.rarity === 'Infinite' && getCardSet(entry.card.definitionId) === setLabel),
    }))
    .filter(section => section.entries.length > 0), [elements, filtered]);

  const totalOwned = useMemo(() => allCards.filter(card => card.owned > 0).length, [allCards]);
  const totalCards = allCards.length;
  const visibleOwned = useMemo(() => filtered.filter(card => card.owned > 0).length, [filtered]);
  const visibleTotal = filtered.length;
  const isFilteringActive = activeElement !== 'All' || rarityFilter !== 'All' || ownedFilter !== 'all' || lowerSearch.length > 0;
  const gridColumns = Math.max(1, Math.floor((gridViewportWidth + 10) / CARD_COLLECTION_TILE_STEP));

  const virtualRows = useMemo(() => {
    const rows: CollectionVirtualRow[] = [];
    const pushCardRows = (entries: CollectionVariantEntry[], prefix: string) => {
      for (let index = 0; index < entries.length; index += gridColumns) {
        rows.push({
          key: `${prefix}-${index}`,
          kind: 'cards',
          height: CARD_COLLECTION_TILE_HEIGHT + 10,
          entries: entries.slice(index, index + gridColumns),
        });
      }
    };

    if (sortMode !== 'set') {
      pushCardRows(filtered, 'all');
      return rows;
    }

    pushCardRows(standardFiltered, 'standard');

    if (infiniteSections.length > 0) {
      rows.push({
        key: 'infinite-heading',
        kind: 'heading',
        height: standardFiltered.length > 0 ? 46 : 28,
        label: 'Infinite Cards',
      });

      infiniteSections.forEach((section) => {
        rows.push({
          key: `${section.setLabel}-label`,
          kind: 'subheading',
          height: 28,
          label: section.setLabel,
        });
        pushCardRows(section.entries, `infinite-${section.setLabel}`);
      });
    }
    return rows;
  }, [filtered, gridColumns, infiniteSections, sortMode, standardFiltered]);

  const renderCardEntry = (entry: CollectionVariantEntry) => {
    const { card, finish, owned } = entry;
    const displayCard = card as CardDefinition;
    const rarityColor = RARITY_COLORS[card.rarity] ?? '#888';
    const acquiredAt = recentlyAcquired?.[card.definitionId] ?? 0;
    const isNew = owned > 0 && acquiredAt > lastViewedSnapshotRef.current;
    const isTranscendent = card.rarity === 'Transcendent';
    const isLockedStandardHolo = owned <= 0 && finish === 'holo'
      && card.rarity !== 'Infinite'
      && card.rarity !== 'Eternal'
      && card.rarity !== 'Transcendent'
      && card.rarity !== 'Enigmatic';
    const cardSurfaceStyle = owned > 0
      ? getLiveCardFaceBackgroundStyle(displayCard, finish, 'front')
      : (isLockedStandardHolo
        ? getLockedHoloCardBackStyle(displayCard)
        : getCardBackBackgroundStyle(displayCard, { dimmed: false }));
    const shimmerClassName = owned > 0 ? getLiveCardShimmerClassName(displayCard, finish, 'front') : undefined;

    return (
      <div
        key={entry.key}
        className={shimmerClassName}
        role="button"
        tabIndex={0}
        onKeyDown={event => {
          if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            setSelectedCard({ card, finish, owned });
          }
        }}
        onClick={() => setSelectedCard({ card, finish, owned })}
        style={{
          width: CARD_COLLECTION_TILE_WIDTH,
          ...cardSurfaceStyle,
          backgroundColor: warmTheme.surfaceStrong,
          border: owned > 0
            ? (isTranscendent ? '1px solid rgba(224, 174, 72, 0.86)' : `1px solid ${rarityColor}55`)
            : `1px solid ${warmTheme.border}`,
          borderRadius: 12,
          height: CARD_COLLECTION_TILE_HEIGHT,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          opacity: 1,
          transition: 'box-shadow 0.15s, outline-color 0.15s, filter 0.15s',
          overflow: 'hidden',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px rgba(${hexToRgb(rarityColor)}, 0.4), 0 0 12px rgba(${hexToRgb(rarityColor)}, 0.3)`;
          (e.currentTarget as HTMLElement).style.outline = `1px solid ${rarityColor}aa`;
          (e.currentTarget as HTMLElement).style.outlineOffset = '2px';
          (e.currentTarget as HTMLElement).style.filter = 'brightness(1.08)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          (e.currentTarget as HTMLElement).style.outline = '';
          (e.currentTarget as HTMLElement).style.filter = '';
        }}
        title={owned > 0 ? (entry.legacyInfinite ? 'Archived Infinite card · Not playable' : getCardPreviewLines(displayCard, 4).join('\n')) : 'Card not discovered'}
        aria-label={owned > 0 ? `${card.name}, ${card.rarity}` : 'Card not discovered'}
      >
        {isNew && (
          <div style={{
            position: 'absolute',
            top: 6,
            left: 6,
            zIndex: 3,
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1.2,
            background: 'linear-gradient(135deg, #ff6b35, #f7b733)',
            color: '#171009',
            boxShadow: '0 0 8px rgba(247, 183, 51, 0.6)',
            animation: 'newBadgePulse 1.6s ease-in-out infinite',
            pointerEvents: 'none',
          }}>NEW</div>
        )}
        {owned > 0 && (
          <button
            aria-label={favoriteCollection[entry.key] ? 'Unfavorite card' : 'Favorite card'}
            aria-pressed={Boolean(favoriteCollection[entry.key])}
            onClick={(event) => {
              event.stopPropagation();
              toggleFavoriteCard(card.definitionId, finish);
            }}
            title={favoriteCollection[entry.key] ? 'Unfavorite card' : 'Favorite card'}
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              zIndex: 3,
              width: 22,
              height: 22,
              borderRadius: 999,
              border: favoriteCollection[entry.key]
                ? '1px solid rgba(255, 215, 100, 0.9)'
                : '1px solid rgba(255, 238, 212, 0.55)',
              background: favoriteCollection[entry.key]
                ? 'rgba(120, 84, 36, 0.86)'
                : 'rgba(42, 27, 14, 0.62)',
              color: favoriteCollection[entry.key] ? '#ffd86b' : 'rgba(255, 241, 220, 0.8)',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: favoriteCollection[entry.key]
                ? '0 0 8px rgba(255, 215, 100, 0.45)'
                : 'none',
            }}
          >
            ★
          </button>
        )}


      </div>
    );
  };

  return (
    <>
      {selectedCard && (
        <CollectionCardDetail
          card={selectedCard.card}
          finish={selectedCard.finish}
          owned={selectedCard.owned}
          onClose={() => setSelectedCard(null)}
        />
      )}
    <div className="collection-screen" style={{
      position: 'absolute',
      inset: 0,
      background: 'var(--profile-app-background)',
      zIndex: 60,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: uiTypography.body,
      color: 'var(--profile-text)',
      pointerEvents: 'auto',
    }}>
      {/* Header */}
      <div className="ui-artwork-header collection-header" style={{
        padding: '16px 24px', borderBottom: `1px solid ${warmTheme.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        background: `linear-gradient(90deg, rgba(4,8,18,0.96) 0%, rgba(8,12,24,0.82) 60%, rgba(8,12,24,0.42) 100%), url("${import.meta.env.BASE_URL}assets/menu-banners/updated/collection-archive.png") right center / cover`,
        boxShadow: '0 8px 28px rgba(0,0,0,0.34), inset 0 -1px 0 rgba(244,207,107,0.12)',
      }}>
        <div data-ui-artwork-copy>
          <div className="ui-title-glow collection-title">
            Collection
          </div>
          <div style={{ fontSize: 12, color: 'rgba(244,244,248,0.92)', marginTop: 6 }}>
            {totalOwned} / {totalCards} unique cards discovered
            {isFilteringActive && (
              <span style={{ marginLeft: 10 }}>
                · Showing {visibleOwned} / {visibleTotal}
              </span>
            )}
          </div>
        </div>
        <button
          className="menu-tactile-btn collection-close"
          onClick={onClose}
          style={{
            background: 'var(--profile-button)', border: '1px solid var(--profile-border-strong)',
            color: 'var(--profile-button-text)', borderRadius: 10, padding: '8px 16px',
            fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia, serif',
          }}
        >
          <span className="ui-button-title">Close</span>
        </button>
      </div>

      {/* Element filter tabs */}
      <div className="collection-set-tabs" role="group" aria-label="Card set" style={{
        display: 'flex', gap: 6, padding: '12px 24px', flexShrink: 0,
        borderBottom: `1px solid ${warmTheme.border}`,
        background: 'var(--profile-surface)',
      }}>
        {elements.map(el => {
          const isActive = activeElement === el;
          const setName = el;
          return (
            <button
              className={`collection-filter${isActive ? ' is-active' : ''}`}
              aria-pressed={isActive}
              key={el}
              onClick={() => setActiveElement(el)}
            >
              {setName}
            </button>
          );
        })}
      </div>

      {/* Search + ownership + rarity filters */}
      <div className="collection-toolbar" style={{
        display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
        padding: '10px 24px', flexShrink: 0,
        borderBottom: `1px solid ${warmTheme.border}`,
        background: 'var(--profile-surface-muted)',
      }}>
        <input
          aria-label="Search collection"
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search by name, type, rarity…"
          style={{
            flex: '1 1 220px', minWidth: 180, maxWidth: 320,
            padding: '9px 12px', fontSize: 13, fontFamily: uiTypography.body,
            background: 'var(--profile-surface-strong)',
            border: '1px solid var(--profile-border)',
            borderRadius: 8, color: 'var(--profile-text)',
          }}
        />
        {searchText && (
          <button
            className="collection-filter"
            onClick={() => setSearchText('')}
          >Clear</button>
        )}

        <div role="group" aria-label="Ownership" style={{ display: 'flex', gap: 4, marginLeft: 6 }}>
          {(['all', 'owned', 'missing'] as const).map(opt => {
            const isActive = ownedFilter === opt;
            const label = opt === 'all' ? 'All' : opt === 'owned' ? 'Owned' : 'Missing';
            return (
              <button
                className={`collection-filter${isActive ? ' is-active' : ''}`}
                aria-pressed={isActive}
                key={opt}
                onClick={() => setOwnedFilter(opt)}
              >{label}</button>
            );
          })}
        </div>

        <div role="group" aria-label="Rarity" style={{ display: 'flex', gap: 4, marginLeft: 6, flexWrap: 'wrap' }}>
          {(['All', 'Common', 'Rare', 'Epic', 'Legendary', 'Eternal', 'Infinite', 'Enigmatic', 'Transcendent'] as const).map(r => {
            const isActive = rarityFilter === r;
            return (
              <button
                className={`collection-filter${isActive ? ' is-active' : ''}`}
                aria-pressed={isActive}
                key={r}
                onClick={() => setRarityFilter(r)}
              >{r}</button>
            );
          })}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', fontSize: 12, color: 'var(--profile-text-muted)', fontFamily: uiTypography.body }}>
          Sort:
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
            style={{
              padding: '8px 10px', fontSize: 12, fontFamily: uiTypography.body,
              background: 'var(--profile-surface-strong)', color: 'var(--profile-text)',
              border: '1px solid var(--profile-border)', borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            <option value="set">Set order</option>
            <option value="rarity">Rarity</option>
            <option value="name">Name</option>
            <option value="recent">Recently obtained</option>
          </select>
        </label>
      </div>

      {/* Card grid */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        {filtered.length === 0 && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 24px',
            color: 'var(--profile-text-muted)',
            fontStyle: 'italic',
            pointerEvents: 'none',
            zIndex: 1,
          }}>
            No cards match the current filters.
          </div>
        )}
        <VirtualizedList
          items={virtualRows}
          getItemKey={(row) => row.key}
          getItemHeight={(row) => row.height}
          overscanPx={300}
          topPadding={20}
          bottomPadding={24}
          viewportRef={gridViewportRef}
          style={{ height: '100%', minHeight: 0, overscrollBehavior: 'contain', touchAction: 'pan-y' }}
          renderItem={(row) => {
            if (row.kind === 'heading') {
              return (
                <div role="heading" aria-level={2} style={{
                  padding: '0 24px',
                  fontSize: 12,
                  fontWeight: 'bold',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: 'var(--profile-text)',
                  paddingTop: standardFiltered.length > 0 ? 18 : 0,
                }}>
                  {row.label}
                </div>
              );
            }

            if (row.kind === 'subheading') {
              return (
                <div role="heading" aria-level={3} style={{
                  padding: '10px 24px 2px',
                  fontSize: 10,
                  letterSpacing: 1.8,
                  textTransform: 'uppercase',
                  color: 'var(--profile-text-muted)',
                }}>
                  {row.label}
                </div>
              );
            }

            return (
              <div style={{
                display: 'flex',
                gap: 10,
                padding: '0 24px 10px',
                alignItems: 'flex-start',
              }}>
                {row.entries?.map(renderCardEntry)}
              </div>
            );
          }}
        />
      </div>
    </div>
    </>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function getLockedHoloCardBackStyle(card: ReturnType<typeof CardRegistry.getAll>[number]): CSSProperties {
  const base = getCardBackBackgroundStyle(card, { dimmed: false });
  const baseImage = typeof base.backgroundImage === 'string' ? base.backgroundImage : '';
  const baseBlend = typeof base.backgroundBlendMode === 'string' ? base.backgroundBlendMode : 'normal';
  const baseSize = typeof base.backgroundSize === 'string' ? base.backgroundSize : 'cover';
  const basePosition = typeof base.backgroundPosition === 'string' ? base.backgroundPosition : 'center';
  const baseRepeat = typeof base.backgroundRepeat === 'string' ? base.backgroundRepeat : 'no-repeat';

  const hueLayers = [
    'linear-gradient(108deg, rgba(255, 78, 156, 0.26) 0%, rgba(255, 174, 64, 0.24) 18%, rgba(250, 241, 112, 0.2) 34%, rgba(82, 226, 255, 0.24) 52%, rgba(114, 255, 187, 0.22) 70%, rgba(173, 130, 255, 0.26) 86%, rgba(255, 78, 156, 0.2) 100%)',
    'linear-gradient(72deg, rgba(255,255,255,0) 12%, rgba(255,255,255,0.16) 34%, rgba(255,255,255,0.04) 46%, rgba(255,255,255,0.22) 58%, rgba(255,255,255,0) 76%)',
    'linear-gradient(155deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.2) 20%, rgba(255,255,255,0.02) 42%, rgba(255,255,255,0.14) 66%, rgba(255,255,255,0.04) 100%)',
  ];

  return {
    ...base,
    backgroundImage: [...hueLayers, baseImage].join(', '),
    backgroundBlendMode: `screen, overlay, soft-light, ${baseBlend}`,
    backgroundSize: `210% 210%, 170% 170%, 140% 140%, ${baseSize}`,
    backgroundPosition: `center, center, center, ${basePosition}`,
    backgroundRepeat: `no-repeat, no-repeat, no-repeat, ${baseRepeat}`,
  };
}
