/**
 * BattlegroundRewards — modal shown when the Battleground match ends.
 * Displays the result, earned shards, and milestone info.
 */
import { useEffect } from 'react';
import { useStore, selectBattleground, selectProgress } from '@/state/store';
import { useBattlegroundStore } from '@/state/battlegroundStore';
import { warmTheme, uiTypography } from '@/ui/theme';

export default function BattlegroundRewards() {
  const battleground = useStore(selectBattleground);
  const progress = useStore(selectProgress);
  const dismissBattleground = useStore(s => s.dismissBattleground);

  // Persist CPU match results to Supabase (fire-and-forget).
  const persistCpuResult = useBattlegroundStore(s => s.persistCpuResult);
  useEffect(() => {
    if (battleground.mode !== 'finished') return;
    if (battleground.kind !== 'cpu') return;
    if (battleground.result === null) return;
    void persistCpuResult(battleground.myScore, battleground.result);
  // Only run once when the result screen first appears.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (battleground.mode !== 'finished') return null;

  const result = battleground.result;
  const my = battleground.myScore;
  const opp = battleground.opponentScore;
  const stats = progress.battlegroundStats;

  const isWin  = result === 'win';
  const isDraw = result === 'draw';

  const accentColor = isWin ? '#5de88a' : isDraw ? '#daa058' : '#e85d5d';
  const glowColor   = isWin ? 'rgba(93,232,138,0.18)' : isDraw ? 'rgba(218,160,88,0.18)' : 'rgba(232,93,93,0.18)';

  const resultLabel = isWin ? 'Victory' : isDraw ? 'Draw' : 'Defeat';
  const resultSub   = isWin ? 'You outscored your opponent.' : isDraw ? 'An even contest.' : 'Your opponent edged you out.';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Battleground result"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(ellipse at 50% 40%, ${glowColor} 0%, rgba(8,3,3,0.97) 65%)`,
        zIndex: 50,
      }}
    >
      <div style={{
        background: 'linear-gradient(160deg, rgba(22,8,8,0.99) 0%, rgba(10,4,4,0.99) 100%)',
        border: `1px solid ${accentColor}44`,
        borderRadius: 22,
        padding: '44px 44px 36px',
        width: 'min(480px, 88vw)',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        alignItems: 'center',
        textAlign: 'center',
        boxShadow: `0 0 60px ${glowColor}, 0 0 140px rgba(0,0,0,0.5)`,
      }}>

        {/* Result header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            fontSize: '3rem',
            fontWeight: 900,
            color: accentColor,
            fontFamily: uiTypography.display,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            textShadow: `0 0 40px ${accentColor}60`,
            lineHeight: 1,
          }}>
            {resultLabel}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(240,220,210,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {resultSub}
          </div>
        </div>

        {/* Score comparison */}
        <div style={{
          display: 'flex',
          gap: 0,
          justifyContent: 'center',
          alignItems: 'stretch',
          width: '100%',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(232,80,64,0.18)',
          borderRadius: 14,
          overflow: 'hidden',
        }}>
          <div style={{ flex: 1, padding: '18px 0', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
            <div style={{ fontSize: '0.65rem', letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(240,220,210,0.55)' }}>You</div>
            <div style={{
              fontSize: '2rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums',
              color: isWin ? accentColor : 'rgba(240,220,210,0.65)',
              textShadow: isWin ? `0 0 24px ${accentColor}50` : 'none',
            }}>
              {my.toLocaleString()}
            </div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch' }} />
          <div style={{
            width: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.25)',
            fontFamily: uiTypography.display,
          }}>VS</div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch' }} />
          <div style={{ flex: 1, padding: '18px 0', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
            <div style={{ fontSize: '0.65rem', letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(240,220,210,0.55)' }}>Opponent</div>
            <div style={{
              fontSize: '2rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums',
              color: !isWin && !isDraw ? accentColor : 'rgba(240,220,210,0.65)',
              textShadow: !isWin && !isDraw ? `0 0 24px ${accentColor}50` : 'none',
            }}>
              {opp.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Season stats */}
        {stats && (
          <div style={{
            background: 'rgba(232,80,64,0.06)',
            border: '1px solid rgba(232,80,64,0.20)',
            borderRadius: 12,
            padding: '14px 20px',
            fontSize: '0.8rem',
            color: 'rgba(240,220,210,0.55)',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            <div style={{ marginBottom: 10, color: 'rgba(240,100,80,0.70)', fontWeight: 600, fontSize: '0.65rem', letterSpacing: 2, textTransform: 'uppercase' }}>
              Season Record
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Win / Loss</span>
              <span>
                <strong style={{ color: '#5de88a' }}>{stats.wins}</strong>
                {' / '}
                <strong style={{ color: '#e85d5d' }}>{stats.losses}</strong>
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span>Best score</span>
              <strong style={{ color: '#daa058' }}>{stats.bestScore.toLocaleString()}</strong>
            </div>
          </div>
        )}

        <p style={{ fontSize: '0.72rem', color: 'rgba(240,220,210,0.32)', margin: 0, letterSpacing: '0.03em' }}>
          Rewards have been added to your account.
        </p>

        <button
          onClick={dismissBattleground}
          style={{
          background: 'linear-gradient(135deg, rgba(200,60,40,0.24) 0%, rgba(160,30,20,0.16) 100%)',
          color: '#f0e8e0',
          border: '1px solid rgba(232,80,64,0.50)',
            borderRadius: 11,
            padding: '13px 48px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontFamily: uiTypography.display,
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(220,70,50,0.38) 0%, rgba(190,40,30,0.26) 100%)';
            e.currentTarget.style.borderColor = 'rgba(240,100,80,0.75)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(200,60,40,0.24) 0%, rgba(160,30,20,0.16) 100%)';
            e.currentTarget.style.borderColor = 'rgba(232,80,64,0.50)';
          }}
        >
          Return to Menu
        </button>
      </div>
    </div>
  );
}
