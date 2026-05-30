// AuthPanel — Phase 1 social UI.
//
// Embedded in ProfilePage when Supabase is configured. When unconfigured (no
// VITE_SUPABASE_URL / KEY at build time), renders a single info line so single-
// player builds stay visually clean.

import { useEffect, useRef, useState } from 'react';
import { warmTheme } from '@/ui/theme';
const C = {
  text: `var(--profile-text, ${warmTheme.text})`,
  textSoft: `var(--profile-text-soft, ${warmTheme.textSoft})`,
  textMuted: `var(--profile-text-muted, ${warmTheme.textMuted})`,
  border: `var(--profile-border, ${warmTheme.border})`,
  borderStrong: `var(--profile-border-strong, ${warmTheme.borderStrong})`,
  accent: `var(--profile-accent, ${warmTheme.accent})`,
  accentSoft: `var(--profile-accent-soft, ${warmTheme.accentSoft})`,
  surface: `var(--profile-surface, ${warmTheme.surface})`,
  surfaceMuted: `var(--profile-surface-muted, ${warmTheme.surfaceMuted})`,
  button: `var(--profile-button, ${warmTheme.button})`,
  buttonText: `var(--profile-button-text, ${warmTheme.text})`,
  success: `var(--profile-success, ${warmTheme.success})`,
  danger: `var(--profile-danger, ${warmTheme.danger})`,
} as const;
import {
  useSocialStore,
  selectSocialStatus,
  selectSocialProfile,
  selectSocialError,
  isSupabaseConfigured,
} from '@/state/socialStore';
import { useStore } from '@/state/store';
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

  const initialize = useSocialStore(s => s.initialize);
  const signIn = useSocialStore(s => s.signInWithEmail);
  const signUp = useSocialStore(s => s.signUpWithEmail);
  const signOut = useSocialStore(s => s.signOut);
  const applyRemoteProfile = useStore(s => s.applyRemoteProfile);

  // Track whether we have already applied the remote profile for the current
  // session, so we only overwrite local values immediately after sign-in rather
  // than on every re-render while authenticated.
  const appliedSessionRef = useRef<string | null>(null);

  const [mode, setMode] = useState<Mode>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (configured) void initialize();
  }, [configured, initialize]);

  // On sign-in: apply the server profile to the local game store (read path).
  // Only fires once per session (tracked by profile id) so local edits made
  // afterward are not clobbered by re-renders.
  useEffect(() => {
    if (status !== 'authenticated' || !socialProfile) return;
    if (appliedSessionRef.current === socialProfile.id) return;
    appliedSessionRef.current = socialProfile.id;
    applyRemoteProfile({
      name: socialProfile.displayName,
      bio: socialProfile.bio ?? '',
      avatarId: socialProfile.avatarId,
      titleId: socialProfile.titleId,
      uiThemeId: socialProfile.uiThemeId,
      customUiTheme: socialProfile.customUiTheme,
      signatureCardIds: socialProfile.signatureCardIds,
    });
  }, [status, socialProfile, applyRemoteProfile]);

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
            <div style={{ fontSize: 13, fontWeight: 'bold', color: C.text }}>
              Signed in as {socialProfile.displayName}
            </div>
            <div style={{ fontSize: 10, color: C.textSoft, marginTop: 2 }}>
              Friend code: <span style={{ fontFamily: 'monospace', color: C.accentSoft }}>{socialProfile.friendCode}</span>
            </div>
          </div>
          <button
            onClick={() => { appliedSessionRef.current = null; void signOut(); }}
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
        <div style={{ fontSize: 13, color: C.success, fontWeight: 700, marginBottom: 6 }}>
          Almost there!
        </div>
        <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.6 }}>
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
        await signIn(username.trim(), password);
      } else {
        await signUp(username.trim(), password, username.trim());
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
        type="text"
        placeholder={mode === 'signin' ? 'Username' : 'Choose username'}
        value={username}
        onChange={e => setUsername(e.target.value)}
        autoComplete="username"
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
        <div style={{ fontSize: 10, color: C.danger, marginBottom: 6 }}>
          {localError ?? errorMessage}
        </div>
      )}
      <button
        disabled={busy || !username || password.length < 6}
        onClick={() => void submit()}
        style={{
          ...primaryBtn,
          opacity: busy || !username || password.length < 6 ? 0.5 : 1,
          cursor: busy ? 'wait' : 'pointer',
        }}
      >
        {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
      </button>
      <div style={{ fontSize: 9, color: C.textMuted, marginTop: 8, lineHeight: 1.4 }}>
        Sign in with your username. Your profile, social identity, theme, and cloud save sync to your account.
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
        background: active ? C.surfaceMuted : 'transparent',
        border: `1px solid ${active ? C.borderStrong : C.border}`,
        borderRadius: 6,
        color: active ? C.accentSoft : C.textSoft,
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
  background: C.surfaceMuted,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
};

const hintStyle: React.CSSProperties = {
  ...cardStyle,
  fontSize: 10,
  color: C.textMuted,
  fontStyle: 'italic',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  marginBottom: 6,
  fontSize: 12,
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  color: C.text,
  fontFamily: 'Georgia, serif',
  boxSizing: 'border-box',
  outline: 'none',
};

const primaryBtn: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  fontSize: 12,
  fontWeight: 700,
  background: C.button,
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  color: C.buttonText,
  cursor: 'pointer',
  fontFamily: 'Georgia, serif',
  letterSpacing: 1,
  textTransform: 'uppercase',
  boxShadow: 'none',
};

const ghostBtn: React.CSSProperties = {
  padding: '5px 12px',
  fontSize: 11,
  background: 'transparent',
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  color: C.textSoft,
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
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
      <div style={{
        fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
        color: C.textMuted, marginBottom: 6,
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
        background: on ? C.surfaceMuted : 'transparent',
        border: `1px solid ${on ? C.borderStrong : C.border}`,
        borderRadius: 6,
        color: on ? C.accentSoft : C.textSoft,
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
