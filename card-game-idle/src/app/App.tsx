import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import '@/styles/animations.css';
import { GameEngine } from '@/core/engine/GameEngine';
import HUD from '@/ui/hud/HUD';
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
const ProfilePage = lazy(() => import('@/ui/profile/ProfilePage'));
const DailyRewardModal = lazy(() => import('@/ui/profile/DailyRewardModal'));
const QuestsModal = lazy(() => import('@/ui/menus/QuestsModal'));
const AchievementsModal = lazy(() => import('@/ui/menus/AchievementsModal'));
const ArtifactsMenu = lazy(() => import('@/ui/artifacts/ArtifactsMenu'));
const CardMasteryModal = lazy(() => import('@/ui/menus/CardMasteryModal'));
const WakeTrialsModal = lazy(() => import('@/ui/menus/WakeTrialsModal'));
const EndlessGauntletModal = lazy(() => import('@/ui/menus/EndlessGauntletModal'));
const ToastQueue = lazy(() => import('@/ui/components/ToastQueue'));
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

/**
 * Top-level scene state machine. Splash plays once on app boot, advances
 * automatically (or on any key/click) to the title screen, then the player
 * advances to the menu hub. The menu hub is the home base between turns;
 * the arena scene is the active in-play layout (mulligan + playing phases
 * and any active boss fight).
 */
type AppScene = 'splash' | 'title' | 'menu' | 'arena';

const engine = new GameEngine();

const SUMMON_VIDEO_ROOT = '/assets/video/summons';

const SUMMON_VIDEO_BY_ANGEL: Record<string, string> = {
  'angel-neutral-beginning': 'the-beginning-and-the-end-summon.mp4',
  'angel-neutral-presence': 'aegisofpresenceSUMMON.mp4',
  'angel-neutral-equilibrium': 'aegisofequilibriumSUMMON.mp4',
  'angel-fire-cinderwing': 'cinderwingSUMMON.mp4',
  'angel-light-aurelion': 'aurelion thorncrownedSUMMON.mp4',
  'angel-light-solarius': 'solariusemberthornascendantSUMMON.mp4',
  'md-angel-ori9-broken-sleep': 'ori-9archonofbrokensleepSUMMON.mp4',
  'md-angel-thaumiel-prime': 'thaumielprimefurnaceofunwrittenfuturesSUMMON.mp4',
  'pa-angel-aurelith-ninth-beam': 'aurelithseeroftheninthbeamSUMMON.mp4',
  'btei-prismatic-blindwars-reliquary': 'reliquaryofblindwarsSUMMON.mp4',
  'btei-pyroabyss-hellrift-mandala': 'riftbellcatastropheSUMMON.mp4',
  'btei-thornbound-funeral-bramble': 'gravehedgereliquarySUMMON.mp4',
  'btei-neutrality-axiom-maw': 'axiommawSUMMON.mp4',
  'btei-light-halo-legion': 'halolegionprimeSUMMON.mp4',
  'btei-mech-reactor-paradigm': 'reactorpsalmengineSUMMON.mp4',
  'tbp-angel-irielle-bramble-gate': 'iriellethorn-saintofthelastroadSUMMON.mp4',
  'tbp-angel-velmora-harrowed-crown': 'velmoracrownofharrowedplainsSUMMON.mp4',
};

function getSummonVideoSrc(definitionId: string): string | null {
  const fileName = SUMMON_VIDEO_BY_ANGEL[definitionId];
  return fileName ? `${SUMMON_VIDEO_ROOT}/${encodeURIComponent(fileName)}` : null;
}
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const summonVideoRef = useRef<HTMLVideoElement>(null);
  const seenAngelsRef = useRef<Set<string>>(new Set());
  const hasSeenSaveRef = useRef(false);
  const [showDeckBuilder, setShowDeckBuilder] = useState(false);
  const [showCardStore, setShowCardStore] = useState(false);
  const [showDeckViewer, setShowDeckViewer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showEternitysWake, setShowEternitysWake] = useState(false);
  const [showInfinitude, setShowInfinitude] = useState(false);
  const [showEventWuas, setShowEventWuas] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showMastery, setShowMastery] = useState(false);
  const [showArtifacts, setShowArtifacts] = useState(false);
  const [showWakeTrials, setShowWakeTrials] = useState(false);
  const [showEndlessGauntlet, setShowEndlessGauntlet] = useState(false);
  const [showAutosaveIndicator, setShowAutosaveIndicator] = useState(false);
  const [showSummonCinematic, setShowSummonCinematic] = useState(false);
  const [summonVideoSrc, setSummonVideoSrc] = useState<string | null>(null);
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

  useEffect(() => {
    if (!canvasRef.current) return;
    engine.init(canvasRef.current).catch(console.error);
    return () => { engine.destroy(); };
  }, []);

  // Detect newly-unlocked titles and surface them as toast notifications. The
  // first run primes the ref silently so we don't spam toasts on every reload
  // for titles the player already owns.
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
    if (unlockedTitlesRef.current === null) {
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
  }, [progress]);

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
        useStore.getState().addOblivion(1_000_000);
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
        if (showProfile) { setShowProfile(false); e.preventDefault(); return; }
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
        const anyModalOpen = showTutorial || showSettings || showDeckViewer || showDeckBuilder || showCardStore || showInfinitude || showEternitysWake || showProfile || showDailyReward || showQuests || showAchievements || showMastery || showWakeTrials || showEndlessGauntlet || showEventWuas || showArtifacts;
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
  }, [showTutorial, showSettings, showDeckViewer, showDeckBuilder, showCardStore, showInfinitude, showEternitysWake, showProfile, showDailyReward, showQuests, showAchievements, showMastery, showWakeTrials, showEndlessGauntlet, showEventWuas, showArtifacts, settings.controls]);

  useEffect(() => {
    if (!hasSeenSaveRef.current) {
      hasSeenSaveRef.current = true;
      return;
    }
    setShowAutosaveIndicator(true);
    const timeout = window.setTimeout(() => setShowAutosaveIndicator(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [lastSavedAt]);

  useEffect(() => {
    const currentAngelIds = new Set<string>();
    for (const slot of board.frontSlots) {
      if (slot?.type === 'Angel') {
        currentAngelIds.add(slot.instanceId);
      }
    }

    for (const slot of board.frontSlots) {
      if (!slot || slot.type !== 'Angel') continue;
      if (seenAngelsRef.current.has(slot.instanceId)) continue;
      const videoSrc = getSummonVideoSrc(slot.definitionId);
      if (videoSrc) {
        setSummonVideoSrc(videoSrc);
        setShowSummonCinematic(true);
        break;
      }
    }

    seenAngelsRef.current = currentAngelIds;
  }, [board.frontSlots]);

  useEffect(() => {
    if (!showSummonCinematic || !summonVideoRef.current || !summonVideoSrc) return;
    summonVideoRef.current.playbackRate = 2.25;
    summonVideoRef.current.currentTime = 0;
    void summonVideoRef.current.play().catch(() => undefined);
  }, [showSummonCinematic, summonVideoSrc]);

  const idlePhase = turn.phase === 'idle';
  const inBossFight = bossFight.mode === 'active';
  const isMenuOpen = showDeckBuilder || showCardStore || showDeckViewer || showSettings || showTutorial || showEternitysWake || showInfinitude || showProfile || showQuests || showAchievements || showMastery || showWakeTrials || showEndlessGauntlet || showEventWuas || showArtifacts;

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
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
          <HUD />
        </div>
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
            onProfile={() => setShowProfile(true)}
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

      {/* Profile modal */}
      {showProfile && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 32, pointerEvents: 'auto' }}>
          <Suspense fallback={null}><ProfilePage onClose={() => setShowProfile(false)} /></Suspense>
        </div>
      )}

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

      {/* The Beginning and the End summon cinematic */}
      {showSummonCinematic && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 95,
          background: 'rgba(0,0,0,0.88)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
        }}>
          <video
            key={summonVideoSrc ?? 'summon-video'}
            ref={summonVideoRef}
            src={summonVideoSrc ?? undefined}
            style={{ width: 160, height: 220, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(255,255,255,0.22)', boxShadow: '0 0 40px rgba(255,255,255,0.15)' }}
            onEnded={() => {
              setShowSummonCinematic(false);
              setSummonVideoSrc(null);
            }}
            controls={false}
          />
          <button
            onClick={() => {
              setShowSummonCinematic(false);
              setSummonVideoSrc(null);
            }}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 96,
              padding: '8px 12px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.45)',
              background: 'rgba(15,15,22,0.65)',
              color: '#f6f2e9',
              cursor: 'pointer',
              letterSpacing: 0.8,
              fontSize: 11,
              fontFamily: 'Georgia, serif',
            }}
          >
            Skip
          </button>
        </div>
      )}

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
    </div>
  );
}

