import { useEffect, useState } from 'react';
import { uiTypography, warmTheme } from '@/ui/theme';
import { useStore, selectSettings } from '@/state/store';
import {
  DEFAULT_MAIN_MENU_BACKGROUND_ID,
  getDefaultMainMenuBackground,
  loadMainMenuBackgroundEntries,
  resolveMainMenuBackground,
} from '@/data/profile/mainMenuBackgrounds';

function toRgbTriplet(color: string): [number, number, number] | null {
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const raw = hex[1];
    const full = raw.length === 3 ? raw.split('').map(ch => ch + ch).join('') : raw;
    const value = parseInt(full, 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }
  const rgb = color.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return null;
}

function withAlpha(color: string, alpha: number): string {
  const rgb = toRgbTriplet(color);
  if (!rgb) return color;
  const clamped = Math.max(0, Math.min(1, alpha));
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${clamped})`;
}

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
  const selectedMainMenuBackgroundId = useStore((s) => s.progress.profile.mainMenuBackgroundId);
  const reduced = !!settings.reducedMotion;
  const [fadeIn, setFadeIn] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [titleArtUrl, setTitleArtUrl] = useState<string>(() => getDefaultMainMenuBackground().imageUrl);
  const topShade = withAlpha(warmTheme.surfaceMuted, 0.95);
  const midShade = withAlpha(warmTheme.surface, 0.95);
  const deepShade = withAlpha(warmTheme.surfaceStrong, 0.97);

  useEffect(() => {
    let cancelled = false;
    void loadMainMenuBackgroundEntries()
      .then((entries) => {
        if (cancelled) return;
        const selected = resolveMainMenuBackground(
          selectedMainMenuBackgroundId ?? DEFAULT_MAIN_MENU_BACKGROUND_ID,
          entries,
        );
        setTitleArtUrl(selected.imageUrl);
      })
      .catch(() => {
        if (cancelled) return;
        setTitleArtUrl(getDefaultMainMenuBackground().imageUrl);
      });
    return () => { cancelled = true; };
  }, [selectedMainMenuBackgroundId]);

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
        backgroundImage: `linear-gradient(180deg, ${topShade} 0%, ${midShade} 38%, ${withAlpha(warmTheme.surface, 0.98)} 65%, ${deepShade} 100%), url("${titleArtUrl}")`,
        backgroundSize: 'cover, cover',
        backgroundPosition: 'center, center',
      }}
    >
      {/* ── Sky-art atmospheric light — matches the main menu luminosity ─── */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: [
          `radial-gradient(ellipse 90% 55% at 50% 20%, ${withAlpha(warmTheme.accentSoft, 0.2)} 0%, ${withAlpha(warmTheme.accent, 0.1)} 45%, transparent 68%)`,
          `radial-gradient(ellipse 70% 38% at 50% 98%, ${withAlpha(warmTheme.accentDeep, 0.3)} 0%, transparent 60%)`,
        ].join(', '),
      }} />

      {/* ── Side vignettes — cards dissolve into the sky at screen edges ── */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: [
          `linear-gradient(90deg, ${withAlpha(warmTheme.surfaceStrong, 0.85)} 0%, ${withAlpha(warmTheme.surfaceStrong, 0)} 20%)`,
          `linear-gradient(-90deg, ${withAlpha(warmTheme.surfaceStrong, 0.85)} 0%, ${withAlpha(warmTheme.surfaceStrong, 0)} 20%)`,
        ].join(', '),
      }} />

      {/* ── Bottom vignette ───────────────────────────────────────────────── */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `linear-gradient(180deg, ${withAlpha(warmTheme.surfaceStrong, 0)} 52%, ${withAlpha(warmTheme.surfaceStrong, 0.9)} 100%)`,
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
        background: `radial-gradient(ellipse 58% 70% at 50% 50%, ${withAlpha(warmTheme.surfaceStrong, 0.75)} 0%, ${withAlpha(warmTheme.surfaceStrong, 0)} 65%)`,
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
          color: withAlpha(warmTheme.textMuted, 0.74),
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
          color: warmTheme.text,
          textShadow: [
            `0 0 56px ${withAlpha(warmTheme.accentSoft, 0.6)}`,
            `0 0 110px ${withAlpha(warmTheme.accent, 0.25)}`,
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
          background: `linear-gradient(90deg, transparent, ${withAlpha(warmTheme.accent, 0.72)}, transparent)`,
          boxShadow: `0 0 12px ${withAlpha(warmTheme.accentSoft, 0.32)}`,
        }} />

        {/* Tagline */}
        <div style={{
          fontFamily: uiTypography.body,
          fontSize: 'clamp(10px, 1.1vw, 13px)',
          letterSpacing: 5,
          color: withAlpha(warmTheme.textSoft, 0.82),
          textTransform: 'uppercase',
          userSelect: 'none',
        }}>
          Forge Gods. Outlast Eternity.
        </div>

        {/* Press Any Key prompt */}
        <div style={{
          marginTop: 60,
          padding: '13px 40px',
          border: `1px solid ${withAlpha(warmTheme.accent, 0.55)}`,
          borderRadius: 999,
          background: withAlpha(warmTheme.surfaceStrong, 0.62),
          backdropFilter: 'blur(4px)',
          fontFamily: uiTypography.body,
          fontSize: 'clamp(11px, 1.1vw, 14px)',
          letterSpacing: 4,
          color: warmTheme.text,
          textTransform: 'uppercase',
          userSelect: 'none',
          animation: reduced ? undefined : 'pulseGlowBlue 1.8s ease-in-out infinite',
          boxShadow: `0 0 28px ${withAlpha(warmTheme.accentSoft, 0.22)}`,
          pointerEvents: 'auto',
        }}>
          Press Any Key to Start
        </div>
      </div>
    </div>
  );
}
