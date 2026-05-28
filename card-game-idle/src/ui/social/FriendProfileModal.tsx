// FriendProfileModal — expanded full-profile overlay for friends.
//
// Shows avatar, title, name, friend code, bio, online status, Signature Cards,
// and action buttons.

import { useState, lazy, Suspense } from 'react';
import { warmTheme } from '@/ui/theme';
import { AVATAR_BY_ID, DEFAULT_AVATAR_ID } from '@/data/profile/avatars';
import { TITLE_BADGE_BY_ID } from '@/data/profile/titleBadges';
import { CardRegistry } from '@/cards/CardRegistry';
import { useMessagesStore } from '@/state/messagesStore';
import type { FriendProfileLite } from '@/state/friendsStore';

const SendGiftModal = lazy(() => import('@/ui/social/SendGiftModal'));

interface Props {
  profile: FriendProfileLite;
  online: boolean;
  onClose: () => void;
}

const RARITY_COLOR: Record<string, string> = {
  Common: '#aabccc', Rare: '#6699dd', Epic: '#aa66dd',
  Legendary: '#ddaa33', Eternal: '#ff8844', Infinite: '#44ddcc',
};

export default function FriendProfileModal({ profile, online, onClose }: Props) {
  const openConversation = useMessagesStore(s => s.openConversation);
  const [showGift, setShowGift] = useState(false);

  const avatarDef =
    (profile.avatarId ? AVATAR_BY_ID[profile.avatarId] : undefined)
    ?? AVATAR_BY_ID[DEFAULT_AVATAR_ID];
  const titleText = profile.titleId ? TITLE_BADGE_BY_ID[profile.titleId]?.text : null;

  const sigCards = Array.from({ length: 5 }, (_, i) => {
    const id = profile.signatureCardIds?.[i];
    return id ? CardRegistry.get(id) : null;
  });
  const hasAnySigCards = sigCards.some(Boolean);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 65,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif',
    }} onClick={onClose}>
      <div style={{
        position: 'relative',
        background: warmTheme.surfaceStrong,
        border: `1px solid ${warmTheme.borderStrong}`,
        borderRadius: 16,
        boxShadow: warmTheme.shadow,
        padding: '28px 32px',
        width: 480,
        maxWidth: '92vw',
        maxHeight: '88vh',
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 16,
      }} onClick={e => e.stopPropagation()}>

        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 10, right: 12,
          background: 'transparent', border: 'none',
          color: warmTheme.textMuted, fontSize: 16, cursor: 'pointer',
        }}>✕</button>

        {/* Identity block */}
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
            border: `2px solid ${warmTheme.borderStrong}`,
            boxShadow: warmTheme.glow, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.3)',
          }}>
            {avatarDef?.imageUrl
              ? <img src={avatarDef.imageUrl} alt={avatarDef.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
              : <span style={{ fontSize: 44 }}>{avatarDef?.glyph ?? '?'}</span>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: warmTheme.text, letterSpacing: 0.5 }}>
              {profile.displayName}
            </div>
            {titleText && (
              <div style={{ fontSize: 11, fontStyle: 'italic', color: warmTheme.accentDeep, marginTop: 2 }}>
                · {titleText} ·
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 10, color: warmTheme.textMuted }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: online ? '#5fa66a' : '#7a7a7a',
                boxShadow: online ? '0 0 5px #5fa66a' : 'none',
                flexShrink: 0,
              }} />
              {online ? 'Online now' : 'Offline'}
            </div>
            <div style={{ fontSize: 9, color: warmTheme.textMuted, fontFamily: 'monospace', marginTop: 4, letterSpacing: 0.5 }}>
              {profile.friendCode}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div style={{
            fontSize: 12, color: warmTheme.textMuted, lineHeight: 1.55,
            fontStyle: 'italic', borderLeft: `2px solid ${warmTheme.border}`,
            paddingLeft: 10,
          }}>
            {profile.bio}
          </div>
        )}

        {/* Signature Cards */}
        <div>
          <div style={{
            fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
            color: warmTheme.textMuted, marginBottom: 8,
          }}>Signature Cards</div>
          {hasAnySigCards ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {sigCards.map((def, i) => {
                const color = def ? (RARITY_COLOR[def.rarity] ?? warmTheme.textMuted) : warmTheme.border;
                return (
                  <div key={i} style={{
                    width: 72, height: 90, borderRadius: 8,
                    border: `2px solid ${color}`,
                    background: 'rgba(0,0,0,0.18)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 3, padding: 4,
                    opacity: def ? 1 : 0.3,
                  }}>
                    {def ? (
                      <>
                        <div style={{ fontSize: 8, color, letterSpacing: 0.5, opacity: 0.8 }}>{def.rarity}</div>
                        <div style={{ fontSize: 9, fontWeight: 'bold', color: warmTheme.text, textAlign: 'center', lineHeight: 1.2 }}>{def.name}</div>
                      </>
                    ) : (
                      <span style={{ fontSize: 18, color: warmTheme.border, opacity: 0.5 }}>—</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: warmTheme.textMuted, fontStyle: 'italic' }}>
              {profile.signatureCardIds != null ? 'No signature cards set.' : 'Signature cards not available.'}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: warmTheme.border }} />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            style={{
              padding: '8px 16px', fontSize: 12,
              background: warmTheme.accent, border: `1px solid ${warmTheme.accent}`,
              borderRadius: 7, color: '#fff', cursor: 'pointer', fontFamily: 'Georgia, serif',
            }}
            onClick={() => { void openConversation(profile.id); onClose(); }}
          >Message</button>
          <button
            style={{
              padding: '8px 16px', fontSize: 12,
              background: 'transparent', border: `1px solid ${warmTheme.border}`,
              borderRadius: 7, color: warmTheme.text, cursor: 'pointer', fontFamily: 'Georgia, serif',
            }}
            onClick={() => setShowGift(true)}
          >Send Gift</button>
        </div>

        {showGift && (
          <Suspense fallback={null}>
            <SendGiftModal recipient={profile} onClose={() => setShowGift(false)} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
