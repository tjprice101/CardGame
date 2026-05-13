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
  'angel-neutral-beginning',
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

export const THORNBOUND_PLAINS_PACK_POOL: string[] = [
  'tbp-ser-thornplate-sentry',
  'tbp-ser-bleak-march-duelist',
  'tbp-ser-vinedusk-lancer',
  'tbp-ser-white-briar-penitent',
  'tbp-ser-scar-mantle-reclaimer',
  'tbp-ser-crimson-mire-exarch',
  'tbp-seek-ashpath-forager',
  'tbp-seek-thorn-map-initiate',
  'tbp-seek-ragcloak-pilgrim',
  'tbp-seek-briar-tithe',
  'tbp-seek-red-veil-waystone',
  'tbp-seek-blackroot-quartermaster',
  'tbp-seek-bloodvine-crossing',
  'tbp-seek-harrow-psalm',
  'tbp-seek-griefbound-standard',
  'tbp-seek-last-ember-caravan',
  'tbp-chaos-spitebloom-sink',
  'tbp-chaos-thornwake-ditch',
  'tbp-chaos-gallows-bramble',
  'tbp-chaos-pale-vine-reliquary',
  'tbp-chaos-red-marsh-effigy',
  'tbp-chaos-funeral-hedgerow',
  'tbp-chaos-cathedral-of-splinters',
  'tbp-angel-irielle-bramble-gate',
  'tbp-angel-velmora-harrowed-crown',
];

export const MECHANICAL_DREAMS_PACK_POOL: string[] = [
  'md-ser-cogbound-aegis',
  'md-ser-steel-hymn-executor',
  'md-ser-dreamforge-lancer',
  'md-ser-ivory-null-operator',
  'md-ser-pyrecoil-ascetic',
  'md-ser-fate-sever-colossus',
  'md-seek-gearwake-courier',
  'md-seek-brass-mind-litany',
  'md-seek-servo-divination',
  'md-seek-clockforge-chant',
  'md-seek-flareline-primer',
  'md-seek-directive-zero',
  'md-seek-furnace-sync',
  'md-seek-coil-edge-recursion',
  'md-seek-predestination-break',
  'md-seek-sunspindle-override',
  'md-chaos-white-iron-chorus',
  'md-chaos-dreambreak-turbine',
  'md-chaos-rust-halo-chamber',
  'md-chaos-yellowwake-pistons',
  'md-chaos-monolith-relay',
  'md-chaos-cinder-protocol-engine',
  'md-chaos-blackglass-reactor-crown',
  'md-angel-ori9-broken-sleep',
  'md-angel-thaumiel-prime',
];

export const PRISMATIC_ACCORD_PACK_POOL: string[] = [
  'pa-ser-skyglass-veltharion',
  'pa-ser-plainshush-drossken',
  'pa-ser-mirrorback-mirshan',
  'pa-ser-stormmemory-veltharion',
  'pa-ser-veilstep-drossken',
  'pa-ser-goldvein-ancestor',
  'pa-seek-prismwake-glint',
  'pa-seek-fracture-road-reading',
  'pa-seek-drift-canopy-slip',
  'pa-seek-lightveil-ambush',
  'pa-seek-frozen-color-omen',
  'pa-seek-buried-scale-memory',
  'pa-seek-accord-reflection',
  'pa-seek-tide-mirror-convergence',
  'pa-seek-spectrum-lattice',
  'pa-seek-nine-day-beam',
  'pa-chaos-mirrorfield-locus',
  'pa-chaos-fracture-veil',
  'pa-chaos-buried-prism-cache',
  'pa-chaos-canopy-eclipse-knot',
  'pa-chaos-accord-witness-monolith',
  'pa-chaos-century-blind-scar',
  'pa-chaos-whitebeam-confluence',
  'pa-angel-aurelith-ninth-beam',
  'pa-angel-vorthum-whitebeam-arbiter',
];

export const PACK_DEFINITIONS: PackDefinition[] = [
  {
    id: 'pack-neutrality',
    name: 'Neutrality Pack',
    description: `Cards from the Neutrality set — balanced and beginner-friendly. Set size: ${NEUTRALITY_PACK_POOL.length} cards.`,
    element: 'Neutrality',
    cost: 8500,
    cardsPerOpen: 5,
    cardPool: NEUTRALITY_PACK_POOL,
    locked: false,
  },
  {
    id: 'pack-pyroabyss',
    name: 'Pyroabyss Pack',
    description: `Cards from the Pyroabyss set — abyssal void-fire fueled by Embers. Set size: ${PYROABYSS_PACK_POOL.length} cards.`,
    element: 'Fire',
    cost: 17000,
    cardsPerOpen: 5,
    cardPool: PYROABYSS_PACK_POOL,
    locked: false,
  },
  {
    id: 'pack-heavenly-light',
    name: 'Heavenly Light Pack',
    description: `Cards from the Heavenly Light set — radiant and Radiance-fueled. Set size: ${HEAVENLY_LIGHT_PACK_POOL.length} cards.`,
    element: 'Light',
    cost: 25500,
    cardsPerOpen: 5,
    cardPool: HEAVENLY_LIGHT_PACK_POOL,
    locked: false,
  },
  {
    id: 'pack-thornbound-plains',
    name: 'Thornbound Plains Pack',
    description: `Cards from Thornbound Plains — survival through scarlet briars and harrowed roads. Set size: ${THORNBOUND_PLAINS_PACK_POOL.length} cards.`,
    element: 'Thornbound',
    cost: 36125,
    cardsPerOpen: 5,
    cardPool: THORNBOUND_PLAINS_PACK_POOL,
    locked: false,
  },
  {
    id: 'pack-mechanical-dreams',
    name: 'Mechanical Dreams Pack',
    description: `Cards from Mechanical Dreams — overclocked machine divinities and furnace-lit steel. Set size: ${MECHANICAL_DREAMS_PACK_POOL.length} cards.`,
    element: 'Mechanical',
    cost: 46750,
    cardsPerOpen: 5,
    cardPool: MECHANICAL_DREAMS_PACK_POOL,
    locked: false,
  },
  {
    id: 'pack-prismatic-accord',
    name: 'Prismatic Accord Pack',
    description: `Cards from Prismatic Accord — monochrome steel shardborn ignited by refracted light-memory. Set size: ${PRISMATIC_ACCORD_PACK_POOL.length} cards.`,
    element: 'Prismatic',
    cost: 53125,
    cardsPerOpen: 5,
    cardPool: PRISMATIC_ACCORD_PACK_POOL,
    locked: false,
  },
];
