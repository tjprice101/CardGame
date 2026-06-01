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
    // Preview: hide 'On Play'/'Play'/'Hooks' — 'Ability' already summarises them.
    // Detail: keep all sections so authored card description and mechanical breakdown
    // are both visible in stat menus.
    const visible = variant === 'preview'
      ? all.filter(s => s.title !== 'On Play' && s.title !== 'Play' && s.title !== 'Hooks')
      : all;
    const readable = visible.map(section => ({
      ...section,
      lines: section.lines.map(formatReadableRuleText),
    }));
    return readable.slice(0, maxSections ?? (variant === 'preview' ? 3 : Number.MAX_SAFE_INTEGER));
  }, [abilityTextMode, card, maxSections, variant]);
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
                fontFamily: 'Georgia, serif',
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
                fontFamily: 'Georgia, serif',
              }}>
                {highlightRulesText(line, { disabled: !highlightEnabled, compact: true, lightBg })}
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
            fontFamily: 'Georgia, serif',
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