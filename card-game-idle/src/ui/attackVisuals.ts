import type { CardDefinition } from '@/types/cards';

export type PremiumAttackTheme = 'infinite' | 'eternal' | 'transcendent';

export function getPremiumAttackTheme(card: CardDefinition | undefined): PremiumAttackTheme | null {
  switch (card?.rarity) {
    case 'Infinite': return 'infinite';
    case 'Eternal': return 'eternal';
    case 'Transcendent': return 'transcendent';
    default: return null;
  }
}

export const ATTACK_STAR_COLORS: Record<PremiumAttackTheme, readonly string[]> = {
  infinite: ['#ff527e', '#ffad48', '#fff08a', '#64ffbd', '#63cfff', '#bf83ff'],
  eternal: ['#ff3d64', '#a51038', '#6c248d', '#32104f'],
  transcendent: ['#ffd0e9', '#ff9bcf', '#9c143e', '#b478ff'],
};
