import { useMemo } from 'react';
import { useStore, selectBoard, selectTurn, selectComputedStats } from '@/state/store';
import { formatNumber } from '@/utils/bignum';
import { warmTheme } from '@/ui/theme';

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'absolute',
    top: 16,
    left: 16,
    background: warmTheme.surface,
    border: `1px solid ${warmTheme.border}`,
    borderRadius: 12,
    padding: '14px 20px',
    color: warmTheme.text,
    fontFamily: '"Georgia", serif',
    minWidth: 210,
    backdropFilter: 'blur(4px)',
    pointerEvents: 'none',
    boxShadow: warmTheme.shadow,
  },
  title: {
    fontSize: 12,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: warmTheme.textMuted,
    marginBottom: 8,
  },
  stat: {
    fontSize: 14,
    color: warmTheme.textSoft,
    marginTop: 4,
  },
  synergy: {
    marginTop: 10,
    fontSize: 13,
    color: warmTheme.accent,
  },
  empty: {
    fontSize: 13,
    color: warmTheme.textFaint,
    fontStyle: 'italic',
  },
};

export default function AngelStatPanel() {
  const board = useStore(selectBoard);
  const turn = useStore(selectTurn);
  const stats = useStore(selectComputedStats);

  // Single pass over board slots instead of four separate .filter() calls
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

  const hasAnything = angelCount > 0 || totalSeraphimCount > 0;

  return (
    <div style={styles.panel}>
      <div style={styles.title}>Board</div>
      {hasAnything ? (
        <>
          {stats.activeSynergies > 0 && (
            <div style={styles.stat}>+{formatNumber(stats.oblivionPerCardBonus)} Oblivion/card</div>
          )}
          {turn.phase === 'playing' && (
            <div style={styles.stat}>×{turn.chainMultiplier.toFixed(2)} chain</div>
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
              color: activeSeraphimCount > 0 ? warmTheme.success : warmTheme.textMuted,
            }}>
              {activeSeraphimCount}/{totalSeraphimCount} Seraphim{totalSeraphimCount > 1 ? 's' : ''} active
            </div>
          )}
          {cherubimCount > 0 && (
            <div style={{ ...styles.synergy, color: warmTheme.cherubim }}>
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
