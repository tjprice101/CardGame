import { useEffect } from 'react';
import { useStore, selectTrialDeck } from '@/state/store';
import { uiTypography } from '@/ui/theme';

interface Props {
  onEndTrialRequest: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 90,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    pointerEvents: 'none',
    fontFamily: uiTypography.body,
  },
  badge: {
    background: 'linear-gradient(180deg, rgba(30,60,40,0.96) 0%, rgba(18,38,24,0.96) 100%)',
    border: '1px solid rgba(120,200,140,0.55)',
    borderRadius: 10,
    padding: '6px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
    pointerEvents: 'auto',
  },
  label: {
    fontSize: 10,
    color: '#8de8a8',
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  stat: {
    fontSize: 10,
    color: 'rgba(190,215,245,0.70)',
  },
  endBtn: {
    fontSize: 10,
    color: '#ff8a8a',
    fontWeight: 700,
    cursor: 'pointer',
    background: 'transparent',
    border: '1px solid rgba(255,100,100,0.35)',
    borderRadius: 6,
    padding: '3px 8px',
    fontFamily: uiTypography.body,
    letterSpacing: 1,
    pointerEvents: 'auto',
  },
  guidePanel: {
    background: 'linear-gradient(180deg, rgba(28,50,36,0.95) 0%, rgba(18,36,24,0.95) 100%)',
    border: '1px solid rgba(120,200,140,0.40)',
    borderRadius: 10,
    padding: '8px 14px',
    maxWidth: 340,
    textAlign: 'center',
    pointerEvents: 'auto',
    boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
  },
  guideStep: {
    fontSize: 10,
    color: 'rgba(190,215,245,0.55)',
    letterSpacing: 1,
    marginBottom: 3,
  },
  guideHint: {
    fontSize: 12,
    color: '#c8f0d8',
    lineHeight: 1.45,
  },
  guideComplete: {
    fontSize: 13,
    color: '#8de8a8',
    fontWeight: 700,
    letterSpacing: 0.5,
  },
};

export default function TrialDeckHUD({ onEndTrialRequest }: Props) {
  const trialDeck = useStore(selectTrialDeck);

  // When guide step advances, dispatch highlight event to HandDisplay
  useEffect(() => {
    if (trialDeck.mode !== 'active' || trialDeck.trialMode !== 'guided') return;
    const currentStep = trialDeck.guideSteps[trialDeck.guideStep];
    if (!currentStep) return;
    window.dispatchEvent(new CustomEvent('trial-guide-highlight', {
      detail: { cardDefinitionId: currentStep.cardDefinitionId },
    }));
  }, [trialDeck.guideStep, trialDeck.trialMode, trialDeck.mode, trialDeck.guideSteps]);

  // Re-dispatch highlight event on mount in case HUD remounts
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ step: number; total: number }>;
      if (trialDeck.mode !== 'active' || trialDeck.trialMode !== 'guided') return;
      const currentStep = trialDeck.guideSteps[ce.detail?.step ?? trialDeck.guideStep];
      if (!currentStep) return;
      window.dispatchEvent(new CustomEvent('trial-guide-highlight', {
        detail: { cardDefinitionId: currentStep.cardDefinitionId },
      }));
    };
    window.addEventListener('trial-guide-step-changed', handler);
    return () => window.removeEventListener('trial-guide-step-changed', handler);
  }, [trialDeck.mode, trialDeck.trialMode, trialDeck.guideSteps, trialDeck.guideStep]);

  if (trialDeck.mode !== 'active') return null;

  const isGuided = trialDeck.trialMode === 'guided';
  const currentStep = isGuided ? trialDeck.guideSteps[trialDeck.guideStep] : null;
  const guideComplete = trialDeck.guideComplete;

  return (
    <div style={styles.container}>
      <div style={styles.badge}>
        <span style={styles.label}>🃏 Trial</span>
        <span style={styles.stat}>Turn {trialDeck.turnCount ?? 0}</span>
        <span style={styles.stat}>|</span>
        <span style={styles.stat}>{Math.floor(trialDeck.trialOblivionTotal ?? 0).toLocaleString()} Oblivion</span>
        {isGuided && (
          <>
            <span style={styles.stat}>|</span>
            <span style={styles.stat}>
              Step {Math.min(trialDeck.guideStep + 1, trialDeck.guideSteps.length)}/{trialDeck.guideSteps.length}
            </span>
          </>
        )}
        <button style={styles.endBtn} onClick={onEndTrialRequest}>End Trial</button>
      </div>

      {isGuided && (
        <div style={styles.guidePanel}>
          {guideComplete ? (
            <div style={styles.guideComplete}>✅ Guide complete! End the trial when ready.</div>
          ) : currentStep ? (
            <>
              <div style={styles.guideStep}>
                Step {trialDeck.guideStep + 1} of {trialDeck.guideSteps.length}
              </div>
              <div style={styles.guideHint}>{currentStep.hint}</div>
            </>
          ) : (
            <div style={styles.guideStep}>All guide steps played.</div>
          )}
        </div>
      )}
    </div>
  );
}
