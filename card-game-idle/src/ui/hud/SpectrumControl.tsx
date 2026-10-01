import { useEffect, useState } from 'react';
import { useStore, selectDeck, selectTurn } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { getDisplayCardTypeLabel } from '@/ui/preferences';
import {
  MAX_SPECTRUM_LEVEL,
  getCardSpectrumLevel,
  getSpectrumLevelUpBlocker,
  getSpectrumLevelUpCost,
  getTurnSpectrumLevel,
} from '@/systems/cards/SpectrumLevel';
import { uiTypography } from '@/ui/theme';

export const RAISE_SPECTRUM_EVENT = 'hr-raise-spectrum';

/** Spectrum Level readout + "Raise Spectrum" button and the hand-card sacrifice picker. */
export default function SpectrumControl() {
  const turn = useStore(selectTurn);
  const deck = useStore(selectDeck);
  const raiseSpectrumLevel = useStore(s => s.raiseSpectrumLevel);
  const [pickerOpen, setPickerOpen] = useState(false);

  const level = getTurnSpectrumLevel(turn);
  const isPlaying = turn.phase === 'playing' && !turn.pendingEffect && !turn.shatterInfiniteLight && !turn.attackSequence;
  const blocker = isPlaying ? getSpectrumLevelUpBlocker(turn, deck.hand.length) : 'Only during your turn';
  const cost = getSpectrumLevelUpCost(level);
  const atMax = level >= MAX_SPECTRUM_LEVEL;

  useEffect(() => {
    const open = () => {
      const state = useStore.getState();
      const playing = state.turn.phase === 'playing' && !state.turn.pendingEffect && !state.turn.shatterInfiniteLight && !state.turn.attackSequence;
      if (playing && !getSpectrumLevelUpBlocker(state.turn, state.deck.hand.length)) setPickerOpen(true);
    };
    window.addEventListener(RAISE_SPECTRUM_EVENT, open);
    return () => window.removeEventListener(RAISE_SPECTRUM_EVENT, open);
  }, []);

  useEffect(() => {
    if (!isPlaying) setPickerOpen(false);
  }, [isPlaying]);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'auto' }}>
        <span style={pillStyle('rgba(214,196,255,0.55)', '#e4d8ff')} title="Cards above your Spectrum Level cannot be played or summoned.">
          Spectrum Lv {level}/{MAX_SPECTRUM_LEVEL}
        </span>
        {!atMax && (
          <button
            type="button"
            disabled={!!blocker}
            title={blocker ?? `Spend ${cost} Limitless Light Stacks and sacrifice 1 hand card to the Light-bound Abyss`}
            onClick={() => setPickerOpen(true)}
            style={{
              ...pillStyle(blocker ? 'rgba(160,150,190,0.35)' : 'rgba(214,196,255,0.85)', blocker ? 'rgba(220,210,240,0.5)' : '#ffffff'),
              cursor: blocker ? 'not-allowed' : 'pointer',
              background: blocker ? 'rgba(30,24,44,0.7)' : 'linear-gradient(180deg, rgba(120,90,200,0.9), rgba(60,40,120,0.92))',
            }}
          >
            Raise Spectrum ({cost} LLS + 1 card)
          </button>
        )}
      </div>

      {pickerOpen && (
        <div
          role="dialog"
          aria-label="Sacrifice a card to the Light-bound Abyss"
          onClick={() => setPickerOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(4,2,10,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: 'min(560px, 92vw)', maxHeight: '70vh', overflowY: 'auto', padding: 18, borderRadius: 12, border: '1px solid rgba(214,196,255,0.5)', background: 'linear-gradient(180deg, #120c22, #07050f)', color: '#ece4ff', fontFamily: uiTypography.body }}
          >
            <div style={{ fontFamily: uiTypography.display, fontSize: 16, letterSpacing: 1.2 }}>Raise Spectrum to Lv {level + 1}</div>
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4, lineHeight: 1.45 }}>
              Spend {cost} Limitless Light Stacks and choose 1 card from your hand to sacrifice to the Light-bound Abyss. Abyss cards cannot be retrieved until your deck resets.
            </div>
            <div style={{ display: 'grid', gap: 6, marginTop: 12 }}>
              {deck.hand.map(card => {
                const def = CardRegistry.get(card.definitionId);
                return (
                  <button
                    key={card.instanceId}
                    type="button"
                    onClick={() => {
                      if (raiseSpectrumLevel(card.instanceId)) setPickerOpen(false);
                    }}
                    style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(214,196,255,0.25)', background: 'rgba(255,255,255,0.04)', color: '#ece4ff', cursor: 'pointer', fontSize: 12, textAlign: 'left' }}
                  >
                    <span>{def?.name ?? card.definitionId}</span>
                    <span style={{ opacity: 0.65 }}>
                      {def ? `${getDisplayCardTypeLabel(def.type)} · Lv ${getCardSpectrumLevel(def)}` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setPickerOpen(false)}
              style={{ marginTop: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(214,196,255,0.3)', background: 'transparent', color: '#ece4ff', cursor: 'pointer', fontSize: 11 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function pillStyle(border: string, color: string): React.CSSProperties {
  return {
    padding: '4px 11px',
    borderRadius: 999,
    border: `1px solid ${border}`,
    background: 'rgba(24,16,40,0.82)',
    color,
    fontFamily: uiTypography.body,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.4,
    boxShadow: '0 3px 12px rgba(0,0,0,0.24)',
    whiteSpace: 'nowrap',
  };
}
