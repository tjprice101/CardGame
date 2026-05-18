import { useState, useEffect, useMemo, useRef } from 'react';
import { useStore, selectTurn } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 'clamp(330px, 42vh, 440px)',
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
    color: '#c060ff',
    opacity: 0.7,
    fontFamily: 'Georgia, serif',
    marginBottom: 4,
  },
  orb: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 38% 38%, #f0c0ff, #b04aff 55%, #5a007a)',
    boxShadow: '0 0 16px 4px rgba(176,74,255,0.6), 0 0 32px 8px rgba(176,74,255,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Georgia, serif',
    transition: 'box-shadow 0.3s',
    textShadow: '0 0 8px rgba(220,80,255,0.8)',
  },
  inactive: {
    background: 'radial-gradient(circle at 38% 38%, #2a1a33, #160a22)',
    boxShadow: '0 0 4px rgba(176,74,255,0.1)',
    color: '#554466',
    textShadow: 'none',
  },
};

export default function EmberDisplay() {
  const turn = useStore(selectTurn);
  const deckList = useStore(s => s.deck.deckList);

  const prevEmbersRef = useRef(turn.embers);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (turn.embers > prevEmbersRef.current) {
      setFlashing(false);
      requestAnimationFrame(() => setFlashing(true));
      const t = setTimeout(() => setFlashing(false), 450);
      return () => clearTimeout(t);
    }
    prevEmbersRef.current = turn.embers;
  }, [turn.embers]);

  useEffect(() => {
    prevEmbersRef.current = turn.embers;
  });

  // Memoize: only re-scan when deckList reference changes (deck edits), not on every card play
  const hasFireCards = useMemo(
    () => deckList.some(e => CardRegistry.get(e.definitionId)?.element === 'Fire'),
    [deckList],
  );

  if (turn.phase === 'idle' || !hasFireCards) return null;

  const active = turn.embers > 0;

  return (
    <div style={styles.container}>
      <div style={styles.label}>Embers</div>
      <div
        className={flashing && active ? 'anim-radiance-flash' : undefined}
        style={{ ...styles.orb, ...(active ? {} : styles.inactive) }}
      >
        {turn.embers}
      </div>
    </div>
  );
}
