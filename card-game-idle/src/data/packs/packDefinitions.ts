export interface PackDefinition {
  id: string;
  name: string;
  description: string;
  setId: string;
  cost: number;
  /** Currency used to purchase this pack. Defaults to 'oblivion'. */
  currencyType?: 'oblivion' | 'aberratedShards';
  cardsPerOpen: number;
  cardPool: string[];
  locked: boolean;
  oblivionUnlock?: number;  // total Oblivion milestone required to unlock (checked in store/UI)
}

export const NEUTRALITY_PACK_POOL: string[] = [
  // Commons (10)
  'ser-neutral-null', 'ser-neutral-void',
  'ophanim-neutral-null-seek', 'ophanim-neutral-seraph-recall',
  'ophanim-neutral-neutral-cycle', 'ophanim-neutral-measured-seek',
  'ophanim-neutral-void-surge', 'ophanim-neutral-still-pulse',
  'cherubim-neutral-null-veil', 'cherubim-neutral-void-shroud',
  'angel-neutral-beginning',
  // Rares (11)
  'ser-neutral-balance', 'ser-neutral-equilibrium',
  'ophanim-neutral-chain-pulse', 'ophanim-neutral-cherubim-recall', 'ophanim-neutral-deep-seek',
  'ophanim-neutral-grand-seek', 'ophanim-neutral-echo-pulse', 'ophanim-neutral-seraph-hunt',
  'cherubim-neutral-balance-mantle', 'cherubim-neutral-equilibrium-ward', 'cherubim-neutral-null-fortify',
  // Epics (4)
  'ser-neutral-still', 'ophanim-neutral-nullfall',
  'cherubim-neutral-still-shell', 'cherubim-neutral-void-amp',
  // Legendaries (2)
  'angel-neutral-presence', 'angel-neutral-equilibrium',
];

export const PACK_DEFINITIONS: PackDefinition[] = [
  {
    id: 'pack-neutrality',
    name: 'Neutrality Pack',
    description: `Cards from the Neutrality set - balanced and beginner-friendly. Set size: ${NEUTRALITY_PACK_POOL.length} cards.`,
    setId: 'Neutrality',
    cost: 10410,
    cardsPerOpen: 5,
    cardPool: NEUTRALITY_PACK_POOL,
    locked: false,
  },
];

export const STORE_PACK_ORDER = PACK_DEFINITIONS.map(pack => pack.id);