import LZString from 'lz-string';
import type { GameState } from '@/types/game';
import { createSaveStorage, type SaveStorage } from './storage';

const CURRENT_VERSION = 7;
const AUTO_SAVE_INTERVAL_MS = 120_000;

type Migration = (data: Partial<GameState>) => Partial<GameState>;

const migrations: Record<number, Migration> = {
  6: (data) => {
    // Add pityCounters field for v6��v7 migration
    if (data.progress) {
      data.progress.pityCounters = {};
    }
    return data;
  },
  7: (data) => {
    // v7��v8: remap seek-neutral-* deck IDs to ophanim-neutral-*
    //        convert CherubimInstance board state to CherubimInstance
    const idMap: Record<string, string> = {
      'seek-neutral-null-seek': 'ophanim-neutral-null-seek',
      'seek-neutral-seraph-recall': 'ophanim-neutral-seraph-recall',
      'seek-neutral-neutral-cycle': 'ophanim-neutral-neutral-cycle',
      'seek-neutral-measured-seek': 'ophanim-neutral-measured-seek',
      'seek-neutral-void-surge': 'ophanim-neutral-void-surge',
      'seek-neutral-still-pulse': 'ophanim-neutral-still-pulse',
      'seek-neutral-chain-pulse': 'ophanim-neutral-chain-pulse',
      'seek-neutral-cherubim-recall': 'ophanim-neutral-cherubim-recall',
      'seek-neutral-deep-seek': 'ophanim-neutral-deep-seek',
      'seek-neutral-grand-seek': 'ophanim-neutral-grand-seek',
      'seek-neutral-echo-pulse': 'ophanim-neutral-echo-pulse',
      'seek-neutral-seraph-hunt': 'ophanim-neutral-seraph-hunt',
      'seek-neutral-nullfall': 'ophanim-neutral-nullfall',
    };
    function remapId(id: string): string { return idMap[id] ?? id; }
    function remapCards(arr: Array<{ definitionId: string } | null> | undefined) {
      if (!arr) return;
      for (const c of arr) {
        if (!c) continue;
        c.definitionId = remapId(c.definitionId);
      }
    }
    function remapFavoriteKeys(favorites: Record<string, boolean> | undefined) {
      if (!favorites) return;
      for (const key of Object.keys(favorites)) {
        const [definitionId, finish] = key.split('::');
        if (!definitionId || !finish) continue;
        const nextDefinitionId = remapId(definitionId);
        const nextKey = `${nextDefinitionId}::${finish}`;
        if (nextKey !== key) {
          favorites[nextKey] = favorites[nextKey] || favorites[key];
          delete favorites[key];
        }
      }
    }
    function remapOwnedRecord(record: Record<string, unknown> | undefined) {
      if (!record) return;
      for (const oldId of Object.keys(idMap)) {
        const newId = idMap[oldId];
        if (record[oldId] !== undefined) {
          record[newId] = (record[newId] as number ?? 0) + (record[oldId] as number);
          delete record[oldId];
        }
      }
    }
    if (data.deck) {
      remapCards(data.deck.hand);
      remapCards(data.deck.drawPile);
      remapCards(data.deck.discardPile);
      remapCards(data.deck.deckList);
      remapCards(data.deck.extraDeck);
    }
    if (data.progress?.collection) {
      remapOwnedRecord(data.progress.collection as Record<string, unknown>);
      remapOwnedRecord(data.progress.holoCollection as Record<string, unknown> | undefined);
      remapOwnedRecord(data.progress.infiniteCollection as Record<string, unknown> | undefined);
      remapFavoriteKeys(data.progress.favoriteCollection as Record<string, boolean> | undefined);
      if (data.progress.savedDecks) {
        for (const savedDeck of data.progress.savedDecks) {
          remapCards(savedDeck.deckList);
          remapCards(savedDeck.extraDeck);
        }
      }
      }
    if (data.board) {
      remapCards(data.board.frontSlots as Array<{ definitionId: string } | null> | undefined);
      remapCards(data.board.backSlots as Array<{ definitionId: string } | null> | undefined);
    }
    if (data.turn) {
      if (typeof data.turn.lastPlayedDefinitionId === 'string') {
        data.turn.lastPlayedDefinitionId = remapId(data.turn.lastPlayedDefinitionId);
      }
      const pending = data.turn.pendingEffect as { cards?: Array<{ definitionId: string }>; allCards?: Array<{ definitionId: string }> } | null | undefined;
      if (pending) {
        remapCards(pending.cards);
        remapCards(pending.allCards);
      }
    }
    // Convert CherubimInstance on board backSlots �� CherubimInstance
    if (data.board?.backSlots) {
      const slots = data.board.backSlots as Array<Record<string, unknown> | null>;
      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        if (slot && slot['type'] === 'Cherubim') {
          slot['type'] = 'Cherubim';
          delete slot['durability'];
          delete slot['maxDurability'];
        }
      }
    }
    return data;
  },
};

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
  private storage: SaveStorage;
  private onSaved?: (timestamp: number) => void;

  constructor(
    getState: () => GameState,
    storage: SaveStorage = createSaveStorage(),
    onSaved?: (timestamp: number) => void,
  ) {
    this.getState = getState;
    this.storage = storage;
    this.onSaved = onSaved;
  }

  load(): GameState | null {
    try {
      const raw = this.storage.read();
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
    const savedAt = Date.now();
    const payload: GameState = { ...state, lastSavedAt: savedAt };
    const json = JSON.stringify(payload);
    const compressed = LZString.compressToUTF16(json);
    const envelope = JSON.stringify({ version: CURRENT_VERSION, data: compressed });
    this.storage.write(envelope);
    this.onSaved?.(savedAt);
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
    this.storage.remove();
  }
}
