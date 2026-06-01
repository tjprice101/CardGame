import { useEffect, useMemo, useState } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { uiTypography, warmTheme } from '@/ui/theme';
import { listAchievements, summarizeAchievements } from '@/systems/progression/achievements';

interface Props {
  onClose: () => void;
}

function getThemePalette() {
  const safe = (value: unknown, fallback: string): string => (
    typeof value === 'string' && value.trim().length > 0 ? value : fallback
  );

  const surfaceMuted = safe(warmTheme.surfaceMuted, 'rgba(32, 18, 24, 0.92)');
  const surface = safe(warmTheme.surface, 'rgba(44, 20, 30, 0.94)');
  const surfaceStrong = safe(warmTheme.surfaceStrong, 'rgba(56, 26, 38, 0.96)');
  const border = safe(warmTheme.border, 'rgba(255, 182, 202, 0.28)');
  const borderStrong = safe(warmTheme.borderStrong, 'rgba(255, 182, 202, 0.48)');
  const accent = safe(warmTheme.accent, '#e06a8f');
  const accentDeep = safe(warmTheme.accentDeep, '#4a1d2b');
  const accentSoft = safe(warmTheme.accentSoft, '#f0a3be');
  const text = safe(warmTheme.text, '#f5e8ed');
  const textMuted = safe(warmTheme.textMuted, 'rgba(245, 232, 237, 0.72)');
  const textFaint = safe(warmTheme.textFaint, 'rgba(245, 232, 237, 0.5)');
  const success = safe(warmTheme.success, '#6ecf7c');

  return {
    bg: `linear-gradient(155deg, ${surfaceMuted} 0%, ${surface} 50%, ${surfaceStrong} 100%)`,
    glow: `radial-gradient(ellipse 60% 35% at 50% 0%, ${withAlpha(accent, 0.2)} 0%, transparent 60%)`,
    panel: surface,
    panelStrong: surfaceStrong,
    panelUnlocked: surfaceStrong,
    border,
    borderStrong,
    borderGold: borderStrong,
    accent,
    accentDeep,
    accentGold: accentSoft,
    accentGlowColor: withAlpha(accentSoft, 0.42),
    goldGlowColor: withAlpha(accentSoft, 0.42),
    text,
    textMuted,
    textFaint,
    success,
    successBg: surfaceStrong,
    overlayStrong: withAlpha(surfaceStrong, 0.82),
    overlaySoft: withAlpha(surfaceStrong, 0.72),
    overlayVeil: withAlpha(surfaceStrong, 0.65),
    stripe: withAlpha(text, 0.04),
  };
}

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

type AchievementEntry = ReturnType<typeof listAchievements>[number];

export default function AchievementsModal({ onClose }: Props) {
  const P = getThemePalette();
  const progress = useStore(selectProgress);
  const claimAchievement = useStore(s => s.claimAchievement);
  const groupColors: Record<string, string> = {
    milestone: warmTheme.accent,
    boss: warmTheme.danger,
    infinite: warmTheme.accentSoft,
    set: warmTheme.success,
  };

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
  useEffect(() => {
    if (!groups.length) {
      if (activeGroup !== 'milestone') setActiveGroup('milestone');
      return;
    }
    if (!grouped[activeGroup]) setActiveGroup(groups[0]);
  }, [activeGroup, groups, grouped]);

  const effectiveGroup = grouped[activeGroup] ? activeGroup : (groups[0] ?? 'milestone');
  const items = grouped[effectiveGroup] ?? [];
  const unlockedInGroup = items.filter(a => a.unlocked).length;
  const accentTriplet = toRgbTriplet(P.accent) ?? [58, 142, 200];
  const accentSoftTriplet = toRgbTriplet(P.accentGold) ?? [90, 171, 218];

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
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '70%', height: '85%', background: `radial-gradient(ellipse, ${withAlpha(P.accent, 0.28)} 0%, ${withAlpha(P.accentDeep, 0.12)} 42%, transparent 68%)`, filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-18%', right: '-8%', width: '60%', height: '70%', background: `radial-gradient(ellipse, ${withAlpha(P.accentGold, 0.22)} 0%, transparent 65%)`, filter: 'blur(90px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 44%, transparent 22%, ${P.overlayVeil} 100%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(0deg, transparent, transparent 3px, ${P.stripe} 3px, ${P.stripe} 4px)`, pointerEvents: 'none' }} />

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
              textShadow: `0 0 40px ${P.accentGlowColor}, 0 2px 8px rgba(0,0,0,0.6)`,
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
              background: withAlpha(P.accentDeep, 0.08), border: `1px solid ${P.border}`,
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
            background: P.overlayStrong,
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
              const isActive = g === effectiveGroup;
              const gc = groupColors[g] ?? P.accent;
              return (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g)}
                  style={{
                    textAlign: 'left', padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    background: isActive ? withAlpha(gc, 0.12) : 'transparent',
                    border: `1px solid ${isActive ? withAlpha(gc, 0.35) : withAlpha(P.text, 0.12)}`,
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: isActive ? withAlpha(gc, 0.2) : withAlpha(P.text, 0.04),
                    border: `1px solid ${isActive ? withAlpha(gc, 0.4) : withAlpha(P.text, 0.14)}`,
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
                      boxShadow: `0 0 8px ${P.goldGlowColor}`,
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
              background: P.overlaySoft,
              backdropFilter: 'blur(6px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{
                  fontSize: 22, color: groupColors[effectiveGroup] ?? P.accent,
                  textShadow: `0 0 20px ${withAlpha(groupColors[effectiveGroup] ?? P.accent, 0.4)}`,
                }}>
                  {GROUP_ICON[effectiveGroup] ?? '◇'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 18, fontWeight: 700, color: groupColors[effectiveGroup] ?? P.accent,
                    fontFamily: uiTypography.display, letterSpacing: 1,
                  }}>
                    {GROUP_LABEL[effectiveGroup] ?? effectiveGroup}
                  </div>
                  <div style={{ fontSize: 11, color: P.textMuted, marginTop: 2 }}>
                    {GROUP_DESCRIPTION[effectiveGroup] ?? ''}
                  </div>
                </div>
                <div style={{
                  padding: '6px 14px', borderRadius: 20,
                  background: unlockedInGroup === items.length && items.length > 0
                    ? P.successBg : withAlpha(groupColors[effectiveGroup] ?? P.accent, 0.1),
                  border: `1px solid ${unlockedInGroup === items.length && items.length > 0 ? withAlpha(P.success, 0.4) : withAlpha(groupColors[effectiveGroup] ?? P.accent, 0.28)}`,
                  fontSize: 12, fontWeight: 700,
                  color: unlockedInGroup === items.length && items.length > 0 ? P.success : (groupColors[effectiveGroup] ?? P.accent),
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
                  groupColor={groupColors[effectiveGroup] ?? P.accent}
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

function AchievStat({ icon, label, value, sub, accent, pulse }: {
  icon: string; label: string; value: string; sub?: string; accent: string; pulse?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '6px 20px', gap: 4,
      boxShadow: pulse ? `0 0 24px ${withAlpha(accent, 0.2)}` : 'none',
    }}>
      <div style={{
        fontSize: 8, letterSpacing: 3, textTransform: 'uppercase',
        color: withAlpha(accent, 0.66), fontWeight: 400, whiteSpace: 'nowrap',
        fontFamily: uiTypography.display,
      }}>{icon} {label}</div>
      <div style={{
        fontSize: 22, fontWeight: 600, letterSpacing: 0.5, color: accent,
        fontVariantNumeric: 'tabular-nums',
        textShadow: `0 0 20px ${withAlpha(accent, 0.35)}`,
        fontFamily: uiTypography.display,
      }}>
        {value}
        {sub && <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 3, color: withAlpha(accent, 0.58), fontFamily: uiTypography.body }}>{sub}</span>}
      </div>
    </div>
  );
}

function AchievementRow({ achievement: a, onClaim, groupColor }: {
  achievement: AchievementEntry; onClaim: () => void; groupColor: string;
}) {
  const P = getThemePalette();
  const gc = groupColor;
  const stateBg = a.claimed
    ? withAlpha(P.text, 0.06)
    : a.unlocked
      ? withAlpha(gc, 0.06)
      : P.panel;
  const stateBorder = a.claimed
    ? withAlpha(P.success, 0.2)
    : a.unlocked
      ? withAlpha(gc, 0.35)
      : withAlpha(P.text, 0.12);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 16px',
      background: stateBg,
      border: `1px solid ${stateBorder}`,
      borderRadius: 12,
      opacity: !a.unlocked ? 0.55 : a.claimed ? 0.70 : 1,
      boxShadow: a.unlocked && !a.claimed ? `0 2px 16px ${withAlpha(gc, 0.14)}` : 'none',
      transition: 'all 0.2s',
    }}>
      {/* State badge */}
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: a.claimed ? withAlpha(P.success, 0.14) : a.unlocked ? withAlpha(gc, 0.16) : withAlpha(P.text, 0.05),
        border: `1px solid ${a.claimed ? withAlpha(P.success, 0.25) : a.unlocked ? withAlpha(gc, 0.35) : withAlpha(P.text, 0.14)}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, color: a.claimed ? P.success : a.unlocked ? gc : P.textFaint,
        textShadow: a.unlocked && !a.claimed ? `0 0 16px ${withAlpha(gc, 0.4)}` : 'none',
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
        <div style={{ fontSize: 11, color: P.textMuted, marginTop: 2, lineHeight: 1.4, fontFamily: uiTypography.body }}>
          {a.description}
        </div>
      </div>

      {/* Reward badge */}
      <div style={{
        fontSize: 12, fontWeight: 700, color: P.accentGold,
        background: withAlpha(P.accent, 0.12), padding: '4px 10px',
        borderRadius: 8, border: `1px solid ${withAlpha(P.accent, 0.28)}`,
        flexShrink: 0, fontFamily: uiTypography.display,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
      }}>
        <span>+{a.shardReward} ◈</span>
        {a.oblivionReward > 0 && (
          <span style={{ fontSize: 11, color: withAlpha(P.accentSoft, 0.9), fontFamily: uiTypography.body }}>+{a.oblivionReward.toLocaleString()} Oblivion</span>
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
            : withAlpha(P.text, 0.04),
          color: a.unlocked && !a.claimed ? '#ffffff' : P.textFaint,
          border: `1px solid ${a.unlocked && !a.claimed ? withAlpha(P.accent, 0.53) : withAlpha(P.text, 0.14)}`,
          borderRadius: 8, padding: '6px 16px',
          fontFamily: uiTypography.display, fontSize: 11, fontWeight: 700,
          cursor: a.unlocked && !a.claimed ? 'pointer' : 'default',
          flexShrink: 0, minWidth: 72, textAlign: 'center',
          boxShadow: a.unlocked && !a.claimed ? `0 4px 14px ${P.accentGlowColor}` : 'none',
          transition: 'all 0.15s',
        }}
      >
        {a.claimed ? '✓ Done' : a.unlocked ? 'Claim' : 'Locked'}
      </button>
    </div>
  );
}
