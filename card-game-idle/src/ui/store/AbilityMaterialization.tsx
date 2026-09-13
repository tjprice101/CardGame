import { useMemo, useState } from 'react';
import { ABILITY_DEFINITIONS, meetsAbilityOwnershipGate, type AbilityDefinition } from '@/data/abilities/abilityDefinitions';
import { useStore } from '@/state/store';
import { uiTypography } from '@/ui/theme';

const EMPTY_OWNED_ABILITIES: Readonly<Record<string, boolean>> = Object.freeze({});
const abilityIconUrl = (key: string) => `${import.meta.env.BASE_URL}assets/ability-icons/${key}.png`;

type SetFilter = 'all' | 'Neutrality';
type TierFilter = 'all' | 'foundational' | 'eternal' | 'infinite';
type TypeFilter = 'all' | 'buff' | 'instant' | 'summon' | 'utility';
type OwnershipFilter = 'all' | 'unowned' | 'owned';
type SortOption = 'cost-asc' | 'cost-desc' | 'name-asc' | 'tier';

function getAbilityTier(ability: AbilityDefinition): 'foundational' | 'eternal' | 'infinite' {
  if (ability.ownershipGate === 'anyNeutralityInfinite' || ability.purchaseCost >= 400_000) return 'infinite';
  if (ability.ownershipGate === 'anyNeutralityEternal' || ability.purchaseCost >= 90_000) return 'eternal';
  return 'foundational';
}

function getAbilityType(ability: AbilityDefinition): 'buff' | 'instant' | 'summon' | 'utility' {
  if (ability.buff) return 'buff';
  if (ability.id === 'phantom-matrix') return 'summon';
  if (ability.id === 'null-horizon') return 'utility';
  return 'instant';
}

function getGateRequirementLabel(gate?: 'anyNeutralityEternal' | 'anyNeutralityInfinite'): string | null {
  if (gate === 'anyNeutralityEternal') return 'Requires Eternal Neutrality card';
  if (gate === 'anyNeutralityInfinite') return 'Requires Infinite Neutrality card';
  return null;
}

export default function AbilityMaterialization() {
  const oblivion = useStore(state => state.progress.oblivion);
  const ownedAbilities = useStore(state => state.progress.ownedAbilities ?? EMPTY_OWNED_ABILITIES);
  const collection = useStore(state => state.progress.collection);
  const infiniteCollection = useStore(state => state.progress.infiniteCollection);
  const purchaseAbility = useStore(state => state.purchaseAbility);

  const [selectedSet, setSelectedSet] = useState<SetFilter>('Neutrality');
  const [selectedTier, setSelectedTier] = useState<TierFilter>('all');
  const [selectedType, setSelectedType] = useState<TypeFilter>('all');
  const [selectedOwnership, setSelectedOwnership] = useState<OwnershipFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('cost-asc');

  const filteredAbilities = useMemo(() => {
    return ABILITY_DEFINITIONS.filter(ability => {
      // Set filter
      if (selectedSet !== 'all' && ability.setId !== selectedSet) return false;

      // Tier filter
      const tier = getAbilityTier(ability);
      if (selectedTier !== 'all' && tier !== selectedTier) return false;

      // Type filter
      const type = getAbilityType(ability);
      if (selectedType !== 'all' && type !== selectedType) return false;

      // Ownership filter
      const isOwned = ownedAbilities[ability.id] === true;
      if (selectedOwnership === 'owned' && !isOwned) return false;
      if (selectedOwnership === 'unowned' && isOwned) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = ability.name.toLowerCase().includes(query);
        const matchDesc = ability.description.toLowerCase().includes(query);
        if (!matchName && !matchDesc) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'cost-asc') return a.purchaseCost - b.purchaseCost;
      if (sortBy === 'cost-desc') return b.purchaseCost - a.purchaseCost;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'tier') {
        const tierRank = { foundational: 1, eternal: 2, infinite: 3 };
        return tierRank[getAbilityTier(a)] - tierRank[getAbilityTier(b)];
      }
      return 0;
    });
  }, [selectedSet, selectedTier, selectedType, selectedOwnership, searchQuery, sortBy, ownedAbilities]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '22px clamp(16px, 4vw, 48px) 32px', color: '#c8dff2', fontFamily: uiTypography.body }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: uiTypography.display, fontSize: 24, color: '#d8f0ff', letterSpacing: 1 }}>Ability Materialization</div>
            <div style={{ marginTop: 4, color: 'rgba(200,223,242,0.7)', fontSize: 12, lineHeight: 1.5 }}>
              Materialize universal abilities with Divine Light. Purchase costs scale from foundational to endgame; equipped abilities are universal across all decks.
            </div>
          </div>
        </div>

        {/* Primary Set Sub-menu */}
        <div style={{ marginTop: 18, display: 'flex', gap: 8, borderBottom: '1px solid rgba(110,185,240,0.22)', paddingBottom: 10 }}>
          {(['Neutrality', 'all'] as const).map(setName => (
            <button
              key={setName}
              type="button"
              onClick={() => setSelectedSet(setName)}
              style={{
                padding: '6px 16px',
                borderRadius: 7,
                border: selectedSet === setName ? '1px solid rgba(125,212,248,0.8)' : '1px solid rgba(110,185,240,0.25)',
                background: selectedSet === setName ? 'linear-gradient(180deg, rgba(30,80,120,0.8), rgba(16,42,66,0.9))' : 'rgba(18,38,62,0.4)',
                color: selectedSet === setName ? '#ffffff' : 'rgba(200,223,242,0.7)',
                fontFamily: uiTypography.display,
                fontSize: 12,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: selectedSet === setName ? '0 0 14px rgba(110,185,240,0.35)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {setName === 'all' ? 'All Sets' : `${setName} Set Abilities`}
            </button>
          ))}
        </div>

        {/* Secondary Sub-menu Filters & Search */}
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 10, background: 'rgba(12,24,40,0.65)', border: '1px solid rgba(110,185,240,0.18)' }}>
          {/* Row 1: Tiers & Types */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: 'rgba(200,223,242,0.6)', letterSpacing: 1, textTransform: 'uppercase', marginRight: 4 }}>Tier:</span>
              {[
                { id: 'all', label: 'All Tiers' },
                { id: 'foundational', label: 'Foundational (25k)' },
                { id: 'eternal', label: 'Eternal Tier (97k)' },
                { id: 'infinite', label: 'Infinite Tier (450k)' },
              ].map(tier => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTier(tier.id as TierFilter)}
                  style={{
                    padding: '4px 9px',
                    borderRadius: 5,
                    border: selectedTier === tier.id ? '1px solid #7dd4f8' : '1px solid rgba(110,185,240,0.22)',
                    background: selectedTier === tier.id ? 'rgba(78,160,220,0.25)' : 'transparent',
                    color: selectedTier === tier.id ? '#ffffff' : 'rgba(200,223,242,0.7)',
                    fontSize: 10.5,
                    cursor: 'pointer',
                  }}
                >
                  {tier.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: 'rgba(200,223,242,0.6)', letterSpacing: 1, textTransform: 'uppercase', marginRight: 4 }}>Type:</span>
              {[
                { id: 'all', label: 'All Types' },
                { id: 'buff', label: 'Buff / Field' },
                { id: 'instant', label: 'Instant Payout' },
                { id: 'summon', label: 'Summon' },
                { id: 'utility', label: 'Utility / Cooldown' },
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id as TypeFilter)}
                  style={{
                    padding: '4px 9px',
                    borderRadius: 5,
                    border: selectedType === type.id ? '1px solid #7dd4f8' : '1px solid rgba(110,185,240,0.22)',
                    background: selectedType === type.id ? 'rgba(78,160,220,0.25)' : 'transparent',
                    color: selectedType === type.id ? '#ffffff' : 'rgba(200,223,242,0.7)',
                    fontSize: 10.5,
                    cursor: 'pointer',
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Search, Status & Sorting */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid rgba(110,185,240,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 240 }}>
              <input
                type="text"
                placeholder="Search abilities..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  maxWidth: 280,
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(110,185,240,0.35)',
                  background: 'rgba(5,14,24,0.7)',
                  color: '#ffffff',
                  fontSize: 11,
                  fontFamily: uiTypography.body,
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'unowned', label: 'Available' },
                  { id: 'owned', label: 'Owned' },
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedOwnership(s.id as OwnershipFilter)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 5,
                      border: selectedOwnership === s.id ? '1px solid #7dd4f8' : '1px solid rgba(110,185,240,0.2)',
                      background: selectedOwnership === s.id ? 'rgba(78,160,220,0.2)' : 'transparent',
                      color: selectedOwnership === s.id ? '#ffffff' : 'rgba(200,223,242,0.65)',
                      fontSize: 10,
                      cursor: 'pointer',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'rgba(200,223,242,0.6)', letterSpacing: 1, textTransform: 'uppercase' }}>Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 5,
                  border: '1px solid rgba(110,185,240,0.3)',
                  background: 'rgba(5,14,24,0.85)',
                  color: '#d8f0ff',
                  fontSize: 11,
                  fontFamily: uiTypography.body,
                  cursor: 'pointer',
                }}
              >
                <option value="cost-asc">Cost: Low to High</option>
                <option value="cost-desc">Cost: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="tier">Tier</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ability Grid */}
        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {filteredAbilities.map(ability => {
            const owned = ownedAbilities[ability.id] === true;
            const affordable = oblivion >= ability.purchaseCost;
            const gateMet = meetsAbilityOwnershipGate(ability, collection, infiniteCollection);
            const gateLabel = getGateRequirementLabel(ability.ownershipGate);
            const tier = getAbilityTier(ability);

            const tierColor = tier === 'infinite' ? '#c4a6ff' : tier === 'eternal' ? '#ff8585' : '#7dd4f8';

            return (
              <article
                key={ability.id}
                style={{
                  minHeight: 210,
                  padding: 18,
                  borderRadius: 10,
                  border: `1px solid ${owned ? 'rgba(120,220,140,0.72)' : 'rgba(110,185,240,0.3)'}`,
                  background: owned ? 'rgba(60,150,90,0.12)' : 'rgba(18,38,62,0.72)',
                  boxShadow: owned ? '0 0 20px rgba(120,220,140,0.12)' : '0 10px 24px rgba(0,0,0,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: owned ? '#9be8a8' : '#7dd4f8', fontFamily: uiTypography.display, fontSize: 16, letterSpacing: 0.6 }}>
                    <img
                      src={abilityIconUrl(ability.iconAssetKey)}
                      alt=""
                      aria-hidden="true"
                      width={42}
                      height={42}
                      style={{
                        width: 42,
                        height: 42,
                        objectFit: 'cover',
                        borderRadius: 7,
                        border: `1px solid ${tierColor}66`,
                        boxShadow: `0 0 10px ${tierColor}33`,
                      }}
                    />
                    <div>
                      <div>{ability.name}</div>
                      <div style={{ fontSize: 9.5, color: tierColor, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 }}>
                        {tier} tier · {ability.setId}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginTop: 10, color: 'rgba(216,240,255,0.78)', fontSize: 11, lineHeight: 1.55, flex: 1 }}>
                  {ability.description}
                </div>

                {/* Unlock requirement banner if gated */}
                {gateLabel && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: '4px 8px',
                      borderRadius: 5,
                      background: gateMet ? 'rgba(120,220,140,0.1)' : 'rgba(255,100,100,0.12)',
                      border: `1px solid ${gateMet ? 'rgba(120,220,140,0.35)' : 'rgba(255,100,100,0.45)'}`,
                      color: gateMet ? '#9be8a8' : '#ff9f9f',
                      fontSize: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <span>{gateMet ? '✓' : '🔒'}</span>
                    <span>{gateLabel}</span>
                  </div>
                )}

                {/* Purchase footer */}
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 10, borderTop: '1px solid rgba(110,185,240,0.14)' }}>
                  <span style={{ color: '#f7c04a', fontSize: 11, fontWeight: 600 }}>
                    {ability.purchaseCost.toLocaleString()} DL
                  </span>
                  <button
                    type="button"
                    disabled={owned || !affordable || !gateMet}
                    onClick={() => purchaseAbility(ability.id)}
                    title={!gateMet && gateLabel ? gateLabel : undefined}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 6,
                      border: `1px solid ${owned ? 'rgba(120,220,140,0.5)' : !gateMet ? 'rgba(255,100,100,0.4)' : 'rgba(110,185,240,0.58)'}`,
                      background: owned ? 'rgba(120,220,140,0.12)' : !gateMet ? 'rgba(60,20,20,0.4)' : 'rgba(78,160,220,0.18)',
                      color: owned ? '#9be8a8' : !gateMet ? '#ff9f9f' : '#d8f0ff',
                      cursor: owned || !affordable || !gateMet ? 'not-allowed' : 'pointer',
                      opacity: !owned && (!affordable || !gateMet) ? 0.65 : 1,
                      fontFamily: uiTypography.body,
                      fontSize: 10,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    {owned ? 'Owned' : !gateMet ? (gateLabel ? `Locked (${gateLabel})` : 'Locked') : affordable ? 'Materialize' : 'Insufficient DL'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {filteredAbilities.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(200,223,242,0.5)', fontSize: 13, fontStyle: 'italic' }}>
            No abilities match the selected filters.
          </div>
        )}
      </div>
    </div>
  );
}
