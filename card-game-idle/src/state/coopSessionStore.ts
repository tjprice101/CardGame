import { create } from 'zustand';
import type { CoopMode } from '@/net/coopEvents';

export interface CoopSessionDescriptor {
  id: string;
  mode: CoopMode;
  partyId: string;
  hostUserId: string;
  participantIds: string[];
  rngSeed: number;
  modePayload: Record<string, unknown>;
  status: 'lobby' | 'active' | 'finished' | 'cancelled' | 'aborted';
}

export interface CoopSessionMember {
  userId: string;
  role: 'host' | 'guest';
  deckId: string | null;
  ready: boolean;
  connected: boolean;
  lastSeqAck: number;
}

export interface CoopSessionStoreState {
  session: CoopSessionDescriptor | null;
  members: CoopSessionMember[];
  localRole: 'host' | 'guest' | null;
  error: string | null;

  createSession: (
    mode: CoopMode,
    partyId: string,
    modePayload: Record<string, unknown>,
    hostDeckId: string,
  ) => Promise<string | null>;
  joinSession: (sessionId: string, guestDeckId: string) => Promise<boolean>;
  setLocalReady: (ready: boolean) => Promise<void>;
  leaveSession: () => Promise<void>;
  endSession: (outcome: 'victory' | 'defeat' | 'cancelled') => Promise<void>;
  hydrateFromDb: (sessionId: string) => Promise<void>;
}

export const useCoopSessionStore = create<CoopSessionStoreState>((set) => ({
  session: null,
  members: [],
  localRole: null,
  error: null,

  async createSession() {
    set({ error: null });
    return null;
  },

  async joinSession() {
    set({ error: null });
    return false;
  },

  async setLocalReady() {
    set({ error: null });
  },

  async leaveSession() {
    set({ session: null, members: [], localRole: null, error: null });
  },

  async endSession() {
    set({ session: null, members: [], localRole: null, error: null });
  },

  async hydrateFromDb() {
    set({ error: null });
  },
}));
