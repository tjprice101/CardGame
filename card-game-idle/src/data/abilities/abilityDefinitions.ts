import type { GardenRewardCurrency } from '@/types/dungeons';

export type AbilitySlot = 1 | 2 | 3;
export type AbilityTier = 'foundational' | 'eternal' | 'infinite';
export type AbilityMaterialCost = Partial<Record<GardenRewardCurrency, number>>;

export interface AbilityDefinition {
  readonly id: string;
  readonly setId: string;
  readonly name: string;
  readonly description: string;
  readonly cooldownSeconds?: number;
  readonly stackCost?: number;
  readonly iconAssetKey: string;
  readonly ownershipGate?: 'anyNeutralityEternal' | 'anyNeutralityInfinite' | 'allCausalityBase' | 'anyCausalityEternal' | 'anyCausalityInfinite';
  readonly cosmosCost?: number;
  readonly consumesAllCosmos?: boolean;
  readonly buff?: {
    readonly id: string;
    readonly name: string;
    readonly durationSeconds: number;
    readonly iconAssetKey: string;
    readonly description: string;
  };
}

export const ABILITY_DEFINITIONS: readonly AbilityDefinition[] = [
  {
    id: 'neutralizing-inferno',
    setId: 'Neutrality',
    name: 'Neutralizing Inferno',
    description: 'Discard 1 card to gain Divine Light equal to your current Limitless Light Stacks multiplied by 500. Cooldown: 30 seconds.',
    cooldownSeconds: 30,
    iconAssetKey: 'neutralizing-inferno',
  },
  {
    id: 'nullified-barricade',
    setId: 'Neutrality',
    name: 'Nullified Barricade',
    description: 'Spend 5 Limitless Light Stacks to gain Divine Field for 60 seconds. Each card played during Divine Field grants 50 Divine Light.',
    stackCost: 5,
    iconAssetKey: 'nullified-barricade',
    buff: {
      id: 'divine-field',
      name: 'Divine Field',
      durationSeconds: 60,
      iconAssetKey: 'nullified-barricade',
      description: '+50 Divine Light per card played.',
    },
  },
  {
    id: 'phantom-matrix',
    setId: 'Neutrality',
    name: 'Phantom Matrix',
    description: 'Spend 10 Limitless Light Stacks to free-summon any Ain Soph Aur from the Extra Deck.',
    stackCost: 10,
    iconAssetKey: 'phantom-matrix',
  },
  {
    id: 'null-horizon',
    setId: 'Neutrality',
    name: 'Null Horizon',
    description: 'Spend 15 Limitless Light Stacks to reduce every active card cooldown by 2.',
    stackCost: 15,
    cooldownSeconds: 90,
    ownershipGate: 'anyNeutralityEternal',
    iconAssetKey: 'null-horizon',
  },
  {
    id: 'axiomatic-reversal',
    setId: 'Neutrality',
    name: 'Axiomatic Reversal',
    description: 'Discard 2 cards to gain 50,000 Divine Light and draw 1 card. Cooldown: 120 seconds.',
    cooldownSeconds: 120,
    ownershipGate: 'anyNeutralityEternal',
    iconAssetKey: 'axiomatic-reversal',
  },
  {
    id: 'whiteout-domain',
    setId: 'Neutrality',
    name: 'Whiteout Domain',
    description: 'Spend 20 Limitless Light Stacks to gain Whiteout Domain for 45 seconds. Each card played during it grants 100 Divine Light.',
    stackCost: 20,
    cooldownSeconds: 120,
    ownershipGate: 'anyNeutralityInfinite',
    iconAssetKey: 'whiteout-domain',
    buff: {
      id: 'whiteout-domain',
      name: 'Whiteout Domain',
      durationSeconds: 45,
      iconAssetKey: 'whiteout-domain',
      description: '+100 Divine Light per card played.',
    },
  },
  {
    id: 'infinite-accord',
    setId: 'Neutrality',
    name: 'Infinite Accord',
    description: 'Spend 30 Limitless Light Stacks to restore all Light attack cooldowns and gain 10,000 Divine Light.',
    stackCost: 30,
    cooldownSeconds: 180,
    ownershipGate: 'anyNeutralityInfinite',
    iconAssetKey: 'infinite-accord',
  },
  {
    id: 'causality-author-first-cause',
    setId: 'Causality',
    name: 'Author the First Cause',
    description: 'Spend 4 Limitless Light Stacks to gain 3 Limitless Cosmos. If your Cosmos pool was empty, gain 1 additional Cosmos. Cooldown: 35 seconds.',
    cooldownSeconds: 35,
    stackCost: 4,
    ownershipGate: 'allCausalityBase',
    iconAssetKey: 'causality-author-first-cause',
  },
  {
    id: 'causality-causal-cartography',
    setId: 'Causality',
    name: 'Causal Cartography',
    description: 'Spend 6 Limitless Light Stacks to gain 4 Limitless Cosmos and draw 3 cards. Cooldown: 55 seconds.',
    cooldownSeconds: 55,
    stackCost: 6,
    ownershipGate: 'allCausalityBase',
    iconAssetKey: 'causality-causal-cartography',
  },
  {
    id: 'causality-pearlescent-mandate',
    setId: 'Causality',
    name: 'Pearlescent Mandate',
    description: 'Spend 6 Limitless Cosmos to reduce active Causality card cooldowns by 2 and gain 12 Limitless Light Stacks. Cooldown: 100 seconds.',
    cooldownSeconds: 100,
    cosmosCost: 6,
    ownershipGate: 'anyCausalityEternal',
    iconAssetKey: 'causality-pearlescent-mandate',
  },
  {
    id: 'causality-archive-elsewhen',
    setId: 'Causality',
    name: 'Archive of Elsewhen',
    description: 'Spend 8 Limitless Cosmos to draw 5 cards and recover one Light, Dark, and Ain Soph Aur card from your deck. Cooldown: 150 seconds.',
    cooldownSeconds: 150,
    cosmosCost: 8,
    ownershipGate: 'anyCausalityEternal',
    iconAssetKey: 'causality-archive-elsewhen',
  },
  {
    id: 'causality-final-cause',
    setId: 'Causality',
    name: 'Final Cause',
    description: 'Consume all Limitless Cosmos, requiring 5, to gain 1,500 Divine Light per Cosmos stack and reduce active Causality cooldowns by up to 5. Cooldown: 180 seconds.',
    cooldownSeconds: 180,
    consumesAllCosmos: true,
    ownershipGate: 'anyCausalityInfinite',
    iconAssetKey: 'causality-final-cause',
  },
  {
    id: 'causality-infinite-manuscript',
    setId: 'Causality',
    name: 'Infinite Manuscript',
    description: 'Spend 12 Limitless Cosmos to draw 5 cards, refresh active Causality card cooldowns, and gain 75,000 Divine Light. Cooldown: 240 seconds.',
    cooldownSeconds: 240,
    cosmosCost: 12,
    ownershipGate: 'anyCausalityInfinite',
    iconAssetKey: 'causality-infinite-manuscript',
  },
];

export const ABILITY_REGISTRY = new Map(ABILITY_DEFINITIONS.map(ability => [ability.id, ability]));

export function getAbilityTier(ability: AbilityDefinition): AbilityTier {
  if (ability.ownershipGate === 'anyNeutralityInfinite' || ability.ownershipGate === 'anyCausalityInfinite') return 'infinite';
  if (ability.ownershipGate === 'anyNeutralityEternal' || ability.ownershipGate === 'anyCausalityEternal') return 'eternal';
  if (ability.ownershipGate === 'allCausalityBase') return 'foundational';
  return 'foundational';
}

export function getAbilityMaterialCost(ability: AbilityDefinition): AbilityMaterialCost {
  const tier = getAbilityTier(ability);
  if (ability.setId === 'Causality') {
    if (tier === 'infinite') return { shatteredCausalTranscript: 12, heartOfCausality: 6 };
    if (tier === 'eternal') return { causalBloom: 10, shatteredCausalTranscript: 4 };
    return { seedOfCausality: 12, causalBloom: 2 };
  }
  if (tier === 'infinite') return { nullSearedLight: 12, nullifiedOblivionMatter: 8 };
  if (tier === 'eternal') return { nullifiedLattice: 10, nullSearedLight: 8, nullifiedOblivionMatter: 2 };
  return { nullifiedLattice: 12, nullSearedLight: 2 };
}

export function meetsAbilityOwnershipGate(
  ability: AbilityDefinition,
  collection: Record<string, number>,
  infiniteCollection: Record<string, number>,
): boolean {
  if (!ability.ownershipGate) return true;
  if (ability.ownershipGate === 'anyNeutralityEternal') {
    return Object.entries(collection).some(([definitionId, count]) => definitionId.startsWith('btei-') && count > 0);
  }
  if (ability.ownershipGate === 'anyNeutralityInfinite') {
    return Object.entries(infiniteCollection).some(([definitionId, count]) => definitionId.startsWith('inf-') && count > 0);
  }
  if (ability.ownershipGate === 'anyCausalityEternal') {
    return Object.entries(collection).some(([definitionId, count]) => definitionId.startsWith('btei-causality-') && count > 0);
  }
  if (ability.ownershipGate === 'anyCausalityInfinite') {
    return Object.entries(infiniteCollection).some(([definitionId, count]) => definitionId.startsWith('inf-causality-') && count > 0);
  }
  const causalityBaseIds = Array.from({ length: 10 }, (_, index) => `light-causality-${index + 1}`)
    .concat(Array.from({ length: 10 }, (_, index) => `dark-causality-${index + 1}`))
    .concat(Array.from({ length: 5 }, (_, index) => `ain-soph-aur-causality-${index + 1}`));
  return causalityBaseIds.every(definitionId => (collection[definitionId] ?? 0) > 0);
}
