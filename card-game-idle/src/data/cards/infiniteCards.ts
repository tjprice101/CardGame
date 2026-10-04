import type { LegacyCosmeticCard } from '@/data/cards/eternalCards';
import type { GardenRewardCurrency } from '@/types/dungeons';
import { neutralityInfiniteCards } from './neutralityInfiniteCards';

// Combination recipe system
// Each Infinite card is forged by consuming exact copies of specific Eternal cards.

export interface InfiniteIngredient {
  definitionId?: string; // Eternal card definitionId to consume
  currency?: GardenRewardCurrency;
  count: number;        // how many copies to consume
}

export interface InfiniteRecipe {
  resultId: string;           // Infinite card definitionId produced
  ingredients: InfiniteIngredient[];
  lore: string;               // flavour shown in the Infinitude menu
}

// Compatibility metadata for existing profile consumers. Playable definitions
// live in neutralityInfiniteCards.ts and causalityInfiniteCards.ts.
export const infiniteCards: LegacyCosmeticCard[] = [
  ...neutralityInfiniteCards.map(card => ({
    definitionId: card.definitionId, rarity: 'Infinite' as const, name: card.name, description: card.description, artKey: card.artKey,
  })),
  { definitionId: 'inf-causality-origin-script', rarity: 'Infinite', name: 'Origin Script of Every Tomorrow', description: 'Generate an immense Cosmos reserve.', artKey: 'inf_causality_origin_script' },
  { definitionId: 'inf-causality-chromatic-horizon', rarity: 'Infinite', name: 'Chromatic Horizon Without End', description: 'Convert Light into an endless event horizon.', artKey: 'inf_causality_chromatic_horizon' },
  { definitionId: 'inf-causality-law-eater', rarity: 'Infinite', name: 'Law-Eater of the Pearl Void', description: 'Consume Cosmos for an overwhelming utility burst.', artKey: 'inf_causality_law_eater' },
  { definitionId: 'inf-causality-archive-reborn', rarity: 'Infinite', name: 'Archive Reborn in Chromatic Ink', description: 'Rewrite every card family from the archive.', artKey: 'inf_causality_archive_reborn' },
  { definitionId: 'inf-causality-heart-beyond-all', rarity: 'Infinite', name: 'Heart Beyond All Causality', description: 'Bridge every possible future at once.', artKey: 'inf_causality_heart_beyond_all' },
];

// Combination recipes


const BASE_INFINITE_RECIPES: InfiniteRecipe[] = [
  {
    resultId: 'inf-oblivion-absolute',
    lore: 'When the four axioms of annihilation converge, nothing remains but the absolute void.',
    ingredients: [
      { definitionId: 'btei-axiom-of-oblivion', count: 1 },
      { definitionId: 'btei-null-edict', count: 1 },
      { definitionId: 'btei-temporal-ruin', count: 1 },
      { definitionId: 'btei-voids-reaping', count: 1 },
      { definitionId: 'btei-null-edict', count: 1 }],
  },
  {
    resultId: 'inf-void-cascade',
    lore: 'Time rewound past its first breath, pouring endlessly into itself.',
    ingredients: [
      { definitionId: 'btei-temporal-ruin', count: 2 },
      { definitionId: 'btei-voids-reaping', count: 1 },
      { definitionId: 'btei-sovereign-domain', count: 1 },
      { definitionId: 'btei-convergence-of-eternity', count: 1 }],
  },
  {
    resultId: 'inf-genesis-throne',
    lore: 'Before the first star, before even the void, the Throne already sat.',
    ingredients: [
      { definitionId: 'btei-neutrality-void-throne', count: 2 },
      { definitionId: 'btei-voids-reaping', count: 1 },
      { definitionId: 'btei-omniscient-fracture', count: 1 },
      { definitionId: 'btei-convergence-of-eternity', count: 1 },
      { definitionId: 'btei-sovereign-domain', count: 1 }],
  },
  {
    resultId: 'inf-null-apex',
    lore: 'The apex of nothingness: a point so empty it bends all realities inward.',
    ingredients: [
      { definitionId: 'btei-neutrality-void-throne', count: 1 },
      { definitionId: 'btei-sovereign-domain', count: 1 },
      { definitionId: 'btei-null-edict', count: 1 },
      { definitionId: 'btei-axiom-of-oblivion', count: 1 },
      { definitionId: 'btei-sovereign-domain', count: 1 }],
  },
  {
    resultId: 'inf-entropic-crown',
    lore: 'To wear entropy is to command it; the crown does not decay, it unmakes.',
    ingredients: [
      { definitionId: 'btei-sovereign-domain', count: 2 },
      { definitionId: 'btei-sovereign-domain', count: 1 },
      { definitionId: 'btei-null-edict', count: 1 },
      { definitionId: 'btei-null-edict', count: 1 }],
  },
  {
    resultId: 'inf-annihilation-field',
    lore: 'In the field of annihilation, even the concept of opposition ceases.',
    ingredients: [
      { definitionId: 'btei-null-edict', count: 2 },
      { definitionId: 'btei-sovereign-domain', count: 1 },
      { definitionId: 'btei-voids-reaping', count: 1 },
      { definitionId: 'btei-axiom-of-oblivion', count: 1 },
      { definitionId: 'btei-temporal-ruin', count: 1 }],
  },
  {
    resultId: 'inf-sovereign-void',
    lore: 'No court. No subjects. Only dominion absolute and the silence of a conquered cosmos.',
    ingredients: [
      { definitionId: 'btei-omniscient-fracture', count: 2 },
      { definitionId: 'btei-convergence-of-eternity', count: 1 },
      { definitionId: 'btei-neutrality-void-throne', count: 1 },
      { definitionId: 'btei-sovereign-domain', count: 1 },
      { definitionId: 'btei-sovereign-domain', count: 1 }],
  },
  {
    resultId: 'inf-eternity-rupture',
    lore: 'The seam between eternities split, and from it emerged something that predated both.',
    ingredients: [
      { definitionId: 'btei-convergence-of-eternity', count: 2 },
      { definitionId: 'btei-sovereign-domain', count: 1 },
      { definitionId: 'btei-temporal-ruin', count: 1 },
      { definitionId: 'btei-omniscient-fracture', count: 1 }],
  },
];

const MATERIAL_COSTS = [
  { nullifiedLattice: 24, nullSearedLight: 12, nullifiedOblivionMatter: 3 },
  { nullifiedLattice: 28, nullSearedLight: 14, nullifiedOblivionMatter: 3 },
  { nullifiedLattice: 32, nullSearedLight: 16, nullifiedOblivionMatter: 4 },
  { nullifiedLattice: 36, nullSearedLight: 18, nullifiedOblivionMatter: 4 },
  { nullifiedLattice: 40, nullSearedLight: 20, nullifiedOblivionMatter: 5 },
  { nullifiedLattice: 44, nullSearedLight: 22, nullifiedOblivionMatter: 5 },
  { nullifiedLattice: 48, nullSearedLight: 24, nullifiedOblivionMatter: 6 },
  { nullifiedLattice: 52, nullSearedLight: 26, nullifiedOblivionMatter: 6 },
] as const;

const CAUSALITY_INFINITE_RECIPES: InfiniteRecipe[] = [
  { resultId: 'inf-causality-origin-script', lore: 'The first cause survives every revision.', ingredients: [{ definitionId: 'btei-causality-first-cause', count: 2 }, { definitionId: 'btei-causality-ink-sovereign', count: 1 }, { currency: 'seedOfCausality', count: 24 }, { currency: 'causalBloom', count: 12 }] },
  { resultId: 'inf-causality-chromatic-horizon', lore: 'A horizon refracted through futures too numerous to name.', ingredients: [{ definitionId: 'btei-causality-last-horizon', count: 2 }, { definitionId: 'btei-causality-chromatic-verdict', count: 1 }, { currency: 'causalBloom', count: 18 }, { currency: 'shatteredCausalTranscript', count: 8 }] },
  { resultId: 'inf-causality-law-eater', lore: 'It consumes the law and leaves only the exception.', ingredients: [{ definitionId: 'btei-causality-ink-sovereign', count: 2 }, { definitionId: 'btei-causality-first-cause', count: 1 }, { currency: 'seedOfCausality', count: 30 }, { currency: 'heartOfCausality', count: 2 }] },
  { resultId: 'inf-causality-archive-reborn', lore: 'Every discarded future returns in chromatic ink.', ingredients: [{ definitionId: 'btei-causality-chromatic-verdict', count: 2 }, { definitionId: 'btei-causality-last-horizon', count: 1 }, { currency: 'shatteredCausalTranscript', count: 12 }, { currency: 'heartOfCausality', count: 2 }] },
  { resultId: 'inf-causality-heart-beyond-all', lore: 'At the center of the rift, every cause has the same heart.', ingredients: [{ definitionId: 'btei-causality-pearl-engine', count: 2 }, { definitionId: 'btei-causality-first-cause', count: 1 }, { definitionId: 'btei-causality-last-horizon', count: 1 }, { currency: 'seedOfCausality', count: 40 }, { currency: 'causalBloom', count: 24 }, { currency: 'shatteredCausalTranscript', count: 16 }, { currency: 'heartOfCausality', count: 5 }] },
];

const NEUTRALITY_INFINITE_RECIPES: InfiniteRecipe[] = BASE_INFINITE_RECIPES.map((recipe, index) => {
  const eternal = recipe.ingredients.find(ingredient => ingredient.definitionId);
  const materials = MATERIAL_COSTS[index] ?? MATERIAL_COSTS[MATERIAL_COSTS.length - 1];
  return {
    ...recipe,
    ingredients: [
      { definitionId: eternal?.definitionId ?? '', count: 1 },
      { currency: 'nullifiedLattice', count: materials.nullifiedLattice },
      { currency: 'nullSearedLight', count: materials.nullSearedLight },
      { currency: 'nullifiedOblivionMatter', count: materials.nullifiedOblivionMatter },
    ],
  };
});

export const INTENSITY_INFINITE_RECIPES: InfiniteRecipe[] = [
  {
    resultId: 'infinite-intensity-the-unfathomed-return',
    lore: 'What the white mountain surrendered, the black sea remembers.',
    ingredients: [
      { definitionId: 'eternal-intensity-cathedral-below-all-seas', count: 2 },
      { currency: 'emberglass', count: 24 }, { currency: 'abyssalCinder', count: 12 },
    ],
  },
  {
    resultId: 'infinite-intensity-crown-with-no-final-king',
    lore: 'Two opposed crowns melt into a seam that no sovereign can close.',
    ingredients: [
      { definitionId: 'eternal-intensity-the-crown-divided-against-itself', count: 2 },
      { currency: 'abyssalCinder', count: 18 }, { currency: 'solarSlag', count: 8 },
    ],
  },
  {
    resultId: 'infinite-intensity-daybreak-without-end',
    lore: 'The noon that once scorched the world learns how to begin again.',
    ingredients: [
      { definitionId: 'eternal-intensity-sovereign-of-unbearable-noon', count: 2 },
      { currency: 'emberglass', count: 30 }, { currency: 'heartOfTheInferno', count: 2 },
    ],
  },
  {
    resultId: 'infinite-intensity-a-furnace-outside-time',
    lore: 'The buried bell strikes once, and its furnace burns beyond sequence.',
    ingredients: [
      { definitionId: 'eternal-intensity-the-bell-that-buries-distance', count: 2 },
      { currency: 'solarSlag', count: 12 }, { currency: 'heartOfTheInferno', count: 2 },
    ],
  },
  {
    resultId: 'infinite-intensity-the-seam-that-holds-eternity',
    lore: 'Creation and erasure remain apart only because one golden fracture refuses to break.',
    ingredients: [
      { definitionId: 'eternal-intensity-verdict-after-the-last-dawn', count: 2 },
      { currency: 'emberglass', count: 40 }, { currency: 'abyssalCinder', count: 24 },
      { currency: 'solarSlag', count: 16 }, { currency: 'heartOfTheInferno', count: 5 },
    ],
  },
];

export const INFINITE_RECIPES: InfiniteRecipe[] = [...NEUTRALITY_INFINITE_RECIPES, ...CAUSALITY_INFINITE_RECIPES, ...INTENSITY_INFINITE_RECIPES];
