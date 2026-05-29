import type { CardDefinition } from '@/types/cards';

const DEATH_FLAMED_HELL_BASE_PREFIXES = ['dfh-ser-', 'dfh-cher-', 'dfh-oph-', 'dfh-ang-'];

export function isDeathFlamedHellBaseDefinitionId(definitionId: string): boolean {
  if (!definitionId.startsWith('dfh-')) return false;
  if (definitionId.startsWith('dfh-et-')) return false;
  if (definitionId.startsWith('dfh-inf-')) return false;
  return DEATH_FLAMED_HELL_BASE_PREFIXES.some(prefix => definitionId.startsWith(prefix));
}

export function isDeathFlamedHellBaseCard(card: CardDefinition | null | undefined): boolean {
  return Boolean(card && card.element === 'DeathFlamedHell' && isDeathFlamedHellBaseDefinitionId(card.definitionId));
}