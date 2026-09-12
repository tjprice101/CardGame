export type AbilitySlot = 1 | 2 | 3;

export interface AbilityDefinition {
  readonly id: string;
  readonly setId: string;
  readonly name: string;
  readonly description: string;
  readonly purchaseCost: number;
  readonly cooldownSeconds?: number;
  readonly stackCost?: number;
  readonly iconAssetKey: string;
  readonly ownershipGate?: 'anyNeutralityEternal' | 'anyNeutralityInfinite';
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
    purchaseCost: 5_000,
    cooldownSeconds: 30,
    iconAssetKey: 'null-horizon',
  },
  {
    id: 'nullified-barricade',
    setId: 'Neutrality',
    name: 'Nullified Barricade',
    description: 'Spend 5 Limitless Light Stacks to gain Divine Field for 60 seconds. Each card played during Divine Field grants 50 Divine Light.',
    purchaseCost: 5_000,
    stackCost: 5,
    iconAssetKey: 'whiteout-domain',
    buff: {
      id: 'divine-field',
      name: 'Divine Field',
      durationSeconds: 60,
      iconAssetKey: 'buff_divine_field',
      description: '+50 Divine Light per card played.',
    },
  },
  {
    id: 'phantom-matrix',
    setId: 'Neutrality',
    name: 'Phantom Matrix',
    description: 'Spend 10 Limitless Light Stacks to free-summon any Ain Soph Aur from the Extra Deck.',
    purchaseCost: 5_000,
    stackCost: 10,
    iconAssetKey: 'whiteout-domain',
  },
  {
    id: 'null-horizon',
    setId: 'Neutrality',
    name: 'Null Horizon',
    description: 'Spend 15 Limitless Light Stacks to reduce every active card cooldown by 2. Cost: 97,000 Divine Light.',
    purchaseCost: 97_000,
    stackCost: 15,
    cooldownSeconds: 90,
    ownershipGate: 'anyNeutralityEternal',
    iconAssetKey: 'null-horizon',
  },
  {
    id: 'axiomatic-reversal',
    setId: 'Neutrality',
    name: 'Axiomatic Reversal',
    description: 'Discard 2 cards to gain 5,000 Divine Light and draw 3 cards. Cost: 97,000 Divine Light.',
    purchaseCost: 97_000,
    cooldownSeconds: 120,
    ownershipGate: 'anyNeutralityEternal',
    iconAssetKey: 'axiomatic-reversal',
  },
  {
    id: 'whiteout-domain',
    setId: 'Neutrality',
    name: 'Whiteout Domain',
    description: 'Spend 20 Limitless Light Stacks to gain Whiteout Domain for 45 seconds. Each card played during it grants 100 Divine Light.',
    purchaseCost: 450_000,
    stackCost: 20,
    cooldownSeconds: 120,
    ownershipGate: 'anyNeutralityInfinite',
    iconAssetKey: 'whiteout-domain',
    buff: {
      id: 'whiteout-domain',
      name: 'Whiteout Domain',
      durationSeconds: 45,
      iconAssetKey: 'buff_whiteout_domain',
      description: '+100 Divine Light per card played.',
    },
  },
  {
    id: 'infinite-accord',
    setId: 'Neutrality',
    name: 'Infinite Accord',
    description: 'Spend 30 Limitless Light Stacks to restore all Light attack cooldowns and gain 10,000 Divine Light. Cost: 450,000 Divine Light.',
    purchaseCost: 450_000,
    stackCost: 30,
    cooldownSeconds: 180,
    ownershipGate: 'anyNeutralityInfinite',
    iconAssetKey: 'infinite-accord',
  },
];

export const ABILITY_REGISTRY = new Map(ABILITY_DEFINITIONS.map(ability => [ability.id, ability]));

export function meetsAbilityOwnershipGate(
  ability: AbilityDefinition,
  collection: Record<string, number>,
  infiniteCollection: Record<string, number>,
): boolean {
  if (!ability.ownershipGate) return true;
  if (ability.ownershipGate === 'anyNeutralityEternal') {
    return Object.entries(collection).some(([definitionId, count]) => definitionId.startsWith('btei-') && count > 0);
  }
  return Object.entries(infiniteCollection).some(([definitionId, count]) => definitionId.startsWith('inf-') && count > 0);
}
