export type AbilitySlot = 1 | 2 | 3;

export interface AbilityDefinition {
  readonly id: string;
  readonly setId: string;
  readonly name: string;
  readonly description: string;
  readonly purchaseCost: number;
  readonly cooldownSeconds?: number;
  readonly stackCost?: number;
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
  },
  {
    id: 'nullified-barricade',
    setId: 'Neutrality',
    name: 'Nullified Barricade',
    description: 'Spend 5 Limitless Light Stacks to gain Divine Field for 60 seconds. Each card played during Divine Field grants 50 Divine Light.',
    purchaseCost: 5_000,
    stackCost: 5,
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
  },
];

export const ABILITY_REGISTRY = new Map(ABILITY_DEFINITIONS.map(ability => [ability.id, ability]));
