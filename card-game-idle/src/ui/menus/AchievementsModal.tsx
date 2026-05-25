import { useMemo } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { warmTheme } from '@/ui/theme';
import { listAchievements, summarizeAchievements } from '@/systems/progression/achievements';

interface Props {
  onClose: () => void;
}

const GROUP_LABEL: Record<string, string> = {
  milestone: 'Milestones',
  boss: "Eternity's Wake Bosses",
  infinite: 'Infinite Cards',
  set: 'Set Completion',
};

export default function AchievementsModal({ onClose }: Props) {
  const progress = useStore(selectProgress);
  const claimAchievement = useStore(s => s.claimAchievement);

  const summary = useMemo(() => summarizeAchievements(progress), [progress]);
  const grouped = useMemo(() => {
    const list = listAchievements(progress);
    const out: Record<string, typeof list> = {};
    for (const a of list) {
      (out[a.group] ??= []).push(a);
    }
    return out;
  }, [progress]);

  return (
    <Backdrop onClose={onClose}>
      <Panel>
        <Header title="Achievements" onClose={onClose} />
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 16,
        }}>
          <Stat label="Unlocked" value={`${summary.unlocked}/${summary.total}`} />
          <Stat label="Claimed" value={`${summary.claimed}`} />
          <Stat label="Unclaimed Shards" value={summary.unclaimedShards.toLocaleString()} />
        </div>

        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} style={{ marginBottom: 14 }}>
            <SectionLabel>{GROUP_LABEL[group] ?? group}</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {items.map(a => (
                <div key={a.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 10px',
                  background: a.unlocked ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${warmTheme.border}`,
                  borderRadius: 8,
                  opacity: a.claimed ? 0.55 : a.unlocked ? 1 : 0.55,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 'bold',
                      color: a.unlocked ? warmTheme.text : warmTheme.textMuted,
                    }}>
                      {a.unlocked ? '✓ ' : '🔒 '}{a.text}
                    </div>
                    <div style={{ fontSize: 10, color: warmTheme.textMuted, marginTop: 2 }}>
                      {a.description}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                    <div style={{ fontSize: 10, color: warmTheme.accent, fontWeight: 'bold', minWidth: 50, textAlign: 'right' }}>
                      +{a.shardReward}
                    </div>
                    <button
                      onClick={() => claimAchievement(a.id)}
                      disabled={!a.unlocked || a.claimed}
                      style={{
                        background: a.unlocked && !a.claimed ? warmTheme.accent : 'rgba(0,0,0,0.06)',
                        color: a.unlocked && !a.claimed ? '#fff' : warmTheme.textMuted,
                        border: `1px solid ${warmTheme.border}`,
                        borderRadius: 6,
                        padding: '3px 10px',
                        fontFamily: 'Georgia, serif',
                        fontSize: 10,
                        cursor: a.unlocked && !a.claimed ? 'pointer' : 'not-allowed',
                        minWidth: 64,
                      }}
                    >
                      {a.claimed ? 'Claimed' : a.unlocked ? 'Claim' : 'Locked'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Panel>
    </Backdrop>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: '6px 8px', borderRadius: 8,
      background: 'rgba(0,0,0,0.05)',
      border: `1px solid ${warmTheme.border}`,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: warmTheme.textMuted }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 'bold', color: warmTheme.text }}>{value}</div>
    </div>
  );
}

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(circle at 50% 14%, rgba(201, 170, 112, 0.2) 0%, rgba(201, 170, 112, 0) 36%), linear-gradient(180deg, rgba(16, 18, 23, 0.965) 0%, rgba(19, 24, 31, 0.965) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, pointerEvents: 'auto', fontFamily: 'Georgia, serif',
    }}>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="ui-panel-intro" style={{
      background: warmTheme.surfaceStrong,
      border: `1px solid ${warmTheme.borderStrong}`,
      borderRadius: 16,
      padding: '20px 24px',
      width: 480,
      maxHeight: '88vh',
      overflowY: 'auto',
      boxShadow: warmTheme.shadow,
      position: 'relative',
      ['--ui-accent' as any]: '230, 196, 132',
      ['--ui-accent-soft' as any]: '250, 224, 184',
    } as React.CSSProperties}>{children}</div>
  );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="ui-shimmer-band" style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 14, borderBottom: `1px solid ${warmTheme.border}`, paddingBottom: 10,
      position: 'relative',
    }}>
      <div className="ui-title-glow" style={{ fontSize: 18, fontWeight: 'bold', color: warmTheme.accentDeep, letterSpacing: 2 }}>{title}</div>
      <button onClick={onClose} style={{
        background: 'transparent', border: 'none', color: warmTheme.textMuted,
        fontSize: 18, cursor: 'pointer', padding: '0 4px',
      }}>X</button>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase',
      color: warmTheme.textMuted, marginBottom: 6, fontWeight: 'bold',
    }}>{children}</div>
  );
}
