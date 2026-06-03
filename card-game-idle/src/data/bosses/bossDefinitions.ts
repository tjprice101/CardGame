import { NULL_RAID_BOSS_MAP } from '@/data/ascension/nullRaidDefinitions';
import type { ProgressState } from '@/types/game';
import type { BossDefinition, BossCategory } from '@/types/bossFight';

export const BOSS_FIGHT_ROUND_SECONDS = 180;

const FIRST_SET_FIRST_BOSS_HP = 50_000;
const SET_FINAL_HP_MULTIPLIER = 3.0;
const EVENT_BOSS_CATEGORY: BossCategory = '[EVENT] Wished Upon A Star';

// Bump this when rotating to a new live event cycle.
export const EVENT_BOSS_HP_CYCLE_ID = 'wuas-cycle-2026-06-hp5x';
const EVENT_BOSS_ANCHOR_PERCENTILE = 0.84;
const EVENT_BOSS_ABOVE_NON_EVENT_FACTOR = 1.08;
const EVENT_BOSS_BELOW_RAID_FACTOR = 0.9;

function roundBossHp(value: number): number {
  if (value >= 10_000_000) return Math.round(value / 25_000) * 25_000;
  if (value >= 1_000_000) return Math.round(value / 10_000) * 10_000;
  if (value >= 100_000) return Math.round(value / 2_500) * 2_500;
  return Math.round(value / 500) * 500;
}

function buildSetAnchoredBossHpCurve(bosses: BossBlueprint[]): number[] {
  if (bosses.length === 0) return [];

  const scaledHp: number[] = new Array(bosses.length);
  let cursor = 0;
  let previousSetFinalHp: number | null = null;

  while (cursor < bosses.length) {
    const currentCategory = bosses[cursor]?.category;
    if (!currentCategory) break;

    let setEnd = cursor;
    while (setEnd + 1 < bosses.length && bosses[setEnd + 1]?.category === currentCategory) {
      setEnd += 1;
    }

    const setSize = setEnd - cursor + 1;
    const setFirstHp = previousSetFinalHp == null
      ? FIRST_SET_FIRST_BOSS_HP
      : roundBossHp(previousSetFinalHp * 0.5);
    const setFinalHp = roundBossHp(setFirstHp * SET_FINAL_HP_MULTIPLIER);

    for (let offset = 0; offset < setSize; offset += 1) {
      const progress = setSize <= 1 ? 1 : offset / (setSize - 1);
      const hp = setFirstHp + (setFinalHp - setFirstHp) * progress;
      scaledHp[cursor + offset] = roundBossHp(hp);
    }

    previousSetFinalHp = setFinalHp;
    cursor = setEnd + 1;
  }

  return scaledHp;
}

function getScaledBossHp(index: number, totalBosses: number): number {
  if (totalBosses <= 0) return FIRST_SET_FIRST_BOSS_HP;
  const clampedIndex = Math.max(0, Math.min(index, totalBosses - 1));
  return BOSS_SCALED_HP_BY_INDEX[clampedIndex]
    ?? BOSS_SCALED_HP_BY_INDEX[totalBosses - 1]
    ?? FIRST_SET_FIRST_BOSS_HP;
}

function getPercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return FIRST_SET_FIRST_BOSS_HP;
  const clamped = Math.max(0, Math.min(1, percentile));
  const idx = Math.round((sortedValues.length - 1) * clamped);
  return sortedValues[Math.max(0, Math.min(sortedValues.length - 1, idx))] ?? sortedValues[sortedValues.length - 1];
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
  createBoss(2, 'boss-cherubim-sovereign', 'The Cherubim Sovereign', 'Neutrality', 'btei-sovereign-domain', 'Formed from colliding entropy stacks, it turns stable lines into catastrophic gambles.', 'boss_cherubim_sovereign'),
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
  createBoss(18, 'boss-pyroabyss-rift-bell', 'Riftbell Catastrophe', 'Pyroabyss', 'btei-pyroabyss-hellrift-mandala', 'Each toll multiplies chain growth and turns the furnace chorus into catastrophic burst.', 'boss_pyroabyss_rift_bell'),
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

  // Snowbound Voltage (5)
  createBoss(40, 'boss-snowbound-polar-conductor', 'Frostborn Surge Sovereign', 'Snowbound Voltage', 'sv-eternal-frost-charge', 'A legendary maestro of frozen symphonies whose baton directs both storm and stasis.', 'boss_snowbound_polar_conductor'),
  createBoss(41, 'boss-snowbound-aurora-nexus', 'Aurora Nexus Core', 'Snowbound Voltage', 'sv-eternal-aurora-battery', 'A convergence point where all polar auroras collapse into a singularity of voltage.', 'boss_snowbound_aurora_nexus'),
  createBoss(42, 'boss-snowbound-glacier-beacon', 'Glacier Beacon Sentinel', 'Snowbound Voltage', 'sv-eternal-glacier-signal', 'An ancient relay guardian whose signal illuminates frozen chasms and frozen time alike.', 'boss_snowbound_glacier_beacon'),
  createBoss(43, 'boss-snowbound-white-requiem', 'White Requiem Choir', 'Snowbound Voltage', 'sv-eternal-white-static', 'A ghost chorus singing the final lament of all voltage, all heat, all motion.', 'boss_snowbound_white_requiem'),
  createBoss(44, 'boss-snowbound-blizzard-requiem', 'Blizzard Requiem Symphony', 'Snowbound Voltage', 'sv-eternal-sleet-choir', 'The convergence of all frozen storms, each note a new ice age unfurling.', 'boss_snowbound_blizzard_requiem'),

  // Black Glass Inferno (5)
  createBoss(45, 'boss-inferno-vaelthorax-grief', 'Vaelthorax the Grieffire', 'Black Glass Inferno', 'btei-bgi-cindershard-lexicon', 'An ancient white-scaled tyrant whose flame names and burns truth into blackened glass.', 'boss_inferno_vaelthorax_grief'),
  createBoss(46, 'boss-inferno-morvakael-answer', 'Morvakael Thrice-Scarred', 'Black Glass Inferno', 'btei-bgi-blackglass-catastrophe', 'A draconic sovereign whose scars are treaties written in chromatic ruin and sorrow.', 'boss_inferno_morvakael_answer'),
  createBoss(47, 'boss-inferno-sorveth-flame', 'Sorveth, Twin-Scaled Herald', 'Black Glass Inferno', 'btei-bgi-inferborn-prophecy', 'A dual-scaled messenger holding both truth and lie in perfect equilibrium within one breath.', 'boss_inferno_sorveth_flame'),
  createBoss(48, 'boss-inferno-cinderborn-court', 'Cinderborn Matriarch Court', 'Black Glass Inferno', 'btei-bgi-velplane-ossuary', 'A council of infernal queens crowned in inverted black-glass roses and void promises.', 'boss_inferno_cinderborn_court'),
  createBoss(49, 'boss-inferno-ashen-sovereign', 'Ashen Court Regent', 'Black Glass Inferno', 'btei-bgi-rosecrown-annihilator', 'The monarch of all ash and sorrow, ruling the blackglass kingdoms from a throne of grief-fire.', 'boss_inferno_ashen_sovereign'),

  // Glass Absolute (5)
  createBoss(50, 'boss-glass-lattice-archive', 'Lattice Archive Seraph', 'Glass Absolute', 'ga-et-lattice-archive-seraph', 'A vault-seraph forged from recursive panes that catalog every beam crossing Vyrel.', 'boss_glass_lattice_archive'),
  createBoss(51, 'boss-glass-angled-infinity', 'Angled Infinity', 'Glass Absolute', 'ga-et-angled-infinity', 'An impossible custodian whose mirrored angles fold corridors through themselves.', 'boss_glass_angled_infinity'),
  createBoss(52, 'boss-glass-first-white', 'First White', 'Glass Absolute', 'ga-et-first-white', 'The origin flash where all spectrum begins and every refraction takes oath.', 'boss_glass_first_white'),
  createBoss(53, 'boss-glass-center-everywhere', 'The Center That Is Everywhere', 'Glass Absolute', 'ga-et-center-everywhere', 'A transcendent axis-body that turns any point in space into a central throne.', 'boss_glass_center_everywhere'),
  createBoss(54, 'boss-glass-perfect-refraction', 'Perfect Refraction', 'Glass Absolute', 'ga-et-perfect-refraction', 'A flawless splitter of white light that judges by geometric certainty.', 'boss_glass_perfect_refraction'),

  // The Blazing Garden (5)
  createBoss(55, 'boss-garden-proofflame', 'Serevathi Proofflame', 'The Blazing Garden', 'bg-et-serevathi-proofflame', 'A rose-sovereign proving every grief can be burned into living growth.', 'boss_garden_proofflame'),
  createBoss(56, 'boss-garden-evernoon', 'Aureveth Evernoon', 'The Blazing Garden', 'bg-et-aureveth-evernoon', 'A sunflower colossus whose noonfire never sets and never yields.', 'boss_garden_evernoon'),
  createBoss(57, 'boss-garden-seven-crown', 'Vethkorath Seven-Crown Proof', 'The Blazing Garden', 'bg-et-vethkorath-seven-crown-proof', 'A thistle theorem embodied, crowned seven times in violet flame.', 'boss_garden_seven_crown'),
  createBoss(58, 'boss-garden-codex', 'Embergrove Codex', 'The Blazing Garden', 'bg-et-embergrove-codex', 'An archive-garden where every lost color is preserved for rekindling.', 'boss_garden_codex'),
  createBoss(59, 'boss-garden-noonproof-transit', 'Noonproof Transit', 'The Blazing Garden', 'bg-et-noonproof-transit', 'A blazing corridor through petal megastructures where motion and ritual are one.', 'boss_garden_noonproof_transit'),

  // Age of the Butterfly (5)
  createBoss(60, 'boss-butterfly-kethravoss', 'Kethravoss of the Seven Layers', 'Age of the Butterfly', 'bf-et-kethravoss-seven-layers', 'A seven-layered wing-saint whose every membrane filters one impossible color from the future.', 'boss_butterfly_kethravoss'),
  createBoss(61, 'boss-butterfly-mirrorglass', 'Mirrorglass Conclave', 'Age of the Butterfly', 'bf-et-mirrorglass-conclave', 'A council of refracting wings that votes by reflection and rules by aperture.', 'boss_butterfly_mirrorglass'),
  createBoss(62, 'boss-butterfly-nullwing', 'Nullwing Interstice', 'Age of the Butterfly', 'bf-et-nullwing-interstice', 'The interval between wingbeats where light forgets the names of its own colors.', 'boss_butterfly_nullwing'),
  createBoss(63, 'boss-butterfly-pyrethkai', 'Pyrethkai Equilibrium', 'Age of the Butterfly', 'bf-et-pyrethkai-equilibrium', 'A whitefire chrysalis balanced on the exact angle at which heat becomes meaning.', 'boss_butterfly_pyrethkai'),
  createBoss(64, 'boss-butterfly-volthari', 'Volthari Storm Lattice', 'Age of the Butterfly', 'bf-et-volthari-storm-lattice', 'A storm-architect whose every gust is choreographed to break a single chord.', 'boss_butterfly_volthari'),

  // Eternal Seas (5)
  createBoss(65, 'boss-seas-aeveleth', 'Aeveleth First Drift', 'Eternal Seas', 'es-et-aeveleth-first-drift', 'The first current that ever moved — still flowing, still rewriting every shore it passes.', 'boss_seas_aeveleth'),
  createBoss(66, 'boss-seas-surevaan', 'Surevaan Anomaly Log', 'Eternal Seas', 'es-et-surevaan-anomaly-log', 'A living record of every wave that should not have happened, weaponized.', 'boss_seas_surevaan'),
  createBoss(67, 'boss-seas-thyrvaan', 'Thyrvaan Oldlight Grid', 'Eternal Seas', 'es-et-thyrvaan-oldlight-grid', 'A submerged lattice of pre-stellar light that judges by depth, not brightness.', 'boss_seas_thyrvaan'),
  createBoss(68, 'boss-seas-seven-margins', 'Crown of Seven Margins', 'Eternal Seas', 'es-et-crown-of-seven-margins', 'Seven veilmargin tides braided into a sovereign’s diadem of pressure and silence.', 'boss_seas_seven_margins'),
  createBoss(69, 'boss-seas-veleth-abyss', 'Veleth Abyss Sounding', 'Eternal Seas', 'es-et-veleth-abyss-sounding', 'A trench-prayer whose echo returns from depths that should not contain echoes.', 'boss_seas_veleth_abyss'),

  // Abyssal Forge (5)
  createBoss(70, 'boss-forge-beneath', 'The Forge Beneath', 'Abyssal Forge', 'af-et-forge-beneath', 'The anvil at the bottom of every ocean — where heat is pressure and pressure is prayer.', 'boss_forge_beneath'),
  createBoss(71, 'boss-ouroglas-dreaming', 'Ouroglas Dreaming', 'Abyssal Forge', 'af-et-ouroglas-dreaming', 'A coiled serpent of fused glass whose every dream re-tempers the world.', 'boss_ouroglas_dreaming'),
  createBoss(72, 'boss-quenched-drift', 'The Quenched Drift', 'Abyssal Forge', 'af-et-quenched-drift', 'A current of cooling slag that drowns flame and forges silence.', 'boss_quenched_drift'),
  createBoss(73, 'boss-nacre-procession', 'Nacre-touched Procession', 'Abyssal Forge', 'af-et-nacre-touched-procession', 'Pilgrims welded into pearl, marching the molten road that never sets.', 'boss_nacre_procession'),
  createBoss(74, 'boss-pearled-pantheon', 'The Pearled Pantheon', 'Abyssal Forge', 'af-et-pearled-pantheon', 'Gods reforged in nacre and ember, crowning the abyss as their own anvil.', 'boss_pearled_pantheon'),

  // Death-flamed Hell (4)
  createBoss(75, 'boss-skull-ceiling-garrison', 'Skull-Ceiling Garrison', 'Death-flamed Hell', 'dfh-et-skull-ceiling-garrison', 'A vaulted host of bone wardens whose ceiling is the underside of every doom.', 'boss_skull_ceiling_garrison'),
  createBoss(76, 'boss-othraks-communion', 'Othrak’s Eternal Communion', 'Death-flamed Hell', 'dfh-et-othraks-eternal-communion', 'A choir of mournshade celebrants who pass the chalice of pale fire forever.', 'boss_othraks_communion'),
  createBoss(77, 'boss-crimson-ember-rain', 'Crimson Ember Rain', 'Death-flamed Hell', 'dfh-et-crimson-ember-rain', 'A weather of falling coals that remembers every name it has burned.', 'boss_crimson_ember_rain'),
  createBoss(78, 'boss-veiled-procession', 'Eternal Procession of the Veiled', 'Death-flamed Hell', 'dfh-et-eternal-procession-of-the-veiled', 'A bridal march beneath shrouds of death-flame, advancing into every living world.', 'boss_veiled_procession'),
  // [EVENT] Wished Upon A Star (3)
  createBoss(79, 'boss-wuas-aethervex-wishwright', 'Aethervex, the Wishwright', '[EVENT] Wished Upon A Star', 'wuas-et-aethervex-wishwright', 'A galaxy-winged colossus with fire-fanged jaws that consume the wishes of dead stars.', 'boss_wuas_aethervex_wishwright'),
  createBoss(80, 'boss-wuas-selenira-voidbane', 'Selenira Voidbane', '[EVENT] Wished Upon A Star', 'wuas-et-selenira-voidbane', 'An ash-white war-goddess clad in dead-star armor, whose supernovae eyes render judgment.', 'boss_wuas_selenira_voidbane'),
  createBoss(81, 'boss-wuas-draethos-unforgotten', 'Draethos, The Unforgotten', '[EVENT] Wished Upon A Star', 'wuas-et-draethos-unforgotten', 'An unstable god shifting between child and titan, trailing nightmare-crystal fangs and funeral-ash wings.', 'boss_wuas_draethos_unforgotten'),
];

const BOSS_SCALED_HP_BY_INDEX = buildSetAnchoredBossHpCurve(BOSS_BLUEPRINTS);

const NON_EVENT_BOSS_HP = BOSS_BLUEPRINTS
  .map((boss, index) => (boss.category === EVENT_BOSS_CATEGORY ? null : BOSS_SCALED_HP_BY_INDEX[index]))
  .filter((hp): hp is number => hp !== null)
  .sort((a, b) => a - b);

const NON_EVENT_BOSS_MAX_HP = NON_EVENT_BOSS_HP[NON_EVENT_BOSS_HP.length - 1] ?? FIRST_SET_FIRST_BOSS_HP;
const NON_EVENT_BOSS_ANCHOR_HP = getPercentile(NON_EVENT_BOSS_HP, EVENT_BOSS_ANCHOR_PERCENTILE);
const NULL_RAID_MIN_HP = Math.min(...Array.from(NULL_RAID_BOSS_MAP.values()).map(boss => boss.hp));
const EVENT_BOSS_HP_UPPER_BOUND = Number.isFinite(NULL_RAID_MIN_HP)
  ? roundBossHp(NULL_RAID_MIN_HP * EVENT_BOSS_BELOW_RAID_FACTOR)
  : roundBossHp(NON_EVENT_BOSS_MAX_HP * 3);
const EVENT_BOSS_MIN_ABOVE_NON_EVENT = (() => {
  const baseline = roundBossHp(NON_EVENT_BOSS_MAX_HP * EVENT_BOSS_ABOVE_NON_EVENT_FACTOR);
  return baseline > NON_EVENT_BOSS_MAX_HP ? baseline : NON_EVENT_BOSS_MAX_HP + 2_500;
})();

const EVENT_BOSS_COMPUTED_HP = roundBossHp(Math.min(
  EVENT_BOSS_HP_UPPER_BOUND,
  Math.max(
    EVENT_BOSS_MIN_ABOVE_NON_EVENT,
    NON_EVENT_BOSS_ANCHOR_HP * EVENT_BOSS_ABOVE_NON_EVENT_FACTOR,
  ),
));

export interface EventBossHpSnapshot {
  cycleId: string;
  hp: number;
}

export function isEventBossCategory(category: BossCategory): boolean {
  return category === EVENT_BOSS_CATEGORY;
}

export function getCurrentCycleEventBossHp(): number {
  return EVENT_BOSS_COMPUTED_HP;
}

export function getEventBossHpSnapshot(progress: ProgressState): EventBossHpSnapshot | null {
  const snapshots = progress.eventBossHpSnapshots;
  if (!snapshots) return null;
  const snapshot = snapshots[EVENT_BOSS_CATEGORY];
  if (!snapshot) return null;
  if (snapshot.cycleId !== EVENT_BOSS_HP_CYCLE_ID) return null;
  if (!Number.isFinite(snapshot.hp) || snapshot.hp <= 0) return null;
  return { cycleId: snapshot.cycleId, hp: Math.floor(snapshot.hp) };
}

export function getEventBossHpForProgress(progress: ProgressState): number {
  const snapshot = getEventBossHpSnapshot(progress);
  return snapshot?.hp ?? getCurrentCycleEventBossHp();
}

export function ensureEventBossHpSnapshot(progress: ProgressState): number {
  if (!progress.eventBossHpSnapshots) progress.eventBossHpSnapshots = {};
  const existing = getEventBossHpSnapshot(progress);
  if (existing) return existing.hp;

  const hp = getCurrentCycleEventBossHp();
  progress.eventBossHpSnapshots[EVENT_BOSS_CATEGORY] = {
    cycleId: EVENT_BOSS_HP_CYCLE_ID,
    hp,
  };
  return hp;
}

export function getBossDisplayHp(progress: ProgressState, boss: BossDefinition): number {
  if (isEventBossCategory(boss.category)) return getEventBossHpForProgress(progress);
  return boss.hp;
}

export const BOSS_DEFINITIONS: BossDefinition[] = BOSS_BLUEPRINTS.map((boss, index, bosses) => ({
  ...boss,
  hp: isEventBossCategory(boss.category)
    ? EVENT_BOSS_COMPUTED_HP
    : BOSS_SCALED_HP_BY_INDEX[index] ?? getScaledBossHp(index, bosses.length),
}));
