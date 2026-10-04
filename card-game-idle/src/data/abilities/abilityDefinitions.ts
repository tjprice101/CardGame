import type { GardenRewardCurrency } from '@/types/dungeons';
import { CardRegistry } from '@/cards/CardRegistry';
import { getCardSetId } from '@/data/elements';

export type AbilitySlot = 1 | 2 | 3;
export type AbilityTier = 'foundational' | 'eternal' | 'infinite' | 'transcendent';
export type AbilityMaterialCost = Partial<Record<GardenRewardCurrency, number>>;

export interface AbilityDefinition {
  readonly id: string;
  readonly setId: string;
  readonly name: string;
  readonly description: string;
  readonly cooldownSeconds?: number;
  readonly durationSeconds?: number;
  readonly stackCost?: number;
  readonly iconAssetKey: string;
  readonly ownershipGate?: 'anyNeutralityEternal' | 'anyNeutralityInfinite' | 'allCausalityBase' | 'anyCausalityEternal' | 'anyCausalityInfinite' | 'allIntensityBase' | 'anyIntensityEternal' | 'anyIntensityInfinite';
  readonly cosmosCost?: number;
  readonly consumesAllCosmos?: boolean;
  readonly infernoCost?: number;
  readonly consumesAllInferno?: boolean;
  readonly buff?: {
    readonly id: string;
    readonly name: string;
    readonly durationSeconds: number;
    readonly iconAssetKey: string;
    readonly description: string;
  };
}

export const ABILITY_ICON_FALLBACKS: Readonly<Record<string, { folder: string; file: string }>> = {
  'forge-ability-first-dawn-accord': { folder: 'forge', file: 'forge-card-1-art.png' },
  'forge-ability-axiom-of-acceleration': { folder: 'forge', file: 'forge-card-2-art.png' },
  'forge-ability-vault-unwritten-futures': { folder: 'forge', file: 'forge-card-3-art.png' },
  'forge-ability-confluence-all-origins': { folder: 'forge', file: 'forge-of-transcendence-menu-banner.png' },
};

export const ABILITY_DEFINITIONS: readonly AbilityDefinition[] = [
  {
    id: 'intensity-kindle-the-depths', setId: 'Intensity', name: 'Kindle the Depths',
    description: 'Spend 3 Limitless Light Stacks to gain 4 Limitless Inferno. Cooldown: 35 seconds.',
    stackCost: 3, cooldownSeconds: 35, ownershipGate: 'allIntensityBase', iconAssetKey: 'intensity-kindle-the-depths',
  },
  {
    id: 'intensity-bank-the-flame', setId: 'Intensity', name: 'Bank the Flame',
    description: 'Convert 6 Limitless Inferno into 12 Limitless Light Stacks. Cooldown: 55 seconds.',
    infernoCost: 6, cooldownSeconds: 55, ownershipGate: 'allIntensityBase', iconAssetKey: 'intensity-bank-the-flame',
  },
  {
    id: 'intensity-temper-the-hand', setId: 'Intensity', name: 'Temper the Hand',
    description: 'Spend 4 Limitless Inferno to draw 2 cards. Requires a nonempty draw pile. Cooldown: 60 seconds.',
    infernoCost: 4, cooldownSeconds: 60, ownershipGate: 'allIntensityBase', iconAssetKey: 'intensity-temper-the-hand',
  },
  {
    id: 'intensity-cinder-recall', setId: 'Intensity', name: 'Cinder Recall',
    description: 'Spend 8 Limitless Inferno to recover up to 2 most recently discarded Intensity Light or Dark cards. Requires at least 1 eligible card. Cooldown: 120 seconds.',
    infernoCost: 8, cooldownSeconds: 120, ownershipGate: 'anyIntensityEternal', iconAssetKey: 'intensity-cinder-recall',
  },
  {
    id: 'intensity-white-hot-reprieve', setId: 'Intensity', name: 'White-hot Reprieve',
    description: 'Spend 10 Limitless Inferno to reduce every active Intensity card cooldown by 2. Recover 1 Inferno per card accelerated, up to 4. Cooldown: 120 seconds.',
    infernoCost: 10, cooldownSeconds: 120, ownershipGate: 'anyIntensityEternal', iconAssetKey: 'intensity-white-hot-reprieve',
  },
  {
    id: 'intensity-unquenched-reserve', setId: 'Intensity', name: 'Unquenched Reserve',
    description: 'Spend 12 Limitless Inferno to double your next positive Inferno gain this turn. Does not stack with an existing reserved gain. Cooldown: 180 seconds.',
    infernoCost: 12, cooldownSeconds: 180, ownershipGate: 'anyIntensityInfinite', iconAssetKey: 'intensity-unquenched-reserve',
  },
  {
    id: 'intensity-crucible-without-end', setId: 'Intensity', name: 'Crucible Without End',
    description: 'Consume all Limitless Inferno, requiring 20, to gain 500 base Divine Light per stack and add up to 5 charges to each face-down Intensity Soph card (1 per 10 stacks consumed). Cooldown: 180 seconds.',
    consumesAllInferno: true, infernoCost: 20, cooldownSeconds: 180, ownershipGate: 'anyIntensityInfinite', iconAssetKey: 'intensity-crucible-without-end',
  },
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
    description: 'Spend 8 Limitless Cosmos to draw 5 cards and recover one Light and one Dark card from your deck. Ain Soph Aur cards remain in the Extra Deck. Cooldown: 150 seconds.',
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
  {
    id: 'transcendent-starbound-glimmer',
    setId: 'Transcendent',
    name: 'First Dawn Accord',
    description: 'Spend 6 Limitless Light Stacks to grant Dawn\'s Favor: your next 3 cards played each grant 1,500 base Divine Light. Cooldown: 90 seconds.',
    cooldownSeconds: 90,
    stackCost: 6,
    iconAssetKey: 'forge-ability-first-dawn-accord',
  },
  {
    id: 'transcendent-first-catalyst',
    setId: 'Transcendent',
    name: 'Axiom of Acceleration',
    description: 'Spend 8 Limitless Light Stacks to accelerate your next 3 card plays: each adds 1 extra charge to every face-down Soph card. Cooldown: 105 seconds.',
    cooldownSeconds: 105,
    stackCost: 8,
    iconAssetKey: 'forge-ability-axiom-of-acceleration',
  },
  {
    id: 'transcendent-reliquary-all-nothing',
    setId: 'Transcendent',
    name: 'Vault of Unwritten Futures',
    description: 'Spend 10 Limitless Light Stacks to choose 2 cards from your discard pile and raise your hand limit by 2 for 40 seconds. When it expires, discard down to your normal hand limit. Cooldown: 2 minutes.',
    cooldownSeconds: 120,
    durationSeconds: 40,
    stackCost: 10,
    iconAssetKey: 'forge-ability-vault-unwritten-futures',
  },
  {
    id: 'transcendent-bridge-light-life',
    setId: 'Transcendent',
    name: 'Confluence of All Origins',
    description: 'Spend 12 Limitless Light Stacks to empower your next Ain, Soph, or Bridge attack with +2 multiplier. Cooldown: 150 seconds.',
    cooldownSeconds: 150,
    stackCost: 12,
    iconAssetKey: 'forge-ability-confluence-all-origins',
  },
];

export const ABILITY_REGISTRY = new Map(ABILITY_DEFINITIONS.map(ability => [ability.id, ability]));

export const PENDING_ABILITY_ART_KEYS: ReadonlySet<string> = new Set();

export function getAbilityTier(ability: AbilityDefinition): AbilityTier {
  if (ability.setId === 'Transcendent') return 'transcendent';
  if (ability.ownershipGate === 'anyNeutralityInfinite' || ability.ownershipGate === 'anyCausalityInfinite' || ability.ownershipGate === 'anyIntensityInfinite') return 'infinite';
  if (ability.ownershipGate === 'anyNeutralityEternal' || ability.ownershipGate === 'anyCausalityEternal' || ability.ownershipGate === 'anyIntensityEternal') return 'eternal';
  if (ability.ownershipGate === 'allCausalityBase') return 'foundational';
  return 'foundational';
}

export function getAbilityMaterialCost(ability: AbilityDefinition): AbilityMaterialCost {
  const tier = getAbilityTier(ability);
  if (ability.setId === 'Transcendent') return { divineLight: 8_000_000, shardsOfTranscendence: 30 };
  if (ability.setId === 'Intensity') {
    if (tier === 'infinite') return { solarSlag: 12, heartOfTheInferno: 6 };
    if (tier === 'eternal') return { abyssalCinder: 10, solarSlag: 4 };
    return { emberglass: 12, abyssalCinder: 2 };
  }
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
  if (ability.ownershipGate === 'allIntensityBase') {
    const baseIds = CardRegistry.getAll()
      .filter(card => card.definitionId.includes('-intensity-') && !['Eternal', 'Infinite', 'Transcendent'].includes(card.rarity))
      .map(card => card.definitionId);
    return baseIds.length > 0 && baseIds.every(id => (collection[id] ?? 0) > 0);
  }
  if (ability.ownershipGate === 'anyIntensityEternal') {
    return Object.entries(collection).some(([id, count]) => id.startsWith('eternal-intensity-') && count > 0);
  }
  if (ability.ownershipGate === 'anyIntensityInfinite') {
    return Object.entries(infiniteCollection).some(([id, count]) => id.startsWith('infinite-intensity-') && count > 0);
  }
  if (ability.ownershipGate === 'anyNeutralityEternal') {
    return Object.entries(collection).some(([id, count]) => count > 0 && getCardSetId(id) === 'Neutrality' && CardRegistry.get(id)?.rarity === 'Eternal');
  }
  if (ability.ownershipGate === 'anyNeutralityInfinite') {
    return Object.entries(infiniteCollection).some(([id, count]) => count > 0 && getCardSetId(id) === 'Neutrality' && CardRegistry.get(id)?.rarity === 'Infinite');
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
