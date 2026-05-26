import { useEffect, useState } from 'react';
import { warmTheme, uiTypography } from '@/ui/theme';
import { useStore, selectSettings } from '@/state/store';

/**
 * Parallax title screen. Three drifting layers of card-art silhouettes behind
 * the game logotype and a pulsing "Press Any Key to Start" prompt. Any key,
 * click, or tap advances to the main menu.
 */
const ASSET_BASE = import.meta.env.BASE_URL;
const PARALLAX_LAYERS: Array<{ src: string; opacity: number; scale: number; drift: string; top: string; left: string }> = [
  { src: `${ASSET_BASE}assets/card-backgrounds/heavenly-light/Aurelion%20Thorncrowned.png`, opacity: 0.32, scale: 1.15, drift: 'parallaxDriftA 28s ease-in-out infinite', top: '6%', left: '-4%' },
  { src: `${ASSET_BASE}assets/card-backgrounds/heavenly-light/Solarius%20Emberthorn%20Ascendant.png`, opacity: 0.28, scale: 1.05, drift: 'parallaxDriftB 36s ease-in-out infinite', top: '12%', left: '60%' },
  { src: `${ASSET_BASE}assets/card-backgrounds/heavenly-light/Halo%20Legion%20Prime.png`, opacity: 0.22, scale: 0.95, drift: 'parallaxDriftC 44s ease-in-out infinite', top: '52%', left: '30%' },
];

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
        background: 'radial-gradient(circle at 50% 32%, #3a2419 0%, #160d09 65%, #050302 100%)',
        overflow: 'hidden',
        opacity: sceneOpacity,
        transition: reduced ? 'opacity 200ms ease' : 'opacity 650ms ease',
        cursor: 'pointer',
      }}
    >
      {/* Parallax art layers */}
      {!reduced && PARALLAX_LAYERS.map((layer, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: layer.top,
            left: layer.left,
            width: 'clamp(280px, 32vw, 520px)',
            height: 'clamp(380px, 44vw, 720px)',
            backgroundImage: `url(${layer.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: layer.opacity,
            filter: 'blur(2px) saturate(0.85)',
            transform: `scale(${layer.scale})`,
            animation: layer.drift,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
            willChange: 'transform',
          }}
        />
      ))}

      {/* Vignette */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.7) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Foreground content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          textAlign: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            fontFamily: uiTypography.display,
            fontSize: 'clamp(40px, 7vw, 96px)',
            letterSpacing: 8,
            color: '#f5e8d6',
            textShadow: '0 6px 32px rgba(214,162,94,0.55), 0 0 4px rgba(255,255,255,0.25)',
            textTransform: 'uppercase',
            fontWeight: 400,
            lineHeight: 1.05,
          }}
        >
          Pantheon
        </div>
        <div
          style={{
            fontFamily: uiTypography.body,
            fontSize: 'clamp(11px, 1.1vw, 14px)',
            letterSpacing: 5,
            color: warmTheme.accentSoft,
            textTransform: 'uppercase',
            opacity: 0.85,
          }}
        >
          Forge Gods. Outlast Eternity.
        </div>

        <div
          style={{
            marginTop: 64,
            padding: '14px 36px',
            border: `1px solid ${warmTheme.accentSoft}`,
            borderRadius: 999,
            background: 'rgba(20, 14, 10, 0.55)',
            backdropFilter: 'blur(2px)',
            fontFamily: uiTypography.body,
            fontSize: 'clamp(12px, 1.2vw, 15px)',
            letterSpacing: 4,
            color: '#f8e9cc',
            textTransform: 'uppercase',
            animation: reduced ? undefined : 'pulseGlow 1.8s ease-in-out infinite',
            boxShadow: '0 0 28px rgba(214,162,94,0.35)',
          }}
        >
          Press Any Key to Start
        </div>
      </div>
    </div>
  );
}
