import type { GameState, ProgressState } from '@/types/game';
import { CardRegistry } from '@/cards/CardRegistry';
import {
  AEGIS_OF_EQUILIBRIUM_ID,
  AEGIS_OF_PRESENCE_ID,
  EQUILIBRIUM_SERAPHIM_ID,
  ENIGMA_DEFINITIONS,
  NULL_SERAPHIM_ID,
  TBATE_ID,
  getEnigmaDefinition,
  isNeutralMysteryAcquired,
} from '@/data/enigmas/enigmaDefinitions';

export interface EnigmaProgressResult {
  newlyAcquired: string[];
  newlyCompleted: string[];
}

export function ensureEnigmaState(progress: ProgressState): void {
  if (!progress.enigmas) {
    progress.enigmas = { activeEnigmaId: null, instances: {} };
  }
}

export function ensureInstance(progress: ProgressState, enigmaId: string) {
  ensureEnigmaState(progress);
  const definition = getEnigmaDefinition(enigmaId);
  if (!definition) return null;
  const existing = progress.enigmas.instances[enigmaId];
  if (existing) return existing;
  const instance = {
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

  const activePresence = state.board.frontSlots.filter(slot => slot?.definitionId === AEGIS_OF_PRESENCE_ID).length;
  const nullSeraphimCount = state.board.frontSlots.filter(slot => slot?.definitionId === NULL_SERAPHIM_ID).length;
  // Only the Seraphim form counts; the Angel (Aegis of Equilibrium) is a different unit.
  const equilibriumCount = state.board.frontSlots.filter(slot =>
    slot?.definitionId === EQUILIBRIUM_SERAPHIM_ID
  ).length;

  // Step 3 (index 2): 3 Aegis of Presence on board at once.
  if (!instance.stepsComplete[2] && activePresence >= 3) {
    instance.stepsComplete[2] = true;
    instance.currentStepIndex = Math.max(instance.currentStepIndex, 3);
  }

  // Step 4 (index 3): board must contain exactly 3 Null Seraphim + 2 Equilibrium Seraphim in any order.
  // Gate is purely on stepsComplete[3] so save-state drift in currentStepIndex cannot block it.
  const strictStep4Match = nullSeraphimCount === 3 && equilibriumCount === 2
    && state.board.frontSlots.every(slot =>
      !!slot && (slot.definitionId === NULL_SERAPHIM_ID || slot.definitionId === EQUILIBRIUM_SERAPHIM_ID)
    );
  if (!instance.stepsComplete[3] && strictStep4Match) {
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
  return {
    tbate: TBATE_ID,
    presence: AEGIS_OF_PRESENCE_ID,
    equilibrium: AEGIS_OF_EQUILIBRIUM_ID,
    nullSeraphim: NULL_SERAPHIM_ID,
  };
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
