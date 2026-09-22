import type { AinSophAurDefinition, DarkCardDefinition, LightCardDefinition } from '@/types/cards';

const LIGHT_NAMES = [
  'Eventide Archivist', 'Horizon Silk', 'Black-Star Crane', 'Mandate of Falling Suns', 'Heavenly Singularity',
  'Orbit-Scribe', 'White Aperture', 'Ninefold Eclipse', 'Celestial Debt', 'Last Meridian',
] as const;

const DARK_NAMES = [
  'Gravitic Testament', 'Abyssal Ledger', 'Black Hole Sutra', 'Collapsed Mandate', 'Horizon Taxonomist',
  'Eventide Reversal', 'Void-Thread Seal', 'Ashen Orbit', 'Causal Undertow', 'The Unwritten Mass',
] as const;

const ASA_NAMES = [
  'The Horizon Sovereign', 'Asterion of the Last Gate', 'Heavenly Collapse Engine', 'The Black-White Pilgrim', 'Causality Unbound',
] as const;

const artKey = (type: 'light' | 'dark' | 'asa', index: number) => `causality_${type}_${index + 1}`;

const LIGHT_IDENTITIES: Pick<LightCardDefinition, 'description' | 'sophPlacementEffects'>[] = [
  { description: 'Open the first page: gain 1 Cosmos, then inspect the top 2 cards and keep 1.', sophPlacementEffects: [{ type: 'cosmos_flat', value: 1 }, { type: 'look_top_take', look: 2, take: 1 }] },
  { description: 'Weave prepared Light into Cosmos, then draw deeper into the manuscript.', sophPlacementEffects: [{ type: 'conditional', condition: { type: 'light_stacks_gte', value: 2 }, then: [{ type: 'convert_light_to_cosmos', lightCost: 2, cosmosGain: 3 }, { type: 'draw', value: 1 }] }] },
  { description: 'Gain 1 Cosmos and recover a Light card from discard.', sophPlacementEffects: [{ type: 'cosmos_flat', value: 1 }, { type: 'salvage_by_type_count', filter: ['Light'], count: 1 }] },
  { description: 'Convert 2 Light into 3 Cosmos and choose a Dark card from the top 4.', sophPlacementEffects: [{ type: 'conditional', condition: { type: 'light_stacks_gte', value: 2 }, then: [{ type: 'convert_light_to_cosmos', lightCost: 2, cosmosGain: 3 }, { type: 'look_top_take_type', look: 4, filter: ['Dark'], take: 1 }] }] },
  { description: 'Gain 2 Cosmos, discard 1 card, then draw 2.', sophPlacementEffects: [{ type: 'cosmos_flat', value: 2 }, { type: 'discard_draw', discard: 1, draw: 2 }] },
  { description: 'Gain 2 Cosmos and draw 2 cards as the orbit completes.', sophPlacementEffects: [{ type: 'cosmos_flat', value: 2 }, { type: 'draw', value: 2 }] },
  { description: 'Convert 2 Light into 4 Cosmos, then inspect the top 5 cards and keep 2.', sophPlacementEffects: [{ type: 'conditional', condition: { type: 'light_stacks_gte', value: 2 }, then: [{ type: 'convert_light_to_cosmos', lightCost: 2, cosmosGain: 4 }, { type: 'look_top_take', look: 5, take: 2 }] }] },
  { description: 'Gain 3 Cosmos, discard 1 card, draw 3, then shuffle discard into the deck.', sophPlacementEffects: [{ type: 'cosmos_flat', value: 3 }, { type: 'discard_draw', discard: 1, draw: 3 }, { type: 'shuffle_discard' }] },
  { description: 'Convert 3 Light into 6 Cosmos, then search for one Light and one Dark.', sophPlacementEffects: [{ type: 'conditional', condition: { type: 'light_stacks_gte', value: 3 }, then: [{ type: 'convert_light_to_cosmos', lightCost: 3, cosmosGain: 6 }, { type: 'search_deck_distinct_types', filter: ['Light', 'Dark'], takePerType: 1 }] }] },
  { description: 'Gain 4 Cosmos, recover any card, and draw 2 when the final meridian opens.', sophPlacementEffects: [{ type: 'cosmos_flat', value: 4 }, { type: 'salvage_any' }, { type: 'draw', value: 2 }] },
];

const DARK_IDENTITIES: Pick<DarkCardDefinition, 'description' | 'sophEffects' | 'activationCost' | 'cooldownCardsPlayed' | 'postActivationFate' | 'persistent'>[] = [
  { description: 'Draw 1; if you hold Cosmos, consume 1 to gain 3 Light Stacks.', sophEffects: [{ type: 'draw', value: 1 }, { type: 'conditional', condition: { type: 'cosmos_gte', value: 1 }, then: [{ type: 'consume_cosmos', value: 1 }, { type: 'light_stacks_flat', value: 3 }] }], activationCost: { kind: 'fixed', value: 0 }, postActivationFate: 'discard' },
  { description: 'Shuffle discard into the deck; consume 1 Cosmos to recover any discarded card.', sophEffects: [{ type: 'shuffle_discard' }, { type: 'conditional', condition: { type: 'cosmos_gte', value: 1 }, then: [{ type: 'consume_cosmos', value: 1 }, { type: 'salvage_any' }] }], activationCost: { kind: 'fixed', value: 0 }, postActivationFate: 'deck' },
  { description: 'Inspect the top 3 cards and keep 1; consume 1 Cosmos to gain 4 Light Stacks.', sophEffects: [{ type: 'look_top_take', look: 3, take: 1 }, { type: 'conditional', condition: { type: 'cosmos_gte', value: 1 }, then: [{ type: 'consume_cosmos', value: 1 }, { type: 'light_stacks_flat', value: 4 }] }], activationCost: { kind: 'fixed', value: 0 }, postActivationFate: 'hand' },
  { description: 'Discard 1 and draw 2; consume 1 Cosmos to search for a Light card.', sophEffects: [{ type: 'discard_draw', discard: 1, draw: 2 }, { type: 'conditional', condition: { type: 'cosmos_gte', value: 1 }, then: [{ type: 'consume_cosmos', value: 1 }, { type: 'search_deck_by_type', filter: ['Light'] }] }], activationCost: { kind: 'fixed', value: 1 }, cooldownCardsPlayed: 2, postActivationFate: 'hand', persistent: true },
  { description: 'Search for a Dark card; consume 1 Cosmos to recover a Light card from discard.', sophEffects: [{ type: 'search_deck_by_type', filter: ['Dark'] }, { type: 'conditional', condition: { type: 'cosmos_gte', value: 1 }, then: [{ type: 'consume_cosmos', value: 1 }, { type: 'salvage_by_type_count', filter: ['Light'], count: 1 }] }], activationCost: { kind: 'fixed', value: 0 }, postActivationFate: 'discard' },
  { description: 'Discard 1 and draw 3; consume 2 Cosmos to gain 6 Light Stacks.', sophEffects: [{ type: 'discard_draw', discard: 1, draw: 3 }, { type: 'conditional', condition: { type: 'cosmos_gte', value: 2 }, then: [{ type: 'consume_cosmos', value: 2 }, { type: 'light_stacks_flat', value: 6 }] }], activationCost: { kind: 'fixed', value: 1 }, cooldownCardsPlayed: 3, postActivationFate: 'hand', persistent: true },
  { description: 'Search for a Light and Dark card; consume 2 Cosmos to draw 2 more.', sophEffects: [{ type: 'search_deck_distinct_types', filter: ['Light', 'Dark'], takePerType: 1 }, { type: 'conditional', condition: { type: 'cosmos_gte', value: 2 }, then: [{ type: 'consume_cosmos', value: 2 }, { type: 'draw', value: 2 }] }], activationCost: { kind: 'fixed', value: 1 }, cooldownCardsPlayed: 3, postActivationFate: 'hand', persistent: true },
  { description: 'Inspect the top 5 cards and keep 2; consume 2 Cosmos to recover any card.', sophEffects: [{ type: 'look_top_take', look: 5, take: 2 }, { type: 'conditional', condition: { type: 'cosmos_gte', value: 2 }, then: [{ type: 'consume_cosmos', value: 2 }, { type: 'salvage_any' }] }], activationCost: { kind: 'fixed', value: 1 }, cooldownCardsPlayed: 3, postActivationFate: 'hand', persistent: true },
  { description: 'Recover a Light and a Dark card; consume 3 Cosmos to gain 10 Light Stacks and draw 2.', sophEffects: [{ type: 'salvage_by_type_count', filter: ['Light', 'Dark'], count: 2 }, { type: 'conditional', condition: { type: 'cosmos_gte', value: 3 }, then: [{ type: 'consume_cosmos', value: 3 }, { type: 'light_stacks_flat', value: 10 }, { type: 'draw', value: 2 }] }], activationCost: { kind: 'fixed', value: 1 }, cooldownCardsPlayed: 4, postActivationFate: 'hand', persistent: true },
  { description: 'Inspect the top 6 cards and keep 3; consume 3 Cosmos to discard 2 and draw 5, shuffle discard, then gain 12 Light Stacks.', sophEffects: [{ type: 'look_top_take', look: 6, take: 3 }, { type: 'conditional', condition: { type: 'cosmos_gte', value: 3 }, then: [{ type: 'consume_cosmos', value: 3 }, { type: 'discard_draw', discard: 2, draw: 5 }, { type: 'shuffle_discard' }, { type: 'light_stacks_flat', value: 12 }] }], activationCost: { kind: 'fixed', value: 1 }, cooldownCardsPlayed: 4, postActivationFate: 'hand', persistent: true },
];

export const causalityLightCards: LightCardDefinition[] = LIGHT_NAMES.map((name, index) => {
  const id = `light-causality-${index + 1}`;
  const identity = LIGHT_IDENTITIES[index]!;
  return {
    definitionId: id,
    type: 'Light',
    rarity: index < 5 ? 'Rare' : index < 9 ? 'Epic' : 'Legendary',
    name,
    description: identity.description,
    artKey: artKey('light', index),
    ainAttack: {
      id: `${id}:ain-attack`, label: 'Ain', name: 'Ain Attack',
      description: 'Steady Divine Light gain with Collection Power scaling.',
      baseDivineLight: 180 + index * 35, cooldownCards: 2 + (index % 3),
      scaling: { kind: 'linear', reads: 'collectionPower', multiplier: (140 + index * 20) / 1000 }, tags: ['causality', 'ain-attack'],
    },
    sophAttack: {
      id: `${id}:soph-attack`, label: 'Soph', name: 'Soph Attack',
      description: 'Stronger Divine Light burst that consumes Limitless Light Stacks.',
      baseDivineLight: 260 + index * 45, cooldownCards: 3 + (index % 4),
      scaling: { kind: 'linear', reads: 'collectionPower', multiplier: (220 + index * 25) / 1000 },
      stackCost: { kind: 'fixed', value: 1 + (index % 4) }, tags: ['causality', 'soph-attack'],
    },
    sophPlacementEffects: identity.sophPlacementEffects,
    sacrificeStackRate: 22 + index * 3,
  };
});

export const causalityDarkCards: DarkCardDefinition[] = DARK_NAMES.map((name, index) => {
  const id = `dark-causality-${index + 1}`;
  const identity = DARK_IDENTITIES[index]!;
  return {
    definitionId: id,
    type: 'Dark',
    rarity: index < 5 ? 'Rare' : index < 9 ? 'Epic' : 'Legendary',
    name,
    description: identity.description,
    artKey: artKey('dark', index),
    sophEffects: identity.sophEffects,
    activationCost: identity.activationCost,
    cooldownCardsPlayed: identity.cooldownCardsPlayed,
    postActivationFate: identity.postActivationFate,
    sacrificeStackRate: 24 + index * 3,
    persistent: identity.persistent,
  };
});

export const causalityAinSophAurCards: AinSophAurDefinition[] = ASA_NAMES.map((name, index) => {
  const id = `ain-soph-aur-causality-${index + 1}`;
  const summonProfiles: Array<Pick<AinSophAurDefinition, 'description' | 'summonMaterialCount' | 'summonMaterials' | 'onSummonEffects'>> = [
    { description: 'Summon with Eventide Archivist and any Dark card; open the sovereign horizon with 3 Cosmos and two cards.', summonMaterialCount: 2, summonMaterials: [{ definitionIds: ['light-causality-1'], count: 1 }, { cardTypes: ['Dark'], side: 'any', count: 1 }], onSummonEffects: [{ type: 'cosmos_flat', value: 3 }, { type: 'draw', value: 2 }] },
    { description: 'Summon with Heavenly Singularity and Horizon Taxonomist; convert prepared Light and search the archive.', summonMaterialCount: 2, summonMaterials: [{ definitionIds: ['light-causality-5'], count: 1 }, { definitionIds: ['dark-causality-5'], count: 1 }], onSummonEffects: [{ type: 'conditional', condition: { type: 'light_stacks_gte', value: 2 }, then: [{ type: 'convert_light_to_cosmos', lightCost: 2, cosmosGain: 5 }, { type: 'search_deck_by_type', filter: ['Dark'] }] }] },
    { description: 'Summon with two Light cards and Gravitic Testament; generate 5 Cosmos and recover any card.', summonMaterialCount: 3, summonMaterials: [{ cardTypes: ['Light'], side: 'any', count: 2 }, { definitionIds: ['dark-causality-1'], count: 1 }], onSummonEffects: [{ type: 'cosmos_flat', value: 5 }, { type: 'salvage_any' }] },
    { description: 'Summon with Black-Star Crane and Abyssal Ledger; consume Cosmos to refill hand and restore Light.', summonMaterialCount: 2, summonMaterials: [{ definitionIds: ['light-causality-3'], count: 1 }, { definitionIds: ['dark-causality-2'], count: 1 }], onSummonEffects: [{ type: 'conditional', condition: { type: 'cosmos_gte', value: 2 }, then: [{ type: 'consume_cosmos', value: 2 }, { type: 'draw', value: 3 }, { type: 'light_stacks_flat', value: 8 }] }] },
    { description: 'Summon with Last Meridian and The Unwritten Mass; rewrite the whole archive with 8 Cosmos and Light/Dark searches.', summonMaterialCount: 2, summonMaterials: [{ definitionIds: ['light-causality-10'], count: 1 }, { definitionIds: ['dark-causality-10'], count: 1 }], onSummonEffects: [{ type: 'cosmos_flat', value: 8 }, { type: 'search_deck_distinct_types', filter: ['Light', 'Dark'], takePerType: 1 }, { type: 'shuffle_discard' }] },
  ];
  const profile = summonProfiles[index]!;
  return {
    definitionId: id,
    type: 'AinSophAur',
    rarity: 'Legendary',
    name,
    description: profile.description,
    artKey: artKey('asa', index),
    summonMaterialCount: profile.summonMaterialCount,
    summonMaterials: profile.summonMaterials,
    onSummonEffects: profile.onSummonEffects,
    bridgeAttack: {
      id: `${id}:bridge-the-light`, name: 'Bridge the Light',
      description: 'Bridge the event horizon for a Collection Power-scaled Divine Light payout.',
      baseDivineLight: 650 + index * 120, cooldownCards: 2 + (index % 3),
      scaling: { kind: 'linear', reads: 'collectionPower', multiplier: (500 + index * 80) / 1000 },
      consumesStacks: { kind: 'fixed', value: 2 + (index % 3) },
    },
  };
});

export const causalityCards = [
  ...causalityLightCards,
  ...causalityDarkCards,
  ...causalityAinSophAurCards,
] as const;

export const CAUSALITY_PACK_POOL = causalityCards.map(card => card.definitionId);
