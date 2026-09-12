import { ABILITY_DEFINITIONS } from '@/data/abilities/abilityDefinitions';
import type { DeckEntry, ExtraDeckEntry, SavedDeck } from '@/types/game';

interface Props {
  deckList: DeckEntry[];
  extraDeckList: ExtraDeckEntry[];
  activeDeck: SavedDeck | null;
  ownedAbilities: Record<string, boolean>;
  setDeckAbilityLoadout: (deckId: string, slot: 1 | 2 | 3, abilityId: string) => void;
}

export default function DeckBuilderAbilitiesTab({ activeDeck, ownedAbilities, setDeckAbilityLoadout }: Props) {
  const owned = ABILITY_DEFINITIONS.filter(ability => ownedAbilities[ability.id]);
  const loadout = activeDeck?.abilityLoadout ?? {};

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1 }}>
      <div style={{ fontSize: 9, letterSpacing: 2.5, color: 'rgba(190,215,245,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>
        Ability Loadout · three slots
      </div>
      {([1, 2, 3] as const).map(slot => {
        const selected = loadout[slot] ?? '';
        const unavailable = new Set(Object.entries(loadout).filter(([key]) => Number(key) !== slot).map(([, id]) => id));
        return (
          <div key={slot} style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(125,212,248,0.34)', background: 'linear-gradient(135deg, rgba(5,10,20,0.92), rgba(125,212,248,0.06))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#7dd4f8', color: '#04090e', fontWeight: 'bold', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{slot}</div>
              <select disabled={!activeDeck} value={selected} onChange={event => setDeckAbilityLoadout(activeDeck!.id, slot, event.target.value)} style={{ flex: 1, padding: '7px 8px', borderRadius: 6, border: '1px solid rgba(125,212,248,0.45)', background: 'rgba(8,10,16,0.88)', color: '#d8f0ff', cursor: activeDeck ? 'pointer' : 'not-allowed', fontFamily: 'Georgia, serif', fontSize: 11 }}>
                <option value="">Empty slot</option>
                {owned.map(ability => <option key={ability.id} value={ability.id} disabled={unavailable.has(ability.id)}>{ability.name}</option>)}
              </select>
            </div>
            <div style={{ marginTop: 9, paddingLeft: 38, color: 'rgba(200,225,245,0.7)', fontSize: 11, lineHeight: 1.5 }}>
              {ABILITY_DEFINITIONS.find(ability => ability.id === selected)?.description ?? 'No ability equipped.'}
            </div>
          </div>
        );
      })}
      {owned.length === 0 && <div style={{ fontSize: 12, color: 'rgba(190,215,245,0.52)', textAlign: 'center', marginTop: 16 }}>Materialize abilities in the Ability Materialization shop first.</div>}
      {!activeDeck && <div style={{ fontSize: 12, color: 'rgba(190,215,245,0.45)', textAlign: 'center', marginTop: 8 }}>Load a saved deck to customize ability slots.</div>}
    </div>
  );
}
