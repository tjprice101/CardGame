import type { AngelDefinition } from '@/types/cards';

export const neutralityAngels: AngelDefinition[] = [
  {
    definitionId: 'angel-neutral-beginning',
    type: 'Angel',
    element: 'Neutrality',
    rarity: 'Common',
    name: 'The Beginning and the End',
    description: 'Summon: sacrifice 2 Null Seraphim. Draw 3 cards and set chain floor to ×1.4. After 3 cards: right-click to draw 4, shuffle your discard pile into the deck, and set chain floor to ×2.0. While on board: +20 Oblivion per card played.',
    artKey: 'angel_neutral_beginning',
    summonCost: ['ser-neutral-null', 'ser-neutral-null'],
    onSummonEffects: [
      { type: 'draw', value: 3 },
      { type: 'set_chain_floor', value: 1.4 },
    ],
    activatedAbility: {
      name: 'Paradox Bloom',
      cardsPlayedRequirement: 3,
      description: 'Draw 4 cards, shuffle your discard pile into the deck, and set chain floor to ×2.0.',
      effects: [
        { type: 'draw', value: 4 },
        { type: 'shuffle_discard' },
        { type: 'set_chain_floor', value: 2.0 },
      ],
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 20 },
  },
  {
    definitionId: 'angel-neutral-presence',
    type: 'Angel',
    element: 'Neutrality',
    rarity: 'Legendary',
    name: 'Aegis of Presence',
    description: 'Summon: sacrifice The Beginning and the End + Equilibrium Seraphim. Draw 4 cards and gain +120 Oblivion. After 4 cards: right-click to draw 5, salvage any card from your discard pile, and set chain floor to ×2.4. While on board: +35 Oblivion per Seeker card played.',
    artKey: 'angel_neutral_presence',
    summonCost: ['angel-neutral-beginning', 'ser-neutral-equilibrium'],
    onSummonEffects: [
      { type: 'draw', value: 4 },
      { type: 'oblivion_flat', value: 120 },
    ],
    activatedAbility: {
      name: 'Presence Absolute',
      cardsPlayedRequirement: 4,
      description: 'Draw 5 cards, salvage any card from your discard pile, and set chain floor to ×2.4.',
      effects: [
        { type: 'draw', value: 5 },
        { type: 'salvage_any' },
        { type: 'set_chain_floor', value: 2.4 },
      ],
    },
    baseStats: { basePower: 0, bonusType: 'seeker_bonus', bonusValue: 35 },
  },
  {
    definitionId: 'angel-neutral-equilibrium',
    type: 'Angel',
    element: 'Neutrality',
    rarity: 'Legendary',
    name: 'Aegis of Equilibrium',
    description: 'Summon: sacrifice Aegis of Presence + Still Seraphim. Requires 1+ active Chaos card. Draw 4, shuffle your discard pile into the deck, and set chain multiplier to ×2.2. After 5 cards: right-click to draw 4, empower the next card, set chain floor to ×2.5, and gain +250 Oblivion. While on board: chain multiplier grows +0.14 faster per card played.',
    artKey: 'angel_neutral_equilibrium',
    summonCost: ['angel-neutral-presence', 'ser-neutral-still'],
    extraSummonConditions: [{ type: 'chaos_active_gte', value: 1 }],
    onSummonEffects: [
      { type: 'draw', value: 4 },
      { type: 'shuffle_discard' },
      { type: 'chain_multiplier_set', value: 2.2 },
    ],
    activatedAbility: {
      name: 'Final Measure',
      cardsPlayedRequirement: 5,
      description: 'Draw 4 cards, empower the next card, set chain floor to ×2.5, and gain +250 Oblivion.',
      effects: [
        { type: 'draw', value: 4 },
        { type: 'multiply_next' },
        { type: 'set_chain_floor', value: 2.5 },
        { type: 'oblivion_flat', value: 250 },
      ],
    },
    baseStats: { basePower: 0, bonusType: 'chain_bonus', bonusValue: 0.14 },
  },
];

