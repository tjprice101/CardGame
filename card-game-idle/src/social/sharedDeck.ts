// Canonical payload shapes for things attached to a DM message.
//
// Everything that travels through `dm_messages.attachment_json` is serialised
// from one of these typed payloads so receivers can dispatch on `kind`.

import type { DeckEntry, ExtraDeckEntry } from '@/types/game';
import type { CardFinish } from '@/types/cards';

export type AttachmentPayload = SharedDeckPayload | GiftReferencePayload;

export interface SharedDeckPayload {
  kind: 'shared_deck';
  /** Schema version of the deck payload. Bump if DeckEntry shape changes. */
  version: 1;
  /** Display name of the deck. Trimmed, max 60 chars. */
  name: string;
  /** Main deck entries, including finishes. */
  deckList: DeckEntry[];
  /** Extra-deck (Angel) entries. */
  extraDeck: ExtraDeckEntry[];
  /** Optional notes the sender provided. Max 500 chars. */
  notes?: string;
}

/**
 * Inline reference to a gift row. Inserted as a DM attachment so the gift
 * shows up in the conversation thread; the canonical record still lives in
 * the `gifts` table.
 */
export interface GiftReferencePayload {
  kind: 'gift_ref';
  giftId: string;
  cardDefinitionId: string;
  finish: CardFinish;
  count: number;
  note?: string;
}

// ── Type guards ─────────────────────────────────────────────────────────────

export function isSharedDeckPayload(value: unknown): value is SharedDeckPayload {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (v.kind !== 'shared_deck') return false;
  if (typeof v.name !== 'string' || v.name.length === 0) return false;
  if (!Array.isArray(v.deckList) || !Array.isArray(v.extraDeck)) return false;
  for (const e of v.deckList) {
    if (!e || typeof e !== 'object') return false;
    const ee = e as Record<string, unknown>;
    if (typeof ee.definitionId !== 'string') return false;
    if (typeof ee.copies !== 'number' || ee.copies < 1 || ee.copies > 4) return false;
    if (ee.finish !== 'normal' && ee.finish !== 'holo') return false;
  }
  for (const e of v.extraDeck) {
    if (!e || typeof e !== 'object') return false;
    const ee = e as Record<string, unknown>;
    if (typeof ee.definitionId !== 'string') return false;
    if (ee.finish !== 'normal' && ee.finish !== 'holo') return false;
  }
  return true;
}

export function isGiftReferencePayload(value: unknown): value is GiftReferencePayload {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    v.kind === 'gift_ref'
    && typeof v.giftId === 'string'
    && typeof v.cardDefinitionId === 'string'
    && (v.finish === 'normal' || v.finish === 'holo')
    && typeof v.count === 'number'
    && (v.count as number) >= 1
    && (v.count as number) <= 4
  );
}

// ── Builders ────────────────────────────────────────────────────────────────

export function makeSharedDeckPayload(
  name: string,
  deckList: DeckEntry[],
  extraDeck: ExtraDeckEntry[],
  notes?: string,
): SharedDeckPayload {
  return {
    kind: 'shared_deck',
    version: 1,
    name: name.trim().slice(0, 60),
    deckList: deckList.map(e => ({
      definitionId: e.definitionId,
      copies: e.copies,
      finish: e.finish,
    })),
    extraDeck: extraDeck.map(e => ({
      definitionId: e.definitionId,
      finish: e.finish,
    })),
    notes: notes ? notes.trim().slice(0, 500) : undefined,
  };
}
