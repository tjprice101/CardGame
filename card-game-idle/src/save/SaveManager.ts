import LZString from 'lz-string';
import type { GameState } from '@/types/game';
import { createSaveStorage, type SaveStorage } from './storage';
import { signEnvelope, verifyEnvelope } from './integrity';

export const CURRENT_VERSION = 18;
const AUTO_SAVE_INTERVAL_MS = 120_000;
const EXPORT_MAGIC = 'PANTHEON1:';
// Legacy export prefix from before the Pantheon rename. Accepted on import
// so save files exported by older builds still load cleanly.
const LEGACY_EXPORT_MAGIC = 'HRSAVE1:';

export interface LoadResult {
  state: GameState;
  /** True if the on-disk envelope's signature did not validate. */
  tampered: boolean;
  /** True if the envelope is from before v8 (no signature was expected). */
  legacy: boolean;
}

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
  8: (data) => {
    // v8→v9 reserved. v8 introduces signed save envelopes; the payload shape
    // itself is unchanged, so this migration is a no-op placeholder so that
    // legacy v7 saves get acknowledged as "migrated through v8".
    return data;
  },
  9: (data) => {
    // v9 adds player profile + daily-login tracking to ProgressState.
    if (data.progress) {
      const p = data.progress as unknown as Record<string, unknown>;
      if (p.profile === undefined) {
        p.profile = { name: 'Wanderer', avatarId: 'avatar-acolyte', titleId: null };
      }
      if (p.dailyLogin === undefined) {
        p.dailyLogin = { lastClaimedDayIndex: -1, streak: 0, totalClaims: 0 };
      }
    }
    return data;
  },
  10: (data) => {
    // v10 adds custom UI theme fields (uiThemeId + customUiTheme) to the
    // player profile.
    if (data.progress) {
      const p = data.progress as unknown as Record<string, unknown>;
      const prof = (p.profile ?? {}) as Record<string, unknown>;
      if (typeof prof.uiThemeId !== 'string') prof.uiThemeId = 'theme-warm-default';
      if (prof.customUiTheme === undefined) prof.customUiTheme = null;
      p.profile = prof;
    }
    return data;
  },
  11: (data) => {
    // v11 adds the quest rotation + achievement claim tracking to progress.
    if (data.progress) {
      const p = data.progress as unknown as Record<string, unknown>;
      if (p.quests === undefined) {
        p.quests = { daily: [], weekly: [], lastDailyRollDay: -1, lastWeeklyRollWeek: -1 };
      }
      if (p.achievementClaims === undefined) {
        p.achievementClaims = {};
      }
    }
    return data;
  },
  12: (data) => {
    // v12 adds per-card play counts + mastery claim tracking.
    if (data.progress) {
      const p = data.progress as unknown as Record<string, unknown>;
      if (p.cardPlayCounts === undefined) p.cardPlayCounts = {};
      if (p.cardMasteryClaims === undefined) p.cardMasteryClaims = {};
    }
    return data;
  },
  13: (data) => {
    // v13 adds per-pack Epic pity, boss codex tracking, and weekly trial completions.
    if (data.progress) {
      const p = data.progress as unknown as Record<string, unknown>;
      if (p.packPityCounters === undefined) p.packPityCounters = {};
      if (p.bossCodex === undefined) p.bossCodex = {};
      if (p.weeklyTrialCompletions === undefined) p.weeklyTrialCompletions = {};
    }
    return data;
  },
  14: (data) => {
    // v14 adds: recentlyAcquired (NEW badges), packOpenHistory, gauntletBest, compactMode, instantPackReveal.
    if (data.progress) {
      const p = data.progress as unknown as Record<string, unknown>;
      if (p.recentlyAcquired === undefined) p.recentlyAcquired = {};
      if (p.lastCollectionViewedAt === undefined) p.lastCollectionViewedAt = 0;
      if (p.packOpenHistory === undefined) p.packOpenHistory = [];
      if (p.gauntletBest === undefined) p.gauntletBest = { bestDepth: 0, bestShards: 0, runs: 0 };
    }
    if (data.settings) {
      const s = data.settings as unknown as Record<string, unknown>;
      if (s.compactMode === undefined) s.compactMode = false;
      if (s.instantPackReveal === undefined) s.instantPackReveal = false;
    }
    return data;
  },
  15: (data) => {
    // v15 adds: highlightRulesText (default true) for card-text keyword highlighting.
    if (data.settings) {
      const s = data.settings as unknown as Record<string, unknown>;
      if (s.highlightRulesText === undefined) s.highlightRulesText = true;
    }
    return data;
  },
  16: (data) => {
    // v16 adds: configurable keyboard controls map. Inject defaults if missing.
    if (data.settings) {
      const s = data.settings as unknown as Record<string, unknown>;
      const existing = (s.controls as Record<string, string> | undefined) ?? {};
      s.controls = {
        swapExtraDeck: existing.swapExtraDeck ?? 'KeyE',
        openTutorial: existing.openTutorial ?? 'Slash',
        closeOverlay: existing.closeOverlay ?? 'Escape',
      };
    }
    return data;
  },
  17: (data) => {
    // v17 adds: artifact system — ownedArtifacts, powderBySet, and per-deck equippedArtifacts.
    if (data.progress) {
      const p = data.progress as unknown as Record<string, unknown>;
      if (p.ownedArtifacts === undefined) p.ownedArtifacts = {};
      if (p.powderBySet === undefined) p.powderBySet = {};
      const decks = p.savedDecks as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(decks)) {
        for (const deck of decks) {
          if (deck.equippedArtifacts === undefined) deck.equippedArtifacts = [];
        }
      }
    }
    return data;
  },
  18: (data) => {
    // v18 reworks artifact economy: per-set powder replaced by universal cardbaneLight;
    // ownedArtifacts converts from { [id]: true } to { [id]: copiesBought }; SavedDeck.notes added.
    if (data.progress) {
      const p = data.progress as unknown as Record<string, unknown>;
      // Sum any prior per-set powder into a single Card-bane Light total.
      const oldPowder = p.powderBySet as Record<string, number> | undefined;
      let light = (p.cardbaneLight as number | undefined) ?? 0;
      if (oldPowder && typeof oldPowder === 'object') {
        for (const k of Object.keys(oldPowder)) {
          const v = oldPowder[k];
          if (typeof v === 'number' && isFinite(v) && v > 0) light += v;
        }
      }
      p.cardbaneLight = light;
      delete p.powderBySet;
      // Migrate ownedArtifacts from boolean map to copy-count map.
      const owned = p.ownedArtifacts as Record<string, unknown> | undefined;
      const migrated: Record<string, number> = {};
      if (owned && typeof owned === 'object') {
        for (const id of Object.keys(owned)) {
          const v = owned[id];
          if (typeof v === 'number' && v > 0) migrated[id] = Math.floor(v);
          else if (v === true) migrated[id] = 1;
        }
      }
      p.ownedArtifacts = migrated;
      // Add notes field to saved decks.
      const decks = p.savedDecks as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(decks)) {
        for (const deck of decks) {
          if (typeof deck.notes !== 'string') deck.notes = '';
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
  /** Tracks the integrity state of the most recent load(). */
  private lastLoadTampered = false;

  constructor(
    getState: () => GameState,
    storage: SaveStorage = createSaveStorage(),
    onSaved?: (timestamp: number) => void,
  ) {
    this.getState = getState;
    this.storage = storage;
    this.onSaved = onSaved;
  }

  /**
   * Convenience accessor that mirrors the old API (returns GameState | null)
   * for callers that don't care about integrity status.
   */
  load(): GameState | null {
    return this.loadWithStatus()?.state ?? null;
  }

  /**
   * Loads, migrates, and verifies the on-disk save. Returns `null` if no save
   * exists or it is unrecoverably corrupt. A successful return always yields a
   * GameState — the `tampered` flag is informational so the UI can surface
   * a warning rather than refusing to load.
   */
  loadWithStatus(): LoadResult | null {
    try {
      const raw = this.storage.read();
      if (!raw) return null;
      const result = decodeEnvelope(raw);
      if (!result) return null;
      this.lastLoadTampered = result.tampered;
      const migrated = applyMigrations(result.version, result.data);
      return { state: migrated, tampered: result.tampered, legacy: result.legacy };
    } catch {
      return null;
    }
  }

  save(): void {
    const state = this.getState();
    const savedAt = Date.now();
    const payload: GameState = { ...state, lastSavedAt: savedAt };
    // saveTampered is an in-memory UI flag, not part of persisted state.
    delete (payload as { saveTampered?: boolean }).saveTampered;
    // Transient toast queue is also UI-only.
    delete (payload as { toasts?: unknown }).toasts;
    const envelope = encodeEnvelope(CURRENT_VERSION, savedAt, payload);
    this.storage.write(envelope);
    this.onSaved?.(savedAt);
  }

  /**
   * Returns a portable string suitable for writing to a .pansave file.
   * Format: "PANTHEON1:" + base64(envelopeJson). The signature inside the
   * envelope still protects against casual edits after export.
   */
  exportSave(): string | null {
    const raw = this.storage.read();
    if (!raw) {
      // Force a save first so the export reflects current in-memory state.
      this.save();
      const after = this.storage.read();
      if (!after) return null;
      return EXPORT_MAGIC + toBase64(after);
    }
    return EXPORT_MAGIC + toBase64(raw);
  }

  /**
   * Validates an exported save string and writes it to storage. Returns the
   * migrated state and integrity status, or `null` if the export is not a
   * recognizable Pantheon save file.
   */
  importSave(text: string): LoadResult | null {
    const trimmed = text.trim();
    const magic = trimmed.startsWith(EXPORT_MAGIC)
      ? EXPORT_MAGIC
      : trimmed.startsWith(LEGACY_EXPORT_MAGIC)
        ? LEGACY_EXPORT_MAGIC
        : null;
    if (!magic) return null;
    let raw: string;
    try {
      raw = fromBase64(trimmed.slice(magic.length));
    } catch {
      return null;
    }
    const decoded = decodeEnvelope(raw);
    if (!decoded) return null;
    // Persist the imported envelope as-is (preserves its original signature
    // and version so subsequent loads behave identically).
    this.storage.write(raw);
    this.lastLoadTampered = decoded.tampered;
    const migrated = applyMigrations(decoded.version, decoded.data);
    return { state: migrated, tampered: decoded.tampered, legacy: decoded.legacy };
  }

  get tampered(): boolean {
    return this.lastLoadTampered;
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
    this.lastLoadTampered = false;
  }
}

// ---- Envelope helpers ------------------------------------------------------

interface SignedEnvelope {
  /** Envelope schema marker. */
  v: number;
  /** Save data schema version (matches CURRENT_VERSION at write time). */
  sv: number;
  /** Saved-at timestamp (ms). */
  t: number;
  /** LZ-string compressed JSON payload. */
  p: string;
  /** Hex SHA-256 signature over (pepper, sv, t, p). */
  s: string;
}

interface LegacyEnvelope {
  version: number;
  data: string;
}

interface DecodedEnvelope {
  version: number;
  data: Partial<GameState>;
  tampered: boolean;
  legacy: boolean;
}

function encodeEnvelope(version: number, savedAt: number, payload: GameState): string {
  const json = JSON.stringify(payload);
  const compressed = LZString.compressToUTF16(json);
  const signature = signEnvelope(version, savedAt, compressed);
  const envelope: SignedEnvelope = {
    v: 1,
    sv: version,
    t: savedAt,
    p: compressed,
    s: signature,
  };
  return JSON.stringify(envelope);
}

function decodeEnvelope(raw: string): DecodedEnvelope | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;

  // New signed envelope.
  if ('v' in parsed && 'sv' in parsed && 'p' in parsed && 's' in parsed) {
    const env = parsed as SignedEnvelope;
    if (typeof env.sv !== 'number' || typeof env.t !== 'number'
        || typeof env.p !== 'string' || typeof env.s !== 'string') {
      return null;
    }
    const decompressed = LZString.decompressFromUTF16(env.p);
    if (!decompressed) return null;
    let data: Partial<GameState>;
    try {
      data = JSON.parse(decompressed) as Partial<GameState>;
    } catch {
      return null;
    }
    const valid = verifyEnvelope(env.sv, env.t, env.p, env.s);
    return { version: env.sv, data, tampered: !valid, legacy: false };
  }

  // Legacy unsigned envelope ({ version, data }).
  if ('version' in parsed && 'data' in parsed) {
    const env = parsed as LegacyEnvelope;
    if (typeof env.version !== 'number' || typeof env.data !== 'string') return null;
    const decompressed = LZString.decompressFromUTF16(env.data);
    if (!decompressed) return null;
    let data: Partial<GameState>;
    try {
      data = JSON.parse(decompressed) as Partial<GameState>;
    } catch {
      return null;
    }
    // Legacy saves are treated as trusted (the player didn't have the option
    // to tamper-detect at write time). Mark legacy so callers can prompt for
    // a re-save into the signed format.
    return { version: env.version, data, tampered: false, legacy: true };
  }

  return null;
}

function toBase64(input: string): string {
  if (typeof btoa === 'function') {
    // Encode UTF-16 string via UTF-8 to keep btoa happy with non-Latin1 chars.
    return btoa(unescape(encodeURIComponent(input)));
  }
  // Node / vitest fallback.
  return Buffer.from(input, 'utf8').toString('base64');
}

function fromBase64(input: string): string {
  if (typeof atob === 'function') {
    return decodeURIComponent(escape(atob(input)));
  }
  return Buffer.from(input, 'base64').toString('utf8');
}
