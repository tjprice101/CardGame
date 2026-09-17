import type { CardDefinition } from '@/types/cards';

export const causalityInfiniteCards: CardDefinition[] = [
  {
    definitionId: 'inf-causality-origin-script', type: 'Light', rarity: 'Infinite', name: 'Origin Script of Every Tomorrow',
    description: 'An Infinite Causality Light that writes a vast Cosmos reserve before its attacks resolve.', artKey: 'inf_causality_origin_script',
    ainAttack: { id: 'inf-causality-origin-script:ain', label: 'Ain', name: 'First Possible Dawn', description: '6,500 base Divine Light with extreme triune scaling.', baseDivineLight: 6_500, cooldownCards: 2, scaling: { kind: 'triune', amount: 4_200 }, tags: ['infinite', 'causality', 'ain-attack'] },
    sophAttack: { id: 'inf-causality-origin-script:soph', label: 'Soph', name: 'Tomorrow Multiplied', description: '10,000 base Divine Light with extreme triune scaling; consumes 5 stacks.', baseDivineLight: 10_000, cooldownCards: 3, scaling: { kind: 'triune', amount: 6_200 }, stackCost: { kind: 'fixed', value: 5 }, tags: ['infinite', 'causality', 'soph-attack'] },
    sophPlacementEffects: [{ type: 'cosmos_flat', value: 8 }, { type: 'draw', value: 2 }], sacrificeStackRate: 100,
  },
  {
    definitionId: 'inf-causality-chromatic-horizon', type: 'Light', rarity: 'Infinite', name: 'Chromatic Horizon Without End',
    description: 'Converts prepared Light into a pearlescent event horizon and attacks through every possible outcome.', artKey: 'inf_causality_chromatic_horizon',
    ainAttack: { id: 'inf-causality-chromatic-horizon:ain', label: 'Ain', name: 'Horizon Refraction', description: '7,200 base Divine Light with extreme triune scaling.', baseDivineLight: 7_200, cooldownCards: 2, scaling: { kind: 'triune', amount: 4_800 }, tags: ['infinite', 'causality', 'ain-attack'] },
    sophAttack: { id: 'inf-causality-chromatic-horizon:soph', label: 'Soph', name: 'Endless Meridian', description: '11,500 base Divine Light with extreme triune scaling; consumes 6 stacks.', baseDivineLight: 11_500, cooldownCards: 3, scaling: { kind: 'triune', amount: 7_000 }, stackCost: { kind: 'fixed', value: 6 }, tags: ['infinite', 'causality', 'soph-attack'] },
    sophPlacementEffects: [{ type: 'conditional', condition: { type: 'light_stacks_gte', value: 4 }, then: [{ type: 'convert_light_to_cosmos', lightCost: 4, cosmosGain: 9 }] }], sacrificeStackRate: 100,
  },
  {
    definitionId: 'inf-causality-law-eater', type: 'Dark', rarity: 'Infinite', name: 'Law-Eater of the Pearl Void',
    description: 'Consume 4 Limitless Cosmos to gain 14,000 base Divine Light, draw 3 cards, and recover 10 Limitless Light Stacks.', artKey: 'inf_causality_law_eater',
    sophEffects: [{ type: 'conditional', condition: { type: 'cosmos_gte', value: 4 }, then: [{ type: 'consume_cosmos', value: 4 }, { type: 'divine_light_flat', value: 14_000 }, { type: 'draw', value: 3 }, { type: 'light_stacks_flat', value: 10 }] }],
    activationCost: { kind: 'fixed', value: 2 }, cooldownCardsPlayed: 3, postActivationFate: 'hand', sacrificeStackRate: 100, persistent: true,
  },
  {
    definitionId: 'inf-causality-archive-reborn', type: 'Dark', rarity: 'Infinite', name: 'Archive Reborn in Chromatic Ink',
    description: 'Consume 3 Limitless Cosmos to search every card family, shuffle discard, and generate a new Cosmos reserve.', artKey: 'inf_causality_archive_reborn',
    sophEffects: [{ type: 'conditional', condition: { type: 'cosmos_gte', value: 3 }, then: [{ type: 'consume_cosmos', value: 3 }, { type: 'search_deck_distinct_types', filter: ['Light', 'Dark', 'AinSophAur'], takePerType: 1 }, { type: 'shuffle_discard' }, { type: 'cosmos_flat', value: 5 }] }],
    activationCost: { kind: 'fixed', value: 2 }, cooldownCardsPlayed: 4, postActivationFate: 'hand', sacrificeStackRate: 100, persistent: true,
  },
  {
    definitionId: 'inf-causality-heart-beyond-all', type: 'AinSophAur', rarity: 'Infinite', name: 'Heart Beyond All Causality',
    description: 'The ultimate Causality Ain Soph Aur, summoned from three prepared back-row cards to break the event horizon.', artKey: 'inf_causality_heart_beyond_all',
    summonMaterialCount: 3, summonMaterials: [{ cardTypes: ['Light', 'Dark'], side: 'ain', count: 3 }],
    onSummonEffects: [{ type: 'cosmos_flat', value: 10 }, { type: 'divine_light_flat', value: 4_000 }, { type: 'draw', value: 2 }],
    bridgeAttack: { id: 'inf-causality-heart-beyond-all:bridge', name: 'Bridge the Light', description: '15,000 base Divine Light with overwhelming triune scaling.', baseDivineLight: 15_000, cooldownCards: 2, scaling: { kind: 'triune', amount: 9_000 }, consumesStacks: { kind: 'fixed', value: 8 } },
  },
];