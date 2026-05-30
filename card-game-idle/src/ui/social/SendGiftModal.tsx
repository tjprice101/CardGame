// SendGiftModal — Phase 4 social UI.
//
// Lets the signed-in user gift card copies to a friend. Sender selects a
// definition + finish + count from their owned collection. After confirm,
// the modal calls giftsStore.sendCardCopyGift which optimistically debits
// the local collection and inserts a gift row server-side.

import { useMemo, useState } from 'react';
import { warmTheme } from '@/ui/theme';
import { useStore } from '@/state/store';
import { useGiftsStore } from '@/state/giftsStore';
import { CardRegistry } from '@/cards/CardRegistry';
import type { CardFinish } from '@/types/cards';
import type { FriendProfileLite } from '@/state/friendsStore';
import VirtualizedList from '@/ui/components/VirtualizedList';

interface Props {
  recipient: FriendProfileLite;
  onClose: () => void;
}

interface CollectionEntry {
  definitionId: string;
  name: string;
  total: number;
  holo: number;
}

export default function SendGiftModal({ recipient, onClose }: Props) {
  const collection = useStore(s => s.progress.collection);
  const holoCollection = useStore(s => s.progress.holoCollection);
  const sendGift = useGiftsStore(s => s.sendCardCopyGift);

  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [finish, setFinish] = useState<CardFinish>('normal');
  const [count, setCount] = useState(1);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entries: CollectionEntry[] = useMemo(() => {
    const list: CollectionEntry[] = [];
    for (const [defId, total] of Object.entries(collection)) {
      if (!total || total <= 0) continue;
      const def = CardRegistry.get(defId);
      if (!def) continue;
      list.push({
        definitionId: defId,
        name: def.name,
        total,
        holo: holoCollection[defId] ?? 0,
      });
    }
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [collection, holoCollection]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(e => e.name.toLowerCase().includes(q));
  }, [entries, filter]);

  const selected = selectedId ? entries.find(e => e.definitionId === selectedId) ?? null : null;
  const maxCount = selected
    ? finish === 'holo'
      ? Math.min(4, selected.holo)
      : Math.min(4, selected.total)
    : 0;

  async function submit() {
    if (!selected) return;
    setSending(true);
    setError(null);
    const row = await sendGift(recipient.id, {
      definitionId: selected.definitionId,
      finish,
      count,
      note: note.trim() || undefined,
    });
    setSending(false);
    if (row) {
      onClose();
    } else {
      setError(useGiftsStore.getState().errorMessage ?? 'Failed to send gift.');
    }
  }

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={{ fontSize: 13, fontWeight: 'bold', color: warmTheme.text }}>
            Gift a card to {recipient.displayName}
          </div>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter your collection…"
          style={inputStyle}
        />

        {filtered.length === 0 ? (
          <div style={listStyle}>
            <div style={hintStyle}>No matching cards in your collection.</div>
          </div>
        ) : (
          <VirtualizedList
            items={filtered}
            getItemKey={(entry) => entry.definitionId}
            getItemHeight={() => 36}
            topPadding={6}
            bottomPadding={6}
            overscanPx={220}
            style={listStyle}
            renderItem={(entry) => {
              const active = selectedId === entry.definitionId;
              return (
                <div style={{ padding: '0 0 2px' }}>
                  <button
                    onClick={() => {
                      setSelectedId(entry.definitionId);
                      setFinish('normal');
                      setCount(1);
                    }}
                    style={{
                      ...listRowStyle,
                      background: active ? warmTheme.accentSoft : 'transparent',
                      borderColor: active ? warmTheme.accent : warmTheme.border,
                    }}
                  >
                    <span style={{ flex: 1, textAlign: 'left' }}>{entry.name}</span>
                    <span style={{ fontSize: 10, color: warmTheme.textMuted }}>
                      {entry.total} {entry.holo > 0 ? `(${entry.holo} holo)` : ''}
                    </span>
                  </button>
                </div>
              );
            }}
          />
        )}

        {selected && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={labelStyle}>Finish</label>
              <button
                onClick={() => { setFinish('normal'); setCount(1); }}
                style={chipStyle(finish === 'normal')}
              >Normal</button>
              <button
                onClick={() => { setFinish('holo'); setCount(1); }}
                style={{ ...chipStyle(finish === 'holo'), opacity: selected.holo > 0 ? 1 : 0.4 }}
                disabled={selected.holo === 0}
              >Holo</button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={labelStyle}>Count</label>
              <input
                type="number"
                min={1}
                max={maxCount}
                value={count}
                onChange={e => {
                  const n = Math.max(1, Math.min(maxCount, Number(e.target.value) || 1));
                  setCount(n);
                }}
                style={{ ...inputStyle, width: 80, marginTop: 0 }}
              />
              <span style={{ fontSize: 10, color: warmTheme.textMuted }}>max {maxCount}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <label style={labelStyle}>Note</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 200))}
                placeholder="Optional message"
                rows={2}
                style={{ ...inputStyle, flex: 1, marginTop: 0, resize: 'vertical' }}
              />
            </div>
          </div>
        )}

        {error && <div style={{ fontSize: 10, color: '#b86060', marginTop: 8 }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 12 }}>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
          <button
            disabled={!selected || sending || maxCount === 0}
            onClick={() => void submit()}
            style={{
              ...primaryBtn,
              opacity: !selected || sending || maxCount === 0 ? 0.5 : 1,
              cursor: sending ? 'wait' : 'pointer',
            }}
          >{sending ? 'Sending…' : 'Send gift'}</button>
        </div>
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
  zIndex: 70,
};

const modalStyle: React.CSSProperties = {
  background: warmTheme.surfaceStrong,
  border: `1px solid ${warmTheme.borderStrong}`,
  borderRadius: 12,
  boxShadow: warmTheme.shadow,
  padding: 16,
  width: 460,
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

const inputStyle: React.CSSProperties = {
  fontSize: 12,
  padding: '6px 8px',
  background: 'rgba(0,0,0,0.06)',
  border: `1px solid ${warmTheme.border}`,
  borderRadius: 6,
  color: warmTheme.text,
  fontFamily: 'Georgia, serif',
  marginTop: 6,
};

const listStyle: React.CSSProperties = {
  marginTop: 8,
  flex: 1,
  overflowY: 'auto',
  maxHeight: '40vh',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  borderTop: `1px solid ${warmTheme.border}`,
  borderBottom: `1px solid ${warmTheme.border}`,
  padding: '6px 0',
};

const listRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '4px 8px',
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
  padding: 12,
};

const labelStyle: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: 1,
  textTransform: 'uppercase',
  color: warmTheme.textMuted,
  minWidth: 60,
};

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '4px 10px',
    fontSize: 10,
    background: active ? warmTheme.accentSoft : 'transparent',
    border: `1px solid ${active ? warmTheme.accent : warmTheme.border}`,
    borderRadius: 6,
    color: warmTheme.text,
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
  };
}

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
