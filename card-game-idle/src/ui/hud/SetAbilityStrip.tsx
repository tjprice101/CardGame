/**
 * SetAbilityStrip — compact in-game HUD strip showing the 4 set ability slots.
 *
 * Shown during an active playing phase. Each tile displays:
 *   - Slot number (matches hotkey)
 *   - Ability label
 *   - Gate badge (Base / Eternal / Infinite / Angel)
 *   - State: ready (bright) | cooldown (dim + count) | exhausted (dark) | locked (gated out)
 *
 * Clicking a tile calls activateSetAbility (same as the hotkey). Hovering shows
 * the full description.
 */

import { useStore } from '@/state/store';
import { resolveActiveAbilitiesForDeck, resolveGatesForDeck } from '@/systems/sets/SetEngine';
import { uiTypography } from '@/ui/theme';
import { NEUTRALITY_SET } from '@/systems/sets/neutrality/NeutralityAbilities';
import { DEFAULT_CONTROL_BINDINGS } from '@/types/game';

const FONT = uiTypography.display;
const SLOTS: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];

const GATE_LABELS: Record<string, string> = {
  base: 'Base',
  eternal: 'Eternal',
  infinite: 'Infinite',
  angel: 'Angel',
};

function hotkeyLabel(code: string): string {
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Key')) return code.slice(3);
  return code;
}

export default function SetAbilityStrip() {
  const turn = useStore(s => s.turn);
  const progress = useStore(s => s.progress);
  const settings = useStore(s => s.settings);
  const activateSetAbility = useStore(s => s.activateSetAbility);

  if (turn.phase !== 'playing') return null;

  const activeDeck = progress.savedDecks.find(d => d.id === progress.activeDeckId);
  if (!activeDeck) return null;

  const controls = { ...DEFAULT_CONTROL_BINDINGS, ...(settings.controls ?? {}) };
  const hotkeyKeys: Record<1 | 2 | 3 | 4, string> = {
    1: hotkeyLabel(controls.activateSetAbility1 ?? 'Digit1'),
    2: hotkeyLabel(controls.activateSetAbility2 ?? 'Digit2'),
    3: hotkeyLabel(controls.activateSetAbility3 ?? 'Digit3'),
    4: hotkeyLabel(controls.activateSetAbility4 ?? 'Digit4'),
  };

  const resolvedAbilities = resolveActiveAbilitiesForDeck(
    NEUTRALITY_SET.id,
    activeDeck.deckList,
    activeDeck.extraDeck,
  );
  const activeGates = resolveGatesForDeck(activeDeck.deckList, activeDeck.extraDeck);

  const cd = turn.setAbilityCooldowns ?? {};
  const uses = turn.setAbilityUsesRemaining ?? {};

  return (
    <div style={{
      display: 'flex',
      gap: 6,
      justifyContent: 'center',
      marginTop: 8,
      marginBottom: 2,
    }}>
      {SLOTS.map(slot => {
        // Find the ability for this slot from the full set definition.
        const abilityDef = NEUTRALITY_SET.abilities.find(a => a.slot === slot)!;
        const isGateMet = activeGates.has(abilityDef.gate);
        const ability = resolvedAbilities[slot];

        const cooldownLeft = ability ? (cd[ability.id] ?? 0) : 0;
        const usesLeft = ability && ability.maxUsesPerRun !== undefined
          ? (ability.id in uses ? uses[ability.id] : ability.maxUsesPerRun)
          : undefined;
        const isExhausted = usesLeft !== undefined && usesLeft <= 0;
        const isOnCooldown = cooldownLeft > 0;
        const isReady = isGateMet && !isOnCooldown && !isExhausted;

        let bg = 'rgba(18, 16, 24, 0.88)';
        let borderColor = 'rgba(120, 100, 160, 0.30)';
        let textColor = 'rgba(180, 165, 210, 0.45)';
        let labelColor = 'rgba(160, 145, 195, 0.45)';
        let hotkeyColor = 'rgba(140, 120, 175, 0.45)';

        if (isReady) {
          bg = 'rgba(28, 22, 48, 0.94)';
          borderColor = 'rgba(180, 150, 255, 0.55)';
          textColor = 'rgba(235, 220, 255, 0.95)';
          labelColor = 'rgba(210, 190, 245, 0.90)';
          hotkeyColor = 'rgba(180, 150, 255, 0.85)';
        } else if (isOnCooldown) {
          bg = 'rgba(22, 18, 38, 0.90)';
          borderColor = 'rgba(140, 110, 200, 0.40)';
          textColor = 'rgba(200, 180, 235, 0.65)';
          labelColor = 'rgba(185, 165, 220, 0.60)';
          hotkeyColor = 'rgba(160, 130, 210, 0.60)';
        }

        const tooltipLines = [
          abilityDef.label,
          '',
          abilityDef.description,
          '',
          `Gate: ${GATE_LABELS[abilityDef.gate] ?? abilityDef.gate}`,
          abilityDef.cooldownCards > 0 ? `Cooldown: ${abilityDef.cooldownCards} hand plays` : '',
          abilityDef.maxUsesPerRun !== undefined ? `Uses per run: ${abilityDef.maxUsesPerRun}` : '',
          !isGateMet ? `⚠ Requires an ${GATE_LABELS[abilityDef.gate]} card in your deck.` : '',
          isExhausted ? '✕ Already used this run.' : '',
          isOnCooldown ? `⏳ On cooldown: ${cooldownLeft} play${cooldownLeft === 1 ? '' : 's'} remaining.` : '',
        ].filter(Boolean).join('\n');

        return (
          <button
            key={slot}
            title={tooltipLines}
            onClick={() => activateSetAbility(slot)}
            disabled={!isReady}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '5px 8px',
              minWidth: 62,
              borderRadius: 8,
              border: `1px solid ${borderColor}`,
              background: bg,
              cursor: isReady ? 'pointer' : 'default',
              boxShadow: isReady ? '0 2px 10px rgba(160,120,255,0.18)' : 'none',
              transition: 'border-color 0.15s, background 0.15s',
              pointerEvents: 'all',
            }}
          >
            {/* Hotkey badge */}
            <div style={{
              fontSize: 8,
              fontFamily: FONT,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: hotkeyColor,
              lineHeight: 1,
            }}>
              [{hotkeyKeys[slot]}]
            </div>

            {/* Ability label */}
            <div style={{
              fontSize: 8.5,
              fontFamily: FONT,
              fontWeight: 700,
              color: textColor,
              letterSpacing: 0.3,
              textAlign: 'center',
              lineHeight: 1.2,
              maxWidth: 60,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {abilityDef.label}
            </div>

            {/* State indicator */}
            <div style={{
              fontSize: 7.5,
              fontFamily: FONT,
              color: labelColor,
              letterSpacing: 0.5,
              lineHeight: 1,
              marginTop: 1,
            }}>
              {!isGateMet
                ? GATE_LABELS[abilityDef.gate]
                : isExhausted
                  ? 'Used'
                  : isOnCooldown
                    ? `${cooldownLeft}cd`
                    : 'Ready'}
            </div>
          </button>
        );
      })}
    </div>
  );
}
