import { useState } from 'react';
import { useStore, selectBossFight, selectProgress } from '@/state/store';
import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';
import { CardRegistry } from '@/cards/CardRegistry';

const RARITY_COLORS: Record<string, string> = {
  Common: '#999', Rare: '#5b9bd5', Epic: '#9b59b6', Legendary: '#f39c12', Eternal: '#ff6b6b',
};

interface Props { onClose: () => void; }

export default function EternitysWake({ onClose }: Props) {
  const bossFight = useStore(selectBossFight);
  const progress = useStore(selectProgress);
  const startBossFight = useStore(s => s.startBossFight);
  const [selectedBossId, setSelectedBossId] = useState<string | null>(null);

  const now = Date.now();

  function getCooldownRemaining(bossId: string): number {
    const cd = bossFight.cooldowns[bossId] ?? 0;
    return Math.max(0, Math.ceil((cd - now) / 1000));
  }

  function handleChallenge(bossId: string, deckId: string) {
    startBossFight(bossId, deckId);
    onClose();
  }

  const hasSavedDecks = progress.savedDecks.length > 0;

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 50,
      display: 'flex', flexDirection: 'column', fontFamily: 'Georgia, serif', color: '#FFF8DC',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid rgba(255,107,107,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: '#ff6b6b', letterSpacing: 3 }}>
            ETERNITY'S WAKE
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,107,107,0.6)', marginTop: 2, letterSpacing: 1 }}>
            BOSS CHALLENGES — EARN BY THE ETERNAL INFINITY CARDS
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: '1px solid rgba(255,107,107,0.4)',
          color: '#ff6b6b', padding: '6px 14px', cursor: 'pointer',
          fontFamily: 'Georgia, serif', fontSize: 13, borderRadius: 6,
        }}>
          Close
        </button>
      </div>

      {/* Boss grid */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '24px',
        display: 'flex', flexWrap: 'wrap', gap: 20, alignContent: 'flex-start', justifyContent: 'center',
      }}>
        {BOSS_DEFINITIONS.map(boss => {
          const cooldown = getCooldownRemaining(boss.id);
          const onCooldown = cooldown > 0;
          const rewardDef = CardRegistry.get(boss.rewardCardId);
          const isSelected = selectedBossId === boss.id;

          return (
            <div key={boss.id} style={{
              width: 300, background: 'rgba(10,4,16,0.95)',
              border: `1px solid ${onCooldown ? 'rgba(255,107,107,0.2)' : 'rgba(255,107,107,0.5)'}`,
              borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12,
              opacity: onCooldown ? 0.65 : 1,
            }}>
              {/* Boss info */}
              <div style={{ borderBottom: '1px solid rgba(255,107,107,0.2)', paddingBottom: 10 }}>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#ff6b6b' }}>{boss.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,200,200,0.6)', marginTop: 4 }}>{boss.description}</div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <div style={{ color: 'rgba(255,150,150,0.8)' }}>HP: <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>{boss.hp.toLocaleString()}</span></div>
                <div style={{ color: 'rgba(255,150,150,0.6)' }}>30 second round</div>
              </div>

              {/* Reward card */}
              {rewardDef && (
                <div style={{
                  background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)',
                  borderRadius: 8, padding: '8px 12px',
                }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,150,150,0.5)', letterSpacing: 1 }}>REWARD</div>
                  <div style={{ fontSize: 13, color: '#ff6b6b', marginTop: 2 }}>{rewardDef.name}</div>
                  <div style={{ fontSize: 10, color: RARITY_COLORS[rewardDef.rarity], marginTop: 2 }}>
                    {rewardDef.rarity} · {rewardDef.type}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,200,200,0.5)', marginTop: 4 }}>
                    {rewardDef.description}
                  </div>
                </div>
              )}

              {/* Collection count */}
              {rewardDef && (
                <div style={{ fontSize: 11, color: 'rgba(255,150,150,0.5)' }}>
                  Owned: {progress.collection[boss.rewardCardId] ?? 0} / 4
                </div>
              )}

              {/* Cooldown or deck selector */}
              {onCooldown ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,107,107,0.6)', fontSize: 12 }}>
                  Cooldown: {Math.floor(cooldown / 60)}:{String(cooldown % 60).padStart(2, '0')}
                </div>
              ) : !isSelected ? (
                <button
                  onClick={() => setSelectedBossId(boss.id)}
                  style={{
                    background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.5)',
                    color: '#ff6b6b', padding: '8px 0', borderRadius: 6, cursor: 'pointer',
                    fontFamily: 'Georgia, serif', fontSize: 13, letterSpacing: 1,
                  }}
                >
                  Challenge
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,200,200,0.6)' }}>Select a deck:</div>
                  {!hasSavedDecks ? (
                    <div style={{ fontSize: 11, color: 'rgba(255,107,107,0.5)' }}>No saved decks found.</div>
                  ) : (
                    progress.savedDecks.map(deck => (
                      <button
                        key={deck.id}
                        onClick={() => handleChallenge(boss.id, deck.id)}
                        style={{
                          background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.35)',
                          color: '#ff9999', padding: '6px 10px', borderRadius: 5, cursor: 'pointer',
                          fontFamily: 'Georgia, serif', fontSize: 12, textAlign: 'left',
                        }}
                      >
                        {deck.name}
                        {deck.deckList.length > 0 ? ` (${deck.deckList.reduce((a, e) => a + e.copies, 0)} cards)` : ''}
                      </button>
                    ))
                  )}
                  <button
                    onClick={() => setSelectedBossId(null)}
                    style={{
                      background: 'none', border: 'none', color: 'rgba(255,150,150,0.4)',
                      cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 11, textAlign: 'left',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 24px', borderTop: '1px solid rgba(255,107,107,0.15)',
        fontSize: 11, color: 'rgba(255,150,150,0.4)', flexShrink: 0,
      }}>
        Boss fights last 30 seconds. All Oblivion earned deals damage instead. 60-second cooldown on success or failure.
      </div>
    </div>
  );
}
