import { useMemo, useState } from 'react';
import { useStore, selectProgress, selectComputedStats } from '@/state/store';
import { uiTypography } from '@/ui/theme';
import { CardRegistry } from '@/cards/CardRegistry';
import { MASTERY_TIERS, getMasteryClaimKey, listMasteryProgress } from '@/systems/progression/cardMastery';
import type { MasteryView } from '@/systems/progression/cardMastery';
import VirtualizedList from '@/ui/components/VirtualizedList';

interface Props {
  onClose: () => void;
}

// ── Design palette ────────────────────────────────────────────────────────────
const P = {
  bg: 'linear-gradient(160deg, #040a15 0%, #060e1c 50%, #030810 100%)',
  glow: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(78,158,220,0.22) 0%, transparent 60%)',
  panel: 'rgba(6,14,30,0.72)',
  panelStrong: 'rgba(72,148,210,0.09)',
  border: 'rgba(110,160,215,0.32)',
  borderStrong: 'rgba(72,128,190,0.58)',
  accent: '#72caf5',
  accentDeep: '#1e5890',
  accentGlow: 'rgba(88,180,235,0.45)',
  gold: '#96daff',
  text: '#f0f6ff',
  textMuted: 'rgba(205,228,255,0.82)',
  textFaint: 'rgba(165,205,245,0.58)',
  success: '#7de88a',
  successBg: 'rgba(90,175,100,0.14)',
  shadow: '0 32px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(72,128,190,0.30)',
};

// Tier color scale from bronze → legendary gold → divine silver
const TIER_PALETTE: string[] = [
  '#b87333', // T1 Practiced – copper
  '#c0c0c0', // T2 Veteran – silver
  '#cd7f32', // T3 Master – bronze-gold
  '#ffd700', // T4 Eternal Bond – gold
  '#e6c9ff', // T5 Resonant – pale violet
  '#a0d8ff', // T6 Transcendent – sky
  '#ffffff',  // T7 Ascendant – white
  '#f9e4ff', // T8 Infinite Bond – divine
];

const TIER_ICONS = ['◈', '◆', '✦', '★', '✵', '✷', '✸', '∞'];

function tierColor(tier: number): string {
  return TIER_PALETTE[(tier - 1) % TIER_PALETTE.length];
}

// ── System info panel content ──────────────────────────────────────────────
function SystemInfoPanel() {
  return (
    <div style={{
      background: P.panelStrong,
      border: `1px solid ${P.borderStrong}`,
      borderRadius: 14,
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <div>
        <div style={{
          fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase',
          color: P.accentDeep, fontFamily: uiTypography.display, marginBottom: 8,
        }}>What is Card-born Tier?</div>
        <div style={{ fontSize: 13, color: P.text, lineHeight: 1.65, fontFamily: uiTypography.body }}>
          Every card you play from hand earns it a <span style={{ color: P.accent, fontWeight: 700 }}>play count</span>.
          As that count climbs through eight milestone thresholds — from <em>Practiced</em> to <em>Infinite Bond</em> —
          you unlock Tier rewards and permanently raise that card's <span style={{ color: P.gold, fontWeight: 700 }}>Resonance</span> contribution.
          Owning more copies of a card has no effect — only the play count on each unique card matters.
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: P.accentDeep, fontFamily: uiTypography.display, marginBottom: 8 }}>
          Global Resonance Score
        </div>
        <div style={{ fontSize: 13, color: P.text, lineHeight: 1.65, fontFamily: uiTypography.body }}>
          Each unique card contributes <span style={{ color: P.gold, fontWeight: 700 }}>Resonance pts</span> based on
          its highest reached Tier — once per card, regardless of copies owned. All Resonance across all
          played cards sums into your <span style={{ color: P.accent, fontWeight: 700 }}> Global Resonance Score</span>,
          which feeds directly into your <span style={{ color: P.gold, fontWeight: 700 }}>Collection Power</span> multiplier
          — boosting every Oblivion gain for every turn you play.
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: P.accentDeep, fontFamily: uiTypography.display, marginBottom: 8 }}>
          Tier Milestones
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {MASTERY_TIERS.map(tier => (
            <div key={tier.tier} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 10px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid rgba(180,140,80,0.12)`,
            }}>
              <span style={{ fontSize: 14, color: tierColor(tier.tier), width: 18, textAlign: 'center', flexShrink: 0 }}>
                {TIER_ICONS[tier.tier - 1]}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 700, color: tierColor(tier.tier),
                fontFamily: uiTypography.display, letterSpacing: 0.5, width: 110, flexShrink: 0,
              }}>
                T{tier.tier} · {tier.label}
              </span>
              <span style={{ fontSize: 11, color: P.textMuted, flex: 1 }}>
                {tier.threshold.toLocaleString()} plays
              </span>
              <span style={{ fontSize: 11, color: P.success, fontWeight: 700 }}>
                +{tier.shardReward} shards
              </span>
              <span style={{ fontSize: 10, color: P.gold, minWidth: 60, textAlign: 'right' }}>
                +{tier.resonanceContribution} Resonance
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: P.accentDeep, fontFamily: uiTypography.display, marginBottom: 8 }}>
          Tier Progress from Boss Content
        </div>
        <div style={{ fontSize: 13, color: P.text, lineHeight: 1.65, fontFamily: uiTypography.body, marginBottom: 10 }}>
          Completing boss fights, Wake Trials, and the Endless Gauntlet awards <span style={{ color: P.accent, fontWeight: 700 }}>Tier Progress</span> to
          every card in your active deck and Extra Deck, on top of hand-play counts.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {([
            ['Boss fights', '~3 per card (easiest) → ~35 per card (hardest). Higher-index bosses grant more.'],
            ['Wake Trials', 'Boss base × trial reward multiplier, capped at ×2.'],
            ['Endless Gauntlet', 'Min 5 + 6 per depth level cleared on that run.'],
            ['Per-tier scaling', '+5% extra per Tier already reached on each card. A T4 card receives ×1.20 the base; T7 receives ×1.35.'],
          ] as [string, string][]).map(([label, body]) => (
            <div key={label} style={{
              padding: '7px 10px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid rgba(72,128,190,0.14)`,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: P.accent, fontFamily: uiTypography.display }}>{label}: </span>
              <span style={{ fontSize: 11, color: P.textMuted, fontFamily: uiTypography.body }}>{body}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        padding: '10px 14px',
        borderRadius: 10,
        border: `1px solid ${P.accentGlow}`,
        background: 'rgba(58,142,200,0.06)',
        color: P.textMuted,
        lineHeight: 1.6,
        fontFamily: uiTypography.body,
      }}>
        💡 <strong style={{ color: P.accent }}>Tip:</strong> Playing cards from hand is still the primary way to advance Tiers.
        Boss rewards supplement the grind — they cannot replace it. Higher tiers (T5–T8) require
        tens of thousands of plays and remain a long-term investment even with boss bonuses.
      </div>
    </div>
  );
}

// ── Single card mastery row ────────────────────────────────────────────────
function MasteryCardRow({ m, claimCardMastery, progress }: {
  m: MasteryView;
  claimCardMastery: (definitionId: string, tier: number) => void;
  progress: ReturnType<typeof selectProgress>;
}) {
  const def = CardRegistry.get(m.definitionId);
  if (!def) return null;
  const copies = progress.collection[m.definitionId] ?? 0;
  const resonanceContrib = MASTERY_TIERS.find(t => t.tier === m.reachedTier)?.resonanceContribution ?? 0;
  const totalResonance = resonanceContrib;
  const highestTierColor = m.reachedTier > 0 ? tierColor(m.reachedTier) : P.textFaint;
  const hasClaimable = m.unclaimedTiers.length > 0;

  return (
    <div style={{
      background: hasClaimable ? 'rgba(58,142,200,0.05)' : P.panel,
      border: `1px solid ${hasClaimable ? P.borderStrong : P.border}`,
      borderRadius: 10,
      padding: '10px 14px',
      transition: 'border-color 0.2s, background 0.2s',
      boxShadow: hasClaimable ? `0 0 16px rgba(58,142,200,0.12)` : 'none',
    }}>
      {/* Top row: card name + stats */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
          background: m.reachedTier > 0 ? `rgba(${hexToRgb(highestTierColor)},0.15)` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${m.reachedTier > 0 ? highestTierColor + '55' : P.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: highestTierColor,
        }}>
          {m.reachedTier > 0 ? TIER_ICONS[m.reachedTier - 1] : '◇'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: P.text,
            fontFamily: uiTypography.display,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{def.name}</div>
          <div style={{ fontSize: 10, color: P.textMuted, marginTop: 1 }}>
            {def.element} · {def.rarity} · {def.type}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexShrink: 0 }}>
          {totalResonance > 0 && (
            <div style={{ fontSize: 11, fontWeight: 700, color: P.gold }}>
              +{totalResonance.toLocaleString()} Resonance
            </div>
          )}
          <div style={{ fontSize: 11, color: P.textMuted }}>
            {m.count.toLocaleString()} plays
          </div>
          {copies > 1 && (
            <div style={{ fontSize: 10, color: P.textFaint }}>
              ×{copies} copies
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {m.nextTier && (
        <div style={{ marginBottom: 7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <div style={{ fontSize: 9, color: P.textFaint, letterSpacing: 1 }}>
              NEXT: T{m.nextTier.tier} {m.nextTier.label}
            </div>
            <div style={{ fontSize: 9, color: P.textFaint }}>
              {m.count.toLocaleString()} / {m.nextTier.threshold.toLocaleString()}
            </div>
          </div>
          <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, (m.count / m.nextTier.threshold) * 100).toFixed(1)}%`,
              background: `linear-gradient(90deg, ${P.accentDeep}, ${P.accent})`,
              borderRadius: 2,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      )}

      {/* Tier claim buttons */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {MASTERY_TIERS.map(tier => {
          const reached = m.count >= tier.threshold;
          const claimKey = getMasteryClaimKey(m.definitionId, tier.tier);
          const claimed = !!progress.cardMasteryClaims[claimKey];
          const tc = tierColor(tier.tier);
          return (
            <button
              key={tier.tier}
              onClick={() => claimCardMastery(m.definitionId, tier.tier)}
              disabled={!reached || claimed}
              data-sfx="claim"
              title={`${tier.label} — ${tier.threshold.toLocaleString()} plays · +${tier.resonanceContribution} Resonance pts · +${tier.shardReward} shards`}
              style={{
                flex: 1, minWidth: 0,
                padding: '4px 6px', borderRadius: 5,
                fontSize: 10, fontFamily: uiTypography.display,
                background: claimed
                  ? 'rgba(255,255,255,0.03)'
                  : reached
                    ? `rgba(${hexToRgb(tc)},0.18)`
                    : 'rgba(255,255,255,0.03)',
                color: claimed ? P.textFaint : reached ? tc : 'rgba(255,255,255,0.18)',
                border: `1px solid ${claimed ? 'rgba(255,255,255,0.06)' : reached ? tc + '66' : 'rgba(255,255,255,0.08)'}`,
                cursor: reached && !claimed ? 'pointer' : 'default',
                opacity: claimed ? 0.5 : 1,
                textAlign: 'center',
                transition: 'all 0.15s',
              }}
            >
              {claimed ? '✓' : TIER_ICONS[tier.tier - 1]} T{tier.tier}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '88,170,218';
  return `${r},${g},${b}`;
}

// ── Main component ─────────────────────────────────────────────────────────
export default function CardMasteryModal({ onClose }: Props) {
  const progress = useStore(selectProgress);
  const computedStats = useStore(selectComputedStats);
  const claimCardMastery = useStore(s => s.claimCardMastery);
  const claimAllAvailableMastery = useStore(s => s.claimAllAvailableMastery);
  const [filter, setFilter] = useState<'all' | 'claimable' | 'in-progress'>('all');
  const [showInfo, setShowInfo] = useState(false);

  const masteryList = useMemo(() => listMasteryProgress(progress), [progress]);

  // Global Resonance Score
  const resonanceScore = useMemo(() => {
    const collection = progress.collection ?? {};
    const counts = progress.cardPlayCounts ?? {};
    let score = 0;
    for (const definitionId of Object.keys(collection)) {
      const copies = collection[definitionId] ?? 0;
      if (copies <= 0) continue;
      const playCount = counts[definitionId] ?? 0;
      let contribution = 0;
      for (const tier of MASTERY_TIERS) {
        if (playCount >= tier.threshold) contribution = tier.resonanceContribution;
      }
      score += contribution;
    }
    return score;
  }, [progress.collection, progress.cardPlayCounts]);

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

  const filtered = useMemo(() => {
    if (filter === 'all') return masteryList;
    if (filter === 'claimable') return masteryList.filter(m => m.unclaimedTiers.length > 0);
    return masteryList.filter(m => m.count > 0);
  }, [masteryList, filter, progress.cardMasteryClaims]);

  const totalMastered = masteryList.filter(m => m.reachedTier >= MASTERY_TIERS.length).length;
  const totalWithProgress = masteryList.length;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'auto',
        background: P.bg,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: uiTypography.body,
      }}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: P.glow,
      }} />

      {/* Ornamental top accent */}
      <div style={{
        height: 3, flexShrink: 0,
        background: `linear-gradient(90deg, transparent, ${P.accentDeep}, ${P.accent}, ${P.accentDeep}, transparent)`,
        boxShadow: `0 0 24px ${P.accentGlow}`,
      }} />

      <div onClick={e => e.stopPropagation()} style={{
        display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden',
        ['--ui-accent' as any]: '114, 202, 245',
        ['--ui-accent-soft' as any]: '150, 218, 255',
      } as React.CSSProperties}>

        {/* ── Header ── */}
        <div className="ui-shimmer-band" style={{
          position: 'relative',
          padding: '22px 32px 18px',
          borderBottom: `1px solid ${P.border}`,
          display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 10, letterSpacing: 3.5, textTransform: 'uppercase',
              color: P.accentDeep, fontFamily: uiTypography.display, marginBottom: 6,
            }}>
              CARD-BORN PROGRESSION
            </div>
            <div className="ui-title-glow" style={{
              fontSize: 32, fontWeight: 700, letterSpacing: 1.5,
              color: P.accent, fontFamily: uiTypography.display,
              textShadow: `0 0 48px ${P.accentGlow}, 0 2px 8px rgba(0,0,0,0.8)`,
            }}>
              Card-born Tier
            </div>
            <div style={{
              fontSize: 13, color: P.textMuted, marginTop: 5, fontFamily: uiTypography.body,
              letterSpacing: 0.3, lineHeight: 1.4,
            }}>
              Play cards to raise their Tier. Each Tier unlocks shards and adds permanent Resonance to your collection.
            </div>
          </div>

          {/* Hero stats */}
          <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
            <HeroStat label="Collection Power" value={`×${(1 + computedStats.globalOblivionMult).toFixed(2)}`} accent={P.gold} />
            <HeroStat label="Global Resonance" value={resonanceScore.toLocaleString()} accent={P.accent} sub="pts" />
            <HeroStat label="Cards Mastered" value={`${totalMastered}/${totalWithProgress}`} accent={P.success} />
            {claimableSummary.tiersClaimable > 0 && (
              <HeroStat label="Shards Pending" value={`+${claimableSummary.shardsClaimable.toLocaleString()}`} accent={P.gold} pulse />
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => setShowInfo(v => !v)}
              style={{
                padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                background: showInfo ? `rgba(58,142,200,0.16)` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${showInfo ? P.borderStrong : P.border}`,
                color: showInfo ? P.accent : P.textMuted,
                fontFamily: uiTypography.display, fontSize: 12, letterSpacing: 0.5,
              }}
            >
              {showInfo ? 'Hide Guide' : 'How It Works'}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${P.border}`,
                color: P.textMuted, fontFamily: uiTypography.display, fontSize: 12,
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* ── Body: two-column when info open, full-width list otherwise ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: 0 }}>

          {/* Info panel (collapsible left column) */}
          {showInfo && (
            <div style={{
              width: 380, flexShrink: 0,
              borderRight: `1px solid ${P.border}`,
              overflowY: 'auto', padding: '20px 20px',
              background: 'rgba(0,0,0,0.15)',
            }}>
              <SystemInfoPanel />
            </div>
          )}

          {/* ── Main: filters + card list ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Toolbar */}
            <div style={{
              padding: '14px 24px',
              borderBottom: `1px solid ${P.border}`,
              display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
              background: 'rgba(0,0,0,0.12)',
            }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: P.textFaint, textTransform: 'uppercase', marginRight: 4, fontFamily: uiTypography.display }}>
                Filter
              </div>
              {(['all', 'claimable', 'in-progress'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                    fontFamily: uiTypography.display, fontSize: 11, letterSpacing: 0.5,
                    background: filter === f ? `rgba(58,142,200,0.18)` : 'rgba(255,255,255,0.04)',
                    color: filter === f ? P.accent : P.textMuted,
                    border: `1px solid ${filter === f ? P.borderStrong : P.border}`,
                    transition: 'all 0.15s',
                  }}
                >
                  {f === 'all' ? 'All Cards' : f === 'claimable' ? 'Claimable' : 'In Progress'}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <div style={{ fontSize: 11, color: P.textMuted }}>
                {filtered.length} card{filtered.length !== 1 ? 's' : ''}
              </div>
              <button
                onClick={() => claimAllAvailableMastery()}
                disabled={claimableSummary.tiersClaimable === 0}
                data-sfx="claim"
                style={{
                  padding: '7px 18px', borderRadius: 8, cursor: claimableSummary.tiersClaimable > 0 ? 'pointer' : 'default',
                  fontFamily: uiTypography.display, fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
                  background: claimableSummary.tiersClaimable > 0
                    ? `linear-gradient(135deg, ${P.accentDeep}, ${P.accent})`
                    : 'rgba(255,255,255,0.04)',
                  color: claimableSummary.tiersClaimable > 0 ? '#0c1e34' : P.textFaint,
                  border: `1px solid ${claimableSummary.tiersClaimable > 0 ? P.borderStrong : P.border}`,
                  boxShadow: claimableSummary.tiersClaimable > 0 ? `0 4px 16px ${P.accentGlow}` : 'none',
                  transition: 'all 0.2s',
                }}
                title={claimableSummary.tiersClaimable > 0
                  ? `Claim ${claimableSummary.tiersClaimable} tier${claimableSummary.tiersClaimable !== 1 ? 's' : ''} · +${claimableSummary.shardsClaimable.toLocaleString()} shards`
                  : 'No mastery rewards ready'}
              >
                {claimableSummary.tiersClaimable > 0
                  ? `✦ Claim All (+${claimableSummary.shardsClaimable.toLocaleString()} shards)`
                  : 'All Claimed'}
              </button>
            </div>

            {/* Card list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.length === 0 ? (
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: P.textFaint, fontSize: 14, fontStyle: 'italic', fontFamily: uiTypography.body,
                  paddingTop: 60,
                }}>
                  {filter === 'claimable'
                    ? 'No rewards waiting — keep playing your cards.'
                    : filter === 'in-progress'
                      ? 'No cards with play counts yet. Start playing!'
                      : 'No cards found.'}
                </div>
              ) : (
                <VirtualizedList
                  items={filtered}
                  getItemKey={(item) => item.definitionId}
                  getItemHeight={(item) => item.nextTier ? 172 : 148}
                  topPadding={0}
                  bottomPadding={16}
                  overscanPx={480}
                  style={{ flex: 1 }}
                  renderItem={(item) => (
                    <div style={{ paddingBottom: 8 }}>
                      <MasteryCardRow
                        m={item}
                        claimCardMastery={claimCardMastery}
                        progress={progress}
                      />
                    </div>
                  )}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div style={{
        height: 2, flexShrink: 0,
        background: `linear-gradient(90deg, transparent, ${P.border}, transparent)`,
      }} />
    </div>
  );
}

function HeroStat({ label, value, accent, sub, pulse }: {
  label: string; value: string; accent: string; sub?: string; pulse?: boolean;
}) {
  return (
    <div style={{
      padding: '10px 16px', borderRadius: 10,
      background: `rgba(${accent === P.gold ? '123,189,232' : accent === '#6ecf7c' ? '110,207,124' : '88,170,218'},0.08)`,
      border: `1px solid ${accent}44`,
      textAlign: 'center',
      minWidth: 100,
      boxShadow: pulse ? `0 0 20px ${accent}33` : 'none',
    }}>
      <div style={{
        fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase',
        color: `${accent}aa`, fontFamily: uiTypography.display, marginBottom: 4,
      }}>{label}</div>
      <div style={{
        fontSize: 20, fontWeight: 700, color: accent,
        fontFamily: uiTypography.display, lineHeight: 1,
        textShadow: `0 0 20px ${accent}66`,
      }}>
        {value}
        {sub && <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 3, color: `${accent}99` }}>{sub}</span>}
      </div>
    </div>
  );
}
