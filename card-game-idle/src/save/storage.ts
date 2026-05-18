export interface SaveStorage {
  read(): string | null;
  write(payload: string): void;
  remove(): void;
}

export function createSaveStorage(): SaveStorage {
  const bridge = typeof window !== 'undefined' ? (window.heavenlySave as any) : undefined;
  if (bridge) {
    return {
      read: () => bridge.read() ?? null,
      write: (payload: string) => { bridge.write(payload); },
      remove: () => { bridge.remove(); },
    };
  }

  const SAVE_KEY = 'heavenly-retribution-save';
  return {
    read: () => localStorage.getItem(SAVE_KEY),
    write: (payload: string) => { localStorage.setItem(SAVE_KEY, payload); },
    remove: () => { localStorage.removeItem(SAVE_KEY); },
  };
}