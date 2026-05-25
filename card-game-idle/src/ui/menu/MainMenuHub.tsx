import React, { useEffect, useState } from 'react';
import { warmTheme, uiTypography } from '@/ui/theme';
import { useStore, selectDeck, selectProfile, selectProgress, selectTurn } from '@/state/store';
import { t } from '@/ui/preferences';

interface MainMenuHubProps {
  onCardStore: () => void;
  onEternitysWake: () => void;
  onInfinitude: () => void;
  onDeckViewer: () => void;
  onTutorial: () => void;
  onDeckBuilder: () => void;
  onProfile: () => void;
  onQuests: () => void;
  onAchievements: () => void;
  onMastery: () => void;
  onArtifacts: () => void;
  onSettings: () => void;
  /** Opens the Wished Upon A Star event landing page. */
  onEventWishedUponAStar?: () => void;
  /** Triggered by the bottom CTA — caller starts the turn (store.beginTurn). */
  onBeginTurn: () => void;
}

type TileAccent = 'warm' | 'crimson' | 'cool' | 'verdant' | 'event';

interface MenuTile {
  label: string;
  caption: string;
  accent: TileAccent;
  onClick: () => void;
  disabled?: boolean;
}

function tileStyle(accent: TileAccent, disabled?: boolean): React.CSSProperties {
  const palettes: Record<TileAccent, { border: string; color: string; bg: string; glow: string }> = {
    warm: { border: 'rgba(214,162,94,0.55)', color: warmTheme.accentSoft, bg: 'rgba(34,22,14,0.72)', glow: '0 10px 28px rgba(214,162,94,0.18)' },
    crimson: { border: 'rgba(184,92,79,0.6)', color: '#f5b8af', bg: 'rgba(40,16,18,0.78)', glow: '0 10px 28px rgba(184,92,79,0.22)' },
    cool: { border: 'rgba(160,180,255,0.45)', color: '#d8d8f8', bg: 'rgba(14,14,30,0.82)', glow: '0 10px 28px rgba(120,140,255,0.18)' },
    verdant: { border: 'rgba(107,183,157,0.55)', color: '#9cefd6', bg: 'rgba(14,32,28,0.78)', glow: '0 10px 28px rgba(107,183,157,0.18)' },
    event: { border: 'rgba(184,200,232,0.75)', color: '#d6e4ff', bg: 'rgba(8,10,24,0.88)', glow: '0 0 40px rgba(160,190,255,0.28), 0 0 80px rgba(130,160,255,0.14)' },
  };
  const p = palettes[accent];
  return {
    flex: '1 1 180px',
    minWidth: 160,
    maxWidth: 230,
    padding: '18px 16px',
    border: `1px solid ${p.border}`,
    borderRadius: 14,
    background: p.bg,
    color: p.color,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: uiTypography.body,
    textAlign: 'left',
    boxShadow: p.glow,
    transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
    opacity: disabled ? 0.45 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
  };
}

/**
 * Central main-menu hub. Replaces the scattered top-right nav cluster and
 * deck-tools row that previously lived inside App.tsx. Presents the player
 * with a gacha-style menu: top status ribbon, central title, tile grid of
 * destinations, and a prominent Begin Turn CTA along the bottom.
 */
export default function MainMenuHub(props: MainMenuHubProps) {
  const deck = useStore(selectDeck);
  const profile = useStore(selectProfile);
  const progress = useStore(selectProgress);
  const turn = useStore(selectTurn);
  const noDecklist = deck.deckList.length === 0;
  const canBeginTurn = !noDecklist && turn.phase === 'idle';

  const [mounted, setMounted] = useState(false);
  useEffect(() => { const id = window.setTimeout(() => setMounted(true), 20); return () => window.clearTimeout(id); }, []);

  const eventTile: MenuTile | null = props.onEventWishedUponAStar
    ? { label: '✦ [EVENT] Wished Upon A Star ✦', caption: 'Limited event · Costs Aberrated Shards · Stellar Wish System', accent: 'event', onClick: props.onEventWishedUponAStar }
    : null;

  const tiles: MenuTile[] = [
    { label: t('cardStore'),    caption: 'Open card packs & pity', accent: 'warm',    onClick: props.onCardStore },
    { label: t('eternityWake'), caption: 'Boss fights & gauntlets', accent: 'crimson', onClick: props.onEternitysWake },
    { label: t('infinitude'),   caption: 'Endless ascension run',   accent: 'cool',    onClick: props.onInfinitude },
    { label: t('deckViewer'),   caption: 'Inspect your deck',       accent: 'warm',    onClick: props.onDeckViewer },
    { label: noDecklist ? `+ ${t('deckBuilder')}` : `Edit ${t('deckBuilder')}`, caption: 'Build & tune your deck', accent: 'warm', onClick: props.onDeckBuilder },
    { label: 'Profile',         caption: 'Avatars, titles, themes', accent: 'warm',    onClick: props.onProfile },
    { label: 'Quests',          caption: 'Daily & weekly goals',    accent: 'verdant', onClick: props.onQuests },
    { label: 'Achievements',    caption: 'Long-term rewards',       accent: 'warm',    onClick: props.onAchievements },
    { label: 'Mastery',         caption: 'Card mastery progress',   accent: 'warm',    onClick: props.onMastery },
    { label: 'Artifacts',       caption: 'Set relics & card dissolve', accent: 'verdant', onClick: props.onArtifacts },
    { label: t('tutorial'),         caption: 'How to play',             accent: 'verdant', onClick: props.onTutorial },
    { label: 'Settings',        caption: 'Audio, controls, more',   accent: 'warm',    onClick: props.onSettings },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 12,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 380ms ease',
        background: 'linear-gradient(180deg, rgba(8,5,3,0.35) 0%, rgba(8,5,3,0) 28%, rgba(8,5,3,0) 72%, rgba(8,5,3,0.55) 100%)',
      }}
    >
      {/* Top status ribbon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 22px',
          borderBottom: `1px solid ${warmTheme.border}`,
          background: 'rgba(14,9,6,0.55)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            aria-hidden="true"
            style={{
              width: 42, height: 42, borderRadius: '50%',
              border: `2px solid ${warmTheme.accentSoft}`,
              background: 'radial-gradient(circle at 35% 30%, #f5d196 0%, #8a5a2a 100%)',
              boxShadow: warmTheme.glow,
            }}
          />
          <div>
            <div style={{ fontFamily: uiTypography.display, fontSize: 14, color: warmTheme.accentSoft, letterSpacing: 1.4, textTransform: 'uppercase' }}>
              {profile.name || 'Acolyte'}
            </div>
            <div style={{ fontFamily: uiTypography.body, fontSize: 11, color: 'rgba(245,232,214,0.62)', letterSpacing: 0.6 }}>
              Cards Played {progress.totalCardsPlayed ?? 0} · Oblivion {Math.floor(progress.oblivion ?? 0).toLocaleString()}
            </div>
          </div>
        </div>
        <div style={{ fontFamily: uiTypography.display, fontSize: 18, letterSpacing: 5, color: '#f5e8d6', textTransform: 'uppercase', textShadow: '0 2px 12px rgba(214,162,94,0.45)' }}>
          Pantheon
        </div>
      </div>

      {/* Center tile grid */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          padding: '24px clamp(24px, 6vw, 96px)',
          overflow: 'auto',
        }}
      >
        {/* EVENT banner — full-width, oversized, star-shimmer */}
        {eventTile && (
          <button
            className="menu-tactile-btn wuas-event-shimmer"
            onClick={eventTile.onClick}
            style={{
              ...tileStyle('event'),
              flex: 'none',
              width: '100%',
              padding: '22px 28px',
              textAlign: 'center',
              fontSize: 20,
              letterSpacing: 2.4,
              border: '1px solid rgba(184,200,255,0.85)',
              boxShadow: '0 0 48px rgba(160,190,255,0.35), 0 0 100px rgba(130,160,255,0.18)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
          >
            <div style={{ fontFamily: uiTypography.display, fontSize: 20, letterSpacing: 2.4, textTransform: 'uppercase', marginBottom: 4, color: '#d6e4ff' }}>
              {eventTile.label}
            </div>
            <div style={{ fontFamily: uiTypography.body, fontSize: 12, letterSpacing: 0.6, opacity: 0.85, color: '#b0ccff' }}>
              {eventTile.caption}
            </div>
          </button>
        )}

        {/* Regular tile grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', alignContent: 'center' }}>
        {tiles.map((tile, i) => (
          <button
            key={i}
            className="menu-tactile-btn"
            onClick={tile.onClick}
            disabled={tile.disabled}
            style={tileStyle(tile.accent, tile.disabled)}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
          >
            <div style={{
              fontFamily: uiTypography.display,
              fontSize: 17,
              letterSpacing: 1.6,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}>
              {tile.label}
            </div>
            <div style={{
              fontFamily: uiTypography.body,
              fontSize: 11,
              letterSpacing: 0.4,
              opacity: 0.78,
            }}>
              {tile.caption}
            </div>
          </button>
        ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div
        style={{
          padding: '18px 22px 22px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          background: 'linear-gradient(180deg, rgba(14,9,6,0) 0%, rgba(14,9,6,0.75) 60%, rgba(14,9,6,0.95) 100%)',
        }}
      >
        {noDecklist && (
          <div style={{ fontFamily: uiTypography.body, fontSize: 12, color: warmTheme.danger, letterSpacing: 0.6 }}>
            Build a deck before beginning your turn.
          </div>
        )}
        <button
          className="menu-tactile-btn"
          onClick={props.onBeginTurn}
          disabled={!canBeginTurn}
          style={{
            padding: '16px 56px',
            borderRadius: 999,
            border: `2px solid ${canBeginTurn ? warmTheme.accentSoft : warmTheme.border}`,
            background: canBeginTurn ? warmTheme.button : 'rgba(60,42,28,0.5)',
            color: canBeginTurn ? warmTheme.accentDeep : warmTheme.textMuted,
            fontFamily: uiTypography.display,
            fontSize: 18,
            letterSpacing: 5,
            textTransform: 'uppercase',
            cursor: canBeginTurn ? 'pointer' : 'not-allowed',
            boxShadow: canBeginTurn ? '0 14px 40px rgba(214,162,94,0.45)' : 'none',
            transition: 'transform 160ms ease, box-shadow 160ms ease',
          }}
          onMouseEnter={(e) => { if (canBeginTurn) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
        >
          Begin Turn
        </button>
      </div>
    </div>
  );
}
