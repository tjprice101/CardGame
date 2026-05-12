import type { AngelDefinition } from '@/types/cards';

export const neutralityAngels: AngelDefinition[] = [
  {
    definitionId: 'angel-neutral-beginning',
    type: 'Angel',
    element: 'Neutrality',
    rarity: 'Common',
    name: 'The Beginning of the End',
    description: 'Summon: send 2 Null Seraphim from the board to your discard pile. Draw 3 cards. Universal Synergy — all Seraphim gain their synergy bonus. +15 Oblivion per card played while on the board.',
    artKey: 'angel_neutral_beginning',
    summonCost: ['ser-neutral-null', 'ser-neutral-null'],
    onSummonEffects: [{ type: 'draw', value: 3 }],
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 15 },
  },
  {
    definitionId: 'angel-neutral-presence',
    type: 'Angel',
    element: 'Neutrality',
    rarity: 'Legendary',
    name: 'Aegis of Presence',
    description: 'Summon: send Null + Equilibrium Seraphim from the board to your discard pile. Draw 4 cards. Universal Synergy. +22 Oblivion per card played while on the board.',
    artKey: 'angel_neutral_presence',
    summonCost: ['ser-neutral-null', 'ser-neutral-equilibrium'],
    onSummonEffects: [{ type: 'draw', value: 4 }],
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 22 },
  },
  {
    definitionId: 'angel-neutral-equilibrium',
    type: 'Angel',
    element: 'Neutrality',
    rarity: 'Legendary',
    name: 'Aegis of Equilibrium',
    description: 'Summon: requires 1 Equilibrium Seraphim + 1 active Chaos card. Send the Seraphim to your discard pile (Chaos stays). Draw 3 cards. Sets the chain multiplier to ×2.0 immediately. Universal Synergy. +0.10 additional chain growth per card played.',
    artKey: 'angel_neutral_equilibrium',
    summonCost: ['ser-neutral-equilibrium'],
    extraSummonConditions: [{ type: 'chaos_active_gte', value: 1 }],
    onSummonEffects: [
      { type: 'draw', value: 3 },
      { type: 'chain_multiplier_set', value: 2.0 },
    ],
    baseStats: { basePower: 0, bonusType: 'chain_bonus', bonusValue: 0.10 },
  },
];

