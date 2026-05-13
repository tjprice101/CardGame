import { useState, useEffect, useRef } from 'react';
import { useStore, selectRadiance, selectTurn } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 'clamp(260px, 33vh, 360px)',
    left: 16,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  label: {
    fontSize: 9,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: '#FFD700',
    opacity: 0.6,
    fontFamily: 'Georgia, serif',
    marginBottom: 4,
  },
  orb: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 38% 38%, #fff9c4, #FFD700 55%, #b8860b)',
    boxShadow: '0 0 16px 4px rgba(255,215,0,0.55), 0 0 32px 8px rgba(255,215,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3a2a00',
    fontFamily: 'Georgia, serif',
    transition: 'box-shadow 0.3s',
  },
  inactive: {
    background: 'radial-gradient(circle at 38% 38%, #444, #222)',
    boxShadow: '0 0 4px rgba(255,215,0,0.1)',
    color: '#666',
  },
};

export default function RadianceDisplay() {
  const radiance = useStore(selectRadiance);
  const turn = useStore(selectTurn);
  const deckList = useStore(s => s.deck.deckList);

  const prevRadianceRef = useRef(radiance);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (radiance > prevRadianceRef.current) {
      setFlashing(false);
      requestAnimationFrame(() => setFlashing(true));
      const t = setTimeout(() => setFlashing(false), 450);
      return () => clearTimeout(t);
    }
    prevRadianceRef.current = radiance;
  }, [radiance]);

  useEffect(() => {
    prevRadianceRef.current = radiance;
  });

  const hasLightCards = deckList.some(e => {
    const def = CardRegistry.get(e.definitionId);
    return def?.element === 'Light';
  });

  if (turn.phase === 'idle' || !hasLightCards) return null;

  const active = radiance > 0;

  return (
    <div style={styles.container}>
      <div style={styles.label}>Radiance</div>
      <div
        className={flashing && active ? 'anim-radiance-flash' : undefined}
        style={{ ...styles.orb, ...(active ? {} : styles.inactive) }}
      >
        {radiance}
      </div>
    </div>
  );
}
