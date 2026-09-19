import { ainSophAurCards } from '@/data/cards/ainSophAurCards';
import { darkCards } from '@/data/cards/darkCards';
import { lightCards } from '@/data/cards/lightCards';
import { CAUSALITY_PACK_POOL } from '@/data/cards/causalityCards';

export interface PackDefinition {
  id: string;
  name: string;
  description: string;
  setId: string;
  cost: number;
  /** Currency used to purchase this pack. */
  currencyType?: 'divineLight' | 'aberratedShards';
  cardsPerOpen: number;
  cardPool: string[];
  locked: boolean;
  divineLightUnlock?: number;  // total Divine Light milestone required to unlock
}

export const NON_EVENT_PACK_COST_SCALE = 3.2;

export const NEUTRALITY_PACK_POOL: string[] = [
  ...lightCards.map(card => card.definitionId),
  ...darkCards.map(card => card.definitionId),
  ...ainSophAurCards.map(card => card.definitionId),
];

const BASE_PACK_DEFINITIONS: PackDefinition[] = [
  {
    id: 'pack-neutrality',
    name: 'Neutrality Pack',
    description: `Cards from the Neutrality set - balanced and beginner-friendly. Set size: ${NEUTRALITY_PACK_POOL.length} cards.`,
    setId: 'Neutrality',
    cost: 6500,
    cardsPerOpen: 5,
    cardPool: NEUTRALITY_PACK_POOL,
    locked: false,
  },
  {
    id: 'pack-causality',
    name: 'Causality Pack',
    description: 'A black-and-white event-horizon manuscript set. Its cards author their own Limitless Cosmos mechanics.',
    setId: 'Causality',
    cost: 300,
    currencyType: 'aberratedShards',
    cardsPerOpen: 5,
    cardPool: CAUSALITY_PACK_POOL,
    locked: false,
  },
];

export const PACK_DEFINITIONS: PackDefinition[] = BASE_PACK_DEFINITIONS.map(pack => (
  pack.currencyType === 'aberratedShards'
    ? pack
    : { ...pack, cost: Math.round(pack.cost * NON_EVENT_PACK_COST_SCALE) }
));

export const STORE_PACK_ORDER = PACK_DEFINITIONS.map(pack => pack.id);