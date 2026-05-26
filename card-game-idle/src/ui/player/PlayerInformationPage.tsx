// PlayerInformationPage — unified full-screen home for everything that
// describes "you, the player": identity (avatar / title / theme), social
// (account, friends, leaderboards), and save data (save / export / import /
// wipe). Replaces the separate Profile, Social, and Save-section-inside-
// Settings surfaces with one calm, soft-hued, well-organised page.

import { useMemo, useRef, useState } from 'react';
import { useStore, selectProfile, selectProgress } from '@/state/store';
import { warmTheme } from '@/ui/theme';
import { resolveAvatar } from '@/data/profile/avatars';
import { TITLE_BADGES, resolveTitleBadge } from '@/data/profile/titleBadges';
import { UI_THEMES } from '@/data/profile/uiThemes';
import TitlesModal from '@/ui/profile/TitlesModal';
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

const TABS: { id: TabId; label: string; caption: string }[] = [
  { id: 'profile', label: 'Profile',     caption: 'Identity, titles & themes' },
  { id: 'social',  label: 'Social',      caption: 'Account, friends & boards' },
  { id: 'save',    label: 'Save & Data', caption: 'Save, export, import, wipe' },
];

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
  const [showTitles, setShowTitles] = useState(false);
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
    if (status === 'authenticating') return 'Signing in…';
    if (status === 'error') return 'Sign-in error';
    return 'Offline · not signed in';
  }, [status]);

  function commitName() {
    if (nameDraft.trim()) setPlayerName(nameDraft);
    else setNameDraft(profile.name);
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
    <div style={styles.backdrop}>
      {/* Soft drifting hue washes — replace harsh appBackground with a calm
          champagne-on-indigo wash, plus subtle radial halos. */}
      <div style={styles.washWarm} />
      <div style={styles.washCool} />
      <div style={styles.washVignette} />

      <div className="ui-panel-intro" style={styles.panel}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerBrand}>
            <div className="ui-title-glow" style={styles.headerTitle}>Player Information</div>
            <div style={styles.headerSub}>Identity · Social · Save Data</div>
          </div>
          <button
            onClick={onClose}
            style={styles.closeBtn}
            title="Close"
            aria-label="Close"
          >{'\u2715'}</button>
        </header>

        {/* Identity hero — always visible above the tabs */}
        <section style={styles.identityHero}>
          <div style={styles.avatarWrap}>
            <div style={styles.avatarHalo} />
            <div style={styles.avatar}>{currentAvatar.glyph}</div>
          </div>
          <div style={styles.identityBody}>
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              maxLength={24}
              style={styles.nameInput}
            />
            <div style={styles.titleText}>
              {currentTitle ? currentTitle.text : 'No title selected'}
            </div>
            <div style={styles.statusRow}>
              <span style={{
                ...styles.statusDot,
                background: authed ? warmTheme.success : 'rgba(120,120,120,0.4)',
                boxShadow: authed ? `0 0 8px ${warmTheme.success}` : 'none',
              }} />
              <span style={styles.statusLabel}>{statusLabel}</span>
              {authed && socialUser?.email && (
                <>
                  <span style={styles.statusDivider}>·</span>
                  <span style={styles.statusEmail}>{socialUser.email}</span>
                </>
              )}
            </div>
          </div>

          {/* Quick stats strip on the right */}
          <div style={styles.heroStats}>
            <HeroStat label="Oblivion" value={progress.oblivion.toLocaleString()} />
            <HeroStat label="Shards" value={progress.aberratedShards.toLocaleString()} />
            <HeroStat label="Streak" value={`${dailyLogin.streak}d`} />
            <HeroStat label="Friends" value={friends.length.toLocaleString()} highlight={authed} />
          </div>
        </section>

        {/* Tab nav */}
        <nav style={styles.tabRow}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.tabBtn,
                  color: active ? warmTheme.accentDeep : warmTheme.textMuted,
                  background: active ? 'rgba(255,243,222,0.55)' : 'transparent',
                  borderBottom: active
                    ? `2px solid ${warmTheme.accent}`
                    : '2px solid transparent',
                }}
              >
                <div style={styles.tabLabel}>{tab.label}</div>
                <div style={styles.tabCaption}>{tab.caption}</div>
              </button>
            );
          })}
        </nav>

        {/* Tab content */}
        <main style={styles.content}>
          <div style={styles.contentInner}>
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
                onChangeTheme={setUiThemeId}
              />
            )}

            {activeTab === 'social' && (
              <SocialTab
                authed={authed}
                friends={friends}
                incoming={incoming}
                blocked={blocked}
              />
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

        {showTitles && <TitlesModal onClose={() => setShowTitles(false)} />}
      </div>
    </div>
  );
}

// ────────────────────── Tab: Profile ──────────────────────

function ProfileTab(props: {
  progress: ReturnType<typeof selectProgress>;
  profile: ReturnType<typeof selectProfile>;
  currentAvatar: { glyph: string };
  currentTitle: { text: string } | null;
  totalCollection: number;
  distinctCards: number;
  totalBossClears: number;
  distinctBosses: number;
  unlockedTitlesCount: number;
  titlesTotal: number;
  dailyLogin: { streak: number; totalClaims: number };
  onOpenTitles: () => void;
  onChangeTheme: (id: string) => void;
}) {
  const {
    progress, profile, currentAvatar, currentTitle,
    totalCollection, distinctCards, totalBossClears, distinctBosses,
    unlockedTitlesCount, titlesTotal, dailyLogin,
    onOpenTitles, onChangeTheme,
  } = props;

  return (
    <div style={styles.tabGrid}>
      <Card title="Lifetime Stats" tone="warm">
        <div style={styles.statGrid}>
          <StatCell label="Cards Played" value={progress.totalCardsPlayed.toLocaleString()} />
          <StatCell label="Cards Owned" value={`${totalCollection}`} sub={`${distinctCards} unique`} />
          <StatCell label="Bosses Felled" value={`${totalBossClears}`} sub={`${distinctBosses} unique`} />
          <StatCell label="Login Streak" value={`${dailyLogin.streak}d`} sub={`${dailyLogin.totalClaims} claims`} />
          <StatCell label="Titles Unlocked" value={`${unlockedTitlesCount} / ${titlesTotal}`} />
          <StatCell label="Oblivion" value={progress.oblivion.toLocaleString()} />
        </div>
      </Card>

      <Card title="Avatar" tone="warm">
        <div style={styles.avatarRow}>
          <div style={styles.avatarSmall}>{currentAvatar.glyph}</div>
          <div style={{ flex: 1 }}>
            <div style={styles.avatarRowLabel}>Avatar Customization</div>
            <div style={styles.avatarRowHint}>
              Custom profile pictures are coming soon. Avatars unlock automatically
              as you reach progression milestones.
            </div>
          </div>
        </div>
      </Card>

      <Card title="Title Badge" tone="warm">
        <div style={styles.titleBadgeRow}>
          <div style={styles.titleBadgeText}>
            {currentTitle ? currentTitle.text : 'No title selected'}
          </div>
          <button onClick={onOpenTitles} style={styles.pillBtn}>View Titles</button>
        </div>
      </Card>

      <Card title="UI Theme" tone="warm" wide>
        <div style={styles.themeGrid}>
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
                  ...styles.themeCard,
                  background: active ? 'rgba(255,237,206,0.7)' : 'rgba(255,250,240,0.35)',
                  border: active
                    ? `2px solid ${warmTheme.accent}`
                    : `1px solid ${warmTheme.border}`,
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  opacity: unlocked ? 1 : 0.42,
                }}
              >
                <div style={{ display: 'flex', gap: 4 }}>
                  <ThemeSwatch color={t.palette.accent} />
                  <ThemeSwatch color={t.palette.accentSoft} />
                  <ThemeSwatch color={t.palette.surfaceStrong} />
                  <ThemeSwatch color={t.palette.text} />
                </div>
                <div style={styles.themeName}>{t.name}</div>
                <div style={styles.themeDesc}>
                  {unlocked ? t.description : (t.unlockHint ?? 'Locked')}
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ────────────────────── Tab: Social ──────────────────────

function SocialTab(props: {
  authed: boolean;
  friends: unknown[];
  incoming: unknown[];
  blocked: unknown[];
}) {
  const { authed, friends, incoming, blocked } = props;
  return (
    <div style={styles.tabGrid}>
      <Card title="Account" tone="cool">
        <AuthPanel />
        {!authed && (
          <div style={styles.signedOutHint}>
            Sign in (or create a free account) to add friends, send gifts,
            exchange messages, and appear on the social leaderboards. Your
            single-player progress always stays local on this device.
          </div>
        )}
      </Card>

      <Card
        title="Friends &amp; Activity"
        tone="cool"
        wide
        meta={authed ? `${friends.length} friends · ${incoming.length} requests · ${blocked.length} blocked` : 'Locked'}
      >
        {authed ? (
          <FriendsPanel />
        ) : (
          <div style={styles.lockedCard}>
            <div style={{ fontSize: 30, opacity: 0.28, marginBottom: 10 }}>{'\u2726'}</div>
            <div style={styles.lockedTitle}>Friends locked</div>
            <div style={styles.lockedBody}>
              Sign in on the Account card to unlock friends, requests, the
              gift inbox, the activity feed, and friend leaderboards.
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ────────────────────── Tab: Save & Data ──────────────────────

function SaveTab(props: {
  onSave: () => void;
  gameSaved: boolean;
  onExport?: () => void;
  onImport?: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
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
    <div style={styles.tabGrid}>
      <Card title="Save" tone="warm">
        <button
          onClick={onSave}
          style={{
            ...styles.savePrimaryBtn,
            border: `1px solid ${gameSaved ? 'rgba(79,138,71,0.5)' : warmTheme.borderStrong}`,
            background: gameSaved ? 'rgba(79,138,71,0.15)' : warmTheme.button,
            color: gameSaved ? warmTheme.success : warmTheme.accentDeep,
          }}
        >
          {gameSaved ? 'Saved!' : 'Save Game Data'}
        </button>
        <div style={styles.saveHint}>
          Manually flushes your progress to disk. Your save is also written
          automatically in the background.
        </div>
      </Card>

      {(onExport || onImport) && (
        <Card title="Portable Save File" tone="cool">
          <div style={styles.exportRow}>
            {onExport && (
              <button
                onClick={onExport}
                style={styles.outlineBtn}
                title="Download a .pansave file you can carry to another install"
              >
                Export Save
              </button>
            )}
            {onImport && (
              <button
                onClick={onImport}
                style={styles.outlineBtn}
                title="Load a .pansave or legacy .hrsave file from another install"
              >
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
          <div style={styles.saveHint}>
            Move your save between machines with a portable <code>.pansave</code> file.
            Legacy <code>.hrsave</code> files are also accepted on import.
          </div>
          {importStatus && (
            <div style={{
              ...styles.statusBanner,
              borderColor: importStatus.kind === 'ok' ? 'rgba(79,138,71,0.45)' : 'rgba(184,92,79,0.45)',
              background: importStatus.kind === 'ok' ? 'rgba(79,138,71,0.12)' : 'rgba(184,92,79,0.12)',
              color: importStatus.kind === 'ok' ? warmTheme.success : warmTheme.danger,
            }}>
              {importStatus.msg}
            </div>
          )}
        </Card>
      )}

      {saveTampered && (
        <Card title="Integrity Warning" tone="danger" wide>
          <div style={{ ...styles.statusBanner, borderColor: 'rgba(184,92,79,0.5)', background: 'rgba(184,92,79,0.12)', color: warmTheme.danger }}>
            {'\u26A0'} This save's integrity check failed. The file may have been
            edited outside the game. Your progress was still loaded — saving
            again will re-sign the file with the current state.
          </div>
        </Card>
      )}

      <Card title="Danger Zone" tone="danger" wide>
        <div style={styles.dangerCopy}>
          Permanently erase <strong>all progress</strong>: every card, boss kill,
          title, shard, and unlock. There is no undo.
        </div>

        {confirmDelete === 0 && (
          <button
            onClick={() => setConfirmDelete(1)}
            style={styles.dangerBtn}
          >
            Delete Save Data
          </button>
        )}

        {confirmDelete === 1 && (
          <div style={styles.dangerConfirm}>
            <div style={styles.dangerConfirmText}>
              Are you sure? This will permanently erase <strong>all progress</strong>.
            </div>
            <div style={styles.confirmRow}>
              <button onClick={() => setConfirmDelete(2)} style={styles.dangerConfirmBtn}>
                Yes, delete it
              </button>
              <button onClick={() => setConfirmDelete(0)} style={styles.cancelBtn}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {confirmDelete === 2 && (
          <div style={{ ...styles.dangerConfirm, borderColor: 'rgba(184,92,79,0.85)', background: 'rgba(184,92,79,0.18)' }}>
            <div style={{ ...styles.dangerConfirmText, fontWeight: 700 }}>
              Are you REALLY sure?
            </div>
            <div style={{ ...styles.dangerCopy, color: warmTheme.danger, marginTop: 4, opacity: 0.85 }}>
              There is no undo. Every card, boss kill, title, and shard will be gone forever.
            </div>
            <div style={styles.confirmRow}>
              <button
                onClick={onWipe}
                style={{ ...styles.dangerConfirmBtn, fontWeight: 700, background: 'rgba(184,92,79,0.32)' }}
              >
                Delete Everything
              </button>
              <button onClick={() => setConfirmDelete(0)} style={styles.cancelBtn}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ────────────────────── Reusable building blocks ──────────────────────

function Card(props: {
  title: string;
  tone: 'warm' | 'cool' | 'danger';
  wide?: boolean;
  meta?: string;
  children: React.ReactNode;
}) {
  const tones: Record<'warm' | 'cool' | 'danger', React.CSSProperties> = {
    warm:   { borderColor: 'rgba(214,162,94,0.32)',   background: 'linear-gradient(180deg, rgba(255,247,232,0.62) 0%, rgba(252,238,212,0.46) 100%)' },
    cool:   { borderColor: 'rgba(140,160,210,0.32)',  background: 'linear-gradient(180deg, rgba(238,242,255,0.55) 0%, rgba(220,228,248,0.42) 100%)' },
    danger: { borderColor: 'rgba(184,92,79,0.36)',    background: 'linear-gradient(180deg, rgba(255,240,236,0.55) 0%, rgba(248,224,220,0.40) 100%)' },
  };
  return (
    <div style={{
      ...styles.card,
      ...tones[props.tone],
      gridColumn: props.wide ? '1 / -1' : 'auto',
    }}>
      <div style={styles.cardHeader}>
        <div style={styles.cardTitle}>{props.title}</div>
        {props.meta && <div style={styles.cardMeta}>{props.meta}</div>}
      </div>
      <div style={styles.cardBody}>{props.children}</div>
    </div>
  );
}

function StatCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={styles.statCell}>
      <div style={styles.statCellLabel}>{label}</div>
      <div style={styles.statCellValue}>{value}</div>
      {sub && <div style={styles.statCellSub}>{sub}</div>}
    </div>
  );
}

function HeroStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={styles.heroStat}>
      <div style={styles.heroStatLabel}>{label}</div>
      <div style={{
        ...styles.heroStatValue,
        color: highlight ? warmTheme.accent : warmTheme.text,
        textShadow: highlight ? `0 0 12px ${warmTheme.accentSoft}` : 'none',
      }}>{value}</div>
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

// ────────────────────── Styles ──────────────────────

const styles: Record<string, React.CSSProperties> = {
  // Calm full-screen backdrop with layered hue washes.
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, #1a120c 0%, #160f0d 60%, #100a0d 100%)',
    display: 'flex',
    zIndex: 30,
    overflow: 'hidden',
    fontFamily: 'Georgia, serif',
    animation: 'backdropFade 0.22s ease',
  },
  washWarm: {
    position: 'absolute',
    top: '-25%', left: '-10%', width: '85%', height: '90%',
    background: 'radial-gradient(ellipse, rgba(214,162,94,0.18) 0%, transparent 60%)',
    filter: 'blur(70px)', pointerEvents: 'none',
  },
  washCool: {
    position: 'absolute',
    bottom: '-25%', right: '-10%', width: '80%', height: '85%',
    background: 'radial-gradient(ellipse, rgba(140,160,210,0.16) 0%, transparent 65%)',
    filter: 'blur(80px)', pointerEvents: 'none',
  },
  washVignette: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.42) 100%)',
    pointerEvents: 'none',
  },

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

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'clamp(20px, 2.2vw, 32px) clamp(40px, 4vw, 80px) clamp(14px, 1.6vw, 20px)',
    flexShrink: 0,
    gap: 24,
  },
  headerBrand: { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 },
  headerTitle: {
    fontSize: 'clamp(28px, 2.6vw, 38px)',
    fontWeight: 300,
    letterSpacing: 6,
    color: warmTheme.accentSoft,
    fontFamily: '"Cinzel", "Cormorant Garamond", Georgia, serif',
    textShadow: '0 2px 18px rgba(214,162,94,0.35)',
  },
  headerSub: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: 'rgba(245,232,214,0.55)',
    fontWeight: 300,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: '50%',
    border: '1px solid rgba(245,232,214,0.22)',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(245,232,214,0.78)',
    fontSize: 15, cursor: 'pointer', flexShrink: 0,
    transition: 'all 0.18s ease',
    fontFamily: 'inherit',
  },

  // Identity hero
  identityHero: {
    display: 'flex',
    alignItems: 'center',
    gap: 28,
    padding: 'clamp(14px, 1.5vw, 20px) clamp(40px, 4vw, 80px) clamp(20px, 2vw, 28px)',
    flexShrink: 0,
  },
  avatarWrap: {
    position: 'relative',
    display: 'inline-flex',
    flexShrink: 0,
  },
  avatarHalo: {
    position: 'absolute', inset: '-18px',
    background: 'radial-gradient(circle, rgba(214,162,94,0.32) 0%, transparent 65%)',
    filter: 'blur(14px)', pointerEvents: 'none',
  },
  avatar: {
    position: 'relative',
    width: 90, height: 90, borderRadius: '50%',
    background: 'linear-gradient(160deg, #f5d196 0%, #b87a3a 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 44, color: '#3a220f',
    border: '2px solid rgba(245,228,200,0.6)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 28px rgba(214,162,94,0.25)',
  },
  identityBody: {
    display: 'flex', flexDirection: 'column', gap: 6,
    minWidth: 0, flex: 1,
  },
  nameInput: {
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(245,232,214,0.18)',
    color: '#f5e8d6',
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: 0.6,
    padding: '4px 0',
    outline: 'none',
    fontFamily: 'inherit',
    maxWidth: 320,
  },
  titleText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: 'rgba(245,232,214,0.62)',
    letterSpacing: 0.4,
  },
  statusRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 11,
    color: 'rgba(245,232,214,0.55)',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statusDot: {
    width: 8, height: 8, borderRadius: '50%',
    flexShrink: 0,
  },
  statusLabel: { letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 10 },
  statusDivider: { opacity: 0.5 },
  statusEmail: { fontFamily: 'monospace', opacity: 0.7 },

  heroStats: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(20px, 2.2vw, 36px)',
    flexShrink: 0,
    paddingLeft: 24,
    borderLeft: '1px solid rgba(245,232,214,0.12)',
  },
  heroStat: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5,
  },
  heroStatLabel: {
    fontSize: 9,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: 'rgba(245,232,214,0.5)',
    fontWeight: 400,
  },
  heroStatValue: {
    fontSize: 17,
    fontWeight: 600,
    letterSpacing: 0.5,
    color: '#f5e8d6',
    fontVariantNumeric: 'tabular-nums',
  },

  // Tabs
  tabRow: {
    display: 'flex',
    gap: 4,
    padding: '0 clamp(40px, 4vw, 80px)',
    borderBottom: '1px solid rgba(245,232,214,0.10)',
    flexShrink: 0,
  },
  tabBtn: {
    flex: '0 1 220px',
    padding: '14px 22px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: '10px 10px 0 0',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'all 0.18s ease',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  tabCaption: {
    fontSize: 10,
    letterSpacing: 0.6,
    marginTop: 3,
    opacity: 0.7,
  },

  // Content
  content: {
    flex: 1,
    overflowY: 'auto',
    minHeight: 0,
    padding: 'clamp(24px, 2.4vw, 40px) clamp(40px, 4vw, 80px)',
  },
  contentInner: {
    maxWidth: 1180,
    margin: '0 auto',
  },

  // Card grid
  tabGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 18,
  },
  card: {
    borderRadius: 14,
    border: '1px solid rgba(214,162,94,0.32)',
    padding: '18px 20px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    backdropFilter: 'blur(6px)',
    color: warmTheme.text,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: warmTheme.accentDeep,
    fontWeight: 600,
    fontFamily: '"Cinzel", Georgia, serif',
  },
  cardMeta: {
    fontSize: 10,
    letterSpacing: 1,
    color: warmTheme.textMuted,
    fontVariantNumeric: 'tabular-nums',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },

  // Stats
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 10,
  },
  statCell: {
    padding: '10px 12px',
    borderRadius: 10,
    background: 'rgba(255,250,240,0.42)',
    border: '1px solid rgba(214,162,94,0.22)',
  },
  statCellLabel: {
    fontSize: 9, letterSpacing: 1.8, textTransform: 'uppercase',
    color: warmTheme.textMuted, fontWeight: 600,
  },
  statCellValue: {
    fontSize: 18, fontWeight: 700, color: warmTheme.text,
    marginTop: 4, letterSpacing: 0.4,
    fontVariantNumeric: 'tabular-nums',
  },
  statCellSub: {
    fontSize: 10, color: warmTheme.textFaint, marginTop: 2, letterSpacing: 0.4,
  },

  // Avatar small
  avatarRow: { display: 'flex', alignItems: 'center', gap: 14 },
  avatarSmall: {
    width: 48, height: 48, borderRadius: '50%',
    background: 'rgba(255,250,240,0.55)',
    border: '1px solid rgba(214,162,94,0.32)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 24, color: warmTheme.accentDeep,
    flexShrink: 0,
  },
  avatarRowLabel: { fontSize: 12, fontWeight: 700, color: warmTheme.text, letterSpacing: 0.5 },
  avatarRowHint: { fontSize: 11, color: warmTheme.textMuted, marginTop: 3, lineHeight: 1.4 },

  // Title badge
  titleBadgeRow: { display: 'flex', alignItems: 'center', gap: 10 },
  titleBadgeText: {
    flex: 1, padding: '10px 14px', borderRadius: 10,
    border: '1px solid rgba(214,162,94,0.25)',
    background: 'rgba(255,250,240,0.42)',
    fontSize: 13, color: warmTheme.text, fontStyle: 'italic',
  },
  pillBtn: {
    padding: '10px 16px', borderRadius: 999,
    border: `1px solid ${warmTheme.borderStrong}`,
    background: warmTheme.button,
    color: warmTheme.accentDeep,
    fontSize: 11, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  },

  // Themes
  themeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 10,
  },
  themeCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
    padding: 12, borderRadius: 10,
    color: warmTheme.text, fontFamily: 'inherit', textAlign: 'left',
  },
  themeName: { fontSize: 13, fontWeight: 700, letterSpacing: 0.4 },
  themeDesc: { fontSize: 10, color: warmTheme.textMuted, lineHeight: 1.4 },

  // Social
  signedOutHint: {
    marginTop: 10,
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px dashed rgba(140,160,210,0.4)',
    background: 'rgba(220,228,248,0.35)',
    color: warmTheme.text, fontSize: 11.5, lineHeight: 1.55,
  },
  lockedCard: {
    padding: '24px 16px',
    borderRadius: 10,
    border: '1px dashed rgba(140,160,210,0.4)',
    background: 'rgba(220,228,248,0.25)',
    color: warmTheme.text,
    textAlign: 'center',
  },
  lockedTitle: { fontSize: 13, fontWeight: 700, letterSpacing: 1, color: warmTheme.accentDeep, marginBottom: 6 },
  lockedBody: { fontSize: 11.5, color: warmTheme.textMuted, lineHeight: 1.55, maxWidth: 440, margin: '0 auto' },

  // Save
  savePrimaryBtn: {
    width: '100%', padding: '12px 0', borderRadius: 10,
    fontSize: 13, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background 0.18s ease, color 0.18s ease',
  },
  saveHint: { fontSize: 11, color: warmTheme.textMuted, lineHeight: 1.5 },
  exportRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  outlineBtn: {
    padding: '10px 0', borderRadius: 10,
    border: `1px solid ${warmTheme.borderStrong}`,
    background: 'rgba(255,250,240,0.5)',
    color: warmTheme.accentDeep,
    fontSize: 12, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  statusBanner: {
    padding: '8px 12px', borderRadius: 8,
    fontSize: 11, lineHeight: 1.45,
    border: '1px solid transparent',
  },

  // Danger
  dangerCopy: { fontSize: 12, color: warmTheme.text, lineHeight: 1.55 },
  dangerBtn: {
    width: '100%', padding: '12px 0', borderRadius: 10,
    border: '1px solid rgba(184,92,79,0.5)',
    background: 'rgba(184,92,79,0.14)',
    color: warmTheme.danger,
    fontSize: 12, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  dangerConfirm: {
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid rgba(184,92,79,0.55)',
    background: 'rgba(184,92,79,0.10)',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  dangerConfirmText: {
    fontSize: 12, color: warmTheme.danger, lineHeight: 1.5,
  },
  confirmRow: { display: 'flex', gap: 8 },
  dangerConfirmBtn: {
    flex: 1, padding: '9px 0', borderRadius: 8,
    border: '1px solid rgba(184,92,79,0.75)',
    background: 'rgba(184,92,79,0.2)',
    color: warmTheme.danger,
    fontSize: 12, letterSpacing: 1, cursor: 'pointer', fontFamily: 'inherit',
  },
  cancelBtn: {
    flex: 1, padding: '9px 0', borderRadius: 8,
    border: `1px solid ${warmTheme.border}`,
    background: 'rgba(255,250,240,0.4)',
    color: warmTheme.textMuted,
    fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
  },
};
