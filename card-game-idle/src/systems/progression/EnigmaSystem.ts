import type { EnigmaInstance, GameState, ProgressState } from '@/types/game';
import { CardRegistry } from '@/cards/CardRegistry';
import { ENIGMA_DEFINITIONS, getEnigmaDefinition, isNeutralMysteryAcquired } from '@/data/enigmas/enigmaDefinitions';

export interface EnigmaProgressResult {
  newlyAcquired: string[];
  newlyCompleted: string[];
}

export function ensureEnigmaState(progress: ProgressState): void {
  if (!progress.enigmas) {
    progress.enigmas = { activeEnigmaId: null, instances: {} };
  }
}

export function ensureInstance(progress: ProgressState, enigmaId: string): EnigmaInstance | null {
  ensureEnigmaState(progress);
  const definition = getEnigmaDefinition(enigmaId);
  if (!definition) return null;
  const existing = progress.enigmas.instances[enigmaId];
  if (existing) return existing;
  const instance: EnigmaInstance = {
    id: enigmaId,
    status: 'locked' as const,
    currentStepIndex: 0,
    stepsComplete: new Array(definition.steps.length).fill(false),
  };
  progress.enigmas.instances[enigmaId] = instance;
  return instance;
}

export function ensureNeutralMysteryInstance(progress: ProgressState) {
  return ensureInstance(progress, 'neutral-mystery');
}

export function evaluateEnigmaAcquisition(state: Pick<GameState, 'board' | 'progress'>): EnigmaProgressResult {
  ensureEnigmaState(state.progress);
  const result: EnigmaProgressResult = { newlyAcquired: [], newlyCompleted: [] };
  const neutralMystery = ensureNeutralMysteryInstance(state.progress);
  if (!neutralMystery) return result;
  if (neutralMystery.status !== 'locked') return result;
  if (!isNeutralMysteryAcquired(state.board)) return result;

  neutralMystery.status = 'acquired';
  neutralMystery.currentStepIndex = 1;
  neutralMystery.stepsComplete[0] = true;
  result.newlyAcquired.push('neutral-mystery');
  return result;
}

export function evaluateNeutralMysteryProgress(state: Pick<GameState, 'board' | 'progress'>): EnigmaProgressResult {
  ensureEnigmaState(state.progress);
  const result: EnigmaProgressResult = { newlyAcquired: [], newlyCompleted: [] };
  const instance = ensureNeutralMysteryInstance(state.progress);
  if (!instance || instance.status === 'locked') return result;

  const chargedSophCount = state.board.backSlots.filter(slot =>
    !!slot && slot.side === 'soph' && slot.limitlessCharge >= 3
  ).length;
  const activeLightCount = state.board.backSlots.filter(slot =>
    !!slot && slot.type === 'Light' && slot.side === 'ain'
  ).length;
  const activeAinSophAurCount = state.board.frontSlots.filter(slot => slot?.type === 'AinSophAur').length;

  // Step 3 (index 2): three charged Soph cards form the quiet field.
  if (instance.stepsComplete[1] && !instance.stepsComplete[2] && chargedSophCount >= 3) {
    instance.stepsComplete[2] = true;
    instance.currentStepIndex = Math.max(instance.currentStepIndex, 3);
  }

  // Step 4 (index 3): an active Light and Ain Soph Aur must coexist.
  if (instance.stepsComplete[2] && !instance.stepsComplete[3] && activeLightCount >= 1 && activeAinSophAurCount >= 1) {
    instance.stepsComplete[3] = true;
    instance.currentStepIndex = Math.max(instance.currentStepIndex, 4);
  }

  return result;
}

export function getEnigmaRewardCards(enigmaId: string): Array<{ definitionId: string; copies: number }> {
  const definition = getEnigmaDefinition(enigmaId);
  return definition?.rewards ?? [];
}

export function listEnigmaDefinitions() {
  return ENIGMA_DEFINITIONS.slice();
}

export function isNeutralMysteryReadyForReward(progress: ProgressState): boolean {
  const instance = progress.enigmas.instances['neutral-mystery'];
  if (!instance) return false;
  return instance.status === 'completed';
}

export function neutralMysteryBoardIds() {
  return { rewardLight: 'enig-neutral-lumen-genesis', rewardDark: 'enig-neutral-null-catechism' };
}

export function awardEnigmaReward(progress: ProgressState, enigmaId: string): void {
  const rewards = getEnigmaRewardCards(enigmaId);
  for (const reward of rewards) {
    const def = CardRegistry.get(reward.definitionId);
    if (!def) continue;
    progress.collection[reward.definitionId] = (progress.collection[reward.definitionId] ?? 0) + reward.copies;
    progress.everCollection![reward.definitionId] = Math.max(progress.everCollection?.[reward.definitionId] ?? 0, progress.collection[reward.definitionId]);
  }
  const instance = progress.enigmas.instances[enigmaId];
  if (instance) {
    instance.status = 'completed';
    instance.currentStepIndex = Math.max(instance.currentStepIndex, instance.stepsComplete.length);
  }
}
