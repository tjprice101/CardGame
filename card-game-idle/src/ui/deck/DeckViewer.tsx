import { useState } from 'react';
import { useStore } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { SET_ACCENT, SET_LABEL } from '@/data/elements';
import { uiTypography } from '@/ui/theme';
import type { CardDefinition } from '@/types/cards';
import type { SavedDeck } from '@/types/game';

// ── Design palette ────────────────────────────────────────────────────────────
const P = {
  bg: 'linear-gradient(162deg, #040a15 0%, #060e1c 50%, #030810 100%)',
  glow: 'radial-gradient(ellipse 55% 40% at 50% 0%, rgba(78,158,220,0.18) 0%, transparent 55%)',
  panel: 'rgba(4,10,24,0.78)',
  panelActive: 'rgba(78,160,220,0.14)',
  border: 'rgba(110,160,215,0.30)',
  borderStrong: 'rgba(72,128,190,0.54)',
  accent: '#72caf5',
  accentDeep: '#1e5890',
  accentGold: '#6ec8f5',
  accentGlow: 'rgba(88,180,235,0.45)',
  success: '#7de88a',
  successBg: 'rgba(90,175,100,0.14)',
  text: '#f0f6ff',
  textMuted: 'rgba(205,228,255,0.78)',
  textFaint: 'rgba(165,205,245,0.52)',
};

const RARITY_COLORS: Record<string, string> = {
  Common: '#aaa',
  Rare: '#5b9bd5',
  Epic: '#9b59b6',
  Legendary: '#f39c12',
  Eternal: '#ff6b6b',
  Infinite: '#e8e8f0',
};

const RARITY_GLYPH: Record<string, string> = {
  Common: '◇',
  Rare: '◈',
  Epic: '✦',
  Legendary: '★',
  Eternal: '✸',
  Infinite: '∞',
};

const TYPE_ORDER: CardDefinition['type'][] = ['Ophanim', 'Seraphim', 'Cherubim', 'Angel'];
const TYPE_LABELS: Record<CardDefinition['type'], string> = {
  Ophanim: 'Ophanim', Seraphim: 'Seraphim', Cherubim: 'Cherubim', Angel: 'Angel',
};
const TYPE_ACCENT: Record<CardDefinition['type'], string> = {
  Ophanim: '#ff9966', Seraphim: '#ffcc66', Cherubim: '#aaddff', Angel: '#99ffcc',
};
const RARITY_ORDER: Record<string, number> = {
  Common: 0, Rare: 1, Epic: 2, Legendary: 3, Eternal: 4, Infinite: 5,
};

type PreviewSection = {
  label: string;
  type: CardDefinition['type'];
  entries: Array<{ definitionId: string; copies: number; def: CardDefinition }>;
};

interface Props { onClose: () => void; onOpenDeckBuilder: () => void }

export default function DeckViewer({ onClose, onOpenDeckBuilder }: Props) {
  const savedDecks = useStore(s => s.progress.savedDecks);
  const activeDeckId = useStore(s => s.progress.activeDeckId);
  const { loadSavedDeck, deleteSavedDeck } = useStore.getState();

  const [selectedId, setSelectedId] = useState<string>(activeDeckId ?? savedDecks[0]?.id ?? '');

  const selectedDeck = savedDecks.find(d => d.id === selectedId) ?? null;

  function handleLoad(deckId: string) {
    loadSavedDeck(deckId);
    onClose();
  }

  function handleDelete(deck: SavedDeck) {
    if (!window.confirm(`Delete deck "${deck.name}"? This cannot be undone.`)) return;
    deleteSavedDeck(deck.id);
    const next = savedDecks.find(d => d.id !== deck.id);
    setSelectedId(next?.id ?? '');
  }

  function buildPreview(deck: SavedDeck) {
    const grouped = new Map<string, { definitionId: string; copies: number; def: CardDefinition }>();
    const push = (definitionId: string, copies: number) => {
      const def = CardRegistry.get(definitionId);
      if (!def) return;
      const ex = grouped.get(definitionId);
      if (ex) { ex.copies += copies; return; }
      grouped.set(definitionId, { definitionId, copies, def });
    };
    deck.deckList.forEach(e => push(e.definitionId, e.copies));
    (deck.extraDeck ?? []).forEach(e => push(e.definitionId, 1));

    const totalCards = deck.deckList.reduce((s, e) => s + e.copies, 0) + (deck.extraDeck?.length ?? 0);
    const elements = new Set<string>(['Neutrality']);
    const rarityCounts: Record<string, number> = {};
    grouped.forEach(e => { rarityCounts[e.def.rarity] = (rarityCounts[e.def.rarity] ?? 0) + e.copies; });

    const sections: PreviewSection[] = TYPE_ORDER.map(typeKey => ({
      label: TYPE_LABELS[typeKey],
      type: typeKey,
      entries: Array.from(grouped.values())
        .filter(e => e.def.type === typeKey)
        .sort((a, b) => {
          const rd = (RARITY_ORDER[a.def.rarity] ?? 99) - (RARITY_ORDER[b.def.rarity] ?? 99);
          return rd !== 0 ? rd : a.def.name.localeCompare(b.def.name);
        }),
    })).filter(s => s.entries.length > 0);

    return { sections, totalCards, elements, rarityCounts };
  }

  return (
    <div
      className="ui-panel-intro"
      style={{
        position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'auto',
        background: P.bg, display: 'flex', flexDirection: 'column',
        fontFamily: uiTypography.body, color: P.text,
      }}
    >
      {/* Ambient glow */}
      <div style={{ position: 'absolute', inset: 0, background: P.glow, pointerEvents: 'none' }} />
      {/* Atmospheric washes */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '70%', height: '85%', background: 'radial-gradient(ellipse, rgba(78,165,225,0.28) 0%, rgba(25,88,170,0.12) 42%, transparent 68%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-18%', right: '-8%', width: '60%', height: '70%', background: 'radial-gradient(ellipse, rgba(22,65,200,0.22) 0%, transparent 65%)', filter: 'blur(90px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 44%, transparent 22%, rgba(0,0,0,0.65) 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)', pointerEvents: 'none' }} />

      {/* Header */}
      <div
        className="ui-shimmer-band"
        style={{
          position: 'relative', flexShrink: 0,
          padding: 'clamp(18px,2vw,28px) clamp(28px,3vw,52px) clamp(14px,1.6vw,20px)',
          borderBottom: `1px solid ${P.borderStrong}`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div
            className="ui-title-glow"
            style={{
              fontFamily: uiTypography.display, fontSize: 'clamp(22px,2.2vw,30px)', fontWeight: 300,
              color: P.accent, letterSpacing: 6,
              textShadow: `0 2px 28px ${P.accentGlow}, 0 0 60px rgba(220,170,60,0.12)`,
              lineHeight: 1.1,
            }}
          >
            DECK VIEWER
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ height: 1, width: 60, background: `linear-gradient(90deg, ${P.accentDeep}80, transparent)` }} />
            <span style={{ fontSize: 11, color: `${P.accentDeep}99` }}>❖</span>
            <div style={{ fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: `${P.accentDeep}88`, fontWeight: 400 }}>
              {savedDecks.length} Saved Deck{savedDecks.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <button
          className="menu-tactile-btn"
          onClick={onClose}
          style={{
            width: 42, height: 42, borderRadius: '50%', cursor: 'pointer',
            background: 'rgba(200,128,58,0.08)', border: `1px solid ${P.border}`,
            color: P.textMuted, fontSize: 16, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0, transition: 'all 0.18s ease', padding: 0,
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* Deck list sidebar */}
        <div style={{
          width: 260, flexShrink: 0, borderRight: `1px solid ${P.border}`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: 'rgba(5,10,20,0.60)',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            padding: '10px 16px', fontSize: 9, letterSpacing: 2,
            textTransform: 'uppercase', color: P.textMuted,
            borderBottom: `1px solid ${P.border}`, flexShrink: 0,
          }}>
            Saved Decks
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
            {savedDecks.length === 0 && (
              <div style={{ padding: 16, fontSize: 13, color: P.textFaint, fontStyle: 'italic' }}>
                No decks saved yet.
              </div>
            )}
            {savedDecks.map(deck => {
              const isActive = deck.id === activeDeckId;
              const isSelected = deck.id === selectedId;
              const cardCount = deck.deckList.reduce((s, e) => s + e.copies, 0) + (deck.extraDeck?.length ?? 0);
              return (
                <div
                  key={deck.id}
                  onClick={() => setSelectedId(deck.id)}
                  style={{
                    padding: '10px 16px', cursor: 'pointer',
                    borderBottom: `1px solid ${P.border}`,
                    background: isSelected ? P.panelActive : 'transparent',
                    borderLeft: isSelected ? `3px solid ${P.accent}` : '3px solid transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      flex: 1, fontSize: 13, color: isSelected ? P.accent : P.text,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      fontWeight: isSelected ? 600 : 400,
                    }}>
                      {deck.isStarter ? '🔒 ' : ''}{deck.name}
                    </div>
                    {isActive && (
                      <div style={{
                        fontSize: 9, padding: '2px 6px', borderRadius: 8,
                        border: `1px solid ${P.success}44`, color: P.success, letterSpacing: 1,
                      }}>
                        ACTIVE
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: P.textMuted, marginTop: 2 }}>
                    {cardCount} cards
                  </div>
                </div>
              );
            })}
          </div>

          {/* Open Deck Builder button */}
          <div style={{ padding: 12, borderTop: `1px solid ${P.border}`, flexShrink: 0 }}>
            <button
              className="menu-tactile-btn"
              onClick={onOpenDeckBuilder}
              style={{
                width: '100%', padding: '9px 0', borderRadius: 8,
                border: `1px solid ${P.borderStrong}`,
                background: 'linear-gradient(180deg, #5aabdc 0%, #3888c4 100%)',
                color: '#0c1e34',
                fontSize: 12, cursor: 'pointer', fontFamily: uiTypography.display, letterSpacing: 2,
                fontWeight: 700, textTransform: 'uppercase',
                boxShadow: `0 4px 16px ${P.accentGlow}`,
              }}
            >
              Deck Builder
            </button>
          </div>
        </div>

        {/* Preview panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedDeck ? (() => {
            const { sections, totalCards, elements, rarityCounts } = buildPreview(selectedDeck);
            const isActive = selectedDeck.id === activeDeckId;
            return (
              <>
                {/* Preview header */}
                <div style={{
                  padding: '14px 20px', borderBottom: `1px solid ${P.border}`, flexShrink: 0,
                  background: 'rgba(0,0,0,0.2)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: P.accent, flex: 1 }}>
                      {selectedDeck.name}
                    </div>
                    <div style={{ fontSize: 12, color: P.textMuted }}>{totalCards} cards</div>
                    {!selectedDeck.isStarter && !isActive && (
                      <button
                        className="menu-tactile-btn"
                        onClick={() => handleDelete(selectedDeck)}
                        style={{
                          padding: '5px 14px', borderRadius: 6,
                          border: '1px solid rgba(255,80,80,0.30)',
                          background: 'rgba(255,60,60,0.10)', color: 'rgba(255,130,130,0.80)',
                          fontSize: 12, cursor: 'pointer', fontFamily: uiTypography.body,
                        }}
                      >
                        Delete
                      </button>
                    )}
                    {!isActive && (
                      <button
                        className="menu-tactile-btn"
                        onClick={() => handleLoad(selectedDeck.id)}
                        style={{
                          padding: '5px 18px', borderRadius: 6,
                          border: `1px solid ${P.borderStrong}`,
                          background: 'linear-gradient(180deg, #5aabdc 0%, #3888c4 100%)',
                          color: '#0c1e34',
                          fontSize: 12, cursor: 'pointer', fontFamily: uiTypography.display,
                          letterSpacing: 1, fontWeight: 700,
                          boxShadow: `0 4px 14px ${P.accentGlow}`,
                        }}
                      >
                        Load Deck
                      </button>
                    )}
                    {isActive && (
                      <div style={{
                        fontSize: 11, padding: '4px 10px', borderRadius: 6,
                        border: `1px solid ${P.success}44`, color: P.success,
                      }}>
                        Active Deck
                      </div>
                    )}
                  </div>

                  {/* Element + rarity pill strip */}
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    {[...elements].map(el => (
                      <div key={el} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '3px 9px', borderRadius: 20,
                        border: `1px solid ${(SET_ACCENT)}44`,
                        background: `${(SET_ACCENT)}11`,
                        fontSize: 11,
                      }}>
                        <div style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: SET_ACCENT,
                          boxShadow: `0 0 5px ${SET_ACCENT}88`,
                        }} />
                        <span style={{ color: SET_ACCENT }}>
                          {SET_LABEL}
                        </span>
                      </div>
                    ))}
                    <div style={{ width: 1, background: P.border, alignSelf: 'stretch', margin: '0 4px' }} />
                    {Object.entries(rarityCounts)
                      .sort((a, b) => (RARITY_ORDER[b[0]] ?? 0) - (RARITY_ORDER[a[0]] ?? 0))
                      .map(([rarity, count]) => (
                        <div key={rarity} style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '3px 9px', borderRadius: 20,
                          border: `1px solid ${(RARITY_COLORS[rarity] ?? '#888')}44`,
                          background: `${(RARITY_COLORS[rarity] ?? '#888')}11`,
                          fontSize: 11,
                        }}>
                          <span style={{ color: RARITY_COLORS[rarity] ?? '#aaa' }}>
                            {RARITY_GLYPH[rarity] ?? '?'}
                          </span>
                          <span style={{ color: P.textMuted }}>{count}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>

                {/* Card list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
                  {sections.map((section, si) => (
                      <div key={section.type} style={{ marginTop: si === 0 ? 0 : 20 }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          marginBottom: 8, paddingBottom: 6,
                          borderBottom: `1px solid ${TYPE_ACCENT[section.type]}44`,
                        }}>
                          <div style={{ width: 3, height: 14, borderRadius: 2, background: TYPE_ACCENT[section.type], flexShrink: 0 }} />
                          <span style={{
                            fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase',
                            color: TYPE_ACCENT[section.type], fontWeight: 600,
                            fontFamily: uiTypography.display,
                          }}>
                            {section.label} ({section.entries.reduce((s, e) => s + e.copies, 0)})
                          </span>
                      </div>
                      {section.entries.map(entry => (
                        <div
                          key={entry.definitionId}
                          style={{
                            display: 'flex', alignItems: 'center',
                            padding: '4px 0', borderBottom: `1px solid ${P.border}`,
                          }}
                        >
                          <span style={{
                            fontSize: 13, color: RARITY_COLORS[entry.def.rarity] ?? '#aaa',
                            marginRight: 7, opacity: 0.85,
                          }}>
                            {RARITY_GLYPH[entry.def.rarity] ?? '?'}
                          </span>
                          <span style={{ flex: 1, fontSize: 12, color: P.text }}>
                            {entry.def.name}
                          </span>
                          <span style={{ fontSize: 11, color: P.accentDeep, minWidth: 28, textAlign: 'right' }}>
                            ×{entry.copies}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            );
          })() : (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: P.textFaint, fontStyle: 'italic',
            }}>
              Select a deck to preview
            </div>
          )}
        </div>
      </div>

      {/* Bottom accent */}
      <div style={{
        height: 2, flexShrink: 0,
        background: `linear-gradient(90deg, transparent, ${P.border}, transparent)`,
      }} />
    </div>
  );
}

