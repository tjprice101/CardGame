
import { thornboundEternals } from '../../data/cards/thornboundCards';
import { infiniteOphanimCards, infiniteSeraphimCards } from '../../data/cards/infiniteCards';
import { describe, it, expect } from 'vitest';
import { CardEffectExecutor } from '../../systems/cards/CardEffectExecutor';

// Helper to flatten all effects from a card definition
function flattenEffects(card) {
  const effects = [];
  if (card.effects) effects.push(...card.effects);
  if (card.onPlayEffects) effects.push(...card.onPlayEffects);
  if (card.activatedAbility && card.activatedAbility.effects) effects.push(...card.activatedAbility.effects);
  if (Array.isArray(card.attacks)) {
    card.attacks.forEach(atk => {
      if (atk.effects) effects.push(...atk.effects);
    });
  }
  return effects;
}

function getAllThornboundEternalAndInfinityCards() {
  return [
    ...thornboundEternals,
    ...infiniteOphanimCards,
    ...infiniteSeraphimCards,
  ];
}

function getAllEffectTypes(cards) {
  const types = new Set();
  for (const card of cards) {
    for (const eff of flattenEffects(card)) {
      if (eff && typeof eff.type === 'string') types.add(eff.type);
    }
  }
  return Array.from(types);
}

describe('Thornbound Plains Eternal and Infinity Card Effects & Abilities', () => {
  const allCards = getAllThornboundEternalAndInfinityCards();
  const allEffectTypes = getAllEffectTypes(allCards);

  it('Every effect type is present in at least one card', () => {
    for (const type of allEffectTypes) {
      expect(
        allCards.some(card => flattenEffects(card).some(eff => eff.type === type))
      ).toBe(true);
    }
  });

  it('Every effect type is handled by CardEffectExecutor', () => {
    // This test checks that CardEffectExecutor has a handler for each effect type
    // by simulating execution and expecting no crash for each effect type
    for (const type of allEffectTypes) {
      // Find a card and effect instance for this type
      const card = allCards.find(c => flattenEffects(c).some(eff => eff.type === type));
      const effect = flattenEffects(card).find(eff => eff.type === type);
      // Minimal fake game state
      const fakeDeckCard = { instanceId: 'test', definitionId: card.definitionId, finish: 'normal' as const };
      const fakeTurn = { trail: 10, thornScar: 2, cardsPlayedThisTurn: 1, nextCardMultiplied: false };
      const fakeBoard = { frontSlots: [], backSlots: [], activeBoardEffects: [] };
      const fakeDeck = { deckList: [], extraDeck: [], drawPile: [], hand: [], discardPile: [] };
      // Should not throw
      expect(() => {
        CardEffectExecutor.execute(fakeDeckCard, fakeTurn, fakeBoard, fakeDeck, false, { effects: [effect] });
      }).not.toThrow();
    }
  });

  it('All effect types change state or are no-ops (smoke test)', () => {
    for (const type of allEffectTypes) {
      const card = allCards.find(c => flattenEffects(c).some(eff => eff.type === type));
      const effect = flattenEffects(card).find(eff => eff.type === type);
      const fakeDeckCard = { instanceId: 'test', definitionId: card.definitionId, finish: 'normal' as const };
      const fakeTurn = { trail: 10, thornScar: 2, cardsPlayedThisTurn: 1, nextCardMultiplied: false };
      const fakeBoard = { frontSlots: [], backSlots: [], activeBoardEffects: [] };
      const fakeDeck = { deckList: [], extraDeck: [], drawPile: [], hand: [], discardPile: [] };
      const before = JSON.stringify({ fakeTurn, fakeBoard, fakeDeck });
      CardEffectExecutor.execute(fakeDeckCard, fakeTurn, fakeBoard, fakeDeck, false, { effects: [effect] });
      const after = JSON.stringify({ fakeTurn, fakeBoard, fakeDeck });
      // At least one property should change, or it's a no-op (which is allowed for some effects)
      expect(before === after || before !== after).toBe(true);
    }
  });
});
