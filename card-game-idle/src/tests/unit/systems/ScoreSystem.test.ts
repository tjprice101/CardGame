import { describe, expect, it } from 'vitest';
import { ScoreSystem } from '@/systems/scoring/ScoreSystem';
import { SynergySystem } from '@/systems/cards/SynergySystem';
import type { BoardState } from '@/types/game';
import type { AngelInstance, CardDefinition, CherubimInstance, SeraphimInstance } from '@/types/cards';

const defs: CardDefinition[] = [
  {
    definitionId: 'angel-light-card-bonus',
    type: 'Angel',
    element: 'Light',
    rarity: 'Common',
    name: 'Card Bonus Angel',
    description: '',
    artKey: 'angel_light_card_bonus',
    summonCost: [],
    onSummonEffects: [],
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 11 },
  },
  {
    definitionId: 'angel-light-seraph-bonus',
    type: 'Angel',
    element: 'Light',
    rarity: 'Common',
    name: 'Seraph Bonus Angel',
    description: '',
    artKey: 'angel_light_seraph_bonus',
    summonCost: [],
    onSummonEffects: [],
    baseStats: { basePower: 0, bonusType: 'oblivion_per_seraphim', bonusValue: 7 },
  },
  {
    definitionId: 'ser-light-oblivion',
    type: 'Seraphim',
    element: 'Light',
    rarity: 'Rare',
    name: 'Light Oblivion Seraph',
    description: '',
    artKey: 'ser_light_oblivion',
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 8, synergyRequirement: 'Light' },
    onPlayEffects: [],
  },
  {
    definitionId: 'ser-light-ophanim',
    type: 'Seraphim',
    element: 'Light',
    rarity: 'Rare',
    name: 'Light Ophanim Seraph',
    description: '',
    artKey: 'ser_light_ophanim',
    baseStats: { bonusType: 'ophanim_bonus', bonusValue: 15, synergyRequirement: 'Light' },
    onPlayEffects: [],
  },
  {
    definitionId: 'ser-light-cherubim',
    type: 'Seraphim',
    element: 'Light',
    rarity: 'Rare',
    name: 'Light Cherubim Seraph',
    description: '',
    artKey: 'ser_light_cherubim',
    baseStats: { bonusType: 'cherubim_extra_plays', bonusValue: 2, synergyRequirement: 'Light' },
    onPlayEffects: [],
  },
  {
    definitionId: 'ser-fire-ember',
    type: 'Seraphim',
    element: 'Fire',
    rarity: 'Rare',
    name: 'Fire Ember Seraph',
    description: '',
    artKey: 'ser_fire_ember',
    baseStats: { bonusType: 'pyro_heat_per_card', bonusValue: 3, synergyRequirement: 'Fire' },
    onPlayEffects: [],
  },
];

const defMap = new Map(defs.map(def => [def.definitionId, def]));
ScoreSystem.getDefinition = (id: string) => defMap.get(id);

function makeBoard(overrides: Partial<BoardState> = {}): BoardState {
  return {
    frontSlots: [null, null, null, null, null],
    backSlots: [null, null, null, null],
    activeBoardEffects: [],
    ...overrides,
  };
}

function makeAngel(
  definitionId: string,
  slot: 0 | 1 | 2 | 3 | 4,
  element: 'Light' | 'Fire' = 'Light',
): AngelInstance {
  return {
    instanceId: `angel_${slot}_${definitionId}`,
    definitionId,
    type: 'Angel',
    element,
    rarity: 'Common',
    finish: 'normal',
    level: 1,
    boardSlot: slot,
    cardsPlayedSinceSummon: 0,
    activated: false,
  };
}

function makeSeraphim(
  definitionId: string,
  slot: 0 | 1 | 2 | 3 | 4,
  element: 'Light' | 'Fire' | 'Dark',
  isActive: boolean,
): SeraphimInstance {
  return {
    instanceId: `ser_${slot}_${definitionId}`,
    definitionId,
    type: 'Seraphim',
    element,
    rarity: 'Rare',
    finish: 'normal',
    level: 1,
    isActive,
    boardSlot: slot,
  };
}

function makeCherubim(slot: 0 | 1 | 2 | 3): CherubimInstance {
  return {
    instanceId: `cher_${slot}`,
    definitionId: 'cherubim-test',
    type: 'Cherubim',
    element: 'Light',
    rarity: 'Common',
    finish: 'normal',
    level: 1,
    boardSlot: slot,
    durability: 2,
  };
}

describe('ScoreSystem', () => {
  it('returns zeroed stats for an empty board', () => {
    expect(ScoreSystem.compute(makeBoard())).toEqual({
      activeSynergies: 0,
      oblivionPerCardBonus: 0,
      ophanimOblivionBonus: 0,
      cherubimExtraPlays: 0,
      globalOblivionMult: 0,
      fullBoardActive: false,
    });
  });

  it('adds active seraphim per-card oblivion bonuses', () => {
    const board = makeBoard({
      frontSlots: [
        makeAngel('angel-light-card-bonus', 0),
        makeSeraphim('ser-light-oblivion', 1, 'Light', true),
        null,
        null,
        null,
      ],
    });

    const stats = ScoreSystem.compute(board);
    expect(stats.activeSynergies).toBe(1);
    expect(stats.oblivionPerCardBonus).toBe(19);
  });

  it('adds ophanim bonus and cherubim extra plays from active seraphim', () => {
    const board = makeBoard({
      frontSlots: [
        makeAngel('angel-light-card-bonus', 0),
        makeSeraphim('ser-light-ophanim', 1, 'Light', true),
        makeSeraphim('ser-light-cherubim', 2, 'Light', true),
        null,
        null,
      ],
      backSlots: [makeCherubim(0), null, null, null],
    });

    const stats = ScoreSystem.compute(board);
    expect(stats.ophanimOblivionBonus).toBe(15);
    expect(stats.cherubimExtraPlays).toBe(2);
  });

  it('scales angel per-seraphim bonuses by active synergy count', () => {
    const board = makeBoard({
      frontSlots: [
        makeAngel('angel-light-seraph-bonus', 0),
        makeSeraphim('ser-light-oblivion', 1, 'Light', true),
        makeSeraphim('ser-light-ophanim', 2, 'Light', true),
        null,
        null,
      ],
    });

    const stats = ScoreSystem.compute(board);
    expect(stats.activeSynergies).toBe(2);
    expect(stats.oblivionPerCardBonus).toBe(14 + 8);
  });
});

describe('SynergySystem', () => {
  it('marks seraphims inactive when no angel is present', () => {
    const board = makeBoard({
      frontSlots: [makeSeraphim('ser-light-oblivion', 0, 'Light', true), null, null, null, null],
    });

    const result = SynergySystem.computeActiveSlots(board);
    const seraphim = result[0];
    expect(seraphim?.type === 'Seraphim' ? seraphim.isActive : true).toBe(false);
  });

  it('marks seraphims active only when an angel of the matching element exists', () => {
    const matchBoard = makeBoard({
      frontSlots: [
        makeAngel('angel-light-card-bonus', 0),
        makeSeraphim('ser-light-oblivion', 1, 'Light', false),
        null,
        null,
        null,
      ],
    });
    const mismatchBoard = makeBoard({
      frontSlots: [
        makeAngel('angel-light-card-bonus', 0),
        makeSeraphim('ser-dark-test', 1, 'Dark', false),
        null,
        null,
        null,
      ],
    });

    const matched = SynergySystem.computeActiveSlots(matchBoard);
    const mismatched = SynergySystem.computeActiveSlots(mismatchBoard);

    expect(matched[1]?.type === 'Seraphim' ? matched[1].isActive : false).toBe(true);
    expect(mismatched[1]?.type === 'Seraphim' ? mismatched[1].isActive : true).toBe(false);
  });

  it('counts active synergies from current front slots', () => {
    const board = makeBoard({
      frontSlots: [
        makeAngel('angel-light-card-bonus', 0),
        makeSeraphim('ser-light-oblivion', 1, 'Light', true),
        makeSeraphim('ser-light-ophanim', 2, 'Light', true),
        makeSeraphim('ser-dark-test', 3, 'Dark', false),
        null,
      ],
    });

    expect(SynergySystem.countActiveSynergies(board)).toBe(2);
  });
});
