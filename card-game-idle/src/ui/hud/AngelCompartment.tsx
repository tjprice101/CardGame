import { useState } from 'react';
import { useStore, selectBoard, selectTurn, selectExtraDeck } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { CardEffectExecutor } from '@/systems/cards/CardEffectExecutor';
import { warmTheme } from '@/ui/theme';
import type { AngelDefinition } from '@/types/cards';

type AngelLocation = 'available' | 'on_board';

const LOCATION_LABEL: Record<AngelLocation, { text: string; color: string }> = {
  available: { text: 'AVAILABLE', color: warmTheme.textMuted },
  on_board:  { text: 'ON BOARD',  color: warmTheme.success },
};

export default function AngelCompartment() {
  const [open, setOpen] = useState(false);
  const board = useStore(selectBoard);
  const turn = useStore(selectTurn);
  const extraDeck = useStore(selectExtraDeck);
  const { summonAngel } = useStore.getState();

  const isPlaying = turn.phase === 'playing';
  const angelsOnBoard = board.frontSlots.filter(s => s?.type === 'Angel').length;

  return (
    <div style={{
      position: 'absolute',
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      alignItems: 'stretch',
      zIndex: 30,
      pointerEvents: 'auto',
    }}>
      {/* Slide-in panel */}
      <div style={{
        width: open ? 260 : 0,
        overflow: 'hidden',
        transition: 'width 0.22s ease',
        background: warmTheme.surfaceStrong,
        borderLeft: open ? `1px solid ${warmTheme.border}` : 'none',
        borderTop: open ? `1px solid ${warmTheme.border}` : 'none',
        borderBottom: open ? `1px solid ${warmTheme.border}` : 'none',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: open ? warmTheme.shadow : 'none',
      }}>
        <div style={{
          width: 260,
          padding: '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxHeight: '70vh',
          overflowY: 'auto',
        }}>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: 10,
            letterSpacing: 2,
            color: warmTheme.textMuted,
            textTransform: 'uppercase',
            marginBottom: 2,
          }}>
            Extra Deck — {angelsOnBoard} / {extraDeck.length} on board
          </div>

          {extraDeck.length === 0 && (
            <div style={{
              fontFamily: 'Georgia, serif',
              fontSize: 11,
              color: warmTheme.textFaint,
              textAlign: 'center',
              padding: '20px 0',
            }}>
              No angels in extra deck
            </div>
          )}

          {extraDeck.map(definitionId => {
            const def = CardRegistry.get(definitionId);
            if (!def || def.type !== 'Angel') return null;
            const angelDef = def as AngelDefinition;

            const isOnBoard = board.frontSlots.some(sl => sl?.definitionId === definitionId);
            const location: AngelLocation = isOnBoard ? 'on_board' : 'available';
            const playable = !isOnBoard && isPlaying &&
              CardEffectExecutor.checkPlayable(angelDef, 0, turn, board);

            const boardSerCount: Record<string, number> = {};
            for (const slot of board.frontSlots) {
              if (slot?.type === 'Seraphim') {
                boardSerCount[slot.definitionId] = (boardSerCount[slot.definitionId] ?? 0) + 1;
              }
            }
            const costProgress: Record<string, number> = {};
            for (const id of angelDef.summonCost) {
              costProgress[id] = (costProgress[id] ?? 0) + 1;
            }

            return (
              <div
                key={definitionId}
                style={{
                  background: warmTheme.surface,
                  border: playable
                    ? `1px solid ${warmTheme.borderStrong}`
                    : isOnBoard
                      ? `1px solid rgba(79,138,71,0.35)`
                      : `1px solid ${warmTheme.border}`,
                  borderRadius: 12,
                  padding: '10px 10px 8px',
                  fontFamily: 'Georgia, serif',
                  cursor: playable ? 'pointer' : 'default',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxShadow: playable ? warmTheme.glow : 'none',
                }}
                onClick={() => {
                  if (playable) {
                    summonAngel(definitionId);
                    setOpen(false);
                  }
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 'bold', color: warmTheme.accentDeep }}>
                    {angelDef.name}
                  </div>
                  <div style={{
                    fontSize: 8,
                    letterSpacing: 1,
                    color: LOCATION_LABEL[location].color,
                    textTransform: 'uppercase',
                  }}>
                    {LOCATION_LABEL[location].text}
                  </div>
                </div>

                {/* Description */}
                <div style={{
                  fontSize: 10, color: warmTheme.textSoft, lineHeight: 1.45, marginBottom: 8,
                  display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {angelDef.description}
                </div>

                {/* Summon cost */}
                {!isOnBoard && (
                  <>
                    <div style={{ fontSize: 9, color: warmTheme.textMuted, marginBottom: 4, letterSpacing: 0.5 }}>
                      SUMMON COST
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {Object.entries(costProgress).map(([costId, needed]) => {
                        const costDef = CardRegistry.get(costId);
                        const have = boardSerCount[costId] ?? 0;
                        const met = have >= needed;
                        return (
                          <div key={costId} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: 10, color: met ? warmTheme.success : 'rgba(255,80,80,0.8)' }}>
                              {met ? '✓' : '✕'}
                            </span>
                            <span style={{ fontSize: 9, color: warmTheme.textSoft }}>
                              {needed > 1 ? `${needed}× ` : ''}{costDef?.name ?? costId}
                            </span>
                            <span style={{ fontSize: 8, color: warmTheme.textFaint, marginLeft: 'auto' }}>
                              {have}/{needed}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {playable && (
                  <div style={{
                    marginTop: 8,
                    textAlign: 'center',
                    fontSize: 9,
                    color: warmTheme.accentDeep,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    opacity: 0.8,
                  }}>
                    Click to Summon
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Toggle tab */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 26,
          alignSelf: 'stretch',
          background: warmTheme.surfaceStrong,
          border: `1px solid ${warmTheme.border}`,
          borderRight: 'none',
          borderRadius: '12px 0 0 12px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          fontFamily: 'Georgia, serif',
          padding: '8px 0',
        }}
      >
        <span style={{ fontSize: 12, color: warmTheme.accentDeep, writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: 1 }}>
          ANGELS
        </span>
        {extraDeck.length > 0 && (
          <span style={{
            fontSize: 9,
            color: angelsOnBoard > 0 ? warmTheme.success : warmTheme.accentDeep,
            background: angelsOnBoard > 0 ? 'rgba(79,138,71,0.1)' : 'rgba(181,106,46,0.1)',
            borderRadius: 4,
            padding: '1px 4px',
            minWidth: 14,
            textAlign: 'center',
          }}>
            {angelsOnBoard}/{extraDeck.length}
          </span>
        )}
        <span style={{ fontSize: 10, color: warmTheme.textMuted }}>
          {open ? '›' : '‹'}
        </span>
      </button>
    </div>
  );
}
