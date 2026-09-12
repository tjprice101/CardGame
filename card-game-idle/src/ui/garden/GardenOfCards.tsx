import { useRef, useState } from 'react';
import { GARDEN_DUNGEONS, GARDEN_REWARD_LABELS } from '@/data/dungeons/gardenDungeonDefinitions';
import { useStore, selectProgress } from '@/state/store';
import { uiTypography } from '@/ui/theme';

interface Props { onClose: () => void }

const PLACEHOLDER_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='%23ffffff'/%3E%3C/svg%3E";

export default function GardenOfCards({ onClose }: Props) {
  const progress = useStore(selectProgress);
  const dungeonState = useStore(state => state.gardenDungeon);
  const startGardenDungeon = useStore(state => state.startGardenDungeon);
  const resolveGardenEncounter = useStore(state => state.resolveGardenEncounter);
  const exitGardenDungeon = useStore(state => state.exitGardenDungeon);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = GARDEN_DUNGEONS[selectedIndex] ?? GARDEN_DUNGEONS[0];
  const activeDungeon = dungeonState.dungeonId ? GARDEN_DUNGEONS.find(dungeon => dungeon.id === dungeonState.dungeonId) : null;
  const activeEncounter = activeDungeon?.encounters[dungeonState.encounterIndex];
  const minutes = Math.floor(dungeonState.timeRemainingSeconds / 60);
  const seconds = Math.floor(dungeonState.timeRemainingSeconds % 60).toString().padStart(2, '0');

  const move = (direction: number) => {
    const next = Math.max(0, Math.min(GARDEN_DUNGEONS.length - 1, selectedIndex + direction));
    setSelectedIndex(next);
    scrollerRef.current?.children[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.12), transparent 40%), linear-gradient(145deg, rgba(8,10,18,0.98), rgba(14,18,32,0.98))', color: '#eef4ff', fontFamily: uiTypography.body, overflowY: 'auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '26px clamp(18px, 5vw, 64px) 12px', maxWidth: 1180, margin: '0 auto' }}>
        <div>
          <div style={{ fontFamily: uiTypography.display, fontSize: 28, letterSpacing: 1.5 }}>Garden of Cards</div>
          <div style={{ marginTop: 5, color: 'rgba(238,244,255,0.58)', fontSize: 12 }}>Dungeon expeditions and material recovery</div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close Garden of Cards" style={{ width: 34, height: 34, borderRadius: 6, border: '1px solid rgba(255,255,255,0.32)', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontSize: 18 }}>×</button>
      </header>
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '12px clamp(12px, 4vw, 48px) 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ color: 'rgba(238,244,255,0.58)', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>Select a dungeon</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => move(-1)} aria-label="Previous dungeon" style={navStyle}>‹</button>
            <button type="button" onClick={() => move(1)} aria-label="Next dungeon" style={navStyle}>›</button>
          </div>
        </div>
        <div ref={scrollerRef} onWheel={event => { if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) move(event.deltaY > 0 ? 1 : -1); }} style={{ display: 'flex', gap: 16, overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '12px calc(50% - min(40vw, 330px)) 20px', scrollbarWidth: 'thin' }}>
          {GARDEN_DUNGEONS.map((dungeon, index) => (
            <button key={dungeon.id} type="button" onClick={() => { setSelectedIndex(index); scrollerRef.current?.children[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); }} style={{ flex: '0 0 min(80vw, 660px)', aspectRatio: '1.55', scrollSnapAlign: 'center', borderRadius: 12, border: index === selectedIndex ? '1px solid rgba(255,255,255,0.9)' : '1px solid rgba(255,255,255,0.2)', background: `linear-gradient(180deg, rgba(8,10,18,0.12), rgba(8,10,18,0.86)), url("${dungeon.coverArt}") center / cover`, boxShadow: index === selectedIndex ? '0 0 0 2px rgba(255,255,255,0.15), 0 0 36px rgba(255,255,255,0.2)' : '0 12px 25px rgba(0,0,0,0.35)', color: '#fff', textAlign: 'left', padding: 24, cursor: 'pointer', opacity: dungeon.available ? 1 : 0.48, position: 'relative' }}>
              <span style={{ position: 'absolute', top: 16, right: 16, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase' }}>{dungeon.available ? 'Available' : 'Coming soon'}</span>
              <span style={{ position: 'absolute', left: 24, bottom: 22, fontFamily: uiTypography.display, fontSize: 24, letterSpacing: 1 }}>{dungeon.name}</span>
            </button>
          ))}
        </div>
        <section style={{ maxWidth: 760, margin: '8px auto 0', padding: 22, borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(14,18,32,0.78)' }}>
          <h1 style={{ margin: 0, fontFamily: uiTypography.display, fontSize: 22 }}>{selected.name}</h1>
          <div style={{ marginTop: 5, color: '#b9d9ff', fontSize: 11 }}>{selected.subtitle}</div>
          <p style={{ color: 'rgba(238,244,255,0.7)', fontSize: 12, lineHeight: 1.55 }}>{selected.description}</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {selected.encounters.map((encounter, index) => encounter.reward && (
              <div key={encounter.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <img src={PLACEHOLDER_ICON} alt="" width={28} height={28} style={{ width: 28, height: 28, borderRadius: 4, opacity: 0.8 }} />
                <div style={{ flex: 1 }}><div style={{ fontSize: 11 }}>Encounter {index + 1}: {encounter.name}</div><div style={{ color: 'rgba(238,244,255,0.52)', fontSize: 10 }}>Reward: {GARDEN_REWARD_LABELS[encounter.reward.currency]}</div></div>
                <div style={{ color: '#fff', fontSize: 11 }}>{Math.round(encounter.reward.chance * 100)}% · Owned {progress[encounter.reward.currency] ?? 0}</div>
              </div>
            ))}
          </div>
          {dungeonState.phase === 'active' && activeDungeon && activeEncounter ? (
            <div style={{ marginTop: 18, padding: 14, borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ color: '#b9d9ff', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' }}>Active expedition · Encounter {dungeonState.encounterIndex + 1} / {activeDungeon.encounters.length}</div>
              <div style={{ marginTop: 7, fontFamily: uiTypography.display, fontSize: 18 }}>{activeEncounter.name}</div>
              <div style={{ marginTop: 4, color: 'rgba(238,244,255,0.62)', fontSize: 11 }}>Encounter HP {dungeonState.encounterHp.toLocaleString()} / {dungeonState.encounterMaxHp.toLocaleString()} · Time remaining {minutes}:{seconds}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button type="button" disabled={dungeonState.encounterHp > 0} onClick={resolveGardenEncounter} style={{ flex: 1, padding: '9px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.65)', background: dungeonState.encounterHp <= 0 ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)', color: '#fff', cursor: dungeonState.encounterHp <= 0 ? 'pointer' : 'not-allowed', opacity: dungeonState.encounterHp <= 0 ? 1 : 0.45, fontFamily: uiTypography.body }}>{dungeonState.encounterHp > 0 ? 'Defeat the encounter in battle' : 'Claim Encounter Reward'}</button>
                <button type="button" onClick={exitGardenDungeon} style={{ padding: '9px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.28)', background: 'transparent', color: 'rgba(238,244,255,0.72)', cursor: 'pointer', fontFamily: uiTypography.body }}>Exit</button>
              </div>
            </div>
          ) : (
            <button type="button" disabled={!selected.available} onClick={() => startGardenDungeon(selected.id)} style={{ marginTop: 18, width: '100%', padding: '12px 16px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.7)', background: selected.available ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)', color: '#fff', cursor: selected.available ? 'pointer' : 'not-allowed', fontFamily: uiTypography.body, fontSize: 12 }}>{selected.available ? 'Enter Dungeon' : 'Unavailable'}</button>
          )}
          {dungeonState.phase === 'complete' && dungeonState.lastReward && (
            <div style={{ marginTop: 12, color: '#b9f5c5', fontSize: 11 }}>Run complete. Reward roll: {GARDEN_REWARD_LABELS[dungeonState.lastReward]}.</div>
          )}
        </section>
      </main>
    </div>
  );
}

const navStyle: React.CSSProperties = { width: 30, height: 30, borderRadius: 5, border: '1px solid rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontSize: 20, lineHeight: 1 };
