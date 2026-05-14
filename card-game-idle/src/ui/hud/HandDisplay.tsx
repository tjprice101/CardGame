import { useEffect, useMemo, useState } from 'react';
import { useStore, selectDeck, selectTurn, selectBoard, selectProgress } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { ELEMENT_COLORS, ELEMENT_SET_NAMES } from '@/data/elements';
import { CardEffectExecutor } from '@/systems/cards/CardEffectExecutor';
import {
  cardFacePalette,
  getAdaptiveDescriptionMetrics,
  getCardFaceBackgroundStyle,
  getCardFaceMetrics,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';
import { warmTheme } from '@/ui/theme';
import type { CardFinish, SeraphimDefinition, AngelDefinition } from '@/types/cards';

const IDLE_SHOWCASE_SLOTS = 6;
const IDLE_SHOWCASE_INTERVAL_MS = 2600;

interface IdleShowcaseCard {
  definitionId: string;
  finish: CardFinish;
}

const TYPE_COLORS: Record<string, string> = {
  Seraphim: '#FFD700',
  Seeker:   '#c888f0',
  Chaos:    '#b87de8',
  Angel:    '#FFD700',
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  },
  handWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 'var(--angel-drawer-hand-offset, 34px)',
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
    paddingLeft: 8,
    paddingRight: 8,
    transition: 'right 0.22s ease, opacity 0.34s ease',
  },
  idleShowcaseWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 'var(--angel-drawer-hand-offset, 34px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    pointerEvents: 'none',
    paddingLeft: 8,
    paddingRight: 8,
    transition: 'right 0.22s ease, opacity 0.34s ease',
  },
  idleShowcaseLabel: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(245, 232, 214, 0.74)',
    fontFamily: 'Georgia, serif',
    background: 'rgba(26, 18, 12, 0.64)',
    border: `1px solid ${warmTheme.border}`,
    borderRadius: 999,
    padding: '4px 10px',
    boxShadow: warmTheme.glow,
  },
  idleShowcase: {
    display: 'flex',
    gap: 10,
    maxWidth: '100%',
    overflowX: 'auto',
    paddingBottom: 6,
  },
  idleCard: {
    width: 'clamp(108px, 7.3vw, 124px)',
    height: 'clamp(156px, 10.8vw, 176px)',
    flex: '0 0 auto',
    borderRadius: 12,
    border: `1px solid ${warmTheme.border}`,
    boxShadow: cardFacePalette.shadow,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: warmTheme.surfaceStrong,
    opacity: 0.92,
    transition: 'opacity 0.24s ease',
  },
  hand: {
    display: 'flex',
    gap: 12,
    pointerEvents: 'auto',
    position: 'relative',
    overflowX: 'auto',
    maxWidth: '100%',
    paddingBottom: 6,
  },
  card: {
    width: 'clamp(132px, 9.2vw, 148px)',
    height: 'clamp(188px, 13vw, 210px)',
    flex: '0 0 auto',
    background: warmTheme.surfaceStrong,
    border: `1px solid ${warmTheme.border}`,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
    fontFamily: 'Georgia, serif',
    position: 'relative',
    userSelect: 'none',
    overflow: 'hidden',
  },
  cardMulligan: {
    border: '2px solid rgba(255,100,100,0.75)',
    boxShadow: '0 0 14px rgba(255,80,80,0.45)',
  },
  cardAngel: {
    border: `1px solid ${warmTheme.borderStrong}`,
    boxShadow: warmTheme.glow,
  },
  subtype: {
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 4,
    textAlign: 'center',
  },
  name: {
    fontWeight: 'bold',
    color: cardFacePalette.text,
    lineHeight: 1.25,
    textAlign: 'center',
  },
  desc: {
    color: cardFacePalette.textSoft,
    textAlign: 'center',
    marginTop: 0,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  tooltip: {
    position: 'absolute',
    bottom: 242,
    left: '50%',
    width: 270,
    background: warmTheme.surfaceStrong,
    border: `1px solid ${warmTheme.borderStrong}`,
    borderRadius: 14,
    padding: '14px 16px',
    pointerEvents: 'none',
    zIndex: 20,
    boxShadow: warmTheme.shadow,
    fontFamily: 'Georgia, serif',
  },
  tooltipSubtype: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.55,
    marginBottom: 4,
  },
  tooltipName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: warmTheme.accentDeep,
    marginBottom: 8,
    lineHeight: 1.2,
  },
  tooltipDesc: {
    fontSize: 13,
    color: warmTheme.text,
    lineHeight: 1.6,
    marginBottom: 10,
  },
  tooltipFooter: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    fontSize: 10,
    opacity: 0.65,
  },
};

export default function HandDisplay() {
  const faceMetrics = getCardFaceMetrics('hand');
  const deck = useStore(selectDeck);
  const hand = deck.hand;
  const turn = useStore(selectTurn);
  const board = useStore(selectBoard);
  const progress = useStore(selectProgress);
  const { playCard, toggleMulliganCard, activateChaosEntropyFromHand } = useStore.getState();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [idleShowcaseCards, setIdleShowcaseCards] = useState<IdleShowcaseCard[]>([]);
  const [idleSwapState, setIdleSwapState] = useState<{ slot: number; phase: 'out' | 'in' } | null>(null);

  const isMulligan = turn.phase === 'mulligan';
  const isPlaying = turn.phase === 'playing';
  const isIdle = turn.phase === 'idle';

  const favoriteShowcasePool = useMemo(() => {
    const pool: IdleShowcaseCard[] = [];
    for (const [favoriteKey, isFavorited] of Object.entries(progress.favoriteCollection)) {
      if (!isFavorited) continue;
      const [definitionId, finishPart] = favoriteKey.split('::');
      if (!definitionId || (finishPart !== 'normal' && finishPart !== 'holo')) continue;

      const definition = CardRegistry.get(definitionId);
      if (!definition) continue;

      const totalOwned = progress.collection[definitionId] ?? 0;
      const holoOwned = Math.min(progress.holoCollection[definitionId] ?? 0, totalOwned);
      const normalOwned = Math.max(0, totalOwned - holoOwned);
      const ownedForFinish = finishPart === 'holo' ? holoOwned : normalOwned;
      if (ownedForFinish <= 0) continue;

      pool.push({ definitionId, finish: finishPart });
    }
    return pool;
  }, [progress.favoriteCollection, progress.collection, progress.holoCollection]);

  function pickRandomShowcase(cards: IdleShowcaseCard[]): IdleShowcaseCard[] {
    if (cards.length === 0) return [];
    if (cards.length <= IDLE_SHOWCASE_SLOTS) return [...cards];
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, IDLE_SHOWCASE_SLOTS);
  }

  useEffect(() => {
    if (!isIdle) return;
    setIdleShowcaseCards(pickRandomShowcase(favoriteShowcasePool));
  }, [isIdle, favoriteShowcasePool]);

  useEffect(() => {
    if (!isIdle || favoriteShowcasePool.length === 0) return;
    const timer = window.setInterval(() => {
      setIdleShowcaseCards(prev => {
        const next = [...prev];
        if (next.length === 0) return pickRandomShowcase(favoriteShowcasePool);
        const slotIndex = Math.floor(Math.random() * next.length);
        const current = next[slotIndex];
        const replacementOptions = favoriteShowcasePool.filter(card =>
          card.definitionId !== current.definitionId || card.finish !== current.finish
        );
        if (replacementOptions.length === 0) return next;
        const replacement = replacementOptions[Math.floor(Math.random() * replacementOptions.length)];
        setIdleSwapState({ slot: slotIndex, phase: 'out' });
        window.setTimeout(() => {
          setIdleShowcaseCards(cards => {
            const updated = [...cards];
            if (slotIndex < updated.length) updated[slotIndex] = replacement;
            return updated;
          });
          setIdleSwapState({ slot: slotIndex, phase: 'in' });
          window.setTimeout(() => setIdleSwapState(null), 240);
        }, 180);
        return next;
      });
    }, IDLE_SHOWCASE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isIdle, favoriteShowcasePool]);

  function handleClick(instanceId: string) {
    if (isMulligan) {
      toggleMulliganCard(instanceId);
    } else if (isPlaying) {
      if (playingCardId) return;
      const deckCard = hand.find(c => c.instanceId === instanceId);
      const def = deckCard ? CardRegistry.get(deckCard.definitionId) : null;
      if (def && !CardEffectExecutor.checkPlayable(def, hand.length, turn, board)) return;
      setPlayingCardId(instanceId);
      setTimeout(() => {
        playCard(instanceId);
        setPlayingCardId(null);
      }, 260);
    }
  }

  const hoveredDeckCard = hoveredId ? hand.find(c => c.instanceId === hoveredId) : null;
  const hoveredDef = hoveredDeckCard ? CardRegistry.get(hoveredDeckCard.definitionId) : null;

  const showActiveHand = isMulligan || isPlaying;
  const showIdleShowcase = isIdle;
  const hasActiveHandCards = hand.length > 0;
  const idleCards = idleShowcaseCards
    .map(card => ({ card, def: CardRegistry.get(card.definitionId) }))
    .filter(entry => entry.def !== undefined);

  return (
    <div style={{ ...styles.overlay, background: isMulligan ? 'rgba(92,63,31,0.14)' : 'transparent' }}>
      {isMulligan && (
        <div style={{
          position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
          color: warmTheme.accentDeep, fontFamily: 'Georgia, serif', fontSize: 13, letterSpacing: 2,
          background: warmTheme.surface,
          border: `1px solid ${warmTheme.border}`,
          borderRadius: 999,
          padding: '8px 16px',
          boxShadow: warmTheme.glow,
        }}>
          MULLIGAN — Click cards to swap them out
        </div>
      )}

      {/* Tooltip — positioned relative to overlay so it is never clipped by hand overflow */}
      {hoveredDef && (
        <div key={hoveredId} style={{ ...styles.tooltip, animation: 'tooltipFadeIn 0.18s ease both' }}>
          <div style={{
            ...styles.tooltipSubtype,
            color: TYPE_COLORS[hoveredDef.type] ?? '#aaa',
          }}>
            {hoveredDef.type}
          </div>
          <div style={styles.tooltipName}>{hoveredDef.name}</div>
          <div style={styles.tooltipDesc}>{hoveredDef.description}</div>
          <div style={styles.tooltipFooter}>
            <span style={{ color: ELEMENT_COLORS[hoveredDef.element] ?? '#aaa' }}>
              {ELEMENT_SET_NAMES[hoveredDef.element] ?? hoveredDef.element}
            </span>
            {hoveredDef.type === 'Angel' && (
              <>
                <span>·</span>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Cost: {(hoveredDef as AngelDefinition).summonCost.map(id => CardRegistry.get(id)?.name ?? id).join(', ')}
                </span>
              </>
            )}
            {hoveredDef.type === 'Seraphim' && (
              <>
                <span>·</span>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Synergy: {(hoveredDef as SeraphimDefinition).baseStats.bonusType.replace(/_/g, ' ')} +{(hoveredDef as SeraphimDefinition).baseStats.bonusValue}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          ...styles.idleShowcaseWrapper,
          opacity: showIdleShowcase ? 1 : 0,
          pointerEvents: 'none',
        }}
      >
        {idleCards.length > 0 && (
          <>
            <div style={styles.idleShowcaseLabel}>Profile Staples</div>
            <div className="ornate-scroll" style={styles.idleShowcase}>
              {idleCards.map(({ card, def }, idx) => {
                if (!def) return null;
                const showHolo = card.finish === 'holo';
                const descMetrics = getAdaptiveDescriptionMetrics('pack', def.description);
                const cardClass = [
                  showHolo ? 'holofoil-live-card' : undefined,
                  idleSwapState?.slot === idx && idleSwapState.phase === 'out' ? 'anim-idle-staple-fade-out' : undefined,
                  idleSwapState?.slot === idx && idleSwapState.phase === 'in' ? 'anim-idle-staple-fade-in' : undefined,
                ].filter(Boolean).join(' ');

                return (
                  <div
                    key={`${card.definitionId}_${card.finish}_${idx}`}
                    className={cardClass || undefined}
                    style={{
                      ...styles.idleCard,
                      ...getCardFaceBackgroundStyle(def, showHolo ? 'holo' : 'normal'),
                    }}
                  >
                    <div style={getCardNameRibbonStyle('pack')}>
                      <div style={{ ...styles.subtype, fontSize: 8, color: cardFacePalette.textMuted }}>{def.type}</div>
                      <div style={{ ...styles.name, fontSize: 10 }}>{def.name}</div>
                    </div>
                    <div style={getCardRulesPanelStyle('pack')}>
                      <div
                        style={{
                          ...styles.desc,
                          fontSize: descMetrics.fontSize,
                          lineHeight: descMetrics.lineHeight,
                          WebkitLineClamp: 4,
                        }}
                      >
                        {def.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {idleCards.length === 0 && (
          <div style={{
            fontSize: 12,
            color: 'rgba(235, 224, 206, 0.78)',
            fontFamily: 'Georgia, serif',
            background: 'rgba(20, 14, 10, 0.72)',
            border: `1px solid ${warmTheme.border}`,
            borderRadius: 10,
            padding: '10px 14px',
            boxShadow: warmTheme.glow,
          }}>
            No Favorited Cards. Favorite owned cards to have them appear here.
          </div>
        )}
      </div>

      <div
        style={{
          ...styles.handWrapper,
          opacity: showActiveHand ? 1 : 0,
          pointerEvents: showActiveHand ? 'none' : 'none',
        }}
      >
        {isPlaying && !hasActiveHandCards && (
          <div style={{
            color: warmTheme.textSoft, fontSize: 13, fontFamily: 'Georgia, serif',
            background: warmTheme.surface, padding: '8px 18px', borderRadius: 20,
            border: `1px solid ${warmTheme.border}`,
            boxShadow: warmTheme.glow,
            marginBottom: 8,
          }}>
            Hand empty - End Turn to continue
          </div>
        )}
        <div
          className="ornate-scroll"
          style={{
            ...styles.hand,
            opacity: hasActiveHandCards ? 1 : 0,
            transition: 'opacity 0.24s ease',
          }}
          onWheel={(e) => {
            const target = e.currentTarget;
            const hasHorizontalOverflow = target.scrollWidth > target.clientWidth;
            if (!hasHorizontalOverflow) return;
            if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
            target.scrollLeft += e.deltaY;
            e.preventDefault();
          }}
        >
          {hand.filter(deckCard => CardRegistry.get(deckCard.definitionId)?.type !== 'Angel').map(deckCard => {
          const def = CardRegistry.get(deckCard.definitionId);
          const selected = turn.mulliganSelected.includes(deckCard.instanceId);
          const isHovered = hoveredId === deckCard.instanceId;
          const isAnimatingOut = playingCardId === deckCard.instanceId;
          const isPlayable = !isPlaying || !def || CardEffectExecutor.checkPlayable(def, hand.length, turn, board);
          const descMetrics = getAdaptiveDescriptionMetrics('hand', def?.description ?? '');
          const nameLength = (def?.name ?? '').length;
          const adaptiveNameSize = nameLength > 24 ? faceMetrics.nameSize - 2.2 : nameLength > 16 ? faceMetrics.nameSize - 1.0 : faceMetrics.nameSize;

          // Neutrality cards get a cool silver shimmer, others get warm white
          const shimmerColor = def?.element === 'Neutrality'
            ? 'linear-gradient(90deg, transparent, rgba(200,210,255,0.09), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)';

          const isDraggable = isPlaying && isPlayable && (def?.type === 'Seraphim' || def?.type === 'Chaos');
          const isDragging = draggingId === deckCard.instanceId;

          return (
            <div
              key={deckCard.instanceId}
              className={[
                isAnimatingOut ? 'anim-card-play-out' : undefined,
                deckCard.finish === 'holo' ? 'holofoil-live-card' : undefined,
              ].filter(Boolean).join(' ') || undefined}
              draggable={isDraggable}
              style={{
                ...styles.card,
                ...getCardFaceBackgroundStyle(def, deckCard.finish),
                ...(selected ? styles.cardMulligan : {}),
                ...(!isPlayable ? { opacity: 0.35, cursor: 'not-allowed', filter: 'grayscale(0.5)' } : {}),
                ...(isDragging ? { opacity: 0.45, transform: 'scale(0.97)' } : {}),
                ...(isHovered && !selected && !isAnimatingOut && isPlayable && !isDragging ? {
                  transform: 'translateY(-12px)',
                  boxShadow: `${warmTheme.shadow}, ${cardFacePalette.shadow}`,
                  borderColor: warmTheme.borderStrong,
                } : {}),
              }}
              onClick={() => handleClick(deckCard.instanceId)}
              onContextMenu={(e) => {
                if (!isPlaying || !def || def.type !== 'Chaos') return;
                e.preventDefault();
                activateChaosEntropyFromHand(deckCard.instanceId);
              }}
              onMouseEnter={() => setHoveredId(deckCard.instanceId)}
              onMouseLeave={() => setHoveredId(null)}
              onDragStart={(e) => {
                if (!isDraggable || !def) return;
                const mimeType = def.type === 'Seraphim'
                  ? 'application/x-seraphim-card'
                  : 'application/x-chaos-card';
                e.dataTransfer.setData(mimeType, deckCard.instanceId);
                e.dataTransfer.effectAllowed = 'move';
                setDraggingId(deckCard.instanceId);
                setHoveredId(null);
              }}
              onDragEnd={() => setDraggingId(null)}
            >
              <div style={getCardNameRibbonStyle('hand')}>
                {def?.type && (
                  <div style={{ ...styles.subtype, color: cardFacePalette.textMuted, fontSize: faceMetrics.typeSize }}>{def.type}</div>
                )}
                <div style={{
                  ...styles.name,
                  fontSize: adaptiveNameSize,
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                  overflow: 'hidden',
                }}>
                  {def?.name ?? deckCard.definitionId}
                </div>
              </div>

              <div style={getCardRulesPanelStyle('hand')}>
                <div
                  style={{
                    ...styles.desc,
                    fontSize: descMetrics.fontSize,
                    lineHeight: descMetrics.lineHeight,
                    WebkitLineClamp: descMetrics.lineClamp,
                  }}
                >
                  {def?.description ?? ''}
                </div>
              </div>

              {selected && (
                <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 11, color: warmTheme.danger }}>✕</div>
              )}

              {/* Shimmer sweep on hover */}
              {isHovered && !selected && !isAnimatingOut && isPlayable && (
                <div style={{
                  position: 'absolute', inset: 0, overflow: 'hidden',
                  borderRadius: 10, pointerEvents: 'none',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0, width: '45%',
                    background: shimmerColor,
                    animation: 'shimmer 0.55s ease-in-out',
                  }} />
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
