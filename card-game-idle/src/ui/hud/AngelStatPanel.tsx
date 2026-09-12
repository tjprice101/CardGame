import { useMemo } from 'react';
import { useStore, selectBoard, selectTurn, selectComputedStats, selectBossFight, selectGardenDungeon } from '@/state/store';
import { formatNumber } from '@/utils/bignum';
const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'absolute',
    top: 60,
    left: 14,
    background: 'rgba(5,5,7,0.72)',
    border: '1px solid rgba(244,244,248,0.1)',
    borderRadius: 10,
    padding: '8px 10px',
    color: 'rgba(244,244,248,0.88)',
    fontFamily: '"Georgia", serif',
    minWidth: 136,
    backdropFilter: 'blur(8px)',
    pointerEvents: 'none',
    zIndex: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
  },
  title: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(244,244,248,0.42)',
    marginBottom: 5,
  },
  stat: {
    fontSize: 11,
    color: 'rgba(244,244,248,0.78)',
    marginTop: 4,
  },
  synergy: {
    marginTop: 5,
    fontSize: 10,
    color: 'rgba(200,220,255,0.88)',
  },
  empty: {
    fontSize: 12,
    color: 'rgba(244,244,248,0.3)',
    fontStyle: 'italic',
  },
};

export default function AngelStatPanel() {
  const board = useStore(selectBoard);
  const turn = useStore(selectTurn);
  const stats = useStore(selectComputedStats);
  const bossFight = useStore(selectBossFight);
  const gardenDungeon = useStore(selectGardenDungeon);

  // Single pass over board slots instead of separate .filter() calls.
  // Must be declared before any conditional return to satisfy Rules of Hooks.
  const { asaCount, mainDeckCount, ainCount, sophCount } = useMemo(() => {
    let asaCount = 0, ainCount = 0, sophCount = 0;
    for (const slot of board.frontSlots) {
      if (slot) asaCount++;
    }
    for (const slot of board.backSlots) {
      if (!slot) continue;
      if (slot.side === 'ain') ainCount++;
      else sophCount++;
    }
    const mainDeckCount = ainCount + sophCount;
    return { asaCount, mainDeckCount, ainCount, sophCount };
  }, [board.frontSlots, board.backSlots]);

  // During active boss / expedition runs the top status panels cover this area — hide to avoid overlap.
  if (bossFight.mode === 'active' || gardenDungeon.phase === 'active') return null;

  const hasAnything = asaCount > 0 || mainDeckCount > 0;

  return (
    <div style={styles.panel}>
      <div style={styles.title}>Board</div>
      {hasAnything ? (
        <>
          {turn.limitlessLightStacks > 0 && (
            <div style={styles.stat}>Limitless Light Stacks {formatNumber(turn.limitlessLightStacks)}</div>
          )}
          {turn.oblivionEarnedThisTurn > 0 && (
            <div style={styles.stat}>+{formatNumber(turn.oblivionEarnedThisTurn)} this turn</div>
          )}
          {asaCount > 0 && (
            <div style={styles.synergy}>
              ✦ {asaCount} Ain Soph Aur
            </div>
          )}
          {mainDeckCount > 0 && (
            <div style={{
              ...styles.synergy,
              color: ainCount > 0 ? '#4f8a47' : 'rgba(244,244,248,0.38)',
            }}>
              {ainCount} Ain · {sophCount} Soph
            </div>
          )}
          {stats.globalOblivionMult > 0 && (
            <div style={{ ...styles.synergy, color: '#8f74a9' }}>
              Collection Power ×{(1 + stats.globalOblivionMult).toFixed(2)}
            </div>
          )}
        </>
      ) : (
        <div style={styles.empty}>No board cards yet</div>
      )}
    </div>
  );
}
