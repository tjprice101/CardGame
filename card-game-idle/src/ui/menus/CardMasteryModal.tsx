import { useMemo, useState } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { warmTheme } from '@/ui/theme';
import { CardRegistry } from '@/cards/CardRegistry';
import { MASTERY_TIERS, getMasteryClaimKey, listMasteryProgress } from '@/systems/progression/cardMastery';

interface Props {
  onClose: () => void;
}

export default function CardMasteryModal({ onClose }: Props) {
  const progress = useStore(selectProgress);
  const claimCardMastery = useStore(s => s.claimCardMastery);
  const [filter, setFilter] = useState<'all' | 'claimable' | 'in-progress'>('all');

  const masteryList = useMemo(() => listMasteryProgress(progress), [progress]);

  // Aggregate currently-claimable rewards across all cards. Mirrors the
  // logic in `claimAllAvailableMastery` so the button can display a preview.
  const claimableSummary = useMemo(() => {
    let tiersClaimable = 0;
    let shardsClaimable = 0;
    for (const m of masteryList) {
      for (const tier of m.unclaimedTiers) {
        tiersClaimable += 1;
        shardsClaimable += tier.shardReward;
      }
    }
    return { tiersClaimable, shardsClaimable };
  }, [masteryList]);

  const claimAllAvailableMastery = useStore(s => s.claimAllAvailableMastery);

  const filtered = useMemo(() => {
    if (filter === 'all') return masteryList;
    if (filter === 'claimable') {
      return masteryList.filter(m => m.unclaimedTiers.length > 0);
    }
    return masteryList.filter(m => m.count > 0);
  }, [masteryList, filter, progress.cardMasteryClaims]);

  return (
    <Backdrop onClose={onClose}>
      <Panel>
        <Header title="Card Mastery" onClose={onClose} />
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' }}>
          {(['all', 'claimable', 'in-progress'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '4px 10px', borderRadius: 6,
                fontFamily: 'Georgia, serif', fontSize: 11,
                background: filter === f ? warmTheme.accentSoft : 'rgba(0,0,0,0.04)',
                color: filter === f ? warmTheme.accentDeep : warmTheme.textMuted,
                border: `1px solid ${warmTheme.border}`,
                cursor: 'pointer',
              }}
            >{f}</button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            onClick={() => claimAllAvailableMastery()}
            disabled={claimableSummary.tiersClaimable === 0}
            style={{
              padding: '5px 12px', borderRadius: 6,
              fontFamily: 'Georgia, serif', fontSize: 11, fontWeight: 'bold',
              background: claimableSummary.tiersClaimable > 0 ? warmTheme.accent : 'rgba(0,0,0,0.05)',
              color: claimableSummary.tiersClaimable > 0 ? '#fff' : warmTheme.textMuted,
              border: `1px solid ${warmTheme.border}`,
              cursor: claimableSummary.tiersClaimable > 0 ? 'pointer' : 'not-allowed',
            }}
            title={claimableSummary.tiersClaimable > 0
              ? `Claim ${claimableSummary.tiersClaimable} tier${claimableSummary.tiersClaimable === 1 ? '' : 's'} for +${claimableSummary.shardsClaimable} shards`
              : 'No mastery rewards ready to claim.'}
          >
            Claim All {claimableSummary.tiersClaimable > 0 ? `(+${claimableSummary.shardsClaimable})` : ''}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.length === 0 && (
            <div style={{ fontSize: 12, color: warmTheme.textMuted, fontStyle: 'italic', padding: 16, textAlign: 'center' }}>
              No cards match this filter.
            </div>
          )}
          {filtered.map(m => {
            const def = CardRegistry.get(m.definitionId);
            if (!def) return null;
            return (
              <div key={m.definitionId} style={{
                padding: '8px 10px',
                background: 'rgba(0,0,0,0.04)',
                border: `1px solid ${warmTheme.border}`,
                borderRadius: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 'bold', color: warmTheme.text }}>{def.name}</div>
                  <div style={{ fontSize: 11, color: warmTheme.textMuted }}>{m.count.toLocaleString()} plays</div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {MASTERY_TIERS.map(tier => {
                    const reached = m.count >= tier.threshold;
                    const claimKey = getMasteryClaimKey(m.definitionId, tier.tier);
                    const claimed = !!progress.cardMasteryClaims[claimKey];
                    return (
                      <button
                        key={tier.tier}
                        onClick={() => claimCardMastery(m.definitionId, tier.tier)}
                        disabled={!reached || claimed}
                        title={`${tier.label} — ${tier.threshold.toLocaleString()} plays`}
                        style={{
                          flex: 1,
                          padding: '3px 6px', borderRadius: 5,
                          fontSize: 10, fontFamily: 'Georgia, serif',
                          background: claimed
                            ? 'rgba(0,0,0,0.06)'
                            : reached
                              ? warmTheme.accent
                              : 'rgba(0,0,0,0.03)',
                          color: claimed
                            ? warmTheme.textMuted
                            : reached
                              ? '#fff'
                              : warmTheme.textMuted,
                          border: `1px solid ${warmTheme.border}`,
                          cursor: reached && !claimed ? 'pointer' : 'not-allowed',
                          opacity: claimed ? 0.55 : 1,
                        }}
                      >
                        T{tier.tier} (+{tier.shardReward})
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </Backdrop>
  );
}

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(circle at 50% 14%, rgba(201, 170, 112, 0.2) 0%, rgba(201, 170, 112, 0) 36%), linear-gradient(180deg, rgba(16, 18, 23, 0.965) 0%, rgba(19, 24, 31, 0.965) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, pointerEvents: 'auto', fontFamily: 'Georgia, serif',
    }}>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="ui-panel-intro" style={{
      background: warmTheme.surfaceStrong,
      border: `1px solid ${warmTheme.borderStrong}`,
      borderRadius: 16,
      padding: '20px 24px',
      width: 480,
      maxHeight: '88vh',
      overflowY: 'auto',
      boxShadow: warmTheme.shadow,
      position: 'relative',
      ['--ui-accent' as any]: '230, 196, 132',
      ['--ui-accent-soft' as any]: '250, 224, 184',
    } as React.CSSProperties}>{children}</div>
  );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="ui-shimmer-band" style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 14, borderBottom: `1px solid ${warmTheme.border}`, paddingBottom: 10,
      position: 'relative',
    }}>
      <div className="ui-title-glow" style={{ fontSize: 18, fontWeight: 'bold', color: warmTheme.accentDeep, letterSpacing: 2 }}>{title}</div>
      <button onClick={onClose} style={{
        background: 'transparent', border: 'none', color: warmTheme.textMuted,
        fontSize: 18, cursor: 'pointer', padding: '0 4px',
      }}>X</button>
    </div>
  );
}
