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
  scar: {
    marginTop: 4,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#f0caca',
    fontFamily: 'Georgia, serif',
  },
  spiral: {
    marginTop: 2,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#f5d8b2',
    fontFamily: 'Georgia, serif',
  },
  convertButton: {
    marginTop: 6,
    border: '1px solid rgba(211, 70, 70, 0.6)',
    background: 'rgba(55, 18, 18, 0.92)',
    color: '#ffd9d9',
    fontFamily: 'Georgia, serif',
    fontSize: 10,
    letterSpacing: 0.5,
    padding: '4px 8px',
    borderRadius: 6,
    cursor: 'pointer',
  },
  convertButtonDisabled: {
    opacity: 0.45,
    cursor: 'default',
  },
};

export default function TrailDisplay() {
  const turn = useStore(selectTurn);
  const deckList = useStore(s => s.deck.deckList);
  const convertTrailToScar = useStore(s => s.convertTrailToScar);
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
  const briarSpiral = turn.secondaryCounters?.thorn ?? 0;

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
      <div style={styles.scar}>Scar {turn.thornScar ?? 0}</div>
      <div style={styles.spiral}>Briar Spiral {briarSpiral}</div>
      <button
        type="button"
        onClick={convertTrailToScar}
        disabled={turn.trail <= 0}
        style={{
          ...styles.convertButton,
          ...(turn.trail <= 0 ? styles.convertButtonDisabled : {}),
        }}
      >
        Convert 1 Trail -&gt; 1 Scar
      </button>
      {hovered && (
        <div style={styles.tooltip}>
          Build Trail by playing Thornbound cards, then convert Trail into Scar one point at a time.
          Base Thornbound cards check Scar thresholds for bonus effects, while Eternal Thornbound
          cards build and bloom Briar Spiral for extra Trail scaling.
        </div>
      )}
    </div>
  );
}
