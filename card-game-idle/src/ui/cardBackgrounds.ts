import type { CSSProperties } from 'react';
import type { CardDefinition, CardFaceState } from '@/types/cards';
import type { CardFinish } from '@/types/cards';
import { warmTheme } from '@/ui/theme';
import { getCardThemePackForElement, getCardThemePackStyle, getFontScale } from '@/ui/preferences';

const CARD_BACKGROUND_ROOT = `${import.meta.env.BASE_URL}assets/card-backgrounds`;
const CARD_BACKGROUND_FOLDERS: Partial<Record<string, string>> = {
  Fire: 'pyroabyss',
  Mechanical: 'mechanical-dreams',
  Light: 'heavenly-light',
  Neutrality: 'neutrality',
  Thornbound: 'thornbound-plains',
  Prismatic: 'prismatic-accord',
  GlassAbsolute: 'glass-absolute',
  BlazingGarden: 'blazing-garden',
  Butterfly: 'age-of-the-butterfly',
  EternalSeas: 'eternal-seas',
  AbyssalForge: 'abyssal-forge',
  DeathFlamedHell: 'death-flamed-hell',
  WishedUponAStar: 'wished-upon-a-star',
  Dark: 'black-glass-inferno',
};

export type CardFaceVariant = 'hand' | 'pack' | 'grid' | 'compact' | 'board' | 'boardMini';

export const cardFacePalette = {
  text: 'var(--card-face-text, #0f0906)',
  textSoft: 'var(--card-face-text-soft, rgba(15, 9, 6, 0.96))',
  textMuted: 'var(--card-face-text-muted, rgba(15, 9, 6, 0.84))',
  ribbon: 'var(--card-face-ribbon, rgba(242, 231, 216, 0.97))',
  panel: 'var(--card-face-panel, rgba(236, 222, 203, 0.96))',
  border: 'var(--card-face-border, rgba(52, 35, 21, 0.24))',
  shadow: 'var(--card-face-shadow, 0 10px 24px rgba(68, 49, 32, 0.12))',
};

const CONSISTENT_CARD_TEXT = '#130d08';
const CONSISTENT_CARD_TEXT_SOFT = 'rgba(19, 13, 8, 0.94)';
const CONSISTENT_CARD_TEXT_MUTED = 'rgba(19, 13, 8, 0.78)';

const CARD_FACE_METRICS_BASE: Record<CardFaceVariant, {
  ribbonPadding: string;
  panelPadding: string;
  typeSize: number;
  nameSize: number;
  descSize: number;
  descLineHeight: number;
  descLines: number;
}> = {
  hand: {
    ribbonPadding: '5px 9px 4px',
    panelPadding: '5px 9px 6px',
    typeSize: 8,
    nameSize: 12,
    descSize: 9,
    descLineHeight: 1.3,
    descLines: 2,
  },
  pack: {
    ribbonPadding: '6px 10px 5px',
    panelPadding: '6px 10px 7px',
    typeSize: 7,
    nameSize: 10,
    descSize: 8,
    descLineHeight: 1.3,
    descLines: 3,
  },
  grid: {
    ribbonPadding: '5px 8px 4px',
    panelPadding: '5px 8px 6px',
    typeSize: 6,
    nameSize: 8,
    descSize: 7,
    descLineHeight: 1.35,
    descLines: 3,
  },
  compact: {
    ribbonPadding: '6px 7px 5px',
    panelPadding: '6px 7px 7px',
    typeSize: 5,
    nameSize: 7,
    descSize: 6,
    descLineHeight: 1.3,
    descLines: 3,
  },
  board: {
    ribbonPadding: '7px 8px 6px',
    panelPadding: '7px 8px 8px',
    typeSize: 6,
    nameSize: 8,
    descSize: 6,
    descLineHeight: 1.3,
    descLines: 3,
  },
  boardMini: {
    ribbonPadding: '6px 7px 5px',
    panelPadding: '6px 7px 7px',
    typeSize: 5,
    nameSize: 6,
    descSize: 5,
    descLineHeight: 1.25,
    descLines: 2,
  },
};

interface CardFaceMetrics {
  ribbonPadding: string;
  panelPadding: string;
  typeSize: number;
  nameSize: number;
  descSize: number;
  descLineHeight: number;
  descLines: number;
}

const CARD_BACKGROUND_FILE_OVERRIDES: Record<string, string> = {
  'tx-angel-starbound-null-archangel': 'Starbound Null Archangel.png',
  'tx-angel-pyro-first-ember': 'Starflame Cataclysm Archangel.png',
  'tx-sera-null-entropy': 'Null Entropy.png',
  'tx-cher-null-sentinel': 'Null Sentinel.png',
  'tx-oph-null-convergence': 'Null Convergence.png',
  'tx-sera-pyro-singularity': 'Abyssal Singularity Seraph.png',
  'tx-cher-pyro-vow': 'Cinder Vow Cherub.png',
  'tx-oph-pyro-hellstar': 'Hellstar Ophanim.png',
  'tx-angel-light-astral-adjudicator': 'Astral Adjudicator Prime.png',
  'tx-sera-light-duality-crown': 'Duality Crown Seraph.png',
  'tx-cher-light-duality-vow': 'Duality Vow Cherub.png',
  'tx-oph-light-duality-wheel': 'Duality Wheel Ophanim.png',
  'hr-light-radiant-surge': 'Ember Surge.png',
  'hr-light-radiant-echo': 'Ember Echo.png',
  'hr-light-luminous-cycle': 'Ember Cycle.png',
  'cherubim-fire-ember-shroud': 'Ember Shroud.png',
  'ophanim-fire-ember-threshold': 'Ember Threshold.png',
  'ophanim-fire-ember-chain': 'Ember Chain.png',
  'btei-bgi-nocturne-of-embers': 'Nocturne of Embers.png',
  'tbp-ophanim-last-ember-caravan': 'Last Ember Caravan.png',
  'bg-ser-serevathi-ember-spiral': 'Serevathi Ember Spiral.png',
  'af-oph-saffron-ember-wheel': 'Saffron Ember Wheel.png',
  'af-oph-cobalt-ember-wheel': 'Cobalt Ember Wheel.png',
  'af-oph-chromatic-ember-cluster': 'Chromatic Ember Cluster.png',
  'dfh-et-crimson-ember-rain': 'Crimson Ember-Rain.png',
  // Wished Upon a Star fallback relinks for currently unexported exact filenames.
  'wuas-ser-seleniras-vigil': 'Starwarden Selenira.png',
  'wuas-cher-starlace-binding': 'Stargazer Token.png',
  'sv-infinite-polar-fission': 'Polar Cataclysm.png',
  'ophanim-neutral-cherubim-recall': 'Chaos Recall.png',
  'ser-fire-voidflame': 'Void-flame Seraphim.png',
  'bgi-ophanim-whiteblack-supernova': 'White-black Supernova.png',
  'bgi-ophanim-sorveths-eleventh-second': 'Shadows of the Inferno.png',
  'bgi-cherubim-sorveths-ring': 'Veth Serath Midplace.png',
  'bgi-cherubim-morvakaels-answer': "Morvakael's Answer.png",
  'btei-bgi-velplane-ossuary': 'Veilplane Fissure.png',
  'btei-bgi-elegy-of-veth-serath': 'Elegy of Veth Sarath.png',
  'inf-bgi-sorveths-final-breath': "Sorveth's Final Breath.png",
  'inf-bgi-chromatic-ruin-deluge': 'Chromatic Ruin Deluge.png',
  'inf-bgi-obsidian-covenant-colossus': 'Obsidian Covenant Colossus.png',
  'inf-bgi-glassrose-leviathan': 'Glassrose Leviathan.png',
  'inf-bgi-inferno-of-two-truths': 'Inferno of Two Truths.png',
  'inf-bgi-ashen-cinder-cathedral': 'Ashen Cinder Cathedral.png',
  'inf-bgi-vaelmor-umbra-sovereign': 'Vaelmor Umbra Sovereign.png',
  'inf-bgi-midplace-apocalypse': 'Midplace Apocalypse.png',
  'btei-voids-reaping': 'Hollow Queen.png',
  'btei-eternal-vigil': 'Immortal Warden.png',
  'btei-sovereign-domain': 'Cherubim Sovereign.png',
  'btei-convergence-of-eternity': 'Eternal Seraph.png',
  'btei-temporal-ruin': 'The Time Eater.png',
  'btei-architects-manifold': 'The Void Architect.png',
  'btei-null-edict': 'Null Sovereign.png',
  'btei-omniscient-fracture': 'Shattered Oracle.png',
  'btei-colossus-advent': 'Abyssal Colossus.png',
  'btei-axiom-of-oblivion': 'Eternal Null.png',
  'btei-prismatic-blindwars-reliquary': 'Reliquary of Blind Wars.png',
  'inf-ash-kings-apocalypse': 'Ash Kings Apocalypse.png',
  'tbp-ser-scar-mantle-reclaimer': 'Scar-mantle Reclaimer.png',
  'tbp-angel-velmora-harrowed-crown': 'Velmora Crown of Harrowed Plains.png',
  // Snowbound Voltage Eternal Angels
  'sv-eternal-frost-charge': 'Frostborn Surge.png',
  'sv-eternal-aurora-battery': 'Aurora Nexus.png',
  'sv-eternal-glacier-signal': 'Glacier Beacon.png',
  'sv-eternal-white-static': 'White Requiem.png',
  'sv-eternal-sleet-choir': 'Blizzard Requiem.png',
  'sv-infinite-aurora-collapse': 'Aurora Singularity.png',
  'sv-infinite-black-ice-throne': 'Black Ice Dominion.png',
  'sv-infinite-crystal-storm': 'Crystal Maelstrom.png',
  'sv-infinite-neon-snowfall': 'Neon Deluge.png',
  // Reworked cherubim without dedicated exported PNGs yet: keep them on set-matched art.
  'cherubim-thornbound-null-thorn': 'Thornwake Ditch.png',
  'cherubim-thornbound-path-keeper': 'Spitebloom Sink.png',
  'cherubim-thornbound-vine-mantle': 'Thornwake Ditch.png',
  'cherubim-thornbound-trail-accelerator': 'Gallows Bramble.png',
  'cherubim-thornbound-growth-shell': 'Pale Vine Reliquary.png',
  'cherubim-thornbound-bramble-arbor': 'Funeral Hedgerow.png',
  'cherubim-thornbound-wildroot-ascension': 'Funeral Hedgerow.png',
  'cherubim-thornbound-eternal-roots': 'Cathedral of Splinters.png',
  'cherubim-mechanical-null-coil': 'Dreambreak Turbine.png',
  'cherubim-mechanical-strain-ward': 'White Iron Chorus.png',
  'cherubim-mechanical-gearbound-mantle': 'Dreambreak Turbine.png',
  'cherubim-mechanical-overclock-amplifier': 'Rust Halo Chamber.png',
  'cherubim-mechanical-dynamo-shell': 'Monolith Relay.png',
  'cherubim-mechanical-pulse-matrix': 'Cinder Protocol Engine.png',
  'cherubim-mechanical-infinite-rhythm': 'Cinder Protocol Engine.png',
  'cherubim-mechanical-core-ascension': 'Blackglass Reactor Crown.png',
  'cherubim-prismatic-null-prism': 'Mirrorfield Locus.png',
  'cherubim-prismatic-light-echo': 'Mirrorfield Locus.png',
  'cherubim-prismatic-spectrum-veil': 'Fracture Veil.png',
  'cherubim-prismatic-radiance-ward': 'Buried Prism Cache.png',
  'cherubim-prismatic-harmony-shell': 'Canopy Eclipse Knot.png',
  'cherubim-prismatic-convergence-beacon': 'Century Blind Scar.png',
  'cherubim-prismatic-luminous-ascent': 'Century Blind Scar.png',
  'cherubim-prismatic-absolute-light': 'Whitebeam Confluence.png',
  'cherubim-dark-null-obsidian': 'Ashen Court Sigil.png',
  'cherubim-dark-rose-shroud': 'Glassrose Pyre.png',
  'cherubim-dark-void-veil': 'Glassrose Pyre.png',
  'cherubim-dark-chromatic-ward': 'Chromatic Crater.png',
  'cherubim-dark-collision-shell': 'Veilplane Fissure.png',
  'cherubim-dark-grieffire-ascent': 'Veth Serath Midplace.png',
  'cherubim-dark-mourning-mantle': 'Veth Serath Midplace.png',
  'cherubim-dark-abyss-throne': 'Vaelthorax Grieffire.png',
  // Glass Absolute Infinite cards with punctuation in their names
  // (file name intentionally drops the comma  ECSS multi-layer background-image
  // parsing in Chromium can mishandle %2C inside comma-separated url() lists,
  // which would otherwise show only the Infinite card-back as a fallback)
  'ga-inf-yreth-prism-at-center': 'Yreth Prism at Center.png',
  // Age of the Butterfly cards whose name contains punctuation the on-disk
  // PNG drops (commas/hyphens stripped to avoid the same CSS url() pitfall).
  'bf-oph-copper-green-trail': 'Copper Green Trail.png',
  'bf-inf-mirrorface-voidface': 'Mirrorface Voidface.png',
  'bf-inf-velkoreth-the-unfolding': 'Velkoreth the Unfolding.png',
  // Eternal Seas cards whose name contains a comma the on-disk PNG drops.
  'es-angel-crowned-one-ruby': 'Crowned One Ruby Margin.png',
  'es-angel-crowned-one-azure': 'Crowned One Azure Margin.png',
  'es-angel-veleth-undying-water': 'Veleth Undying Water.png',
  'es-et-aeveleth-first-drift': 'Aeveleth First Drift.png',
  'es-inf-aeveleth-undying-revision': 'Aeveleth Undying Revision.png',
  // Abyssal Forge cards whose PNG filename diverges from the card name
  // (punctuation dropped, or typo'd source filename preserved).
  'af-ser-helith-nun-saffron-eel': 'Helith-nun Saffron Eel.png',
  'af-inf-ouroglas-uncoiled': 'Ourglas Uncoiled.png',
  "af-oph-ouroglas-discarded-scale": "Ouroglas's Discarded Scale.png",
  'af-angel-crowned-one-sapphire': 'Crowned One, Sapphire Bellows.png',
  'af-angel-crowned-one-saffron': 'Crowned One, Saffron Coil.png',
  'af-ser-cerumel-verdant-anglerfish': 'Cerumel, The Verdant Anglerfish.png',
  'af-ser-ophrax-vermilion-kraken': 'Ophrax, The Vermilion Kraken.png',
  'af-ser-tessareth-opal-manta': 'Tessareth, The Opal Manta.png',
  'af-ser-vairoch-sapphire-bellows': 'Vairoch, The Sapphire Bellows.png',
};

function getSnowboundEternalFileName(card: CardDefinition): string {
  return CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
}

function getSnowboundBaseFileName(card: CardDefinition): string {
  return CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.artKey}.png`;
}

const CARD_BACK_ASSET_BY_ELEMENT: Partial<Record<string, { folder: string; file: string }>> = {
  Neutrality: { folder: 'neutrality', file: 'Neutrality Card Backing.png' },
  Fire: { folder: 'pyroabyss', file: 'Pyroabyss Card Back.png' },
  Light: { folder: 'heavenly-light', file: 'Heavenly Light Card Back.png' },
  Thornbound: { folder: 'thornbound-plains', file: 'Thornbound Plains Card Back.png' },
  Mechanical: { folder: 'mechanical-dreams', file: 'Mechanical Dreams Card Back.png' },
  SnowboundVoltage: { folder: 'snowbound-voltage', file: 'Snowbound Voltage Card Back.png' },
  Prismatic: { folder: 'prismatic-accord', file: 'Prismatic Accord Card Back.png' },
  GlassAbsolute: { folder: 'glass-absolute', file: 'Glass Absolute Card Back.png' },
  BlazingGarden: { folder: 'blazing-garden', file: 'Blazing Garden Card Back.png' },
  Butterfly: { folder: 'age-of-the-butterfly', file: 'Age of the Butterfly Card Back.png' },
  EternalSeas: { folder: 'eternal-seas', file: 'Eternal Seas Card Back.png' },
  AbyssalForge: { folder: 'abyssal-forge', file: 'Abyssal Forge Card Back.png' },
  DeathFlamedHell: { folder: 'death-flamed-hell', file: 'Death-flamed Hell Card Back.png' },
  WishedUponAStar: { folder: 'wished-upon-a-star', file: 'Wished Upon A Star Card Back.png' },
  Dark: { folder: 'black-glass-inferno', file: 'Black Glass Inferno Card Back.png' },
};

const INFINITE_CARD_BACK_ASSET = { folder: 'infinite', file: 'Infinity Cards Card Back.png' };
const ETERNAL_CARD_BACK_ASSET = { folder: 'eternal', file: 'Eternal Cards Card Back.png' };

const BTEI_FOLDER_BY_PREFIX: ReadonlyArray<{ prefix: string; folder: string }> = [
  { prefix: 'btei-bgi-', folder: 'black-glass-inferno' },
  { prefix: 'btei-prismatic-', folder: 'prismatic-accord' },
  { prefix: 'btei-mech-', folder: 'mechanical-dreams' },
  { prefix: 'btei-thornbound-', folder: 'thornbound-plains' },
  { prefix: 'btei-light-', folder: 'heavenly-light' },
  { prefix: 'btei-pyroabyss-', folder: 'pyroabyss' },
  { prefix: 'btei-neutrality-', folder: 'neutrality' },
];

function getBteiFolder(definitionId: string): string | null {
  if (!definitionId.startsWith('btei-')) return null;
  const mapped = BTEI_FOLDER_BY_PREFIX.find(entry => definitionId.startsWith(entry.prefix));
  return mapped?.folder ?? 'neutrality';
}

function getCardBackUrl(card: CardDefinition | null | undefined): string | null {
  if (!card) return null;

  if (card.definitionId.startsWith('sv-')) {
    const { folder, file } = CARD_BACK_ASSET_BY_ELEMENT.SnowboundVoltage!;
    return `${CARD_BACKGROUND_ROOT}/${folder}/${encodeURI(file)}`;
  }

  if (card.rarity === 'Infinite') {
    return `${CARD_BACKGROUND_ROOT}/${INFINITE_CARD_BACK_ASSET.folder}/${encodeURI(INFINITE_CARD_BACK_ASSET.file)}`;
  }

  if (card.rarity === 'Eternal') {
    return `${CARD_BACKGROUND_ROOT}/${ETERNAL_CARD_BACK_ASSET.folder}/${encodeURI(ETERNAL_CARD_BACK_ASSET.file)}`;
  }

  const cardBackKey = card.element;
  const asset = CARD_BACK_ASSET_BY_ELEMENT[cardBackKey];
  if (!asset) return null;
  return `${CARD_BACKGROUND_ROOT}/${asset.folder}/${encodeURI(asset.file)}`;
}

function hashDefinitionId(definitionId: string): number {
  let hash = 0;
  for (let i = 0; i < definitionId.length; i++) {
    hash = ((hash << 5) - hash) + definitionId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInfiniteGlassAnimationStyle(): CSSProperties {
  return {
    animationName: 'infiniteGlassShift, infiniteGlassPulse, infiniteGlassGlint',
    animationDuration: '6.498s, 6.498s, 6.498s',
    animationTimingFunction: 'ease-in-out, ease-in-out, ease-in-out',
    animationIterationCount: 'infinite, infinite, infinite',
    animationDirection: 'alternate, alternate, alternate',
  };
}

function getEternalGlassAnimationStyle(): CSSProperties {
  return {
    animationName: 'eternalGlassShift, eternalGlassPulse, eternalGlassGlint',
    animationDuration: '6.498s, 6.498s, 6.498s',
    animationTimingFunction: 'ease-in-out, ease-in-out, ease-in-out',
    animationIterationCount: 'infinite, infinite, infinite',
    animationDirection: 'alternate, alternate, alternate',
  };
}

function getHolofoilAnimationStyle(definitionId: string): CSSProperties {
  const hash = hashDefinitionId(definitionId);
  const stagger = -((hash % 11) * 0.23);

  return {
    animationName: 'bossHoloShift, bossHoloPulse, bossHoloGlint',
    animationDuration: '8.2s, 8.2s, 8.2s',
    animationTimingFunction: 'ease-in-out, ease-in-out, ease-in-out',
    animationIterationCount: 'infinite, infinite, infinite',
    animationDirection: 'alternate, alternate, alternate',
    animationDelay: `${stagger}s, ${stagger * 0.8}s, ${stagger * 1.2}s`,
  };
}

function isTranscendentCard(card: CardDefinition | null | undefined): boolean {
  if (!card) return false;
  // Keep rarity visuals authoritative: Infinity/Eternal cards should never render
  // with Transcendent red framing, even if their definitionId uses tx-.
  if (card.rarity === 'Infinite' || card.rarity === 'Eternal') return false;
  return card.definitionId.startsWith('tx-');
}

function getTranscendentFoilAnimationStyle(definitionId: string): CSSProperties {
  const hash = hashDefinitionId(definitionId);
  const stagger = -((hash % 13) * 0.19);

  return {
    animationName: 'transcendentFoilShift, transcendentFoilPulse, transcendentFoilGlint',
    animationDuration: '7.6s, 7.6s, 7.6s',
    animationTimingFunction: 'ease-in-out, ease-in-out, ease-in-out',
    animationIterationCount: 'infinite, infinite, infinite',
    animationDirection: 'alternate, alternate, alternate',
    animationDelay: `${stagger}s, ${stagger * 0.74}s, ${stagger * 1.12}s`,
  };
}

function mergeAnimationStyles(...styles: CSSProperties[]): CSSProperties {
  const valid = styles.filter(style => typeof style.animationName === 'string' && style.animationName.length > 0);
  if (valid.length === 0) return {};
  if (valid.length === 1) return valid[0];

  const names: string[] = [];
  const durations: string[] = [];
  const timings: string[] = [];
  const counts: string[] = [];
  const directions: string[] = [];
  const delays: string[] = [];

  const splitList = (value: unknown, fallback: string): string[] => {
    if (typeof value !== 'string' || value.length === 0) return [];
    return value.split(',').map(v => v.trim()).map(v => (v.length > 0 ? v : fallback));
  };

  for (const style of valid) {
    const localNames = splitList(style.animationName, '').filter(Boolean);
    const localDurations = splitList(style.animationDuration, '6s');
    const localTimings = splitList(style.animationTimingFunction, 'ease-in-out');
    const localCounts = splitList(style.animationIterationCount, 'infinite');
    const localDirections = splitList(style.animationDirection, 'alternate');
    const localDelays = splitList(style.animationDelay, '0s');

    localNames.forEach((name, index) => {
      names.push(name);
      durations.push(localDurations[index] ?? localDurations[localDurations.length - 1] ?? '6s');
      timings.push(localTimings[index] ?? localTimings[localTimings.length - 1] ?? 'ease-in-out');
      counts.push(localCounts[index] ?? localCounts[localCounts.length - 1] ?? 'infinite');
      directions.push(localDirections[index] ?? localDirections[localDirections.length - 1] ?? 'alternate');
      delays.push(localDelays[index] ?? localDelays[localDelays.length - 1] ?? '0s');
    });
  }

  return {
    animationName: names.join(', '),
    animationDuration: durations.join(', '),
    animationTimingFunction: timings.join(', '),
    animationIterationCount: counts.join(', '),
    animationDirection: directions.join(', '),
    animationDelay: delays.join(', '),
  };
}

const DENSE_CARD_FACE_STYLE_CACHE = new Map<string, CSSProperties>();
const DENSE_CARD_FACE_STYLE_CACHE_VERSION = 'dense-face-v4-transcedence-precedence';

function getDenseCardFaceCacheKey(
  card: CardDefinition | null | undefined,
  finish: CardFinish,
  faceState: CardFaceState,
): string {
  if (!card) return `${DENSE_CARD_FACE_STYLE_CACHE_VERSION}::null::${finish}::${faceState}::${warmTheme.surfaceStrong}`;
  return [
    DENSE_CARD_FACE_STYLE_CACHE_VERSION,
    card.definitionId,
    finish,
    faceState,
    card.rarity,
    getCardThemePackForElement(card.element),
    warmTheme.surfaceStrong,
  ].join('::');
}

export function getCardBackgroundUrl(card: CardDefinition | null | undefined): string | null {
  if (!card) return null;

  if (card.definitionId.startsWith('sv-infinite-')) {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/infinite/${encodeURI(fileName)}`;
  }

  if (card.definitionId.startsWith('sv-eternal-')) {
    const fileName = getSnowboundEternalFileName(card);
    return `${CARD_BACKGROUND_ROOT}/snowbound-voltage/${encodeURI(fileName)}`;
  }

  if (card.definitionId.startsWith('sv-')) {
    const fileName = getSnowboundBaseFileName(card);
    return `${CARD_BACKGROUND_ROOT}/snowbound-voltage/${encodeURI(fileName)}`;
  }

  if (card.element === 'GlassAbsolute') {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/glass-absolute/${encodeURI(fileName)}`;
  }

  if (card.element === 'BlazingGarden') {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/blazing-garden/${encodeURI(fileName)}`;
  }

  if (card.element === 'Butterfly') {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/age-of-the-butterfly/${encodeURI(fileName)}`;
  }

  if (card.element === 'EternalSeas') {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/eternal-seas/${encodeURI(fileName)}`;
  }

  if (card.element === 'AbyssalForge') {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/abyssal-forge/${encodeURI(fileName)}`;
  }

  if (card.element === 'DeathFlamedHell') {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/death-flamed-hell/${encodeURI(fileName)}`;
  }

  if (card.element === 'WishedUponAStar') {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/wished-upon-a-star/${encodeURI(fileName)}`;
  }

  const bteiFolder = getBteiFolder(card.definitionId);
  if (bteiFolder) {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/${bteiFolder}/${encodeURI(fileName)}`;
  }

  if (card.definitionId.startsWith('inf-bgi-')) {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/black-glass-inferno/${encodeURI(fileName)}`;
  }

  if (card.rarity === 'Infinite') {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/infinite/${encodeURI(fileName)}`;
  }

  const folder = CARD_BACKGROUND_FOLDERS[card.element];
  if (!folder) return null;

  const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
  return `${CARD_BACKGROUND_ROOT}/${folder}/${encodeURI(fileName)}`;
}

export function getCardFaceBackgroundStyle(card: CardDefinition | null | undefined, finish: CardFinish = 'normal', faceState: CardFaceState = 'front'): CSSProperties {
  const theme = getCardThemePackStyle(card);
  const isBackFace = faceState === 'back';
  const isTranscendent = isTranscendentCard(card);
  const isInfinite = card?.rarity === 'Infinite';
  const isEternal = card?.rarity === 'Eternal';
  if (isBackFace) {
    const backUrl = getCardBackUrl(card);
    return {
      backgroundImage: backUrl ? `url("${backUrl}")` : theme.baseGradient,
      backgroundColor: warmTheme.surfaceStrong,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      boxShadow: cardFacePalette.shadow,
    };
  }
  const infiniteGlassStyle = isInfinite ? getInfiniteGlassAnimationStyle() : {};
  const eternalGlassStyle = isEternal ? getEternalGlassAnimationStyle() : {};
  const transcendentGlassStyle = isTranscendent && card ? getTranscendentFoilAnimationStyle(card.definitionId) : {};

  const holofoilStyle = finish === 'holo' && card
    ? getHolofoilAnimationStyle(card.definitionId)
    : {};

  const tierAnimationStyle = isTranscendent
    ? transcendentGlassStyle
    : isInfinite
      ? infiniteGlassStyle
      : isEternal
        ? eternalGlassStyle
        : {};
  const animStyle = mergeAnimationStyles(tierAnimationStyle, holofoilStyle);

  const imageUrl = getCardBackgroundUrl(card);
  const fallbackImageUrl = getCardBackUrl(card);

  const infiniteFrameLayer =
    'linear-gradient(180deg, rgba(4,4,8,0.96) 0%, rgba(10,10,14,0.95) 8%, rgba(0,0,0,0) 14%, rgba(0,0,0,0) 86%, rgba(10,10,14,0.95) 92%, rgba(4,4,8,0.96) 100%)';
  const eternalFrameLayer =
    'linear-gradient(180deg, rgba(20,10,34,0.97) 0%, rgba(30,16,50,0.96) 8%, rgba(176,42,58,0.32) 10%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 84%, rgba(176,42,58,0.36) 90%, rgba(30,16,50,0.96) 92%, rgba(20,10,34,0.97) 100%)';

  const infiniteLayers = [
    'linear-gradient(125deg, rgba(255,255,255,0.22) 0%, rgba(196,222,255,0.12) 24%, rgba(255,255,255,0.05) 48%, rgba(24,28,38,0.14) 74%, rgba(255,255,255,0.14) 100%)',
    'radial-gradient(ellipse at 22% 14%, rgba(255,255,255,0.24) 0%, rgba(190,220,255,0.12) 22%, rgba(0,0,0,0) 48%)',
    'linear-gradient(215deg, rgba(255,255,255,0) 22%, rgba(255,255,255,0.28) 44%, rgba(255,255,255,0.08) 56%, rgba(255,255,255,0) 72%)',
    'linear-gradient(180deg, rgba(10,10,14,0.08) 0%, rgba(10,10,14,0.02) 52%, rgba(10,10,14,0.12) 100%)',
  ];

  const eternalLayers = [
    'linear-gradient(126deg, rgba(146, 32, 58, 0.24) 0%, rgba(230, 168, 204, 0.12) 24%, rgba(104, 38, 88, 0.08) 44%, rgba(10,8,16,0.36) 68%, rgba(220, 156, 198, 0.16) 100%)',
    'radial-gradient(ellipse at 24% 18%, rgba(242, 184, 212, 0.22) 0%, rgba(170, 68, 124, 0.12) 22%, rgba(0,0,0,0) 48%)',
    'linear-gradient(215deg, rgba(255,255,255,0) 22%, rgba(236, 174, 208, 0.24) 44%, rgba(96, 34, 84, 0.12) 56%, rgba(255,255,255,0) 72%)',
    'linear-gradient(180deg, rgba(10,8,14,0.1) 0%, rgba(12,10,16,0.03) 52%, rgba(10,8,14,0.12) 100%)',
  ];

  const transcendentFrameLayer =
    'linear-gradient(180deg, rgba(62, 0, 18, 0.98) 0%, rgba(118, 8, 30, 0.95) 8%, rgba(255, 245, 248, 0.24) 10%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 84%, rgba(255, 214, 226, 0.28) 90%, rgba(118, 8, 30, 0.95) 92%, rgba(62, 0, 18, 0.98) 100%)';

  const transcendentLayers = [
    'linear-gradient(118deg, rgba(255,255,255,0.22) 0%, rgba(255, 222, 232, 0.18) 18%, rgba(255, 132, 164, 0.18) 42%, rgba(98, 0, 24, 0.2) 70%, rgba(255, 240, 245, 0.16) 100%)',
    'radial-gradient(ellipse at 22% 14%, rgba(255,255,255,0.26) 0%, rgba(255, 214, 226, 0.16) 18%, rgba(255,255,255,0) 48%)',
    'radial-gradient(circle at 34% 28%, rgba(255,255,255,0.9) 0 1.4px, rgba(255, 220, 232, 0.55) 1.4px 2.2px, rgba(255,255,255,0) 2.4px)',
    'linear-gradient(212deg, rgba(255,255,255,0) 22%, rgba(255, 244, 248, 0.26) 44%, rgba(255, 176, 202, 0.14) 58%, rgba(255,255,255,0) 74%)',
    'linear-gradient(180deg, rgba(18, 0, 6, 0.08) 0%, rgba(18, 0, 6, 0.02) 52%, rgba(18, 0, 6, 0.12) 100%)',
  ];

  const holoLayers = [
    'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.04) 24%, rgba(255,255,255,0.34) 49%, rgba(255,255,255,0.07) 64%, rgba(255,255,255,0) 100%)',
    'linear-gradient(108deg, rgba(255, 78, 156, 0.4) 0%, rgba(240, 82, 118, 0.36) 16%, rgba(255, 158, 88, 0.24) 30%, rgba(122, 200, 255, 0.24) 46%, rgba(170, 122, 255, 0.4) 68%, rgba(126, 78, 224, 0.42) 84%, rgba(255, 88, 162, 0.36) 100%)',
    'linear-gradient(72deg, rgba(255,255,255,0) 12%, rgba(255,255,255,0.16) 34%, rgba(255,255,255,0.04) 46%, rgba(255,255,255,0.22) 58%, rgba(255,255,255,0) 76%)',
    'linear-gradient(155deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.2) 20%, rgba(255,255,255,0.03) 42%, rgba(255,255,255,0.14) 66%, rgba(255,255,255,0.04) 100%)',
    'linear-gradient(180deg, rgba(26, 18, 12, 0.1) 0%, rgba(26, 18, 12, 0.03) 55%, rgba(26, 18, 12, 0.08) 100%)',
  ];

  const frameLayers = isTranscendent ? [transcendentFrameLayer] : isInfinite ? [infiniteFrameLayer] : isEternal ? [eternalFrameLayer] : [];
  const overlayCoreLayers = isTranscendent ? transcendentLayers : isInfinite ? infiniteLayers : isEternal ? eternalLayers : (finish === 'holo' ? holoLayers : []);
  const overlayLayers = [...frameLayers, ...overlayCoreLayers];

  const infiniteRibbon = [
    'linear-gradient(180deg, rgba(12,12,16,0.95) 0%, rgba(24,24,30,0.94) 100%)',
    'repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18) 0 1px, rgba(255,255,255,0) 1px 8px, rgba(255,255,255,0.1) 8px 9px, rgba(255,255,255,0) 9px 16px)',
  ].join(', ');
  const infinitePanel = [
    'linear-gradient(180deg, rgba(10,10,14,0.94) 0%, rgba(20,20,26,0.94) 100%)',
    'repeating-radial-gradient(circle at 54% 46%, rgba(255,255,255,0.12) 0 1px, rgba(255,255,255,0) 1px 7px, rgba(255,255,255,0.08) 7px 8px, rgba(255,255,255,0) 8px 14px)',
  ].join(', ');

  const themeVars: CSSProperties & Record<string, string> = {
    '--card-face-text': isInfinite
      ? 'rgba(244,246,255,0.96)'
      : isTranscendent
        ? 'rgba(255,246,249,0.97)'
      : isEternal
        ? 'rgba(246,230,248,0.96)'
        : CONSISTENT_CARD_TEXT,
    '--card-face-text-soft': isInfinite
      ? 'rgba(236,240,255,0.92)'
      : isTranscendent
        ? 'rgba(255,232,240,0.94)'
      : isEternal
        ? 'rgba(238,214,244,0.92)'
        : CONSISTENT_CARD_TEXT_SOFT,
    '--card-face-text-muted': isInfinite
      ? 'rgba(218,224,244,0.84)'
      : isTranscendent
        ? 'rgba(255,214,226,0.88)'
      : isEternal
        ? 'rgba(226,198,234,0.84)'
        : CONSISTENT_CARD_TEXT_MUTED,
    '--card-face-ribbon': isInfinite
      ? infiniteRibbon
      : isTranscendent
        ? 'linear-gradient(180deg, rgba(66, 0, 16, 0.97) 0%, rgba(122, 10, 34, 0.96) 100%), linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255, 214, 226, 0.12) 50%, rgba(255,255,255,0.06) 100%)'
      : isEternal
        ? 'linear-gradient(180deg, rgba(16, 6, 34, 0.98) 0%, rgba(36, 14, 68, 0.97) 100%), linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(180, 32, 66, 0.16) 48%, rgba(255,255,255,0.02) 100%)'
        : theme.ribbon,
    '--card-face-panel': isInfinite
      ? infinitePanel
      : isTranscendent
        ? 'linear-gradient(180deg, rgba(54, 0, 14, 0.96) 0%, rgba(102, 8, 30, 0.95) 100%), linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255, 204, 220, 0.08) 50%, rgba(255,255,255,0.03) 100%)'
      : isEternal
        ? 'linear-gradient(180deg, rgba(14, 6, 28, 0.97) 0%, rgba(28, 12, 54, 0.96) 100%), linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(188, 28, 62, 0.14) 50%, rgba(255,255,255,0.02) 100%)'
        : theme.panel,
    '--card-face-border': isInfinite ? 'rgba(214,226,255,0.52)' : isTranscendent ? 'rgba(255, 126, 150, 0.72)' : isEternal ? 'rgba(210,92,132,0.56)' : theme.border,
    '--card-face-shadow': theme.shadow,
    '--card-face-ribbon-animation-name': isEternal && !isTranscendent ? 'eternalBarCrimsonPulse' : 'none',
    '--card-face-ribbon-animation-duration': isEternal && !isTranscendent ? '4.1s' : '0s',
    '--card-face-panel-animation-name': isEternal && !isTranscendent ? 'eternalBarCrimsonPulse' : 'none',
    '--card-face-panel-animation-duration': isEternal && !isTranscendent ? '4.1s' : '0s',
    '--card-face-animation-timing': 'ease-in-out',
    '--card-face-animation-iteration': 'infinite',
    '--card-face-animation-direction': 'alternate',
  };
  const tintOverlay = [
    `radial-gradient(circle at 78% 14%, ${theme.highlight} 0%, rgba(255,255,255,0) 36%)`,
    `linear-gradient(135deg, rgba(255,255,255,0) 25%, ${theme.highlight} 50%, rgba(255,255,255,0) 78%)`,
  ];
  const imageLayers: string[] = [];
  if (imageUrl) imageLayers.push(`url("${imageUrl}")`);
  if (fallbackImageUrl && fallbackImageUrl !== imageUrl) imageLayers.push(`url("${fallbackImageUrl}")`);

  const layerCount = overlayLayers.length + tintOverlay.length + (imageLayers.length > 0 ? imageLayers.length : 1);
  const layerPositions = Array(layerCount).fill('center').join(', ');
  const layerSizes = Array(layerCount).fill('cover').join(', ');
  const baseBlendModes = [
    ...overlayLayers.map((_, index) => {
      if (index < frameLayers.length) return 'normal';
      const coreIndex = index - frameLayers.length;
      return coreIndex === 0 ? 'screen' : coreIndex === overlayCoreLayers.length - 1 ? 'multiply' : 'overlay';
    }),
    'screen',
    'overlay',
  ];
  const layerBlendModes = [
    ...baseBlendModes,
    ...(imageLayers.length > 0 ? imageLayers.map(() => 'normal') : ['normal']),
  ].join(', ');

  if (imageLayers.length === 0) {
    const baseGrad = isInfinite
      ? 'linear-gradient(180deg, rgba(18,18,22,0.97) 0%, rgba(38,38,46,0.97) 100%)'
      : isEternal
        ? 'linear-gradient(180deg, rgba(8,8,12,0.98) 0%, rgba(18,10,12,0.98) 54%, rgba(8,8,12,0.98) 100%)'
      : theme.baseGradient;
    const showOverlay = overlayLayers.length > 0;
    return {
      ...themeVars,
      backgroundImage: showOverlay
        ? [...overlayLayers, ...tintOverlay, baseGrad].join(', ')
        : [...tintOverlay, baseGrad].join(', '),
      backgroundColor: isInfinite ? '#0e0e12' : isEternal ? '#0b090c' : warmTheme.surfaceStrong,
      backgroundPosition: layerPositions,
      backgroundSize: layerSizes,
      backgroundRepeat: 'no-repeat',
      backgroundBlendMode: layerBlendModes,
      ...animStyle,
    };
  }

  const showOverlay = overlayLayers.length > 0;
  return {
    ...themeVars,
    backgroundImage: showOverlay
      ? [...overlayLayers, ...tintOverlay, ...imageLayers].join(', ')
      : [...tintOverlay, ...imageLayers].join(', '),
    backgroundColor: isInfinite ? '#0e0e12' : isEternal ? '#0b090c' : warmTheme.surfaceStrong,
    backgroundPosition: layerPositions,
    backgroundSize: layerSizes,
    backgroundRepeat: 'no-repeat',
    backgroundBlendMode: layerBlendModes,
    ...animStyle,
  };
}

export function getDenseCardFaceBackgroundStyle(
  card: CardDefinition | null | undefined,
  finish: CardFinish = 'normal',
  faceState: CardFaceState = 'front',
): CSSProperties {
  const cacheKey = getDenseCardFaceCacheKey(card, finish, faceState);
  const cached = DENSE_CARD_FACE_STYLE_CACHE.get(cacheKey);
  if (cached) return cached;

  const theme = getCardThemePackStyle(card);
  const isBackFace = faceState === 'back';
  const isTranscendent = isTranscendentCard(card);
  const isInfinite = card?.rarity === 'Infinite';
  const isEternal = card?.rarity === 'Eternal';
  const tierAnimationStyle = isTranscendent && card
    ? getTranscendentFoilAnimationStyle(card.definitionId)
    : isInfinite
      ? getInfiniteGlassAnimationStyle()
      : isEternal
        ? getEternalGlassAnimationStyle()
        : {};
  const holofoilAnimationStyle = finish === 'holo' && card
    ? getHolofoilAnimationStyle(card.definitionId)
    : {};
  const animStyle = mergeAnimationStyles(tierAnimationStyle, holofoilAnimationStyle);

  if (isBackFace) {
    const backStyle = getCardBackBackgroundStyle(card, { dimmed: false });
    const style: CSSProperties = {
      ...backStyle,
      backgroundColor: warmTheme.surfaceStrong,
      boxShadow: cardFacePalette.shadow,
    };
    DENSE_CARD_FACE_STYLE_CACHE.set(cacheKey, style);
    return style;
  }

  const imageUrl = getCardBackgroundUrl(card);
  const fallbackImageUrl = getCardBackUrl(card);
  const imageLayers: string[] = [];
  if (imageUrl) imageLayers.push(`url("${imageUrl}")`);
  if (fallbackImageUrl && fallbackImageUrl !== imageUrl) imageLayers.push(`url("${fallbackImageUrl}")`);

  const tintLayers = [
    `radial-gradient(circle at 78% 14%, ${theme.highlight} 0%, rgba(255,255,255,0) 38%)`,
  ];

  const rarityFrameOverlay = isTranscendent
    ? 'linear-gradient(180deg, rgba(62, 0, 18, 0.98) 0%, rgba(118, 8, 30, 0.95) 8%, rgba(255, 238, 244, 0.18) 10%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 84%, rgba(255, 214, 226, 0.2) 90%, rgba(118, 8, 30, 0.95) 92%, rgba(62, 0, 18, 0.98) 100%)'
    : isInfinite
    ? 'linear-gradient(180deg, rgba(4,4,8,0.96) 0%, rgba(10,10,14,0.95) 8%, rgba(0,0,0,0) 14%, rgba(0,0,0,0) 86%, rgba(10,10,14,0.95) 92%, rgba(4,4,8,0.96) 100%)'
    : isEternal
      ? 'linear-gradient(180deg, rgba(20,10,34,0.97) 0%, rgba(30,16,50,0.96) 8%, rgba(176,42,58,0.32) 10%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 84%, rgba(176,42,58,0.36) 90%, rgba(30,16,50,0.96) 92%, rgba(20,10,34,0.97) 100%)'
      : null;

  const rarityToneOverlay = isTranscendent
    ? 'linear-gradient(116deg, rgba(255,255,255,0.18) 0%, rgba(255, 224, 234, 0.18) 24%, rgba(255, 120, 154, 0.16) 50%, rgba(108, 0, 24, 0.18) 76%, rgba(255, 238, 244, 0.14) 100%)'
    : isInfinite
    ? 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(196,222,255,0.08) 34%, rgba(20,24,36,0.14) 100%)'
    : isEternal
      ? 'linear-gradient(135deg, rgba(184,78,124,0.26) 0%, rgba(124,34,94,0.18) 36%, rgba(18,10,28,0.24) 100%)'
      : finish === 'holo'
        ? 'linear-gradient(112deg, rgba(255, 84, 160, 0.3) 0%, rgba(255, 140, 104, 0.22) 16%, rgba(206, 96, 255, 0.28) 38%, rgba(106, 72, 224, 0.26) 56%, rgba(168, 110, 255, 0.3) 78%, rgba(255, 102, 170, 0.28) 100%)'
        : null;

  const sparkleOverlay = isTranscendent
    ? 'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.92) 0 1px, rgba(255, 224, 236, 0.6) 1px 2px, rgba(255,255,255,0) 2.2px)'
    : finish === 'holo'
      ? 'radial-gradient(ellipse at 18% 16%, rgba(255,255,255,0.3) 0%, rgba(255, 230, 210, 0.18) 20%, rgba(214, 230, 255, 0.1) 34%, rgba(255,255,255,0) 60%)'
    : null;

  const holoSheenOverlay = !isTranscendent && !isInfinite && !isEternal && finish === 'holo'
    ? 'linear-gradient(156deg, rgba(255,255,255,0) 14%, rgba(255,255,255,0.22) 32%, rgba(255,255,255,0.06) 46%, rgba(255,255,255,0.18) 62%, rgba(255,255,255,0.03) 76%, rgba(255,255,255,0) 88%)'
    : null;

  const backgroundLayers = [
    ...(rarityFrameOverlay ? [rarityFrameOverlay] : []),
    ...(rarityToneOverlay ? [rarityToneOverlay] : []),
    ...(sparkleOverlay ? [sparkleOverlay] : []),
    ...(holoSheenOverlay ? [holoSheenOverlay] : []),
    ...tintLayers,
    ...(imageLayers.length > 0 ? imageLayers : [theme.baseGradient]),
  ];

  const backgroundBlendMode = [
    ...(rarityFrameOverlay ? ['normal'] : []),
    ...(rarityToneOverlay ? [finish === 'holo' && !isTranscendent && !isInfinite && !isEternal ? 'overlay' : 'screen'] : []),
    ...(sparkleOverlay ? ['screen'] : []),
    ...(holoSheenOverlay ? ['soft-light'] : []),
    'overlay',
    ...(imageLayers.length > 0 ? imageLayers.map(() => 'normal') : ['normal']),
  ].join(', ');

  const style: CSSProperties = {
    backgroundImage: backgroundLayers.join(', '),
    backgroundColor: warmTheme.surfaceStrong,
    backgroundPosition: Array(backgroundLayers.length).fill('center').join(', '),
    backgroundSize: Array(backgroundLayers.length).fill('cover').join(', '),
    backgroundRepeat: 'no-repeat',
    backgroundBlendMode,
    boxShadow: cardFacePalette.shadow,
    '--card-face-text': isInfinite
      ? 'rgba(244,246,255,0.96)'
      : isTranscendent
        ? 'rgba(255,246,249,0.97)'
      : isEternal
        ? 'rgba(246,230,248,0.96)'
        : CONSISTENT_CARD_TEXT,
    '--card-face-text-soft': isInfinite
      ? 'rgba(236,240,255,0.92)'
      : isTranscendent
        ? 'rgba(255,232,240,0.94)'
      : isEternal
        ? 'rgba(238,214,244,0.92)'
        : CONSISTENT_CARD_TEXT_SOFT,
    '--card-face-text-muted': isInfinite
      ? 'rgba(218,224,244,0.84)'
      : isTranscendent
        ? 'rgba(255,214,226,0.88)'
      : isEternal
        ? 'rgba(226,198,234,0.84)'
        : CONSISTENT_CARD_TEXT_MUTED,
    '--card-face-ribbon': isInfinite
      ? 'linear-gradient(180deg, rgba(12,12,16,0.95) 0%, rgba(24,24,30,0.94) 100%)'
      : isTranscendent
        ? 'linear-gradient(180deg, rgba(66, 0, 16, 0.97) 0%, rgba(122, 10, 34, 0.96) 100%), linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255, 214, 226, 0.12) 50%, rgba(255,255,255,0.06) 100%)'
      : isEternal
        ? 'linear-gradient(180deg, rgba(16, 6, 34, 0.98) 0%, rgba(36, 14, 68, 0.97) 100%), linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(180, 32, 66, 0.16) 48%, rgba(255,255,255,0.02) 100%)'
      : theme.ribbon,
    '--card-face-panel': isInfinite
      ? 'linear-gradient(180deg, rgba(10,10,14,0.94) 0%, rgba(20,20,26,0.94) 100%)'
      : isTranscendent
        ? 'linear-gradient(180deg, rgba(54, 0, 14, 0.96) 0%, rgba(102, 8, 30, 0.95) 100%), linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255, 204, 220, 0.08) 50%, rgba(255,255,255,0.03) 100%)'
      : isEternal
        ? 'linear-gradient(180deg, rgba(14, 6, 28, 0.97) 0%, rgba(28, 12, 54, 0.96) 100%), linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(188, 28, 62, 0.14) 50%, rgba(255,255,255,0.02) 100%)'
      : theme.panel,
    '--card-face-border': isInfinite ? 'rgba(214,226,255,0.52)' : isTranscendent ? 'rgba(255, 126, 150, 0.72)' : isEternal ? 'rgba(210,92,132,0.56)' : theme.border,
    '--card-face-shadow': theme.shadow,
    '--card-face-ribbon-animation-name': isEternal && !isTranscendent ? 'eternalBarCrimsonPulse' : 'none',
    '--card-face-ribbon-animation-duration': isEternal && !isTranscendent ? '4.1s' : '0s',
    '--card-face-panel-animation-name': isEternal && !isTranscendent ? 'eternalBarCrimsonPulse' : 'none',
    '--card-face-panel-animation-duration': isEternal && !isTranscendent ? '4.1s' : '0s',
    '--card-face-animation-timing': 'ease-in-out',
    '--card-face-animation-iteration': 'infinite',
    '--card-face-animation-direction': 'alternate',
    ...animStyle,
  } as CSSProperties;

  DENSE_CARD_FACE_STYLE_CACHE.set(cacheKey, style);
  return style;
}

export function getCardFaceMetrics(variant: CardFaceVariant) {
  const base = CARD_FACE_METRICS_BASE[variant];
  return Object.defineProperties({} as CardFaceMetrics, {
    ribbonPadding: { enumerable: true, get: () => base.ribbonPadding },
    panelPadding: { enumerable: true, get: () => base.panelPadding },
    typeSize: { enumerable: true, get: () => Math.round(base.typeSize * getFontScale()) },
    nameSize: { enumerable: true, get: () => Math.round(base.nameSize * getFontScale()) },
    descSize: { enumerable: true, get: () => Math.round(base.descSize * getFontScale()) },
    descLineHeight: { enumerable: true, get: () => base.descLineHeight },
    descLines: { enumerable: true, get: () => base.descLines },
  });
}

export function getCardNameRibbonStyle(variant: CardFaceVariant): CSSProperties {
  return {
    alignSelf: 'stretch',
    background: cardFacePalette.ribbon,
    borderBottom: `1px solid ${cardFacePalette.border}`,
    boxShadow: '0 1px 0 rgba(255, 255, 255, 0.5)',
    color: cardFacePalette.text,
    padding: CARD_FACE_METRICS_BASE[variant].ribbonPadding,
    animationName: 'var(--card-face-ribbon-animation-name, none)',
    animationDuration: 'var(--card-face-ribbon-animation-duration, 0s)',
    animationTimingFunction: 'var(--card-face-animation-timing, ease-in-out)',
    animationIterationCount: 'var(--card-face-animation-iteration, infinite)',
    animationDirection: 'var(--card-face-animation-direction, alternate)',
  };
}

export function getCardRulesPanelStyle(variant: CardFaceVariant): CSSProperties {
  const maxHeights: Partial<Record<CardFaceVariant, string>> = {
    hand: '32%',
    pack: '34%',
    grid: '34%',
    board: '36%',
    boardMini: '36%',
  };
  return {
    alignSelf: 'stretch',
    background: cardFacePalette.panel,
    borderTop: `1px solid ${cardFacePalette.border}`,
    boxShadow: '0 -10px 22px rgba(68, 49, 32, 0.12)',
    color: cardFacePalette.textSoft,
    padding: CARD_FACE_METRICS_BASE[variant].panelPadding,
    marginTop: 'auto',
    maxHeight: maxHeights[variant],
    overflow: 'hidden',
    animationName: 'var(--card-face-panel-animation-name, none)',
    animationDuration: 'var(--card-face-panel-animation-duration, 0s)',
    animationTimingFunction: 'var(--card-face-animation-timing, ease-in-out)',
    animationIterationCount: 'var(--card-face-animation-iteration, infinite)',
    animationDirection: 'var(--card-face-animation-direction, alternate)',
  };
}

export function getCardArtTopBottomBorderOverlayStyle(accent = 'rgba(236, 214, 176, 0.9)'): CSSProperties {
  const accentSoft = 'rgba(236, 214, 176, 0.34)';
  const accentFade = 'rgba(236, 214, 176, 0.0)';
  const shadowSoft = 'rgba(28, 16, 9, 0.42)';

  return {
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    pointerEvents: 'none',
    backgroundImage: [
      `linear-gradient(90deg, ${accentFade} 0%, ${accentSoft} 18%, ${accent} 50%, ${accentSoft} 82%, ${accentFade} 100%)`,
      `linear-gradient(90deg, ${accentFade} 0%, ${accentSoft} 30%, ${accentSoft} 70%, ${accentFade} 100%)`,
      'radial-gradient(circle at 50% 0%, rgba(255, 242, 217, 0.55) 0 8px, rgba(255, 242, 217, 0) 13px)',
      `linear-gradient(90deg, ${accentFade} 0%, ${accentSoft} 18%, ${accent} 50%, ${accentSoft} 82%, ${accentFade} 100%)`,
      `linear-gradient(90deg, ${accentFade} 0%, ${accentSoft} 30%, ${accentSoft} 70%, ${accentFade} 100%)`,
      'radial-gradient(circle at 50% 100%, rgba(255, 242, 217, 0.55) 0 8px, rgba(255, 242, 217, 0) 13px)',
      `linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 20%, rgba(255, 255, 255, 0) 80%, ${shadowSoft} 100%)`,
    ].join(', '),
    backgroundSize: '100% 1px, 100% 7px, 26px 14px, 100% 1px, 100% 7px, 26px 14px, 100% 100%',
    backgroundPosition: 'center 8px, center 9px, center top, center calc(100% - 8px), center calc(100% - 15px), center bottom, center center',
    backgroundRepeat: 'no-repeat',
  };
}

export function getCardArtTopBottomBorderOverlayStyleForCard(card: CardDefinition | null | undefined): CSSProperties {
  if (card?.rarity === 'Infinite') {
    return getCardArtTopBottomBorderOverlayStyle('rgba(14, 14, 18, 0.98)');
  }
  if (card?.rarity === 'Eternal') {
    return {
      ...getCardArtTopBottomBorderOverlayStyle('rgba(42, 22, 72, 0.96)'),
      boxShadow: 'inset 0 11px 22px rgba(188,44,62,0.26), inset 0 -11px 22px rgba(188,44,62,0.26)',
    };
  }
  return getCardArtTopBottomBorderOverlayStyle();
}

export function getAdaptiveDescriptionMetrics(variant: CardFaceVariant, text: string) {
  const base = CARD_FACE_METRICS_BASE[variant];
  const length = text.trim().length;

  if (variant === 'hand') {
    if (length > 180) return { fontSize: base.descSize - 2.6, lineHeight: 1.12, lineClamp: 2 };
    if (length > 120) return { fontSize: base.descSize - 1.8, lineHeight: 1.16, lineClamp: 2 };
    if (length > 80) return { fontSize: base.descSize - 1.0, lineHeight: 1.2, lineClamp: 3 };
    return { fontSize: base.descSize, lineHeight: base.descLineHeight, lineClamp: base.descLines };
  }

  if (variant === 'board') {
    if (length > 170) return { fontSize: base.descSize - 1.3, lineHeight: 1.2, lineClamp: 2 };
    if (length > 110) return { fontSize: base.descSize - 0.8, lineHeight: 1.24, lineClamp: 2 };
    return { fontSize: base.descSize, lineHeight: 1.28, lineClamp: 2 };
  }

  if (variant === 'boardMini') {
    if (length > 130) return { fontSize: base.descSize - 1.1, lineHeight: 1.18, lineClamp: 2 };
    return { fontSize: base.descSize, lineHeight: 1.24, lineClamp: 2 };
  }

  return { fontSize: base.descSize, lineHeight: base.descLineHeight, lineClamp: base.descLines };
}

export function getCardBackBackgroundStyle(
  card: CardDefinition | null | undefined,
  options: { dimmed?: boolean } = {},
): CSSProperties {
  const imageUrl = getCardBackUrl(card);
  const dimmed = options.dimmed ?? true;
  const overlays = dimmed
    ? [
      'linear-gradient(180deg, rgba(7, 11, 16, 0.52) 0%, rgba(7, 11, 16, 0.72) 100%)',
      'linear-gradient(125deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 38%, rgba(0,0,0,0.22) 100%)',
    ]
    : [
      'linear-gradient(125deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 42%, rgba(0,0,0,0.12) 100%)',
    ];

  if (!imageUrl) {
    return {
      backgroundImage: [
        ...overlays,
        'linear-gradient(180deg, rgba(22, 28, 40, 0.98) 0%, rgba(14, 18, 28, 0.98) 100%)',
      ].join(', '),
      backgroundSize: dimmed ? 'cover, 170% 170%, cover' : '170% 170%, cover',
      backgroundPosition: dimmed ? 'center, center, center' : 'center, center',
      backgroundRepeat: 'no-repeat',
      backgroundBlendMode: dimmed ? 'multiply, soft-light, normal' : 'soft-light, normal',
    };
  }

  return {
    backgroundImage: [...overlays, `url("${imageUrl}")`].join(', '),
    backgroundSize: dimmed ? 'cover, 170% 170%, cover' : '170% 170%, cover',
    backgroundPosition: dimmed ? 'center, center, center' : 'center, center',
    backgroundRepeat: 'no-repeat',
    backgroundBlendMode: dimmed ? 'multiply, soft-light, normal' : 'soft-light, normal',
  };
}