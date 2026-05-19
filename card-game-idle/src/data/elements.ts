import type { CardDefinition } from '@/types/cards';

// Maps internal element keys to their player-facing set names.
// Element keys are stored on card definitions; set names are shown in the UI.
export const ELEMENT_SET_NAMES: Record<string, string> = {
  Eternal: 'Eternal',
  Neutrality: 'Neutrality',
  Light: 'Heavenly Light',
  Dark: 'Black Glass Inferno',
  Thornbound: 'Thornbound Plains',
  Mechanical: 'Mechanical Dreams',
  SnowboundVoltage: 'Snowbound Voltage',
  Prismatic: 'Prismatic Accord',
  GlassAbsolute: 'Glass Absolute',
  BlazingGarden: 'The Blazing Garden',
  Fire: 'Pyroabyss',
  Water: 'Water',
  Earth: 'Earth',
  Wind: 'Wind',
};

export const ELEMENT_COLORS: Record<string, string> = {
  Eternal: '#ff6b6b',
  Neutrality: '#9090a8',
  Light: '#FFD700',
  Thornbound: '#b63030',
  Mechanical: '#f0a018',
  SnowboundVoltage: '#87ceeb',
  Prismatic: '#7ecfcf',
  GlassAbsolute: '#cfefff',
  BlazingGarden: '#ff8d3a',
  Dark: '#8d7f8f',
  Fire: '#b04aff',
  Water: '#3498db',
  Earth: '#8b6914',
  Wind: '#2ecc71',
};

export function isSnowboundCard(card: Pick<CardDefinition, 'definitionId'>): boolean {
  return card.definitionId.startsWith('sv-') || card.definitionId.startsWith('inf-sv-');
}

export function getCardCategoryKey(card: Pick<CardDefinition, 'element' | 'rarity' | 'definitionId' | any>): string {
  // Snowbound Voltage cards are a distinct set across all rarities
  if (card.definitionId && isSnowboundCard(card)) {
    return 'SnowboundVoltage';
  }
  // Eternal cards now show under their element instead of a generic "Eternal" category
  return card.element;
}
