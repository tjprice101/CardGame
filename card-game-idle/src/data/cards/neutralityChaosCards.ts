import type { ChaosDefinition } from '@/types/cards';

// ── Starter Chaos cards ───────────────────────────────────────────────────────

export const neutralityStarterChaosCards: ChaosDefinition[] = [
  {
    definitionId: 'chaos-neutral-null-veil',
    type: 'Chaos',
    element: 'Neutrality',
    rarity: 'Common',
    name: 'Null Veil',
    description: 'On play: draw 1 card. While active: adjacent Seraphim gain +10 Oblivion per card played. On expiry: +20 Oblivion. Expires after 3 plays.',
    artKey: 'chaos_neutral_null_veil',
    maxDurability: 3,
    effects: [
      { type: 'chaos_oblivion_per_card', value: 10 },
    ],
    enthalpy: [
      { type: 'draw', value: 1 },
    ],
    entropy: [
      { type: 'oblivion_flat', value: 20 },
    ],
  },
  {
    definitionId: 'chaos-neutral-void-shroud',
    type: 'Chaos',
    element: 'Neutrality',
    rarity: 'Common',
    name: 'Void Shroud',
    description: 'On play: shuffle your discard pile into your deck. While active: adjacent Seraphim grant +10 bonus Oblivion when you play a Seeker. On expiry: draw 1 card. Expires after 4 plays.',
    artKey: 'chaos_neutral_void_shroud',
    maxDurability: 4,
    effects: [
      { type: 'chaos_seeker_bonus', value: 10 },
    ],
    enthalpy: [
      { type: 'shuffle_discard' },
    ],
    entropy: [
      { type: 'draw', value: 1 },
    ],
  },
  {
    definitionId: 'chaos-neutral-balance-mantle',
    type: 'Chaos',
    element: 'Neutrality',
    rarity: 'Rare',
    name: 'Balance Mantle',
    description: 'On play: search your deck for a Seraphim in an adjacent front slot and add it to your hand. While active: adjacent Seraphim gain +30 Oblivion per card played. On expiry: +30 Oblivion. Expires after 5 plays.',
    artKey: 'chaos_neutral_balance_mantle',
    maxDurability: 5,
    effects: [
      { type: 'chaos_oblivion_per_card', value: 30 },
    ],
    enthalpy: [
      { type: 'search_adjacent_seraphim' },
    ],
    entropy: [
      { type: 'oblivion_flat', value: 30 },
    ],
  },
  {
    definitionId: 'chaos-neutral-equilibrium-ward',
    type: 'Chaos',
    element: 'Neutrality',
    rarity: 'Rare',
    name: 'Equilibrium Ward',
    description: 'On play: +30 Oblivion. While active: adjacent Seraphim grow the chain multiplier +0.05 faster per card. On expiry: shuffle your discard pile into your deck, then draw 1 card. Expires after 4 plays.',
    artKey: 'chaos_neutral_equilibrium_ward',
    maxDurability: 4,
    effects: [
      { type: 'chaos_chain_bonus', value: 0.05 },
    ],
    enthalpy: [
      { type: 'oblivion_flat', value: 30 },
    ],
    entropy: [
      { type: 'shuffle_discard' },
      { type: 'draw', value: 1 },
    ],
  },
  {
    definitionId: 'chaos-neutral-still-shell',
    type: 'Chaos',
    element: 'Neutrality',
    rarity: 'Epic',
    name: 'Still Shell',
    description: 'On play: +50 Oblivion. While active: adjacent Seraphim\'s Oblivion-per-card bonus is doubled. On expiry: draw 2 cards. Expires after 6 plays.',
    artKey: 'chaos_neutral_still_shell',
    maxDurability: 6,
    effects: [
      { type: 'chaos_seraphim_amp', value: 2 },
    ],
    enthalpy: [
      { type: 'oblivion_flat', value: 50 },
    ],
    entropy: [
      { type: 'draw', value: 2 },
    ],
  },
];

// ── Pack-exclusive Chaos cards ────────────────────────────────────────────────

export const neutralityPackChaosCards: ChaosDefinition[] = [
  {
    definitionId: 'chaos-neutral-null-fortify',
    type: 'Chaos',
    element: 'Neutrality',
    rarity: 'Rare',
    name: 'Null Fortification',
    description: 'On play: search your deck for a Seraphim in an adjacent front slot and add it to your hand. While active: adjacent Seraphim gain +15 Oblivion per card played. On expiry: +40 Oblivion. Expires after 6 plays.',
    artKey: 'chaos_neutral_null_fortify',
    maxDurability: 6,
    effects: [
      { type: 'chaos_oblivion_per_card', value: 15 },
    ],
    enthalpy: [
      { type: 'search_adjacent_seraphim' },
    ],
    entropy: [
      { type: 'oblivion_flat', value: 40 },
    ],
  },
  {
    definitionId: 'chaos-neutral-void-amp',
    type: 'Chaos',
    element: 'Neutrality',
    rarity: 'Epic',
    name: 'Void Amplifier',
    description: 'On play: sacrifice this card to gain +200 Oblivion.',
    artKey: 'chaos_neutral_void_amp',
    maxDurability: 1,
    effects: [],
    enthalpy: [
      { type: 'chaos_sacrifice_oblivion', value: 200 },
    ],
  },
];

export const neutralityChaosCards = [
  ...neutralityStarterChaosCards,
  ...neutralityPackChaosCards,
];
