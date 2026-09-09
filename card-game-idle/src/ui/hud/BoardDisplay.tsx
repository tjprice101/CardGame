import { useState, useEffect, useRef } from 'react';
import CardRulesDigest from '@/ui/components/CardRulesDigest';
import SetAbilityStrip from '@/ui/hud/SetAbilityStrip';
import { getCardBackgroundUrl } from '@/ui/cardBackgrounds';
import { useStore, selectBoard, selectBossFight, selectCanEmbraceInfinite, selectTurn } from '@/state/store';
import { useThemeVersion } from '@/ui/useThemeVersion';
import { CardRegistry } from '@/cards/CardRegistry';
import {
  cardFacePalette,
  getAdaptiveDescriptionMetrics,
  getCardFaceBackgroundStyle,
  getCardFaceMetrics,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';
import { getDisplayCardTypeLabel } from '@/ui/preferences';
import { getCardPreviewText } from '@/ui/cardStatSummary';
import { uiTypography, warmTheme } from '@/ui/theme';
import { SET_ACCENT, SET_LABEL } from '@/data/elements';
import { resolveCardScaling } from '@/systems/cards/CardScaling';
import type {
  LightCardDefinition,
  DarkCardDefinition,
  AinSophAurDefinition,
  StackCostDefinition,
  MainDeckBoardInstance,
} from '@/types/cards';

const SLOT_W = 118;
const SLOT_H = 168;
const CHERUBIM_W = 104;
const CHERUBIM_H = 148;
const FRONT_ROW_GAP = 'clamp(12px, 1.4vw, 18px)';
const BACK_ROW_GAP = `calc(${FRONT_ROW_GAP} + ${SLOT_W - CHERUBIM_W}px)`;
const ROW_SEPARATION = 'clamp(14px, 2vh, 24px)';
const FRONT_FACE_METRICS = getCardFaceMetrics('board');
const CHERUBIM_FACE_METRICS = getCardFaceMetrics('boardMini');
const DISPLAY_FONT = uiTypography.display;
const BODY_FONT = uiTypography.body;

function renderPatienceBadge(stacks: number) {
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
      {`筮｡ ${stacks}`}
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

export default function BoardDisplay() {
  useThemeVersion();
  const board = useStore(selectBoard);
  const bossFight     = useStore(selectBossFight);
  const canEmbraceInfinite = useStore(selectCanEmbraceInfinite);
  const turn = useStore(selectTurn);
  const {
    embraceInfinite,
    flipSoph,
    activateLightAinAttack,
    activateLightSophAttack,
    activateDark,
    activateAsaBridge,
    summonAinSophAur,
  } = useStore.getState();

  // Seraphim/Cherubim/Angel are no longer registered card types; these flags stay
  // false so the legacy empty-slot visuals and handlers below are dormant.
  const hasSeraphimInHand = false;
  const hasCherubimInHand = false;
  const canPlay = turn.phase === 'playing';
  const pendingAngelSummon = false;

  const prevSlotsRef = useRef(board.frontSlots);
  const [lastPlacedInstanceId, setLastPlacedInstanceId] = useState<string | null>(null);
  const [dragOverFront, setDragOverFront] = useState<number | null>(null);
  const [dragOverBack, setDragOverBack] = useState<number | null>(null);
  const [hoveredFrontSlot, setHoveredFrontSlot] = useState<number | null>(null);
  const [hoveredBackSlot, setHoveredBackSlot] = useState<number | null>(null);
  const [attackPanelSlot, setAttackPanelSlot] = useState<number | null>(null);
  const [newActionSlot, setNewActionSlot] = useState<{ zone: 'front' | 'back'; index: 0 | 1 | 2 | 3 } | null>(null);
  const [asaSummonRequest, setAsaSummonRequest] = useState<{ definitionId: string; required: number } | null>(null);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ definitionId: string; required: number }>;
      if (!ce.detail) return;
      setAsaSummonRequest(ce.detail);
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

  function handleFrontSlotClick(slotIndex: 0 | 1 | 2 | 3) {
    const slot = board.frontSlots[slotIndex];
    if (slot && canPlay) {
      setAttackPanelSlot(prev => prev === slotIndex ? null : slotIndex);
    }
  }

  function handleBackSlotClick(_backSlot: 0 | 1 | 2 | 3) {
    // Back-row interaction is handled by the inline card overlays.
  }

  const selectedFront = attackPanelSlot !== null ? board.frontSlots[attackPanelSlot] : null;
  const selectedDef = selectedFront ? CardRegistry.get(selectedFront.definitionId) : null;
  const isAttackPanelOpen = canPlay && !!selectedFront && !!selectedDef;

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

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('hr-attack-panel-open', { detail: isAttackPanelOpen }));
  }, [isAttackPanelOpen]);

  const playfieldRightInset = 'var(--angel-drawer-hand-offset, 348px)';

  // Compute the hovered card definition for the immediate tooltip.
  // Suppress tooltip when the attack panel is open to avoid overlap.
  const boardHoveredCard =
    attackPanelSlot === null
      ? (hoveredFrontSlot !== null ? board.frontSlots[hoveredFrontSlot] : null) ??
        (hoveredBackSlot !== null ? board.backSlots[hoveredBackSlot] : null)
      : null;
  const boardHoveredDef = boardHoveredCard ? CardRegistry.get(boardHoveredCard.definitionId) ?? null : null;

  const BOARD_TOOLTIP_TYPE_COLORS: Record<string, string> = {
    Seraphim: '#FFD700',
    Ophanim: '#c888f0',
    Cherubim: '#b87de8',
    Angel: '#FFD700',
  };

  return (
    <div style={{
      position: 'absolute',
      left: 0,
      right: playfieldRightInset,
      top: bossFight.mode === 'active' ? 'clamp(160px, 16vh, 215px)' : 'clamp(146px, 15.5vh, 218px)',
      bottom: 'clamp(220px, 24vh, 300px)',
      marginInline: 'auto',
      pointerEvents: 'none',
      zIndex: 60,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0,
      overflowY: 'auto',
      overflowX: 'visible',
      width: 'max-content',
    }}>
      <div style={{
        pointerEvents: 'none',
        alignSelf: 'center',
        marginBottom: 8,
        padding: '7px 14px',
        borderRadius: 999,
        border: '1px solid rgba(255,232,158,0.58)',
        background: 'rgba(35,24,18,0.86)',
        color: '#ffe89e',
        fontFamily: BODY_FONT,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.5,
        boxShadow: '0 4px 16px rgba(0,0,0,0.28)',
      }}>
        Limitless Light Stacks: {turn.limitlessLightStacks}
      </div>
      {/* Immediate hover tooltip for board cards */}
      {boardHoveredDef && (
        <div style={{
          position: 'fixed',
          bottom: 200,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 270,
          background: 'linear-gradient(180deg, rgba(247,239,226,0.995) 0%, rgba(235,218,190,0.99) 100%)',
          border: '1px solid rgba(138,94,58,0.5)',
          borderRadius: 14,
          padding: '14px 16px',
          pointerEvents: 'none',
          zIndex: 90,
          boxShadow: '0 22px 40px rgba(0,0,0,0.42), 0 0 0 1px rgba(255,255,255,0.38)',
          backdropFilter: 'blur(10px)',
          fontFamily: BODY_FONT,
          animation: 'tooltipFadeIn 0.18s ease both',
        }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.55, marginBottom: 4, color: BOARD_TOOLTIP_TYPE_COLORS[boardHoveredDef.type] ?? '#aaa' }}>
            {getDisplayCardTypeLabel(boardHoveredDef.type)}
          </div>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: warmTheme.accentDeep, marginBottom: 8, lineHeight: 1.2 }}>
            {boardHoveredDef.name}
          </div>
          <div style={{ fontSize: 13, color: warmTheme.text, lineHeight: 1.6, marginBottom: 10 }}>
            <CardRulesDigest
              card={boardHoveredDef}
              variant="preview"
              maxSections={3}
              maxLinesPerSection={10}
              lineClamp={3}
              labelColor="rgba(74, 48, 21, 0.82)"
              textColor={warmTheme.accentDeep}
              sectionBackground="transparent"
              sectionBorder="transparent"
              lightBg={true}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start', fontSize: 10, color: 'rgba(58, 40, 24, 0.86)', lineHeight: 1.35, marginTop: 6 }}>
            <span style={{ color: SET_ACCENT }}>
              {SET_LABEL ?? 'Neutrality'}
            </span>
          </div>
        </div>
      )}

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
            Select {asaSummonRequest.required} back-row material{asaSummonRequest.required !== 1 ? 's' : ''} to summon ({selectedMaterialIds.length}/{asaSummonRequest.required})
          </div>
          <button
            type="button"
            disabled={selectedMaterialIds.length !== asaSummonRequest.required || board.frontSlots.every(s => s !== null)}
            onClick={() => {
              const targetSlot = board.frontSlots.findIndex(s => s === null);
              if (targetSlot !== -1) {
                summonAinSophAur(asaSummonRequest.definitionId, selectedMaterialIds, targetSlot as 0 | 1 | 2 | 3);
              }
              setAsaSummonRequest(null);
              setSelectedMaterialIds([]);
            }}
            style={actionBtnStyle('rgba(140,220,140,0.6)', 'rgba(20,50,20,0.85)', '#8de68d', selectedMaterialIds.length !== asaSummonRequest.required)}
          >Confirm Summon</button>
          <button
            type="button"
            onClick={() => { setAsaSummonRequest(null); setSelectedMaterialIds([]); }}
            style={actionBtnStyle('rgba(220,100,100,0.5)', 'rgba(50,10,10,0.8)', '#e68d8d')}
          >Cancel</button>
        </div>
      )}

{/* Front row: 5 Seraphim/Angel slots */}
      <div style={{
        display: 'flex',
        gap: FRONT_ROW_GAP,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {board.frontSlots.map((slot, i) => {
          const slotIndex = i as 0 | 1 | 2 | 3;
          const isNewlyPlaced = slot?.instanceId === lastPlacedInstanceId;
          const isDragTarget = dragOverFront === slotIndex && !slot && canPlay;

          if (slot?.type === 'AinSophAur') {
            const asaDef = CardRegistry.get(slot.definitionId) as AinSophAurDefinition | undefined;
            const isHovered = hoveredFrontSlot === slotIndex;
            const isSelected = newActionSlot?.zone === 'front' && newActionSlot.index === slotIndex;
            const isFocused = isHovered || isSelected;
            const focusPalette = getBoardFocusPalette('Neutrality');
            const asaElementColor = SET_ACCENT ?? warmTheme.accent;
            const scalingCtx = {
              limitlessLightStacks: turn.limitlessLightStacks,
              asaFrontCount: board.frontSlots.filter(front => front?.type === 'AinSophAur').length,
              collectionPower: 0,
            };
            const bridgeCooldown = asaDef?.bridgeAttack ? (slot.attackCooldowns[asaDef.bridgeAttack.id] ?? 0) : 0;
            const bridgeCost = asaDef?.bridgeAttack?.consumesStacks ? previewStackCost(asaDef.bridgeAttack.consumesStacks, turn.limitlessLightStacks) : 0;
            const bridgePreview = asaDef?.bridgeAttack
              ? Math.max(0, Math.round(asaDef.bridgeAttack.baseOblivion + resolveCardScaling(asaDef.bridgeAttack.scaling, scalingCtx) + bridgeCost))
              : 0;
            const asaText = asaDef ? getCardPreviewText(asaDef, 2) : '';
            const asaDescMetrics = getAdaptiveDescriptionMetrics('board', asaText);
            return (
              <div
                key={slotIndex}
                className={isNewlyPlaced ? 'anim-angel-summon-pop' : 'anim-angel-breath'}
                onClick={() => { if (canPlay) setNewActionSlot(prev => (prev?.zone === 'front' && prev.index === slotIndex) ? null : { zone: 'front', index: slotIndex }); }}
                onMouseEnter={() => setHoveredFrontSlot(slotIndex)}
                onMouseLeave={() => setHoveredFrontSlot(current => (current === slotIndex ? null : current))}
                title={`${asaDef?.name ?? 'Ain Soph Aur'} ﾂｷ Bridge the Light`}
                style={{
                  width: SLOT_W,
                  height: SLOT_H,
                  ...getCardFaceBackgroundStyle(asaDef, slot.finish, slot.faceState),
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
                  <div style={{ fontSize: FRONT_FACE_METRICS.nameSize, fontWeight: 'bold', color: cardFacePalette.text, textAlign: 'center', lineHeight: 1.25, marginTop: 2 }}>
                    {asaDef?.name ?? 'Ain Soph Aur'}
                  </div>
                </div>
                <div style={getCardRulesPanelStyle('board')}>
                  <div style={{ fontSize: FRONT_FACE_METRICS.descSize, color: bridgeCooldown <= 0 ? warmTheme.success : cardFacePalette.textMuted, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>
                    Bridge: {bridgeCooldown <= 0 ? 'Ready' : bridgeCooldown}
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
                      disabled={bridgeCooldown > 0 || turn.limitlessLightStacks < bridgeCost}
                      onClick={(e) => { e.stopPropagation(); activateAsaBridge(slot.instanceId); setNewActionSlot(null); }}
                      style={actionBtnStyle('rgba(255,214,120,0.6)', 'rgba(60,44,10,0.85)', '#ffd678', bridgeCooldown > 0 || turn.limitlessLightStacks < bridgeCost)}
                    >Bridge the Light (~{bridgePreview}{bridgeCost > 0 ? `, -${bridgeCost} Stacks` : ''})</button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setNewActionSlot(null); }}
                      style={actionBtnStyle('rgba(150,150,150,0.5)', 'rgba(30,30,30,0.8)', '#ccc')}
                    >Cancel</button>
                  </div>
                )}
                {isFocused && renderBoardFocusOverlay(14, 'Neutrality')}
              </div>
            );
          }

          // Empty front slot ? accepts Seraphim drops
          const hasAction = canPlay && (hasSeraphimInHand || pendingAngelSummon);
          const glowColor = isDragTarget
            ? 'rgba(244,244,248,0.95)'
            : pendingAngelSummon
              ? 'rgba(232, 214, 255, 0.9)'
              : hasSeraphimInHand ? 'rgba(244,244,248,0.65)' : 'rgba(244,244,248,0.2)';
          return (
            <div
              key={slotIndex}
              style={{
                width: SLOT_W, height: SLOT_H,
                border: isDragTarget ? '2px solid rgba(244,244,248,0.9)' : pendingAngelSummon ? '1px solid rgba(190, 138, 255, 0.8)' : `1px solid rgba(244,244,248,${hasSeraphimInHand ? '0.4' : '0.22'})`,
                borderRadius: 12,
                background: isDragTarget
                  ? 'rgba(244,244,248,0.1)'
                  : pendingAngelSummon
                    ? 'linear-gradient(180deg, rgba(86, 46, 150, 0.18) 0%, rgba(24, 12, 42, 0.12) 100%)'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                backdropFilter: 'blur(3px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: hasAction ? 'pointer' : 'default', pointerEvents: 'auto',
                fontFamily: BODY_FONT, transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
                boxShadow: isDragTarget
                  ? `0 0 0 2px rgba(255,215,0,0.45), 0 0 22px rgba(255,215,0,0.18)`
                  : pendingAngelSummon
                    ? '0 0 0 2px rgba(190, 138, 255, 0.28), 0 0 22px rgba(190, 138, 255, 0.18)'
                  : hasSeraphimInHand
                    ? `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 14px rgba(255,215,0,0.06)`
                    : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={() => handleFrontSlotClick(slotIndex)}
              onDragOver={(e) => {
                if (!canPlay || !e.dataTransfer.types.includes('application/x-seraphim-card')) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverFront(slotIndex);
              }}
              onDragLeave={() => setDragOverFront(null)}
              onDrop={() => {
                setDragOverFront(null);
              }}
            >
              {/* Corner accent marks */}
              <div style={{ position: 'absolute', top: 6, left: 6, width: 10, height: 10, borderTop: `1px solid ${glowColor}`, borderLeft: `1px solid ${glowColor}`, borderRadius: 1, pointerEvents: 'none', transition: 'border-color 0.2s' }} />
              <div style={{ position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderTop: `1px solid ${glowColor}`, borderRight: `1px solid ${glowColor}`, borderRadius: 1, pointerEvents: 'none', transition: 'border-color 0.2s' }} />
              <div style={{ position: 'absolute', bottom: 6, left: 6, width: 10, height: 10, borderBottom: `1px solid ${glowColor}`, borderLeft: `1px solid ${glowColor}`, borderRadius: 1, pointerEvents: 'none', transition: 'border-color 0.2s' }} />
              <div style={{ position: 'absolute', bottom: 6, right: 6, width: 10, height: 10, borderBottom: `1px solid ${glowColor}`, borderRight: `1px solid ${glowColor}`, borderRadius: 1, pointerEvents: 'none', transition: 'border-color 0.2s' }} />
              {/* Orbital pulse rings 窶・two staggered concentric rings radiate outward
                  to grab the eye when a Seraphim is in hand and this slot is playable. */}
              {hasSeraphimInHand && (
                <>
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    width: 56, height: 56, borderRadius: '50%',
                    border: `1px solid ${glowColor}`,
                    animation: 'orbitalPulse 2.4s ease-out infinite',
                    pointerEvents: 'none',
                  }} />
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    width: 56, height: 56, borderRadius: '50%',
                    border: `1px solid ${glowColor}`,
                    animation: 'orbitalPulse 2.4s ease-out 1.2s infinite',
                    pointerEvents: 'none',
                  }} />
                </>
              )}
              <div style={{ fontSize: 20, color: glowColor, lineHeight: 1, opacity: hasSeraphimInHand ? 0.9 : 0.4, transition: 'opacity 0.2s, color 0.2s', animation: hasSeraphimInHand ? 'constellationGlimmer 3s ease-in-out infinite' : undefined }}>笨ｦ</div>
              <div style={{ fontSize: 7, color: glowColor, marginTop: 7, letterSpacing: 1.8, textTransform: 'uppercase', textAlign: 'center', opacity: hasSeraphimInHand ? 0.85 : 0.4, transition: 'opacity 0.2s, color 0.2s' }}>
                {pendingAngelSummon ? 'Choose Angel Slot' : isDragTarget ? 'Drop Seraphim' : hasSeraphimInHand ? 'Click or Drop' : 'Empty'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Set Ability hotkey strip 窶・shows during playing phase */}
      <SetAbilityStrip />

      {/* Zone separator with rank labels */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        gap: 10,
        marginTop: 'clamp(6px, 1vh, 12px)',
        marginBottom: 2,
        pointerEvents: 'none',
        animation: 'boardZoneEntrance 0.5s ease both',
      }}>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(244,244,248,0.22))' }} />
        <div style={{ fontSize: 8, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(244,244,248,0.55)', fontFamily: BODY_FONT, whiteSpace: 'nowrap' }}>Front Rank</div>
        <div style={{ flex: 2, height: 1, background: 'rgba(244,244,248,0.1)', boxShadow: '0 0 8px rgba(244,244,248,0.06)' }} />
        <div style={{ fontSize: 8, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(200,160,255,0.65)', fontFamily: BODY_FONT, whiteSpace: 'nowrap' }}>Support</div>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(244,244,248,0.22), transparent)' }} />
      </div>

      {/* Back row: 4 Cherubim slots, staggered between front slots */}
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
            const isReadyToFlip = isSoph && charge >= 5;
            const isSelected = newActionSlot?.zone === 'back' && newActionSlot.index === backSlot;
            const isMaterialMode = !!asaSummonRequest;
            const isMaterialSelected = isMaterialMode && selectedMaterialIds.includes(mainCard.instanceId);
            const mainText = mainDef ? getCardPreviewText(mainDef, 2) : '';
            const mainDescMetrics = getAdaptiveDescriptionMetrics('boardMini', mainText);
            const mainElementColor = SET_ACCENT;
            const scalingCtx = {
              limitlessLightStacks: turn.limitlessLightStacks,
              asaFrontCount: board.frontSlots.filter(front => front?.type === 'AinSophAur').length,
              collectionPower: 0,
            };

            let ainCooldown = 0;
            let sophCooldown = 0;
            let ainPreview = 0;
            let sophPreview = 0;
            let darkCooldown = 0;
            let darkCost = 0;
            if (mainDef?.type === 'Light' && isAin) {
              ainCooldown = mainCard.attackCooldowns[mainDef.ainAttack.id] ?? 0;
              sophCooldown = mainCard.attackCooldowns[mainDef.sophAttack.id] ?? 0;
              ainPreview = Math.max(0, Math.round(mainDef.ainAttack.baseOblivion + resolveCardScaling(mainDef.ainAttack.scaling, scalingCtx)));
              const sophCost = mainDef.sophAttack.stackCost ? previewStackCost(mainDef.sophAttack.stackCost, turn.limitlessLightStacks) : 0;
              sophPreview = Math.max(0, Math.round(mainDef.sophAttack.baseOblivion + resolveCardScaling(mainDef.sophAttack.scaling, scalingCtx) + sophCost));
            }
            if (mainDef?.type === 'Dark' && isAin) {
              darkCooldown = mainDef.persistent ? (mainCard.attackCooldowns[`${mainDef.definitionId}:activation`] ?? 0) : 0;
              darkCost = previewStackCost(mainDef.activationCost, turn.limitlessLightStacks);
            }

            return (
              <div
                key={backSlot}
                className={(mainCard.finish === 'holo' || mainDef?.rarity === 'Infinite' || mainDef?.rarity === 'Eternal')
                  ? `holofoil-live-card${mainDef?.rarity === 'Infinite' ? ' holofoil-live-card--infinite' : ''}${mainDef?.rarity === 'Eternal' ? ' holofoil-live-card--eternal' : ''}`
                  : undefined}
                style={{
                  width: CHERUBIM_W, height: CHERUBIM_H,
                  ...getCardFaceBackgroundStyle(mainDef, mainCard.finish, mainCard.faceState),
                  border: `1px solid ${isMaterialSelected ? 'rgba(120,220,140,0.9)' : isReadyToFlip ? 'rgba(255,224,140,0.9)' : 'rgba(160,160,200,0.4)'}`,
                  borderRadius: 12,
                  boxShadow: isReadyToFlip
                    ? `${warmTheme.glow}, 0 0 18px rgba(255,214,120,0.4)`
                    : `${warmTheme.shadow}, ${cardFacePalette.shadow}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start',
                  fontFamily: BODY_FONT, pointerEvents: 'auto', cursor: 'pointer',
                  padding: 0, overflow: 'hidden', position: 'relative',
                }}
                onClick={() => {
                  if (isMaterialMode && asaSummonRequest) {
                    setSelectedMaterialIds(prev => prev.includes(mainCard.instanceId)
                      ? prev.filter(id => id !== mainCard.instanceId)
                      : (prev.length < asaSummonRequest.required ? [...prev, mainCard.instanceId] : prev));
                    return;
                  }
                  setNewActionSlot(prev => (prev?.zone === 'back' && prev.index === backSlot) ? null : { zone: 'back', index: backSlot });
                }}
                onMouseEnter={() => setHoveredBackSlot(backSlot)}
                onMouseLeave={() => setHoveredBackSlot(current => (current === backSlot ? null : current))}
                title={`${mainDef?.name ?? mainCard.type} ﾂｷ ${isSoph ? `Charge ${charge}/5` : 'Active'}`}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${mainElementColor}cc, ${mainElementColor}, ${mainElementColor}cc, transparent)`, pointerEvents: 'none', zIndex: 10 }} />
                <div style={getCardNameRibbonStyle('boardMini')}>
                  <div style={{ fontSize: CHERUBIM_FACE_METRICS.typeSize, color: cardFacePalette.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', textAlign: 'center' }}>
                    {getDisplayCardTypeLabel(mainDef?.type ?? mainCard.type)} ﾂｷ {isSoph ? 'Soph' : 'Ain'}
                  </div>
                  <div style={{ fontSize: CHERUBIM_FACE_METRICS.nameSize, fontWeight: 'bold', color: cardFacePalette.text, textAlign: 'center', lineHeight: 1.25, marginTop: 2 }}>
                    {mainDef?.name ?? mainCard.definitionId}
                  </div>
                </div>
                <div style={getCardRulesPanelStyle('boardMini')}>
                  <div style={{ fontSize: CHERUBIM_FACE_METRICS.descSize, color: isReadyToFlip ? warmTheme.success : cardFacePalette.textMuted, letterSpacing: 0.4, textAlign: 'center' }}>
                    {isSoph
                      ? (isReadyToFlip ? 'Ready 窶・click to flip/sacrifice' : `Charge ${charge}/5`)
                      : mainDef?.type === 'Light'
                        ? `Ain ${ainCooldown <= 0 ? 'Ready' : ainCooldown} ﾂｷ Soph ${sophCooldown <= 0 ? 'Ready' : sophCooldown}`
                        : mainDef?.persistent
                          ? `Recharge ${darkCooldown <= 0 ? 'Ready' : darkCooldown}`
                          : 'One-shot activation'}
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
                {charge > 0 && renderPatienceBadge(charge)}
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
                        >Sacrifice (+{Math.round(charge * (mainDef?.sacrificeOblivionRate ?? 0))} Divine Light)</button>
                      </>
                    )}
                    {isSoph && !isReadyToFlip && (
                      <div style={{ fontSize: 9, color: 'rgba(220,220,240,0.8)', textAlign: 'center' }}>
                        Needs {5 - charge} more card play{5 - charge !== 1 ? 's' : ''} to ready.
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
                          disabled={sophCooldown > 0 || turn.limitlessLightStacks <= 0}
                          onClick={(e) => { e.stopPropagation(); activateLightSophAttack(mainCard.instanceId); setNewActionSlot(null); }}
                          style={actionBtnStyle('rgba(160,200,255,0.6)', 'rgba(14,30,60,0.85)', '#a0c8ff', sophCooldown > 0 || turn.limitlessLightStacks <= 0)}
                        >Soph Attack (~{sophPreview})</button>
                      </>
                    )}
                    {isAin && mainDef?.type === 'Dark' && (
                      <button
                        type="button"
                        disabled={darkCooldown > 0 || turn.limitlessLightStacks < darkCost}
                        onClick={(e) => { e.stopPropagation(); activateDark(mainCard.instanceId); setNewActionSlot(null); }}
                        style={actionBtnStyle('rgba(200,160,255,0.6)', 'rgba(30,14,50,0.85)', '#c8a0ff', darkCooldown > 0 || turn.limitlessLightStacks < darkCost)}
                      >Activate (-{darkCost} Stacks)</button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setNewActionSlot(null); }}
                      style={actionBtnStyle('rgba(150,150,150,0.5)', 'rgba(30,30,30,0.8)', '#ccc')}
                    >Cancel</button>
                  </div>
                )}
              </div>
            );
          }

          // Empty back slot ? accepts Cherubim drops
          const hasAction = canPlay && hasCherubimInHand;
          const cherubimGlow = isDragTarget
            ? 'rgba(200,160,255,0.95)'
            : hasCherubimInHand ? 'rgba(200,160,255,0.6)' : 'rgba(200,160,255,0.18)';
          return (
            <div
              key={backSlot}
              style={{
                width: CHERUBIM_W, height: CHERUBIM_H,
                border: isDragTarget ? '2px solid rgba(200,160,255,0.9)' : `1px solid rgba(200,160,255,${hasCherubimInHand ? '0.48' : '0.28'})`,
                borderRadius: 12,
                background: isDragTarget
                  ? 'rgba(160,120,255,0.12)'
                  : 'linear-gradient(180deg, rgba(200,160,255,0.1) 0%, rgba(200,160,255,0.04) 100%)',
                backdropFilter: 'blur(3px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: hasAction ? 'pointer' : 'default', pointerEvents: 'auto',
                fontFamily: BODY_FONT, transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
                boxShadow: isDragTarget
                  ? `0 0 0 2px rgba(200,160,255,0.45), 0 0 22px rgba(200,160,255,0.18)`
                  : hasCherubimInHand
                    ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px rgba(200,160,255,0.08)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.03)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={() => handleBackSlotClick(backSlot)}
              onDragOver={(e) => {
                if (!canPlay || !e.dataTransfer.types.includes('application/x-cherubim-card')) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverBack(backSlot);
              }}
              onDragLeave={() => setDragOverBack(null)}
              onDrop={() => {
                setDragOverBack(null);
              }}
            >
              {/* Corner accent marks */}
              <div style={{ position: 'absolute', top: 5, left: 5, width: 8, height: 8, borderTop: `1px solid ${cherubimGlow}`, borderLeft: `1px solid ${cherubimGlow}`, borderRadius: 1, pointerEvents: 'none', transition: 'border-color 0.2s' }} />
              <div style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderTop: `1px solid ${cherubimGlow}`, borderRight: `1px solid ${cherubimGlow}`, borderRadius: 1, pointerEvents: 'none', transition: 'border-color 0.2s' }} />
              <div style={{ position: 'absolute', bottom: 5, left: 5, width: 8, height: 8, borderBottom: `1px solid ${cherubimGlow}`, borderLeft: `1px solid ${cherubimGlow}`, borderRadius: 1, pointerEvents: 'none', transition: 'border-color 0.2s' }} />
              <div style={{ position: 'absolute', bottom: 5, right: 5, width: 8, height: 8, borderBottom: `1px solid ${cherubimGlow}`, borderRight: `1px solid ${cherubimGlow}`, borderRadius: 1, pointerEvents: 'none', transition: 'border-color 0.2s' }} />
              <div style={{ fontSize: 15, color: cherubimGlow, lineHeight: 1, opacity: hasCherubimInHand ? 0.85 : 0.38, transition: 'opacity 0.2s, color 0.2s', animation: hasCherubimInHand ? 'constellationGlimmer 3.5s ease-in-out infinite' : undefined }}>笨ｦ</div>
              <div style={{ fontSize: 6, color: cherubimGlow, marginTop: 5, letterSpacing: 1.5, textTransform: 'uppercase', opacity: hasCherubimInHand ? 0.8 : 0.38, transition: 'opacity 0.2s, color 0.2s' }}>
                {isDragTarget ? 'Drop Cherubim' : hasCherubimInHand ? 'Click or Drop' : 'Empty'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
