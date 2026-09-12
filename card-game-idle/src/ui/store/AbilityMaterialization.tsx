import { ABILITY_DEFINITIONS, meetsAbilityOwnershipGate } from '@/data/abilities/abilityDefinitions';
import { useStore } from '@/state/store';
import { uiTypography } from '@/ui/theme';

const EMPTY_OWNED_ABILITIES: Readonly<Record<string, boolean>> = Object.freeze({});
const abilityIconUrl = (key: string) => `${import.meta.env.BASE_URL}assets/ability-icons/${key}.png`;

export default function AbilityMaterialization() {
  const oblivion = useStore(state => state.progress.oblivion);
  const ownedAbilities = useStore(state => state.progress.ownedAbilities ?? EMPTY_OWNED_ABILITIES);
  const collection = useStore(state => state.progress.collection);
  const infiniteCollection = useStore(state => state.progress.infiniteCollection);
  const purchaseAbility = useStore(state => state.purchaseAbility);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '22px clamp(16px, 4vw, 48px) 32px', color: '#c8dff2', fontFamily: uiTypography.body }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ fontFamily: uiTypography.display, fontSize: 24, color: '#d8f0ff', letterSpacing: 1 }}>Ability Materialization</div>
        <div style={{ marginTop: 6, color: 'rgba(200,223,242,0.7)', fontSize: 12, lineHeight: 1.5 }}>
          Materialize universal abilities with Divine Light. Purchase costs scale from 25,000 for foundational abilities to 450,000 for endgame abilities; each ability can be purchased once and equipped in a three-slot deck loadout.
        </div>
        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {ABILITY_DEFINITIONS.map(ability => {
            const owned = ownedAbilities[ability.id] === true;
            const affordable = oblivion >= ability.purchaseCost;
            const gateMet = meetsAbilityOwnershipGate(ability, collection, infiniteCollection);
            return (
              <article key={ability.id} style={{ minHeight: 190, padding: 18, borderRadius: 10, border: `1px solid ${owned ? 'rgba(120,220,140,0.72)' : 'rgba(110,185,240,0.3)'}`, background: owned ? 'rgba(60,150,90,0.12)' : 'rgba(18,38,62,0.72)', boxShadow: owned ? '0 0 20px rgba(120,220,140,0.12)' : '0 10px 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: owned ? '#9be8a8' : '#7dd4f8', fontFamily: uiTypography.display, fontSize: 17, letterSpacing: 0.6 }}><img src={abilityIconUrl(ability.iconAssetKey)} alt="" aria-hidden="true" width={42} height={42} style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 7 }} />{ability.name}</div>
                <div style={{ marginTop: 10, color: 'rgba(216,240,255,0.78)', fontSize: 11, lineHeight: 1.55, flex: 1 }}>{ability.description}</div>
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ color: '#f7c04a', fontSize: 11 }}>{ability.purchaseCost.toLocaleString()} Divine Light</span>
                  <button type="button" disabled={owned || !affordable || !gateMet} onClick={() => purchaseAbility(ability.id)} style={{ padding: '7px 10px', borderRadius: 6, border: `1px solid ${owned ? 'rgba(120,220,140,0.5)' : 'rgba(110,185,240,0.58)'}`, background: owned ? 'rgba(120,220,140,0.12)' : 'rgba(78,160,220,0.18)', color: owned ? '#9be8a8' : '#d8f0ff', cursor: owned || !affordable || !gateMet ? 'not-allowed' : 'pointer', opacity: !owned && (!affordable || !gateMet) ? 0.45 : 1, fontFamily: uiTypography.body, fontSize: 10 }}>
                    {owned ? 'Owned' : !gateMet ? 'Requires set card' : affordable ? 'Materialize' : 'Insufficient'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
