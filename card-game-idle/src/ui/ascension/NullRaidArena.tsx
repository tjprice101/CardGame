import { useEffect } from 'react';
import { useStore, selectBossFight } from '@/state/store';
import { useCoopRaidStore } from '@/state/coopRaidStore';
import { NULL_RAID_DEFINITIONS, NULL_RAID_BOSS_MAP } from '@/data/ascension/nullRaidDefinitions';
import { uiTypography } from '@/ui/theme';
import { getNullRaidBossArtUrl } from '@/ui/ascension/nullRaidArt';

const G = {
  bg: 'rgba(4,2,16,0.97)',
  accent: '#b890ff',
  accentSoft: '#d4bcff',
  electric: '#60d0ff',
  text: '#ece6ff',
  textMuted: 'rgba(220,210,255,0.75)',
  border: 'rgba(150,100,255,0.35)',
  borderStrong: 'rgba(185,135,255,0.58)',
  cinzel: uiTypography.display,
  entropyColor: '#c0a8ff',
  shardColor: '#80ffcc',
};

export default function NullRaidArena() {
  const bossFight = useStore(selectBossFight);
  const activeCoopSessionId = useCoopRaidStore(s => s.activeSessionId);
  const activeCoopRaidId = useCoopRaidStore(s => s.activeRaidId);
  const broadcastProgress = useCoopRaidStore(s => s.broadcastProgress);
  const opponentProfile = useCoopRaidStore(s => s.opponentProfile);
  const opponentProgress = useCoopRaidStore(s => s.opponentProgress);

  if (bossFight.kind !== 'null_raid' || bossFight.mode !== 'active') return null;

  const raidDef = NULL_RAID_DEFINITIONS.find(r => r.id === bossFight.nullRaidId);
  const encounterBossIds = bossFight.nullRaidEncounterBossIds ?? [];
  const encounterIndex = bossFight.nullRaidEncounterIndex ?? 0;
  const totalEncounters = encounterBossIds.length;
  const currentBossId = bossFight.activeBossId;
  const currentBoss = currentBossId ? NULL_RAID_BOSS_MAP.get(currentBossId) : undefined;
  const currentBossArtUrl = getNullRaidBossArtUrl(currentBossId);

  const bossCurrentHp = bossFight.bossCurrentHp;
  const bossMaxHp = bossFight.bossMaxHp;
  const hpFrac = bossMaxHp > 0 ? Math.max(0, Math.min(1, bossCurrentHp / bossMaxHp)) : 0;

  const timeRemaining = bossFight.fightTimeRemaining ?? 0;
  const timeCritical = timeRemaining < 30;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;

  const accEntropy = bossFight.nullRaidAccumulatedEntropy ?? 0;
  const accShards = bossFight.nullRaidAccumulatedShards ?? 0;

  useEffect(() => {
    if (!activeCoopSessionId) return;
    if (!activeCoopRaidId || activeCoopRaidId !== bossFight.nullRaidId) return;
    const encounterIndex = bossFight.nullRaidEncounterIndex ?? 0;
    const completedEncounters = encounterIndex;
    const totalDamage = bossFight.damageDealtThisFight ?? 0;
    broadcastProgress(encounterIndex, totalDamage, completedEncounters);
  }, [
    activeCoopSessionId,
    activeCoopRaidId,
    bossFight.nullRaidId,
    bossFight.nullRaidEncounterIndex,
    bossFight.damageDealtThisFight,
    broadcastProgress,
  ]);

  const hpBarColor = hpFrac > 0.5 ? '#ff4060' : hpFrac > 0.25 ? '#ff8030' : '#ff2040';

  return (
    <div
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        zIndex: 28,
        pointerEvents: 'none',
        padding: '12px 18px',
        background: G.bg,
        borderBottom: `1px solid ${G.borderStrong}`,
        boxShadow: `0 4px 32px rgba(140,80,255,0.40), 0 2px 8px rgba(0,0,0,0.70)`,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        fontFamily: uiTypography.body,
      }}
    >
      {/* Top row: raid name + encounter counter + timer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        {/* Raid identity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 180 }}>
          <div style={{ fontSize: 7, letterSpacing: 4, textTransform: 'uppercase', color: `${G.accentSoft}99`, fontFamily: G.cinzel }}>
            Null Raid
          </div>
          <div style={{ fontSize: 15, letterSpacing: 2, color: G.text, fontFamily: G.cinzel }}>
            {raidDef?.name ?? bossFight.nullRaidId ?? '—'}
          </div>
        </div>

        {/* Encounter counter */}
        <div style={{
          padding: '6px 14px', borderRadius: 7,
          border: `1px solid ${G.border}`,
          background: 'rgba(60,30,180,0.18)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
        }}>
          <div style={{ fontSize: 7, letterSpacing: 3, textTransform: 'uppercase', color: G.textMuted }}>
            Encounter
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, color: G.electric, fontVariantNumeric: 'tabular-nums' }}>
            {encounterIndex + 1} <span style={{ fontSize: 11, color: G.textMuted }}>/ {totalEncounters}</span>
          </div>
        </div>

        {/* Time remaining */}
        <div style={{
          padding: '6px 18px', borderRadius: 7,
          border: `1px solid ${timeCritical ? 'rgba(255,60,60,0.45)' : G.border}`,
          background: timeCritical ? 'rgba(120,20,20,0.35)' : 'rgba(60,30,180,0.18)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
          transition: 'all 0.3s ease',
        }}>
          <div style={{ fontSize: 7, letterSpacing: 3, textTransform: 'uppercase', color: timeCritical ? 'rgba(255,120,120,0.70)' : G.textMuted }}>
            Time
          </div>
          <div style={{
            fontSize: 22, fontWeight: 700, letterSpacing: 2, fontVariantNumeric: 'tabular-nums',
            color: timeCritical ? '#ff4040' : G.electric,
            textShadow: timeCritical ? '0 0 20px rgba(255,60,60,0.60)' : `0 0 16px rgba(64,192,255,0.50)`,
          }}>
            {timeStr}
          </div>
        </div>

        {/* Entropic Energy banked */}
        <div style={{
          padding: '6px 14px', borderRadius: 7,
          border: `1px solid rgba(140,100,255,0.25)`,
          background: 'rgba(60,30,180,0.12)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
        }}>
          <div style={{ fontSize: 7, letterSpacing: 3, textTransform: 'uppercase', color: `${G.entropyColor}80` }}>
            Entropic Energy Banked
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: G.entropyColor, fontVariantNumeric: 'tabular-nums' }}>
            {accEntropy.toLocaleString()}
          </div>
        </div>

        {/* Shards banked */}
        <div style={{
          padding: '6px 14px', borderRadius: 7,
          border: `1px solid rgba(100,255,200,0.18)`,
          background: 'rgba(30,60,50,0.15)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
        }}>
          <div style={{ fontSize: 7, letterSpacing: 3, textTransform: 'uppercase', color: `${G.shardColor}80` }}>
            Shards Banked
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: G.shardColor, fontVariantNumeric: 'tabular-nums' }}>
            {accShards.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Boss HP bar row */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
        {currentBossArtUrl && (
          <div
            style={{
              width: 148,
              height: 88,
              borderRadius: 8,
              border: `1px solid ${G.border}`,
              backgroundImage: `linear-gradient(180deg, rgba(10,4,16,0.08) 0%, rgba(10,4,16,0.42) 100%), url("${currentBossArtUrl}")`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, letterSpacing: 1.5, color: G.text, fontFamily: G.cinzel }}>
              {currentBoss?.name ?? currentBossId ?? 'Unknown'}
            </div>
            <div style={{ fontSize: 12, color: G.textMuted, fontVariantNumeric: 'tabular-nums' }}>
              {bossCurrentHp.toLocaleString()} / {bossMaxHp.toLocaleString()}
            </div>
          </div>
          {/* HP bar */}
          <div style={{
            height: 10, borderRadius: 5,
            background: 'rgba(60,30,100,0.55)',
            border: `1px solid rgba(80,50,160,0.35)`,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 5,
              width: `${hpFrac * 100}%`,
              background: hpBarColor,
              boxShadow: `0 0 8px ${hpBarColor}80`,
              transition: 'width 0.25s ease, background 0.4s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Encounter pip indicators */}
      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
        {encounterBossIds.map((_, idx) => (
          <div
            key={idx}
            style={{
              width: 10, height: 10, borderRadius: '50%',
              background: idx < encounterIndex
                ? G.electric
                : idx === encounterIndex
                  ? G.accentSoft
                  : 'rgba(80,50,160,0.30)',
              boxShadow: idx === encounterIndex ? `0 0 10px ${G.accentSoft}80` : 'none',
              border: `1px solid ${idx <= encounterIndex ? G.border : 'rgba(80,50,160,0.20)'}`,
              transition: 'all 0.3s ease',
            }}
          />
        ))}
        <span style={{ fontSize: 10, color: G.textMuted, marginLeft: 8, letterSpacing: 1 }}>
          {encounterIndex < totalEncounters - 1 ? `${totalEncounters - encounterIndex - 1} more after this` : 'Final encounter'}
        </span>
      </div>

      {activeCoopSessionId && opponentProfile && (
        <div style={{
          marginTop: 2,
          padding: '6px 10px',
          borderRadius: 8,
          border: `1px solid ${G.border}`,
          background: 'rgba(14,8,28,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}>
          <div style={{ fontSize: 10, color: G.textMuted }}>
            Co-op Partner: <span style={{ color: G.text }}>{opponentProfile.displayName}</span>
          </div>
          <div style={{ fontSize: 10, color: G.electric, fontVariantNumeric: 'tabular-nums' }}>
            E{(opponentProgress?.encounterIndex ?? 0) + 1} · DMG {(opponentProgress?.totalDamage ?? 0).toLocaleString()} · CLR {(opponentProgress?.completedEncounters ?? 0).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
