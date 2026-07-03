/**
 * resourceExplanations.ts
 *
 * Single source of truth for per-resource human-readable descriptions.
 * Consumed by TutorialModal and any in-game tooltip that explains a resource.
 *
 * Each entry has:
 *  - key:             unique identifier (matches effect resource names where possible)
 *  - name:            display label
 *  - setName:         owning set display name
 *  - setElement:      Element string used in card definitions
 *  - shortDesc:       one-line tooltip description
 *  - longDesc:        paragraph-length explanation for the tutorial
 *  - mechanics:       bullet-point mechanic notes
 */

export interface ResourceInfo {
  key: string;
  name: string;
  setName: string;
  setElement: string;
  shortDesc: string;
  longDesc: string;
  mechanics: string[];
}

export const RESOURCE_INFO: ResourceInfo[] = [
  {
    key: 'patience',
    name: 'Patience',
    setName: 'Neutrality',
    setElement: 'Neutrality',
    shortDesc: 'Accumulates per card played; cashed out on Seraphim and Angel attacks.',
    longDesc:
      'Patience is Neutrality\'s core combat resource. While at least one Seraphim or Angel is on the board, each card you play adds +1 Patience to every Seraphim. Cherubim with a patience passive add extra stacks on top of the base +1.',
    mechanics: [
      'Each card played → +1 Patience per active Seraphim (and any adjacent-Cherubim bonus on top).',
      'On attack, each Patience stack → +15 Oblivion consumed.',
      'If Patience ≥ patienceThreshold on attack, you also draw bonus cards.',
      'Stacks reset to zero after the attack fires.',
    ],
  },
  {
    key: 'equilibriumSigils',
    name: 'Equilibrium Sigils',
    setName: 'Neutrality',
    setElement: 'Neutrality',
    shortDesc: 'Conditional Patience amplifiers granted by Neutrality Eternal/Infinite cards.',
    longDesc:
      'Equilibrium Sigils are a secondary Neutrality resource from Eternal and Infinite cards. ' +
      'When you have enough Sigils, specific Eternal effects can spend them to double Patience, trigger Oblivion bursts, or restore team Patience.',
    mechanics: [
      'Gained via neutrality_equilibrium_sigil_gain effects.',
      'Some cards have passive effects that only fire while Sigils are present on board.',
      'Cashout effects spend Sigils: Starbound Cashout doubles all Patience + bonus Oblivion per Sigil.',
    ],
  },
  {
    key: 'patientLight',
    name: 'Patient Light',
    setName: 'Neutrality',
    setElement: 'Neutrality',
    shortDesc: 'Boosts card-play Patience gain with diminishing returns at high stacks.',
    longDesc:
      'Patient Light is a stacking modifier on card-play Patience gain. Each stack adds diminishing returns to how much Patience you gain per card played — useful for raising the average Patience income without needing heavy Cherubim support.',
    mechanics: [
      'Granted by neutrality_patient_light_gain effects.',
      'Applies a bonus to per-card Patience gain (diminishing returns at high stack counts).',
    ],
  },
  {
    key: 'pyroHeat',
    name: 'Heat',
    setName: 'Pyroabyss',
    setElement: 'Fire',
    shortDesc: 'Build Heat with Stoke cards; spend it with Burst cards for large Oblivion.',
    longDesc:
      'Heat is Pyroabyss\'s primary resource. Cards are divided into roles: Stoke cards generate Heat, Threshold cards check Heat levels for bonus effects, and Burst cards cash Heat out for Oblivion. The loop is: stoke → hit threshold → burst, then repeat.',
    mechanics: [
      'Stoke cards: pyro_heat_gain adds Heat.',
      'Burst cards: pyro_heat_burst spends Heat for +X Oblivion per Heat.',
      'Threshold conditions: pyro_heat_gte checks if you have enough Heat for a conditional bonus.',
      'Chroma Embers (Eternal/Infinite) add a quadratic Oblivion layer on top.',
    ],
  },
  {
    key: 'radiance',
    name: 'Radiance',
    setName: 'Heavenly Light',
    setElement: 'Light',
    shortDesc: 'Gained and spent each turn; powers Light burst and conditional effects.',
    longDesc:
      'Radiance is the primary Light resource. It accumulates during a turn as you play Light cards and is spent by burst effects for Oblivion. Some cards can double current Radiance for a high-value burst window.',
    mechanics: [
      'radiance_gain adds Radiance; radiance_spend consumes it.',
      'radiance_double doubles all current Radiance — use before a big spend.',
      'Conditions radiance_gte / radiance_lte gate conditional bonuses.',
      'Halo (Eternal/Infinite) is a separate resource that accumulates over time and is cashed out via Duality-choice effects.',
    ],
  },
  {
    key: 'trail',
    name: 'Trail',
    setName: 'Thornbound Plains',
    setElement: 'Thornbound',
    shortDesc: 'Built by playing Trail cards; convert to Scar manually in the HUD.',
    longDesc:
      'Trail accumulates as you play Thornbound cards. When enough Trail is stacked, you can manually convert a portion to Scar using the HUD button. Scar feeds conditional thresholds on Seraphim and Cherubim that grant bonus attacks or Oblivion.',
    mechanics: [
      'trail_gain adds Trail; trail_spend consumes it.',
      'scar_count_gte conditions check accumulated Scar for bonus triggers.',
      'Briar Spiral (Eternal/Infinite set-secondary) converts Spirals back into Trail and scales chain with Trail.',
    ],
  },
  {
    key: 'strain',
    name: 'Strain',
    setName: 'Mechanical Dreams',
    setElement: 'Mechanical',
    shortDesc: 'Built up over time; spent by Overclock and Vent effects for burst payoffs.',
    longDesc:
      'Strain is Mechanical Dreams\' primary resource. It rises as you play Mechanical cards and is released either through Overclock effects (spend Strain, gain a triggered bonus) or Vent effects (discharge Strain for Oblivion). Resonance Charge is a secondary resource that gates threshold conditions.',
    mechanics: [
      'strain_gain adds Strain; strain_vent releases it for a burst.',
      'overclock spends a fixed amount of Strain to trigger an inline bonus effect.',
      'strain_gte / strain_lte conditions check Strain level.',
      'resonance_charge_gte conditions unlock Cherubim buffs when reached.',
    ],
  },
  {
    key: 'prismaticLight',
    name: 'Prismatic Light / Prism Charges',
    setName: 'Prismatic Accord',
    setElement: 'Prismatic',
    shortDesc: 'Switch channels to build Refraction Depth; spend Prism Charges for burst.',
    longDesc:
      'Prismatic Accord uses two interlinked resources. Prismatic Light is gained and spent on a channel-switch model — each switch increases Refraction Depth. Prism Charges gate the largest payoff effects; hitting a charge threshold unlocks high-value burst turns.',
    mechanics: [
      'prismatic_light_gain / spend fuel channel switches.',
      'Refraction Depth tracks how many channel switches you\'ve made this turn.',
      'prismatic_charge_gain / spend gate the big Oblivion payoffs.',
      'Mirror Chain (Eternal/Infinite) — Spectrum Echo set-secondary scales Oblivion by distinct channels played.',
    ],
  },
  {
    key: 'monochromaticShards',
    name: 'Monochromatic Shards / Flames',
    setName: 'Black Glass Inferno',
    setElement: 'Dark',
    shortDesc: 'Balance White and Black Flame; build Fracture for Eclipse burst windows.',
    longDesc:
      'Black Glass Inferno revolves around two flame counters: White Flame and Black Flame. Keeping them close together unlocks balance-tier bonuses. Fracture accumulates passively and amplifies Eclipse burst effects. Monochromatic Shards are a supplementary burst resource.',
    mechanics: [
      'black_glass_white_flame_gain / black_glass_black_flame_gain add to each counter.',
      'black_glass_flames_swap swaps the two values — used to equalise or invert.',
      'Fracture amplifies the Eclipse burst bonus per Fracture stack.',
      'eclipse_burst cashes out banked Eclipse for high-Oblivion payoffs.',
    ],
  },
  {
    key: 'arcticCharge',
    name: 'Arctic Charge',
    setName: 'Snowbound Voltage',
    setElement: 'Snowbound',
    shortDesc: 'Frost cards build Arctic Charge; Voltage cards discharge it for Oblivion.',
    longDesc:
      'Arctic Charge is the central Snowbound Voltage resource. Frost-phase cards spend turns stocking Arctic Charge; Voltage-phase cards discharge it for Oblivion. Polar Capacitors (Eternal/Infinite) add a bank-and-release layer: Voltage mode pays out Oblivion per capacitor, Frost mode converts to more Arctic Charge.',
    mechanics: [
      'arctic_charge_gain adds charge; arctic_charge_discharge releases it.',
      'Polar Capacitor (set-secondary) is separate from Arctic Charge — banked by Eternal plays and released via snow_polar_capacitor_release.',
    ],
  },
  {
    key: 'bloom',
    name: 'Bloom / Wild Pollen',
    setName: 'Blazing Garden',
    setElement: 'BlazingGarden',
    shortDesc: 'Cards enter Burn; charred cards seed Grove; Wild Pollen fuels Eternal payoffs.',
    longDesc:
      'Blazing Garden tracks Bloom (accumulated by Ophanim and Seraphim plays), Burn lineages (each type of Burn card seeded during a turn), and Ember Grove (charred units that seed Worldflower tokens). Wild Pollen is the Eternal/Infinite set-secondary, seeded each Eternal play and spent for scaled Oblivion + score multiplier per Bloom.',
    mechanics: [
      'bloom_gain adds Bloom; bloom_harvest cashes it out for Oblivion.',
      'garden_wild_pollen_seed spends the Wild Pollen set-secondary for a large payoff.',
      'Garden Law (Rose/Sunflower/Thistle) is a global modifier set by Eternal cards.',
    ],
  },
  {
    key: 'butterflySpectrum',
    name: 'Flutter Spectrum',
    setName: 'Age of the Butterfly',
    setElement: 'Butterfly',
    shortDesc: 'Shared resource charged by Ophanim; released for burst via butterfly_release.',
    longDesc:
      'Flutter Spectrum is accumulated by playing Age of the Butterfly Ophanim cards. It can be released for large Oblivion via butterfly_release effects. Wing Pulse (set-secondary) doubles the next N Spectrum gains, and Wing Resonance (Eternal/Infinite eternal stack) adds Harmonize/Apex cashout lines scaling with resonance count and Formation bonuses.',
    mechanics: [
      'butterfly_spectrum_gain adds Spectrum; butterfly_release spends it.',
      'flutter_wing_pulse_amplify spends Wing Pulses to double subsequent Spectrum gains.',
      'flutter_resonance_harmonize / apex are Eternal/Infinite cashout effects that scale with resonance count, Spectrum, and Formation.',
    ],
  },
  {
    key: 'undertow',
    name: 'Undertow / Foam',
    setName: 'Eternal Seas',
    setElement: 'EternalSeas',
    shortDesc: 'Build Undertow during the turn; release it for burst Oblivion.',
    longDesc:
      'Eternal Seas uses two tide resources. Undertow is the primary offensive resource — accumulated during a turn and released for Oblivion. Foam accumulates alongside it; spend 5 Foam in the HUD to draw 1 card. Deepwake (Eternal/Infinite) surges Undertow from a deep store and immediately releases it.',
    mechanics: [
      'seas_undertow_gain adds Undertow; seas_undertow_release converts it to Oblivion.',
      'seas_foam_gain adds Foam; HUD button converts Foam → card draws.',
      'seas_deepwake_surge (Eternal/Infinite) generates and releases Undertow in one step.',
      'Tide Echo (Eternal/Infinite set-secondary) splits payout based on Undertow/Foam balance.',
    ],
  },
  {
    key: 'forgeCharges',
    name: 'Reforge Charges / Pearls / Imprint',
    setName: 'Abyssal Forge',
    setElement: 'AbyssalForge',
    shortDesc: 'Recast previous cards at scaled power; Pearls and Imprint add layered payoffs.',
    longDesc:
      'Abyssal Forge\'s three resources work together. Reforge Charges fuel recast effects that replay previously played cards at a scaled power multiplier. Pearls are dropped by Forge cards and cashed out for Oblivion. Imprint is placed on cards and spent for burst Oblivion or to empower recast actions.',
    mechanics: [
      'forge_reforge_charge_gain adds charges; recast effects spend them.',
      'forge_pearl_drop drops Pearls; forge_pearl_cashout converts them to Oblivion.',
      'forge_imprint_gain places Imprint on target cards; spend via forge_imprint_spend_burst or forge_imprint_spend_recast.',
      'Forge Crown (Eternal/Infinite eternal stack) accumulates for large Oblivion cashouts.',
    ],
  },
  {
    key: 'pyreEmbers',
    name: 'Pyre Embers / Cinder Crowns / Veil Marks',
    setName: 'Death-flamed Hell',
    setElement: 'DeathFlamedHell',
    shortDesc: 'Stack Pyre Embers, transmute to Veil Marks, cash out for massive Oblivion.',
    longDesc:
      'Death-flamed Hell has three stacked resources. Pyre Embers accumulate from Seraphim and Ophanim plays. Cinder Crowns (set-secondary) gate conditional bonuses and can be cashed out directly. Veil Marks are transmuted from Embers or Crowns via Eternal/Infinite effects and cashed out for the highest per-mark Oblivion in the set.',
    mechanics: [
      'eternal_stack_gain stack:\'pyre\' adds Pyre Embers; set_secondary_gain kind:\'pyre\' adds Cinder Crowns.',
      'dfh_veil_marks_transmute converts Embers or Crowns into Veil Marks.',
      'dfh_veil_marks_cashout converts Marks to Oblivion; dfh_veil_marks_amplify multiplies current Marks.',
      'dfh_crown_cashout directly spends Cinder Crowns for Oblivion (no transmute needed).',
    ],
  },
  {
    key: 'starlightCharges',
    name: 'Starlight Charges / Dream Lattice',
    setName: 'Wished Upon a Star',
    setElement: 'WishedUponAStar',
    shortDesc: 'Stack Starlight and amplify with Dream Lattice for Nova Wish Burst Oblivion.',
    longDesc:
      'Wished Upon a Star uses two interlinked resources. Starlight Charges are the base currency; Dream Lattice is a multiplier. The Nova Wish Burst formula is: Oblivion = Starlight × (1 + Dream × coefficient). Star Crowns (Eternal/Infinite eternal stack) are accumulated and cashed out via Constellation Lock Release.',
    mechanics: [
      'starlight_gain adds Starlight; dream_lattice_gain adds Dream Lattice.',
      'wuas_nova_wish_burst fires the burst: Oblivion = Starlight × (1 + Dream × coeff).',
      'wuas_constellation_lock_release cashes out Star Crowns for chain + Oblivion.',
      'This is an event set — accessed via special packs.',
    ],
  },
];

/** O(1) lookup by key. */
export const RESOURCE_BY_KEY: Map<string, ResourceInfo> = new Map(
  RESOURCE_INFO.map(r => [r.key, r]),
);

/** All resources for a specific set element. */
export function resourcesForSet(element: string): ResourceInfo[] {
  return RESOURCE_INFO.filter(r => r.setElement === element);
}
