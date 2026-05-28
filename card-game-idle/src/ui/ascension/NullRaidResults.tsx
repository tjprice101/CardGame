import { useStore, selectBossFight, selectProgress } from '@/state/store';
import { NULL_RAID_DEFINITIONS } from '@/data/ascension/nullRaidDefinitions';
import { uiTypography } from '@/ui/theme';

const G = {
  bg: 'linear-gradient(160deg, #060310 0%, #040210 55%, #020108 100%)',
  accent: '#b890ff',
  accentSoft: '#d4bcff',
  accentDeep: '#7050d0',
  border: 'rgba(150,100,255,0.28)',
  borderStrong: 'rgba(185,135,255,0.55)',
  text: '#ece6ff',
  textMuted: 'rgba(220,210,255,0.72)',
  cinzel: '"Cinzel", "Cormorant Garamond", Georgia, serif',
  entropyColor: '#c0a8ff',
  shardColor: '#80ffcc',
  goldBorder: 'rgba(255,212,112,0.30)',
};

export default function NullRaidResults() {
  const bossFight = useStore(selectBossFight);
  const progress = useStore(selectProgress);
  const dismissBossResult = useStore(s => s.dismissBossResult);

  if (bossFight.kind !== 'null_raid') return null;
  if (bossFight.mode !== 'victory' && bossFight.mode !== 'defeat') return null;

  const isVictory = bossFight.mode === 'victory';
  const raidDef = NULL_RAID_DEFINITIONS.find(r => r.id === bossFight.nullRaidId);
  const totalEncounters = bossFight.nullRaidEncounterBossIds?.length ?? 0;
  const completedEncounters = isVictory
    ? totalEncounters
    : Math.max(0, bossFight.nullRaidEncounterIndex ?? 0);

  const entropyEarned = bossFight.nullRaidAccumulatedEntropy ?? 0;
  const shardsEarned = bossFight.nullRaidAccumulatedShards ?? 0;

  // Detect angel drop: check if transcendentCollection has the angel card from this raid
  const angelId = raidDef?.completionAngelId;
  const transcendentCollection = progress.transcendentCollection ?? {};
  const angelDropped = isVictory && angelId && (transcendentCollection[angelId] ?? 0) > 0;

  const accentColor = isVictory ? '#a080ff' : '#ff6060';
  const titleText = isVictory ? 'RAID COMPLETE' : 'RAID FAILED';
  const subtitleText = isVictory
    ? `All ${totalEncounters} encounters cleared. Rewards granted.`
    : `${completedEncounters} of ${totalEncounters} encounters cleared. Partial rewards granted.`;

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 42,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(2,1,8,0.88)',
        backdropFilter: 'blur(6px)',
        fontFamily: uiTypography.body,
      }}
    >
      {/* Atmospheric glow */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: isVictory
          ? 'radial-gradient(ellipse at 50% 40%, rgba(100,60,220,0.20) 0%, transparent 60%)'
          : 'radial-gradient(ellipse at 50% 40%, rgba(180,40,40,0.15) 0%, transparent 60%)',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: 'min(600px, 90vw)',
        borderRadius: 20, overflow: 'hidden',
        border: `1px solid ${isVictory ? G.borderStrong : 'rgba(200,60,60,0.40)'}`,
        background: G.bg,
        boxShadow: `0 8px 60px ${isVictory ? 'rgba(100,60,220,0.35)' : 'rgba(180,40,40,0.25)'}`,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Top accent bar */}
        <div style={{
          height: 4,
          background: isVictory
            ? `linear-gradient(90deg, transparent, ${G.accent}, ${G.accentSoft}, ${G.accent}, transparent)`
            : `linear-gradient(90deg, transparent, #ff4040, #ff8060, #ff4040, transparent)`,
          boxShadow: `0 0 24px ${accentColor}60`,
        }} />

        {/* Header */}
        <div style={{ padding: '28px 32px 20px', textAlign: 'center', borderBottom: `1px solid ${G.border}` }}>
          <div style={{
            fontFamily: G.cinzel, fontSize: 28, letterSpacing: 5, fontWeight: 300,
            color: accentColor,
            textShadow: `0 0 40px ${accentColor}60, 0 2px 20px ${accentColor}30`,
            marginBottom: 10,
          }}>
            {titleText}
          </div>
          <div style={{ fontFamily: G.cinzel, fontSize: 14, letterSpacing: 2, color: G.text, marginBottom: 6 }}>
            {raidDef?.name ?? 'Null Raid'}
          </div>
          <div style={{ fontSize: 12, color: G.textMuted, lineHeight: 1.6 }}>
            {subtitleText}
          </div>
        </div>

        {/* Encounter breakdown */}
        <div style={{ padding: '20px 32px', borderBottom: `1px solid ${G.border}` }}>
          <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: G.textMuted, fontFamily: G.cinzel, marginBottom: 12 }}>
            Encounter Results
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {(bossFight.nullRaidEncounterBossIds ?? []).map((bossId, idx) => {
              const cleared = idx < completedEncounters;
              return (
                <div
                  key={bossId}
                  style={{
                    padding: '6px 12px', borderRadius: 8,
                    border: `1px solid ${cleared ? 'rgba(64,192,255,0.30)' : G.border}`,
                    background: cleared ? 'rgba(30,60,100,0.30)' : 'rgba(10,5,20,0.60)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <span style={{ fontSize: 12, color: cleared ? '#40c0ff' : G.textMuted }}>
                    {cleared ? '✓' : '✗'}
                  </span>
                  <span style={{ fontSize: 11, color: cleared ? G.text : G.textMuted, letterSpacing: 0.5 }}>
                    {`E${idx + 1}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reward summary */}
        <div style={{ padding: '20px 32px', display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', borderBottom: `1px solid ${G.border}` }}>
          <div style={{
            padding: '12px 20px', borderRadius: 10,
            border: `1px solid rgba(140,100,255,0.25)`,
            background: 'rgba(60,30,120,0.18)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <div style={{ fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', color: `${G.entropyColor}80` }}>
              Entropy Earned
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: G.entropyColor, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 20px ${G.entropyColor}55` }}>
              +{entropyEarned.toLocaleString()}
            </div>
          </div>
          <div style={{
            padding: '12px 20px', borderRadius: 10,
            border: `1px solid rgba(100,255,200,0.18)`,
            background: 'rgba(30,60,50,0.18)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <div style={{ fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', color: `${G.shardColor}80` }}>
              Aberrated Shards
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: G.shardColor, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 20px ${G.shardColor}55` }}>
              +{shardsEarned.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Angel drop reveal */}
        {angelDropped && angelId && (
          <div style={{
            padding: '20px 32px',
            background: 'rgba(30,20,8,0.70)',
            borderBottom: `1px solid ${G.goldBorder}`,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(220,180,100,0.70)', fontFamily: G.cinzel, marginBottom: 10 }}>
              Angel Manifestation — 5% Drop
            </div>
            <div style={{ fontFamily: G.cinzel, fontSize: 16, letterSpacing: 2, color: '#ffd08a', textShadow: '0 0 30px rgba(255,180,80,0.50)', marginBottom: 6 }}>
              ✦ Unique Angel Obtained ✦
            </div>
            <div style={{ fontSize: 11, color: 'rgba(220,180,100,0.60)' }}>
              {angelId.replace('tx-angel-', '').split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} has been added to your collection.
            </div>
          </div>
        )}

        {/* Action button */}
        <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={dismissBossResult}
            style={{
              padding: '12px 40px', borderRadius: 10, cursor: 'pointer',
              background: `linear-gradient(135deg, rgba(100,50,220,0.50) 0%, rgba(70,30,180,0.40) 100%)`,
              border: `1px solid ${G.borderStrong}`,
              color: G.accentSoft, fontSize: 13, letterSpacing: 3, fontFamily: G.cinzel,
              textTransform: 'uppercase',
              textShadow: `0 0 16px rgba(160,128,255,0.40)`,
              transition: 'all 0.18s ease',
            }}
          >
            Return
          </button>
        </div>
      </div>
    </div>
  );
}
