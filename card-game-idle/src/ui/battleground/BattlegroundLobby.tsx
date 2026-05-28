import React, { useState, useEffect } from 'react';
import { uiTypography } from '@/ui/theme';
import { useStore, selectProgress } from '@/state/store';
import { useBattlegroundStore } from '@/state/battlegroundStore';
import { useFriendsStore, selectFriendsList, selectFriendsLoaded } from '@/state/friendsStore';
import type { CpuDifficulty } from '@/types/battleground';

interface Props {
  onClose: () => void;
}

type Step =
  | 'select-mode'
  | 'select-cpu-difficulty'
  | 'cpu-ready'          // brief "AI accepted — match starting" countdown
  | 'select-friend'      // friend picker for PvP invite
  | 'pvp-pending';       // waiting for friend to accept/decline

const OVERLAY: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'radial-gradient(ellipse at 50% 30%, rgba(60,8,8,0.82) 0%, rgba(6,3,3,0.96) 100%)',
  zIndex: 10,
};

const PANEL: React.CSSProperties = {
  background: 'linear-gradient(160deg, rgba(22,8,8,0.99) 0%, rgba(12,4,4,0.99) 100%)',
  border: '1px solid rgba(232,80,64,0.40)',
  borderRadius: 20,
  padding: '32px 40px 28px',
  width: 'min(580px, 92vw)',
  display: 'flex',
  flexDirection: 'column',
  gap: 22,
  boxShadow: '0 0 80px rgba(0,0,0,0.75), 0 0 60px rgba(180,30,20,0.18), inset 0 1px 0 rgba(255,255,255,0.05)',
};

const TITLE: React.CSSProperties = {
  fontFamily: uiTypography.display,
  color: '#f0e8e0',
  fontSize: '1.55rem',
  fontWeight: 700,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  margin: 0,
  textShadow: '0 2px 28px rgba(232,80,60,0.42)',
};

const CAPTION: React.CSSProperties = {
  fontFamily: uiTypography.body,
  color: 'rgba(240,220,210,0.65)',
  fontSize: '0.82rem',
  margin: 0,
  letterSpacing: '0.02em',
};

const BTN_ROW: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

function ModeCard({ title, sub, icon, onClick, accent, disabled }: { title: string; sub: string; icon: string; onClick: () => void; accent?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: accent
          ? 'linear-gradient(135deg, rgba(200,60,40,0.32) 0%, rgba(170,35,25,0.20) 100%)'
          : 'rgba(255,255,255,0.04)',
        color: '#f0e8e0',
        border: `1px solid ${accent ? 'rgba(232,80,64,0.58)' : 'rgba(255,255,255,0.10)'}`,
        borderRadius: 14,
        padding: '18px 20px',
        textAlign: 'left',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transition: 'border-color 0.15s, background 0.15s',
        opacity: disabled ? 0.5 : 1,
        boxShadow: accent ? '0 0 20px rgba(232,80,64,0.14)' : 'none',
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.borderColor = accent ? 'rgba(240,100,80,0.88)' : 'rgba(255,255,255,0.22)';
          e.currentTarget.style.background = accent
            ? 'linear-gradient(135deg, rgba(220,70,50,0.46) 0%, rgba(200,50,35,0.30) 100%)'
            : 'rgba(255,255,255,0.07)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = accent ? 'rgba(232,80,64,0.58)' : 'rgba(255,255,255,0.10)';
        e.currentTarget.style.background = accent
          ? 'linear-gradient(135deg, rgba(200,60,40,0.32) 0%, rgba(170,35,25,0.20) 100%)'
          : 'rgba(255,255,255,0.04)';
      }}
    >
      <div style={{ fontSize: '1.8rem', lineHeight: 1 }}>{icon}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '0.03em', fontFamily: uiTypography.display }}>{title}</span>
        <span style={{ fontSize: '0.78rem', color: 'rgba(240,220,210,0.60)' }}>{sub}</span>
      </div>
    </button>
  );
}

const DIFFICULTIES: { id: CpuDifficulty; label: string; sub: string; icon: string; accent?: boolean }[] = [
  { id: 'easy', label: 'Easy', sub: 'Slow CPU — great for practice · +40 shards on win', icon: '◇' },
  { id: 'normal', label: 'Normal', sub: 'Steady CPU pace · +60 shards on win', icon: '◆', accent: true },
  { id: 'hard', label: 'Hard', sub: 'Aggressive CPU — real challenge · +80 shards on win', icon: '◈' },
];

export default function BattlegroundLobby({ onClose }: Props) {
  const [step, setStep] = useState<Step>('select-mode');
  const [pendingDiff, setPendingDiff] = useState<CpuDifficulty>('normal');
  const [countdown, setCountdown] = useState(3);
  const [sendingInviteTo, setSendingInviteTo] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const enterBattleground = useStore(s => s.enterBattleground);
  const incomingInvite = useBattlegroundStore(s => s.incomingInvite);
  const sendInvite = useBattlegroundStore(s => s.sendInvite);
  const progress = useStore(selectProgress);
  const stats = progress.battlegroundStats;
  const friends = useFriendsStore(selectFriendsList);
  const friendsLoaded = useFriendsStore(selectFriendsLoaded);
  const loadFriends = useFriendsStore(s => s.load);
  const presence = useFriendsStore(s => s.presence);

  // When step is 'cpu-ready', count down 3 → 0 then start the match.
  useEffect(() => {
    if (step !== 'cpu-ready') return;
    setCountdown(3);
    const tick = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(tick);
          // Start immediately on next render.
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [step]);

  // When countdown hits 0 and we're in cpu-ready step, fire enterBattleground.
  useEffect(() => {
    if (step !== 'cpu-ready' || countdown > 0) return;
    enterBattleground('cpu', pendingDiff, { displayName: `CPU (${pendingDiff})`, avatarId: 'pic-classic-acolyte' });
    onClose();
  }, [step, countdown, pendingDiff, enterBattleground, onClose]);

  function handleCpu(diff: CpuDifficulty) {
    setPendingDiff(diff);
    setStep('cpu-ready');
  }

  function handlePvp() {
    if (!friendsLoaded) void loadFriends();
    setInviteError(null);
    setStep('select-friend');
  }

  async function handleChallengeFriend(friendId: string, displayName: string, avatarId: string) {
    if (sendingInviteTo) return;
    setSendingInviteTo(friendId);
    setInviteError(null);
    const sessionId = await sendInvite(friendId, { displayName, avatarId });
    if (sessionId) {
      setStep('pvp-pending');
    } else {
      setInviteError('Could not send invite. Please try again.');
    }
    setSendingInviteTo(null);
  }

  // When an incoming invite resolves (accepted/declined), reflect it.
  // For now, if incomingInvite is accepted outside this component the
  // battleground store handles the match start directly.

  return (
    <div style={OVERLAY} role="dialog" aria-modal="true" aria-label="Battleground of the Card-born">
      <div style={PANEL}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(240,100,80,0.78)', fontFamily: uiTypography.display }}>
              ARENA MODE
            </div>
            <h2 style={TITLE}>Battleground of the Card-born</h2>
            <p style={CAPTION}>3-minute Oblivion race — highest score wins.</p>
          </div>
          {step !== 'cpu-ready' && (
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ background: 'rgba(232,80,64,0.08)', border: '1px solid rgba(232,80,64,0.30)', borderRadius: 8, cursor: 'pointer', color: 'rgba(240,220,210,0.62)', fontSize: '1.1rem', padding: '5px 9px', lineHeight: 1 }}
            >
              ✕
            </button>
          )}
        </div>

        {stats && (stats.totalMatches > 0) && (
          <div style={{
            background: 'rgba(232,80,64,0.07)',
            border: '1px solid rgba(232,80,64,0.22)',
            borderRadius: 10,
            padding: '10px 16px',
            fontSize: '0.78rem',
            color: 'rgba(240,220,210,0.65)',
            display: 'flex',
            gap: 20,
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <strong style={{ color: '#5de88a', fontSize: '1rem' }}>{stats.wins}</strong>
              <span style={{ fontSize: '0.65rem', letterSpacing: 1.5, textTransform: 'uppercase' }}>Wins</span>
            </div>
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <strong style={{ color: '#f0e8e0', fontSize: '1rem' }}>{stats.totalMatches}</strong>
              <span style={{ fontSize: '0.65rem', letterSpacing: 1.5, textTransform: 'uppercase' }}>Matches</span>
            </div>
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <strong style={{ color: '#daa058', fontSize: '1rem' }}>{stats.bestScore.toLocaleString()}</strong>
              <span style={{ fontSize: '0.65rem', letterSpacing: 1.5, textTransform: 'uppercase' }}>Best</span>
            </div>
          </div>
        )}

        {/* ── Mode selection ─────────────────────────────────────── */}
        {step === 'select-mode' && (
          <div style={BTN_ROW}>
            <ModeCard
              title="vs CPU"
              sub="Offline match against an AI opponent. Choose your difficulty."
              icon="✦"
              onClick={() => setStep('select-cpu-difficulty')}
              accent
            />
            <ModeCard
              title="vs Friend (PvP)"
              sub="Invite a friend for a real-time Oblivion race."
              icon="◉"
              onClick={handlePvp}
            />
          </div>
        )}

        {/* ── CPU difficulty picker ──────────────────────────────── */}
        {step === 'select-cpu-difficulty' && (
          <>
            <button
              onClick={() => setStep('select-mode')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e85040', fontSize: '0.82rem', textAlign: 'left', padding: 0, letterSpacing: '0.02em' }}
            >
              ← Back
            </button>
            <p style={{ ...CAPTION, marginBottom: 2, letterSpacing: 2, textTransform: 'uppercase', fontSize: '0.7rem' }}>Choose difficulty:</p>
            <div style={BTN_ROW}>
              {DIFFICULTIES.map(d => (
                <ModeCard key={d.id} title={d.label} sub={d.sub} icon={d.icon} accent={d.accent} onClick={() => handleCpu(d.id)} />
              ))}
            </div>
          </>
        )}

        {/* ── CPU ready countdown ────────────────────────────────── */}
        {step === 'cpu-ready' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '24px 0 16px' }}>
            <div style={{ fontSize: '0.75rem', letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(240,100,80,0.82)', fontFamily: uiTypography.display }}>
              Match Starting
            </div>
            <div style={{
              fontSize: '4rem',
              fontWeight: 900,
              color: countdown > 0 ? '#f0e8e0' : '#ff7060',
              fontFamily: uiTypography.display,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
              minWidth: 80,
              textAlign: 'center',
              textShadow: countdown <= 1 ? '0 0 40px rgba(232,80,64,0.60)' : 'none',
              transition: 'text-shadow 0.3s',
            }}>
              {countdown > 0 ? countdown : '!'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(240,220,210,0.60)', letterSpacing: '0.04em' }}>
              Prepare your strategy…
            </div>
          </div>
        )}

        {/* ── Friend picker ──────────────────────────────────────── */}
        {step === 'select-friend' && (
          <>
            <button
              onClick={() => setStep('select-mode')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e85040', fontSize: '0.82rem', textAlign: 'left', padding: 0, letterSpacing: '0.02em' }}
            >
              ← Back
            </button>
            <p style={{ ...CAPTION, marginBottom: 2, letterSpacing: 2, textTransform: 'uppercase', fontSize: '0.7rem' }}>
              Choose a friend to challenge:
            </p>
            {inviteError && (
              <div style={{ fontSize: '0.78rem', color: '#ff7060', textAlign: 'center' }}>{inviteError}</div>
            )}
            {!friendsLoaded ? (
              <div style={{ color: 'rgba(240,220,210,0.55)', fontSize: '0.82rem', textAlign: 'center', padding: '12px 0' }}>Loading friends…</div>
            ) : friends.length === 0 ? (
              <div style={{ color: 'rgba(240,220,210,0.55)', fontSize: '0.82rem', textAlign: 'center', padding: '12px 0' }}>
                No friends yet. Add friends from the Player Info panel to challenge them here.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
                {friends.map(f => {
                  const isOnline = !!presence[f.other.id];
                  const isSending = sendingInviteTo === f.other.id;
                  return (
                    <div
                      key={f.other.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        borderRadius: 10,
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                          background: isOnline ? '#5de88a' : 'rgba(255,255,255,0.22)',
                          boxShadow: isOnline ? '0 0 6px #5de88a88' : 'none',
                        }} />
                        <span style={{
                          fontFamily: uiTypography.display,
                          fontSize: '0.88rem',
                          color: '#f0e8e0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {f.other.displayName}
                        </span>
                      </div>
                      <button
                        disabled={!!sendingInviteTo}
                        onClick={() => void handleChallengeFriend(f.other.id, f.other.displayName, f.other.avatarId)}
                        style={{
                          background: isSending ? 'rgba(232,80,64,0.10)' : 'rgba(232,80,64,0.18)',
                          border: '1px solid rgba(232,80,64,0.45)',
                          borderRadius: 7,
                          color: '#f0e8e0',
                          fontFamily: uiTypography.display,
                          fontSize: '0.72rem',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          padding: '5px 12px',
                          cursor: sendingInviteTo ? 'not-allowed' : 'pointer',
                          opacity: sendingInviteTo && !isSending ? 0.45 : 1,
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => { if (!sendingInviteTo) e.currentTarget.style.background = 'rgba(232,80,64,0.32)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isSending ? 'rgba(232,80,64,0.10)' : 'rgba(232,80,64,0.18)'; }}
                      >
                        {isSending ? 'Sending…' : 'Challenge'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── PvP pending invite ─────────────────────────────────── */}
        {step === 'pvp-pending' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '0.85rem', color: '#f0e8e0', letterSpacing: '0.02em' }}>
              Waiting for opponent to accept…
            </div>
            <div style={{
              width: 28,
              height: 28,
              border: '2px solid #e85040',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.9s linear infinite',
            }} />
            <p style={{ fontSize: '0.75rem', color: 'rgba(240,220,210,0.60)', margin: 0, textAlign: 'center' }}>
              Your challenge has been sent. The match begins once they accept.
            </p>
            <button
              onClick={() => setStep('select-mode')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e85040', fontSize: '0.82rem', padding: 0, letterSpacing: '0.02em' }}
            >
              ← Cancel
            </button>
          </div>
        )}

        {/* ── Incoming invite banner ─────────────────────────────── */}
        {incomingInvite && (
          <IncomingInviteBanner invite={incomingInvite} onClose={onClose} />
        )}

        <p style={{ ...CAPTION, fontSize: '0.7rem', borderTop: '1px solid rgba(232,80,64,0.16)', paddingTop: 12, margin: 0, letterSpacing: '0.02em' }}>
          Every match grants Aberrated Shards. Win/loss rewards scale with difficulty. Score milestones grant bonus pulls.
        </p>
      </div>
    </div>
  );
}

// ── Incoming invite sub-component ─────────────────────────────────────────────

import type { BattlegroundInviteRow } from '@/state/battlegroundStore';

function IncomingInviteBanner({ invite, onClose }: { invite: BattlegroundInviteRow; onClose: () => void }) {
  const { acceptInvite, declineInvite } = useBattlegroundStore();
  const [busy, setBusy] = useState(false);

  async function handleAccept() {
    setBusy(true);
    await acceptInvite(invite);
    onClose();
  }

  async function handleDecline() {
    setBusy(true);
    await declineInvite(invite.id);
  }

  return (
    <div style={{
      background: 'rgba(232,80,64,0.08)',
      border: '1px solid rgba(232,80,64,0.38)',
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{ fontWeight: 700, color: '#f0e8e0', fontSize: '0.9rem' }}>
        Incoming challenge!
      </div>
      <div style={{ fontSize: '0.82rem', color: 'rgba(240,220,210,0.65)' }}>
        A player wants to battle — accept or decline.
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          disabled={busy}
          onClick={handleAccept}
          style={{
            flex: 1,
            background: 'rgba(232,80,64,0.22)',
            color: '#f0e8e0',
            border: '1px solid rgba(232,80,64,0.55)',
            borderRadius: 8,
            padding: '10px 0',
            fontWeight: 700,
            cursor: busy ? 'wait' : 'pointer',
            fontSize: '0.85rem',
            letterSpacing: '0.04em',
          }}
        >
          Accept
        </button>
        <button
          disabled={busy}
          onClick={handleDecline}
          style={{
            flex: 1,
            background: 'transparent',
            color: 'rgba(240,220,210,0.55)',
            border: `1px solid rgba(255,255,255,0.12)`,
            borderRadius: 8,
            padding: '10px 0',
            cursor: busy ? 'wait' : 'pointer',
            fontSize: '0.85rem',
          }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
