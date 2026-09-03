import { useEffect, useMemo, useState } from 'react';
import { useFriendsStore, selectFriendsList, selectFriendsLoaded } from '@/state/friendsStore';
import { useSocialStore } from '@/state/socialStore';
import { useBattlegroundStore } from '@/state/battlegroundStore';
import { useEternityBossCoopStore } from '@/state/eternityBossCoopStore';
import { useCoopRaidStore } from '@/state/coopRaidStore';
import { useStore } from '@/state/store';
import { usePartyStore } from '@/state/partyStore';
import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';
import { NULL_RAID_DEFINITIONS } from '@/data/ascension/nullRaidDefinitions';
import { uiTypography, type UiPalette } from '@/ui/theme';
import { DEFAULT_UI_THEME_ID, getEffectiveThemePalette, isThemeOscillating } from '@/data/profile/uiThemes';

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
  const setReady = usePartyStore(s => s.setReady);
  const setOverlayHidden = usePartyStore(s => s.setOverlayHidden);
  const inviteFriend = usePartyStore(s => s.inviteFriend);
  const setActivityDraft = usePartyStore(s => s.setActivityDraft);
  const me = useSocialStore(s => s.user?.id ?? null);
  const sendBattlegroundInvite = useBattlegroundStore(s => s.sendInvite);
  const sendRaidInvites = useCoopRaidStore(s => s.sendInvites);
  const sendEternityInvites = useEternityBossCoopStore(s => s.sendInvites);
  const enqueueToast = useStore(s => s.enqueueToast);
  const profile = useStore(s => s.progress.profile);
  const progress = useStore(s => s.progress);
  const friends = useFriendsStore(selectFriendsList);
  const friendsLoaded = useFriendsStore(selectFriendsLoaded);
  const loadFriends = useFriendsStore(s => s.load);
  const [busy, setBusy] = useState(false);
  const [sendingBattleTo, setSendingBattleTo] = useState<string | null>(null);
  const [themeNowMs, setThemeNowMs] = useState<number>(() => Date.now());

  useEffect(() => { if (!friendsLoaded) void loadFriends(); }, [friendsLoaded, loadFriends]);
  useEffect(() => {
    const themeId = profile.uiThemeId || DEFAULT_UI_THEME_ID;
    if (!isThemeOscillating(themeId)) return;
    const id = setInterval(() => setThemeNowMs(Date.now()), 180);
    return () => clearInterval(id);
  }, [profile.uiThemeId]);
  const inviteables = useMemo(() => friends.filter(f => !members.some(m => m.userId === f.other.id)), [friends, members]);
  const mode = activityDraft?.type ?? 'general';
  const modeTheme = MODE_THEME[mode];
  const partyTargets = members.filter(m => m.userId !== me);
  const localMemberId = me ?? (members.length === 1 ? members[0]?.userId ?? null : null);
  const eternityDraft = activityDraft?.type === 'eternity_boss' ? activityDraft : null;
  const nullRaidDraft = activityDraft?.type === 'null_raid' ? activityDraft : null;
  const uiTheme = useMemo<UiPalette>(() => {
    return getEffectiveThemePalette(
      profile.uiThemeId || DEFAULT_UI_THEME_ID,
      profile.customUiTheme,
      progress,
      themeNowMs,
    );
  }, [profile.uiThemeId, profile.customUiTheme, progress, themeNowMs]);
  const selectedBoss = eternityDraft ? BOSS_DEFINITIONS.find(boss => boss.id === eternityDraft.bossId) ?? null : null;
  const selectedRaid = nullRaidDraft ? NULL_RAID_DEFINITIONS.find(raid => raid.id === nullRaidDraft.raidId) ?? null : null;
  const selectedDeckId = eternityDraft ? (eternityDraft.deckId ?? progress.savedDecks[0]?.id ?? '') : '';
  const selectedDeck = eternityDraft
    ? progress.savedDecks.find(deck => deck.id === selectedDeckId) ?? null
    : null;
  const selectedRaidDeckId = nullRaidDraft ? (nullRaidDraft.deckId ?? progress.savedDecks[0]?.id ?? '') : '';
  const selectedRaidDeck = nullRaidDraft
    ? progress.savedDecks.find(deck => deck.id === selectedRaidDeckId) ?? null
    : null;
  const allPartyReady = members.length > 0 && members.every(member => member.ready);
  const coOpInviteTargets = partyTargets.slice(0, 2);
  const raidInviteTargets = partyTargets.slice(0, 4);

  async function handleSetEternityDeck(deckId: string) {
    if (!eternityDraft) return;
    setActivityDraft({ ...eternityDraft, deckId });
  }

  async function handleSetNullRaidDeck(deckId: string) {
    if (!nullRaidDraft) return;
    setActivityDraft({ ...nullRaidDraft, deckId });
  }

  async function handleStartEternityCoop() {
    if (!eternityDraft?.bossId) return;
    if (!selectedDeck) {
      enqueueToast('Pick a deck first.', 'warning');
      return;
    }
    if (members.length < 2) {
      enqueueToast('You need at least two players in the party.', 'warning');
      return;
    }
    if (partyTargets.length === 0) {
      enqueueToast('Invite party members before starting co-op.', 'warning');
      return;
    }
    if (partyTargets.length > 2) {
      enqueueToast('Wake co-op supports up to 3 players.', 'warning');
      return;
    }
    if (!allPartyReady) {
      enqueueToast('Everyone needs to ready up first.', 'warning');
      return;
    }
    if (!selectedBoss) {
      enqueueToast("That boss isn't available right now.", 'warning');
      return;
    }
    const sessionId = await sendEternityInvites(
      coOpInviteTargets.map(member => ({ id: member.userId, displayName: member.displayName, avatarId: member.avatarId, titleId: member.titleId })),
      selectedBoss.id,
      selectedDeck.id,
    );
    if (!sessionId) {
      enqueueToast("Couldn't start the fight.", 'warning');
      return;
    }
    enqueueToast(`Co-op fight launched for ${selectedBoss.name}.`, 'success');
  }

  async function handleStartNullRaidCoop() {
    if (!nullRaidDraft?.raidId) return;
    if (!selectedRaidDeck) {
      enqueueToast('Pick a deck first.', 'warning');
      return;
    }
    if (members.length < 2) {
      enqueueToast('You need at least two players in the party.', 'warning');
      return;
    }
    if (partyTargets.length === 0) {
      enqueueToast('Invite party members before starting co-op.', 'warning');
      return;
    }
    if (partyTargets.length > 4) {
      enqueueToast('Null Raid co-op supports up to 5 players.', 'warning');
      return;
    }
    if (!allPartyReady) {
      enqueueToast('Everyone needs to ready up first.', 'warning');
      return;
    }

    const sessionId = await sendRaidInvites(
      raidInviteTargets.map(member => ({ id: member.userId, displayName: member.displayName, avatarId: member.avatarId, titleId: member.titleId })),
      nullRaidDraft.raidId,
      selectedRaidDeck.id,
    );
    if (!sessionId) {
      enqueueToast("Couldn't start the raid.", 'warning');
      return;
    }
    enqueueToast(`Co-op null raid launched for ${selectedRaid?.name ?? nullRaidDraft.raidId}.`, 'success');
  }

  async function handleChallengePartyMember(userId: string, displayName: string, avatarId: string, titleId: string | null) {
    if (sendingBattleTo) return;
    setSendingBattleTo(userId);
    const sessionId = await sendBattlegroundInvite(userId, { displayName, avatarId, titleId });
    if (!sessionId) {
      enqueueToast("Couldn't send the challenge.", 'warning');
      setSendingBattleTo(null);
      return;
    }
    enqueueToast(`Battleground challenge sent to ${displayName}.`, 'success');
    setSendingBattleTo(null);
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 34, background: uiTheme.appBackground, color: uiTheme.text, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: uiTheme.backdrop, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 24px', borderBottom: `1px solid ${uiTheme.border}` }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: uiTheme.accentSoft, fontFamily: uiTypography.display }}>Social Home</div>
            <div style={{ fontSize: 26, fontFamily: uiTypography.display, letterSpacing: 1.8 }}>{modeTheme.title}</div>
            <div style={{ fontSize: 12, color: uiTheme.textMuted, marginTop: 4 }}>{modeTheme.subtitle}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="menu-tactile-btn" onClick={() => void createParty()} style={{ padding: '8px 12px', borderRadius: 8, background: uiTheme.button, color: uiTheme.accentDeep, border: `1px solid ${uiTheme.borderStrong}` }}>Create Party</button>
            <button className="menu-tactile-btn" onClick={() => setOverlayHidden(!overlayHidden)} style={{ padding: '8px 12px', borderRadius: 8, background: uiTheme.surfaceMuted, color: uiTheme.textMuted, border: `1px solid ${uiTheme.border}` }}>{overlayHidden ? 'Show Overlay' : 'Hide Overlay'}</button>
            <button className="menu-tactile-btn" onClick={onClose} style={{ padding: '8px 12px', borderRadius: 8, background: uiTheme.surfaceMuted, color: uiTheme.textMuted, border: `1px solid ${uiTheme.border}` }}>Close</button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18, padding: 18, overflow: 'hidden' }}>
          <section style={{ background: uiTheme.surfaceStrong, border: `1px solid ${uiTheme.border}`, borderRadius: 18, padding: 18, overflow: 'auto' }}>
            <div style={{ fontSize: 11, letterSpacing: 2.8, textTransform: 'uppercase', color: uiTheme.accentSoft, fontFamily: uiTypography.display }}>Party Controls</div>
            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 14 }}>Status: {activePartyId ? `Active (${members.length}/5)` : 'No active party'}</div>
                <button className="menu-tactile-btn" onClick={() => void leaveParty()} style={{ padding: '7px 12px', borderRadius: 8, background: uiTheme.surfaceMuted, color: uiTheme.textMuted, border: `1px solid ${uiTheme.border}` }}>Leave/Disband</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {members.map(member => (
                  <div key={member.userId} style={{ padding: 12, borderRadius: 12, border: `1px solid ${uiTheme.border}`, background: uiTheme.surfaceMuted, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontFamily: uiTypography.display }}>{member.displayName} {member.role === 'host' ? '(Leader)' : ''}</div>
                      <div style={{ fontSize: 11, color: uiTheme.textMuted }}>{member.ready ? 'Ready' : 'Not ready'}</div>
                    </div>
                    {member.userId === localMemberId ? (
                      <button
                        className="menu-tactile-btn"
                        onClick={() => void setReady(!member.ready)}
                        style={{
                          padding: '7px 12px',
                          borderRadius: 999,
                          border: `1px solid ${member.ready ? 'rgba(120, 220, 160, 0.74)' : uiTheme.borderStrong}`,
                          background: member.ready
                            ? 'linear-gradient(180deg, rgba(56, 122, 76, 0.98), rgba(35, 82, 50, 0.98))'
                            : 'linear-gradient(180deg, rgba(80, 124, 188, 0.98), rgba(52, 84, 136, 0.98))',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: 11,
                          minWidth: 88,
                          alignSelf: 'center',
                          boxShadow: '0 6px 14px rgba(0,0,0,0.22)',
                        }}
                      >
                        {member.ready ? 'Unready' : 'Ready up'}
                      </button>
                    ) : (
                      <div style={{ alignSelf: 'center', fontSize: 11, color: member.ready ? uiTheme.success : uiTheme.textMuted }}>
                        {member.ready ? 'Ready' : 'Waiting'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {!activePartyId && (
                <button className="menu-tactile-btn" onClick={() => { setBusy(true); void createParty().finally(() => setBusy(false)); }} style={{ padding: 14, borderRadius: 12, background: uiTheme.button, color: uiTheme.accentDeep, border: `1px solid ${uiTheme.borderStrong}` }}>{busy ? 'Creating...' : 'Create Global Party'}</button>
              )}
              <div style={{ fontSize: 12, color: uiTheme.textMuted }}>{activityDraft ? `Selected activity: ${activityDraft.label}` : 'No activity selected yet.'}</div>
            </div>
          </section>

          <section style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr', gap: 18 }}>
            {mode === 'eternity_boss' && selectedBoss && (
              <div style={{ background: uiTheme.surfaceStrong, border: `1px solid ${uiTheme.border}`, borderRadius: 18, padding: 18 }}>
                <div style={{ fontSize: 11, letterSpacing: 2.8, textTransform: 'uppercase', color: uiTheme.accentSoft, fontFamily: uiTypography.display }}>Eternity Setup</div>
                <div style={{ marginTop: 10, fontSize: 13, fontFamily: uiTypography.display }}>{selectedBoss.name}</div>
                <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                  <div style={{ fontSize: 12, color: uiTheme.textSoft }}>Choose a deck for co-op, then wait for every party member to ready up.</div>
                  <div style={{ display: 'grid', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                    {progress.savedDecks.map(deck => {
                      const active = deck.id === selectedDeckId;
                      return (
                        <button
                          key={deck.id}
                          className="menu-tactile-btn"
                          onClick={() => void handleSetEternityDeck(deck.id)}
                          style={{
                            display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center',
                            padding: '8px 10px', borderRadius: 10,
                            border: `1px solid ${active ? uiTheme.borderStrong : uiTheme.border}`,
                            background: active ? uiTheme.surface : uiTheme.surfaceMuted,
                            color: uiTheme.text,
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <span style={{ fontSize: 12 }}>{deck.name}</span>
                          <span style={{ fontSize: 10, color: active ? uiTheme.accentSoft : uiTheme.textMuted }}>{active ? 'Selected' : 'Choose'}</span>
                        </button>
                      );
                    })}
                    {!progress.savedDecks.length && <div style={{ fontSize: 12, color: uiTheme.textMuted }}>No saved decks available.</div>}
                  </div>
                  <div style={{ fontSize: 12, color: uiTheme.textMuted }}>Ready status: {allPartyReady ? 'Everyone is ready' : 'Waiting for party members'}</div>
                  {members.length < 2 && (
                    <div style={{ fontSize: 11, color: 'rgba(255,160,140,0.88)', lineHeight: 1.4 }}>
                      You need at least two players in the party.
                    </div>
                  )}
                  <button
                    className="menu-tactile-btn"
                    onClick={() => void handleStartEternityCoop()}
                    style={{
                      padding: '10px 12px', borderRadius: 10,
                      background: uiTheme.button,
                      color: uiTheme.accentDeep,
                      border: `1px solid ${uiTheme.borderStrong}`,
                      opacity: selectedDeck ? 1 : 0.55,
                      cursor: selectedDeck ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Start Co-op Fight
                  </button>
                </div>
              </div>
            )}

            {mode === 'null_raid' && nullRaidDraft && (
              <div style={{ background: uiTheme.surfaceStrong, border: `1px solid ${uiTheme.border}`, borderRadius: 18, padding: 18 }}>
                <div style={{ fontSize: 11, letterSpacing: 2.8, textTransform: 'uppercase', color: uiTheme.accentSoft, fontFamily: uiTypography.display }}>Null Raid Setup</div>
                <div style={{ marginTop: 10, fontSize: 13, fontFamily: uiTypography.display }}>{selectedRaid?.name ?? nullRaidDraft.raidId}</div>
                <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                  <div style={{ fontSize: 12, color: uiTheme.textSoft }}>Choose a deck for the raid, then wait for everyone to ready up.</div>
                  <div style={{ display: 'grid', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                    {progress.savedDecks.map(deck => {
                      const active = deck.id === selectedRaidDeckId;
                      return (
                        <button
                          key={deck.id}
                          className="menu-tactile-btn"
                          onClick={() => void handleSetNullRaidDeck(deck.id)}
                          style={{
                            display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center',
                            padding: '8px 10px', borderRadius: 10,
                            border: `1px solid ${active ? uiTheme.borderStrong : uiTheme.border}`,
                            background: active ? uiTheme.surface : uiTheme.surfaceMuted,
                            color: uiTheme.text,
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <span style={{ fontSize: 12 }}>{deck.name}</span>
                          <span style={{ fontSize: 10, color: active ? uiTheme.accentSoft : uiTheme.textMuted }}>{active ? 'Selected' : 'Choose'}</span>
                        </button>
                      );
                    })}
                    {!progress.savedDecks.length && <div style={{ fontSize: 12, color: uiTheme.textMuted }}>No saved decks available.</div>}
                  </div>
                  <div style={{ fontSize: 12, color: uiTheme.textMuted }}>Ready status: {allPartyReady ? 'Everyone is ready' : 'Waiting for party members'}</div>
                  {members.length < 2 && (
                    <div style={{ fontSize: 11, color: 'rgba(255,160,140,0.88)', lineHeight: 1.4 }}>
                      You need at least two players in the party.
                    </div>
                  )}
                  <button
                    className="menu-tactile-btn"
                    onClick={() => void handleStartNullRaidCoop()}
                    style={{
                      padding: '10px 12px', borderRadius: 10,
                      background: uiTheme.button,
                      color: uiTheme.accentDeep,
                      border: `1px solid ${uiTheme.borderStrong}`,
                      opacity: selectedRaidDeck ? 1 : 0.55,
                      cursor: selectedRaidDeck ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Start Co-op Null Raid
                  </button>
                </div>
              </div>
            )}

            <div style={{ background: uiTheme.surfaceStrong, border: `1px solid ${uiTheme.border}`, borderRadius: 18, padding: 18 }}>
              <div style={{ fontSize: 11, letterSpacing: 2.8, textTransform: 'uppercase', color: uiTheme.accentSoft, fontFamily: uiTypography.display }}>Invite Friends</div>
              <div style={{ marginTop: 10, display: 'grid', gap: 8, maxHeight: 210, overflow: 'auto' }}>
                {inviteables.map(friend => (
                  <div key={friend.other.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', padding: '8px 10px', borderRadius: 10, border: `1px solid ${uiTheme.border}`, background: uiTheme.surfaceMuted }}>
                    <span style={{ fontSize: 12 }}>{friend.other.displayName}</span>
                    <button className="menu-tactile-btn" onClick={() => void inviteFriend(friend.other.id)} style={{ padding: '6px 10px', borderRadius: 8, background: uiTheme.button, color: uiTheme.accentDeep, border: `1px solid ${uiTheme.borderStrong}` }}>Invite</button>
                  </div>
                ))}
                {!inviteables.length && <div style={{ fontSize: 12, color: uiTheme.textMuted }}>No inviteable friends right now.</div>}
              </div>
            </div>

            <div style={{ background: uiTheme.surfaceStrong, border: `1px solid ${uiTheme.border}`, borderRadius: 18, padding: 18 }}>
              <div style={{ fontSize: 11, letterSpacing: 2.8, textTransform: 'uppercase', color: uiTheme.accentSoft, fontFamily: uiTypography.display }}>Activity Selection</div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, color: uiTheme.textSoft, lineHeight: 1.6 }}>
                  Matchmaking no longer quick-queues from this hub. Create your party here first, then choose the exact activity from Battleground, Ascension, or Eternity's Wake.
                </div>
                {activityDraft && (
                  <button className="menu-tactile-btn" onClick={() => setActivityDraft(null)} style={{ padding: '10px 12px', borderRadius: 10, background: uiTheme.surfaceMuted, color: uiTheme.textMuted, border: `1px solid ${uiTheme.border}` }}>
                    Clear Selected Activity
                  </button>
                )}
              </div>
            </div>

            <div style={{ background: uiTheme.surfaceStrong, border: `1px solid ${uiTheme.border}`, borderRadius: 18, padding: 18 }}>
              <div style={{ fontSize: 11, letterSpacing: 2.8, textTransform: 'uppercase', color: modeTheme.accent, fontFamily: uiTypography.display }}>
                {mode === 'battleground' ? 'Battleground Actions' : 'Overlay'}
              </div>
              {mode === 'battleground' && (
                <div style={{ marginTop: 10, display: 'grid', gap: 8, maxHeight: 210, overflowY: 'auto' }}>
                  {partyTargets.map(member => {
                    const sending = sendingBattleTo === member.userId;
                    return (
                      <div key={member.userId} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', padding: '8px 10px', borderRadius: 10, border: `1px solid ${modeTheme.accent}`, background: 'rgba(255,110,90,0.10)' }}>
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
                  {partyTargets.length === 0 && <div style={{ fontSize: 12, color: uiTheme.textMuted }}>Invite at least one party member to issue a battleground challenge.</div>}
                </div>
              )}
              <div style={{ marginTop: 10, fontSize: 12, color: uiTheme.textSoft, lineHeight: 1.6 }}>
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
