import { beforeEach, describe, expect, it } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
import { BOSS_FIGHT_ROUND_SECONDS } from '@/data/bosses/bossDefinitions';
import { getMasteryClaimKey } from '@/systems/progression/cardMastery';
import type { SavedGameState } from '@/types/bossFight';

function resetStore(): void {
  const base = JSON.parse(JSON.stringify(defaultGameState)) as typeof defaultGameState;
  useStore.setState(s => ({ ...s, ...base }));
  useStore.getState().refreshComputedStats();
}

function makeSavedSnapshot(): SavedGameState {
  // Capture current store state so enigma instances seeded in beforeEach survive the fight restore.
  const s = useStore.getState();
  return {
    deck: JSON.parse(JSON.stringify(s.deck)) as typeof s.deck,
    board: JSON.parse(JSON.stringify(s.board)) as typeof s.board,
    turn: JSON.parse(JSON.stringify(s.turn)) as typeof s.turn,
    progress: JSON.parse(JSON.stringify(s.progress)) as typeof s.progress,
    settings: JSON.parse(JSON.stringify(s.settings)) as typeof s.settings,
  };
}

/** Sets up an active boss fight against the Eternal Vigil with the given params. */
function startImmortanWardenFight(fightTimeRemaining: number, fightCount = 1): void {
  useStore.setState(s => ({
    ...s,
    deck: {
      ...s.deck,
      hand: [{ instanceId: 'p1', definitionId: 'ser-neutral-null', finish: 'normal' as const }],
      drawPile: [],
    },
    board: { frontSlots: [null, null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] },
    turn: { ...s.turn, phase: 'playing', pendingEffect: null },
    bossFight: {
      mode: 'active',
      activeBossId: 'boss-immortal-warden',
      bossCurrentHp: 1,
      bossMaxHp: 100_000,
      damageDealtThisFight: 0,
      fightTimeRemaining,
      cooldowns: {},
      savedGameState: makeSavedSnapshot(),
      fightCount,
    },
  }));
  useStore.getState().refreshComputedStats();
}

describe('NTV step 0 — timed unlock on boss victory', () => {
  beforeEach(() => {
    resetStore();
  });

  it('creates the enigma instance when Eternal Vigil is defeated with ≥90s remaining', () => {
    startImmortanWardenFight(95);
    useStore.getState().playCard('p1');

    const instance = useStore.getState().progress.enigmas.instances['neutralizing-the-void'];
    expect(instance).toBeDefined();
    expect(instance?.status).toBe('acquired');
    expect(instance?.stepsComplete[0]).toBe(true);
    expect(instance?.currentStepIndex).toBe(1);
  });

  it('does not create the instance when fewer than 90s remain', () => {
    startImmortanWardenFight(89);
    useStore.getState().playCard('p1');

    const instance = useStore.getState().progress.enigmas.instances['neutralizing-the-void'];
    expect(instance).toBeUndefined();
  });

  it('does not re-unlock the instance on a subsequent Eternal Vigil victory', () => {
    startImmortanWardenFight(150);
    useStore.getState().playCard('p1');
    // The instance is now at step 1. Run a second fight with ≥90s.
    resetStore();
    // Seed the existing instance into the fresh store.
    const existingInstance = {
      id: 'neutralizing-the-void',
      status: 'acquired' as const,
      currentStepIndex: 1,
      stepsComplete: [true, false, false, false, false],
      acquiredAt: Date.now(),
      completedAt: undefined,
    };
    useStore.setState(s => ({
      ...s,
      progress: {
        ...s.progress,
        enigmas: {
          activeEnigmaId: 'neutralizing-the-void',
          instances: { 'neutralizing-the-void': existingInstance },
        },
      },
    }));
    startImmortanWardenFight(150);
    useStore.getState().playCard('p1');

    // currentStepIndex should still be 1 (step 0 not re-triggered).
    const after = useStore.getState().progress.enigmas.instances['neutralizing-the-void'];
    expect(after?.currentStepIndex).toBe(1);
  });
});

describe('NTV step 1 — ×3 HP scaled boss defeat', () => {
  beforeEach(() => {
    resetStore();
    // Seed the enigma at step 1.
    useStore.setState(s => ({
      ...s,
      progress: {
        ...s.progress,
        enigmas: {
          activeEnigmaId: 'neutralizing-the-void',
          instances: {
            'neutralizing-the-void': {
              id: 'neutralizing-the-void',
              status: 'acquired',
              currentStepIndex: 1,
              stepsComplete: [true, false, false, false, false],
              acquiredAt: Date.now(),
              completedAt: undefined,
            },
          },
        },
      },
    }));
  });

  it('marks step 1 complete on a ×3-scaled fight win', () => {
    startImmortanWardenFight(BOSS_FIGHT_ROUND_SECONDS, 3);
    useStore.getState().playCard('p1');

    const instance = useStore.getState().progress.enigmas.instances['neutralizing-the-void'];
    expect(instance?.stepsComplete[1]).toBe(true);
    expect(instance?.currentStepIndex).toBeGreaterThanOrEqual(2);
  });

  it('does not mark step 1 complete on a ×1-scaled win', () => {
    startImmortanWardenFight(BOSS_FIGHT_ROUND_SECONDS, 1);
    useStore.getState().playCard('p1');

    const instance = useStore.getState().progress.enigmas.instances['neutralizing-the-void'];
    expect(instance?.stepsComplete[1]).toBeFalsy();
  });
});

describe('NTV step 2 — shard sacrifice', () => {
  beforeEach(() => {
    resetStore();
    useStore.setState(s => ({
      ...s,
      progress: {
        ...s.progress,
        aberratedShards: 5_000,
        enigmas: {
          activeEnigmaId: 'neutralizing-the-void',
          instances: {
            'neutralizing-the-void': {
              id: 'neutralizing-the-void',
              status: 'acquired',
              currentStepIndex: 2,
              stepsComplete: [true, true, false, false, false],
              acquiredAt: Date.now(),
              completedAt: undefined,
            },
          },
        },
      },
    }));
  });

  it('deducts 2500 shards and marks step 2 complete', () => {
    const result = useStore.getState().sacrificeShardsForEnigma('neutralizing-the-void', 2_500);
    expect(result).toBe(true);
    expect(useStore.getState().progress.aberratedShards).toBe(2_500);
    const instance = useStore.getState().progress.enigmas.instances['neutralizing-the-void'];
    expect(instance?.stepsComplete[2]).toBe(true);
    expect(instance?.currentStepIndex).toBeGreaterThanOrEqual(3);
  });

  it('returns false when the player does not have enough shards', () => {
    useStore.setState(s => ({ ...s, progress: { ...s.progress, aberratedShards: 100 } }));
    const result = useStore.getState().sacrificeShardsForEnigma('neutralizing-the-void', 2_500);
    expect(result).toBe(false);
    const instance = useStore.getState().progress.enigmas.instances['neutralizing-the-void'];
    expect(instance?.stepsComplete[2]).toBeFalsy();
  });
});

describe('NTV step 3 — mastery tier retro-check', () => {
  function seedWithStep2Done(): void {
    useStore.setState(s => ({
      ...s,
      progress: {
        ...s.progress,
        aberratedShards: 3_000,
        enigmas: {
          activeEnigmaId: 'neutralizing-the-void',
          instances: {
            'neutralizing-the-void': {
              id: 'neutralizing-the-void',
              status: 'acquired',
              currentStepIndex: 3,
              stepsComplete: [true, true, true, false, false],
              acquiredAt: Date.now(),
              completedAt: undefined,
            },
          },
        },
      },
    }));
  }

  beforeEach(() => {
    resetStore();
    seedWithStep2Done();
  });

  it('marks step 3 when claimCardMastery unlocks tier 4', () => {
    useStore.setState(s => ({
      ...s,
      progress: {
        ...s.progress,
        cardPlayCounts: { 'ser-neutral-null': 1_500 },
        cardMasteryClaims: {},
      },
    }));
    useStore.getState().claimCardMastery('ser-neutral-null', 4);

    const instance = useStore.getState().progress.enigmas.instances['neutralizing-the-void'];
    expect(instance?.stepsComplete[3]).toBe(true);
  });

  it('retro-marks step 3 immediately when shard sacrifice finds existing tier 4 mastery', () => {
    // Pre-seed a tier-4 claim so the retro check inside sacrificeShardsForEnigma fires.
    useStore.setState(s => ({
      ...s,
      progress: {
        ...s.progress,
        aberratedShards: 3_000,
        cardMasteryClaims: { [getMasteryClaimKey('ser-neutral-null', 4)]: true },
        enigmas: {
          activeEnigmaId: 'neutralizing-the-void',
          instances: {
            'neutralizing-the-void': {
              id: 'neutralizing-the-void',
              status: 'acquired',
              currentStepIndex: 2,
              stepsComplete: [true, true, false, false, false],
              acquiredAt: Date.now(),
              completedAt: undefined,
            },
          },
        },
      },
    }));

    useStore.getState().sacrificeShardsForEnigma('neutralizing-the-void', 2_500);

    const instance = useStore.getState().progress.enigmas.instances['neutralizing-the-void'];
    expect(instance?.stepsComplete[2]).toBe(true);
    expect(instance?.stepsComplete[3]).toBe(true);
  });
});

describe('NTV claim reward', () => {
  function seedAllStepsDone(): void {
    useStore.setState(s => ({
      ...s,
      progress: {
        ...s.progress,
        collection: { ...s.progress.collection },
        enigmas: {
          activeEnigmaId: 'neutralizing-the-void',
          instances: {
            'neutralizing-the-void': {
              id: 'neutralizing-the-void',
              status: 'acquired',
              currentStepIndex: 4,
              stepsComplete: [true, true, true, true, false],
              acquiredAt: Date.now(),
              completedAt: undefined,
            },
          },
        },
      },
    }));
  }

  beforeEach(() => {
    resetStore();
  });

  it('awards 3 copies of enig-equilibriums-bane and marks the enigma completed', () => {
    seedAllStepsDone();
    const result = useStore.getState().claimEnigmaReward('neutralizing-the-void');
    expect(result).toBe(true);
    expect(useStore.getState().progress.collection['enig-equilibriums-bane']).toBe(3);
    const instance = useStore.getState().progress.enigmas.instances['neutralizing-the-void'];
    expect(instance?.status).toBe('completed');
  });

  it('returns false when step 3 is not yet complete', () => {
    useStore.setState(s => ({
      ...s,
      progress: {
        ...s.progress,
        enigmas: {
          activeEnigmaId: 'neutralizing-the-void',
          instances: {
            'neutralizing-the-void': {
              id: 'neutralizing-the-void',
              status: 'acquired',
              currentStepIndex: 3,
              stepsComplete: [true, true, true, false, false],
              acquiredAt: Date.now(),
              completedAt: undefined,
            },
          },
        },
      },
    }));
    const result = useStore.getState().claimEnigmaReward('neutralizing-the-void');
    expect(result).toBe(false);
  });

  it('returns false when the enigma is already completed', () => {
    seedAllStepsDone();
    useStore.getState().claimEnigmaReward('neutralizing-the-void');
    const secondClaim = useStore.getState().claimEnigmaReward('neutralizing-the-void');
    expect(secondClaim).toBe(false);
  });
});
