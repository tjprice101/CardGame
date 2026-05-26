// FriendsPanel — Phase 2 social UI.
//
// Embedded in ProfilePage below the AuthPanel. Auto-loads + subscribes to
// realtime updates once the user is authenticated; cleans up presence on
// unmount.

import { useEffect, useState, lazy, Suspense, Component, type ReactNode } from 'react';
import { warmTheme } from '@/ui/theme';
import {
  useSocialStore,
  selectSocialStatus,
} from '@/state/socialStore';
import {
  useFriendsStore,
  selectFriendsList,
  selectIncomingRequests,
  selectOutgoingRequests,
  selectBlockedList,
  selectFriendsPresence,
  selectFriendsLoaded,
  selectFriendsError,
  type FriendRequestRow,
  type FriendProfileLite,
} from '@/state/friendsStore';
import { useMessagesStore } from '@/state/messagesStore';

const FriendProfileModal = lazy(() => import('@/ui/social/FriendProfileModal'));
const SendGiftModal = lazy(() => import('@/ui/social/SendGiftModal'));
const GiftInbox = lazy(() => import('@/ui/social/GiftInbox'));
const ActivityFeed = lazy(() => import('@/ui/social/ActivityFeed'));
const FriendsLeaderboard = lazy(() => import('@/ui/social/FriendsLeaderboard'));

type Tab = 'friends' | 'requests' | 'add' | 'blocked' | 'feed' | 'boards';

export default function FriendsPanel() {
  const status = useSocialStore(selectSocialStatus);
  const loaded = useFriendsStore(selectFriendsLoaded);
  const friends = useFriendsStore(selectFriendsList);
  const incoming = useFriendsStore(selectIncomingRequests);
  const outgoing = useFriendsStore(selectOutgoingRequests);
  const blocked = useFriendsStore(selectBlockedList);
  const presence = useFriendsStore(selectFriendsPresence);
  const errorMessage = useFriendsStore(selectFriendsError);

  const load = useFriendsStore(s => s.load);
  const connectPresence = useFriendsStore(s => s.connectPresence);
  const disconnectPresence = useFriendsStore(s => s.disconnectPresence);

  const [tab, setTab] = useState<Tab>('friends');

  useEffect(() => {
    if (status !== 'authenticated') return;
    void load();
    connectPresence();
    return () => disconnectPresence();
  }, [status, load, connectPresence, disconnectPresence]);

  if (status !== 'authenticated') return null;

  const pendingCount = incoming.length;

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        <TabBtn active={tab === 'friends'} onClick={() => setTab('friends')}>
          Friends ({friends.length})
        </TabBtn>
        <TabBtn active={tab === 'requests'} onClick={() => setTab('requests')}>
          Requests{pendingCount > 0 ? ` (${pendingCount})` : ''}
        </TabBtn>
        <TabBtn active={tab === 'add'} onClick={() => setTab('add')}>Add</TabBtn>
        <TabBtn active={tab === 'blocked'} onClick={() => setTab('blocked')}>
          Blocked ({blocked.length})
        </TabBtn>
        <TabBtn active={tab === 'feed'} onClick={() => setTab('feed')}>Feed</TabBtn>
        <TabBtn active={tab === 'boards'} onClick={() => setTab('boards')}>Boards</TabBtn>
      </div>

      {errorMessage && (
        <div style={{ fontSize: 10, color: '#b86060', marginBottom: 6 }}>{errorMessage}</div>
      )}

      {!loaded && <div style={hintStyle}>Loading…</div>}

      {loaded && tab === 'friends' && (
        <FriendsList rows={friends} presence={presence} />
      )}
      {loaded && tab === 'requests' && (
        <RequestsList incoming={incoming} outgoing={outgoing} />
      )}
      {loaded && tab === 'add' && <AddByCode />}
      {loaded && tab === 'blocked' && <BlockedList rows={blocked} />}
      {loaded && tab === 'feed' && (
        <SocialErrorBoundary label="Activity feed">
          <Suspense fallback={<div style={hintStyle}>Loading feed…</div>}>
            <ActivityFeed />
          </Suspense>
        </SocialErrorBoundary>
      )}
      {loaded && tab === 'boards' && (
        <SocialErrorBoundary label="Leaderboards">
          <Suspense fallback={<div style={hintStyle}>Loading boards…</div>}>
            <FriendsLeaderboard />
          </Suspense>
        </SocialErrorBoundary>
      )}

      <SocialErrorBoundary label="Gift inbox" silent>
        <Suspense fallback={null}><GiftInbox /></Suspense>
      </SocialErrorBoundary>
    </div>
  );
}

// Tiny error boundary so a thrown render error in a lazy social subtree does
// not take down the whole profile page. Surfaces the message inline.
class SocialErrorBoundary extends Component<
  { children: ReactNode; label: string; silent?: boolean },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: { componentStack?: string }) {
    // eslint-disable-next-line no-console
    console.error(`[social:${this.props.label}]`, error, info);
  }
  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.silent) return null;
    return (
      <div style={{
        fontSize: 10,
        color: '#b86060',
        padding: '6px 8px',
        border: '1px solid rgba(184,96,96,0.45)',
        background: 'rgba(184,96,96,0.08)',
        borderRadius: 6,
        whiteSpace: 'pre-wrap',
      }}>
        <strong>{this.props.label} failed:</strong> {String(this.state.error?.message ?? this.state.error)}
      </div>
    );
  }
}

function FriendsList({
  rows, presence,
}: { rows: FriendRequestRow[]; presence: Readonly<Record<string, boolean>> }) {
  const unfriend = useFriendsStore(s => s.unfriend);
  const blockUser = useFriendsStore(s => s.blockUser);
  const openConversation = useMessagesStore(s => s.openConversation);
  const [profileTarget, setProfileTarget] = useState<FriendProfileLite | null>(null);
  const [giftTarget, setGiftTarget] = useState<FriendProfileLite | null>(null);
  if (rows.length === 0) {
    return <div style={hintStyle}>No friends yet. Use the Add tab to send a request.</div>;
  }
  return (
    <ul style={listStyle}>
      {rows.map(r => {
        const online = presence[r.other.id] === true;
        return (
          <li key={r.other.id} style={rowStyle}>
            <PresenceDot online={online} />
            <button
              onClick={() => setProfileTarget(r.other)}
              style={identityBtn}
              title="View profile"
            >
              <Identity p={r.other} />
            </button>
            <button style={primaryBtn} onClick={() => void openConversation(r.other.id)}>Message</button>
            <button style={ghostBtn} onClick={() => setGiftTarget(r.other)}>Gift</button>
            <button style={ghostBtn} onClick={() => void unfriend(r.other.id)}>Unfriend</button>
            <button style={ghostBtn} onClick={() => void blockUser(r.other.id)}>Block</button>
          </li>
        );
      })}
      {profileTarget && (
        <Suspense fallback={null}>
          <FriendProfileModal
            profile={profileTarget}
            online={presence[profileTarget.id] === true}
            onClose={() => setProfileTarget(null)}
          />
        </Suspense>
      )}
      {giftTarget && (
        <Suspense fallback={null}>
          <SendGiftModal recipient={giftTarget} onClose={() => setGiftTarget(null)} />
        </Suspense>
      )}
    </ul>
  );
}

function RequestsList({
  incoming, outgoing,
}: { incoming: FriendRequestRow[]; outgoing: FriendRequestRow[] }) {
  const accept = useFriendsStore(s => s.acceptRequest);
  const decline = useFriendsStore(s => s.declineRequest);
  const cancel = useFriendsStore(s => s.cancelOutgoing);

  if (incoming.length === 0 && outgoing.length === 0) {
    return <div style={hintStyle}>No pending requests.</div>;
  }
  return (
    <>
      {incoming.length > 0 && (
        <>
          <SubHeader>Incoming</SubHeader>
          <ul style={listStyle}>
            {incoming.map(r => (
              <li key={r.fromUser} style={rowStyle}>
                <Identity p={r.other} />
                <button style={primaryBtn} onClick={() => void accept(r.fromUser)}>Accept</button>
                <button style={ghostBtn} onClick={() => void decline(r.fromUser)}>Decline</button>
              </li>
            ))}
          </ul>
        </>
      )}
      {outgoing.length > 0 && (
        <>
          <SubHeader>Outgoing</SubHeader>
          <ul style={listStyle}>
            {outgoing.map(r => (
              <li key={r.toUser} style={rowStyle}>
                <Identity p={r.other} />
                <button style={ghostBtn} onClick={() => void cancel(r.toUser)}>Cancel</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function AddByCode() {
  const sendRequest = useFriendsStore(s => s.sendRequestByFriendCode);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit() {
    setLocalError(null);
    setSuccess(null);
    setBusy(true);
    try {
      await sendRequest(code);
      setSuccess('Request sent.');
      setCode('');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div style={{ fontSize: 10, color: warmTheme.textMuted, marginBottom: 6 }}>
        Enter the 8-character friend code of the player you want to add.
      </div>
      <input
        type="text"
        value={code}
        onChange={e => setCode(e.target.value.toUpperCase())}
        maxLength={8}
        placeholder="ABCD2345"
        spellCheck={false}
        style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: 2 }}
      />
      {localError && <div style={{ fontSize: 10, color: '#b86060', marginBottom: 6 }}>{localError}</div>}
      {success && <div style={{ fontSize: 10, color: warmTheme.accentDeep, marginBottom: 6 }}>{success}</div>}
      <button
        disabled={busy || code.length !== 8}
        onClick={() => void submit()}
        style={{
          ...primaryBtn,
          opacity: busy || code.length !== 8 ? 0.5 : 1,
          cursor: busy ? 'wait' : 'pointer',
        }}
      >{busy ? 'Sending…' : 'Send request'}</button>
    </div>
  );
}

function BlockedList({ rows }: { rows: FriendProfileLite[] }) {
  const unblockUser = useFriendsStore(s => s.unblockUser);
  if (rows.length === 0) return <div style={hintStyle}>No blocked players.</div>;
  return (
    <ul style={listStyle}>
      {rows.map(p => (
        <li key={p.id} style={rowStyle}>
          <Identity p={p} />
          <button style={ghostBtn} onClick={() => void unblockUser(p.id)}>Unblock</button>
        </li>
      ))}
    </ul>
  );
}

// --- bits ---

function Identity({ p }: { p: FriendProfileLite }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 'bold', color: warmTheme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {p.displayName}
      </div>
      <div style={{ fontSize: 9, color: warmTheme.textMuted, fontFamily: 'monospace' }}>
        {p.friendCode}
      </div>
    </div>
  );
}

function PresenceDot({ online }: { online: boolean }) {
  return (
    <span
      title={online ? 'Online' : 'Offline'}
      style={{
        width: 8, height: 8, borderRadius: '50%',
        background: online ? '#5fa66a' : '#7a7a7a',
        boxShadow: online ? '0 0 4px #5fa66a' : 'none',
        flexShrink: 0,
      }}
    />
  );
}

function TabBtn({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 8px',
        fontSize: 10,
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

function SubHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
      color: warmTheme.textMuted, margin: '8px 0 4px',
    }}>{children}</div>
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
  fontSize: 10,
  color: warmTheme.textMuted,
  fontStyle: 'italic',
  padding: '4px 0',
};

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  marginBottom: 6,
  fontSize: 12,
  background: 'rgba(0,0,0,0.06)',
  border: `1px solid ${warmTheme.border}`,
  borderRadius: 6,
  color: warmTheme.text,
  fontFamily: 'Georgia, serif',
  boxSizing: 'border-box',
};

const primaryBtn: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: 'bold',
  background: warmTheme.accentSoft,
  border: `1px solid ${warmTheme.accent}`,
  borderRadius: 6,
  color: warmTheme.accentDeep,
  cursor: 'pointer',
  fontFamily: 'Georgia, serif',
};

const ghostBtn: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: 11,
  background: 'transparent',
  border: `1px solid ${warmTheme.border}`,
  borderRadius: 6,
  color: warmTheme.textMuted,
  cursor: 'pointer',
  fontFamily: 'Georgia, serif',
};

const identityBtn: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  background: 'transparent',
  border: 'none',
  padding: 0,
  textAlign: 'left',
  cursor: 'pointer',
  color: 'inherit',
  fontFamily: 'inherit',
};
