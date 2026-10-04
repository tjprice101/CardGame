import type { GameState } from '@/types/game';
import { cloneState } from '@/utils/stateClone';

let original: GameState | null = null;

export function isDebugSessionActive(): boolean {
  return original !== null;
}

export function beginDebugSession(state: GameState): void {
  if (original) return;
  const { version, startedAt, lastSavedAt, board, deck, turn, progress, settings, bossFight, battleground, gardenDungeon, trialDeck, saveTampered } = state;
  original = cloneState({ version, startedAt, lastSavedAt, board, deck, turn, progress, settings, bossFight, battleground, gardenDungeon, trialDeck, saveTampered });
}

export function getPersistentGameState(state: GameState): GameState {
  return original ?? state;
}

export function endDebugSession(): GameState | null {
  const restored = original;
  original = null;
  return restored;
}
