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
  /** Minimum resonance score required to enter (hard lock). */
  resonanceRequired: number;
  /** Suggested resonance for comfortable clear (shown as recommendation). */
  recommendedResonance: number;
  /** Ordered list of boss ids for each encounter. */
  encounterBossIds: string[];
  /** Entropic Energy required to start the raid (currently 0 for all raids). */
  entryEntropyCost: number;
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
// in Eternity's Wake tabs. HP ranges:
//   1-star encounters: 2.5M – 10M
//   2-star encounters: 5M – 120M
//   3-star encounters: 10M – 2.5B

const NULL_RAID_BOSSES: NullRaidBoss[] = [
  // ── The Null Verdict of Stars (1★, Neutrality) ─────────────────────────
  {
    id: 'nr-neutrality-event-horizon-arbiter',
    name: 'Event Horizon Arbiter',
    hp: 3_000_000,
    description:
      'A cosmic neutrality judge that erases nebulae and timelines with a single breath.',
  },
  {
    id: 'nr-neutrality-verdant-null',
    name: 'Verdant Null, Last Wish Executioner',
    hp: 8_500_000,
    description:
      'The last wish-judge of the void court — it closes the universe like a final verdict.',
  },

  // ── Crown of the Abyssal Inferno (1★, Pyroabyss) ───────────────────────
  {
    id: 'nr-pyroabyss-ember-eventide-tyrant',
    name: 'Ember Eventide Tyrant',
    hp: 3_250_000,
    description:
      'An infernal war-beast of ash and stardust whose roars shatter spacetime.',
  },
  {
    id: 'nr-pyroabyss-pyraxis-nullstar-sovereign',
    name: 'Pyraxis Nullstar Sovereign',
    hp: 9_000_000,
    description:
      'A regal voidfire sovereign that extinguishes galaxies and reignites them as auroras.',
  },
];

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
    resonanceRequired: 120_000,
    recommendedResonance: 240_000,
    encounterBossIds: ['nr-neutrality-event-horizon-arbiter', 'nr-neutrality-verdant-null'],
    entryEntropyCost: 0,
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
    resonanceRequired: 140_000,
    recommendedResonance: 260_000,
    encounterBossIds: ['nr-pyroabyss-ember-eventide-tyrant', 'nr-pyroabyss-pyraxis-nullstar-sovereign'],
    entryEntropyCost: 0,
    entropyPerEncounter: 90,
    shardsPerEncounter: 24,
    cooldownMs: 5 * 60 * 1000,
    completionAngelId: 'tx-angel-pyro-first-ember',
  },
];
