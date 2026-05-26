// SocialPage — full-screen home for account & social features.
//
// Extracted from ProfilePage so social tooling (auth, friends, requests,
// gifts, activity feed, leaderboards) has room to breathe. ProfilePage
// keeps avatar / title / theme; this screen owns everything that touches
// other players + the Supabase account.

import { useMemo } from 'react';
import { useStore, selectProfile, selectProgress } from '@/state/store';
import { warmTheme } from '@/ui/theme';
import { resolveAvatar } from '@/data/profile/avatars';
import { resolveTitleBadge } from '@/data/profile/titleBadges';
import {
  useSocialStore,
  selectSocialStatus,
  selectSocialUser,
} from '@/state/socialStore';
import {
  useFriendsStore,
  selectFriendsList,
  selectIncomingRequests,
  selectBlockedList,
} from '@/state/friendsStore';
import AuthPanel from '@/ui/social/AuthPanel';
import FriendsPanel from '@/ui/social/FriendsPanel';

interface Props {
  onClose: () => void;
}

export default function SocialPage({ onClose }: Props) {
  const profile = useStore(selectProfile);
  const progress = useStore(selectProgress);
  const status = useSocialStore(selectSocialStatus);
  const socialUser = useSocialStore(selectSocialUser);
  const friends = useFriendsStore(selectFriendsList);
  const incoming = useFriendsStore(selectIncomingRequests);
  const blocked = useFriendsStore(selectBlockedList);

  const currentAvatar = resolveAvatar(profile.avatarId, progress);
  const currentTitle = resolveTitleBadge(profile.titleId, progress);

  const authed = status === 'authenticated';

  const statusLabel = useMemo(() => {
    if (status === 'authenticated') return 'Signed in';
    if (status === 'authenticating') return 'Signing in…';
    if (status === 'error') return 'Sign-in error';
    return 'Offline · not signed in';
  }, [status]);

  const dailyLogin = progress.dailyLogin;

  return (
    <div style={styles.backdrop}>
      <div className="ui-panel-intro" style={styles.panel}>
        {/* Header */}
        <div className="ui-shimmer-band" style={styles.header}>
          <div style={styles.headerBrand}>
            <div className="ui-title-glow" style={styles.headerTitle}>SOCIAL</div>
            <div style={styles.headerSub}>Account, friends, gifts &amp; leaderboards</div>
          </div>

          <div style={styles.headerStats}>
            <Stat label="Friends" value={friends.length.toLocaleString()} highlight={authed} />
            <StatDivider />
            <Stat label="Requests" value={incoming.length.toLocaleString()} highlight={incoming.length > 0} />
            <StatDivider />
            <Stat label="Blocked" value={blocked.length.toLocaleString()} />
            <StatDivider />
            <Stat label="Streak" value={`${dailyLogin.streak}d`} />
          </div>

          <button
            className="menu-tactile-btn"
            onClick={onClose}
            style={styles.closeBtn}
            aria-label="Close"
          >
            X
          </button>
        </div>

        {/* Identity strip */}
        <div style={styles.identityStrip}>
          <div style={styles.avatar}>{currentAvatar.glyph}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.playerName}>{profile.name || 'Acolyte'}</div>
            <div style={styles.playerTitle}>
              {currentTitle ? currentTitle.text : 'No title selected'}
            </div>
            <div style={styles.handleRow}>
              <span style={{
                ...styles.statusDot,
                background: authed ? warmTheme.success : warmTheme.textFaint,
                boxShadow: authed ? `0 0 8px ${warmTheme.success}` : 'none',
              }} />
              <span style={styles.statusLabel}>{statusLabel}</span>
              {authed && socialUser?.email && (
                <>
                  <span style={styles.handleDivider}>·</span>
                  <span style={styles.handleEmail}>{socialUser.email}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {/* Left column: auth */}
          <div style={styles.authCol}>
            <SectionHeader>Account</SectionHeader>
            <AuthPanel />
            {!authed && (
              <div style={styles.signedOutHint}>
                Sign in (or create a free account) to add friends, send gifts,
                exchange messages, and see your standing on the social
                leaderboards. Your single-player progress always stays local.
              </div>
            )}
          </div>

          {/* Right column: friends + tabs */}
          <div style={styles.friendsCol}>
            <SectionHeader>Friends &amp; Activity</SectionHeader>
            {authed ? (
              <FriendsPanel />
            ) : (
              <div style={styles.lockedCard}>
                <div style={{ fontSize: 28, opacity: 0.32, marginBottom: 10 }}>
                  ✦
                </div>
                <div style={styles.lockedTitle}>Friends locked</div>
                <div style={styles.lockedBody}>
                  Sign in on the left to unlock friends, requests, gift inbox,
                  the activity feed, and friend leaderboards.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// — Subcomponents —————————————————————————————————————————————

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.sectionHeader}>{children}</div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
      <div style={styles.statLabel}>{label}</div>
      <div style={{
        ...styles.statValue,
        color: highlight ? warmTheme.accent : warmTheme.text,
        textShadow: highlight ? `0 0 12px ${warmTheme.accentSoft}` : 'none',
      }}>{value}</div>
    </div>
  );
}

function StatDivider() {
  return <div style={styles.statDivider} />;
}

// — Styles ——————————————————————————————————————————————————————

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: warmTheme.appBackground,
    display: 'flex',
    zIndex: 30,
    animation: 'backdropFade 0.22s ease',
    fontFamily: 'Georgia, serif',
  },
  panel: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: warmTheme.surfaceStrong,
    animation: 'panelSlideUp 0.28s ease',
  },

  /* Header */
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(32px, 3.6vw, 72px)',
    padding: 'clamp(20px, 2vw, 32px) clamp(40px, 4vw, 88px)',
    borderBottom: `1px solid ${warmTheme.border}`,
    background: `linear-gradient(90deg, ${warmTheme.accentSoft}33 0%, transparent 70%)`,
    flexShrink: 0,
    position: 'relative',
  },
  headerBrand: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 'clamp(26px, 2.4vw, 40px)',
    fontWeight: 700,
    letterSpacing: 7,
    color: warmTheme.accentDeep,
  },
  headerSub: {
    fontSize: 11,
    color: warmTheme.textMuted,
    letterSpacing: 1.4,
  },
  headerStats: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 'clamp(28px, 3vw, 56px)',
  },
  statLabel: {
    fontSize: 9,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: warmTheme.textMuted,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 36,
    background: warmTheme.border,
  },
  closeBtn: {
    background: 'rgba(0,0,0,0.06)',
    border: `1px solid ${warmTheme.border}`,
    borderRadius: 10,
    color: warmTheme.textMuted,
    cursor: 'pointer',
    fontSize: 16,
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontFamily: 'Georgia, serif',
  },

  /* Identity strip */
  identityStrip: {
    display: 'flex',
    alignItems: 'center',
    gap: 22,
    padding: 'clamp(20px, 2vw, 32px) clamp(40px, 4vw, 88px)',
    borderBottom: `1px solid ${warmTheme.border}`,
    background: `linear-gradient(180deg, ${warmTheme.surface} 0%, ${warmTheme.surfaceStrong} 100%)`,
    flexShrink: 0,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: '50%',
    background: warmTheme.accentSoft,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 40,
    color: warmTheme.accentDeep,
    border: `2px solid ${warmTheme.borderStrong}`,
    boxShadow: warmTheme.glow,
    flexShrink: 0,
  },
  playerName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: warmTheme.text,
    letterSpacing: 0.5,
  },
  playerTitle: {
    fontSize: 13,
    color: warmTheme.textMuted,
    fontStyle: 'italic',
    marginTop: 3,
  },
  handleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    fontSize: 11,
    color: warmTheme.textMuted,
    letterSpacing: 0.4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  statusLabel: {
    fontWeight: 600,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontSize: 10,
  },
  handleDivider: {
    opacity: 0.5,
  },
  handleEmail: {
    fontFamily: 'Georgia, serif',
    fontStyle: 'italic',
  },

  /* Body */
  body: {
    display: 'grid',
    gridTemplateColumns: 'clamp(320px, 26vw, 460px) minmax(0, 1fr)',
    flex: 1,
    overflow: 'hidden',
    minHeight: 0,
  },
  authCol: {
    borderRight: `1px solid ${warmTheme.border}`,
    background: `${warmTheme.surface}`,
    padding: 'clamp(24px, 2.4vw, 40px) clamp(24px, 2.4vw, 40px)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    minHeight: 0,
  },
  friendsCol: {
    padding: 'clamp(24px, 2.4vw, 40px) clamp(28px, 3vw, 56px)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    minHeight: 0,
  },
  sectionHeader: {
    fontSize: 10,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    color: warmTheme.textMuted,
    paddingBottom: 4,
    borderBottom: `1px solid ${warmTheme.border}`,
  },
  signedOutHint: {
    fontSize: 11.5,
    lineHeight: 1.55,
    color: warmTheme.textMuted,
    fontStyle: 'italic',
    padding: '12px 14px',
    background: 'rgba(0,0,0,0.04)',
    border: `1px dashed ${warmTheme.border}`,
    borderRadius: 10,
  },
  lockedCard: {
    margin: '8px 0',
    padding: '36px 24px',
    background: 'rgba(0,0,0,0.04)',
    border: `1px dashed ${warmTheme.border}`,
    borderRadius: 14,
    textAlign: 'center',
    color: warmTheme.textMuted,
  },
  lockedTitle: {
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: warmTheme.accentDeep,
    marginBottom: 8,
  },
  lockedBody: {
    fontSize: 12,
    lineHeight: 1.55,
    color: warmTheme.textMuted,
    maxWidth: 360,
    margin: '0 auto',
  },
};
