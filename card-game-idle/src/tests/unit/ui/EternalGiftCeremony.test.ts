import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
import { useGiftsStore, type GiftRow } from '@/state/giftsStore';
import { useSocialStore } from '@/state/socialStore';
import { useTranscendentUnlockStore } from '@/state/transcendentUnlockStore';
import { intensityEternalCards } from '@/data/cards/intensityCards';

const { getClient } = vi.hoisted(() => ({ getClient: vi.fn() }));
vi.mock('@/net/supabaseClient', async importOriginal => ({
  ...await importOriginal<typeof import('@/net/supabaseClient')>(), getSupabase: getClient,
}));

const cardId = intensityEternalCards[0].definitionId;
const gift: GiftRow = {
  id: 'gift', senderId: 'sender', recipientId: 'recipient', kind: 'card_copy', status: 'pending',
  payload: { definitionId: cardId, count: 2, finish: 'holo' }, createdAt: '2026-10-04', claimedAt: null,
};
const row = {
  id: gift.id, sender_id: gift.senderId, recipient_id: gift.recipientId, kind: gift.kind,
  payload: gift.payload, status: 'claimed', created_at: gift.createdAt, claimed_at: gift.createdAt,
};

beforeEach(() => {
  useStore.getState().loadState(structuredClone(defaultGameState));
  useSocialStore.setState({ user: { id: 'recipient', aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: gift.createdAt } });
  useGiftsStore.setState({ incoming: [gift], outgoing: [], errorMessage: null });
});
afterEach(() => {
  getClient.mockReset();
  useSocialStore.setState({ user: null });
  useTranscendentUnlockStore.getState().clear();
});

function mockServer(error: { message: string } | null = null): void {
  const query = {
    insert: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: error ? null : row, error }),
  };
  getClient.mockReturnValue({ from: vi.fn().mockReturnValue(query) });
}

describe('Eternal gift ceremonies', () => {
  it('celebrates a successfully claimed multi-copy gift once', async () => {
    mockServer();
    await useGiftsStore.getState().claimGift(gift.id);
    expect(useTranscendentUnlockStore.getState().queue).toEqual([
      { kind: 'card', definitionId: cardId, firstCopy: true, amount: 2, totalOwned: 2 },
    ]);
    await useGiftsStore.getState().claimGift(gift.id);
    expect(useTranscendentUnlockStore.getState().queue).toHaveLength(1);
  });

  it('does not celebrate rejected claims or send-failure inventory restoration', async () => {
    mockServer({ message: 'Rejected' });
    await useGiftsStore.getState().claimGift(gift.id);
    expect(useGiftsStore.getState().errorMessage).toBe('Rejected');
    useStore.setState(state => ({ progress: {
      ...state.progress, collection: { ...state.progress.collection, [cardId]: 2 },
      holoCollection: { ...state.progress.holoCollection, [cardId]: 2 },
    } }));
    await useGiftsStore.getState().sendCardCopyGift('friend', gift.payload);
    expect(useStore.getState().progress.collection[cardId]).toBe(2);
    expect(useTranscendentUnlockStore.getState().queue).toEqual([]);
  });
});
