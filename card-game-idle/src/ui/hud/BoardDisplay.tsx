import { useState, useEffect, useRef } from 'react';
import { useStore, selectBoard, selectCanEmbraceInfinite, selectTurn } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { warmTheme } from '@/ui/theme';
import type { ChaosInstance } from '@/types/cards';

const RARITY_BORDER: Record<string, string> = {
  Common:    'rgba(180,180,180,0.75)',
  Rare:      'rgba(91,155,213,0.95)',
  Epic:      'rgba(185,100,220,0.95)',
  Legendary: 'rgba(243,156,18,1.0)',
};

const RARITY_GLOW: Record<string, string> = {
  Common:    'rgba(180,180,180,0.4)',
  Rare:      'rgba(91,155,213,0.5)',
  Epic:      'rgba(185,100,220,0.5)',
  Legendary: 'rgba(243,156,18,0.6)',
};

const RARITY_GLOW_PEAK: Record<string, string> = {
  Common:    'rgba(180,180,180,0.7)',
  Rare:      'rgba(91,155,213,0.85)',
  Epic:      'rgba(185,100,220,0.85)',
  Legendary: 'rgba(243,156,18,0.95)',
};

const SLOT_W = 102;
const SLOT_H = 144;
const CHAOS_W = 90;
const CHAOS_H = 70;

export default function BoardDisplay() {
  const board = useStore(selectBoard);
  const canEmbraceInfinite = useStore(selectCanEmbraceInfinite);
  const turn = useStore(selectTurn);
  const hand = useStore(s => s.deck.hand);
  const { removeSeraphim, placeSeraphimFromHand, placeChaos, removeChaos, playCard, embraceInfinite } = useStore.getState();

  const hasSeraphimInHand = hand.some(c => CardRegistry.get(c.definitionId)?.type === 'Seraphim');
  const hasChaosInHand = hand.some(c => CardRegistry.get(c.definitionId)?.type === 'Chaos');
  const canPlay = turn.phase === 'playing';

  const prevSlotsRef = useRef(board.frontSlots);
  const [lastPlacedInstanceId, setLastPlacedInstanceId] = useState<string | null>(null);
  const [dragOverFront, setDragOverFront] = useState<number | null>(null);
  const [dragOverBack, setDragOverBack] = useState<number | null>(null);

  useEffect(() => {
    const prev = prevSlotsRef.current;
    const curr = board.frontSlots;
    for (let i = 0; i < 5; i++) {
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

  function handleFrontSlotClick(slotIndex: 0 | 1 | 2 | 3 | 4) {
    const slot = board.frontSlots[slotIndex];
    if (slot?.type === 'Seraphim') {
      removeSeraphim(slotIndex);
    } else if (!slot && canPlay && hasSeraphimInHand) {
      placeSeraphimFromHand(slotIndex);
    }
  }

  function handleBackSlotClick(backSlot: 0 | 1 | 2 | 3) {
    const chaos = board.backSlots[backSlot];
    if (chaos) {
      removeChaos(backSlot);
    } else if (canPlay && hasChaosInHand) {
      const chaosCard = hand.find(c => CardRegistry.get(c.definitionId)?.type === 'Chaos');
      if (chaosCard) {
        const firstEmpty = board.backSlots.findIndex(s => s === null);
        if (firstEmpty === backSlot) {
          playCard(chaosCard.instanceId);
        } else {
          placeChaos(backSlot);
        }
      }
    }
  }

  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      top: '40%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0,
    }}>
      {canEmbraceInfinite && (
        <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, pointerEvents: 'auto' }}>
          <button
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
              fontFamily: 'Georgia, serif',
              cursor: 'pointer',
              boxShadow: '0 10px 24px rgba(191,126,63,0.18)',
            }}
          >
            Embrace the Infinite
          </button>
          <div style={{ fontSize: 10, color: 'rgba(107,63,24,0.74)', letterSpacing: 0.4 }}>
            Gain 50 Oblivion per card, keep 3, reshuffle the rest.
          </div>
        </div>
      )}

      {/* Front row: 5 Seraphim/Angel slots */}
      <div style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {board.frontSlots.map((slot, i) => {
          const slotIndex = i as 0 | 1 | 2 | 3 | 4;
          const isNewlyPlaced = slot?.instanceId === lastPlacedInstanceId;
          const isDragTarget = dragOverFront === slotIndex && !slot && canPlay;

          if (slot?.type === 'Angel') {
            const angelDef = CardRegistry.get(slot.definitionId);
            return (
              <div
                key={slotIndex}
                className="anim-angel-breath"
                style={{
                  width: SLOT_W,
                  height: SLOT_H,
                    background: warmTheme.surfaceStrong,
                    border: `2px solid ${warmTheme.borderStrong}`,
                    borderRadius: 14,
                    boxShadow: warmTheme.shadow,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 6px',
                  fontFamily: 'Georgia, serif',
                  cursor: 'default',
                  pointerEvents: 'auto',
                }}
              >
                <div style={{ fontSize: 7, color: warmTheme.textMuted, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' }}>
                  Angel
                </div>
                <div style={{ fontSize: 22, color: warmTheme.accent, marginBottom: 6 }}>✦</div>
                <div style={{ fontSize: 10, fontWeight: 'bold', color: warmTheme.accentDeep, textAlign: 'center', lineHeight: 1.3 }}>
                  {angelDef?.name ?? 'Angel'}
                </div>
              </div>
            );
          }

          if (slot?.type === 'Seraphim') {
            const serDef = CardRegistry.get(slot.definitionId);
            const isActive = slot.isActive;
            const rarity = serDef?.rarity ?? 'Common';
            const borderColor = isActive ? 'rgba(255,215,0,0.95)' : RARITY_BORDER[rarity];
            const glowColor = RARITY_GLOW[rarity] ?? 'transparent';
            const glowColorPeak = RARITY_GLOW_PEAK[rarity] ?? 'transparent';

            return (
              <div
                key={slotIndex}
                style={{ width: SLOT_W, height: SLOT_H, pointerEvents: 'auto', cursor: 'pointer' }}
                onClick={() => handleFrontSlotClick(slotIndex)}
                title={`${serDef?.name ?? 'Seraphim'} — click to return to discard`}
              >
                <div
                  className={[
                    isNewlyPlaced ? 'anim-seraphim-pop' : undefined,
                    isActive && !isNewlyPlaced ? 'anim-synergy-pulse' : undefined,
                  ].filter(Boolean).join(' ') || undefined}
                  style={{
                    width: '100%', height: '100%',
                    background: warmTheme.surfaceStrong,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 12,
                    boxShadow: isActive ? `${warmTheme.shadow}, 0 0 18px ${glowColor}` : `0 0 8px ${glowColor}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '6px 4px', fontFamily: 'Georgia, serif', transition: 'box-shadow 0.4s',
                    ['--seraph-glow-base' as string]: `${warmTheme.shadow}, 0 0 18px ${glowColor}`,
                    ['--seraph-glow-peak' as string]: `${warmTheme.shadow}, 0 0 28px ${glowColorPeak}`,
                  }}
                >
                  <div style={{ fontSize: 16, color: isActive ? warmTheme.accent : warmTheme.textMuted, marginBottom: 4, transition: 'filter 0.4s' }}>✦</div>
                  <div style={{ fontSize: 9, fontWeight: 'bold', color: isActive ? warmTheme.accentDeep : warmTheme.textSoft, textAlign: 'center', lineHeight: 1.3 }}>
                    {serDef?.name ?? 'Seraphim'}
                  </div>
                  <div style={{ fontSize: 8, marginTop: 5, letterSpacing: 1, color: isActive ? warmTheme.success : warmTheme.textFaint, textTransform: 'uppercase' }}>
                    {isActive ? 'Synergy' : 'Inactive'}
                  </div>
                  <div style={{ fontSize: 7, color: warmTheme.textFaint, marginTop: 4, letterSpacing: 0.5 }}>tap to remove</div>
                </div>
              </div>
            );
          }

          // Empty front slot — accepts Seraphim drops
          const hasAction = canPlay && hasSeraphimInHand;
          const accentColor = isDragTarget
            ? 'rgba(255,215,0,0.9)'
            : hasSeraphimInHand ? 'rgba(255,215,0,0.55)' : 'rgba(255,215,0,0.2)';
          return (
            <div
              key={slotIndex}
              style={{
                width: SLOT_W, height: SLOT_H,
                border: `${isDragTarget ? '2px' : '1px'} dashed ${accentColor}`,
                borderRadius: 12,
                background: isDragTarget ? 'rgba(213,154,82,0.18)' : hasAction ? warmTheme.surface : 'rgba(246,235,218,0.7)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: hasAction ? 'pointer' : 'default', pointerEvents: 'auto',
                fontFamily: 'Georgia, serif', transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
                boxShadow: isDragTarget ? warmTheme.glow : 'none',
              }}
              onClick={() => handleFrontSlotClick(slotIndex)}
              onDragOver={(e) => {
                if (!canPlay || !e.dataTransfer.types.includes('application/x-seraphim-card')) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverFront(slotIndex);
              }}
              onDragLeave={() => setDragOverFront(null)}
              onDrop={(e) => {
                const id = e.dataTransfer.getData('application/x-seraphim-card');
                if (id && canPlay) placeSeraphimFromHand(slotIndex, id);
                setDragOverFront(null);
              }}
            >
              <div style={{ fontSize: 16, color: accentColor }}>+</div>
              <div style={{ fontSize: 7, color: accentColor, marginTop: 6, letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'center' }}>
                {isDragTarget ? 'Drop Here' : hasSeraphimInHand ? 'Place Seraphim' : 'Slot'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Back row: 4 Chaos slots, staggered between front slots */}
      <div style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        paddingLeft: (SLOT_W + 12) / 2,
      }}>
        {board.backSlots.map((chaos, i) => {
          const backSlot = i as 0 | 1 | 2 | 3;
          const chaosDef = chaos ? CardRegistry.get(chaos.definitionId) : null;
          const isDragTarget = dragOverBack === backSlot && canPlay;

          if (chaos) {
            const durabilityRatio = chaos.durability / (chaos as ChaosInstance).maxDurability;
            const durabilityColor = durabilityRatio > 0.5 ? '#c888f0' : durabilityRatio > 0.25 ? '#e8a040' : '#e86060';
            return (
              <div
                key={backSlot}
                style={{
                  width: CHAOS_W, height: CHAOS_H,
                  background: warmTheme.surfaceStrong,
                  border: `1px solid rgba(143,116,169,0.5)`,
                  borderRadius: 12,
                  boxShadow: warmTheme.shadow,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Georgia, serif', pointerEvents: 'auto', cursor: 'pointer',
                  padding: '6px 4px',
                }}
                onClick={() => handleBackSlotClick(backSlot)}
                title={`${chaosDef?.name ?? 'Chaos'} — ${chaos.durability} play${chaos.durability !== 1 ? 's' : ''} remaining — click to discard`}
              >
                <div style={{ fontSize: 8, color: warmTheme.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>Chaos</div>
                <div style={{ fontSize: 9, fontWeight: 'bold', color: warmTheme.chaos, textAlign: 'center', lineHeight: 1.3 }}>
                  {chaosDef?.name ?? 'Chaos'}
                </div>
                <div style={{ fontSize: 9, color: durabilityColor, marginTop: 4, letterSpacing: 0.5 }}>
                  {chaos.durability} left
                </div>
              </div>
            );
          }

          // Empty back slot — accepts Chaos drops
          const hasAction = canPlay && hasChaosInHand;
          const accentColor = isDragTarget
            ? 'rgba(200,136,240,0.9)'
            : hasChaosInHand ? 'rgba(200,136,240,0.55)' : 'rgba(200,136,240,0.2)';
          return (
            <div
              key={backSlot}
              style={{
                width: CHAOS_W, height: CHAOS_H,
                border: `${isDragTarget ? '2px' : '1px'} dashed ${accentColor}`,
                borderRadius: 12,
                background: isDragTarget ? 'rgba(143,116,169,0.18)' : hasAction ? warmTheme.surface : 'rgba(246,235,218,0.7)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: hasAction ? 'pointer' : 'default', pointerEvents: 'auto',
                fontFamily: 'Georgia, serif', transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
                boxShadow: isDragTarget ? warmTheme.glow : 'none',
              }}
              onClick={() => handleBackSlotClick(backSlot)}
              onDragOver={(e) => {
                if (!canPlay || !e.dataTransfer.types.includes('application/x-chaos-card')) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverBack(backSlot);
              }}
              onDragLeave={() => setDragOverBack(null)}
              onDrop={(e) => {
                const id = e.dataTransfer.getData('application/x-chaos-card');
                if (id && canPlay) placeChaos(backSlot, id);
                setDragOverBack(null);
              }}
            >
              <div style={{ fontSize: 12, color: accentColor }}>+</div>
              <div style={{ fontSize: 7, color: accentColor, marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' }}>
                {isDragTarget ? 'Drop Here' : hasChaosInHand ? 'Place Chaos' : 'Chaos'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
