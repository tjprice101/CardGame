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
import type { FriendCurrentActivity, FriendProfileLite } from '@/state/friendsStore';
import { getSupabase } from '@/net/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  getCardFaceBackgroundStyle,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
  cardFacePalette,
} from '@/ui/cardBackgrounds';
import { getDisplayCardTypeLabel } from '@/ui/preferences';

const SendGiftModal = lazy(() => import('@/ui/social/SendGiftModal'));

interface Props {
  profile: FriendProfileLite;
  online: boolean;
  currentActivity?: FriendCurrentActivity | null;
  onClose: () => void;
}

const RARITY_COLOR: Record<string, string> = {
  Common: '#aabccc', Rare: '#6699dd', Epic: '#aa66dd',
  Legendary: '#ddaa33', Eternal: '#ff8844', Infinite: '#44ddcc',
};

export default function FriendProfileModal({ profile, online, currentActivity, onClose }: Props) {
  const openConversation = useMessagesStore(s => s.openConversation);
  const [showGift, setShowGift] = useState(false);
  const [viewedProfile, setViewedProfile] = useState<FriendProfileLite>(profile);

  useEffect(() => {
    setViewedProfile(profile);
  }, [profile]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    const sb = supabase as NonNullable<ReturnType<typeof getSupabase>>;
    let active = true;
    let channel: RealtimeChannel | null = null;

    async function refreshProfile() {
      const { data } = await sb
        .from('profiles')
        .select('id, friend_code, display_name, bio, avatar_id, title_id, ui_theme_id, last_seen_at, signature_card_ids')
        .eq('id', profile.id)
        .maybeSingle();
      if (!active || !data) return;
      setViewedProfile({
        id: data.id,
        friendCode: data.friend_code,
        displayName: data.display_name,
        bio: data.bio ?? null,
        avatarId: data.avatar_id,
        titleId: data.title_id,
        uiThemeId: data.ui_theme_id,
        lastSeenAt: data.last_seen_at,
        signatureCardIds: Array.isArray(data.signature_card_ids) ? data.signature_card_ids as string[] : [],
      });
    }

    void refreshProfile();
    channel = sb
      .channel(`friend-profile-${profile.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profile.id}` },
        () => { void refreshProfile(); },
      )
      .subscribe();

    return () => {
      active = false;
      if (channel) void sb.removeChannel(channel);
    };
  }, [profile.id]);

  const avatarDef =
    (viewedProfile.avatarId ? AVATAR_BY_ID[viewedProfile.avatarId] : undefined)
    ?? AVATAR_BY_ID[DEFAULT_AVATAR_ID];
  const titleText = viewedProfile.titleId ? TITLE_BADGE_BY_ID[viewedProfile.titleId]?.text : null;

  const sigCards = Array.from({ length: 5 }, (_, i) => {
    const id = viewedProfile.signatureCardIds?.[i];
    return id ? CardRegistry.get(id) : null;
  });
  const hasAnySigCards = sigCards.some(Boolean);

  return createPortal(
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
        padding: '22px 24px',
        width: 860,
        maxWidth: '92vw',
        maxHeight: '90vh',
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
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
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
              {viewedProfile.displayName}
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
              {viewedProfile.friendCode}
            </div>
          </div>
        </div>

        {/* Bio */}
        {viewedProfile.bio && (
          <div style={{
            fontSize: 12, color: warmTheme.textMuted, lineHeight: 1.55,
            fontStyle: 'italic', borderLeft: `2px solid ${warmTheme.border}`,
            paddingLeft: 10,
          }}>
            {viewedProfile.bio}
          </div>
        )}

        {online && (
          <div style={{
            border: `1px solid ${warmTheme.border}`,
            borderRadius: 10,
            background: warmTheme.surfaceMuted,
            padding: '10px 12px',
          }}>
            <div style={{
              fontSize: 9,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: warmTheme.textMuted,
              marginBottom: 6,
            }}>
              Current Activity
            </div>
            <div style={{ fontSize: 13, color: warmTheme.text, fontWeight: 700 }}>
              {currentActivity?.label ?? 'Online'}
            </div>
            {(currentActivity?.detail || currentActivity?.bossName) && (
              <div style={{ fontSize: 11, color: warmTheme.textSoft, marginTop: 2, lineHeight: 1.4 }}>
                {currentActivity?.detail ?? currentActivity?.bossName}
              </div>
            )}
          </div>
        )}

        {/* Signature Cards */}
        <div>
          <div style={{
            fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
            color: warmTheme.textMuted, marginBottom: 8,
          }}>Signature Cards</div>
          {hasAnySigCards ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(126px, 1fr))', gap: 10 }}>
              {sigCards.map((def, i) => {
                const color = def ? (RARITY_COLOR[def.rarity] ?? warmTheme.textMuted) : warmTheme.border;
                return (
                  <div key={i} style={{
                    height: 164, borderRadius: 10,
                    border: `1px solid ${def ? `${color}66` : warmTheme.border}`,
                    ...(def ? getCardFaceBackgroundStyle(def, 'normal') : {}),
                    background: def ? warmTheme.surfaceStrong : 'rgba(0,0,0,0.18)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: def ? 1 : 0.3,
                    overflow: 'hidden',
                    boxShadow: def ? `0 6px 20px ${color}28` : 'none',
                  }}>
                    {def ? (
                      <>
                        <div style={{ ...getCardNameRibbonStyle('compact'), width: '100%', boxSizing: 'border-box' }}>
                          <div style={{ fontSize: 7, letterSpacing: 1, textTransform: 'uppercase', color: cardFacePalette.text }}>
                            {getDisplayCardTypeLabel(def.type)}
                          </div>
                        </div>
                        <div style={{ ...getCardRulesPanelStyle('compact'), width: '100%', boxSizing: 'border-box' }}>
                          <div style={{ fontSize: 8, fontWeight: 'bold', color: cardFacePalette.text, lineHeight: 1.2 }}>
                            {def.name}
                          </div>
                          <div style={{ fontSize: 7, color, letterSpacing: 0.4, marginTop: 2 }}>
                            {def.rarity}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: 4,
                      }}>
                        <span style={{ fontSize: 22, color: warmTheme.border, opacity: 0.5 }}>—</span>
                        <span style={{ fontSize: 8, color: warmTheme.textMuted, letterSpacing: 1 }}>Empty</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: warmTheme.textMuted, fontStyle: 'italic' }}>
              {viewedProfile.signatureCardIds != null ? 'No signature cards set.' : 'Signature cards not available.'}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: warmTheme.border }} />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            style={{
              padding: '10px 18px', fontSize: 12,
              background: warmTheme.accent, border: `1px solid ${warmTheme.accent}`,
              borderRadius: 7, color: '#fff', cursor: 'pointer', fontFamily: 'Georgia, serif',
            }}
            onClick={() => { void openConversation(viewedProfile.id); onClose(); }}
          >Message</button>
          <button
            style={{
              padding: '10px 18px', fontSize: 12,
              background: 'transparent', border: `1px solid ${warmTheme.border}`,
              borderRadius: 7, color: warmTheme.text, cursor: 'pointer', fontFamily: 'Georgia, serif',
            }}
            onClick={() => setShowGift(true)}
          >Send Gift</button>
        </div>

        {showGift && (
          <Suspense fallback={null}>
            <SendGiftModal recipient={viewedProfile} onClose={() => setShowGift(false)} />
          </Suspense>
        )}
      </div>
    </div>,
    document.body,
  );
}
