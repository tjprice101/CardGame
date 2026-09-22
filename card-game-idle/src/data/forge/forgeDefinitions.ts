import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';

/**
 * Forge of Transcendence — unlock roster.
 *
 * The Forge unlocks permanently, one time ever, once every boss belonging to
 * the currently-running event category has been defeated at least once.
 * Currently the only live event is Causality, so its 5 Eternity's Wake
 * bosses are the full unlock roster. If a future event replaces Causality,
 * this constant is the single place to repoint.
 */
export const FORGE_EVENT_BOSS_CATEGORY = 'Causality' as const;

export const FORGE_EVENT_BOSS_IDS: readonly string[] = BOSS_DEFINITIONS
  .filter(boss => boss.category === FORGE_EVENT_BOSS_CATEGORY)
  .map(boss => boss.id);

/** The 4 placeholder Transcendent card ids repurposed as Forge gallery pieces. */
export const FORGE_PLACEHOLDER_CARD_IDS: readonly string[] = [
  'tx-neutral-starbound-glimmer',
  'tx-neutral-null-catalyst',
  'tx-neutral-void-reliquary',
  'tx-angel-starbound-null-archangel',
];

export interface ForgeCardLore {
  definitionId: string;
  /** Placeholder display name shown until real design lands. */
  displayName: string;
  /** Short one-line myth hook shown on the gallery tile. */
  tagline: string;
  /** Full lore passage shown on the card's dedicated sub-page. */
  lore: string;
  /** Placeholder banner gradient (stands in for real key art). */
  bannerGradient: string;
  /** Placeholder full-page splash gradient (stands in for real splash art). */
  splashGradient: string;
  /** Wide 16:9 banner art shown behind the chapter-list nav entry. */
  navBannerImage: string;
}

/** Shards of Transcendence cost to acquire 1 copy of a Forge gallery card. */
export const FORGE_CARD_SHARD_COST = 25;

const RAINBOW_BANNER =
  'conic-gradient(from 180deg at 50% 50%, #ff2fd0, #ff9d3d, #fff35c, #4dffb8, #4d9dff, #b24dff, #ff2fd0)';

const forgeAsset = (file: string): string => `url('${import.meta.env.BASE_URL}assets/forge/${file}')`;

/**
 * Lore for the 4 Forge gallery cards. See
 * "Midjourney Art/Forge of Transcendence Prompts.md" for the art brief and
 * src/data/ascension/transcendentCards.ts for each card's rules text.
 */
export const FORGE_CARD_LORE: readonly ForgeCardLore[] = [
  {
    definitionId: 'tx-neutral-starbound-glimmer',
    displayName: 'Light Before the First Star',
    tagline: 'The first light that was not born of any star.',
    lore: 'Before sets, before suits, before a single card bore a name, there was a glimmer that refused to belong. It answers to no house and casts no shadow of allegiance.',
    bannerGradient: forgeAsset('forge-card-1-art.png'),
    splashGradient: forgeAsset('forge-card-1-splash.png'),
    navBannerImage: forgeAsset('forge-card-1-banner.png'),
  },
  {
    definitionId: 'tx-neutral-null-catalyst',
    displayName: 'The First Catalyst',
    tagline: 'The catalyst that first taught cause to have an effect.',
    lore: 'It is said this card was present at the first shuffle, the moment chance itself learned to matter.',
    bannerGradient: forgeAsset('forge-card-2-art.png'),
    splashGradient: forgeAsset('forge-card-2-splash.png'),
    navBannerImage: forgeAsset('forge-card-2-banner.png'),
  },
  {
    definitionId: 'tx-neutral-void-reliquary',
    displayName: 'The Reliquary of All and Nothing',
    tagline: 'A reliquary that holds nothing, and therefore holds everything.',
    lore: 'What it contains has never been seen by any who kept it.',
    bannerGradient: forgeAsset('forge-card-3-art.png'),
    splashGradient: forgeAsset('forge-card-3-splash.png'),
    navBannerImage: forgeAsset('forge-card-3-banner.png'),
  },
  {
    definitionId: 'tx-angel-starbound-null-archangel',
    displayName: 'The Bridge Between Light and Life',
    tagline: 'The one that bridged the light so life could exist at all.',
    lore: 'Not summoned, not drafted, not owned — it simply arrived once, and the world began.',
    bannerGradient: RAINBOW_BANNER,
    splashGradient: 'radial-gradient(circle at 50% 30%, #ffffff 0%, #fff6d8 22%, #181410 78%)',
    navBannerImage: RAINBOW_BANNER,
  },
];

export function getForgeCardLore(definitionId: string): ForgeCardLore | undefined {
  return FORGE_CARD_LORE.find(entry => entry.definitionId === definitionId);
}

/** True once every Forge-gated event boss has been cleared at least once. */
export function hasBeatenAllForgeEventBosses(bossCodex: Record<string, unknown> | undefined): boolean {
  if (!bossCodex) return false;
  return FORGE_EVENT_BOSS_IDS.every(bossId => bossCodex[bossId] !== undefined);
}

/** Base Shard of Transcendence drop chance per eligible source roll (0.1%). */
export const SHARD_OF_TRANSCENDENCE_BASE_CHANCE = 0.001;

/**
 * Rolls for a single Shard of Transcendence. Only ever eligible once the
 * Forge has been opened (key spent) — callers must gate on
 * `progress.forgeOfTranscendenceUnlocked` before calling this.
 * @param variantMultiplier x2/x3 Eternity's Wake boss variants scale the base chance linearly.
 */
export function rollShardOfTranscendence(variantMultiplier = 1): boolean {
  const chance = SHARD_OF_TRANSCENDENCE_BASE_CHANCE * Math.max(1, variantMultiplier);
  return Math.random() < chance;
}

/**
 * Login Calendar days eligible for a rare bonus Shard of Transcendence roll
 * (only once the Forge is open) — about 1-2 days across a 30-day cycle.
 */
export const FORGE_CALENDAR_BONUS_DAYS: readonly number[] = [10, 22];
