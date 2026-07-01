export type CoopMode = 'eternity_boss' | 'battleground_pvp' | 'null_raid';

export interface CoopEventBase {
  seq: number;
  sender: string;
  t: string;
}

export type CoopEvent = CoopEventBase & (
  | {
      type: 'session_started';
      payload: {
        mode: CoopMode;
        rngSeed: number;
        modePayload: Record<string, unknown>;
        participantIds: string[];
      };
    }
  | { type: 'player_ready'; payload: { userId: string; ready: boolean } }
  | { type: 'player_connected'; payload: { userId: string } }
  | { type: 'player_disconnected'; payload: { userId: string; reason: 'left' | 'timeout' | 'kicked' } }
  | { type: 'heartbeat'; payload: { userId: string; localSeqAck: number } }
  | { type: 'session_aborted'; payload: { reason: string } }
  | {
      type: 'session_finished';
      payload: { outcome: 'victory' | 'defeat'; summary: Record<string, unknown> };
    }
  | {
      type: 'player_board_summary';
      payload: {
        userId: string;
        boardCount: number;
        handCount: number;
        deckCount: number;
        oblivion: number;
      };
    }
  | {
      type: 'shared_damage_apply';
      payload: { userId: string; amount: number; sourceCardInstanceId?: string };
    }
  | { type: 'shared_hp_set'; payload: { hp: number; maxHp: number } }
  | { type: 'shared_timer_tick'; payload: { remainingMs: number } }
  | { type: 'shared_timer_expired'; payload: { outcome: 'defeat' } }
  | { type: 'shared_boss_defeated'; payload: { bossId: string; totalDamage: number } }
  | { type: 'boss_damage'; payload: { amount: number; sourceUserId: string } }
  | {
      type: 'encounter_advance';
      payload: {
        fromIndex: number;
        toIndex: number;
        bossId: string;
        hp: number;
        maxHp: number;
        resetTimerMs: number;
      };
    }
  | { type: 'encounter_completed'; payload: { encounterIndex: number; bossId: string } }
  | { type: 'raid_completed'; payload: { raidId: string; entropyAwarded: number; shardsAwarded: number } }
  | { type: 'pvp_score_update'; payload: { userId: string; score: number } }
  | { type: 'pvp_hand_empty'; payload: { userId: string; empty: boolean } }
  | {
      type: 'pvp_round_resolved';
      payload: { winnerUserId: string | null; myFinalScore: number; opponentFinalScore: number };
    }
  | { type: 'boss_phase_change'; payload: { bossId: string; phase: number; reason: string } }
  | {
      type: 'boss_attack_resolved';
      payload: { bossId: string; attackKind: string; affectedUserIds: string[]; effect: Record<string, unknown> };
    }
  | { type: 'resync_request'; payload: { userId: string; fromSeq: number } }
  | { type: 'resync_snapshot'; payload: { atSeq: number; snapshot: Record<string, unknown> } }
  | { type: 'debug_ping'; payload: { sentAtMs: number; tag?: string } }
);

export type CoopEventType = CoopEvent['type'];

export const COOP_PROTOCOL_VERSION = 1;

export interface CoopOutboundEnvelope {
  type: CoopEventType;
  payload: Record<string, unknown>;
}
