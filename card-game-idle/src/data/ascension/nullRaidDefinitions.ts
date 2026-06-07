/**
 * Null Raid definitions for the Ascension game mode.
 *
 * A Null Raid is a timed, multi-encounter sequence of boss fights that must
 * be completed without pause. Completing encounters awards Entropic Energy and
 * Aberrated Shards. A 1% chance on the final boss kill drops a rare Angel
 * card unique to that raid's associated card set.
 */

// ── Encounter time limit ────────────────────────────────────────────────────
/** Each encounter in a null raid is limited to 120 seconds (2 minutes). */
export const NULL_RAID_ENCOUNTER_SECONDS = 120;
/** Prove Yourself check window for raid unlocks. */
export const NULL_RAID_PROVE_YOURSELF_SECONDS = 60;
/** Unlock threshold: deal one-third of the first encounter boss HP in time. */
export const NULL_RAID_PROVE_YOURSELF_DAMAGE_FRACTION = 1 / 3;

// ── Null Raid Boss ──────────────────────────────────────────────────────────

export interface NullRaidBoss {
  id: string;
  name: string;
  /** Hit points for this encounter. Significantly higher than normal bosses. */
  hp: number;
  description: string;
}

// ── Null Raid Definition ────────────────────────────────────────────────────

export interface NullRaidDefinition {
  id: string;
  name: string;
  /** Star difficulty tier (1 = easiest, 3 = hardest). */
  stars: 1 | 2 | 3;
  description: string;
  /** Element key of the primary card set this raid is themed after. */
  associatedSet: string;
  /** Ordered list of boss ids for each encounter. */
  encounterBossIds: string[];
  /** Entropic Energy granted per defeated encounter boss. */
  entropyPerEncounter: number;
  /** Aberrated Shards granted per defeated encounter boss. */
  shardsPerEncounter: number;
  /** Cooldown after a failed run (ms). Default: 5 minutes. */
  cooldownMs: number;
  /** Definition id of the rare Angel dropped on final boss kill (1% chance). */
  completionAngelId?: string;
}

// ── Null Raid Bosses ────────────────────────────────────────────────────────
// These bosses are exclusively used inside Null Raids and do not appear
// in Eternity's Wake tabs. Their HP continues the endgame curve using a
// linear ramp from the first to last encounter.
const NULL_RAID_FIRST_BOSS_HP = 112_500_000;
const NULL_RAID_FINAL_BOSS_HP = 337_500_000;

function roundNullRaidHp(value: number): number {
  return Math.max(1, Math.round(value / 5_000_000) * 5_000_000);
}

function getLinearNullRaidBossHp(index: number, totalBosses: number): number {
  if (totalBosses <= 1) return roundNullRaidHp(NULL_RAID_FIRST_BOSS_HP);
  const clampedIndex = Math.max(0, Math.min(index, totalBosses - 1));
  const progress = clampedIndex / (totalBosses - 1);
  const hp = NULL_RAID_FIRST_BOSS_HP + (NULL_RAID_FINAL_BOSS_HP - NULL_RAID_FIRST_BOSS_HP) * progress;
  return roundNullRaidHp(hp);
}

type NullRaidBossBlueprint = Omit<NullRaidBoss, 'hp'>;

const NULL_RAID_BOSS_BLUEPRINTS: NullRaidBossBlueprint[] = [
  // ── The Null Verdict of Stars (1★, Neutrality) ─────────────────────────
  {
    id: 'nr-neutrality-event-horizon-arbiter',
    name: 'Event Horizon Arbiter',
    description:
      'A cosmic neutrality judge that erases nebulae and timelines with a single breath.',
  },
  {
    id: 'nr-neutrality-verdant-null',
    name: 'Verdant Null, Last Wish Executioner',
    description:
      'The last wish-judge of the void court — it closes the universe like a final verdict.',
  },

  // ── Crown of the Abyssal Inferno (1★, Pyroabyss) ───────────────────────
  {
    id: 'nr-pyroabyss-ember-eventide-tyrant',
    name: 'Ember Eventide Tyrant',
    description:
      'An infernal war-beast of ash and stardust whose roars shatter spacetime.',
  },
  {
    id: 'nr-pyroabyss-pyraxis-nullstar-sovereign',
    name: 'Pyraxis Nullstar Sovereign',
    description:
      'A regal voidfire sovereign that extinguishes galaxies and reignites them as auroras.',
  },

  // ── Halo of the Twin Horizon (1★, Heavenly Light) ──────────────────────
  {
    id: 'nr-light-auric-eclipse-herald',
    name: 'Auric Eclipse Herald',
    description:
      'A dawnbound herald that forges eclipses from hymn-fire and judges the weak between two suns.',
  },
  {
    id: 'nr-light-zenith-duality-throne',
    name: 'Zenith Duality Throne',
    description:
      'The final heavenly throne where star-liturgy and divine fire converge into absolute judgment.',
  },
];

const NULL_RAID_BOSSES: NullRaidBoss[] = NULL_RAID_BOSS_BLUEPRINTS.map((boss, index, allBosses) => ({
  ...boss,
  hp: getLinearNullRaidBossHp(index, allBosses.length),
}));

// ── Boss Map ────────────────────────────────────────────────────────────────
/** Fast lookup map from boss id to NullRaidBoss data. */
export const NULL_RAID_BOSS_MAP = new Map<string, NullRaidBoss>(
  NULL_RAID_BOSSES.map(boss => [boss.id, boss]),
);

// ── Raid Definitions ────────────────────────────────────────────────────────

export const NULL_RAID_DEFINITIONS: NullRaidDefinition[] = [
  // ── 1-Star Raids ─────────────────────────────────────────────────────────
  {
    id: 'raid-null-verdict-of-stars',
    name: 'The Null Verdict of Stars',
    stars: 1,
    description:
      'The final courtroom of stars has opened. Neutrality and wish-light merge into a verdict that deletes timelines.',
    associatedSet: 'Neutrality',
    encounterBossIds: ['nr-neutrality-event-horizon-arbiter', 'nr-neutrality-verdant-null'],
    entropyPerEncounter: 85,
    shardsPerEncounter: 22,
    cooldownMs: 5 * 60 * 1000,
    completionAngelId: 'tx-angel-starbound-null-archangel',
  },
  {
    id: 'raid-crown-of-the-dying-constellation',
    name: 'Crown of the Abyssal Inferno',
    stars: 1,
    description:
      'The Abyss Furnace has swallowed a dead wish-star and crowned two infernal sovereigns in its place.',
    associatedSet: 'Pyroabyss',
    encounterBossIds: ['nr-pyroabyss-ember-eventide-tyrant', 'nr-pyroabyss-pyraxis-nullstar-sovereign'],
    entropyPerEncounter: 90,
    shardsPerEncounter: 24,
    cooldownMs: 5 * 60 * 1000,
    completionAngelId: 'tx-angel-pyro-first-ember',
  },
  {
    id: 'raid-halo-of-the-twin-horizon',
    name: 'Halo of the Twin Horizon',
    stars: 1,
    description:
      'Heavenly Light and wish-born starlit doctrine fuse into a duality trial of mercy and annihilation.',
    associatedSet: 'Heavenly Light',
    encounterBossIds: ['nr-light-auric-eclipse-herald', 'nr-light-zenith-duality-throne'],
    entropyPerEncounter: 95,
    shardsPerEncounter: 25,
    cooldownMs: 5 * 60 * 1000,
    completionAngelId: 'tx-angel-light-astral-adjudicator',
  },
];

export function getNullRaidFirstEncounterBoss(raid: NullRaidDefinition): NullRaidBoss | null {
  const firstBossId = raid.encounterBossIds[0];
  if (!firstBossId) return null;
  return NULL_RAID_BOSS_MAP.get(firstBossId) ?? null;
}

export function getNullRaidProveYourselfTargetDamage(raid: NullRaidDefinition): number {
  const firstBoss = getNullRaidFirstEncounterBoss(raid);
  if (!firstBoss) return 0;
  return Math.max(1, Math.floor(firstBoss.hp * NULL_RAID_PROVE_YOURSELF_DAMAGE_FRACTION));
}
