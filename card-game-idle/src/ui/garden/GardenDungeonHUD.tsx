import { GARDEN_DUNGEONS, GARDEN_REWARD_LABELS } from '@/data/dungeons/gardenDungeonDefinitions';
import { useStore } from '@/state/store';
import { uiTypography } from '@/ui/theme';

const rewardIconUrl = (assetKey: string) => `${import.meta.env.BASE_URL}assets/dungeons/items/${assetKey}.png`;

export default function GardenDungeonHUD() {
  const dungeonState = useStore(state => state.gardenDungeon);
  const resolveGardenEncounter = useStore(state => state.resolveGardenEncounter);
  const exitGardenDungeon = useStore(state => state.exitGardenDungeon);
  if (dungeonState.phase !== 'active') return null;

  const dungeon = GARDEN_DUNGEONS.find(entry => entry.id === dungeonState.dungeonId);
  const encounter = dungeon?.encounters[dungeonState.encounterIndex];
  if (!dungeon || !encounter) return null;
  const minutes = Math.floor(dungeonState.timeRemainingSeconds / 60);
  const seconds = Math.floor(dungeonState.timeRemainingSeconds % 60).toString().padStart(2, '0');
  const hpPercent = dungeonState.encounterMaxHp > 0
    ? Math.max(0, Math.min(100, dungeonState.encounterHp / dungeonState.encounterMaxHp * 100))
    : 0;

  return (
    <section style={{ position: 'absolute', top: 58, left: 14, right: 314, zIndex: 16, pointerEvents: 'auto', padding: '7px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.28)', background: 'linear-gradient(180deg, rgba(10,14,26,0.92), rgba(10,12,20,0.84))', boxShadow: '0 6px 18px rgba(0,0,0,0.3)', color: '#eef4ff', fontFamily: uiTypography.body }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 25 }}>
        <div style={{ minWidth: 0 }}><div style={{ color: '#fff', fontFamily: uiTypography.display, fontSize: 13, lineHeight: 1.1 }}>Valley of Null <span style={{ color: 'rgba(238,244,255,0.58)', fontFamily: uiTypography.body, fontSize: 9, letterSpacing: 0 }}>· Encounter {dungeonState.encounterIndex + 1}/{dungeon.encounters.length} · {encounter.name}</span></div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}><img src={encounter.reward ? rewardIconUrl(encounter.reward.artAssetKey) : undefined} alt="" aria-hidden="true" width={22} height={22} style={{ width: 22, height: 22, objectFit: 'cover', borderRadius: 3 }} /><div style={{ color: dungeonState.timeRemainingSeconds <= 30 ? '#ffb0b0' : '#d8f0ff', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>Expedition {minutes}:{seconds}</div></div>
      </div>
      <div style={{ marginTop: 5, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}><div style={{ width: `${hpPercent}%`, height: '100%', background: 'linear-gradient(90deg, #f4f4f8, #91bfff)', transition: 'width 0.25s ease' }} /></div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 3, color: 'rgba(238,244,255,0.6)', fontSize: 8 }}><span>HP {dungeonState.encounterHp.toLocaleString()} / {dungeonState.encounterMaxHp.toLocaleString()}</span><span>{encounter.reward ? `${GARDEN_REWARD_LABELS[encounter.reward.currency]} · ${Math.round(encounter.reward.chance * 100)}%` : 'No reward configured'}</span></div>
      <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
        <button type="button" disabled={dungeonState.encounterHp > 0} onClick={resolveGardenEncounter} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.5)', background: dungeonState.encounterHp <= 0 ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.05)', color: '#fff', cursor: dungeonState.encounterHp <= 0 ? 'pointer' : 'not-allowed', opacity: dungeonState.encounterHp <= 0 ? 1 : 0.45, fontSize: 9 }}>{dungeonState.encounterHp <= 0 ? 'Claim Reward' : 'Defeat encounter with your turn'}</button>
        <button type="button" onClick={exitGardenDungeon} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.24)', background: 'transparent', color: 'rgba(238,244,255,0.72)', cursor: 'pointer', fontSize: 9 }}>Leave</button>
      </div>
    </section>
  );
}
