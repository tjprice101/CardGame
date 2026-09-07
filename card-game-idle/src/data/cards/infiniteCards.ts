import type { LegacyCosmeticCard } from '@/data/cards/eternalCards';

// Combination recipe system
// Each Infinite card is forged by consuming exact copies of specific Eternal cards.

export interface InfiniteIngredient {
  definitionId: string; // Eternal card definitionId to consume
  count: number;        // how many copies to consume
}

export interface InfiniteRecipe {
  resultId: string;           // Infinite card definitionId produced
  ingredients: InfiniteIngredient[];
  lore: string;               // flavour shown in the Infinitude menu
}

// Legacy Infinite card cosmetic metadata — kept only for profile/avatar collection
// bookkeeping (definitionId + name). These cards are not registered as playable.
export const infiniteCards: LegacyCosmeticCard[] = [
  { definitionId: 'inf-oblivion-absolute', rarity: 'Infinite', name: 'The Absolute Null', description: 'Gain Oblivion scaled by total Patience and peak Patience.', artKey: 'inf_oblivion_absolute' },
  { definitionId: 'inf-void-cascade', rarity: 'Infinite', name: 'The Cascade of the Hollow Sky', description: 'All Seraphim on board gain Patience.', artKey: 'inf_void_cascade' },
  { definitionId: 'inf-genesis-throne', rarity: 'Infinite', name: 'The White Throne Before Beginning', description: 'On play: Gain Oblivion scaled by total Patience, peak Patience, engine signatures, and setup count.', artKey: 'inf_genesis_throne' },
  { definitionId: 'inf-null-apex', rarity: 'Infinite', name: 'The Apex of Nothing', description: 'While on board: +2000 Oblivion whenever you play an Ophanim while active.', artKey: 'inf_null_apex' },
  { definitionId: 'inf-entropic-crown', rarity: 'Infinite', name: 'The Crown of Unmaking', description: 'On play: Gain Oblivion scaled by Patience-bearing units and total Patience.', artKey: 'inf_entropic_crown' },
  { definitionId: 'inf-annihilation-field', rarity: 'Infinite', name: 'The Garden of Annihilation', description: 'On play: All Seraphim on board gain Patience; Shuffle discard into deck.', artKey: 'inf_annihilation_field' },
  { definitionId: 'inf-sovereign-void', rarity: 'Infinite', name: 'The Sovereign Veil', description: "On summon: All Seraphim gain Patience and gain Oblivion from total and peak Patience.", artKey: 'inf_sovereign_void' },
  { definitionId: 'inf-eternity-rupture', rarity: 'Infinite', name: 'The Rift of Outer Silence', description: 'On summon: All Seraphim gain Patience; shuffle the discard into the deck.', artKey: 'inf_eternity_rupture' },
];

// Combination recipes


export const INFINITE_RECIPES: InfiniteRecipe[] = [
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
