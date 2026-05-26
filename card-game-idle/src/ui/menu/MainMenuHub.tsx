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
  onArtifacts: () => void;
  onSettings: () => void;
  /** Opens the Wished Upon A Star event landing page. */
  onEventWishedUponAStar?: () => void;
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
  "Even infinity bends to a patient hand.",
  'Old gods do not blink. Neither should you.',
  'A deck is a prayer arranged in order.',
  'Shuffle once for fortune. Twice for fate.',
  'The board remembers what the hand forgets.',
  'No spark is wasted on the willing.',
];

function pickDailyLine(seed: number): string {
  const day = Math.floor(Date.now() / 86_400_000);
  return ATMOSPHERE_LINES[(day + seed) % ATMOSPHERE_LINES.length];
}

/** A single cream-translucent tile in the Arknights-style right cluster. */
function TileButton(props: {
  label: string;
  caption?: string;
  meta?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Tile color tone — 'primary' is the blue hero CTA; others are cream. */
  tone?: 'primary' | 'cream' | 'cream-dim';
  /** Layout: 'wide' spans full row, 'half' takes 1fr, 'third' takes 1/3 etc. */
  size?: 'hero' | 'wide' | 'half' | 'third' | 'small';
  /** Optional right-aligned artwork (data URL or path). */
  art?: string;
  /** Small badge in the corner (e.g. "1" or "76"). */
  badge?: { label: string; tone?: 'alert' | 'info' | 'gold' };
}) {
  const isPrimary = props.tone === 'primary';
  const dim = props.tone === 'cream-dim';
  const palette = isPrimary
    ? { bg: 'linear-gradient(135deg, rgba(56,148,196,0.95), rgba(34,108,152,0.92))', color: '#f4fbff', border: 'rgba(180,220,240,0.55)', shadow: '0 10px 30px rgba(40,120,170,0.45)' }
    : dim
      ? { bg: 'linear-gradient(135deg, rgba(232,224,210,0.88), rgba(202,192,176,0.85))', color: '#3a2d1e', border: 'rgba(180,160,128,0.7)', shadow: '0 6px 18px rgba(0,0,0,0.35)' }
      : { bg: 'linear-gradient(135deg, rgba(248,242,230,0.95), rgba(228,218,198,0.92))', color: '#2c2317', border: 'rgba(214,196,160,0.75)', shadow: '0 8px 22px rgba(0,0,0,0.38)' };
  const dims: React.CSSProperties = props.size === 'hero'
    ? { minHeight: 132, padding: '18px 22px' }
    : props.size === 'wide'
      ? { minHeight: 78, padding: '14px 18px' }
      : props.size === 'small'
        ? { minHeight: 58, padding: '10px 14px' }
        : { minHeight: 96, padding: '14px 18px' };
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
        borderRadius: 6,
        background: palette.bg,
        color: palette.color,
        fontFamily: uiTypography.body,
        textAlign: 'left',
        boxShadow: palette.shadow,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.55 : 1,
        overflow: 'hidden',
        transition: 'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease',
        ...dims,
      }}
      onMouseEnter={(e) => { if (!props.disabled) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
    >
      {/* Faint background pattern — repeating chevrons */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, opacity: 0.07, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 18px, rgba(0,0,0,0.4) 18px 19px)',
      }} />
      {props.art && (
        <div aria-hidden style={{
          position: 'absolute', right: -6, top: -6, bottom: -6, width: '46%',
          backgroundImage: `url(${props.art})`,
          backgroundSize: 'cover', backgroundPosition: 'center right',
          opacity: 0.85,
          maskImage: 'linear-gradient(90deg, transparent 0%, #000 50%)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 50%)',
        }} />
      )}
      <div style={{
        position: 'relative',
        fontFamily: uiTypography.display,
        fontSize: props.size === 'hero' ? 30 : props.size === 'small' ? 14 : 22,
        letterSpacing: props.size === 'small' ? 1.2 : 1.6,
        lineHeight: 1,
        textTransform: props.size === 'small' ? 'uppercase' : 'none',
      }}>{props.label}</div>
      {props.caption && (
        <div style={{
          position: 'relative',
          fontSize: 10,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          opacity: 0.72,
        }}>{props.caption}</div>
      )}
      {props.meta && (
        <div style={{ position: 'relative', marginTop: 4, fontSize: 11, opacity: 0.85 }}>{props.meta}</div>
      )}
      {props.badge && (
        <div style={{
          position: 'absolute', top: 8, right: 10,
          padding: '2px 7px',
          borderRadius: 4,
          fontFamily: uiTypography.display,
          fontSize: 11,
          letterSpacing: 0.6,
          color: props.badge.tone === 'alert' ? '#fff' : props.badge.tone === 'gold' ? '#3a2d1e' : '#f4fbff',
          background: props.badge.tone === 'alert' ? 'rgba(196,68,68,0.95)' : props.badge.tone === 'gold' ? 'rgba(232,196,128,0.95)' : 'rgba(56,148,196,0.95)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
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
        background: 'rgba(20,14,10,0.55)',
        color: warmTheme.accentSoft,
        fontSize: 16,
        cursor: 'pointer',
        backdropFilter: 'blur(4px)',
      }}
    >
      {props.glyph}
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
      background: 'rgba(16,11,7,0.62)',
      backdropFilter: 'blur(4px)',
      fontFamily: uiTypography.body,
      color: '#f0e4d0',
      letterSpacing: 0.6,
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: 5,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: `radial-gradient(circle at 35% 30%, ${colors.glyph} 0%, transparent 75%)`,
        boxShadow: `0 0 8px ${colors.glow}`,
        fontSize: 12, color: colors.glyph,
      }} aria-hidden>{props.glyph}</span>
      <span style={{ fontFamily: uiTypography.display, fontSize: 13, letterSpacing: 1 }}>{props.value}</span>
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
          + 'linear-gradient(180deg, rgba(8,5,3,0.45) 0%, rgba(8,5,3,0) 22%, rgba(8,5,3,0) 70%, rgba(8,5,3,0.65) 100%), '
          + 'url(/assets/InfiniteCardsMenuArt.png)',
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
          <IconStripButton glyph="✦" ariaLabel="Mastery" onClick={props.onMastery} />
          <IconStripButton glyph="📜" ariaLabel="Quests" onClick={props.onQuests} />
          <IconStripButton glyph="?" ariaLabel="Tutorial" onClick={props.onTutorial} />
        </div>
        {/* Right: resource pills + clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontFamily: uiTypography.body, fontSize: 11, letterSpacing: 1.4,
            color: 'rgba(245,232,214,0.78)', textTransform: 'uppercase', marginRight: 6,
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
            position: 'relative',
            width: 96, height: 96,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 100 100" width={96} height={96} style={{ position: 'absolute', inset: 0 }}>
              <defs>
                <linearGradient id="lvl-ring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f5d68a" />
                  <stop offset="100%" stopColor="#b8854a" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="3" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="url(#lvl-ring)" strokeWidth="3"
                strokeDasharray={`${Math.min(99, ((cards % 100))) * 2.76} 999`}
                strokeLinecap="round" transform="rotate(-90 50 50)" />
            </svg>
            <div style={{
              fontFamily: uiTypography.display, fontSize: 30, color: '#f5e8d6', letterSpacing: 1,
              textShadow: '0 2px 12px rgba(0,0,0,0.6)',
            }} title={avatar.label}>
              {avatar.glyph ?? '◈'}
            </div>
            <div style={{
              position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
              padding: '2px 10px', borderRadius: 999,
              fontFamily: uiTypography.display, fontSize: 11, letterSpacing: 1.6,
              background: 'rgba(20,14,10,0.85)',
              border: `1px solid ${warmTheme.accentSoft}`,
              color: warmTheme.accentSoft,
            }}>LV {Math.min(99, Math.floor(cards / 100) + 1)}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: uiTypography.display, fontSize: 22, letterSpacing: 1.4, color: '#f5e8d6',
              textShadow: '0 2px 12px rgba(0,0,0,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {profile.name || 'Acolyte'}
            </div>
            {titleBadge && (
              <div style={{
                fontFamily: uiTypography.body, fontSize: 11, fontStyle: 'italic',
                color: warmTheme.accentSoft, letterSpacing: 0.6, textShadow: '0 1px 6px rgba(0,0,0,0.6)',
              }}>
                {titleBadge.label}
              </div>
            )}
            <div style={{
              fontFamily: uiTypography.body, fontSize: 10, letterSpacing: 1.4,
              color: 'rgba(245,232,214,0.55)', textTransform: 'uppercase', marginTop: 2,
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
            background: 'rgba(14,9,6,0.62)',
            backdropFilter: 'blur(4px)',
            color: 'rgba(245,232,214,0.88)',
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
            background: 'rgba(20,14,10,0.78)',
            color: '#f0e4d0',
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
          onClick={props.onArtifacts}
          style={{
            width: 150, minHeight: 52,
            padding: '10px 14px',
            borderRadius: 4,
            border: `1px solid ${warmTheme.border}`,
            background: 'rgba(20,14,10,0.78)',
            color: '#f0e4d0',
            fontFamily: uiTypography.display,
            fontSize: 14,
            letterSpacing: 1.4,
            textAlign: 'left',
            textTransform: 'uppercase',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div>Artifacts</div>
          <div style={{ fontFamily: uiTypography.body, fontSize: 10, letterSpacing: 0.6, opacity: 0.7, textTransform: 'none' }}>Set relics & dissolve</div>
        </button>
      </div>

      {/* ───────── Right: tile cluster ───────── */}
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
      }}>
        {/* Hero — Begin Turn (spans full width) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <TileButton
            label="Begin Turn"
            caption={canBeginTurn ? 'Step into the arena' : 'Build a deck before beginning your turn.'}
            tone="primary"
            size="hero"
            onClick={props.onBeginTurn}
            disabled={!canBeginTurn}
            meta={canBeginTurn ? <span style={{ opacity: 0.85 }}>{deck.deckList.length} cards · ready to draw</span> : undefined}
          />
        </div>

        {/* Row: Eternity's Wake | Infinitude */}
        <div style={{ gridColumn: 'span 3' }}>
          <TileButton label={t('eternityWake') || "Eternity's Wake"} caption="Boss challenges · Earn Eternals" size="half" onClick={props.onEternitysWake} />
        </div>
        <div style={{ gridColumn: 'span 3' }}>
          <TileButton label={t('infinitude') || 'Infinitude'} caption="Merge Eternals into Infinites" size="half" onClick={props.onInfinitude} />
        </div>

        {/* Row: Card Store (wide) split with Deck Builder / Deck Viewer */}
        <div style={{ gridColumn: 'span 6', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 10 }}>
          <TileButton label={t('cardStore') || 'Store'} caption="Open card packs" tone="primary" size="wide" onClick={props.onCardStore} />
          <TileButton label={noDecklist ? '+ Deck' : 'Edit Deck'} caption="Build & tune" tone="cream" size="wide" onClick={props.onDeckBuilder} />
          <TileButton label="Viewer" caption="Inspect your deck" tone="cream-dim" size="wide" onClick={props.onDeckViewer} />
        </div>

        {/* Row: Quests | Achievements | Mastery */}
        <div style={{ gridColumn: 'span 2' }}>
          <TileButton label="Quests" caption="Daily & weekly goals" size="half" onClick={props.onQuests} />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <TileButton label="Achievements" caption="Long-term rewards" size="half" onClick={props.onAchievements} />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <TileButton label="Mastery" caption="Per-card progression" size="half" onClick={props.onMastery} />
        </div>

        {/* Bottom utility row */}
        <div style={{ gridColumn: 'span 2' }}>
          <TileButton label="Player Info" caption="Profile · Social · Save" tone="cream-dim" size="small" onClick={props.onPlayerInfo} />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <TileButton label="Settings" caption="Audio · controls" tone="cream-dim" size="small" onClick={props.onSettings} />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <TileButton label="Tutorial" caption="How to play" tone="cream-dim" size="small" onClick={props.onTutorial} />
        </div>
      </div>
    </div>
  );
}
