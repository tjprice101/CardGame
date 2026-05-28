// RadioControlBar — bottom-right persistent radio control strip.
//
// Only renders while the main-menu radio is active (radioActive prop).
// Shows current track title and pause / skip buttons.

import { useCallback } from 'react';
import type { RadioTrackInfo } from '@/audio/MainMenuRadio';

interface Props {
  radioActive: boolean;
  paused: boolean;
  currentTrack: RadioTrackInfo | null;
  onPausedChange: (p: boolean) => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
}

// Main menu navy / ice-blue palette.
const G = {
  bg:        'rgba(4,9,20,0.82)',
  bgHover:   'rgba(8,18,38,0.92)',
  border:    'rgba(120,185,248,0.28)',
  iceBlue:   '#a8c8f0',
  text:      '#e8f2fc',
  textDim:   'rgba(190,225,252,0.55)',
  btnBg:     'rgba(30,55,100,0.55)',
  btnHover:  'rgba(50,90,155,0.75)',
  display:   '"Cinzel", "Cormorant Garamond", Georgia, serif',
} as const;

const BAR: React.CSSProperties = {
  position:       'fixed',
  bottom:         18,
  right:          22,
  zIndex:         9000,
  display:        'flex',
  alignItems:     'center',
  gap:            10,
  padding:        '7px 14px 7px 12px',
  background:     G.bg,
  border:         `1px solid ${G.border}`,
  borderRadius:   12,
  backdropFilter: 'blur(14px)',
  boxShadow:      '0 4px 24px rgba(0,0,0,0.55), 0 0 0 1px rgba(120,185,248,0.10) inset',
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
  border:         `1px solid ${G.border}`,
  background:     G.btnBg,
  color:          G.iceBlue,
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

export default function RadioControlBar({ radioActive, paused, currentTrack, onPausedChange, onPause, onResume, onSkip }: Props) {
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

  return (
    <div style={radioActive ? BAR : BAR_HIDDEN} aria-hidden={!radioActive}>
      {/* Radio glyph */}
      <span style={{ color: G.iceBlue, opacity: 0.80, display: 'flex', alignItems: 'center' }}>
        <IconRadio />
      </span>

      {/* Track title */}
      <span style={{
        fontFamily:   G.display,
        fontSize:     11,
        color:        G.text,
        maxWidth:     180,
        overflow:     'hidden',
        whiteSpace:   'nowrap',
        textOverflow: 'ellipsis',
        letterSpacing: '0.03em',
      }}>
        {currentTrack?.title ?? '—'}
      </span>

      {/* Pause / Resume */}
      <button
        style={BTN}
        title={paused ? 'Resume' : 'Pause'}
        onClick={handlePauseResume}
        onMouseEnter={e => (e.currentTarget.style.background = G.btnHover)}
        onMouseLeave={e => (e.currentTarget.style.background = G.btnBg)}
      >
        {paused ? <IconPlay /> : <IconPause />}
      </button>

      {/* Skip */}
      <button
        style={BTN}
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
