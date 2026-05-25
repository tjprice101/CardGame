import { useEffect, useState } from 'react';
import { warmTheme, uiTypography } from '@/ui/theme';
import { useStore, selectSettings } from '@/state/store';

/**
 * Opening splash screen. Brief title-card moment before the parallax title
 * scene. Holds for ~2.4s (or 0.6s when reduced motion is on), fades out, then
 * notifies the parent to advance. Players may click / press any key to skip.
 */
export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const settings = useStore(selectSettings);
  const reduced = !!settings.reducedMotion;
  const [stage, setStage] = useState<'in' | 'hold' | 'out'>('in');

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
        background: 'radial-gradient(circle at 50% 40%, #2a1b12 0%, #0a0604 70%, #000 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        opacity,
        transition: reduced ? 'opacity 300ms ease' : 'opacity 700ms ease',
        pointerEvents: 'auto',
        cursor: 'pointer',
      }}
    >
      {/* Soft halo */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 45%, rgba(214,162,94,0.18) 0%, rgba(214,162,94,0) 55%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          fontFamily: uiTypography.display,
          fontSize: 'clamp(28px, 4vw, 56px)',
          letterSpacing: 6,
          color: warmTheme.accentSoft,
          textShadow: '0 4px 24px rgba(214,162,94,0.45)',
          textTransform: 'uppercase',
          fontWeight: 400,
        }}
      >
        Pantheon
      </div>
      <div
        style={{
          marginTop: 18,
          fontFamily: uiTypography.body,
          fontSize: 12,
          letterSpacing: 4,
          color: 'rgba(245,232,214,0.55)',
          textTransform: 'uppercase',
        }}
      >
        A Card Idle of Angels &amp; Embers
      </div>
    </div>
  );
}
