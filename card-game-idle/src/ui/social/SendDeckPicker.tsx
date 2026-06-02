// SendDeckPicker — Phase 4 social UI.
//
// Small inline modal opened from ChatWindow. Lists the player's saved decks
// and on confirm sends the chosen deck as a SharedDeckPayload attached to
// a new DM in the currently-open thread.

import { useState } from 'react';
import { warmTheme } from '@/ui/theme';
import { useThemeVersion } from '@/ui/useThemeVersion';
import { useStore } from '@/state/store';
import { useMessagesStore } from '@/state/messagesStore';
import { makeSharedDeckPayload } from '@/social/sharedDeck';
import type { SavedDeck } from '@/types/game';

interface Props {
  onClose: () => void;
}

export default function SendDeckPicker({ onClose }: Props) {
  useThemeVersion();
  const savedDecks = useStore(s => s.progress.savedDecks);
  const sendMessage = useMessagesStore(s => s.sendMessage);
  const [pickId, setPickId] = useState<string | null>(savedDecks[0]?.id ?? null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const picked = pickId ? savedDecks.find(d => d.id === pickId) ?? null : null;

  async function submit() {
    if (!picked) return;
    setSending(true);
    setError(null);
    const payload = makeSharedDeckPayload(
      picked.name,
      picked.deckList,
      picked.extraDeck,
      picked.notes,
    );
    const body = note.trim() || `Shared deck: ${payload.name}`;
    await sendMessage(body, payload);
    setSending(false);
    const err = useMessagesStore.getState().errorMessage;
    if (err) setError(err);
    else onClose();
  }

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={{ fontSize: 13, fontWeight: 'bold', color: warmTheme.text }}>
            Share a deck
          </div>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        {savedDecks.length === 0 && (
          <div style={hintStyle}>No saved decks. Build one in the Deck Builder first.</div>
        )}

        <div style={listStyle}>
          {savedDecks.map(d => (
            <DeckRow
              key={d.id}
              deck={d}
              active={pickId === d.id}
              onClick={() => setPickId(d.id)}
            />
          ))}
        </div>

        {picked && (
          <div style={{ marginTop: 8 }}>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value.slice(0, 200))}
              placeholder="Optional note"
              rows={2}
              style={textareaStyle}
            />
          </div>
        )}

        {error && <div style={{ fontSize: 10, color: '#b86060', marginTop: 8 }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 12 }}>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
          <button
            disabled={!picked || sending}
            onClick={() => void submit()}
            style={{
              ...primaryBtn,
              opacity: !picked || sending ? 0.5 : 1,
              cursor: sending ? 'wait' : 'pointer',
            }}
          >{sending ? 'Sending…' : 'Send deck'}</button>
        </div>
      </div>
    </div>
  );
}

function DeckRow({
  deck, active, onClick,
}: { deck: SavedDeck; active: boolean; onClick: () => void }) {
  const mainCount = deck.deckList.reduce((s, e) => s + e.copies, 0);
  return (
    <button
      onClick={onClick}
      style={{
        ...rowStyle,
        background: active ? warmTheme.accentSoft : 'transparent',
        borderColor: active ? warmTheme.accent : warmTheme.border,
      }}
    >
      <span style={{ flex: 1, textAlign: 'left' }}>{deck.name}{deck.isStarter ? ' (Starter)' : ''}</span>
      <span style={{ fontSize: 10, color: warmTheme.textMuted }}>
        {mainCount} main · {deck.extraDeck.length} extra
      </span>
    </button>
  );
}

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 70,
};

const modalStyle: React.CSSProperties = {
  background: warmTheme.surfaceStrong,
  border: `1px solid ${warmTheme.borderStrong}`,
  borderRadius: 12,
  boxShadow: warmTheme.shadow,
  padding: 16,
  width: 420,
  maxWidth: '90vw',
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'Georgia, serif',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
};

const closeBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: warmTheme.textMuted,
  fontSize: 14,
  cursor: 'pointer',
};

const listStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  maxHeight: '40vh',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  border: `1px solid ${warmTheme.border}`,
  borderRadius: 6,
  padding: 6,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '6px 10px',
  border: `1px solid ${warmTheme.border}`,
  borderRadius: 6,
  color: warmTheme.text,
  cursor: 'pointer',
  fontSize: 11,
  fontFamily: 'Georgia, serif',
};

const hintStyle: React.CSSProperties = {
  fontSize: 10,
  color: warmTheme.textMuted,
  textAlign: 'center',
  padding: 16,
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  fontSize: 11,
  padding: '6px 8px',
  background: 'rgba(0,0,0,0.06)',
  border: `1px solid ${warmTheme.border}`,
  borderRadius: 6,
  color: warmTheme.text,
  fontFamily: 'Georgia, serif',
  resize: 'vertical',
};

const primaryBtn: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: 11,
  background: warmTheme.accent,
  border: `1px solid ${warmTheme.accent}`,
  borderRadius: 6,
  color: warmTheme.surface,
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
