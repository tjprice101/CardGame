import { useState, useEffect } from 'react';
import { useStore, selectTurn, selectDeck } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import {
  cardFacePalette,
  getCardFaceBackgroundStyle,
  getCardFaceMetrics,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';
import { getCardPreviewText } from '@/ui/cardStatSummary';
import { highlightRulesText } from '@/ui/text/highlightRulesText';
import { uiTypography, warmTheme } from '@/ui/theme';
import type { CardSubtypeFilter } from '@/types/effects';
import type { DeckCard } from '@/types/game';

const DISPLAY_FONT = uiTypography.display;
const BODY_FONT = uiTypography.body;

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background:
      'radial-gradient(circle at 14% 12%, rgba(227, 150, 82, 0.22) 0%, rgba(227, 150, 82, 0) 36%), radial-gradient(circle at 86% 22%, rgba(173, 126, 82, 0.18) 0%, rgba(173, 126, 82, 0) 34%), rgba(8, 7, 8, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 160,
    pointerEvents: 'auto',
    fontFamily: BODY_FONT,
    backdropFilter: 'blur(2px)',
  },
  panel: {
    background: 'linear-gradient(180deg, rgba(248, 240, 225, 0.98) 0%, rgba(240, 224, 198, 0.96) 100%)',
    border: '1px solid rgba(138, 94, 58, 0.42)',
    borderRadius: 18,
    padding: '22px 24px',
    maxWidth: 680,
    width: '90%',
    maxHeight: '85vh',
    boxShadow: '0 26px 48px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.4)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  title: {
    fontSize: 15,
    color: '#5e2f16',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontFamily: DISPLAY_FONT,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 12,
    color: '#704022',
    marginBottom: 14,
    lineHeight: 1.45,
    fontFamily: BODY_FONT,
  },
  cardGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 16,
    justifyContent: 'center',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
    padding: '3px 2px',
  },
  card: {
    width: 104,
    aspectRatio: '0.73',
    background: warmTheme.surface,
    border: `1px solid rgba(121, 84, 50, 0.45)`,
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    cursor: 'pointer',
    transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s, filter 0.15s',
    userSelect: 'none',
    overflow: 'hidden',
    boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
  },
  cardSelected: {
    border: '2px solid rgba(255,100,100,0.8)',
    boxShadow: '0 0 14px rgba(255,80,80,0.4)',
    transform: 'translateY(-4px)',
  },
  cardTake: {
    border: '2px solid rgba(80,200,100,0.8)',
    boxShadow: '0 0 14px rgba(80,200,100,0.35)',
    transform: 'translateY(-4px)',
  },
  cardName: { fontWeight: 'bold', color: cardFacePalette.text, textAlign: 'center', lineHeight: 1.2, fontFamily: DISPLAY_FONT },
  cardDesc: { color: cardFacePalette.textSoft, textAlign: 'center', display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: BODY_FONT },
  cardRarity: { fontSize: 7, letterSpacing: 1, marginTop: 3 },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  info: { fontSize: 11.5, color: '#6e3e21', flex: 1, fontFamily: BODY_FONT },
  confirmBtn: {
    padding: '9px 22px',
    borderRadius: 10,
    border: '1px solid rgba(126, 86, 48, 0.44)',
    background: 'linear-gradient(180deg, rgba(251, 243, 228, 0.96) 0%, rgba(240, 218, 184, 0.94) 100%)',
    color: '#56280f',
    fontSize: 12.5,
    fontFamily: DISPLAY_FONT,
    cursor: 'pointer',
    letterSpacing: 0.8,
    boxShadow: '0 8px 16px rgba(64, 33, 14, 0.28)',
  },
  secondaryBtn: {
    padding: '9px 18px',
    borderRadius: 10,
    border: '1px solid rgba(126, 86, 48, 0.34)',
    background: 'rgba(253, 244, 225, 0.72)',
    color: '#69402a',
    fontSize: 12,
    fontFamily: BODY_FONT,
    cursor: 'pointer',
    letterSpacing: 0.4,
  },
  confirmDisabled: { opacity: 0.3, cursor: 'not-allowed' },
};

export default function PendingEffectModal() {
  const faceMetrics = getCardFaceMetrics('compact');
  const turn = useStore(selectTurn);
  const deck = useStore(selectDeck);
  const { resolvePending } = useStore.getState();
  const [selected, setSelected] = useState<string[]>([]);

  const backdropStyle: React.CSSProperties = styles.backdrop;

  const pending = turn.pendingEffect;

  useEffect(() => { setSelected([]); }, [pending]);

  if (!pending || turn.phase !== 'playing') return null;

  const confirm = () => { resolvePending(selected); setSelected([]); };
  const failToFind = () => { resolvePending([]); setSelected([]); };
  const buildCardStyle = (
    card: Pick<DeckCard, 'definitionId' | 'finish' | 'faceState'>,
    stateStyle?: React.CSSProperties,
  ): React.CSSProperties => ({
    ...styles.card,
    ...getCardFaceBackgroundStyle(CardRegistry.get(card.definitionId), card.finish, card.faceState),
    ...(stateStyle ?? {}),
  });

  const renderCardFace = (
    card: Pick<DeckCard, 'definitionId' | 'finish' | 'faceState'>,
    footerLabel?: string,
    footerColor?: string,
  ) => {
    const def = CardRegistry.get(card.definitionId);
    return (
      <>
        <div style={getCardNameRibbonStyle('compact')}>
          <div style={{ fontSize: faceMetrics.typeSize, color: cardFacePalette.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', textAlign: 'center', marginBottom: 3, fontFamily: DISPLAY_FONT }}>
            {def?.type ?? 'Card'}
          </div>
          <div style={{ ...styles.cardName, fontSize: faceMetrics.nameSize }}>{def?.name ?? card.definitionId}</div>
        </div>
        <div style={getCardRulesPanelStyle('compact')}>
          <div style={{ ...styles.cardDesc, fontSize: faceMetrics.descSize, lineHeight: faceMetrics.descLineHeight, WebkitLineClamp: faceMetrics.descLines }}>
            {def ? highlightRulesText(getCardPreviewText(def, 2), { lightBg: true }) : ''}
          </div>
          {footerLabel && (
            <div style={{ fontSize: 7, color: footerColor ?? cardFacePalette.textMuted, marginTop: 4, textAlign: 'center', fontFamily: BODY_FONT }}>
              {footerLabel}
            </div>
          )}
        </div>
      </>
    );
  };

  if (pending.type === 'prismatic_channel_choice') {
    const channels: Array<{ id: string; label: string }> = [
      { id: 'amber', label: 'Amber' },
      { id: 'azure', label: 'Azure' },
      { id: 'crimson', label: 'Crimson' },
      { id: 'emerald', label: 'Emerald' },
      { id: 'violet', label: 'Violet' },
      { id: 'white', label: 'White' },
    ];
    const selectedChannel = selected[0] ?? null;
    const canConfirm = selectedChannel !== null;

    return (
      <div className="anim-backdrop-fade" style={backdropStyle}>
        <div className="anim-panel-slide-up" style={styles.panel}>
          <div style={styles.title}>Choose Focus Channel</div>
          <div style={styles.subtitle}>Pick 1 channel for this turn. This is used by advanced Prismatic cards.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(120px, 1fr))', gap: 10, marginBottom: 16 }}>
            {channels.map(channel => {
              const isSel = selectedChannel === channel.id;
              return (
                <button
                  key={channel.id}
                  className="menu-tactile-btn"
                  onClick={() => setSelected([channel.id])}
                  style={{
                    ...styles.secondaryBtn,
                    border: isSel ? '2px solid rgba(255,120,80,0.85)' : styles.secondaryBtn.border,
                    background: isSel ? 'rgba(255, 226, 188, 0.92)' : styles.secondaryBtn.background,
                    color: '#532912',
                    fontFamily: DISPLAY_FONT,
                    letterSpacing: 0.7,
                    fontSize: 12,
                  }}
                >
                  {channel.label}
                </button>
              );
            })}
          </div>
          <div style={styles.footer}>
            <div style={styles.info}>{selectedChannel ? `Selected: ${selectedChannel}` : 'Select one channel'}</div>
            <button
              className="menu-tactile-btn"
              style={{ ...styles.confirmBtn, ...(!canConfirm ? styles.confirmDisabled : {}) }}
              onClick={canConfirm ? confirm : undefined}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pending.type === 'neutrality_equilibrium_tactical_choice') {
    const selectedMode = selected[0] ?? null;
    const canConfirm = selectedMode === 'burst' || selectedMode === 'restore';

    return (
      <div className="anim-backdrop-fade" style={backdropStyle}>
        <div className="anim-panel-slide-up" style={styles.panel}>
          <div style={styles.title}>Choose Tactical Sigil Mode</div>
          <div style={styles.subtitle}>
            Spend {pending.spend} Equilibrium Sigils: choose burst Oblivion or full-team Patience restore.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
            <button
              className="menu-tactile-btn"
              onClick={() => setSelected(['burst'])}
              style={{
                ...styles.secondaryBtn,
                border: selectedMode === 'burst' ? '2px solid rgba(255,120,80,0.85)' : styles.secondaryBtn.border,
                background: selectedMode === 'burst' ? 'rgba(255, 226, 188, 0.92)' : styles.secondaryBtn.background,
                color: '#532912',
                fontFamily: DISPLAY_FONT,
                letterSpacing: 0.7,
                fontSize: 12,
              }}
            >
              Burst Oblivion (+{pending.burstOblivion})
            </button>
            <button
              className="menu-tactile-btn"
              onClick={() => setSelected(['restore'])}
              style={{
                ...styles.secondaryBtn,
                border: selectedMode === 'restore' ? '2px solid rgba(255,120,80,0.85)' : styles.secondaryBtn.border,
                background: selectedMode === 'restore' ? 'rgba(255, 226, 188, 0.92)' : styles.secondaryBtn.background,
                color: '#532912',
                fontFamily: DISPLAY_FONT,
                letterSpacing: 0.7,
                fontSize: 12,
              }}
            >
              Restore Patience ({pending.restorePercent}%)
            </button>
          </div>
          <div style={styles.footer}>
            <div style={styles.info}>Both modes grant +{pending.patientLightGain} Patient Light.</div>
            <button className="menu-tactile-btn"
              style={{ ...styles.confirmBtn, ...(!canConfirm ? styles.confirmDisabled : {}) }}
              onClick={canConfirm ? confirm : undefined}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pending.type === 'prismatic_sentence_choice') {
    const canConfirm = selected.length === 1;
    const toggleCard = (id: string) => setSelected(prev => prev.includes(id) ? [] : [id]);

    return (
      <div className="anim-backdrop-fade" style={backdropStyle}>
        <div className="anim-panel-slide-up" style={styles.panel}>
          <div style={styles.title}>Sentencing</div>
          <div style={styles.subtitle}>Choose 1 card in your hand to sentence. It will gain enhanced follow-up effects when played.</div>
          <div style={styles.cardGrid}>
            {pending.cards.map(c => {
              const isTake = selected.includes(c.instanceId);
              return (
                <div
                  key={c.instanceId}
                  style={buildCardStyle(c, isTake ? styles.cardTake : undefined)}
                  onClick={() => toggleCard(c.instanceId)}
                >
                  {renderCardFace(c, isTake ? 'Sentence' : undefined, warmTheme.success)}
                </div>
              );
            })}
          </div>
          <div style={styles.footer}>
            <div style={styles.info}>{selected.length} / 1 chosen</div>
            <button
              className="menu-tactile-btn"
              style={{ ...styles.confirmBtn, ...(!canConfirm ? styles.confirmDisabled : {}) }}
              onClick={canConfirm ? confirm : undefined}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pending.type === 'discard_choice') {
    const maxDiscard = pending.count;
    const isLuminousCycle = pending.sourceCard.includes(':draw_plus:');
    const isGleamingPassage = pending.sourceCard.includes(':draw:');

    const toggleCard = (id: string) => {
      setSelected(prev =>
        prev.includes(id)
          ? prev.filter(x => x !== id)
          : prev.length < maxDiscard ? [...prev, id] : prev
      );
    };

    let subtitle = isLuminousCycle
      ? `Select up to ${maxDiscard} card${maxDiscard > 1 ? 's' : ''} to discard.`
      : `Select ${Math.min(maxDiscard, deck.hand.length)} card${Math.min(maxDiscard, deck.hand.length) !== 1 ? 's' : ''} to discard.`;
    if (isLuminousCycle) subtitle += ` You will then draw ${selected.length + 1} card${selected.length + 1 !== 1 ? 's' : ''}.`;
    else if (isGleamingPassage) {
      const drawCount = parseInt(pending.sourceCard.split(':draw:')[1]);
      subtitle += ` You will then draw ${drawCount} cards.`;
    }

    const effectiveMax = Math.min(maxDiscard, deck.hand.length);
    const canConfirm = isLuminousCycle || selected.length >= effectiveMax;

    return (
      <div className="anim-backdrop-fade" style={backdropStyle}>
        <div className="anim-panel-slide-up" style={styles.panel}>
          <div style={styles.title}>Choose Cards to Discard</div>
          <div style={styles.subtitle}>{subtitle}</div>
          <div style={styles.cardGrid}>
            {deck.hand.map(c => {
              const isSel = selected.includes(c.instanceId);
              return (
                <div
                  key={c.instanceId}
                  style={buildCardStyle(c, isSel ? styles.cardSelected : undefined)}
                  onClick={() => toggleCard(c.instanceId)}
                >
                  {renderCardFace(c, isSel ? 'Discard' : undefined, warmTheme.danger)}
                </div>
              );
            })}
          </div>
          <div style={styles.footer}>
            <div style={styles.info}>
              {selected.length} / {effectiveMax} selected
              {!canConfirm && ` ? select ${effectiveMax - selected.length} more`}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="menu-tactile-btn"
                style={{ ...styles.confirmBtn, ...(!canConfirm ? styles.confirmDisabled : {}) }}
                onClick={canConfirm ? confirm : undefined}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pending.type === 'embrace_infinite') {
    const keepCount = pending.keep;

    const toggleCard = (id: string) => {
      setSelected(prev =>
        prev.includes(id)
          ? prev.filter(x => x !== id)
          : prev.length < keepCount ? [...prev, id] : prev
      );
    };

    const canConfirm = selected.length >= Math.min(keepCount, pending.cards.length);

    return (
      <div className="anim-backdrop-fade" style={backdropStyle}>
        <div className="anim-panel-slide-up" style={styles.panel}>
          <div style={styles.title}>Embrace the Infinite</div>
          <div style={styles.subtitle}>
            Choose {keepCount} cards to keep in your hand. The rest will be shuffled back into your deck.
          </div>
          <div style={styles.cardGrid}>
            {pending.cards.map(c => {
              const isKept = selected.includes(c.instanceId);
              return (
                <div
                  key={c.instanceId}
                  style={buildCardStyle(c, isKept ? styles.cardTake : undefined)}
                  onClick={() => toggleCard(c.instanceId)}
                >
                  {renderCardFace(c, isKept ? 'Keep' : undefined, warmTheme.success)}
                </div>
              );
            })}
          </div>
          <div style={styles.footer}>
            <div style={styles.info}>{selected.length} / {keepCount} chosen</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="menu-tactile-btn" style={styles.secondaryBtn} onClick={failToFind}>
                Fail to Find
              </button>
              <button className="menu-tactile-btn"
                style={{ ...styles.confirmBtn, ...(!canConfirm ? styles.confirmDisabled : {}) }}
                onClick={canConfirm ? confirm : undefined}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pending.type === 'look_top_take') {
    const maxTake = pending.take;

    const toggleCard = (id: string) => {
      setSelected(prev =>
        prev.includes(id)
          ? prev.filter(x => x !== id)
          : prev.length < maxTake ? [...prev, id] : prev
      );
    };

    const canConfirm = selected.length >= Math.min(maxTake, pending.cards.length);

    return (
      <div className="anim-backdrop-fade" style={backdropStyle}>
        <div className="anim-panel-slide-up" style={styles.panel}>
          <div style={styles.title}>Choose {maxTake} Card{maxTake > 1 ? 's' : ''} to Keep</div>
          <div style={styles.subtitle}>
            Take {maxTake} into your hand. The rest return to the bottom of your deck.
          </div>
          <div style={styles.cardGrid}>
            {pending.cards.map(c => {
              const isTake = selected.includes(c.instanceId);
              return (
                <div
                  key={c.instanceId}
                  style={buildCardStyle(c, isTake ? styles.cardTake : undefined)}
                  onClick={() => toggleCard(c.instanceId)}
                >
                  {renderCardFace(c, isTake ? 'Take' : undefined, warmTheme.success)}
                </div>
              );
            })}
          </div>
          <div style={styles.footer}>
            <div style={styles.info}>{selected.length} / {maxTake} chosen</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="menu-tactile-btn" style={styles.secondaryBtn} onClick={failToFind}>
                Fail to Find
              </button>
              <button className="menu-tactile-btn"
                style={{ ...styles.confirmBtn, ...(!canConfirm ? styles.confirmDisabled : {}) }}
                onClick={canConfirm ? confirm : undefined}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pending.type === 'look_top_take_drop') {
    if (pending.cards.length === 0) {
      return (
        <div className="anim-backdrop-fade" style={backdropStyle}>
          <div className="anim-panel-slide-up" style={styles.panel}>
            <div style={styles.title}>Look ? Take & Drop</div>
            <div style={styles.subtitle}>There are no cards left in your deck to inspect.</div>
            <div style={styles.footer}>
              <div style={styles.info} />
              <button className="menu-tactile-btn" style={styles.confirmBtn} onClick={() => resolvePending([])}>Dismiss</button>
            </div>
          </div>
        </div>
      );
    }

    const takeCount = Math.min(pending.take, pending.cards.length);
    const dropCount = Math.min(pending.drop, Math.max(0, pending.cards.length - takeCount));
    const totalSelections = takeCount + dropCount;
    const takeIds = new Set(selected.slice(0, takeCount));
    const dropIds = new Set(selected.slice(takeCount, totalSelections));
    const canConfirm = selected.length === totalSelections;

    const handleClick = (id: string) => {
      setSelected(prev => {
        if (prev.includes(id)) return prev.filter(x => x !== id);
        if (prev.length >= totalSelections) return prev;
        return [...prev, id];
      });
    };

    const handleConfirm = () => {
      if (!canConfirm) return;
      resolvePending(selected);
      setSelected([]);
    };

    const subtitle =
      `Take ${takeCount} into your hand.`
      + (dropCount > 0 ? ` Return ${dropCount} to the bottom.` : '')
      + ' The remaining cards are discarded.'
      + (selected.length < takeCount
        ? ` Select ${takeCount - selected.length} more card${takeCount - selected.length === 1 ? '' : 's'} to take.`
        : selected.length < totalSelections
          ? ` Select ${totalSelections - selected.length} more card${totalSelections - selected.length === 1 ? '' : 's'} to return.`
          : '');

    const info = selected.length >= totalSelections
      ? 'Ready'
      : `${selected.length} / ${totalSelections} chosen`;

    return (
      <div className="anim-backdrop-fade" style={backdropStyle}>
        <div className="anim-panel-slide-up" style={styles.panel}>
          <div style={styles.title}>Look ? Take & Drop</div>
          <div style={styles.subtitle}>{subtitle}</div>
          <div style={styles.cardGrid}>
            {pending.cards.map(c => {
              const isTake = takeIds.has(c.instanceId);
              const isDrop = dropIds.has(c.instanceId);
              const cardStyle = isTake
                ? buildCardStyle(c, styles.cardTake)
                : isDrop
                  ? buildCardStyle(c, { border: '2px solid rgba(255,200,80,0.8)', boxShadow: '0 0 14px rgba(255,200,80,0.35)', transform: 'translateY(-4px)' as const })
                  : buildCardStyle(c);
              return (
                <div key={c.instanceId} style={cardStyle} onClick={() => handleClick(c.instanceId)}>
                  {renderCardFace(c, isTake ? 'Take' : isDrop ? 'Return' : undefined, isTake ? warmTheme.success : 'rgba(255,200,80,0.92)')}
                </div>
              );
            })}
          </div>
          <div style={styles.footer}>
            <div style={styles.info}>{info}</div>
            <button className="menu-tactile-btn"
              style={{ ...styles.confirmBtn, ...(!canConfirm ? styles.confirmDisabled : {}) }}
              onClick={canConfirm ? handleConfirm : undefined}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pending.type === 'look_top_take_type') {
    const maxTake = Math.min(pending.take, pending.cards.length);

    const toggleCard = (id: string) => {
      setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < maxTake ? [...prev, id] : prev);
    };
    const canConfirm = selected.length >= maxTake;
    const filterText = pending.filter.join(' / ');

    return (
      <div className="anim-backdrop-fade" style={backdropStyle}>
        <div className="anim-panel-slide-up" style={styles.panel}>
          <div style={styles.title}>Look ? Take {maxTake} (Filtered)</div>
          <div style={styles.subtitle}>Take {maxTake} matching card{maxTake === 1 ? '' : 's'} ({filterText}) into your hand. The rest return to the bottom of your deck.</div>
          <div style={styles.cardGrid}>
            {pending.cards.map(c => {
              const isTake = selected.includes(c.instanceId);
              return (
                <div
                  key={c.instanceId}
                  style={buildCardStyle(c, isTake ? styles.cardTake : undefined)}
                  onClick={() => toggleCard(c.instanceId)}
                >
                  {renderCardFace(c, isTake ? 'Take' : undefined, warmTheme.success)}
                </div>
              );
            })}
            {pending.cards.length === 0 && (
              <div style={{ color: '#7a4a2a', fontSize: 11, padding: '20px 0', fontFamily: BODY_FONT }}>
                No matching cards found in the top cards.
              </div>
            )}
          </div>
          <div style={styles.footer}>
            <div style={styles.info}>{selected.length} / {maxTake} chosen</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="menu-tactile-btn" style={styles.secondaryBtn} onClick={failToFind}>
                Fail to Find
              </button>
              <button className="menu-tactile-btn"
                style={{ ...styles.confirmBtn, ...(!canConfirm ? styles.confirmDisabled : {}) }}
                onClick={canConfirm ? confirm : undefined}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pending.type === 'search_deck') {
    const maxTake = Math.min(pending.take, pending.cards.length);

    const toggleCard = (id: string) => {
      setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < maxTake ? [...prev, id] : prev);
    };
    const canConfirm = selected.length >= maxTake;

    return (
      <div className="anim-backdrop-fade" style={backdropStyle}>
        <div className="anim-panel-slide-up" style={styles.panel}>
          <div style={styles.title}>Search Deck</div>
          <div style={styles.subtitle}>Choose {maxTake} card{maxTake === 1 ? '' : 's'} to add to your hand. Your deck will be shuffled afterward.</div>
          <div style={styles.cardGrid}>
            {pending.cards.map(c => {
              const isTake = selected.includes(c.instanceId);
              return (
                <div
                  key={c.instanceId}
                  style={buildCardStyle(c, isTake ? styles.cardTake : undefined)}
                  onClick={() => toggleCard(c.instanceId)}
                >
                  {renderCardFace(c, isTake ? 'Take' : undefined, warmTheme.success)}
                </div>
              );
            })}
            {pending.cards.length === 0 && (
              <div style={{ color: '#7a4a2a', fontSize: 11, padding: '20px 0', fontFamily: BODY_FONT }}>
                No matching cards found in your deck.
              </div>
            )}
          </div>
          <div style={styles.footer}>
            <div style={styles.info}>{selected.length} / {maxTake} chosen</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="menu-tactile-btn" style={styles.secondaryBtn} onClick={failToFind}>
                Fail to Find
              </button>
              <button className="menu-tactile-btn"
                style={{ ...styles.confirmBtn, ...(!canConfirm ? styles.confirmDisabled : {}) }}
                onClick={canConfirm ? confirm : undefined}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pending.type === 'salvage') {
    const requiredCount = Math.min(pending.count, pending.cards.length);

    const selectedTypes = new Set<CardSubtypeFilter>(
      selected
        .map(id => pending.cards.find(card => card.instanceId === id))
        .filter((card): card is typeof pending.cards[number] => Boolean(card))
        .map(card => CardRegistry.get(card.definitionId)?.type)
        .filter((type): type is CardSubtypeFilter => type === 'Seraphim' || type === 'Cherubim' || type === 'Ophanim'),
    );

    const requiredTypes = new Set<CardSubtypeFilter>(pending.filter ?? ['Ophanim']);
    const hasRequiredTypes = pending.filter
      ? [...requiredTypes].every(type => selectedTypes.has(type))
      : true;

    const canConfirm = selected.length >= requiredCount && hasRequiredTypes;

    if (pending.cards.length === 0) {
      return (
        <div className="anim-backdrop-fade" style={backdropStyle}>
          <div className="anim-panel-slide-up" style={styles.panel}>
            <div style={styles.title}>Salvage</div>
            <div style={styles.subtitle}>No valid cards in your discard pile.</div>
            <div style={styles.footer}>
              <div style={styles.info} />
                <button className="menu-tactile-btn" style={styles.secondaryBtn} onClick={failToFind}>Fail to Find</button>
            </div>
          </div>
        </div>
      );
    }

    const toggleCard = (id: string) => {
      setSelected(prev => {
        if (prev.includes(id)) return prev.filter(x => x !== id);
        if (prev.length >= requiredCount) return prev;
        return [...prev, id];
      });
    };

    const subtitle = requiredCount > 1
      ? `Choose ${requiredCount} cards, including ${pending.filter?.join(' and ') ?? 'the required types'}, from your discard pile.`
      : 'Choose 1 card to salvage from your discard pile.';

    return (
      <div className="anim-backdrop-fade" style={backdropStyle}>
        <div className="anim-panel-slide-up" style={styles.panel}>
          <div style={styles.title}>Salvage</div>
          <div style={styles.subtitle}>{subtitle}</div>
          <div style={styles.cardGrid}>
            {pending.cards.map(c => {
              const isTake = selected.includes(c.instanceId);
              return (
                <div
                  key={c.instanceId}
                  style={buildCardStyle(c, isTake ? styles.cardTake : undefined)}
                  onClick={() => toggleCard(c.instanceId)}
                >
                  {renderCardFace(c, isTake ? 'Salvage' : undefined, warmTheme.success)}
                </div>
              );
            })}
          </div>
          <div style={styles.footer}>
            <div style={styles.info}>{selected.length} / {requiredCount} chosen</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="menu-tactile-btn" style={styles.secondaryBtn} onClick={failToFind}>
                Fail to Find
              </button>
              <button className="menu-tactile-btn"
                style={{ ...styles.confirmBtn, ...(!canConfirm ? styles.confirmDisabled : {}) }}
                onClick={canConfirm ? confirm : undefined}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
