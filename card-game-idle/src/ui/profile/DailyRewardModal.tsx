import { useEffect, useMemo, useState } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { warmTheme } from '@/ui/theme';
import { evaluateDailyLogin, getMonthlyTrackDays, getMonthlyTrackKey, monthlyRewardForDay } from '@/systems/progression/dailyLogin';
import { getNextDailyResetAt, formatQuestCountdown } from '@/systems/progression/quests';
import { CardRegistry } from '@/cards/CardRegistry';
import {
  getLiveCardFaceBackgroundStyle,
  getLiveCardShimmerClassName,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
  getCardFaceMetrics,
  cardFacePalette,
} from '@/ui/cardBackgrounds';
import { getDisplayCardTypeLabel } from '@/ui/preferences';
import { getCardPreviewLines } from '@/ui/cardStatSummary';

interface Props {
  onClose: () => void;
}

export default function DailyRewardModal({ onClose }: Props) {
  const progress = useStore(selectProgress);
  const claimDailyReward = useStore(s => s.claimDailyReward);

  const evalResult = useMemo(() => evaluateDailyLogin(progress), [progress]);

  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const nextResetCountdown = formatQuestCountdown(getNextDailyResetAt(nowTick) - nowTick);

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
  const calendarFaceMetrics = getCardFaceMetrics('boardMini');

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
      <header style={{ width: 'min(1380px, 100%)', boxSizing: 'border-box', padding: '12px clamp(22px, 4vw, 56px) 8px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <div style={{ color: warmTheme.accentSoft, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase' }}>Monthly Expedition</div>
          <h1 className="ui-title-glow" style={{ margin: '3px 0 2px', fontSize: 'clamp(18px, 2.2vw, 26px)', letterSpacing: 1.4 }}>Login Calendar</h1>
          <div style={{ color: warmTheme.textMuted, fontSize: 10 }}>Every day remains available until claimed. Your progress never resets.</div>
        </div>
        <div style={{ textAlign: 'right', color: warmTheme.textMuted, fontSize: 10 }}>
          <div style={{ color: warmTheme.text, fontSize: 14, fontWeight: 'bold' }}>{monthLabel}</div>
          <div>{claimedDays.length} / {daysInMonth} claimed</div>
        </div>
      </header>

      <main style={{ width: 'min(1380px, 100%)', flex: 1, minHeight: 0, boxSizing: 'border-box', padding: '0 clamp(22px, 4vw, 56px) 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6, marginBottom: 4 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} style={{ color: warmTheme.textFaint, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', padding: '3px 8px' }}>{day}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gridAutoRows: 'minmax(112px, 1fr)', gap: 6, height: 'calc(100% - 22px)' }}>
          {Array.from({ length: firstWeekday }, (_, index) => <div key={`empty-${index}`} aria-hidden />)}
          {track.map(({ day, reward }) => {
            const claimed = claimedDays.includes(day);
            const isToday = day === today;
            const isPending = day === pendingDay;
            const icon = rewardIcon(reward);
            const cardDefinition = reward.kind === 'card' ? CardRegistry.get(reward.definitionId) : undefined;
            const cardPreviewText = cardDefinition ? getCardPreviewLines(cardDefinition, 2).join(' ') : '';
            return <article key={day} style={{ minWidth: 0, minHeight: 0, padding: '7px 8px', borderRadius: 8, border: `1px solid ${isPending ? warmTheme.accent : isToday ? warmTheme.borderStrong : warmTheme.border}`, background: claimed ? 'rgba(110, 210, 150, 0.12)' : isPending ? 'rgba(218, 155, 67, 0.18)' : 'rgba(255,255,255,0.045)', boxShadow: isPending ? `0 0 18px ${warmTheme.accent}30` : 'none', opacity: claimed && !isToday ? 0.72 : 1, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: warmTheme.textMuted, fontSize: 8, letterSpacing: 0.7 }}><span>DAY {day}</span><span>{claimed ? 'CLAIMED' : isPending ? 'READY' : isToday ? 'TODAY' : ''}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, minWidth: 0 }}>
                {icon && <img src={icon} alt="" aria-hidden="true" style={{ width: 56, height: 56, objectFit: 'contain', flexShrink: 0 }} />}
                {cardDefinition && reward.kind === 'card' && (
                  <div
                    className={getLiveCardShimmerClassName(cardDefinition, reward.holo ? 'holo' : 'normal', 'front')}
                    style={{
                      width: 58, height: 80, flexShrink: 0, borderRadius: 6,
                      position: 'relative', overflow: 'hidden',
                      display: 'flex', flexDirection: 'column',
                      backgroundColor: '#1b1220',
                      ...getLiveCardFaceBackgroundStyle(cardDefinition, reward.holo ? 'holo' : 'normal', 'front'),
                    }}
                  >
                    <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={getCardNameRibbonStyle('boardMini')}>
                        <div style={{ fontSize: calendarFaceMetrics.typeSize, color: cardFacePalette.textMuted, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>
                          {getDisplayCardTypeLabel(cardDefinition.type)}
                        </div>
                        <div style={{ fontSize: calendarFaceMetrics.nameSize, fontWeight: 'bold', color: cardFacePalette.text, lineHeight: 1.15, textAlign: 'center' }}>
                          {cardDefinition.name}
                        </div>
                      </div>
                      <div style={getCardRulesPanelStyle('boardMini')}>
                        <div style={{
                          fontSize: calendarFaceMetrics.descSize, color: cardFacePalette.textSoft, lineHeight: calendarFaceMetrics.descLineHeight,
                          textAlign: 'center', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden',
                        }}>
                          {cardPreviewText}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: warmTheme.text, fontSize: 12, lineHeight: 1.1, fontWeight: 'bold' }}>{rewardSummary(reward)}</div>
                  <div style={{ marginTop: 3, color: warmTheme.textMuted, fontSize: 8, lineHeight: 1.15 }}>{reward.kind === 'card' ? cardDefinition?.name ?? reward.definitionId : reward.kind === 'mastery_all_owned' ? 'Card-light mastery' : 'Aberrated Shards'}</div>
                </div>
              </div>
            </article>;
          })}
        </div>
      </main>

      <footer style={{ width: 'min(1380px, 100%)', boxSizing: 'border-box', padding: '8px clamp(22px, 4vw, 56px) 10px', borderTop: `1px solid ${warmTheme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', background: 'rgba(8, 7, 14, 0.72)' }}>
        <div>
          <div style={{ color: warmTheme.textMuted, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' }}>{canClaim ? `Next unclaimed reward · Day ${pendingDay}` : `Next reset in ${nextResetCountdown}`}</div>
          <div style={{ color: warmTheme.text, fontSize: 14, fontWeight: 'bold', marginTop: 2 }}>{pendingReward?.label ?? "Today's reward is already claimed."}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="menu-tactile-btn" style={{ padding: '9px 22px', background: 'transparent', border: `1px solid ${warmTheme.border}`, borderRadius: 8, color: warmTheme.textMuted, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 12 }}>Close Calendar</button>
          <button onClick={handleClaim} data-sfx="claim" className="menu-tactile-btn" style={{ padding: '9px 26px', background: warmTheme.button, border: `1px solid ${warmTheme.borderStrong}`, borderRadius: 8, color: warmTheme.text, cursor: canClaim ? 'pointer' : 'default', fontWeight: 'bold', opacity: canClaim ? 1 : 0.5, fontFamily: 'Georgia, serif', fontSize: 13, letterSpacing: 1 }} disabled={!canClaim}>{canClaim ? 'Claim Reward' : 'Claimed'}</button>
        </div>
      </footer>
    </div>
  );
}
