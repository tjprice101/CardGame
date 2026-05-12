import type { SeraphimDefinition, SeekerDefinition } from '@/types/cards';

// ── Seraphim ──────────────────────────────────────────────────────────────────

export const neutralitySeraphims: SeraphimDefinition[] = [
  {
    definitionId: 'ser-neutral-null',
    type: 'Seraphim',
    element: 'Neutrality',
    rarity: 'Common',
    name: 'Null Seraphim',
    description: 'On play: +20 Oblivion. Draw 1 card. In synergy: +8 Oblivion per card played.',
    artKey: 'ser_neutral_null',
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 8, synergyRequirement: 'Neutrality' },
    onPlayEffects: [
      { type: 'oblivion_flat', value: 20 },
      { type: 'draw', value: 1 },
    ],
  },
  {
    definitionId: 'ser-neutral-void',
    type: 'Seraphim',
    element: 'Neutrality',
    rarity: 'Common',
    name: 'Void Seraphim',
    description: 'On play: +30 Oblivion. In synergy: +15 Oblivion when you play a Seeker card.',
    artKey: 'ser_neutral_void',
    baseStats: { bonusType: 'seeker_bonus', bonusValue: 15, synergyRequirement: 'Neutrality' },
    onPlayEffects: [
      { type: 'oblivion_flat', value: 30 },
    ],
  },
  {
    definitionId: 'ser-neutral-balance',
    type: 'Seraphim',
    element: 'Neutrality',
    rarity: 'Rare',
    name: 'Balance Seraphim',
    description: 'On play: +25 Oblivion. Draw 2 cards. In synergy: Chaos cards you place gain +2 durability.',
    artKey: 'ser_neutral_balance',
    baseStats: { bonusType: 'chaos_extra_plays', bonusValue: 2, synergyRequirement: 'Neutrality' },
    onPlayEffects: [
      { type: 'oblivion_flat', value: 25 },
      { type: 'draw', value: 2 },
    ],
  },
  {
    definitionId: 'ser-neutral-equilibrium',
    type: 'Seraphim',
    element: 'Neutrality',
    rarity: 'Rare',
    name: 'Equilibrium Seraphim',
    description: 'On play: +45 Oblivion. In synergy: chain multiplier grows +0.05 faster per card played.',
    artKey: 'ser_neutral_equilibrium',
    baseStats: { bonusType: 'chain_bonus', bonusValue: 0.05, synergyRequirement: 'Neutrality' },
    onPlayEffects: [
      { type: 'oblivion_flat', value: 45 },
    ],
  },
  {
    definitionId: 'ser-neutral-still',
    type: 'Seraphim',
    element: 'Neutrality',
    rarity: 'Epic',
    name: 'Still Seraphim',
    description: 'On play: +60 Oblivion. Draw 1 card. In synergy: when a Chaos card expires, gain +50 Oblivion.',
    artKey: 'ser_neutral_still',
    baseStats: { bonusType: 'chaos_expire_bonus', bonusValue: 50, synergyRequirement: 'Neutrality' },
    onPlayEffects: [
      { type: 'oblivion_flat', value: 60 },
      { type: 'draw', value: 1 },
    ],
  },
];

// ── Starter Seeker cards ──────────────────────────────────────────────────────

export const neutralitySeekerCards: SeekerDefinition[] = [
  {
    definitionId: 'seek-neutral-null-seek',
    type: 'Seeker',
    element: 'Neutrality',
    rarity: 'Common',
    name: 'Null Seek',
    description: 'Draw 2 cards.',
    artKey: 'seek_neutral_null_seek',
    effects: [
      { type: 'draw', value: 2 },
    ],
  },
  {
    definitionId: 'seek-neutral-seraph-recall',
    type: 'Seeker',
    element: 'Neutrality',
    rarity: 'Common',
    name: 'Seraph Recall',
    description: 'Salvage 1 Seraphim card from your discard pile. Add it to your hand.',
    artKey: 'seek_neutral_seraph_recall',
    effects: [
      { type: 'salvage_by_type', filter: ['Seraphim'] },
    ],
  },
  {
    definitionId: 'seek-neutral-neutral-cycle',
    type: 'Seeker',
    element: 'Neutrality',
    rarity: 'Common',
    name: 'Neutral Cycle',
    description: 'Shuffle your discard pile into the deck. Draw 1 card.',
    artKey: 'seek_neutral_neutral_cycle',
    effects: [
      { type: 'shuffle_discard' },
      { type: 'draw', value: 1 },
    ],
  },
  {
    definitionId: 'seek-neutral-measured-seek',
    type: 'Seeker',
    element: 'Neutrality',
    rarity: 'Common',
    name: 'Measured Seek',
    description: 'Look at the top 4 cards of your deck. Take 1 into your hand; return 1 to the bottom; discard the rest.',
    artKey: 'seek_neutral_measured_seek',
    effects: [
      { type: 'look_top_take_drop', look: 4, take: 1, drop: 1 },
    ],
  },
  {
    definitionId: 'seek-neutral-void-surge',
    type: 'Seeker',
    element: 'Neutrality',
    rarity: 'Common',
    name: 'Void Surge',
    description: '+25 Oblivion. If any Chaos card is active, +15 additional Oblivion.',
    artKey: 'seek_neutral_void_surge',
    effects: [
      { type: 'oblivion_flat', value: 25 },
      { type: 'conditional', condition: { type: 'chaos_active_gte', value: 1 }, then: [{ type: 'oblivion_flat', value: 15 }] },
    ],
  },
  {
    definitionId: 'seek-neutral-still-pulse',
    type: 'Seeker',
    element: 'Neutrality',
    rarity: 'Common',
    name: 'Still Pulse',
    description: 'Draw 1 card. If 3 or more Seraphim are in synergy, draw 1 additional card.',
    artKey: 'seek_neutral_still_pulse',
    effects: [
      { type: 'draw', value: 1 },
      { type: 'conditional', condition: { type: 'seraphim_active_gte', value: 3 }, then: [{ type: 'draw', value: 1 }] },
    ],
  },
  {
    definitionId: 'seek-neutral-chain-pulse',
    type: 'Seeker',
    element: 'Neutrality',
    rarity: 'Rare',
    name: 'Chain Pulse',
    description: '+10 Oblivion per card played this turn (including this one).',
    artKey: 'seek_neutral_chain_pulse',
    effects: [
      { type: 'oblivion_flat', value: 0 }, // executor: (cardsPlayedThisTurn + 1) * 10
    ],
  },
  {
    definitionId: 'seek-neutral-chaos-recall',
    type: 'Seeker',
    element: 'Neutrality',
    rarity: 'Rare',
    name: 'Chaos Recall',
    description: 'Salvage 1 Chaos card from your discard pile. Add it to your hand.',
    artKey: 'seek_neutral_chaos_recall',
    effects: [
      { type: 'salvage_by_type', filter: ['Chaos'] },
    ],
  },
  {
    definitionId: 'seek-neutral-deep-seek',
    type: 'Seeker',
    element: 'Neutrality',
    rarity: 'Rare',
    name: 'Deep Seek',
    description: 'Search your deck for 1 Seraphim or Chaos card. Add it to your hand. Shuffle your deck.',
    artKey: 'seek_neutral_deep_seek',
    effects: [
      { type: 'search_deck_by_type', filter: ['Seraphim', 'Chaos'] },
    ],
  },
];

// ── Pack-exclusive Seeker cards ───────────────────────────────────────────────

export const neutralityPackSeekerCards: SeekerDefinition[] = [
  {
    definitionId: 'seek-neutral-grand-seek',
    type: 'Seeker',
    element: 'Neutrality',
    rarity: 'Rare',
    name: 'Grand Seek',
    description: 'Draw 3 cards. +10 Oblivion.',
    artKey: 'seek_neutral_grand_seek',
    effects: [
      { type: 'draw', value: 3 },
      { type: 'oblivion_flat', value: 10 },
    ],
  },
  {
    definitionId: 'seek-neutral-echo-pulse',
    type: 'Seeker',
    element: 'Neutrality',
    rarity: 'Rare',
    name: 'Echo Pulse',
    description: '+15 Oblivion per card played this turn (including this one). Draw 1 card.',
    artKey: 'seek_neutral_echo_pulse',
    effects: [
      { type: 'oblivion_flat', value: 0 }, // executor: (cardsPlayedThisTurn + 1) * 15
      { type: 'draw', value: 1 },
    ],
  },
  {
    definitionId: 'seek-neutral-seraph-hunt',
    type: 'Seeker',
    element: 'Neutrality',
    rarity: 'Rare',
    name: 'Seraph Hunt',
    description: 'Search your deck for any Seraphim card. Add it to your hand. Shuffle your deck.',
    artKey: 'seek_neutral_seraph_hunt',
    effects: [
      { type: 'search_deck_by_type', filter: ['Seraphim'] },
    ],
  },
  {
    definitionId: 'seek-neutral-nullfall',
    type: 'Seeker',
    element: 'Neutrality',
    rarity: 'Epic',
    name: 'Nullfall',
    description: 'Salvage 1 Seraphim and 1 Chaos card from your discard pile. Add them to your hand.',
    artKey: 'seek_neutral_nullfall',
    effects: [
      { type: 'salvage_by_type', filter: ['Seraphim', 'Chaos'] },
    ],
  },
];

export const neutralityCards = [
  ...neutralitySeraphims,
  ...neutralitySeekerCards,
  ...neutralityPackSeekerCards,
];
