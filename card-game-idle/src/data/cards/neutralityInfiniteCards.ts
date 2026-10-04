import type { AinSophAurDefinition, CardDefinition, LightCardDefinition, SpectrumLevel } from '@/types/cards';
import { getSpectrumAinBase, getSpectrumBridgeBase, getSpectrumScaling, getSpectrumSophBase } from './spectrumPower';

function attacks(id: string, level: SpectrumLevel, ainName: string, sophName: string, cost: number): Pick<LightCardDefinition, 'ainAttack' | 'sophAttack'> {
  const ain = getSpectrumAinBase('Infinite', level, 'infinite');
  const soph = getSpectrumSophBase('Infinite', level, 'infinite');
  return {
    ainAttack: {
      id: `${id}:ain`, label: 'Ain', name: ainName, description: `${ain} base Divine Light, scaled by Collection Power.`,
      baseDivineLight: ain, cooldownCards: 2, scaling: { kind: 'linear', reads: 'collectionPower', multiplier: getSpectrumScaling(ain) },
      tags: ['neutrality', 'infinite', 'ain-attack'],
    },
    sophAttack: {
      id: `${id}:soph`, label: 'Soph', name: sophName, description: `${soph} base Divine Light, scaled by Collection Power. Consume ${cost} Limitless Light Stacks.`,
      baseDivineLight: soph, cooldownCards: 3, scaling: { kind: 'linear', reads: 'collectionPower', multiplier: getSpectrumScaling(soph) },
      stackCost: { kind: 'fixed', value: cost }, tags: ['neutrality', 'infinite', 'soph-attack'],
    },
  };
}

function bridge(id: string, level: SpectrumLevel, name: string, cost: number): AinSophAurDefinition['bridgeAttack'] {
  const base = getSpectrumBridgeBase('Infinite', level, 'infinite');
  return {
    id: `${id}:bridge`, name, description: `${base} base Divine Light, scaled by Collection Power. Consume ${cost} Limitless Light Stacks.`,
    baseDivineLight: base, cooldownCards: 3, scaling: { kind: 'linear', reads: 'collectionPower', multiplier: getSpectrumScaling(base) },
    consumesStacks: { kind: 'fixed', value: cost },
  };
}

export const neutralityInfiniteCards: CardDefinition[] = [
  {
    definitionId: 'inf-oblivion-absolute', type: 'Dark', rarity: 'Infinite', spectrumLevel: 5,
    name: 'The Absolute Null', artKey: 'inf_oblivion_absolute',
    description: 'After paying 5 Light Stacks, gain 400 base Divine Light per remaining Light Stack, up to 12,000. Then recover up to 2 Neutrality Light/Dark cards from the Light-bound Abyss.',
    activationCost: { kind: 'fixed', value: 5 }, persistent: true, cooldownCardsPlayed: 4, postActivationFate: 'hand', sacrificeStackRate: 100,
    sophEffects: [{ type: 'neutrality_stack_resonance', perStack: 400, cap: 12_000 }, { type: 'neutrality_abyss_reclaim', count: 2 }],
  },
  {
    definitionId: 'inf-void-cascade', type: 'Dark', rarity: 'Infinite', spectrumLevel: 4,
    name: 'The Cascade of the Hollow Sky', artKey: 'inf_void_cascade',
    description: 'Release up to 8 charge from Neutrality Soph supports into Light Stacks and gain 600 base Divine Light per charge released. Then draw 3 cards. Released charge is removed from those supports.',
    activationCost: { kind: 'fixed', value: 2 }, persistent: true, cooldownCardsPlayed: 3, postActivationFate: 'hand', sacrificeStackRate: 100,
    sophEffects: [{ type: 'neutrality_charge_release', cap: 8, divineLightPerCharge: 600 }, { type: 'draw', value: 3 }],
  },
  {
    definitionId: 'inf-genesis-throne', type: 'Light', rarity: 'Infinite', spectrumLevel: 4,
    name: 'The White Throne Before Beginning', artKey: 'inf_genesis_throne',
    description: 'Soph placement: recover up to 2 Neutrality Light/Dark cards from the Light-bound Abyss, give every Neutrality Soph support 2 charge, and gain 4 Light Stacks.',
    ...attacks('inf-genesis-throne', 4, 'First Throne', 'Dawn Before Time', 5), sacrificeStackRate: 100,
    sophPlacementEffects: [{ type: 'neutrality_abyss_reclaim', count: 2 }, { type: 'neutrality_charge_grant', value: 2 }, { type: 'light_stacks_flat', value: 4 }],
  },
  {
    definitionId: 'inf-null-apex', type: 'Light', rarity: 'Infinite', spectrumLevel: 5,
    name: 'The Apex of Nothing', artKey: 'inf_null_apex',
    description: 'Soph placement: gain 300 base Divine Light per held Light Stack, up to 9,000; inspect the top 6 cards and keep 2, then gain 6 Light Stacks.',
    ...attacks('inf-null-apex', 5, 'Silent Zenith', 'Apex Without Horizon', 7), sacrificeStackRate: 100,
    sophPlacementEffects: [{ type: 'neutrality_stack_resonance', perStack: 300, cap: 9_000 }, { type: 'look_top_take', look: 6, take: 2 }, { type: 'light_stacks_flat', value: 6 }],
  },
  {
    definitionId: 'inf-entropic-crown', type: 'Dark', rarity: 'Infinite', spectrumLevel: 5,
    name: 'The Crown of Unmaking', artKey: 'inf_entropic_crown',
    description: 'Reduce every Neutrality card attack/activation cooldown by 2 cards. Gain 1 Light Stack per card accelerated, up to 4, then search for 1 Light and 1 Dark card.',
    activationCost: { kind: 'fixed', value: 3 }, persistent: true, cooldownCardsPlayed: 4, postActivationFate: 'hand', sacrificeStackRate: 100,
    sophEffects: [{ type: 'neutrality_cooldown_reduction', value: 2, stackPerCard: 1, cap: 4 }, { type: 'search_deck_distinct_types', filter: ['Light', 'Dark'], takePerType: 1 }],
  },
  {
    definitionId: 'inf-annihilation-field', type: 'Dark', rarity: 'Infinite', spectrumLevel: 4,
    name: 'The Garden of Annihilation', artKey: 'inf_annihilation_field',
    description: 'Shuffle your discard into the deck and draw 3. If at least 2 drawn cards are Dark, draw 2 more; if at least 2 are Light, gain 6,000 base Divine Light. Then gain 4 Light Stacks.',
    activationCost: { kind: 'fixed', value: 3 }, persistent: true, cooldownCardsPlayed: 4, postActivationFate: 'hand', sacrificeStackRate: 100,
    sophEffects: [{ type: 'shuffle_discard' }, { type: 'draw_with_type_bonuses', value: 3, drawFilter: 'Dark', drawThreshold: 2, bonusDraw: 2, gainFilter: 'Light', gainThreshold: 2, gainDivineLight: 6_000 }, { type: 'light_stacks_flat', value: 4 }],
  },
  {
    definitionId: 'inf-sovereign-void', type: 'AinSophAur', rarity: 'Infinite', spectrumLevel: 5,
    name: 'The Sovereign Veil', artKey: 'inf_sovereign_void',
    description: 'Summon using 1 Ain Light and 1 Ain Dark. Gain 6,000 base Divine Light, then 1,500 more and 2 Light Stacks per remaining Neutrality Light/Dark support pair. Draw 2 cards.',
    summonMaterialCount: 2, summonMaterials: [{ cardTypes: ['Light'], side: 'ain', count: 1 }, { cardTypes: ['Dark'], side: 'ain', count: 1 }],
    onSummonEffects: [{ type: 'divine_light_flat', value: 6_000 }, { type: 'neutrality_equilibrium', divineLightPerPair: 1_500, stacksPerPair: 2 }, { type: 'draw', value: 2 }],
    bridgeAttack: bridge('inf-sovereign-void', 5, 'Dominion of the Quiet', 8),
  },
  {
    definitionId: 'inf-eternity-rupture', type: 'AinSophAur', rarity: 'Infinite', spectrumLevel: 4,
    name: 'The Rift of Outer Silence', artKey: 'inf_eternity_rupture',
    description: 'Summon using 1 Light and 1 Dark. Reduce Neutrality cooldowns by 2, grant each remaining Neutrality Soph support 2 charge, shuffle discard into the deck, draw 3, and gain 6 Light Stacks.',
    summonMaterialCount: 2, summonMaterials: [{ cardTypes: ['Light'], count: 1 }, { cardTypes: ['Dark'], count: 1 }],
    onSummonEffects: [{ type: 'neutrality_cooldown_reduction', value: 2, stackPerCard: 0, cap: 0 }, { type: 'neutrality_charge_grant', value: 2 }, { type: 'shuffle_discard' }, { type: 'draw', value: 3 }, { type: 'light_stacks_flat', value: 6 }],
    bridgeAttack: bridge('inf-eternity-rupture', 4, 'Seam Beyond Silence', 6),
  },
];
