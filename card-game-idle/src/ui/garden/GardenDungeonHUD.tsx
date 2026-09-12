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
    <section style={{
      position: 'absolute',
      top: 54,
      left: 14,
      right: 'var(--angel-drawer-hand-offset, 308px)',
      zIndex: 20,
      pointerEvents: 'auto',
      padding: '7px 12px',
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.22)',
      background: 'linear-gradient(180deg, rgba(8,10,18,0.95) 0%, rgba(12,14,24,0.92) 100%)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.1) inset',
      color: '#eef4ff',
      fontFamily: uiTypography.body,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ color: '#fff', fontFamily: uiTypography.display, fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Valley of Null
          </div>
          <div style={{ color: 'rgba(238,244,255,0.62)', fontSize: 10 }}>
            Encounter {dungeonState.encounterIndex + 1}/{dungeon.encounters.length} · <span style={{ color: '#cfe0ff' }}>{encounter.name}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {encounter.reward && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 7px', borderRadius: 5, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <img src={rewardIconUrl(encounter.reward.artAssetKey)} alt="" aria-hidden="true" width={18} height={18} style={{ width: 18, height: 18, objectFit: 'cover', borderRadius: 3 }} />
              <span style={{ fontSize: 9, color: '#d8f0ff' }}>{GARDEN_REWARD_LABELS[encounter.reward.currency]} ({Math.round(encounter.reward.chance * 100)}%)</span>
            </div>
          )}
          <div style={{
            padding: '2px 8px',
            borderRadius: 5,
            background: dungeonState.timeRemainingSeconds <= 30 ? 'rgba(120,20,20,0.45)' : 'rgba(20,40,70,0.45)',
            border: `1px solid ${dungeonState.timeRemainingSeconds <= 30 ? 'rgba(255,80,80,0.5)' : 'rgba(100,180,255,0.35)'}`,
            color: dungeonState.timeRemainingSeconds <= 30 ? '#ffb0b0' : '#d8f0ff',
            fontSize: 11,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
          }}>
            Expedition {minutes}:{seconds}
          </div>
          <button
            type="button"
            onClick={exitGardenDungeon}
            style={{
              padding: '3px 8px',
              borderRadius: 5,
              border: '1px solid rgba(255,100,100,0.4)',
              background: 'rgba(60,15,20,0.6)',
              color: '#ffd0d0',
              cursor: 'pointer',
              fontSize: 9,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            Leave
          </button>
        </div>
      </div>

      {/* HP Bar */}
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 7, borderRadius: 999, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.22)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ width: `${hpPercent}%`, height: '100%', background: 'linear-gradient(90deg, #c4cede, #ffffff)', boxShadow: '0 0 12px rgba(255,255,255,0.75)', transition: 'width 0.25s ease' }} />
        </div>
        <div style={{ color: '#ffffff', fontSize: 10, fontVariantNumeric: 'tabular-nums', flexShrink: 0, minWidth: 110, textAlign: 'right', textShadow: '0 0 8px rgba(255,255,255,0.3)' }}>
          HP {dungeonState.encounterHp.toLocaleString()} / {dungeonState.encounterMaxHp.toLocaleString()}
        </div>
        {dungeonState.encounterHp <= 0 && (
          <button
            type="button"
            onClick={resolveGardenEncounter}
            style={{
              padding: '3px 10px',
              borderRadius: 5,
              border: '1px solid rgba(140,240,160,0.8)',
              background: 'linear-gradient(180deg, rgba(30,100,50,0.9), rgba(15,60,30,0.95))',
              color: '#b0ffc8',
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 'bold',
              letterSpacing: 0.5,
              boxShadow: '0 0 12px rgba(100,255,140,0.4)',
            }}
          >
            Claim Reward
          </button>
        )}
      </div>
    </section>
  );
}
