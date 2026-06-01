import { useMemo } from 'react';
import { CardRegistry } from '@/cards/CardRegistry';
import {
  cardFacePalette,
  getCardFaceBackgroundStyle,
  getCardFaceMetrics,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';
import CardRulesDigest from '@/ui/components/CardRulesDigest';
import { getDisplayCardTypeLabel } from '@/ui/preferences';
import { getCardPreviewLines } from '@/ui/cardStatSummary';
import { uiTypography } from '@/ui/theme';
import { buildCoreMechanicContent } from './coreMechanicContent';
import type { CardDefinition } from '@/types/cards';

interface Props {
  packId: string;
  packName: string;
  cardPool: string[];
  onClose: () => void;
  onStartTrial: (packId: string) => void;
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'radial-gradient(circle at 50% 12%, rgba(106, 195, 245, 0.16) 0%, rgba(106, 195, 245, 0) 42%), rgba(3, 8, 18, 0.92)',
    zIndex: 230,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    fontFamily: uiTypography.body,
  },
  modal: {
    width: 'min(1280px, 96vw)',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 16,
    border: '1px solid rgba(110, 165, 220, 0.42)',
    background: 'linear-gradient(180deg, rgba(5, 12, 24, 0.98) 0%, rgba(3, 8, 18, 0.98) 100%)',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.82)',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 18px 14px',
    borderBottom: '1px solid rgba(110, 165, 220, 0.28)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    background: 'linear-gradient(180deg, rgba(23, 44, 76, 0.35) 0%, rgba(5, 12, 24, 0) 100%)',
  },
  title: {
    fontSize: 20,
    letterSpacing: 1.2,
    fontWeight: 700,
    color: '#b6e4ff',
    fontFamily: uiTypography.display,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: 'rgba(195, 224, 245, 0.78)',
    letterSpacing: 0.4,
    lineHeight: 1.5,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  trialBtn: {
    padding: '8px 12px',
    borderRadius: 9,
    border: '1px solid rgba(130, 210, 150, 0.54)',
    background: 'linear-gradient(180deg, rgba(58, 134, 86, 0.36) 0%, rgba(26, 76, 52, 0.36) 100%)',
    color: '#8de8a8',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.7,
    fontFamily: uiTypography.body,
    cursor: 'pointer',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: '1px solid rgba(110, 165, 220, 0.42)',
    background: 'rgba(6, 16, 32, 0.8)',
    color: '#9fcae8',
    fontSize: 16,
    cursor: 'pointer',
    fontFamily: uiTypography.body,
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px 18px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  sectionCard: {
    borderRadius: 12,
    border: '1px solid rgba(110, 165, 220, 0.24)',
    background: 'linear-gradient(180deg, rgba(8, 18, 34, 0.8) 0%, rgba(4, 10, 22, 0.8) 100%)',
    padding: '12px 14px',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#7dd4f8',
    marginBottom: 8,
  },
  introText: {
    fontSize: 12,
    color: 'rgba(207, 228, 245, 0.9)',
    lineHeight: 1.6,
    whiteSpace: 'pre-line' as const,
  },
  guideGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 10,
  },
  guideTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#b4def6',
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  guideBody: {
    fontSize: 11,
    color: 'rgba(200, 220, 235, 0.9)',
    lineHeight: 1.55,
    whiteSpace: 'pre-line' as const,
  },
  playstyleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 10,
  },
  playstyleTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#9fd6ff',
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  playstyleLine: {
    fontSize: 11,
    color: 'rgba(205, 226, 242, 0.92)',
    lineHeight: 1.55,
    marginBottom: 6,
  },
  splitGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 10,
  },
  detailTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#9fd6ff',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  detailLine: {
    fontSize: 11,
    color: 'rgba(205, 226, 242, 0.9)',
    lineHeight: 1.55,
    marginBottom: 8,
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
    gap: 10,
  },
  cardShell: {
    position: 'relative',
    width: '100%',
    height: 255,
    borderRadius: 10,
    border: '1px solid rgba(110, 165, 220, 0.32)',
    overflow: 'hidden',
    boxShadow: '0 8px 18px rgba(0, 0, 0, 0.45)',
  },
  cardType: {
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    color: cardFacePalette.textMuted,
    textAlign: 'center' as const,
    marginBottom: 3,
  },
  cardName: {
    fontWeight: 700,
    color: cardFacePalette.text,
    textAlign: 'center' as const,
    lineHeight: 1.3,
  },
  cardFooter: {
    marginTop: 8,
    fontSize: 10,
    lineHeight: 1.45,
    color: 'rgba(203, 225, 242, 0.88)',
  },
  cardFooterLine: {
    display: 'block',
  },
};

function ExampleCardTile({ def }: { def: CardDefinition }) {
  const metrics = getCardFaceMetrics('pack');
  const previewLines = getCardPreviewLines(def, 2);

  return (
    <div>
      <div style={{ ...styles.cardShell, ...getCardFaceBackgroundStyle(def) }}>
        <div style={getCardNameRibbonStyle('pack')}>
          <div style={{ ...styles.cardType, fontSize: metrics.typeSize }}>
            {getDisplayCardTypeLabel(def.type)}
          </div>
          <div style={{ ...styles.cardName, fontSize: metrics.nameSize }}>{def.name}</div>
        </div>
        <div style={getCardRulesPanelStyle('pack')}>
          <CardRulesDigest
            card={def}
            variant="preview"
            maxSections={4}
            maxLinesPerSection={10}
            lineClamp={3}
            labelColor={cardFacePalette.textMuted}
            textColor={cardFacePalette.textSoft}
            sectionBackground="transparent"
            sectionBorder="transparent"
            lightBg={true}
          />
        </div>
      </div>
      <div style={styles.cardFooter}>
        {previewLines.length > 0 ? previewLines.map(line => (
          <span key={line} style={styles.cardFooterLine}>{line}</span>
        )) : <span style={styles.cardFooterLine}>{def.description}</span>}
      </div>
    </div>
  );
}

export default function CoreMechanicEngineModal({
  packId,
  packName,
  cardPool,
  onClose,
  onStartTrial,
}: Props) {
  const content = useMemo(() => buildCoreMechanicContent(packId, cardPool), [packId, cardPool]);

  const exampleCards = useMemo(() => {
    if (!content) return [] as CardDefinition[];
    return content.exampleCardIds
      .map(id => CardRegistry.get(id))
      .filter((d): d is CardDefinition => d !== undefined);
  }, [content]);

  if (!content) {
    return (
      <div style={styles.backdrop} onClick={onClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <div style={styles.header}>
            <div>
              <div style={styles.title}>Core Mechanic Engine</div>
              <div style={styles.subtitle}>{packName}</div>
            </div>
            <button type="button" onClick={onClose} style={styles.closeBtn}>x</button>
          </div>
          <div style={styles.body}>
            <div style={styles.sectionCard}>
              <div style={styles.sectionTitle}>No Guide Data</div>
              <div style={styles.introText}>This set does not currently expose engine guide data. Trial Deck is still available through the button below.</div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => { onStartTrial(packId); onClose(); }} style={styles.trialBtn}>Start Trial Deck</button>
                <button type="button" onClick={onClose} style={styles.closeBtn}>x</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <div style={styles.title}>Core Mechanic Engine</div>
            <div style={styles.subtitle}>{packName} - {content.title.replace('User Guide to: ', '')}</div>
          </div>
          <div style={styles.headerActions}>
            <button type="button" onClick={() => { onStartTrial(packId); onClose(); }} style={styles.trialBtn}>Start Trial Deck</button>
            <button type="button" onClick={onClose} style={styles.closeBtn}>x</button>
          </div>
        </div>

        <div style={styles.body}>
          <div style={styles.sectionCard}>
            <div style={styles.sectionTitle}>Core Loop Overview</div>
            <div style={styles.introText}>{content.intro}</div>
          </div>

          <div style={styles.sectionCard}>
            <div style={styles.sectionTitle}>Detailed Engine Breakdown</div>
            <div style={styles.guideGrid}>
              {content.sections.map(section => (
                <div key={section.heading} style={styles.sectionCard}>
                  <div style={styles.guideTitle}>{section.heading}</div>
                  <div style={styles.guideBody}>{section.body}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.sectionCard}>
            <div style={styles.sectionTitle}>Example Playstyles</div>
            <div style={styles.playstyleGrid}>
              {content.playstyles.map(style => (
                <div key={style.name} style={styles.sectionCard}>
                  <div style={styles.playstyleTitle}>{style.name}</div>
                  <div style={styles.playstyleLine}><strong>Pattern:</strong> {style.pattern}</div>
                  <div style={styles.playstyleLine}><strong>Pilot Tips:</strong> {style.pilotTips}</div>
                  <div style={styles.playstyleLine}><strong>Win Condition:</strong> {style.winCondition}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.sectionCard}>
            <div style={styles.sectionTitle}>Advanced Lines and Mistake Proofing</div>
            <div style={styles.splitGrid}>
              <div style={styles.sectionCard}>
                <div style={styles.detailTitle}>Advanced Sequencing Lines</div>
                {content.advancedLines.map(line => (
                  <div key={line.name} style={styles.detailLine}>
                    <strong>{line.name}:</strong> {line.sequence}
                    <br />
                    <strong>Why it works:</strong> {line.whyItWorks}
                  </div>
                ))}
              </div>
              <div style={styles.sectionCard}>
                <div style={styles.detailTitle}>Common Mistakes to Avoid</div>
                {content.commonMistakes.map(item => (
                  <div key={item.mistake} style={styles.detailLine}>
                    <strong>Mistake:</strong> {item.mistake}
                    <br />
                    <strong>Consequence:</strong> {item.consequence}
                    <br />
                    <strong>Correction:</strong> {item.correction}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {content.exampleEffects.length > 0 && (
            <div style={styles.sectionCard}>
              <div style={styles.sectionTitle}>Example Effects in Real Lines</div>
              <div style={styles.guideGrid}>
                {content.exampleEffects.map(example => (
                  <div key={`${example.cardName}:${example.effectSummary}`} style={styles.sectionCard}>
                    <div style={styles.guideTitle}>{example.cardName}</div>
                    <div style={styles.guideBody}>{example.effectSummary}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={styles.sectionCard}>
            <div style={styles.sectionTitle}>Example Cards and Effects</div>
            <div style={styles.cardGrid}>
              {exampleCards.map(def => <ExampleCardTile key={def.definitionId} def={def} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
