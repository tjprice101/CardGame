import type { ArtifactDefinition } from '@/types/artifacts';
import { ARTIFACT_TIER_COSTS } from '@/types/artifacts';

const T1 = ARTIFACT_TIER_COSTS.basic;
const T2 = ARTIFACT_TIER_COSTS.advanced;
const T3 = ARTIFACT_TIER_COSTS.apex;

export const ARTIFACT_DEFINITIONS: ArtifactDefinition[] = [

  // ── Neutrality ──────────────────────────────────────────────────────────────
  // All Neutrality artifacts are Patience-system-native. Equilibrium Stability
  // and Attenuation Breaks are no longer touched by the set's cards, so the
  // artifacts now plug straight into Patience accumulation, threshold draws,
  // and post-cashout patience preservation.
  {
    id: 'artifact-neutrality-t1',
    setElementKey: 'Neutrality',
    setName: 'Neutrality',
    tier: 'basic',
    name: 'Patience Wellspring',
    description: 'Each Seraphim with a Patience threshold accumulates +2 additional Patience per turn (atop the base +1). Fuel deeper Patience cash-outs for huge Oblivion when consumed.',
    powderCost: T1,
    effects: [{ type: 'patience_cap_bonus', value: 2 }],
  },
  {
    id: 'artifact-neutrality-t2',
    setElementKey: 'Neutrality',
    setName: 'Neutrality',
    tier: 'advanced',
    name: 'Patience Dividend',
    description: 'Whenever one of your Seraphim attacks while its stacked Patience has reached its threshold, draw 1 extra card. Triggers every time the threshold is met on attack — Patience can keep stacking past it, so the bonus keeps firing.',
    powderCost: T2,
    effects: [{ type: 'patience_threshold_draw_bonus', value: 1 }],
  },
  {
    id: 'artifact-neutrality-t3',
    setElementKey: 'Neutrality',
    setName: 'Neutrality',
    tier: 'apex',
    name: 'Patience Reservoir',
    description: 'After a Seraphim consumes its Patience on attack, 25% of the spent Patience is preserved on that Seraphim. Stack Patience faster than ever and chain repeat threshold cash-outs in the same fight.',
    powderCost: T3,
    effects: [{ type: 'patience_preserve_percent', value: 25 }],
  },

  // ── Pyroabyss ───────────────────────────────────────────────────────────────
  {
    id: 'artifact-pyroabyss-t1',
    setElementKey: 'Fire',
    setName: 'Pyroabyss',
    tier: 'basic',
    name: 'Smoldering Core',
    description: '+3 to the Heat cap before Burn Debt triggers. Push the furnace hotter without consequence.',
    powderCost: T1,
    effects: [{ type: 'heat_cap_bonus', value: 3 }],
  },
  {
    id: 'artifact-pyroabyss-t2',
    setElementKey: 'Fire',
    setName: 'Pyroabyss',
    tier: 'advanced',
    name: 'Echo Crucible',
    description: 'Cinder Echo ignition yields ×1.4 Oblivion. Also grants +20% Oblivion when Pyroabyss cards are played.',
    powderCost: T2,
    effects: [
      { type: 'cinder_echo_oblivion_mult', value: 1.4 },
      { type: 'oblivion_set_mult', value: 0.2 },
    ],
  },
  {
    id: 'artifact-pyroabyss-t3',
    setElementKey: 'Fire',
    setName: 'Pyroabyss',
    tier: 'apex',
    name: 'Inferno Sovereign',
    description: 'The Pyroabyss full-fire gate multiplier increases by +0.22 when active. The abyss recognizes your mastery.',
    powderCost: T3,
    effects: [{ type: 'pyro_full_fire_mult_bonus', value: 0.22 }],
  },

  // ── Heavenly Light ──────────────────────────────────────────────────────────
  {
    id: 'artifact-light-t1',
    setElementKey: 'Light',
    setName: 'Heavenly Light',
    tier: 'basic',
    name: 'Radiant Prism',
    description: '+1 Resonance gained per Heavenly Light card played. Each note of light resonates deeper.',
    powderCost: T1,
    effects: [{ type: 'resonance_gain_bonus', value: 1 }],
  },
  {
    id: 'artifact-light-t2',
    setElementKey: 'Light',
    setName: 'Heavenly Light',
    tier: 'advanced',
    name: 'Sanctified Cadence',
    description: 'Resonance chains extend by +1 before breaking. Also grants +20% Oblivion when Light cards are played.',
    powderCost: T2,
    effects: [
      { type: 'resonance_chain_extend', value: 1 },
      { type: 'oblivion_set_mult', value: 0.2 },
    ],
  },
  {
    id: 'artifact-light-t3',
    setElementKey: 'Light',
    setName: 'Heavenly Light',
    tier: 'apex',
    name: 'Crown of Eternity',
    description: 'Halo Cascade cashout draws +2 additional cards. The heavens open fully for those who ascend.',
    powderCost: T3,
    effects: [{ type: 'halo_cascade_draw_bonus', value: 2 }],
  },

  // ── Thornbound Plains ───────────────────────────────────────────────────────
  {
    id: 'artifact-thornbound-t1',
    setElementKey: 'Thornbound',
    setName: 'Thornbound Plains',
    tier: 'basic',
    name: 'Barbed Growth',
    description: '+1 Trail generated per Thornbound card played. The war-path deepens with each step.',
    powderCost: T1,
    effects: [{ type: 'trail_gain_bonus', value: 1 }],
  },
  {
    id: 'artifact-thornbound-t2',
    setElementKey: 'Thornbound',
    setName: 'Thornbound Plains',
    tier: 'advanced',
    name: 'Scar Weave',
    description: 'Scar payouts deal ×1.5 effect on war-path triggers. Also grants +20% Oblivion when Thornbound cards are played.',
    powderCost: T2,
    effects: [
      { type: 'scar_payout_mult', value: 1.5 },
      { type: 'oblivion_set_mult', value: 0.2 },
    ],
  },
  {
    id: 'artifact-thornbound-t3',
    setElementKey: 'Thornbound',
    setName: 'Thornbound Plains',
    tier: 'apex',
    name: 'Thorncrown Apex',
    description: 'Trail spend abilities cost 1 less Trail (minimum 0). The scars have made you efficient.',
    powderCost: T3,
    effects: [{ type: 'trail_spend_discount', value: 1 }],
  },

  // ── Mechanical Dreams ───────────────────────────────────────────────────────
  {
    id: 'artifact-mechanical-t1',
    setElementKey: 'Mechanical',
    setName: 'Mechanical Dreams',
    tier: 'basic',
    name: 'Gear Array',
    description: 'Instruction queue capacity +1. One more instruction before the system purges.',
    powderCost: T1,
    effects: [{ type: 'queue_capacity_bonus', value: 1 }],
  },
  {
    id: 'artifact-mechanical-t2',
    setElementKey: 'Mechanical',
    setName: 'Mechanical Dreams',
    tier: 'advanced',
    name: 'Pressure Valve',
    description: 'Reactor Flux vents restore 2 Strain. Also grants +20% Oblivion when Mechanical cards are played.',
    powderCost: T2,
    effects: [
      { type: 'strain_restore_on_vent', value: 2 },
      { type: 'oblivion_set_mult', value: 0.2 },
    ],
  },
  {
    id: 'artifact-mechanical-t3',
    setElementKey: 'Mechanical',
    setName: 'Mechanical Dreams',
    tier: 'apex',
    name: 'Eclipse Protocol',
    description: 'When the instruction queue flushes, Oblivion earned that turn is multiplied by ×1.35.',
    powderCost: T3,
    effects: [{ type: 'queue_flush_oblivion_mult', value: 1.35 }],
  },

  // ── Prismatic Accord ────────────────────────────────────────────────────────
  {
    id: 'artifact-prismatic-t1',
    setElementKey: 'Prismatic',
    setName: 'Prismatic Accord',
    tier: 'basic',
    name: 'Spectrum Lens',
    description: '+1 distinct channel counted per turn toward chord and echo effects. The spectrum opens wider.',
    powderCost: T1,
    effects: [{ type: 'channel_count_bonus', value: 1 }],
  },
  {
    id: 'artifact-prismatic-t2',
    setElementKey: 'Prismatic',
    setName: 'Prismatic Accord',
    tier: 'advanced',
    name: 'Refraction Matrix',
    description: 'Refraction tokens cascade to +2 additional cards. Also grants +20% Oblivion when Prismatic cards are played.',
    powderCost: T2,
    effects: [
      { type: 'refraction_cascade_bonus', value: 2 },
      { type: 'oblivion_set_mult', value: 0.2 },
    ],
  },
  {
    id: 'artifact-prismatic-t3',
    setElementKey: 'Prismatic',
    setName: 'Prismatic Accord',
    tier: 'apex',
    name: 'Chromatic Apex',
    description: 'Chord bonus activates with 1 fewer distinct channel required. The accord is complete.',
    powderCost: T3,
    effects: [{ type: 'chord_threshold_reduction', value: 1 }],
  },

  // ── Black Glass Inferno ─────────────────────────────────────────────────────
  {
    id: 'artifact-dark-t1',
    setElementKey: 'Dark',
    setName: 'Black Glass Inferno',
    tier: 'basic',
    name: 'Obsidian Mirror',
    description: 'White Flame and Black Flame both start each turn at +1. Duality has its privileges.',
    powderCost: T1,
    effects: [{ type: 'flame_start_bonus', value: 1 }],
  },
  {
    id: 'artifact-dark-t2',
    setElementKey: 'Dark',
    setName: 'Black Glass Inferno',
    tier: 'advanced',
    name: 'Fracture Catalyst',
    description: 'Fracture triggers yield ×1.5 Oblivion. Also grants +20% Oblivion when Black Glass cards are played.',
    powderCost: T2,
    effects: [
      { type: 'fracture_oblivion_mult', value: 1.5 },
      { type: 'oblivion_set_mult', value: 0.2 },
    ],
  },
  {
    id: 'artifact-dark-t3',
    setElementKey: 'Dark',
    setName: 'Black Glass Inferno',
    tier: 'apex',
    name: 'Absolute Darkness',
    description: 'Veil Shard swaps unlock an additional tier of exchange, deepening the twin-flame spiral.',
    powderCost: T3,
    effects: [{ type: 'veil_shard_tier_bonus', value: 1 }],
  },

  // ── Snowbound Voltage ───────────────────────────────────────────────────────
  {
    id: 'artifact-snowbound-t1',
    setElementKey: 'SnowboundVoltage',
    setName: 'Snowbound Voltage',
    tier: 'basic',
    name: 'Static Coil',
    description: '+1 Voltage Surge token generated passively each turn. The static builds whether you play or wait.',
    powderCost: T1,
    effects: [{ type: 'voltage_surge_rate', value: 1 }],
  },
  {
    id: 'artifact-snowbound-t2',
    setElementKey: 'SnowboundVoltage',
    setName: 'Snowbound Voltage',
    tier: 'advanced',
    name: 'Arctic Conductor',
    description: 'Phase transitions grant a flat +200 Oblivion bonus. Also grants +20% Oblivion when Snowbound cards are played.',
    powderCost: T2,
    effects: [
      { type: 'phase_transition_oblivion_bonus', value: 200 },
      { type: 'oblivion_set_mult', value: 0.2 },
    ],
  },
  {
    id: 'artifact-snowbound-t3',
    setElementKey: 'SnowboundVoltage',
    setName: 'Snowbound Voltage',
    tier: 'apex',
    name: 'Tempest Crown',
    description: 'Discharge bonus is multiplied by ×2 when triggered at maximum Potential.',
    powderCost: T3,
    effects: [{ type: 'discharge_mult_bonus', value: 1.0 }], // +1.0 added to 1.0 base = ×2 total
  },

  // ── Glass Absolute ──────────────────────────────────────────────────────────
  {
    id: 'artifact-glass-t1',
    setElementKey: 'GlassAbsolute',
    setName: 'Glass Absolute',
    tier: 'basic',
    name: 'Lattice Shard',
    description: 'Proof Cascade threshold reduced by 1. The lattice reaches cascade with less preparation.',
    powderCost: T1,
    effects: [{ type: 'proof_threshold_reduction', value: 1 }],
  },
  {
    id: 'artifact-glass-t2',
    setElementKey: 'GlassAbsolute',
    setName: 'Glass Absolute',
    tier: 'advanced',
    name: 'Crystalline Array',
    description: 'Chain multiplier from Proof starts at ×1.1 instead of ×1.0. Also grants +20% Oblivion when Glass Absolute cards are played.',
    powderCost: T2,
    effects: [
      { type: 'chain_mult_start_bonus', value: 0.1 },
      { type: 'oblivion_set_mult', value: 0.2 },
    ],
  },
  {
    id: 'artifact-glass-t3',
    setElementKey: 'GlassAbsolute',
    setName: 'Glass Absolute',
    tier: 'apex',
    name: 'Absolute Zenith',
    description: 'Cascade Proof Amplify applies to all boarded Glass Absolute cards simultaneously. The lattice becomes one.',
    powderCost: T3,
    effects: [{ type: 'cascade_proof_all_board', value: 1 }],
  },

  // ── Blazing Garden ──────────────────────────────────────────────────────────
  {
    id: 'artifact-garden-t1',
    setElementKey: 'BlazingGarden',
    setName: 'The Blazing Garden',
    tier: 'basic',
    name: 'Seedbed',
    description: 'Ember Grove capacity +3. The garden grows larger, holding more embers between turns.',
    powderCost: T1,
    effects: [{ type: 'ember_grove_capacity', value: 3 }],
  },
  {
    id: 'artifact-garden-t2',
    setElementKey: 'BlazingGarden',
    setName: 'The Blazing Garden',
    tier: 'advanced',
    name: 'Wildfire Bloom',
    description: 'Burn ignition also triggers Wild Pollen effects once. Also grants +20% Oblivion when Blazing Garden cards are played.',
    powderCost: T2,
    effects: [
      { type: 'burn_pollen_link', value: 1 },
      { type: 'oblivion_set_mult', value: 0.2 },
    ],
  },
  {
    id: 'artifact-garden-t3',
    setElementKey: 'BlazingGarden',
    setName: 'The Blazing Garden',
    tier: 'apex',
    name: 'Eternal Harvest',
    description: 'End-of-turn char-to-Ember-Grove conversion sends +2 additional embers. The harvest never ends.',
    powderCost: T3,
    effects: [{ type: 'char_ember_bonus', value: 2 }],
  },

  // ── Age of the Butterfly ────────────────────────────────────────────────────
  {
    id: 'artifact-butterfly-t1',
    setElementKey: 'Butterfly',
    setName: 'Age of the Butterfly',
    tier: 'basic',
    name: 'Flutter Array',
    description: '+1 Wing Resonance gained per Butterfly card played. Each wing-beat echoes further.',
    powderCost: T1,
    effects: [{ type: 'wing_resonance_gain_bonus', value: 1 }],
  },
  {
    id: 'artifact-butterfly-t2',
    setElementKey: 'Butterfly',
    setName: 'Age of the Butterfly',
    tier: 'advanced',
    name: 'Metamorphic Surge',
    description: 'Wing Pulse Doubles stacks last for +1 extra card play. Also grants +20% Oblivion when Butterfly cards are played.',
    powderCost: T2,
    effects: [
      { type: 'wing_pulse_duration_bonus', value: 1 },
      { type: 'oblivion_set_mult', value: 0.2 },
    ],
  },
  {
    id: 'artifact-butterfly-t3',
    setElementKey: 'Butterfly',
    setName: 'Age of the Butterfly',
    tier: 'apex',
    name: 'Transcendent Wings',
    description: 'Butterfly Spectrum gain at peak yields +2 bonus card draws. Transcendence brings clarity.',
    powderCost: T3,
    effects: [{ type: 'butterfly_spectrum_peak_draw_bonus', value: 2 }],
  },

  // ── Eternal Seas ────────────────────────────────────────────────────────────
  {
    id: 'artifact-seas-t1',
    setElementKey: 'EternalSeas',
    setName: 'Eternal Seas',
    tier: 'basic',
    name: 'Deep Current',
    description: '+1 to Tide Crown accumulation rate per turn. The tide answers your call sooner.',
    powderCost: T1,
    effects: [{ type: 'tide_crown_rate_bonus', value: 1 }],
  },
  {
    id: 'artifact-seas-t2',
    setElementKey: 'EternalSeas',
    setName: 'Eternal Seas',
    tier: 'advanced',
    name: 'Wave Resonance',
    description: 'Polarity split yields ×1.5 Oblivion per tide. Also grants +20% Oblivion when Eternal Seas cards are played.',
    powderCost: T2,
    effects: [
      { type: 'polarity_split_oblivion_mult', value: 1.5 },
      { type: 'oblivion_set_mult', value: 0.2 },
    ],
  },
  {
    id: 'artifact-seas-t3',
    setElementKey: 'EternalSeas',
    setName: 'Eternal Seas',
    tier: 'apex',
    name: 'Abyssal Maelstrom',
    description: 'Tide Echo Resolve fires twice on cashout. The ocean refuses to be contained.',
    powderCost: T3,
    effects: [{ type: 'tide_echo_double', value: 1 }],
  },

  // ── Abyssal Forge (Iron Dominion) ───────────────────────────────────────────
  {
    id: 'artifact-forge-t1',
    setElementKey: 'AbyssalForge',
    setName: 'Abyssal Forge',
    tier: 'basic',
    name: 'Iron Hearth',
    description: '+2 starting Iron Charge at the beginning of each turn. The forge never goes cold.',
    powderCost: T1,
    effects: [{ type: 'iron_charge_start_bonus', value: 2 }],
  },
  {
    id: 'artifact-forge-t2',
    setElementKey: 'AbyssalForge',
    setName: 'Abyssal Forge',
    tier: 'advanced',
    name: 'Weld Matrix',
    description: 'Each Weld Mark grants +1 chain multiplier step. Also grants +20% Oblivion when Forge cards are played.',
    powderCost: T2,
    effects: [
      { type: 'weld_mark_chain_bonus', value: 1 },
      { type: 'oblivion_set_mult', value: 0.2 },
    ],
  },
  {
    id: 'artifact-forge-t3',
    setElementKey: 'AbyssalForge',
    setName: 'Abyssal Forge',
    tier: 'apex',
    name: 'Tungsten Apex',
    description: 'The Forge full-fire gate multiplier increases by +0.27. Tungsten yields only to perfection.',
    powderCost: T3,
    effects: [{ type: 'forge_full_fire_mult_bonus', value: 0.27 }],
  },

  // ── Death-flamed Hell ───────────────────────────────────────────────────────
  {
    id: 'artifact-dfh-t1',
    setElementKey: 'DeathFlamedHell',
    setName: 'Death-flamed Hell',
    tier: 'basic',
    name: 'Infernal Pressure',
    description: '+2 to the Infernal Pressure cap. The hellfire builds beyond mortal limits.',
    powderCost: T1,
    effects: [{ type: 'dfh_infernal_pressure_bonus', value: 2 }],
  },
  {
    id: 'artifact-dfh-t2',
    setElementKey: 'DeathFlamedHell',
    setName: 'Death-flamed Hell',
    tier: 'advanced',
    name: 'Soulflame Lens',
    description: 'Soul Flame payouts yield ×1.4 Oblivion. Also grants +20% Oblivion when Death-flamed cards are played.',
    powderCost: T2,
    effects: [
      { type: 'dfh_soulflame_mult', value: 1.4 },
      { type: 'oblivion_set_mult', value: 0.2 },
    ],
  },
  {
    id: 'artifact-dfh-t3',
    setElementKey: 'DeathFlamedHell',
    setName: 'Death-flamed Hell',
    tier: 'apex',
    name: 'Apocalypse Chain',
    description: 'Chain multiplier bonus from Death-flamed Hell apex effects is increased by +0.3.',
    powderCost: T3,
    effects: [{ type: 'dfh_apocalypse_chain_bonus', value: 0.3 }],
  },
];

/** Look up a single artifact definition by id. */
export function getArtifactById(id: string): ArtifactDefinition | undefined {
  return ARTIFACT_DEFINITIONS.find(a => a.id === id);
}

/** All artifacts for a given set element key. */
export function getArtifactsForSet(elementKey: string): ArtifactDefinition[] {
  return ARTIFACT_DEFINITIONS.filter(a => a.setElementKey === elementKey);
}

/** All unique set element keys in display order (matches PACK_DEFINITIONS ordering). */
export const ARTIFACT_SET_ORDER: string[] = [
  'Neutrality',
  'Fire',
  'Light',
  'Thornbound',
  'Mechanical',
  'Prismatic',
  'Dark',
  'SnowboundVoltage',
  'GlassAbsolute',
  'BlazingGarden',
  'Butterfly',
  'EternalSeas',
  'AbyssalForge',
  'DeathFlamedHell',
];

/** Map element key → player-facing set name for the Artifacts menu sidebar. */
export const ARTIFACT_SET_NAMES: Record<string, string> = {
  Neutrality: 'Neutrality',
  Fire: 'Pyroabyss',
  Light: 'Heavenly Light',
  Thornbound: 'Thornbound Plains',
  Mechanical: 'Mechanical Dreams',
  Prismatic: 'Prismatic Accord',
  Dark: 'Black Glass Inferno',
  SnowboundVoltage: 'Snowbound Voltage',
  GlassAbsolute: 'Glass Absolute',
  BlazingGarden: 'The Blazing Garden',
  Butterfly: 'Age of the Butterfly',
  EternalSeas: 'Eternal Seas',
  AbyssalForge: 'Abyssal Forge',
  DeathFlamedHell: 'Death-flamed Hell',
};

/** Map element key → accent color for UI theming. */
export const ARTIFACT_SET_COLORS: Record<string, string> = {
  Neutrality: '#a0a0c0',
  Fire: '#e8622a',
  Light: '#f5d97a',
  Thornbound: '#7dbf72',
  Mechanical: '#6ab0d4',
  Prismatic: '#c97de8',
  Dark: '#7a5fe0',
  SnowboundVoltage: '#80d4f0',
  GlassAbsolute: '#d0e8ff',
  BlazingGarden: '#e07a30',
  Butterfly: '#e88fc8',
  EternalSeas: '#5ab0d8',
  AbyssalForge: '#9aa3ab',
  DeathFlamedHell: '#c03830',
};
