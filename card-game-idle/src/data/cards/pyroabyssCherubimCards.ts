import type { CherubimDefinition } from '@/types/cards';

export const pyroabyssCherubimCards: CherubimDefinition[] = [
  {
    definitionId: 'cherubim-fire-ember-shroud',
    type: 'Cherubim',
    element: 'Fire',
    rarity: 'Common',
    name: 'Cinder Shroud',
    description: 'On play: Gain 4 Heat; Draw 1 card. While on board: Gain 1 Heat per card played',
    artKey: 'cherubim_fire_ember_shroud',
    maxDurability: 2,
    effects: [
      { type: 'cherubim_pyro_heat_gain', value: 1 }],
    onPlayEffects: [
      { type: 'pyro_heat_gain', value: 4 },
      { type: 'draw', value: 1 }],
  },
  {
    definitionId: 'cherubim-fire-abyssal-veil',
    type: 'Cherubim',
    element: 'Fire',
    rarity: 'Common',
    name: 'Abyssal Veil',
    description: 'On play: +35 Oblivion; Gain 3 Heat. While on board: +12 Oblivion per card played',
    artKey: 'cherubim_fire_abyssal_veil',
    maxDurability: 3,
    effects: [
      { type: 'cherubim_oblivion_per_card', value: 12 }],
    onPlayEffects: [
      { type: 'oblivion_flat', value: 35 },
      { type: 'pyro_heat_gain', value: 3 }],
  },
  {
    definitionId: 'cherubim-fire-pyre-mantle',
    type: 'Cherubim',
    element: 'Fire',
    rarity: 'Rare',
    name: 'Pyre Mantle',
    description: 'On play: Gain 3 Heat; +40 Oblivion; Search your deck for 1 matching Ophanim. While on board: Gain 2 Heat per card played',
    artKey: 'cherubim_fire_pyre_mantle',
    maxDurability: 3,
    effects: [
      { type: 'cherubim_pyro_heat_gain', value: 2 }],
    onPlayEffects: [
      { type: 'pyro_heat_gain', value: 3 },
      { type: 'oblivion_flat', value: 40 },
      { type: 'search_deck_by_type', filter: ['Ophanim'] }],
  },
  {
    definitionId: 'cherubim-fire-infernal-ward',
    type: 'Cherubim',
    element: 'Fire',
    rarity: 'Rare',
    name: 'Infernal Ward',
    description: 'On play: +45 Oblivion; Gain 2 Heat; Draw 1 card. While on board: Buffs Seraphim and Angel attacks: base +34, cooldown -1',
    artKey: 'cherubim_fire_infernal_ward',
    maxDurability: 3,
    effects: [
      { type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 34, cooldownDeltaCards: -1 }],
    onPlayEffects: [
      { type: 'oblivion_flat', value: 45 },
      { type: 'pyro_heat_gain', value: 2 },
      { type: 'draw', value: 1 }],
  },
  {
    definitionId: 'cherubim-fire-void-cinder-shell',
    type: 'Cherubim',
    element: 'Fire',
    rarity: 'Epic',
    name: 'Void Cinder Shell',
    description: 'On play: +90 Oblivion; Gain 4 Heat; Empower the next card you play. While on board: All Oblivion gain +10%',
    artKey: 'cherubim_fire_void_cinder_shell',
    maxDurability: 7,
    effects: [
      { type: 'cherubim_global_oblivion_mult', value: 0.1 }],
    onPlayEffects: [
      { type: 'oblivion_flat', value: 90 },
      { type: 'pyro_heat_gain', value: 4 },
      { type: 'multiply_next' }],
  },
  {
    definitionId: 'cherubim-fire-flame-fortify',
    type: 'Cherubim',
    element: 'Fire',
    rarity: 'Rare',
    name: 'Flame Fortification',
    description: 'On play: Search your deck for 1 matching Seraphim; Gain 3 Heat; +20 Oblivion. While on board: +14 Oblivion per card played',
    artKey: 'cherubim_fire_flame_fortify',
    maxDurability: 3,
    effects: [
      { type: 'cherubim_oblivion_per_card', value: 14 }],
    onPlayEffects: [
      { type: 'search_deck_by_type', filter: ['Seraphim'] },
      { type: 'pyro_heat_gain', value: 3 },
      { type: 'oblivion_flat', value: 20 }],
  },
  {
    definitionId: 'cherubim-fire-abyss-amp',
    type: 'Cherubim',
    element: 'Fire',
    rarity: 'Epic',
    name: 'Abyss Amplifier',
    description: 'On play: Gain 3 Heat; Burst up to 2 Heat (+40.0 Oblivion per Heat); +60 Oblivion; Draw 1 card. While on board: Ophanim plays gain +30 Oblivion',
    artKey: 'cherubim_fire_abyss_amp',
    maxDurability: 4,
    effects: [
      { type: 'cherubim_ophanim_bonus', value: 30 }],
    onPlayEffects: [
        { type: 'pyro_heat_gain', value: 3 },
        { type: 'pyro_heat_burst', oblivionPerHeat: 40, consume: 2 },
        { type: 'oblivion_flat', value: 60 },
        { type: 'draw', value: 1 }],
  }];