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
  const claimedDays = progress.dailyLogin.monthlyTrackKey === trackKey ? (progress.dailyLogin.monthlyClaimedDays ?? []) : [];
  const track = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, reward: monthlyRewardForDay(i + 1, now) })), [daysInMonth, now]);

  function handleClaim() {
    const result = claimDailyReward();
    if (result) onClose();
  }

  const pendingDay = evalResult.monthlyDay ?? new Date(now).getUTCDate();
  const pendingReward = evalResult.monthlyReward;
  const canClaim = evalResult.claimable && pendingReward !== undefined;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(8, 6, 4, 0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 60, pointerEvents: 'auto', fontFamily: 'Georgia, serif',
      ['--ui-accent' as any]: '255, 215, 110',
      ['--ui-accent-soft' as any]: '255, 235, 175',
    } as React.CSSProperties}>
      <div className="ui-panel-intro" style={{
        background: warmTheme.surfaceStrong,
        border: `1px solid ${warmTheme.borderStrong}`,
        borderRadius: 16,
        padding: '24px 28px',
        width: 420,
        boxShadow: warmTheme.shadow,
        position: 'relative',
      }}>
        {/* Header */}
        <div className="ui-title-glow" style={{
          fontSize: 18, fontWeight: 'bold', color: warmTheme.text,
          letterSpacing: 2, textAlign: 'center', marginBottom: 6,
        }}>
          Monthly Login Calendar
        </div>
        <div style={{
          fontSize: 12, color: warmTheme.textMuted, textAlign: 'center',
          marginBottom: 18, fontStyle: 'italic',
        }}>
          A persistent reward track. Missed days remain available and never reset your progress.
        </div>

        {/* Reward track */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6,
          marginBottom: 20,
        }}>
          {track.map(({ day, reward }) => {
            const claimed = claimedDays.includes(day);
            const isToday = day === pendingDay;
            return (
              <div key={day} style={{
                padding: '8px 4px', textAlign: 'center',
                borderRadius: 8,
                background: isToday
                  ? warmTheme.surfaceMuted
                  : claimed ? warmTheme.surface : warmTheme.surfaceStrong,
                border: isToday
                  ? `2px solid ${warmTheme.accent}`
                  : `1px solid ${warmTheme.border}`,
                opacity: claimed ? 0.6 : 1,
              }}>
                <div style={{
                  fontSize: 9, letterSpacing: 1, textTransform: 'uppercase',
                  color: warmTheme.textMuted,
                }}>D{day}</div>
                <div style={{
                  fontSize: 13, fontWeight: 'bold',
                  color: warmTheme.text,
                  marginTop: 2,
                }}>{reward.kind === 'shards' ? `✦${reward.amount}` : reward.kind === 'card' ? `${reward.holo ? '◆' : '▣'} ×${reward.amount}` : '✚ ALL'}</div>
                <div style={{ fontSize: 8, color: warmTheme.textMuted, marginTop: 3, lineHeight: 1.1 }}>{reward.kind === 'mastery_all_owned' ? 'Mastery' : reward.kind === 'card' ? (reward.holo ? 'Holo card' : 'Card') : 'Shards'}</div>
              </div>
            );
          })}
        </div>

        {/* Pending reward callout */}
        <div style={{
          padding: '14px 16px', marginBottom: 18,
          background: warmTheme.surface,
          border: `1px solid ${warmTheme.border}`,
          borderRadius: 10, textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: warmTheme.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>
            Next Unclaimed Reward · Day {pendingDay}
          </div>
          <div style={{
            fontSize: 26, fontWeight: 'bold',
            color: warmTheme.text, marginTop: 4,
          }}>
            {pendingReward?.label ?? 'Already claimed for this month'}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            className="menu-tactile-btn"
            style={{
              flex: 1, padding: '10px 0',
              background: 'transparent',
              border: `1px solid ${warmTheme.border}`,
              borderRadius: 8,
              color: warmTheme.textMuted,
              cursor: 'pointer',
              fontFamily: 'Georgia, serif', fontSize: 13,
            }}
          >Later</button>
          <button
            onClick={handleClaim}
            data-sfx="claim"
            className="menu-tactile-btn"
            style={{
              flex: 2, padding: '10px 0',
              background: warmTheme.button,
              border: `1px solid ${warmTheme.borderStrong}`,
              borderRadius: 8,
              color: warmTheme.text,
              cursor: canClaim ? 'pointer' : 'default', fontWeight: 'bold',
              opacity: canClaim ? 1 : 0.55,
              fontFamily: 'Georgia, serif', fontSize: 14, letterSpacing: 1,
            }}
            disabled={!canClaim}
          >{canClaim ? 'Claim Reward' : 'Already Claimed'}</button>
        </div>
      </div>
    </div>
  );
}
