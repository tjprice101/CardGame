import { useEffect, useState } from 'react';
import { uiTypography } from '@/ui/theme';
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
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        opacity,
        transition: reduced ? 'opacity 300ms ease' : 'opacity 700ms ease',
        pointerEvents: 'auto',
        cursor: 'pointer',
        // Deep sky-blue — dark variant of the main menu art palette
        background: 'linear-gradient(180deg, #071426 0%, #0d2040 48%, #071020 100%)',
      }}
    >
      {/* Soft cloud-like haze — evokes the main menu's sky art */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: [
          'radial-gradient(ellipse 90% 60% at 50% 38%, rgba(140,195,240,0.13) 0%, rgba(80,150,220,0.06) 45%, transparent 68%)',
          'radial-gradient(ellipse 50% 30% at 50% 92%, rgba(20,60,120,0.20) 0%, transparent 60%)',
        ].join(', '),
      }} />

      {/* Top and bottom chrome accent lines — steel blue */}
      <div aria-hidden style={{
        position: 'absolute', top: 0, left: '30%', right: '30%', height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(90,170,220,0.55), transparent)',
        pointerEvents: 'none',
      }} />
      <div aria-hidden style={{
        position: 'absolute', bottom: 0, left: '30%', right: '30%', height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(90,170,220,0.28), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Studio / publisher label */}
      <div style={{
        fontFamily: uiTypography.body,
        fontSize: 10,
        letterSpacing: 5,
        color: 'rgba(160,205,240,0.50)',
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
        color: '#eef3fa',
        textShadow: [
          '0 0 48px rgba(100,180,240,0.55)',
          '0 0 96px rgba(60,130,210,0.25)',
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
        background: 'linear-gradient(90deg, transparent, rgba(90,170,220,0.65), transparent)',
        boxShadow: '0 0 8px rgba(90,170,220,0.28)',
      }} />

      {/* Tagline */}
      <div style={{
        fontFamily: uiTypography.body,
        fontSize: 11,
        letterSpacing: 5,
        color: 'rgba(210,228,248,0.65)',
        textTransform: 'uppercase',
        userSelect: 'none',
      }}>
        Forge Gods. Outlast Eternity.
      </div>
    </div>
  );
}
