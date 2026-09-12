import type { GardenDungeonDefinition, GardenRewardCurrency } from '@/types/dungeons';

export const GARDEN_REWARD_LABELS: Record<GardenRewardCurrency, string> = {
  nullifiedLattice: 'Nullified Lattice',
  nullSearedLight: 'Null-seared Light',
  nullifiedOblivionMatter: 'Nullified Oblivion-matter',
};

export const GARDEN_DUNGEONS: readonly GardenDungeonDefinition[] = [
  {
    id: 'valley-of-null',
    name: 'Valley of Null',
    subtitle: 'A three-encounter material expedition',
    description: 'A repeatable introductory dungeon. Each encounter presents an independent chance to recover a material used in Infinite card construction.',
    coverArt: `${import.meta.env.BASE_URL}assets/dungeons/valley-of-null.png`,
    available: true,
    encounters: [
      { id: 'valley-of-null-1', name: 'The Quiet Descent', maxHp: 10_000, reward: { currency: 'nullifiedLattice', chance: 0.5, artAssetKey: 'nullified-lattice' } },
      { id: 'valley-of-null-2', name: 'The Lattice Hollow', maxHp: 15_000, reward: { currency: 'nullSearedLight', chance: 0.25, artAssetKey: 'null-seared-light' } },
      { id: 'valley-of-null-3', name: 'The Oblivion Basin', maxHp: 20_000, reward: { currency: 'nullifiedOblivionMatter', chance: 0.05, artAssetKey: 'nullified-oblivion-matter' } },
    ],
  },
  {
    id: 'garden-archive',
    name: 'Garden Archive',
    subtitle: 'A future dungeon',
    description: 'This dungeon is not yet available.',
    coverArt: `${import.meta.env.BASE_URL}assets/dungeons/garden-archive.png`,
    available: false,
    encounters: [],
  },
];
