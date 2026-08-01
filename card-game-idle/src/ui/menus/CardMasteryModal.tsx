import { useMemo, useState } from 'react';
import { useStore, selectProgress, selectComputedStats } from '@/state/store';
import { uiTypography, warmTheme } from '@/ui/theme';
import { CardRegistry } from '@/cards/CardRegistry';
import { MASTERY_TIERS, computeGlobalResonanceScore, getMasteryClaimKey, listMasteryProgress } from '@/systems/progression/cardMastery';
import type { MasteryView } from '@/systems/progression/cardMastery';
import VirtualizedList from '@/ui/components/VirtualizedList';

interface Props {
  onClose: () => void;
}

function getThemePalette() {
  return {
    bg: `linear-gradient(160deg, ${warmTheme.surfaceMuted} 0%, ${warmTheme.surface} 50%, ${warmTheme.surfaceStrong} 100%)`,
    glow: `radial-gradient(ellipse 70% 40% at 50% 0%, ${withAlpha(warmTheme.accent, 0.2)} 0%, transparent 60%)`,
    panel: warmTheme.surface,
    panelStrong: warmTheme.surfaceStrong,
    border: warmTheme.border,
    borderStrong: warmTheme.borderStrong,
    accent: warmTheme.accent,
    accentSoft: warmTheme.accentSoft,
    accentDeep: warmTheme.accentDeep,
    accentGlowColor: withAlpha(warmTheme.accentSoft, 0.42),
    gold: warmTheme.accentSoft,
    text: warmTheme.text,
    textMuted: warmTheme.textMuted,
    textFaint: warmTheme.textFaint,
    success: warmTheme.success,
    successBg: warmTheme.surfaceStrong,
    shadow: warmTheme.shadow,
  };
}

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
  const P = getThemePalette();
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
          Every card you play from hand gains <span style={{ color: P.accent, fontWeight: 700 }}>+1 Card-light</span>.
          As its Card-light climbs through eight milestone thresholds — from <em>Practiced</em> to <em>Infinite Bond</em> —
          you unlock Tier rewards and permanently raise that card's <span style={{ color: P.gold, fontWeight: 700 }}>Resonance</span> contribution.
          Owning more copies of a card has no effect — only Card-light on each unique card matters.
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
                {tier.threshold.toLocaleString()} Card-light
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
          Completing boss fights, Wake Trials, and the Endless Gauntlet
          <span style={{ color: P.accent, fontWeight: 700 }}> awards +X Card-light for each card in your deck upon completion</span>.
          Active difficulty determines X, and Extra Deck cards are included.
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
        border: `1px solid ${withAlpha(P.accent, 0.35)}`,
        background: withAlpha(P.accent, 0.08),
        color: P.textMuted,
        lineHeight: 1.6,
        fontFamily: uiTypography.body,
      }}>
        💡 <strong style={{ color: P.accent }}>Tip:</strong> Playing cards from hand is still the primary way to advance Tiers.
        Boss rewards supplement the grind — they cannot replace it. Higher tiers (T5–T8) require
        tens of thousands of Card-light and remain a long-term investment even with boss bonuses.
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
  const P = getThemePalette();
  const def = CardRegistry.get(m.definitionId);
  if (!def) return null;
  const copies = progress.collection[m.definitionId] ?? 0;
  const resonanceContrib = MASTERY_TIERS.find(t => t.tier === m.reachedTier)?.resonanceContribution ?? 0;
  const totalResonance = resonanceContrib;
  const highestTierColor = m.reachedTier > 0 ? tierColor(m.reachedTier) : P.textFaint;
  const hasClaimable = m.unclaimedTiers.length > 0;

  return (
    <div style={{
      background: hasClaimable ? withAlpha(P.accent, 0.08) : P.panel,
      border: `1px solid ${hasClaimable ? P.borderStrong : P.border}`,
      borderRadius: 10,
      padding: '10px 14px',
      transition: 'border-color 0.2s, background 0.2s',
      boxShadow: hasClaimable ? `0 0 16px ${withAlpha(P.accent, 0.18)}` : 'none',
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
            {def.rarity} · {def.type}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexShrink: 0 }}>
          {totalResonance > 0 && (
            <div style={{ fontSize: 11, fontWeight: 700, color: P.gold }}>
              +{totalResonance.toLocaleString()} Resonance
            </div>
          )}
          <div style={{ fontSize: 11, color: P.textMuted }}>
            {m.count.toLocaleString()} Card-light
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
              title={`${tier.label} — ${tier.threshold.toLocaleString()} Card-light · +${tier.resonanceContribution} Resonance pts · +${tier.shardReward} shards`}
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
                border: `1px solid ${claimed ? 'rgba(255,255,255,0.06)' : reached ? withAlpha(tc, 0.4) : 'rgba(255,255,255,0.08)'}`,
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

function toRgbTriplet(color: unknown): [number, number, number] | null {
  if (typeof color !== 'string') return null;
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    const raw = hex[1];
    const normalized = raw.length === 3
      ? raw.split('').map((c) => c + c).join('')
      : raw.slice(0, 6);
    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    return [r, g, b];
  }
  const rgb = color.trim().match(/^rgba?\(([^)]+)\)$/i);
  if (!rgb) return null;
  const parts = rgb[1].split(',').map((p) => Number.parseFloat(p.trim()));
  if (parts.length < 3 || parts.slice(0, 3).some((n) => Number.isNaN(n))) return null;
  return [parts[0], parts[1], parts[2]];
}

function withAlpha(color: unknown, alpha: number): string {
  const triplet = toRgbTriplet(color);
  if (!triplet) return `rgba(255, 255, 255, ${Math.max(0, Math.min(1, alpha))})`;
  const [r, g, b] = triplet;
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Math.max(0, Math.min(1, alpha))})`;
}

// ── Main component ─────────────────────────────────────────────────────────
export default function CardMasteryModal({ onClose }: Props) {
  const P = getThemePalette();
  const progress = useStore(selectProgress);
  const computedStats = useStore(selectComputedStats);
  const claimCardMastery = useStore(s => s.claimCardMastery);
  const claimAllAvailableMastery = useStore(s => s.claimAllAvailableMastery);
  const [filter, setFilter] = useState<'all' | 'claimable' | 'in-progress'>('all');
  const [showInfo, setShowInfo] = useState(false);

  const masteryList = useMemo(() => listMasteryProgress(progress), [progress]);

  // Global Resonance Score
  const resonanceScore = useMemo(() => computeGlobalResonanceScore(progress), [progress]);

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
  const accentTriplet = toRgbTriplet(P.accent) ?? [114, 202, 245];
  const accentSoftTriplet = toRgbTriplet(P.accentSoft) ?? [150, 218, 255];

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
        boxShadow: `0 0 24px ${P.accentGlowColor}`,
      }} />

      <div onClick={e => e.stopPropagation()} style={{
        display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden',
        ['--ui-accent' as any]: `${accentTriplet[0]}, ${accentTriplet[1]}, ${accentTriplet[2]}`,
        ['--ui-accent-soft' as any]: `${accentSoftTriplet[0]}, ${accentSoftTriplet[1]}, ${accentSoftTriplet[2]}`,
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
              textShadow: `0 0 48px ${P.accentGlowColor}, 0 2px 8px rgba(0,0,0,0.8)`,
            }}>
              Card-born Tier
            </div>
            <div style={{
              fontSize: 13, color: P.textMuted, marginTop: 5, fontFamily: uiTypography.body,
              letterSpacing: 0.3, lineHeight: 1.4,
            }}>
              Play cards to gain +1 Card-light per play. Each Tier unlocks shards and adds permanent Resonance to your collection.
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
                background: showInfo ? withAlpha(P.accent, 0.16) : withAlpha(P.text, 0.04),
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
                background: withAlpha(P.text, 0.04),
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
              background: withAlpha(P.text, 0.08),
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
              background: withAlpha(P.text, 0.06),
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
                    background: filter === f ? withAlpha(P.accent, 0.18) : withAlpha(P.text, 0.04),
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
                    : withAlpha(P.text, 0.04),
                  color: claimableSummary.tiersClaimable > 0 ? '#0c1e34' : P.textFaint,
                  border: `1px solid ${claimableSummary.tiersClaimable > 0 ? P.borderStrong : P.border}`,
                  boxShadow: claimableSummary.tiersClaimable > 0 ? `0 4px 16px ${P.accentGlowColor}` : 'none',
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
                      ? 'No cards with Card-light yet. Start playing!'
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
      background: withAlpha(accent, 0.08),
      border: `1px solid ${withAlpha(accent, 0.28)}`,
      textAlign: 'center',
      minWidth: 100,
      boxShadow: pulse ? `0 0 20px ${withAlpha(accent, 0.2)}` : 'none',
    }}>
      <div style={{
        fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase',
        color: withAlpha(accent, 0.66), fontFamily: uiTypography.display, marginBottom: 4,
      }}>{label}</div>
      <div style={{
        fontSize: 20, fontWeight: 700, color: accent,
        fontFamily: uiTypography.display, lineHeight: 1,
        textShadow: `0 0 20px ${withAlpha(accent, 0.4)}`,
      }}>
        {value}
        {sub && <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 3, color: withAlpha(accent, 0.58) }}>{sub}</span>}
      </div>
    </div>
  );
}
