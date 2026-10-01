import { describe, expect, it } from 'vitest';
import type { CardDefinition } from '@/types/cards';
import { getUnmetCardRequirement } from '@/systems/cards/PlayRequirements';
import { CardEffectExecutor } from '@/systems/cards/CardEffectExecutor';
import { defaultGameState } from '@/state/store';
import { lightCards } from '@/data/cards/lightCards';
import { darkCards } from '@/data/cards/darkCards';

const turn = { limitlessLightStacks: 0, limitlessCosmosStacks: 0, cardsPlayedThisTurn: 0 };
const card = (instanceId: string, definitionId: string) => ({ instanceId, definitionId, finish: 'normal' as const });

const discardDraw = {
  ...lightCards[0],
  sophPlacementEffects: [{ type: 'discard_draw', discard: 1, draw: 1 }],
} as CardDefinition;

const salvageLight = {
  ...darkCards[0],
  sophEffects: [{ type: 'salvage_by_type', filter: ['Light'] }],
} as CardDefinition;

describe('card play requirements', () => {
  it('blocks a discard card when it is the only card in hand', () => {
    const deck = { hand: [card('self', discardDraw.definitionId)], drawPile: [], discardPile: [] };
    expect(getUnmetCardRequirement(discardDraw, turn, deck, 'self')).toMatch(/discard/);
    expect(CardEffectExecutor.checkPlayable(discardDraw, 1, turn as never, defaultGameState.board, deck, 'self')).toBe(false);
  });

  it('allows a discard card when another card can be discarded', () => {
    const deck = { hand: [card('self', discardDraw.definitionId), card('other', lightCards[1].definitionId)], drawPile: [], discardPile: [] };
    expect(getUnmetCardRequirement(discardDraw, turn, deck, 'self')).toBeNull();
  });

  it('blocks a salvage-by-type card without a matching discard target', () => {
    const empty = { hand: [], drawPile: [], discardPile: [] };
    expect(getUnmetCardRequirement(salvageLight, turn, empty, 'self')).not.toBeNull();
    const withLight = { ...empty, discardPile: [card('d1', lightCards[0].definitionId)] };
    expect(getUnmetCardRequirement(salvageLight, turn, withLight, 'self')).toBeNull();
  });

  it('skips requirements inside unmet conditionals', () => {
    const guarded = {
      ...darkCards[0],
      sophEffects: [{ type: 'conditional', condition: { type: 'cosmos_gte', value: 2 }, then: [{ type: 'consume_cosmos', value: 2 }, { type: 'discard_draw', discard: 2, draw: 5 }] }],
    } as CardDefinition;
    expect(getUnmetCardRequirement(guarded, turn, { hand: [], drawPile: [], discardPile: [] })).toBeNull();
    expect(getUnmetCardRequirement(guarded, { ...turn, limitlessCosmosStacks: 2 }, { hand: [], drawPile: [], discardPile: [] })).toMatch(/discard/);
  });
});
