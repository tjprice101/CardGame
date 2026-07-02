import { useMemo } from 'react';
import { useStore, selectBoard, selectTurn, selectComputedStats, selectBossFight } from '@/state/store';
import { formatNumber } from '@/utils/bignum';
const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'absolute',
    top: 64,
    left: 16,
    background: 'rgba(5,5,7,0.72)',
    border: '1px solid rgba(244,244,248,0.1)',
    borderRadius: 12,
    padding: '12px 18px',
    color: 'rgba(244,244,248,0.88)',
    fontFamily: '"Georgia", serif',
    minWidth: 200,
    backdropFilter: 'blur(8px)',
    pointerEvents: 'none',
    zIndex: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
  },
  title: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: 'rgba(244,244,248,0.42)',
    marginBottom: 8,
  },
  stat: {
    fontSize: 13,
    color: 'rgba(244,244,248,0.78)',
    marginTop: 4,
  },
  synergy: {
    marginTop: 8,
    fontSize: 12,
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

  // Single pass over board slots instead of four separate .filter() calls.
  // Must be declared before any conditional return to satisfy Rules of Hooks.
  const { angelCount, totalSeraphimCount, activeSeraphimCount, cherubimCount } = useMemo(() => {
    let angelCount = 0, totalSeraphimCount = 0, activeSeraphimCount = 0;
    for (const slot of board.frontSlots) {
      if (slot?.type === 'Angel') { angelCount++; }
      else if (slot?.type === 'Seraphim') {
        totalSeraphimCount++;
        if (slot.isActive) activeSeraphimCount++;
      }
    }
    const cherubimCount = board.backSlots.filter(s => s !== null).length;
    return { angelCount, totalSeraphimCount, activeSeraphimCount, cherubimCount };
  }, [board.frontSlots, board.backSlots]);

  // During an active boss fight the boss panel covers this area — hide to
  // avoid visual clutter. Must come AFTER all hooks to satisfy Rules of Hooks.
  if (bossFight.mode === 'active') return null;

  const hasAnything = angelCount > 0 || totalSeraphimCount > 0;

  return (
    <div style={styles.panel}>
      <div style={styles.title}>Board</div>
      {hasAnything ? (
        <>
          {stats.activeSynergies > 0 && (
            <div style={styles.stat}>+{formatNumber(stats.oblivionPerCardBonus)} Oblivion/card</div>
          )}
          {(turn.seraphimBonusAmp ?? 0) > 0 && (
            <div style={styles.stat}>+{formatNumber(turn.seraphimBonusAmp!)} per Seraphim payout this turn</div>
          )}
          {turn.oblivionEarnedThisTurn > 0 && (
            <div style={styles.stat}>+{formatNumber(turn.oblivionEarnedThisTurn)} this turn</div>
          )}
          {angelCount > 0 && (
            <div style={styles.synergy}>
              ✦ {angelCount} Angel{angelCount > 1 ? 's' : ''} on board
            </div>
          )}
          {totalSeraphimCount > 0 && (
            <div style={{
              ...styles.synergy,
              color: activeSeraphimCount > 0 ? '#4f8a47' : 'rgba(244,244,248,0.38)',
            }}>
              {activeSeraphimCount}/{totalSeraphimCount} Seraphim{totalSeraphimCount > 1 ? 's' : ''} active
            </div>
          )}
          {cherubimCount > 0 && (
            <div style={{ ...styles.synergy, color: '#8f74a9' }}>
              {cherubimCount} Cherubim card{cherubimCount > 1 ? 's' : ''} active
            </div>
          )}
        </>
      ) : (
        <div style={styles.empty}>No board cards yet</div>
      )}
    </div>
  );
}
