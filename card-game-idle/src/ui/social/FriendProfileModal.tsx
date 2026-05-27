// FriendProfileModal — Phase 4 social UI.
//
// Lightweight popup showing the friend's public profile fields (avatar glyph,
// title text, display name, friend code, online status). Profile rows are
// already fetched into friendsStore via the friend_requests join; no extra
// network call is required.

import { useState, lazy, Suspense } from 'react';
import { warmTheme } from '@/ui/theme';
import { AVATAR_BY_ID, DEFAULT_AVATAR_ID } from '@/data/profile/avatars';
import { TITLE_BADGE_BY_ID } from '@/data/profile/titleBadges';
import { useMessagesStore } from '@/state/messagesStore';
import type { FriendProfileLite } from '@/state/friendsStore';

const SendGiftModal = lazy(() => import('@/ui/social/SendGiftModal'));

interface Props {
  profile: FriendProfileLite;
  online: boolean;
  onClose: () => void;
}

export default function FriendProfileModal({ profile, online, onClose }: Props) {
  const openConversation = useMessagesStore(s => s.openConversation);
  const [showGift, setShowGift] = useState(false);

  const avatarDef =
    (profile.avatarId ? AVATAR_BY_ID[profile.avatarId] : undefined)
    ?? AVATAR_BY_ID[DEFAULT_AVATAR_ID];
  const titleText = profile.titleId ? TITLE_BADGE_BY_ID[profile.titleId]?.text : null;

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={closeBtn}>✕</button>
        {avatarDef?.imageUrl
          ? (
            <div style={{
              width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
              border: `2px solid ${warmTheme.borderStrong}`,
              boxShadow: warmTheme.glow,
              marginBottom: 8,
              flexShrink: 0,
            }}>
              <img
                src={avatarDef.imageUrl}
                alt={avatarDef.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                draggable={false}
              />
            </div>
          )
          : (
            <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 8 }}>
              {avatarDef?.glyph ?? '?'}
            </div>
          )
        }
        <div style={{ fontSize: 18, fontWeight: 'bold', color: warmTheme.text }}>
          {profile.displayName}
        </div>
        {titleText && (
          <div style={{ fontSize: 11, fontStyle: 'italic', color: warmTheme.accentDeep, marginTop: 2 }}>
            · {titleText} ·
          </div>
        )}
        <div style={{ fontSize: 10, color: warmTheme.textMuted, fontFamily: 'monospace', marginTop: 6 }}>
          {profile.friendCode}
        </div>
        {profile.bio && (
          <div style={{
            fontSize: 12, color: warmTheme.textMuted, marginTop: 10,
            lineHeight: 1.5, maxWidth: 260, textAlign: 'center',
            fontStyle: 'italic',
          }}>
            {profile.bio}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 10, color: warmTheme.textMuted }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: online ? '#5fa66a' : '#7a7a7a',
            boxShadow: online ? '0 0 4px #5fa66a' : 'none',
          }} />
          {online ? 'Online' : 'Offline'}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button
            style={primaryBtn}
            onClick={() => { void openConversation(profile.id); onClose(); }}
          >Message</button>
          <button style={ghostBtn} onClick={() => setShowGift(true)}>Send gift</button>
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

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 65,
};

const modalStyle: React.CSSProperties = {
  position: 'relative',
  background: warmTheme.surfaceStrong,
  border: `1px solid ${warmTheme.borderStrong}`,
  borderRadius: 12,
  boxShadow: warmTheme.shadow,
  padding: 24,
  width: 320,
  maxWidth: '90vw',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  fontFamily: 'Georgia, serif',
};

const closeBtn: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 8,
  background: 'transparent',
  border: 'none',
  color: warmTheme.textMuted,
  fontSize: 14,
  cursor: 'pointer',
};

const primaryBtn: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: 11,
  background: warmTheme.accent,
  border: `1px solid ${warmTheme.accent}`,
  borderRadius: 6,
  color: '#fff',
  cursor: 'pointer',
  fontFamily: 'Georgia, serif',
};

const ghostBtn: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: 11,
  background: 'transparent',
  border: `1px solid ${warmTheme.border}`,
  borderRadius: 6,
  color: warmTheme.text,
  cursor: 'pointer',
  fontFamily: 'Georgia, serif',
};
