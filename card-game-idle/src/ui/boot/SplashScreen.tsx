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
 * Opening splash screen. Brief title-card moment before the parallax title
 * scene. Holds for ~2.4s (or 0.6s when reduced motion is on), fades out, then
 * notifies the parent to advance. Players may click / press any key to skip.
 */
export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const settings = useStore(selectSettings);
  const selectedMainMenuBackgroundId = useStore((s) => s.progress.profile.mainMenuBackgroundId);
  const reduced = !!settings.reducedMotion;
  const [stage, setStage] = useState<'in' | 'hold' | 'out'>('in');
  const [splashArtUrl, setSplashArtUrl] = useState<string>(() => getDefaultMainMenuBackground().imageUrl);
  const topShade = withAlpha(warmTheme.surfaceMuted, 0.95);
  const midShade = withAlpha(warmTheme.surface, 0.95);
  const bottomShade = withAlpha(warmTheme.surfaceStrong, 0.96);

  useEffect(() => {
    let cancelled = false;
    void loadMainMenuBackgroundEntries()
      .then((entries) => {
        if (cancelled) return;
        const selected = resolveMainMenuBackground(
          selectedMainMenuBackgroundId ?? DEFAULT_MAIN_MENU_BACKGROUND_ID,
          entries,
        );
        setSplashArtUrl(selected.imageUrl);
      })
      .catch(() => {
        if (cancelled) return;
        setSplashArtUrl(getDefaultMainMenuBackground().imageUrl);
      });
    return () => { cancelled = true; };
  }, [selectedMainMenuBackgroundId]);

  useEffect(() => {
    const t1 = window.setTimeout(() => setStage('hold'), reduced ? 120 : 700);
    const t2 = window.setTimeout(() => setStage('out'), reduced ? 600 : 2400);
    const t3 = window.setTimeout(() => onDone(), reduced ? 1100 : 3100);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); window.clearTimeout(t3); };
  }, [onDone, reduced]);

  useEffect(() => {
    function skip() { onDone(); }
    window.addEventListener('keydown', skip);
    window.addEventListener('pointerdown', skip);
    return () => {
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
    };
  }, [onDone]);

  const opacity = stage === 'in' ? 0 : stage === 'hold' ? 1 : 0;

  return (
    <div
      aria-hidden={stage === 'out'}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 200,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        opacity,
        transition: reduced ? 'opacity 300ms ease' : 'opacity 700ms ease',
        pointerEvents: 'auto',
        cursor: 'pointer',
        backgroundImage: `linear-gradient(180deg, ${topShade} 0%, ${midShade} 48%, ${bottomShade} 100%), url("${splashArtUrl}")`,
        backgroundSize: 'cover, cover',
        backgroundPosition: 'center, center',
      }}
    >
      {/* Soft cloud-like haze — evokes the main menu's sky art */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: [
          `radial-gradient(ellipse 90% 60% at 50% 38%, ${withAlpha(warmTheme.accentSoft, 0.18)} 0%, ${withAlpha(warmTheme.accent, 0.08)} 45%, transparent 68%)`,
          `radial-gradient(ellipse 50% 30% at 50% 92%, ${withAlpha(warmTheme.accentDeep, 0.24)} 0%, transparent 60%)`,
        ].join(', '),
      }} />

      {/* Top and bottom chrome accent lines — steel blue */}
      <div aria-hidden style={{
        position: 'absolute', top: 0, left: '30%', right: '30%', height: 1,
        background: `linear-gradient(90deg, transparent, ${withAlpha(warmTheme.accent, 0.55)}, transparent)`,
        pointerEvents: 'none',
      }} />
      <div aria-hidden style={{
        position: 'absolute', bottom: 0, left: '30%', right: '30%', height: 1,
        background: `linear-gradient(90deg, transparent, ${withAlpha(warmTheme.accentSoft, 0.28)}, transparent)`,
        pointerEvents: 'none',
      }} />

      {/* Studio / publisher label */}
      <div style={{
        fontFamily: uiTypography.body,
        fontSize: 10,
        letterSpacing: 5,
        color: withAlpha(warmTheme.textMuted, 0.78),
        textTransform: 'uppercase',
        marginBottom: 36,
        userSelect: 'none',
      }}>
        Presents
      </div>

      {/* Game wordmark */}
      <div style={{
        fontFamily: uiTypography.display,
        fontSize: 'clamp(34px, 5vw, 68px)',
        letterSpacing: 10,
        color: warmTheme.text,
        textShadow: [
          `0 0 48px ${withAlpha(warmTheme.accentSoft, 0.55)}`,
          `0 0 96px ${withAlpha(warmTheme.accent, 0.25)}`,
          '0 4px 28px rgba(0,0,0,0.95)',
        ].join(', '),
        textTransform: 'uppercase',
        fontWeight: 400,
        lineHeight: 1,
        userSelect: 'none',
      }}>
        Pantheon
      </div>

      {/* Divider */}
      <div aria-hidden style={{
        marginTop: 20, marginBottom: 18,
        width: 180, height: 1,
        background: `linear-gradient(90deg, transparent, ${withAlpha(warmTheme.accent, 0.65)}, transparent)`,
        boxShadow: `0 0 8px ${withAlpha(warmTheme.accentSoft, 0.28)}`,
      }} />

      {/* Tagline */}
      <div style={{
        fontFamily: uiTypography.body,
        fontSize: 11,
        letterSpacing: 5,
        color: withAlpha(warmTheme.textSoft, 0.8),
        textTransform: 'uppercase',
        userSelect: 'none',
      }}>
        Forge Gods. Outlast Eternity.
      </div>
    </div>
  );
}
