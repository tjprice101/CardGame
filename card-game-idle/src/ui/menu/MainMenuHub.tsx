import React, { useEffect, useMemo, useState } from 'react';
import { warmTheme, uiTypography } from '@/ui/theme';
import { useStore, selectDeck, selectProfile, selectProgress, selectTurn } from '@/state/store';
import { resolveAvatar } from '@/data/profile/avatars';
import { resolveTitleBadge } from '@/data/profile/titleBadges';
import { t } from '@/ui/preferences';

interface MainMenuHubProps {
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
  onSettings: () => void;
  /** Opens the Wished Upon A Star event landing page. */
  onEventWishedUponAStar?: () => void;
  /** Opens the Battleground of the Card-born lobby. */
  onBattleground?: () => void;
  /** Opens the Ascension endgame mode hub. */
  onAscension?: () => void;
  /** Triggered by the hero tile — caller starts the turn (store.beginTurn). */
  onBeginTurn: () => void;
}

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
  'Patience is not waiting — it is building toward something inevitable.',
  'Every Seraphim carries a war the world forgot. Honor that.',
  'Oblivion is earned. Spend it as boldly as you dare.',
  'The Wake calls. Answer when you are strong enough to finish what you start.',
  'The infinite is not granted — it is played for, one card at a time.',
];

function pickDailyLine(seed: number): string {
  const day = Math.floor(Date.now() / 86_400_000);
  return ATMOSPHERE_LINES[(day + seed) % ATMOSPHERE_LINES.length];
}

/**
 * Glass-shard tile — each button is a translucent crystalline pane clipped
 * to an angular polygon.  When arranged side-by-side in the right cluster
 * the dark container gap acts as the "lead lines" of a stained-glass mosaic.
 */
function TileButton(props: {
  label: string;
  caption?: string;
  meta?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Tile color tone */
  tone?: 'primary' | 'cream' | 'cream-dim';
  /** Layout size preset */
  size?: 'hero' | 'wide' | 'half' | 'third' | 'small';
  art?: string;
  badge?: { label: string; tone?: 'alert' | 'info' | 'gold' };
  /** CSS clip-path polygon — creates the glass-shard edge. */
  clipPath?: string;
  /** Gradient angle (deg) — varies per tile so each pane refracts light differently. */
  glassAngle?: number;
}) {
  const isPrimary = props.tone === 'primary';
  const dim = props.tone === 'cream-dim';
  const ang = props.glassAngle ?? 128;

  // Each palette variant is a frosted glass pane.
  // Primary  — dense steel-blue glass (opaque hero / CTA)
  // Regular  — semi-frosted blue-white (most tiles)
  // Dim      — thin transparent glass (utility tiles)
  const palette = isPrimary
    ? {
        glass: [
          `linear-gradient(${ang}deg, rgba(42,140,205,0.94) 0%, rgba(22,100,162,0.84) 48%, rgba(68,165,222,0.92) 100%)`,
          'repeating-linear-gradient(62deg,  transparent 0px 20px, rgba(255,255,255,0.075) 20px 21px)',
          'repeating-linear-gradient(-58deg, transparent 0px 32px, rgba(255,255,255,0.055) 32px 33px)',
        ].join(', '),
        specular: 'rgba(200,238,255,0.62)',
        border: 'rgba(170,225,255,0.75)',
        color: '#eef8ff',
        captionColor: 'rgba(210,238,255,0.80)',
        textShadow: '0 1px 10px rgba(0,0,0,0.45)',
      }
    : dim
      ? {
          glass: [
            `linear-gradient(${ang}deg, rgba(155,205,245,0.55) 0%, rgba(118,178,232,0.40) 48%, rgba(190,225,252,0.52) 100%)`,
            'repeating-linear-gradient(62deg,  transparent 0px 20px, rgba(255,255,255,0.065) 20px 21px)',
            'repeating-linear-gradient(-58deg, transparent 0px 32px, rgba(255,255,255,0.048) 32px 33px)',
          ].join(', '),
          specular: 'rgba(235,248,255,0.42)',
          border: 'rgba(155,210,245,0.55)',
          color: '#ddf0ff',
          captionColor: 'rgba(195,228,252,0.75)',
          textShadow: '0 1px 8px rgba(0,10,40,0.55)',
        }
      : {
          glass: [
            `linear-gradient(${ang}deg, rgba(215,235,255,0.75) 0%, rgba(165,210,250,0.60) 48%, rgba(232,246,255,0.72) 100%)`,
            'repeating-linear-gradient(62deg,  transparent 0px 20px, rgba(255,255,255,0.075) 20px 21px)',
            'repeating-linear-gradient(-58deg, transparent 0px 32px, rgba(255,255,255,0.055) 32px 33px)',
          ].join(', '),
          specular: 'rgba(255,255,255,0.52)',
          border: 'rgba(185,225,255,0.68)',
          color: '#1a2535',
          captionColor: 'rgba(26,46,75,0.72)',
          textShadow: '0 1px 4px rgba(220,240,255,0.35)',
        };

  const dims: React.CSSProperties = props.size === 'hero'
    ? { minHeight: 100, padding: '12px 20px' }
    : props.size === 'wide'
      ? { minHeight: 60, padding: '8px 16px' }
      : props.size === 'small'
        ? { minHeight: 44, padding: '7px 12px' }
        : { minHeight: 68, padding: '8px 14px' };

  return (
    <button
      className="menu-tactile-btn"
      onClick={props.onClick}
      disabled={props.disabled}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 4,
        border: `1px solid ${palette.border}`,
        borderRadius: 0,
        background: palette.glass,
        backdropFilter: 'blur(8px) saturate(1.30) brightness(1.14)',
        WebkitBackdropFilter: 'blur(8px) saturate(1.30) brightness(1.14)',
        color: palette.color,
        fontFamily: uiTypography.body,
        textAlign: 'left',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.42 : 1,
        overflow: 'hidden',
        transition: 'filter 150ms ease, transform 150ms ease',
        clipPath: props.clipPath,
        width: '100%',
        boxSizing: 'border-box',
        ...dims,
      }}
      onMouseEnter={(e) => {
        if (!props.disabled) {
          (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.20) saturate(1.28)';
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.018)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.filter = '';
        (e.currentTarget as HTMLButtonElement).style.transform = '';
      }}
    >
      {/* Glass specular — bright top-edge light reflection */}
      <div aria-hidden style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '46%',
        background: `linear-gradient(180deg, ${palette.specular} 0%, transparent 100%)`,
        pointerEvents: 'none',
      }} />
      {/* Glass depth — bottom-edge shadow */}
      <div aria-hidden style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '28%',
        background: 'linear-gradient(0deg, rgba(0,8,24,0.26) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />
      {props.art && (
        <div aria-hidden style={{
          position: 'absolute', right: -6, top: -6, bottom: -6, width: '46%',
          backgroundImage: `url(${props.art})`,
          backgroundSize: 'cover', backgroundPosition: 'center right',
          opacity: 0.60,
          maskImage: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.85) 55%)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.85) 55%)',
        }} />
      )}
      <div style={{
        position: 'relative',
        fontFamily: uiTypography.display,
        fontSize: props.size === 'hero' ? 26 : props.size === 'small' ? 13 : 18,
        letterSpacing: props.size === 'small' ? 1.2 : 1.6,
        lineHeight: 1,
        textTransform: props.size === 'small' ? 'uppercase' : 'none',
        textShadow: palette.textShadow,
      }}>{props.label}</div>
      {props.caption && (
        <div style={{
          position: 'relative',
          fontSize: 10,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: palette.captionColor,
        }}>{props.caption}</div>
      )}
      {props.meta && (
        <div style={{ position: 'relative', marginTop: 4, fontSize: 11, opacity: 0.82 }}>{props.meta}</div>
      )}
      {props.badge && (
        <div style={{
          position: 'absolute', top: 8, right: 10,
          padding: '2px 7px',
          borderRadius: 2,
          fontFamily: uiTypography.display,
          fontSize: 11,
          letterSpacing: 0.6,
          backdropFilter: 'blur(4px)',
          color: props.badge.tone === 'alert' ? '#fff' : props.badge.tone === 'gold' ? '#1a2535' : '#eef8ff',
          background: props.badge.tone === 'alert' ? 'rgba(196,68,68,0.92)' : props.badge.tone === 'gold' ? 'rgba(210,178,100,0.92)' : 'rgba(36,128,192,0.92)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.50)',
        }}>{props.badge.label}</div>
      )}
    </button>
  );
}

/** Small icon-button used in the top-left utility strip. */
function IconStripButton(props: { glyph: string; ariaLabel: string; onClick?: () => void; dot?: boolean }) {
  return (
    <button
      className="menu-tactile-btn"
      aria-label={props.ariaLabel}
      onClick={props.onClick}
      style={{
        position: 'relative',
        width: 36, height: 36,
        borderRadius: 8,
        border: `1px solid ${warmTheme.border}`,
        background: 'rgba(10,18,36,0.60)',
        fontSize: 16,
        color: '#7dd4f8',
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
          background: '#e67c5c', boxShadow: '0 0 6px #e67c5c',
        }} />
      )}
    </button>
  );
}

/** A resource counter pill in the top-right ribbon. */
function ResourcePill(props: { glyph: string; label: string; value: string; tone?: 'gold' | 'crimson' | 'cool' }) {
  const t = props.tone ?? 'gold';
  const colors = t === 'crimson'
    ? { glyph: '#e89090', glow: 'rgba(196,90,90,0.4)' }
    : t === 'cool'
      ? { glyph: '#a8c8f0', glow: 'rgba(120,160,220,0.4)' }
      : { glyph: '#e8c478', glow: 'rgba(214,162,94,0.4)' };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 12px 6px 8px',
      borderRadius: 999,
      border: `1px solid ${warmTheme.border}`,
      background: 'rgba(8,16,32,0.68)',
      backdropFilter: 'blur(4px)',
      fontFamily: uiTypography.body,
      color: '#e8f2fc',
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => { const id = window.setTimeout(() => setMounted(true), 20); return () => window.clearTimeout(id); }, []);

  const shards = Math.floor(progress.aberratedShards ?? 0);
  const oblivion = Math.floor(progress.oblivion ?? 0);
  const cards = progress.totalCardsPlayed ?? 0;

  return (
    <div
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
          + `url(${import.meta.env.BASE_URL}assets/InfiniteCardsMenuArt.png)`,
        backgroundSize: 'cover, cover, cover',
        backgroundPosition: 'center, center, center',
      }}
    >
      {/* ───────── Top ribbon ───────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 22px',
      }}>
        {/* Left: utility icon strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconStripButton glyph="⚙" ariaLabel="Settings" onClick={props.onSettings} />
          <IconStripButton glyph="🏆" ariaLabel="Achievements" onClick={props.onAchievements} dot />
          <IconStripButton glyph="✦" ariaLabel="Card-born Tier" onClick={props.onMastery} />
          <IconStripButton glyph="📜" ariaLabel="Quests" onClick={props.onQuests} />
          <IconStripButton glyph="?" ariaLabel="Tutorial" onClick={props.onTutorial} />
        </div>
        {/* Right: resource pills + clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontFamily: uiTypography.body, fontSize: 11, letterSpacing: 1.4,
            color: 'rgba(210,232,252,0.78)', textTransform: 'uppercase', marginRight: 6,
          }}>
            Pantheon · Idle
          </div>
          <ResourcePill glyph="◇" label="Cards" value={cards.toLocaleString()} tone="cool" />
          <ResourcePill glyph="✦" label="Shards" value={shards.toLocaleString()} tone="crimson" />
          <ResourcePill glyph="⬡" label="Oblivion" value={oblivion.toLocaleString()} tone="gold" />
        </div>
      </div>

      {/* ───────── Left: identity card ───────── */}
      <div style={{
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
            border: '2px solid rgba(160,210,255,0.22)',
            background: 'rgba(10,18,36,0.60)',
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
                  fontFamily: uiTypography.display, fontSize: 30, color: '#eef4fc', letterSpacing: 1,
                  textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                }} title={avatar.name}>
                  {avatar.glyph ?? '◈'}
                </div>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: uiTypography.display, fontSize: 22, letterSpacing: 1.4, color: '#eef4fc',
              textShadow: '0 2px 12px rgba(0,0,0,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {profile.name || 'Acolyte'}
            </div>
            {titleBadge && (
              <div style={{
                fontFamily: uiTypography.body, fontSize: 11, fontStyle: 'italic',
                color: warmTheme.accentSoft, letterSpacing: 0.6, textShadow: '0 1px 6px rgba(0,0,0,0.6)',
              }}>
                {titleBadge.text}
              </div>
            )}
            <div style={{
              fontFamily: uiTypography.body, fontSize: 10, letterSpacing: 1.4,
              color: 'rgba(190,220,252,0.62)', textTransform: 'uppercase', marginTop: 2,
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
            border: `1px solid ${warmTheme.border}`,
            background: 'rgba(8,16,34,0.68)',
            backdropFilter: 'blur(4px)',
            color: 'rgba(220,240,255,0.88)',
            fontFamily: uiTypography.body,
            fontSize: 13,
            fontStyle: 'italic',
            letterSpacing: 0.4,
            lineHeight: 1.45,
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
          }}
          title="Open Player Information"
        >
          “{dailyLine}”
        </button>
      </div>

      {/* ───────── Bottom-left: news / event banners ───────── */}
      <div style={{
        position: 'absolute',
        left: 'clamp(20px, 3vw, 56px)',
        bottom: 'clamp(22px, 3vh, 38px)',
        display: 'flex', alignItems: 'flex-end', gap: 12,
        maxWidth: 'min(560px, 50vw)',
      }}>
        {props.onEventWishedUponAStar && (
          <button
            className="menu-tactile-btn wuas-event-shimmer"
            onClick={props.onEventWishedUponAStar}
            style={{
              position: 'relative',
              width: 260,
              minHeight: 110,
              padding: '12px 16px',
              borderRadius: 6,
              border: '1px solid rgba(184,200,255,0.55)',
              background: 'linear-gradient(135deg, rgba(36,28,68,0.92), rgba(14,16,40,0.92))',
              color: '#d6e4ff',
              fontFamily: uiTypography.body,
              textAlign: 'left',
              boxShadow: '0 10px 32px rgba(80,110,200,0.35), 0 0 60px rgba(130,160,255,0.18) inset',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: 8, left: 10,
              padding: '2px 7px', borderRadius: 3,
              background: '#c44444', color: '#fff',
              fontFamily: uiTypography.display, fontSize: 10, letterSpacing: 1.4,
            }}>LIMITED-TIME</div>
            <div style={{ marginTop: 22, fontFamily: uiTypography.display, fontSize: 18, letterSpacing: 1.6, textTransform: 'uppercase' }}>
              Wished Upon A Star
            </div>
            <div style={{ marginTop: 4, fontSize: 11, opacity: 0.78, letterSpacing: 0.6 }}>
              Stellar Wish Event · Spend Aberrated Shards
            </div>
            <div style={{
              position: 'absolute', bottom: 8, right: 12,
              fontFamily: uiTypography.display, fontSize: 10, letterSpacing: 1.4,
              color: '#f5d68a',
            }}>NEW ▶</div>
          </button>
        )}
        <button
          className="menu-tactile-btn"
          onClick={props.onPlayerInfo}
          style={{
            width: 150, minHeight: 52,
            padding: '10px 14px',
            borderRadius: 4,
            border: `1px solid ${warmTheme.border}`,
            background: 'rgba(10,18,36,0.82)',
            color: '#e8f2fc',
            fontFamily: uiTypography.display,
            fontSize: 14,
            letterSpacing: 1.4,
            textAlign: 'left',
            textTransform: 'uppercase',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div>Friends</div>
          <div style={{ fontFamily: uiTypography.body, fontSize: 10, letterSpacing: 0.6, opacity: 0.7, textTransform: 'none' }}>Open Player Info</div>
        </button>
        <button
          className="menu-tactile-btn"
          disabled
          onClick={undefined}
          aria-disabled="true"
          style={{
            width: 150, minHeight: 52,
            padding: '10px 14px',
            borderRadius: 4,
            border: '1px solid rgba(120,140,170,0.42)',
            background: 'rgba(10,18,36,0.55)',
            color: 'rgba(210,220,236,0.72)',
            fontFamily: uiTypography.display,
            fontSize: 12,
            letterSpacing: 1.4,
            textAlign: 'left',
            textTransform: 'uppercase',
            cursor: 'not-allowed',
            backdropFilter: 'blur(4px)',
            opacity: 0.7,
          }}
        >
          <div>Artifacts! Coming Soon</div>
          <div style={{ fontFamily: uiTypography.body, fontSize: 10, letterSpacing: 0.6, opacity: 0.7, textTransform: 'none' }}>Unavailable in this build</div>
        </button>
      </div>

      {/* ───────── Right: scattered glass shards ───────── */}
      {/*
        Container is fully transparent — no dark panel behind the tiles.
        Each wrapper div carries a drop-shadow (follows the clip-path shape)
        and a slight rotation so the shards look scattered rather than gridded.
      */}
      <div style={{
        position: 'absolute',
        right: 'clamp(20px, 3vw, 56px)',
        top: '78px',
        bottom: 'clamp(22px, 3vh, 38px)',
        width: 'min(640px, 52vw)',
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gridAutoRows: 'min-content',
        gap: 10,
        alignContent: 'start',
        background: 'transparent',
      }}>
        {/* Hero — Begin Turn */}
        <div style={{ gridColumn: '1 / -1', filter: 'drop-shadow(0 6px 20px rgba(0,20,60,0.55))' }}>
          <TileButton
            label="Begin Turn"
            caption={canBeginTurn ? 'Step into the arena' : 'Build a deck before beginning your turn.'}
            tone="primary"
            size="hero"
            onClick={props.onBeginTurn}
            disabled={!canBeginTurn}
            meta={canBeginTurn ? <span style={{ opacity: 0.85 }}>{deck.deckList.length} cards · ready to draw</span> : undefined}
            clipPath="polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 52px) 100%, 0 100%)"
            glassAngle={128}
          />
        </div>

        {/* Row: Eternity's Wake | Infinitude */}
        <div style={{ gridColumn: 'span 3', transform: 'rotate(-0.9deg)', filter: 'drop-shadow(0 5px 16px rgba(0,20,60,0.50))' }}>
          <TileButton
            label={t('eternityWake') || "Eternity's Wake"}
            caption="Boss challenges · Earn Eternals"
            size="half"
            onClick={props.onEternitysWake}
            clipPath="polygon(0 0, 100% 0, calc(100% - 16px) 100%, 0 100%)"
            glassAngle={118}
          />
        </div>
        <div style={{ gridColumn: 'span 3', transform: 'rotate(0.7deg)', filter: 'drop-shadow(0 5px 16px rgba(0,20,60,0.50))' }}>
          <TileButton
            label={t('infinitude') || 'Infinitude'}
            caption="Merge Eternals into Infinites"
            size="half"
            onClick={props.onInfinitude}
            clipPath="polygon(16px 0, 100% 0, 100% 100%, 0 100%)"
            glassAngle={142}
          />
        </div>

        {/* Row: Battleground of the Card-born */}
        <div style={{ gridColumn: '1 / -1', transform: 'rotate(-0.4deg)', filter: 'drop-shadow(0 5px 16px rgba(0,20,60,0.50))' }}>
          <TileButton
            label="Battleground of the Card-born"
            caption="3-min Oblivion race · PvP or CPU"
            tone="cream"
            size="wide"
            onClick={props.onBattleground}
            clipPath="polygon(0 0, 100% 0, calc(100% - 20px) 100%, 0 100%)"
            glassAngle={132}
          />
        </div>

        {/* Row: Ascension */}
        <div style={{ gridColumn: '1 / -1', transform: 'rotate(0.3deg)', filter: 'drop-shadow(0 5px 16px rgba(30,0,80,0.55))' }}>
          <TileButton
            label="Ascension"
            caption="Endgame · Null Raids · Transcendent Cards"
            tone="primary"
            size="wide"
            onClick={props.onAscension}
            clipPath="polygon(16px 0, 100% 0, 100% 100%, 0 100%)"
            glassAngle={145}
          />
        </div>

        {/* Row: Card Store | Deck Builder | Viewer */}
        <div style={{ gridColumn: 'span 6', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 10, background: 'transparent' }}>
          <div style={{ transform: 'rotate(0.5deg)', filter: 'drop-shadow(0 5px 16px rgba(0,20,60,0.52))' }}>
            <TileButton
              label={t('cardStore') || 'Store'}
              caption="Open card packs"
              tone="primary"
              size="wide"
              onClick={props.onCardStore}
              clipPath="polygon(0 0, 100% 0, calc(100% - 16px) 100%, 0 100%)"
              glassAngle={125}
            />
          </div>
          <div style={{ transform: 'rotate(-0.6deg)', filter: 'drop-shadow(0 5px 16px rgba(0,20,60,0.48))' }}>
            <TileButton
              label={noDecklist ? '+ Deck' : 'Edit Deck'}
              caption="Build & tune"
              tone="cream"
              size="wide"
              onClick={props.onDeckBuilder}
              clipPath="polygon(16px 0, 100% 0, calc(100% - 16px) 100%, 0 100%)"
              glassAngle={108}
            />
          </div>
          <div style={{ transform: 'rotate(0.8deg)', filter: 'drop-shadow(0 5px 16px rgba(0,20,60,0.46))' }}>
            <TileButton
              label="Viewer"
              caption="Inspect your deck"
              tone="cream-dim"
              size="wide"
              onClick={props.onDeckViewer}
              clipPath="polygon(16px 0, 100% 0, 100% 100%, 0 100%)"
              glassAngle={152}
            />
          </div>
        </div>

        {/* Row: Quests | Achievements | Mastery */}
        <div style={{ gridColumn: 'span 2', transform: 'rotate(-0.7deg)', filter: 'drop-shadow(0 5px 14px rgba(0,20,60,0.46))' }}>
          <TileButton
            label="Quests"
            caption="Daily & weekly goals"
            size="half"
            onClick={props.onQuests}
            clipPath="polygon(0 0, 100% 0, calc(100% - 16px) 100%, 0 100%)"
            glassAngle={120}
          />
        </div>
        <div style={{ gridColumn: 'span 2', transform: 'rotate(0.5deg)', filter: 'drop-shadow(0 5px 14px rgba(0,20,60,0.46))' }}>
          <TileButton
            label="Achievements"
            caption="Long-term rewards"
            size="half"
            onClick={props.onAchievements}
            clipPath="polygon(16px 0, 100% 0, calc(100% - 16px) 100%, 0 100%)"
            glassAngle={135}
          />
        </div>
        <div style={{ gridColumn: 'span 2', transform: 'rotate(-1.0deg)', filter: 'drop-shadow(0 5px 14px rgba(0,20,60,0.46))' }}>
          <TileButton
            label="Card-born Tier"
            caption="Card-born progression"
            size="half"
            onClick={props.onMastery}
            clipPath="polygon(16px 0, 100% 0, 100% 100%, 0 100%)"
            glassAngle={112}
          />
        </div>

        {/* Bottom utility row */}
        <div style={{ gridColumn: 'span 2', transform: 'rotate(0.6deg)', filter: 'drop-shadow(0 4px 12px rgba(0,20,60,0.42))' }}>
          <TileButton
            label="Player Info"
            caption="Profile · Social · Save"
            tone="cream-dim"
            size="small"
            onClick={props.onPlayerInfo}
            clipPath="polygon(0 0, 100% 0, calc(100% - 16px) 100%, 0 100%)"
            glassAngle={128}
          />
        </div>
        <div style={{ gridColumn: 'span 2', transform: 'rotate(-0.5deg)', filter: 'drop-shadow(0 4px 12px rgba(0,20,60,0.42))' }}>
          <TileButton
            label="Settings"
            caption="Audio · controls"
            tone="cream-dim"
            size="small"
            onClick={props.onSettings}
            clipPath="polygon(16px 0, 100% 0, calc(100% - 16px) 100%, 0 100%)"
            glassAngle={145}
          />
        </div>
        <div style={{ gridColumn: 'span 2', transform: 'rotate(0.8deg)', filter: 'drop-shadow(0 4px 12px rgba(0,20,60,0.42))' }}>
          <TileButton
            label="Tutorial"
            caption="How to play"
            tone="cream-dim"
            size="small"
            onClick={props.onTutorial}
            clipPath="polygon(16px 0, 100% 0, 100% 100%, 0 100%)"
            glassAngle={118}
          />
        </div>
      </div>
    </div>
  );
}
