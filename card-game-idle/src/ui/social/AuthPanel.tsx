// AuthPanel — Phase 1 social UI.
//
// Embedded in ProfilePage when Supabase is configured. When unconfigured (no
// VITE_SUPABASE_URL / KEY at build time), renders a single info line so single-
// player builds stay visually clean.

import { useEffect, useState } from 'react';
import { warmTheme } from '@/ui/theme';
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
    });
  }, [
    status,
    socialProfile,
    localProfile.name,
    localProfile.bio,
    localProfile.avatarId,
    localProfile.titleId,
    localProfile.uiThemeId,
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
            <div style={{ fontSize: 13, fontWeight: 'bold', color: warmTheme.text }}>
              Signed in as {socialProfile.displayName}
            </div>
            <div style={{ fontSize: 10, color: warmTheme.textSoft, marginTop: 2 }}>
              Friend code: <span style={{ fontFamily: 'monospace', color: warmTheme.accentDeep }}>{socialProfile.friendCode}</span>
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
      setLocalError(err instanceof Error ? err.message : String(err));
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
      <div style={{ fontSize: 9, color: warmTheme.textSoft, marginTop: 8, lineHeight: 1.4 }}>
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
        background: active ? warmTheme.accentSoft : 'transparent',
        border: `1px solid ${active ? warmTheme.accent : warmTheme.border}`,
        borderRadius: 6,
        color: warmTheme.text,
        cursor: 'pointer',
        fontFamily: 'Georgia, serif',
      }}
    >{children}</button>
  );
}

const cardStyle: React.CSSProperties = {
  padding: 12,
  marginBottom: 12,
  background: 'rgba(0,0,0,0.04)',
  border: `1px solid ${warmTheme.border}`,
  borderRadius: 10,
};

const hintStyle: React.CSSProperties = {
  ...cardStyle,
  fontSize: 10,
  color: warmTheme.textSoft,
  fontStyle: 'italic',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  marginBottom: 6,
  fontSize: 12,
  background: 'rgba(255,255,255,0.88)',
  border: `1px solid ${warmTheme.borderStrong}`,
  borderRadius: 6,
  color: warmTheme.text,
  fontFamily: 'Georgia, serif',
  boxSizing: 'border-box',
};

const primaryBtn: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: 12,
  fontWeight: 'bold',
  background: warmTheme.accentSoft,
  border: `1px solid ${warmTheme.accent}`,
  borderRadius: 6,
  color: warmTheme.accentDeep,
  cursor: 'pointer',
  fontFamily: 'Georgia, serif',
};

const ghostBtn: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 11,
  background: 'transparent',
  border: `1px solid ${warmTheme.borderStrong}`,
  borderRadius: 6,
  color: warmTheme.text,
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
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${warmTheme.border}` }}>
      <div style={{
        fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
        color: warmTheme.textSoft, marginBottom: 6,
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
        background: on ? warmTheme.accentSoft : 'transparent',
        border: `1px solid ${on ? warmTheme.accent : warmTheme.border}`,
        borderRadius: 6,
        color: on ? warmTheme.accentDeep : warmTheme.text,
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
