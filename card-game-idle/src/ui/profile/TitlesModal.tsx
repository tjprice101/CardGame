import { useEffect, useMemo, useState } from 'react';
import { useStore, selectProfile, selectProgress } from '@/state/store';
import { warmTheme } from '@/ui/theme';
import { TITLE_BADGES, type TitleBadgeGroup } from '@/data/profile/titleBadges';

interface Props {
  onClose: () => void;
  onApply?: () => void;
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

export default function TitlesModal({ onClose, onApply }: Props) {
  const profile = useStore(selectProfile);
  const progress = useStore(selectProgress);
  const setTitleId = useStore(s => s.setTitleId);
  const activeTitle = profile.titleId;
  const [selectedTitle, setSelectedTitle] = useState<string | null>(activeTitle);

  const [filterGroup, setFilterGroup] = useState<FilterGroup>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortMode, setSortMode] = useState<SortMode>('unlocked-first');
  const [search, setSearch] = useState('');

  const unlockedCount = useMemo(
    () => TITLE_BADGES.filter(t => t.isUnlocked(progress)).length,
    [progress],
  );

  useEffect(() => {
    setSelectedTitle(activeTitle);
  }, [activeTitle]);
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

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(4,2,1,0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 120, pointerEvents: 'auto',
        fontFamily: 'Georgia, serif', padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="ui-panel-intro"
        style={{
          background: 'linear-gradient(160deg, #0e0603 0%, #080302 60%, #060202 100%)',
          border: '1px solid rgba(200,128,58,0.30)',
          borderRadius: 18,
          width: '100%', maxWidth: 700, maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.72), 0 0 0 1px rgba(200,128,58,0.08)',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div
          className="ui-shimmer-band"
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '20px 26px 16px',
            borderBottom: '1px solid rgba(200,128,58,0.16)',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{
              fontFamily: '"Cinzel", "Cormorant Garamond", Georgia, serif',
              fontSize: 20, fontWeight: 300, letterSpacing: 5, textTransform: 'uppercase',
              color: '#daa058', textShadow: '0 2px 22px rgba(218,160,88,0.38)',
            }}>
              Titles
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <div style={{ height: 1, width: 60, background: 'linear-gradient(90deg, rgba(200,128,58,0.5) 0%, transparent 100%)' }} />
              <span style={{ fontSize: 9, letterSpacing: 3.5, textTransform: 'uppercase', color: 'rgba(218,160,88,0.40)' }}>
                {unlockedCount} of {TITLE_BADGES.length} unlocked
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              border: '1px solid rgba(200,128,58,0.32)',
              background: 'rgba(200,128,58,0.06)',
              color: 'rgba(218,160,88,0.65)',
              fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'inherit', lineHeight: 1, padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Filters + Sort ── */}
        <div style={{
          padding: '12px 26px',
          borderBottom: '1px solid rgba(200,128,58,0.12)',
          flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <input
            type="text"
            placeholder="Search titles…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 13px', borderRadius: 8,
              border: '1px solid rgba(200,128,58,0.22)',
              background: 'rgba(200,128,58,0.05)',
              color: '#f0dfc0',
              fontFamily: 'Georgia, serif', fontSize: 12,
              outline: 'none', boxSizing: 'border-box',
            }}
          />

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Group pills */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {FILTER_GROUPS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilterGroup(f.value)}
                  style={{
                    padding: '4px 11px', borderRadius: 999,
                    border: filterGroup === f.value
                      ? '1px solid rgba(200,128,58,0.60)'
                      : '1px solid rgba(200,128,58,0.18)',
                    background: filterGroup === f.value
                      ? 'rgba(200,128,58,0.16)' : 'rgba(200,128,58,0.04)',
                    color: filterGroup === f.value
                      ? '#daa058' : 'rgba(218,160,88,0.45)',
                    fontSize: 9.5, letterSpacing: 0.8, cursor: 'pointer',
                    fontFamily: 'Georgia, serif', textTransform: 'uppercase',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Status pills */}
              <div style={{ display: 'flex', gap: 4 }}>
                {FILTER_STATUSES.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFilterStatus(f.value)}
                    style={{
                      padding: '4px 9px', borderRadius: 6,
                      border: filterStatus === f.value
                        ? '1px solid rgba(200,128,58,0.50)'
                        : '1px solid rgba(200,128,58,0.14)',
                      background: filterStatus === f.value
                        ? 'rgba(200,128,58,0.12)' : 'rgba(200,128,58,0.03)',
                      color: filterStatus === f.value
                        ? '#daa058' : 'rgba(218,160,88,0.40)',
                      fontSize: 9.5, cursor: 'pointer', fontFamily: 'Georgia, serif',
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
                  padding: '5px 8px', borderRadius: 6,
                  border: '1px solid rgba(200,128,58,0.20)',
                  background: 'rgba(8,4,1,0.8)',
                  color: 'rgba(218,160,88,0.60)',
                  fontFamily: 'Georgia, serif', fontSize: 9.5, cursor: 'pointer',
                }}
              >
                {SORT_MODES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Results count ── */}
        <div style={{
          padding: '6px 26px 0',
          fontSize: 9.5, color: 'rgba(218,160,88,0.36)',
          flexShrink: 0, letterSpacing: 1,
        }}>
          {filtered.length} title{filtered.length !== 1 ? 's' : ''} shown
          {activeTitle && (
            <span style={{ marginLeft: 12, color: 'rgba(218,160,88,0.60)' }}>
              Equipped: <strong style={{ color: '#daa058' }}>
                {TITLE_BADGES.find(t => t.id === activeTitle)?.text ?? 'Unknown'}
              </strong>
            </span>
          )}
        </div>

        {/* ── Title list ── */}
        <div style={{
          overflowY: 'auto', flex: 1,
          padding: '12px 26px 20px',
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          {(filterGroup === 'all' || filterStatus !== 'locked') && (
            <TitleCard
              text="— None —" description="Display no title."
              group={null} unlocked={true}
              active={selectedTitle === null}
              onEquip={() => setSelectedTitle(null)}
            />
          )}

          {filtered.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: 'rgba(218,160,88,0.38)',
              fontSize: 13, padding: '32px 0', fontStyle: 'italic',
            }}>
              No titles match your filters.
            </div>
          ) : (
            filtered.map(t => {
              const unlocked = t.isUnlocked(progress);
              const active = selectedTitle === t.id && unlocked;
              return (
                <TitleCard
                  key={t.id} text={t.text} description={t.description}
                  group={t.group} unlocked={unlocked} active={active}
                  onEquip={() => unlocked && setSelectedTitle(t.id)}
                />
              );
            })
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '10px 26px',
          borderTop: '1px solid rgba(200,128,58,0.12)',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, rgba(200,128,58,0.18) 50%, transparent 100%)' }} />
          <div style={{ fontSize: 9.5, color: 'rgba(218,160,88,0.35)', letterSpacing: 1, textAlign: 'center' }}>
            Titles unlock as you earn milestones · Select a title and apply it
          </div>
          <button
            onClick={() => {
              setTitleId(selectedTitle);
              onApply?.();
              onClose();
            }}
            className="menu-tactile-btn"
            style={{
              border: '1px solid rgba(200,128,58,0.36)',
              background: 'rgba(200,128,58,0.11)',
              color: '#e8c793',
              borderRadius: 8,
              padding: '6px 12px',
              fontFamily: 'Georgia, serif',
              fontSize: 11,
              letterSpacing: 0.5,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Apply Title
          </button>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, rgba(200,128,58,0.18) 50%, transparent 100%)' }} />
        </div>
      </div>
    </div>
  );
}

const GC: Record<TitleBadgeGroup, { text: string; border: string }> = {
  milestone: { text: '#c8a050', border: 'rgba(200,160,80,0.35)' },
  boss:      { text: '#c07070', border: 'rgba(192,112,112,0.35)' },
  infinite:  { text: '#7aabf8', border: 'rgba(122,171,248,0.35)' },
  set:       { text: '#6ec878', border: 'rgba(110,200,120,0.35)' },
};

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
  return (
    <button
      onClick={onEquip}
      disabled={!unlocked}
      style={{
        display: 'flex', alignItems: 'center', gap: 13,
        padding: '10px 14px', borderRadius: 10,
        border: active
          ? '1px solid rgba(200,128,58,0.60)'
          : unlocked
            ? '1px solid rgba(200,128,58,0.16)'
            : '1px solid rgba(200,128,58,0.06)',
        background: active
          ? 'rgba(200,128,58,0.10)'
          : unlocked
            ? 'rgba(200,128,58,0.04)'
            : 'rgba(0,0,0,0.12)',
        cursor: unlocked ? 'pointer' : 'default',
        textAlign: 'left', fontFamily: 'Georgia, serif',
        width: '100%',
        borderLeft: active ? '3px solid rgba(200,128,58,0.80)' : undefined,
        filter: unlocked ? undefined : 'grayscale(0.55) opacity(0.52)',
        transition: 'background 120ms ease, border-color 120ms ease',
        paddingLeft: active ? 11 : 14,
      }}
    >
      {/* Equip indicator */}
      <div style={{
        width: 18, flexShrink: 0,
        fontSize: 12, lineHeight: 1, textAlign: 'center',
        color: active ? '#c8803a' : unlocked ? 'rgba(218,160,88,0.45)' : 'rgba(200,128,58,0.20)',
      }}>
        {active ? '✦' : unlocked ? '○' : '⊘'}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: active ? 600 : 400,
          color: unlocked ? (active ? '#daa058' : '#f0dfc0') : 'rgba(218,160,88,0.40)',
          letterSpacing: 0.3,
        }}>
          {text}
        </div>
        <div style={{
          fontSize: 10, lineHeight: 1.35,
          color: unlocked ? 'rgba(218,160,88,0.48)' : 'rgba(200,128,58,0.22)',
          marginTop: 2,
        }}>
          {description}
        </div>
      </div>

      {/* Group badge */}
      {group && (
        <div style={{
          flexShrink: 0, padding: '3px 8px', borderRadius: 999,
          fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase',
          color: GC[group].text,
          border: `1px solid ${GC[group].border}`,
          background: 'rgba(0,0,0,0.18)',
        }}>
          {GROUP_LABELS[group]}
        </div>
      )}
    </button>
  );
}

void warmTheme;
