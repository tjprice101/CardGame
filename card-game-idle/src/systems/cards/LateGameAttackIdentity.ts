import type { CardRarity } from '@/types/cards';

export interface LateGameAttackIdentity {
  key: string;
  title: string;
  summary: string;
  bonusBaseMultiplier: number;
  bonusFlatOblivion: number;
  drawCards: number;
  grantNextCardMultiplier: boolean;
  chainFloorBonus: number;
  dominantResourceGain: number;
  cooldownReduction: number;
}

type AttackLabelKey = 'unsynergized' | 'synergized' | 'primary' | 'exalted';
type IdentityByLabel = Partial<Record<AttackLabelKey, LateGameAttackIdentity>>;

const HAND_AUTHORED_CARD_IDENTITIES: Record<string, IdentityByLabel> = {
  'btei-eternal-vigil': {
    unsynergized: { key: 'btei-eternal-vigil:unsynergized', title: 'Vigil Brand', summary: 'Raises chain floor and draws 1 to keep pressure on.', bonusBaseMultiplier: 0.28, bonusFlatOblivion: 190, drawCards: 1, grantNextCardMultiplier: false, chainFloorBonus: 0.8, dominantResourceGain: 0, cooldownReduction: 0 },
    synergized: { key: 'btei-eternal-vigil:synergized', title: 'Pillar Oath', summary: 'Empowers next card and adds a heavier Oblivion surge.', bonusBaseMultiplier: 0.44, bonusFlatOblivion: 380, drawCards: 0, grantNextCardMultiplier: true, chainFloorBonus: 1.2, dominantResourceGain: 10, cooldownReduction: 0 },
  },
  'btei-colossus-advent': {
    unsynergized: { key: 'btei-colossus-advent:unsynergized', title: 'Titan Entry', summary: 'Heavy flat burst and chain-floor break upward.', bonusBaseMultiplier: 0.34, bonusFlatOblivion: 260, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 1.0, dominantResourceGain: 0, cooldownReduction: 0 },
    synergized: { key: 'btei-colossus-advent:synergized', title: 'Advent Rupture', summary: 'Big burst plus cooldown acceleration across frontline.', bonusBaseMultiplier: 0.52, bonusFlatOblivion: 520, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 1.4, dominantResourceGain: 0, cooldownReduction: 1 },
  },
  'btei-neutrality-void-throne': {
    unsynergized: { key: 'btei-neutrality-void-throne:unsynergized', title: 'Balance Fracture', summary: 'Generates dominant resource and adds bonus payout.', bonusBaseMultiplier: 0.3, bonusFlatOblivion: 210, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 0.6, dominantResourceGain: 14, cooldownReduction: 0 },
    synergized: { key: 'btei-neutrality-void-throne:synergized', title: 'Rex Adjudication', summary: 'Large payout, draw 1, and empower the next card.', bonusBaseMultiplier: 0.48, bonusFlatOblivion: 430, drawCards: 1, grantNextCardMultiplier: true, chainFloorBonus: 0.9, dominantResourceGain: 12, cooldownReduction: 0 },
  },
  'btei-pyroabyss-infernal-archon': {
    unsynergized: { key: 'btei-pyroabyss-infernal-archon:unsynergized', title: 'Suncore Emberfall', summary: 'Aggressive burst with short cooldown pressure.', bonusBaseMultiplier: 0.32, bonusFlatOblivion: 250, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 0.8, dominantResourceGain: 0, cooldownReduction: 1 },
    synergized: { key: 'btei-pyroabyss-infernal-archon:synergized', title: 'Crown of Cinders', summary: 'Massive strike that empowers next card and spikes floor.', bonusBaseMultiplier: 0.56, bonusFlatOblivion: 560, drawCards: 0, grantNextCardMultiplier: true, chainFloorBonus: 1.5, dominantResourceGain: 0, cooldownReduction: 0 },
  },
  'btei-light-aureate-rapture': {
    unsynergized: { key: 'btei-light-aureate-rapture:unsynergized', title: 'Sanctum Ray', summary: 'Clean burst with bonus draw to chain into followups.', bonusBaseMultiplier: 0.29, bonusFlatOblivion: 230, drawCards: 1, grantNextCardMultiplier: false, chainFloorBonus: 0.7, dominantResourceGain: 0, cooldownReduction: 0 },
    synergized: { key: 'btei-light-aureate-rapture:synergized', title: 'Rapture Choir', summary: 'High-value strike with empower and cooldown shave.', bonusBaseMultiplier: 0.5, bonusFlatOblivion: 470, drawCards: 0, grantNextCardMultiplier: true, chainFloorBonus: 1.1, dominantResourceGain: 16, cooldownReduction: 1 },
  },
  'btei-thornbound-cathedral-lancer': {
    unsynergized: { key: 'btei-thornbound-cathedral-lancer:unsynergized', title: 'Briar Skewer', summary: 'Stacks chain floor and keeps tempo with +1 draw.', bonusBaseMultiplier: 0.31, bonusFlatOblivion: 220, drawCards: 1, grantNextCardMultiplier: false, chainFloorBonus: 0.9, dominantResourceGain: 0, cooldownReduction: 0 },
    synergized: { key: 'btei-thornbound-cathedral-lancer:synergized', title: 'Funeral Lunge', summary: 'Huge burst with empower and boardwide cooldown cut.', bonusBaseMultiplier: 0.54, bonusFlatOblivion: 510, drawCards: 0, grantNextCardMultiplier: true, chainFloorBonus: 1.3, dominantResourceGain: 0, cooldownReduction: 1 },
  },
  'btei-mech-furnace-ascension': {
    unsynergized: { key: 'btei-mech-furnace-ascension:unsynergized', title: 'Furnace Pulse', summary: 'Reliable burst and dominant-resource injection.', bonusBaseMultiplier: 0.3, bonusFlatOblivion: 240, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 0.7, dominantResourceGain: 15, cooldownReduction: 0 },
    synergized: { key: 'btei-mech-furnace-ascension:synergized', title: 'Ascension Circuit', summary: 'Explosive proc with draw and faster reload cadence.', bonusBaseMultiplier: 0.52, bonusFlatOblivion: 500, drawCards: 1, grantNextCardMultiplier: false, chainFloorBonus: 1.1, dominantResourceGain: 18, cooldownReduction: 1 },
  },
  'btei-prismatic-storm-memory': {
    unsynergized: { key: 'btei-prismatic-storm-memory:unsynergized', title: 'Storm Recall', summary: 'Adds draw plus a prismatic chain-floor rise.', bonusBaseMultiplier: 0.33, bonusFlatOblivion: 210, drawCards: 1, grantNextCardMultiplier: false, chainFloorBonus: 0.85, dominantResourceGain: 0, cooldownReduction: 0 },
    synergized: { key: 'btei-prismatic-storm-memory:synergized', title: 'Memory Breaker', summary: 'High burst with empower and deeper floor scaling.', bonusBaseMultiplier: 0.55, bonusFlatOblivion: 520, drawCards: 0, grantNextCardMultiplier: true, chainFloorBonus: 1.45, dominantResourceGain: 0, cooldownReduction: 0 },
  },
  'btei-bgi-velplane-ossuary': {
    unsynergized: { key: 'btei-bgi-velplane-ossuary:unsynergized', title: 'Ossuary Maw', summary: 'Dark burst pattern that shaves cooldown by 1.', bonusBaseMultiplier: 0.35, bonusFlatOblivion: 250, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 0.8, dominantResourceGain: 0, cooldownReduction: 1 },
    synergized: { key: 'btei-bgi-velplane-ossuary:synergized', title: 'Velplane Requiem', summary: 'Large payout with draw and chain-floor rupture.', bonusBaseMultiplier: 0.57, bonusFlatOblivion: 560, drawCards: 1, grantNextCardMultiplier: false, chainFloorBonus: 1.5, dominantResourceGain: 0, cooldownReduction: 0 },
  },
  'btei-bgi-rosecrown-annihilator': {
    unsynergized: { key: 'btei-bgi-rosecrown-annihilator:unsynergized', title: 'Roseglass Rend', summary: 'Frontloaded burst plus dominant resource gain.', bonusBaseMultiplier: 0.34, bonusFlatOblivion: 260, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 0.7, dominantResourceGain: 14, cooldownReduction: 0 },
    synergized: { key: 'btei-bgi-rosecrown-annihilator:synergized', title: 'Annihilator Bloom', summary: 'Big finisher proc with empower and floor spike.', bonusBaseMultiplier: 0.58, bonusFlatOblivion: 590, drawCards: 0, grantNextCardMultiplier: true, chainFloorBonus: 1.35, dominantResourceGain: 12, cooldownReduction: 0 },
  },
  'btei-bgi-silver-sorrow-archwyrm': {
    unsynergized: { key: 'btei-bgi-silver-sorrow-archwyrm:unsynergized', title: 'Sorrow Talon', summary: 'Smooth tempo proc that draws and advances floor.', bonusBaseMultiplier: 0.31, bonusFlatOblivion: 230, drawCards: 1, grantNextCardMultiplier: false, chainFloorBonus: 0.75, dominantResourceGain: 0, cooldownReduction: 0 },
    synergized: { key: 'btei-bgi-silver-sorrow-archwyrm:synergized', title: 'Archwyrm Dirge', summary: 'Massive hit with cooldown compression and empower.', bonusBaseMultiplier: 0.56, bonusFlatOblivion: 540, drawCards: 0, grantNextCardMultiplier: true, chainFloorBonus: 1.3, dominantResourceGain: 0, cooldownReduction: 1 },
  },
  'btei-convergence-of-eternity': {
    primary: { key: 'btei-convergence-of-eternity:primary', title: 'Merge Lance', summary: 'Primary burst that raises floor and refuels with draw.', bonusBaseMultiplier: 0.34, bonusFlatOblivion: 280, drawCards: 1, grantNextCardMultiplier: false, chainFloorBonus: 0.9, dominantResourceGain: 10, cooldownReduction: 0 },
    exalted: { key: 'btei-convergence-of-eternity:exalted', title: 'Infinite Mergefall', summary: 'Exalted proc detonates with empower and cooldown shave.', bonusBaseMultiplier: 0.6, bonusFlatOblivion: 620, drawCards: 0, grantNextCardMultiplier: true, chainFloorBonus: 1.5, dominantResourceGain: 16, cooldownReduction: 1 },
  },
  'btei-omniscient-fracture': {
    primary: { key: 'btei-omniscient-fracture:primary', title: 'Fracture Cant', summary: 'Stable attack proc with high floor pressure.', bonusBaseMultiplier: 0.36, bonusFlatOblivion: 320, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 1.0, dominantResourceGain: 12, cooldownReduction: 0 },
    exalted: { key: 'btei-omniscient-fracture:exalted', title: 'Parallax Omega', summary: 'Exalted burst that draws 1 and empowers the next card.', bonusBaseMultiplier: 0.62, bonusFlatOblivion: 700, drawCards: 1, grantNextCardMultiplier: true, chainFloorBonus: 1.6, dominantResourceGain: 18, cooldownReduction: 0 },
  },
  'btei-neutrality-axiom-maw': {
    primary: { key: 'btei-neutrality-axiom-maw:primary', title: 'Axiom Bite', summary: 'Primary proc grants burst and immediate dominant-resource gain.', bonusBaseMultiplier: 0.35, bonusFlatOblivion: 300, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 0.9, dominantResourceGain: 15, cooldownReduction: 0 },
    exalted: { key: 'btei-neutrality-axiom-maw:exalted', title: 'Devour Mandate', summary: 'Exalted proc spikes floor and strips 1 cooldown from all attackers.', bonusBaseMultiplier: 0.61, bonusFlatOblivion: 650, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 1.55, dominantResourceGain: 20, cooldownReduction: 1 },
  },
  'btei-pyroabyss-hellrift-mandala': {
    primary: { key: 'btei-pyroabyss-hellrift-mandala:primary', title: 'Hellrift Anthem', summary: 'Primary proc pushes tempo with draw and chain-floor rise.', bonusBaseMultiplier: 0.33, bonusFlatOblivion: 290, drawCards: 1, grantNextCardMultiplier: false, chainFloorBonus: 0.85, dominantResourceGain: 0, cooldownReduction: 0 },
    exalted: { key: 'btei-pyroabyss-hellrift-mandala:exalted', title: 'Mandala Cataclysm', summary: 'Explodes for major payout and empowers next card.', bonusBaseMultiplier: 0.6, bonusFlatOblivion: 680, drawCards: 0, grantNextCardMultiplier: true, chainFloorBonus: 1.4, dominantResourceGain: 0, cooldownReduction: 0 },
  },
  'btei-light-halo-dominion': {
    primary: { key: 'btei-light-halo-dominion:primary', title: 'Halo Sever', summary: 'High-value primary with resource gain and floor rise.', bonusBaseMultiplier: 0.34, bonusFlatOblivion: 320, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 0.95, dominantResourceGain: 18, cooldownReduction: 0 },
    exalted: { key: 'btei-light-halo-dominion:exalted', title: 'Dominion Choirfall', summary: 'Exalted proc grants draw and full-card empower setup.', bonusBaseMultiplier: 0.64, bonusFlatOblivion: 760, drawCards: 1, grantNextCardMultiplier: true, chainFloorBonus: 1.7, dominantResourceGain: 22, cooldownReduction: 0 },
  },
  'btei-thornbound-funeral-bramble': {
    primary: { key: 'btei-thornbound-funeral-bramble:primary', title: 'Bramble Jolt', summary: 'Primary proc accelerates cadence with cooldown reduction.', bonusBaseMultiplier: 0.33, bonusFlatOblivion: 300, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 0.9, dominantResourceGain: 0, cooldownReduction: 1 },
    exalted: { key: 'btei-thornbound-funeral-bramble:exalted', title: 'Dirge Corridor Break', summary: 'Exalted proc delivers a strong burst plus empower.', bonusBaseMultiplier: 0.62, bonusFlatOblivion: 700, drawCards: 0, grantNextCardMultiplier: true, chainFloorBonus: 1.6, dominantResourceGain: 0, cooldownReduction: 0 },
  },
  'btei-mech-reactor-paradigm': {
    primary: { key: 'btei-mech-reactor-paradigm:primary', title: 'Paradigm Arc', summary: 'Resource-rich primary proc with chain-floor push.', bonusBaseMultiplier: 0.35, bonusFlatOblivion: 330, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 1.0, dominantResourceGain: 20, cooldownReduction: 0 },
    exalted: { key: 'btei-mech-reactor-paradigm:exalted', title: 'Terminal Singularity', summary: 'Exalted proc cracks for huge burst and cooldown compression.', bonusBaseMultiplier: 0.66, bonusFlatOblivion: 780, drawCards: 1, grantNextCardMultiplier: false, chainFloorBonus: 1.7, dominantResourceGain: 24, cooldownReduction: 1 },
  },
  'btei-prismatic-blindwars-reliquary': {
    primary: { key: 'btei-prismatic-blindwars-reliquary:primary', title: 'Reliquary Spear', summary: 'Primary proc blends draw tempo with floor scaling.', bonusBaseMultiplier: 0.34, bonusFlatOblivion: 315, drawCards: 1, grantNextCardMultiplier: false, chainFloorBonus: 0.9, dominantResourceGain: 0, cooldownReduction: 0 },
    exalted: { key: 'btei-prismatic-blindwars-reliquary:exalted', title: 'Refraction Cathedra', summary: 'Exalted proc detonates with empower and deeper floor lock.', bonusBaseMultiplier: 0.63, bonusFlatOblivion: 740, drawCards: 0, grantNextCardMultiplier: true, chainFloorBonus: 1.65, dominantResourceGain: 0, cooldownReduction: 0 },
  },
  'btei-bgi-throne-of-cinders': {
    primary: { key: 'btei-bgi-throne-of-cinders:primary', title: 'Cinder Lash', summary: 'Dark primary proc with immediate cooldown shave.', bonusBaseMultiplier: 0.36, bonusFlatOblivion: 340, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 1.0, dominantResourceGain: 0, cooldownReduction: 1 },
    exalted: { key: 'btei-bgi-throne-of-cinders:exalted', title: 'Cindersovereign Decree', summary: 'Exalted proc overwhelms with burst and empower.', bonusBaseMultiplier: 0.67, bonusFlatOblivion: 820, drawCards: 0, grantNextCardMultiplier: true, chainFloorBonus: 1.8, dominantResourceGain: 0, cooldownReduction: 0 },
  },
  'btei-bgi-elegy-of-veth-serath': {
    primary: { key: 'btei-bgi-elegy_of_veth_serath:primary', title: 'Veth Opening', summary: 'Primary proc feeds resources and raises floor.', bonusBaseMultiplier: 0.35, bonusFlatOblivion: 330, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 1.0, dominantResourceGain: 16, cooldownReduction: 0 },
    exalted: { key: 'btei-bgi-elegy_of_veth_serath:exalted', title: 'Midplace Requiem Burst', summary: 'Exalted proc grants draw, empower, and heavy burst.', bonusBaseMultiplier: 0.68, bonusFlatOblivion: 840, drawCards: 1, grantNextCardMultiplier: true, chainFloorBonus: 1.8, dominantResourceGain: 18, cooldownReduction: 0 },
  },
  'inf-genesis-throne': {
    unsynergized: { key: 'inf-genesis-throne:unsynergized', title: 'Genesis Fracture', summary: 'Infinite burst engine with major floor rupture.', bonusBaseMultiplier: 0.72, bonusFlatOblivion: 1200, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 2.0, dominantResourceGain: 0, cooldownReduction: 0 },
    synergized: { key: 'inf-genesis-throne:synergized', title: 'Origin Collapse', summary: 'Chase-tier nuke proc with draw and empower.', bonusBaseMultiplier: 0.94, bonusFlatOblivion: 1850, drawCards: 2, grantNextCardMultiplier: true, chainFloorBonus: 2.8, dominantResourceGain: 40, cooldownReduction: 1 },
  },
  'inf-null-apex': {
    unsynergized: { key: 'inf-null-apex:unsynergized', title: 'Apex Shear', summary: 'Big burst with dominant resource generation.', bonusBaseMultiplier: 0.68, bonusFlatOblivion: 1020, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 1.7, dominantResourceGain: 34, cooldownReduction: 0 },
    synergized: { key: 'inf-null-apex:synergized', title: 'Null Thronefall', summary: 'Hyper burst proc that also reduces all cooldowns by 1.', bonusBaseMultiplier: 0.9, bonusFlatOblivion: 1700, drawCards: 1, grantNextCardMultiplier: true, chainFloorBonus: 2.4, dominantResourceGain: 44, cooldownReduction: 1 },
  },
  'inf-pyraxis-colossus': {
    unsynergized: { key: 'inf-pyraxis-colossus:unsynergized', title: 'Ashquake Drive', summary: 'High-fire burst with chain-floor break.', bonusBaseMultiplier: 0.7, bonusFlatOblivion: 1080, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 1.9, dominantResourceGain: 0, cooldownReduction: 0 },
    synergized: { key: 'inf-pyraxis-colossus:synergized', title: 'Pyraxis Terminus', summary: 'Massive infernal proc with empower and cooldown shave.', bonusBaseMultiplier: 0.92, bonusFlatOblivion: 1760, drawCards: 0, grantNextCardMultiplier: true, chainFloorBonus: 2.5, dominantResourceGain: 0, cooldownReduction: 1 },
  },
  'inf-prismatic-choir-splinter': {
    unsynergized: { key: 'inf-prismatic-choir-splinter:unsynergized', title: 'Splinter Chime', summary: 'Infinite tempo burst with +1 draw.', bonusBaseMultiplier: 0.66, bonusFlatOblivion: 980, drawCards: 1, grantNextCardMultiplier: false, chainFloorBonus: 1.6, dominantResourceGain: 0, cooldownReduction: 0 },
    synergized: { key: 'inf-prismatic-choir-splinter:synergized', title: 'Choir Detonation', summary: 'Huge proc with double-tempo setup and empower.', bonusBaseMultiplier: 0.88, bonusFlatOblivion: 1650, drawCards: 2, grantNextCardMultiplier: true, chainFloorBonus: 2.2, dominantResourceGain: 0, cooldownReduction: 0 },
  },
  'inf-thorn-widow-engine': {
    unsynergized: { key: 'inf-thorn-widow-engine:unsynergized', title: 'Widow Hook', summary: 'Predatory burst with floor pressure and cooldown cut.', bonusBaseMultiplier: 0.68, bonusFlatOblivion: 1040, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 1.8, dominantResourceGain: 0, cooldownReduction: 1 },
    synergized: { key: 'inf-thorn-widow-engine:synergized', title: 'Engine of Graves', summary: 'Catastrophic proc: empower, burst, and boardwide speedup.', bonusBaseMultiplier: 0.9, bonusFlatOblivion: 1700, drawCards: 1, grantNextCardMultiplier: true, chainFloorBonus: 2.4, dominantResourceGain: 0, cooldownReduction: 1 },
  },
  'inf-lucent-cataclysm-archon': {
    unsynergized: { key: 'inf-lucent-cataclysm-archon:unsynergized', title: 'Lucent Rupture', summary: 'Radiant burst with dominant resource gain.', bonusBaseMultiplier: 0.69, bonusFlatOblivion: 1060, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 1.8, dominantResourceGain: 36, cooldownReduction: 0 },
    synergized: { key: 'inf-lucent-cataclysm-archon:synergized', title: 'Archon Supernova', summary: 'Overloaded proc with empower and major floor lock.', bonusBaseMultiplier: 0.93, bonusFlatOblivion: 1820, drawCards: 1, grantNextCardMultiplier: true, chainFloorBonus: 2.7, dominantResourceGain: 46, cooldownReduction: 0 },
  },
  'inf-brass-eidolon-prime': {
    unsynergized: { key: 'inf-brass-eidolon-prime:unsynergized', title: 'Prime Torque', summary: 'Heavy machine burst with cooldown compression.', bonusBaseMultiplier: 0.7, bonusFlatOblivion: 1100, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 1.9, dominantResourceGain: 30, cooldownReduction: 1 },
    synergized: { key: 'inf-brass-eidolon-prime:synergized', title: 'Eidolon Overdrive', summary: 'Infinity-grade burst with draw and empower chain.', bonusBaseMultiplier: 0.94, bonusFlatOblivion: 1840, drawCards: 1, grantNextCardMultiplier: true, chainFloorBonus: 2.6, dominantResourceGain: 44, cooldownReduction: 1 },
  },
  'inf-bgi-obsidian-covenant-colossus': {
    unsynergized: { key: 'inf-bgi-obsidian-covenant-colossus:unsynergized', title: 'Obsidian Rend', summary: 'Dark infinite burst with floor crack and speedup.', bonusBaseMultiplier: 0.71, bonusFlatOblivion: 1120, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 1.9, dominantResourceGain: 0, cooldownReduction: 1 },
    synergized: { key: 'inf-bgi-obsidian-covenant-colossus:synergized', title: 'Covenant Blackstar', summary: 'Devastating proc with empower and colossal payout.', bonusBaseMultiplier: 0.95, bonusFlatOblivion: 1880, drawCards: 1, grantNextCardMultiplier: true, chainFloorBonus: 2.8, dominantResourceGain: 0, cooldownReduction: 0 },
  },
  'inf-bgi-glassrose-leviathan': {
    unsynergized: { key: 'inf-bgi-glassrose-leviathan:unsynergized', title: 'Glassrose Bite', summary: 'Frontloaded burst with draw and floor advance.', bonusBaseMultiplier: 0.68, bonusFlatOblivion: 1080, drawCards: 1, grantNextCardMultiplier: false, chainFloorBonus: 1.7, dominantResourceGain: 0, cooldownReduction: 0 },
    synergized: { key: 'inf-bgi-glassrose-leviathan:synergized', title: 'Leviathan Eclipse', summary: 'Apex-level proc with empower and cooldown reduction.', bonusBaseMultiplier: 0.92, bonusFlatOblivion: 1760, drawCards: 1, grantNextCardMultiplier: true, chainFloorBonus: 2.5, dominantResourceGain: 0, cooldownReduction: 1 },
  },
  'inf-sovereign-void': {
    primary: { key: 'inf-sovereign-void:primary', title: 'Sovereign Cleave', summary: 'Primary infinity strike with huge floor rupture.', bonusBaseMultiplier: 0.72, bonusFlatOblivion: 1280, drawCards: 1, grantNextCardMultiplier: false, chainFloorBonus: 2.0, dominantResourceGain: 38, cooldownReduction: 0 },
    exalted: { key: 'inf-sovereign-void:exalted', title: 'Null Dominion Prime', summary: 'Chase finisher proc with massive burst and empower.', bonusBaseMultiplier: 0.98, bonusFlatOblivion: 2100, drawCards: 2, grantNextCardMultiplier: true, chainFloorBonus: 3.0, dominantResourceGain: 52, cooldownReduction: 1 },
  },
  'inf-eternity-rupture': {
    primary: { key: 'inf-eternity-rupture:primary', title: 'Rupture Canticle', summary: 'Heavy primary proc with cooldown compression.', bonusBaseMultiplier: 0.74, bonusFlatOblivion: 1320, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 2.1, dominantResourceGain: 36, cooldownReduction: 1 },
    exalted: { key: 'inf-eternity-rupture:exalted', title: 'Convergence Omega', summary: 'Exalted rupture proc with draw and enormous floor lock.', bonusBaseMultiplier: 0.99, bonusFlatOblivion: 2140, drawCards: 2, grantNextCardMultiplier: true, chainFloorBonus: 3.1, dominantResourceGain: 50, cooldownReduction: 1 },
  },
  'inf-riftborn-sovereign': {
    primary: { key: 'inf-riftborn-sovereign:primary', title: 'Riftbrand Slash', summary: 'Fire-dominant proc with giant burst and floor rise.', bonusBaseMultiplier: 0.73, bonusFlatOblivion: 1300, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 2.1, dominantResourceGain: 0, cooldownReduction: 0 },
    exalted: { key: 'inf-riftborn-sovereign:exalted', title: 'Conflagration Thronefall', summary: 'Finisher proc detonates with empower and cooldown shave.', bonusBaseMultiplier: 0.98, bonusFlatOblivion: 2060, drawCards: 1, grantNextCardMultiplier: true, chainFloorBonus: 2.9, dominantResourceGain: 0, cooldownReduction: 1 },
  },
  'inf-prismatic-judgement-array': {
    primary: { key: 'inf-prismatic-judgement-array:primary', title: 'Judgement Spear', summary: 'Prismatic primary proc with draw and tempo lift.', bonusBaseMultiplier: 0.71, bonusFlatOblivion: 1240, drawCards: 1, grantNextCardMultiplier: false, chainFloorBonus: 1.9, dominantResourceGain: 0, cooldownReduction: 0 },
    exalted: { key: 'inf-prismatic-judgement-array:exalted', title: 'Spectrum Decree Final', summary: 'Finisher proc grants draw, empower, and severe burst.', bonusBaseMultiplier: 0.97, bonusFlatOblivion: 2020, drawCards: 2, grantNextCardMultiplier: true, chainFloorBonus: 2.8, dominantResourceGain: 0, cooldownReduction: 0 },
  },
  'inf-thornbound-elegy-titan': {
    primary: { key: 'inf-thornbound-elegy-titan:primary', title: 'Elegy Spear', summary: 'Primary proc batters with floor break and cooldown cut.', bonusBaseMultiplier: 0.72, bonusFlatOblivion: 1260, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 2.0, dominantResourceGain: 0, cooldownReduction: 1 },
    exalted: { key: 'inf-thornbound-elegy-titan:exalted', title: 'Titan Funeral Apex', summary: 'Exalted proc floods payout and empowers followup card.', bonusBaseMultiplier: 0.98, bonusFlatOblivion: 2080, drawCards: 1, grantNextCardMultiplier: true, chainFloorBonus: 2.9, dominantResourceGain: 0, cooldownReduction: 1 },
  },
  'inf-mechanical-apotheosis-core': {
    primary: { key: 'inf-mechanical-apotheosis-core:primary', title: 'Apotheosis Arc', summary: 'Primary proc adds huge machine burst and resources.', bonusBaseMultiplier: 0.74, bonusFlatOblivion: 1340, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 2.1, dominantResourceGain: 42, cooldownReduction: 0 },
    exalted: { key: 'inf-mechanical-apotheosis-core:exalted', title: 'Core Singularity Zenith', summary: 'Exalted proc grants draw, empower, and cooldown compression.', bonusBaseMultiplier: 1.0, bonusFlatOblivion: 2180, drawCards: 2, grantNextCardMultiplier: true, chainFloorBonus: 3.0, dominantResourceGain: 56, cooldownReduction: 1 },
  },
  'inf-bgi-vaelmor-umbra-sovereign': {
    primary: { key: 'inf-bgi-vaelmor-umbra-sovereign:primary', title: 'Umbra Sever', summary: 'Dark sovereign primary with giant burst and floor spike.', bonusBaseMultiplier: 0.75, bonusFlatOblivion: 1360, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 2.2, dominantResourceGain: 0, cooldownReduction: 1 },
    exalted: { key: 'inf-bgi-vaelmor-umbra-sovereign:exalted', title: 'Sovereign Scission Cataclysm', summary: 'Ultimate dark finisher with draw and empower.', bonusBaseMultiplier: 1.02, bonusFlatOblivion: 2240, drawCards: 2, grantNextCardMultiplier: true, chainFloorBonus: 3.2, dominantResourceGain: 0, cooldownReduction: 1 },
  },
  'inf-bgi-midplace-apocalypse': {
    primary: { key: 'inf-bgi-midplace-apocalypse:primary', title: 'Midplace Maw', summary: 'Primary proc hammers hard and speeds all attackers.', bonusBaseMultiplier: 0.74, bonusFlatOblivion: 1330, drawCards: 0, grantNextCardMultiplier: false, chainFloorBonus: 2.1, dominantResourceGain: 0, cooldownReduction: 1 },
    exalted: { key: 'inf-bgi-midplace-apocalypse:exalted', title: 'Plateau of Ruin Absolute', summary: 'Finisher proc with colossal burst, draw, and empower.', bonusBaseMultiplier: 1.01, bonusFlatOblivion: 2200, drawCards: 2, grantNextCardMultiplier: true, chainFloorBonus: 3.1, dominantResourceGain: 0, cooldownReduction: 1 },
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
