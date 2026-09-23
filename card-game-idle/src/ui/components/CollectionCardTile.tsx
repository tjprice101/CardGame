import type { CSSProperties, ReactNode } from 'react';
import type { CardDefinition } from '@/types/cards';
import {
  cardFacePalette,
  getCardArtTopBottomBorderOverlayStyleForCard,
  getCardFaceMetrics,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';
import { getDisplayCardTypeLabel } from '@/ui/preferences';
import { getCardPreviewLines } from '@/ui/cardStatSummary';
import { CARD_COLLECTION_TILE_HEIGHT, CARD_COLLECTION_TILE_WIDTH } from '@/ui/cardTileMetrics';

interface Props {
  card: CardDefinition;
  owned: number;
  surfaceStyle: CSSProperties;
  className?: string;
  border: string;
  onClick?: () => void;
  title?: string;
  finishLabel?: string | null;
  topOverlay?: ReactNode;
  cornerOverlay?: ReactNode;
  footerRight?: string;
}

export default function CollectionCardTile({
  card,
  owned,
  surfaceStyle,
  className,
  border,
  onClick,
  title,
  finishLabel,
  topOverlay,
  cornerOverlay,
  footerRight,
}: Props) {
  const metrics = getCardFaceMetrics('grid');
  const previewText = getCardPreviewLines(card, 3).join(' ');

  return (
    <div
      className={className}
      onClick={onClick}
      title={title}
      style={{
        width: CARD_COLLECTION_TILE_WIDTH,
        height: CARD_COLLECTION_TILE_HEIGHT,
        ...surfaceStyle,
        border,
        borderRadius: 12,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {topOverlay}
      <div style={getCardArtTopBottomBorderOverlayStyleForCard(card)} />
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={getCardNameRibbonStyle('grid')}>
          <div style={{ fontSize: metrics.typeSize, color: cardFacePalette.textMuted, letterSpacing: 1.4, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 }}>
            {finishLabel ? `${getDisplayCardTypeLabel(card.type)} · ${finishLabel}` : getDisplayCardTypeLabel(card.type)}
          </div>
          <div style={{ fontSize: metrics.nameSize, fontWeight: 'bold', color: cardFacePalette.text, lineHeight: 1.25, minHeight: 24, textAlign: 'center' }}>
            {card.name}
          </div>
        </div>
        <div style={getCardRulesPanelStyle('grid')}>
          <div style={{ fontSize: metrics.descSize, color: cardFacePalette.textSoft, lineHeight: metrics.descLineHeight, textAlign: 'center', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden' }}>
            {previewText}
          </div>
          <div style={{ marginTop: 6, fontSize: 10, letterSpacing: 1, color: cardFacePalette.textMuted, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ textTransform: 'uppercase' }}>{card.rarity}</span>
            <span>{footerRight ?? `×${owned} discovered`}</span>
          </div>
        </div>
      </div>
      {cornerOverlay}
    </div>
  );
}
