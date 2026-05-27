import { useState, useRef, useCallback, useMemo, memo } from 'react';
import { gsap } from 'gsap';
import { CardRegistry } from '@/cards/CardRegistry';
import {
  cardFacePalette,
  getCardBackBackgroundStyle,
  getCardFaceBackgroundStyle,
  getCardFaceMetrics,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';
import CardRulesDigest from '@/ui/components/CardRulesDigest';
import { getDisplayCardTypeLabel } from '@/ui/preferences';
import { getCardPreviewLines } from '@/ui/cardStatSummary';
import { warmTheme } from '@/ui/theme';
import type { CardDefinition } from '@/types/cards';

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

// Per-rarity reveal sounds synthesised via Web Audio API.
// Each rarity uses layered synthesis: a transient noise body plus a
// pitched resonant tail. Higher rarities are lower-frequency and longer —
// giving weight and drama rather than a cartoon "ta-da" effect.
let sharedAudioCtx: AudioContext | null = null;
function playRarityChime(rarity: string) {
  try {
    if (!sharedAudioCtx) {
      const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
      if (!Ctor) return;
      sharedAudioCtx = new Ctor();
    }
    if (sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume().catch(() => {});
    const ctx = sharedAudioCtx;
    const t0 = ctx.currentTime;

    // Helper: generate a white-noise buffer
    const noiseBuf = (dur: number) => {
      const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
      return buf;
    };

    if (rarity === 'Common') {
      // Dry card-flip: short bandpass noise, no tone
      const src = ctx.createBufferSource(); src.buffer = noiseBuf(0.06);
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 1.3;
      const g = ctx.createGain(); g.gain.value = 0.20;
      src.connect(f); f.connect(g); g.connect(ctx.destination); src.start(t0);
      return;
    }

    if (rarity === 'Rare') {
      // Crisp impact + brief metallic ring at 400 Hz (stable pitch)
      const src = ctx.createBufferSource(); src.buffer = noiseBuf(0.055);
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2100; f.Q.value = 1.4;
      const gn = ctx.createGain(); gn.gain.value = 0.22;
      src.connect(f); f.connect(gn); gn.connect(ctx.destination); src.start(t0);
      const osc = ctx.createOscillator(); const go = ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = 400;
      go.gain.setValueAtTime(0.10, t0); go.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24);
      osc.connect(go); go.connect(ctx.destination); osc.start(t0); osc.stop(t0 + 0.26);
      return;
    }

    if (rarity === 'Epic') {
      // Deep lowpass impact + low tone that descends (not rises)
      const src = ctx.createBufferSource(); src.buffer = noiseBuf(0.085);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1100;
      const gn = ctx.createGain(); gn.gain.value = 0.28;
      src.connect(f); f.connect(gn); gn.connect(ctx.destination); src.start(t0);
      const osc = ctx.createOscillator(); const go = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(270, t0); osc.frequency.exponentialRampToValueAtTime(210, t0 + 0.40);
      go.gain.setValueAtTime(0, t0); go.gain.linearRampToValueAtTime(0.13, t0 + 0.018);
      go.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.42);
      osc.connect(go); go.connect(ctx.destination); osc.start(t0); osc.stop(t0 + 0.44);
      return;
    }

    if (rarity === 'Legendary') {
      // Sub punch that drops in pitch + descending parallel fourths + noise body
      const osub = ctx.createOscillator(); const gsub = ctx.createGain();
      osub.type = 'sine';
      osub.frequency.setValueAtTime(150, t0); osub.frequency.exponentialRampToValueAtTime(55, t0 + 0.20);
      gsub.gain.setValueAtTime(0.30, t0); gsub.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24);
      osub.connect(gsub); gsub.connect(ctx.destination); osub.start(t0); osub.stop(t0 + 0.26);
      // Two descending triangle tones (perfect fourth apart) — sounds weighty, not cartoony
      ([220, 146.83] as number[]).forEach((startFreq, i) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(startFreq, t0);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 0.74, t0 + 0.44);
        g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.10 - i * 0.02, t0 + 0.016);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.48);
        osc.connect(g); g.connect(ctx.destination); osc.start(t0); osc.stop(t0 + 0.50);
      });
      const src = ctx.createBufferSource(); src.buffer = noiseBuf(0.09);
      const nf = ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 750;
      const ng = ctx.createGain(); ng.gain.value = 0.30;
      src.connect(nf); nf.connect(ng); ng.connect(ctx.destination); src.start(t0);
      return;
    }

    if (rarity === 'Eternal') {
      // Heavy sub thump + downward noise sweep + low minor-third swell
      const osub = ctx.createOscillator(); const gsub = ctx.createGain();
      osub.type = 'sine';
      osub.frequency.setValueAtTime(110, t0); osub.frequency.exponentialRampToValueAtTime(42, t0 + 0.30);
      gsub.gain.setValueAtTime(0.34, t0); gsub.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.34);
      osub.connect(gsub); gsub.connect(ctx.destination); osub.start(t0); osub.stop(t0 + 0.36);
      const src = ctx.createBufferSource(); src.buffer = noiseBuf(0.14);
      const nf = ctx.createBiquadFilter(); nf.type = 'lowpass';
      nf.frequency.setValueAtTime(2600, t0); nf.frequency.exponentialRampToValueAtTime(250, t0 + 0.14);
      const ng = ctx.createGain(); ng.gain.value = 0.30;
      src.connect(nf); nf.connect(ng); ng.connect(ctx.destination); src.start(t0);
      // Low minor-third swell: C3 + Eb3 (196 + 233 Hz)
      ([196, 233] as number[]).forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        g.gain.setValueAtTime(0, t0 + 0.05); g.gain.linearRampToValueAtTime(0.09 - i * 0.02, t0 + 0.16);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.70);
        o.connect(g); g.connect(ctx.destination); o.start(t0 + 0.05); o.stop(t0 + 0.72);
      });
      return;
    }

    // ── Infinite: grandest — cascading sub drop + noise rush + power fifth
    const osub = ctx.createOscillator(); const gsub = ctx.createGain();
    osub.type = 'sine';
    osub.frequency.setValueAtTime(125, t0); osub.frequency.exponentialRampToValueAtTime(38, t0 + 0.40);
    gsub.gain.setValueAtTime(0.38, t0); gsub.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.44);
    osub.connect(gsub); gsub.connect(ctx.destination); osub.start(t0); osub.stop(t0 + 0.46);
    const src2 = ctx.createBufferSource(); src2.buffer = noiseBuf(0.20);
    const nf2 = ctx.createBiquadFilter(); nf2.type = 'lowpass';
    nf2.frequency.setValueAtTime(3200, t0); nf2.frequency.exponentialRampToValueAtTime(180, t0 + 0.20);
    const ng2 = ctx.createGain(); ng2.gain.value = 0.32;
    src2.connect(nf2); nf2.connect(ng2); ng2.connect(ctx.destination); src2.start(t0);
    // Power fifth + octave: C3 + G3 + C4 — staggered swell
    ([130.81, 196.00, 261.63] as number[]).forEach((freq, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      const delay = i * 0.028;
      g.gain.setValueAtTime(0, t0 + delay); g.gain.linearRampToValueAtTime(0.09 - i * 0.014, t0 + delay + 0.10);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.90);
      o.connect(g); g.connect(ctx.destination); o.start(t0 + delay); o.stop(t0 + 0.92);
    });
  } catch {
    // Audio is best-effort; silently ignore failures.
  }
}

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

// ─── Memoized card tile ─────────────────────────────────────────────────────
// Extracted + React.memo'd so that flipping one tile only re-renders that
// single tile (not all 100). Critical for bulk 10×/100× pack opens.

interface CardTileProps {
  idx: number;
  defId: string;
  def: CardDefinition | undefined;
  rarity: string;
  isRevealed: boolean;
  isBest: boolean;
  isNew: boolean;
  faceMetrics: ReturnType<typeof getCardFaceMetrics>;
  registerRef: (idx: number, el: HTMLDivElement | null) => void;
  onClick: (idx: number) => void;
  /** Stagger the flip visually via CSS transition-delay (ms). */
  flipDelayMs: number;
}

const CardTile = memo(function CardTile({
  idx, defId, def, rarity, isRevealed, isBest, isNew, faceMetrics, registerRef, onClick, flipDelayMs,
}: CardTileProps) {
  return (
    <div
      style={{
        perspective: 600,
        width: 140,
        height: 190,
        cursor: isRevealed ? 'default' : 'pointer',
        borderRadius: 12,
        ...(isBest ? {
          animation: 'bestCardPulse 1.4s ease-in-out infinite',
          border: '2px solid rgba(255, 215, 100, 0.85)',
        } : {}),
      }}
      onClick={() => onClick(idx)}
    >
      <div
        ref={el => registerRef(idx, el)}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.52s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: isRevealed && flipDelayMs > 0 ? `${flipDelayMs}ms` : '0ms',
          transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
          borderRadius: 10,
          willChange: isRevealed ? 'auto' : 'transform',
        }}
      >
        {/* Back face */}
        <div
          style={{
            ...cardFaceStyle,
            ...getCardBackBackgroundStyle(def),
            border: `2px solid ${warmTheme.border}`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={def ? getCardPreviewLines(def, 4).join('\n') : defId}
        >
          <div style={{ fontSize: 32, opacity: 0.3 }}>?</div>
        </div>

        {/* Front face — heavy CardRulesDigest is only mounted once revealed,
            which is the single biggest cost saver for bulk pack opens. */}
        <div style={{
          ...cardFaceStyle,
          ...getCardFaceBackgroundStyle(def),
          border: `2px solid ${RARITY_COLORS[rarity]}`,
          transform: 'rotateY(180deg)',
        }}>
          {isRevealed && (
            <>
              <div style={getCardNameRibbonStyle('pack')}>
                <div style={{ ...styles.cardType, fontSize: faceMetrics.typeSize }}>
                  {getDisplayCardTypeLabel(def?.type ?? 'Card')}
                </div>
                <div style={{ ...styles.cardName, fontSize: faceMetrics.nameSize }}>{def?.name ?? defId}</div>
              </div>
              <div style={getCardRulesPanelStyle('pack')}>
                <div style={{ ...styles.cardDesc, fontSize: faceMetrics.descSize, lineHeight: faceMetrics.descLineHeight }}>
                  {def && (
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
                  )}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
});

const RARITY_RANK: Record<string, number> = { Common: 0, Rare: 1, Epic: 2, Legendary: 3, Eternal: 4, Infinite: 5 };

export default function PackOpeningModal({ cards, packName, newCards, onClose }: Props) {
  const faceMetrics = getCardFaceMetrics('pack');
  // Use a Set<number> + a tick counter so each tile can shallow-compare its
  // `isRevealed` boolean prop and skip re-rendering when only siblings change.
  const [revealedSet, setRevealedSet] = useState<Set<number>>(() => new Set());
  const [allRevealedFlag, setAllRevealedFlag] = useState(false);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Pre-compute per-card rarity + best-card index (memoized so it doesn't run every render).
  const { rarities, bestIdx } = useMemo(() => {
    const r: string[] = new Array(cards.length);
    let bIdx = -1; let bRank = -1;
    for (let i = 0; i < cards.length; i++) {
      const rarity = CardRegistry.get(cards[i])?.rarity ?? 'Common';
      r[i] = rarity;
      const rank = RARITY_RANK[rarity] ?? 0;
      if (rank > bRank) { bRank = rank; bIdx = i; }
    }
    return { rarities: r, bestIdx: bIdx };
  }, [cards]);

  // True for any bulk open — skip per-card audio/glow spam and use CSS-only
  // flip stagger to avoid 100 separate React state updates.
  const isBulkOpen = cards.length >= 10;

  const registerRef = useCallback((idx: number, el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(idx, el);
    else cardRefs.current.delete(idx);
  }, []);

  const triggerGlowBurst = useCallback((idx: number, rarity: string) => {
    const el = cardRefs.current.get(idx);
    if (!el) return;
    gsap.fromTo(el,
      { boxShadow: `0 0 50px ${RARITY_GLOW_BRIGHT[rarity] ?? 'rgba(255,255,255,0.8)'}` },
      { boxShadow: `0 0 20px ${RARITY_GLOW[rarity] ?? 'rgba(255,255,255,0.3)'}`, duration: 0.7, ease: 'power2.out' }
    );
  }, []);

  const handleCardClick = useCallback((idx: number) => {
    setRevealedSet(prev => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    const rarity = rarities[idx] ?? 'Common';
    playRarityChime(rarity);
    setTimeout(() => triggerGlowBurst(idx, rarity), 260);
  }, [rarities, triggerGlowBurst]);

  // Reveal-all: single state flip + CSS transition-delay stagger. No 100×
  // setState avalanche, no 100× gsap.delayedCall.
  const revealAll = useCallback(() => {
    setAllRevealedFlag(true);
    setRevealedSet(() => {
      const next = new Set<number>();
      for (let i = 0; i < cards.length; i++) next.add(i);
      return next;
    });
    if (!isBulkOpen) {
      // Small packs: keep the per-card chime + glow cascade.
      cards.forEach((_id, idx) => {
        const rarity = rarities[idx] ?? 'Common';
        setTimeout(() => {
          playRarityChime(rarity);
          triggerGlowBurst(idx, rarity);
        }, idx * 80 + 260);
      });
    } else if (bestIdx >= 0) {
      // Bulk opens: one chime + one glow on the best card only.
      const rarity = rarities[bestIdx] ?? 'Common';
      playRarityChime(rarity);
      setTimeout(() => triggerGlowBurst(bestIdx, rarity), 300);
    }
  }, [cards, rarities, triggerGlowBurst, isBulkOpen, bestIdx]);

  const instantReveal = useCallback(() => {
    setAllRevealedFlag(true);
    setRevealedSet(() => {
      const next = new Set<number>();
      for (let i = 0; i < cards.length; i++) next.add(i);
      return next;
    });
    if (bestIdx >= 0) {
      const rarity = rarities[bestIdx] ?? 'Common';
      setTimeout(() => triggerGlowBurst(bestIdx, rarity), 80);
    }
  }, [cards.length, rarities, triggerGlowBurst, bestIdx]);

  const allRevealed = allRevealedFlag || revealedSet.size === cards.length;
  // Best unrevealed (drives the pulsing border + "Reveal Best" label).
  let bestUnrevealedIdx = -1;
  if (!allRevealed) {
    let bRank = -1;
    for (let i = 0; i < cards.length; i++) {
      if (revealedSet.has(i)) continue;
      const rank = RARITY_RANK[rarities[i]] ?? 0;
      if (rank > bRank) { bRank = rank; bestUnrevealedIdx = i; }
    }
  }
  const bestIsLegendaryPlus = bestUnrevealedIdx >= 0 && (RARITY_RANK[rarities[bestUnrevealedIdx]] ?? 0) >= 3;

  return (
    <div className="anim-backdrop-fade" style={styles.backdrop}>
      <div className="anim-panel-slide-up" style={styles.panel}>
        <div style={styles.title}>{packName} — Opened!</div>

        <div style={styles.cardRow}>
          {cards.map((defId, idx) => {
            const def = CardRegistry.get(defId);
            const isRevealed = revealedSet.has(idx);
            // CSS-only stagger for the visual flip (cheap; no extra renders).
            const flipDelayMs = isBulkOpen && allRevealedFlag ? Math.min(idx * 18, 1200) : 0;
            return (
              <CardTile
                key={defId + idx}
                idx={idx}
                defId={defId}
                def={def}
                rarity={rarities[idx]}
                isRevealed={isRevealed}
                isBest={idx === bestUnrevealedIdx}
                isNew={newCards.has(defId)}
                faceMetrics={faceMetrics}
                registerRef={registerRef}
                onClick={handleCardClick}
                flipDelayMs={flipDelayMs}
              />
            );
          })}
        </div>

        {!allRevealed ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button data-sfx="claim" style={styles.closeBtn} onClick={revealAll}>
              {bestIsLegendaryPlus ? 'Reveal Best' : 'Reveal All'}
            </button>
            <button
              data-sfx="claim"
              style={{ ...styles.closeBtn, background: 'rgba(60, 40, 20, 0.78)', color: '#f0bd78', border: `1px solid ${warmTheme.border}` }}
              onClick={instantReveal}
              title="Skip animation"
            >
              Instant
            </button>
          </div>
        ) : (
          <button data-sfx="claim" style={styles.closeBtn} onClick={onClose}>
            Collect
          </button>
        )}
      </div>
    </div>
  );
}
