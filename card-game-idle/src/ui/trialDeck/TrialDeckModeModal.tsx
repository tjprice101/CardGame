import { uiTypography } from '@/ui/theme';

interface Props {
  packId: string;
  packName: string;
  onConfirm: (mode: 'solo' | 'guided') => void;
  onClose: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.72)',
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
    width: 380,
    maxWidth: '90vw',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    boxShadow: '0 8px 48px rgba(0, 0, 0, 0.8)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8de8a8',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(190, 215, 245, 0.65)',
  },
  modeCard: {
    border: '1px solid rgba(120, 180, 140, 0.30)',
    borderRadius: 10,
    padding: '14px 16px',
    cursor: 'pointer',
    background: 'rgba(60, 120, 80, 0.10)',
    transition: 'background 0.15s, border-color 0.15s',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  modeName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#a8efc0',
    letterSpacing: 0.5,
  },
  modeDesc: {
    fontSize: 11,
    color: 'rgba(190, 215, 245, 0.70)',
    lineHeight: 1.5,
  },
  cancelBtn: {
    marginTop: 4,
    background: 'transparent',
    border: '1px solid rgba(100, 140, 188, 0.28)',
    borderRadius: 8,
    color: 'rgba(190, 215, 245, 0.65)',
    fontSize: 11,
    cursor: 'pointer',
    padding: '7px 16px',
    fontFamily: uiTypography.body,
    textAlign: 'center' as const,
  },
};

export default function TrialDeckModeModal({ packName, onConfirm, onClose }: Props) {
  const handleSelect = (mode: 'solo' | 'guided') => {
    onConfirm(mode);
    onClose();
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div>
          <div style={styles.title}>🃏 Trial Deck</div>
          <div style={{ ...styles.subtitle, marginTop: 4 }}>{packName}</div>
        </div>

        <div style={{ fontSize: 11, color: 'rgba(190,215,245,0.60)', lineHeight: 1.5 }}>
          Play a curated practice deck. No Card-light, mastery rewards, oblivion, or Resonance points are gained. Your collection is fully restored when the trial ends.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            style={styles.modeCard}
            onClick={() => handleSelect('solo')}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(60,140,80,0.22)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(120,200,140,0.55)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(60,120,80,0.10)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(120,180,140,0.30)';
            }}
          >
            <div style={styles.modeName}>Solo Mode</div>
            <div style={styles.modeDesc}>
              The trial deck is shuffled randomly. Play freely at your own pace to explore the set's cards and mechanics.
            </div>
          </button>

          <button
            style={styles.modeCard}
            onClick={() => handleSelect('guided')}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(60,140,80,0.22)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(120,200,140,0.55)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(60,120,80,0.10)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(120,180,140,0.30)';
            }}
          >
            <div style={styles.modeName}>Guided Mode</div>
            <div style={styles.modeDesc}>
              A fixed opening hand and ordered draw pile. Step-by-step instructions highlight each card to play, teaching the set's core strategy. No mulligans.
            </div>
          </button>
        </div>

        <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
