import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useStore } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { SET_ACCENT, SET_LABEL } from '@/data/elements';
import { PACK_DEFINITIONS, STORE_PACK_ORDER } from '@/data/packs/packDefinitions';
import { getCardFinishKey, getCardFinishLabel, isHoloOnlyCard } from '@/systems/progression/HolofoilSystem';
import {
  cardFacePalette,
  getDenseCardFaceBackgroundStyle,
  getCardBackgroundUrl,
  getCardBackBackgroundStyle,
  getCardArtTopBottomBorderOverlayStyleForCard,
  getCardFaceMetrics,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';
import { getDisplayCardTypeLabel } from '@/ui/preferences';
import { getCardPreviewLines } from '@/ui/cardStatSummary';
import { warmTheme } from '@/ui/theme';
import VirtualizedList from '@/ui/components/VirtualizedList';
import { getEverCollectionCount, getEverHoloCount, getEverInfiniteCount } from '@/systems/progression/ownershipHistory';
import CollectionCardDetail from './CollectionCardDetail';

const RARITY_COLORS: Record<string, string> = {
  Common: '#888', Rare: '#5b9bd5', Epic: '#9b59b6', Legendary: '#f39c12', Eternal: '#ff6b6b', Infinite: '#e8e8f0', Enigmatic: '#b76cff', Transcendent: '#f2b24f',
};

const RARITY_ORDER: Record<string, number> = {
  Common: 0, Rare: 1, Epic: 2, Legendary: 3, Eternal: 4, Infinite: 5, Enigmatic: 6, Transcendent: 7,
};

const INFINITE_TYPE_ORDER = ['Ophanim', 'Seraphim', 'Cherubim', 'Angel'] as const;

const PACK_BY_ID = new Map(PACK_DEFINITIONS.map(pack => [pack.id, pack] as const));
const STORE_COLLECTION_SET_ORDER = STORE_PACK_ORDER.map(packId => {
  const pack = PACK_BY_ID.get(packId);
  return pack?.setId ?? 'Neutrality';
});

function isFeaturedCollectionTranscendent(card: ReturnType<typeof CardRegistry.getAll>[number]): boolean {
  return card.definitionId.startsWith('tx-');
}

interface Props { onClose: () => void }

interface CollectionVariantEntry {
  key: string;
  finish: 'normal' | 'holo';
  owned: number;
  card: ReturnType<typeof CardRegistry.getAll>[number];
}

interface SelectedCard {
  card: ReturnType<typeof CardRegistry.getAll>[number];
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
  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null);
  const faceMetrics = getCardFaceMetrics('grid');
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

  const allCards = useMemo(() => registryCards.flatMap(card => {
    const variants: CollectionVariantEntry[] = [];
    const everCollectionOwned = getEverCollectionCount(progress, card.definitionId);
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
  }).sort((a, b) => {
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
    const availableCategories = new Set(['Neutrality']);
    const orderedCategories = STORE_COLLECTION_SET_ORDER.filter(category => availableCategories.has(category));
    const orderedCategorySet = new Set(orderedCategories);
    const remainingCategories = Array.from(availableCategories)
      .filter(category => !orderedCategorySet.has(category))
      .sort((a, b) => a.localeCompare(b));
    return ['All', ...orderedCategories, ...remainingCategories];
  }, []);
  const lowerSearch = searchText.trim().toLowerCase();
  const filtered = useMemo(() => allCards.filter(entry => {
    if (activeElement !== 'All' && 'Neutrality' !== activeElement) return false;
    if (rarityFilter === 'Transcendent') {
      if (!isFeaturedCollectionTranscendent(entry.card)) return false;
    } else if (rarityFilter !== 'All' && entry.card.rarity !== rarityFilter) {
      return false;
    }
    if (ownedFilter === 'owned' && entry.owned <= 0) return false;
    if (ownedFilter === 'missing' && entry.owned > 0) return false;
    if (lowerSearch) {
      const hay = `${entry.card.name} ${entry.card.type ?? ''} ${entry.card.rarity}`.toLowerCase();
      if (!hay.includes(lowerSearch)) return false;
    }
    return true;
  }), [activeElement, allCards, lowerSearch, ownedFilter, rarityFilter]);

  const standardFiltered = useMemo(
    () => filtered.filter(entry => entry.card.rarity !== 'Infinite' && !isFeaturedCollectionTranscendent(entry.card)),
    [filtered],
  );
  const featuredTranscendentFiltered = useMemo(
    () => filtered.filter(entry => isFeaturedCollectionTranscendent(entry.card)),
    [filtered],
  );
  const infiniteSections = useMemo(() => INFINITE_TYPE_ORDER
    .map(typeLabel => ({
      typeLabel,
      entries: filtered.filter(entry => entry.card.rarity === 'Infinite' && entry.card.type === typeLabel),
    }))
    .filter(section => section.entries.length > 0), [filtered]);

  const totalOwned = useMemo(() => allCards.filter(card => card.owned > 0).length, [allCards]);
  const totalCards = allCards.length;
  const visibleOwned = useMemo(() => filtered.filter(card => card.owned > 0).length, [filtered]);
  const visibleTotal = filtered.length;
  const isFilteringActive = activeElement !== 'All' || rarityFilter !== 'All' || ownedFilter !== 'all' || lowerSearch.length > 0;
  const gridColumns = Math.max(1, Math.floor((gridViewportWidth + 10) / 158));

  const virtualRows = useMemo(() => {
    const rows: CollectionVirtualRow[] = [];
    const pushCardRows = (entries: CollectionVariantEntry[], prefix: string) => {
      for (let index = 0; index < entries.length; index += gridColumns) {
        rows.push({
          key: `${prefix}-${index}`,
          kind: 'cards',
          height: 214,
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
          key: `${section.typeLabel}-label`,
          kind: 'subheading',
          height: 28,
          label: section.typeLabel,
        });
        pushCardRows(section.entries, `infinite-${section.typeLabel}`);
      });
    }

    if (featuredTranscendentFiltered.length > 0) {
      rows.push({
        key: 'transcendent-heading',
        kind: 'heading',
        height: (standardFiltered.length > 0 || infiniteSections.length > 0) ? 46 : 28,
        label: 'Transcendent Cards',
      });
      pushCardRows(featuredTranscendentFiltered, 'transcendent');
    }

    return rows;
  }, [featuredTranscendentFiltered, filtered, gridColumns, infiniteSections, sortMode, standardFiltered]);

  const renderCardEntry = (entry: CollectionVariantEntry) => {
    const { card, finish, owned } = entry;
    const rarityColor = RARITY_COLORS[card.rarity] ?? '#888';
    const acquiredAt = recentlyAcquired?.[card.definitionId] ?? 0;
    const isNew = owned > 0 && acquiredAt > lastViewedSnapshotRef.current;
    const isLockedStandardHolo = owned <= 0 && finish === 'holo' && card.rarity !== 'Infinite' && card.rarity !== 'Eternal';
    const isFeaturedTranscendent = isFeaturedCollectionTranscendent(card);
    const previewText = owned > 0 ? getCardPreviewLines(card, 3).join(' ') : '???';
    const finishLabel = isHoloOnlyCard(card) ? null : getCardFinishLabel(finish);
    const artUrl = owned > 0 ? getCardBackgroundUrl(card) : null;
    let cardSurfaceStyle = owned > 0
      ? getDenseCardFaceBackgroundStyle(card, finish, 'front', true)
      : (isLockedStandardHolo
        ? getLockedHoloCardBackStyle(card)
        : getCardBackBackgroundStyle(card, { dimmed: false }));

    if (isFeaturedTranscendent) {
      const baseImage = typeof cardSurfaceStyle.backgroundImage === 'string' ? cardSurfaceStyle.backgroundImage : '';
      const baseBlend = typeof cardSurfaceStyle.backgroundBlendMode === 'string' ? cardSurfaceStyle.backgroundBlendMode : '';
      cardSurfaceStyle = {
        ...cardSurfaceStyle,
        backgroundImage: `linear-gradient(132deg, rgba(95, 10, 6, 0.56) 0%, rgba(158, 26, 12, 0.42) 26%, rgba(214, 152, 44, 0.44) 62%, rgba(120, 24, 8, 0.52) 100%)${baseImage ? `, ${baseImage}` : ''}`,
        backgroundBlendMode: `screen${baseBlend ? `, ${baseBlend}` : ''}`,
      };
    }

    return (
      <div
        key={entry.key}
        onClick={() => setSelectedCard({ card, finish, owned })}
        style={{
          width: 148,
          ...cardSurfaceStyle,
          backgroundColor: warmTheme.surfaceStrong,
          border: owned > 0
            ? (isFeaturedTranscendent ? '1px solid rgba(224, 174, 72, 0.86)' : `1px solid ${rarityColor}55`)
            : `1px solid ${warmTheme.border}`,
          borderRadius: 12,
          height: 204,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          opacity: 1,
          transition: 'all 0.15s',
          overflow: 'hidden',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px rgba(${hexToRgb(rarityColor)}, 0.4), 0 0 12px rgba(${hexToRgb(rarityColor)}, 0.3)`;
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        }}
        title={owned > 0 ? getCardPreviewLines(card, 4).join('\n') : 'Card not discovered'}
      >
        {artUrl && <img src={artUrl} alt="" loading="lazy" decoding="async" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }} />}
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
            color: '#fff',
            textShadow: '0 1px 1px rgba(0,0,0,0.4)',
            boxShadow: '0 0 8px rgba(247, 183, 51, 0.6)',
            animation: 'newBadgePulse 1.6s ease-in-out infinite',
            pointerEvents: 'none',
          }}>NEW</div>
        )}
        {owned > 0 && (
          <button
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

        <div style={getCardArtTopBottomBorderOverlayStyleForCard(card)} />

        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={getCardNameRibbonStyle('grid')}>
            <div style={{ fontSize: faceMetrics.typeSize, color: cardFacePalette.textMuted, letterSpacing: 1.4, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 }}>
              {finishLabel ? `${getDisplayCardTypeLabel(card.type)} · ${finishLabel}` : getDisplayCardTypeLabel(card.type)}
            </div>
            <div style={{
              fontSize: faceMetrics.nameSize,
              fontWeight: 'bold',
              color: cardFacePalette.text,
              lineHeight: 1.25,
              minHeight: 24,
              textAlign: 'center',
            }}>
              {card.name}
            </div>
          </div>

          <div style={getCardRulesPanelStyle('grid')}>
            <div style={{
              fontSize: faceMetrics.descSize,
              color: cardFacePalette.textSoft,
              lineHeight: faceMetrics.descLineHeight,
              textAlign: 'center',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 3,
              overflow: 'hidden',
            }}>
              {previewText}
            </div>
            <div style={{
              marginTop: 6,
              fontSize: 10,
              letterSpacing: 1,
              color: owned > 0 ? cardFacePalette.textMuted : warmTheme.textFaint,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ color: cardFacePalette.textMuted, textTransform: 'uppercase' }}>{card.rarity}</span>
              <span>{owned > 0 ? `×${owned} discovered` : 'Not discovered'}</span>
            </div>
          </div>
        </div>
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
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(circle at 18% 10%, rgba(236, 192, 128, 0.14) 0%, rgba(236, 192, 128, 0) 38%), linear-gradient(180deg, #0c0f15 0%, #10151e 100%)',
      zIndex: 60,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Georgia, serif',
      color: '#c8dff2',
      pointerEvents: 'auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: `1px solid ${warmTheme.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        background: 'rgba(9, 14, 20, 0.4)',
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#58aada', letterSpacing: 2 }}>
            Collection
          </div>
          <div style={{ fontSize: 11, color: 'rgba(190,215,245,0.72)', marginTop: 3 }}>
            {totalOwned} / {totalCards} unique cards discovered
            {isFilteringActive && (
              <span style={{ marginLeft: 10, color: '#58aada' }}>
                · Showing {visibleOwned} / {visibleTotal}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(5,18,36,0.85)', border: `1px solid rgba(100,140,188,0.28)`,
            color: '#c8dff2', borderRadius: 10, padding: '6px 16px',
            fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia, serif',
          }}
        >
          Close
        </button>
      </div>

      {/* Element filter tabs */}
      <div style={{
        display: 'flex', gap: 6, padding: '12px 24px', flexShrink: 0,
        borderBottom: `1px solid ${warmTheme.border}`,
        background: 'rgba(9, 14, 20, 0.3)',
      }}>
        {elements.map(el => {
          const isActive = activeElement === el;
          const color = el === 'All' ? '#FFD700' : (SET_ACCENT);
          const setName = el === 'All' ? 'All' : (SET_LABEL);
          return (
            <button
              key={el}
              onClick={() => setActiveElement(el)}
              style={{
                padding: '5px 14px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
                fontFamily: 'Georgia, serif', letterSpacing: 1,
                background: isActive ? `rgba(${hexToRgb(color)},0.18)` : 'rgba(5,18,36,0.82)',
                border: isActive ? `1px solid ${color}` : `1px solid rgba(100,140,188,0.28)`,
                color: isActive ? color : '#c8dff2',
                transition: 'all 0.15s',
              }}
            >
              {setName}
            </button>
          );
        })}
      </div>

      {/* Search + ownership + rarity filters */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
        padding: '10px 24px', flexShrink: 0,
        borderBottom: `1px solid ${warmTheme.border}`,
        background: 'rgba(9, 14, 20, 0.22)',
      }}>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search by name, type, rarity…"
          style={{
            flex: '1 1 220px', minWidth: 180, maxWidth: 320,
            padding: '6px 10px', fontSize: 12, fontFamily: 'Georgia, serif',
            background: 'rgba(5,12,28,0.80)',
            border: `1px solid rgba(100,140,188,0.28)`,
            borderRadius: 6, color: '#c8dff2', outline: 'none',
          }}
        />
        {searchText && (
          <button
            onClick={() => setSearchText('')}
            style={{
              padding: '5px 10px', fontSize: 11, cursor: 'pointer',
              background: 'transparent', color: '#7bbde8',
              border: `1px solid ${warmTheme.border}`, borderRadius: 5,
              fontFamily: 'Georgia, serif',
            }}
          >Clear</button>
        )}

        <div style={{ display: 'flex', gap: 4, marginLeft: 6 }}>
          {(['all', 'owned', 'missing'] as const).map(opt => {
            const isActive = ownedFilter === opt;
            const label = opt === 'all' ? 'All' : opt === 'owned' ? 'Owned' : 'Missing';
            return (
              <button
                key={opt}
                onClick={() => setOwnedFilter(opt)}
                style={{
                  padding: '5px 12px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
                  fontFamily: 'Georgia, serif', letterSpacing: 0.8,
                  background: isActive ? 'rgba(58,142,200,0.18)' : 'rgba(5,18,36,0.82)',
                  border: isActive ? '1px solid rgba(62,112,168,0.70)' : `1px solid rgba(100,140,188,0.28)`,
                  color: isActive ? '#58aada' : '#c8dff2',
                }}
              >{label}</button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 4, marginLeft: 6, flexWrap: 'wrap' }}>
          {(['All', 'Common', 'Rare', 'Epic', 'Legendary', 'Eternal', 'Infinite', 'Enigmatic', 'Transcendent'] as const).map(r => {
            const isActive = rarityFilter === r;
            const color = r === 'All' ? '#FFD700' : (RARITY_COLORS[r] ?? '#aaa');
            return (
              <button
                key={r}
                onClick={() => setRarityFilter(r)}
                style={{
                  padding: '5px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
                  fontFamily: 'Georgia, serif', letterSpacing: 0.8,
                  background: isActive ? `rgba(${hexToRgb(color)},0.20)` : 'rgba(5,18,36,0.82)',
                  border: isActive ? `1px solid ${color}` : `1px solid rgba(100,140,188,0.28)`,
                  color: isActive ? color : '#c8dff2',
                }}
              >{r}</button>
            );
          })}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', fontSize: 11, color: 'rgba(190,215,245,0.60)', fontFamily: 'Georgia, serif' }}>
          Sort:
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
            style={{
              padding: '4px 8px', fontSize: 11, fontFamily: 'Georgia, serif',
              background: 'rgba(5,18,36,0.85)', color: '#c8dff2',
              border: `1px solid rgba(100,140,188,0.28)`, borderRadius: 5,
              cursor: 'pointer', outline: 'none',
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
      {filtered.length === 0 ? (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 24px',
          color: 'rgba(190,215,245,0.72)',
          fontStyle: 'italic',
        }}>
          No cards match the current filters.
        </div>
      ) : (
        <VirtualizedList
          items={virtualRows}
          getItemKey={(row) => row.key}
          getItemHeight={(row) => row.height}
          overscanPx={300}
          topPadding={20}
          bottomPadding={24}
          viewportRef={gridViewportRef}
          style={{ flex: 1 }}
          renderItem={(row) => {
            if (row.kind === 'heading') {
              return (
                <div style={{
                  padding: '0 24px',
                  fontSize: 12,
                  fontWeight: 'bold',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: '#dfe5ff',
                  textShadow: '0 0 16px rgba(220, 224, 255, 0.35)',
                  paddingTop: standardFiltered.length > 0 ? 18 : 0,
                }}>
                  {row.label}
                </div>
              );
            }

            if (row.kind === 'subheading') {
              return (
                <div style={{
                  padding: '10px 24px 2px',
                  fontSize: 10,
                  letterSpacing: 1.8,
                  textTransform: 'uppercase',
                  color: 'rgba(223, 229, 255, 0.82)',
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
      )}
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
