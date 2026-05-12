import LZString from 'lz-string';
import type { GameState } from '@/types/game';

const SAVE_KEY = 'heavenly-retribution-save';
const CURRENT_VERSION = 4;
const AUTO_SAVE_INTERVAL_MS = 30_000;

type Migration = (data: Partial<GameState>) => Partial<GameState>;

const migrations: Record<number, Migration> = {};

function applyMigrations(version: number, data: Partial<GameState>): GameState {
  let current = data;
  let v = version;
  while (v <= CURRENT_VERSION) {
    current = migrations[v]?.(current) ?? current;
    v++;
  }
  return current as GameState;
}

export class SaveManager {
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  private getState: () => GameState;

  constructor(getState: () => GameState) {
    this.getState = getState;
  }

  load(): GameState | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;

      const envelope = JSON.parse(raw) as { version: number; data: string };
      const decompressed = LZString.decompressFromUTF16(envelope.data);
      if (!decompressed) return null;

      const parsed = JSON.parse(decompressed) as Partial<GameState>;
      return applyMigrations(envelope.version, parsed);
    } catch {
      return null;
    }
  }

  save(): void {
    const state = this.getState();
    const payload: GameState = { ...state, lastSavedAt: Date.now() };
    const json = JSON.stringify(payload);
    const compressed = LZString.compressToUTF16(json);
    const envelope = JSON.stringify({ version: CURRENT_VERSION, data: compressed });
    localStorage.setItem(SAVE_KEY, envelope);
  }

  startAutoSave(): void {
    this.autoSaveTimer = setInterval(() => this.save(), AUTO_SAVE_INTERVAL_MS);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      this.save();
    }
  };

  wipe(): void {
    localStorage.removeItem(SAVE_KEY);
  }
}
