import { useState, lazy, Suspense } from 'react';
import { useStore, selectProgress, selectBossFight } from '@/state/store';
import { useSocialStore, selectSocialStatus } from '@/state/socialStore';
import { getGauntletMasteryPerCard, getResonanceVictoryLine, previewMasteryReward } from '@/systems/progression/cardMastery';

const FriendsLeaderboard = lazy(() => import('@/ui/social/FriendsLeaderboard'));

interface Props {
  onClose: () => void;
}

const EW = {
  accent: '#ff6b6b',
  accentSoft: '#ff9090',
  violet: '#c2a8ff',
  gold: '#ffd87a',
  text: '#FFF8DC',
  textMuted: 'rgba(255, 200, 200, 0.62)',
  panelBg: 'linear-gradient(180deg, rgba(8, 4, 12, 0.985) 0%, rgba(22, 8, 30, 0.985) 100%)',
  border: 'rgba(255, 107, 107, 0.45)',
  borderStrong: 'rgba(255, 107, 107, 0.75)',
};

export default function EndlessGauntletModal({ onClose }: Props) {
  const progress = useStore(selectProgress);
  const bossFight = useStore(selectBossFight);
  const startEndlessGauntlet = useStore(s => s.startEndlessGauntlet);
  const socialStatus = useSocialStore(selectSocialStatus);
  const [selectedDeckId, setSelectedDeckId] = useState<string>(progress.savedDecks[0]?.id ?? '');

  const hasDecks = progress.savedDecks.length > 0;
  const gauntletActive = bossFight.mode === 'active' && bossFight.kind === 'gauntlet';
  const currentDepth = bossFight.gauntletDepth ?? 0;
  const banked = bossFight.gauntletShardsBanked ?? 0;
  const selectedDeck = progress.savedDecks.find(d => d.id === selectedDeckId) ?? null;
  const gauntletMasteryPerCard = getGauntletMasteryPerCard(currentDepth);
  const gauntletRewardPreview = selectedDeck
    ? previewMasteryReward(progress, selectedDeck.deckList, selectedDeck.extraDeck ?? [], gauntletMasteryPerCard)
    : null;

  function launch() {
    if (!selectedDeckId) return;
    startEndlessGauntlet(selectedDeckId);
    onClose();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 12%, rgba(140, 90, 255, 0.16) 0%, rgba(140, 90, 255, 0) 42%), linear-gradient(180deg, rgba(6, 2, 8, 0.97) 0%, rgba(16, 6, 18, 0.98) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, pointerEvents: 'auto', fontFamily: 'Georgia, serif',
        animation: 'backdropFade 0.32s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          background: EW.panelBg,
          border: `1px solid ${EW.border}`,
          borderRadius: 18,
          padding: '24px 28px 20px',
          width: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 50px rgba(140, 90, 255, 0.16)',
          animation: 'panelSlideUp 0.42s cubic-bezier(.16,.84,.44,1)',
        }}
      >
        {/* Spiral crown ornament */}
        <div style={{
          position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
          width: 110, height: 3,
          background: `linear-gradient(90deg, transparent, ${EW.violet}, transparent)`,
          borderRadius: 2,
          boxShadow: `0 0 14px ${EW.violet}aa`,
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: 4,
        }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: EW.textMuted, textTransform: 'uppercase' }}>Eternity's Wake</div>
            <div style={{
              fontSize: 24, fontWeight: 'bold', color: EW.accent,
              letterSpacing: 4, textTransform: 'uppercase',
              textShadow: `0 0 18px ${EW.accent}99, 0 2px 4px rgba(0,0,0,0.8)`,
            }}>Endless Gauntlet</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: `1px solid ${EW.border}`,
              color: EW.accentSoft, width: 32, height: 32, borderRadius: 8,
              fontSize: 16, cursor: 'pointer', fontFamily: 'Georgia, serif',
            }}
          >×</button>
        </div>

        <div style={{
          fontSize: 11, color: EW.textMuted, fontStyle: 'italic',
          marginBottom: 16, lineHeight: 1.55,
          borderTop: `1px solid ${EW.border}`,
          paddingTop: 10, marginTop: 12,
        }}>
          Descend through an unbroken chain of bosses. No restoration between fights. Every clear deepens the abyss.
        </div>

        {/* Active run banner */}
        {gauntletActive ? (
          <div
            style={{
              position: 'relative',
              padding: '14px 16px',
              background: 'linear-gradient(135deg, rgba(140, 90, 255, 0.18), rgba(50, 20, 60, 0.55))',
              border: `1.5px solid rgba(140, 90, 255, 0.55)`,
              borderRadius: 12,
              marginBottom: 16,
              boxShadow: '0 0 24px rgba(140, 90, 255, 0.25), inset 0 0 22px rgba(0,0,0,0.35)',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent, ${EW.violet}, transparent)`,
              animation: 'ewRankShimmer 3.5s linear infinite',
              backgroundSize: '200% 100%',
            }} />
            <div style={{
              fontSize: 9, color: EW.violet, letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: 'bold',
            }}>Run in Progress</div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8,
            }}>
              <BigStat label="Depth" value={`${currentDepth + 1}`} color={EW.violet} />
              <BigStat label="Shards Banked" value={banked.toLocaleString()} color={EW.gold} align="right" />
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
            marginBottom: 16,
          }}>
            <RuleBox label="HP" detail="+10% per depth" />
            <RuleBox label="Shards" detail="Bank on every clear" />
            <RuleBox label="No Restore" detail="HP & timer carry" />
          </div>
        )}

        {/* Deck picker */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
            color: EW.accentSoft, marginBottom: 6, fontWeight: 'bold',
          }}>Vessel (Deck)</div>
          {hasDecks ? (
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: `1px solid ${EW.border}`,
                background: 'rgba(0,0,0,0.45)',
                color: EW.text,
                fontFamily: 'Georgia, serif',
                fontSize: 12,
                outline: 'none',
              }}
            >
              {progress.savedDecks.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          ) : (
            <div style={{ fontSize: 11, color: EW.textMuted, fontStyle: 'italic', padding: '8px 0' }}>
              Save a deck before descending into the gauntlet.
            </div>
          )}
        </div>

        {selectedDeck && gauntletRewardPreview && (
          <div style={{
            marginBottom: 16, padding: '10px 12px',
            background: 'rgba(140, 90, 255, 0.08)',
            border: `1px solid rgba(194, 168, 255, 0.32)`,
            borderRadius: 10,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 2.4, color: EW.violet, textTransform: 'uppercase', marginBottom: 4 }}>
                Opening Reward Preview
              </div>
              <div style={{ fontSize: 11, color: EW.gold, fontWeight: 'bold', lineHeight: 1.35 }}>{getResonanceVictoryLine(gauntletMasteryPerCard)}</div>
              <div style={{ fontSize: 10, color: EW.textMuted, marginTop: 3 }}>Depth {currentDepth} formula: min(20, max(5, depth × 6))</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, letterSpacing: 2.4, color: '#8ce6ff', textTransform: 'uppercase', marginBottom: 4 }}>
                Resonance Now
              </div>
              <div style={{ fontSize: 15, color: '#8ce6ff', fontWeight: 'bold' }}>+{gauntletRewardPreview.resonanceGain.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: EW.textMuted, marginTop: 3 }}>{gauntletRewardPreview.cardsTieredUp} tier-up{gauntletRewardPreview.cardsTieredUp === 1 ? '' : 's'} on clear</div>
            </div>
          </div>
        )}

        {/* Personal bests */}
        <div style={{
          marginBottom: 14, padding: '10px 12px',
          background: 'rgba(140, 90, 255, 0.08)',
          border: `1px solid rgba(194, 168, 255, 0.32)`,
          borderRadius: 10,
        }}>
          <div style={{ fontSize: 9, letterSpacing: 2.4, color: EW.violet, textTransform: 'uppercase', marginBottom: 6 }}>
            Personal Bests
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, gap: 12 }}>
            <div>
              <div style={{ color: EW.textMuted, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.4 }}>Depth</div>
              <div style={{ color: EW.gold, fontWeight: 'bold' }}>{progress.gauntletBest?.bestDepth ?? 0}</div>
            </div>
            <div>
              <div style={{ color: EW.textMuted, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.4 }}>Shards / Run</div>
              <div style={{ color: EW.gold, fontWeight: 'bold' }}>{progress.gauntletBest?.bestShards ?? 0}</div>
            </div>
            <div>
              <div style={{ color: EW.textMuted, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.4 }}>Runs</div>
              <div style={{ color: EW.gold, fontWeight: 'bold' }}>{progress.gauntletBest?.runs ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Friends leaderboard (Phase 5). Renders only when authenticated. */}
        {socialStatus === 'authenticated' && (
          <div style={{
            marginBottom: 14, padding: '10px 12px',
            background: 'rgba(140, 90, 255, 0.08)',
            border: `1px solid rgba(194, 168, 255, 0.32)`,
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 9, letterSpacing: 2.4, color: EW.violet, textTransform: 'uppercase', marginBottom: 6 }}>
              Friends Leaderboard
            </div>
            <Suspense fallback={<div style={{ fontSize: 10, color: EW.textMuted, fontStyle: 'italic' }}>Loading…</div>}>
              <FriendsLeaderboard metrics={['gauntletDepth', 'gauntletShards']} />
            </Suspense>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={launch}
          disabled={!hasDecks || gauntletActive}
          style={{
            width: '100%',
            background: hasDecks && !gauntletActive
              ? `linear-gradient(180deg, ${EW.accent} 0%, #c33b3b 100%)`
              : 'rgba(40, 16, 24, 0.5)',
            color: hasDecks && !gauntletActive ? '#fff' : EW.textMuted,
            border: `1px solid ${hasDecks && !gauntletActive ? EW.borderStrong : EW.border}`,
            borderRadius: 10,
            padding: '14px 18px',
            fontFamily: 'Georgia, serif',
            fontSize: 16,
            fontWeight: 'bold',
            letterSpacing: 4,
            textTransform: 'uppercase',
            cursor: hasDecks && !gauntletActive ? 'pointer' : 'not-allowed',
            boxShadow: hasDecks && !gauntletActive
              ? `0 0 22px ${EW.accent}88, inset 0 1px 0 rgba(255,255,255,0.18)`
              : 'none',
            textShadow: hasDecks && !gauntletActive ? '0 1px 2px rgba(0,0,0,0.5)' : undefined,
            transition: 'all 0.2s ease',
          }}
        >
          {gauntletActive ? 'Gauntlet Already Active' : 'Descend Into the Wake'}
        </button>
      </div>
    </div>
  );
}

function BigStat({ label, value, color, align }: { label: string; value: string; color: string; align?: 'left' | 'right' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      <span style={{ fontSize: 9, letterSpacing: 1.5, color: EW.textMuted, textTransform: 'uppercase' }}>{label}</span>
      <span style={{
        fontSize: 22, color, fontWeight: 'bold',
        fontVariantNumeric: 'tabular-nums',
        textShadow: `0 0 12px ${color}88`,
        letterSpacing: 1.5,
      }}>{value}</span>
    </div>
  );
}

function RuleBox({ label, detail }: { label: string; detail: string }) {
  return (
    <div style={{
      padding: '8px 10px',
      borderRadius: 8,
      background: 'rgba(20, 8, 16, 0.55)',
      border: `1px solid ${EW.border}`,
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase',
        color: EW.accentSoft, fontWeight: 'bold',
      }}>{label}</div>
      <div style={{ fontSize: 10, color: EW.text, marginTop: 3, lineHeight: 1.3 }}>{detail}</div>
    </div>
  );
}
