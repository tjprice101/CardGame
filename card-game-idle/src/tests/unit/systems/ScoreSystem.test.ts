import { describe, it, expect } from 'vitest';
import { ScoreSystem } from '@/systems/scoring/ScoreSystem';
import { SynergySystem } from '@/systems/cards/SynergySystem';
import type { BoardState } from '@/types/game';
import type { AngelInstance, SeraphimInstance, CardDefinition } from '@/types/cards';

// Minimal card definitions for testing
const defs: CardDefinition[] = [
  {
    definitionId: 'angel-light-1',
    type: 'Angel',
    element: 'Light',
    rarity: 'Common',
    name: 'Seraphiel Embermane',
    description: '',
    artKey: 'angel_light_1',
    summonCost: [],
    onSummonEffects: [],
    baseStats: { basePower: 10, bonusType: 'power_amplifier', bonusValue: 0 },
  },
  {
    definitionId: 'ser-light-power',
    type: 'Seraphim',
    element: 'Light',
    rarity: 'Rare',
    name: 'Dawnfire Seraphim',
    description: '',
    artKey: 'ser_light_power',
    baseStats: { bonusType: 'power_amplifier', bonusValue: 20, synergyRequirement: 'Light' },
    onPlayEffects: [],
  },
  {
    definitionId: 'ser-dark-power',
    type: 'Seraphim',
    element: 'Dark',
    rarity: 'Rare',
    name: 'Dusk Seraphim',
    description: '',
    artKey: 'ser_dark_power',
    baseStats: { bonusType: 'power_amplifier', bonusValue: 30, synergyRequirement: 'Dark' },
    onPlayEffects: [],
  },
];

const defMap = new Map(defs.map(d => [d.definitionId, d]));
ScoreSystem.getDefinition = (id: string) => defMap.get(id);

function makeAngel(): AngelInstance {
  return { instanceId: 'a1', definitionId: 'angel-light-1', type: 'Angel', element: 'Light', rarity: 'Common', level: 1, boardSlot: 0 };
}

function makeSeraphim(defId: string, slot: 0 | 1 | 2 | 3 | 4, element: 'Light' | 'Dark', active: boolean): SeraphimInstance {
  return { instanceId: `ser${slot}`, definitionId: defId, type: 'Seraphim', element, rarity: 'Rare', level: 1, isActive: active, boardSlot: slot };
}

const emptyBoard: BoardState = {
  slots: [null, null, null, null, null],
  activeBoardEffects: [],
};

describe('ScoreSystem', () => {
  it('returns zero stats when no angel is placed', () => {
    const stats = ScoreSystem.compute(emptyBoard);
    expect(stats.scorePerTick).toBe(0);
    expect(stats.effectivePower).toBe(0);
    expect(stats.tickIntervalMs).toBe(1000);
  });

  it('computes base power from angel definition', () => {
    const board: BoardState = { ...emptyBoard, slots: [makeAngel(), null, null, null, null] };
    const stats = ScoreSystem.compute(board);
    expect(stats.effectivePower).toBe(10);
    expect(stats.scorePerTick).toBe(10);
  });

  it('applies flat power bonus additively from activeBoardEffects', () => {
    const board: BoardState = {
      slots: [makeAngel(), null, null, null, null],
      activeBoardEffects: [{ type: 'power_flat', value: 5 }, { type: 'power_flat', value: 5 }],
    };
    const stats = ScoreSystem.compute(board);
    expect(stats.effectivePower).toBe(20); // 10 + 5 + 5
  });

  it('applies percent power bonus after flat', () => {
    const board: BoardState = {
      slots: [makeAngel(), null, null, null, null],
      activeBoardEffects: [{ type: 'power_percent', value: 50 }],
    };
    const stats = ScoreSystem.compute(board);
    expect(stats.effectivePower).toBe(15); // 10 * 1.5
  });

  it('applies score multiplier multiplicatively', () => {
    const board: BoardState = {
      slots: [makeAngel(), null, null, null, null],
      activeBoardEffects: [{ type: 'score_multiplier', value: 100 }],
    };
    const stats = ScoreSystem.compute(board);
    expect(stats.scorePerTick).toBeCloseTo(20); // 10 * (1 + 100/100)
  });

  it('counts active synergies from matching seraphims', () => {
    const board: BoardState = {
      slots: [makeAngel(), makeSeraphim('ser-light-power', 1, 'Light', true), null, null, null],
      activeBoardEffects: [],
    };
    const stats = ScoreSystem.compute(board);
    expect(stats.activeSynergies).toBe(1);
  });

  it('does not count non-matching seraphim as synergy', () => {
    const board: BoardState = {
      slots: [makeAngel(), makeSeraphim('ser-dark-power', 1, 'Dark', false), null, null, null],
      activeBoardEffects: [],
    };
    const stats = ScoreSystem.compute(board);
    expect(stats.activeSynergies).toBe(0);
  });

  it('applies seraphim power_amplifier only when active', () => {
    const boardActive: BoardState = {
      slots: [makeAngel(), makeSeraphim('ser-light-power', 1, 'Light', true), null, null, null],
      activeBoardEffects: [],
    };
    const boardInactive: BoardState = {
      slots: [makeAngel(), makeSeraphim('ser-dark-power', 1, 'Dark', false), null, null, null],
      activeBoardEffects: [],
    };
    const activeStats = ScoreSystem.compute(boardActive);
    const inactiveStats = ScoreSystem.compute(boardInactive);
    expect(activeStats.effectivePower).toBeGreaterThan(inactiveStats.effectivePower);
    expect(activeStats.effectivePower).toBeCloseTo(12); // 10 * 1.2
  });
});

describe('SynergySystem', () => {
  it('marks seraphims inactive when no angel', () => {
    const board: BoardState = {
      slots: [makeSeraphim('ser-light-power', 0, 'Light', true), null, null, null, null],
      activeBoardEffects: [],
    };
    const result = SynergySystem.computeActiveSlots(board);
    const ser = result[0];
    expect(ser?.type === 'Seraphim' ? ser.isActive : true).toBe(false);
  });

  it('marks seraphim active when element matches angel', () => {
    const board: BoardState = {
      slots: [makeAngel(), makeSeraphim('ser-light-power', 1, 'Light', false), null, null, null],
      activeBoardEffects: [],
    };
    const result = SynergySystem.computeActiveSlots(board);
    const ser = result[1];
    expect(ser?.type === 'Seraphim' ? ser.isActive : false).toBe(true);
  });

  it('marks seraphim inactive when element does not match angel', () => {
    const board: BoardState = {
      slots: [makeAngel(), makeSeraphim('ser-dark-power', 1, 'Dark', false), null, null, null],
      activeBoardEffects: [],
    };
    const result = SynergySystem.computeActiveSlots(board);
    const ser = result[1];
    expect(ser?.type === 'Seraphim' ? ser.isActive : true).toBe(false);
  });

  it('counts active synergies correctly', () => {
    const board: BoardState = {
      slots: [
        makeAngel(),
        makeSeraphim('ser-light-power', 1, 'Light', true),
        makeSeraphim('ser-light-power', 2, 'Light', true),
        makeSeraphim('ser-dark-power', 3, 'Dark', false),
        null,
      ],
      activeBoardEffects: [],
    };
    expect(SynergySystem.countActiveSynergies(board)).toBe(2);
  });
});
