import { useMemo } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { warmTheme } from '@/ui/theme';
import { evaluateDailyLogin, getMonthlyTrackDays, getMonthlyTrackKey, monthlyRewardForDay } from '@/systems/progression/dailyLogin';

interface Props {
  onClose: () => void;
}

export default function DailyRewardModal({ onClose }: Props) {
  const progress = useStore(selectProgress);
  const claimDailyReward = useStore(s => s.claimDailyReward);

  const evalResult = useMemo(() => evaluateDailyLogin(progress), [progress]);

  const now = Date.now();
  const trackKey = getMonthlyTrackKey(now);
  const daysInMonth = getMonthlyTrackDays(now);
  const claimedDays = progress.dailyLogin.monthlyTrackKey === trackKey
    ? (progress.dailyLogin.monthlyClaimedDays?.length
      ? progress.dailyLogin.monthlyClaimedDays
      : evalResult.monthlyDay === undefined && progress.dailyLogin.lastClaimedDayIndex === Math.floor(now / (24 * 60 * 60 * 1000))
        ? [new Date(now).getUTCDate()]
        : [])
    : evalResult.monthlyDay === undefined && progress.dailyLogin.lastClaimedDayIndex === Math.floor(now / (24 * 60 * 60 * 1000))
      ? [new Date(now).getUTCDate()]
      : [];
  const track = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, reward: monthlyRewardForDay(i + 1, now) })), [daysInMonth, now]);

  function handleClaim() {
    const result = claimDailyReward();
    if (result) onClose();
  }

  const today = new Date(now).getUTCDate();
  const pendingDay = evalResult.monthlyDay;
  const pendingReward = evalResult.monthlyReward;
  const canClaim = evalResult.claimable && pendingReward !== undefined;
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(now));
  const firstWeekday = new Date(Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), 1)).getUTCDay();

  const rewardSummary = (reward: typeof track[number]['reward']) => {
    if (reward.kind === 'shards') return `+${reward.amount} Shards`;
    if (reward.kind === 'mastery_all_owned') return `+${reward.amount} Card-light to all owned cards`;
    return `${reward.holo ? 'Holofoil ' : ''}Base Card x${reward.amount}`;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'radial-gradient(ellipse at 50% 0%, rgba(124, 35, 56, 0.36), transparent 52%), linear-gradient(135deg, rgba(5, 8, 17, 0.985), rgba(34, 10, 25, 0.985))',
      display: 'flex', flexDirection: 'column',
      zIndex: 60, pointerEvents: 'auto', fontFamily: 'Georgia, serif', color: warmTheme.text,
      ['--ui-accent' as any]: '255, 215, 110',
      ['--ui-accent-soft' as any]: '255, 235, 175',
    } as React.CSSProperties}>
      <header style={{ width: 'min(1180px, 100%)', boxSizing: 'border-box', padding: '34px clamp(22px, 5vw, 72px) 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <div style={{ color: warmTheme.accentSoft, fontSize: 11, letterSpacing: 4, textTransform: 'uppercase' }}>Monthly Expedition</div>
          <h1 className="ui-title-glow" style={{ margin: '8px 0 5px', fontSize: 'clamp(28px, 4vw, 52px)', letterSpacing: 2 }}>Login Calendar</h1>
          <div style={{ color: warmTheme.textMuted, fontSize: 14 }}>Every day remains available until claimed. Your progress never resets.</div>
        </div>
        <div style={{ textAlign: 'right', color: warmTheme.textMuted, fontSize: 12 }}>
          <div style={{ color: warmTheme.text, fontSize: 24, fontWeight: 'bold' }}>{monthLabel}</div>
          <div>{claimedDays.length} / {daysInMonth} claimed</div>
        </div>
      </header>

      <main style={{ width: 'min(1180px, 100%)', flex: 1, minHeight: 0, overflowY: 'auto', boxSizing: 'border-box', padding: '0 clamp(22px, 5vw, 72px) 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8, marginBottom: 8 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} style={{ color: warmTheme.textFaint, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', padding: '8px 10px' }}>{day}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8 }}>
          {Array.from({ length: firstWeekday }, (_, index) => <div key={`empty-${index}`} aria-hidden />)}
          {track.map(({ day, reward }) => {
            const claimed = claimedDays.includes(day);
            const isToday = day === today;
            const isPending = day === pendingDay;
            return <article key={day} style={{ minHeight: 118, padding: '12px 12px 10px', borderRadius: 10, border: `1px solid ${isPending ? warmTheme.accent : isToday ? warmTheme.borderStrong : warmTheme.border}`, background: claimed ? 'rgba(110, 210, 150, 0.12)' : isPending ? 'rgba(218, 155, 67, 0.18)' : 'rgba(255,255,255,0.045)', boxShadow: isPending ? `0 0 22px ${warmTheme.accent}30` : 'none', opacity: claimed && !isToday ? 0.72 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: warmTheme.textMuted, fontSize: 11, letterSpacing: 1 }}><span>DAY {day}</span><span>{claimed ? 'CLAIMED' : isPending ? 'READY' : isToday ? 'TODAY' : ''}</span></div>
              <div style={{ marginTop: 16, color: warmTheme.text, fontSize: 18, fontWeight: 'bold' }}>{rewardSummary(reward)}</div>
              <div style={{ marginTop: 8, color: warmTheme.textMuted, fontSize: 11, lineHeight: 1.35 }}>{reward.kind === 'card' ? reward.definitionId : reward.kind === 'mastery_all_owned' ? 'Card-light mastery' : 'Aberrated Shards'}</div>
            </article>;
          })}
        </div>
      </main>

      <footer style={{ width: 'min(1180px, 100%)', boxSizing: 'border-box', padding: '18px clamp(22px, 5vw, 72px) 28px', borderTop: `1px solid ${warmTheme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', background: 'rgba(8, 7, 14, 0.72)' }}>
        <div>
          <div style={{ color: warmTheme.textMuted, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>{canClaim ? `Next unclaimed reward · Day ${pendingDay}` : 'Today’s reward is already claimed'}</div>
          <div style={{ color: warmTheme.text, fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>{pendingReward?.label ?? 'Come back tomorrow for the next reward.'}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="menu-tactile-btn" style={{ padding: '12px 26px', background: 'transparent', border: `1px solid ${warmTheme.border}`, borderRadius: 8, color: warmTheme.textMuted, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 13 }}>Close Calendar</button>
          <button onClick={handleClaim} data-sfx="claim" className="menu-tactile-btn" style={{ padding: '12px 32px', background: warmTheme.button, border: `1px solid ${warmTheme.borderStrong}`, borderRadius: 8, color: warmTheme.text, cursor: canClaim ? 'pointer' : 'default', fontWeight: 'bold', opacity: canClaim ? 1 : 0.5, fontFamily: 'Georgia, serif', fontSize: 14, letterSpacing: 1 }} disabled={!canClaim}>{canClaim ? 'Claim Reward' : 'Claimed'}</button>
        </div>
      </footer>
    </div>
  );
}
