/**
 * tutorialContent.ts
 *
 * Single source of truth for all in-game tutorial text.
 * Consumed by TutorialModal.tsx — the component is pure presentation;
 * all copy lives here.
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
  { name: 'Eternal',  source: "Eternity's Wake boss drops",    description: 'Much stronger; higher patience thresholds, bigger Cherubim payouts, set-defining payoff lines.' },
  { name: 'Infinite', source: 'Infinitude crafting',           description: 'Apex tier. Forged by consuming specific Eternals. Patience thresholds 8+, Angels with patience-double abilities.' },
];

// ---------------------------------------------------------------------------
// Set engines  (displayed in the Sets section)
// ---------------------------------------------------------------------------

export const SET_ENGINE_ENTRIES: SetEntry[] = [
  {
    name: 'Neutrality',
    mechanic: 'Patience / Stasis',
    body: 'Stockpile Patience on Seraphim, cash it out on attack. The friendly starter engine.',
  },
  {
    name: 'Heavenly Light',
    mechanic: 'Radiance & Halo',
    body: 'Build Radiance, then spend stocked Halo on your biggest Light burst turns.',
  },
  {
    name: 'Pyroabyss',
    mechanic: 'Heat Roles and Burst Windows',
    body: 'Base cards split into stoke, threshold, tutor, and burst roles. Build Heat first, then cash in one burst window; Chroma overlays on higher-rarity turns.',
  },
  {
    name: 'Thornbound Plains',
    mechanic: 'Trail, Scar & Briar Spiral',
    body: 'Build Trail, convert to Scar manually in the HUD, then use Eternal Briar Spirals to amplify your payoff turn.',
  },
  {
    name: 'Snowbound Voltage',
    mechanic: 'Frost, Voltage & Polar Capacitors',
    body: 'Frost cards build Arctic Charge and Voltage cards cash it out; Eternity/Infinite cards add Polar Capacitor bank-and-release lines.',
  },
  {
    name: 'Mechanical Dreams',
    mechanic: 'Strain & Resonance Clock',
    body: 'Build Strain, track the Resonance Charge threshold, and spend stored energy on your strongest Mechanical attacks.',
  },
  {
    name: 'Prismatic Accord',
    mechanic: 'Refraction & Prism Charge',
    body: 'Switch channels to build Refraction Depth and Prism Charge, then spend fixed charge amounts on payoff turns.',
  },
  {
    name: 'Black Glass Inferno',
    mechanic: 'Twin-Flame, Fracture & Eclipse',
    body: 'Balance White and Black Flame, build Fracture, then convert banked Eclipse through Eternal/Infinity burst windows.',
  },
  {
    name: 'Glass Absolute',
    mechanic: 'Fragments, Formation & Refraction',
    body: 'Build dense Glass board presence to hit fragment tiers, then use Refraction Charge on Eternal/Infinite cards to convert that formation into larger burst turns.',
  },
  {
    name: 'Blazing Garden',
    mechanic: 'Burn, Grove, Echo & Wild Pollen',
    body: 'Keep units in Burn, let charred cards seed Ember Grove, generate Wild Pollen from Eternal cards, then spend seeded payoffs for your lineage burst turn.',
  },
  {
    name: 'Age of the Butterfly',
    mechanic: 'Flutter Formation + Wing Resonance',
    body: 'Charge shared Spectrum, complete Formation across unit types, then cash Wing Resonance windows on Eternity/Infinite turns before Descent reset.',
  },
  {
    name: 'Eternal Seas',
    mechanic: 'Undertow, Foam & Deepwake',
    body: 'Build Undertow during the turn, release it for burst, spend 5 Foam in the HUD to draw 1 card, and use Deepwake on Eternal/Infinite cards to amplify your conversion turns.',
  },
  {
    name: 'Abyssal Forge',
    mechanic: 'Reforge, Pearls & Imprint',
    body: 'Stock Reforge Charges, recast previous cards at scaled power, and layer Pearl + Imprint payoffs on top for compounding Oblivion turns.',
  },
  {
    name: 'Death-flamed Hell',
    mechanic: 'Pyre Embers, Cinder Crowns & Veil Marks',
    body: 'Stack Pyre Embers and Cinder Crowns, then transmute them into Veil Marks via Eternal plays for massive cashout bursts.',
  },
  {
    name: 'Wished Upon a Star',
    mechanic: 'Starlight & Dream Lattice',
    body: 'Stack Starlight Charges, amplify with Dream Lattice, then fire Nova Wish Burst (Oblivion = Starlight × (1 + Dream × coeff)). Event set — limited-access packs.',
  },
];

// ---------------------------------------------------------------------------
// Card-born tier milestones
// ---------------------------------------------------------------------------

export const CARD_BORN_TIERS: CardBornTierEntry[] = [
  { name: 'Practiced',     glyph: '◈', threshold: 25,     description: 'First steps. The card becomes familiar in your hands.' },
  { name: 'Veteran',       glyph: '◆', threshold: 75,     description: 'Consistent use — you know this card\'s timing.' },
  { name: 'Master',        glyph: '✦', threshold: 400,    description: 'Real commitment. The card has shaped your play.' },
  { name: 'Eternal Bond',  glyph: '★', threshold: 1_500,  description: 'This card is a staple, deeply understood.' },
  { name: 'Resonant',      glyph: '✵', threshold: 3_000,  description: 'Refined command — you push its limits each turn.' },
  { name: 'Transcendent',  glyph: '✷', threshold: 6_000,  description: 'Near-peak. Rare few reach here.' },
  { name: 'Ascendant',     glyph: '✸', threshold: 15_000, description: 'One of your defining cards. Profound familiarity.' },
  { name: 'Infinite Bond', glyph: '∞', threshold: 30_000, description: 'The apex tier. You and this card are inseparable.' },
];

// ---------------------------------------------------------------------------
// Section metadata  (drives TutorialModal navigation — ids are stable keys)
// ---------------------------------------------------------------------------

export const TUTORIAL_SECTIONS: TutorialSection[] = [
  { id: 'overview',       label: 'Overview',         title: 'How To Play',              subtitle: 'The game loop, currencies, and modes.' },
  { id: 'play-turn',      label: 'Play Tutorial Turn', title: 'Play Tutorial Turn',     subtitle: 'Neutrality Starter → Eternal → Infinite practice lanes.' },
  { id: 'turn-flow',      label: 'Turn Flow',         title: 'Turn Flow',                subtitle: 'Begin → Mulligan → Play → End.' },
  { id: 'board',          label: 'Board & Cards',     title: 'The Board',                subtitle: 'Slots, card types, and click behavior.' },
  { id: 'attacks',        label: 'Attacks',           title: 'Attacks',                  subtitle: 'How Seraphim and Angel attacks pay out.' },
  { id: 'patience',       label: 'Patience',          title: 'Patience System',          subtitle: 'The Neutrality starter engine.' },
  { id: 'sets',           label: 'Sets',              title: 'Set Engines',              subtitle: 'The mechanical identity of every set.' },
  { id: 'rarities',       label: 'Rarities',          title: 'Rarity Tiers',             subtitle: 'From Common through Infinite.' },
  { id: 'modes',          label: 'Modes',             title: 'Wake, Infinitude & Packs', subtitle: 'Boss fights, crafting, and the store.' },
  { id: 'card-born-tier', label: 'Card-born Tier',    title: 'Card-born Tier',           subtitle: 'Card-light mastery, Resonance, and Collection Power.' },
  { id: 'progression',    label: 'Progression',       title: 'Progression & Cosmetics',  subtitle: 'Shards, holofoils, profile, and themes.' },
];

// ---------------------------------------------------------------------------
// Re-export resources so TutorialModal only needs one import
// ---------------------------------------------------------------------------

export { RESOURCE_INFO };
