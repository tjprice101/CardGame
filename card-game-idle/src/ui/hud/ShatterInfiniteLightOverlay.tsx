import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore, selectTurn, selectDivineLight } from '@/state/store';
import { formatNumber } from '@/utils/bignum';
import { uiTypography } from '@/ui/theme';

const AMBIENT_STAR_COUNT = 120;
const MAX_CONCURRENT_CLICK_STARS = 9;
const CLICK_STAR_SPAWN_MS = 260;
const CLICK_STAR_LIFE_MS = 1700;

interface ClickStar {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface AmbientStar {
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  hue: number;
  depth: number;
}

/**
 * Full-screen "Shatter the Infinite Light" cutscene: fades fully to black,
 * then opens a 10-second window to click fading red→blue stars ("Limitless Infinity"
 * stacks), then fades to white with a payout reveal. Purely presentational —
 * all phase timing/payout math lives in the store (`tickShatterInfiniteLight`).
 */
export default function ShatterInfiniteLightOverlay() {
  const turn = useStore(selectTurn);
  const divineLight = useStore(selectDivineLight);
  const shatter = turn.shatterInfiniteLight;

  const [clickStars, setClickStars] = useState<ClickStar[]>([]);
  const nextStarId = useRef(0);
  const [stackPulse, setStackPulse] = useState(false);
  const prevStacksRef = useRef(shatter?.stacks ?? 0);

  const phase = shatter?.phase ?? null;

  // Drive phase transitions on a lightweight interval; the store owns all timing math.
  useEffect(() => {
    if (!phase) return;
    const id = setInterval(() => {
      useStore.getState().tickShatterInfiniteLight(Date.now());
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  // Spawn glowing click-targets only during the active clicking window.
  useEffect(() => {
    if (phase !== 'active') return;
    const id = setInterval(() => {
      setClickStars(current => {
        if (current.length >= MAX_CONCURRENT_CLICK_STARS) return current;
        const id = nextStarId.current++;
        const star: ClickStar = {
          id,
          x: 6 + Math.random() * 88,
          y: 10 + Math.random() * 78,
          size: 26 + Math.random() * 22,
        };
        setTimeout(() => {
          setClickStars(cur => cur.filter(s => s.id !== id));
        }, CLICK_STAR_LIFE_MS);
        return [...current, star];
      });
    }, CLICK_STAR_SPAWN_MS);
    return () => clearInterval(id);
  }, [phase]);

  // Clear any leftover clickable stars once the window closes.
  useEffect(() => {
    if (phase !== 'active') setClickStars([]);
  }, [phase]);

  useEffect(() => {
    const stacks = shatter?.stacks ?? 0;
    if (stacks !== prevStacksRef.current) {
      prevStacksRef.current = stacks;
      setStackPulse(false);
      requestAnimationFrame(() => setStackPulse(true));
      const t = setTimeout(() => setStackPulse(false), 260);
      return () => clearTimeout(t);
    }
  }, [shatter?.stacks]);

  const ambientStars = useMemo<AmbientStar[]>(() => (
    Array.from({ length: AMBIENT_STAR_COUNT }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2.4,
      duration: 1.8 + Math.random() * 2.6,
      delay: -Math.random() * 4,
      hue: 185 + Math.random() * 105,
      depth: Math.floor(Math.random() * 3),
    }))
  ), []);

  if (!shatter) return null;

  const handleStarClick = (id: number) => {
    setClickStars(current => current.filter(s => s.id !== id));
    useStore.getState().registerShatterInfinityStarHit();
  };

  const secondsLeft = Math.max(0, (shatter.phaseEndsAt - Date.now()) / 1000);
  const backgroundColor = phase === 'result' ? '#f4f2ea' : '#000000';
  const showCounters = phase === 'active' || phase === 'result';
  const showStars = phase === 'active';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 950,
        backgroundColor,
        transition: 'background-color 900ms ease',
        pointerEvents: 'auto',
        overflow: 'hidden',
        userSelect: 'none',
      }}
      className={phase === 'priming' ? 'shatter-priming-overlay' : undefined}
    >
      {showStars && (
        <div className="shatter-starfield" aria-hidden="true">
          <div className="shatter-starfield-nebula" />
          {ambientStars.map((star, index) => (
            <div
              key={index}
              className={`shatter-ambient-star shatter-ambient-star-depth-${star.depth}`}
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
                color: `hsl(${star.hue} 100% 84%)`,
                animationDuration: `${star.duration}s`,
                animationDelay: `${star.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      {showStars && clickStars.map(star => (
        <div
          key={star.id}
          className="shatter-click-star"
          onClick={() => handleStarClick(star.id)}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            fontSize: star.size,
            animationDuration: `${CLICK_STAR_LIFE_MS}ms`,
          }}
        >
          <span className="shatter-click-star-rays" aria-hidden="true" />
          <span className="shatter-click-star-core">✦</span>
        </div>
      ))}

      {showCounters && (
        <div
          style={{
            position: 'absolute',
            top: 26,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            color: phase === 'result' ? '#1a1408' : '#fff8e8',
            textShadow: phase === 'result' ? 'none' : '0 0 18px rgba(255,255,255,0.35)',
          }}
        >
          <div style={{ fontFamily: uiTypography.display, fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.75 }}>
            Divine Light
          </div>
          <div style={{ fontFamily: uiTypography.display, fontSize: 34, fontWeight: 700, letterSpacing: 1 }}>
            {formatNumber(divineLight)}
          </div>
          <div
            className={stackPulse ? 'shatter-counter-pulse' : undefined}
            style={{ fontFamily: uiTypography.display, fontSize: 16, letterSpacing: 2, color: '#ff8f6b', marginTop: 6 }}
          >
            ✦ Limitless Infinity ×{shatter.stacks}
          </div>
          {phase === 'active' && (
            <div style={{ fontFamily: uiTypography.display, fontSize: 20, marginTop: 10, color: '#ffb3a0' }}>
              {secondsLeft.toFixed(1)}s
            </div>
          )}
        </div>
      )}

      {phase === 'result' && (
        <div
          className="shatter-title-text"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            fontFamily: uiTypography.display,
            fontSize: 76,
            fontWeight: 900,
            color: '#0c0a06',
            letterSpacing: 4,
            textShadow: '0 0 22px rgba(214,162,94,0.55), 0 0 46px rgba(214,162,94,0.3)',
            whiteSpace: 'nowrap',
          }}
        >
          Shattered!!
        </div>
      )}

      {phase === 'result' && shatter.payout > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% + 64px)',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: uiTypography.display,
            fontSize: 20,
            color: '#4a3418',
            letterSpacing: 1.5,
          }}
        >
          +{formatNumber(shatter.payout)} Divine Light
        </div>
      )}
    </div>
  );
}
