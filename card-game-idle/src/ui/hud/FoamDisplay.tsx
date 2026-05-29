import { useEffect, useRef, useState } from 'react';
import { CardRegistry } from '@/cards/CardRegistry';
import { selectTurn, useStore } from '@/state/store';

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 'clamp(326px, 42vh, 430px)',
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
    color: '#76d8ea',
    opacity: 0.78,
    fontFamily: 'Georgia, serif',
    marginBottom: 4,
  },
  orb: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 35%, #f0ffff, #66d9f0 54%, #0a3851)',
    boxShadow: '0 0 16px 4px rgba(102,217,240,0.45), 0 0 30px 6px rgba(56,140,180,0.16)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#effcff',
    fontFamily: 'Georgia, serif',
    textShadow: '0 0 8px rgba(70,170,220,0.62)',
  },
  inactive: {
    background: 'radial-gradient(circle at 38% 38%, #1b262b, #10181b)',
    boxShadow: '0 0 4px rgba(102,217,240,0.08)',
    color: '#688089',
    textShadow: 'none',
  },
  undertow: {
    marginTop: 4,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#d4f4fb',
    fontFamily: 'Georgia, serif',
  },
  button: {
    marginTop: 6,
    border: '1px solid rgba(102, 217, 240, 0.52)',
    background: 'rgba(11, 42, 56, 0.92)',
    color: '#ddf8fd',
    fontFamily: 'Georgia, serif',
    fontSize: 10,
    letterSpacing: 0.4,
    padding: '4px 8px',
    borderRadius: 6,
    cursor: 'pointer',
  },
  buttonDisabled: {
    opacity: 0.45,
    cursor: 'default',
  },
  tooltip: {
    position: 'absolute',
    left: 66,
    top: 26,
    width: 220,
    background: 'rgba(8, 20, 26, 0.95)',
    border: '1px solid rgba(102, 217, 240, 0.35)',
    borderRadius: 8,
    color: '#d6f7fd',
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

export default function FoamDisplay() {
  const turn = useStore(selectTurn);
  const deckList = useStore(s => s.deck.deckList);
  const consumeFoamToDraw = useStore(s => s.consumeFoamToDraw);
  const [hovered, setHovered] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const prevFoamRef = useRef(turn.eternalSeasFoam ?? 0);

  useEffect(() => {
    const foam = turn.eternalSeasFoam ?? 0;
    if (foam > prevFoamRef.current) {
      setFlashing(false);
      requestAnimationFrame(() => setFlashing(true));
      const timeout = setTimeout(() => setFlashing(false), 450);
      return () => clearTimeout(timeout);
    }
    prevFoamRef.current = foam;
  }, [turn.eternalSeasFoam]);

  useEffect(() => {
    prevFoamRef.current = turn.eternalSeasFoam ?? 0;
  });

  const hasEternalSeasCards = deckList.some(entry => {
    const def = CardRegistry.get(entry.definitionId);
    return def?.element === 'EternalSeas';
  });

  if (turn.phase === 'idle' || !hasEternalSeasCards) return null;

  const foam = turn.eternalSeasFoam ?? 0;
  const undertow = turn.eternalSeasUndertow ?? 0;
  const canSpend = turn.phase === 'playing' && !turn.pendingEffect && foam >= 5;

  return (
    <div
      style={styles.container}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.label}>Foam</div>
      <div
        className={flashing && foam > 0 ? 'anim-radiance-flash' : undefined}
        style={{ ...styles.orb, ...(foam > 0 ? {} : styles.inactive) }}
      >
        {foam}
      </div>
      <div style={styles.undertow}>Undertow {undertow}</div>
      <button
        type="button"
        onClick={consumeFoamToDraw}
        disabled={!canSpend}
        style={{
          ...styles.button,
          ...(!canSpend ? styles.buttonDisabled : {}),
        }}
      >
        Spend 5 Foam -&gt; Draw 1
      </button>
      {hovered && (
        <div style={styles.tooltip}>
          Undertow is the main same-turn Eternal Seas resource. Foam is the light support layer:
          stock it during your turn, then click here to spend 5 Foam and draw 1 card while the turn is live.
        </div>
      )}
    </div>
  );
}