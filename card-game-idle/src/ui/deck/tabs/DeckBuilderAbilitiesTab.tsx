import { useMemo } from 'react';
import { NEUTRALITY_SET } from '@/systems/sets/neutrality/NeutralityAbilities';
import { resolveAbilityOptionsForDeck } from '@/systems/sets/SetEngine';
import type { DeckEntry, ExtraDeckEntry, SavedDeck } from '@/types/game';

interface Props {
  deckList: DeckEntry[];
  extraDeckList: ExtraDeckEntry[];
  activeDeck: SavedDeck | null;
  setDeckAbilityLoadout: (deckId: string, slot: 1 | 2 | 3, abilityId: string) => void;
}

export default function DeckBuilderAbilitiesTab({
  deckList,
  extraDeckList,
  activeDeck,
  setDeckAbilityLoadout,
}: Props) {
  const abilityOptions = useMemo(
    () => resolveAbilityOptionsForDeck(NEUTRALITY_SET.id, deckList, extraDeckList),
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

      {NEUTRALITY_SET.abilities.filter(ability => !ability.signatureOwnerId).map(ability => {
        const color = '#7dd4f8';
        const options = abilityOptions[ability.slot] ?? [ability];
        const selectedId = activeDeck?.abilityLoadout?.[ability.slot];
        const selectedAbility = options.find(option => option.id === selectedId) ?? ability;

        return (
          <div
            key={ability.id}
            style={{
              padding: '14px 16px', borderRadius: 10,
              border: `1px solid ${color}55`,
              background: `linear-gradient(135deg, rgba(5,10,20,0.92) 0%, ${color}08 100%)`,
              opacity: 1,
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: color,
                color: '#04090e',
                fontWeight: 'bold', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {ability.slot}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 13, fontWeight: 'bold', lineHeight: 1,
                  color: '#e8f4ff',
                }}>
                  {selectedAbility?.label ?? ability.label}
                </div>
                <div style={{
                  fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 3,
                  color,
                }}>
                  Always unlocked · {' '}
                  {ability.cooldownCards > 0 ? `${ability.cooldownCards}-card cooldown` : 'once per run'}
                </div>
              </div>
              {activeDeck ? (
                <select
                  style={{
                    padding: '4px 8px', borderRadius: 6, fontSize: 10,
                    border: `1px solid ${color}70`,
                    background: 'rgba(8,10,16,0.88)', color,
                    cursor: 'pointer', fontFamily: 'Georgia, serif', letterSpacing: 0.3,
                  }}
                  value={selectedAbility?.id ?? ability.id}
                  onChange={event => setDeckAbilityLoadout(activeDeck.id, ability.slot, event.target.value)}
                >
                  {options.map(option => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              ) : null}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(200,225,245,0.72)', lineHeight: 1.5, paddingLeft: 38 }}>
              {selectedAbility?.description ?? ability.description}
            </div>
            {options.length > 1 && (
              <div style={{ fontSize: 9, color: 'rgba(220,220,220,0.58)', marginTop: 7, paddingLeft: 38 }}>
                {options.length - 1} Angel signature{options.length === 2 ? '' : 's'} unlocked for this slot.
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
