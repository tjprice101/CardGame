import type { CherubimDefinition } from '@/types/cards';

// ── Starter Cherubim cards ────────────────────────────────────────────────────

export const neutralityStarterCherubimCards: CherubimDefinition[] = [
  {
    definitionId: 'cherubim-neutral-null-veil',
    type: 'Cherubim',
    element: 'Neutrality',
    rarity: 'Common',
    name: 'Null Veil',
    description: 'On play: Draw 1 card; Search your deck for 1 matching Seraphim. While on board: Buffs Seraphim attacks: base +31, chain bonus +0.04, cooldown -1, multiplier x1.00',
    artKey: 'cherubim_neutral_null_veil',
    maxDurability: 3,
    effects: [
      { type: 'cherubim_patience_per_card', value: 1 },
    ],
    onPlayEffects: [
      { type: 'draw', value: 1 },
      { type: 'search_deck_by_type', filter: ['Seraphim'] },
    ],
  },
  {
    definitionId: 'cherubim-neutral-void-shroud',
    type: 'Cherubim',
    element: 'Neutrality',
    rarity: 'Common',
    name: 'Void Shroud',
    description: 'On play: Shuffle discard into deck; Draw 1 card. While on board: Buffs Seraphim and Angel attacks: base +24, chain bonus +0.04, cooldown +0, multiplier x1.00',
    artKey: 'cherubim_neutral_void_shroud',
    maxDurability: 2,
    effects: [
      { type: 'cherubim_patience_per_card', value: 1 },
    ],
    onPlayEffects: [
      { type: 'shuffle_discard' },
      { type: 'draw', value: 1 },
    ],
  },
  {
    definitionId: 'cherubim-neutral-balance-mantle',
    type: 'Cherubim',
    element: 'Neutrality',
    rarity: 'Rare',
    name: 'Balance Mantle',
    description: 'On play: Search your deck for 1 matching Seraphim or Cherubim; Draw 1 card. While on board: Buffs Seraphim attacks: base +36, chain bonus +0.05, cooldown +0, multiplier x1.00',
    artKey: 'cherubim_neutral_balance_mantle',
    maxDurability: 3,
    effects: [
      { type: 'cherubim_patience_per_card', value: 2 },
    ],
    onPlayEffects: [
      { type: 'search_deck_by_type', filter: ['Seraphim', 'Cherubim'] },
      { type: 'draw', value: 1 },
    ],
  },
  {
    definitionId: 'cherubim-neutral-equilibrium-ward',
    type: 'Cherubim',
    element: 'Neutrality',
    rarity: 'Rare',
    name: 'Equilibrium Ward',
    description: 'On play: Look at the top 4 cards, take 1 card, and put the rest on the bottom. While on board: Buffs Seraphim attacks: base +36, chain bonus +0.05, cooldown +0, multiplier x1.00',
    artKey: 'cherubim_neutral_equilibrium_ward',
    maxDurability: 3,
    effects: [
      { type: 'cherubim_patience_per_card', value: 2 },
    ],
    onPlayEffects: [
      { type: 'look_top_take', look: 4, take: 1 },
    ],
  },
  {
    definitionId: 'cherubim-neutral-still-shell',
    type: 'Cherubim',
    element: 'Neutrality',
    rarity: 'Epic',
    name: 'Still Shell',
    description: 'On play: Salvage any 1 card; Draw 1 card. While on board: Buffs Seraphim attacks: base +54, chain bonus +0.06, cooldown -1, multiplier x1.00; Buffs Angel attacks: base +42, chain bonus +0.04, cooldown +0, multiplier x1.00',
    artKey: 'cherubim_neutral_still_shell',
    maxDurability: 3,
    effects: [
      { type: 'cherubim_patience_per_card', value: 3 },
    ],
    onPlayEffects: [
      { type: 'salvage_any' },
      { type: 'draw', value: 1 },
    ],
  },
];

// ── Pack-exclusive Cherubim cards ─────────────────────────────────────────────

export const neutralityPackCherubimCards: CherubimDefinition[] = [
  {
    definitionId: 'cherubim-neutral-null-fortify',
    type: 'Cherubim',
    element: 'Neutrality',
    rarity: 'Rare',
    name: 'Null Fortification',
    description: 'On play: Draw 2 cards; +40 Oblivion. While on board: Buffs Seraphim attacks: base +36, chain bonus +0.05, cooldown +0, multiplier x1.00',
    artKey: 'cherubim_neutral_null_fortify',
    maxDurability: 3,
    effects: [
      { type: 'cherubim_patience_per_card', value: 2 },
    ],
    onPlayEffects: [
      { type: 'draw', value: 2 },
      { type: 'oblivion_flat', value: 40 },
    ],
  },
  {
    definitionId: 'cherubim-neutral-void-amp',
    type: 'Cherubim',
    element: 'Neutrality',
    rarity: 'Epic',
    name: 'Void Amplifier',
    description: 'On play: +140 Oblivion; Draw 2 cards; Salvage any 1 card. While on board: Buffs Seraphim attacks: base +46, chain bonus +0.06, cooldown +0, multiplier x1.00; Buffs Angel attacks: base +36, chain bonus +0.04, cooldown +0, multiplier x1.00',
    artKey: 'cherubim_neutral_void_amp',
    maxDurability: 2,
    effects: [
      { type: 'cherubim_patience_per_card', value: 3 },
    ],
    onPlayEffects: [
      { type: 'oblivion_flat', value: 140 },
      { type: 'draw', value: 2 },
      { type: 'salvage_any' },
    ],
  },
];

export const neutralityCherubimCards = [
  ...neutralityStarterCherubimCards,
  ...neutralityPackCherubimCards,
];
