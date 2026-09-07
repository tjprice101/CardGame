import type { AinSophAurDefinition, CardDefinition, DarkCardDefinition, LightCardDefinition } from '@/types/cards';

export interface LegacyCosmeticCard {
  definitionId: string;
  rarity: string;
  name: string;
  description: string;
  artKey: string;
}

const light = (
  definitionId: string,
  name: string,
  artKey: string,
  baseAin: number,
  baseSoph: number,
  scale: number,
): LightCardDefinition => ({
  definitionId,
  type: 'Light',
  rarity: 'Eternal',
  name,
  description: `Eternal Light. Ain Attack: ${baseAin} base Oblivion, +${scale} triune scaling. Soph Attack: ${baseSoph} base Oblivion, +${scale + 80} triune scaling; costs 3 Limitless Light Stacks.`,
  artKey,
  ainAttack: {
    id: `${definitionId}:ain-attack`, label: 'Ain', name: 'Ain Attack',
    description: `${baseAin} base Oblivion with triune scaling.`, baseOblivion: baseAin,
    cooldownCards: 3, scaling: { kind: 'triune', amount: scale }, tags: ['eternal', 'ain-attack'],
  },
  sophAttack: {
    id: `${definitionId}:soph-attack`, label: 'Soph', name: 'Soph Attack',
    description: `${baseSoph} base Oblivion with triune scaling; consumes 3 stacks.`, baseOblivion: baseSoph,
    cooldownCards: 4, scaling: { kind: 'triune', amount: scale + 80 },
    stackCost: { kind: 'fixed', value: 3 }, tags: ['eternal', 'soph-attack'],
  },
  sacrificeOblivionRate: 80,
});

const dark = (
  definitionId: string,
  name: string,
  artKey: string,
  effect: DarkCardDefinition['sophEffects'][number],
  fate: DarkCardDefinition['postActivationFate'],
): DarkCardDefinition => ({
  definitionId,
  type: 'Dark',
  rarity: 'Eternal',
  name,
  description: `Eternal Dark utility. Resolves ${effect.type.replace(/_/g, ' ')} for 4 Limitless Light Stacks, then returns to the ${fate}.`,
  artKey,
  sophEffects: [effect], activationCost: { kind: 'fixed', value: 4 },
  cooldownCardsPlayed: 3, postActivationFate: fate, allowHandCast: true,
  sacrificeOblivionRate: 85,
});

const asa = (
  definitionId: string,
  name: string,
  artKey: string,
  materials: number,
  baseOblivion: number,
  scale: number,
): AinSophAurDefinition => ({
  definitionId,
  type: 'AinSophAur',
  rarity: 'Eternal',
  name,
  description: `Eternal Ain Soph Aur. Sacrifice ${materials} back-row cards to summon. Bridge the Light: ${baseOblivion} base Oblivion, +${scale} triune scaling.`,
  artKey,
  summonCost: Array.from({ length: materials }, (_, index) => `light-neutrality-${index + 1}`),
  onSummonEffects: [{ type: 'oblivion_flat', value: 150 }],
  bridgeAttack: {
    id: `${definitionId}:bridge-the-light`, name: 'Bridge the Light',
    description: `${baseOblivion} base Oblivion with triune scaling.`, baseOblivion,
    cooldownCards: 4, scaling: { kind: 'triune', amount: scale },
    consumesStacks: { kind: 'fixed', value: 4 },
  },
  attacks: { primary: {
    id: `${definitionId}:bridge`, label: 'Primary', name: 'Bridge the Light',
    description: `${baseOblivion} base Oblivion`, baseOblivion, cooldownCards: 4,
    tags: ['eternal', 'bridge'],
  } },
  baseStats: { basePower: 80, bonusType: 'oblivion_per_card', bonusValue: 25 },
});

export const eternalCards: CardDefinition[] = [
  light('btei-voids-reaping', 'The Harrowing of the Last Dawn', 'btei_voids_reaping', 900, 1200, 720),
  dark('btei-temporal-ruin', 'The Ruin of Hours', 'btei_temporal_ruin', { type: 'discard_draw', discard: 1, draw: 3 }, 'hand'),
  dark('btei-null-edict', 'The Null Verdict', 'btei_null_edict', { type: 'search_deck_distinct_types', filter: ['Light', 'Dark', 'AinSophAur'], takePerType: 1 }, 'hand'),
  asa('btei-axiom-of-oblivion', 'The Axiom of Nothing', 'btei_axiom_of_oblivion', 3, 1800, 1300),
  asa('btei-sovereign-domain', 'The Sovereign Quiet', 'btei_sovereign_domain', 2, 1450, 1050),
  light('btei-convergence-of-eternity', 'The Convergence Beyond Time', 'btei_convergence_of_eternity', 1100, 1500, 980),
  light('btei-omniscient-fracture', 'The Fracture of Knowing', 'btei_omniscient_fracture', 980, 1350, 820),
  asa('btei-neutrality-void-throne', 'The Throne of Equilibrium', 'btei_neutrality_void_throne', 2, 1550, 1120),
  light('btei-neutrality-prime-equilibrium', 'The Prime Judge of Silence', 'btei_neutrality_prime_equilibrium', 1050, 1400, 900),
] as const;

