import { useEffect, useMemo, useState } from 'react';
import { useStore, selectBossFight } from '@/state/store';
import { useCoopRaidStore } from '@/state/coopRaidStore';
import {
  NULL_RAID_DEFINITIONS,
  NULL_RAID_PROVE_YOURSELF_SECONDS,
  getNullRaidProveYourselfTargetDamage,
} from '@/data/ascension/nullRaidDefinitions';
import { uiTypography } from '@/ui/theme';
import { CardRegistry } from '@/cards/CardRegistry';
import { getCardFaceBackgroundStyle } from '@/ui/cardBackgrounds';

const G = {
  bg: 'linear-gradient(160deg, #060310 0%, #040210 55%, #020108 100%)',
  accent: '#b890ff',
  accentSoft: '#d4bcff',
  accentDeep: '#7050d0',
  border: 'rgba(150,100,255,0.28)',
  borderStrong: 'rgba(185,135,255,0.55)',
  text: '#ece6ff',
  textMuted: 'rgba(220,210,255,0.72)',
  cinzel: uiTypography.display,
  entropyColor: '#c0a8ff',
  shardColor: '#80ffcc',
  goldBorder: 'rgba(255,212,112,0.30)',
};

export default function NullRaidResults() {
  const bossFight = useStore(selectBossFight);
  const progress = useStore(s => s.progress);
  const addTranscendentCard = useStore(s => s.addTranscendentCard);
  const finalizeNullRaidAngelOutcome = useStore(s => s.finalizeNullRaidAngelOutcome);
  const dismissBossResult = useStore(s => s.dismissBossResult);
  const activeCoopSessionId = useCoopRaidStore(s => s.activeSessionId);
  const activeCoopRaidId = useCoopRaidStore(s => s.activeRaidId);
  const completeActiveSession = useCoopRaidStore(s => s.completeActiveSession);
  const [rewardSlots, setRewardSlots] = useState<Array<'empty' | 'miss' | 'hit'>>(['empty', 'empty', 'empty']);

  if (bossFight.kind !== 'null_raid') return null;
  if (bossFight.mode !== 'victory' && bossFight.mode !== 'defeat') return null;

  const isVictory = bossFight.mode === 'victory';
  const provingOnly = bossFight.nullRaidProvingOnly === true;
  const raidDef = NULL_RAID_DEFINITIONS.find(r => r.id === bossFight.nullRaidId);
  const totalEncounters = bossFight.nullRaidEncounterBossIds?.length ?? 0;
  const completedEncounters = isVictory
    ? totalEncounters
    : Math.max(0, bossFight.nullRaidEncounterIndex ?? 0);

  const entropyEarned = bossFight.nullRaidAccumulatedEntropy ?? 0;
  const shardsEarned = bossFight.nullRaidAccumulatedShards ?? 0;

  const angelId = raidDef?.completionAngelId;
  const angelDef = angelId ? CardRegistry.get(angelId) : null;
  const raidId = bossFight.nullRaidId ?? '';
  const pityActive = !provingOnly && isVictory && !!angelId && raidId.length > 0 && ((progress.nullRaidAngelMissStreak?.[raidId] ?? 0) >= 10);
  const revealSlotCount = pityActive ? 1 : 3;
  const revealChance = pityActive ? 0.5 : 0.01;
  const visibleSlots = useMemo(() => rewardSlots.slice(0, revealSlotCount), [rewardSlots, revealSlotCount]);
  const allRevealed = visibleSlots.every(slot => slot !== 'empty');
  const hasAngelDrop = visibleSlots.some(slot => slot === 'hit');
  const proveTarget = raidDef ? getNullRaidProveYourselfTargetDamage(raidDef) : 0;
  const proveDamage = bossFight.nullRaidBestDamageFirstMinute ?? bossFight.damageDealtFirstMinute ?? 0;

  useEffect(() => {
    setRewardSlots(['empty', 'empty', 'empty']);
  }, [raidId, pityActive]);

  const angelName = angelDef?.name
    ?? (angelId
      ? angelId.replace('tx-angel-', '').split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : 'Angel');

  function handleRewardSlotClick(index: number) {
    if (!isVictory || !angelId) return;
    setRewardSlots(current => {
      if (current[index] !== 'empty') return current;
      const next = [...current] as Array<'empty' | 'miss' | 'hit'>;
      const hit = Math.random() < revealChance;
      next[index] = hit ? 'hit' : 'miss';
      if (hit) addTranscendentCard(angelId);
      return next;
    });
  }

  async function handleReturn() {
    if (!provingOnly && isVictory && angelId && raidId) {
      if (!allRevealed) return;
      finalizeNullRaidAngelOutcome(raidId, hasAngelDrop, pityActive);
    }
    if (activeCoopSessionId && activeCoopRaidId === raidId) {
      await completeActiveSession();
    }
    dismissBossResult();
  }

  const accentColor = isVictory ? '#a080ff' : '#ff6060';
  const titleText = provingOnly
    ? (isVictory ? 'PROVE YOURSELF PASSED' : 'PROVE YOURSELF FAILED')
    : (isVictory ? 'RAID COMPLETE' : 'RAID FAILED');
  const subtitleText = provingOnly
    ? `Dealt ${proveDamage.toLocaleString()} of ${proveTarget.toLocaleString()} required within ${NULL_RAID_PROVE_YOURSELF_SECONDS}s.`
    : (isVictory
      ? `All ${totalEncounters} encounters cleared. Rewards granted.`
      : `${completedEncounters} of ${totalEncounters} encounters cleared. Partial rewards granted.`);

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
              Entropic Energy Earned
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: G.entropyColor, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 20px ${G.entropyColor}55` }}>
              +{(provingOnly ? 0 : entropyEarned).toLocaleString()}
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
              +{(provingOnly ? 0 : shardsEarned).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Angel reward slots */}
        {!provingOnly && isVictory && angelId && (
          <div style={{
            padding: '18px 24px 24px',
            background: 'rgba(30,20,8,0.70)',
            borderBottom: `1px solid ${G.goldBorder}`,
          }}>
            <div style={{ fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(220,180,100,0.70)', fontFamily: G.cinzel, marginBottom: 14, textAlign: 'center' }}>
              {pityActive ? 'Angel Manifestation - Pity Roll (1 Reveal at 50%)' : 'Angel Manifestation - 3 Rolls at 1% Each'}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'stretch', flexWrap: 'nowrap' }}>
              {visibleSlots.map((slotState, index) => {
                const rolled = slotState !== 'empty';
                const hit = slotState === 'hit';
                return (
                  <button
                    key={index}
                    onClick={() => handleRewardSlotClick(index)}
                    disabled={rolled}
                    style={{
                      width: 124,
                      height: 172,
                      borderRadius: 14,
                      border: `1px solid ${rolled ? (hit ? 'rgba(255,208,138,0.60)' : 'rgba(150,100,255,0.24)') : 'rgba(255,208,138,0.30)'}`,
                      background: rolled
                        ? (hit
                          ? 'linear-gradient(180deg, rgba(80,50,10,0.92) 0%, rgba(35,18,8,0.94) 100%)'
                          : 'linear-gradient(180deg, rgba(15,10,28,0.94) 0%, rgba(8,6,16,0.96) 100%)')
                        : 'linear-gradient(180deg, rgba(20,14,34,0.88) 0%, rgba(6,4,14,0.94) 100%)',
                      boxShadow: hit
                        ? '0 0 28px rgba(255,190,90,0.28)'
                        : '0 0 0 rgba(0,0,0,0)',
                      color: G.text,
                      cursor: rolled ? 'default' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                    }}
                  >
                    <div style={{
                      width: 92,
                      height: 128,
                      borderRadius: 10,
                      border: `1px solid ${rolled ? (hit ? 'rgba(255,208,138,0.35)' : 'rgba(150,100,255,0.18)') : 'rgba(255,208,138,0.18)'}`,
                      ...(rolled && hit && angelDef
                        ? {
                            ...getCardFaceBackgroundStyle(angelDef, 'normal', 'front'),
                            backgroundSize: '100% 100%',
                          }
                        : {
                            background: rolled
                              ? (hit
                                ? 'radial-gradient(circle at 50% 28%, rgba(255,220,150,0.30), transparent 58%), linear-gradient(180deg, rgba(255,220,150,0.14), rgba(0,0,0,0))'
                                : 'linear-gradient(180deg, rgba(16,11,28,0.92), rgba(4,3,10,0.96))')
                              : 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.14))',
                          }),
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                      backgroundRepeat: 'no-repeat',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      padding: 10,
                    }}>
                      {!(rolled && hit && angelDef) && (
                        <div style={{ fontFamily: G.cinzel, fontSize: hit ? 15 : 12, letterSpacing: 2, color: hit ? '#ffd48a' : G.textMuted, lineHeight: 1.2 }}>
                          {rolled ? (hit ? angelName : 'Empty') : 'Click\nTo Reveal'}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: hit ? 'rgba(255,210,140,0.80)' : G.textMuted }}>
                      {rolled ? (hit ? 'Angel' : 'No Drop') : (pityActive ? 'Pity Slot' : `Slot ${index + 1}`)}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(220,180,100,0.60)', textAlign: 'center', marginTop: 12 }}>
              {pityActive
                ? `Pity active: one reveal only. A successful roll adds ${angelName} to your collection.`
                : `Each empty zone can be clicked once. A successful roll adds ${angelName} to your collection.`}
            </div>
          </div>
        )}

        {/* Action button */}
        <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => void handleReturn()}
            disabled={isVictory && !!angelId && !allRevealed}
            style={{
              padding: '12px 40px', borderRadius: 10, cursor: 'pointer',
              background: `linear-gradient(135deg, rgba(100,50,220,0.50) 0%, rgba(70,30,180,0.40) 100%)`,
              border: `1px solid ${G.borderStrong}`,
              color: G.accentSoft, fontSize: 13, letterSpacing: 3, fontFamily: G.cinzel,
              textTransform: 'uppercase',
              textShadow: `0 0 16px rgba(160,128,255,0.40)`,
              transition: 'all 0.18s ease',
              opacity: isVictory && !!angelId && !allRevealed ? 0.6 : 1,
            }}
          >
            Return
          </button>
        </div>
      </div>
    </div>
  );
}
