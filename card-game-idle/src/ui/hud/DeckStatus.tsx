import { useEffect, useMemo, useState } from 'react';
import { useStore, selectDeck, selectTurn } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { uiTypography, warmTheme } from '@/ui/theme';
import { useThemeVersion } from '@/ui/useThemeVersion';
import { getCardNameRibbonStyle, getCardRulesPanelStyle, getLiveCardFaceBackgroundStyle, getLiveCardShimmerClassName } from '@/ui/cardBackgrounds';
import { getCardPreviewText } from '@/ui/cardStatSummary';
import { getDisplayCardTypeLabel } from '@/ui/preferences';

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    pointerEvents: 'auto',
    fontFamily: 'Georgia, serif',
    alignItems: 'flex-end',
    width: '100%',
    zIndex: 1,
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: 'rgba(5,5,7,0.65)',
    border: '1px solid rgba(244,244,248,0.18)',
    borderRadius: 999,
    padding: '4px 10px',
    boxShadow: '0 0 14px rgba(244,244,248,0.04), inset 0 1px 0 rgba(244,244,248,0.05)',
    fontFamily: 'Georgia, serif',
    color: 'rgba(244,244,248,0.88)',
    appearance: 'none',
    WebkitAppearance: 'none',
  },
  icon: { fontSize: 12 },
  count: { fontSize: 14, fontWeight: 'bold', color: 'rgba(244,244,248,0.95)' },
  label: { fontSize: 10, color: 'rgba(244,244,248,0.55)', letterSpacing: 1.3, textTransform: 'uppercase' },
  hint: { fontSize: 8, color: 'rgba(244,244,248,0.3)', letterSpacing: 0.7 },
};

type PileType = 'deck' | 'discard' | 'abyss' | 'hand' | 'extra';

export default function DeckStatus() {
  useThemeVersion();
  const deck = useStore(selectDeck);
  const turn = useStore(selectTurn);
  const [openPile, setOpenPile] = useState<PileType | null>(null);
  const canInspectDeck = turn.phase === 'idle';

  useEffect(() => {
    if (!openPile) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenPile(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [openPile]);

  const pileEntries = useMemo(() => {
    if (!openPile) return [];
    const source = openPile === 'deck'
      ? deck.drawPile
      : openPile === 'discard'
        ? deck.discardPile
        : openPile === 'abyss'
          ? (deck.lightBoundAbyss ?? [])
        : openPile === 'hand'
          ? deck.hand
          : deck.extraDeck;
    return source.map((c, idx) => {
      const def = CardRegistry.get(c.definitionId);
      const key = 'instanceId' in c && typeof (c as { instanceId: string }).instanceId === 'string'
        ? `${(c as { instanceId: string }).instanceId}-${idx}`
        : `${c.definitionId}-${idx}`;
      return {
        key,
        definitionId: c.definitionId,
        name: def?.name ?? c.definitionId,
        type: def?.type ?? 'Card',
        finish: c.finish,
        def,
      };
    });
  }, [openPile, deck.drawPile, deck.discardPile, deck.lightBoundAbyss, deck.hand, deck.extraDeck]);

  return (
    <div style={styles.container}>
      <button
        style={{
          ...styles.pill,
          cursor: canInspectDeck ? 'pointer' : 'not-allowed',
          opacity: canInspectDeck ? 1 : 0.82,
        }}
        onClick={canInspectDeck ? () => setOpenPile('deck') : undefined}
      >
        <span style={styles.icon}>🃏</span>
        <span style={styles.count}>{deck.drawPile.length}</span>
        <span style={styles.label}>Deck</span>
        <span style={styles.hint}>{canInspectDeck ? 'click' : 'hidden in-run'}</span>
      </button>
      <button style={{ ...styles.pill, cursor: 'pointer' }} onClick={() => setOpenPile('discard')}>
        <span style={styles.icon}>♻</span>
        <span style={styles.count}>{deck.discardPile.length}</span>
        <span style={styles.label}>Discard</span>
        <span style={styles.hint}>click</span>
      </button>
      {turn.phase !== 'idle' && (
        <button
          style={{ ...styles.pill, cursor: 'pointer', border: '1px solid rgba(214,196,255,0.4)' }}
          onClick={() => setOpenPile('abyss')}
          title="Light-bound Abyss: cards sacrificed to raise Spectrum Level. They return only when your deck resets."
        >
          <span style={{ ...styles.icon, color: '#d6c4ff' }}>◉</span>
          <span style={{ ...styles.count, color: '#d6c4ff' }}>{deck.lightBoundAbyss?.length ?? 0}</span>
          <span style={{ ...styles.label, color: 'rgba(214,196,255,0.8)' }}>Abyss</span>
          <span style={{ ...styles.hint, color: 'rgba(214,196,255,0.55)' }}>click</span>
        </button>
      )}
      {turn.phase !== 'idle' && (
        <>
          <button style={{ ...styles.pill, cursor: 'pointer' }} onClick={() => setOpenPile('hand')}>
            <span style={styles.icon}>✋</span>
            <span style={styles.count}>{deck.hand.length}</span>
            <span style={styles.label}>Hand</span>
            <span style={styles.hint}>click</span>
          </button>
          <button
            style={{ ...styles.pill, cursor: 'pointer', border: '1px solid rgba(180,160,255,0.35)' }}
            onClick={() => {
              window.dispatchEvent(new CustomEvent('hr-toggle-extra-deck'));
            }}
            title="Toggle Extra Deck view in hand strip (Hotkey: E)"
          >
            <span style={{ ...styles.icon, color: '#cfc8ff' }}>✦</span>
            <span style={{ ...styles.count, color: '#cfc8ff' }}>{deck.extraDeck.length}</span>
            <span style={{ ...styles.label, color: 'rgba(207,200,255,0.75)' }}>Extra</span>
            <span style={{ ...styles.hint, color: 'rgba(207,200,255,0.5)' }}>[E] view</span>
          </button>
        </>
      )}

      {openPile && (openPile !== 'deck' || canInspectDeck) && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${openPile === 'abyss' ? 'Light-bound Abyss' : openPile} card viewer`}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 12000,
            background: 'rgba(5,5,10,0.94)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            color: warmTheme.text,
            fontFamily: 'Georgia, serif',
            padding: 'clamp(16px, 3vh, 32px) clamp(18px, 4vw, 56px)',
          }}
        >
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, paddingBottom: 16, borderBottom: `1px solid ${warmTheme.border}` }}>
            <div>
              <div style={{ color: warmTheme.textMuted, fontSize: 9, letterSpacing: 2.2, textTransform: 'uppercase' }}>Card Zones</div>
              <div style={{ marginTop: 4, fontFamily: uiTypography.display, fontSize: 23, color: warmTheme.text, textTransform: 'capitalize' }}>
                {openPile === 'abyss' ? 'Light-bound Abyss' : openPile} <span style={{ color: warmTheme.textMuted, fontSize: 14 }}>· {pileEntries.length}</span>
              </div>
              {(openPile === 'discard' || openPile === 'abyss') && (
                <div style={{ marginTop: 5, color: warmTheme.textMuted, fontSize: 11, lineHeight: 1.4 }}>
                  {openPile === 'discard' ? 'Cards discarded this turn.' : 'Cards sacrificed to raise Spectrum Level. They return when your deck zones reset.'}
                </div>
              )}
            </div>
            <button
              type="button"
              aria-label="Exit card pile viewer"
              onClick={() => setOpenPile(null)}
              style={{
                border: `1px solid ${warmTheme.borderStrong}`,
                background: warmTheme.surfaceStrong,
                color: warmTheme.text,
                borderRadius: 8,
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: uiTypography.display,
                padding: '8px 18px',
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                flexShrink: 0,
              }}
            >
              Exit
            </button>
          </header>
          {pileEntries.length === 0 && (
            <div style={{ flex: 1, display: 'grid', placeItems: 'center', fontSize: 14, color: warmTheme.textMuted }}>
              This pile is empty.
            </div>
          )}
          {pileEntries.length > 0 && (
            <div
              className="ornate-scroll"
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                padding: '20px 2px 8px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
                alignContent: 'start',
                gap: 14,
              }}
            >
              {pileEntries.map((entry) => (
                <div key={entry.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div
                    className={getLiveCardShimmerClassName(entry.def, entry.finish)}
                    style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: 190,
                      aspectRatio: '148 / 204',
                      borderRadius: 8,
                      border: `1px solid ${warmTheme.border}`,
                      overflow: 'hidden',
                      background: warmTheme.surface,
                      ...getLiveCardFaceBackgroundStyle(entry.def ?? null, entry.finish),
                    }}
                    title={`${entry.name} (${getDisplayCardTypeLabel(entry.type)})`}
                  >
                    <div style={getCardNameRibbonStyle('grid')}>
                      <div style={{ fontSize: 8, color: 'rgba(244,244,248,0.72)', textTransform: 'uppercase', textAlign: 'center', letterSpacing: 0.7 }}>
                        {getDisplayCardTypeLabel(entry.type)}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(244,244,248,0.96)', textAlign: 'center', lineHeight: 1.15, marginTop: 2 }}>
                        {entry.name}
                      </div>
                    </div>
                    <div style={getCardRulesPanelStyle('grid')}>
                      <div style={{ fontSize: 8, color: 'rgba(244,244,248,0.86)', lineHeight: 1.25, textAlign: 'center', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 4, overflow: 'hidden' }}>
                        {entry.def ? getCardPreviewText(entry.def, 3) : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: warmTheme.text, lineHeight: 1.2 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
                    <div style={{ color: warmTheme.textMuted, fontSize: 9 }}>
                        {getDisplayCardTypeLabel(entry.type)} · {entry.finish}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
