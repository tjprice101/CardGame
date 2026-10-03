/**
 * tutorialContent.ts
 *
 * Section metadata and rarity reference data for the in-game tutorial.
 * TutorialModal.tsx owns the section body copy and presentation.
 *
 * Structure mirrors the existing tutorial sections (id = stable key used
 * by TutorialModal for navigation, label = tab label, title/subtitle for
 * the panel header, content = typed data the component renders).
 */

import { RESOURCE_INFO } from './resourceExplanations';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RarityTier {
  name: string;
  source: string;
  description: string;
}

export interface CardBornTierEntry {
  name: string;
  glyph: string;
  threshold: number;
  description: string;
}

export interface SetEntry {
  name: string;
  mechanic: string;
  body: string;
}

export interface TutorialSection {
  id: string;
  label: string;
  title: string;
  subtitle: string;
}

// ---------------------------------------------------------------------------
// Rarity tiers
// ---------------------------------------------------------------------------

export const RARITY_TIERS: RarityTier[] = [
  { name: 'Common',   source: 'Card packs',                    description: 'Simple and modest. The early deck backbone.' },
  { name: 'Rare',     source: 'Card packs',                    description: 'Noticeably stronger than Commons; introduces subset mechanics.' },
  { name: 'Epic',     source: 'Card packs',                    description: 'Impactful, often combo-shaped.' },
  { name: 'Legendary', source: 'Card packs',                   description: 'Dramatic, deck-defining plays.' },
  { name: 'Eternal',  source: "Eternity's Wake boss drops",    description: 'Apex Ain/Soph cards with stronger attacks, deeper utility, and bespoke bridge effects.' },
  { name: 'Infinite', source: 'Infinitude crafting',           description: 'Apex tier. Forged by consuming specific Eternals, with the strongest Ain/Soph scaling.' },
  { name: 'Enigmatic', source: 'Enigma rewards',               description: 'Quest-like reward cards with their own black, white, and golden metallic foil treatment.' },
  { name: 'Transcendent', source: 'Forge of Transcendence',    description: 'Belongs to no set. Vol. 1 contains four initial cards, with additional Transcendent volumes arriving in future expansions. Each has the shared maximum-hand-size passive and its own Spectrum Level 5 rules. Four separate Forge abilities can also be materialized with Divine Light and Shards of Transcendence; they use no other set mechanics.' },
];

// ---------------------------------------------------------------------------
// Card-born tier milestones
// ---------------------------------------------------------------------------

export const CARD_BORN_TIERS: CardBornTierEntry[] = [
  { name: 'Practiced',     glyph: '◈', threshold: 10,    description: 'The first Card-born Tier milestone.' },
  { name: 'Veteran',       glyph: '◆', threshold: 25,    description: 'The second Card-born Tier milestone.' },
  { name: 'Master',        glyph: '✦', threshold: 50,    description: 'The third Card-born Tier milestone.' },
  { name: 'Eternal Bond',  glyph: '★', threshold: 125,   description: 'The fourth Card-born Tier milestone.' },
  { name: 'Resonant',      glyph: '✵', threshold: 250,   description: 'The fifth Card-born Tier milestone.' },
  { name: 'Transcendent',  glyph: '✷', threshold: 625,   description: 'The sixth Card-born Tier milestone.' },
  { name: 'Ascendant',     glyph: '✸', threshold: 1_250, description: 'The seventh Card-born Tier milestone.' },
  { name: 'Infinite Bond', glyph: '∞', threshold: 2_500, description: 'The eighth and final Card-born Tier milestone.' },
];

// ---------------------------------------------------------------------------
// Section metadata  (drives TutorialModal navigation — ids are stable keys)
// ---------------------------------------------------------------------------

export const TUTORIAL_SECTIONS: TutorialSection[] = [
  { id: 'overview',       label: 'Overview',         title: 'How To Play',              subtitle: 'The game loop, currencies, and modes.' },
  { id: 'turn-flow',      label: 'Turn Flow',         title: 'Turn Flow',                subtitle: 'Begin → Mulligan → Play → End.' },
  { id: 'board',          label: 'Board & Cards',     title: 'The Board',                subtitle: 'Slots, card types, and click behavior.' },
  { id: 'attacks',        label: 'Ain / Soph',        title: 'Ain / Soph Combat',        subtitle: 'Charges, attacks, Bridge the Light, and the full-board finisher.' },
  { id: 'patience',       label: 'Light Stacks',      title: 'Limitless Light Stacks',   subtitle: 'How the shared turn resource is generated and spent.' },
  { id: 'sets',           label: 'Abilities',         title: 'Ability Amplification',    subtitle: 'Materialized abilities and their runtime effects.' },
  { id: 'rarities',       label: 'Rarities',          title: 'Rarity Tiers',             subtitle: 'How each card rarity is earned.' },
  { id: 'modes',          label: 'Modes',             title: 'Wake, Infinitude & Packs', subtitle: 'Boss fights, crafting, and the store.' },
  { id: 'card-born-tier', label: 'Card-born Tier',    title: 'Card-born Tier',           subtitle: 'Card-light mastery, Resonance, and Collection Power.' },
  { id: 'progression',    label: 'Progression',       title: 'Progression & Cosmetics',  subtitle: 'Shards, holofoils, profile, and themes.' },
  { id: 'forge',          label: 'Forge',             title: 'Forge of Transcendence',   subtitle: 'The endgame gallery for Transcendent cards.' },
];

// ---------------------------------------------------------------------------
// Re-export resources so TutorialModal only needs one import
// ---------------------------------------------------------------------------

export { RESOURCE_INFO };
