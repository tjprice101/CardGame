import { memo, useMemo } from 'react';
import { formatReadableRuleText, getCardSummarySections } from '@/ui/cardStatSummary';
import type { AbilityTextMode } from '@/ui/cardStatSummary';
import type { CardDefinition } from '@/types/cards';
import { useStore } from '@/state/store';
import { highlightRulesText } from '@/ui/text/highlightRulesText';

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
  abilityTextMode = 'infinite-eternal-canonical',
  lightBg = false,
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
  abilityTextMode?: AbilityTextMode;
  lightBg?: boolean;
}) {
  const highlightEnabled = useStore(state => state.settings.highlightRulesText !== false);
  const sections = useMemo(() => {
    const all = getCardSummarySections(card, { abilityTextMode });
    const detailBase = all.filter(s => s.title !== 'Rules');
    const hasSpecificSections = detailBase.some(s => s.title !== 'Ability');
    const structured = hasSpecificSections
      ? detailBase.filter(s => s.title !== 'Ability' && s.title !== 'Effect' && s.title !== 'On Play' && s.title !== 'Play' && s.title !== 'Hooks')
      : detailBase;
    const visible = variant === 'preview'
      ? structured.filter(section => section.title !== 'Source')
      : structured;
    const readable = visible.map(section => ({
      ...section,
      lines: section.lines.map(formatReadableRuleText),
    }));
    return readable.slice(0, maxSections ?? (variant === 'preview' ? 3 : Number.MAX_SAFE_INTEGER));
  }, [abilityTextMode, card, maxSections, variant]);
  if (sections.length === 0) return null;

  if (variant === 'preview') {
    return (
      <div style={{ display: 'grid', gap: 6 }}>
        {sections.map(section => (
          <div
            key={section.title}
            style={{
              border: `1px solid ${sectionBorder}`,
              background: sectionBackground,
              borderRadius: 6,
              padding: '6px 7px',
              minWidth: 0,
            }}
          >
            <div style={{
              fontSize: 7,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: labelColor,
              fontWeight: 700,
              marginBottom: 4,
              fontFamily: 'Georgia, serif',
            }}>
              {section.title}
            </div>
            <div style={{ display: 'grid', gap: 3 }}>
              {section.lines.slice(0, maxLinesPerSection ?? 1).map((line, index) => (
                <div
                  key={`${section.title}-${index}`}
                  style={{
                    fontSize: 9,
                    lineHeight: 1.32,
                    color: textColor,
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: lineClamp,
                    overflow: 'hidden',
                    fontFamily: 'Georgia, serif',
                  }}
                >
                  {highlightRulesText(line, { disabled: !highlightEnabled, compact: true, lightBg })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
      gap: '0 18px',
      alignItems: 'start',
    }}>
      {sections.map(section => (
        <div
          key={section.title}
          style={{
            borderTop: `1px solid ${sectionBorder}`,
            background: sectionBackground,
            padding: '9px 4px 10px',
            minWidth: 0,
          }}
        >
          <div style={{
            fontSize: 10,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: labelColor,
            fontWeight: 700,
            marginBottom: 5,
            fontFamily: 'Georgia, serif',
          }}>
            {section.title}
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            {section.lines.slice(0, maxLinesPerSection ?? section.lines.length).map((line, index) => (
              <div
                key={`${section.title}-${index}`}
                style={{
                  fontSize: 11,
                  lineHeight: 1.38,
                  color: textColor,
                  fontFamily: 'Georgia, serif',
                }}
              >
                {highlightRulesText(line, { disabled: !highlightEnabled, lightBg })}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(CardRulesDigest);