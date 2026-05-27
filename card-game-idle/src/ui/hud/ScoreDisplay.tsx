import { useState, useEffect, useRef } from 'react';
import { useStore, selectOblivion } from '@/state/store';
import { formatNumber } from '@/utils/bignum';
const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 44,
    left: '50%',
    transform: 'translateX(-50%)',
    textAlign: 'center',
    fontFamily: '"Georgia", serif',
    color: 'rgba(244,244,248,0.95)',
    background: 'rgba(5,5,7,0.72)',
    border: '1px solid rgba(244,244,248,0.12)',
    borderRadius: 18,
    padding: '8px 18px 10px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
    pointerEvents: 'none',
    zIndex: 20,
  },
  score: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  label: {
    fontSize: 12,
    color: 'rgba(244,244,248,0.45)',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  chain: {
    fontSize: 14,
    color: 'rgba(244,244,248,0.65)',
    marginTop: 2,
  },
};

export default function ScoreDisplay() {
  const oblivion = useStore(selectOblivion);
  const prevRef = useRef(oblivion);
  const [popping, setPopping] = useState(false);

  useEffect(() => {
    if (oblivion !== prevRef.current) {
      prevRef.current = oblivion;
      setPopping(false);
      requestAnimationFrame(() => setPopping(true));
      const t = setTimeout(() => setPopping(false), 280);
      return () => clearTimeout(t);
    }
  }, [oblivion]);

  return (
    <div className={popping ? 'anim-score-pop' : undefined} style={styles.container}>
      <div style={styles.label}>Oblivion</div>
      <div style={styles.score}>{formatNumber(oblivion)}</div>
    </div>
  );
}
