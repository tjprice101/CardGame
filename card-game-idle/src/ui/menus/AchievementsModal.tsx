import { useMemo, useState } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { uiTypography, warmTheme } from '@/ui/theme';
import { useThemeVersion } from '@/ui/useThemeVersion';
import { listAchievements, summarizeAchievements } from '@/systems/progression/achievements';
import { ACHIEVEMENT_CATEGORIES, getAchievementCategory, type AchievementCategoryId } from '@/systems/progression/achievementCategories';
import './AchievementsModal.css';

interface Props {
  onClose: () => void;
}

function getThemePalette() {
  const safe = (value: unknown, fallback: string): string => (
    typeof value === 'string' && value.trim().length > 0 ? value : fallback
  );

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
    bg: warmTheme.appBackground,
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

type AchievementEntry = ReturnType<typeof listAchievements>[number];
type AchievementStatus = 'all' | 'claimable' | 'locked' | 'claimed';

export default function AchievementsModal({ onClose }: Props) {
  useThemeVersion();
  const P = getThemePalette();
  const progress = useStore(selectProgress);
  const claimAchievement = useStore(s => s.claimAchievement);
  const claimAllAchievements = useStore(s => s.claimAllAchievements);
  const summary = useMemo(() => summarizeAchievements(progress), [progress]);
  const allAchievements = useMemo(() => listAchievements(progress), [progress]);
  const grouped = useMemo(() => {
    const out = new Map<AchievementCategoryId, AchievementEntry[]>();
    for (const a of allAchievements) {
      const category = getAchievementCategory(a);
      const entries = out.get(category) ?? [];
      entries.push(a);
      out.set(category, entries);
    }
    return out;
  }, [allAchievements]);

  const [activeGroup, setActiveGroup] = useState<AchievementCategoryId | 'all'>('all');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AchievementStatus>('all');
  const activeCategory = ACHIEVEMENT_CATEGORIES.find(category => category.id === activeGroup);
  const items = activeGroup === 'all' ? allAchievements : grouped.get(activeGroup) ?? [];
  const query = search.trim().toLowerCase();
  const visibleSections = ACHIEVEMENT_CATEGORIES
    .filter(category => activeGroup === 'all' || category.id === activeGroup)
    .map(category => ({
      ...category,
      entries: (grouped.get(category.id) ?? []).filter(achievement => {
        const matchesSearch = `${achievement.text} ${achievement.description} ${achievement.backgroundReward?.name ?? ''} ${category.label} ${category.section}`
          .toLowerCase().includes(query);
        const matchesStatus = status === 'all'
          || (status === 'claimable' && achievement.unlocked && !achievement.claimed)
          || (status === 'locked' && !achievement.unlocked)
          || (status === 'claimed' && achievement.claimed);
        return matchesSearch && matchesStatus;
      }),
    }))
    .filter(category => category.entries.length > 0);
  const visibleCount = visibleSections.reduce((count, category) => count + category.entries.length, 0);
  const unlockedInGroup = items.filter(a => a.unlocked).length;
  const accentTriplet = toRgbTriplet(P.accent) ?? [58, 142, 200];
  const accentSoftTriplet = toRgbTriplet(P.accentGold) ?? [90, 171, 218];

  return (
    <div
      onClick={onClose}
      className="ui-panel-intro achievements-modal"
      style={{
        position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'auto',
        background: P.bg,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: uiTypography.body,
      }}
    >
      {/* Atmospheric washes — Warm Hearth */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '70%', height: '85%', background: `radial-gradient(ellipse, ${withAlpha(P.accent, 0.05)} 0%, transparent 68%)`, filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-18%', right: '-8%', width: '60%', height: '70%', background: `radial-gradient(ellipse, ${withAlpha(P.accentGold, 0.03)} 0%, transparent 65%)`, filter: 'blur(90px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 44%, transparent 22%, ${P.overlayVeil} 100%)`, pointerEvents: 'none' }} />
      <div className="achievements-scanlines" style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(0deg, transparent, transparent 3px, ${P.stripe} 3px, ${P.stripe} 4px)`, pointerEvents: 'none' }} />

      {/* Ornamental top accent */}
      <div style={{
        height: 3, flexShrink: 0,
        background: `linear-gradient(90deg, transparent, ${P.accentDeep}, ${P.accent}, ${P.accentDeep}, transparent)`,
        boxShadow: `0 0 24px ${P.accentGlowColor}`,
      }} />

      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden',
        ['--ui-accent' as any]: `${accentTriplet[0]}, ${accentTriplet[1]}, ${accentTriplet[2]}`,
        ['--ui-accent-soft' as any]: `${accentSoftTriplet[0]}, ${accentSoftTriplet[1]}, ${accentSoftTriplet[2]}`,
      } as React.CSSProperties}>

        {/* ── Header ── */}
        <div className="ui-shimmer-band ui-artwork-header achievements-header" style={{
          position: 'relative',
          padding: '22px 32px 18px',
          borderBottom: `1px solid ${P.border}`,
          display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0,
          backgroundImage: `linear-gradient(90deg, rgba(10,5,14,0.98) 0%, rgba(28,10,24,0.94) 38%, rgba(30,12,24,0.72) 68%, rgba(20,12,24,0.46) 100%), url("${import.meta.env.BASE_URL}assets/menu-banners/achievements.png")`,
          backgroundPosition: 'right center', backgroundSize: 'cover',
          boxShadow: `0 8px 28px rgba(0,0,0,0.32), inset 0 -1px 0 ${P.accentGlowColor}`,
        }}>
          <div data-ui-artwork-copy style={{ flex: 1 }}>
            <div style={{
              fontSize: 10, letterSpacing: 3.5, textTransform: 'uppercase',
              color: P.accentGold, fontFamily: uiTypography.display, marginBottom: 6,
              textShadow: '0 1px 3px rgba(0,0,0,0.9)',
            }}>
              MILESTONES
            </div>
            <div className="ui-title-glow" style={{
              fontSize: 32, fontWeight: 700, letterSpacing: 1.5,
              color: '#fff2f5', fontFamily: uiTypography.display,
              textShadow: `0 0 28px ${P.accentGlowColor}, 0 2px 8px rgba(0,0,0,0.95)`,
            }}>
              Achievements
            </div>
            <div style={{
              fontSize: 13, color: '#f7e8ed', marginTop: 5,
              letterSpacing: 0.3, lineHeight: 1.4,
              textShadow: '0 1px 4px rgba(0,0,0,0.95)',
            }}>
              Track cards played, bosses defeated, and collections completed.
            </div>
          </div>

          {/* Hero stats — emblem pillars */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '7px 8px 7px 16px', borderLeft: `1px solid ${P.borderStrong}`, borderRadius: 10, background: P.panelStrong, boxShadow: warmTheme.shadow, flexShrink: 0 }}>
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

          {summary.unlocked > summary.claimed && (
            <button
              type="button"
              onClick={claimAllAchievements}
              style={{
                height: 38, padding: '0 16px', borderRadius: 7, cursor: 'pointer',
                border: `1px solid ${P.borderStrong}`, background: warmTheme.button,
                color: P.text, fontFamily: uiTypography.display, fontSize: 11, letterSpacing: 0.8,
              }}
            >
              Claim All
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              width: 42, height: 42, borderRadius: '50%', cursor: 'pointer',
              background: P.panelStrong, border: `1px solid ${P.borderStrong}`,
              color: '#fff2f5', fontSize: 16, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0, transition: 'all 0.18s ease', padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Body: sidebar + main ── */}
        <div className="achievements-body" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left: group navigation */}
          <nav aria-label="Achievement categories" className="achievements-categories" style={{
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
            {[{ id: 'all' as const, section: '', label: 'All Achievements' }, ...ACHIEVEMENT_CATEGORIES].map((category, index, categories) => {
              const g = category.id;
              const gItems = g === 'all' ? allAchievements : grouped.get(g) ?? [];
              const gUnlocked = gItems.filter(a => a.unlocked).length;
              const isActive = g === activeGroup;
              const gc = P.accent;
              return (
                <div key={g} className="achievements-category-option">
                  {category.section && category.section !== categories[index - 1]?.section && (
                    <div className="achievements-category-section" style={{ color: P.textMuted }}>
                      {category.section}
                    </div>
                  )}
                <button
                  onClick={() => setActiveGroup(g)}
                  aria-label={category.label}
                  aria-pressed={isActive}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    background: isActive ? P.panelStrong : 'transparent',
                    border: `1px solid ${isActive ? P.borderStrong : withAlpha(P.text, 0.12)}`,
                    boxShadow: isActive ? warmTheme.glow : undefined,
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
                    {g === 'infinite' ? '∞' : '◇'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ui-button-title" style={{
                      fontSize: 12, fontWeight: 700, color: isActive ? gc : P.textMuted,
                      fontFamily: uiTypography.display, letterSpacing: 0.3,
                    }}>
                      {category.label}
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
                    }} role="img" aria-label="Rewards ready to claim" />
                  )}
                </button>
                </div>
              );
            })}
          </nav>

          {/* Right: achievement list */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Group header */}
            <div className="achievements-list-header" style={{
              padding: '18px 28px 14px',
              borderBottom: `1px solid ${P.border}`,
              flexShrink: 0,
              background: P.overlaySoft,
              backdropFilter: 'blur(6px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{
                  fontSize: 22, color: P.accent,
                  textShadow: `0 0 20px ${P.accentGlowColor}`,
                }}>
                  ◇
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 18, fontWeight: 700, color: P.accent,
                    fontFamily: uiTypography.display, letterSpacing: 1,
                  }}>
                    {activeCategory?.label ?? 'All Achievements'}
                  </div>
                  <div style={{ fontSize: 11, color: P.textMuted, marginTop: 2 }}>
                    {activeCategory?.description ?? 'Browse achievements by gameplay, collection, battles, progression, social, and cosmetics.'}
                  </div>
                </div>
                <div style={{
                  padding: '6px 14px', borderRadius: 20,
                  background: unlockedInGroup === items.length && items.length > 0
                    ? P.successBg : P.panelStrong,
                  border: `1px solid ${unlockedInGroup === items.length && items.length > 0 ? withAlpha(P.success, 0.4) : P.border}`,
                  fontSize: 12, fontWeight: 700,
                  color: unlockedInGroup === items.length && items.length > 0 ? P.success : P.accent,
                  fontFamily: uiTypography.display,
                }}>
                  {unlockedInGroup}/{items.length}
                </div>
                <div className="achievements-filters">
                  <input
                    type="search"
                    aria-label="Search achievements"
                    placeholder="Search titles, requirements, or rewards..."
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    style={{ color: P.text, background: P.panelStrong, border: `1px solid ${P.border}` }}
                  />
                  <label style={{ color: P.textMuted }}>
                    Status
                    <select
                      aria-label="Achievement status"
                      value={status}
                      onChange={event => setStatus(event.target.value as AchievementStatus)}
                      style={{ color: P.text, background: P.panelStrong, border: `1px solid ${P.border}` }}
                    >
                      <option value="all">All statuses</option>
                      <option value="claimable">Ready to claim</option>
                      <option value="locked">Locked</option>
                      <option value="claimed">Claimed</option>
                    </select>
                  </label>
                  <span role="status" style={{ fontSize: 11, color: P.textMuted }}>{visibleCount} shown</span>
                </div>
              </div>
            </div>

            {/* Achievement rows */}
            <div className="achievements-list" style={{ flex: 1, overflowY: 'auto', padding: '16px 28px' }}>
              {visibleSections.map(category => (
                <section key={category.id} aria-label={`${category.label} achievements`} style={{ marginBottom: 24 }}>
                  <h2 style={{ color: P.accent, fontFamily: uiTypography.display, fontSize: 14, margin: '0 0 12px' }}>
                    {category.section} / {category.label}
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {category.entries.map(a => (
                      <AchievementRow
                        key={a.id}
                        achievement={a}
                        onClaim={() => claimAchievement(a.id)}
                        groupColor={P.accent}
                      />
                    ))}
                  </div>
                </section>
              ))}
              {visibleCount === 0 && (
                <p style={{ color: P.textMuted }}>No achievements match these filters. Try another search or status.</p>
              )}
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
  const P = getThemePalette();
  return (
    <div className="achievement-summary-stat" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '7px 16px', gap: 4,
      boxShadow: pulse ? `0 0 24px ${withAlpha(accent, 0.2)}` : 'none',
    }}>
      <div style={{
        fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
        color: P.text, fontWeight: 700, whiteSpace: 'nowrap',
        fontFamily: uiTypography.body,
      }}>{icon} {label}</div>
      <div style={{
        fontSize: 22, fontWeight: 700, letterSpacing: 0.5, color: P.text,
        fontVariantNumeric: 'tabular-nums',
        fontFamily: uiTypography.display,
      }}>
        {value}
        {sub && <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 4, color: P.textMuted, fontFamily: uiTypography.body }}>{sub}</span>}
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
    ? P.panelStrong
    : a.unlocked
      ? P.panelStrong
      : P.panel;
  const stateBorder = a.claimed
    ? withAlpha(P.success, 0.2)
    : a.unlocked
      ? withAlpha(gc, 0.35)
      : withAlpha(P.text, 0.12);

  return (
    <article aria-label={a.text} data-achievement-id={a.id} className="achievement-row" style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 16px',
      background: stateBg,
      border: `1px solid ${stateBorder}`,
      borderRadius: 12,
      boxShadow: a.unlocked && !a.claimed ? `0 2px 16px ${withAlpha(gc, 0.14)}` : 'none',
      transition: 'all 0.2s',
    }}>
      {/* State badge / optional Causality artwork */}
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: a.claimed ? withAlpha(P.success, 0.14) : a.unlocked ? withAlpha(gc, 0.16) : withAlpha(P.text, 0.05),
        border: `1px solid ${a.claimed ? withAlpha(P.success, 0.25) : a.unlocked ? withAlpha(gc, 0.35) : withAlpha(P.text, 0.14)}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, color: a.claimed ? P.success : a.unlocked ? gc : P.textFaint,
        textShadow: a.unlocked && !a.claimed ? `0 0 16px ${withAlpha(gc, 0.4)}` : 'none',
      }}>
        {a.imageAssetKey ? <img src={`${import.meta.env.BASE_URL}assets/achievement-icons/${a.imageAssetKey}.png`} alt="" width={28} height={28} style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 7, opacity: a.unlocked ? 1 : 0.5 }} /> : a.claimed ? '✓' : a.unlocked ? '★' : '🔒'}
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
        {a.backgroundReward && (
          <div style={{ fontSize: 11, color: 'var(--profile-text-soft)', marginTop: 5, lineHeight: 1.4 }}>
            {a.backgroundReward.rarity} main menu background: {a.backgroundReward.name}
            <div style={{ color: 'var(--profile-text-muted)' }}>Automatically unlocked when earned; equip it in your profile once its artwork is installed.</div>
          </div>
        )}
      </div>

      {/* Reward badge */}
      <div style={{
        fontSize: 12, fontWeight: 700, color: P.accentGold,
        background: withAlpha(P.accent, 0.12), padding: '4px 10px',
        borderRadius: 8, border: `1px solid ${withAlpha(P.accent, 0.28)}`,
        flexShrink: 0, fontFamily: uiTypography.display,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
      }}>
        {a.backgroundReward && <span style={{ color: 'var(--profile-text)' }}>Background + Title</span>}
        {a.shardReward > 0 && <span>+{a.shardReward} ◈</span>}
        {a.divineLightReward > 0 && (
          <span style={{ fontSize: 11, color: withAlpha(P.accentGold, 0.9), fontFamily: uiTypography.body }}>+{a.divineLightReward.toLocaleString()} Divine Light</span>
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
    </article>
  );
}
