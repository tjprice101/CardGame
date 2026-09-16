import { useState, useEffect, useRef } from 'react';
import { useStore, selectDivineLight } from '@/state/store';
import { formatNumber } from '@/utils/bignum';
const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 58,
    right: 'var(--angel-drawer-hand-offset, 278px)',
    textAlign: 'right',
    fontFamily: '"Georgia", serif',
    color: 'rgba(244,244,248,0.95)',
    background: 'rgba(5,5,7,0.72)',
    border: '1px solid rgba(244,244,248,0.12)',
    borderRadius: 999,
    padding: '4px 11px',
    boxShadow: '0 6px 18px rgba(0,0,0,0.42)',
    pointerEvents: 'none',
    zIndex: 20,
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  label: {
    fontSize: 8,
    color: 'rgba(244,244,248,0.45)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  chain: {
    fontSize: 14,
    color: 'rgba(244,244,248,0.65)',
    marginTop: 2,
  },
};

export default function ScoreDisplay() {
  const divineLight = useStore(selectDivineLight);
  const prevRef = useRef(divineLight);
  const [popping, setPopping] = useState(false);

  useEffect(() => {
    if (divineLight !== prevRef.current) {
      prevRef.current = divineLight;
      setPopping(false);
      requestAnimationFrame(() => setPopping(true));
      const t = setTimeout(() => setPopping(false), 280);
      return () => clearTimeout(t);
    }
  }, [divineLight]);

  return (
    <div className={popping ? 'anim-score-pop' : undefined} style={styles.container}>
      <div style={styles.label}>Divine Light</div>
      <div style={styles.score}>{formatNumber(divineLight)}</div>
    </div>
  );
}
