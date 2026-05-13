import { useState, useEffect, useRef } from 'react';
import { useStore, selectTurn } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 'clamp(400px, 50vh, 520px)',
    left: 16,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    pointerEvents: 'auto',
  },
  label: {
    fontSize: 9,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: '#e34646',
    opacity: 0.72,
    fontFamily: 'Georgia, serif',
    marginBottom: 4,
  },
  orb: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 38% 38%, #fff2f2, #d54646 55%, #440808)',
    boxShadow: '0 0 16px 4px rgba(211,70,70,0.55), 0 0 32px 8px rgba(211,70,70,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff5f5',
    fontFamily: 'Georgia, serif',
    textShadow: '0 0 8px rgba(180,40,40,0.72)',
  },
  inactive: {
    background: 'radial-gradient(circle at 38% 38%, #332020, #1f1212)',
    boxShadow: '0 0 4px rgba(211,70,70,0.1)',
    color: '#725050',
    textShadow: 'none',
  },
  tooltip: {
    position: 'absolute',
    left: 66,
    top: 26,
    width: 220,
    background: 'rgba(22, 14, 14, 0.94)',
    border: '1px solid rgba(211, 70, 70, 0.45)',
    borderRadius: 8,
    color: '#f4dede',
    fontSize: 10,
    lineHeight: 1.45,
    fontFamily: 'Georgia, serif',
    padding: '8px 10px',
    letterSpacing: 0.2,
    pointerEvents: 'none',
    boxShadow: '0 8px 18px rgba(0,0,0,0.35)',
    zIndex: 20,
  },
};

export default function TrailDisplay() {
  const turn = useStore(selectTurn);
  const deckList = useStore(s => s.deck.deckList);
  const [hovered, setHovered] = useState(false);
  const prevTrailRef = useRef(turn.trail);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (turn.trail > prevTrailRef.current) {
      setFlashing(false);
      requestAnimationFrame(() => setFlashing(true));
      const timeout = setTimeout(() => setFlashing(false), 450);
      return () => clearTimeout(timeout);
    }
    prevTrailRef.current = turn.trail;
  }, [turn.trail]);

  useEffect(() => {
    prevTrailRef.current = turn.trail;
  });

  const hasThornboundCards = deckList.some(entry => {
    const def = CardRegistry.get(entry.definitionId);
    return def?.element === 'Thornbound';
  });

  if (turn.phase === 'idle' || !hasThornboundCards) return null;

  const active = turn.trail > 0;

  return (
    <div
      style={styles.container}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.label}>Trail</div>
      <div
        className={flashing && active ? 'anim-radiance-flash' : undefined}
        style={{ ...styles.orb, ...(active ? {} : styles.inactive) }}
      >
        {turn.trail}
      </div>
      {hovered && (
        <div style={styles.tooltip}>
          Thornbound resource. Many Thornbound cards gain, spend, or check Trail.
          Build Trail through risky lines, then cash it in for heavy payoff turns.
        </div>
      )}
    </div>
  );
}
