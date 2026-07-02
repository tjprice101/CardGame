import type { AngelDefinition } from '@/types/cards';

export const prismaticAccordAngels: AngelDefinition[] = [
  {
    definitionId: 'pa-angel-aurelith-ninth-beam',
    type: 'Angel',
    element: 'Prismatic',
    rarity: 'Legendary',
    name: 'Aurelith Seer of the Ninth Beam',
    description: 'On summon: Draw 2 cards; Look at the top 4 cards, take 1 card, and put the rest on the bottom; If you have 1+ Prism Charges, Spend 1 Prism Charge; +90 Oblivion. After 4 cards played: Salvage any 1 card; Draw 1 card; If you have 2+ Prism Charges, Spend 2 Prism Charges; +130 Oblivion. While on board: +8 Oblivion for each Seraphim on board while on board',
    artKey: 'pa_angel_aurelith_ninth_beam',
    summonCost: ['pa-ser-stormmemory-veltharion', 'pa-ser-mirrorback-mirshan'],
    extraSummonConditions: [{ type: 'cherubim_active_gte', value: 1 }],
    onSummonEffects: [
      { type: 'draw', value: 2 },
      { type: 'look_top_take', look: 4, take: 1 },
      { type: 'conditional', condition: { type: 'prismatic_node_charges_gte', value: 1 }, then: [{ type: 'prismatic_charge_spend', value: 1 }, { type: 'oblivion_flat', value: 90 }] }],
    activatedAbility: {
      name: 'Frozen Future',
      cardsPlayedRequirement: 4,
      description: 'Salvage any 1 card; Draw 1 card; If you have 2+ Prism Charges, Spend 2 Prism Charges; +130 Oblivion',
      effects: [
        { type: 'salvage_any' },
        { type: 'draw', value: 1 },
        { type: 'conditional', condition: { type: 'prismatic_node_charges_gte', value: 2 }, then: [{ type: 'prismatic_charge_spend', value: 2 }, { type: 'oblivion_flat', value: 130 }] }],
    },
    attacks: {
      primary: {
        id: 'pa-angel-aurelith-ninth-beam:primary',
        label: 'Primary',
        name: 'Aurelith Seer Ordinance',
        description: '965 base Oblivion · 5 cards cooldown',
        baseOblivion: 1177,
        cooldownCards: 5,
        costs: [],
        tags: ['angel', 'primary', 'prismatic'],
      },
      exalted: {
        id: 'pa-angel-aurelith-ninth-beam:exalted',
        label: 'Exalted',
        name: 'Aurelith Seer Throne Decree',
        description: '2220 base Oblivion · 7 cards cooldown',
        baseOblivion: 2708,
        cooldownCards: 7,
        costs: [],
        tags: ['angel', 'exalted', 'prismatic'],
      },
    },
    baseStats: {
      basePower: 0,
      bonusType: 'oblivion_per_seraphim',
      bonusValue: 8,
    },
  },
  {
    definitionId: 'pa-angel-vorthum-whitebeam-arbiter',
    type: 'Angel',
    element: 'Prismatic',
    rarity: 'Legendary',
    name: 'Vorthum Whitebeam Arbiter',
    description: 'On summon: Draw 2 cards; +170 Oblivion; If you have 1+ Prism Charges, Spend 1 Prism Charge; +100 Oblivion. After 5 cards played: Salvage any 1 card; If you have 2+ Prism Charges, Spend 2 Prism Charges; +150 Oblivion. While on board: +16 Oblivion per card played while on board',
    artKey: 'pa_angel_vorthum_whitebeam_arbiter',
    summonCost: ['pa-ser-goldvein-ancestor', 'pa-ser-veilstep-drossken', 'pa-ser-plainshush-drossken'],
    extraSummonConditions: [{ type: 'cherubim_active_gte', value: 2 }],
    onSummonEffects: [
      { type: 'draw', value: 2 },
      { type: 'oblivion_flat', value: 170 },
      { type: 'conditional', condition: { type: 'prismatic_node_charges_gte', value: 1 }, then: [{ type: 'prismatic_charge_spend', value: 1 }, { type: 'oblivion_flat', value: 100 }] }],
    activatedAbility: {
      name: 'Spectrum Without End',
      cardsPlayedRequirement: 5,
      description: 'Salvage any 1 card; If you have 2+ Prism Charges, Spend 2 Prism Charges; +150 Oblivion',
      effects: [
        { type: 'salvage_any' },
        { type: 'conditional', condition: { type: 'prismatic_node_charges_gte', value: 2 }, then: [{ type: 'prismatic_charge_spend', value: 2 }, { type: 'oblivion_flat', value: 150 }] }],
    },
    attacks: {
      primary: {
        id: 'pa-angel-vorthum-whitebeam-arbiter:primary',
        label: 'Primary',
        name: 'Vorthum Whitebeam Ordinance',
        description: '1000 base Oblivion · 5 cards cooldown',
        baseOblivion: 1220,
        cooldownCards: 5,
        costs: [],
        tags: ['angel', 'primary', 'prismatic'],
      },
      exalted: {
        id: 'pa-angel-vorthum-whitebeam-arbiter:exalted',
        label: 'Exalted',
        name: 'Vorthum Whitebeam Throne Decree',
        description: '2300 base Oblivion · 7 cards cooldown',
        baseOblivion: 2806,
        cooldownCards: 7,
        costs: [],
        tags: ['angel', 'exalted', 'prismatic'],
      },
    },
    baseStats: {
      basePower: 0,
      bonusType: 'oblivion_per_card',
      bonusValue: 16,
    },
  }];