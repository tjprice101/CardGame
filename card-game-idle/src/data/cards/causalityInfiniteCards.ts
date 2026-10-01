import type { CardDefinition, LightCardDefinition, SpectrumLevel } from '@/types/cards';
import {
  formatSpectrumNumber,
  getSpectrumAinBase,
  getSpectrumBridgeBase,
  getSpectrumScaling,
  getSpectrumSophBase,
} from './spectrumPower';

function attacks(id: string, level: SpectrumLevel, ainName: string, sophName: string, sophStacks: number): Pick<LightCardDefinition, 'ainAttack' | 'sophAttack'> {
  const ainBase = getSpectrumAinBase('Infinite', level, 'infinite');
  const sophBase = getSpectrumSophBase('Infinite', level, 'infinite');
  return {
    ainAttack: { id: `${id}:ain`, label: 'Ain', name: ainName, description: `${formatSpectrumNumber(ainBase)} base Divine Light with Collection Power scaling.`, baseDivineLight: ainBase, cooldownCards: 2, scaling: { kind: 'linear', reads: 'collectionPower', multiplier: getSpectrumScaling(ainBase) }, tags: ['infinite', 'causality', 'ain-attack'] },
    sophAttack: { id: `${id}:soph`, label: 'Soph', name: sophName, description: `${formatSpectrumNumber(sophBase)} base Divine Light with Collection Power scaling; consumes ${sophStacks} Limitless Light Stacks.`, baseDivineLight: sophBase, cooldownCards: 3, scaling: { kind: 'linear', reads: 'collectionPower', multiplier: getSpectrumScaling(sophBase) }, stackCost: { kind: 'fixed', value: sophStacks }, tags: ['infinite', 'causality', 'soph-attack'] },
  };
}

const heartBridge = getSpectrumBridgeBase('Infinite', 5, 'infinite');

export const causalityInfiniteCards: CardDefinition[] = [
  {
    definitionId: 'inf-causality-origin-script', type: 'Light', rarity: 'Infinite', spectrumLevel: 4, name: 'Origin Script of Every Tomorrow',
    description: 'Soph placement: write a vast reserve of 8 Cosmos, search for up to 2 Light and 2 Dark cards, and gain 6 Limitless Light Stacks.', artKey: 'inf_causality_origin_script',
    ...attacks('inf-causality-origin-script', 4, 'First Possible Dawn', 'Tomorrow Multiplied', 5),
    sophPlacementEffects: [{ type: 'cosmos_flat', value: 8 }, { type: 'search_deck_distinct_types', filter: ['Light', 'Dark'], takePerType: 2 }, { type: 'light_stacks_flat', value: 6 }], sacrificeStackRate: 100,
  },
  {
    definitionId: 'inf-causality-chromatic-horizon', type: 'Light', rarity: 'Infinite', spectrumLevel: 4, name: 'Chromatic Horizon Without End',
    description: 'Soph placement: inspect the top 7 cards and keep 3, then convert 4 prepared Light into 9 Cosmos when possible.', artKey: 'inf_causality_chromatic_horizon',
    ...attacks('inf-causality-chromatic-horizon', 4, 'Horizon Refraction', 'Endless Meridian', 6),
    sophPlacementEffects: [{ type: 'look_top_take', look: 7, take: 3 }, { type: 'conditional', condition: { type: 'light_stacks_gte', value: 4 }, then: [{ type: 'convert_light_to_cosmos', lightCost: 4, cosmosGain: 9 }] }], sacrificeStackRate: 100,
  },
  {
    definitionId: 'inf-causality-law-eater', type: 'Dark', rarity: 'Infinite', spectrumLevel: 5, name: 'Law-Eater of the Pearl Void',
    description: 'Search for 1 Light and 1 Dark card; consume 4 Cosmos for 14,000 base Divine Light, 3 cards, and 10 Light Stacks.', artKey: 'inf_causality_law_eater',
    sophEffects: [{ type: 'search_deck_distinct_types', filter: ['Light', 'Dark'], takePerType: 1 }, { type: 'conditional', condition: { type: 'cosmos_gte', value: 4 }, then: [{ type: 'consume_cosmos', value: 4 }, { type: 'divine_light_flat', value: 14_000 }, { type: 'draw', value: 3 }, { type: 'light_stacks_flat', value: 10 }] }],
    activationCost: { kind: 'fixed', value: 2 }, cooldownCardsPlayed: 3, postActivationFate: 'hand', sacrificeStackRate: 100, persistent: true,
  },
  {
    definitionId: 'inf-causality-archive-reborn', type: 'Dark', rarity: 'Infinite', spectrumLevel: 4, name: 'Archive Reborn in Chromatic Ink',
    description: 'Recover 1 Light and 1 Dark card; consume 3 Cosmos to search for 1 Light and 1 Dark card, shuffle discard, and gain 5 Cosmos.', artKey: 'inf_causality_archive_reborn',
    sophEffects: [{ type: 'salvage_by_type_count', filter: ['Light', 'Dark'], count: 2 }, { type: 'conditional', condition: { type: 'cosmos_gte', value: 3 }, then: [{ type: 'consume_cosmos', value: 3 }, { type: 'search_deck_distinct_types', filter: ['Light', 'Dark'], takePerType: 1 }, { type: 'shuffle_discard' }, { type: 'cosmos_flat', value: 5 }] }],
    activationCost: { kind: 'fixed', value: 2 }, cooldownCardsPlayed: 4, postActivationFate: 'hand', sacrificeStackRate: 100, persistent: true,
  },
  {
    definitionId: 'inf-causality-heart-beyond-all', type: 'AinSophAur', rarity: 'Infinite', spectrumLevel: 5, name: 'Heart Beyond All Causality',
    description: 'Summon from three Ain-side cards to gain 10 Cosmos, draw 3, search all card families, and restore the discard pile.', artKey: 'inf_causality_heart_beyond_all',
    summonMaterialCount: 3, summonMaterials: [{ cardTypes: ['Light', 'Dark'], side: 'ain', count: 3 }],
    onSummonEffects: [{ type: 'cosmos_flat', value: 10 }, { type: 'draw', value: 3 }, { type: 'search_deck_distinct_types', filter: ['Light', 'Dark'], takePerType: 1 }, { type: 'shuffle_discard' }],
    bridgeAttack: { id: 'inf-causality-heart-beyond-all:bridge', name: 'Bridge the Light', description: `${formatSpectrumNumber(heartBridge)} base Divine Light with overwhelming Collection Power scaling; consumes 8 Limitless Light Stacks.`, baseDivineLight: heartBridge, cooldownCards: 2, scaling: { kind: 'linear', reads: 'collectionPower', multiplier: getSpectrumScaling(heartBridge) }, consumesStacks: { kind: 'fixed', value: 8 } },
  },
];
