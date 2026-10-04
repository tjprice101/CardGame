import type { GardenDungeonDefinition, GardenMaterialCurrency, GardenRewardCurrency } from '@/types/dungeons';

export const GARDEN_REWARD_LABELS: Record<GardenRewardCurrency, string> = {
  nullifiedLattice: 'Nullified Lattice',
  nullSearedLight: 'Null-seared Light',
  nullifiedOblivionMatter: 'Nullified Oblivion-matter',
  seedOfCausality: 'Seed of Causality',
  causalBloom: 'Causal Bloom',
  shatteredCausalTranscript: 'Shattered Causal Transcript',
  heartOfCausality: 'Heart of Causality',
  emberglass: 'Emberglass',
  abyssalCinder: 'Abyssal Cinder',
  solarSlag: 'Solar Slag',
  heartOfTheInferno: 'Heart of the Inferno',
  divineLight: 'Divine Light',
  shardsOfTranscendence: 'Shards of Transcendence',
};

export const GARDEN_MATERIAL_METADATA: Record<GardenMaterialCurrency, { name: string; artAssetKey: string; description: string }> = {
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
  emberglass: { name: 'Emberglass', artAssetKey: 'emberglass', description: 'Translucent volcanic glass holding the first pulse of an eruption. Used in Intensity ability materialization and Infinite construction.' },
  abyssalCinder: { name: 'Abyssal Cinder', artAssetKey: 'abyssal-cinder', description: 'A black ember drawn from the pressure beneath the crater. Used in Intensity ability materialization and Infinite construction.' },
  solarSlag: { name: 'Solar Slag', artAssetKey: 'solar-slag', description: 'Pale molten metal cooled around a fragment of unbearable noon. Used in Intensity ability materialization and Infinite construction.' },
  heartOfTheInferno: { name: 'Heart of the Inferno', artAssetKey: 'heart-of-the-inferno', description: 'A dense white-hot core suspended inside its own dark shell. Used in Intensity Infinite abilities and construction.' },
};

export const GARDEN_DUNGEONS: readonly GardenDungeonDefinition[] = [
  {
    id: 'valley-of-null',
    name: 'Valley of Null',
    subtitle: 'A three-encounter material expedition',
    description: 'A repeatable introductory dungeon. Each encounter guarantees three of its material and one material from the next encounter; the final encounter grants four.',
    coverArt: `${import.meta.env.BASE_URL}assets/dungeons/valley-of-null.png`,
    available: true,
    category: 'Neutrality',
    encounters: [
      { id: 'valley-of-null-1', name: 'The Quiet Descent', maxHp: 20_000, reward: { currency: 'nullifiedLattice', artAssetKey: 'nullified-lattice' } },
      { id: 'valley-of-null-2', name: 'The Lattice Hollow', maxHp: 30_000, reward: { currency: 'nullSearedLight', artAssetKey: 'null-seared-light' } },
      { id: 'valley-of-null-3', name: 'The Oblivion Basin', maxHp: 40_000, reward: { currency: 'nullifiedOblivionMatter', artAssetKey: 'nullified-oblivion-matter' } },
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
      { id: 'rift-of-causality-1', name: 'Valley of Causality', maxHp: 160_000, reward: { currency: 'seedOfCausality', artAssetKey: 'seed-of-causality' } },
      { id: 'rift-of-causality-2', name: 'Entrance of the Rift', maxHp: 250_000, reward: { currency: 'causalBloom', artAssetKey: 'causal-bloom' } },
      { id: 'rift-of-causality-3', name: 'Journey Through Causality', maxHp: 380_000, reward: { currency: 'shatteredCausalTranscript', artAssetKey: 'shattered-causal-transcript' } },
      { id: 'rift-of-causality-4', name: 'Core of Causality', maxHp: 600_000, reward: { currency: 'heartOfCausality', artAssetKey: 'heart-of-causality' } },
    ],
  },
  {
    id: 'crater-of-flames',
    name: 'Crater of Flames',
    subtitle: 'A four-encounter volcanic expedition',
    description: 'Descend from cooling emberglass to the white-hot heart beneath the crater. Each encounter grants three of its material and one from the next encounter; the final encounter grants four.',
    coverArt: `${import.meta.env.BASE_URL}assets/dungeons/crater-of-flames.png`,
    available: true,
    category: 'Intensity',
    encounters: [
      { id: 'crater-of-flames-1', name: 'The Emberglass Rim', maxHp: 30_000, reward: { currency: 'emberglass', artAssetKey: 'emberglass' } },
      { id: 'crater-of-flames-2', name: 'The Cinder Descent', maxHp: 40_000, reward: { currency: 'abyssalCinder', artAssetKey: 'abyssal-cinder' } },
      { id: 'crater-of-flames-3', name: 'The White Furnace', maxHp: 50_000, reward: { currency: 'solarSlag', artAssetKey: 'solar-slag' } },
      { id: 'crater-of-flames-4', name: 'The Heart Beneath the Crater', maxHp: 60_000, reward: { currency: 'heartOfTheInferno', artAssetKey: 'heart-of-the-inferno' } },
    ],
  },
];
