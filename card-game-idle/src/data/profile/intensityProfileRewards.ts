export const INTENSITY_PROFILE_REWARDS = [
  { bossId: 'boss-intensity-drowned-cathedral', id: 'pic-wake-intensity-cathedral', achievementId: 'title-intensity-portrait-cathedral', name: 'The Cathedral in Flame', file: 'wake-profile-intensity-cathedral.png', glyph: '◆' },
  { bossId: 'boss-intensity-divided-crown', id: 'pic-wake-intensity-divided-crown', achievementId: 'title-intensity-portrait-divided-crown', name: 'Bearer of the Burning Crown', file: 'wake-profile-intensity-divided-crown.png', glyph: '♛' },
  { bossId: 'boss-intensity-unbearable-noon', id: 'pic-wake-intensity-unbearable-noon', achievementId: 'title-intensity-portrait-unbearable-noon', name: 'The Noon That Burns', file: 'wake-profile-intensity-unbearable-noon.png', glyph: '☀' },
  { bossId: 'boss-intensity-distance-bell', id: 'pic-wake-intensity-distance-bell', achievementId: 'title-intensity-portrait-distance-bell', name: 'Voice of the Volcanic Bell', file: 'wake-profile-intensity-distance-bell.png', glyph: '◈' },
  { bossId: 'boss-intensity-last-dawn', id: 'pic-wake-intensity-last-dawn', achievementId: 'title-intensity-portrait-last-dawn', name: 'The Last Dawn Ascendant', file: 'wake-profile-intensity-last-dawn.png', glyph: '✦' },
] as const;

const art = import.meta.glob<string>('../../assets/profile-pictures/intensity/*.png', {
  eager: true, query: '?url', import: 'default',
});

export function getIntensityPortraitArt(filename: string): string | undefined {
  return Object.entries(art).find(([path]) => path.endsWith(`/${filename}`))?.[1];
}
