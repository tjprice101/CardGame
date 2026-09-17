import type { CSSProperties } from 'react';
import type { CardDefinition, CardFaceState } from '@/types/cards';
import type { CardFinish } from '@/types/cards';
import { warmTheme } from '@/ui/theme';
import { getCardThemePackStyle, getFontScale } from '@/ui/preferences';

const CARD_BACKGROUND_ROOT = `${import.meta.env.BASE_URL}assets/card-backgrounds`;

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
  'enig-neutral-amplifier-of-the-void': 'Void Amplifier.png',
  'enig-neutral-null-born-surgeblade': 'Void Surge.png',
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
  // Legacy fallback relinks for currently unexported exact filenames.
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
  'btei-voids-reaping': 'The Harrowing of the Last Dawn.png',
  'btei-sovereign-domain': 'The Sovereign Quiet.png',
  'btei-convergence-of-eternity': 'The Convergence Beyond Time.png',
  'btei-temporal-ruin': 'The Ruin of Hours.png',
  'btei-null-edict': 'The Null Verdict.png',
  'btei-omniscient-fracture': 'The Fracture of Knowing.png',
  'btei-axiom-of-oblivion': 'The Axiom of Nothing.png',
  'btei-neutrality-void-throne': 'The Throne of Equilibrium.png',
  'btei-neutrality-prime-equilibrium': 'The Prime Judge of Silence.png',
  'enig-neutral-lumen-genesis': 'Lumen Genesis.png',
  'enig-neutral-null-catechism': 'Null Catechism.png',
  'enig-causality-horizon-weaver': 'Horizon Weaver.png',
  'enig-causality-ink-of-the-first-law': 'Ink of the First Law.png',
  'enig-causality-archive-of-unmade-stars': 'Archive of Unmade Stars.png',
  'enig-causality-black-sun-edict': 'Black Sun Edict.png',
  'enig-causality-axiom-beyond-the-horizon': 'Axiom Beyond the Horizon.png',
  'btei-causality-first-cause': 'The First Cause Unwritten.png',
  'btei-causality-last-horizon': 'The Last Horizon Remembered.png',
  'btei-causality-ink-sovereign': 'Sovereign Ink of the Black Sun.png',
  'btei-causality-chromatic-verdict': 'Chromatic Verdict of Elsewhen.png',
  'btei-causality-pearl-engine': 'Pearlescent Engine Beyond Sequence.png',
  'inf-causality-origin-script': 'Origin Script of Every Tomorrow.png',
  'inf-causality-chromatic-horizon': 'Chromatic Horizon Without End.png',
  'inf-causality-law-eater': 'Law-Eater of the Pearl Void.png',
  'inf-causality-archive-reborn': 'Archive Reborn in Chromatic Ink.png',
  'inf-causality-heart-beyond-all': 'Heart Beyond All Causality.png',
  'tx-neutral-starbound-glimmer': 'Starbound Glimmer.png',
  'tx-neutral-null-catalyst': 'Null Catalyst.png',
  'tx-neutral-void-reliquary': 'Void Reliquary.png',
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
  // Glass Absolute Angels — art live; overrides only where filename diverges from card.name
  'ga-angel-white-terminus': 'White Terminus Angel.png',
  // Yrethborn comma dropped: CSS multi-image url() lists can misparse %2C in filenames
  'ga-angel-yrethborn-absolute': 'Yrethborn The Absolute.png',
};

const NEW_NEUTRALITY_ART: Record<'light' | 'dark' | 'asa', string[]> = {
  light: [
    'Lumen Stag.png', 'Glasswing Sentinel.png', 'Dawn Warden.png', 'Nullfire Seraph.png', 'Axiom Herald.png',
    'Stillwater Colossus.png', 'Horizon Lion.png', 'Crown of Morning.png', 'Veilbreaker.png', 'First Radiance.png',
    'White Orchard Keeper.png', 'Paradox Knight.png', 'Solar Cantor.png', 'Pale Star Drake.png', 'Measure of Dawn.png',
    'Equilibrium Titan.png', 'Lucent Pilgrim.png', 'Ain-bound Guardian.png', 'Quiet Sun.png', 'Origin Bearer.png',
    'Mirror Saint.png', 'Lightwell Watcher.png', 'Celestial Null.png', 'Last Horizon.png',
  ],
  dark: [
    'Null Compass.png', 'Void Archive.png', 'Balance Engine.png', 'Equilibrium Map.png', 'Stillness Chapel.png',
    'Measured Path.png', 'Seraphic Recall.png', 'Neutral Cycle.png', 'Deep Survey.png', 'Paradox Lens.png',
    'Axiom Reservoir.png', 'Horizon Atlas.png', 'Silent Exchange.png', 'Glass Archive.png', 'Night Orchard.png',
    'Unlit Gate.png', 'Black Sun Reliquary.png', 'The Long Pause.png', 'Void Cartograph.png', 'Last Equation.png',
    'World Without Echo.png', 'Oblivion Key.png', 'The Patient Star.png', 'Absolute Archive.png',
  ],
  asa: [
    'The White Null.png', 'The Axiom Below.png', 'The Paradox Crown.png', 'The Stillbreak.png',
  ],
};

function getNewNeutralityArt(definitionId: string): string | undefined {
  const match = definitionId.match(/^(light|dark|ain-soph-aur)-neutrality-(\d+)$/);
  if (!match) return undefined;
  const kind = match[1] === 'ain-soph-aur' ? 'asa' : match[1] as 'light' | 'dark';
  return NEW_NEUTRALITY_ART[kind][Number(match[2]) - 1];
}

const CARD_BACK_ASSET_BY_ELEMENT: Partial<Record<string, { folder: string; file: string }>> = {
  Neutrality: { folder: 'neutrality', file: 'Neutrality Card Backing.png' },
  AinSophAur: { folder: 'neutrality', file: 'Neutrality Card Backing.png' },
};

const INFINITE_CARD_BACK_ASSET = { folder: 'infinite', file: 'Infinity Cards Card Back.png' };
const ETERNAL_CARD_BACK_ASSET = { folder: 'eternal', file: 'Eternal Cards Card Back.png' };
const ENIGMATIC_CARD_BACK_ASSET = { folder: 'neutrality', file: 'Enigmatic Card Backing.png' };
const TRANSCENDENT_CARD_BACK_ASSET = { folder: 'infinite', file: 'Infinity Cards Card Back.png' };

const BTEI_FOLDER_BY_PREFIX: ReadonlyArray<{ prefix: string; folder: string }> = [
  { prefix: 'btei-bgi-', folder: 'black-glass-inferno' },
  { prefix: 'btei-light-', folder: 'heavenly-light' },
  { prefix: 'btei-neutrality-', folder: 'neutrality' },
];

function getBteiFolder(definitionId: string): string | null {
  if (!definitionId.startsWith('btei-')) return null;
  const mapped = BTEI_FOLDER_BY_PREFIX.find(entry => definitionId.startsWith(entry.prefix));
  return mapped?.folder ?? 'neutrality';
}

function getCardBackUrl(card: CardDefinition | null | undefined): string | null {
  if (!card) return null;

  if (card.rarity === 'Infinite') {
    return `${CARD_BACKGROUND_ROOT}/${INFINITE_CARD_BACK_ASSET.folder}/${encodeURI(INFINITE_CARD_BACK_ASSET.file)}`;
  }

  if (card.rarity === 'Transcendent') {
    return `${CARD_BACKGROUND_ROOT}/${TRANSCENDENT_CARD_BACK_ASSET.folder}/${encodeURI(TRANSCENDENT_CARD_BACK_ASSET.file)}`;
  }

  if (card.rarity === 'Eternal') {
    return `${CARD_BACKGROUND_ROOT}/${ETERNAL_CARD_BACK_ASSET.folder}/${encodeURI(ETERNAL_CARD_BACK_ASSET.file)}`;
  }

  if (card.rarity === 'Enigmatic') {
    return `${CARD_BACKGROUND_ROOT}/${ENIGMATIC_CARD_BACK_ASSET.folder}/${encodeURI(ENIGMATIC_CARD_BACK_ASSET.file)}`;
  }

  const asset = CARD_BACK_ASSET_BY_ELEMENT[card.type === 'AinSophAur' ? 'AinSophAur' : 'Neutrality'];
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
  return card.rarity === 'Transcendent';
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
const LIVE_CARD_FACE_STYLE_CACHE = new Map<string, CSSProperties>();

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
    warmTheme.surfaceStrong,
  ].join('::');
}

export function getCardBackgroundUrl(card: CardDefinition | null | undefined): string | null {
  if (!card) return null;

  if (card.definitionId.includes('causality')) {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/causality/${encodeURI(fileName)}`;
  }

  const newCatalogFallback = getNewNeutralityArt(card.definitionId);

  if (card.rarity === 'Infinite') {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? newCatalogFallback ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/infinite/${encodeURI(fileName)}`;
  }

  if (card.rarity === 'Transcendent') {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/neutrality/${encodeURI(fileName)}`;
  }

  const bteiFolder = getBteiFolder(card.definitionId);
  if (bteiFolder) {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? newCatalogFallback ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/${bteiFolder}/${encodeURI(fileName)}`;
  }

  const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? newCatalogFallback ?? `${card.name}.png`;
  return `${CARD_BACKGROUND_ROOT}/neutrality/${encodeURI(fileName)}`;
}

export function getCardFaceBackgroundStyle(card: CardDefinition | null | undefined, finish: CardFinish = 'normal', faceState: CardFaceState = 'front', skipImage = false): CSSProperties {
  const theme = getCardThemePackStyle(card);
  const isBackFace = faceState === 'back';
  const isTranscendent = isTranscendentCard(card);
  const isInfinite = card?.rarity === 'Infinite';
  const isEternal = card?.rarity === 'Eternal';
  const isEnigmatic = card?.rarity === 'Enigmatic';
  const isPackHolo = finish === 'holo' && !isTranscendent && !isInfinite && !isEternal && !isEnigmatic;
  if (isBackFace) {
    const backStyle = getCardBackBackgroundStyle(card, { dimmed: false });
    return {
      ...backStyle,
      backgroundColor: warmTheme.surfaceStrong,
      boxShadow: cardFacePalette.shadow,
    };
  }
  const infiniteGlassStyle = isInfinite ? getInfiniteGlassAnimationStyle() : {};
  const eternalGlassStyle = isEternal ? getEternalGlassAnimationStyle() : {};
  const transcendentGlassStyle = isTranscendent && card ? getTranscendentFoilAnimationStyle(card.definitionId) : {};
  const enigmaticGlassStyle = isEnigmatic && card ? getHolofoilAnimationStyle(card.definitionId) : {};

  const holofoilStyle = isPackHolo && card
    ? getHolofoilAnimationStyle(card.definitionId)
    : {};

  const tierAnimationStyle = isTranscendent
    ? transcendentGlassStyle
    : isEnigmatic
      ? enigmaticGlassStyle
    : isInfinite
      ? infiniteGlassStyle
      : isEternal
        ? eternalGlassStyle
        : {};
  const animStyle = mergeAnimationStyles(tierAnimationStyle, holofoilStyle);

  const imageUrl = skipImage ? null : getCardBackgroundUrl(card);
  const fallbackImageUrl = skipImage ? null : getCardBackUrl(card);

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
  const enigmaticFrameLayer =
    'linear-gradient(180deg, rgba(8, 8, 10, 0.98) 0%, rgba(255, 255, 255, 0.94) 6%, rgba(210, 166, 42, 0.92) 10%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 84%, rgba(255, 220, 100, 0.9) 90%, rgba(255, 255, 255, 0.94) 94%, rgba(8, 8, 10, 0.98) 100%)';

  const transcendentLayers = [
    'linear-gradient(118deg, rgba(255,255,255,0.22) 0%, rgba(255, 222, 232, 0.18) 18%, rgba(255, 132, 164, 0.18) 42%, rgba(98, 0, 24, 0.2) 70%, rgba(255, 240, 245, 0.16) 100%)',
    'radial-gradient(ellipse at 22% 14%, rgba(255,255,255,0.26) 0%, rgba(255, 214, 226, 0.16) 18%, rgba(255,255,255,0) 48%)',
    'radial-gradient(circle at 34% 28%, rgba(255,255,255,0.9) 0 1.4px, rgba(255, 220, 232, 0.55) 1.4px 2.2px, rgba(255,255,255,0) 2.4px)',
    'linear-gradient(212deg, rgba(255,255,255,0) 22%, rgba(255, 244, 248, 0.26) 44%, rgba(255, 176, 202, 0.14) 58%, rgba(255,255,255,0) 74%)',
    'linear-gradient(180deg, rgba(18, 0, 6, 0.08) 0%, rgba(18, 0, 6, 0.02) 52%, rgba(18, 0, 6, 0.12) 100%)',
  ];

  const enigmaticLayers = [
    'linear-gradient(116deg, rgba(255,255,255,0.34) 0%, rgba(16,16,18,0.38) 22%, rgba(255, 214, 74, 0.4) 45%, rgba(0,0,0,0.42) 70%, rgba(255,255,255,0.34) 100%)',
    'radial-gradient(ellipse at 20% 16%, rgba(255,255,255,0.52) 0%, rgba(255, 220, 92, 0.25) 26%, rgba(255,255,255,0) 56%)',
    'linear-gradient(208deg, rgba(255,255,255,0) 20%, rgba(255, 244, 190, 0.36) 42%, rgba(198, 145, 24, 0.24) 56%, rgba(255,255,255,0) 74%)',
    'linear-gradient(180deg, rgba(0, 0, 0, 0.16) 0%, rgba(255, 255, 255, 0.04) 52%, rgba(0, 0, 0, 0.22) 100%)',
  ];

  // Canonical holofoil overlay: muted pastel iridescence (pink/orange/purple/blue) at
  // overlay-blend, paired with a soft white sparkle and a diagonal sheen. Matches the
  // Holofoil Workshop preview look so every holo card across the game reads identically.
  const holoLayers = [
    'linear-gradient(112deg, rgba(255,255,255,0.82) 0%, rgba(8,8,10,0.92) 16%, rgba(190,0,28,0.92) 34%, rgba(0,0,0,0.96) 52%, rgba(255,255,255,0.76) 70%, rgba(112,0,18,0.94) 86%, rgba(255,255,255,0.88) 100%)',
    'radial-gradient(ellipse at 18% 16%, rgba(255,255,255,0.72) 0%, rgba(220,0,35,0.5) 20%, rgba(0,0,0,0.92) 48%, rgba(255,255,255,0) 70%)',
    'repeating-linear-gradient(156deg, rgba(255,255,255,0.0) 0 12px, rgba(255,255,255,0.5) 14px 17px, rgba(150,0,22,0.7) 18px 24px, rgba(0,0,0,0.65) 25px 34px)',
  ];
  const holoBlendModes = ['overlay', 'screen', 'soft-light'];
  const isHoloOnly = finish === 'holo' && !isTranscendent && !isInfinite && !isEternal && !isEnigmatic;

  const frameLayers = isTranscendent ? [transcendentFrameLayer] : isEnigmatic ? [enigmaticFrameLayer] : isInfinite ? [infiniteFrameLayer] : isEternal ? [eternalFrameLayer] : [];
  const overlayCoreLayers = isTranscendent ? transcendentLayers : isEnigmatic ? enigmaticLayers : isInfinite ? infiniteLayers : isEternal ? eternalLayers : (isHoloOnly ? holoLayers : []);
  const overlayLayers = [...frameLayers, ...overlayCoreLayers];

  const themeVars: CSSProperties & Record<string, string> = {
    '--card-face-text': isInfinite
      ? 'rgba(244,246,255,0.96)'
      : isTranscendent
        ? 'rgba(255,246,249,0.97)'
      : isEnigmatic
        ? 'rgba(255, 252, 232, 0.98)'
      : isEternal
        ? 'rgba(246,230,248,0.96)'
      : isPackHolo
        ? 'rgba(255,255,255,0.98)'
        : CONSISTENT_CARD_TEXT,
    '--card-face-text-soft': isInfinite
      ? 'rgba(236,240,255,0.92)'
      : isTranscendent
        ? 'rgba(255,232,240,0.94)'
      : isEnigmatic
        ? 'rgba(255, 238, 170, 0.94)'
      : isEternal
        ? 'rgba(238,214,244,0.92)'
      : isPackHolo
        ? 'rgba(255,230,230,0.94)'
        : CONSISTENT_CARD_TEXT_SOFT,
    '--card-face-text-muted': isInfinite
      ? 'rgba(218,224,244,0.84)'
      : isTranscendent
        ? 'rgba(255,214,226,0.88)'
      : isEnigmatic
        ? 'rgba(255, 224, 120, 0.9)'
      : isEternal
        ? 'rgba(226,198,234,0.84)'
      : isPackHolo
        ? 'rgba(255,210,210,0.9)'
        : CONSISTENT_CARD_TEXT_MUTED,
    '--card-face-ribbon': isInfinite
      ? '#12151e'
      : isTranscendent
        ? '#7a0f31'
      : isEnigmatic
        ? '#b8861b'
      : isEternal
        ? '#32134f'
      : isPackHolo
        ? '#861326'
        : theme.ribbon,
    '--card-face-panel': isInfinite
      ? '#0d1018'
      : isTranscendent
        ? '#5f0a25'
      : isEnigmatic
        ? '#8f6814'
      : isEternal
        ? '#26103d'
      : isPackHolo
        ? '#650d1e'
        : theme.panel,
    '--card-face-border': isInfinite ? 'rgba(214,226,255,0.52)' : isTranscendent ? 'rgba(255, 209, 126, 0.9)' : isEnigmatic ? 'rgba(255, 220, 90, 0.9)' : isEternal ? 'rgba(210,92,132,0.56)' : isPackHolo ? 'rgba(255,255,255,0.92)' : theme.border,
    '--card-face-shadow': theme.shadow,
    '--card-face-ribbon-animation-name': 'none',
    '--card-face-ribbon-animation-duration': '0s',
    '--card-face-panel-animation-name': 'none',
    '--card-face-panel-animation-duration': '0s',
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
      if (isHoloOnly) {
        return holoBlendModes[coreIndex] ?? 'overlay';
      }
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
  skipImage = false,
): CSSProperties {
  const cacheKey = getDenseCardFaceCacheKey(card, finish, faceState) + (skipImage ? '|noimg' : '');
  const cached = DENSE_CARD_FACE_STYLE_CACHE.get(cacheKey);
  if (cached) return cached;

  // Single source of truth: identical composition to getCardFaceBackgroundStyle,
  // just memoized for cheap reuse in large virtualized grids.
  const style = getCardFaceBackgroundStyle(card, finish, faceState, skipImage);
  DENSE_CARD_FACE_STYLE_CACHE.set(cacheKey, style);
  return style;
}

export function getLiveCardFaceBackgroundStyle(
  card: CardDefinition | null | undefined,
  finish: CardFinish = 'normal',
  faceState: CardFaceState = 'front',
  skipImage = false,
): CSSProperties {
  const cacheKey = `live::${getDenseCardFaceCacheKey(card, finish, faceState)}::${skipImage ? 'noimg' : 'img'}`;
  const cached = LIVE_CARD_FACE_STYLE_CACHE.get(cacheKey);
  if (cached) return cached;

  const style = { ...getDenseCardFaceBackgroundStyle(card, finish, faceState, skipImage) };
  delete style.animationName;
  delete style.animationDuration;
  delete style.animationTimingFunction;
  delete style.animationIterationCount;
  delete style.animationDirection;
  delete style.animationDelay;
  LIVE_CARD_FACE_STYLE_CACHE.set(cacheKey, style);
  return style;
}

export function getLiveCardShimmerClassName(
  card: CardDefinition | null | undefined,
  finish: CardFinish = 'normal',
  faceState: CardFaceState = 'front',
): string | undefined {
  if (!card || faceState === 'back') return undefined;
  if (card.rarity === 'Transcendent') return 'live-card-shimmer live-card-shimmer-transcendent';
  if (card.rarity === 'Enigmatic') return 'live-card-shimmer live-card-shimmer-enigmatic';
  if (card.rarity === 'Infinite') return 'live-card-shimmer live-card-shimmer-infinite';
  if (card.rarity === 'Eternal') return 'live-card-shimmer live-card-shimmer-eternal';
  if (finish === 'holo') return 'live-card-shimmer live-card-shimmer-holo';
  return undefined;
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
    background: 'var(--card-face-ribbon, #2f2118)',
    borderBottom: '1px solid var(--card-face-border, rgba(236, 214, 176, 0.55))',
    boxShadow: '0 1px 0 rgba(255, 255, 255, 0.5)',
    color: 'var(--card-face-text, #fff8e8)',
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
    background: 'var(--card-face-panel, #241a13)',
    borderTop: '1px solid var(--card-face-border, rgba(236, 214, 176, 0.55))',
    boxShadow: '0 -10px 22px rgba(68, 49, 32, 0.12)',
    color: 'var(--card-face-text-soft, rgba(255, 248, 232, 0.92))',
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
    return {
      ...getCardArtTopBottomBorderOverlayStyle('rgba(18, 18, 22, 0.98)'),
      boxShadow: 'inset 0 10px 18px rgba(248,250,255,0.18), inset 0 -10px 18px rgba(248,250,255,0.18)',
    };
  }
  if (card?.rarity === 'Transcendent') {
    return {
      ...getCardArtTopBottomBorderOverlayStyle('rgba(255, 122, 158, 0.96)'),
      boxShadow: 'inset 0 10px 20px rgba(255, 216, 104, 0.18), inset 0 -10px 20px rgba(255, 216, 104, 0.18)',
    };
  }
  if (card?.rarity === 'Enigmatic') {
    return {
      ...getCardArtTopBottomBorderOverlayStyle('rgba(255, 210, 92, 0.98)'),
      boxShadow: 'inset 0 12px 22px rgba(255, 233, 168, 0.28), inset 0 -12px 22px rgba(255, 233, 168, 0.28)',
    };
  }
  if (card?.rarity === 'Eternal') {
    return {
      ...getCardArtTopBottomBorderOverlayStyle('rgba(96, 40, 108, 0.96)'),
      boxShadow: 'inset 0 11px 22px rgba(226, 126, 176, 0.22), inset 0 -11px 22px rgba(226, 126, 176, 0.22)',
    };
  }
  return getCardArtTopBottomBorderOverlayStyle('rgba(125, 16, 32, 0.96)');
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
