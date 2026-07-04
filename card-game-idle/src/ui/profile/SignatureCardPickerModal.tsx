import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { warmTheme } from '@/ui/theme';
import { CardRegistry } from '@/cards/CardRegistry';
import {
  cardFacePalette,
  getDenseCardFaceBackgroundStyle,
  getCardFaceMetrics,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
  getCardBackgroundUrl,
} from '@/ui/cardBackgrounds';
import VirtualizedList from '@/ui/components/VirtualizedList';
import { getDisplayCardTypeLabel } from '@/ui/preferences';

interface Props {
  slotIndex: number;
  onClose: () => void;
  onPick: (cardId: string) => void;
}

const RARITY_ORDER: Record<string, number> = {
  Common: 0, Rare: 1, Epic: 2, Legendary: 3, Eternal: 4, Infinite: 5,
};

const RARITY_COLORS: Record<string, string> = {
  Common: '#888', Rare: '#5b9bd5', Epic: '#9b59b6',
  Legendary: '#f39c12', Eternal: '#ff6b6b', Infinite: '#e8e8f0',
};

const faceMetrics = getCardFaceMetrics('grid');

interface SignatureCardRow {
  key: string;
  cards: NonNullable<ReturnType<typeof CardRegistry.get>>[];
}

export default function SignatureCardPickerModal({ slotIndex, onClose, onPick }: Props) {
  const progress = useStore(selectProgress);
  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('All');
  const gridViewportRef = useRef<HTMLDivElement | null>(null);
  const [gridViewportWidth, setGridViewportWidth] = useState(0);

  useEffect(() => {
    const node = gridViewportRef.current;
    if (!node) return;

    const updateWidth = () => setGridViewportWidth(Math.max(0, node.clientWidth - 44));
    updateWidth();

    const resizeObserver = new ResizeObserver(() => updateWidth());
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

  const ownedCards = useMemo(() => {
    const col = progress.collection ?? {};
    return Object.entries(col)
      .filter(([, count]) => count > 0)
      .map(([id]) => CardRegistry.get(id))
      .filter(Boolean)
      .sort((a, b) => {
        const ro = (RARITY_ORDER[b!.rarity] ?? 0) - (RARITY_ORDER[a!.rarity] ?? 0);
        if (ro !== 0) return ro;
        return a!.name.localeCompare(b!.name);
      });
  }, [progress.collection]);

  const rarities = useMemo(
    () => ['All', ...Array.from(new Set(ownedCards.map(c => c!.rarity)))
      .sort((a, b) => (RARITY_ORDER[b] ?? 0) - (RARITY_ORDER[a] ?? 0))],
    [ownedCards],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ownedCards.filter(d => {
      if (rarityFilter !== 'All' && d!.rarity !== rarityFilter) return false;
      if (q && !d!.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [ownedCards, search, rarityFilter]);

  const gridColumns = Math.max(1, Math.floor((gridViewportWidth + 10) / 126));
  const virtualRows = useMemo(() => {
    const rows: SignatureCardRow[] = [];
    for (let index = 0; index < filtered.length; index += gridColumns) {
      rows.push({
        key: `row-${index}`,
        cards: filtered.slice(index, index + gridColumns) as NonNullable<ReturnType<typeof CardRegistry.get>>[],
      });
    }
    return rows;
  }, [filtered, gridColumns]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'auto',
        backdropFilter: 'blur(3px)',
        fontFamily: 'Georgia, serif',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'radial-gradient(ellipse at 82% 8%, rgba(100,60,180,0.09) 0%, transparent 38%), radial-gradient(ellipse at 12% 88%, rgba(200,133,10,0.13) 0%, transparent 44%), linear-gradient(180deg, #050c17 0%, #08111f 45%, #050b15 100%)',
          border: '1px solid rgba(200,155,72,0.38)',
          borderRadius: 16,
          width: 'min(900px, 94vw)',
          maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.88)',
          overflow: 'hidden',
          color: '#ead9c0',
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div style={{
          padding: '20px 28px 16px',
          borderBottom: '1px solid rgba(200,155,72,0.22)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(5,9,17,0.88) 0%, rgba(8,13,24,0.65) 100%)',
          boxShadow: '0 1px 0 rgba(200,155,72,0.10), 0 4px 20px rgba(0,0,0,0.45)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontSize: 22, fontWeight: 'bold', color: '#f5c96c',
              letterSpacing: 4, textTransform: 'uppercase',
              textShadow: '0 0 28px rgba(240,189,120,0.36), 0 2px 6px rgba(0,0,0,0.8)',
              lineHeight: 1,
            }}>
              Signature Card
            </div>
            <div style={{ fontSize: 10, color: 'rgba(234,217,192,0.48)', letterSpacing: 2, marginTop: 6, textTransform: 'uppercase' }}>
              Slot {slotIndex + 1} of 5 · Choose from your collection
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 40, height: 40, borderRadius: '50%', cursor: 'pointer',
              background: 'rgba(200,128,58,0.08)', border: '1px solid rgba(200,155,72,0.28)',
              color: 'rgba(234,217,192,0.72)', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
              transition: 'all 0.18s ease', flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* ── Filter bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '0 20px', flexShrink: 0, flexWrap: 'wrap',
          background: 'rgba(3,6,14,0.60)',
          borderBottom: '1px solid rgba(200,155,72,0.16)',
        }}>
          {/* Search */}
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name…"
            style={{
              background: 'rgba(3,6,14,0.75)', border: '1px solid rgba(200,155,72,0.38)',
              color: '#e8d4b8', fontSize: 12, padding: '7px 10px', borderRadius: 6,
              fontFamily: 'Georgia, serif', outline: 'none',
              width: 200, boxSizing: 'border-box',
              margin: '10px 12px 10px 0',
            }}
          />
          {/* Rarity filter tabs */}
          {rarities.map(r => (
            <button
              key={r}
              onClick={() => setRarityFilter(r)}
              style={{
                padding: '0 14px', height: 42, border: 'none',
                borderBottom: `3px solid ${rarityFilter === r ? '#f0bd78' : 'transparent'}`,
                background: rarityFilter === r ? 'rgba(240,189,120,0.08)' : 'transparent',
                color: rarityFilter === r ? '#f5c96c' : 'rgba(234,217,192,0.55)',
                fontSize: 10.5, cursor: 'pointer', fontFamily: 'Georgia, serif',
                letterSpacing: 1.2, textTransform: 'uppercase', transition: 'all 0.18s ease',
                flexShrink: 0,
              }}
            >{r}</button>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(234,217,192,0.38)', letterSpacing: 0.5, padding: '0 4px' }}>
            {filtered.length} card{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* ── Card grid ── */}
        {filtered.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '18px 22px 24px',
            color: 'rgba(232,215,191,0.42)',
            fontStyle: 'italic',
            fontSize: 13,
          }}>
            No cards found.
          </div>
        ) : (
          <VirtualizedList
            items={virtualRows}
            getItemKey={(row) => row.key}
            getItemHeight={() => 170}
            topPadding={18}
            bottomPadding={24}
            overscanPx={420}
            viewportRef={gridViewportRef}
            style={{ flex: 1 }}
            renderItem={(row) => (
              <div style={{ display: 'flex', gap: 10, padding: '0 22px 10px', alignItems: 'flex-start' }}>
                {row.cards.map(d => {
                  const rarityColor = RARITY_COLORS[d.rarity] ?? '#888';
                  return (
                    <div
                      key={d.definitionId}
                      onClick={() => onPick(d.definitionId)}
                      style={{
                        width: 116, height: 160,
                        ...getDenseCardFaceBackgroundStyle(d, 'normal', 'front', true),
                        backgroundColor: warmTheme.surfaceStrong,
                        border: `1px solid ${rarityColor}55`,
                        borderRadius: 12,
                        position: 'relative',
                        display: 'flex', flexDirection: 'column', alignItems: 'stretch',
                        overflow: 'hidden', cursor: 'pointer',
                        transition: 'all 0.15s',
                        userSelect: 'none',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${rarityColor}66, 0 0 12px ${rarityColor}44`;
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                      }}
                      title={`${d.name} · ${d.rarity}`}
                    >
                      {getCardBackgroundUrl(d) && <img src={getCardBackgroundUrl(d)!} alt="" loading="lazy" decoding="async" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }} />}
                      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={getCardNameRibbonStyle('grid')}>
                          <div style={{
                            fontSize: faceMetrics.typeSize, letterSpacing: 1,
                            textTransform: 'uppercase', color: cardFacePalette.text,
                          }}>
                            {getDisplayCardTypeLabel(d.type)}
                          </div>
                        </div>
                        <div style={getCardRulesPanelStyle('grid')}>
                          <div style={{
                            fontSize: faceMetrics.nameSize, fontWeight: 'bold',
                            color: cardFacePalette.text, lineHeight: 1.25,
                          }}>
                            {d.name}
                          </div>
                          <div style={{ fontSize: faceMetrics.typeSize, color: rarityColor, letterSpacing: 0.4, marginTop: 2 }}>
                            {d.rarity}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          />
        )}

        {/* ── Footer ── */}
        <div style={{
          padding: '12px 28px',
          borderTop: '1px solid rgba(200,155,72,0.20)',
          display: 'flex', justifyContent: 'flex-end',
          background: 'linear-gradient(180deg, rgba(5,8,16,0.65) 0%, rgba(3,6,12,0.88) 100%)',
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px', borderRadius: 10,
              border: '1px solid rgba(200,155,72,0.22)',
              background: 'rgba(234,217,192,0.05)',
              color: 'rgba(234,217,192,0.68)', fontSize: 12,
              cursor: 'pointer', fontFamily: 'Georgia, serif', letterSpacing: 0.5,
            }}
          >Cancel</button>
        </div>
      </div>
    </div>
  );
}
