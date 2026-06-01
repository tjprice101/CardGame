// RadioNowPlaying — top-right "Now Playing" toast for the main menu radio.
//
// Receives a `nowPlaying` event object (incremented epoch + track info)
// each time the radio advances to a new song. Animates in, holds, then
// slides back out. Respects the existing reduced-motion setting via
// the .radio-toast-enter / .radio-toast-exit CSS classes.

import { useEffect, useRef, useState } from 'react';
import type { RadioTrackInfo } from '@/audio/MainMenuRadio';
import { uiTypography, warmTheme } from '@/ui/theme';

export interface NowPlayingEvent {
  epoch: number;
  track: RadioTrackInfo;
}

interface Props {
  nowPlaying: NowPlayingEvent | null;
}

const HOLD_MS = 5200;
const EXIT_MS = 400;

export default function RadioNowPlaying({ nowPlaying }: Props) {
  const G = {
    iceBlue: warmTheme.accent,
    iceBlueSoft: warmTheme.accentSoft,
    text: warmTheme.text,
    textDim: warmTheme.textMuted,
    border: warmTheme.border,
    glow: warmTheme.glow,
    display: uiTypography.display,
    panelA: warmTheme.surfaceStrong,
    panelB: warmTheme.surfaceMuted,
  } as const;

  const [phase, setPhase] = useState<'hidden' | 'enter' | 'hold' | 'exit'>('hidden');
  const [displayTrack, setDisplayTrack] = useState<RadioTrackInfo | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!nowPlaying) return;

    // Cancel any in-flight timers from the previous song.
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

    setDisplayTrack(nowPlaying.track);
    setPhase('enter');

    holdTimerRef.current = setTimeout(() => {
      setPhase('exit');
      exitTimerRef.current = setTimeout(() => setPhase('hidden'), EXIT_MS);
    }, HOLD_MS);

    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [nowPlaying?.epoch]); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'hidden' || !displayTrack) return null;

  const animClass = phase === 'exit' ? 'radio-toast-exit' : 'radio-toast-enter';

  return (
    <div
      className={animClass}
      style={{
        position: 'fixed',
        top: 18,
        right: 20,
        zIndex: 600,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
    >
      <div style={{
        // Dark navy glass — matches MainMenuHub pill/vignette base
        background: `linear-gradient(135deg, ${G.panelA} 0%, ${G.panelB} 100%)`,
        border: `1px solid ${G.border}`,
        borderRadius: 10,
        boxShadow: `${G.glow}, 0 8px 36px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,255,255,0.10)`,
        overflow: 'hidden',
        minWidth: 234,
        maxWidth: 310,
        // Subtle frosted-glass tint, like the TileButton backdrop
        backdropFilter: 'blur(10px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(10px) saturate(1.2)',
      }}>
        {/* Ice-blue accent line at top */}
        <div style={{
          height: 2,
          background: `linear-gradient(90deg, transparent 0%, ${G.iceBlue} 35%, ${G.iceBlueSoft} 60%, transparent 100%)`,
          opacity: 0.65,
          animation: 'radioBarPulse 2.4s ease-in-out infinite',
        }} />

        <div style={{ padding: '10px 14px 11px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {/* Label row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {/* Spinning glyph in ice blue */}
            <span style={{
              fontSize: 10,
              color: G.iceBlue,
              display: 'inline-block',
              animation: 'radioGlyphSpin 3s linear infinite',
              lineHeight: 1,
              flexShrink: 0,
              filter: `drop-shadow(0 0 5px ${G.glow})`,
            }}>
              ◈
            </span>
            <span style={{
              fontSize: 8,
              letterSpacing: 3.2,
              textTransform: 'uppercase',
              color: G.textDim,
              fontFamily: G.display,
              lineHeight: 1,
            }}>
              Now Playing
            </span>
            {/* Right rule */}
            <div style={{
              flex: 1,
              height: 1,
              background: `linear-gradient(90deg, ${G.iceBlueSoft} 0%, transparent 100%)`,
              opacity: 0.38,
            }} />
          </div>

          {/* Track title */}
          <div style={{
            fontSize: 13,
            fontWeight: 300,
            letterSpacing: 0.7,
            color: G.text,
            fontFamily: G.display,
            lineHeight: 1.25,
            textShadow: `0 1px 10px rgba(100,165,240,0.25)`,
          }}>
            {displayTrack.title}
          </div>

          {/* Equalizer bars — ice blue */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2.5, height: 10 }}>
            {[0.9, 0.55, 1.0, 0.65, 0.82, 0.48, 0.72].map((h, i) => (
              <div
                key={i}
                style={{
                  width: 2.5,
                  height: `${h * 100}%`,
                  background: G.iceBlue,
                  borderRadius: 1,
                  opacity: 0.60,
                  animation: `radioBarPulse ${1.1 + i * 0.17}s ease-in-out infinite`,
                  animationDelay: `${i * 0.11}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
