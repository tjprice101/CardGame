/** Installed artwork keyed by persistent card identity, independent of gameplay definitions. */
export const INTENSITY_CARD_ART: Readonly<Record<string, string>> = {
  'light-intensity-palevent-herald': 'intensity-l0-palevent-herald.png',
  'dark-intensity-nacreless-choir': 'intensity-l0-nacreless-choir.png',
  'light-intensity-handful-of-daybreak': 'intensity-l0-handful-of-daybreak.png',
  'dark-intensity-relics-beneath-the-burn': 'intensity-l0-relics-beneath-the-burn.png',
  'light-intensity-calderas-first-breath': 'intensity-l1-calderas-first-breath.png',
  'dark-intensity-maw-beneath-morning': 'intensity-l1-maw-beneath-morning.png',
  'light-intensity-the-unburning-boundary': 'intensity-l1-the-unburning-boundary.png',
  'dark-intensity-vestment-of-the-buried-sun': 'intensity-l1-vestment-of-the-buried-sun.png',
  'dark-intensity-throat-of-the-deep': 'intensity-l2-throat-of-the-deep.png',
  'light-intensity-a-horizon-set-alight': 'intensity-l2-a-horizon-set-alight.png',
  'dark-intensity-what-the-depths-remember': 'intensity-l2-what-the-depths-remember.png',
  'light-intensity-the-chosen-remnant': 'intensity-l3-the-chosen-remnant.png',
  'dark-intensity-the-earth-refuses-silence': 'intensity-l3-the-earth-refuses-silence.png',
  'ain-soph-aur-intensity-the-unsevered-contradiction': 'intensity-l3-the-unsevered-contradiction.png',
  'ain-soph-aur-intensity-fifth-pulse-open-heaven': 'intensity-l4-fifth-pulse-open-heaven.png',
  'dark-intensity-night-that-burns-forever': 'intensity-l4-night-that-burns-forever.png',
  'ain-soph-aur-intensity-the-weight-of-all-horizons': 'intensity-l5-the-weight-of-all-horizons.png',
  'ain-soph-aur-intensity-when-both-ends-meet': 'intensity-l5-when-both-ends-meet.png',
  'ain-soph-aur-intensity-center-of-the-unmaking': 'intensity-l5-center-of-the-unmaking.png',
  'eternal-intensity-cathedral-below-all-seas': 'intensity-eternal-cathedral-below-all-seas.png',
  'eternal-intensity-the-crown-divided-against-itself': 'intensity-eternal-the-crown-divided-against-itself.png',
  'eternal-intensity-sovereign-of-unbearable-noon': 'intensity-eternal-sovereign-of-unbearable-noon.png',
  'eternal-intensity-the-bell-that-buries-distance': 'intensity-eternal-the-bell-that-buries-distance.png',
  'eternal-intensity-verdict-after-the-last-dawn': 'intensity-eternal-verdict-after-the-last-dawn.png',
  'infinite-intensity-the-unfathomed-return': 'intensity-infinity-the-unfathomed-return.png',
  'infinite-intensity-crown-with-no-final-king': 'intensity-infinity-crown-with-no-final-king.png',
  'infinite-intensity-daybreak-without-end': 'intensity-infinity-daybreak-without-end.png',
  'infinite-intensity-a-furnace-outside-time': 'intensity-infinity-a-furnace-outside-time.png',
  'infinite-intensity-the-seam-that-holds-eternity': 'intensity-infinity-the-seam-that-holds-eternity.png',
};

export const INTENSITY_CARD_BACK_FILE = 'intensity-card-back.png';
export const INTENSITY_PACK_BANNER_FILE = 'intensity-set-banner.png';

export function isIntensityCardId(definitionId: string): boolean {
  return /^(?:light|dark|ain-soph-aur|eternal|infinite)-intensity-/.test(definitionId);
}
