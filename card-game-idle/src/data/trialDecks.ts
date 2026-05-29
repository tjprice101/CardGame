/**
 * Trial Deck definitions — one per card pack.
 * Each definition contains a curated 50-card main deck, extra deck,
 * guide steps for Guided mode, and a fixed opening hand + ordered draw
 * pile for the Guided walkthrough.
 */
import type { TrialDeckDefinition } from '@/types/game';

function d(definitionId: string, copies: 1 | 2 | 3 | 4): { definitionId: string; copies: 1 | 2 | 3 | 4; finish: 'normal' } {
  return { definitionId, copies, finish: 'normal' };
}
function e(definitionId: string): { definitionId: string; finish: 'normal' } {
  return { definitionId, finish: 'normal' };
}

// ── Neutrality ────────────────────────────────────────────────────────────────
const neutralityTrial: TrialDeckDefinition = {
  packId: 'pack-neutrality',
  displayName: 'Neutrality — Patience',
  deckList: [
    d('ser-neutral-null', 4),
    d('ser-neutral-void', 4),
    d('ser-neutral-balance', 4),
    d('ser-neutral-equilibrium', 4),
    d('ser-neutral-still', 2),
    d('cherubim-neutral-null-veil', 4),
    d('cherubim-neutral-void-shroud', 3),
    d('cherubim-neutral-balance-mantle', 2),
    d('cherubim-neutral-equilibrium-ward', 2),
    d('cherubim-neutral-still-shell', 1),
    d('ophanim-neutral-null-seek', 4),
    d('ophanim-neutral-seraph-recall', 4),
    d('ophanim-neutral-neutral-cycle', 4),
    d('ophanim-neutral-void-surge', 4),
    d('ophanim-neutral-chain-pulse', 4),
  ],
  extraDeck: [e('angel-neutral-beginning')],
  guideSteps: [
    {
      cardDefinitionId: 'ser-neutral-null',
      hint: 'Null Seraphim (Slot A). On play: +16 Oblivion; all Seraphim on board gain +3 Patience. Patience is the Neutrality resource — each Seraphim stacks +1 per card played, and on attack each stack adds +15 Oblivion.',
    },
    {
      cardDefinitionId: 'ser-neutral-equilibrium',
      hint: 'Equilibrium Seraphim (Slot B). On play: +36 Oblivion. While active: +8 Oblivion per card played. Patience threshold 4: attack draws 2 — this is your finisher.',
    },
    {
      cardDefinitionId: 'ser-neutral-balance',
      hint: 'Balance Seraphim (Slot C). On play: +20 Oblivion; designate the highest-Patience Seraphim as your Vessel. Three Seraphim on board now — each one accumulates Patience independently.',
    },
    {
      cardDefinitionId: 'ophanim-neutral-null-seek',
      hint: 'Null Seek. Draw 2 — pulls Null Seek + Neutral Cycle from top of deck.',
    },
    {
      cardDefinitionId: 'ophanim-neutral-chain-pulse',
      hint: 'Oblivion Pulse. +2 Patience to all Seraphim, +20 Oblivion, Empower next, draw 1. Equilibrium now ~4 Patience.',
    },
    {
      cardDefinitionId: 'ophanim-neutral-null-seek',
      hint: 'Null Seek (the one drawn at step 4). Draw 2 more cards. Pile draws keep all three Seraphim ticking +1 Patience each per card played.',
    },
    {
      cardDefinitionId: 'ophanim-neutral-neutral-cycle',
      hint: 'Neutral Cycle. Core mechanic: Patience stacking across multiple Seraphim and Vessel routing. Why it scales: every card played adds Patience, and each Patience adds +15 Oblivion on attack while Equilibrium also gains per-card pressure. Exact payoff: click Equilibrium Seraphim → Attack now for a large burst (~500+ Oblivion) and the 4+ Patience extra draws to continue the chain.',
    },
  ],
  guidedOpeningHand: [
    'ser-neutral-null',
    'ser-neutral-equilibrium',
    'ser-neutral-balance',
    'ophanim-neutral-null-seek',
    'ophanim-neutral-chain-pulse',
  ],
  guidedDeckOrder: [
    // Splice fodder — first 5 entries match the opening hand IDs 1:1.
    // The store's opening-hand override does `drawPile.indexOf(defId)` then `splice`
    // for each card in guidedOpeningHand, so these get removed from the top first.
    d('ser-neutral-null', 1),
    d('ser-neutral-equilibrium', 1),
    d('ser-neutral-balance', 1),
    d('ophanim-neutral-null-seek', 1),
    d('ophanim-neutral-chain-pulse', 1),
    // True top of deck after splice — drawn deterministically by guide steps:
    d('ophanim-neutral-null-seek', 1),     // drawn by Null Seek at step 4 (1st)
    d('ophanim-neutral-neutral-cycle', 1), // drawn by Null Seek at step 4 (2nd)
    d('ophanim-neutral-void-surge', 1),    // drawn by Chain Pulse at step 5
    d('ser-neutral-void', 1),              // drawn by Null Seek at step 6 (1st)
    d('cherubim-neutral-null-veil', 1),    // drawn by Null Seek at step 6 (2nd)
    // Filler — totals 35 more (45 - 10 above)
    d('ser-neutral-null', 2),
    d('ser-neutral-equilibrium', 2),
    d('ser-neutral-balance', 2),
    d('ser-neutral-void', 3),
    d('ser-neutral-still', 2),
    d('cherubim-neutral-null-veil', 3),
    d('cherubim-neutral-void-shroud', 3),
    d('cherubim-neutral-balance-mantle', 2),
    d('cherubim-neutral-equilibrium-ward', 2),
    d('cherubim-neutral-still-shell', 1),
    d('ophanim-neutral-null-seek', 1),
    d('ophanim-neutral-seraph-recall', 4),
    d('ophanim-neutral-neutral-cycle', 3),
    d('ophanim-neutral-void-surge', 3),
    d('ophanim-neutral-chain-pulse', 2),
  ],
};

// ── Pyroabyss ─────────────────────────────────────────────────────────────────
const pyroabyssTrial: TrialDeckDefinition = {
  packId: 'pack-pyroabyss',
  displayName: 'Pyroabyss — Furnace & Fault',
  deckList: [
    d('ser-fire-cinder', 4),
    d('ser-fire-abyssal', 4),
    d('ser-fire-pyre', 4),
    d('ser-fire-infernal', 2),
    d('cherubim-fire-ember-shroud', 4),
    d('cherubim-fire-abyssal-veil', 4),
    d('cherubim-fire-pyre-mantle', 3),
    d('ophanim-fire-cinder-draw', 4),
    d('ophanim-fire-abyssal-kindle', 4),
    d('ophanim-fire-pyre-ignite', 4),
    d('ophanim-fire-infernal-surge', 4),
    d('ophanim-fire-void-kindling', 4),
    d('ophanim-fire-ember-chain', 1),
    d('ophanim-fire-abyssal-detonation', 2),
    d('ophanim-fire-void-combustion', 2),
  ],
  extraDeck: [e('angel-fire-cinderwing')],
  guideSteps: [
    {
      cardDefinitionId: 'cherubim-fire-ember-shroud',
      hint: 'Ember Shroud (Slot A). On play: +4 Furnace Pressure, +1 Abyss Fault, +1 Ruin Window. While active: +2 Pressure per card.',
    },
    {
      cardDefinitionId: 'ser-fire-cinder',
      hint: 'Cinder Seraphim (Slot A). On play: +20 Oblivion, +3 Pressure, +1 Ruin Window. While active: +10 Oblivion per card.',
    },
    {
      cardDefinitionId: 'ophanim-fire-cinder-draw',
      hint: 'Cinder Draw. +2 Pressure; draw 1.',
    },
    {
      cardDefinitionId: 'ophanim-fire-void-kindling',
      hint: 'Void Kindling. +2 Ruin Windows, +3 Pressure. ~4 Windows banked.',
    },
    {
      cardDefinitionId: 'ophanim-fire-abyssal-kindle',
      hint: 'Abyssal Kindle. +20 Oblivion, +1 Abyss Fault.',
    },
    {
      cardDefinitionId: 'ophanim-fire-cinder-draw',
      hint: 'Cinder Draw again. +2 Pressure; draws Void Combustion.',
    },
    {
      cardDefinitionId: 'ophanim-fire-void-combustion',
      hint: 'Void Combustion. Core mechanic: Ruin Window banking from earlier setup. Why it scales: Furnace/Fault setup feeds repeated Window generation, then cashout converts stacked windows into one huge spike. Exact payoff: play Void Combustion for the window cashout, then click Cinder Seraphim → Vector Break for the finisher (~900+ combined Oblivion).',
    },
  ],
  guidedOpeningHand: [
    'cherubim-fire-ember-shroud',
    'ser-fire-cinder',
    'ophanim-fire-cinder-draw',
    'ophanim-fire-cinder-draw',
    'ophanim-fire-void-kindling',
  ],
  guidedDeckOrder: [
    // Top of deck — drawn by guide steps
    d('ophanim-fire-abyssal-kindle', 1),       // drawn at step 3 by Cinder Draw
    d('ophanim-fire-void-combustion', 1),      // drawn at step 6 by Cinder Draw
    // Filler — totals 43 more (45 - 2 above)
    d('ser-fire-cinder', 3),
    d('ser-fire-abyssal', 4),
    d('ser-fire-pyre', 4),
    d('ser-fire-infernal', 2),
    d('cherubim-fire-ember-shroud', 3),
    d('cherubim-fire-abyssal-veil', 4),
    d('cherubim-fire-pyre-mantle', 3),
    d('ophanim-fire-cinder-draw', 2),
    d('ophanim-fire-abyssal-kindle', 3),
    d('ophanim-fire-pyre-ignite', 4),
    d('ophanim-fire-infernal-surge', 4),
    d('ophanim-fire-void-kindling', 3),
    d('ophanim-fire-ember-chain', 1),
    d('ophanim-fire-abyssal-detonation', 2),
    d('ophanim-fire-void-combustion', 1),
  ],
};

// ── Heavenly Light ────────────────────────────────────────────────────────────
// Resource: Radiance. Build to 25+ Radiance, then spend it on the final Seraphim hit.
const heavenlyLightTrial: TrialDeckDefinition = {
  packId: 'pack-heavenly-light',
  displayName: 'Heavenly Light — Radiance',
  deckList: [
    d('ser-light-dawn', 4),
    d('ser-light-choir', 4),
    d('ser-light-herald', 4),
    d('ser-light-vigil', 2),
    d('hr-light-divine-smite', 4),
    d('hr-light-holy-radiance', 4),
    d('hr-light-sacred-fury', 4),
    d('hr-light-luminous-strike', 4),
    d('hr-light-radiant-surge', 4),
    d('hr-light-angelic-wrath', 2),
    d('hr-light-celestial-grace', 4),
    d('hr-light-aureate-chain', 1),
    d('hr-light-celestial-scroll', 1),
    d('hr-light-mornings-grace', 4),
    d('hr-light-angelic-vision', 2),
    d('hr-light-sacred-memory', 1),
    d('hr-light-divine-clarity', 1),
  ],
  extraDeck: [e('angel-light-seraphiel')],
  guideSteps: [
    {
      cardDefinitionId: 'ser-light-dawn',
      hint: 'Dawnfire Seraphim (Slot A). On play: +1 Radiance. While active: +15 Oblivion per Ophanim played.',
    },
    {
      cardDefinitionId: 'ser-light-choir',
      hint: 'Emberchoir Seraphim (Slot B). On play: +3 Radiance. While active: +12 Oblivion per card played.',
    },
    {
      cardDefinitionId: 'hr-light-mornings-grace',
      hint: 'Emberdawn Grace. If it is not your first card, gain +3 Radiance, then +3 more.',
    },
    {
      cardDefinitionId: 'hr-light-celestial-grace',
      hint: 'Emberwing Grace. +60% Oblivion this turn; +5 Radiance.',
    },
    {
      cardDefinitionId: 'hr-light-angelic-vision',
      hint: 'Thornhalo Vision. Draw 3 cards; the next plays are Sacred Memory, Divine Clarity, and Radiant Surge.',
    },
    {
      cardDefinitionId: 'hr-light-sacred-memory',
      hint: 'Ashen Remembrance. +4 Radiance.',
    },
    {
      cardDefinitionId: 'hr-light-divine-clarity',
      hint: 'Whiteflame Clarity. +4 Radiance.',
    },
    {
      cardDefinitionId: 'hr-light-radiant-surge',
      hint: 'Ember Surge. Build Radiance with setup Ophanim, then spend 25 on Emberchoir Seraphim for the burst finisher.',
    },
  ],
  guidedOpeningHand: [
    'ser-light-dawn',
    'ser-light-choir',
    'hr-light-mornings-grace',
    'hr-light-celestial-grace',
    'hr-light-angelic-vision',
  ],
  guidedDeckOrder: [
    // Splice fodder — first 5 mirror the opening hand 1:1 so the store's
    // indexOf+splice consumes these copies, leaving the true draw targets on top.
    d('ser-light-dawn', 1),
    d('ser-light-choir', 1),
    d('hr-light-mornings-grace', 1),
    d('hr-light-celestial-grace', 1),
    d('hr-light-angelic-vision', 1),
    // True top of deck after splice — drawn by step 5 (Angelic Vision draws 3):
    d('hr-light-sacred-memory', 1),   // step 6
    d('hr-light-divine-clarity', 1),  // step 7
    d('hr-light-radiant-surge', 1),   // step 8
    // Filler — 37 entries to reach 45 total:
    d('ser-light-dawn', 2),
    d('ser-light-choir', 2),
    d('ser-light-herald', 4),
    d('ser-light-vigil', 2),
    d('hr-light-divine-smite', 4),
    d('hr-light-holy-radiance', 4),
    d('hr-light-sacred-fury', 4),
    d('hr-light-luminous-strike', 4),
    d('hr-light-radiant-surge', 3),
    d('hr-light-angelic-wrath', 2),
    d('hr-light-celestial-grace', 2),
    d('hr-light-aureate-chain', 1),
    d('hr-light-celestial-scroll', 1),
    d('hr-light-mornings-grace', 2),
  ],
};

// ── Thornbound Plains ─────────────────────────────────────────────────────────
// Resource: Trail. Seraphim attacks cost 25 Trail; trial reaches 26 over 8
// steps via Cherubim bursts (Spitebloom 4 + Thornwake 6×2) + Red Veil + Tithe.
const thornboundTrial: TrialDeckDefinition = {
  packId: 'pack-thornbound-plains',
  displayName: 'Thornbound Plains — Trail',
  deckList: [
    d('tbp-ser-thornplate-sentry', 4),
    d('tbp-ser-bleak-march-duelist', 4),
    d('tbp-ser-vinedusk-lancer', 4),
    d('tbp-ser-scar-mantle-reclaimer', 2),
    d('tbp-cherubim-spitebloom-sink', 4),
    d('tbp-cherubim-thornwake-ditch', 4),
    d('tbp-cherubim-gallows-bramble', 3),
    d('tbp-ophanim-ashpath-forager', 3),
    d('tbp-ophanim-thorn-map-initiate', 4),
    d('tbp-ophanim-ragcloak-pilgrim', 3),
    d('tbp-ophanim-briar-tithe', 4),
    d('tbp-ophanim-red-veil-waystone', 4),
    d('tbp-ophanim-bloodvine-crossing', 4),
    d('tbp-ophanim-harrow-psalm', 3),
  ],
  extraDeck: [e('tbp-angel-irielle-bramble-gate')],
  guideSteps: [
    {
      cardDefinitionId: 'tbp-cherubim-spitebloom-sink',
      hint: 'Spitebloom Sink (Cherubim). On play: +4 Trail. Cherubim are the Trail engine — large upfront bursts feed the Seraphim attack cost. Trail: 4.',
    },
    {
      cardDefinitionId: 'tbp-cherubim-thornwake-ditch',
      hint: 'Thornwake Ditch (Cherubim). On play: +6 Trail — the big Cherubim payoff. Trail: 10.',
    },
    {
      cardDefinitionId: 'tbp-ophanim-ragcloak-pilgrim',
      hint: 'Ragcloak Pilgrim. +1 Trail, discard 1 then draw 2 — cycle dead cards into fresh Trail sources. Trail: 11.',
    },
    {
      cardDefinitionId: 'tbp-ophanim-red-veil-waystone',
      hint: 'Red Veil Waystone. +3 Trail, draw 1, +1.45× chain multiplier this turn. Trail: 14, with a damage amp banked for the attack.',
    },
    {
      cardDefinitionId: 'tbp-ophanim-briar-tithe',
      hint: 'Briar Tithe. +2 Trail then -1 Trail for a bonus then +3 Trail (net +4), draw 1. Trail: 18.',
    },
    {
      cardDefinitionId: 'tbp-cherubim-thornwake-ditch',
      hint: '(Drawn) Thornwake Ditch again. +6 Trail. Trail: 24.',
    },
    {
      cardDefinitionId: 'tbp-cherubim-gallows-bramble',
      hint: '(Drawn) Gallows Bramble (Cherubim). +2 Trail. Trail: 26.',
    },
    {
      cardDefinitionId: 'tbp-ser-thornplate-sentry',
      hint: '(Drawn) Thornplate Sentry (Seraphim). Core mechanic: Trail banking via Cherubim bursts and net-positive Ophanim conversion. Why it scales: repeated Trail injections outpace spends, and chain bonus amplifies the final hit. Exact payoff: click Thornplate Sentry → Unsynergized attack (spend 25 Trail) for the Trial finisher.',
    },
  ],
  guidedOpeningHand: [
    'tbp-cherubim-spitebloom-sink',
    'tbp-cherubim-thornwake-ditch',
    'tbp-ophanim-ragcloak-pilgrim',
    'tbp-ophanim-red-veil-waystone',
    'tbp-ophanim-briar-tithe',
  ],
  guidedDeckOrder: [
    // Splice fodder — mirror of opening hand (positions 1-5)
    d('tbp-cherubim-spitebloom-sink', 1),
    d('tbp-cherubim-thornwake-ditch', 1),
    d('tbp-ophanim-ragcloak-pilgrim', 1),
    d('tbp-ophanim-red-veil-waystone', 1),
    d('tbp-ophanim-briar-tithe', 1),
    // True top after splice (positions 6+) drawn by guide steps:
    d('tbp-cherubim-thornwake-ditch', 1),  // step 3 ragcloak draw 1st
    d('tbp-ser-thornplate-sentry', 1),     // step 3 ragcloak draw 2nd
    d('tbp-cherubim-gallows-bramble', 1),  // step 4 red-veil draw
    d('tbp-ophanim-bloodvine-crossing', 1), // step 5 briar-tithe draw (anything filler)
    // Filler — 36 entries to reach 45
    d('tbp-ser-thornplate-sentry', 3),
    d('tbp-ser-bleak-march-duelist', 4),
    d('tbp-ser-vinedusk-lancer', 4),
    d('tbp-ser-scar-mantle-reclaimer', 2),
    d('tbp-cherubim-spitebloom-sink', 2),
    d('tbp-cherubim-thornwake-ditch', 1),
    d('tbp-cherubim-gallows-bramble', 2),
    d('tbp-ophanim-ashpath-forager', 3),
    d('tbp-ophanim-thorn-map-initiate', 4),
    d('tbp-ophanim-ragcloak-pilgrim', 1),
    d('tbp-ophanim-briar-tithe', 2),
    d('tbp-ophanim-red-veil-waystone', 2),
    d('tbp-ophanim-bloodvine-crossing', 3),
    d('tbp-ophanim-harrow-psalm', 3),
  ],
};

// ── Mechanical Dreams ─────────────────────────────────────────────────────────
// Resource: Strain + Clock-Chime timing. Cogbound Aegis still spends 25 Strain,
// while the line demonstrates building Strain before a primed Chime attack turn.
const mechanicalTrial: TrialDeckDefinition = {
  packId: 'pack-mechanical-dreams',
  displayName: 'Mechanical Dreams — Strain',
  deckList: [
    d('md-ser-cogbound-aegis', 4),
    d('md-ser-steel-hymn-executor', 4),
    d('md-ser-dreamforge-lancer', 4),
    d('md-ser-ivory-null-operator', 2),
    d('md-cherubim-white-iron-chorus', 4),
    d('md-cherubim-dreambreak-turbine', 4),
    d('md-cherubim-rust-halo-chamber', 3),
    d('md-ophanim-gearwake-courier', 4),
    d('md-ophanim-brass-mind-litany', 4),
    d('md-ophanim-servo-divination', 4),
    d('md-ophanim-clockforge-chant', 4),
    d('md-ophanim-flareline-primer', 4),
    d('md-ophanim-directive-zero', 3),
    d('md-ophanim-furnace-sync', 2),
  ],
  extraDeck: [e('md-angel-ori9-broken-sleep')],
  guideSteps: [
    {
      cardDefinitionId: 'md-cherubim-white-iron-chorus',
      hint: 'White Iron Chorus (Cherubim). On play: +6 Strain and 1 Clock tick. Cherubim are your fuel cards; they set up stronger Chime bursts. Strain: 6.',
    },
    {
      cardDefinitionId: 'md-cherubim-rust-halo-chamber',
      hint: 'Rust Halo Chamber (Cherubim). On play: +7 Strain and 1 Clock tick. This is your biggest Strain jump before Chime. Strain: 13.',
    },
    {
      cardDefinitionId: 'md-cherubim-white-iron-chorus',
      hint: 'Second White Iron Chorus. Another +6 Strain and another tick. You are now set to cash the next Chime window. Strain: 19.',
    },
    {
      cardDefinitionId: 'md-ophanim-directive-zero',
      hint: 'Directive Zero. Search your deck for an Ophanim and gain +3 Strain — pick Flareline Primer. Strain: 22.',
    },
    {
      cardDefinitionId: 'md-ophanim-flareline-primer',
      hint: '(Searched) Flareline Primer. Gain +1 Strain and immediate Oblivion with a strain-threshold bonus. Strain: 23.',
    },
    {
      cardDefinitionId: 'md-ser-cogbound-aegis',
      hint: '(Opening hand) Cogbound Aegis (Seraphim). Core mechanic: build Strain, let Chime prime your next attack, then spend 25 Strain on the swing. Why it scales: Cherubim fuel raises Chime burst and attack value together. Exact payoff: click Cogbound Aegis and attack on a primed window for the closing Oblivion spike.',
    },
  ],
  guidedOpeningHand: [
    'md-cherubim-white-iron-chorus',
    'md-cherubim-rust-halo-chamber',
    'md-cherubim-white-iron-chorus',
    'md-ophanim-directive-zero',
    'md-ser-cogbound-aegis',
  ],
  guidedDeckOrder: [
    // Splice fodder — mirror of opening hand (positions 1-5)
    d('md-cherubim-white-iron-chorus', 1),
    d('md-cherubim-rust-halo-chamber', 1),
    d('md-cherubim-white-iron-chorus', 1),
    d('md-ophanim-directive-zero', 1),
    d('md-ser-cogbound-aegis', 1),
    // True top of deck after splice (positions 6+):
    d('md-ophanim-brass-mind-litany', 1),   // drawn by directive-zero (step 4)
    d('md-cherubim-rust-halo-chamber', 1),  // drawn by brass-mind (step 5)
    // Flareline Primer somewhere in deck for directive-zero search:
    d('md-ophanim-flareline-primer', 1),
    // Filler — 37 entries to reach 45
    d('md-ser-cogbound-aegis', 2),
    d('md-ser-steel-hymn-executor', 4),
    d('md-ser-dreamforge-lancer', 4),
    d('md-ser-ivory-null-operator', 2),
    d('md-cherubim-dreambreak-turbine', 4),
    d('md-ophanim-gearwake-courier', 4),
    d('md-ophanim-brass-mind-litany', 3),
    d('md-ophanim-servo-divination', 4),
    d('md-ophanim-clockforge-chant', 4),
    d('md-ophanim-flareline-primer', 3),
    d('md-ophanim-directive-zero', 1),
    d('md-ophanim-furnace-sync', 2),
  ],
};

// ── Prismatic Accord ──────────────────────────────────────────────────────────
const prismaticTrial: TrialDeckDefinition = {
  packId: 'pack-prismatic-accord',
  displayName: 'Prismatic — Refraction Depth & Prism Charge',
  deckList: [
    d('pa-ser-skyglass-veltharion', 4),
    d('pa-ser-plainshush-drossken', 4),
    d('pa-ser-mirrorback-mirshan', 4),
    d('pa-ser-stormmemory-veltharion', 2),
    d('pa-cherubim-mirrorfield-locus', 4),
    d('pa-cherubim-fracture-veil', 4),
    d('pa-cherubim-buried-prism-cache', 3),
    d('pa-ophanim-prismwake-glint', 4),
    d('pa-ophanim-fracture-road-reading', 4),
    d('pa-ophanim-drift-canopy-slip', 4),
    d('pa-ophanim-lightveil-ambush', 4),
    d('pa-ophanim-frozen-color-omen', 4),
    d('pa-ophanim-accord-reflection', 3),
    d('pa-ophanim-tide-mirror-convergence', 2),
  ],
  extraDeck: [e('pa-angel-aurelith-ninth-beam')],
  guideSteps: [
    {
      cardDefinitionId: 'pa-cherubim-mirrorfield-locus',
      hint: 'Place Mirrorfield Locus (Cherubim). On play: salvage an Ophanim. While active, adjacent Seraphim gain +8 Oblivion per card played. Use this as setup while you rotate channels to build Refraction Depth and Prism Charge.',
    },
    {
      cardDefinitionId: 'pa-ser-skyglass-veltharion',
      hint: 'Board Skyglass Veltharion (Seraphim). While active, each Ophanim grants +22 Oblivion. Its attack costs discarding 1 card. Build Depth first by switching channels, then use Ophanim to scale the swing.',
    },
    {
      cardDefinitionId: 'pa-ophanim-prismwake-glint',
      hint: 'Play Prismwake Glint for direct Oblivion and an Ophanim trigger on Veltharion. If you switched channels into this play, you also bank Prism Charge for later fixed-spend payoffs.',
    },
    {
      cardDefinitionId: 'pa-ophanim-fracture-road-reading',
      hint: 'Play Fracture Road Reading: look at the top 4 cards and take the best payoff enabler. Keep rotating channels; this turn pattern should raise both Refraction Depth and Prism Charge.',
    },
    {
      cardDefinitionId: 'pa-ophanim-drift-canopy-slip',
      hint: 'Play Drift Canopy Slip to cycle hand and trigger another Ophanim bonus. Then activate Veltharion: base damage plus stacked per-Ophanim pressure gets stronger when your setup maintained channel switching.',
    },
    {
      cardDefinitionId: 'pa-ophanim-accord-reflection',
      hint: 'Play Accord Reflection as your closer setup card. Core mechanic now is Depth + Prism Charge from channel switching, with Ophanim-triggered Seraphim scaling layered on top. Finish by firing Skyglass Veltharion to convert the full stack into one large burst.',
    },
  ],
  guidedOpeningHand: [
    'pa-cherubim-mirrorfield-locus',
    'pa-ser-skyglass-veltharion',
    'pa-ophanim-prismwake-glint',
    'pa-ophanim-fracture-road-reading',
    'pa-ophanim-drift-canopy-slip',
  ],
  guidedDeckOrder: [
    d('pa-ophanim-accord-reflection', 1),
    d('pa-ophanim-lightveil-ambush', 1),
    d('pa-ser-plainshush-drossken', 1),
    d('pa-cherubim-fracture-veil', 1),
    d('pa-ophanim-frozen-color-omen', 1),
    d('pa-ophanim-tide-mirror-convergence', 1),
    d('pa-ser-mirrorback-mirshan', 1),
    d('pa-cherubim-buried-prism-cache', 1),
    d('pa-ophanim-prismwake-glint', 1),
    d('pa-ophanim-fracture-road-reading', 1),
    d('pa-ser-stormmemory-veltharion', 1),
    d('pa-cherubim-mirrorfield-locus', 1),
    d('pa-ophanim-drift-canopy-slip', 1),
    d('pa-ophanim-accord-reflection', 1),
    d('pa-ser-skyglass-veltharion', 1),
    d('pa-ophanim-lightveil-ambush', 1),
    d('pa-cherubim-fracture-veil', 1),
    d('pa-ser-plainshush-drossken', 1),
    d('pa-ophanim-frozen-color-omen', 1),
    d('pa-ophanim-prismwake-glint', 1),
    d('pa-ser-mirrorback-mirshan', 1),
    d('pa-cherubim-buried-prism-cache', 1),
    d('pa-ophanim-fracture-road-reading', 1),
    d('pa-ophanim-tide-mirror-convergence', 1),
    d('pa-ser-skyglass-veltharion', 1),
    d('pa-ophanim-accord-reflection', 1),
    d('pa-cherubim-mirrorfield-locus', 1),
    d('pa-ser-stormmemory-veltharion', 1),
    d('pa-ophanim-lightveil-ambush', 1),
    d('pa-ophanim-drift-canopy-slip', 1),
    d('pa-ser-plainshush-drossken', 1),
    d('pa-ophanim-frozen-color-omen', 1),
    d('pa-cherubim-fracture-veil', 1),
    d('pa-ophanim-prismwake-glint', 1),
    d('pa-ser-mirrorback-mirshan', 1),
    d('pa-ophanim-fracture-road-reading', 1),
    d('pa-cherubim-buried-prism-cache', 1),
    d('pa-ser-skyglass-veltharion', 1),
    d('pa-cherubim-fracture-veil', 1),
    d('pa-ophanim-lightveil-ambush', 1),
    d('pa-ser-plainshush-drossken', 1),
    d('pa-cherubim-mirrorfield-locus', 1),
    d('pa-ophanim-frozen-color-omen', 1),
    d('pa-ser-mirrorback-mirshan', 1),
    d('pa-ophanim-drift-canopy-slip', 1),
  ],
};

// ── Black Glass Inferno ───────────────────────────────────────────────────────
const blackGlassTrial: TrialDeckDefinition = {
  packId: 'pack-black-glass-inferno',
  displayName: 'Black Glass Inferno — Monochromatic Shards',
  deckList: [
    d('bgi-ser-obsidian-choir', 4),
    d('bgi-ser-ashen-helix', 4),
    d('bgi-ser-rose-spine-drake', 4),
    d('bgi-ser-chromatic-ashwarden', 2),
    d('bgi-cherubim-glassrose-pyre', 4),
    d('bgi-cherubim-ashencourt-sigil', 4),
    d('bgi-cherubim-cinderborn-oath', 3),
    d('bgi-ophanim-cinder-litany', 4),
    d('bgi-ophanim-veilplane-shard', 4),
    d('bgi-ophanim-rose-echo', 4),
    d('bgi-ophanim-ashen-memory', 4),
    d('bgi-ophanim-sable-descent', 4),
    d('bgi-ophanim-chromatic-sorrow', 3),
    d('bgi-ophanim-bladewind-keening', 2),
  ],
  extraDeck: [e('bgi-angel-vaelthorax-undimmed')],
  guideSteps: [
    {
      cardDefinitionId: 'bgi-cherubim-glassrose-pyre',
      hint: 'Place Glassrose Pyre (Cherubim). On play: draw 2 and salvage an Ophanim. While active, adjacent Seraphim gain +8 Oblivion per card played, and Seraphim attacks receive a base bonus. Adjacency is the Black Glass structure — place Cherubim next to Seraphim to activate it.',
    },
    {
      cardDefinitionId: 'bgi-ser-obsidian-choir',
      hint: 'Board Obsidian Choir (Seraphim) adjacent to Glassrose Pyre. On play: draw 1 and gain 2 Monochromatic Shards. While active, +10 Oblivion per card played. With Glassrose Pyre adjacent, each card adds 18 Oblivion to the running total.',
    },
    {
      cardDefinitionId: 'bgi-ophanim-cinder-litany',
      hint: 'Play Cinder Litany: draw 1 and +25 Oblivion. Each Ophanim triggers Obsidian Choir\'s +10 per-card bonus and Glassrose Pyre\'s +8 adjacency bonus — two passive increments per card played.',
    },
    {
      cardDefinitionId: 'bgi-ophanim-ashen-memory',
      hint: 'Play Ashen Memory: +50 Oblivion immediately, plus draw 1 if it\'s the first card this turn. One of the highest direct-Oblivion Ophanim in the deck — play it early for the conditional draw.',
    },
    {
      cardDefinitionId: 'bgi-ophanim-rose-echo',
      hint: 'Play Rose Echo: discard 1, draw 2, gain 4 Monochromatic Shards. Activate Obsidian Choir\'s attack (cost: discard 1) — base 235 Oblivion plus all per-card bonuses accumulated this turn from both Glassrose Pyre and Obsidian Choir.',
    },
    {
      cardDefinitionId: 'bgi-ophanim-sable-descent',
      hint: 'Play Sable Descent. Core mechanic: adjacency stacking between Cherubim and Seraphim. Why it scales: each card play repeatedly triggers both adjacency and Seraphim per-card bonuses. Exact payoff: click Obsidian Choir → Attack (discard 1) to cash the compounded board for a large burst.',
    },
  ],
  guidedOpeningHand: [
    'bgi-cherubim-glassrose-pyre',
    'bgi-ser-obsidian-choir',
    'bgi-ophanim-cinder-litany',
    'bgi-ophanim-ashen-memory',
    'bgi-ophanim-rose-echo',
  ],
  guidedDeckOrder: [
    d('bgi-ophanim-sable-descent', 1),
    d('bgi-ophanim-veilplane-shard', 1),
    d('bgi-ser-ashen-helix', 1),
    d('bgi-cherubim-ashencourt-sigil', 1),
    d('bgi-ophanim-chromatic-sorrow', 1),
    d('bgi-ophanim-bladewind-keening', 1),
    d('bgi-ser-rose-spine-drake', 1),
    d('bgi-cherubim-cinderborn-oath', 1),
    d('bgi-ophanim-cinder-litany', 1),
    d('bgi-ophanim-ashen-memory', 1),
    d('bgi-ser-chromatic-ashwarden', 1),
    d('bgi-cherubim-glassrose-pyre', 1),
    d('bgi-ophanim-rose-echo', 1),
    d('bgi-ophanim-sable-descent', 1),
    d('bgi-ser-obsidian-choir', 1),
    d('bgi-ophanim-veilplane-shard', 1),
    d('bgi-cherubim-ashencourt-sigil', 1),
    d('bgi-ser-ashen-helix', 1),
    d('bgi-ophanim-chromatic-sorrow', 1),
    d('bgi-ophanim-cinder-litany', 1),
    d('bgi-ser-rose-spine-drake', 1),
    d('bgi-cherubim-cinderborn-oath', 1),
    d('bgi-ophanim-ashen-memory', 1),
    d('bgi-ophanim-bladewind-keening', 1),
    d('bgi-ser-obsidian-choir', 1),
    d('bgi-ophanim-sable-descent', 1),
    d('bgi-cherubim-glassrose-pyre', 1),
    d('bgi-ser-chromatic-ashwarden', 1),
    d('bgi-ophanim-veilplane-shard', 1),
    d('bgi-ophanim-rose-echo', 1),
    d('bgi-ser-ashen-helix', 1),
    d('bgi-ophanim-chromatic-sorrow', 1),
    d('bgi-cherubim-ashencourt-sigil', 1),
    d('bgi-ophanim-cinder-litany', 1),
    d('bgi-ser-rose-spine-drake', 1),
    d('bgi-ophanim-ashen-memory', 1),
    d('bgi-cherubim-cinderborn-oath', 1),
    d('bgi-ser-obsidian-choir', 1),
    d('bgi-ophanim-sable-descent', 1),
    d('bgi-ophanim-veilplane-shard', 1),
    d('bgi-ser-ashen-helix', 1),
    d('bgi-cherubim-glassrose-pyre', 1),
    d('bgi-ophanim-rose-echo', 1),
    d('bgi-ser-rose-spine-drake', 1),
    d('bgi-cherubim-ashencourt-sigil', 1),
  ],
};

// ── Snowbound Voltage ─────────────────────────────────────────────────────────
// Resource: Arctic Charge accumulation + Glacier Relay attack (discard-1 cost,
// no Strain required). 8 steps reach ~30+ Arctic Charge before the attack.
const snowboundTrial: TrialDeckDefinition = {
  packId: 'pack-snowbound-voltage',
  displayName: 'Snowbound Voltage — Arctic Charge',
  deckList: [
    d('sv-ser-frostcoil', 4),
    d('sv-ser-static-sleet', 4),
    d('sv-ser-glacier-relay', 4),
    d('sv-ser-icegrid', 2),
    d('sv-cher-polar-sanctum', 4),
    d('sv-cher-first-whiteout', 4),
    d('sv-cher-cryoscale-engine', 3),
    d('sv-oph-sleetline-highway', 4),
    d('sv-oph-glacier-abyss', 4),
    d('sv-oph-static-archive', 4),
    d('sv-oph-signal-collapse', 4),
    d('sv-oph-first-static', 4),
    d('sv-oph-aurora-convergence', 3),
    d('sv-oph-frostwalker-neis', 2),
  ],
  extraDeck: [e('sv-angel-overcurrent-chorus')],
  guideSteps: [
    {
      cardDefinitionId: 'sv-cher-polar-sanctum',
      hint: 'Polar Sanctum (Frost Cherubim). +4 Strain, +8 Arctic Charge. Start by banking charge instead of rushing payoff. AC: 8.',
    },
    {
      cardDefinitionId: 'sv-oph-first-static',
      hint: 'The First Static (Voltage). +3 Strain, empower the next card, then discharge. It is a spender, not a builder.',
    },
    {
      cardDefinitionId: 'sv-oph-sleetline-highway',
      hint: 'The Sleetline Highway (Frost). +2 Strain, draw 1, +6 Arctic Charge. Frost cards are the battery builders. AC: 14.',
    },
    {
      cardDefinitionId: 'sv-oph-signal-collapse',
      hint: 'The Signal Collapse (Frost). Draw 2, shuffle discard, +8 Arctic Charge. Use it to refill hand and battery together. AC: 22.',
    },
    {
      cardDefinitionId: 'sv-ser-frostcoil',
      hint: '(Drawn) Frostcoil (Frost Seraphim). +1 Strain, +6 Arctic Charge. While active, every follow-up card gets extra Oblivion. AC: 28.',
    },
    {
      cardDefinitionId: 'sv-oph-static-archive',
      hint: '(Drawn) The Static Archive (Frost). +2 Radiance, draw 1, +6 Arctic Charge. Keep building before the real Voltage release. AC: 34.',
    },
    {
      cardDefinitionId: 'sv-oph-glacier-abyss',
      hint: '(Drawn) The Glacier Abyss (Voltage). +2 Strain, +3 Arctic Charge, +60 Oblivion, then discharge Arctic Charge. This is the cashout turn.',
    },
    {
      cardDefinitionId: 'sv-ser-glacier-relay',
      hint: '(In hand) Glacier Relay (Frost Seraphim). The set is no longer about hidden Potential math: Frost cards load Arctic Charge, Voltage cards release it. Use this line to feel the battery pattern directly.',
    },
  ],
  guidedOpeningHand: [
    'sv-cher-polar-sanctum',
    'sv-oph-first-static',
    'sv-oph-sleetline-highway',
    'sv-oph-signal-collapse',
    'sv-ser-glacier-relay',
  ],
  guidedDeckOrder: [
    // Splice fodder — mirror of opening hand (positions 1-5)
    d('sv-cher-polar-sanctum', 1),
    d('sv-oph-first-static', 1),
    d('sv-oph-sleetline-highway', 1),
    d('sv-oph-signal-collapse', 1),
    d('sv-ser-glacier-relay', 1),
    // True top after splice (positions 6+) drawn by guide steps:
    d('sv-ser-frostcoil', 1),         // step 3 sleetline draw
    d('sv-oph-static-archive', 1),    // step 4 signal-collapse draw 1
    d('sv-oph-glacier-abyss', 1),     // step 4 signal-collapse draw 2
    d('sv-oph-frostwalker-neis', 1),  // step 6 static-archive draw
    d('sv-cher-cryoscale-engine', 1), // step 7 glacier-abyss draw
    // Filler — 35 entries to reach 45
    d('sv-ser-frostcoil', 3),
    d('sv-ser-static-sleet', 4),
    d('sv-ser-glacier-relay', 2),
    d('sv-ser-icegrid', 2),
    d('sv-cher-polar-sanctum', 2),
    d('sv-cher-first-whiteout', 4),
    d('sv-cher-cryoscale-engine', 2),
    d('sv-oph-sleetline-highway', 2),
    d('sv-oph-glacier-abyss', 3),
    d('sv-oph-static-archive', 3),
    d('sv-oph-signal-collapse', 2),
    d('sv-oph-first-static', 2),
    d('sv-oph-aurora-convergence', 3),
    d('sv-oph-frostwalker-neis', 1),
  ],
};

// ── Glass Absolute ────────────────────────────────────────────────────────────
const glassAbsoluteTrial: TrialDeckDefinition = {
  packId: 'pack-glass-absolute',
  displayName: 'Glass Absolute — Fragments',
  deckList: [
    d('ga-ser-prismwake', 4),
    d('ga-ser-lattice-canticle', 4),
    d('ga-ser-white-edge', 4),
    d('ga-ser-glass-hymn', 2),
    d('ga-cher-mirrorbody-archivist', 4),
    d('ga-cher-facet-gate-ward', 4),
    d('ga-cher-prismatic-reliquary', 3),
    d('ga-oph-spectral-current', 4),
    d('ga-oph-triune-prism-flow', 4),
    d('ga-oph-glassroad-oracle', 4),
    d('ga-oph-radiant-splinter-map', 4),
    d('ga-oph-lumen-cascade', 4),
    d('ga-oph-crystal-echo-archive', 3),
    d('ga-oph-white-transit', 2),
  ],
  extraDeck: [],
  guideSteps: [
    {
      cardDefinitionId: 'ga-cher-mirrorbody-archivist',
      hint: 'Place Mirrorbody Archivist (Cherubim). On play: draw 1. While active, adjacent Seraphim gain +28 Oblivion per card played, so this is your first board-pressure anchor.',
    },
    {
      cardDefinitionId: 'ga-ser-prismwake',
      hint: 'Board Prismwake (Seraphim) adjacent to Mirrorbody Archivist. With both active, each card played generates strong per-card Oblivion pressure while you build fragment tiers.',
    },
    {
      cardDefinitionId: 'ga-oph-spectral-current',
      hint: 'Play Spectral Current to draw and keep the turn moving. Base Glass scales from fragment count and formation tiers, so velocity matters more than side resources.',
    },
    {
      cardDefinitionId: 'ga-oph-triune-prism-flow',
      hint: 'Play Triune Prism Flow: look at the top 5 cards — take Lumen Cascade plus one other setup or payoff piece to keep dense formation online.',
    },
    {
      cardDefinitionId: 'ga-oph-glassroad-oracle',
      hint: 'Play Glassroad Oracle to salvage and draw, then attack with Prismwake (discard 1). Cash attacks after your fragment tiers are already online.',
    },
    {
      cardDefinitionId: 'ga-oph-lumen-cascade',
      hint: 'Play Lumen Cascade (draw 3 + empower). Core mechanic: fragment density first, attack cashout second. Once you hit 5+ fragments, empowered Seraphim attacks are your burst window.',
    },
  ],
  guidedOpeningHand: [
    'ga-cher-mirrorbody-archivist',
    'ga-ser-prismwake',
    'ga-oph-spectral-current',
    'ga-oph-triune-prism-flow',
    'ga-oph-glassroad-oracle',
  ],
  guidedDeckOrder: [
    d('ga-oph-lumen-cascade', 1),
    d('ga-oph-radiant-splinter-map', 1),
    d('ga-ser-lattice-canticle', 1),
    d('ga-cher-facet-gate-ward', 1),
    d('ga-oph-crystal-echo-archive', 1),
    d('ga-oph-white-transit', 1),
    d('ga-ser-white-edge', 1),
    d('ga-cher-prismatic-reliquary', 1),
    d('ga-oph-spectral-current', 1),
    d('ga-oph-triune-prism-flow', 1),
    d('ga-ser-glass-hymn', 1),
    d('ga-cher-mirrorbody-archivist', 1),
    d('ga-oph-glassroad-oracle', 1),
    d('ga-oph-lumen-cascade', 1),
    d('ga-ser-prismwake', 1),
    d('ga-oph-radiant-splinter-map', 1),
    d('ga-cher-facet-gate-ward', 1),
    d('ga-ser-lattice-canticle', 1),
    d('ga-oph-crystal-echo-archive', 1),
    d('ga-oph-spectral-current', 1),
    d('ga-ser-white-edge', 1),
    d('ga-cher-prismatic-reliquary', 1),
    d('ga-oph-triune-prism-flow', 1),
    d('ga-oph-white-transit', 1),
    d('ga-ser-prismwake', 1),
    d('ga-oph-lumen-cascade', 1),
    d('ga-cher-mirrorbody-archivist', 1),
    d('ga-ser-glass-hymn', 1),
    d('ga-oph-radiant-splinter-map', 1),
    d('ga-oph-glassroad-oracle', 1),
    d('ga-ser-lattice-canticle', 1),
    d('ga-oph-crystal-echo-archive', 1),
    d('ga-cher-facet-gate-ward', 1),
    d('ga-oph-spectral-current', 1),
    d('ga-ser-white-edge', 1),
    d('ga-oph-triune-prism-flow', 1),
    d('ga-cher-prismatic-reliquary', 1),
    d('ga-ser-prismwake', 1),
    d('ga-oph-lumen-cascade', 1),
    d('ga-oph-radiant-splinter-map', 1),
    d('ga-ser-lattice-canticle', 1),
    d('ga-cher-mirrorbody-archivist', 1),
    d('ga-cher-facet-gate-ward', 1),
    d('ga-ser-white-edge', 1),
    d('ga-oph-glassroad-oracle', 1),
  ],
};

// ── Blazing Garden ────────────────────────────────────────────────────────────
const blazingGardenTrial: TrialDeckDefinition = {
  packId: 'pack-blazing-garden',
  displayName: 'Blazing Garden — Burn, Grove & Echo',
  deckList: [
    d('bg-ser-serevathi-ember-spiral', 4),
    d('bg-ser-aureveth-noon-petal', 4),
    d('bg-ser-vethkorath-starspine', 4),
    d('bg-ser-embergrove-cantor', 2),
    d('bg-cher-root-lantern-attendant', 4),
    d('bg-cher-auric-floret-keeper', 4),
    d('bg-cher-thistleproof-chorister', 3),
    d('bg-oph-petal-route-initiate', 4),
    d('bg-oph-sunvein-wayfinder', 4),
    d('bg-oph-violet-crown-drift', 4),
    d('bg-oph-embergrove-cartographer', 4),
    d('bg-oph-rootflare-transit', 4),
    d('bg-oph-spiral-memory-bloom', 3),
    d('bg-oph-chordbearing-migration', 2),
  ],
  extraDeck: [],
  guideSteps: [
    {
      cardDefinitionId: 'bg-cher-root-lantern-attendant',
      hint: 'Place Root Lantern Attendant (Cherubim). On play: draw 1. While active, adjacent Seraphim gain +24 Oblivion per card played. Position it next to your primary Seraphim slot — every card you play this turn adds 24 Oblivion to the Seraphim\'s running total.',
    },
    {
      cardDefinitionId: 'bg-ser-serevathi-ember-spiral',
      hint: 'Board Serevathi Ember Spiral (Seraphim). On play: draw 1 and gain 4 Bloom. This is base Blazing Garden setup: build Bloom, keep Burn units online, and start preparing your Grove and Echo cycle.',
    },
    {
      cardDefinitionId: 'bg-oph-petal-route-initiate',
      hint: 'Play Petal Route Initiate: draw 1, gain 3 Bloom. Root Lantern fires +24 adjacency bonus. After one card, you\'ve advanced Bloom pressure, card velocity, and Seraphim scaling together.',
    },
    {
      cardDefinitionId: 'bg-oph-sunvein-wayfinder',
      hint: 'Play Sunvein Wayfinder: look at the top 5 cards — **take Spiral Memory Bloom** plus 1 other (Violet Crown Drift if offered). Spiral Memory Bloom is required for the final replay + Empower burst.',
    },
    {
      cardDefinitionId: 'bg-oph-embergrove-cartographer',
      hint: 'Play Embergrove Cartographer: salvage any 1 card, draw 1. Reclaim a key Ophanim from the discard and keep the draw engine running.',
    },
    {
      cardDefinitionId: 'bg-oph-spiral-memory-bloom',
      hint: 'Play Spiral Memory Bloom. Core mechanic: Bloom plus replay chaining to extend Burn/Grove setup. Why it scales: replay effects add extra triggers while adjacency keeps raising attack value. Exact payoff: click Serevathi Ember Spiral → Attack (discard 1) for the Trial finisher burst.',
    },
  ],
  guidedOpeningHand: [
    'bg-cher-root-lantern-attendant',
    'bg-ser-serevathi-ember-spiral',
    'bg-oph-petal-route-initiate',
    'bg-oph-sunvein-wayfinder',
    'bg-oph-embergrove-cartographer',
  ],
  guidedDeckOrder: [
    d('bg-oph-spiral-memory-bloom', 1),
    d('bg-oph-violet-crown-drift', 1),
    d('bg-ser-aureveth-noon-petal', 1),
    d('bg-cher-auric-floret-keeper', 1),
    d('bg-oph-rootflare-transit', 1),
    d('bg-oph-chordbearing-migration', 1),
    d('bg-ser-vethkorath-starspine', 1),
    d('bg-cher-thistleproof-chorister', 1),
    d('bg-oph-petal-route-initiate', 1),
    d('bg-oph-sunvein-wayfinder', 1),
    d('bg-ser-embergrove-cantor', 1),
    d('bg-cher-root-lantern-attendant', 1),
    d('bg-oph-embergrove-cartographer', 1),
    d('bg-oph-spiral-memory-bloom', 1),
    d('bg-ser-serevathi-ember-spiral', 1),
    d('bg-oph-violet-crown-drift', 1),
    d('bg-cher-auric-floret-keeper', 1),
    d('bg-ser-aureveth-noon-petal', 1),
    d('bg-oph-rootflare-transit', 1),
    d('bg-oph-petal-route-initiate', 1),
    d('bg-ser-vethkorath-starspine', 1),
    d('bg-cher-thistleproof-chorister', 1),
    d('bg-oph-sunvein-wayfinder', 1),
    d('bg-oph-chordbearing-migration', 1),
    d('bg-ser-serevathi-ember-spiral', 1),
    d('bg-ser-vethkorath-starspine', 1),
    d('bg-cher-root-lantern-attendant', 1),
    d('bg-ser-embergrove-cantor', 1),
    d('bg-oph-violet-crown-drift', 1),
    d('bg-oph-embergrove-cartographer', 1),
    d('bg-ser-aureveth-noon-petal', 1),
    d('bg-oph-rootflare-transit', 1),
    d('bg-cher-auric-floret-keeper', 1),
    d('bg-oph-petal-route-initiate', 1),
    d('bg-ser-vethkorath-starspine', 1),
    d('bg-oph-sunvein-wayfinder', 1),
    d('bg-cher-thistleproof-chorister', 1),
    d('bg-ser-serevathi-ember-spiral', 1),
    d('bg-oph-spiral-memory-bloom', 1),
    d('bg-oph-violet-crown-drift', 1),
    d('bg-ser-aureveth-noon-petal', 1),
    d('bg-cher-root-lantern-attendant', 1),
    d('bg-oph-embergrove-cartographer', 1),
    d('bg-cher-auric-floret-keeper', 1),
    d('bg-oph-rootflare-transit', 1),
  ],
};

// ── Age of the Butterfly ──────────────────────────────────────────────────────
const butterflyTrial: TrialDeckDefinition = {
  packId: 'pack-age-of-the-butterfly',
  displayName: 'Age of the Butterfly — Flutter Formation + Wing Resonance',
  deckList: [
    d('bf-ser-unfurling-cantor', 4),
    d('bf-ser-ferrathi-iron-hum', 4),
    d('bf-ser-vethkai-clear-arc', 4),
    d('bf-ser-mireth-lenshost', 2),
    d('bf-cher-mireth-flutterlings', 4),
    d('bf-cher-copper-bank-spark', 4),
    d('bf-cher-echo-shed-lamina', 3),
    d('bf-oph-ridge-trace', 4),
    d('bf-oph-lens-current', 4),
    d('bf-oph-copper-green-trail', 4),
    d('bf-oph-crystal-ornament-route', 4),
    d('bf-oph-suppression-wake', 4),
    d('bf-oph-electromagnetic-arrival', 3),
    d('bf-oph-midair-citadel', 2),
  ],
  extraDeck: [e('bf-angel-meadow-navigator')],
  guideSteps: [
    {
      cardDefinitionId: 'bf-cher-mireth-flutterlings',
      hint: 'Place Mireth Flutterlings (Cherubim). It gains Spectrum and draws on entry. It also logs your Cherubim Formation type for this cycle and fuels your hand through adjacent Seraphim draw support.',
    },
    {
      cardDefinitionId: 'bf-ser-unfurling-cantor',
      hint: 'Board Unfurling Cantor (Seraphim). On play it gains Spectrum and draws. It logs your Seraphim Formation type and grants +8 Oblivion per card played while active.',
    },
    {
      cardDefinitionId: 'bf-oph-lens-current',
      hint: 'Play Lens Current. It logs your Ophanim Formation type, gains Spectrum, and filters the top 3 cards — **take Midair Citadel** for your first release payoff line.',
    },
    {
      cardDefinitionId: 'bf-oph-ridge-trace',
      hint: 'Play Ridge Trace: +2 Spectrum and draw 1. Ophanim accelerate Flutter climb, helping you reach the 4 and 8 thresholds before your release turn.',
    },
    {
      cardDefinitionId: 'bf-oph-crystal-ornament-route',
      hint: 'Play Crystal Ornament Route: +3 Spectrum and draw 2. Use this to stabilize hand size while pushing toward major-tier Flutter.',
    },
    {
      cardDefinitionId: 'bf-oph-midair-citadel',
      hint: 'Play Midair Citadel. Core mechanic: threshold climb then Release conversion. Resolve the release after your Formation types are online, then attack with Unfurling Cantor for the layered finisher.',
    },
  ],
  guidedOpeningHand: [
    'bf-cher-mireth-flutterlings',
    'bf-ser-unfurling-cantor',
    'bf-oph-lens-current',
    'bf-oph-ridge-trace',
    'bf-oph-crystal-ornament-route',
  ],
  guidedDeckOrder: [
    d('bf-oph-midair-citadel', 1),
    d('bf-oph-electromagnetic-arrival', 1),
    d('bf-ser-ferrathi-iron-hum', 1),
    d('bf-cher-copper-bank-spark', 1),
    d('bf-oph-suppression-wake', 1),
    d('bf-oph-copper-green-trail', 1),
    d('bf-ser-vethkai-clear-arc', 1),
    d('bf-cher-echo-shed-lamina', 1),
    d('bf-oph-ridge-trace', 1),
    d('bf-oph-lens-current', 1),
    d('bf-ser-mireth-lenshost', 1),
    d('bf-cher-mireth-flutterlings', 1),
    d('bf-oph-crystal-ornament-route', 1),
    d('bf-oph-midair-citadel', 1),
    d('bf-ser-unfurling-cantor', 1),
    d('bf-oph-electromagnetic-arrival', 1),
    d('bf-cher-copper-bank-spark', 1),
    d('bf-ser-ferrathi-iron-hum', 1),
    d('bf-oph-suppression-wake', 1),
    d('bf-oph-ridge-trace', 1),
    d('bf-ser-vethkai-clear-arc', 1),
    d('bf-cher-echo-shed-lamina', 1),
    d('bf-oph-lens-current', 1),
    d('bf-oph-copper-green-trail', 1),
    d('bf-ser-unfurling-cantor', 1),
    d('bf-oph-crystal-ornament-route', 1),
    d('bf-cher-mireth-flutterlings', 1),
    d('bf-ser-mireth-lenshost', 1),
    d('bf-oph-electromagnetic-arrival', 1),
    d('bf-oph-suppression-wake', 1),
    d('bf-ser-ferrathi-iron-hum', 1),
    d('bf-oph-copper-green-trail', 1),
    d('bf-cher-copper-bank-spark', 1),
    d('bf-oph-ridge-trace', 1),
    d('bf-ser-vethkai-clear-arc', 1),
    d('bf-oph-lens-current', 1),
    d('bf-cher-echo-shed-lamina', 1),
    d('bf-ser-unfurling-cantor', 1),
    d('bf-oph-crystal-ornament-route', 1),
    d('bf-oph-suppression-wake', 1),
    d('bf-ser-ferrathi-iron-hum', 1),
    d('bf-cher-mireth-flutterlings', 1),
    d('bf-oph-copper-green-trail', 1),
    d('bf-ser-vethkai-clear-arc', 1),
    d('bf-cher-copper-bank-spark', 1),
  ],
};

// ── Eternal Seas ──────────────────────────────────────────────────────────────
const eternalSeasTrial: TrialDeckDefinition = {
  packId: 'pack-eternal-seas',
  displayName: 'Eternal Seas — Undertow & Foam',
  deckList: [
    d('es-ser-velthiri-bloomschool', 4),
    d('es-ser-kethavar-helixhunter', 4),
    d('es-ser-surevaan-tiltborne', 4),
    d('es-ser-thyrvaan-fractalbreath', 2),
    d('es-cher-silver-shallow-attendant', 4),
    d('es-cher-blackzone-lamplure', 4),
    d('es-cher-neon-cell-cantor', 3),
    d('es-oph-shallows-spiral-map', 4),
    d('es-oph-veilmargin-crossflow', 4),
    d('es-oph-whitewater-cant', 4),
    d('es-oph-blackwater-cant', 4),
    d('es-oph-neon-pressure-line', 4),
    d('es-oph-thyrvaan-net-expansion', 3),
    d('es-oph-depthless-sounding', 2),
  ],
  extraDeck: [e('es-angel-veilmargin-cartographer')],
  guideSteps: [
    {
      cardDefinitionId: 'es-cher-silver-shallow-attendant',
      hint: 'Place Silver Shallow Attendant (Cherubim). It gives 2 Undertow and 1 Foam. Its passive makes each adjacent active Seraphim give an extra card per play — the refill engine that keeps your Undertow turn moving.',
    },
    {
      cardDefinitionId: 'es-ser-velthiri-bloomschool',
      hint: 'Board Velthiri Bloomschool (Seraphim). On play it gives 2 Undertow, 1 Foam, and draws 1. While on board: +8 Oblivion per card played. Start loading Undertow before your release cards come down.',
    },
    {
      cardDefinitionId: 'es-oph-veilmargin-crossflow',
      hint: 'Play Veilmargin Crossflow. It gives 2 Undertow and 2 Foam in one clean setup play. This is one of the easiest ways to move both the main pool and the light draw-support pool forward together.',
    },
    {
      cardDefinitionId: 'es-oph-whitewater-cant',
      hint: 'Play Whitewater Cant: +3 Undertow, +1 Foam, draw 1. This is the kind of setup card you want before your first release because it advances both pools without slowing hand flow.',
    },
    {
      cardDefinitionId: 'es-oph-blackwater-cant',
      hint: 'Play Blackwater Cant: +3 Undertow, +1 Foam, +150 Oblivion. It keeps the turn dense by mixing setup with immediate pressure instead of asking for polarity maintenance.',
    },
    {
      cardDefinitionId: 'es-oph-depthless-sounding',
      hint: 'Play Depthless Sounding. It converts a loaded Undertow pool into burst and also skims Foam while spending. Exact payoff: build Undertow first, fire Depthless Sounding, then click the 5-Foam HUD draw only if you need one more extender before the finishing attack.',
    },
  ],
  guidedOpeningHand: [
    'es-cher-silver-shallow-attendant',
    'es-ser-velthiri-bloomschool',
    'es-oph-veilmargin-crossflow',
    'es-oph-whitewater-cant',
    'es-oph-blackwater-cant',
  ],
  guidedDeckOrder: [
    d('es-oph-depthless-sounding', 1),
    d('es-oph-neon-pressure-line', 1),
    d('es-ser-kethavar-helixhunter', 1),
    d('es-cher-blackzone-lamplure', 1),
    d('es-oph-thyrvaan-net-expansion', 1),
    d('es-oph-shallows-spiral-map', 1),
    d('es-ser-surevaan-tiltborne', 1),
    d('es-cher-neon-cell-cantor', 1),
    d('es-oph-veilmargin-crossflow', 1),
    d('es-oph-whitewater-cant', 1),
    d('es-ser-thyrvaan-fractalbreath', 1),
    d('es-cher-silver-shallow-attendant', 1),
    d('es-oph-blackwater-cant', 1),
    d('es-oph-depthless-sounding', 1),
    d('es-ser-velthiri-bloomschool', 1),
    d('es-oph-neon-pressure-line', 1),
    d('es-cher-blackzone-lamplure', 1),
    d('es-ser-kethavar-helixhunter', 1),
    d('es-oph-thyrvaan-net-expansion', 1),
    d('es-oph-veilmargin-crossflow', 1),
    d('es-ser-surevaan-tiltborne', 1),
    d('es-cher-neon-cell-cantor', 1),
    d('es-oph-whitewater-cant', 1),
    d('es-oph-shallows-spiral-map', 1),
    d('es-ser-velthiri-bloomschool', 1),
    d('es-oph-blackwater-cant', 1),
    d('es-cher-silver-shallow-attendant', 1),
    d('es-ser-thyrvaan-fractalbreath', 1),
    d('es-oph-neon-pressure-line', 1),
    d('es-oph-thyrvaan-net-expansion', 1),
    d('es-ser-kethavar-helixhunter', 1),
    d('es-oph-shallows-spiral-map', 1),
    d('es-cher-blackzone-lamplure', 1),
    d('es-oph-veilmargin-crossflow', 1),
    d('es-ser-surevaan-tiltborne', 1),
    d('es-oph-whitewater-cant', 1),
    d('es-cher-neon-cell-cantor', 1),
    d('es-ser-velthiri-bloomschool', 1),
    d('es-oph-blackwater-cant', 1),
    d('es-oph-neon-pressure-line', 1),
    d('es-ser-kethavar-helixhunter', 1),
    d('es-cher-silver-shallow-attendant', 1),
    d('es-oph-shallows-spiral-map', 1),
    d('es-ser-surevaan-tiltborne', 1),
    d('es-cher-blackzone-lamplure', 1),
  ],
};

// ── Abyssal Forge ─────────────────────────────────────────────────────────────
const abyssalForgeTrial: TrialDeckDefinition = {
  packId: 'pack-abyssal-forge',
  displayName: 'Abyssal Forge — Recasts, Pearls, and Imprint',
  deckList: [
    d('af-ser-lampfin-minnow-choir', 4),
    d('af-ser-slagback-crawler', 4),
    d('af-ser-helith-nun-saffron-eel', 4),
    d('af-ser-coalfin-pilgrim-shark', 2),
    d('af-cher-bellows-acolyte', 4),
    d('af-cher-apprentice-lampwright', 4),
    d('af-cher-nacre-touched-initiate', 3),
    d('af-oph-saffron-ember-wheel', 4),
    d('af-oph-cobalt-ember-wheel', 4),
    d('af-oph-forge-wheel-sigil', 4),
    d('af-oph-quenching-ring', 4),
    d('af-oph-chromatic-ember-cluster', 4),
    d('af-oph-anvilstorm-halo', 3),
    d('af-oph-crown-of-the-forge-beneath', 2),
  ],
  extraDeck: [],
  guideSteps: [
    {
      cardDefinitionId: 'af-cher-bellows-acolyte',
      hint: 'Place Bellows Acolyte (Cherubim). Gains 1 Reforge Charge on entry; passively generates 1 Charge every 3 cards you play and buffs all attacks +18 Oblivion. Those Charges power every Recast in this deck, so sustain generation early.',
    },
    {
      cardDefinitionId: 'af-ser-lampfin-minnow-choir',
      hint: 'Board Lampfin Minnow Choir (Seraphim). On play: +1 Reforge Charge and draw 1. While on board: +10 Oblivion per card you play. More Seraphim means more compound Charge generation.',
    },
    {
      cardDefinitionId: 'af-oph-cobalt-ember-wheel',
      hint: 'Play Cobalt Ember Wheel: drop 2 Pearls. Pearls accumulate toward the Anvilstorm Halo cashout, and each Pearl is worth +100 Oblivion when spent. Drop them early and often.',
    },
    {
      cardDefinitionId: 'af-oph-forge-wheel-sigil',
      hint: 'Play Forge Wheel Sigil: +1 Reforge Charge, Recast the last card at 50% power, draw 1. The Recast fires Cobalt Ember Wheel again at half value, dropping an extra Pearl. This is the Forge loop: play, Recast, and gain more Pearls.',
    },
    {
      cardDefinitionId: 'af-oph-chromatic-ember-cluster',
      hint: 'Play Chromatic Ember Cluster: Recast the last 2 cards at 75% power and drop 1 Pearl. Both prior plays echo at 75%, chaining Pearl drops. Nacre-touched Initiate adds +0.5 Pearl per Recast passively too.',
    },
    {
      cardDefinitionId: 'af-oph-anvilstorm-halo',
      hint: 'Play Anvilstorm Halo. Core base mechanic: Pearl generation via Recast loops. Why it scales: recasts duplicate prior value, rapidly increasing Pearls before cashout. Exact payoff: cash Anvilstorm Halo Pearls, then click Lampfin Minnow Choir → Attack to finish the turn with a massive spike. Higher-rarity Abyssal cards keep this base loop but add Imprint as the shared Eternal/Infinite overlay.',
    },
  ],
  guidedOpeningHand: [
    'af-cher-bellows-acolyte',
    'af-ser-lampfin-minnow-choir',
    'af-oph-cobalt-ember-wheel',
    'af-oph-forge-wheel-sigil',
    'af-oph-chromatic-ember-cluster',
  ],
  guidedDeckOrder: [
    d('af-oph-anvilstorm-halo', 1),
    d('af-oph-crown-of-the-forge-beneath', 1),
    d('af-ser-slagback-crawler', 1),
    d('af-cher-apprentice-lampwright', 1),
    d('af-oph-quenching-ring', 1),
    d('af-oph-saffron-ember-wheel', 1),
    d('af-ser-helith-nun-saffron-eel', 1),
    d('af-cher-nacre-touched-initiate', 1),
    d('af-oph-cobalt-ember-wheel', 1),
    d('af-oph-forge-wheel-sigil', 1),
    d('af-ser-coalfin-pilgrim-shark', 1),
    d('af-cher-bellows-acolyte', 1),
    d('af-oph-chromatic-ember-cluster', 1),
    d('af-oph-anvilstorm-halo', 1),
    d('af-ser-lampfin-minnow-choir', 1),
    d('af-oph-crown-of-the-forge-beneath', 1),
    d('af-cher-apprentice-lampwright', 1),
    d('af-ser-slagback-crawler', 1),
    d('af-oph-quenching-ring', 1),
    d('af-oph-cobalt-ember-wheel', 1),
    d('af-ser-helith-nun-saffron-eel', 1),
    d('af-cher-nacre-touched-initiate', 1),
    d('af-oph-forge-wheel-sigil', 1),
    d('af-oph-saffron-ember-wheel', 1),
    d('af-ser-lampfin-minnow-choir', 1),
    d('af-oph-chromatic-ember-cluster', 1),
    d('af-cher-bellows-acolyte', 1),
    d('af-ser-coalfin-pilgrim-shark', 1),
    d('af-oph-anvilstorm-halo', 1),
    d('af-oph-quenching-ring', 1),
    d('af-ser-slagback-crawler', 1),
    d('af-oph-saffron-ember-wheel', 1),
    d('af-cher-apprentice-lampwright', 1),
    d('af-oph-cobalt-ember-wheel', 1),
    d('af-ser-helith-nun-saffron-eel', 1),
    d('af-oph-forge-wheel-sigil', 1),
    d('af-cher-nacre-touched-initiate', 1),
    d('af-ser-lampfin-minnow-choir', 1),
    d('af-oph-chromatic-ember-cluster', 1),
    d('af-oph-quenching-ring', 1),
    d('af-ser-slagback-crawler', 1),
    d('af-cher-bellows-acolyte', 1),
    d('af-oph-saffron-ember-wheel', 1),
    d('af-ser-helith-nun-saffron-eel', 1),
    d('af-cher-apprentice-lampwright', 1),
  ],
};

// ── Death-flamed Hell ─────────────────────────────────────────────────────────
const deathFlamedTrial: TrialDeckDefinition = {
  packId: 'pack-death-flamed-hell',
  displayName: 'Death-flamed Hell — Funeral Procession & Veil Rite',
  deckList: [
    d('dfh-ser-soot-veiled-soldier', 4),
    d('dfh-ser-ash-marrow-reaver', 4),
    d('dfh-ser-sablecrown-herald', 4),
    d('dfh-ser-khorr-vael-no-face', 2),
    d('dfh-cher-halo-cracked-novice', 4),
    d('dfh-cher-marrow-pilgrim', 4),
    d('dfh-cher-stigmata-flame-confessor', 3),
    d('dfh-cher-the-flayed-halo', 1),
    d('dfh-oph-ash-petal-strewer', 4),
    d('dfh-oph-bell-ringer-of-the-hollow', 4),
    d('dfh-oph-empty-aisle-walker', 3),
    d('dfh-oph-faceless-bridesmaid-choir', 3),
    d('dfh-oph-hollowkings-vacant-page', 4),
    d('dfh-oph-hollow-throne-coronation', 3),
    d('dfh-oph-veil-stitcher', 1),
    d('dfh-oph-wedding-procession-living-world', 2),
  ],
  extraDeck: [e('dfh-ang-sablecrown-the-unnamed')],
  guideSteps: [
    {
      cardDefinitionId: 'dfh-cher-the-flayed-halo',
      hint: 'The Flayed Halo (Cherubim). Use it to build the base line, then flip the card when you are ready to reveal the setup. Cherubim are the spine of the procession and still keep Ember pressure moving.',
    },
    {
      cardDefinitionId: 'dfh-ser-sablecrown-herald',
      hint: 'Sablecrown Herald (Seraphim). The base loop now wants you to bank Ember first and flip later; this is one of the clearest reveal-turn payoffs.',
    },
    {
      cardDefinitionId: 'dfh-oph-ash-petal-strewer',
      hint: 'Ash-petal Strewer. A simple Ember builder that is best when you are still veiling the line.',
    },
    {
      cardDefinitionId: 'dfh-oph-hollowkings-vacant-page',
      hint: "Hollowking's Vacant Page. It keeps the reveal-side pressure going so your flip turn has something real to cash in.",
    },
    {
      cardDefinitionId: 'dfh-oph-veil-stitcher',
      hint: 'Veil Stitcher. A setup piece that fits the veiled half of the loop; flip only when you are ready to move forward.',
    },
    {
      cardDefinitionId: 'dfh-oph-hollow-throne-coronation',
      hint: 'Hollow-throne Coronation. This is a strong reveal-side pressure card; hold it until the flip turn can actually cash out.',
    },
    {
      cardDefinitionId: 'dfh-oph-wedding-procession-living-world',
      hint: 'The Wedding Procession Into the Living World — apex. Core mechanic: flip base cards to veil setup, then reveal when Ember/Crown pressure is ready. Eternal and Infinite cards layer Veil Marks on top, and that reveal consumes them for burst value.',
    },
  ],
  guidedOpeningHand: [
    'dfh-cher-the-flayed-halo',
    'dfh-ser-sablecrown-herald',
    'dfh-oph-ash-petal-strewer',
    'dfh-oph-hollowkings-vacant-page',
    'dfh-oph-veil-stitcher',
  ],
  guidedDeckOrder: [
    // Top — drawn by guide steps
    d('dfh-oph-hollow-throne-coronation', 1),       // drawn by the-flayed-halo at step 1
    d('dfh-oph-wedding-procession-living-world', 1), // drawn by veil-stitcher at step 5
    // Filler — 43 more
    d('dfh-ser-soot-veiled-soldier', 4),
    d('dfh-ser-ash-marrow-reaver', 4),
    d('dfh-ser-sablecrown-herald', 3),
    d('dfh-ser-khorr-vael-no-face', 2),
    d('dfh-cher-halo-cracked-novice', 4),
    d('dfh-cher-marrow-pilgrim', 4),
    d('dfh-cher-stigmata-flame-confessor', 3),
    d('dfh-oph-ash-petal-strewer', 3),
    d('dfh-oph-bell-ringer-of-the-hollow', 4),
    d('dfh-oph-empty-aisle-walker', 3),
    d('dfh-oph-faceless-bridesmaid-choir', 3),
    d('dfh-oph-hollowkings-vacant-page', 3),
    d('dfh-oph-hollow-throne-coronation', 2),
    d('dfh-oph-wedding-procession-living-world', 1),
  ],
};

// ── Wished Upon A Star (Event) ────────────────────────────────────────────────
const wishedUponAStarTrial: TrialDeckDefinition = {
  packId: 'pack-wished-upon-a-star',
  displayName: 'Wished Upon A Star — Nova Wish Burst',
  deckList: [
    d('wuas-ser-solarvex-fragment', 4),
    d('wuas-ser-seleniras-vigil', 4),
    d('wuas-ser-lune-refrain', 4),
    d('wuas-ser-nullspire-monolith', 2),
    d('wuas-cher-wishwright-pulse', 4),
    d('wuas-cher-solarvex-ward', 4),
    d('wuas-cher-starlace-binding', 3),
    d('wuas-oph-skyrift-mote', 4),
    d('wuas-oph-dream-shard', 4),
    d('wuas-oph-stargazer-token', 4),
    d('wuas-oph-luna-glitch', 4),
    d('wuas-oph-wishfire-surge', 4),
    d('wuas-oph-celestine-cascade', 3),
    d('wuas-oph-aeolian-nova', 2),
  ],
  extraDeck: [e('wuas-ang-starwarden-selenira')],
  guideSteps: [
    {
      cardDefinitionId: 'wuas-cher-wishwright-pulse',
      hint: "Wishwright's Pulse (Cherubim). On play: +2 Starlight. While active: +1 Starlight per card played — passive ramp.",
    },
    {
      cardDefinitionId: 'wuas-ser-solarvex-fragment',
      hint: 'Solarvex Fragment (Seraphim). On play: +2 Starlight. While active: +1 resource gen — accelerates ramp.',
    },
    {
      cardDefinitionId: 'wuas-oph-luna-glitch',
      hint: 'Luna Glitch. +2 Starlight, +1 Dream. Dream multiplies the Nova: Oblivion = Starlight × (1 + Dream × 0.4).',
    },
    {
      cardDefinitionId: 'wuas-oph-celestine-cascade',
      hint: 'Celestine Cascade. +4 Starlight, +2 Dream. Final ramp — Starlight ~13, Dream 3 going into draw.',
    },
    {
      cardDefinitionId: 'wuas-oph-stargazer-token',
      hint: 'Stargazer Token. +3 Starlight; draws 1.',
    },
    {
      cardDefinitionId: 'wuas-oph-aeolian-nova',
      hint: 'Aeolian Nova — apex. Core mechanic: Starlight + Dream Lattice ramp before Nova conversion. Why it scales: Dream multiplies Starlight cashout, so late-turn Nova grows sharply. Exact payoff: resolve Nova Wish Burst, then click Solarvex Fragment → Attack for the closing spike.',
    },
  ],
  guidedOpeningHand: [
    'wuas-cher-wishwright-pulse',
    'wuas-ser-solarvex-fragment',
    'wuas-oph-luna-glitch',
    'wuas-oph-celestine-cascade',
    'wuas-oph-stargazer-token',
  ],
  guidedDeckOrder: [
    // Top — drawn by stargazer-token at step 5
    d('wuas-oph-aeolian-nova', 1),
    // Filler — 44 more
    d('wuas-ser-solarvex-fragment', 3),
    d('wuas-ser-seleniras-vigil', 4),
    d('wuas-ser-lune-refrain', 4),
    d('wuas-ser-nullspire-monolith', 2),
    d('wuas-cher-wishwright-pulse', 3),
    d('wuas-cher-solarvex-ward', 4),
    d('wuas-cher-starlace-binding', 3),
    d('wuas-oph-skyrift-mote', 4),
    d('wuas-oph-dream-shard', 4),
    d('wuas-oph-stargazer-token', 3),
    d('wuas-oph-luna-glitch', 3),
    d('wuas-oph-wishfire-surge', 4),
    d('wuas-oph-celestine-cascade', 2),
    d('wuas-oph-aeolian-nova', 1),
  ],
};

/** Master lookup table: packId → TrialDeckDefinition */
export const TRIAL_DECK_DEFINITIONS: Record<string, TrialDeckDefinition> = {
  'pack-neutrality': neutralityTrial,
  'pack-pyroabyss': pyroabyssTrial,
  'pack-heavenly-light': heavenlyLightTrial,
  'pack-thornbound-plains': thornboundTrial,
  'pack-mechanical-dreams': mechanicalTrial,
  'pack-prismatic-accord': prismaticTrial,
  'pack-black-glass-inferno': blackGlassTrial,
  'pack-snowbound-voltage': snowboundTrial,
  'pack-glass-absolute': glassAbsoluteTrial,
  'pack-blazing-garden': blazingGardenTrial,
  'pack-age-of-the-butterfly': butterflyTrial,
  'pack-eternal-seas': eternalSeasTrial,
  'pack-abyssal-forge': abyssalForgeTrial,
  'pack-death-flamed-hell': deathFlamedTrial,
  'pack-wished-upon-a-star': wishedUponAStarTrial,
};

export function getTrialDeckDefinition(packId: string): TrialDeckDefinition | null {
  return TRIAL_DECK_DEFINITIONS[packId] ?? null;
}
