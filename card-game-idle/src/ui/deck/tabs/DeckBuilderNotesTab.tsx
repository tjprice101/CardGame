import { useState, useEffect } from 'react';

interface Props {
  deckId: string | null;
  currentNotes: string;
  setDeckNotes: (deckId: string, notes: string) => void;
}

export default function DeckBuilderNotesTab({ deckId, currentNotes, setDeckNotes }: Props) {
  const [draft, setDraft] = useState(currentNotes);
  const isDirty = draft !== currentNotes;

  // Sync when currentNotes changes externally (e.g. after save completes)
  useEffect(() => { setDraft(currentNotes); }, [currentNotes]);

  if (!deckId) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 13, color: 'rgba(165,205,245,0.45)', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
          Load a saved deck to edit its notes.
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 24px', fontFamily: 'Georgia, serif' }}>
      <div style={{ fontSize: 9, letterSpacing: 2.5, color: 'rgba(190,215,245,0.50)', textTransform: 'uppercase', marginBottom: 12 }}>
        How-to-Play Notes
      </div>
      <textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        placeholder="Describe how this deck plays — opener, key combos, win condition, side tech…"
        maxLength={2000}
        style={{
          flex: 1,
          boxSizing: 'border-box',
          padding: 14,
          borderRadius: 10,
          background: 'rgba(2,5,12,0.75)',
          border: `1px solid ${isDirty ? 'rgba(200,155,72,0.45)' : 'rgba(72,128,190,0.30)'}`,
          color: '#e8f4ff',
          fontFamily: 'Georgia, serif',
          fontSize: 13,
          lineHeight: 1.6,
          resize: 'none',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <div style={{ fontSize: 10, color: 'rgba(190,215,245,0.40)' }}>
          {draft.length} / 2000 characters
          {isDirty && <span style={{ color: 'rgba(210,160,80,0.7)', marginLeft: 8 }}>· Unsaved changes</span>}
        </div>
        <button
          style={{
            padding: '8px 20px', borderRadius: 8,
            border: `1px solid ${isDirty ? 'rgba(240,189,120,0.65)' : 'rgba(72,128,190,0.30)'}`,
            background: isDirty
              ? 'linear-gradient(180deg, #c09040 0%, #8a5e10 50%, #6a4408 100%)'
              : 'rgba(72,128,190,0.08)',
            color: isDirty ? '#fff8ea' : 'rgba(190,215,245,0.40)',
            cursor: isDirty ? 'pointer' : 'not-allowed',
            fontFamily: 'Georgia, serif', fontSize: 12, letterSpacing: 1,
            transition: 'all 0.2s',
          }}
          disabled={!isDirty}
          onClick={() => setDeckNotes(deckId, draft)}
        >
          Save Notes
        </button>
      </div>
    </div>
  );
}
