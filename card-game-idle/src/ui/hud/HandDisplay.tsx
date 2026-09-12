import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore, selectDeck, selectTurn, selectBoard, selectProgress, selectSettings, selectBattleground, selectBossFight } from '@/state/store';
import { useThemeVersion } from '@/ui/useThemeVersion';
import { CardRegistry } from '@/cards/CardRegistry';
import { CardEffectExecutor } from '@/systems/cards/CardEffectExecutor';
import { getSummonRequirements } from '@/systems/cards/AinSophSummonRequirements';
import {
  cardFacePalette,
  getAdaptiveDescriptionMetrics,
  getCardBackgroundUrl,
  getCardFaceBackgroundStyle,
  getCardFaceMetrics,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';
import { getDisplayCardTypeLabel } from '@/ui/preferences';
import { getCardPreviewText } from '@/ui/cardStatSummary';
import { highlightRulesText } from '@/ui/text/highlightRulesText';
import { warmTheme } from '@/ui/theme';
import type { CardFinish } from '@/types/cards';

const IDLE_SHOWCASE_SLOTS = 6;
const IDLE_SHOWCASE_INTERVAL_MS = 2600;

interface IdleShowcaseCard {
  definitionId: string;
  finish: CardFinish;
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  },
  handWrapper: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 'var(--angel-drawer-hand-offset, 308px)',
    zIndex: 70,

    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    pointerEvents: 'none',
    paddingLeft: 8,
    paddingRight: 8,
    transition: 'right 0.22s ease, opacity 0.34s ease',
  },
  idleShowcaseLabel: {
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: 'rgba(244,244,248,0.55)',
    fontFamily: 'Georgia, serif',
    background: 'rgba(5,5,7,0.72)',
    border: '1px solid rgba(244,244,248,0.14)',
    borderRadius: 999,
    padding: '4px 10px',
    boxShadow: '0 0 12px rgba(244,244,248,0.06)',
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
    gap: 10,
    pointerEvents: 'auto',
    position: 'relative',
    overflowX: 'auto',
    overflowY: 'clip',
    maxWidth: '100%',
    paddingBottom: 10,
    paddingTop: 18,
    scrollbarGutter: 'stable',
  },
  card: {
    width: 'clamp(126px, 8.8vw, 150px)',
    height: 'clamp(180px, 24vh, 214px)',
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
    border: '2px solid rgba(180,120,255,0.85)',
    boxShadow: '0 0 18px rgba(160,100,255,0.5), 0 0 40px rgba(140,80,255,0.22)',
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
};

export default function HandDisplay({ onHoverCard }: { onHoverCard?: (definitionId: string) => void }) {
  useThemeVersion();
  const faceMetrics = getCardFaceMetrics('hand');
  const deck = useStore(selectDeck);
  const hand = deck.hand;
  const turn = useStore(selectTurn);
  const board = useStore(selectBoard);
  const progress = useStore(selectProgress);
  const settings = useStore(selectSettings);
  const battleground = useStore(selectBattleground);
  const bossFight = useStore(selectBossFight);
  const cardArtDisplay = settings.cardArtDisplay ?? 'both';
  const showTopPanel = cardArtDisplay === 'both' || cardArtDisplay === 'top-only';
  const showBottomPanel = cardArtDisplay === 'both' || cardArtDisplay === 'bottom-only';
  const artOnlyMode = cardArtDisplay === 'art-only';
  const { playCard, toggleMulliganCard } = useStore.getState();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragSideRef = useRef<'soph' | 'ain'>('soph');
  const [freeSummonSelection, setFreeSummonSelection] = useState(false);
  const [attackPanelOpen, setAttackPanelOpen] = useState(false);
  const [idleShowcaseCards, setIdleShowcaseCards] = useState<IdleShowcaseCard[]>([]);
  const [idleSwapState, setIdleSwapState] = useState<{ slot: number; phase: 'out' | 'in' } | null>(null);
  // Hand <-> Extra Deck view toggle. Driven by the configurable keybind in
  // App.tsx via the 'hr-toggle-extra-deck' window event.
  const [handView, setHandView] = useState<'hand' | 'extraDeck'>('hand');

  const isMulligan = turn.phase === 'mulligan';
  const isPlaying = turn.phase === 'playing';
  const isIdle = turn.phase === 'idle';

  // Listen for the global toggle event. Snap back to 'hand' on phase changes
  // so the player always returns to a sane state on turn boundaries.
  useEffect(() => {
    function onToggle() {
      setHandView(v => (v === 'hand' ? 'extraDeck' : 'hand'));
    }
    window.addEventListener('hr-toggle-extra-deck', onToggle);
    return () => window.removeEventListener('hr-toggle-extra-deck', onToggle);
  }, []);
  useEffect(() => {
    const handler = () => {
      setFreeSummonSelection(true);
      setHandView('extraDeck');
    };
    window.addEventListener('asa-free-summon-request', handler);
    return () => window.removeEventListener('asa-free-summon-request', handler);
  }, []);
  useEffect(() => { setHandView('hand'); }, [turn.phase]);

  useEffect(() => {
    function onAttackPanelOpen(event: Event) {
      const customEvent = event as CustomEvent<boolean>;
      setAttackPanelOpen(Boolean(customEvent.detail));
    }

    window.addEventListener('hr-attack-panel-open', onAttackPanelOpen as EventListener);
    return () => window.removeEventListener('hr-attack-panel-open', onAttackPanelOpen as EventListener);
  }, []);

  useEffect(() => {
    if (!attackPanelOpen) return;
    setHoveredId(null);
  }, [attackPanelOpen]);

  useEffect(() => {
    document.documentElement.style.setProperty('--hand-strip-height', '220px');
  }, []);

  // Preload card art as soon as the hand changes so images are cached before
  // the user hovers or plays a card, eliminating the lazy-load stutter.
  useEffect(() => {
    for (const deckCard of hand) {
      const def = CardRegistry.get(deckCard.definitionId);
      if (!def) continue;
      const url = getCardBackgroundUrl(def);
      if (url) {
        const img = new Image();
        img.src = url;
      }
    }
  }, [hand]);

  const isExtraDeckView = handView === 'extraDeck' && (isPlaying || isMulligan);

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

  // Trial Deck guided-mode: highlight the card matching the current guide step
  const [guideHighlightDefId, setGuideHighlightDefId] = useState<string | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ cardDefinitionId: string }>;
      setGuideHighlightDefId(ce.detail?.cardDefinitionId ?? null);
    };
    window.addEventListener('trial-guide-highlight', handler);
    return () => window.removeEventListener('trial-guide-highlight', handler);
  }, []);
  // Clear highlight when no longer in playing phase
  useEffect(() => {
    if (!isPlaying) setGuideHighlightDefId(null);
  }, [isPlaying]);

  function handleClick(instanceId: string, side: 'soph' | 'ain' = 'soph') {
    if (isExtraDeckView) {
      if (!isPlaying) return;
      const deckCard = viewCards.find(c => c.instanceId === instanceId);
      if (!deckCard) return;
      const def = CardRegistry.get(deckCard.definitionId);
      if (!def || def.type !== 'AinSophAur') return;
      // Hand off to BoardDisplay's material picker; it owns the back-row selection UI.
      window.dispatchEvent(new CustomEvent('asa-summon-request', {
        detail: {
          definitionId: def.definitionId,
          required: Math.max(1, def.summonMaterialCount),
          requirements: getSummonRequirements(def.summonMaterials, def.summonMaterialCount),
          freeSummon: freeSummonSelection,
        },
      }));
      setFreeSummonSelection(false);
      return;
    }
    if (isMulligan) {
      toggleMulliganCard(instanceId);
    } else if (isPlaying) {
      if (playingCardId) return;
      const deckCard = hand.find(c => c.instanceId === instanceId);
      const def = deckCard ? CardRegistry.get(deckCard.definitionId) : null;
      if (def && !CardEffectExecutor.checkPlayable(def, hand.length, turn, board)) return;
      setPlayingCardId(instanceId);
      setTimeout(() => {
        playCard(instanceId, side);
        setPlayingCardId(null);
      }, 260);
    }
  }

  const showActiveHand = isMulligan || isPlaying;
  const showIdleShowcase = isIdle && bossFight.mode !== 'active';
  // Cards to render in the bottom hand strip. Either the live hand (default)
  // or a read-only relocation of the Extra Deck. Synthetic instanceIds for
  // extra-deck entries keep React keys stable across renders.
  const viewCards: Array<{ instanceId: string; definitionId: string; finish: typeof hand[number]['finish']; faceState?: 'front' | 'back' }> =
    isExtraDeckView
      ? deck.extraDeck.map((entry, i) => ({
          instanceId: `extra-${i}-${entry.definitionId}-${entry.finish}`,
          definitionId: entry.definitionId,
          finish: entry.finish,
        }))
      : hand
          .filter(deckCard => CardRegistry.get(deckCard.definitionId)?.type !== 'AinSophAur')
          .map(c => ({ instanceId: c.instanceId, definitionId: c.definitionId, finish: c.finish, faceState: c.faceState }));
  const hasActiveHandCards = viewCards.length > 0;

  const handRightInset = 'var(--angel-drawer-hand-offset, 308px)';

  const idleCards = idleShowcaseCards
    .map(card => ({ card, def: CardRegistry.get(card.definitionId) }))
    .filter(entry => entry.def !== undefined);

  return (
    <div style={{ ...styles.overlay, background: isMulligan ? 'rgba(92,63,31,0.14)' : 'transparent' }}>
      {isMulligan && (
        <div style={{
          position: 'absolute', top: battleground.mode === 'active' ? 72 : 16, left: '50%', transform: 'translateX(-50%)',
          color: 'rgba(244,244,248,0.95)', fontFamily: 'Georgia, serif', fontSize: 13, letterSpacing: 3,
          background: 'linear-gradient(90deg, rgba(5,5,7,0.12), rgba(160,120,255,0.55), rgba(80,200,255,0.35), rgba(255,100,200,0.25), rgba(5,5,7,0.12))',
          backgroundSize: '200% 100%',
          animation: 'mulliganShimmer 3s linear infinite',
          border: '1px solid rgba(200,160,255,0.7)',
          borderRadius: 999,
          padding: '8px 20px',
          boxShadow: '0 0 28px rgba(160,120,255,0.35), 0 0 60px rgba(80,200,255,0.18)',
          whiteSpace: 'nowrap',
          textShadow: '0 0 12px rgba(200,160,255,0.8)',
        }}>
          MULLIGAN ? Click cards to swap them out
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
                const showHolo = card.finish === 'holo' || def.rarity === 'Infinite' || def.rarity === 'Eternal';
                const previewText = getCardPreviewText(def, 2);
                const descMetrics = getAdaptiveDescriptionMetrics('pack', previewText);
                const cardClass = [
                  showHolo
                    ? `holofoil-live-card${def.rarity === 'Infinite' ? ' holofoil-live-card--infinite' : ''}${def.rarity === 'Eternal' ? ' holofoil-live-card--eternal' : ''}`
                    : undefined,
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
                      ...(artOnlyMode ? { boxShadow: '0 0 0 2px rgba(255,255,255,0.7), 0 4px 16px rgba(0,0,0,0.5)' } : {}),
                    }}
                  >
                    {showTopPanel && (
                      <div style={getCardNameRibbonStyle('pack')}>
                        <div style={{ ...styles.subtype, fontSize: 8, color: cardFacePalette.textMuted }}>{getDisplayCardTypeLabel(def.type)}</div>
                        <div style={{ ...styles.name, fontSize: 10 }}>{def.name}</div>
                      </div>
                    )}
                    {showBottomPanel && (
                      <div style={getCardRulesPanelStyle('pack')}>
                        <div
                          style={{
                            ...styles.desc,
                            fontSize: descMetrics.fontSize,
                            lineHeight: descMetrics.lineHeight,
                            WebkitLineClamp: 4,
                          }}
                        >
                          {highlightRulesText(previewText, { disabled: settings.highlightRulesText === false, compact: true, lightBg: true })}
                        </div>
                      </div>
                    )}
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
          ['--hand-strip-height' as string]: '220px',
          right: handRightInset,
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
            {isExtraDeckView ? 'Extra Deck is empty' : 'Hand empty - End Turn to continue'}
          </div>
        )}
        {showActiveHand && (
          <div style={{
            position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
            fontFamily: 'Georgia, serif', fontSize: 10, letterSpacing: 3,
            textTransform: 'uppercase', padding: '4px 14px', borderRadius: 999,
            background: isExtraDeckView ? 'rgba(20,12,40,0.88)' : 'rgba(5,5,7,0.82)',
            color: isExtraDeckView ? '#cfc8ff' : 'rgba(244,244,248,0.82)',
            border: `1px solid ${isExtraDeckView ? 'rgba(180,160,255,0.5)' : 'rgba(244,244,248,0.22)'}`,
            boxShadow: isExtraDeckView ? '0 0 14px rgba(180,160,255,0.18)' : '0 0 14px rgba(244,244,248,0.06)',
            pointerEvents: 'auto',
            whiteSpace: 'nowrap',
          }}>
            {isExtraDeckView ? `Extra Deck (${viewCards.length})` : `Hand (${viewCards.length})`}
            <span style={{
              marginLeft: 8, opacity: 0.55, fontSize: 9, letterSpacing: 1.5,
            }}>
              {isExtraDeckView ? 'Click to summon · E: hand' : 'Left-Click: Soph · Right-Click: Ain · E: Extra Deck'}
            </span>
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
          {viewCards.map((deckCard, idx) => {
          const def = CardRegistry.get(deckCard.definitionId);
          const selected = !isExtraDeckView && (turn.mulliganSelected ?? []).includes(deckCard.instanceId);
          const isHovered = hoveredId === deckCard.instanceId;
          const isAnimatingOut = !isExtraDeckView && playingCardId === deckCard.instanceId;
          const isPlayable = isExtraDeckView
            ? (isPlaying && !!def && def.type === 'AinSophAur' && CardEffectExecutor.checkPlayable(def, 0, turn, board))
            : (!isPlaying || !def || CardEffectExecutor.checkPlayable(def, hand.length, turn, board));
          const previewText = def ? getCardPreviewText(def, 2) : 'Card data unavailable';
          const descMetrics = getAdaptiveDescriptionMetrics('hand', previewText);
          const nameLength = (def?.name ?? '').length;
          const adaptiveNameSize = nameLength > 24 ? faceMetrics.nameSize - 2.2 : nameLength > 16 ? faceMetrics.nameSize - 1.0 : faceMetrics.nameSize;

          // All Neutrality cards get a silver shimmer
          const shimmerColor = 'linear-gradient(90deg, transparent, rgba(200,210,255,0.09), transparent)';

          const isDraggable = !isExtraDeckView && isPlaying && isPlayable && (def?.type === 'Light' || def?.type === 'Dark');
          const isDragging = !isExtraDeckView && draggingId === deckCard.instanceId;
          const isGuideHighlighted = isPlaying && !isExtraDeckView && guideHighlightDefId === deckCard.definitionId;

          return (
            <div
              key={`${deckCard.instanceId}_${deckCard.definitionId}_${idx}`}
              className={[
                isAnimatingOut ? 'anim-card-play-out' : undefined,
                (deckCard.finish === 'holo' || def?.rarity === 'Infinite' || def?.rarity === 'Eternal')
                  ? `holofoil-live-card${def?.rarity === 'Infinite' ? ' holofoil-live-card--infinite' : ''}${def?.rarity === 'Eternal' ? ' holofoil-live-card--eternal' : ''}`
                  : undefined,
                isGuideHighlighted ? 'trial-guide-pulse' : undefined,
              ].filter(Boolean).join(' ') || undefined}
              draggable={isDraggable}
              style={{
                ...styles.card,
                ...getCardFaceBackgroundStyle(def, deckCard.finish, 'front'),
                ...(selected ? styles.cardMulligan : {}),
                ...(!isPlayable ? { opacity: 0.35, cursor: 'not-allowed', filter: 'grayscale(0.5)' } : {}),
                ...(isDragging ? { opacity: 0.45, transform: 'scale(0.97)' } : {}),
                ...(artOnlyMode ? { boxShadow: '0 0 0 2px rgba(255,255,255,0.65), 0 4px 16px rgba(0,0,0,0.5)' } : {}),
                ...(isExtraDeckView && isPlayable ? {
                  borderColor: 'rgba(255,255,255,0.96)',
                  boxShadow: '0 0 0 2px rgba(255,255,255,0.9), 0 0 24px rgba(255,255,255,0.72), 0 8px 24px rgba(0,0,0,0.55)',
                } : {}),
                ...(isHovered && !attackPanelOpen && !selected && !isAnimatingOut && isPlayable && !isDragging ? {
                  transform: 'translateY(-16px) scale(1.025)',
                  boxShadow: artOnlyMode
                    ? '0 0 0 2px rgba(255,255,255,0.9), 0 12px 32px rgba(0,0,0,0.65)'
                    : `0 0 0 1px rgba(180,220,255,0.55), 0 14px 36px rgba(120,200,255,0.22), 0 4px 14px rgba(0,0,0,0.6)`,
                  borderColor: artOnlyMode ? 'rgba(255,255,255,0.8)' : 'rgba(180,220,255,0.7)',
                } : {}),
              }}
              onClick={() => handleClick(deckCard.instanceId, 'soph')}
              onContextMenu={(e) => {
                e.preventDefault();
                handleClick(deckCard.instanceId, 'ain');
              }}
              onMouseEnter={() => {
                setHoveredId(deckCard.instanceId);
                onHoverCard?.(deckCard.definitionId);
              }}
              onMouseLeave={() => setHoveredId(null)}
              onDragStart={(e) => {
                if (!isDraggable || !def) return;
                e.dataTransfer.setData('application/x-pantheon-card', deckCard.instanceId);
                e.dataTransfer.setData('application/x-pantheon-side', dragSideRef.current);
                e.dataTransfer.effectAllowed = 'move';
                setDraggingId(deckCard.instanceId);
                setHoveredId(null);
              }}
              onMouseDown={(event) => {
                if (event.button === 2) dragSideRef.current = 'ain';
                else if (event.button === 0) dragSideRef.current = 'soph';
              }}
              onDragEnd={() => setDraggingId(null)}
            >

              {def && (() => {
                const artUrl = getCardBackgroundUrl(def);
                return artUrl ? <img src={artUrl} alt="" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }} /> : null;
              })()}

              <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
                {showTopPanel && (
                  <div style={getCardNameRibbonStyle('hand')}>
                    {def?.type && (
                      <div style={{ ...styles.subtype, color: cardFacePalette.textMuted, fontSize: faceMetrics.typeSize }}>{getDisplayCardTypeLabel(def.type)}</div>
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
                )}

                {showBottomPanel && (
                  <div style={getCardRulesPanelStyle('hand')}>
                    <div
                      style={{
                        ...styles.desc,
                        fontSize: descMetrics.fontSize,
                        lineHeight: descMetrics.lineHeight,
                        WebkitLineClamp: descMetrics.lineClamp,
                      }}
                    >
                      {highlightRulesText(previewText, { disabled: settings.highlightRulesText === false, compact: true, lightBg: true })}
                    </div>
                  </div>
                )}
              </div>

              {selected && (
                <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 11, color: warmTheme.danger }}>?</div>
              )}

              {isHovered && !isExtraDeckView && isPlaying && (
                <div style={{
                  position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                  marginBottom: 6, whiteSpace: 'nowrap', fontSize: 10, fontFamily: 'Georgia, serif',
                  background: 'rgba(10,8,6,0.92)', color: 'rgba(240,232,214,0.92)',
                  border: `1px solid ${warmTheme.border}`, borderRadius: 6, padding: '4px 8px',
                  pointerEvents: 'none', zIndex: 5,
                }}>
                  Left-click: place Soph · Right-click: place Ain
                </div>
              )}

              {/* Shimmer sweep on hover */}
              {isHovered && !selected && !isAnimatingOut && isPlayable && (
                <div style={{
                  position: 'absolute', inset: 0, overflow: 'hidden',
                  borderRadius: 10, pointerEvents: 'none',
                }}>
                  <div style={{
                      position: 'absolute', left: 0, right: 0, height: '45%',
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

