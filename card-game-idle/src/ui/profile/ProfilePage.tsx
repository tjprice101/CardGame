import { useEffect, useMemo, useState } from 'react';
import { useStore, selectProfile, selectProgress } from '@/state/store';
import { warmTheme, uiTypography } from '@/ui/theme';
import { resolveAvatar } from '@/data/profile/avatars';
import { TITLE_BADGES, resolveTitleBadge } from '@/data/profile/titleBadges';
import { UI_THEMES, DEFAULT_UI_THEME_ID, isThemeUnlocked } from '@/data/profile/uiThemes';
import TitlesModal from '@/ui/profile/TitlesModal';
import ProfilePictureModal from '@/ui/profile/ProfilePictureModal';
import SignatureCardPickerModal from '@/ui/profile/SignatureCardPickerModal';
import { CardRegistry } from '@/cards/CardRegistry';

interface Props {
  onClose: () => void;
}

export default function ProfilePage({ onClose }: Props) {
  const profile = useStore(selectProfile);
  const progress = useStore(selectProgress);
  const setPlayerName = useStore(s => s.setPlayerName);
  const setUiThemeId = useStore(s => s.setUiThemeId);
  const dailyLogin = useStore(s => s.progress.dailyLogin);

  const [nameDraft, setNameDraft] = useState(profile.name);
  const [showTitles, setShowTitles] = useState(false);
  const [showPictures, setShowPictures] = useState(false);
  const [sigPickerSlot, setSigPickerSlot] = useState<number | null>(null);
  const setSignatureCard = useStore(s => s.setSignatureCard);

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

  useEffect(() => {
    setNameDraft(profile.name);
  }, [profile.name]);

  return (
    <>
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(circle at 50% 14%, rgba(201, 170, 112, 0.2) 0%, rgba(201, 170, 112, 0) 36%), radial-gradient(circle at 10% 86%, rgba(104, 134, 174, 0.2) 0%, rgba(104, 134, 174, 0) 40%), repeating-linear-gradient(35deg, rgba(222, 196, 148, 0.06) 0px, rgba(222, 196, 148, 0.06) 1px, rgba(0, 0, 0, 0) 1px, rgba(0, 0, 0, 0) 20px), linear-gradient(180deg, rgba(16, 18, 23, 0.965) 0%, rgba(19, 24, 31, 0.965) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, pointerEvents: 'auto', fontFamily: uiTypography.body,
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
            overflow: 'hidden',
          }}>
            {currentAvatar.imageUrl
              ? <img src={currentAvatar.imageUrl} alt={currentAvatar.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
              : currentAvatar.glyph
            }
          </div>
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
                outline: 'none', fontFamily: uiTypography.body, padding: '2px 0',
              }}
            />
            <div style={{ fontSize: 12, color: warmTheme.text, marginTop: 4, fontStyle: 'italic' }}>
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
          <StatCell label="Titles" value={`${unlockedTitles.length} / ${TITLE_BADGES.length}`} />
        </div>

        {/* Profile Picture */}
        <SectionHeader>Profile Picture</SectionHeader>
        <div style={{
          marginBottom: 16,
          padding: '14px 16px',
          borderRadius: 10,
          border: `1px solid ${warmTheme.border}`,
          background: 'rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: warmTheme.surface,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, color: warmTheme.accentDeep,
            border: `2px solid ${warmTheme.borderStrong}`,
            boxShadow: warmTheme.glow,
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            {currentAvatar.imageUrl
              ? <img src={currentAvatar.imageUrl} alt={currentAvatar.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
              : currentAvatar.glyph
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: warmTheme.text }}>{currentAvatar.name}</div>
            <div style={{ fontSize: 10, color: warmTheme.textFaint, marginTop: 3, lineHeight: 1.4 }}>
              {currentAvatar.description}
            </div>
          </div>
          <button
            className="menu-tactile-btn"
            onClick={() => setShowPictures(true)}
            style={{
              flexShrink: 0,
              padding: '8px 14px',
              borderRadius: 10,
              border: `1px solid ${warmTheme.borderStrong}`,
              background: warmTheme.button,
              color: warmTheme.accentDeep,
              fontSize: 11,
              fontFamily: uiTypography.body,
              cursor: 'pointer',
              letterSpacing: 0.5,
              whiteSpace: 'nowrap',
            }}
          >
            Change
          </button>
        </div>

        {/* Title — current + browser button */}
        <SectionHeader>Title Badge</SectionHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 10,
            border: `1px solid ${warmTheme.border}`,
            background: 'rgba(0,0,0,0.04)',
            fontSize: 13,
            fontStyle: currentTitle ? 'normal' : 'italic',
            color: warmTheme.text,
          }}>
            {currentTitle ? currentTitle.text : 'No title selected'}
          </div>
          <button
            className="menu-tactile-btn"
            onClick={() => setShowTitles(true)}
            style={{
              flexShrink: 0,
              padding: '10px 16px',
              borderRadius: 10,
              border: `1px solid ${warmTheme.borderStrong}`,
              background: warmTheme.button,
              color: warmTheme.accentDeep,
              fontSize: 12,
              fontFamily: uiTypography.body,
              cursor: 'pointer',
              letterSpacing: 0.5,
              whiteSpace: 'nowrap',
            }}
          >
            View Titles
          </button>
        </div>

        {showTitles && <TitlesModal onClose={() => setShowTitles(false)} />}
        {showPictures && <ProfilePictureModal currentAvatarId={profile.avatarId ?? ''} onClose={() => setShowPictures(false)} />}

        {/* Theme picker */}
        <SectionHeader>UI Theme</SectionHeader>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
          marginBottom: 12,
        }}>
          {UI_THEMES.map(t => {
            const unlocked = isThemeUnlocked(t.id, progress);
            const active = profile.uiThemeId === t.id;
            return (
              <button
                key={t.id}
                disabled={!unlocked}
                onClick={() => unlocked && setUiThemeId(t.id)}
                title={t.description}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                  padding: 10, gap: 6,
                  background: active ? warmTheme.accentSoft : 'rgba(0,0,0,0.04)',
                  border: active ? `2px solid ${warmTheme.accent}` : `1px solid ${warmTheme.border}`,
                  borderRadius: 10,
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  opacity: unlocked ? 1 : 0.42,
                  color: warmTheme.text,
                  fontFamily: uiTypography.body,
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
                  {t.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Signature Cards ── */}
        <SectionHeader>Signature Cards</SectionHeader>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            {Array.from({ length: 5 }, (_, i) => {
              const cardId = (profile.signatureCardIds ?? [])[i] ?? null;
              return (
                <SignatureSlot
                  key={i}
                  cardId={cardId}
                  onClick={() => setSigPickerSlot(i)}
                  onClear={() => setSignatureCard(i, null)}
                />
              );
            })}
          </div>
          <div style={{ fontSize: 9, color: warmTheme.textMuted }}>
            Showcase up to 5 cards on your profile — visible to friends.
          </div>
        </div>

        {/* Footer hint */}
        <div style={{
          fontSize: 10, color: warmTheme.textMuted, textAlign: 'center',
          paddingTop: 8, borderTop: `1px solid ${warmTheme.border}`,
        }}>
          Avatars and titles unlock automatically as you earn progression milestones.
        </div>
      </div>
    </div>

    {sigPickerSlot !== null && (
      <SignatureCardPickerModal
        slotIndex={sigPickerSlot}
        onClose={() => setSigPickerSlot(null)}
        onPick={(cardId) => { setSignatureCard(sigPickerSlot, cardId); setSigPickerSlot(null); }}
      />
    )}
  </>
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

function ThemeSwatch({ color }: { color: string }) {
  return (
    <span style={{
      display: 'inline-block', width: 14, height: 14, borderRadius: 4,
      background: color, border: '1px solid rgba(0,0,0,0.18)',
    }} />
  );
}

function SignatureSlot({ cardId, onClick, onClear }: { cardId: string | null; onClick: () => void; onClear: () => void }) {
  const def = cardId ? CardRegistry.get(cardId) : null;
  const rarityColor: Record<string, string> = {
    Common: '#aabccc', Rare: '#6699dd', Epic: '#aa66dd',
    Legendary: '#ddaa33', Eternal: '#ff8844', Infinite: '#44ddcc',
  };
  const color = def ? (rarityColor[def.rarity] ?? warmTheme.textMuted) : warmTheme.border;
  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
      <button
        onClick={onClick}
        title={def ? def.name : 'Click to set Signature Card'}
        style={{
          width: 72, height: 90,
          border: `2px solid ${color}`,
          borderRadius: 8,
          background: def ? `rgba(${hexToRgb(color)},0.08)` : 'rgba(0,0,0,0.18)',
          color,
          cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 4, padding: 4, textAlign: 'center',
          fontSize: 10, fontFamily: 'Georgia, serif',
          transition: 'border-color 0.15s',
        }}
      >
        {def ? (
          <>
            <div style={{ fontSize: 9, opacity: 0.7, letterSpacing: 0.5 }}>{def.rarity}</div>
            <div style={{ fontSize: 9, fontWeight: 'bold', lineHeight: 1.2 }}>{def.name}</div>
          </>
        ) : (
          <span style={{ fontSize: 22, opacity: 0.4 }}>+</span>
        )}
      </button>
      {def && (
        <button
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          title="Remove"
          style={{
            position: 'absolute', top: -6, right: -6,
            width: 16, height: 16, borderRadius: '50%',
            background: '#662233', border: '1px solid #aa3355',
            color: '#ffaabb', fontSize: 9, cursor: 'pointer', lineHeight: '14px',
            padding: 0,
          }}
        >✕</button>
      )}
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// Suppress unused warnings — DEFAULT_UI_THEME_ID is the registry's canonical default.
void DEFAULT_UI_THEME_ID;
