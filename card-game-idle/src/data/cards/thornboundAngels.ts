import type { AngelDefinition } from '@/types/cards';

export const thornboundAngels: AngelDefinition[] = [
  {
    definitionId: 'tbp-angel-irielle-bramble-gate',
    type: 'Angel',
    element: 'Thornbound',
    rarity: 'Legendary',
    name: 'Irielle Thorn Saint of the Last Road',
    description: 'On summon: Gain 2 Trail; Draw 1 card. After 4 cards played: Spend 3 Trail; +200 Oblivion. While on board: +8 Oblivion for each Seraphim on board while on board',
    artKey: 'tbp_angel_irielle_bramble_gate',
    summonCost: ['tbp-ser-thornplate-sentry', 'tbp-ser-vinedusk-lancer'],
    extraSummonConditions: [{ type: 'cherubim_active_gte', value: 1 }],
    onSummonEffects: [
      { type: 'trail_gain', value: 2 },
      { type: 'draw', value: 1 }],
    activatedAbility: {
      name: 'March Through Ruin',
      cardsPlayedRequirement: 4,
      description: 'Spend 3 Trail; +200 Oblivion',
      effects: [
        { type: 'trail_spend', value: 3 },
        { type: 'oblivion_flat', value: 200 }],
    },
    attacks: {
      primary: {
        id: 'tbp-angel-irielle-bramble-gate:primary',
        label: 'Primary',
        name: 'Irielle Thorn Ordinance',
        description: '346 base Oblivion · 3 cards cooldown',
        baseOblivion: 965,
        cooldownCards: 5,
        costs: [],
        tags: ['angel', 'primary', 'thornbound'],
      },
      exalted: {
        id: 'tbp-angel-irielle-bramble-gate:exalted',
        label: 'Exalted',
        name: 'Irielle Thorn Throne Decree',
        description: '3472 base Oblivion · 7 cards cooldown · Cost: spend 94 Trail, sacrifice 1 Seraphim',
        baseOblivion: 2220,
        cooldownCards: 7,
        costs: [],
        tags: ['angel', 'exalted', 'thornbound'],
      },
    },
    baseStats: {
      basePower: 0,
      bonusType: 'oblivion_per_seraphim',
      bonusValue: 8,
    },
  },
  {
    definitionId: 'tbp-angel-velmora-harrowed-crown',
    type: 'Angel',
    element: 'Thornbound',
    rarity: 'Legendary',
    name: 'Velmora Crown of Harrowed Plains',
    description: 'On summon: Gain 4 Trail; +170 Oblivion. After 5 cards played: Spend 9999 Trail; +260 Oblivion. While on board: +16 Oblivion per card played while on board',
    artKey: 'tbp_angel_velmora_harrowed_crown',
    summonCost: ['tbp-ser-crimson-mire-exarch', 'tbp-ser-scar-mantle-reclaimer', 'tbp-ser-white-briar-penitent'],
    extraSummonConditions: [{ type: 'cherubim_active_gte', value: 2 }],
    onSummonEffects: [
      { type: 'trail_gain', value: 4 },
      { type: 'oblivion_flat', value: 170 }],
    activatedAbility: {
      name: 'Blood-Road Apotheosis',
      cardsPlayedRequirement: 5,
      description: 'Spend 9999 Trail; +260 Oblivion',
      effects: [
        { type: 'trail_spend', value: 9999 },
        { type: 'oblivion_flat', value: 260 }],
    },
    attacks: {
      primary: {
        id: 'tbp-angel-velmora-harrowed-crown:primary',
        label: 'Primary',
        name: 'Velmora Crown Ordinance',
        description: '382 base Oblivion · 5 cards cooldown',
        baseOblivion: 1000,
        cooldownCards: 5,
        costs: [],
        tags: ['angel', 'primary', 'thornbound'],
      },
      exalted: {
        id: 'tbp-angel-velmora-harrowed-crown:exalted',
        label: 'Exalted',
        name: 'Velmora Crown Throne Decree',
        description: '908 base Oblivion · 8 cards cooldown · Cost: spend 7 Trail, discard 1 card',
        baseOblivion: 2300,
        cooldownCards: 7,
        costs: [],
        tags: ['angel', 'exalted', 'thornbound'],
      },
    },
    baseStats: {
      basePower: 0,
      bonusType: 'oblivion_per_card',
      bonusValue: 16,
    },
  }];