import type { BossDefinition, BossCategory } from '@/types/bossFight';

export const BOSS_FIGHT_ROUND_SECONDS = 180;

const FIRST_ETERNAL_BOSS_HP = 12_000;
const FINAL_ETERNAL_BOSS_HP = 25_000_000;

function roundBossHp(value: number): number {
  if (value >= 10_000_000) return Math.round(value / 25_000) * 25_000;
  if (value >= 1_000_000) return Math.round(value / 10_000) * 10_000;
  if (value >= 100_000) return Math.round(value / 2_500) * 2_500;
  return Math.round(value / 500) * 500;
}

function getScaledBossHp(index: number, totalBosses: number): number {
  if (index <= 0 || totalBosses <= 1) return FIRST_ETERNAL_BOSS_HP;
  if (index >= totalBosses - 1) return FINAL_ETERNAL_BOSS_HP;

  const progress = index / (totalBosses - 1);
  const scaled = FIRST_ETERNAL_BOSS_HP * Math.pow(FINAL_ETERNAL_BOSS_HP / FIRST_ETERNAL_BOSS_HP, progress);
  return roundBossHp(scaled);
}

type BossBlueprint = Omit<BossDefinition, 'hp'>;

function shardsFor(index: number): { firstClearShards: number; repeatClearShards: number } {
  const firstClearShards = 10 + index;
  const repeatClearShards = Math.max(5, Math.round(firstClearShards * 0.6));
  return { firstClearShards, repeatClearShards };
}

function createBoss(
  index: number,
  id: string,
  name: string,
  category: BossCategory,
  rewardCardId: string,
  description: string,
  keyArt?: string,
): BossBlueprint {
  const shards = shardsFor(index);
  return {
    id,
    name,
    category,
    rewardCardId,
    keyArt: keyArt ?? id,
    firstClearShards: shards.firstClearShards,
    repeatClearShards: shards.repeatClearShards,
    description,
  };
}

const BOSS_BLUEPRINTS: BossBlueprint[] = [
  // Neutrality legacy arc
  createBoss(0, 'boss-hollow-king', 'The Hollow Queen', 'Neutrality', 'btei-voids-reaping', 'A shattered queen of void whose broken regalia still bends reality around every strike.', 'boss_hollow_queen'),
  createBoss(1, 'boss-immortal-warden', 'The Immortal Warden', 'Neutrality', 'btei-eternal-vigil', 'A sentinel that has never blinked across epochs; each heartbeat is a verdict.', 'boss_immortal_warden'),
  createBoss(2, 'boss-chaos-sovereign', 'The Chaos Sovereign', 'Neutrality', 'btei-sovereign-domain', 'Formed from colliding entropy stacks, it turns stable lines into catastrophic gambles.', 'boss_chaos_sovereign'),
  createBoss(3, 'boss-eternal-seraph', 'The Eternal Seraph', 'Neutrality', 'btei-convergence-of-eternity', 'The first chorus and the final silence, condensed into one impossible wingbeat.', 'boss_eternal_seraph'),
  createBoss(4, 'boss-time-eater', 'The Time Eater', 'Neutrality', 'btei-temporal-ruin', 'It consumes turns before they exist; haste itself becomes prey.', 'boss_time_eater'),
  createBoss(5, 'boss-void-architect', 'The Void Architect', 'Neutrality', 'btei-architects-manifold', 'A cosmic engineer that drafts your defeat as if it were structural law.', 'boss_void_architect'),
  createBoss(6, 'boss-null-sovereign', 'The Null Sovereign', 'Neutrality', 'btei-null-edict', 'It does not destroy; it revokes permissions to exist.', 'boss_null_sovereign'),
  createBoss(7, 'boss-shattered-oracle', 'The Shattered Oracle', 'Neutrality', 'btei-omniscient-fracture', 'Each shard fights from a timeline where you already failed.', 'boss_shattered_oracle'),
  createBoss(8, 'boss-abyssal-colossus', 'The Abyssal Colossus', 'Neutrality', 'btei-colossus-advent', 'A depth-born titan whose shadow alone counts as a battlefield.', 'boss_abyssal_colossus'),
  createBoss(9, 'boss-eternal-null', 'The Eternal Null', 'Neutrality', 'btei-axiom-of-oblivion', 'The final theorem: what remains after all cards and all players are gone.', 'boss_eternal_null'),

  // Neutrality expansion (5 new)
  createBoss(10, 'boss-neutrality-paradox-throne', 'Paradox Throne', 'Neutrality', 'btei-neutrality-paradox-crown', 'Every chain state exists at once; only one timeline lets you survive.', 'boss_neutrality_paradox_throne'),
  createBoss(11, 'boss-neutrality-void-exchequer', 'Void Exchequer', 'Neutrality', 'btei-neutrality-zero-edict', 'It taxes all momentum and then auctions your future back to you.', 'boss_neutrality_void_exchequer'),
  createBoss(12, 'boss-neutrality-equilibrium-rex', 'Equilibrium Rex', 'Neutrality', 'btei-neutrality-void-throne', 'Perfect balance weaponized: all extremes collapse into overwhelming force.', 'boss_neutrality_equilibrium_rex'),
  createBoss(13, 'boss-neutrality-axiom-maw', 'Axiom Maw', 'Neutrality', 'btei-neutrality-axiom-maw', 'A living contradiction that feeds on resolved effects and unresolved fear.', 'boss_neutrality_axiom_maw'),
  createBoss(14, 'boss-neutrality-prime-judge', 'Prime Judge of Silence', 'Neutrality', 'btei-neutrality-prime-equilibrium', 'The final arbiter of Neutrality, where every action is answered twice.', 'boss_neutrality_prime_judge'),

  // Pyroabyss (5)
  createBoss(15, 'boss-pyroabyss-cinder-leviathan', 'Cinder Leviathan', 'Pyroabyss', 'btei-pyroabyss-cinder-cataclysm', 'A furnace-beast that breathes embers dense enough to bend steel halos.', 'boss_pyroabyss_cinder_leviathan'),
  createBoss(16, 'boss-pyroabyss-ash-kings', 'Ash Kings Unbound', 'Pyroabyss', 'btei-pyroabyss-ashfall-engine', 'Twin monarchs of collapse that ignite both board and discard into one blaze.', 'boss_pyroabyss_ash_kings'),
  createBoss(17, 'boss-pyroabyss-infernal-sun', 'Infernal Suncore', 'Pyroabyss', 'btei-pyroabyss-infernal-archon', 'A black star wrapped in screaming cinder-rings.', 'boss_pyroabyss_infernal_sun'),
  createBoss(18, 'boss-pyroabyss-rift-bell', 'Riftbell Catastrophe', 'Pyroabyss', 'btei-pyroabyss-hellrift-mandala', 'Each toll multiplies chain growth and doubles the heat debt.', 'boss_pyroabyss_rift_bell'),
  createBoss(19, 'boss-pyroabyss-phoenix-judge', 'Phoenix Judge of the Abyss', 'Pyroabyss', 'btei-pyroabyss-oblivion-phoenix', 'It burns, returns, and arrives stronger than the concept of last time.', 'boss_pyroabyss_phoenix_judge'),

  // Heavenly Light (5)
  createBoss(20, 'boss-light-aurora-throne', 'Aurora Throne', 'Heavenly Light', 'btei-light-sunbreak-canon', 'A throne-forge that weaponizes dawn itself.', 'boss_light_aurora_throne'),
  createBoss(21, 'boss-light-sanctum-breaker', 'Sanctum Breaker', 'Heavenly Light', 'btei-light-aureate-rapture', 'A radiant siege engine fueled by broken vows and holy plasma.', 'boss_light_sanctum_breaker'),
  createBoss(22, 'boss-light-choral-tyrant', 'Choral Tyrant', 'Heavenly Light', 'btei-light-choir-imperator', 'An angelic conductor who commands entire choirs with a glance.', 'boss_light_choral_tyrant'),
  createBoss(23, 'boss-light-halo-legion', 'Halo Legion Prime', 'Heavenly Light', 'btei-light-halo-dominion', 'A legion nucleus that duplicates every miracle as ordinance.', 'boss_light_halo_legion'),
  createBoss(24, 'boss-light-morning-crown', 'Morning Crown Absolute', 'Heavenly Light', 'btei-light-throne-of-morning', 'The summit of Heavenly Light doctrine: mercy as annihilation.', 'boss_light_morning_crown'),

  // Thornbound Plains (5)
  createBoss(25, 'boss-thornbound-bleeding-road', 'Bleeding Road Matriarch', 'Thornbound Plains', 'btei-thornbound-briar-siege', 'An iron-willed caravaneer who paved empires with thorn and ash.', 'boss_thornbound_bleeding_road'),
  createBoss(26, 'boss-thornbound-ragged-banner', 'Ragged Banner Host', 'Thornbound Plains', 'btei-thornbound-red-march', 'A migrating war-choir that turns attrition into inevitability.', 'boss_thornbound_ragged_banner'),
  createBoss(27, 'boss-thornbound-cathedral-lance', 'Cathedral Lance', 'Thornbound Plains', 'btei-thornbound-cathedral-lancer', 'A mobile reliquary that impales whole timelines on red briar spears.', 'boss_thornbound_cathedral_lance'),
  createBoss(28, 'boss-thornbound-grave-hedge', 'Grave Hedge Reliquary', 'Thornbound Plains', 'btei-thornbound-funeral-bramble', 'A funerary maze that remembers every step and punishes repeats.', 'boss_thornbound_grave_hedge'),
  createBoss(29, 'boss-thornbound-gallowcrown', 'Gallowcrown Matron', 'Thornbound Plains', 'btei-thornbound-gallowcrown-matron', 'The sovereign of harrowed roads, where survival is worship.', 'boss_thornbound_gallowcrown'),

  // Mechanical Dreams (5)
  createBoss(30, 'boss-mech-overclock-arch', 'Overclock Arch-Engine', 'Mechanical Dreams', 'btei-mech-overclock-singularity', 'A machine cathedral whose prayer is acceleration.', 'boss_mech_overclock_arch'),
  createBoss(31, 'boss-mech-furnace-mind', 'Furnace Mind Helix', 'Mechanical Dreams', 'btei-mech-furnace-ascension', 'An impossible processor that refines strain into prophecy.', 'boss_mech_furnace_mind'),
  createBoss(32, 'boss-mech-brass-tribunal', 'Brass Tribunal', 'Mechanical Dreams', 'btei-mech-brass-judicator', 'Three synchronized judges sharing one merciless verdict loop.', 'boss_mech_brass_tribunal'),
  createBoss(33, 'boss-mech-reactor-psalm', 'Reactor Psalm Engine', 'Mechanical Dreams', 'btei-mech-reactor-paradigm', 'A liturgical core that turns each vent into a war hymn.', 'boss_mech_reactor_psalm'),
  createBoss(34, 'boss-mech-primevector', 'Primevector Thaumiel', 'Mechanical Dreams', 'btei-mech-thaumic-primevector', 'The terminal machine-angel where all overclocks converge.', 'boss_mech_primevector'),

  // Prismatic Accord (5)
  createBoss(35, 'boss-prismatic-mirror-regent', 'Vorthum Mirror Regent', 'Prismatic Accord', 'btei-prismatic-vorthum-edict', 'A monarch of perfect steel reflection whose body turns every gaze into a weaponized spectrum.', 'boss_prismatic_mirror_regent'),
  createBoss(36, 'boss-prismatic-fracture-hierophant', 'Fracture Road Hierophant', 'Prismatic Accord', 'btei-prismatic-fracture-archive', 'A priest of split causality who walks all possible roads and closes only the ones you need.', 'boss_prismatic_fracture_hierophant'),
  createBoss(37, 'boss-prismatic-drift-leviathan', 'Drift Canopy Leviathan', 'Prismatic Accord', 'btei-prismatic-storm-memory', 'An altitude-born shardborn titan carrying entire weather systems inside its mirrored spine.', 'boss_prismatic_drift_leviathan'),
  createBoss(38, 'boss-prismatic-blindwars-reliquary', 'Reliquary of Blind Wars', 'Prismatic Accord', 'btei-prismatic-blindwars-reliquary', 'A living mausoleum of old accords, where every buried oath wakes up armed.', 'boss_prismatic_blindwars_reliquary'),
  createBoss(39, 'boss-prismatic-whitebeam-concordat', 'Whitebeam Concordat', 'Prismatic Accord', 'btei-prismatic-ninefold-accord', 'The nine-day beam given judgmental will, still holding the truce together by force of light.', 'boss_prismatic_whitebeam_concordat'),
];

export const BOSS_DEFINITIONS: BossDefinition[] = BOSS_BLUEPRINTS.map((boss, index, bosses) => ({
  ...boss,
  hp: getScaledBossHp(index, bosses.length),
}));
