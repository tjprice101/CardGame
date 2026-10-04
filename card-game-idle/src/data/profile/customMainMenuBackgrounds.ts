import { transcendentCardDefinitions } from '@/data/ascension/transcendentCards';
import type { ProgressState } from '@/types/game';
import { isThemeUnlocked } from './uiThemes';

export interface CustomMainMenuBackgroundReward {
  id: string;
  achievementId: string;
  name: string;
  description: string;
  requirement: string;
  artFileStem: string;
  rarity: 'Legendary' | 'Eternal' | 'Infinite' | 'Transcendent';
  meetsRequirement: (progress: ProgressState) => boolean;
}

const volumeOneIds = transcendentCardDefinitions
  .filter(card => card.subset === 'Vol. 1')
  .map(card => card.definitionId);

export const CUSTOM_MAIN_MENU_BACKGROUND_REWARDS: readonly CustomMainMenuBackgroundReward[] = [
  {
    id: 'main-menu-bg-intensity-first-eruption', achievementId: 'title-background-intensity-base',
    name: 'The First Unbroken Eruption', description: 'A white volcanic mountain awakens above an obsidian sea in orange-red infernos.',
    requirement: 'Own every base Intensity card.', artFileStem: 'intensity-base-completion-splash', rarity: 'Legendary',
    meetsRequirement: progress => isThemeUnlocked('theme-reward-base-intensity', progress),
  },
  {
    id: 'main-menu-bg-intensity-five-sovereigns', achievementId: 'title-background-intensity-eternal',
    name: 'The Five Who Command the Flame', description: 'Five volcanic powers gather around a burning obsidian crown.',
    requirement: 'Own every Eternal Intensity card.', artFileStem: 'intensity-eternal-completion-splash', rarity: 'Eternal',
    meetsRequirement: progress => isThemeUnlocked('theme-reward-eternal-intensity', progress),
  },
  {
    id: 'main-menu-bg-intensity-endless-inferno', achievementId: 'title-background-intensity-infinite',
    name: 'The Inferno Without a Last Dawn', description: 'A white phoenix carries endless erupting worlds across a black abyss.',
    requirement: 'Own every Infinite Intensity card.', artFileStem: 'intensity-infinite-completion-splash', rarity: 'Infinite',
    meetsRequirement: progress => isThemeUnlocked('theme-reward-infinite-intensity', progress),
  },
  {
    id: 'main-menu-bg-forge-unsealed-impossible',
    achievementId: 'title-background-unsealed-impossible',
    name: 'The Unsealed Impossible',
    description: 'A torn black aperture disgorges impossible white architecture and scarlet wing-fire.',
    requirement: 'Unlock the Forge of Transcendence.',
    artFileStem: 'forge-unsealed-impossible',
    rarity: 'Transcendent',
    meetsRequirement: progress => progress.forgeOfTranscendenceUnlocked === true,
  },
  {
    id: 'main-menu-bg-forge-star-without-sky',
    achievementId: 'title-background-star-without-sky',
    name: 'A Star Without a Sky',
    description: 'One unborn white star tears a starless parchment universe into hot-pink ink tides.',
    requirement: 'Own at least 1 distinct Volume I Transcendent card.',
    artFileStem: 'forge-star-without-sky',
    rarity: 'Transcendent',
    meetsRequirement: progress => volumeOneIds.some(id => (progress.transcendentCollection?.[id] ?? 0) > 0),
  },
  {
    id: 'main-menu-bg-forge-fourfold-absolute',
    achievementId: 'title-background-fourfold-absolute',
    name: 'The Fourfold Absolute',
    description: 'Four impossible relics fracture a single white world into a colossal ink mandala.',
    requirement: 'Own all 4 distinct Volume I Transcendent cards.',
    artFileStem: 'forge-fourfold-absolute',
    rarity: 'Transcendent',
    meetsRequirement: progress => volumeOneIds.length > 0
      && volumeOneIds.every(id => (progress.transcendentCollection?.[id] ?? 0) > 0),
  },
  {
    id: 'main-menu-bg-forge-devouring-dawn',
    achievementId: 'title-background-devouring-dawn',
    name: 'The Dawn That Devours Night',
    description: 'Three white dawns erupt from a black sun in enormous flaming brushstroke wings.',
    requirement: 'Acquire the Transcendent ability First Dawn Accord.',
    artFileStem: 'forge-devouring-dawn',
    rarity: 'Transcendent',
    meetsRequirement: progress => progress.ownedAbilities?.['transcendent-starbound-glimmer'] === true,
  },
  {
    id: 'main-menu-bg-forge-velocity-of-silence',
    achievementId: 'title-background-velocity-of-silence',
    name: 'The Velocity of Silence',
    description: 'A white needle ruptures concentric black halos, dragging scarlet time behind it.',
    requirement: 'Acquire the Transcendent ability Axiom of Acceleration.',
    artFileStem: 'forge-velocity-of-silence',
    rarity: 'Transcendent',
    meetsRequirement: progress => progress.ownedAbilities?.['transcendent-first-catalyst'] === true,
  },
  {
    id: 'main-menu-bg-forge-unwritten-tomorrows',
    achievementId: 'title-background-unwritten-tomorrows',
    name: 'Cathedral of Unwritten Tomorrows',
    description: 'An open white reliquary releases cathedral-sized blank pages and impossible futures.',
    requirement: 'Acquire the Transcendent ability Vault of Unwritten Futures.',
    artFileStem: 'forge-unwritten-tomorrows',
    rarity: 'Transcendent',
    meetsRequirement: progress => progress.ownedAbilities?.['transcendent-reliquary-all-nothing'] === true,
  },
  {
    id: 'main-menu-bg-forge-origins-break',
    achievementId: 'title-background-origins-break',
    name: 'Where Every Origin Breaks',
    description: 'Radiant white and abyssal black currents collide inside a four-winged origin storm.',
    requirement: 'Acquire the Transcendent ability Confluence of All Origins.',
    artFileStem: 'forge-origins-break',
    rarity: 'Transcendent',
    meetsRequirement: progress => progress.ownedAbilities?.['transcendent-bridge-light-life'] === true,
  },
];

export function isCustomBackgroundRewardUnlocked(
  reward: CustomMainMenuBackgroundReward,
  progress: ProgressState,
): boolean {
  return progress.achievementUnlocks?.[reward.achievementId] === true || reward.meetsRequirement(progress);
}

const bundledArt = import.meta.glob<string>('../../assets/main-menu-backgrounds/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function findCustomBackgroundReward(filename: string): CustomMainMenuBackgroundReward | undefined {
  const stem = filename.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '').toLowerCase().replace(/[\s_]+/g, '-');
  return CUSTOM_MAIN_MENU_BACKGROUND_REWARDS.find(reward => reward.artFileStem === stem);
}

export function getBundledCustomBackgroundArt(reward: CustomMainMenuBackgroundReward): string | undefined {
  return Object.entries(bundledArt).find(([path]) => findCustomBackgroundReward(path)?.id === reward.id)?.[1];
}
