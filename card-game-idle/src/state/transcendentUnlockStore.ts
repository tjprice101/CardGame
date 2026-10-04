import { create } from 'zustand';

export type TranscendentUnlock =
  | { kind: 'card'; definitionId: string; firstCopy: boolean; totalOwned: number; amount?: number }
  | { kind: 'ability'; abilityId: string }
  | { kind: 'shards'; amount: number; totalOwned: number };

interface UnlockState {
  queue: TranscendentUnlock[];
  enqueue: (unlock: TranscendentUnlock) => void;
  dismiss: () => void;
  clear: () => void;
}

export const useTranscendentUnlockStore = create<UnlockState>(set => ({
  queue: [],
  enqueue: unlock => set(state => {
    const last = state.queue.at(-1);
    if (last?.kind === 'card' && unlock.kind === 'card' && last.definitionId === unlock.definitionId
      && unlock.totalOwned === last.totalOwned + (unlock.amount ?? 1)
      && unlock.amount !== undefined && last.amount !== undefined) {
      return { queue: [...state.queue.slice(0, -1), { ...last, totalOwned: unlock.totalOwned, amount: last.amount + unlock.amount }] };
    }
    if (last?.kind === 'shards' && unlock.kind === 'shards' && unlock.totalOwned === last.totalOwned + unlock.amount) {
      return { queue: [...state.queue.slice(0, -1), { ...unlock, amount: last.amount + unlock.amount }] };
    }
    return { queue: [...state.queue, unlock] };
  }),
  dismiss: () => set(state => ({ queue: state.queue.slice(1) })),
  clear: () => set({ queue: [] }),
}));
