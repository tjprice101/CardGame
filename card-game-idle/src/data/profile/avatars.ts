import type { ProgressState } from '@/types/game';
import { eternalCards } from '@/data/cards/eternalCards';
import {
  infiniteOphanimCards,
  infiniteSeraphimCards,
  infiniteCherubimCards,
  infiniteAngelCards,
} from '@/data/cards/infiniteCards';
import {
  NEUTRALITY_PACK_POOL,
  PYROABYSS_PACK_POOL,
  HEAVENLY_LIGHT_PACK_POOL,
  THORNBOUND_PLAINS_PACK_POOL,
  MECHANICAL_DREAMS_PACK_POOL,
  PRISMATIC_ACCORD_PACK_POOL,
  BLACK_GLASS_INFERNO_PACK_POOL,
  SNOWBOUND_VOLTAGE_PACK_POOL,
  GLASS_ABSOLUTE_PACK_POOL,
  BLAZING_GARDEN_PACK_POOL,
  BUTTERFLY_PACK_POOL,
  ETERNAL_SEAS_PACK_POOL,
  ABYSSAL_FORGE_PACK_POOL,
  DEATH_FLAMED_HELL_PACK_POOL,
  WISHED_UPON_A_STAR_PACK_POOL,
} from '@/data/packs/packDefinitions';

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

const sumValues = (record: Record<string, number>): number =>
  Object.values(record).reduce((a, b) => a + b, 0);

const ASSET_BASE_URL = import.meta.env.BASE_URL;
const toBaseAssetUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  if (!url.startsWith('/')) return url;
  return `${ASSET_BASE_URL}${url.slice(1)}`;
};

// ── Unlock helpers ────────────────────────────────────────────────────────

function _owns(id: string, p: ProgressState): boolean {
  return (p.collection[id] ?? 0) > 0 || (p.infiniteCollection[id] ?? 0) > 0;
}

function _mastery(basePool: string[], eternalIds: string[]): (p: ProgressState) => boolean {
  const allIds = Object.freeze([...basePool, ...eternalIds]);
  return (p) => allIds.every(id => _owns(id, p));
}

function _sigilByIds(ids: readonly string[]): (p: ProgressState) => boolean {
  return (p) => ids.some(id => (p.infiniteCollection[id] ?? 0) > 0);
}

function _sigilByPrefix(prefix: string): (p: ProgressState) => boolean {
  return (p) => Object.entries(p.infiniteCollection).some(
    ([id, cnt]) => cnt > 0 && id.startsWith(prefix),
  );
}

// ── Shared (core) Infinite card sets, precomputed at module load ──────────

const _coreInfiniteCards = Object.freeze([
  ...infiniteOphanimCards,
  ...infiniteSeraphimCards,
  ...infiniteCherubimCards,
  ...infiniteAngelCards,
]);

const _infByElement = (el: string): readonly string[] =>
  Object.freeze(_coreInfiniteCards.filter(c => c.element === el).map(c => c.definitionId));

const INF_NEUTRALITY = _infByElement('Neutrality');
const INF_FIRE       = _infByElement('Fire');
const INF_LIGHT      = _infByElement('Light');
const INF_THORNBOUND = _infByElement('Thornbound');
const INF_MECHANICAL = _infByElement('Mechanical');
const INF_PRISMATIC  = _infByElement('Prismatic');
const INF_ALL_CORE   = Object.freeze(_coreInfiniteCards.map(c => c.definitionId));

// ── Eternal card ID sets per set, precomputed at module load ─────────────

const _eternalOf = (prefix: string): string[] =>
  eternalCards.filter(c => c.definitionId.startsWith(prefix)).map(c => c.definitionId);

// Neutrality eternals = all btei-* that aren't claimed by a specific sub-set prefix
const _neutralitySetPrefixes = Object.freeze([
  'btei-pyroabyss-', 'btei-light-', 'btei-thornbound-',
  'btei-mech-', 'btei-prismatic-', 'btei-bgi-',
]);
const ET_NEUTRALITY = Object.freeze(
  eternalCards
    .filter(c => c.definitionId.startsWith('btei-') &&
      !_neutralitySetPrefixes.some(p => c.definitionId.startsWith(p)))
    .map(c => c.definitionId),
);
const ET_PYRO    = Object.freeze(_eternalOf('btei-pyroabyss-'));
const ET_LIGHT   = Object.freeze(_eternalOf('btei-light-'));
const ET_THORN   = Object.freeze(_eternalOf('btei-thornbound-'));
const ET_MECH    = Object.freeze(_eternalOf('btei-mech-'));
const ET_PRISM   = Object.freeze(_eternalOf('btei-prismatic-'));
const ET_BGI     = Object.freeze(_eternalOf('btei-bgi-'));
const ET_SV      = Object.freeze(_eternalOf('sv-eternal-'));

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
    isUnlocked: (p) => p.totalCardsPlayed >= 100,
  },
  {
    id: 'avatar-stacker',
    name: 'Stacker',
    glyph: '♾',
    description: 'Play 1,000 cards.',
    isUnlocked: (p) => p.totalCardsPlayed >= 1_000,
  },
  {
    id: 'avatar-oblivion-touched',
    name: 'Oblivion-Touched',
    glyph: '◉',
    description: 'Earn 10,000 Oblivion in a single turn.',
    isUnlocked: (p) => (p.bestSingleTurnOblivion ?? 0) >= 10_000,
  },
  {
    id: 'avatar-eternal',
    name: 'Eternal',
    glyph: '☉',
    description: 'Earn 1,000,000 Oblivion.',
    isUnlocked: (p) => (p.lifetimeOblivion ?? p.oblivion) >= 1_000_000,
  },
  {
    id: 'avatar-boss-slayer',
    name: 'Boss Slayer',
    glyph: '⚔',
    description: 'Defeat any 5 distinct bosses.',
    isUnlocked: (p) => Object.keys(p.bossClearCounts).length >= 5,
  },
  {
    id: 'avatar-eternal-conqueror',
    name: 'Eternal Conqueror',
    glyph: '♛',
    description: "Defeat 25 distinct bosses across Eternity's Wake.",
    isUnlocked: (p) => Object.keys(p.bossClearCounts).length >= 25,
  },
  {
    id: 'avatar-collector',
    name: 'Collector',
    glyph: '✦',
    description: 'Own 250 cards across your collection.',
    isUnlocked: (p) => sumValues(p.collection) >= 250,
  },
  {
    id: 'avatar-holo-curator',
    name: 'Holo Curator',
    glyph: '✶',
    description: 'Own 25 holographic cards.',
    isUnlocked: (p) => sumValues(p.holoCollection) >= 25,
  },
  {
    id: 'avatar-infinite',
    name: 'Infinite',
    glyph: '∞',
    description: 'Own any Infinite-finish card.',
    isUnlocked: (p) => sumValues(p.infiniteCollection) >= 1,
  },
  {
    id: 'avatar-shardlord',
    name: 'Shardlord',
    glyph: '◆',
    description: 'Accumulate 1,000 Aberrated Shards.',
    isUnlocked: (p) => p.aberratedShards >= 1_000,
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
    id: 'pic-sigil-pyroabyss',
    name: 'Pyroabyss Sigil',
    glyph: '🔥',
    imageUrl: '/assets/profile-pictures/sigil-pyroabyss.png',
    description: 'Obtain any Pyroabyss-element Infinity card.',
    isUnlocked: _sigilByIds(INF_FIRE),
  },
  {
    id: 'pic-sigil-heavenly-light',
    name: 'Heavenly Light Sigil',
    glyph: '✦',
    imageUrl: '/assets/profile-pictures/sigil-heavenly-light.png',
    description: 'Obtain any Heavenly Light-element Infinity card.',
    isUnlocked: _sigilByIds(INF_LIGHT),
  },
  {
    id: 'pic-sigil-thornbound-plains',
    name: 'Thornbound Plains Sigil',
    glyph: '🌿',
    imageUrl: '/assets/profile-pictures/sigil-thornbound-plains.png',
    description: 'Obtain any Thornbound-element Infinity card.',
    isUnlocked: _sigilByIds(INF_THORNBOUND),
  },
  {
    id: 'pic-sigil-mechanical-dreams',
    name: 'Mechanical Dreams Sigil',
    glyph: '⚙',
    imageUrl: '/assets/profile-pictures/sigil-mechanical-dreams.png',
    description: 'Obtain any Mechanical-element Infinity card.',
    isUnlocked: _sigilByIds(INF_MECHANICAL),
  },
  {
    id: 'pic-sigil-prismatic-accord',
    name: 'Prismatic Accord Sigil',
    glyph: '◈',
    imageUrl: '/assets/profile-pictures/sigil-prismatic-accord.png',
    description: 'Obtain any Prismatic-element Infinity card.',
    isUnlocked: _sigilByIds(INF_PRISMATIC),
  },
  {
    id: 'pic-sigil-black-glass-inferno',
    name: 'Black Glass Inferno Sigil',
    glyph: '◼',
    imageUrl: '/assets/profile-pictures/sigil-black-glass-inferno.png',
    description: 'Obtain any Black Glass Inferno Infinity card.',
    isUnlocked: _sigilByPrefix('inf-bgi-'),
  },
  {
    id: 'pic-sigil-snowbound-voltage',
    name: 'Snowbound Voltage Sigil',
    glyph: '⚡',
    imageUrl: '/assets/profile-pictures/sigil-snowbound-voltage.png',
    description: 'Obtain any Snowbound Voltage Infinity card.',
    isUnlocked: _sigilByPrefix('inf-sv-'),
  },
  {
    id: 'pic-sigil-glass-absolute',
    name: 'Glass Absolute Sigil',
    glyph: '◇',
    imageUrl: '/assets/profile-pictures/sigil-glass-absolute.png',
    description: 'Obtain any Glass Absolute Infinity card.',
    isUnlocked: _sigilByPrefix('ga-inf-'),
  },
  {
    id: 'pic-sigil-blazing-garden',
    name: 'Blazing Garden Sigil',
    glyph: '🌸',
    imageUrl: '/assets/profile-pictures/sigil-blazing-garden.png',
    description: 'Obtain any Blazing Garden Infinity card.',
    isUnlocked: _sigilByPrefix('bg-inf-'),
  },
  {
    id: 'pic-sigil-age-of-the-butterfly',
    name: 'Age of the Butterfly Sigil',
    glyph: '🦋',
    imageUrl: '/assets/profile-pictures/sigil-age-of-the-butterfly.png',
    description: 'Obtain any Age of the Butterfly Infinity card.',
    isUnlocked: _sigilByPrefix('bf-inf-'),
  },
  {
    id: 'pic-sigil-eternal-seas',
    name: 'Eternal Seas Sigil',
    glyph: '🌊',
    imageUrl: '/assets/profile-pictures/sigil-eternal-seas.png',
    description: 'Obtain any Eternal Seas Infinity card.',
    isUnlocked: _sigilByPrefix('es-inf-'),
  },
  {
    id: 'pic-sigil-abyssal-forge',
    name: 'Abyssal Forge Sigil',
    glyph: '⚒',
    imageUrl: '/assets/profile-pictures/sigil-abyssal-forge.png',
    description: 'Obtain any Abyssal Forge Infinity card.',
    isUnlocked: _sigilByPrefix('af-inf-'),
  },
  {
    id: 'pic-sigil-death-flamed-hell',
    name: 'Death-Flamed Hell Sigil',
    glyph: '💀',
    imageUrl: '/assets/profile-pictures/sigil-death-flamed-hell.png',
    description: 'Obtain any Death-Flamed Hell Infinity card.',
    isUnlocked: _sigilByPrefix('dfh-inf-'),
  },
  {
    id: 'pic-sigil-wished-upon-a-star',
    name: 'Wished Upon A Star Sigil',
    glyph: '⭐',
    imageUrl: '/assets/profile-pictures/sigil-wished-upon-a-star.png',
    description: 'Obtain any Wished Upon A Star Infinity card.',
    isUnlocked: _sigilByPrefix('inf-wuas-'),
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
    id: 'pic-master-pyroabyss',
    name: 'Pyroabyss Master',
    glyph: '🔥',
    imageUrl: '/assets/profile-pictures/master-pyroabyss.png',
    description: 'Collect every Pyroabyss base card and every Pyroabyss Eternal card.',
    isUnlocked: _mastery(PYROABYSS_PACK_POOL, ET_PYRO as string[]),
  },
  {
    id: 'pic-master-heavenly-light',
    name: 'Heavenly Light Master',
    glyph: '✦',
    imageUrl: '/assets/profile-pictures/master-heavenly-light.png',
    description: 'Collect every Heavenly Light base card and every Heavenly Light Eternal card.',
    isUnlocked: _mastery(HEAVENLY_LIGHT_PACK_POOL, ET_LIGHT as string[]),
  },
  {
    id: 'pic-master-thornbound-plains',
    name: 'Thornbound Plains Master',
    glyph: '🌿',
    imageUrl: '/assets/profile-pictures/master-thornbound-plains.png',
    description: 'Collect every Thornbound Plains base card and every Thornbound Eternal card.',
    isUnlocked: _mastery(THORNBOUND_PLAINS_PACK_POOL, ET_THORN as string[]),
  },
  {
    id: 'pic-master-mechanical-dreams',
    name: 'Mechanical Dreams Master',
    glyph: '⚙',
    imageUrl: '/assets/profile-pictures/master-mechanical-dreams.png',
    description: 'Collect every Mechanical Dreams base card and every Mechanical Dreams Eternal card.',
    isUnlocked: _mastery(MECHANICAL_DREAMS_PACK_POOL, ET_MECH as string[]),
  },
  {
    id: 'pic-master-prismatic-accord',
    name: 'Prismatic Accord Master',
    glyph: '◈',
    imageUrl: '/assets/profile-pictures/master-prismatic-accord.png',
    description: 'Collect every Prismatic Accord base card and every Prismatic Eternal card.',
    isUnlocked: _mastery(PRISMATIC_ACCORD_PACK_POOL, ET_PRISM as string[]),
  },
  {
    id: 'pic-master-black-glass-inferno',
    name: 'Black Glass Inferno Master',
    glyph: '◼',
    imageUrl: '/assets/profile-pictures/master-black-glass-inferno.png',
    description: 'Collect every Black Glass Inferno base card and every BGI Eternal card.',
    isUnlocked: _mastery(BLACK_GLASS_INFERNO_PACK_POOL, ET_BGI as string[]),
  },
  {
    id: 'pic-master-snowbound-voltage',
    name: 'Snowbound Voltage Master',
    glyph: '⚡',
    imageUrl: '/assets/profile-pictures/master-snowbound-voltage.png',
    description: 'Collect every Snowbound Voltage base card and every Snowbound Eternal card.',
    isUnlocked: _mastery(SNOWBOUND_VOLTAGE_PACK_POOL, ET_SV as string[]),
  },
  {
    id: 'pic-master-glass-absolute',
    name: 'Glass Absolute Master',
    glyph: '◇',
    imageUrl: '/assets/profile-pictures/master-glass-absolute.png',
    description: 'Collect every card in the Glass Absolute set.',
    isUnlocked: _mastery(GLASS_ABSOLUTE_PACK_POOL, []),
  },
  {
    id: 'pic-master-blazing-garden',
    name: 'Blazing Garden Master',
    glyph: '🌸',
    imageUrl: '/assets/profile-pictures/master-blazing-garden.png',
    description: 'Collect every card in the Blazing Garden set.',
    isUnlocked: _mastery(BLAZING_GARDEN_PACK_POOL, []),
  },
  {
    id: 'pic-master-age-of-the-butterfly',
    name: 'Age of the Butterfly Master',
    glyph: '🦋',
    imageUrl: '/assets/profile-pictures/master-age-of-the-butterfly.png',
    description: 'Collect every card in the Age of the Butterfly set.',
    isUnlocked: _mastery(BUTTERFLY_PACK_POOL, []),
  },
  {
    id: 'pic-master-eternal-seas',
    name: 'Eternal Seas Master',
    glyph: '🌊',
    imageUrl: '/assets/profile-pictures/master-eternal-seas.png',
    description: 'Collect every card in the Eternal Seas set.',
    isUnlocked: _mastery(ETERNAL_SEAS_PACK_POOL, []),
  },
  {
    id: 'pic-master-abyssal-forge',
    name: 'Abyssal Forge Master',
    glyph: '⚒',
    imageUrl: '/assets/profile-pictures/master-abyssal-forge.png',
    description: 'Collect every card in the Abyssal Forge set.',
    isUnlocked: _mastery(ABYSSAL_FORGE_PACK_POOL, []),
  },
  {
    id: 'pic-master-death-flamed-hell',
    name: 'Death-Flamed Hell Master',
    glyph: '💀',
    imageUrl: '/assets/profile-pictures/master-death-flamed-hell.png',
    description: 'Collect every card in the Death-Flamed Hell set.',
    isUnlocked: _mastery(DEATH_FLAMED_HELL_PACK_POOL, []),
  },
  {
    id: 'pic-master-wished-upon-a-star',
    name: 'Wished Upon A Star Master',
    glyph: '⭐',
    imageUrl: '/assets/profile-pictures/master-wished-upon-a-star.png',
    description: 'Collect every card in the Wished Upon A Star set.',
    isUnlocked: _mastery(WISHED_UPON_A_STAR_PACK_POOL, []),
  },
  {
    id: 'pic-master-infinitude',
    name: 'Infinitude Master',
    glyph: '∞',
    imageUrl: '/assets/profile-pictures/master-infinitude.png',
    description: 'Forge every card available through the Infinitude recipe system.',
    isUnlocked: (p) => INF_ALL_CORE.every(id => (p.infiniteCollection[id] ?? 0) > 0),
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
    isUnlocked: (p) => p.totalCardsPlayed >= 5_000,
  },
  {
    id: 'pic-classic-stacker',
    name: 'Stacker',
    glyph: '⛓',
    imageUrl: '/assets/profile-pictures/classic-stacker.png',
    description: 'Play 25,000 cards.',
    isUnlocked: (p) => p.totalCardsPlayed >= 25_000,
  },
  {
    id: 'pic-classic-oblivion-touched',
    name: 'Oblivion-Touched',
    glyph: '∞',
    imageUrl: '/assets/profile-pictures/classic-oblivion-touched.png',
    description: 'Earn 10,000 Oblivion in a single turn.',
    isUnlocked: (p) => (p.bestSingleTurnOblivion ?? 0) >= 10_000,
  },
  {
    id: 'pic-classic-eternal',
    name: 'Eternal',
    glyph: '✨',
    imageUrl: '/assets/profile-pictures/classic-eternal.png',
    description: 'Obtain any Eternal card.',
    isUnlocked: (p) => Object.keys(p.collection).some(id => id.startsWith('btei-')),
  },
  {
    id: 'pic-classic-boss-slayer',
    name: 'Boss Slayer',
    glyph: '⚔',
    imageUrl: '/assets/profile-pictures/classic-boss-slayer.png',
    description: "Defeat your first boss in Eternity's Wake.",
    isUnlocked: (p) => Object.keys(p.bossClearCounts).length >= 1,
  },
  {
    id: 'pic-classic-eternal-conqueror',
    name: 'Eternal Conqueror',
    glyph: '👑',
    imageUrl: '/assets/profile-pictures/classic-eternal-conqueror.png',
    description: "Defeat 8 distinct bosses in Eternity's Wake.",
    isUnlocked: (p) => Object.keys(p.bossClearCounts).length >= 8,
  },
  {
    id: 'pic-classic-collector',
    name: 'Collector',
    glyph: '🗂',
    imageUrl: '/assets/profile-pictures/classic-collector.png',
    description: 'Own 50 distinct card types.',
    isUnlocked: (p) => Object.keys(p.collection).length >= 50,
  },
  {
    id: 'pic-classic-holo-curator',
    name: 'Holo Curator',
    glyph: '💿',
    imageUrl: '/assets/profile-pictures/classic-holo-curator.png',
    description: 'Own 20 distinct holographic cards.',
    isUnlocked: (p) => Object.keys(p.holoCollection).length >= 20,
  },
  {
    id: 'pic-classic-infinite',
    name: 'Infinite',
    glyph: '∞',
    imageUrl: '/assets/profile-pictures/classic-infinite.png',
    description: 'Forge your first Infinite card.',
    isUnlocked: (p) => Object.values(p.infiniteCollection).some(v => v > 0),
  },
  {
    id: 'pic-classic-shardlord',
    name: 'Shardlord',
    glyph: '💎',
    imageUrl: '/assets/profile-pictures/classic-shardlord.png',
    description: 'Accumulate 500 Aberrated Shards.',
    isUnlocked: (p) => p.aberratedShards >= 500,
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
