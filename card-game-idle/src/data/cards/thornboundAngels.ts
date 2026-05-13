import type { AngelDefinition } from '@/types/cards';

export const thornboundAngels: AngelDefinition[] = [
  {
    definitionId: 'tbp-angel-irielle-bramble-gate',
    type: 'Angel',
    element: 'Thornbound',
    rarity: 'Legendary',
    name: 'Irielle Thorn Saint of the Last Road',
    description: 'A saint bound in white thorns and scarlet vows. Converts suffering into momentum.',
    artKey: 'tbp_angel_irielle_bramble_gate',
    summonCost: ['tbp-ser-thornplate-sentry', 'tbp-ser-vinedusk-lancer'],
    extraSummonConditions: [{ type: 'chaos_active_gte', value: 1 }],
    onSummonEffects: [
      { type: 'trail_gain', value: 2 },
      { type: 'draw', value: 1 },
      { type: 'set_chain_floor', value: 1.35 },
    ],
    activatedAbility: {
      name: 'March Through Ruin',
      cardsPlayedRequirement: 4,
      description: 'Spend 3 Trail to gain +200 Oblivion and multiply your next card.',
      effects: [
        { type: 'trail_spend', value: 3 },
        { type: 'oblivion_flat', value: 200 },
        { type: 'multiply_next' },
      ],
    },
    baseStats: {
      basePower: 0,
      bonusType: 'oblivion_per_seraphim',
      bonusValue: 8,
    },
  },
  {
    definitionId: 'tbp-angel-velmora-harrowed-crown',
    type: 'Angel',
    element: 'Thornbound',
    rarity: 'Legendary',
    name: 'Velmora Crown of Harrowed Plains',
    description: 'The thorn-crowned sovereign who survives every march by bleeding the road itself.',
    artKey: 'tbp_angel_velmora_harrowed_crown',
    summonCost: ['tbp-ser-crimson-mire-exarch', 'tbp-ser-scar-mantle-reclaimer', 'tbp-ser-white-briar-penitent'],
    extraSummonConditions: [{ type: 'chaos_active_gte', value: 2 }],
    onSummonEffects: [
      { type: 'trail_gain', value: 4 },
      { type: 'oblivion_flat', value: 170 },
      { type: 'set_chain_floor', value: 1.5 },
    ],
    activatedAbility: {
      name: 'Blood-Road Apotheosis',
      cardsPlayedRequirement: 5,
      description: 'Spend all Trail: gain a massive flat +260 Oblivion finisher.',
      effects: [
        { type: 'trail_spend', value: 9999 },
        { type: 'oblivion_flat', value: 260 },
      ],
    },
    baseStats: {
      basePower: 0,
      bonusType: 'oblivion_per_card',
      bonusValue: 16,
    },
  },
];
