// FriendsLeaderboard — Phase 5 social UI.
//
// Fetches `profile_stats` rows for the authenticated user and all accepted
// friends, then ranks them by a chosen metric. Lightweight: a single SELECT
// on demand; no realtime channel (stats already upsert on transitions).
//
// Accepts an optional `metric` prop so endgame menus can show a focused board.

import { useEffect, useMemo, useState } from 'react';
import { warmTheme } from '@/ui/theme';
import { getSupabase } from '@/net/supabaseClient';
import { useSocialStore, selectSocialStatus } from '@/state/socialStore';
import {
  useFriendsStore,
  selectFriendsList,
  selectFriendsLoaded,
} from '@/state/friendsStore';
import { AVATAR_BY_ID, DEFAULT_AVATAR_ID } from '@/data/profile/avatars';

export type LeaderboardMetric =
  | 'infinitePulls'
  | 'eternityClearsTotal'
  | 'battlegroundWins'
  | 'battlegroundBestScore';

interface StatsRow {
  user_id: string;
  eternity_clears: Record<string, number> | null;
  infinite_pulls: number | null;
  battleground_wins: number | null;
  battleground_best_score: number | null;
}

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarId: string;
  isSelf: boolean;
  infinite: number;
  eternityTotal: number;
  battlegroundWins: number;
  battlegroundBestScore: number;
}

const METRIC_LABEL: Record<LeaderboardMetric, string> = {
  infinitePulls: 'Infinite Pulls',
  eternityClearsTotal: 'Eternity Clears',
  battlegroundWins: 'Battleground Wins',
  battlegroundBestScore: 'Battleground Score',
};

function metricValue(entry: LeaderboardEntry, metric: LeaderboardMetric): number {
  switch (metric) {
    case 'infinitePulls': return entry.infinite;
    case 'eternityClearsTotal': return entry.eternityTotal;
    case 'battlegroundWins': return entry.battlegroundWins;
    case 'battlegroundBestScore': return entry.battlegroundBestScore;
  }
}

function sumValues(record: Record<string, number> | null | undefined): number {
  if (!record) return 0;
  let n = 0;
  for (const v of Object.values(record)) n += v;
  return n;
}

interface Props {
  /** If provided, the metric selector is hidden. */
  metric?: LeaderboardMetric;
  /** Optional metric subset to expose in the selector. */
  metrics?: LeaderboardMetric[];
}

export default function FriendsLeaderboard({ metric: fixedMetric, metrics }: Props) {
  const status = useSocialStore(selectSocialStatus);
  const user = useSocialStore((s) => s.user);
  const ownProfile = useSocialStore((s) => s.profile);
  const friends = useFriendsStore(selectFriendsList);
  const friendsLoaded = useFriendsStore(selectFriendsLoaded);
  const load = useFriendsStore((s) => s.load);

  const [rows, setRows] = useState<StatsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<LeaderboardMetric>(
    fixedMetric ?? metrics?.[0] ?? 'infinitePulls',
  );

  const metric = fixedMetric ?? selectedMetric;
  const metricOptions = metrics ?? (
    ['infinitePulls', 'eternityClearsTotal', 'battlegroundWins', 'battlegroundBestScore'] as LeaderboardMetric[]
  );

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (!friendsLoaded) void load();
  }, [status, friendsLoaded, load]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const sb = getSupabase();
    if (!sb || !user) return;
    const ids = [user.id, ...friends.map((f) => f.other.id)];
    if (ids.length === 0) return;
    setLoading(true);
    setErrorMessage(null);
    let cancelled = false;
    void sb
      .from('profile_stats')
      .select('user_id, eternity_clears, infinite_pulls, battleground_wins, battleground_best_score')
      .in('user_id', ids)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setErrorMessage(error.message);
          setRows([]);
        } else {
          setRows((data ?? []) as StatsRow[]);
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [status, user, friends]);

  const entries: LeaderboardEntry[] = useMemo(() => {
    if (!user) return [];
    const friendById = new Map(friends.map((f) => [f.other.id, f.other]));
    const statsByUser = new Map(rows.map((r) => [r.user_id, r]));
    const all: LeaderboardEntry[] = [];

    function entryFor(
      id: string,
      isSelf: boolean,
      displayName: string,
      avatarId: string,
    ): LeaderboardEntry {
      const s = statsByUser.get(id);
      return {
        userId: id,
        displayName,
        avatarId,
        isSelf,
        infinite: s?.infinite_pulls ?? 0,
        eternityTotal: sumValues(s?.eternity_clears ?? null),
        battlegroundWins: s?.battleground_wins ?? 0,
        battlegroundBestScore: s?.battleground_best_score ?? 0,
      };
    }

    all.push(entryFor(
      user.id,
      true,
      ownProfile?.displayName ?? 'You',
      ownProfile?.avatarId ?? DEFAULT_AVATAR_ID,
    ));
    for (const [id, p] of friendById.entries()) {
      all.push(entryFor(id, false, p.displayName, p.avatarId));
    }
    all.sort((a, b) => metricValue(b, metric) - metricValue(a, metric));
    return all;
  }, [rows, friends, user, ownProfile, metric]);

  if (status !== 'authenticated') {
    return <div style={hint}>Sign in to compare with friends.</div>;
  }

  return (
    <div>
      {!fixedMetric && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
          {metricOptions.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMetric(m)}
              style={m === metric ? metricBtnActive : metricBtn}
            >
              {METRIC_LABEL[m]}
            </button>
          ))}
        </div>
      )}

      {errorMessage && (
        <div style={{ fontSize: 10, color: '#b86060', marginBottom: 6 }}>{errorMessage}</div>
      )}
      {loading && entries.length === 0 && <div style={hint}>Loading…</div>}
      {!loading && entries.length === 0 && <div style={hint}>No data yet.</div>}

      <ol style={list}>
        {entries.map((e, i) => {
          const avatar = AVATAR_BY_ID[e.avatarId] ?? AVATAR_BY_ID[DEFAULT_AVATAR_ID];
          const value = metricValue(e, metric);
          return (
            <li key={e.userId} style={{
              ...row,
              ...(e.isSelf ? rowSelfMix : null),
            }}>
              <div style={rankStyle}>#{i + 1}</div>
              <div style={avatarChip}>{avatar?.glyph ?? '?'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={nameStyle}>
                  {e.displayName}{e.isSelf && <span style={selfChip}>YOU</span>}
                </div>
                {metric === 'eternityClearsTotal' && (
                  <div style={subtle}>infinite {e.infinite}</div>
                )}
                {metric === 'infinitePulls' && (
                  <div style={subtle}>eternity {e.eternityTotal}</div>
                )}
                {metric === 'battlegroundWins' && (
                  <div style={subtle}>best score {e.battlegroundBestScore.toLocaleString()}</div>
                )}
                {metric === 'battlegroundBestScore' && (
                  <div style={subtle}>wins {e.battlegroundWins}</div>
                )}
              </div>
              <div style={valStyle}>{value.toLocaleString()}</div>
            </li>
          );
        })}
      </ol>
    </div>
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
  gap: 4,
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

const rowSelfMix: React.CSSProperties = {
  background: warmTheme.accentSoft,
  borderColor: warmTheme.accent,
};

const rankStyle: React.CSSProperties = {
  width: 28,
  textAlign: 'center',
  fontSize: 11,
  fontWeight: 'bold',
  color: warmTheme.textMuted,
};

const avatarChip: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  background: warmTheme.accentSoft,
  border: `1px solid ${warmTheme.border}`,
  flexShrink: 0,
};

const nameStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 'bold',
  color: warmTheme.text,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const subtle: React.CSSProperties = {
  fontSize: 9,
  color: warmTheme.textMuted,
  marginTop: 2,
};

const valStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 'bold',
  color: warmTheme.accentDeep,
  flexShrink: 0,
  padding: '0 4px',
};

const selfChip: React.CSSProperties = {
  fontSize: 8,
  letterSpacing: 1,
  padding: '1px 4px',
  background: warmTheme.accent,
  color: '#fff',
  borderRadius: 4,
};

const metricBtn: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: 10,
  background: 'transparent',
  border: `1px solid ${warmTheme.border}`,
  borderRadius: 6,
  color: warmTheme.textMuted,
  cursor: 'pointer',
  fontFamily: 'Georgia, serif',
};

const metricBtnActive: React.CSSProperties = {
  ...metricBtn,
  background: warmTheme.accentSoft,
  borderColor: warmTheme.accent,
  color: warmTheme.accentDeep,
  fontWeight: 'bold',
};
