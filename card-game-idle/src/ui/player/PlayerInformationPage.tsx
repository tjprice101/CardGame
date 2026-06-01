// PlayerInformationPage  Eunified full-screen home for everything that
// describes "you, the player": identity (avatar / title / theme), social
// (account, friends, leaderboards), and save data (save / export / import /
// wipe). Replaces the separate Profile, Social, and Save-section-inside-
// Settings surfaces with one calm, soft-hued, well-organised page.

import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useStore, selectProfile, selectProgress } from '@/state/store';
import { warmTheme, uiTypography, applyUiPalette, type UiPalette } from '@/ui/theme';
import { resolveAvatar } from '@/data/profile/avatars';
import { TITLE_BADGES, resolveTitleBadge } from '@/data/profile/titleBadges';
import {
  applyEffectiveTheme,
  DEFAULT_UI_THEME_ID,
  UI_THEME_BY_ID,
  UI_THEMES,
  getThemePreviewPalette,
  isThemeUnlocked,
} from '@/data/profile/uiThemes';
import {
  DEFAULT_MAIN_MENU_BACKGROUND_ID,
  getDefaultMainMenuBackground,
  isMainMenuBackgroundUnlocked,
  loadMainMenuBackgroundEntries,
  type MainMenuBackgroundEntry,
} from '@/data/profile/mainMenuBackgrounds';
import TitlesModal from '@/ui/profile/TitlesModal';
import ProfilePictureModal from '@/ui/profile/ProfilePictureModal';
import SignatureCardPickerModal from '@/ui/profile/SignatureCardPickerModal';
import { CardRegistry } from '@/cards/CardRegistry';
import {
  getCardFaceBackgroundStyle,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
  cardFacePalette,
} from '@/ui/cardBackgrounds';
import { getDisplayCardTypeLabel } from '@/ui/preferences';
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
import { flushCloudSaveNow } from '@/social/cloudSaveSync';

interface Props {
  onClose: () => void;
  onSave: () => void;
  onWipe: () => void;
  onExport?: () => string | null;
  onImport?: (text: string) => boolean;
}

type TabId = 'profile' | 'menu-backgrounds' | 'social' | 'save';

const TABS: { id: TabId; label: string; glyph: string; caption: string }[] = [
  { id: 'profile', label: 'Profile',     glyph: 'ID', caption: 'Identity, titles & themes' },
  { id: 'menu-backgrounds', label: 'Main Menu Background Customizations', glyph: 'BG', caption: 'Swap splash background art' },
  { id: 'social',  label: 'Social',      glyph: 'SO', caption: 'Account, friends & boards' },
  { id: 'save',    label: 'Save & Data', glyph: 'SV', caption: 'Save, export, import, wipe' },
];

const UI_THEME_EDITABLE_KEYS: Array<keyof UiPalette> = [
  'appBackground',
  'overlay',
  'backdrop',
  'surface',
  'surfaceStrong',
  'surfaceMuted',
  'border',
  'borderStrong',
  'text',
  'textSoft',
  'textMuted',
  'textFaint',
  'accent',
  'accentSoft',
  'accentDeep',
  'success',
  'danger',
  'cherubim',
  'glow',
  'shadow',
  'button',
];

// Dark cinematic gold palette  Eall UI colour constants in one place.
const G = {
  gold:             'var(--profile-accent)',
  goldSoft:         'var(--profile-accent-soft)',
  goldBorder:       'var(--profile-border)',
  goldBorderStrong: 'var(--profile-border-strong)',
  goldGlass:        'var(--profile-accent-glass)',
  text:             'var(--profile-text)',
  cinzel:           uiTypography.display,
  success:          'var(--profile-success)',
  danger:           'var(--profile-danger)',
  dangerSoft:       'var(--profile-danger-soft)',
  dangerBorder:     'var(--profile-danger-border)',
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
  const setMainMenuBackgroundId = useStore(s => s.setMainMenuBackgroundId);
  const setCustomUiThemeColor = useStore(s => s.setCustomUiThemeColor);
  const resetCustomUiTheme = useStore(s => s.resetCustomUiTheme);
  const setSignatureCard = useStore(s => s.setSignatureCard);
  const dailyLogin = useStore(s => s.progress.dailyLogin);
  const saveTampered = useStore(s => s.saveTampered ?? false);

  const status = useSocialStore(selectSocialStatus);
  const socialUser = useSocialStore(selectSocialUser);
  const syncOwnProfile = useSocialStore(s => s.syncOwnProfile);
  const friends = useFriendsStore(selectFriendsList);
  const incoming = useFriendsStore(selectIncomingRequests);
  const blocked = useFriendsStore(selectBlockedList);
  const authed = status === 'authenticated';

  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [nameDraft, setNameDraft] = useState(profile.name);
  const [bioDraft, setBioDraft] = useState(profile.bio ?? '');
  const [showTitles, setShowTitles] = useState(false);
  const [showPictures, setShowPictures] = useState(false);
  const [sigPickerSlot, setSigPickerSlot] = useState<number | null>(null);
  const [gameSaved, setGameSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(0); // 0=none 1=first 2=second
  const [importStatus, setImportStatus] =
    useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const [themeBaseId, setThemeBaseId] = useState(profile.uiThemeId || DEFAULT_UI_THEME_ID);
  const [themeDraft, setThemeDraft] = useState<Record<string, string>>(profile.customUiTheme ?? {});
  const [themeSaved, setThemeSaved] = useState(false);
  const [themeNowMs, setThemeNowMs] = useState<number>(() => Date.now());
  const [mainMenuBackgrounds, setMainMenuBackgrounds] = useState<MainMenuBackgroundEntry[]>([getDefaultMainMenuBackground()]);
  const [mainMenuBackgroundsLoading, setMainMenuBackgroundsLoading] = useState(false);
  const [mainMenuBackgroundsError, setMainMenuBackgroundsError] = useState<string | null>(null);
  const [bioSaved, setBioSaved] = useState(false);
  const [titleSaved, setTitleSaved] = useState(false);
  const [, forceThemeRender] = useReducer((n: number) => n + 1, 0);
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

  useEffect(() => {
    const id = setInterval(() => setThemeNowMs(Date.now()), 180);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setMainMenuBackgroundsLoading(true);
    void loadMainMenuBackgroundEntries()
      .then((entries) => {
        if (cancelled) return;
        setMainMenuBackgrounds(entries);
        setMainMenuBackgroundsError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setMainMenuBackgrounds([getDefaultMainMenuBackground()]);
        setMainMenuBackgroundsError('Could not read imported splash backgrounds.');
      })
      .finally(() => {
        if (!cancelled) setMainMenuBackgroundsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setThemeBaseId(profile.uiThemeId || DEFAULT_UI_THEME_ID);
    setThemeDraft(profile.customUiTheme ?? {});
  }, [profile.uiThemeId, profile.customUiTheme]);

  // Profile data can arrive asynchronously after auth/cloud reconcile.
  // Keep editable drafts in sync so the header shows restored account values.
  useEffect(() => {
    setNameDraft(profile.name);
  }, [profile.name]);

  useEffect(() => {
    setBioDraft(profile.bio ?? '');
  }, [profile.bio]);

  // Restore the saved effective theme when this screen closes so preview edits
  // do not leak into the rest of the app.
  useEffect(() => {
    return () => {
      applyEffectiveTheme(
        profile.uiThemeId || DEFAULT_UI_THEME_ID,
        profile.customUiTheme ?? null,
        progress,
      );
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-apply whenever the draft changes so preview is live while editing.
  useEffect(() => {
    const def = UI_THEME_BY_ID[themeBaseId];
    const base = def ? getThemePreviewPalette(def, themeNowMs) : null;
    if (!base) return;
    applyUiPalette(themeDraft ? { ...base, ...themeDraft } : { ...base });
    forceThemeRender();
  }, [themeBaseId, themeDraft, themeNowMs]);

  function chooseThemeBase(themeId: string) {
    if (!isThemeUnlocked(themeId, progress)) return;
    setThemeBaseId(themeId);
    // Selecting a base theme starts from a clean palette to avoid mixed styles.
    setThemeDraft({});
    setThemeSaved(false);
  }

  function saveUiTheme() {
    setUiThemeId(themeBaseId);
    resetCustomUiTheme();
    for (const key of UI_THEME_EDITABLE_KEYS) {
      const value = themeDraft[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        setCustomUiThemeColor(key, value.trim());
      }
    }
    setThemeSaved(true);
    setTimeout(() => setThemeSaved(false), 1600);
    void syncProfileNow();
  }

  function resetUiThemeDraft() {
    setThemeDraft({});
    setThemeSaved(false);
  }

  function commitName() {
    const clean = nameDraft.trim();
    if (clean) {
      setPlayerName(clean);
      void syncProfileNow({ displayName: clean });
    } else {
      setNameDraft(profile.name);
    }
  }

  function persistBio() {
    setBio(bioDraft);
    void syncProfileNow({ bio: bioDraft });
    setBioSaved(true);
    setTimeout(() => setBioSaved(false), 1600);
  }

  async function syncProfileNow(overrides?: Partial<{
    displayName: string;
    bio: string;
    avatarId: string;
    titleId: string | null;
    uiThemeId: string | null;
    customUiTheme: Record<string, string> | null;
    signatureCardIds: string[];
  }>) {
    if (status !== 'authenticated') return;
    const p = useStore.getState().progress.profile;
    await syncOwnProfile({
      displayName: overrides?.displayName ?? p.name,
      bio: overrides?.bio ?? (p.bio ?? ''),
      avatarId: overrides?.avatarId ?? p.avatarId,
      titleId: overrides?.titleId ?? p.titleId,
      uiThemeId: overrides?.uiThemeId ?? (p.uiThemeId ?? null),
      customUiTheme: overrides?.customUiTheme ?? (p.customUiTheme ?? null),
      signatureCardIds: overrides?.signatureCardIds ?? (p.signatureCardIds ?? []),
    });
  }

  function handleSaveGame() {
    onSave();
    void syncProfileNow();
    void flushCloudSaveNow();
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
    <div style={{
      ...S.backdrop,
      ['--profile-accent' as any]: warmTheme.accent,
      ['--profile-accent-soft' as any]: warmTheme.accentSoft,
      ['--profile-accent-deep' as any]: warmTheme.accentDeep,
      ['--profile-text' as any]: warmTheme.text,
      ['--profile-text-soft' as any]: warmTheme.textSoft,
      ['--profile-text-muted' as any]: warmTheme.textMuted,
      ['--profile-text-faint' as any]: warmTheme.textFaint,
      ['--profile-border' as any]: warmTheme.border,
      ['--profile-border-strong' as any]: warmTheme.borderStrong,
      ['--profile-accent-glass' as any]: warmTheme.surfaceMuted,
      ['--profile-app-bg' as any]: warmTheme.appBackground,
      ['--profile-surface' as any]: warmTheme.surface,
      ['--profile-surface-strong' as any]: warmTheme.surfaceStrong,
      ['--profile-surface-muted' as any]: warmTheme.surfaceMuted,
      ['--profile-button' as any]: warmTheme.button,
      ['--profile-glow' as any]: warmTheme.glow,
      ['--profile-success' as any]: warmTheme.success,
      ['--profile-danger' as any]: warmTheme.danger,
      ['--profile-danger-soft' as any]: 'rgba(184,92,79,0.2)',
      ['--profile-danger-border' as any]: 'rgba(184,92,79,0.58)',
    }}>
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
          <button onClick={onClose} style={S.closeBtn} aria-label="Close">×</button>
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
              maxLength={200}
              rows={2}
              placeholder="Write a short bio…"
              style={S.bioInput as React.CSSProperties}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <button
                onClick={persistBio}
                className="menu-tactile-btn"
                style={{ ...S.outlineBtn, padding: '6px 12px', fontSize: 11 }}
              >
                Save Bio
              </button>
              {bioSaved && <span style={{ fontSize: 10, color: G.success }}>Bio saved</span>}
            </div>
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
                  boxShadow: active ? warmTheme.glow : 'none',
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
                themeBaseId={themeBaseId}
                onChooseTheme={chooseThemeBase}
                onSaveTheme={saveUiTheme}
                onResetThemeDraft={resetUiThemeDraft}
                themeSaved={themeSaved}
                themeNowMs={themeNowMs}
                onPickSignatureCard={setSigPickerSlot}
                onClearSignatureCard={(slot) => setSignatureCard(slot, null)}
              />
            )}
            {activeTab === 'social' && (
              <SocialTab authed={authed} friends={friends} incoming={incoming} blocked={blocked} />
            )}
            {activeTab === 'menu-backgrounds' && (
              <MainMenuBackgroundsTab
                selectedBackgroundId={profile.mainMenuBackgroundId ?? DEFAULT_MAIN_MENU_BACKGROUND_ID}
                backgrounds={mainMenuBackgrounds}
                progress={progress}
                loading={mainMenuBackgroundsLoading}
                loadError={mainMenuBackgroundsError}
                onSelectBackground={(id) => setMainMenuBackgroundId(id)}
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
      </div>

      {showTitles && (
        <TitlesModal
          onClose={() => setShowTitles(false)}
          onApply={() => {
            setTitleSaved(true);
            setTimeout(() => setTitleSaved(false), 1600);
            void syncProfileNow();
          }}
        />
      )}
      {showPictures && (
        <ProfilePictureModal
          currentAvatarId={profile.avatarId ?? ''}
          onClose={() => setShowPictures(false)}
          onApply={(avatarId) => {
            setTimeout(() => { void syncProfileNow({ avatarId }); }, 0);
          }}
        />
      )}
      {sigPickerSlot !== null && (
        <SignatureCardPickerModal
          slotIndex={sigPickerSlot}
          onClose={() => setSigPickerSlot(null)}
          onPick={(cardId) => {
            setSignatureCard(sigPickerSlot, cardId);
            setSigPickerSlot(null);
            setTimeout(() => { void syncProfileNow(); }, 0);
          }}
        />
      )}

      {titleSaved && (
        <div style={{
          position: 'absolute',
          top: 18,
          right: 64,
          padding: '6px 10px',
          borderRadius: 999,
          border: `1px solid ${G.success}`,
          background: 'rgba(79,138,71,0.12)',
          color: G.success,
          fontSize: 11,
          letterSpacing: 0.5,
        }}>
          Title applied
        </div>
      )}
    </div>
  );
}

// Rarity accent colours used in the Signature Cards card slots.
const SIG_RARITY_COLOR: Record<string, string> = {
  Common:    '#aabccc',
  Rare:      '#6699dd',
  Epic:      '#aa66dd',
  Legendary: '#ddaa33',
  Eternal:   '#ff8844',
  Infinite:  '#44ddcc',
};

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
  themeBaseId: string;
  onChooseTheme: (id: string) => void;
  onSaveTheme: () => void;
  onResetThemeDraft: () => void;
  themeSaved: boolean;
  themeNowMs: number;
  onPickSignatureCard: (slot: number) => void;
  onClearSignatureCard: (slot: number) => void;
}) {
  const {
    progress, profile, currentAvatar, currentTitle,
    totalCollection, distinctCards, totalBossClears, distinctBosses,
    unlockedTitlesCount, titlesTotal, dailyLogin,
    onOpenTitles, onChangePicture, themeBaseId,
    onChooseTheme, onSaveTheme, onResetThemeDraft, themeSaved, themeNowMs,
    onPickSignatureCard, onClearSignatureCard,
  } = props;

  const [themeSubtab, setThemeSubtab] = useState<'core' | 'reward'>(() => {
    const active = UI_THEME_BY_ID[themeBaseId];
    return active?.group === 'reward' ? 'reward' : 'core';
  });

  useEffect(() => {
    const active = UI_THEME_BY_ID[themeBaseId];
    if (active?.group === 'reward') setThemeSubtab('reward');
  }, [themeBaseId]);

  const visibleThemes = useMemo(
    () => UI_THEMES.filter((theme) => theme.group === themeSubtab),
    [themeSubtab],
  );

  const rewardThemeTotals = useMemo(() => {
    const rewardThemes = UI_THEMES.filter((theme) => theme.group === 'reward');
    const unlocked = rewardThemes.filter((theme) => isThemeUnlocked(theme.id, progress)).length;
    return { unlocked, total: rewardThemes.length };
  }, [progress]);

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
        <div style={S.themeSubtabRow}>
          <button
            onClick={() => setThemeSubtab('core')}
            style={{
              ...S.themeSubtabBtn,
              ...(themeSubtab === 'core' ? S.themeSubtabBtnActive : null),
            }}
          >
            Core
          </button>
          <button
            onClick={() => setThemeSubtab('reward')}
            style={{
              ...S.themeSubtabBtn,
              ...(themeSubtab === 'reward' ? S.themeSubtabBtnActive : null),
            }}
          >
            Rewards {rewardThemeTotals.unlocked}/{rewardThemeTotals.total}
          </button>
        </div>

        <div style={S.themeGrid}>
          {visibleThemes.map(t => {
            const active = themeBaseId === t.id;
            const unlocked = isThemeUnlocked(t.id, progress);
            const preview = getThemePreviewPalette(t, themeNowMs);
            return (
              <button
                key={t.id}
                onClick={() => unlocked && onChooseTheme(t.id)}
                title={unlocked ? t.description : (t.unlockHint ?? t.description)}
                disabled={!unlocked}
                style={{
                  ...S.themeCard,
                  background: active ? warmTheme.surfaceStrong : warmTheme.surface,
                  border: active ? `2px solid ${warmTheme.accent}` : `1px solid ${warmTheme.border}`,
                  boxShadow: active ? warmTheme.glow : 'none',
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  opacity: unlocked ? 1 : 0.52,
                }}
              >
                <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
                  <ThemeSwatch color={preview.accent} />
                  <ThemeSwatch color={preview.accentSoft} />
                  <ThemeSwatch color={preview.surfaceStrong} />
                  <ThemeSwatch color={preview.text} />
                </div>
                <div style={S.themeName}>{t.name}</div>
                <div style={S.themeDesc}>{unlocked ? t.description : (t.unlockHint ?? t.description)}</div>
              </button>
            );
          })}
        </div>

        <div style={S.themeActionRow}>
          <button onClick={onResetThemeDraft} className="menu-tactile-btn" style={S.outlineBtn}>
            Reset Theme
          </button>
          <button onClick={onSaveTheme} className="menu-tactile-btn" style={S.goldBtn}>
            {themeSaved ? 'Saved UI Theme' : 'Save UI Theme'}
          </button>
        </div>
        <div style={S.saveHint}>
          Save locks your selected base theme plus custom colors as your active UI theme.
        </div>
      </GlassCard>

      {/* Signature Cards */}
      <GlassCard title="Signature Cards" wide>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {Array.from({ length: 5 }, (_, i) => {
            const cardId = (profile.signatureCardIds ?? [])[i] ?? null;
            const def = cardId ? CardRegistry.get(cardId) : null;
            const rarityColor = def ? (SIG_RARITY_COLOR[def.rarity] ?? G.gold) : warmTheme.border;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
                <button
                  onClick={() => onPickSignatureCard(i)}
                  title={def ? `Change: ${def.name}` : `Pick card for slot ${i + 1}`}
                  style={{
                    width: 90, height: 124, borderRadius: 12,
                    border: def ? `1px solid ${rarityColor}55` : `1px dashed ${warmTheme.border}`,
                    ...(def ? getCardFaceBackgroundStyle(def, 'normal') : {}),
                    backgroundColor: def ? warmTheme.surfaceStrong : warmTheme.surface,
                    position: 'relative',
                    display: 'flex', flexDirection: 'column', alignItems: 'stretch',
                    overflow: 'hidden', cursor: 'pointer', padding: 0,
                    boxShadow: def ? `0 4px 18px ${rarityColor}28` : 'none',
                    transition: 'all 0.18s ease',
                    flexShrink: 0,
                  }}
                >
                  {def ? (
                    <>
                      <div style={getCardNameRibbonStyle('compact')}>
                        <div style={{ fontSize: 6, letterSpacing: 1, textTransform: 'uppercase', color: cardFacePalette.text }}>
                          {getDisplayCardTypeLabel(def.type)}
                        </div>
                      </div>
                      <div style={getCardRulesPanelStyle('compact')}>
                        <div style={{ fontSize: 7, fontWeight: 'bold', color: cardFacePalette.text, lineHeight: 1.2 }}>
                          {def.name}
                        </div>
                        <div style={{ fontSize: 6, color: rarityColor, letterSpacing: 0.4, marginTop: 1 }}>
                          {def.rarity}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}>
                      <span style={{ fontSize: 20, color: warmTheme.textMuted, fontWeight: 300, lineHeight: 1 }}>+</span>
                      <span style={{ fontSize: 7, color: warmTheme.textFaint, letterSpacing: 1, textTransform: 'uppercase' }}>
                        Slot {i + 1}
                      </span>
                    </div>
                  )}
                </button>
                {def && (
                  <button
                    onClick={() => onClearSignatureCard(i)}
                    title="Remove card"
                    style={{
                      fontSize: 8, letterSpacing: 1, textTransform: 'uppercase',
                      color: 'rgba(184,92,79,0.65)',
                      background: 'transparent', border: 'none',
                      cursor: 'pointer', padding: '1px 4px',
                      fontFamily: uiTypography.display, lineHeight: 1,
                    }}
                  >Remove</button>
                )}
              </div>
            );
          })}
        </div>
        <div style={S.saveHint}>
          Showcase up to 5 cards on your profile - visible to friends.
        </div>
      </GlassCard>
    </div>
  );
}

function MainMenuBackgroundsTab(props: {
  selectedBackgroundId: string;
  backgrounds: MainMenuBackgroundEntry[];
  progress: ReturnType<typeof selectProgress>;
  loading: boolean;
  loadError: string | null;
  onSelectBackground: (id: string) => void;
}) {
  const { selectedBackgroundId, backgrounds, progress, loading, loadError, onSelectBackground } = props;

  return (
    <div style={S.tabGrid}>
      <GlassCard title="Main Menu Background Customizations" wide>
        <div style={S.saveHint}>
          Choose which splash art appears behind the Main Menu hub. This is saved independently from UI theme colors.
        </div>

        {loading && <div style={S.saveHint}>Loading splash backgrounds…</div>}
        {loadError && <div style={{ ...S.saveHint, color: G.danger }}>{loadError}</div>}

        <div style={S.menuBgGrid}>
          {backgrounds.map((bg) => {
            const active = bg.id === selectedBackgroundId;
            const unlocked = isMainMenuBackgroundUnlocked(bg, progress);
            const stateLabel = active ? 'Equipped' : unlocked ? 'Unlocked' : 'Locked';
            return (
              <button
                key={bg.id}
                className="menu-tactile-btn"
                disabled={!unlocked}
                onClick={() => {
                  if (!unlocked) return;
                  onSelectBackground(bg.id);
                }}
                style={{
                  ...S.menuBgCard,
                  border: active ? `2px solid ${warmTheme.accent}` : `1px solid ${warmTheme.border}`,
                  boxShadow: active ? warmTheme.glow : 'none',
                  opacity: unlocked ? 1 : 0.62,
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                }}
              >
                <div
                  style={{
                    ...S.menuBgPreview,
                    backgroundImage: `url("${bg.imageUrl}")`,
                    filter: unlocked ? undefined : 'grayscale(0.82) brightness(0.58)',
                  }}
                />
                <div style={S.menuBgMetaRow}>
                  <div style={S.menuBgName}>{bg.name}</div>
                  <div
                    style={{
                      ...S.menuBgState,
                      color: active ? warmTheme.accentDeep : unlocked ? warmTheme.textSoft : warmTheme.textMuted,
                      background: active ? warmTheme.accentSoft : unlocked ? warmTheme.surfaceStrong : warmTheme.surfaceMuted,
                    }}
                  >
                    {stateLabel}
                  </div>
                </div>
                <div style={S.themeDesc}>
                  {!unlocked
                    ? (bg.unlockHint ?? 'Unlock requirement not yet met.')
                    : bg.source === 'workspace'
                      ? 'Imported splash art'
                      : 'Built-in default'}
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
    <div style={S.socialLayout}>
      <GlassCard title="Account" tone="cool" wide>
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
        bodyStyle={S.socialFriendsBody}
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
            background: gameSaved ? 'linear-gradient(135deg, rgba(79,138,71,0.75) 0%, rgba(55,110,50,0.85) 100%)' : warmTheme.button,
            border: gameSaved ? '1px solid rgba(79,138,71,0.6)' : `1px solid ${G.goldBorderStrong}`,
            color: gameSaved ? '#c8edc4' : warmTheme.accentDeep,
            boxShadow: gameSaved ? '0 4px 14px rgba(79,138,71,0.28)' : warmTheme.glow,
          }}
        >
          {gameSaved ? '✓ Saved!' : 'Save Game Data'}
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
            Your progress was still loaded  Esaving again will re-sign the file with the current state.
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
  cardStyle?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const tone = props.tone ?? 'warm';
  const toneBorderColor: Record<string, string> = {
    warm:   warmTheme.border,
    cool:   'rgba(110,140,210,0.32)',
    danger: 'rgba(184,92,79,0.38)',
  };
  const toneAccent: Record<string, string> = {
    warm:   G.gold,
    cool:   '#7a9ad0',
    danger: G.danger,
  };
  const toneInsetGlow: Record<string, string> = {
    warm:   warmTheme.surfaceMuted,
    cool:   'rgba(100,130,200,0.08)',
    danger: 'rgba(184,92,79,0.10)',
  };
  return (
    <div style={{
      ...S.card,
      ...props.cardStyle,
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
      <div style={{ ...S.cardBody, ...props.bodyStyle }}>{props.children}</div>
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
        textShadow: highlight ? warmTheme.glow : 'none',
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
    background: 'var(--profile-app-bg)',
    display: 'flex',
    zIndex: 30,
    overflowY: 'auto',
    overflowX: 'hidden',
    fontFamily: uiTypography.body,
    animation: 'backdropFade 0.22s ease',
  },
  washWarm: {
    position: 'absolute',
    top: '-22%', left: '-10%', width: '75%', height: '85%',
    background: 'radial-gradient(ellipse, rgba(88,170,218,0.24) 0%, rgba(58,142,200,0.10) 42%, transparent 68%)',
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
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
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
    color: 'var(--profile-accent-soft)',
    fontFamily: uiTypography.display,
    textShadow: '0 2px 24px rgba(88,170,218,0.30)',
    lineHeight: 1.1,
  },
  headerRule: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  headerRuleLine: {
    height: 1, width: 100, flexShrink: 0,
    background: 'linear-gradient(90deg, var(--profile-accent-soft) 0%, transparent 100%)',
  },
  headerRuleGlyph: {
    fontSize: 11,
    color: 'var(--profile-text-muted)',
    lineHeight: 1,
    flexShrink: 0,
    userSelect: 'none',
  },
  headerSub: {
    fontSize: 9,
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: 'var(--profile-text-muted)',
    fontWeight: 400,
  },
  closeBtn: {
    width: 42, height: 42,
    borderRadius: '50%',
    border: '1px solid var(--profile-border-strong)',
    background: 'var(--profile-accent-glass)',
    color: 'var(--profile-text)',
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
    borderBottom: '1px solid var(--profile-border)',
    background: 'var(--profile-surface)',
    flexShrink: 0,
  },

  /* Triple-ring avatar */
  avatarOuter: {
    width: 118, height: 118,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    background: 'var(--profile-accent-glass)',
    boxShadow: 'var(--profile-glow)',
  },
  avatarMiddle: {
    width: 104, height: 104,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid var(--profile-border-strong)',
    boxShadow: 'var(--profile-glow)',
  },
  avatarInner: {
    width: 88, height: 88,
    borderRadius: '50%',
    border: '2.5px solid var(--profile-accent-soft)',
    background: 'var(--profile-surface-strong)',
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
    borderBottom: '1px solid var(--profile-border)',
    color: 'var(--profile-text)',
    fontSize: 28,
    fontWeight: 300,
    letterSpacing: 2,
    padding: '3px 0',
    outline: 'none',
    fontFamily: uiTypography.display,
    maxWidth: 340,
    lineHeight: 1.2,
  },
  titleRibbon: {
    display: 'inline-flex',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: '4px 14px',
    borderRadius: 999,
    background: 'var(--profile-accent-glass)',
    border: '1px solid var(--profile-border-strong)',
    fontSize: 12,
    fontStyle: 'italic',
    color: 'var(--profile-text)',
    letterSpacing: 0.5,
  },
  bioInput: {
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--profile-border)',
    color: 'var(--profile-text-muted)',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 1.6,
    padding: '3px 0',
    outline: 'none',
    fontFamily: uiTypography.body,
    resize: 'none',
    maxWidth: 340,
    width: '100%',
    marginTop: 2,
  },
  statusRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 10, color: 'var(--profile-text-muted)', letterSpacing: 0.6, marginTop: 2,
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
    borderLeft: '1px solid var(--profile-border)',
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
    color: 'var(--profile-text-muted)',
    fontWeight: 400,
    whiteSpace: 'nowrap',
  },
  emblemValue: {
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: 0.5,
    color: 'var(--profile-text)',
    fontVariantNumeric: 'tabular-nums',
  },
  emblemDivider: {
    width: 1, height: 30,
    background: 'var(--profile-accent-glass)',
    flexShrink: 0,
  },

  /* ── Tab navigation ── */
  tabRow: {
    display: 'flex',
    gap: 2,
    padding: '0 clamp(40px,4vw,80px)',
    background: 'var(--profile-surface-muted)',
    borderBottom: '1px solid var(--profile-border)',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    zIndex: 10,
    backdropFilter: 'blur(12px)',
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
    color: 'var(--profile-accent-soft)',
    display: 'block',
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    fontFamily: uiTypography.display,
  },
  tabCaption: {
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 3,
    color: 'var(--profile-text-muted)',
  },

  /* ── Content area ── */
  content: {
    padding: 'clamp(24px,2.4vw,40px) clamp(40px,4vw,80px) clamp(40px,4vw,80px)',
  },
  contentInner: { maxWidth: 1480, margin: '0 auto' },

  /* ── Card grid ── */
  tabGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 18,
    alignItems: 'start',
  },
  socialLayout: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  socialFriendsBody: {
    padding: '14px 16px 16px',
    minHeight: 520,
  },

  /* ── Glass card base ── */
  card: {
    borderRadius: 16,
    border: '1px solid var(--profile-border)',
    background: 'var(--profile-surface-strong)',
    backdropFilter: 'blur(8px)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    padding: '15px 22px 13px',
    borderBottom: '1px solid var(--profile-border)',
  },
  cardAccentBar: {
    width: 3, height: 18, borderRadius: 2, flexShrink: 0,
  },
  cardTitle: {
    fontSize: 10,
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: 'var(--profile-text)',
    fontWeight: 600,
    fontFamily: uiTypography.display,
  },
  cardMeta: {
    fontSize: 9,
    letterSpacing: 1,
    color: 'var(--profile-text-muted)',
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
    background: 'var(--profile-accent-glass)',
    border: '1px solid var(--profile-border)',
    textAlign: 'center',
    display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center',
  },
  medallionLabel: {
    fontSize: 8, letterSpacing: 2, textTransform: 'uppercase',
    color: 'var(--profile-text-muted)',
    fontFamily: uiTypography.display,
  },
  medallionValue: {
    fontSize: 26, fontWeight: 300, color: 'var(--profile-accent-soft)',
    fontVariantNumeric: 'tabular-nums', letterSpacing: 0.3, lineHeight: 1.15,
  },
  medallionSub: {
    fontSize: 9, color: 'var(--profile-text-faint)', letterSpacing: 0.4,
  },

  /* ── Avatar showcase (Profile Picture card) ── */
  avatarShowcase: {
    display: 'flex', alignItems: 'center', gap: 16,
  },
  showcaseRingOuter: {
    width: 74, height: 74,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--profile-accent-glass)',
    border: '1.5px solid var(--profile-border-strong)',
    boxShadow: 'var(--profile-glow)',
    flexShrink: 0,
  },
  showcaseRingInner: {
    width: 60, height: 60,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid var(--profile-accent-soft)',
    background: 'var(--profile-surface-strong)',
    overflow: 'hidden',
  },
  showcaseName: {
    fontSize: 13, fontWeight: 600, color: 'var(--profile-text)', letterSpacing: 0.5,
  },
  showcaseDesc: {
    fontSize: 11, color: 'var(--profile-text-muted)', marginTop: 4, lineHeight: 1.45,
  },

  /* ── Title scroll ── */
  titleScroll: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    padding: '4px 0',
  },
  titleScrollRule: {
    width: '100%', height: 1,
    background: 'linear-gradient(90deg, transparent 0%, var(--profile-border-strong) 25%, var(--profile-border-strong) 75%, transparent 100%)',
  },
  titleScrollText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: 'var(--profile-text)',
    fontFamily: uiTypography.display,
    textAlign: 'center',
    padding: '8px 20px',
    letterSpacing: 0.8,
    lineHeight: 1.45,
  },

  /* ── Theme grid ── */
  themeSubtabRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  themeSubtabBtn: {
    padding: '7px 12px',
    borderRadius: 999,
    border: '1px solid var(--profile-border)',
    background: 'var(--profile-surface)',
    color: 'var(--profile-text-muted)',
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: uiTypography.display,
  },
  themeSubtabBtnActive: {
    border: '1px solid var(--profile-border-strong)',
    background: 'var(--profile-accent-glass)',
    color: 'var(--profile-text)',
    boxShadow: 'var(--profile-glow)',
  },
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
    fontSize: 12, fontWeight: 600, color: 'var(--profile-text)',
    letterSpacing: 1.5,
    fontFamily: uiTypography.display,
  },
  themeDesc: {
    fontSize: 9, color: 'var(--profile-text-muted)', lineHeight: 1.4, marginTop: 4,
  },
  themeEditorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 8,
  },
  themeFieldLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  themeFieldName: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'var(--profile-text-muted)',
  },
  themeFieldInput: {
    borderRadius: 8,
    border: '1px solid var(--profile-border)',
    background: 'var(--profile-surface)',
    color: 'var(--profile-text)',
    padding: '8px 10px',
    fontSize: 11,
    fontFamily: uiTypography.body,
    outline: 'none',
  },
  themeActionRow: {
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  menuBgGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 220px))',
    justifyContent: 'start',
    gap: 12,
  },
  menuBgCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 6,
    borderRadius: 12,
    background: 'var(--profile-surface)',
    padding: 8,
    cursor: 'pointer',
    textAlign: 'left',
  },
  menuBgPreview: {
    width: '100%',
    aspectRatio: '16 / 9',
    borderRadius: 6,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '1px solid var(--profile-border)',
    boxShadow: 'inset 0 -14px 26px rgba(0,0,0,0.4)',
  },
  menuBgMetaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  menuBgName: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 0.8,
    color: 'var(--profile-text)',
    fontFamily: uiTypography.display,
  },
  menuBgState: {
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    borderRadius: 999,
    padding: '3px 7px',
    fontFamily: uiTypography.display,
    border: '1px solid var(--profile-border)',
    whiteSpace: 'nowrap',
  },

  /* ── Buttons ── */
  goldBtn: {
    padding: '11px 22px',
    borderRadius: 999,
    border: '1px solid var(--profile-border-strong)',
    background: 'var(--profile-button)',
    color: 'var(--profile-accent-deep)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: uiTypography.display,
    boxShadow: 'var(--profile-glow)',
    whiteSpace: 'nowrap',
  },
  outlineBtn: {
    padding: '10px 14px', borderRadius: 10,
    border: '1px solid var(--profile-border)',
    background: 'var(--profile-surface)',
    color: 'var(--profile-text)',
    fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: uiTypography.display,
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
    fontSize: 30, color: 'var(--profile-text-faint)',
  },
  lockedTitle: {
    fontSize: 13, fontWeight: 600, letterSpacing: 2.5, textTransform: 'uppercase',
    color: 'var(--profile-text-muted)',
    fontFamily: uiTypography.display,
  },
  lockedBody: {
    fontSize: 12, color: 'var(--profile-text-faint)', lineHeight: 1.6, maxWidth: 420,
  },

  /* ── Save & Data ── */
  saveHint: {
    fontSize: 11, color: 'var(--profile-text-faint)', lineHeight: 1.55,
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
    cursor: 'pointer', fontFamily: uiTypography.display,
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
    fontSize: 12, letterSpacing: 1, cursor: 'pointer', fontFamily: uiTypography.body,
  },
  cancelBtn: {
    flex: 1, padding: '10px 0', borderRadius: 8,
    border: '1px solid var(--profile-border)',
    background: 'var(--profile-surface)',
    color: 'var(--profile-text)',
    fontSize: 12, letterSpacing: 1, cursor: 'pointer', fontFamily: uiTypography.body,
  },
};

// Keep import alive \u2014 warmTheme used by AuthPanel / FriendsPanel sub-trees.
void warmTheme;



