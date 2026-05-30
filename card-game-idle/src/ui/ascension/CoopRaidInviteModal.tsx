import { useEffect, useRef, useState } from 'react';
import { useCoopRaidStore } from '@/state/coopRaidStore';
import { useFriendsStore, selectFriendsList } from '@/state/friendsStore';
import { useStore } from '@/state/store';
import { uiTypography } from '@/ui/theme';

const INVITE_TIMEOUT_MS = 60_000;

const BACKDROP: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(4,2,10,0.78)',
  backdropFilter: 'blur(6px)',
  zIndex: 12010,
};

const PANEL: React.CSSProperties = {
  background: 'linear-gradient(160deg, rgba(18,8,36,0.99) 0%, rgba(8,4,18,0.99) 100%)',
  border: '1px solid rgba(160,120,255,0.55)',
  borderRadius: 20,
  padding: '30px 34px 24px',
  width: 'min(520px, 92vw)',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  boxShadow: '0 0 80px rgba(0,0,0,0.85), 0 0 60px rgba(120,70,220,0.25)',
};

export default function CoopRaidInviteModal() {
  const invite = useCoopRaidStore(s => s.incomingInvite);
  const acceptInvite = useCoopRaidStore(s => s.acceptInvite);
  const declineInvite = useCoopRaidStore(s => s.declineInvite);
  const friends = useFriendsStore(selectFriendsList);
  const savedDecks = useStore(s => s.progress.savedDecks);

  const [accepting, setAccepting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedDeckId, setSelectedDeckId] = useState<string>(savedDecks[0]?.id ?? '');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    setSelectedDeckId(savedDecks[0]?.id ?? '');
  }, [savedDecks]);

  const challengerName = friends.find(f => f.other.id === invite?.from_user)?.other.displayName ?? 'A player';

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
  }, [invite?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!invite) return null;

  async function handleAccept() {
    if (accepting || !invite || !selectedDeckId) return;
    setAccepting(true);
    await acceptInvite(invite, selectedDeckId);
  }

  function handleDecline() {
    if (!invite) return;
    void declineInvite(invite.id);
  }

  const urgentColor = timeLeft <= 10 ? '#ff6a4d' : timeLeft <= 20 ? '#ffc04d' : '#9dffc4';

  return (
    <div style={BACKDROP} role="dialog" aria-modal="true" aria-label="Co-op raid invite received">
      <div style={PANEL}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(180,130,255,0.35) 0%, rgba(100,60,220,0.20) 100%)',
            border: '1px solid rgba(180,130,255,0.60)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
          }}>
            ✦
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: '0.68rem', letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(200,170,255,0.85)', fontFamily: uiTypography.display }}>
              Co-op Null Raid Invite
            </div>
            <div style={{ fontFamily: uiTypography.display, fontSize: '1.18rem', fontWeight: 700, color: '#f0e8ff', letterSpacing: '0.05em' }}>
              {challengerName}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'rgba(232,220,255,0.70)' }}>
              invited you to join <strong>{invite.raid_id}</strong>.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: '0.68rem', letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(240,220,255,0.55)', fontFamily: uiTypography.display }}>
            Expires in
          </span>
          <span style={{ fontFamily: uiTypography.display, fontSize: '1.5rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: urgentColor, textShadow: `0 0 12px ${urgentColor}66` }}>
            {timeLeft}s
          </span>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.74rem', letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(200,180,255,0.75)', fontFamily: uiTypography.display }}>
            Select Deck
          </span>
          <select
            value={selectedDeckId}
            onChange={(e) => setSelectedDeckId(e.target.value)}
            style={{
              borderRadius: 9,
              border: '1px solid rgba(160,120,255,0.35)',
              background: 'rgba(18,10,34,0.9)',
              color: '#efe8ff',
              padding: '10px 12px',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          >
            {savedDecks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>

        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button
            style={{
              borderRadius: 10,
              padding: '10px 18px',
              background: 'rgba(232,80,64,0.10)',
              border: '1px solid rgba(232,80,64,0.35)',
              color: 'rgba(245,210,205,0.86)',
              fontSize: '0.84rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              flex: 1,
            }}
            onClick={handleDecline}
            disabled={accepting}
          >
            Decline
          </button>
          <button
            style={{
              borderRadius: 10,
              padding: '10px 18px',
              background: 'linear-gradient(135deg, rgba(100,180,120,0.34) 0%, rgba(70,140,90,0.20) 100%)',
              border: '1px solid rgba(120,220,140,0.45)',
              color: '#c9ffd6',
              fontSize: '0.84rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: accepting ? 'not-allowed' : 'pointer',
              opacity: accepting || !selectedDeckId ? 0.65 : 1,
              flex: 1,
            }}
            onClick={() => void handleAccept()}
            disabled={accepting || !selectedDeckId}
          >
            {accepting ? 'Joining...' : 'Accept'}
          </button>
        </div>
      </div>
    </div>
  );
}
