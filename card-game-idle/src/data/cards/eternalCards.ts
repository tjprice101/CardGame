import type { CardRarity } from '@/types/cards';

// Legacy Eternal card cosmetic metadata — kept only for profile/avatar collection
// bookkeeping (definitionId + name). These cards are not registered as playable.
export interface LegacyCosmeticCard {
  definitionId: string;
  rarity: CardRarity;
  name: string;
  description: string;
  artKey: string;
}

export const eternalCards: LegacyCosmeticCard[] = [
  { definitionId: 'btei-voids-reaping', rarity: 'Eternal', name: "Void's Reaping", description: 'To be redesigned.', artKey: 'btei_voids_reaping' },
  { definitionId: 'btei-temporal-ruin', rarity: 'Eternal', name: 'Temporal Ruin', description: 'To be redesigned.', artKey: 'btei_temporal_ruin' },
  { definitionId: 'btei-null-edict', rarity: 'Eternal', name: 'Null Edict', description: 'To be redesigned.', artKey: 'btei_null_edict' },
  { definitionId: 'btei-axiom-of-oblivion', rarity: 'Eternal', name: 'Axiom of Oblivion', description: 'To be redesigned.', artKey: 'btei_axiom_of_oblivion' },
  { definitionId: 'btei-sovereign-domain', rarity: 'Eternal', name: 'Sovereign Domain', description: 'To be redesigned.', artKey: 'btei_sovereign_domain' },
  { definitionId: 'btei-convergence-of-eternity', rarity: 'Eternal', name: 'Convergence of Eternity', description: 'To be redesigned.', artKey: 'btei_convergence_of_eternity' },
  { definitionId: 'btei-omniscient-fracture', rarity: 'Eternal', name: 'Omniscient Fracture', description: 'To be redesigned.', artKey: 'btei_omniscient_fracture' },
  { definitionId: 'btei-neutrality-void-throne', rarity: 'Eternal', name: 'Equilibrium Rex', description: 'To be redesigned.', artKey: 'btei_neutrality_void_throne' },
  { definitionId: 'btei-neutrality-prime-equilibrium', rarity: 'Eternal', name: 'Prime Judge of Silence', description: 'To be redesigned.', artKey: 'btei_neutrality_prime_equilibrium' },
];

