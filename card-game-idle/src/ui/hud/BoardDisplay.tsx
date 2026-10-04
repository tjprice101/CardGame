import { useState, useEffect, useRef } from 'react';
import { getCardBackgroundUrl } from '@/ui/cardBackgrounds';
import { useStore, selectBoard, selectBossFight, selectDeck, selectGardenDungeon, selectCanEmbraceInfinite, selectProgress, selectTurn } from '@/state/store';
import { useThemeVersion } from '@/ui/useThemeVersion';
import { CardRegistry } from '@/cards/CardRegistry';
import { getSophAttackPool, usesInferno } from '@/systems/cards/IntensityRuntime';
import GameEmblem from '@/ui/components/GameEmblem';
import {
  cardFacePalette,
  getAdaptiveDescriptionMetrics,
  getCardFaceMetrics,
  getLiveCardFaceBackgroundStyle,
  getLiveCardShimmerClassName,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';
import { getDisplayCardTypeLabel } from '@/ui/preferences';
import { getCardPreviewText } from '@/ui/cardStatSummary';
import { uiTypography, warmTheme } from '@/ui/theme';
import { SET_ACCENT } from '@/data/elements';
import { resolveCardScaling } from '@/systems/cards/CardScaling';
import { SOPH_FLIP_CHARGE_REQUIRED } from '@/systems/cards/AinSophRuntime';
import { canActivateShatterTheInfiniteLight } from '@/systems/cards/ShatterTheInfiniteLight';
import { getUnmetCardRequirement } from '@/systems/cards/PlayRequirements';
import { formatSummonRequirement, getSummonRequirements, matchesSummonRequirement } from '@/systems/cards/AinSophSummonRequirements';
import { computeGlobalResonanceScore } from '@/systems/progression/cardMastery';
import type {
  LightCardDefinition,
  DarkCardDefinition,
  AinSophAurDefinition,
  StackCostDefinition,
  MainDeckBoardInstance,
} from '@/types/cards';

const SLOT_W = 'clamp(138px, 11vw, 190px)';
const SUPPORT_SLOT_W = 'clamp(122px, 9.4vw, 162px)';
const FRONT_ROW_GAP = 'clamp(8px, 1vw, 18px)';
const BACK_ROW_GAP = 'calc(clamp(8px, 1vw, 18px) + clamp(16px, 1.6vw, 28px))';
const ROW_SEPARATION = 'clamp(6px, 0.9vh, 12px)';
const FRONT_FACE_METRICS = getCardFaceMetrics('board');
const SUPPORT_FACE_METRICS = getCardFaceMetrics('boardMini');
const DISPLAY_FONT = uiTypography.display;
const BODY_FONT = uiTypography.body;

function renderSophChargeBadge(stacks: number) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 7,
      left: 7,
      zIndex: 8,
      padding: '2px 6px',
      borderRadius: 999,
      border: '1px solid rgba(166,198,255,0.38)',
      background: 'rgba(18, 16, 30, 0.82)',
      color: 'rgba(200,218,255,0.96)',
      fontSize: 9,
      lineHeight: 1,
      letterSpacing: 0.5,
      fontFamily: DISPLAY_FONT,
      fontWeight: 700,
      pointerEvents: 'none',
      boxShadow: '0 2px 8px rgba(0,0,0,0.28)',
    }}>
      {`Soph Charge ${stacks}`}
    </div>
  );
}

// Mirrors store.ts resolveStackCost so previews match the actual runtime spend.
function previewStackCost(cost: StackCostDefinition, stacks: number): number {
  if (cost.kind === 'percentage') return Math.ceil(stacks * ((cost.value ?? 0) / 100));
  if (cost.kind === 'range') return Math.max(0, cost.min ?? 0);
  return Math.max(0, cost.value ?? 0);
}

function actionBtnStyle(border: string, background: string, color: string, disabled?: boolean): React.CSSProperties {
  return {
    fontSize: 9,
    padding: '5px 12px',
    borderRadius: 6,
    border: `1px solid ${border}`,
    background,
    color,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    fontFamily: BODY_FONT,
    letterSpacing: 0.6,
    textAlign: 'center',
    whiteSpace: 'nowrap',
  };
}

export default function BoardDisplay({ onHoverCard }: { onHoverCard?: (definitionId: string) => void }) {
  useThemeVersion();
  const board = useStore(selectBoard);
  const bossFight     = useStore(selectBossFight);
  const gardenDungeon = useStore(selectGardenDungeon);
  const canEmbraceInfinite = useStore(selectCanEmbraceInfinite);
  const turn = useStore(selectTurn);
  const deck = useStore(selectDeck);
  const progress = useStore(selectProgress);
  const collectionPower = computeGlobalResonanceScore(progress);
  const {
    embraceInfinite,
    flipSoph,
    activateLightAinAttack,
    activateLightSophAttack,
    activateDark,
    activateAsaBridge,
    activateShatterTheInfiniteLight,
    summonAinSophAur,
    playCard,
    forceRemoveBoardCard,
  } = useStore.getState();

  const canPlay = turn.phase === 'playing';
  const canShatterTheInfiniteLight = canPlay && !turn.shatterInfiniteLight && canActivateShatterTheInfiniteLight(board);

  const prevSlotsRef = useRef(board.frontSlots);
  const [lastPlacedInstanceId, setLastPlacedInstanceId] = useState<string | null>(null);
  const [dragOverBack, setDragOverBack] = useState<number | null>(null);
  const [hoveredFrontSlot, setHoveredFrontSlot] = useState<number | null>(null);
  const [newActionSlot, setNewActionSlot] = useState<{ zone: 'front' | 'back'; index: 0 | 1 | 2 | 3 } | null>(null);
  const [removeActionSlot, setRemoveActionSlot] = useState<{ zone: 'front' | 'back'; index: 0 | 1 | 2 | 3 } | null>(null);
  const [asaSummonRequest, setAsaSummonRequest] = useState<{
    definitionId: string;
    required: number;
    requirements: import('@/types/cards').SummonRequirement[];
    freeSummon?: boolean;
  } | null>(null);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ definitionId: string; required: number; requirements?: import('@/types/cards').SummonRequirement[]; freeSummon?: boolean }>;
      if (!ce.detail) return;
      const definition = ce.detail.definitionId ? CardRegistry.get(ce.detail.definitionId) : null;
      if (ce.detail.definitionId && (!definition || definition.type !== 'AinSophAur')) return;
      setAsaSummonRequest({
        ...ce.detail,
        requirements: ce.detail.requirements ?? (definition?.type === 'AinSophAur' ? getSummonRequirements(definition.summonMaterials, definition.summonMaterialCount) : []),
        freeSummon: ce.detail.freeSummon,
      });
      setSelectedMaterialIds([]);
    };
    window.addEventListener('asa-summon-request', handler);
    return () => window.removeEventListener('asa-summon-request', handler);
  }, []);

  useEffect(() => {
    const prev = prevSlotsRef.current;
    const curr = board.frontSlots;
    for (let i = 0; i < 4; i++) {
      if (!prev[i] && curr[i]) {
        setLastPlacedInstanceId(curr[i]!.instanceId);
        const t = setTimeout(() => setLastPlacedInstanceId(null), 500);
        return () => clearTimeout(t);
      }
    }
    prevSlotsRef.current = curr;
  }, [board.frontSlots]);

  useEffect(() => {
    prevSlotsRef.current = board.frontSlots;
  });

  // Preload card art for all board slots whenever slots change, so holofoil
  // and card images don't stutter on first hover or zoom.
  useEffect(() => {
    const allSlots = [...board.frontSlots, ...board.backSlots];
    for (const slot of allSlots) {
      if (!slot) continue;
      const def = CardRegistry.get(slot.definitionId);
      if (!def) continue;
      const url = getCardBackgroundUrl(def);
      if (url) { const img = new Image(); img.src = url; }
    }
  }, [board.frontSlots, board.backSlots]);


  const getBoardFocusPalette = (element: string | undefined) => {
    if (element === 'Neutrality') {
      return {
        rim: 'rgba(166, 198, 255, 0.96)',
        glow: 'rgba(136, 173, 245, 0.48)',
        corner: 'rgba(218, 232, 255, 0.96)',
        sweep: 'linear-gradient(110deg, transparent 22%, rgba(178, 206, 255, 0.64) 48%, rgba(102, 146, 232, 0.5) 62%, transparent 86%)',
      };
    }

    return {
      rim: 'rgba(255, 178, 112, 0.96)',
      glow: 'rgba(242, 132, 78, 0.46)',
      corner: 'rgba(255, 228, 196, 0.96)',
      sweep: 'linear-gradient(110deg, transparent 22%, rgba(255, 230, 184, 0.66) 48%, rgba(242, 138, 92, 0.5) 62%, transparent 86%)',
    };
  };

  const renderBoardFocusOverlay = (radius: number, element: string | undefined) => {
    const palette = getBoardFocusPalette(element);
    const corners = [
      { top: 5, left: 5 },
      { top: 5, right: 5 },
      { bottom: 5, left: 5 },
      { bottom: 5, right: 5 },
    ];

    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        borderRadius: radius,
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: radius,
          boxShadow: `inset 0 0 0 1px ${palette.rim}, inset 0 0 0 3px ${palette.glow}`,
          animation: 'boardFocusPulse 0.9s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          top: '-22%',
          bottom: '-22%',
          width: '64%',
          left: '-70%',
          background: palette.sweep,
          filter: 'blur(0.2px)',
          transform: 'skewX(-18deg)',
          animation: 'boardFocusSweep 0.9s cubic-bezier(0.22, 0.61, 0.36, 1) infinite',
        }} />
        {corners.map((corner, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              width: 15,
              height: 15,
              borderTop: `2px solid ${palette.corner}`,
              borderLeft: `2px solid ${palette.corner}`,
              borderRadius: 2,
              opacity: 0.94,
              transform:
                corner.top !== undefined && corner.left !== undefined
                  ? 'none'
                  : corner.top !== undefined && corner.right !== undefined
                    ? 'scaleX(-1)'
                    : corner.bottom !== undefined && corner.left !== undefined
                      ? 'scaleY(-1)'
                      : 'scale(-1)',
              animation: 'boardFocusPulse 0.9s ease-in-out infinite',
              animationDelay: `${idx * 0.08}s`,
              ...corner,
            }}
          />
        ))}
      </div>
    );
  };

  const isSpecialBossMode = bossFight.mode === 'active' || gardenDungeon.phase === 'active';

  return (
    <div style={{
      position: 'relative',
      marginInline: 'auto',
      pointerEvents: 'none',
      zIndex: 60,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0,
      overflowY: 'visible',
      overflowX: 'visible',
      width: 'max-content',
      height: '100%',
      minHeight: 0,
      paddingTop: isSpecialBossMode ? 72 : 12,
      boxSizing: 'border-box',
    }}>
      {canEmbraceInfinite && (
        <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, pointerEvents: 'auto' }}>
          <button
            className="attack-embrace-button"
            onClick={embraceInfinite}
            style={{
              padding: '10px 22px',
              borderRadius: 999,
              border: '1px solid rgba(255,200,120,0.75)',
              background: 'linear-gradient(180deg, rgba(255,243,224,0.96), rgba(248,216,168,0.96))',
              color: '#6b3f18',
              fontSize: 13,
              fontWeight: 'bold',
              letterSpacing: 1.2,
              fontFamily: BODY_FONT,
              cursor: 'pointer',
              boxShadow: '0 10px 24px rgba(191,126,63,0.18)',
            }}
          >
            Embrace the Infinite
          </button>
          <div style={{ fontSize: 10, color: 'rgba(107,63,24,0.74)', letterSpacing: 0.4 }}>
            Gain 50 Divine Light per card, keep 3, reshuffle the rest.
          </div>
        </div>
      )}

      {asaSummonRequest && (
        <div style={{
          pointerEvents: 'auto', marginBottom: 8, padding: '8px 16px', borderRadius: 10,
          border: '1px solid rgba(160,200,255,0.5)', background: 'rgba(10,10,20,0.9)',
          display: 'flex', gap: 12, alignItems: 'center', fontFamily: BODY_FONT,
        }}>
          <div style={{ fontSize: 11, color: '#cfe0ff' }}>
            {asaSummonRequest.freeSummon && !asaSummonRequest.definitionId ? <div>Select an Ain Soph Aur from the Extra Deck.</div> : asaSummonRequest.freeSummon ? <div>Free summon: {CardRegistry.get(asaSummonRequest.definitionId)?.name ?? asaSummonRequest.definitionId}</div> : asaSummonRequest.requirements.map((requirement, index) => {
              const selected = selectedMaterialIds
                .map(id => board.backSlots.find(card => card?.instanceId === id))
                .filter((card): card is MainDeckBoardInstance => card !== undefined)
                .filter(card => matchesSummonRequirement(card, requirement)).length;
              return <div key={`summon-requirement-${index}`}>{formatSummonRequirement(requirement)} ({selected}/{requirement.count})</div>;
            })}
          </div>
          <button
            type="button"
            disabled={!asaSummonRequest.definitionId || (!asaSummonRequest.freeSummon && selectedMaterialIds.length !== asaSummonRequest.required) || board.frontSlots.every(s => s !== null)}
            onClick={() => {
              const targetSlot = board.frontSlots.findIndex(s => s === null);
              if (targetSlot !== -1) {
                summonAinSophAur(asaSummonRequest.definitionId, selectedMaterialIds, targetSlot as 0 | 1 | 2 | 3, asaSummonRequest.freeSummon);
              }
              setAsaSummonRequest(null);
              setSelectedMaterialIds([]);
            }}
            style={actionBtnStyle('rgba(140,220,140,0.6)', 'rgba(20,50,20,0.85)', '#8de68d', !asaSummonRequest.freeSummon && selectedMaterialIds.length !== asaSummonRequest.required)}
          >Confirm Summon</button>
          <button
            type="button"
            onClick={() => { setAsaSummonRequest(null); setSelectedMaterialIds([]); }}
            style={actionBtnStyle('rgba(220,100,100,0.5)', 'rgba(50,10,10,0.8)', '#e68d8d')}
          >Cancel</button>
        </div>
      )}

{/* Front row: four summoned Ain Soph Aur slots */}
      <div style={{
        display: 'flex',
        gap: FRONT_ROW_GAP,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {board.frontSlots.map((slot, i) => {
          const slotIndex = i as 0 | 1 | 2 | 3;
          const isNewlyPlaced = slot?.instanceId === lastPlacedInstanceId;
          if (slot?.type === 'AinSophAur') {
            const asaDef = CardRegistry.get(slot.definitionId) as AinSophAurDefinition | undefined;
            const isHovered = hoveredFrontSlot === slotIndex;
            const isSelected = newActionSlot?.zone === 'front' && newActionSlot.index === slotIndex;
            const isRemoveSelected = removeActionSlot?.zone === 'front' && removeActionSlot.index === slotIndex;
            const isFocused = isHovered || isSelected || isRemoveSelected;
            const focusPalette = getBoardFocusPalette('Neutrality');
            const asaElementColor = SET_ACCENT ?? warmTheme.accent;
            const scalingCtx = {
              limitlessLightStacks: turn.limitlessLightStacks,
              asaFrontCount: board.frontSlots.filter(front => front?.type === 'AinSophAur').length,
              collectionPower,
            };
            const bridgeCooldown = asaDef?.bridgeAttack ? (slot.attackCooldowns[asaDef.bridgeAttack.id] ?? 0) : 0;
            const bridgeCost = asaDef?.bridgeAttack?.consumesStacks ? previewStackCost(asaDef.bridgeAttack.consumesStacks, turn.limitlessLightStacks) : 0;
            const bridgePreview = asaDef?.bridgeAttack
              ? Math.max(0, Math.round(asaDef.bridgeAttack.baseDivineLight + resolveCardScaling(asaDef.bridgeAttack.scaling, scalingCtx)))
              : 0;
            const bridgeDisabled = bridgeCooldown > 0 || turn.limitlessLightStacks < bridgeCost;
            const bridgeActionLabel = bridgeCooldown > 0
              ? `Bridge recharging (${bridgeCooldown})`
              : turn.limitlessLightStacks < bridgeCost
                ? `Need ${bridgeCost} Limitless Light Stacks`
                : `Bridge the Light (~${bridgePreview}${bridgeCost > 0 ? `, -${bridgeCost} Stacks` : ''})`;
            const asaText = asaDef ? getCardPreviewText(asaDef, 2) : '';
            const asaDescMetrics = getAdaptiveDescriptionMetrics('board', asaText);
            return (
              <div
                key={slotIndex}
                className={[isNewlyPlaced ? 'anim-angel-summon-pop' : 'anim-angel-breath', getLiveCardShimmerClassName(asaDef, slot.finish, slot.faceState)].filter(Boolean).join(' ')}
                onClick={() => { if (canPlay) setNewActionSlot(prev => (prev?.zone === 'front' && prev.index === slotIndex) ? null : { zone: 'front', index: slotIndex }); }}
                onContextMenu={(event) => {
                  event.preventDefault();
                  if (!canPlay) return;
                  setNewActionSlot(null);
                  setRemoveActionSlot({ zone: 'front', index: slotIndex });
                }}
                onMouseEnter={() => {
                  setHoveredFrontSlot(slotIndex);
                  onHoverCard?.(slot.definitionId);
                }}
                onMouseLeave={() => setHoveredFrontSlot(current => (current === slotIndex ? null : current))}
                title={`${asaDef?.name ?? 'Ain Soph Aur'} · Left-click for actions · Right-click to force remove`}
                style={{
                  width: SLOT_W,
                  aspectRatio: '148 / 204',
                  ...getLiveCardFaceBackgroundStyle(asaDef, slot.finish, slot.faceState),
                  border: `2px solid ${isFocused ? focusPalette.rim : warmTheme.borderStrong}`,
                  borderRadius: 14,
                  boxShadow: isFocused
                    ? `0 0 0 1px ${focusPalette.rim}, 0 0 0 4px ${focusPalette.glow}, 0 0 26px ${focusPalette.glow}, ${cardFacePalette.shadow}`
                    : `${warmTheme.shadow}, ${cardFacePalette.shadow}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  justifyContent: 'flex-start',
                  padding: 0,
                  fontFamily: BODY_FONT,
                  cursor: canPlay ? 'pointer' : 'default',
                  pointerEvents: 'auto',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${asaElementColor}cc, ${asaElementColor}, ${asaElementColor}cc, transparent)`, pointerEvents: 'none', zIndex: 10 }} />
                <div style={getCardNameRibbonStyle('board')}>
                  <div style={{ fontSize: FRONT_FACE_METRICS.typeSize, color: cardFacePalette.textMuted, letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'center' }}>
                    Ain Soph Aur
                  </div>
                  <div style={{ fontSize: FRONT_FACE_METRICS.nameSize + 1, fontWeight: 'bold', color: cardFacePalette.text, textAlign: 'center', lineHeight: 1.25, marginTop: 2 }}>
                    {asaDef?.name ?? 'Ain Soph Aur'}
                  </div>
                </div>
                <div style={getCardRulesPanelStyle('board')}>
                  <div style={{ fontSize: FRONT_FACE_METRICS.descSize, color: bridgeCooldown <= 0 ? warmTheme.success : cardFacePalette.textMuted, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>
                    Ain Attack: {bridgeCooldown <= 0 ? 'Ready' : 'Not Ready'}
                  </div>
                  <div style={{ fontSize: FRONT_FACE_METRICS.descSize, color: bridgeCooldown <= 0 ? warmTheme.success : cardFacePalette.textMuted, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center', marginTop: 2 }}>
                    Soph Attack: {bridgeCooldown > 0 ? 'Not Ready' : bridgeCost > turn.limitlessLightStacks ? 'No Stacks' : 'Ready'}
                  </div>
                  <div style={{
                    fontSize: asaDescMetrics.fontSize,
                    color: cardFacePalette.textSoft,
                    marginTop: 5,
                    lineHeight: asaDescMetrics.lineHeight,
                    textAlign: 'center',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: asaDescMetrics.lineClamp,
                    overflow: 'hidden',
                  }}>
                    {asaText}
                  </div>
                </div>
                {isSelected && (
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 20,
                    background: 'rgba(5,3,12,0.94)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 6, padding: 8, borderRadius: 14,
                  }}>
                    <button
                      type="button"
                      disabled={bridgeDisabled}
                      onClick={(e) => { e.stopPropagation(); activateAsaBridge(slot.instanceId); setNewActionSlot(null); }}
                      style={actionBtnStyle('rgba(255,214,120,0.6)', 'rgba(60,44,10,0.85)', '#ffd678', bridgeDisabled)}
                    >{bridgeActionLabel}</button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setNewActionSlot(null); }}
                      style={actionBtnStyle('rgba(150,150,150,0.5)', 'rgba(30,30,30,0.8)', '#ccc')}
                    >Cancel</button>
                  </div>
                )}
                {isRemoveSelected && (
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 21,
                    background: 'rgba(18,3,6,0.95)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 7, padding: 8, borderRadius: 14,
                  }}>
                    <div style={{ fontSize: 9, color: '#f0b0b0', textAlign: 'center', lineHeight: 1.35 }}>
                      Return this card to the Extra Deck?
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        forceRemoveBoardCard(slot.instanceId);
                        setRemoveActionSlot(null);
                      }}
                      style={actionBtnStyle('rgba(235,90,105,0.7)', 'rgba(70,8,14,0.9)', '#ffb0b8')}
                    >Force Remove</button>
                    <button
                      type="button"
                      onClick={(event) => { event.stopPropagation(); setRemoveActionSlot(null); }}
                      style={actionBtnStyle('rgba(150,150,150,0.5)', 'rgba(30,30,30,0.8)', '#ccc')}
                    >Cancel</button>
                  </div>
                )}
                {isFocused && renderBoardFocusOverlay(14, 'Neutrality')}
              </div>
            );
          }

          return (
            <div key={slotIndex} aria-label="Empty Ain Soph Aur front slot" style={{
              width: SLOT_W, aspectRatio: '148 / 204',
              border: '1px solid rgba(244,244,248,0.22)',
              borderRadius: 12,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
              backdropFilter: 'blur(3px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: BODY_FONT,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <GameEmblem id="deck-viewer" size={26} className="board-empty-slot-emblem" />
              <span style={{ fontSize: 8, color: 'rgba(244,244,248,0.32)', letterSpacing: 1.8, textTransform: 'uppercase' }}>Empty</span>
            </div>
          );
        })}
      </div>

      {/* Set Ability hotkey strip 窶・shows during playing phase */}

      {/* Zone separator with rank labels */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        gap: 10,
        marginTop: 'clamp(6px, 1vh, 12px)',
        marginBottom: 2,
        pointerEvents: canShatterTheInfiniteLight ? 'auto' : 'none',
        animation: 'boardZoneEntrance 0.5s ease both',
      }}>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(244,244,248,0.22))' }} />
        <div style={{ fontSize: 8, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(244,244,248,0.55)', fontFamily: BODY_FONT, whiteSpace: 'nowrap' }}>Front Rank</div>
        <div style={{ flex: 2, height: 1, background: 'rgba(244,244,248,0.1)', boxShadow: '0 0 8px rgba(244,244,248,0.06)' }} />
        {canShatterTheInfiniteLight && (
          <button
            className="attack-embrace-button"
            onClick={activateShatterTheInfiniteLight}
            title="Click stars for 10 seconds. Front cards return to the Extra Deck; back-row and discard cards return to the draw pile; your hand is kept."
            style={{
              padding: '7px 16px', borderRadius: 999, border: '1px solid rgba(255,120,120,0.75)',
              background: 'linear-gradient(180deg, rgba(28,10,10,0.96), rgba(10,4,6,0.96))', color: '#ffb3a0',
              fontSize: 10, fontWeight: 'bold', letterSpacing: 1, fontFamily: BODY_FONT, cursor: 'pointer',
              boxShadow: '0 0 22px rgba(255,80,80,0.32)', whiteSpace: 'nowrap',
            }}
          >Shatter the Infinite Light</button>
        )}
        <div style={{ fontSize: 8, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(200,160,255,0.65)', fontFamily: BODY_FONT, whiteSpace: 'nowrap' }}>Support</div>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(244,244,248,0.22), transparent)' }} />
      </div>

      {/* Support row: four Light/Dark slots, staggered between front slots */}
      <div style={{
        display: 'flex',
        gap: BACK_ROW_GAP,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: ROW_SEPARATION,
      }}>
        {board.backSlots.map((card, i) => {
          const backSlot = i as 0 | 1 | 2 | 3;
          const isDragTarget = dragOverBack === backSlot && canPlay;

          // Light / Dark Main Deck card rendering
          if (card && (card.type === 'Light' || card.type === 'Dark')) {
            const mainCard = card as MainDeckBoardInstance;
            const mainDef = CardRegistry.get(mainCard.definitionId) as LightCardDefinition | DarkCardDefinition | undefined;
            const charge = mainCard.limitlessCharge ?? 0;
            const isSoph = mainCard.side === 'soph' && mainCard.faceState === 'back';
            const isAin = mainCard.side === 'ain' && mainCard.faceState === 'front';
            const isReadyToFlip = isSoph && charge >= SOPH_FLIP_CHARGE_REQUIRED;
            const isSelected = newActionSlot?.zone === 'back' && newActionSlot.index === backSlot;
            const isRemoveSelected = removeActionSlot?.zone === 'back' && removeActionSlot.index === backSlot;
            const isMaterialMode = !!asaSummonRequest;
            const isMaterialSelected = isMaterialMode && selectedMaterialIds.includes(mainCard.instanceId);
            const canMatchRequirement = asaSummonRequest?.requirements.some(requirement => matchesSummonRequirement(mainCard, requirement)) ?? false;
            const canSelectAsMaterial = isMaterialSelected
              || (asaSummonRequest !== null && canMatchRequirement && selectedMaterialIds.length < asaSummonRequest.required);
            const mainText = mainDef ? getCardPreviewText(mainDef, 2) : '';
            const mainDescMetrics = getAdaptiveDescriptionMetrics('boardMini', mainText);
            const mainElementColor = SET_ACCENT;
            const scalingCtx = {
              limitlessLightStacks: turn.limitlessLightStacks,
              asaFrontCount: board.frontSlots.filter(front => front?.type === 'AinSophAur').length,
              collectionPower,
            };

            let ainCooldown = 0;
            let sophCooldown = 0;
            let ainPreview = 0;
            let sophPreview = 0;
            let sophCost = 0;
            const sophPool = mainDef?.type === 'Light' ? getSophAttackPool(mainDef.sophAttack, turn) : turn.limitlessLightStacks;
            const sophResource = mainDef?.type === 'Light' && usesInferno(mainDef.sophAttack) ? 'Inferno' : 'Light';
            let darkCooldown = 0;
            let darkCost = 0;
            let darkRequirement: string | null = null;
            if (mainDef?.type === 'Light' && isAin) {
              ainCooldown = mainCard.attackCooldowns[mainDef.ainAttack.id] ?? 0;
              sophCooldown = mainCard.attackCooldowns[mainDef.sophAttack.id] ?? 0;
              ainPreview = Math.max(0, Math.round(mainDef.ainAttack.baseDivineLight + resolveCardScaling(mainDef.ainAttack.scaling, scalingCtx)));
              sophCost = mainDef.sophAttack.stackCost ? previewStackCost(mainDef.sophAttack.stackCost, sophPool) : 0;
              sophPreview = Math.max(0, Math.round(mainDef.sophAttack.baseDivineLight + resolveCardScaling(mainDef.sophAttack.scaling, scalingCtx)
                + (usesInferno(mainDef.sophAttack) ? turn.intensityAttackBonus ?? 0 : 0)));
            }
            if (mainDef?.type === 'Dark' && isAin) {
              darkCooldown = mainDef.persistent ? (mainCard.attackCooldowns[`${mainDef.definitionId}:activation`] ?? 0) : 0;
              darkCost = previewStackCost(mainDef.activationCost, turn.limitlessLightStacks);
              darkRequirement = getUnmetCardRequirement(
                mainDef,
                { ...turn, limitlessLightStacks: turn.limitlessLightStacks - darkCost },
                deck,
                mainCard.instanceId,
              );
            }

            return (
              <div
                key={backSlot}
                className={getLiveCardShimmerClassName(mainDef, mainCard.finish, mainCard.faceState)}
                style={{
                  width: SUPPORT_SLOT_W, aspectRatio: '148 / 204',
                  ...getLiveCardFaceBackgroundStyle(mainDef, mainCard.finish, mainCard.faceState),
                  border: `1px solid ${isMaterialSelected ? 'rgba(120,220,140,0.95)' : isMaterialMode && canSelectAsMaterial ? 'rgba(255,255,255,0.95)' : isReadyToFlip ? 'rgba(255,224,140,0.9)' : 'rgba(160,160,200,0.4)'}`,
                  borderRadius: 12,
                  boxShadow: isMaterialSelected
                    ? '0 0 0 2px rgba(120,220,140,0.8), 0 0 24px rgba(120,220,140,0.58)'
                    : isMaterialMode && canSelectAsMaterial
                      ? '0 0 0 2px rgba(255,255,255,0.86), 0 0 24px rgba(255,255,255,0.65)'
                      : isReadyToFlip
                        ? `${warmTheme.glow}, 0 0 18px rgba(255,214,120,0.4)`
                        : `${warmTheme.shadow}, ${cardFacePalette.shadow}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start',
                  fontFamily: BODY_FONT, pointerEvents: 'auto', cursor: isMaterialMode && !canSelectAsMaterial ? 'not-allowed' : 'pointer',
                  padding: 0, overflow: 'hidden', position: 'relative',
                  ...(isMaterialMode && !canSelectAsMaterial ? { opacity: 0.38, filter: 'grayscale(0.7)' } : {}),
                }}
                onClick={() => {
                  if (isMaterialMode && asaSummonRequest) {
                    if (!canSelectAsMaterial) return;
                    setSelectedMaterialIds(prev => prev.includes(mainCard.instanceId)
                      ? prev.filter(id => id !== mainCard.instanceId)
                      : (prev.length < asaSummonRequest.required ? [...prev, mainCard.instanceId] : prev));
                    return;
                  }
                  setNewActionSlot(prev => (prev?.zone === 'back' && prev.index === backSlot) ? null : { zone: 'back', index: backSlot });
                }}
                onContextMenu={(event) => {
                  event.preventDefault();
                  if (!canPlay || isMaterialMode) return;
                  setNewActionSlot(null);
                  setRemoveActionSlot({ zone: 'back', index: backSlot });
                }}
                onMouseEnter={() => {
                  onHoverCard?.(mainCard.definitionId);
                }}
                title={`${mainDef?.name ?? mainCard.type} · ${isSoph ? `Charge ${charge}/${SOPH_FLIP_CHARGE_REQUIRED}` : 'Active'} · Right-click to force remove`}
              >
                {isAin && (
                  <>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${mainElementColor}cc, ${mainElementColor}, ${mainElementColor}cc, transparent)`, pointerEvents: 'none', zIndex: 10 }} />
                    <div style={getCardNameRibbonStyle('boardMini')}>
                      <div style={{ fontSize: SUPPORT_FACE_METRICS.typeSize, color: cardFacePalette.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', textAlign: 'center' }}>
                        {getDisplayCardTypeLabel(mainDef?.type ?? mainCard.type)}
                      </div>
                      <div style={{ fontSize: SUPPORT_FACE_METRICS.nameSize + 1, fontWeight: 'bold', color: cardFacePalette.text, textAlign: 'center', lineHeight: 1.25, marginTop: 2 }}>
                        {mainDef?.name ?? mainCard.definitionId}
                      </div>
                    </div>
                    <div style={getCardRulesPanelStyle('boardMini')}>
                      <div style={{ fontSize: SUPPORT_FACE_METRICS.descSize, color: ainCooldown <= 0 ? warmTheme.success : cardFacePalette.textMuted, letterSpacing: 0.4, textAlign: 'center', textTransform: 'uppercase' }}>
                        Ain Attack: {mainDef?.type === 'Light' ? (ainCooldown <= 0 ? 'Ready' : 'Not Ready') : 'Not Ready'}
                      </div>
                      <div style={{ fontSize: SUPPORT_FACE_METRICS.descSize, color: sophCooldown <= 0 && sophPool >= sophCost ? warmTheme.success : cardFacePalette.textMuted, letterSpacing: 0.4, textAlign: 'center', textTransform: 'uppercase', marginTop: 2 }}>
                        Soph Attack: {mainDef?.type === 'Light' ? (sophCooldown > 0 ? 'Not Ready' : sophPool < sophCost ? `No ${sophResource}` : 'Ready') : 'Not Ready'}
                      </div>
                      <div style={{
                        fontSize: mainDescMetrics.fontSize,
                        color: cardFacePalette.textSoft,
                        marginTop: 4,
                        lineHeight: mainDescMetrics.lineHeight,
                        textAlign: 'center',
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: mainDescMetrics.lineClamp,
                        overflow: 'hidden',
                      }}>
                        {mainText}
                      </div>
                    </div>
                  </>
                )}
                {charge > 0 && renderSophChargeBadge(charge)}
                {isMaterialMode && (
                  <div style={{
                    position: 'absolute', top: 6, right: 6, zIndex: 12, width: 16, height: 16, borderRadius: 4,
                    border: '1px solid rgba(140,220,140,0.8)',
                    background: isMaterialSelected ? 'rgba(60,180,90,0.9)' : 'rgba(0,0,0,0.4)',
                  }} />
                )}
                {isSelected && !isMaterialMode && (
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 20,
                    background: 'rgba(5,3,12,0.94)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 6, padding: 8, borderRadius: 12,
                  }}>
                    {isSoph && isReadyToFlip && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); flipSoph(mainCard.instanceId, 'flip'); setNewActionSlot(null); }}
                          style={actionBtnStyle('rgba(140,220,140,0.6)', 'rgba(20,50,20,0.8)', '#8de68d')}
                        >Flip to Ain (+{charge} Stacks)</button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); flipSoph(mainCard.instanceId, 'sacrifice'); setNewActionSlot(null); }}
                          style={actionBtnStyle('rgba(220,100,100,0.5)', 'rgba(50,10,10,0.8)', '#e68d8d')}
                        >Sacrifice (+{Math.max(1, Math.round(charge * (mainDef?.sacrificeStackRate ?? 0) / 100))} Stacks)</button>
                      </>
                    )}
                    {isSoph && !isReadyToFlip && (
                      <div style={{ fontSize: 9, color: 'rgba(220,220,240,0.8)', textAlign: 'center' }}>
                        Needs {SOPH_FLIP_CHARGE_REQUIRED - charge} more card play{SOPH_FLIP_CHARGE_REQUIRED - charge !== 1 ? 's' : ''} to ready.
                      </div>
                    )}
                    {isAin && mainDef?.type === 'Light' && (
                      <>
                        <button
                          type="button"
                          disabled={ainCooldown > 0}
                          onClick={(e) => { e.stopPropagation(); activateLightAinAttack(mainCard.instanceId); setNewActionSlot(null); }}
                          style={actionBtnStyle('rgba(255,214,120,0.6)', 'rgba(60,44,10,0.85)', '#ffd678', ainCooldown > 0)}
                        >Ain Attack (~{ainPreview})</button>
                        <button
                          type="button"
                          disabled={sophCooldown > 0 || sophPool < sophCost}
                          onClick={(e) => { e.stopPropagation(); activateLightSophAttack(mainCard.instanceId); setNewActionSlot(null); }}
                          style={actionBtnStyle('rgba(160,200,255,0.6)', 'rgba(14,30,60,0.85)', '#a0c8ff', sophCooldown > 0 || sophPool < sophCost)}
                        >{sophCooldown > 0
                          ? `Soph recharging (${sophCooldown})`
                          : sophPool < sophCost
                            ? `Need ${sophCost} Limitless ${sophResource} Stacks`
                            : `Soph Attack (~${sophPreview}${sophCost > 0 ? `, -${sophCost} ${sophResource}` : ''})`}</button>
                      </>
                    )}
                    {isAin && mainDef?.type === 'Dark' && (
                      <button
                        type="button"
                        disabled={darkCooldown > 0 || turn.limitlessLightStacks < darkCost || !!darkRequirement}
                        title={darkRequirement ?? undefined}
                        onClick={(e) => { e.stopPropagation(); activateDark(mainCard.instanceId); setNewActionSlot(null); }}
                        style={actionBtnStyle('rgba(200,160,255,0.6)', 'rgba(30,14,50,0.85)', '#c8a0ff', darkCooldown > 0 || turn.limitlessLightStacks < darkCost || !!darkRequirement)}
                      >{darkRequirement ?? (darkCost > 0 ? `Activate (-${darkCost} Stacks)` : 'Activate (No Stack Cost)')}</button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setNewActionSlot(null); }}
                      style={actionBtnStyle('rgba(150,150,150,0.5)', 'rgba(30,30,30,0.8)', '#ccc')}
                    >Cancel</button>
                  </div>
                )}
                {isRemoveSelected && !isMaterialMode && (
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 21,
                    background: 'rgba(18,3,6,0.95)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 7, padding: 8, borderRadius: 12,
                  }}>
                    <div style={{ fontSize: 9, color: '#f0b0b0', textAlign: 'center', lineHeight: 1.35 }}>
                      Send this card to the discard pile?
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        forceRemoveBoardCard(mainCard.instanceId);
                        setRemoveActionSlot(null);
                      }}
                      style={actionBtnStyle('rgba(235,90,105,0.7)', 'rgba(70,8,14,0.9)', '#ffb0b8')}
                    >Force Remove</button>
                    <button
                      type="button"
                      onClick={(event) => { event.stopPropagation(); setRemoveActionSlot(null); }}
                      style={actionBtnStyle('rgba(150,150,150,0.5)', 'rgba(30,30,30,0.8)', '#ccc')}
                    >Cancel</button>
                  </div>
                )}
              </div>
            );
          }

          // Empty support slots accept Main Deck Light/Dark cards.
          const supportGlow = isDragTarget ? 'rgba(214,196,255,0.95)' : 'rgba(214,196,255,0.18)';
          return (
            <div
              key={backSlot}
              style={{
                width: SUPPORT_SLOT_W, aspectRatio: '148 / 204',
                border: isDragTarget ? '2px solid rgba(214,196,255,0.9)' : '1px solid rgba(214,196,255,0.28)',
                borderRadius: 12,
                background: isDragTarget
                  ? 'rgba(160,140,220,0.12)'
                  : 'linear-gradient(180deg, rgba(214,196,255,0.1) 0%, rgba(200,160,255,0.04) 100%)',
                backdropFilter: 'blur(3px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 6, cursor: isDragTarget ? 'copy' : 'default', pointerEvents: 'auto',
                fontFamily: BODY_FONT, color: supportGlow, transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
                boxShadow: isDragTarget
                  ? '0 0 0 2px rgba(214,196,255,0.35), 0 0 22px rgba(214,196,255,0.18)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.03)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onDragOver={(e) => {
                if (!canPlay || !e.dataTransfer.types.includes('application/x-pantheon-card')) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverBack(backSlot);
              }}
              onDragLeave={() => setDragOverBack(null)}
              onDrop={(event) => {
                const instanceId = event.dataTransfer.getData('application/x-pantheon-card');
                if (instanceId) playCard(instanceId, (event.dataTransfer.getData('application/x-pantheon-side') || 'soph') as 'soph' | 'ain');
                setDragOverBack(null);
              }}
            >
              {/* Corner accent marks */}
              <div style={{ position: 'absolute', top: 5, left: 5, width: 8, height: 8, borderTop: `1px solid ${supportGlow}`, borderLeft: `1px solid ${supportGlow}`, borderRadius: 1, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderTop: `1px solid ${supportGlow}`, borderRight: `1px solid ${supportGlow}`, borderRadius: 1, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 5, left: 5, width: 8, height: 8, borderBottom: `1px solid ${supportGlow}`, borderLeft: `1px solid ${supportGlow}`, borderRadius: 1, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 5, right: 5, width: 8, height: 8, borderBottom: `1px solid ${supportGlow}`, borderRight: `1px solid ${supportGlow}`, borderRadius: 1, pointerEvents: 'none' }} />
              <GameEmblem id="cards" size={24} />
              <div style={{ fontSize: 7, color: supportGlow, marginTop: 2, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {isDragTarget ? 'Place as Soph or Ain' : 'Empty'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
