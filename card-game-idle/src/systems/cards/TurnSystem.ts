import type { DeckCard, DeckState, TurnState } from '@/types/game';
import { DeckSystem } from './DeckSystem';

const DRAW_COUNT = 5;

export class TurnSystem {
  static beginTurn(deck: DeckState): { deck: DeckState; turn: Partial<TurnState> } {
    // Ensure enough cards to draw
    let state = DeckSystem.ensureCanDraw(deck, DRAW_COUNT);

    const { drawn, remaining } = DeckSystem.draw(state.drawPile, DRAW_COUNT);
    state = { ...state, drawPile: remaining, hand: [...state.hand, ...drawn] };

    return {
      deck: state,
      turn: {
        phase: 'mulligan',
        radiance: 0,
        cardsPlayedThisTurn: 0,
        lastPlayedDefinitionId: null,
        mulliganSelected: [],
        pendingEffect: null,
      },
    };
  }

  static confirmMulligan(deck: DeckState, selected: string[]): DeckState {
    if (selected.length === 0) return deck;

    const toDiscard = deck.hand.filter(c => selected.includes(c.instanceId));
    const kept = deck.hand.filter(c => !selected.includes(c.instanceId));

    let state = { ...deck, hand: kept, discardPile: [...deck.discardPile, ...toDiscard] };
    state = DeckSystem.ensureCanDraw(state, toDiscard.length);
    const { drawn, remaining } = DeckSystem.draw(state.drawPile, toDiscard.length);
    return { ...state, drawPile: remaining, hand: [...state.hand, ...drawn] };
  }

  static endTurn(deck: DeckState): DeckState {
    return {
      ...deck,
      discardPile: [...deck.discardPile, ...deck.hand],
      hand: [],
    };
  }

  static drawCards(deck: DeckState, count: number): DeckState {
    let state = DeckSystem.ensureCanDraw(deck, count);
    const { drawn, remaining } = DeckSystem.draw(state.drawPile, count);
    return { ...state, drawPile: remaining, hand: [...state.hand, ...drawn] };
  }

  static discardFromHand(deck: DeckState, instanceIds: string[]): DeckState {
    const toDiscard = deck.hand.filter(c => instanceIds.includes(c.instanceId));
    const kept = deck.hand.filter(c => !instanceIds.includes(c.instanceId));
    return { ...deck, hand: kept, discardPile: [...deck.discardPile, ...toDiscard] };
  }

  static shuffleDiscard(deck: DeckState): DeckState {
    const combined = DeckSystem.shuffle([...deck.drawPile, ...deck.discardPile]);
    return { ...deck, drawPile: combined, discardPile: [] };
  }

  static peekTop(deck: DeckState, count: number): DeckCard[] {
    return deck.drawPile.slice(0, count);
  }

  static takeFromTop(deck: DeckState, toTake: DeckCard[], remaining: DeckCard[]): DeckState {
    // Move unchosen top cards to bottom; move chosen to hand
    return {
      ...deck,
      drawPile: [...remaining, ...deck.drawPile.slice(toTake.length + remaining.length)],
      hand: [...deck.hand, ...toTake],
    };
  }
}
