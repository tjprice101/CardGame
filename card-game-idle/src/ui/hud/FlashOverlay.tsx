import { useEffect, useRef } from 'react';

/**
 * Full-screen radial flash overlay driven by `hud-flash` CustomEvents.
 *
 * Uses the Web Animations API directly instead of CSS class toggling.
 * This guarantees the animation restarts cleanly on every event — even rapid
 * consecutive ones — with no force-reflow hacks.
 *
 * The envelope is:  0% opacity → sharp peak at ~7% → slow ease-out tail to 0%.
 * This produces a "photo flash" feel: instantaneous bright pulse, then a long
 * lingering glow that fades naturally.
 *
 * Respects `html.reduced-motion` by halving duration and peak opacity.
 */

interface FlashDetail {
  r: number;       // 0–255
  g: number;       // 0–255
  b: number;       // 0–255
  alpha: number;   // peak radial-gradient center alpha (0–1)
  durationMs: number;
}

export default function FlashOverlay() {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onFlash = (e: Event) => {
      const { r, g, b, alpha, durationMs } = (e as CustomEvent<FlashDetail>).detail;
      const el = divRef.current;
      if (!el) return;

      const reducedMotion = document.documentElement.classList.contains('reduced-motion')
        || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const peakAlpha = reducedMotion ? alpha * 0.5 : alpha;
      const dur       = reducedMotion ? Math.min(durationMs * 0.5, 120) : durationMs;

      // Update the radial gradient to the new event color
      el.style.background = [
        `radial-gradient(`,
        `  ellipse 110% 75% at 50% 44%,`,
        `  rgba(${r},${g},${b},${peakAlpha}) 0%,`,
        `  rgba(${r},${g},${b},${(peakAlpha * 0.50).toFixed(3)}) 28%,`,
        `  rgba(${r},${g},${b},${(peakAlpha * 0.18).toFixed(3)}) 58%,`,
        `  rgba(${r},${g},${b},0) 80%`,
        `)`,
      ].join('');

      // Cancel any in-progress flash, then launch a fresh one.
      // Starting from opacity 0 prevents a seam when rapid events chain.
      el.getAnimations().forEach(a => a.cancel());
      el.animate(
        [
          { opacity: '0',                     offset: 0    },   // start dark
          { opacity: '1',                     offset: 0.07 },   // sharp peak  (~7%)
          { opacity: String(peakAlpha * 0.6), offset: 0.3  },   // mid-glow    (30%)
          { opacity: '0',                                   },   // fade to gone
        ],
        { duration: dur, easing: 'ease-out', fill: 'forwards' },
      );
    };

    window.addEventListener('hud-flash', onFlash);
    return () => {
      window.removeEventListener('hud-flash', onFlash);
      divRef.current?.getAnimations().forEach(a => a.cancel());
    };
  }, []);

  return (
    <div
      ref={divRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 22,
        opacity: 0,  // baseline: invisible until an animation runs
      }}
    />
  );
}
