// PlayerInformationPage — unified full-screen home for everything that
// describes "you, the player": identity (avatar / title / theme), social
// (account, friends, leaderboards), and save data (save / export / import /
// wipe). Replaces the separate Profile, Social, and Save-section-inside-
// Settings surfaces with one calm, soft-hued, well-organised page.

import { useMemo, useRef, useState } from 'react';
import { useStore, selectProfile, selectProgress } from '@/state/store';
import { subMenuWarm as warmTheme } from '@/ui/theme';
import { resolveAvatar } from '@/data/profile/avatars';
import { TITLE_BADGES, resolveTitleBadge } from '@/data/profile/titleBadges';
import { UI_THEMES } from '@/data/profile/uiThemes';
import TitlesModal from '@/ui/profile/TitlesModal';
import ProfilePictureModal from '@/ui/profile/ProfilePictureModal';
import {
  useSocialStore,
  selectSocialStatus,
  selectSocialUser,
} from '@/state/socialStore';
import {
  useFriendsStore,
  selectFriendsList,
  selectIncomingRequests,
  selectBlockedList,
} from '@/state/friendsStore';
import AuthPanel from '@/ui/social/AuthPanel';
import FriendsPanel from '@/ui/social/FriendsPanel';

interface Props {
  onClose: () => void;
  onSave: () => void;
  onWipe: () => void;
  onExport?: () => string | null;
  onImport?: (text: string) => boolean;
}

type TabId = 'profile' | 'social' | 'save';

const TABS: { id: TabId; label: string; glyph: string; caption: string }[] = [
  { id: 'profile', label: 'Profile',     glyph: '◆', caption: 'Identity, titles & themes' },
  { id: 'social',  label: 'Social',      glyph: '⊕', caption: 'Account, friends & boards' },
  { id: 'save',    label: 'Save & Data', glyph: '◈', caption: 'Save, export, import, wipe' },
];

// Dark cinematic gold palette — all UI colour constants in one place.
const G = {
  gold:             '#c8803a',
  goldSoft:         '#daa058',
  goldBorder:       'rgba(200,128,58,0.28)',
  goldBorderStrong: 'rgba(200,128,58,0.55)',
  goldGlass:        'rgba(200,128,58,0.08)',
  text:             '#f0dfc0',
  cinzel:           '"Cinzel", "Cormorant Garamond", Georgia, serif',
  success:          '#4f8a47',
  danger:           '#b85c4f',
  dangerSoft:       'rgba(184,92,79,0.18)',
  dangerBorder:     'rgba(184,92,79,0.45)',
} as const;

export default function PlayerInformationPage({
  onClose,
  onSave,
  onWipe,
  onExport,
  onImport,
}: Props) {
  const profile = useStore(selectProfile);
  const progress = useStore(selectProgress);
  const setPlayerName = useStore(s => s.setPlayerName);
  const setBio = useStore(s => s.setBio);
  const setUiThemeId = useStore(s => s.setUiThemeId);
  const dailyLogin = useStore(s => s.progress.dailyLogin);
  const saveTampered = useStore(s => s.saveTampered ?? false);

  const status = useSocialStore(selectSocialStatus);
  const socialUser = useSocialStore(selectSocialUser);
  const friends = useFriendsStore(selectFriendsList);
  const incoming = useFriendsStore(selectIncomingRequests);
  const blocked = useFriendsStore(selectBlockedList);
  const authed = status === 'authenticated';

  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [nameDraft, setNameDraft] = useState(profile.name);
  const [bioDraft, setBioDraft] = useState(profile.bio ?? '');
  const [showTitles, setShowTitles] = useState(false);
  const [showPictures, setShowPictures] = useState(false);
  const [gameSaved, setGameSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(0); // 0=none 1=first 2=second
  const [importStatus, setImportStatus] =
    useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentAvatar = resolveAvatar(profile.avatarId, progress);
  const currentTitle = resolveTitleBadge(profile.titleId, progress);

  const totalCollection = useMemo(
    () => Object.values(progress.collection).reduce((a, b) => a + b, 0),
    [progress.collection],
  );
  const distinctCards = Object.keys(progress.collection).length;
  const distinctBosses = Object.keys(progress.bossClearCounts).length;
  const totalBossClears = Object.values(progress.bossClearCounts).reduce((a, b) => a + b, 0);
  const unlockedTitles = useMemo(
    () => TITLE_BADGES.filter(tb => tb.isUnlocked(progress)),
    [progress],
  );

  const statusLabel = useMemo(() => {
    if (status === 'authenticated') return 'Signed in';
    if (status === 'loading') return 'Signing in…';
    if (status === 'error') return 'Sign-in error';
    return 'Offline · not signed in';
  }, [status]);

  function commitName() {
    if (nameDraft.trim()) setPlayerName(nameDraft);
    else setNameDraft(profile.name);
  }

  function commitBio() {
    setBio(bioDraft);
  }

  function handleSaveGame() {
    onSave();
    setGameSaved(true);
    setTimeout(() => setGameSaved(false), 2000);
  }

  function handleWipe() {
    onWipe();
    setConfirmDelete(0);
  }

  function handleExport() {
    if (!onExport) return;
    const payload = onExport();
    if (!payload) {
      setImportStatus({ kind: 'err', msg: 'Nothing to export yet.' });
      return;
    }
    const blob = new Blob([payload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `pantheon-${stamp}.pansave`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setImportStatus({ kind: 'ok', msg: 'Save exported.' });
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    ev.target.value = '';
    if (!file || !onImport) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const ok = onImport(text);
      setImportStatus(ok
        ? { kind: 'ok', msg: 'Save imported. Reloading state…' }
        : { kind: 'err', msg: 'Not a valid Pantheon save file.' });
    };
    reader.onerror = () => {
      setImportStatus({ kind: 'err', msg: 'Could not read file.' });
    };
    reader.readAsText(file);
  }

  return (
    <div style={S.backdrop}>
      {/* Atmospheric layered washes */}
      <div style={S.washWarm} />
      <div style={S.washCool} />
      <div style={S.washVignette} />
      <div style={S.scanlines} />

      <div className="ui-panel-intro" style={S.panel}>

        {/* ── Header ── */}
        <header style={S.header}>
          <div style={S.headerBrand}>
            <div style={S.headerTitle}>Player Information</div>
            <div style={S.headerRule}>
              <div style={S.headerRuleLine} />
              <span style={S.headerRuleGlyph}>✦</span>
              <div style={S.headerRuleLine} />
            </div>
            <div style={S.headerSub}>Identity · Social · Save Data</div>
          </div>
          <button onClick={onClose} style={S.closeBtn} aria-label="Close">✕</button>
        </header>

        {/* ── Identity Hero ── */}
        <section style={S.identityHero}>

          {/* Triple-ring avatar frame */}
          <div style={S.avatarOuter}>
            <div style={S.avatarMiddle}>
              <div style={S.avatarInner}>
                {currentAvatar.imageUrl
                  ? <img src={currentAvatar.imageUrl} alt={currentAvatar.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
                  : <span style={{ fontSize: 40, color: G.gold }}>{currentAvatar.glyph}</span>
                }
              </div>
            </div>
          </div>

          {/* Identity text column */}
          <div style={S.identityBody}>
            <input
              type="text"
              value={nameDraft}
              onChange={e => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              maxLength={24}
              style={S.nameInput}
            />
            <div style={S.titleRibbon}>
              {currentTitle ? currentTitle.text : 'No title selected'}
            </div>
            <textarea
              value={bioDraft}
              onChange={e => setBioDraft(e.target.value)}
              onBlur={commitBio}
              maxLength={200}
              rows={2}
              placeholder="Write a short bio…"
              style={S.bioInput as React.CSSProperties}
            />
            <div style={S.statusRow}>
              <span style={{
                ...S.statusDot,
                background: authed ? G.success : 'rgba(120,120,120,0.45)',
                boxShadow: authed ? `0 0 8px ${G.success}` : 'none',
              }} />
              <span style={S.statusLabel}>{statusLabel}</span>
              {authed && socialUser?.email && (
                <><span style={{ opacity: 0.4, margin: '0 2px' }}>·</span>
                  <span style={S.statusEmail}>{socialUser.email}</span></>
              )}
            </div>
          </div>

          {/* Emblem stat pillars */}
          <div style={S.heroStats}>
            <EmblemStat label="Oblivion" value={progress.oblivion.toLocaleString()} />
            <div style={S.emblemDivider} />
            <EmblemStat label="Shards" value={progress.aberratedShards.toLocaleString()} />
            <div style={S.emblemDivider} />
            <EmblemStat label="Streak" value={`${dailyLogin.streak}d`} />
            <div style={S.emblemDivider} />
            <EmblemStat label="Friends" value={friends.length.toLocaleString()} highlight={authed} />
          </div>
        </section>

        {/* ── Tab navigation ── */}
        <nav style={S.tabRow}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...S.tabBtn,
                  background: active ? G.goldGlass : 'transparent',
                  borderBottom: active ? `3px solid ${G.gold}` : '3px solid transparent',
                  boxShadow: active ? '0 4px 16px rgba(200,128,58,0.28)' : 'none',
                }}
              >
                <span style={{ ...S.tabGlyph, opacity: active ? 0.9 : 0.35 }}>{tab.glyph}</span>
                <div style={{ ...S.tabLabel, color: active ? G.goldSoft : 'rgba(240,223,192,0.65)' }}>{tab.label}</div>
                <div style={{ ...S.tabCaption, opacity: active ? 0.65 : 0.4 }}>{tab.caption}</div>
              </button>
            );
          })}
        </nav>

        {/* ── Tab content ── */}
        <main style={S.content}>
          <div style={S.contentInner}>
            {activeTab === 'profile' && (
              <ProfileTab
                progress={progress}
                profile={profile}
                currentAvatar={currentAvatar}
                currentTitle={currentTitle}
                totalCollection={totalCollection}
                distinctCards={distinctCards}
                totalBossClears={totalBossClears}
                distinctBosses={distinctBosses}
                unlockedTitlesCount={unlockedTitles.length}
                titlesTotal={TITLE_BADGES.length}
                dailyLogin={dailyLogin}
                onOpenTitles={() => setShowTitles(true)}
                onChangePicture={() => setShowPictures(true)}
                onChangeTheme={setUiThemeId}
              />
            )}
            {activeTab === 'social' && (
              <SocialTab authed={authed} friends={friends} incoming={incoming} blocked={blocked} />
            )}
            {activeTab === 'save' && (
              <SaveTab
                onSave={handleSaveGame}
                gameSaved={gameSaved}
                onExport={onExport ? handleExport : undefined}
                onImport={onImport ? handleImportClick : undefined}
                fileInputRef={fileInputRef}
                onImportFile={handleImportFile}
                importStatus={importStatus}
                saveTampered={saveTampered}
                confirmDelete={confirmDelete}
                setConfirmDelete={setConfirmDelete}
                onWipe={handleWipe}
              />
            )}
          </div>
        </main>
      </div>

      {showTitles && <TitlesModal onClose={() => setShowTitles(false)} />}
      {showPictures && <ProfilePictureModal currentAvatarId={profile.avatarId ?? ''} onClose={() => setShowPictures(false)} />}
    </div>
  );
}

// ──────────────────────────────────────────────────
// Tab: Profile
// ──────────────────────────────────────────────────

function ProfileTab(props: {
  progress: ReturnType<typeof selectProgress>;
  profile: ReturnType<typeof selectProfile>;
  currentAvatar: { glyph: string; imageUrl?: string; name: string; description: string };
  currentTitle: { text: string } | null;
  totalCollection: number;
  distinctCards: number;
  totalBossClears: number;
  distinctBosses: number;
  unlockedTitlesCount: number;
  titlesTotal: number;
  dailyLogin: { streak: number; totalClaims: number };
  onOpenTitles: () => void;
  onChangePicture: () => void;
  onChangeTheme: (id: string) => void;
}) {
  const {
    progress, profile, currentAvatar, currentTitle,
    totalCollection, distinctCards, totalBossClears, distinctBosses,
    unlockedTitlesCount, titlesTotal, dailyLogin,
    onOpenTitles, onChangePicture, onChangeTheme,
  } = props;

  return (
    <div style={S.tabGrid}>

      {/* Lifetime Stats */}
      <GlassCard title="Lifetime Stats">
        <div style={S.medallionGrid}>
          <StatMedallion label="Cards Played" value={progress.totalCardsPlayed.toLocaleString()} />
          <StatMedallion label="Cards Owned" value={`${totalCollection}`} sub={`${distinctCards} unique`} />
          <StatMedallion label="Bosses Felled" value={`${totalBossClears}`} sub={`${distinctBosses} unique`} />
          <StatMedallion label="Login Streak" value={`${dailyLogin.streak}d`} sub={`${dailyLogin.totalClaims} claims`} />
          <StatMedallion label="Titles Unlocked" value={`${unlockedTitlesCount} / ${titlesTotal}`} />
          <StatMedallion label="Oblivion" value={progress.oblivion.toLocaleString()} />
        </div>
      </GlassCard>

      {/* Profile Picture */}
      <GlassCard title="Profile Picture">
        <div style={S.avatarShowcase}>
          <div style={S.showcaseRingOuter}>
            <div style={S.showcaseRingInner}>
              {currentAvatar.imageUrl
                ? <img src={currentAvatar.imageUrl} alt={currentAvatar.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
                : <span style={{ fontSize: 28, color: G.gold }}>{currentAvatar.glyph}</span>
              }
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.showcaseName}>{currentAvatar.name}</div>
            <div style={S.showcaseDesc}>{currentAvatar.description}</div>
          </div>
        </div>
        <button onClick={onChangePicture} className="menu-tactile-btn" style={S.goldBtn}>
          Change Picture
        </button>
      </GlassCard>

      {/* Title Badge */}
      <GlassCard title="Title Badge">
        <div style={S.titleScroll}>
          <div style={S.titleScrollRule} />
          <div style={S.titleScrollText}>
            {currentTitle ? currentTitle.text : 'No title selected'}
          </div>
          <div style={S.titleScrollRule} />
        </div>
        <button onClick={onOpenTitles} className="menu-tactile-btn" style={S.goldBtn}>
          View Titles
        </button>
      </GlassCard>

      {/* UI Theme */}
      <GlassCard title="UI Theme" wide>
        <div style={S.themeGrid}>
          {UI_THEMES.map(t => {
            const unlocked = t.isUnlocked(progress);
            const active = profile.uiThemeId === t.id;
            return (
              <button
                key={t.id}
                disabled={!unlocked}
                onClick={() => unlocked && onChangeTheme(t.id)}
                title={unlocked ? t.description : (t.unlockHint ?? 'Locked')}
                style={{
                  ...S.themeCard,
                  background: active
                    ? 'linear-gradient(145deg, rgba(200,128,58,0.16) 0%, rgba(160,88,30,0.10) 100%)'
                    : 'linear-gradient(145deg, rgba(22,11,3,0.75) 0%, rgba(12,6,2,0.85) 100%)',
                  border: active
                    ? '2px solid rgba(200,128,58,0.65)'
                    : '1px solid rgba(200,128,58,0.2)',
                  boxShadow: active ? '0 0 18px rgba(200,128,58,0.16)' : 'none',
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  filter: unlocked ? 'none' : 'grayscale(0.55)',
                  opacity: unlocked ? 1 : 0.5,
                }}
              >
                <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
                  <ThemeSwatch color={t.palette.accent} />
                  <ThemeSwatch color={t.palette.accentSoft} />
                  <ThemeSwatch color={t.palette.surfaceStrong} />
                  <ThemeSwatch color={t.palette.text} />
                </div>
                <div style={S.themeName}>{t.name}</div>
                <div style={S.themeDesc}>
                  {unlocked ? t.description : (t.unlockHint ?? 'Locked')}
                </div>
              </button>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

// ──────────────────────────────────────────────────
// Tab: Social
// ──────────────────────────────────────────────────

function SocialTab(props: {
  authed: boolean;
  friends: unknown[];
  incoming: unknown[];
  blocked: unknown[];
}) {
  const { authed, friends, incoming, blocked } = props;
  return (
    <div style={S.tabGrid}>
      <GlassCard title="Account" tone="cool">
        <AuthPanel />
        {!authed && (
          <div style={S.hintBox}>
            Sign in (or create a free account) to add friends, send gifts,
            exchange messages, and appear on the social leaderboards. Your
            single-player progress always stays local on this device.
          </div>
        )}
      </GlassCard>

      <GlassCard
        title="Friends & Activity"
        tone="cool"
        wide
        meta={authed ? `${friends.length} friends · ${incoming.length} requests · ${blocked.length} blocked` : undefined}
      >
        {authed ? (
          <FriendsPanel />
        ) : (
          <div style={S.lockedPlaceholder}>
            <div style={S.lockedGlyph}>✦</div>
            <div style={S.lockedTitle}>Friends Locked</div>
            <div style={S.lockedBody}>
              Sign in on the Account card to unlock friends, requests, the
              gift inbox, the activity feed, and friend leaderboards.
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// ──────────────────────────────────────────────────
// Tab: Save & Data
// ──────────────────────────────────────────────────

function SaveTab(props: {
  onSave: () => void;
  gameSaved: boolean;
  onExport?: () => void;
  onImport?: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImportFile: (ev: React.ChangeEvent<HTMLInputElement>) => void;
  importStatus: { kind: 'ok' | 'err'; msg: string } | null;
  saveTampered: boolean;
  confirmDelete: number;
  setConfirmDelete: (n: number) => void;
  onWipe: () => void;
}) {
  const {
    onSave, gameSaved, onExport, onImport, fileInputRef, onImportFile,
    importStatus, saveTampered, confirmDelete, setConfirmDelete, onWipe,
  } = props;

  return (
    <div style={S.tabGrid}>
      <GlassCard title="Save">
        <button
          onClick={onSave}
          className="menu-tactile-btn"
          style={{
            ...S.goldBtn,
            width: '100%',
            background: gameSaved
              ? 'linear-gradient(135deg, rgba(79,138,71,0.75) 0%, rgba(55,110,50,0.85) 100%)'
              : 'linear-gradient(135deg, rgba(200,128,58,0.85) 0%, rgba(160,88,30,0.9) 100%)',
            border: gameSaved ? '1px solid rgba(79,138,71,0.6)' : `1px solid ${G.goldBorderStrong}`,
            color: gameSaved ? '#c8edc4' : '#1a0c04',
            boxShadow: gameSaved ? '0 4px 14px rgba(79,138,71,0.28)' : '0 4px 14px rgba(200,128,58,0.28)',
          }}
        >
          {gameSaved ? '✓  Saved!' : 'Save Game Data'}
        </button>
        <div style={S.saveHint}>
          Manually flushes your progress to disk. Your save is also written automatically in the background.
        </div>
      </GlassCard>

      {(onExport || onImport) && (
        <GlassCard title="Portable Save File" tone="cool">
          <div style={S.exportRow}>
            {onExport && (
              <button onClick={onExport} className="menu-tactile-btn" style={S.outlineBtn}
                title="Download a .pansave file you can carry to another install">
                Export Save
              </button>
            )}
            {onImport && (
              <button onClick={onImport} className="menu-tactile-btn" style={S.outlineBtn}
                title="Load a .pansave or legacy .hrsave file from another install">
                Import Save
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pansave,.hrsave,.json,.txt,text/plain"
              onChange={onImportFile}
              style={{ display: 'none' }}
            />
          </div>
          <div style={S.saveHint}>
            Move your save between machines with a portable{' '}
            <code style={{ fontFamily: 'monospace', opacity: 0.8 }}>.pansave</code> file.
            Legacy <code style={{ fontFamily: 'monospace', opacity: 0.8 }}>.hrsave</code> files are also accepted on import.
          </div>
          {importStatus && (
            <div style={{
              ...S.statusBanner,
              borderColor: importStatus.kind === 'ok' ? 'rgba(79,138,71,0.5)' : G.dangerBorder,
              background: importStatus.kind === 'ok' ? 'rgba(79,138,71,0.12)' : G.dangerSoft,
              color: importStatus.kind === 'ok' ? G.success : G.danger,
            }}>
              {importStatus.msg}
            </div>
          )}
        </GlassCard>
      )}

      {saveTampered && (
        <GlassCard title="Integrity Warning" tone="danger" wide>
          <div style={{ ...S.statusBanner, borderColor: G.dangerBorder, background: G.dangerSoft, color: G.danger }}>
            ⚠ This save's integrity check failed. The file may have been edited outside the game.
            Your progress was still loaded — saving again will re-sign the file with the current state.
          </div>
        </GlassCard>
      )}

      <GlassCard title="Danger Zone" tone="danger" wide>
        <div style={S.dangerCopy}>
          Permanently erase <strong style={{ color: G.danger }}>all progress</strong>: every card,
          boss kill, title, shard, and unlock. There is no undo.
        </div>

        {confirmDelete === 0 && (
          <button onClick={() => setConfirmDelete(1)} className="menu-tactile-btn" style={S.dangerBtn}>
            Delete Save Data
          </button>
        )}
        {confirmDelete === 1 && (
          <div style={S.dangerConfirm}>
            <div style={S.dangerConfirmText}>
              Are you sure? This will permanently erase <strong>all progress</strong>.
            </div>
            <div style={S.confirmRow}>
              <button onClick={() => setConfirmDelete(2)} className="menu-tactile-btn" style={S.dangerConfirmBtn}>Yes, delete it</button>
              <button onClick={() => setConfirmDelete(0)} className="menu-tactile-btn" style={S.cancelBtn}>Cancel</button>
            </div>
          </div>
        )}
        {confirmDelete === 2 && (
          <div style={{ ...S.dangerConfirm, borderColor: 'rgba(184,92,79,0.88)' }}>
            <div style={{ ...S.dangerConfirmText, fontWeight: 700 }}>Are you REALLY sure?</div>
            <div style={{ ...S.dangerCopy, color: G.danger, marginTop: 4 }}>
              There is no undo. Every card, boss kill, title, and shard will be gone forever.
            </div>
            <div style={S.confirmRow}>
              <button onClick={onWipe} className="menu-tactile-btn"
                style={{ ...S.dangerConfirmBtn, background: 'rgba(184,92,79,0.32)', fontWeight: 700 }}>
                Delete Everything
              </button>
              <button onClick={() => setConfirmDelete(0)} className="menu-tactile-btn" style={S.cancelBtn}>Cancel</button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// ──────────────────────────────────────────────────
// Reusable building blocks
// ──────────────────────────────────────────────────

function GlassCard(props: {
  title: string;
  tone?: 'warm' | 'cool' | 'danger';
  wide?: boolean;
  meta?: string;
  children: React.ReactNode;
}) {
  const tone = props.tone ?? 'warm';
  const toneBorderColor: Record<string, string> = {
    warm:   'rgba(200,128,58,0.32)',
    cool:   'rgba(110,140,210,0.32)',
    danger: 'rgba(184,92,79,0.38)',
  };
  const toneAccent: Record<string, string> = {
    warm:   G.gold,
    cool:   '#7a9ad0',
    danger: G.danger,
  };
  const toneInsetGlow: Record<string, string> = {
    warm:   'rgba(200,128,58,0.10)',
    cool:   'rgba(100,130,200,0.08)',
    danger: 'rgba(184,92,79,0.10)',
  };
  return (
    <div style={{
      ...S.card,
      borderColor: toneBorderColor[tone],
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 ${toneInsetGlow[tone]}`,
      gridColumn: props.wide ? '1 / -1' : 'auto',
    }}>
      <div style={S.cardHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ ...S.cardAccentBar, background: toneAccent[tone] }} />
          <div style={S.cardTitle}>{props.title}</div>
        </div>
        {props.meta && <div style={S.cardMeta}>{props.meta}</div>}
      </div>
      <div style={S.cardBody}>{props.children}</div>
    </div>
  );
}

function StatMedallion({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={S.medallion}>
      <div style={S.medallionLabel}>{label}</div>
      <div style={S.medallionValue}>{value}</div>
      {sub && <div style={S.medallionSub}>{sub}</div>}
    </div>
  );
}

function EmblemStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={S.emblemStat}>
      <div style={S.emblemLabel}>{label}</div>
      <div style={{
        ...S.emblemValue,
        color: highlight ? G.goldSoft : G.text,
        textShadow: highlight ? '0 0 16px rgba(218,160,88,0.45)' : 'none',
      }}>{value}</div>
    </div>
  );
}

function ThemeSwatch({ color }: { color: string }) {
  return (
    <span style={{
      display: 'inline-block',
      width: 16, height: 16, borderRadius: '50%',
      background: color,
      border: '1px solid rgba(0,0,0,0.28)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
    }} />
  );
}

// ──────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {

  /* ── Backdrop layers ── */
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(160deg, #0d0703 0%, #070402 55%, #050203 100%)',
    display: 'flex',
    zIndex: 30,
    overflow: 'hidden',
    fontFamily: 'Georgia, serif',
    animation: 'backdropFade 0.22s ease',
  },
  washWarm: {
    position: 'absolute',
    top: '-22%', left: '-10%', width: '75%', height: '85%',
    background: 'radial-gradient(ellipse, rgba(200,128,58,0.24) 0%, rgba(160,88,30,0.10) 42%, transparent 68%)',
    filter: 'blur(80px)',
    pointerEvents: 'none',
  },
  washCool: {
    position: 'absolute',
    bottom: '-22%', right: '-10%', width: '70%', height: '80%',
    background: 'radial-gradient(ellipse, rgba(70,90,170,0.13) 0%, transparent 65%)',
    filter: 'blur(90px)',
    pointerEvents: 'none',
  },
  washVignette: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at 50% 44%, transparent 26%, rgba(0,0,0,0.60) 100%)',
    pointerEvents: 'none',
  },
  scanlines: {
    position: 'absolute', inset: 0,
    background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)',
    pointerEvents: 'none',
  },

  /* ── Panel shell ── */
  panel: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'transparent',
  },

  /* ── Header ── */
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 'clamp(22px,2.4vw,34px) clamp(40px,4vw,80px) clamp(14px,1.6vw,22px)',
    flexShrink: 0,
    gap: 24,
  },
  headerBrand: { display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 },
  headerTitle: {
    fontSize: 'clamp(24px,2.6vw,36px)',
    fontWeight: 300,
    letterSpacing: 7,
    color: '#daa058',
    fontFamily: '"Cinzel", "Cormorant Garamond", Georgia, serif',
    textShadow: '0 2px 28px rgba(218,160,88,0.42), 0 0 60px rgba(200,128,58,0.15)',
    lineHeight: 1.1,
  },
  headerRule: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  headerRuleLine: {
    height: 1, width: 100, flexShrink: 0,
    background: 'linear-gradient(90deg, rgba(200,128,58,0.5) 0%, transparent 100%)',
  },
  headerRuleGlyph: {
    fontSize: 11,
    color: 'rgba(200,128,58,0.55)',
    lineHeight: 1,
    flexShrink: 0,
    userSelect: 'none',
  },
  headerSub: {
    fontSize: 9,
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: 'rgba(218,160,88,0.42)',
    fontWeight: 400,
  },
  closeBtn: {
    width: 42, height: 42,
    borderRadius: '50%',
    border: '1px solid rgba(200,128,58,0.38)',
    background: 'rgba(200,128,58,0.07)',
    color: 'rgba(218,160,88,0.72)',
    fontSize: 14,
    cursor: 'pointer',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit',
    lineHeight: 1,
    padding: 0,
    transition: 'all 0.18s ease',
  },

  /* ── Identity hero ── */
  identityHero: {
    display: 'flex',
    alignItems: 'center',
    gap: 28,
    padding: 'clamp(14px,1.6vw,22px) clamp(40px,4vw,80px) clamp(16px,1.8vw,24px)',
    borderBottom: '1px solid rgba(200,128,58,0.16)',
    background: 'rgba(8,4,1,0.5)',
    flexShrink: 0,
  },

  /* Triple-ring avatar */
  avatarOuter: {
    width: 118, height: 118,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    background: 'rgba(200,128,58,0.05)',
    boxShadow: '0 0 50px rgba(200,128,58,0.18), 0 0 100px rgba(200,128,58,0.06)',
  },
  avatarMiddle: {
    width: 104, height: 104,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid rgba(200,128,58,0.48)',
    boxShadow: '0 0 14px rgba(200,128,58,0.2)',
  },
  avatarInner: {
    width: 88, height: 88,
    borderRadius: '50%',
    border: '2.5px solid rgba(218,160,88,0.82)',
    background: 'linear-gradient(160deg, rgba(40,20,5,0.96) 0%, rgba(18,9,2,1) 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.65)',
  },

  /* Identity text */
  identityBody: {
    display: 'flex', flexDirection: 'column', gap: 7,
    minWidth: 0, flex: 1,
  },
  nameInput: {
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(200,128,58,0.22)',
    color: '#f0dfc0',
    fontSize: 28,
    fontWeight: 300,
    letterSpacing: 2,
    padding: '3px 0',
    outline: 'none',
    fontFamily: '"Cinzel", "Cormorant Garamond", Georgia, serif',
    maxWidth: 340,
    lineHeight: 1.2,
  },
  titleRibbon: {
    display: 'inline-flex',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: '4px 14px',
    borderRadius: 999,
    background: 'rgba(200,128,58,0.10)',
    border: '1px solid rgba(200,128,58,0.30)',
    fontSize: 12,
    fontStyle: 'italic',
    color: 'rgba(218,160,88,0.88)',
    letterSpacing: 0.5,
  },
  bioInput: {
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(200,128,58,0.14)',
    color: 'rgba(240,223,192,0.60)',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 1.6,
    padding: '3px 0',
    outline: 'none',
    fontFamily: 'Georgia, serif',
    resize: 'none',
    maxWidth: 340,
    width: '100%',
    marginTop: 2,
  },
  statusRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 10, color: 'rgba(218,160,88,0.48)', letterSpacing: 0.6, marginTop: 2,
  },
  statusDot: {
    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
  },
  statusLabel: {
    letterSpacing: 1.5, textTransform: 'uppercase', fontSize: 9, fontWeight: 400,
  },
  statusEmail: { fontFamily: 'monospace', fontSize: 10, opacity: 0.62 },

  /* Emblem stat pillars */
  heroStats: {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 28,
    borderLeft: '1px solid rgba(200,128,58,0.2)',
    flexShrink: 0,
  },
  emblemStat: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '6px 20px', gap: 5,
  },
  emblemLabel: {
    fontSize: 8,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: 'rgba(218,160,88,0.48)',
    fontWeight: 400,
    whiteSpace: 'nowrap',
  },
  emblemValue: {
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: 0.5,
    color: '#f0dfc0',
    fontVariantNumeric: 'tabular-nums',
  },
  emblemDivider: {
    width: 1, height: 30,
    background: 'rgba(200,128,58,0.18)',
    flexShrink: 0,
  },

  /* ── Tab navigation ── */
  tabRow: {
    display: 'flex',
    gap: 2,
    padding: '0 clamp(40px,4vw,80px)',
    background: 'rgba(5,2,0,0.6)',
    borderBottom: '1px solid rgba(200,128,58,0.2)',
    flexShrink: 0,
  },
  tabBtn: {
    flex: '0 1 220px',
    padding: '13px 22px 15px',
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    borderRadius: '10px 10px 0 0',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'all 0.18s ease',
  },
  tabGlyph: {
    fontSize: 8,
    color: '#daa058',
    display: 'block',
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    fontFamily: '"Cinzel", "Cormorant Garamond", Georgia, serif',
  },
  tabCaption: {
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 3,
    color: 'rgba(218,160,88,0.55)',
  },

  /* ── Content area ── */
  content: {
    flex: 1,
    overflowY: 'auto',
    minHeight: 0,
    padding: 'clamp(24px,2.4vw,40px) clamp(40px,4vw,80px)',
  },
  contentInner: { maxWidth: 1180, margin: '0 auto' },

  /* ── Card grid ── */
  tabGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 18,
    alignItems: 'start',
  },

  /* ── Glass card base ── */
  card: {
    borderRadius: 16,
    border: '1px solid rgba(200,128,58,0.28)',
    background: 'linear-gradient(148deg, rgba(20,10,3,0.92) 0%, rgba(11,5,1,0.96) 100%)',
    backdropFilter: 'blur(8px)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    padding: '15px 22px 13px',
    borderBottom: '1px solid rgba(200,128,58,0.12)',
  },
  cardAccentBar: {
    width: 3, height: 18, borderRadius: 2, flexShrink: 0,
  },
  cardTitle: {
    fontSize: 10,
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: 'rgba(218,160,88,0.82)',
    fontWeight: 600,
    fontFamily: '"Cinzel", Georgia, serif',
  },
  cardMeta: {
    fontSize: 9,
    letterSpacing: 1,
    color: 'rgba(218,160,88,0.42)',
    fontVariantNumeric: 'tabular-nums',
  },
  cardBody: {
    padding: '18px 22px 20px',
    display: 'flex', flexDirection: 'column', gap: 14,
  },

  /* ── Stat medallions ── */
  medallionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(128px, 1fr))',
    gap: 10,
  },
  medallion: {
    padding: '15px 10px 13px',
    borderRadius: 12,
    background: 'rgba(200,128,58,0.05)',
    border: '1px solid rgba(200,128,58,0.15)',
    textAlign: 'center',
    display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center',
  },
  medallionLabel: {
    fontSize: 8, letterSpacing: 2, textTransform: 'uppercase',
    color: 'rgba(218,160,88,0.48)',
    fontFamily: '"Cinzel", Georgia, serif',
  },
  medallionValue: {
    fontSize: 26, fontWeight: 300, color: '#daa058',
    fontVariantNumeric: 'tabular-nums', letterSpacing: 0.3, lineHeight: 1.15,
  },
  medallionSub: {
    fontSize: 9, color: 'rgba(218,160,88,0.38)', letterSpacing: 0.4,
  },

  /* ── Avatar showcase (Profile Picture card) ── */
  avatarShowcase: {
    display: 'flex', alignItems: 'center', gap: 16,
  },
  showcaseRingOuter: {
    width: 74, height: 74,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(200,128,58,0.05)',
    border: '1.5px solid rgba(200,128,58,0.38)',
    boxShadow: '0 0 20px rgba(200,128,58,0.14)',
    flexShrink: 0,
  },
  showcaseRingInner: {
    width: 60, height: 60,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid rgba(218,160,88,0.80)',
    background: 'linear-gradient(160deg, rgba(40,20,5,0.95) 0%, rgba(18,9,2,1) 100%)',
    overflow: 'hidden',
  },
  showcaseName: {
    fontSize: 13, fontWeight: 600, color: '#f0dfc0', letterSpacing: 0.5,
  },
  showcaseDesc: {
    fontSize: 11, color: 'rgba(218,160,88,0.58)', marginTop: 4, lineHeight: 1.45,
  },

  /* ── Title scroll ── */
  titleScroll: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    padding: '4px 0',
  },
  titleScrollRule: {
    width: '100%', height: 1,
    background: 'linear-gradient(90deg, transparent 0%, rgba(200,128,58,0.42) 25%, rgba(200,128,58,0.42) 75%, transparent 100%)',
  },
  titleScrollText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: 'rgba(218,160,88,0.88)',
    fontFamily: '"Cinzel", "Cormorant Garamond", Georgia, serif',
    textAlign: 'center',
    padding: '8px 20px',
    letterSpacing: 0.8,
    lineHeight: 1.45,
  },

  /* ── Theme grid ── */
  themeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: 10,
  },
  themeCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    padding: '14px 14px 12px',
    borderRadius: 12,
    textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'all 0.18s ease',
  },
  themeName: {
    fontSize: 12, fontWeight: 600, color: '#daa058',
    letterSpacing: 1.5,
    fontFamily: '"Cinzel", Georgia, serif',
  },
  themeDesc: {
    fontSize: 9, color: 'rgba(218,160,88,0.52)', lineHeight: 1.4, marginTop: 4,
  },

  /* ── Buttons ── */
  goldBtn: {
    padding: '11px 22px',
    borderRadius: 999,
    border: '1px solid rgba(200,128,58,0.55)',
    background: 'linear-gradient(135deg, rgba(200,128,58,0.85) 0%, rgba(160,88,30,0.9) 100%)',
    color: '#1a0c04',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: '"Cinzel", Georgia, serif',
    boxShadow: '0 4px 14px rgba(200,128,58,0.26)',
    whiteSpace: 'nowrap',
  },
  outlineBtn: {
    padding: '10px 0', borderRadius: 10,
    border: '1px solid rgba(200,128,58,0.4)',
    background: 'rgba(200,128,58,0.06)',
    color: '#daa058',
    fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: '"Cinzel", Georgia, serif',
    whiteSpace: 'nowrap',
  },

  /* ── Social locked & hint ── */
  hintBox: {
    marginTop: 4,
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px dashed rgba(100,140,220,0.28)',
    background: 'rgba(70,90,170,0.08)',
    color: 'rgba(180,200,240,0.72)',
    fontSize: 11.5, lineHeight: 1.6,
  },
  lockedPlaceholder: {
    padding: '38px 20px',
    textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
  },
  lockedGlyph: {
    fontSize: 30, color: 'rgba(200,128,58,0.2)',
  },
  lockedTitle: {
    fontSize: 13, fontWeight: 600, letterSpacing: 2.5, textTransform: 'uppercase',
    color: 'rgba(218,160,88,0.55)',
    fontFamily: '"Cinzel", Georgia, serif',
  },
  lockedBody: {
    fontSize: 12, color: 'rgba(218,160,88,0.38)', lineHeight: 1.6, maxWidth: 420,
  },

  /* ── Save & Data ── */
  saveHint: {
    fontSize: 11, color: 'rgba(218,160,88,0.42)', lineHeight: 1.55,
  },
  exportRow: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
  },
  statusBanner: {
    padding: '9px 13px', borderRadius: 8,
    fontSize: 11, lineHeight: 1.5, border: '1px solid transparent',
  },

  /* ── Danger zone ── */
  dangerCopy: {
    fontSize: 12, color: 'rgba(240,223,192,0.68)', lineHeight: 1.6,
  },
  dangerBtn: {
    width: '100%', padding: '12px 0', borderRadius: 10,
    border: '1px solid rgba(184,92,79,0.45)',
    background: 'rgba(184,92,79,0.12)',
    color: G.danger,
    fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: '"Cinzel", Georgia, serif',
  },
  dangerConfirm: {
    padding: '14px 16px', borderRadius: 12,
    border: '1px solid rgba(184,92,79,0.45)',
    background: 'rgba(15,5,4,0.7)',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  dangerConfirmText: {
    fontSize: 12, color: G.danger, lineHeight: 1.5,
  },
  confirmRow: { display: 'flex', gap: 10 },
  dangerConfirmBtn: {
    flex: 1, padding: '10px 0', borderRadius: 8,
    border: '1px solid rgba(184,92,79,0.5)',
    background: 'rgba(184,92,79,0.16)',
    color: G.danger,
    fontSize: 12, letterSpacing: 1, cursor: 'pointer', fontFamily: 'Georgia, serif',
  },
  cancelBtn: {
    flex: 1, padding: '10px 0', borderRadius: 8,
    border: '1px solid rgba(200,128,58,0.25)',
    background: 'rgba(200,128,58,0.06)',
    color: 'rgba(218,160,88,0.62)',
    fontSize: 12, letterSpacing: 1, cursor: 'pointer', fontFamily: 'Georgia, serif',
  },
};

// Keep import alive \u2014 warmTheme used by AuthPanel / FriendsPanel sub-trees.
void warmTheme;
