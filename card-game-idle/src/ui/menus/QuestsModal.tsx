import { useMemo, useState, useEffect } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { subMenuWarm } from '@/ui/theme';
import {
  refreshQuestRotation,
  isQuestComplete,
  type QuestInstance,
} from '@/systems/progression/quests';

// ── Countdown helpers ────────────────────────────────────────────────────
function msUntilDailyReset(): number {
  const now = Date.now();
  const d = new Date(now);
  let next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 1, 0, 0, 0);
  if (next <= now) next += 86_400_000;
  return next - now;
}
function msUntilWeeklyReset(): number {
  const now = Date.now();
  const d = new Date(now);
  let candidate = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 1, 0, 0, 0);
  if (candidate <= now) candidate += 86_400_000;
  while (new Date(candidate).getUTCDay() !== 1) candidate += 86_400_000;
  return candidate - now;
}
function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const hms = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return d > 0 ? `${d}d ${hms}` : hms;
}
function useQuestCountdowns() {
  const [daily, setDaily] = useState(() => msUntilDailyReset());
  const [weekly, setWeekly] = useState(() => msUntilWeeklyReset());
  useEffect(() => {
    const id = setInterval(() => { setDaily(msUntilDailyReset()); setWeekly(msUntilWeeklyReset()); }, 1000);
    return () => clearInterval(id);
  }, []);
  return { daily, weekly };
}

interface Props { onClose: () => void; }

export default function QuestsModal({ onClose }: Props) {
  const progress = useStore(selectProgress);
  const claimQuest = useStore(s => s.claimQuest);
  const { daily: dailyMs, weekly: weeklyMs } = useQuestCountdowns();

  const view = useMemo(() => {
    const snapshot = {
      daily: progress.quests.daily.map(q => ({ ...q })),
      weekly: progress.quests.weekly.map(q => ({ ...q })),
      lastDailyRollDay: progress.quests.lastDailyRollDay,
      lastWeeklyRollWeek: progress.quests.lastWeeklyRollWeek,
    };
    return refreshQuestRotation(snapshot, Date.now());
  }, [progress.quests]);

  const dailyComplete = view.daily.filter(q => isQuestComplete(q)).length;
  const weeklyComplete = view.weekly.filter(q => isQuestComplete(q)).length;
  const dailyShards = view.daily.filter(q => !q.claimed).reduce((s, q) => s + q.shardReward, 0);
  const weeklyShards = view.weekly.filter(q => !q.claimed).reduce((s, q) => s + q.shardReward, 0);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 40% 0%, rgba(180,130,60,0.18) 0%, transparent 50%), linear-gradient(180deg, rgba(14,16,20,0.96) 0%, rgba(18,22,28,0.96) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, pointerEvents: 'auto', fontFamily: 'Georgia, serif',
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        width: 560, maxHeight: '86vh',
        background: `linear-gradient(160deg, rgba(255,252,244,0.99) 0%, rgba(250,244,232,0.99) 100%)`,
        border: `1px solid ${subMenuWarm.borderStrong}`,
        borderRadius: 18,
        boxShadow: `${subMenuWarm.shadow}, inset 0 1px 0 rgba(255,240,200,0.6)`,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Decorative top band */}
        <div style={{
          height: 4,
          background: `linear-gradient(90deg, ${subMenuWarm.accentDeep}, ${subMenuWarm.accent}, ${subMenuWarm.accentDeep})`,
          flexShrink: 0,
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 24px 14px',
          borderBottom: `1px solid ${subMenuWarm.border}`,
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: subMenuWarm.accentDeep, letterSpacing: 2, fontFamily: 'Georgia, serif' }}>
              Quests
            </div>
            <div style={{ fontSize: 11, color: subMenuWarm.textMuted, letterSpacing: 0.5, marginTop: 2 }}>
              {dailyShards + weeklyShards > 0 ? `${(dailyShards + weeklyShards).toLocaleString()} shards available` : 'All rewards collected'}
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

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
          {/* Daily */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
                  fontWeight: 700, color: subMenuWarm.accentDeep,
                }}>Daily</div>
                <div style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 999,
                  background: dailyComplete === view.daily.length && view.daily.length > 0
                    ? 'rgba(79,138,71,0.15)' : `rgba(200,128,58,0.12)`,
                  color: dailyComplete === view.daily.length && view.daily.length > 0
                    ? subMenuWarm.success : subMenuWarm.accent,
                  border: `1px solid ${dailyComplete === view.daily.length && view.daily.length > 0 ? 'rgba(79,138,71,0.3)' : subMenuWarm.border}`,
                  fontWeight: 600,
                }}>
                  {dailyComplete}/{view.daily.length}
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 10, color: subMenuWarm.textFaint,
              }}>
                <span>⏱</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCountdown(dailyMs)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {view.daily.map(q => (
                <QuestCard key={q.id} quest={q} onClaim={() => claimQuest(q.id)} />
              ))}
              {view.daily.length === 0 && (
                <div style={{ fontSize: 12, color: subMenuWarm.textMuted, fontStyle: 'italic', padding: '12px 0', textAlign: 'center' }}>
                  No daily quests available.
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{
            borderTop: `1px solid ${subMenuWarm.border}`,
            marginBottom: 24,
            position: 'relative',
          }}>
            <span style={{
              position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(252,248,240,0.99)', padding: '0 10px',
              fontSize: 9, letterSpacing: 1.5, color: subMenuWarm.textFaint, textTransform: 'uppercase',
            }}>•</span>
          </div>

          {/* Weekly */}
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
                  fontWeight: 700, color: subMenuWarm.accentDeep,
                }}>Weekly</div>
                <div style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 999,
                  background: weeklyComplete === view.weekly.length && view.weekly.length > 0
                    ? 'rgba(79,138,71,0.15)' : 'rgba(200,128,58,0.12)',
                  color: weeklyComplete === view.weekly.length && view.weekly.length > 0
                    ? subMenuWarm.success : subMenuWarm.accent,
                  border: `1px solid ${weeklyComplete === view.weekly.length && view.weekly.length > 0 ? 'rgba(79,138,71,0.3)' : subMenuWarm.border}`,
                  fontWeight: 600,
                }}>
                  {weeklyComplete}/{view.weekly.length}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: subMenuWarm.textFaint }}>
                <span>⏱</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCountdown(weeklyMs)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {view.weekly.map(q => (
                <QuestCard key={q.id} quest={q} onClaim={() => claimQuest(q.id)} />
              ))}
              {view.weekly.length === 0 && (
                <div style={{ fontSize: 12, color: subMenuWarm.textMuted, fontStyle: 'italic', padding: '12px 0', textAlign: 'center' }}>
                  No weekly quests available.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestCard({ quest, onClaim }: { quest: QuestInstance; onClaim: () => void }) {
  const complete = isQuestComplete(quest);
  const pct = Math.min(100, Math.round((quest.progress / Math.max(1, quest.goal)) * 100));

  const statusColor = quest.claimed ? 'rgba(79,138,71,0.7)' : complete ? subMenuWarm.accent : 'rgba(150,130,100,0.4)';

  return (
    <div style={{
      display: 'flex', gap: 0,
      background: quest.claimed ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.55)',
      border: `1px solid ${quest.claimed ? 'rgba(150,130,100,0.2)' : complete ? `rgba(200,128,58,0.45)` : subMenuWarm.border}`,
      borderRadius: 12,
      overflow: 'hidden',
      opacity: quest.claimed ? 0.6 : 1,
      boxShadow: complete && !quest.claimed ? '0 2px 12px rgba(200,128,58,0.15)' : 'none',
      transition: 'box-shadow 0.2s, border-color 0.2s',
    }}>
      {/* Left status stripe */}
      <div style={{ width: 4, background: statusColor, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 'bold', color: subMenuWarm.text, lineHeight: 1.3, flex: 1, paddingRight: 12 }}>
            {quest.text}
          </div>
          <div style={{
            fontSize: 12, fontWeight: 700, color: subMenuWarm.accentSoft,
            background: 'rgba(200,128,58,0.10)', padding: '2px 8px',
            borderRadius: 6, flexShrink: 0,
            border: `1px solid rgba(200,128,58,0.22)`,
          }}>
            +{quest.shardReward}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ position: 'relative', height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 8 }}>
          <div style={{
            position: 'absolute', inset: '0 auto 0 0', width: `${pct}%`,
            background: complete
              ? `linear-gradient(90deg, ${subMenuWarm.accentSoft}, ${subMenuWarm.accent})`
              : `linear-gradient(90deg, rgba(180,130,60,0.7), rgba(200,128,58,0.9))`,
            borderRadius: 3,
            transition: 'width 300ms ease',
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: subMenuWarm.textMuted }}>
            {Math.min(quest.progress, quest.goal).toLocaleString()} / {quest.goal.toLocaleString()}
            <span style={{ marginLeft: 6, color: subMenuWarm.textFaint }}>({pct}%)</span>
          </div>
          <button
            onClick={onClaim}
            disabled={!complete || quest.claimed}
            style={{
              background: quest.claimed
                ? 'transparent'
                : complete
                  ? subMenuWarm.button
                  : 'rgba(0,0,0,0.05)',
              color: quest.claimed
                ? subMenuWarm.textFaint
                : complete
                  ? '#fff'
                  : subMenuWarm.textMuted,
              border: `1px solid ${quest.claimed ? 'transparent' : complete ? subMenuWarm.accentSoft : subMenuWarm.border}`,
              borderRadius: 8,
              padding: '4px 14px',
              fontFamily: 'Georgia, serif',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.5,
              cursor: complete && !quest.claimed ? 'pointer' : 'default',
              transition: 'all 0.15s',
            }}
          >
            {quest.claimed ? 'Claimed ✓' : complete ? 'Claim' : 'In Progress'}
          </button>
        </div>
      </div>
    </div>
  );
}


