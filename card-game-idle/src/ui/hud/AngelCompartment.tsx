import { useEffect, useMemo, useState } from 'react';
import { useStore, selectBoard, selectTurn, selectExtraDeck } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { CardEffectExecutor } from '@/systems/cards/CardEffectExecutor';
import {
  cardFacePalette,
  getCardFaceBackgroundStyle,
  getCardFaceMetrics,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';
import { warmTheme } from '@/ui/theme';
import type { AngelDefinition, CardFinish } from '@/types/cards';

const faceMetrics = getCardFaceMetrics('hand');
const ANGEL_DRAWER_WIDTH = 'min(340px, calc(100vw - 52px))';
const ANGEL_ART_HEIGHT = 120;
const HAND_RESERVED_WHEN_CLOSED = '34px';
const HAND_RESERVED_WHEN_OPEN = 'min(374px, calc(100vw - 18px))';

export default function AngelCompartment() {
  const [open, setOpen] = useState(false);
  const board = useStore(selectBoard);
  const turn = useStore(selectTurn);
  const extraDeck = useStore(selectExtraDeck);
  const { summonAngel } = useStore.getState();

  const isPlaying = turn.phase === 'playing';
  const angelsOnBoard = board.frontSlots.filter(s => s?.type === 'Angel').length;
  const angelEntries = useMemo(() => {
    const counts = new Map<string, { definitionId: string; finish: CardFinish; totalCopies: number }>();
    for (const entry of extraDeck) {
      const key = `${entry.definitionId}::${entry.finish}`;
      const existing = counts.get(key);
      if (existing) {
        existing.totalCopies += 1;
      } else {
        counts.set(key, { definitionId: entry.definitionId, finish: entry.finish, totalCopies: 1 });
      }
    }
    return Array.from(counts.values());
  }, [extraDeck]);

  useEffect(() => {
    const offset = open ? HAND_RESERVED_WHEN_OPEN : HAND_RESERVED_WHEN_CLOSED;
    document.documentElement.style.setProperty('--angel-drawer-hand-offset', offset);
    return () => {
      document.documentElement.style.setProperty('--angel-drawer-hand-offset', HAND_RESERVED_WHEN_CLOSED);
    };
  }, [open]);

  return (
    <div style={{
      position: 'absolute',
      right: 0,
      top: 'clamp(340px, 46vh, 420px)',
      transform: 'none',
      display: 'flex',
      alignItems: 'stretch',
      zIndex: 12,
      pointerEvents: 'auto',
    }}>
      {/* Slide-in panel */}
      <div style={{
        width: open ? ANGEL_DRAWER_WIDTH : 0,
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
        <div className="ornate-scroll" style={{
          width: '100%',
          padding: '18px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          maxHeight: 'clamp(220px, 38vh, 340px)',
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

          {angelEntries.map(({ definitionId, finish, totalCopies }) => {
            const def = CardRegistry.get(definitionId);
            if (!def || def.type !== 'Angel') return null;
            const angelDef = def as AngelDefinition;
            const artStyle = getCardFaceBackgroundStyle(angelDef, finish);

            const onBoardCopies = board.frontSlots.filter(
              sl => sl?.type === 'Angel' && sl.definitionId === definitionId && sl.finish === finish
            ).length;
            const availableCopies = totalCopies - onBoardCopies;
            const playable = availableCopies > 0 && isPlaying &&
              CardEffectExecutor.checkPlayable(angelDef, 0, turn, board);

            const boardMaterialCount: Record<string, number> = {};
            for (const slot of board.frontSlots) {
              if (slot) {
                boardMaterialCount[slot.definitionId] = (boardMaterialCount[slot.definitionId] ?? 0) + 1;
              }
            }
            const costProgress: Record<string, number> = {};
            for (const id of angelDef.summonCost) {
              costProgress[id] = (costProgress[id] ?? 0) + 1;
            }
            const statusLabel = availableCopies === 0
              ? `${onBoardCopies}/${totalCopies} summoned`
              : onBoardCopies > 0
                ? `${availableCopies}/${totalCopies} ready`
                : `${availableCopies} ready`;
            const statusColor = availableCopies === 0 ? warmTheme.success : warmTheme.textMuted;

            return (
              <div
                key={`${definitionId}::${finish}`}
                style={{
                  border: playable
                    ? `1px solid ${warmTheme.borderStrong}`
                    : availableCopies === 0
                      ? `1px solid rgba(79,138,71,0.35)`
                      : `1px solid ${warmTheme.border}`,
                  background: 'linear-gradient(180deg, rgba(255,250,245,0.98) 0%, rgba(246,237,226,0.98) 100%)',
                  borderRadius: 16,
                  padding: 0,
                  fontFamily: 'Georgia, serif',
                  cursor: playable ? 'pointer' : 'default',
                  transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                  boxShadow: playable ? `${warmTheme.glow}, ${cardFacePalette.shadow}` : cardFacePalette.shadow,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 320,
                }}
                onClick={() => {
                  if (playable) {
                    summonAngel(definitionId, finish);
                    setOpen(false);
                  }
                }}
              >
                <div style={getCardNameRibbonStyle('hand')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <div style={{ fontSize: faceMetrics.typeSize, color: cardFacePalette.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                      Angel · {finish === 'holo' ? 'Holofoil' : 'Normal'}
                    </div>
                    <div style={{
                      fontSize: 9,
                      letterSpacing: 1,
                      color: statusColor,
                      textTransform: 'uppercase',
                    }}>
                      {statusLabel}
                    </div>
                  </div>
                  <div style={{ fontSize: faceMetrics.nameSize, fontWeight: 'bold', color: cardFacePalette.text, lineHeight: 1.25, marginTop: 3 }}>
                    {angelDef.name}
                  </div>
                </div>

                <div style={{
                  ...artStyle,
                  position: 'relative',
                  minHeight: ANGEL_ART_HEIGHT,
                  backgroundRepeat: 'no-repeat',
                  borderTop: `1px solid ${cardFacePalette.border}`,
                  borderBottom: `1px solid ${cardFacePalette.border}`,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 35%, rgba(53,34,19,0.12) 78%, rgba(53,34,19,0.26) 100%)',
                  }} />
                  <div style={{
                    position: 'absolute',
                    left: 10,
                    right: 10,
                    bottom: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <div style={{
                      fontSize: 9,
                      letterSpacing: 1,
                      color: '#fff8f0',
                      textTransform: 'uppercase',
                      padding: '4px 7px',
                      borderRadius: 999,
                      background: 'rgba(32, 21, 13, 0.45)',
                      backdropFilter: 'blur(3px)',
                    }}>
                      {angelDef.rarity}
                    </div>
                    <div style={{
                      fontSize: 9,
                      letterSpacing: 1,
                      color: '#fff8f0',
                      textTransform: 'uppercase',
                      padding: '4px 7px',
                      borderRadius: 999,
                      background: 'rgba(32, 21, 13, 0.45)',
                      backdropFilter: 'blur(3px)',
                    }}>
                      Awaken {angelDef.activatedAbility.cardsPlayedRequirement}
                    </div>
                  </div>
                </div>

                <div style={getCardRulesPanelStyle('hand')}>
                  <div style={{
                    fontSize: faceMetrics.descSize,
                    color: cardFacePalette.textSoft,
                    lineHeight: faceMetrics.descLineHeight,
                    display: '-webkit-box',
                    WebkitLineClamp: 5,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {angelDef.description}
                  </div>

                  <div style={{ fontSize: 10, color: warmTheme.accentDeep, marginTop: 12, marginBottom: 4, letterSpacing: 0.5 }}>
                    AWAKEN {angelDef.activatedAbility.cardsPlayedRequirement}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: cardFacePalette.textSoft,
                    lineHeight: 1.45,
                    marginBottom: 10,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {angelDef.activatedAbility.name}: {angelDef.activatedAbility.description}
                  </div>

                  {availableCopies > 0 && (
                    <>
                      <div style={{ fontSize: 9, color: cardFacePalette.textMuted, marginBottom: 6, letterSpacing: 0.5 }}>
                        SUMMON MATERIALS
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {Object.entries(costProgress).map(([costId, needed]) => {
                          const costDef = CardRegistry.get(costId);
                          const have = boardMaterialCount[costId] ?? 0;
                          const met = have >= needed;
                          return (
                            <div key={costId} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 11, color: met ? warmTheme.success : 'rgba(255,80,80,0.8)' }}>
                                {met ? '✓' : '✕'}
                              </span>
                              <span style={{ fontSize: 10, color: cardFacePalette.textSoft }}>
                                {needed > 1 ? `${needed}× ` : ''}{costDef?.name ?? costId}
                              </span>
                              <span style={{ fontSize: 9, color: cardFacePalette.textMuted, marginLeft: 'auto' }}>
                                {have}/{needed}
                              </span>
                            </div>
                          );
                        })}
                        {angelDef.extraSummonConditions?.map((condition, index) => {
                          if (condition.type === 'chaos_active_gte') {
                            const activeChaos = board.backSlots.filter(slot => slot !== null).length;
                            const met = activeChaos >= condition.value;
                            return (
                              <div key={`${definitionId}-cond-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 11, color: met ? warmTheme.success : 'rgba(255,80,80,0.8)' }}>
                                  {met ? '✓' : '✕'}
                                </span>
                                <span style={{ fontSize: 10, color: cardFacePalette.textSoft }}>
                                  Active Chaos cards
                                </span>
                                <span style={{ fontSize: 9, color: cardFacePalette.textMuted, marginLeft: 'auto' }}>
                                  {activeChaos}/{condition.value}
                                </span>
                              </div>
                            );
                          }
                          if (condition.type === 'seraphim_on_board_gte') {
                            const activeSeraphim = board.frontSlots.filter(slot => slot?.type === 'Seraphim').length;
                            const met = activeSeraphim >= condition.value;
                            return (
                              <div key={`${definitionId}-cond-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 11, color: met ? warmTheme.success : 'rgba(255,80,80,0.8)' }}>
                                  {met ? '✓' : '✕'}
                                </span>
                                <span style={{ fontSize: 10, color: cardFacePalette.textSoft }}>
                                  Front-row Seraphim
                                </span>
                                <span style={{ fontSize: 9, color: cardFacePalette.textMuted, marginLeft: 'auto' }}>
                                  {activeSeraphim}/{condition.value}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </>
                  )}

                  {playable && (
                    <div style={{
                      marginTop: 10,
                      textAlign: 'center',
                      fontSize: 10,
                      color: warmTheme.accentDeep,
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                      opacity: 0.8,
                    }}>
                      Click to Summon
                    </div>
                  )}
                </div>
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
