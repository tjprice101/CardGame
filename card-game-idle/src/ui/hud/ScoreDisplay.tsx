import { useState, useEffect, useRef } from 'react';
import { useStore, selectOblivion, selectTurn } from '@/state/store';
import { formatNumber } from '@/utils/bignum';
import { warmTheme } from '@/ui/theme';

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 62,
    left: '50%',
    transform: 'translateX(-50%)',
    textAlign: 'center',
    fontFamily: '"Georgia", serif',
    color: warmTheme.accentDeep,
    background: warmTheme.surface,
    border: `1px solid ${warmTheme.border}`,
    borderRadius: 18,
    padding: '8px 18px 10px',
    boxShadow: warmTheme.shadow,
    pointerEvents: 'none',
  },
  score: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  label: {
    fontSize: 12,
    color: warmTheme.textMuted,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  chain: {
    fontSize: 14,
    color: warmTheme.textSoft,
    marginTop: 2,
  },
};

export default function ScoreDisplay() {
  const oblivion = useStore(selectOblivion);
  const turn = useStore(selectTurn);
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

  const showChain = turn.phase === 'playing' && turn.cardsPlayedThisTurn > 0;

  return (
    <div className={popping ? 'anim-score-pop' : undefined} style={styles.container}>
      <div style={styles.label}>Oblivion</div>
      <div style={styles.score}>{formatNumber(oblivion)}</div>
      {showChain && (
        <div style={styles.chain}>×{turn.chainMultiplier.toFixed(1)} chain</div>
      )}
    </div>
  );
}
