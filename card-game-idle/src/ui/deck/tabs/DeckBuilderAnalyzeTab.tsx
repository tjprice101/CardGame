import { useEffect, useMemo, useState } from 'react';
import { CardRegistry } from '@/cards/CardRegistry';
import { warmTheme } from '@/ui/theme';
import { isDisplayCherubimType } from '@/ui/preferences';
import type { DeckEntry, ExtraDeckEntry } from '@/types/game';

const RARITY_COLORS: Record<string, string> = {
  Common: '#777', Rare: '#5b9bd5', Epic: '#9b59b6',
  Legendary: '#f39c12', Eternal: '#ff6b6b', Infinite: '#e0e0f0', Enigmatic: '#b370e8',
};

const RARITY_ORDER = ['Legendary', 'Eternal', 'Infinite', 'Enigmatic', 'Epic', 'Rare', 'Common'];

interface DeckStats {
  rarityCounts: Record<string, number>;
  typeSeraphim: number;
  typeCherubim: number;
  typeOphanim: number;
}

interface Props {
  deckList: DeckEntry[];
  extraDeckList: ExtraDeckEntry[];
  totalCards: number;
  deckStats: DeckStats;
  deckId: string | null;
  currentNotes: string;
  setDeckNotes: (deckId: string, notes: string) => void;
}

type CardRow = { name: string; rarity: string; count: number; finish: string };

function renderSection(label: string, rows: CardRow[], accent: string): React.ReactNode {
  if (rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => {
    const ri = RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
    return ri !== 0 ? ri : a.name.localeCompare(b.name);
  });
  return (
    <div key={label} style={{ marginBottom: 14 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, paddingBottom: 4,
        borderBottom: `1px solid ${accent}33`,
      }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: accent, flexShrink: 0 }} />
        <span style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: accent, fontWeight: 'bold' }}>
          {label}
        </span>
        <span style={{ fontSize: 9, color: 'rgba(190,215,245,0.40)', marginLeft: 'auto' }}>
          {rows.reduce((s, r) => s + r.count, 0)} cards
        </span>
      </div>
      {sorted.map((row, i) => (
        <div key={`${row.name}-${row.finish}-${i}`} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '3px 4px', borderRadius: 4,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: RARITY_COLORS[row.rarity] ?? '#777' }} />
          <span style={{ fontSize: 10.5, color: 'rgba(205,228,255,0.80)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.name}{row.finish === 'holo' ? ' ✦' : ''}
          </span>
          <span style={{ fontSize: 10, color: '#7dd4f8', fontWeight: 'bold', flexShrink: 0 }}>×{row.count}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Merges the former Stats + Notes tabs into a single "Analyze" sub-tab.
 * Stats render first (always visible); Notes render below as an expandable
 * section so they stay one click away without needing a dedicated tab.
 */
export default function DeckBuilderAnalyzeTab({ deckList, extraDeckList, totalCards, deckStats, deckId, currentNotes, setDeckNotes }: Props) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [draft, setDraft] = useState(currentNotes);
  const isDirty = draft !== currentNotes;

  useEffect(() => { setDraft(currentNotes); }, [currentNotes]);

  const sections = useMemo(() => {
    const seraphim: CardRow[] = [];
    const cherubim: CardRow[] = [];
    const ophanim: CardRow[] = [];
    const angels: CardRow[] = [];

    for (const entry of deckList) {
      const def = CardRegistry.get(entry.definitionId);
      if (!def) continue;
      const target = def.type === 'Seraphim' ? seraphim
        : isDisplayCherubimType(def.type) ? cherubim
        : ophanim;
      const existing = target.find(e => e.name === def.name && e.finish === entry.finish);
      if (existing) existing.count += entry.copies;
      else target.push({ name: def.name, rarity: def.rarity, count: entry.copies, finish: entry.finish });
    }

    for (const entry of extraDeckList) {
      const def = CardRegistry.get(entry.definitionId);
      if (!def) continue;
      const existing = angels.find(e => e.name === def.name && e.finish === entry.finish);
      if (existing) existing.count += 1;
      else angels.push({ name: def.name, rarity: def.rarity, count: 1, finish: entry.finish });
    }

    return { seraphim, cherubim, ophanim, angels };
  }, [deckList, extraDeckList]);

  if (totalCards === 0 && extraDeckList.length === 0 && !deckId) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 13, color: 'rgba(165,205,245,0.45)', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
          Add cards to see deck statistics.
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', fontFamily: 'Georgia, serif' }}>
      {/* Overview row */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 16, padding: '10px 14px', borderRadius: 8,
        background: 'rgba(5,8,16,0.7)', border: '1px solid rgba(62,112,168,0.22)',
      }}>
        <div style={{ textAlign: 'center', minWidth: 40 }}>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: totalCards === 50 ? '#80e860' : '#7dd4f8', lineHeight: 1 }}>
            {totalCards}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(190,215,245,0.50)', letterSpacing: 1, marginTop: 2 }}>Main / 50</div>
        </div>
        <div style={{ width: 1, background: 'rgba(72,128,190,0.22)', flexShrink: 0 }} />
        <div style={{ textAlign: 'center', minWidth: 40 }}>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: '#70c890', lineHeight: 1 }}>
            {extraDeckList.length}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(190,215,245,0.50)', letterSpacing: 1, marginTop: 2 }}>Extra / 10</div>
        </div>
        <div style={{ width: 1, background: 'rgba(72,128,190,0.22)', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
          <div style={{ display: 'flex', gap: 8, fontSize: 10, flexWrap: 'wrap' }}>
            <span style={{ color: '#f0bd78' }}>Ser: <strong>{deckStats.typeSeraphim}</strong></span>
            <span style={{ color: warmTheme.cherubim }}>Che: <strong>{deckStats.typeCherubim}</strong></span>
            <span style={{ color: '#9070b8' }}>Oph: <strong>{deckStats.typeOphanim}</strong></span>
          </div>
          {totalCards > 0 && (
            <div style={{ display: 'flex', height: 5, borderRadius: 2, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
              {RARITY_ORDER.map(r => {
                const n = deckStats.rarityCounts[r] ?? 0;
                if (n === 0) return null;
                return <div key={r} style={{ width: `${(n / totalCards) * 100}%`, background: RARITY_COLORS[r] ?? '#555', transition: 'width 0.3s' }} />;
              })}
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 9 }}>
            {RARITY_ORDER.map(r => {
              const n = deckStats.rarityCounts[r] ?? 0;
              if (n === 0) return null;
              return <span key={r} style={{ color: RARITY_COLORS[r] ?? '#777' }}>{r[0]}: <strong>{n}</strong></span>;
            })}
          </div>
        </div>
      </div>

      {renderSection('Seraphim', sections.seraphim, '#f0bd78')}
      {renderSection('Cherubim', sections.cherubim, warmTheme.cherubim)}
      {renderSection('Ophanim', sections.ophanim, '#9070b8')}
      {renderSection('Extra Deck (Angels)', sections.angels, '#70c890')}

      {/* Notes — expandable, one click away */}
      <div style={{ marginTop: 8, borderTop: '1px solid rgba(72,128,190,0.18)', paddingTop: 12 }}>
        <button
          className="menu-tactile-btn"
          onClick={() => setNotesOpen(v => !v)}
          disabled={!deckId}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 2px', background: 'transparent', border: 'none', cursor: deckId ? 'pointer' : 'not-allowed',
            color: 'rgba(190,215,245,0.60)', fontFamily: 'Georgia, serif',
          }}
        >
          <span style={{ fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase' }}>
            📝 How-to-Play Notes{isDirty ? ' · Unsaved' : ''}
          </span>
          <span>{notesOpen ? '▾' : '▸'}</span>
        </button>
        {notesOpen && (
          !deckId ? (
            <div style={{ fontSize: 12, color: 'rgba(165,205,245,0.45)', fontStyle: 'italic', marginTop: 8 }}>
              Load a saved deck to edit its notes.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="Describe how this deck plays — opener, key combos, win condition, side tech…"
                maxLength={2000}
                rows={6}
                style={{
                  boxSizing: 'border-box',
                  padding: 12,
                  borderRadius: 8,
                  background: 'rgba(2,5,12,0.75)',
                  border: `1px solid ${isDirty ? 'rgba(200,155,72,0.45)' : 'rgba(72,128,190,0.30)'}`,
                  color: '#e8f4ff',
                  fontFamily: 'Georgia, serif',
                  fontSize: 12,
                  lineHeight: 1.6,
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(190,215,245,0.40)' }}>
                  {draft.length} / 2000
                </div>
                <button
                  style={{
                    padding: '6px 16px', borderRadius: 7,
                    border: `1px solid ${isDirty ? 'rgba(240,189,120,0.65)' : 'rgba(72,128,190,0.30)'}`,
                    background: isDirty
                      ? 'linear-gradient(180deg, #c09040 0%, #8a5e10 50%, #6a4408 100%)'
                      : 'rgba(72,128,190,0.08)',
                    color: isDirty ? '#fff8ea' : 'rgba(190,215,245,0.40)',
                    cursor: isDirty ? 'pointer' : 'not-allowed',
                    fontFamily: 'Georgia, serif', fontSize: 11, letterSpacing: 1,
                    transition: 'all 0.2s',
                  }}
                  disabled={!isDirty}
                  onClick={() => setDeckNotes(deckId, draft)}
                >
                  Save Notes
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
