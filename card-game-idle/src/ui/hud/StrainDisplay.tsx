import { useState, useEffect, useRef } from 'react';
import { useStore, selectTurn } from '@/state/store';

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 'clamp(470px, 59vh, 600px)',
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
    color: '#f0a018',
    opacity: 0.75,
    fontFamily: 'Georgia, serif',
    marginBottom: 4,
  },
  orb: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 38% 38%, #fff7e6, #f0a018 55%, #5c3200)',
    boxShadow: '0 0 16px 4px rgba(240,160,24,0.55), 0 0 32px 8px rgba(240,160,24,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2b1800',
    fontFamily: 'Georgia, serif',
    textShadow: '0 0 6px rgba(255,190,80,0.42)',
  },
  inactive: {
    background: 'radial-gradient(circle at 38% 38%, #2d261c, #1b150f)',
    boxShadow: '0 0 4px rgba(240,160,24,0.1)',
    color: '#6b5940',
    textShadow: 'none',
  },
  dangerRing: {
    boxShadow: '0 0 20px 5px rgba(255,70,45,0.62), 0 0 44px 9px rgba(255,150,50,0.35)',
  },
  tooltip: {
    position: 'absolute',
    left: 66,
    top: 26,
    width: 230,
    background: 'rgba(20, 16, 10, 0.95)',
    border: '1px solid rgba(240, 160, 24, 0.5)',
    borderRadius: 8,
    color: '#f6e9ce',
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

export default function StrainDisplay() {
  const turn = useStore(selectTurn);
  const [hovered, setHovered] = useState(false);
  const prevStrainRef = useRef(turn.strain);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (turn.strain > prevStrainRef.current) {
      setFlashing(false);
      requestAnimationFrame(() => setFlashing(true));
      const timeout = setTimeout(() => setFlashing(false), 450);
      return () => clearTimeout(timeout);
    }
    prevStrainRef.current = turn.strain;
  }, [turn.strain]);

  useEffect(() => {
    prevStrainRef.current = turn.strain;
  });

  const hasMechanicalCards = false; // Mechanical set removed

  if (turn.phase === 'idle' || !hasMechanicalCards) return null;

  const active = turn.strain > 0;
  const highStrain = turn.strain >= 4;

  return (
    <div
      style={styles.container}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.label}>Strain</div>
      <div
        className={flashing && active ? 'anim-radiance-flash' : undefined}
        style={{
          ...styles.orb,
          ...(active ? {} : styles.inactive),
          ...(highStrain ? styles.dangerRing : {}),
        }}
      >
        {turn.strain}
      </div>
      {hovered && (
        <div style={styles.tooltip}>
          Mechanical fuel resource. Build Strain before Chimes, then cash primed attack windows for burst damage.
          Keep Strain controlled with venting cards so Chime turns stay efficient.
        </div>
      )}
    </div>
  );
}
