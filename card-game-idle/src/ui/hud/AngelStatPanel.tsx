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

  const angelCount = board.frontSlots.filter(s => s?.type === 'Angel').length;
  const totalSeraphimCount = board.frontSlots.filter(s => s?.type === 'Seraphim').length;
  const activeSeraphimCount = board.frontSlots.filter(s => s?.type === 'Seraphim' && s.isActive).length;
  const chaosCount = board.backSlots.filter(s => s !== null).length;
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
          {chaosCount > 0 && (
            <div style={{ ...styles.synergy, color: warmTheme.chaos }}>
              {chaosCount} Chaos card{chaosCount > 1 ? 's' : ''} active
            </div>
          )}
        </>
      ) : (
        <div style={styles.empty}>No board cards yet</div>
      )}
    </div>
  );
}
