import React, { useEffect, useMemo, useState } from 'react';
import { uiTypography, type UiPalette } from '@/ui/theme';
import { useStore, selectDeck, selectProfile, selectProgress, selectTurn } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { getEverCollectionCount, getTotalPacksOpened } from '@/systems/progression/ownershipHistory';
import { resolveAvatar } from '@/data/profile/avatars';
import { resolveTitleBadge } from '@/data/profile/titleBadges';
import { DEFAULT_UI_THEME_ID, getEffectiveThemePalette, isThemeOscillating } from '@/data/profile/uiThemes';
import {
  DEFAULT_MAIN_MENU_BACKGROUND_ID,
  getDefaultMainMenuBackground,
  loadMainMenuBackgroundEntries,
  resolveMainMenuBackground,
  type MainMenuBackgroundEntry,
} from '@/data/profile/mainMenuBackgrounds';
import { formatCountdown, getCausalityEventCountdown, CAUSALITY_EVENT_ENDS_LABEL } from '@/ui/eventCausality/eventTimer';
import { t } from '@/ui/preferences';

interface MainMenuHubProps {
  initialSection?: MenuSection;
  onCardStore: () => void;
  onCardBoundCoop: () => void;
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
  /** Opens the Ascension endgame mode hub. */
  onAscension?: () => void;
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
} as const;

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
  'Every Seraphim carries a war the world forgot. Honor that.',
  'Divine Light is earned. Spend it as boldly as you dare.',
  'The Wake calls. Answer when you are strong enough to finish what you start.',
  'The infinite is not granted — it is played for, one card at a time.',
];

function pickDailyLine(seed: number): string {
  const day = Math.floor(Date.now() / 86_400_000);
  return ATMOSPHERE_LINES[(day + seed) % ATMOSPHERE_LINES.length];
}

/**
 * Glass-shard tile — each button is a translucent crystalline pane.
 * Arranged in a harmonious, high-contrast dashboard with responsive theme integration.
 */
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
  icon?: string;
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
        color: '#ffffff',
        captionColor: 'rgba(255,255,255,0.85)',
        textShadow: '0 2px 12px rgba(0,0,0,0.6)',
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
      className="menu-tactile-btn"
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
        opacity: props.disabled ? 0.38 : 1,
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
          btn.style.filter = 'brightness(1.15) saturate(1.2)';
          btn.style.transform = 'translateY(-2px)';
          btn.style.borderColor = theme.accentSoft;
          btn.style.boxShadow = `0 12px 30px rgba(0,0,0,0.6), 0 0 16px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.4)`;
        }
      }}
      onMouseLeave={(e) => {
        const btn = e.currentTarget;
        btn.style.filter = '';
        btn.style.transform = '';
        btn.style.borderColor = props.selected ? theme.accentSoft : palette.border;
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
          <span style={{ fontSize: props.size === 'hero' ? 20 : 14, color: theme.accentSoft, lineHeight: 1 }}>
            {props.icon}
          </span>
        )}
        <div style={{
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
          color: props.badge.tone === 'alert' ? '#ffffff' : props.badge.tone === 'gold' ? theme.accentDeep : theme.text,
          background: props.badge.tone === 'alert' ? theme.danger : props.badge.tone === 'gold' ? theme.accentSoft : theme.accent,
          boxShadow: theme.glow,
        }}>{props.badge.label}</div>
      )}
    </button>
  );
}

/** Small icon-button used in the top-left utility strip. */
function IconStripButton(props: { glyph: string; ariaLabel: string; onClick?: () => void; dot?: boolean; theme: UiPalette }) {
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
        fontSize: 16,
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

/** A resource counter pill in the top-right ribbon. */
function ResourcePill(props: { glyph: string; label: string; value: string; tone?: 'gold' | 'crimson' | 'cool'; theme: UiPalette }) {
  const t = props.tone ?? 'gold';
  const colors = t === 'crimson'
    ? { glyph: props.theme.danger, glow: props.theme.danger }
    : t === 'cool'
      ? { glyph: props.theme.accentSoft, glow: props.theme.accentSoft }
      : { glyph: props.theme.accent, glow: props.theme.accent };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 12px 6px 8px',
      borderRadius: 999,
      border: `1px solid ${props.theme.border}`,
      background: props.theme.surface,
      backdropFilter: 'blur(4px)',
      fontFamily: uiTypography.body,
      color: props.theme.text,
      letterSpacing: 0.6,
    }}>
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
    </div>
  );
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
  const turn = useStore(selectTurn);

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
  const ascensionLocked = ownedByRarity.Infinite < 5;

  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<MenuSection>(props.initialSection ?? 'play');
  const [focusedActionId, setFocusedActionId] = useState('begin-turn');
  const [themeNowMs, setThemeNowMs] = useState<number>(() => Date.now());
  const [eventNowMs, setEventNowMs] = useState<number>(() => Date.now());
  const [menuBackgroundChoices, setMenuBackgroundChoices] = useState<MainMenuBackgroundEntry[]>([getDefaultMainMenuBackground()]);
  useEffect(() => { const id = window.setTimeout(() => setMounted(true), 20); return () => window.clearTimeout(id); }, []);

  useEffect(() => {
    const id = window.setInterval(() => setEventNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const themeId = profile.uiThemeId || DEFAULT_UI_THEME_ID;
    if (!isThemeOscillating(themeId)) return;
    const id = setInterval(() => setThemeNowMs(Date.now()), 180);
    return () => clearInterval(id);
  }, [profile.uiThemeId]);

  useEffect(() => {
    let cancelled = false;
    void loadMainMenuBackgroundEntries().then((entries) => {
      if (cancelled) return;
      setMenuBackgroundChoices(entries);
    });
    return () => { cancelled = true; };
  }, []);

  const uiTheme = useMemo(
    () => getEffectiveThemePalette(
      profile.uiThemeId || DEFAULT_UI_THEME_ID,
      profile.customUiTheme,
      progress,
      themeNowMs,
    ),
    [profile.uiThemeId, profile.customUiTheme, progress, themeNowMs],
  );

  const mainMenuBackground = useMemo(
    () => resolveMainMenuBackground(
      profile.mainMenuBackgroundId ?? DEFAULT_MAIN_MENU_BACKGROUND_ID,
      menuBackgroundChoices,
    ),
    [profile.mainMenuBackgroundId, menuBackgroundChoices],
  );

  const shards = Math.floor(progress.aberratedShards ?? 0);
  const divineLight = Math.floor(progress.divineLight ?? 0);
  const cards = ownedCardCopies;
  const eventCountdown = formatCountdown(getCausalityEventCountdown(eventNowMs));

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
        id: 'coop', label: 'Card-bound Co-op', eyebrow: 'Multiplayer', icon: '◇',
        caption: 'Form a party and challenge synchronized boss encounters.', status: 'Online parties',
        art: MAIN_MENU_BANNER_ART.cardBoundCoop, onClick: props.onCardBoundCoop,
      },
      {
        id: 'garden', label: 'Garden of Cards', eyebrow: 'Expeditions', icon: '⌁',
        caption: 'Enter material expeditions, dungeons, and the Valley of Null.', status: 'Expedition hub',
        art: MAIN_MENU_BANNER_ART.gardenOfCards, onClick: props.onBattleground, tone: 'primary',
      },
      {
        id: 'ascension', label: 'Ascension', eyebrow: 'Endgame', icon: '△',
        caption: 'Face high-tier trials and pursue Transcendent rewards.',
        status: ascensionLocked ? `Requires 5 Infinite cards · ${ownedByRarity.Infinite}/5` : 'Available',
        art: MAIN_MENU_BANNER_ART.ascension, onClick: props.onAscension, disabled: ascensionLocked,
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
    ],
    progress: [
      {
        id: 'challenges', label: 'Challenges', eyebrow: 'Daily & Weekly', icon: '✓',
        caption: 'Complete rotating objectives for Divine Light and Shards.', status: 'Live objectives',
        art: MAIN_MENU_BANNER_ART.challenges, onClick: props.onQuests,
      },
      {
        id: 'achievements', label: 'Achievements', eyebrow: 'Milestones', icon: '◆',
        caption: 'Review permanent milestones and claim earned rewards.', status: 'Account progression',
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
        art: MAIN_MENU_BANNER_ART.cardMastery, onClick: props.onDailyCalendar,
      },
      {
        id: 'enigma', label: 'Enigma', eyebrow: 'Hidden Manuscripts', icon: '◈',
        caption: 'Discover manuscripts and complete their concealed trials.',
        status: enigmaLocked ? `Open card packs · ${totalPacksOpened}/10` : 'Manuscripts available',
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
  const sectionActions = menuSections[activeSection];
  const focusedAction = sectionActions.find(action => action.id === focusedActionId) ?? sectionActions[0];

  const selectSection = (section: MenuSection) => {
    setActiveSection(section);
    setFocusedActionId(menuSections[section][0].id);
  };

  return (
    <div
      className="main-menu-hub"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 12,
        pointerEvents: 'auto',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 420ms ease',
        // Full-bleed art with deep vignette so foreground UI reads clearly
        backgroundImage:
          'radial-gradient(120% 80% at 30% 40%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.78) 100%), '
          + 'linear-gradient(180deg, rgba(5,10,22,0.45) 0%, rgba(5,10,22,0) 22%, rgba(5,10,22,0) 70%, rgba(5,10,22,0.65) 100%), '
          + `url("${mainMenuBackground.imageUrl}")`,
        backgroundSize: 'cover, cover, cover',
        backgroundPosition: 'center, center, center',
      }}
    >
      {/* ───────── Top ribbon ───────── */}
      <div className="main-menu-topbar" style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 22px',
      }}>
        {/* Left: utility icon strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconStripButton glyph="⚙" ariaLabel="Settings" onClick={props.onSettings} theme={uiTheme} />
        </div>
        {/* Right: resource pills + clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontFamily: uiTypography.body, fontSize: 11, letterSpacing: 1.4,
            color: uiTheme.textSoft, textTransform: 'uppercase', marginRight: 6,
          }}>
            Pantheon
          </div>
          <ResourcePill glyph="◇" label="Cards" value={cards.toLocaleString()} tone="cool" theme={uiTheme} />
          <ResourcePill glyph="✦" label="Shards" value={shards.toLocaleString()} tone="crimson" theme={uiTheme} />
          <ResourcePill glyph="⬡" label="Divine Light" value={divineLight.toLocaleString()} tone="gold" theme={uiTheme} />
        </div>
      </div>

      {/* ───────── Left: identity card ───────── */}
      <div className="main-menu-identity" style={{
        position: 'absolute',
        left: 'clamp(20px, 3vw, 56px)',
        top: '38%',
        transform: 'translateY(-30%)',
        width: 'min(360px, 32vw)',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {/* Level halo + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 96, height: 96,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%',
            border: `2px solid ${uiTheme.borderStrong}`,
            background: uiTheme.surface,
            overflow: 'hidden',
          }}>
            {avatar.imageUrl
              ? <img
                  src={avatar.imageUrl}
                  alt={avatar.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  draggable={false}
                />
              : <div style={{
                  fontFamily: uiTypography.display, fontSize: 30, color: uiTheme.text, letterSpacing: 1,
                  textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                }} title={avatar.name}>
                  {avatar.glyph ?? '◈'}
                </div>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: uiTypography.display, fontSize: 22, letterSpacing: 1.4, color: uiTheme.text,
              textShadow: '0 2px 12px rgba(0,0,0,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {profile.name || 'Acolyte'}
            </div>
            {titleBadge && (
              <div style={{
                fontFamily: uiTypography.body, fontSize: 11, fontStyle: 'italic',
                color: uiTheme.accentSoft, letterSpacing: 0.6, textShadow: '0 1px 6px rgba(0,0,0,0.6)',
              }}>
                {titleBadge.text}
              </div>
            )}
            <div style={{
              fontFamily: uiTypography.body, fontSize: 10, letterSpacing: 1.4,
              color: uiTheme.textMuted, textTransform: 'uppercase', marginTop: 2,
            }}>
              Active Deck · {deck.deckList.length} cards
            </div>
          </div>
        </div>
        {/* Voiced line bubble */}
        <button
          onClick={props.onPlayerInfo}
          className="menu-tactile-btn"
          style={{
            textAlign: 'left',
            padding: '12px 16px',
            borderRadius: 4,
            border: `1px solid ${uiTheme.border}`,
            background: uiTheme.surfaceMuted,
            backdropFilter: 'blur(4px)',
            color: uiTheme.textSoft,
            fontFamily: uiTypography.body,
            fontSize: 13,
            fontStyle: 'italic',
            letterSpacing: 0.4,
            lineHeight: 1.45,
            cursor: 'pointer',
            boxShadow: uiTheme.shadow,
          }}
          title="Open Player Information"
        >
          “{dailyLine}”
        </button>
      </div>

      {/* ───────── Bottom-left: news / event banners ───────── */}
      <div className="main-menu-events" style={{
        position: 'absolute',
        left: 'clamp(20px, 3vw, 56px)',
        bottom: 'clamp(22px, 3vh, 38px)',
        display: 'flex', alignItems: 'flex-end', gap: 12,
        maxWidth: 'min(560px, 50vw)',
      }}>
        {props.onEventCausality && (
          <button
            className="menu-tactile-btn causality-event-shimmer"
            onClick={props.onEventCausality}
            style={{
              position: 'relative',
              width: 260,
              minHeight: 132,
              padding: '12px 16px 14px',
              borderRadius: 6,
              border: '1px solid rgba(138, 221, 255, 0.72)',
              backgroundImage: `linear-gradient(90deg, rgba(8,14,36,0.96) 0%, rgba(8,14,36,0.78) 62%, rgba(8,14,36,0.28) 100%), url("${MAIN_MENU_BANNER_ART.causalityEvent}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: '#eef4ff',
              fontFamily: uiTypography.body,
              textAlign: 'left',
              boxShadow: '0 14px 34px rgba(83, 176, 255, 0.25)',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: 8, left: 10,
              padding: '2px 7px', borderRadius: 3,
              background: 'rgba(255, 125, 185, 0.9)', color: '#fff',
              fontFamily: uiTypography.display, fontSize: 10, letterSpacing: 1.4,
            }}>LIMITED-TIME</div>
            <div style={{ marginTop: 22, fontFamily: uiTypography.display, fontSize: 18, letterSpacing: 1.6, textTransform: 'uppercase' }}>
              Causality
            </div>
            <div style={{ marginTop: 4, fontSize: 11, opacity: 0.82, letterSpacing: 0.6, color: 'rgba(214, 224, 248, 0.95)' }}>
              Stellar Wish Event · Spend Aberrated Shards
            </div>
            <div style={{ marginTop: 8, fontSize: 10, letterSpacing: 1, color: '#d7b7ff', fontFamily: uiTypography.display }}>
              Ends {CAUSALITY_EVENT_ENDS_LABEL}
            </div>
            <div style={{ marginTop: 3, fontSize: 12, letterSpacing: 1.1, color: '#8de6ff', fontFamily: uiTypography.display }}>
              {eventCountdown}
            </div>
            <div style={{
              position: 'absolute', bottom: 8, right: 12,
              fontFamily: uiTypography.display, fontSize: 10, letterSpacing: 1.4,
              color: '#8de6ff',
            }}>NEW ▶</div>
          </button>
        )}
      </div>

      {/* ───────── Right: focused command deck ───────── */}
      <div className="main-menu-command-deck" style={{
        position: 'absolute',
        right: 'clamp(20px, 3vw, 56px)',
        top: '82px',
        bottom: 'clamp(22px, 3vh, 38px)',
        width: 'min(650px, 52vw)',
        display: 'flex', flexDirection: 'column', gap: 12,
        padding: 14, boxSizing: 'border-box',
        border: `1px solid ${uiTheme.border}`, borderRadius: 8,
        background: `linear-gradient(155deg, ${uiTheme.surfaceStrong} 0%, ${uiTheme.surfaceMuted} 100%)`,
        backdropFilter: 'blur(16px) saturate(1.12)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.12)',
        boxShadow: '0 24px 70px rgba(0,0,0,0.52), inset 0 1px 0 rgba(255,255,255,0.14)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ color: uiTheme.textMuted, fontSize: 9, letterSpacing: 2.8, textTransform: 'uppercase' }}>Pantheon Navigation</div>
            <div style={{ color: uiTheme.text, fontFamily: uiTypography.display, fontSize: 19, letterSpacing: 1.2, marginTop: 3 }}>Command Deck</div>
          </div>
          <div role="tablist" aria-label="Main menu sections" style={{ display: 'flex', gap: 4, padding: 3, border: `1px solid ${uiTheme.border}`, background: 'rgba(0,0,0,0.2)', borderRadius: 7 }}>
            {([['play', 'Play'], ['collection', 'Collection'], ['progress', 'Progress']] as const).map(([section, label]) => (
              <button key={section} role="tab" aria-selected={activeSection === section} className="menu-tactile-btn" onClick={() => selectSection(section)} style={{
                padding: '7px 12px', borderRadius: 5,
                border: activeSection === section ? `1px solid ${uiTheme.borderStrong}` : '1px solid transparent',
                background: activeSection === section ? uiTheme.button : 'transparent',
                color: activeSection === section ? '#fff' : uiTheme.textMuted,
                fontFamily: uiTypography.display, fontSize: 10, letterSpacing: 1.1, cursor: 'pointer',
              }}>{label}</button>
            ))}
          </div>
        </div>

        <button key={focusedAction.id} className="menu-tactile-btn main-menu-feature" onClick={focusedAction.onClick} disabled={focusedAction.disabled} style={{
          position: 'relative', minHeight: 'clamp(150px, 24vh, 210px)', overflow: 'hidden',
          borderRadius: 7, border: `1px solid ${uiTheme.borderStrong}`,
          backgroundImage: `linear-gradient(90deg, rgba(5,7,14,0.96) 0%, rgba(5,7,14,0.78) 48%, rgba(5,7,14,0.22) 100%), linear-gradient(180deg, transparent 52%, rgba(3,4,9,0.9) 100%), url("${focusedAction.art}")`,
          backgroundSize: 'cover', backgroundPosition: 'center', color: '#fff', textAlign: 'left',
          padding: '20px 22px', cursor: focusedAction.disabled ? 'not-allowed' : 'pointer', opacity: focusedAction.disabled ? 0.68 : 1,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 14px 34px rgba(0,0,0,0.45)',
        }}>
          <div style={{ position: 'relative', zIndex: 1, width: '58%', minWidth: 240, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 9, color: uiTheme.accentSoft, letterSpacing: 2.4, textTransform: 'uppercase' }}>{focusedAction.eyebrow}</div>
            <div style={{ fontFamily: uiTypography.display, fontSize: 27, letterSpacing: 1.2, lineHeight: 1.05, marginTop: 7, textShadow: '0 3px 18px rgba(0,0,0,0.9)' }}>{focusedAction.label}</div>
            <div style={{ fontSize: 11, lineHeight: 1.5, color: 'rgba(255,255,255,0.78)', marginTop: 8 }}>{focusedAction.caption}</div>
            <div style={{ marginTop: 14, padding: '5px 9px', borderLeft: `2px solid ${uiTheme.accentSoft}`, background: 'rgba(0,0,0,0.38)', color: focusedAction.disabled ? 'rgba(255,255,255,0.58)' : uiTheme.accentSoft, fontSize: 10, letterSpacing: 0.7 }}>
              {focusedAction.disabled ? 'LOCKED · ' : ''}{focusedAction.status}
            </div>
          </div>
          <span aria-hidden style={{ position: 'absolute', right: 18, bottom: 14, fontSize: 22, color: 'rgba(255,255,255,0.75)' }}>{focusedAction.disabled ? '◇' : '→'}</span>
        </button>

        <div className="main-menu-action-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, overflowY: 'auto', paddingRight: 2 }}>
          {sectionActions.map(action => (
            <TileButton key={action.id} theme={uiTheme} label={action.label} caption={action.status} icon={action.icon} tone={action.tone ?? 'cream-dim'} size="small" onClick={action.onClick} disabled={action.disabled} selected={focusedAction.id === action.id} onPreview={() => setFocusedActionId(action.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
