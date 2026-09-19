import type { EnigmaInstance, GameState, ProgressState } from '@/types/game';
import { CardRegistry } from '@/cards/CardRegistry';
import { ENIGMA_DEFINITIONS, getEnigmaDefinition, isNeutralMysteryAcquired } from '@/data/enigmas/enigmaDefinitions';
import { getTotalPacksOpened } from '@/systems/progression/ownershipHistory';

export const ENIGMA_PACK_REQUIREMENT = 10;

export function isEnigmaUnlocked(progress: ProgressState): boolean {
  return getTotalPacksOpened(progress) >= ENIGMA_PACK_REQUIREMENT;
}

function getDefinitionSetId(definitionId: string): 'Neutrality' | 'Causality' | null {
  if (definitionId.startsWith('light-causality-') || definitionId.startsWith('dark-causality-') || definitionId.startsWith('ain-soph-aur-causality-')) return 'Causality';
  if (definitionId.startsWith('light-neutrality-') || definitionId.startsWith('dark-neutrality-') || definitionId.startsWith('ain-soph-aur-neutrality-')) return 'Neutrality';
  return null;
}

export function getUniqueOwnedCardsForSet(progress: ProgressState, setId: 'Neutrality' | 'Causality'): number {
  return CardRegistry.getAll().filter(card => getDefinitionSetId(card.definitionId) === setId && (progress.collection[card.definitionId] ?? 0) > 0).length;
}

export function isEnigmaSetUnlocked(progress: ProgressState, enigmaId: string): boolean {
  const definition = getEnigmaDefinition(enigmaId);
  return !!definition && isEnigmaDiscovered(progress, enigmaId);
}

export function isEnigmaDiscovered(progress: ProgressState, enigmaId: string): boolean {
  const definition = getEnigmaDefinition(enigmaId);
  return !!definition && isEnigmaUnlocked(progress) && getUniqueOwnedCardsForSet(progress, definition.setId) >= definition.minimumUniqueCards;
}

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
  if (existing) {
    const steps = existing.stepsComplete ?? [];
    if (steps.length !== definition.steps.length) {
      existing.stepsComplete = definition.steps.map((_, index) => steps[index] === true);
      existing.currentStepIndex = Math.min(existing.currentStepIndex, definition.steps.length - 1);
    }
    existing.progressCounters ??= {};
    return existing;
  }
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

export function evaluateEnigmaAcquisition(state: Pick<GameState, 'board' | 'progress' | 'turn'>): EnigmaProgressResult {
  ensureEnigmaState(state.progress);
  const result: EnigmaProgressResult = { newlyAcquired: [], newlyCompleted: [] };
  if (!isEnigmaUnlocked(state.progress)) return result;
  for (const definition of ENIGMA_DEFINITIONS) {
    if (!isEnigmaSetUnlocked(state.progress, definition.id)) continue;
    const instance = ensureInstance(state.progress, definition.id);
    if (!instance || instance.status !== 'locked') continue;
    const activeCausalityLight = state.board.backSlots.some(slot => slot?.type === 'Light' && slot.definitionId.startsWith('light-causality-') && slot.side === 'ain');
    const activeCausalityDark = state.board.backSlots.some(slot => slot?.type === 'Dark' && slot.definitionId.startsWith('dark-causality-') && slot.side === 'ain');
    const activeCausalityAsa = state.board.frontSlots.some(slot => slot?.type === 'AinSophAur' && slot.definitionId.startsWith('ain-soph-aur-causality-'));
    const activeCausalityCount = [...state.board.frontSlots, ...state.board.backSlots].filter(slot => slot?.definitionId.includes('causality')).length;
    const causalityUnlockConditionMet = definition.unlockCondition === 'causality-light'
      ? activeCausalityLight
      : definition.unlockCondition === 'causality-light-dark'
        ? activeCausalityLight && activeCausalityDark
        : definition.unlockCondition === 'causality-trinity'
          ? activeCausalityLight && activeCausalityDark && activeCausalityAsa
          : definition.unlockCondition === 'causality-three-active'
            ? activeCausalityCount >= 3
            : definition.unlockCondition === 'causality-cosmos'
              ? (state.turn.limitlessCosmosStacks ?? 0) >= 5
                : definition.unlockCondition === 'specific-cards'
                  ? (definition.unlockCardIds ?? []).every(cardId => (state.progress.cardPlayCounts?.[cardId] ?? 0) >= 1)
              : true;
    const boardAcquired = definition.id === 'neutral-mystery' && isNeutralMysteryAcquired(state.board);
    const abilityAcquired = definition.id === 'to-amplify-the-nullitude' && Object.keys(state.progress.ownedAbilities ?? {}).some(id => CardRegistry.get(id) === undefined ? false : id.startsWith('neutral'));
    const frontRowAcquired = (definition.id === 'null-surged') && state.board.frontSlots.every(slot => slot?.type === 'AinSophAur');
    const automaticAcquire = definition.id !== 'neutral-mystery' && definition.id !== 'to-amplify-the-nullitude' && definition.id !== 'null-surged';
    if (definition.setId === 'Causality' && !causalityUnlockConditionMet) continue;
    if (!boardAcquired && !abilityAcquired && !frontRowAcquired && !automaticAcquire) continue;
    instance.status = 'acquired';
    instance.currentStepIndex = 1;
    instance.stepsComplete[0] = true;
    instance.acquiredAt = Date.now();
    result.newlyAcquired.push(definition.id);
  }

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

export function evaluateNeutralizingVoidProgress(state: Pick<GameState, 'board' | 'progress'>): EnigmaProgressResult {
  ensureEnigmaState(state.progress);
  const result: EnigmaProgressResult = { newlyAcquired: [], newlyCompleted: [] };
  if (!isEnigmaUnlocked(state.progress)) return result;
  const instance = state.progress.enigmas.instances['neutralizing-the-void'];
  if (!instance || instance.status === 'locked') return result;

  const ainLightCount = state.board.backSlots.filter(slot => slot?.type === 'Light' && slot.side === 'ain').length;
  const chargedSophCount = state.board.backSlots.filter(slot => !!slot && slot.side === 'soph' && slot.limitlessCharge >= 3).length;

  if (instance.stepsComplete[1] && !instance.stepsComplete[2] && ainLightCount >= 2) {
    instance.stepsComplete[2] = true;
    instance.currentStepIndex = Math.max(instance.currentStepIndex, 3);
  }
  if (instance.stepsComplete[2] && !instance.stepsComplete[3] && ainLightCount >= 2 && chargedSophCount >= 2) {
    instance.stepsComplete[3] = true;
    instance.currentStepIndex = Math.max(instance.currentStepIndex, 4);
  }
  return result;
}

export function evaluateCausalityEnigmaProgress(state: Pick<GameState, 'board' | 'progress' | 'turn'>, endingTurn = false): EnigmaProgressResult {
  ensureEnigmaState(state.progress);
  const result: EnigmaProgressResult = { newlyAcquired: [], newlyCompleted: [] };
  if (!isEnigmaUnlocked(state.progress)) return result;

  const activeCausalityLight = state.board.backSlots.some(slot => slot?.type === 'Light' && slot.definitionId.startsWith('light-causality-') && slot.side === 'ain');
  const activeCausalityDark = state.board.backSlots.some(slot => slot?.type === 'Dark' && slot.definitionId.startsWith('dark-causality-') && slot.side === 'ain');
  const activeCausalityAsa = state.board.frontSlots.some(slot => slot?.type === 'AinSophAur' && slot.definitionId.startsWith('ain-soph-aur-causality-'));
  const activeCausalityTrinity = activeCausalityLight && activeCausalityDark && activeCausalityAsa;

  const update = (id: string, checks: boolean[]): void => {
    const instance = state.progress.enigmas.instances[id];
    if (!instance || instance.status === 'locked') return;
    for (let index = 1; index < checks.length + 1; index += 1) {
      if (instance.stepsComplete[index] || !instance.stepsComplete[index - 1] || !checks[index - 1]) continue;
      instance.stepsComplete[index] = true;
      instance.currentStepIndex = Math.max(instance.currentStepIndex, index + 1);
    }
  };

  const firstHorizon = state.progress.enigmas.instances['causality-first-horizon'];
  const blackInk = state.progress.enigmas.instances['causality-black-ink'];
  const archive = state.progress.enigmas.instances['causality-heavenly-archive'];
  const collapsed = state.progress.enigmas.instances['causality-collapsed-equation'];
  update('causality-first-horizon', [
    // "Play 5 Causality cards in a single turn" — must use the turn-scoped
    // counter (reset every turn end), never the lifetime `causalityPlays`
    // counter shared with causality-collapsed-equation below.
    (state.turn.causalityCardsPlayedThisTurn ?? 0) >= 5,
    (firstHorizon?.progressCounters?.cosmosGenerated ?? 0) >= 3,
  ]);
  update('causality-black-ink', [
    activeCausalityLight && activeCausalityDark,
    (blackInk?.progressCounters?.cosmosConsumed ?? 0) >= 2,
  ]);
  update('causality-heavenly-archive', [
    activeCausalityTrinity,
    (archive?.progressCounters?.bridgeAttacks ?? 0) >= 3,
  ]);
  update('causality-collapsed-equation', [
    (collapsed?.progressCounters?.causalityPlays ?? 0) >= 10,
    // "Earn 10,000 Divine Light from Causality card effects in a single
    // decisive turn" — must check the actual turn-scoped Divine Light total,
    // not an unrelated Cosmos counter.
    (state.turn.causalityDivineLightThisTurn ?? 0) >= 10_000,
  ]);
  update('causality-unwritten-law', [
    // "Use a Causality Light, Dark, and ASA in the same turn" requires the
    // actual trinity, not just any 3 causality board positions filled.
    activeCausalityTrinity,
    endingTurn && (state.turn.limitlessCosmosStacks ?? 0) >= 5,
  ]);
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
