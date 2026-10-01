import type { AinSophAurDefinition, CardRarity, DarkCardDefinition, LightCardDefinition, SpectrumLevel } from '@/types/cards';
import {
  formatSpectrumNumber,
  getSpectrumAinBase,
  getSpectrumBridgeBase,
  getSpectrumScaling,
  getSpectrumSophBase,
} from './spectrumPower';

const ENIGMA: CardRarity = 'Enigmatic';

function ainAttack(id: string, level: SpectrumLevel, name: string, flavor: string, cooldownCards: number, tags: string[]): LightCardDefinition['ainAttack'] {
  const base = getSpectrumAinBase(ENIGMA, level, 'enigma');
  return {
    id: `${id}:ain-attack`, label: 'Ain', name,
    description: `${flavor} ${formatSpectrumNumber(base)} base Divine Light; scales with Collection Power.`,
    baseDivineLight: base, cooldownCards,
    scaling: { kind: 'linear', reads: 'collectionPower', multiplier: getSpectrumScaling(base) }, tags,
  };
}

function sophAttack(id: string, level: SpectrumLevel, name: string, flavor: string, cooldownCards: number, stacks: number, tags: string[]): LightCardDefinition['sophAttack'] {
  const base = getSpectrumSophBase(ENIGMA, level, 'enigma');
  return {
    id: `${id}:soph-attack`, label: 'Soph', name,
    description: `${flavor} ${formatSpectrumNumber(base)} base Divine Light; scales with Collection Power; consumes ${stacks} Limitless Light Stacks.`,
    baseDivineLight: base, cooldownCards,
    scaling: { kind: 'linear', reads: 'collectionPower', multiplier: getSpectrumScaling(base) },
    stackCost: { kind: 'fixed', value: stacks }, tags,
  };
}

function bridge(id: string, level: SpectrumLevel, cooldownCards: number, stacks: number): NonNullable<AinSophAurDefinition['bridgeAttack']> {
  const base = getSpectrumBridgeBase(ENIGMA, level, 'enigma');
  return {
    id: `${id}:bridge`, name: 'Bridge the Light',
    description: `${formatSpectrumNumber(base)} base Divine Light with Collection Power scaling.`,
    baseDivineLight: base, cooldownCards,
    scaling: { kind: 'linear', reads: 'collectionPower', multiplier: getSpectrumScaling(base) },
    consumesStacks: { kind: 'fixed', value: stacks },
  };
}

export const enigmaRewardCards: Array<LightCardDefinition | DarkCardDefinition | AinSophAurDefinition> = [
  {
    definitionId: 'enig-causality-horizon-weaver', type: 'Light', rarity: 'Enigmatic', spectrumLevel: 2, name: 'Horizon Weaver',
    description: 'A living thread of the event horizon. Soph placement: gain 2 Cosmos, then look at the top 5 cards, take 1, put 2 on the bottom, and discard the rest.',
    artKey: 'enig_causality_horizon_weaver',
    ainAttack: ainAttack('enig-causality-horizon-weaver', 2, 'First Thread', 'Opens the first thread of the horizon.', 3, ['enigma', 'causality', 'ain-attack']),
    sophAttack: sophAttack('enig-causality-horizon-weaver', 2, 'Second Thread', 'Pulls the horizon taut into a larger burst.', 4, 2, ['enigma', 'causality', 'soph-attack']),
    sophPlacementEffects: [{ type: 'cosmos_flat', value: 2 }, { type: 'look_top_take_drop', look: 5, take: 1, drop: 2 }],
    sacrificeStackRate: 80,
  },
  {
    definitionId: 'enig-causality-ink-of-the-first-law', type: 'Dark', rarity: 'Enigmatic', spectrumLevel: 2, name: 'Ink of the First Law',
    description: 'Inspect the top 4 cards for a Light or Dark card; consume 1 Cosmos to recover any discarded card.',
    artKey: 'enig_causality_ink_of_the_first_law',
    sophEffects: [{ type: 'look_top_take_type', look: 4, filter: ['Light', 'Dark'], take: 1 }, { type: 'conditional', condition: { type: 'cosmos_gte', value: 1 }, then: [{ type: 'consume_cosmos', value: 1 }, { type: 'salvage_any' }] }], activationCost: { kind: 'fixed', value: 1 },
    cooldownCardsPlayed: 3, postActivationFate: 'hand', sacrificeStackRate: 78, persistent: true,
  },
  {
    definitionId: 'enig-causality-archive-of-unmade-stars', type: 'Light', rarity: 'Enigmatic', spectrumLevel: 3, name: 'Archive of Unmade Stars',
    description: 'A celestial archive that remembers every star that could have existed. Soph placement: gain 3 Cosmos and search for 1 Light and 1 Dark card.',
    artKey: 'enig_causality_archive_of_unmade_stars',
    ainAttack: ainAttack('enig-causality-archive-of-unmade-stars', 3, 'Catalog the Unborn', 'Catalogs a star that never was.', 4, ['enigma', 'causality', 'ain-attack']),
    sophAttack: sophAttack('enig-causality-archive-of-unmade-stars', 3, 'Open the Index', 'Opens the index of impossible stars.', 5, 3, ['enigma', 'causality', 'soph-attack']),
    sophPlacementEffects: [{ type: 'cosmos_flat', value: 3 }, { type: 'search_deck_distinct_types', filter: ['Light', 'Dark'], takePerType: 1 }],
    sacrificeStackRate: 90,
  },
  {
    definitionId: 'enig-causality-black-sun-edict', type: 'Dark', rarity: 'Enigmatic', spectrumLevel: 3, name: 'Black Sun Edict',
    description: 'Shuffle discard into the deck; consume 2 Cosmos to discard 1, draw 4, and gain 6 Light Stacks.',
    artKey: 'enig_causality_black_sun_edict',
    sophEffects: [{ type: 'shuffle_discard' }, { type: 'conditional', condition: { type: 'cosmos_gte', value: 2 }, then: [{ type: 'consume_cosmos', value: 2 }, { type: 'discard_draw', discard: 1, draw: 4 }, { type: 'light_stacks_flat', value: 6 }] }], activationCost: { kind: 'fixed', value: 2 },
    postActivationFate: 'discard', sacrificeStackRate: 92,
  },
  {
    definitionId: 'enig-causality-axiom-beyond-the-horizon', type: 'AinSophAur', rarity: 'Enigmatic', spectrumLevel: 4, name: 'Axiom Beyond the Horizon',
    description: 'The answer that exists beyond the event horizon. Its Bridge the Light attack rewards a board prepared by all three Causality families.',
    artKey: 'enig_causality_axiom_beyond_the_horizon', summonMaterialCount: 3,
    summonMaterials: [{ definitionIds: ['enig-causality-horizon-weaver'], count: 1 }, { definitionIds: ['enig-causality-ink-of-the-first-law'], count: 1 }, { definitionIds: ['enig-causality-archive-of-unmade-stars'], count: 1 }],
    onSummonEffects: [{ type: 'cosmos_flat', value: 5 }, { type: 'search_deck_distinct_types', filter: ['Light', 'Dark'], takePerType: 1 }],
    bridgeAttack: bridge('enig-causality-axiom-beyond-the-horizon', 4, 4, 4),
  },
  {
    definitionId: 'enig-neutral-amplifier-of-the-void', type: 'Dark', rarity: 'Enigmatic', spectrumLevel: 2, name: 'Amplifier of the Void',
    description: 'Draw 2 cards and gain 3 Limitless Light Stacks. If you hold at least 5 stacks after this activation, gain an additional 1,500 Divine Light.',
    artKey: 'void_amplifier',
    sophEffects: [
      { type: 'draw', value: 2 },
      { type: 'light_stacks_flat', value: 3 },
      { type: 'conditional', condition: { type: 'light_stacks_gte', value: 5 }, then: [{ type: 'divine_light_flat', value: 1_500 }] },
    ], activationCost: { kind: 'fixed', value: 0 },
    cooldownCardsPlayed: 2, postActivationFate: 'hand', sacrificeStackRate: 70, persistent: true,
  },
  {
    definitionId: 'enig-neutral-null-born-surgeblade', type: 'AinSophAur', rarity: 'Enigmatic', spectrumLevel: 2, name: 'Null-born Surgeblade',
    description: 'A custom-material Ain Soph Aur. Summon to gain 600 Divine Light; its Bridge the Light attack rewards a fully prepared Neutrality field.',
    artKey: 'void_surge', summonMaterialCount: 2,
    summonMaterials: [{ cardTypes: ['Light', 'Dark'], side: 'any', count: 2 }],
    onSummonEffects: [{ type: 'divine_light_flat', value: 600 }],
    bridgeAttack: bridge('enig-neutral-null-born-surgeblade', 2, 2, 2),
  },
  {
    definitionId: 'enig-neutral-lumen-genesis', type: 'Light', rarity: 'Enigmatic', spectrumLevel: 1, name: 'Lumen Genesis',
    description: 'Soph placement: salvage 1 Light card; if you have played 2+ cards this turn, gain 4 Limitless Light Stacks.',
    artKey: 'enig_neutral_lumen_genesis',
    ainAttack: ainAttack('enig-neutral-lumen-genesis', 1, 'Ain Attack', 'A first genesis of light.', 3, ['enigma', 'ain-attack']),
    sophAttack: sophAttack('enig-neutral-lumen-genesis', 1, 'Soph Attack', 'A low-cost genesis burst.', 3, 2, ['enigma', 'soph-attack']),
    sophPlacementEffects: [{ type: 'salvage_by_type_count', filter: ['Light'], count: 1 }, { type: 'conditional', condition: { type: 'cards_played_gte', value: 2 }, then: [{ type: 'light_stacks_flat', value: 4 }] }],
    sacrificeStackRate: 65,
  },
  {
    definitionId: 'enig-neutral-null-catechism', type: 'Dark', rarity: 'Enigmatic', spectrumLevel: 1, name: 'Null Catechism',
    description: 'Search your Main Deck for a Light card. When activated from the board, this card remains in play and can be used again after its cooldown.',
    artKey: 'enig_neutral_null_catechism',
    sophEffects: [{ type: 'search_deck_by_type', filter: ['Light'] }], activationCost: { kind: 'fixed', value: 1 },
    cooldownCardsPlayed: 2, postActivationFate: 'hand', sacrificeStackRate: 70, persistent: true,
  },
];
