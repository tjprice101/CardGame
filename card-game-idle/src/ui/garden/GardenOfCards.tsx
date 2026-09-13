import { useMemo, useRef, useState } from 'react';
import { GARDEN_DUNGEONS, GARDEN_MATERIAL_METADATA, GARDEN_REWARD_LABELS } from '@/data/dungeons/gardenDungeonDefinitions';
import { useStore, selectProgress } from '@/state/store';
import { uiTypography } from '@/ui/theme';

interface Props { onClose: () => void; onEnterDungeon?: (dungeonId: string) => void }

const rewardIconUrl = (assetKey: string) => `${import.meta.env.BASE_URL}assets/dungeons/items/${assetKey}.png`;

export default function GardenOfCards({ onClose, onEnterDungeon }: Props) {
  const progress = useStore(selectProgress);
  const dungeonState = useStore(state => state.gardenDungeon);
  const startGardenDungeon = useStore(state => state.startGardenDungeon);
  const resolveGardenEncounter = useStore(state => state.resolveGardenEncounter);
  const exitGardenDungeon = useStore(state => state.exitGardenDungeon);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showInventory, setShowInventory] = useState(false);
  const selected = GARDEN_DUNGEONS[selectedIndex] ?? GARDEN_DUNGEONS[0];
  const activeDungeon = dungeonState.dungeonId ? GARDEN_DUNGEONS.find(dungeon => dungeon.id === dungeonState.dungeonId) : null;
  const activeEncounter = activeDungeon?.encounters[dungeonState.encounterIndex];
  const minutes = Math.floor(dungeonState.timeRemainingSeconds / 60);
  const seconds = Math.floor(dungeonState.timeRemainingSeconds % 60).toString().padStart(2, '0');

  const ownedMaterials = useMemo(() => {
    return (Object.keys(GARDEN_MATERIAL_METADATA) as (keyof typeof GARDEN_MATERIAL_METADATA)[])
      .map(key => ({
        key,
        count: progress[key] ?? 0,
        meta: GARDEN_MATERIAL_METADATA[key],
      }))
      .filter(item => item.count > 0);
  }, [progress]);

  const move = (direction: number) => {
    const next = Math.max(0, Math.min(GARDEN_DUNGEONS.length - 1, selectedIndex + direction));
    setSelectedIndex(next);
    scrollerRef.current?.children[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.18), transparent 45%), linear-gradient(145deg, rgba(6,7,12,0.99), rgba(10,12,20,0.99))', color: '#ffffff', fontFamily: uiTypography.body, overflowY: 'auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '26px clamp(18px, 5vw, 64px) 12px', maxWidth: 1180, margin: '0 auto' }}>
        <div>
          <div style={{ fontFamily: uiTypography.display, fontSize: 28, letterSpacing: 2, textTransform: 'uppercase', color: '#ffffff', textShadow: '0 0 20px rgba(255,255,255,0.8), 0 0 35px rgba(200,225,255,0.5)' }}>Garden of Cards</div>
          <div style={{ marginTop: 5, color: 'rgba(255,255,255,0.7)', fontSize: 12, letterSpacing: 0.5 }}>Dungeon expeditions and material recovery</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => setShowInventory(!showInventory)}
            className="garden-pearlescent-btn"
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 12,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: '#000',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>🎒</span>
            <span>{showInventory ? 'Close Inventory' : `Inventory (${ownedMaterials.length})`}</span>
          </button>
          <button type="button" onClick={onClose} aria-label="Close Garden of Cards" className="garden-pearlescent-btn" style={{ width: 34, height: 34, borderRadius: 8, color: '#000', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
      </header>
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '12px clamp(12px, 4vw, 48px) 48px' }}>
        {showInventory && (
          <section
            className="garden-pearlescent-card"
            style={{
              maxWidth: 760,
              margin: '0 auto 20px',
              padding: 24,
              borderRadius: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontFamily: uiTypography.display, fontSize: 20, letterSpacing: 1.5, color: '#ffffff', textTransform: 'uppercase' }}>
                  Garden Material Inventory
                </h2>
                <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>
                  Materials recovered from Garden of Cards expeditions used in crafting Infinite cards
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInventory(false)}
                className="garden-pearlescent-btn"
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  color: '#000',
                  fontSize: 11,
                  cursor: 'pointer',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                Close
              </button>
            </div>

            {ownedMaterials.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {ownedMaterials.map(item => (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 14,
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.18)',
                    }}
                  >
                    <img
                      src={rewardIconUrl(item.meta.artAssetKey)}
                      alt={item.meta.name}
                      width={44}
                      height={44}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        objectFit: 'cover',
                        border: '1px solid rgba(255,255,255,0.4)',
                        boxShadow: '0 0 14px rgba(255,255,255,0.3)',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.meta.name}
                      </div>
                      <div style={{ marginTop: 2, color: '#91bfff', fontSize: 12, fontWeight: 700 }}>
                        Owned: {item.count.toLocaleString()}
                      </div>
                      <div style={{ marginTop: 3, color: 'rgba(255,255,255,0.5)', fontSize: 9.5, lineHeight: 1.3 }}>
                        {item.meta.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontStyle: 'italic' }}>
                No dungeon materials currently owned. Complete encounters in the Valley of Null to recover materials.
              </div>
            )}
          </section>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: uiTypography.display }}>Select a dungeon</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => move(-1)} aria-label="Previous dungeon" className="garden-pearlescent-btn" style={navStyle}>‹</button>
            <button type="button" onClick={() => move(1)} aria-label="Next dungeon" className="garden-pearlescent-btn" style={navStyle}>›</button>
          </div>
        </div>
        <div ref={scrollerRef} style={{ display: 'flex', gap: 16, overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '12px calc(50% - min(40vw, 330px)) 20px', scrollbarWidth: 'thin' }}>
          {GARDEN_DUNGEONS.map((dungeon, index) => (
            <button
              key={dungeon.id}
              type="button"
              onClick={() => { setSelectedIndex(index); scrollerRef.current?.children[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); }}
              className={index === selectedIndex ? 'garden-pearlescent-card' : ''}
              style={{
                flex: '0 0 min(80vw, 660px)',
                aspectRatio: '1.55',
                scrollSnapAlign: 'center',
                borderRadius: 14,
                border: index === selectedIndex ? '1px solid rgba(255,255,255,0.9)' : '1px solid rgba(255,255,255,0.2)',
                background: `linear-gradient(180deg, rgba(6,7,12,0.1), rgba(6,7,12,0.88)), url("${dungeon.coverArt}") center / cover`,
                boxShadow: index === selectedIndex ? '0 0 0 2px rgba(255,255,255,0.4), 0 0 40px rgba(255,255,255,0.3)' : '0 12px 25px rgba(0,0,0,0.45)',
                color: '#fff',
                textAlign: 'left',
                padding: 24,
                cursor: 'pointer',
                opacity: dungeon.available ? 1 : 0.48,
                position: 'relative',
              }}
            >
              <span style={{ position: 'absolute', top: 16, right: 16, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.4)', padding: '3px 8px', borderRadius: 4 }}>{dungeon.available ? 'Available' : 'Coming soon'}</span>
              <span style={{ position: 'absolute', left: 24, bottom: 22, fontFamily: uiTypography.display, fontSize: 26, letterSpacing: 1.5, textShadow: '0 0 16px rgba(255,255,255,0.8)' }}>{dungeon.name}</span>
            </button>
          ))}
        </div>
        <section className="garden-pearlescent-card" style={{ maxWidth: 760, margin: '8px auto 0', padding: 26, borderRadius: 14 }}>
          <h1 style={{ margin: 0, fontFamily: uiTypography.display, fontSize: 24, letterSpacing: 1.5, color: '#ffffff', textShadow: '0 0 16px rgba(255,255,255,0.6)' }}>{selected.name}</h1>
          <div style={{ marginTop: 5, color: '#e0ecff', fontSize: 12 }}>{selected.subtitle}</div>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.6 }}>{selected.description}</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {selected.encounters.map((encounter, index) => encounter.reward && (
              <div key={encounter.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <img src={rewardIconUrl(encounter.reward.artAssetKey)} alt="" width={32} height={32} style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.35)', boxShadow: '0 0 10px rgba(255,255,255,0.25)' }} />
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>Encounter {index + 1}: {encounter.name}</div><div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Reward: {GARDEN_REWARD_LABELS[encounter.reward.currency]}</div></div>
                <div style={{ color: '#ffffff', fontSize: 12, fontWeight: 600 }}>{Math.round(encounter.reward.chance * 100)}% · Owned {progress[encounter.reward.currency] ?? 0}</div>
              </div>
            ))}
          </div>
          {dungeonState.phase === 'active' && activeDungeon && activeEncounter ? (
            <div style={{ marginTop: 20, padding: 16, borderRadius: 10, border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.07)' }}>
              <div style={{ color: '#ffffff', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: uiTypography.display }}>Active expedition · Encounter {dungeonState.encounterIndex + 1} / {activeDungeon.encounters.length}</div>
              <div style={{ marginTop: 8, fontFamily: uiTypography.display, fontSize: 20, color: '#ffffff' }}>{activeEncounter.name}</div>
              <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Encounter HP {dungeonState.encounterHp.toLocaleString()} / {dungeonState.encounterMaxHp.toLocaleString()} · Time remaining {minutes}:{seconds}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button type="button" disabled={dungeonState.encounterHp > 0} onClick={resolveGardenEncounter} className={dungeonState.encounterHp <= 0 ? 'garden-pearlescent-btn' : ''} style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.65)', background: dungeonState.encounterHp <= 0 ? undefined : 'rgba(255,255,255,0.06)', color: dungeonState.encounterHp <= 0 ? '#000' : 'rgba(255,255,255,0.45)', cursor: dungeonState.encounterHp <= 0 ? 'pointer' : 'not-allowed', fontFamily: uiTypography.body, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{dungeonState.encounterHp > 0 ? 'Defeat the encounter in battle' : 'Claim Encounter Reward'}</button>
                <button type="button" onClick={exitGardenDungeon} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: 'rgba(255,255,255,0.85)', cursor: 'pointer', fontFamily: uiTypography.body, fontSize: 12, textTransform: 'uppercase' }}>Exit</button>
              </div>
            </div>
          ) : (
            <button type="button" disabled={!selected.available} onClick={() => { if (startGardenDungeon(selected.id)) onEnterDungeon?.(selected.id); }} className="garden-pearlescent-btn" style={{ marginTop: 22, width: '100%', padding: '14px 18px', borderRadius: 10, cursor: selected.available ? 'pointer' : 'not-allowed', fontFamily: uiTypography.body, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' }}>{selected.available ? 'Enter Dungeon' : 'Unavailable'}</button>
          )}
          {dungeonState.phase === 'complete' && dungeonState.lastReward && (
            <div style={{ marginTop: 14, color: '#ffffff', fontSize: 12, background: 'rgba(255,255,255,0.08)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)' }}>Run complete. Reward roll: +1 {GARDEN_REWARD_LABELS[dungeonState.lastReward]}.</div>
          )}
        </section>
      </main>
    </div>
  );
}

const navStyle: React.CSSProperties = { width: 34, height: 34, borderRadius: 8, color: '#000', cursor: 'pointer', fontSize: 20, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' };
