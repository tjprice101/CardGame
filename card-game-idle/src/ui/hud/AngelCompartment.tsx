import { useEffect, useMemo, useState } from 'react';
import CardHoverDetail from '@/ui/hud/CardHoverDetail';
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
import CardRulesDigest from '@/ui/components/CardRulesDigest';
import { warmTheme } from '@/ui/theme';
import type { AngelDefinition, CardFinish } from '@/types/cards';

const faceMetrics = getCardFaceMetrics('grid');
const ANGEL_DRAWER_WIDTH = 'min(340px, calc(100vw - 52px))';
const ANGEL_ART_HEIGHT = 120;
const HAND_RESERVED_WHEN_CLOSED = '308px';
const HAND_RESERVED_WHEN_OPEN = 'min(374px, calc(100vw - 18px))';

export default function AngelCompartment() {
  const [open, setOpen] = useState(false);
  const [shakeKey, setShakeKey] = useState<string | null>(null);
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

  if (!isPlaying) return null;

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
        background: 'rgba(5,5,7,0.92)',
        borderLeft: open ? '1px solid rgba(200,160,255,0.28)' : 'none',
        borderTop: open ? '1px solid rgba(200,160,255,0.2)' : 'none',
        borderBottom: open ? '1px solid rgba(200,160,255,0.2)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: open ? '-8px 0 40px rgba(0,0,0,0.8), inset 1px 0 0 rgba(200,160,255,0.08)' : 'none',
        backdropFilter: 'blur(12px)',
      }}>
        <div className="ornate-scroll" style={{
          width: '100%',
          padding: '18px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          maxHeight: 'clamp(220px, 44vh, 420px)',
          overflowY: 'auto',
        }}>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: 10,
            letterSpacing: 3,
            color: 'rgba(200,160,255,0.7)',
            textTransform: 'uppercase',
            marginBottom: 2,
          }}>
            Extra Deck — {angelsOnBoard} / {extraDeck.length} on board
          </div>

          {extraDeck.length === 0 && (
            <div style={{
              fontFamily: 'Georgia, serif',
              fontSize: 11,
              color: 'rgba(244,244,248,0.35)',
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
              : playable
                ? 'Summon Ready'
                : 'Materials not met';
            const statusColor = availableCopies === 0
              ? '#83f7b6'
              : playable
                ? '#83f7b6'
                : 'rgba(255,100,100,0.75)';

            const doSummon = () => {
              summonAngel(definitionId, finish);
              setOpen(false);
              window.dispatchEvent(new Event('hud-shake-soft'));
            };
            const handleEntryClick = () => {
              if (playable) {
                doSummon();
              } else {
                const k = `${definitionId}::${finish}`;
                setShakeKey(k);
                setTimeout(() => setShakeKey(sk => sk === k ? null : sk), 400);
              }
            };

            const entryKey = `${definitionId}::${finish}`;
            const isShaking = shakeKey === entryKey;
            return (
              <CardHoverDetail
                key={entryKey}
                definitionId={definitionId}
                finish={finish}
                actionLabel={playable ? 'Summon Angel' : undefined}
                onAction={playable ? doSummon : undefined}
                actionDisabled={!playable}
              >
              <div
                className={isShaking ? 'anim-shake-no' : undefined}
                style={{
                  border: playable
                    ? '1px solid rgba(200,160,255,0.7)'
                    : availableCopies === 0
                      ? '1px solid rgba(100,220,150,0.25)'
                      : '1px solid rgba(244,244,248,0.1)',
                  background: 'linear-gradient(180deg, rgba(22,14,38,0.97) 0%, rgba(8,5,12,0.97) 100%)',
                  borderRadius: 16,
                  padding: 0,
                  fontFamily: 'Georgia, serif',
                  cursor: playable ? 'pointer' : 'default',
                  transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                  boxShadow: playable
                    ? '0 0 28px rgba(180,140,255,0.28), 0 4px 16px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)'
                    : '0 2px 8px rgba(0,0,0,0.6)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 320,
                  opacity: availableCopies === 0 ? 0.65 : 1,
                }}
                onClick={handleEntryClick}
              >
                  <div style={getCardNameRibbonStyle('grid')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <div style={{ fontSize: faceMetrics.typeSize, color: 'rgba(200,160,255,0.7)', letterSpacing: 2, textTransform: 'uppercase' }}>
                      Angel · {finish === 'holo' ? 'Holofoil' : 'Normal'}
                    </div>
                    <div style={{
                      fontSize: 9,
                      letterSpacing: 1.2,
                      color: statusColor,
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      padding: '3px 6px',
                      borderRadius: 999,
                      background: playable ? 'rgba(100,220,150,0.12)' : availableCopies === 0 ? 'rgba(100,220,150,0.08)' : 'rgba(255,80,80,0.08)',
                      boxShadow: playable ? '0 0 10px rgba(100,220,150,0.22)' : 'none',
                    }}>
                      {statusLabel}
                    </div>
                  </div>
                  <div style={{ fontSize: faceMetrics.nameSize, fontWeight: 'bold', color: 'rgba(244,244,248,0.95)', lineHeight: 1.25, marginTop: 3 }}>
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

                <div style={getCardRulesPanelStyle('grid')}>
                  <div style={{ marginBottom: 10 }}>
                    <CardRulesDigest
                      card={angelDef}
                      variant="preview"
                      maxSections={3}
                      maxLinesPerSection={10}
                      lineClamp={3}
                      labelColor={cardFacePalette.textMuted}
                      textColor={cardFacePalette.textSoft}
                      sectionBackground="transparent"
                      sectionBorder="transparent"
                    />
                  </div>

                  <div style={{ fontSize: 9, color: cardFacePalette.textMuted, marginBottom: 4, letterSpacing: 0.5 }}>
                    ATTACKS
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: cardFacePalette.textSoft,
                    lineHeight: 1.45,
                    marginBottom: 10,
                  }}>
                    Primary and Exalted attacks are available on-board with cards-play cooldowns. Exalted attacks can require additional costs.
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
                                {met ? '[OK]' : '[X]'}
                              </span>
                              <span style={{ fontSize: 10, color: cardFacePalette.textSoft }}>
                                {needed > 1 ? `${needed}x ` : ''}{costDef?.name ?? costId}
                              </span>
                              <span style={{ fontSize: 9, color: cardFacePalette.textMuted, marginLeft: 'auto' }}>
                                {have}/{needed}
                              </span>
                            </div>
                          );
                        })}
                        {angelDef.extraSummonConditions?.map((condition, index) => {
                          if (condition.type === 'cherubim_active_gte') {
                            const activeCherubim = board.backSlots.filter(slot => slot !== null).length;
                            const met = activeCherubim >= condition.value;
                            return (
                              <div key={`${definitionId}-cond-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 11, color: met ? warmTheme.success : 'rgba(255,80,80,0.8)' }}>
                                  {met ? '[OK]' : '[X]'}
                                </span>
                                <span style={{ fontSize: 10, color: cardFacePalette.textSoft }}>
                                  Active Cherubim cards
                                </span>
                                <span style={{ fontSize: 9, color: cardFacePalette.textMuted, marginLeft: 'auto' }}>
                                  {activeCherubim}/{condition.value}
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
                                  {met ? '[OK]' : '[X]'}
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
                    <button
                      onClick={(e) => { e.stopPropagation(); doSummon(); }}
                      style={{
                        margin: '12px 14px',
                        padding: '10px 16px',
                        borderRadius: 10,
                        background: 'linear-gradient(180deg, rgba(60,40,100,0.98) 0%, rgba(20,12,36,0.98) 100%)',
                        border: '1px solid rgba(200,160,255,0.7)',
                        color: 'rgba(244,244,248,0.98)',
                        fontSize: 12,
                        fontFamily: 'Georgia, serif',
                        cursor: 'pointer',
                        letterSpacing: 2.5,
                        textTransform: 'uppercase',
                        boxShadow: '0 0 22px rgba(180,140,255,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                        width: 'calc(100% - 28px)',
                      }}
                    >
                      Summon Angel
                    </button>
                  )}
                  {!playable && availableCopies > 0 && (
                    <div style={{
                      margin: '10px 14px',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(255,80,80,0.06)',
                      border: '1px solid rgba(255,80,80,0.2)',
                      textAlign: 'center',
                      fontSize: 9,
                      color: 'rgba(255,100,100,0.8)',
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                    }}>
                      Materials not met
                    </div>
                  )}
                </div>
              </div>
              </CardHoverDetail>
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
          background: 'rgba(18,10,32,0.92)',
          border: '1px solid rgba(200,160,255,0.3)',
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
          backdropFilter: 'blur(8px)',
          boxShadow: '-4px 0 16px rgba(180,140,255,0.1)',
        }}
      >
        <span style={{ fontSize: 12, color: 'rgba(200,160,255,0.9)', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: 2 }}>
          ANGELS
        </span>
        {extraDeck.length > 0 && (
          <span style={{
            fontSize: 9,
            color: angelsOnBoard > 0 ? '#83f7b6' : 'rgba(200,160,255,0.8)',
            background: angelsOnBoard > 0 ? 'rgba(100,220,150,0.1)' : 'rgba(200,160,255,0.08)',
            borderRadius: 4,
            padding: '1px 4px',
            minWidth: 14,
            textAlign: 'center',
          }}>
            {angelsOnBoard}/{extraDeck.length}
          </span>
        )}
        <span style={{ fontSize: 10, color: 'rgba(200,160,255,0.6)' }}>
          {open ? '›' : '‹'}
        </span>
      </button>
    </div>
  );
}
