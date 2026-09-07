import type { CardDefinition } from '@/types/cards';

// Legacy Angel/Seraphim/Cherubim/Ophanim content gutted for the Ain/Soph rework.
export const transcendentCardDefinitions: CardDefinition[] = [];
export const TRANSCENDENT_ANGEL_IDS: ReadonlySet<string> = new Set();
export const TRANSCENDENT_SHOP_IDS: ReadonlySet<string> = new Set();
export const TRANSCENDENT_SHOP_COSTS: Readonly<Record<string, number>> = {};
