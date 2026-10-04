import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CardRegistry } from '@/cards/CardRegistry';
import { selectDeck, selectTurn, useStore } from '@/state/store';
import { uiTypography } from '@/ui/theme';
import SpectrumControl from './SpectrumControl';

export default function CardBornStacksPanel() {
  const deck = useStore(selectDeck);
  const turn = useStore(selectTurn);
  const [showInfo, setShowInfo] = useState(false);

  const hasCausalityCard = [...deck.deckList.map(entry => entry.definitionId), ...deck.extraDeck.map(entry => entry.definitionId)]
    .some(definitionId => CardRegistry.get(definitionId)?.definitionId.includes('causality'));
  const hasIntensityCard = [...deck.deckList, ...deck.extraDeck].some(entry => entry.definitionId.includes('intensity'));
  if (turn.phase === 'idle') return null;
  return (
    <>
      <section style={{
        width: 220, boxSizing: 'border-box', pointerEvents: 'auto',
        padding: '10px 12px', borderRadius: 10,
        border: '1px solid rgba(155,194,255,0.3)',
        background: 'linear-gradient(155deg, rgba(10,14,23,0.95), rgba(25,12,27,0.91))',
        boxShadow: '0 8px 24px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.1)',
        color: '#f1f4ff', fontFamily: uiTypography.body,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <span style={{ fontFamily: uiTypography.display, fontSize: 9, letterSpacing: 1.8, textTransform: 'uppercase', color: 'rgba(224,235,255,0.72)' }}>Turn Resources</span>
          <button type="button" onClick={() => setShowInfo(true)} aria-label="Turn resources information" style={{ width: 18, height: 18, borderRadius: '50%', border: '1px solid rgba(180,205,255,0.55)', background: 'rgba(180,205,255,0.1)', color: '#dce9ff', cursor: 'pointer', fontFamily: uiTypography.display, fontSize: 11 }}>i</button>
        </div>
        <div style={{ marginTop: 9 }}>
          <SpectrumControl />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: hasCausalityCard ? '1fr 1fr' : '1fr', gap: 6, marginTop: 8 }}>
          <div style={resourceStyle}>
            <span style={resourceLabelStyle}>Limitless Light Stacks</span>
            <strong style={{ ...resourceValueStyle, color: '#b9ffbf' }}>{turn.limitlessLightStacks.toLocaleString()}</strong>
          </div>
          {hasCausalityCard && (
            <div style={resourceStyle}>
              <span style={resourceLabelStyle}>Limitless Cosmos</span>
              <strong style={{ ...resourceValueStyle, color: '#ffe08a' }}>{(turn.limitlessCosmosStacks ?? 0).toLocaleString()}</strong>
            </div>
          )}
          {hasIntensityCard && (
            <div style={{ ...resourceStyle, marginTop: 6 }}>
              <span style={resourceLabelStyle}>Limitless Inferno Stacks</span>
              <strong style={{ ...resourceValueStyle, color: '#ffd078' }}>{(turn.limitlessInfernoStacks ?? 0).toLocaleString()}</strong>
              <span style={resourceLabelStyle}>Resets each turn. Level 3+ Intensity Light Soph attacks and Intensity abilities use Inferno.</span>
            </div>
          )}
        </div>
        {hasCausalityCard && (
          <div style={{ marginTop: 5, fontSize: 8, color: 'rgba(255,240,205,0.48)', textAlign: 'right' }}>
            Cosmos resets at End Turn
          </div>
        )}
      </section>

      {showInfo && createPortal(
        <div role="dialog" aria-modal="true" aria-label="Turn resources information" onClick={() => setShowInfo(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(5px)', padding: 20 }}>
          <div onClick={event => event.stopPropagation()} style={{ maxWidth: 420, padding: 22, borderRadius: 12, border: '1px solid rgba(255,220,120,0.55)', background: 'linear-gradient(145deg, #15151a, #3b111c)', color: '#fff7de', boxShadow: '0 16px 45px rgba(0,0,0,0.55)', fontFamily: uiTypography.body }}>
            <div style={{ fontFamily: uiTypography.display, fontSize: 16, letterSpacing: 1.8, color: '#e4edff' }}>Turn Resources</div>
            <p style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,240,205,0.78)' }}>Spectrum Level controls which cards you can play or summon. Limitless Light Stacks are shared across cards and can be spent to raise your Spectrum Level. Limitless Cosmos appears with Causality cards. Intensity builds uncapped Limitless Inferno over a turn through embers, ash cycling, charge and rekindling. Level 3+ Intensity Light Soph attacks use Inferno instead of Light; its abilities can reshape or consume it. Inferno and its prepared bonuses reset each turn.</p>
            <button type="button" onClick={() => setShowInfo(false)} style={{ marginTop: 8, padding: '8px 16px', borderRadius: 7, border: '1px solid rgba(180,205,255,0.55)', background: 'rgba(180,205,255,0.1)', color: '#e4edff', cursor: 'pointer', fontFamily: uiTypography.display }}>Close</button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

const resourceStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  minWidth: 0,
  padding: '6px 7px',
  borderRadius: 6,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(225,235,255,0.1)',
};

const resourceLabelStyle: React.CSSProperties = {
  color: 'rgba(224,235,255,0.52)',
  fontSize: 7,
  lineHeight: 1.2,
  letterSpacing: 0.55,
  textTransform: 'uppercase',
};

const resourceValueStyle: React.CSSProperties = {
  fontFamily: uiTypography.display,
  fontSize: 16,
  lineHeight: 1.1,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
};
