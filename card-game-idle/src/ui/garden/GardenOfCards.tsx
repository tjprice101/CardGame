import { useMemo, useState } from 'react';
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
    const next = (selectedIndex + direction + GARDEN_DUNGEONS.length) % GARDEN_DUNGEONS.length;
    setSelectedIndex(next);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.18), transparent 45%), linear-gradient(145deg, rgba(6,7,12,0.99), rgba(10,12,20,0.99))', color: '#ffffff', fontFamily: uiTypography.body, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: uiTypography.display, fontSize: 24, letterSpacing: 2, textTransform: 'uppercase', color: '#ffffff', textShadow: '0 0 20px rgba(255,255,255,0.8)' }}>Garden of Cards</div>
          <div style={{ marginTop: 2, color: 'rgba(255,255,255,0.65)', fontSize: 11, letterSpacing: 0.5 }}>Dungeon expeditions & material recovery</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => setShowInventory(!showInventory)}
            className="garden-pearlescent-btn"
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              fontSize: 11,
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
            <span>{showInventory ? 'Dungeons' : `Inventory (${ownedMaterials.length})`}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Garden of Cards"
            className="garden-pearlescent-btn"
            style={{ width: 34, height: 34, borderRadius: 8, color: '#000', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ×
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', padding: '20px 32px 24px', gap: 24, minHeight: 0, overflow: 'hidden' }}>
        {showInventory ? (
          /* Inventory View */
          <section
            className="garden-pearlescent-card"
            style={{
              flex: 1,
              padding: 24,
              borderRadius: 14,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexShrink: 0 }}>
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
                  padding: '5px 12px',
                  borderRadius: 6,
                  color: '#000',
                  fontSize: 11,
                  cursor: 'pointer',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                Back to Dungeons
              </button>
            </div>

            {ownedMaterials.length > 0 ? (
              <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, alignContent: 'start', paddingRight: 4 }}>
                {ownedMaterials.map(item => (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 14,
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.05)',
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
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontStyle: 'italic' }}>
                No dungeon materials currently owned. Complete encounters in the Valley of Null to recover materials.
              </div>
            )}
          </section>
        ) : (
          /* Split Dungeon View */
          <>
            {/* Left Column: Dungeon Cover Card & Selector */}
            <div style={{ width: 'min(440px, 38vw)', display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0 }}>
              {/* Cover Card */}
              <div
                className="garden-pearlescent-card"
                style={{
                  borderRadius: 14,
                  position: 'relative',
                  overflow: 'hidden',
                  aspectRatio: '16/10',
                  background: `linear-gradient(180deg, rgba(6,7,12,0.1), rgba(6,7,12,0.9)), url("${selected.coverArt}") center / cover`,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.4)', padding: '3px 8px', borderRadius: 4, backdropFilter: 'blur(4px)' }}>
                    {selected.available ? 'AVAILABLE' : 'COMING SOON'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    onClick={() => move(-1)}
                    aria-label="Previous dungeon"
                    className="garden-pearlescent-btn"
                    style={{ width: 32, height: 32, borderRadius: 6, color: '#000', cursor: 'pointer', fontSize: 18, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ‹
                  </button>
                  <span style={{ fontFamily: uiTypography.display, fontSize: 22, letterSpacing: 1.5, textShadow: '0 0 16px rgba(255,255,255,0.9)', color: '#ffffff' }}>
                    {selected.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => move(1)}
                    aria-label="Next dungeon"
                    className="garden-pearlescent-btn"
                    style={{ width: 32, height: 32, borderRadius: 6, color: '#000', cursor: 'pointer', fontSize: 18, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ›
                  </button>
                </div>
              </div>

              {/* Dungeon Pills Selector */}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                {GARDEN_DUNGEONS.map((dungeon, idx) => (
                  <button
                    key={dungeon.id}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: idx === selectedIndex ? '1px solid rgba(255,255,255,0.9)' : '1px solid rgba(255,255,255,0.2)',
                      background: idx === selectedIndex ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                      color: idx === selectedIndex ? '#ffffff' : 'rgba(255,255,255,0.6)',
                      fontFamily: uiTypography.display,
                      fontSize: 11,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {dungeon.name}
                  </button>
                ))}
              </div>

              {/* Action Box / Active Run Controls */}
              {dungeonState.phase === 'active' && activeDungeon && activeEncounter ? (
                <div style={{ padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ color: '#ffffff', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: uiTypography.display }}>
                    Active expedition · Encounter {dungeonState.encounterIndex + 1} / {activeDungeon.encounters.length}
                  </div>
                  <div style={{ fontFamily: uiTypography.display, fontSize: 16, color: '#ffffff' }}>{activeEncounter.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
                    HP {dungeonState.encounterHp.toLocaleString()} / {dungeonState.encounterMaxHp.toLocaleString()} · {minutes}:{seconds}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      disabled={dungeonState.encounterHp > 0}
                      onClick={resolveGardenEncounter}
                      className={dungeonState.encounterHp <= 0 ? 'garden-pearlescent-btn' : ''}
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.65)',
                        background: dungeonState.encounterHp <= 0 ? undefined : 'rgba(255,255,255,0.06)',
                        color: dungeonState.encounterHp <= 0 ? '#000' : 'rgba(255,255,255,0.45)',
                        cursor: dungeonState.encounterHp <= 0 ? 'pointer' : 'not-allowed',
                        fontFamily: uiTypography.body,
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                      }}
                    >
                      {dungeonState.encounterHp > 0 ? 'Defeat in battle' : 'Claim Reward'}
                    </button>
                    <button
                      type="button"
                      onClick={exitGardenDungeon}
                      style={{
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.3)',
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.85)',
                        cursor: 'pointer',
                        fontFamily: uiTypography.body,
                        fontSize: 11,
                        textTransform: 'uppercase',
                      }}
                    >
                      Exit
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!selected.available}
                  onClick={() => { if (startGardenDungeon(selected.id)) onEnterDungeon?.(selected.id); }}
                  className="garden-pearlescent-btn"
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: 10,
                    cursor: selected.available ? 'pointer' : 'not-allowed',
                    fontFamily: uiTypography.body,
                    fontSize: 13,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    color: '#000',
                  }}
                >
                  {selected.available ? 'Enter Dungeon' : 'Unavailable'}
                </button>
              )}
            </div>

            {/* Right Column: Selected Dungeon Details */}
            <section
              className="garden-pearlescent-card"
              style={{
                flex: 1,
                padding: 24,
                borderRadius: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                minHeight: 0,
                overflowY: 'auto',
              }}
            >
              <div>
                <h1 style={{ margin: 0, fontFamily: uiTypography.display, fontSize: 24, letterSpacing: 1.5, color: '#ffffff', textShadow: '0 0 16px rgba(255,255,255,0.6)' }}>
                  {selected.name}
                </h1>
                <div style={{ marginTop: 4, color: '#e0ecff', fontSize: 12 }}>{selected.subtitle}</div>
                <p style={{ marginTop: 8, color: 'rgba(255,255,255,0.8)', fontSize: 12.5, lineHeight: 1.55 }}>{selected.description}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: uiTypography.display }}>
                  Expedition Encounters & Drops
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {selected.encounters.map((encounter, index) => encounter.reward && (
                    <div key={encounter.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>
                      <img src={rewardIconUrl(encounter.reward.artAssetKey)} alt="" width={36} height={36} style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid rgba(255,255,255,0.35)', boxShadow: '0 0 10px rgba(255,255,255,0.25)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>Encounter {index + 1}: {encounter.name}</div>
                        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 }}>
                          HP: {encounter.maxHp.toLocaleString()} · Drop: {GARDEN_REWARD_LABELS[encounter.reward.currency]}
                        </div>
                      </div>
                      <div style={{ color: '#ffffff', fontSize: 12, fontWeight: 600, textAlign: 'right', flexShrink: 0 }}>
                        <div>{Math.round(encounter.reward.chance * 100)}% chance</div>
                        <div style={{ fontSize: 10, color: '#91bfff', marginTop: 1 }}>Owned: {progress[encounter.reward.currency] ?? 0}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {dungeonState.phase === 'complete' && dungeonState.lastReward && (
                <div style={{ color: '#ffffff', fontSize: 12, background: 'rgba(255,255,255,0.08)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)' }}>
                  Run complete. Reward roll: +1 {GARDEN_REWARD_LABELS[dungeonState.lastReward]}.
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
