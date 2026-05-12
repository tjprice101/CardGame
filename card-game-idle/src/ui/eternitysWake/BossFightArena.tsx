import { useEffect, useRef } from 'react';
import { useStore, selectBossFight, selectTurn } from '@/state/store';
import { BOSS_DEFINITIONS, BOSS_FIGHT_ROUND_SECONDS } from '@/data/bosses/bossDefinitions';
import { warmTheme } from '@/ui/theme';

export default function BossFightArena() {
  const bossFight = useStore(selectBossFight);
  const turn = useStore(selectTurn);
  const tickBossTimer = useStore(s => s.tickBossTimer);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (bossFight.mode !== 'active') {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    timerRef.current = setInterval(() => { tickBossTimer(1); }, 1000);
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [bossFight.mode, tickBossTimer]);

  if (bossFight.mode !== 'active') return null;

  const boss = BOSS_DEFINITIONS.find(b => b.id === bossFight.activeBossId);
  if (!boss) return null;

  const hpPercent = Math.max(0, bossFight.bossCurrentHp / bossFight.bossMaxHp);
  const timePercent = bossFight.fightTimeRemaining / BOSS_FIGHT_ROUND_SECONDS;
  const timeColor = timePercent > 0.5 ? '#4dff91' : timePercent > 0.25 ? '#ffcc00' : '#ff4d4d';
  const remainingSeconds = Math.max(0, Math.ceil(bossFight.fightTimeRemaining));
  const timerMinutes = Math.floor(remainingSeconds / 60);
  const timerSeconds = String(remainingSeconds % 60).padStart(2, '0');

  const hpColor = hpPercent > 0.5 ? '#ff6b6b' : hpPercent > 0.25 ? '#ff9944' : '#ff2222';

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 25, pointerEvents: 'none',
    }}>
      {/* Boss HP bar panel */}
      <div style={{
        margin: '8px auto', width: 'calc(100% - 200px)', maxWidth: 700,
        background: warmTheme.surfaceStrong, border: `1px solid ${warmTheme.borderStrong}`,
        borderRadius: '0 0 16px 16px', padding: '10px 16px',
        display: 'flex', flexDirection: 'column', gap: 6,
        pointerEvents: 'auto',
        boxShadow: warmTheme.shadow,
      }}>
        {/* Boss name + timer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 'bold', color: warmTheme.danger, fontFamily: 'Georgia, serif', letterSpacing: 1 }}>
            {boss.name}
          </div>
          <div style={{
            fontSize: 13, color: timeColor, fontFamily: 'Georgia, serif', fontWeight: 'bold',
          }}>
            {timerMinutes}:{timerSeconds}
          </div>
        </div>

        {/* HP bar */}
        <div style={{ position: 'relative', height: 14, background: 'rgba(184,92,79,0.12)', borderRadius: 7, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, height: '100%',
            width: `${hpPercent * 100}%`,
            background: hpColor,
            borderRadius: 7,
            transition: 'width 0.3s ease, background 0.3s ease',
          }} />
        </div>

        {/* HP numbers + damage */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'Georgia, serif' }}>
          <span style={{ color: warmTheme.textSoft }}>
            {bossFight.bossCurrentHp.toLocaleString()} / {bossFight.bossMaxHp.toLocaleString()} HP
          </span>
          <span style={{ color: warmTheme.textSoft }}>
            Damage this turn: <span style={{ color: '#ffaa55' }}>{turn.oblivionEarnedThisTurn.toLocaleString()}</span>
          </span>
          <span style={{ color: warmTheme.textMuted }}>
            Total dealt: {bossFight.damageDealtThisFight.toLocaleString()}
          </span>
        </div>

        {/* Timer bar */}
        <div style={{ position: 'relative', height: 4, background: 'rgba(77,50,27,0.12)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, height: '100%',
            width: `${timePercent * 100}%`, background: timeColor,
            borderRadius: 2, transition: 'width 1s linear, background 0.5s ease',
          }} />
        </div>
      </div>
    </div>
  );
}
