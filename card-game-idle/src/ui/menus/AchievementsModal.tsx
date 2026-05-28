import { useMemo, useState } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { uiTypography } from '@/ui/theme';
import { listAchievements, summarizeAchievements } from '@/systems/progression/achievements';

interface Props {
  onClose: () => void;
}

// ── Design palette — Warm Hearth ─────────────────────────────────────────────
const P = {
  bg: 'linear-gradient(155deg, #040a15 0%, #060e1c 50%, #030810 100%)',
  glow: 'radial-gradient(ellipse 60% 35% at 50% 0%, rgba(78,158,220,0.22) 0%, transparent 60%)',
  panel: 'rgba(6,14,30,0.72)',
  panelStrong: 'rgba(72,148,210,0.09)',
  panelUnlocked: 'rgba(72,148,210,0.12)',
  border: 'rgba(110,160,215,0.32)',
  borderStrong: 'rgba(72,128,190,0.58)',
  borderGold: 'rgba(72,128,190,0.58)',
  accent: '#72caf5',
  accentDeep: '#1e5890',
  accentGold: '#6ec8f5',
  accentGlow: 'rgba(88,180,235,0.45)',
  goldGlow: 'rgba(88,180,235,0.45)',
  text: '#f0f6ff',
  textMuted: 'rgba(205,228,255,0.82)',
  textFaint: 'rgba(165,205,245,0.58)',
  success: '#7de88a',
  successBg: 'rgba(90,175,100,0.14)',
};

const GROUP_LABEL: Record<string, string> = {
  milestone: 'Milestones',
  boss: "Eternity's Wake",
  infinite: 'Infinite Cards',
  set: 'Set Completion',
};

const GROUP_ICON: Record<string, string> = {
  milestone: '◈',
  boss: '☽',
  infinite: '∞',
  set: '✦',
};

const GROUP_DESCRIPTION: Record<string, string> = {
  milestone: 'Core gameplay milestones — cards played, packs opened, turns completed, and collection thresholds reached.',
  boss: "Conquer the pantheon's most fearsome guardians in Eternity's Wake boss fights.",
  infinite: 'Forge the rarest cards in existence through the Infinitude crafting system.',
  set: 'Collect every card in a complete set, including all Eternal rarities.',
};

const GROUP_COLOR: Record<string, string> = {
  milestone: '#58aada',
  boss: '#ff8a6a',
  infinite: '#7bbde8',
  set: '#a0cef5',
};

type AchievementEntry = ReturnType<typeof listAchievements>[number];

export default function AchievementsModal({ onClose }: Props) {
  const progress = useStore(selectProgress);
  const claimAchievement = useStore(s => s.claimAchievement);

  const summary = useMemo(() => summarizeAchievements(progress), [progress]);
  const grouped = useMemo(() => {
    const list = listAchievements(progress);
    const out: Record<string, typeof list> = {};
    for (const a of list) {
      (out[a.group] ??= []).push(a);
    }
    return out;
  }, [progress]);

  const [activeGroup, setActiveGroup] = useState<string>(Object.keys(grouped)[0] ?? 'milestone');
  const groups = Object.keys(grouped);
  const items = grouped[activeGroup] ?? [];
  const unlockedInGroup = items.filter(a => a.unlocked).length;

  return (
    <div
      onClick={onClose}
      className="ui-panel-intro"
      style={{
        position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'auto',
        background: P.bg,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: uiTypography.body,
      }}
    >
      {/* Atmospheric washes — Warm Hearth */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '70%', height: '85%', background: 'radial-gradient(ellipse, rgba(78,165,225,0.28) 0%, rgba(25,88,170,0.12) 42%, transparent 68%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-18%', right: '-8%', width: '60%', height: '70%', background: 'radial-gradient(ellipse, rgba(22,65,200,0.22) 0%, transparent 65%)', filter: 'blur(90px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 44%, transparent 22%, rgba(0,0,0,0.65) 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)', pointerEvents: 'none' }} />

      {/* Ornamental top accent */}
      <div style={{
        height: 3, flexShrink: 0,
        background: `linear-gradient(90deg, transparent, ${P.accentDeep}, ${P.accent}, ${P.accentDeep}, transparent)`,
        boxShadow: `0 0 24px ${P.accentGlow}`,
      }} />

      <div onClick={e => e.stopPropagation()} style={{
        display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden',
        ['--ui-accent' as any]: '58, 142, 200',
        ['--ui-accent-soft' as any]: '90, 171, 218',
      } as React.CSSProperties}>

        {/* ── Header ── */}
        <div className="ui-shimmer-band" style={{
          position: 'relative',
          padding: '22px 32px 18px',
          borderBottom: `1px solid ${P.border}`,
          display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 10, letterSpacing: 3.5, textTransform: 'uppercase',
              color: P.accentDeep, fontFamily: uiTypography.display, marginBottom: 6,
            }}>
              LEGACY OF THE ACOLYTE
            </div>
            <div className="ui-title-glow" style={{
              fontSize: 32, fontWeight: 700, letterSpacing: 1.5,
              color: P.accent, fontFamily: uiTypography.display,
              textShadow: `0 0 40px ${P.accentGlow}, 0 2px 8px rgba(0,0,0,0.6)`,
            }}>
              Achievements
            </div>
            <div style={{
              fontSize: 13, color: P.textMuted, marginTop: 5,
              letterSpacing: 0.3, lineHeight: 1.4,
            }}>
              Record your feats — from humble first plays to mastering every boss and forging the infinite.
            </div>
          </div>

          {/* Hero stats — emblem pillars */}
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 20, borderLeft: `1px solid ${P.border}`, flexShrink: 0 }}>
            <AchievStat icon="❖" label="Unlocked" value={`${summary.unlocked}`} sub={`/ ${summary.total}`} accent={P.accent} />
            <div style={{ width: 1, height: 30, background: P.border, flexShrink: 0 }} />
            <AchievStat icon="✓" label="Rewards Claimed" value={`${summary.claimed}`} sub="collected" accent={P.success} />
            {summary.unclaimedShards > 0 && (
              <>
                <div style={{ width: 1, height: 30, background: P.border, flexShrink: 0 }} />
                <AchievStat icon="◈" label="Shards Pending" value={`+${summary.unclaimedShards.toLocaleString()}`} accent={P.accentGold} pulse />
              </>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              width: 42, height: 42, borderRadius: '50%', cursor: 'pointer',
              background: `rgba(${hexToRgbA(P.accentDeep)},0.08)`, border: `1px solid ${P.border}`,
              color: P.textMuted, fontSize: 16, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0, transition: 'all 0.18s ease', padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Body: sidebar + main ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left: group navigation */}
          <div style={{
            width: 240, flexShrink: 0,
            borderRight: `1px solid ${P.border}`,
            background: 'rgba(5,12,24,0.72)',
            backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column',
            padding: '18px 12px', gap: 6,
            overflowY: 'auto',
          }}>
            <div style={{
              fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase',
              color: P.textFaint, fontFamily: uiTypography.display, marginBottom: 6, paddingLeft: 6,
            }}>Categories</div>
            {groups.map(g => {
              const gItems = grouped[g] ?? [];
              const gUnlocked = gItems.filter(a => a.unlocked).length;
              const isActive = g === activeGroup;
              const gc = GROUP_COLOR[g] ?? P.accent;
              return (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g)}
                  style={{
                    textAlign: 'left', padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    background: isActive ? `rgba(${hexToRgbA(gc)},0.12)` : 'transparent',
                    border: `1px solid ${isActive ? gc + '55' : 'rgba(255,255,255,0.06)'}`,
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: isActive ? `rgba(${hexToRgbA(gc)},0.20)` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isActive ? gc + '66' : 'rgba(255,255,255,0.08)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: isActive ? gc : P.textMuted,
                  }}>
                    {GROUP_ICON[g] ?? '◇'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 700, color: isActive ? gc : P.textMuted,
                      fontFamily: uiTypography.display, letterSpacing: 0.3,
                    }}>
                      {GROUP_LABEL[g] ?? g}
                    </div>
                    <div style={{ fontSize: 10, color: P.textFaint, marginTop: 1 }}>
                      {gUnlocked}/{gItems.length} unlocked
                    </div>
                  </div>
                  {gItems.some(a => a.unlocked && !a.claimed) && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: P.accentGold,
                      boxShadow: `0 0 8px ${P.goldGlow}`,
                      flexShrink: 0,
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: achievement list */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Group header */}
            <div style={{
              padding: '18px 28px 14px',
              borderBottom: `1px solid ${P.border}`,
              flexShrink: 0,
              background: 'rgba(5,12,24,0.62)',
              backdropFilter: 'blur(6px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{
                  fontSize: 22, color: GROUP_COLOR[activeGroup] ?? P.accent,
                  textShadow: `0 0 20px ${GROUP_COLOR[activeGroup] ?? P.accent}66`,
                }}>
                  {GROUP_ICON[activeGroup] ?? '◇'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 18, fontWeight: 700, color: GROUP_COLOR[activeGroup] ?? P.accent,
                    fontFamily: uiTypography.display, letterSpacing: 1,
                  }}>
                    {GROUP_LABEL[activeGroup] ?? activeGroup}
                  </div>
                  <div style={{ fontSize: 11, color: P.textMuted, marginTop: 2 }}>
                    {GROUP_DESCRIPTION[activeGroup] ?? ''}
                  </div>
                </div>
                <div style={{
                  padding: '6px 14px', borderRadius: 20,
                  background: unlockedInGroup === items.length && items.length > 0
                    ? P.successBg : `rgba(${hexToRgbA(GROUP_COLOR[activeGroup] ?? P.accent)},0.10)`,
                  border: `1px solid ${unlockedInGroup === items.length && items.length > 0 ? 'rgba(110,207,124,0.30)' : (GROUP_COLOR[activeGroup] ?? P.accent) + '44'}`,
                  fontSize: 12, fontWeight: 700,
                  color: unlockedInGroup === items.length && items.length > 0 ? P.success : (GROUP_COLOR[activeGroup] ?? P.accent),
                  fontFamily: uiTypography.display,
                }}>
                  {unlockedInGroup}/{items.length}
                </div>
              </div>
            </div>

            {/* Achievement rows */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(a => (
                <AchievementRow
                  key={a.id}
                  achievement={a}
                  onClaim={() => claimAchievement(a.id)}
                  groupColor={GROUP_COLOR[activeGroup] ?? P.accent}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <div style={{
        height: 2, flexShrink: 0,
        background: `linear-gradient(90deg, transparent, ${P.border}, transparent)`,
      }} />
    </div>
  );
}

function hexToRgbA(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '88,170,218';
  return `${r},${g},${b}`;
}

function AchievStat({ icon, label, value, sub, accent, pulse }: {
  icon: string; label: string; value: string; sub?: string; accent: string; pulse?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '6px 20px', gap: 4,
      boxShadow: pulse ? `0 0 24px ${accent}33` : 'none',
    }}>
      <div style={{
        fontSize: 8, letterSpacing: 3, textTransform: 'uppercase',
        color: `${accent}99`, fontWeight: 400, whiteSpace: 'nowrap',
      }}>{icon} {label}</div>
      <div style={{
        fontSize: 22, fontWeight: 600, letterSpacing: 0.5, color: accent,
        fontVariantNumeric: 'tabular-nums',
        textShadow: `0 0 20px ${accent}55`,
      }}>
        {value}
        {sub && <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 3, color: `${accent}88` }}>{sub}</span>}
      </div>
    </div>
  );
}

function AchievementRow({ achievement: a, onClaim, groupColor }: {
  achievement: AchievementEntry; onClaim: () => void; groupColor: string;
}) {
  const gc = groupColor;
  const stateBg = a.claimed
    ? 'rgba(0,0,0,0.06)'
    : a.unlocked
      ? `rgba(${hexToRgbA(gc)},0.06)`
      : P.panel;
  const stateBorder = a.claimed
    ? 'rgba(110,207,124,0.20)'
    : a.unlocked
      ? gc + '55'
      : 'rgba(255,255,255,0.07)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 16px',
      background: stateBg,
      border: `1px solid ${stateBorder}`,
      borderRadius: 12,
      opacity: !a.unlocked ? 0.55 : a.claimed ? 0.70 : 1,
      boxShadow: a.unlocked && !a.claimed ? `0 2px 16px ${gc}22` : 'none',
      transition: 'all 0.2s',
    }}>
      {/* State badge */}
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: a.claimed ? 'rgba(110,207,124,0.14)' : a.unlocked ? `rgba(${hexToRgbA(gc)},0.16)` : 'rgba(255,255,255,0.05)',
        border: `1px solid ${a.claimed ? 'rgba(110,207,124,0.25)' : a.unlocked ? gc + '55' : 'rgba(255,255,255,0.08)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, color: a.claimed ? P.success : a.unlocked ? gc : P.textFaint,
        textShadow: a.unlocked && !a.claimed ? `0 0 16px ${gc}66` : 'none',
      }}>
        {a.claimed ? '✓' : a.unlocked ? '★' : '🔒'}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: a.unlocked ? P.text : P.textMuted,
          fontFamily: uiTypography.display, letterSpacing: 0.3,
        }}>
          {a.text}
        </div>
        <div style={{ fontSize: 11, color: P.textMuted, marginTop: 2, lineHeight: 1.4 }}>
          {a.description}
        </div>
      </div>

      {/* Reward badge */}
      <div style={{
        fontSize: 12, fontWeight: 700, color: P.accentGold,
        background: 'rgba(58,142,200,0.12)', padding: '4px 10px',
        borderRadius: 8, border: `1px solid rgba(58,142,200,0.28)`,
        flexShrink: 0, fontFamily: uiTypography.display,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
      }}>
        <span>+{a.shardReward} ◈</span>
        {a.oblivionReward > 0 && (
          <span style={{ fontSize: 11, color: 'rgba(160,210,255,0.90)' }}>+{a.oblivionReward.toLocaleString()} Oblivion</span>
        )}
      </div>

      {/* Claim button */}
      <button
        onClick={onClaim}
        disabled={!a.unlocked || a.claimed}
        data-sfx="claim"
        style={{
          background: a.unlocked && !a.claimed
            ? `linear-gradient(135deg, ${P.accentDeep}, ${P.accent})`
            : 'rgba(255,255,255,0.04)',
          color: a.unlocked && !a.claimed ? '#ffffff' : P.textFaint,
          border: `1px solid ${a.unlocked && !a.claimed ? P.accent + '88' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 8, padding: '6px 16px',
          fontFamily: uiTypography.display, fontSize: 11, fontWeight: 700,
          cursor: a.unlocked && !a.claimed ? 'pointer' : 'default',
          flexShrink: 0, minWidth: 72, textAlign: 'center',
          boxShadow: a.unlocked && !a.claimed ? `0 4px 14px ${P.accentGlow}` : 'none',
          transition: 'all 0.15s',
        }}
      >
        {a.claimed ? '✓ Done' : a.unlocked ? 'Claim' : 'Locked'}
      </button>
    </div>
  );
}
