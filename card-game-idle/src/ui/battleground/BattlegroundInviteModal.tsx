/**
 * BattlegroundInviteModal — global overlay shown when another player
 * challenges the local user to a Battleground match.
 *
 * Reads `incomingInvite` from battlegroundStore. Renders as an
 * always-on-top fixed overlay so it appears regardless of which menu
 * or scene is currently active. The user has 60 seconds to respond
 * before the invite automatically expires and is declined.
 */
import { useEffect, useRef, useState } from 'react';
import { useBattlegroundStore } from '@/state/battlegroundStore';
import { useFriendsStore, selectFriendsList } from '@/state/friendsStore';
import { uiTypography, warmTheme } from '@/ui/theme';

const INVITE_TIMEOUT_MS = 60_000;

// ── Styles ────────────────────────────────────────────────────────────────────

const BACKDROP: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(4,2,2,0.76)',
  backdropFilter: 'blur(6px)',
  zIndex: 12000,
};

const PANEL: React.CSSProperties = {
  background: 'linear-gradient(160deg, rgba(24,8,8,0.99) 0%, rgba(12,4,4,0.99) 100%)',
  border: '1px solid rgba(232,80,64,0.55)',
  borderRadius: 20,
  padding: '32px 36px 28px',
  width: 'min(420px, 90vw)',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  alignItems: 'center',
  textAlign: 'center',
  boxShadow: '0 0 80px rgba(0,0,0,0.8), 0 0 60px rgba(180,30,20,0.22), inset 0 1px 0 rgba(255,255,255,0.05)',
};

const BTN_BASE: React.CSSProperties = {
  borderRadius: 10,
  padding: '11px 28px',
  fontSize: '0.88rem',
  fontWeight: 700,
  fontFamily: uiTypography.display,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'background 0.15s, border-color 0.15s',
  border: '1px solid transparent',
  flex: 1,
};

const BTN_ACCEPT: React.CSSProperties = {
  ...BTN_BASE,
  background: 'linear-gradient(135deg, rgba(80,200,100,0.28) 0%, rgba(50,160,70,0.18) 100%)',
  border: '1px solid rgba(80,200,100,0.55)',
  color: '#9dffc4',
};

const BTN_DECLINE: React.CSSProperties = {
  ...BTN_BASE,
  background: 'rgba(232,80,64,0.08)',
  border: '1px solid rgba(232,80,64,0.35)',
  color: 'rgba(240,200,190,0.75)',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function BattlegroundInviteModal() {
  const invite = useBattlegroundStore(s => s.incomingInvite);
  const acceptInvite = useBattlegroundStore(s => s.acceptInvite);
  const declineInvite = useBattlegroundStore(s => s.declineInvite);
  const friends = useFriendsStore(selectFriendsList);

  const [accepting, setAccepting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef<number>(Date.now());

  // Resolve the challenger's display name — prefer the friends list, fall back
  // to the raw user id (replaced by DB lookup if available).
  const challengerName = friends.find(f => f.other.id === invite?.from_user)?.other.displayName
    ?? 'A player';

  // Start/reset countdown whenever a new invite appears.
  useEffect(() => {
    if (!invite) {
      setTimeLeft(60);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    startedAt.current = Date.now();
    setTimeLeft(60);
    setAccepting(false);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      const remaining = Math.max(0, Math.ceil((INVITE_TIMEOUT_MS - elapsed) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(timerRef.current!);
        // Auto-decline on timeout.
        void declineInvite(invite.id);
      }
    }, 500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [invite?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!invite) return null;

  async function handleAccept() {
    if (accepting || !invite) return;
    setAccepting(true);
    await acceptInvite(invite);
  }

  function handleDecline() {
    if (!invite) return;
    void declineInvite(invite.id);
  }

  const urgentColor = timeLeft <= 10 ? '#ff6a4d' : timeLeft <= 20 ? '#ffc04d' : '#9dffc4';

  return (
    <div style={{ ...BACKDROP, background: warmTheme.backdrop }} role="dialog" aria-modal="true" aria-label="Battleground challenge received">
      <div style={{ ...PANEL, background: warmTheme.surfaceStrong, border: `1px solid ${warmTheme.borderStrong}`, boxShadow: warmTheme.shadow }}>
        {/* Icon */}
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: warmTheme.surfaceMuted,
          border: `1px solid ${warmTheme.borderStrong}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.6rem',
          boxShadow: warmTheme.glow,
        }}>
          ⚔️
        </div>

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            fontSize: '0.65rem',
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: warmTheme.textMuted,
            fontFamily: uiTypography.display,
          }}>
            Battleground Challenge
          </div>
          <div style={{
            fontFamily: uiTypography.display,
            fontSize: '1.3rem',
            fontWeight: 700,
            color: warmTheme.text,
            letterSpacing: '0.06em',
          }}>
            {challengerName}
          </div>
          <div style={{ fontSize: '0.8rem', color: warmTheme.textSoft, letterSpacing: '0.02em' }}>
            challenges you to a 3-minute Oblivion race.
          </div>
        </div>

        {/* Countdown */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: '0.68rem', letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(240,220,210,0.45)', fontFamily: uiTypography.display }}>
            Expires in
          </span>
          <span style={{
            fontFamily: uiTypography.display,
            fontSize: '1.6rem',
            fontWeight: 900,
            fontVariantNumeric: 'tabular-nums',
            color: urgentColor,
            textShadow: `0 0 12px ${urgentColor}66`,
            transition: 'color 0.4s, text-shadow 0.4s',
            lineHeight: 1,
          }}>
            {timeLeft}s
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, width: '100%' }}>
          <button
            style={{ ...BTN_DECLINE, background: warmTheme.surfaceMuted, border: `1px solid ${warmTheme.border}`, color: warmTheme.textMuted }}
            onClick={handleDecline}
            disabled={accepting}
            onMouseEnter={e => (e.currentTarget.style.background = warmTheme.surface)}
            onMouseLeave={e => (e.currentTarget.style.background = warmTheme.surfaceMuted)}
          >
            Decline
          </button>
          <button
            style={{ ...BTN_ACCEPT, background: warmTheme.button, border: `1px solid ${warmTheme.borderStrong}`, color: warmTheme.accentDeep, opacity: accepting ? 0.6 : 1, cursor: accepting ? 'not-allowed' : 'pointer' }}
            onClick={() => void handleAccept()}
            disabled={accepting}
            onMouseEnter={e => { if (!accepting) e.currentTarget.style.filter = 'brightness(1.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
          >
            {accepting ? 'Joining…' : 'Accept'}
          </button>
        </div>
      </div>
    </div>
  );
}
