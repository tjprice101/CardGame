import type { CardRarity } from '@/types/cards';

export interface LateGameAttackIdentity {
  key: string;
  title: string;
  summary: string;
  bonusBaseMultiplier: number;
  bonusFlatOblivion: number;
  drawCards: number;
  dominantResourceGain: number;
  cooldownReduction: number;
}

type AttackLabelKey = 'unsynergized' | 'synergized' | 'primary' | 'exalted';
type IdentityByLabel = Partial<Record<AttackLabelKey, LateGameAttackIdentity>>;

const HAND_AUTHORED_CARD_IDENTITIES: Record<string, IdentityByLabel> = {
  'btei-neutrality-void-throne': {
    unsynergized: { key: 'btei-neutrality-void-throne:unsynergized', title: 'Balance Fracture', summary: 'Generates dominant resource and adds bonus payout.', bonusBaseMultiplier: 0.3, bonusFlatOblivion: 210, drawCards: 0, dominantResourceGain: 14, cooldownReduction: 0 },
    synergized: { key: 'btei-neutrality-void-throne:synergized', title: 'Rex Adjudication', summary: 'Large payout, draw 1, and empower the next card.', bonusBaseMultiplier: 0.48, bonusFlatOblivion: 430, drawCards: 1, dominantResourceGain: 12, cooldownReduction: 0 },
  },
  'inf-genesis-throne': {
    unsynergized: { key: 'inf-genesis-throne:unsynergized', title: 'Genesis Fracture', summary: 'Infinite burst engine with major floor rupture.', bonusBaseMultiplier: 0.72, bonusFlatOblivion: 1200, drawCards: 0, dominantResourceGain: 0, cooldownReduction: 0 },
    synergized: { key: 'inf-genesis-throne:synergized', title: 'Origin Collapse', summary: 'Chase-tier nuke proc with draw and empower.', bonusBaseMultiplier: 0.94, bonusFlatOblivion: 1850, drawCards: 2, dominantResourceGain: 40, cooldownReduction: 1 },
  },
  'inf-null-apex': {
    unsynergized: { key: 'inf-null-apex:unsynergized', title: 'Apex Shear', summary: 'Big burst with dominant resource generation.', bonusBaseMultiplier: 0.68, bonusFlatOblivion: 1020, drawCards: 0, dominantResourceGain: 34, cooldownReduction: 0 },
    synergized: { key: 'inf-null-apex:synergized', title: 'Null Thronefall', summary: 'Hyper burst proc that also reduces all cooldowns by 1.', bonusBaseMultiplier: 0.9, bonusFlatOblivion: 1700, drawCards: 1, dominantResourceGain: 44, cooldownReduction: 1 },
  },
  'inf-sovereign-void': {
    primary: { key: 'inf-sovereign-void:primary', title: 'Sovereign Cleave', summary: 'Primary infinity strike with massive burst.', bonusBaseMultiplier: 0.72, bonusFlatOblivion: 1280, drawCards: 1, dominantResourceGain: 38, cooldownReduction: 0 },
    exalted: { key: 'inf-sovereign-void:exalted', title: 'Null Dominion Prime', summary: 'Chase finisher proc with massive burst and empower.', bonusBaseMultiplier: 0.98, bonusFlatOblivion: 2100, drawCards: 2, dominantResourceGain: 52, cooldownReduction: 1 },
  },
  'inf-eternity-rupture': {
    primary: { key: 'inf-eternity-rupture:primary', title: 'Rupture Canticle', summary: 'Heavy primary proc with cooldown compression.', bonusBaseMultiplier: 0.74, bonusFlatOblivion: 1320, drawCards: 0, dominantResourceGain: 36, cooldownReduction: 1 },
    exalted: { key: 'inf-eternity-rupture:exalted', title: 'Convergence Omega', summary: 'Exalted rupture proc with draw and enormous floor lock.', bonusBaseMultiplier: 0.99, bonusFlatOblivion: 2140, drawCards: 2, dominantResourceGain: 50, cooldownReduction: 1 },
  },
};

export function getLateGameAttackIdentity(
  definitionId: string,
  rarity: CardRarity,
  attackLabel: string,
): LateGameAttackIdentity | null {
  if (rarity !== 'Eternal' && rarity !== 'Infinite') return null;

  const label = attackLabel.toLowerCase() as AttackLabelKey;
  const byLabel = HAND_AUTHORED_CARD_IDENTITIES[definitionId];
  if (!byLabel) return null;
  const identity = byLabel[label];
  return identity ? { ...identity } : null;
}