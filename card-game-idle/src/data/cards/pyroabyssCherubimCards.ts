import type { CherubimDefinition } from '@/types/cards';

export const pyroabyssCherubimCards: CherubimDefinition[] = [
  {
    definitionId: 'cherubim-fire-ember-shroud',
    type: 'Cherubim',
    element: 'Fire',
    rarity: 'Common',
    name: 'Cinder Shroud',
    description: 'On play: Stoke 4 Furnace Pressure; Stoke 2 Furnace Pressure; Stoke 2 Furnace Pressure. While on board: Gain 1 Furnace Pressure per card played',
    artKey: 'cherubim_fire_ember_shroud',
    maxDurability: 2,
    effects: [
      { type: 'cherubim_resource_per_card', resource: 'pyroFurnacePressure', value: 1 }],
    onPlayEffects: [
      { type: 'pyro_furnace_pressure_gain', value: 4 },
      { type: 'pyro_furnace_pressure_gain', value: 2 },
      { type: 'pyro_furnace_pressure_gain', value: 2 }],
  },
  {
    definitionId: 'cherubim-fire-abyssal-veil',
    type: 'Cherubim',
    element: 'Fire',
    rarity: 'Common',
    name: 'Abyssal Veil',
    description: 'On play: +40 Oblivion; Stoke 3 Furnace Pressure; Stoke 2 Furnace Pressure; Stoke 2 Furnace Pressure. While on board: +10 Oblivion per card played',
    artKey: 'cherubim_fire_abyssal_veil',
    maxDurability: 3,
    effects: [
      { type: 'cherubim_oblivion_per_card', value: 10 }],
    onPlayEffects: [
      { type: 'oblivion_flat', value: 40 },
      { type: 'pyro_furnace_pressure_gain', value: 3 },
      { type: 'pyro_furnace_pressure_gain', value: 2 },
      { type: 'pyro_furnace_pressure_gain', value: 2 }],
  },
  {
    definitionId: 'cherubim-fire-pyre-mantle',
    type: 'Cherubim',
    element: 'Fire',
    rarity: 'Rare',
    name: 'Pyre Mantle',
    description: 'On play: Stoke 4 Furnace Pressure; +50 Oblivion; Stoke 2 Furnace Pressure. While on board: Gain 3 Furnace Pressure per card played',
    artKey: 'cherubim_fire_pyre_mantle',
    maxDurability: 3,
    effects: [
      { type: 'cherubim_resource_per_card', resource: 'pyroFurnacePressure', value: 3 }],
    onPlayEffects: [
      { type: 'pyro_furnace_pressure_gain', value: 4 },
      { type: 'oblivion_flat', value: 50 },
      { type: 'pyro_furnace_pressure_gain', value: 2 }],
  },
  {
    definitionId: 'cherubim-fire-infernal-ward',
    type: 'Cherubim',
    element: 'Fire',
    rarity: 'Rare',
    name: 'Infernal Ward',
    description: 'On play: +60 Oblivion; Stoke 2 Furnace Pressure. While on board: Buffs Seraphim and Angel attacks: base +32, cooldown +0',
    artKey: 'cherubim_fire_infernal_ward',
    maxDurability: 3,
    effects: [
      { type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 32, cooldownDeltaCards: 0 }],
    onPlayEffects: [
      { type: 'oblivion_flat', value: 60 },
      { type: 'pyro_furnace_pressure_gain', value: 2 }],
  },
  {
    definitionId: 'cherubim-fire-void-cinder-shell',
    type: 'Cherubim',
    element: 'Fire',
    rarity: 'Epic',
    name: 'Void Cinder Shell',
    description: 'On play: +100 Oblivion; Stoke 5 Furnace Pressure; Empower the next card you play; Stoke 2 Furnace Pressure. While on board: All Oblivion gain +8%',
    artKey: 'cherubim_fire_void_cinder_shell',
    maxDurability: 7,
    effects: [
      { type: 'cherubim_global_oblivion_mult', value: 0.08 }],
    onPlayEffects: [
      { type: 'oblivion_flat', value: 100 },
      { type: 'pyro_furnace_pressure_gain', value: 5 },
      { type: 'multiply_next' },
      { type: 'pyro_furnace_pressure_gain', value: 2 }],
  },
  {
    definitionId: 'cherubim-fire-flame-fortify',
    type: 'Cherubim',
    element: 'Fire',
    rarity: 'Rare',
    name: 'Flame Fortification',
    description: 'On play: Search your deck for 1 matching Seraphim; Stoke 4 Furnace Pressure; Stoke 2 Furnace Pressure. While on board: +14 Oblivion per card played',
    artKey: 'cherubim_fire_flame_fortify',
    maxDurability: 3,
    effects: [
      { type: 'cherubim_oblivion_per_card', value: 14 }],
    onPlayEffects: [
      { type: 'search_deck_by_type', filter: ['Seraphim'] },
      { type: 'pyro_furnace_pressure_gain', value: 4 },
      { type: 'pyro_furnace_pressure_gain', value: 2 }],
  },
  {
    definitionId: 'cherubim-fire-abyss-amp',
    type: 'Cherubim',
    element: 'Fire',
    rarity: 'Epic',
    name: 'Abyss Amplifier',
    description: 'On play: Stoke 4 Furnace Pressure; Stoke 2 Furnace Pressure; Ignite Furnace (tiered heat payout scaled by your rise streak); +80 Oblivion; Stoke 2 Furnace Pressure. While on board: Ophanim plays gain +26 Oblivion',
    artKey: 'cherubim_fire_abyss_amp',
    maxDurability: 4,
    effects: [
      { type: 'cherubim_ophanim_bonus', value: 26 }],
    onPlayEffects: [
      { type: 'pyro_furnace_pressure_gain', value: 4 },
      { type: 'pyro_furnace_pressure_gain', value: 2 },
      { type: 'pyro_furnace_ignite' },
      { type: 'oblivion_flat', value: 80 },
      { type: 'pyro_furnace_pressure_gain', value: 2 }],
  }];