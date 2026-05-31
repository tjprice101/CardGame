import { useEffect, useMemo, useState } from 'react';
import { useFriendsStore, selectFriendsList, selectFriendsLoaded } from '@/state/friendsStore';
import { useSocialStore } from '@/state/socialStore';
import { useBattlegroundStore } from '@/state/battlegroundStore';
import { useStore } from '@/state/store';
import { usePartyStore } from '@/state/partyStore';
import { uiTypography } from '@/ui/theme';

const MODE_THEME = {
  general: {
    bg: 'radial-gradient(circle at 50% 0%, rgba(40,20,60,0.96) 0%, rgba(10,5,18,0.98) 55%, rgba(4,2,8,0.99) 100%)',
    accent: 'rgba(255,220,190,0.68)',
    title: 'Card-bound Co-op',
    subtitle: 'Global party, invites, ready-up, squad chat, and activity launch control.',
  },
  battleground: {
    bg: 'radial-gradient(circle at 50% 0%, rgba(82,20,20,0.95) 0%, rgba(24,6,6,0.98) 56%, rgba(8,2,2,0.99) 100%)',
    accent: 'rgba(255,160,140,0.84)',
    title: 'Card-bound Co-op · Battleground Command',
    subtitle: 'PvP challenge mode. Pick one party member and issue a battleground challenge.',
  },
  null_raid: {
    bg: 'radial-gradient(circle at 50% 0%, rgba(70,32,112,0.95) 0%, rgba(16,8,34,0.98) 55%, rgba(6,3,16,0.99) 100%)',
    accent: 'rgba(198,166,255,0.84)',
    title: 'Card-bound Co-op · Null Raid Command',
    subtitle: 'Ascension party mode. Manage your squad before launching a Null Raid.',
  },
  eternity_boss: {
    bg: 'radial-gradient(circle at 50% 0%, rgba(96,22,36,0.95) 0%, rgba(24,8,14,0.98) 56%, rgba(8,3,6,0.99) 100%)',
    accent: 'rgba(255,168,168,0.84)',
    title: "Card-bound Co-op · Eternity's Wake Command",
    subtitle: 'Boss co-op mode. Coordinate your party before launching a Wake fight.',
  },
} as const;

export default function CardBoundCoopHub({ onClose }: { onClose: () => void }) {
  const activePartyId = usePartyStore(s => s.activePartyId);
  const members = usePartyStore(s => s.members);
  const overlayHidden = usePartyStore(s => s.overlayHidden);
  const activityDraft = usePartyStore(s => s.activityDraft);
  const createParty = usePartyStore(s => s.createParty);
  const leaveParty = usePartyStore(s => s.leaveParty);
  const setOverlayHidden = usePartyStore(s => s.setOverlayHidden);
  const inviteFriend = usePartyStore(s => s.inviteFriend);
  const setActivityDraft = usePartyStore(s => s.setActivityDraft);
  const me = useSocialStore(s => s.user?.id ?? null);
  const sendBattlegroundInvite = useBattlegroundStore(s => s.sendInvite);
  const enqueueToast = useStore(s => s.enqueueToast);
  const friends = useFriendsStore(selectFriendsList);
  const friendsLoaded = useFriendsStore(selectFriendsLoaded);
  const loadFriends = useFriendsStore(s => s.load);
  const [busy, setBusy] = useState(false);
  const [sendingBattleTo, setSendingBattleTo] = useState<string | null>(null);

  useEffect(() => { if (!friendsLoaded) void loadFriends(); }, [friendsLoaded, loadFriends]);
  const inviteables = useMemo(() => friends.filter(f => !members.some(m => m.userId === f.other.id)), [friends, members]);
  const mode = activityDraft?.type ?? 'general';
  const theme = MODE_THEME[mode];
  const partyTargets = members.filter(m => m.userId !== me);

  async function handleChallengePartyMember(userId: string, displayName: string, avatarId: string, titleId: string | null) {
    if (sendingBattleTo) return;
    setSendingBattleTo(userId);
    const sessionId = await sendBattlegroundInvite(userId, { displayName, avatarId, titleId });
    if (!sessionId) {
      enqueueToast('Could not send battleground challenge from party.', 'warning');
      setSendingBattleTo(null);
      return;
    }
    enqueueToast(`Battleground challenge sent to ${displayName}.`, 'success');
    setSendingBattleTo(null);
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 34, background: theme.bg, color: '#f0e8e0', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,0.04) 0%, transparent 20%, transparent 80%, rgba(255,255,255,0.03) 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: theme.accent, fontFamily: uiTypography.display }}>Social Home</div>
            <div style={{ fontSize: 26, fontFamily: uiTypography.display, letterSpacing: 1.8 }}>{theme.title}</div>
            <div style={{ fontSize: 12, color: 'rgba(240,220,210,0.68)', marginTop: 4 }}>{theme.subtitle}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="menu-tactile-btn" onClick={() => void createParty()} style={{ padding: '8px 12px', borderRadius: 8 }}>Create Party</button>
            <button className="menu-tactile-btn" onClick={() => setOverlayHidden(!overlayHidden)} style={{ padding: '8px 12px', borderRadius: 8 }}>{overlayHidden ? 'Show Overlay' : 'Hide Overlay'}</button>
            <button className="menu-tactile-btn" onClick={onClose} style={{ padding: '8px 12px', borderRadius: 8 }}>Close</button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18, padding: 18, overflow: 'hidden' }}>
          <section style={{ background: 'rgba(12,6,18,0.72)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 18, overflow: 'auto' }}>
            <div style={{ fontSize: 11, letterSpacing: 2.8, textTransform: 'uppercase', color: 'rgba(255,220,190,0.62)', fontFamily: uiTypography.display }}>Party Controls</div>
            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 14 }}>Status: {activePartyId ? `Active (${members.length}/4)` : 'No active party'}</div>
                <button className="menu-tactile-btn" onClick={() => void leaveParty()} style={{ padding: '7px 12px', borderRadius: 8 }}>Leave/Disband</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {members.map(member => (
                  <div key={member.userId} style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontFamily: uiTypography.display }}>{member.displayName} {member.role === 'host' ? '(Leader)' : ''}</div>
                      <div style={{ fontSize: 11, color: 'rgba(240,220,210,0.62)' }}>{member.ready ? 'Ready' : 'Not ready'}</div>
                    </div>
                    <button className="menu-tactile-btn" onClick={() => void inviteFriend(member.userId)} style={{ display: 'none' }}>noop</button>
                  </div>
                ))}
              </div>
              {!activePartyId && (
                <button className="menu-tactile-btn" onClick={() => { setBusy(true); void createParty().finally(() => setBusy(false)); }} style={{ padding: 14, borderRadius: 12 }}>{busy ? 'Creating...' : 'Create Global Party'}</button>
              )}
              <div style={{ fontSize: 12, color: 'rgba(240,220,210,0.64)' }}>{activityDraft ? `Selected activity: ${activityDraft.label}` : 'No activity selected yet.'}</div>
            </div>
          </section>

          <section style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr', gap: 18 }}>
            <div style={{ background: 'rgba(12,6,18,0.72)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 18 }}>
              <div style={{ fontSize: 11, letterSpacing: 2.8, textTransform: 'uppercase', color: 'rgba(255,220,190,0.62)', fontFamily: uiTypography.display }}>Invite Friends</div>
              <div style={{ marginTop: 10, display: 'grid', gap: 8, maxHeight: 210, overflow: 'auto' }}>
                {inviteables.map(friend => (
                  <div key={friend.other.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize: 12 }}>{friend.other.displayName}</span>
                    <button className="menu-tactile-btn" onClick={() => void inviteFriend(friend.other.id)} style={{ padding: '6px 10px', borderRadius: 8 }}>Invite</button>
                  </div>
                ))}
                {!inviteables.length && <div style={{ fontSize: 12, color: 'rgba(240,220,210,0.55)' }}>No inviteable friends right now.</div>}
              </div>
            </div>

            <div style={{ background: 'rgba(12,6,18,0.72)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 18 }}>
              <div style={{ fontSize: 11, letterSpacing: 2.8, textTransform: 'uppercase', color: 'rgba(255,220,190,0.62)', fontFamily: uiTypography.display }}>Activity Selection</div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, color: 'rgba(240,220,210,0.78)', lineHeight: 1.6 }}>
                  Matchmaking no longer quick-queues from this hub. Create your party here first, then choose the exact activity from Battleground, Ascension, or Eternity's Wake.
                </div>
                {activityDraft && (
                  <button className="menu-tactile-btn" onClick={() => setActivityDraft(null)} style={{ padding: '10px 12px', borderRadius: 10 }}>
                    Clear Selected Activity
                  </button>
                )}
              </div>
            </div>

            <div style={{ background: 'rgba(12,6,18,0.72)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 18 }}>
              <div style={{ fontSize: 11, letterSpacing: 2.8, textTransform: 'uppercase', color: 'rgba(255,220,190,0.62)', fontFamily: uiTypography.display }}>
                {mode === 'battleground' ? 'Battleground Actions' : 'Overlay'}
              </div>
              {mode === 'battleground' && (
                <div style={{ marginTop: 10, display: 'grid', gap: 8, maxHeight: 210, overflowY: 'auto' }}>
                  {partyTargets.map(member => {
                    const sending = sendingBattleTo === member.userId;
                    return (
                      <div key={member.userId} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,140,120,0.28)', background: 'rgba(255,110,90,0.10)' }}>
                        <span style={{ fontSize: 12 }}>{member.displayName}</span>
                        <button
                          className="menu-tactile-btn"
                          disabled={!!sendingBattleTo}
                          onClick={() => void handleChallengePartyMember(member.userId, member.displayName, member.avatarId, member.titleId)}
                          style={{ padding: '6px 10px', borderRadius: 8, opacity: sendingBattleTo && !sending ? 0.45 : 1 }}
                        >
                          {sending ? 'Sending...' : 'Challenge'}
                        </button>
                      </div>
                    );
                  })}
                  {partyTargets.length === 0 && <div style={{ fontSize: 12, color: 'rgba(240,220,210,0.55)' }}>Invite at least one party member to issue a battleground challenge.</div>}
                </div>
              )}
              <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(240,220,210,0.72)', lineHeight: 1.6 }}>
                {mode === 'battleground'
                  ? 'Battleground mode uses red command cards and direct Challenge actions from your party roster.'
                  : 'Any activity that creates or joins a party appears here. Press P to hide or show the floating party overlay in any menu.'}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
