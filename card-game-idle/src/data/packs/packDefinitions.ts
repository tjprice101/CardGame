export interface PackDefinition {
  id: string;
  name: string;
  description: string;
  element: string;
  cost: number;
  cardsPerOpen: number;
  cardPool: string[];
  locked: boolean;
  oblivionUnlock?: number;  // total Oblivion milestone required to unlock (checked in store/UI)
}

export const NEUTRALITY_PACK_POOL: string[] = [
  // Commons (10)
  'ser-neutral-null', 'ser-neutral-void',
  'seek-neutral-null-seek', 'seek-neutral-seraph-recall',
  'seek-neutral-neutral-cycle', 'seek-neutral-measured-seek',
  'seek-neutral-void-surge', 'seek-neutral-still-pulse',
  'chaos-neutral-null-veil', 'chaos-neutral-void-shroud',
  // Rares (11)
  'ser-neutral-balance', 'ser-neutral-equilibrium',
  'seek-neutral-chain-pulse', 'seek-neutral-chaos-recall', 'seek-neutral-deep-seek',
  'seek-neutral-grand-seek', 'seek-neutral-echo-pulse', 'seek-neutral-seraph-hunt',
  'chaos-neutral-balance-mantle', 'chaos-neutral-equilibrium-ward', 'chaos-neutral-null-fortify',
  // Epics (4)
  'ser-neutral-still', 'seek-neutral-nullfall',
  'chaos-neutral-still-shell', 'chaos-neutral-void-amp',
  // Legendaries (2)
  'angel-neutral-presence', 'angel-neutral-equilibrium',
];

export const PYROABYSS_PACK_POOL: string[] = [
  // Commons (13)
  'ser-fire-cinder', 'ser-fire-abyssal',
  'chaos-fire-ember-shroud', 'chaos-fire-abyssal-veil',
  'seek-fire-cinder-draw', 'seek-fire-abyssal-kindle',
  'seek-fire-pyre-ignite', 'seek-fire-infernal-surge',
  'seek-fire-void-kindling', 'seek-fire-void-flare',
  'seek-fire-smoldering-cycle', 'seek-fire-abyssal-recall',
  'angel-fire-cinderwing',
  // Rares (13)
  'ser-fire-pyre', 'ser-fire-infernal',
  'chaos-fire-pyre-mantle', 'chaos-fire-infernal-ward', 'chaos-fire-flame-fortify',
  'seek-fire-flame-burst', 'seek-fire-abyssal-detonation',
  'seek-fire-pyroclast', 'seek-fire-ember-threshold',
  'seek-fire-conflagration', 'seek-fire-pyre-hunt', 'seek-fire-ember-chain',
  'angel-fire-pyroclast-wraith',
  // Epics (5)
  'ser-fire-voidflame',
  'chaos-fire-void-cinder-shell', 'chaos-fire-abyss-amp',
  'seek-fire-void-combustion', 'seek-fire-inferno',
  // Legendaries (2)
  'seek-fire-void-apocalypse',
  'angel-fire-obliteron',
];

export const HEAVENLY_LIGHT_PACK_POOL: string[] = [
  // Light Seraphims
  'ser-light-dawn',
  'ser-light-choir',
  'ser-light-herald',
  'ser-light-vigil',
  'ser-light-throne',
  'ser-light-warden',
  // Light Angels
  'angel-light-seraphiel',
  'angel-light-aurelion',
  'angel-light-solarius',
  // Light HR cards
  'hr-light-divine-smite',
  'hr-light-holy-radiance',
  'hr-light-sacred-fury',
  'hr-light-luminous-strike',
  'hr-light-radiant-surge',
  'hr-light-sunforged',
  'hr-light-angelic-wrath',
  'hr-light-exalted-mantle',
  'hr-light-aureate-blessing',
  'hr-light-gilded-mandate',
  'hr-light-celestial-grace',
  'hr-light-heavenly-tithe',
  'hr-light-sanctified-offering',
  'hr-light-celestial-dividend',
  'hr-light-pillar-of-heaven',
  'hr-light-hastened-judgment',
  'hr-light-seraphic-bond',
  'hr-light-undying-vigil',
  'hr-light-celestial-scroll',
  'hr-light-angelic-vision',
  'hr-light-holy-insight',
  'hr-light-sacred-memory',
  'hr-light-radiant-echo',
  'hr-light-luminous-cycle',
  'hr-light-divine-clarity',
  'hr-light-mornings-grace',
  'hr-light-gleaming-passage',
  'hr-light-aureate-chain',
  'hr-light-transcendent-surge',
  'hr-light-sacred-covenant',
  'hr-light-grand-illumination',
];

export const PACK_DEFINITIONS: PackDefinition[] = [
  {
    id: 'pack-neutrality',
    name: 'Neutrality Pack',
    description: 'Cards from the Neutrality set — balanced and beginner-friendly. Contains 5 cards.',
    element: 'Neutrality',
    cost: 200,
    cardsPerOpen: 5,
    cardPool: NEUTRALITY_PACK_POOL,
    locked: false,
  },
  {
    id: 'pack-pyroabyss',
    name: 'Pyroabyss Pack',
    description: 'Cards from the Pyroabyss set — abyssal void-fire fueled by Embers. Contains 5 cards.',
    element: 'Fire',
    cost: 400,
    cardsPerOpen: 5,
    cardPool: PYROABYSS_PACK_POOL,
    locked: true,
    oblivionUnlock: 500,
  },
  {
    id: 'pack-heavenly-light',
    name: 'Heavenly Light Pack',
    description: 'Cards from the Heavenly Light set — radiant and Radiance-fueled. Contains 5 cards.',
    element: 'Light',
    cost: 600,
    cardsPerOpen: 5,
    cardPool: HEAVENLY_LIGHT_PACK_POOL,
    locked: true,
    oblivionUnlock: 2000,
  },
];
