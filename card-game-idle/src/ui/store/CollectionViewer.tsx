import { useState } from 'react';
import { useStore } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { ELEMENT_SET_NAMES, ELEMENT_COLORS, getCardCategoryKey } from '@/data/elements';
import {
  cardFacePalette,
  getCardFaceBackgroundStyle,
  getCardFaceMetrics,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';
import { warmTheme } from '@/ui/theme';

const RARITY_COLORS: Record<string, string> = {
  Common: '#888', Rare: '#5b9bd5', Epic: '#9b59b6', Legendary: '#f39c12',
};

const RARITY_ORDER: Record<string, number> = {
  Common: 0, Rare: 1, Epic: 2, Legendary: 3,
};

interface Props { onClose: () => void }

export default function CollectionViewer({ onClose }: Props) {
  const faceMetrics = getCardFaceMetrics('grid');
  const collection = useStore(s => s.progress.collection);
  const [activeElement, setActiveElement] = useState<string>('All');

  const allCards = CardRegistry.getAll().sort((a, b) => {
    const categoryA = getCardCategoryKey(a);
    const categoryB = getCardCategoryKey(b);
    if (categoryA !== categoryB) return categoryA.localeCompare(categoryB);
    if (RARITY_ORDER[a.rarity] !== RARITY_ORDER[b.rarity])
      return RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
    return a.name.localeCompare(b.name);
  });

  const elements = ['All', ...Array.from(new Set(allCards.map(card => getCardCategoryKey(card))))];
  const filtered = activeElement === 'All'
    ? allCards
    : allCards.filter(card => getCardCategoryKey(card) === activeElement);

  const totalOwned = Object.keys(collection).length;
  const totalCards = allCards.length;

  return (
    <div style={{
      position: 'absolute', inset: 0, background: warmTheme.overlay, zIndex: 60,
      display: 'flex', flexDirection: 'column', fontFamily: 'Georgia, serif', color: warmTheme.text,
      pointerEvents: 'auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: `1px solid ${warmTheme.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: warmTheme.accentDeep, letterSpacing: 2 }}>
            Collection
          </div>
          <div style={{ fontSize: 11, color: warmTheme.textMuted, marginTop: 3 }}>
            {totalOwned} / {totalCards} unique cards collected
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: warmTheme.surface, border: `1px solid ${warmTheme.border}`,
            color: warmTheme.textMuted, borderRadius: 10, padding: '6px 16px',
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
                background: isActive ? `rgba(${hexToRgb(color)},0.12)` : warmTheme.surface,
                border: isActive ? `1px solid ${color}` : `1px solid ${warmTheme.border}`,
                color: isActive ? color : warmTheme.textMuted,
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
        {filtered.map(card => {
          const owned = collection[card.definitionId] ?? 0;
          const rarityColor = RARITY_COLORS[card.rarity] ?? '#888';

          return (
            <div
              key={card.definitionId}
              style={{
                width: 148,
                ...getCardFaceBackgroundStyle(card),
                backgroundColor: owned > 0 ? warmTheme.surfaceStrong : warmTheme.surfaceMuted,
                border: owned > 0
                  ? `1px solid ${rarityColor}55`
                  : `1px solid ${warmTheme.border}`,
                borderRadius: 12,
                height: 204,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                opacity: owned > 0 ? 1 : 0.45,
                transition: 'opacity 0.15s',
                overflow: 'hidden',
              }}
            >
              <div style={getCardNameRibbonStyle('grid')}>
                <div style={{ fontSize: faceMetrics.typeSize, color: cardFacePalette.textMuted, letterSpacing: 1.4, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 }}>
                  {card.type}
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
                  display: '-webkit-box',
                  WebkitLineClamp: faceMetrics.descLines,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textAlign: 'center',
                }}>
                  {owned > 0 ? card.description : '???'}
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
        })}
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
