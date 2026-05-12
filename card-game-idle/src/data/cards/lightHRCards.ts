import type { SeekerDefinition } from '@/types/cards';

export const lightHRCards: SeekerDefinition[] = [
  // ── Oblivion cards ───────────────────────────────────────────────────────────

  {
    definitionId: 'hr-light-divine-smite',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Common',
    name: 'Divine Smite',
    description: '+30 Oblivion. Gain 1 Radiance.',
    artKey: 'hr_light_divine_smite',
    effects: [
      { type: 'oblivion_flat', value: 30 },
      { type: 'radiance_gain', value: 1 },
    ],
  },
  {
    definitionId: 'hr-light-holy-radiance',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Common',
    name: 'Holy Radiance',
    description: '+25% Seraphim bonuses. Gain 1 Radiance. If you have 5+ Radiance: +40% Seraphim bonuses instead.',
    artKey: 'hr_light_holy_radiance',
    effects: [
      { type: 'seraphim_bonus_amplifier', value: 25 },
      { type: 'radiance_gain', value: 1 },
      {
        type: 'conditional',
        condition: { type: 'radiance_gte', value: 5 },
        then: [{ type: 'seraphim_bonus_amplifier', value: 15 }],
      },
    ],
  },
  {
    definitionId: 'hr-light-sacred-fury',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Rare',
    name: 'Sacred Fury',
    description: 'Spend 3 Radiance: +50% Seraphim bonuses.',
    artKey: 'hr_light_sacred_fury',
    effects: [
      { type: 'radiance_spend', value: 3 },
      { type: 'seraphim_bonus_amplifier', value: 50 },
    ],
  },
  {
    definitionId: 'hr-light-luminous-strike',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Common',
    name: 'Luminous Strike',
    description: '+40 Oblivion. If any Seraphim is in synergy: +40 more Oblivion.',
    artKey: 'hr_light_luminous_strike',
    effects: [
      { type: 'oblivion_flat', value: 40 },
      {
        type: 'conditional',
        condition: { type: 'seraphim_active_gte', value: 1 },
        then: [{ type: 'oblivion_flat', value: 40 }],
      },
    ],
  },
  {
    definitionId: 'hr-light-radiant-surge',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Rare',
    name: 'Radiant Surge',
    description: '+15 Oblivion per Radiance (max 150 Oblivion).',
    artKey: 'hr_light_radiant_surge',
    effects: [
      { type: 'oblivion_flat', value: 0 },  // dynamic sentinel: min(radiance * 15, 150)
    ],
  },
  {
    definitionId: 'hr-light-sunforged',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Epic',
    name: 'Sunforged',
    description: 'Spend all your Radiance: +50 Oblivion per Radiance spent.',
    artKey: 'hr_light_sunforged',
    effects: [
      { type: 'radiance_spend', value: 9999 },
      { type: 'oblivion_flat', value: 0 },  // dynamic sentinel: radianceDrained * 50
    ],
  },
  {
    definitionId: 'hr-light-angelic-wrath',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Rare',
    name: 'Angelic Wrath',
    description: '+60 Oblivion. Gain 2 Radiance.',
    artKey: 'hr_light_angelic_wrath',
    effects: [
      { type: 'oblivion_flat', value: 60 },
      { type: 'radiance_gain', value: 2 },
    ],
  },
  {
    definitionId: 'hr-light-exalted-mantle',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Epic',
    name: 'Exalted Mantle',
    description: 'The next card you play this turn has doubled effects.',
    artKey: 'hr_light_exalted_mantle',
    effects: [
      { type: 'multiply_next' },
    ],
  },
  {
    definitionId: 'hr-light-aureate-blessing',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Common',
    name: 'Aureate Blessing',
    description: '+45 Oblivion. If you have played 3+ cards this turn: gain 3 Radiance.',
    artKey: 'hr_light_aureate_blessing',
    effects: [
      { type: 'oblivion_flat', value: 45 },
      {
        type: 'conditional',
        condition: { type: 'cards_played_gte', value: 3 },
        then: [{ type: 'radiance_gain', value: 3 }],
      },
    ],
  },
  {
    definitionId: 'hr-light-gilded-mandate',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Rare',
    name: 'Gilded Mandate',
    description: '+40% Seraphim bonuses. If you have 8+ Radiance: draw 2 cards.',
    artKey: 'hr_light_gilded_mandate',
    effects: [
      { type: 'seraphim_bonus_amplifier', value: 40 },
      {
        type: 'conditional',
        condition: { type: 'radiance_gte', value: 8 },
        then: [{ type: 'draw', value: 2 }],
      },
    ],
  },

  // ── Oblivion multiplier cards ────────────────────────────────────────────────

  {
    definitionId: 'hr-light-celestial-grace',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Rare',
    name: 'Celestial Grace',
    description: 'Oblivion earned this turn is doubled. Gain 1 Radiance.',
    artKey: 'hr_light_celestial_grace',
    effects: [
      { type: 'score_multiplier', value: 100 },
      { type: 'radiance_gain', value: 1 },
    ],
  },
  {
    definitionId: 'hr-light-heavenly-tithe',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Common',
    name: 'Heavenly Tithe',
    description: '+100 Oblivion. Gain 1 Radiance.',
    artKey: 'hr_light_heavenly_tithe',
    effects: [
      { type: 'oblivion_flat', value: 100 },
      { type: 'radiance_gain', value: 1 },
    ],
  },
  {
    definitionId: 'hr-light-sanctified-offering',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Epic',
    name: 'Sanctified Offering',
    description: 'Spend 3 Radiance: Oblivion earned this turn is tripled.',
    artKey: 'hr_light_sanctified_offering',
    effects: [
      { type: 'radiance_spend', value: 3 },
      { type: 'score_multiplier', value: 200 },
    ],
  },
  {
    definitionId: 'hr-light-celestial-dividend',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Legendary',
    name: 'Celestial Dividend',
    description: 'Spend all your Radiance: +40 Oblivion per Radiance spent.',
    artKey: 'hr_light_celestial_dividend',
    effects: [
      { type: 'radiance_spend', value: 9999 },
      { type: 'oblivion_flat', value: 0 },  // dynamic sentinel: radianceDrained * 40
    ],
  },
  {
    definitionId: 'hr-light-pillar-of-heaven',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Legendary',
    name: 'Pillar of Heaven',
    description: 'Spend 6 Radiance: Oblivion earned this turn is ×10.',
    artKey: 'hr_light_pillar_of_heaven',
    effects: [
      { type: 'radiance_spend', value: 6 },
      { type: 'score_multiplier', value: 900 },
    ],
  },

  // ── Seraphim / utility cards ─────────────────────────────────────────────────

  {
    definitionId: 'hr-light-hastened-judgment',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Rare',
    name: 'Hastened Judgment',
    description: 'Gain 1 Radiance.',
    artKey: 'hr_light_hastened_judgment',
    effects: [
      { type: 'radiance_gain', value: 1 },
    ],
  },
  {
    definitionId: 'hr-light-seraphic-bond',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Epic',
    name: 'Seraphic Bond',
    description: '+30% Seraphim bonuses. Gain 2 Radiance per active Seraphim.',
    artKey: 'hr_light_seraphic_bond',
    effects: [
      { type: 'seraphim_bonus_amplifier', value: 30 },
      { type: 'radiance_gain', value: 0 },  // executor: activeSynergies * 2 (hr-light-seraphic-bond)
    ],
  },
  {
    definitionId: 'hr-light-undying-vigil',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Rare',
    name: 'Undying Vigil',
    description: 'Gain 2 Radiance.',
    artKey: 'hr_light_undying_vigil',
    effects: [
      { type: 'radiance_gain', value: 2 },
    ],
  },

  // ── Utility — Draw/Cycle ────────────────────────────────────────────────────

  {
    definitionId: 'hr-light-celestial-scroll',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Common',
    name: 'Celestial Scroll',
    description: 'Draw 2 cards.',
    artKey: 'hr_light_celestial_scroll',
    effects: [
      { type: 'draw', value: 2 },
    ],
  },
  {
    definitionId: 'hr-light-angelic-vision',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Common',
    name: 'Angelic Vision',
    description: 'Draw 3 cards. Then discard 1 card (your choice).',
    artKey: 'hr_light_angelic_vision',
    effects: [
      { type: 'draw', value: 3 },
      { type: 'discard_choice', value: 1 },
    ],
  },
  {
    definitionId: 'hr-light-holy-insight',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Rare',
    name: 'Holy Insight',
    description: 'Look at the top 5 cards. Take 2 into your hand; return the rest to the bottom.',
    artKey: 'hr_light_holy_insight',
    effects: [
      { type: 'look_top_take', look: 5, take: 2 },
    ],
  },
  {
    definitionId: 'hr-light-sacred-memory',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Common',
    name: 'Sacred Memory',
    description: 'Shuffle your discard pile into the deck. Draw 1 card.',
    artKey: 'hr_light_sacred_memory',
    effects: [
      { type: 'shuffle_discard' },
      { type: 'draw', value: 1 },
    ],
  },
  {
    definitionId: 'hr-light-radiant-echo',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Rare',
    name: 'Radiant Echo',
    description: 'Replay the last Seeker card you played this turn. Gain 1 Radiance.',
    artKey: 'hr_light_radiant_echo',
    effects: [
      { type: 'copy_last_hr' },
      { type: 'radiance_gain', value: 1 },
    ],
  },
  {
    definitionId: 'hr-light-luminous-cycle',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Common',
    name: 'Luminous Cycle',
    description: 'Discard up to 3 cards (your choice). Draw that many +1.',
    artKey: 'hr_light_luminous_cycle',
    effects: [
      { type: 'discard_choice', value: 3 },
    ],
  },
  {
    definitionId: 'hr-light-divine-clarity',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Rare',
    name: 'Divine Clarity',
    description: 'Draw 4 cards. Gain 1 Radiance per card drawn.',
    artKey: 'hr_light_divine_clarity',
    effects: [
      { type: 'draw', value: 4 },
    ],
  },
  {
    definitionId: 'hr-light-mornings-grace',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Common',
    name: "Morning's Grace",
    description: 'If this is the first card you play this turn: draw 2 cards and gain 2 Radiance. Otherwise: draw 1.',
    artKey: 'hr_light_mornings_grace',
    effects: [
      {
        type: 'conditional',
        condition: { type: 'first_card_this_turn' },
        then: [
          { type: 'draw', value: 2 },
          { type: 'radiance_gain', value: 2 },
        ],
      },
      {
        type: 'conditional',
        condition: { type: 'cards_played_gte', value: 1 },
        then: [{ type: 'draw', value: 1 }],
      },
    ],
  },
  {
    definitionId: 'hr-light-gleaming-passage',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Common',
    name: 'Gleaming Passage',
    description: 'Discard 2 cards (your choice). Draw 3 cards.',
    artKey: 'hr_light_gleaming_passage',
    effects: [
      { type: 'discard_draw', discard: 2, draw: 3 },
    ],
  },

  // ── Utility — Radiance Manipulation ─────────────────────────────────────────

  {
    definitionId: 'hr-light-aureate-chain',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Rare',
    name: 'Aureate Chain',
    description: 'Gain Radiance equal to the number of Seeker cards currently in your hand.',
    artKey: 'hr_light_aureate_chain',
    effects: [
      { type: 'radiance_gain', value: 0 },  // executor: counts Seeker cards in hand (hr-light-aureate-chain)
    ],
  },
  {
    definitionId: 'hr-light-transcendent-surge',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Epic',
    name: 'Transcendent Surge',
    description: 'Gain Radiance equal to the number of cards you have played this turn. Draw 1 card.',
    artKey: 'hr_light_transcendent_surge',
    effects: [
      { type: 'radiance_gain', value: 0 },  // executor: cardsPlayedThisTurn (hr-light-transcendent-surge)
      { type: 'draw', value: 1 },
    ],
  },
  {
    definitionId: 'hr-light-sacred-covenant',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Epic',
    name: 'Sacred Covenant',
    description: 'Until end of turn: every Seeker card you play grants +1 Radiance.',
    artKey: 'hr_light_sacred_covenant',
    effects: [
      { type: 'sacred_covenant' },
    ],
  },
  {
    definitionId: 'hr-light-grand-illumination',
    type: 'Seeker',
    element: 'Light',
    rarity: 'Legendary',
    name: 'The Grand Illumination',
    description: 'Double your current Radiance. Then gain +20 Oblivion per point of Radiance.',
    artKey: 'hr_light_grand_illumination',
    effects: [
      { type: 'radiance_double' },
      { type: 'oblivion_flat', value: 0 },  // dynamic sentinel: mutableTurn.radiance * 20 (after doubling)
    ],
  },
];
