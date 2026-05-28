import { useMemo, useState, useEffect } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { uiTypography } from '@/ui/theme';
import {
  refreshQuestRotation,
  isQuestComplete,
  type QuestInstance,
} from '@/systems/progression/quests';

// ── Design palette — Warm Hearth (steel blue) ──────────────────────────────
const P = {
  bg: 'linear-gradient(158deg, #040a15 0%, #060e1c 50%, #030810 100%)',
  glow: 'radial-gradient(ellipse 50% 40% at 50% 0%, rgba(78,158,220,0.22) 0%, transparent 55%)',
  panel: 'rgba(6,14,30,0.72)',
  border: 'rgba(110,160,215,0.32)',
  borderStrong: 'rgba(72,128,190,0.56)',
  borderWeekly: 'rgba(72,128,190,0.48)',
  accentDaily: '#72caf5',
  accentDailyDeep: '#1e5890',
  accentWeekly: '#96daff',
  accentWeeklyDeep: '#255fa8',
  accentGold: '#72caf5',
  accentGoldGlow: 'rgba(88,180,235,0.48)',
  success: '#7de88a',
  successBg: 'rgba(90,175,100,0.14)',
  text: '#f0f6ff',
  textMuted: 'rgba(205,228,255,0.82)',
  textFaint: 'rgba(165,205,245,0.58)',
};

// ── Countdown helpers ─────────────────────────────────────────────────────────
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
  const hms = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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
  const dailyOblivionTotal = view.daily.reduce((s, q) => s + (q.oblivionReward ?? 0), 0);
  const dailyShardsTotal = view.daily.reduce((s, q) => s + q.shardReward, 0);
  const weeklyShardsTotal = view.weekly.reduce((s, q) => s + q.shardReward, 0);
  const dailyOblivionLeft = view.daily.filter(q => !q.claimed).reduce((s, q) => s + (q.oblivionReward ?? 0), 0);
  const dailyShardsLeft = view.daily.filter(q => !q.claimed).reduce((s, q) => s + q.shardReward, 0);
  const weeklyShardsLeft = view.weekly.filter(q => !q.claimed).reduce((s, q) => s + q.shardReward, 0);
  const useOblivionForDaily = dailyOblivionTotal > 0;

  return (
    <div
      onClick={onClose}
      className="ui-panel-intro"
      style={{
        position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'auto',
        background: P.bg,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: uiTypography.body,
      }}
    >
      {/* Atmospheric washes — Warm Hearth */}
      <div style={{ position: 'absolute', top: '-18%', left: '-8%', width: '65%', height: '80%', background: 'radial-gradient(ellipse, rgba(78,165,225,0.28) 0%, rgba(30,88,170,0.12) 42%, transparent 68%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-15%', right: '-8%', width: '60%', height: '75%', background: 'radial-gradient(ellipse, rgba(22,65,200,0.20) 0%, transparent 65%)', filter: 'blur(90px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 44%, transparent 22%, rgba(0,0,0,0.68) 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)', pointerEvents: 'none' }} />

      {/* Dual-tone top accent */}
      <div style={{
        height: 3, flexShrink: 0,
        background: `linear-gradient(90deg, transparent, ${P.accentDailyDeep}, ${P.accentDaily}, ${P.accentWeekly}, ${P.accentWeeklyDeep}, transparent)`,
        boxShadow: `0 0 24px rgba(58,142,200,0.38)`,
      }} />

      <div onClick={e => e.stopPropagation()} style={{
        display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden',
        ['--ui-accent' as any]: '58, 142, 200',
        ['--ui-accent-soft' as any]: '90, 171, 218',
      } as React.CSSProperties}>

        {/* ── Header ── */}
        <div className="ui-shimmer-band" style={{
          position: 'relative',
          padding: '22px 32px 18px',
          borderBottom: `1px solid ${P.border}`,
          display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 10, letterSpacing: 3.5, textTransform: 'uppercase',
              color: P.accentDailyDeep, fontFamily: uiTypography.display, marginBottom: 6,
            }}>
              DAILY & WEEKLY OBJECTIVES
            </div>
            <div className="ui-title-glow" style={{
              fontSize: 32, fontWeight: 700, letterSpacing: 1.5,
              color: P.accentDaily, fontFamily: uiTypography.display,
              textShadow: `0 0 48px rgba(88,188,245,0.55), 0 2px 8px rgba(0,0,0,0.8)`,
            }}>
              Quests
            </div>
            <div style={{ fontSize: 13, color: P.textMuted, marginTop: 5, letterSpacing: 0.3, lineHeight: 1.4 }}>
              Complete daily objectives for quick rewards. Weekly quests offer larger Shard bounties for sustained play.
            </div>
          </div>

          {/* Hero stats — emblem pillars */}
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 20, borderLeft: `1px solid ${P.border}`, flexShrink: 0 }}>
            <QuestStat label="Daily Complete" value={`${dailyComplete}/${view.daily.length}`} accent={P.accentDaily} sub={useOblivionForDaily ? `${dailyOblivionLeft.toLocaleString()} Oblivion left` : `${dailyShardsLeft} shards left`} />
            <div style={{ width: 1, height: 30, background: P.border, flexShrink: 0 }} />
            <QuestStat label="Weekly Complete" value={`${weeklyComplete}/${view.weekly.length}`} accent={P.accentWeekly} sub={`${weeklyShardsLeft} shards left`} />
            {(dailyOblivionLeft + dailyShardsLeft + weeklyShardsLeft) > 0 && (
              <>
                <div style={{ width: 1, height: 30, background: P.border, flexShrink: 0 }} />
                <QuestStat label="Weekly Shards" value={`+${weeklyShardsLeft.toLocaleString()}`} accent={P.accentGold} sub="shards" pulse />
              </>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              width: 42, height: 42, borderRadius: '50%', cursor: 'pointer',
              background: 'rgba(58,142,200,0.08)', border: `1px solid ${P.border}`,
              color: P.textMuted, fontSize: 16, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0, transition: 'all 0.18s ease', padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Body: two panels side by side ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: 0 }}>

          {/* ── Daily column ── */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            borderRight: `1px solid ${P.border}`,
          }}>
            {/* Daily column header */}
            <div style={{
              padding: '16px 28px 12px',
              borderBottom: `1px solid ${P.border}`,
              flexShrink: 0,
              background: 'rgba(10,30,80,0.12)',
              backdropFilter: 'blur(6px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(58,142,200,0.16)',
                  border: `1px solid rgba(58,142,200,0.38)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: P.accentDaily,
                  textShadow: `0 0 16px rgba(58,142,200,0.60)`,
                }}>☀</div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 16, fontWeight: 700, color: P.accentDaily,
                    fontFamily: uiTypography.display, letterSpacing: 0.8,
                  }}>Daily Quests</div>
                  <div style={{ fontSize: 11, color: P.textMuted }}>
                    Resets each day · {useOblivionForDaily ? `${dailyOblivionTotal.toLocaleString()} Oblivion total` : `${dailyShardsTotal} shards total`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    padding: '4px 10px', borderRadius: 16,
                    background: dailyComplete === view.daily.length && view.daily.length > 0
                      ? P.successBg : 'rgba(58,142,200,0.10)',
                    border: `1px solid ${dailyComplete === view.daily.length && view.daily.length > 0 ? 'rgba(110,207,124,0.30)' : 'rgba(58,142,200,0.25)'}`,
                    fontSize: 11, fontWeight: 700,
                    color: dailyComplete === view.daily.length && view.daily.length > 0 ? P.success : P.accentDaily,
                    fontFamily: uiTypography.display,
                  }}>
                    {dailyComplete}/{view.daily.length}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: P.textFaint, fontVariantNumeric: 'tabular-nums' }}>
                    ⏱ {formatCountdown(dailyMs)}
                  </div>
                </div>
              </div>
            </div>

            {/* Daily quest list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {view.daily.length === 0 ? (
                <EmptyState message="No daily quests available yet." />
              ) : (
                view.daily.map(q => (
                  <QuestCard key={q.id} quest={q} accent={P.accentDaily} onClaim={() => claimQuest(q.id)} />
                ))
              )}
            </div>
          </div>

          {/* ── Weekly column ── */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {/* Weekly column header */}
            <div style={{
              padding: '16px 28px 12px',
              borderBottom: `1px solid ${P.border}`,
              flexShrink: 0,
              background: 'rgba(10,30,80,0.12)',
              backdropFilter: 'blur(6px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(90,170,220,0.16)',
                  border: `1px solid rgba(90,170,220,0.38)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: P.accentWeekly,
                  textShadow: `0 0 16px rgba(90,170,220,0.60)`,
                }}>✦</div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 16, fontWeight: 700, color: P.accentWeekly,
                    fontFamily: uiTypography.display, letterSpacing: 0.8,
                  }}>Weekly Quests</div>
                  <div style={{ fontSize: 11, color: P.textMuted }}>
                    Resets each Monday · {weeklyShardsTotal} shards total
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    padding: '4px 10px', borderRadius: 16,
                    background: weeklyComplete === view.weekly.length && view.weekly.length > 0
                      ? P.successBg : 'rgba(90,170,220,0.10)',
                    border: `1px solid ${weeklyComplete === view.weekly.length && view.weekly.length > 0 ? 'rgba(110,207,124,0.30)' : 'rgba(90,170,220,0.25)'}`,
                    fontSize: 11, fontWeight: 700,
                    color: weeklyComplete === view.weekly.length && view.weekly.length > 0 ? P.success : P.accentWeekly,
                    fontFamily: uiTypography.display,
                  }}>
                    {weeklyComplete}/{view.weekly.length}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: P.textFaint, fontVariantNumeric: 'tabular-nums' }}>
                    ⏱ {formatCountdown(weeklyMs)}
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly quest list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {view.weekly.length === 0 ? (
                <EmptyState message="No weekly quests available yet." />
              ) : (
                view.weekly.map(q => (
                  <QuestCard key={q.id} quest={q} accent={P.accentWeekly} onClaim={() => claimQuest(q.id)} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <div style={{
        height: 2, flexShrink: 0,
        background: `linear-gradient(90deg, transparent, ${P.border}, transparent)`,
      }} />
    </div>
  );
}

function QuestStat({ label, value, accent, sub, pulse }: {
  label: string; value: string; accent: string; sub?: string; pulse?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '6px 20px', gap: 4,
      boxShadow: pulse ? `0 0 24px ${accent}33` : 'none',
    }}>
      <div style={{
        fontSize: 8, letterSpacing: 3, textTransform: 'uppercase',
        color: `${accent}99`, fontWeight: 400, whiteSpace: 'nowrap',
      }}>{label}</div>
      <div style={{
        fontSize: 22, fontWeight: 600, letterSpacing: 0.5, color: accent,
        fontVariantNumeric: 'tabular-nums',
        textShadow: `0 0 20px ${accent}55`,
      }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: `${accent}77` }}>{sub}</div>}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      padding: 40, textAlign: 'center', color: P.textFaint,
      fontSize: 13, fontStyle: 'italic', fontFamily: uiTypography.body,
    }}>
      {message}
    </div>
  );
}

function QuestCard({ quest, accent, onClaim }: { quest: QuestInstance; accent: string; onClaim: () => void }) {
  const complete = isQuestComplete(quest);
  const pct = Math.min(100, Math.round((quest.progress / Math.max(1, quest.goal)) * 100));

  const statusBg = quest.claimed
    ? 'rgba(255,255,255,0.02)'
    : complete
      ? `${accent}0a`
      : P.panel;
  const statusBorder = quest.claimed
    ? 'rgba(110,207,124,0.20)'
    : complete
      ? `${accent}55`
      : 'rgba(255,255,255,0.08)';

  return (
    <div style={{
      background: statusBg,
      border: `1px solid ${statusBorder}`,
      borderRadius: 12,
      overflow: 'hidden',
      opacity: quest.claimed ? 0.65 : 1,
      boxShadow: complete && !quest.claimed ? `0 2px 16px ${accent}22` : 'none',
      transition: 'all 0.2s',
    }}>
      {/* Left accent stripe */}
      <div style={{ display: 'flex', gap: 0 }}>
        <div style={{
          width: 3, flexShrink: 0, alignSelf: 'stretch',
          background: quest.claimed
            ? P.success
            : complete
              ? accent
              : 'rgba(255,255,255,0.08)',
          boxShadow: complete && !quest.claimed ? `0 0 12px ${accent}66` : 'none',
        }} />
        <div style={{ flex: 1, padding: '14px 16px' }}>
          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: complete ? P.text : P.textMuted,
              lineHeight: 1.4, flex: 1, paddingRight: 14,
              fontFamily: uiTypography.display,
            }}>
              {quest.text}
            </div>
            <div style={{
              fontSize: 12, fontWeight: 700, color: P.accentDaily,
              background: 'rgba(58,142,200,0.12)', padding: '3px 10px',
              borderRadius: 8, border: `1px solid rgba(58,142,200,0.28)`,
              flexShrink: 0, fontFamily: uiTypography.display,
            }}>
              {(quest.oblivionReward ?? 0) > 0
                ? `+${quest.oblivionReward!.toLocaleString()} Oblivion`
                : `+${quest.shardReward} ◈`}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 10 }}>
            <div style={{
              height: 4, borderRadius: 2,
              background: 'rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: complete
                  ? `linear-gradient(90deg, ${accent}cc, ${accent})`
                  : `linear-gradient(90deg, ${accent}88, ${accent}aa)`,
                borderRadius: 2,
                transition: 'width 0.5s ease',
                boxShadow: complete ? `0 0 8px ${accent}88` : 'none',
              }} />
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: 4, fontSize: 10, color: P.textFaint,
            }}>
              <span>{quest.progress.toLocaleString()} / {quest.goal.toLocaleString()}</span>
              <span>{pct}%</span>
            </div>
          </div>

          {/* Claim row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onClaim}
              disabled={!complete || quest.claimed}
              data-sfx="claim"
              style={{
                background: quest.claimed
                  ? 'rgba(255,255,255,0.04)'
                  : complete
                    ? `linear-gradient(135deg, ${P.accentGold}cc, ${P.accentGold})`
                    : 'rgba(255,255,255,0.04)',
                color: quest.claimed
                  ? P.textFaint
                  : complete
                  ? '#0c1e34'
                    : P.textFaint,
                border: `1px solid ${quest.claimed ? 'rgba(255,255,255,0.08)' : complete ? `${P.accentGold}88` : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 8, padding: '6px 18px',
                fontFamily: uiTypography.display, fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                cursor: complete && !quest.claimed ? 'pointer' : 'default',
                boxShadow: complete && !quest.claimed ? `0 4px 14px ${P.accentGoldGlow}` : 'none',
                transition: 'all 0.15s',
              }}
            >
              {quest.claimed ? '✓ Collected' : complete ? '✦ Claim Reward' : 'In Progress'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


