// AuthPanel — Phase 1 social UI.
//
// Embedded in ProfilePage when Supabase is configured. When unconfigured (no
// VITE_SUPABASE_URL / KEY at build time), renders a single info line so single-
// player builds stay visually clean.

import { useEffect, useState } from 'react';
// Dark gold palette shared with PlayerInformationPage — authoring here avoids
// importing the mutable warmTheme which defaults to the blue steel palette.
const A = {
  gold:             '#c8803a',
  goldSoft:         '#daa058',
  goldBorder:       'rgba(200,128,58,0.28)',
  goldBorderStrong: 'rgba(200,128,58,0.55)',
  goldGlass:        'rgba(200,128,58,0.10)',
  text:             '#f0dfc0',
  textSoft:         'rgba(240,223,192,0.62)',
  textMuted:        'rgba(240,223,192,0.40)',
  success:          '#4f8a47',
  danger:           '#b85c4f',
} as const;
import {
  useSocialStore,
  selectSocialStatus,
  selectSocialProfile,
  selectSocialError,
  isSupabaseConfigured,
} from '@/state/socialStore';
import { useStore, selectProfile } from '@/state/store';
import { useMessagesStore } from '@/state/messagesStore';
import {
  getNotificationPrefs,
  updateNotificationPrefs,
} from '@/social/notificationsService';

type Mode = 'signin' | 'signup';

export default function AuthPanel() {
  const configured = isSupabaseConfigured();
  const status = useSocialStore(selectSocialStatus);
  const socialProfile = useSocialStore(selectSocialProfile);
  const errorMessage = useSocialStore(selectSocialError);
  const localProfile = useStore(selectProfile);

  const initialize = useSocialStore(s => s.initialize);
  const signIn = useSocialStore(s => s.signInWithEmail);
  const signUp = useSocialStore(s => s.signUpWithEmail);
  const signOut = useSocialStore(s => s.signOut);
  const syncOwnProfile = useSocialStore(s => s.syncOwnProfile);
  const loadThreads = useMessagesStore(s => s.loadThreads);

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (configured) void initialize();
  }, [configured, initialize]);

  // Once authenticated, mirror any local profile edits up to the server.
  useEffect(() => {
    if (status !== 'authenticated' || !socialProfile) return;
    void syncOwnProfile({
      displayName: localProfile.name,
      bio: localProfile.bio ?? '',
      avatarId: localProfile.avatarId,
      titleId: localProfile.titleId,
      uiThemeId: localProfile.uiThemeId ?? null,
      signatureCardIds: localProfile.signatureCardIds ?? [],
    });
  }, [
    status,
    socialProfile,
    localProfile.name,
    localProfile.bio,
    localProfile.avatarId,
    localProfile.titleId,
    localProfile.uiThemeId,
    localProfile.signatureCardIds,
    syncOwnProfile,
  ]);

  // Once authenticated, load DM thread summaries so unread badges are accurate.
  useEffect(() => {
    if (status === 'authenticated') void loadThreads();
  }, [status, loadThreads]);

  if (!configured) {
    return (
      <div style={hintStyle}>
        Social features are not enabled in this build.
      </div>
    );
  }

  if (status === 'authenticated' && socialProfile) {
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: A.text }}>
              Signed in as {socialProfile.displayName}
            </div>
            <div style={{ fontSize: 10, color: A.textSoft, marginTop: 2 }}>
              Friend code: <span style={{ fontFamily: 'monospace', color: A.goldSoft }}>{socialProfile.friendCode}</span>
            </div>
          </div>
          <button
            onClick={() => void signOut()}
            style={ghostBtn}
          >Sign out</button>
        </div>
        <NotificationSettings />
      </div>
    );
  }

  if (status === 'confirmation_pending') {
    return (
      <div style={cardStyle}>
        <div style={{ fontSize: 13, color: '#6ecf7c', fontWeight: 700, marginBottom: 6 }}>
          Almost there!
        </div>
        <div style={{ fontSize: 12, color: A.textSoft, lineHeight: 1.6 }}>
          A confirmation email has been sent. Click the link in that email, then come back and sign in.
        </div>
        <button
          onClick={() => setMode('signin')}
          style={{ ...ghostBtn, marginTop: 12 }}
        >
          Sign in instead
        </button>
      </div>
    );
  }

  async function submit() {
    setLocalError(null);
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, localProfile.name);
      }
    } catch (err) {
      setLocalError(
        err instanceof Error
          ? err.message
          : (err && typeof err === 'object' && 'message' in err && typeof (err as Record<string, unknown>).message === 'string')
            ? (err as Record<string, unknown>).message as string
            : 'Sign-in failed. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <ModeTab active={mode === 'signin'} onClick={() => setMode('signin')}>Sign in</ModeTab>
        <ModeTab active={mode === 'signup'} onClick={() => setMode('signup')}>Create account</ModeTab>
      </div>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        autoComplete="email"
        style={inputStyle}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
        style={inputStyle}
      />
      {(localError || errorMessage) && (
        <div style={{ fontSize: 10, color: '#b86060', marginBottom: 6 }}>
          {localError ?? errorMessage}
        </div>
      )}
      <button
        disabled={busy || !email || password.length < 6}
        onClick={() => void submit()}
        style={{
          ...primaryBtn,
          opacity: busy || !email || password.length < 6 ? 0.5 : 1,
          cursor: busy ? 'wait' : 'pointer',
        }}
      >
        {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
      </button>
      <div style={{ fontSize: 9, color: A.textMuted, marginTop: 8, lineHeight: 1.4 }}>
        Your account is separate from your local save. Saves stay on this device; the account
        is used for friends, messages, and friend leaderboards.
      </div>
    </div>
  );
}

function ModeTab({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '6px 8px',
        fontSize: 11,
        background: active ? A.goldGlass : 'transparent',
        border: `1px solid ${active ? A.goldBorderStrong : A.goldBorder}`,
        borderRadius: 6,
        color: active ? A.goldSoft : A.textSoft,
        cursor: 'pointer',
        fontFamily: 'Georgia, serif',
        fontWeight: active ? 600 : 400,
        letterSpacing: active ? 0.5 : 0,
        transition: 'all 0.18s ease',
      }}
    >{children}</button>
  );
}

const cardStyle: React.CSSProperties = {
  padding: 12,
  marginBottom: 12,
  background: 'rgba(200,128,58,0.04)',
  border: `1px solid ${A.goldBorder}`,
  borderRadius: 10,
};

const hintStyle: React.CSSProperties = {
  ...cardStyle,
  fontSize: 10,
  color: A.textMuted,
  fontStyle: 'italic',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  marginBottom: 6,
  fontSize: 12,
  background: 'rgba(0,0,0,0.35)',
  border: `1px solid ${A.goldBorder}`,
  borderRadius: 6,
  color: A.text,
  fontFamily: 'Georgia, serif',
  boxSizing: 'border-box',
  outline: 'none',
};

const primaryBtn: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  fontSize: 12,
  fontWeight: 700,
  background: 'linear-gradient(135deg, rgba(200,128,58,0.85) 0%, rgba(160,88,30,0.9) 100%)',
  border: `1px solid ${A.goldBorderStrong}`,
  borderRadius: 8,
  color: '#1a0c04',
  cursor: 'pointer',
  fontFamily: 'Georgia, serif',
  letterSpacing: 1,
  textTransform: 'uppercase',
  boxShadow: '0 4px 14px rgba(200,128,58,0.26)',
};

const ghostBtn: React.CSSProperties = {
  padding: '5px 12px',
  fontSize: 11,
  background: 'transparent',
  border: `1px solid ${A.goldBorder}`,
  borderRadius: 6,
  color: A.textSoft,
  cursor: 'pointer',
  fontFamily: 'Georgia, serif',
};

// ── Notification settings (Phase 6) ────────────────────────────────────────

function NotificationSettings() {
  const [prefs, setPrefs] = useState(() => getNotificationPrefs());
  const desktopSupported = typeof window !== 'undefined' && !!window.pantheonNotify;

  function toggle(key: keyof ReturnType<typeof getNotificationPrefs>) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    updateNotificationPrefs(next);
  }

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${A.goldBorder}` }}>
      <div style={{
        fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
        color: A.textMuted, marginBottom: 6,
      }}>Notifications</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <NotifToggle on={prefs.dms} label="Direct messages" onToggle={() => toggle('dms')} />
        <NotifToggle on={prefs.gifts} label="Gifts received" onToggle={() => toggle('gifts')} />
        <NotifToggle on={prefs.friendRequests} label="Friend requests" onToggle={() => toggle('friendRequests')} />
        {desktopSupported && (
          <NotifToggle
            on={prefs.osNotificationsWhenUnfocused}
            label="Desktop notifications when unfocused"
            onToggle={() => toggle('osNotificationsWhenUnfocused')}
          />
        )}
      </div>
    </div>
  );
}

function NotifToggle({
  on, label, onToggle,
}: { on: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 8px',
        background: on ? A.goldGlass : 'transparent',
        border: `1px solid ${on ? A.goldBorderStrong : A.goldBorder}`,
        borderRadius: 6,
        color: on ? A.goldSoft : A.textSoft,
        cursor: 'pointer',
        fontFamily: 'Georgia, serif',
        fontSize: 11,
      }}
    >
      <span>{label}</span>
      <span style={{ fontSize: 9, letterSpacing: 1 }}>{on ? 'ON' : 'OFF'}</span>
    </button>
  );
}
