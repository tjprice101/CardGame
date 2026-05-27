import { useEffect, useState } from 'react';
import { uiTypography } from '@/ui/theme';
import { useStore, selectSettings } from '@/state/store';

/**
 * Parallax title screen. Card art from across the game's sets is displayed in
 * two fanned clusters flanking the centred logotype and prompt. Any key, click,
 * or tap advances to the main menu.
 */

const BASE = import.meta.env.BASE_URL;

/** Helper: build a card-backgrounds asset URL. */
function card(set: string, name: string): string {
  return `${BASE}assets/card-backgrounds/${set}/${encodeURIComponent(name)}.png`;
}

/** Card width — shared constant so height (via aspect-ratio) stays consistent. */
const CARD_W = 'clamp(128px, 13.5vw, 196px)';

interface CardSpec {
  src: string;
  /** CSS rotation applied to the outer rotate-wrapper. */
  rot: number;
  /** Absolute positioning for the outer rotate-wrapper. */
  pos: React.CSSProperties;
  /** Element opacity (back cards are dimmer). */
  opacity: number;
  /** Float animation period in seconds. */
  dur: number;
  /** Float animation start delay in seconds. */
  delay: number;
  /** Edge-fade mask (cards near screen edge fade into the void). */
  fadeEdge?: 'left' | 'right';
}

// ── Left cluster — celestial / aquatic / cosmic ──────────────────────────────
const LEFT_CARDS: CardSpec[] = [
  {
    src: card('heavenly-light', 'Halo Legion Prime'),
    rot: -15, opacity: 0.52, dur: 5.0, delay: 0.4, fadeEdge: 'left',
    pos: { left: '-2%', top: '16%' },
  },
  {
    src: card('eternal-seas', 'Crowned One Azure Margin'),
    rot: -8, opacity: 0.74, dur: 5.4, delay: 1.2,
    pos: { left: '4%', top: '29%' },
  },
  {
    src: card('infinite', 'Genesis Throne'),
    rot: -2, opacity: 0.92, dur: 4.6, delay: 0.8,
    pos: { left: '10%', top: '43%' },
  },
];

// ── Right cluster — mechanical / infernal / celestial ────────────────────────
const RIGHT_CARDS: CardSpec[] = [
  {
    src: card('mechanical-dreams', 'Steel Hymn Executor'),
    rot: 15, opacity: 0.52, dur: 4.8, delay: 0.7, fadeEdge: 'right',
    pos: { right: '-2%', top: '16%' },
  },
  {
    src: card('black-glass-inferno', 'Morvakael the Twice-Scarred'),
    rot: 8, opacity: 0.74, dur: 5.2, delay: 1.5,
    pos: { right: '4%', top: '29%' },
  },
  {
    src: card('heavenly-light', 'Solarius Emberthorn Ascendant'),
    rot: 2, opacity: 0.92, dur: 4.4, delay: 0.2,
    pos: { right: '10%', top: '43%' },
  },
];

/** Single card rendered with outer rotate-wrapper + inner float-animation div. */
function ShowcaseCard({ c, reduced }: { c: CardSpec; reduced: boolean }) {
  const mask = c.fadeEdge === 'left'
    ? 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0.9) 65%, #000 100%)'
    : c.fadeEdge === 'right'
      ? 'linear-gradient(-90deg, transparent 0%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0.9) 65%, #000 100%)'
      : undefined;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        ...c.pos,
        width: CARD_W,
        aspectRatio: '5 / 7',
        transform: `rotate(${c.rot}deg)`,
        transformOrigin: 'bottom center',
        opacity: c.opacity,
        pointerEvents: 'none',
        willChange: reduced ? undefined : 'transform',
      }}
    >
      {/* Inner div animates Y only — outer div holds the rotation */}
      <div style={{
        width: '100%',
        height: '100%',
        backgroundImage: `url(${c.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        borderRadius: 9,
        boxShadow: [
          '0 14px 44px rgba(0,0,0,0.85)',
          '0 0 0 1px rgba(255,255,255,0.14)',
          'inset 0 0 0 1px rgba(255,255,255,0.06)',
        ].join(', '),
        maskImage: mask,
        WebkitMaskImage: mask,
        animation: reduced ? undefined : `titleCardFloat ${c.dur}s ease-in-out ${c.delay}s infinite`,
      }} />
    </div>
  );
}

export default function TitleScreen({ onAdvance }: { onAdvance: () => void }) {
  const settings = useStore(selectSettings);
  const reduced = !!settings.reducedMotion;
  const [fadeIn, setFadeIn] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setFadeIn(true), 20);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    function advance() {
      if (leaving) return;
      setLeaving(true);
      window.setTimeout(onAdvance, reduced ? 200 : 650);
    }
    window.addEventListener('keydown', advance);
    window.addEventListener('pointerdown', advance);
    return () => {
      window.removeEventListener('keydown', advance);
      window.removeEventListener('pointerdown', advance);
    };
  }, [onAdvance, leaving, reduced]);

  const sceneOpacity = !fadeIn ? 0 : leaving ? 0 : 1;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 180,
        overflow: 'hidden',
        cursor: 'pointer',
        opacity: sceneOpacity,
        transition: reduced ? 'opacity 200ms ease' : 'opacity 650ms ease',
        // Deep sky-navy — dark variant of the main menu art palette
        background: 'linear-gradient(180deg, #071426 0%, #0d2240 38%, #101e3a 65%, #06101e 100%)',
      }}
    >
      {/* ── Sky-art atmospheric light — matches the main menu luminosity ─── */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: [
          // Bright sky bloom from upper-center (evokes the menu art's sky)
          'radial-gradient(ellipse 90% 55% at 50% 20%, rgba(140,200,250,0.18) 0%, rgba(80,155,220,0.09) 45%, transparent 68%)',
          // Deep ocean-blue depth at the bottom
          'radial-gradient(ellipse 70% 38% at 50% 98%, rgba(20,55,110,0.30) 0%, transparent 60%)',
        ].join(', '),
      }} />

      {/* ── Side vignettes — cards dissolve into the sky at screen edges ── */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: [
          'linear-gradient(90deg,  rgba(7,20,38,0.85) 0%, rgba(7,20,38,0) 20%)',
          'linear-gradient(-90deg, rgba(7,20,38,0.85) 0%, rgba(7,20,38,0) 20%)',
        ].join(', '),
      }} />

      {/* ── Bottom vignette ───────────────────────────────────────────────── */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(7,20,38,0) 52%, rgba(7,20,38,0.90) 100%)',
      }} />

      {/* ── Card showcase ─────────────────────────────────────────────────── */}
      {LEFT_CARDS.map((c, i) => (
        <ShowcaseCard key={`l${i}`} c={c} reduced={reduced} />
      ))}
      {RIGHT_CARDS.map((c, i) => (
        <ShowcaseCard key={`r${i}`} c={c} reduced={reduced} />
      ))}

      {/* ── Centre vignette — keeps title crisp against card imagery ──────── */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 58% 70% at 50% 50%, rgba(7,20,38,0.75) 0%, rgba(7,20,38,0) 65%)',
      }} />

      {/* ── Foreground: logotype + prompt ─────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        textAlign: 'center',
        padding: '0 24px',
        pointerEvents: 'none',
      }}>
        {/* Small set-count label above title */}
        <div style={{
          fontFamily: uiTypography.body,
          fontSize: 9,
          letterSpacing: 5,
          color: 'rgba(140,200,245,0.52)',
          textTransform: 'uppercase',
          marginBottom: 18,
          userSelect: 'none',
        }}>
          18 Card Sets · Infinite Cards · Eternity's Wake
        </div>

        {/* Main wordmark */}
        <div style={{
          fontFamily: uiTypography.display,
          fontSize: 'clamp(46px, 8vw, 108px)',
          letterSpacing: 10,
          color: '#eef4fc',
          textShadow: [
            '0 0 56px rgba(100,180,240,0.60)',
            '0 0 110px rgba(60,140,210,0.25)',
            '0 6px 36px rgba(0,0,0,0.98)',
          ].join(', '),
          textTransform: 'uppercase',
          fontWeight: 400,
          lineHeight: 1,
          userSelect: 'none',
        }}>
          Pantheon
        </div>

        {/* Chrome divider */}
        <div aria-hidden style={{
          marginTop: 22, marginBottom: 20,
          width: 240, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(90,170,220,0.72), transparent)',
          boxShadow: '0 0 12px rgba(90,170,220,0.32)',
        }} />

        {/* Tagline */}
        <div style={{
          fontFamily: uiTypography.body,
          fontSize: 'clamp(10px, 1.1vw, 13px)',
          letterSpacing: 5,
          color: 'rgba(200,225,248,0.62)',
          textTransform: 'uppercase',
          userSelect: 'none',
        }}>
          Forge Gods. Outlast Eternity.
        </div>

        {/* Press Any Key prompt */}
        <div style={{
          marginTop: 60,
          padding: '13px 40px',
          border: '1px solid rgba(90,170,220,0.55)',
          borderRadius: 999,
          background: 'rgba(7,20,38,0.62)',
          backdropFilter: 'blur(4px)',
          fontFamily: uiTypography.body,
          fontSize: 'clamp(11px, 1.1vw, 14px)',
          letterSpacing: 4,
          color: '#deeefa',
          textTransform: 'uppercase',
          userSelect: 'none',
          animation: reduced ? undefined : 'pulseGlowBlue 1.8s ease-in-out infinite',
          boxShadow: '0 0 28px rgba(90,170,220,0.22)',
          pointerEvents: 'auto',
        }}>
          Press Any Key to Start
        </div>
      </div>
    </div>
  );
}
