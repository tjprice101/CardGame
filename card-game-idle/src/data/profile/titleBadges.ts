import type { ProgressState } from '@/types/game';
import type { BossCategory } from '@/types/bossFight';
import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';
import { infiniteCards } from '@/data/cards/infiniteCards';
import { CardRegistry } from '@/cards/CardRegistry';
import {
  getEverCollectionCount,
  getEverHoloTotal,
  getEverInfiniteCount,
  getEverInfiniteTotal,
} from '@/systems/progression/ownershipHistory';

/**
 * Title-badge registry. Unlock status is derived from ProgressState rather
 * than stored individually, so progression stays authoritative.
 *
 * After the milestone titles below, the registry is extended with dynamic
 * titles for every boss clear, every Infinite-finish card unlock, and every
 * full card-set completion.
 */
export type TitleBadgeGroup = 'milestone' | 'boss' | 'infinite' | 'set';

export interface TitleBadgeDefinition {
  id: string;
  /** Text displayed under the player's name (grammatical, title-cased). */
  text: string;
  /** Description shown in the picker. */
  description: string;
  /** Returns true when the player has earned this title. */
  isUnlocked: (progress: ProgressState) => boolean;
  /** Bucket used by the profile UI for grouping. */
  group: TitleBadgeGroup;
}

const totalBossClears = (counts: Record<string, number>): number =>
  Object.values(counts).reduce((a, b) => a + b, 0);

const totalNullRaidClears = (p: ProgressState): number =>
  Object.values(p.nullRaidClears ?? {}).reduce((a, b) => a + b, 0);

const totalTranscendentCards = (p: ProgressState): number =>
  Object.values(p.transcendentCollection ?? {}).reduce((a, b) => a + b, 0);

const socialCount = (p: ProgressState, key: keyof NonNullable<ProgressState['socialStats']>): number =>
  p.socialStats?.[key] ?? 0;

// ── Static milestone titles ────────────────────────────────────────────────
// All display text is title-cased and reads cleanly standalone under the
// player's name (e.g. "Wanderer · The Newborn").

const MILESTONE_TITLES: TitleBadgeDefinition[] = [
  {
    id: 'title-newborn',
    text: 'The Newborn',
    description: 'Always available — every soul begins here.',
    isUnlocked: () => true,
    group: 'milestone',
  },
  // ── Card-play milestones ─────────────────────────────────────────────────
  {
    id: 'title-first-play',
    text: 'First Draw',
    description: 'Play your first card.',
    isUnlocked: (p) => p.totalCardsPlayed >= 1,
    group: 'milestone',
  },
  {
    id: 'title-initiate',
    text: 'The Initiate',
    description: 'Play 50 cards.',
    isUnlocked: (p) => p.totalCardsPlayed >= 50,
    group: 'milestone',
  },
  {
    id: 'title-cardhand',
    text: 'Of the Steady Hand',
    description: 'Play 250 cards.',
    isUnlocked: (p) => p.totalCardsPlayed >= 250,
    group: 'milestone',
  },
  {
    id: 'title-pact-keeper',
    text: 'Pact Keeper',
    description: 'Play 500 cards.',
    isUnlocked: (p) => p.totalCardsPlayed >= 500,
    group: 'milestone',
  },
  {
    id: 'title-deckmaster',
    text: 'Deckmaster',
    description: 'Play 5,000 cards.',
    isUnlocked: (p) => p.totalCardsPlayed >= 5_000,
    group: 'milestone',
  },
  {
    id: 'title-endless-dealer',
    text: 'The Endless Dealer',
    description: 'Play 25,000 cards.',
    isUnlocked: (p) => p.totalCardsPlayed >= 25_000,
    group: 'milestone',
  },
  {
    id: 'title-card-torrent',
    text: 'The Torrent',
    description: 'Play 100,000 cards.',
    isUnlocked: (p) => p.totalCardsPlayed >= 100_000,
    group: 'milestone',
  },
  // ── Oblivion milestones ──────────────────────────────────────────────────
  {
    id: 'title-first-oblivion',
    text: 'Spark of Oblivion',
    description: 'Earn your first 1,000 Oblivion.',
    isUnlocked: (p) => (p.lifetimeOblivion ?? p.oblivion) >= 1_000,
    group: 'milestone',
  },
  {
    id: 'title-oblivion-touched',
    text: 'Oblivion-Touched',
    description: 'Earn 10,000 Oblivion in a single turn.',
    isUnlocked: (p) => (p.bestSingleTurnOblivion ?? 0) >= 10_000,
    group: 'milestone',
  },
  {
    id: 'title-stillness',
    text: 'Walker of Stillness',
    description: 'Earn 100,000 Oblivion.',
    isUnlocked: (p) => (p.lifetimeOblivion ?? p.oblivion) >= 100_000,
    group: 'milestone',
  },
  {
    id: 'title-million-veil',
    text: 'Veil of a Million',
    description: 'Earn 1,000,000 Oblivion.',
    isUnlocked: (p) => (p.lifetimeOblivion ?? p.oblivion) >= 1_000_000,
    group: 'milestone',
  },
  {
    id: 'title-of-the-eternal',
    text: 'Of the Eternal',
    description: 'Earn 10,000,000 Oblivion.',
    isUnlocked: (p) => (p.lifetimeOblivion ?? p.oblivion) >= 10_000_000,
    group: 'milestone',
  },
  // ── Oblivion apex ────────────────────────────────────────────────────────
  {
    id: 'title-oblivion-emperor',
    text: 'Emperor of Oblivion',
    description: 'Earn 100,000,000 Oblivion.',
    isUnlocked: (p) => (p.lifetimeOblivion ?? p.oblivion) >= 100_000_000,
    group: 'milestone',
  },
  // ── Boss milestones ──────────────────────────────────────────────────────
  {
    id: 'title-first-blood',
    text: 'First Blood',
    description: 'Defeat your first boss.',
    isUnlocked: (p) => Object.keys(p.bossClearCounts).length >= 1,
    group: 'milestone',
  },
  {
    id: 'title-bossbreaker',
    text: 'Bossbreaker',
    description: 'Defeat any 5 distinct bosses.',
    isUnlocked: (p) => Object.keys(p.bossClearCounts).length >= 5,
    group: 'milestone',
  },
  {
    id: 'title-bossbane',
    text: 'Bossbane',
    description: 'Defeat any 10 distinct bosses.',
    isUnlocked: (p) => Object.keys(p.bossClearCounts).length >= 10,
    group: 'milestone',
  },
  {
    id: 'title-boss-conqueror',
    text: 'Conqueror of the Wake',
    description: "Defeat 25 distinct bosses across Eternity's Wake.",
    isUnlocked: (p) => Object.keys(p.bossClearCounts).length >= 25,
    group: 'milestone',
  },
  {
    id: 'title-boss-champion',
    text: 'Champion of the Wake',
    description: "Defeat 50 distinct bosses across Eternity's Wake.",
    isUnlocked: (p) => Object.keys(p.bossClearCounts).length >= 50,
    group: 'milestone',
  },
  {
    id: 'title-first-victory',
    text: 'First Victory',
    description: "Earn your first boss victory in Eternity's Wake.",
    isUnlocked: (p) => totalBossClears(p.bossClearCounts) >= 1,
    group: 'milestone',
  },
  {
    id: 'title-wake-tested',
    text: 'Wake-Tested',
    description: "Achieve 10 total boss victories across Eternity's Wake.",
    isUnlocked: (p) => totalBossClears(p.bossClearCounts) >= 10,
    group: 'milestone',
  },
  {
    id: 'title-wake-warden',
    text: 'Warden of the Wake',
    description: "Achieve 50 total boss victories across Eternity's Wake.",
    isUnlocked: (p) => totalBossClears(p.bossClearCounts) >= 50,
    group: 'milestone',
  },
  {
    id: 'title-wake-sovereign',
    text: 'Sovereign of the Wake',
    description: 'Achieve 200 total boss victories.',
    isUnlocked: (p) => totalBossClears(p.bossClearCounts) >= 200,
    group: 'milestone',
  },
  {
    id: 'title-wake-tyrant',
    text: 'Tyrant of the Wake',
    description: 'Achieve 1,000 total boss victories.',
    isUnlocked: (p) => totalBossClears(p.bossClearCounts) >= 1_000,
    group: 'milestone',
  },
  // ── Daily login milestones ───────────────────────────────────────────────
  {
    id: 'title-returning',
    text: 'The Returning',
    description: 'Log in on 3 consecutive days.',
    isUnlocked: (p) => (p.dailyLogin?.streak ?? 0) >= 3,
    group: 'milestone',
  },
  {
    id: 'title-devoted',
    text: 'The Devoted',
    description: 'Maintain a 7-day login streak.',
    isUnlocked: (p) => (p.dailyLogin?.streak ?? 0) >= 7,
    group: 'milestone',
  },
  {
    id: 'title-faithful',
    text: 'The Faithful',
    description: 'Maintain a 30-day login streak.',
    isUnlocked: (p) => (p.dailyLogin?.streak ?? 0) >= 30,
    group: 'milestone',
  },
  {
    id: 'title-undying-flame',
    text: 'Undying Flame',
    description: 'Maintain a 100-day login streak.',
    isUnlocked: (p) => (p.dailyLogin?.streak ?? 0) >= 100,
    group: 'milestone',
  },
  {
    id: 'title-veteran',
    text: 'The Veteran',
    description: 'Log in on 50 total days.',
    isUnlocked: (p) => (p.dailyLogin?.totalClaims ?? 0) >= 50,
    group: 'milestone',
  },
  // ── Weekly Trial ─────────────────────────────────────────────────────────
  // Weekly Trial cosmetic titles (cosmetic-only rewards — no shards, no cards).
  {
    id: 'title-weekly-pilgrim',
    text: 'Weekly Pilgrim',
    description: 'Complete your first Weekly Trial.',
    isUnlocked: (p) => Object.keys(p.weeklyTrialCompletions ?? {}).length >= 1,
    group: 'milestone',
  },
  {
    id: 'title-weekly-warden',
    text: 'Warden of the Week',
    description: 'Complete 4 different Weekly Trials.',
    isUnlocked: (p) => Object.keys(p.weeklyTrialCompletions ?? {}).length >= 4,
    group: 'milestone',
  },
  {
    id: 'title-weekly-eternal',
    text: 'Eternal of the Week',
    description: 'Complete 12 different Weekly Trials.',
    isUnlocked: (p) => Object.keys(p.weeklyTrialCompletions ?? {}).length >= 12,
    group: 'milestone',
  },
  {
    id: 'title-weekly-unbroken',
    text: 'Unbroken Challenger',
    description: 'Complete 24 different Weekly Trials.',
    isUnlocked: (p) => Object.keys(p.weeklyTrialCompletions ?? {}).length >= 24,
    group: 'milestone',
  },
  // ── Collection milestones ────────────────────────────────────────────────
  {
    id: 'title-first-collection',
    text: 'The Collector',
    description: 'Own 10 distinct cards in your collection.',
    isUnlocked: (p) => Object.keys(p.collection).length >= 10,
    group: 'milestone',
  },
  {
    id: 'title-hoarder',
    text: 'Hoarder of Fates',
    description: 'Own 50 distinct cards in your collection.',
    isUnlocked: (p) => Object.keys(p.collection).length >= 50,
    group: 'milestone',
  },
  {
    id: 'title-archivist',
    text: 'Archivist',
    description: 'Own 100 distinct cards in your collection.',
    isUnlocked: (p) => Object.keys(p.collection).length >= 100,
    group: 'milestone',
  },
  {
    id: 'title-curator',
    text: 'Grand Curator',
    description: 'Own 250 distinct cards in your collection.',
    isUnlocked: (p) => Object.keys(p.collection).length >= 250,
    group: 'milestone',
  },
  {
    id: 'title-encyclopedist',
    text: 'Encyclopedist',
    description: 'Own 500 distinct cards in your collection.',
    isUnlocked: (p) => Object.keys(p.collection).length >= 500,
    group: 'milestone',
  },
  // ── Holo & Infinite ──────────────────────────────────────────────────────
  {
    id: 'title-first-holo',
    text: 'Refracted',
    description: 'Own your first holographic card.',
    isUnlocked: (p) => getEverHoloTotal(p) >= 1,
    group: 'milestone',
  },
  {
    id: 'title-holo-pilgrim',
    text: 'Prismatic Pilgrim',
    description: 'Own 10 holographic cards.',
    isUnlocked: (p) => getEverHoloTotal(p) >= 10,
    group: 'milestone',
  },
  {
    id: 'title-holo-devotee',
    text: 'Devotee of the Sheen',
    description: 'Own 50 holographic cards.',
    isUnlocked: (p) => getEverHoloTotal(p) >= 50,
    group: 'milestone',
  },
  {
    id: 'title-holo-saint',
    text: 'Saint of Refracted Light',
    description: 'Own 100 holographic cards.',
    isUnlocked: (p) => getEverHoloTotal(p) >= 100,
    group: 'milestone',
  },
  {
    id: 'title-first-infinite',
    text: 'Touched by Infinity',
    description: 'Own your first Infinite-finish card.',
    isUnlocked: (p) => getEverInfiniteTotal(p) >= 1,
    group: 'milestone',
  },
  {
    id: 'title-infinitude',
    text: 'Bearer of Infinitude',
    description: 'Own any 5 Infinite-finish cards.',
    isUnlocked: (p) => getEverInfiniteTotal(p) >= 5,
    group: 'milestone',
  },
  {
    id: 'title-infinite-sovereign',
    text: 'Sovereign of Infinity',
    description: 'Own any 10 Infinite-finish cards.',
    isUnlocked: (p) => getEverInfiniteTotal(p) >= 10,
    group: 'milestone',
  },
  {
    id: 'title-infinite-pantheon',
    text: 'The Infinite Pantheon',
    description: 'Own any 20 Infinite-finish cards.',
    isUnlocked: (p) => getEverInfiniteTotal(p) >= 20,
    group: 'milestone',
  },
  // ── Shards ───────────────────────────────────────────────────────────────
  {
    id: 'title-first-shard',
    text: 'The Chipped',
    description: 'Accumulate 100 Aberrated Shards.',
    isUnlocked: (p) => p.aberratedShards >= 100,
    group: 'milestone',
  },
  {
    id: 'title-shard-collector',
    text: 'Shard Collector',
    description: 'Accumulate 500 Aberrated Shards.',
    isUnlocked: (p) => p.aberratedShards >= 500,
    group: 'milestone',
  },
  {
    id: 'title-shard-hoarder',
    text: 'Shard Hoarder',
    description: 'Accumulate 2,500 Aberrated Shards.',
    isUnlocked: (p) => p.aberratedShards >= 2_500,
    group: 'milestone',
  },
  {
    id: 'title-shard-sovereign',
    text: 'Sovereign of Shards',
    description: 'Accumulate 10,000 Aberrated Shards.',
    isUnlocked: (p) => p.aberratedShards >= 10_000,
    group: 'milestone',
  },
  // ── New-content milestones: Ascension, PvP, and social ────────────────
  {
    id: 'title-null-raid-initiate',
    text: 'Null-Raid Initiate',
    description: 'Clear any Null Raid once.',
    isUnlocked: (p) => totalNullRaidClears(p) >= 1,
    group: 'milestone',
  },
  {
    id: 'title-null-raid-legend',
    text: 'Legend of the Void Corridor',
    description: 'Clear 25 Null Raids in total.',
    isUnlocked: (p) => totalNullRaidClears(p) >= 25,
    group: 'milestone',
  },
  {
    id: 'title-transcendent-caller',
    text: 'Caller of Transcendence',
    description: 'Own 3 Transcendent cards.',
    isUnlocked: (p) => totalTranscendentCards(p) >= 3,
    group: 'milestone',
  },
  {
    id: 'title-transcendent-pantheon',
    text: 'Pantheon of Transcendence',
    description: 'Own 12 Transcendent cards.',
    isUnlocked: (p) => totalTranscendentCards(p) >= 12,
    group: 'milestone',
  },
  {
    id: 'title-entropic-ascendant',
    text: 'Entropic Ascendant',
    description: 'Hold 10,000 Entropic Energy at once.',
    isUnlocked: (p) => (p.entropicEnergyBalance ?? p.entropyBalance ?? 0) >= 10_000,
    group: 'milestone',
  },
  {
    id: 'title-battleground-contender',
    text: 'Contender of the Card-born',
    description: 'Finish 10 Battleground matches.',
    isUnlocked: (p) => (p.battlegroundStats?.totalMatches ?? 0) >= 10,
    group: 'milestone',
  },
  {
    id: 'title-battleground-warmarshal',
    text: 'Warmarshal of the Card-born',
    description: 'Win 25 Battleground matches.',
    isUnlocked: (p) => (p.battlegroundStats?.wins ?? 0) >= 25,
    group: 'milestone',
  },
  {
    id: 'title-battleground-overlord',
    text: 'Overlord of the Card-born',
    description: 'Reach a Battleground best score of 250,000.',
    isUnlocked: (p) => (p.battlegroundStats?.bestScore ?? 0) >= 250_000,
    group: 'milestone',
  },
  {
    id: 'title-social-first-friend',
    text: 'Handshake of Eternity',
    description: 'Add your first friend.',
    isUnlocked: (p) => socialCount(p, 'friendsAccepted') >= 1,
    group: 'milestone',
  },
  {
    id: 'title-social-circle',
    text: 'Constellation of Allies',
    description: 'Add 5 friends.',
    isUnlocked: (p) => socialCount(p, 'friendsAccepted') >= 5,
    group: 'milestone',
  },
  {
    id: 'title-social-messenger',
    text: 'Courier of Echoes',
    description: 'Send 25 direct messages.',
    isUnlocked: (p) => socialCount(p, 'messagesSent') >= 25,
    group: 'milestone',
  },
  {
    id: 'title-social-attachment-archivist',
    text: 'Archivist of Threaded Relics',
    description: 'Send 10 messages with attachments.',
    isUnlocked: (p) => socialCount(p, 'messagesWithAttachment') >= 10,
    group: 'milestone',
  },
  {
    id: 'title-social-giftbearer',
    text: 'Giftbearer of the Wake',
    description: 'Send 5 gifts to friends.',
    isUnlocked: (p) => socialCount(p, 'giftsSent') >= 5,
    group: 'milestone',
  },
  {
    id: 'title-social-arena-herald',
    text: 'Arena Herald',
    description: 'Send 5 Battleground invites.',
    isUnlocked: (p) => socialCount(p, 'battlegroundInvitesSent') >= 5,
    group: 'milestone',
  },
  {
    id: 'title-social-raid-convener',
    text: 'Convener of the Wake',
    description: 'Send 3 co-op Eternity boss invites.',
    isUnlocked: (p) => socialCount(p, 'coopBossInvitesSent') >= 3,
    group: 'milestone',
  },
  {
    id: 'title-social-wingmate',
    text: 'Wingmate of the Wake',
    description: 'Accept 3 co-op Eternity boss invites.',
    isUnlocked: (p) => socialCount(p, 'coopBossInvitesAccepted') >= 3,
    group: 'milestone',
  },
  // ── Silly milestones ────────────────────────────────────────────────────
  {
    id: 'title-chaos-pigeon',
    text: 'Chaos Pigeon',
    description: 'Send 3 friend requests.',
    isUnlocked: (p) => socialCount(p, 'friendRequestsSent') >= 3,
    group: 'milestone',
  },
  {
    id: 'title-loot-goblin',
    text: 'Loot Goblin Supreme',
    description: 'Open 30 total packs/boxes/cases.',
    isUnlocked: (p) => (p.packOpenHistory ?? []).length >= 30,
    group: 'milestone',
  },
  {
    id: 'title-midnight-deck-gremlin',
    text: 'Midnight Deck Gremlin',
    description: 'Save at least 12 decks.',
    isUnlocked: (p) => p.savedDecks.length >= 12,
    group: 'milestone',
  },
  {
    id: 'title-signature-showoff',
    text: 'Signature Showoff',
    description: 'Fill all 5 Signature Card slots.',
    isUnlocked: (p) => (p.profile.signatureCardIds?.filter(Boolean).length ?? 0) >= 5,
    group: 'milestone',
  },
  {
    id: 'title-eternal',
    text: 'The Eternal',
    description: "Defeat every boss in Eternity's Wake (all 70).",
    isUnlocked: (p) => {
      // Require ≥1 clear of every defined boss.
      for (const b of BOSS_DEFINITIONS) {
        if ((p.bossClearCounts[b.id] ?? 0) < 1) return false;
      }
      return true;
    },
    group: 'milestone',
  },
];

// ── Dynamic category-completion titles ─────────────────────────────────────
// One title per BossCategory: "Sovereign of {Category}" unlocked when every
// boss in that category has been cleared at least once.

const CATEGORY_TITLE_OVERRIDES: Record<BossCategory, { text: string; description: string }> = {
  'Neutrality': { text: 'Arbiter of Neutrality', description: 'Defeat every Neutrality boss in Eternity\'s Wake.' },
  'Pyroabyss': { text: 'Quencher of the Pyroabyss', description: 'Defeat every Pyroabyss boss in Eternity\'s Wake.' },
  'Heavenly Light': { text: 'Eclipse of Heavenly Light', description: 'Defeat every Heavenly Light boss in Eternity\'s Wake.' },
  'Thornbound Plains': { text: 'Reaper of the Thornbound', description: 'Defeat every Thornbound Plains boss in Eternity\'s Wake.' },
  'Mechanical Dreams': { text: 'Stiller of Mechanical Dreams', description: 'Defeat every Mechanical Dreams boss in Eternity\'s Wake.' },
  'Prismatic Accord': { text: 'Breaker of the Prismatic Accord', description: 'Defeat every Prismatic Accord boss in Eternity\'s Wake.' },
  'Snowbound Voltage': { text: 'Stormgrounder of Snowbound Voltage', description: 'Defeat every Snowbound Voltage boss in Eternity\'s Wake.' },
  'Black Glass Inferno': { text: 'Heir of the Black Glass Inferno', description: 'Defeat every Black Glass Inferno boss in Eternity\'s Wake.' },
  'Glass Absolute': { text: 'Pane of the Glass Absolute', description: 'Defeat every Glass Absolute boss in Eternity\'s Wake.' },
  'The Blazing Garden': { text: 'Tender of the Blazing Garden', description: 'Defeat every Blazing Garden boss in Eternity\'s Wake.' },
  'Age of the Butterfly': { text: 'Witness to the Butterfly', description: 'Defeat every Age of the Butterfly boss in Eternity\'s Wake.' },
  'Eternal Seas': { text: 'Deepwake-Bearer of the Eternal Seas', description: 'Defeat every Eternal Seas boss in Eternity\'s Wake.' },
  'Abyssal Forge': { text: 'Hammerlord of the Abyssal Forge', description: 'Defeat every Abyssal Forge boss in Eternity\'s Wake.' },
  'Death-flamed Hell': { text: 'Pallbearer of the Death-flame', description: 'Defeat every Death-flamed Hell boss in Eternity\'s Wake.' },
  '[EVENT] Wished Upon A Star': { text: 'Starwarden', description: 'Defeat every Wished Upon A Star boss in Eternity\'s Wake.' },
};

function buildCategoryClearTitles(): TitleBadgeDefinition[] {
  const byCategory = new Map<BossCategory, string[]>();
  for (const b of BOSS_DEFINITIONS) {
    const list = byCategory.get(b.category) ?? [];
    list.push(b.id);
    byCategory.set(b.category, list);
  }
  const out: TitleBadgeDefinition[] = [];
  for (const [category, bossIds] of byCategory) {
    const ov = CATEGORY_TITLE_OVERRIDES[category];
    out.push({
      id: `title-category-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      text: ov.text,
      description: ov.description,
      isUnlocked: (p) => bossIds.every(id => (p.bossClearCounts[id] ?? 0) >= 1),
      group: 'boss',
    });
  }
  return out;
}

// ── Dynamic boss-clear titles ──────────────────────────────────────────────

export function bossClearTitleId(bossId: string): string {
  return `title-bossclear-${bossId}`;
}

// Per-boss epic title overrides. Each entry gives the survivor a unique
// epithet tied to that boss's lore. Falls back to "Slayer of {name}" when an
// id is missing (so future bosses keep generating valid titles).
const BOSS_TITLE_OVERRIDES: Record<string, { text: string; description: string }> = {
  // Neutrality — legacy ladder
  'boss-hollow-king': { text: 'The Hollow Heir', description: 'Unseat the Hollow Queen at the threshold of Eternity\'s Wake.' },
  'boss-immortal-warden': { text: 'Past the Sleepless Gate', description: 'Outlast the Immortal Warden through every turning of the watch.' },
  'boss-cherubim-sovereign': { text: 'Above the Tiered Throne', description: 'Topple the Cherubim Sovereign from its tiered throne.' },
  'boss-eternal-seraph': { text: 'After the First Hymn', description: 'Still the Eternal Seraph mid-hymn.' },
  'boss-time-eater': { text: 'Untouched by the Hour', description: 'Consume the Time Eater before it finishes its meal.' },
  'boss-void-architect': { text: 'The Unblueprinted', description: 'Erase the Void Architect\'s last blueprint.' },
  'boss-null-sovereign': { text: 'Unrevoked', description: 'Reject the Null Sovereign\'s decree of erasure.' },
  'boss-shattered-oracle': { text: 'Walker of the Shard Path', description: 'Reassemble enough of the Shattered Oracle to silence its last prophecy.' },
  'boss-abyssal-colossus': { text: 'Of the Lightless Mooring', description: 'Sever the Abyssal Colossus from its lightless mooring.' },
  'boss-eternal-null': { text: 'After the Final Theorem', description: 'Remain after the Eternal Null closes the ledger of all things.' },
  // Neutrality — expansion
  'boss-neutrality-paradox-throne': { text: 'Heir to the Paradox', description: 'Claim the seat the Paradox Throne could never quite hold.' },
  'boss-neutrality-void-exchequer': { text: 'Default of the Void', description: 'Refuse the Void Exchequer\'s final invoice.' },
  'boss-neutrality-equilibrium-rex': { text: 'Past the Balance Point', description: 'Tip the Equilibrium Rex past its own balance point.' },
  'boss-neutrality-axiom-maw': { text: 'Speaker of Closed Axioms', description: 'Seal the Axiom Maw with one of its own truths.' },
  'boss-neutrality-prime-judge': { text: 'Acquitted in Silence', description: 'Walk free from the Prime Judge\'s last verdict.' },
  // Pyroabyss
  'boss-pyroabyss-cinder-leviathan': { text: 'Quencher of Cinder Tides', description: 'Drown the Cinder Leviathan in its own ash-tide.' },
  'boss-pyroabyss-ash-kings': { text: 'Of the Broken Ash Crowns', description: 'Snap each Ash King\'s smoldering crown in turn.' },
  'boss-pyroabyss-infernal-sun': { text: 'Eclipse of the Sun Below', description: 'Stand between the world and the Infernal Sun until it dimmed.' },
  'boss-pyroabyss-rift-bell': { text: 'After the Riftbell\'s Toll', description: 'Silence the Riftbell whose toll opened the second pyre.' },
  'boss-pyroabyss-phoenix-judge': { text: 'Past the Returning Flame', description: 'Outlast the Phoenix Judge across every returning flame.' },
  // Heavenly Light
  'boss-light-aurora-throne': { text: 'Of the Toppled Dawn', description: 'Unseat the Aurora Throne at its dawn.' },
  'boss-light-sanctum-breaker': { text: 'The Sanctum Restored', description: 'Drive the Sanctum Breaker from a sanctuary it had already claimed.' },
  'boss-light-choral-tyrant': { text: 'The Severed Hymn', description: 'Cut the Choral Tyrant\'s endless hymn at its measure.' },
  'boss-light-halo-legion': { text: 'Among the Unwound Rings', description: 'Unwind the Halo Legion ring by burning ring.' },
  'boss-light-morning-crown': { text: 'Brighter than the Morning', description: 'Eclipse the Morning Crown at its zenith.' },
  // Thornbound Plains
  'boss-thornbound-bleeding-road': { text: 'Past the Bleeding Road', description: 'Pass the Bleeding Road\'s last marker still on your feet.' },
  'boss-thornbound-ragged-banner': { text: 'The Banner Down', description: 'Rip down the Ragged Banner of the lost campaign.' },
  'boss-thornbound-cathedral-lance': { text: 'Of the Broken Cathedral', description: 'Shatter the Cathedral Lance against its own kneeling stone.' },
  'boss-thornbound-grave-hedge': { text: 'Through the Grave Hedge', description: 'Cut a clean path through the Grave Hedge.' },
  'boss-thornbound-gallowcrown': { text: 'Out from the Gallowcrown', description: 'Walk out from beneath the Gallowcrown unhanged.' },
  // Mechanical Dreams
  'boss-mech-overclock-arch': { text: 'Quiet of the Arch-Engine', description: 'Throttle the Overclock Arch into silence.' },
  'boss-mech-furnace-mind': { text: 'After the Furnace Cooled', description: 'Quench the Furnace Mind\'s last thought.' },
  'boss-mech-brass-tribunal': { text: 'The Brass Recused', description: 'Stand down the Brass Tribunal mid-judgement.' },
  'boss-mech-reactor-psalm': { text: 'Hush of the Reactor Psalm', description: 'Mute the Reactor Psalm at its final stanza.' },
  'boss-mech-primevector': { text: 'Against the Primevector', description: 'Reverse the Primevector\'s decided arc.' },
  // Prismatic Accord
  'boss-prismatic-mirror-regent': { text: 'Across the Broken Mirror', description: 'Crack the Mirror Regent across every reflected face.' },
  'boss-prismatic-fracture-hierophant': { text: 'Closer of Fracture Roads', description: 'Seal each road the Fracture Hierophant opened.' },
  'boss-prismatic-drift-leviathan': { text: 'Stillwater of the Drift', description: 'Still the Drift Leviathan as it crossed the seam.' },
  'boss-prismatic-blindwars-reliquary': { text: 'Seal of the Blindwars', description: 'Close the Blindwars Reliquary on its last unseeing relic.' },
  'boss-prismatic-whitebeam-concordat': { text: 'Witness to the Whitebeam', description: 'Witness the Whitebeam Concordat sign its own dissolution.' },
  // Snowbound Voltage
  'boss-snowbound-polar-conductor': { text: 'Last Note of the Conductor', description: 'Drown out the Polar Conductor\'s final note.' },
  'boss-snowbound-aurora-nexus': { text: 'Unhooked from the Aurora', description: 'Unhook the Aurora Nexus from the polar sky.' },
  'boss-snowbound-glacier-beacon': { text: 'After the Beacon Dimmed', description: 'Snuff the Glacier Beacon at its peak.' },
  'boss-snowbound-white-requiem': { text: 'Past the White Requiem', description: 'Walk out of the White Requiem still breathing.' },
  'boss-snowbound-blizzard-requiem': { text: 'Closer of the Blizzard\'s Score', description: 'Lead the Blizzard Requiem into its final, frozen rest.' },
  // Black Glass Inferno
  'boss-inferno-vaelthorax-grief': { text: 'Unwriter of Vaelthorax', description: 'Erase Vaelthorax\'s grief from the obsidian record.' },
  'boss-inferno-morvakael-answer': { text: 'The Answer to Morvakael', description: 'Speak the line Morvakael could not refute.' },
  'boss-inferno-sorveth-flame': { text: 'Past Sorveth\'s Flame', description: 'Carry one true word past Sorveth\'s flame.' },
  'boss-inferno-cinderborn-court': { text: 'Throne of the Cinderborn, Empty', description: 'Topple the Cinderborn Court in its molten hall.' },
  'boss-inferno-ashen-sovereign': { text: 'Heir of the Ashen Court', description: 'Inherit the Ashen Sovereign\'s ruined dominion.' },
  // Glass Absolute
  'boss-glass-lattice-archive': { text: 'Reader of the Lattice', description: 'Read the Lattice Archive end to end and close it.' },
  'boss-glass-angled-infinity': { text: 'Folder of the Angled Infinite', description: 'Fold the Angled Infinity flat against itself.' },
  'boss-glass-first-white': { text: 'Past the First White', description: 'Endure the First White without looking away.' },
  'boss-glass-center-everywhere': { text: 'The Center Found', description: 'Locate the center of the Center-Everywhere and claim it.' },
  'boss-glass-perfect-refraction': { text: 'True Line of Refraction', description: 'Solve the Perfect Refraction to a single, true line.' },
  // The Blazing Garden
  'boss-garden-proofflame': { text: 'Keeper of the Proofflame', description: 'Tend the Proofflame past its last theorem.' },
  'boss-garden-evernoon': { text: 'Through the Evernoon', description: 'Stand through the Evernoon\'s unmoving sun.' },
  'boss-garden-seven-crown': { text: 'Of the Pruned Crowns', description: 'Cut each of the Seven Crowns back to its root.' },
  'boss-garden-codex': { text: 'Closer of the Garden Codex', description: 'Close the Garden Codex on its own last entry.' },
  'boss-garden-noonproof-transit': { text: 'Walker of the Noonproof', description: 'Cross the Noonproof Transit while it still tried to bar you.' },
  // Age of the Butterfly
  'boss-butterfly-kethravoss': { text: 'Reader of the Seven Wings', description: 'Read Kethravoss\' wings and write your own conclusion.' },
  'boss-butterfly-mirrorglass': { text: 'Past the Mirrorglass Bench', description: 'Dismiss the Mirrorglass Conclave from its glass-bench.' },
  'boss-butterfly-nullwing': { text: 'Through the Nullwing', description: 'Pass through the Nullwing without losing form.' },
  'boss-butterfly-pyrethkai': { text: 'Heavier than Pyrethkai', description: 'Outweigh Pyrethkai on its own scale.' },
  'boss-butterfly-volthari': { text: 'Quicker than Volthari', description: 'Move once more than Volthari thought possible.' },
  // Eternal Seas
  'boss-seas-aeveleth': { text: 'Against the First Drift', description: 'Push back against Aeveleth\'s First Drift and hold.' },
  'boss-seas-surevaan': { text: 'Of the Anomaly Log', description: 'Append your line to Surevaan\'s anomaly log.' },
  'boss-seas-thyrvaan': { text: 'Reader of the Oldlight Grid', description: 'Decode Thyrvaan\'s Oldlight Grid to its last cell.' },
  'boss-seas-seven-margins': { text: 'Bearer of the Seven Margins', description: 'Carry the Seven Margins through the crowned reef.' },
  'boss-seas-veleth-abyss': { text: 'Voice of the Veleth Reply', description: 'Answer the Veleth Abyss\' question — and survive the asking.' },
};

function buildBossClearTitles(): TitleBadgeDefinition[] {
  return BOSS_DEFINITIONS.map((boss) => {
    const ov = BOSS_TITLE_OVERRIDES[boss.id];
    return {
      id: bossClearTitleId(boss.id),
      text: ov?.text ?? `Slayer of ${boss.name}`,
      description: ov?.description ?? `Defeat ${boss.name} in Eternity's Wake.`,
      isUnlocked: (p) => (p.bossClearCounts[boss.id] ?? 0) >= 1,
      group: 'boss' as const,
    };
  });
}

// ── Dynamic Infinite-card titles ───────────────────────────────────────────

export function infiniteCardTitleId(definitionId: string): string {
  return `title-infinite-${definitionId}`;
}

// Per-card epic title overrides. Each entry gives the forger of that
// Infinite card a unique epithet tied to its in-fiction identity. Falls back
// to "Wielder of {name}" for unmapped ids.
const INFINITE_CARD_TITLE_OVERRIDES: Record<string, { text: string; description: string }> = {
  // Neutrality core infinites
  'inf-oblivion-absolute': { text: 'The Final Zero', description: 'Forge Oblivion Absolute — the card that ends counting.' },
  'inf-void-cascade': { text: 'Of the Cascading Nothing', description: 'Forge Void Cascade and channel the slope into the void.' },
  'inf-ash-kings-apocalypse': { text: 'Herald of the Ash Apocalypse', description: 'Forge Ash Kings\' Apocalypse and walk before its smoke.' },
  'inf-prismatic-axiom-rain': { text: 'Rain of Axioms', description: 'Forge Prismatic Axiom Rain and let true things fall.' },
  'inf-thornbound-last-procession': { text: 'The Last Procession', description: 'Forge Thornbound Last Procession and carry its standard.' },
  'inf-celestial-blackout': { text: 'After the Heavens Dimmed', description: 'Forge Celestial Blackout and put the heavens out.' },
  'inf-machina-eternal-loop': { text: 'Of the Unbroken Loop', description: 'Forge Machina Eternal Loop and ride the unbroken cycle.' },
  'inf-genesis-throne': { text: 'Seated Before the Word', description: 'Forge Genesis Throne and seat yourself before the first word.' },
  'inf-null-apex': { text: 'The Apex That Refuses', description: 'Forge Null Apex — the peak that disclaims itself.' },
  'inf-pyraxis-colossus': { text: 'Of Pyraxis\' Marrow', description: 'Forge Pyraxis Colossus from the underforge\'s last iron.' },
  'inf-prismatic-choir-splinter': { text: 'Cantor of the Splinter Choir', description: 'Forge Prismatic Choir Splinter and lead its fractured hymn.' },
  'inf-thorn-widow-engine': { text: 'Of the Widow Spindle', description: 'Forge Thorn Widow Engine and tend its spindle.' },
  'inf-lucent-cataclysm-archon': { text: 'Archon of Lucent Ruin', description: 'Forge Lucent Cataclysm Archon and rule the bright ruin.' },
  'inf-brass-eidolon-prime': { text: 'Within the Brass Eidolon', description: 'Forge Brass Eidolon Prime and step inside its hollow chest.' },
  'inf-entropic-crown': { text: 'Crowned in Unwinding', description: 'Forge the Entropic Crown and wear what unwinds.' },
  'inf-annihilation-field': { text: 'The Drawn Perimeter', description: 'Forge Annihilation Field and draw its perimeter.' },
  'inf-pyroclasm-engine': { text: 'Of the Banked Pyroclasm', description: 'Forge Pyroclasm Engine and bank its detonation.' },
  'inf-prismatic-collapse-lattice': { text: 'The Lattice Folded Shut', description: 'Forge Prismatic Collapse Lattice and crease it shut.' },
  'inf-gravebloom-singularity': { text: 'Tender of the Gravebloom', description: 'Forge Gravebloom Singularity and prune its dark flower.' },
  'inf-heliarch-eclipse-engine': { text: 'The Sun on Standby', description: 'Forge Heliarch Eclipse Engine and place the sun on standby.' },
  'inf-mech-entropy-foundry': { text: 'Of the Inevitable Forge', description: 'Forge Mech Entropy Foundry and cast its inevitable ingots.' },
  'inf-sovereign-void': { text: 'Sovereign of the Unwritten', description: 'Forge Sovereign Void and rule the unwritten page.' },
  'inf-eternity-rupture': { text: 'Of the Cracked Thread', description: 'Forge Eternity Rupture and crack the long thread.' },
  'inf-riftborn-sovereign': { text: 'Crowned at the Seam', description: 'Forge Riftborn Sovereign and inherit the seam between worlds.' },
  'inf-prismatic-judgement-array': { text: 'Verdict in Nine Beams', description: 'Forge Prismatic Judgement Array and read out its verdict.' },
  'inf-thornbound-elegy-titan': { text: 'Marshal of the Long Lament', description: 'Forge Thornbound Elegy Titan and march the long lament.' },
  'inf-mechanical-apotheosis-core': { text: 'Held in Apotheosis', description: 'Forge Mechanical Apotheosis Core and accept its uplift.' },
  // Black Glass Inferno infinites
  'inf-bgi-sorveths-final-breath': { text: 'Keeper of the Final Breath', description: 'Forge Sorveth\'s Final Breath and hold the last exhalation.' },
  'inf-bgi-chromatic-ruin-deluge': { text: 'Of the Chromatic Flood', description: 'Forge Chromatic Ruin Deluge and open every dyed sluice.' },
  'inf-bgi-obsidian-covenant-colossus': { text: 'Signed in Obsidian', description: 'Forge Obsidian Covenant Colossus and sign in dark glass.' },
  'inf-bgi-glassrose-leviathan': { text: 'Rider of the Glassrose Wake', description: 'Forge Glassrose Leviathan and ride its blooming wake.' },
  'inf-bgi-inferno-of-two-truths': { text: 'Twin Truths, One Flame', description: 'Forge Inferno of Two Truths and speak both fires at once.' },
  'inf-bgi-ashen-cinder-cathedral': { text: 'Of the Cinder Cathedral', description: 'Forge Ashen Cinder Cathedral nave by smoking nave.' },
  'inf-bgi-vaelmor-umbra-sovereign': { text: 'Heir of the Umbra Crown', description: 'Forge Vaelmor, Umbra Sovereign and accept its shaded crown.' },
  'inf-bgi-midplace-apocalypse': { text: 'Of the Unwitnessed Chapter', description: 'Forge Midplace Apocalypse and read the unwitnessed chapter.' },
  // Snowbound Voltage — original ids
  'sv-infinite-polar-fission': { text: 'Split of the Pole', description: 'Forge Polar Cataclysm in its original split-pole form.' },
  'sv-infinite-neon-snowfall': { text: 'Under Descending Neon', description: 'Forge Neon Deluge in its first descending light.' },
  'sv-infinite-crystal-storm': { text: 'Within the Crystal Storm', description: 'Forge Crystal Maelstrom from its founding flurry.' },
  'sv-infinite-black-ice-throne': { text: 'Throne of Black Ice', description: 'Forge Black Ice Dominion in its first throne-form.' },
  'sv-infinite-aurora-collapse': { text: 'Heart of the Aurora', description: 'Forge Aurora Singularity in its inaugural collapse.' },
  // Snowbound Voltage — renamed ids
  'inf-sv-polar-cataclysm': { text: 'The Pole, Undone', description: 'Re-forge Polar Cataclysm with its full chain awakened.' },
  'inf-sv-neon-deluge': { text: 'Diviner of the Neon Flood', description: 'Re-forge Neon Deluge with every conduit lit.' },
  'inf-sv-crystal-maelstrom': { text: 'Eye of the Maelstrom', description: 'Re-forge Crystal Maelstrom with every shard counted.' },
  'inf-sv-black-ice-dominion': { text: 'Warden of Black Ice', description: 'Re-forge Black Ice Dominion under your own warding.' },
  'inf-sv-aurora-singularity': { text: 'Bearer of the Aurora Point', description: 'Re-forge Aurora Singularity and carry its point of light.' },
};

function buildInfiniteCardTitles(): TitleBadgeDefinition[] {
  return infiniteCards.map((card) => {
    const ov = INFINITE_CARD_TITLE_OVERRIDES[card.definitionId];
    return {
      id: infiniteCardTitleId(card.definitionId),
      text: ov?.text ?? `Wielder of ${card.name}`,
      description: ov?.description ?? `Forge the Infinite card "${card.name}".`,
      isUnlocked: (p) => getEverInfiniteCount(p, card.definitionId) >= 1,
      group: 'infinite' as const,
    };
  });
}

// ── Dynamic set-completion titles ──────────────────────────────────────────
// Cards are mapped to a BossCategory by definitionId prefix. Completing a set
// means owning every CardRegistry entry whose id matches one of the prefixes.

interface SetSpec {
  category: BossCategory;
  title: string;
  prefixes: string[];
}

const SET_SPECS: SetSpec[] = [
  { category: 'Neutrality', title: 'Of the Quiet Center', prefixes: ['neut-', 'angel-neutral-', 'btei-neutrality-', 'inf-oblivion-', 'inf-void-cascade', 'inf-entropic-crown', 'inf-annihilation-field', 'inf-sovereign-void', 'inf-eternity-rupture', 'inf-genesis-throne', 'inf-null-apex'] },
  { category: 'Pyroabyss', title: 'Sovereign of the Underflame', prefixes: ['btei-pyroabyss-', 'inf-pyraxis-colossus', 'inf-ash-kings-apocalypse', 'inf-pyroclasm-engine', 'inf-riftborn-sovereign', 'pyro-'] },
  { category: 'Heavenly Light', title: 'Voice of the Choir', prefixes: ['btei-light-', 'angel-light-', 'inf-celestial-blackout', 'inf-lucent-cataclysm-archon', 'inf-heliarch-eclipse-engine', 'light-'] },
  { category: 'Thornbound Plains', title: 'Walker of the Thornbound', prefixes: ['btei-thornbound-', 'tbp-', 'inf-thornbound-', 'inf-thorn-widow-engine', 'inf-gravebloom-singularity'] },
  { category: 'Mechanical Dreams', title: 'Of Brass and Dream', prefixes: ['btei-mech-', 'md-', 'inf-machina-eternal-loop', 'inf-brass-eidolon-prime', 'inf-mech-entropy-foundry', 'inf-mechanical-apotheosis-core'] },
  { category: 'Prismatic Accord', title: 'Witness of the Accord', prefixes: ['btei-prismatic-', 'pa-', 'inf-prismatic-'] },
  { category: 'Snowbound Voltage', title: 'Of Snow and Current', prefixes: ['sv-', 'inf-sv-'] },
  { category: 'Black Glass Inferno', title: 'Regent of Black Glass', prefixes: ['btei-bgi-', 'bgi-', 'inf-bgi-'] },
  { category: 'Glass Absolute', title: 'Of the Glass Absolute', prefixes: ['ga-'] },
  { category: 'The Blazing Garden', title: 'Of the Blazing Garden', prefixes: ['bg-'] },
  { category: 'Age of the Butterfly', title: 'Heir of the Butterfly Age', prefixes: ['bf-'] },
  { category: 'Eternal Seas', title: 'Deepwake of the Eternal', prefixes: ['es-'] },
  { category: 'Abyssal Forge', title: 'Of the Abyssal Forge', prefixes: ['af-'] },
  { category: 'Death-flamed Hell', title: 'Of the Death-flame', prefixes: ['dfh-'] },
];

export function setCompletionTitleId(category: BossCategory): string {
  return `title-set-${category.toLowerCase().replace(/\s+/g, '-')}`;
}

let _setCardIdCache: Map<BossCategory, string[]> | null = null;

function getSetCardIds(): Map<BossCategory, string[]> {
  if (_setCardIdCache) return _setCardIdCache;
  const all = CardRegistry.getAll().map((c) => c.definitionId);
  const map = new Map<BossCategory, string[]>();
  for (const spec of SET_SPECS) {
    const ids = all.filter((id) => spec.prefixes.some((pre) => id.startsWith(pre)));
    map.set(spec.category, ids);
  }
  _setCardIdCache = map;
  return map;
}

function buildSetCompletionTitles(): TitleBadgeDefinition[] {
  return SET_SPECS.map((spec) => ({
    id: setCompletionTitleId(spec.category),
    text: spec.title,
    description: `Own every card in the ${spec.category} set.`,
    isUnlocked: (p) => {
      const ids = getSetCardIds().get(spec.category) ?? [];
      if (ids.length === 0) return false;
      for (const id of ids) {
        if (getEverCollectionCount(p, id) < 1) return false;
      }
      return true;
    },
    group: 'set' as const,
  }));
}

export const TITLE_BADGES: TitleBadgeDefinition[] = [
  ...MILESTONE_TITLES,
  ...buildCategoryClearTitles(),
  ...buildBossClearTitles(),
  ...buildInfiniteCardTitles(),
  ...buildSetCompletionTitles(),
];

export const TITLE_BADGE_BY_ID: Record<string, TitleBadgeDefinition> =
  Object.fromEntries(TITLE_BADGES.map(t => [t.id, t]));

export function isTitleUnlocked(id: string, progress: ProgressState): boolean {
  const def = TITLE_BADGE_BY_ID[id];
  return !!def && def.isUnlocked(progress);
}

/**
 * Resolves the title to display. Returns null if `id` is null. If the requested
 * id is no longer unlocked or unknown, returns null (no title shown).
 */
export function resolveTitleBadge(id: string | null | undefined, progress: ProgressState): TitleBadgeDefinition | null {
  if (!id) return null;
  const def = TITLE_BADGE_BY_ID[id];
  if (def && def.isUnlocked(progress)) return def;
  return null;
}
