import { useMemo, useState } from 'react';
import { useStore, selectProfile, selectProgress } from '@/state/store';
import { warmTheme } from '@/ui/theme';
import { TITLE_BADGES, type TitleBadgeGroup } from '@/data/profile/titleBadges';

interface Props {
  onClose: () => void;
}

type FilterGroup = 'all' | TitleBadgeGroup;
type FilterStatus = 'all' | 'unlocked' | 'locked';
type SortMode = 'group' | 'alpha' | 'unlocked-first';

const GROUP_LABELS: Record<TitleBadgeGroup, string> = {
  milestone: 'Milestone',
  boss: 'Boss',
  infinite: 'Infinite Card',
  set: 'Set Completion',
};

const GROUP_COLORS: Record<TitleBadgeGroup, { bg: string; text: string; border: string }> = {
  milestone: { bg: 'rgba(214,162,94,0.18)', text: '#111', border: 'rgba(214,162,94,0.4)' },
  boss: { bg: 'rgba(184,92,79,0.18)', text: '#111', border: 'rgba(184,92,79,0.38)' },
  infinite: { bg: 'rgba(122,169,255,0.18)', text: '#111', border: 'rgba(122,169,255,0.38)' },
  set: { bg: 'rgba(110,190,120,0.18)', text: '#111', border: 'rgba(110,190,120,0.36)' },
};

const FILTER_GROUPS: { value: FilterGroup; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'boss', label: 'Boss' },
  { value: 'infinite', label: 'Infinite' },
  { value: 'set', label: 'Set' },
];

const FILTER_STATUSES: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unlocked', label: 'Unlocked' },
  { value: 'locked', label: 'Locked' },
];

const SORT_MODES: { value: SortMode; label: string }[] = [
  { value: 'group', label: 'By Group' },
  { value: 'unlocked-first', label: 'Unlocked First' },
  { value: 'alpha', label: 'A–Z' },
];

export default function TitlesModal({ onClose }: Props) {
  const profile = useStore(selectProfile);
  const progress = useStore(selectProgress);
  const setTitleId = useStore(s => s.setTitleId);

  const [filterGroup, setFilterGroup] = useState<FilterGroup>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortMode, setSortMode] = useState<SortMode>('unlocked-first');
  const [search, setSearch] = useState('');

  const unlockedCount = useMemo(
    () => TITLE_BADGES.filter(t => t.isUnlocked(progress)).length,
    [progress],
  );

  const filtered = useMemo(() => {
    let list = TITLE_BADGES.slice();
    if (filterGroup !== 'all') list = list.filter(t => t.group === filterGroup);
    if (filterStatus === 'unlocked') list = list.filter(t => t.isUnlocked(progress));
    if (filterStatus === 'locked') list = list.filter(t => !t.isUnlocked(progress));
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(t =>
        t.text.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
      );
    }
    if (sortMode === 'alpha') {
      list = [...list].sort((a, b) => a.text.localeCompare(b.text));
    } else if (sortMode === 'unlocked-first') {
      list = [...list].sort((a, b) => {
        const au = a.isUnlocked(progress) ? 0 : 1;
        const bu = b.isUnlocked(progress) ? 0 : 1;
        return au - bu || a.group.localeCompare(b.group) || a.text.localeCompare(b.text);
      });
    } else {
      // group order: milestone → boss → infinite → set
      const order: TitleBadgeGroup[] = ['milestone', 'boss', 'infinite', 'set'];
      list = [...list].sort((a, b) => {
        const ag = order.indexOf(a.group);
        const bg = order.indexOf(b.group);
        return ag - bg || a.text.localeCompare(b.text);
      });
    }
    return list;
  }, [filterGroup, filterStatus, sortMode, search, progress]);

  const activeTitle = profile.titleId;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,6,14,0.82)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 120,
        pointerEvents: 'auto',
        fontFamily: 'Georgia, serif',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="ui-panel-intro"
        style={{
          background: warmTheme.surfaceStrong,
          border: `1px solid ${warmTheme.borderStrong}`,
          borderRadius: 18,
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(214,162,94,0.12)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="ui-shimmer-band"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px 16px',
            borderBottom: `1px solid ${warmTheme.border}`,
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <div>
            <div className="ui-title-glow" style={{ fontSize: 20, fontWeight: 'bold', color: warmTheme.accentDeep, letterSpacing: 2, textTransform: 'uppercase' }}>
              Titles
            </div>
            <div style={{ fontSize: 11, color: warmTheme.textMuted, marginTop: 2, letterSpacing: 0.5 }}>
              {unlockedCount} / {TITLE_BADGES.length} unlocked
            </div>
          </div>
          <button
            className="menu-tactile-btn"
            onClick={onClose}
            style={{
              background: 'transparent', border: `1px solid ${warmTheme.border}`,
              color: warmTheme.textMuted, fontSize: 16, cursor: 'pointer',
              lineHeight: 1, padding: '4px 10px', borderRadius: 8,
            }}
          >
            ✕
          </button>
        </div>

        {/* Filters + Sort */}
        <div style={{ padding: '12px 24px', borderBottom: `1px solid ${warmTheme.border}`, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search titles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 12px',
              borderRadius: 8,
              border: `1px solid ${warmTheme.border}`,
              background: 'rgba(0,0,0,0.18)',
              color: warmTheme.text,
              fontFamily: 'Georgia, serif',
              fontSize: 12,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Group filter pills */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {FILTER_GROUPS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilterGroup(f.value)}
                  className="menu-tactile-btn"
                  style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    border: `1px solid ${filterGroup === f.value ? warmTheme.accent : warmTheme.border}`,
                    background: filterGroup === f.value ? 'rgba(214,162,94,0.16)' : 'transparent',
                    color: filterGroup === f.value ? warmTheme.text : warmTheme.textMuted,
                    fontSize: 10,
                    letterSpacing: 0.5,
                    cursor: 'pointer',
                    fontFamily: 'Georgia, serif',
                    textTransform: 'uppercase',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Status filter */}
              <div style={{ display: 'flex', gap: 4 }}>
                {FILTER_STATUSES.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFilterStatus(f.value)}
                    className="menu-tactile-btn"
                    style={{
                      padding: '4px 9px',
                      borderRadius: 6,
                      border: `1px solid ${filterStatus === f.value ? warmTheme.accent : warmTheme.border}`,
                      background: filterStatus === f.value ? 'rgba(214,162,94,0.1)' : 'transparent',
                      color: filterStatus === f.value ? warmTheme.text : warmTheme.textMuted,
                      fontSize: 10,
                      cursor: 'pointer',
                      fontFamily: 'Georgia, serif',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <select
                value={sortMode}
                onChange={e => setSortMode(e.target.value as SortMode)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: `1px solid ${warmTheme.border}`,
                  background: warmTheme.surface,
                  color: warmTheme.textMuted,
                  fontFamily: 'Georgia, serif',
                  fontSize: 10,
                  cursor: 'pointer',
                }}
              >
                {SORT_MODES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div style={{ padding: '6px 24px 0', fontSize: 10, color: warmTheme.textFaint, flexShrink: 0 }}>
          {filtered.length} title{filtered.length !== 1 ? 's' : ''} shown
          {activeTitle && (
            <span style={{ marginLeft: 12, color: warmTheme.text }}>
              Currently equipped: <strong>{TITLE_BADGES.find(t => t.id === activeTitle)?.text ?? 'Unknown'}</strong>
            </span>
          )}
        </div>

        {/* Title list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 24px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* None option */}
          {(filterGroup === 'all' || filterStatus !== 'locked') && (
            <TitleCard
              text="— None —"
              description="Display no title."
              group={null}
              unlocked={true}
              active={activeTitle === null}
              onEquip={() => setTitleId(null)}
            />
          )}

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: warmTheme.textMuted, fontSize: 13, padding: '32px 0', fontStyle: 'italic' }}>
              No titles match your filters.
            </div>
          ) : (
            filtered.map(t => {
              const unlocked = t.isUnlocked(progress);
              const active = activeTitle === t.id && unlocked;
              return (
                <TitleCard
                  key={t.id}
                  text={t.text}
                  description={t.description}
                  group={t.group}
                  unlocked={unlocked}
                  active={active}
                  onEquip={() => unlocked && setTitleId(t.id)}
                />
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 24px',
          borderTop: `1px solid ${warmTheme.border}`,
          fontSize: 10,
          color: warmTheme.textMuted,
          textAlign: 'center',
          flexShrink: 0,
          lineHeight: 1.5,
        }}>
          Titles unlock automatically as you earn milestones. Click an unlocked title to equip it.
        </div>
      </div>
    </div>
  );
}

function TitleCard({
  text, description, group, unlocked, active, onEquip,
}: {
  text: string;
  description: string;
  group: TitleBadgeGroup | null;
  unlocked: boolean;
  active: boolean;
  onEquip: () => void;
}) {
  const colors = group ? GROUP_COLORS[group] : null;

  return (
    <button
      onClick={onEquip}
      disabled={!unlocked}
      className={unlocked ? 'menu-tactile-btn' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 10,
        border: active
          ? `2px solid ${warmTheme.accent}`
          : `1px solid ${warmTheme.border}`,
        background: active
          ? 'rgba(214,162,94,0.12)'
          : unlocked
            ? 'rgba(255,255,255,0.025)'
            : 'rgba(0,0,0,0.06)',
        cursor: unlocked ? 'pointer' : 'default',
        textAlign: 'left',
        fontFamily: 'Georgia, serif',
        width: '100%',
        transition: 'background 120ms ease, border-color 120ms ease',
      }}
    >
      {/* Lock / equip indicator */}
      <div style={{
        width: 22,
        flexShrink: 0,
        fontSize: 14,
        color: unlocked ? warmTheme.text : warmTheme.textFaint,
        textAlign: 'center',
        lineHeight: 1,
      }}>
        {active ? '✓' : unlocked ? '○' : '🔒'}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 'bold',
          color: unlocked ? warmTheme.text : warmTheme.textMuted,
          letterSpacing: 0.3,
        }}>
          {text}
        </div>
        <div style={{
          fontSize: 10,
          color: unlocked ? warmTheme.textMuted : warmTheme.textFaint,
          marginTop: 2,
          lineHeight: 1.35,
        }}>
          {description}
        </div>
      </div>

      {/* Group badge */}
      {group && colors && (
        <div style={{
          flexShrink: 0,
          padding: '3px 8px',
          borderRadius: 12,
          fontSize: 9,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          background: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
        }}>
          {GROUP_LABELS[group]}
        </div>
      )}
    </button>
  );
}
