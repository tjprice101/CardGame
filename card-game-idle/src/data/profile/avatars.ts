import type { ProgressState } from '@/types/game';
import { eternalCards } from '@/data/cards/eternalCards';
import { CardRegistry } from '@/cards/CardRegistry';
import { infiniteCards } from '@/data/cards/infiniteCards';
import { NEUTRALITY_PACK_POOL } from '@/data/packs/packDefinitions';
import { isAchievementUnlocked } from '@/systems/progression/achievements';
import {
  getEverCollectionCount,
  getEverCollectionTotal,
  getEverDistinctCollectionCount,
  getEverDistinctHoloCount,
  getEverHoloTotal,
  getEverInfiniteCount,
  getEverInfiniteTotal,
} from '@/systems/progression/ownershipHistory';

/**
 * Avatar registry. Each entry is gated by a requirement function that reads
 * the player's ProgressState.
 */
export interface AvatarDefinition {
  id: string;
  name: string;
  /** Visual glyph used as the avatar (emoji-safe across platforms). */
  glyph: string;
  /**
   * If present, display this image URL in a circle instead of the text glyph.
   * URL is relative to the public root, e.g. '/assets/profile-pictures/sigil-neutrality.png'.
   */
  imageUrl?: string;
  /** Short flavor / unlock description shown when locked. */
  description: string;
  /** Returns true when the player has earned this avatar. */
  isUnlocked: (progress: ProgressState) => boolean;
}

const ASSET_BASE_URL = import.meta.env.BASE_URL;
const toBaseAssetUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  if (!url.startsWith('/')) return url;
  return `${ASSET_BASE_URL}${url.slice(1)}`;
};

// ── Unlock helpers ────────────────────────────────────────────────────────

function _owns(id: string, p: ProgressState): boolean {
  return getEverCollectionCount(p, id) > 0 || getEverInfiniteCount(p, id) > 0;
}

function _mastery(basePool: string[], eternalIds: string[]): (p: ProgressState) => boolean {
  const allIds = Object.freeze([...basePool, ...eternalIds]);
  return (p) => allIds.every(id => _owns(id, p));
}

function _sigilByIds(ids: readonly string[]): (p: ProgressState) => boolean {
  return (p) => ids.some(id => getEverInfiniteCount(p, id) > 0);
}

// ── Shared (core) Infinite card sets, precomputed at module load ──────────

const _coreInfiniteCards = Object.freeze([...infiniteCards]);

const INF_NEUTRALITY = Object.freeze(_coreInfiniteCards.map(c => c.definitionId));
const INF_ALL_CORE   = INF_NEUTRALITY;

// Pre-computed Eternal card ID list so isUnlocked closures don't scan the
// full registry on every recompute() latch cycle.
const _eternalIds = Object.freeze(
  CardRegistry.getAll().filter(c => c.definitionId.startsWith('btei-')).map(c => c.definitionId),
);

// ── Eternal card ID sets per set, precomputed at module load ─────────────

// All Neutrality Eternals are every btei-* card (only Neutrality remains in eternalCards)
const ET_NEUTRALITY = Object.freeze(
  eternalCards.filter(c => c.definitionId.startsWith('btei-')).map(c => c.definitionId),
);
const CAUSALITY_INFINITE_IDS = Object.freeze(
  CardRegistry.getAll().filter(c => c.definitionId.startsWith('inf-causality-')).map(c => c.definitionId),
);

export const DEFAULT_AVATAR_ID = 'pic-classic-acolyte';

export const AVATARS: AvatarDefinition[] = [
  {
    id: 'avatar-acolyte',
    name: 'Acolyte',
    glyph: '🜂',
    description: 'The starting sigil. Always available.',
    isUnlocked: () => true,
  },
  {
    id: 'avatar-cardweaver',
    name: 'Cardweaver',
    glyph: '🂠',
    description: 'Play 100 cards.',
    isUnlocked: (p: ProgressState) => p.totalCardsPlayed >= 100,
  },
  {
    id: 'avatar-stacker',
    name: 'Stacker',
    glyph: '♾',
    description: 'Play 1,000 cards.',
    isUnlocked: (p: ProgressState) => p.totalCardsPlayed >= 1_000,
  },
  {
    id: 'avatar-oblivion-touched',
    name: 'Divine Light-Touched',
    glyph: '◉',
    description: 'Earn 10,000 Divine Light in a single turn.',
    isUnlocked: (p: ProgressState) => (p.bestSingleTurnDivineLight ?? 0) >= 10_000,
  },
  {
    id: 'avatar-eternal',
    name: 'Eternal',
    glyph: '☉',
    description: 'Earn 1,000,000 Divine Light.',
    isUnlocked: (p: ProgressState) => (p.lifetimeDivineLight ?? p.divineLight) >= 1_000_000,
  },
  {
    id: 'avatar-boss-slayer',
    name: 'Boss Slayer',
    glyph: '⚔',
    description: 'Defeat any 5 distinct bosses.',
    isUnlocked: (p: ProgressState) => Object.keys(p.bossClearCounts).length >= 5,
  },
  {
    id: 'avatar-eternal-conqueror',
    name: 'Eternal Conqueror',
    glyph: '♛',
    description: "Defeat 25 distinct bosses across Eternity's Wake.",
    isUnlocked: (p: ProgressState) => Object.keys(p.bossClearCounts).length >= 25,
  },
  {
    id: 'avatar-collector',
    name: 'Collector',
    glyph: '✦',
    description: 'Own 250 cards across your collection.',
    isUnlocked: (p: ProgressState) => getEverCollectionTotal(p) >= 250,
  },
  {
    id: 'avatar-holo-curator',
    name: 'Holo Curator',
    glyph: '✶',
    description: 'Own 25 holographic cards.',
    isUnlocked: (p: ProgressState) => getEverHoloTotal(p) >= 25,
  },
  {
    id: 'avatar-infinite',
    name: 'Infinite',
    glyph: '∞',
    description: 'Own any Infinite-finish card.',
    isUnlocked: (p: ProgressState) => getEverInfiniteTotal(p) >= 1,
  },
  {
    id: 'avatar-shardlord',
    name: 'Shardlord',
    glyph: '◆',
    description: 'Accumulate 1,000 Aberrated Shards.',
    isUnlocked: (p: ProgressState) => p.aberratedShards >= 1_000,
  },

  // ── Set Sigils (unlock by owning 1 Infinity card from the set) ───────────

  {
    id: 'pic-sigil-neutrality',
    name: 'Neutrality Sigil',
    glyph: '∅',
    imageUrl: '/assets/profile-pictures/sigil-neutrality.png',
    description: 'Obtain any Neutrality-element Infinity card.',
    isUnlocked: _sigilByIds(INF_NEUTRALITY),
  },
  {
    id: 'pic-sigil-infinitude',
    name: 'Infinitude Sigil',
    glyph: '∞',
    imageUrl: '/assets/profile-pictures/sigil-infinitude.png',
    description: 'Forge any card through the Infinitude recipe system.',
    isUnlocked: _sigilByIds(INF_ALL_CORE),
  },

  // ── Set Mastery (unlock by completing the full set + all Eternal cards) ──

  {
    id: 'pic-master-neutrality',
    name: 'Neutrality Master',
    glyph: '∅',
    imageUrl: '/assets/profile-pictures/master-neutrality.png',
    description: 'Collect every Neutrality base card and every Neutrality Eternal card.',
    isUnlocked: _mastery(NEUTRALITY_PACK_POOL, ET_NEUTRALITY as string[]),
  },
  {
    id: 'pic-master-infinitude',
    name: 'Infinitude Master',
    glyph: '∞',
    imageUrl: '/assets/profile-pictures/master-infinitude.png',
    description: 'Forge every card available through the Infinitude recipe system.',
    isUnlocked: (p: ProgressState) => INF_ALL_CORE.every(id => getEverInfiniteCount(p, id) > 0),
  },
  {
    id: 'pic-sigil-causality',
    name: 'Causality Sigil',
    glyph: '◈',
    imageUrl: '/assets/profile-pictures/sigil-causality.png',
    description: 'Forge any Causality Infinite card.',
    isUnlocked: _sigilByIds(CAUSALITY_INFINITE_IDS),
  },
  {
    id: 'pic-master-causality',
    name: 'Causality Master',
    glyph: '◌',
    imageUrl: '/assets/profile-pictures/master-causality.png',
    description: 'Own every Causality base card and Causality Eternal card.',
    isUnlocked: (p: ProgressState) => {
      const ids = CardRegistry.getAll().filter(card => card.definitionId.includes('causality-') && card.rarity !== 'Infinite').map(card => card.definitionId);
      return ids.every(id => _owns(id, p));
    },
  },

  // ── Classic Achievement Avatars ──────────────────────────────────────────
  // Unlocked by reaching specific in-game milestones.
  {
    id: 'pic-classic-acolyte',
    name: 'Acolyte',
    glyph: '📖',
    imageUrl: '/assets/profile-pictures/classic-acolyte.png',
    description: 'The starting avatar. Always available.',
    isUnlocked: () => true,
  },
  {
    id: 'pic-classic-cardweaver',
    name: 'Cardweaver',
    glyph: '🃏',
    imageUrl: '/assets/profile-pictures/classic-cardweaver.png',
    description: 'Play 5,000 cards.',
    isUnlocked: (p: ProgressState) => p.totalCardsPlayed >= 5_000,
  },
  {
    id: 'pic-classic-stacker',
    name: 'Stacker',
    glyph: '⛓',
    imageUrl: '/assets/profile-pictures/classic-stacker.png',
    description: 'Play 25,000 cards.',
    isUnlocked: (p: ProgressState) => p.totalCardsPlayed >= 25_000,
  },
  {
    id: 'pic-classic-oblivion-touched',
    name: 'Divine Light-Touched',
    glyph: '∞',
    imageUrl: '/assets/profile-pictures/classic-oblivion-touched.png',
    description: 'Earn 10,000 Divine Light in a single turn.',
    isUnlocked: (p: ProgressState) => (p.bestSingleTurnDivineLight ?? 0) >= 10_000,
  },
  {
    id: 'pic-classic-eternal',
    name: 'Eternal',
    glyph: '✨',
    imageUrl: '/assets/profile-pictures/classic-eternal.png',
    description: 'Obtain any Eternal card.',
    isUnlocked: (p: ProgressState) => _eternalIds.some(id => getEverCollectionCount(p, id) > 0),
  },
  {
    id: 'pic-classic-boss-slayer',
    name: 'Boss Slayer',
    glyph: '⚔',
    imageUrl: '/assets/profile-pictures/classic-boss-slayer.png',
    description: "Defeat your first boss in Eternity's Wake.",
    isUnlocked: (p: ProgressState) => Object.keys(p.bossClearCounts).length >= 1,
  },
  {
    id: 'pic-classic-eternal-conqueror',
    name: 'Eternal Conqueror',
    glyph: '👑',
    imageUrl: '/assets/profile-pictures/classic-eternal-conqueror.png',
    description: "Defeat 8 distinct bosses in Eternity's Wake.",
    isUnlocked: (p: ProgressState) => Object.keys(p.bossClearCounts).length >= 8,
  },
  {
    id: 'pic-classic-collector',
    name: 'Collector',
    glyph: '🗂',
    imageUrl: '/assets/profile-pictures/classic-collector.png',
    description: 'Own 50 distinct card types.',
    isUnlocked: (p: ProgressState) => getEverDistinctCollectionCount(p) >= 50,
  },
  {
    id: 'pic-classic-holo-curator',
    name: 'Holo Curator',
    glyph: '💿',
    imageUrl: '/assets/profile-pictures/classic-holo-curator.png',
    description: 'Own 20 distinct holographic cards.',
    isUnlocked: (p: ProgressState) => getEverDistinctHoloCount(p) >= 20,
  },
  {
    id: 'pic-classic-infinite',
    name: 'Infinite',
    glyph: '∞',
    imageUrl: '/assets/profile-pictures/classic-infinite.png',
    description: 'Forge your first Infinite card.',
    isUnlocked: (p: ProgressState) => getEverInfiniteTotal(p) > 0,
  },
  {
    id: 'pic-classic-shardlord',
    name: 'Shardlord',
    glyph: '💎',
    imageUrl: '/assets/profile-pictures/classic-shardlord.png',
    description: 'Accumulate 500 Aberrated Shards.',
    isUnlocked: (p: ProgressState) => p.aberratedShards >= 500,
  },

  // ── Eternity's Wake Boss Defeat Trophies ──────────────────────────────────
  {
    id: 'pic-wake-hollow-queen',
    name: 'The Hollow Queen',
    glyph: '👑',
    imageUrl: '/assets/profile-pictures/wake-profile-hollow-queen.png',
    description: "Defeat The Hollow Queen in Eternity's Wake.",
    isUnlocked: (p: ProgressState) => (p.bossClearCounts['boss-hollow-king'] ?? 0) >= 1,
  },
  {
    id: 'pic-wake-cherubim-sovereign',
    name: 'The Cherubim Sovereign',
    glyph: '🜂',
    imageUrl: '/assets/profile-pictures/wake-profile-cherubim-sovereign.png',
    description: "Defeat The Cherubim Sovereign in Eternity's Wake.",
    isUnlocked: (p: ProgressState) => (p.bossClearCounts['boss-cherubim-sovereign'] ?? 0) >= 1,
  },
  {
    id: 'pic-wake-eternal-seraph',
    name: 'The Eternal Seraph',
    glyph: '🪽',
    imageUrl: '/assets/profile-pictures/wake-profile-eternal-seraph.png',
    description: "Defeat The Eternal Seraph in Eternity's Wake.",
    isUnlocked: (p: ProgressState) => (p.bossClearCounts['boss-eternal-seraph'] ?? 0) >= 1,
  },
  {
    id: 'pic-wake-time-eater',
    name: 'The Time Eater',
    glyph: '⏳',
    imageUrl: '/assets/profile-pictures/wake-profile-time-eater.png',
    description: "Defeat The Time Eater in Eternity's Wake.",
    isUnlocked: (p: ProgressState) => (p.bossClearCounts['boss-time-eater'] ?? 0) >= 1,
  },
  {
    id: 'pic-wake-null-sovereign',
    name: 'The Null Sovereign',
    glyph: '∅',
    imageUrl: '/assets/profile-pictures/wake-profile-null-sovereign.png',
    description: "Defeat The Null Sovereign in Eternity's Wake.",
    isUnlocked: (p: ProgressState) => (p.bossClearCounts['boss-null-sovereign'] ?? 0) >= 1,
  },
  {
    id: 'pic-wake-shattered-oracle',
    name: 'The Shattered Oracle',
    glyph: '🔮',
    imageUrl: '/assets/profile-pictures/wake-profile-shattered-oracle.png',
    description: "Defeat The Shattered Oracle in Eternity's Wake.",
    isUnlocked: (p: ProgressState) => (p.bossClearCounts['boss-shattered-oracle'] ?? 0) >= 1,
  },
  {
    id: 'pic-wake-eternal-null',
    name: 'The Eternal Null',
    glyph: '⚫',
    imageUrl: '/assets/profile-pictures/wake-profile-eternal-null.png',
    description: "Defeat The Eternal Null in Eternity's Wake.",
    isUnlocked: (p: ProgressState) => (p.bossClearCounts['boss-eternal-null'] ?? 0) >= 1,
  },
  {
    id: 'pic-wake-equilibrium-rex',
    name: 'Equilibrium Rex',
    glyph: '⚖',
    imageUrl: '/assets/profile-pictures/wake-profile-equilibrium-rex.png',
    description: "Defeat Equilibrium Rex in Eternity's Wake.",
    isUnlocked: (p: ProgressState) => (p.bossClearCounts['boss-neutrality-equilibrium-rex'] ?? 0) >= 1,
  },
  {
    id: 'pic-wake-prime-judge-silence',
    name: 'Prime Judge of Silence',
    glyph: '⚔',
    imageUrl: '/assets/profile-pictures/wake-profile-prime-judge-silence.png',
    description: "Defeat Prime Judge of Silence in Eternity's Wake.",
    isUnlocked: (p: ProgressState) => (p.bossClearCounts['boss-neutrality-prime-judge'] ?? 0) >= 1,
  },
  {
    id: 'pic-wake-first-author',
    name: 'The First Author',
    glyph: '✒',
    imageUrl: '/assets/profile-pictures/wake-profile-first-author.png',
    description: "Defeat The First Author in Eternity's Wake.",
    isUnlocked: (p: ProgressState) => (p.bossClearCounts['boss-causality-first-author'] ?? 0) >= 1,
  },
  {
    id: 'pic-wake-meridian-eater',
    name: 'The Meridian Eater',
    glyph: '🌌',
    imageUrl: '/assets/profile-pictures/wake-profile-meridian-eater.png',
    description: "Defeat The Meridian Eater in Eternity's Wake.",
    isUnlocked: (p: ProgressState) => (p.bossClearCounts['boss-causality-meridian-eater'] ?? 0) >= 1,
  },
  {
    id: 'pic-wake-black-sun-scribe',
    name: 'Scribe of the Black Sun',
    glyph: '☀️',
    imageUrl: '/assets/profile-pictures/wake-profile-black-sun-scribe.png',
    description: "Defeat Scribe of the Black Sun in Eternity's Wake.",
    isUnlocked: (p: ProgressState) => (p.bossClearCounts['boss-causality-black-sun-scribe'] ?? 0) >= 1,
  },
  {
    id: 'pic-wake-elsewhen-judge',
    name: 'The Elsewhen Judge',
    glyph: '📜',
    imageUrl: '/assets/profile-pictures/wake-profile-elsewhen-judge.png',
    description: "Defeat The Elsewhen Judge in Eternity's Wake.",
    isUnlocked: (p: ProgressState) => (p.bossClearCounts['boss-causality-elsewhen-judge'] ?? 0) >= 1,
  },
  {
    id: 'pic-wake-pearlescent-core',
    name: 'The Pearlescent Core',
    glyph: '🪩',
    imageUrl: '/assets/profile-pictures/wake-profile-pearlescent-core.png',
    description: "Defeat The Pearlescent Core in Eternity's Wake.",
    isUnlocked: (p: ProgressState) => (p.bossClearCounts['boss-causality-pearl-core'] ?? 0) >= 1,
  },

  // ── Forge of Transcendence Achievement Avatars ────────────────────────────
  {
    id: 'pic-forge-unsealed',
    name: 'The Forge Unsealed',
    glyph: '🗝',
    imageUrl: '/assets/profile-pictures/forge-profile-forge-unsealed.png',
    description: 'Unseal the Forge of Transcendence.',
    isUnlocked: (p: ProgressState) => isAchievementUnlocked(p, 'title-forge-unsealed'),
  },
  {
    id: 'pic-forge-shardbearer',
    name: 'Shardbearer of Transcendence',
    glyph: '💎',
    imageUrl: '/assets/profile-pictures/forge-profile-shardbearer.png',
    description: 'Collect 30 Shards of Transcendence.',
    isUnlocked: (p: ProgressState) => isAchievementUnlocked(p, 'title-transcendence-shardbearer'),
  },
  {
    id: 'pic-forge-light-before-first-star',
    name: 'Before the First Star',
    glyph: '⭐',
    imageUrl: '/assets/profile-pictures/forge-profile-light-before-first-star.png',
    description: 'Obtain Light Before the First Star.',
    isUnlocked: (p: ProgressState) => isAchievementUnlocked(p, 'title-light-before-stars'),
  },
  {
    id: 'pic-forge-first-catalyst',
    name: 'Cause Unbound',
    glyph: '⌛',
    imageUrl: '/assets/profile-pictures/forge-profile-first-catalyst.png',
    description: 'Obtain The First Catalyst.',
    isUnlocked: (p: ProgressState) => isAchievementUnlocked(p, 'title-first-catalyst'),
  },
  {
    id: 'pic-forge-reliquary-all-nothing',
    name: 'Keeper of All and Nothing',
    glyph: '🏺',
    imageUrl: '/assets/profile-pictures/forge-profile-reliquary-all-nothing.png',
    description: 'Obtain The Reliquary of All and Nothing.',
    isUnlocked: (p: ProgressState) => isAchievementUnlocked(p, 'title-all-and-nothing'),
  },
  {
    id: 'pic-forge-bridge-light-life',
    name: 'Between Light and Life',
    glyph: '🌉',
    imageUrl: '/assets/profile-pictures/forge-profile-bridge-light-life.png',
    description: 'Obtain The Bridge Between Light and Life.',
    isUnlocked: (p: ProgressState) => isAchievementUnlocked(p, 'title-between-light-life'),
  },
  {
    id: 'pic-forge-four-beyond',
    name: 'The Four Beyond',
    glyph: '✦',
    imageUrl: '/assets/profile-pictures/forge-profile-four-beyond.png',
    description: 'Own all four Transcendent cards simultaneously.',
    isUnlocked: (p: ProgressState) => isAchievementUnlocked(p, 'title-forge-pantheon-complete'),
  },
].map((avatar) => ({
  ...avatar,
  imageUrl: toBaseAssetUrl(avatar.imageUrl),
}));

export const AVATAR_BY_ID: Record<string, AvatarDefinition> =
  Object.fromEntries(AVATARS.map(a => [a.id, a]));

function _getPersistedUnlockSet(progress: ProgressState): Set<string> {
  const raw = progress.profile.unlockedAvatarIds;
  if (!Array.isArray(raw)) return new Set();
  return new Set(raw.filter((id): id is string => typeof id === 'string'));
}

/**
 * Writes newly-earned avatar IDs into the profile's permanent unlock ledger.
 * Returns true when the ledger changed.
 */
export function latchUnlockedAvatars(progress: ProgressState): boolean {
  const unlockSet = _getPersistedUnlockSet(progress);
  const before = unlockSet.size;

  // Fast path: if all avatars are already latched nothing can change.
  if (unlockSet.size >= AVATARS.length) {
    const sanitizedCount = Array.isArray(progress.profile.unlockedAvatarIds)
      ? progress.profile.unlockedAvatarIds.filter((id): id is string => typeof id === 'string').length
      : 0;
    if (sanitizedCount === unlockSet.size) return false;
  }

  for (const avatar of AVATARS) {
    if (avatar.isUnlocked(progress)) unlockSet.add(avatar.id);
  }

  const sanitizedCount = Array.isArray(progress.profile.unlockedAvatarIds)
    ? progress.profile.unlockedAvatarIds.filter((id): id is string => typeof id === 'string').length
    : 0;
  const changed = unlockSet.size !== before || sanitizedCount !== unlockSet.size;
  if (changed) {
    progress.profile.unlockedAvatarIds = [...unlockSet];
  }
  return changed;
}

export function isAvatarUnlocked(id: string, progress: ProgressState): boolean {
  const def = AVATAR_BY_ID[id];
  if (!def) return false;
  const persisted = _getPersistedUnlockSet(progress).has(id);
  return persisted || def.isUnlocked(progress);
}

/**
 * Resolves the avatar to display. If the requested id is no longer unlocked
 * (e.g. progress reset) or unknown, falls back to the default avatar.
 */
export function resolveAvatar(id: string | null | undefined, progress: ProgressState): AvatarDefinition {
  if (id && isAvatarUnlocked(id, progress)) return AVATAR_BY_ID[id];
  return AVATAR_BY_ID[DEFAULT_AVATAR_ID];
}

