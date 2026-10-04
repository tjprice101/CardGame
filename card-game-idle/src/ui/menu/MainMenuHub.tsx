import React, { useEffect, useMemo, useState } from 'react';
import { uiTypography, warmTheme, type UiPalette } from '@/ui/theme';
import { useStore, selectDeck, selectProfile, selectProgress, selectSettings, selectTurn } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { getEverCollectionCount, getTotalPacksOpened } from '@/systems/progression/ownershipHistory';
import { resolveAvatar } from '@/data/profile/avatars';
import { resolveTitleBadge } from '@/data/profile/titleBadges';
import {
  DEFAULT_MAIN_MENU_BACKGROUND_ID,
  getDefaultMainMenuBackground,
  loadMainMenuBackgroundEntries,
  resolveMainMenuBackground,
  type MainMenuBackgroundEntry,
} from '@/data/profile/mainMenuBackgrounds';
import { formatCountdown, getCausalityEventCountdown, CAUSALITY_EVENT_ENDS_LABEL } from '@/ui/eventCausality/eventTimer';
import { FORGE_EVENT_BOSS_IDS, FORGE_STREAK_MILESTONES, hasBeatenAllForgeEventBosses } from '@/data/forge/forgeDefinitions';
import { summarizeAchievements } from '@/systems/progression/achievements';
import { evaluateDailyLogin } from '@/systems/progression/dailyLogin';
import { listEnigmaDefinitions } from '@/systems/progression/EnigmaSystem';
import { isQuestComplete, refreshQuestRotation } from '@/systems/progression/quests';
import { DEFAULT_CONTROL_BINDINGS, type KeybindActionId } from '@/types/game';
import DivineLightAcquisitionScreen from '@/ui/hud/DivineLightAcquisitionScreen';
import GameEmblem from '@/ui/components/GameEmblem';
import { t } from '@/ui/preferences';

interface MainMenuHubProps {
  initialSection?: MenuSection;
  onCardStore: () => void;
  onEternitysWake: () => void;
  onInfinitude: () => void;
  onDeckViewer: () => void;
  onTutorial: () => void;
  onDeckBuilder: () => void;
  onPlayerInfo: () => void;
  onQuests: () => void;
  onAchievements: () => void;
  onMastery: () => void;
  onDailyCalendar: () => void;
  onFracture: () => void;
  onEnigma: () => void;
  onSettings: () => void;
  /** Opens the Causality event landing page. */
  onEventCausality?: () => void;
  /** Opens the Garden of Cards dungeon menu. */
  onBattleground?: () => void;
  /** Opens the Forge of Transcendence. */
  onForgeOfTranscendence?: () => void;
  /** Opens the Inventory screen (currencies, materials, collection stats). */
  onInventory?: () => void;
  /** Triggered by the hero tile — caller starts the turn (store.beginTurn). */
  onBeginTurn: () => void;
}

type MenuSection = 'play' | 'collection' | 'progress';

interface MenuAction {
  id: string;
  label: string;
  caption: string;
  eyebrow: string;
  icon: string;
  art: string;
  onClick?: () => void;
  disabled?: boolean;
  status?: string;
  badge?: { label: string; tone?: 'alert' | 'info' | 'gold' };
  tone?: 'primary' | 'cream' | 'cream-dim';
}

const menuAsset = (relativePath: string): string => `${import.meta.env.BASE_URL}assets/${relativePath.split('/').map(encodeURIComponent).join('/')}`;

const MAIN_MENU_BANNER_ART = {
  beginTurn: menuAsset('menu-banners/begin-turn.png'),
  eternitysWake: menuAsset('menu-banners/eternitys-wake.png'),
  cardBoundCoop: menuAsset('menu-banners/card-bound-coop.png'),
  gardenOfCards: menuAsset('menu-banners/garden-of-cards.png'),
  ascension: menuAsset('menu-banners/ascension.png'),
  cardStore: menuAsset('menu-banners/card-store.png'),
  deckBuilder: menuAsset('menu-banners/deck-builder.png'),
  deckViewer: menuAsset('menu-banners/deck-viewer.png'),
  infinitude: menuAsset('InfiniteCardsMenuArt.png'),
  fracture: menuAsset('menu-banners/fracture.png'),
  challenges: menuAsset('menu-banners/challenges.png'),
  achievements: menuAsset('menu-banners/achievements.png'),
  cardMastery: menuAsset('menu-banners/card-mastery.png'),
  enigma: menuAsset('menu-banners/enigma.png'),
  playerProfileFallback: menuAsset('menu-banners/player-profile.png'),
  howToPlay: menuAsset('menu-banners/how-to-play.png'),
  causalityEvent: menuAsset('event-art/causality/Causality Event Banner.png'),
  forgeOfTranscendence: menuAsset('forge/forge-of-transcendence-menu-banner.png'),
  inventory: menuAsset('menu-banners/card-mastery.png'),
} as const;

const EVENT_BANNER_DURATION_MS = 7_500;

/**
 * Daily atmosphere quote — refreshes by date so the same line lasts a day
 * but the screen still feels alive across sessions. Single source of truth
 * for the player-card "voiced line" bubble at the bottom-left.
 */
const ATMOSPHERE_LINES = [
  'May your draws fall true today, Acolyte.',
  'The pantheon stirs. Are you ready to listen?',
  'Some cards remember being played. Treat them kindly.',
  'A quiet turn is still a turn. Begin when you are ready.',
  'Even infinity bends to a patient hand.',
  'Old gods do not blink. Neither should you.',
  'A deck is a prayer arranged in order.',
  'Shuffle once for fortune. Twice for fate.',
  'The board remembers what the hand forgets.',
  'No spark is wasted on the willing.',
  'Light is not waiting — it is building toward the next decisive turn.',
  'Every awakened card carries a purpose the world forgot. Honor that.',
  'Divine Light is earned. Spend it as boldly as you dare.',
  'The Wake calls. Answer when you are strong enough to finish what you start.',
  'The infinite is not granted — it is played for, one card at a time.',
];

function pickDailyLine(seed: number): string {
  const day = Math.floor(Date.now() / 86_400_000);
  return ATMOSPHERE_LINES[(day + seed) % ATMOSPHERE_LINES.length];
}

function formatMenuShortcut(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code === 'Space') return 'Space';
  return code;
}

/**
 * Glass-shard tile — each button is a translucent crystalline pane.
 * Arranged in a harmonious, high-contrast dashboard with responsive theme integration.
 */
function LockedFeatureOverlay({ label, condition }: { label: string; condition: string }) {
  return (
    <span className="main-menu-lock-overlay">
      <span className="main-menu-lock-heading">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M7 10V7a5 5 0 0 1 10 0v3" />
          <rect x="4" y="10" width="16" height="12" rx="2" />
          <path d="M12 14v4" />
        </svg>
        <strong>{label} · Locked</strong>
      </span>
      <span className="main-menu-lock-condition">{condition}</span>
    </span>
  );
}

function TileButton(props: {
  label: string;
  caption?: string;
  meta?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  theme: UiPalette;
  /** Tile color tone */
  tone?: 'primary' | 'cream' | 'cream-dim';
  /** Layout size preset */
  size?: 'hero' | 'wide' | 'half' | 'third' | 'small';
  art?: string;
  badge?: { label: string; tone?: 'alert' | 'info' | 'gold' };
  /** Optional icon glyph */
  icon?: React.ReactNode;
  showCaption?: boolean;
  selected?: boolean;
  onPreview?: () => void;
}) {
  const isPrimary = props.tone === 'primary';
  const dim = props.tone === 'cream-dim';
  const theme = props.theme;

  const palette = isPrimary
    ? {
        glass: `linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 100%), ${theme.button}`,
        specular: 'rgba(255,255,255,0.48)',
        border: theme.borderStrong,
        color: theme.accentDeep,
        captionColor: theme.accentDeep,
        textShadow: 'none',
        boxShadow: `0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.35)`,
      }
    : dim
      ? {
          glass: `linear-gradient(145deg, ${theme.surfaceMuted} 0%, ${theme.surface} 100%)`,
          specular: 'rgba(255,255,255,0.22)',
          border: theme.border,
          color: theme.text,
          captionColor: theme.textMuted,
          textShadow: '0 1px 6px rgba(0,0,0,0.6)',
          boxShadow: `0 6px 18px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)`,
        }
      : {
          glass: `linear-gradient(145deg, ${theme.surfaceStrong} 0%, ${theme.surface} 100%)`,
          specular: 'rgba(255,255,255,0.32)',
          border: theme.borderStrong,
          color: theme.text,
          captionColor: theme.textSoft,
          textShadow: '0 1px 8px rgba(0,0,0,0.5)',
          boxShadow: `0 8px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.22)`,
        };

  const dims: React.CSSProperties = props.size === 'hero'
    ? { minHeight: 90, padding: '14px 22px' }
    : props.size === 'wide'
      ? { minHeight: 58, padding: '10px 18px' }
      : props.size === 'small'
        ? { minHeight: 46, padding: '8px 14px' }
        : { minHeight: 62, padding: '10px 16px' };

  return (
    <button
      className={`menu-tactile-btn${props.showCaption ? ' main-menu-show-caption' : ''}`}
      onClick={props.onClick}
      disabled={props.disabled}
      aria-pressed={props.selected}
      onFocus={props.onPreview}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 3,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: props.selected ? theme.accentSoft : palette.border,
        borderRadius: 7,
        background: palette.glass,
        backdropFilter: 'blur(10px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(10px) saturate(1.3)',
        color: palette.color,
        fontFamily: uiTypography.body,
        textAlign: 'left',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.78 : 1,
        overflow: 'hidden',
        boxShadow: props.selected ? `0 0 0 1px ${theme.glow}, 0 10px 28px rgba(0,0,0,0.52)` : palette.boxShadow,
        transition: 'transform 160ms ease, filter 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
        width: '100%',
        boxSizing: 'border-box',
        ...dims,
      }}
      onMouseEnter={(e) => {
        props.onPreview?.();
        if (!props.disabled) {
          const btn = e.currentTarget;
          btn.style.filter = 'brightness(1.08)';
          btn.style.borderColor = theme.accentSoft;
          btn.style.outline = `1px solid ${theme.accentSoft}`;
          btn.style.outlineOffset = '2px';
          btn.style.boxShadow = `0 12px 30px rgba(0,0,0,0.6), 0 0 16px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.4)`;
        }
      }}
      onMouseLeave={(e) => {
        const btn = e.currentTarget;
        btn.style.filter = '';
        btn.style.borderColor = props.selected ? theme.accentSoft : palette.border;
          btn.style.outline = '';
        btn.style.boxShadow = props.selected ? `0 0 0 1px ${theme.glow}, 0 10px 28px rgba(0,0,0,0.52)` : palette.boxShadow;
      }}
    >
      {/* Specular reflection */}
      <div aria-hidden style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '44%',
        background: `linear-gradient(180deg, ${palette.specular} 0%, transparent 100%)`,
        pointerEvents: 'none',
      }} />

      {/* Decorative Art backing if provided */}
      {props.art && (
        <div aria-hidden style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: '48%',
          backgroundImage: `url(${props.art})`,
          backgroundSize: 'cover', backgroundPosition: 'center right',
          opacity: 0.5,
          maskImage: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.9) 60%)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.9) 60%)',
        }} />
      )}

      {/* Header / Title */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        position: 'relative',
      }}>
        {props.icon && (
          <span style={{ fontSize: props.size === 'hero' ? 20 : 14, color: isPrimary ? palette.color : theme.accentSoft, lineHeight: 1 }}>
            {props.icon}
          </span>
        )}
        <div className={`ui-button-title${props.tone === 'primary' ? ' ui-button-title-on-light' : ''}`} style={{
          fontFamily: uiTypography.display,
          fontSize: props.size === 'hero' ? 24 : props.size === 'small' ? 13 : 17,
          letterSpacing: props.size === 'small' ? 1.2 : 1.5,
          lineHeight: 1.1,
          textTransform: props.size === 'small' ? 'uppercase' : 'none',
          textShadow: palette.textShadow,
          color: palette.color,
          flex: 1,
        }}>
          {props.label}
        </div>
      </div>

      {props.caption && (
        <div style={{
          position: 'relative',
          fontSize: 10,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: palette.captionColor,
          lineHeight: 1.3,
        }}>
          {props.caption}
        </div>
      )}

      {props.meta && (
        <div style={{ position: 'relative', marginTop: 3, fontSize: 11, opacity: 0.88 }}>{props.meta}</div>
      )}

      {props.badge && (
        <div style={{
          position: 'absolute', top: 8, right: 10,
          padding: '2px 8px',
          borderRadius: 4,
          fontFamily: uiTypography.display,
          fontSize: 10,
          letterSpacing: 0.8,
          backdropFilter: 'blur(4px)',
          color: props.badge.tone === 'alert' ? '#ffffff' : theme.accentDeep,
          background: props.badge.tone === 'alert' ? theme.danger : props.badge.tone === 'gold' ? theme.accentSoft : theme.accent,
          boxShadow: theme.glow,
        }}>{props.badge.label}</div>
      )}
      {props.disabled && <LockedFeatureOverlay label={props.label} condition={props.caption ?? 'Unavailable'} />}
    </button>
  );
}

/** Small icon-button used in the top-left utility strip. */
function IconStripButton(props: { glyph: React.ReactNode; ariaLabel: string; onClick?: () => void; dot?: boolean; theme: UiPalette }) {
  return (
    <button
      className="menu-tactile-btn"
      aria-label={props.ariaLabel}
      onClick={props.onClick}
      style={{
        position: 'relative',
        width: 36, height: 36,
        borderRadius: 8,
        border: `1px solid ${props.theme.border}`,
        background: props.theme.surfaceStrong,
        display: 'grid', placeItems: 'center',
        color: props.theme.accentSoft,
        cursor: 'pointer',
        backdropFilter: 'blur(4px)',
      }}
    >
      <span style={{ display: 'block', lineHeight: 1 }}>
        {props.glyph}
      </span>
      {props.dot && (
        <span style={{
          position: 'absolute', top: 4, right: 4,
          width: 7, height: 7, borderRadius: '50%',
          background: props.theme.danger, boxShadow: `0 0 6px ${props.theme.danger}`,
        }} />
      )}
    </button>
  );
}

function ProgressActionTile({ action, theme }: { action: MenuAction; theme: UiPalette }) {
  return (
    <button
      type="button"
      className="menu-tactile-btn main-menu-progress-tile"
      onClick={action.onClick}
      disabled={action.disabled}
      title={`${action.label}${action.status ? ` · ${action.status}` : ''}`}
      aria-label={`${action.label}${action.disabled ? `, Locked, ${action.status}` : action.badge ? `, ${action.badge.label} available` : ''}`}
    >
      <span className="main-menu-progress-hex" style={{ borderColor: theme.accent, color: theme.accentSoft, background: theme.surfaceMuted }}><GameEmblem id={action.id} size={28} /></span>
      <span className="main-menu-progress-label">{action.label}</span>
      {action.badge && <span className="main-menu-live-badge" aria-hidden="true">{action.badge.label}</span>}
      {action.disabled && <LockedFeatureOverlay label={action.label} condition={action.status!} />}
    </button>
  );
}

/** A resource counter pill in the top-right ribbon. */
function ResourcePill(props: { glyph: React.ReactNode; label: string; value: string; tone?: 'gold' | 'crimson' | 'cool'; theme: UiPalette; onClick?: () => void; showPlus?: boolean }) {
  const t = props.tone ?? 'gold';
  const colors = t === 'crimson'
    ? { glyph: props.theme.danger, glow: props.theme.danger }
    : t === 'cool'
      ? { glyph: props.theme.accentSoft, glow: props.theme.accentSoft }
      : { glyph: props.theme.accent, glow: props.theme.accent };
  const style: React.CSSProperties = {
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 12px 6px 8px',
      borderRadius: 999,
      border: `1px solid ${props.theme.border}`,
      background: props.theme.surface,
      backdropFilter: 'blur(4px)',
      fontFamily: uiTypography.body,
      color: props.theme.text,
      letterSpacing: 0.6,
      cursor: props.onClick ? 'pointer' : 'default',
      textAlign: 'left',
    };
  const contents = <>
      <span style={{
        width: 22, height: 22, borderRadius: 5,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: `radial-gradient(circle at 35% 30%, ${colors.glyph} 0%, transparent 75%)`,
        boxShadow: `0 0 8px ${colors.glow}`,
        fontSize: 12, color: colors.glyph,
      }} aria-hidden>{props.glyph}</span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontFamily: uiTypography.display, fontSize: 13, letterSpacing: 1, lineHeight: 1 }}>{props.value}</span>
        <span style={{ fontFamily: uiTypography.body, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.55, lineHeight: 1 }}>{props.label}</span>
      </span>
      {props.onClick && props.showPlus !== false && <span aria-hidden style={{ width: 20, height: 20, display: 'grid', placeItems: 'center', borderRadius: '50%', background: props.theme.surfaceMuted, border: `1px solid ${props.theme.border}`, color: props.theme.accentSoft, fontSize: 14, fontWeight: 700 }}>+</span>}
    </>;
  return props.onClick
    ? <button type="button" className="menu-tactile-btn" onClick={props.onClick} title={`Open ${props.label}`} style={style}>{contents}</button>
    : <div style={style}>{contents}</div>;
}

/**
 * Central main-menu hub — Arknights-style aesthetic. Layout zones:
 *   • Full-bleed painted background with dark vignette
 *   • Top status ribbon: utility icons (settings/alerts/mail/quests) + resource pills
 *   • Left identity card: level halo, avatar, name, ID, voiced atmosphere line
 *   • Bottom-left news strip: event banners + dailies
 *   • Right tile cluster: hero "Begin Turn" tile + asymmetric grid of destinations
 */
export default function MainMenuHub(props: MainMenuHubProps) {
  const deck = useStore(selectDeck);
  const profile = useStore(selectProfile);
  const progress = useStore(selectProgress);
  const settings = useStore(selectSettings);
  const turn = useStore(selectTurn);
  const controls: Record<KeybindActionId, string> = {
    ...DEFAULT_CONTROL_BINDINGS,
    ...(settings.controls ?? {}),
  };

  const noDecklist = deck.deckList.length === 0;
  const canBeginTurn = !noDecklist && turn.phase === 'idle';

  const avatar = useMemo(() => resolveAvatar(profile.avatarId, progress), [profile.avatarId, progress]);
  const titleBadge = useMemo(() => resolveTitleBadge(profile.titleId, progress), [profile.titleId, progress]);
  const dailyLine = useMemo(() => pickDailyLine(profile.name?.length ?? 0), [profile.name]);
  const ownedCardCopies = useMemo(
    () => Object.values(progress.collection ?? {}).reduce((sum, count) => sum + (count ?? 0), 0),
    [progress.collection],
  );
  const ownedByRarity = useMemo(() => {
    const counts = { Eternal: 0, Infinite: 0 };
    for (const [definitionId, copies] of Object.entries(progress.collection ?? {})) {
      const rarity = CardRegistry.get(definitionId)?.rarity;
      if (rarity === 'Eternal' || rarity === 'Infinite') counts[rarity] += copies ?? 0;
    }
    return counts;
  }, [progress.collection]);

  const uniqueEnigmaticsOwned = useMemo(() => {
    return CardRegistry.getAll().filter(
      card => card.rarity === 'Enigmatic' && getEverCollectionCount(progress, card.definitionId) > 0
    ).length;
  }, [progress]);

  const totalPacksOpened = useMemo(() => getTotalPacksOpened(progress), [progress]);

  const eternitysWakeLocked = uniqueEnigmaticsOwned < 3;
  const enigmaLocked = totalPacksOpened < 10;
  const infinitudeLocked = ownedByRarity.Eternal < 5;
  const forgeBossesCleared = useMemo(
    () => FORGE_EVENT_BOSS_IDS.filter(bossId => progress.bossCodex?.[bossId] !== undefined).length,
    [progress.bossCodex],
  );
  const forgeAllBossesCleared = hasBeatenAllForgeEventBosses(progress.bossCodex);
  const forgeUnlocked = progress.forgeOfTranscendenceUnlocked === true;
  const forgeLocked = !forgeUnlocked && !forgeAllBossesCleared;

  const [mounted, setMounted] = useState(false);
  const [showDivineLightReference, setShowDivineLightReference] = useState(false);
  const [eventSlide, setEventSlide] = useState(0);
  const [eventSlideStartedAtMs, setEventSlideStartedAtMs] = useState(() => Date.now());
  const [eventNowMs, setEventNowMs] = useState<number>(() => Date.now());
  const [menuBackgroundChoices, setMenuBackgroundChoices] = useState<MainMenuBackgroundEntry[]>([getDefaultMainMenuBackground()]);
  useEffect(() => { const id = window.setTimeout(() => setMounted(true), 20); return () => window.clearTimeout(id); }, []);

  useEffect(() => {
    const id = window.setInterval(() => setEventNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!props.onForgeOfTranscendence || !props.onEventCausality) return;
    const elapsedMs = Date.now() - eventSlideStartedAtMs;
    const remainingMs = Math.max(0, EVENT_BANNER_DURATION_MS - elapsedMs);
    const timeoutId = window.setTimeout(() => {
      setEventSlide(current => (current + 1) % 2);
      setEventSlideStartedAtMs(Date.now());
    }, remainingMs + 50);
    return () => window.clearTimeout(timeoutId);
  }, [eventSlideStartedAtMs, props.onForgeOfTranscendence, props.onEventCausality]);

  useEffect(() => {
    let cancelled = false;
    void loadMainMenuBackgroundEntries().then((entries) => {
      if (cancelled) return;
      setMenuBackgroundChoices(entries);
    }).catch(error => {
      if (!cancelled) console.warn('Could not load main menu backgrounds.', error);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const shortcuts: Array<[KeybindActionId, () => void]> = [
      ['mainMenuCardStore', props.onCardStore],
      ['mainMenuDeckBuilder', props.onDeckBuilder],
      ['mainMenuDailyCalendar', props.onDailyCalendar],
      ['mainMenuChallenges', props.onQuests],
      ['mainMenuBeginTurn', props.onBeginTurn],
    ];
    function onMenuShortcut(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[aria-modal="true"]')) return;
      const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
        || target?.tagName === 'SELECT' || target?.isContentEditable;
      if (e.defaultPrevented || e.repeat || e.ctrlKey || e.metaKey || e.altKey || isTyping) return;
      if (e.code === 'Enter' && target?.closest('button, a, [role="button"]')) return;
      const shortcut = shortcuts.find(([id]) => controls[id] === e.code);
      if (!shortcut) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      shortcut[1]();
    }
    window.addEventListener('keydown', onMenuShortcut, true);
    return () => window.removeEventListener('keydown', onMenuShortcut, true);
  }, [controls.mainMenuCardStore, controls.mainMenuDeckBuilder, controls.mainMenuDailyCalendar, controls.mainMenuChallenges, controls.mainMenuBeginTurn, props.onCardStore, props.onDeckBuilder, props.onDailyCalendar, props.onQuests, props.onBeginTurn]);

  const uiTheme = warmTheme;

  const mainMenuBackground = useMemo(
    () => resolveMainMenuBackground(
      profile.mainMenuBackgroundId ?? DEFAULT_MAIN_MENU_BACKGROUND_ID,
      menuBackgroundChoices,
      progress,
    ),
    [profile.mainMenuBackgroundId, menuBackgroundChoices, progress],
  );

  const shards = Math.floor(progress.aberratedShards ?? 0);
  const divineLight = Math.floor(progress.divineLight ?? 0);
  const cards = ownedCardCopies;
  const eventCountdown = formatCountdown(getCausalityEventCountdown(eventNowMs));
  const eventSlideProgress = Math.min(1, Math.max(0, (eventNowMs - eventSlideStartedAtMs) / EVENT_BANNER_DURATION_MS));
  const refreshedQuests = useMemo(() => refreshQuestRotation({
    daily: progress.quests.daily.map(quest => ({ ...quest })),
    weekly: progress.quests.weekly.map(quest => ({ ...quest })),
    lastDailyRollDay: progress.quests.lastDailyRollDay,
    lastWeeklyRollWeek: progress.quests.lastWeeklyRollWeek,
    superWeekly: progress.quests.superWeekly ? { ...progress.quests.superWeekly } : undefined,
    superWeeklies: progress.quests.superWeeklies?.map(challenge => ({ ...challenge })),
  }, eventNowMs), [progress.quests, eventNowMs]);
  const claimableQuestCount = [...refreshedQuests.daily, ...refreshedQuests.weekly]
    .filter(quest => !quest.claimed && isQuestComplete(quest)).length;
  const achievementSummary = summarizeAchievements(progress);
  const claimableAchievementCount = Math.max(0, achievementSummary.unlocked - achievementSummary.claimed);
  const claimableEnigmaCount = listEnigmaDefinitions().filter(definition => {
    const instance = progress.enigmas.instances[definition.id];
    return !!instance && instance.status !== 'locked' && instance.status !== 'completed'
      && definition.steps.slice(0, -1).every((_, index) => instance.stepsComplete[index]);
  }).length;
  const dailyLoginEvaluation = evaluateDailyLogin(progress);
  const claimableStreakMilestones = FORGE_STREAK_MILESTONES.filter(milestone =>
    (progress.dailyLogin.streak ?? 0) >= milestone.day && !progress.dailyLogin.claimedStreakMilestones?.includes(milestone.day),
  ).length;
  const calendarBadgeCount = Number(dailyLoginEvaluation.monthlyReward !== undefined) + claimableStreakMilestones;
  const badgeFor = (count: number): MenuAction['badge'] => count > 0 ? { label: String(count), tone: 'alert' } : undefined;

  const menuSections: Record<MenuSection, MenuAction[]> = {
    play: [
      {
        id: 'begin-turn', label: 'Begin Turn', eyebrow: 'Active Deck', icon: '▶',
        caption: canBeginTurn ? 'Take your current deck into the arena.' : 'Build a valid deck before entering the arena.',
        status: canBeginTurn ? `${deck.deckList.reduce((sum, entry) => sum + entry.copies, 0)} cards ready` : 'Deck required',
        art: MAIN_MENU_BANNER_ART.beginTurn, onClick: props.onBeginTurn, disabled: !canBeginTurn, tone: 'primary',
      },
      {
        id: 'eternitys-wake', label: t('eternityWake') || "Eternity's Wake", eyebrow: 'Boss Campaign', icon: '✦',
        caption: 'Challenge story bosses and claim their signature Eternal cards.',
        status: eternitysWakeLocked ? `Requires 3 Enigmatic cards · ${uniqueEnigmaticsOwned}/3` : 'Available',
        art: MAIN_MENU_BANNER_ART.eternitysWake,
        onClick: props.onEternitysWake, disabled: eternitysWakeLocked,
      },
      {
        id: 'garden', label: 'Garden of Cards', eyebrow: 'Expeditions', icon: '⌁',
        caption: 'Enter material expeditions, dungeons, and the Valley of Null.', status: 'Expedition hub',
        art: MAIN_MENU_BANNER_ART.gardenOfCards, onClick: props.onBattleground, tone: 'primary',
      },
    ],
    collection: [
      {
        id: 'store', label: t('cardStore') || 'Card Store', eyebrow: 'Acquire', icon: '◇',
        caption: 'Open packs and expand the possibilities of your collection.', status: `${shards.toLocaleString()} shards available`,
        art: MAIN_MENU_BANNER_ART.cardStore, onClick: props.onCardStore, tone: 'primary',
      },
      {
        id: 'deck-builder', label: noDecklist ? 'Create Deck' : 'Deck Builder', eyebrow: 'Construct', icon: '▤',
        caption: 'Build, tune, analyze, and equip abilities for your active deck.', status: noDecklist ? 'No active deck' : 'Active deck ready',
        art: MAIN_MENU_BANNER_ART.deckBuilder, onClick: props.onDeckBuilder,
      },
      {
        id: 'deck-viewer', label: 'Deck Viewer', eyebrow: 'Archive', icon: '▥',
        caption: 'Browse your complete deck library and saved configurations.', status: `${progress.savedDecks.length} saved deck${progress.savedDecks.length === 1 ? '' : 's'}`,
        art: MAIN_MENU_BANNER_ART.deckViewer, onClick: props.onDeckViewer,
      },
      {
        id: 'infinitude', label: t('infinitude') || 'Infinitude', eyebrow: 'Forge', icon: '∞',
        caption: 'Consume exact Eternal combinations to forge Infinite cards.',
        status: infinitudeLocked ? `Requires 5 Eternal cards · ${ownedByRarity.Eternal}/5` : 'Forge available',
        art: MAIN_MENU_BANNER_ART.infinitude, onClick: props.onInfinitude, disabled: infinitudeLocked,
      },
      {
        id: 'fracture', label: 'Card-light Resonance', eyebrow: 'Refine', icon: '✧',
        caption: 'Convert duplicate cards into focused Card-light progression.', status: 'Resonance fast-track',
        art: MAIN_MENU_BANNER_ART.fracture, onClick: props.onFracture,
      },
      {
        id: 'inventory', label: 'Inventory', eyebrow: 'Holdings', icon: '⬢',
        caption: 'Every currency, material, and collection stat you currently own.', status: 'Full holdings',
        art: MAIN_MENU_BANNER_ART.inventory, onClick: props.onInventory,
      },
    ],
    progress: [
      {
        id: 'challenges', label: 'Challenges', eyebrow: 'Daily & Weekly', icon: '✓',
        caption: 'Complete rotating objectives for Divine Light and Shards.', status: 'Live objectives',
        badge: badgeFor(claimableQuestCount),
        art: MAIN_MENU_BANNER_ART.challenges, onClick: props.onQuests,
      },
      {
        id: 'achievements', label: 'Achievements', eyebrow: 'Milestones', icon: '◆',
        caption: 'Review permanent milestones and claim earned rewards.', status: 'Account progression',
        badge: badgeFor(claimableAchievementCount),
        art: MAIN_MENU_BANNER_ART.achievements, onClick: props.onAchievements,
      },
      {
        id: 'mastery', label: 'Card Mastery', eyebrow: 'Card-born Tier', icon: '✦',
        caption: 'Track Card-light, tier milestones, Resonance, and Collection Power.', status: 'Permanent power',
        art: MAIN_MENU_BANNER_ART.cardMastery, onClick: props.onMastery,
      },
      {
        id: 'daily-calendar', label: 'Login Calendar', eyebrow: 'Monthly Rewards', icon: '▦',
        caption: 'Review every monthly reward and claim the next available day.', status: 'Open calendar',
        badge: badgeFor(calendarBadgeCount),
        art: MAIN_MENU_BANNER_ART.cardMastery, onClick: props.onDailyCalendar,
      },
      {
        id: 'enigma', label: 'Enigma', eyebrow: 'Hidden Manuscripts', icon: '◈',
        caption: 'Discover manuscripts and complete their concealed trials.',
        status: enigmaLocked ? `Open card packs · ${totalPacksOpened}/10` : 'Manuscripts available',
        badge: badgeFor(claimableEnigmaCount),
        art: MAIN_MENU_BANNER_ART.enigma, onClick: props.onEnigma, disabled: enigmaLocked,
      },
      {
        id: 'profile', label: 'Player Profile', eyebrow: 'Identity', icon: '◎',
        caption: 'Manage your profile, social presence, save, and visual themes.', status: titleBadge?.text ?? 'Wanderer',
        art: avatar.imageUrl ?? MAIN_MENU_BANNER_ART.playerProfileFallback, onClick: props.onPlayerInfo,
      },
      {
        id: 'tutorial', label: 'How to Play', eyebrow: 'Reference', icon: '?',
        caption: 'Review controls, card systems, combat, and progression rules.', status: 'Complete game guide',
        art: MAIN_MENU_BANNER_ART.howToPlay, onClick: props.onTutorial,
      },
    ],
  };
  const progressActions = menuSections.progress;
  const collectionActions = menuSections.collection;
  const beginTurnAction = menuSections.play.find(action => action.id === 'begin-turn')!;
  const playActions = ['garden', 'eternitys-wake']
    .map(id => menuSections.play.find(action => action.id === id))
    .filter((action): action is MenuAction => !!action);
  const menuShortcutLabels: Record<string, string> = {
    store: formatMenuShortcut(controls.mainMenuCardStore),
    'deck-builder': formatMenuShortcut(controls.mainMenuDeckBuilder),
    'daily-calendar': formatMenuShortcut(controls.mainMenuDailyCalendar),
    challenges: formatMenuShortcut(controls.mainMenuChallenges),
  };
  const beginTurnShortcut = formatMenuShortcut(controls.mainMenuBeginTurn);
  const enigmaAction = progressActions.find(action => action.id === 'enigma')!;
  const dailyHighlights = [
    {
      id: 'daily-calendar', label: 'Login reward', icon: '▦', onClick: props.onDailyCalendar,
      detail: calendarBadgeCount > 0 ? `${calendarBadgeCount} reward${calendarBadgeCount === 1 ? '' : 's'} ready` : 'Monthly and streak rewards',
      badge: calendarBadgeCount,
    },
    {
      id: 'challenges', label: 'Challenges', icon: '⚑', onClick: props.onQuests,
      detail: 'Daily and weekly objectives', badge: claimableQuestCount,
    },
    {
      id: 'enigma', label: 'Enigma', icon: '◈', onClick: props.onEnigma,
      detail: enigmaAction.status ?? 'Hidden manuscripts', badge: claimableEnigmaCount, disabled: enigmaAction.disabled,
    },
  ];

  return (
    <div
      className="main-menu-hub main-menu-reference-hub"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 12,
        pointerEvents: 'auto',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 420ms ease',
        ['--menu-accent' as any]: uiTheme.accent,
        ['--menu-accent-soft' as any]: uiTheme.accentSoft,
        ['--menu-accent-deep' as any]: uiTheme.accentDeep,
        ['--menu-border' as any]: uiTheme.border,
        ['--menu-border-strong' as any]: uiTheme.borderStrong,
        ['--menu-surface' as any]: uiTheme.surface,
        ['--menu-surface-strong' as any]: uiTheme.surfaceStrong,
        ['--menu-surface-muted' as any]: uiTheme.surfaceMuted,
        ['--menu-text' as any]: uiTheme.text,
        ['--menu-text-soft' as any]: uiTheme.textSoft,
        ['--menu-text-muted' as any]: uiTheme.textMuted,
        ['--menu-text-faint' as any]: uiTheme.textFaint,
        ['--menu-danger' as any]: uiTheme.danger,
        ['--menu-button' as any]: uiTheme.button,
        ['--menu-button-text' as any]: uiTheme.accentDeep,
        ['--menu-glow' as any]: uiTheme.glow,
        ['--menu-background-image' as any]: `url("${mainMenuBackground.imageUrl}")`,
      }}
    >
      <header className="main-menu-profile-zone">
        <h2 className="main-menu-section-heading">Identity</h2>
        <div className="main-menu-profile-row">
          <div className="main-menu-profile-avatar" title={avatar.name}>
            {avatar.imageUrl
              ? <img src={avatar.imageUrl} alt={avatar.name} draggable={false} />
              : <span>{avatar.glyph ?? '◈'}</span>}
          </div>
          <div className="main-menu-profile-copy">
            <strong>{profile.name || 'Acolyte'}</strong>
            {titleBadge && <em>{titleBadge.text}</em>}
            <small>Active deck · {deck.deckList.length} cards</small>
          </div>
          <IconStripButton glyph={<GameEmblem id="settings" size={20} />} ariaLabel="Settings" onClick={props.onSettings} theme={uiTheme} />
        </div>
        <button className="menu-tactile-btn main-menu-quote" onClick={props.onPlayerInfo} title="Open Player Information">
          “{dailyLine}”
        </button>
      </header>

      <section className="main-menu-resource-zone" aria-labelledby="main-menu-resources-heading">
        <h2 className="main-menu-section-heading" id="main-menu-resources-heading">Resources</h2>
        <div className="main-menu-resource-bar" aria-label="Current resources">
          <ResourcePill glyph={<GameEmblem id="cards" size={19} />} label="Cards" value={cards.toLocaleString()} tone="cool" theme={uiTheme} onClick={props.onCardStore} />
          <ResourcePill glyph={<GameEmblem id="aberrated-shards" size={19} />} label="Shards" value={shards.toLocaleString()} tone="crimson" theme={uiTheme} onClick={props.onCardStore} showPlus={false} />
          <ResourcePill glyph={<GameEmblem id="divine-light" size={19} />} label="Divine Light" value={divineLight.toLocaleString()} tone="gold" theme={uiTheme} onClick={() => setShowDivineLightReference(true)} />
        </div>
      </section>

      <nav className="main-menu-collection-rail" aria-label="Collection">
        <h2 className="main-menu-section-heading">Collection</h2>
        <div className="main-menu-collection-grid">
          {collectionActions.map(action => {
            const shortcut = menuShortcutLabels[action.id];
            return (
              <button
                key={action.id}
                type="button"
                className="main-menu-rail-action"
                onClick={action.onClick}
                disabled={action.disabled}
                title={`${action.label}${action.status ? ` · ${action.status}` : ''}`}
                aria-keyshortcuts={shortcut}
              >
                <span className="main-menu-rail-icon"><GameEmblem id={action.id} size={23} /></span>
                <span className="main-menu-rail-copy"><strong>{action.label}</strong><small>{action.status}</small></span>
                {shortcut && <kbd aria-hidden="true">{shortcut}</kbd>}
                {action.badge && <span className="main-menu-rail-badge" aria-label={`${action.badge.label} available`}>{action.badge.label}</span>}
                {action.disabled && <LockedFeatureOverlay label={action.label} condition={action.status!} />}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="main-menu-right-stack">
        <section className="main-menu-event-zone" aria-labelledby="main-menu-events-heading">
          <h2 id="main-menu-events-heading" className="main-menu-section-heading">Events</h2>
          {props.onForgeOfTranscendence && eventSlide === 0 && (
            <button
              type="button"
              className="main-menu-event-card main-menu-event-card-forge"
              onClick={props.onForgeOfTranscendence}
              disabled={forgeLocked}
              style={{ backgroundImage: `linear-gradient(180deg, rgba(8,7,14,0.05), rgba(8,7,14,0.9)), url("${MAIN_MENU_BANNER_ART.forgeOfTranscendence}")` }}
            >
              <span className="main-menu-event-tag">BEYOND ALL SETS</span>
              <strong>Forge of Transcendence</strong>
              <small>{forgeUnlocked ? 'A light with no allegiance.' : `Requires every event boss beaten · ${forgeBossesCleared}/${FORGE_EVENT_BOSS_IDS.length}`}</small>
              <em>{forgeUnlocked ? 'OPEN' : `${progress.keysOfTranscendence ?? 0} Keys of Transcendence`}</em>
              {forgeLocked && <LockedFeatureOverlay label="Forge of Transcendence" condition={`Requires every event boss beaten · ${forgeBossesCleared}/${FORGE_EVENT_BOSS_IDS.length}`} />}
            </button>
          )}
          {props.onEventCausality && eventSlide === 1 && (
            <button
              type="button"
              className="main-menu-event-card main-menu-event-card-causality"
              onClick={props.onEventCausality}
              style={{ backgroundImage: `linear-gradient(180deg, rgba(8,7,14,0.04), rgba(8,7,14,0.92)), url("${MAIN_MENU_BANNER_ART.causalityEvent}")` }}
            >
              <span className="main-menu-event-tag is-limited">LIMITED-TIME</span>
              <strong>Causality</strong>
              <small>Stellar Wish Event · Spend Aberrated Shards</small>
              <small>Ends {CAUSALITY_EVENT_ENDS_LABEL}</small>
              <em>{eventCountdown}</em>
            </button>
          )}
          {props.onForgeOfTranscendence && props.onEventCausality && (
            <>
              <div className="main-menu-event-carousel-controls" aria-label="Event banners">
                <button type="button" aria-label="Previous event banner" onClick={() => { setEventSlide(current => (current + 1) % 2); setEventSlideStartedAtMs(Date.now()); }}>‹</button>
                <div className="main-menu-event-slide-picks" role="group" aria-label="Choose event banner">
                  {[0, 1].map(index => (
                    <button key={index} type="button" aria-label={index === 0 ? 'Show Forge of Transcendence' : 'Show Causality'} aria-pressed={eventSlide === index} onClick={() => { setEventSlide(index); setEventSlideStartedAtMs(Date.now()); }}>
                    </button>
                  ))}
                </div>
                <span aria-live="polite">{eventSlide + 1} / 2</span>
                <button type="button" aria-label="Next event banner" onClick={() => { setEventSlide(current => (current + 1) % 2); setEventSlideStartedAtMs(Date.now()); }}>›</button>
              </div>
              <div className="main-menu-event-timer" role="progressbar" aria-label="Time until next event banner" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(eventSlideProgress * 100)}>
                <i key={eventSlideStartedAtMs} style={{ animationDuration: `${EVENT_BANNER_DURATION_MS}ms` }} />
              </div>
            </>
          )}
        </section>

        <section className="main-menu-progress-zone" aria-labelledby="main-menu-progress-heading">
          <h2 id="main-menu-progress-heading" className="main-menu-section-heading">Progress</h2>
          <div className="main-menu-progress-grid main-menu-reference-progress-grid">
            {progressActions.map(action => <ProgressActionTile key={action.id} action={action} theme={uiTheme} />)}
          </div>
        </section>
      </div>

      <div className="main-menu-status-zone">
        <span className="main-menu-autosave-status"><i />Autosave active</span>
        <small>Shortcuts: <kbd>{menuShortcutLabels.store}</kbd> Store · <kbd>{menuShortcutLabels['deck-builder']}</kbd> Builder · <kbd>{menuShortcutLabels['daily-calendar']}</kbd> Calendar · <kbd>{menuShortcutLabels.challenges}</kbd> Challenges</small>
      </div>

      <section className="main-menu-daily-zone" aria-labelledby="main-menu-daily-heading">
        <h2 className="main-menu-section-heading" id="main-menu-daily-heading">Daily</h2>
        <div className="main-menu-daily-highlights" aria-label="Daily highlights">
          {dailyHighlights.map(highlight => (
            <button key={highlight.id} type="button" className="main-menu-highlight" onClick={highlight.onClick} disabled={highlight.disabled}>
              <span className="main-menu-highlight-icon"><GameEmblem id={highlight.id} size={22} /></span>
              <span className="main-menu-highlight-copy"><strong>{highlight.label}</strong><small>{highlight.detail}</small></span>
              {highlight.badge > 0 && <span className="main-menu-highlight-badge">{highlight.badge}</span>}
              {highlight.disabled && <LockedFeatureOverlay label={highlight.label} condition={highlight.detail} />}
            </button>
          ))}
        </div>
      </section>

      <section className="main-menu-play-zone" aria-labelledby="main-menu-play-heading">
        <h2 id="main-menu-play-heading" className="main-menu-section-heading">Play</h2>
        <div className="main-menu-play-grid">
          <div className="main-menu-play-links">
            {playActions.map(action => <TileButton key={action.id} theme={uiTheme} label={action.label} caption={action.status} icon={<GameEmblem id={action.id} size={18} />} tone={action.tone ?? 'cream-dim'} size="small" onClick={action.onClick} disabled={action.disabled} badge={action.badge} showCaption={action.id === 'eternitys-wake' && action.disabled} />)}
          </div>
          <button type="button" className="menu-tactile-btn main-menu-begin-turn" onClick={beginTurnAction.onClick} disabled={beginTurnAction.disabled}>
            <span>Active deck · {beginTurnShortcut}</span>
            <strong><span className="ui-button-title ui-button-title-on-light">Begin Turn</span> <i aria-hidden="true">→</i></strong>
            <small>{beginTurnAction.status}</small>
          </button>
        </div>
      </section>

      {showDivineLightReference && <div className="main-menu-reference-overlay"><DivineLightAcquisitionScreen onClose={() => setShowDivineLightReference(false)} /></div>}
    </div>
  );
}
