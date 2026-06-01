import { useStore, selectTrialDeck } from '@/state/store';
import { isNeutralityTutorialTrialPackId } from '@/data/trialDecks';
import { uiTypography } from '@/ui/theme';

interface Props {
  packName: string;
  onConfirm: () => void;
  onClose: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.78)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: uiTypography.body,
  },
  modal: {
    background: 'linear-gradient(180deg, #1a1410 0%, #12100d 100%)',
    border: '1px solid rgba(140, 200, 120, 0.45)',
    borderRadius: 16,
    padding: '28px 32px',
    width: 400,
    maxWidth: '90vw',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    boxShadow: '0 8px 48px rgba(0, 0, 0, 0.85)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8de8a8',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(190, 215, 245, 0.60)',
    marginTop: 4,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  statCard: {
    background: 'rgba(40, 60, 44, 0.50)',
    border: '1px solid rgba(100, 180, 120, 0.28)',
    borderRadius: 10,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(190,215,245,0.60)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    color: '#c8f0d8',
  },
  guideResult: {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid rgba(100,180,120,0.30)',
    background: 'rgba(40,60,44,0.40)',
    fontSize: 12,
    color: '#c8f0d8',
    lineHeight: 1.5,
  },
  note: {
    fontSize: 10,
    color: 'rgba(190,215,245,0.45)',
    lineHeight: 1.5,
    textAlign: 'center' as const,
  },
  btnRow: {
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    background: 'transparent',
    border: '1px solid rgba(100,140,188,0.28)',
    borderRadius: 8,
    color: 'rgba(190,215,245,0.65)',
    fontSize: 11,
    cursor: 'pointer',
    padding: '8px 18px',
    fontFamily: uiTypography.body,
  },
  confirmBtn: {
    background: 'linear-gradient(180deg, rgba(180,60,60,0.42) 0%, rgba(130,30,30,0.42) 100%)',
    border: '1px solid rgba(220,80,80,0.50)',
    borderRadius: 8,
    color: '#ffaaaa',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    padding: '8px 18px',
    fontFamily: uiTypography.body,
    letterSpacing: 0.5,
  },
};

export default function TrialDeckSummaryModal({ packName, onConfirm, onClose }: Props) {
  const trialDeck = useStore(selectTrialDeck);

  const isTutorialTurn = isNeutralityTutorialTrialPackId(trialDeck.packId);
  const turnCount = trialDeck.turnCount ?? 0;
  const oblivionTotal = Math.floor(trialDeck.trialOblivionTotal ?? 0);

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div>
          <div style={styles.title}>Trial Summary</div>
          <div style={styles.subtitle}>{packName} · Solo Mode</div>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Turns Played</div>
            <div style={styles.statValue}>{turnCount}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Oblivion Scored</div>
            <div style={styles.statValue}>{oblivionTotal.toLocaleString()}</div>
          </div>
        </div>

        {isTutorialTurn && (
          <div style={styles.guideResult}>
            <strong>You cleared a tutorial lane.</strong> Keep climbing into stronger tiers, seek greater cards,
            and master every engine until your deck can command them all.
          </div>
        )}

        <div style={styles.note}>
          No oblivion, Card-light, mastery rewards, or Resonance points were gained during this trial. Your deck and collection are unchanged.
        </div>

        <div style={styles.btnRow}>
          <button style={styles.cancelBtn} onClick={onClose}>Keep Playing</button>
          <button style={styles.confirmBtn} onClick={onConfirm}>End Trial</button>
        </div>
      </div>
    </div>
  );
}
