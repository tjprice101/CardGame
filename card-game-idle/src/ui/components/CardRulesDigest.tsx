import { memo, useMemo } from 'react';
import { getCardSummarySections } from '@/ui/cardStatSummary';
import type { CardDefinition } from '@/types/cards';

type Variant = 'preview' | 'detail';

function CardRulesDigest({
  card,
  variant = 'detail',
  maxSections,
  maxLinesPerSection,
  lineClamp = 2,
  labelColor = 'rgba(243, 230, 211, 0.54)',
  textColor = 'rgba(243, 230, 211, 0.84)',
  sectionBackground = 'rgba(255,255,255,0.03)',
  sectionBorder = 'rgba(255,255,255,0.08)',
}: {
  card: CardDefinition;
  variant?: Variant;
  maxSections?: number;
  maxLinesPerSection?: number;
  lineClamp?: number;
  labelColor?: string;
  textColor?: string;
  sectionBackground?: string;
  sectionBorder?: string;
}) {
  const sections = useMemo(() => {
    const all = getCardSummarySections(card);
    // In preview mode, filter out 'On Play' and 'Play' — the 'Ability' section already
    // contains the canonical description which includes on-play text.
    const visible = variant === 'preview'
      ? all.filter(s => s.title !== 'On Play' && s.title !== 'Play')
      : all;
    return visible.slice(0, maxSections ?? (variant === 'preview' ? 3 : Number.MAX_SAFE_INTEGER));
  }, [card, maxSections, variant]);
  if (sections.length === 0) return null;

  if (variant === 'preview') {
    return (
      <div style={{ display: 'grid', gap: 4 }}>
        {sections.map(section => (
          section.lines.slice(0, maxLinesPerSection ?? 1).map((line, index) => (
            <div
              key={`${section.title}-${index}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto minmax(0, 1fr)',
                gap: 6,
                alignItems: 'start',
              }}
            >
              <div style={{
                fontSize: 7,
                letterSpacing: 0.9,
                textTransform: 'uppercase',
                color: labelColor,
                fontWeight: 700,
                marginTop: 1,
              }}>
                {section.title}
              </div>
              <div style={{
                fontSize: 9,
                lineHeight: 1.35,
                color: textColor,
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: lineClamp,
                overflow: 'hidden',
              }}>
                {line}
              </div>
            </div>
          ))
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {sections.map(section => (
        <div
          key={section.title}
          style={{
            borderRadius: 10,
            border: `1px solid ${sectionBorder}`,
            background: sectionBackground,
            padding: '9px 10px',
          }}
        >
          <div style={{
            fontSize: 10,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: labelColor,
            fontWeight: 700,
            marginBottom: 6,
          }}>
            {section.title}
          </div>
          <div style={{ display: 'grid', gap: 5 }}>
            {section.lines.slice(0, maxLinesPerSection ?? section.lines.length).map((line, index) => (
              <div
                key={`${section.title}-${index}`}
                style={{
                  fontSize: 11.5,
                  lineHeight: 1.45,
                  color: textColor,
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(CardRulesDigest);