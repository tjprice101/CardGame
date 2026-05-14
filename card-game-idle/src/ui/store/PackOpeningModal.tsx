import { useState, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { CardRegistry } from '@/cards/CardRegistry';
import {
  cardFacePalette,
  getCardFaceBackgroundStyle,
  getCardFaceMetrics,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';
import { warmTheme } from '@/ui/theme';

const RARITY_COLORS: Record<string, string> = {
  Common: '#999', Rare: '#5b9bd5', Epic: '#9b59b6', Legendary: '#f39c12', Eternal: '#ff6b6b', Infinite: '#e8e8f0',
};

const RARITY_GLOW: Record<string, string> = {
  Common: 'rgba(153,153,153,0.3)',
  Rare: 'rgba(91,155,213,0.4)',
  Epic: 'rgba(155,89,182,0.5)',
  Legendary: 'rgba(243,156,18,0.6)',
};

const RARITY_GLOW_BRIGHT: Record<string, string> = {
  Common: 'rgba(153,153,153,0.7)',
  Rare: 'rgba(91,155,213,0.9)',
  Epic: 'rgba(155,89,182,0.9)',
  Legendary: 'rgba(243,156,18,1.0)',
};

const cardFaceStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderRadius: 10,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
  background: warmTheme.surfaceStrong,
  overflow: 'hidden',
};

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: warmTheme.backdrop,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
    fontFamily: 'Georgia, serif',
  },
  panel: {
    background: warmTheme.surfaceStrong,
    border: `1px solid ${warmTheme.borderStrong}`,
    borderRadius: 18,
    padding: '28px 32px',
    maxWidth: 640,
    width: '90%',
    maxHeight: '90vh',
    boxShadow: warmTheme.shadow,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
    overflow: 'hidden',
  },
  title: {
    fontSize: 15,
    color: warmTheme.accentDeep,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  cardRow: {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
    flexWrap: 'wrap',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  cardType: {
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: cardFacePalette.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  cardName: {
    fontWeight: 'bold',
    color: cardFacePalette.text,
    textAlign: 'center',
    lineHeight: 1.4,
  },
  cardDesc: {
    color: cardFacePalette.textSoft,
    textAlign: 'center',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardRarity: {
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  closeBtn: {
    padding: '10px 32px',
    borderRadius: 10,
    border: `1px solid ${warmTheme.borderStrong}`,
    background: warmTheme.button,
    color: warmTheme.accentDeep,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
    letterSpacing: 1,
  },
};

interface Props {
  cards: string[];
  packName: string;
  newCards: Set<string>;
  onClose: () => void;
}

export default function PackOpeningModal({ cards, packName, newCards, onClose }: Props) {
  const faceMetrics = getCardFaceMetrics('pack');
  const [revealed, setRevealed] = useState<boolean[]>(new Array(cards.length).fill(false));
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const triggerGlowBurst = useCallback((idx: number, rarity: string) => {
    const el = cardRefs.current.get(idx);
    if (!el) return;
    gsap.fromTo(el,
      { boxShadow: `0 0 50px ${RARITY_GLOW_BRIGHT[rarity] ?? 'rgba(255,255,255,0.8)'}` },
      { boxShadow: `0 0 20px ${RARITY_GLOW[rarity] ?? 'rgba(255,255,255,0.3)'}`, duration: 0.7, ease: 'power2.out' }
    );
  }, []);

  const handleCardClick = useCallback((idx: number) => {
    if (revealed[idx]) return;
    setRevealed(prev => {
      const next = [...prev];
      next[idx] = true;
      return next;
    });
    const def = CardRegistry.get(cards[idx]);
    const rarity = def?.rarity ?? 'Common';
    setTimeout(() => triggerGlowBurst(idx, rarity), 260);
  }, [revealed, cards, triggerGlowBurst]);

  const revealAll = useCallback(() => {
    const unrevealedIndices: number[] = [];
    revealed.forEach((r, i) => { if (!r) unrevealedIndices.push(i); });
    unrevealedIndices.forEach((cardIdx, order) => {
      gsap.delayedCall(order * 0.08, () => {
        setRevealed(prev => {
          const next = [...prev];
          next[cardIdx] = true;
          return next;
        });
        const def = CardRegistry.get(cards[cardIdx]);
        const rarity = def?.rarity ?? 'Common';
        setTimeout(() => triggerGlowBurst(cardIdx, rarity), 260);
      });
    });
  }, [revealed, cards, triggerGlowBurst]);

  const allRevealed = revealed.every(Boolean);

  return (
    <div className="anim-backdrop-fade" style={styles.backdrop}>
      <div className="anim-panel-slide-up" style={styles.panel}>
        <div style={styles.title}>{packName} — Opened!</div>

        <div style={styles.cardRow}>
          {cards.map((defId, idx) => {
            const def = CardRegistry.get(defId);
            const isNew = newCards.has(defId);
            const rarity = def?.rarity ?? 'Common';
            const isRevealed = revealed[idx];

            return (
              /* Perspective container */
              <div
                key={defId + idx}
                style={{ perspective: 600, width: 140, height: 190, cursor: isRevealed ? 'default' : 'pointer' }}
                onClick={() => handleCardClick(idx)}
              >
                {/* Flip inner — ref on this for glow burst */}
                <div
                  ref={el => { if (el) cardRefs.current.set(idx, el); }}
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.52s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    borderRadius: 10,
                  }}
                >
                  {/* Back face */}
                  <div style={{
                    ...cardFaceStyle,
                    border: `2px solid ${warmTheme.border}`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <div style={{ fontSize: 32, opacity: 0.3 }}>?</div>
                  </div>

                  {/* Front face */}
                  <div style={{
                    ...cardFaceStyle,
                    ...getCardFaceBackgroundStyle(def),
                    border: `2px solid ${RARITY_COLORS[rarity]}`,
                    transform: 'rotateY(180deg)',
                  }}>
                    <div style={getCardNameRibbonStyle('pack')}>
                      <div style={{ ...styles.cardType, fontSize: faceMetrics.typeSize }}>
                        {def?.type === 'Seraphim' ? 'Seraphim' : def?.type === 'Seeker' ? 'Seeker' : def?.type === 'Chaos' ? 'Chaos' : 'Card'}
                      </div>
                      <div style={{ ...styles.cardName, fontSize: faceMetrics.nameSize }}>{def?.name ?? defId}</div>
                    </div>
                    <div style={getCardRulesPanelStyle('pack')}>
                      <div style={{ ...styles.cardDesc, fontSize: faceMetrics.descSize, lineHeight: faceMetrics.descLineHeight, WebkitLineClamp: faceMetrics.descLines }}>
                        {def?.description ?? ''}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 8 }}>
                        <div style={{ ...styles.cardRarity, color: cardFacePalette.textMuted }}>{rarity}</div>
                        {isNew && (
                          <span className="anim-badge-bounce" style={{
                            fontSize: 8,
                            color: warmTheme.success,
                            letterSpacing: 2,
                            textTransform: 'uppercase',
                            fontWeight: 'bold',
                          }}>
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!allRevealed ? (
          <button style={styles.closeBtn} onClick={revealAll}>
            Reveal All
          </button>
        ) : (
          <button style={styles.closeBtn} onClick={onClose}>
            Collect
          </button>
        )}
      </div>
    </div>
  );
}
