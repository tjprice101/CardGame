import type { TitleBadgeDefinition } from '@/data/profile/titleBadges';

export const ACHIEVEMENT_CATEGORIES = [
  { id: 'card-play', section: 'Gameplay', label: 'Card Play', description: 'Your first steps and lifetime cards played.' },
  { id: 'resources', section: 'Gameplay', label: 'Resources', description: 'Divine Light, Aberrated Shards, and Entropic Energy milestones.' },
  { id: 'daily-login', section: 'Gameplay', label: 'Daily Devotion', description: 'Consecutive login streaks and total days returned.' },
  { id: 'collection', section: 'Collection', label: 'Collection Growth', description: 'Grow your collection of distinct cards.' },
  { id: 'holographic', section: 'Collection', label: 'Holographic Cards', description: 'Discover and collect holographic cards.' },
  { id: 'infinite', section: 'Collection', label: 'Infinity Crafted', description: 'Lifetime crafting milestones and individual cards crafted through the Infinity menu.' },
  { id: 'eternal', section: 'Collection', label: 'Eternal Cards', description: "Earn distinct Eternal rewards from Eternity's Wake." },
  { id: 'enigmatic', section: 'Collection', label: 'Enigmatic Cards', description: 'Discover the hidden card rewards of Enigmas.' },
  { id: 'set', section: 'Collection', label: 'Set Completion', description: 'Collect every card in a complete set, including all Eternal rarities.' },
  { id: 'wake-milestones', section: 'Battles', label: 'Wake Milestones', description: "Total victories, distinct boss clears, and mastery of Eternity's Wake." },
  { id: 'boss', section: 'Battles', label: 'Boss & Category Clears', description: "Defeat individual Eternity's Wake bosses and complete their categories." },
  { id: 'null-raids', section: 'Battles', label: 'Null Raids', description: 'Clear Null Raids and master the Void Corridor.' },
  { id: 'battleground', section: 'Battles', label: 'Battleground', description: 'Competitive matches, victories, and best scores.' },
  { id: 'forge', section: 'Progression', label: 'Forge & Transcendence', description: 'Open the Forge, acquire Transcendent cards, and gather Shards of Transcendence.' },
  { id: 'causality', section: 'Progression', label: 'Causality', description: 'Causality collection, card play, Enigmas, and rare rewards.' },
  { id: 'intensity', section: 'Progression', label: 'Intensity', description: 'Inferno generation and spending, volcanic expeditions, card play, and ability mastery.' },
  { id: 'garden', section: 'Progression', label: 'Garden Expeditions', description: 'Recover and stockpile materials from Garden expeditions.' },
  { id: 'abilities', section: 'Progression', label: 'Ability Materialization', description: 'Materialize abilities and build your arsenal.' },
  { id: 'social', section: 'Social', label: 'Friends & Co-op', description: 'Friendships, messages, gifts, and invitations to shared battles.' },
  { id: 'background', section: 'Cosmetics', label: 'Custom Backgrounds', description: 'Set completion crowns, three Intensity completion splashes, and Transcendent Forge backgrounds. Earned rewards appear in Player Information > Main Menu Background.' },
] as const;

export type AchievementCategoryId = typeof ACHIEVEMENT_CATEGORIES[number]['id'];

// Presentation categories are separate from reward groups so reorganizing the
// menu never changes payouts, title filters, or persisted achievement IDs.
const MILESTONE_IDS: Partial<Record<AchievementCategoryId, readonly string[]>> = {
  'card-play': [
    'title-newborn', 'title-first-play', 'title-initiate', 'title-cardhand', 'title-pact-keeper',
    'title-deckmaster', 'title-endless-dealer', 'title-card-torrent',
  ],
  resources: [
    'title-first-oblivion', 'title-oblivion-touched', 'title-stillness', 'title-million-veil',
    'title-of-the-eternal', 'title-oblivion-emperor', 'title-first-shard', 'title-shard-collector',
    'title-shard-hoarder', 'title-shard-sovereign', 'title-entropic-ascendant',
  ],
  'daily-login': [
    'title-returning', 'title-devoted', 'title-faithful', 'title-undying-flame', 'title-veteran',
  ],
  collection: [
    'title-first-collection', 'title-hoarder', 'title-archivist', 'title-curator', 'title-encyclopedist',
  ],
  holographic: ['title-first-holo', 'title-holo-pilgrim', 'title-holo-devotee', 'title-holo-saint'],
  infinite: ['title-first-infinite', 'title-infinitude', 'title-infinite-sovereign', 'title-infinite-pantheon'],
  eternal: ['title-first-eternal', 'title-eternal-collection'],
  enigmatic: ['title-first-enigmatic', 'title-enigmatic-pair'],
  'wake-milestones': [
    'title-first-blood', 'title-bossbreaker', 'title-bossbane', 'title-boss-conqueror', 'title-boss-champion',
    'title-first-victory', 'title-wake-tested', 'title-wake-warden', 'title-wake-sovereign',
    'title-wake-tyrant', 'title-eternal',
  ],
  'null-raids': ['title-null-raid-initiate', 'title-null-raid-legend'],
  battleground: ['title-battleground-contender', 'title-battleground-warmarshal', 'title-battleground-overlord'],
  forge: [
    'title-transcendent-caller', 'title-transcendent-pantheon', 'title-forge-unsealed', 'title-first-beyond',
    'title-light-before-stars', 'title-first-catalyst', 'title-all-and-nothing', 'title-between-light-life',
    'title-forge-pantheon-complete', 'title-transcendence-shardbearer',
  ],
  causality: [
    'title-causality-cartographer', 'title-event-horizon-scribe', 'title-causality-manuscript-reader',
    'title-causality-horizon-walker', 'title-causality-architect', 'title-causality-infinite',
    'title-causality-eternal-pantheon', 'title-causality-grand-scribe',
  ],
  garden: ['title-garden-initiate', 'title-garden-provisioner'],
  intensity: [
    'title-intensity-first-spark', 'title-intensity-ashwalker', 'title-intensity-volcanic-script',
    'title-intensity-kindler', 'title-intensity-unquenchable', 'title-intensity-eruption',
    'title-intensity-white-fire', 'title-intensity-pressure', 'title-intensity-crater',
    'title-intensity-crater-master', 'title-intensity-materials', 'title-intensity-first-ability',
    'title-intensity-foundation', 'title-intensity-arsenal', 'title-intensity-ability-master',
  ],
  abilities: ['title-first-materialization', 'title-ability-arsenal'],
  social: [
    'title-social-first-friend', 'title-social-circle', 'title-social-messenger',
    'title-social-attachment-archivist', 'title-social-giftbearer', 'title-social-arena-herald',
    'title-social-raid-convener', 'title-social-wingmate',
  ],
};

const milestoneCategoryById = new Map<string, AchievementCategoryId>();
for (const category of ACHIEVEMENT_CATEGORIES) {
  for (const id of MILESTONE_IDS[category.id] ?? []) {
    if (milestoneCategoryById.has(id)) throw new Error(`Duplicate achievement category assignment: ${id}`);
    milestoneCategoryById.set(id, category.id);
  }
}

export function getAchievementCategory(
  achievement: Pick<TitleBadgeDefinition, 'id' | 'group'>,
): AchievementCategoryId {
  if (achievement.group !== 'milestone') return achievement.group;
  const category = milestoneCategoryById.get(achievement.id);
  if (!category) throw new Error(`Missing achievement category: ${achievement.id}`);
  return category;
}
