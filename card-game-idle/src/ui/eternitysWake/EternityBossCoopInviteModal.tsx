import { useEffect, useRef, useState } from 'react';
import { useEternityBossCoopStore } from '@/state/eternityBossCoopStore';
import { useFriendsStore, selectFriendsList } from '@/state/friendsStore';
import { useStore } from '@/state/store';
import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';
import { uiTypography, warmTheme } from '@/ui/theme';
import { useThemeVersion } from '@/ui/useThemeVersion';

const INVITE_TIMEOUT_MS = 60_000;

export default function EternityBossCoopInviteModal() {
  useThemeVersion();
  const invite = useEternityBossCoopStore(s => s.incomingInvite);
  const acceptInvite = useEternityBossCoopStore(s => s.acceptInvite);
  const declineInvite = useEternityBossCoopStore(s => s.declineInvite);
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

  const inviterName = friends.find(f => f.other.id === invite?.from_user)?.other.displayName ?? 'A friend';
  const bossName = BOSS_DEFINITIONS.find(b => b.id === invite?.boss_id)?.name ?? invite?.boss_id ?? 'Unknown Boss';

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
    if (!invite || accepting || !selectedDeckId) return;
    setAccepting(true);
    await acceptInvite(invite, selectedDeckId);
  }

  function handleDecline() {
    if (!invite) return;
    void declineInvite(invite.id);
  }

  const urgentColor = timeLeft <= 10 ? warmTheme.danger : timeLeft <= 20 ? warmTheme.accentSoft : warmTheme.success;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: warmTheme.backdrop,
        backdropFilter: 'blur(6px)',
        zIndex: 12020,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Eternity co-op invite received"
    >
      <div
        style={{
          background: warmTheme.surfaceStrong,
          border: `1px solid ${warmTheme.borderStrong}`,
          borderRadius: 18,
          padding: '28px 32px 24px',
          width: 'min(540px, 92vw)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          color: warmTheme.text,
          boxShadow: warmTheme.shadow,
          fontFamily: uiTypography.body,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${warmTheme.borderStrong}`,
              background: warmTheme.surfaceMuted,
              color: warmTheme.accentSoft,
              fontSize: '1.25rem',
            }}
          >
            ✦
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: '0.68rem', letterSpacing: 2.6, textTransform: 'uppercase', color: warmTheme.textMuted, fontFamily: uiTypography.display }}>
              Eternity's Wake Co-op Invite
            </div>
            <div style={{ fontFamily: uiTypography.display, fontSize: '1.12rem', fontWeight: 700, color: warmTheme.text }}>
              {inviterName}
            </div>
            <div style={{ fontSize: '0.84rem', color: warmTheme.textSoft }}>
              invited you to challenge <strong>{bossName}</strong>.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: '0.68rem', letterSpacing: 2, textTransform: 'uppercase', color: warmTheme.textMuted, fontFamily: uiTypography.display }}>
            Expires in
          </span>
          <span style={{ fontFamily: uiTypography.display, fontSize: '1.42rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: urgentColor }}>
            {timeLeft}s
          </span>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.74rem', letterSpacing: 2, textTransform: 'uppercase', color: warmTheme.textMuted, fontFamily: uiTypography.display }}>
            Select Deck
          </span>
          <select
            value={selectedDeckId}
            onChange={(e) => setSelectedDeckId(e.target.value)}
            style={{
              borderRadius: 8,
              border: `1px solid ${warmTheme.border}`,
              background: warmTheme.surface,
              color: warmTheme.text,
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
              background: warmTheme.surfaceMuted,
              border: `1px solid ${warmTheme.border}`,
              color: warmTheme.textMuted,
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
              background: warmTheme.button,
              border: `1px solid ${warmTheme.borderStrong}`,
              color: warmTheme.accentDeep,
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
