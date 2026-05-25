export interface SaveStorage {
  read(): string | null;
  write(payload: string): void;
  remove(): void;
}

export function createSaveStorage(): SaveStorage {
  const bridge = typeof window !== 'undefined'
    ? ((window as any).pantheonSave ?? (window as any).heavenlySave)
    : undefined;
  if (bridge) {
    return {
      read: () => bridge.read() ?? null,
      write: (payload: string) => { bridge.write(payload); },
      remove: () => { bridge.remove(); },
    };
  }

  const SAVE_KEY = 'pantheon-save';
  const LEGACY_SAVE_KEY = 'heavenly-retribution-save';
  return {
    read: () => {
      const current = localStorage.getItem(SAVE_KEY);
      if (current !== null) return current;
      // One-time migration from the pre-rename storage key.
      const legacy = localStorage.getItem(LEGACY_SAVE_KEY);
      if (legacy !== null) {
        localStorage.setItem(SAVE_KEY, legacy);
        localStorage.removeItem(LEGACY_SAVE_KEY);
        return legacy;
      }
      return null;
    },
    write: (payload: string) => { localStorage.setItem(SAVE_KEY, payload); },
    remove: () => {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(LEGACY_SAVE_KEY);
    },
  };
}