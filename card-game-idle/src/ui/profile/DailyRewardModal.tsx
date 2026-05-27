import { useMemo } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { warmTheme } from '@/ui/theme';
import { evaluateDailyLogin, dailyRewardForStreak } from '@/systems/progression/dailyLogin';

interface Props {
  onClose: () => void;
}

export default function DailyRewardModal({ onClose }: Props) {
  const progress = useStore(selectProgress);
  const claimDailyReward = useStore(s => s.claimDailyReward);

  const evalResult = useMemo(() => evaluateDailyLogin(progress), [progress]);

  // Render seven-day reward track so the player sees what is coming up.
  const track = useMemo(
    () => Array.from({ length: 7 }, (_, i) => ({
      day: i + 1,
      reward: dailyRewardForStreak(i + 1),
    })),
    [],
  );

  function handleClaim() {
    const result = claimDailyReward();
    if (result) onClose();
  }

  const pendingDay = evalResult.pendingStreak;
  const pendingShards = evalResult.pendingReward.shards;

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
          fontSize: 18, fontWeight: 'bold', color: warmTheme.accentDeep,
          letterSpacing: 2, textAlign: 'center', marginBottom: 6,
        }}>
          Daily Login Reward
        </div>
        <div style={{
          fontSize: 12, color: warmTheme.textMuted, textAlign: 'center',
          marginBottom: 18, fontStyle: 'italic',
        }}>
          {evalResult.previousStreak > 0 && pendingDay > evalResult.previousStreak
            ? `Streak continues — Day ${pendingDay}`
            : `Welcome back — Day ${pendingDay} of a new streak`}
        </div>

        {/* Reward track */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6,
          marginBottom: 20,
        }}>
          {track.map(({ day, reward }) => {
            const claimed = day < pendingDay;
            const isToday = day === pendingDay;
            return (
              <div key={day} style={{
                padding: '8px 4px', textAlign: 'center',
                borderRadius: 8,
                background: isToday
                  ? warmTheme.accentSoft
                  : claimed ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.03)',
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
                  color: isToday ? warmTheme.accentDeep : warmTheme.text,
                  marginTop: 2,
                }}>{reward.shards}</div>
              </div>
            );
          })}
        </div>

        {/* Pending reward callout */}
        <div style={{
          padding: '14px 16px', marginBottom: 18,
          background: 'rgba(0,0,0,0.05)',
          border: `1px solid ${warmTheme.border}`,
          borderRadius: 10, textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: warmTheme.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>
            Today's Reward
          </div>
          <div style={{
            fontSize: 26, fontWeight: 'bold',
            color: warmTheme.accentDeep, marginTop: 4,
          }}>
            ✦ {pendingShards} Aberrated Shards
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
              color: warmTheme.accentDeep,
              cursor: 'pointer', fontWeight: 'bold',
              fontFamily: 'Georgia, serif', fontSize: 14, letterSpacing: 1,
            }}
          >Claim Reward</button>
        </div>
      </div>
    </div>
  );
}
