import type { ChaosDefinition } from '@/types/cards';

export const pyroabyssChaosCards: ChaosDefinition[] = [
  {
    definitionId: 'chaos-fire-ember-shroud',
    type: 'Chaos',
    element: 'Fire',
    rarity: 'Common',
    name: 'Ember Shroud',
    description: 'On play: gain 3 Embers. While active: adjacent Seraphim in synergy gain +2 Embers per card played. On expiry: gain 2 Embers. Expires after 3 plays.',
    artKey: 'chaos_fire_ember_shroud',
    maxDurability: 3,
    effects: [
      { type: 'chaos_ember_gain', value: 2 },
    ],
    enthalpy: [
      { type: 'ember_gain', value: 3 },
    ],
    entropy: [
      { type: 'ember_gain', value: 2 },
    ],
  },
  {
    definitionId: 'chaos-fire-abyssal-veil',
    type: 'Chaos',
    element: 'Fire',
    rarity: 'Common',
    name: 'Abyssal Veil',
    description: 'On play: +20 Oblivion. While active: adjacent Seraphim in synergy gain +8 Oblivion per card played. On expiry: draw 1 card. Expires after 4 plays.',
    artKey: 'chaos_fire_abyssal_veil',
    maxDurability: 4,
    effects: [
      { type: 'chaos_oblivion_per_card', value: 8 },
    ],
    enthalpy: [
      { type: 'oblivion_flat', value: 20 },
    ],
    entropy: [
      { type: 'draw', value: 1 },
    ],
  },
  {
    definitionId: 'chaos-fire-pyre-mantle',
    type: 'Chaos',
    element: 'Fire',
    rarity: 'Rare',
    name: 'Pyre Mantle',
    description: 'On play: gain 4 Embers. While active: adjacent Seraphim in synergy gain +3 Embers per card played. On expiry: +30 Oblivion. Expires after 5 plays.',
    artKey: 'chaos_fire_pyre_mantle',
    maxDurability: 5,
    effects: [
      { type: 'chaos_ember_gain', value: 3 },
    ],
    enthalpy: [
      { type: 'ember_gain', value: 4 },
    ],
    entropy: [
      { type: 'oblivion_flat', value: 30 },
    ],
  },
  {
    definitionId: 'chaos-fire-infernal-ward',
    type: 'Chaos',
    element: 'Fire',
    rarity: 'Rare',
    name: 'Infernal Ward',
    description: 'On play: +30 Oblivion. While active: adjacent Seraphim in synergy grow the chain multiplier +0.05 faster per card. On expiry: gain 3 Embers. Expires after 4 plays.',
    artKey: 'chaos_fire_infernal_ward',
    maxDurability: 4,
    effects: [
      { type: 'chaos_chain_bonus', value: 0.05 },
    ],
    enthalpy: [
      { type: 'oblivion_flat', value: 30 },
    ],
    entropy: [
      { type: 'ember_gain', value: 3 },
    ],
  },
  {
    definitionId: 'chaos-fire-void-cinder-shell',
    type: 'Chaos',
    element: 'Fire',
    rarity: 'Epic',
    name: 'Void Cinder Shell',
    description: 'On play: +60 Oblivion. While active: adjacent Seraphim in synergy have their Oblivion-per-card bonus doubled. On expiry: draw 2 cards. Expires after 6 plays.',
    artKey: 'chaos_fire_void_cinder_shell',
    maxDurability: 6,
    effects: [
      { type: 'chaos_seraphim_amp', value: 2 },
    ],
    enthalpy: [
      { type: 'oblivion_flat', value: 60 },
    ],
    entropy: [
      { type: 'draw', value: 2 },
    ],
  },
  {
    definitionId: 'chaos-fire-flame-fortify',
    type: 'Chaos',
    element: 'Fire',
    rarity: 'Rare',
    name: 'Flame Fortification',
    description: 'On play: search your deck for a Seraphim in an adjacent front slot and add it to your hand. While active: adjacent Seraphim in synergy gain +14 Oblivion per card played. On expiry: gain 4 Embers. Expires after 6 plays.',
    artKey: 'chaos_fire_flame_fortify',
    maxDurability: 6,
    effects: [
      { type: 'chaos_oblivion_per_card', value: 14 },
    ],
    enthalpy: [
      { type: 'search_adjacent_seraphim' },
    ],
    entropy: [
      { type: 'ember_gain', value: 4 },
    ],
  },
  {
    definitionId: 'chaos-fire-abyss-amp',
    type: 'Chaos',
    element: 'Fire',
    rarity: 'Epic',
    name: 'Abyss Amplifier',
    description: 'On play: sacrifice this card to gain 8 Embers and draw 1 card.',
    artKey: 'chaos_fire_abyss_amp',
    maxDurability: 1,
    effects: [],
    enthalpy: [
      { type: 'ember_gain', value: 8 },
      { type: 'draw', value: 1 },
      { type: 'chaos_sacrifice_oblivion', value: 0 },
    ],
  },
];
