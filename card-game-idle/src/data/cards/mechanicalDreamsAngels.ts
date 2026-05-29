import type { AngelDefinition } from '@/types/cards';

export const mechanicalDreamsAngels: AngelDefinition[] = [
  {
    definitionId: 'md-angel-ori9-broken-sleep',
    type: 'Angel',
    element: 'Mechanical',
    rarity: 'Legendary',
    name: 'ORI-9 Archon of Broken Sleep',
    description: 'On summon: Gain 1 Strain; Draw 1 card. After 4 cards played: Gain 2 Strain; +220 Oblivion; Vent 1 Strain. While on board: +9 Oblivion for each Seraphim on board while on board',
    artKey: 'md_angel_ori9_broken_sleep',
    summonCost: ['md-ser-dreamforge-lancer', 'md-ser-ivory-null-operator'],
    extraSummonConditions: [{ type: 'cherubim_active_gte', value: 1 }],
    onSummonEffects: [
      { type: 'strain_gain', value: 1 },
      { type: 'draw', value: 1 }],
    activatedAbility: {
      name: 'Fatebreak Chime Drive',
      cardsPlayedRequirement: 4,
      description: 'Gain 2 Strain; +220 Oblivion; Vent 1 Strain',
      effects: [
        { type: 'strain_gain', value: 2 },
        { type: 'oblivion_flat', value: 220 },
        { type: 'strain_vent', value: 1 }],
    },
    attacks: {
      primary: {
        id: 'md-angel-ori9-broken-sleep:primary',
        label: 'Primary',
        name: 'ORI-9 Archon Ordinance',
        description: '970 base Oblivion · 5 cards cooldown',
        baseOblivion: 970,
        cooldownCards: 5,
        costs: [],
        tags: ['angel', 'primary', 'mechanical'],
      },
      exalted: {
        id: 'md-angel-ori9-broken-sleep:exalted',
        label: 'Exalted',
        name: 'ORI-9 Archon Throne Decree',
        description: '2230 base Oblivion · 7 cards cooldown',
        baseOblivion: 2230,
        cooldownCards: 7,
        costs: [],
        tags: ['angel', 'exalted', 'mechanical'],
      },
    },
    baseStats: {
      basePower: 0,
      bonusType: 'oblivion_per_seraphim',
      bonusValue: 9,
    },
  },
  {
    definitionId: 'md-angel-thaumiel-prime',
    type: 'Angel',
    element: 'Mechanical',
    rarity: 'Legendary',
    name: 'THAUMIEL Prime Furnace of Unwritten Futures',
    description: 'On summon: Gain 3 Strain; +180 Oblivion. After 5 cards played: If you have 4+ Strain, +320 Oblivion; Vent 9999 Strain. While on board: +17 Oblivion per card played while on board',
    artKey: 'md_angel_thaumiel_prime',
    summonCost: ['md-ser-fate-sever-colossus', 'md-ser-pyrecoil-ascetic', 'md-ser-steel-hymn-executor'],
    extraSummonConditions: [{ type: 'cherubim_active_gte', value: 2 }],
    onSummonEffects: [
      { type: 'strain_gain', value: 3 },
      { type: 'oblivion_flat', value: 180 }],
    activatedAbility: {
      name: 'Dream-Eater Cascade',
      cardsPlayedRequirement: 5,
      description: 'If you have 4+ Strain, +320 Oblivion; Vent 9999 Strain',
      effects: [
        { type: 'conditional', condition: { type: 'strain_gte', value: 4 }, then: [{ type: 'oblivion_flat', value: 320 }] },
        { type: 'strain_vent', value: 9999 }],
    },
    attacks: {
      primary: {
        id: 'md-angel-thaumiel-prime:primary',
        label: 'Primary',
        name: 'THAUMIEL Prime Ordinance',
        description: '1005 base Oblivion · 5 cards cooldown',
        baseOblivion: 1005,
        cooldownCards: 5,
        costs: [],
        tags: ['angel', 'primary', 'mechanical'],
      },
      exalted: {
        id: 'md-angel-thaumiel-prime:exalted',
        label: 'Exalted',
        name: 'THAUMIEL Prime Throne Decree',
        description: '2310 base Oblivion · 7 cards cooldown',
        baseOblivion: 2310,
        cooldownCards: 7,
        costs: [],
        tags: ['angel', 'exalted', 'mechanical'],
      },
    },
    baseStats: {
      basePower: 0,
      bonusType: 'oblivion_per_card',
      bonusValue: 17,
    },
  }];