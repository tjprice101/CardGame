import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useStore } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { ELEMENT_SET_NAMES, ELEMENT_COLORS, getCardCategoryKey } from '@/data/elements';
import { PACK_DEFINITIONS, STORE_PACK_ORDER } from '@/data/packs/packDefinitions';
import { getCardFinishKey, getCardFinishLabel, getOwnedCopiesForFinish, isHoloOnlyCard } from '@/systems/progression/HolofoilSystem';
import {
  cardFacePalette,
  getCardBackBackgroundStyle,
  getCardFaceBackgroundStyle,
  getCardFaceMetrics,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';
import CardRulesDigest from '@/ui/components/CardRulesDigest';
import { getDisplayCardTypeLabel } from '@/ui/preferences';
import { getCardPreviewLines } from '@/ui/cardStatSummary';
import { warmTheme } from '@/ui/theme';
import CardEngineCallout from '@/ui/components/CardEngineCallout';
import CollectionCardDetail from './CollectionCardDetail';

const RARITY_COLORS: Record<string, string> = {
  Common: '#888', Rare: '#5b9bd5', Epic: '#9b59b6', Legendary: '#f39c12', Eternal: '#ff6b6b', Infinite: '#e8e8f0',
};

const RARITY_ORDER: Record<string, number> = {
  Common: 0, Rare: 1, Epic: 2, Legendary: 3, Eternal: 4, Infinite: 5,
};

const INFINITE_TYPE_ORDER = ['Ophanim', 'Seraphim', 'Cherubim', 'Angel'] as const;

const PACK_BY_ID = new Map(PACK_DEFINITIONS.map(pack => [pack.id, pack] as const));
const STORE_COLLECTION_SET_ORDER = STORE_PACK_ORDER.map(packId => {
  const pack = PACK_BY_ID.get(packId);
  return pack?.id === 'pack-snowbound-voltage' ? 'SnowboundVoltage' : (pack?.element ?? 'Neutrality');
});

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

export default function CollectionViewer({ onClose }: Props) {
  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null);
  const faceMetrics = getCardFaceMetrics('grid');
  const collection = useStore(s => s.progress.collection);
  const holoCollection = useStore(s => s.progress.holoCollection);
  const favoriteCollection = useStore(s => s.progress.favoriteCollection);
  const toggleFavoriteCard = useStore(s => s.toggleFavoriteCard);
  const [activeElement, setActiveElement] = useState<string>('All');
  const categoryOrderRank = new Map(STORE_COLLECTION_SET_ORDER.map((category, index) => [category, index]));

  const allCards = CardRegistry.getAll().flatMap(card => {
    const variants: CollectionVariantEntry[] = [];
    if (!isHoloOnlyCard(card)) {
      variants.push({
        key: getCardFinishKey(card.definitionId, 'normal'),
        finish: 'normal',
        owned: getOwnedCopiesForFinish(card, 'normal', collection, holoCollection),
        card,
      });
    }
    variants.push({
      key: getCardFinishKey(card.definitionId, 'holo'),
      finish: 'holo',
      owned: getOwnedCopiesForFinish(card, 'holo', collection, holoCollection),
      card,
    });
    return variants;
  }).sort((a, b) => {
    const categoryA = getCardCategoryKey(a.card);
    const categoryB = getCardCategoryKey(b.card);
    const categoryRankA = categoryOrderRank.get(categoryA) ?? Number.MAX_SAFE_INTEGER;
    const categoryRankB = categoryOrderRank.get(categoryB) ?? Number.MAX_SAFE_INTEGER;
    if (categoryRankA !== categoryRankB) return categoryRankA - categoryRankB;
    if (categoryA !== categoryB) return categoryA.localeCompare(categoryB);
    if (RARITY_ORDER[a.card.rarity] !== RARITY_ORDER[b.card.rarity])
      return RARITY_ORDER[a.card.rarity] - RARITY_ORDER[b.card.rarity];
    if (a.card.name !== b.card.name) return a.card.name.localeCompare(b.card.name);
    return a.finish.localeCompare(b.finish);
  });

  const availableCategories = new Set(allCards.map(card => getCardCategoryKey(card.card)));
  const orderedCategories = STORE_COLLECTION_SET_ORDER.filter(category => availableCategories.has(category));
  const orderedCategorySet = new Set(orderedCategories);
  const remainingCategories = Array.from(availableCategories)
    .filter(category => !orderedCategorySet.has(category))
    .sort((a, b) => a.localeCompare(b));
  const elements = ['All', ...orderedCategories, ...remainingCategories];
  const filtered = activeElement === 'All'
    ? allCards
    : allCards.filter(card => getCardCategoryKey(card.card) === activeElement);

  const standardFiltered = filtered.filter(entry => entry.card.rarity !== 'Infinite');
  const infiniteSections = INFINITE_TYPE_ORDER
    .map(typeLabel => ({
      typeLabel,
      entries: filtered.filter(entry => entry.card.rarity === 'Infinite' && entry.card.type === typeLabel),
    }))
    .filter(section => section.entries.length > 0);

  const totalOwned = allCards.filter(card => card.owned > 0).length;
  const totalCards = allCards.length;

  const renderCardEntry = (entry: CollectionVariantEntry) => {
    const { card, finish, owned } = entry;
    const rarityColor = RARITY_COLORS[card.rarity] ?? '#888';
    const isLockedStandardHolo = owned <= 0 && finish === 'holo' && card.rarity !== 'Infinite' && card.rarity !== 'Eternal';
    const cardSurfaceStyle = owned > 0
      ? getCardFaceBackgroundStyle(card, finish)
      : (isLockedStandardHolo
        ? getLockedHoloCardBackStyle(card)
        : getCardBackBackgroundStyle(card, { dimmed: false }));

    return (
      <div
        key={entry.key}
        onClick={() => setSelectedCard({ card, finish, owned })}
        className={finish === 'holo' || card.rarity === 'Infinite' || card.rarity === 'Eternal'
          ? `holofoil-menu-card${card.rarity === 'Infinite' ? ' infinite-holo-bw-hover' : ''}${card.rarity === 'Eternal' ? ' eternal-holo-red-hover' : ''}`
          : undefined}
        style={{
          width: 148,
          ...cardSurfaceStyle,
          backgroundColor: warmTheme.surfaceStrong,
          border: owned > 0
            ? `1px solid ${rarityColor}55`
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
        title={owned > 0 ? getCardPreviewLines(card, 4).join('\n') : 'Card not owned'}
      >
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

        <div style={getCardNameRibbonStyle('grid')}>
          <div style={{ fontSize: faceMetrics.typeSize, color: cardFacePalette.textMuted, letterSpacing: 1.4, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 }}>
            {getDisplayCardTypeLabel(card.type)} · {getCardFinishLabel(finish)}
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
          {owned > 0 && (
            <div style={{ marginBottom: 6 }}>
              <CardEngineCallout card={card} variant="compact" />
            </div>
          )}
          <div style={{
            fontSize: faceMetrics.descSize,
            color: cardFacePalette.textSoft,
            lineHeight: faceMetrics.descLineHeight,
            textAlign: 'center',
          }}>
            {owned > 0 ? (
              <CardRulesDigest
                card={card}
                variant="preview"
                maxSections={4}
                maxLinesPerSection={10}
                lineClamp={3}
                labelColor={cardFacePalette.textMuted}
                textColor={cardFacePalette.textSoft}
                sectionBackground="transparent"
                sectionBorder="transparent"
              />
            ) : '???'}
          </div>
          <div style={{
            marginTop: 6,
            fontSize: 8,
            letterSpacing: 1,
            color: owned > 0 ? cardFacePalette.textMuted : warmTheme.textFaint,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ color: cardFacePalette.textMuted, textTransform: 'uppercase' }}>{card.rarity}</span>
            <span>{owned > 0 ? `×${owned} owned` : 'Not owned'}</span>
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
      color: '#ead9c0',
      pointerEvents: 'auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: `1px solid ${warmTheme.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        background: 'rgba(9, 14, 20, 0.4)',
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#f0bd78', letterSpacing: 2 }}>
            Collection
          </div>
          <div style={{ fontSize: 11, color: 'rgba(234, 217, 192, 0.75)', marginTop: 3 }}>
            {totalOwned} / {totalCards} unique cards collected
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 237, 213, 0.94)', border: `1px solid ${warmTheme.border}`,
            color: '#5f3a17', borderRadius: 10, padding: '6px 16px',
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
          const color = el === 'All' ? '#FFD700' : (ELEMENT_COLORS[el] ?? '#aaa');
          const setName = el === 'All' ? 'All' : (ELEMENT_SET_NAMES[el] ?? el);
          return (
            <button
              key={el}
              onClick={() => setActiveElement(el)}
              style={{
                padding: '5px 14px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
                fontFamily: 'Georgia, serif', letterSpacing: 1,
                background: isActive ? `rgba(${hexToRgb(color)},0.18)` : 'rgba(255, 236, 209, 0.9)',
                border: isActive ? `1px solid ${color}` : `1px solid ${warmTheme.border}`,
                color: isActive ? color : '#5f3a17',
                transition: 'all 0.15s',
              }}
            >
              {setName}
            </button>
          );
        })}
      </div>

      {/* Card grid */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 24px',
        display: 'flex', flexWrap: 'wrap', gap: 10, alignContent: 'flex-start',
      }}>
        {standardFiltered.map(renderCardEntry)}
        {infiniteSections.length > 0 && (
          <>
            <div style={{
              width: '100%',
              marginTop: standardFiltered.length > 0 ? 18 : 0,
              fontSize: 12,
              fontWeight: 'bold',
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: '#dfe5ff',
              textShadow: '0 0 16px rgba(220, 224, 255, 0.35)',
            }}>
              Infinite Cards
            </div>
            {infiniteSections.map(section => (
              <>
                <div
                  key={`${section.typeLabel}-heading`}
                  style={{
                    width: '100%',
                    marginTop: 10,
                    marginBottom: 2,
                    fontSize: 10,
                    letterSpacing: 1.8,
                    textTransform: 'uppercase',
                    color: 'rgba(223, 229, 255, 0.82)',
                  }}
                >
                  {section.typeLabel}
                </div>
                {section.entries.map(renderCardEntry)}
              </>
            ))}
          </>
        )}
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
