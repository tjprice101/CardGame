import { useState } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import {
  FORGE_CARD_LORE,
  FORGE_CARD_SHARD_COST,
  FORGE_EVENT_BOSS_IDS,
  hasBeatenAllForgeEventBosses,
} from '@/data/forge/forgeDefinitions';
import { TRANSCENDENT_ABILITY } from '@/data/ascension/transcendentCards';
import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';
import { getLiveCardShimmerClassName } from '@/ui/cardBackgrounds';
import { uiTypography } from '@/ui/theme';

interface Props {
  onClose: () => void;
}

const RAINBOW_TEXT: React.CSSProperties = {
  backgroundImage: 'conic-gradient(from 180deg, #ff2fd0, #ff9d3d, #fff35c, #4dffb8, #4d9dff, #b24dff, #ff2fd0)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

/**
 * Forge of Transcendence — permanent, one-time-ever endgame gallery.
 * Locked until every current-event boss is beaten; opened by spending a
 * Key of Transcendence. Once open, showcases the 4 placeholder gallery
 * cards, each with its own banner/splash/lore sub-page.
 *
 * Layout is deliberately reminiscent of Duet Night Abyss's event page:
 * a vertical chapter list on the left, a big hero art panel in the
 * center, and a lore/info sidebar on the right.
 */
export default function ForgeOfTranscendence({ onClose }: Props) {
  const progress = useStore(selectProgress);
  const openForgeOfTranscendence = useStore(s => s.openForgeOfTranscendence);
  const purchaseForgeCardWithShards = useStore(s => s.purchaseForgeCardWithShards);
  const [selectedId, setSelectedId] = useState(FORGE_CARD_LORE[0]?.definitionId ?? '');

  const forgeUnlocked = progress.forgeOfTranscendenceUnlocked === true;
  const allBossesCleared = hasBeatenAllForgeEventBosses(progress.bossCodex);
  const keys = progress.keysOfTranscendence ?? 0;
  const shards = progress.shardsOfTranscendence ?? 0;
  const canOpen = allBossesCleared && keys >= 1 && !forgeUnlocked;

  const selectedLore = FORGE_CARD_LORE.find(entry => entry.definitionId === selectedId) ?? FORGE_CARD_LORE[0];
  const selectedDef = selectedLore ? CardRegistry.get(selectedLore.definitionId) : undefined;
  const ownedCopies = selectedLore ? (progress.transcendentCollection?.[selectedLore.definitionId] ?? 0) : 0;
  const canAcquire = shards >= FORGE_CARD_SHARD_COST;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.9), rgba(255,255,255,0.98) 55%, #ffffff 100%)',
      color: '#15101c', fontFamily: uiTypography.body, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        padding: '18px 32px', borderBottom: '1px solid rgba(20,10,30,0.12)', flexShrink: 0,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.98) 0%, rgba(245,238,255,0.9) 100%)',
      }}>
        <div>
          <div style={{ fontFamily: uiTypography.display, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(20,10,30,0.5)' }}>Beyond All Sets</div>
          <div style={{ fontFamily: uiTypography.display, fontSize: 26, letterSpacing: 2, textTransform: 'uppercase', ...RAINBOW_TEXT }}>Forge of Transcendence</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={`${import.meta.env.BASE_URL}assets/forge/shards-of-transcendence.png`} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: uiTypography.display, fontSize: 16 }}>{shards}</div>
              <div style={{ fontSize: 9, letterSpacing: 0.7, textTransform: 'uppercase', color: 'rgba(20,10,30,0.5)' }}>Shards of Transcendence</div>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close Forge of Transcendence" style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(20,10,30,0.18)', background: '#fff', color: '#15101c', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
      </header>

      {!forgeUnlocked ? (
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, padding: 32 }}>
          <div style={{ fontSize: 15, letterSpacing: 1, color: 'rgba(20,10,30,0.7)', textAlign: 'center', maxWidth: 520 }}>
            The Forge answers to no set and no master. It will open only once every boss of the current event has fallen.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 'min(420px, 90vw)' }}>
            {FORGE_EVENT_BOSS_IDS.map(bossId => {
              const boss = BOSS_DEFINITIONS.find(b => b.id === bossId);
              const cleared = progress.bossCodex?.[bossId] !== undefined;
              return (
                <div key={bossId} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  padding: '10px 14px', borderRadius: 8,
                  border: `1px solid ${cleared ? 'rgba(160,90,255,0.4)' : 'rgba(20,10,30,0.12)'}`,
                  background: cleared ? 'linear-gradient(90deg, rgba(220,200,255,0.3), rgba(255,255,255,0.4))' : 'rgba(20,10,30,0.03)',
                }}>
                  <span style={{ fontSize: 13 }}>{boss?.name ?? bossId}</span>
                  <span style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: cleared ? '#8a4dff' : 'rgba(20,10,30,0.4)' }}>{cleared ? 'Beaten' : 'Locked'}</span>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => openForgeOfTranscendence()}
            disabled={!canOpen}
            style={{
              marginTop: 10, padding: '14px 40px', borderRadius: 999,
              border: '1px solid rgba(160,90,255,0.6)',
              background: canOpen ? 'conic-gradient(from 180deg, #ff2fd0, #ff9d3d, #fff35c, #4dffb8, #4d9dff, #b24dff, #ff2fd0)' : 'rgba(20,10,30,0.08)',
              color: canOpen ? '#15101c' : 'rgba(20,10,30,0.4)',
              fontFamily: uiTypography.display, fontSize: 14, letterSpacing: 2, textTransform: 'uppercase',
              cursor: canOpen ? 'pointer' : 'not-allowed',
            }}
          >
            {allBossesCleared ? (keys >= 1 ? 'Open the Forge' : 'Awaiting a Key of Transcendence') : `Requires every boss beaten (${FORGE_EVENT_BOSS_IDS.filter(id => progress.bossCodex?.[id] !== undefined).length}/${FORGE_EVENT_BOSS_IDS.length})`}
          </button>
        </main>
      ) : (
        <main style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* Left: chapter list */}
          <nav style={{ width: 220, flexShrink: 0, borderRight: '1px solid rgba(20,10,30,0.1)', padding: '18px 10px', overflowY: 'auto' }}>
            {FORGE_CARD_LORE.map(entry => {
              const isSelected = entry.definitionId === selectedId;
              return (
                <button
                  key={entry.definitionId}
                  type="button"
                  onClick={() => setSelectedId(entry.definitionId)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px', marginBottom: 6,
                    borderRadius: 8, border: isSelected ? '1px solid rgba(160,90,255,0.55)' : '1px solid transparent',
                    backgroundImage: `linear-gradient(90deg, rgba(255,255,255,${isSelected ? 0.55 : 0.8}) 0%, rgba(255,255,255,${isSelected ? 0.4 : 0.72}) 62%, rgba(255,255,255,0.35) 100%), ${entry.navBannerImage}`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    cursor: 'pointer', fontFamily: uiTypography.body,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: '#15101c' }}>{entry.displayName}</div>
                  <div style={{ marginTop: 2, fontSize: 10, color: 'rgba(20,10,30,0.7)', lineHeight: 1.3 }}>{entry.tagline}</div>
                </button>
              );
            })}
          </nav>

          {/* Center: hero splash art */}
          <div style={{
            flex: 1, position: 'relative',
            backgroundImage: `linear-gradient(0deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.55) 30%, rgba(255,255,255,0) 58%), ${selectedLore?.splashGradient}`,
            backgroundSize: 'cover', backgroundPosition: 'center bottom',
            display: 'flex', alignItems: 'flex-end', padding: 28,
          }}>
            <div
              className={selectedDef ? getLiveCardShimmerClassName(selectedDef, 'normal', 'front') : undefined}
              style={{
                width: 200, aspectRatio: '148 / 204', borderRadius: 14, backgroundImage: selectedLore?.bannerGradient,
                backgroundSize: 'cover', backgroundPosition: 'center',
                boxShadow: '0 20px 60px rgba(120,60,220,0.35)', border: '2px solid rgba(255,255,255,0.9)',
              }}
            />
            <div style={{ marginLeft: 24 }}>
              <div style={{ fontFamily: uiTypography.display, fontSize: 30, letterSpacing: 1.5, color: '#15101c', textShadow: '0 2px 18px rgba(255,255,255,0.95), 0 1px 4px rgba(255,255,255,0.9)' }}>{selectedLore?.displayName}</div>
              <div style={{ marginTop: 4, fontSize: 13, color: 'rgba(20,10,30,0.8)', maxWidth: 420, textShadow: '0 1px 10px rgba(255,255,255,0.9)' }}>{selectedLore?.tagline}</div>
            </div>
          </div>

          {/* Right: lore + info sidebar */}
          <aside style={{ width: 340, flexShrink: 0, borderLeft: '1px solid rgba(20,10,30,0.1)', padding: 24, overflowY: 'auto' }}>
            <div style={{ fontFamily: uiTypography.display, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', ...RAINBOW_TEXT, marginBottom: 8 }}>Lore</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(20,10,30,0.82)' }}>{selectedLore?.lore}</div>

            <div style={{ marginTop: 22, fontFamily: uiTypography.display, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(20,10,30,0.5)' }}>Transcendent Ability</div>
            <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'rgba(20,10,30,0.7)', fontStyle: 'italic' }}>
              If this card is in your deck, your maximum hand size is now 10.
            </div>

            <div style={{ marginTop: 20, fontFamily: uiTypography.display, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(20,10,30,0.5)' }}>Effect</div>
            <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'rgba(20,10,30,0.82)' }}>
              {selectedDef?.description?.replace(TRANSCENDENT_ABILITY, '').trim() || 'To be redesigned.'}
            </div>

            <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(20,10,30,0.12)', background: 'rgba(20,10,30,0.02)' }}>
                <div style={{ fontFamily: uiTypography.display, fontSize: 16 }}>{ownedCopies}</div>
                <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(20,10,30,0.5)' }}>Owned</div>
              </div>
              <div style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(20,10,30,0.12)', background: 'rgba(20,10,30,0.02)' }}>
                <div style={{ fontFamily: uiTypography.display, fontSize: 16 }}>{selectedDef?.type ?? '—'}</div>
                <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(20,10,30,0.5)' }}>Identity</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => selectedLore && purchaseForgeCardWithShards(selectedLore.definitionId)}
              disabled={!canAcquire}
              style={{
                marginTop: 12, width: '100%', padding: '12px 16px', borderRadius: 8,
                border: '1px solid rgba(160,90,255,0.5)',
                background: canAcquire ? 'linear-gradient(90deg, rgba(220,200,255,0.5), rgba(255,255,255,0.6))' : 'rgba(20,10,30,0.04)',
                color: canAcquire ? '#15101c' : 'rgba(20,10,30,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: uiTypography.display, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase',
                cursor: canAcquire ? 'pointer' : 'not-allowed',
              }}
            >
              <img src={`${import.meta.env.BASE_URL}assets/forge/shards-of-transcendence.png`} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
              Acquire 1 Copy · {FORGE_CARD_SHARD_COST} Shards of Transcendence
            </button>
          </aside>
        </main>
      )}
    </div>
  );
}
