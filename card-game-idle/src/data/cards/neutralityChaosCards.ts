import type { CherubimDefinition } from '@/types/cards';

// -- Starter Cherubim cards (Neutrality) -----------------------------------------

export const neutralityStarterCherubimCards: CherubimDefinition[] = [
  {
    definitionId: 'cherubim-neutral-null-veil',
    type: 'Cherubim',
    element: 'Neutrality',
    rarity: 'Common',
    name: 'Null Veil',
    description: 'On play: Draw 1 card; Search your deck for 1 matching Seraphim. While on board: Buffs Seraphim attacks: base +31, chain scaling +0.04, cooldown -1, multiplier x1.00',
    artKey: 'cherubim_neutral_null_veil',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 10 }],
    onPlayEffects: [{ type: 'draw', value: 1 }, { type: 'oblivion_flat', value: 20 }],
  },
  {
    definitionId: 'cherubim-neutral-void-shroud',
    type: 'Cherubim',
    element: 'Neutrality',
    rarity: 'Common',
    name: 'Void Shroud',
    description: 'On play: Shuffle discard into deck; Draw 1 card. While on board: Buffs Seraphim and Angel attacks: base +24, chain scaling +0.04, cooldown +0, multiplier x1.00',
    artKey: 'cherubim_neutral_void_shroud',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 10 }],
    onPlayEffects: [{ type: 'shuffle_discard' }, { type: 'draw', value: 1 }],
  },
  {
    definitionId: 'cherubim-neutral-balance-mantle',
    type: 'Cherubim',
    element: 'Neutrality',
    rarity: 'Rare',
    name: 'Balance Mantle',
    description: 'On play: Search your deck for 1 matching Seraphim or Cherubim; Draw 1 card. While on board: Buffs Seraphim attacks: base +36, chain scaling +0.05, cooldown +0, multiplier x1.00',
    artKey: 'cherubim_neutral_balance_mantle',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 18 }],
    onPlayEffects: [{ type: 'search_deck_by_type', filter: ['Seraphim'] }, { type: 'oblivion_flat', value: 30 }],
  },
  {
    definitionId: 'cherubim-neutral-equilibrium-ward',
    type: 'Cherubim',
    element: 'Neutrality',
    rarity: 'Rare',
    name: 'Equilibrium Ward',
    description: 'On play: Look at the top 4 cards, take 1 card, and put the rest on the bottom. While on board: Buffs Seraphim attacks: base +36, chain scaling +0.05, cooldown +0, multiplier x1.00',
    artKey: 'cherubim_neutral_equilibrium_ward',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'chain', value: 0.05 }],
    onPlayEffects: [{ type: 'oblivion_flat', value: 30 }, { type: 'shuffle_discard' }, { type: 'draw', value: 1 }],
  },
  {
    definitionId: 'cherubim-neutral-still-shell',
    type: 'Cherubim',
    element: 'Neutrality',
    rarity: 'Epic',
    name: 'Still Shell',
    description: 'On play: Salvage any 1 card; Draw 1 card. While on board: Buffs Seraphim attacks: base +54, chain scaling +0.06, cooldown -1, multiplier x1.00; Buffs Angel attacks: base +42, chain scaling +0.04, cooldown +0, multiplier x1.00',
    artKey: 'cherubim_neutral_still_shell',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 20 }],
    onPlayEffects: [{ type: 'oblivion_flat', value: 50 }, { type: 'draw', value: 2 }],
  },
];

// -- Pack-exclusive Cherubim cards (Neutrality) -----------------------------------

export const neutralityPackCherubimCards: CherubimDefinition[] = [
  {
    definitionId: 'cherubim-neutral-null-fortify',
    type: 'Cherubim',
    element: 'Neutrality',
    rarity: 'Rare',
    name: 'Null Fortification',
    description: 'On play: Search your deck for 1 matching Seraphim; Draw 1 card; +40 Oblivion. While on board: Buffs Seraphim attacks: base +36, chain scaling +0.05, cooldown +0, multiplier x1.00',
    artKey: 'cherubim_neutral_null_fortify',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 15 }],
    onPlayEffects: [{ type: 'search_deck_by_type', filter: ['Seraphim'] }, { type: 'oblivion_flat', value: 40 }],
  },
  {
    definitionId: 'cherubim-neutral-void-amp',
    type: 'Cherubim',
    element: 'Neutrality',
    rarity: 'Epic',
    name: 'Void Amplifier',
    description: 'On play: +140 Oblivion; Draw 2 cards; Salvage any 1 card. While on board: Buffs Seraphim attacks: base +46, chain scaling +0.06, cooldown +0, multiplier x1.00; Buffs Angel attacks: base +36, chain scaling +0.04, cooldown +0, multiplier x1.00',
    artKey: 'cherubim_neutral_void_amp',
    effects: [{ type: 'cherubim_adjacent_seraphim_bonus', bonusType: 'oblivion', value: 12 }],
    onPlayEffects: [{ type: 'oblivion_flat', value: 200 }, { type: 'draw', value: 2 }],
  },
];

export const neutralityCherubimCards = [
  ...neutralityStarterCherubimCards,
  ...neutralityPackCherubimCards,
];
