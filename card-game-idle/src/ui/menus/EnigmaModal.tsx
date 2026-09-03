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
  const sacrificeShardsForEnigma = useStore(s => s.sacrificeShardsForEnigma);
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
          <button onClick={onClose} aria-label="Close Enigma" style={{ width: 42, height: 42, borderRadius: '50%', border: '1px solid rgba(244,207,107,0.4)', background: 'rgba(244,207,107,0.08)', color: '#f8f0de', cursor: 'pointer' }}>✕</button>
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
            const canShards = definition.id === 'neutralizing-the-void' && instance?.currentStepIndex === 2 && !instance.stepsComplete[2];
            return (
              <section key={definition.id} onClick={() => { setActiveEnigma(definition.id); setExpandedId(expanded ? null : definition.id); }} style={{ border: `1px solid ${isActive ? '#f4cf6b' : 'rgba(244,207,107,0.4)'}`, background: locked ? 'rgba(70,50,8,0.5)' : 'rgba(58,38,88,0.72)', padding: 18, borderRadius: 12, cursor: 'pointer', opacity: locked ? 0.72 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div><div style={{ color: '#fff0d1', fontFamily: uiTypography.display, fontSize: 20 }}>{definition.title}</div><div style={{ color: '#d5c3eb', marginTop: 4 }}>{locked ? definition.hintText : currentStep?.description ?? definition.hintText}</div></div>
                  <div style={{ color: '#f4cf6b', fontSize: 11, letterSpacing: 1, whiteSpace: 'nowrap' }}>{status === 'completed' ? 'COMPLETED' : isActive ? 'ACTIVE' : 'INACTIVE'} {expanded ? '▾' : '▸'}</div>
                </div>
                {expanded && !locked && <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>{definition.steps.map((step, index) => <div key={step.title} style={{ display: 'flex', gap: 10, color: instance?.stepsComplete[index] ? '#d5c3eb' : '#f8f0de' }}><b>{index + 1}.</b><div><div style={{ fontFamily: uiTypography.display }}>{step.title}</div><div style={{ fontSize: 12, marginTop: 2 }}>{step.description}</div></div></div>)}<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                  {canOblivion && <button onClick={event => { event.stopPropagation(); sacrificeEnigmaOblivion(definition.id); }} disabled={(progress.lifetimeOblivion ?? 0) < 50000}>Sacrifice 50,000 Oblivion</button>}
                  {canShards && <button onClick={event => { event.stopPropagation(); sacrificeShardsForEnigma(definition.id, 2500); }} disabled={(progress.aberratedShards ?? 0) < 2500}>Sacrifice 2,500 Shards</button>}
                  {canClaim && <button onClick={event => { event.stopPropagation(); claimEnigmaReward(definition.id); }}>Claim Reward</button>}
                </div></div>}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
