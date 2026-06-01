import { useEffect, useMemo, useState } from 'react';
import { useFriendsStore, selectFriendsList, selectFriendsLoaded } from '@/state/friendsStore';
import { useSocialStore } from '@/state/socialStore';
import { usePartyStore } from '@/state/partyStore';
import { uiTypography, type UiPalette } from '@/ui/theme';
import { DEFAULT_UI_THEME_ID, getEffectiveThemePalette, isThemeOscillating } from '@/data/profile/uiThemes';
import { useStore, selectProgress, selectProfile } from '@/state/store';

export default function PartyHub() {
  const activePartyId = usePartyStore(s => s.activePartyId);
  const members = usePartyStore(s => s.members);
  const chat = usePartyStore(s => s.chat);
  const incomingInvite = usePartyStore(s => s.incomingInvite);
  const hubOpen = usePartyStore(s => s.hubOpen);
  const overlayHidden = usePartyStore(s => s.overlayHidden);
  const activityDraft = usePartyStore(s => s.activityDraft);
  const createParty = usePartyStore(s => s.createParty);
  const leaveParty = usePartyStore(s => s.leaveParty);
  const kickMember = usePartyStore(s => s.kickMember);
  const setReady = usePartyStore(s => s.setReady);
  const sendMessage = usePartyStore(s => s.sendMessage);
  const inviteFriend = usePartyStore(s => s.inviteFriend);
  const toggleOverlayHidden = usePartyStore(s => s.toggleOverlayHidden);
  const me = useSocialStore(s => s.user?.id ?? null);
  const friends = useFriendsStore(selectFriendsList);
  const friendsLoaded = useFriendsStore(selectFriendsLoaded);
  const loadFriends = useFriendsStore(s => s.load);
  const [message, setMessage] = useState('');
  const [themeNowMs, setThemeNowMs] = useState<number>(() => Date.now());
  const profile = useStore(selectProfile);
  const progress = useStore(selectProgress);

  useEffect(() => { if (!friendsLoaded) void loadFriends(); }, [friendsLoaded, loadFriends]);
  useEffect(() => {
    const themeId = profile.uiThemeId || DEFAULT_UI_THEME_ID;
    if (!isThemeOscillating(themeId)) return;
    const id = setInterval(() => setThemeNowMs(Date.now()), 180);
    return () => clearInterval(id);
  }, [profile.uiThemeId]);

  const host = members.find(m => m.role === 'host');
  const partyLabel = activityDraft?.label ?? 'Card-bound Co-op';
  const mode = activityDraft?.type ?? 'general';
  const uiTheme = useMemo<UiPalette>(() => {
    return getEffectiveThemePalette(
      profile.uiThemeId || DEFAULT_UI_THEME_ID,
      profile.customUiTheme,
      progress,
      themeNowMs,
    );
  }, [profile.uiThemeId, profile.customUiTheme, progress, themeNowMs]);
  const modeAccent = mode === 'battleground'
    ? '#ff9f8f'
    : mode === 'null_raid'
      ? '#cdb2ff'
      : mode === 'eternity_boss'
        ? '#ffb0b0'
        : uiTheme.textMuted;
  const modeCaption = mode === 'battleground'
    ? 'PvP Command'
    : mode === 'null_raid'
      ? 'Null Raid Command'
      : mode === 'eternity_boss'
        ? "Eternity's Wake Command"
        : 'General Party';
  const visibleFriends = useMemo(() => friends.filter(f => !members.some(m => m.userId === f.other.id)), [friends, members]);
  const localMemberId = me ?? (members.length === 1 ? members[0]?.userId ?? null : null);

  if (!hubOpen && !activePartyId && !incomingInvite) return null;

  return (
    <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 12030, width: 'min(420px, calc(100vw - 24px))', pointerEvents: overlayHidden ? 'none' : 'auto', opacity: overlayHidden ? 0 : 1, transform: overlayHidden ? 'translateY(-8px)' : 'translateY(0)', transition: 'opacity 160ms ease, transform 160ms ease' }}>
      <div style={{ background: uiTheme.surfaceStrong, border: `1px solid ${uiTheme.borderStrong}`, borderRadius: 18, boxShadow: uiTheme.shadow, color: uiTheme.text, fontFamily: uiTypography.body, overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderBottom: `1px solid ${uiTheme.border}` }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: modeAccent, fontFamily: uiTypography.display }}>{modeCaption}</div>
            <div style={{ fontFamily: uiTypography.display, fontSize: 16, letterSpacing: 0.5 }}>{partyLabel}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="menu-tactile-btn" onClick={() => toggleOverlayHidden()} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${uiTheme.border}`, background: uiTheme.surfaceMuted, color: uiTheme.textMuted, fontSize: 11 }}> {overlayHidden ? 'Show' : 'Hide'} </button>
            <button className="menu-tactile-btn" onClick={() => void leaveParty()} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${uiTheme.borderStrong}`, background: uiTheme.surface, color: uiTheme.accentSoft, fontSize: 11 }}>Leave</button>
          </div>
        </div>

        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontSize: 12, color: uiTheme.textSoft }}>Party {members.length}/4</div>
            <div style={{ fontSize: 11, color: uiTheme.textMuted }}>{host ? `Leader: ${host.displayName}` : 'No active party'}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            {members.map(member => (
              <div key={member.userId} style={{ padding: 10, borderRadius: 10, border: `1px solid ${member.ready ? uiTheme.success : uiTheme.border}`, background: member.ready ? 'rgba(90,180,120,0.14)' : uiTheme.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontFamily: uiTypography.display }}>{member.displayName}{member.role === 'host' ? ' · Host' : ''}</div>
                  <div style={{ fontSize: 10, color: member.ready ? uiTheme.success : uiTheme.textMuted }}>{member.ready ? 'Ready' : 'Not ready'}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  {member.userId === localMemberId ? (
                    <button className="menu-tactile-btn" onClick={() => void setReady(!member.ready)} style={{ padding: '4px 10px', borderRadius: 999, border: `1px solid ${member.ready ? 'rgba(120, 220, 160, 0.7)' : uiTheme.borderStrong}`, background: member.ready ? 'linear-gradient(180deg, rgba(56, 122, 76, 0.98), rgba(35, 82, 50, 0.98))' : 'linear-gradient(180deg, rgba(80, 124, 188, 0.98), rgba(52, 84, 136, 0.98))', fontSize: 10, minWidth: 76, color: '#ffffff', fontWeight: 700, boxShadow: '0 6px 14px rgba(0,0,0,0.22)' }}>
                      {member.ready ? 'Unready' : 'Ready up'}
                    </button>
                  ) : (
                    <div style={{ fontSize: 10, color: member.ready ? uiTheme.success : uiTheme.textMuted, minWidth: 68, textAlign: 'right' }}>
                      {member.ready ? 'Ready' : 'Waiting'}
                    </div>
                  )}
                  {host?.userId === me && member.userId !== me && (
                    <button className="menu-tactile-btn" onClick={() => void kickMember(member.userId)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${uiTheme.borderStrong}`, background: uiTheme.surfaceMuted, color: uiTheme.accentSoft, fontSize: 10 }}>Kick</button>
                  )}
                </div>
              </div>
            ))}
            {members.length === 0 && (
              <button className="menu-tactile-btn" onClick={() => void createParty()} style={{ gridColumn: '1 / -1', padding: 14, borderRadius: 10, border: `1px dashed ${uiTheme.borderStrong}`, background: uiTheme.surfaceMuted, color: uiTheme.text, fontSize: 12 }}>Create Party</button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: uiTheme.textMuted, fontFamily: uiTypography.display }}>Invite Friends</div>
            <div style={{ display: 'grid', gap: 6, maxHeight: 124, overflowY: 'auto' }}>
              {visibleFriends.slice(0, 8).map(friend => (
                <div key={friend.other.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 10px', border: `1px solid ${uiTheme.border}`, borderRadius: 10, background: uiTheme.surfaceMuted }}>
                  <span style={{ fontSize: 12 }}>{friend.other.displayName}</span>
                  <button className="menu-tactile-btn" onClick={() => void inviteFriend(friend.other.id)} style={{ padding: '5px 9px', borderRadius: 6, border: `1px solid ${uiTheme.borderStrong}`, background: uiTheme.button, color: uiTheme.accentDeep, fontSize: 10 }}>Invite</button>
                </div>
              ))}
              {visibleFriends.length === 0 && <div style={{ fontSize: 11, color: uiTheme.textMuted }}>No inviteable friends available.</div>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: uiTheme.textMuted, fontFamily: uiTypography.display }}>Squad Chat</div>
            <div style={{ maxHeight: 150, overflowY: 'auto', border: `1px solid ${uiTheme.border}`, borderRadius: 10, padding: 10, background: uiTheme.surfaceMuted, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {chat.map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontSize: 11, color: uiTheme.textSoft }}>{msg.fromDisplayName}</div>
                  <div style={{ fontSize: 12 }}>{msg.body}</div>
                </div>
              ))}
              {chat.length === 0 && <div style={{ fontSize: 11, color: uiTheme.textMuted }}>No chat yet.</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Send a party message..." style={{ flex: 1, borderRadius: 8, border: `1px solid ${uiTheme.border}`, background: uiTheme.surface, color: uiTheme.text, padding: '10px 12px', outline: 'none' }} />
              <button className="menu-tactile-btn" onClick={() => { void sendMessage(message); setMessage(''); }} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${uiTheme.borderStrong}`, background: uiTheme.button, color: uiTheme.accentDeep }}>Send</button>
            </div>
          </div>

          <div style={{ fontSize: 11, color: uiTheme.textMuted }}>Hotkey: press P to hide/show this overlay.</div>
        </div>
      </div>
    </div>
  );
}
