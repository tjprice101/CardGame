// ChatWindow — Phase 3 social UI.
//
// Floating bottom-right panel that opens when a friend is selected from
// FriendsPanel. Listens for new messages in the open thread via realtime.

import { useEffect, useRef, useState, useMemo, lazy, Suspense } from 'react';
import { warmTheme } from '@/ui/theme';
import { useThemeVersion } from '@/ui/useThemeVersion';
import {
  useMessagesStore,
  selectOpenThreadId,
  selectOpenMessages,
  selectMessagesError,
  selectMessagesSending,
} from '@/state/messagesStore';
import { useSocialStore } from '@/state/socialStore';
import { useFriendsStore, selectFriendsList } from '@/state/friendsStore';
import { useStore } from '@/state/store';
import { isSharedDeckPayload, isGiftReferencePayload, type SharedDeckPayload } from '@/social/sharedDeck';
import { CardRegistry } from '@/cards/CardRegistry';

const SendDeckPicker = lazy(() => import('@/ui/social/SendDeckPicker'));

export default function ChatWindow() {
  useThemeVersion();
  const openThreadId = useMessagesStore(selectOpenThreadId);
  const messages = useMessagesStore(selectOpenMessages);
  const errorMessage = useMessagesStore(selectMessagesError);
  const sending = useMessagesStore(selectMessagesSending);
  const threads = useMessagesStore(s => s.threads);
  const closeConversation = useMessagesStore(s => s.closeConversation);
  const sendMessage = useMessagesStore(s => s.sendMessage);
  const reportMessage = useMessagesStore(s => s.reportMessage);
  const markRead = useMessagesStore(s => s.markCurrentRead);
  const me = useSocialStore(s => s.user?.id);
  const friends = useFriendsStore(selectFriendsList);

  const [draft, setDraft] = useState('');
  const [showDeckPicker, setShowDeckPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const otherUserId = openThreadId ? threads[openThreadId]?.otherUserId : null;
  const otherDisplay = useMemo(() => {
    if (!otherUserId) return null;
    return friends.find(f => f.other.id === otherUserId)?.other ?? null;
  }, [friends, otherUserId]);

  // Auto-scroll to latest on new message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    markRead();
  }, [messages.length, markRead]);

  if (!openThreadId) return null;

  async function submit() {
    const body = draft;
    setDraft('');
    await sendMessage(body);
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div style={{ fontSize: 12, fontWeight: 'bold', color: warmTheme.text }}>
          {otherDisplay?.displayName ?? 'Conversation'}
        </div>
        <button onClick={closeConversation} style={closeBtn}>X</button>
      </div>

      <div ref={scrollRef} style={messagesStyle}>
        {messages.length === 0 && (
          <div style={{ fontSize: 10, color: warmTheme.textMuted, textAlign: 'center', padding: 20 }}>
            No messages yet. Say hi.
          </div>
        )}
        {messages.map(m => {
          const mine = m.senderId === me;
          return (
            <div
              key={m.id}
              style={{
                alignSelf: mine ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: '6px 10px',
                marginBottom: 4,
                background: mine ? warmTheme.accentSoft : 'rgba(0,0,0,0.08)',
                border: `1px solid ${mine ? warmTheme.accent : warmTheme.border}`,
                borderRadius: 8,
                color: warmTheme.text,
                fontSize: 12,
                lineHeight: 1.4,
                wordBreak: 'break-word',
                position: 'relative',
              }}
              title={new Date(m.createdAt).toLocaleString()}
            >
              {m.body}
              {isSharedDeckPayload(m.attachmentJson) && (
                <SharedDeckAttachment payload={m.attachmentJson} />
              )}
              {isGiftReferencePayload(m.attachmentJson) && (
                <GiftRefAttachment
                  cardDefinitionId={m.attachmentJson.cardDefinitionId}
                  finish={m.attachmentJson.finish}
                  count={m.attachmentJson.count}
                />
              )}
              {!mine && otherUserId && (
                <button
                  onClick={() => {
                    const reason = window.prompt('Report reason:');
                    if (reason && reason.trim()) {
                      void reportMessage(m.id, otherUserId, reason.trim());
                    }
                  }}
                  title="Report this message"
                  style={reportBtn}
                >!</button>
              )}
            </div>
          );
        })}
      </div>

      {errorMessage && (
        <div style={{ fontSize: 10, color: '#b86060', padding: '0 10px 4px' }}>
          {errorMessage}
        </div>
      )}

      <div style={inputBarStyle}>
        <button
          onClick={() => setShowDeckPicker(true)}
          title="Share a deck"
          style={attachBtn}
        >＋ Deck</button>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value.slice(0, 1000))}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!sending && draft.trim()) void submit();
            }
          }}
          placeholder="Message…"
          rows={2}
          style={textareaStyle}
        />
        <button
          disabled={sending || !draft.trim()}
          onClick={() => void submit()}
          style={{
            ...sendBtn,
            opacity: sending || !draft.trim() ? 0.5 : 1,
            cursor: sending ? 'wait' : 'pointer',
          }}
        >
          {sending ? '…' : 'Send'}
        </button>
      </div>

      {showDeckPicker && (
        <Suspense fallback={null}>
          <SendDeckPicker onClose={() => setShowDeckPicker(false)} />
        </Suspense>
      )}
    </div>
  );
}

// ── Attachment renderers ────────────────────────────────────────────────────

function SharedDeckAttachment({ payload }: { payload: SharedDeckPayload }) {
  const saveCurrentDeck = useStore(s => s.saveCurrentDeck);
  const [imported, setImported] = useState(false);

  const mainCount = payload.deckList.reduce((s, e) => s + e.copies, 0);
  const missing = useMemo(() => {
    const ids = new Set<string>();
    for (const e of payload.deckList) {
      if (!CardRegistry.get(e.definitionId)) ids.add(e.definitionId);
    }
    for (const e of payload.extraDeck) {
      if (!CardRegistry.get(e.definitionId)) ids.add(e.definitionId);
    }
    return ids;
  }, [payload]);

  function doImport() {
    saveCurrentDeck(
      `${payload.name} (shared)`.slice(0, 60),
      payload.deckList,
      payload.extraDeck,
    );
    setImported(true);
  }

  return (
    <div style={attachCardStyle}>
      <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: warmTheme.textMuted }}>
        Shared deck
      </div>
      <div style={{ fontSize: 12, fontWeight: 'bold', color: warmTheme.text, marginTop: 2 }}>
        {payload.name}
      </div>
      <div style={{ fontSize: 10, color: warmTheme.textMuted }}>
        {mainCount} main · {payload.extraDeck.length} extra
      </div>
      {missing.size > 0 && (
        <div style={{ fontSize: 9, color: '#b86060', marginTop: 4 }}>
          {missing.size} card{missing.size === 1 ? '' : 's'} unknown to this client.
        </div>
      )}
      <button
        disabled={imported}
        onClick={doImport}
        style={{
          ...attachActionBtn,
          marginTop: 6,
          opacity: imported ? 0.5 : 1,
          cursor: imported ? 'default' : 'pointer',
        }}
      >{imported ? 'Imported' : 'Import deck'}</button>
    </div>
  );
}

function GiftRefAttachment({
  cardDefinitionId, finish, count,
}: { cardDefinitionId: string; finish: 'normal' | 'holo'; count: number }) {
  const def = CardRegistry.get(cardDefinitionId);
  return (
    <div style={attachCardStyle}>
      <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: warmTheme.textMuted }}>
        Gift sent
      </div>
      <div style={{ fontSize: 12, fontWeight: 'bold', color: warmTheme.text, marginTop: 2 }}>
        {count}× {def?.name ?? cardDefinitionId}{finish === 'holo' ? ' (Holo)' : ''}
      </div>
      <div style={{ fontSize: 9, color: warmTheme.textMuted, marginTop: 2 }}>
        See your gift inbox to claim.
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  right: 16,
  bottom: 16,
  width: 320,
  height: 420,
  display: 'flex',
  flexDirection: 'column',
  background: warmTheme.surfaceStrong,
  border: `1px solid ${warmTheme.borderStrong}`,
  borderRadius: 12,
  boxShadow: warmTheme.shadow,
  zIndex: 60,
  fontFamily: 'Georgia, serif',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 10px',
  borderBottom: `1px solid ${warmTheme.border}`,
};

const closeBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: warmTheme.textMuted,
  fontSize: 14,
  cursor: 'pointer',
  padding: '0 4px',
};

const messagesStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  padding: 10,
};

const inputBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  padding: 8,
  borderTop: `1px solid ${warmTheme.border}`,
};

const textareaStyle: React.CSSProperties = {
  flex: 1,
  resize: 'none',
  fontSize: 12,
  padding: '6px 8px',
  background: 'rgba(0,0,0,0.06)',
  border: `1px solid ${warmTheme.border}`,
  borderRadius: 6,
  color: warmTheme.text,
  fontFamily: 'Georgia, serif',
};

const sendBtn: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: 11,
  fontWeight: 'bold',
  background: warmTheme.accentSoft,
  border: `1px solid ${warmTheme.accent}`,
  borderRadius: 6,
  color: warmTheme.accentDeep,
  cursor: 'pointer',
  fontFamily: 'Georgia, serif',
};

const attachBtn: React.CSSProperties = {
  padding: '6px 8px',
  fontSize: 10,
  background: 'transparent',
  border: `1px solid ${warmTheme.border}`,
  borderRadius: 6,
  color: warmTheme.textMuted,
  cursor: 'pointer',
  fontFamily: 'Georgia, serif',
  alignSelf: 'stretch',
};

const attachCardStyle: React.CSSProperties = {
  marginTop: 6,
  padding: 8,
  background: 'rgba(0,0,0,0.08)',
  border: `1px solid ${warmTheme.border}`,
  borderRadius: 6,
  display: 'flex',
  flexDirection: 'column',
};

const attachActionBtn: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 10,
  background: warmTheme.accentSoft,
  border: `1px solid ${warmTheme.accent}`,
  borderRadius: 6,
  color: warmTheme.accentDeep,
  fontFamily: 'Georgia, serif',
  alignSelf: 'flex-start',
};

const reportBtn: React.CSSProperties = {
  position: 'absolute',
  top: -4,
  right: -4,
  width: 14,
  height: 14,
  padding: 0,
  fontSize: 9,
  background: 'rgba(184, 96, 96, 0.85)',
  border: 'none',
  borderRadius: '50%',
  color: 'white',
  cursor: 'pointer',
  lineHeight: 1,
};
