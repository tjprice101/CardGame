import { useEffect } from 'react';
import { useStore, selectGardenDungeon, selectProgress } from '@/state/store';
import { GARDEN_DUNGEONS, GARDEN_REWARD_LABELS } from '@/data/dungeons/gardenDungeonDefinitions';
import { SfxManager } from '@/audio/SfxManager';
import { uiTypography } from '@/ui/theme';

const rewardIconUrl = (assetKey: string) => `${import.meta.env.BASE_URL}assets/dungeons/items/${assetKey}.png`;

export default function GardenResultModal() {
  const gardenDungeon = useStore(selectGardenDungeon);
  const progress = useStore(selectProgress);
  const continueGardenDungeon = useStore(s => s.continueGardenDungeon);
  const exitGardenDungeon = useStore(s => s.exitGardenDungeon);

  const isVictory = gardenDungeon.phase === 'victory';
  const isDefeat = gardenDungeon.phase === 'defeat';
  const isVisible = isVictory || isDefeat;

  useEffect(() => {
    if (!isVisible) return;
    if (isVictory) {
      SfxManager.positive();
    } else {
      SfxManager.negative();
    }
  }, [isVisible, isVictory]);

  if (!isVisible) return null;

  const dungeon = GARDEN_DUNGEONS.find(d => d.id === gardenDungeon.dungeonId);
  const encounter = dungeon?.encounters[gardenDungeon.encounterIndex];
  const isFinalEncounter = dungeon ? gardenDungeon.encounterIndex >= dungeon.encounters.length - 1 : false;
  const rewardKey = gardenDungeon.lastReward;
  const rewardLabel = rewardKey ? GARDEN_REWARD_LABELS[rewardKey] : null;

  return (
    <div
      aria-modal="true"
      role="dialog"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 85,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: uiTypography.body,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(2, 3, 6, 0.98) 0%, rgba(8, 10, 18, 0.99) 100%)',
      }}
    >
      {/* Radiant atmospheric background glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: isVictory
            ? 'radial-gradient(ellipse 70% 50% at 50% 35%, rgba(255, 255, 255, 0.22) 0%, rgba(200, 220, 255, 0.12) 40%, transparent 70%)'
            : 'radial-gradient(ellipse 70% 50% at 50% 35%, rgba(255, 70, 70, 0.18) 0%, rgba(120, 20, 30, 0.1) 40%, transparent 70%)',
        }}
      />

      <div
        className="garden-pearlescent-card"
        style={{
          position: 'relative',
          width: '90%',
          maxWidth: 520,
          padding: '36px 32px 32px',
          borderRadius: 16,
          boxShadow: isVictory
            ? '0 0 0 1px rgba(255,255,255,0.4), 0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(255,255,255,0.25)'
            : '0 0 0 1px rgba(255,80,80,0.4), 0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(255,60,60,0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Subtitle tag */}
        <div
          style={{
            fontSize: 11,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.65)',
            fontFamily: uiTypography.display,
            marginBottom: 6,
          }}
        >
          {dungeon?.name ?? 'Garden of Cards'} · Encounter {gardenDungeon.encounterIndex + 1}
        </div>

        {/* Big Banner Heading */}
        <h1
          style={{
            margin: '0 0 14px',
            fontFamily: uiTypography.display,
            fontSize: 38,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: isVictory ? '#ffffff' : '#ff7a7a',
            textShadow: isVictory
              ? '0 0 24px rgba(255,255,255,0.9), 0 0 40px rgba(200,230,255,0.6)'
              : '0 0 24px rgba(255,80,80,0.8)',
          }}
        >
          {isVictory ? (isFinalEncounter ? 'Expedition Complete' : 'Victory') : 'Defeat'}
        </h1>

        <div
          style={{
            color: 'rgba(238, 244, 255, 0.8)',
            fontSize: 14,
            lineHeight: 1.5,
            maxWidth: 400,
            marginBottom: 24,
          }}
        >
          {isVictory ? (
            isFinalEncounter ? (
              <span>You conquered all encounters in <strong>{dungeon?.name}</strong>!</span>
            ) : (
              <span>You defeated <strong>{encounter?.name ?? 'the encounter'}</strong>. The expedition timer will reset to full for the next encounter.</span>
            )
          ) : (
            <span>The expedition timer expired before the encounter was defeated. All recovered materials remain in your inventory.</span>
          )}
        </div>

        {/* Reward section on victory */}
        {isVictory && (
          <div
            style={{
              width: '100%',
              padding: '16px 20px',
              borderRadius: 12,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
              border: '1px solid rgba(255,255,255,0.18)',
              marginBottom: 28,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
              Encounter Reward
            </div>
            {rewardLabel && rewardKey && encounter?.reward ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img
                  src={rewardIconUrl(encounter.reward.artAssetKey)}
                  alt={rewardLabel}
                  width={40}
                  height={40}
                  style={{
                    width: 40,
                    height: 40,
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.4)',
                    boxShadow: '0 0 14px rgba(255,255,255,0.3)',
                  }}
                />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 14 }}>
                    +1 {rewardLabel}
                  </div>
                  <div style={{ color: 'rgba(238,244,255,0.55)', fontSize: 11 }}>
                    Total Owned: {progress[rewardKey] ?? 0}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'rgba(238,244,255,0.5)', fontSize: 12 }}>
                No material dropped this encounter.
              </div>
            )}
          </div>
        )}

        {/* Action button row */}
        <div style={{ display: 'flex', gap: 14, width: '100%', justifyContent: 'center' }}>
          {isVictory && !isFinalEncounter ? (
            <>
              <button
                type="button"
                className="garden-pearlescent-btn"
                onClick={continueGardenDungeon}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: 10,
                  fontSize: 13,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Continue Run (Next Encounter)
              </button>
              <button
                type="button"
                onClick={exitGardenDungeon}
                style={{
                  padding: '12px 18px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: 12,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Quit / Main Menu
              </button>
            </>
          ) : (
            <button
              type="button"
              className="garden-pearlescent-btn"
              onClick={exitGardenDungeon}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: 10,
                fontSize: 13,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Return to Main Menu
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
