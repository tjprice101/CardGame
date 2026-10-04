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

/** The 4 placeholder Transcendent card ids repurposed as Forge gallery pieces (Vol. 1). */
export const FORGE_PLACEHOLDER_CARD_IDS: readonly string[] = [
  'tx-neutral-starbound-glimmer',
  'tx-neutral-null-catalyst',
  'tx-neutral-void-reliquary',
  'tx-angel-starbound-null-archangel',
];

export const FORGE_VOL_1_CARD_IDS: readonly string[] = FORGE_PLACEHOLDER_CARD_IDS;

export interface ForgeCardLore {
  definitionId: string;
  volume?: string;
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

const forgeAsset = (file: string): string => `url('${import.meta.env.BASE_URL}assets/forge/${file}')`;

/**
 * Lore for the Vol. 1 Forge gallery cards. See
 * "Midjourney Art/Forge of Transcendence Prompts.md" for the art brief and
 * src/data/ascension/transcendentCards.ts for each card's rules text.
 */
export const FORGE_CARD_LORE: readonly ForgeCardLore[] = [
  {
    definitionId: 'tx-neutral-starbound-glimmer',
    volume: 'Vol. 1',
    displayName: 'Light Before the First Star',
    tagline: 'The first light that was not born of any star.',
    lore: 'Before sets, before suits, before a single card bore a name, there was a glimmer that refused to belong. It answers to no house and casts no shadow of allegiance.',
    bannerGradient: forgeAsset('forge-card-1-art.png'),
    splashGradient: forgeAsset('forge-card-1-splash.png'),
    navBannerImage: forgeAsset('forge-card-1-banner.png'),
  },
  {
    definitionId: 'tx-neutral-null-catalyst',
    volume: 'Vol. 1',
    displayName: 'The First Catalyst',
    tagline: 'The catalyst that first taught cause to have an effect.',
    lore: 'It is said this card was present at the first shuffle, the moment chance itself learned to matter.',
    bannerGradient: forgeAsset('forge-card-2-art.png'),
    splashGradient: forgeAsset('forge-card-2-splash.png'),
    navBannerImage: forgeAsset('forge-card-2-banner.png'),
  },
  {
    definitionId: 'tx-neutral-void-reliquary',
    volume: 'Vol. 1',
    displayName: 'The Reliquary of All and Nothing',
    tagline: 'A reliquary that holds nothing, and therefore holds everything.',
    lore: 'What it contains has never been seen by any who kept it.',
    bannerGradient: forgeAsset('forge-card-3-art.png'),
    splashGradient: forgeAsset('forge-card-3-splash.png'),
    navBannerImage: forgeAsset('forge-card-3-banner.png'),
  },
  {
    definitionId: 'tx-angel-starbound-null-archangel',
    volume: 'Vol. 1',
    displayName: 'The Bridge Between Light and Life',
    tagline: 'The one that bridged the light so life could exist at all.',
    lore: 'Not summoned, not drafted, not owned — it simply arrived once, and the world began.',
    bannerGradient: forgeAsset('forge-card-4-art.png'),
    splashGradient: forgeAsset('forge-card-4-splash.png'),
    navBannerImage: forgeAsset('forge-card-4-banner.png'),
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

/** Base Shard of Transcendence drop chance per eligible source roll (1%). */
export const SHARD_OF_TRANSCENDENCE_BASE_CHANCE = 0.01;

/**
 * Rolls for Shards of Transcendence: ~1% chance per clear (scaled by variant fight count if applicable),
 * dropping in quantities of 1 to 3 with equal ~33.33% weights (1, 2, or 3).
 * Returns the number of shards dropped (0 if the roll did not trigger).
 */
export function rollShardOfTranscendence(variantMultiplier = 1): number {
  const chance = SHARD_OF_TRANSCENDENCE_BASE_CHANCE * Math.max(1, variantMultiplier);
  if (Math.random() < chance) {
    const roll = Math.random();
    if (roll < 1 / 3) return 1;
    if (roll < 2 / 3) return 2;
    return 3;
  }
  return 0;
}

/** Drop rates are only revealed once all Forge event bosses are beaten AND the Forge is opened. */
export function areShardDropRatesVisible(progress: { forgeOfTranscendenceUnlocked?: boolean; bossCodex?: Record<string, unknown> }): boolean {
  return progress.forgeOfTranscendenceUnlocked === true && hasBeatenAllForgeEventBosses(progress.bossCodex);
}

export function formatShardDropChance(variantMultiplier = 1): string {
  const percent = SHARD_OF_TRANSCENDENCE_BASE_CHANCE * Math.max(1, variantMultiplier) * 100;
  return `${percent.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
}

/**
 * Login Calendar days eligible for a rare bonus Shard of Transcendence roll
 * (only once the Forge is open) — about 1-2 days across a 30-day cycle.
 */
export const FORGE_CALENDAR_BONUS_DAYS: readonly number[] = [10, 25];

export const FORGE_STREAK_MILESTONES = [
  { day: 3, kind: 'aberrated_shards', amount: 100, label: '+100 Aberrated Shards' },
  { day: 14, kind: 'shards_of_transcendence', amount: 2, label: '+2 Shards of Transcendence' },
] as const;

export const FORGE_WHEEL_PRIZES = [
  { id: 'aberrated-50', kind: 'aberrated_shards', amount: 50, weight: 20, label: '+50 Aberrated Shards', color: '#7044a8' },
  { id: 'card-light-3', kind: 'card_light_all', amount: 3, weight: 14, label: '+3 Card-light to owned cards', color: '#1679aa' },
  { id: 'aberrated-100', kind: 'aberrated_shards', amount: 100, weight: 16, label: '+100 Aberrated Shards', color: '#7044a8' },
  { id: 'aberrated-150', kind: 'aberrated_shards', amount: 150, weight: 10, label: '+150 Aberrated Shards', color: '#7044a8' },
  { id: 'transcendence-shard-1', kind: 'shards_of_transcendence', amount: 1, weight: 8, label: '+1 Shard of Transcendence', color: '#bd2869' },
  { id: 'aberrated-500', kind: 'aberrated_shards', amount: 500, weight: 5, label: '+500 Aberrated Shards', color: '#7044a8' },
  { id: 'divine-light-1725', kind: 'divine_light', amount: 1_725, weight: 9, label: '+1,725 Divine Light', color: '#b8862c' },
] as const;

export const FORGE_WHEEL_TOTAL_WEIGHT = FORGE_WHEEL_PRIZES.reduce((total, prize) => total + prize.weight, 0);
