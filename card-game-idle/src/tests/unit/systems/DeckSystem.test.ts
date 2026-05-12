import { describe, expect, it } from 'vitest';
import { DeckSystem } from '@/systems/cards/DeckSystem';
import type { DeckEntry } from '@/types/game';

describe('DeckSystem.addDeckEntry', () => {
  it('does not increase a deck beyond 50 cards', () => {
    const baseDeck: DeckEntry[] = Array.from({ length: 13 }, (_, index) => ({
      definitionId: `card_${index}`,
      copies: index === 12 ? 2 : 4,
    }));

    const nextDeck = DeckSystem.addDeckEntry(baseDeck, 'new_card', 4);

    expect(nextDeck.reduce((sum, entry) => sum + entry.copies, 0)).toBe(50);
    expect(nextDeck).toBe(baseDeck);
  });

  it('clamps queued additions at 50 cards using the latest deck state', () => {
    const startingDeck: DeckEntry[] = Array.from({ length: 13 }, (_, index) => ({
      definitionId: `card_${index}`,
      copies: index < 12 ? 4 : 1,
    }));

    const afterFirstAdd = DeckSystem.addDeckEntry(startingDeck, 'extra_a', 4);
    const afterSecondAdd = DeckSystem.addDeckEntry(afterFirstAdd, 'extra_b', 4);

    expect(afterFirstAdd.reduce((sum, entry) => sum + entry.copies, 0)).toBe(50);
    expect(afterSecondAdd.reduce((sum, entry) => sum + entry.copies, 0)).toBe(50);
    expect(afterSecondAdd.some(entry => entry.definitionId === 'extra_b')).toBe(false);
  });
});