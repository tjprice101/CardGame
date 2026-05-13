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
import { warmTheme } from '@/ui/theme';
import type { DeckCard } from '@/types/game';

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: warmTheme.backdrop,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
    pointerEvents: 'auto',
    fontFamily: 'Georgia, serif',
  },
  panel: {
    background: warmTheme.surfaceStrong,
    border: `1px solid ${warmTheme.borderStrong}`,
    borderRadius: 16,
    padding: '20px 24px',
    maxWidth: 680,
    width: '90%',
    maxHeight: '85vh',
    boxShadow: warmTheme.shadow,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  title: {
    fontSize: 14,
    color: warmTheme.accentDeep,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11,
    color: warmTheme.textMuted,
    marginBottom: 16,
  },
  cardGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'center',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
  },
  card: {
    width: 92,
    height: 124,
    background: warmTheme.surface,
    border: `1px solid ${warmTheme.border}`,
    borderRadius: 7,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    cursor: 'pointer',
    transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
    userSelect: 'none',
    overflow: 'hidden',
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
  cardName: { fontWeight: 'bold', color: cardFacePalette.text, textAlign: 'center', lineHeight: 1.2 },
  cardDesc: { color: cardFacePalette.textSoft, textAlign: 'center', display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardRarity: { fontSize: 7, letterSpacing: 1, marginTop: 3 },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  info: { fontSize: 11, color: warmTheme.textMuted, flex: 1 },
  confirmBtn: {
    padding: '9px 22px',
    borderRadius: 10,
    border: `1px solid ${warmTheme.borderStrong}`,
    background: warmTheme.button,
    color: warmTheme.accentDeep,
    fontSize: 12,
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
    letterSpacing: 1,
    boxShadow: warmTheme.glow,
  },
  confirmDisabled: { opacity: 0.3, cursor: 'not-allowed' },
};

export default function PendingEffectModal() {
  const faceMetrics = getCardFaceMetrics('compact');
  const turn = useStore(selectTurn);
  const deck = useStore(selectDeck);
  const { resolvePending } = useStore.getState();
  const [selected, setSelected] = useState<string[]>([]);

  const pending = turn.pendingEffect;

  useEffect(() => { setSelected([]); }, [pending]);

  if (!pending || turn.phase !== 'playing') return null;

  const confirm = () => { resolvePending(selected); setSelected([]); };
  const buildCardStyle = (
    card: Pick<DeckCard, 'definitionId' | 'finish'>,
    stateStyle?: React.CSSProperties,
  ): React.CSSProperties => ({
    ...styles.card,
    ...getCardFaceBackgroundStyle(CardRegistry.get(card.definitionId), card.finish),
    ...(stateStyle ?? {}),
  });

  const renderCardFace = (
    card: Pick<DeckCard, 'definitionId' | 'finish'>,
    footerLabel?: string,
    footerColor?: string,
  ) => {
    const def = CardRegistry.get(card.definitionId);
    return (
      <>
        <div style={getCardNameRibbonStyle('compact')}>
          <div style={{ fontSize: faceMetrics.typeSize, color: cardFacePalette.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', textAlign: 'center', marginBottom: 3 }}>
            {def?.type ?? 'Card'}
          </div>
          <div style={{ ...styles.cardName, fontSize: faceMetrics.nameSize }}>{def?.name ?? card.definitionId}</div>
        </div>
        <div style={getCardRulesPanelStyle('compact')}>
          <div style={{ ...styles.cardDesc, fontSize: faceMetrics.descSize, lineHeight: faceMetrics.descLineHeight, WebkitLineClamp: faceMetrics.descLines }}>
            {def?.description ?? ''}
          </div>
          {footerLabel && (
            <div style={{ fontSize: 7, color: footerColor ?? cardFacePalette.textMuted, marginTop: 4, textAlign: 'center' }}>
              {footerLabel}
            </div>
          )}
        </div>
      </>
    );
  };

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

    let subtitle = `Select up to ${maxDiscard} card${maxDiscard > 1 ? 's' : ''} to discard.`;
    if (isLuminousCycle) subtitle += ` You will then draw ${selected.length + 1} card${selected.length + 1 !== 1 ? 's' : ''}.`;
    else if (isGleamingPassage) {
      const drawCount = parseInt(pending.sourceCard.split(':draw:')[1]);
      subtitle += ` You will then draw ${drawCount} cards.`;
    }

    const effectiveMax = Math.min(maxDiscard, deck.hand.length);
    const canConfirm = isLuminousCycle || selected.length >= effectiveMax;

    return (
      <div className="anim-backdrop-fade" style={styles.backdrop}>
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
              {!canConfirm && ` — select ${effectiveMax - selected.length} more`}
            </div>
            <button
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
      <div className="anim-backdrop-fade" style={styles.backdrop}>
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
            <button
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
      <div className="anim-backdrop-fade" style={styles.backdrop}>
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
            <button
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

  if (pending.type === 'look_top_take_drop') {
    if (pending.cards.length === 0) {
      return (
        <div className="anim-backdrop-fade" style={styles.backdrop}>
          <div className="anim-panel-slide-up" style={styles.panel}>
            <div style={styles.title}>Look — Take & Drop</div>
            <div style={styles.subtitle}>There are no cards left in your deck to inspect.</div>
            <div style={styles.footer}>
              <div style={styles.info} />
              <button style={styles.confirmBtn} onClick={() => resolvePending([])}>Dismiss</button>
            </div>
          </div>
        </div>
      );
    }

    // selected[0] = instanceId to take into hand; selected[1] = instanceId to drop to bottom
    const takeId = selected[0] ?? null;
    const dropId = selected[1] ?? null;
    const canConfirm = takeId !== null && (pending.cards.length <= 1 || dropId !== null);

    const handleClick = (id: string) => {
      if (takeId === null) {
        setSelected([id]);
      } else if (dropId === null && id !== takeId) {
        setSelected([takeId, id]);
      } else if (id === takeId) {
        setSelected([]);
      } else if (id === dropId) {
        setSelected([takeId]);
      }
    };

    const handleConfirm = () => {
      if (!canConfirm) return;
      resolvePending([takeId!, ...(dropId ? [dropId] : [])]);
      setSelected([]);
    };

    return (
      <div className="anim-backdrop-fade" style={styles.backdrop}>
        <div className="anim-panel-slide-up" style={styles.panel}>
          <div style={styles.title}>Look — Take & Drop</div>
          <div style={styles.subtitle}>
            Take 1 into your hand. Return 1 to the bottom. The remaining cards are discarded.
            {takeId === null ? ' Select a card to take.' : dropId === null && pending.cards.length > 1 ? ' Now select a card to return to the bottom.' : ''}
          </div>
          <div style={styles.cardGrid}>
            {pending.cards.map(c => {
              const isTake = c.instanceId === takeId;
              const isDrop = c.instanceId === dropId;
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
            <div style={styles.info}>{takeId ? (dropId || pending.cards.length <= 1 ? 'Ready' : 'Select card to return') : 'Select card to take'}</div>
            <button
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
    const toggleCard = (id: string) => {
      setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 1 ? [...prev, id] : prev);
    };
    const canConfirm = selected.length >= Math.min(1, pending.cards.length);

    return (
      <div className="anim-backdrop-fade" style={styles.backdrop}>
        <div className="anim-panel-slide-up" style={styles.panel}>
          <div style={styles.title}>Look — Take 1 (Filtered)</div>
          <div style={styles.subtitle}>Take 1 matching card into your hand. The rest return to the bottom of your deck.</div>
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
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, padding: '20px 0' }}>
                No matching cards found in the top cards.
              </div>
            )}
          </div>
          <div style={styles.footer}>
            <div style={styles.info}>{selected.length} / 1 chosen</div>
            <button
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

  if (pending.type === 'search_deck') {
    const toggleCard = (id: string) => {
      setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 1 ? [...prev, id] : prev);
    };
    const canConfirm = selected.length >= Math.min(1, pending.cards.length);

    return (
      <div className="anim-backdrop-fade" style={styles.backdrop}>
        <div className="anim-panel-slide-up" style={styles.panel}>
          <div style={styles.title}>Search Deck</div>
          <div style={styles.subtitle}>Choose 1 card to add to your hand. Your deck will be shuffled afterward.</div>
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
            {pending.cards.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, padding: '20px 0' }}>
                No matching cards found in your deck.
              </div>
            )}
          </div>
          <div style={styles.footer}>
            <div style={styles.info}>{selected.length} / 1 chosen</div>
            <button
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

  if (pending.type === 'salvage') {
    if (pending.cards.length === 0) {
      return (
        <div className="anim-backdrop-fade" style={styles.backdrop}>
          <div className="anim-panel-slide-up" style={styles.panel}>
            <div style={styles.title}>Salvage</div>
            <div style={styles.subtitle}>No valid cards in your discard pile.</div>
            <div style={styles.footer}>
              <div style={styles.info} />
              <button style={styles.confirmBtn} onClick={() => resolvePending([])}>Dismiss</button>
            </div>
          </div>
        </div>
      );
    }

    const toggleCard = (id: string) => {
      setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 1 ? [...prev, id] : prev);
    };
    const canConfirm = selected.length >= 1;

    return (
      <div className="anim-backdrop-fade" style={styles.backdrop}>
        <div className="anim-panel-slide-up" style={styles.panel}>
          <div style={styles.title}>Salvage</div>
          <div style={styles.subtitle}>Choose 1 card to salvage from your discard pile.</div>
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
            <div style={styles.info}>{selected.length} / 1 chosen</div>
            <button
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

  return null;
}
