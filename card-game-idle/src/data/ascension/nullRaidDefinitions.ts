/**
 * Null Raid definitions for the Ascension game mode.
 *
 * A Null Raid is a timed, multi-encounter sequence of boss fights that must
 * be completed without pause. Completing encounters awards Entropy and
 * Aberrated Shards. A 5% chance on the final boss kill drops a rare Angel
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
  /** Entropy granted per defeated encounter boss. */
  entropyPerEncounter: number;
  /** Aberrated Shards granted per defeated encounter boss. */
  shardsPerEncounter: number;
  /** Cooldown after a failed run (ms). Default: 5 minutes. */
  cooldownMs: number;
  /** Definition id of the rare Angel dropped on final boss kill (5% chance). */
  completionAngelId?: string;
}

// ── Null Raid Bosses ────────────────────────────────────────────────────────
// These bosses are exclusively used inside Null Raids and do not appear
// in Eternity's Wake tabs. HP ranges:
//   1-star encounters: 2.5M – 10M
//   2-star encounters: 5M – 120M
//   3-star encounters: 10M – 2.5B

const NULL_RAID_BOSSES: NullRaidBoss[] = [
  // ── The Fractured Verdict (1★, Neutrality) ────────────────────────────
  {
    id: 'nr-verdict-voidfract',
    name: 'Voidfract, the Undecided',
    hp: 2_500_000,
    description:
      'A fragment of shattered neutrality that cannot commit to either side of balance.',
  },
  {
    id: 'nr-verdict-null-arbitrator',
    name: 'The Null Arbitrator',
    hp: 8_000_000,
    description:
      'The final judge of the Fractured Verdict — its silence is absolute, its verdict final.',
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
    id: 'raid-fractured-verdict',
    name: 'The Fractured Verdict',
    stars: 1,
    description:
      'The equilibrium shattered. Two forces that refuse to settle demand a reckoning. ' +
      'Neutrality-focused decks excel here — Patience and Attenuation are rewarded.',
    associatedSet: 'Neutrality',
    resonanceRequired: 50_000,
    recommendedResonance: 120_000,
    encounterBossIds: ['nr-verdict-voidfract', 'nr-verdict-null-arbitrator'],
    entropyPerEncounter: 75,
    shardsPerEncounter: 20,
    cooldownMs: 5 * 60 * 1000,
    completionAngelId: 'tx-angel-null-verdant',
  },
];
