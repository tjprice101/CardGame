import type { DeckCard, DeckEntry, DeckState } from '@/types/game';
import type { CardFinish } from '@/types/cards';

let deckInstanceCounter = 0;
function nextDeckId(): string {
  return `dk_${++deckInstanceCounter}`;
}

export interface DeckValidationResult {
  valid: boolean;
  totalCards: number;
  errors: string[];
}

export class DeckSystem {
  static addDeckEntry(
    deckList: DeckEntry[],
    definitionId: string,
    finish: CardFinish,
    ownedCopies: number,
    ownedFinishCopies = ownedCopies,
  ): DeckEntry[] {
    const cap = Math.min(4, ownedCopies);
    if (cap <= 0) return deckList;

    const totalCards = deckList.reduce((sum, entry) => sum + entry.copies, 0);
    if (totalCards >= 50) return deckList;

    const totalCopiesForDefinition = deckList
      .filter(entry => entry.definitionId === definitionId)
      .reduce((sum, entry) => sum + entry.copies, 0);
    if (totalCopiesForDefinition >= cap) return deckList;

    const totalCopiesForFinish = deckList
      .filter(entry => entry.definitionId === definitionId && entry.finish === finish)
      .reduce((sum, entry) => sum + entry.copies, 0);
    if (totalCopiesForFinish >= ownedFinishCopies) return deckList;

    const idx = deckList.findIndex(entry => entry.definitionId === definitionId && entry.finish === finish);
    if (idx === -1) return [...deckList, { definitionId, copies: 1, finish }];
    if (deckList[idx].copies >= cap) return deckList;

    const next = [...deckList];
    next[idx] = { ...next[idx], copies: (next[idx].copies + 1) as DeckEntry['copies'] };
    return next;
  }

  static shuffle(cards: DeckCard[]): DeckCard[] {
    const out = [...cards];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  static buildFromList(deckList: DeckEntry[]): DeckCard[] {
    const cards: DeckCard[] = [];
    for (const entry of deckList) {
      for (let i = 0; i < entry.copies; i++) {
        cards.push({ instanceId: nextDeckId(), definitionId: entry.definitionId, finish: entry.finish });
      }
    }
    return DeckSystem.shuffle(cards);
  }

  static draw(drawPile: DeckCard[], count: number): { drawn: DeckCard[]; remaining: DeckCard[] } {
    const actual = Math.min(count, drawPile.length);
    return {
      drawn: drawPile.slice(0, actual),
      remaining: drawPile.slice(actual),
    };
  }

  static reshuffleDiscard(drawPile: DeckCard[], discardPile: DeckCard[]): DeckCard[] {
    return DeckSystem.shuffle([...drawPile, ...discardPile]);
  }

  static ensureCanDraw(state: DeckState, needed: number): DeckState {
    if (state.drawPile.length >= needed) return state;
    if (state.discardPile.length === 0) return state;
    const reshuffled = DeckSystem.reshuffleDiscard(state.drawPile, state.discardPile);
    return { ...state, drawPile: reshuffled, discardPile: [] };
  }

  static validate(deckList: DeckEntry[]): DeckValidationResult {
    const errors: string[] = [];
    let totalCards = 0;
    const seen = new Map<string, number>();

    for (const entry of deckList) {
      totalCards += entry.copies;
      const prev = seen.get(entry.definitionId) ?? 0;
      seen.set(entry.definitionId, prev + entry.copies);
      const cap = 4;
      if (prev + entry.copies > cap) {
        errors.push(`Too many copies of ${entry.definitionId} (max ${cap})`);
      }
    }

    if (totalCards !== 50) {
      errors.push(`Deck must be exactly 50 cards (currently ${totalCards})`);
    }

    return { valid: errors.length === 0, totalCards, errors };
  }

  static countByDefinition(deckList: DeckEntry[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const entry of deckList) {
      map.set(entry.definitionId, entry.copies);
    }
    return map;
  }
}
