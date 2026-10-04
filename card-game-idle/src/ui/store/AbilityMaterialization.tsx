import { useMemo, useState } from 'react';
import { ABILITY_DEFINITIONS, ABILITY_ICON_FALLBACKS, getAbilityMaterialCost, getAbilityTier, meetsAbilityOwnershipGate, type AbilityDefinition } from '@/data/abilities/abilityDefinitions';
import { GARDEN_REWARD_LABELS } from '@/data/dungeons/gardenDungeonDefinitions';
import { useStore } from '@/state/store';
import { getReadableUiColor, uiTypography, warmTheme } from '@/ui/theme';
import { useThemeVersion } from '@/ui/useThemeVersion';

const EMPTY_OWNED_ABILITIES: Readonly<Record<string, boolean>> = Object.freeze({});
const abilityIconUrl = (key: string) => `${import.meta.env.BASE_URL}assets/ability-icons/${key}.png`;
const abilityIconFallbackUrl = (key: string) => {
  const fallback = ABILITY_ICON_FALLBACKS[key];
  return fallback ? `${import.meta.env.BASE_URL}assets/${fallback.folder}/${encodeURIComponent(fallback.file)}` : null;
};

type SetFilter = 'all' | 'Neutrality' | 'Causality' | 'Intensity' | 'Transcendent';
type TierFilter = 'all' | 'foundational' | 'eternal' | 'infinite' | 'transcendent';
type TypeFilter = 'all' | 'buff' | 'instant' | 'summon' | 'utility';
type OwnershipFilter = 'all' | 'unowned' | 'owned';
type SortOption = 'cost-asc' | 'cost-desc' | 'name-asc' | 'tier';

function getAbilityType(ability: AbilityDefinition): 'buff' | 'instant' | 'summon' | 'utility' {
  if (ability.buff) return 'buff';
  if (ability.id === 'phantom-matrix') return 'summon';
  if (ability.id === 'null-horizon' || ability.id.includes('causality-') || ability.id.includes('intensity-')) return 'utility';
  return 'instant';
}

function getGateRequirementLabel(gate?: AbilityDefinition['ownershipGate']): string | null {
  if (gate === 'anyNeutralityEternal') return 'Requires Eternal Neutrality card';
  if (gate === 'anyNeutralityInfinite') return 'Requires Infinite Neutrality card';
  if (gate === 'allCausalityBase') return 'Requires every base Causality card';
  if (gate === 'anyCausalityEternal') return 'Requires any Causality Eternal card';
  if (gate === 'anyCausalityInfinite') return 'Requires any Causality Infinite card';
  if (gate === 'allIntensityBase') return 'Requires every base Intensity card';
  if (gate === 'anyIntensityEternal') return 'Requires any Intensity Eternal card';
  if (gate === 'anyIntensityInfinite') return 'Requires any Intensity Infinite card';
  return null;
}

export default function AbilityMaterialization() {
  useThemeVersion();
  const progress = useStore(state => state.progress);
  const ownedAbilities = progress.ownedAbilities ?? EMPTY_OWNED_ABILITIES;
  const collection = progress.collection;
  const infiniteCollection = progress.infiniteCollection;
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
      const totalCost = (ability: AbilityDefinition) => Object.values(getAbilityMaterialCost(ability)).reduce((sum, amount) => sum + (amount ?? 0), 0);
      if (sortBy === 'cost-asc') return totalCost(a) - totalCost(b);
      if (sortBy === 'cost-desc') return totalCost(b) - totalCost(a);
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'tier') {
        const tierRank = { foundational: 1, eternal: 2, infinite: 3, transcendent: 4 };
        return tierRank[getAbilityTier(a)] - tierRank[getAbilityTier(b)];
      }
      return 0;
    });
  }, [selectedSet, selectedTier, selectedType, selectedOwnership, searchQuery, sortBy, ownedAbilities]);

  return (
    <div className="ability-materialization-screen" style={{ flex: 1, overflowY: 'auto', padding: '22px clamp(16px, 4vw, 48px) 32px', color: 'var(--profile-text)', fontFamily: uiTypography.body, background: 'linear-gradient(90deg, var(--profile-surface), color-mix(in srgb, var(--profile-surface-muted) 82%, transparent)), url("' + import.meta.env.BASE_URL + 'assets/menu-banners/updated/ability-materialization-archive.png") center / cover, var(--profile-app-background)' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: 'var(--profile-accent-soft)', fontFamily: uiTypography.display, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 5 }}>THE AMPLIFICATION ARCHIVE</div>
            <div className="ui-title-glow" style={{ fontFamily: uiTypography.display, fontSize: 28, color: 'var(--profile-text)', letterSpacing: 1.5 }}>Ability Materialization</div>
            <div style={{ marginTop: 4, color: 'var(--profile-text-muted)', fontSize: 12, lineHeight: 1.5 }}>
              Materialize abilities with their associated materials. Transcendent abilities use Divine Light and Shards of Transcendence, and do not use another set's mechanics.
            </div>
          </div>
        </div>

        {/* Primary Set Sub-menu */}
        <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid var(--profile-border)', paddingBottom: 10 }}>
          {(['Neutrality', 'Causality', 'Intensity', 'Transcendent', 'all'] as const).map(setName => (
            <button
              key={setName}
              type="button"
              onClick={() => setSelectedSet(setName)}
              style={{
                padding: '6px 16px',
                borderRadius: 7,
                border: selectedSet === setName ? '1px solid var(--profile-border-strong)' : '1px solid var(--profile-border)',
                background: selectedSet === setName ? 'var(--profile-surface-strong)' : 'var(--profile-surface-muted)',
                color: 'var(--profile-text)',
                fontFamily: uiTypography.display,
                fontSize: 12,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: selectedSet === setName ? '0 0 14px color-mix(in srgb, var(--profile-accent) 20%, transparent)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span className="ui-button-title">{setName === 'all' ? 'All Sets' : `${setName} Set Abilities`}</span>
            </button>
          ))}
        </div>

        {/* Secondary Sub-menu Filters & Search */}
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 10, background: 'var(--profile-surface-muted)', border: '1px solid var(--profile-border)' }}>
          {/* Row 1: Tiers & Types */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: 'var(--profile-text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginRight: 4 }}>Tier:</span>
              {[
                { id: 'all', label: 'All Tiers' },
                { id: 'foundational', label: 'Foundational' },
                { id: 'eternal', label: 'Eternal Tier' },
                { id: 'infinite', label: 'Infinite Tier' },
                { id: 'transcendent', label: 'Transcendent Tier' },
              ].map(tier => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTier(tier.id as TierFilter)}
                  style={{
                    padding: '4px 9px',
                    borderRadius: 5,
                    border: selectedTier === tier.id ? '1px solid var(--profile-border-strong)' : '1px solid var(--profile-border)',
                    background: selectedTier === tier.id ? 'var(--profile-surface-strong)' : 'transparent',
                    color: selectedTier === tier.id ? 'var(--profile-text)' : 'var(--profile-text-muted)',
                    fontSize: 10.5,
                    cursor: 'pointer',
                  }}
                >
                  {tier.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: 'var(--profile-text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginRight: 4 }}>Type:</span>
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
                    border: selectedType === type.id ? '1px solid var(--profile-border-strong)' : '1px solid var(--profile-border)',
                    background: selectedType === type.id ? 'var(--profile-surface-strong)' : 'transparent',
                    color: selectedType === type.id ? 'var(--profile-text)' : 'var(--profile-text-muted)',
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid var(--profile-border)' }}>
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
                  border: '1px solid var(--profile-border)',
                  background: 'var(--profile-surface)',
                  color: 'var(--profile-text)',
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
                      border: selectedOwnership === s.id ? '1px solid var(--profile-border-strong)' : '1px solid var(--profile-border)',
                      background: selectedOwnership === s.id ? 'var(--profile-surface-strong)' : 'transparent',
                      color: selectedOwnership === s.id ? 'var(--profile-text)' : 'var(--profile-text-muted)',
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
              <span style={{ fontSize: 10, color: 'var(--profile-text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 5,
                  border: '1px solid var(--profile-border)',
                  background: 'var(--profile-surface)',
                  color: 'var(--profile-text)',
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
            const materialCost = Object.entries(getAbilityMaterialCost(ability));
            const progressMap = progress as unknown as Record<string, number>;
            const affordable = materialCost.every(([currency, amount]) => (progressMap[currency] ?? 0) >= (amount ?? 0));
            const gateMet = meetsAbilityOwnershipGate(ability, collection, infiniteCollection);
            const gateLabel = getGateRequirementLabel(ability.ownershipGate);
            const tier = getAbilityTier(ability);

            const tierColor = tier === 'transcendent'
              ? '#f5d372'
              : tier === 'infinite'
                ? '#c4a6ff'
                : tier === 'eternal'
                  ? '#ff8585'
                  : '#7dd4f8';

            return (
              <article
                key={ability.id}
                style={{
                  minHeight: 210,
                  padding: 18,
                  borderRadius: 10,
                  border: `1px solid ${owned ? 'var(--profile-border-strong)' : 'var(--profile-border)'}`,
                  background: 'linear-gradient(145deg, var(--profile-surface-strong), var(--profile-surface))',
                  boxShadow: owned ? '0 0 20px rgba(120,220,140,0.12)' : '0 10px 24px rgba(0,0,0,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--profile-text)', fontFamily: uiTypography.display, fontSize: 16, letterSpacing: 0.6 }}>
                    <img
                      src={abilityIconUrl(ability.iconAssetKey)}
                      alt=""
                      aria-hidden="true"
                      onError={event => {
                        const fallback = abilityIconFallbackUrl(ability.iconAssetKey);
                        if (fallback && event.currentTarget.src !== new URL(fallback, window.location.href).href) {
                          event.currentTarget.src = fallback;
                        } else {
                          event.currentTarget.style.visibility = 'hidden';
                        }
                      }}
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
                      <div className="ui-gradient-text">{ability.name}</div>
                      <div style={{ fontSize: 9.5, color: getReadableUiColor(tierColor, warmTheme.surfaceStrong), letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 }}>
                        {tier} tier · {ability.setId}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginTop: 10, color: 'var(--profile-text-soft)', fontSize: 11, lineHeight: 1.55, flex: 1 }}>
                  {ability.description}
                </div>

                {/* Unlock requirement banner if gated */}
                {gateLabel && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: '4px 8px',
                      borderRadius: 5,
                      background: 'var(--profile-surface-strong)',
                      border: `1px solid ${gateMet ? 'rgba(120,220,140,0.35)' : 'rgba(255,100,100,0.45)'}`,
                      color: getReadableUiColor(gateMet ? '#9be8a8' : '#ff9f9f', warmTheme.surfaceStrong),
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
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 10, borderTop: '1px solid var(--profile-border)' }}>
                  <span style={{ color: 'var(--profile-text-soft)', fontSize: 10, fontWeight: 600, lineHeight: 1.45 }}>
                    {materialCost.map(([currency, amount]) => `${amount} ${GARDEN_REWARD_LABELS[currency as keyof typeof GARDEN_REWARD_LABELS]}`).join(' · ')}
                  </span>
                  <button
                    type="button"
                    disabled={owned || !affordable || !gateMet}
                    onClick={() => purchaseAbility(ability.id)}
                    title={!gateMet && gateLabel ? gateLabel : undefined}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--profile-border-strong)',
                      background: !owned && affordable && gateMet ? 'var(--profile-button)' : 'var(--profile-surface-muted)',
                      color: !owned && affordable && gateMet ? 'var(--profile-button-text)' : 'var(--profile-text-muted)',
                      cursor: owned || !affordable || !gateMet ? 'not-allowed' : 'pointer',
                      opacity: 1,
                      fontFamily: uiTypography.body,
                      fontSize: 10,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    <span className="ui-button-title ui-button-title-on-light">{owned ? 'Owned' : !gateMet ? (gateLabel ? `Locked (${gateLabel})` : 'Locked') : affordable ? 'Materialize' : 'Insufficient materials'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {filteredAbilities.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--profile-text-muted)', fontSize: 13, fontStyle: 'italic' }}>
            No abilities match the selected filters.
          </div>
        )}
      </div>
    </div>
  );
}
