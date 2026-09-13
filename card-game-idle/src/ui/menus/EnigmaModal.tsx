import { useMemo, useState } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { uiTypography } from '@/ui/theme';
import { listEnigmaDefinitions } from '@/systems/progression/EnigmaSystem';
import { getActiveEnigmaInstance } from '@/data/enigmas/enigmaDefinitions';

interface Props { onClose: () => void; }

export default function EnigmaModal({ onClose }: Props) {
  const progress = useStore(selectProgress);
  const setActiveEnigma = useStore(s => s.setActiveEnigma);
  const sacrificeEnigmaOblivion = useStore(s => s.sacrificeEnigmaOblivion);
  const claimEnigmaReward = useStore(s => s.claimEnigmaReward);
  const definitions = useMemo(() => listEnigmaDefinitions(), []);
  const active = getActiveEnigmaInstance(progress);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div onClick={onClose} role="dialog" aria-modal="true" style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'radial-gradient(circle at 50% 0%, rgba(244,207,107,0.18), transparent 42%), #14101f', color: '#f8f0de', overflowY: 'auto', padding: 28, fontFamily: uiTypography.body }}>
      <div onClick={event => event.stopPropagation()} style={{ maxWidth: 980, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(244,207,107,0.35)', paddingBottom: 18, marginBottom: 18 }}>
          <div>
            <div style={{ color: '#f4cf6b', fontFamily: uiTypography.display, fontSize: 11, letterSpacing: 3 }}>✦ COSMIC PATTERNS</div>
            <h1 style={{ margin: '6px 0 4px', color: '#fff0d1', fontFamily: uiTypography.display, fontSize: 32, letterSpacing: 1.5 }}>Enigma</h1>
            <div style={{ color: '#d5c3eb', fontSize: 13 }}>Follow hidden milestones, unlock their steps, and claim their rewards.</div>
          </div>
          <button
            className="menu-tactile-btn"
            onClick={onClose}
            aria-label="Close Enigma"
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              border: '1px solid rgba(244,207,107,0.5)',
              background: 'radial-gradient(circle at 35% 30%, rgba(244,207,107,0.22) 0%, rgba(30,20,50,0.85) 100%)',
              color: '#fff0d1',
              fontFamily: uiTypography.display,
              fontSize: 16,
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >✕</button>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          {definitions.map(definition => {
            const instance = progress.enigmas.instances[definition.id];
            const status = instance?.status ?? 'locked';
            const locked = status === 'locked';
            const expanded = expandedId === definition.id;
            const isActive = (active?.id ?? progress.enigmas.activeEnigmaId) === definition.id;
            const currentStep = definition.steps[Math.min(instance?.currentStepIndex ?? 0, definition.steps.length - 1)];
            const canClaim = !locked && status !== 'completed' && (instance?.currentStepIndex ?? 0) >= definition.steps.length - 1 && !!instance?.stepsComplete[definition.steps.length - 2];
            const canOblivion = definition.id === 'neutral-mystery' && instance?.currentStepIndex === 1;
            return (
              <section key={definition.id} onClick={() => { setActiveEnigma(definition.id); setExpandedId(expanded ? null : definition.id); }} style={{ border: `1px solid ${isActive ? '#f4cf6b' : 'rgba(244,207,107,0.4)'}`, background: locked ? 'rgba(70,50,8,0.5)' : 'rgba(58,38,88,0.72)', padding: 18, borderRadius: 12, cursor: 'pointer', opacity: locked ? 0.72 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div><div style={{ color: '#fff0d1', fontFamily: uiTypography.display, fontSize: 20 }}>{definition.title}</div><div style={{ color: '#d5c3eb', marginTop: 4 }}>{locked ? definition.hintText : currentStep?.description ?? definition.hintText}</div></div>
                  <div style={{
                    color: status === 'completed' ? '#8de68d' : isActive ? '#f4cf6b' : 'rgba(213, 195, 235, 0.7)',
                    fontFamily: uiTypography.display,
                    fontSize: 10,
                    letterSpacing: 1.2,
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: `1px solid ${status === 'completed' ? 'rgba(141, 230, 141, 0.5)' : isActive ? 'rgba(244, 207, 107, 0.6)' : 'rgba(213, 195, 235, 0.25)'}`,
                    background: status === 'completed' ? 'rgba(40, 90, 50, 0.35)' : isActive ? 'rgba(90, 65, 20, 0.45)' : 'rgba(30, 20, 50, 0.35)',
                    whiteSpace: 'nowrap',
                    alignSelf: 'flex-start',
                    boxShadow: isActive ? '0 0 10px rgba(244, 207, 107, 0.25)' : 'none',
                  }}>
                    {status === 'completed' ? 'COMPLETED' : isActive ? 'ACTIVE' : 'INACTIVE'} {expanded ? '▾' : '▸'}
                  </div>
                </div>
                {expanded && !locked && <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>{definition.steps.map((step, index) => <div key={step.title} style={{ display: 'flex', gap: 10, color: instance?.stepsComplete[index] ? '#d5c3eb' : '#f8f0de' }}><b>{index + 1}.</b><div><div style={{ fontFamily: uiTypography.display }}>{step.title}</div><div style={{ fontSize: 12, marginTop: 2 }}>{step.description}</div></div></div>)}<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                  {canOblivion && (
                    <button
                      className="menu-tactile-btn"
                      onClick={event => { event.stopPropagation(); sacrificeEnigmaOblivion(definition.id); }}
                      disabled={progress.oblivion < 50000}
                      style={{
                        padding: '9px 20px',
                        borderRadius: 8,
                        border: '1px solid rgba(244, 207, 107, 0.7)',
                        background: progress.oblivion < 50000
                          ? 'rgba(60, 45, 20, 0.5)'
                          : 'linear-gradient(135deg, rgba(217, 164, 65, 0.95) 0%, rgba(248, 221, 122, 0.95) 50%, rgba(184, 130, 32, 0.95) 100%)',
                        color: progress.oblivion < 50000 ? 'rgba(250, 240, 222, 0.5)' : '#1a1206',
                        fontFamily: uiTypography.display,
                        fontSize: 12,
                        fontWeight: 'bold',
                        letterSpacing: 1.1,
                        textTransform: 'uppercase',
                        cursor: progress.oblivion < 50000 ? 'not-allowed' : 'pointer',
                        boxShadow: progress.oblivion < 50000 ? 'none' : '0 4px 14px rgba(244, 207, 107, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                      }}
                    >
                      Sacrifice 50,000 Divine Light
                    </button>
                  )}
                  {canClaim && (
                    <button
                      className="menu-tactile-btn enigma-golden-shimmer"
                      onClick={event => { event.stopPropagation(); claimEnigmaReward(definition.id); }}
                      style={{
                        padding: '10px 24px',
                        borderRadius: 8,
                        border: '1px solid rgba(255, 230, 150, 0.9)',
                        background: 'linear-gradient(120deg, #6b4a12 0%, #d9a441 30%, #f8dd7a 50%, #d9a441 70%, #6b4a12 100%)',
                        backgroundSize: '200% 100%',
                        color: '#120d04',
                        fontFamily: uiTypography.display,
                        fontSize: 13,
                        fontWeight: 'bold',
                        letterSpacing: 1.3,
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        boxShadow: '0 6px 20px rgba(244, 207, 107, 0.5), 0 0 12px rgba(248, 221, 122, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
                      }}
                    >
                      ✦ Claim Reward
                    </button>
                  )}
                </div></div>}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
