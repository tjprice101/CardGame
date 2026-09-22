import type { CardDefinition } from '@/types/cards';

export const causalityInfiniteCards: CardDefinition[] = [
  {
    definitionId: 'inf-causality-origin-script', type: 'Light', rarity: 'Infinite', name: 'Origin Script of Every Tomorrow',
    description: 'An Infinite Causality Light that writes a vast Cosmos reserve before its attacks resolve.', artKey: 'inf_causality_origin_script',
    ainAttack: { id: 'inf-causality-origin-script:ain', label: 'Ain', name: 'First Possible Dawn', description: '6,500 base Divine Light with Collection Power scaling.', baseDivineLight: 6_500, cooldownCards: 2, scaling: { kind: 'linear', reads: 'collectionPower', multiplier: 4.2 }, tags: ['infinite', 'causality', 'ain-attack'] },
    sophAttack: { id: 'inf-causality-origin-script:soph', label: 'Soph', name: 'Tomorrow Multiplied', description: '10,000 base Divine Light with Collection Power scaling; consumes 5 Limitless Light Stacks.', baseDivineLight: 10_000, cooldownCards: 3, scaling: { kind: 'linear', reads: 'collectionPower', multiplier: 6.2 }, stackCost: { kind: 'fixed', value: 5 }, tags: ['infinite', 'causality', 'soph-attack'] },
    sophPlacementEffects: [{ type: 'cosmos_flat', value: 8 }, { type: 'draw', value: 2 }], sacrificeStackRate: 100,
  },
  {
    definitionId: 'inf-causality-chromatic-horizon', type: 'Light', rarity: 'Infinite', name: 'Chromatic Horizon Without End',
    description: 'Inspect the top 7 cards and keep 3, then convert 4 prepared Light into 9 Cosmos when possible.', artKey: 'inf_causality_chromatic_horizon',
    ainAttack: { id: 'inf-causality-chromatic-horizon:ain', label: 'Ain', name: 'Horizon Refraction', description: '7,200 base Divine Light with Collection Power scaling.', baseDivineLight: 7_200, cooldownCards: 2, scaling: { kind: 'linear', reads: 'collectionPower', multiplier: 4.8 }, tags: ['infinite', 'causality', 'ain-attack'] },
    sophAttack: { id: 'inf-causality-chromatic-horizon:soph', label: 'Soph', name: 'Endless Meridian', description: '11,500 base Divine Light with Collection Power scaling; consumes 6 Limitless Light Stacks.', baseDivineLight: 11_500, cooldownCards: 3, scaling: { kind: 'linear', reads: 'collectionPower', multiplier: 7 }, stackCost: { kind: 'fixed', value: 6 }, tags: ['infinite', 'causality', 'soph-attack'] },
    sophPlacementEffects: [{ type: 'look_top_take', look: 7, take: 3 }, { type: 'conditional', condition: { type: 'light_stacks_gte', value: 4 }, then: [{ type: 'convert_light_to_cosmos', lightCost: 4, cosmosGain: 9 }] }], sacrificeStackRate: 100,
  },
  {
    definitionId: 'inf-causality-law-eater', type: 'Dark', rarity: 'Infinite', name: 'Law-Eater of the Pearl Void',
    description: 'Search for all three card families; consume 4 Cosmos for 14,000 base Divine Light, 3 cards, and 10 Light Stacks.', artKey: 'inf_causality_law_eater',
    sophEffects: [{ type: 'search_deck_distinct_types', filter: ['Light', 'Dark', 'AinSophAur'], takePerType: 1 }, { type: 'conditional', condition: { type: 'cosmos_gte', value: 4 }, then: [{ type: 'consume_cosmos', value: 4 }, { type: 'divine_light_flat', value: 14_000 }, { type: 'draw', value: 3 }, { type: 'light_stacks_flat', value: 10 }] }],
    activationCost: { kind: 'fixed', value: 2 }, cooldownCardsPlayed: 3, postActivationFate: 'hand', sacrificeStackRate: 100, persistent: true,
  },
  {
    definitionId: 'inf-causality-archive-reborn', type: 'Dark', rarity: 'Infinite', name: 'Archive Reborn in Chromatic Ink',
    description: 'Recover one card of every family; consume 3 Cosmos to search all three families, shuffle discard, and gain 5 Cosmos.', artKey: 'inf_causality_archive_reborn',
    sophEffects: [{ type: 'salvage_by_type_count', filter: ['Light', 'Dark', 'AinSophAur'], count: 3 }, { type: 'conditional', condition: { type: 'cosmos_gte', value: 3 }, then: [{ type: 'consume_cosmos', value: 3 }, { type: 'search_deck_distinct_types', filter: ['Light', 'Dark', 'AinSophAur'], takePerType: 1 }, { type: 'shuffle_discard' }, { type: 'cosmos_flat', value: 5 }] }],
    activationCost: { kind: 'fixed', value: 2 }, cooldownCardsPlayed: 4, postActivationFate: 'hand', sacrificeStackRate: 100, persistent: true,
  },
  {
    definitionId: 'inf-causality-heart-beyond-all', type: 'AinSophAur', rarity: 'Infinite', name: 'Heart Beyond All Causality',
    description: 'Summon from three Ain-side cards to gain 10 Cosmos, draw 3, search all card families, and restore the discard pile.', artKey: 'inf_causality_heart_beyond_all',
    summonMaterialCount: 3, summonMaterials: [{ cardTypes: ['Light', 'Dark'], side: 'ain', count: 3 }],
    onSummonEffects: [{ type: 'cosmos_flat', value: 10 }, { type: 'draw', value: 3 }, { type: 'search_deck_distinct_types', filter: ['Light', 'Dark', 'AinSophAur'], takePerType: 1 }, { type: 'shuffle_discard' }],
    bridgeAttack: { id: 'inf-causality-heart-beyond-all:bridge', name: 'Bridge the Light', description: '15,000 base Divine Light with overwhelming Collection Power scaling; consumes 8 Limitless Light Stacks.', baseDivineLight: 15_000, cooldownCards: 2, scaling: { kind: 'linear', reads: 'collectionPower', multiplier: 9 }, consumesStacks: { kind: 'fixed', value: 8 } },
  },
];