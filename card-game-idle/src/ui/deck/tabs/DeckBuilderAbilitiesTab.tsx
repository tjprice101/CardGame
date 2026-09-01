import { useMemo } from 'react';
import { NEUTRALITY_SET } from '@/systems/sets/neutrality/NeutralityAbilities';
import { resolveGatesForDeck } from '@/systems/sets/SetEngine';
import type { SetAbilityGate } from '@/systems/sets/SetEngine';
import type { DeckEntry, ExtraDeckEntry, SavedDeck } from '@/types/game';

const GATE_LABELS: Record<SetAbilityGate, string> = {
  base: 'Base', eternal: 'Eternal', infinite: 'Infinite', 'transcendent-angel': 'Transcendent Angel',
};
const GATE_COLORS: Record<SetAbilityGate, string> = {
  base: '#7dd4f8', eternal: '#ff8888', infinite: '#c8c8e8', 'transcendent-angel': '#70c890',
};
const GATE_HINTS: Record<SetAbilityGate, string> = {
  base: 'any card in your deck',
  eternal: 'an Eternal card in your main deck',
  infinite: 'an Infinite card in your main deck',
  'transcendent-angel': 'a Transcendent Angel in your extra deck AND on your board',
};

interface Props {
  deckList: DeckEntry[];
  extraDeckList: ExtraDeckEntry[];
  activeDeck: SavedDeck | null;
  setDeckAbilityLoadout: (deckId: string, slot: 1 | 2 | 3 | 4, abilityId: string) => void;
}

export default function DeckBuilderAbilitiesTab({
  deckList,
  extraDeckList,
  activeDeck,
  setDeckAbilityLoadout,
}: Props) {
  const gates = useMemo(
    () => resolveGatesForDeck(deckList, extraDeckList),
    [deckList, extraDeckList],
  );

  return (
    <div style={{
      padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12,
      overflowY: 'auto', flex: 1,
    }}>
      <div style={{
        fontSize: 9, letterSpacing: 2.5, color: 'rgba(190,215,245,0.50)',
        textTransform: 'uppercase', marginBottom: 4,
      }}>
        Set Ability Loadout — Neutrality
      </div>

      {NEUTRALITY_SET.abilities.map(ability => {
        const gateMet = gates.has(ability.gate);
        const color = GATE_COLORS[ability.gate];
        // Empty string = explicitly disabled; undefined = default (active when gate met)
        const explicit = activeDeck?.abilityLoadout?.[ability.slot];
        const isDisabled = explicit === '';
        const isActive = gateMet && !isDisabled;

        return (
          <div
            key={ability.id}
            style={{
              padding: '14px 16px', borderRadius: 10,
              border: `1px solid ${isActive ? color + '55' : 'rgba(72,128,190,0.22)'}`,
              background: isActive
                ? `linear-gradient(135deg, rgba(5,10,20,0.92) 0%, ${color}08 100%)`
                : 'rgba(3,6,14,0.7)',
              opacity: gateMet ? 1 : 0.5,
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: isActive ? color : 'rgba(72,128,190,0.14)',
                color: isActive ? '#04090e' : 'rgba(200,220,245,0.38)',
                fontWeight: 'bold', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {ability.slot}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 13, fontWeight: 'bold', lineHeight: 1,
                  color: isActive ? '#e8f4ff' : 'rgba(200,220,245,0.48)',
                }}>
                  {ability.label}
                </div>
                <div style={{
                  fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 3,
                  color: gateMet ? color : 'rgba(210,160,80,0.65)',
                }}>
                  {GATE_LABELS[ability.gate]} Gate
                  {' · '}
                  {ability.cooldownCards > 0 ? `${ability.cooldownCards}-card cooldown` : 'once per run'}
                </div>
              </div>
              {gateMet && activeDeck ? (
                <button
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 10,
                    border: `1px solid ${isActive ? color + '70' : 'rgba(72,128,190,0.30)'}`,
                    background: isActive ? color + '1a' : 'rgba(72,128,190,0.07)',
                    color: isActive ? color : 'rgba(190,215,245,0.48)',
                    cursor: 'pointer', fontFamily: 'Georgia, serif', letterSpacing: 0.5,
                    transition: 'all 0.15s',
                  }}
                  onClick={() => setDeckAbilityLoadout(
                    activeDeck.id, ability.slot, isDisabled ? ability.id : '',
                  )}
                >
                  {isActive ? 'Active' : 'Disabled'}
                </button>
              ) : (
                <div style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 10,
                  border: '1px solid rgba(150,100,60,0.28)',
                  background: 'rgba(150,100,60,0.07)',
                  color: 'rgba(210,160,80,0.55)',
                  fontFamily: 'Georgia, serif', letterSpacing: 0.5,
                }}>
                  Locked
                </div>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(200,225,245,0.72)', lineHeight: 1.5, paddingLeft: 38 }}>
              {ability.description}
            </div>
            {!gateMet && (
              <div style={{ fontSize: 10, color: 'rgba(210,160,80,0.68)', marginTop: 6, paddingLeft: 38, fontStyle: 'italic' }}>
                Requires {GATE_HINTS[ability.gate]}.
              </div>
            )}
          </div>
        );
      })}

      {!activeDeck && (
        <div style={{ fontSize: 12, color: 'rgba(190,215,245,0.45)', textAlign: 'center', marginTop: 16, fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
          Load a saved deck to customise ability slots.
        </div>
      )}
    </div>
  );
}
