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
  'btei-eternal-vigil': {
    unsynergized: { key: 'btei-eternal-vigil:unsynergized', title: 'Vigil Brand', summary: 'Draws 1 to keep pressure on with reliable burst.', bonusBaseMultiplier: 0.28, bonusFlatOblivion: 190, drawCards: 1, dominantResourceGain: 0, cooldownReduction: 0 },
    synergized: { key: 'btei-eternal-vigil:synergized', title: 'Pillar Oath', summary: 'Empowers next card and adds a heavier Oblivion surge.', bonusBaseMultiplier: 0.44, bonusFlatOblivion: 380, drawCards: 0, dominantResourceGain: 10, cooldownReduction: 0 },
  },
  'btei-colossus-advent': {
    unsynergized: { key: 'btei-colossus-advent:unsynergized', title: 'Titan Entry', summary: 'Heavy flat burst with aggressive upward pressure.', bonusBaseMultiplier: 0.34, bonusFlatOblivion: 260, drawCards: 0, dominantResourceGain: 0, cooldownReduction: 0 },
    synergized: { key: 'btei-colossus-advent:synergized', title: 'Advent Rupture', summary: 'Big burst plus cooldown acceleration across frontline.', bonusBaseMultiplier: 0.52, bonusFlatOblivion: 520, drawCards: 0, dominantResourceGain: 0, cooldownReduction: 1 },
  },
  'btei-neutrality-void-throne': {
    unsynergized: { key: 'btei-neutrality-void-throne:unsynergized', title: 'Balance Fracture', summary: 'Generates dominant resource and adds bonus payout.', bonusBaseMultiplier: 0.3, bonusFlatOblivion: 210, drawCards: 0, dominantResourceGain: 14, cooldownReduction: 0 },
    synergized: { key: 'btei-neutrality-void-throne:synergized', title: 'Rex Adjudication', summary: 'Large payout, draw 1, and empower the next card.', bonusBaseMultiplier: 0.48, bonusFlatOblivion: 430, drawCards: 1, dominantResourceGain: 12, cooldownReduction: 0 },
  },
  'btei-convergence-of-eternity': {
    primary: { key: 'btei-convergence-of-eternity:primary', title: 'Merge Lance', summary: 'Primary burst that raises floor and refuels with draw.', bonusBaseMultiplier: 0.34, bonusFlatOblivion: 280, drawCards: 1, dominantResourceGain: 10, cooldownReduction: 0 },
    exalted: { key: 'btei-convergence-of-eternity:exalted', title: 'Infinite Mergefall', summary: 'Exalted proc detonates with empower and cooldown shave.', bonusBaseMultiplier: 0.6, bonusFlatOblivion: 620, drawCards: 0, dominantResourceGain: 16, cooldownReduction: 1 },
  },
  'btei-omniscient-fracture': {
    primary: { key: 'btei-omniscient-fracture:primary', title: 'Fracture Cant', summary: 'Stable attack proc with high floor pressure.', bonusBaseMultiplier: 0.36, bonusFlatOblivion: 320, drawCards: 0, dominantResourceGain: 12, cooldownReduction: 0 },
    exalted: { key: 'btei-omniscient-fracture:exalted', title: 'Parallax Omega', summary: 'Exalted burst that draws 1 and empowers the next card.', bonusBaseMultiplier: 0.62, bonusFlatOblivion: 700, drawCards: 1, dominantResourceGain: 18, cooldownReduction: 0 },
  },
  'btei-neutrality-axiom-maw': {
    primary: { key: 'btei-neutrality-axiom-maw:primary', title: 'Axiom Bite', summary: 'Primary proc grants burst and immediate dominant-resource gain.', bonusBaseMultiplier: 0.35, bonusFlatOblivion: 300, drawCards: 0, dominantResourceGain: 15, cooldownReduction: 0 },
    exalted: { key: 'btei-neutrality-axiom-maw:exalted', title: 'Devour Mandate', summary: 'Exalted proc spikes floor and strips 1 cooldown from all attackers.', bonusBaseMultiplier: 0.61, bonusFlatOblivion: 650, drawCards: 0, dominantResourceGain: 20, cooldownReduction: 1 },
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