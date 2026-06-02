import { useEffect, useRef, useState } from 'react';
import { usePartyStore } from '@/state/partyStore';
import { useFriendsStore, selectFriendsList } from '@/state/friendsStore';
import { uiTypography, warmTheme } from '@/ui/theme';
import { useThemeVersion } from '@/ui/useThemeVersion';

const INVITE_TIMEOUT_MS = 60_000;

export default function PartyInviteModal() {
  useThemeVersion();
  const invite = usePartyStore(s => s.incomingInvite);
  const acceptInvite = usePartyStore(s => s.acceptInvite);
  const declineInvite = usePartyStore(s => s.declineInvite);
  const friends = useFriendsStore(selectFriendsList);
  const [accepting, setAccepting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef<number>(Date.now());

  const inviterName = friends.find(f => f.other.id === invite?.from_user)?.other.displayName ?? 'A player';

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
        void declineInvite(invite.id);
      }
    }, 500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [invite?.id, declineInvite]);

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
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,2,10,0.78)', backdropFilter: 'blur(6px)', zIndex: 12040 }} role="dialog" aria-modal="true" aria-label="Party invite received">
      <div style={{ background: warmTheme.surfaceStrong, border: `1px solid ${warmTheme.borderStrong}`, borderRadius: 18, padding: '28px 32px 24px', width: 'min(520px, 92vw)', display: 'flex', flexDirection: 'column', gap: 14, color: warmTheme.text, boxShadow: warmTheme.shadow, fontFamily: uiTypography.body }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: warmTheme.surfaceMuted, border: `1px solid ${warmTheme.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', color: warmTheme.accentSoft }}>◉</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: '0.68rem', letterSpacing: 3, textTransform: 'uppercase', color: warmTheme.textMuted, fontFamily: uiTypography.display }}>Card-bound Party Invite</div>
            <div style={{ fontFamily: uiTypography.display, fontSize: '1.12rem', fontWeight: 700, color: warmTheme.text }}>{inviterName}</div>
            <div style={{ fontSize: '0.84rem', color: warmTheme.textSoft }}>invited you to join party <strong>{invite.party_id.slice(0, 8)}</strong>.</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: '0.68rem', letterSpacing: 2, textTransform: 'uppercase', color: warmTheme.textMuted, fontFamily: uiTypography.display }}>Expires in</span>
          <span style={{ fontFamily: uiTypography.display, fontSize: '1.42rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: urgentColor, textShadow: `0 0 12px ${urgentColor}66` }}>{timeLeft}s</span>
        </div>

        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button style={{ borderRadius: 10, padding: '10px 18px', background: warmTheme.surfaceMuted, border: `1px solid ${warmTheme.border}`, color: warmTheme.textMuted, fontSize: '0.84rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', flex: 1 }} onClick={handleDecline} disabled={accepting}>Decline</button>
          <button style={{ borderRadius: 10, padding: '10px 18px', background: warmTheme.button, border: `1px solid ${warmTheme.borderStrong}`, color: warmTheme.accentDeep, fontSize: '0.84rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: accepting ? 'not-allowed' : 'pointer', opacity: accepting ? 0.65 : 1, flex: 1 }} onClick={() => void handleAccept()} disabled={accepting}> {accepting ? 'Joining...' : 'Accept'} </button>
        </div>
      </div>
    </div>
  );
}
