import { useMemo, useState } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { uiTypography, warmTheme } from '@/ui/theme';
import { useThemeVersion } from '@/ui/useThemeVersion';
import { getUniqueOwnedCardsForSet, isEnigmaDiscovered, listEnigmaDefinitions } from '@/systems/progression/EnigmaSystem';
import { getActiveEnigmaInstance } from '@/data/enigmas/enigmaDefinitions';

interface Props { onClose: () => void; }

const ENIGMA_SUBTITLES: Record<string, string> = {
  'to-amplify-the-nullitude': 'The Nullitude Manuscript',
  'null-surged': 'The Surgeborn Manuscript',
  'neutral-mystery': 'The Quiet Manuscript',
  'neutralizing-the-void': 'The Nullification Manuscript',
  'causality-first-horizon': 'The First Horizon Manuscript',
  'causality-black-ink': 'The Contradiction Manuscript',
  'causality-heavenly-archive': 'The Archive Manuscript',
  'causality-collapsed-equation': 'The Equation Manuscript',
  'causality-unwritten-law': 'The Unwritten Manuscript',
};

function getEnigmaAccent(id: string) {
  return {
    accent: warmTheme.accent,
    glow: `color-mix(in srgb, ${warmTheme.accent} 34%, transparent)`,
    subtitle: ENIGMA_SUBTITLES[id] ?? 'Hidden Manuscript',
  };
}

function getEnigmaArtUrl(id: string): string {
  return `${import.meta.env.BASE_URL}assets/enigma-banners/${encodeURIComponent(id)}.png`;
}

export default function EnigmaModal({ onClose }: Props) {
  useThemeVersion();
  const progress = useStore(selectProgress);
  const setActiveEnigma = useStore(s => s.setActiveEnigma);
  const sacrificeEnigmaDivineLight = useStore(s => s.sacrificeEnigmaDivineLight);
  const claimEnigmaReward = useStore(s => s.claimEnigmaReward);
  const definitions = useMemo(() => listEnigmaDefinitions(), []);
  const groupedDefinitions = useMemo(() => (['Neutrality', 'Causality'] as const).flatMap(setId => {
    const entries = definitions.filter(definition => definition.setId === setId && progress.enigmas.instances[definition.id]?.status !== 'completed');
    return entries.map((definition, index) => ({ definition, setId, firstInSet: index === 0 }));
  }), [definitions, progress.enigmas.instances]);
  const active = getActiveEnigmaInstance(progress);
  const unlockedDefinitions = useMemo(
    () => definitions.filter(definition => progress.enigmas.instances[definition.id]?.status === 'acquired'),
    [definitions, progress],
  );
  const archivedDefinitions = useMemo(
    () => definitions.filter(definition => progress.enigmas.instances[definition.id]?.status === 'completed'),
    [definitions, progress.enigmas.instances],
  );
  const lockedOnDefinition = definitions.find(definition => definition.id === progress.enigmas.activeEnigmaId && progress.enigmas.instances[definition.id]?.status === 'acquired') ?? null;
  const [view, setView] = useState<'active' | 'archive'>('active');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div onClick={onClose} onWheel={event => event.stopPropagation()} role="dialog" aria-modal="true" style={{ position: 'absolute', inset: 0, zIndex: 50, background: `radial-gradient(circle at 50% 0%, color-mix(in srgb, ${warmTheme.accent} 18%, transparent), transparent 42%), ${warmTheme.appBackground}`, color: warmTheme.text, overflowY: 'auto', overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch', padding: 28, fontFamily: uiTypography.body }}>
      <div onClick={event => event.stopPropagation()} style={{ maxWidth: 980, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid ${warmTheme.border}`, paddingBottom: 18, marginBottom: 18 }}>
          <div>
            <div style={{ color: warmTheme.accent, fontFamily: uiTypography.display, fontSize: 11, letterSpacing: 3 }}>✦ COSMIC PATTERNS</div>
            <h1 style={{ margin: '6px 0 4px', color: warmTheme.text, fontFamily: uiTypography.display, fontSize: 32, letterSpacing: 1.5 }}>Enigma</h1>
            <div style={{ color: warmTheme.textMuted, fontSize: 13 }}>Find hidden manuscripts, unlock their trials, and claim their Enigmatic rewards.</div>
          </div>
          <button
            className="menu-tactile-btn"
            onClick={onClose}
            aria-label="Close Enigma"
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              border: `1px solid ${warmTheme.borderStrong}`,
              background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${warmTheme.accent} 22%, transparent) 0%, ${warmTheme.surfaceStrong} 100%)`,
              color: warmTheme.text,
              fontFamily: uiTypography.display,
              fontSize: 16,
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >✕</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, padding: 5, borderRadius: 10, background: warmTheme.surfaceMuted, border: `1px solid ${warmTheme.border}` }}>
          {(['active', 'archive'] as const).map(tab => (
            <button key={tab} type="button" onClick={() => setView(tab)} style={{ flex: 1, padding: '9px 14px', borderRadius: 7, border: `1px solid ${view === tab ? warmTheme.borderStrong : 'transparent'}`, background: view === tab ? `color-mix(in srgb, ${warmTheme.accent} 16%, transparent)` : 'transparent', color: view === tab ? warmTheme.text : warmTheme.textMuted, fontFamily: uiTypography.display, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', cursor: 'pointer' }}>
              {tab === 'active' ? 'Active Manuscripts' : `Enigmatic Archive${archivedDefinitions.length ? ` · ${archivedDefinitions.length}` : ''}`}
            </button>
          ))}
        </div>
        {view === 'archive' && (
          <section style={{ display: 'grid', gap: 14, marginBottom: 18 }}>
            <div style={{ minHeight: 150, padding: '22px 24px', borderRadius: 15, border: `1px solid ${warmTheme.borderStrong}`, backgroundImage: `linear-gradient(90deg, color-mix(in srgb, ${warmTheme.surfaceMuted} 96%, transparent), color-mix(in srgb, ${warmTheme.surfaceStrong} 72%, transparent), color-mix(in srgb, ${warmTheme.surfaceMuted} 28%, transparent)), url("${import.meta.env.BASE_URL}assets/enigma-banners/enigmatic-archive.png")`, backgroundPosition: 'center', backgroundSize: 'cover', boxShadow: `0 0 28px color-mix(in srgb, ${warmTheme.accent} 18%, transparent)` }}>
              <div style={{ color: warmTheme.accent, fontFamily: uiTypography.display, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>THE ENIGMATIC ARCHIVE</div>
              <div style={{ color: warmTheme.text, fontFamily: uiTypography.display, fontSize: 27, letterSpacing: 1.2, marginTop: 7 }}>Claimed Manuscripts</div>
              <div style={{ color: warmTheme.textMuted, fontSize: 12, marginTop: 5 }}>A preserved record of every Enigma whose final reward has been claimed.</div>
            </div>
            {archivedDefinitions.length === 0 && <div style={{ color: warmTheme.textMuted, fontSize: 12, padding: 18, borderRadius: 12, border: `1px solid ${warmTheme.border}`, background: warmTheme.surfaceMuted }}>Completed enigmas will be preserved here after their final reward is claimed.</div>}
            {archivedDefinitions.map(definition => (
              <article key={definition.id} style={{ overflow: 'hidden', borderRadius: 14, border: `1px solid ${warmTheme.border}`, background: warmTheme.surfaceMuted, boxShadow: `0 0 22px ${getEnigmaAccent(definition.id).glow}` }}>
                <div style={{ minHeight: 130, padding: 18, backgroundImage: `linear-gradient(90deg, color-mix(in srgb, ${warmTheme.surfaceMuted} 94%, transparent), color-mix(in srgb, ${warmTheme.surfaceStrong} 60%, transparent)), url("${getEnigmaArtUrl(definition.id)}")`, backgroundPosition: 'center', backgroundSize: 'cover' }}>
                  <div style={{ color: getEnigmaAccent(definition.id).accent, fontFamily: uiTypography.display, fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase' }}>ARCHIVED · REWARD CLAIMED</div>
                  <div style={{ color: warmTheme.text, fontFamily: uiTypography.display, fontSize: 23, marginTop: 6 }}>{definition.title}</div>
                  <div style={{ color: warmTheme.textMuted, fontSize: 11, marginTop: 5 }}>{getEnigmaAccent(definition.id).subtitle}</div>
                </div>
                <div style={{ display: 'grid', gap: 8, padding: 16 }}>{definition.steps.map((step, index) => <div key={`${definition.id}-${index}`} style={{ display: 'flex', gap: 10, color: warmTheme.textMuted, fontSize: 12 }}><b style={{ color: warmTheme.success }}>✓</b><div><div style={{ color: warmTheme.text, fontFamily: uiTypography.display }}>{step.title}</div><div style={{ marginTop: 2 }}>{step.description}</div></div></div>)}</div>
              </article>
            ))}
          </section>
        )}
        {view === 'active' && lockedOnDefinition && (
          <section style={{
            position: 'relative', overflow: 'hidden', minHeight: 210, marginBottom: 18,
            borderRadius: 16, border: `1px solid ${getEnigmaAccent(lockedOnDefinition.id).accent}88`,
            backgroundImage: `linear-gradient(90deg, color-mix(in srgb, ${warmTheme.surfaceMuted} 98%, transparent) 0%, color-mix(in srgb, ${warmTheme.surfaceStrong} 82%, transparent) 48%, color-mix(in srgb, ${warmTheme.surfaceMuted} 30%, transparent) 100%), url("${getEnigmaArtUrl(lockedOnDefinition.id)}")`,
            backgroundPosition: 'center', backgroundSize: 'cover',
            boxShadow: `0 0 32px ${getEnigmaAccent(lockedOnDefinition.id).glow}`,
            padding: 24,
          }}>
            <div style={{ position: 'relative', maxWidth: 650 }}>
              <div style={{ color: getEnigmaAccent(lockedOnDefinition.id).accent, fontFamily: uiTypography.display, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>LOCKED-ON MANUSCRIPT</div>
              <div style={{ color: warmTheme.text, fontFamily: uiTypography.display, fontSize: 30, letterSpacing: 1.2, marginTop: 6 }}>{lockedOnDefinition.title}</div>
              <div style={{ color: warmTheme.textMuted, fontSize: 12, marginTop: 5 }}>{getEnigmaAccent(lockedOnDefinition.id).subtitle} · Progress advances only for the selected Enigma.</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
                <span style={{ padding: '6px 10px', borderRadius: 7, color: getEnigmaAccent(lockedOnDefinition.id).accent, border: `1px solid ${getEnigmaAccent(lockedOnDefinition.id).accent}66`, background: 'rgba(0,0,0,0.26)', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' }}>Active Focus</span>
                <span style={{ padding: '6px 10px', borderRadius: 7, color: warmTheme.textSoft, border: `1px solid ${warmTheme.border}`, background: 'rgba(0,0,0,0.22)', fontSize: 10 }}>{lockedOnDefinition.steps.length} steps · {lockedOnDefinition.rewards.length} reward line</span>
              </div>
            </div>
          </section>
        )}
        <div style={{ display: view === 'active' ? undefined : 'none', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 9 }}>
            <div style={{ color: warmTheme.accent, fontFamily: uiTypography.display, fontSize: 11, letterSpacing: 2.4, textTransform: 'uppercase' }}>Unlocked Manuscripts</div>
            <div style={{ color: warmTheme.textMuted, fontSize: 10 }}>{unlockedDefinitions.length} available · choose one to lock on</div>
          </div>
          {unlockedDefinitions.length > 0 ? (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 5 }}>
              {unlockedDefinitions.map(definition => {
                const accent = getEnigmaAccent(definition.id);
                const selected = definition.id === lockedOnDefinition?.id;
                const instance = progress.enigmas.instances[definition.id];
                const complete = instance?.status === 'completed';
                return <button key={definition.id} type="button" onClick={() => { setActiveEnigma(definition.id); setExpandedId(definition.id); }} style={{
                  flex: '0 0 220px', minHeight: 112, padding: 13, borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                  border: `1px solid ${selected ? accent.accent : warmTheme.border}`,
                  backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${warmTheme.surfaceMuted} 95%, transparent), color-mix(in srgb, ${warmTheme.surfaceStrong} 72%, transparent)), url("${getEnigmaArtUrl(definition.id)}")`,
                  backgroundPosition: 'center', backgroundSize: 'cover', boxShadow: selected ? `0 0 18px ${accent.glow}` : 'none',
                }}><div style={{ color: accent.accent, fontFamily: uiTypography.display, fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase' }}>{selected ? 'Locked On' : complete ? 'Completed' : 'Select Focus'}</div><div style={{ color: warmTheme.text, fontFamily: uiTypography.display, fontSize: 15, marginTop: 7, lineHeight: 1.15 }}>{definition.title}</div><div style={{ color: warmTheme.textMuted, fontSize: 10, marginTop: 8 }}>{definition.setId} · {definition.steps.length} steps</div></button>;
              })}
            </div>
          ) : <div style={{ color: warmTheme.textMuted, fontSize: 12, padding: '14px 0' }}>Unlock a manuscript by meeting its discovery requirements.</div>}
        </div>
        <div style={{ display: view === 'active' ? 'grid' : 'none', gap: 14 }}>
          {groupedDefinitions.map(entry => {
            const definition = entry.definition;
            const instance = progress.enigmas.instances[definition.id];
            const status = instance?.status ?? 'locked';
            const discovered = isEnigmaDiscovered(progress, definition.id);
            const locked = status === 'locked';
            const foundButLocked = discovered && locked;
            const canLockOn = status === 'acquired';
            const expanded = expandedId === definition.id;
            const isActive = (active?.id ?? progress.enigmas.activeEnigmaId) === definition.id;
            const completedSteps = definition.steps.map((_, index) => status === 'completed' || instance?.stepsComplete?.[index] === true);
            const currentStep = status === 'completed'
              ? null
              : definition.steps[Math.min(instance?.currentStepIndex ?? 0, definition.steps.length - 1)];
            const currentTrackedValue = currentStep?.progressCounterKey ? instance?.progressCounters?.[currentStep.progressCounterKey] ?? 0 : null;
            const currentTrackedTarget = currentStep?.amount ?? 0;
            const canClaim = !locked && status !== 'completed' && !!instance && completedSteps.slice(0, -1).every(Boolean);
            const divineLightCost = definition.id === 'neutral-mystery' ? 50_000 : 25_000;
            const canSacrificeForEnigma = (definition.id === 'neutral-mystery' || definition.id === 'neutralizing-the-void') && instance?.currentStepIndex === 1;
            const stepsExpanded = expanded || status === 'completed';
            return (
              <div key={definition.id}>
                {entry.firstInSet && (
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, margin: '18px 2px 8px', paddingBottom: 7, borderBottom: `1px solid ${warmTheme.border}` }}>
                    <div style={{ color: warmTheme.accent, fontFamily: uiTypography.display, fontSize: 12, letterSpacing: 2.2, textTransform: 'uppercase' }}>{entry.setId} Enigmas</div>
                    <div style={{ color: warmTheme.textMuted, fontSize: 10, letterSpacing: 0.7 }}>{getUniqueOwnedCardsForSet(progress, entry.setId)}/5 unique cards</div>
                  </div>
                )}
              <section onClick={() => { if (canLockOn) setActiveEnigma(definition.id); if (!locked) setExpandedId(expanded ? null : definition.id); }} style={{ border: `1px solid ${isActive ? warmTheme.borderStrong : warmTheme.border}`, background: locked ? warmTheme.surfaceMuted : warmTheme.surfaceStrong, padding: 18, borderRadius: 12, cursor: canLockOn ? 'pointer' : 'default', opacity: locked ? 0.72 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div><div style={{ color: warmTheme.text, fontFamily: uiTypography.display, fontSize: 20 }}>{definition.title}</div><div style={{ color: warmTheme.textMuted, marginTop: 4 }}>{!discovered ? definition.hintText : foundButLocked ? (definition.unlockHintText ?? definition.hintText) : status === 'completed' ? 'All Enigma steps complete. Reward claimed.' : currentStep?.description ?? definition.hintText}</div>{currentTrackedValue !== null && <div style={{ color: warmTheme.accent, fontSize: 11, marginTop: 7 }}>{currentStep?.progressCounterLabel}: {Math.min(currentTrackedValue, currentTrackedTarget).toLocaleString()} / {currentTrackedTarget.toLocaleString()}</div>}</div>
                  <div style={{
                    color: status === 'completed' ? warmTheme.success : isActive ? warmTheme.accent : warmTheme.textMuted,
                    fontFamily: uiTypography.display,
                    fontSize: 10,
                    letterSpacing: 1.2,
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: `1px solid ${status === 'completed' ? warmTheme.success : isActive ? warmTheme.borderStrong : warmTheme.border}`,
                    background: status === 'completed' ? `color-mix(in srgb, ${warmTheme.success} 18%, transparent)` : isActive ? `color-mix(in srgb, ${warmTheme.accent} 14%, transparent)` : warmTheme.surfaceMuted,
                    whiteSpace: 'nowrap',
                    alignSelf: 'flex-start',
                    boxShadow: isActive ? `0 0 10px color-mix(in srgb, ${warmTheme.accent} 25%, transparent)` : 'none',
                  }}>
                    {status === 'completed' ? 'COMPLETED' : foundButLocked ? 'FOUND · LOCKED' : isActive ? 'ACTIVE' : discovered ? 'FOUND' : 'HIDDEN'} {stepsExpanded ? '▾' : '▸'}
                  </div>
                </div>
                {stepsExpanded && !locked && <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>{definition.steps.map((step, index) => {
                  const trackedValue = step.progressCounterKey ? instance?.progressCounters?.[step.progressCounterKey] ?? 0 : null;
                  const trackedTarget = step.amount ?? 0;
                  return <div key={step.title} style={{ display: 'flex', gap: 10, color: completedSteps[index] ? warmTheme.textMuted : warmTheme.text }}><b>{completedSteps[index] ? '✓' : `${index + 1}.`}</b><div style={{ flex: 1 }}><div style={{ fontFamily: uiTypography.display }}>{step.title}</div><div style={{ fontSize: 12, marginTop: 2 }}>{step.description}</div>{trackedValue !== null && <div style={{ marginTop: 6, color: warmTheme.accent, fontSize: 11 }}>{step.progressCounterLabel}: {Math.min(trackedValue, trackedTarget).toLocaleString()} / {trackedTarget.toLocaleString()}<div style={{ height: 4, marginTop: 4, borderRadius: 999, background: warmTheme.surfaceMuted, overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.min(100, (trackedValue / Math.max(1, trackedTarget)) * 100)}%`, background: warmTheme.button, borderRadius: 999 }} /></div></div>}</div></div>;
                })}<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                  {canSacrificeForEnigma && (
                    <button
                      className="menu-tactile-btn"
                      onClick={event => { event.stopPropagation(); sacrificeEnigmaDivineLight(definition.id); }}
                      disabled={progress.divineLight < divineLightCost}
                      style={{
                        padding: '9px 20px',
                        borderRadius: 8,
                        border: `1px solid ${warmTheme.borderStrong}`,
                        background: progress.divineLight < divineLightCost
                          ? warmTheme.surfaceMuted
                          : warmTheme.button,
                        color: progress.divineLight < divineLightCost ? warmTheme.textMuted : warmTheme.accentDeep,
                        fontFamily: uiTypography.display,
                        fontSize: 12,
                        fontWeight: 'bold',
                        letterSpacing: 1.1,
                        textTransform: 'uppercase',
                        cursor: progress.divineLight < divineLightCost ? 'not-allowed' : 'pointer',
                        boxShadow: progress.divineLight < divineLightCost ? 'none' : `0 4px 14px color-mix(in srgb, ${warmTheme.accent} 35%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.5)`,
                      }}
                    >
                      Sacrifice {divineLightCost.toLocaleString()} Divine Light
                    </button>
                  )}
                  {canClaim && (
                    <button
                      className="menu-tactile-btn"
                      onClick={event => { event.stopPropagation(); claimEnigmaReward(definition.id); }}
                      style={{
                        padding: '10px 24px',
                        borderRadius: 8,
                        border: `1px solid ${warmTheme.borderStrong}`,
                        background: warmTheme.button,
                        color: warmTheme.accentDeep,
                        fontFamily: uiTypography.display,
                        fontSize: 13,
                        fontWeight: 'bold',
                        letterSpacing: 1.3,
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        boxShadow: `0 6px 20px color-mix(in srgb, ${warmTheme.accent} 35%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.6)`,
                      }}
                    >
                      ✦ Claim Reward
                    </button>
                  )}
                </div></div>}
              </section>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
