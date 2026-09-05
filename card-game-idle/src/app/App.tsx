import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import '@/styles/animations.css';
import { GameEngine } from '@/core/engine/GameEngine';
import HUD from '@/ui/hud/HUD';
import { SfxManager } from '@/audio/SfxManager';
const DeckBuilder = lazy(() => import('@/ui/deck/DeckBuilder'));
const DeckViewer = lazy(() => import('@/ui/deck/DeckViewer'));
const CardPackStore = lazy(() => import('@/ui/store/CardPackStore'));
const SettingsPanel = lazy(() => import('@/ui/settings/SettingsPanel'));
const EternitysWake = lazy(() => import('@/ui/eternitysWake/EternitysWake'));
const BossFightArena = lazy(() => import('@/ui/eternitysWake/BossFightArena'));
const BossResultModal = lazy(() => import('@/ui/eternitysWake/BossResultModal'));
const CardBoundCoopHub = lazy(() => import('@/ui/menu/CardBoundCoopHub'));
const Infinitude = lazy(() => import('@/ui/infinitude/Infinitude'));
const WishedUponAStarEvent = lazy(() => import('@/ui/eventWishedUponAStar/WishedUponAStarEvent'));
const TutorialModal = lazy(() => import('@/ui/menus/TutorialModal'));
const PlayerInformationPage = lazy(() => import('@/ui/player/PlayerInformationPage'));
const DailyRewardModal = lazy(() => import('@/ui/profile/DailyRewardModal'));
const QuestsModal = lazy(() => import('@/ui/menus/QuestsModal'));
const AchievementsModal = lazy(() => import('@/ui/menus/AchievementsModal'));
const AscensionHub = lazy(() => import('@/ui/ascension/AscensionHub'));
const NullRaidArena = lazy(() => import('@/ui/ascension/NullRaidArena'));
const NullRaidResults = lazy(() => import('@/ui/ascension/NullRaidResults'));
const CardMasteryModal = lazy(() => import('@/ui/menus/CardMasteryModal'));
const FractureModal = lazy(() => import('@/ui/menus/FractureModal'));
const EnigmaModal = lazy(() => import('@/ui/menus/EnigmaModal'));
const ChatWindow = lazy(() => import('@/ui/social/ChatWindow'));
const ToastQueue = lazy(() => import('@/ui/components/ToastQueue'));
const RadioNowPlaying = lazy(() => import('@/ui/components/RadioNowPlaying'));
const RadioControlBar = lazy(() => import('@/ui/components/RadioControlBar'));
const SplashScreen = lazy(() => import('@/ui/boot/SplashScreen'));
const TitleScreen = lazy(() => import('@/ui/boot/TitleScreen'));
const MainMenuHub = lazy(() => import('@/ui/menu/MainMenuHub'));
const PartyInviteModal = lazy(() => import('@/ui/social/PartyInviteModal'));
const PartyHub = lazy(() => import('@/ui/social/PartyHub'));
const BattlegroundLobby = lazy(() => import('@/ui/battleground/BattlegroundLobby'));
const BattlegroundMatch = lazy(() => import('@/ui/battleground/BattlegroundMatch'));
const BattlegroundRewards = lazy(() => import('@/ui/battleground/BattlegroundRewards'));
const BattlegroundInviteModal = lazy(() => import('@/ui/battleground/BattlegroundInviteModal'));
const CoopRaidInviteModal = lazy(() => import('@/ui/ascension/CoopRaidInviteModal'));
const EternityBossCoopInviteModal = lazy(() => import('@/ui/eternitysWake/EternityBossCoopInviteModal'));
const ArenaShell = lazy(() => import('@/ui/hud/ArenaShell'));
import { warmTheme } from '@/ui/theme';
import { applyEffectiveTheme, DEFAULT_UI_THEME_ID, isThemeOscillating } from '@/data/profile/uiThemes';
import { useStore, selectTurn, selectBossFight, selectBattleground, selectSettings, selectProgress, selectTrialDeck } from '@/state/store';
import { useFriendsStore } from '@/state/friendsStore';
import TrialDeckHUD from '@/ui/hud/TrialDeckHUD';
const TrialDeckSummaryModal = lazy(() => import('@/ui/trialDeck/TrialDeckSummaryModal'));
import { PACK_DEFINITIONS } from '@/data/packs/packDefinitions';
import { getTrialDeckDisplayName, type NeutralityTutorialTier } from '@/data/trialDecks';
import { DEFAULT_CONTROL_BINDINGS } from '@/types/game';
import { getFontScale, setUiPreferences } from '@/ui/preferences';
import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';
import { evaluateDailyLogin } from '@/systems/progression/dailyLogin';
import { TITLE_BADGES } from '@/data/profile/titleBadges';
import { initAccountSync } from '@/social/accountSync';
import { initStatsSync } from '@/social/statsSync';
import { initCloudSaveSync } from '@/social/cloudSaveSync';
import { initSocialNotifications } from '@/social/notificationsService';
import { useSocialStore } from '@/state/socialStore';
import { useMessagesStore } from '@/state/messagesStore';
import { MusicManager, type MusicTrackId } from '@/audio/MusicManager';
import { MainMenuRadio } from '@/audio/MainMenuRadio';
import { MainTurnRadio } from '@/audio/MainTurnRadio';
import { EternityBossRadio } from '@/audio/EternityBossRadio';
import type { NowPlayingEvent } from '@/ui/components/RadioNowPlaying';
import { usePartyStore } from '@/state/partyStore';

/**
 * Top-level scene state machine. Splash plays once on app boot, advances
 * automatically (or on any key/click) to the title screen, then the player
 * advances to the menu hub. The menu hub is the home base between turns;
 * the arena scene is the active in-play layout (mulligan + playing phases
 * and any active boss fight).
 */
type AppScene = 'splash' | 'title' | 'menu' | 'arena';

function BootLoadingFallback({ label }: { label: string }) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 190,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(180deg, ${warmTheme.surfaceMuted} 0%, ${warmTheme.surface} 50%, ${warmTheme.surfaceStrong} 100%)`,
      color: warmTheme.textSoft,
      fontFamily: 'Georgia, serif',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontSize: 11,
    }}>
      {label}
    </div>
  );
}

/**
 * Wrapper that applies CSS screen-shake classes in response to custom events
 * dispatched by the game engine (angel summons, big boss damage hits).
 */
function HudShakeWrapper({ children }: { children: React.ReactNode }) {
  const divRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const microTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerShake = React.useCallback((hard: boolean) => {
    const el = divRef.current;
    if (!el) return;
    const cls = hard ? 'anim-screen-shake-hard' : 'anim-screen-shake-soft';
    el.classList.remove('anim-screen-shake-soft', 'anim-screen-shake-hard', 'anim-screen-shake-micro');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Force reflow so re-adding the same class re-triggers animation.
    void el.offsetWidth;
    el.classList.add(cls);
    timeoutRef.current = setTimeout(() => {
      el.classList.remove(cls);
    }, hard ? 650 : 450);
  }, []);

  const triggerMicro = React.useCallback(() => {
    const el = divRef.current;
    if (!el) return;
    // Don't interrupt a harder shake already in progress
    if (el.classList.contains('anim-screen-shake-soft') || el.classList.contains('anim-screen-shake-hard')) return;
    el.classList.remove('anim-screen-shake-micro');
    if (microTimeoutRef.current) clearTimeout(microTimeoutRef.current);
    void el.offsetWidth;
    el.classList.add('anim-screen-shake-micro');
    microTimeoutRef.current = setTimeout(() => {
      el.classList.remove('anim-screen-shake-micro');
    }, 280);
  }, []);

  useEffect(() => {
    const onSoft = () => triggerShake(false);
    const onHard = () => triggerShake(true);
    const onMicro = () => triggerMicro();
    window.addEventListener('hud-shake-soft', onSoft);
    window.addEventListener('hud-shake-hard', onHard);
    window.addEventListener('hud-shake-micro', onMicro);
    return () => {
      window.removeEventListener('hud-shake-soft', onSoft);
      window.removeEventListener('hud-shake-hard', onHard);
      window.removeEventListener('hud-shake-micro', onMicro);
    };
  }, [triggerShake, triggerMicro]);

  return (
    <div ref={divRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {children}
    </div>
  );
}

const engine = new GameEngine();

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasSeenSaveRef = useRef(false);
  const wasCombatActiveRef = useRef(false);
  useEffect(() => { initAccountSync(); }, []);
  // Phase 5: install activity-event + leaderboard stats sync. Idempotent;
  // safely no-ops without Supabase or while signed out.
  useEffect(() => { initStatsSync(); }, []);
  // Account-owned progression: on sign-in, reconcile local vs cloud save and
  // continuously upload fresh autosaves for cross-device continuity.
  useEffect(() => { initCloudSaveSync(); }, []);
  // Phase 6: install desktop / in-app push notifications for DMs, gifts, and
  // friend requests. Idempotent; channels start/stop with auth status.
  useEffect(() => { initSocialNotifications(); }, []);
  const [showDeckBuilder, setShowDeckBuilder] = useState(false);
  const [showCardStore, setShowCardStore] = useState(false);
  const [showDeckViewer, setShowDeckViewer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showEternitysWake, setShowEternitysWake] = useState(false);
  const [showBattleground, setShowBattleground] = useState(false);
  const [showCardBoundCoop, setShowCardBoundCoop] = useState(false);
  const [showInfinitude, setShowInfinitude] = useState(false);
  const [showEventWuas, setShowEventWuas] = useState(false);
  const [showPlayerInfo, setShowPlayerInfo] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showEnigma, setShowEnigma] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showMastery, setShowMastery] = useState(false);
  const [showFracture, setShowFracture] = useState(false);
  const [showAscension, setShowAscension] = useState(false);
  const [showTrialSummary, setShowTrialSummary] = useState(false);
  const [showAutosaveIndicator, setShowAutosaveIndicator] = useState(false);
  // Radio state — main menu
  const radioActiveRef = useRef(false);
  const nowPlayingEpochRef = useRef(0);
  const [nowPlayingEvent, setNowPlayingEvent] = useState<NowPlayingEvent | null>(null);
  const [radioPaused, setRadioPaused] = useState(false);
  const [radioActive, setRadioActive] = useState(false);
  const [radioCurrentTrack, setRadioCurrentTrack] = useState<import('@/audio/MainMenuRadio').RadioTrackInfo | null>(null);
  // Radio state — main turn
  const turnRadioActiveRef = useRef(false);
  const eternityRadioActiveRef = useRef(false);
  const turnNowPlayingEpochRef = useRef(0);
  const [turnNowPlayingEvent, setTurnNowPlayingEvent] = useState<NowPlayingEvent | null>(null);
  const [turnRadioPaused, setTurnRadioPaused] = useState(false);
  const [turnRadioActive, setTurnRadioActive] = useState(false);
  const [turnRadioCurrentTrack, setTurnRadioCurrentTrack] = useState<import('@/audio/MainTurnRadio').RadioTrackInfo | null>(null);
  const [hideRadioUi, setHideRadioUi] = useState(false);
  const partyOverlayHidden = usePartyStore(s => s.overlayHidden);
  const partyHubOpen = usePartyStore(s => s.hubOpen);
  const partyActiveId = usePartyStore(s => s.activePartyId);
  const partyIncomingInvite = usePartyStore(s => s.incomingInvite);
  // Top-level scene state machine. Splash and title only display on the very
  // first boot of each app session; subsequent navigation cycles only between
  // menu and arena.
  const [scene, setScene] = useState<AppScene>('splash');
  const [themeNowMs, setThemeNowMs] = useState<number>(() => Date.now());
  const turn = useStore(selectTurn);
  const bossFight = useStore(selectBossFight);
  const battleground = useStore(selectBattleground);
  const settings = useStore(selectSettings);
  const progress = useStore(selectProgress);
  const trialDeck = useStore(selectTrialDeck);
  const lastSavedAt = useStore(s => s.lastSavedAt);
  const setPresenceActivity = useFriendsStore(s => s.setPresenceActivity);
  const socialAuthStatus = useSocialStore(s => s.status);
  const socialUserId = useSocialStore(s => s.user?.id ?? null);

  useEffect(() => {
    const themeId = progress.profile.uiThemeId || DEFAULT_UI_THEME_ID;
    if (!isThemeOscillating(themeId)) return;
    const id = setInterval(() => setThemeNowMs(Date.now()), 180);
    return () => clearInterval(id);
  }, [progress.profile.uiThemeId]);

  useEffect(() => {
    applyEffectiveTheme(
      progress.profile.uiThemeId || DEFAULT_UI_THEME_ID,
      progress.profile.customUiTheme ?? null,
      progress,
      themeNowMs,
    );
  }, [progress, themeNowMs]);

  useEffect(() => {
    if (bossFight.mode !== 'active') return;
    let lastTickMs = Date.now();
    const timerId = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = (now - lastTickMs) / 1000;
      if (elapsedSeconds <= 0) return;
      lastTickMs = now;
      useStore.getState().tickBossTimer(elapsedSeconds);
    }, 250);
    return () => clearInterval(timerId);
  }, [bossFight.mode]);

  // Watchdog: if an active boss fight ever has a non-positive timer for any reason
  // (interval skipped, state restored from save, freeze pinned us at 0:01), force the
  // tick once so completeBossFight runs and transitions us to the defeat screen.
  useEffect(() => {
    if (bossFight.mode !== 'active') return;
    if (typeof bossFight.fightTimeRemaining !== 'number' || bossFight.fightTimeRemaining > 0.5) return;
    const id = setTimeout(() => {
      useStore.getState().tickBossTimer(1);
    }, 50);
    return () => clearTimeout(id);
  }, [bossFight.mode, bossFight.fightTimeRemaining]);

  useEffect(() => {
    if (battleground.mode !== 'active') return;
    let lastTickMs = Date.now();
    const timerId = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = (now - lastTickMs) / 1000;
      if (elapsedSeconds <= 0) return;
      lastTickMs = now;
      useStore.getState().tickBattlegroundTimer(elapsedSeconds);
    }, 250);
    return () => clearInterval(timerId);
  }, [battleground.mode]);

  // Battleground expiry watchdog: same idea as boss watchdog above.
  useEffect(() => {
    if (battleground.mode !== 'active') return;
    if (typeof battleground.timeRemaining !== 'number' || battleground.timeRemaining > 0.5) return;
    const id = setTimeout(() => {
      useStore.getState().tickBattlegroundTimer(1);
    }, 50);
    return () => clearTimeout(id);
  }, [battleground.mode, battleground.timeRemaining]);

  useEffect(() => {
    const onOpenPartyHub = (e: Event) => {
      const detail = (e as CustomEvent<{ draft?: { type: 'battleground' | 'null_raid' | 'eternity_boss'; label: string; raidId?: string; bossId?: string; deckId?: string } }>).detail;
      if (detail?.draft) {
        usePartyStore.getState().setActivityDraft(detail.draft as any);
      }
      setShowCardBoundCoop(true);
      usePartyStore.getState().openHub(detail?.draft as any ?? null);
    };
    window.addEventListener('open-card-bound-coop', onOpenPartyHub as EventListener);
    return () => window.removeEventListener('open-card-bound-coop', onOpenPartyHub as EventListener);
  }, []);

  useEffect(() => {
    void usePartyStore.getState().connectRealtime();
    return () => { usePartyStore.getState().disconnectRealtime(); };
  }, []);

  useEffect(() => {
    const activeBoss = bossFight.activeBossId
      ? BOSS_DEFINITIONS.find(b => b.id === bossFight.activeBossId)
      : null;

    let label = 'Home Menu';
    let detail: string | null = null;
    let bossId: string | null = null;
    let bossName: string | null = null;

    if (scene === 'splash') {
      label = 'Booting Game';
      detail = 'Splash screen';
    } else if (scene === 'title') {
      label = 'Title Screen';
      detail = 'At the title screen';
    } else if (bossFight.mode === 'active' && activeBoss) {
      label = bossFight.kind === 'null_raid'
        ? 'Null Raid'
        : 'Boss Fight';
      detail = `Fighting ${activeBoss.name}`;
      bossId = activeBoss.id;
      bossName = activeBoss.name;
    } else if (battleground.mode === 'active') {
      label = 'Battleground Match';
      detail = 'In a card-born duel';
    } else if (showDeckBuilder) {
      label = 'Deck Builder';
      detail = 'Editing a deck';
    } else if (showCardStore) {
      label = 'Card Store';
      detail = 'Browsing packs';
    } else if (showInfinitude) {
      label = 'Infinitude';
      detail = 'Hunting Infinite cards';
    } else if (showEternitysWake) {
      label = "Eternity's Wake";
      detail = 'Browsing boss challenges';
    } else if (showAscension) {
      label = 'Ascension';
      detail = 'Running Ascension content';
    } else if (showPlayerInfo) {
      label = 'Player Profile';
      detail = 'Updating profile and social settings';
    } else if (turn.phase === 'mulligan' || turn.phase === 'playing') {
      label = 'In a Run';
      detail = 'Playing a standard run';
    }

    setPresenceActivity({ label, detail, bossId, bossName, at: Date.now() });
  }, [
    scene,
    turn.phase,
    bossFight.mode,
    bossFight.kind,
    bossFight.activeBossId,
    battleground.mode,
    showDeckBuilder,
    showCardStore,
    showInfinitude,
    showEternitysWake,
    showAscension,
    showPlayerInfo,
    setPresenceActivity,
  ]);

  useEffect(() => {
    document.documentElement.classList.toggle('reduced-motion', settings.reducedMotion);
    document.documentElement.classList.toggle('compact-mode', !!settings.compactMode);
    document.documentElement.lang = settings.language;
    const fontScale = getFontScale(settings.fontSizePreset);
    document.documentElement.style.setProperty('--ui-font-scale', String(fontScale));
    document.documentElement.style.fontSize = `${fontScale * 16}px`;
    setUiPreferences({
      language: settings.language,
      fontSizePreset: settings.fontSizePreset,
      cardArtDisplay: settings.cardArtDisplay,
      cardThemePacks: settings.cardThemePacks,
    });
  }, [settings.language, settings.fontSizePreset, settings.cardArtDisplay, settings.cardThemePacks, settings.reducedMotion, settings.compactMode]);

  // ── Music ────────────────────────────────────────────────────────────
  // Volume slider drives the master music gain in real time. A value of 0
  // (or the "Music Enabled" checkbox unchecked, which forces volume to 0)
  // pauses playback entirely.
  useEffect(() => {
    const vol = settings.musicVolume ?? 0.5;
    MusicManager.setVolume(vol);
    MainMenuRadio.setVolume(vol);
    MainTurnRadio.setVolume(vol);
    EternityBossRadio.setVolume(vol);
  }, [settings.musicVolume]);

  // ── SFX volume ───────────────────────────────────────────────────────
  useEffect(() => {
    SfxManager.setVolume(settings.sfxVolume ?? 0.8);
  }, [settings.sfxVolume]);

  // ── Global button click & hover SFX ─────────────────────────────────
  // Capture-phase pointerdown routes to one of three sounds based on a
  // data-sfx attribute on the button (or any ancestor):
  //   data-sfx="claim"  → clickChime()  (rewarding — Claim, Open Pack, Collect)
  //   (default)         → clickHeavy()  (standard heavy thud)
  //
  // A throttled pointerover listener fires hover() (a feather-light tick)
  // as the cursor enters each distinct button target, capped at once per
  // 80 ms to stay comfortable even on fast mouse movement.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const btn = (e.target as HTMLElement).closest('button, [role="button"]') as HTMLButtonElement | null;
      if (!btn || btn.disabled || btn.getAttribute('aria-disabled') === 'true') return;
      const sfx = btn.dataset.sfx ?? btn.closest('[data-sfx]')?.getAttribute('data-sfx') ?? '';
      if (sfx === 'claim') {
        SfxManager.clickChime();
      } else {
        SfxManager.clickHeavy();
      }
    };

    let lastHoverBtn: Element | null = null;
    let lastHoverTime = 0;
    const onPointerOver = (e: PointerEvent) => {
      const btn = (e.target as HTMLElement).closest('button, [role="button"]') as HTMLButtonElement | null;
      // Always update the tracked element so we reset when leaving buttons.
      // If the resolved button hasn't changed we are still hovering the same
      // element — never re-trigger regardless of how long it's been.
      if (btn === lastHoverBtn) return;
      lastHoverBtn = btn;
      if (!btn || btn.disabled || btn.getAttribute('aria-disabled') === 'true') return;
      // Throttle rapid sweeps across many different buttons (e.g. a button row)
      const now = performance.now();
      if (now - lastHoverTime < 60) return;
      lastHoverTime = now;
      SfxManager.hover();
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerover', onPointerOver);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerover', onPointerOver);
    };
  }, []);

  // Pick a track based on what's currently on-screen. Active boss fights
  // override everything; otherwise the topmost open menu wins. The main hub
  // (no menu, no fight) plays the ambient main menu theme.
  useEffect(() => {
    let track: MusicTrackId | null = null;
    if (scene !== 'splash' && scene !== 'title') {
      if (bossFight.mode === 'active') {
        if (bossFight.kind === 'null_raid') {
          if (bossFight.activeBossId === 'nr-neutrality-event-horizon-arbiter') {
            track = 'battle-null-raid-event-horizon-arbiter';
          } else if (bossFight.activeBossId === 'nr-neutrality-verdant-null') {
            track = 'battle-null-raid-verdant-null';
          } else if (bossFight.activeBossId === 'nr-pyroabyss-ember-eventide-tyrant') {
            track = 'battle-null-raid-ember-eventide-tyrant';
          } else {
            track = 'battle-null-raid';
          }
        } else {
          track = 'battle-eternity';
        }
      } else if (showAscension) {
        track = 'menu-ascension';
      } else if (showCardStore) {
        track = 'menu-shop';
      } else if (showInfinitude) {
        track = 'menu-infinitude';
      } else if (showEternitysWake) {
        track = 'menu-eternity';
      } else if (turn.phase === 'mulligan' || turn.phase === 'playing') {
        track = 'battle-normal';
      } else {
        track = 'menu-main';
      }
    }
    if (track === 'menu-main') {
      // Route the main menu through the radio playlist instead of a single looping track.
      if (!radioActiveRef.current) {
        radioActiveRef.current = true;
        setRadioActive(true);
        MainMenuRadio.setOnTrackChange((info) => {
          nowPlayingEpochRef.current++;
          setNowPlayingEvent({ epoch: nowPlayingEpochRef.current, track: info });
          setRadioCurrentTrack(info);
        });
        MainMenuRadio.setOnPausedChange((p) => setRadioPaused(p));
        MainMenuRadio.start(settings.musicVolume ?? 0.5);
        MusicManager.stop();
      }
      // Stop the turn radio if we were in a battle
      if (turnRadioActiveRef.current) {
        turnRadioActiveRef.current = false;
        setTurnRadioActive(false);
        MainTurnRadio.stop();
      }
      if (eternityRadioActiveRef.current) {
        eternityRadioActiveRef.current = false;
        EternityBossRadio.stop();
      }
    } else if (track === 'battle-normal') {
      // Route normal battle music through the turn radio playlist.
      if (!turnRadioActiveRef.current) {
        turnRadioActiveRef.current = true;
        setTurnRadioActive(true);
        MainTurnRadio.setOnTrackChange((info) => {
          turnNowPlayingEpochRef.current++;
          setTurnNowPlayingEvent({ epoch: turnNowPlayingEpochRef.current, track: info });
          setTurnRadioCurrentTrack(info);
        });
        MainTurnRadio.setOnPausedChange((p) => setTurnRadioPaused(p));
        MainTurnRadio.start(settings.musicVolume ?? 0.5);
        MusicManager.stop();
      }
      // Stop the menu radio if transitioning from menu
      if (radioActiveRef.current) {
        radioActiveRef.current = false;
        setRadioActive(false);
        MainMenuRadio.stop();
      }
      if (eternityRadioActiveRef.current) {
        eternityRadioActiveRef.current = false;
        EternityBossRadio.stop();
      }
    } else if (track === 'battle-eternity') {
      if (!eternityRadioActiveRef.current) {
        eternityRadioActiveRef.current = true;
        EternityBossRadio.start(settings.musicVolume ?? 0.5);
        MusicManager.stop();
      }
    } else {
      if (radioActiveRef.current) {
        radioActiveRef.current = false;
        setRadioActive(false);
        MainMenuRadio.stop();
      }
      if (turnRadioActiveRef.current) {
        turnRadioActiveRef.current = false;
        setTurnRadioActive(false);
        MainTurnRadio.stop();
      }
      if (eternityRadioActiveRef.current) {
        eternityRadioActiveRef.current = false;
        EternityBossRadio.stop();
      }
      MusicManager.playTrack(track);
    }
  }, [
    scene,
    bossFight.mode,
    bossFight.kind,
    bossFight.activeBossId,
    showCardStore,
    showAscension,
    showInfinitude,
    showEternitysWake,
    turn.phase,
  ]);

  // ─────────────────────────────────────────────────────────────────────

  const [saveHydrated, setSaveHydrated] = useState(false);
  useEffect(() => {
    if (!canvasRef.current) return;
    engine.init(canvasRef.current).then(() => setSaveHydrated(true)).catch((err) => {
      console.error(err);
      // Even if init failed, unblock title toasts so a brand new player still
      // gets feedback when they earn their first title.
      setSaveHydrated(true);
    });
    return () => { engine.destroy(); };
  }, []);

  // Detect newly-unlocked titles and surface them as toast notifications.
  // We must NOT compare against an empty initial set, because progress is
  // hydrated asynchronously by engine.init() — that would re-toast every
  // previously-earned title on every reload. Until the save has loaded we
  // keep re-priming the ref; only after hydration do we start comparing.
  const unlockedTitlesRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    const currentlyUnlocked = new Set<string>();
    for (const title of TITLE_BADGES) {
      try {
        if (title.isUnlocked(progress)) currentlyUnlocked.add(title.id);
      } catch {
        // Defensive: a malformed predicate shouldn't break the app.
      }
    }
    if (!saveHydrated || unlockedTitlesRef.current === null) {
      unlockedTitlesRef.current = currentlyUnlocked;
      return;
    }
    const previous = unlockedTitlesRef.current;
    const newlyUnlocked: string[] = [];
    for (const id of currentlyUnlocked) {
      if (!previous.has(id)) newlyUnlocked.push(id);
    }
    if (newlyUnlocked.length > 0) {
      const enqueueToast = useStore.getState().enqueueToast;
      for (const id of newlyUnlocked) {
        const title = TITLE_BADGES.find(tb => tb.id === id);
        if (title) enqueueToast(`Title unlocked: ${title.text}`, 'reward');
      }
    }
    unlockedTitlesRef.current = currentlyUnlocked;
  }, [progress, saveHydrated]);

  // Surface the daily login reward modal once after engine init when claimable.
  // Runs once on mount; if the player is mid-fight or has a menu open we still
  // queue it — the modal renders above with its own z-index.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const progress = useStore.getState().progress;
      if (evaluateDailyLogin(progress).claimable) {
        setShowDailyReward(true);
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, []);

  // Re-check daily login bonus when user signs in for the first time this session.
  // The page may have been loaded while the player was unauthenticated (title screen),
  // so the mount-time check above would miss the claimable window.
  const prevSocialStatusRef = useRef<string>('idle');
  const prevSocialUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevSocialStatusRef.current;
    const prevUserId = prevSocialUserIdRef.current;
    prevSocialStatusRef.current = socialAuthStatus;
    prevSocialUserIdRef.current = socialUserId;
    // Only trigger when transitioning INTO authenticated state.
    if (socialAuthStatus === 'authenticated' && prev !== 'authenticated') {
      const progress = useStore.getState().progress;
      if (evaluateDailyLogin(progress).claimable) {
        setShowDailyReward(true);
      }
    }
    // Clean up the chat panel and subscription only on a real sign-out or
    // account switch — i.e. when the previously-known user id is gone or
    // changed. Gating on `status !== 'authenticated'` alone would also fire
    // on spurious authenticated -> loading -> authenticated flickers (the
    // same flicker cloudSaveSync guards against), wiping the active chat
    // session and dropping inbound realtime messages mid-conversation.
    if (prevUserId && prevUserId !== socialUserId) {
      useMessagesStore.getState().fullyClose();
    }
  }, [socialAuthStatus, socialUserId]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const isTyping = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || tag === 'SELECT' || (e.target as HTMLElement | null)?.isContentEditable;

      if (e.code === 'Space' && !isTyping) {
        e.preventDefault();
        useStore.getState().addOblivion(1_000_000_000);
        return;
      }

      if (isTyping) return;

      const controls = { ...DEFAULT_CONTROL_BINDINGS, ...(settings.controls ?? {}) };

      // Global radio-UI toggle (default R): show/hide radio widgets without stopping playback.
      if (e.code === controls.toggleRadioUi && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setHideRadioUi(v => !v);
        e.preventDefault();
        return;
      }

      if (e.code === controls.togglePartyUi && !e.ctrlKey && !e.metaKey && !e.altKey) {
        usePartyStore.getState().toggleOverlayHidden();
        e.preventDefault();
        return;
      }

      // Close-overlay binding (default Escape): close topmost modal/overlay in priority order
      if (e.code === controls.closeOverlay) {
        if (showTutorial) { setShowTutorial(false); e.preventDefault(); return; }
        if (showSettings) { setShowSettings(false); e.preventDefault(); return; }
        if (showDeckViewer) { setShowDeckViewer(false); e.preventDefault(); return; }
        if (showDeckBuilder) { setShowDeckBuilder(false); e.preventDefault(); return; }
        if (showCardStore) { setShowCardStore(false); e.preventDefault(); return; }
        if (showInfinitude) { setShowInfinitude(false); e.preventDefault(); return; }
        if (showEventWuas) { setShowEventWuas(false); e.preventDefault(); return; }
        if (showEternitysWake) { setShowEternitysWake(false); e.preventDefault(); return; }
        if (showPlayerInfo) { setShowPlayerInfo(false); e.preventDefault(); return; }
        if (showQuests) { setShowQuests(false); e.preventDefault(); return; }
        if (showAchievements) { setShowAchievements(false); e.preventDefault(); return; }
        if (showMastery) { setShowMastery(false); e.preventDefault(); return; }
        if (showEnigma) { setShowEnigma(false); e.preventDefault(); return; }
        if (showAscension) { setShowAscension(false); e.preventDefault(); return; }
        if (showDailyReward) { setShowDailyReward(false); e.preventDefault(); return; }
        // If in an active trial, show the summary instead of doing nothing
        if (trialDeck.mode === 'active') { setShowTrialSummary(true); e.preventDefault(); return; }
        return;
      }

      // Open-tutorial binding (default Slash, i.e. "?")
      if (e.code === controls.openTutorial) {
        setShowTutorial(v => !v);
        e.preventDefault();
        return;
      }

      // Swap Hand ↔ Extra Deck binding (default KeyE). Dispatches a window
      // event picked up by HandDisplay. Only fires when no modal is open and
      // an active turn is in play (mulligan OR playing), in regular or boss
      // fight modes.
      if (e.code === controls.swapExtraDeck && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const anyModalOpen = showTutorial || showSettings || showDeckViewer || showDeckBuilder || showCardStore || showInfinitude || showEternitysWake || showPlayerInfo || showDailyReward || showQuests || showAchievements || showMastery || showEnigma || showEventWuas || showAscension;
        if (anyModalOpen) return;
        const phase = useStore.getState().turn.phase;
        if (phase === 'playing' || phase === 'mulligan') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('hr-toggle-extra-deck'));
        }
      }

      // Set ability hotkeys. Fire during playing phase only.
      const abilitySlotMap: Array<[string, 1 | 2 | 3]> = [
        [controls.activateSetAbility1 ?? 'Digit1', 1],
        [controls.activateSetAbility2 ?? 'Digit2', 2],
        [controls.activateSetAbility3 ?? 'Digit3', 3],
      ];
      for (const [code, slot] of abilitySlotMap) {
        if (e.code === code && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const anyModalOpen = showTutorial || showSettings || showDeckViewer || showDeckBuilder || showCardStore || showInfinitude || showEternitysWake || showPlayerInfo || showDailyReward || showQuests || showAchievements || showMastery || showEnigma || showEventWuas || showAscension;
          if (anyModalOpen) return;
          e.preventDefault();
          useStore.getState().activateSetAbility(slot);
          return;
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showTutorial, showSettings, showDeckViewer, showDeckBuilder, showCardStore, showInfinitude, showEternitysWake, showPlayerInfo, showDailyReward, showQuests, showAchievements, showMastery, showEnigma, showEventWuas, showAscension, settings.controls, trialDeck.mode]);

  useEffect(() => {
    if (!hasSeenSaveRef.current) {
      hasSeenSaveRef.current = true;
      return;
    }
    setShowAutosaveIndicator(true);
    const timeout = window.setTimeout(() => setShowAutosaveIndicator(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [lastSavedAt]);

  const idlePhase = turn.phase === 'idle';
  const inBossFight = bossFight.mode === 'active';
  const bossResultVisible = bossFight.kind !== 'null_raid' && (bossFight.mode === 'victory' || bossFight.mode === 'defeat');
  const isMenuOpen = showDeckBuilder || showCardStore || showDeckViewer || showSettings || showTutorial || showEternitysWake || showInfinitude || showPlayerInfo || showQuests || showAchievements || showMastery || showEnigma || showEventWuas || showBattleground || showAscension || bossResultVisible;

  // When a combat session starts (including co-op launches), force-close
  // open overlays so both clients transition into the arena immediately.
  useEffect(() => {
    const combatActive = bossFight.mode === 'active' || battleground.mode === 'active' || trialDeck.mode === 'active';
    const justEnteredCombat = combatActive && !wasCombatActiveRef.current;
    wasCombatActiveRef.current = combatActive;
    if (!justEnteredCombat) return;

    setShowDeckBuilder(false);
    setShowCardStore(false);
    setShowDeckViewer(false);
    setShowSettings(false);
    setShowTutorial(false);
    setShowEternitysWake(false);
    setShowBattleground(false);
    setShowCardBoundCoop(false);
    setShowInfinitude(false);
    setShowEventWuas(false);
    setShowPlayerInfo(false);
    setShowDailyReward(false);
    setShowQuests(false);
    setShowAchievements(false);
    setShowMastery(false);
    setShowEnigma(false);
    setShowAscension(false);
    setShowTrialSummary(false);
    usePartyStore.getState().closeHub();
  }, [bossFight.mode, battleground.mode, trialDeck.mode]);

  // Auto-sync scene to gameplay state once the player has reached the menu.
  // Entering an active turn or boss fight moves us into the arena; finishing
  // the turn returns us to the menu. Splash/title remain manual transitions.
  // Battleground matches keep the arena active regardless of turn phase.
  // Trial Deck sessions also keep arena active.
  useEffect(() => {
    if (scene === 'splash' || scene === 'title') return;
    const inPlay = !idlePhase || inBossFight || battleground.mode === 'active' || trialDeck.mode === 'active';
    if (inPlay && scene !== 'arena') setScene('arena');
    else if (!inPlay && scene !== 'menu') setScene('menu');
  }, [scene, idlePhase, inBossFight, battleground.mode, trialDeck.mode]);

  // Unified Eternity's Wake background overlay during any active boss fight (matches selection menu).
  const showBossBackdrop = inBossFight && BOSS_DEFINITIONS.some(b => b.id === bossFight.activeBossId);
  const showPartyShell = showCardBoundCoop || partyHubOpen || partyActiveId !== null || partyIncomingInvite !== null;
  const ETERNITYS_WAKE_BG = 'radial-gradient(circle at 50% -8%, rgba(255, 108, 108, 0.22) 0%, rgba(255, 108, 108, 0) 35%), radial-gradient(circle at 18% 86%, rgba(149, 62, 95, 0.22) 0%, rgba(149, 62, 95, 0) 44%), repeating-linear-gradient(126deg, rgba(255, 130, 130, 0.08) 0px, rgba(255, 130, 130, 0.08) 1px, rgba(0, 0, 0, 0) 1px, rgba(0, 0, 0, 0) 24px), linear-gradient(180deg, rgba(8, 4, 12, 0.985) 0%, rgba(18, 9, 20, 0.985) 100%)';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: warmTheme.appBackground,
        color: warmTheme.text,
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
      <React.Fragment>
      <div className="game-bg-pattern game-bg-pattern--grain" />
      <div className="game-bg-pattern game-bg-pattern--sigils" />

      {/* Unified Eternity's Wake background, fades in during active boss fight */}
      {showBossBackdrop && !isMenuOpen && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: ETERNITYS_WAKE_BG,
            opacity: 0.92,
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'opacity 600ms ease',
          }}
        />
      )}

      {/* Boss fight HP bar overlay - hidden while full-screen menus are open */}
      {!isMenuOpen && scene === 'arena' && bossFight.kind !== 'null_raid' && <Suspense fallback={null}><BossFightArena /></Suspense>}
      {scene === 'arena' && bossFight.kind === 'null_raid' && bossFight.mode === 'active' && <Suspense fallback={null}><NullRaidArena /></Suspense>}

      {/* Battleground match HUD overlay (timer + scores) */}
      {!isMenuOpen && battleground.mode === 'active' && (
        <Suspense fallback={null}><BattlegroundMatch /></Suspense>
      )}

      {/* Battleground result screen */}
      {battleground.mode === 'finished' && (
        <Suspense fallback={null}><BattlegroundRewards /></Suspense>
      )}

      {/* Ambient arena backdrop — element-tinted gradient under the HUD. */}
      {!isMenuOpen && scene === 'arena' && (
        <Suspense fallback={null}><ArenaShell /></Suspense>
      )}

      {/* HUD overlay — only mounted in the arena scene. */}
      {!isMenuOpen && scene === 'arena' && (
        <HudShakeWrapper>
          <HUD />
        </HudShakeWrapper>
      )}

      {/* Trial Deck HUD — shown in arena when a trial is active */}
      {!isMenuOpen && scene === 'arena' && trialDeck.mode === 'active' && (
        <TrialDeckHUD onEndTrialRequest={() => setShowTrialSummary(true)} />
      )}

      {/* Main menu hub — replaces the legacy scattered top-right nav clusters. */}
      {!isMenuOpen && scene === 'menu' && !inBossFight && battleground.mode !== 'active' && (
        <Suspense fallback={null}>
          <MainMenuHub
            onCardStore={() => setShowCardStore(true)}
            onCardBoundCoop={() => { setShowCardBoundCoop(true); usePartyStore.getState().openHub(); }}
            onEternitysWake={() => setShowEternitysWake(true)}
            onBattleground={() => setShowBattleground(true)}
            onInfinitude={() => setShowInfinitude(true)}
            onEventWishedUponAStar={() => setShowEventWuas(true)}
            onDeckViewer={() => setShowDeckViewer(true)}
            onTutorial={() => setShowTutorial(true)}
            onDeckBuilder={() => setShowDeckBuilder(true)}
            onPlayerInfo={() => setShowPlayerInfo(true)}
            onQuests={() => setShowQuests(true)}
            onEnigma={() => setShowEnigma(true)}
            onAchievements={() => setShowAchievements(true)}
            onMastery={() => setShowMastery(true)}
            onFracture={() => setShowFracture(true)}
            onSettings={() => setShowSettings(true)}
            onAscension={() => setShowAscension(true)}
            onBeginTurn={() => {
              setScene('arena');
              useStore.getState().beginTurn();
            }}
          />
        </Suspense>
      )}

      {/* Top-right navigation buttons (visible when idle and not in a boss fight) */}
      {/* Replaced by MainMenuHub; legacy idle nav cluster removed. */}

      {/* Deck tools row kept separate from navigation to avoid overlap */}
      {/* Replaced by MainMenuHub; legacy idle deck-tools cluster removed. */}

      {/* Deck Builder modal */}
      {showDeckBuilder && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><DeckBuilder onClose={() => setShowDeckBuilder(false)} /></Suspense>
        </div>
      )}

      {/* Card Pack Store modal */}
      {showCardStore && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><CardPackStore onClose={() => setShowCardStore(false)} /></Suspense>
        </div>
      )}

      {/* Deck Viewer modal */}
      {showDeckViewer && idlePhase && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><DeckViewer
            onClose={() => setShowDeckViewer(false)}
            onOpenDeckBuilder={() => { setShowDeckViewer(false); setShowDeckBuilder(true); }}
          /></Suspense>
        </div>
      )}

      {/* Eternity's Wake modal */}
      {showEternitysWake && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><EternitysWake
            onClose={() => setShowEternitysWake(false)}
          /></Suspense>
        </div>
      )}

      {/* Battleground of the Card-born */}
      {showBattleground && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><BattlegroundLobby onClose={() => setShowBattleground(false)} /></Suspense>
        </div>
      )}

      {/* Card-bound Co-op home */}
      {showCardBoundCoop && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><CardBoundCoopHub onClose={() => setShowCardBoundCoop(false)} /></Suspense>
        </div>
      )}

      {/* Infinitude modal */}
      {showInfinitude && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><Infinitude onClose={() => setShowInfinitude(false)} /></Suspense>
        </div>
      )}

      {/* Wished Upon A Star event page */}
      {showEventWuas && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'auto' }}>
          <Suspense fallback={null}>
            <WishedUponAStarEvent
              onClose={() => setShowEventWuas(false)}
              onCardStore={() => { setShowEventWuas(false); setShowCardStore(true); }}
              onEternitysWake={() => { setShowEventWuas(false); setShowEternitysWake(true); }}
            />
          </Suspense>
        </div>
      )}

      {/* Ascension hub modal */}
      {showAscension && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><AscensionHub onClose={() => setShowAscension(false)} /></Suspense>
        </div>
      )}

      {/* Boss result modal (victory / defeat) — only for non-null-raid fights */}
      {bossResultVisible && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 80, pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <Suspense fallback={null}><BossResultModal /></Suspense>
          </div>
        </div>
      )}

      {/* Null Raid results overlay */}
      {bossFight.kind === 'null_raid' && (bossFight.mode === 'victory' || bossFight.mode === 'defeat') && (
        <Suspense fallback={null}><NullRaidResults /></Suspense>
      )}

      {/* Emergency end turn removed — End Turn is now driven exclusively by
          the in-arena TurnControls (footer button); there is no keyboard
          shortcut for ending the turn. */}

      {/* Settings modal */}
      {showSettings && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><SettingsPanel
            onClose={() => setShowSettings(false)}
            onSave={() => engine.saveNow()}
            onWipe={() => engine.wipeData()}
            onExport={() => engine.exportSave()}
            onImport={(text) => engine.importSave(text)}
          /></Suspense>
        </div>
      )}

      {/* Tutorial modal */}
      {showTutorial && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 31, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><TutorialModal
            onClose={() => setShowTutorial(false)}
            onPlayTutorialTurn={(tier: NeutralityTutorialTier) => {
              setShowTutorial(false);
              useStore.getState().startTutorialTurn(tier);
              setScene('arena');
            }}
          /></Suspense>
        </div>
      )}

      {/* Player Information — unified profile + social + save-data screen */}
      {showPlayerInfo && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 32, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><PlayerInformationPage
            onClose={() => setShowPlayerInfo(false)}
            onSave={() => engine.saveNow()}
            onWipe={() => engine.wipeData()}
            onExport={() => engine.exportSave()}
            onImport={(text) => engine.importSave(text)}
          /></Suspense>
        </div>
      )}

      {/* Floating chat window (always-on once a conversation is open) */}
      <Suspense fallback={null}><ChatWindow /></Suspense>

      {showQuests && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 32, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><QuestsModal onClose={() => setShowQuests(false)} /></Suspense>
        </div>
      )}
      {showEnigma && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 32, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><EnigmaModal onClose={() => setShowEnigma(false)} /></Suspense>
        </div>
      )}
      {showAchievements && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 32, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><AchievementsModal onClose={() => setShowAchievements(false)} /></Suspense>
        </div>
      )}
      {showMastery && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 32, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><CardMasteryModal onClose={() => setShowMastery(false)} /></Suspense>
        </div>
      )}
      {showFracture && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 32, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><FractureModal onClose={() => setShowFracture(false)} /></Suspense>
        </div>
      )}

      {/* Daily login reward modal — z-index above other menus so it sits on top */}
      {showDailyReward && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><DailyRewardModal onClose={() => setShowDailyReward(false)} /></Suspense>
        </div>
      )}

      {/* Party overlay / invite banner */}
      {showPartyShell && !partyOverlayHidden && (
        <Suspense fallback={null}><PartyHub /></Suspense>
      )}

      <Suspense fallback={null}><PartyInviteModal /></Suspense>

      {/* Trial Deck summary modal */}
      {showTrialSummary && trialDeck.mode === 'active' && (
        <Suspense fallback={null}>
          <TrialDeckSummaryModal
            packName={
              (trialDeck.packId ? getTrialDeckDisplayName(trialDeck.packId) : null)
              ?? PACK_DEFINITIONS.find(p => p.id === trialDeck.packId)?.name.replace(/^\[EVENT\]\s*/, '')
              ?? (trialDeck.packId ?? 'Trial')
            }
            onConfirm={() => {
              setShowTrialSummary(false);
              useStore.getState().endTrialDeck();
              setScene('menu');
            }}
            onClose={() => setShowTrialSummary(false)}
          />
        </Suspense>
      )}

      {/* Autosave status indicator */}
      <div style={{
        position: 'absolute',
        left: 12,
        bottom: 12,
        zIndex: 75,
        pointerEvents: 'none',
        opacity: showAutosaveIndicator ? 1 : 0.4,
        transform: showAutosaveIndicator ? 'translateY(0)' : 'translateY(4px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        padding: '6px 10px',
        borderRadius: 8,
        border: `1px solid ${warmTheme.border}`,
        background: 'rgba(12,12,16,0.62)',
        color: warmTheme.textSoft,
        fontFamily: 'Georgia, serif',
        fontSize: 10,
        letterSpacing: 0.8,
      }}>
        {showAutosaveIndicator ? 'Autosaved' : 'Autosave active'}
      </div>

      </React.Fragment>
      {/* Splash + title screens sit above everything else on first boot. */}
      {scene === 'splash' && (
        <Suspense fallback={<BootLoadingFallback label="Loading Splash" />}>
          <SplashScreen onDone={() => setScene('title')} />
        </Suspense>
      )}
      {scene === 'title' && (
        <Suspense fallback={<BootLoadingFallback label="Loading Title" />}>
          <TitleScreen onAdvance={() => setScene('menu')} />
        </Suspense>
      )}
      <Suspense fallback={null}><ToastQueue /></Suspense>
      {/* Main menu radio — now-playing toast and control bar (home menu only, hidden when any submenu is open) */}
      {scene === 'menu' && !isMenuOpen && !hideRadioUi && (
        <>
          <Suspense fallback={null}><RadioNowPlaying nowPlaying={nowPlayingEvent} /></Suspense>
          <Suspense fallback={null}>
            <RadioControlBar
              placement="menu"
              radioActive={radioActive}
              paused={radioPaused}
              currentTrack={radioCurrentTrack}
              onPausedChange={setRadioPaused}
              onPause={() => MainMenuRadio.pause()}
              onResume={() => MainMenuRadio.resume()}
              onSkip={() => MainMenuRadio.skip()}
            />
          </Suspense>
        </>
      )}
      {/* Main turn radio — now-playing toast and control bar (arena, non-boss fights only) */}
      {scene === 'arena' && !inBossFight && !isMenuOpen && !hideRadioUi && (
        <>
          <Suspense fallback={null}><RadioNowPlaying nowPlaying={turnNowPlayingEvent} /></Suspense>
          <Suspense fallback={null}>
            <RadioControlBar
              placement="arena"
              radioActive={turnRadioActive}
              paused={turnRadioPaused}
              currentTrack={turnRadioCurrentTrack}
              onPausedChange={setTurnRadioPaused}
              onPause={() => MainTurnRadio.pause()}
              onResume={() => MainTurnRadio.resume()}
              onSkip={() => MainTurnRadio.skip()}
            />
          </Suspense>
        </>
      )}

      {/* Battleground PvP incoming invite — global, shown regardless of scene */}
      <Suspense fallback={null}><BattlegroundInviteModal /></Suspense>

      {/* Co-op raid incoming invite — global, shown regardless of scene */}
      <Suspense fallback={null}><CoopRaidInviteModal /></Suspense>

      {/* Eternity's Wake co-op boss incoming invite — global, shown regardless of scene */}
      <Suspense fallback={null}><EternityBossCoopInviteModal /></Suspense>

    </div>
  );
}

