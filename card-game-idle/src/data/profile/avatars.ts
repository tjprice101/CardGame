import type { ProgressState } from '@/types/game';

/**
 * Avatar registry. Each entry is gated by a requirement function that reads
 * the player's ProgressState. Avatars are not stored individually on the save —
 * unlock status is computed on demand so progression always stays in sync.
 */
export interface AvatarDefinition {
  id: string;
  name: string;
  /** Visual glyph used as the avatar (emoji-safe across platforms). */
  glyph: string;
  /** Short flavor / unlock description shown when locked. */
  description: string;
  /** Returns true when the player has earned this avatar. */
  isUnlocked: (progress: ProgressState) => boolean;
}

const sumValues = (record: Record<string, number>): number =>
  Object.values(record).reduce((a, b) => a + b, 0);

export const DEFAULT_AVATAR_ID = 'avatar-acolyte';

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
    description: 'Earn 10,000 Oblivion.',
    isUnlocked: (p) => p.oblivion >= 10_000,
  },
  {
    id: 'avatar-eternal',
    name: 'Eternal',
    glyph: '☉',
    description: 'Earn 1,000,000 Oblivion.',
    isUnlocked: (p) => p.oblivion >= 1_000_000,
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
];

export const AVATAR_BY_ID: Record<string, AvatarDefinition> =
  Object.fromEntries(AVATARS.map(a => [a.id, a]));

export function isAvatarUnlocked(id: string, progress: ProgressState): boolean {
  const def = AVATAR_BY_ID[id];
  return !!def && def.isUnlocked(progress);
}

/**
 * Resolves the avatar to display. If the requested id is no longer unlocked
 * (e.g. progress reset) or unknown, falls back to the default avatar.
 */
export function resolveAvatar(id: string | null | undefined, progress: ProgressState): AvatarDefinition {
  if (id && AVATAR_BY_ID[id]?.isUnlocked(progress)) return AVATAR_BY_ID[id];
  return AVATAR_BY_ID[DEFAULT_AVATAR_ID];
}
