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
const Infinitude = lazy(() => import('@/ui/infinitude/Infinitude'));
const WishedUponAStarEvent = lazy(() => import('@/ui/eventWishedUponAStar/WishedUponAStarEvent'));
const TutorialModal = lazy(() => import('@/ui/menus/TutorialModal'));
const PlayerInformationPage = lazy(() => import('@/ui/player/PlayerInformationPage'));
const DailyRewardModal = lazy(() => import('@/ui/profile/DailyRewardModal'));
const QuestsModal = lazy(() => import('@/ui/menus/QuestsModal'));
const AchievementsModal = lazy(() => import('@/ui/menus/AchievementsModal'));
const ArtifactsMenu = lazy(() => import('@/ui/artifacts/ArtifactsMenu'));
const CardMasteryModal = lazy(() => import('@/ui/menus/CardMasteryModal'));
const WakeTrialsModal = lazy(() => import('@/ui/menus/WakeTrialsModal'));
const EndlessGauntletModal = lazy(() => import('@/ui/menus/EndlessGauntletModal'));
const ChatWindow = lazy(() => import('@/ui/social/ChatWindow'));
const ToastQueue = lazy(() => import('@/ui/components/ToastQueue'));
const RadioNowPlaying = lazy(() => import('@/ui/components/RadioNowPlaying'));
const RadioControlBar = lazy(() => import('@/ui/components/RadioControlBar'));
const SplashScreen = lazy(() => import('@/ui/boot/SplashScreen'));
const TitleScreen = lazy(() => import('@/ui/boot/TitleScreen'));
const MainMenuHub = lazy(() => import('@/ui/menu/MainMenuHub'));
const ArenaShell = lazy(() => import('@/ui/hud/ArenaShell'));
import { warmTheme } from '@/ui/theme';
import { useStore, selectBoard, selectTurn, selectBossFight, selectSettings, selectProfile, selectProgress } from '@/state/store';
import { DEFAULT_CONTROL_BINDINGS } from '@/types/game';
import { getFontScale, setUiPreferences } from '@/ui/preferences';
import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';
import { evaluateDailyLogin } from '@/systems/progression/dailyLogin';
import { TITLE_BADGES } from '@/data/profile/titleBadges';
import { initStatsSync } from '@/social/statsSync';
import { initSocialNotifications } from '@/social/notificationsService';
import { MusicManager, type MusicTrackId } from '@/audio/MusicManager';
import { MainMenuRadio } from '@/audio/MainMenuRadio';
import type { NowPlayingEvent } from '@/ui/components/RadioNowPlaying';

/**
 * Top-level scene state machine. Splash plays once on app boot, advances
 * automatically (or on any key/click) to the title screen, then the player
 * advances to the menu hub. The menu hub is the home base between turns;
 * the arena scene is the active in-play layout (mulligan + playing phases
 * and any active boss fight).
 */
type AppScene = 'splash' | 'title' | 'menu' | 'arena';

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
  // Phase 5: install activity-event + leaderboard stats sync. Idempotent;
  // safely no-ops without Supabase or while signed out.
  useEffect(() => { initStatsSync(); }, []);
  // Phase 6: install desktop / in-app push notifications for DMs, gifts, and
  // friend requests. Idempotent; channels start/stop with auth status.
  useEffect(() => { initSocialNotifications(); }, []);
  const [showDeckBuilder, setShowDeckBuilder] = useState(false);
  const [showCardStore, setShowCardStore] = useState(false);
  const [showDeckViewer, setShowDeckViewer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showEternitysWake, setShowEternitysWake] = useState(false);
  const [showInfinitude, setShowInfinitude] = useState(false);
  const [showEventWuas, setShowEventWuas] = useState(false);
  const [showPlayerInfo, setShowPlayerInfo] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showMastery, setShowMastery] = useState(false);
  const [showArtifacts, setShowArtifacts] = useState(false);
  const [showWakeTrials, setShowWakeTrials] = useState(false);
  const [showEndlessGauntlet, setShowEndlessGauntlet] = useState(false);
  const [showAutosaveIndicator, setShowAutosaveIndicator] = useState(false);
  // Radio state
  const radioActiveRef = useRef(false);
  const nowPlayingEpochRef = useRef(0);
  const [nowPlayingEvent, setNowPlayingEvent] = useState<NowPlayingEvent | null>(null);
  const [radioPaused, setRadioPaused] = useState(false);
  const [radioActive, setRadioActive] = useState(false);
  const [radioCurrentTrack, setRadioCurrentTrack] = useState<import('@/audio/MainMenuRadio').RadioTrackInfo | null>(null);
  // Top-level scene state machine. Splash and title only display on the very
  // first boot of each app session; subsequent navigation cycles only between
  // menu and arena.
  const [scene, setScene] = useState<AppScene>('splash');
  const board = useStore(selectBoard);
  const turn = useStore(selectTurn);
  const bossFight = useStore(selectBossFight);
  const settings = useStore(selectSettings);
  const profile = useStore(selectProfile);
  const progress = useStore(selectProgress);
  const lastSavedAt = useStore(s => s.lastSavedAt);

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
    const vol = settings.musicVolume ?? 0;
    MusicManager.setVolume(vol);
    MainMenuRadio.setVolume(vol);
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
        if (bossFight.kind === 'gauntlet') {
          track = (bossFight.gauntletDepth ?? 0) >= 5 ? 'battle-gauntlet-p2' : 'battle-gauntlet-p1';
        } else if (bossFight.kind === 'trial') {
          track = 'battle-wake-trials';
        } else {
          track = 'battle-eternity';
        }
      } else if (showCardStore) {
        track = 'menu-shop';
      } else if (showInfinitude) {
        track = 'menu-infinitude';
      } else if (showArtifacts) {
        track = 'menu-artifacts';
      } else if (showEternitysWake || showEndlessGauntlet || showWakeTrials) {
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
    } else {
      if (radioActiveRef.current) {
        radioActiveRef.current = false;
        setRadioActive(false);
        MainMenuRadio.stop();
      }
      MusicManager.playTrack(track);
    }
  }, [
    scene,
    bossFight.mode,
    bossFight.kind,
    bossFight.gauntletDepth,
    showCardStore,
    showInfinitude,
    showArtifacts,
    showEternitysWake,
    showEndlessGauntlet,
    showWakeTrials,
    turn.phase,
  ]);
  // ─────────────────────────────────────────────────────────────────────

  // Apply UI theme palette in-place whenever the player switches themes or
  // edits custom colors. Re-mounts the overlay tree to flush stale style props.
  const [themeKey, setThemeKey] = useState(0);
  useEffect(() => {
    const progress = useStore.getState().progress;
    void import('@/data/profile/uiThemes').then(({ applyEffectiveTheme }) => {
      applyEffectiveTheme(profile.uiThemeId, profile.customUiTheme as Record<string, string> | null, progress);
      setThemeKey(k => k + 1);
    });
  }, [profile.uiThemeId, profile.customUiTheme]);

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

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const isTyping = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || tag === 'SELECT' || (e.target as HTMLElement | null)?.isContentEditable;

      if (e.code === 'Space' && !isTyping) {
        e.preventDefault();
        return;
      }

      if (isTyping) return;

      const controls = { ...DEFAULT_CONTROL_BINDINGS, ...(settings.controls ?? {}) };

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
        if (showArtifacts) { setShowArtifacts(false); e.preventDefault(); return; }
        if (showWakeTrials) { setShowWakeTrials(false); e.preventDefault(); return; }
        if (showEndlessGauntlet) { setShowEndlessGauntlet(false); e.preventDefault(); return; }
        if (showDailyReward) { setShowDailyReward(false); e.preventDefault(); return; }
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
        const anyModalOpen = showTutorial || showSettings || showDeckViewer || showDeckBuilder || showCardStore || showInfinitude || showEternitysWake || showPlayerInfo || showDailyReward || showQuests || showAchievements || showMastery || showWakeTrials || showEndlessGauntlet || showEventWuas || showArtifacts;
        if (anyModalOpen) return;
        const phase = useStore.getState().turn.phase;
        if (phase === 'playing' || phase === 'mulligan') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('hr-toggle-extra-deck'));
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showTutorial, showSettings, showDeckViewer, showDeckBuilder, showCardStore, showInfinitude, showEternitysWake, showPlayerInfo, showDailyReward, showQuests, showAchievements, showMastery, showWakeTrials, showEndlessGauntlet, showEventWuas, showArtifacts, settings.controls]);

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
  const isMenuOpen = showDeckBuilder || showCardStore || showDeckViewer || showSettings || showTutorial || showEternitysWake || showInfinitude || showPlayerInfo || showQuests || showAchievements || showMastery || showWakeTrials || showEndlessGauntlet || showEventWuas || showArtifacts;

  // Auto-sync scene to gameplay state once the player has reached the menu.
  // Entering an active turn or boss fight moves us into the arena; finishing
  // the turn returns us to the menu. Splash/title remain manual transitions.
  useEffect(() => {
    if (scene === 'splash' || scene === 'title') return;
    const inPlay = !idlePhase || inBossFight;
    if (inPlay && scene !== 'arena') setScene('arena');
    else if (!inPlay && scene !== 'menu') setScene('menu');
  }, [scene, idlePhase, inBossFight]);

  // Unified Eternity's Wake background overlay during any active boss fight (matches selection menu).
  const showBossBackdrop = inBossFight && BOSS_DEFINITIONS.some(b => b.id === bossFight.activeBossId);
  const ETERNITYS_WAKE_BG = 'radial-gradient(circle at 50% -8%, rgba(255, 108, 108, 0.22) 0%, rgba(255, 108, 108, 0) 35%), radial-gradient(circle at 18% 86%, rgba(149, 62, 95, 0.22) 0%, rgba(149, 62, 95, 0) 44%), repeating-linear-gradient(126deg, rgba(255, 130, 130, 0.08) 0px, rgba(255, 130, 130, 0.08) 1px, rgba(0, 0, 0, 0) 1px, rgba(0, 0, 0, 0) 24px), linear-gradient(180deg, rgba(8, 4, 12, 0.985) 0%, rgba(18, 9, 20, 0.985) 100%)';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: warmTheme.appBackground, color: warmTheme.text, overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      <React.Fragment key={`theme-${themeKey}`}>
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
      {!isMenuOpen && scene === 'arena' && <Suspense fallback={null}><BossFightArena /></Suspense>}

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

      {/* Main menu hub — replaces the legacy scattered top-right nav clusters. */}
      {!isMenuOpen && scene === 'menu' && !inBossFight && (
        <Suspense fallback={null}>
          <MainMenuHub
            onCardStore={() => setShowCardStore(true)}
            onEternitysWake={() => setShowEternitysWake(true)}
            onInfinitude={() => setShowInfinitude(true)}
            onEventWishedUponAStar={() => setShowEventWuas(true)}
            onDeckViewer={() => setShowDeckViewer(true)}
            onTutorial={() => setShowTutorial(true)}
            onDeckBuilder={() => setShowDeckBuilder(true)}
            onPlayerInfo={() => setShowPlayerInfo(true)}
            onQuests={() => setShowQuests(true)}
            onAchievements={() => setShowAchievements(true)}
            onMastery={() => setShowMastery(true)}
            onArtifacts={() => setShowArtifacts(true)}
            onSettings={() => setShowSettings(true)}
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
            onOpenWakeTrials={() => { setShowEternitysWake(false); setShowWakeTrials(true); }}
            onOpenEndlessGauntlet={() => { setShowEternitysWake(false); setShowEndlessGauntlet(true); }}
          /></Suspense>
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

      {/* Boss result modal (victory / defeat) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 40, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <Suspense fallback={null}><BossResultModal /></Suspense>
        </div>
      </div>

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
          <Suspense fallback={null}><TutorialModal onClose={() => setShowTutorial(false)} /></Suspense>
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
      {showArtifacts && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 32, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><ArtifactsMenu onClose={() => setShowArtifacts(false)} /></Suspense>
        </div>
      )}
      {showWakeTrials && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 32, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><WakeTrialsModal onClose={() => setShowWakeTrials(false)} /></Suspense>
        </div>
      )}
      {showEndlessGauntlet && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 32, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><EndlessGauntletModal onClose={() => setShowEndlessGauntlet(false)} /></Suspense>
        </div>
      )}

      {/* Daily login reward modal — z-index above other menus so it sits on top */}
      {showDailyReward && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><DailyRewardModal onClose={() => setShowDailyReward(false)} /></Suspense>
        </div>
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
        color: '#d6ead6',
        fontFamily: 'Georgia, serif',
        fontSize: 10,
        letterSpacing: 0.8,
      }}>
        {showAutosaveIndicator ? 'Autosaved' : 'Autosave active'}
      </div>

      </React.Fragment>
      {/* Splash + title screens sit above everything else on first boot. */}
      {scene === 'splash' && (
        <Suspense fallback={null}>
          <SplashScreen onDone={() => setScene('title')} />
        </Suspense>
      )}
      {scene === 'title' && (
        <Suspense fallback={null}>
          <TitleScreen onAdvance={() => setScene('menu')} />
        </Suspense>
      )}
      <Suspense fallback={null}><ToastQueue /></Suspense>
      {/* Main menu radio — now-playing toast (top-right corner) */}
      <Suspense fallback={null}><RadioNowPlaying nowPlaying={nowPlayingEvent} /></Suspense>
      {/* Main menu radio — control bar (bottom-right corner) */}
      <Suspense fallback={null}>
        <RadioControlBar
          radioActive={radioActive}
          paused={radioPaused}
          currentTrack={radioCurrentTrack}
          onPausedChange={setRadioPaused}
        />
      </Suspense>
    </div>
  );
}

