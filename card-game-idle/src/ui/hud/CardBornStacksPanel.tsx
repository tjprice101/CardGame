import { useState } from 'react';
import { CardRegistry } from '@/cards/CardRegistry';
import { selectDeck, selectTurn, useStore } from '@/state/store';
import { uiTypography } from '@/ui/theme';

export default function CardBornStacksPanel() {
  const deck = useStore(selectDeck);
  const turn = useStore(selectTurn);
  const [showInfo, setShowInfo] = useState(false);

  const hasCausalityCard = [...deck.deckList.map(entry => entry.definitionId), ...deck.extraDeck.map(entry => entry.definitionId)]
    .some(definitionId => CardRegistry.get(definitionId)?.definitionId.includes('causality'));
  if (!hasCausalityCard) return null;

  return (
    <>
      <section style={{
        position: 'absolute', left: 14, top: 72, zIndex: 45, width: 154,
        padding: '10px 12px', borderRadius: 10,
        border: '1px solid rgba(255,210,92,0.34)',
        background: 'linear-gradient(145deg, rgba(12,12,16,0.88), rgba(72,18,28,0.72))',
        boxShadow: '0 8px 24px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.12)',
        color: '#fff7de', fontFamily: uiTypography.body,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <span style={{ fontFamily: uiTypography.display, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>Card-born Stacks</span>
          <button type="button" onClick={() => setShowInfo(true)} aria-label="Card-born Stacks information" style={{ width: 18, height: 18, borderRadius: '50%', border: '1px solid rgba(255,220,120,0.65)', background: 'rgba(255,220,120,0.12)', color: '#ffe08a', cursor: 'pointer', fontFamily: uiTypography.display, fontSize: 11 }}>i</button>
        </div>
        <div style={{ marginTop: 9, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,240,205,0.68)', textTransform: 'uppercase', letterSpacing: 1 }}>Cosmos</span>
          <strong style={{ fontFamily: uiTypography.display, fontSize: 19, color: '#ffe08a' }}>{turn.limitlessCosmosStacks ?? 0}</strong>
        </div>
        <div style={{ marginTop: 3, fontSize: 9, color: 'rgba(255,240,205,0.5)' }}>Resets at End Turn</div>
      </section>

      {showInfo && (
        <div role="dialog" aria-modal="true" onClick={() => setShowInfo(false)} style={{ position: 'absolute', inset: 0, zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.62)', padding: 20 }}>
          <div onClick={event => event.stopPropagation()} style={{ maxWidth: 420, padding: 22, borderRadius: 12, border: '1px solid rgba(255,220,120,0.55)', background: 'linear-gradient(145deg, #15151a, #3b111c)', color: '#fff7de', boxShadow: '0 16px 45px rgba(0,0,0,0.55)', fontFamily: uiTypography.body }}>
            <div style={{ fontFamily: uiTypography.display, fontSize: 16, letterSpacing: 1.8, color: '#ffe08a' }}>Card-born Stacks</div>
            <p style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,240,205,0.78)' }}>This panel contains counters created by cards from specialized sets. Causality cards can convert Limitless Light into Limitless Cosmos, grant Cosmos, or consume it for stronger effects. Cosmos resets when the turn ends.</p>
            <button type="button" onClick={() => setShowInfo(false)} style={{ marginTop: 8, padding: '8px 16px', borderRadius: 7, border: '1px solid rgba(255,220,120,0.55)', background: 'rgba(255,220,120,0.12)', color: '#ffe08a', cursor: 'pointer', fontFamily: uiTypography.display }}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
