import { useMemo, useState, useEffect } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { uiTypography, warmTheme, type UiPalette } from '@/ui/theme';
import {
  refreshQuestRotation,
  isQuestComplete,
  type QuestInstance,
} from '@/systems/progression/quests';
import { listEnigmaDefinitions } from '@/systems/progression/EnigmaSystem';
import { getActiveEnigmaInstance } from '@/data/enigmas/enigmaDefinitions';

type QuestVisualPalette = {
  bg: string;
  panel: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accentDaily: string;
  accentDailyDeep: string;
  accentWeekly: string;
  accentWeeklyDeep: string;
  accentGold: string;
  accentGoldGlow: string;
  success: string;
  successBg: string;
  glowLeft: string;
  glowRight: string;
  topShadow: string;
  columnHeaderBg: string;
  accentTriplet: string;
  accentSoftTriplet: string;
};

function hexToRgbTriplet(hex: string): string | null {
  const clean = hex.trim().replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `${r}, ${g}, ${b}`;
  }
  if (clean.length === 6 || clean.length === 8) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return null;
}

function rgbTripletFromColor(color: string, fallback = '58, 142, 200'): string {
  const trimmed = color.trim();
  if (trimmed.startsWith('#')) return hexToRgbTriplet(trimmed) ?? fallback;
  const rgbMatch = trimmed.match(/rgba?\(([^)]+)\)/i);
  if (!rgbMatch) return fallback;
  const parts = rgbMatch[1].split(',').map(p => Number(p.trim()));
  if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) return fallback;
  return `${Math.round(parts[0])}, ${Math.round(parts[1])}, ${Math.round(parts[2])}`;
}

function withAlpha(color: string, alpha: number, fallback = '58, 142, 200'): string {
  return `rgba(${rgbTripletFromColor(color, fallback)}, ${Math.max(0, Math.min(1, alpha))})`;
}

function buildQuestPalette(theme: UiPalette): QuestVisualPalette {
  const accentDaily = theme.accent;
  const accentWeekly = theme.accentSoft;
  const accentDeep = theme.accentDeep;
  const accentTriplet = rgbTripletFromColor(accentDaily, '58, 142, 200');
  const accentSoftTriplet = rgbTripletFromColor(accentWeekly, '90, 171, 218');
  return {
    bg: theme.appBackground,
    panel: withAlpha(theme.surfaceStrong, 0.72),
    border: theme.border,
    text: theme.text,
    textMuted: theme.textMuted,
    textFaint: theme.textFaint,
    accentDaily,
    accentDailyDeep: accentDeep,
    accentWeekly,
    accentWeeklyDeep: theme.borderStrong,
    accentGold: theme.accent,
    accentGoldGlow: withAlpha(theme.accent, 0.48),
    success: theme.success,
    successBg: withAlpha(theme.success, 0.14),
    glowLeft: `radial-gradient(ellipse, ${withAlpha(accentWeekly, 0.28)} 0%, ${withAlpha(accentDaily, 0.12)} 42%, transparent 68%)`,
    glowRight: `radial-gradient(ellipse, ${withAlpha(accentDaily, 0.2)} 0%, transparent 65%)`,
    topShadow: withAlpha(accentDaily, 0.38),
    columnHeaderBg: withAlpha(accentDeep, 0.22),
    accentTriplet,
    accentSoftTriplet,
  };
}

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
  const setActiveEnigma = useStore(s => s.setActiveEnigma);
  const sacrificeEnigmaOblivion = useStore(s => s.sacrificeEnigmaOblivion);
  const claimEnigmaReward = useStore(s => s.claimEnigmaReward);
  const { daily: dailyMs, weekly: weeklyMs } = useQuestCountdowns();
  const [activeTab, setActiveTab] = useState<'daily' | 'enigmas'>('daily');
  const C = buildQuestPalette(warmTheme);
  const enigmaDefinitions = useMemo(() => listEnigmaDefinitions(), []);
  const activeEnigma = getActiveEnigmaInstance(progress);

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
        background: C.bg,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: uiTypography.body,
      }}
    >
      {/* Atmospheric washes — Warm Hearth */}
      <div style={{ position: 'absolute', top: '-18%', left: '-8%', width: '65%', height: '80%', background: C.glowLeft, filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-15%', right: '-8%', width: '60%', height: '75%', background: C.glowRight, filter: 'blur(90px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 44%, transparent 22%, rgba(0,0,0,0.68) 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)', pointerEvents: 'none' }} />

      {/* Dual-tone top accent */}
      <div style={{
        height: 3, flexShrink: 0,
        background: `linear-gradient(90deg, transparent, ${C.accentDailyDeep}, ${C.accentDaily}, ${C.accentWeekly}, ${C.accentWeeklyDeep}, transparent)`,
        boxShadow: `0 0 24px ${C.topShadow}`,
      }} />

      <div onClick={e => e.stopPropagation()} style={{
        display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden',
        ['--ui-accent' as any]: C.accentTriplet,
        ['--ui-accent-soft' as any]: C.accentSoftTriplet,
      } as React.CSSProperties}>

        {/* ── Header ── */}
        <div className="ui-shimmer-band" style={{
          position: 'relative',
          padding: '22px 32px 18px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 10, letterSpacing: 3.5, textTransform: 'uppercase',
              color: C.accentDailyDeep, fontFamily: uiTypography.display, marginBottom: 6,
            }}>
              DAILY & WEEKLY OBJECTIVES
            </div>
            <div className="ui-title-glow" style={{
              fontSize: 32, fontWeight: 700, letterSpacing: 1.5,
              color: C.accentDaily, fontFamily: uiTypography.display,
              textShadow: `0 0 48px ${withAlpha(C.accentDaily, 0.55)}, 0 2px 8px rgba(0,0,0,0.8)`,
            }}>
              Quests
            </div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 5, letterSpacing: 0.3, lineHeight: 1.4 }}>
              Complete daily objectives for quick rewards. Weekly quests offer larger Shard bounties for sustained play.
            </div>
          </div>

          {/* Hero stats — emblem pillars */}
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 20, borderLeft: `1px solid ${C.border}`, flexShrink: 0 }}>
            <QuestStat label="Daily Complete" value={`${dailyComplete}/${view.daily.length}`} accent={C.accentDaily} sub={useOblivionForDaily ? `${dailyOblivionLeft.toLocaleString()} Oblivion left` : `${dailyShardsLeft} shards left`} />
            <div style={{ width: 1, height: 30, background: C.border, flexShrink: 0 }} />
            <QuestStat label="Weekly Complete" value={`${weeklyComplete}/${view.weekly.length}`} accent={C.accentWeekly} sub={`${weeklyShardsLeft} shards left`} />
            {(dailyOblivionLeft + dailyShardsLeft + weeklyShardsLeft) > 0 && (
              <>
                <div style={{ width: 1, height: 30, background: C.border, flexShrink: 0 }} />
                <QuestStat label="Weekly Shards" value={`+${weeklyShardsLeft.toLocaleString()}`} accent={C.accentGold} sub="shards" pulse />
              </>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              width: 42, height: 42, borderRadius: '50%', cursor: 'pointer',
              background: withAlpha(C.accentDaily, 0.08), border: `1px solid ${C.border}`,
              color: C.textMuted, fontSize: 16, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0, transition: 'all 0.18s ease', padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '12px 28px 0', flexShrink: 0 }}>
          {([
            ['daily', 'Daily'],
            ['enigmas', 'Enigmas'],
          ] as const).map(([key, label]) => {
            const isActive = activeTab === key;
            const isEnigmasTab = key === 'enigmas';
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: `1px solid ${isEnigmasTab
                    ? (isActive ? 'rgba(244, 207, 107, 0.7)' : 'rgba(244, 207, 107, 0.35)')
                    : (isActive ? withAlpha(C.accentDaily, 0.42) : C.border)}`,
                  background: isEnigmasTab
                    ? (isActive
                      ? 'linear-gradient(180deg, rgba(92, 62, 19, 0.8), rgba(54, 37, 93, 0.86))'
                      : 'linear-gradient(180deg, rgba(41, 30, 64, 0.52), rgba(22, 16, 36, 0.62))')
                    : (isActive ? withAlpha(C.accentDaily, 0.14) : withAlpha(C.text, 0.04)),
                  color: isEnigmasTab ? '#f9e4a9' : (isActive ? C.accentDaily : C.textMuted),
                  fontFamily: uiTypography.display,
                  fontSize: 11,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Body ── */}
        {activeTab !== 'enigmas' ? (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: 0 }}>

          {/* ── Daily column ── */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            borderRight: `1px solid ${C.border}`,
          }}>
            {/* Daily column header */}
            <div style={{
              padding: '16px 28px 12px',
              borderBottom: `1px solid ${C.border}`,
              flexShrink: 0,
              background: C.columnHeaderBg,
              backdropFilter: 'blur(6px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: withAlpha(C.accentDaily, 0.16),
                  border: `1px solid ${withAlpha(C.accentDaily, 0.38)}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: C.accentDaily,
                  textShadow: `0 0 16px ${withAlpha(C.accentDaily, 0.6)}`,
                }}>☀</div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 16, fontWeight: 700, color: C.accentDaily,
                    fontFamily: uiTypography.display, letterSpacing: 0.8,
                  }}>Daily Quests</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>
                    Resets each day · {useOblivionForDaily ? `${dailyOblivionTotal.toLocaleString()} Oblivion total` : `${dailyShardsTotal} shards total`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    padding: '4px 10px', borderRadius: 16,
                    background: dailyComplete === view.daily.length && view.daily.length > 0
                      ? C.successBg : withAlpha(C.accentDaily, 0.1),
                    border: `1px solid ${dailyComplete === view.daily.length && view.daily.length > 0 ? withAlpha(C.success, 0.3) : withAlpha(C.accentDaily, 0.25)}`,
                    fontSize: 11, fontWeight: 700,
                    color: dailyComplete === view.daily.length && view.daily.length > 0 ? C.success : C.accentDaily,
                    fontFamily: uiTypography.display,
                  }}>
                    {dailyComplete}/{view.daily.length}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.textFaint, fontVariantNumeric: 'tabular-nums' }}>
                    ⏱ {formatCountdown(dailyMs)}
                  </div>
                </div>
              </div>
            </div>

            {/* Daily quest list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {view.daily.length === 0 ? (
                <EmptyState message="No daily quests available yet." textFaint={C.textFaint} />
              ) : (
                view.daily.map(q => (
                  <QuestCard key={q.id} quest={q} accent={C.accentDaily} palette={C} onClaim={() => claimQuest(q.id)} />
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
              borderBottom: `1px solid ${C.border}`,
              flexShrink: 0,
              background: C.columnHeaderBg,
              backdropFilter: 'blur(6px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: withAlpha(C.accentWeekly, 0.16),
                  border: `1px solid ${withAlpha(C.accentWeekly, 0.38)}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: C.accentWeekly,
                  textShadow: `0 0 16px ${withAlpha(C.accentWeekly, 0.6)}`,
                }}>✦</div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 16, fontWeight: 700, color: C.accentWeekly,
                    fontFamily: uiTypography.display, letterSpacing: 0.8,
                  }}>Weekly Quests</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>
                    Resets each Monday · {weeklyShardsTotal} shards total
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    padding: '4px 10px', borderRadius: 16,
                    background: weeklyComplete === view.weekly.length && view.weekly.length > 0
                      ? C.successBg : withAlpha(C.accentWeekly, 0.1),
                    border: `1px solid ${weeklyComplete === view.weekly.length && view.weekly.length > 0 ? withAlpha(C.success, 0.3) : withAlpha(C.accentWeekly, 0.25)}`,
                    fontSize: 11, fontWeight: 700,
                    color: weeklyComplete === view.weekly.length && view.weekly.length > 0 ? C.success : C.accentWeekly,
                    fontFamily: uiTypography.display,
                  }}>
                    {weeklyComplete}/{view.weekly.length}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.textFaint, fontVariantNumeric: 'tabular-nums' }}>
                    ⏱ {formatCountdown(weeklyMs)}
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly quest list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {view.weekly.length === 0 ? (
                <EmptyState message="No weekly quests available yet." textFaint={C.textFaint} />
              ) : (
                view.weekly.map(q => (
                  <QuestCard key={q.id} quest={q} accent={C.accentWeekly} palette={C} onClaim={() => claimQuest(q.id)} />
                ))
              )}
            </div>
          </div>
          </div>
        ) : (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 28px 24px',
            background: 'radial-gradient(circle at 16% -12%, rgba(245, 212, 122, 0.12) 0%, rgba(245, 212, 122, 0) 42%), radial-gradient(circle at 86% 2%, rgba(170, 120, 255, 0.14) 0%, rgba(170, 120, 255, 0) 38%), linear-gradient(180deg, rgba(25, 18, 44, 0.94) 0%, rgba(16, 12, 30, 0.96) 100%)',
            borderTop: '1px solid rgba(244, 207, 107, 0.2)',
          }}>
            <EnigmasPanel
              progress={progress}
              enigmaDefinitions={enigmaDefinitions}
              activeEnigmaId={activeEnigma?.id ?? progress.enigmas.activeEnigmaId}
              onActivate={setActiveEnigma}
              onSacrificeOblivion={sacrificeEnigmaOblivion}
              onClaimReward={claimEnigmaReward}
            />
          </div>
        )}
      </div>

      {/* Bottom accent */}
      <div style={{
        height: 2, flexShrink: 0,
        background: `linear-gradient(90deg, transparent, ${C.border}, transparent)`,
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
      boxShadow: pulse ? `0 0 24px ${withAlpha(accent, 0.2)}` : 'none',
    }}>
      <div style={{
        fontSize: 8, letterSpacing: 3, textTransform: 'uppercase',
        color: withAlpha(accent, 0.6), fontWeight: 400, whiteSpace: 'nowrap',
      }}>{label}</div>
      <div style={{
        fontSize: 22, fontWeight: 600, letterSpacing: 0.5, color: accent,
        fontVariantNumeric: 'tabular-nums',
        textShadow: `0 0 20px ${withAlpha(accent, 0.36)}`,
      }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: withAlpha(accent, 0.46) }}>{sub}</div>}
    </div>
  );
}

function EmptyState({ message, textFaint }: { message: string; textFaint: string }) {
  return (
    <div style={{
      padding: 40, textAlign: 'center', color: textFaint,
      fontSize: 13, fontStyle: 'italic', fontFamily: uiTypography.body,
    }}>
      {message}
    </div>
  );
}

function QuestCard({ quest, accent, palette, onClaim }: {
  quest: QuestInstance;
  accent: string;
  palette: QuestVisualPalette;
  onClaim: () => void;
}) {
  const complete = isQuestComplete(quest);
  const pct = Math.min(100, Math.round((quest.progress / Math.max(1, quest.goal)) * 100));

  const statusBg = quest.claimed
    ? withAlpha(palette.text, 0.02)
    : complete
      ? withAlpha(accent, 0.08)
      : palette.panel;
  const statusBorder = quest.claimed
    ? withAlpha(palette.success, 0.2)
    : complete
      ? withAlpha(accent, 0.34)
      : withAlpha(palette.text, 0.08);

  return (
    <div style={{
      background: statusBg,
      border: `1px solid ${statusBorder}`,
      borderRadius: 12,
      overflow: 'hidden',
      opacity: quest.claimed ? 0.65 : 1,
      boxShadow: complete && !quest.claimed ? `0 2px 16px ${withAlpha(accent, 0.16)}` : 'none',
      transition: 'all 0.2s',
    }}>
      {/* Left accent stripe */}
      <div style={{ display: 'flex', gap: 0 }}>
        <div style={{
          width: 3, flexShrink: 0, alignSelf: 'stretch',
          background: quest.claimed
            ? palette.success
            : complete
              ? accent
              : withAlpha(palette.text, 0.08),
          boxShadow: complete && !quest.claimed ? `0 0 12px ${withAlpha(accent, 0.4)}` : 'none',
        }} />
        <div style={{ flex: 1, padding: '14px 16px' }}>
          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: complete ? palette.text : palette.textMuted,
              lineHeight: 1.4, flex: 1, paddingRight: 14,
              fontFamily: uiTypography.display,
            }}>
              {quest.text}
            </div>
            <div style={{
              fontSize: 12, fontWeight: 700, color: palette.accentGold,
              background: withAlpha(palette.accentGold, 0.12), padding: '3px 10px',
              borderRadius: 8, border: `1px solid ${withAlpha(palette.accentGold, 0.28)}`,
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
              background: withAlpha(palette.text, 0.06),
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: complete
                  ? `linear-gradient(90deg, ${withAlpha(accent, 0.8)}, ${accent})`
                  : `linear-gradient(90deg, ${withAlpha(accent, 0.55)}, ${withAlpha(accent, 0.7)})`,
                borderRadius: 2,
                transition: 'width 0.5s ease',
                boxShadow: complete ? `0 0 8px ${withAlpha(accent, 0.52)}` : 'none',
              }} />
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: 4, fontSize: 10, color: palette.textFaint,
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
                  ? withAlpha(palette.text, 0.04)
                  : complete
                    ? `linear-gradient(135deg, ${withAlpha(palette.accentGold, 0.8)}, ${palette.accentGold})`
                    : withAlpha(palette.text, 0.04),
                color: quest.claimed
                  ? palette.textFaint
                  : complete
                  ? palette.accentDailyDeep
                    : palette.textFaint,
                border: `1px solid ${quest.claimed ? withAlpha(palette.text, 0.08) : complete ? withAlpha(palette.accentGold, 0.52) : withAlpha(palette.text, 0.08)}`,
                borderRadius: 8, padding: '6px 18px',
                fontFamily: uiTypography.display, fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                cursor: complete && !quest.claimed ? 'pointer' : 'default',
                boxShadow: complete && !quest.claimed ? `0 4px 14px ${palette.accentGoldGlow}` : 'none',
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

function EnigmasPanel({ progress, enigmaDefinitions, activeEnigmaId, onActivate, onSacrificeOblivion, onClaimReward }: {
  progress: ReturnType<typeof useStore.getState>['progress'];
  enigmaDefinitions: ReturnType<typeof listEnigmaDefinitions>;
  activeEnigmaId: string | null;
  onActivate: (enigmaId: string) => void;
  onSacrificeOblivion: (enigmaId: string) => boolean;
  onClaimReward: (enigmaId: string) => boolean;
}) {
  const [expandedEnigmaId, setExpandedEnigmaId] = useState<string | null>(null);
  const enigmaAccent = '#f4cf6b';
  const enigmaAccentSoft = '#ffe9b3';
  const enigmaText = '#f8f0de';
  const enigmaTextMuted = '#d5c3eb';

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {enigmaDefinitions.map(def => {
        const instance = progress.enigmas.instances[def.id];
        const status = instance?.status ?? 'locked';
        const isActive = activeEnigmaId === def.id;
        const isLocked = status === 'locked';
        const isExpanded = expandedEnigmaId === def.id;
        const currentStep = instance ? def.steps[Math.min(instance.currentStepIndex, def.steps.length - 1)] : def.steps[0];
        const canSacrifice = def.id === 'neutral-mystery' && (instance?.currentStepIndex ?? 0) === 1;
        const canClaim = def.id === 'neutral-mystery' && (instance?.currentStepIndex ?? 0) >= 4 && status !== 'completed';
        return (
          <div
            key={def.id}
            onClick={() => {
              onActivate(def.id);
              setExpandedEnigmaId(prev => prev === def.id ? null : def.id);
            }}
            style={{
              minHeight: isExpanded && !isLocked ? 210 : 84,
              borderRadius: 16,
              border: `1px solid ${isActive ? enigmaAccent : isLocked ? withAlpha(enigmaAccent, 0.55) : withAlpha(enigmaAccent, 0.72)}`,
              background: isLocked
                ? `linear-gradient(180deg, rgba(70, 50, 8, 0.76), rgba(20, 16, 28, 0.94)), radial-gradient(circle at 18% 12%, rgba(255, 224, 149, 0.16) 0%, rgba(255, 224, 149, 0) 34%), radial-gradient(circle at 86% 10%, rgba(255, 246, 220, 0.14) 0%, rgba(255, 246, 220, 0) 28%)`
                : `linear-gradient(180deg, rgba(58, 38, 88, 0.74), rgba(20, 14, 36, 0.94))`,
              boxShadow: isActive
                ? `0 0 24px rgba(244, 207, 107, 0.34), 0 0 0 1px rgba(255, 240, 185, 0.18) inset`
                : isLocked
                  ? '0 0 0 1px rgba(244, 207, 107, 0.08) inset, 0 0 24px rgba(244, 207, 107, 0.08)'
                  : `0 0 0 1px rgba(244, 207, 107, 0.16) inset, 0 0 20px rgba(244, 207, 107, 0.12)`,
              padding: isLocked ? 14 : 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              cursor: 'pointer',
              transform: isLocked ? 'scale(0.98)' : 'scale(1)',
              transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease, min-height 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: uiTypography.display, fontSize: isLocked ? 18 : 20, color: isLocked ? '#fff0bf' : '#fff0d1', textShadow: '0 0 14px rgba(244, 207, 107, 0.22)' }}>{def.title}</div>
                <div style={{ fontSize: 12, color: isLocked ? '#f4d78e' : enigmaTextMuted, marginTop: 3, lineHeight: 1.45 }}>
                  {isLocked ? def.hintText : currentStep?.description ?? def.hintText}
                </div>
              </div>
              <div style={{
                padding: '4px 10px',
                borderRadius: 999,
                border: `1px solid ${isActive ? enigmaAccent : isLocked ? 'rgba(244, 207, 107, 0.26)' : 'rgba(244, 207, 107, 0.42)'}`,
                color: isActive ? enigmaAccentSoft : isLocked ? '#f4d78e' : '#ffefb7',
                fontFamily: uiTypography.display,
                fontSize: 11,
                letterSpacing: 1,
                textTransform: 'uppercase',
                background: isLocked ? 'rgba(64, 44, 6, 0.24)' : 'transparent',
              }}>
                {status === 'completed' ? 'Completed' : isActive ? 'Active' : 'Inactive'} {isExpanded ? '▾' : '▸'}
              </div>
            </div>
            {isExpanded && !isLocked && (
              <div style={{ display: 'grid', gap: 6, marginTop: 4 }}>
                {def.steps.map((step, index) => {
                  const complete = !!instance?.stepsComplete[index];
                  const current = instance?.currentStepIndex === index;
                  return (
                    <div key={step.title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: complete ? enigmaTextMuted : enigmaText }}>
                      <div style={{ width: 20, flexShrink: 0, color: current ? enigmaAccent : enigmaTextMuted, fontWeight: 700 }}>{index + 1}.</div>
                      <div>
                        <div style={{ fontFamily: uiTypography.display, fontSize: 13 }}>{step.title}</div>
                        <div style={{ fontSize: 11, color: enigmaTextMuted, marginTop: 2 }}>{step.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {isExpanded && !isLocked && (canSacrifice || canClaim) && (
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                {canSacrifice && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onSacrificeOblivion(def.id);
                    }}
                    disabled={(progress.lifetimeOblivion ?? 0) < 50_000}
                    style={{
                      borderRadius: 8,
                      border: `1px solid ${withAlpha(enigmaAccent, 0.5)}`,
                      background: withAlpha(enigmaAccent, 0.16),
                      color: enigmaText,
                      fontFamily: uiTypography.display,
                      fontSize: 11,
                      letterSpacing: 0.8,
                      padding: '6px 12px',
                      cursor: (progress.lifetimeOblivion ?? 0) >= 50_000 ? 'pointer' : 'default',
                    }}
                  >
                    Sacrifice 50,000 Oblivion
                  </button>
                )}
                {canClaim && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onClaimReward(def.id);
                    }}
                    style={{
                      borderRadius: 8,
                      border: `1px solid ${withAlpha(enigmaAccent, 0.5)}`,
                      background: `linear-gradient(135deg, ${withAlpha(enigmaAccent, 0.85)}, ${withAlpha(enigmaAccent, 0.56)})`,
                      color: '#201308',
                      fontFamily: uiTypography.display,
                      fontSize: 11,
                      letterSpacing: 0.8,
                      padding: '6px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    Claim Reward
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


