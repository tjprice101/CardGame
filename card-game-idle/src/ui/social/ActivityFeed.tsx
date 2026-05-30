// ActivityFeed — Phase 5 social UI.
//
// Renders the user's own + friends' recent achievements. Mounted as a tab
// inside FriendsPanel.

import { useEffect, useMemo } from 'react';
import { warmTheme } from '@/ui/theme';
import {
  useActivityStore,
  selectActivityFeed,
  selectActivityLoading,
  selectActivityLoaded,
  selectActivityError,
  type ActivityEvent,
  type ActivityKind,
} from '@/state/activityStore';
import { useSocialStore, selectSocialStatus } from '@/state/socialStore';
import { useStore, selectProgress } from '@/state/store';
import { AVATAR_BY_ID, DEFAULT_AVATAR_ID } from '@/data/profile/avatars';
import { resolveTitleBadge } from '@/data/profile/titleBadges';
import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';
import { CardRegistry } from '@/cards/CardRegistry';

const BOSS_NAME_BY_ID = new Map<string, string>(
  BOSS_DEFINITIONS.map((b) => [b.id, b.name]),
);

function describe(event: ActivityEvent): string {
  const p = event.payload;
  switch (event.kind) {
    case 'boss_clear': {
      const bossId = String(p.bossId ?? '');
      const name = BOSS_NAME_BY_ID.get(bossId) ?? bossId;
      const total = Number(p.totalClears ?? 0);
      return total > 1
        ? `cleared ${name} (x${total})`
        : `cleared ${name} for the first time`;
    }
    case 'infinite_pull': {
      const defId = String(p.definitionId ?? '');
      const fallback = CardRegistry.get(defId)?.name ?? defId;
      const name = String(p.cardName ?? fallback);
      return `pulled an Infinite ${name}!`;
    }
    case 'gauntlet_best': {
      const depth = Number(p.depth ?? 0);
      const shards = Number(p.shards ?? 0);
      return `set a new Gauntlet best — depth ${depth}, ${shards} shards`;
    }
    case 'set_completion':
      return `completed the ${String(p.setName ?? 'a')} set`;
    case 'title_unlocked':
      return `unlocked the title "${String(p.title ?? 'Unknown')}"`;
    default:
      return event.kind;
  }
}

function kindColor(kind: ActivityKind): string {
  switch (kind) {
    case 'boss_clear': return '#9a5a45';
    case 'infinite_pull': return '#b88a2a';
    case 'gauntlet_best': return '#6a7a8c';
    case 'set_completion': return '#5a8a6a';
    case 'title_unlocked': return '#8c6aa0';
    default: return warmTheme.textMuted;
  }
}

function timeAgo(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const secs = Math.max(1, Math.round((Date.now() - t) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(t).toLocaleDateString();
}

export default function ActivityFeed() {
  const status = useSocialStore(selectSocialStatus);
  const feed = useActivityStore(selectActivityFeed);
  const loaded = useActivityStore(selectActivityLoaded);
  const loading = useActivityStore(selectActivityLoading);
  const error = useActivityStore(selectActivityError);
  const loadFeed = useActivityStore((s) => s.loadFeed);
  const connect = useActivityStore((s) => s.connectRealtime);
  const disconnect = useActivityStore((s) => s.disconnectRealtime);
  const progress = useStore(selectProgress);

  useEffect(() => {
    if (status !== 'authenticated') return;
    void loadFeed();
    connect();
    return () => disconnect();
  }, [status, loadFeed, connect, disconnect]);

  const items = useMemo(() => feed.slice(0, 50), [feed]);

  if (status !== 'authenticated') return null;
  if (!loaded && loading) return <div style={hint}>Loading feed…</div>;
  if (error) return <div style={{ ...hint, color: '#b86060' }}>{error}</div>;
  if (items.length === 0) {
    return <div style={hint}>No activity yet — play a match or clear a boss!</div>;
  }

  return (
    <ul style={list}>
      {items.map((event) => {
        const avatar = AVATAR_BY_ID[event.avatarId] ?? AVATAR_BY_ID[DEFAULT_AVATAR_ID];
        const badge = resolveTitleBadge(event.titleId, progress);
        return (
          <li key={event.id} style={row}>
            <div style={avatarChip}>{avatar?.glyph ?? '?'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={lineOne}>
                <span style={nameStyle}>{event.displayName}</span>
                {badge && (
                  <span style={titleChip}>{badge.text}</span>
                )}
              </div>
              <div style={lineTwo}>
                <span style={{ color: kindColor(event.kind), fontWeight: 'bold' }}>{describe(event)}</span>
              </div>
            </div>
            <div style={timeStyle}>{timeAgo(event.createdAt)}</div>
          </li>
        );
      })}
    </ul>
  );
}

const hint: React.CSSProperties = {
  fontSize: 10,
  color: warmTheme.textMuted,
  fontStyle: 'italic',
  padding: '4px 0',
};

const list: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  maxHeight: 360,
  overflowY: 'auto',
};

const row: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 8px',
  background: 'rgba(0,0,0,0.04)',
  border: `1px solid ${warmTheme.border}`,
  borderRadius: 6,
};

const avatarChip: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 16,
  background: warmTheme.accentSoft,
  border: `1px solid ${warmTheme.border}`,
  flexShrink: 0,
};

const lineOne: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 11,
};

const lineTwo: React.CSSProperties = {
  fontSize: 11,
  color: warmTheme.text,
  marginTop: 2,
};

const nameStyle: React.CSSProperties = {
  fontWeight: 'bold',
  color: warmTheme.text,
};

const titleChip: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: 1,
  textTransform: 'uppercase',
  color: warmTheme.textMuted,
};

const timeStyle: React.CSSProperties = {
  fontSize: 9,
  color: warmTheme.textMuted,
  flexShrink: 0,
};
