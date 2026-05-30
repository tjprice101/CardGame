import { useMemo, useState } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { getDailyTrials, getWeeklyTrial, type WakeTrial } from '@/systems/progression/wakeTrials';
import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';
import { previewMasteryReward } from '@/systems/progression/cardMastery';

interface Props {
  onClose: () => void;
}

// Eternity's Wake crimson palette — shared with the boss arena and selection menu.
const EW = {
  accent: '#ff6b6b',
  accentSoft: '#ff9090',
  gold: '#ffd87a',
  text: '#FFF8DC',
  textMuted: 'rgba(255, 200, 200, 0.62)',
  panelBg: 'linear-gradient(180deg, rgba(8, 4, 12, 0.985) 0%, rgba(28, 10, 18, 0.985) 100%)',
  border: 'rgba(255, 107, 107, 0.45)',
  borderStrong: 'rgba(255, 107, 107, 0.75)',
};

const RANK_LABEL: Record<number, string> = { 1: 'Initiate', 2: 'Adept', 3: 'Sovereign' };
const RANK_COLOR: Record<number, { tint: string; border: string; bg: string; glow: string }> = {
  1: { tint: '#d8a878', border: 'rgba(216,168,120,0.6)', bg: 'rgba(216,168,120,0.10)', glow: 'rgba(216,168,120,0.35)' },
  2: { tint: '#dfe6f0', border: 'rgba(223,230,240,0.55)', bg: 'rgba(223,230,240,0.08)', glow: 'rgba(223,230,240,0.30)' },
  3: { tint: '#ffd87a', border: 'rgba(255,216,122,0.75)', bg: 'rgba(255,216,122,0.13)', glow: 'rgba(255,216,122,0.50)' },
};

export default function WakeTrialsModal({ onClose }: Props) {
  const progress = useStore(selectProgress);
  const startWakeTrial = useStore(s => s.startWakeTrial);
  const trials = useMemo(() => getDailyTrials(), []);
  const weekly = useMemo(() => getWeeklyTrial(), []);
  const weeklyCompleted = (progress.weeklyTrialCompletions ?? {})[weekly.weekKey] ?? 0;
  const [selectedTrialId, setSelectedTrialId] = useState<string | null>(trials[0]?.id ?? null);
  const [selectedBossId, setSelectedBossId] = useState<string>(BOSS_DEFINITIONS[0]?.id ?? '');
  const [selectedDeckId, setSelectedDeckId] = useState<string>(progress.savedDecks[0]?.id ?? '');

  const trial = trials.find(t => t.id === selectedTrialId) ?? null;
  const hasDecks = progress.savedDecks.length > 0;
  const selectedBoss = BOSS_DEFINITIONS.find(b => b.id === selectedBossId);
  const selectedDeck = progress.savedDecks.find(d => d.id === selectedDeckId) ?? null;
  const bossIdx = Math.max(0, BOSS_DEFINITIONS.findIndex(b => b.id === selectedBossId));
  const trialMasteryPerCard = trial
    ? Math.round((Math.round(3 + (bossIdx / Math.max(1, BOSS_DEFINITIONS.length - 1)) * 32)) * Math.min(Math.max(1, trial.rewardMultiplier), 2.0))
    : 0;
  const trialRewardPreview = selectedDeck && trial
    ? previewMasteryReward(progress, selectedDeck.deckList, selectedDeck.extraDeck ?? [], trialMasteryPerCard)
    : null;

  function launch() {
    if (!trial || !selectedBossId || !selectedDeckId) return;
    startWakeTrial(selectedBossId, selectedDeckId, trial.modifiers, trial.rewardMultiplier);
    onClose();
  }

  function launchWeekly() {
    if (!selectedDeckId) return;
    // Weekly trial pins the boss and modifier set; reward bonus is normal shards
    // (mult capped at 1 to make this cosmetic-first), cosmetic credit applied on victory.
    startWakeTrial(weekly.bossId, selectedDeckId, weekly.modifiers, 1);
    onClose();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 12%, rgba(255, 80, 80, 0.18) 0%, rgba(255, 80, 80, 0) 42%), linear-gradient(180deg, rgba(6, 2, 8, 0.97) 0%, rgba(16, 6, 12, 0.98) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, pointerEvents: 'auto', fontFamily: 'Georgia, serif',
        animation: 'backdropFade 0.32s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          background: EW.panelBg,
          border: `1px solid ${EW.border}`,
          borderRadius: 18,
          padding: '24px 28px 20px',
          width: 540,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 50px rgba(255, 80, 80, 0.18)',
          animation: 'panelSlideUp 0.42s cubic-bezier(.16,.84,.44,1)',
        }}
      >
        {/* Crown ornament */}
        <div style={{
          position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
          width: 110, height: 3,
          background: `linear-gradient(90deg, transparent, ${EW.accent}, transparent)`,
          borderRadius: 2,
          boxShadow: `0 0 14px ${EW.accent}aa`,
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: 4,
        }}>
          <div>
            <div style={{
              fontSize: 9, letterSpacing: 3, color: EW.textMuted, textTransform: 'uppercase',
            }}>Eternity's Wake</div>
            <div style={{
              fontSize: 24, fontWeight: 'bold', color: EW.accent,
              letterSpacing: 4, textTransform: 'uppercase',
              textShadow: `0 0 18px ${EW.accent}aa, 0 2px 4px rgba(0,0,0,0.8)`,
            }}>Wake Trials</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: `1px solid ${EW.border}`,
              color: EW.accentSoft, width: 32, height: 32, borderRadius: 8,
              fontSize: 16, cursor: 'pointer', fontFamily: 'Georgia, serif',
            }}
          >×</button>
        </div>
        <div style={{
          fontSize: 11, color: EW.textMuted, fontStyle: 'italic',
          marginBottom: 18, lineHeight: 1.55,
          borderTop: `1px solid ${EW.border}`,
          paddingTop: 10, marginTop: 12,
        }}>
          Three trials carved fresh each cycle. Stack the modifiers, accept the burden, and the Wake will return its weight in shards.
        </div>

        {/* Weekly Rotating Trial — cosmetic-only reward */}
        <div style={{
          marginBottom: 18,
          padding: '12px 14px',
          background: 'linear-gradient(135deg, rgba(190,140,255,0.10), rgba(60, 30, 90, 0.45))',
          border: `1px solid ${weeklyCompleted > 0 ? 'rgba(180,140,255,0.7)' : 'rgba(180,140,255,0.4)'}`,
          borderRadius: 12,
          boxShadow: weeklyCompleted > 0
            ? '0 0 20px rgba(180,140,255,0.35), inset 0 0 18px rgba(0,0,0,0.35)'
            : '0 2px 6px rgba(0,0,0,0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(200,170,255,0.7)', textTransform: 'uppercase' }}>
                Weekly Trial · Week {weekly.weekIndex}
              </div>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#d4b3ff', letterSpacing: 1.5, marginTop: 2 }}>
                {weekly.bossName}
              </div>
            </div>
            <div style={{
              fontSize: 10, letterSpacing: 1.5, padding: '3px 8px',
              borderRadius: 4,
              background: weeklyCompleted > 0 ? 'rgba(180,140,255,0.22)' : 'transparent',
              border: `1px solid ${weeklyCompleted > 0 ? 'rgba(200,170,255,0.6)' : 'rgba(200,170,255,0.3)'}`,
              color: weeklyCompleted > 0 ? '#e1c8ff' : 'rgba(200,170,255,0.65)',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}>
              {weeklyCompleted > 0 ? `Cleared ×${weeklyCompleted}` : 'Unclaimed'}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 8 }}>
            {weekly.modifiers.map((m, i) => (
              <div key={i} style={{ fontSize: 11, color: 'rgba(230, 210, 255, 0.85)', lineHeight: 1.4 }}>
                · {m.text}
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 10, padding: '6px 8px',
            background: 'rgba(120, 80, 180, 0.18)',
            border: '1px solid rgba(180,140,255,0.35)',
            borderRadius: 6, fontSize: 10, color: '#d4b3ff',
            letterSpacing: 0.5,
          }}>
            Reward: cosmetic title progress (Weekly Pilgrim → Warden of the Week → Eternal of the Week). No shards, no cards.
          </div>
          <button
            onClick={launchWeekly}
            disabled={!hasDecks}
            style={{
              marginTop: 10, width: '100%',
              background: hasDecks
                ? 'linear-gradient(180deg, rgba(180,140,255,0.55) 0%, rgba(110, 70, 180, 0.85) 100%)'
                : 'rgba(40, 20, 60, 0.5)',
              color: hasDecks ? '#fff' : EW.textMuted,
              border: '1px solid rgba(180,140,255,0.6)',
              borderRadius: 8, padding: '10px 14px',
              fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 'bold',
              letterSpacing: 2, textTransform: 'uppercase',
              cursor: hasDecks ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
            }}
          >
            Challenge Weekly Trial
          </button>
        </div>

        {/* Trials grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          {trials.map(t => (
            <TrialCard
              key={t.id}
              trial={t}
              active={selectedTrialId === t.id}
              onSelect={() => setSelectedTrialId(t.id)}
            />
          ))}
        </div>

        {/* Boss & Deck selection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <PickerColumn label="Opponent">
            <select
              value={selectedBossId}
              onChange={(e) => setSelectedBossId(e.target.value)}
              style={ewSelectStyle}
            >
              {BOSS_DEFINITIONS.map(b => (
                <option key={b.id} value={b.id}>{b.name} — {b.category}</option>
              ))}
            </select>
            {selectedBoss && (
              <div style={{ fontSize: 10, color: EW.textMuted, marginTop: 6, fontStyle: 'italic' }}>
                {selectedBoss.hp.toLocaleString()} HP · {selectedBoss.category}
              </div>
            )}
          </PickerColumn>
          <PickerColumn label="Vessel (Deck)">
            {hasDecks ? (
              <select
                value={selectedDeckId}
                onChange={(e) => setSelectedDeckId(e.target.value)}
                style={ewSelectStyle}
              >
                {progress.savedDecks.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            ) : (
              <div style={{ fontSize: 11, color: EW.textMuted, fontStyle: 'italic', padding: '8px 0' }}>
                Save a deck first to challenge a trial.
              </div>
            )}
          </PickerColumn>
        </div>

        {trial && selectedDeck && trialRewardPreview && (
          <div style={{
            marginBottom: 16,
            padding: '10px 12px',
            background: 'rgba(70, 26, 34, 0.42)',
            border: `1px solid ${EW.border}`,
            borderRadius: 10,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: EW.textMuted, marginBottom: 4 }}>Trial Reward Preview</div>
              <div style={{ fontSize: 15, color: EW.gold, fontWeight: 'bold' }}>+{trialMasteryPerCard} Tier Progress / unique card</div>
              <div style={{ fontSize: 10, color: EW.textMuted, marginTop: 3 }}>Selected deck: {selectedDeck.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(140,230,255,0.7)', marginBottom: 4 }}>Resonance Now</div>
              <div style={{ fontSize: 15, color: '#8ce6ff', fontWeight: 'bold' }}>+{trialRewardPreview.resonanceGain.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: EW.textMuted, marginTop: 3 }}>{trialRewardPreview.cardsTieredUp} tier-up{trialRewardPreview.cardsTieredUp === 1 ? '' : 's'} this clear</div>
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={launch}
          disabled={!trial || !hasDecks}
          style={{
            width: '100%',
            background: trial && hasDecks
              ? `linear-gradient(180deg, ${EW.accent} 0%, #c33b3b 100%)`
              : 'rgba(40, 16, 24, 0.5)',
            color: trial && hasDecks ? '#fff' : EW.textMuted,
            border: `1px solid ${trial && hasDecks ? EW.borderStrong : EW.border}`,
            borderRadius: 10,
            padding: '14px 18px',
            fontFamily: 'Georgia, serif',
            fontSize: 16,
            fontWeight: 'bold',
            letterSpacing: 4,
            textTransform: 'uppercase',
            cursor: trial && hasDecks ? 'pointer' : 'not-allowed',
            boxShadow: trial && hasDecks
              ? `0 0 22px ${EW.accent}88, inset 0 1px 0 rgba(255,255,255,0.18)`
              : 'none',
            textShadow: trial && hasDecks ? '0 1px 2px rgba(0,0,0,0.5)' : undefined,
            transition: 'all 0.2s ease',
          }}
        >
          {trial && hasDecks ? `Enter the ${RANK_LABEL[trial.rank]} Trial` : 'Begin Trial'}
        </button>
      </div>
    </div>
  );
}

function TrialCard({ trial, active, onSelect }: { trial: WakeTrial; active: boolean; onSelect: () => void }) {
  const tier = RANK_COLOR[trial.rank];
  return (
    <button
      onClick={onSelect}
      style={{
        textAlign: 'left',
        padding: '12px 14px',
        background: active
          ? `linear-gradient(135deg, ${tier.bg}, rgba(40, 12, 22, 0.6))`
          : 'rgba(20, 8, 16, 0.55)',
        border: active ? `1.5px solid ${tier.border}` : `1px solid ${EW.border}`,
        borderRadius: 12,
        cursor: 'pointer',
        fontFamily: 'Georgia, serif',
        transition: 'all 0.18s ease',
        boxShadow: active ? `0 0 22px ${tier.glow}, inset 0 0 22px rgba(0,0,0,0.4)` : '0 2px 6px rgba(0,0,0,0.4)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Rank tier shimmer band */}
      {active && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${tier.tint}, transparent)`,
          backgroundSize: '200% 100%',
          animation: 'ewRankShimmer 3.5s linear infinite',
        }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 10, letterSpacing: 2, fontWeight: 'bold',
            color: tier.tint,
            padding: '2px 8px',
            border: `1px solid ${tier.border}`,
            borderRadius: 4,
            textTransform: 'uppercase',
            background: 'rgba(0,0,0,0.35)',
          }}>
            {RANK_LABEL[trial.rank]}
          </span>
          <span style={{ fontSize: 11, color: EW.textMuted, letterSpacing: 0.6 }}>
            {trial.modifiers.length} burden{trial.modifiers.length === 1 ? '' : 's'}
          </span>
        </div>
        <div style={{
          fontSize: 14, color: EW.gold, fontWeight: 'bold',
          textShadow: '0 0 10px rgba(255,215,130,0.55)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: 1,
        }}>
          ×{trial.rewardMultiplier.toFixed(2)}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {trial.modifiers.map((m, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 11.5, color: EW.text, letterSpacing: 0.3,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: tier.tint,
              boxShadow: `0 0 6px ${tier.glow}`,
              flexShrink: 0,
            }} />
            <span>{m.text}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

function PickerColumn({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
        color: EW.accentSoft, marginBottom: 6, fontWeight: 'bold',
      }}>{label}</div>
      {children}
    </div>
  );
}

const ewSelectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 6,
  border: `1px solid ${EW.border}`,
  background: 'rgba(0,0,0,0.45)',
  color: EW.text,
  fontFamily: 'Georgia, serif',
  fontSize: 12,
  letterSpacing: 0.4,
  outline: 'none',
};
