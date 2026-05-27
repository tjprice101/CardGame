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

// Dark gold palette constants
const G = {
  gold:         '#c8803a',
  goldSoft:     '#daa058',
  goldBorder:   'rgba(200,128,58,0.28)',
  goldGlass:    'rgba(200,128,58,0.07)',
  text:         '#f0dfc0',
  cinzel:       '"Cinzel", "Cormorant Garamond", Georgia, serif',
  success:      '#4f8a47',
  danger:       '#b85c4f',
} as const;

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
    if (status === 'loading') return 'Signing in…';
    if (status === 'error') return 'Sign-in error';
    return 'Offline · not signed in';
  }, [status]);

  const dailyLogin = progress.dailyLogin;

  return (
    <div style={S.backdrop}>
      {/* Atmospheric washes */}
      <div style={S.washWarm} />
      <div style={S.washCool} />
      <div style={S.washVignette} />
      <div style={S.scanlines} />

      <div className="ui-panel-intro" style={S.panel}>

        {/* ── Header ── */}
        <header style={S.header}>
          <div style={S.headerBrand}>
            <div style={S.headerTitle}>Social</div>
            <div style={S.headerRule}>
              <div style={S.headerRuleLine} />
              <span style={S.headerRuleGlyph}>✦</span>
              <div style={S.headerRuleLine} />
            </div>
            <div style={S.headerSub}>Account · Friends · Leaderboards</div>
          </div>

          <div style={S.headerStats}>
            <EmblemStat label="Friends" value={friends.length.toLocaleString()} highlight={authed} />
            <div style={S.emblemDivider} />
            <EmblemStat label="Requests" value={incoming.length.toLocaleString()} highlight={incoming.length > 0} />
            <div style={S.emblemDivider} />
            <EmblemStat label="Blocked" value={blocked.length.toLocaleString()} />
            <div style={S.emblemDivider} />
            <EmblemStat label="Streak" value={`${dailyLogin.streak}d`} />
          </div>

          <button onClick={onClose} style={S.closeBtn} aria-label="Close">✕</button>
        </header>

        {/* ── Identity strip ── */}
        <section style={S.identityStrip}>
          <div style={S.avatarOuter}>
            <div style={S.avatarInner}>
              {currentAvatar.imageUrl
                ? <img src={currentAvatar.imageUrl} alt={currentAvatar.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
                : <span style={{ fontSize: 36, color: G.gold }}>{currentAvatar.glyph}</span>
              }
            </div>
          </div>

          <div style={S.identityBody}>
            <div style={S.playerName}>{profile.name || 'Acolyte'}</div>
            <div style={S.titleRibbon}>
              {currentTitle ? currentTitle.text : 'No title selected'}
            </div>
            <div style={S.statusRow}>
              <span style={{
                ...S.statusDot,
                background: authed ? G.success : 'rgba(120,120,120,0.45)',
                boxShadow: authed ? `0 0 8px ${G.success}` : 'none',
              }} />
              <span style={S.statusLabel}>{statusLabel}</span>
              {authed && socialUser?.email && (
                <><span style={{ opacity: 0.4, margin: '0 3px' }}>·</span>
                  <span style={S.statusEmail}>{socialUser.email}</span></>
              )}
            </div>
          </div>
        </section>

        {/* ── Body: two dark glass columns ── */}
        <div style={S.body}>
          <div style={S.authCol}>
            <ColHeader title="Account" />
            <AuthPanel />
            {!authed && (
              <div style={S.hintBox}>
                Sign in (or create a free account) to add friends, send gifts,
                exchange messages, and see your standing on the social
                leaderboards. Your single-player progress always stays local.
              </div>
            )}
          </div>

          <div style={S.friendsCol}>
            <ColHeader
              title="Friends & Activity"
              meta={authed ? `${friends.length} friends · ${incoming.length} requests · ${blocked.length} blocked` : undefined}
            />
            {authed ? (
              <FriendsPanel />
            ) : (
              <div style={S.lockedCard}>
                <div style={S.lockedGlyph}>✦</div>
                <div style={S.lockedTitle}>Friends Locked</div>
                <div style={S.lockedBody}>
                  Sign in on the left to unlock friends, requests, the gift
                  inbox, the activity feed, and friend leaderboards.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────

function ColHeader({ title, meta }: { title: string; meta?: string }) {
  return (
    <div style={S.colHeader}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={S.colAccentBar} />
        <div style={S.colTitle}>{title}</div>
      </div>
      {meta && <div style={S.colMeta}>{meta}</div>}
    </div>
  );
}

function EmblemStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={S.emblemStat}>
      <div style={S.emblemLabel}>{label}</div>
      <div style={{
        ...S.emblemValue,
        color: highlight ? G.goldSoft : G.text,
        textShadow: highlight ? '0 0 14px rgba(218,160,88,0.45)' : 'none',
      }}>{value}</div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(160deg, #0d0703 0%, #070402 55%, #050203 100%)',
    display: 'flex',
    zIndex: 30,
    overflow: 'hidden',
    fontFamily: 'Georgia, serif',
    animation: 'backdropFade 0.22s ease',
  },
  washWarm: {
    position: 'absolute',
    top: '-20%', left: '-8%', width: '70%', height: '80%',
    background: 'radial-gradient(ellipse, rgba(200,128,58,0.22) 0%, rgba(160,88,30,0.08) 45%, transparent 70%)',
    filter: 'blur(80px)', pointerEvents: 'none',
  },
  washCool: {
    position: 'absolute',
    bottom: '-20%', right: '-8%', width: '65%', height: '75%',
    background: 'radial-gradient(ellipse, rgba(70,90,170,0.12) 0%, transparent 65%)',
    filter: 'blur(90px)', pointerEvents: 'none',
  },
  washVignette: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at 50% 44%, transparent 28%, rgba(0,0,0,0.58) 100%)',
    pointerEvents: 'none',
  },
  scanlines: {
    position: 'absolute', inset: 0,
    background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)',
    pointerEvents: 'none',
  },
  panel: {
    position: 'relative', zIndex: 1,
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden', background: 'transparent',
    animation: 'panelSlideUp 0.28s ease',
  },

  /* Header */
  header: {
    display: 'flex', alignItems: 'center',
    gap: 'clamp(24px,3vw,56px)',
    padding: 'clamp(20px,2.2vw,32px) clamp(40px,4vw,80px)',
    borderBottom: '1px solid rgba(200,128,58,0.16)',
    background: 'rgba(8,4,1,0.5)',
    flexShrink: 0,
  },
  headerBrand: { display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0 },
  headerTitle: {
    fontSize: 'clamp(24px,2.6vw,36px)',
    fontWeight: 300, letterSpacing: 7,
    color: '#daa058',
    fontFamily: '"Cinzel", "Cormorant Garamond", Georgia, serif',
    textShadow: '0 2px 28px rgba(218,160,88,0.42)',
    lineHeight: 1.1,
  },
  headerRule: { display: 'flex', alignItems: 'center', gap: 10 },
  headerRuleLine: {
    height: 1, width: 80, flexShrink: 0,
    background: 'linear-gradient(90deg, rgba(200,128,58,0.5) 0%, transparent 100%)',
  },
  headerRuleGlyph: {
    fontSize: 10, color: 'rgba(200,128,58,0.55)', lineHeight: 1, flexShrink: 0,
  },
  headerSub: {
    fontSize: 9, letterSpacing: 3.5, textTransform: 'uppercase',
    color: 'rgba(218,160,88,0.42)',
  },
  headerStats: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  emblemStat: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '4px 20px', gap: 4,
  },
  emblemLabel: {
    fontSize: 8, letterSpacing: 3, textTransform: 'uppercase',
    color: 'rgba(218,160,88,0.48)', fontWeight: 400, whiteSpace: 'nowrap',
  },
  emblemValue: {
    fontSize: 19, fontWeight: 600, letterSpacing: 0.5,
    color: '#f0dfc0', fontVariantNumeric: 'tabular-nums',
  },
  emblemDivider: {
    width: 1, height: 28,
    background: 'rgba(200,128,58,0.18)', flexShrink: 0,
  },
  closeBtn: {
    width: 42, height: 42, borderRadius: '50%',
    border: '1px solid rgba(200,128,58,0.38)',
    background: 'rgba(200,128,58,0.07)',
    color: 'rgba(218,160,88,0.72)',
    fontSize: 14, cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'inherit', lineHeight: 1, padding: 0,
  },

  /* Identity strip */
  identityStrip: {
    display: 'flex', alignItems: 'center', gap: 22,
    padding: 'clamp(16px,1.8vw,24px) clamp(40px,4vw,80px)',
    borderBottom: '1px solid rgba(200,128,58,0.14)',
    background: 'rgba(6,3,1,0.42)',
    flexShrink: 0,
  },
  avatarOuter: {
    width: 84, height: 84, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    border: '2px solid rgba(200,128,58,0.48)',
    boxShadow: '0 0 30px rgba(200,128,58,0.16)',
    background: 'rgba(200,128,58,0.04)',
  },
  avatarInner: {
    width: 70, height: 70, borderRadius: '50%',
    border: '2px solid rgba(218,160,88,0.78)',
    background: 'linear-gradient(160deg, rgba(40,20,5,0.96) 0%, rgba(18,9,2,1) 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6)',
  },
  identityBody: { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 },
  playerName: {
    fontSize: 22, fontWeight: 300, letterSpacing: 2,
    color: '#f0dfc0',
    fontFamily: '"Cinzel", "Cormorant Garamond", Georgia, serif',
    lineHeight: 1.2,
  },
  titleRibbon: {
    display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start',
    padding: '3px 12px', borderRadius: 999,
    background: 'rgba(200,128,58,0.10)',
    border: '1px solid rgba(200,128,58,0.28)',
    fontSize: 11, fontStyle: 'italic', color: 'rgba(218,160,88,0.86)',
  },
  statusRow: {
    display: 'flex', alignItems: 'center', gap: 7,
    fontSize: 10, color: 'rgba(218,160,88,0.48)',
  },
  statusDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  statusLabel: {
    letterSpacing: 1.5, textTransform: 'uppercase', fontSize: 9,
  },
  statusEmail: { fontFamily: 'monospace', fontSize: 10, opacity: 0.6 },

  /* Body columns */
  body: {
    display: 'grid',
    gridTemplateColumns: 'clamp(300px,26vw,440px) minmax(0,1fr)',
    flex: 1, overflow: 'hidden', minHeight: 0,
  },
  authCol: {
    borderRight: '1px solid rgba(200,128,58,0.14)',
    background: 'rgba(8,4,1,0.35)',
    padding: 'clamp(22px,2.4vw,38px) clamp(22px,2.4vw,38px)',
    overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: 14,
    minHeight: 0,
  },
  friendsCol: {
    padding: 'clamp(22px,2.4vw,38px) clamp(28px,3vw,56px)',
    overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: 14,
    minHeight: 0, background: 'transparent',
  },

  /* Column header */
  colHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 10, paddingBottom: 12,
    borderBottom: '1px solid rgba(200,128,58,0.14)',
    marginBottom: 2, flexShrink: 0,
  },
  colAccentBar: { width: 3, height: 16, borderRadius: 2, background: G.gold, flexShrink: 0 },
  colTitle: {
    fontSize: 10, letterSpacing: 4, textTransform: 'uppercase',
    color: 'rgba(218,160,88,0.80)', fontWeight: 600,
    fontFamily: '"Cinzel", Georgia, serif',
  },
  colMeta: {
    fontSize: 9, letterSpacing: 1, color: 'rgba(218,160,88,0.42)',
    fontVariantNumeric: 'tabular-nums',
  },

  hintBox: {
    padding: '12px 14px', borderRadius: 10,
    border: '1px dashed rgba(100,140,220,0.28)',
    background: 'rgba(70,90,170,0.08)',
    color: 'rgba(180,200,240,0.72)',
    fontSize: 11.5, lineHeight: 1.6,
  },
  lockedCard: {
    margin: '8px 0', padding: '40px 24px',
    background: 'rgba(200,128,58,0.04)',
    border: '1px dashed rgba(200,128,58,0.22)',
    borderRadius: 14, textAlign: 'center',
  },
  lockedGlyph: { fontSize: 28, color: 'rgba(200,128,58,0.2)', marginBottom: 12 },
  lockedTitle: {
    fontSize: 13, fontWeight: 600, letterSpacing: 2.5, textTransform: 'uppercase',
    color: 'rgba(218,160,88,0.55)',
    fontFamily: '"Cinzel", Georgia, serif', marginBottom: 8,
  },
  lockedBody: {
    fontSize: 12, color: 'rgba(218,160,88,0.38)', lineHeight: 1.6, maxWidth: 360, margin: '0 auto',
  },
};

void warmTheme;
