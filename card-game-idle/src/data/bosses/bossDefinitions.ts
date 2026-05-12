import type { BossDefinition } from '@/types/bossFight';

export const BOSS_FIGHT_ROUND_SECONDS = 180;

const FIRST_ETERNAL_BOSS_HP = 5_000;
const FINAL_ETERNAL_BOSS_HP = 500_000;

function roundBossHp(value: number): number {
  const step = value >= 100_000 ? 1_000 : 500;
  return Math.round(value / step) * step;
}

function getScaledBossHp(index: number, totalBosses: number): number {
  if (index <= 0 || totalBosses <= 1) return FIRST_ETERNAL_BOSS_HP;
  if (index >= totalBosses - 1) return FINAL_ETERNAL_BOSS_HP;

  const progress = index / (totalBosses - 1);
  const scaled = FIRST_ETERNAL_BOSS_HP * Math.pow(FINAL_ETERNAL_BOSS_HP / FIRST_ETERNAL_BOSS_HP, progress);
  return roundBossHp(scaled);
}

const BOSS_BLUEPRINTS: Array<Omit<BossDefinition, 'hp'>> = [
  {
    id: 'boss-hollow-king',
    name: 'The Hollow Queen',
    keyArt: 'boss_hollow_queen',
    rewardCardId: 'btei-voids-reaping',
    description: 'A shattered queen of void, her crown a ring of frozen dark matter. Every blow tears another fragment from her form — yet she refuses to fall.',
  },
  {
    id: 'boss-immortal-warden',
    name: 'The Immortal Warden',
    keyArt: 'boss_immortal_warden',
    rewardCardId: 'btei-eternal-vigil',
    description: 'An eternal guardian that has stood at the threshold between existence and oblivion since before memory. It has never been defeated — until now.',
  },
  {
    id: 'boss-chaos-sovereign',
    name: 'The Chaos Sovereign',
    keyArt: 'boss_chaos_sovereign',
    rewardCardId: 'btei-sovereign-domain',
    description: 'A being born from the collision of all Chaos cards ever played, given form and hunger. Its domain warps the rules of the board itself.',
  },
  {
    id: 'boss-eternal-seraph',
    name: 'The Eternal Seraph',
    keyArt: 'boss_eternal_seraph',
    rewardCardId: 'btei-convergence-of-eternity',
    description: 'The first and last Seraphim, a convergence of all divine light and void-fire ever channelled. To face it is to face the origin of all cards.',
  },
  {
    id: 'boss-time-eater',
    name: 'The Time Eater',
    keyArt: 'boss_time_eater',
    rewardCardId: 'btei-temporal-ruin',
    description: 'An entity that devours entire turns, folding seconds into nothing. Even the chain multiplier bends before it. There is no more time — only the fight.',
  },
  {
    id: 'boss-void-architect',
    name: 'The Void Architect',
    keyArt: 'boss_void_architect',
    rewardCardId: 'btei-architects-manifold',
    description: 'It does not fight — it builds. Every second spent in its domain is a second spent inside a structure it is actively constructing around you. There is no exit from what it has not yet finished designing.',
  },
  {
    id: 'boss-null-sovereign',
    name: 'The Null Sovereign',
    keyArt: 'boss_null_sovereign',
    rewardCardId: 'btei-null-edict',
    description: 'Before absence, there was this. It does not destroy — it revokes. Matter, memory, and meaning are returned to the state before they were permitted to exist.',
  },
  {
    id: 'boss-shattered-oracle',
    name: 'The Shattered Oracle',
    keyArt: 'boss_shattered_oracle',
    rewardCardId: 'btei-omniscient-fracture',
    description: 'It has already seen every way this ends. Each shard of its fractured form contains a complete timeline in which you did not win. It fights from all of them simultaneously.',
  },
  {
    id: 'boss-abyssal-colossus',
    name: 'The Abyssal Colossus',
    keyArt: 'boss_abyssal_colossus',
    rewardCardId: 'btei-colossus-advent',
    description: 'No card has ever measured it. No board has ever contained it. It was not summoned — it was discovered, already here, already vast, already occupying the depth below all other things.',
  },
  {
    id: 'boss-eternal-null',
    name: 'The Eternal Null',
    keyArt: 'boss_eternal_null',
    rewardCardId: 'btei-axiom-of-oblivion',
    description: 'Beyond eternity. Beyond time. Beyond the architects and sovereigns of void. This is what remains when the last card has been played and nothing is left to play it. There is no further.',
  },
];

export const BOSS_DEFINITIONS: BossDefinition[] = BOSS_BLUEPRINTS.map((boss, index, bosses) => ({
  ...boss,
  hp: getScaledBossHp(index, bosses.length),
}));
