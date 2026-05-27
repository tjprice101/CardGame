import { useMemo } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { subMenuWarm } from '@/ui/theme';
import { listAchievements, summarizeAchievements } from '@/systems/progression/achievements';

interface Props {
  onClose: () => void;
}

const GROUP_LABEL: Record<string, string> = {
  milestone: 'Milestones',
  boss: "Eternity's Wake",
  infinite: 'Infinite Cards',
  set: 'Set Completion',
};

const GROUP_ICON: Record<string, string> = {
  milestone: '◈',
  boss: '☽',
  infinite: '∞',
  set: '✦',
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
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 60% 0%, rgba(180,130,60,0.18) 0%, transparent 50%), linear-gradient(180deg, rgba(14,16,20,0.96) 0%, rgba(18,22,28,0.96) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, pointerEvents: 'auto', fontFamily: 'Georgia, serif',
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        width: 620, maxHeight: '88vh',
        background: 'linear-gradient(160deg, rgba(255,252,244,0.99) 0%, rgba(250,244,232,0.99) 100%)',
        border: `1px solid ${subMenuWarm.borderStrong}`,
        borderRadius: 18,
        boxShadow: `${subMenuWarm.shadow}, inset 0 1px 0 rgba(255,240,200,0.6)`,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Top accent band */}
        <div style={{
          height: 4, flexShrink: 0,
          background: `linear-gradient(90deg, ${subMenuWarm.accentDeep}, ${subMenuWarm.accent}, ${subMenuWarm.accentDeep})`,
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 24px 14px', borderBottom: `1px solid ${subMenuWarm.border}`,
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: subMenuWarm.accentDeep, letterSpacing: 2 }}>Achievements</div>
            <div style={{ fontSize: 11, color: subMenuWarm.textMuted, marginTop: 2 }}>
              {summary.unlocked}/{summary.total} unlocked
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%',
            border: `1px solid ${subMenuWarm.border}`,
            background: subMenuWarm.surfaceMuted,
            color: subMenuWarm.textMuted, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Stats ribbon */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
          padding: '14px 24px',
          borderBottom: `1px solid ${subMenuWarm.border}`,
          flexShrink: 0,
        }}>
          <StatCard icon="🏆" label="Unlocked" value={`${summary.unlocked}`} sub={`/ ${summary.total}`} />
          <StatCard icon="✓" label="Claimed" value={`${summary.claimed}`} sub="rewards" />
          <StatCard icon="◈" label="Shards Pending" value={summary.unclaimedShards.toLocaleString()} sub="unclaimed" highlight={summary.unclaimedShards > 0} />
        </div>

        {/* Scrollable achievement list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '18px 24px' }}>
          {Object.entries(grouped).map(([group, items]) => {
            const unlockedCount = items.filter(a => a.unlocked).length;
            return (
              <div key={group} style={{ marginBottom: 22 }}>
                {/* Group header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
                  paddingBottom: 8, borderBottom: `1px solid ${subMenuWarm.border}`,
                }}>
                  <span style={{
                    fontSize: 14, color: subMenuWarm.accent,
                    background: 'rgba(200,128,58,0.1)', padding: '2px 7px',
                    borderRadius: 6, border: `1px solid rgba(200,128,58,0.2)`,
                  }}>
                    {GROUP_ICON[group] ?? '◇'}
                  </span>
                  <span style={{
                    fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
                    fontWeight: 700, color: subMenuWarm.accentDeep,
                  }}>
                    {GROUP_LABEL[group] ?? group}
                  </span>
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 999, marginLeft: 2,
                    background: unlockedCount === items.length && items.length > 0
                      ? 'rgba(79,138,71,0.12)' : 'rgba(200,128,58,0.10)',
                    color: unlockedCount === items.length && items.length > 0
                      ? subMenuWarm.success : subMenuWarm.accent,
                    border: `1px solid ${unlockedCount === items.length && items.length > 0 ? 'rgba(79,138,71,0.25)' : subMenuWarm.border}`,
                    fontWeight: 600,
                  }}>
                    {unlockedCount}/{items.length}
                  </span>
                </div>

                {/* Achievement rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map(a => (
                    <AchievementRow key={a.id} achievement={a} onClaim={() => claimAchievement(a.id)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, highlight }: { icon: string; label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 12,
      background: highlight ? 'rgba(200,128,58,0.08)' : 'rgba(0,0,0,0.04)',
      border: `1px solid ${highlight ? 'rgba(200,128,58,0.35)' : subMenuWarm.border}`,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: highlight ? 'rgba(200,128,58,0.14)' : 'rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: subMenuWarm.textMuted, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 'bold', color: highlight ? subMenuWarm.accent : subMenuWarm.accentDeep, lineHeight: 1.2 }}>
          {value} <span style={{ fontSize: 10, color: subMenuWarm.textFaint, fontWeight: 400 }}>{sub}</span>
        </div>
      </div>
    </div>
  );
}

type AchievementEntry = ReturnType<typeof listAchievements>[number];
function AchievementRow({ achievement: a, onClaim }: { achievement: AchievementEntry; onClaim: () => void }) {
  const stateBorder = a.claimed ? 'rgba(79,138,71,0.25)' : a.unlocked ? 'rgba(200,128,58,0.45)' : subMenuWarm.border;
  const stateBg = a.claimed ? 'rgba(0,0,0,0.03)' : a.unlocked ? 'rgba(255,248,235,0.7)' : 'rgba(0,0,0,0.02)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px',
      background: stateBg,
      border: `1px solid ${stateBorder}`,
      borderRadius: 10,
      opacity: !a.unlocked ? 0.5 : a.claimed ? 0.65 : 1,
      boxShadow: a.unlocked && !a.claimed ? '0 2px 8px rgba(200,128,58,0.12)' : 'none',
    }}>
      {/* State icon */}
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: a.claimed ? 'rgba(79,138,71,0.12)' : a.unlocked ? 'rgba(200,128,58,0.12)' : 'rgba(0,0,0,0.08)',
        border: `1px solid ${a.claimed ? 'rgba(79,138,71,0.2)' : a.unlocked ? 'rgba(200,128,58,0.2)' : 'rgba(0,0,0,0.1)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, color: a.claimed ? subMenuWarm.success : a.unlocked ? subMenuWarm.accent : subMenuWarm.textFaint,
      }}>
        {a.claimed ? '✓' : a.unlocked ? '★' : '🔒'}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 'bold', color: subMenuWarm.text,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {a.text}
        </div>
        <div style={{ fontSize: 10, color: subMenuWarm.textMuted, marginTop: 2 }}>
          {a.description}
        </div>
      </div>

      {/* Shard reward */}
      <div style={{
        fontSize: 11, fontWeight: 700, color: subMenuWarm.accentSoft,
        background: 'rgba(200,128,58,0.10)', padding: '2px 8px',
        borderRadius: 6, border: `1px solid rgba(200,128,58,0.22)`,
        flexShrink: 0,
      }}>
        +{a.shardReward}
      </div>

      {/* Claim button */}
      <button
        onClick={onClaim}
        disabled={!a.unlocked || a.claimed}
        data-sfx="claim"
        style={{
          background: a.unlocked && !a.claimed ? subMenuWarm.button : 'transparent',
          color: a.unlocked && !a.claimed ? '#fff' : subMenuWarm.textFaint,
          border: `1px solid ${a.unlocked && !a.claimed ? subMenuWarm.accentSoft : subMenuWarm.border}`,
          borderRadius: 8, padding: '4px 12px',
          fontFamily: 'Georgia, serif', fontSize: 10, fontWeight: 600,
          cursor: a.unlocked && !a.claimed ? 'pointer' : 'default',
          flexShrink: 0, minWidth: 60, textAlign: 'center',
        }}
      >
        {a.claimed ? 'Claimed ✓' : a.unlocked ? 'Claim' : 'Locked'}
      </button>
    </div>
  );
}

