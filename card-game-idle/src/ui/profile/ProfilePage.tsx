import { useMemo, useState } from 'react';
import { useStore, selectProfile, selectProgress } from '@/state/store';
import { warmTheme } from '@/ui/theme';
import { AVATARS, AVATAR_BY_ID, DEFAULT_AVATAR_ID, resolveAvatar } from '@/data/profile/avatars';
import { TITLE_BADGES, TITLE_BADGE_BY_ID, resolveTitleBadge } from '@/data/profile/titleBadges';
import { UI_THEMES, DEFAULT_UI_THEME_ID, CUSTOM_THEME_EDITABLE_KEYS } from '@/data/profile/uiThemes';

interface Props {
  onClose: () => void;
}

export default function ProfilePage({ onClose }: Props) {
  const profile = useStore(selectProfile);
  const progress = useStore(selectProgress);
  const setPlayerName = useStore(s => s.setPlayerName);
  const setAvatarId = useStore(s => s.setAvatarId);
  const setTitleId = useStore(s => s.setTitleId);
  const setUiThemeId = useStore(s => s.setUiThemeId);
  const setCustomUiThemeColor = useStore(s => s.setCustomUiThemeColor);
  const resetCustomUiTheme = useStore(s => s.resetCustomUiTheme);
  const dailyLogin = useStore(s => s.progress.dailyLogin);

  const [nameDraft, setNameDraft] = useState(profile.name);
  const [showCustomEditor, setShowCustomEditor] = useState(false);

  const unlockedAvatars = useMemo(
    () => AVATARS.filter(a => a.isUnlocked(progress)),
    [progress],
  );
  const unlockedTitles = useMemo(
    () => TITLE_BADGES.filter(t => t.isUnlocked(progress)),
    [progress],
  );

  // Display values use the resolvers so stale ids fall back gracefully.
  const currentAvatar = resolveAvatar(profile.avatarId, progress);
  const currentTitle = resolveTitleBadge(profile.titleId, progress);

  const totalCollection = useMemo(
    () => Object.values(progress.collection).reduce((a, b) => a + b, 0),
    [progress.collection],
  );
  const distinctCards = Object.keys(progress.collection).length;
  const distinctBosses = Object.keys(progress.bossClearCounts).length;
  const totalBossClears = Object.values(progress.bossClearCounts).reduce((a, b) => a + b, 0);

  function commitName() {
    if (nameDraft.trim()) setPlayerName(nameDraft);
    else setNameDraft(profile.name);
  }

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(circle at 50% 14%, rgba(201, 170, 112, 0.2) 0%, rgba(201, 170, 112, 0) 36%), radial-gradient(circle at 10% 86%, rgba(104, 134, 174, 0.2) 0%, rgba(104, 134, 174, 0) 40%), repeating-linear-gradient(35deg, rgba(222, 196, 148, 0.06) 0px, rgba(222, 196, 148, 0.06) 1px, rgba(0, 0, 0, 0) 1px, rgba(0, 0, 0, 0) 20px), linear-gradient(180deg, rgba(16, 18, 23, 0.965) 0%, rgba(19, 24, 31, 0.965) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, pointerEvents: 'auto', fontFamily: 'Georgia, serif',
      ['--ui-accent' as any]: '230, 196, 132',
      ['--ui-accent-soft' as any]: '250, 224, 184',
    }}>
      <div className="ui-panel-intro" style={{
        background: warmTheme.surfaceStrong,
        border: `1px solid ${warmTheme.borderStrong}`,
        borderRadius: 16,
        padding: '24px 28px',
        width: 460,
        boxShadow: warmTheme.shadow,
        maxHeight: '88vh',
        overflowY: 'auto',
        position: 'relative',
      }}>
        {/* Header */}
        <div className="ui-shimmer-band" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 16, borderBottom: `1px solid ${warmTheme.border}`, paddingBottom: 12,
          position: 'relative',
        }}>
          <div className="ui-title-glow" style={{ fontSize: 18, fontWeight: 'bold', color: warmTheme.accentDeep, letterSpacing: 2 }}>
            Profile
          </div>
          <button className="menu-tactile-btn"
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: warmTheme.textMuted,
              fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '0 4px',
            }}
          >X</button>
        </div>

        {/* Identity card */}
        <div style={{
          display: 'flex', gap: 16, alignItems: 'center',
          padding: 12, marginBottom: 16,
          background: 'rgba(0,0,0,0.04)', borderRadius: 12,
          border: `1px solid ${warmTheme.border}`,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: warmTheme.accentSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34, color: warmTheme.accentDeep,
            border: `2px solid ${warmTheme.borderStrong}`,
            boxShadow: warmTheme.glow,
            flexShrink: 0,
          }}>{currentAvatar.glyph}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              maxLength={24}
              style={{
                width: '100%', fontSize: 17, fontWeight: 'bold',
                color: warmTheme.text, background: 'transparent',
                border: 'none', borderBottom: `1px solid ${warmTheme.border}`,
                outline: 'none', fontFamily: 'Georgia, serif', padding: '2px 0',
              }}
            />
            <div style={{ fontSize: 12, color: warmTheme.accent, marginTop: 4, fontStyle: 'italic' }}>
              {currentTitle ? currentTitle.text : 'No title selected'}
            </div>
          </div>
        </div>

        {/* Stats summary */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
          marginBottom: 16,
        }}>
          <StatCell label="Oblivion" value={progress.oblivion.toLocaleString()} />
          <StatCell label="Shards" value={progress.aberratedShards.toLocaleString()} />
          <StatCell label="Cards Played" value={progress.totalCardsPlayed.toLocaleString()} />
          <StatCell label="Cards Owned" value={`${totalCollection} (${distinctCards})`} />
          <StatCell label="Bosses" value={`${totalBossClears} (${distinctBosses})`} />
          <StatCell label="Login Streak" value={`${dailyLogin.streak}d`} />
          <StatCell label="Total Logins" value={dailyLogin.totalClaims.toLocaleString()} />
          <StatCell label="Unlocked" value={`${unlockedAvatars.length}A / ${unlockedTitles.length}T`} />
        </div>

        {/* Avatar picker */}
        <SectionHeader>Avatar</SectionHeader>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8,
          marginBottom: 16,
        }}>
          {AVATARS.map(a => {
            const unlocked = a.isUnlocked(progress);
            const active = profile.avatarId === a.id && unlocked;
            return (
              <button
                key={a.id}
                disabled={!unlocked}
                onClick={() => unlocked && setAvatarId(a.id)}
                title={unlocked ? a.name : `Locked — ${a.description}`}
                style={{
                  aspectRatio: '1 / 1',
                  fontSize: 22,
                  background: active ? warmTheme.accentSoft : 'rgba(0,0,0,0.05)',
                  border: active
                    ? `2px solid ${warmTheme.accent}`
                    : `1px solid ${warmTheme.border}`,
                  borderRadius: 10,
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  opacity: unlocked ? 1 : 0.32,
                  color: unlocked ? warmTheme.accentDeep : warmTheme.textMuted,
                  filter: unlocked ? 'none' : 'grayscale(1)',
                  fontFamily: 'Georgia, serif',
                  transition: 'background 120ms ease, border-color 120ms ease',
                }}
              >{a.glyph}</button>
            );
          })}
        </div>

        {/* Title picker */}
        <SectionHeader>Title Badge</SectionHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
          <button
            onClick={() => setTitleId(null)}
            style={titleRowStyle(profile.titleId === null, true)}
          >
            <span style={{ fontStyle: 'italic', color: warmTheme.textMuted }}>(None)</span>
          </button>
          {([
            ['Milestones', 'milestone'],
            ['Eternity\u2019s Wake Bosses', 'boss'],
            ['Infinite Cards', 'infinite'],
            ['Set Completion', 'set'],
          ] as const).map(([label, group]) => {
            const entries = TITLE_BADGES.filter(t => t.group === group);
            if (entries.length === 0) return null;
            const unlockedCount = entries.filter(t => t.isUnlocked(progress)).length;
            return (
              <div key={group} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{
                  fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase',
                  color: warmTheme.textMuted, marginTop: 6, paddingLeft: 2,
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <span>{label}</span>
                  <span>{unlockedCount} / {entries.length}</span>
                </div>
                {entries.map(t => {
                  const unlocked = t.isUnlocked(progress);
                  const active = profile.titleId === t.id && unlocked;
                  return (
                    <button
                      key={t.id}
                      disabled={!unlocked}
                      onClick={() => unlocked && setTitleId(t.id)}
                      title={unlocked ? t.description : `Locked — ${t.description}`}
                      style={titleRowStyle(active, unlocked)}
                    >
                      <span style={{ fontWeight: 'bold' }}>{t.text}</span>
                      <span style={{ fontSize: 10, color: warmTheme.textMuted, marginLeft: 8 }}>
                        {unlocked ? '✓' : '🔒'}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Theme picker */}
        <SectionHeader>UI Theme</SectionHeader>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
          marginBottom: 12,
        }}>
          {UI_THEMES.map(t => {
            const unlocked = t.isUnlocked(progress);
            const active = profile.uiThemeId === t.id;
            return (
              <button
                key={t.id}
                disabled={!unlocked}
                onClick={() => unlocked && setUiThemeId(t.id)}
                title={unlocked ? t.description : (t.unlockHint ?? 'Locked')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                  padding: 10, gap: 6,
                  background: active ? warmTheme.accentSoft : 'rgba(0,0,0,0.04)',
                  border: active ? `2px solid ${warmTheme.accent}` : `1px solid ${warmTheme.border}`,
                  borderRadius: 10,
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  opacity: unlocked ? 1 : 0.42,
                  color: warmTheme.text,
                  fontFamily: 'Georgia, serif',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', gap: 4 }}>
                  <ThemeSwatch color={t.palette.accent} />
                  <ThemeSwatch color={t.palette.accentSoft} />
                  <ThemeSwatch color={t.palette.surfaceStrong} />
                  <ThemeSwatch color={t.palette.text} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 'bold' }}>{t.name}</div>
                <div style={{ fontSize: 9, color: warmTheme.textMuted, lineHeight: 1.3 }}>
                  {unlocked ? t.description : (t.unlockHint ?? 'Locked')}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom color editor (collapsible) */}
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setShowCustomEditor(v => !v)}
            style={{
              width: '100%', textAlign: 'left',
              padding: '8px 10px', borderRadius: 8,
              border: `1px solid ${warmTheme.border}`,
              background: 'rgba(0,0,0,0.04)',
              color: warmTheme.text,
              cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 12,
            }}
          >
            {showCustomEditor ? '▾ Custom Colors' : '▸ Custom Colors'}
            {profile.customUiTheme && Object.keys(profile.customUiTheme).length > 0 && (
              <span style={{ marginLeft: 8, fontSize: 10, color: warmTheme.accent }}>
                ({Object.keys(profile.customUiTheme).length} overridden)
              </span>
            )}
          </button>
          {showCustomEditor && (
            <div style={{
              marginTop: 8, padding: 10,
              border: `1px solid ${warmTheme.border}`,
              borderRadius: 8, background: 'rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {CUSTOM_THEME_EDITABLE_KEYS.map(key => {
                  const current = (profile.customUiTheme?.[key] as string | undefined) ?? normalizeToHex(warmTheme[key]);
                  return (
                    <label key={key} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontSize: 11, color: warmTheme.textMuted,
                    }}>
                      <input
                        type="color"
                        value={current.startsWith('#') ? current : '#000000'}
                        onChange={(e) => setCustomUiThemeColor(String(key), e.target.value)}
                        style={{ width: 28, height: 22, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                      <span>{key}</span>
                    </label>
                  );
                })}
              </div>
              <button
                onClick={() => resetCustomUiTheme()}
                style={{
                  marginTop: 10, padding: '4px 10px',
                  fontSize: 11, fontFamily: 'Georgia, serif',
                  background: 'transparent', color: warmTheme.danger,
                  border: `1px solid ${warmTheme.border}`,
                  borderRadius: 6, cursor: 'pointer',
                }}
              >
                Reset Custom Colors
              </button>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          fontSize: 10, color: warmTheme.textMuted, textAlign: 'center',
          paddingTop: 8, borderTop: `1px solid ${warmTheme.border}`,
        }}>
          Avatars and titles unlock automatically as you earn progression milestones.
        </div>

        {/* Ensure registries are referenced so unused-import warnings stay quiet
            even if a future refactor stops looking up by id directly. */}
        {(AVATAR_BY_ID[DEFAULT_AVATAR_ID] && TITLE_BADGE_BY_ID) ? null : null}
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
      color: warmTheme.textMuted, marginBottom: 8,
    }}>{children}</div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.04)', borderRadius: 8,
      border: `1px solid ${warmTheme.border}`,
      padding: '6px 8px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: warmTheme.textMuted }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 'bold', color: warmTheme.text, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function titleRowStyle(active: boolean, unlocked: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 12px',
    background: active ? warmTheme.accentSoft : 'rgba(0,0,0,0.04)',
    border: active ? `2px solid ${warmTheme.accent}` : `1px solid ${warmTheme.border}`,
    borderRadius: 8,
    cursor: unlocked ? 'pointer' : 'not-allowed',
    opacity: unlocked ? 1 : 0.5,
    color: active ? warmTheme.accentDeep : warmTheme.text,
    fontFamily: 'Georgia, serif',
    fontSize: 13,
    textAlign: 'left',
  };
}

function ThemeSwatch({ color }: { color: string }) {
  return (
    <span style={{
      display: 'inline-block', width: 14, height: 14, borderRadius: 4,
      background: color, border: '1px solid rgba(0,0,0,0.18)',
    }} />
  );
}

/** Best-effort hex extraction so the native color picker accepts the value. */
function normalizeToHex(value: string): string {
  if (!value) return '#000000';
  if (value.startsWith('#')) return value.length >= 7 ? value.slice(0, 7) : value;
  const m = value.match(/#([0-9a-f]{6})/i);
  if (m) return `#${m[1]}`;
  return '#000000';
}

// Suppress unused warnings — DEFAULT_UI_THEME_ID is the registry's canonical default.
void DEFAULT_UI_THEME_ID;
