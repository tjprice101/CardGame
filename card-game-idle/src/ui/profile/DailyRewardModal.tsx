import { useMemo } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { warmTheme } from '@/ui/theme';
import { evaluateDailyLogin, getMonthlyTrackDays, getMonthlyTrackKey, monthlyRewardForDay } from '@/systems/progression/dailyLogin';
import { CardRegistry } from '@/cards/CardRegistry';
import { getLiveCardFaceBackgroundStyle } from '@/ui/cardBackgrounds';

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

  const rewardIcon = (reward: typeof track[number]['reward']) => {
    if (reward.kind === 'shards') return `${import.meta.env.BASE_URL}assets/resource-icons/aberrated-shards.png`;
    if (reward.kind === 'mastery_all_owned') return `${import.meta.env.BASE_URL}assets/resource-icons/card-light-shards.png`;
    return null;
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
      <header style={{ width: 'min(1380px, 100%)', boxSizing: 'border-box', padding: '22px clamp(22px, 4vw, 56px) 12px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <div style={{ color: warmTheme.accentSoft, fontSize: 11, letterSpacing: 4, textTransform: 'uppercase' }}>Monthly Expedition</div>
          <h1 className="ui-title-glow" style={{ margin: '5px 0 3px', fontSize: 'clamp(26px, 3.5vw, 44px)', letterSpacing: 2 }}>Login Calendar</h1>
          <div style={{ color: warmTheme.textMuted, fontSize: 12 }}>Every day remains available until claimed. Your progress never resets.</div>
        </div>
        <div style={{ textAlign: 'right', color: warmTheme.textMuted, fontSize: 12 }}>
          <div style={{ color: warmTheme.text, fontSize: 20, fontWeight: 'bold' }}>{monthLabel}</div>
          <div>{claimedDays.length} / {daysInMonth} claimed</div>
        </div>
      </header>

      <main style={{ width: 'min(1380px, 100%)', flex: 1, minHeight: 0, boxSizing: 'border-box', padding: '0 clamp(22px, 4vw, 56px) 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6, marginBottom: 4 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} style={{ color: warmTheme.textFaint, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', padding: '3px 8px' }}>{day}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gridAutoRows: 'minmax(72px, 1fr)', gap: 6, height: 'calc(100% - 22px)' }}>
          {Array.from({ length: firstWeekday }, (_, index) => <div key={`empty-${index}`} aria-hidden />)}
          {track.map(({ day, reward }) => {
            const claimed = claimedDays.includes(day);
            const isToday = day === today;
            const isPending = day === pendingDay;
            const icon = rewardIcon(reward);
            const cardDefinition = reward.kind === 'card' ? CardRegistry.get(reward.definitionId) : undefined;
            return <article key={day} style={{ minWidth: 0, minHeight: 0, padding: '7px 8px', borderRadius: 8, border: `1px solid ${isPending ? warmTheme.accent : isToday ? warmTheme.borderStrong : warmTheme.border}`, background: claimed ? 'rgba(110, 210, 150, 0.12)' : isPending ? 'rgba(218, 155, 67, 0.18)' : 'rgba(255,255,255,0.045)', boxShadow: isPending ? `0 0 18px ${warmTheme.accent}30` : 'none', opacity: claimed && !isToday ? 0.72 : 1, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: warmTheme.textMuted, fontSize: 8, letterSpacing: 0.7 }}><span>DAY {day}</span><span>{claimed ? 'CLAIMED' : isPending ? 'READY' : isToday ? 'TODAY' : ''}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6, minWidth: 0 }}>
                {icon && <img src={icon} alt="" aria-hidden="true" style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }} />}
                {cardDefinition && reward.kind === 'card' && <div aria-label={cardDefinition.name} title={cardDefinition.name} style={{ width: 25, height: 35, flexShrink: 0, borderRadius: 3, backgroundColor: '#1b1220', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: 'cover', ...getLiveCardFaceBackgroundStyle(cardDefinition, reward.holo ? 'holo' : 'normal', 'front') }} />}
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: warmTheme.text, fontSize: 12, lineHeight: 1.1, fontWeight: 'bold' }}>{rewardSummary(reward)}</div>
                  <div style={{ marginTop: 3, color: warmTheme.textMuted, fontSize: 8, lineHeight: 1.15 }}>{reward.kind === 'card' ? cardDefinition?.name ?? reward.definitionId : reward.kind === 'mastery_all_owned' ? 'Card-light mastery' : 'Aberrated Shards'}</div>
                </div>
              </div>
            </article>;
          })}
        </div>
      </main>

      <footer style={{ width: 'min(1380px, 100%)', boxSizing: 'border-box', padding: '10px clamp(22px, 4vw, 56px) 14px', borderTop: `1px solid ${warmTheme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', background: 'rgba(8, 7, 14, 0.72)' }}>
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
