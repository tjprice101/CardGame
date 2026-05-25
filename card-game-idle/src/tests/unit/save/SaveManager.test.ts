import { describe, it, expect, beforeEach } from 'vitest';
import LZString from 'lz-string';
import { SaveManager, CURRENT_VERSION } from '@/save/SaveManager';
import { signEnvelope, sha256Hex, verifyEnvelope } from '@/save/integrity';
import { defaultGameState } from '@/state/store';
import type { SaveStorage } from '@/save/storage';
import type { GameState } from '@/types/game';

function memStorage(): SaveStorage & { peek(): string | null } {
  let value: string | null = null;
  return {
    read: () => value,
    write: (p) => { value = p; },
    remove: () => { value = null; },
    peek: () => value,
  };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...defaultGameState, ...overrides, lastSavedAt: 0 };
}

describe('SaveManager integrity', () => {
  describe('sha256Hex sanity', () => {
    it('matches the NIST test vector for the empty string', () => {
      expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });
    it('matches the NIST test vector for "abc"', () => {
      expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    });
  });

  describe('round-trip', () => {
    let storage: ReturnType<typeof memStorage>;
    let mgr: SaveManager;
    let state: GameState;

    beforeEach(() => {
      storage = memStorage();
      state = makeState();
      mgr = new SaveManager(() => state, storage);
    });

    it('save → load returns the same state and is not tampered', () => {
      mgr.save();
      const result = mgr.loadWithStatus();
      expect(result).not.toBeNull();
      expect(result!.tampered).toBe(false);
      expect(result!.legacy).toBe(false);
      // Smoke-check a couple of fields survived round-trip.
      expect(result!.state.settings.musicVolume).toBe(state.settings.musicVolume);
    });

    it('does not persist the saveTampered UI flag', () => {
      state = makeState({ saveTampered: true });
      mgr = new SaveManager(() => state, storage);
      mgr.save();
      const raw = storage.peek()!;
      const env = JSON.parse(raw) as { p: string };
      const inner = JSON.parse(LZString.decompressFromUTF16(env.p)!) as Record<string, unknown>;
      expect(inner.saveTampered).toBeUndefined();
    });
  });

  describe('tamper detection', () => {
    it('flags a save whose compressed payload was edited', () => {
      const storage = memStorage();
      const mgr = new SaveManager(() => makeState(), storage);
      mgr.save();
      const raw = JSON.parse(storage.peek()!) as { p: string; s: string; t: number; sv: number; v: number };
      // Mutate the payload by appending a single character — signature must no longer match.
      raw.p = raw.p + ' ';
      storage.write(JSON.stringify(raw));
      const result = mgr.loadWithStatus();
      // Payload may still decompress (LZ-string is lenient) or may fail; if it
      // fails we get null, which is also a valid "rejected" outcome. If it
      // succeeds we must see tampered=true.
      if (result) {
        expect(result.tampered).toBe(true);
      }
    });

    it('flags a save whose signature was zeroed out', () => {
      const storage = memStorage();
      const mgr = new SaveManager(() => makeState(), storage);
      mgr.save();
      const raw = JSON.parse(storage.peek()!) as { s: string };
      raw.s = '0'.repeat(64);
      storage.write(JSON.stringify(raw));
      const result = mgr.loadWithStatus();
      expect(result).not.toBeNull();
      expect(result!.tampered).toBe(true);
    });

    it('accepts a save that was re-signed with the real pepper', () => {
      // Sanity check that verifyEnvelope agrees with signEnvelope.
      const sig = signEnvelope(8, 12345, 'payload');
      expect(verifyEnvelope(8, 12345, 'payload', sig)).toBe(true);
      expect(verifyEnvelope(8, 12345, 'payload!', sig)).toBe(false);
    });
  });

  describe('legacy envelope', () => {
    it('loads an old unsigned { version, data } envelope and marks it legacy', () => {
      const storage = memStorage();
      const payload = JSON.stringify(makeState());
      const compressed = LZString.compressToUTF16(payload);
      storage.write(JSON.stringify({ version: 7, data: compressed }));
      const mgr = new SaveManager(() => makeState(), storage);
      const result = mgr.loadWithStatus();
      expect(result).not.toBeNull();
      expect(result!.legacy).toBe(true);
      expect(result!.tampered).toBe(false);
    });

    it('migrates a pre-v9 save by initializing profile and dailyLogin', () => {
      const storage = memStorage();
      // Build a "legacy" v8 payload by stripping the new v9 fields.
      const legacyState = makeState();
      const legacyProgress = { ...legacyState.progress } as Record<string, unknown>;
      delete legacyProgress.profile;
      delete legacyProgress.dailyLogin;
      const legacyPayload = {
        ...legacyState,
        progress: legacyProgress,
      };
      const compressed = LZString.compressToUTF16(JSON.stringify(legacyPayload));
      storage.write(JSON.stringify({ version: 8, data: compressed }));

      const mgr = new SaveManager(() => makeState(), storage);
      const result = mgr.loadWithStatus();
      expect(result).not.toBeNull();
      const prog = result!.state.progress as unknown as Record<string, unknown>;
      expect(prog.profile).toBeDefined();
      expect(prog.dailyLogin).toBeDefined();
      const profile = prog.profile as { name: string; avatarId: string; titleId: string | null };
      expect(profile.name).toBe('Wanderer');
      expect(profile.avatarId).toBe('avatar-acolyte');
      expect(profile.titleId).toBeNull();
      const dl = prog.dailyLogin as { lastClaimedDayIndex: number; streak: number; totalClaims: number };
      expect(dl.lastClaimedDayIndex).toBe(-1);
      expect(dl.streak).toBe(0);
      expect(dl.totalClaims).toBe(0);
    });
  });

  describe('export / import', () => {
    it('round-trips through exportSave → importSave', () => {
      const storageA = memStorage();
      const storageB = memStorage();
      const stateA = makeState();
      const mgrA = new SaveManager(() => stateA, storageA);
      mgrA.save();

      const exported = mgrA.exportSave();
      expect(exported).toBeTruthy();
      expect(exported!.startsWith('PANTHEON1:')).toBe(true);

      const mgrB = new SaveManager(() => makeState(), storageB);
      const result = mgrB.importSave(exported!);
      expect(result).not.toBeNull();
      expect(result!.tampered).toBe(false);
      expect(result!.legacy).toBe(false);
      expect(storageB.peek()).not.toBeNull();
    });

    it('rejects an unrecognized payload', () => {
      const storage = memStorage();
      const mgr = new SaveManager(() => makeState(), storage);
      expect(mgr.importSave('not a save')).toBeNull();
      expect(mgr.importSave('PANTHEON1:!!!not-base64')).toBeNull();
    });
  });

  describe('current schema version', () => {
    it('is at least 9 (profile + daily login were introduced at v9)', () => {
      expect(CURRENT_VERSION).toBeGreaterThanOrEqual(9);
    });
  });
});
