const NULL_RAID_ART_ROOT = `${import.meta.env.BASE_URL}assets/card-backgrounds`;

const NULL_RAID_BOSS_ART_FILES: Record<string, { folder: string; file: string }> = {
  'nr-neutrality-event-horizon-arbiter': { folder: 'neutrality', file: 'Event Horizon Arbiter.png' },
  'nr-neutrality-verdant-null': { folder: 'neutrality', file: 'Verdant Null, Last Wish Executioner.png' },
  'nr-pyroabyss-ember-eventide-tyrant': { folder: 'pyroabyss', file: 'Ember Eventide Tyrant.png' },
  'nr-pyroabyss-pyraxis-nullstar-sovereign': { folder: 'pyroabyss', file: 'Pyraxis Nullstar Sovereign.png' },
  'nr-light-auric-eclipse-herald': { folder: 'heavenly-light', file: 'Auric Eclipse Herald.png' },
  'nr-light-zenith-duality-throne': { folder: 'heavenly-light', file: 'Zenith Duality Throne.png' },
};

const NULL_RAID_SPLASH_ART_FILES: Record<string, { folder: string; file: string }> = {
  'raid-null-verdict-of-stars': { folder: 'neutrality', file: 'The Null Verdict of Stars.png' },
  'raid-crown-of-the-dying-constellation': { folder: 'pyroabyss', file: 'Crown of the Abyssal Inferno.png' },
  'raid-halo-of-the-twin-horizon': { folder: 'heavenly-light', file: 'Halo of the Twin Horizon.png' },
};

export function getNullRaidBossArtUrl(bossId: string | null | undefined): string | null {
  if (!bossId) return null;
  const entry = NULL_RAID_BOSS_ART_FILES[bossId];
  if (!entry) return null;
  return `${NULL_RAID_ART_ROOT}/${entry.folder}/${encodeURI(entry.file)}`;
}

export function getNullRaidSplashArtUrl(raidId: string | null | undefined): string | null {
  if (!raidId) return null;
  const entry = NULL_RAID_SPLASH_ART_FILES[raidId];
  if (!entry) return null;
  return `${NULL_RAID_ART_ROOT}/${entry.folder}/${encodeURI(entry.file)}`;
}
