import { ainSophAurCards } from '@/data/cards/ainSophAurCards';
import { darkCards } from '@/data/cards/darkCards';
import { lightCards } from '@/data/cards/lightCards';

export interface PackDefinition {
  id: string;
  name: string;
  description: string;
  setId: string;
  cost: number;
  /** Currency used to purchase this pack. Legacy serialized value 'oblivion' means Divine Light. */
  currencyType?: 'oblivion' | 'aberratedShards';
  cardsPerOpen: number;
  cardPool: string[];
  locked: boolean;
  oblivionUnlock?: number;  // legacy field name: total Divine Light milestone required to unlock
}

export const NEUTRALITY_PACK_POOL: string[] = [
  ...lightCards.map(card => card.definitionId),
  ...darkCards.map(card => card.definitionId),
  ...ainSophAurCards.map(card => card.definitionId),
];

export const PACK_DEFINITIONS: PackDefinition[] = [
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
];

export const STORE_PACK_ORDER = PACK_DEFINITIONS.map(pack => pack.id);