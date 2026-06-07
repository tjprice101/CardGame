import type { OphanimDefinition } from '@/types/cards';

export const lightHRCards: OphanimDefinition[] = [
  // Oblivion cards

  {
    definitionId: 'hr-light-divine-smite',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Common',
    name: 'Embersmite',
    description: 'Gain 1 Radiance; +30 Oblivion',
    artKey: 'hr_light_divine_smite',
    effects: [
      { type: 'oblivion_flat', value: 30 },
      { type: 'radiance_gain', value: 1 }],
  },
  {
    definitionId: 'hr-light-holy-radiance',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Common',
    name: 'Hallowed Flame',
    description: 'Gain 1 Radiance; Seraphim bonuses are amplified by +15; If you have 5+ Radiance, Seraphim bonuses are amplified by +10',
    artKey: 'hr_light_holy_radiance',
    effects: [
      { type: 'seraphim_bonus_amplifier', value: 15 },
      { type: 'radiance_gain', value: 1 },
      {
        type: 'conditional',
        condition: { type: 'radiance_gte', value: 5 },
        then: [{ type: 'seraphim_bonus_amplifier', value: 10 }],
      }],
  },
  {
    definitionId: 'hr-light-sacred-fury',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Rare',
    name: 'Thornfire Fury',
    description: 'Spend 3 Radiance; Seraphim bonuses are amplified by +25',
    artKey: 'hr_light_sacred_fury',
    effects: [
      { type: 'radiance_spend', value: 3 },
      { type: 'seraphim_bonus_amplifier', value: 25 }],
  },
  {
    definitionId: 'hr-light-luminous-strike',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Common',
    name: 'Cinderstrike',
    description: 'Gain 1 Radiance; +40 Oblivion; If you control 1+ active Seraphim, +40 Oblivion; Salvage any 1 card',
    artKey: 'hr_light_luminous_strike',
    effects: [
      { type: 'radiance_gain', value: 1 },
      { type: 'oblivion_flat', value: 40 },
      {
        type: 'conditional',
        condition: { type: 'seraphim_active_gte', value: 1 },
        then: [{ type: 'oblivion_flat', value: 40 }],
      },
      { type: 'salvage_any' }],
  },
  {
    definitionId: 'hr-light-radiant-surge',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Rare',
    name: 'Cinder Surge',
    description: '+50 Oblivion; If you have played 4+ cards this turn, +80 Oblivion; Shuffle discard into deck; Draw 1 card',
    artKey: 'hr_light_radiant_surge',
    effects: [
      { type: 'oblivion_flat', value: 50 },
      {
        type: 'conditional',
        condition: { type: 'cards_played_gte', value: 4 },
        then: [{ type: 'oblivion_flat', value: 80 }],
      },
      { type: 'shuffle_discard' },
      { type: 'draw', value: 1 },
    ],
  },
  {
    definitionId: 'hr-light-sunforged',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Epic',
    name: 'Emberforged',
    description: 'Spend 9999 Radiance; +0 Oblivion',
    artKey: 'hr_light_sunforged',
    effects: [
      { type: 'radiance_spend', value: 9999 },
      { type: 'oblivion_flat', value: 0 },  // dynamic sentinel: radianceDrained * 25
    ],
  },
  {
    definitionId: 'hr-light-angelic-wrath',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Rare',
    name: 'Seraphfire Wrath',
    description: 'Gain 2 Radiance; +60 Oblivion',
    artKey: 'hr_light_angelic_wrath',
    effects: [
      { type: 'oblivion_flat', value: 60 },
      { type: 'radiance_gain', value: 2 }],
  },
  {
    definitionId: 'hr-light-exalted-mantle',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Epic',
    name: 'Emberthorn Mantle',
    description: 'Draw 2 cards; Choose and discard 1 card; If you have 5+ Radiance, Draw 1 card',
    artKey: 'hr_light_exalted_mantle',
    effects: [
      { type: 'draw', value: 2 },
      { type: 'discard_choice', value: 1 },
      {
        type: 'conditional',
        condition: { type: 'radiance_gte', value: 5 },
        then: [{ type: 'draw', value: 1 }],
      },
    ],
  },
  {
    definitionId: 'hr-light-aureate-blessing',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Common',
    name: 'Silverthorn Blessing',
    description: '+35 Oblivion; If you have played 3+ cards this turn, Gain 2 Radiance',
    artKey: 'hr_light_aureate_blessing',
    effects: [
      { type: 'oblivion_flat', value: 35 },
      {
        type: 'conditional',
        condition: { type: 'cards_played_gte', value: 3 },
        then: [{ type: 'radiance_gain', value: 2 }],
      }],
  },
  {
    definitionId: 'hr-light-gilded-mandate',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Rare',
    name: 'Thorncrown Mandate',
    description: 'Seraphim bonuses are amplified by +25; If you have 8+ Radiance, Gain 4 Radiance',
    artKey: 'hr_light_gilded_mandate',
    effects: [
      { type: 'seraphim_bonus_amplifier', value: 25 },
      {
        type: 'conditional',
        condition: { type: 'radiance_gte', value: 8 },
        then: [{ type: 'radiance_gain', value: 4 }],
      }],
  },

  // Oblivion multiplier cards

  {
    definitionId: 'hr-light-celestial-grace',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Rare',
    name: 'Emberwing Grace',
    description: 'Gain 1 Radiance; Gain +60% total Oblivion this turn',
    artKey: 'hr_light_celestial_grace',
    effects: [
      { type: 'score_multiplier', value: 60 },
      { type: 'radiance_gain', value: 1 }],
  },
  {
    definitionId: 'hr-light-heavenly-tithe',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Common',
    name: 'Pyre Tithe',
    description: 'Gain 1 Radiance; +100 Oblivion',
    artKey: 'hr_light_heavenly_tithe',
    effects: [
      { type: 'oblivion_flat', value: 100 },
      { type: 'radiance_gain', value: 1 }],
  },
  {
    definitionId: 'hr-light-sanctified-offering',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Epic',
    name: 'Hallowed Pyre',
    description: 'Spend 3 Radiance; Gain +100% total Oblivion this turn',
    artKey: 'hr_light_sanctified_offering',
    effects: [
      { type: 'radiance_spend', value: 3 },
      { type: 'score_multiplier', value: 100 }],
  },
  {
    definitionId: 'hr-light-celestial-dividend',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Legendary',
    name: 'Emberthorn Dividend',
    description: 'Spend 9999 Radiance; +0 Oblivion',
    artKey: 'hr_light_celestial_dividend',
    effects: [
      { type: 'radiance_spend', value: 9999 },
      { type: 'oblivion_flat', value: 0 },  // dynamic sentinel: radianceDrained * 18
    ],
  },
  {
    definitionId: 'hr-light-pillar-of-heaven',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Legendary',
    name: 'Silverthorn Spire',
    description: 'Spend 6 Radiance; Gain +250% total Oblivion this turn',
    artKey: 'hr_light_pillar_of_heaven',
    effects: [
      { type: 'radiance_spend', value: 6 },
      { type: 'score_multiplier', value: 250 }],
  },

  // Seraphim / utility cards

  {
    definitionId: 'hr-light-hastened-judgment',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Rare',
    name: 'Flashfire Judgement',
    description: 'Gain 3 Radiance',
    artKey: 'hr_light_hastened_judgment',
    effects: [
      { type: 'radiance_gain', value: 3 }],
  },
  {
    definitionId: 'hr-light-seraphic-bond',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Epic',
    name: 'Emberthorn Bond',
    description: 'Seraphim bonuses are amplified by +15; Salvage any 1 card',
    artKey: 'hr_light_seraphic_bond',
    effects: [
      { type: 'seraphim_bonus_amplifier', value: 15 },
      { type: 'salvage_any' },
      { type: 'radiance_gain', value: 0 },  // executor: activeSynergies * 1 (hr-light-seraphic-bond)
    ],
  },
  {
    definitionId: 'hr-light-undying-vigil',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Rare',
    name: 'Undying Thornwatch',
    description: 'Gain 3 Radiance; Salvage any 1 card',
    artKey: 'hr_light_undying_vigil',
    effects: [
      { type: 'radiance_gain', value: 3 },
      { type: 'salvage_any' }],
  },

  // Utility - Draw/Cycle

  {
    definitionId: 'hr-light-celestial-scroll',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Common',
    name: 'Cinderscript',
    description: 'Draw 2 cards',
    artKey: 'hr_light_celestial_scroll',
    effects: [
      { type: 'draw', value: 2 }],
  },
  {
    definitionId: 'hr-light-angelic-vision',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Common',
    name: 'Thornhalo Vision',
    description: 'Gain 1 Radiance; Draw 3 cards; Choose and discard 1 card',
    artKey: 'hr_light_angelic_vision',
    effects: [
      { type: 'radiance_gain', value: 1 },
      { type: 'draw', value: 3 },
      { type: 'discard_choice', value: 1 }],
  },
  {
    definitionId: 'hr-light-holy-insight',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Rare',
    name: 'Silverthorn Insight',
    description: 'Look at the top 5 cards, take 2 cards, and put the rest on the bottom',
    artKey: 'hr_light_holy_insight',
    effects: [
      { type: 'look_top_take', look: 5, take: 2 }],
  },
  {
    definitionId: 'hr-light-sacred-memory',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Common',
    name: 'Ashen Remembrance',
    description: 'Gain 4 Radiance; Shuffle discard into deck',
    artKey: 'hr_light_sacred_memory',
    effects: [
      { type: 'shuffle_discard' },
      { type: 'radiance_gain', value: 4 }],
  },
  {
    definitionId: 'hr-light-radiant-echo',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Rare',
    name: 'Cinder Echo',
    description: 'Gain 1 Radiance; Replay last Ophanim played this turn',
    artKey: 'hr_light_radiant_echo',
    effects: [
      { type: 'copy_last_hr' },
      { type: 'radiance_gain', value: 1 }],
  },
  {
    definitionId: 'hr-light-luminous-cycle',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Common',
    name: 'Cinder Cycle',
    description: 'Gain 2 Radiance; Choose and discard 3 cards',
    artKey: 'hr_light_luminous_cycle',
    effects: [
      { type: 'radiance_gain', value: 2 },
      { type: 'discard_choice', value: 3 }],
  },
  {
    definitionId: 'hr-light-divine-clarity',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Rare',
    name: 'Whiteflame Clarity',
    description: 'Gain 4 Radiance; Seraphim bonuses are amplified by +40',
    artKey: 'hr_light_divine_clarity',
    effects: [
      { type: 'seraphim_bonus_amplifier', value: 40 },
      { type: 'radiance_gain', value: 4 }],
  },
  {
    definitionId: 'hr-light-mornings-grace',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Common',
    name: 'Emberdawn Grace',
    description: 'If this is the first card you played this turn, Gain 6 Radiance; If you have played 1+ cards this turn, Gain 3 Radiance',
    artKey: 'hr_light_mornings_grace',
    effects: [
      {
        type: 'conditional',
        condition: { type: 'first_card_this_turn' },
        then: [
          { type: 'radiance_gain', value: 6 }],
      },
      {
        type: 'conditional',
        condition: { type: 'cards_played_gte', value: 1 },
        then: [{ type: 'radiance_gain', value: 3 }],
      }],
  },
  {
    definitionId: 'hr-light-gleaming-passage',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Common',
    name: 'Thorngate Passage',
    description: 'Gain 1 Radiance; Discard 2 cards, then draw 3 cards',
    artKey: 'hr_light_gleaming_passage',
    effects: [
      { type: 'radiance_gain', value: 1 },
      { type: 'discard_draw', discard: 2, draw: 3 }],
  },

  // Utility - Radiance Manipulation

  {
    definitionId: 'hr-light-aureate-chain',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Rare',
    name: 'Silverthorn Chain',
    description: 'none',
    artKey: 'hr_light_aureate_chain',
    effects: [
      { type: 'radiance_gain', value: 0 },  // executor: counts Ophanim cards in hand (hr-light-aureate-chain)
    ],
  },
  {
    definitionId: 'hr-light-transcendent-surge',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Epic',
    name: 'Ascendant Blaze',
    description: 'none',
    artKey: 'hr_light_transcendent_surge',
    effects: [
      { type: 'radiance_gain', value: 0 },  // executor: cardsPlayedThisTurn (hr-light-transcendent-surge)
    ],
  },
  {
    definitionId: 'hr-light-sacred-covenant',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Epic',
    name: 'Thornfire Covenant',
    description: 'Gain 3 Radiance; Seraphim bonuses are amplified by +15',
    artKey: 'hr_light_sacred_covenant',
    effects: [
      { type: 'radiance_gain', value: 3 },
      { type: 'seraphim_bonus_amplifier', value: 15 }],
  },
  {
    definitionId: 'hr-light-grand-illumination',
    type: 'Ophanim',
    element: 'Light',
    rarity: 'Legendary',
    name: 'The Emberthorn Revelation',
    description: 'Gain 2 Radiance; Double current Radiance; +0 Oblivion',
    artKey: 'hr_light_grand_illumination',
    effects: [
      { type: 'radiance_gain', value: 2 },
      { type: 'radiance_double' },
      { type: 'oblivion_flat', value: 0 },  // dynamic sentinel: mutableTurn.radiance * 8 (after doubling)
    ],
  }];