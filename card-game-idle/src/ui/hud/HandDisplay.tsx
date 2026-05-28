import { useEffect, useMemo, useState } from 'react';
import { useStore, selectDeck, selectTurn, selectBoard, selectProgress, selectSettings, selectBattleground, selectBossFight } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { ELEMENT_COLORS, ELEMENT_SET_NAMES } from '@/data/elements';
import { CardEffectExecutor } from '@/systems/cards/CardEffectExecutor';
import {
  cardFacePalette,
  getAdaptiveDescriptionMetrics,
  getCardBackgroundUrl,
  getCardFaceBackgroundStyle,
  getCardFaceMetrics,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';
import CardEngineCallout from '@/ui/components/CardEngineCallout';
import CardRulesDigest from '@/ui/components/CardRulesDigest';
import { getDisplayCardTypeLabel } from '@/ui/preferences';
import { getCardPreviewText } from '@/ui/cardStatSummary';
import { highlightRulesText } from '@/ui/text/highlightRulesText';
import { getSetEngineSnapshotForCard } from '@/ui/setEngineSummary';
import { getActionClassLabel, getCardActionClass } from '@/systems/cards/ActionClass';
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
  Ophanim:   '#c888f0',
  Cherubim:    '#b87de8',
  Angel:    '#FFD700',
};

const TOOLTIP_META_COLOR = 'rgba(58, 40, 24, 0.86)';
const TOOLTIP_DETAIL_COLOR = 'rgba(52, 36, 20, 0.94)';

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
    right: 'var(--angel-drawer-hand-offset, 348px)',

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
    gap: 12,
    pointerEvents: 'auto',
    position: 'relative',
    overflowX: 'auto',
    overflowY: 'clip',
    maxWidth: '100%',
    paddingBottom: 10,
    paddingTop: 24,
    scrollbarGutter: 'stable',
  },
  card: {
    width: 'clamp(116px, 8.2vw, 132px)',
    height: 'clamp(168px, 11.8vw, 188px)',
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
  tooltip: {
    position: 'absolute',
    bottom: 242,
    left: '50%',
    width: 270,
    background: 'linear-gradient(180deg, rgba(247, 239, 226, 0.995) 0%, rgba(235, 218, 190, 0.99) 100%)',
    border: `1px solid ${warmTheme.borderStrong}`,
    borderRadius: 14,
    padding: '14px 16px',
    pointerEvents: 'none',
    zIndex: 90,
    boxShadow: '0 22px 40px rgba(0,0,0,0.42), 0 0 0 1px rgba(255,255,255,0.38)',
    backdropFilter: 'blur(10px)',
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
    flexDirection: 'column',
    gap: 6,
    alignItems: 'flex-start',
    fontSize: 10,
    opacity: 1,
    color: TOOLTIP_META_COLOR,
    lineHeight: 1.35,
  },
};

function formatAttackCosts(costs: ReadonlyArray<{ type: string; value: number }> | undefined): string {
  if (!costs || costs.length === 0) return 'none';
  return costs.map(cost => `${cost.type.replace(/_/g, ' ')} ${cost.value}`).join(', ');
}

function formatSeraphimSynergyLine(def: SeraphimDefinition): string {
  const { bonusType, bonusValue } = def.baseStats;
  switch (bonusType) {
    case 'cherubim_expire_bonus':
      return `Synergy: whenever a Cherubim expires, gain +${bonusValue} Oblivion`;
    case 'cherubim_extra_plays':
      return `Synergy: Cherubim gain +${bonusValue} durability`;
    case 'ophanim_bonus':
      return `Synergy: Ophanim plays gain +${bonusValue} Oblivion`;
    case 'ember_per_card':
      return `Synergy: +${bonusValue} embers per card played`;
    case 'oblivion_per_card':
      return `Synergy: attack profile scales with card-play Oblivion focus (+${bonusValue})`;
    default:
      return `Synergy: ${bonusType.replace(/_/g, ' ')} +${bonusValue}`;
  }
}

export default function HandDisplay() {
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
  const { playCard, toggleMulliganCard, summonAngel } = useStore.getState();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [idleShowcaseCards, setIdleShowcaseCards] = useState<IdleShowcaseCard[]>([]);
  const [idleSwapState, setIdleSwapState] = useState<{ slot: number; phase: 'out' | 'in' } | null>(null);
  // Hand <-> Extra Deck view toggle. Driven by the configurable keybind in
  // App.tsx via the 'hr-toggle-extra-deck' window event. Read-only relocation
  // — Angels are still summoned through AngelCompartment.
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
  useEffect(() => { setHandView('hand'); }, [turn.phase]);

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

  function handleClick(instanceId: string) {
    if (isExtraDeckView) {
      // Summon an Angel from the Extra Deck when conditions are met.
      if (!isPlaying) return;
      const deckCard = viewCards.find(c => c.instanceId === instanceId);
      if (!deckCard) return;
      const def = CardRegistry.get(deckCard.definitionId);
      if (!def || def.type !== 'Angel') return;
      if (!CardEffectExecutor.checkPlayable(def, 0, turn, board)) return;
      summonAngel(deckCard.definitionId, deckCard.finish);
      setHandView('hand');
      window.dispatchEvent(new Event('hud-shake-soft'));
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
        playCard(instanceId);
        setPlayingCardId(null);
      }, 260);
    }
  }

  const showActiveHand = isMulligan || isPlaying;
  const showIdleShowcase = isIdle && bossFight.mode !== 'active';
  // Cards to render in the bottom hand strip. Either the live hand (default)
  // or a read-only relocation of the Extra Deck. Synthetic instanceIds for
  // extra-deck entries keep React keys stable across renders.
  const viewCards: Array<{ instanceId: string; definitionId: string; finish: typeof hand[number]['finish'] }> =
    isExtraDeckView
      ? deck.extraDeck.map((entry, i) => ({
          instanceId: `extra-${i}-${entry.definitionId}-${entry.finish}`,
          definitionId: entry.definitionId,
          finish: entry.finish,
        }))
      : hand
          .filter(deckCard => CardRegistry.get(deckCard.definitionId)?.type !== 'Angel')
          .map(c => ({ instanceId: c.instanceId, definitionId: c.definitionId, finish: c.finish }));
  const hasActiveHandCards = viewCards.length > 0;

  const hoveredDeckCard = hoveredId
    ? (isExtraDeckView
        ? viewCards.find(c => c.instanceId === hoveredId)
        : hand.find(c => c.instanceId === hoveredId))
    : null;
  const hoveredDef = hoveredDeckCard ? CardRegistry.get(hoveredDeckCard.definitionId) : null;
  const hoveredActionClassLabel = hoveredDef ? getActionClassLabel(getCardActionClass(hoveredDef)) : null;
  const hoveredEngine = hoveredDef ? getSetEngineSnapshotForCard(hoveredDef, turn, board) : null;
  const handRightInset = 'var(--angel-drawer-hand-offset, 348px)';

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

      {/* Tooltip ? positioned relative to overlay so it is never clipped by hand overflow */}
      {hoveredDef && (
        <div key={hoveredId} style={{ ...styles.tooltip, animation: 'tooltipFadeIn 0.18s ease both' }}>
          <div style={{
            ...styles.tooltipSubtype,
            color: TYPE_COLORS[hoveredDef.type] ?? '#aaa',
          }}>
            {getDisplayCardTypeLabel(hoveredDef.type)}
          </div>
          <div style={styles.tooltipName}>{hoveredDef.name}</div>
          <div style={styles.tooltipDesc}>
            <CardRulesDigest
              card={hoveredDef}
              variant="preview"
              maxSections={3}
              maxLinesPerSection={10}
              lineClamp={3}
              labelColor="rgba(74, 48, 21, 0.82)"
              textColor={warmTheme.accentDeep}
              sectionBackground="transparent"
              sectionBorder="transparent"              lightBg={true}            />
          </div>
          <CardEngineCallout card={hoveredDef} variant="detail" tone="light" />
          <div style={styles.tooltipFooter}>
            <span style={{ color: ELEMENT_COLORS[hoveredDef.element] ?? '#aaa' }}>
              {ELEMENT_SET_NAMES[hoveredDef.element] ?? hoveredDef.element}
            </span>
            {hoveredActionClassLabel && (
              <span style={{ color: TOOLTIP_DETAIL_COLOR }}>
                Action Class: {hoveredActionClassLabel}
              </span>
            )}
            {hoveredEngine && (
              <span style={{ color: hoveredEngine.accent, fontWeight: 700 }}>
                {hoveredEngine.label} engine: {hoveredEngine.compact}
              </span>
            )}
            {hoveredDef.type === 'Angel' && (
              <>
                <span style={{ color: TOOLTIP_DETAIL_COLOR }}>
                  Cost: {(hoveredDef as AngelDefinition).summonCost.map(id => CardRegistry.get(id)?.name ?? id).join(', ')}
                </span>
                <span style={{ color: TOOLTIP_DETAIL_COLOR }}>
                  Attacks: Primary + Exalted (cards-play cooldown)
                </span>
              </>
            )}
            {hoveredDef.type === 'Seraphim' && (
              <>
                <span style={{ color: TOOLTIP_DETAIL_COLOR }}>
                  {formatSeraphimSynergyLine(hoveredDef as SeraphimDefinition)}
                </span>
                {(() => {
                  const attacks = (hoveredDef as SeraphimDefinition).attacks;
                  if (!attacks) {
                    return (
                      <span style={{ color: TOOLTIP_DETAIL_COLOR }}>
                        Attacks: Unsynergized + Synergized (Angel required)
                      </span>
                    );
                  }
                  return (
                    <>
                      <span style={{ color: TOOLTIP_DETAIL_COLOR }}>
                        Unsynergized - {attacks.unsynergized.name} | Oblivion {attacks.unsynergized.baseOblivion} | Cooldown {attacks.unsynergized.cooldownCards} cards
                      </span>
                      <span style={{ color: TOOLTIP_DETAIL_COLOR }}>
                        Synergized - {attacks.synergized.name} | Oblivion {attacks.synergized.baseOblivion} | Cooldown {attacks.synergized.cooldownCards} cards
                      </span>
                      <span style={{ color: TOOLTIP_DETAIL_COLOR }}>
                        Requires Angel: {attacks.synergized.requiresAngelOnBoard ? 'Yes' : 'No'} | Cost: {formatAttackCosts(attacks.synergized.costs)}
                      </span>
                    </>
                  );
                })()}
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
              Press E to swap
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
          const selected = !isExtraDeckView && turn.mulliganSelected.includes(deckCard.instanceId);
          const isHovered = hoveredId === deckCard.instanceId;
          const isAnimatingOut = !isExtraDeckView && playingCardId === deckCard.instanceId;
          const isPlayable = isExtraDeckView
            ? (isPlaying && !!def && def.type === 'Angel' && CardEffectExecutor.checkPlayable(def, 0, turn, board))
            : (!isPlaying || !def || CardEffectExecutor.checkPlayable(def, hand.length, turn, board));
          const previewText = def ? getCardPreviewText(def, 2) : 'Card data unavailable';
          const descMetrics = getAdaptiveDescriptionMetrics('hand', previewText);
          const nameLength = (def?.name ?? '').length;
          const adaptiveNameSize = nameLength > 24 ? faceMetrics.nameSize - 2.2 : nameLength > 16 ? faceMetrics.nameSize - 1.0 : faceMetrics.nameSize;

          // Neutrality cards get a cool silver shimmer, others get warm white
          const shimmerColor = def?.element === 'Neutrality'
            ? 'linear-gradient(90deg, transparent, rgba(200,210,255,0.09), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)';

          const isDraggable = !isExtraDeckView && isPlaying && isPlayable && (def?.type === 'Seraphim' || def?.type === 'Ophanim' || def?.type === 'Cherubim');
          const isDragging = !isExtraDeckView && draggingId === deckCard.instanceId;
          const isGuideHighlighted = isPlaying && !isExtraDeckView && guideHighlightDefId === deckCard.definitionId;

          return (
            <div
              key={`${deckCard.instanceId}_${deckCard.definitionId}_${idx}`}
              className={[
                isAnimatingOut ? 'anim-card-play-out' : undefined,
                deckCard.finish === 'holo'
                  ? `holofoil-live-card${def?.rarity === 'Infinite' ? ' holofoil-live-card--infinite' : ''}${def?.rarity === 'Eternal' ? ' holofoil-live-card--eternal' : ''}`
                  : undefined,
                isGuideHighlighted ? 'trial-guide-pulse' : undefined,
              ].filter(Boolean).join(' ') || undefined}
              draggable={isDraggable}
              style={{
                ...styles.card,
                ...getCardFaceBackgroundStyle(def, deckCard.finish),
                ...(selected ? styles.cardMulligan : {}),
                ...(!isPlayable ? { opacity: 0.35, cursor: 'not-allowed', filter: 'grayscale(0.5)' } : {}),
                ...(isDragging ? { opacity: 0.45, transform: 'scale(0.97)' } : {}),
                ...(artOnlyMode ? { boxShadow: '0 0 0 2px rgba(255,255,255,0.65), 0 4px 16px rgba(0,0,0,0.5)' } : {}),
                ...(isHovered && !selected && !isAnimatingOut && isPlayable && !isDragging ? {
                  transform: 'translateY(-16px) scale(1.025)',
                  boxShadow: artOnlyMode
                    ? '0 0 0 2px rgba(255,255,255,0.9), 0 12px 32px rgba(0,0,0,0.65)'
                    : `0 0 0 1px rgba(180,220,255,0.55), 0 14px 36px rgba(120,200,255,0.22), 0 4px 14px rgba(0,0,0,0.6)`,
                  borderColor: artOnlyMode ? 'rgba(255,255,255,0.8)' : 'rgba(180,220,255,0.7)',
                } : {}),
              }}
              onClick={() => handleClick(deckCard.instanceId)}
              onMouseEnter={() => setHoveredId(deckCard.instanceId)}
              onMouseLeave={() => setHoveredId(null)}
              onDragStart={(e) => {
                if (!isDraggable || !def) return;
                const mimeType = def.type === 'Seraphim'
                  ? 'application/x-seraphim-card'
                  : 'application/x-cherubim-card';
                e.dataTransfer.setData(mimeType, deckCard.instanceId);
                e.dataTransfer.effectAllowed = 'move';
                setDraggingId(deckCard.instanceId);
                setHoveredId(null);
              }}
              onDragEnd={() => setDraggingId(null)}
            >
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

              {selected && (
                <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 11, color: warmTheme.danger }}>?</div>
              )}

              {/* Neutrality "marked" indicator — card was stamped by Temporal Ruin
                  or similar; playing it grants +N Patience to all Seraphim */}
              {!isExtraDeckView && (turn.neutralityMarkedCardIds ?? []).includes(deckCard.instanceId) && (
                <div style={{
                  position: 'absolute',
                  bottom: 5,
                  right: 5,
                  zIndex: 10,
                  padding: '2px 6px',
                  borderRadius: 999,
                  border: '1px solid rgba(166,198,255,0.45)',
                  background: 'rgba(24, 20, 52, 0.88)',
                  color: 'rgba(200,220,255,0.96)',
                  fontSize: 8,
                  lineHeight: 1,
                  letterSpacing: 0.5,
                  fontFamily: 'Georgia, serif',
                  fontWeight: 700,
                  pointerEvents: 'none',
                  boxShadow: '0 2px 8px rgba(80,120,255,0.32)',
                }}>
                  {`★ +${turn.neutralityMarkedPatienceGain ?? 0} Pat`}
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
