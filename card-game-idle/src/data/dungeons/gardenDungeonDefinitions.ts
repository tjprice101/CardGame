import type { GardenDungeonDefinition, GardenRewardCurrency } from '@/types/dungeons';

export const GARDEN_REWARD_LABELS: Record<GardenRewardCurrency, string> = {
  nullifiedLattice: 'Nullified Lattice',
  nullSearedLight: 'Null-seared Light',
  nullifiedOblivionMatter: 'Nullified Oblivion-matter',
  seedOfCausality: 'Seed of Causality',
  causalBloom: 'Causal Bloom',
  shatteredCausalTranscript: 'Shattered Causal Transcript',
  heartOfCausality: 'Heart of Causality',
};

export const GARDEN_MATERIAL_METADATA: Record<GardenRewardCurrency, { name: string; artAssetKey: string; description: string }> = {
  nullifiedLattice: {
    name: 'Nullified Lattice',
    artAssetKey: 'nullified-lattice',
    description: 'A crystalline equilibrium relic recovered from the Valley of Null. Used in Infinite card construction.',
  },
  nullSearedLight: {
    name: 'Null-seared Light',
    artAssetKey: 'null-seared-light',
    description: 'A shard of pure light scorched along one facet by obsidian void fire. Used in Infinite card construction.',
  },
  nullifiedOblivionMatter: {
    name: 'Nullified Oblivion-matter',
    artAssetKey: 'nullified-oblivion-matter',
    description: 'Dense faceted void matter stabilized inside a geometric shell. Used in Infinite card construction.',
  },
  seedOfCausality: { name: 'Seed of Causality', artAssetKey: 'seed-of-causality', description: 'A possibility seed recovered before its timeline could branch. Used in Causality Infinite construction.' },
  causalBloom: { name: 'Causal Bloom', artAssetKey: 'causal-bloom', description: 'A chromatic flower whose petals open into mutually exclusive futures. Used in Causality Infinite construction.' },
  shatteredCausalTranscript: { name: 'Shattered Causal Transcript', artAssetKey: 'shattered-causal-transcript', description: 'A broken manuscript page preserving outcomes that never occurred. Used in Causality Infinite construction.' },
  heartOfCausality: { name: 'Heart of Causality', artAssetKey: 'heart-of-causality', description: 'The pearlescent core of a collapsed event horizon. Used in apex Causality Infinite construction.' },
};

export const GARDEN_DUNGEONS: readonly GardenDungeonDefinition[] = [
  {
    id: 'valley-of-null',
    name: 'Valley of Null',
    subtitle: 'A three-encounter material expedition',
    description: 'A repeatable introductory dungeon. Each encounter presents an independent chance to recover a material used in Infinite card construction.',
    coverArt: `${import.meta.env.BASE_URL}assets/dungeons/valley-of-null.png`,
    available: true,
    category: 'Neutrality',
    encounters: [
      { id: 'valley-of-null-1', name: 'The Quiet Descent', maxHp: 32_000, reward: { currency: 'nullifiedLattice', chance: 0.5, artAssetKey: 'nullified-lattice' } },
      { id: 'valley-of-null-2', name: 'The Lattice Hollow', maxHp: 48_000, reward: { currency: 'nullSearedLight', chance: 0.25, artAssetKey: 'null-seared-light' } },
      { id: 'valley-of-null-3', name: 'The Oblivion Basin', maxHp: 64_000, reward: { currency: 'nullifiedOblivionMatter', chance: 0.05, artAssetKey: 'nullified-oblivion-matter' } },
    ],
  },
  {
    id: 'garden-archive',
    name: 'Garden Archive',
    subtitle: 'A future dungeon',
    description: 'This dungeon is not yet available.',
    coverArt: `${import.meta.env.BASE_URL}assets/dungeons/garden-archive.png`,
    available: false,
    category: 'Neutrality',
    encounters: [],
  },
  {
    id: 'rift-of-causality',
    name: 'Rift of Causality',
    subtitle: 'A four-encounter endgame expedition',
    description: 'Enter a chromatic event-horizon garden where every encounter records a more dangerous possible future.',
    coverArt: `${import.meta.env.BASE_URL}assets/dungeons/rift-of-causality.png`,
    available: true,
    category: 'Causality',
    encounters: [
      { id: 'rift-of-causality-1', name: 'Valley of Causality', maxHp: 256_000, reward: { currency: 'seedOfCausality', chance: 0.5, artAssetKey: 'seed-of-causality' } },
      { id: 'rift-of-causality-2', name: 'Entrance of the Rift', maxHp: 400_000, reward: { currency: 'causalBloom', chance: 0.4, artAssetKey: 'causal-bloom' } },
      { id: 'rift-of-causality-3', name: 'Journey Through Causality', maxHp: 608_000, reward: { currency: 'shatteredCausalTranscript', chance: 0.3, artAssetKey: 'shattered-causal-transcript' } },
      { id: 'rift-of-causality-4', name: 'Core of Causality', maxHp: 960_000, reward: { currency: 'heartOfCausality', chance: 0.1, artAssetKey: 'heart-of-causality' } },
    ],
  },
];
