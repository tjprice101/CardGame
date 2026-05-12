import { useState } from 'react';
import { useStore } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { ELEMENT_SET_NAMES, ELEMENT_COLORS } from '@/data/elements';
import { warmTheme } from '@/ui/theme';

const RARITY_COLORS: Record<string, string> = {
  Common: '#888', Rare: '#5b9bd5', Epic: '#9b59b6', Legendary: '#f39c12',
};

const RARITY_ORDER: Record<string, number> = {
  Common: 0, Rare: 1, Epic: 2, Legendary: 3,
};

const TYPE_COLORS: Record<string, string> = {
  Seraphim: '#FFD700', Chaos: '#b87de8', Seeker: '#c888f0', Angel: '#FFD700',
};

interface Props { onClose: () => void }

export default function CollectionViewer({ onClose }: Props) {
  const collection = useStore(s => s.progress.collection);
  const [activeElement, setActiveElement] = useState<string>('All');

  const allCards = CardRegistry.getAll().sort((a, b) => {
    if (a.element !== b.element) return a.element.localeCompare(b.element);
    if (RARITY_ORDER[a.rarity] !== RARITY_ORDER[b.rarity])
      return RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
    return a.name.localeCompare(b.name);
  });

  const elements = ['All', ...Array.from(new Set(allCards.map(c => c.element)))];
  const filtered = activeElement === 'All' ? allCards : allCards.filter(c => c.element === activeElement);

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
          const typeColor = TYPE_COLORS[card.type] ?? '#aaa';

          return (
            <div
              key={card.definitionId}
              style={{
                width: 148,
                background: owned > 0 ? warmTheme.surfaceStrong : warmTheme.surfaceMuted,
                border: owned > 0
                  ? `1px solid ${rarityColor}55`
                  : `1px solid ${warmTheme.border}`,
                borderRadius: 12,
                padding: '10px 10px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                opacity: owned > 0 ? 1 : 0.45,
                transition: 'opacity 0.15s',
              }}
            >
              {/* Rarity + type row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 8, color: rarityColor, letterSpacing: 1, textTransform: 'uppercase' }}>
                  {card.rarity}
                </span>
                <span style={{ fontSize: 8, color: typeColor, letterSpacing: 1, textTransform: 'uppercase' }}>
                  {card.type}
                </span>
              </div>

              {/* Name */}
              <div style={{
                fontSize: 11, fontWeight: 'bold',
                color: owned > 0 ? warmTheme.accentDeep : warmTheme.textMuted,
                lineHeight: 1.3,
                minHeight: 28,
              }}>
                {card.name}
              </div>

              {/* Description */}
              <div style={{
                fontSize: 9, color: warmTheme.textSoft, lineHeight: 1.4,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                overflow: 'hidden', flexGrow: 1,
              }}>
                {owned > 0 ? card.description : '???'}
              </div>

              {/* Owned count */}
              <div style={{
                marginTop: 4, fontSize: 9, letterSpacing: 1,
                color: owned > 0 ? warmTheme.textMuted : warmTheme.textFaint,
                textAlign: 'right',
              }}>
                {owned > 0 ? `×${owned} owned` : 'Not owned'}
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
