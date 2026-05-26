// GiftInbox — Phase 4 social UI.
//
// Lists incoming gifts for the signed-in user with Claim / Decline actions.
// Mounted inside FriendsPanel so it's discoverable next to the social list.

import { useEffect } from 'react';
import { warmTheme } from '@/ui/theme';
import {
  useGiftsStore,
  selectIncomingGifts,
  selectGiftsError,
} from '@/state/giftsStore';
import { useSocialStore, selectSocialStatus } from '@/state/socialStore';
import { CardRegistry } from '@/cards/CardRegistry';

export default function GiftInbox() {
  const status = useSocialStore(selectSocialStatus);
  const incoming = useGiftsStore(selectIncomingGifts);
  const errorMessage = useGiftsStore(selectGiftsError);
  const loadGifts = useGiftsStore(s => s.loadGifts);
  const claimGift = useGiftsStore(s => s.claimGift);
  const declineGift = useGiftsStore(s => s.declineGift);
  const connectRealtime = useGiftsStore(s => s.connectRealtime);
  const disconnectRealtime = useGiftsStore(s => s.disconnectRealtime);

  useEffect(() => {
    if (status !== 'authenticated') return;
    void loadGifts();
    connectRealtime();
    return () => disconnectRealtime();
  }, [status, loadGifts, connectRealtime, disconnectRealtime]);

  if (status !== 'authenticated') return null;
  const pending = incoming.filter(g => g.status === 'pending');
  if (pending.length === 0) return null;

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>Gift Inbox · {pending.length}</div>
      {errorMessage && (
        <div style={{ fontSize: 10, color: '#b86060', marginBottom: 6 }}>{errorMessage}</div>
      )}
      <ul style={listStyle}>
        {pending.map(g => {
          const def = CardRegistry.get(g.payload.definitionId);
          const cardName = def?.name ?? g.payload.definitionId;
          return (
            <li key={g.id} style={rowStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 'bold', color: warmTheme.text }}>
                  {g.payload.count}× {cardName} {g.payload.finish === 'holo' ? '(Holo)' : ''}
                </div>
                {g.payload.note && (
                  <div style={{ fontSize: 10, color: warmTheme.textMuted, fontStyle: 'italic' }}>
                    “{g.payload.note}”
                  </div>
                )}
              </div>
              <button style={primaryBtn} onClick={() => void claimGift(g.id)}>Claim</button>
              <button style={ghostBtn} onClick={() => void declineGift(g.id)}>Decline</button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: warmTheme.surface,
  border: `1px solid ${warmTheme.border}`,
  borderRadius: 8,
  padding: 12,
  marginTop: 12,
};

const headerStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: 2,
  textTransform: 'uppercase',
  color: warmTheme.textMuted,
  marginBottom: 8,
};

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 8px',
  background: 'rgba(0,0,0,0.04)',
  border: `1px solid ${warmTheme.border}`,
  borderRadius: 6,
};

const primaryBtn: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 10,
  background: warmTheme.accent,
  border: `1px solid ${warmTheme.accent}`,
  borderRadius: 6,
  color: warmTheme.surface,
  cursor: 'pointer',
  fontFamily: 'Georgia, serif',
};

const ghostBtn: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 10,
  background: 'transparent',
  border: `1px solid ${warmTheme.border}`,
  borderRadius: 6,
  color: warmTheme.text,
  cursor: 'pointer',
  fontFamily: 'Georgia, serif',
};
