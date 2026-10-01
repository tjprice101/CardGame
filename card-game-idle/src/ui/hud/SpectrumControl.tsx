import { useEffect, useState } from 'react';
import { useStore, selectDeck, selectTurn } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { getDisplayCardTypeLabel } from '@/ui/preferences';
import {
  cardFacePalette,
  getCardFaceMetrics,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
  getLiveCardFaceBackgroundStyle,
  getLiveCardShimmerClassName,
} from '@/ui/cardBackgrounds';
import { getCardPreviewText } from '@/ui/cardStatSummary';
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
  const faceMetrics = getCardFaceMetrics('grid');

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 7, width: '100%', pointerEvents: 'auto' }}>
        <section
          aria-label={`Spectrum Level ${level} of ${MAX_SPECTRUM_LEVEL}`}
          title="Cards above your Spectrum Level cannot be played or summoned."
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '11px 12px 10px',
            borderRadius: 10,
            border: '1px solid rgba(171,218,255,0.42)',
            background: 'radial-gradient(circle at 88% 5%, rgba(255,91,154,0.17), transparent 42%), linear-gradient(145deg, rgba(9,17,29,0.98), rgba(23,12,30,0.96))',
            boxShadow: '0 8px 22px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 18px rgba(119,193,255,0.12)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <span style={{ color: 'rgba(226,237,255,0.68)', fontFamily: uiTypography.display, fontSize: 8, letterSpacing: 1.8, textTransform: 'uppercase' }}>Spectrum Level</span>
            <span style={{ color: '#f8f3ff', fontFamily: uiTypography.display, fontSize: 19, fontWeight: 700, lineHeight: 1, textShadow: '0 0 14px rgba(158,203,255,0.5)' }}>{level}<span style={{ color: 'rgba(226,237,255,0.48)', fontSize: 10 }}> / {MAX_SPECTRUM_LEVEL}</span></span>
          </div>
          <div aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: `repeat(${MAX_SPECTRUM_LEVEL + 1}, 1fr)`, gap: 4, marginTop: 9 }}>
            {Array.from({ length: MAX_SPECTRUM_LEVEL + 1 }, (_, index) => (
              <div key={index} style={{ height: 4, borderRadius: 3, background: index <= level ? ['#91e4d0', '#86cfff', '#9b9cff', '#ce91ff', '#ff91bb', '#ffd28a'][index] : 'rgba(226,237,255,0.12)', boxShadow: index === level ? '0 0 10px rgba(190,203,255,0.48)' : 'none' }} />
            ))}
          </div>
          <div style={{ marginTop: 8, color: 'rgba(226,237,255,0.54)', fontSize: 9, lineHeight: 1.35 }}>Your turn's card access level</div>
        </section>
        {!atMax && (
          <button
            type="button"
            disabled={!!blocker}
            title={blocker ?? `Spend ${cost} Limitless Light Stacks and sacrifice 1 hand card to the Light-bound Abyss`}
            onClick={() => setPickerOpen(true)}
            style={{
              border: `1px solid ${blocker ? 'rgba(160,150,190,0.35)' : 'rgba(214,196,255,0.85)'}`,
              color: blocker ? 'rgba(220,210,240,0.5)' : '#ffffff',
              cursor: blocker ? 'not-allowed' : 'pointer',
              background: blocker ? 'rgba(30,24,44,0.7)' : 'linear-gradient(180deg, rgba(120,90,200,0.9), rgba(60,40,120,0.92))',
              width: '100%',
              padding: '7px 10px',
              borderRadius: 7,
              fontFamily: uiTypography.display,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 0.45,
              boxShadow: blocker ? 'none' : '0 3px 12px rgba(72,48,130,0.3)',
            }}
          >
            Raise Spectrum · {cost} stacks + 1 card
          </button>
        )}
      </div>

      {pickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sacrifice a card to the Light-bound Abyss"
          onClick={() => setPickerOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 12000, background: 'rgba(4,2,10,0.92)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', pointerEvents: 'auto', color: '#ece4ff', fontFamily: uiTypography.body }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: 'clamp(18px, 3vh, 32px) clamp(18px, 4vw, 56px)', background: 'radial-gradient(ellipse at 50% 0%, rgba(120,90,200,0.18), transparent 55%), linear-gradient(180deg, #120c22, #07050f)' }}
          >
            <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, paddingBottom: 16, borderBottom: '1px solid rgba(214,196,255,0.2)' }}>
              <div>
                <div style={{ color: 'rgba(214,196,255,0.65)', fontSize: 9, letterSpacing: 2.2, textTransform: 'uppercase' }}>Light-bound Abyss</div>
                <div style={{ marginTop: 4, fontFamily: uiTypography.display, fontSize: 22, letterSpacing: 1 }}>Raise Spectrum to Level {level + 1}</div>
                <div style={{ fontSize: 12, opacity: 0.78, marginTop: 6, lineHeight: 1.5 }}>
              Spend {cost} Limitless Light Stacks and choose 1 card from your hand to sacrifice to the Light-bound Abyss. Abyss cards cannot be retrieved until your deck resets.
                </div>
              </div>
              <button
                type="button"
                aria-label="Exit card selection"
                onClick={() => setPickerOpen(false)}
                style={{ flexShrink: 0, padding: '9px 18px', borderRadius: 8, border: '1px solid rgba(214,196,255,0.42)', background: 'rgba(255,255,255,0.06)', color: '#ece4ff', cursor: 'pointer', fontFamily: uiTypography.display, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' }}
              >Exit</button>
            </header>
            <div className="ornate-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '22px 2px 8px' }}>
              {deck.hand.length === 0 ? (
                <div style={{ padding: 36, textAlign: 'center', color: 'rgba(236,228,255,0.55)', fontSize: 13 }}>No cards in hand to sacrifice.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 14, alignItems: 'start' }}>
              {deck.hand.map(card => {
                const def = CardRegistry.get(card.definitionId);
                return (
                  <button
                    key={card.instanceId}
                    type="button"
                    aria-label={`Sacrifice ${def?.name ?? card.definitionId} to the Light-bound Abyss`}
                    onClick={() => {
                      if (raiseSpectrumLevel(card.instanceId)) setPickerOpen(false);
                    }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, padding: 7, borderRadius: 9, border: '1px solid rgba(214,196,255,0.3)', background: 'rgba(255,255,255,0.045)', color: '#ece4ff', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div
                      className={getLiveCardShimmerClassName(def, card.finish, 'front')}
                      style={{ width: '100%', aspectRatio: '148 / 204', position: 'relative', overflow: 'hidden', borderRadius: 6, backgroundColor: '#17131d', ...getLiveCardFaceBackgroundStyle(def, card.finish, 'front') }}
                    >
                      {def && (
                        <>
                          <div style={getCardNameRibbonStyle('grid')}>
                            <div style={{ color: cardFacePalette.textMuted, fontSize: faceMetrics.typeSize, textAlign: 'center', textTransform: 'uppercase' }}>{getDisplayCardTypeLabel(def.type)}</div>
                            <div style={{ color: cardFacePalette.text, fontSize: faceMetrics.nameSize, fontWeight: 700, textAlign: 'center', lineHeight: 1.15 }}>{def.name}</div>
                          </div>
                          <div style={getCardRulesPanelStyle('grid')}>
                            <div style={{ color: cardFacePalette.textSoft, fontSize: faceMetrics.descSize, lineHeight: faceMetrics.descLineHeight, textAlign: 'center', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden' }}>{getCardPreviewText(def, 2)}</div>
                          </div>
                        </>
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: 'rgba(236,228,255,0.74)', textAlign: 'center' }}>
                      {def ? `${getDisplayCardTypeLabel(def.type)} · Spectrum Level ${getCardSpectrumLevel(def)}` : card.definitionId}
                    </span>
                  </button>
                );
              })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
