import type { CardDefinition } from '@/types/cards';

// Maps internal element keys to their player-facing set names.
// Element keys are stored on card definitions; set names are shown in the UI.
export const ELEMENT_SET_NAMES: Record<string, string> = {
  Eternal: 'Eternal',
  Neutrality: 'Neutrality',
  Light: 'Heavenly Light',
  Dark: 'Dark',
  Fire: 'Pyroabyss',
  Water: 'Water',
  Earth: 'Earth',
  Wind: 'Wind',
};

export const ELEMENT_COLORS: Record<string, string> = {
  Eternal: '#ff6b6b',
  Neutrality: '#9090a8',
  Light: '#FFD700',
  Dark: '#9b59b6',
  Fire: '#b04aff',
  Water: '#3498db',
  Earth: '#8b6914',
  Wind: '#2ecc71',
};

export function getCardCategoryKey(card: Pick<CardDefinition, 'element' | 'rarity'>): string {
  return card.rarity === 'Eternal' ? 'Eternal' : card.element;
}
