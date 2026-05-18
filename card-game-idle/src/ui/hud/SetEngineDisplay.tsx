import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore, selectBoard, selectDeck, selectTurn } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import {
  getEngineKeyForCard,
  getSetEngineContributorsForCards,
  getSetEngineSnapshotsForCards,
  type EngineContributor,
  type EngineKey,
  type EngineMetric,
  type SetEngineSnapshot,
  SET_ENGINE_GUIDES,
  type EngineGuide,
} from '@/ui/setEngineSummary';
import { getCardPreviewLines } from '@/ui/cardStatSummary';
import type { CardDefinition } from '@/types/cards';

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'relative',
    width: '100%',
    background: 'radial-gradient(circle at 18% 0%, rgba(255, 218, 170, 0.16) 0%, rgba(255, 218, 170, 0) 34%), linear-gradient(180deg, rgba(22, 16, 13, 0.96) 0%, rgba(10, 7, 6, 0.95) 100%)',
    border: '1px solid rgba(219, 171, 106, 0.28)',
    borderRadius: 18,
    padding: '12px 12px 14px',
    color: '#f3e6d3',
    fontFamily: 'Georgia, serif',
    boxShadow: '0 18px 48px rgba(0,0,0,0.46), 0 0 24px rgba(219, 171, 106, 0.12)',
    backdropFilter: 'blur(14px)',
    pointerEvents: 'auto',
    zIndex: 1,
    maxHeight: 'min(520px, calc(100vh - 250px))',
    overflowY: 'auto',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: 'rgba(243, 230, 211, 0.58)',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 1.35,
    color: 'rgba(243, 230, 211, 0.82)',
  },
  atlasButton: {
    borderRadius: 999,
    border: '1px solid rgba(227, 185, 120, 0.46)',
    background: 'linear-gradient(180deg, rgba(236, 195, 136, 0.16) 0%, rgba(131, 85, 37, 0.24) 100%)',
    color: '#f6ddbb',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    boxShadow: '0 8px 20px rgba(0,0,0,0.24)',
  },
  panelActionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  collapseButton: {
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(255,255,255,0.04)',
    color: '#f0e2cd',
    cursor: 'pointer',
    padding: '8px 10px',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dockBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    borderRadius: 999,
    padding: '4px 9px',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    border: '1px solid rgba(255,255,255,0.12)',
  },
  tabRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.16)',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(243, 230, 211, 0.74)',
    padding: '6px 10px',
    fontSize: 10,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'border-color 0.18s ease, color 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease',
  },
  tabMeta: {
    marginTop: 4,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(243, 230, 211, 0.52)',
  },
  activeCard: {
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)',
    padding: '12px 12px 10px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
  },
  label: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: 700,
  },
  tagline: {
    marginTop: 5,
    fontSize: 18,
    lineHeight: 1.15,
    color: '#fff3df',
  },
  summary: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 1.45,
    color: 'rgba(243, 230, 211, 0.78)',
  },
  compactLine: {
    marginTop: 10,
    fontSize: 11,
    color: 'rgba(243, 230, 211, 0.64)',
    lineHeight: 1.35,
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 8,
    marginTop: 12,
  },
  metricCard: {
    borderRadius: 12,
    padding: '8px 9px',
    background: 'rgba(8, 7, 8, 0.36)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  metricLabel: {
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: 'rgba(243, 230, 211, 0.48)',
  },
  metricValue: {
    marginTop: 4,
    fontSize: 14,
    color: '#fff4e2',
    fontWeight: 700,
  },
  metricHint: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 1.35,
    color: 'rgba(243, 230, 211, 0.56)',
  },
  section: {
    marginTop: 12,
    borderTop: '1px solid rgba(255,255,255,0.08)',
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: 'rgba(243, 230, 211, 0.48)',
    marginBottom: 8,
  },
  nextStep: {
    borderRadius: 12,
    padding: '9px 10px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  nextStepTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#fff0d9',
  },
  nextStepDetail: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 1.4,
    color: 'rgba(243, 230, 211, 0.72)',
  },
  contributorRow: {
    display: 'grid',
    gap: 8,
  },
  contributorCard: {
    borderRadius: 12,
    padding: '9px 10px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  contributorName: {
    fontSize: 12,
    color: '#fff4e2',
    fontWeight: 700,
  },
  contributorMeta: {
    marginTop: 3,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(243, 230, 211, 0.54)',
  },
  contributorRole: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 1.4,
    color: 'rgba(243, 230, 211, 0.78)',
  },
  contributorAbilityBlock: {
    marginTop: 8,
    display: 'grid',
    gap: 5,
  },
  contributorAbilityLine: {
    fontSize: 11,
    lineHeight: 1.4,
    color: '#fff4e2',
  },
  contributorAngleLabel: {
    marginTop: 8,
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: 'rgba(243, 230, 211, 0.46)',
  },
  hint: {
    marginTop: 10,
    fontSize: 11,
    color: 'rgba(243, 230, 211, 0.56)',
    lineHeight: 1.4,
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(3, 2, 4, 0.76)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 320,
    backdropFilter: 'blur(6px)',
    pointerEvents: 'auto',
  },
  modal: {
    width: 'min(1120px, calc(100vw - 32px))',
    maxHeight: 'calc(100vh - 32px)',
    display: 'grid',
    gridTemplateColumns: '260px minmax(0, 1fr)',
    overflow: 'hidden',
    borderRadius: 24,
    border: '1px solid rgba(222, 178, 113, 0.24)',
    background: 'radial-gradient(circle at 16% 0%, rgba(255, 216, 163, 0.14) 0%, rgba(255, 216, 163, 0) 26%), linear-gradient(180deg, rgba(19, 13, 11, 0.98) 0%, rgba(8, 6, 7, 0.98) 100%)',
    boxShadow: '0 28px 80px rgba(0,0,0,0.62)',
  },
  modalRail: {
    borderRight: '1px solid rgba(255,255,255,0.08)',
    padding: '18px 14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    overflowY: 'auto',
  },
  modalRailTitle: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(243, 230, 211, 0.44)',
    padding: '0 6px',
  },
  modalRailIntro: {
    fontSize: 12,
    lineHeight: 1.45,
    color: 'rgba(243, 230, 211, 0.68)',
    padding: '0 6px 6px',
  },
  railButton: {
    width: '100%',
    textAlign: 'left',
    borderRadius: 16,
    padding: '12px 12px 11px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    cursor: 'pointer',
    color: '#f4e7d4',
  },
  railCompact: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 1.35,
    color: 'rgba(243, 230, 211, 0.64)',
  },
  railStatus: {
    marginTop: 7,
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '4px 8px',
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: 'rgba(243, 230, 211, 0.64)',
  },
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    padding: '20px 22px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  modalHeaderTitle: {
    fontSize: 11,
    letterSpacing: 2.1,
    textTransform: 'uppercase',
    color: 'rgba(243, 230, 211, 0.46)',
  },
  modalHeaderText: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 1.4,
    color: 'rgba(243, 230, 211, 0.78)',
  },
  closeButton: {
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(255,255,255,0.04)',
    color: '#f0e2cd',
    cursor: 'pointer',
    padding: '8px 12px',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  modalScroll: {
    overflowY: 'auto',
    padding: '20px 22px 24px',
  },
  heroCard: {
    borderRadius: 20,
    padding: '18px 18px 16px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
  },
  heroTagline: {
    marginTop: 8,
    fontSize: 26,
    lineHeight: 1.08,
    color: '#fff4e2',
  },
  heroSummary: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 1.55,
    color: 'rgba(243, 230, 211, 0.78)',
    maxWidth: 760,
  },
  heroDetail: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 1.45,
    color: 'rgba(243, 230, 211, 0.58)',
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 16,
    marginTop: 18,
  },
  modalSectionCard: {
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    padding: '14px 14px 12px',
  },
  emptyState: {
    fontSize: 12,
    lineHeight: 1.45,
    color: 'rgba(243, 230, 211, 0.5)',
    fontStyle: 'italic',
  },
  restoreButton: {
    position: 'relative',
    alignSelf: 'stretch',
    borderRadius: 999,
    border: '1px solid rgba(219, 171, 106, 0.32)',
    background: 'linear-gradient(180deg, rgba(22, 16, 13, 0.96) 0%, rgba(10, 7, 6, 0.95) 100%)',
    color: '#f6ddbb',
    padding: '10px 14px',
    cursor: 'pointer',
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    boxShadow: '0 14px 28px rgba(0,0,0,0.36), 0 0 16px rgba(219, 171, 106, 0.12)',
    zIndex: 1,
    textAlign: 'center',
    pointerEvents: 'auto',
  },
  guideButton: {
    borderRadius: 999,
    border: '1px solid rgba(180, 220, 255, 0.38)',
    background: 'linear-gradient(180deg, rgba(160, 200, 255, 0.14) 0%, rgba(80, 130, 200, 0.20) 100%)',
    color: '#c8e4ff',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    boxShadow: '0 8px 20px rgba(0,0,0,0.24)',
  },
  guideModal: {
    width: 'min(860px, calc(100vw - 32px))',
    maxHeight: 'calc(100vh - 40px)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    borderRadius: 24,
    border: '1px solid rgba(160, 200, 255, 0.20)',
    background: 'radial-gradient(circle at 20% 0%, rgba(140, 190, 255, 0.10) 0%, rgba(140, 190, 255, 0) 30%), linear-gradient(180deg, rgba(14, 16, 26, 0.99) 0%, rgba(7, 9, 18, 0.99) 100%)',
    boxShadow: '0 28px 80px rgba(0,0,0,0.70)',
  },
  guideHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    padding: '20px 24px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  guideIntro: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 1.5,
    color: 'rgba(200, 228, 255, 0.78)',
    maxWidth: 640,
  },
  guideSwitchRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
    padding: '14px 24px 0',
    flexShrink: 0,
  },
  guideTab: {
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(200, 228, 255, 0.70)',
    padding: '6px 12px',
    fontSize: 10,
    letterSpacing: 0.9,
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
  },
  guideScroll: {
    overflowY: 'auto' as const,
    padding: '20px 24px 28px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  guideSection: {
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    padding: '14px 16px 13px',
  },
  guideSectionHeading: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.8,
    color: '#c8e4ff',
    marginBottom: 8,
  },
  guideSectionBody: {
    fontSize: 13,
    lineHeight: 1.6,
    color: 'rgba(200, 228, 255, 0.80)',
    whiteSpace: 'pre-line' as const,
  },
};

type EnginePresence = 'live' | 'inHand' | 'inDeck' | 'catalog';

function getPresenceLabel(presence: EnginePresence): string {
  switch (presence) {
    case 'live': return 'Live';
    case 'inHand': return 'In Hand';
    case 'inDeck': return 'In Deck';
    case 'catalog': return 'Not In Deck';
  }
}

function getPresenceColor(presence: EnginePresence, accent: string): string {
  switch (presence) {
    case 'live': return accent;
    case 'inHand': return '#f6ddbb';
    case 'inDeck': return 'rgba(243, 230, 211, 0.8)';
    case 'catalog': return 'rgba(243, 230, 211, 0.48)';
  }
}

function getPresenceHint(presence: EnginePresence, label: string): string {
  switch (presence) {
    case 'live':
      return `${label} is currently active on the board or in the immediate line. Use this tab for live turn sequencing.`;
    case 'inHand':
      return `${label} pieces are already in hand. This tab is actionable right now even if the board is not yet anchored.`;
    case 'inDeck':
      return `${label} is part of the current deck, but not currently live. Use this tab to plan the draw and payoff line.`;
    case 'catalog':
      return `${label} is not in the current deck. This tab stays available as a rules reference for the set engine.`;
  }
}

function getEmptyHandState(presence: EnginePresence): string {
  switch (presence) {
    case 'live':
      return 'This engine is live, but no matching hand cards are available right now. Keep sequencing the board or draw into the next piece.';
    case 'inHand':
      return 'This set is flagged as in hand, but no contributor cards were surfaced. Draw order likely changed; reopen the tab after the next state update.';
    case 'inDeck':
      return 'This set is in the current deck, but no hand cards from it are available yet. Draw deeper or pivot to another live engine tab.';
    case 'catalog':
      return 'This set is not in the current deck. This tab is a reference view only until you add the set to a deck.';
  }
}

function getEmptyBoardState(presence: EnginePresence): string {
  switch (presence) {
    case 'live':
      return 'The engine is active in the line, but nothing from this set is currently anchored on the board.';
    case 'inHand':
      return 'Cards from this set are in hand, but the board has not committed to them yet.';
    case 'inDeck':
      return 'This set is in the deck, but the board has not anchored it yet.';
    case 'catalog':
      return 'This set is not in the current deck, so there are no board anchors to show.';
  }
}

function getCurrentReadoutHint(presence: EnginePresence): string {
  switch (presence) {
    case 'live':
      return 'This readout is live for the current turn. Use the hand and board sections to decide the next set card to play.';
    case 'inHand':
      return 'This readout is partially actionable. The set is in hand, but the board state still needs to commit to it.';
    case 'inDeck':
      return 'This readout is forward-looking. The set exists in the deck, but you still need to draw into it.';
    case 'catalog':
      return 'This readout is reference-only because the set is not present in the current deck.';
  }
}

function MetricTile({ metric, accent }: { metric: EngineMetric; accent: string }) {
  return (
    <div style={{ ...styles.metricCard, boxShadow: `inset 0 0 0 1px ${accent}18` }}>
      <div style={styles.metricLabel}>{metric.label}</div>
      <div style={{ ...styles.metricValue, color: accent }}>{metric.value}</div>
      <div style={styles.metricHint}>{metric.hint}</div>
    </div>
  );
}

function ContributorCard({ contributor }: { contributor: EngineContributor }) {
  const definition = CardRegistry.get(contributor.definitionId);
  // Compute once; slice for the 2-line summary, reuse all 4 for the tooltip
  const allPreviewLines = definition ? getCardPreviewLines(definition, 4) : [];
  const previewLines = allPreviewLines.slice(0, 2);

  return (
    <div
      title={definition ? allPreviewLines.join('\n') : contributor.role.text}
      style={{ ...styles.contributorCard, boxShadow: `inset 0 0 0 1px ${contributor.role.accent}16` }}
    >
      <div style={styles.contributorName}>
        {contributor.name}
        {contributor.count > 1 ? ` ×${contributor.count}` : ''}
      </div>
      <div style={styles.contributorMeta}>
        {contributor.type} · {contributor.role.badge}
      </div>
      {previewLines.length > 0 && (
        <div style={styles.contributorAbilityBlock}>
          {previewLines.map(line => (
            <div key={line} style={styles.contributorAbilityLine}>{line}</div>
          ))}
        </div>
      )}
      <div style={styles.contributorAngleLabel}>Engine angle</div>
      <div style={styles.contributorRole}>{contributor.role.text}</div>
    </div>
  );
}

function EngineGuideModal({
  guide,
  snapshots,
  activeKey,
  onSelect,
  onClose,
}: {
  guide: EngineGuide;
  snapshots: SetEngineSnapshot[];
  activeKey: EngineKey;
  onSelect: (key: EngineKey) => void;
  onClose: () => void;
}) {
  const activeSnapshot = snapshots.find(s => s.key === activeKey) ?? snapshots[0];

  const modal = (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.guideModal} onClick={e => e.stopPropagation()}>
        <div style={styles.guideHeader}>
          <div>
            <div style={{ ...styles.label, color: activeSnapshot.accent }}>{guide.title}</div>
            <div style={styles.guideIntro}>{guide.intro}</div>
          </div>
          <button type="button" onClick={e => { e.stopPropagation(); onClose(); }} style={styles.closeButton}>
            Close
          </button>
        </div>

        <div style={styles.guideSwitchRow}>
          {snapshots.map(snapshot => {
            const g = SET_ENGINE_GUIDES[snapshot.key];
            if (!g) return null;
            return (
              <button
                key={snapshot.key}
                type="button"
                onClick={() => onSelect(snapshot.key)}
                style={{
                  ...styles.guideTab,
                  border: snapshot.key === activeKey ? `1px solid ${snapshot.accent}` : styles.guideTab.border,
                  color: snapshot.key === activeKey ? snapshot.accent : styles.guideTab.color,
                }}
              >
                {snapshot.label}
              </button>
            );
          })}
        </div>

        <div style={styles.guideScroll}>
          {guide.sections.map(section => (
            <div key={section.heading} style={styles.guideSection}>
              <div style={styles.guideSectionHeading}>{section.heading}</div>
              <div style={styles.guideSectionBody}>{section.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return modal;
  return createPortal(modal, document.body);
}

function EngineAtlasModal({
  snapshots,
  activeKey,
  onSelect,
  onClose,
  handDefinitions,
  boardDefinitions,
  getPresence,
}: {
  snapshots: SetEngineSnapshot[];
  activeKey: EngineKey;
  onSelect: (key: EngineKey) => void;
  onClose: () => void;
  handDefinitions: CardDefinition[];
  boardDefinitions: CardDefinition[];
  getPresence: (key: EngineKey) => EnginePresence;
}) {
  const activeSnapshot = snapshots.find(snapshot => snapshot.key === activeKey) ?? snapshots[0];
  const handContributors = getSetEngineContributorsForCards(handDefinitions, activeSnapshot.key, 5);
  const boardContributors = getSetEngineContributorsForCards(boardDefinitions, activeSnapshot.key, 4);
  const activePresence = getPresence(activeSnapshot.key);
  const activePresenceColor = getPresenceColor(activePresence, activeSnapshot.accent);

  const modal = (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modal} onClick={event => event.stopPropagation()}>
        <div style={styles.modalRail}>
          <div style={styles.modalRailTitle}>Engine Atlas</div>
          <div style={styles.modalRailIntro}>
            Set engines are played through cards, not a separate activation button. Use this atlas to read the current state and pick the next card that advances it.
          </div>
          {snapshots.map(snapshot => (
            <button
              key={snapshot.key}
              type="button"
              onClick={() => onSelect(snapshot.key)}
              aria-pressed={snapshot.key === activeSnapshot.key}
              style={{
                ...styles.railButton,
                border: snapshot.key === activeSnapshot.key ? `1px solid ${snapshot.accent}` : styles.railButton.border,
                background: snapshot.key === activeSnapshot.key
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
                  : styles.railButton.background,
                boxShadow: snapshot.key === activeSnapshot.key ? `0 0 18px ${snapshot.accent}22` : 'none',
              }}
            >
              <div style={{ ...styles.label, color: snapshot.accent }}>{snapshot.label}</div>
              <div style={styles.railCompact}>{snapshot.compact}</div>
              <div style={{ ...styles.railStatus, color: getPresenceColor(getPresence(snapshot.key), snapshot.accent) }}>
                {getPresenceLabel(getPresence(snapshot.key))}
              </div>
            </button>
          ))}
        </div>

        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <div>
              <div style={styles.modalHeaderTitle}>View Engine Progress</div>
              <div style={styles.modalHeaderText}>
                Switch tabs to compare every live engine in the current run and see what the deck wants next.
              </div>
            </div>
            <button
              type="button"
              onClick={event => {
                event.stopPropagation();
                onClose();
              }}
              style={styles.closeButton}
            >
              Close
            </button>
          </div>

          <div style={styles.modalScroll}>
            <div style={{ ...styles.heroCard, boxShadow: `inset 0 0 0 1px ${activeSnapshot.accent}18` }}>
              <div style={{ ...styles.label, color: activeSnapshot.accent }}>{activeSnapshot.label}</div>
              <div style={{ ...styles.dockBadge, color: activePresenceColor, border: `1px solid ${activePresenceColor}33`, background: `${activePresenceColor}14` }}>
                {getPresenceLabel(activePresence)}
              </div>
              <div style={styles.heroTagline}>{activeSnapshot.tagline}</div>
              <div style={styles.heroSummary}>{activeSnapshot.summary}</div>
              <div style={styles.heroDetail}>{activeSnapshot.detail}</div>
              <div style={styles.hint}>{getPresenceHint(activePresence, activeSnapshot.label)}</div>
            </div>

            <div style={styles.metricGrid}>
              {activeSnapshot.metrics.map(metric => (
                <MetricTile key={metric.label} metric={metric} accent={activeSnapshot.accent} />
              ))}
            </div>

            <div style={styles.modalGrid}>
              <div style={styles.modalSectionCard}>
                <div style={styles.sectionTitle}>How To Use It</div>
                <div style={styles.contributorRow}>
                  {activeSnapshot.nextSteps.map(step => (
                    <div key={step.title} style={{ ...styles.nextStep, boxShadow: step.ready ? `inset 0 0 0 1px ${activeSnapshot.accent}24` : 'none' }}>
                      <div style={{ ...styles.nextStepTitle, color: step.ready ? activeSnapshot.accent : '#fff0d9' }}>
                        {step.ready ? 'Ready · ' : 'Next · '}{step.title}
                      </div>
                      <div style={styles.nextStepDetail}>{step.detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.modalSectionCard}>
                <div style={styles.sectionTitle}>Cards In Hand Right Now</div>
                {handContributors.length > 0 ? (
                  <div style={styles.contributorRow}>
                    {handContributors.map(contributor => <ContributorCard key={contributor.definitionId} contributor={contributor} />)}
                  </div>
                ) : (
                  <div style={styles.emptyState}>{getEmptyHandState(activePresence)}</div>
                )}
              </div>

              <div style={styles.modalSectionCard}>
                <div style={styles.sectionTitle}>Board Anchors</div>
                {boardContributors.length > 0 ? (
                  <div style={styles.contributorRow}>
                    {boardContributors.map(contributor => <ContributorCard key={contributor.definitionId} contributor={contributor} />)}
                  </div>
                ) : (
                  <div style={styles.emptyState}>{getEmptyBoardState(activePresence)}</div>
                )}
              </div>

              <div style={styles.modalSectionCard}>
                <div style={styles.sectionTitle}>Current Readout</div>
                <div style={styles.summary}>{activeSnapshot.compact}</div>
                <div style={styles.hint}>
                  {getCurrentReadoutHint(activePresence)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modal;
  }

  return createPortal(modal, document.body);
}

export default function SetEngineDisplay() {
  const turn = useStore(selectTurn);
  const deck = useStore(selectDeck);
  const board = useStore(selectBoard);
  const [selectedKey, setSelectedKey] = useState<EngineKey | null>(null);
  const [showAtlas, setShowAtlas] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Gather card definitions — only depends on which cards are present (deck/board), not turn
  const { definitions, handDefinitions, boardDefinitions, deckKeys, handKeys, boardKeys } = useMemo(() => {
    const definitions: CardDefinition[] = [];
    const handDefinitions: CardDefinition[] = [];
    const boardDefinitions: CardDefinition[] = [];
    const seen = new Set<string>();

    const pushDefinition = (definitionId: string | undefined, bucket?: CardDefinition[]) => {
      if (!definitionId || seen.has(definitionId)) return;
      const def = CardRegistry.get(definitionId);
      if (!def) return;
      seen.add(definitionId);
      definitions.push(def);
      if (bucket) bucket.push(def);
    };

    const pushCardDefinition = (definitionId: string | undefined, bucket: CardDefinition[]) => {
      if (!definitionId) return;
      const def = CardRegistry.get(definitionId);
      if (!def) return;
      bucket.push(def);
      if (seen.has(definitionId)) return;
      seen.add(definitionId);
      definitions.push(def);
    };

    deck.deckList.forEach(entry => pushDefinition(entry.definitionId));
    deck.extraDeck.forEach(entry => pushDefinition(entry.definitionId));
    deck.hand.forEach(card => pushCardDefinition(card.definitionId, handDefinitions));
    deck.drawPile.forEach(card => pushDefinition(card.definitionId));
    deck.discardPile.forEach(card => pushDefinition(card.definitionId));
    board.frontSlots.forEach(slot => pushCardDefinition(slot?.definitionId, boardDefinitions));
    board.backSlots.forEach(slot => pushCardDefinition(slot?.definitionId, boardDefinitions));

    const deckKeys = new Set<EngineKey>();
    const handKeys = new Set<EngineKey>();
    const boardKeys = new Set<EngineKey>();
    for (const def of definitions) { const key = getEngineKeyForCard(def); if (key) deckKeys.add(key); }
    for (const def of handDefinitions) { const key = getEngineKeyForCard(def); if (key) handKeys.add(key); }
    for (const def of boardDefinitions) { const key = getEngineKeyForCard(def); if (key) boardKeys.add(key); }

    return { definitions, handDefinitions, boardDefinitions, deckKeys, handKeys, boardKeys };
  }, [deck.deckList, deck.extraDeck, deck.hand, deck.drawPile, deck.discardPile, board.frontSlots, board.backSlots]);

  // Engine snapshots — re-computed when definitions or live game state changes
  const snapshots = useMemo(
    () => turn.phase === 'playing' ? getSetEngineSnapshotsForCards(definitions, turn, board, { includeAll: true }) : [],
    [definitions, turn, board],
  );

  useEffect(() => {
    if (!showAtlas && !showGuide) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAtlas(false);
        setShowGuide(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAtlas, showGuide]);

  if (turn.phase !== 'playing') return null;

  const getPresence = (key: EngineKey): EnginePresence => {
    if (boardKeys.has(key)) return 'live';
    if (handKeys.has(key)) return 'inHand';
    if (deckKeys.has(key)) return 'inDeck';
    return 'catalog';
  };

  if (snapshots.length === 0) return null;

  const preferredKey = snapshots.find(snapshot => getPresence(snapshot.key) !== 'catalog')?.key ?? snapshots[0].key;
  const activeKey = snapshots.some(snapshot => snapshot.key === selectedKey)
    ? (selectedKey as EngineKey)
    : preferredKey;
  const activeSnapshot = snapshots.find(snapshot => snapshot.key === activeKey) ?? snapshots[0];
  const activeHandContributors = getSetEngineContributorsForCards(handDefinitions, activeSnapshot.key, 3);
  const readySteps = activeSnapshot.nextSteps.filter(step => step.ready).length;
  const activePresence = getPresence(activeSnapshot.key);
  const activePresenceColor = getPresenceColor(activePresence, activeSnapshot.accent);

  if (collapsed) {
    return (
      <button
        type="button"
        style={styles.restoreButton}
        onClick={() => setCollapsed(false)}
      >
        Set Engines · Reopen
      </button>
    );
  }

  return (
    <>
      <div style={styles.panel}>
        <div style={styles.headerRow}>
          <div>
            <div style={styles.title}>Set Engines</div>
            <div style={styles.subtitle}>A live engine dock with tabs for every set in the game, plus deck-aware guidance for the ones you are actually running.</div>
          </div>
          <div style={styles.panelActionRow}>
            <button type="button" style={styles.guideButton} onClick={() => setShowGuide(true)}>
              How To Play
            </button>
            <button type="button" style={styles.atlasButton} onClick={() => setShowAtlas(true)}>
              View Progress
            </button>
            <button type="button" style={styles.collapseButton} onClick={() => setCollapsed(true)}>
              Hide
            </button>
          </div>
        </div>

        <div style={styles.tabRow}>
          {snapshots.map(snapshot => (
            <button
              key={snapshot.key}
              type="button"
              onClick={() => setSelectedKey(snapshot.key)}
              style={{
                ...styles.tab,
                border: snapshot.key === activeKey ? `1px solid ${snapshot.accent}` : styles.tab.border,
                color: snapshot.key === activeKey ? snapshot.accent : getPresenceColor(getPresence(snapshot.key), snapshot.accent),
                boxShadow: snapshot.key === activeKey ? `0 0 14px ${snapshot.accent}22` : getPresence(snapshot.key) === 'live' ? `0 0 10px ${snapshot.accent}14` : 'none',
                opacity: getPresence(snapshot.key) === 'catalog' ? 0.66 : 1,
              }}
              title={`${snapshot.label} · ${getPresenceLabel(getPresence(snapshot.key))}`}
            >
              <div>{snapshot.label}</div>
              <div style={styles.tabMeta}>{getPresenceLabel(getPresence(snapshot.key))}</div>
            </button>
          ))}
        </div>

        <div style={{ ...styles.activeCard, boxShadow: `inset 0 0 0 1px ${activeSnapshot.accent}18` }}>
          <div style={{ ...styles.label, color: activeSnapshot.accent }}>{activeSnapshot.label}</div>
          <div style={{ ...styles.dockBadge, color: activePresenceColor, border: `1px solid ${activePresenceColor}33`, background: `${activePresenceColor}14` }}>
            {getPresenceLabel(activePresence)}
          </div>
          <div style={styles.tagline}>{activeSnapshot.tagline}</div>
          <div style={styles.summary}>{activeSnapshot.summary}</div>
          <div style={styles.compactLine}>{activeSnapshot.compact}</div>

          <div style={styles.metricGrid}>
            {activeSnapshot.metrics.map(metric => (
              <MetricTile key={metric.label} metric={metric} accent={activeSnapshot.accent} />
            ))}
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>What To Do Next</div>
            <div style={{ ...styles.nextStep, boxShadow: `inset 0 0 0 1px ${activeSnapshot.accent}18` }}>
              <div style={{ ...styles.nextStepTitle, color: activeSnapshot.accent }}>
                {readySteps}/{activeSnapshot.nextSteps.length} steps online
              </div>
              <div style={styles.nextStepDetail}>
                {activePresence === 'catalog'
                  ? getPresenceHint(activePresence, activeSnapshot.label)
                  : activeSnapshot.nextSteps.find(step => !step.ready)?.detail ?? activeSnapshot.nextSteps[activeSnapshot.nextSteps.length - 1]?.detail}
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Current Hand Feed</div>
            {activeHandContributors.length > 0 ? (
              <div style={styles.contributorRow}>
                {activeHandContributors.map(contributor => <ContributorCard key={contributor.definitionId} contributor={contributor} />)}
              </div>
            ) : (
              <div style={styles.emptyState}>{getEmptyHandState(activePresence)}</div>
            )}
          </div>
        </div>

        <div style={styles.hint}>Hover a hand card for per-card engine text, switch tabs to compare mixed-set decks, or open the atlas for the full all-set menu.</div>
      </div>

      {showAtlas && (
        <EngineAtlasModal
          snapshots={snapshots}
          activeKey={activeKey}
          onSelect={setSelectedKey}
          onClose={() => setShowAtlas(false)}
          handDefinitions={handDefinitions}
          boardDefinitions={boardDefinitions}
          getPresence={getPresence}
        />
      )}

      {showGuide && SET_ENGINE_GUIDES[activeKey] && (
        <EngineGuideModal
          guide={SET_ENGINE_GUIDES[activeKey]!}
          snapshots={snapshots}
          activeKey={activeKey}
          onSelect={key => setSelectedKey(key)}
          onClose={() => setShowGuide(false)}
        />
      )}
    </>
  );
}