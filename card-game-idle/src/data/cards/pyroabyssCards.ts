import type { SeraphimDefinition, SeekerDefinition } from '@/types/cards';

// ── Seraphim ──────────────────────────────────────────────────────────────────

export const pyroabyssSeraphims: SeraphimDefinition[] = [
  {
    definitionId: 'ser-fire-cinder',
    type: 'Seraphim',
    element: 'Fire',
    rarity: 'Common',
    name: 'Cinder Seraphim',
    description: 'On play: +20 Oblivion. Gain 2 Embers. In synergy: +1 Ember per card played.',
    artKey: 'ser_fire_cinder',
    baseStats: { bonusType: 'ember_per_card', bonusValue: 1, synergyRequirement: 'Fire' },
    onPlayEffects: [
      { type: 'oblivion_flat', value: 20 },
      { type: 'ember_gain', value: 2 },
    ],
  },
  {
    definitionId: 'ser-fire-abyssal',
    type: 'Seraphim',
    element: 'Fire',
    rarity: 'Common',
    name: 'Abyssal Seraphim',
    description: 'On play: Draw 1 card. Gain 1 Ember. In synergy: +15 Oblivion when you play a Seeker card.',
    artKey: 'ser_fire_abyssal',
    baseStats: { bonusType: 'seeker_bonus', bonusValue: 15, synergyRequirement: 'Fire' },
    onPlayEffects: [
      { type: 'draw', value: 1 },
      { type: 'ember_gain', value: 1 },
    ],
  },
  {
    definitionId: 'ser-fire-pyre',
    type: 'Seraphim',
    element: 'Fire',
    rarity: 'Rare',
    name: 'Pyre Seraphim',
    description: 'On play: +45 Oblivion. In synergy: +12 Oblivion per card played.',
    artKey: 'ser_fire_pyre',
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 12, synergyRequirement: 'Fire' },
    onPlayEffects: [
      { type: 'oblivion_flat', value: 45 },
    ],
  },
  {
    definitionId: 'ser-fire-infernal',
    type: 'Seraphim',
    element: 'Fire',
    rarity: 'Rare',
    name: 'Infernal Seraphim',
    description: 'On play: +30 Oblivion. Gain 3 Embers. In synergy: +2 Embers per card played.',
    artKey: 'ser_fire_infernal',
    baseStats: { bonusType: 'ember_per_card', bonusValue: 2, synergyRequirement: 'Fire' },
    onPlayEffects: [
      { type: 'oblivion_flat', value: 30 },
      { type: 'ember_gain', value: 3 },
    ],
  },
  {
    definitionId: 'ser-fire-voidflame',
    type: 'Seraphim',
    element: 'Fire',
    rarity: 'Epic',
    name: 'Void-Flame Seraphim',
    description: 'On play: +60 Oblivion. Gain 5 Embers. Draw 1 card. In synergy: +3 Embers per card played.',
    artKey: 'ser_fire_voidflame',
    baseStats: { bonusType: 'ember_per_card', bonusValue: 3, synergyRequirement: 'Fire' },
    onPlayEffects: [
      { type: 'oblivion_flat', value: 60 },
      { type: 'ember_gain', value: 5 },
      { type: 'draw', value: 1 },
    ],
  },
];

// ── Seeker cards ──────────────────────────────────────────────────────────────

export const pyroabyssSeekerCards: SeekerDefinition[] = [
  // Commons
  {
    definitionId: 'seek-fire-cinder-draw',
    type: 'Seeker',
    element: 'Fire',
    rarity: 'Common',
    name: 'Cinder Draw',
    description: 'Gain 2 Embers. Draw 1 card.',
    artKey: 'seek_fire_cinder_draw',
    effects: [
      { type: 'ember_gain', value: 2 },
      { type: 'draw', value: 1 },
    ],
  },
  {
    definitionId: 'seek-fire-abyssal-kindle',
    type: 'Seeker',
    element: 'Fire',
    rarity: 'Common',
    name: 'Abyssal Kindle',
    description: '+20 Oblivion. Gain 1 Ember.',
    artKey: 'seek_fire_abyssal_kindle',
    effects: [
      { type: 'oblivion_flat', value: 20 },
      { type: 'ember_gain', value: 1 },
    ],
  },
  {
    definitionId: 'seek-fire-pyre-ignite',
    type: 'Seeker',
    element: 'Fire',
    rarity: 'Common',
    name: 'Pyre Ignite',
    description: 'Gain 3 Embers.',
    artKey: 'seek_fire_pyre_ignite',
    effects: [
      { type: 'ember_gain', value: 3 },
    ],
  },
  {
    definitionId: 'seek-fire-infernal-surge',
    type: 'Seeker',
    element: 'Fire',
    rarity: 'Common',
    name: 'Infernal Surge',
    description: '+30 Oblivion. If any Chaos card is active: gain 2 Embers.',
    artKey: 'seek_fire_infernal_surge',
    effects: [
      { type: 'oblivion_flat', value: 30 },
      { type: 'conditional', condition: { type: 'chaos_active_gte', value: 1 }, then: [{ type: 'ember_gain', value: 2 }] },
    ],
  },
  {
    definitionId: 'seek-fire-void-kindling',
    type: 'Seeker',
    element: 'Fire',
    rarity: 'Common',
    name: 'Void Kindling',
    description: 'Draw 2 cards. Gain 1 Ember.',
    artKey: 'seek_fire_void_kindling',
    effects: [
      { type: 'draw', value: 2 },
      { type: 'ember_gain', value: 1 },
    ],
  },
  {
    definitionId: 'seek-fire-void-flare',
    type: 'Seeker',
    element: 'Fire',
    rarity: 'Common',
    name: 'Void Flare',
    description: '+25 Oblivion. If you have 3 or more Embers: gain 1 Ember.',
    artKey: 'seek_fire_void_flare',
    effects: [
      { type: 'oblivion_flat', value: 25 },
      { type: 'conditional', condition: { type: 'ember_gte', value: 3 }, then: [{ type: 'ember_gain', value: 1 }] },
    ],
  },
  {
    definitionId: 'seek-fire-smoldering-cycle',
    type: 'Seeker',
    element: 'Fire',
    rarity: 'Common',
    name: 'Smoldering Cycle',
    description: 'Shuffle your discard pile into the deck. Gain 2 Embers.',
    artKey: 'seek_fire_smoldering_cycle',
    effects: [
      { type: 'shuffle_discard' },
      { type: 'ember_gain', value: 2 },
    ],
  },
  {
    definitionId: 'seek-fire-abyssal-recall',
    type: 'Seeker',
    element: 'Fire',
    rarity: 'Common',
    name: 'Abyssal Recall',
    description: 'Salvage 1 Seraphim card from your discard pile. Gain 1 Ember.',
    artKey: 'seek_fire_abyssal_recall',
    effects: [
      { type: 'salvage_by_type', filter: ['Seraphim'] },
      { type: 'ember_gain', value: 1 },
    ],
  },
  // Rares
  {
    definitionId: 'seek-fire-flame-burst',
    type: 'Seeker',
    element: 'Fire',
    rarity: 'Rare',
    name: 'Flame Burst',
    description: 'Spend 3 Embers: +60 Oblivion.',
    artKey: 'seek_fire_flame_burst',
    effects: [
      { type: 'ember_spend', value: 3 },
      { type: 'oblivion_flat', value: 60 },
    ],
  },
  {
    definitionId: 'seek-fire-abyssal-detonation',
    type: 'Seeker',
    element: 'Fire',
    rarity: 'Rare',
    name: 'Abyssal Detonation',
    description: 'Spend 5 Embers: +120 Oblivion. Draw 1 card.',
    artKey: 'seek_fire_abyssal_detonation',
    effects: [
      { type: 'ember_spend', value: 5 },
      { type: 'oblivion_flat', value: 120 },
      { type: 'draw', value: 1 },
    ],
  },
  {
    definitionId: 'seek-fire-pyroclast',
    type: 'Seeker',
    element: 'Fire',
    rarity: 'Rare',
    name: 'Pyroclast',
    description: 'Spend 4 Embers: +80 Oblivion. If 3 or more Seraphim are in synergy: draw 2 cards.',
    artKey: 'seek_fire_pyroclast',
    effects: [
      { type: 'ember_spend', value: 4 },
      { type: 'oblivion_flat', value: 80 },
      { type: 'conditional', condition: { type: 'seraphim_active_gte', value: 3 }, then: [{ type: 'draw', value: 2 }] },
    ],
  },
  {
    definitionId: 'seek-fire-ember-threshold',
    type: 'Seeker',
    element: 'Fire',
    rarity: 'Rare',
    name: 'Ember Threshold',
    description: '+40 Oblivion. If you have 5 or more Embers: +30 additional Oblivion.',
    artKey: 'seek_fire_ember_threshold',
    effects: [
      { type: 'oblivion_flat', value: 40 },
      { type: 'conditional', condition: { type: 'ember_gte', value: 5 }, then: [{ type: 'oblivion_flat', value: 30 }] },
    ],
  },
  {
    definitionId: 'seek-fire-conflagration',
    type: 'Seeker',
    element: 'Fire',
    rarity: 'Rare',
    name: 'Conflagration',
    description: '+10 Oblivion per card played this turn (including this one). Gain 1 Ember.',
    artKey: 'seek_fire_conflagration',
    effects: [
      { type: 'oblivion_flat', value: 0 },  // dynamic sentinel: (cardsPlayedThisTurn + 1) * 10
      { type: 'ember_gain', value: 1 },
    ],
  },
  {
    definitionId: 'seek-fire-pyre-hunt',
    type: 'Seeker',
    element: 'Fire',
    rarity: 'Rare',
    name: 'Pyre Hunt',
    description: 'Search your deck for any Chaos card. Add it to your hand. Shuffle your deck.',
    artKey: 'seek_fire_pyre_hunt',
    effects: [
      { type: 'search_deck_by_type', filter: ['Chaos'] },
    ],
  },
  {
    definitionId: 'seek-fire-ember-chain',
    type: 'Seeker',
    element: 'Fire',
    rarity: 'Rare',
    name: 'Ember Chain',
    description: 'Gain Embers equal to the number of Seeker cards in your hand.',
    artKey: 'seek_fire_ember_chain',
    effects: [
      { type: 'ember_gain', value: 0 },  // dynamic sentinel: Seeker count in hand
    ],
  },
  // Epics
  {
    definitionId: 'seek-fire-void-combustion',
    type: 'Seeker',
    element: 'Fire',
    rarity: 'Epic',
    name: 'Void Combustion',
    description: 'Spend all your Embers: +25 Oblivion per Ember spent.',
    artKey: 'seek_fire_void_combustion',
    effects: [
      { type: 'ember_spend', value: 9999 },
      { type: 'oblivion_flat', value: 0 },  // dynamic sentinel: embersDrained * 25
    ],
  },
  {
    definitionId: 'seek-fire-inferno',
    type: 'Seeker',
    element: 'Fire',
    rarity: 'Epic',
    name: 'Inferno',
    description: 'Spend 6 Embers: Set the chain multiplier to ×3.0.',
    artKey: 'seek_fire_inferno',
    effects: [
      { type: 'ember_spend', value: 6 },
      { type: 'chain_multiplier_set', value: 3.0 },
    ],
  },
  // Legendary
  {
    definitionId: 'seek-fire-void-apocalypse',
    type: 'Seeker',
    element: 'Fire',
    rarity: 'Legendary',
    name: 'Void Apocalypse',
    description: 'Draw 2 cards. Spend all your Embers: +30 Oblivion per Ember spent.',
    artKey: 'seek_fire_void_apocalypse',
    effects: [
      { type: 'draw', value: 2 },
      { type: 'ember_spend', value: 9999 },
      { type: 'oblivion_flat', value: 0 },  // dynamic sentinel: embersDrained * 30
    ],
  },
];
