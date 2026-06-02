// RadioControlBar — bottom-right persistent radio control strip.
//
// Only renders while the main-menu radio is active (radioActive prop).
// Shows current track title and pause / skip buttons.

import { useCallback } from 'react';
import type { RadioTrackInfo } from '@/audio/MainMenuRadio';
import { uiTypography, warmTheme } from '@/ui/theme';
import { useThemeVersion } from '@/ui/useThemeVersion';

function toRgbTriplet(color: string): [number, number, number] | null {
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    const raw = hex[1];
    const normalized = raw.length === 3
      ? raw.split('').map((c) => c + c).join('')
      : raw.slice(0, 6);
    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    return [r, g, b];
  }
  const rgb = color.trim().match(/^rgba?\(([^)]+)\)$/i);
  if (!rgb) return null;
  const parts = rgb[1].split(',').map((p) => Number.parseFloat(p.trim()));
  if (parts.length < 3 || parts.slice(0, 3).some((n) => Number.isNaN(n))) return null;
  return [parts[0], parts[1], parts[2]];
}

function withAlpha(color: string, alpha: number): string {
  const triplet = toRgbTriplet(color);
  if (!triplet) return color;
  const [r, g, b] = triplet;
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Math.max(0, Math.min(1, alpha))})`;
}

interface Props {
  radioActive: boolean;
  paused: boolean;
  currentTrack: RadioTrackInfo | null;
  onPausedChange: (p: boolean) => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  placement?: 'menu' | 'arena';
}

const BAR: React.CSSProperties = {
  position:       'fixed',
  bottom:         18,
  right:          22,
  zIndex:         9000,
  display:        'flex',
  alignItems:     'center',
  gap:            10,
  padding:        '7px 14px 7px 12px',
  borderRadius:   12,
  backdropFilter: 'blur(14px)',
  transition:     'opacity 0.35s ease, transform 0.35s ease',
  userSelect:     'none',
};

const BAR_HIDDEN: React.CSSProperties = {
  ...BAR,
  opacity:         0,
  pointerEvents:   'none',
  transform:       'translateY(12px)',
};

const BTN: React.CSSProperties = {
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  width:          30,
  height:         30,
  borderRadius:   7,
  cursor:         'pointer',
  fontSize:       14,
  lineHeight:     1,
  transition:     'background 0.18s, border-color 0.18s',
  flexShrink:     0,
};

function IconPause() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
      <rect x="2" y="1.5" width="3.5" height="10" rx="1" />
      <rect x="7.5" y="1.5" width="3.5" height="10" rx="1" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
      <path d="M3 2.2 11 6.5 3 10.8z" />
    </svg>
  );
}
function IconSkip() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
      <path d="M2 2.5 8.5 6.5 2 10.5z" />
      <rect x="9.5" y="2.5" width="2" height="8" rx="1" />
    </svg>
  );
}
function IconRadio() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <rect x="1" y="6" width="13" height="8" rx="2" />
      <circle cx="5.5" cy="10" r="1.5" />
      <path d="M9 9h3M9 11h2" />
      <path d="M3.5 6 7.5 2l4 4" />
    </svg>
  );
}

export default function RadioControlBar({ radioActive, paused, currentTrack, onPausedChange, onPause, onResume, onSkip, placement = 'menu' }: Props) {
  useThemeVersion();
  const G = {
    panelTop: withAlpha(warmTheme.surfaceStrong, 0.92),
    panelBottom: withAlpha(warmTheme.surfaceMuted, 0.9),
    border: warmTheme.border,
    borderStrong: warmTheme.borderStrong,
    accent: warmTheme.accent,
    accentSoft: warmTheme.accentSoft,
    text: warmTheme.text,
    hint: warmTheme.textFaint,
    btnBg: withAlpha(warmTheme.surfaceStrong, 0.92),
    btnHover: withAlpha(warmTheme.accent, 0.22),
    display: uiTypography.display,
    glow: warmTheme.glow,
  } as const;

  const handlePauseResume = useCallback(() => {
    if (paused) {
      onResume();
      onPausedChange(false);
    } else {
      onPause();
      onPausedChange(true);
    }
  }, [paused, onPausedChange, onPause, onResume]);

  const handleSkip = useCallback(() => {
    onSkip();
  }, [onSkip]);

  const barStyle: React.CSSProperties = {
    ...(radioActive ? BAR : BAR_HIDDEN),
    background: `linear-gradient(135deg, ${G.panelTop} 0%, ${G.panelBottom} 100%)`,
    border: `1px solid ${G.border}`,
    boxShadow: `${G.glow}, 0 4px 24px ${withAlpha(warmTheme.shadow, 0.75)}, inset 0 1px 0 ${withAlpha(G.accentSoft, 0.18)}`,
    ...(placement === 'arena'
      ? {
          right: 22,
          bottom: 18,
        }
      : null),
  };

  return (
    <div style={barStyle} aria-hidden={!radioActive}>
      <div style={{
        position: 'absolute',
        left: 10,
        right: 10,
        top: 0,
        height: 2,
        borderRadius: 999,
        background: `linear-gradient(90deg, transparent 0%, ${withAlpha(G.accent, 0.75)} 45%, ${withAlpha(G.accentSoft, 0.85)} 60%, transparent 100%)`,
        pointerEvents: 'none',
      }} />
      {/* Radio glyph */}
      <span style={{ color: G.accentSoft, opacity: 0.85, display: 'flex', alignItems: 'center' }}>
        <IconRadio />
      </span>

      {/* Track title */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: 200, gap: 1 }}>
        <span style={{
          fontFamily:   G.display,
          fontSize:     11,
          color:        G.text,
          overflow:     'hidden',
          whiteSpace:   'nowrap',
          textOverflow: 'ellipsis',
          letterSpacing: '0.03em',
        }}>
          {currentTrack?.title ?? '—'}
        </span>
        <span style={{
          fontFamily: G.display,
          fontSize: 8,
          color: G.hint,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          Press R to hide/show radio
        </span>
      </div>

      {/* Pause / Resume */}
      <button
        style={{ ...BTN, border: `1px solid ${G.borderStrong}`, background: G.btnBg, color: G.accentSoft }}
        title={paused ? 'Resume' : 'Pause'}
        onClick={handlePauseResume}
        onMouseEnter={e => (e.currentTarget.style.background = G.btnHover)}
        onMouseLeave={e => (e.currentTarget.style.background = G.btnBg)}
      >
        {paused ? <IconPlay /> : <IconPause />}
      </button>

      {/* Skip */}
      <button
        style={{ ...BTN, border: `1px solid ${G.borderStrong}`, background: G.btnBg, color: G.accentSoft }}
        title="Next track"
        onClick={handleSkip}
        onMouseEnter={e => (e.currentTarget.style.background = G.btnHover)}
        onMouseLeave={e => (e.currentTarget.style.background = G.btnBg)}
      >
        <IconSkip />
      </button>

    </div>
  );
}
